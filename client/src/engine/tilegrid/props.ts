// tilegrid/props.ts — prop dispatch + rock clutter pass + road dressing.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).
//
// Wave 1.5 (user feedback round):
//  - kit ground clutter (pebbles, kit rocks) now carries its terrain-normal
//    quaternion through scatterAsset — before, the quat was computed and then
//    DROPPED at the emit, leaving kit rocks upright on slopes (they jutted off
//    hillsides). Parametric scatter already honored quat.
//  - roads get dressed: RockPath_Round_Thin/Wide flagstones tile along the
//    road in a run/gap rhythm, RockPath_Round_Small_1-3 scatter on the verges.
//
// Feedback round 2 (user rulings):
//  - Rock_Medium is NOT pebble-tier clutter. It forms proper rock clusters:
//    one anchor scaled medium→large, ringed by randomly scaled medium
//    satellites (the same cluster idea as the parametric biome rocks, but
//    much larger), and EVERY piece is collision-enabled. Pebbles stay the
//    no-collision ground-clutter tier.
//  - roads are ~4x wider now (server ruling), so the flagstone runs also
//    fill laterally across the carriageway instead of reading as a thin
//    centerline, and verge rocks push further off the shoulder.
//
// Feedback round 3 (user rulings — this file):
//  - Medium-rock clusters were nesting inside each other (server prop clusters
//    stacked on top of PCG-rolled clusters) and the anchors were too small to
//    read as the "big landmark rock" they were meant to mimic. Every cluster
//    now registers its center on a shared per-region list and rejects centers
//    within MIN_CLUSTER_DIST ft. Anchors grow to 2.6–4.0 scale (≈7–10 ft),
//    satellites shrink their collider to 75% of the mesh footprint so the
//    formation stays walkable around its perimeter, and every cluster drops
//    ferns at its feet + a scatter of pebbles across the ring.
//  - PCG forest-cluster roll dropped from every 2 cells to every 4 cells with
//    the threshold raised 0.74 → 0.82 — server-placed rock props are now the
//    primary source, PCG only fills gaps.
//  - Road flagstones emit on alternating chain steps (5 ft stones were
//    stacking edge-on-edge every 5 ft). Centerline + side-stone rhythm still
//    reads; the stones just stop overlapping.

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef, PropDef } from '../types';
import type { ScatterItem } from './shared';
import { getMaterial, hash2, rngFrom } from '../materials';
import { glowSprite } from '../sprites';
import { CELL, WALL_H, dirtField, addRotatedCollider } from './shared';
import type { Collider } from './shared';
import { makeRockGeometry, makeRockMaterial, makeSnowDriftGeometry, makeTwigGeometry, scatter } from './geo';
import { scatterAsset, whenAssetsReady, assetsReady } from '../assets';

// Kit models for the asset clutter pass (see tools/cook_wave1.mjs)
const PEBBLE_MODELS = [
  'Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Round_4', 'Pebble_Round_5',
  'Pebble_Square_1', 'Pebble_Square_2', 'Pebble_Square_3', 'Pebble_Square_4', 'Pebble_Square_5',
];
// Road dressing + forest rocks (cooked 'rocks' kit)
const PATH_STONE_MODELS = ['RockPath_Round_Thin', 'RockPath_Round_Wide'];
const VERGE_ROCK_MODELS = ['RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3'];
const FOREST_ROCK_MODELS = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'];
// Medium-rock cluster sizing. Source bboxes (kit glTF): ~3.2w × 2.2h × 3.0d;
// scatterAsset normalizes model height to ROCK_EMIT.height, so at scale s a
// rock is ≈ 2.6·s tall with a ≈ 1.9·s half-extent footprint — the collider
// math below reads off those two numbers so boxes hug the visible mesh.
const ROCK_EMIT = { height: 2.6, sink: 0.32, castShadow: true };
const ROCK_HALF_PER_S = 1.9;   // collider half-extent per unit scale

// Min distance between cluster CENTERS, in world feet. Server-placed forest
// rock props and the PCG forest roll used to stack clusters on top of each
// other (a forest full of server rocks → nested anchors, 4-6 colliders each),
// which is what made those forests unwalkable. 125 ft ≈ 25 cells: formations
// read as occasional landmarks, not a carpet. Bump to 175 if still too dense.
const MIN_CLUSTER_DIST = 175;

// Undergrowth sinks the cluster accepts: ferns tucked at the anchor's feet
// and a pebble scatter across the ring. Both ride existing no-collision emit
// passes (see the fern + pebbleCluster arrays in buildProps), so nothing new
// ships to the asset pipeline.
interface ClusterExtras {
  ferns?: ScatterItem[];
  pebbles?: ScatterItem[];
}

/**
 * Spawn one medium-rock cluster (user ruling): a LARGE anchor rock with 3-6
 * randomly scaled medium satellites ringed around it, every piece aligned to
 * the terrain normal and collision-enabled. `rand` must be deterministic at
 * the call site (prop rng or cell-hash draws). `clusterCenters` is a shared,
 * per-region registry — the function bails out (returns false) if any other
 * cluster center sits within MIN_CLUSTER_DIST ft, and registers its own on a
 * successful placement. Optional `blocked` rejects satellite centers that
 * would land in water/on roads (clutter pass only — server-placed rock props
 * are already guaranteed off roads/water).
 */
function spawnMediumRockCluster(
  out: ScatterItem[],
  colliders: Collider[],
  grid: TileGrid,
  ax: number, az: number,
  rand: () => number,
  clusterCenters: { x: number; z: number }[],
  blocked?: (px: number, pz: number) => boolean,
  extras?: ClusterExtras,
): boolean {
  // Spacing gate: any already-placed cluster within MIN_CLUSTER_DIST ft
  // suppresses this one. The caller's rng draws before this check are spent
  // (they seeded the per-prop / per-cell stream), which is fine — the stream
  // is per-prop / per-cell, not a global counter.
  for (const c of clusterCenters) {
    if (Math.hypot(c.x - ax, c.z - az) < MIN_CLUSTER_DIST) return false;
  }
  clusterCenters.push({ x: ax, z: az });

  const UP = new THREE.Vector3(0, 1, 0);
  const place = (px: number, pz: number, s: number) => {
    const ground = grid.terrainHeightAt(px, pz);
    const normal = grid.terrainNormalAt(px, pz);
    const yaw = rand() * Math.PI * 2;
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, normal)
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw));
    const jit = 0.88 + rand() * 0.12;
    out.push({ x: px, y: ground, z: pz, s, rx: 0, ry: 0, rz: 0, quat, r: jit, g: jit, b: jit });
  };

  // Anchor: a proper LARGE rock now (2.6-4.0 scale ≈ 6.8-10.4 ft tall). The
  // old 1.9-2.8 range made the cluster read as loose scattered rocks; the
  // user wanted an unmistakable landmark boulder. Collider is full-footprint
  // — the anchor is the wall of the formation.
  const anchorS = 3.6 + rand() * 1.4;
  place(ax, az, anchorS);
  const aHalf = ROCK_HALF_PER_S * anchorS;
  colliders.push({
    x1: ax - aHalf, z1: az - aHalf, x2: ax + aHalf, z2: az + aHalf,
    yMin: 0, yMax: 3.6 * anchorS,
  });

  // Satellites: 3-6 medium rocks (0.9-2.1 scale ≈ 2.3-5.5 ft tall) ringed at a
  // radius that scales with the anchor so the formation breathes. The angle
  // is staggered + jittered per satellite, so no two clusters read as the
  // same rosette. Collider footprint is tightened to 75% of the mesh — the
  // formation stays walkable around its perimeter, the anchor remains the wall.
  const n = 3 + Math.floor(rand() * 4);
  const ringBase = anchorS * (2.2 + rand() * 1.4);
  const angleShift = rand() * Math.PI * 2;
  for (let k = 0; k < n; k++) {
    const ang = angleShift + (k / n) * Math.PI * 2 + (rand() - 0.5) * 0.6;
    const dist = ringBase * (0.7 + rand() * 0.6);
    const px = ax + Math.cos(ang) * dist;
    const pz = az + Math.sin(ang) * dist;
    if (blocked && blocked(px, pz)) continue;
    const s = 0.9 + rand() * 1.2;
    place(px, pz, s);
    const sHalf = ROCK_HALF_PER_S * s * 0.75;
    colliders.push({
      x1: px - sHalf, z1: pz - sHalf, x2: px + sHalf, z2: pz + sHalf,
      yMin: 0, yMax: 2.6 * s,
    });
  }

  // Undergrowth: ferns tucked at the anchor's feet + a scatter of pebbles
  // across the formation. Both ride the no-collision emit passes that
  // already exist (ferns in emitAssetClutter, pebbles in the same pass), so
  // nothing new to build — the caller just hands the arrays in.
  if (extras) {
    const fernN = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < fernN; k++) {
      const ang = rand() * Math.PI * 2;
      const dist = anchorS * (1.6 + rand() * 1.5);
      const px = ax + Math.cos(ang) * dist;
      const pz = az + Math.sin(ang) * dist;
      if (blocked && blocked(px, pz)) continue;
      const scale = 0.75 + rand() * 0.55;
      extras.ferns?.push({
        x: px, y: grid.terrainHeightAt(px, pz) + scale * 0.25, z: pz, s: scale,
        rx: 0, ry: rand() * Math.PI * 2, rz: (rand() - 0.5) * 0.2,
        r: 0.24 + rand() * 0.12, g: 0.52 + rand() * 0.18, b: 0.22 + rand() * 0.1,
      });
    }
    const pebN = 4 + Math.floor(rand() * 5);
    for (let k = 0; k < pebN; k++) {
      const ang = rand() * Math.PI * 2;
      const dist = anchorS * (1.4 + rand() * 2.2);
      const px = ax + Math.cos(ang) * dist;
      const pz = az + Math.sin(ang) * dist;
      if (blocked && blocked(px, pz)) continue;
      const pScale = 0.14 + rand() * 0.22;
      const ground = grid.terrainHeightAt(px, pz);
      const normal = grid.terrainNormalAt(px, pz);
      const quat = new THREE.Quaternion().setFromUnitVectors(UP, normal)
        .multiply(new THREE.Quaternion().setFromAxisAngle(UP, rand() * Math.PI * 2));
      extras.pebbles?.push({
        x: px, y: ground + pScale * 0.06, z: pz, s: pScale,
        rx: 0, ry: 0, rz: 0, quat,
        r: 0.55 + rand() * 0.22, g: 0.50 + rand() * 0.20, b: 0.44 + rand() * 0.18,
      });
    }
  }
  return true;
}

import { buildGrassland } from './flora';
import { buildTrees } from './trees';
import { buildCaveMouth, buildColumbarium, buildGraveFence, buildGraveGate, buildGraveMound, buildMausoleum, buildRuinColumn, buildRuinColumnFallen, buildRuinSlab, buildRuinWall, buildStreetLantern, buildTownBuilding, buildTownWell } from './structures';

// ── props ──────────────────────────────────────────────────────────────────
export function buildProps(grid: TileGrid, map: MapDef) {
  const wood = getMaterial('wood', grid.areaTiles.trim.woodVariant);
  const ironSooty = getMaterial('iron', grid.areaTiles.trim.sootVariant);
  const ironRust = getMaterial('iron', grid.areaTiles.trim.ironVariant);
  const bone = getMaterial('bone', 0);
  const coal = getMaterial('ember');
  const rocks: ScatterItem[] = [];
  const natureRocks = new Map<string, ScatterItem[]>();
  const pebbleCluster: ScatterItem[] = [];
  const kitForestRocks: ScatterItem[] = [];
  const twigs: ScatterItem[] = [];
  const wildflowers: ScatterItem[] = [];
  const ferns: ScatterItem[] = [];
  const snowDrifts: ScatterItem[] = [];
  const trees: PropDef[] = [];
  // Shared registry of cluster centers for the whole region. Both the
  // server-placed rock path and the PCG forest roll register here, so the
  // MIN_CLUSTER_DIST gate sees the full population and clusters can't nest.
  const clusterCenters: { x: number; z: number }[] = [];
  // This region's group, captured for the deferred asset emit — grid.group
  // mutates as regions stream, so a deferred callback that reaches for
  // grid.group lands every instance inside whatever region built last
  // (the origin-cluster bug).
  const group = grid.group;

  for (const p of map.props) {
    const x = p.x * CELL, z = p.z * CELL;
    const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 101));  // seeded per prop

    if (p.type === 'tree') {
      trees.push(p);
    } else if (p.type === 'building') {
      buildTownBuilding(grid, p, x, z);
    } else if (p.type === 'boulder' || p.type === 'rock' || p.type === 'scree') {
      const scale = (p.scale || 1) * (p.type === 'boulder' ? 1.9 : p.type === 'rock' ? 0.55 : 0.8);
      const ground = grid.terrainHeightAt(x, z);
      const normal = grid.terrainNormalAt(x, z);
      const shape = p.shape || (p.type === 'boulder' ? 'angular' : 'slab');
      const yaw = p.rotY ?? (r() * Math.PI * 2);
      // Forest rocks are kit models now (user ruling): Rock_Medium replaces
      // the parametric rocks in place. Boulder/scree and the other biomes
      // stay parametric — they lean on the rock shader's biome tops (snow
      // caps, ash, moss) which kit albedo cannot reproduce.
      const biomeCellsP = map.biomes?.cells;
      const kindsP = map.biomes?.kinds;
      const biomeHere = biomeCellsP && kindsP
        ? kindsP[biomeCellsP[p.z * map.size.w + p.x]]
        : undefined;
      if (p.type === 'rock' && biomeHere === 'forest') {
        // Forest rock props are cluster anchors now (user ruling): the server
        // drops a rock here, the client grows a whole medium-rock cluster
        // around it — anchor + satellites, all with collision. The cluster
        // registry (clusterCenters) rejects overlapping centers so a dense
        // run of server rocks does not stack formations. Underbrush (ferns +
        // pebbles) rides the same extras object through to the emit passes.
        spawnMediumRockCluster(
          kitForestRocks, grid.colliders, grid, x, z, r,
          clusterCenters,
          undefined,                       // server already kept these off roads/water
          { ferns, pebbles: pebbleCluster },
        );
      } else {
        const batch = natureRocks.get(shape) || [];
        // Align rock with terrain surface normal so rocks on hills sit naturally without jutting off or floating
        const qAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const quat = qAlign.multiply(qYaw);
        batch.push({
          x, y: ground + scale * 0.12, z, s: scale,
          rx: 0, ry: 0, rz: 0,
          quat,
          r: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.78 : 0.62 + r() * 0.25,
          g: p.variant === 'deadlands' ? 0.39 + r() * 0.16 : 0.58 + r() * 0.25,
          b: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.86 : 0.5 + r() * 0.24,
        });
        natureRocks.set(shape, batch);

        if (p.type === 'boulder') {
          const radius = Math.max(1.1, scale * 0.75);
          grid.colliders.push({ x1: x - radius, z1: z - radius, x2: x + radius, z2: z + radius, yMin: 0, yMax: 5 });
        }

        // PCG: Spawn realistic satellite pebble & talus cluster around boulders and large rocks
        if (p.type === 'boulder' || scale > 0.75) {
          const numTalus = p.type === 'scree' ? 5 + Math.floor(r() * 6) : 3 + Math.floor(r() * 4);
          for (let k = 0; k < numTalus; k++) {
            const angle = r() * Math.PI * 2;
            const dist = scale * (0.8 + r() * 1.2);
            const px = x + Math.cos(angle) * dist;
            const pz = z + Math.sin(angle) * dist;
            const pScale = scale * (0.16 + r() * 0.28);
            const pGround = grid.terrainHeightAt(px, pz);
            const pNormal = grid.terrainNormalAt(px, pz);
            const pYaw = r() * Math.PI * 2;
            const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
            const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pYaw);
            const pQuat = pAlign.multiply(pQYaw);
            pebbleCluster.push({
              x: px, y: pGround + pScale * 0.08, z: pz, s: pScale,
              rx: 0, ry: 0, rz: 0,
              quat: pQuat,
              r: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.76 : 0.58 + r() * 0.24,
              g: p.variant === 'deadlands' ? 0.37 + r() * 0.16 : 0.55 + r() * 0.24,
              b: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.84 : 0.48 + r() * 0.24,
            });
          }
        }
      }
    } else if (p.type === 'twig' || p.type === 'dead_brush') {
      const scale = (p.scale || 1) * (p.type === 'dead_brush' ? 0.85 : 0.65);
      const gx = x + (r() - 0.5) * 1.6, gz = z + (r() - 0.5) * 1.6;
      twigs.push({
        x: gx, y: grid.terrainHeightAt(gx, gz) + scale * 0.15, z: gz, s: scale,
        rx: (r() - 0.5) * 0.4, ry: p.rotY || r() * Math.PI * 2, rz: (r() - 0.5) * 0.4,
        r: 0.38 + r() * 0.12, g: 0.28 + r() * 0.1, b: 0.2 + r() * 0.08,
      });
    } else if (p.type === 'wildflower') {
      const scale = (p.scale || 1) * 0.55;
      const gx = x + (r() - 0.5) * 1.8, gz = z + (r() - 0.5) * 1.8;
      // Rich palette: poppy red, marigold amber, violet, cornflower blue
      const flowerCols = [
        [0.92, 0.24, 0.24],
        [0.95, 0.72, 0.18],
        [0.72, 0.38, 0.90],
        [0.34, 0.58, 0.95],
      ];
      const chosen = flowerCols[Math.floor(r() * flowerCols.length)];
      wildflowers.push({
        x: gx, y: grid.terrainHeightAt(gx, gz) + scale * 0.35, z: gz, s: scale,
        rx: 0, ry: r() * Math.PI * 2, rz: (r() - 0.5) * 0.2,
        r: chosen[0], g: chosen[1], b: chosen[2],
      });
    } else if (p.type === 'fern') {
      const scale = (p.scale || 1) * 0.75;
      const gx = x + (r() - 0.5) * 1.7, gz = z + (r() - 0.5) * 1.7;
      ferns.push({
        x: gx, y: grid.terrainHeightAt(gx, gz) + scale * 0.25, z: gz, s: scale,
        rx: 0, ry: r() * Math.PI * 2, rz: (r() - 0.5) * 0.2,
        r: 0.24 + r() * 0.12, g: 0.52 + r() * 0.18, b: 0.22 + r() * 0.1,
      });
    } else if (p.type === 'snow_drift') {
      const scale = (p.scale || 1) * 1.25;
      const gx = x + (r() - 0.5) * 2.0, gz = z + (r() - 0.5) * 2.0;
      snowDrifts.push({
        x: gx, y: grid.terrainHeightAt(gx, gz) + scale * 0.22, z: gz, s: scale,
        rx: 0, ry: r() * Math.PI * 2, rz: 0,
        r: 0.88, g: 0.92, b: 0.98,
      });
    } else if (p.type === 'bridge') {
      const bg = new THREE.Group();
      const bWidth = (p.width || 2.4) * CELL;
      const bLength = (p.length || 5.0) * CELL;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.45, bLength), wood);
      deck.position.y = 0.22;
      deck.receiveShadow = true;
      deck.castShadow = true;
      bg.add(deck);

      // Side beam supports and handrails
      const railMat = getMaterial('wood', 0);
      const railOffset = bWidth / 2 - 0.45;
      for (const side of [-railOffset, railOffset]) {
        const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, bLength + 0.2), railMat);
        stringer.position.set(side, 0.1, 0);
        stringer.castShadow = true;
        bg.add(stringer);

        const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, bLength + 0.2), railMat);
        handrail.position.set(side, 2.2, 0);
        handrail.castShadow = true;
        bg.add(handrail);

        const postCount = 6;
        for (let pi = 0; pi < postCount; pi++) {
          const pz = -bLength / 2 + (bLength / (postCount - 1)) * pi;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.1, 0.35), railMat);
          post.position.set(side, 1.1, pz);
          post.castShadow = true;
          bg.add(post);
        }
      }
      bg.position.set(x, grid.terrainHeightAt(x, z) + 0.18, z);
      bg.rotation.y = p.rotY || 0;
      grid.group.add(bg);
    } else if (p.type === 'grave_marker') {
      const marker = new THREE.Group();
      const stone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.45), bone);
      stone.position.y = 1.25; stone.castShadow = true; marker.add(stone);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 0.55), bone);
      cap.position.y = 2.45; marker.add(cap);
      marker.position.set(x, grid.terrainHeightAt(x, z), z);
      marker.rotation.y = p.rotY || 0;
      grid.group.add(marker);
    } else if (p.type === 'ruin_pillar') {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 4.5 * (p.scale || 1), 7), bone);
      pillar.position.set(x, grid.terrainHeightAt(x, z) + 2.25 * (p.scale || 1), z);
      pillar.rotation.z = 0.12 * (p.scale || 1);
      pillar.castShadow = true; pillar.receiveShadow = true;
      grid.group.add(pillar);
      // Quick win: this solid stone column used to be walk-through — match the
      // visible footprint (server GameManager.propFootprint mirrors this box).
      const ps = p.scale || 1;
      grid.colliders.push({ x1: x - 1.1 * ps, z1: z - 1.1 * ps, x2: x + 1.1 * ps, z2: z + 1.1 * ps, yMin: 0, yMax: 4.5 * ps + 1 });
    } else if (p.type === 'ruin_column') {
      buildRuinColumn(grid, p, x, z);
    } else if (p.type === 'ruin_column_fallen') {
      buildRuinColumnFallen(grid, p, x, z);
    } else if (p.type === 'ruin_wall') {
      buildRuinWall(grid, p, x, z);
    } else if (p.type === 'ruin_slab') {
      buildRuinSlab(grid, p, x, z);
    } else if (p.type === 'grave_gate') {
      buildGraveGate(grid, p, x, z);
    } else if (p.type === 'grave_fence') {
      buildGraveFence(grid, p, x, z);
    } else if (p.type === 'grave_mound') {
      buildGraveMound(grid, p, x, z);
    } else if (p.type === 'mausoleum') {
      buildMausoleum(grid, p, x, z);
    } else if (p.type === 'columbarium') {
      buildColumbarium(grid, p, x, z);
    } else if (p.type === 'cave_entrance') {
      buildCaveMouth(grid, x, z);
    } else if (p.type === 'well') {
      buildTownWell(grid, x, z);
    } else if (p.type === 'street_lantern') {
      buildStreetLantern(grid, x, z);
    } else if (p.type === 'brazier') {
      const g = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.0, 1.8, 10), ironSooty);
      bowl.position.y = 3.4; bowl.castShadow = true; g.add(bowl);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.17, 8, 18), ironRust);
      rim.rotation.x = Math.PI / 2; rim.position.y = 4.28; g.add(rim);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.6, 3.1, 8), ironSooty);
      stand.position.y = 1.6; stand.castShadow = true; g.add(stand);
      // glowing coal bed
      for (let i = 0; i < 5; i++) {
        const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + r() * 0.22, 0), coal);
        c.position.set((r() - 0.5) * 1.7, 4.05 + r() * 0.35, (r() - 0.5) * 1.7);
        c.rotation.set(r() * 3, r() * 3, r() * 3);
        g.add(c);
      }
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSprite(), color: 0xff8a3a, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      glow.scale.setScalar(4.6); glow.position.y = 4.3; g.add(glow);
      g.position.set(x, 0, z);
      grid.group.add(g);
      // LOW prop: blocks legs, never the sightline (starts at head height)
      grid.colliders.push({ x1: x - 1.4, z1: z - 1.4, x2: x + 1.4, z2: z + 1.4, yMin: 0, yMax: 4 });
    } else if (p.type === 'pillar') {
      const g = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.45, WALL_H, 12), bone);
      shaft.position.y = WALL_H / 2; shaft.castShadow = true; shaft.receiveShadow = true; g.add(shaft);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 5.4), bone);
      cap.position.y = WALL_H - 0.55; cap.castShadow = true; g.add(cap);
      const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.0, 5.8), bone);
      base.position.y = 0.5; base.receiveShadow = true; g.add(base);
      // rubble scatter around the base
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, rr = 3.0 + r() * 1.5;
        const s = 0.32 + r() * 0.55;
        rocks.push({
          x: x + Math.cos(a) * rr, y: s * 0.5 + 0.08, z: z + Math.sin(a) * rr,
          s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
          r: 0.5 + r() * 0.3, g: 0.48 + r() * 0.3, b: 0.44 + r() * 0.3
        });
      }
      g.position.set(x, 0, z);
      grid.group.add(g);
      grid.colliders.push({ x1: x - 2.4, z1: z - 2.4, x2: x + 2.4, z2: z + 2.4, yMin: 0, yMax: WALL_H });
    } else if (p.type === 'coffin') {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 8.6), wood);
      box.position.y = 1.2; box.castShadow = true; box.receiveShadow = true; g.add(box);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 8.2, 10, 1, false, 0, Math.PI), wood);
      lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2;
      lid.position.y = 2.4; lid.castShadow = true; g.add(lid);
      g.position.set(x, 0, z);
      g.rotation.y = p.rotY || 0;
      grid.group.add(g);
      addRotatedCollider(grid.colliders, x, z, 0, 0, 2.1, 4.3, 0, 3, p.rotY || 0);
    } else if (p.type === 'altar') {
      const g = new THREE.Group();
      const block = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 6), bone);
      block.position.y = 1.6; block.castShadow = true; block.receiveShadow = true; g.add(block);
      const step = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 8), bone);
      step.position.y = 0.6; step.receiveShadow = true; g.add(step);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSprite(), color: 0x7fd4c8, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      glow.scale.setScalar(7); glow.position.y = 5; g.add(glow);
      g.position.set(x, 0, z);
      g.rotation.y = p.rotY || 0;
      grid.group.add(g);
      addRotatedCollider(grid.colliders, x, z, 0, 0, 5, 3, 0, 3.5, p.rotY || 0);
    } else if (p.type === 'rubble') {
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const s = 0.4 + r() * 1.1;
        rocks.push({
          x: x + (r() - 0.5) * 3, y: s * 0.45 + 0.08, z: z + (r() - 0.5) * 3,
          s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
          r: 0.45 + r() * 0.35, g: 0.43 + r() * 0.35, b: 0.4 + r() * 0.35
        });
      }
    }
  }
  // PCG: Spawn landscape pebble & rock clusters across open terrain biomes.
  // The shared clusterCenters list passes through so PCG forest clusters
  // respect the same MIN_CLUSTER_DIST gate the server-placed rocks did.
  buildRockClutter(grid, map, pebbleCluster, natureRocks, kitForestRocks, clusterCenters, ferns);
  // Wave 1.5: flagstones + verge rocks along the road network
  buildRoadDressing(grid, map, group);

  const rockMat = makeRockMaterial(grid, );
  // Loose rubble in crypt/dungeons and ruins now uses sculpted talus and rock shader
  if (rocks.length) {
    scatter(grid, rocks, makeRockGeometry(grid, 'talus'), rockMat);
  }
  for (const [shape, batch] of natureRocks) {
    scatter(grid, batch, makeRockGeometry(grid, shape), rockMat);
  }
  // Scatter the PCG talus & companion pebbles around boulders, scree, and field clusters.
  // Wave 1: pebbles/wildflowers/ferns are kit assets now (flat-based models sit
  // upright, so the old tumble tilt is dropped for them); talus, rocks, twigs
  // and snow drifts stay parametric — they are shared with dungeon rubble and
  // structures.
  const emitAssetClutter = () => {
    if (pebbleCluster.length) {
      // quat: terrain-normal alignment computed at spawn time — dropped at this
      // emit once (upright kit pebbles jutted off slopes), honored now.
      scatterAsset(grid, PEBBLE_MODELS,
        pebbleCluster.map(({ x, y, z, s, quat, r, g, b }) => ({ x, y, z, s, quat, tint: [r, g, b] as [number, number, number] })),
        { height: 0.55, castShadow: false, group }, 31);
    }
    if (kitForestRocks.length) {
      scatterAsset(grid, FOREST_ROCK_MODELS,
        kitForestRocks.map(({ x, y, z, s, quat, r, g, b }) => ({ x, y, z, s, quat, tint: [r, g, b] as [number, number, number] })),
        ROCK_EMIT, 43);
    }
    if (wildflowers.length) {
      scatterAsset(grid, ['Clover_1', 'Clover_2', 'Flower_3_Single', 'Plant_7'],
        wildflowers.map(({ x, y, z, s, ry, r, g, b }) => ({ x, y, z, s, ry, tint: [r, g, b] as [number, number, number] })),
        { height: 0.7, castShadow: false, group }, 32);
    }
    if (ferns.length) {
      scatterAsset(grid, ['Fern_1', 'Plant_1_Big', 'Plant_7_Big'],
        ferns.map(({ x, y, z, s, ry, r, g, b }) => ({ x, y, z, s, ry, tint: [r, g, b] as [number, number, number] })),
        { height: 1.6, castShadow: false, group }, 33);
    }
  };
  if (assetsReady()) emitAssetClutter();
  else whenAssetsReady(() => { if (group.parent) emitAssetClutter(); });

  // Model and scatter ground clutter with dedicated assets (replacing generic white cones)
  if (twigs.length) {
    const twigGeo = makeTwigGeometry(grid, );
    scatter(grid, twigs, twigGeo, new THREE.MeshStandardMaterial({ color: 0x4a3b2e, roughness: 0.94 }));
  }
  if (snowDrifts.length) {
    const snowGeo = makeSnowDriftGeometry(grid, );
    scatter(grid, snowDrifts, snowGeo, new THREE.MeshStandardMaterial({ color: 0xecf2fa, roughness: 0.82 }));
  }
  // PCG: fallen-branch litter around trees — a few twigs in the leaf-out zone
  // make stands read lived-in instead of planted
  for (const t of trees) {
    const tr = rngFrom(hash2(t.x * 64 | 0, t.z * 64 | 0, 5501));
    if (tr() > 0.62) continue;
    const n = 1 + (tr() < 0.4 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const ang = tr() * Math.PI * 2;
      const dist = 1.0 + tr() * 2.8;
      const gx = t.x * CELL + Math.cos(ang) * dist;
      const gz = t.z * CELL + Math.sin(ang) * dist;
      const s = 0.45 + tr() * 0.55;
      twigs.push({
        x: gx, y: grid.terrainHeightAt(gx, gz) + s * 0.12, z: gz, s,
        rx: (tr() - 0.5) * 0.5, ry: tr() * Math.PI * 2, rz: (tr() - 0.5) * 0.5,
        r: 0.40 + tr() * 0.10, g: 0.30 + tr() * 0.08, b: 0.21 + tr() * 0.06,
      });
    }
  }
  buildTrees(grid, trees);
  buildGrassland(grid, map);
}

// ── PCG ground clutter & pebble clusters ────────────────────────────────────
export function buildRockClutter(
  grid: TileGrid,
  map: MapDef,
  pebbleCluster: ScatterItem[],
  natureRocks: Map<string, ScatterItem[]>,
  kitForestRocks: ScatterItem[],
  clusterCenters: { x: number; z: number }[],
  ferns: ScatterItem[],
) {
  const biomeCells = map.biomes?.cells;
  const kinds = map.biomes?.kinds;
  if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;

  const road = new Set((map.cells.road || []).map(([x, z]) => grid.key(x, z)));
  const water = new Set((map.cells.water || []).map(([x, z]) => grid.key(x, z)));
  const wall = new Set(map.cells.wall.map(([x, z]) => grid.key(x, z)));
  const townCenter = { x: 56.5, z: 55.5 };

  // border cells included — region seams must carry the same clutter density
  // as region interiors (the old 2-cell inset read as a hard seam).
  // Step is 4 now (was 2): server-placed rock props are the PRIMARY source of
  // forest clusters, so PCG only fills gaps. Combined with MIN_CLUSTER_DIST
  // this drops forest cluster density by roughly an order of magnitude.
  for (let z = 0; z < map.size.h; z += 4) {
    for (let x = 0; x < map.size.w; x += 4) {
      const cell = grid.key(x, z);
      if (road.has(cell) || water.has(cell) || wall.has(cell)) continue;
      if (Math.hypot(x - townCenter.x, z - townCenter.z) < 14) continue;

      const biome = kinds[biomeCells[z * map.size.w + x]];

      // Dirt-patch pebbles: bare splat ground gets sparse exposed grit, which
      // reads nicely in meadows and ties into the terrain's dirt tint.
      const orgX = map.worldOriginFt ? map.worldOriginFt.x / CELL : 0;
      const orgZ = map.worldOriginFt ? map.worldOriginFt.z / CELL : 0;
      const dirt = dirtField(orgX + x, orgZ + z);
      if (dirt > 0.66 && (biome === 'meadow' || biome === 'forest') && hash2(x, z, 9407) > 0.5) {
        const px = x * CELL + (0.2 + hash2(x, z, 9409) * 0.6) * CELL;
        const pz = z * CELL + (0.2 + hash2(z, x, 9411) * 0.6) * CELL;
        const n = 1 + Math.floor(hash2(x, z, 9413) * 2.4);
        for (let k = 0; k < n; k++) {
          const ang = hash2(k, x + z, 9415) * Math.PI * 2;
          const dist = 0.3 + hash2(k, x - z, 9417) * 2.2;
          const gx = px + Math.cos(ang) * dist, gz = pz + Math.sin(ang) * dist;
          const gCell = grid.key(Math.floor(gx / CELL), Math.floor(gz / CELL));
          if (water.has(gCell) || road.has(gCell) || wall.has(gCell)) continue;
          const pScale = 0.09 + hash2(k, x * 3 + z, 9419) * 0.16;
          const ground = grid.terrainHeightAt(gx, gz);
          const pNormal = grid.terrainNormalAt(gx, gz);
          const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
          const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash2(k, z, 9421) * Math.PI * 2);
          pebbleCluster.push({
            x: gx, y: ground + pScale * 0.06, z: gz, s: pScale,
            rx: 0, ry: 0, rz: 0, quat: pAlign.multiply(pQYaw),
            r: 0.55 + hash2(k, x, 9423) * 0.22,
            g: 0.50 + hash2(k, z, 9425) * 0.20,
            b: 0.44 + hash2(k, x + 1, 9427) * 0.18,
          });
        }
      }

      const clusterRoll = hash2(x, z, 4001);

      let spawnCluster = false;
      let clusterCount = 0;
      let baseScale = 0.25;

      if (biome === 'mountains') {
        if (clusterRoll > 0.42) {
          spawnCluster = true;
          clusterCount = 4 + Math.floor(hash2(x, z, 4002) * 5);
          baseScale = 0.28 + hash2(x, z, 4003) * 0.24;
        }
      } else if (biome === 'forest') {
        // Forest clusters are WHOLE medium-rock clusters now (handled right
        // after the gate — anchor + satellites + collision). PCG's roll is a
        // gap-filler only: threshold raised 0.74 → 0.82 because server-placed
        // rock props carry most of the load, and MIN_CLUSTER_DIST rejects any
        // center too near an existing formation.
        if (clusterRoll > 0.82) spawnCluster = true;
      } else if (biome === 'meadow') {
        if (clusterRoll > 0.82) {
          spawnCluster = true;
          clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 3);
          baseScale = 0.18 + hash2(x, z, 4003) * 0.16;
        }
      } else if (biome === 'deadlands') {
        if (clusterRoll > 0.62) {
          spawnCluster = true;
          clusterCount = 3 + Math.floor(hash2(x, z, 4002) * 4);
          baseScale = 0.24 + hash2(x, z, 4003) * 0.22;
        }
      } else if (biome === 'snowfield' || biome === 'snow_forest') {
        if (clusterRoll > 0.68) {
          spawnCluster = true;
          clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 4);
          baseScale = 0.24 + hash2(x, z, 4003) * 0.20;
        }
      }

      if (!spawnCluster) continue;

      const cx = x * CELL + CELL * 0.5;
      const cz = z * CELL + CELL * 0.5;

      if (biome === 'forest') {
        // Forest clusters are medium-rock clusters (user ruling): one large
        // Rock_Medium anchor + 3-6 randomly scaled medium satellites, every
        // piece collision-enabled and terrain-normal aligned — plus a pebble
        // ring at the cluster's feet. The shared clusterCenters registry
        // rejects overlapping centers, and the placement return value gates
        // the foot-ring so a rejected cluster drops NOTHING (no orphan
        // pebbles). All draws are hash-bound to the cell, so streamed
        // neighbors and reloads spawn the identical cluster.
        const blocked = (px: number, pz: number) => {
          const pc = grid.key(Math.floor(px / CELL), Math.floor(pz / CELL));
          return water.has(pc) || road.has(pc) || wall.has(pc);
        };
        const placed = spawnMediumRockCluster(
          kitForestRocks, grid.colliders, grid, cx, cz,
          rngFrom(hash2(x, z, 4021)),
          clusterCenters, blocked,
          { ferns, pebbles: pebbleCluster },
        );
        if (placed) {
          const ringRng = rngFrom(hash2(x, z, 4023));
          const ringN = 2 + Math.floor(hash2(x, z, 4025) * 3);
          for (let k = 0; k < ringN; k++) {
            const ang = ringRng() * Math.PI * 2;
            const dist = 4.5 + ringRng() * 4.5;
            const px = cx + Math.cos(ang) * dist;
            const pz = cz + Math.sin(ang) * dist;
            const pc = grid.key(Math.floor(px / CELL), Math.floor(pz / CELL));
            if (water.has(pc) || road.has(pc) || wall.has(pc)) continue;
            const pScale = 0.14 + hash2(k, x + z, 4027) * 0.16;
            const pGround = grid.terrainHeightAt(px, pz);
            const pNormal = grid.terrainNormalAt(px, pz);
            const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
            const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ringRng() * Math.PI * 2);
            pebbleCluster.push({
              x: px, y: pGround + pScale * 0.06, z: pz, s: pScale,
              rx: 0, ry: 0, rz: 0, quat: pAlign.multiply(pQYaw),
              r: 0.58 + hash2(k, x, 4029) * 0.22,
              g: 0.55 + hash2(k, z, 4031) * 0.20,
              b: 0.50 + hash2(k, x + z, 4033) * 0.20,
            });
          }
        }
        continue;
      }

      for (let k = 0; k < clusterCount; k++) {
        const kSeed = k + z * 103 + x * 991;
        const angle = hash2(kSeed, 11, 4004) * Math.PI * 2;
        const dist = (0.3 + hash2(kSeed, 23, 4005) * 1.8) * CELL * 0.45;
        const px = cx + Math.cos(angle) * dist;
        const pz = cz + Math.sin(angle) * dist;

        const pCell = grid.key(Math.floor(px / CELL), Math.floor(pz / CELL));
        if (water.has(pCell) || wall.has(pCell)) continue;

        const pScale = baseScale * (0.65 + hash2(kSeed, 37, 4006) * 0.7);
        const ground = grid.terrainHeightAt(px, pz);
        const rotX = hash2(kSeed, 41, 4007) * 3;
        const rotY = hash2(kSeed, 53, 4008) * 3;
        const rotZ = hash2(kSeed, 67, 4009) * 3;

        let rCol = 0.58 + hash2(kSeed, 71, 4010) * 0.24;
        let gCol = 0.55 + hash2(kSeed, 79, 4011) * 0.24;
        let bCol = 0.50 + hash2(kSeed, 83, 4012) * 0.24;

        if (biome === 'snowfield' || biome === 'snow_forest') {
          rCol = 0.76 + hash2(kSeed, 71, 4010) * 0.16;
          gCol = 0.80 + hash2(kSeed, 79, 4011) * 0.16;
          bCol = 0.88 + hash2(kSeed, 83, 4012) * 0.10;
        } else if (biome === 'deadlands') {
          rCol = 0.34 + hash2(kSeed, 71, 4010) * 0.14;
          gCol = 0.32 + hash2(kSeed, 79, 4011) * 0.12;
          bCol = 0.30 + hash2(kSeed, 83, 4012) * 0.12;
        }

        const pNormal = grid.terrainNormalAt(px, pz);
        const pYaw = hash2(kSeed, 53, 4008) * Math.PI * 2;
        const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
        const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pYaw);
        const quat = pAlign.multiply(pQYaw);

        if (pScale > 0.42) {
          const shape = hash2(kSeed, 89, 4013) > 0.5 ? 'talus' : 'angular';
          const batch = natureRocks.get(shape) || [];
          batch.push({
            x: px, y: ground + pScale * 0.10, z: pz, s: pScale,
            rx: 0, ry: 0, rz: 0,
            quat,
            r: rCol, g: gCol, b: bCol,
          });
          natureRocks.set(shape, batch);
        } else {
          pebbleCluster.push({
            x: px, y: ground + pScale * 0.06, z: pz, s: pScale,
            rx: 0, ry: 0, rz: 0,
            quat,
            r: rCol, g: gCol, b: bCol,
          });
        }
      }
    }
  }
}

// ── road dressing: flagstones + verge scatter (Wave 1.5) ───────────────────
// RockPath_Round_Thin/Wide flagstones tile ALONG the road spline in a run/gap
// rhythm (user spec: 3 in a row -> random skip -> random skip -> 3-5 in a row
// -> skip a few -> repeat), and RockPath_Round_Small_1-3 scatter on the verges
// with a random spawn chance. Both align to the terrain normal (the
// ground-clutter rule — unlike grass and trees, stones follow the surface);
// yaw follows the local road direction. Everything is hash-deterministic per
// cell, so streamed neighbors and reloads agree.
//
// Feedback round 3: flagstones emit on ALTERNATING chain steps. The chain
// visits one cell per step (5 ft), and flagstones are ~5 ft wide, so per-step
// emission stacked them edge-on-edge everywhere — the "clustering" complaint.
// Alternating steps give ~10 ft spacing; the run/gap rhythm still reads.
const ROAD_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function buildRoadDressing(grid: TileGrid, map: MapDef, group: THREE.Group) {
  const roadCells: { x: number; z: number }[] = (map.cells.road || []).map(([x, z]) => ({ x, z }));
  for (const h of map.cells.halfTiles || []) if (h.type === 'road') roadCells.push({ x: h.x, z: h.z });
  if (!roadCells.length) return;

  const W = map.size.w, H = map.size.h;
  const lkey = (x: number, z: number) => z * W + x;   // region-local cell index
  const cellSet = new Set(roadCells.map((c) => lkey(c.x, c.z)));
  const water = new Set((map.cells.water || []).map(([x, z]) => grid.key(x, z)));
  const wall = new Set(map.cells.wall.map(([x, z]) => grid.key(x, z)));

  // Trace the road network into ordered polylines so the run/gap rhythm follows
  // the road instead of hash order. Endpoints first (degree-1 cells), then any
  // remaining junction webs; the heading-scored greedy keeps straight roads
  // smooth and the visited set gives every cell exactly one chain.
  const visited = new Set<number>();
  const chains: { x: number; z: number }[][] = [];
  const trace = (sx: number, sz: number) => {
    const chain = [{ x: sx, z: sz }];
    visited.add(lkey(sx, sz));
    let cx = sx, cz = sz, px = sx, pz = sz;
    for (;;) {
      let hx = cx - px, hz = cz - pz;
      if (hx === 0 && hz === 0) { hx = 1; hz = 0; }
      let bestD: number[] | null = null, bestScore = -Infinity;
      for (const [dx, dz] of ROAD_DIRS) {
        const nx = cx + dx, nz = cz + dz;
        const k = lkey(nx, nz);
        if (!cellSet.has(k) || visited.has(k)) continue;
        const score = (dx * hx + dz * hz) / (Math.hypot(dx, dz) || 1) - k * 1e-9;
        if (score > bestScore) { bestScore = score; bestD = [dx, dz]; }
      }
      if (!bestD) break;
      px = cx; pz = cz;
      cx += bestD[0]; cz += bestD[1];
      visited.add(lkey(cx, cz));
      chain.push({ x: cx, z: cz });
    }
    return chain;
  };
  const endpoints = roadCells
    .filter((c) => ROAD_DIRS.filter(([dx, dz]) => cellSet.has(lkey(c.x + dx, c.z + dz))).length <= 1)
    .sort((a, b) => lkey(a.x, a.z) - lkey(b.x, b.z));
  for (const e of endpoints) if (!visited.has(lkey(e.x, e.z))) chains.push(trace(e.x, e.z));
  const leftovers = roadCells
    .filter((c) => !visited.has(lkey(c.x, c.z)))
    .sort((a, b) => lkey(a.x, a.z) - lkey(b.x, b.z));
  for (const c of leftovers) if (!visited.has(lkey(c.x, c.z))) chains.push(trace(c.x, c.z));

  const stones: ScatterItem[] = [];
  const verge: ScatterItem[] = [];
  const UP = new THREE.Vector3(0, 1, 0);

  chains.forEach((chain, ci) => {
    // run/gap phase machine: 0=run 3, 1/2=random skip, 3=run 3-5, 4=skip a few;
    // after the intro cycle it alternates run 3-5 <-> skip a few forever.
    let phase = 0, segLeft = 0, placing = false;
    for (let step = 0; step < chain.length; step++) {
      const c = chain[step];
      const prevC = chain[step - 1] || c, nextC = chain[step + 1] || c;
      let dx = nextC.x - prevC.x, dz = nextC.z - prevC.z;
      if (dx === 0 && dz === 0) { dx = 1; dz = 0; }
      const dl = Math.hypot(dx, dz) || 1;
      dx /= dl; dz /= dl;
      const perpX = dz, perpZ = -dx;

      if (segLeft === 0) {
        const h = hash2(ci * 31 + step, phase, 9701);
        if (phase === 0) { placing = true; segLeft = 3; }
        else if (phase === 1 || phase === 2) { placing = false; segLeft = h < 0.55 ? 1 : h < 0.75 ? 2 : 0; }
        else if (phase === 3) { placing = true; segLeft = 3 + Math.floor(h * 3); }
        else { placing = false; segLeft = 2 + Math.floor(h * 3); }
        phase = phase >= 3 ? (phase === 4 ? 3 : 4) : phase + 1;
      }
      // Half density: emit only on alternating chain steps. Flagstones are
      // ~5 ft wide and the chain visits one cell per step (5 ft), so per-step
      // emission stacked them edge-on-edge — the "clustering" complaint.
      // Alternating steps give ~10 ft spacing; the run/gap rhythm still reads.
      if (placing && segLeft > 0 && ((step + ci) & 1) === 0) {
        const hS = hash2(c.x * 7 + c.z, 53, 9703);
        const yaw = Math.atan2(dx, dz) + (hS - 0.5) * 0.5;
        const lat = (hash2(c.x * 3 + c.z, 59, 9705) - 0.5) * 0.7 * CELL;
        const wx = (c.x + 0.5) * CELL + perpX * lat;
        const wz = (c.z + 0.5) * CELL + perpZ * lat;
        const ground = grid.terrainHeightAt(wx, wz);
        const normal = grid.terrainNormalAt(wx, wz);
        const jit = 0.92 + hS * 0.1;
        stones.push({
          x: wx, y: ground + 0.04, z: wz,
          s: 0.85 + hash2(c.x + c.z, 61, 9707) * 0.35,
          rx: 0, ry: 0, rz: 0,
          quat: new THREE.Quaternion().setFromUnitVectors(UP, normal)
            .multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw)),
          r: jit, g: jit, b: jit,
        });
        // Wide-carriageway fill (user ruling: roads ~4x wider): the traced
        // chain visits one cell per step, so on the new 4-5 cell roads the
        // run/gap rhythm would read as a thin centerline. Side stones at
        // lateral offsets fill the road body — each rides its own cell hash,
        // and only spawns while it still sits on a road cell. Chance dropped
        // 38% → 30% so the wider fill does not re-create the pile-up the
        // centerline step-collapse just fixed.
        for (const side of [-1, 1]) {
          if (hash2(c.x * 5 + side * 17, c.z, 9727) > 0.70) continue;
          const latOff = (1.1 + hash2(c.x + side, c.z * 7, 9731) * 0.9) * CELL;
          const sxw = wx + perpX * side * latOff;
          const szw = wz + perpZ * side * latOff;
          const gx = Math.floor(sxw / CELL), gz = Math.floor(szw / CELL);
          if (gx < 0 || gz < 0 || gx >= W || gz >= H) continue;
          if (!cellSet.has(lkey(gx, gz))) continue;
          const sGround = grid.terrainHeightAt(sxw, szw);
          const sNormal = grid.terrainNormalAt(sxw, szw);
          const sJit = 0.9 + hash2(gx, gz, 9733) * 0.12;
          stones.push({
            x: sxw, y: sGround + 0.04, z: szw,
            s: 0.85 + hash2(gx + gz, 61, 9707) * 0.35,
            rx: 0, ry: 0, rz: 0,
            quat: new THREE.Quaternion().setFromUnitVectors(UP, sNormal)
              .multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw)),
            r: sJit, g: sJit, b: sJit,
          });
        }
      }
      segLeft--;

      // verge rocks: independent per-cell chance, pushed off the shoulder —
      // the offset base moved out (2.4–4.2 cells) so scatter clears the
      // wider carriageway instead of landing on its outer cells; the road
      // membership check still rejects anything that math lands in-road.
      if (hash2(c.x, c.z, 9711) < 0.34) {
        const side = hash2(c.x, c.z, 9713) < 0.5 ? 1 : -1;
        const dist = (2.4 + hash2(c.x, c.z, 9715) * 1.8) * CELL;
        const wx = (c.x + 0.5) * CELL + perpX * side * dist + (hash2(c.x, c.z, 9717) - 0.5) * CELL;
        const wz = (c.z + 0.5) * CELL + perpZ * side * dist + (hash2(c.z, c.x, 9719) - 0.5) * CELL;
        const gx = Math.floor(wx / CELL), gz = Math.floor(wz / CELL);
        if (gx >= 0 && gz >= 0 && gx < W && gz < H) {
          const k = grid.key(gx, gz);
          if (!cellSet.has(lkey(gx, gz)) && !water.has(k) && !wall.has(k)) {
            const ground = grid.terrainHeightAt(wx, wz);
            const normal = grid.terrainNormalAt(wx, wz);
            const yaw = hash2(c.x, c.z, 9721) * Math.PI * 2;
            const jit = 0.9 + hash2(c.x, c.z, 9725) * 0.12;
            verge.push({
              x: wx, y: ground + 0.05, z: wz,
              s: 0.75 + hash2(c.x, c.z, 9723) * 0.55,
              rx: 0, ry: 0, rz: 0,
              quat: new THREE.Quaternion().setFromUnitVectors(UP, normal)
                .multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw)),
              r: jit, g: jit, b: jit,
            });
          }
        }
      }
    }
  });

  const emit = () => {
    if (stones.length) {
      // variant pick (thin vs wide) is scatterAsset's per-position hash — the
      // run pattern stays, the stone shapes vary within it
      scatterAsset(grid, PATH_STONE_MODELS,
        stones.map(({ x, y, z, s, quat, r, g, b }) => ({ x, y, z, s, quat, tint: [r, g, b] as [number, number, number] })),
        { height: 0.42, sink: 0.06, castShadow: false, group }, 44);
    }
    if (verge.length) {
      scatterAsset(grid, VERGE_ROCK_MODELS,
        verge.map(({ x, y, z, s, quat, r, g, b }) => ({ x, y, z, s, quat, tint: [r, g, b] as [number, number, number] })),
        { height: 0.45, sink: 0.08, castShadow: false, group }, 45);
    }
  };
  if (assetsReady()) emit();
  else whenAssetsReady(() => { if (group.parent) emit(); });
}