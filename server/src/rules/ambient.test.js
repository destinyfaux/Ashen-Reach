// ASHENREACH — server/src/rules/ambient.test.js
// P3.10 monster ambient AI: idle/wander/investigate/chase/return state machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { thinkAmbient, AMBIENT } from './MonsterAmbient.js';

const FT = 5;
const center = (c) => (c + 0.5) * FT;
const MON = (x, z, speedFt = 30) => ({ id: 'mob_t', x, z, speedFt });

const CTX = (over = {}) => ({
  now: 1000,
  rng: () => 0.5,
  players: [],
  visible: () => false,
  blocked: () => false,
  path: () => null,
  ...over,
});

test('ambient: idle monster with no players stays put', () => {
  const out = thinkAmbient(MON(50, 50), CTX());
  assert.equal(out.move, undefined);
  assert.equal(out.memory.mode, 'idle');
});

test('ambient: idle monster eventually picks a wander target within the leash', () => {
  let out = null;
  let mem = null;
  let now = 1000;
  for (let i = 0; i < 200 && (out?.move === undefined); i++) {
    out = thinkAmbient(MON(50, 50), CTX({ now, memory: mem, path: (fx, fz, tx, tz) => [{ x: tx, z: tz }] }));
    mem = out.memory;
    now += AMBIENT.TICK_MS;
  }
  assert.ok(out.move, 'monster started wandering');
  const d = Math.hypot(out.move.x - mem.homeX, out.move.z - mem.homeZ);
  assert.ok(d <= AMBIENT.WANDER_R_FT + AMBIENT.STEP_BUDGET_FT, `step stays near home (${d.toFixed(1)}ft)`);
});

test('ambient: monster chases a visible player and engages at close range', () => {
  const player = { id: 'tok_p1', x: center(14), z: center(10), down: false };
  let out = thinkAmbient(MON(center(10), center(10)), CTX({
    players: [player],
    visible: () => true,
  }));
  assert.equal(out.memory.mode, 'chase');
  assert.ok(out.move, 'moves toward the player');
  const dx = out.move.x - MON(center(10), center(10)).x;
  const dz = out.move.z - MON(center(10), center(10)).z;
  assert.ok(Math.hypot(dx, dz) > 0.1, 'actually displaced');
  assert.ok(Math.hypot(player.x - out.move.x, player.z - out.move.z) < Math.hypot(player.x - center(10), player.z - center(10)), 'closed distance');

  // adjacent → engage
  const close = { id: 'tok_p1', x: center(11), z: center(10), down: false };
  out = thinkAmbient(MON(center(10), center(10)), CTX({ players: [close], visible: () => true }));
  assert.equal(out.engage, 'tok_p1');
});

test('ambient: chase follows the nav route instead of a wall-cutting beeline', () => {
  const player = { id: 'tok_p1', x: center(18), z: center(10), down: false };
  // wall between: direct path blocked; nav detours through the gap
  const route = [
    { x: center(13), z: center(10) }, { x: center(14), z: center(11) },
    { x: center(15), z: center(12) }, { x: center(16), z: center(12) },
    { x: center(17), z: center(12) },
  ];
  const out = thinkAmbient(MON(center(10), center(10)), CTX({
    players: [player],
    visible: () => true,
    path: () => route,
  }));
  assert.ok(out.move, 'moved');
  // the step rides the route's FIRST LEG (straight toward waypoint 1) —
  // it must not teleport ahead of the route nor deviate off it
  assert.ok(out.move.x > center(10) + 0.01, 'advances along the route');
  assert.ok(out.move.x <= center(13) + 0.01, 'does not overshoot the first waypoint');
  assert.ok(Math.abs(out.move.z - center(10)) < 0.01, 'stays on the first leg');
});

test('ambient: lost sight -> investigate last known position', () => {
  const mem = { mode: 'chase', homeX: center(10), homeZ: center(10), targetId: 'tok_p1', lastX: center(16), lastZ: center(10), lastSeenAt: 1000 };
  const out = thinkAmbient(MON(center(12), center(10)), CTX({ now: 1000 + AMBIENT.LOST_SIGHT_MS + 1, memory: mem }));
  assert.equal(out.memory.mode, 'investigate');
  assert.ok(out.move, 'moves to investigate');
  assert.ok(out.move.x > center(12), 'heads toward last known x');
});

test('ambient: investigate gives up after the timeout', () => {
  const mem = { mode: 'investigate', homeX: 50, homeZ: 50, targetX: 55, targetZ: 50, until: 2000 };
  const out = thinkAmbient(MON(52, 50), CTX({ now: 2100, memory: mem }));
  assert.equal(out.memory.mode, 'idle');
  assert.equal(out.move, undefined);
});

test('ambient: leashed monster breaks off and returns home', () => {
  const player = { id: 'tok_p1', x: center(30), z: center(30), down: false };
  const home = { x: center(2), z: center(2) };
  // monster dragged 100ft from home; player just beyond aggro
  const far = 100;
  const mem = {
    mode: 'chase', homeX: home.x, homeZ: home.z, targetId: 'tok_p1',
    lastX: player.x, lastZ: player.z, lastSeenAt: 1000,
  };
  const out = thinkAmbient({ id: 'm', x: home.x + far, z: home.z + far, speedFt: 30 }, CTX({
    now: 1001, players: [player], memory: mem,
    visible: () => false,   // sight broken out here
  }));
  assert.equal(out.memory.mode, 'return', 'leash exceeded -> return home');
  if (out.move) {
    const before = Math.hypot(out.move.x - home.x, out.move.z - home.z);
    const nowD = Math.hypot(home.x + far - home.x, home.z + far - home.z);
    assert.ok(before < nowD, 'return step closes distance to home');
  }
});

test('ambient: hard tether — never moves beyond the leash radius', () => {
  const player = { id: 'tok_p1', x: center(40), z: center(2), down: false };
  const homeX = center(2), homeZ = center(2);
  // right at the leash edge chasing east: any step east would exceed it
  const mem = { mode: 'chase', homeX, homeZ, targetId: 'tok_p1', lastX: player.x, lastZ: player.z, lastSeenAt: 1000 };
  const out = thinkAmbient({ id: 'm', x: homeX + AMBIENT.LEASH_FT, z: homeZ, speedFt: 30 }, CTX({
    now: 1001, players: [player], memory: mem, visible: () => true, path: () => null,
  }));
  if (out.move) {
    const d = Math.hypot(out.move.x - homeX, out.move.z - homeZ);
    assert.ok(d <= AMBIENT.LEASH_FT + 0.5, `step ${d.toFixed(1)}ft within leash ${AMBIENT.LEASH_FT}ft`);
  } else {
    assert.ok(['return', 'chase'].includes(out.memory.mode));
  }
});

test('ambient: movement never lands on a blocked cell', () => {
  const blockedCells = new Set(['13,10', '12,11']);
  const player = { id: 'tok_p1', x: center(16), z: center(10), down: false };
  let mem = null;
  let now = 1000;
  for (let i = 0; i < 60; i++) {
    const out = thinkAmbient(MON(center(10), center(10)), CTX({
      now, memory: mem,
      players: [player], visible: () => true,
      blocked: (x, z) => blockedCells.has(Math.floor(x / FT) + ',' + Math.floor(z / FT)),
    }));
    mem = out.memory; now += AMBIENT.TICK_MS;
    if (out.move) {
      const k = Math.floor(out.move.x / FT) + ',' + Math.floor(out.move.z / FT);
      assert.ok(!blockedCells.has(k), `step into blocked cell ${k}`);
    }
  }
});

test('ambient: downed players are ignored', () => {
  const player = { id: 'tok_p1', x: center(11), z: center(10), down: true };
  const out = thinkAmbient(MON(center(10), center(10)), CTX({ players: [player], visible: () => true }));
  assert.notEqual(out.memory.mode, 'chase');
});
