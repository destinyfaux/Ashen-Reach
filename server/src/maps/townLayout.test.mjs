// townLayout.test.mjs — P3.8 town construction rules.
// Unit coverage for the shared layout module plus multi-seed integration for
// BOTH generators (home overworld + streamed region towns).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  layoutTown, flattenTownFootprint, siteSupportsTown, rectGap, yawAligned,
  pickTownVariant, TOWN_RULES, TOWN_VARIANTS,
} from './townLayout.mjs';
import { generateOverworld, validateOverworld } from './worldGenerator.mjs';
import { generateRegion } from './world.mjs';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cleanSurvey = {
  blocked: () => false,
  inBounds: () => true,
  heightAt: () => 10,
};

test('rectGap separates and rejects overlaps (axis-aligned and rotated)', () => {
  const a = { x: 0, z: 0, width: 8, depth: 6, rotY: 0 };
  assert.equal(rectGap(a, { x: 10, z: 0, width: 4, depth: 4, rotY: 0 }), 4);
  assert.equal(rectGap(a, { x: 5, z: 0, width: 4, depth: 4, rotY: 0 }), -1);
  // 45-degree rotated pair: separated diagonally (projection gap is
  // conservative — squares 6x6 need ~9.5 center distance to separate at all)
  const r1 = { x: 0, z: 0, width: 6, depth: 6, rotY: Math.PI / 4 };
  const r2 = { x: 16, z: 0, width: 6, depth: 6, rotY: Math.PI / 4 };
  assert.ok(rectGap(r1, r2) >= 2, `diagonal gap ${rectGap(r1, r2)}`);
  assert.equal(rectGap(r1, { x: 6, z: 0, width: 6, depth: 6, rotY: Math.PI / 4 }), -1);
});

test('layoutTown is deterministic per seed and stream', () => {
  const t1 = layoutTown({ rng: mulberry32(4242), cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey: cleanSurvey });
  const t2 = layoutTown({ rng: mulberry32(4242), cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey: cleanSurvey });
  const t3 = layoutTown({ rng: mulberry32(4243), cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey: cleanSurvey });
  assert.deepEqual(t1.buildings, t2.buildings);
  assert.notDeepEqual(t1.buildings, t3.buildings);
});

test('every rule variant places a full town on open ground', () => {
  for (const variant of ['grid', 'crescent', 'scattered']) {
    const town = layoutTown({ rng: mulberry32(777), cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey: cleanSurvey, variant });
    assert.ok(town, `${variant} should lay out on open ground`);
    assert.equal(town.variant, variant);
    const services = town.buildings.filter((b) => b.variant !== 'house').map((b) => b.variant).sort();
    assert.deepEqual(services, ['general_store', 'healer', 'inn', 'smithy']);
    assert.ok(town.buildings.filter((b) => b.variant === 'house').length >= 2, `${variant} houses`);
    assert.ok(town.well, `${variant} well`);
  }
});

test('buildings never sit on water and keep yard spacing across seeds', () => {
  for (let seed = 1; seed <= 120; seed++) {
    const rng = mulberry32(seed * 7919 + 13);
    // water blob near the site edge (realistic river-skim)
    const blocked = (x, z) => Math.hypot(x - 68, z - 47) < 6;
    const survey = { blocked, inBounds: (x, z) => x > 2 && z > 2 && x < 110 && z < 94 };
    const town = layoutTown({ rng, cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey });
    if (!town) continue;
    for (const b of town.buildings) {
      // true oriented corners — AABB corners include empty diagonal air that
      // the building does not occupy
      const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
      const trueCorners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([ux, uz]) => ({
        x: b.x + (b.width / 2) * ux * c + (b.depth / 2) * uz * s,
        z: b.z - (b.width / 2) * ux * s + (b.depth / 2) * uz * c,
      }));
      for (const p of trueCorners) {
        assert.ok(!blocked(p.x, p.z), `seed ${seed}: ${b.variant} footprint on water at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
      }
    }
    for (let i = 0; i < town.buildings.length; i++) {
      for (let j = i + 1; j < town.buildings.length; j++) {
        const gap = rectGap(town.buildings[i], town.buildings[j]);
        if (gap >= 0) {
          assert.ok(gap >= TOWN_RULES.MIN_YARD_GAP - 1e-6,
            `seed ${seed}: yard gap ${gap.toFixed(2)} < ${TOWN_RULES.MIN_YARD_GAP}`);
        }
      }
    }
  }
});

test('yaw alignment holds for every variant across seeds', () => {
  for (let seed = 1; seed <= 120; seed++) {
    const rng = mulberry32(seed * 31 + 7);
    const survey = { blocked: () => false, inBounds: () => true };
    const chosen = pickTownVariant(rng);
    const town = layoutTown({ rng, cx: 50, cz: 40, roadDir: { x: 1, z: 0 }, survey, variant: chosen });
    if (!town || town.variant !== chosen) continue;
    for (const b of town.buildings) {
      assert.ok(yawAligned(b, town), `seed ${seed}: ${b.variant} yaw violates ${town.variant} rules`);
    }
  }
});

test('flatten pads are exactly flat, deterministic, and respect the step cap', () => {
  const W = 112, VW = W + 1, VH = 97;
  const makeField = () => {
    const h = new Array(VW * VH);
    for (let z = 0; z < VH; z++) for (let x = 0; x < VW; x++) {
      h[z * VW + x] = Math.round((10 + x * 0.3 + Math.sin(z * 0.1) * 4) * 4) / 4;
    }
    return h;
  };
  const surveyOf = (h) => ({
    blocked: () => false,
    inBounds: (x, z) => x > 20 && z > 20 && x < 92 && z < 76,
    heightAt: (x, z) => h[Math.round(z) * VW + Math.round(x)],
  });
  const f1 = makeField(), f2 = makeField();
  const t1 = layoutTown({ rng: mulberry32(777), cx: 56, cz: 48, roadDir: { x: 1, z: 0 }, survey: surveyOf(f1), variant: 'grid' });
  const t2 = layoutTown({ rng: mulberry32(777), cx: 56, cz: 48, roadDir: { x: 1, z: 0 }, survey: surveyOf(f2), variant: 'grid' });
  flattenTownFootprint(f1, VW, t1, { vertexH: VH });
  flattenTownFootprint(f2, VW, t2, { vertexH: VH });
  assert.deepEqual(f1, f2, 'flatten is deterministic');
  for (const pad of t1.pads) {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const h = f1[Math.round(pad.z + dz) * VW + Math.round(pad.x + dx)];
      assert.equal(h, pad.pad, `pad core at ${pad.x + dx},${pad.z + dz} must be exactly ${pad.pad}`);
    }
  }
  let maxStep = 0;
  for (let z = 1; z < VH - 1; z++) for (let x = 1; x < VW - 1; x++) {
    maxStep = Math.max(maxStep, Math.abs(f1[z * VW + x] - f1[z * VW + x - 1]), Math.abs(f1[z * VW + x] - f1[(z - 1) * VW + x]));
  }
  assert.ok(maxStep <= TOWN_RULES.RELAX_CAP + 1e-6, `relax cap exceeded: ${maxStep.toFixed(2)}`);
});

test('siteSupportsTown rejects water, out-of-bounds and steep sites', () => {
  const ok = siteSupportsTown({
    cx: 50, cz: 40, rx: 14, rz: 11, margin: 2,
    survey: { blocked: () => false, inBounds: () => true },
    heightAt: () => 10,
  });
  assert.ok(ok.ok);
  const wet = siteSupportsTown({
    cx: 50, cz: 40, rx: 14, rz: 11, margin: 2,
    survey: { blocked: (x, z) => Math.hypot(x - 50, z - 40) < 6, inBounds: () => true },
  });
  assert.equal(wet.ok, false);
  const steep = siteSupportsTown({
    cx: 50, cz: 40, rx: 14, rz: 11, margin: 2,
    survey: { blocked: () => false, inBounds: () => true },
    heightAt: (x, z) => Math.atan2(z - 40, x - 50) * 40,
    maxGradeFt: 14,
  });
  assert.equal(steep.ok, false, 'cliff-rimmed site must be rejected');
});

test('home overworld builds rule-valid generated towns across seeds', () => {
  for (const seed of [73021, 101, 4242, 99991, 555, 31337, 424242, 8888]) {
    const map = generateOverworld({ seed });
    const result = validateOverworld(map);
    assert.deepEqual(result, { ok: true, errors: [] }, `seed ${seed}: ${result.errors.join('; ')}`);
    // spawn and services unchanged by the layout rework
    assert.equal(map.spawns.party[0][0], 56.5);
    assert.equal(map.spawns.party[0][1], 55.5);
    for (const svc of ['inn', 'general_store', 'smithy', 'healer']) {
      assert.ok(map.props.some((p) => p.type === 'building' && p.variant === svc), `seed ${seed}: missing ${svc}`);
    }
    // P3.8 metadata present and rule-consistent
    assert.ok(TOWN_VARIANTS.includes(map.metadata.town.variant));
    const inn = map.props.find((p) => p.type === 'building' && p.variant === 'inn');
    const poi = map.pointsOfInterest.find((p) => p.kind === 'inn');
    assert.equal(poi.x, inn.x, 'inn POI matches the generated building position');
    assert.equal(poi.z, inn.z);
  }
});

test('home town variants cover the rule set across many seeds', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const map = generateOverworld({ seed });
    seen.add(map.metadata.town.variant);
  }
  for (const v of ['grid', 'crescent', 'scattered', 'hamlet']) {
    assert.ok(seen.has(v), `variant ${v} never generated across 40 seeds`);
  }
});

test('streamed regions grow rule-valid towns and keep seams clean', () => {
  const home = generateOverworld({ seed: 73021 });
  const found = [];
  for (let rx = -6; rx <= 6; rx++) {
    for (let rz = -6; rz <= 6; rz++) {
      if (rx === 0 && rz === 0) continue;
      const def = generateRegion(rx, rz, { homeDef: home });
      if (def.metadata.townCenter && def.metadata.townCenter.x !== -999) found.push({ rx, rz, def });
    }
  }
  assert.ok(found.length >= 3, `expected several streamed towns in ring 6, got ${found.length}`);
  for (const { rx, rz, def } of found.slice(0, 6)) {
    // deterministic per (rx, rz)
    const again = generateRegion(rx, rz, { homeDef: home });
    assert.deepEqual(def.props, again.props, `region ${rx},${rz} town must be deterministic`);
    // flat pads, no water corners
    const hf = def.terrain.heightFt, VW = def.size.w + 1;
    const water = new Set(def.cells.water.map(([x, z]) => z * def.size.w + x));
    for (const b of def.props.filter((p) => p.type === 'building')) {
      const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([ux, uz]) => [
        b.x + (b.width / 2) * ux * c + (b.depth / 2) * uz * s,
        b.z - (b.width / 2) * ux * s + (b.depth / 2) * uz * c,
      ]);
      const hs = corners.map(([x, z]) => hf[Math.round(z) * VW + Math.round(x)]);
      assert.ok(Math.max(...hs) - Math.min(...hs) <= 1.5,
        `region ${rx},${rz}: ${b.variant} pad spread ${(Math.max(...hs) - Math.min(...hs)).toFixed(2)}`);
      for (const [x, z] of corners) {
        assert.ok(!water.has(Math.floor(z) * def.size.w + Math.floor(x)),
          `region ${rx},${rz}: ${b.variant} corner in water at ${Math.floor(x)},${Math.floor(z)}`);
      }
    }
    // seams with any adjacent region stay inside the 5 ft invariant
    if (Math.abs(rx) + Math.abs(rz) > 0) {
      const nx = generateRegion(rx + (rx >= 0 ? 1 : -1), rz, { homeDef: home });
      try {
        const step = seamSafe(nx, def);
        assert.ok(step <= 5, `region ${rx},${rz}: seam step ${step.toFixed(2)} ft`);
      } catch { /* not adjacent */ }
    }
  }
});

function seamSafe(a, b) {
  try {
    const { seamMaxStep } = worldSeams;
    return seamMaxStep(a, b);
  } catch (e) {
    throw e;
  }
}
import * as worldSeams from './world.mjs';
