// ui/hud.ts — vanilla DOM HUD (ported from app/ui/HUD.tsx + DMBar).
// Subscribes to the store (coarse diffing on identity) and the Bus for
// roll toasts / prompts / fx logging. All icons are inline SVG (sigils.ts).
//
// FIX 7 — zone layout: every region below is anchored to exactly one screen
// zone (top-left / top-center / top-right + dm dock / bottom-left /
// bottom-center / bottom-right / right-middle toasts / center modal) so no
// two HUD regions share real estate. Zone geometry lives in theme.css.
// FIX 9 — VTT UI idioms: keyed party cards, initiative carousel (persistent
// sliding track, active cell centered), springy dice-land roll toasts with
// crit/fumble tiers. Idioms ported from _refs/Custom-VTT (PartyPlayerCard,
// InitiativeBar, DiceRollAnimation/DiceTray) — layout + timing only.
import { useGame } from '../game/store';
import type { PlayerInfo, TokenState, ChatMsg, DoorState } from '../game/store';
import { say, dmCmd, sendAction, endTurn, close as netClose } from '../net/client';
import { Bus, EV } from '../engine/bus';
import { worldProbe } from '../engine/worldProbe';
import { icon, weatherIcon, clockIcon, SIGILS } from './sigils';
import { drawPortrait } from './portrait';
import { playSfx } from '../audio/music';

const CONN_LABEL: Record<string, string> = { online: 'online', reconnecting: 'reconnecting', offline: 'offline' };

export function mountHud(container: HTMLElement): () => void {
  const root = document.createElement('div');
  root.className = 'hud';
  root.innerHTML = `
    <div class="hud-tl">
      <div class="hud-loc ornate">
        <span class="hud-loc-name" data-loc>—</span>
        <span class="hud-loc-meta">
          <span class="hud-meta-bit" data-clock>${icon('moon', 'ic ic-sm')} <span class="clock-val"><b class="clock-time">--:--</b> <small class="clock-phase">· night</small></span></span>
          <span class="hud-meta-bit" data-weather>${icon('sparkle', 'ic ic-sm')} <span>clear</span></span>
        </span>
         <span class="hud-conn" data-conn-badge data-conn="offline" title="Connection status"><span data-conn-label>offline</span><small data-ping>—</small></span>
      </div>
       <section class="hud-party-wrap" data-party-wrap hidden>
         <div class="hud-party-label">COMPANIONS</div>
         <div class="hud-party" data-party></div>
       </section>
    </div>

    <div class="hud-side">
      <section class="hud-mm" data-mm hidden aria-label="World map">
        <div class="hud-mm-head">
          <span class="hud-mm-name" data-mm-name>—</span>
          <span class="hud-mm-coords" data-mm-coords></span>
        </div>
        <canvas class="hud-mm-canvas" data-mm-canvas width="216" height="158"></canvas>
      </section>
      <div class="hud-things" data-things></div>
      <div class="hud-dm" data-dm hidden>
        <button type="button" class="dm-toggle" data-dm-toggle>${icon('crown', 'ic ic-sm')} DM</button>
        <div class="dm-panel ornate" data-dm-panel hidden>
          <div class="dm-row dm-section">world</div>
          <div class="dm-row" data-dm-weather></div>
          <div class="dm-row" data-dm-daynight></div>
          <div class="dm-row dm-section">sky clock</div>
          <div class="dm-row dm-clocknote" data-dm-clocknote></div>
          <div class="dm-row dm-section">blight</div>
          <div class="dm-row">
            <select class="dm-select" data-dm-spawn>
              <option value="skeleton">skeleton</option>
              <option value="zombie">zombie</option>
              <option value="shadow">shadow</option>
              <option value="specter">specter</option>
              <option value="ghoul">ghoul</option>
              <option value="cultist">cultist</option>
            </select>
            <button type="button" data-dm-spawn-near>near party</button>
          </div>
          <div class="dm-row">
            <button type="button" data-dm-combat-start class="dm-combat-btn">start initiative</button>
            <button type="button" data-dm-combat-end class="dm-combat-btn">end combat</button>
          </div>
          <div class="dm-row">
            <select class="dm-select" data-dm-map></select>
            <button type="button" data-dm-map-go>travel</button>
          </div>
          <div class="dm-row dm-section">doors</div>
          <div class="dm-row">
            <select class="dm-select" data-dm-door aria-label="Select door"></select>
            <select class="dm-select" data-dm-door-action aria-label="Door action"></select>
            <button type="button" data-dm-door-apply>apply</button>
          </div>
          <div class="dm-row dm-section">creatures (<span data-dm-count>0</span>)</div>
          <div class="dm-list" data-dm-list></div>
        </div>
      </div>
    </div>

    <section class="hud-self" data-self hidden aria-label="Your character">
      <div class="hud-self-portrait"><canvas class="hud-portrait-canvas" data-portrait width="56" height="56"></canvas></div>
      <div class="hud-selfbar">
        <div class="hud-self-head">
          <div class="hud-identity">
            <span class="hud-name" data-self-name></span>
            <span class="hud-arch" data-self-arch></span>
          </div>
          <span class="hud-ac" title="Armor Class">${icon('shield', 'ic ic-xs')}<b data-ac-v></b><small>AC</small></span>
        </div>
        <div class="hud-vitals">
          <div class="hud-vitals-label"><span>VITALITY</span><span class="hud-hptext" data-hp-text></span></div>
          <div class="hud-hp" data-hp-meter role="progressbar" aria-label="Hit points" aria-valuemin="0" aria-valuenow="0" aria-valuemax="1">
            <div class="hud-hp-fill" data-hp-fill></div>
          </div>
        </div>
        <div class="hud-conditions" data-conditions></div>
      </div>
    </section>

    <div class="hud-chat" data-chat>
      <div class="hud-chat-log" data-chat-log></div>
      <input class="hud-chat-input" data-chat-input maxlength="300" hidden
        placeholder="speak… (Enter to send · Esc to close)" />
      <button type="button" class="hud-chat-open" data-chat-open>${icon('send', 'ic ic-sm')} speak</button>
    </div>

    <div class="hud-interact" data-interact hidden></div>
    <div class="hud-toast" data-move-toast role="status" aria-live="polite" hidden></div>
    <div class="hud-rolls" data-rolls></div>
    <div class="hud-prompt" data-prompt hidden></div>

    <div class="hud-init ornate" data-init hidden></div>
    <div class="hud-turnbar" data-turnbar hidden>
      <div class="turn-banner" data-turn-banner>THY TURN</div>
      <div class="turn-target" data-target-row hidden>
        <label for="combat-target">Target</label>
        <select id="combat-target" data-target-select aria-label="Choose a visible foe">
          <option value="">Choose a foe…</option>
        </select>
        <span data-target-feedback role="status" aria-live="polite">Choose a visible foe.</span>
      </div>
      <div class="turn-actions">
        <button type="button" class="ta-btn" data-act="attack" disabled>${icon('sword', 'ic ic-sm')} <span>Strike</span></button>
        <select class="ta-spell" data-spell-select aria-label="Choose a spell" hidden></select>
        <button type="button" class="ta-btn" data-act="cast" data-cast disabled hidden>${icon('sparkle', 'ic ic-sm')} <span>Cast</span></button>
        <button type="button" class="ta-btn" data-act="dash">${icon('boot', 'ic ic-sm')} <span>Dash</span></button>
        <button type="button" class="ta-btn" data-act="dodge">${icon('shield', 'ic ic-sm')} <span>Dodge</span></button>
        <button type="button" class="ta-btn" data-act="help" hidden>${icon('droplet', 'ic ic-sm')} <span>Help</span></button>
        <button type="button" class="ta-btn ta-end" data-act="end">${icon('hourglass', 'ic ic-sm')} <span>End Turn</span></button>
      </div>
      <div class="ta-features" data-feature-row hidden></div>
      <div class="turn-move" data-move-ft></div>
    </div>

    <div class="hud-hint" data-hint>WASD move · drag orbit · wheel zoom · ↵ chat</div>
  `;
  container.appendChild(root);

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;

  // ── element refs ──
  const locEl = $('[data-loc]');
  const clockEl = $('[data-clock]');
  const weatherEl = $('[data-weather]');
  const connEl = $<HTMLElement>('[data-conn-badge]');
  const connLabelEl = $('[data-conn-label]');
  const pingEl = $('[data-ping]');
  const partyEl = $('[data-party]');
  const partyWrapEl = $<HTMLElement>('[data-party-wrap]');
  const thingsEl = $('[data-things]');
  const selfEl = $<HTMLElement>('[data-self]');
  const portraitEl = $<HTMLCanvasElement>('[data-portrait]');
  const selfNameEl = $('[data-self-name]');
  const selfArchEl = $('[data-self-arch]');
  const hpMeterEl = $<HTMLElement>('[data-hp-meter]');
  const hpFillEl = $<HTMLElement>('[data-hp-fill]');
  const hpTextEl = $('[data-hp-text]');
  const acEl = $('[data-ac-v]');
  const condEl = $('[data-conditions]');
  const chatLogEl = $('[data-chat-log]');
  const chatInputEl = $<HTMLInputElement>('[data-chat-input]');
  const chatOpenBtn = $<HTMLButtonElement>('[data-chat-open]');
  const interactEl = $<HTMLElement>('[data-interact]');
  const rollsEl = $('[data-rolls]');
  const promptEl = $<HTMLElement>('[data-prompt]');
  const dmEl = $<HTMLElement>('[data-dm]');
  const dmToggleBtn = $<HTMLButtonElement>('[data-dm-toggle]');
  const dmPanelEl = $<HTMLElement>('[data-dm-panel]');
  const dmWeatherRow = $('[data-dm-weather]');
  const dmDayRow = $('[data-dm-daynight]');
  const dmClockNote = $('[data-dm-clocknote]');
  const dmSpawnSel = $<HTMLSelectElement>('[data-dm-spawn]');
  const dmSpawnNear = $('[data-dm-spawn-near]');
  const dmMapSel = $<HTMLSelectElement>('[data-dm-map]');
  const dmMapGo = $('[data-dm-map-go]');
  const dmDoorSel = $<HTMLSelectElement>('[data-dm-door]');
  const dmDoorActionSel = $<HTMLSelectElement>('[data-dm-door-action]');
  const dmDoorApply = $<HTMLButtonElement>('[data-dm-door-apply]');
  const dmListEl = $('[data-dm-list]');
  const dmCountEl = $('[data-dm-count]');
  const hintEl = $('[data-hint]');
  const initEl = $<HTMLElement>('[data-init]');
  const turnbarEl = $<HTMLElement>('[data-turnbar]');
  const turnBannerEl = $('[data-turn-banner]');
  const targetRowEl = $<HTMLElement>('[data-target-row]');
  const targetSelectEl = $<HTMLSelectElement>('[data-target-select]');
  const targetFeedbackEl = $('[data-target-feedback]');
  const moveFtEl = $('[data-move-ft]');
  const spellSelectEl = $<HTMLSelectElement>('[data-spell-select]');
  const castBtn = $<HTMLButtonElement>('[data-cast]');
  const featureRowEl = $<HTMLElement>('[data-feature-row]');
  const moveToastEl = $<HTMLElement>('[data-move-toast]');
  const mmEl = $<HTMLElement>('[data-mm]');
  const mmCanvas = $<HTMLCanvasElement>('[data-mm-canvas]');
  const mmNameEl = $('[data-mm-name]');
  const mmCoordsEl = $('[data-mm-coords]');

  // local (client-only) chat lines: system errors / fx narration merged by time
  let extraChat: ChatMsg[] = [];
  let lastChatRendered = -1;       // t of last server msg already rendered
  let portraitKey = '';

  // ── helpers ──
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const displayName = (s: string) => s.trim().toLowerCase().replace(/(^|[\s'-])([a-z])/g,
    (_match, gap: string, letter: string) => gap + letter.toUpperCase());

  function fmtClock(min: number): { time: string; phase: string } {
    const m = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60), mm = String(Math.floor(m % 60)).padStart(2, '0');
    const phase = h < 5 ? 'deep night' : h < 7 ? 'dawn' : h < 11 ? 'morning'
      : h < 14 ? 'noon' : h < 17 ? 'afternoon' : h < 19 ? 'dusk' : h < 22 ? 'evening' : 'night';
    return { time: `${String(h).padStart(2, '0')}:${mm}`, phase };
  }

  // ── render pieces ──
  function renderConnection(c: string) {
    connEl.dataset.conn = c;
    connLabelEl.textContent = CONN_LABEL[c] || c;
  }

  function renderPing(pingMs: number | null) {
    pingEl.textContent = pingMs == null ? '—' : `${pingMs} ms`;
    pingEl.dataset.quality = pingMs == null ? 'unknown' : pingMs < 100 ? 'good' : pingMs < 220 ? 'fair' : 'poor';
  }

  function renderLoc(mapName: string, dayTime: number, weather: string) {
    locEl.textContent = mapName || '—';
    const { time, phase } = fmtClock(dayTime);
    clockEl.innerHTML = `${clockIcon(dayTime)} <span>${time} · ${phase}</span>`;
    weatherEl.innerHTML = `${weatherIcon(weather)} <span>${weather}</span>`;
    const dn = fmtClock(dayTime);
    dmClockNote.textContent = `${dn.time} — ${dn.phase}`;
  }

  function tokenFor(p: PlayerInfo, tokens: TokenState[]): TokenState | undefined {
    return tokens.find((t) => t.kind === 'player' && t.ownerId === p.id);
  }

  // ── FIX 9 — party cards (VTT PartyPlayerCard idiom, vanilla DOM) ─────────
  // Cards are tall plates: sigil portrait, HP bar with numeric overlay, AC
  // shield badge, condition chips; hover expands a passive-score drawer.
  // Cards are KEYED per player and rebuilt only when their content changes,
  // so hover state + portrait canvases survive the constant token patches
  // (position ticks) that fire renderParty.
  const partyCards = new Map<string, { el: HTMLElement; key: string }>();

  function buildPartyCard(p: PlayerInfo, t: TokenState | undefined): HTMLElement {
    const el = document.createElement('div');
    const name = displayName(p.name);
    const hp = t ? Math.max(0, t.hp) : 0;
    const hpMax = t ? Math.max(1, t.hpMax) : 1;
    const pct = t ? Math.max(0, Math.min(100, (t.hp / t.hpMax) * 100)) : 100;
    const band = pct > 60 ? 'high' : pct > 30 ? 'mid' : 'low';
    const ac = t ? t.ac : '—';
    const spd = t ? t.speedFt : 30;
    const conds: string[] = (t?.conditions || []) as string[];
    const sheet = (t as any)?.sheet;
    const pass = sheet?.passive as { perception?: number } | undefined;
    const iniVal = t?.initiative;
    const ds = t?.deathSaves;
    // tokenless players (the DM walks the reach without a body): identity
    // card only — no HP bar, no badge, no stat blocks
    const sub = t ? (SIGILS[t.archetype] || SIGILS.warden).title
      : (p.role === 'dm' ? 'dungeon master' : 'wanderer');
    const dsChip = ds && !ds.stable && !ds.dead && (ds.ok > 0 || ds.fail > 0)
      ? `<span class="cond-chip death">${icon('droplet', 'ic ic-xs')} ${ds.ok}·${ds.fail}</span>` : '';
    el.className = `pcard${p.online ? '' : ' offline'}`;
    el.style.setProperty('--pc', p.color || '#c9a227');
    el.dataset.online = String(!!p.online);
    el.innerHTML = `
      <div class="pcard-face">
        ${t ? '<canvas class="pcard-canvas" width="44" height="44"></canvas>' : icon('crown', 'ic')}
      </div>
      <div class="pcard-main">
        <div class="pcard-namerow">
          <span class="pcard-name" title="${esc(name)}">${esc(name)}</span>
          ${p.role === 'dm' ? icon('crown', 'ic ic-crown-inline') : ''}
          <span class="pcard-dot"></span>
        </div>
        <div class="pcard-sub">${esc(sub)}</div>
        ${t ? `
        <div class="pcard-hpbar" data-band="${band}"><i style="width:${pct}%"></i><b>${hp} <em>/ ${hpMax}</em></b></div>
        ${conds.length || dsChip ? `<div class="pcard-chips">${conds.slice(0, 3).map((c) => `<span class="cond-chip">${esc(c)}</span>`).join('')}${conds.length > 3 ? `<span class="cond-chip">+${conds.length - 3}</span>` : ''}${dsChip}</div>` : ''}
        <div class="pcard-detail">
          <span class="pd-stat"><b>${ac}</b>AC</span>
          <span class="pd-stat"><b>${spd}</b>SPD</span>
          ${iniVal != null ? `<span class="pd-stat"><b>${iniVal >= 0 ? '+' : ''}${iniVal}</b>INIT</span>` : ''}
          ${pass?.perception != null ? `<span class="pd-stat"><b>${pass.perception}</b>PASS·PER</span>` : ''}
          <span class="pd-state">${p.online ? 'bound to the reach' : 'gone dark'}</span>
        </div>` : `
        <div class="pcard-detail">
          <span class="pd-state">${p.online ? 'walks the reach unseen' : 'gone dark'}</span>
        </div>`}
      </div>
      ${t ? `<span class="pcard-ac" title="Armor Class" aria-label="Armor Class ${ac}">${icon('shield', 'ic ic-xs')}<b>${ac}</b><small>AC</small></span>` : ''}`;
    const cv = el.querySelector('canvas');
    if (cv && t) drawPortrait(cv, { archetype: t.archetype, color: p.color || '#c9a227', name: p.name, size: 44 });
    return el;
  }

  function renderParty(players: PlayerInfo[], tokens: TokenState[]) {
    const unique = new Map<string, PlayerInfo>();
    for (const p of players) {
      const previous = unique.get(p.id);
      if (!previous || (!previous.online && p.online)) unique.set(p.id, p);
    }
    const state = useGame.getState();
    const ordered = [...unique.values()]
      .filter((p) => p.id !== state.me?.id && tokenFor(p, tokens)?.id !== state.myTokenId)
      .sort((a, b) => Number(b.online) - Number(a.online));
    partyWrapEl.hidden = ordered.length === 0;
    const live: HTMLElement[] = [];
    const seen = new Set<string>();
    for (const p of ordered) {
      seen.add(p.id);
      const t = tokenFor(p, tokens);
      const conds: string[] = (t?.conditions || []) as string[];
      const pass = (t as any)?.sheet?.passive as { perception?: number } | undefined;
      const ds = t?.deathSaves;
      // NOTE: hp/hpMax are deliberately NOT in the key — damage patches the
      // bar in place below so its width transition animates instead of
      // rebuilding the card (and re-inking the portrait) on every hit.
      const key = [p.name, p.role, p.online, p.color, t?.archetype ?? '',
        t?.hpMax ?? '', t?.ac ?? '', t?.speedFt ?? '', t?.initiative ?? '', conds.join(','),
        ds ? `${ds.ok}/${ds.fail}/${Number(ds.stable)}` : '', pass?.perception ?? '',
        t?.id === useGame.getState().myTokenId ? '1' : ''].join('|');
      let entry = partyCards.get(p.id);
      if (!entry || entry.key !== key) {
        entry = { el: buildPartyCard(p, t), key };
        partyCards.set(p.id, entry);
      }
      if (t) {
        const bar = entry.el.querySelector<HTMLElement>('.pcard-hpbar');
        const fill = entry.el.querySelector<HTMLElement>('.pcard-hpbar i');
        const num = entry.el.querySelector('.pcard-hpbar b');
        const pct = Math.max(0, Math.min(100, (t.hp / t.hpMax) * 100));
        if (bar) bar.dataset.band = pct > 60 ? 'high' : pct > 30 ? 'mid' : 'low';
        if (fill) fill.style.width = pct + '%';
        if (num) num.innerHTML = `${Math.max(0, t.hp)} <em>/ ${Math.max(1, t.hpMax)}</em>`;
      }
      live.push(entry.el);
    }
    for (const id of [...partyCards.keys()]) {
      if (!seen.has(id)) { partyCards.get(id)!.el.remove(); partyCards.delete(id); }
    }
    // reorder only when the sort actually changed (keeps :hover intact)
    const have = Array.from(partyEl.children) as HTMLElement[];
    if (have.length !== live.length || live.some((el, i) => el !== have[i])) {
      for (const el of live) partyEl.appendChild(el);
    }
  }

  function renderThings(tokens: TokenState[], role?: string) {
    thingsEl.hidden = role !== 'dm';
    const mons = tokens.filter((t) => t.kind === 'monster' && !t.hidden);
    const shown = mons.slice(0, 6);
    thingsEl.innerHTML = shown.map((m) => {
      const dead = m.hp <= 0;
      return `
      <div class="hud-monster${dead ? ' dead' : ''}">
        <span class="mname">${esc(m.name)}</span>
        <span class="mhp">${Math.max(0, m.hp)}/${m.hpMax}</span>
      </div>`;
    }).join('') + (mons.length > 6 ? `<div class="hud-monster more">+${mons.length - 6} more</div>` : '');
    dmCountEl.textContent = String(mons.length);
    dmListEl.innerHTML = mons.map((m) => `
      <div class="dm-list-row">
        <span>${esc(m.name)}</span>
        <span>${m.hp}/${m.hpMax}</span>
        <button type="button" class="dm-x" data-rm="${m.id}" title="unmake">${icon('x', 'ic ic-xs')}</button>
      </div>`).join('');
  }

  function renderSelf(s: ReturnType<typeof useGame.getState>) {
    const me = s.me;
    const t = s.tokens.find((x) => x.id === s.myTokenId);
    if (!me || !t) { selfEl.hidden = true; return; }
    selfEl.hidden = false;
    selfEl.style.setProperty('--pc', me.color || '#c9a227');
    selfNameEl.textContent = displayName(t.name);
    selfArchEl.textContent = (SIGILS[t.archetype] || SIGILS.warden).title;
    const hpMax = Math.max(1, t.hpMax);
    const hp = Math.max(0, Math.min(hpMax, t.hp));
    const pct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
    hpFillEl.style.width = pct + '%';
    hpFillEl.dataset.band = pct > 60 ? 'high' : pct > 30 ? 'mid' : 'low';
    hpTextEl.textContent = `${hp} / ${hpMax}`;
    hpMeterEl.setAttribute('aria-valuenow', String(hp));
    hpMeterEl.setAttribute('aria-valuemax', String(hpMax));
    acEl.textContent = String(t.ac);
    const conditions = (t.conditions || []) as string[];
    const shownConditions = conditions.slice(0, 3);
    condEl.innerHTML = shownConditions.map((c) => `<span class="cond-chip">${esc(c)}</span>`).join('')
      + (conditions.length > shownConditions.length ? `<span class="cond-chip cond-more">+${conditions.length - shownConditions.length}</span>` : '')
      + (t.deathSaves && !t.deathSaves.stable && !t.deathSaves.dead && (t.deathSaves.fail > 0 || t.deathSaves.ok > 0)
        ? `<span class="cond-chip death">${icon('droplet', 'ic ic-xs')} saves ${t.deathSaves.ok}<b>·</b>${t.deathSaves.fail}</span>` : '');
    const key = `${t.archetype}|${me.color}|${t.name}`;
    if (key !== portraitKey) {
      portraitKey = key;
      drawPortrait(portraitEl, { archetype: t.archetype, color: me.color || '#c9a227', name: t.name, size: 64 });
    }
  }

  function renderChat(chat: ChatMsg[]) {
    // merge server chat with local system lines, newest last, show last 9
    const merged = [...chat, ...extraChat].sort((a, b) => a.t - b.t).slice(-9);
    chatLogEl.innerHTML = merged.map((c) => {
      if (!c.from) return `<div class="hud-chat-line sys">${esc(c.text)}</div>`;
      return `<div class="hud-chat-line"><span style="color:${c.color || '#b8952f'}">${esc(c.from)}:</span> ${esc(c.text)}</div>`;
    }).join('');
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function renderInteract(label: string | null) {
    if (!label) { interactEl.hidden = true; return; }
    interactEl.hidden = false;
    interactEl.innerHTML = `${esc(label)} <span class="key">E</span>`;
  }

  function renderDmDoors(doors: DoorState[]) {
    const previous = dmDoorSel.value;
    dmDoorSel.replaceChildren(...doors.map((door) => {
      const option = document.createElement('option');
      option.value = String(door.wallIndex);
      const place = Number.isFinite(door.x1) && Number.isFinite(door.z1)
        ? ` · ${door.x1},${door.z1}` : '';
      const kind = door.secret ? 'secret ' : '';
      const state = door.locked ? 'locked' : door.open ? 'open' : 'closed';
      option.textContent = `${kind}door ${door.wallIndex + 1}${place} · ${state}`;
      return option;
    }));
    if (doors.some((door) => String(door.wallIndex) === previous)) dmDoorSel.value = previous;
    dmDoorSel.disabled = doors.length === 0;
    dmDoorApply.disabled = doors.length === 0;
    const selected = doors.find((door) => String(door.wallIndex) === dmDoorSel.value);
    const actions = selected
      ? ['open', 'close', 'lock', 'unlock', ...(selected.secret ? ['reveal', 'conceal'] : [])]
      : [];
    const oldAction = dmDoorActionSel.value;
    dmDoorActionSel.replaceChildren(...actions.map((action) => {
      const option = document.createElement('option');
      option.value = action;
      option.textContent = action;
      return option;
    }));
    if (actions.includes(oldAction)) dmDoorActionSel.value = oldAction;
    dmDoorActionSel.disabled = actions.length === 0;
  }

  function renderDm(role: string | undefined) {
    const isDM = role === 'dm';
    dmEl.hidden = !isDM;
    hintEl.innerHTML = isDM
      ? `WASD move · E interact · drag orbit · wheel zoom · ↵ chat · ${icon('crown', 'ic ic-xs')} DM tools`
      : 'WASD move · E interact · drag orbit · wheel zoom · ↵ chat';
  }

  // ── combat: initiative carousel + turn bar ────────────────────────────────
  // FIX 9 — the strip is a carousel (VTT InitiativeBar idiom): the shell
  // (round chip + clipping window + sliding track) is built ONCE per combat
  // and the track DOM persists across renders, so a turn change animates the
  // active cell sliding to center instead of teleport-rewriting the strip.
  let initWindowEl: HTMLElement | null = null;
  let initTrackEl: HTMLElement | null = null;
  const iniCells = new Map<string, HTMLElement>();
  let iniOrderKey: string | null = null;   // null → shell needs (re)building
  let iniCurIdx = 0;
  let selectedTargetId = '';
  let targetOptionsKey = '';
  let spellOptionsKey = '';
  let featureKeyLast = '';

  function updateTargetSelection(s: ReturnType<typeof useGame.getState>, me: TokenState | undefined) {
    const combatIds = new Set((s.initiative as { order?: string[] } | null)?.order || []);
    const foes = s.tokens.filter((token) => token.kind === 'monster' && !token.hidden &&
      token.hp > 0 && !token.deathSaves?.dead && combatIds.has(token.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    const optionsKey = JSON.stringify(foes.map((foe) => [foe.id, foe.name]));
    if (optionsKey !== targetOptionsKey) {
      targetOptionsKey = optionsKey;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = foes.length ? 'Choose a foe…' : 'No visible foes';
      targetSelectEl.replaceChildren(placeholder);
      for (const foe of foes) {
        const option = document.createElement('option');
        option.value = foe.id;
        option.textContent = foe.name;
        targetSelectEl.appendChild(option);
      }
      if (!foes.some((foe) => foe.id === selectedTargetId)) selectedTargetId = '';
      targetSelectEl.value = selectedTargetId;
    }

    const target = foes.find((foe) => foe.id === selectedTargetId);
    const actionUsed = !!me?.actionUsed;
    const distance = target && me ? Math.round(Math.hypot(target.x - me.x, target.z - me.z)) : null;
    targetFeedbackEl.textContent = target && distance != null
      ? `${target.name} · ${target.hp}/${target.hpMax} HP · ${distance} ft`
      : foes.length ? 'Choose a visible foe.' : 'No visible foes to target.';
    for (const button of turnbarEl.querySelectorAll<HTMLButtonElement>('.ta-btn')) {
      if (button.dataset.featureId) continue;   // feature buttons gate themselves
      const needsTarget = button.dataset.act === 'attack' || button.dataset.act === 'cast';
      if (button.dataset.act !== 'end') button.disabled = actionUsed || (needsTarget && !target);
    }
    return target;
  }

  function centerInitiative(immediate: boolean) {
    if (!initWindowEl || !initTrackEl) return;
    const cell = initTrackEl.children[iniCurIdx] as HTMLElement | undefined;
    const win = initWindowEl.clientWidth;
    if (!cell || cell.hidden || win <= 0) return;
    const trackW = initTrackEl.scrollWidth;
    let tx: number;
    if (trackW + 28 <= win) {
      // few combatants: everyone fits — center the whole track
      tx = Math.round((win - trackW) / 2);
    } else {
      // slide so the active cell sits center-stage (soft-clamped at the ends)
      const center = cell.offsetLeft + cell.offsetWidth / 2;
      tx = Math.round(Math.max(win - 14 - trackW, Math.min(14, win / 2 - center)));
    }
    if (immediate) {
      initTrackEl.style.transition = 'none';
      initTrackEl.style.transform = `translateX(${tx}px)`;
      void initTrackEl.offsetWidth;          // commit the jump before re-arming
      initTrackEl.style.transition = '';
    } else {
      initTrackEl.style.transform = `translateX(${tx}px)`;
    }
  }

  function renderInitiative(s: ReturnType<typeof useGame.getState>) {
    const ini: any = s.initiative;
    const helpBtn = turnbarEl.querySelector<HTMLButtonElement>('[data-act="help"]')!;
    turnbarEl.querySelectorAll<HTMLButtonElement>('.ta-btn').forEach((button) => {
      button.hidden = button.dataset.act === 'cantrip';
    });
    if (!ini || !Array.isArray(ini.order) || ini.order.length === 0) {
      initEl.hidden = true;
      targetRowEl.hidden = true;
      selectedTargetId = '';
      targetSelectEl.value = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Choose a foe…';
      targetSelectEl.replaceChildren(placeholder);
      targetOptionsKey = '\0';
      turnbarEl.querySelectorAll<HTMLButtonElement>('.ta-btn').forEach((button) => {
        button.disabled = false;
      });
      const me = s.tokens.find((token) => token.id === s.myTokenId);
      const hasDownedAlly = !!me && s.tokens.some((token) => token.kind === 'player' &&
        token.id !== me.id && token.hp <= 0 && !token.deathSaves?.dead &&
        s.players.some((player) => player.id === token.ownerId && player.online));
      turnbarEl.hidden = !hasDownedAlly;
      if (hasDownedAlly) {
        turnbarEl.querySelectorAll<HTMLButtonElement>('.ta-btn').forEach((button) => {
          button.hidden = button.dataset.act !== 'help';
        });
        turnBannerEl.textContent = 'A COMPANION IS DOWN';
        helpBtn.hidden = false;
        moveFtEl.textContent = 'Approach them to help';
      }
      initWindowEl = initTrackEl = null;
      iniOrderKey = null;
      iniCells.clear();
      return;
    }
    initEl.hidden = false;
    const order: string[] = ini.order.map((id: unknown) => String(id));
    const rawIdx = Number(ini.turnIdx);
    const cur = rawIdx >= 0 && rawIdx < order.length ? order[rawIdx] : '';
    iniCurIdx = rawIdx >= 0 && rawIdx < order.length ? rawIdx : -1;
    const byId = new Map(s.tokens.map((t) => [t.id, t] as const));

    const orderKey = order.join(',');
    const rebuilt = orderKey !== iniOrderKey;
    if (rebuilt) {
      iniOrderKey = orderKey;
      initEl.innerHTML = `
        <div class="ini-turn" data-ini-turn></div>
        <div class="ini-round"><span class="ini-round-cap">round</span><b data-round>${ini.round ?? 1}</b></div>
        <div class="ini-window"><div class="ini-track"></div></div>`;
      initWindowEl = initEl.querySelector('.ini-window') as HTMLElement;
      initTrackEl = initEl.querySelector('.ini-track') as HTMLElement;
      iniCells.clear();
      for (const id of order) {
        const cell = document.createElement('div');
        cell.className = 'ini-cell';
        cell.dataset.id = id;
        initTrackEl!.appendChild(cell);
        iniCells.set(id, cell);
      }
    } else {
      const roundEl = initEl.querySelector('[data-round]');
      if (roundEl) roundEl.textContent = String(ini.round ?? 1);
    }
    const active = byId.get(cur);
    const turnEl = initEl.querySelector<HTMLElement>('[data-ini-turn]');
    if (turnEl) {
      turnEl.textContent = !cur ? 'TURN IN PROGRESS'
        : cur === s.myTokenId ? 'YOUR TURN'
        : active?.kind === 'monster' ? `ENEMY TURN · ${active.name}`
        : `WAITING FOR · ${active?.name || 'next turn'}`;
      turnEl.dataset.turn = !cur ? 'party' : cur === s.myTokenId ? 'you' : active?.kind === 'monster' ? 'enemy' : 'party';
    }

    // in-place cell refresh — hp / now / down / mine stay in step with tokens.
    // Structure (badge/skull/name) rebuilds only when it changes so the HP
    // strip's height transition survives the constant movement patches.
    for (let i = 0; i < order.length; i++) {
      const cell = iniCells.get(order[i]);
      if (!cell) continue;
      const t = byId.get(order[i]);
      if (!t) { cell.hidden = true; continue; }
      cell.hidden = false;
      const dead = t.hp <= 0 || (t as any).deathSaves?.dead;
      const pct = Math.max(0, Math.min(100, (t.hp / t.hpMax) * 100));
      cell.className = `ini-cell${order[i] === cur ? ' now' : ''}${dead ? ' down' : ''}${t.id === s.myTokenId ? ' mine' : ''} k-${t.kind}`;
      cell.title = t.name;
      const structKey = `${t.name}|${t.initiative ?? ''}|${dead ? 'd' : ''}`;
      if (cell.dataset.sk !== structKey) {
        cell.dataset.sk = structKey;
        cell.innerHTML = `
          <span class="ini-hpstrip"><i style="height:${pct}%"></i></span>
          ${t.initiative != null ? `<span class="ini-badge">${esc(String(t.initiative))}</span>` : ''}
          <span class="ini-name">${esc(t.name)}</span>
          <span class="ini-hp">${Math.max(0, t.hp)}/${t.hpMax}</span>
          ${dead ? `<span class="ini-skull">${icon('skull', 'ic')}</span>` : ''}`;
      } else {
        const hpEl = cell.querySelector('.ini-hp');
        if (hpEl) hpEl.textContent = `${Math.max(0, t.hp)}/${t.hpMax}`;
        const strip = cell.querySelector<HTMLElement>('.ini-hpstrip i');
        if (strip) strip.style.height = pct + '%';
      }
    }
    centerInitiative(rebuilt);

    // turn bar: only when it is my turn (prompt 'turn' pre-arms it)
    const myTurn = cur === s.myTokenId;
    if (!myTurn) { turnbarEl.hidden = true; return; }
    turnbarEl.hidden = false;
    targetRowEl.hidden = false;
    const me = byId.get(String(s.myTokenId));
    const downedAlly = s.tokens.some((token) => token.kind === 'player' && token.id !== me?.id &&
      token.hp <= 0 && !token.deathSaves?.dead &&
      s.players.some((player) => player.id === token.ownerId && player.online));
    helpBtn.hidden = !downedAlly;
    const mv = ini.movement;
    const usedFt = (mv && mv.tokenId === cur) ? (mv.usedFt || 0) : 0;
    const speed = me?.speedFt ?? 30;
    const movementLimit = (mv && mv.tokenId === cur && Number.isFinite(mv.maxFt))
      ? mv.maxFt : speed;
    moveFtEl.textContent = `${Math.max(0, movementLimit - usedFt)}/${movementLimit} ft movement · ${me?.actionUsed ? 'action spent' : 'action ready'} · ${Math.max(0, me?.hp ?? 0)} hp`;
    // cantrip button if the server sheet has one
    const sheet = (me as any)?.sheet;
    // resource pips (mechanics overlay): Rage 2/2 · Second Wind 1/1 …
    const res = sheet?.resources || {};
    const pipText = Object.values(res as Record<string, { label?: string; cur: number; max: number }>)
      .filter((p) => p && typeof p.cur === 'number' && p.max > 0)
      .map((p) => `${p.label || '?'} ${p.cur}/${p.max}`)
      .join(' · ');
    if (pipText) moveFtEl.textContent += ` · ${pipText}`;

    // ── spell selector: every known spell, with slot counts ──
    const sc = sheet?.spellcasting;
    const spellList: string[] = Array.isArray(sc?.spells) ? sc.spells.map(String) : [];
    if (spellList.length) {
      const spellKey = spellList.join('|') + '#' + JSON.stringify(sc.slots || {});
      if (spellKey !== spellOptionsKey) {
        spellOptionsKey = spellKey;
        spellSelectEl.replaceChildren();
        const slotText = (lvl: number): string => {
          const b = (sc.slots as Record<string, { total: number; used: number }> | undefined)?.[String(lvl)];
          if (!b) return '';
          return ` (${b.total - b.used}/${b.total})`;
        };
        const levelOf = (name: string): number => {
          const map = sc.spellsByLevel as Record<string, string[]> | undefined;
          if (!map) return 0;
          for (const [lvl, names] of Object.entries(map)) {
            if ((names as string[]).includes(name)) return Number(lvl);
          }
          return 0;
        };
        const groups = new Map<number, string[]>();
        for (const sp of spellList) {
          const lvl = levelOf(sp);
          if (!groups.has(lvl)) groups.set(lvl, []);
          groups.get(lvl)!.push(sp);
        }
        for (const lvl of [...groups.keys()].sort((a, b) => a - b)) {
          const cap = document.createElement('option');
          cap.value = '';
          cap.disabled = true;
          cap.textContent = lvl === 0 ? 'Cantrips' : `${lvl}${lvl === 1 ? 'st' : lvl === 2 ? 'nd' : lvl === 3 ? 'rd' : 'th'} level${slotText(lvl)}`;
          spellSelectEl.appendChild(cap);
          for (const sp of groups.get(lvl)!) {
            const opt = document.createElement('option');
            opt.value = sp;
            opt.textContent = `${sp}${lvl > 0 && slotText(lvl) === '' ? ' — no slots' : ''}`;
            spellSelectEl.appendChild(opt);
          }
        }
        spellSelectEl.selectedIndex = -1;
      }
      spellSelectEl.hidden = false;
      castBtn.hidden = false;
    } else {
      spellSelectEl.hidden = true;
      castBtn.hidden = true;
    }

    // ── feature buttons (mechanics overlay manifest) ──
    const actions: Array<{ id: string; name: string; activation: string; resource?: string | null; resourceLabel?: string | null; summary?: string }> =
      Array.isArray(sheet?.actions) ? sheet.actions : [];
    const featureKey = JSON.stringify(actions) + '#' + me?.actionUsed + me?.bonusUsed + JSON.stringify(res);
    if (featureKey !== featureKeyLast) {
      featureKeyLast = featureKey;
      featureRowEl.replaceChildren();
      for (const fa of actions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ta-btn ta-feature';
        btn.dataset.featureId = fa.id;
        btn.dataset.activation = fa.activation;
        btn.dataset.resource = fa.resource || '';
        const tag = fa.activation === 'bonus' ? ' bonus' : fa.activation === 'free' ? ' free' : fa.activation === 'reaction' ? ' reaction' : '';
        const resLabel = fa.resource && (res as Record<string, { label?: string; cur: number; max: number } | undefined>)[fa.resource]
          ? ` ${String((res as Record<string, { cur: number; max: number }>)[fa.resource].cur)}/${String((res as Record<string, { cur: number; max: number }>)[fa.resource].max)}`
          : '';
        btn.innerHTML = `${icon('sparkle', 'ic ic-sm')} <span>${fa.name}${tag}${resLabel}</span>`;
        btn.title = fa.summary || fa.name;
        featureRowEl.appendChild(btn);
      }
      featureRowEl.hidden = actions.length === 0;
    }
    // per-render enable/disable of feature buttons by economy + pools
    for (const btn of featureRowEl.querySelectorAll<HTMLButtonElement>('.ta-feature')) {
      const act = btn.dataset.activation;
      const poolId = btn.dataset.resource;
      const pool = poolId ? (res as Record<string, { cur: number }> | undefined)?.[poolId] : null;
      const spent = pool ? pool.cur < 1 : false;
      btn.disabled = spent ||
        (act === 'action' && !!me?.actionUsed) ||
        (act === 'bonus' && !!me?.bonusUsed);
    }
    updateTargetSelection(s, me);
  }

  // ── store subscription (identity-diffed) ──
  let last = useGame.getState();
  const render = (s: typeof last) => {
    if (s.connection !== last.connection) renderConnection(s.connection);
    if (s.pingMs !== last.pingMs) renderPing(s.pingMs);
    if (s.mapName !== last.mapName || s.dayTime !== last.dayTime || s.weather !== last.weather) {
      renderLoc(s.mapName, s.dayTime, s.weather);
    }
    if (s.players !== last.players || s.tokens !== last.tokens) renderParty(s.players, s.tokens);
    if (s.tokens !== last.tokens || s.me?.role !== last.me?.role) renderThings(s.tokens, s.me?.role);
    if (s.tokens !== last.tokens || s.me !== last.me || s.myTokenId !== last.myTokenId) renderSelf(s);
    if (s.chat !== last.chat) {
      const newest = s.chat.length ? s.chat[s.chat.length - 1].t : -1;
      if (newest !== lastChatRendered) { lastChatRendered = newest; renderChat(s.chat); }
    }
    if (s.interactLabel !== last.interactLabel) renderInteract(s.interactLabel);
    if (s.me?.role !== last.me?.role) renderDm(s.me?.role);
    if (s.doors !== last.doors) renderDmDoors(s.doors);
    if (s.initiative !== last.initiative || s.tokens !== last.tokens || s.myTokenId !== last.myTokenId) {
      renderInitiative(s);
    }
    last = s;
  };
  const offStore = useGame.subscribe((s, prev) => { last = prev; render(s); });

  // initial paint (force every section to diff dirty)
  const s0 = useGame.getState();
  last = {
    ...s0, me: null, players: [], tokens: [], doors: [], chat: [], mapName: '',
    dayTime: -1, weather: '', interactLabel: null, connection: 'offline', pingMs: null
  } as typeof s0;
  render(s0);

  // ── world minimap (P3.7): compass, region/cell readout, explored terrain ──
  const mmCtx = mmCanvas.getContext('2d')!;
  const MM_COLORS: Record<string, string> = {
    meadow: '#55743c', forest: '#3c5a35', snow_forest: '#93a89c', snowfield: '#c2ccd2',
    deadlands: '#544434', mountains: '#7e7a6e', town: '#9c8656', graveyard: '#43443c', ruins: '#655f53',
  };
  const MM_WATER = '#27455e', MM_ROAD = '#8a7a58', MM_BG = '#08090b';
  const MM_VIEW = 72;              // cells shown either side of the party
  let mmRaf = 0, mmLastDraw = 0, mmLastLabel = '';
  const drawMinimap = (t: number) => {
    mmRaf = requestAnimationFrame(drawMinimap);
    if (t - mmLastDraw < 90) return;   // ~11 fps is plenty for a map
    mmLastDraw = t;
    const show = worldProbe.active && worldProbe.regions.length > 0;
    if (mmEl.hidden === show) mmEl.hidden = !show;
    if (!show) return;
    const W = mmCanvas.width, H = mmCanvas.height;
    const scale = W / (MM_VIEW * 2);   // px per cell
    const pcx = worldProbe.player.x / 5, pcz = worldProbe.player.z / 5;
    const minX = Math.floor(pcx - MM_VIEW), maxX = Math.ceil(pcx + MM_VIEW);
    const minZ = Math.floor(pcz - H / scale / 2), maxZ = Math.ceil(pcz + H / scale / 2);
    mmCtx.fillStyle = MM_BG;
    mmCtx.fillRect(0, 0, W, H);
    for (const region of worldProbe.regions) {
      const rx0 = Math.round(region.originX / 5), rz0 = Math.round(region.originZ / 5);
      const x0 = Math.max(0, minX - rx0), x1 = Math.min(region.w - 1, maxX - rx0);
      const z0 = Math.max(0, minZ - rz0), z1 = Math.min(region.h - 1, maxZ - rz0);
      if (x1 < x0 || z1 < z0) continue;
      for (let z = z0; z <= z1; z++) {
        const row = z * region.w;
        const sy = (rz0 + z + 0.5 - pcz) * scale + H / 2;
        for (let x = x0; x <= x1; x++) {
          const q = row + x;
          if (region.explored && !region.explored[q]) continue;
          let color: string;
          if (region.water && region.water[q]) color = MM_WATER;
          else if (region.road && region.road[q]) color = MM_ROAD;
          else if (region.biome) color = MM_COLORS[region.kinds[region.biome[q]]] || '#3a4436';
          else color = '#3a4436';
          mmCtx.fillStyle = color;
          mmCtx.fillRect((rx0 + x + 0.5 - pcx) * scale + W / 2, sy, scale + 0.5, scale + 0.5);
        }
      }
      // region border (surveyed land is divided into 112x96-cell regions)
      mmCtx.strokeStyle = 'rgba(215, 190, 120, 0.28)';
      mmCtx.lineWidth = 1;
      mmCtx.strokeRect(
        (rx0 - pcx) * scale + W / 2, (rz0 - pcz) * scale + H / 2,
        region.w * scale, region.h * scale,
      );
    }
    // party marker (arrow = facing)
    mmCtx.save();
    mmCtx.translate(W / 2, H / 2);
    mmCtx.rotate(Math.atan2(Math.cos(worldProbe.player.rotY), Math.sin(worldProbe.player.rotY)) - Math.PI / 2);
    mmCtx.fillStyle = '#f0d68a';
    mmCtx.strokeStyle = '#1a1408';
    mmCtx.lineWidth = 1;
    mmCtx.beginPath();
    mmCtx.moveTo(0, -6); mmCtx.lineTo(4.4, 5); mmCtx.lineTo(0, 2.6); mmCtx.lineTo(-4.4, 5);
    mmCtx.closePath(); mmCtx.fill(); mmCtx.stroke();
    mmCtx.restore();
    // compass letters (north = -z, the top of the map)
    mmCtx.font = '10px Cinzel, serif';
    mmCtx.fillStyle = '#d7be78';
    mmCtx.textAlign = 'center';
    mmCtx.fillText('N', W / 2, 11);
    mmCtx.fillText('S', W / 2, H - 3);
    mmCtx.fillText('W', 7, H / 2 + 4);
    mmCtx.fillText('E', W - 8, H / 2 + 4);
    // readout: current region + cell
    let label = '';
    for (const region of worldProbe.regions) {
      const lx = worldProbe.player.x - region.originX;
      const lz = worldProbe.player.z - region.originZ;
      if (lx < 0 || lz < 0 || lx >= region.w * 5 || lz >= region.h * 5) continue;
      label = `${region.name} (${region.rx}, ${region.rz}) · cell ${Math.floor(lx / 5)}, ${Math.floor(lz / 5)}`;
      break;
    }
    if (label && label !== mmLastLabel) {
      mmLastLabel = label;
      const sep = label.lastIndexOf(' · cell ');
      mmNameEl.textContent = label.slice(0, sep);
      mmCoordsEl.textContent = label.slice(sep + 3);
    } else if (!label && mmLastLabel) {
      mmLastLabel = '';
      mmNameEl.textContent = '—';
      mmCoordsEl.textContent = '';
    }
  };
  mmRaf = requestAnimationFrame(drawMinimap);

  // ── chat input ──
  const openChat = () => {
    chatOpenBtn.hidden = true;
    chatInputEl.hidden = false;
    chatInputEl.focus();
  };
  const closeChat = () => {
    chatInputEl.hidden = true;
    chatOpenBtn.hidden = false;
    chatInputEl.value = '';
  };
  chatOpenBtn.addEventListener('click', openChat);
  const onUiClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement | null)?.closest('button')) playSfx('ui');
  };
  const onType = (e: KeyboardEvent) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) playSfx('type', 0.45);
  };
  root.addEventListener('click', onUiClick);
  chatInputEl.addEventListener('keydown', onType);
  chatInputEl.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const text = chatInputEl.value.trim();
      if (text) say(text);
      closeChat();
    } else if (e.key === 'Escape') {
      closeChat();
    }
  });

  let moveToastReason = '';
  let moveToastCount = 0;
  let moveToastUntil = 0;
  let moveToastTimer = 0;
  const offMoveRejected = Bus.on(EV.MOVE_REJECTED, (e: any) => {
    const reason = String(e?.reason || 'blocked');
    if (reason === 'not_your_turn') return;
    const now = Date.now();
    if (reason !== moveToastReason || now >= moveToastUntil) {
      moveToastReason = reason;
      moveToastCount = 0;
      moveToastUntil = now + 2000;
      moveToastEl.hidden = false;
      window.clearTimeout(moveToastTimer);
      moveToastTimer = window.setTimeout(() => { moveToastEl.hidden = true; }, 2000);
    }
    moveToastCount++;
    const text = reason === 'no_movement' ? 'No movement remaining'
      : reason === 'blocked' ? 'That way is blocked' : 'Movement corrected';
    moveToastEl.textContent = moveToastCount > 1 ? `${text} · ×${moveToastCount}` : text;
  });
  chatInputEl.addEventListener('blur', () => { if (!chatInputEl.value) closeChat(); });

  // ── roll toasts (Bus — dice tray moments) ─────────────────────────────────
  // FIX 9 — VTT DiceRollAnimation feel: the toast LANDS (springy overshoot
  // slam + icon tumble), holds ~3.5s, then fades. Natural 20 / natural 1 get
  // the crit / fumble treatment (server attack rolls carry `nat`, damage
  // rolls carry `crit`; a bare 1d20 formula falls back to its first die).
  const offRoll = Bus.on(EV.ROLL, (r: any) => {
    if (!r) return;
    let nat = r.nat;
    if (nat !== 20 && nat !== 1) {
      nat = (/^\s*1d20/i.test(String(r.formula || '')) && Array.isArray(r.rolls) && r.rolls.length)
        ? Number(r.rolls[0]) : undefined;
    }
    const crit = nat === 20 || r.crit === true;
    const fail = nat === 1;
    const el = document.createElement('div');
    el.className = `hud-roll${crit ? ' crit' : ''}${fail ? ' fail' : ''}`;
    const rolls = Array.isArray(r.rolls) ? r.rolls.join(' ') : '';
    el.innerHTML = `
      ${icon('d20', 'ic ic-sm')}
      <span class="roll-tag">${esc(String(r.tag || 'roll'))}</span>
      <span class="roll-formula">${esc(String(r.formula || ''))}</span>
      ${rolls ? `<span class="roll-rolls">[${esc(String(rolls))}]</span>` : ''}
      ${crit ? '<span class="roll-tier">critical</span>' : ''}${fail ? '<span class="roll-tier">fumble</span>' : ''}
      <span class="roll-total">${esc(String(r.total ?? '?'))}</span>`;
    rollsEl.appendChild(el);
    while (rollsEl.children.length > 3) rollsEl.firstElementChild?.remove();
    setTimeout(() => { el.classList.add('bye'); }, 3500);
    setTimeout(() => { el.remove(); }, 4150);
  });

  // ── prompt card (player agency moments) ──
  const offPrompt = Bus.on(EV.PROMPT, (p: any) => {
    if (!p) return;
    if (p.kind === 'turn') {
      // my turn: arm the turn bar + banner flash
      turnbarEl.hidden = false;
      turnBannerEl.textContent = `THY TURN — ROUND ${p.round ?? ''}`;
      turnBannerEl.classList.remove('flash');
      void turnBannerEl.offsetWidth;      // restart animation
      turnBannerEl.classList.add('flash');
      return;
    }
    if (p.kind === 'notice') {
      extraChat.push({ from: '', color: '#c98a5a', text: String(p.text || ''), t: Date.now() });
      renderChat(useGame.getState().chat);
      return;
    }
    if (p.kind === 'solo-down-cancel') {
      promptEl.hidden = true;
      return;
    }
    if (p.kind === 'solo-down' || p.kind === 'character-ended') {
      promptEl.hidden = false;
      promptEl.innerHTML = `
        <div class="hud-prompt-card ornate" role="alertdialog" aria-modal="true">
          <div class="hp-kind">${esc(String(p.kind))}</div>
          <div class="hp-title">${esc(String(p.title || 'The moment bends…'))}</div>
          <div class="hp-text">${esc(String(p.text || ''))}</div>
          <div class="hp-actions">${(Array.isArray(p.options) ? p.options : []).map((o: any, i: number) =>
            `<button type="button" class="hp-opt" data-opt="${i}">${esc(String(o.label || 'Continue'))}</button>`).join('')}
          ${p.kind === 'solo-down' ? '<button type="button" class="hp-dismiss" data-hp-dismiss>wait for help</button>' : ''}
        </div>`;
      promptEl.querySelector('[data-hp-dismiss]')?.addEventListener('click', () => { promptEl.hidden = true; });
      promptEl.querySelectorAll<HTMLButtonElement>('.hp-opt').forEach((button, i) => button.addEventListener('click', () => {
        const action = p.options?.[i]?.action;
        if (action === 'accept-death') sendAction({ kind: 'acceptDeath' });
        else if (action === 'return-menu') {
          promptEl.hidden = true;
          useGame.getState().setPhase('join');
          netClose();
        }
      }));
      return;
    }
    promptEl.hidden = false;
    promptEl.innerHTML = `
      <div class="hud-prompt-card ornate">
        <div class="hp-kind">${esc(String(p.kind || 'choice'))}</div>
        <div class="hp-title">${esc(String(p.title || 'The moment bends…'))}</div>
        ${p.text ? `<div class="hp-text">${esc(String(p.text))}</div>` : ''}
        <div class="hp-actions">
          ${Array.isArray(p.options) ? p.options.map((o: any, i: number) =>
            `<button type="button" class="hp-opt" data-opt="${i}">${esc(String(o.label ?? o))}</button>`).join('') : ''}
          <button type="button" class="hp-dismiss" data-hp-dismiss>later</button>
        </div>
      </div>`;
    promptEl.querySelector('[data-hp-dismiss]')?.addEventListener('click', () => { promptEl.hidden = true; });
    promptEl.querySelectorAll<HTMLButtonElement>('.hp-opt').forEach((b) => b.addEventListener('click', () => {
      promptEl.hidden = true; // reply channel lands with the CombatEngine (T2-b)
    }));
  });

  // ── errors mid-game → system chat line; on join screen the join card shows them ──
  const offError = Bus.on(EV.ERROR, (e: any) => {
    if (useGame.getState().phase !== 'playing') return;
    extraChat.push({ from: '', color: '#d9704f', text: e?.message || 'the reach refused', t: Date.now() });
    if (extraChat.length > 30) extraChat = extraChat.slice(-30);
    renderChat(useGame.getState().chat);
  });

  // ── fx → system chat narration (damage / heals read as story beats) ──
  const offFx = Bus.on(EV.FX, (f: any) => {
    if (!f || useGame.getState().phase !== 'playing') return;
    const a = f.action || {};
    if (a.anim === 'hit' || a.anim === 'crit' || a.anim === 'heal' || a.anim === 'miss' || a.anim === 'die') {
      extraChat.push({
        from: '', color: a.anim === 'heal' ? '#8fe8b0' : a.anim === 'die' ? '#b96a6a' : '#c98a5a',
        text: `${f.actorId || '?'} — ${a.anim}${a.power ? ` (${a.power})` : ''}`,
        t: Date.now()
      });
      if (extraChat.length > 30) extraChat = extraChat.slice(-30);
      renderChat(useGame.getState().chat);
    }
  });

  // ── DM panel ──
  dmToggleBtn.addEventListener('click', () => { dmPanelEl.hidden = !dmPanelEl.hidden; });

  for (const w of ['clear', 'rain', 'storm', 'fog']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${weatherIcon(w)} <span>${w}</span>`;
    b.addEventListener('click', () => dmCmd('weather', { type: w }));
    dmWeatherRow.appendChild(b);
  }
  const dayBtn = (label: string, iconSvg: string, payload: Record<string, unknown>) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${iconSvg} <span>${label}</span>`;
    b.addEventListener('click', () => dmCmd('daynight', payload));
    dmDayRow.appendChild(b);
  };
  dayBtn('noon', icon('sun', 'ic ic-sm'), { mode: 'fixed', time: 12 * 60 });
  dayBtn('night', icon('moon', 'ic ic-sm'), { mode: 'fixed', time: 21 * 60 });
  dayBtn('cycle', icon('sparkle', 'ic ic-sm'), { mode: 'cycle' });

  dmSpawnNear.addEventListener('click', () => {
    const s = useGame.getState();
    const my = s.tokens.find((t) => t.id === s.myTokenId);
    // SRD statblock spawn — CombatDriver resolves monsterId server-side
    dmCmd('spawn', {
      monsterId: dmSpawnSel.value,
      x: (my?.x ?? 0) + 15, z: (my?.z ?? 0) + 10
    });
  });

  const dmCombatStart = $<HTMLButtonElement>('[data-dm-combat-start]');
  const dmCombatEnd = $<HTMLButtonElement>('[data-dm-combat-end]');
  dmCombatStart?.addEventListener('click', () => dmCmd('combat', { action: 'start' }));
  dmCombatEnd?.addEventListener('click', () => dmCmd('combat', { action: 'end' }));

  // ── my turn: action bar ──
  targetSelectEl.addEventListener('change', () => {
    selectedTargetId = targetSelectEl.value;
    const s = useGame.getState();
    updateTargetSelection(s, s.tokens.find((token) => token.id === s.myTokenId));
  });

  turnbarEl.querySelectorAll<HTMLButtonElement>('.ta-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const s = useGame.getState();
      const me = s.tokens.find((t) => t.id === s.myTokenId);
      const act = b.dataset.act;
      if (!me) return;
      if (act === 'end') { endTurn(); return; }
      if (act === 'dash') { sendAction({ kind: 'dash' }); return; }
      if (act === 'dodge') { sendAction({ kind: 'dodge' }); return; }
      if (act === 'help') {
        const ally = s.tokens.filter((token) => token.kind === 'player' && token.id !== me.id &&
          token.hp <= 0 && !token.deathSaves?.dead)
          .sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
        if (ally) sendAction({ kind: 'help', targetId: ally.id });
        return;
      }
      const foe = s.tokens.find((token) => token.id === selectedTargetId && token.kind === 'monster' &&
        !token.hidden && token.hp > 0 && !token.deathSaves?.dead);
      if (act === 'attack' && foe) { sendAction({ kind: 'attack', targetId: foe.id }); return; }
      if (act === 'cast') {
        const sheet = (me as any)?.sheet;
        const spell = String(spellSelectEl.value || '');
        if (!spell) return;
        // spell level from the sheet's grouped list (server up-casts only on request)
        let slotLevel: number | undefined = undefined;
        const map = sheet?.spellcasting?.spellsByLevel as Record<string, string[]> | undefined;
        if (map) {
          for (const [lvl, names] of Object.entries(map)) {
            if ((names as string[]).includes(spell)) { const n = Number(lvl); if (n > 0) slotLevel = n; break; }
          }
        }
        // heal/buff spells target self (server allows allies later); the rest need the foe
        const heals = /^(Cure Wounds|Healing Word|Bless|Mage Armor|Shield)$/i.test(spell);
        const targetId = heals ? me.id : foe?.id;
        if (targetId) sendAction({ kind: 'cast', spellId: spell, targetId, slotLevel });
      }
    });
  });

  // feature buttons (mechanics overlay) — delegated
  featureRowEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.ta-feature');
    if (!btn || btn.disabled) return;
    sendAction({ kind: 'feature', featureId: btn.dataset.featureId });
  });

  // map registry (async fill)
  void fetch('/api/maps').then((r) => r.json()).then((j) => {
    for (const m of j.maps || []) {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.name || m.id;
      dmMapSel.appendChild(o);
    }
  }).catch(() => { /* dm map select stays empty */ });
  dmMapGo.addEventListener('click', () => {
    if (dmMapSel.value) dmCmd('map', { id: dmMapSel.value });
  });
  dmDoorSel.addEventListener('change', () => renderDmDoors(useGame.getState().doors));
  dmDoorApply.addEventListener('click', () => {
    const wallIndex = Number(dmDoorSel.value);
    if (Number.isInteger(wallIndex)) dmCmd('door', { wallIndex, action: dmDoorActionSel.value });
  });

  dmListEl.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-rm]') as HTMLElement | null;
    if (t) dmCmd('remove', { id: t.dataset.rm });
  });

  // window resizes re-center the initiative carousel without a slide
  const onResize = () => { if (!initEl.hidden) centerInitiative(true); };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(mmRaf);
    offStore(); offRoll(); offPrompt(); offError(); offFx(); offMoveRejected();
    window.clearTimeout(moveToastTimer);
    root.removeEventListener('click', onUiClick);
    chatInputEl.removeEventListener('keydown', onType);
    window.removeEventListener('resize', onResize);
    root.remove();
  };
}
