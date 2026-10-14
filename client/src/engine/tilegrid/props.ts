// tilegrid/props.ts — prop dispatch + rock clutter pass.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef, PropDef } from '../types';
import type { ScatterItem } from './shared';
import { getMaterial, hash2, rngFrom } from '../materials';
import { glowSprite } from '../sprites';
import { CELL, WALL_H, dirtField, addRotatedCollider } from './shared';
import { makeFernGeometry, makeRockGeometry, makeRockMaterial, makeSnowDriftGeometry, makeTwigGeometry, makeWildflowerGeometry, scatter } from './geo';
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
  const twigs: ScatterItem[] = [];
  const wildflowers: ScatterItem[] = [];
  const ferns: ScatterItem[] = [];
  const snowDrifts: ScatterItem[] = [];
  const trees: PropDef[] = [];

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
      const batch = natureRocks.get(shape) || [];
      const yaw = p.rotY ?? (r() * Math.PI * 2);
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
  // PCG: Spawn landscape pebble & rock clusters across open terrain biomes
  buildRockClutter(grid, map, pebbleCluster, natureRocks);

  const rockMat = makeRockMaterial(grid, );
  // Loose rubble in crypt/dungeons and ruins now uses sculpted talus and rock shader
  if (rocks.length) {
    scatter(grid, rocks, makeRockGeometry(grid, 'talus'), rockMat);
  }
  for (const [shape, batch] of natureRocks) {
    scatter(grid, batch, makeRockGeometry(grid, shape), rockMat);
  }
  // Scatter the PCG talus & companion pebbles around boulders, scree, and field clusters
  if (pebbleCluster.length) {
    scatter(grid, pebbleCluster, makeRockGeometry(grid, 'pebble'), rockMat);
  }

  // Model and scatter ground clutter with dedicated assets (replacing generic white cones)
  if (twigs.length) {
    const twigGeo = makeTwigGeometry(grid, );
    scatter(grid, twigs, twigGeo, new THREE.MeshStandardMaterial({ color: 0x4a3b2e, roughness: 0.94 }));
  }
  if (wildflowers.length) {
    const flowerGeo = makeWildflowerGeometry(grid, );
    scatter(grid, wildflowers, flowerGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }));
  }
  if (ferns.length) {
    const fernGeo = makeFernGeometry(grid, );
    scatter(grid, ferns, fernGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }));
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
  natureRocks: Map<string, ScatterItem[]>
) {
  const biomeCells = map.biomes?.cells;
  const kinds = map.biomes?.kinds;
  if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;

  const road = new Set((map.cells.road || []).map(([x, z]) => grid.key(x, z)));
  const water = new Set((map.cells.water || []).map(([x, z]) => grid.key(x, z)));
  const wall = new Set(map.cells.wall.map(([x, z]) => grid.key(x, z)));
  const townCenter = { x: 56.5, z: 55.5 };

  // border cells included — region seams must carry the same clutter density
  // as region interiors (the old 2-cell inset read as a hard seam)
  for (let z = 0; z < map.size.h; z += 2) {
    for (let x = 0; x < map.size.w; x += 2) {
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
        if (clusterRoll > 0.74) {
          spawnCluster = true;
          clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 3);
          baseScale = 0.22 + hash2(x, z, 4003) * 0.18;
        }
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
