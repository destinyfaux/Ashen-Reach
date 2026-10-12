// ASHENREACH — server/src/rules/CharacterEngine.js
// 5E character math. Plain ESM, zero deps, never throws (defensive defaults).
// Ported from Custom-VTT client/src/utils/CharacterEngine.js (proven sheet math:
// racial bonuses, HP by hit die, AC by armor/shield, spell slots, save proficiencies)
// and rebuilt as a build-once `Sheet` document consumed by CombatEngine + the
// character-creation UI (see SCHEMA.md).
//
// Public API (frozen in docs/CONTRACTS.md):
//   buildCharacter(def) -> Sheet        // full character at any level
//   levelUp(sheet) -> Sheet             // mutate + return (avg HP per level)
//   xpForLevel(n) -> number             // XP threshold to REACH level n
//   buildCombatProfile(sheet) -> slim profile for CombatEngine tokens
//   getAbilityModifier(score), getProficiencyBonus(level)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRD = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'srd_data.json'), 'utf-8'));

export const SCHEMA_VERSION = 'ashenreach.sheet/1';

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// ASHENREACH archetypes -> SRD classes (character creation speaks archetype names)
const CLASS_ALIASES = {
  warden: 'Fighter',
  shadowdancer: 'Rogue',
  ashen_mage: 'Wizard',
  ashenmage: 'Wizard',
  pale_priest: 'Cleric',
  palepriest: 'Cleric'
};

// Curated default spellbooks (SRD) for automated casters. Players can override
// via def.spells / def.equipmentOverrides.spells — see SCHEMA.md.
const DEFAULT_SPELLS = {
  Wizard: {
    cantrips: ['Fire Bolt', 'Light', 'Mage Hand'],
    byLevel: { 1: ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor'] }
  },
  Cleric: {
    cantrips: ['Sacred Flame', 'Guidance', 'Light'],
    byLevel: { 1: ['Cure Wounds', 'Healing Word', 'Bless', 'Guiding Bolt'] }
  },
  Sorcerer: { cantrips: ['Fire Bolt', 'Light'], byLevel: { 1: ['Magic Missile', 'Shield'] } },
  Warlock: { cantrips: ['Eldritch Blast', 'Light'], byLevel: { 1: ['Charm Person', 'Hex'] } },
  Bard: { cantrips: ['Vicious Mockery', 'Light'], byLevel: { 1: ['Healing Word', 'Faerie Fire'] } },
  Druid: { cantrips: ['Shillelagh', 'Produce Flame'], byLevel: { 1: ['Cure Wounds', 'Entangle'] } },
  Paladin: { cantrips: [], byLevel: { 1: ['Bless', 'Cure Wounds'] } },
  Ranger: { cantrips: [], byLevel: { 1: ['Hunter\'s Mark'] } },
  Artificer: { cantrips: ['Fire Bolt'], byLevel: { 1: ['Cure Wounds'] } }
};

// ── core math ────────────────────────────────────────────────────────────────

export const getAbilityModifier = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.floor((n - 10) / 2);
};
const abilityMod = getAbilityModifier;

export const getProficiencyBonus = (level) => {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  return SRD.proficiency_bonus?.[String(l)] || SRD.proficiency_bonus?.[l] || 2;
};

// 5E XP thresholds ("XP to reach level n")
const XP_TABLE = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export function xpForLevel(n) {
  const l = Math.max(1, Math.min(20, Math.round(Number(n) || 1)));
  return XP_TABLE[l] ?? 355000;
}

// ── name / lookup helpers ────────────────────────────────────────────────────

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const titleCase = (s) => String(s || '').replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

function resolveClass(cls) {
  if (!cls) return 'Fighter';
  const key = String(cls).trim();
  const norm = slug(key);
  if (CLASS_ALIASES[norm]) return CLASS_ALIASES[norm];
  // direct case-insensitive match
  for (const k of Object.keys(SRD.classes)) if (k.toLowerCase() === key.toLowerCase()) return k;
  // underscored match ("pale_priest" handled above; "battle_master" etc → fuzzy)
  for (const k of Object.keys(SRD.classes)) if (slug(k) === norm) return k;
  return 'Fighter';
}

function resolveRace(race) {
  if (!race) return 'Human';
  const key = String(race).trim();
  for (const k of Object.keys(SRD.races)) if (k.toLowerCase() === key.toLowerCase()) return k;
  const norm = slug(key);
  for (const k of Object.keys(SRD.races)) if (slug(k) === norm) return k;
  return 'Human';
}

function resolveBackground(bg) {
  if (!bg) return null;
  const key = String(bg).trim();
  for (const k of Object.keys(SRD.backgrounds || {})) if (k.toLowerCase() === key.toLowerCase()) return k;
  const norm = slug(key);
  for (const k of Object.keys(SRD.backgrounds || {})) if (slug(k) === norm) return k;
  return null;
}

// Classes that choose their subclass at level 1 (SRD). Every other class picks
// at level 3 — def.subclass is silently ignored for them, and unknown values
// never throw (the buildCharacter never-throws contract).
const LEVEL1_SUBCLASS_CLASSES = new Set(['Cleric', 'Sorcerer', 'Warlock']);

/** Resolve def.subclass against SRD.classes[className].subclasses for a
 *  level-1 chooser class. Accepts the SRD display name / the creation-wizard
 *  id ("Life Domain" — the wizard's ids ARE the display names), any casing,
 *  slug forms ("life_domain"), the article-stripped name ("fiend" → "The
 *  Fiend") and unique word-prefixes ("life" → "Life Domain"). Returns the
 *  canonical SRD key or null (never throws). */
function resolveSubclass(className, sub) {
  if (!sub || !LEVEL1_SUBCLASS_CLASSES.has(className)) return null;
  const subs = SRD.classes[className]?.subclasses;
  if (!subs) return null;
  const keys = Object.keys(subs);            // own keys only (no prototype hits)
  const raw = String(sub).trim();
  if (!raw) return null;
  let hit = keys.find(k => k === raw || k.toLowerCase() === raw.toLowerCase());
  if (hit) return hit;
  const norm = slug(raw);
  hit = keys.find(k => slug(k) === norm);
  if (hit) return hit;
  const strip = (s) => s.replace(/^the\s+/i, '');
  const stripped = slug(strip(raw));
  if (!stripped) return null;
  hit = keys.find(k => slug(strip(k)) === stripped);
  if (hit) return hit;
  // unique prefix ("life" → life_domain, "draconic" → draconic_bloodline);
  // ambiguous prefixes ("domain") resolve to nothing rather than guessing
  const cands = keys.filter(k => {
    const ks = slug(strip(k));
    return ks.startsWith(stripped + '_') || stripped.startsWith(ks + '_');
  });
  return cands.length === 1 ? cands[0] : null;
}

/** Level-gated subclass feature entries (source: 'subclass') for a resolved
 *  subclass key — same shape as class features plus the source tag. */
function subclassFeatures(className, subclassName, level) {
  const sub = subclassName ? SRD.classes[className]?.subclasses?.[subclassName] : null;
  if (!sub) return [];
  return (sub.features || [])
    .filter(f => (f.level ?? 1) <= level)
    .map(f => ({ level: f.level ?? 1, name: f.name, description: f.description || '', source: 'subclass' }));
}

// Weapon key normalization for proficiency matching ("Crossbow, Light" vs "Light crossbows")
const weaponKey = (name) => String(name || '').toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean).sort().join(' ');

function weaponCatalogEntry(name) {
  for (const cat of Object.keys(SRD.equipment?.weapons || {})) {
    const found = (SRD.equipment.weapons[cat] || []).find(w => w.name && w.name.toLowerCase() === String(name).toLowerCase());
    if (found) return { ...found, category: cat };
  }
  return null;
}

function armorCatalogEntry(name) {
  for (const cat of ['light', 'medium', 'heavy']) {
    const found = (SRD.equipment?.armor?.[cat] || []).find(a => a.name && a.name.toLowerCase() === String(name).toLowerCase());
    if (found) return { ...found, category: cat };
  }
  return null;
}

function isProficientWithWeapon(weaponName, classProfWeapons) {
  const entry = weaponCatalogEntry(weaponName);
  if (!entry) return false;
  const profs = classProfWeapons || [];
  const wKey = weaponKey(weaponName);
  for (const p of profs) {
    const pl = String(p).toLowerCase();
    if (pl === 'simple weapons' && entry.category?.startsWith('simple')) return true;
    if (pl === 'martial weapons' && entry.category?.startsWith('martial')) return true;
    if (pl === 'all weapons') return true;
    // specific: "Daggers", "Rapiers", "Hand crossbows", "Quarterstaffs"...
    if (weaponKey(pl.replace(/s$/, '')) === wKey || weaponKey(pl) === wKey + 's') return true;
    if (pl.replace(/s$/, '') === String(weaponName).toLowerCase()) return true;
  }
  return false;
}

const parseWeight = (w) => {
  if (typeof w === 'number') return w;
  if (!w) return 0;
  return parseFloat(String(w).replace(/[^0-9.]/g, '')) || 0;
};

// range from weapon properties: "Ammunition (range 80/320)" / "Thrown (range 20/60)"
function weaponRange(props) {
  const list = props || [];
  for (const p of list) {
    const m = /(?:range|thrown).*?(\d+)\/(\d+)/i.exec(String(p)) || /(\d+)\/(\d+)/.exec(String(p));
    if (m) return { rangeFt: Number(m[1]), longFt: Number(m[2]) };
  }
  return null;
}

// ── starting equipment resolution ────────────────────────────────────────────
// SRD starting_equipment strings are option lists ("(a) X or (b) Y", "X and Y,
// or Z"). We resolve the FIRST option deterministically (documented house
// default; def.equipmentOverrides wins over everything).

const QUANTITY_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20 };

// generic phrase → concrete SRD item
const GENERIC_ITEMS = {
  'martial weapon': 'Longsword',
  'two martial weapons': 'Longsword',
  'martial melee weapon': 'Longsword',
  'martial ranged weapon': 'Longbow',
  'simple weapon': 'Mace',
  'any simple weapon': 'Mace',
  'simple melee weapon': 'Mace',
  'simple ranged weapon': 'Light Crossbow',
  'melee weapon': 'Longsword',
  'two daggers': 'Dagger',
  'two handaxes': 'Handaxe',
  'shortsword': 'Shortsword',
  'arcane focus': 'Arcane Focus',
  'component pouch': 'Component Pouch',
  'holy symbol': 'Holy Symbol',
  'thieves tools': "Thieves' Tools",
  "thieves' tools": "Thieves' Tools",
  'spellbook': 'Spellbook',
  'leather armor': 'Leather',
  'studded leather armor': 'Studded Leather',
  'scale mail': 'Scale Mail',
  'chain mail': 'Chain Mail',
  'chain shirt': 'Chain Shirt',
  'shield': 'Shield'
};

function findAnyItem(name) {
  const target = String(name).toLowerCase().replace(/s$/, '');
  const targetKey = weaponKey(name);
  // weapons — match on normalized word-sorted keys ("Crossbow, Light" == "light crossbow")
  for (const cat of Object.keys(SRD.equipment?.weapons || {})) {
    const found = (SRD.equipment.weapons[cat] || []).find(w => {
      const n = String(w.name || '').toLowerCase();
      return n === target || n.replace(/,.*$/, '').trim() === target || weaponKey(w.name) === targetKey;
    });
    if (found) return { ...found, kind: 'weapon', category: cat };
  }
  // armor (incl. shields)
  for (const cat of Object.keys(SRD.equipment?.armor || {})) {
    const found = (SRD.equipment.armor[cat] || []).find(a => String(a.name || '').toLowerCase() === target);
    if (found) return { ...found, kind: cat === 'shields' ? 'shield' : 'armor', category: cat };
  }
  // packs
  if (SRD.equipment?.packs?.[name]) return { name, kind: 'pack', ...SRD.equipment.packs[name] };
  // adventuring gear
  const gear = (SRD.equipment?.adventuring_gear || []).find(g => String(g.name || '').toLowerCase() === target);
  if (gear) return { ...gear, kind: 'gear' };
  // tools
  for (const cat of Object.keys(SRD.equipment?.tools || {})) {
    const found = (SRD.equipment.tools[cat] || []).find(t => String(t.name || '').toLowerCase().replace(/s$/, '') === target);
    if (found) return { ...found, kind: 'tool' };
  }
  return null;
}

export function resolveEquipmentPhrase(phrase) {
  // returns array of {name, qty, kind}
  const items = [];
  let text = String(phrase || '')
    .replace(/\((a|b|c|d)\)/gi, ' ')
    .replace(/\(if proficient\)/gi, ' ')
    .replace(/\(([^)]*)\)/g, ' ')  // drop parenthetical qualifiers ("(range 80/320)" etc)
    .replace(/\b(quiver of|with|and 20|of)\b/gi, ' ')
    .replace(/\b\d+\s+(bolts|arrows|needles|bullets)\b/gi, ' ')  // ammo counts
    .replace(/\s+(?:or|and)\s*$/i, '')  // dangling conjunction from option splits
    .replace(/\s+/g, ' ')
    .trim();

  // split alternatives on commas / "and" / "or" FIRST, then strip punctuation per fragment
  const fragments = text.split(/,| and | or /i).map(s => s.replace(/[.,;]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const frag of fragments) {
    // leading quantity: "two handaxes", "20 arrows", "two daggers"
    let qty = 1;
    let body = frag;
    const qm = /^(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twenty)\s+(.+)$/i.exec(frag);
    if (qm) {
      const q = qm[1].toLowerCase();
      qty = QUANTITY_WORDS[q] ?? Number(q) ?? 1;
      body = qm[2];
    }
    const key = body.toLowerCase().replace(/s$/, '').trim();
    const generic = GENERIC_ITEMS[body.toLowerCase()] || GENERIC_ITEMS[key];
    const itemName = generic || titleCase(body);
    const found = findAnyItem(itemName);
    if (found) {
      items.push({ name: found.name, qty, kind: found.kind, category: found.category });
    } else if (generic) {
      items.push({ name: generic, qty, kind: 'gear' });
    }
    // unmatched fragments (packs contents etc.) are skipped — packs are one item
  }
  return items;
}

export function resolveStartingEquipment(className) {
  const cls = SRD.classes[className];
  const out = [];
  const seen = new Set();
  for (const line of cls?.starting_equipment || []) {
    let first;
    // "(a) X or (b) Y" / "(a) X, (b) Y, or (c) Z" -> take the (a) option only
    const ab = /\(a\)\s*(.*?)\s*(?:\(b\)|\(c\)|\(d\)|$)/i.exec(String(line));
    if (ab) {
      first = ab[1];
    } else {
      // "X or Y" (possibly "X, Y, or Z") -> first alternative
      first = String(line).split(/\s*,\s*or\s+|\s+or\s+/i)[0];
    }
    for (const it of resolveEquipmentPhrase(first)) {
      const k = it.name.toLowerCase();
      if (seen.has(k)) { continue; }
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

// ── spell slots / cantrips (hardcoded SRD tables) ──────────────────────────
// The source srd_data.json slot arrays are inconsistently indexed per class
// (most are 1-based with a leading 0; Wizard's are 0-based), so we hardcode the
// PHB tables — they're SRD facts — and treat the JSON as fallback only.
const SLOTS_FULL = {
  1: [2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  2: [0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  3: [0, 0, 0, 0, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  4: [0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  5: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
  6: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
  7: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2],
  8: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  9: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
};
const SLOTS_HALF = {
  1: [0, 0, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  2: [0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  3: [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2],
  5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
};
const SLOTS_ARTIFICER = {
  1: [2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  2: [0, 0, 0, 0, 0, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2],
  5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]
};
// Warlock pact magic: count of slots per level, and the level those slots cast at.
const WARLOCK_SLOTS = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
const WARLOCK_SLOT_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

const CASTER_TYPE = {
  Bard: 'full', Cleric: 'full', Druid: 'full', Sorcerer: 'full', Wizard: 'full',
  Paladin: 'half', Ranger: 'half', Artificer: 'artificer', Warlock: 'warlock'
};

const CANTRIPS_KNOWN = {
  Bard: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  Cleric: [3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  Druid: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  Sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  Warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  Wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Artificer: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
};

// Spell slots for a caster class at character level (1-based tables, index = level-1).
function spellSlotsFor(className, level) {
  const type = CASTER_TYPE[className];
  if (!type) return {};
  const slots = {};
  if (type === 'warlock') {
    const total = WARLOCK_SLOTS[level - 1] || 0;
    const at = WARLOCK_SLOT_LEVEL[level - 1] || 1;
    if (total > 0) slots[at] = { total, used: 0 };
    return slots;
  }
  const table = type === 'full' ? SLOTS_FULL : type === 'half' ? SLOTS_HALF : SLOTS_ARTIFICER;
  for (const [slotLevelStr, arr] of Object.entries(table)) {
    const total = arr[level - 1] || 0;
    if (total > 0) slots[Number(slotLevelStr)] = { total, used: 0 };
  }
  return slots;
}

function cantripsKnownFor(className, level) {
  const arr = CANTRIPS_KNOWN[className];
  if (arr) return arr[level - 1] ?? 0;
  return 0;
}

export function buildCharacter(def = {}) {
  const className = resolveClass(def.class);
  const raceName = resolveRace(def.race);
  const cls = SRD.classes[className] || SRD.classes.Fighter;
  const race = SRD.races[raceName] || SRD.races.Human;
  const bgName = resolveBackground(def.background);
  const bg = bgName ? SRD.backgrounds[bgName] : null;
  // level-1 subclass (Cleric domain / Warlock patron / Sorcerer origin) — the
  // creation wizard sends `subclass`; unknown/wrong-class values → null
  const subclassName = resolveSubclass(className, def.subclass);

  const level = Math.max(1, Math.min(20, Number(def.level) || 1));

  // -- abilities: base + racial (+ subrace)
  const base = {};
  for (const a of ABILITY_KEYS) {
    const v = Number(def.abilities?.[a]);
    base[a] = Number.isFinite(v) ? Math.max(1, Math.min(30, v)) : 10;
  }
  const abilities = { ...base };
  const applyBonuses = (obj) => {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = k.toLowerCase();
      if (abilities[key] !== undefined) abilities[key] = Math.min(30, abilities[key] + Number(v) || 0);
    }
  };
  applyBonuses(race.ability_score_increase);
  const subraceName = def.subrace && race.subraces?.[def.subrace] ? def.subrace : Object.keys(race.subraces || {})[0] || null;
  const subrace = subraceName ? race.subraces[subraceName] : null;
  if (subrace) applyBonuses(subrace.ability_score_increase);

  const mods = {};
  for (const a of ABILITY_KEYS) mods[a] = abilityMod(abilities[a]);

  const prof = getProficiencyBonus(level);

  // -- saving throws
  const classSaves = (cls.saving_throws || []).map(s => s.toUpperCase());   // ["STR","CON"]
  const saveProf = {};
  const saves = {};
  for (const a of ABILITY_KEYS) {
    saveProf[a] = classSaves.includes(a.toUpperCase());
    saves[a] = { proficient: saveProf[a], mod: mods[a] + (saveProf[a] ? prof : 0) };
  }

  // -- skills (race trait scan like VTT + background + manual picks)
  const skillProf = new Set((def.skillProficiencies || []).map(s => titleCase(s)));
  for (const t of race.traits || []) {
    const m = /proficiency in (?:the )?([A-Za-z\s]+?)(?:\s*skill)?\s*[.;]/i.exec(t.description || '');
    if (m) {
      const skillName = titleCase(m[1].trim());
      if (SRD.skills?.[skillName]) skillProf.add(skillName);
    }
  }
  if (subrace) {
    for (const t of subrace.traits || []) {
      const m = /proficiency in (?:the )?([A-Za-z\s]+?)(?:\s*skill)?\s*[.;]/i.exec(t.description || '');
      if (m) {
        const skillName = titleCase(m[1].trim());
        if (SRD.skills?.[skillName]) skillProf.add(skillName);
      }
    }
  }
  for (const s of bg?.skill_proficiencies || []) skillProf.add(s);

  const skills = {};
  for (const [name, meta] of Object.entries(SRD.skills || {})) {
    const abilityKey = String(meta.ability || 'WIS').toLowerCase();
    const proficient = skillProf.has(name);
    skills[slug(name)] = { name, ability: abilityKey, proficient, mod: (mods[abilityKey] ?? 0) + (proficient ? prof : 0) };
  }

  // -- equipment
  const overrides = def.equipmentOverrides || {};
  let equipment = resolveStartingEquipment(className);
  if (Array.isArray(overrides.items)) equipment = overrides.items.map(i => (typeof i === 'string' ? { name: i, qty: 1 } : i));
  if (Array.isArray(overrides.weapons) || overrides.armor !== undefined || overrides.shield !== undefined) {
    if (Array.isArray(overrides.weapons)) {
      equipment = equipment.filter(e => e.kind !== 'weapon' && e.kind !== 'shield');
      for (const w of overrides.weapons) equipment.push(typeof w === 'string' ? { name: w, qty: 1, kind: 'weapon' } : w);
    }
    if (overrides.armor !== undefined) {
      equipment = equipment.filter(e => e.kind !== 'armor');
      if (overrides.armor) equipment.push({ name: overrides.armor, qty: 1, kind: 'armor' });
    }
    if (overrides.shield !== undefined) {
      equipment = equipment.filter(e => e.kind !== 'shield');
      if (overrides.shield) equipment.push({ name: 'Shield', qty: 1, kind: 'shield' });
    }
  }

  // armor / shield resolution (first armor item wins; shield presence)
  let armorName = null, hasShield = false;
  for (const e of equipment) {
    if (!armorName && (e.kind === 'armor' || armorCatalogEntry(e.name))) {
      if (!armorCatalogEntry(e.name) || armorCatalogEntry(e.name).category === 'shields') continue;
      armorName = e.name; continue;
    }
    if (String(e.name).toLowerCase() === 'shield' || e.kind === 'shield') hasShield = true;
  }

  // -- AC
  const dexMod = mods.dex;
  let ac = 10 + dexMod;
  const acDetail = { base: 10, dex: dexMod, armor: null, shield: 0, notes: [] };
  const armorEntry = armorName ? armorCatalogEntry(armorName) : null;
  if (armorEntry && armorEntry.category !== 'shields') {
    ac = armorEntry.ac;
    acDetail.base = armorEntry.ac;
    acDetail.armor = armorEntry.name;
    if (armorEntry.dex_bonus) {
      const dexApplied = armorEntry.max_dex_bonus !== undefined && armorEntry.max_dex_bonus !== null
        ? Math.min(dexMod, armorEntry.max_dex_bonus) : dexMod;
      ac += dexApplied;
      acDetail.dex = dexApplied;
    } else {
      acDetail.dex = 0;
    }
    // heavy armor STR requirement house rule: ignore (SRD gives no penalty, only speed)
  }
  if (hasShield) {
    const shield = (SRD.equipment?.armor?.shields || []).find(s => s.name === 'Shield');
    const bonus = shield?.ac_bonus ?? 2;
    ac += bonus;
    acDetail.shield = bonus;
  }

  // -- HP (hit die + CON; avg per level after 1st, min 1/level)
  const hitDie = cls.hit_die || 8;
  const conMod = mods.con;
  const avgPerLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  const hpMax = Math.max(1, (hitDie + conMod) + (level - 1) * avgPerLevel);

  // -- attacks (from weapons in inventory)
  const attacks = [];
  const weaponProfs = cls.proficiencies?.weapons || [];
  for (const e of equipment) {
    const entry = weaponCatalogEntry(e.name);
    if (!entry) continue;
    const props = entry.properties || entry.props || [];
    const propStrs = props.map(String);
    const isRanged = (entry.category || '').includes('ranged');
    const isFinesse = propStrs.some(p => /finesse/i.test(p));
    const isTwoHanded = propStrs.some(p => /two-handed/i.test(p));
    const isVersatile = propStrs.some(p => /versatile/i.test(p));
    const thrown = propStrs.find(p => /thrown/i.test(p));
    const ammo = propStrs.find(p => /ammunition/i.test(p));

    const abilityUsed = isRanged ? 'dex' : (isFinesse ? (mods.dex >= mods.str ? 'dex' : 'str') : 'str');
    const proficient = isProficientWithWeapon(entry.name, weaponProfs);
    const dmgFormulaRaw = entry.damage || entry.dmg || '1d4';
    const dmgMod = mods[abilityUsed];
    const dmgFormula = dmgMod >= 0 ? `${dmgFormulaRaw}+${dmgMod}` : `${dmgFormulaRaw}${dmgMod}`;

    const range = weaponRange(props) || (isRanged ? { rangeFt: 20, longFt: 80 } : null);

    attacks.push({
      name: entry.name,
      ability: abilityUsed,
      proficient,
      attackBonus: mods[abilityUsed] + (proficient ? prof : 0),
      damageDice: dmgFormulaRaw,
      damageMod: dmgMod,
      damageFormula: dmgFormula,
      damageType: (entry.damage_type || entry.dmgType || 'bludgeoning').toLowerCase(),
      ranged: isRanged,
      finesse: isFinesse,
      twoHanded: isTwoHanded,
      versatile: isVersatile,
      thrown: !!thrown,
      ammunition: !!ammo,
      reachFt: 5,
      rangeFt: range ? range.rangeFt : null,
      longRangeFt: range ? range.longFt : null
    });
  }

  // -- spellcasting
  let spellcasting = null;
  const sc = cls.spellcasting;
  if (sc && sc.spell_slots_by_level) {
    const statKey = normalizeAbilityKey(sc.ability);
    const abilityModVal = mods[statKey] ?? 0;
    const defaults = DEFAULT_SPELLS[className] || { cantrips: [], byLevel: {} };
    const spellOverrides = def.spells || overrides.spells || null;

    const cantripNames = spellOverrides?.cantrips || defaults.cantrips;
    const byLevel = {};
    for (const [lvl, names] of Object.entries(spellOverrides?.byLevel || defaults.byLevel || {})) {
      byLevel[Number(lvl)] = names;
    }

    const slots = spellSlotsFor(className, level);
    const cantripsKnown = cantripsKnownFor(className, level);

    spellcasting = {
      ability: statKey.toUpperCase(),
      abilityMod: abilityModVal,
      saveDC: 8 + prof + abilityModVal,
      attackBonus: prof + abilityModVal,
      cantripsKnown,
      // spells prepared per long rest (full casters): ability mod + level
      preparedCount: ['Cleric', 'Druid', 'Wizard', 'Bard'].includes(className) ? Math.max(1, abilityModVal + level) : null,
      slots,
      cantrips: cantripNames.filter(n => SRD.spells?.[n]).slice(0, Math.max(cantripsKnown, cantripNames.length)),
      spellsByLevel: byLevel
    };
    // flat convenience list of prepared/known spell names
    spellcasting.spells = [
      ...spellcasting.cantrips,
      ...Object.values(byLevel).flat()
    ].filter(n => SRD.spells?.[n]);
  }

  // -- inventory (everything, with weights)
  const equippedWeapons = equipment.filter(e => e.kind === 'weapon').slice(0, 1).map(e => e.name);
  const inventory = equipment.map(e => {
    const found = findAnyItem(e.name) || {};
    const kind = e.kind || found.kind || 'gear';
    const equipped = kind === 'weapon' ? equippedWeapons.includes(e.name)
      : kind === 'armor' ? e.name === armorName
        : kind === 'shield' ? hasShield : false;
    return { name: e.name, qty: e.qty || 1, kind, weight: parseWeight(e.weight ?? found.weight), equipped };
  });
  const totalWeight = inventory.reduce((s, i) => s + i.weight * (i.qty || 1), 0);
  const capacity = abilities.str * 15;

  // -- features available at this level
  const features = (cls.features || [])
    .filter(f => (f.level ?? 1) <= level)
    .map(f => ({ level: f.level ?? 1, name: f.name, description: f.description || '' }));
  // subclass features ride the same list, tagged source:'subclass' so the
  // sheet UI can group them under the chosen path
  features.push(...subclassFeatures(className, subclassName, level));

  const traits = [
    ...(race.traits || []).map(t => ({ name: t.name, description: t.description || '', source: 'race' })),
    ...(subrace?.traits || []).map(t => ({ name: t.name, description: t.description || '', source: 'subrace' }))
  ];
  if (bg?.feature) traits.push({ name: bg.feature.name, description: bg.feature.description || '', source: 'background' });

  // rogue sneak attack dice (CombatEngine applies when applicable)
  const sneakAttackDice = className === 'Rogue' ? `${Math.ceil(level / 2)}d6` : null;

  const sheet = {
    schema: SCHEMA_VERSION,
    id: def.id || ('sheet_' + slug(def.name || 'nameless') + '_' + Math.random().toString(36).slice(2, 7)),
    name: String(def.name || 'Nameless').slice(0, 32),
    race: raceName,
    subrace: subraceName,
    class: className,
    subclass: subclassName,                     // resolved level-1 path (or null)
    archetype: def.class || className,        // original input ('warden', 'fighter', ...)
    level,
    background: bgName,
    look: def.look ? { ...def.look } : {},

    abilities,           // final scores (racial applied)
    baseAbilities: base, // pre-racial (UI shows both)
    mods,
    proficiencyBonus: prof,
    saves,               // {str: {proficient, mod}, ...}
    skills,              // {athletics: {name, ability, proficient, mod}, ...}
    passive: {
      perception: 10 + (skills.perception?.mod ?? 0),
      investigation: 10 + (skills.investigation?.mod ?? 0),
      insight: 10 + (skills.insight?.mod ?? 0)
    },
    initiative: mods.dex,
    speedFt: Number(race.speed) || 30,
    darkvisionFt: race.darkvision || null,
    languages: race.languages || ['Common'],

    ac,
    acDetail,
    armor: armorName,
    shield: hasShield,

    hp: { current: hpMax, max: hpMax, hitDie, hitDiceSpent: 0 },
    hitDice: { die: `d${hitDie}`, total: level, remaining: level },
    avgHpPerLevel: avgPerLevel,

    attacks,
    equipped: equippedWeapons,
    spellcasting,
    sneakAttackDice,

    equipment,
    inventory,
    carrying: { weight: Math.round(totalWeight * 10) / 10, capacity, encumbered: totalWeight > capacity },

    features,
    traits,

    xp: xpForLevel(level),
    deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
    conditions: [],
    concentration: null
  };
  return sheet;
}

export function toggleEquipment(sheet, itemName) {
  if (!sheet || !Array.isArray(sheet.inventory)) return { ok: false, reason: 'no_inventory' };
  const key = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const item = sheet.inventory.find(i => key(i?.name) === key(itemName));
  if (!item) return { ok: false, reason: 'item_not_found' };

  const kind = item.kind || findAnyItem(item.name)?.kind;
  let equipped;
  if (kind === 'weapon') {
    if (!(sheet.attacks || []).some(a => key(a.name) === key(item.name))) {
      return { ok: false, reason: 'not_equippable' };
    }
    const names = Array.isArray(sheet.equipped) ? [...sheet.equipped] : [];
    const index = names.findIndex(name => key(name) === key(item.name));
    sheet.equipped = index >= 0 ? [] : [item.name];
    equipped = index < 0;
  } else if (kind === 'armor') {
    if (!armorCatalogEntry(item.name)) return { ok: false, reason: 'not_equippable' };
    equipped = key(sheet.armor) !== key(item.name);
    sheet.armor = equipped ? item.name : null;
  } else if (kind === 'shield') {
    equipped = !sheet.shield;
    sheet.shield = equipped;
  } else {
    return { ok: false, reason: 'not_equippable' };
  }

  const dexMod = Number(sheet.mods?.dex) || 0;
  let ac = 10 + dexMod;
  const acDetail = { base: 10, dex: dexMod, armor: null, shield: 0, notes: [] };
  const armor = sheet.armor ? armorCatalogEntry(sheet.armor) : null;
  if (armor) {
    ac = armor.ac;
    acDetail.base = armor.ac;
    acDetail.armor = armor.name;
    if (armor.dex_bonus) {
      acDetail.dex = armor.max_dex_bonus != null ? Math.min(dexMod, armor.max_dex_bonus) : dexMod;
      ac += acDetail.dex;
    } else {
      acDetail.dex = 0;
    }
  }
  if (sheet.shield) {
    const shield = (SRD.equipment?.armor?.shields || []).find(s => s.name === 'Shield');
    acDetail.shield = shield?.ac_bonus ?? 2;
    ac += acDetail.shield;
  }
  sheet.ac = ac;
  sheet.acDetail = acDetail;

  for (const entry of sheet.inventory) {
    const entryKind = entry.kind || findAnyItem(entry.name)?.kind;
    entry.equipped = entryKind === 'weapon'
      ? (sheet.equipped || []).some(name => key(name) === key(entry.name))
      : entryKind === 'armor' ? key(sheet.armor) === key(entry.name)
        : entryKind === 'shield' ? !!sheet.shield : false;
  }
  return { ok: true, item: item.name, kind, equipped, ac: sheet.ac };
}

function normalizeAbilityKey(ability) {
  const s = String(ability || 'int').toLowerCase();
  if (s.startsWith('str')) return 'str';
  if (s.startsWith('dex')) return 'dex';
  if (s.startsWith('con')) return 'con';
  if (s.startsWith('int')) return 'int';
  if (s.startsWith('wis')) return 'wis';
  if (s.startsWith('cha')) return 'cha';
  return 'int';
}

// ── leveling ─────────────────────────────────────────────────────────────────

export function levelUp(sheet, { hpRoll = null, rng = null } = {}) {
  if (!sheet || sheet.level >= 20) return sheet;
  sheet.level += 1;
  sheet.proficiencyBonus = getProficiencyBonus(sheet.level);
  sheet.xp = Math.max(Number(sheet.xp) || 0, xpForLevel(sheet.level));

  // HP gain: average (floor(die/2)+1 + CON) by default, or a rolled hit die
  const conMod = sheet.mods.con;
  let gain;
  if (hpRoll && rng) {
    gain = Math.max(1, hpRoll(rng) + conMod);
  } else {
    gain = Math.max(1, sheet.avgHpPerLevel);
  }
  sheet.hp.max += gain;
  sheet.hp.current += gain;
  sheet.hitDice.total = sheet.level;
  sheet.hitDice.remaining += 1;

  // refresh class features at the new level (subclass features re-appended —
  // the rebuild below would otherwise drop them)
  const cls = SRD.classes[sheet.class];
  if (cls) {
    sheet.features = (cls.features || [])
      .filter(f => (f.level ?? 1) <= sheet.level)
      .map(f => ({ level: f.level ?? 1, name: f.name, description: f.description || '' }));
    sheet.features.push(...subclassFeatures(sheet.class, sheet.subclass, sheet.level));
  }

  // refresh spell slots
  if (sheet.spellcasting && CASTER_TYPE[sheet.class]) {
    const slots = spellSlotsFor(sheet.class, sheet.level);
    for (const [lvl, s] of Object.entries(slots)) {
      const prev = sheet.spellcasting.slots?.[lvl];
      if (prev) s.used = Math.min(prev.used, s.total);   // preserve spend, clamp to new total
    }
    sheet.spellcasting.slots = slots;
    sheet.spellcasting.cantripsKnown = cantripsKnownFor(sheet.class, sheet.level);
    const ability = normalizeAbilityKey(sheet.spellcasting.ability);
    const abilityMod = Number(sheet.mods?.[ability]) || 0;
    sheet.spellcasting.abilityMod = abilityMod;
    sheet.spellcasting.saveDC = 8 + sheet.proficiencyBonus + abilityMod;
    sheet.spellcasting.attackBonus = sheet.proficiencyBonus + abilityMod;
    if (['Cleric', 'Druid', 'Wizard', 'Bard'].includes(sheet.class)) {
      sheet.spellcasting.preparedCount = Math.max(1, abilityMod + sheet.level);
    }
  }

  if (sheet.class === 'Rogue') sheet.sneakAttackDice = `${Math.ceil(sheet.level / 2)}d6`;

  for (const [ability, save] of Object.entries(sheet.saves || {})) {
    const key = normalizeAbilityKey(ability);
    save.mod = (Number(sheet.mods?.[key]) || 0) + (save.proficient ? sheet.proficiencyBonus : 0);
  }
  for (const skill of Object.values(sheet.skills || {})) {
    const key = normalizeAbilityKey(skill.ability);
    skill.mod = (Number(sheet.mods?.[key]) || 0) + (skill.proficient ? sheet.proficiencyBonus : 0);
  }
  for (const attack of sheet.attacks || []) {
    const key = normalizeAbilityKey(attack.ability);
    attack.attackBonus = (Number(sheet.mods?.[key]) || 0) + (attack.proficient ? sheet.proficiencyBonus : 0);
  }

  return sheet;
}

export function awardExperience(sheet, amount) {
  const gained = Math.max(0, Math.floor(Number(amount) || 0));
  if (!sheet || !gained) return { gained: 0, levelsGained: 0, level: sheet?.level || 0 };

  const startingLevel = Number(sheet.level) || 1;
  sheet.xp = Math.max(0, Number(sheet.xp) || 0) + gained;
  while (sheet.level < 20 && sheet.xp >= xpForLevel(sheet.level + 1)) levelUp(sheet);
  return { gained, levelsGained: sheet.level - startingLevel, level: sheet.level };
}

export function shortRest(sheet, diceToSpend = 0, rng = Math.random) {
  if (!sheet) return { ok: false, reason: 'no_sheet' };
  if (sheet.deathSaves?.dead) return { ok: false, reason: 'character_dead' };
  const count = Number(diceToSpend);
  const remaining = Math.max(0, Math.floor(Number(sheet.hitDice?.remaining) || 0));
  if (!Number.isInteger(count) || count < 0 || count > remaining) {
    return { ok: false, reason: 'hit_dice_unavailable' };
  }
  const slots = sheet.spellcasting?.slots || {};
  const slotsSpent = Object.values(slots).reduce((sum, slot) => sum + Math.max(0, Number(slot?.used) || 0), 0);
  const restoresPactMagic = sheet.class === 'Warlock' && slotsSpent > 0;
  if (count === 0 && !restoresPactMagic) return { ok: false, reason: 'nothing_to_recover' };

  const dieSize = Math.max(4, Math.min(12, Number(sheet.hp?.hitDie) || parseInt(sheet.hitDice?.die, 10) || 8));
  const conMod = Number(sheet.mods?.con) || 0;
  const hpBefore = Math.max(0, Number(sheet.hp?.current) || 0);
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const random = Math.max(0, Math.min(0.999999, Number(rng()) || 0));
    rolls.push(1 + Math.floor(random * dieSize));
  }
  const healing = rolls.reduce((sum, roll) => sum + Math.max(0, roll + conMod), 0);
  sheet.hitDice.remaining = remaining - count;
  if (sheet.hp) {
    sheet.hp.hitDiceSpent = Math.max(0, Number(sheet.hp.hitDiceSpent) || 0) + count;
    sheet.hp.current = Math.min(Number(sheet.hp.max) || Number(sheet.hp.current) || 1,
      Math.max(0, Number(sheet.hp.current) || 0) + healing);
  }
  if (hpBefore <= 0 && Number(sheet.hp?.current) > 0 && sheet.deathSaves) {
    sheet.deathSaves = { ok: 0, fail: 0, stable: false, dead: false };
  }
  let slotsRecovered = 0;
  if (restoresPactMagic) {
    for (const slot of Object.values(slots)) {
      slotsRecovered += Math.max(0, Number(slot.used) || 0);
      slot.used = 0;
    }
  }
  return {
    ok: true, hitDiceSpent: count, rolls, healing,
    hpGained: Math.max(0, Number(sheet.hp?.current) || 0) - hpBefore,
    slotsRecovered,
  };
}

export function longRest(sheet) {
  if (!sheet) return { ok: false, reason: 'no_sheet' };
  if (sheet.deathSaves?.dead) return { ok: false, reason: 'character_dead' };
  const hpBefore = Math.max(0, Number(sheet.hp?.current) || 0);
  const hpMax = Math.max(1, Number(sheet.hp?.max) || hpBefore || 1);
  const hdTotal = Math.max(0, Math.floor(Number(sheet.hitDice?.total) || Number(sheet.level) || 0));
  const hdBefore = Math.max(0, Math.min(hdTotal, Math.floor(Number(sheet.hitDice?.remaining) || 0)));
  const hdRegained = Math.min(hdTotal - hdBefore, Math.max(1, Math.floor(hdTotal / 2)));
  sheet.hitDice ||= { die: `d${sheet.hp?.hitDie || 8}`, total: hdTotal, remaining: hdBefore };
  if (sheet.hp) sheet.hp.current = hpMax;
  sheet.hitDice.remaining = hdBefore + hdRegained;
  if (sheet.hp) sheet.hp.hitDiceSpent = Math.max(0, hdTotal - sheet.hitDice.remaining);
  let slotsRecovered = 0;
  for (const slot of Object.values(sheet.spellcasting?.slots || {})) {
    slotsRecovered += Math.max(0, Number(slot.used) || 0);
    slot.used = 0;
  }
  if (sheet.deathSaves) sheet.deathSaves = { ok: 0, fail: 0, stable: false, dead: false };
  return {
    ok: true,
    hpGained: Math.max(0, hpMax - hpBefore),
    hitDiceRegained: hdRegained,
    slotsRecovered,
  };
}

// ── combat profile (what CombatEngine hangs on a token) ──────────────────────

export function buildCombatProfile(sheet) {
  if (!sheet) return null;
  const attacks = (sheet.attacks || []).map(a => ({
    name: a.name,
    toHit: a.attackBonus,
    dmg: a.damageFormula,
    dmgDice: a.damageDice,
    dmgMod: a.damageMod,
    dmgType: a.damageType,
    reachFt: a.reachFt || 5,
    rangeFt: a.rangeFt,
    longRangeFt: a.longRangeFt,
    ranged: !!a.ranged,
    finesse: !!a.finesse,
    thrown: !!a.thrown,
    versatile: !!a.versatile,
    twoHanded: !!a.twoHanded
  }));
  const saveMods = {};
  for (const a of ABILITY_KEYS) saveMods[a] = sheet.saves?.[a]?.mod ?? sheet.mods?.[a] ?? 0;

  const sc = sheet.spellcasting
    ? {
        ability: sheet.spellcasting.ability,
        saveDC: sheet.spellcasting.saveDC,
        attackBonus: sheet.spellcasting.attackBonus,
        slots: sheet.spellcasting.slots,
        cantrips: sheet.spellcasting.cantrips,
        spells: sheet.spellcasting.spells,
        spellsByLevel: sheet.spellcasting.spellsByLevel
      }
    : null;

  return {
    name: sheet.name,
    class: sheet.class,
    level: sheet.level,
    hp: sheet.hp.current,
    hpMax: sheet.hp.max,
    ac: sheet.ac,
    speedFt: sheet.speedFt,
    initiativeBonus: sheet.initiative,
    dexMod: sheet.mods.dex,
    attacks,
    saveMods,
    spellcasting: sc,
    sneakAttackDice: sheet.sneakAttackDice || null,
    passivePerception: sheet.passive?.perception ?? 10,
    deathSaves: { ...sheet.deathSaves },
    sheetId: sheet.id
  };
}
