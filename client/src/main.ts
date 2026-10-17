// ASHENREACH — main.ts boot entry (vanilla TS, no framework).
// Flow: parse invite (?invite= or /j/<code>) + dm key (?dm=<key>) → connect
// WebSocket → mount screens (join → [create] → playing). The 3D engine boots
// exactly once, on the first transition into 'playing' (headless=1 skips it),
// then replays the bootstrap snapshot it missed while the join card was up.
//
// FIX 11: the panel trio (character record · satchel · escape menu) mounts
// for every 'playing' stretch and is torn down when the phase leaves it.
// Key routing lives here: KeyC → record, KeyI → satchel, Escape → close the
// open panel, else the escape menu. One panel at a time; the panels
// themselves (ui/sheet.ts, ui/inventory.ts, ui/escape.ts) own their cards.
import { useGame } from './game/store';
import { connect, close as netClose, replayBootstrap } from './net/client';
import { mountScreens } from './ui/screen';
import { Engine } from './engine/Engine';

// panel styles — esbuild bundles CSS imports of the entry graph into
// client/public/app.css (index.html links it; nothing touches theme.css)
import './ui/panels.css';
import { mountEscape, mountDock } from './ui/escape';
import type { PanelHandle } from './ui/escape';
import { mountSheet } from './ui/sheet';
import { mountInventory } from './ui/inventory';
import { setMusicScene } from './audio/music';
import { primeAssets } from './engine/assets';

const params = new URLSearchParams(location.search);
const m = location.pathname.match(/^\/j\/([a-z0-9]+)/i);
const invite = params.get('invite') || (m ? m[1] : '');
const dmKey = params.get('dm') || '';
const headless = /[?&]headless=1/.test(location.search);

const app = document.getElementById('app')!;

// boot splash (index.html) is replaced by the first real screen
document.getElementById('boot-splash')?.remove();

// Wave 1 asset pipeline: start fetching the cooked kit bundles immediately —
// they land during the join screen and parse once the engine boots a renderer.
if (!headless) primeAssets();

mountScreens(app, { invite, dmKey: dmKey || undefined, headless });

// ── engine: single boot on first 'playing' ─────────────────────────────────
let engineBooted = false;
function bootEngine() {
  if (engineBooted || headless) return;
  engineBooted = true;
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  app.prepend(canvas); // behind the HUD (canvas z 0, hud z 30+)
  const eng = new Engine(canvas);
  eng.start();
  // the engine subscribes to the Bus in its constructor — re-emit the map /
  // tokens / env it missed while the join screen was up
  replayBootstrap();
}

// ── FIX 11 — character record / satchel / escape menu (modal trio) ─────────
// One panel open at a time (opening one closes the others); Esc closes the
// open one and only falls through to the escape menu when the field is
// clear. Keys are ignored while the user is typing (chat input) but not when
// a panel's own focus trap (data-ar-trap) holds focus — see ui/escape.ts.
let disposePanels: (() => void) | null = null;

function mountPanels() {
  if (disposePanels) return;
  const sheet = mountSheet(app);
  const inv = mountInventory(app);
  const all: PanelHandle[] = [sheet, inv];

  const menu = mountEscape(app, {
    onOpenSheet: () => show(sheet),
    onOpenInventory: () => show(inv),
    onReturn: () => {
      closeAll();
      useGame.getState().setPhase('join'); // router swaps HUD → join screen
      netClose();                           // session:leave + intentional close
    },
  });
  all.push(menu);

  function show(p: PanelHandle) {
    for (const q of all) if (q !== p) q.close();
    p.open();
  }
  function toggle(p: PanelHandle) {
    if (p.isOpen()) p.close();
    else show(p);
  }
  function closeAll() {
    for (const q of all) q.close();
  }

  const offDock = mountDock(app, {
    onSheet: () => toggle(sheet),
    onInventory: () => toggle(inv),
    onMenu: () => toggle(menu),
  });

  const onKey = (e: KeyboardEvent) => {
    if (useGame.getState().phase !== 'playing') return;
    // user is typing somewhere real (chat input) → never intercept
    const ae = document.activeElement as HTMLElement | null;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') &&
      ae.dataset.arTrap !== '1' && !ae.closest('.ar-audio-settings')) return;
    if (e.repeat) return;
    if (e.code === 'KeyC') { toggle(sheet); return; }
    if (e.code === 'KeyI') { toggle(inv); return; }
    if (e.code === 'Escape') {
      // close the open panel first; only an empty field opens the menu
      if (all.some((q) => q.isOpen())) { closeAll(); return; }
      // the HUD prompt card is a modal in its own right — Esc stays its own
      // while it is up (it is dismissed with its own buttons)
      const prompt = document.querySelector<HTMLElement>('.hud-prompt');
      if (prompt && !prompt.hidden) return;
      show(menu);
    }
  };
  window.addEventListener('keydown', onKey);

  disposePanels = () => {
    window.removeEventListener('keydown', onKey);
    offDock();
    for (const q of all) q.dispose();
    disposePanels = null;
  };
}

let prevPhase = useGame.getState().phase;
useGame.subscribe((s) => {
  if (s.phase === prevPhase) return;
  prevPhase = s.phase;
  if (s.phase !== 'playing') setMusicScene('menu');
  if (s.phase === 'playing') {
    bootEngine();
    mountPanels();
  } else {
    disposePanels?.();
  }
});

// kick the socket (join screen shows 'kindling…' until it opens)
useGame.setState({ phase: 'connecting' });
connect();

console.log('[ashenreach] boot', invite ? `invite=${invite}` : 'no invite',
  dmKey ? 'dm-key present' : '', headless ? 'headless' : '');
