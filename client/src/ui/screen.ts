// ui/screen.ts — phase router: join ↔ create ↔ playing. Owns mount/unmount
// lifecycles for the vanilla DOM screens so main.ts only wires boot order.
// FIX 5: the join screen only collects intent (name / invite / DM claim) — the
// session:join is sent ONCE, right here, when the creation wizard hands back a
// finished CharacterDef. Intent is stashed between screens so the wizard join
// carries the same invite code and DM claim the player selected.
import { useGame } from '../game/store';
import { mountJoinScreen } from './joinscreen';
import { mountHud } from './hud';
import { loadCreation } from './createLoader';
import { joinSession } from '../net/client';
import { Bus, EV } from '../engine/bus';

// character class → 3D figure archetype (server builds the real sheet; the
// engine overrides it with sheet.archetype on a successful build — this map is
// the fallback look, so it must cover all 13 classes)
const FIGURE: Record<string, string> = {
  fighter: 'warden', barbarian: 'warden', paladin: 'warden',
  rogue: 'shadowdancer', ranger: 'shadowdancer', monk: 'shadowdancer',
  wizard: 'ashen_mage', sorcerer: 'ashen_mage', warlock: 'ashen_mage', druid: 'ashen_mage',
  cleric: 'pale_priest', bard: 'pale_priest', artificer: 'ashen_mage',
};

export interface ScreenOpts {
  invite: string;
  dmKey?: string;
  headless?: boolean;
}

export function mountScreens(container: HTMLElement, opts: ScreenOpts): () => void {
  if (opts.headless) {
    const bg = document.createElement('div');
    bg.className = 'headless-bg';
    container.appendChild(bg);
  }

  let joinEl: HTMLElement | null = null;
  let createEl: HTMLElement | null = null;
  let hudEl: HTMLElement | null = null;
  let disposeJoin: (() => void) | null = null;
  let disposeHud: (() => void) | null = null;
  let disposed = false;

  // FIX 5 join intent — collected by the join screen, consumed when the wizard
  // finishes. The invite/dm claim survives the wizard hop unchanged.
  const intent: { name: string; invite: string; dm: boolean; dmKey: string } = {
    name: '',
    invite: opts.invite || '',
    dm: !!opts.dmKey,
    dmKey: opts.dmKey || '',
  };
  // session:join rejections that arrive while the CREATE screen is mounted have
  // no join screen to show them (it is unmounted) — stash the message and show
  // it when the router bounces back to 'join' (net/client sets that phase).
  let stashedError: string | null = null;
  const offBus = Bus.on(EV.ERROR, (e) => {
    if (useGame.getState().phase === 'create' && !stashedError) {
      stashedError = (e && (e as { message?: string }).message) || 'The gate refused thee.';
    }
  });

  const phase = useGame.getState().phase;

  const unmountJoin = () => { disposeJoin?.(); disposeJoin = null; joinEl?.remove(); joinEl = null; };
  const unmountHud = () => { disposeHud?.(); disposeHud = null; hudEl?.remove(); hudEl = null; };
  const unmountCreate = () => { createEl?.remove(); createEl = null; };

  const mountJoin = () => {
    if (joinEl) return;
    joinEl = document.createElement('div');
    container.appendChild(joinEl);
    disposeJoin = mountJoinScreen(joinEl, {
      invite: opts.invite,
      dmKey: opts.dmKey,
      name: intent.name,
      error: stashedError || undefined,
      onForge: (i) => {
        intent.name = i.name;
        intent.invite = i.invite;
        intent.dm = i.dm;
        intent.dmKey = i.dmKey;
      },
      onContinue: (character, invite, dm, dmKey) => {
        const cls = String(character.class || 'fighter').toLowerCase();
        joinSession(invite, character.name, FIGURE[cls] || 'warden', {
          character,
          ...(dm ? { dm: true, dmKey } : {}),
        });
      },
    });
    stashedError = null;
  };

  const mountPlaying = () => {
    if (hudEl) return;
    hudEl = document.createElement('div');
    container.appendChild(hudEl);
    disposeHud = mountHud(hudEl);
  };

  let createLoading = false;
  const mountCreate = () => {
    if (createEl || createLoading) return;
    createLoading = true;
    createEl = document.createElement('div');
    container.appendChild(createEl);
    // placeholder while (and if) the creation module loads
    createEl.innerHTML = `
      <div class="screen-join">
        <div class="join-panel ornate screen-create-ph">
          <div class="join-crown"></div>
          <h1 class="join-title" style="font-size:30px">The Forge of Souls</h1>
          <div class="join-sub">shaping a wanderer from ash…</div>
        </div>
      </div>`;
    void loadCreation().then((mod) => {
      if (disposed || !createEl) return;
      if (mod) {
        createEl.innerHTML = '';
        try {
          // T2-e contract: mountCreation(container, { onDone(def), onCancel })
          mod.mount(createEl, {
            invite: intent.invite,
            name: intent.name,
            onDone: (def: any) => {
              saveCharacter(def);
              // the forged character rides into session:join — the server builds
              // the real 5E sheet from it (CharacterEngine) and the transition to
              // 'playing' happens on the next state:sync
              const cls = String(def?.class || 'fighter').toLowerCase();
              joinSession(intent.invite, String(def?.name || intent.name || 'Wanderer'),
                FIGURE[cls] || 'warden', {
                  character: def,
                  ...(intent.dm ? { dm: true, dmKey: intent.dmKey } : {}),
                });
            },
            onCancel: () => useGame.getState().setPhase('join'),
          });
        } catch (e) {
          console.error('[ashenreach] creation mount failed', e);
          renderCreateFallback();
        }

      } else {
        renderCreateFallback();
      }
      createLoading = false;
    });
  };

  const renderCreateFallback = () => {
    if (!createEl) return;
    createEl.innerHTML = `
      <div class="screen-join">
        <div class="join-panel ornate screen-create-ph">
          <div class="join-crown"></div>
          <h1 class="join-title" style="font-size:30px">The Forge of Souls</h1>
          <div class="join-sub">character creation is still being kindled by the smiths.<br/>
            Step in as a plain warden for now — forge properly next time.</div>
          <button type="button" class="join-enter" data-create-enter>Enter the Reach</button>
        </div>
      </div>`;
    createEl.querySelector('[data-create-enter]')?.addEventListener('click', () => {
      // no wizard → M0 fallback join (archetype stats only, no character sheet)
      joinSession(intent.invite, intent.name || 'Wanderer', 'warden',
        intent.dm ? { dm: true, dmKey: intent.dmKey } : {});
    });
  };

  const route = (p: string) => {
    switch (p) {
      case 'connecting':
      case 'join':
        unmountCreate(); unmountHud(); mountJoin();
        break;
      case 'create':
        unmountJoin(); unmountHud(); mountCreate();
        break;
      case 'playing':
        unmountJoin(); unmountCreate(); mountPlaying();
        break;
    }
  };

  route(phase);
  const off = useGame.subscribe((s, prev) => {
    if (s.phase !== prev.phase) route(s.phase);
  });

  return () => {
    disposed = true;
    off();
    offBus();
    unmountJoin(); unmountCreate(); unmountHud();
  };
}

function saveCharacter(def: unknown) {
  if (!def || typeof def !== 'object') return;
  const character = def as { name?: unknown; id?: unknown };
  if (typeof character.name !== 'string' || !character.name.trim()) return;
  if (typeof character.id !== 'string' || !character.id) character.id = crypto.randomUUID();
  const name = character.name.trim();
  try {
    const key = 'ar_characters';
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    const characters = Array.isArray(saved) ? saved : [];
    const existing = characters.filter((entry) =>
      !entry || typeof entry.name !== 'string' || entry.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(key, JSON.stringify([def, ...existing].slice(0, 5)));
  } catch (error) {
    console.warn('[ashenreach] could not save this-device character', error);
  }
}
