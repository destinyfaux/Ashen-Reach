// ASHENREACH — server/src/rules/monsterai.test.js
// MonsterAI: melee engagement, ranged kiting, target hygiene, caster picks,
// multiattack, and the buildMonsterToken combat profile.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chooseAction, buildMonsterToken } from './MonsterAI.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'monsters_index.json'), 'utf-8'));
const entry = (name) => INDEX.find(e => e.name === name);

const pc = (id, x, z, o = {}) => ({
  id, kind: 'player', ownerId: 'u_' + id, name: id.toUpperCase(),
  x, z, rotY: 0, hp: 20, hpMax: 20, ac: 15, speedFt: 30, initiative: 0,
  conditions: [], deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
  hidden: false, ...o
});

const mobAt = (srd, id, x, z) => buildMonsterToken(srd, { id, x, z });

function combatState(tokens, activeId, speed) {
  return {
    tokens,
    initiative: {
      order: tokens.map(t => t.id), turnIdx: tokens.findIndex(t => t.id === activeId),
      round: 1,
      movement: { tokenId: activeId, usedFt: 0, maxFt: speed, trail: [] }
    }
  };
}

// ── buildMonsterToken ─────────────────────────────────────────────────────────

test('buildMonsterToken: index entry → combat-ready token', () => {
  const goblin = entry('Goblin');
  const tok = mobAt(goblin, 'mob1', 10, 10);
  assert.equal(tok.kind, 'monster');
  assert.equal(tok.monsterId, 'goblin');
  assert.equal(tok.name, 'Goblin');
  assert.equal(tok.hp, 7);
  assert.equal(tok.hpMax, 7);
  assert.equal(tok.ac, 15);
  assert.equal(tok.speedFt, 30);
  assert.equal(tok.dexMod, 2);
  assert.equal(tok.saveMods.dex, 2);
  assert.equal(tok.attacks.length, 2);
  assert.deepEqual(tok.attacks.map(a => a.name), ['Scimitar', 'Shortbow']);
  assert.equal(tok.attacks[0].ranged, false);
  assert.equal(tok.attacks[0].reachFt, 5);
  assert.equal(tok.attacks[1].ranged, true);
  assert.equal(tok.attacks[1].rangeFt, 80);
  assert.equal(tok.attacks[1].longRangeFt, 320);
  assert.equal(tok.spellcasting, null);
  assert.equal(tok.deathSaves, null);          // monsters die at 0
});

test('buildMonsterToken: parses the Spellcasting trait into live slot state', () => {
  const acolyte = entry('Acolyte');
  const tok = mobAt(acolyte, 'ac1', 0, 0);
  assert.ok(tok.spellcasting, 'acolyte is a caster');
  assert.equal(tok.spellcasting.ability, 'wis');
  assert.equal(tok.spellcasting.saveDC, 12);
  assert.equal(tok.spellcasting.attackBonus, 4);
  assert.deepEqual(tok.spellcasting.slots, { 1: { total: 3, used: 0 } });
  assert.ok(tok.spellcasting.cantrips.includes('Sacred Flame'));
  assert.ok(tok.spellcasting.spells.includes('Cure Wounds'));
});

// ── chooseAction: melee ───────────────────────────────────────────────────────

test('melee monster adjacent to two PCs attacks the nearest with no move', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 10, 10);
  const near = pc('pca', 15, 10);              // 5 ft away — in Scimitar reach
  const far = pc('pcb', 10, 20);               // 10 ft away
  const state = combatState([goblin, near, far], 'mob1', 30);

  const req = chooseAction(state, goblin, entry('Goblin'));
  assert.equal(req.kind, 'attack');
  assert.equal(req.targetId, 'pca');
  assert.equal(req.weaponName, 'Scimitar');
  assert.deepEqual(req.attacks, ['Scimitar']);
  assert.equal(req.move, undefined);           // already in reach — no movement
});

test('melee monster far away spends its budget closing, then strikes', () => {
  const bear = mobAt(entry('Brown Bear'), 'mob1', 0, 0);   // pure melee: Bite + Claws
  const target = pc('pca', 30, 0);             // 30 ft away, speed 40
  const state = combatState([bear, target], 'mob1', 40);

  const req = chooseAction(state, bear, entry('Brown Bear'));
  assert.equal(req.kind, 'attack');
  assert.equal(req.targetId, 'pca');
  assert.ok(req.move, 'should move before attacking');
  assert.ok(Math.abs(req.move.x - 27.5) < 1e-9);   // stops just inside reach
  assert.equal(req.move.z, 0);
  assert.equal(req.weaponName, 'Claws');           // best single attack (2d6+4)
});

test('melee monster that cannot reach this turn dashes instead', () => {
  const bear = mobAt(entry('Brown Bear'), 'mob1', 0, 0);   // pure melee, speed 40
  const target = pc('pca', 70, 0);             // 70 ft away, budget 40
  const state = combatState([bear, target], 'mob1', 40);

  const req = chooseAction(state, bear, entry('Brown Bear'));
  assert.equal(req.kind, 'dash');
  assert.ok(req.move && req.move.x > 0, 'dash should carry a move hint');
});

test('multiattack stat blocks fire every listed attack', () => {
  const aboleth = mobAt(entry('Aboleth'), 'mob1', 10, 10);
  const target = pc('pca', 15, 10);            // adjacent, inside 10 ft reach
  const state = combatState([aboleth, target], 'mob1', 30);

  const req = chooseAction(state, aboleth, entry('Aboleth'));
  assert.equal(req.kind, 'attack');
  assert.equal(req.reason, 'multiattack');
  assert.equal(req.attacks.length >= 2, true);
  assert.ok(req.attacks.includes('Tentacle'));
  assert.ok(req.attacks.includes('Tail'));
});

// ── chooseAction: ranged / kiting ────────────────────────────────────────────

test('ranged monster kites when an enemy is closer than 30 ft, then shoots', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 10, 10);
  const target = pc('pca', 20, 10);            // 10 ft away: too close, out of melee reach
  const state = combatState([goblin, target], 'mob1', 30);

  const req = chooseAction(state, goblin, entry('Goblin'));
  assert.equal(req.kind, 'attack');
  assert.equal(req.weaponName, 'Shortbow');    // hybrid: at 10 ft it shoots, not scimitars
  assert.equal(req.reason, 'kite');
  assert.ok(req.move, 'should retreat before shooting');
  // retreats along the away-axis, ending comfortably far but inside bow range
  const newDist = Math.hypot(req.move.x - 20, req.move.z - 10);
  assert.ok(newDist > 10, `kiting should increase distance (got ${newDist})`);
  assert.ok(newDist <= 320);
  assert.equal(req.targetId, 'pca');
});

test('ranged monster at comfortable range just shoots (no move)', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 0, 0);
  const target = pc('pca', 45, 0);             // 45 ft: beyond kite trigger, inside range
  const state = combatState([goblin, target], 'mob1', 30);

  const req = chooseAction(state, goblin, entry('Goblin'));
  assert.equal(req.kind, 'attack');
  assert.equal(req.weaponName, 'Shortbow');
  assert.equal(req.reason, 'ranged');
  assert.equal(req.move, undefined);
});

// ── chooseAction: casters ────────────────────────────────────────────────────

test('caster monster casts its best damaging spell in range', () => {
  const acolyte = mobAt(entry('Acolyte'), 'ac1', 0, 0);
  const target = pc('pca', 20, 0);             // 20 ft: beyond Club reach, inside 60 ft spell
  const state = combatState([acolyte, target], 'ac1', 30);

  const req = chooseAction(state, acolyte, entry('Acolyte'));
  assert.equal(req.kind, 'cast');
  assert.equal(req.spellId, 'Sacred Flame');
  assert.equal(req.targetId, 'pca');
  assert.equal(req.reason, 'cast:Sacred Flame');
});

// ── target hygiene ───────────────────────────────────────────────────────────

test('never targets dead, dying-stable, or hidden tokens', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 10, 10);
  const dead = pc('pdead', 15, 10, { hp: 0, deathSaves: { ok: 0, fail: 3, stable: false, dead: true } });
  const stable = pc('pstable', 12, 10, { hp: 0, deathSaves: { ok: 3, fail: 0, stable: true, dead: false } });
  const hidden = pc('phidden', 14, 10, { hidden: true });
  const living = pc('palive', 40, 10);
  const state = combatState([goblin, dead, stable, hidden, living], 'mob1', 30);

  const req = chooseAction(state, goblin, entry('Goblin'));
  assert.equal(req.targetId, 'palive');
});

test('no living hostiles → dodge', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 10, 10);
  const dead = pc('pdead', 15, 10, { hp: 0, deathSaves: { ok: 0, fail: 3, stable: false, dead: true } });
  const state = combatState([goblin, dead], 'mob1', 30);
  assert.equal(chooseAction(state, goblin, entry('Goblin')).kind, 'dodge');
});

test('chooseAction is deterministic for the same state', () => {
  const goblin = mobAt(entry('Goblin'), 'mob1', 0, 0);
  const a = pc('pca', 40, 0);
  const b = pc('pcb', 5, 5);
  const state = combatState([goblin, a, b], 'mob1', 30);
  const r1 = chooseAction(state, goblin, entry('Goblin'));
  const r2 = chooseAction(state, goblin, entry('Goblin'));
  assert.deepEqual(r1, r2);
});
