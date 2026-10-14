// tilegrid/structures.ts — town buildings, ruins, graves, cave mouth, exits.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// VISUAL FIX: corrects scale (was 3-7m, now 7-12m) + instanced brick walls for perf.
// Gameplay preserved: colliders, terrainHeightAt, rotY, scale all kept.

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { MapDef, PropDef } from '../types';
import { getMaterial, hash2, rngFrom } from '../materials';
import { CELL } from './shared';
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
export function ruinStone(grid: TileGrid) {
  const base = getMaterial('bone', 0) as THREE.MeshStandardMaterial;
  const m = base.clone() as THREE.MeshStandardMaterial;
  m.roughness = 0.88 + Math.random() * 0.1;
  m.metalness = 0.02;
  // slight color variation — keeps bone palette but not flat
  m.color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.07);
  return m;
}

function mossStone(grid: TileGrid) {
  const m = ruinStone(grid).clone() as THREE.MeshStandardMaterial;
  m.color.setHSL(0.26, 0.18, 0.32); // muted mossy
  m.roughness = 0.97;
  return m;
}

export function buildTownBuilding(grid: TileGrid, prop: PropDef, x: number, z: number) {
  const style: Record<string, { wall: number; roof: number; trim: number }> = {
    inn: { wall: 0x76553b, roof: 0x49302a, trim: 0xb69558 },
    general_store: { wall: 0x796446, roof: 0x564037, trim: 0xc1a96c },
    smithy: { wall: 0x554943, roof: 0x3b3331, trim: 0xa37842 },
    healer: { wall: 0x687055, roof: 0x4c5946, trim: 0xb3a879 },
    house: { wall: 0x66594a, roof: 0x4b3831, trim: 0x8e7654 },
  };
  const palette = style[prop.variant || 'house'] || style.house;
  const width = (prop.width || 5) * CELL * 0.82;
  const depth = (prop.depth || 5) * CELL * 0.82;
  const ground = grid.terrainHeightAt(x, z);
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 8.5, depth), new THREE.MeshStandardMaterial({
    color: palette.wall, roughness: 0.94,
  }));
  wall.position.y = 4.25; wall.castShadow = true; wall.receiveShadow = true; group.add(wall);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.98 });
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.7, depth + 1.4), roofMaterial);
    roof.position.set(side * width * 0.245, 10.7, 0);
    roof.rotation.z = -side * 0.47;
    roof.castShadow = true; roof.receiveShadow = true; group.add(roof);
  }
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-width / 2, 8.4);
  gableShape.lineTo(width / 2, 8.4);
  gableShape.lineTo(0, 13.1);
  gableShape.closePath();
  const gableMaterial = new THREE.MeshStandardMaterial({
    color: palette.wall, roughness: 0.96, side: THREE.DoubleSide,
  });
  const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), gableMaterial);
  for (const side of [-1, 1]) {
    const end = gable.clone();
    end.position.z = side * (depth / 2 - 0.08);
    group.add(end);
  }
  const trim = new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 0.92 });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.65, 8.4, 0.65), trim);
    post.position.set(side * (width / 2 - 0.5), 4.2, depth / 2 + 0.12);
    post.castShadow = true; group.add(post);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 0.38), trim);
    brace.position.set(side * (width / 2 - 1.6), 7.5, depth / 2 + 0.14);
    brace.rotation.z = side * -0.45; group.add(brace);
  }
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.42, 0.42), trim);
  fascia.position.set(0, 8.35, depth / 2 + 0.15); group.add(fascia);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 0.24), getMaterial('wood', 0));
  door.position.set(0, 2.6, depth / 2 + 0.14); group.add(door);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xf0b557, emissive: 0xa84d1d, emissiveIntensity: 0.65 });
  for (const side of [-1, 1]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.55, 0.22), windowMat);
    window.position.set(side * width * 0.27, 5.5, depth / 2 + 0.13); group.add(window);
  }
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.6, 2.4), getMaterial('bone', 0));
  chimney.position.set(width * 0.29, 11.4, -depth * 0.22);
  chimney.castShadow = true; chimney.receiveShadow = true; group.add(chimney);
  group.position.set(x, ground, z);
  group.rotation.y = prop.rotY || 0;
  grid.group.add(group);
  const halfWidth = (prop.rotY && Math.abs(Math.sin(prop.rotY)) > 0.5 ? depth : width) * 0.44;
  const halfDepth = (prop.rotY && Math.abs(Math.sin(prop.rotY)) > 0.5 ? width : depth) * 0.44;
  grid.colliders.push({
    x1: x - halfWidth, z1: z - halfDepth,
    x2: x + halfWidth, z2: z + halfDepth, yMin: 0, yMax: 12,
  });
}

export function buildTownWell(grid: TileGrid, x: number, z: number) {
  const group = new THREE.Group(), stone = getMaterial('bone', 0), wood = getMaterial('wood', 0);
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
  grid.colliders.push({ x1: x - 2.0 * scale, z1: z - 1.3 * scale, x2: x + 2.0 * scale, z2: z + 1.3 * scale, yMin: 0, yMax: 2.2 * scale });
}

export function buildRuinWall(grid: TileGrid, p: PropDef, x: number, z: number) {
  const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 424));
  const scale = p.scale || 1;
  const g = new THREE.Group();
  const len = (10 + r() * 8) * scale;
  const h = (WALL_H_MIN + r() * WALL_H_VAR) * scale;

  // Brick dimensions — matches polished image block size
  const brickH = 0.58 * scale;
  const brickW = 0.9 * scale;
  const rows = Math.floor(h / brickH);
  const cols = Math.floor(len / brickW);

  const hasCornerPillar = r() < 0.75;
  const missingChunkCenter = r() * len - len/2;
  const missingChunkWidth = (1.5 + r()*2.5) * scale;

  type Inst = { x:number,y:number,z:number, sx:number,sy:number,sz:number, rotY:number, rotZ:number, mat:'stone'|'moss' };
  const instances: Inst[] = [];

  for (let row = 0; row < rows; row++) {
    const y = row * brickH + brickH * 0.5;
    const isTop = row > rows * 0.55;
    const isVeryTop = row > rows * 0.82;
    // More missing bricks at top = broken silhouette
    const baseBreakChance = isVeryTop ? 0.38 : isTop ? 0.18 : 0.02;
    const offset = (row % 2 === 0) ? 0 : brickW * 0.5;
    for (let c = 0; c < cols; c++) {
      const xPosBase = (c - cols/2 + 0.5) * brickW + offset;

      // Create a large missing chunk for collapsed section
      if (Math.abs(xPosBase - missingChunkCenter) < missingChunkWidth && row > rows*0.35) {
        if (r() < 0.85) continue;
      }
      if (r() < baseBreakChance) continue;
      instances.push({
        x: xPosBase + (r()-0.5)*0.06,
        y: y + (r()-0.5)*0.04,
        z: (r()-0.5)*0.12,
        sx: 0.88 + r()*0.24,
        sy: 0.88 + r()*0.18,
        sz: 0.85 + r()*0.25,
        rotY: (r()-0.5)*0.06,
        rotZ: (r()-0.5)*0.03,
        mat: row < 2 || r() < 0.08 ? 'moss' : 'stone'
      });
    }
  }

  // Corner pillar — thick tower of larger blocks at one end (like in my image)
  if (hasCornerPillar) {
    const pillarH = h * (1.08 + r()*0.18);
    const pillarW = 2.4 * scale;
    const pRows = Math.floor(pillarH / (brickH*1.1));
    const side = r() < 0.5 ? 1 : -1;
    const px = side * (len/2 - pillarW/2 + 0.3*scale);
    for (let row = 0; row < pRows; row++) {
      const y = row * brickH * 1.1 + brickH*0.55;
      if (row > pRows*0.7 && r() < 0.35) continue;
      for (let lx = 0; lx < 2; lx++) {
        for (let lz = 0; lz < 2; lz++) {
          instances.push({
            x: px + (lx-0.5)*pillarW*0.5,
            y,
            z: (lz-0.5)*pillarW*0.5,
            sx: 0.52*(1.0 - row/pRows*0.08),
            sy: 1.05,
            sz: 0.52*(1.0 - row/pRows*0.08),
            rotY: 0,
            rotZ: 0,
            mat: row < 2 ? 'moss' : 'stone'
          });
        }
      }
    }
  }

  const stoneMat = ruinStone(grid);
  const mossMat = mossStone(grid);
  const brickGeo = new THREE.BoxGeometry(brickW, brickH, 1.6*scale);

  const stoneInsts = instances.filter(i=>i.mat==='stone');
  const mossInsts = instances.filter(i=>i.mat==='moss');
  const dummy = new THREE.Object3D();

  function makeISM(list: Inst[], mat: THREE.Material) {
    if (list.length===0) return null;
    const ism = new THREE.InstancedMesh(brickGeo, mat, list.length);
    ism.castShadow = true;
    ism.receiveShadow = true;
    for (let i=0;i<list.length;i++) {
      const t = list[i];
      dummy.position.set(t.x, t.y, t.z);
      dummy.rotation.set(0, t.rotY, t.rotZ);
      dummy.scale.set(t.sx, t.sy, t.sz);
      dummy.updateMatrix();
      ism.setMatrixAt(i, dummy.matrix);
    }
    ism.instanceMatrix.needsUpdate = true;
    return ism;
  }

  const ismStone = makeISM(stoneInsts, stoneMat);
  const ismMoss = makeISM(mossInsts, mossMat);
  if (ismStone) g.add(ismStone);
  if (ismMoss) g.add(ismMoss);

  const rubbleGeoBox = new THREE.BoxGeometry(0.6*scale, 0.35*scale, 0.5*scale);
  const rubbleGeoRock = new THREE.DodecahedronGeometry(0.5*scale, 0);
  for (let i=0;i<16;i++) {
    const isBlock = r() < 0.55;
    const geo = isBlock ? rubbleGeoBox : rubbleGeoRock;
    const mat = r() < 0.5 ? stoneMat : mossMat;
    const m = new THREE.Mesh(geo, mat);
    const nearCollapse = r() < 0.6;
    const rx = nearCollapse ? missingChunkCenter + (r()-0.5)*3 : (r()-0.5)*len*0.6;
    const rz = (r()-0.5)*2.5;
    m.position.set(rx, 0.25*scale + r()*0.6, rz);
    m.rotation.set(r()*Math.PI, r()*Math.PI, r()*Math.PI);
    m.scale.setScalar(0.8 + r()*0.9);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }

  g.position.set(x, grid.terrainHeightAt(x, z), z);
  g.rotation.y = p.rotY || 0;
  grid.group.add(g);
  const half = len / 2;
  grid.colliders.push({ x1: x - half, z1: z - 1.0*scale, x2: x + half, z2: z + 1.0*scale, yMin: 0, yMax: h + 2.5 });
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
  grid.colliders.push({ x1: x - 3, z1: z - 2.2, x2: x + 3, z2: z + 2.2, yMin: 0, yMax: 2.4 });
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
  grid.colliders.push({ x1: x - 4.6, z1: z - 1.0, x2: x + 4.6, z2: z + 1.0, yMin: 0, yMax: GATE_H + 1 });
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
  grid.colliders.push({ x1: x - 4.9, z1: z - 3.6, x2: x + 4.9, z2: z + 3.6, yMin: 0, yMax: 9 });
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
  grid.colliders.push({ x1: x - 4.9, z1: z - 1, x2: x + 4.9, z2: z + 1, yMin: 0, yMax: 6 });
}

export function buildCaveMouth(grid: TileGrid, x: number, z: number) {
  const group = new THREE.Group(), stone = getMaterial('bone', 0);
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
  const stone = getMaterial('bone', 0);
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
