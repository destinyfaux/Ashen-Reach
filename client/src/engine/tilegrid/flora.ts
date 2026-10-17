// tilegrid/flora.ts — grassland + meadow flora build pass.
// Extracted from TileGrid.ts; now owns the grass-type soft blend, the
// camera-distance density falloff, and the meadow forb/shrub layer.
//
// Secondary grass decision (user ruling): the kit grass models read wrong next
// to the wind-animated carpet and never swayed with it, so the wild-grass
// tussock layer is BACK on its original procedural geometry riding the SAME
// wind shader as the carpet — both grass types sway together again. Kit models
// still cover the meadow forbs (daisies/buttercups/violets) and the low shrubs;
// the crimson-leaved Bush_Common is reserved for autumn accents and no longer
// spawns in green meadows.
//
// Wave 1.5 (user feedback round):
//  - flower splat: dense wildflower country (flowerField top band) suppresses
//    the grass carpet inside the zone and grows tight single-species clusters;
//    outside it flowers appear only as sporadic individuals. Flowers are 2x
//    their old scale so they read at distance. Feedback round: the splat was
//    far too frequent (large swathes everywhere) — the zone threshold moved
//    0.635 → 0.762, which cuts splat coverage from ~22% of meadow country to
//    ~5% (user target 5%), measured by Monte-Carlo over the exact field.
//  - grass density is noise-modulated (lush pockets vs nibbled ground, mean
//    ~0.8x of the old uniform fill) and tall-grass patches grow at ~2x height.
//
// IMPORTANT: every asset emit (immediate or deferred via whenAssetsReady)
// targets the REGION GROUP captured below — grid.group mutates as regions
// stream, so touching grid.group from a deferred callback would pile this
// region's instances into whatever region built last (the origin-cluster bug).
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef } from '../types';
import { hash2 } from '../materials';
import { CELL, dirtField, wildGrassField, grassBlendField, flowerField, shrubField, grassDensityField, tallGrassField } from './shared';
import { makeTussockGeometry } from './geo';
import { scatterAsset, whenAssetsReady, assetsReady } from '../assets';

interface GrassClump { x: number; z: number; y: number; scaleXZ: number; scaleY: number; color: number }

/** One 160ft grass cell: chunk-space center/radius (region-local ft) + the
 *  clump/tussock InstancedMeshes that live in it. Stored on the region
 *  group's userData so its lifecycle rides region teardown for free. */
interface GrassChunkDesc { x: number; z: number; r: number; meshes: THREE.InstancedMesh[] }
interface FloraItem { x: number; y: number; z: number; s: number; ry: number; tint: number }

export function buildGrassland(grid: TileGrid, map: MapDef) {
  const group = grid.group;   // this region's group — captured for deferred emits
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
    // world cell center — the flower/density/tall fields are world-anchored so
    // patches flow across region seams instead of repeating per region
    const cwx = orgX + x + 0.5, cwz = orgZ + z + 0.5;
    const density = hash2(x, z, 207);
    // Flower splat: dense wildflower country suppresses the grass carpet
    // entirely (both types) — the same field drives the forb layer below, so
    // flower zones and grass-free zones always agree. 0.762 ≈ top 5% of the
    // field (user ruling: splats were far too frequent; measured, not eyeballed).
    const flowerZone = biome === 'meadow' && flowerField(cwx, cwz) > 0.762;
    // Grass density is noise-modulated: lush pockets fill in, thin ground
    // sparse out (0.4x..1.25x, mean ~0.8 of the old uniform fill) — total
    // grass comes down a notch while coverage still reads full.
    const densityMult = flowerZone ? 0 : 0.4 + grassDensityField(cwx, cwz) * 0.85;
    // Tall-grass pockets: world-anchored areas where the carpet grows ~2x.
    const tallPatch = biome === 'meadow' && !flowerZone && tallGrassField(cwx, cwz) > 0.635;
    const baseCount = biome === 'meadow'
      ? grid.eng.lowgfx
        ? 7 + Math.floor(density * 6)
        : 15 + Math.floor(density * 12)
      : density > 0.28
        ? grid.eng.lowgfx ? 3 + Math.floor(density * 4) : 6 + Math.floor(density * 6)
        : 0;
    // +dither term keeps the count quantization from banding the density field
    const count = Math.floor(baseCount * densityMult + hash2(x, z, 215));
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
      const tallMul = tallPatch ? 1.9 + hash2(seed, 101, 353) * 0.35 : 1;
      const baseScale = ((biome === 'meadow' ? 1.08 : 0.9) + hash2(seed, 43, 229) * 0.45) * (tallMul > 1 ? 1.12 : 1);
      const heightScale = baseScale * (0.82 + hash2(seed, 71, 241) * 0.48) * tallMul;
      clumps.push({
        x: px, z: pz, y: grid.terrainHeightAt(px, pz),
        scaleXZ: baseScale,
        scaleY: heightScale,
        color: palette[Math.floor(hash2(seed, 59, 233) * palette.length)],
      });
    }

    // ── meadow forb & shrub layer (client PCG, world-anchored patches) ──
    // Wave 1.5 flower model (user ruling): similar flowers grow packed
    // together — tight clusters dominated by ONE species with the odd accent
    // bloom mixed in — plus sporadic individuals out in the grass, and never
    // an even carpet across the whole meadow. The flowerField top band is the
    // splat: inside it grass doesn't spawn (see the grass loop) and clusters
    // do; outside it only the sporadic layer runs.
    if (biome === 'meadow') {
      if (dirtField(cwx, cwz) < 0.60) {
        const fl = flowerField(cwx, cwz);
        if (fl > 0.762) {   // same 5% splat band the grass suppression reads
          const clusters = hash2(x, z, 9421) < 0.70 ? 1 : hash2(x, z, 9422) < 0.25 ? 2 : 0;
          for (let c = 0; c < clusters; c++) {
            const cSeed = x * 977 + z * 331 + c * 91;
            const cxp = (x + 0.2 + hash2(cSeed, 3, 9423) * 0.6) * CELL;
            const czp = (z + 0.2 + hash2(cSeed, 5, 9424) * 0.6) * CELL;
            const n = 4 + Math.floor(hash2(cSeed, 7, 9425) * 4);   // 4-7 packed blooms
            const roll = hash2(cSeed, 11, 9426);
            const bucket = roll < 0.50 ? daisies : roll < 0.78 ? buttercups : violets;
            const accent = hash2(cSeed, 13, 9427) < 0.20
              ? (roll < 0.78 ? violets : daisies)
              : null;
            for (let i = 0; i < n; i++) {
              const fSeed = cSeed * 7 + i * 13;
              const ang = hash2(fSeed, 17, 9428) * Math.PI * 2;
              const rad = (0.08 + hash2(fSeed, 19, 9429) * 0.55) * CELL;
              const fx = cxp + Math.cos(ang) * rad;
              const fz = czp + Math.sin(ang) * rad;
              const tc = grid.key(Math.floor(fx / CELL), Math.floor(fz / CELL));
              if (road.has(tc) || water.has(tc) || wall.has(tc)) continue;
              if (dirtField(orgX + fx / CELL, orgZ + fz / CELL) > 0.655) continue;
              const target = i === n - 1 && accent ? accent : bucket;
              // 2x the old scale (0.85..1.4 → 1.7..2.8) so blooms read at distance
              target.push({
                x: fx, y: grid.terrainHeightAt(fx, fz) + 0.02, z: fz,
                s: 1.7 + hash2(fSeed, 23, 9430) * 1.1,
                ry: hash2(fSeed, 29, 9431) * Math.PI * 2,
                tint: 0.92 + hash2(fSeed, 31, 9432) * 0.14,
              });
            }
          }
        } else if (fl > 0.44 && hash2(x, z, 9433) < 0.06) {
          // sporadic exception: a lone bloom out in open grass
          const fSeed = x * 131 + z * 57;
          const fx = (x + hash2(fSeed, 7, 9434)) * CELL;
          const fz = (z + hash2(fSeed, 13, 9435)) * CELL;
          const tc = grid.key(Math.floor(fx / CELL), Math.floor(fz / CELL));
          if (!road.has(tc) && !water.has(tc) && !wall.has(tc) &&
              dirtField(orgX + fx / CELL, orgZ + fz / CELL) <= 0.655) {
            const roll = hash2(fSeed, 19, 9436);
            const bucket = roll < 0.45 ? daisies : roll < 0.75 ? buttercups : violets;
            bucket.push({
              x: fx, y: grid.terrainHeightAt(fx, fz) + 0.02, z: fz,
              s: 1.9 + hash2(fSeed, 23, 9437) * 1.0,
              ry: hash2(fSeed, 29, 9438) * Math.PI * 2,
              tint: 0.92 + hash2(fSeed, 31, 9439) * 0.14,
            });
          }
        }
        const sf = shrubField(cwx, cwz);
        // density halved (4.2 → 2.1): the asset reads poorly en masse, so
        // patches keep their shape with roughly half the shrubs per cell.
        if (sf > 0.72 && hash2(x, z, 9513) < (sf - 0.72) * 2.1) {
          const sx = (x + 0.15 + hash2(x, z, 9514) * 0.7) * CELL;
          const sz = (z + 0.15 + hash2(x, z, 9515) * 0.7) * CELL;
          const tc = grid.key(Math.floor(sx / CELL), Math.floor(sz / CELL));
          if (!road.has(tc) && !water.has(tc) && !wall.has(tc)) {
            shrubs.push({
              x: sx, y: grid.terrainHeightAt(sx, sz) - 0.03, z: sz,
              s: 0.72 + hash2(x, z, 9516) * 1.0,
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
  material.customProgramCacheKey = () => 'ashenreach-instanced-grass-wind-v4';

  // ── chunked grass emission (GPU budget fix) ──────────────────────────────
  // A whole-region grass InstancedMesh owns a region-wide bounding sphere
  // (~460ft), so the frustum can never reject it: every streamed region
  // submitted ALL of its blades every frame (~150k instances × 24 tris), and
  // the shader's density collapse only flattens far blades to zero-area
  // triangles AFTER they run the full vertex pipeline. Measured on-device:
  // 35M+ triangles submitted per frame, 2-7s main-thread stalls whenever
  // regions streamed, p95 frame > 33ms even for a static scene. 160ft chunks
  // give each mesh a tight instance-union sphere the frustum CAN reject, and
  // updateGrassChunkVisibility() hard-hides chunks whose blades the shader
  // fades to nothing anyway (past 265+30ft, plus chunk radius + margin).
  // The shader falloff is untouched — visible grass reads the same; we only
  // stop submitting what nobody can see.
  const GRASS_CHUNK_FT = 160; // 32 tiles per chunk cell
  const chunkMeta = new Map<string, GrassChunkDesc>();
  const chunkFor = (x: number, z: number): GrassChunkDesc => {
    const cx = Math.floor(x / GRASS_CHUNK_FT), cz = Math.floor(z / GRASS_CHUNK_FT);
    const key = cx + ':' + cz;
    let c = chunkMeta.get(key);
    if (!c) {
      c = { x: (cx + 0.5) * GRASS_CHUNK_FT, z: (cz + 0.5) * GRASS_CHUNK_FT, r: GRASS_CHUNK_FT * 0.7071, meshes: [] };
      chunkMeta.set(key, c);
    }
    return c;
  };
  const emitChunked = (list: GrassClump[], geo: THREE.BufferGeometry | null) => {
    if (!list.length || !geo) return;
    const bins = new Map<GrassChunkDesc, GrassClump[]>();
    for (const it of list) {
      const c = chunkFor(it.x, it.z);
      const arr = bins.get(c);
      if (arr) arr.push(it); else bins.set(c, [it]);
    }
    const obj = new THREE.Object3D(), col = new THREE.Color();
    for (const [c, items] of bins) {
      const mesh = new THREE.InstancedMesh(geo, material, items.length);
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      items.forEach((it, index) => {
        obj.position.set(it.x, it.y, it.z);
        obj.rotation.y = hash2(index, 67, 239) * Math.PI * 2;
        obj.scale.set(it.scaleXZ, it.scaleY, it.scaleXZ);
        obj.updateMatrix();
        mesh.setMatrixAt(index, obj.matrix);
        col.setHex(it.color);
        mesh.setColorAt(index, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();  // tight per-chunk sphere for frustum culling
      mesh.visible = false;          // updateGrassChunkVisibility opens these up
      group.add(mesh);
      c.meshes.push(mesh);
    }
  };
  emitChunked(clumps, geometry);
  // Wild-grass tussocks share the wind-animated grass material so both grass
  // types sway together; only the geometry and instance colors differ. One
  // shared geometry per region — chunks differ only by their instances.
  emitChunked(tussocks, tussocks.length ? makeTussockGeometry(grid) : null);
  if (chunkMeta.size) (group.userData as Record<string, unknown>).grassChunks = [...chunkMeta.values()];

  // ── asset flora: meadow forbs + low shrubs (cooked kits) ───────────────
  // Kit models are static (no wind); per-instance tints keep the palette
  // variation. Deferred until the kit parse lands; dropped cleanly if the
  // region was torn down meanwhile — and always emitted into the captured
  // region group, never the mutating grid.group.
  const tintHex = (hex: number, j = 1): [number, number, number] => {
    const c = new THREE.Color(hex);
    return [c.r * j, c.g * j, c.b * j];
  };
  const emitAssetFlora = () => {
    // meadow forbs — daisy-dominant with buttercup and violet accents
    const forb = (items: FloraItem[], models: string[], salt: number) => {
      if (items.length) {
        scatterAsset(grid, models,
          items.map((it) => ({ x: it.x, y: it.y, z: it.z, s: it.s, ry: it.ry, tint: [it.tint, it.tint, it.tint] as [number, number, number] })),
          { height: 0.85, castShadow: false, group }, salt);
      }
    };
    // daisy (dominant), buttercup, violet — proportions set in the spawn loop
    forb(daisies, ['Flower_1_Clump', 'Flower_2_Clump', 'Flower_1'], 21);
    forb(buttercups, ['Flower_3_Clump', 'Flower_4_Clump', 'Flower_2'], 22);
    forb(violets, ['Flower_5_Clump', 'Flower_3_Group'], 23);
    // low woody shrubs — green foliage only. Bush / Bush_Flowers replaced the
    // deleted Bush_Large/Bush_Small family (user ruling); Bush_Common_Flowers
    // stays (Bush_Common itself is crimson-leaved and autumn-reserved).
    if (shrubs.length) {
      scatterAsset(grid, ['Bush', 'Bush_Flowers', 'Bush_Common_Flowers'],
        shrubs.map((it) => ({ x: it.x, y: it.y, z: it.z, s: it.s, ry: it.ry, tint: [it.tint, it.tint, it.tint] as [number, number, number] })),
        { height: 3.2, sink: 0.12, castShadow: false, group }, 24);
    }
  };
  if (assetsReady()) emitAssetFlora();
  else whenAssetsReady(() => { if (group.parent) emitAssetFlora(); });
}

// Per-frame chunk gate: hide grass chunks whose every blade the shader fades
// to zero anyway (uGrassCull 265ft + its 30ft fade tail, plus safety margin,
// plus the chunk radius so a partially-in-range cell never pops). Runs from
// TileGrid.update right after the grass focus uniform refresh. Regions
// without grass (dungeons, towns) carry no grassChunks and cost one Map hop.
const GRASS_GATE_FT = 265 + 30 + 24;
export function updateGrassChunkVisibility(grid: TileGrid) {
  const fx = grid.grassFocus.value.x, fz = grid.grassFocus.value.z;
  for (const region of grid.regions.values()) {
    const chunks = region.group.userData?.grassChunks as GrassChunkDesc[] | undefined;
    if (!chunks || !chunks.length) continue;
    const ox = region.origin.x, oz = region.origin.z;
    for (const c of chunks) {
      const dx = ox + c.x - fx, dz = oz + c.z - fz;
      const reach = GRASS_GATE_FT + c.r;
      const keep = dx * dx + dz * dz <= reach * reach;
      for (const m of c.meshes) { if (m.visible !== keep) m.visible = keep; }
    }
  }
}
