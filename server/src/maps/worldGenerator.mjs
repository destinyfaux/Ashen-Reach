import fs from 'node:fs';
import path from 'node:path';

const WIDTH = 112;
const HEIGHT = 96;
const BIOMES = [
  'meadow', 'forest', 'snow_forest', 'snowfield', 'deadlands',
  'mountains', 'town', 'graveyard', 'ruins',
];

export const WORLD_PCG_RULES = {
  forest: { clusters: ['oak_grove', 'pine_stand'], undergrowth: ['fern', 'twig', 'moss_rock'] },
  meadow: { clusters: ['grass_patch', 'wildflower_patch'], undergrowth: ['grass', 'small_rock'] },
  snow_forest: { clusters: ['snow_pine_grove'], undergrowth: ['snow_drift', 'frost_rock'] },
  snowfield: { clusters: ['snow_drift'], undergrowth: ['frost_rock'] },
  deadlands: { clusters: ['charred_stand'], undergrowth: ['ash_stone', 'dead_brush'] },
  mountains: { clusters: ['boulder_field', 'mountain_pines'], undergrowth: ['scree', 'small_rock'] },
  town: { clusters: ['town_center'], undergrowth: ['street_lantern', 'crate'] },
  graveyard: { clusters: ['crypt_cemetery'], undergrowth: ['grave_marker', 'dead_brush'] },
  ruins: { clusters: ['fallen_ruins'], undergrowth: ['rubble', 'dead_brush'] },
};

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

function hash2(x, z, salt) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) +
    Math.imul(salt | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function noise(x, z, scale, seed) {
  const gx = x / scale, gz = z / scale;
  const ix = Math.floor(gx), iz = Math.floor(gz);
  const tx = smooth(gx - ix), tz = smooth(gz - iz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

const REGIONS = [
  { biome: 'forest', x: 20, z: 23, rx: 23, rz: 21, seed: 11 },
  { biome: 'meadow', x: 27, z: 61, rx: 24, rz: 22, seed: 17 },
  { biome: 'snow_forest', x: 81, z: 17, rx: 24, rz: 19, seed: 23 },
  { biome: 'snowfield', x: 99, z: 48, rx: 19, rz: 22, seed: 29 },
  { biome: 'deadlands', x: 94, z: 78, rx: 22, rz: 19, seed: 31 },
  { biome: 'mountains', x: 59, z: 18, rx: 22, rz: 21, seed: 37 },
  { biome: 'mountains', x: 91, z: 34, rx: 17, rz: 17, seed: 41 },
  { biome: 'town', x: 56, z: 55, rx: 13, rz: 12, seed: 43 },
  { biome: 'graveyard', x: 58, z: 82, rx: 10, rz: 9, seed: 47 },
  { biome: 'ruins', x: 12, z: 54, rx: 8, rz: 8, seed: 53 },
];

function regionScore(region, x, z) {
  const dx = (x - region.x) / region.rx;
  const dz = (z - region.z) / region.rz;
  return 1 - Math.hypot(dx, dz) + (hash2(x, z, region.seed) - 0.5) * 0.16;
}

function lineCells(a, b, rng, width = 1) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 2);
  const cells = new Set();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t +
      Math.sin(t * Math.PI * 2) * Math.min(2.4, Math.hypot(b.x - a.x, b.z - a.z) * 0.018);
    const z = a.z + (b.z - a.z) * t + Math.sin(t * Math.PI * 5) * 0.55 + (rng() - 0.5) * 0.08;
    for (let dz = -width; dz <= width; dz++) for (let dx = -width; dx <= width; dx++) {
      if (dx * dx + dz * dz > width * width + 0.35) continue;
      const cx = Math.round(x + dx), cz = Math.round(z + dz);
      if (cx > 1 && cz > 1 && cx < WIDTH - 2 && cz < HEIGHT - 2) cells.add(cz * WIDTH + cx);
    }
  }
  return cells;
}

function makeWorld(seed) {
  const rng = mulberry32(seed);
  const biomeCells = new Array(WIDTH * HEIGHT).fill(0);
  const biomeIndex = Object.fromEntries(BIOMES.map((biome, index) => [biome, index]));
  const biomeBounds = {};

  for (const region of REGIONS) {
    biomeBounds[region.biome] ||= [];
    biomeBounds[region.biome].push({
      x: region.x, z: region.z, radiusX: region.rx, radiusZ: region.rz,
    });
  }

  for (let z = 0; z < HEIGHT; z++) for (let x = 0; x < WIDTH; x++) {
    let best = 0;
    let chosen = biomeIndex.meadow;
    for (const region of REGIONS) {
      const score = regionScore(region, x, z);
      if (score > best) { best = score; chosen = biomeIndex[region.biome]; }
    }
    biomeCells[z * WIDTH + x] = chosen;
  }

  const terrainPeaks = [
    { x: 59, z: 18, radius: 34, height: 82 },
    { x: 91, z: 34, radius: 29, height: 66 },
    { x: 101, z: 24, radius: 24, height: 52 },
  ];
  const heights = [];
  for (let z = 0; z <= HEIGHT; z++) for (let x = 0; x <= WIDTH; x++) {
    const mountain = terrainPeaks.reduce((peak, range) => {
      const distance = Math.hypot((x - range.x) * 0.88, z - range.z);
      return Math.max(peak, Math.pow(Math.max(0, 1 - distance / range.radius), 1.7) * range.height);
    }, 0);
    const broad = (noise(x, z, 32, seed) - 0.5) * 12;
    const local = (noise(x, z, 9, seed + 101) - 0.5) * 3;
    const valley = -Math.max(0, 1 - Math.hypot((x - 34) / 28, (z - 64) / 22)) * 6;
    const townFlat = Math.max(0, 1 - Math.hypot((x - 56) / 15, (z - 55) / 14));
    const elevation = Math.max(0, 5 + broad + local + mountain + valley) * (1 - townFlat * 0.95);
    heights.push(Math.round(elevation * 4) / 4);
  }
  const terrainAt = (x, z) => {
    const x0 = Math.max(0, Math.min(WIDTH - 1, Math.floor(x)));
    const z0 = Math.max(0, Math.min(HEIGHT - 1, Math.floor(z)));
    const tx = Math.max(0, Math.min(1, x - x0));
    const tz = Math.max(0, Math.min(1, z - z0));
    const a = heights[z0 * (WIDTH + 1) + x0];
    const b = heights[z0 * (WIDTH + 1) + x0 + 1];
    const c = heights[(z0 + 1) * (WIDTH + 1) + x0];
    const d = heights[(z0 + 1) * (WIDTH + 1) + x0 + 1];
    return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
  };

  const townCenter = { x: 56, z: 55 };
  const roadCells = new Set();
  const roadPaths = [
    [{ x: 56, z: 55 }, { x: 58, z: 82 }],
    [{ x: 56, z: 55 }, { x: 12, z: 54 }],
    [{ x: 56, z: 55 }, { x: 91, z: 34 }],
    [{ x: 56, z: 55 }, { x: 94, z: 77 }],
  ];
  for (const path of roadPaths) {
    for (const cell of lineCells(path[0], path[1], rng, path === roadPaths[0] ? 1 : 0)) roadCells.add(cell);
  }

  const waterCells = new Set();
  const waterSurface = new Array(WIDTH * HEIGHT).fill(null);
  const lakeSpecs = [];
  const addLake = (cx, cz, rx, rz, salt) => {
    const centerHeight = heights[Math.round(cz) * (WIDTH + 1) + Math.round(cx)];
    const level = Math.max(3, Math.min(14, centerHeight - 1.5));
    lakeSpecs.push({ x: cx, z: cz, rx, rz, level });
    for (let z = Math.floor(cz - rz - 1); z <= cz + rz + 1; z++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x - cx) / rx, dz = (z - cz) / rz;
        const edge = 1 + (hash2(x, z, salt) - 0.5) * 0.24;
        const cell = z * WIDTH + x;
        const elevation = heights[z * (WIDTH + 1) + x];
        if (dx * dx + dz * dz < edge && x > 1 && z > 1 && x < WIDTH - 2 &&
            z < HEIGHT - 2 && elevation < 55 && biomeCells[cell] !== biomeIndex.mountains) {
          waterCells.add(cell);
          waterSurface[cell] = level;
        }
      }
    }
  };
  addLake(32, 70, 6.5, 4.8, 61);
  addLake(28, 43, 4.8, 6.2, 67);

  const riverWaypoints = [
    { x: 59, z: 12, level: 138 },
    { x: 58, z: 28, level: 102 },
    { x: 50, z: 45, level: 67 },
    { x: 39, z: 63, level: 36 },
    { x: 42, z: 82, level: 13 },
    { x: 46, z: 95, level: 2.5 },
  ];
  let previousRiverLevel = Infinity;
  const riverPath = riverWaypoints.map((point) => {
    const level = Math.max(0, Math.min(point.level, terrainAt(point.x, point.z) - 1.5, previousRiverLevel - 0.1));
    previousRiverLevel = level;
    return { ...point, level };
  });
  const riverSamples = [];
  let previousSampleLevel = Infinity;
  for (let segment = 0; segment < riverPath.length - 1; segment++) {
    const a = riverPath[segment], b = riverPath[segment + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t + Math.sin(t * Math.PI) * 0.8;
      const z = a.z + (b.z - a.z) * t;
      const requestedLevel = a.level + (b.level - a.level) * t;
      const level = Math.max(0, Math.min(requestedLevel, terrainAt(x, z) - 1.5, previousSampleLevel));
      riverSamples.push({ x, z, level });
      previousSampleLevel = level;
    }
  }
  for (let i = 0; i < riverSamples.length; i += 3) {
    const sample = riverSamples[i];
    const centerX = Math.round(sample.x), centerZ = Math.round(sample.z);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dz * dz > 3.2) continue;
      const x = centerX + dx, z = centerZ + dz;
      if (x < 1 || z < 1 || x >= WIDTH - 1 || z >= HEIGHT - 1) continue;
      const cell = z * WIDTH + x;
      if (terrainAt(x + 0.5, z + 0.5) <= sample.level + 1.5 &&
          (!waterCells.has(cell) || sample.level < waterSurface[cell])) {
        waterCells.add(cell);
        waterSurface[cell] = sample.level;
      }
    }
  }

  for (let z = 0; z <= HEIGHT; z++) for (let x = 0; x <= WIDTH; x++) {
    const at = z * (WIDTH + 1) + x;
    for (const lake of lakeSpecs) {
      const distance = Math.hypot((x - lake.x) / lake.rx, (z - lake.z) / lake.rz);
      if (distance > 1.45) continue;
      const bed = lake.level - 0.65 + Math.max(0, distance - 0.8) * 2.2;
      const shoreBlend = smooth(Math.max(0, Math.min(1, (1.5 - distance) / 0.55)));
      heights[at] += (Math.min(heights[at], bed) - heights[at]) * shoreBlend;
    }
    let nearest = Infinity, riverLevel = null;
    for (const sample of riverSamples) {
      const distance = Math.hypot(x - sample.x, z - sample.z);
      if (distance < nearest) { nearest = distance; riverLevel = sample.level; }
      if (nearest < 0.2) break;
    }
    if (nearest < 8 && riverLevel !== null) {
      const channelHeight = riverLevel - 1 + Math.max(0, nearest - 1.25);
      const channelBlend = smooth(Math.max(0, Math.min(1, (8 - nearest) / 6.75)));
      heights[at] += (Math.min(heights[at], channelHeight) - heights[at]) * channelBlend;
    }
  }
  const bridgeCells = [];
  for (const cell of roadCells) {
    if (!waterCells.has(cell)) continue;
    const x = cell % WIDTH, z = Math.floor(cell / WIDTH);
    waterCells.delete(cell);
    waterSurface[cell] = null;
    bridgeCells.push({ x: x + 0.5, z: z + 0.5, type: 'bridge', scale: 1 });
  }
  for (const cell of waterCells) {
    const x = cell % WIDTH, z = Math.floor(cell / WIDTH);
    const ground = terrainAt(x + 0.5, z + 0.5);
    if (waterSurface[cell] > ground + 2) {
      waterSurface[cell] = ground - 0.18;
    }
    const shoreline = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ].some(([dx, dz]) => !waterCells.has((z + dz) * WIDTH + x + dx));
    if (shoreline) {
      waterSurface[cell] = Math.min(waterSurface[cell], ground - 0.18);
    }
  }

  const gate = { x: 58, z: 82 };
  const props = [];
  const clusters = [];
  const roads = [];
  const waterList = [...waterCells].sort((a, b) => a - b);
  const roadList = [...roadCells].sort((a, b) => a - b);

  const addProp = (type, x, z, options = {}) => {
    props.push({ type, x, z, ...options });
  };

  // Town lots are authored as a small deterministic kit; footprints face a
  // central road and leave walkable yards between buildings.
  const buildings = [
    { type: 'building', variant: 'inn', label: 'The Ember & Ash', x: 52.5, z: 49.5, width: 8, depth: 6, rotY: 0 },
    { type: 'building', variant: 'general_store', label: 'General Store', x: 61.5, z: 50, width: 6, depth: 5, rotY: Math.PI / 2 },
    { type: 'building', variant: 'smithy', label: 'The Bent Nail', x: 48, z: 58.5, width: 7, depth: 6, rotY: 0 },
    { type: 'building', variant: 'healer', label: 'Hearth & Remedy', x: 63, z: 59, width: 6, depth: 5, rotY: Math.PI / 2 },
    { type: 'building', variant: 'house', label: '', x: 46.5, z: 49, width: 5, depth: 5, rotY: Math.PI / 2 },
    { type: 'building', variant: 'house', label: '', x: 67, z: 50, width: 5, depth: 5, rotY: 0 },
    { type: 'building', variant: 'house', label: '', x: 45.5, z: 63, width: 6, depth: 5, rotY: 0 },
    { type: 'building', variant: 'house', label: '', x: 66.5, z: 64, width: 5, depth: 6, rotY: Math.PI / 2 },
  ];
  for (const building of buildings) addProp('building', building.x, building.z, building);
  addProp('well', townCenter.x + 0.5, townCenter.z + 2, { clusterId: 'town-center' });
  addProp('street_lantern', 56.5, 48.5, { clusterId: 'town-center' });
  addProp('street_lantern', 56.5, 62.5, { clusterId: 'town-center' });
  clusters.push({ id: 'town-center', rule: 'town_center', biome: 'town', x: 56, z: 55, radius: 13 });

  const makeCluster = (id, biome, x, z, radius, rule, count, variants) => {
    clusters.push({ id, biome, rule, x, z, radius, count, variants });
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const distance = Math.sqrt(rng()) * radius;
      const px = x + Math.cos(angle) * distance;
      const pz = z + Math.sin(angle) * distance;
      const type = variants[Math.floor(rng() * variants.length)];
      if (Math.hypot(px - townCenter.x, pz - townCenter.z) < 13) continue;
      if (waterCells.has(Math.floor(pz) * WIDTH + Math.floor(px)) ||
          roadCells.has(Math.floor(pz) * WIDTH + Math.floor(px))) continue;
      const treeVariant = biome === 'deadlands' ? 'dead'
        : biome === 'snow_forest' ? 'snowpine'
          : biome === 'mountains' ? 'pine'
            : ['oak', 'pine', 'ash'][Math.floor(rng() * 3)];
      const scale = type === 'tree' ? 2.05 + rng() * 1.15
        : type === 'boulder' ? 1.25 + rng() * 1.75
          : 0.7 + rng() * 1.8;
      const shape = ['angular', 'slab', 'spire', 'ridge', 'split'][Math.floor(rng() * 5)];
      addProp(type, px, pz, {
        scale,
        shape: type === 'boulder' ? shape : undefined,
        variant: type === 'tree' ? treeVariant : biome,
        rotY: Math.floor(rng() * 4) * Math.PI / 2,
        clusterId: id,
      });
    }
  };

  makeCluster('western-oak-groves', 'forest', 20, 23, 18, 'grove-with-undergrowth', 78, ['tree', 'tree', 'boulder', 'fern', 'twig', 'rock']);
  makeCluster('western-meadow-patches', 'meadow', 27, 66, 17, 'grass-and-wildflowers', 72, ['grass', 'grass', 'wildflower', 'rock', 'boulder']);
  makeCluster('northern-snow-pines', 'snow_forest', 81, 17, 18, 'snow-pine-stand', 70, ['tree', 'tree', 'boulder', 'snow_drift', 'rock']);
  makeCluster('eastern-snowfield', 'snowfield', 100, 49, 15, 'drifts-and-frost-rocks', 56, ['snow_drift', 'snow_drift', 'rock', 'boulder']);
  makeCluster('southern-deadlands', 'deadlands', 94, 78, 17, 'charred-sparse-grove', 62, ['tree', 'tree', 'dead_brush', 'rock', 'boulder']);
  makeCluster('mountain-boulder-fields', 'mountains', 61, 18, 16, 'rockfall-pockets', 62, ['boulder', 'boulder', 'rock', 'tree', 'scree']);
  makeCluster('eastern-high-pines', 'mountains', 91, 34, 13, 'scree-and-pine', 46, ['boulder', 'rock', 'tree', 'scree']);

  for (let i = 0; i < 24; i++) {
    const angle = rng() * Math.PI * 2, radius = 3 + rng() * 7;
    const x = gate.x + Math.cos(angle) * radius, z = gate.z + Math.sin(angle) * radius;
    addProp(i % 3 === 0 ? 'grave_marker' : 'dead_brush', x, z, {
      scale: 0.7 + rng() * 0.6, rotY: rng() * Math.PI * 2, clusterId: 'cellar-cemetery',
    });
  }
  clusters.push({ id: 'cellar-cemetery', rule: 'crypt-cemetery', biome: 'graveyard', ...gate, radius: 9 });
  for (let i = 0; i < 18; i++) {
    const x = 12 + rng() * 9, z = 54 + (rng() - 0.5) * 14;
    addProp(i % 3 ? 'rubble' : 'ruin_pillar', x, z, {
      scale: 0.8 + rng() * 1.1, rotY: rng() * Math.PI * 2, clusterId: 'west-road-ruins',
    });
  }
  clusters.push({ id: 'west-road-ruins', rule: 'collapsed-roadside-ruins', biome: 'ruins', x: 12, z: 54, radius: 8 });
  addProp('cave_entrance', 91.5, 34.5, { clusterId: 'eastern-caves' });
  clusters.push({ id: 'eastern-caves', rule: 'rocky-cave-mouth', biome: 'mountains', x: 91, z: 34, radius: 3 });
  props.push(...bridgeCells);

  const blocked = new Set([
    ...Array.from({ length: WIDTH }, (_, x) => x),
    ...Array.from({ length: WIDTH }, (_, x) => (HEIGHT - 1) * WIDTH + x),
    ...Array.from({ length: HEIGHT }, (_, z) => z * WIDTH),
    ...Array.from({ length: HEIGHT }, (_, z) => z * WIDTH + WIDTH - 1),
  ]);
  const party = [townCenter.x + 0.5, townCenter.z + 0.5];

  const halfTiles = [];
  for (let z = 2; z < HEIGHT - 2; z++) {
    for (let x = 2; x < WIDTH - 2; x++) {
      const cell = z * WIDTH + x;
      if (waterCells.has(cell) || roadCells.has(cell) || blocked.has(cell)) continue;
      const nW = waterCells.has((z - 1) * WIDTH + x);
      const sW = waterCells.has((z + 1) * WIDTH + x);
      const wW = waterCells.has(z * WIDTH + x - 1);
      const eW = waterCells.has(z * WIDTH + x + 1);

      if (nW && wW) {
        halfTiles.push({ x, z, type: 'water', orientation: 'nw' });
      } else if (nW && eW) {
        halfTiles.push({ x, z, type: 'water', orientation: 'ne' });
      } else if (sW && wW) {
        halfTiles.push({ x, z, type: 'water', orientation: 'sw' });
      } else if (sW && eW) {
        halfTiles.push({ x, z, type: 'water', orientation: 'se' });
      }
    }
  }

  for (let z = 2; z < HEIGHT - 2; z++) {
    for (let x = 2; x < WIDTH - 2; x++) {
      const cell = z * WIDTH + x;
      if (roadCells.has(cell) || waterCells.has(cell) || blocked.has(cell)) continue;
      const nR = roadCells.has((z - 1) * WIDTH + x);
      const sR = roadCells.has((z + 1) * WIDTH + x);
      const wR = roadCells.has(z * WIDTH + x - 1);
      const eR = roadCells.has(z * WIDTH + x + 1);

      if (nR && wR) {
        halfTiles.push({ x, z, type: 'road', orientation: 'nw' });
      } else if (nR && eR) {
        halfTiles.push({ x, z, type: 'road', orientation: 'ne' });
      } else if (sR && wR) {
        halfTiles.push({ x, z, type: 'road', orientation: 'sw' });
      } else if (sR && eR) {
        halfTiles.push({ x, z, type: 'road', orientation: 'se' });
      }
    }
  }

  return {
    id: 'ashen_reach',
    name: 'The Ashen Reach',
    seed,
    generated: true,
    size: { w: WIDTH, h: HEIGHT },
    theme: 'wilderness',
    tileSet: 'wilderness',
    floor: 'ash_grass',
    cells: {
      wall: [...blocked].sort((a, b) => a - b).map((cell) => [cell % WIDTH, Math.floor(cell / WIDTH)]),
      water: [...waterCells].sort((a, b) => a - b).map((cell) => [cell % WIDTH, Math.floor(cell / WIDTH)]),
      waterSurfaceFt: waterSurface,
      road: roadList.map((cell) => [cell % WIDTH, Math.floor(cell / WIDTH)]),
      halfTiles,
    },
    terrain: { width: WIDTH + 1, height: HEIGHT + 1, heightFt: heights },
    biomes: { kinds: BIOMES, cells: biomeCells },
    biomeBounds,
    clusters,
    props,
    walls: [],
    lights: [
      { x: 56.5, z: 55.5, radiusFt: 80, color: '#d7aa65', flicker: false },
      { x: gate.x + 0.5, z: gate.z + 0.5, radiusFt: 26, color: '#9a7951', flicker: true },
    ],
    spawns: { party: [party], monsters: [] },
    exits: [
      { id: 'cellar-crypt', label: 'Enter the crypt', x: gate.x + 0.5, z: gate.z + 0.5, destinationMapId: 'ashen_cellar' },
    ],
    pointsOfInterest: [
      { id: 'ember-and-ash', kind: 'inn', label: 'The Ember & Ash', x: 52.5, z: 49.5 },
      { id: 'general-store', kind: 'general_store', label: 'General Store', x: 61.5, z: 50 },
      { id: 'bent-nail', kind: 'smithy', label: 'The Bent Nail', x: 48, z: 58.5 },
      { id: 'hearth-remedy', kind: 'healer', label: 'Hearth & Remedy', x: 63, z: 59 },
      { id: 'crypt-cemetery', kind: 'graveyard', label: 'Ashen Cemetery', x: gate.x, z: gate.z, exitId: 'cellar-crypt' },
      { id: 'west-road-ruins', kind: 'ruins', label: 'The Old Watch', x: 12, z: 54 },
      { id: 'eastern-caves', kind: 'cave', label: 'The Blackstone Mouth', x: 91, z: 34 },
    ],
    metadata: {
      townCenter,
      water: { lakes: lakeSpecs, river: riverPath },
      roads: roadPaths.map((path) => path.map((point) => ({ ...point }))),
    },
  };
}

export function normalizeHalfTile(orientation) {
  if (!orientation) return 'nw';
  const o = String(orientation).toLowerCase();
  if (o === 'tl' || o === 'top_left' || o === 'nw' || o === 'northwest') return 'nw';
  if (o === 'tr' || o === 'top_right' || o === 'ne' || o === 'northeast') return 'ne';
  if (o === 'br' || o === 'bottom_right' || o === 'se' || o === 'southeast') return 'se';
  if (o === 'bl' || o === 'bottom_left' || o === 'sw' || o === 'southwest') return 'sw';
  return 'nw';
}

export function isPointInHalfTile(u, v, orientation) {
  const norm = normalizeHalfTile(orientation);
  if (norm === 'nw') return u + v <= 1.0;
  if (norm === 'se') return u + v >= 1.0;
  if (norm === 'ne') return u >= v;
  if (norm === 'sw') return u <= v;
  return true;
}

export function generateOverworld({ seed = 73021 } = {}) {
  if (!Number.isInteger(seed)) throw new TypeError('overworld seed must be an integer');
  return makeWorld(seed >>> 0);
}

export function isOverworldCellWalkable(map, x, z) {
  const { w, h } = map?.size || {};
  if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x >= w || z >= h) return false;
  const blocked = new Set([...(map.cells?.wall || []), ...(map.cells?.water || [])]
    .map(([cellX, cellZ]) => cellZ * w + cellX));
  return !blocked.has(z * w + x);
}

export function isOverworldPointWalkable(map, worldX, worldZ) {
  const { w, h } = map?.size || {};
  const CELL_FT = 5;
  if (typeof worldX !== 'number' || typeof worldZ !== 'number' ||
      worldX < 0 || worldZ < 0 || worldX >= w * CELL_FT || worldZ >= h * CELL_FT) {
    return false;
  }
  const cx = Math.floor(worldX / CELL_FT), cz = Math.floor(worldZ / CELL_FT);

  // Full solid cells
  const wallCells = new Set((map.cells?.wall || []).filter((c) => !c[2]).map(([x, z]) => z * w + x));
  const waterCells = new Set((map.cells?.water || []).filter((c) => !c[2]).map(([x, z]) => z * w + x));
  if (wallCells.has(cz * w + cx) || waterCells.has(cz * w + cx)) return false;

  const u = (worldX - cx * CELL_FT) / CELL_FT;
  const v = (worldZ - cz * CELL_FT) / CELL_FT;

  for (const cell of [...(map.cells?.wall || []), ...(map.cells?.water || [])]) {
    if (cell[0] === cx && cell[1] === cz && cell[2]) {
      if (isPointInHalfTile(u, v, cell[2])) return false;
    }
  }
  for (const h of map.cells?.halfTiles || []) {
    if (h.x === cx && h.z === cz && (h.type === 'water' || h.type === 'wall')) {
      if (isPointInHalfTile(u, v, h.orientation)) return false;
    }
  }
  return true;
}

export function validateOverworld(map) {
  const errors = [];
  const {
    size, cells, spawns, terrain, biomes, biomeBounds, exits, props, clusters, pointsOfInterest,
  } = map || {};
  if (!size || size.w < 32 || size.h < 32) errors.push('world dimensions are too small');
  const width = size?.w || 0, height = size?.h || 0;
  const key = (x, z) => z * width + x;
  const wall = new Set((cells?.wall || []).map(([x, z]) => key(x, z)));
  const waterList = cells?.water || [];
  const roadList = cells?.road || [];
  const water = new Set(waterList.map(([x, z]) => key(x, z)));
  const roads = new Set(roadList.map(([x, z]) => key(x, z)));
  if (water.size === 0) errors.push('world has no water');
  if (!roads.size) errors.push('world has no roads');
  if (water.size !== waterList.length) errors.push('water cells must be unique');
  if (roads.size !== roadList.length) errors.push('road cells must be unique');
  if (waterList.some(([x, z]) => isOverworldCellWalkable(map, x, z))) {
    errors.push('water cells must be blocked for movement');
  }
  if (Array.isArray(cells?.halfTiles)) {
    const validOrientations = new Set(['nw', 'ne', 'se', 'sw', 'tl', 'tr', 'br', 'bl']);
    const validTypes = new Set(['water', 'road', 'wall', 'floor']);
    for (const h of cells.halfTiles) {
      if (h.x < 0 || h.z < 0 || h.x >= width || h.z >= height) {
        errors.push(`half-tile at ${h.x},${h.z} out of bounds`);
      }
      if (!validTypes.has(h.type)) {
        errors.push(`half-tile at ${h.x},${h.z} has invalid type ${h.type}`);
      }
      if (!validOrientations.has(h.orientation)) {
        errors.push(`half-tile at ${h.x},${h.z} has invalid orientation ${h.orientation}`);
      }
    }
  }
  if (roadList.some(([x, z]) => !isOverworldCellWalkable(map, x, z))) {
    errors.push('roads must stay on walkable land');
  }
  const townCell = biomeBounds?.town?.[0];
  const roadStart = townCell ? key(Math.floor(townCell.x), Math.floor(townCell.z)) : -1;
  if (!roads.has(roadStart)) {
    errors.push('road network must connect to the town');
  } else {
    const reached = new Set([roadStart]);
    const queue = [roadStart];
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i], x = cell % width, z = Math.floor(cell / width);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const neighbor = key(x + dx, z + dz);
        if ((dx || dz) && roads.has(neighbor) && !reached.has(neighbor)) {
          reached.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    if (reached.size !== roads.size) errors.push('road network must be connected');
  }
  if (terrain?.heightFt?.length !== (width + 1) * (height + 1)) errors.push('terrain height field has the wrong size');
  if (cells?.waterSurfaceFt?.length !== width * height ||
      waterList.some(([x, z]) => typeof cells.waterSurfaceFt[key(x, z)] !== 'number')) {
    errors.push('water cells need an explicit surface elevation');
  }
  const river = map?.metadata?.water?.river || [];
  if (river.some((point, index) => index > 0 && point.level > river[index - 1].level)) {
    errors.push('river surface must descend from source to outlet');
  }
  if ((map?.metadata?.water?.lakes || []).some((lake) => lake.level > 20)) {
    errors.push('lakes must sit in lowland basins');
  }
  if (biomes?.cells?.length !== width * height) errors.push('biome field has the wrong size');
  if (new Set(biomes?.cells || []).size < 8) errors.push('world is missing biome variety');
  if (!spawns?.party?.[0] ||
      !isOverworldCellWalkable(map, Math.floor(spawns.party[0][0]), Math.floor(spawns.party[0][1]))) {
    errors.push('town party spawn must be on walkable land');
  }
  if (!exits?.some((exit) => exit.destinationMapId === 'ashen_cellar')) errors.push('world must have a crypt entrance');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'inn')) errors.push('town is missing its inn');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'general_store')) errors.push('town is missing its store');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'smithy')) errors.push('town is missing its smithy');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'healer')) errors.push('town is missing its healer');
  if (!clusters?.length) errors.push('world has no prop clusters');
  if (!pointsOfInterest?.some((poi) => poi.kind === 'graveyard') ||
      !pointsOfInterest?.some((poi) => poi.kind === 'ruins') ||
      !pointsOfInterest?.some((poi) => poi.kind === 'cave')) {
    errors.push('world is missing graveyard, ruins, or cave points of interest');
  }
  return { ok: errors.length === 0, errors };
}

const args = process.argv.slice(2);
if (args.includes('--check') || args.includes('--out')) {
  const seedArg = args[args.indexOf('--seed') + 1];
  const seed = seedArg === undefined ? 73021 : Number(seedArg);
  const map = generateOverworld({ seed });
  if (args.includes('--check')) {
    const result = validateOverworld(map);
    if (!result.ok) { console.error(result.errors.join('\n')); process.exitCode = 1; }
    else console.log(JSON.stringify({ id: map.id, seed, size: map.size, props: map.props.length, clusters: map.clusters.length }));
  } else {
    const out = args[args.indexOf('--out') + 1];
    if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(map, null, 2));
    else process.stdout.write(JSON.stringify(map, null, 2));
  }
}
