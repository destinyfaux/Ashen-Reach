// ASHENREACH — server/src/rules/dice.test.js
// dice.js: formulas (incl. keep-highest), adv/dis, crit damage, determinism.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseDiceFormula, rollDiceFormula, rollParsed, d20, rollDamage,
  formulaAvg, splitDiceFormula, seqRng
} from './dice.js';

// face → rng value that produces exactly that face on a die with `sides`
const u = (face, sides) => (face - 1) / sides;

test('parseDiceFormula accepts the documented grammar', () => {
  assert.deepEqual(parseDiceFormula('1d20+3'), [{ sign: 1, count: 1, sides: 20 }, { sign: 1, flat: 3 }]);
  assert.deepEqual(parseDiceFormula('2d6'), [{ sign: 1, count: 2, sides: 6 }]);
  assert.deepEqual(parseDiceFormula('3d6 - 2'), [{ sign: 1, count: 3, sides: 6 }, { sign: -1, flat: 2 }]);
  const kh = parseDiceFormula('4d6kh3');
  assert.equal(kh.length, 1);
  assert.deepEqual(kh[0].keep, { mode: 'kh', n: 3 });
  assert.deepEqual(parseDiceFormula('2d20kl1')[0].keep, { mode: 'kl', n: 1 });
  assert.deepEqual(parseDiceFormula('4d6kh')[0].keep, { mode: 'kh', n: 1 }); // bare kh keeps 1
});

test('parseDiceFormula rejects malformed input with null (never throws)', () => {
  for (const bad of ['', 'abc', '1d20+', 'd', '1d', '2d6+foo', 'banana', null, undefined, 42]) {
    assert.equal(parseDiceFormula(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test('rollDiceFormula: plain formulas sum their rolls', () => {
  const r = rollDiceFormula('2d6+1d4+2', seqRng([u(6, 6), u(6, 6), u(4, 4)]));
  assert.equal(r.total, 6 + 6 + 4 + 2);
  assert.deepEqual(r.rolls, [6, 6, 4]);
  assert.equal(r.formula, '2d6+1d4+2');

  const neg = rollDiceFormula('3d6-2', seqRng([u(6, 6), u(6, 6), u(1, 6)]));
  assert.equal(neg.total, 6 + 6 + 1 - 2);
  assert.equal(neg.dropped, undefined);
});

test('rollDiceFormula: 4d6kh3 keeps the highest three (stat generation)', () => {
  // rolls 2, 4, 6, 1 → keep 2+4+6 = 12, drop the 1
  const r = rollDiceFormula('4d6kh3', seqRng([u(2, 6), u(4, 6), u(6, 6), u(1, 6)]));
  assert.equal(r.total, 12);
  assert.deepEqual(r.rolls, [2, 4, 6, 1]);
  assert.deepEqual(r.dropped, [1]);
});

test('rollDiceFormula: keep-lowest (2d20kl1 = disadvantage roll)', () => {
  const r = rollDiceFormula('2d20kl1', seqRng([u(15, 20), u(7, 20)]));
  assert.equal(r.total, 7);
  assert.deepEqual(r.dropped, [15]);
});

test('rollDiceFormula returns null for unparseable formulas', () => {
  assert.equal(rollDiceFormula('not-a-formula'), null);
  assert.equal(rollDiceFormula('1d20+'), null);
});

test('d20: single die by default, mod applied', () => {
  const r = d20(5, {}, seqRng([u(15, 20)]));
  assert.deepEqual(r.rolls, [15]);
  assert.equal(r.nat, 15);
  assert.equal(r.total, 20);
});

test('d20: advantage takes the higher, disadvantage the lower', () => {
  const adv = d20(0, { adv: true }, seqRng([u(15, 20), u(7, 20)]));
  assert.deepEqual(adv.rolls, [15, 7]);
  assert.equal(adv.nat, 15);

  const dis = d20(0, { dis: true }, seqRng([u(15, 20), u(7, 20)]));
  assert.equal(dis.nat, 7);
  assert.equal(dis.total, 7);
});

test('d20: advantage and disadvantage cancel to a single die (RAW)', () => {
  const r = d20(3, { adv: true, dis: true }, seqRng([u(15, 20), u(7, 20)]));
  assert.equal(r.rolls.length, 1);
  assert.equal(r.nat, 15);
  assert.equal(r.total, 18);
});

test('rollDamage: crit doubles the dice portion, not the flat mod', () => {
  const crit = rollDamage('1d8+3', { crit: true, rng: seqRng([u(8, 8), u(3, 8)]) });
  assert.equal(crit.total, 8 + 3 + 3);
  assert.deepEqual(crit.rolls, [8, 3]);
  assert.equal(crit.crit, true);

  const normal = rollDamage('1d8+3', { rng: seqRng([u(8, 8)]) });
  assert.equal(normal.total, 11);
  assert.equal(normal.crit, false);
});

test('formulaAvg returns expected values', () => {
  assert.equal(formulaAvg('2d6'), 7);
  assert.equal(formulaAvg('1d20'), 10.5);
  assert.equal(formulaAvg('4d6kh3'), 10.5);
  assert.equal(formulaAvg('nope'), null);
});

test('splitDiceFormula separates dice from flat', () => {
  assert.deepEqual(splitDiceFormula('1d8+3'), { dice: '1d8', flat: 3, diceCount: 1 });
});

test('seqRng: same seed sequence → identical rolls (determinism)', () => {
  const a = rollDiceFormula('3d6', seqRng([0.11, 0.37, 0.94]));
  const b = rollDiceFormula('3d6', seqRng([0.11, 0.37, 0.94]));
  assert.deepEqual(a, b);
  // exhausted sequences repeat the last value (long rolls stay predictable)
  const c = rollParsed([{ count: 3, sides: 6 }], seqRng([0.5]));
  assert.deepEqual(c.rolls, [4, 4, 4]);
});
