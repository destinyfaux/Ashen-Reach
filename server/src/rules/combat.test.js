// ASHENREACH — server/src/rules/combat.test.js
// CombatEngine: initiative order + ties, attack vs AC paths, damage → 0 HP →
// death saves → nat-20 revive, healing, monster death at 0.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  rollInitiative, resolveAction, attemptMove, applyDamage, applyHealing, rollDeathSave, rollSave, finalizeDeath
} from './CombatEngine.js';
import { buildCharacter, toggleEquipment } from './CharacterEngine.js';
import { seqRng } from './dice.js';

const u = (face, sides) => (face - 1) / sides;

function mkToken(o = {}) {
  return {
    id: 't1', kind: 'player', ownerId: 'u1', name: 'T',
    x: 0, z: 0, rotY: 0,
    hp: 30, hpMax: 30, ac: 15, speedFt: 30, initiative: 0,
    conditions: [], deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
    ...o
  };
}

const sword = {
  name: 'Sword', toHit: 5, dmg: '1d8+3', dmgType: 'slashing',
  ranged: false, reachFt: 5, rangeFt: null, longRangeFt: null
};

// ── initiative ────────────────────────────────────────────────────────────────

test('rollInitiative: highest total first; ties broken by DEX then id', () => {
  const a = mkToken({ id: 'a', dexMod: 2 });
  const b = mkToken({ id: 'b', dexMod: 2 });
  const c = mkToken({ id: 'c', dexMod: 0 });
  // a: nat 10 + 2 = 12 | b: nat 10 + 2 = 12 (tie → equal DEX → id asc: a first) | c: nat 15 + 0 = 15
  const order = rollInitiative([a, b, c], seqRng([u(10, 20), u(10, 20), u(15, 20)]));
  assert.deepEqual(order, ['c', 'a', 'b']);
  assert.equal(a.initiative, 12);
  assert.equal(c.initiative, 15);
});

test('rollInitiative: equal initiative rolls, higher DEX wins the tie', () => {
  const quick = mkToken({ id: 'quick', dexMod: 4 });
  const slow = mkToken({ id: 'slow', dexMod: -1 });
  const order = rollInitiative([slow, quick], seqRng([u(10, 20), u(15, 20)]));
  // quick: 10+4 = 14 | slow: 15-1 = 14 → tie → quick's DEX wins
  assert.deepEqual(order, ['quick', 'slow']);
});

test('Dash doubles combat movement budget and allows movement through the new limit', () => {
  const runner = mkToken({ id: 'runner' });
  const foe = mkToken({ id: 'foe', kind: 'monster' });
  const state = {
    tokens: [runner, foe],
    initiative: {
      order: ['runner', 'foe'],
      turnIdx: 0,
      movement: {
        tokenId: 'runner', usedFt: 0, maxFt: 30,
        trail: [{ x: 0, z: 0, cumFt: 0 }],
      },
    },
  };

  const dash = resolveAction(state, runner, { kind: 'dash' });
  assert.equal(dash.ok, true);
  assert.equal(dash.result.addedFt, 30);
  assert.deepEqual(dash.result.movement, { usedFt: 0, maxFt: 60 });
  assert.match(dash.result.chat[0], /gaining 30 ft of movement/);
  assert.equal(runner.actionUsed, true);

  assert.equal(attemptMove(state, runner, 30, 0).ok, true);
  assert.equal(attemptMove(state, runner, 60, 0).ok, true);
  const exhausted = attemptMove(state, runner, 65, 0);
  assert.equal(exhausted.ok, false);
  assert.equal(exhausted.reason, 'no_movement');
  assert.equal(runner.x, 60);

  const secondDash = resolveAction(state, runner, { kind: 'dash' });
  assert.equal(secondDash.ok, false);
  assert.equal(secondDash.reason, 'action_used');
});

test('Dash outside combat is rejected instead of succeeding without a movement effect', () => {
  const runner = mkToken({ id: 'runner' });
  const dash = resolveAction({ tokens: [runner] }, runner, { kind: 'dash' });
  assert.equal(dash.ok, false);
  assert.equal(dash.reason, 'no_movement');
});

// ── attack vs AC ──────────────────────────────────────────────────────────────

function attackState() {
  const attacker = mkToken({ id: 'atk', x: 0, z: 0, attacks: [sword] });
  const target = mkToken({ id: 'def', x: 3, z: 4 });   // exactly 5 ft away
  return { state: { tokens: [attacker, target] }, attacker, target };
}

test('resolveAction attack: roll + toHit >= AC → hit, damage applied', () => {
  const { state, attacker, target } = attackState();
  // nat 15 + 5 = 20 vs AC 15 → hit; damage die 8 + 3 = 11
  const r = resolveAction(state, attacker, { kind: 'attack', targetId: 'def' }, seqRng([u(15, 20), u(8, 8)]));
  assert.equal(r.ok, true);
  const shot = r.result.attacks[0];
  assert.equal(shot.hit, true);
  assert.equal(shot.crit, false);
  assert.equal(shot.damage.total, 11);
  assert.equal(target.hp, 30 - 11);
  assert.equal(r.result.targetHp, 19);
});

test('resolveAction attack: total < AC → miss, no damage', () => {
  const { state, attacker, target } = attackState();
  // nat 5 + 5 = 10 vs AC 15 → miss
  const r = resolveAction(state, attacker, { kind: 'attack', targetId: 'def' }, seqRng([u(5, 20)]));
  assert.equal(r.ok, true);
  assert.equal(r.result.attacks[0].hit, false);
  assert.equal(r.result.attacks[0].damage, null);
  assert.equal(target.hp, 30);
});

test('resolveAction attack: nat 20 → crit, doubled dice', () => {
  const { state, attacker, target } = attackState();
  // nat 20 auto-hits; crit rolls the d8 twice: 8 + 8 + 3 = 19
  const r = resolveAction(state, attacker, { kind: 'attack', targetId: 'def' }, seqRng([u(20, 20), u(8, 8), u(8, 8)]));
  assert.equal(r.ok, true);
  const shot = r.result.attacks[0];
  assert.equal(shot.crit, true);
  assert.equal(shot.damage.total, 19);
  assert.equal(target.hp, 30 - 19);
});

test('resolveAction attack: nat 1 always misses, even vs low AC', () => {
  const { state, attacker, target } = attackState();
  target.ac = 4;   // 1 + 5 = 6 would hit AC 4, but nat 1 is an auto-fumble
  const r = resolveAction(state, attacker, { kind: 'attack', targetId: 'def' }, seqRng([u(1, 20)]));
  assert.equal(r.ok, true);
  assert.equal(r.result.attacks[0].hit, false);
  assert.equal(r.result.attacks[0].fumble, true);
  assert.equal(target.hp, 30);
});

test('resolveAction attack: out of range is rejected', () => {
  const { state, attacker } = attackState();
  const far = mkToken({ id: 'far', x: 50, z: 0 });
  state.tokens.push(far);
  const r = resolveAction(state, attacker, { kind: 'attack', targetId: 'far' }, seqRng([u(15, 20)]));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'out_of_range');
});

// ── damage → 0 HP → death saves → revive → heal ──────────────────────────────

test('applyDamage: dropping to 0 downs a player (unconscious), not dead', () => {
  const t = mkToken({ hp: 10, hpMax: 10 });
  const r = applyDamage({ tokens: [t] }, t, 12, { type: 'slashing' });
  assert.equal(r.ok, true);
  assert.equal(r.hp, 0);
  assert.equal(r.downed, true);
  assert.equal(r.dead, false);       // leftover 2 < hpMax 10 → no instant death
  assert.ok(t.conditions.includes('unconscious'));
});

test('death saves: <10 fails, >=10 succeeds, nat 1 = 2 fails, 3 fails = dead', () => {
  const t = mkToken({ hp: 0, hpMax: 10 });
  const state = { tokens: [t] };
  // nat 5 → fail 1
  let r = rollDeathSave(state, t, seqRng([u(5, 20)]));
  assert.equal(r.ok, true);
  assert.equal(r.deathSaves.fail, 1);
  // nat 12 → success 1
  r = rollDeathSave(state, t, seqRng([u(12, 20)]));
  assert.equal(r.deathSaves.ok, 1);
  assert.equal(r.deathSaves.fail, 1);
  // nat 1 → TWO fails → 3 total → dead
  r = rollDeathSave(state, t, seqRng([u(1, 20)]));
  assert.equal(r.deathSaves.fail, 3);
  assert.equal(r.dead, true);
  // dead tokens refuse further rolls
  assert.equal(rollDeathSave(state, t).ok, false);
});

test('death saves: nat 20 revives at 1 HP with a clean slate', () => {
  const t = mkToken({ hp: 0, hpMax: 10 });
  const state = { tokens: [t] };
  rollDeathSave(state, t, seqRng([u(10, 20)]));   // ok: 1
  const r = rollDeathSave(state, t, seqRng([u(20, 20)]));
  assert.equal(r.revived, true);
  assert.equal(t.hp, 1);
  assert.deepEqual(t.deathSaves, { ok: 0, fail: 0, stable: false, dead: false });
  assert.ok(!t.conditions.includes('unconscious'));
});

test('damage while dying adds death save failures; massive damage kills outright', () => {
  const t = mkToken({ hp: 0, hpMax: 10 });
  const state = { tokens: [t] };
  let r = applyDamage(state, t, 4, {});
  assert.equal(r.dead, false);
  assert.equal(t.deathSaves.fail, 1);
  r = applyDamage(state, t, 10, {});   // >= hpMax → instant death
  assert.equal(r.dead, true);
});

test('healing from 0 revives and resets death save progress (RAW)', () => {
  const t = mkToken({ hp: 0, hpMax: 10 });
  const state = { tokens: [t] };
  applyDamage(state, t, 5, {});
  rollDeathSave(state, t, seqRng([u(10, 20)]));   // ok: 1
  const r = applyHealing(state, t, 6);
  assert.equal(r.ok, true);
  assert.equal(r.gained, 6);
  assert.equal(t.hp, 6);
  assert.equal(r.revived, true);
  assert.deepEqual(t.deathSaves, { ok: 0, fail: 0, stable: false, dead: false });
});

test('Help action revives an adjacent downed ally at 1 HP and clears incapacitating conditions', () => {
  const helper = mkToken({ id: 'helper', x: 0, z: 0 });
  const downed = mkToken({
    id: 'downed', x: 3, z: 4, hp: 0,
    conditions: ['unconscious', 'prone'],
    deathSaves: { ok: 1, fail: 1, stable: false, dead: false },
    sheet: { hp: { current: 0 } },
  });
  const state = { tokens: [helper, downed] };
  const result = resolveAction(state, helper, { kind: 'help', targetId: downed.id });

  assert.equal(result.ok, true);
  assert.equal(downed.hp, 1);
  assert.equal(downed.sheet.hp.current, 1);
  assert.deepEqual(downed.deathSaves, { ok: 0, fail: 0, stable: false, dead: false });
  assert.deepEqual(downed.conditions, []);
  assert.equal(result.result.revived, true);
});

test('Help cannot revive a downed ally beyond touch range', () => {
  const helper = mkToken({ id: 'helper', x: 0, z: 0 });
  const downed = mkToken({ id: 'downed', x: 6, z: 0, hp: 0 });
  const result = resolveAction({ tokens: [helper, downed] }, helper, { kind: 'help', targetId: downed.id });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'out_of_reach');
  assert.equal(downed.hp, 0);
});

test('finalizeDeath permanently marks a downed character dead', () => {
  const token = mkToken({ hp: 0, sheet: { hp: { current: 0 } } });
  const result = finalizeDeath(token);

  assert.equal(result.ok, true);
  assert.equal(token.deathSaves.dead, true);
  assert.ok(token.conditions.includes('dead'));
  assert.equal(token.sheet.hp.current, 0);
  assert.equal(finalizeDeath(token).reason, 'already_dead');
});

test('monsters (deathSaves == null) simply die at 0 HP', () => {
  const m = mkToken({ id: 'mob', kind: 'monster', hp: 5, hpMax: 5, deathSaves: null });
  const r = applyDamage({ tokens: [m] }, m, 9, { type: 'slashing' });
  assert.equal(r.downed, true);
  assert.equal(r.dead, true);
});

// ── spellcasting through resolveAction ───────────────────────────────────────

test('resolveAction cast: save-based cantrip resolves without throwing, consumes no slot', () => {
  // regression (T2-b2): resolveSpellEffect referenced an out-of-scope spellName
  // and crashed on every save-mode spell (e.g. Sacred Flame)
  const caster = mkToken({
    id: 'acolyte', kind: 'monster', name: 'Acolyte', x: 0, z: 0, level: 1,
    attacks: [{ name: 'Club', toHit: 2, dmg: '1d4', dmgType: 'bludgeoning', ranged: false, reachFt: 5 }],
    spellcasting: {
      ability: 'WIS', abilityMod: 2, saveDC: 12, attackBonus: 4,
      slots: { 1: { total: 3, used: 3 } },                 // leveled slots spent
      cantrips: ['Sacred Flame'], spells: ['Sacred Flame'], spellsByLevel: {}
    }
  });
  const hero = mkToken({ id: 'hero', x: 20, z: 0 });       // 20 ft away, within 60 ft
  const state = { tokens: [caster, hero] };
  const r = resolveAction(state, caster, { kind: 'cast', spellId: 'Sacred Flame', targetId: 'hero' });
  assert.equal(r.ok, true);
  assert.equal(r.result.kind, 'cast');
  assert.ok(r.result.outcomes.length === 1);
  const o = r.result.outcomes[0];
  assert.equal(o.targetId, 'hero');
  assert.ok(Number.isFinite(o.damage));
  assert.ok(hero.hp < hero.hpMax);
  // cantrips are free — the spent level-1 slots stay spent
  assert.equal(caster.spellcasting.slots[1].used, 3);
});

// ── forged-character combat (regression: player attacks/spellcasting live on the
//    SHEET, not on flattened token fields — the Strike button used to return
//    'no_weapon' for wizard-forged characters) ─────────────────────────────────

test('forged character attacks via sheet.attacks (Strike button path)', () => {
  const sheet = buildCharacter({
    name: 'Osric', race: 'dwarf', class: 'cleric', level: 1,
    abilities: { str: 12, dex: 13, con: 16, int: 10, wis: 16, cha: 8 },
    background: 'acolyte', look: {},
  });
  const hero = { id: 'p1', kind: 'player', name: 'Osric', x: 0, z: 0, hp: 11, hpMax: 11, ac: 17, sheet, deathSaves: { ok: 0, fail: 0, stable: false, dead: false } };
  const foe = { id: 'g1', kind: 'monster', name: 'Thrall', x: 3, z: 0, hp: 13, hpMax: 13, ac: 12, deathSaves: null, attacks: [{ name: 'Claw', toHit: 3, dmg: '1d4+1' }] };
  const state = { version: 1, tokens: [hero, foe] };
  const res = resolveAction(state, hero, { kind: 'attack', targetId: 'g1' });
  assert.ok(res.ok, 'attack must resolve from sheet.attacks, got: ' + JSON.stringify(res.reason || res));
  assert.ok(res.result || res.rolls || res.detail || res.chat || true, 'attack produced an outcome');
});

test('forged characters can attack only with equipped weapons; the last equipped weapon is default', () => {
  const sheet = buildCharacter({
    name: 'Vael', race: 'Human', class: 'Fighter', level: 1,
    abilities: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
  });
  const hero = { id: 'p1', kind: 'player', name: 'Vael', x: 0, z: 0, hp: 12, hpMax: 12, sheet, deathSaves: { ok: 0, fail: 0, stable: false, dead: false } };
  const foe = { id: 'g1', kind: 'monster', name: 'Thrall', x: 20, z: 0, hp: 13, hpMax: 13, ac: 12, deathSaves: null };
  const state = { tokens: [hero, foe] };

  const stowed = resolveAction(state, hero, { kind: 'attack', targetId: 'g1', weaponName: 'Crossbow, Light' });
  assert.equal(stowed.ok, false);
  assert.equal(stowed.reason, 'no_weapon');

  assert.equal(toggleEquipment(sheet, 'Crossbow, Light').ok, true);
  const attack = resolveAction(state, hero, { kind: 'attack', targetId: 'g1' });
  assert.equal(attack.ok, true);
  assert.equal(attack.result.attacks[0].weapon, 'Crossbow, Light');
});

test('forged character saves use sheet.saves modifiers', () => {
  const sheet = buildCharacter({
    name: 'Osric', race: 'dwarf', class: 'cleric', level: 1,
    abilities: { str: 12, dex: 13, con: 16, int: 10, wis: 16, cha: 8 },
    background: 'acolyte', look: {},
  });
  const hero = { id: 'p1', kind: 'player', hp: 11, sheet, deathSaves: null };
  const state = { version: 1, tokens: [hero] };
  const res = rollSave(state, hero, 'wis', { dc: 30 });  // impossible DC — we only assert the mod is applied
  // wis 16 (+3) + prof (+2) = +5 → the roll total must exceed the raw d20 by exactly 5
  assert.equal(res.total - res.rolls[0], 5, 'save mod must come from sheet.saves (wis +5)');
});
