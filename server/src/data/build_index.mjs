#!/usr/bin/env node
// ASHENREACH — server/src/data/build_index.mjs
// Generates monsters_index.json: a slim, combat-ready projection of srd_monsters.json.
//
// Each entry: {
//   id, name, cr, hp, hpFormula, ac, speedFt, senses, type, size, alignment,
//   languages, environment, abilityScores, dexMod, saveMods, skills,
//   attacks: [{ name, toHit, dmg, avgDamage, dmgType, range, ranged }],
//   saveAttacks: [{ name, dc, saveAbility, dmg, dmgType, condition, rangeFt, halfOnSave }],
//   multiattack: { count, names: [] } | null,
//   traits: [{ name, description }]
// }
//
// Handles both SRD text families found in the source file:
//   Classic MM: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."
//   Compact:    "+11 to hit, 10 ft. 17 (2d10+6) piercing + 7 (2d6) force."
//
// Run:  node server/src/data/build_index.mjs   (paths are module-relative; run from anywhere)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'srd_monsters.json');
const OUT = path.join(__dirname, 'monsters_index.json');

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

const slug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const parseCr = (cr) => {
  if (cr === null || cr === undefined) return null;
  if (typeof cr === 'number') return cr;
  const s = String(cr).trim();
  let m = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return Number(m[1]) / Number(m[2]);
  m = /^(\d+(?:\.\d+)?)$/.exec(s);
  return m ? Number(m[1]) : null;
};

const abilityMod = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.floor((n - 10) / 2);
};

// "1d6 + 2" / "2d6+5" / "1d4" -> normalized "1d6+2" (no spaces). null if unparseable.
const normalizeDice = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw).toLowerCase().replace(/\s+/g, '');
  return /^[+-]?(\d*d\d+([+-]\d+)?|\d+)([+-]\d*d\d+([+-]\d+)?)*$/.test(cleaned) ? cleaned : null;
};

// ── Weapon attack parsers ────────────────────────────────────────────────────
const TOHIT_RE = /([+-]\d+)\s*to\s*hit/i;
const REACH_RE = /(?:reach|,\s*)\s*(\d+)\s*ft/i;
const RANGE_RE = /range\s*(\d+)\s*\/\s*(\d+)\s*ft/i;
const DMG_RE = /(\d+)\s*\(([^)]+)\)\s*([a-z]+)(?:\s+damage)?/i;          // "5 (1d6 + 2) slashing damage"
const DMG_INLINE_RE = /hit:?\s*(\d*d\d+(?:\s*[+-]\s*\d+)*)\s+([a-z]+)\s+damage/i; // "Hit: 2d10+6 piercing damage"
const DMG_FLAT_RE = /hit:?\s*(\d+)\s+([a-z]+)\s+damage/i;                // "Hit: 1 piercing damage."

// ── Save-based action parsers (breath weapons, gazes, spell-likes) ───────────
const SAVE_RE = /dc\s*(\d+)\s*(str|dex|con|int|wis|cha)\b/i;              // "DC 18 DEX save or ..." / "DC 16 WIS or ..."
const SAVE_DMG_RE = /\b(\d+)\s*\(([^)]+)\)\s*([a-z]+)\b/i;                // "54 (12d8) force"
const HALF_RE = /half\s+on\s+(?:a\s+)?(?:successful\s+)?save/i;
const CONTROL_RE = /(charmed|frightened|paralyzed|restrained|stunned|prone|unconscious|poisoned|blinded|deafened|grappled)/i;

function parseAttack(action) {
  const text = action.description || '';

  const toHitM = TOHIT_RE.exec(text);
  if (!toHitM) return null;
  const toHit = Number(toHitM[1]);

  const rangeM = RANGE_RE.exec(text);
  const reachM = REACH_RE.exec(text);
  if (!rangeM && !reachM) return null;

  // Decide primary mode: pure ranged attacks lead with range; melee-with-thrown
  // ("reach 5 ft. or range 20/60 ft.") stays melee with a thrownRange hint.
  const leadsWithMelee = /\bmelee\b/i.test(text) && !/\branged\b/i.test(text) && reachM;
  let range, ranged;
  if (rangeM && !leadsWithMelee) {
    range = { rangeFt: Number(rangeM[1]), longFt: Number(rangeM[2]) };
    if (reachM) range.reachFt = Number(reachM[1]);      // also usable in melee
    ranged = true;
  } else {
    range = { reachFt: reachM ? Number(reachM[1]) : 5 };
    if (rangeM) range.thrownRangeFt = Number(rangeM[1]); // throwable melee weapon
    ranged = false;
  }

  // Damage: prefer parenthesized dice, then inline dice ("Hit: 2d10+6 piercing"),
  // then flat ("Hit: 1 piercing damage").
  let dmg = null, avg = null, dmgType = null;
  const dmgM = DMG_RE.exec(text);
  const inlineM = dmgM ? null : DMG_INLINE_RE.exec(text);
  const flatM = (dmgM || inlineM) ? null : DMG_FLAT_RE.exec(text);
  if (dmgM && normalizeDice(dmgM[2])) {
    dmg = normalizeDice(dmgM[2]);
    avg = Number(dmgM[1]) || null;
    dmgType = dmgM[3].toLowerCase();
  } else if (inlineM && normalizeDice(inlineM[1])) {
    dmg = normalizeDice(inlineM[1]);
    dmgType = inlineM[2].toLowerCase();
  } else if (flatM) {
    dmg = String(Number(flatM[1]));
    avg = Number(flatM[1]);
    dmgType = flatM[2].toLowerCase();
  } else {
    return null;   // no rollable/flat damage -> not auto-resolvable
  }

  return { name: action.name, toHit, dmg, avgDamage: avg, dmgType, range, ranged };
}

function parseSaveAction(action) {
  const text = action.description || '';
  const saveM = SAVE_RE.exec(text);
  if (!saveM) return null;

  const dmgM = SAVE_DMG_RE.exec(text);
  const control = CONTROL_RE.exec(text);
  if (!dmgM && !control) return null;

  let rangeFt = 30;
  const rangeM = /(?:range|reach|within)\s*(\d+)\s*(?:-|\s)?\s*ft/i.exec(text);
  if (rangeM) rangeFt = Number(rangeM[1]);

  return {
    name: action.name,
    dc: Number(saveM[1]),
    saveAbility: saveM[2].toUpperCase(),
    dmg: dmgM && normalizeDice(dmgM[2]) ? normalizeDice(dmgM[2]) : (dmgM ? String(Number(dmgM[1])) : null),
    dmgType: dmgM ? dmgM[3].toLowerCase() : null,
    condition: control ? control[1].toLowerCase() : null,
    halfOnSave: HALF_RE.test(text),
    rangeFt
  };
}

function parseMultiattack(actions) {
  const ma = actions.find(a => /^multiattack$/i.test(a.name || ''));
  if (!ma) return null;
  const text = (ma.description || '').toLowerCase();
  const countM = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+attacks/.exec(text);
  let count = countM ? (NUM_WORDS[countM[1]] ?? Number(countM[1])) : 2;
  if (!Number.isFinite(count) || count < 2) count = 2;
  const names = [];
  for (const a of actions) {
    if (a === ma) continue;
    const n = (a.name || '').toLowerCase();
    if (n && text.includes(n)) names.push(a.name);
  }
  return { count, names };
}

function buildIndex() {
  const src = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
  const monsters = src.monsters || {};
  const index = [];

  for (const [key, m] of Object.entries(monsters)) {
    const actions = Array.isArray(m.actions) ? m.actions : [];
    const attacks = [];
    const saveAttacks = [];
    for (const a of actions) {
      if (!a || typeof a.description !== 'string') continue;
      const atk = parseAttack(a);
      if (atk) { attacks.push(atk); continue; }
      const sv = parseSaveAction(a);
      if (sv) saveAttacks.push(sv);
    }
    const multi = parseMultiattack(actions);
    const speed = m.speed || {};
    const speedFt = Number(speed.walk ?? speed.fly ?? speed.swim ?? speed.burrow ?? 30) || 30;

    index.push({
      id: slug(key),
      name: key,
      cr: parseCr(m.cr),
      type: m.type || null,
      size: m.size || 'Medium',
      alignment: m.alignment || null,
      hp: m.hp ?? null,
      hpFormula: m.hp_formula || null,
      ac: m.ac ?? null,
      speedFt,
      senses: m.senses || null,
      languages: m.languages || null,
      environment: m.environment || null,
      abilityScores: m.ability_scores || null,
      dexMod: abilityMod(m.ability_scores?.DEX),
      saveMods: m.saves || null,
      skills: m.skills || null,
      attacks,
      saveAttacks,
      multiattack: multi,
      traits: Array.isArray(m.traits) ? m.traits.map(t => ({ name: t.name, description: t.description })) : []
    });
  }

  // deterministic order: alphabetical by name
  index.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(OUT, JSON.stringify(index, null, 1));
  const withAttacks = index.filter(e => e.attacks.length > 0).length;
  console.log(`[build_index] ${index.length} monsters -> ${OUT}`);
  console.log(`[build_index] ${withAttacks} with auto-resolvable weapon attacks; ` +
    `${index.filter(e => e.saveAttacks.length > 0).length} with save-actions; ` +
    `${index.filter(e => e.multiattack).length} with multiattack.`);
}

buildIndex();
