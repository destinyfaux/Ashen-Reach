// ASHENREACH — server/src/maps/worldGrandLakes.mjs
// Grand Lakes system: multi-region freshwater seas, asymmetric shorelines,
// depth tiers, islands, and river deltas.

import { REGION_W, REGION_H } from './world.mjs';

function hash2(x, z, salt) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) +
    Math.imul(salt | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const GRAND_LAKE_NAMES = [
  "The Drowned Crown",
  "Mother's Mirror",
  "The Weeping Waters",
  "The Tarn of Glass",
  "Lake of the Sunken Bell",
  "The Whispering Mere",
  "The Abyssal Eye",
  "Mirror of the First Dawn",
];

const SHORE_TYPES = ['rocky', 'sandy', 'marshy', 'forested', 'volcanic'];

/**
 * Returns angular radius perturbation for organic bays and peninsulas.
 */
export function grandLakeRadiusScale(angle, salt) {
  const s1 = Math.sin(angle * 2.0 + hash2(salt, 1, 101) * 6.28) * 0.12;
  const s2 = Math.cos(angle * 3.0 + hash2(salt, 2, 202) * 6.28) * 0.08;
  const s3 = Math.sin(angle * 5.0 + hash2(salt, 3, 303) * 6.28) * 0.04;
  return 1.0 + s1 + s2 + s3;
}

/**
 * Distance ratio to the grand lake boundary (accounting for harmonics).
 * < 1.0 is inside water, 1.0 is the shoreline, > 1.0 is land.
 */
export function grandLakeDistance(lake, gx, gz) {
  const dx = gx - lake.x;
  const dz = gz - lake.z;
  const angle = Math.atan2(dz, dx);
  const harm = grandLakeRadiusScale(angle, lake.salt || 77);
  const effRx = lake.rx * harm;
  const effRz = lake.rz * harm;
  const qx = dx / effRx;
  const qz = dz / effRz;
  return Math.hypot(qx, qz);
}

/**
 * Depth tier:
 *  - 'deep' (< 0.65 from center, away from shore)
 *  - 'shelf' (0.65 to 0.88, shallow water)
 *  - 'shore' (0.88 to 1.05, water edge)
 */
export function grandLakeDepthTier(lake, gx, gz) {
  const d = grandLakeDistance(lake, gx, gz);
  if (d > 1.02) return null;
  if (d < 0.65) return 'deep';
  if (d < 0.88) return 'shelf';
  return 'shore';
}

/**
 * Returns the shore type for a point near the grand lake shore.
 */
export function grandLakeShoreType(lake, gx, gz) {
  if (!lake.sectors || !lake.sectors.length) return 'sandy';
  let angle = Math.atan2(gz - lake.z, gx - lake.x);
  if (angle < 0) angle += Math.PI * 2;
  for (const s of lake.sectors) {
    if (angle >= s.angleStart && angle < s.angleEnd) return s.shoreType;
  }
  return lake.sectors[0].shoreType || 'sandy';
}

/**
 * Checks if a point lies on an island within the grand lake.
 */
export function isGrandLakeIsland(lake, gx, gz) {
  if (!lake.islands || !lake.islands.length) return null;
  for (const isl of lake.islands) {
    const dx = (gx - isl.x) / isl.rx;
    const dz = (gz - isl.z) / isl.rz;
    if (dx * dx + dz * dz <= 1.0) return isl;
  }
  return null;
}

/**
 * Deterministic basin search for 1-2 grand lakes far from home.
 */
export function buildGrandLakes({
  seed,
  elevationAt,
  mountainAt,
  volcanicAt,
  swampAt,
  forestAt,
}) {
  const grandLakes = [];
  const candidateRegions = [];

  for (let rz = -7; rz <= 7; rz++) {
    for (let rx = -7; rx <= 7; rx++) {
      const distHome = Math.max(Math.abs(rx), Math.abs(rz));
      if (distHome < 4) continue; // never in ring 0..3 (safely far from home)
      const roll = hash2(rx * 19 + 7, rz * 23 + 11, seed ^ 0x4f8a);
      if (roll > 0.16) continue;

      const cx = rx * REGION_W + REGION_W / 2;
      const cz = rz * REGION_H + REGION_H / 2;
      const mWeight = mountainAt ? mountainAt(cx, cz) : 0;
      if (mWeight > 0.45) continue; // not directly on top of mountain crests

      const e = elevationAt(cx, cz);
      if (e > 32) continue; // lowland basin only

      candidateRegions.push({ rx, rz, cx, cz, roll, e });
    }
  }

  candidateRegions.sort((a, b) => a.roll - b.roll);

  let lakeIndex = 0;
  for (const cand of candidateRegions) {
    if (grandLakes.length >= 2) break;
    let tooClose = false;
    for (const existing of grandLakes) {
      if (Math.hypot(existing.x - cand.cx, existing.z - cand.cz) < 550) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Survey surrounding rim
    const rx = 125 + hash2(cand.cx, cand.cz, seed + 801) * 45; // ~125-170 cells (625-850 ft radius)
    const rz = 95 + hash2(cand.cz, cand.cx, seed + 803) * 35;  // ~95-130 cells (475-650 ft radius)

    let rimMin = Infinity;
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const sx = cand.cx + Math.cos(ang) * rx * 1.25;
      const sz = cand.cz + Math.sin(ang) * rz * 1.25;
      rimMin = Math.min(rimMin, elevationAt(sx, sz));
    }
    if (rimMin < 3.8) continue;

    const surfaceLevel = Math.round(Math.max(2.6, Math.min(cand.e - 1.2, rimMin - 1.5)) * 4) / 4;
    const name = GRAND_LAKE_NAMES[lakeIndex % GRAND_LAKE_NAMES.length];
    const salt = (hash2(cand.cx, cand.cz, seed + 809) * 0x7fffffff) | 0;

    // Build 6 asymmetric shoreline sectors based on surrounding terrain
    const sectors = [];
    const numSectors = 6;
    for (let i = 0; i < numSectors; i++) {
      const angleStart = (i / numSectors) * Math.PI * 2;
      const angleEnd = ((i + 1) / numSectors) * Math.PI * 2;
      const midAngle = (angleStart + angleEnd) / 2;
      const probeX = cand.cx + Math.cos(midAngle) * rx * 1.15;
      const probeZ = cand.cz + Math.sin(midAngle) * rz * 1.15;

      const m = mountainAt ? mountainAt(probeX, probeZ) : 0;
      const v = volcanicAt ? volcanicAt(probeX, probeZ) : 0;
      const s = swampAt ? swampAt(probeX, probeZ) : 0;
      const f = forestAt ? forestAt(probeX, probeZ) : 0;

      let shoreType = 'sandy';
      if (v > 0.45) shoreType = 'volcanic';
      else if (m > 0.32) shoreType = 'rocky';
      else if (s > 0.35) shoreType = 'marshy';
      else if (f > 0.48) shoreType = 'forested';
      else shoreType = 'sandy';

      sectors.push({ angleStart, angleEnd, shoreType });
    }

    // 1-2 small scenic islands
    const islands = [];
    const numIslands = 1 + (hash2(cand.cx, cand.cz, seed + 811) > 0.4 ? 1 : 0);
    for (let islIdx = 0; islIdx < numIslands; islIdx++) {
      const islAng = islIdx * 2.8 + hash2(islIdx, cand.cx, seed + 813) * 1.8;
      const islDist = 0.32 + hash2(islIdx, cand.cz, seed + 815) * 0.28;
      const ix = Math.round(cand.cx + Math.cos(islAng) * rx * islDist);
      const iz = Math.round(cand.cz + Math.sin(islAng) * rz * islDist);
      const irx = 9 + hash2(ix, iz, seed + 817) * 7;
      const irz = 7 + hash2(iz, ix, seed + 819) * 6;
      const islBiome = islIdx === 0 ? 'ruins' : 'forest';
      islands.push({
        id: `island-${lakeIndex}-${islIdx}`,
        x: ix, z: iz, rx: irx, rz: irz,
        level: surfaceLevel + 2.4,
        biome: islBiome,
      });
    }

    grandLakes.push({
      id: `grand-lake-${lakeIndex}`,
      name,
      x: cand.cx,
      z: cand.cz,
      rx,
      rz,
      level: surfaceLevel,
      kind: 'lake',
      big: true,
      grand: true,
      salt,
      sectors,
      islands,
    });
    lakeIndex++;
  }

  return grandLakes;
}
