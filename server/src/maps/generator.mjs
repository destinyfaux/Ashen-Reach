// ASHENREACH — server/src/maps/generator.mjs
// Seeded connector-aware crypt generator: BSP placement + authored room modules.
// Emits EXACTLY the ashen_cellar.json MapDef shape (client engine/types.ts):
//   { id, name, size:{w,h}, theme, floor, cells:{wall:[[cx,cz],...]},
//     walls:[{x1,z1,x2,z2,type}], lights:[{x,z,radiusFt,color,flicker}],
//     props:[{type,x,z}], spawns:{party:[[x,z]], monsters:[{...}]},
//     exits:[{id,label,x,z,destinationMapId}] }
// plus metadata the client ignores (rooms count, roomRects, seed, generated) —
// roomRects exist so validateDungeon can prove room reachability from the
// emitted JSON alone.
//
// Conventions (matching gen_cellar.mjs / client TileGrid):
//   - 1 cell = 5ft; cells.wall = SOLID cells adjacent to open floor;
//   - walls are cell-BOUNDARY segments (x2/z2 = start + numCells, NOT the last
//     cell index) — multi-cell doors must span BOTH cells so the client's 5ft
//     frame math centers over the full 10ft opening (the gen_cellar Task-3 bug);
//   - door cells are FLOOR for movement; their wall segment blocks LOS while
//     closed; cross-axis frame = wall-column center, along-axis = run midpoint.
//
// Algorithm: BSP places room footprints; authored modules give each footprint a
// purpose/layout and compatible two-cell sockets. Corridors join those sockets,
// then loop links are added. A dedicated far chamber becomes the boss arena.
//
// Deterministic: a single mulberry32 stream seeded from `seed` drives every
// random choice (same seed + size → byte-identical map). Never throws; returns
// null only if the partitioner produces no rooms (cannot happen with the
// preset sizes).
//
// CLI: node server/src/maps/generator.mjs --seed 42 --size medium [--check] [--out file]
//   prints the map JSON to stdout; --check validates it first (exit 1 on fail).

// ── rng ──────────────────────────────────────────────────────────────────────

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s) {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── tuning ───────────────────────────────────────────────────────────────────

export const SIZES = {
  small:  { w: 40, h: 28, maxDepth: 2, monsters: 4, lights: 10 },
  medium: { w: 56, h: 40, maxDepth: 3, monsters: 6, lights: 14 },
  large:  { w: 72, h: 52, maxDepth: 4, monsters: 8, lights: 18 }
};

const MARGIN = 2;                    // solid map border
const MIN_ROOM = { w: 7, h: 6 };     // cells (inclusive rects)
const MAX_ROOM = { w: 14, h: 11 };
const ROOM_PAD = 1;                  // min rock between room rect and leaf edge
const SECRET_CHANCE = 0.12;
const ARCH_SOCKET = 'crypt_arch_2';   // matches the two-cell passage width
const CARDINALS = ['north', 'east', 'south', 'west'];
const SOCKETS_ALL = Object.fromEntries(CARDINALS.map((side) => [side, ARCH_SOCKET]));

export const ROOM_MODULES = {
  entry_vestibule: { id: 'entry_vestibule', minW: 7, minH: 6, sockets: SOCKETS_ALL },
  ossuary: { id: 'ossuary', minW: 8, minH: 6, sockets: SOCKETS_ALL },
  processional_gallery: { id: 'processional_gallery', minW: 10, minH: 7, sockets: SOCKETS_ALL },
  burial_chapel: { id: 'burial_chapel', minW: 9, minH: 7, sockets: SOCKETS_ALL },
  guard_chamber: { id: 'guard_chamber', minW: 7, minH: 6, sockets: SOCKETS_ALL },
  warden_arena: { id: 'warden_arena', minW: 10, minH: 8, sockets: SOCKETS_ALL, chamfer: 2 },
  warden_sanctum: { id: 'warden_sanctum', minW: 7, minH: 6, sockets: SOCKETS_ALL, chamfer: 1 },
};

const MAP_NAMES = [
  'The Sunken Crypts', 'The Ashen Warrens', 'The Bone Vaults', 'The Drowned Reliquary',
  'The Cinder Halls', 'The Pale Depths', 'The Hollow Ossuary', 'The Smoldering Catacombs'
];

// monsters_index.json ids (low-CR crypt roster) + client figure archetypes
const MOB_ROSTER = [
  { id: 'skeleton',  archetype: 'skeleton', name: 'Crypt Thrall',  w: 0.40 },
  { id: 'zombie',    archetype: 'skeleton', name: 'Barrow Dead',    w: 0.20 },
  { id: 'giant_rat', archetype: 'skeleton', name: 'Gnawing Horror', w: 0.15 },
  { id: 'cultist',   archetype: 'skeleton', name: 'Ashen Cultist',  w: 0.15 },
  { id: 'bandit',    archetype: 'skeleton', name: 'Tomb Robber',    w: 0.10 }
];
const BOSS = { id: 'specter', archetype: 'wraith' };
const BOSS_NAMES = ['The Ashen Warden', 'The Pale Warden', 'The Bone Chancellor', 'The Hollow Sentinel'];

// ── helpers ──────────────────────────────────────────────────────────────────

const centerX = (r) => Math.floor((r.x1 + r.x2) / 2);
const centerZ = (r) => Math.floor((r.z1 + r.z2) / 2);
const inRect = (r, x, z) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2;

function leafToRoom(leaf, idx, rng) {
  const w = leaf.x2 - leaf.x1 + 1;
  const h = leaf.z2 - leaf.z1 + 1;
  // leaves always fit MIN_ROOM + 2*ROOM_PAD (split guard), so these clamp safely
  const maxW = Math.min(MAX_ROOM.w, w - 2 * ROOM_PAD);
  const maxH = Math.min(MAX_ROOM.h, h - 2 * ROOM_PAD);
  const rw = MIN_ROOM.w + Math.floor(rng() * (maxW - MIN_ROOM.w + 1));
  const rh = MIN_ROOM.h + Math.floor(rng() * (maxH - MIN_ROOM.h + 1));
  const x1 = leaf.x1 + ROOM_PAD + Math.floor(rng() * (w - 2 * ROOM_PAD - rw + 1));
  const z1 = leaf.z1 + ROOM_PAD + Math.floor(rng() * (h - 2 * ROOM_PAD - rh + 1));
  return { idx, x1, z1, x2: x1 + rw - 1, z2: z1 + rh - 1 };
}

function roomDistance(a, b) {
  return Math.hypot(centerX(a) - centerX(b), centerZ(a) - centerZ(b));
}

function fitsModule(room, module) {
  return room.x2 - room.x1 + 1 >= module.minW && room.z2 - room.z1 + 1 >= module.minH;
}

function assignRoomModules(rooms, rng) {
  if (!rooms.length) return null;
  const entry = rooms[0];
  entry.module = ROOM_MODULES.entry_vestibule;
  const candidates = rooms.slice(1);
  if (!candidates.length) return null;
  const arenaRooms = candidates.filter((r) => fitsModule(r, ROOM_MODULES.warden_arena));
  const sanctumRooms = candidates.filter((r) => fitsModule(r, ROOM_MODULES.warden_sanctum));
  const bossCandidates = arenaRooms.length ? arenaRooms : sanctumRooms.length ? sanctumRooms : candidates;
  const bossRoom = bossCandidates.slice().sort((a, b) =>
    roomDistance(b, entry) - roomDistance(a, entry) ||
    ((b.x2 - b.x1 + 1) * (b.z2 - b.z1 + 1)) - ((a.x2 - a.x1 + 1) * (a.z2 - a.z1 + 1)) || a.idx - b.idx)[0];
  bossRoom.module = arenaRooms.length && fitsModule(bossRoom, ROOM_MODULES.warden_arena)
    ? ROOM_MODULES.warden_arena : ROOM_MODULES.warden_sanctum;

  const regularModules = [
    ROOM_MODULES.ossuary, ROOM_MODULES.processional_gallery,
    ROOM_MODULES.burial_chapel, ROOM_MODULES.guard_chamber,
  ];
  for (const room of rooms) {
    if (room === entry || room === bossRoom) continue;
    let eligible = regularModules.filter((module) => fitsModule(room, module));
    if (Math.max(room.x2 - room.x1 + 1, room.z2 - room.z1 + 1) /
      Math.min(room.x2 - room.x1 + 1, room.z2 - room.z1 + 1) < 1.35) {
      eligible = eligible.filter((module) => module !== ROOM_MODULES.processional_gallery);
    }
    if (!eligible.length) eligible = [ROOM_MODULES.guard_chamber];
    room.module = eligible[Math.floor(rng() * eligible.length)];
  }
  return bossRoom;
}

function chamferedCorner(room, x, z) {
  const cut = room.module?.chamfer || 0;
  if (!cut) return false;
  const dx = Math.min(x - room.x1, room.x2 - x);
  const dz = Math.min(z - room.z1, room.z2 - z);
  return dx + dz < cut;
}

function socketSide(room, run) {
  const [x, z] = run.cells[0];
  if (z < room.z1) return 'north';
  if (z > room.z2) return 'south';
  if (x < room.x1) return 'west';
  if (x > room.x2) return 'east';
  return null;
}

// ── generation ───────────────────────────────────────────────────────────────

export function generateDungeon({ seed = 1, size = 'medium' } = {}) {
  const cfg = SIZES[size] || SIZES.medium;
  const seedInt = typeof seed === 'number' ? (seed | 0) : hashSeed(seed);
  const rng = mulberry32(seedInt >>> 0);
  const W = cfg.w, H = cfg.h;

  // 1. BSP: partition + rooms + sibling connection pairs in one recursion.
  //    Every internal node bridges its two halves (closest rooms to the split),
  //    so the room graph is a spanning tree — the floor is connected by
  //    construction, whatever the partitioner does.
  const rooms = [];
  const pairs = [];
  const recurse = (region, depth) => {
    const w = region.x2 - region.x1 + 1;
    const h = region.z2 - region.z1 + 1;
    const fitsMax = w <= MAX_ROOM.w + 2 * (ROOM_PAD + 1) && h <= MAX_ROOM.h + 2 * (ROOM_PAD + 1);
    const earlyStop = w <= MAX_ROOM.w + 8 && h <= MAX_ROOM.h + 8 && rng() < 0.18;
    const canX = w >= 2 * (MIN_ROOM.w + ROOM_PAD + 1);
    const canZ = h >= 2 * (MIN_ROOM.h + ROOM_PAD + 1);
    if (depth >= cfg.maxDepth || fitsMax || earlyStop || (!canX && !canZ)) {
      const idx = rooms.length;
      rooms.push(leafToRoom(region, idx, rng));
      return [idx];
    }
    // split the longer axis (a quarter of the time the shorter, for variety)
    let axis = w >= h ? 'x' : 'z';
    if (canX && canZ && rng() < 0.25) axis = axis === 'x' ? 'z' : 'x';
    if ((axis === 'x' && !canX) || (axis === 'z' && !canZ)) axis = axis === 'x' ? 'z' : 'x';
    if ((axis === 'x' && !canX) || (axis === 'z' && !canZ)) {
      const idx = rooms.length;
      rooms.push(leafToRoom(region, idx, rng));
      return [idx];
    }
    const lo = axis === 'x' ? MIN_ROOM.w + ROOM_PAD + 1 : MIN_ROOM.h + ROOM_PAD + 1;
    const len = axis === 'x' ? w : h;
    const cut = Math.round(len * (0.35 + rng() * 0.30));
    const split = Math.max(lo, Math.min(len - lo, cut));
    let leftIdxs, rightIdxs;
    if (axis === 'x') {
      const sx = region.x1 + split - 1;                       // left = [x1..sx], right = [sx+1..x2]
      leftIdxs = recurse({ x1: region.x1, z1: region.z1, x2: sx, z2: region.z2 }, depth + 1);
      rightIdxs = recurse({ x1: sx + 1, z1: region.z1, x2: region.x2, z2: region.z2 }, depth + 1);
      const a = leftIdxs.reduce((b, i) => (b === -1 || rooms[i].x2 > rooms[b].x2) ? i : b, -1);
      const b = rightIdxs.reduce((b, i) => (b === -1 || rooms[i].x1 < rooms[b].x1) ? i : b, -1);
      pairs.push([a, b]);
    } else {
      const sz = region.z1 + split - 1;                       // north = [..sz], south = [sz+1..]
      leftIdxs = recurse({ x1: region.x1, z1: region.z1, x2: region.x2, z2: sz }, depth + 1);
      rightIdxs = recurse({ x1: region.x1, z1: sz + 1, x2: region.x2, z2: region.z2 }, depth + 1);
      const a = leftIdxs.reduce((b, i) => (b === -1 || rooms[i].z2 > rooms[b].z2) ? i : b, -1);
      const b = rightIdxs.reduce((b, i) => (b === -1 || rooms[i].z1 < rooms[b].z1) ? i : b, -1);
      pairs.push([a, b]);
    }
    return [...leftIdxs, ...rightIdxs];
  };
  recurse({ x1: MARGIN, z1: MARGIN, x2: W - 1 - MARGIN, z2: H - 1 - MARGIN }, 0);
  if (!rooms.length) return null;
  const bossRoom = assignRoomModules(rooms, rng);

  // 2. carve module footprints; the warden room gets a chamfered arena plan.
  const solid = Array.from({ length: H }, () => Array(W).fill(true));
  const carve = (x, z) => { if (x >= 0 && z >= 0 && x < W && z < H) solid[z][x] = false; };
  for (const r of rooms) {
    for (let z = r.z1; z <= r.z2; z++) for (let x = r.x1; x <= r.x2; x++) {
      if (!chamferedCorner(r, x, z)) carve(x, z);
    }
  }

  // 3. connections: the sibling tree + a few nearby cross-links (loops).
  //    Cross-links are only allowed when the corridor's center-bbox misses
  //    every OTHER room (±1) so loop corridors never slice through third rooms.
  const connections = pairs.map(([a, b]) => [rooms[a], rooms[b]]);
  const pairsByDist = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (connections.some(([a, b]) => (a.idx === i && b.idx === j) || (a.idx === j && b.idx === i))) continue;
      const d = Math.hypot(centerX(rooms[i]) - centerX(rooms[j]), centerZ(rooms[i]) - centerZ(rooms[j]));
      pairsByDist.push([d, i, j]);
    }
  }
  pairsByDist.sort((p, q) => p[0] - q[0]);
  const bboxClear = (i, j) => {
    const r = rooms[i], s = rooms[j];
    const bx1 = Math.min(centerX(r), centerX(s)) - 1, bx2 = Math.max(centerX(r), centerX(s)) + 1;
    const bz1 = Math.min(centerZ(r), centerZ(s)) - 1, bz2 = Math.max(centerZ(r), centerZ(s)) + 1;
    return rooms.every((t) => t.idx === i || t.idx === j ||
      t.x2 < bx1 || t.x1 > bx2 || t.z2 < bz1 || t.z1 > bz2);
  };
  const extra = Math.max(1, Math.floor((rooms.length - 1) / 3));
  let added = 0;
  for (const [, i, j] of pairsByDist) {
    if (added >= extra) break;
    if (!bboxClear(i, j)) continue;
    connections.push([rooms[i], rooms[j]]);
    added++;
  }

  // 4. carve L-corridors (2 cells / 10ft wide) + collect doorway candidates.
  //    Every room boundary must expose a compatible two-cell arch socket.
  const doorCandidates = [];
  const corridorLinks = [];
  const corridorPaths = [];
  const carveConnection = (A, B) => {
    const ax = centerX(A), az = centerZ(A), bx = centerX(B), bz = centerZ(B);
    const vFirst = rng() < 0.5;
    const path = [];                                   // ordered steps from A center to B center
    if (vFirst) {
      const dz = bz > az ? 1 : -1;
      for (let z = az + dz; z !== bz + dz; z += dz) path.push({ x: ax, z, dx: 0, dz });
      const dx = bx > ax ? 1 : -1;
      for (let x = ax + dx; x !== bx + dx; x += dx) path.push({ x, z: bz, dx, dz: 0 });
    } else {
      const dx = bx > ax ? 1 : -1;
      for (let x = ax + dx; x !== bx + dx; x += dx) path.push({ x, z: az, dx, dz: 0 });
      const dz = bz > az ? 1 : -1;
      for (let z = az + dz; z !== bz + dz; z += dz) path.push({ x: bx, z, dx: 0, dz });
    }
    for (const p of path) {
      if (p.dz !== 0) { carve(p.x, p.z); carve(p.x + 1, p.z); }   // vertical leg → 2-wide in x
      else { carve(p.x, p.z); carve(p.x, p.z + 1); }              // horizontal leg → 2-wide in z
    }
    // doorway run at each end: the trench's boundary crossing (first step
    // outside the room rect, walking from that room's center)
    const exitOf = (room, walk) => {
      for (const p of walk) {
        if (inRect(room, p.x, p.z)) continue;
        if (p.dz !== 0) {
          const ry = p.z;
          return { cells: [[p.x, ry], [p.x + 1, ry]], flanks: [[p.x - 1, ry], [p.x + 2, ry]], horizRun: true };
        }
        const rx = p.x;
        return { cells: [[rx, p.z], [rx, p.z + 1]], flanks: [[rx, p.z - 1], [rx, p.z + 2]], horizRun: false };
      }
      return null;
    };
    const endA = exitOf(A, path);
    const endB = exitOf(B, [...path].reverse().map((p) => ({ ...p, dx: -p.dx, dz: -p.dz })));
    const portA = endA && socketSide(A, endA);
    const portB = endB && socketSide(B, endB);
    const socketA = portA && A.module?.sockets?.[portA];
    const socketB = portB && B.module?.sockets?.[portB];
    if (socketA !== ARCH_SOCKET || socketB !== ARCH_SOCKET) {
      throw new Error(`incompatible crypt socket ${A.module?.id}:${portA} → ${B.module?.id}:${portB}`);
    }
    A.usedSockets = [...(A.usedSockets || []), portA];
    B.usedSockets = [...(B.usedSockets || []), portB];
    corridorLinks.push({
      from: A.idx, to: B.idx, fromPort: portA, toPort: portB,
      connector: ARCH_SOCKET, kind: path.length >= 14 ? 'processional' : 'passage',
    });
    corridorPaths.push(path);
    const first = rng() < 0.5 ? endA : endB;           // one door per corridor (not an airlock pair)
    const pick = first || endA || endB;
    if (pick) doorCandidates.push({ run: pick, secret: rng() < SECRET_CHANCE });
  };
  for (const [a, b] of connections) carveConnection(a, b);

  // 5. doors → wall segments. Validated against the FINAL grid (a later
  //    corridor can legitimately carve a candidate's flank → open archway,
  //    not a floating frame). x2/z2 = start + numCells (multi-cell convention).
  const doorSegs = [];
  const seenDoor = new Set();
  for (const { run, secret } of doorCandidates) {
    const openOK = run.cells.every(([x, z]) => x >= 0 && z >= 0 && x < W && z < H && !solid[z][x]);
    const flanksSolid = run.flanks.every(([x, z]) => x >= 0 && z >= 0 && x < W && z < H && solid[z][x]);
    if (!openOK || !flanksSolid) continue;
    const [[x1, z1]] = run.cells;
    const n = run.cells.length;
    const seg = run.horizRun
      ? { x1, z1, x2: x1 + n, z2: z1, type: secret ? 'secret_door' : 'door' }
      : { x1, z1, x2: x1, z2: z1 + n, type: secret ? 'secret_door' : 'door' };
    const key = `${seg.x1},${seg.z1},${seg.x2},${seg.z2}`;
    if (seenDoor.has(key)) continue;
    seenDoor.add(key);
    doorSegs.push(seg);
  }

  // 6. wall cells + merged LOS segments (same extraction as gen_cellar.mjs)
  const wallCells = [];
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (!solid[z][x]) continue;
    const openNeighbor =
      (x > 0 && !solid[z][x - 1]) || (x < W - 1 && !solid[z][x + 1]) ||
      (z > 0 && !solid[z - 1][x]) || (z < H - 1 && !solid[z + 1][x]);
    if (openNeighbor) wallCells.push([x, z]);
  }
  const walls = [];
  const segSet = new Set();
  const pushSeg = (x1, z1, x2, z2) => {
    const key = `${x1},${z1},${x2},${z2}`;
    if (segSet.has(key)) return;
    segSet.add(key);
    walls.push({ x1, z1, x2, z2, type: 'normal' });
  };
  const hMap = new Map(), vMap = new Map();
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (solid[z][x]) continue;
    if (z === 0 || solid[z - 1][x]) { const l = hMap.get(z) || []; l.push(x); hMap.set(z, l); }
    if (z === H - 1 || solid[z + 1][x]) { const l = hMap.get(z + 1) || []; l.push(x); hMap.set(z + 1, l); }
    if (x === 0 || solid[z][x - 1]) { const l = vMap.get(x) || []; l.push(z); vMap.set(x, l); }
    if (x === W - 1 || solid[z][x + 1]) { const l = vMap.get(x + 1) || []; l.push(z); vMap.set(x + 1, l); }
  }
  for (const [z, xs] of hMap) {
    xs.sort((a, b) => a - b);
    let start = xs[0], prev = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      const cur = xs[i];
      if (cur !== prev + 1) { pushSeg(start, z, prev + 1, z); start = cur; }
      prev = cur;
    }
  }
  for (const [x, zs] of vMap) {
    zs.sort((a, b) => a - b);
    let start = zs[0], prev = zs[0];
    for (let i = 1; i <= zs.length; i++) {
      const cur = zs[i];
      if (cur !== prev + 1) { pushSeg(x, start, x, prev + 1); start = cur; }
      prev = cur;
    }
  }
  walls.push(...doorSegs);

  // 7. props + lights + spawns (themed, seeded; prop cells never overlap spawn
  //    cells — the occupied set is shared)
  const occupied = new Set();                          // "cx,cz" cells to keep clear
  const freeCells = (r, inset = 1) => {
    const out = [];
    for (let z = r.z1 + inset; z <= r.z2 - inset; z++) {
      for (let x = r.x1 + inset; x <= r.x2 - inset; x++) {
        if (!solid[z][x] && !occupied.has(x + ',' + z)) out.push([x, z]);
      }
    }
    return out;
  };
  const spawn = { x: centerX(rooms[0]) + 0.5, z: centerZ(rooms[0]) + 0.5 };
  occupied.add(centerX(rooms[0]) + ',' + centerZ(rooms[0]));

  // distal bias: later rooms by distance from the party room, far first
  const distal = rooms.filter((r) => r !== rooms[0] && r !== bossRoom)
    .map((r) => ({ r, d: roomDistance(r, rooms[0]) }))
    .sort((a, b) => b.d - a.d)
    .map((e) => e.r);

  const pickMob = () => {
    const roll = rng() * MOB_ROSTER.reduce((s, m) => s + m.w, 0);
    let acc = 0;
    for (const m of MOB_ROSTER) { acc += m.w; if (roll < acc) return m; }
    return MOB_ROSTER[0];
  };

  const props = [];
  const lights = [];
  let lightBudget = cfg.lights;

  const addBrazier = (x, z) => {
    if (x < 0 || z < 0 || x >= W || z >= H || solid[z][x] || occupied.has(x + ',' + z)) return false;
    props.push({ type: 'brazier', x: x + 0.5, z: z + 0.5 });
    if (lightBudget > 0) {
      lights.push({ x: x + 0.5, z: z + 0.5, radiusFt: 30, color: '#ff9a4d', flicker: true });
      lightBudget--;
    }
    occupied.add(x + ',' + z);
    return true;
  };

  const addPillar = (x, z) => {
    if (x <= 0 || z <= 0 || x >= W - 1 || z >= H - 1 || solid[z][x] || occupied.has(x + ',' + z)) return;
    props.push({ type: 'pillar', x: x + 0.5, z: z + 0.5 });
    occupied.add(x + ',' + z);
  };
  const addCoffin = (x, z) => {
    if (x <= 0 || z <= 0 || x >= W - 1 || z >= H - 2 || solid[z][x] || solid[z + 1][x] ||
      occupied.has(x + ',' + z) || occupied.has(x + ',' + (z + 1))) return;
    props.push({ type: 'coffin', x: x + 0.5, z: z + 1 });
    occupied.add(x + ',' + z); occupied.add(x + ',' + (z + 1));
  };
  const addAltar = (x, z) => {
    if (x <= 1 || z <= 1 || x >= W - 2 || z >= H - 2 || solid[z][x] || occupied.has(x + ',' + z)) return;
    props.push({ type: 'altar', x: x + 0.5, z: z + 0.5 });
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) occupied.add((x + dx) + ',' + (z + dz));
  };
  const addRubble = (x, z) => {
    if (x < 0 || z < 0 || x >= W || z >= H || solid[z][x] || occupied.has(x + ',' + z)) return;
    props.push({ type: 'rubble', x: x + 0.5, z: z + 0.5 });
    occupied.add(x + ',' + z);
  };

  for (const r of rooms) {
    const cx = centerX(r), cz = centerZ(r);
    switch (r.module.id) {
      case 'entry_vestibule':
        addBrazier(r.x1 + 1, cz);
        addBrazier(r.x2 - 1, cz);
        break;
      case 'ossuary':
        addCoffin(r.x1 + 2, r.z1 + 2);
        addCoffin(r.x2 - 2, r.z2 - 3);
        addCoffin(r.x1 + 2, r.z2 - 3);
        addBrazier(cx, r.z1 + 1);
        break;
      case 'processional_gallery':
        for (const x of [r.x1 + 2, r.x2 - 2]) {
          for (const z of [r.z1 + 2, r.z2 - 2]) addPillar(x, z);
        }
        addBrazier(cx, r.z1 + 1);
        addBrazier(cx, r.z2 - 1);
        break;
      case 'burial_chapel':
        addAltar(cx, r.z1 + 2);
        addBrazier(r.x1 + 2, cz + 1);
        addBrazier(r.x2 - 2, cz + 1);
        addPillar(r.x1 + 2, r.z2 - 2);
        addPillar(r.x2 - 2, r.z2 - 2);
        break;
      case 'warden_arena':
      case 'warden_sanctum':
        addAltar(cx, r.z2 - 2);
        addBrazier(r.x1 + 1, cz);
        addBrazier(r.x2 - 1, cz);
        addPillar(r.x1 + 3, r.z1 + 3);
        addPillar(r.x2 - 3, r.z1 + 3);
        addPillar(r.x1 + 3, r.z2 - 3);
        addPillar(r.x2 - 3, r.z2 - 3);
        break;
      default:
        addPillar(r.x1 + 2, r.z1 + 2);
        addPillar(r.x2 - 2, r.z2 - 2);
        addBrazier(cx, r.z1 + 1);
        addRubble(r.x1 + 1, r.z2 - 1);
        break;
    }
    if (r.module.id !== 'entry_vestibule' && r.module.id !== 'warden_arena' && r.module.id !== 'warden_sanctum' && lightBudget > 0) {
      lights.push({ x: cx + 0.5, z: cz + 0.5, radiusFt: 18, color: '#7fd4c8', flicker: false });
      lightBudget--;
    }
  }

  for (const path of corridorPaths) {
    if (path.length < 14) continue;
    for (let i = 5; i < path.length - 3; i += 9) {
      const p = path[i];
      if (rooms.some((r) => inRect(r, p.x, p.z))) continue;
      const sideCell = p.dz !== 0 ? [p.x + 1, p.z] : [p.x, p.z + 1];
      if (!rooms.some((r) => inRect(r, sideCell[0], sideCell[1]))) addBrazier(sideCell[0], sideCell[1]);
    }
  }

  // monster spawns: one per encounter module, with the boss staged centrally.
  const monsters = [];
  const monsterAt = (r, mob, name, opts = {}) => {
    const cells = freeCells(r);
    const c = cells[Math.floor(rng() * cells.length)] || [centerX(r), centerZ(r)];
    occupied.add(c[0] + ',' + c[1]);
    monsters.push({ archetype: mob.archetype, monsterId: mob.id, name, x: c[0] + 0.5, z: c[1] + 0.5, ...opts });
  };
  if (bossRoom) {
    const x = centerX(bossRoom), z = centerZ(bossRoom);
    occupied.add(x + ',' + z);
    monsters.push({
      archetype: BOSS.archetype, monsterId: BOSS.id,
      name: BOSS_NAMES[Math.floor(rng() * BOSS_NAMES.length)],
      x: x + 0.5, z: z + 0.5, size: 1.2,
    });
  }
  let budget = cfg.monsters - monsters.length;
  for (const r of distal) {
    if (budget <= 0) break;
    const mob = pickMob();
    monsterAt(r, mob, mob.name, { hidden: rng() < 0.3 });
    budget--;
  }
  for (const r of distal) {                             // leftovers double up, far rooms first
    if (budget <= 0) break;
    const mob = pickMob();
    monsterAt(r, mob, mob.name, {});
    budget--;
  }

  // 8. assemble the MapDef (exact ashen_cellar shape + metadata)
  return {
    id: `gen_${seedInt}`,
    name: `${MAP_NAMES[Math.floor(rng() * MAP_NAMES.length)]} (${size})`,
    size: { w: W, h: H },
    theme: 'crypt',
    tileSet: 'crypt',
    floor: 'stone',
    cells: { wall: wallCells },
    walls,
    lights,
    props,
    spawns: { party: [[spawn.x, spawn.z]], monsters },
    exits: [{
      id: 'dungeon-entrance',
      label: 'Return to the Ashen Reach',
      x: spawn.x + 2,
      z: spawn.z + 0.5,
      returnToPrevious: true,
    }],
    // metadata (client ignores; validator + DM tooling read it)
    rooms: rooms.length,
    roomRects: rooms.map((r) => ({
      id: r.idx, x1: r.x1, z1: r.z1, x2: r.x2, z2: r.z2,
      module: r.module.id, sockets: r.module.sockets, usedSockets: r.usedSockets || [],
    })),
    corridorLinks,
    bossRoom: bossRoom?.idx ?? null,
    seed: seedInt,
    generated: true
  };
}

// ── validation (pure — proves the emitted JSON, not the internals) ───────────
// Checks: shape, flood-fill connectivity from the party spawn (every room rect
// center reachable), door segments wall-adjacent (opening cells on the
// connected floor, flanks solid), monster spawns on floor, no zero-room output.
//
// Solid reconstruction from the JSON alone: cells.wall lists every solid cell
// adjacent to open floor, so any non-listed cell touching the reachable floor
// is floor (rock never borders floor without being listed) — BFS from the
// party spawn walks exactly the connected floor component.

export function validateDungeon(map) {
  const errors = [];
  const stats = { rooms: 0, modules: 0, corridors: 0, floorCells: 0, doors: 0, monsters: 0, props: 0, lights: 0 };
  if (!map || typeof map !== 'object') return { ok: false, errors: ['map is not an object'], stats };
  const { size, cells, spawns } = map;
  if (!size || !Number.isInteger(size.w) || !Number.isInteger(size.h) || size.w < 10 || size.h < 10) {
    return { ok: false, errors: ['bad size'], stats };
  }
  if (!Array.isArray(cells?.wall)) return { ok: false, errors: ['cells.wall missing'], stats };
  const W = size.w, H = size.h;
  const wall = new Set(cells.wall.map(([x, z]) => x + ',' + z));
  const inB = (x, z) => x >= 0 && z >= 0 && x < W && z < H;

  const spawn = spawns?.party?.[0];
  if (!Array.isArray(spawn)) return { ok: false, errors: ['spawns.party missing'], stats };
  const scx = Math.floor(Number(spawn[0])), scz = Math.floor(Number(spawn[1]));
  if (!inB(scx, scz) || wall.has(scx + ',' + scz)) errors.push(`party spawn (${scx},${scz}) not on open floor`);

  const seen = new Set();
  if (inB(scx, scz) && !wall.has(scx + ',' + scz)) {
    const q = [[scx, scz]];
    seen.add(scx + ',' + scz);
    while (q.length) {
      const [x, z] = q.pop();
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz, k = nx + ',' + nz;
        if (!inB(nx, nz) || wall.has(k) || seen.has(k)) continue;
        seen.add(k);
        q.push([nx, nz]);
      }
    }
  }
  stats.floorCells = seen.size;
  if (stats.floorCells < Math.floor(W * H * 0.15)) errors.push(`suspiciously little floor (${stats.floorCells} cells)`);

  // rooms: every room rect center must sit on the connected floor
  const rects = Array.isArray(map.roomRects) ? map.roomRects : [];
  stats.rooms = rects.length || Number(map.rooms) || 0;
  if (!stats.rooms) errors.push('zero rooms');
  for (const r of rects) {
    const cx = Math.floor((r.x1 + r.x2) / 2), cz = Math.floor((r.z1 + r.z2) / 2);
    if (!seen.has(cx + ',' + cz)) errors.push(`room ${JSON.stringify(r)} center not reachable from party spawn`);
  }

  if (rects.length && Array.isArray(map.corridorLinks)) {
    const byId = new Map(rects.map((r) => [r.id, r]));
    stats.modules = rects.filter((r) => ROOM_MODULES[r.module]).length;
    if (stats.modules !== rects.length) errors.push('one or more rooms use an unknown module');
    stats.corridors = map.corridorLinks.length;
    if (stats.corridors < rects.length - 1) errors.push('room modules are not joined by a spanning set of corridors');
    for (const link of map.corridorLinks) {
      const from = byId.get(link.from), to = byId.get(link.to);
      if (!from || !to) { errors.push(`corridor references missing room ${link.from} → ${link.to}`); continue; }
      if (ROOM_MODULES[from.module]?.sockets?.[link.fromPort] !== link.connector ||
        ROOM_MODULES[to.module]?.sockets?.[link.toPort] !== link.connector) {
        errors.push(`corridor ${link.from} → ${link.to} has incompatible sockets`);
      }
    }
    const boss = byId.get(map.bossRoom);
    if (!boss || !['warden_arena', 'warden_sanctum'].includes(boss.module)) {
      errors.push('boss room is missing or has no boss module');
    }
  }

  // door segments: opening cells floor + flanked by solid (wall-adjacent frames)
  let doors = 0;
  for (const w of map.walls || []) {
    if (w.type !== 'door' && w.type !== 'secret_door') continue;
    doors++;
    const openCells = [], flanks = [];
    if (w.x1 === w.x2) {
      for (let z = w.z1; z < w.z2; z++) openCells.push([w.x1, z]);
      flanks.push([w.x1, w.z1 - 1], [w.x1, w.z2]);
    } else {
      for (let x = w.x1; x < w.x2; x++) openCells.push([x, w.z1]);
      flanks.push([w.x1 - 1, w.z1], [w.x2, w.z1]);
    }
    if (!openCells.length) { errors.push(`door ${JSON.stringify(w)} has an empty opening`); continue; }
    for (const [x, z] of openCells) {
      if (!inB(x, z) || wall.has(x + ',' + z) || !seen.has(x + ',' + z)) {
        errors.push(`door ${JSON.stringify(w)} opening cell (${x},${z}) is not connected floor`);
      }
    }
    for (const [x, z] of flanks) {
      if (!inB(x, z) || !wall.has(x + ',' + z)) {
        errors.push(`door ${JSON.stringify(w)} flank (${x},${z}) is not solid — frame would float`);
      }
    }
  }
  stats.doors = doors;
  if (doors === 0) errors.push('no doors generated');

  for (const exit of map.exits || []) {
    const x = Number(exit?.x), z = Number(exit?.z);
    const cx = Math.floor(x), cz = Math.floor(z);
    if (!exit?.id || !exit?.label || !Number.isFinite(x) || !Number.isFinite(z) ||
      !inB(cx, cz) || wall.has(cx + ',' + cz) || !seen.has(cx + ',' + cz)) {
      errors.push(`exit ${JSON.stringify(exit)} is not on reachable floor`);
    }
    if (!exit.destinationMapId && !exit.returnToPrevious) {
      errors.push(`exit ${JSON.stringify(exit)} has no destination`);
    }
  }

  // monster spawns on connected floor
  for (const m of spawns?.monsters || []) {
    const cx = Math.floor(Number(m.x)), cz = Math.floor(Number(m.z));
    if (!inB(cx, cz) || wall.has(cx + ',' + cz) || !seen.has(cx + ',' + cz)) {
      errors.push(`monster spawn (${m.name || m.monsterId}) at (${cx},${cz}) not on connected floor`);
    }
  }
  stats.monsters = (spawns?.monsters || []).length;
  stats.props = (map.props || []).length;
  stats.lights = (map.lights || []).length;
  return { ok: errors.length === 0, errors, stats };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const argv0 = process.argv[1] || '';
if (argv0 && import.meta.url.endsWith(argv0.split(/[\\/]/).pop())) {
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const seedRaw = flag('--seed');
  const seed = seedRaw !== undefined ? (seedRaw !== '' && Number.isFinite(Number(seedRaw)) ? Number(seedRaw) : (seedRaw || 1)) : 1;
  const size = flag('--size') || 'medium';
  const map = generateDungeon({ seed, size });
  if (!map) { console.error('generation failed'); process.exit(1); }
  if (argv.includes('--check')) {
    const v = validateDungeon(map);
    if (!v.ok) { console.error('VALIDATION FAILED:\n' + v.errors.join('\n')); process.exit(1); }
    console.error(`validated: ${v.stats.rooms} rooms/${v.stats.modules} modules, ${v.stats.corridors} connectors, ${v.stats.floorCells} floor cells, ${v.stats.doors} doors, ${v.stats.monsters} monsters, ${v.stats.props} props, ${v.stats.lights} lights`);
  }
  const out = JSON.stringify(map);
  const outFile = flag('--out');
  if (outFile) {
    const fs = await import('node:fs');
    fs.writeFileSync(outFile, out);
  }
  console.log(out);
}
