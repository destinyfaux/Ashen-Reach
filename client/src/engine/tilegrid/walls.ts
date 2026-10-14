// tilegrid/walls.ts — wall and door build passes.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef } from '../types';
import type { ScatterItem } from './shared';
import { getMaterial, getTextureSet, hash2, rngFrom } from '../materials';
import { CELL, WALL_H } from './shared';
import { scatter } from './geo';

// ── walls: instanced bricks, seeded per-instance color jitter, ruined tops ─
export function buildWalls(grid: TileGrid, map: MapDef, wallSet: Set<number>) {
  const W = map.size.w, H = map.size.h;
  const wallSetDef = grid.areaTiles.wall;
  const intact: [number, number][] = [];
  const ruined: [number, number][] = [];
  const supportsAlongX: [number, number][] = [];
  const supportsAlongZ: [number, number][] = [];
  const open = (x: number, z: number) =>
    x >= 0 && z >= 0 && x < W && z < H && !wallSet.has(grid.key(x, z));
  for (const [x, z] of map.cells.wall) {
    const visible = open(x, z - 1) || open(x, z + 1) || open(x - 1, z) || open(x + 1, z);
    (visible && hash2(x, z, 7) < 0.22 ? ruined : intact).push([x, z]);
    if (visible && hash2(x, z, 29) < 0.23) {
      const faces: [boolean, number, number][] = [];
      if (open(x, z - 1)) faces.push([true, x * CELL + CELL / 2, z * CELL + 0.55]);
      if (open(x, z + 1)) faces.push([true, x * CELL + CELL / 2, (z + 1) * CELL - 0.55]);
      if (open(x - 1, z)) faces.push([false, x * CELL + 0.55, z * CELL + CELL / 2]);
      if (open(x + 1, z)) faces.push([false, (x + 1) * CELL - 0.55, z * CELL + CELL / 2]);
      const face = faces[Math.floor(hash2(x, z, 31) * faces.length)];
      if (face) (face[0] ? supportsAlongX : supportsAlongZ).push([face[1], face[2]]);
    }
    grid.colliders.push({
      x1: x * CELL, z1: z * CELL, x2: (x + 1) * CELL, z2: (z + 1) * CELL,
      yMin: 0, yMax: WALL_H
    });
  }

  // texture repeat shared by both variants (1 tile = 10ft tall on a 16ft wall)
  for (const v of new Set([wallSetDef.intactVariant, wallSetDef.ruinedVariant])) {
    const s = getTextureSet(wallSetDef.kind, v);
    s.map.repeat.set(1, 1.6);
    s.bump.repeat.set(1, 1.6);
  }

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const build = (cells: [number, number][], variant: number) => {
    if (!cells.length) return;
    const geo = new THREE.BoxGeometry(CELL, WALL_H, CELL);
    const materialVariant = variant === 0 ? wallSetDef.intactVariant : wallSetDef.ruinedVariant;
    const mesh = new THREE.InstancedMesh(geo, getMaterial(wallSetDef.kind, materialVariant), cells.length);
    mesh.castShadow = true; mesh.receiveShadow = true;
    cells.forEach(([x, z], i) => {
      dummy.position.set(x * CELL + CELL / 2, WALL_H / 2, z * CELL + CELL / 2);
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // per-instance warm/cool brick jitter (seeded → stable)
      const v = 0.78 + hash2(x, z, 3) * 0.32;
      const w = (hash2(x, z, 5) - 0.5) * 0.08;
      col.setRGB(v * (1 + w), v, v * (1 - w * 0.8));
      if (variant === 1) col.multiplyScalar(0.92);  // ruined runs sootier
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    grid.group.add(mesh);
  };
  build(intact, 0);
  build(ruined, 1);

  const supportMaterial = getMaterial(wallSetDef.kind, wallSetDef.intactVariant);
  const addSupports = (positions: [number, number][], alongX: boolean) => {
    if (!positions.length) return;
    const sizes = [
      alongX ? [1.45, WALL_H - 2.2, 1.0] : [1.0, WALL_H - 2.2, 1.45],
      alongX ? [2.75, 1.15, 1.35] : [1.35, 1.15, 2.75],
      alongX ? [2.75, 1.15, 1.35] : [1.35, 1.15, 2.75]
    ];
    const heights = [WALL_H / 2, 0.8, WALL_H - 0.8];
    sizes.forEach(([sx, sy, sz], part) => {
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(sx, sy, sz), supportMaterial, positions.length);
      const dummy = new THREE.Object3D();
      positions.forEach(([px, pz], i) => {
        dummy.position.set(px, heights[part], pz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, new THREE.Color(part === 0 ? 0.76 : 0.88, part === 0 ? 0.76 : 0.88, part === 0 ? 0.76 : 0.88));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      grid.group.add(mesh);
    });
  };
  addSupports(supportsAlongX, true);
  addSupports(supportsAlongZ, false);

  // broken-brick crumble on ruined tops (jagged silhouette)
  const chunks: ScatterItem[] = [];
  for (const [x, z] of ruined) {
    const r = rngFrom(hash2(x, z, 23));
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const s = 0.55 + r() * 0.95;
      chunks.push({
        x: x * CELL + 0.9 + r() * (CELL - 1.8),
        y: WALL_H - 0.1 - s * 0.35,
        z: z * CELL + 0.9 + r() * (CELL - 1.8),
        s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
        r: 0.72 + r() * 0.26, g: 0.68 + r() * 0.26, b: 0.62 + r() * 0.26
      });
    }
  }
  scatter(grid, chunks, new THREE.BoxGeometry(1, 0.85, 1), getMaterial(wallSetDef.kind, wallSetDef.ruinedVariant));
}

// ── door frames: iron-banded wood with stateful, animated leaves ─────────
export function buildDoors(grid: TileGrid, map: MapDef) {
  const wood = getMaterial('wood', grid.areaTiles.trim.woodVariant);
  const iron = getMaterial('iron', grid.areaTiles.trim.ironVariant);
  for (const [wallIndex, w] of map.walls.entries()) {
    if (w.type !== 'door' && w.type !== 'secret_door') continue;
    const len = Math.max(Math.abs(w.x2 - w.x1), Math.abs(w.z2 - w.z1)) * CELL;
    // frame center: cross-axis = wall-column center (wall cells sit at
    // (x+0.5)*CELL — the old raw midpoint landed on the wall's face plane,
    // half a cell off the doorway); along-axis = segment midpoint, which is
    // the door cell's center (segments are cell-boundary coords, x2 = x1+1)
    const isNS = w.x1 === w.x2;   // wall runs north-south
    const cx = isNS ? w.x1 + 0.5 : (w.x1 + w.x2) / 2;
    const cz = isNS ? (w.z1 + w.z2) / 2 : w.z1 + 0.5;
    const mx = cx * CELL, mz = cz * CELL;
    const g = new THREE.Group();
    g.position.set(mx, 0, mz);
    if (w.x1 === w.x2) g.rotation.y = Math.PI / 2;  // wall runs along z
    const hw = len / 2;
    const jambGeo = new THREE.BoxGeometry(0.85, 10.6, 1.35);
    for (const sx of [-hw + 0.42, hw - 0.42]) {
      const j = new THREE.Mesh(jambGeo, wood);
      j.position.set(sx, 5.3, 0);
      j.castShadow = true; j.receiveShadow = true;
      g.add(j);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(len + 0.9, 1.5, 1.45), wood);
    lintel.position.set(0, 10.4, 0); lintel.castShadow = true; g.add(lintel);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(len + 1.0, 0.5, 1.55), iron);
    strap.position.set(0, 10.15, 0); g.add(strap);
    // ajar leaf on a hinge at the left jamb (hugs the wall, never blocks the cell)
    const leaf = new THREE.Group();
    leaf.position.set(-hw + 0.85, 0, 0.35);
    const lw = len - 1.6;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(lw, 9.4, 0.42), wood);
    panel.position.set(lw / 2, 4.9, 0); panel.castShadow = true; leaf.add(panel);
    for (const by of [2.3, 7.4]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(lw + 0.14, 0.6, 0.54), iron);
      band.position.set(lw / 2, by, 0); leaf.add(band);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 6, 14), iron);
    ring.position.set(lw - 0.5, 4.6, 0.4); ring.rotation.x = Math.PI / 2; leaf.add(ring);
    leaf.rotation.y = w.isOpen ? 1.9 : 0;
    g.add(leaf);
    grid.group.add(g);
    grid.doorLeaves.set(wallIndex, leaf);
    // Door trim is decorative, while the closed leaf gets a separate blocker.
    const ex = w.x1 === w.x2 ? 1.2 : hw + 0.8;
    const ez = w.x1 === w.x2 ? hw + 0.8 : 1.2;
    grid.colliders.push({ x1: mx - ex, z1: mz - ez, x2: mx + ex, z2: mz + ez, yMin: 0, yMax: 11, decor: true });
    if (!w.isOpen) {
      const barrierHalfX = w.x1 === w.x2 ? 0.36 : Math.max(0.5, hw - 0.6);
      const barrierHalfZ = w.x1 === w.x2 ? Math.max(0.5, hw - 0.6) : 0.36;
      grid.colliders.push({
        x1: mx - barrierHalfX, z1: mz - barrierHalfZ,
        x2: mx + barrierHalfX, z2: mz + barrierHalfZ,
        yMin: 0, yMax: 10.2,
      });
    }
  }
}
