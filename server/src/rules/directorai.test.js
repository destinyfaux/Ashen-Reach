// ASHENREACH — server/src/rules/directorai.test.js
// DirectorAI: reinforcement when the board is cleared too fast, retreat
// narration below 30% HP, ambient weather cadence — all idempotent.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { think } from './DirectorAI.js';

const pc = (id, o = {}) => ({
  id, kind: 'player', ownerId: 'u_' + id, name: id.toUpperCase(),
  x: 0, z: 0, rotY: 0, hp: 20, hpMax: 20, ac: 15, speedFt: 30, initiative: 0,
  conditions: [], deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
  hidden: false, ...o
});

const mob = (id, o = {}) => ({
  id, kind: 'monster', ownerId: 'DM', name: 'Ash Crawler',
  x: 20, z: 0, rotY: 0, hp: 10, hpMax: 10, ac: 13, speedFt: 30, initiative: 0,
  conditions: [], deathSaves: null, hidden: false, ...o
});

function combatOn(tokens, round = 1) {
  return {
    tokens,
    initiative: { order: tokens.map(t => t.id), turnIdx: 0, round, movement: null }
  };
}

test('reinforcement: all monsters dead in round 1 → CR-appropriate spawn ops near spawn points', () => {
  const state = combatOn([pc('p1'), mob('m1', { hp: 0 })], 1);
  const ops = think(state, [], { spawnPoints: [{ x: 100, z: 50 }], partyLevel: 1 });

  const spawns = ops.filter(o => o.op === 'spawn');
  assert.equal(spawns.length, 1);              // 1 alive player → 1 reinforcement
  const p = spawns[0].payload;
  assert.equal(p.x, 100);                      // placed at the map spawn point (world feet)
  assert.equal(p.z, 50);
  assert.equal(typeof p.monsterId, 'string');  // stat-block reference for the rules engine
  assert.ok(p.hp > 0 && p.ac > 0 && p.speedFt > 0);
  assert.ok(p.cr <= 0.5, `level-1 party should face CR ≤ 1/2, got ${p.cr}`);
  assert.ok(ops.some(o => o.op === 'chat'), 'reinforcement comes with narration');

  // idempotent: the same state never triggers a second wave
  assert.deepEqual(think(state, [], { spawnPoints: [{ x: 100, z: 50 }] }), []);
});

test('no reinforcement once the fight has matured (round >= 2)', () => {
  const state = combatOn([pc('p1'), pc('p2'), pc('p3'), mob('m1', { hp: 0 })], 2);
  const ops = think(state, [], { spawnPoints: [{ x: 0, z: 0 }], partyLevel: 1 });
  assert.equal(ops.filter(o => o.op === 'spawn').length, 0);
});

test('retreat beat: first living monster under 30% HP → one narration, never repeated', () => {
  const state = combatOn([pc('p1'), mob('m1', { hp: 2, hpMax: 10 })], 1);
  const ops = think(state, [], { rng: () => 0 });
  const chats = ops.filter(o => o.op === 'chat');
  assert.equal(chats.length, 1);
  assert.ok(chats[0].payload.text.includes('Ash Crawler'));

  // second poll: nothing new (no retreat repeat, no weather before round 3)
  assert.deepEqual(think(state, [], { rng: () => 0 }), []);
});

test('weather shifts every 3 rounds; light dies every 6', () => {
  const state = combatOn([pc('p1'), mob('m1')], 3);   // healthy monster: no retreat beat

  const r3 = think(state, [], { rng: () => 0 });
  assert.ok(r3.some(o => o.op === 'weather' && o.payload.type === 'fog'), 'round 3 → first weather beat');
  assert.ok(!r3.some(o => o.op === 'daynight'));

  state.initiative.round = 4;
  assert.deepEqual(think(state, [], { rng: () => 0 }), [], 'round 4 is not a beat');

  state.initiative.round = 6;
  const r6 = think(state, [], { rng: () => 0 });
  assert.ok(r6.some(o => o.op === 'weather' && o.payload.type === 'rain'), 'round 6 → second weather beat');
  const dn = r6.find(o => o.op === 'daynight');
  assert.ok(dn, 'round 6 also dims the light');
  assert.equal(dn.payload.mode, 'fixed');
  assert.ok(dn.payload.time >= 0 && dn.payload.time <= 1440);
});

test('no ops without combat, and never when the party is wiped', () => {
  const idle = { tokens: [pc('p1'), mob('m1')], initiative: null };
  assert.deepEqual(think(idle), []);

  const wiped = combatOn([pc('p1', { hp: 0 }), mob('m1', { hp: 0 })], 1);
  const ops = think(wiped, [], { spawnPoints: [{ x: 0, z: 0 }] });
  assert.equal(ops.filter(o => o.op === 'spawn').length, 0, 'no reinforcement into a dead party');
});
