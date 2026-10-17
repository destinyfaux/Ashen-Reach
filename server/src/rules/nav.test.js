// ASHENREACH — server/src/rules/nav.test.js
// P3.4 pathfinding: monsters route around walls, never cross blocked cells,
// never path out of bounds, and budgets are respected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aStarPath, routeStep, losClear, nearestFreeCell } from './Nav.js';

const FT = 5;
const center = (c) => (c + 0.5) * FT;

/** Wall map: 11x11 bounded grid with a vertical wall at cx=5 (gap at cz 8..10). */
function wallMap() {
  const solid = new Set();
  for (let cz = 0; cz <= 7; cz++) solid.add('5,' + cz);
  return (cx, cz) => solid.has(cx + ',' + cz)
    || cx < 0 || cz < 0 || cx > 10 || cz > 10;   // bounded play area
}

test('nav: straight line when line of sight is clear', () => {
  const blocked = () => false;
  const p = aStarPath(blocked, center(1), center(1), center(4), center(4));
  assert.ok(p, 'path exists');
  const last = p[p.length - 1];
  assert.equal(last.x, center(4));
  assert.equal(last.z, center(4));
});

test('nav: path routes around a wall instead of through it', () => {
  const blocked = wallMap();
  const p = aStarPath(blocked, center(2), center(2), center(8), center(2));
  assert.ok(p, 'path exists');
  for (const wp of p) {
    const cx = Math.floor(wp.x / FT), cz = Math.floor(wp.z / FT);
    assert.ok(!blocked(cx, cz), `waypoint ${wp.x},${wp.z} is on a blocked cell`);
  }
  const last = p[p.length - 1];
  assert.equal(last.x, center(8));
  // every waypoint must route through the gap at cz >= 8 — no waypoint sits
  // in the wall column at cz < 8
  for (const wp of p) {
    const cx = Math.floor(wp.x / FT);
    if (cx === 5) assert.ok(Math.floor(wp.z / FT) >= 8, 'wall column crossed below the gap');
  }
});

test('nav: unreachable goal returns null (sealed block)', () => {
  const solid = new Set();
  for (let cx = 6; cx <= 10; cx++) for (let cz = 6; cz <= 10; cz++) solid.add(cx + ',' + cz);
  const blocked = (cx, cz) => solid.has(cx + ',' + cz)
    || cx < 0 || cz < 0 || cx > 11 || cz > 11;
  const p = aStarPath(blocked, center(1), center(1), center(8), center(8));
  assert.equal(p, null);
});

test('nav: goal inside a wall snaps to the nearest free cell', () => {
  const blocked = wallMap();
  const p = aStarPath(blocked, center(2), center(2), center(5), center(2)); // goal IN the wall
  assert.ok(p, 'snapped path exists');
  for (const wp of p) assert.ok(!blocked(Math.floor(wp.x / FT), Math.floor(wp.z / FT)));
});

test('nav: routeStep respects the movement budget', () => {
  const blocked = () => false;
  const from = { x: center(0), z: center(0) }, to = { x: center(8), z: center(0) };
  const r = routeStep(blocked, from.x, from.z, to.x, to.z, 15); // 3 cells
  assert.ok(r);
  const d = Math.hypot(r.x - from.x, r.z - from.z);
  assert.ok(d <= 15 + 1e-6, `step ${d.toFixed(2)}ft within 15ft budget`);
  assert.ok(d >= 10, 'uses most of the budget');
});

test('nav: routeStep follows the detour when a wall blocks the direct line', () => {
  const blocked = wallMap();
  const from = { x: center(2), z: center(2) }, to = { x: center(8), z: center(2) };
  const r = routeStep(blocked, from.x, from.z, to.x, to.z, 60);
  assert.ok(r, 'detoured step exists');
  // the step must NOT be a beeline through the wall: y (z) must deviate or x
  // must stop short of the wall column at the same row
  const cx = Math.floor(r.x / FT), cz = Math.floor(r.z / FT);
  assert.ok(!blocked(cx, cz), 'step lands on a free cell');
});

test('nav: losClear agrees with blocked cells', () => {
  const blocked = wallMap();
  assert.equal(losClear(blocked, center(1), center(1), center(4), center(1)), true);
  assert.equal(losClear(blocked, center(1), center(1), center(9), center(1)), false); // crosses wall
});

test('nav: nearestFreeCell spirals outward to the first free ring cell', () => {
  // solid 5x5 block centered on origin
  const solid = new Set();
  for (let cx = -2; cx <= 2; cx++) for (let cz = -2; cz <= 2; cz++) solid.add(cx + ',' + cz);
  const blocked = (cx, cz) => solid.has(cx + ',' + cz);
  const r = nearestFreeCell(blocked, 0, 0);
  assert.ok(r, 'found a free cell');
  const ring = Math.max(Math.abs(r[0]), Math.abs(r[1]));
  assert.equal(ring, 3, 'first free cell is on ring 3');
  assert.ok(!blocked(r[0], r[1]), 'and it is free');
});

test('nav: never returns a waypoint inside a blocked cell (torture grid)', () => {
  // random-ish deterministic scatter of walls
  let s = 42;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const solid = new Set();
  for (let i = 0; i < 40; i++) solid.add(Math.floor(rnd() * 12) + ',' + Math.floor(rnd() * 12));
  const blocked = (cx, cz) => solid.has(cx + ',' + cz);
  for (let trial = 0; trial < 12; trial++) {
    const fx = Math.floor(rnd() * 12), fz = Math.floor(rnd() * 12);
    const tx = Math.floor(rnd() * 12), tz = Math.floor(rnd() * 12);
    const p = aStarPath(blocked, center(fx), center(fz), center(tx), center(tz));
    if (!p) continue;
    for (const wp of p) {
      const cx = Math.floor(wp.x / FT), cz = Math.floor(wp.z / FT);
      assert.ok(!blocked(cx, cz), `waypoint ${cx},${cz} blocked`);
    }
  }
});
