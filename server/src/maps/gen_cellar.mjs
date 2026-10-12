// Map authoring: rooms -> walls/cells/LOS/props. 1 cell = 5ft.
// Rooms are [x1,z1,x2,z2] in CELL coords (inclusive). Corridors are rooms too.
// This script emits server/src/maps/ashen_cellar.json
//
// Task 5-b door-data fixes (Wave 2):
//   - multi-cell doors emit x2/z2 = start + numCells (cell-BOUNDARY coords),
//     so a 2-cell (10ft) doorway gets a full-length segment — the old 1-cell
//     segment left the client's 5ft frame covering only half the opening;
//   - cryptN and corridorW no longer OVERLAP (a wall column now exists at
//     x=11 for the (11,9) door — it used to float in open floor);
//   - corridorTop/Mid/E stop at x=19 so x=20 is a real wall column for their
//     doors (they used to overlap pillarHall at x=21 — doors covered only 5ft
//     of the 15ft corridor mouths);
//   - rubble scatter is SEEDED (mulberry32) so regeneration is deterministic.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// seeded rubble scatter (deterministic regeneration — was Math.random)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rubbleRng = mulberry32(0x5eed);

const W = 46, H = 34; // cells

// room definitions
const rooms = {
  entry:   { rect: [3, 24, 10, 30], floor: 'stone', props: [ {type:'brazier', at:[4.5,24.6]}, {type:'brazier', at:[9.2,24.6]} ] },
  hallA:   { rect: [3, 14, 10, 23], floor: 'stone', props: [] },
  junction:{ rect: [12, 20, 19, 30], floor: 'stone', props: [ {type:'brazier', at:[15.5,25]}, {type:'brazier', at:[15.5,21.5]} ] },
  // cryptN stops at x2=10: x=11 is a solid wall column pierced only by the
  // (11,9) door (cryptN and corridorW used to overlap here — the door floated)
  cryptN:  { rect: [4, 4, 10, 12], floor: 'crypt', props: [ {type:'coffin', at:[8,6]}, {type:'coffin', at:[8,10]} ] },
  // corridorW shifted east (x=12..13) to leave the x=11 column for the crypt door
  corridorW: { rect: [12, 8, 13, 20], floor: 'stone', props: [ {type:'brazier', at:[12.5,19.4]} ] },
  pillarHall: { rect: [21, 5, 36, 29], floor: 'stone',
    props: [
      {type:'pillar', at:[24,10]}, {type:'pillar', at:[24,17]}, {type:'pillar', at:[24,24]},
      {type:'pillar', at:[30,10]}, {type:'pillar', at:[30,17]}, {type:'pillar', at:[30,24]},
      {type:'brazier', at:[21.5,7]}, {type:'brazier', at:[36-0.5,7]}, {type:'brazier', at:[21.5,28]}, {type:'brazier', at:[35.5,28]},
      {type:'altar', at:[33.5,17]}
    ] },
  // corridorE/Mid/Top stop at x=19: x=20 is the pillar hall's west wall
  // column, pierced by the (20,25)/(20,17)/(20,9) doors (they used to
  // overlap pillarHall at x=21, so the doors sat in open corridor floor)
  corridorE: { rect: [19, 24, 19, 26], floor: 'stone', props: [] }, // junction -> pillar hall (south)
  corridorTop: { rect: [12, 8, 19, 10], floor: 'stone', props: [] }, // corridorW top -> pillar hall north
  corridorMid: { rect: [11, 16, 19, 18], floor: 'stone', props: [] }  // corridorW mid -> pillar hall mid
};

const doorAt = [
  { cells: [[11,22]], type: 'door' },           // hallA -> junction
  { cells: [[11,25],[11,26]], type: 'door' },   // entry -> junction (2-cell gap column)
  { cells: [[20,25]], type: 'secret_door' },    // junction -> pillar hall (south)
  { cells: [[20,9]], type: 'door' },            // corridorTop -> pillar hall (north)
  { cells: [[20,17]], type: 'door' },           // corridorMid -> pillar hall (mid)
  { cells: [[11,9]], type: 'door' }             // cryptN -> corridorW (x=11 wall column)
];

const cells = { wall: [], pillar: [] };       // filled below
const walls = [];                               // LOS segments (cell coords, x1,z1,x2,z2)
const lights = [];
const props = [];

// carve rooms into a solid grid
const solid = Array.from({ length: H }, () => Array(W).fill(true));
for (const r of Object.values(rooms)) {
  const [x1, z1, x2, z2] = r.rect;
  for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) solid[z][x] = false;
}
// doors carve through solid + become wall segments with type door (closed blocks LOS)
for (const d of doorAt) for (const [x, z] of d.cells) { if (x < W && z < H) solid[z][x] = false; }

// ── extract wall cells + LOS segments: for every solid cell adjacent to open, emit a wall cell.
// For LOS we build segments along boundaries between open/solid.
const wallCells = [];
for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
  if (!solid[z][x]) continue;
  const openNeighbor =
    (x > 0 && !solid[z][x - 1]) || (x < W - 1 && !solid[z][x + 1]) ||
    (z > 0 && !solid[z - 1][x]) || (z < H - 1 && !solid[z + 1][x]);
  if (openNeighbor) wallCells.push([x, z]);
}

// LOS segments: walk each open cell; for each of 4 edges bordering a solid cell,
// emit that edge as a segment (dedup via set). Merge collinear runs for fewer segs.
const segSet = new Set();
const segsRaw = [];
for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
  if (solid[z][x]) continue;
  // north edge
  if (z === 0 || solid[z - 1][x]) segsRaw.push({ x1: x, z1: z, x2: x + 1, z2: z, side: 'N' });
  if (z === H - 1 || solid[z + 1][x]) segsRaw.push({ x1: x, z1: z + 1, x2: x + 1, z2: z + 1, side: 'S' });
  if (x === 0 || solid[z][x - 1]) segsRaw.push({ x1: x, z1: z, x2: x, z2: z + 1, side: 'W' });
  if (x === W - 1 || solid[z][x + 1]) segsRaw.push({ x1: x + 1, z1: z, x2: x + 1, z2: z + 1, side: 'E' });
}
// merge horizontal runs (same z, contiguous x) and vertical runs
const hMap = new Map(); // `${z}` -> list of x1s
const vMap = new Map();
for (const s of segsRaw) {
  if (s.z1 === s.z2) { if (!hMap.has(s.z1)) hMap.set(s.z1, []); hMap.get(s.z1).push(s); }
  else { if (!vMap.has(s.x1)) vMap.set(s.x1, []); vMap.get(s.x1).push(s); }
}
const pushSeg = (arr, x1, z1, x2, z2) => {
  const key = `${x1},${z1},${x2},${z2}`;
  if (segSet.has(key)) return;
  segSet.add(key); arr.push({ x1, z1, x2, z2, type: 'normal' });
};
for (const [z, list] of hMap) {
  const xs = list.map(s => s.x1).sort((a, b) => a - b);
  let start = xs[0], prev = xs[0];
  for (let i = 1; i <= xs.length; i++) {
    const cur = xs[i];
    if (cur !== prev + 1) { pushSeg(walls, start, z, prev + 1, z); start = cur; }
    prev = cur;
  }
}
for (const [x, list] of vMap) {
  const zs = list.map(s => s.z1).sort((a, b) => a - b);
  let start = zs[0], prev = zs[0];
  for (let i = 1; i <= zs.length; i++) {
    const cur = zs[i];
    if (cur !== prev + 1) { pushSeg(walls, x, start, x, prev + 1); start = cur; }
    prev = cur;
  }
}
// door overrides: carve an opening in the merged wall at door cells? For M0:
// doors are CLOSED (block LOS) — their cells are open for movement but we add a
// door segment across the corridor. Compute from door defs. Segments are
// cell-BOUNDARY coords and MULTI-CELL doors span all their cells
// (x2 = dx + numCells / z2 = dz + numCells) so the client's 5ft frame math
// centers over the full opening (10ft for a 2-cell door).
for (const d of doorAt) {
  const [dx, dz] = d.cells[0];
  const numCells = d.cells.length;
  // figure orientation: check solid left/right vs up/down
  const solidLR = (dx > 0 && solid[dz][dx - 1]) || (dx < W - 1 && solid[dz][dx + 1]);
  if (solidLR) walls.push({ x1: dx, z1: dz, x2: dx + numCells, z2: dz, type: d.type });  // wall runs E-W, door blocks N-S passage
  else walls.push({ x1: dx, z1: dz, x2: dx, z2: dz + numCells, type: d.type });
}

// props
for (const r of Object.values(rooms)) {
  for (const p of r.props || []) props.push({ type: p.type, x: p.at[0], z: p.at[1] });
}

// lights: braziers emit
for (const p of props) {
  if (p.type === 'brazier') lights.push({ x: p.x, z: p.z, radiusFt: 30, color: '#ff9a4d', flicker: true });
}
// ambient crypt lamps at room centers
lights.push({ x: 15.5, z: 27, radiusFt: 18, color: '#7fd4c8', flicker: false }); // junction corner lamp
lights.push({ x: 8, z: 8, radiusFt: 22, color: '#7fd4c8', flicker: false });     // crypt glow

// difficulty/water scatter (visual only, M0): rubble in pillar hall (seeded)
for (let i = 0; i < 26; i++) {
  const x = 22 + rubbleRng() * 13, z = 6 + rubbleRng() * 22;
  if (solid[Math.floor(z)] && solid[Math.floor(z)][Math.floor(x)]) continue;
  props.push({ type: 'rubble', x, z });
}

const mapDef = {
  id: 'ashen_cellar',
  name: 'The Ashen Cellar',
  size: { w: W, h: H },
  theme: 'crypt',
  floor: 'stone',
  cells: { wall: wallCells },
  walls,
  lights,
  props,
  spawns: {
    party: [[6.5, 27.5]],
    monsters: [
      { archetype: 'skeleton', monsterId: 'skeleton', name: 'Cellar Thrall', x: 15.5, z: 24 },
      { archetype: 'skeleton', monsterId: 'skeleton', name: 'Bone Sentinel', x: 8, z: 6, hidden: true },
      { archetype: 'skeleton', monsterId: 'skeleton', name: 'Bone Sentinel', x: 8, z: 10, hidden: true },
      { archetype: 'wraith', monsterId: 'specter', name: 'The Ashen Warden', x: 33, z: 13, hp: 30, ac: 13, size: 1.2  },
      { archetype: 'skeleton', monsterId: 'skeleton', name: 'Pillar Thrall', x: 27, z: 20 },
      { archetype: 'skeleton', monsterId: 'skeleton', name: 'Pillar Thrall', x: 27, z: 14 }
    ]
  }
};

fs.writeFileSync(path.join(__dirname, 'ashen_cellar.json'), JSON.stringify(mapDef, null, 1));
console.log('wrote ashen_cellar.json', {
  wallCells: wallCells.length, walls: walls.length, props: props.length, lights: lights.length
});
