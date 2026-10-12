// ui/joinscreen.ts — atmospheric title screen and entry point to character creation.
import { useGame } from '../game/store';
import { icon } from './sigils';
import { Bus, EV } from '../engine/bus';
import { mountAudioSettings } from '../audio/controls';

export interface JoinOpts {
  invite?: string;
  dmKey?: string;
  /** pre-fill the name (kept across wizard cancel/return — the wizard is the
   *  only path in, so losing a typed name on every hop would be cruel) */
  name?: string;
  /** error text stashed by the screen router while the wizard was open
   *  (session:join rejections land after the join screen has unmounted) */
  error?: string;
  onContinue?: (character: SavedCharacter, invite: string, dm: boolean, dmKey: string) => void;
  onForge?: (intent: { name: string; invite: string; dm: boolean; dmKey: string }) => void;
}

interface SavedCharacter {
  name: string;
  class?: string;
  level?: number;
  [key: string]: unknown;
}

const CHARACTERS_KEY = 'ar_characters';

function loadCharacters(): SavedCharacter[] {
  try {
    const value = JSON.parse(localStorage.getItem(CHARACTERS_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    let changed = false;
    const characters = value.filter((c) => c && typeof c.name === 'string' && c.name.trim());
    for (const character of characters) {
      if (typeof character.id !== 'string' || !character.id) {
        character.id = crypto.randomUUID();
        changed = true;
      }
    }
    if (changed) localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    return characters;
  } catch {
    return [];
  }
}

export function mountJoinScreen(container: HTMLElement, opts: JoinOpts = {}): () => void {
  const root = document.createElement('div');
  root.className = 'screen-join landing-screen';
  const characters = loadCharacters();
  root.innerHTML = `
    <canvas class="landing-embers" data-embers aria-hidden="true"></canvas>
    <div class="landing-sigil" aria-hidden="true"><div class="landing-sigil-ring"></div></div>
    <div class="landing-vignette" aria-hidden="true"></div>
    <header class="landing-top"><span class="landing-world">A WORLD ON THE ASHEN EDGE</span>
      <div data-audio-controls></div></header>
    <main class="landing-main">
      <div class="landing-mark-wrap">
        <button type="button" class="landing-mark" data-crown aria-label="A crown sigil">
          ${icon('crown', 'ic ic-crown')}
        </button>
        <div class="landing-secret" data-secret aria-live="polite" hidden>The old crown remembers.</div>
      </div>
      <p class="landing-eyebrow">THE FIRE HAS FADED. THE STORY HAS NOT.</p>
      <h1 class="landing-title" aria-label="ASHENREACH">ASHENREACH</h1>
      <p class="landing-subtitle">The world after the last fire</p>
      <div class="landing-rule"><span>✦</span></div>
      <div class="join-note landing-note" data-note hidden>kindling the reach…</div>
      <div class="join-error landing-error" data-error hidden></div>
      <section class="landing-returning" data-returning hidden>
        <div class="landing-section-label">WANDERERS · THIS DEVICE</div>
        <div data-character-list></div>
      </section>
      <button type="button" class="landing-primary" data-forge><span>${icon('ember', 'ic ic-ember')}</span> Begin a new tale</button>
      <button type="button" class="landing-secondary" data-settings aria-expanded="false">${opts.invite ? `Summons · ${escapeHtml(opts.invite)}` : 'Join a gathering'} <span>＋</span></button>
      <section class="landing-settings" data-settings-panel hidden>
        ${opts.invite ? `<div class="landing-invite-fixed">Summons code <b>${escapeHtml(opts.invite)}</b></div>` : `
          <label for="ar-invite">SUMMONS CODE</label>
          <input id="ar-invite" class="join-invite-input" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Optional — join a friend's gathering" />`}
        <label class="join-dm landing-dm" data-dm><input type="checkbox" data-dm-box />
          <span class="join-dm-crown">${icon('crown', 'ic ic-crown-sm')}</span><span>Enter as Dungeon Master</span>
        </label>
      </section>
      <p class="landing-foot">Characters saved on this device · WASD to move · Space to jump · drag to look</p>
    </main>
    <footer class="landing-footer"><span>ASHENREACH</span><span>WANDERERS WELCOME</span></footer>`;

  container.appendChild(root);

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const inviteEl = root.querySelector<HTMLInputElement>('#ar-invite');
  const dmBox = $<HTMLInputElement>('[data-dm-box]');
  const errorEl = $<HTMLElement>('[data-error]');
  const noteEl = $<HTMLElement>('[data-note]');
  const forgeBtn = $<HTMLButtonElement>('[data-forge]');
  const settingsBtn = $<HTMLButtonElement>('[data-settings]');
  const settingsPanel = $<HTMLElement>('[data-settings-panel]');
  const returningEl = $<HTMLElement>('[data-returning]');
  const characterListEl = $<HTMLElement>('[data-character-list]');
  const crownBtn = $<HTMLButtonElement>('[data-crown]');
  const secretEl = $<HTMLElement>('[data-secret]');
  let crownClicks = 0;
  crownBtn.addEventListener('click', () => {
    crownClicks++;
    if (crownClicks === 5) {
      root.classList.add('is-crown-awake');
      crownBtn.parentElement?.classList.add('has-secret');
      secretEl.hidden = false;
      crownBtn.setAttribute('aria-label', 'The old crown remembers');
    }
  });

  const renderCharacters = () => {
    returningEl.hidden = characters.length === 0;
    characterListEl.innerHTML = characters.map((character, index) => `
      <div class="landing-character">
        <span class="landing-character-mark">${icon('ember', 'ic ic-ember')}</span>
        <span class="landing-character-copy"><b>${escapeHtml(character.name)}</b>
          <small>${escapeHtml(character.class || 'Wanderer')} · Level ${Number(character.level) || 1}</small></span>
        <button type="button" class="landing-character-enter" data-continue="${index}">Continue →</button>
        <button type="button" class="landing-character-delete" data-delete="${index}"
          aria-label="Delete ${escapeHtml(character.name)}" title="Delete character">${icon('x')}</button>
      </div>`).join('');
  };
  renderCharacters();

  const dmKey = opts.dmKey || new URLSearchParams(location.search).get('dm') || '';

  // ?dm=<key> present → the launcher intends this client to claim the seat
  if (dmKey) dmBox.checked = true;

  // ── errors from the server (bad invite, full, dm rejected…) ──
  const showError = (msg: string) => {
    errorEl.textContent = msg || 'The gate refused thee.';
    errorEl.hidden = false;
  };
  if (opts.error) showError(opts.error);
  const offError = Bus.on(EV.ERROR, (e) => showError((e && e.message) || 'The gate refused thee.'));
  const clearError = () => { errorEl.hidden = true; };
  if (inviteEl) inviteEl.addEventListener('input', clearError);

  // ── forge: the only way in — the wizard completes the join ──
  const forge = () => {
    clearError();
    const invite = opts.invite || (inviteEl ? inviteEl.value.trim() : '');
    const name = opts.name || '';
    opts.onForge?.({ name, invite, dm: dmBox.checked, dmKey });
    useGame.getState().setPhase('create');
  };
  forgeBtn.addEventListener('click', forge);
  settingsBtn.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
    settingsBtn.setAttribute('aria-expanded', String(!settingsPanel.hidden));
    if (!settingsPanel.hidden) inviteEl?.focus();
  });
  characterListEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    const index = Number(button.dataset.continue ?? button.dataset.delete);
    const character = characters[index];
    if (!character) return;
    if (button.hasAttribute('data-delete')) {
      if (!window.confirm(`Delete ${character.name} from this device? This cannot be undone.`)) return;
      characters.splice(index, 1);
      try {
        localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
      } catch (error) {
        characters.splice(index, 0, character);
        console.error('[ashenreach] could not delete this-device character', error);
        showError('Unable to delete this character from browser storage.');
        return;
      }
      renderCharacters();
      return;
    }
    opts.onContinue?.(character, opts.invite || (inviteEl ? inviteEl.value.trim() : ''), dmBox.checked, dmKey);
  });

  // ── connection phase note (kindling…) ──
  const renderPhase = () => {
    const s = useGame.getState();
    noteEl.hidden = s.phase !== 'connecting' && s.connection !== 'reconnecting' && s.connection !== 'offline';
    noteEl.textContent = s.connection === 'reconnecting'
      ? 'the reach slipped away — rekindling…'
      : s.connection === 'offline' ? 'kindling the reach…' : noteEl.textContent;
  };
  renderPhase();
  const offStore = useGame.subscribe((s, prev) => {
    if (s.phase !== prev.phase || s.connection !== prev.connection) renderPhase();
  });

  const stopAmbience = mountEmbers(root.querySelector<HTMLCanvasElement>('[data-embers]')!);
  const stopSound = mountAudioSettings(root.querySelector<HTMLElement>('[data-audio-controls]')!);

  return () => {
    offStore();
    offError();
    stopAmbience();
    stopSound();
    root.remove();
  };
}

function mountEmbers(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d');
  if (!context || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let frame = 0;
  let particles: { x: number; y: number; r: number; speed: number; phase: number }[] = [];
  const resize = () => {
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    particles = Array.from({ length: 52 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: (0.7 + Math.random() * 1.5) * dpr, speed: (0.12 + Math.random() * 0.32) * dpr,
      phase: Math.random() * Math.PI * 2,
    }));
  };
  const tick = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += Math.sin(p.phase + p.y * 0.004) * 0.18 * dpr;
      if (p.y < -8) { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
      const alpha = 0.18 + (Math.sin(p.phase + p.y * 0.018) + 1) * 0.16;
      context.fillStyle = `rgba(230, 166, 67, ${alpha})`;
      context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill();
    });
    frame = requestAnimationFrame(tick);
  };
  resize();
  frame = requestAnimationFrame(tick);
  window.addEventListener('resize', resize);
  return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
