// ═══════════════════════════════════════════════════════════════════════════
// steps.ts — the step renderers of the character creation wizard (T2-e, FIX 6).
// Pure vanilla DOM; no framework. Each renderer receives a StepCtx (state +
// callbacks owned by creation.ts) and rebuilds its markup on every state change.
// Steps: 0 ORIGIN (name+race) · 1 CALLING (class) · 2 PATH (subclass — only for
//        classes that choose at level 1: Cleric / Sorcerer / Warlock) ·
//        3 FATE (abilities) · 4 VISAGE (appearance) · 5 PAST (background+kit) ·
//        6 OATH (review). The wizard runs 6 or 7 steps depending on the class —
//        visibleSteps() below is the single source of truth for that.
// ═══════════════════════════════════════════════════════════════════════════
import {
  RACES, CLASSES, BACKGROUNDS, ABILITY_KEYS, ABILITY_INFO, PACKS,
  SUBCLASSES, hasLevel1Subclass,
  abilityMod, modStr, pointBuySpent, POINT_BUY_TOTAL, roll4d6, racialAsi,
  finalScores, previewHP, previewAC, ClassSigil,
} from './gamedata';
import type { AbilityKey } from './gamedata';
import {
  paintPortrait, hashString, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS,
  CLOAK_COLORS, LookState, BodyType, FaceDecor,
} from './portrait';
import type { CharacterDef } from './creation';

// ── state ────────────────────────────────────────────────────────────────────
export type AbilMode = 'pointbuy' | 'roll' | 'pool';

export interface CreateState {
  step: number;                            // GLOBAL step id (index into STEP_META)
  name: string; race: string; charClass: string;
  subclass: string;                        // level-1 path ('' until chosen)
  mode: AbilMode;
  base: Record<AbilityKey, number>;
  pool: number[];                          // unassigned values (pool mode)
  rolled: boolean;                         // roll mode has completed a roll
  dice: Partial<Record<AbilityKey, number[]>>; // the four dice shown per row
  look: LookState;
  background: string;
  equipChoices: Record<number, number>;    // equipment row → option index
}

export interface StepCtx {
  state: CreateState;
  update: (patch: Partial<CreateState>) => void;      // re-render current step
  patchSilent: (patch: Partial<CreateState>) => void;  // merge state, keep DOM focus (typing)
  goTo: (i: number) => void;
  buildDef: () => CharacterDef;
  exportJSON: () => void;
  importJSONText: (text: string) => { ok: boolean; errors: string[] }; // applies on success
}

export function defaultState(): CreateState {
  return {
    step: 0, name: '', race: '', charClass: '', subclass: '',
    mode: 'pointbuy',
    base: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    pool: [], rolled: false, dice: {},
    look: { bodyType: 'normal', skinTone: 1, hairStyle: 0, hairColor: 1, cloakColor: 0, eyeColor: 0, faceDecor: 'none' },
    background: '', equipChoices: {},
  };
}

export const SPEC_STEP = 2;   // the PATH step id — skipped when the class picks at level 3
export const STEP_META: { id: string; label: string; title: string; sub: string; rune: string }[] = [
  { id: 'origin',  label: 'Origin',  title: 'Name Your Shadow',   sub: 'Every ash-born soul arrives nameless. Choose what the world will whisper.', rune: 'M8 3v18M8 5l8-2M8 11l8-2' },
  { id: 'calling', label: 'Calling', title: 'Choose Your Calling', sub: 'Not a class — a wound, a gift, a burden. Decide how you fight the dark.',    rune: 'M9 21V3M9 3h5q3 2 0 6H9M11 12l5 9' },
  { id: 'path',    label: 'Path',    title: 'Choose Your Path',    sub: 'Your calling demands a choice before the first wound. Take the path — or note where it forks.', rune: 'M12 3v7M12 10l-6 5M12 10l6 5' },
  { id: 'fate',    label: 'Fate',    title: 'Weave Your Fate',    sub: 'Twenty-seven points of light, or trust the dice. The bones never lie twice.', rune: 'M7 3v18M7 3l10 5L7 13' },
  { id: 'visage',  label: 'Visage',  title: 'Shape Your Visage',  sub: 'The face the dark will learn to fear. Paint it in ember and ash.',           rune: 'M12 21V8M12 8L6 3M12 8l6-5' },
  { id: 'past',    label: 'Past',    title: 'Claim Your Past',    sub: 'No one walks into the Ashenreach by accident. Say what you were before.',    rune: 'M12 3l6 6-6 6-6-6zM8 13l-3 8M16 13l3 8' },
  { id: 'oath',    label: 'Oath',    title: 'Speak the Oath',     sub: 'Read the ledger of your soul. Then step through, and do not look back.',     rune: 'M4 8l16 8M20 8L4 16' },
];

/** Visible step ids for the current class — 7 steps when the class chooses its
 *  path at level 1 (Cleric / Sorcerer / Warlock), 6 otherwise. Single source of
 *  truth for the progress runes, next/back navigation and step clamping. */
export function visibleSteps(state: CreateState): number[] {
  const spec = hasLevel1Subclass(state.charClass);
  return STEP_META.map((_, i) => i).filter((i) => i !== SPEC_STEP || spec);
}
export function stepCount(state: CreateState): number { return visibleSteps(state).length; }

// ── tiny DOM kit ─────────────────────────────────────────────────────────────
type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | ((e: Event) => void)>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs?: Attrs | null, ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'text') el.textContent = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'disabled') (el as HTMLButtonElement).disabled = true;
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) {
    el.append(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  return el;
}

const NS = 'http://www.w3.org/2000/svg';
function svgEl(children: string, attrs?: Record<string, string>): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.7');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  for (const [k, v] of Object.entries(attrs || {})) s.setAttribute(k, v);
  s.innerHTML = children; // static, trusted strings only (our own SVG paths)
  return s;
}

// class sigils — sword / arcane eye / dagger / holy flame / spark / pact / axe
// (FIX 6 additions: song / leaf / fist / sun / arrow / gear for the new classes)
export function classSigil(kind: ClassSigil, size = 30): SVGSVGElement {
  const paths: Record<ClassSigil, string> = {
    sword: '<path d="M12 2v13"/><path d="M8.5 13.5h7"/><path d="M12 15.5v4.5"/><path d="M10 20h4"/><path d="M12 2l-1.6 3h3.2z"/>',
    eye: '<path d="M2 13q10-9 20 0-10 9-20 0z"/><circle cx="12" cy="13" r="3"/><path d="M12 5.5v-2M6.5 7.5L5 6M17.5 7.5L19 6"/>',
    dagger: '<path d="M12 3l3 6-3 9-3-9z"/><path d="M7.5 9h9"/><path d="M12 18v3"/>',
    flame: '<path d="M12 2.5c3 4 6 6 4.5 11-.8 3-3 4.5-4.5 7-1.5-2.5-3.7-4-4.5-7C6 8.5 9 6.5 12 2.5z"/><path d="M12 12c1.4 1.6 1.6 3.4.2 5.2"/>',
    spark: '<path d="M12 2l1.8 7.2L22 12l-8.2 2.8L12 22l-1.8-7.2L2 12l8.2-2.8z"/>',
    pact: '<path d="M12 3.5L20 18H4z"/><circle cx="12" cy="14.5" r="2.6"/><path d="M12 3.5V9"/>',
    axe: '<path d="M9 21L16 5"/><path d="M16 5q5 2 4 7-3-2-6-1 1-3 2-6z"/>',
    song: '<circle cx="8.5" cy="17.5" r="3"/><path d="M11.5 17.5V4l7.5 2.2"/><path d="M11.5 9.5l7.5 2.2"/>',
    leaf: '<path d="M19 4C9 4 4 9 4 15c0 3 2 5 5 5 6 0 10-6 10-16z"/><path d="M9 20c2-6 5-10 9-13"/>',
    fist: '<path d="M7 11V7a2 2 0 0 1 4 0v3"/><path d="M11 10V6a2 2 0 0 1 4 0v4"/><path d="M15 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    arrow: '<path d="M4 20L20 4"/><path d="M20 4h-7M20 4v7"/><path d="M9 11l4 4"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  };
  return svgEl(paths[kind], { width: String(size), height: String(size) });
}

// race marks (abstract strokes) — every race maps onto a family mark
const RACE_MARKS: Record<string, string> = {
  human: '<circle cx="12" cy="8" r="4"/><path d="M4.5 19.5q7.5-8 15 0"/>',
  elf: '<path d="M9 3.5q8 2.5 7 13-6-4-7-13z"/><path d="M11 10l3.5 1.5"/>',
  dwarf: '<path d="M4 18.5h16"/><path d="M7 18.5L10 7l3 5 2-7 2 13.5"/>',
  halfling: '<circle cx="8" cy="9.5" r="3.2"/><circle cx="16" cy="9.5" r="3.2"/><circle cx="12" cy="15" r="3.2"/>',
  orc: '<path d="M9 5.5q-2 7 2 13M15 5.5q2 7-2 13"/><path d="M7 5q5-2.5 10 0"/>',
  horns: '<path d="M7 4q-3 7 2.5 11M17 4q3 7-2.5 11"/><path d="M7 4q5-2.5 10 0"/><circle cx="12" cy="12.5" r="3"/>',
  halo: '<circle cx="12" cy="8" r="4"/><path d="M6 4q6-3 12 0"/><path d="M4.5 19.5q7.5-6 15 0"/>',
  scale: '<path d="M12 3l7 5-3 9H8L5 8z"/><path d="M9 17l-1.5 4M15 17l1.5 4"/>',
  serpent: '<path d="M5 18q4 3 7 0t7 0"/><circle cx="17.5" cy="12.5" r="1.8"/><path d="M5 18q-2-1-1.5-4"/>',
  wing: '<path d="M12 5v13"/><path d="M12 6L4 4q-2 8 8 10M12 6l8-2q2 8-8 10"/>',
  beast: '<path d="M8 5q-3 3 0 7M16 5q3 3 0 7"/><circle cx="12" cy="14" r="4"/>',
  leaf: '<path d="M19 5C10 5 5 10 5 15c0 2.5 1.5 4 4 4 5.5 0 10-5 10-14z"/><path d="M9 19c1.5-5 4-8.5 8-11"/>',
  element: '<path d="M12 3q6 6 0 9t0 9"/><path d="M12 6.5q-4 3.5 0 6t0 6"/>',
  construct: '<rect x="6.5" y="7.5" width="11" height="9" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M9.5 3v4M14.5 3v4M9.5 16.5v4M14.5 16.5v4"/>',
  amorph: '<path d="M12 4q6 1 7 7-1 6-7 8-6-2-7-8 1-6 7-7z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="13" r="1.4"/>',
};
// 42-race → family map (FIX 6) — nearest existing look, families stay abstract
const RACE_MARK_FAMILY: Record<string, string> = {
  Human: 'human', 'Half-Elf': 'human', 'Custom Lineage': 'human', Reborn: 'human', Giff: 'human',
  Elf: 'elf', 'Astral Elf': 'elf', Aasimar: 'halo', Owlin: 'wing', Fairy: 'wing',
  Dwarf: 'dwarf', Halfling: 'halfling', Gnome: 'halfling', 'Deep Gnome': 'halfling',
  Goblin: 'halfling', Kobold: 'halfling', Verdan: 'halfling', Autognome: 'construct',
  'Half-Orc': 'orc', Orc: 'orc', Goliath: 'orc', Bugbear: 'orc', Hobgoblin: 'orc',
  Leonin: 'orc', 'Thri-kreen': 'orc', Harengon: 'beast', Tabaxi: 'beast', Satyr: 'beast', Hadozee: 'beast',
  Tiefling: 'horns', Hexblood: 'horns', Dhampir: 'horns',
  Dragonborn: 'scale', 'Gem Dragonborn': 'scale', Lizardfolk: 'scale', 'Yuan-ti Pureblood': 'serpent',
  Aarakocra: 'wing', Kenku: 'wing', Firbolg: 'leaf', Genasi: 'element', Plasmoid: 'amorph',
};
function raceMark(race: string): SVGSVGElement {
  const fam = RACE_MARK_FAMILY[race] || 'human';
  return svgEl(RACE_MARKS[fam] || RACE_MARKS.human, { width: '22', height: '22' });
}

function icon(kind: 'chevL' | 'chevR' | 'download' | 'upload' | 'check' | 'warn' | 'dice' | 'brand' | 'sparkle', size = 16): SVGSVGElement {
  const paths = {
    chevL: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
    download: '<path d="M12 4v10M8 10.5L12 14.5l4-4"/><path d="M5 19h14"/>',
    upload: '<path d="M12 14V4M8 7.5L12 3.5l4 4"/><path d="M5 19h14"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    warn: '<path d="M12 3.5L22 20H2z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r="0.4"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor"/>',
    brand: '<path d="M12 2.5l2.4 5.6L20 10.5l-5.6 2.4L12 18.5l-2.4-5.6L4 10.5l5.6-2.4z"/>',
    sparkle: '<path d="M12 4l1.2 4.8L18 10l-4.8 1.2L12 16l-1.2-4.8L6 10l4.8-1.2z"/>',
  };
  return svgEl(paths[kind], { width: String(size), height: String(size) });
}

// a single d6 face — square + pips, no emoji
function dieFace(n: number, size = 26): SVGSVGElement {
  const P: Record<number, [number, number][]> = {
    1: [[12, 12]], 2: [[8, 8], [16, 16]], 3: [[8, 8], [12, 12], [16, 16]],
    4: [[8, 8], [16, 8], [8, 16], [16, 16]], 5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]],
    6: [[8, 7], [16, 7], [8, 12], [16, 12], [8, 17], [16, 17]],
  };
  const pips = (P[n] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="currentColor" stroke="none"/>`).join('');
  return svgEl(`<rect x="3" y="3" width="18" height="18" rx="3.5"/>${pips}`, { width: String(size), height: String(size) });
}

// ── shared bits ──────────────────────────────────────────────────────────────
const NAME_POOL = ['Osric', 'Mara', 'Thorne', 'Vesper', 'Kael', 'Isolde', 'Bram', 'Sera', 'Dain', 'Lyra',
  'Corvus', 'Elowen', 'Hask', 'Nyra', 'Aldric', 'Runa', 'Grimm', 'Selene', 'Varek', 'Wren'];

function panel(title: string, sub: string, ...kids: Child[]) {
  return h('div', { class: 'cr-panel' },
    h('div', { class: 'cr-panel-head' },
      h('div', { class: 'cr-panel-title', text: title }),
      sub ? h('div', { class: 'cr-panel-sub', text: sub }) : null),
    ...kids);
}

function chip(text: string, cls = ''): HTMLElement { return h('span', { class: `cr-chip ${cls}`, text }); }

function asiChips(raceId: string): HTMLElement[] {
  const asi = racialAsi(raceId);
  return ABILITY_KEYS.filter((k) => asi[k] !== 0)
    .map((k) => chip(`${modStr(asi[k])} ${ABILITY_INFO[k].abbr}`, 'gold'));
}

function equipRowOptions(row: string): string[] {
  const r = row.replace(/\(([a-c])\)\s*/gi, '').trim();
  const orParts = r.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of orParts) {
    if (p.includes(',')) for (const q of p.split(',').map((s) => s.trim()).filter(Boolean)) out.push(q);
    else out.push(p);
  }
  return out.length ? out : [r];
}

function chosenEquipTexts(state: CreateState): string[] {
  const cls = CLASSES.find((c) => c.id === state.charClass);
  if (!cls) return [];
  return cls.equipment.map((row, i) => {
    const opts = equipRowOptions(row);
    return opts[Math.min(state.equipChoices[i] ?? 0, opts.length - 1)];
  });
}

function portraitCanvas(state: CreateState, displayW: number): HTMLCanvasElement {
  const c = h('canvas', { class: 'cr-portrait-canvas', width: '512', height: '640' }) as HTMLCanvasElement;
  c.style.width = `${displayW}px`;
  c.style.height = `${Math.round(displayW * 1.25)}px`;
  paintPortrait(c, {
    race: state.race || 'Human', class: state.charClass || 'Fighter', look: state.look,
    seed: hashString(state.name || 'nameless') ^ 0x5a17,
  });
  return c;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 0 — ORIGIN (name + race)
// ═════════════════════════════════════════════════════════════════════════════
function stepOrigin(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const raceGrid = h('div', { class: 'cr-cards cr-race-grid' });
  for (const r of RACES) {
    raceGrid.append(h('button', {
      class: `cr-card ${s.race === r.id ? 'sel' : ''}`,
      onclick: () => ctx.update({ race: r.id }),
    },
      h('span', { class: 'cr-card-mark' }, raceMark(r.id)),
      h('span', { class: 'cr-card-name', text: r.id }),
      h('span', { class: 'cr-card-meta' }, ...asiChips(r.id)),
      h('span', { class: 'cr-card-flavor', text: r.flavor }),
    ));
  }

  const nameHint = h('div', { class: 'cr-error', text: 'A name of at least two letters, ash-born.' });
  nameHint.style.display = 'none';
  const nameRow = h('div', { class: 'cr-field' },
    h('label', { class: 'cr-label', text: 'Character Name' }),
    h('div', { class: 'cr-name-row' },
      h('input', {
        class: 'cr-input', type: 'text', placeholder: 'e.g. Osric of the Ash', maxlength: 24,
        value: s.name,
        oninput: (e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          ctx.patchSilent({ name: v });          // silent — keeps the caret alive
          nameHint.style.display = v.trim().length < 2 ? '' : 'none';
        },
      }),
      h('button', {
        class: 'cr-btn cr-btn-ghost cr-dice-btn', title: 'Draw a name from the grave',
        onclick: () => ctx.update({ name: NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)] }),
      }, icon('sparkle')),
    ),
    nameHint,
  );

  const race = RACES.find((r) => r.id === s.race);
  const aside = race
    ? panel(race.id.toUpperCase(), race.flavor,
        h('div', { class: 'cr-chiprow' },
          chip(`${race.speed} ft speed`), chip(race.size),
          race.darkvision ? chip(`Darkvision ${race.darkvision} ft`) : null,
          ...race.languages.map((l) => chip(l)),
          race.subrace ? chip(`Lineage: ${race.subrace.name}`, 'gold') : null),
        race.traits.length
          ? h('div', { class: 'cr-traitlist' },
              ...race.traits.map((t) => h('div', { class: 'cr-trait' },
                h('div', { class: 'cr-trait-name', text: t.name }),
                h('div', { class: 'cr-trait-desc', text: t.desc }))))
          : h('div', { class: 'cr-panel-empty', text: 'This bloodline carries its gifts by lineage — the details arrive with your subrace at the table.' }))
    : panel('CHOOSE A BLOODLINE', 'Every race remembers the Ashenreach differently.',
        h('div', { class: 'cr-panel-empty', text: 'Select a race to read its grim inheritance — ability bonuses, traits, and the speed of its blood.' }));

  body.append(
    h('div', { class: 'cr-cols' },
      h('div', { class: 'cr-main' },
        nameRow,
        h('div', { class: 'cr-label', text: 'Bloodline' }),
        raceGrid),
      h('div', { class: 'cr-aside' }, aside)));
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 1 — CALLING (class)
// ═════════════════════════════════════════════════════════════════════════════
function stepCalling(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const grid = h('div', { class: 'cr-cards cr-class-grid' });
  for (const c of CLASSES) {
    grid.append(h('button', {
      class: `cr-card cr-class-card ${s.charClass === c.id ? 'sel' : ''}`,
      onclick: () => ctx.update({ charClass: c.id, subclass: '', equipChoices: {} }),
    },
      h('span', { class: 'cr-card-mark sigil' }, classSigil(c.sigil, 34)),
      h('span', { class: 'cr-card-name', text: c.id }),
      h('span', { class: 'cr-card-meta' },
        chip(`d${c.hitDie} hit die`), chip(c.primary.join(' or '))),
      h('span', { class: 'cr-card-flavor', text: c.flavor }),
    ));
  }

  const c = CLASSES.find((x) => x.id === s.charClass);
  const aside = c
    ? panel(c.id.toUpperCase(), c.flavor,
        h('div', { class: 'cr-chiprow' },
          chip(`Hit die d${c.hitDie}`, 'gold'),
          chip(`Primary: ${c.primary.join(' / ')}`),
          chip(`Saves: ${c.saves.join(', ')}`),
          c.skills ? chip(`${c.skills.count} skills of choice`) : null,
          hasLevel1Subclass(c.id) ? chip('path chosen next', 'gold') : chip('path at level 3')),
        h('div', { class: 'cr-block' },
          h('div', { class: 'cr-block-title', text: 'Proficiencies' }),
          c.armor.length ? h('div', { class: 'cr-kv' }, h('b', { text: 'Armor' }), h('span', { text: c.armor.join(', ') })) : null,
          h('div', { class: 'cr-kv' }, h('b', { text: 'Weapons' }), h('span', { text: c.weapons.join(', ') })),
          c.tools.length ? h('div', { class: 'cr-kv' }, h('b', { text: 'Tools' }), h('span', { text: c.tools.join(', ') })) : null),
        h('div', { class: 'cr-block' },
          h('div', { class: 'cr-block-title', text: 'Level 1 Features' }),
          ...c.features.map((f) => h('div', { class: 'cr-trait' },
            h('div', { class: 'cr-trait-name', text: f.name }),
            h('div', { class: 'cr-trait-desc', text: f.desc })))),
        c.spellNote ? h('div', { class: 'cr-spellnote' }, icon('sparkle'), h('span', { text: `${c.spellAbility} spellcasting — ${c.spellNote}` })) : null,
        !hasLevel1Subclass(c.id)
          ? h('div', { class: 'cr-hint', text: 'Your path (subclass) is chosen at 3rd level — the forge records it then.' })
          : null,
      )
    : panel('CHOOSE A CALLING', 'Steel, shadow, or something older.',
        h('div', { class: 'cr-panel-empty', text: 'Select a class to study its hit die, proficiencies, and first-flame features.' }));

  body.append(h('div', { class: 'cr-cols' }, h('div', { class: 'cr-main' }, grid), h('div', { class: 'cr-aside' }, aside)));
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 2 — PATH (subclass — only classes that choose at level 1)
// ═════════════════════════════════════════════════════════════════════════════
function stepSpec(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const subs = SUBCLASSES[s.charClass] || [];
  const cls = CLASSES.find((x) => x.id === s.charClass);

  if (!subs.length) {
    // defensive: the step is skipped for these classes (visibleSteps), but if
    // state lands here (bad import, class swap) show the fork note, not a crash
    body.append(h('div', { class: 'cr-cols' },
      h('div', { class: 'cr-main' },
        panel('THE PATH FORKS AT 3RD LEVEL',
          cls ? `${cls.flavor} Your specialization is chosen at 3rd level, when the wound has scarred over.` : '',
          h('div', { class: 'cr-panel-empty', text: 'Nothing to choose here yet — step onward.' })))));
    return;
  }

  const grid = h('div', { class: 'cr-cards cr-sub-grid' });
  for (const sub of subs) {
    grid.append(h('button', {
      class: `cr-card cr-sub-card ${s.subclass === sub.id ? 'sel' : ''}`,
      onclick: () => ctx.update({ subclass: sub.id }),
    },
      h('span', { class: 'cr-card-mark sigil' }, classSigil(cls ? cls.sigil : 'spark', 30)),
      h('span', { class: 'cr-card-name', text: sub.name }),
      h('span', { class: 'cr-card-meta' }, chip(sub.feature.name, 'gold')),
      h('span', { class: 'cr-card-flavor', text: sub.flavor }),
    ));
  }

  const sel = subs.find((x) => x.id === s.subclass);
  const aside = sel
    ? panel(sel.name.toUpperCase(), sel.flavor,
        h('div', { class: 'cr-chiprow' },
          chip(`${s.charClass} path`, 'gold'), chip(sel.feature.name)),
        h('div', { class: 'cr-trait' },
          h('div', { class: 'cr-trait-name', text: `Level 1 — ${sel.feature.name}` }),
          h('div', { class: 'cr-trait-desc', text: sel.feature.desc })),
        h('div', { class: 'cr-hint', text: 'The forge sends your path with the character sheet; the wider powers awaken as you level.' }),
      )
    : panel('CHOOSE A PATH', 'The first fork of the calling.',
        h('div', { class: 'cr-panel-empty', text: 'Each path grants a different first gift. Study them before you swear.' }));

  body.append(h('div', { class: 'cr-cols' }, h('div', { class: 'cr-main' }, grid), h('div', { class: 'cr-aside' }, aside)));
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 3 — FATE (abilities: point buy / roll / pool)
// ═════════════════════════════════════════════════════════════════════════════
function stepFate(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const race = s.race || 'Human';
  const asi = racialAsi(race);
  const fin = finalScores(s.base, race);
  const cls = CLASSES.find((c) => c.id === s.charClass);

  const tabs = h('div', { class: 'cr-tabs' },
    h('button', { class: `cr-tab ${s.mode === 'pointbuy' ? 'sel' : ''}`, onclick: () => switchMode('pointbuy') }, 'POINT BUY'),
    h('button', { class: `cr-tab ${s.mode === 'roll' ? 'sel' : ''}`, onclick: () => switchMode('roll') }, 'ROLL 4d6'),
    h('button', { class: `cr-tab ${s.mode === 'pool' ? 'sel' : ''}`, onclick: () => switchMode('pool') }, 'ASSIGN POOL'),
  );

  function switchMode(mode: AbilMode) {
    const patch: Partial<CreateState> = { mode };
    if (mode === 'pointbuy') {
      const base = { ...s.base };
      for (const k of ABILITY_KEYS) base[k] = Math.max(8, Math.min(15, base[k]));
      patch.base = base;
      patch.pool = []; patch.rolled = false; patch.dice = {};
    } else if (mode === 'roll') {
      patch.pool = []; patch.dice = {}; patch.rolled = false;
    } else {
      patch.dice = {}; patch.rolled = false;
      if (s.pool.length === 0 && !Object.keys(s.dice).length) patch.pool = [];
    }
    ctx.update(patch);
  }

  // right-rail computed stats
  const stats: HTMLElement[] = [];
  const stat = (label: string, value: string | number, note?: string) =>
    stats.push(h('div', { class: 'cr-stat' },
      h('div', { class: 'cr-stat-num', text: String(value) }),
      h('div', { class: 'cr-stat-label', text: label }),
      note ? h('div', { class: 'cr-stat-note', text: note }) : null));

  if (cls) {
    stat('Hit Points', previewHP(cls.id, fin.con), `d${cls.hitDie} + CON`);
    stat('Armor Class', previewAC(cls.id, chosenEquipTexts(s), fin.dex, fin.con, fin.wis), 'from starting kit');
    stat('Initiative', modStr(abilityMod(fin.dex)), 'DEX modifier');
    stat('Speed', (RACES.find((r) => r.id === race)?.speed ?? 30) + ' ft', race);
    if (cls.spellAbility) {
      const key = cls.spellAbility.slice(0, 3).toLowerCase() as AbilityKey;
      stat('Spell DC', 8 + 2 + abilityMod(fin[key]), cls.spellAbility);
    }
    stat('Proficiency', '+2', 'level 1');
  }

  // mode rail
  let modeRail: HTMLElement;
  if (s.mode === 'pointbuy') {
    const spent = pointBuySpent(s.base);
    const left = POINT_BUY_TOTAL - spent;
    modeRail = panel('POINTS OF FATE', 'Twenty-seven points, scores 8–15.',
      h('div', { class: 'cr-points' },
        h('div', { class: `cr-points-num ${left === 0 ? 'ok' : left < 0 ? 'bad' : ''}`, text: String(left) }),
        h('div', { class: 'cr-points-label', text: 'points unspent' })),
      h('button', {
        class: 'cr-btn cr-btn-ghost cr-full', onclick: () => suggestArray(),
        title: 'Place the standard array on your best abilities',
      }, icon('sparkle'), 'SUGGEST THE STANDARD ARRAY'),
      h('div', { class: 'cr-cost-table' },
        h('span', { text: 'Cost:' }), ...[8, 9, 10, 11, 12, 13, 14, 15].map((n) =>
          h('span', { class: 'cr-cost-cell', text: `${n}·${{ 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }[n]}` }))),
    );
  } else if (s.mode === 'roll') {
    modeRail = panel('THE BONES', '4d6, drop the lowest, in order. Rerolling is between you and the dark.',
      h('button', { class: 'cr-btn cr-btn-primary cr-full', onclick: () => doRoll() }, icon('dice'), s.rolled ? 'ROLL AGAIN' : 'CAST THE DICE'),
      s.rolled ? h('div', { class: 'cr-hint', text: 'The bones have spoken. Rearrangement belongs to the pool mode.' }) : h('div', { class: 'cr-hint', text: 'Each row rolls its own 4d6 — lowest die struck through.' }),
    );
  } else {
    modeRail = panel('THE POOL', 'Roll six fates, then set them where they belong.',
      h('button', { class: 'cr-btn cr-btn-primary cr-full', onclick: () => rollPool() }, icon('dice'), 'ROLL THE POOL'),
      h('div', { class: 'cr-pool' },
        ...s.pool.map((v, i) => h('button', { class: 'cr-pool-chip', text: String(v), onclick: () => selectPool(i) })),
        s.pool.length === 0 && Object.values(s.base).every((v) => v > 0)
          ? h('div', { class: 'cr-hint ok', text: 'The pool is spent. Fate is written.' })
          : null),
      h('div', { class: 'cr-hint', text: 'Pick a value, then press an ability to set it. Press a set ability to return it.' }),
    );
  }

  let selectedPool = -1;
  function selectPool(i: number) {
    selectedPool = i;
    body.querySelectorAll('.cr-pool-chip').forEach((el, j) => el.classList.toggle('sel', j === i));
    body.querySelectorAll('.cr-abil-row').forEach((el) => el.classList.add('target'));
  }

  function doRoll() {
    const rows = body.querySelectorAll<HTMLElement>('.cr-abil-row');
    const results: Partial<Record<AbilityKey, number[]>> = {};
    const finals: Record<AbilityKey, number> = { ...s.base };
    for (const k of ABILITY_KEYS) {
      const r = roll4d6();
      results[k] = r.dice;
      finals[k] = r.total;
    }
    // flicker dice faces, staggered per row, then commit
    rows.forEach((row, ri) => {
      row.classList.add('rolling');
      const dice = row.querySelectorAll<HTMLElement>('.cr-die');
      const start = performance.now() + ri * 90;
      const dur = 560;
      const iv = window.setInterval(() => {
        const t = (performance.now() - start) / dur;
        dice.forEach((d) => {
          d.replaceChildren(dieFace(1 + Math.floor(Math.random() * 6)));
          d.classList.remove('dropped');
        });
        if (performance.now() - start > dur) {
          window.clearInterval(iv);
          const k = ABILITY_KEYS[ri];
          const ds = (results[k] || []).slice().sort((a, b) => a - b);
          dice.forEach((d, j) => {
            d.replaceChildren(dieFace(ds[j]));
            d.classList.toggle('dropped', j === 0);
          });
          row.classList.remove('rolling');
        }
      }, 70);
    });
    window.setTimeout(() => ctx.update({ base: finals, dice: results, rolled: true }), 560 + 5 * 90 + 80);
  }

  function rollPool() {
    const pool = Array.from({ length: 6 }, () => roll4d6().total).sort((a, b) => b - a);
    ctx.update({ pool, base: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
  }

  function suggestArray() {
    const cls2 = CLASSES.find((c) => c.id === s.charClass);
    const order: AbilityKey[] = [];
    const push = (k?: AbilityKey) => { if (k && !order.includes(k)) order.push(k); };
    if (cls2) {
      for (const p of cls2.primary) push(p.slice(0, 3).toLowerCase() as AbilityKey);
      push('con'); push('dex');
      for (const k of ABILITY_KEYS) push(k);
    } else order.push(...ABILITY_KEYS);
    const arr = [15, 14, 13, 12, 10, 8];
    const base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    order.slice(0, 6).forEach((k, i) => { base[k] = arr[i]; });
    ctx.update({ base });
  }

  // ability table
  const table = h('div', { class: 'cr-abil-table' });
  for (const k of ABILITY_KEYS) {
    const info = ABILITY_INFO[k];
    let control: HTMLElement;
    if (s.mode === 'pointbuy') {
      control = h('div', { class: 'cr-stepper' },
        h('button', { class: 'cr-step-btn', disabled: s.base[k] <= 8, onclick: () => bump(k, -1), text: '–' }),
        h('span', { class: 'cr-step-val', text: String(s.base[k]) }),
        h('button', { class: 'cr-step-btn', disabled: s.base[k] >= 15, onclick: () => bump(k, +1), text: '+' }),
      );
    } else if (s.mode === 'roll') {
      const ds = (s.dice[k] || []).slice().sort((a, b) => a - b);
      control = h('div', { class: 'cr-dice-row' },
        ...(s.rolled && ds.length === 4
          ? ds.map((d, i) => h('span', { class: `cr-die ${i === 0 ? 'dropped' : ''}` }, dieFace(d)))
          : Array.from({ length: 4 }, () => h('span', { class: 'cr-die blank' }, dieFace(1 + Math.floor(Math.random() * 6))))),
        h('span', { class: 'cr-die-sum', text: s.rolled && ds.length === 4 ? String(s.base[k]) : '·' }));
    } else {
      const assigned = s.base[k] > 0;
      control = h('button', {
        class: `cr-pool-slot ${assigned ? 'set' : ''}`,
        onclick: () => {
          if (selectedPool >= 0 && s.pool[selectedPool] !== undefined) {
            const pool = s.pool.slice();
            const val = pool.splice(selectedPool, 1)[0];
            const base = { ...s.base, [k]: val };
            selectedPool = -1;
            ctx.update({ pool, base });
          } else if (assigned) {
            const pool = [...s.pool, s.base[k]];
            const base = { ...s.base, [k]: 0 };
            ctx.update({ pool, base });
          }
        },
      }, assigned ? String(s.base[k]) : '— set —');
    }

    table.append(h('div', { class: 'cr-abil-row' },
      h('div', { class: 'cr-abil-name' },
        h('b', { text: info.name }),
        h('span', { class: 'cr-abbr', text: info.abbr }),
        h('span', { class: 'cr-abil-affects', text: info.affects.slice(0, 3).join(' · ') })),
      control,
      asi[k] !== 0 ? h('span', { class: 'cr-asi-chip', text: `${modStr(asi[k])} ${s.race || 'race'}` }) : h('span', { class: 'cr-asi-chip dim', text: '±0' }),
      h('span', { class: 'cr-abil-final', text: s.base[k] > 0 ? String(fin[k]) : '·' }),
      h('span', { class: 'cr-abil-mod', text: s.base[k] > 0 ? modStr(abilityMod(fin[k])) : '·' }),
    ));
  }

  function bump(k: AbilityKey, d: number) {
    const next = s.base[k] + d;
    if (next < 8 || next > 15) return;
    if (pointBuySpent({ ...s.base, [k]: next } as Record<AbilityKey, number>) > POINT_BUY_TOTAL) return;
    ctx.update({ base: { ...s.base, [k]: next } });
  }

  body.append(
    h('div', { class: 'cr-cols' },
      h('div', { class: 'cr-main' }, tabs, table),
      h('div', { class: 'cr-aside' },
        modeRail,
        panel('THE MATH', 'What the numbers move.',
          h('div', { class: 'cr-statgrid' }, ...stats)))));
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 4 — VISAGE (appearance + live portrait)
// ═════════════════════════════════════════════════════════════════════════════
function stepVisage(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const look = s.look;

  const seg = <T extends string>(opts: { v: T; label: string; sub?: string }[], get: () => T, set: (v: T) => void) =>
    h('div', { class: 'cr-seg' }, ...opts.map((o) =>
      h('button', { class: get() === o.v ? 'sel' : '', onclick: () => set(o.v) },
        h('span', { text: o.label }), o.sub ? h('small', { text: o.sub }) : null)));

  const swatches = (tones: { name: string; light?: string; base?: string; shadow?: string; iris?: string; glow?: string }[],
                     get: () => number, set: (i: number) => void) =>
    h('div', { class: 'cr-swatches' }, ...tones.map((t, i) => {
      const b = h('button', {
        class: `cr-swatch ${get() === i ? 'sel' : ''}`, title: t.name,
        onclick: () => set(i),
      });
      (b as HTMLElement).style.background = t.iris
        ? `radial-gradient(circle at 35% 32%, ${t.glow}, ${t.iris} 55%, #000 140%)`
        : `linear-gradient(150deg, ${t.light || t.base}, ${t.base} 55%, ${t.shadow || t.base})`;
      return b;
    }));

  const styleGlyph = (i: number): SVGSVGElement => {
    const paths = [
      '<path d="M5 9q7-8 14 0"/><path d="M5 9q2 3 7 3t7-3"/>',                              // cropped
      '<circle cx="12" cy="7" r="3.4"/><path d="M8 10q4 5 8 0"/><path d="M12 10v7"/>',        // topknot
      '<path d="M6 6q6-6 12 0"/><path d="M6 6q-2 8 1 14M18 6q2 8-1 14"/>',                    // long
      '<path d="M6 6q6-6 12 0"/><path d="M7 7l-1.6 3.2L7 13l-1.6 3.2L7 19M17 7l1.6 3.2L17 13l1.6 3.2L17 19"/>', // braids
      '<path d="M6 9q6-5 12 0"/>',                                                             // shaved
    ];
    return svgEl(paths[i] || paths[0], { width: '26', height: '26' });
  };

  const decorNames: Record<FaceDecor, string> = { none: 'Unmarked', scars: 'Scars', runes: 'Runes', warpaint: 'Warpaint' };

  body.append(
    h('div', { class: 'cr-cols cr-visage' },
      h('div', { class: 'cr-portrait-col' },
        h('div', { class: 'cr-portrait-frame' }, portraitCanvas(s, 300)),
        h('div', { class: 'cr-portrait-cap' },
          h('div', { class: 'cr-portrait-name', text: s.name.trim() || 'The Nameless' }),
          h('div', { class: 'cr-portrait-sub', text: `${s.race || '—'} · ${s.charClass || '—'}${s.subclass ? ` · ${s.subclass}` : ''}` }))),
      h('div', { class: 'cr-main cr-visage-controls' },
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Frame' }),
          seg<BodyType>([{ v: 'slim', label: 'Slim' }, { v: 'normal', label: 'Normal' }, { v: 'heavy', label: 'Heavy' }],
            () => look.bodyType, (v) => setLook({ bodyType: v }))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Skin — tones of the ash' }),
          swatches(SKIN_TONES, () => look.skinTone, (i) => setLook({ skinTone: i }))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Hair' }),
          h('div', { class: 'cr-style-cards' }, ...HAIR_STYLES.map((name, i) =>
            h('button', { class: `cr-style-card ${look.hairStyle === i ? 'sel' : ''}`, title: name, onclick: () => setLook({ hairStyle: i }) },
              styleGlyph(i), h('span', { text: name }))))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Hair Color' }),
          swatches(HAIR_COLORS, () => look.hairColor, (i) => setLook({ hairColor: i }))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Eyes — what catches the light' }),
          swatches(EYE_COLORS, () => look.eyeColor, (i) => setLook({ eyeColor: i }))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Cloak' }),
          swatches(CLOAK_COLORS, () => look.cloakColor, (i) => setLook({ cloakColor: i }))),
        h('div', { class: 'cr-ctrl' }, h('div', { class: 'cr-label', text: 'Face Decor' }),
          seg<FaceDecor>((['none', 'scars', 'runes', 'warpaint'] as FaceDecor[]).map((v) => ({ v, label: decorNames[v] })),
            () => look.faceDecor, (v) => setLook({ faceDecor: v }))))));

  function setLook(patch: Partial<LookState>) { ctx.update({ look: { ...look, ...patch } }); }
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 5 — PAST (background + starting equipment)
// ═════════════════════════════════════════════════════════════════════════════
function stepPast(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const grid = h('div', { class: 'cr-cards cr-bg-grid' });
  for (const b of BACKGROUNDS) {
    grid.append(h('button', {
      class: `cr-card cr-bg-card ${s.background === b.id ? 'sel' : ''}`,
      onclick: () => ctx.update({ background: b.id }),
    },
      h('span', { class: 'cr-card-name', text: b.id }),
      h('span', { class: 'cr-card-meta' }, ...b.skills.map((k) => chip(k))),
      h('span', { class: 'cr-card-flavor', text: b.flavor }),
    ));
  }

  const bg = BACKGROUNDS.find((b) => b.id === s.background);
  const bgPanel = bg
    ? panel(bg.id.toUpperCase(), bg.flavor,
        h('div', { class: 'cr-chiprow' },
          ...bg.skills.map((k) => chip(k, 'gold')),
          ...bg.tools.map((k) => chip(k)),
          bg.languages ? chip(`${bg.languages} extra language${bg.languages > 1 ? 's' : ''}`) : null),
        h('div', { class: 'cr-trait' },
          h('div', { class: 'cr-trait-name', text: `Feature — ${bg.feature.name}` }),
          h('div', { class: 'cr-trait-desc', text: bg.feature.desc })),
        h('div', { class: 'cr-block' },
          h('div', { class: 'cr-block-title', text: 'Keepsakes' }),
          h('ul', { class: 'cr-equip-list' }, ...bg.equipment.map((e) => h('li', { text: e })))),
      )
    : panel('CLAIM A PAST', 'What were you, before the Reach called?',
        h('div', { class: 'cr-panel-empty', text: 'Pick a background — its skills, feature and keepsakes are yours.' }));

  // class kit with choices + pack expansion
  const cls = CLASSES.find((c) => c.id === s.charClass);
  const kitPanel = cls
    ? panel(`${cls.id.toUpperCase()} — FIELD KIT`, 'Choose between the alternatives; packs expand to their contents.',
        ...cls.equipment.map((row, i) => {
          const opts = equipRowOptions(row);
          if (opts.length <= 1) {
            return h('div', { class: 'cr-equip-row' }, h('span', { class: 'cr-equip-bullet' }), h('span', { text: opts[0] }), expandPack(opts[0]));
          }
          const sel = Math.min(s.equipChoices[i] ?? 0, opts.length - 1);
          return h('div', { class: 'cr-equip-row choice' },
            h('div', { class: 'cr-equip-opts' }, ...opts.map((o, j) =>
              h('button', {
                class: `cr-equip-opt ${j === sel ? 'sel' : ''}`,
                onclick: () => ctx.update({ equipChoices: { ...s.equipChoices, [i]: j } }),
              }, h('span', { text: `(${String.fromCharCode(97 + j)})` }), h('span', { text: o })))),
            expandPack(opts[sel]));
        }))
    : null;

  body.append(h('div', { class: 'cr-cols' },
    h('div', { class: 'cr-main' }, grid),
    h('div', { class: 'cr-aside' }, bgPanel, kitPanel)));
}

function expandPack(optionText: string): HTMLElement | null {
  const low = optionText.toLowerCase();
  const key = Object.keys(PACKS).find((k) => low.includes(k.toLowerCase()));
  if (!key) return null;
  return h('div', { class: 'cr-equip-pack' },
    h('div', { class: 'cr-equip-pack-title', text: `${key} contains:` }),
    h('div', { class: 'cr-equip-pack-items', text: PACKS[key].join(' · ') }));
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 6 — OATH (review + export/import/begin)
// ═════════════════════════════════════════════════════════════════════════════
function stepOath(body: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  const fin = finalScores(s.base, s.race || 'Human');
  const cls = CLASSES.find((c) => c.id === s.charClass);
  const race = RACES.find((r) => r.id === s.race);
  const bg = BACKGROUNDS.find((b) => b.id === s.background);
  const sub = (SUBCLASSES[s.charClass] || []).find((x) => x.id === s.subclass) || null;
  const equipTexts = chosenEquipTexts(s);

  const lookChips = [
    chip(s.look.bodyType, ''),
    chip(SKIN_TONES[s.look.skinTone % SKIN_TONES.length].name),
    chip(`${HAIR_STYLES[s.look.hairStyle % HAIR_STYLES.length]} hair, ${HAIR_COLORS[s.look.hairColor % HAIR_COLORS.length].name}`),
    chip(`${EYE_COLORS[s.look.eyeColor % EYE_COLORS.length].name} eyes`),
    chip(`${CLOAK_COLORS[s.look.cloakColor % CLOAK_COLORS.length].name} cloak`),
    chip(s.look.faceDecor === 'none' ? 'unmarked face' : s.look.faceDecor),
  ];

  const sheet = h('div', { class: 'cr-sheet' },
    h('div', { class: 'cr-sheet-head' },
      h('div', { class: 'cr-sheet-name', text: s.name.trim() || 'The Nameless' }),
      h('div', { class: 'cr-sheet-sub', text: `Level 1 ${s.race || '—'} ${s.charClass || '—'}${sub ? ` · ${sub.name}` : ''} · ${s.background || '—'}` })),
    h('div', { class: 'cr-sheet-abil' },
      ...ABILITY_KEYS.map((k) => h('div', { class: 'cr-sheet-abil-cell' },
        h('div', { class: 'cr-sheet-abbr', text: ABILITY_INFO[k].abbr }),
        h('div', { class: 'cr-sheet-score', text: String(fin[k]) }),
        h('div', { class: 'cr-sheet-mod', text: modStr(abilityMod(fin[k])) })))),
    h('div', { class: 'cr-statgrid review' },
      h('div', { class: 'cr-stat' }, h('div', { class: 'cr-stat-num', text: String(cls ? previewHP(cls.id, fin.con) : '·') }), h('div', { class: 'cr-stat-label', text: 'Hit Points' })),
      h('div', { class: 'cr-stat' }, h('div', { class: 'cr-stat-num', text: String(cls ? previewAC(cls.id, equipTexts, fin.dex, fin.con, fin.wis) : '·') }), h('div', { class: 'cr-stat-label', text: 'Armor Class' })),
      h('div', { class: 'cr-stat' }, h('div', { class: 'cr-stat-num', text: modStr(abilityMod(fin.dex)) }), h('div', { class: 'cr-stat-label', text: 'Initiative' })),
      h('div', { class: 'cr-stat' }, h('div', { class: 'cr-stat-num', text: `${race?.speed ?? 30} ft` }), h('div', { class: 'cr-stat-label', text: 'Speed' })),
      h('div', { class: 'cr-stat' }, h('div', { class: 'cr-stat-num', text: '+2' }), h('div', { class: 'cr-stat-label', text: 'Proficiency' })),
      ...(cls?.spellAbility ? (() => {
        const key = cls.spellAbility.slice(0, 3).toLowerCase() as AbilityKey;
        return [h('div', { class: 'cr-stat' },
          h('div', { class: 'cr-stat-num', text: String(8 + 2 + abilityMod(fin[key])) }),
          h('div', { class: 'cr-stat-label', text: `Spell DC (${ABILITY_INFO[key].abbr})` }))];
      })() : [])),
    cls ? h('div', { class: 'cr-block' },
      h('div', { class: 'cr-block-title', text: 'Saving Throws' }),
      h('div', { class: 'cr-chiprow' },
        ...ABILITY_KEYS.map((k) => {
          const prof = cls.saves.some((sv) => sv.toLowerCase() === k);
          const total = abilityMod(fin[k]) + (prof ? 2 : 0);
          return chip(`${ABILITY_INFO[k].abbr} ${modStr(total)}${prof ? ' ●' : ''}`, prof ? 'gold' : '');
        }))) : null,
    cls ? h('div', { class: 'cr-block' },
      h('div', { class: 'cr-block-title', text: 'Features at Level 1' }),
      h('div', { class: 'cr-chiprow' }, ...cls.features.map((f) => chip(f.name, 'gold'))),
      sub ? h('div', { class: 'cr-chiprow' }, chip(`${sub.feature.name} (${sub.name})`, 'gold')) : null,
      bg ? h('div', { class: 'cr-chiprow' }, chip(`${bg.feature.name} (${bg.id})`)) : null,
      race ? h('div', { class: 'cr-chiprow' }, ...race.traits.map((t) => chip(t.name))) : null) : null,
    h('div', { class: 'cr-block' },
      h('div', { class: 'cr-block-title', text: 'Kit & Keepsakes' }),
      h('ul', { class: 'cr-equip-list review' },
        ...equipTexts.map((e) => h('li', { text: e })),
        ...(bg ? bg.equipment.map((e) => h('li', { text: e })) : []))));

  body.append(
    h('div', { class: 'cr-cols cr-oath' },
      h('div', { class: 'cr-portrait-col' },
        h('div', { class: 'cr-portrait-frame' }, portraitCanvas(s, 240)),
        h('div', { class: 'cr-portrait-cap' },
          h('div', { class: 'cr-portrait-name', text: s.name.trim() || 'The Nameless' }),
          h('div', { class: 'cr-lookchips' }, ...lookChips))),
      h('div', { class: 'cr-main' },
        h('div', { class: 'cr-oath-actions' },
          h('button', { class: 'cr-btn cr-btn-ghost', onclick: () => ctx.exportJSON() }, icon('download'), 'EXPORT JSON'),
          h('label', { class: 'cr-btn cr-btn-ghost cr-file-btn' }, icon('upload'), 'IMPORT JSON',
            h('input', {
              type: 'file', accept: '.json,application/json',
              onchange: (e: Event) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (!f) return;
                const rd = new FileReader();
                rd.onload = () => {
                  const res = ctx.importJSONText(String(rd.result || ''));
                  if (!res.ok) alert('The scroll is flawed:\n' + res.errors.join('\n'));
                };
                rd.readAsText(f);
              },
            })),
        ),
        sheet)));
}

// ═════════════════════════════════════════════════════════════════════════════
// dispatcher
// ═════════════════════════════════════════════════════════════════════════════
export function renderStepBody(body: HTMLElement, ctx: StepCtx): void {
  body.replaceChildren();
  switch (ctx.state.step) {
    case 0: stepOrigin(body, ctx); break;
    case 1: stepCalling(body, ctx); break;
    case 2: stepSpec(body, ctx); break;      // PATH — only reachable for level-1 choosers
    case 3: stepFate(body, ctx); break;
    case 4: stepVisage(body, ctx); break;
    case 5: stepPast(body, ctx); break;
    case 6: stepOath(body, ctx); break;
  }
}

// per-step validation — controls the NEXT / BEGIN button
export function stepValid(state: CreateState): { ok: boolean; hint: string } {
  switch (state.step) {
    case 0:
      if (state.name.trim().length < 2) return { ok: false, hint: 'Give your shadow a name.' };
      if (!state.race) return { ok: false, hint: 'Choose a bloodline.' };
      return { ok: true, hint: '' };
    case 1:
      return state.charClass ? { ok: true, hint: '' } : { ok: false, hint: 'Choose a calling.' };
    case 2:                                       // PATH (only visible for level-1 choosers)
      if (!hasLevel1Subclass(state.charClass)) return { ok: true, hint: '' };
      return state.subclass ? { ok: true, hint: '' } : { ok: false, hint: 'Choose your path.' };
    case 3: {
      if (state.mode === 'pointbuy') {
        const left = POINT_BUY_TOTAL - pointBuySpent(state.base);
        if (left > 0) return { ok: false, hint: `${left} fate points unspent.` };
        if (left < 0) return { ok: false, hint: 'Too many fate points spent.' };
      }
      if (state.mode === 'roll' && !state.rolled) return { ok: false, hint: 'Cast the dice before you go on.' };
      if (state.mode === 'pool') {
        if (state.pool.length === 0 && ABILITY_KEYS.every((k) => state.base[k] <= 0))
          return { ok: false, hint: 'Roll the pool, then set your fate.' };
        if (state.pool.length > 0) return { ok: false, hint: 'The pool still holds fates.' };
        if (ABILITY_KEYS.some((k) => state.base[k] <= 0)) return { ok: false, hint: 'Every ability needs a value.' };
      }
      return { ok: true, hint: '' };
    }
    case 4:
      return { ok: true, hint: '' };
    case 5:
      return state.background ? { ok: true, hint: '' } : { ok: false, hint: 'Claim a past.' };
    default:
      return { ok: true, hint: '' };
  }
}
