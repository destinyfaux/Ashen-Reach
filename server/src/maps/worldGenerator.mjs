import fs from 'node:fs';
import path from 'node:path';
import {
  layoutTown, flattenTownFootprint, buildingCorners, rectGap,
  yawAligned, TOWN_RULES, TOWN_VARIANTS,
} from './townLayout.mjs';

const WIDTH = 112;
const HEIGHT = 96;
const BIOMES = [
  'meadow', 'forest', 'snow_forest', 'snowfield', 'deadlands',
  'mountains', 'town', 'graveyard', 'ruins',
];

export const WORLD_PCG_RULES = {
  forest: { clusters: ['oak_grove', 'pine_stand'], undergrowth: ['fern', 'twig', 'moss_rock'] },
  meadow: { clusters: ['grass_patch', 'wildflower_patch', 'willow_stand'], undergrowth: ['grass', 'small_rock'] },
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

// The home region reads as a normal town: open meadow around the settlement,
// real mountain peaks in the north, and the authored graveyard/ruins sites.
// The old all-biome showcase patches (snow, blight, deep woods) are gone —
// those biomes now live out in the world where they belong.
const REGIONS = [
  { biome: 'meadow', x: 27, z: 61, rx: 24, rz: 22, seed: 17 },
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
    // width may be a number or a per-sample function (town taper)
    const w = typeof width === 'function' ? width(x, z) : width;
    for (let dz = -w; dz <= w; dz++) for (let dx = -w; dx <= w; dx++) {
      if (dx * dx + dz * dz > w * w + 0.35) continue;
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
  // Roads are boulevards now (user ruling: ~4x wider — the old 1-cell, 5 ft
  // paths cluttered the road dressing and read like goat trails). width is
  // the DISC RADIUS in cells, so radius 2 lays a 4-5 cell (≈20-25 ft)
  // carriageway; disc stamping draws no rng, so every seeded layout keeps
  // its deterministic draw order (only the town survey sees more road cells).
  // TOWN TAPER: inside ~14 cells of the plaza the roads keep their EXACT
  // pre-change widths — a 20-ft road blanket across the town core starves
  // the P3.8 layout variants of buildable ground (crescent stopped
  // generating entirely). Open country gets the full boulevard.
  roadPaths.forEach((path, pi) => {
    const coreW = pi === 0 ? 1 : 0;   // pre-change widths: south street 3 cells, the rest 1
    const widthAt = (sx, sz) => {
      const d = Math.hypot(sx - townCenter.x, sz - townCenter.z);
      if (d < 14) return coreW;  // town + layout reach: exact pre-change streets
      if (d < 22) return Math.max(coreW, 1);  // soft ring before the boulevard
      return 2;                  // open-country boulevard
    };
    for (const cell of lineCells(path[0], path[1], rng, widthAt)) roadCells.add(cell);
  });

  const waterCells = new Set();
  const waterSurface = new Array(WIDTH * HEIGHT).fill(null);
  const lakeSpecs = [];
  const pondSpecs = [];
  const addWaterBody = (specs, kind, cx, cz, rx, rz, salt) => {
    const centerHeight = heights[Math.round(cz) * (WIDTH + 1) + Math.round(cx)];
    const drop = kind === 'pond' ? 1.2 : 1.5;
    const level = Math.max(kind === 'pond' ? 2 : 3, Math.min(14, centerHeight - drop));
    specs.push({ x: cx, z: cz, rx, rz, level, kind });
    for (let z = Math.floor(cz - rz - 1); z <= cz + rz + 1; z++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x - cx) / rx, dz = (z - cz) / rz;
        const edge = 1 + (hash2(x, z, salt) - 0.5) * (kind === 'pond' ? 0.2 : 0.24);
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
  const addLake = (cx, cz, rx, rz, salt) => addWaterBody(lakeSpecs, 'lake', cx, cz, rx, rz, salt);
  const addPond = (cx, cz, rx, rz, salt) => addWaterBody(pondSpecs, 'pond', cx, cz, rx, rz, salt);

  addLake(32, 70, 6.5, 4.8, 61);
  addLake(28, 43, 4.8, 6.2, 67);
  addPond(18, 26, 3.0, 2.4, 73);
  addPond(75, 62, 2.8, 2.4, 79);

  const rawRiverWaypoints = [
    { x: 59, z: 12 },
    { x: 58, z: 28 },
    { x: 50, z: 45 },
    { x: 39, z: 63 },
    { x: 42, z: 82 },
    { x: 46, z: 95 },
  ];


  const startRiverLevel = Math.max(18, terrainAt(59, 12) - 1.5);
  const endRiverLevel = 2.5;
  let previousRiverLevel = Infinity;
  const riverPath = rawRiverWaypoints.map((point, index) => {
    const t = index / (rawRiverWaypoints.length - 1);
    const gradLevel = startRiverLevel + (endRiverLevel - startRiverLevel) * t;
    const ground = terrainAt(point.x, point.z);
    const level = Math.max(endRiverLevel, Math.min(gradLevel, ground - 1.2, previousRiverLevel - 0.4));
    previousRiverLevel = level;
    return { ...point, level: Math.round(level * 4) / 4 };
  });

  const riverSamples = [];
  for (let segment = 0; segment < riverPath.length - 1; segment++) {
    const a = riverPath[segment], b = riverPath[segment + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 3);
    for (let i = (segment === 0 ? 0 : 1); i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t + Math.sin(t * Math.PI) * 0.8;
      const z = a.z + (b.z - a.z) * t;
      const level = Math.round((a.level + (b.level - a.level) * t) * 4) / 4;
      riverSamples.push({ x, z, level });
    }
  }

  // Proximity merging: if a river runs near a lake or pond, merge them with a
  // natural connecting tributary/channel so there is no awkward dry gap.
  for (const body of [...lakeSpecs, ...pondSpecs]) {
    let nearestRiv = null;
    let minD = Infinity;
    for (const s of riverSamples) {
      const d = Math.hypot((s.x - body.x) / body.rx, (s.z - body.z) / body.rz);
      if (d < minD) { minD = d; nearestRiv = s; }
    }
    if (nearestRiv && minD < 1.95) {
      // Body is within merging proximity: bridge them with a connecting water channel
      const ang = Math.atan2((nearestRiv.z - body.z) / body.rz, (nearestRiv.x - body.x) / body.rx);
      const edgeX = body.x + Math.cos(ang) * body.rx;
      const edgeZ = body.z + Math.sin(ang) * body.rz;
      const connSteps = Math.ceil(Math.hypot(nearestRiv.x - edgeX, nearestRiv.z - edgeZ) * 3);
      // Synchronize water levels so the junction is smooth
      body.level = Math.min(body.level, nearestRiv.level);
      for (let ci = 0; ci <= connSteps; ci++) {
        const ct = ci / (connSteps || 1);
        const cx = edgeX + (nearestRiv.x - edgeX) * ct;
        const cz = edgeZ + (nearestRiv.z - edgeZ) * ct;
        const clevel = Math.round((body.level + (nearestRiv.level - body.level) * ct) * 4) / 4;
        riverSamples.push({ x: cx, z: cz, level: clevel });
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          const px = Math.round(cx) + dx, pz = Math.round(cz) + dz;
          if (px > 1 && pz > 1 && px < WIDTH - 2 && pz < HEIGHT - 2) {
            const cell = pz * WIDTH + px;
            waterCells.add(cell);
            waterSurface[cell] = clevel;
          }
        }
      }
    }
  }

  // per-sample half-width — the old stream stamp is the minimum; courses swell
  // via the same world-space noise world.mjs uses so seam widths match
  for (const s of riverSamples) {
    s.w = 1.9 + 1.5 * noise(s.x, s.z, 140, seed + 9193);
  }

  // Populate river water cells
  for (let i = 0; i < riverSamples.length; i += 2) {
    const sample = riverSamples[i];
    const centerX = Math.round(sample.x), centerZ = Math.round(sample.z);
    const halfW = (sample.w || 1.9) + 0.1;
    const maxR2 = halfW * halfW;
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dz * dz > maxR2) continue;
      const x = centerX + dx, z = centerZ + dz;
      if (x < 1 || z < 1 || x >= WIDTH - 1 || z >= HEIGHT - 1) continue;
      const cell = z * WIDTH + x;
      if (!waterCells.has(cell) || sample.level < waterSurface[cell]) {
        waterCells.add(cell);
        waterSurface[cell] = sample.level;
      }
    }
  }

  // Deform terrain for water bodies and rivers: carves riverbed and ravine down mountain slopes
  const allWaterBodies = [...lakeSpecs, ...pondSpecs];
  for (let z = 0; z <= HEIGHT; z++) for (let x = 0; x <= WIDTH; x++) {
    const at = z * (WIDTH + 1) + x;
    for (const body of allWaterBodies) {
      const distance = Math.hypot((x - body.x) / body.rx, (z - body.z) / body.rz);
      if (distance > 1.45) continue;
      const maxDepth = body.kind === 'pond' ? 1.5 : 2.2;
      const bed = body.level - maxDepth + Math.pow(Math.min(1, distance), 2) * (maxDepth - 0.4);
      const bank = body.level + 0.8 * Math.sin(Math.min(1, (distance - 1.0) / 0.45) * (Math.PI / 2));
      const target = distance <= 1.0 ? bed : bank;
      const shoreBlend = smooth(Math.max(0, Math.min(1, (1.45 - distance) / 0.45)));
      heights[at] += (Math.min(heights[at], target) - heights[at]) * shoreBlend;
    }

    let nearest = Infinity, riverLevel = null, riverW = 1.9;
    for (const sample of riverSamples) {
      const distance = Math.hypot(x - sample.x, z - sample.z);
      if (distance < nearest) { nearest = distance; riverLevel = sample.level; riverW = sample.w || 1.9; }
      if (nearest < 0.2) break;
    }
    if (nearest < 7.0 && riverLevel !== null) {
      const riverBed = riverLevel - (1.0 + 0.2 * riverW) + Math.min(1, nearest / riverW) * 0.4;
      const riverBank = riverLevel + 0.35 + (nearest - riverW) * 1.0;
      const target = nearest <= riverW ? riverBed : riverBank;
      const blend = smooth(Math.max(0, Math.min(1, (7.0 - nearest) / 5.5)));
      heights[at] += (Math.min(heights[at], target) - heights[at]) * blend;
    }
  }

  // Bridge generation: find the road crossing over the river, orient the bridge
  // along the road perpendicular to the river, and level the roadway across banks.
  const bridgeCells = [];
  const bridgeCellSet = new Set();
  const rawCrossings = [];
  for (const cell of roadCells) {
    if (waterCells.has(cell)) {
      rawCrossings.push({ x: cell % WIDTH, z: Math.floor(cell / WIDTH) });
    }
  }

  if (rawCrossings.length > 0) {
    const avgX = rawCrossings.reduce((sum, c) => sum + c.x, 0) / rawCrossings.length;
    const avgZ = rawCrossings.reduce((sum, c) => sum + c.z, 0) / rawCrossings.length;
    // Road direction across river (west road from town 56,55 to 12,54)
    const rdx = 12 - 56, rdz = 54 - 55;
    const rotY = Math.atan2(rdx, rdz);
    // size the span to the actual crossing cluster so a wide river section
    // still gets a deck that reaches both banks
    let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
    for (const c of rawCrossings) {
      const lx2 = c.x - avgX, lz2 = c.z - avgZ;
      const rlx = lx2 * Math.cos(-rotY) - lz2 * Math.sin(-rotY);
      const rlz = lx2 * Math.sin(-rotY) + lz2 * Math.cos(-rotY);
      xMin = Math.min(xMin, rlx); xMax = Math.max(xMax, rlx);
      zMin = Math.min(zMin, rlz); zMax = Math.max(zMax, rlz);
    }
    const bridgeWidth = Math.max(2.4, xMax - xMin + 1.8);   // roadway ≥ 12 ft
    const bridgeLength = Math.max(5.2, zMax - zMin + 2.8);  // span reaches both banks
    const bridgeSpanCells = Math.ceil(bridgeLength / 2) + 1;

    // Clear water and mark solid roadway under the entire bridge footprint
    for (let dz = -bridgeSpanCells; dz <= bridgeSpanCells; dz++) {
      for (let dx = -bridgeSpanCells; dx <= bridgeSpanCells; dx++) {
        const bx = Math.round(avgX) + dx, bz = Math.round(avgZ) + dz;
        if (bx >= 0 && bx < WIDTH && bz >= 0 && bz < HEIGHT) {
          // Check if within oriented bridge box
          const localX = (bx - avgX) * Math.cos(-rotY) - (bz - avgZ) * Math.sin(-rotY);
          const localZ = (bx - avgX) * Math.sin(-rotY) + (bz - avgZ) * Math.cos(-rotY);
          if (Math.abs(localX) <= bridgeWidth / 2 + 0.6 && Math.abs(localZ) <= bridgeLength / 2 + 0.6) {
            const bcell = bz * WIDTH + bx;
            waterCells.delete(bcell);
            waterSurface[bcell] = null;
            bridgeCellSet.add(bcell);
            roadCells.add(bcell);
          }
        }
      }
    }

    // Smoothly level the terrain under the bridge road corridor across east and west approaches
    const eastApproach = terrainAt(Math.round(avgX + 4), Math.round(avgZ));
    const westApproach = terrainAt(Math.round(avgX - 4), Math.round(avgZ));
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const vx = Math.round(avgX) + dx, vz = Math.round(avgZ) + dz;
        if (vx >= 0 && vx <= WIDTH && vz >= 0 && vz <= HEIGHT) {
          const t = (dx + 3) / 6;
          const roadHeight = westApproach + (eastApproach - westApproach) * t;
          const at = vz * (WIDTH + 1) + vx;
          heights[at] = Math.max(heights[at], roadHeight);
        }
      }
    }

    bridgeCells.push({
      x: avgX + 0.5,
      z: avgZ + 0.5,
      type: 'bridge',
      width: bridgeWidth,
      length: bridgeLength,
      rotY,
      scale: 1.0,
    });
  }

  // Wide-road sweep: disc-stamped roads can graze pond rims, lake edges and
  // riverbanks outside the bridge corridor. Roads never sit on water (bridge
  // cells were already de-watered above, so they survive this pass) — strip
  // any leftover water-road cells so the road narrows to the bank instead.
  for (const cell of [...roadCells]) {
    if (waterCells.has(cell)) roadCells.delete(cell);
  }

  // Ensure gradual grades across the entire terrain mesh (<= 4.2 ft step)
  // (re-runnable: the town pad flatten happens later and needs a final sweep)
  const enforceGradualGrades = () => {
  for (let iter = 0; iter < 8; iter++) {
    for (let z = 0; z <= HEIGHT; z++) {
      for (let x = 0; x <= WIDTH; x++) {
        const at = z * (WIDTH + 1) + x;
        if (x > 0) {
          const left = at - 1;
          const diff = heights[at] - heights[left];
          if (diff > 4.2) heights[at] = heights[left] + 4.2;
          else if (diff < -4.2) heights[left] = heights[at] + 4.2;
        }
        if (z > 0) {
          const up = at - (WIDTH + 1);
          const diff = heights[at] - heights[up];
          if (diff > 4.2) heights[at] = heights[up] + 4.2;
          else if (diff < -4.2) heights[up] = heights[at] + 4.2;
        }
      }
    }
  }
  };
  enforceGradualGrades();

  // Ensure center of lakes and ponds remain depressed below water level
  // (re-runnable: the town pad flatten happens later and can raise beds)
  const depressWaterBodyCenters = () => {
  for (const body of allWaterBodies) {
    const cx = Math.round(body.x), cz = Math.round(body.z);
    const maxCenterGround = body.level - 0.4;
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) {
      const at = (cz + dz) * (WIDTH + 1) + (cx + dx);
      if (heights[at] > maxCenterGround) heights[at] = maxCenterGround;
    }
  }
  };
  depressWaterBodyCenters();

  // Shoreline water surface safety clamp (re-runnable: the town pad flatten
  // happens later and can raise banks, so the clamp runs again after it)
  const clampShorelineSurfaces = () => {
  for (const cell of waterCells) {
    const x = cell % WIDTH, z = Math.floor(cell / WIDTH);
    const ground = (
      heights[z * (WIDTH + 1) + x] +
      heights[z * (WIDTH + 1) + x + 1] +
      heights[(z + 1) * (WIDTH + 1) + x] +
      heights[(z + 1) * (WIDTH + 1) + x + 1]
    ) / 4;
    if (waterSurface[cell] > ground + 1.95) {
      waterSurface[cell] = ground + 1.95;
    }
    const shoreline = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ].some(([dx, dz]) => !waterCells.has((z + dz) * WIDTH + x + dx));
    if (shoreline) {
      waterSurface[cell] = Math.min(waterSurface[cell], ground - 0.18);
    }
  }
  };
  clampShorelineSurfaces();

  const gate = { x: 58, z: 82 };
  const props = [];
  const clusters = [];
  const roads = [];
  const waterList = [...waterCells].sort((a, b) => a - b);
  const roadList = [...roadCells].sort((a, b) => a - b);

  const addProp = (type, x, z, options = {}) => {
    props.push({ type, x, z, ...options });
  };

  // Town lots are GENERATED (P3.8): the shared layout module enforces the
  // variant rules (grid/crescent/scattered), yard spacing, road/plaza yaw
  // alignment and water exclusion, then flattenTownFootprint pads the terrain
  // under every building so nothing floats. A DEDICATED rng stream keeps every
  // existing seeded draw sequence (clusters/erratics below) bit-identical.
  const townRng = mulberry32((seed ^ 0x70bd) >>> 0);
  const townSurvey = {
    // 3-arg contract from townLayout: kind 'water' = strict check (hard
    // blocker), kind 'road' = inset-lattice check (buildings may front road
    // edges), 2-arg = strict both (plaza/well placement).
    blocked: (x, z, kind) => {
      const cx = Math.floor(x), cz = Math.floor(z);
      if (cx < 2 || cz < 2 || cx >= WIDTH - 2 || cz >= HEIGHT - 2) return true;
      const cell = cz * WIDTH + cx;
      if (waterCells.has(cell)) return true;
      if (kind === 'water') return false;
      return roadCells.has(cell);
    },
    inBounds: (x, z) => x > 2 && z > 2 && x < WIDTH - 2 && z < HEIGHT - 2,
    heightAt: (x, z) => heights[Math.max(0, Math.min(HEIGHT, Math.round(z))) * (WIDTH + 1) + Math.max(0, Math.min(WIDTH, Math.round(x)))],
  };
  // grid axis follows the west road (the settlement's oldest street)
  const town = layoutTown({
    rng: townRng, cx: townCenter.x, cz: townCenter.z,
    roadDir: { x: 12 - 56, z: 54 - 55 }, survey: townSurvey,
  });
  if (!town) throw new Error('home town layout failed for this seed');
  const innBuilding = town.buildings.find((b) => b.variant === 'inn');
  if (innBuilding) innBuilding.label = 'The Ember & Ash'; // home keeps its name
  for (const b of town.buildings) addProp('building', b.x, b.z, b);
  addProp('well', town.well.x, town.well.z, { clusterId: 'town-center' });
  for (const l of town.lanterns) addProp('street_lantern', l.x, l.z, { clusterId: 'town-center' });
  clusters.push({ id: 'town-center', rule: 'town_center', biome: 'town', x: 56, z: 55, radius: 13 });
  // Terrain under the town is final here (water carve, bridge leveling, slope
  // relax and shoreline clamps are all done) — pads cannot bury shorelines
  // because the survey keeps footprints clear of water cells.
  flattenTownFootprint(heights, WIDTH + 1, town, { vertexH: HEIGHT + 1 });
  // Final grade sweep — the comment above always promised one. The pad relax
  // inside flattenTownFootprint oscillates when a pad sits close to a steep
  // shore: the pinned pad and the deep lake bed leave too few free vertices
  // between them, so the ring ping-pongs and a >4.2 ft cliff survives (seen
  // at a lakeside pad: 25.8 pad vs 14.4 shore with one ring vertex).
  // Pad interiors are PINNED here too — buildings need exactly flat pads —
  // and the iteration count is raised so shore vertices can climb to the
  // pad instead of leaving a cliff at the blend shell.
  {
    const padZones = town.buildings.map((b) => {
      const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
      return { cx: b.x, cz: b.z, c, s, hx: b.width / 2 + 0.55, hz: b.depth / 2 + 0.55 };
    });
    const pinGrid = new Uint8Array((WIDTH + 1) * (HEIGHT + 1));
    for (let z = 0; z <= HEIGHT; z++) for (let x = 0; x <= WIDTH; x++) {
      for (const p of padZones) {
        const wx = x - p.cx, wz = z - p.cz;
        const lx = wx * p.c - wz * p.s, lz = wx * p.s + wz * p.c;
        if (Math.abs(lx) <= p.hx && Math.abs(lz) <= p.hz) { pinGrid[z * (WIDTH + 1) + x] = 1; break; }
      }
    }
    for (let iter = 0; iter < 24; iter++) {
      for (let z = 0; z <= HEIGHT; z++) {
        for (let x = 0; x <= WIDTH; x++) {
          const at = z * (WIDTH + 1) + x;
          const aPin = pinGrid[at];
          if (x > 0) {
            const left = at - 1, lPin = pinGrid[left];
            if (!(aPin && lPin)) {
              const diff = heights[at] - heights[left];
              if (diff > 4.2) { if (!aPin) heights[at] = heights[left] + 4.2; else heights[left] = heights[at] - 4.2; }
              else if (diff < -4.2) { if (!aPin) heights[at] = heights[left] - 4.2; else heights[left] = heights[at] + 4.2; }
            }
          }
          if (z > 0) {
            const up = at - (WIDTH + 1), uPin = pinGrid[up];
            if (!(aPin && uPin)) {
              const diff = heights[at] - heights[up];
              if (diff > 4.2) { if (!aPin) heights[at] = heights[up] + 4.2; else heights[up] = heights[at] - 4.2; }
              else if (diff < -4.2) { if (!aPin) heights[at] = heights[up] - 4.2; else heights[up] = heights[at] + 4.2; }
            }
          }
        }
      }
    }
  }
  clampShorelineSurfaces(); // town pads can raise banks above the water surface
  depressWaterBodyCenters(); // town pads can raise pond/lake beds
  const townService = (variant) => town.buildings.find((b) => b.variant === variant);

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
      const isNearWater = Math.hypot(px - 18, pz - 26) < 14 || Math.hypot(px - 32, pz - 70) < 14 || Math.hypot(px - 28, pz - 43) < 14 || Math.hypot(px - 75, pz - 62) < 14;
      // Seasonal gating: the kit's TwistedTree renders deep crimson (autumn
      // read), so the legacy 'willow' variant no longer spawns. Meadows stay
      // fully green (oak/ash both render the green CommonTree pool); autumn
      // maples are rare accents reserved for forests and riverside stands.
      // Stream discipline: every branch consumes EXACTLY as many rng() draws
      // as the old ternary chain (0/0/1/1/1/1) and the general branch reuses
      // its single draw for both the autumn roll and the species pick, so the
      // deterministic seeded layouts (rock/twig/spawn positions downstream)
      // do not shift by a single step — only the variant labels change.
      let treeVariant;
      if (biome === 'deadlands') treeVariant = 'dead';
      else if (biome === 'snow_forest') treeVariant = 'snowpine';
      else if (biome === 'mountains') treeVariant = rng() < 0.25 ? 'birch' : 'pine';
      else if (biome === 'meadow') treeVariant = rng() < 0.65 ? 'oak' : 'ash';
      else if (rule === 'willow-stand' || isNearWater) treeVariant = rng() < 0.6 ? 'autumn' : 'oak';
      else {
        const r = rng();
        treeVariant = r < 0.12
          ? 'autumn'
          : ['oak', 'pine', 'ash', 'birch'][Math.min(3, Math.floor((r - 0.12) / 0.88 * 4))];
      }
      const scale = type === 'tree' ? 0.8 + rng() * 2.2
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

  makeCluster('western-oak-groves', 'forest', 20, 23, 14, 'grove-with-undergrowth', 38, ['tree', 'tree', 'fern', 'twig', 'rock']);
  makeCluster('western-meadow-patches', 'meadow', 27, 66, 17, 'grass-and-wildflowers', 72, ['wildflower', 'grass', 'grass', 'wildflower', 'grass', 'rock', 'wildflower', 'grass', 'tree']);
  makeCluster('river-willow-stand', 'meadow', 34, 52, 14, 'willow-stand', 36, ['wildflower', 'grass', 'grass', 'rock', 'wildflower', 'grass', 'tree']);
  makeCluster('southern-meadow-pastures', 'meadow', 82, 74, 15, 'grass-and-wildflowers', 44, ['wildflower', 'grass', 'grass', 'wildflower', 'grass', 'rock', 'tree']);
  makeCluster('mountain-boulder-fields', 'mountains', 61, 18, 16, 'rockfall-pockets', 62, ['boulder', 'boulder', 'rock', 'tree', 'scree']);
  makeCluster('eastern-high-pines', 'mountains', 91, 34, 13, 'scree-and-pine', 46, ['boulder', 'rock', 'tree', 'scree']);

  // rare glacial erratics: round boulders dot the home meadows at minimal
  // density (same rule/salts as neighbor regions so the field is world-anchored)
  let erraticCount = 0;
  for (let z = 2; z < HEIGHT - 2 && erraticCount < 4; z += 3) {
    for (let x = 2; x < WIDTH - 2 && erraticCount < 4; x += 3) {
      const cell = z * WIDTH + x;
      if (biomeCells[cell] !== biomeIndex.meadow || waterCells.has(cell) || roadCells.has(cell)) continue;
      if (Math.hypot(x - townCenter.x, z - townCenter.z) < 18) continue;
      if (hash2(x, z, 9613) <= 0.9925) continue;
      const px = x + 0.5 + (hash2(x, z, 9617) - 0.5) * 1.6;
      const pz = z + 0.5 + (hash2(z, x, 9619) - 0.5) * 1.6;
      const pc = Math.floor(pz) * WIDTH + Math.floor(px);
      if (waterCells.has(pc) || roadCells.has(pc)) continue;
      addProp('boulder', px, pz, {
        scale: 1.1 + hash2(x, z, 9623) * 0.9, shape: 'round',
        rotY: hash2(x, z, 9629) * Math.PI * 2, clusterId: 'meadow-erratic',
      });
      erraticCount++;
    }
  }

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

  // Scatter shoreline rocks and rounded river pebbles along riverbanks and lake shores
  for (let i = 0; i < riverSamples.length; i += 3) {
    const s = riverSamples[i];
    for (const side of [-1, 1]) {
      if (hash2(i, side, 311) < 0.38) {
        const dist = (s.w || 1.9) + 0.4 + hash2(i, side, 419) * 1.2;
        const rx = s.x + Math.cos(side * 1.57) * dist;
        const rz = s.z + Math.sin(side * 1.57) * dist;
        const cell = Math.floor(rz) * WIDTH + Math.floor(rx);
        if (!waterCells.has(cell) && !roadCells.has(cell) && !bridgeCellSet.has(cell) &&
            rx > 2 && rz > 2 && rx < WIDTH - 2 && rz < HEIGHT - 2) {
          addProp('rock', rx, rz, {
            scale: 0.45 + hash2(i, side, 521) * 0.5,
            shape: 'slab',
            variant: 'river_stone',
            clusterId: 'river-bank',
          });
        }
      }
    }
  }
  for (const lake of lakeSpecs) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + hash2(i, 7, 613) * 0.4;
      const dist = 1.08 + hash2(i, 11, 719) * 0.22;
      const lx = lake.x + Math.cos(ang) * (lake.rx * dist);
      const lz = lake.z + Math.sin(ang) * (lake.rz * dist);
      const cell = Math.floor(lz) * WIDTH + Math.floor(lx);
      if (!waterCells.has(cell) && !roadCells.has(cell) && !bridgeCellSet.has(cell) &&
          lx > 2 && lz > 2 && lx < WIDTH - 2 && lz < HEIGHT - 2) {
        addProp('rock', lx, lz, {
          scale: 0.4 + hash2(i, 13, 821) * 0.5,
          shape: 'slab',
          variant: 'river_stone',
          clusterId: 'lake-shore',
        });
      }
    }
  }

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
      if (waterCells.has(cell) || roadCells.has(cell) || bridgeCellSet.has(cell) || blocked.has(cell)) continue;
      // Guard bridge road approaches from water half-tiles
      let nearBridge = false;
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (bridgeCellSet.has((z + dz) * WIDTH + (x + dx))) nearBridge = true;
      }
      if (nearBridge) continue;

      const isWaterNeighbor = (k) => waterCells.has(k) && !bridgeCellSet.has(k);
      const nW = isWaterNeighbor((z - 1) * WIDTH + x);
      const sW = isWaterNeighbor((z + 1) * WIDTH + x);
      const wW = isWaterNeighbor(z * WIDTH + x - 1);
      const eW = isWaterNeighbor(z * WIDTH + x + 1);

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
      { id: 'ember-and-ash', kind: 'inn', label: 'The Ember & Ash', x: townService('inn').x, z: townService('inn').z },
      { id: 'general-store', kind: 'general_store', label: 'General Store', x: townService('general_store').x, z: townService('general_store').z },
      { id: 'bent-nail', kind: 'smithy', label: 'The Bent Nail', x: townService('smithy').x, z: townService('smithy').z },
      { id: 'hearth-remedy', kind: 'healer', label: 'Hearth & Remedy', x: townService('healer').x, z: townService('healer').z },
      { id: 'crypt-cemetery', kind: 'graveyard', label: 'Ashen Cemetery', x: gate.x, z: gate.z, exitId: 'cellar-crypt' },
      { id: 'west-road-ruins', kind: 'ruins', label: 'The Old Watch', x: 12, z: 54 },
      { id: 'eastern-caves', kind: 'cave', label: 'The Blackstone Mouth', x: 91, z: 34 },
    ],
    metadata: {
      townCenter,
      // P3.8: layout record. cx/cz are the PLAZA the layout recentered to —
      // yaw rules face the plaza, not the historical townCenter.
      town: { variant: town.variant, axis: { ...town.axis }, cx: town.cx, cz: town.cz },
      water: { lakes: lakeSpecs, ponds: pondSpecs, river: riverPath },
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

// Water is walkable by design (shallow fords): only walls block cell movement.
export function isOverworldCellWalkable(map, x, z) {
  const { w, h } = map?.size || {};
  if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x >= w || z >= h) return false;
  const blocked = new Set((map.cells?.wall || [])
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
  if (wallCells.has(cz * w + cx)) return false;

  const u = (worldX - cx * CELL_FT) / CELL_FT;
  const v = (worldZ - cz * CELL_FT) / CELL_FT;

  for (const cell of (map.cells?.wall || [])) {
    if (cell[0] === cx && cell[1] === cz && cell[2]) {
      if (isPointInHalfTile(u, v, cell[2])) return false;
    }
  }
  for (const h of map.cells?.halfTiles || []) {
    if (h.x === cx && h.z === cz && h.type === 'wall') {
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
  // water is walkable by design (shallow fords) — no blocked-water assertion
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
  if ((map?.metadata?.water?.ponds || []).some((pond) => pond.level > 20)) {
    errors.push('ponds must sit in lowland basins');
  }
  if (biomes?.cells?.length !== width * height) errors.push('biome field has the wrong size');
  if (new Set(biomes?.cells || []).size < 4) errors.push('world is missing biome variety');
  if (!spawns?.party?.[0] ||
      !isOverworldCellWalkable(map, Math.floor(spawns.party[0][0]), Math.floor(spawns.party[0][1]))) {
    errors.push('town party spawn must be on walkable land');
  }
  if (!exits?.some((exit) => exit.destinationMapId === 'ashen_cellar')) errors.push('world must have a crypt entrance');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'inn')) errors.push('town is missing its inn');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'general_store')) errors.push('town is missing its store');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'smithy')) errors.push('town is missing its smithy');
  if (!props?.some((prop) => prop.type === 'building' && prop.variant === 'healer')) errors.push('town is missing its healer');
  // ── P3.8 town construction rules ────────────────────────────────────────
  const townBuildings = (props || []).filter((p) => p.type === 'building' && p.width && p.depth);
  const townMeta = map?.metadata?.town;
  if (townMeta && townBuildings.length) {
    const townObj = {
      variant: townMeta.variant,
      cx: townMeta.cx ?? map.metadata.townCenter?.x,
      cz: townMeta.cz ?? map.metadata.townCenter?.z,
      axis: townMeta.axis,
    };
    if (!TOWN_VARIANTS.includes(townMeta.variant)) errors.push(`town variant ${townMeta.variant} is not a layout rule`);
    const heightAtV = (x, z) => {
      const vx = Math.max(0, Math.min(width, Math.round(x)));
      const vz = Math.max(0, Math.min(height, Math.round(z)));
      return terrain?.heightFt?.[vz * (width + 1) + vx];
    };
    for (let i = 0; i < townBuildings.length; i++) {
      const b = townBuildings[i];
      // true ORIENTED corners (rotated local rect) — the pad flattens the
      // oriented footprint, and the water sweep clears the oriented footprint
      const bc = Math.cos(b.rotY || 0), bs = Math.sin(b.rotY || 0);
      const orientedCorners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([ux, uz]) => ({
        x: b.x + (b.width / 2) * ux * bc + (b.depth / 2) * uz * bs,
        z: b.z - (b.width / 2) * ux * bs + (b.depth / 2) * uz * bc,
      }));
      for (const c of orientedCorners) {
        if (water.has(key(Math.floor(c.x), Math.floor(c.z)))) {
          errors.push(`building ${b.variant} footprint crosses water at ${Math.floor(c.x)},${Math.floor(c.z)}`);
        }
      }
      // never floats: the terrain across the footprint is the flat pad
      const hs = orientedCorners.map((c) => heightAtV(c.x, c.z));
      if (hs.some((h) => typeof h !== 'number')) errors.push(`building ${b.variant} has no terrain under a corner`);
      else if (Math.max(...hs) - Math.min(...hs) > 1.5) {
        errors.push(`building ${b.variant} sits on unflat ground (${(Math.max(...hs) - Math.min(...hs)).toFixed(2)} ft)`);
      }
      if (!yawAligned(b, townObj)) errors.push(`building ${b.variant} yaw violates the ${townMeta.variant} alignment rule`);
      for (let j = i + 1; j < townBuildings.length; j++) {
        const gap = rectGap(b, townBuildings[j]);
        if (gap >= 0 && gap < TOWN_RULES.MIN_YARD_GAP - 1e-6) {
          errors.push(`buildings ${b.variant}/${townBuildings[j].variant} yard gap ${gap.toFixed(2)} < ${TOWN_RULES.MIN_YARD_GAP}`);
        }
      }
    }
  }
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
