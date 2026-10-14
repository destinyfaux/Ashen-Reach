// ASHENREACH — server/src/rules/Mechanics.js
// The mechanics overlay runtime. The SRD (srd_data.json) stays an immutable
// content database; this module loads the separate mechanics_overlay.json —
// formulas, costs, triggers, effects compiled ONCE from SRD prose — and exposes
// deterministic primitives the rules engine executes directly. No LLM, no eval.
//
// Public API:
//   loadOverlay()                    -> parsed mechanics_overlay.json (cached; {} on failure)
//   evaluateFormula(expr, ctx)       -> number | null      safe tiny parser (never throws)
//   formulaContext(sheetOrToken)     -> expression context {level, classLevel, profBonus, strMod..chaMod}
//   initResources(sheet)             -> sheet.resources + sheet.passives + sheet.actions (mutating, idempotent)
//   passivesFor(sheetOrToken)        -> passive hook bundle (computes + caches if missing)
//   featureActions(sheet)            -> executable action manifest
//   resourceMax(id, ctx)             -> number
//   spendResource(sheet, id, n?)     -> {ok, remaining} | {ok:false, reason}
//   recoverResources(sheet, kind)    -> [ids recovered]  kind: 'short_rest' | 'long_rest'
//   activationOf(sheetOrToken, id)   -> 'action' | 'bonus' | 'free' | 'reaction' | null
//   fightingStyleOf(sheetOrToken)    -> style string | null
//   extraAttacksFor(sheetOrToken)    -> number (0 = single attack)
//   rageDamageBonus(classLevel)      -> 2 | 3 | 4
//
// Design rules mirror the rest of rules/: plain ESM, zero deps, NEVER throws —
// malformed overlay entries fall back to inert defaults.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OVERLAY_PATH = path.join(__dirname, '..', 'data', 'mechanics_overlay.json');

let _overlay = null;
export function loadOverlay() {
  if (_overlay) return _overlay;
  try {
    _overlay = JSON.parse(fs.readFileSync(OVERLAY_PATH, 'utf-8'));
    if (!_overlay || typeof _overlay !== 'object') _overlay = {};
  } catch {
    _overlay = {};   // missing/corrupt overlay → text-only fallback everywhere
  }
  return _overlay;
}

// ── expression context ───────────────────────────────────────────────────────

export function formulaContext(sheetOrToken) {
  const s = sheetOrToken?.sheet || sheetOrToken || {};
  const mods = s.mods || {};
  const level = Number(s.level) || 1;
  return {
    level,
    classLevel: level,
    profBonus: Number(s.proficiencyBonus) || 2,
    strMod: Number(mods.str) || 0,
    dexMod: Number(mods.dex) || 0,
    conMod: Number(mods.con) || 0,
    intMod: Number(mods.int) || 0,
    wisMod: Number(mods.wis) || 0,
    chaMod: Number(mods.cha) || 0,
    resource: 0,
    slotLevel: 0,
    spellSlotLevel: 0
  };
}

// ── safe expression evaluator (no eval) ─────────────────────────────────────
// Grammar:
//   expr    := ternary
//   ternary := cmp ('?' expr ':' expr)?
//   cmp     := add (('=='|'!='|'>='|'<='|'>'|'<') add)?
//   add     := mul (('+'|'-') mul)*
//   mul     := unary (('*'|'/') unary)*
//   unary   := ('-')? primary
//   primary := number | ident | ident '(' args ')' | '(' expr ')'
// Functions: min, max, floor, ceil, abs, round. Unknown identifiers → 0.
// Returns null for anything malformed/oversized (callers fall back).

const MAX_EXPR_LEN = 200;
const FUNCS = {
  min: Math.min, max: Math.max,
  floor: Math.floor, ceil: Math.ceil,
  abs: Math.abs, round: Math.round
};

export function evaluateFormula(expr, ctx = {}) {
  if (typeof expr !== 'string') {
    if (typeof expr === 'number' && Number.isFinite(expr)) return expr;
    return null;
  }
  const src = expr.trim();
  if (!src || src.length > MAX_EXPR_LEN) return null;
  const tokens = tokenize(src);
  if (!tokens) return null;
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const num = Number(s.slice(i, j));
        if (!Number.isFinite(num)) return null;
        out.push({ t: 'num', v: num });
        i = j;
        continue;
      }
      if (/[a-z_]/i.test(c)) {
        let j = i;
        while (j < s.length && /[a-z0-9_]/i.test(s[j])) j++;
        out.push({ t: 'id', v: s.slice(i, j) });   // case preserved (ctx keys are camelCase)
        i = j;
        continue;
      }
      const two = s.slice(i, i + 2);
      if (two === '==' || two === '!=' || two === '>=' || two === '<=') {
        out.push({ t: 'op', v: two });
        i += 2;
        continue;
      }
      if ('+-*/()?:<>,'.includes(c)) {
        out.push({ t: 'op', v: c });
        i++;
        continue;
      }
      return null;   // unknown character
    }
    return out.length ? out : null;
  }

  function parseExpr() { return parseTernary(); }
  function parseTernary() {
    const cond = parseCmp();
    if (cond === null) return null;
    if (peek()?.t === 'op' && peek().v === '?') {
      next();
      const a = parseExpr();
      if (a === null) return null;
      if (!(peek()?.t === 'op' && peek().v === ':')) return null;
      next();
      const b = parseExpr();
      if (b === null) return null;
      return cond !== 0 ? a : b;   // truthiness: nonzero is true
    }
    return cond;
  }
  function parseCmp() {
    let left = parseAdd();
    if (left === null) return null;
    while (peek()?.t === 'op' && ['==', '!=', '>=', '<=', '>', '<'].includes(peek().v)) {
      const op = next().v;
      const right = parseAdd();
      if (right === null) return null;
      left = op === '==' ? (left === right ? 1 : 0)
        : op === '!=' ? (left !== right ? 1 : 0)
          : op === '>=' ? (left >= right ? 1 : 0)
            : op === '<=' ? (left <= right ? 1 : 0)
              : op === '>' ? (left > right ? 1 : 0)
                : (left < right ? 1 : 0);
    }
    return left;
  }
  function parseAdd() {
    let left = parseMul();
    if (left === null) return null;
    while (peek()?.t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = next().v;
      const right = parseMul();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }
  function parseMul() {
    let left = parseUnary();
    if (left === null) return null;
    while (peek()?.t === 'op' && (peek().v === '*' || peek().v === '/')) {
      const op = next().v;
      const right = parseUnary();
      if (right === null) return null;
      if (op === '/' && right === 0) return null;   // division by zero → malformed
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }
  function parseUnary() {
    if (peek()?.t === 'op' && peek().v === '-') {
      next();
      const v = parseUnary();
      return v === null ? null : -v;
    }
    return parsePrimary();
  }
  function parsePrimary() {
    const tk = next();
    if (!tk) return null;
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'id') {
      if (peek()?.t === 'op' && peek().v === '(') {
        next();
        const args = [];
        if (!(peek()?.t === 'op' && peek().v === ')')) {
          for (;;) {
            const a = parseExpr();
            if (a === null) return null;
            args.push(a);
            if (peek()?.t === 'op' && peek().v === ',') { next(); continue; }
            break;
          }
        }
        if (!(peek()?.t === 'op' && peek().v === ')')) return null;
        next();
        const fn = FUNCS[tk.v];
        if (!fn || args.length === 0) return null;
        return fn(...args);
      }
      if (tk.v in ctx) {
        const v = Number(ctx[tk.v]);
        return Number.isFinite(v) ? v : 0;
      }
      return 0;   // unknown identifier — inert, never throws
    }
    if (tk.t === 'op' && tk.v === '(') {
      const v = parseExpr();
      if (v === null) return null;
      if (!(peek()?.t === 'op' && peek().v === ')')) return null;
      next();
      return v;
    }
    return null;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) return null;
  return Number.isFinite(result) ? result : null;
}

// ── feature / trait lookup ───────────────────────────────────────────────────

const titleKey = (s) => String(s || '').trim().toLowerCase();

/** Features available on the sheet: [{level, name, source?}]. */
function sheetFeatures(s) {
  const arr = s?.features || s?.sheet?.features;
  return Array.isArray(arr) ? arr.filter(f => f && f.name) : [];
}

/** True when the sheet carries this class feature (by name) at/below level. */
export function hasClassFeature(s, featureName) {
  const level = Number(s?.level ?? s?.sheet?.level) || 1;
  return sheetFeatures(s).some(f =>
    titleKey(f.name) === titleKey(featureName) && (Number(f.level) || 1) <= level);
}

/** True when the sheet carries this racial trait (by name). */
export function hasRacialTrait(s, traitName) {
  const list = s?.traits || s?.sheet?.traits || [];
  return list.some(t => t && titleKey(t.name) === titleKey(traitName));
}

/** The overlay entry for a class feature ("Fighter/Second Wind"), or null. */
export function featureEntry(className, featureName) {
  const entries = featureEntriesFor(className, featureName);
  return entries.length ? entries[0] : null;
}

/**
 * ALL overlay feature entries granted by one sheet feature. Matches by exact
 * "Class/Feature" key, by entry name, or by entry.sourceFeature — one SRD
 * feature may compile into several actions (Cunning Action → Dash/Disengage/Hide).
 */
export function featureEntriesFor(className, featureName) {
  const overlay = loadOverlay();
  const features = overlay.features || {};
  const direct = features[`${className}/${featureName}`];
  if (direct) return [direct];
  const want = titleKey(featureName);
  return Object.values(features).filter(e =>
    e && (titleKey(e.name) === want || titleKey(e.sourceFeature) === want));
}

/** Overlay passives entry ("Fighter/Extra Attack"), gated by level. */
export function passiveEntry(className, featureName) {
  const overlay = loadOverlay();
  const key = `${className}/${featureName}`;
  const e = overlay.passives?.[key];
  if (!e) return null;
  return e;
}

// ── resources ────────────────────────────────────────────────────────────────

export function resourceMax(id, ctx) {
  const def = loadOverlay().resources?.[id];
  if (!def) return 0;
  const v = evaluateFormula(def.max, ctx);
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

/**
 * Initialize (idempotently) the mechanics fields on a Sheet:
 *   sheet.resources — resource pools keyed by overlay id
 *   sheet.passives  — passive hook bundle (racial + class)
 *   sheet.actions   — executable action manifest for the HUD
 * Sheets built before the overlay existed get upgraded on first contact.
 */
export function initResources(sheet) {
  if (!sheet || typeof sheet !== 'object') return;
  const ctx = formulaContext(sheet);
  const className = sheet.class || 'Fighter';
  const raceName = sheet.race || 'Human';

  // -- resources from class/subclass features --
  const resources = (sheet.resources && typeof sheet.resources === 'object') ? sheet.resources : {};
  for (const f of sheetFeatures(sheet)) {
    if ((Number(f.level) || 1) > (Number(sheet.level) || 1)) continue;
    for (const entry of featureEntriesFor(className, f.name)) {
      if (!entry?.resource) continue;
      const def = loadOverlay().resources?.[entry.resource];
      if (!def || resources[entry.resource]) continue;
      const max = resourceMax(entry.resource, ctx);
      resources[entry.resource] = { cur: max, max, recovery: def.recovery || 'long_rest', label: def.label || entry.name || entry.resource };
    }
  }
  // -- resources from racial hooks (Relentless Endurance) --
  for (const [traitName, hook] of Object.entries(loadOverlay().racial || {})) {
    if (hook.hook !== 'damage_floor' || !hook.resource) continue;
    if (!hasRacialTrait(sheet, traitName.split('/')[1])) continue;
    const def = loadOverlay().resources?.[hook.resource];
    if (!def || resources[hook.resource]) continue;
    const max = resourceMax(hook.resource, ctx);
    resources[hook.resource] = { cur: max, max, recovery: def.recovery || 'long_rest', label: def.label || hook.resource };
  }
  sheet.resources = resources;

  // -- passives bundle --
  sheet.passives = buildPassives(sheet);

  // -- executable action manifest --
  sheet.actions = featureActions(sheet);
}

/** Passive hook bundle used by CombatEngine (cached on sheet.passives). */
export function buildPassives(sheet) {
  const className = sheet?.class || null;
  const level = Number(sheet?.level) || 1;
  const p = {
    rerollNat1: null,        // {kinds: [...]} halfling lucky
    saveAdvantage: {},       // {frightened: true, poison: true, charm: true, dex: true}
    resistances: [],         // racial/type resistances (fire …)
    damageFloor: null,       // {resource} relentless endurance
    critExtraDice: 0,        // savage attacks
    uncannyDodge: false,
    extraAttacks: 0,
    discipleOfLife: false,
    fightingStyle: fightingStyleOf(sheet)
  };

  // racial hooks
  for (const [traitName, hook] of Object.entries(loadOverlay().racial || {})) {
    if (!hasRacialTrait(sheet, traitName.split('/')[1])) continue;
    if (hook.hook === 'reroll_nat1') p.rerollNat1 = { kinds: hook.kinds || ['attack', 'save'] };
    if (hook.hook === 'save_advantage' && hook.vs) p.saveAdvantage[hook.vs] = true;
    if (hook.type) p.resistances.push(hook.type);   // resistance may ride any hook kind
    if (hook.hook === 'damage_floor') p.damageFloor = { resource: hook.resource || null };
    if (hook.hook === 'crit_extra_dice') p.critExtraDice += Number(hook.dice) || 0;
  }

  // class passives (overlay 'passives' table, keyed "Class/Feature Name")
  if (className) {
    for (const f of sheetFeatures(sheet)) {
      const entry = passiveEntry(className, f.name);
      if (!entry) continue;
      if ((Number(f.level) || 1) > level) continue;
      if (entry.extraAttacks) p.extraAttacks += Number(entry.extraAttacks) || 0;
      if (entry.uncannyDodge) p.uncannyDodge = true;
      if (entry.discipleOfLife) p.discipleOfLife = true;
      if (entry.saveAdvantage) {
        for (const [k, v] of Object.entries(entry.saveAdvantage)) {
          if (v) p.saveAdvantage[k] = true;
        }
      }
    }
  }
  return p;
}

/** Lazily compute + cache passives (tokens may carry pre-overlay sheets). */
export function passivesFor(sheetOrToken) {
  const s = sheetOrToken?.sheet || sheetOrToken;
  if (!s) return null;
  if (s.passives && typeof s.passives === 'object') return s.passives;
  const p = buildPassives(s);
  s.passives = p;
  return p;
}

/** Fighting style from the sheet (house default applied at build time). */
export function fightingStyleOf(sheetOrToken) {
  const s = sheetOrToken?.sheet || sheetOrToken || {};
  return (typeof s.fightingStyle === 'string' && s.fightingStyle) ? s.fightingStyle : null;
}

/** Extra attacks granted by the Attack action (Extra Attack feature). */
export function extraAttacksFor(sheetOrToken) {
  const p = passivesFor(sheetOrToken);
  return Math.max(0, Number(p?.extraAttacks) || 0);
}

export function rageDamageBonus(classLevel) {
  const l = Number(classLevel) || 1;
  if (l >= 16) return 4;
  if (l >= 9) return 3;
  return 2;
}

// ── action manifest ──────────────────────────────────────────────────────────

const ACTIVATION_ORDER = { action: 0, bonus: 1, free: 2, reaction: 3 };

/**
 * Executable actions for the HUD: [{id, name, activation, resource, summary}].
 * Passive features (no activation) are excluded — they ride the hooks.
 */
export function featureActions(sheet) {
  const className = sheet?.class;
  const level = Number(sheet?.level) || 1;
  const out = [];
  if (!className) return out;
  for (const f of sheetFeatures(sheet)) {
    if ((Number(f.level) || 1) > level) continue;
    for (const entry of featureEntriesFor(className, f.name)) {
      if (!entry?.activation || entry.activation === 'passive') continue;
      const res = entry.resource ? loadOverlay().resources?.[entry.resource] : null;
      out.push({
        id: entry.id || titleKey(entry.name).replace(/[^a-z0-9]+/g, '_'),
        name: entry.name || f.name,
        activation: entry.activation,
        resource: entry.resource || null,
        resourceLabel: res?.label || null,
        summary: entry.summary || (f.description || '').slice(0, 140)
      });
    }
  }
  out.sort((a, b) => (ACTIVATION_ORDER[a.activation] ?? 9) - (ACTIVATION_ORDER[b.activation] ?? 9) || a.name.localeCompare(b.name));
  return out;
}

/** Activation type of a feature action id ('action'|'bonus'|'free'|'reaction'|null). */
export function activationOf(sheetOrToken, actionId) {
  const s = sheetOrToken?.sheet || sheetOrToken;
  const list = s?.actions || (s ? featureActions(s) : []);
  const a = (Array.isArray(list) ? list : []).find(x => x.id === actionId);
  return a ? a.activation : null;
}

/** Look up the full manifest entry (for the executor). */
export function actionEntry(sheetOrToken, actionId) {
  const s = sheetOrToken?.sheet || sheetOrToken;
  const className = s?.class;
  const list = Array.isArray(s?.actions) ? s.actions : (s ? featureActions(s) : []);
  const a = (Array.isArray(list) ? list : []).find(x => x.id === actionId);
  if (!a || !className) return null;
  // resolve back to the overlay feature entry by id (name or sourceFeature groups)
  for (const f of sheetFeatures(s)) {
    for (const entry of featureEntriesFor(className, f.name)) {
      if (entry && (entry.id || titleKey(entry.name).replace(/[^a-z0-9]+/g, '_')) === actionId) {
        return { entry, featureName: f.name };
      }
    }
  }
  return null;
}

// ── spend / recover ──────────────────────────────────────────────────────────

export function spendResource(sheetOrToken, id, n = 1) {
  const holder = sheetOrToken?.sheet || sheetOrToken;   // tokens carry resources on .sheet
  const pool = holder?.resources?.[id];
  if (!pool) return { ok: false, reason: 'no_resource' };
  const amount = Math.max(1, Math.floor(Number(n) || 1));
  if ((Number(pool.cur) || 0) < amount) return { ok: false, reason: 'resource_spent' };
  pool.cur -= amount;
  return { ok: true, remaining: pool.cur };
}

/**
 * Recover resource pools after a rest.
 * short_rest: pools tagged short_rest; long_rest: everything (a long rest
 * includes the short-rest recovery, RAW). Returns recovered pool ids.
 */
export function recoverResources(sheet, kind = 'long_rest') {
  const recovered = [];
  const pools = sheet?.resources;
  if (!pools || typeof pools !== 'object') return recovered;
  const want = kind === 'short_rest' ? ['short_rest'] : ['short_rest', 'long_rest'];
  for (const [id, pool] of Object.entries(pools)) {
    if (!pool || !want.includes(pool.recovery)) continue;
    if ((Number(pool.cur) || 0) >= (Number(pool.max) || 0)) continue;
    pool.cur = Number(pool.max) || 0;
    recovered.push(id);
  }
  return recovered;
}
