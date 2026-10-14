// ASHENREACH — server/src/rules/srd.js
// Deterministic SRD database query engine and high-level VTT sheet accessors.
// Treats server/src/data/srd_data.json as an in-memory database with O(1) indexes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRD_PATH = path.join(__dirname, '..', 'data', 'srd_data.json');

// Lazy-loaded singleton
let _srd = null;
let _indexes = null;

function loadSRD() {
  if (_srd) return _srd;
  const raw = fs.readFileSync(SRD_PATH, 'utf-8');
  _srd = JSON.parse(raw);
  buildIndexes(_srd);
  return _srd;
}

function buildIndexes(srd) {
  _indexes = {
    races: new Map(),
    classes: new Map(),
    backgrounds: new Map(),
    feats: new Map(),
    spells: new Map(),
    spellsByClassLevel: new Map(), // key: "Wizard:1" -> Array<Spell>
    equipment: new Map(), // trimmed name -> item
  };

  // Case-insensitive race map
  for (const [name, data] of Object.entries(srd.races || {})) {
    _indexes.races.set(name.toLowerCase().trim(), { name, data });
  }

  // Case-insensitive class map
  for (const [name, data] of Object.entries(srd.classes || {})) {
    _indexes.classes.set(name.toLowerCase().trim(), { name, data });
  }

  // Case-insensitive background map
  for (const [name, data] of Object.entries(srd.backgrounds || {})) {
    _indexes.backgrounds.set(name.toLowerCase().trim(), { name, data });
  }

  // Case-insensitive feat map
  for (const [name, data] of Object.entries(srd.feats || {})) {
    _indexes.feats.set(name.toLowerCase().trim(), { name, data });
  }

  // Spells index
  for (const [name, data] of Object.entries(srd.spells || {})) {
    const spellName = (data.name || name).trim();
    _indexes.spells.set(spellName.toLowerCase(), { name: spellName, data });

    const classes = Array.isArray(data.classes) ? data.classes : [];
    const lvl = Number(data.level) || 0;
    for (const cls of classes) {
      const k = `${cls.toLowerCase()}:${lvl}`;
      if (!_indexes.spellsByClassLevel.has(k)) {
        _indexes.spellsByClassLevel.set(k, []);
      }
      _indexes.spellsByClassLevel.get(k).push({ name: spellName, ...data });
    }
  }

  // Equipment index across all categories
  const eq = srd.equipment || {};
  const addCategoryItems = (items, category, type) => {
    if (!Array.isArray(items)) return;
    for (const it of items) {
      if (!it || !it.name) continue;
      const key = String(it.name).trim().toLowerCase();
      _indexes.equipment.set(key, { ...it, name: String(it.name).trim(), category, type });
    }
  };

  // Weapons
  for (const [cat, list] of Object.entries(eq.weapons || {})) {
    addCategoryItems(list, cat, 'weapon');
  }
  // Armor
  for (const [cat, list] of Object.entries(eq.armor || {})) {
    addCategoryItems(list, cat, 'armor');
  }
  // Adventuring gear
  addCategoryItems(eq.adventuring_gear, 'adventuring_gear', 'gear');
  // Packs
  for (const [packName, packData] of Object.entries(eq.packs || {})) {
    const key = packName.trim().toLowerCase();
    _indexes.equipment.set(key, { name: packName.trim(), ...packData, category: 'packs', type: 'pack' });
  }
}

// ── Path navigation helper ──────────────────────────────────────────────────
function resolvePath(obj, pathStr) {
  if (!pathStr || pathStr === '/' || pathStr === '.') return obj;
  const parts = pathStr.replace(/^\//, '').split('/').filter(Boolean);
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

// ── Deterministic Query API ─────────────────────────────────────────────────

export function list_top_level() {
  const srd = loadSRD();
  return Object.keys(srd);
}

export function keys(pathStr) {
  const srd = loadSRD();
  const val = resolvePath(srd, pathStr);
  if (val == null || typeof val !== 'object') return [];
  return Array.isArray(val) ? Object.keys(val) : Object.keys(val);
}

export function get(pathStr) {
  const srd = loadSRD();
  return resolvePath(srd, pathStr);
}

export function count(pathStr) {
  const val = get(pathStr);
  if (val == null) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'object') return Object.keys(val).length;
  return 1;
}

export function slice(pathStr, start, end) {
  const val = get(pathStr);
  if (Array.isArray(val)) return val.slice(start, end);
  if (val && typeof val === 'object') {
    const entries = Object.entries(val).slice(start, end);
    return Object.fromEntries(entries);
  }
  return val;
}

export function search(section, field, value) {
  const srd = loadSRD();
  const sec = srd[section];
  if (!sec) return [];

  const targetStr = String(value).toLowerCase();
  const results = [];

  const check = (key, item) => {
    if (!item || typeof item !== 'object') return;
    const itemVal = item[field];
    if (itemVal != null && String(itemVal).toLowerCase() === targetStr) {
      results.push({ key, ...item });
    }
  };

  if (Array.isArray(sec)) {
    sec.forEach((it, idx) => check(idx, it));
  } else {
    for (const [k, it] of Object.entries(sec)) {
      check(k, it);
    }
  }
  return results;
}

export function filter(section, predicate) {
  const srd = loadSRD();
  const sec = srd[section];
  if (!sec) return [];

  if (Array.isArray(sec)) {
    return sec.filter(predicate);
  } else {
    const out = {};
    for (const [k, v] of Object.entries(sec)) {
      if (predicate(v, k)) out[k] = v;
    }
    return out;
  }
}

// ── High-Level VTT Sheet Wrappers ───────────────────────────────────────────

export function get_race(name, subrace = null) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.races.get(String(name).trim().toLowerCase());
  if (!entry) return null;

  const base = entry.data;
  const canonicalName = entry.name;

  // ASI copy
  const asi = { ...(base.ability_score_increase || {}) };
  const traits = Array.isArray(base.traits) ? [...base.traits] : [];

  let chosenSubrace = null;
  if (subrace && base.subraces) {
    const subKey = Object.keys(base.subraces).find(
      (k) => k.toLowerCase() === String(subrace).trim().toLowerCase()
    );
    if (subKey && base.subraces[subKey]) {
      chosenSubrace = base.subraces[subKey];
      // Fold in subrace ASI
      for (const [stat, bonus] of Object.entries(chosenSubrace.ability_score_increase || {})) {
        asi[stat] = (asi[stat] || 0) + bonus;
      }
      if (Array.isArray(chosenSubrace.traits)) {
        traits.push(...chosenSubrace.traits);
      }
    }
  }

  return {
    name: canonicalName,
    source: base.source || 'SRD',
    size: base.size || 'Medium',
    speed: base.speed || 30,
    darkvision: base.darkvision ?? null,
    languages: Array.isArray(base.languages) ? base.languages : [],
    ability_score_increase: asi,
    traits,
    subraces: base.subraces ? Object.keys(base.subraces) : [],
    subraces_list: base.subraces
      ? Object.entries(base.subraces).map(([subName, subData]) => ({
          name: subName,
          source: subData.source || 'SRD',
          ability_score_increase: subData.ability_score_increase || {},
          traits: Array.isArray(subData.traits) ? subData.traits : [],
        }))
      : [],
    chosen_subrace: chosenSubrace ? subrace : null,
  };
}

export function get_class(name, subclass = null, level = null) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.classes.get(String(name).trim().toLowerCase());
  if (!entry) return null;

  const base = entry.data;
  const canonicalName = entry.name;
  const targetLevel = level != null ? Math.max(1, Math.min(20, Number(level) || 1)) : null;

  // Features up to level
  let features = Array.isArray(base.features) ? [...base.features] : [];
  if (targetLevel != null) {
    features = features.filter((f) => (Number(f.level) || 1) <= targetLevel);
  }
  features.sort((a, b) => (Number(a.level) || 1) - (Number(b.level) || 1));

  // Subclass features if chosen
  let subDetails = null;
  if (subclass && base.subclasses) {
    const subKey = Object.keys(base.subclasses).find(
      (k) => k.toLowerCase() === String(subclass).trim().toLowerCase()
    );
    if (subKey && base.subclasses[subKey]) {
      const sub = base.subclasses[subKey];
      let subFeatures = Array.isArray(sub.features) ? [...sub.features] : [];
      if (targetLevel != null) {
        subFeatures = subFeatures.filter((f) => (Number(f.level) || 1) <= targetLevel);
      }
      subDetails = {
        name: subKey,
        source: sub.source,
        description: sub.description,
        features: subFeatures,
      };
      features.push(...subFeatures);
    }
  }

  // Spellcasting calculation
  let spellcasting = null;
  if (base.spellcasting) {
    const sc = base.spellcasting;
    const l = targetLevel || 1;
    const slots = {};
    if (sc.spell_slots_by_level) {
      for (const [slotLvl, levelsArr] of Object.entries(sc.spell_slots_by_level)) {
        if (Array.isArray(levelsArr) && levelsArr[l] !== undefined) {
          slots[slotLvl] = levelsArr[l];
        }
      }
    }

    const ABIL_MAP = {
      intelligence: 'INT',
      wisdom: 'WIS',
      charisma: 'CHA',
      strength: 'STR',
      dexterity: 'DEX',
      constitution: 'CON',
    };
    const ab = String(sc.ability || '').trim().toLowerCase();
    const normalizedAbility = ABIL_MAP[ab] || sc.ability;

    spellcasting = {
      ability: normalizedAbility,
      cantrips_known: Array.isArray(sc.cantrips_known) ? sc.cantrips_known[l] ?? 0 : 0,
      spells_known: Array.isArray(sc.spells_known) ? sc.spells_known[l] ?? 0 : null,
      spells_prepared: sc.spells_prepared || null,
      slots,
      ritual_casting: !!sc.ritual_casting,
      spellcasting_focus: sc.spellcasting_focus || null,
    };
  }

  return {
    name: canonicalName,
    source: base.source || 'SRD',
    hit_die: base.hit_die || 8,
    primary_ability: Array.isArray(base.primary_ability) ? base.primary_ability : [],
    saving_throws: Array.isArray(base.saving_throws) ? base.saving_throws : [],
    skill_choices: base.skill_choices || null,
    proficiencies: base.proficiencies || {},
    starting_equipment: Array.isArray(base.starting_equipment) ? base.starting_equipment : [],
    subclasses: base.subclasses ? Object.keys(base.subclasses) : [],
    subclasses_list: base.subclasses
      ? Object.entries(base.subclasses).map(([subName, subData]) => ({
          name: subName,
          source: subData.source || 'SRD',
          description: subData.description || '',
          features: Array.isArray(subData.features) ? subData.features : [],
        }))
      : [],
    subclass_details: subDetails,
    features,
    spellcasting,
  };
}

export function get_class_features(name, level = 1) {
  const cls = get_class(name, null, level);
  return cls ? cls.features : [];
}

export function get_spell_slots(name, level = 1) {
  const cls = get_class(name, null, level);
  return cls?.spellcasting?.slots || {};
}

export function get_spell_list(className, maxLevel = 9) {
  loadSRD();
  const clsKey = String(className).trim().toLowerCase();
  const spells = [];
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const list = _indexes.spellsByClassLevel.get(`${clsKey}:${lvl}`);
    if (list) spells.push(...list);
  }
  return spells;
}

export function get_spell(name) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.spells.get(String(name).trim().toLowerCase());
  return entry ? { name: entry.name, ...entry.data } : null;
}

export function get_equipment_stats(name) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.equipment.get(String(name).trim().toLowerCase());
  return entry || null;
}

export function get_feat(name) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.feats.get(String(name).trim().toLowerCase());
  return entry ? { name: entry.name, ...entry.data } : null;
}

export function get_background(name) {
  loadSRD();
  if (!name) return null;
  const entry = _indexes.backgrounds.get(String(name).trim().toLowerCase());
  return entry ? { name: entry.name, ...entry.data } : null;
}
