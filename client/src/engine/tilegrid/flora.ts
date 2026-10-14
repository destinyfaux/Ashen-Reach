// tilegrid/flora.ts — grassland + meadow flora build pass.
// Extracted from TileGrid.ts; now owns the grass-type soft blend, the
// camera-distance density falloff, and the meadow forb/shrub layer.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef } from '../types';
import { hash2 } from '../materials';
import { CELL, dirtField, wildGrassField, grassBlendField, flowerField, shrubField } from './shared';
import { makeTussockGeometry, makeMeadowFlowerGeometry, makeShrubGeometry } from './geo';

interface GrassClump { x: number; z: number; y: number; scaleXZ: number; scaleY: number; color: number }
interface FloraItem { x: number; y: number; z: number; s: number; ry: number; tint: number }

export function buildGrassland(grid: TileGrid, map: MapDef) {
  const biomeCells = map.biomes?.cells;
  const kinds = map.biomes?.kinds;
  if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;
  const road = new Set((map.cells.road || []).map(([x, z]) => grid.key(x, z)));
  const water = new Set((map.cells.water || []).map(([x, z]) => grid.key(x, z)));
  const wall = new Set(map.cells.wall.map(([x, z]) => grid.key(x, z)));
  const clumps: GrassClump[] = [];
  const tussocks: GrassClump[] = [];
  const daisies: FloraItem[] = [];
  const buttercups: FloraItem[] = [];
  const violets: FloraItem[] = [];
  const shrubs: FloraItem[] = [];
  // world feet origin: dirt/wild/flower/shrub fields are world-anchored so
  // patches flow across region seams instead of repeating per region
  const originFt = map.worldOriginFt || {
    x: (map.region?.rx ?? 0) * map.size.w * CELL,
    z: (map.region?.rz ?? 0) * map.size.h * CELL,
  };
  const orgX = originFt.x / CELL;
  const orgZ = originFt.z / CELL;
  // Full region coverage including the border ring: the old 1-cell inset left
  // a bald 5ft strip at every region seam ("regions don't blend"). Biome,
  // road, water and wall masks are all region-local so the border ring is
  // perfectly safe to plant; heights at the seam are identical by construction.
  for (let z = 0; z < map.size.h; z++) for (let x = 0; x < map.size.w; x++) {
    const cell = grid.key(x, z), biome = kinds[biomeCells[z * map.size.w + x]];
    if ((biome !== 'meadow' && biome !== 'forest') ||
        road.has(cell) || water.has(cell) || wall.has(cell)) continue;
    const density = hash2(x, z, 207);
    const count = biome === 'meadow'
      ? grid.eng.lowgfx
        ? 7 + Math.floor(density * 6)
        : 15 + Math.floor(density * 12)
      : density > 0.28
        ? grid.eng.lowgfx ? 3 + Math.floor(density * 4) : 6 + Math.floor(density * 6)
        : 0;
    for (let i = 0; i < count; i++) {
      const seed = i + z * map.size.w + x * 997;
      // Jitter widely across cell boundaries for seamless coverage without clumping
      const px = (x - 0.15 + hash2(seed, 17, 223) * 1.3) * CELL;
      const pz = (z - 0.15 + hash2(seed, 31, 227) * 1.3) * CELL;
      const targetCell = grid.key(Math.floor(px / CELL), Math.floor(pz / CELL));
      if (road.has(targetCell) || water.has(targetCell) || wall.has(targetCell)) continue;

      // Dirt-splat patches stay bare — the terrain tint, this suppression and
      // the pebble scatter in props all read the same world-anchored field.
      const dirt = dirtField(orgX + px / CELL, orgZ + pz / CELL);
      if (dirt + (hash2(seed, 83, 311) - 0.5) * 0.16 > 0.665) continue;

      // Wild-grass boundary: instead of one hard threshold line, the tussock
      // edge blends over a noise-driven band. grassBlendField picks the band
      // width per spot — crisp mown edges where it's low (those exist in
      // nature and read nicely), a wide soft intermix where it's high — and
      // inside the band each clump flips to a tussock by smoothstep odds, so
      // the two grass types scatter into each other instead of abutting.
      if (biome === 'meadow') {
        const wild = wildGrassField(orgX + px / CELL, orgZ + pz / CELL);
        const softness = grassBlendField(orgX + px / CELL, orgZ + pz / CELL);
        const half = 0.015 + softness * softness * 0.17;
        const t = Math.min(1, Math.max(0, (wild - (0.63 - half)) / (2 * half)));
        const prob = t * t * (3 - 2 * t);
        if (hash2(seed, 97, 349) < prob) {
          const wildScale = 0.95 + hash2(seed, 43, 229) * 0.5;
          tussocks.push({
            x: px, z: pz, y: grid.terrainHeightAt(px, pz),
            scaleXZ: wildScale,
            scaleY: wildScale * (0.9 + hash2(seed, 71, 241) * 0.4),
            color: [0xb5b06a, 0xa3a75e, 0xc0b576, 0x999a52][Math.floor(hash2(seed, 59, 233) * 4)],
          });
          continue;
        }
      }

      const palette = biome === 'meadow'
        ? [0x628442, 0x7b9b4b, 0x9aab5b, 0x526f3d, 0x8a9a50]
        : [0x45633c, 0x5f7945, 0x78834a];
      const baseScale = (biome === 'meadow' ? 1.08 : 0.9) + hash2(seed, 43, 229) * 0.45;
      const heightScale = baseScale * (0.82 + hash2(seed, 71, 241) * 0.48);
      clumps.push({
        x: px, z: pz, y: grid.terrainHeightAt(px, pz),
        scaleXZ: baseScale,
        scaleY: heightScale,
        color: palette[Math.floor(hash2(seed, 59, 233) * palette.length)],
      });
    }

    // ── meadow forb & shrub layer (client PCG, world-anchored patches) ──
    // Wildflowers bloom in flowerField clusters (daisy-dominant with
    // buttercup and violet accents); low shrubs stand where shrubField
    // rises. Both respect the dirt splat and stay off roads/water/walls.
    if (biome === 'meadow') {
      const cwx = orgX + x + 0.5, cwz = orgZ + z + 0.5;
      if (dirtField(cwx, cwz) < 0.60) {
        const fl = flowerField(cwx, cwz);
        if (fl > 0.58) {
          const n = Math.min(3, Math.floor((fl - 0.58) * 11 + hash2(x, z, 9413) * 1.7));
          for (let i = 0; i < n; i++) {
            const fSeed = x * 131 + z * 57 + i * 17;
            const fx = (x + hash2(fSeed, 7, 9414)) * CELL;
            const fz = (z + hash2(fSeed, 13, 9415)) * CELL;
            const tc = grid.key(Math.floor(fx / CELL), Math.floor(fz / CELL));
            if (road.has(tc) || water.has(tc) || wall.has(tc)) continue;
            if (dirtField(orgX + fx / CELL, orgZ + fz / CELL) > 0.655) continue;
            const roll = hash2(fSeed, 19, 9416);
            const bucket = roll < 0.60 ? daisies : roll < 0.83 ? buttercups : violets;
            bucket.push({
              x: fx, y: grid.terrainHeightAt(fx, fz) + 0.02, z: fz,
              s: 0.85 + hash2(fSeed, 23, 9417) * 0.55,
              ry: hash2(fSeed, 29, 9418) * Math.PI * 2,
              tint: 0.92 + hash2(fSeed, 31, 9419) * 0.14,
            });
          }
        }
        const sf = shrubField(cwx, cwz);
        if (sf > 0.72 && hash2(x, z, 9513) < (sf - 0.72) * 4.2) {
          const sx = (x + 0.15 + hash2(x, z, 9514) * 0.7) * CELL;
          const sz = (z + 0.15 + hash2(x, z, 9515) * 0.7) * CELL;
          const tc = grid.key(Math.floor(sx / CELL), Math.floor(sz / CELL));
          if (!road.has(tc) && !water.has(tc) && !wall.has(tc)) {
            shrubs.push({
              x: sx, y: grid.terrainHeightAt(sx, sz) - 0.03, z: sz,
              s: 0.85 + hash2(x, z, 9516) * 0.75,
              ry: hash2(x, z, 9517) * Math.PI * 2,
              tint: 0.88 + hash2(x, z, 9518) * 0.20,
            });
          }
        }
      }
    }
  }
  if (!clumps.length) return;
  const positions: number[] = [], indices: number[] = [];
  const vertexColors: number[] = [];

  // Varied blade profiles in the asset itself: heights range from 0.44 to 1.18 ft
  const bladeDefs = [
    { angle: 0.15, width: 0.22, height: 1.18, bendX: 0.14, bendZ: 0.05 },
    { angle: 1.25, width: 0.18, height: 0.82, bendX: -0.15, bendZ: -0.08 },
    { angle: 2.20, width: 0.16, height: 0.52, bendX: 0.18, bendZ: 0.12 },
    { angle: 3.25, width: 0.20, height: 1.05, bendX: -0.12, bendZ: -0.06 },
    { angle: 4.35, width: 0.17, height: 0.70, bendX: 0.19, bendZ: 0.10 },
    { angle: 5.35, width: 0.15, height: 0.44, bendX: -0.14, bendZ: 0.07 },
  ];

  for (let b = 0; b < bladeDefs.length; b++) {
    const def = bladeDefs[b];
    const widthX = Math.cos(def.angle) * def.width;
    const widthZ = Math.sin(def.angle) * def.width;
    const midH = def.height * 0.46;
    const topH = def.height;
    const offset = positions.length / 3;

    positions.push(
      -widthX, 0, -widthZ,
      widthX, 0, widthZ,
      def.bendX - widthX * 0.65, midH, def.bendZ - widthZ * 0.65,
      def.bendX + widthX * 0.65, midH, def.bendZ + widthZ * 0.65,
      def.bendX * 2.2 - widthX * 0.12, topH, def.bendZ * 2.2 - widthZ * 0.12,
      def.bendX * 2.2 + widthX * 0.12, topH, def.bendZ * 2.2 + widthZ * 0.12,
    );
    vertexColors.push(
      0.52, 0.68, 0.46, 0.52, 0.68, 0.46,
      0.78, 0.90, 0.64, 0.78, 0.90, 0.64,
      0.98, 1.0, 0.78, 0.98, 1.0, 0.78,
    );
    indices.push(
      offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2,
      offset + 2, offset + 3, offset + 4, offset + 3, offset + 5, offset + 4,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, metalness: 0,
    side: THREE.DoubleSide, vertexColors: true,
  });
  grid.grassMaterial = material;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrassTime = grid.grassTime;
    // uGrassFocus is shared (world feet, refreshed per frame from the camera);
    // uGrassOrigin pins this region's group offset so the falloff field reads
    // continuous distances even though instance matrices are region-local.
    shader.uniforms.uGrassFocus = grid.grassFocus;
    shader.uniforms.uGrassOrigin = { value: new THREE.Vector3(originFt.x, 0, originFt.z) };
    shader.uniforms.uGrassInner = { value: 36.0 };
    shader.uniforms.uGrassOuter = { value: 175.0 };
    shader.uniforms.uGrassFar = { value: grid.eng.lowgfx ? 0.38 : 0.5 };
    shader.uniforms.uGrassCull = { value: 265.0 };
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uGrassTime;
      uniform vec3 uGrassFocus;
      uniform vec3 uGrassOrigin;
      uniform float uGrassInner;
      uniform float uGrassOuter;
      uniform float uGrassFar;
      uniform float uGrassCull;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 grassOrigin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        mat3 grassRotation = mat3(
          normalize(instanceMatrix[0].xyz),
          normalize(instanceMatrix[1].xyz),
          normalize(instanceMatrix[2].xyz)
        );
        vec3 windLocal = transpose(grassRotation) * vec3(0.88, 0.0, 0.48);
        float gust = sin(grassOrigin.x * 0.12 + grassOrigin.z * 0.08 + uGrassTime * 0.85);
        transformed += windLocal * gust * position.y * position.y * 0.12;

        // ── camera-distance density falloff ──
        // Full carpet within uGrassInner, gradient down to uGrassFar by
        // uGrassOuter, then faded to zero past the fog line. Every instance
        // owns a stable position hash; as the field tightens, scattered
        // instances collapse to a point (zero-area triangles, no fragments),
        // thinning the grass without visible clustering or rebuilds.
        vec2 gFocusLocal = uGrassFocus.xz - uGrassOrigin.xz;
        float gDist = distance(grassOrigin.xz, gFocusLocal);
        float gT = clamp((gDist - uGrassInner) / max(uGrassOuter - uGrassInner, 1.0), 0.0, 1.0);
        float gDensity = mix(1.0, uGrassFar, gT);
        gDensity *= 1.0 - smoothstep(uGrassCull, uGrassCull + 30.0, gDist);
        float gKeep = fract(sin(dot(grassOrigin.xz, vec2(12.9898, 78.233))) * 43758.5453);
        if (gKeep > gDensity) transformed = vec3(0.0);
      #endif`,
    );
  };
  material.customProgramCacheKey = () => 'ashenreach-instanced-grass-wind-v3';
  const mesh = new THREE.InstancedMesh(geometry, material, clumps.length);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const object = new THREE.Object3D(), color = new THREE.Color();
  clumps.forEach((clump, index) => {
    object.position.set(clump.x, clump.y, clump.z);
    object.rotation.y = hash2(index, 67, 239) * Math.PI * 2;
    object.scale.set(clump.scaleXZ, clump.scaleY, clump.scaleXZ);
    object.updateMatrix();
    mesh.setMatrixAt(index, object.matrix);
    color.setHex(clump.color);
    mesh.setColorAt(index, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  grid.group.add(mesh);

  // Wild-grass tussocks share the wind-animated grass material so both grass
  // types sway together; only the geometry and instance colors differ.
  if (tussocks.length) {
    const tussockMesh = new THREE.InstancedMesh(makeTussockGeometry(grid), material, tussocks.length);
    tussockMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const tObj = new THREE.Object3D(), tColor = new THREE.Color();
    tussocks.forEach((t, index) => {
      tObj.position.set(t.x, t.y, t.z);
      tObj.rotation.y = hash2(index, 67, 239) * Math.PI * 2;
      tObj.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
      tObj.updateMatrix();
      tussockMesh.setMatrixAt(index, tObj.matrix);
      tColor.setHex(t.color);
      tussockMesh.setColorAt(index, tColor);
    });
    tussockMesh.instanceMatrix.needsUpdate = true;
    if (tussockMesh.instanceColor) tussockMesh.instanceColor.needsUpdate = true;
    tussockMesh.castShadow = false;
    tussockMesh.receiveShadow = true;
    grid.group.add(tussockMesh);
  }

  // Meadow forbs & shrubs ride the same wind material — they inherit the gust
  // sway and the distance density falloff for free. Vertex colors carry the
  // petal/center/foliage shading; instance colors only modulate brightness.
  const floraMesh = (geo: THREE.BufferGeometry, items: FloraItem[]) => {
    if (!items.length) { geo.dispose(); return; }
    const im = new THREE.InstancedMesh(geo, material, items.length);
    im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const o = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, index) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(0, it.ry, 0);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      im.setMatrixAt(index, o.matrix);
      c.setRGB(it.tint, it.tint, it.tint);
      im.setColorAt(index, c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = false;
    im.receiveShadow = true;
    grid.group.add(im);
  };
  // daisy (dominant), buttercup, violet — proportions set in the spawn loop
  floraMesh(makeMeadowFlowerGeometry(grid, [0.96, 0.96, 0.93], [0.98, 0.80, 0.28], 0.52, 0.17, 6), daisies);
  floraMesh(makeMeadowFlowerGeometry(grid, [0.95, 0.78, 0.20], [0.85, 0.55, 0.12], 0.42, 0.13, 5), buttercups);
  floraMesh(makeMeadowFlowerGeometry(grid, [0.60, 0.42, 0.86], [0.92, 0.76, 0.32], 0.34, 0.11, 5), violets);
  floraMesh(makeShrubGeometry(grid), shrubs);
}
