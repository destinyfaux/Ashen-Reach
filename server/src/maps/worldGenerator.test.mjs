import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOverworld, isOverworldCellWalkable, validateOverworld, WORLD_PCG_RULES,
} from './worldGenerator.mjs';

test('overworld generation is deterministic for a fixed seed', () => {
  const first = generateOverworld({ seed: 73021 });
  const second = generateOverworld({ seed: 73021 });
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, generateOverworld({ seed: 73022 }));
});

test('overworld contains connected travel features, varied biomes, and a safe town spawn', () => {
  const map = generateOverworld({ seed: 73021 });
  const result = validateOverworld(map);
  assert.deepEqual(result, { ok: true, errors: [] });
  assert.equal(map.spawns.party[0][0], 56.5);
  assert.equal(map.spawns.party[0][1], 55.5);
  assert.equal(map.spawns.monsters.length, 0);
  assert.ok(map.cells.road.length > 200);
  assert.ok(map.cells.water.length > 200);
  assert.ok(map.terrain.heightFt.some((height) => height >= 60));
  assert.ok(map.metadata.water.river.every((point, index, points) =>
    index === 0 || point.level <= points[index - 1].level));
  assert.ok(map.metadata.water.lakes.every((lake) => lake.level <= 14));
  assert.ok(map.cells.water.every(([x, z]) => !isOverworldCellWalkable(map, x, z)));
  for (const [x, z] of map.cells.water) {
    const ground = (
      map.terrain.heightFt[z * (map.size.w + 1) + x] +
      map.terrain.heightFt[z * (map.size.w + 1) + x + 1] +
      map.terrain.heightFt[(z + 1) * (map.size.w + 1) + x] +
      map.terrain.heightFt[(z + 1) * (map.size.w + 1) + x + 1]
    ) / 4;
    assert.ok(map.cells.waterSurfaceFt[z * map.size.w + x] <= ground + 2 + 1e-6,
      `water at ${x},${z} must stay within 2 ft of the terrain`);
    const shoreline = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) =>
      !map.cells.water.some(([waterX, waterZ]) => waterX === x + dx && waterZ === z + dz));
    if (shoreline) {
      assert.ok(map.cells.waterSurfaceFt[z * map.size.w + x] <= ground - 0.15 + 1e-6,
        `shoreline water at ${x},${z} must be inset below the terrain`);
    }
  }
  assert.ok(map.cells.road.every(([x, z]) => isOverworldCellWalkable(map, x, z)));
  const separatedRoad = structuredClone(map);
  separatedRoad.cells.road.push([3, 3]);
  assert.ok(validateOverworld(separatedRoad).errors.includes('road network must be connected'));
  assert.equal(map.cells.road.some(([x, z]) =>
    map.cells.water.some(([waterX, waterZ]) => x === waterX && z === waterZ)), false);
  assert.ok(map.terrain.heightFt.some((height) => height >= 20));
  let steepestNeighbor = 0;
  const terrainWidth = map.size.w + 1;
  for (let z = 0; z <= map.size.h; z++) for (let x = 0; x <= map.size.w; x++) {
    const height = map.terrain.heightFt[z * terrainWidth + x];
    if (x > 0) steepestNeighbor = Math.max(steepestNeighbor,
      Math.abs(height - map.terrain.heightFt[z * terrainWidth + x - 1]));
    if (z > 0) steepestNeighbor = Math.max(steepestNeighbor,
      Math.abs(height - map.terrain.heightFt[(z - 1) * terrainWidth + x]));
  }
  assert.ok(steepestNeighbor <= 5, `terrain has an abrupt ${steepestNeighbor.toFixed(1)} ft step`);
  assert.equal(map.exits[0].destinationMapId, 'ashen_cellar');
  assert.ok(map.pointsOfInterest.some((poi) => poi.kind === 'graveyard' && poi.exitId === map.exits[0].id));
});

test('overworld clusters carry explicit biome rules and town services', () => {
  const map = generateOverworld({ seed: 73021 });
  for (const [biome, rules] of Object.entries(WORLD_PCG_RULES)) {
    assert.ok(map.biomes.kinds.includes(biome));
    assert.ok(rules.clusters.length);
    assert.ok(rules.undergrowth.length);
  }
  for (const variant of ['inn', 'general_store', 'smithy', 'healer']) {
    assert.ok(map.props.some((prop) => prop.type === 'building' && prop.variant === variant));
  }
  assert.ok(map.props.filter((prop) => prop.type === 'tree').every((prop) =>
    prop.scale >= 2.05 && prop.scale <= 3.2));
  const boulderShapes = new Set(map.props.filter((prop) => prop.type === 'boulder').map((prop) => prop.shape));
  assert.ok(boulderShapes.size >= 4);
});

test('water remains grounded and terrain grades stay gradual across representative seeds', () => {
  for (const seed of [...Array.from({ length: 20 }, (_, index) => index + 1), 73022, 12345]) {
    const map = generateOverworld({ seed });
    let steepestNeighbor = 0;
    for (const [x, z] of map.cells.water) {
      const width = map.size.w + 1;
      const ground = (
        map.terrain.heightFt[z * width + x] +
        map.terrain.heightFt[z * width + x + 1] +
        map.terrain.heightFt[(z + 1) * width + x] +
        map.terrain.heightFt[(z + 1) * width + x + 1]
      ) / 4;
      assert.ok(map.cells.waterSurfaceFt[z * map.size.w + x] <= ground + 2 + 1e-6,
        `seed ${seed}: water at ${x},${z} must stay within 2 ft of the terrain`);
      const shoreline = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) =>
        !map.cells.water.some(([waterX, waterZ]) => waterX === x + dx && waterZ === z + dz));
      if (shoreline) {
        assert.ok(map.cells.waterSurfaceFt[z * map.size.w + x] <= ground - 0.15 + 1e-6,
          `seed ${seed}: shoreline water at ${x},${z} must be inset below the terrain`);
      }
    }
    const width = map.size.w + 1;
    for (let z = 0; z <= map.size.h; z++) for (let x = 0; x <= map.size.w; x++) {
      const height = map.terrain.heightFt[z * width + x];
      if (x) steepestNeighbor = Math.max(steepestNeighbor,
        Math.abs(height - map.terrain.heightFt[z * width + x - 1]));
      if (z) steepestNeighbor = Math.max(steepestNeighbor,
        Math.abs(height - map.terrain.heightFt[(z - 1) * width + x]));
    }
    assert.ok(steepestNeighbor <= 5,
      `seed ${seed}: terrain has an abrupt ${steepestNeighbor.toFixed(1)} ft step`);
  }
});
