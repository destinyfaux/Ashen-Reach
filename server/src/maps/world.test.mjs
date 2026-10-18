import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOverworld, isOverworldCellWalkable } from './worldGenerator.mjs';
import {
  REGION_W, REGION_H, WORLD_SEED,
  regionId, parseRegionId, regionOriginFt, nameForRegion,
  getWorldContext, generateRegion, seamMaxStep, graveyardSiteRegion,
  worldWaterCellAt,
} from './world.mjs';

function maxTerraStep(def) {
  const w = def.size.w, h = def.size.h, tf = def.terrain.heightFt, tw = w + 1;
  let max = 0;
  for (let z = 0; z <= h; z++) {
    for (let x = 0; x <= w; x++) {
      const height = tf[z * tw + x];
      if (x) max = Math.max(max, Math.abs(height - tf[z * tw + x - 1]));
      if (z) max = Math.max(max, Math.abs(height - tf[(z - 1) * tw + x]));
    }
  }
  return max;
}

function walkableFn(def) {
  const w = def.size.w;
  const blocked = new Set([...(def.cells.wall || []), ...(def.cells.water || [])]
    .map(([x, z]) => z * w + x));
  return (x, z) => !blocked.has(z * w + x);
}

test('region ids round-trip and the home region keeps its historical id', () => {
  assert.equal(regionId(0, 0), 'ashen_reach');
  assert.equal(regionId(1, 0), 'w1_0');
  assert.equal(regionId(-1, 0), 'wm1_0');
  assert.equal(regionId(3, -2), 'w3_m2');
  assert.deepEqual(parseRegionId('ashen_reach'), { rx: 0, rz: 0 });
  assert.deepEqual(parseRegionId('wm1_0'), { rx: -1, rz: 0 });
  assert.deepEqual(parseRegionId('w3_m2'), { rx: 3, rz: -2 });
  assert.equal(parseRegionId('tavern_cellar'), null);
  assert.equal(parseRegionId('w1_0;drop'), null);
  assert.deepEqual(regionOriginFt(-1, 2), { x: -560, z: 960 });
});

test('region generation is deterministic per (rx, rz) and order-independent', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const first = generateRegion(1, 0, { ctx });
  const second = generateRegion(1, 0, { ctx });
  assert.deepEqual(first, second);
  const withOtherLoaded = generateRegion(-2, 1, { ctx });
  const after = generateRegion(1, 0, { ctx });
  assert.deepEqual(after, first);
  assert.notDeepEqual(withOtherLoaded, first);
  assert.equal(first.region.rx, 1);
  assert.equal(first.region.rz, 0);
  assert.deepEqual(first.worldOriginFt, regionOriginFt(1, 0));
});

test('home region (0,0) stitches to a seamless open border and keeps its identity', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const stitched = generateRegion(0, 0, { ctx });
  assert.equal(stitched.id, 'ashen_reach');
  assert.equal(stitched.name, 'The Ashen Reach');
  const w = stitched.size.w, h = stitched.size.h;
  // boundary ring walls are stripped so parties can walk between regions
  for (const [x, z] of stitched.cells.wall) {
    assert.ok(!(x === 0 || z === 0 || x === w - 1 || z === h - 1),
      `boundary ring cell ${x},${z} must not be a wall`);
  }
  // the town spawn and crypt exit survive stitching untouched
  assert.deepEqual(stitched.spawns.party[0], home.spawns.party[0]);
  assert.ok(stitched.exits.some((exit) => exit.destinationMapId === 'ashen_cellar'));
  // world roads extend through the home strip toward the seams
  const rawRoads = new Set(home.cells.road.map(([x, z]) => z * w + x));
  const addedRoads = (stitched.cells.road || []).filter(([x, z]) => !rawRoads.has(z * w + x));
  assert.ok(addedRoads.length > 10, 'stitching adds world-road cells toward the borders');
});

test('adjacent regions share seam terrain within the 7.5 ft step invariant', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const cache = new Map();
  const region = (rx, rz) => {
    const key = rx + ',' + rz;
    if (!cache.has(key)) cache.set(key, generateRegion(rx, rz, { ctx }));
    return cache.get(key);
  };
  for (const [a, b] of [
    [[0, 0], [1, 0]], [[0, 0], [-1, 0]], [[0, 0], [0, 1]], [[0, 0], [0, -1]],
    [[1, 0], [1, 1]], [[0, 1], [1, 1]], [[1, 0], [2, 0]], [[0, 1], [0, 2]],
    [[-1, -1], [0, -1]], [[-1, -1], [-1, 0]],
  ]) {
    const step = seamMaxStep(region(...a), region(...b));
    assert.ok(step <= 7.5, `seam ${a} -> ${b} has an abrupt ${step.toFixed(2)} ft step`);
  }
});

test('neighbor regions keep gradual interior grades across a representative band', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  for (let rz = -2; rz <= 2; rz++) {
    for (let rx = -2; rx <= 2; rx++) {
      const def = generateRegion(rx, rz, { ctx });
      const step = maxTerraStep(def);
      assert.ok(step <= 5.5,
        `region ${rx},${rz} has an abrupt ${step.toFixed(2)} ft step`);
    }
  }
});

test('neighbor regions carry grounded water, walkable roads, spawns and prop variety', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  for (const [rx, rz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [2, 1], [-1, 2]]) {
    const def = generateRegion(rx, rz, { ctx });
    const w = def.size.w;
    const walkable = walkableFn(def);
    for (const [x, z] of def.cells.road || []) {
      assert.ok(walkable(x, z), `region ${rx},${rz} road cell ${x},${z} must be on land`);
    }
    for (const [x, z] of def.cells.water || []) {
      assert.ok(isOverworldCellWalkable(def, x, z),
        `region ${rx},${rz} water cell ${x},${z} must be walkable (shallow fords)`);
      const ground = (
        def.terrain.heightFt[z * (w + 1) + x] +
        def.terrain.heightFt[z * (w + 1) + x + 1] +
        def.terrain.heightFt[(z + 1) * (w + 1) + x] +
        def.terrain.heightFt[(z + 1) * (w + 1) + x + 1]
      ) / 4;
      const surface = def.cells.waterSurfaceFt[z * w + x];
      assert.ok(surface <= ground + 2 + 1e-6,
        `region ${rx},${rz} water at ${x},${z} must sit within 2 ft of terrain`);
      // shoreline derivation is world-aware: neighbors across a region seam
      // resolve through the world water field, so border water inside a lake
      // or river is NOT shoreline even though the neighbor cell is in the
      // adjacent region's payload
      const shoreline = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nx < w && nz >= 0 && nz < def.size.h) {
          return !(def.cells.water || []).some(([wx2, wz2]) => wx2 === nx && wz2 === nz);
        }
        return worldWaterCellAt(ctx, rx * w + nx, rz * def.size.h + nz) === null;
      });
      if (shoreline) {
        assert.ok(surface <= ground - 0.15 + 1e-6,
          `region ${rx},${rz} shoreline water at ${x},${z} must be inset below terrain`);
      }
    }
    const spawn = def.spawns.party[0];
    assert.ok(spawn && walkable(Math.floor(spawn[0]), Math.floor(spawn[1])),
      `region ${rx},${rz} party spawn must be walkable`);
    assert.equal(def.spawns.monsters.length, 0, 'overworld regions have no enemy placements');
    assert.ok(def.props.length > 20, `region ${rx},${rz} should carry landscape props`);
    assert.ok(def.biomes.cells.length === w * def.size.h);
    assert.ok(new Set(def.biomes.cells).size >= 1);
    assert.equal(def.region.rx, rx);
    assert.equal(def.region.rz, rz);
  }
});

test('the home river flows across the southern seam into region (0, 1)', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const homeStitched = generateRegion(0, 0, { ctx });
  const south = generateRegion(0, 1, { ctx });
  const w = homeStitched.size.w, h = homeStitched.size.h;
  const homeEdge = new Set(homeStitched.cells.water
    .filter(([x, z]) => z >= h - 3)
    .map(([x]) => x));
  const southEdge = new Set(south.cells.water.filter(([x, z]) => z <= 3).map(([x]) => x));
  assert.ok(homeEdge.size >= 3, 'home river reaches the southern border');
  let matched = 0;
  for (const x of homeEdge) if (southEdge.has(x)) matched++;
  assert.ok(matched >= Math.min(3, homeEdge.size),
    'river water cells continue across the home/south seam');
});

test('water surfaces do not trench at region seams (lakes stay one body)', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  // home-terminus lake straddles the vertical seam x = REGION_W at rz = 2
  const A = generateRegion(0, 2, { ctx });
  const B = generateRegion(1, 2, { ctx });
  const groundAvg = (def, x, z) => {
    const H = def.terrain.heightFt, tw = def.terrain.width;
    return (H[z * tw + x] + H[z * tw + x + 1] + H[(z + 1) * tw + x] + H[(z + 1) * tw + x + 1]) / 4;
  };
  const strictInterior = (wx, wz) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .every(([dx, dz]) => worldWaterCellAt(ctx, wx + dx, wz + dz) !== null);
  // lowest raw level covering the cell (lakes via the world probe, rivers via
  // sample discs) — setWater takes the minimum, then the bed clamp applies
  const minCover = (wx, wz) => {
    let m = worldWaterCellAt(ctx, wx, wz);
    for (const river of ctx.rivers) {
      for (const s of river.samples) {
        const halfW = (s.w || 1.9) + 0.1;
        const dx = Math.round(s.x) - wx, dz = Math.round(s.z) - wz;
        if (dx * dx + dz * dz <= halfW * halfW && (m === null || s.level < m)) m = s.level;
      }
    }
    return m;
  };
  let checked = 0;
  for (const [def, borderX, originX] of [
    [A, REGION_W - 1, 0], [B, 0, REGION_W],
  ]) {
    const surf = def.cells.waterSurfaceFt;
    for (let z = 2; z < REGION_H - 2; z++) {
      const cell = z * REGION_W + borderX;
      if (typeof surf[cell] !== 'number') continue;
      const wx = originX + borderX, wz = 2 * REGION_H + z;
      if (!strictInterior(wx, wz)) continue; // banks legitimately taper
      checked++;
      const ground = groundAvg(def, borderX, z);
      const expected = Math.min(minCover(wx, wz), ground + 1.95);
      assert.ok(surf[cell] >= expected - 0.01,
        `lake border cell (${borderX},${z}) in ${def.region.rx},${def.region.rz} trenched: ` +
        `surface ${surf[cell]} but expected >= ${expected.toFixed(2)} (ground ${ground.toFixed(2)})`);
    }
  }
  assert.ok(checked >= 2, `expected lake-straddling seam cells, checked ${checked}`);
  // halo carries the far side of the lake for the client renderer
  const haloA = A.cells.waterHalo || [], haloB = B.cells.waterHalo || [];
  assert.ok(haloA.some(([x]) => x >= REGION_W), 'east halo present on region A');
  assert.ok(haloB.some(([x]) => x < 0), 'west halo present on region B');
  for (const [, , lvl] of haloA) assert.equal(typeof lvl, 'number', 'halo entries carry levels');
  for (const [, , lvl] of haloB) assert.equal(typeof lvl, 'number', 'halo entries carry levels');
});

test('river surfaces do not trench where a course crosses a seam', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  // find a vertical seam a river actually crosses (deterministic world data)
  let pick = null;
  outer:
  for (let k = -6; k <= 6; k++) {
    if (k === 0) continue;
    for (const river of ctx.rivers) {
      for (const s of river.samples) {
        if (Math.abs(s.x - k * REGION_W) < 3 && s.z > REGION_H) {
          pick = { seam: k * REGION_W, rz: Math.floor(s.z / REGION_H) };
          break outer;
        }
      }
    }
  }
  assert.ok(pick, 'expected a river to cross a vertical seam in the test band');
  const A = generateRegion(pick.seam / REGION_W - 1, pick.rz, { ctx });
  const B = generateRegion(pick.seam / REGION_W, pick.rz, { ctx });
  const groundAvg = (def, x, z) => {
    const H = def.terrain.heightFt, tw = def.terrain.width;
    return (H[z * tw + x] + H[z * tw + x + 1] + H[(z + 1) * tw + x] + H[(z + 1) * tw + x + 1]) / 4;
  };
  const strictInterior = (wx, wz) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .every(([dx, dz]) => worldWaterCellAt(ctx, wx + dx, wz + dz) !== null);
  // lowest raw level covering the cell, then the bed clamp — identical to the
  // interior rule. Before the fix the shoreline rule forced border cells to
  // ground-0.18, a 0.6-2.2 ft groove along every seam the water crosses.
  const minCover = (wx, wz) => {
    let m = worldWaterCellAt(ctx, wx, wz);
    for (const river of ctx.rivers) {
      for (const s of river.samples) {
        const halfW = (s.w || 1.9) + 0.1;
        const dx = Math.round(s.x) - wx, dz = Math.round(s.z) - wz;
        if (dx * dx + dz * dz <= halfW * halfW && (m === null || s.level < m)) m = s.level;
      }
    }
    return m;
  };
  let checked = 0;
  for (const [def, borderX, originX] of [
    [A, REGION_W - 1, pick.seam - REGION_W], [B, 0, pick.seam],
  ]) {
    const surf = def.cells.waterSurfaceFt;
    for (let z = 2; z < REGION_H - 2; z++) {
      const cell = z * REGION_W + borderX;
      if (typeof surf[cell] !== 'number') continue;
      const wx = originX + borderX, wz = pick.rz * REGION_H + z;
      if (!strictInterior(wx, wz)) continue;
      checked++;
      const ground = groundAvg(def, borderX, z);
      const expected = Math.min(minCover(wx, wz), ground + 1.95);
      assert.ok(surf[cell] >= expected - 0.01,
        `river border cell (${borderX},${z}) trenched: surface ${surf[cell]} ` +
        `but expected >= ${expected.toFixed(2)} (ground ${ground.toFixed(2)})`);
    }
  }
  assert.ok(checked >= 4, `expected river seam cells, checked ${checked}`);
});

test('region names are stable, flavored, and the home keeps its historical name', () => {
  assert.equal(nameForRegion(0, 0), 'The Ashen Reach');
  const a = nameForRegion(2, 1);
  const b = nameForRegion(2, 1);
  assert.equal(a, b);
  assert.notEqual(nameForRegion(2, 1), nameForRegion(1, 2));
});

test('the home halo keeps the first two region rings meadow-dominant', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const dominant = (def) => {
    const tally = new Map();
    for (const c of def.biomes.cells) tally.set(c, (tally.get(c) || 0) + 1);
    const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return def.biomes.kinds[best];
  };
  for (let rz = -2; rz <= 2; rz++) {
    for (let rx = -2; rx <= 2; rx++) {
      if (rx === 0 && rz === 0) continue;
      const def = generateRegion(rx, rz, { ctx });
      assert.equal(dominant(def), 'meadow',
        `region ${rx},${rz} inside the home halo must stay meadow-dominant`);
    }
  }
});

test('the town has a composed graveyard in an adjacent region', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const site = graveyardSiteRegion(WORLD_SEED);
  assert.equal(Math.max(Math.abs(site.rx), Math.abs(site.rz)), 1,
    'the graveyard site must sit in the ring directly around home');
  const def = generateRegion(site.rx, site.rz, { ctx });
  const types = new Set(def.props.map((p) => p.type));
  for (const expected of ['grave_gate', 'grave_fence', 'grave_mound', 'mausoleum', 'columbarium', 'grave_marker']) {
    assert.ok(types.has(expected), `graveyard is missing ${expected}`);
  }
  assert.ok(def.pointsOfInterest.some((p) => p.kind === 'graveyard'),
    'graveyard site carries a point of interest');
});

test('every world river reaches a lake or the terminus basin', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  assert.ok(ctx.lakes.length >= 5, 'the world carries several large lakes');
  for (const lake of ctx.lakes) {
    assert.ok(lake.rx >= 12 && lake.rz >= 8, 'world lakes are large basins');
    assert.ok(lake.level >= 2, 'world lake surfaces sit above the floor');
  }
  for (const river of ctx.rivers) {
    assert.ok(river.samples.length >= 100,
      `${river.id} must run a long course (${river.samples.length} samples)`);
    const end = river.samples[river.samples.length - 1];
    const reaches = ctx.lakes.some((lake) => {
      const dx = (end.x - lake.x) / (lake.rx * 1.5);
      const dz = (end.z - lake.z) / (lake.rz * 1.5);
      return dx * dx + dz * dz < 1;
    });
    assert.ok(reaches, `${river.id} must terminate in a lake`);
    for (let i = 1; i < river.samples.length; i++) {
      assert.ok(river.samples[i].level <= river.samples[i - 1].level + 1e-9,
        `${river.id} surface must descend monotonically`);
    }
  }
});

test('ponds stay locked to meadow, forest and snowy forest regions', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const dominant = (def) => {
    const tally = new Map();
    for (const c of def.biomes.cells) tally.set(c, (tally.get(c) || 0) + 1);
    return def.biomes.kinds[[...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]];
  };
  for (let rz = -4; rz <= 4; rz++) {
    for (let rx = -4; rx <= 4; rx++) {
      const def = generateRegion(rx, rz, { ctx });
      const dom = dominant(def);
      if (def.metadata.water.ponds.length === 0) continue;
      assert.ok(['meadow', 'forest', 'snow_forest'].includes(dom),
        `region ${rx},${rz} (${dom}) must not carry ponds`);
    }
  }
});

test('mountain country passes seam and grade invariants far from home and reaches grand heights', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  const cache = new Map();
  const region = (rx, rz) => {
    const key = rx + ',' + rz;
    if (!cache.has(key)) cache.set(key, generateRegion(rx, rz, { ctx }));
    return cache.get(key);
  };
  // find a mountain-heavy region in the 3-5 ring and check its interior grade
  let checked = 0;
  for (let rz = -5; rz <= 5 && checked < 3; rz++) {
    for (let rx = -5; rx <= 5 && checked < 3; rx++) {
      if (Math.max(Math.abs(rx), Math.abs(rz)) < 3) continue;
      const def = region(rx, rz);
      const mountainCells = def.biomes.cells.filter((c) => def.biomes.kinds[c] === 'mountains').length;
      if (mountainCells < 200) continue;
      checked++;
      const step = maxTerraStep(def);
      assert.ok(step <= 7.5, `mountain region ${rx},${rz} has an abrupt ${step.toFixed(2)} ft step`);
      assert.ok(Math.max(...def.terrain.heightFt) > 200,
        `mountain region ${rx},${rz} should reach grand elevation > 200 ft (got ${Math.max(...def.terrain.heightFt).toFixed(1)} ft)`);
      for (const pair of [[[rx, rz], [rx + 1, rz]], [[rx, rz], [rx, rz + 1]]]) {
        const other = region(...pair[1]);
        const seam = seamMaxStep(def, other);
        assert.ok(seam <= 7.5, `mountain seam ${pair[0]} -> ${pair[1]} has ${seam.toFixed(2)} ft step`);
      }
    }
  }
  assert.ok(checked >= 1, 'the far field should contain mountain regions to verify');
});

test('meadow and forest country grows temple and fortress ruins', () => {
  const home = generateOverworld({ seed: WORLD_SEED });
  const ctx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
  let temples = 0, keeps = 0, structured = 0;
  for (let rz = -4; rz <= 4; rz++) {
    for (let rx = -4; rx <= 4; rx++) {
      const def = generateRegion(rx, rz, { ctx });
      if (def.pointsOfInterest.some((p) => p.label === 'Ruined Temple')) temples++;
      if (def.pointsOfInterest.some((p) => p.label === 'Ruined Keep')) keeps++;
      const types = new Set(def.props.map((p) => p.type));
      if (['ruin_column', 'ruin_column_fallen', 'ruin_wall', 'ruin_slab'].some((t) => types.has(t))) structured++;
    }
  }
  assert.ok(temples + keeps >= 4, `expected several ruin sites in the band, got ${temples + keeps}`);
  assert.ok(structured >= temples + keeps, 'ruin sites carry structural props');
});
