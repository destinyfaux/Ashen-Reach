// tilegrid/terrain.ts — floor, water, roads, room-details build passes.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef } from '../types';
import { getTextureSet, hash2 } from '../materials';
import { CELL, normalizeHalfTile, dirtField } from './shared';

const ROOM_STONE = new THREE.MeshBasicMaterial({
  color: 0x9b8860, transparent: true, opacity: 0.28, depthWrite: false,
  side: THREE.DoubleSide
});

const BOSS_STONE = new THREE.MeshBasicMaterial({
  color: 0xb58a42, transparent: true, opacity: 0.36, depthWrite: false,
  side: THREE.DoubleSide
});

// ── procedural snow ground (Wave 1.5) ──────────────────────────────────────
// The snow biomes' floor used to be the grass texture brightened by tint —
// multiplying a green albedo can never read as white. Regions whose dominant
// biome is a snow biome swap to this procedural snow ground instead (drift
// mottling, wind streaks, sparkle); per-cell biome tints stay near-neutral on
// it. Cached once; only the map/bump slots buildFloor consumes are populated.
let snowFloorSet: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null;
function getSnowFloorSet(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  if (snowFloorSet) return snowFloorSet;
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create snow floor canvas');
  context.fillStyle = '#e3eaf3';
  context.fillRect(0, 0, 256, 256);
  // large soft mottles: wind-packed drifts lighter, shadowed patches bluer
  for (let i = 0; i < 46; i++) {
    const x = hash2(i, 3, 4301) * 256, y = hash2(i, 5, 4303) * 256;
    const r = 14 + hash2(i, 7, 4305) * 40;
    const light = hash2(i, 9, 4307) > 0.5;
    const g = context.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, light ? 'rgba(246,249,253,0.5)' : 'rgba(194,206,225,0.35)');
    g.addColorStop(1, 'rgba(227,234,243,0)');
    context.fillStyle = g;
    context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  }
  // gentle wind streaks
  context.strokeStyle = 'rgba(208,218,235,0.28)';
  for (let i = 0; i < 26; i++) {
    const y = hash2(i, 11, 4309) * 256;
    context.lineWidth = 1 + hash2(i, 13, 4311) * 3;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(
      80, y + (hash2(i, 15, 4313) - 0.5) * 26,
      170, y + (hash2(i, 17, 4315) - 0.5) * 26,
      256, y + (hash2(i, 19, 4317) - 0.5) * 18);
    context.stroke();
  }
  // sparkle
  for (let i = 0; i < 420; i++) {
    const x = hash2(i, 21, 4319) * 256, y = hash2(i, 23, 4321) * 256;
    context.fillStyle = `rgba(255,255,255,${0.25 + hash2(i, 25, 4323) * 0.45})`;
    context.fillRect(x, y, 1.4, 1.4);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  // soft gray-noise bump
  const bcanvas = document.createElement('canvas');
  bcanvas.width = 128; bcanvas.height = 128;
  const bcontext = bcanvas.getContext('2d');
  if (!bcontext) throw new Error('Unable to create snow bump canvas');
  bcontext.fillStyle = '#808080';
  bcontext.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 240; i++) {
    const x = hash2(i, 31, 4325) * 128, y = hash2(i, 33, 4327) * 128;
    const r = 2 + hash2(i, 35, 4329) * 7;
    const v = Math.floor(96 + hash2(i, 37, 4331) * 64);
    const g = bcontext.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
    g.addColorStop(1, 'rgba(128,128,128,0)');
    bcontext.fillStyle = g;
    bcontext.beginPath(); bcontext.arc(x, y, r, 0, Math.PI * 2); bcontext.fill();
  }
  const bump = new THREE.CanvasTexture(bcanvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  snowFloorSet = { map, bump };
  return snowFloorSet;
}

// ── floor: one plane, per-cell vertex-color variation + wall grime halos ──
// Snow ground is a PER-VERTEX BLEND now (user bug report: the snow biome
// met every neighbor as a harsh line — every other biome blends because they
// share the grass albedo and differ only by tint, but snow used to swap the
// whole region's texture). Each floor vertex carries a smoothed neighborhood
// snow weight, and the material crossfades biome albedo ↔ procedural snow
// in the fragment shader, so snowlines dissolve over ~15-25 ft like any
// other biome pair — inside regions and across seams alike.
export function buildFloor(grid: TileGrid, map: MapDef, wallSet: Set<number>) {
  const W = map.size.w, H = map.size.h;
  const floorSet = grid.areaTiles.floor;
  const kindsF = map.biomes?.kinds || [];
  const biomeCellsF = map.biomes?.cells || [];
  const isSnowBiome = (b: string | undefined) => b === 'snowfield' || b === 'snow_forest';
  // Per-corner snow weight: 4×4 cell neighborhood around the grid corner,
  // averaged, then smoothstepped so the snowline eases in instead of
  // stepping per cell. Corner-indexed (vertex order matches the loop below).
  const cornersSnow = new Float32Array(W * H * 4);
  if (biomeCellsF.length === W * H) {
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const corners = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let dz = -2; dz <= 1; dz++) for (let dx = -2; dx <= 1; dx++) {
          const sx = Math.min(W - 1, Math.max(0, corners[c][0] + dx));
          const sz = Math.min(H - 1, Math.max(0, corners[c][1] + dz));
          sum += isSnowBiome(kindsF[biomeCellsF[sz * W + sx]]) ? 1 : 0;
        }
        const raw = sum / 16;
        const t = Math.min(1, Math.max(0, (raw - 0.2) / 0.6));
        cornersSnow[(z * W + x) * 4 + c] = t * t * (3 - 2 * t);
      }
    }
  }
  let snowMax = 0;
  for (let i = 0; i < cornersSnow.length; i++) if (cornersSnow[i] > snowMax) snowMax = cornersSnow[i];
  const snowGround = !grid.indoor && snowMax > 0.001;
  const set = getTextureSet(floorSet.kind, floorSet.variant);
  const snowSet = snowGround ? getSnowFloorSet() : null;
  const repeatFt = floorSet.repeatFt;
  const floorRoughness = floorSet.roughness;
  const floorBumpScale = floorSet.bumpScale;
  const floorMetalness = floorSet.metalness;
  set.map.repeat.set((W * CELL) / repeatFt, (H * CELL) / repeatFt);
  set.bump.repeat.copy(set.map.repeat);
  const positions = new Float32Array(W * H * 4 * 3);
  const uvs = new Float32Array(W * H * 4 * 2);
  const colors = new Float32Array(W * H * 4 * 3);
  const indices = new Uint32Array(W * H * 6);
  // Out-of-bounds reads as a wall only indoors. Outdoor region maps are
  // stitched ring-less on both sides of every seam — treating the void as a
  // wall darkened a straight stripe along each region border, cutting across
  // lakes and fields alike.
  const wallAt = (x: number, z: number) =>
    x < 0 || z < 0 || x >= W || z >= H ? grid.indoor : wallSet.has(grid.key(x, z));
  const roadSet = new Set((map.cells.road || []).map(([x, z]) => grid.key(x, z)));
  const waterSet = new Set((map.cells.water || []).map(([x, z]) => grid.key(x, z)));
  // Cross-seam water halo: shoreline tinting keeps running past the border so
  // banks and lake beds do not show a bare stripe at region seams.
  for (const [hx, hz] of map.cells.waterHalo || []) waterSet.add(grid.key(hx, hz));
  for (const h of map.cells.halfTiles || []) {
    if (h.type === 'road') roadSet.add(grid.key(h.x, h.z));
    if (h.type === 'water') waterSet.add(grid.key(h.x, h.z));
  }
  const biomeTints: Record<string, [number, number, number]> = {
    forest: [0.78, 1.08, 0.78], meadow: [1.08, 1.12, 0.86],
    // snow tints near-neutral: the snow floor texture carries the white — the
    // old bright-green multipliers (1.45+) over grass albedo never read as snow
    snow_forest: [0.97, 1.01, 1.08], snowfield: [1.0, 1.04, 1.11],
    deadlands: [1.04, 0.91, 0.76], mountains: [1.12, 1.12, 1.1],
    town: [1.28, 1.16, 0.93], graveyard: [0.82, 0.96, 0.78],
    ruins: [0.88, 0.92, 0.8],
  };
  const terrainHeights = map.terrain?.heightFt || [];
  const terrainWidth = map.terrain?.width || 0;
  const heightAt = (x: number, z: number) => terrainWidth
    ? terrainHeights[z * terrainWidth + x] || 0 : 0;
  const kinds = map.biomes?.kinds || [];
  const biomeCells = map.biomes?.cells || [];
  // world cell origin so the dirt splat field is world-anchored (seamless)
  const orgX = map.worldOriginFt ? map.worldOriginFt.x / CELL : 0;
  const orgZ = map.worldOriginFt ? map.worldOriginFt.z / CELL : 0;

  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const q = z * W + x, vertex = q * 4, index = q * 6;
    const corners = [
      [x, z, 0, 0], [x + 1, z, 1, 0],
      [x, z + 1, 0, 1], [x + 1, z + 1, 1, 1],
    ];
    const biomeIndex = biomeCells[q];
    const biome = (biomeIndex === undefined ? undefined : kinds[biomeIndex]) || kinds[0];
    const tint = [...(biomeTints[biome] || [1, 1, 1])];
    // Deterministic per-cell tones preserve the old maps' surface variation.
    let shade = 0.82 + hash2(x, z, 11) * 0.3;
    const near = wallAt(x, z - 1) || wallAt(x, z + 1) || wallAt(x - 1, z) || wallAt(x + 1, z);
    if (near) shade *= 0.76;
    if (roadSet.has(grid.key(x, z))) { tint[0] *= 1.12; tint[1] *= 0.94; tint[2] *= 0.78; }

    // Shoreline bank: transition ground toward sand, gravel, and river silt near water
    let minWaterDist = 99;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (waterSet.has(grid.key(x + dx, z + dz))) {
          const d = Math.hypot(dx, dz);
          if (d < minWaterDist) minWaterDist = d;
        }
      }
    }
    if (minWaterDist <= 2.2) {
      const shoreBlend = Math.min(1, (2.2 - minWaterDist) / 1.4);
      tint[0] = tint[0] * (1 - shoreBlend) + 0.70 * shoreBlend;
      tint[1] = tint[1] * (1 - shoreBlend) + 0.63 * shoreBlend;
      tint[2] = tint[2] * (1 - shoreBlend) + 0.51 * shoreBlend;
      if (minWaterDist <= 0.9) {
        shade *= 0.88;
        shade += (hash2(x * 7 | 0, z * 7 | 0, 883) - 0.5) * 0.16;
      }
    }
    // Dirt-splat patches: world-anchored noise breaks the uniform grass
    // carpet with bare-soil clearings. The same field drives grass
    // suppression in flora and pebble scatter in props, so dirt patches,
    // missing grass and pebbles always agree with each other.
    // Snow fade: bare soil does not show through packed snow, so the dirt
    // blend dissolves with the per-cell snow weight (full snow → no dirt).
    const snowAvg = (cornersSnow[vertex] + cornersSnow[vertex + 1] +
      cornersSnow[vertex + 2] + cornersSnow[vertex + 3]) / 4;
    if (!grid.indoor && snowAvg < 0.98 && minWaterDist > 1.6 && !roadSet.has(grid.key(x, z))) {
      const dirt = dirtField(orgX + x, orgZ + z);
      if (dirt > 0.60) {
        const t = Math.min(1, (dirt - 0.60) / 0.16) * (1 - snowAvg);
        tint[0] = tint[0] * (1 - t) + 0.60 * t;
        tint[1] = tint[1] * (1 - t) + 0.46 * t;
        tint[2] = tint[2] * (1 - t) + 0.33 * t;
        shade *= 1 - t * 0.10;
      }
    }
    for (let c = 0; c < 4; c++) {
      const [cx, cz] = corners[c];
      const vi = (vertex + c) * 3, ti = (vertex + c) * 2;
      positions[vi] = cx * CELL;
      positions[vi + 1] = heightAt(cx, cz);
      positions[vi + 2] = cz * CELL;
      uvs[ti] = cx / W;
      uvs[ti + 1] = cz / H;
      colors[vi] = tint[0] * shade;
      colors[vi + 1] = tint[1] * shade;
      colors[vi + 2] = tint[2] * shade;
    }
    indices.set([vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3], index);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (snowGround) geo.setAttribute('snowW', new THREE.BufferAttribute(cornersSnow, 1));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: set.map, bumpMap: set.bump, bumpScale: floorBumpScale,
    roughness: floorRoughness, metalness: floorMetalness, vertexColors: true
  });
  if (snowGround && snowSet) {
    // Dual-albedo crossfade (see block comment above buildFloor): the biome
    // albedo stays the base map; the procedural snow ground rides a second
    // sampler with its own 26 ft repeat, mixed per-vertex by vSnowW. The
    // vertex tint (vColor) multiplies BOTH albedos so shoreline/dirt tints
    // keep working on snow. Snow roughness eases toward packed-snow values.
    const snowMap = snowSet.map;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSnowMap = { value: snowMap };
      shader.uniforms.uSnowRepeat = { value: new THREE.Vector2((W * CELL) / 26, (H * CELL) / 26) };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
        attribute float snowW;
        varying float vSnowW;
        varying vec2 vSnowUv;
        uniform vec2 uSnowRepeat;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        vSnowW = snowW;
        vSnowUv = uv * uSnowRepeat;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
        varying float vSnowW;
        varying vec2 vSnowUv;
        uniform sampler2D uSnowMap;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 arSnowTexel = texture2D(uSnowMap, vSnowUv).rgb * vColor.rgb;
        diffuseColor.rgb = mix(diffuseColor.rgb, arSnowTexel, vSnowW);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.85, vSnowW);`);
    };
    mat.customProgramCacheKey = () => 'ashenreach-floor-snowblend-v1';
  }
  const floor = new THREE.Mesh(geo, mat);
  floor.receiveShadow = true;
  grid.group.add(floor);
}

// ── procedural seamless normal map generator for organic caustic waves ──
function createWaterNormalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create water normal canvas');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      // Seamless circular caustic harmonics
      const h = Math.sin(u) * Math.cos(v) * 0.32
              + Math.sin(u * 2.0 + 1.3) * Math.sin(v * 2.0 + 0.8) * 0.22
              + Math.cos(u * 3.0 - v + 2.1) * 0.16
              + Math.sin(u + v * 3.0 + 1.5) * 0.14
              + Math.cos(u * 4.0 + v * 2.0) * 0.09
              + Math.sin(u * 5.0 - v * 3.0 + 0.7) * 0.07;
      heights[y * size + x] = h;
    }
  }

  const scale = 2.4;
  for (let y = 0; y < size; y++) {
    const yPrev = ((y - 1 + size) % size) * size;
    const yNext = ((y + 1) % size) * size;
    const yCurr = y * size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const dhdx = (heights[yCurr + xNext] - heights[yCurr + xPrev]) * 0.5 * scale;
      const dhdy = (heights[yNext + x] - heights[yPrev + x]) * 0.5 * scale;

      const nx = -dhdx;
      const ny = -dhdy;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;

      const idx = (y * size + x) * 4;
      data[idx]     = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// ── water: Three.js Water / Tidewater physical liquid shader ──
export function buildWater(grid: TileGrid, map: MapDef) {
  const rawCells = map.cells.water || [];
  const halfDefs = (map.cells.halfTiles || []).filter(h => h.type === 'water');
  if (!rawCells.length && !halfDefs.length) return;

  interface WaterUnit {
    x: number;
    z: number;
    orientation?: 'nw' | 'ne' | 'se' | 'sw';
  }
  const units: WaterUnit[] = [];
  for (const cell of rawCells) {
    const [x, z, orientation] = cell;
    units.push({ x, z, orientation: orientation ? normalizeHalfTile(orientation) : undefined });
  }
  for (const h of halfDefs) {
    units.push({ x: h.x, z: h.z, orientation: normalizeHalfTile(h.orientation) });
  }

  const heights = map.terrain?.heightFt || [];
  const terrainWidth = map.terrain?.width || 0;
  const fallbackHeight = (x: number, z: number) =>
    terrainWidth ? heights[Math.min(map.size.h - 1, Math.max(0, z)) * terrainWidth + Math.min(map.size.w - 1, Math.max(0, x))] || 0 : 0;
  const surfaceLevels = map.cells.waterSurfaceFt || [];

  const wet = new Set<number>();
  for (const u of units) wet.add(grid.key(u.x, u.z));

  // Cross-seam water halo: the same lake continues in the neighboring region.
  // Without it, seam vertices average only in-region cells (visible height
  // cracks) and every border vertex reads as shore — a foam line straight
  // across open water. Halo levels mirror the adjacent in-region cell.
  const haloLevels = new Map<number, number>();
  for (const [hx, hz, hl] of map.cells.waterHalo || []) {
    wet.add(grid.key(hx, hz));
    if (typeof hl === 'number') haloLevels.set(grid.key(hx, hz), hl);
  }

  const isWet = (cx: number, cz: number) => wet.has(grid.key(cx, cz));

  const waterLevelAt = (cx: number, cz: number): number | null => {
    if (cx >= 0 && cz >= 0 && cx < map.size.w && cz < map.size.h) {
      const lvl = surfaceLevels[cz * map.size.w + cx];
      return typeof lvl === 'number' ? lvl : null;
    }
    return haloLevels.get(grid.key(cx, cz)) ?? null;
  };

  const getWaterHeight = (vx: number, vz: number) => {
    let sum = 0, count = 0;
    for (const [cx, cz] of [[vx - 1, vz - 1], [vx, vz - 1], [vx - 1, vz], [vx, vz]]) {
      if (isWet(cx, cz)) {
        const lvl = waterLevelAt(cx, cz);
        if (lvl !== null) { sum += lvl; count++; }
      }
    }
    if (count > 0) return sum / count;
    return fallbackHeight(Math.round(vx), Math.round(vz)) + 0.18;
  };

  // Compute continuous distance-to-shore factor (0 = deep open channel, 1 = dry bank edge)
  const getShoreFactor = (vx: number, vz: number) => {
    let dryCount = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!isWet(Math.floor(vx + dx * 0.5), Math.floor(vz + dz * 0.5))) {
          dryCount++;
        }
      }
    }
    return Math.min(1.0, dryCount / 4.0);
  };

  const baseTris: { pts: [number, number][]; isHalfTile: boolean }[] = [];
  for (const u of units) {
    const { x, z, orientation } = u;
    const nw: [number, number] = [x, z];
    const ne: [number, number] = [x + 1, z];
    const sw: [number, number] = [x, z + 1];
    const se: [number, number] = [x + 1, z + 1];

    if (!orientation) {
      baseTris.push({ pts: [nw, sw, ne], isHalfTile: false });
      baseTris.push({ pts: [ne, sw, se], isHalfTile: false });
    } else if (orientation === 'nw') {
      baseTris.push({ pts: [nw, sw, ne], isHalfTile: true });
    } else if (orientation === 'se') {
      baseTris.push({ pts: [se, ne, sw], isHalfTile: true });
    } else if (orientation === 'ne') {
      baseTris.push({ pts: [ne, nw, se], isHalfTile: true });
    } else if (orientation === 'sw') {
      baseTris.push({ pts: [sw, se, nw], isHalfTile: true });
    }
  }

  const vertexCount = baseTris.length * 3;
  const positions = new Float32Array(vertexCount * 3);
  const shores = new Float32Array(vertexCount);
  const indices = new Uint32Array(vertexCount);

  let vIdx = 0;
  for (const tri of baseTris) {
    for (const [vx, vz] of tri.pts) {
      const at = vIdx * 3;
      const worldX = vx * CELL;
      const worldZ = vz * CELL;
      const wH = getWaterHeight(vx, vz);
      const rawShore = getShoreFactor(vx, vz);
      const shoreVal = tri.isHalfTile ? Math.max(0.65, rawShore) : rawShore;

      positions[at] = worldX;
      positions[at + 1] = wH;
      positions[at + 2] = worldZ;

      shores[vIdx] = shoreVal;
      indices[vIdx] = vIdx;
      vIdx++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aShore', new THREE.BufferAttribute(shores, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const waterNormals = createWaterNormalTexture();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x031720,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  grid.waterMaterial = waterMat;

  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = grid.waterTime;
    shader.uniforms.uSkyZenith = grid.waterSkyZenith;
    shader.uniforms.uSkyHorizon = grid.waterSkyHorizon;
    shader.uniforms.uNightFactor = grid.waterNightFactor;
    shader.uniforms.uWindOffset = grid.waterWindOffset;
    shader.uniforms.uCloudCoverage = grid.waterCloudCoverage;
    shader.uniforms.uWaterNormals = { value: waterNormals };

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      attribute float aShore;
      varying vec3 vWorldPosition;
      varying float vShore;
      uniform float uWaterTime;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 wPos = modelMatrix * vec4(position, 1.0);
      vec2 p = wPos.xz;

      // Smooth vertical swell: clamped to 0 at the bank so water never clips
      float shoreAtten = clamp(1.0 - aShore, 0.0, 1.0);
      float swell = sin(p.x * 0.12 + p.y * 0.08 + uWaterTime * 0.9) * 0.025;
      transformed.y += swell * shoreAtten;

      wPos = modelMatrix * vec4(transformed, 1.0);
      vWorldPosition = wPos.xyz;
      vShore = aShore;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPosition;
      varying float vShore;
      uniform float uWaterTime;
      uniform vec3 uSkyZenith;
      uniform vec3 uSkyHorizon;
      uniform float uNightFactor;
      uniform vec2 uWindOffset;
      uniform float uCloudCoverage;
      uniform sampler2D uWaterNormals;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // Clear translucent shallows transitioning to dark aquatic teal
      vec3 deepWater = vec3(0.008, 0.038, 0.048);
      vec3 shallowWater = vec3(0.025, 0.095, 0.110);
      float depthWeight = clamp(1.0 - vShore, 0.0, 1.0);
      vec3 waterBase = mix(shallowWater, deepWater, smoothstep(0.1, 0.9, depthWeight));

      // Delicate shoreline foam fringe
      float shoreEdge = smoothstep(0.75, 1.0, vShore);
      float swash = sin(vShore * 22.0 - uWaterTime * 2.8 + vWorldPosition.x * 0.3) * 0.5 + 0.5;
      float foam = smoothstep(0.65, 0.95, swash) * shoreEdge * 0.5;

      vec3 dayFoam = vec3(0.68, 0.78, 0.82);
      vec3 nightFoam = vec3(0.06, 0.09, 0.12);
      vec3 foamColor = mix(dayFoam, nightFoam, uNightFactor);

      diffuseColor.rgb = mix(waterBase, foamColor, foam);

      // Transparency: shallows reveal riverbed beneath, open water deepens
      float alphaTrans = mix(0.42, 0.86, smoothstep(0.0, 0.6, depthWeight));
      float shoreFade = smoothstep(1.0, 0.82, vShore);
      diffuseColor.a = mix(alphaTrans * (0.35 + 0.65 * shoreFade), 0.96, foam);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      // Multi-layer sliding caustic normals (Three.js Water architecture)
      vec2 p = vWorldPosition.xz;
      float t = uWaterTime;

      vec2 uv0 = p * 0.055 + vec2(t * 0.022, t * 0.015) + uWindOffset * 0.3;
      vec2 uv1 = p * 0.095 - vec2(t * 0.018, -t * 0.024) - uWindOffset * 0.2;
      vec2 uv2 = p * 0.170 + vec2(-t * 0.014, t * 0.028);

      vec3 n0 = texture2D(uWaterNormals, uv0).rgb * 2.0 - 1.0;
      vec3 n1 = texture2D(uWaterNormals, uv1).rgb * 2.0 - 1.0;
      vec3 n2 = texture2D(uWaterNormals, uv2).rgb * 2.0 - 1.0;

      vec3 rippleTangent = normalize(n0 + n1 * 0.65 + n2 * 0.35);
      vec3 waveNormal = normalize(vec3(rippleTangent.x * 0.28, rippleTangent.z, rippleTangent.y * 0.28));
      normal = normalize(mix(normal, waveNormal, 0.72));`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      // Dielectric Fresnel reflection (Snell's Law / Schlick approximation, IOR 1.333, F0 = 0.02)
      vec3 V = normalize(-vViewPosition);
      float NdotV = clamp(dot(normal, V), 0.0, 1.0);
      float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

      vec3 R = reflect(-V, normal);
      float skyGrad = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 skyColor = mix(uSkyHorizon, uSkyZenith, pow(skyGrad, 1.4));

      float dayIntensity = (1.0 - uNightFactor * 0.85) * (1.0 - uCloudCoverage * 0.4);
      vec3 skyReflect = skyColor * fresnel * 0.45 * dayIntensity * (1.0 - vShore * 0.35);
      totalEmissiveRadiance += skyReflect;`
    );
  };

  waterMat.customProgramCacheKey = () => 'ashenreach-tidewater-v5';
  const water = new THREE.Mesh(geometry, waterMat);
  water.receiveShadow = true;
  water.renderOrder = 2; // Renders after terrain ground (0) and roads (1) for clean transparency
  grid.group.add(water);
}

export function buildRoads(grid: TileGrid, map: MapDef) {
  const rawCells = map.cells.road || [];
  const halfDefs = (map.cells.halfTiles || []).filter(h => h.type === 'road');
  if (!rawCells.length && !halfDefs.length) return;

  interface RoadUnit {
    x: number;
    z: number;
    orientation?: 'nw' | 'ne' | 'se' | 'sw';
  }
  const units: RoadUnit[] = [];
  for (const cell of rawCells) {
    const [x, z, orientation] = cell;
    units.push({ x, z, orientation: orientation ? normalizeHalfTile(orientation) : undefined });
  }
  for (const h of halfDefs) {
    units.push({ x: h.x, z: h.z, orientation: normalizeHalfTile(h.orientation) });
  }

  let triCount = 0;
  for (const u of units) {
    triCount += u.orientation ? 1 : 2;
  }
  const vertexCount = triCount * 3;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(vertexCount);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 128; textureCanvas.height = 128;
  const context = textureCanvas.getContext('2d');
  if (!context) throw new Error('Unable to create road texture canvas');
  context.fillStyle = '#76684e';
  context.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const x = hash2(i, 3, 421) * 128, z = hash2(i, 5, 821) * 128;
    const shade = 70 + Math.floor(hash2(i, 7, 1229) * 55);
    context.fillStyle = `rgba(${shade},${shade * 0.88},${shade * 0.68},${0.18 + hash2(i, 11, 31) * 0.28})`;
    context.beginPath();
    context.ellipse(x, z, 0.8 + hash2(i, 13, 73) * 2.4, 0.7 + hash2(i, 17, 97) * 1.5,
      hash2(i, 19, 131) * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const tint = new THREE.Color(0xb4a184);

  let vIdx = 0;
  for (const u of units) {
    const { x, z, orientation } = u;
    const nw = [x, z], ne = [x + 1, z], sw = [x, z + 1], se = [x + 1, z + 1];
    const tris: number[][][] = [];
    if (!orientation) {
      tris.push([nw, sw, ne], [ne, sw, se]);
    } else if (orientation === 'nw') {
      tris.push([nw, sw, ne]);
    } else if (orientation === 'se') {
      tris.push([se, ne, sw]);
    } else if (orientation === 'ne') {
      tris.push([ne, nw, se]);
    } else if (orientation === 'sw') {
      tris.push([sw, se, nw]);
    }

    for (const tri of tris) {
      for (const [vx, vz] of tri) {
        const at = vIdx * 3, uv = vIdx * 2;
        const worldX = vx * CELL, worldZ = vz * CELL;
        positions[at] = worldX;
        positions[at + 1] = grid.terrainHeightAt(worldX, worldZ) + 0.09;
        positions[at + 2] = worldZ;
        uvs[uv] = worldX / 26;
        uvs[uv + 1] = worldZ / 26;
        const shade = 0.78 + hash2(x, z, 51) * 0.3;
        colors[at] = tint.r * shade;
        colors[at + 1] = tint.g * shade;
        colors[at + 2] = tint.b * shade;
        indices[vIdx] = vIdx;
        vIdx++;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: texture, color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -1,
  }));
  road.receiveShadow = true;
  road.renderOrder = 1;
  grid.group.add(road);
}

export function buildRoomDetails(grid: TileGrid, map: MapDef) {
  if (!map.roomRects?.length) return;
  const addRing = (x: number, z: number, inner: number, outer: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x * CELL, 0.035, z * CELL);
    mesh.renderOrder = 1;
    grid.group.add(mesh);
  };
  const addBar = (x: number, z: number, width: number, depth: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.025, depth), material);
    mesh.position.set(x * CELL, 0.04, z * CELL);
    mesh.renderOrder = 1;
    grid.group.add(mesh);
    return mesh;
  };

  for (const room of map.roomRects) {
    const cx = (room.x1 + room.x2 + 1) / 2;
    const cz = (room.z1 + room.z2 + 1) / 2;
    const width = (room.x2 - room.x1 - 1) * CELL;
    const depth = (room.z2 - room.z1 - 1) * CELL;
    const boss = room.id === map.bossRoom;

    if (boss) {
      const radius = Math.min(width, depth) * 0.38;
      addRing(cx, cz, radius - 0.42, radius, BOSS_STONE);
      addRing(cx, cz, radius * 0.56 - 0.32, radius * 0.56, ROOM_STONE);
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const x = cx + Math.cos(angle) * radius * 0.78 / CELL;
        const z = cz + Math.sin(angle) * radius * 0.78 / CELL;
        const bar = addBar(x, z, 1.3, 0.28, BOSS_STONE);
        bar.rotation.y = -angle;
      }
    } else if (room.module === 'burial_chapel') {
      const radius = Math.min(width, depth) * 0.24;
      addRing(cx, cz, radius - 0.32, radius, ROOM_STONE);
      addRing(cx, cz, radius * 0.55 - 0.24, radius * 0.55, ROOM_STONE);
    } else if (room.module === 'processional_gallery') {
      const alongX = width >= depth;
      const length = (alongX ? width : depth) * 0.82;
      const halfWidth = Math.min(width, depth) * 0.22;
      if (alongX) {
        addBar(cx, cz - halfWidth / (2 * CELL), length, 0.24, ROOM_STONE);
        addBar(cx, cz + halfWidth / (2 * CELL), length, 0.24, ROOM_STONE);
        for (let i = -1; i <= 1; i++) addBar(cx + i * length / (3 * CELL), cz, 0.24, halfWidth, ROOM_STONE);
      } else {
        addBar(cx - halfWidth / (2 * CELL), cz, 0.24, length, ROOM_STONE);
        addBar(cx + halfWidth / (2 * CELL), cz, 0.24, length, ROOM_STONE);
        for (let i = -1; i <= 1; i++) addBar(cx, cz + i * length / (3 * CELL), halfWidth, 0.24, ROOM_STONE);
      }
    } else if (room.module === 'entry_vestibule') {
      addBar(cx, cz - 0.55, width * 0.7, 0.22, ROOM_STONE);
      addBar(cx, cz + 0.55, width * 0.7, 0.22, ROOM_STONE);
    }
  }
}