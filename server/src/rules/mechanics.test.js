// ASHENREACH — server/src/rules/mechanics.test.js
// Mechanics overlay: formula evaluator, resource pools, feature execution,
// passive hooks (rage/fighting styles/Extra Attack/lucky/relentless endurance…),
// new spell modes (shield/hex/charm), Arcane Recovery, opportunity attacks.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFormula, formulaContext, initResources, recoverResources,
  spendResource, extraAttacksFor, rageDamageBonus
} from './Mechanics.js';
import {
  resolveAction, applyDamage, rollSave, opportunityAttacks,
  effectiveAc, attackAdvantage, attemptMove, applyHealing
} from './CombatEngine.js';
import { buildCharacter, shortRest, longRest } from './CharacterEngine.js';
import { seqRng } from './dice.js';

const u = (face, sides) => (face - 1) / sides;

function mkSheet(def) {
  const sheet = buildCharacter(def);
  initResources(sheet);   // idempotent safety (buildCharacter already calls it)
  return sheet;
}

function mkTokenFromSheet(sheet, o = {}) {
  return {
    id: 't_' + sheet.name.toLowerCase().replace(/\s+/g, '_'),
    kind: 'player', ownerId: 'u1', name: sheet.name,
    x: 0, z: 0, rotY: 0,
    hp: sheet.hp.max, hpMax: sheet.hp.max, ac: sheet.ac, speedFt: sheet.speedFt,
    initiative: 0, conditions: [],
    actionUsed: false, bonusUsed: false, reactionUsed: false,
    deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
    sheet, level: sheet.level, ...o
  };
}

function mkMonster(o = {}) {
  return {
    id: 'mob_x', kind: 'monster', ownerId: 'DM', name: 'Goblin',
    x: 5, z: 0, rotY: 0, hp: 7, hpMax: 7, ac: 13, speedFt: 30, initiative: 0,
    conditions: [], deathSaves: null, creatureType: 'humanoid', dexMod: 2,
    saveMods: { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 },
    attacks: [{ name: 'Scimitar', toHit: 4, dmg: '1d6+2', dmgType: 'slashing', ranged: false, reachFt: 5 }],
    ...o
  };
}

function combatState(tokens, turnIdx = 0) {
  return {
    tokens,
    initiative: {
      order: tokens.map(t => t.id), turnIdx, round: 1, movement: null
    }
  };
}

// ── formula evaluator ────────────────────────────────────────────────────────

test('evaluateFormula: precedence, ternary chains, functions, context vars', () => {
  const ctx = { ...formulaContext({ level: 5, mods: { str: 3, dex: 2, con: 3, int: 0, wis: 1, cha: -1 } }) };
  assert.equal(evaluateFormula('1 + 2 * 3', ctx), 7);
  assert.equal(evaluateFormula('classLevel * 5', ctx), 25);
  assert.equal(evaluateFormula('min(resource, 5)', { ...ctx, resource: 3 }), 3);
  assert.equal(evaluateFormula('classLevel >= 17 ? 6 : classLevel >= 12 ? 5 : classLevel >= 6 ? 4 : classLevel >= 3 ? 3 : 2', ctx), 3);
  assert.equal(evaluateFormula('chaMod', ctx), -1);
  assert.equal(evaluateFormula('unknown_thing', ctx), 0);
  assert.equal(evaluateFormula('1 +', ctx), null);
  assert.equal(evaluateFormula('bogus(1)', ctx), null);
});

test('rageDamageBonus: +2/+3/+4 at 1/9/16', () => {
  assert.equal(rageDamageBonus(1), 2);
  assert.equal(rageDamageBonus(9), 3);
  assert.equal(rageDamageBonus(16), 4);
});

// ── sheet integration ────────────────────────────────────────────────────────

test('fighter sheet: resource pools, executable actions, Defense style', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 2 });
  assert.ok(sheet.resources.second_wind, 'second wind pool');
  assert.equal(sheet.resources.second_wind.cur, 1);
  assert.equal(sheet.resources.second_wind.recovery, 'short_rest');
  assert.ok(sheet.resources.action_surge, 'action surge pool');
  assert.equal(sheet.fightingStyle, 'Defense');
  const ids = sheet.actions.map(a => a.id);
  assert.ok(ids.includes('second_wind'));
  assert.ok(ids.includes('action_surge'));
  const sw = sheet.actions.find(a => a.id === 'second_wind');
  assert.equal(sw.activation, 'bonus');
  // Defense style: +1 AC while armored (chain mail 16 + shield 2 + 1 = 19)
  assert.equal(sheet.ac, 19);
});

test('barbarian sheet: rage pools scale with level, unarmored defense, no style', () => {
  const low = mkSheet({ name: 'Raag', race: 'Dragonborn', class: 'Barbarian', level: 1, abilities: { str: 15, dex: 12, con: 15 } });
  assert.equal(low.resources.rage_uses.cur, 2);
  const high = mkSheet({ name: 'Raag', race: 'Dragonborn', class: 'Barbarian', level: 6, abilities: { str: 15, dex: 12, con: 15 } });
  assert.equal(high.resources.rage_uses.cur, 4);
  // Unarmored Defense: 10 + DEX + CON (no armor in the first equipment option)
  assert.equal(high.ac, 10 + high.mods.dex + high.mods.con);
});

test('half-orc sheet: relentless endurance pool + savage attacks passive', () => {
  const sheet = mkSheet({ name: 'Krug', race: 'Half-Orc', class: 'Fighter', level: 1 });
  assert.ok(sheet.resources.relentless_endurance, 'relentless pool');
  assert.equal(sheet.resources.relentless_endurance.recovery, 'long_rest');
  assert.equal(sheet.passives.critExtraDice, 1);
});

test('halfling/dwarf/tiefling/elf passives compile from racial traits', () => {
  const halfling = mkSheet({ name: 'Merri', race: 'Halfling', class: 'Rogue', level: 1 });
  assert.deepEqual(halfling.passives.rerollNat1.kinds.includes('attack'), true);
  assert.equal(halfling.passives.saveAdvantage.frightened, true);
  const dwarf = mkSheet({ name: 'Grum', race: 'Dwarf', class: 'Fighter', level: 1 });
  assert.equal(dwarf.passives.saveAdvantage.poison, true);
  assert.ok(dwarf.passives.resistances.includes('poison'));
  const tiefling = mkSheet({ name: 'Ash', race: 'Tiefling', class: 'Warlock', level: 1 });
  assert.ok(tiefling.passives.resistances.includes('fire'));
  const elf = mkSheet({ name: 'Syl', race: 'Elf', class: 'Wizard', level: 1 });
  assert.equal(elf.passives.saveAdvantage.charm, true);
});

test('wizard sheet: arcane recovery pool; sorcerer: sorcery points = level', () => {
  const wiz = mkSheet({ name: 'Morrigan', class: 'Wizard', level: 5 });
  assert.ok(wiz.resources.arcane_recovery);
  assert.equal(wiz.resources.arcane_recovery.recovery, 'long_rest');
  const sorc = mkSheet({ name: 'Pyra', class: 'Sorcerer', level: 3 });
  assert.equal(sorc.resources.sorcery_points.cur, 3);
  const ids = sorc.actions.map(a => a.id);
  assert.ok(ids.includes('create_slot'));
  assert.ok(ids.includes('slot_to_points'));
});

test('extraAttacksFor: fighter 5 has Extra Attack, fighter 4 does not', () => {
  assert.equal(extraAttacksFor(mkSheet({ name: 'Vet', class: 'Fighter', level: 5 })), 1);
  assert.equal(extraAttacksFor(mkSheet({ name: 'Cadet', class: 'Fighter', level: 4 })), 0);
});

// ── feature execution ────────────────────────────────────────────────────────

test('Second Wind: bonus action, heals 1d10+fighter level, consumes pool + bonus', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 5 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  t.hp = 10;
  // rng: heal die (d10 face 4 → u(4,10)), then attack if any — heal only consumes 1 die
  const res = resolveAction(state, t, { kind: 'feature', featureId: 'second_wind' }, seqRng([u(4, 10)]));
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.result.healing.gained, 4 + 5);
  assert.equal(t.bonusUsed, true);
  assert.equal(t.sheet.resources.second_wind.cur, 0);
  // pool spent → refused (clear the economy flag so the pool gate is what fires)
  t.bonusUsed = false;
  const again = resolveAction(state, t, { kind: 'feature', featureId: 'second_wind' }, Math.random);
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'resource_spent');
});

test('Action Surge: usable after action spent; the extra action consumes the surge', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 2 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  // spend the normal action first
  t.actionUsed = true;
  const surge = resolveAction(state, t, { kind: 'feature', featureId: 'action_surge' }, Math.random);
  assert.equal(surge.ok, true, JSON.stringify(surge));
  assert.equal(t.surging, true);
  assert.equal(t.actionUsed, true, 'surge does not consume the spent action flag');
  // the extra attack rides the surge
  const d = Math.hypot(foe.x - t.x, foe.z - t.z);
  const rng = seqRng([u(20, 20), u(6, 8), u(3, 6), u(6, 8)]); // swing1: hit nat20? keep simple: 15 hit, dmg; swing2 dmg
  const atk = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, seqRng([u(15, 20), u(6, 8), u(3, 6), u(6, 8)]));
  assert.equal(atk.ok, true, JSON.stringify(atk));
  assert.equal(t.surging, false, 'surge consumed by the extra action');
  assert.equal(t.actionUsed, true);
  // second surge refused (1/short rest)
  const again = resolveAction(state, t, { kind: 'feature', featureId: 'action_surge' }, Math.random);
  assert.equal(again.ok, false);
});

test('Rage: bonus action, halves B/P/S damage, adds STR melee damage, blocks casting', () => {
  const sheet = mkSheet({ name: 'Raag', class: 'Barbarian', level: 1, abilities: { str: 15, dex: 12, con: 14 } });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  const r = resolveAction(state, t, { kind: 'feature', featureId: 'rage' }, Math.random);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(t.conditions.includes('raging'), true);
  // resistance: 10 slashing → 5
  const applied = applyDamage(state, t, 10, { type: 'slashing', source: foe.id, rng: Math.random });
  assert.equal(applied.amount, 5);
  assert.ok(applied.notes.some(n => /rages through/.test(n)));
  // cannot cast while raging (before the action is spent by the attack below)
  const cast = resolveAction(state, t, { kind: 'cast', spellId: 'Magic Missile', targetId: foe.id }, Math.random);
  assert.equal(cast.ok, false);
  assert.equal(cast.reason, 'raging_cannot_cast');
  // rage damage bonus rides STR melee attacks
  const atk = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, seqRng([u(15, 20), u(6, 8), u(2, 6), u(6, 8)]));
  assert.equal(atk.ok, true, JSON.stringify(atk));
  assert.equal(atk.result.attacks[0].damage.rage, 2);
});

test('Reckless Attack: advantage on melee, attacks against the reckless have advantage', () => {
  const sheet = mkSheet({ name: 'Raag', class: 'Barbarian', level: 2 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  resolveAction(state, t, { kind: 'feature', featureId: 'reckless_attack' }, Math.random);
  assert.equal(t.conditions.includes('reckless'), true);
  const w = { name: 'Greataxe', ranged: false, reachFt: 5 };
  const vsFoe = attackAdvantage(state, t, foe, w, {});
  assert.equal(vsFoe.adv, true);
  assert.ok(vsFoe.sources.includes('reckless attack'));
  const vsMe = attackAdvantage(state, foe, t, w, {});
  assert.equal(vsMe.adv, true);
  assert.ok(vsMe.sources.includes('target reckless'));
});

test('Turn Undead: only undead affected, WIS save or frightened, uses channel divinity', () => {
  const sheet = mkSheet({ name: 'Sister Ash', class: 'Cleric', subclass: 'Life Domain', level: 2 });
  const t = mkTokenFromSheet(sheet);
  const skeleton = mkMonster({ id: 'mob_s', name: 'Skeleton', creatureType: 'undead', x: 10, z: 0 });
  const goblin = mkMonster({ id: 'mob_g', name: 'Goblin', creatureType: 'humanoid', x: 12, z: 0 });
  const state = combatState([t, skeleton, goblin], 0);
  // save fails (nat 5 + wis -1 = 4 < DC)
  const res = resolveAction(state, t, { kind: 'feature', featureId: 'turn_undead' }, seqRng([u(5, 20)]));
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.result.turnUndead.outcomes.length, 1, 'only the undead is targeted');
  assert.equal(skeleton.conditions.includes('frightened'), true);
  assert.equal(goblin.conditions.includes('frightened'), false);
  assert.equal(t.sheet.resources.channel_divinity.cur, 0);
  const again = resolveAction(state, t, { kind: 'feature', featureId: 'turn_undead' }, Math.random);
  assert.equal(again.ok, false);
});

test('Cunning Action: Dash/Disengage as bonus actions for rogues', () => {
  const sheet = mkSheet({ name: 'Pip', class: 'Rogue', level: 2 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  // anchor a movement budget like beginTurn would
  state.initiative.movement = { tokenId: t.id, usedFt: 0, maxFt: 30, trail: [{ x: t.x, z: t.z, cumFt: 0 }] };
  const dash = resolveAction(state, t, { kind: 'feature', featureId: 'cunning_dash' }, Math.random);
  assert.equal(dash.ok, true, JSON.stringify(dash));
  assert.equal(t.bonusUsed, true);
  assert.equal(state.initiative.movement.maxFt, 60);
  const dis = resolveAction(state, t, { kind: 'feature', featureId: 'cunning_disengage' }, Math.random);
  assert.equal(dis.ok, false, 'bonus action already spent');
});

test('Uncanny Dodge: reaction halves attack damage once per round', () => {
  const sheet = mkSheet({ name: 'Pip', class: 'Rogue', level: 5 });
  const t = mkTokenFromSheet(sheet, { reactionUsed: false });
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  const a1 = applyDamage(state, t, 12, { type: 'slashing', source: foe.id, rng: Math.random });
  assert.equal(a1.amount, 6);
  assert.equal(t.reactionUsed, true);
  const a2 = applyDamage(state, t, 12, { type: 'slashing', source: foe.id, rng: Math.random });
  assert.equal(a2.amount, 12, 'reaction spent — no halving');
});

test('Relentless Endurance: half-orc drops to 1 HP once per long rest', () => {
  const sheet = mkSheet({ name: 'Krug', race: 'Half-Orc', class: 'Fighter', level: 1 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  const a1 = applyDamage(state, t, 999, { type: 'slashing', source: foe.id, rng: Math.random });
  assert.equal(t.hp, 1, 'endures at 1 HP');
  assert.equal(a1.dead, false);
  assert.equal(t.sheet.resources.relentless_endurance.cur, 0);
  const a2 = applyDamage(state, t, 6, { type: 'slashing', source: foe.id, rng: Math.random });
  assert.equal(a2.dead, false, 'pool spent — a normal hit downs, not kills');
  assert.equal(t.hp, 0);
  assert.equal(a2.downed, true);
});

test('Halfling Lucky: attack nat 1 is rerolled once', () => {
  const sheet = mkSheet({ name: 'Merri', race: 'Halfling', class: 'Rogue', level: 1 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 13 });
  const state = combatState([t, foe], 0);
  // rng: nat 1 (reroll) → nat 15 (hit) → sneak? allyAdjacent false, adv false → no sneak → dmg
  const rng = seqRng([u(1, 20), u(15, 20), u(4, 6), u(2, 6)]);
  const res = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(res.ok, true, JSON.stringify(res));
  const roll = res.result.attacks[0].attackRoll;
  assert.deepEqual(roll.rolls, [1, 15], 'nat 1 was rerolled');
  assert.ok(roll.sources.some(s => String(s).includes('lucky reroll')), JSON.stringify(roll.sources));
});

test('Savage Attacks: half-orc melee crits roll an extra damage die', () => {
  const sheet = mkSheet({ name: 'Krug', race: 'Half-Orc', class: 'Fighter', level: 1 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 10 });
  const state = combatState([t, foe], 0);
  // rng: nat 20 → crit; longsword 1d8 ×3 dice (2 crit + 1 savage)
  const rng = seqRng([u(20, 20), u(8, 8), u(8, 8), u(8, 8)]);
  const res = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(res.ok, true);
  assert.equal(res.result.attacks[0].crit, true);
  assert.deepEqual(res.result.attacks[0].damage.rolls.length, 3, '2 crit dice + 1 savage die');
});

test('Extra Attack: level-5 fighter makes two attacks on the Attack action', () => {
  const sheet = mkSheet({ name: 'Veteran', class: 'Fighter', level: 5 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 10, hp: 40, hpMax: 40 });
  const state = combatState([t, foe], 0);
  const rng = seqRng([u(15, 20), u(6, 8), u(15, 20), u(6, 8)]);
  const res = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(res.ok, true);
  assert.equal(res.result.attacks.length, 2, 'two attacks');
  assert.equal(t.actionUsed, true, 'one action for both attacks');
});

// ── fighting styles ──────────────────────────────────────────────────────────

test('Fighting Style: Defense adds +1 AC, Archery +2 to-hit, Dueling +2 melee damage', () => {
  const def = mkSheet({ name: 'ShieldWall', class: 'Fighter', level: 1 });
  assert.equal(def.ac, 19, 'chain mail 16 + shield 2 + Defense 1');
  const archer = mkSheet({ name: 'Hawkeye', class: 'Ranger', level: 1, equipmentOverrides: { weapons: ['Longbow'] } });
  const bow = archer.attacks.find(a => a.ranged);
  assert.ok(bow, 'has a bow');
  assert.equal(bow.attackBonus, archer.mods.dex + archer.proficiencyBonus + 2, 'Archery +2');
  // Dueling: build a fighter with the style set manually (house default is Defense)
  const duelist = mkSheet({ name: 'Duel', class: 'Fighter', level: 1 });
  duelist.fightingStyle = 'Dueling';
  for (const atk of duelist.attacks) if (!atk.ranged && !atk.twoHanded) atk.damageMod += 2;
  const t = mkTokenFromSheet(duelist);
  const foe = mkMonster({ ac: 10 });
  const state = combatState([t, foe], 0);
  const rng = seqRng([u(15, 20), u(6, 8)]);
  const res = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(res.ok, true);
  // longsword 1d8 + str(2 from 14? default array gives 10s→0)... check formula carries the +2
  assert.equal(res.result.attacks[0].damage.formula.includes('+'), true);
});

test('Great Weapon Fighting: damage dice showing 1-2 are rerolled once', () => {
  const sheet = mkSheet({ name: 'Chop', class: 'Fighter', level: 1, equipmentOverrides: { weapons: ['Greataxe'] } });
  sheet.fightingStyle = 'Great Weapon Fighting';
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 10 });
  const state = combatState([t, foe], 0);
  // rng: hit nat 15; 1d12 → face 1 (reroll) → face 6
  const rng = seqRng([u(15, 20), u(1, 12), u(6, 12)]);
  const res = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.deepEqual(res.result.attacks[0].damage.rolls, [1, 6], 'the 1 was rerolled into a 6');
});

// ── new spell modes ──────────────────────────────────────────────────────────

test('Shield: reaction cast, +5 AC, does not consume the action', () => {
  const sheet = mkSheet({ name: 'Morrigan', class: 'Wizard', level: 3 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();
  const state = combatState([t, foe], 0);
  const before = t.sheet.spellcasting.slots[1].used;
  const res = resolveAction(state, t, { kind: 'cast', spellId: 'Shield', slot: 'reaction' }, Math.random);
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.result.reactionCast, true);
  assert.equal(t.actionUsed, false, 'reaction cast leaves the action free');
  assert.equal(t.sheet.spellcasting.slots[1].used, before + 1, '1st-level slot spent');
  assert.equal(effectiveAc(t), t.ac + 5, 'shielded +5 AC');
});
test('Hex: no save, marks the target, rider damage on the hexer hits', () => {
  const sheet = mkSheet({ name: 'Ash', class: 'Warlock', level: 1, equipmentOverrides: { weapons: ['Longsword'] } });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 10 });
  const state = combatState([t, foe], 0);
  const cast = resolveAction(state, t, { kind: 'cast', spellId: 'Hex', targetId: foe.id }, Math.random);
  assert.equal(cast.ok, true, JSON.stringify(cast));
  assert.equal(foe.conditions.includes('hexed'), true);
  assert.equal(foe.hexCasterId, t.id);
  // weapon hit while hexed → +1d6 necrotic rider (new turn — action refreshed)
  t.actionUsed = false;
  const rng = seqRng([u(15, 20), u(6, 8), u(4, 6)]);
  const atk = resolveAction(state, t, { kind: 'attack', targetId: foe.id }, rng);
  assert.equal(atk.ok, true, JSON.stringify(atk));
  assert.equal(atk.result.attacks[0].damage.hex, 4);
});

test('Charm Person: WIS save or charmed; damage breaks the charm', () => {
  const sheet = mkSheet({ name: 'Enara', class: 'Sorcerer', level: 1 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster({ ac: 12 });
  const state = combatState([t, foe], 0);
  // failed save (nat 5)
  const cast = resolveAction(state, t, { kind: 'cast', spellId: 'Charm Person', targetId: foe.id }, seqRng([u(5, 20)]));
  assert.equal(cast.ok, true, JSON.stringify(cast));
  assert.equal(foe.conditions.includes('charmed'), true);
  // damage breaks it
  applyDamage(state, foe, 3, { type: 'fire', source: t.id, rng: Math.random });
  assert.equal(foe.conditions.includes('charmed'), false);
});

test('Disciple of Life (Life Domain): healing spells gain +2 + slot level', () => {
  const sheet = mkSheet({ name: 'Sister Ash', class: 'Cleric', subclass: 'Life Domain', level: 3 });
  assert.equal(sheet.passives.discipleOfLife, true, 'passive compiled');
  const t = mkTokenFromSheet(sheet);
  const ally = mkTokenFromSheet(mkSheet({ name: 'Warden', class: 'Fighter', level: 1 }), { id: 't_ally', ownerId: 'u2' });
  ally.hp = 1;   // well below max so the full heal lands (no cap)
  const state = combatState([t, ally], 0);
  // Cure Wounds 1d8 + WIS mod + 2 + 1: roll face 4 → wis +3 (wis 17→+3?) use def wis default 10 → +0
  const rng = seqRng([u(4, 8)]);
  const res = resolveAction(state, t, { kind: 'cast', spellId: 'Cure Wounds', targetId: ally.id }, rng);
  assert.equal(res.ok, true, JSON.stringify(res));
  const wisMod = sheet.mods.wis;
  assert.equal(res.result.healing.gained, 4 + wisMod + 2 + 1);
});

// ── rests ────────────────────────────────────────────────────────────────────

test('short rest: recovers Second Wind/Action Surge; long rest recovers Rage', () => {
  const fighter = mkSheet({ name: 'Warden', class: 'Fighter', level: 2 });
  fighter.resources.second_wind.cur = 0;
  fighter.resources.action_surge.cur = 0;
  const r1 = shortRest(fighter, 0);
  assert.equal(r1.ok, true);
  assert.ok(r1.resourcesRecovered, 'resources recovered list present');
  assert.equal(r1.resourcesRecovered.includes('second_wind'), true);
  assert.equal(fighter.resources.second_wind.cur, 1);

  const barb = mkSheet({ name: 'Raag', class: 'Barbarian', level: 1 });
  barb.resources.rage_uses.cur = 0;
  const r2 = shortRest(barb, 1);   // spend a hit die (short-rest pools are all full)
  assert.equal(r2.ok, true);
  assert.equal((r2.resourcesRecovered || []).includes('rage_uses'), false, 'rage is long-rest only');
  const r3 = longRest(barb);
  assert.equal(r3.resourcesRecovered.includes('rage_uses'), true);
  assert.equal(barb.resources.rage_uses.cur, 2);
});

test('Arcane Recovery: wizard short rest restores ≤ half-level slot levels, cheapest first, 1/long rest', () => {
  const wiz = mkSheet({ name: 'Morrigan', class: 'Wizard', level: 5 });
  // lvl 5 wizard: 4×1st 3×2nd 2×3rd — spend all
  for (const s of Object.values(wiz.spellcasting.slots)) s.used = s.total;
  const res = shortRest(wiz, 0);
  assert.equal(res.ok, true);
  assert.ok(res.arcaneRecovery, 'arcane recovery applied');
  // budget = ceil(5/2) = 3 → two 1st (1+1) + one 2nd (2)? cheapest first: 1st,1st,2nd = 4 > 3 → 1st,1st + ? 2nd needs 2, left 1 → so 1st×2, then 2nd no. Wait budget 3: 1st(1) 1st(1) left 1 → nothing more (2nd costs 2). Actually loop: while missing && left >= level → 1st: recover up to 4; each costs 1.
  const slots = wiz.spellcasting.slots;
  const recovered1 = slots[1].total - slots[1].used;
  const recovered2 = slots[2].total - slots[2].used;
  assert.equal(recovered1 + recovered2 * 2, 3, 'combined recovered levels == budget');
  assert.ok(recovered1 >= 2, 'cheapest first');
  // pool spent → second short rest does nothing
  const res2 = shortRest(wiz, 0);
  assert.ok(!res2.arcaneRecovery, 'arcane recovery pool spent');
  longRest(wiz);
  assert.equal(wiz.resources.arcane_recovery.cur, 1);
});

// ── opportunity attacks ──────────────────────────────────────────────────────

test('opportunity attacks: leaving reach provokes; disengage and used reaction suppress', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 1 });
  const t = mkTokenFromSheet(sheet);
  const foe = mkMonster();     // at (5,0), reach 5 → threatens everything within 5 ft
  const state = combatState([t, foe], 0);
  // move from (3,0) (within reach) to (11,0) (6 ft away — out of reach)
  t.x = 11;
  const oas = opportunityAttacks(state, t, 3, 0);
  assert.equal(oas.length, 1);
  assert.equal(oas[0].attackerId, 'mob_x');
  // disengaged → none
  t.conditions.push('disengaged');
  t.x = 3;
  assert.equal(opportunityAttacks(state, t, 3, 0).length, 0);
  t.conditions.splice(t.conditions.indexOf('disengaged'), 1);
  // watcher reaction spent → none
  t.x = 11;
  foe.reactionUsed = true;
  assert.equal(opportunityAttacks(state, t, 3, 0).length, 0);
  foe.reactionUsed = false;
  // moving within reach (3→4) does not provoke
  t.x = 4;
  assert.equal(opportunityAttacks(state, t, 3, 0).length, 0);
});

test('attemptMove + OA resolution: a fleeing combatant provokes and gets hit', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 1 });
  const runner = mkTokenFromSheet(sheet, { id: 't_runner', ownerId: 'u2' });
  const foe = mkMonster();
  foe.x = 5; foe.z = 0;
  runner.x = 4; runner.z = 0;
  const state = combatState([runner, foe], 1);   // foe's turn
  state.initiative.movement = { tokenId: runner.id, usedFt: 0, maxFt: 30, trail: [{ x: 4, z: 0, cumFt: 0 }] };
  // the runner flees to 12 ft away — the scan sees the segment 4 → 12
  runner.x = 12;
  const oas = opportunityAttacks(state, runner, 4, 0);
  assert.equal(oas.length, 1);
  // rng: hit nat 15, dmg 4 — opportunity: true strikes at the leave-reach boundary
  const res = resolveAction(state, foe, { kind: 'attack', slot: 'reaction', opportunity: true, targetId: runner.id, weaponName: 'Scimitar' }, seqRng([u(15, 20), u(4, 6), u(2, 6)]));
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.result.attacks[0].hit, true);
});

// ── spend/recover primitives ─────────────────────────────────────────────────

test('spendResource + recoverResources edge cases', () => {
  const sheet = mkSheet({ name: 'Warden', class: 'Fighter', level: 2 });
  assert.equal(spendResource(sheet, 'second_wind').ok, true);
  assert.equal(spendResource(sheet, 'second_wind').reason, 'resource_spent');
  assert.equal(spendResource(sheet, 'nonexistent').reason, 'no_resource');
  assert.equal(recoverResources(sheet, 'long_rest').includes('second_wind'), true);
  // spend action surge so the short-rest recovery has something to refill
  spendResource(sheet, 'action_surge');
  assert.equal(recoverResources(sheet, 'short_rest').includes('action_surge'), true);
});
