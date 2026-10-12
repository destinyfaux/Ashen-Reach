// ASHENREACH — server/src/rules/dice.js
// Dice-notation parser & roller. Zero dependencies, plain ESM.
// Ported + modernized from Custom-VTT server/utils/dice.js (proven in production VTT
// combat) and extended with:
//   • keep-highest / keep-lowest suffixes:  "4d6kh3", "2d20kl1", "4d6kh"
//   • expected-value helper for AI heuristics:  formulaAvg("2d6") === 7
//   • crit-aware damage rolling:  rollDamage("1d8+3", { crit: true }) doubles the
//     dice portion only (mods apply once), per 5E critical-hit rules.
//
// Design rules:
//   • NEVER throws — malformed input returns null so callers can fall back.
//   • rng is injectable for deterministic tests:  () => float in [0, 1).
//
// Grammar (whitespace-free, case-insensitive):
//   formula  := term (('+'|'-') term)*
//   term     := [count] 'd' sides [keep] | integer
//   keep     := ('kh'|'kl') [keepCount]        // keep-highest / keep-lowest
// Examples: "1d20+3", "2d6", "18d10+36", "2d6+1d4+2", "3d6 - 2", "4d6kh3", "2d20kh"

const MAX_FORMULA_LENGTH = 64;
const MAX_DICE_COUNT = 500;
const MAX_DICE_SIDES = 10000;

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Parse a dice formula into structured terms.
 * @param {string} formula e.g. "18d10+36" or "4d6kh3"
 * @returns {Array<{sign:number, count?:number, sides?:number, keep?:{mode:'kh'|'kl', n:number}, flat?:number}>|null}
 */
export function parseDiceFormula(formula) {
  if (typeof formula !== 'string') return null;
  const cleaned = formula.trim().toLowerCase().replace(/\s+/g, '');
  if (!cleaned || cleaned.length > MAX_FORMULA_LENGTH) return null;

  // Split into signed terms: "18d10+36" -> ["18d10", "+36"]; "3d6 - 2" -> ["3d6", "-2"]
  const terms = cleaned.match(/[+-]?[^+-]+/g);
  if (!terms || terms.length === 0) return null;
  // Reject trailing/leading garbage ("1d20+", "d" fragments): signed terms must
  // reconstruct the cleaned formula exactly.
  if (terms.join('') !== cleaned) return null;

  const parsed = [];
  for (const term of terms) {
    const sign = term.startsWith('-') ? -1 : 1;
    const body = term.replace(/^[+-]/, '');
    if (!body) return null;

    const diceMatch = body.match(/^(\d*)d(\d+)(?:(kh|kl)(\d*))?$/);
    if (diceMatch) {
      const count = diceMatch[1] === '' ? 1 : parseInt(diceMatch[1], 10);
      const sides = parseInt(diceMatch[2], 10);
      if (!Number.isFinite(count) || !Number.isFinite(sides)) return null;
      if (count < 1 || sides < 1 || count > MAX_DICE_COUNT || sides > MAX_DICE_SIDES) return null;
      const termOut = { sign, count, sides };
      if (diceMatch[3]) {
        let keepN = diceMatch[4] === undefined || diceMatch[4] === '' ? 1 : parseInt(diceMatch[4], 10);
        if (!Number.isFinite(keepN) || keepN < 1) keepN = 1;
        if (keepN > count) keepN = count;           // "4d6kh9" == "4d6" (keep all)
        termOut.keep = { mode: diceMatch[3], n: keepN };
      }
      parsed.push(termOut);
      continue;
    }

    const flat = parseInt(body, 10);
    if (!Number.isFinite(flat) || String(flat) !== body) return null;
    parsed.push({ sign, flat });
  }

  return parsed.length > 0 ? parsed : null;
}

/**
 * Roll a single die using an injectable rng in [0,1).
 */
const die = (sides, rng) => 1 + Math.floor(rng() * sides);

/**
 * Roll previously-parsed terms.
 * @param {Array} parsed output of parseDiceFormula
 * @param {() => number} rng injectable random source
 * @returns {{total: number, rolls: number[], dropped: number[]}}
 *   rolls = every die rolled (kept + dropped) so the client dice tray can show all;
 *   dropped = dice removed by kh/kl (empty array when none).
 */
export function rollParsed(parsed, rng = Math.random) {
  let total = 0;
  const rolls = [];
  const dropped = [];
  for (const term of parsed) {
    if (term.flat !== undefined) {
      total += term.sign * term.flat;
      continue;
    }
    if (term.keep) {
      const group = [];
      for (let i = 0; i < term.count; i++) group.push(die(term.sides, rng));
      const order = group.map((v, i) => i).sort((a, b) => term.keep.mode === 'kh' ? group[b] - group[a] : group[a] - group[b]);
      const keepIdx = new Set(order.slice(0, term.keep.n));
      let sum = 0;
      group.forEach((v, i) => {
        rolls.push(v);
        if (keepIdx.has(i)) sum += v; else dropped.push(v);
      });
      total += term.sign * sum;
      continue;
    }
    for (let i = 0; i < term.count; i++) {
      const roll = die(term.sides, rng);
      rolls.push(roll);
      total += term.sign * roll;
    }
  }
  return { total, rolls, dropped };
}

/**
 * Roll a dice formula string.
 * @param {string} formula e.g. "4d6+4"
 * @param {() => number} rng injectable random source (default Math.random)
 * @returns {{total: number, rolls: number[], dropped?: number[], formula: string}|null}
 *   null when unparseable. For plain formulas sum(rolls) === total and `dropped` is [].
 */
export function rollDiceFormula(formula, rng = Math.random) {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return null;
  const { total, rolls, dropped } = rollParsed(parsed, rng);
  const out = { total, rolls, formula: String(formula).trim() };
  if (dropped.length) out.dropped = dropped;
  return out;
}

/**
 * d20 roll with 5E advantage / disadvantage.
 * Advantage and disadvantage cancel (one die) per RAW.
 * @param {number} mod modifier added to the counted die
 * @param {{adv?: boolean, dis?: boolean}} opts
 * @param {() => number} rng
 * @returns {{rolls: number[], total: number, nat: number}}
 *   rolls: 1 or 2 natural die faces; nat: the counted face; total: nat + mod.
 */
export function d20(mod = 0, { adv = false, dis = false } = {}, rng = Math.random) {
  const twoDice = (adv && !dis) || (dis && !adv);
  const r1 = die(20, rng);
  if (!twoDice) return { rolls: [r1], total: r1 + mod, nat: r1 };
  const r2 = die(20, rng);
  const nat = adv ? Math.max(r1, r2) : Math.min(r1, r2);
  return { rolls: [r1, r2], total: nat + mod, nat };
}

/**
 * Roll damage, 5E critical-hit aware: the DICE portion of the formula is rolled
 * `times` times (2 on crit); flat modifiers apply once.
 * @param {string} formula e.g. "1d8+3"
 * @param {{crit?: boolean, bonusMod?: number, times?: number, halve?: boolean, rng?: () => number}} opts
 *   bonusMod: extra flat damage applied once after rolling (e.g. sneak attack mod)
 * @returns {{total: number, rolls: number[], formula: string, crit: boolean}|null}
 */
export function rollDamage(formula, { crit = false, bonusMod = 0, times = 1, halve = false, rng = Math.random } = {}) {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return null;
  const mult = crit ? Math.max(2, times) : times;

  let total = bonusMod;
  const rolls = [];
  const dropped = [];
  for (const term of parsed) {
    if (term.flat !== undefined) { total += term.sign * term.flat; continue; }
    // roll the dice term `mult` times
    for (let t = 0; t < mult; t++) {
      const rolled = rollParsed([{ ...term }], rng);
      total += term.sign * rolled.total;
      rolls.push(...rolled.rolls);
      dropped.push(...rolled.dropped);
    }
  }
  if (halve) total = Math.floor(total / 2);
  const out = { total: Math.max(0, total), rolls, formula: String(formula).trim(), crit };
  if (dropped.length) out.dropped = dropped;
  return out;
}

/**
 * Expected (average) value of a formula — for AI damage comparisons.
 * Keep-highest/lowest is approximated by the plain die average of kept dice
 * (exact EV of order statistics is unnecessary for v1 heuristics).
 * @returns {number|null}
 */
export function formulaAvg(formula) {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return null;
  let avg = 0;
  for (const term of parsed) {
    if (term.flat !== undefined) { avg += term.sign * term.flat; continue; }
    const kept = term.keep ? term.keep.n : term.count;
    avg += term.sign * kept * (term.sides + 1) / 2;
  }
  return avg;
}

/**
 * Split a formula into its dice portion and flat portion — useful for UIs that
 * want to show "1d8+3 (crit: 2d8+3)".
 * @returns {{dice: string, flat: number, diceCount: number}|null}
 */
export function splitDiceFormula(formula) {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return null;
  let diceStr = '';
  let flat = 0;
  let diceCount = 0;
  for (const t of parsed) {
    if (t.flat !== undefined) { flat += t.sign * t.flat; continue; }
    const kept = t.keep ? t.keep.n : t.count;
    const nDice = t.keep ? t.count : kept;
    diceCount += nDice;
    const piece = `${nDice}d${t.sides}` + (t.keep ? `${t.keep.mode}${t.keep.n}` : '');
    diceStr += diceStr ? (t.sign < 0 ? `-${piece}` : `+${piece}`) : (t.sign < 0 ? `-${piece}` : piece);
  }
  return { dice: diceStr, flat, diceCount };
}

/**
 * Deterministic RNG for tests: consumes a fixed sequence of floats; repeats the
 * last value if the sequence is exhausted (so long rolls stay predictable).
 * @param {number[]} seq floats in [0,1) — each maps to one die roll
 *
 * Handy helper for picking a face:  u(face, sides) = (face - 1) / sides
 * yields exactly `face` on a die with `sides` sides (e.g. seqRng([14/20]) rolls
 * a natural 15 on a d20; [5/8] rolls a 6 on a d8).
 */
export function seqRng(seq) {
  let i = 0;
  return () => {
    if (seq.length === 0) return 0;
    const v = seq[i < seq.length ? i : seq.length - 1];
    i++;
    return v;
  };
}
