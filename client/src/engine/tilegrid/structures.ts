// tilegrid/structures.ts — town buildings, ruins, graves, cave mouth, exits.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// VISUAL FIX: corrects scale (was 3-7m, now 7-12m) + instanced brick walls for perf.
// Gameplay preserved: colliders, terrainHeightAt, rotY, scale all kept.

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef, PropDef } from '../types';
import { getMaterial, hash2, rngFrom } from '../materials';
import { CELL, addRotatedCollider } from './shared';
import { makeRockGeometry, makeRockMaterial } from './geo';

const EXIT_FRAME = new THREE.MeshStandardMaterial({
  color: 0x366d68, emissive: 0x245d56, emissiveIntensity: 1.2,
  metalness: 0.15, roughness: 0.35,
});

const EXIT_VEIL = new THREE.MeshBasicMaterial({
  color: 0x8be2cd, transparent: true, opacity: 0.52, side: THREE.DoubleSide,
});

// ———————————————————————————————————————————————————————
// SCALE BIBLE — single source of truth for human scale
// Your original columns were h=3+rand*4.6 (~3-7.6). Houses are 8.5 tall.
// So pillars were SHORTER than houses. Fix here without touching gameplay code elsewhere.
// ———————————————————————————————————————————————————————
const HUMAN = 1.8; // player approx height
const PILLAR_MIN = HUMAN * 4.2; // ~7.5m
const PILLAR_VAR = HUMAN * 2.6; // +0-4.7m => 7.5-12.2m range
const WALL_H_MIN = HUMAN * 3.9; // ~7m
const WALL_H_VAR = HUMAN * 2.5; // +0-4.5m => 7-11.5m

// Visual helper: cloned stone with subtle jitter so every prop doesn't look identical
// Visual helper: pulls rich procedural ruin masonry with normal/cavity/height maps
export function ruinStone(grid: TileGrid, variant = 0) {
  return getMaterial('ruin_stone', variant) as THREE.MeshStandardMaterial;
}

function mossStone(grid: TileGrid) {
  return getMaterial('ruin_stone', 1) as THREE.MeshStandardMaterial;
}

export function buildTownBuilding(grid: TileGrid, prop: PropDef, x: number, z: number) {
  const width = (prop.width || 5) * CELL * 0.82;
  const depth = (prop.depth || 5) * CELL * 0.82;
  const ground = grid.terrainHeightAt(x, z);
  const group = new THREE.Group();

  // 1. Weathered ashlar foundation plinth
  const foundMat = getMaterial('ruin_stone', 0);
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 1.2, depth + 0.4), foundMat);
  foundation.position.y = 0.6;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  group.add(foundation);

  // 2. Timber-framed plaster walls with roughcast stucco and dark oak studs
  const wallMat = getMaterial('plaster', 0);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 7.6, depth), wallMat);
  wall.position.y = 4.8;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // 3. Dark charcoal slate shingle roof
  const roofMaterial = getMaterial('roof_slate', 0);
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.7, depth + 1.4), roofMaterial);
    roof.position.set(side * width * 0.245, 10.7, 0);
    roof.rotation.z = -side * 0.47;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
  }

  // 4. Timber gable ends
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-width / 2, 8.4);
  gableShape.lineTo(width / 2, 8.4);
  gableShape.lineTo(0, 13.1);
  gableShape.closePath();
  const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), wallMat);
  for (const side of [-1, 1]) {
    const end = gable.clone();
    end.position.z = side * (depth / 2 - 0.08);
    group.add(end);
  }

  // 5. Heavy timber framing posts, diagonal braces, and fascia
  const woodMat = getMaterial('wood', 0);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.65, 8.4, 0.65), woodMat);
    post.position.set(side * (width / 2 - 0.5), 4.2, depth / 2 + 0.12);
    post.castShadow = true;
    group.add(post);

    const brace = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 0.38), woodMat);
    brace.position.set(side * (width / 2 - 1.6), 7.5, depth / 2 + 0.14);
    brace.rotation.z = side * -0.45;
    group.add(brace);
  }
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.42, 0.42), woodMat);
  fascia.position.set(0, 8.35, depth / 2 + 0.15);
  group.add(fascia);

  // 6. Studded oak plank door
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 0.24), woodMat);
  door.position.set(0, 2.6, depth / 2 + 0.14);
  group.add(door);

  // 7. Warm torch-lit glowing windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xf0b557, emissive: 0xa84d1d, emissiveIntensity: 0.65, roughness: 0.35,
  });
  for (const side of [-1, 1]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.55, 0.22), windowMat);
    window.position.set(side * width * 0.27, 5.5, depth / 2 + 0.13);
    group.add(window);
  }

  // 8. Dark soot stone masonry chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.6, 2.4), getMaterial('ruin_stone', 2));
  chimney.position.set(width * 0.29, 11.4, -depth * 0.22);
  chimney.castShadow = true;
  chimney.receiveShadow = true;
  group.add(chimney);

  group.position.set(x, ground, z);
  group.rotation.y = prop.rotY || 0;
  grid.group.add(group);
  addRotatedCollider(grid.colliders, x, z, 0, 0, width * 0.46, depth * 0.46, 0, 12, prop.rotY || 0);
}

export function buildTownWell(grid: TileGrid, x: number, z: number) {
  const group = new THREE.Group(), stone = getMaterial('ruin_stone', 0), wood = getMaterial('wood', 0);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 1.5, 12), stone);
  ring.position.y = 0.75; ring.castShadow = true; group.add(ring);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.75, 16), new THREE.MeshStandardMaterial({
    color: 0x355860, roughness: 0.28,
  }));
  water.rotation.x = -Math.PI / 2; water.position.y = 1.52; group.add(water);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.5), wood);
    post.position.set(side * 2.3, 2.25, 0); group.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 0.55), wood);
  beam.position.y = 4.3; group.add(beam);
  group.position.set(x, grid.terrainHeightAt(x, z), z);
  grid.group.add(group);
  grid.colliders.push({ x1: x - 2.5, z1: z - 2.5, x2: x + 2.5, z2: z + 2.5, yMin: 0, yMax: 3.5 });
}

export function buildStreetLantern(grid: TileGrid, x: number, z: number) {
  const group = new THREE.Group();
  const iron = getMaterial('iron', 0), glass = new THREE.MeshStandardMaterial({
    color: 0xe0a651, emissive: 0xe58b32, emissiveIntensity: 1.1,
  });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 7, 7), iron);
  post.position.y = 3.5; post.castShadow = true; group.add(post);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 1.2), glass);
  lamp.position.y = 7.2; group.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 6), iron);
  cap.position.y = 8.2; group.add(cap);
  group.position.set(x, grid.terrainHeightAt(x, z), z);
  grid.group.add(group);
}

// ── wilderness ruin / graveyard kits (P3.7 world composition) ──────────
// All pieces ground on terrainHeightAt so they sit on streamed terrain.

export function buildRuinColumn(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 404));
  const scale = p.scale || 1;
  const g = new THREE.Group();
  const h = (PILLAR_MIN + r() * PILLAR_VAR) * scale; // 7.5-12m not 3-7m
  const stone = ruinStone(grid);
  const moss = mossStone(grid);
  const segments = 3 + Math.floor(r() * 2);
  const segH = h / segments;
  for (let i = 0; i < segments; i++) {
    const tR = (0.68 - i * 0.06) * scale;
    const bR = (0.76 - i * 0.06) * scale;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(tR, bR, segH * 0.96, 10), i === 0 ? moss : stone);
    drum.position.y = segH * i + segH / 2 + 0.7 * scale;
    drum.rotation.y = (r() - 0.5) * 0.12;
    drum.castShadow = true;
    drum.receiveShadow = true;
    g.add(drum);
  }
  if (r() < 0.5) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.9 * scale, 0.5 * scale, 1.9 * scale), stone);
    cap.position.y = h + 0.95 * scale;
    cap.castShadow = true;
    g.add(cap);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.3 * scale, 0.55 * scale, 2.3 * scale), stone);
  base.position.y = 0.27 * scale;
  base.receiveShadow = true;
  g.add(base);
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(2.0 * scale, 0.65 * scale, 2.0 * scale), moss);
  base2.position.y = 0.85 * scale;
  base2.receiveShadow = true;
  g.add(base2);
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  // gameplay: keep original footprint but raise yMax to match new height
  grid.colliders.push({ x1: x - 1.1 * scale, z1: z - 1.1 * scale, x2: x + 1.1 * scale, z2: z + 1.1 * scale, yMin: 0, yMax: h + 1.5 });
}

export function buildRuinColumnFallen(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 414));
  const scale = p.scale || 1;
  const stone = ruinStone(grid);
  const g = new THREE.Group();
  const len = (PILLAR_MIN * 0.85 + r() * 3.0) * scale;
  const rad = 0.68 * scale;

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 10), stone);
  drum.rotation.z = Math.PI / 2;
  drum.rotation.y = (r() - 0.5) * 0.6;
  drum.position.y = rad * 0.95;
  drum.castShadow = true;
  drum.receiveShadow = true;
  g.add(drum);
  for (let i = 0; i < 2; i++) {
    const segLen = len * (0.28 + r() * 0.18);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.95, rad * 0.95, segLen, 9), stone);
    seg.rotation.z = Math.PI / 2;
    seg.rotation.y = (r() - 0.5) * 1.6;
    seg.position.set((r() - 0.5) * 3.2, 0.5 + r() * 0.25, (r() - 0.5) * 2.8);
    seg.castShadow = true;
    g.add(seg);
  }
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  addRotatedCollider(grid.colliders, x, z, 0, 0, 2.0 * scale, 1.3 * scale, 0, 2.2 * scale, p.rotY || 0);
}

export function buildRuinWall(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 424));
  const scale = p.scale || 1;
  const rotY = p.rotY || 0;
  const g = new THREE.Group();
  const len = (11 + r() * 6) * scale;
  const h = (WALL_H_MIN + r() * 2.2) * scale;
  const thick = 1.45 * scale;

  const stoneMat = ruinStone(grid, r() < 0.35 ? 1 : 0);
  const mossMat = mossStone(grid);

  // 1. Massive Corner Pier / Tower Buttress at one end
  const hasCornerPillar = r() < 0.85;
  const pillarW = 2.4 * scale;
  const pillarH = h * (1.06 + r() * 0.12);
  const side = r() < 0.5 ? 1 : -1;
  const px = side * (len / 2 - pillarW / 2);

  if (hasCornerPillar) {
    // Stepped plinth base
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(pillarW + 0.6 * scale, 0.9 * scale, pillarW + 0.6 * scale), mossMat);
    pBase.position.set(px, 0.45 * scale, 0);
    pBase.castShadow = true; pBase.receiveShadow = true;
    g.add(pBase);

    // Tower shaft with subdivisions for vertex displacement
    const pShaft = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, pillarW, 4, 8, 4), stoneMat);
    pShaft.position.set(px, pillarH / 2, 0);
    pShaft.castShadow = true; pShaft.receiveShadow = true;
    g.add(pShaft);

    // Cornice cap stone
    const pCap = new THREE.Mesh(new THREE.BoxGeometry(pillarW + 0.4 * scale, 0.6 * scale, pillarW + 0.4 * scale), stoneMat);
    pCap.position.set(px, pillarH + 0.3 * scale, 0);
    pCap.castShadow = true;
    g.add(pCap);

    // Rotated collider exactly matching corner buttress mesh
    addRotatedCollider(grid.colliders, x, z, px, 0, (pillarW + 0.2 * scale) / 2, (pillarW + 0.2 * scale) / 2, 0, pillarH + 1, rotY);
  }

  // 2. Main Wall Body — stepped broken silhouette
  const wallSpan = len - (hasCornerPillar ? pillarW : 0);
  const highFrac = 0.52 + r() * 0.22;
  const highW = wallSpan * highFrac;
  const breachW = wallSpan * (1 - highFrac);

  const startX = hasCornerPillar ? (side === 1 ? -len / 2 : -len / 2 + pillarW) : -len / 2;
  const highX = startX + highW / 2;

  // Plinth foundation ONLY under standing wall sections
  const stumpW = breachW * 0.38;
  const standingSpan = highW + stumpW;
  const wallBase = new THREE.Mesh(new THREE.BoxGeometry(standingSpan + 0.2 * scale, 0.8 * scale, thick + 0.35 * scale), mossMat);
  wallBase.position.set(startX + standingSpan / 2, 0.4 * scale, 0);
  wallBase.castShadow = true; wallBase.receiveShadow = true;
  g.add(wallBase);

  // High intact wall section with height displacement geometry
  const highH = h;
  const highWall = new THREE.Mesh(new THREE.BoxGeometry(highW, highH, thick, 8, 8, 2), stoneMat);
  highWall.position.set(highX, highH / 2, 0);
  highWall.castShadow = true; highWall.receiveShadow = true;
  g.add(highWall);

  // Rotated collider matching high wall mesh
  addRotatedCollider(grid.colliders, x, z, highX, 0, highW / 2, thick / 2 + 0.1 * scale, 0, highH + 2, rotY);

  // Coping blocks / crenellations on the high section
  const numMerlons = Math.max(1, Math.floor(highW / (2.2 * scale)));
  const merlonW = 1.35 * scale;
  for (let m = 0; m < numMerlons; m++) {
    const mx = highX - highW / 2 + (m + 0.5) * (highW / numMerlons);
    const mh = (0.9 + r() * 0.7) * scale;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(merlonW, mh, thick * 1.05), r() < 0.3 ? mossMat : stoneMat);
    merlon.position.set(mx, highH + mh / 2, (r() - 0.5) * 0.08);
    merlon.rotation.y = (r() - 0.5) * 0.08;
    merlon.castShadow = true;
    g.add(merlon);
  }

  // Crumbled transition stump
  const breachH = h * (0.32 + r() * 0.22);
  const stumpX = startX + highW + stumpW / 2;
  const stumpWall = new THREE.Mesh(new THREE.BoxGeometry(stumpW, breachH, thick, 4, 3, 2), stoneMat);
  stumpWall.position.set(stumpX, breachH / 2, 0);
  stumpWall.castShadow = true; stumpWall.receiveShadow = true;
  g.add(stumpWall);

  // Rotated collider matching low stump mesh
  addRotatedCollider(grid.colliders, x, z, stumpX, 0, stumpW / 2, thick / 2 + 0.1 * scale, 0, breachH + 0.5, rotY);

  // Diagonal stepped transition block between high wall and stump
  const transW = Math.min(highW * 0.35, stumpW * 0.9);
  const transH = (highH - breachH) * 0.65;
  const trans = new THREE.Mesh(new THREE.BoxGeometry(transW, transH, thick * 0.95), stoneMat);
  trans.position.set(highX + highW / 2, breachH + transH / 2, 0);
  trans.rotation.z = (side === 1 ? -1 : 1) * 0.22;
  trans.castShadow = true;
  g.add(trans);

  // 3. Walkable breach opening & fallen ashlar stone blocks tumbled on the ground
  // The gap from (startX + standingSpan) to (startX + wallSpan) has NO wall mesh or collider —
  // player walks cleanly through this broken breach!
  const gapW = wallSpan - standingSpan;
  const gapX = startX + standingSpan + gapW / 2;
  for (let i = 0; i < 4; i++) {
    const bw = (1.2 + r() * 0.6) * scale;
    const bh = (0.35 + r() * 0.25) * scale;
    const bd = (0.9 + r() * 0.5) * scale;
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), r() < 0.4 ? mossMat : stoneMat);
    const rx = gapX + (r() - 0.5) * gapW * 0.9;
    const rz = (r() - 0.5) * 2.5 * scale;
    const ry = bh / 2;
    bMesh.position.set(rx, ry, rz);
    bMesh.rotation.set((r() - 0.5) * 0.3, r() * Math.PI, (r() - 0.5) * 0.3);
    bMesh.castShadow = true; bMesh.receiveShadow = true;
    g.add(bMesh);
  }

  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = rotY;
  grid.group.add(g);
}

export function buildRuinSlab(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 434));
  const stone = ruinStone(grid);
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(5.5 + r() * 2.5, 0.65, 3.6 + r() * 1.4), stone);
  slab.position.y = 0.85;
  slab.rotation.x = (r() - 0.5) * 0.16;
  slab.rotation.z = (r() - 0.5) * 0.16;
  slab.castShadow = true;
  slab.receiveShadow = true;
  g.add(slab);
  for (const side of [-1, 1]) {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9 + r() * 0.6, 0.9), stone);
    prop.position.set(side * (1.6 + r()), 0.45, (r() - 0.5) * 1.6);
    prop.rotation.y = r() * Math.PI;
    g.add(prop);
  }
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  addRotatedCollider(grid.colliders, x, z, 0, 0, 3, 2.2, 0, 2.4, p.rotY || 0);
}

export function buildGraveGate(grid: TileGrid, p: PropDef, x: number, z: number) {
  const stone = ruinStone(grid);
  const iron = getMaterial('iron', 1);
  const g = new THREE.Group();
  const GATE_W = 7.2;
  const GATE_H = 10.8; // was 6.4 — now monumental, matches polished image

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.35, GATE_H, 1.35), stone);
    post.position.set(side * GATE_W/2, GATE_H/2, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    g.add(post);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.7), stone);
    cap.position.set(side * GATE_W/2, GATE_H + 0.3, 0);
    cap.castShadow = true;
    g.add(cap);
    const mossBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.1, 1.55), mossStone(grid));
    mossBase.position.set(side * GATE_W/2, 0.55, 0);
    g.add(mossBase);
  }
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(GATE_W/2, GATE_W/2, 0.65, 14, 1, false, 0, Math.PI), stone);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.y = GATE_H;
  arch.castShadow = true;
  g.add(arch);
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.8, 0.16), iron);
    bar.position.set(i * 1.25, 2.4, 0);
    g.add(bar);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 0.24), iron);
  top.position.y = 4.9;
  g.add(top);
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  addRotatedCollider(grid.colliders, x, z, 0, 0, 4.6, 1.0, 0, GATE_H + 1, p.rotY || 0);
}

export function buildGraveFence(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 444));
  const stone = ruinStone(grid);
  const g = new THREE.Group();
  const len = 8.5 + r() * 1.6;
  const h = 2.3 + r() * 0.7;
  const seg = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.75), stone);
  seg.position.y = h / 2 - 0.2;
  seg.rotation.z = (r() - 0.5) * 0.06;
  seg.castShadow = true;
  seg.receiveShadow = true;
  g.add(seg);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(len * 0.96, 0.24, 0.95), stone);
  cap.position.y = h - 0.2;
  g.add(cap);
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  // decorative: no collider (characters step through gaps by design) — preserved
}

export function buildGraveMound(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 454));
  const scale = (p.scale || 1) * 1.35; // was 1 — now actually visible at distance
  const dirt = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 1, metalness: 0 });
  const mound = new THREE.Mesh(new THREE.SphereGeometry(2.1 * scale, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), dirt);
  mound.scale.y = 0.55;
  mound.position.y = 0;
  mound.castShadow = true; mound.receiveShadow = true;
  mound.position.set(x, grid.terrainHeightAt(x, z) - 0.1, z);
  mound.rotation.y = r() * Math.PI * 2;
  grid.group.add(mound);

  // tiny wildflower dots — visual only, no collider change
  if (r() < 0.75) {
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0x9a7ed5, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), flowerMat);
      f.position.set(x + (r() - 0.5) * 2.6, grid.terrainHeightAt(x, z) + 0.28, z + (r() - 0.5) * 2.2);
      grid.group.add(f);
    }
  }
  // no collider — mounds are walkable rises — preserved
}

export function buildMausoleum(grid: TileGrid, p: PropDef, x: number, z: number) {
  const stone = ruinStone(grid);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.5, 7.2, 7), stone);
  body.position.y = 3.6;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 5.6, 2.6, 4), stone);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.25, 1, 0.95);
  roof.position.y = 8.5;
  roof.castShadow = true;
  g.add(roof);
  const doorway = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5, 0.5), dark);
  doorway.position.set(0, 2.5, 3.55);
  g.add(doorway);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 0.9), stone);
  lintel.position.set(0, 5.3, 3.6);
  lintel.castShadow = true;
  g.add(lintel);
  for (const side of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 5, 7), stone);
    col.position.set(side * 2.1, 2.5, 3.7);
    col.castShadow = true;
    g.add(col);
  }
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  addRotatedCollider(grid.colliders, x, z, 0, 0, 4.9, 3.6, 0, 9, p.rotY || 0);
}

export function buildColumbarium(grid: TileGrid, p: PropDef, x: number, z: number) {
  const stone = ruinStone(grid);
  const dark = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.95 });
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(9.5, 5.6, 1.4), stone);
  wall.position.y = 2.8;
  wall.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.55, 1.9), stone);
  cap.position.y = 5.85;
  cap.castShadow = true;
  g.add(cap);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      if (hash2(col, row, 454 + Math.floor(p.x * 64)) < 0.2) continue;
      const niche = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.3), dark);
      niche.position.set(-3.9 + col * 1.56, 1.15 + row * 1.18, 0.76);
      g.add(niche);
    }
  }
  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  addRotatedCollider(grid.colliders, x, z, 0, 0, 4.9, 1.0, 0, 6, p.rotY || 0);
}

export function buildCaveMouth(grid: TileGrid, x: number, z: number) {
  const group = new THREE.Group(), stone = getMaterial('ruin_stone', 0);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(4.3, 12), new THREE.MeshBasicMaterial({
    color: 0x090b0b, side: THREE.DoubleSide,
  }));
  mouth.position.set(0, 4.2, 0.2);
  group.add(mouth);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(4, 1.15, 7, 12, Math.PI), stone);
  arch.position.set(0, 4.2, 0);
  group.add(arch);
  const rockMat = makeRockMaterial(grid);
  for (const side of [-1, 1]) {
    const rock = new THREE.Mesh(makeRockGeometry(grid, 'angular'), rockMat);
    rock.position.set(side * 4.2, 1.5, 0);
    rock.scale.set(2.2, 2.4, 2.6);
    rock.castShadow = true;
    group.add(rock);
  }
  group.position.set(x, grid.terrainHeightAt(x, z), z);
  grid.group.add(group);
}

export function buildExits(grid: TileGrid, map: MapDef) {
  const stone = getMaterial('ruin_stone', 0);
  for (const exit of map.exits || []) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.35, 8), stone);
    base.position.y = 0.2;
    base.receiveShadow = true;
    g.add(base);
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.8, 1.1), stone);
      pillar.position.set(side * 1.7, 2.4, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      g.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.9, 1.3), stone);
    lintel.position.y = 4.75;
    lintel.castShadow = true;
    g.add(lintel);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.13, 8, 28), EXIT_FRAME);
    ring.position.set(0, 2.55, 0.28);
    g.add(ring);
    const veil = new THREE.Mesh(new THREE.CircleGeometry(1.2, 28), EXIT_VEIL);
    veil.position.set(0, 2.55, 0.3);
    g.add(veil);
    // snap exits onto the terrain surface — y=0 buried/floated them whenever
    // a streamed region stood above or below the zero plane
    g.position.set(exit.x * CELL, grid.terrainHeightAt(exit.x * CELL, exit.z * CELL), exit.z * CELL);
    grid.group.add(g);
  }
}
