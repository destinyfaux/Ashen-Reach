// ═══════════════════════════════════════════════════════════════════════════
// creation.ts — character creation wizard: controller + PUBLIC API (frozen).
//
// Integration (T2-a):
//   import { mountCreation } from './ui/create/creation';
//   mountCreation(container, { onDone: (def) => joinSession(...), onCancel });
// The wizard is self-contained (no server, no store, no engine imports) and
// self-mounts fullscreen when the URL carries ?page=create (QA screenshots):
//   → it activates as soon as ANY module in the bundle imports this file,
//     because the check runs at module scope. One line in main.ts is enough:
//       import './ui/create/creation';   // side-effect import (T2-a)
//
// CharacterDef note (for T2-b's CharacterEngine.buildCharacter):
//   abilities are BASE scores BEFORE racial bonuses — the reference engine
//   (Custom-VTT CharacterEngine.calculateLiveStats) applies racial ASI itself
//   (plus the auto-picked first subrace — see gamedata.ts's house-rule note),
//   so we ship base scores and preview the final numbers in the UI.
//   FIX 6: `subclass` (level-1 path — Cleric domain / Warlock patron / Sorcerer
//   origin) rides along in the def. The server's GameManager currently drops it
//   before buildCharacter, so it is forward-carrying, not an error. The wizard
//   runs 6 or 7 steps depending on the class (visibleSteps in steps.ts).
// ═══════════════════════════════════════════════════════════════════════════
import {
  h, defaultState, renderStepBody, stepValid, STEP_META, visibleSteps,
} from './steps';
import type { CreateState, StepCtx } from './steps';
import { RACES, CLASSES, BACKGROUNDS, SUBCLASSES } from './gamedata';
import type { AbilityKey } from './gamedata';
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS, CLOAK_COLORS } from './portrait';

// ── frozen public API ────────────────────────────────────────────────────────
export interface CharacterDef {
  name: string; race: string; subrace?: string; class: string; level: number;
  /** Chosen subclass path from the SRD database */
  subclass?: string;
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  background: string;
  look: {
    gender?: 'masculine' | 'feminine';
    bodyType: 'slim' | 'normal' | 'heavy'; skinTone: number; hairStyle: number; hairColor: number;
    cloakColor: number; eyeColor: number; faceDecor: 'none' | 'scars' | 'runes' | 'warpaint' | 'freckles' | 'skull';
  };
}

export interface MountOpts {
  onDone: (c: CharacterDef) => void;
  onCancel?: () => void;
  /** pre-seed the name (typed on the join screen — FIX 5) */
  name?: string;
  /** carried for reference; the join intent itself lives in the screen router */
  invite?: string;
}

export function mountCreation(container: HTMLElement, opts: MountOpts): void {
  ensureCSS();
  if (active) active.dispose();
  active = createWizard(container, opts);
}

// ── stylesheet (kept separate from theme.css by design) ──────────────────────
let cssInjected = false;
function ensureCSS(): void {
  if (cssInjected || typeof document === 'undefined') return;
  if (!document.getElementById('ar-create-css')) {
    const link = document.createElement('link');
    link.id = 'ar-create-css';
    link.rel = 'stylesheet';
    link.href = '/create.css';
    document.head.append(link);
  }
  cssInjected = true;
}

// ── wizard instance ──────────────────────────────────────────────────────────
interface Active {
  root: HTMLElement;
  dispose: () => void;
  applyDef: (def: CharacterDef) => void;   // used by IMPORT
}
let active: Active | null = null;

function createWizard(container: HTMLElement, opts: MountOpts): Active {
  const state: CreateState = defaultState();
  // FIX 5: the join screen's name field pre-seeds the wizard
  if (opts.name) state.name = opts.name.trim().slice(0, 24);

  const runes = h('div', { class: 'cr-steps' });
  const stepTitle = h('div', { class: 'cr-step-title' });
  const stepSub = h('div', { class: 'cr-step-sub' });
  const stepContent = h('div', { class: 'cr-step-content' });
  const hint = h('div', { class: 'cr-hint' });
  const backBtn = h('button', { class: 'cr-btn cr-btn-back', onclick: () => go(-1) }, 'BACK');
  const nextBtn = h('button', { class: 'cr-btn cr-btn-primary', onclick: () => go(1) }, 'NEXT');

  function buildDef(): CharacterDef {
    return {
      name: state.name.trim(),
      race: state.race,
      ...(state.subrace ? { subrace: state.subrace } : {}),
      class: state.charClass,
      ...(state.subclass ? { subclass: state.subclass } : {}),
      level: 1,
      abilities: { ...state.base } as CharacterDef['abilities'],
      background: state.background,
      look: { ...state.look },
    };
  }

  const ctx: StepCtx = {
    state,
    update,
    patchSilent,
    goTo: (i) => {
      const vis = visibleSteps(state);
      const lo = vis[0], hi = vis[vis.length - 1];
      state.step = Math.max(lo, Math.min(hi, i));
      render();
    },
    buildDef,
    exportJSON,
    importJSONText,
  };

  function exportJSON(): void {
    const def = buildDef();
    const payload = JSON.stringify({ format: 'ashenreach.character', version: 1, def }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = `ashenreach-${def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'nameless'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  const root = h('div', { class: 'cr-root' },
    h('div', { class: 'cr-frame' },
      h('header', { class: 'cr-header' },
        h('div', { class: 'cr-brand' },
          h('span', { class: 'cr-brand-mark', html: '<svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 4l3.2 8.8L28 16l-8.8 3.2L16 28l-3.2-8.8L4 16l8.8-3.2z"/></svg>' }),
          h('span', { class: 'cr-brand-text' },
            h('b', { text: 'ASHENREACH' }),
            h('small', { text: 'Character Forge' }))),
        runes,
        opts.onCancel
          ? h('button', { class: 'cr-btn cr-btn-ghost cr-cancel', onclick: () => { opts.onCancel?.(); } }, 'ABANDON')
          : h('span', { class: 'cr-header-spacer' })),
      h('section', { class: 'cr-body' },
        h('div', { class: 'cr-step-head' }, stepTitle, stepSub),
        stepContent),
      h('footer', { class: 'cr-footer' },
        hint,
        h('div', { class: 'cr-footer-nav' }, backBtn, nextBtn))));

  container.append(root);

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.key === 'Enter') go(1);
    if (e.key === 'Escape' && opts.onCancel) opts.onCancel();
  };
  document.addEventListener('keydown', onKey);

  function dispose(): void {
    document.removeEventListener('keydown', onKey);
    root.remove();
    if (active && active.root === root) active = null;
  }

  /** IMPORT: pour a validated def into the live wizard and jump to the oath. */
  function applyDef(def: CharacterDef): void {
    Object.assign(state, {
      name: def.name, race: def.race, charClass: def.class,
      subclass: def.subclass || '',
      mode: 'pool' as const, pool: [], rolled: false, dice: {},
      base: { ...def.abilities },
      look: { ...def.look },
      background: def.background,
      equipChoices: {},
    });
    const vis = visibleSteps(state);          // 6 or 7 steps, per the imported class
    state.step = vis[vis.length - 1];
    render();
  }

  // state mutation → re-render current step (footer + runes always refresh)
  function update(patch: Partial<CreateState>): void {
    Object.assign(state, patch);
    renderFooter();
    renderStep();
  }
  // silent patch: merges state + refreshes chrome only (keeps input focus alive)
  function patchSilent(patch: Partial<CreateState>): void {
    Object.assign(state, patch);
    renderFooter();
  }

  function go(dir: number): void {
    const v = stepValid(state);
    const vis = visibleSteps(state);
    const pos = vis.indexOf(state.step);
    if (dir > 0) {
      if (!v.ok) return;
      if (pos < 0 || pos >= vis.length - 1) {
        const def = buildDef();
        dispose();
        opts.onDone(def);
        return;
      }
      state.step = vis[pos + 1];
    } else if (dir < 0 && pos > 0) state.step = vis[pos - 1];
    render();
  }

  function renderFooter(): void {
    const v = stepValid(state);
    const vis = visibleSteps(state);
    const isLast = state.step === vis[vis.length - 1];
    const isFirst = state.step === vis[0];
    hint.textContent = v.ok ? '' : v.hint;
    hint.classList.toggle('show', !v.ok);
    backBtn.disabled = isFirst;
    nextBtn.textContent = isLast ? 'BEGIN THE REACH' : 'NEXT';
    nextBtn.classList.toggle('begin', isLast);
    nextBtn.disabled = !v.ok;
  }

  function renderStep(): void {
    stepContent.classList.remove('anim');
    renderStepBody(stepContent, ctx);
    void stepContent.offsetWidth; // restart the 150ms entrance fade
    stepContent.classList.add('anim');
  }

  function render(): void {
    const meta = STEP_META[state.step];
    stepTitle.textContent = meta.title;
    stepSub.textContent = meta.sub;
    const vis = visibleSteps(state);
    const pos = vis.indexOf(state.step);
    const nextVis = pos >= 0 ? vis[pos + 1] : undefined;
    runes.replaceChildren(...vis.map((i) => {
      const m = STEP_META[i];
      const cls = i < state.step ? 'done' : i === state.step ? 'cur' : 'next';
      return h('div', {
        class: `cr-step ${cls}`, role: 'button',
        onclick: () => { if (i < state.step || (i === nextVis && stepValid(state).ok)) ctx.goTo(i); },
      },
        h('span', { class: 'cr-step-rune', html: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${m.rune}"/></svg>` }),
        h('span', { class: 'cr-step-label', text: m.label.toUpperCase() }));
    }));
    renderStep();
    renderFooter();
  }

  render();
  return { root, dispose, applyDef };
}

// ── validation + IO (module-level, pure where possible) ──────────────────────
const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** Validates an imported def (accepts wrapped `{format:'ashenreach.character', def}` or bare). */
export function validateCharacterDef(raw: unknown): { ok: boolean; def: CharacterDef | null; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) return { ok: false, def: null, errors: ['Not a character scroll (JSON object expected).'] };
  const d = raw as Record<string, unknown>;
  const src = (d.format === 'ashenreach.character' && d.def && typeof d.def === 'object' ? d.def : d) as Record<string, unknown>;

  const name = typeof src.name === 'string' ? src.name.trim().slice(0, 24) : '';
  if (name.length < 2) errors.push('Name must be at least two letters.');
  const race = String(src.race || '');
  if (!RACES.some((r) => r.id === race)) errors.push(`Unknown race "${race}".`);
  const cls = String(src.class ?? src.charClass ?? '');
  if (!CLASSES.some((c) => c.id === cls)) errors.push(`Unknown class "${cls}".`);
  // optional level-1 path — must match the class's choices when present
  let subclass: string | undefined;
  const subIn = src.subclass ?? src.subclassName ?? src.path;
  if (subIn !== undefined && subIn !== null && String(subIn).trim() !== '') {
    const sc = String(subIn).trim();
    if ((SUBCLASSES[cls] || []).some((x) => x.id === sc)) subclass = sc;
    else errors.push(`Unknown ${cls || 'class'} path "${sc}".`);
  }
  const level = Math.max(1, Math.min(20, Math.round(Number(src.level ?? 1)) || 1));
  const background = String(src.background || '');
  if (!BACKGROUNDS.some((b) => b.id === background)) errors.push(`Unknown background "${background}".`);

  const abilIn = (src.abilities ?? {}) as Record<string, unknown>;
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  for (const k of ABILITY_KEYS) {
    const v = Number(abilIn[k]);
    if (!Number.isFinite(v) || v < 1 || v > 20) errors.push(`Ability ${k.toUpperCase()} must be a number 1–20.`);
    else abilities[k] = Math.round(v);
  }

  const lookIn = (src.look ?? {}) as Record<string, unknown>;
  const genders = ['masculine', 'feminine'];
  const gender = genders.includes(String(lookIn.gender)) ? (lookIn.gender as CharacterDef['look']['gender']) : 'masculine';
  const bodyTypes = ['slim', 'normal', 'heavy'];
  const bodyType = bodyTypes.includes(String(lookIn.bodyType)) ? lookIn.bodyType as CharacterDef['look']['bodyType'] : 'normal';
  if (lookIn.bodyType !== undefined && !bodyTypes.includes(String(lookIn.bodyType))) errors.push('bodyType must be slim | normal | heavy.');
  const clampIdx = (v: unknown, max: number): number => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  const faceDecors = ['none', 'scars', 'runes', 'warpaint', 'freckles', 'skull'];
  const faceDecor = faceDecors.includes(String(lookIn.faceDecor)) ? lookIn.faceDecor as CharacterDef['look']['faceDecor'] : 'none';
  if (lookIn.faceDecor !== undefined && !faceDecors.includes(String(lookIn.faceDecor))) errors.push('faceDecor must be none | scars | runes | warpaint | freckles | skull.');
  const look: CharacterDef['look'] = {
    gender,
    bodyType,
    skinTone: clampIdx(lookIn.skinTone, SKIN_TONES.length - 1),
    hairStyle: clampIdx(lookIn.hairStyle, HAIR_STYLES.length - 1),
    hairColor: clampIdx(lookIn.hairColor, HAIR_COLORS.length - 1),
    cloakColor: clampIdx(lookIn.cloakColor, CLOAK_COLORS.length - 1),
    eyeColor: clampIdx(lookIn.eyeColor, EYE_COLORS.length - 1),
    faceDecor,
  };

  if (errors.length) return { ok: false, def: null, errors };
  return { ok: true, def: { name, race, class: cls, ...(subclass ? { subclass } : {}), level, abilities, background, look }, errors: [] };
}

function importJSONText(text: string): { ok: boolean; errors: string[] } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, errors: ['The scroll is not valid JSON.'] }; }
  const res = validateCharacterDef(raw);
  if (!res.ok || !res.def) return { ok: false, errors: res.errors };
  if (!active) return { ok: false, errors: ['The forge is cold.'] };
  active.applyDef(res.def);
  return { ok: true, errors: [] };
}

// ── ?page=create self-mount (QA screenshots — IMPORTANT) ─────────────────────
if (typeof document !== 'undefined' && typeof location !== 'undefined') {
  try {
    if (new URLSearchParams(location.search).get('page') === 'create') {
      const boot = () => {
        mountCreation(document.body, {
          onDone: (def) => {
            (window as unknown as Record<string, unknown>).__AR_LAST_DEF__ = def;
            console.log('[ashenreach] character complete:', JSON.stringify(def));
            showQaComplete(def);
          },
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
      else boot();
    }
  } catch { /* SSR/QA harness safety */ }
}

function showQaComplete(def: CharacterDef): void {
  ensureCSS();
  const root = h('div', { class: 'cr-qa-done' },
    h('div', { class: 'cr-panel' },
      h('div', { class: 'cr-panel-title', text: 'THE OATH IS SPOKEN' }),
      h('div', { class: 'cr-panel-sub', text: 'CharacterDef handed to the session flow — also at window.__AR_LAST_DEF__' }),
      h('pre', { class: 'cr-qa-json', text: JSON.stringify(def, null, 2) }),
      h('div', { class: 'cr-oath-actions' },
        h('button', {
          class: 'cr-btn cr-btn-ghost',
          onclick: () => {
            void navigator.clipboard?.writeText(JSON.stringify(def, null, 2)).catch(() => undefined);
          },
        }, 'COPY JSON'),
        h('button', {
          class: 'cr-btn cr-btn-primary',
          onclick: () => {
            root.remove();
            mountCreation(document.body, {
              onDone: (d) => {
                (window as unknown as Record<string, unknown>).__AR_LAST_DEF__ = d;
                showQaComplete(d);
              },
            });
          },
        }, 'FORGE ANOTHER'))));
  document.body.append(root);
}
