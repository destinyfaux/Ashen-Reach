// ASHENREACH — server/src/rules/MonsterAI.js
// V1 monster tactics. Plain ESM, zero deps, never throws.
//
// Public API (frozen in docs/CONTRACTS.md):
//   chooseAction(state, monsterToken, srdMonster, rng?) -> ActionRequest
//       The ActionRequest is exactly what CombatEngine.resolveAction accepts,
//       plus ONE documented extension: `move: {x, z}` (world feet). The caller
//       (GameManager) should apply `move` via CombatEngine.attemptMove BEFORE
//       calling resolveAction — see SCHEMA.md §4.
//   buildMonsterToken(indexEntry, overrides?) -> combat-ready monster token
//       Converts a monsters_index.json entry into a token carrying the combat
//       profile CombatEngine expects (attacks[], saveMods, spellcasting, dexMod).
//       Mentioned in CombatEngine.js's header; the GM should merge this shape
//       into GameManager.makeMonsterToken output when wiring monster spawns.
//
// V1 tactics (deterministic — rng is only used where noted, default Math.random):
//   (a) melee   — advance on the nearest hostile, stop inside weapon reach,
//                 strike when adjacent (reach weapons use their full reach)
//   (b) ranged  — if a hostile is closer than KITE_TRIGGER_FT, retreat (kite)
//                 within the movement budget, then shoot; shoot freely at range
//   (c) multi   — 2+ usable attacks: use Multiattack names when the stat block
//                 has them, otherwise the best single attack (highest avg dmg)
//   (d) caster  — cast the highest-EV damaging spell in range while slots last
//                 (cantrips are free); falls through to weapons otherwise
//   (e) targets — only living, visible hostiles (never dead / stable / downed)
//
// Grid: world coords are FEET; one cell = 5 ft (see CombatEngine.CELL_FT).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formulaAvg } from './dice.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRD = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'srd_data.json'), 'utf-8'));

export const KITE_TRIGGER_FT = 30;   // enemies closer than this make ranged monsters retreat
const WORLD_LIMIT_FT = 390;          // mirrors GameManager's ±400ft play area with headroom

// Damaging spells MonsterAI may auto-cast — a subset of CombatEngine's
// SPELL_MECHANICS (must be resolvable there). ev = expected damage (pick best).
const DAMAGING_SPELLS = {
  'Fire Bolt': 5.5, 'Ray of Frost': 4.5, 'Eldritch Blast': 5.5, 'Acid Splash': 3.5,
  'Poison Spray': 6.5, 'Sacred Flame': 4.5, 'Toll the Dead': 5.5, 'Vicious Mockery': 2.5,
  'Magic Missile': 10.5, 'Chromatic Orb': 13.5, 'Guiding Bolt': 14, 'Inflict Wounds': 16.5,
  'Burning Hands': 10.5, 'Thunderwave': 9, 'Fireball': 28
};

// Map-def visual archetype guess (client rig flavor only, DM may override).
const ARCHETYPE_BY_TYPE = {
  undead: 'skeleton', humanoid: 'skeleton', fiend: 'wraith', dragon: 'wraith',
  elemental: 'wraith', monstrosity: 'wraith', aberration: 'wraith'
};

const SIZE_SCALE = { Tiny: 0.5, Small: 0.8, Medium: 1, Large: 2, Huge: 3, Gargantuan: 4 };

// ── small helpers ────────────────────────────────────────────────────────────

const abilityMod = (score) => {
  const n = Number(score);
  return Number.isFinite(n) ? Math.floor((n - 10) / 2) : 0;
};

const titleCase = (s) => String(s || '').trim().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

const distFt = (a, b) => Math.hypot(Number(a.x) - Number(b.x), Number(a.z) - Number(b.z));

const clampWorld = (v) => Math.max(-WORLD_LIMIT_FT, Math.min(WORLD_LIMIT_FT, v));

/** Feat remaining this turn (assumes it's the monster's turn when in combat). */
function movementBudget(state, token) {
  const m = state?.initiative?.movement;
  if (m && m.tokenId === token.id) {
    return Math.max(0, (Number(m.maxFt) || Number(token.speedFt) || 30) - (Number(m.usedFt) || 0));
  }
  return Number(token.speedFt) || 30;
}

/** Normalized attack shape — accepts token profiles (buildMonsterToken) and
 *  raw monsters_index entries (nested `range`) alike. */
function normalizeAttacks(list) {
  return (list || []).filter(Boolean).map(a => ({
    name: a.name,
    toHit: Number(a.toHit ?? a.attackBonus ?? 0) || 0,
    dmg: a.dmg || a.damageFormula || '1d4',
    dmgType: (a.dmgType || a.damageType || 'bludgeoning').toLowerCase(),
    ranged: !!(a.ranged || a.rangeFt || a.range?.rangeFt),
    reachFt: Number(a.reachFt ?? a.range?.reachFt ?? 5) || 5,
    rangeFt: a.rangeFt != null ? Number(a.rangeFt) : (a.range?.rangeFt != null ? Number(a.range.rangeFt) : null),
    longRangeFt: a.longRangeFt != null ? Number(a.longRangeFt) : (a.range?.longFt != null ? Number(a.range.longFt) : null),
    ev: Number(a.avgDamage) || formulaAvg(a.dmg || a.damageFormula || '1d4') || 0
  }));
}

function bestAttack(attacks) {
  let best = null;
  for (const a of attacks) if (!best || a.ev > best.ev) best = a;   // stable: first max wins
  return best;
}

/** Attack names to request for a position: Multiattack combo when fully usable,
 *  else the best attack that can actually reach the target from `pos`. */
function attackNamesFor(attacks, multiattack, pos, target) {
  const d = distFt(pos, target);
  const inRange = (a) => a.ranged
    ? d <= ((a.longRangeFt || a.rangeFt || 30) + 0.01)
    : d <= ((a.reachFt || 5) + 0.01);

  const names = multiattack?.names;
  if (Array.isArray(names) && names.length >= 2) {
    const entries = names
      .map(n => attacks.find(a => String(a.name).toLowerCase() === String(n).toLowerCase()))
      .filter(Boolean)
      .filter(inRange);
    if (entries.length >= 2) return entries.map(a => a.name);
    if (entries.length === 1) return [entries[0].name];
  }
  const best = bestAttack(attacks.filter(inRange));
  return best ? [best.name] : null;
}

/** Step from `from` toward `target`, stopping `aimDist` away, within budget. */
function advanceTo(from, target, budget, aimDist) {
  const d = distFt(from, target);
  if (d <= aimDist + 0.01) return null;
  const step = Math.min(budget, d - aimDist);
  if (step <= 0) return null;
  const ang = Math.atan2(Number(target.z) - Number(from.z), Number(target.x) - Number(from.x));
  return { x: clampWorld(Number(from.x) + Math.cos(ang) * step), z: clampWorld(Number(from.z) + Math.sin(ang) * step) };
}

/** Step directly away from `target` until `idealDist`, within budget (kiting). */
function retreatFrom(from, target, budget, idealDist) {
  const d = distFt(from, target);
  const step = Math.min(budget, Math.max(0, idealDist - d));
  if (step <= 0) return null;
  const ang = Math.atan2(Number(from.z) - Number(target.z), Number(from.x) - Number(target.x));
  return { x: clampWorld(Number(from.x) + Math.cos(ang) * step), z: clampWorld(Number(from.z) + Math.sin(ang) * step) };
}

// ── spellcasting trait parsing (stat-block text → live slot state) ───────────

/**
 * Parse a "Spellcasting" trait (SRD stat-block prose) into the spellcasting
 * profile CombatEngine.doCast consumes. Returns null when not a caster.
 * Handles both flavors found in srd_monsters.json:
 *   "The acolyte is a 1st-level spellcaster. Its spellcasting ability is Wisdom
 *    (spell save DC 12, +4 to hit with spell attacks). The acolyte has the
 *    following cleric spells prepared: Cantrips (at will): light, sacred flame,
 *    thaumaturgy; 1st level (3 slots): bless, cure wounds, sanctuary"
 */
export function parseSpellcastingTrait(traits = []) {
  const trait = (traits || []).find(t => t && /spellcasting/i.test(String(t.name || '')) && typeof t.description === 'string');
  if (!trait) return null;
  const text = trait.description;

  const out = { ability: 'int', abilityMod: 0, saveDC: 10, attackBonus: 0, level: 1, slots: {}, cantrips: [], spellsByLevel: {}, spells: [] };

  const abM = /spellcasting ability is\s+(strength|dexterity|constitution|intelligence|wisdom|charisma)/i.exec(text);
  if (abM) out.ability = abM[1].slice(0, 3).toLowerCase();
  const dcM = /spell save DC\s*(\d+)/i.exec(text);
  if (dcM) out.saveDC = Number(dcM[1]);
  const atkM = /\+(\d+)\s*to hit with spell attacks/i.exec(text);
  if (atkM) out.attackBonus = Number(atkM[1]);
  const lvlM = /(\d+)(?:st|nd|rd|th)-level spellcaster/i.exec(text);
  if (lvlM) out.level = Number(lvlM[1]);

  // segments: "Cantrips (at will): light, sacred flame" / "1st level (3 slots): bless, cure wounds"
  const segRe = /(cantrips?|(\d+)(?:st|nd|rd|th)\s*level)\s*\(([^)]*)\)\s*:\s*([^.;]+)/gi;
  let m;
  while ((m = segRe.exec(text))) {
    const level = m[1].toLowerCase().startsWith('cantrip') ? 0 : Number(m[2]);
    const names = m[4].split(',').map(s => titleCase(s)).filter(n => SRD.spells?.[n]);
    if (!names.length) continue;
    if (level === 0) {
      out.cantrips.push(...names);
    } else {
      out.spellsByLevel[level] = names;
      const slotM = /(\d+)\s*slots?/i.exec(m[3]);
      if (slotM) out.slots[level] = { total: Number(slotM[1]), used: 0 };
    }
  }
  out.spells = [...out.cantrips, ...Object.values(out.spellsByLevel).flat()];
  if (!out.spells.length && !Object.keys(out.slots).length) return null;
  return out;
}

// ── monster token factory ─────────────────────────────────────────────────────

/**
 * Build a combat-ready monster token from a monsters_index.json entry.
 * @param {object} entry monsters_index.json entry (id/name/cr/hp/ac/attacks/...)
 * @param {object} [overrides] patch applied last ({id, x, z, archetype, hidden, ...});
 *        `attacks`/`saveMods` from the entry win unless overridden here.
 * @returns {object|null} token carrying the CombatEngine combat profile
 */
export function buildMonsterToken(entry, overrides = {}) {
  if (!entry || typeof entry !== 'object') return null;
  const scores = entry.abilityScores || {};
  const saveMods = {
    str: abilityMod(scores.STR), dex: abilityMod(scores.DEX), con: abilityMod(scores.CON),
    int: abilityMod(scores.INT), wis: abilityMod(scores.WIS), cha: abilityMod(scores.CHA)
  };
  const attacks = normalizeAttacks(entry.attacks);
  let spellcasting = parseSpellcastingTrait(entry.traits);
  if (spellcasting) spellcasting = { ...spellcasting, abilityMod: saveMods[spellcasting.ability] ?? 0 };

  const token = {
    id: 'mob_' + Math.random().toString(36).slice(2, 9),
    kind: 'monster',
    ownerId: 'DM',
    name: entry.name || 'Creature',
    monsterId: entry.id || null,          // rules source (CONTRACTS token schema)
    creatureType: String(entry.type || '').toLowerCase() || null,  // SRD type (undead/fiend… Turn Undead gate)
    archetype: ARCHETYPE_BY_TYPE[String(entry.type || '').toLowerCase()] || 'skeleton',
    x: 0, z: 0, rotY: 0,
    hp: entry.hp ?? 10,
    hpMax: entry.hp ?? 10,
    ac: entry.ac ?? 12,
    speedFt: entry.speedFt ?? 30,
    initiative: 0,
    conditions: [],
    deathSaves: null,                     // monsters die at 0 HP (CombatEngine default)
    size: SIZE_SCALE[entry.size] ?? 1,
    hidden: false,
    wander: false,
    portraitSeed: (Math.random() * 1e6) | 0,
    senses: entry.senses || null,
    dexMod: entry.dexMod ?? saveMods.dex,
    saveMods,
    attacks,
    spellcasting,
    multiattack: entry.multiattack || null
  };
  return Object.assign({}, token, overrides);
}

// ── spell selection ──────────────────────────────────────────────────────────

function spellRangeFt(srdSpell) {
  const r = String(srdSpell?.range || '');
  if (/^touch/i.test(r)) return 5;
  const m = /(\d+)\s*(?:-|\s)?\s*(?:foot|ft|feet)/i.exec(r) || /^(\d+)\s*(?:feet|ft)?$/i.exec(r);
  if (m) return Number(m[1]);
  if (/^self/i.test(r)) return 0;         // pure self spells aren't offensive at range
  return 120;                             // unknown → assume a conservative bolt range
}

/** Best damaging spell with slots remaining and the target in range, or null. */
function pickDamagingSpell(spellcasting, distToTarget) {
  const sc = spellcasting;
  if (!sc) return null;
  const known = Array.isArray(sc.spells) && sc.spells.length
    ? sc.spells
    : [...(sc.cantrips || []), ...Object.values(sc.spellsByLevel || {}).flat()];
  const candidates = [];
  for (const name of known || []) {
    const ev = DAMAGING_SPELLS[name];
    if (!ev) continue;
    const srd = SRD.spells?.[name];
    if (!srd) continue;
    const level = Number(srd.level) || 0;
    if (level > 0) {
      const bucket = sc.slots?.[level];
      if (!bucket || bucket.used >= bucket.total) continue;
    }
    const rangeFt = spellRangeFt(srd);
    if (rangeFt > 0 && distToTarget > rangeFt + 0.01) continue;
    if (rangeFt === 0) continue;          // self-only buff — not a V1 monster play
    candidates.push({ name, level, ev });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.ev - a.ev || (a.name < b.name ? -1 : 1));
  return candidates[0];
}

// ── the tactic brain ──────────────────────────────────────────────────────────

/**
 * Choose a monster's combat action. Deterministic for a given (state, tokens)
 * pair; the optional 4th rng param is reserved for future flavor decisions.
 * @param {object} state GameManager state ({tokens, initiative})
 * @param {object} monsterToken the acting monster token (combat profile attached)
 * @param {object} [srdMonster] monsters_index entry (or raw SRD monster) — used
 *        as a fallback for attacks/multiattack/spellcasting when the token
 *        doesn't carry them
 * @param {() => number} [rng] injectable random source
 * @returns {object} ActionRequest: {kind, targetId?, spellId?, weaponName?,
 *          attacks?, slotLevel?, slot, move?: {x,z}, reason}
 */
export function chooseAction(state, monsterToken, srdMonster, rng = Math.random) {
  const token = monsterToken;
  if (!token) return { kind: 'dodge', slot: 'action', reason: 'no_token' };
  if (token.hp <= 0 || token.deathSaves?.dead) return { kind: 'dodge', slot: 'action', reason: 'actor_down' };

  // (e) living, visible hostiles only — never dead / stable / downed / hidden
  const hostiles = (state?.tokens || []).filter(t =>
    t && t.id !== token.id && t.kind !== token.kind &&
    t.hp > 0 && !t.deathSaves?.dead && !t.deathSaves?.stable && !t.hidden);
  if (!hostiles.length) return { kind: 'dodge', slot: 'action', reason: 'no_targets' };

  // nearest hostile; ties broken by lowest HP then id (stable, deterministic)
  hostiles.sort((a, b) =>
    distFt(token, a) - distFt(token, b) ||
    (a.hp ?? 0) - (b.hp ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const target = hostiles[0];
  const d = distFt(token, target);
  const budget = movementBudget(state, token);

  const attacks = normalizeAttacks(token.attacks?.length ? token.attacks : srdMonster?.attacks);
  const multiattack = token.multiattack ?? srdMonster?.multiattack ?? null;
  const melee = attacks.filter(a => !a.ranged);
  const ranged = attacks.filter(a => a.ranged);
  const spellcasting = token.spellcasting || srdMonster?.spellcasting || null;
  void rng;                               // V1 decisions are fully deterministic

  // (d) caster: highest-EV damaging spell in range while slots remain
  const spell = pickDamagingSpell(spellcasting, d);
  if (spell) {
    return {
      kind: 'cast', targetId: target.id, spellId: spell.name,
      slotLevel: spell.level > 0 ? spell.level : undefined,
      slot: 'action', reason: `cast:${spell.name}`
    };
  }

  const maxReach = melee.length ? Math.max(...melee.map(a => a.reachFt || 5)) : 0;

  // (a)+(c) melee: already inside reach → strike (multiattack when usable)
  if (melee.length && d <= maxReach + 0.01) {
    const names = attackNamesFor(attacks, multiattack, token, target);
    if (names) {
      return {
        kind: 'attack', targetId: target.id, weaponName: names[0], attacks: names,
        slot: 'action', reason: names.length > 1 ? 'multiattack' : 'melee'
      };
    }
  }

  // (b) ranged: kite when a hostile is breathing down our neck, then shoot
  if (ranged.length) {
    const bow = bestAttack(ranged);
    const maxRange = bow.longRangeFt || bow.rangeFt || 30;
    if (d <= maxRange + 0.01) {
      if (d < KITE_TRIGGER_FT && budget > 0) {
        const idealDist = Math.min(KITE_TRIGGER_FT + 10, Math.max(KITE_TRIGGER_FT, maxRange * 0.8));
        const move = retreatFrom(token, target, budget, idealDist);
        if (move) {
          return {
            kind: 'attack', targetId: target.id, weaponName: bow.name, attacks: [bow.name],
            move, slot: 'action', reason: 'kite'
          };
        }
      }
      return {
        kind: 'attack', targetId: target.id, weaponName: bow.name, attacks: [bow.name],
        slot: 'action', reason: 'ranged'
      };
    }
    // out of range entirely: close the gap this turn (dash covers the move)
    const move = advanceTo(token, target, budget, maxRange * 0.8);
    if (move) return { kind: 'dash', move, slot: 'action', reason: 'ranged-approach' };
    return { kind: 'dodge', slot: 'action', reason: 'ranged-out-of-range' };
  }

  // (a) melee approach: spend the budget closing, strike if we arrive
  if (melee.length) {
    const move = advanceTo(token, target, budget, Math.max(2, maxReach - 2.5));
    if (move) {
      const arrived = distFt(move, target) <= maxReach + 0.01;
      if (arrived) {
        const names = attackNamesFor(attacks, multiattack, move, target);
        if (names) {
          return {
            kind: 'attack', targetId: target.id, weaponName: names[0], attacks: names,
            move, slot: 'action', reason: 'melee-approach'
          };
        }
      }
      return { kind: 'dash', move, slot: 'action', reason: 'approach' };
    }
  }

  return { kind: 'dodge', slot: 'action', reason: 'no_play' };
}
