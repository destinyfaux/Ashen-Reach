// ui/escape.ts — FIX 11 [3]: the escape menu (Resume · Character Record ·
// Satchel & Gear · Return to the Main Menu) plus the SHARED modal plumbing
// the panel trio is built on (sheet.ts / inventory.ts import createModal and
// myToken from here; main.ts owns C/I/Esc routing and panel exclusivity).
//
// Modal contract (FIX 11 [4]):
//   - one panel open at a time — main.ts closes the others on open
//   - .pnl-layer is z 60, above .hud-prompt's 50 — modal above all HUD
//   - backdrop (the layer itself) closes on click; the card refocuses an
//     invisible readonly trap INPUT after every click, so while a panel is
//     open document.activeElement is an INPUT → engine Controls.uiOpen()
//     pauses WASD without Controls knowing panels exist
//   - the trap carries data-ar-trap, so main.ts's "user is typing" check
//     still lets C / I / Esc route while a panel holds focus
//   - closing blurs the trap: movement works again the moment the panel is
//     gone (nothing to reset, no engine state touched)
import { useGame } from '../game/store';
import type { TokenState } from '../game/store';
import { svg } from './sigils';
import { mountAudioSettings } from '../audio/controls';

export interface PanelHandle {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  dispose(): void;
}

export interface ModalHead { kicker?: string; title?: string; sub?: string | null; }

/** A mounted modal: `body` is the owner's render target, `onOpen` the owner's
 *  re-render hook (fired every time the panel is opened). */
export interface Modal extends PanelHandle {
  root: HTMLElement;   // .pnl-layer — the fixed backdrop, hidden-attr toggled
  card: HTMLElement;   // .pnl-modal.ornate
  body: HTMLElement;   // .pnl-body — scrollable content
  onOpen: () => void;
  setHead(h: ModalHead): void;
}

export function createModal(container: HTMLElement, opts: { kicker: string; title: string; narrow?: boolean }): Modal {
  const root = document.createElement('div');
  root.className = 'pnl-layer';
  root.hidden = true;
  root.innerHTML = `
    <div class="pnl-modal ornate${opts.narrow ? ' pnl-narrow' : ''}" role="dialog" aria-modal="true">
      <input class="pnl-trap" data-ar-trap="1" readonly tabindex="-1" aria-hidden="true" />
      <header class="pnl-head">
        <div class="pnl-head-text">
          <div class="pnl-kicker"></div>
          <h2 class="pnl-title"></h2>
          <div class="pnl-sub" hidden></div>
        </div>
        <button type="button" class="pnl-close" aria-label="close the panel">✕</button>
      </header>
      <div class="pnl-body"></div>
    </div>`;
  container.appendChild(root);

  const card = root.querySelector<HTMLElement>('.pnl-modal')!;
  const body = root.querySelector<HTMLElement>('.pnl-body')!;
  const trap = root.querySelector<HTMLInputElement>('.pnl-trap')!;
  const kickerEl = root.querySelector<HTMLElement>('.pnl-kicker')!;
  const titleEl = root.querySelector<HTMLElement>('.pnl-title')!;
  const subEl = root.querySelector<HTMLElement>('.pnl-sub')!;

  const modal: Modal = {
    root, card, body,
    onOpen: () => { /* owner replaces this */ },
    setHead(h) {
      if (h.kicker !== undefined) kickerEl.textContent = h.kicker;
      if (h.title !== undefined) titleEl.textContent = h.title;
      if (h.sub !== undefined) {
        subEl.hidden = h.sub == null;
        if (h.sub != null) subEl.textContent = h.sub;
      }
    },
    open() {
      root.hidden = false;
      trap.focus({ preventScroll: true });
      modal.onOpen();
    },
    close() {
      root.hidden = true;
      if (root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    },
    toggle() { if (root.hidden) modal.open(); else modal.close(); },
    isOpen: () => !root.hidden,
    dispose() { root.remove(); },
  };

  modal.setHead({ kicker: opts.kicker, title: opts.title });

  // backdrop click closes; clicks inside the card do not
  root.addEventListener('click', (e) => { if (e.target === root) modal.close(); });
  root.querySelector<HTMLButtonElement>('.pnl-close')!.addEventListener('click', () => modal.close());

  // buttons steal focus on click, which would un-pause WASD (activeElement
  // stops being an INPUT) — hand focus back to the trap after every click
  card.addEventListener('click', (e) => {
    if (!root.hidden && !(e.target as HTMLElement).closest('[data-panel-keep-focus]')) {
      trap.focus({ preventScroll: true });
    }
  });
  // keep Tab pinned on the trap (panels are mouse-first; C/I/Esc still route)
  trap.addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault(); });

  return modal;
}

/** My player token from the store. The full 5E sheet rides on it as
 *  `token.sheet` (SCHEMA.md §2, built server-side by CharacterEngine); the
 *  store's TokenState is deliberately not widened — sheet.ts casts it. */
export function myToken(): TokenState | null {
  const s = useGame.getState();
  return s.tokens.find((t) => t.id === s.myTokenId) ?? null;
}

// ── glyphs (path-only, currentColor — sigils.ts vocabulary, local copies) ──
const GLYPH_RESUME = 'M40 30 L68 50 L40 70 Z';
const GLYPH_RECORD = 'M30 16 H70 V84 H30 Z M40 32 H60 M40 46 H60 M40 60 H54';
const GLYPH_SATCHEL = 'M34 42 H66 L73 82 H27 Z M40 42 C40 29 60 29 60 42 M50 29 V22';
const GLYPH_MENU = 'M28 30 H72 M28 50 H72 M28 70 H72';
const GLYPH_LEAVE = 'M62 16 H78 V84 H62 M36 34 L20 50 L36 66 M20 50 H58';

// ── the escape menu ────────────────────────────────────────────────────────
export interface EscapeOpts {
  onOpenSheet(): void;
  onOpenInventory(): void;
  /** Return to the Main Menu — main.ts: close panels → setPhase('join') →
   *  intentional net disconnect (net/client.ts close()). */
  onReturn(): void;
}

export function mountEscape(container: HTMLElement, opts: EscapeOpts): PanelHandle {
  const modal = createModal(container, { kicker: 'the ashen reach', title: 'Rest a moment', narrow: true });
  modal.body.innerHTML = `
    <div class="pnl-menu-actions">
      <button type="button" class="pnl-menu-btn" data-mb="resume">
        ${svg(GLYPH_RESUME, 'mb-ic')} <span>Resume</span>
      </button>
      <button type="button" class="pnl-menu-btn" data-mb="sheet">
        ${svg(GLYPH_RECORD, 'mb-ic')} <span>Character Record</span> <kbd>C</kbd>
      </button>
      <button type="button" class="pnl-menu-btn" data-mb="inv">
        ${svg(GLYPH_SATCHEL, 'mb-ic')} <span>Satchel &amp; Gear</span> <kbd>I</kbd>
      </button>
      <button type="button" class="pnl-menu-btn danger" data-mb="leave">
        ${svg(GLYPH_LEAVE, 'mb-ic')} <span>Return to the Main Menu</span>
      </button>
    </div>
    <div class="pnl-audio-settings" data-panel-keep-focus></div>
    <div class="pnl-menu-note">movement rests while this card is open — Esc or Resume to return</div>`;

  const disposeAudioSettings = mountAudioSettings(modal.body.querySelector<HTMLElement>('.pnl-audio-settings')!, true);
  modal.body.querySelectorAll<HTMLButtonElement>('.pnl-menu-btn').forEach((b) => {
    b.addEventListener('click', () => {
      switch (b.dataset.mb) {
        case 'resume': modal.close(); break;      // exclusivity: only this card is open
        case 'sheet': opts.onOpenSheet(); break;
        case 'inv': opts.onOpenInventory(); break;
        case 'leave': opts.onReturn(); break;
      }
    });
  });

  return {
    open: () => modal.open(),
    close: () => modal.close(),
    toggle: () => modal.toggle(),
    isOpen: () => modal.isOpen(),
    dispose: () => { disposeAudioSettings(); modal.dispose(); },
  };
}

// ── the HUD dock (mouse affordance — FIX 11 [5]) ──────────────────────────
// A fixed horizontal row above the self-status plaque; panels.css collapses it
// to labeled-by-ARIA icon buttons on narrow screens.
export function mountDock(container: HTMLElement, h: { onSheet(): void; onInventory(): void; onMenu(): void }): () => void {
  const dock = document.createElement('div');
  dock.className = 'pnl-dock';
  dock.innerHTML = `
    <button type="button" class="pnl-dock-btn" data-dock="sheet" title="character record (C)" aria-label="Character record (C)">${svg(GLYPH_RECORD)} <span>Record</span> <kbd>C</kbd></button>
    <button type="button" class="pnl-dock-btn" data-dock="inv" title="satchel and gear (I)" aria-label="Satchel and gear (I)">${svg(GLYPH_SATCHEL)} <span>Satchel</span> <kbd>I</kbd></button>
    <button type="button" class="pnl-dock-btn" data-dock="menu" title="menu (Esc)" aria-label="Menu (Escape)">${svg(GLYPH_MENU)} <span>Menu</span> <kbd>Esc</kbd></button>`;
  container.appendChild(dock);
  dock.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-dock]');
    if (!b) return;
    if (b.dataset.dock === 'sheet') h.onSheet();
    else if (b.dataset.dock === 'inv') h.onInventory();
    else if (b.dataset.dock === 'menu') h.onMenu();
  });
  return () => dock.remove();
}
