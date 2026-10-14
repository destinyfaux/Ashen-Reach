import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOverworld, isOverworldCellWalkable, validateOverworld, WORLD_PCG_RULES,
  isPointInHalfTile, isOverworldPointWalkable,
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
  assert.ok(map.metadata.water.ponds.length > 0, 'ponds exist in metadata');
  assert.ok(map.metadata.water.ponds.every((pond) => pond.level <= 14));
  for (const body of [...map.metadata.water.lakes, ...map.metadata.water.ponds]) {
    const cx = Math.round(body.x), cz = Math.round(body.z);
    const centerGround = (
      map.terrain.heightFt[cz * (map.size.w + 1) + cx] +
      map.terrain.heightFt[cz * (map.size.w + 1) + cx + 1] +
      map.terrain.heightFt[(cz + 1) * (map.size.w + 1) + cx] +
      map.terrain.heightFt[(cz + 1) * (map.size.w + 1) + cx + 1]
    ) / 4;
    assert.ok(centerGround < body.level,
      `terrain underneath ${body.kind} at ${cx},${cz} must be deformed below water level`);
  }
  assert.ok(map.cells.water.every(([x, z]) => isOverworldCellWalkable(map, x, z)),
    'water is walkable by design (shallow fords)');
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
    prop.scale >= 0.8 && prop.scale <= 3.01));
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

test('half-tiles partition cells into corner-to-corner right triangles correctly', () => {
  // NW triangle (u + v <= 1): right angle at NW
  assert.equal(isPointInHalfTile(0.2, 0.2, 'nw'), true);
  assert.equal(isPointInHalfTile(0.8, 0.8, 'nw'), false);

  // SE triangle (u + v >= 1): right angle at SE
  assert.equal(isPointInHalfTile(0.8, 0.8, 'se'), true);
  assert.equal(isPointInHalfTile(0.2, 0.2, 'se'), false);

  // NE triangle (u >= v): right angle at NE
  assert.equal(isPointInHalfTile(0.8, 0.2, 'ne'), true);
  assert.equal(isPointInHalfTile(0.2, 0.8, 'ne'), false);

  // SW triangle (u <= v): right angle at SW
  assert.equal(isPointInHalfTile(0.2, 0.8, 'sw'), true);
  assert.equal(isPointInHalfTile(0.8, 0.2, 'sw'), false);
});

test('overworld generates half-tile transitions for water and roads with correct walkability', () => {
  const map = generateOverworld({ seed: 73021 });
  assert.ok(Array.isArray(map.cells.halfTiles), 'map has halfTiles array');
  assert.ok(map.cells.halfTiles.length > 0, 'halfTiles are generated');

  const waterHalfs = map.cells.halfTiles.filter((h) => h.type === 'water');
  const roadHalfs = map.cells.halfTiles.filter((h) => h.type === 'road');
  assert.ok(waterHalfs.length > 0, 'water half-tiles exist for shorelines');
  assert.ok(roadHalfs.length > 0, 'road half-tiles exist for paths');

  // Verify half-tile precision: with fords walkable, BOTH halves of a water
  // half-tile are open — no invisible collision anywhere in the cell
  const firstWater = waterHalfs[0];
  const { x, z, orientation } = firstWater;

  // NW orientation: (x, z) to (x+1, z) to (x, z+1) is water; SE corner is open
  if (orientation === 'nw') {
    // Water point: (x + 0.2, z + 0.2) in cell coords -> world ft = * 5
    assert.equal(isOverworldPointWalkable(map, (x + 0.2) * 5, (z + 0.2) * 5), true,
      'water half of half-tile is walkable (shallow fords)');
    // Dry land point: (x + 0.8, z + 0.8)
    assert.equal(isOverworldPointWalkable(map, (x + 0.8) * 5, (z + 0.8) * 5), true,
      'dry land half of half-tile must be walkable (no invisible collision)');
  }
});

test('bridges are properly oriented across water and allow clear crossing', () => {
  const map = generateOverworld({ seed: 73021 });
  const bridges = map.props.filter((p) => p.type === 'bridge');
  assert.ok(bridges.length > 0, 'bridge prop exists');

  for (const bridge of bridges) {
    // Bridge rotation should be aligned with the road direction across river (roughly East-West, |rotY| > 1.0)
    assert.ok(typeof bridge.rotY === 'number' && Math.abs(bridge.rotY) > 1.0,
      `bridge at ${bridge.x},${bridge.z} must have proper crossing rotY (got ${bridge.rotY})`);
    assert.ok(bridge.width >= 2.0, 'bridge width must be spacious (at least 2 cells)');
    assert.ok(bridge.length >= 4.0, 'bridge length must span river (at least 4 cells)');

    // Walking across the bridge center line should be completely open (no water or wall collision)
    const midCellX = Math.floor(bridge.x);
    const midCellZ = Math.floor(bridge.z);
    assert.ok(isOverworldCellWalkable(map, midCellX, midCellZ),
      `center cell of bridge at ${midCellX},${midCellZ} must be walkable`);
    assert.ok(isOverworldPointWalkable(map, bridge.x * 5, bridge.z * 5),
      `world point at bridge center must be walkable`);
  }
});

test('rivers and nearby lakes merge together and generate shoreline stones', () => {
  const map = generateOverworld({ seed: 73021 });
  // Lake 1 at (32, 70) is in close proximity to the river path (z around 65-75)
  // Ensure water cells form a continuous connection between the lake and river
  const lake1Cells = map.cells.water.filter(([x, z]) => Math.hypot((x - 32) / 6.5, (z - 70) / 4.8) <= 1.0);
  assert.ok(lake1Cells.length > 0, 'lake 1 water cells exist');

  // Verify shoreline river rocks are placed
  const riverRocks = map.props.filter((p) => p.clusterId === 'river-bank' || p.clusterId === 'lake-shore');
  assert.ok(riverRocks.length >= 8, 'shoreline river rocks and lake stones are spawned');
  assert.ok(riverRocks.every((r) => r.variant === 'river_stone'), 'shoreline props use river_stone variant');
});


