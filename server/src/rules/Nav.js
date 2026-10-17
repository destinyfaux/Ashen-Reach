// ASHENREACH — server/src/rules/Nav.js
// Grid pathfinding for monsters (P3.4). Plain ESM, zero deps, never throws.
//
// World coords are FEET; one cell = CELL_FT (5 ft, mirroring CombatEngine).
// All blockers are expressed as a caller-supplied predicate over CELL
// coordinates: blocked(cx, cz) -> true when a creature cannot stand there.
// GameManager wires that predicate to isBlockedAt() + prop overlap + region
// bounds, so paths respect walls, half-walls, closed doors, props and the
// streamed-region boundary in ONE place.
//
// Public API:
//   aStarPath(blocked, fromX, fromZ, toX, toZ, opts?) -> [{x,z},...] | null
//       8-directional A* over cells with no corner-cutting, greedy
//       line-of-sight simplification, cell-center waypoints in world feet.
//   losClear(blocked, x0, z0, x1, z1, opts?) -> bool
//       supersampled segment walk (no blocked cell touched).
//   routeStep(blocked, fromX, fromZ, toX, toZ, budgetFt, opts?) -> {x,z} | null
//       farthest point along the A* path reachable within budgetFt — the
//       "first move" a monster can actually take this turn.

const CELL_FT = 5;
const SQRT2 = Math.SQRT2;
const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2],
];

const cellOf = (v, cellFt) => Math.floor(v / cellFt);
const centerOf = (c, cellFt) => (c + 0.5) * cellFt;
const key = (x, z) => x + ',' + z;

/** Bresenham-ish supersample: does the straight segment touch a blocked cell? */
export function losClear(blocked, x0, z0, x1, z1, opts = {}) {
  const cellFt = Number(opts.cellFt) || CELL_FT;
  const dx = x1 - x0, dz = z1 - z0;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / (cellFt * 0.34)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = cellOf(x0 + dx * t, cellFt), cz = cellOf(z0 + dz * t, cellFt);
    if (blocked(cx, cz)) return false;
  }
  return true;
}

/** Greedy string-pull: keep the farthest waypoint visible from `from`. */
function simplify(blocked, fromX, fromZ, cells, cellFt) {
  const out = [];
  let ax = fromX, az = fromZ;
  let i = 0;
  while (i < cells.length) {
    let best = i;
    for (let j = cells.length - 1; j > i; j--) {
      if (losClear(blocked, ax, az, centerOf(cells[j][0], cellFt), centerOf(cells[j][1], cellFt), { cellFt })) {
        best = j; break;
      }
    }
    const [cx, cz] = cells[best];
    out.push({ x: centerOf(cx, cellFt), z: centerOf(cz, cellFt) });
    ax = out[out.length - 1].x; az = out[out.length - 1].z;
    i = best + 1;
  }
  return out;
}

/**
 * A* over the cell grid. Returns simplified waypoints (world feet, cell
 * centers), excluding the start cell, including the goal — or null when the
 * goal is unreachable / blocked / out of the node budget.
 */
export function aStarPath(blocked, fromX, fromZ, toX, toZ, opts = {}) {
  try {
    const cellFt = Number(opts.cellFt) || CELL_FT;
    const maxNodes = Number(opts.maxNodes) || 1600;
    const start = [cellOf(fromX, cellFt), cellOf(fromZ, cellFt)];
    const goal = [cellOf(toX, cellFt), cellOf(toZ, cellFt)];
    if (blocked(goal[0], goal[1])) {
      const near = nearestFreeCell(blocked, goal[0], goal[1], 2);
      if (!near) return null;
      goal[0] = near[0]; goal[1] = near[1];
    }
    if (start[0] === goal[0] && start[1] === goal[1]) return [];

    const g = new Map([[key(start[0], start[1]), 0]]);
    const parent = new Map();
    const h = (cx, cz) => {
      const ax = Math.abs(cx - goal[0]), az = Math.abs(cz - goal[1]);
      return (ax + az) + (SQRT2 - 2) * Math.min(ax, az);   // octile
    };
    // binary heap on [f, cx, cz]
    const open = [[h(start[0], start[1]), start[0], start[1]]];
    const push = (n) => {
      open.push(n);
      let i = open.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (open[p][0] <= open[i][0]) break;
        [open[p], open[i]] = [open[i], open[p]]; i = p;
      }
    };
    const pop = () => {
      const top = open[0], last = open.pop();
      if (open.length) {
        open[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1; let m = i;
          if (l < open.length && open[l][0] < open[m][0]) m = l;
          if (r < open.length && open[r][0] < open[m][0]) m = r;
          if (m === i) break;
          [open[m], open[i]] = [open[i], open[m]]; i = m;
        }
      }
      return top;
    };

    let expanded = 0;
    let found = false;
    while (open.length && expanded < maxNodes) {
      const [, cx, cz] = pop();
      if (cx === goal[0] && cz === goal[1]) { found = true; break; }
      expanded++;
      const gCur = g.get(key(cx, cz));
      for (const [dx, dz, cost] of DIRS) {
        const nx = cx + dx, nz = cz + dz;
        if (blocked(nx, nz)) continue;
        // no corner-cutting: diagonals need both orthogonal neighbors free
        if (dx !== 0 && dz !== 0 && (blocked(cx + dx, cz) || blocked(cx, cz + dz))) continue;
        const ng = gCur + cost;
        const nk = key(nx, nz);
        if (g.has(nk) && g.get(nk) <= ng) continue;
        g.set(nk, ng);
        parent.set(nk, key(cx, cz));
        push([ng + h(nx, nz), nx, nz]);
      }
    }
    if (!found) return null;

    const cells = [];
    let k = key(goal[0], goal[1]);
    while (k && k !== key(start[0], start[1])) {
      const [cx, cz] = k.split(',').map(Number);
      cells.push([cx, cz]);
      k = parent.get(k);
    }
    cells.reverse();
    return simplify(blocked, fromX, fromZ, cells, cellFt);
  } catch {
    return null;
  }
}

/** Spiral search for the closest free cell within maxR (returns [cx,cz]|null). */
export function nearestFreeCell(blocked, cx, cz, maxR = 3) {
  if (!blocked(cx, cz)) return [cx, cz];
  for (let r = 1; r <= maxR; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!blocked(cx + dx, cz + dz)) return [cx + dx, cz + dz];
      }
    }
  }
  return null;
}

/**
 * First move along the path from (fromX,fromZ) toward (toX,toZ), consuming at
 * most budgetFt. Returns the farthest in-budget waypoint (or a clamped final
 * segment), or null when no path exists. Direct line-of-sight shortcuts to
 * the goal without invoking A* when visible.
 */
export function routeStep(blocked, fromX, fromZ, toX, toZ, budgetFt, opts = {}) {
  const cellFt = Number(opts.cellFt) || CELL_FT;
  const budget = Math.max(0, Number(budgetFt) || 0);
  if (budget <= 0.01) return null;
  const direct = Math.hypot(toX - fromX, toZ - fromZ);
  if (direct <= 0.01) return null;
  if (losClear(blocked, fromX, fromZ, toX, toZ, { cellFt })) {
    const step = Math.min(budget, direct);
    const t = step / direct;
    return { x: fromX + (toX - fromX) * t, z: fromZ + (toZ - fromZ) * t };
  }
  const path = aStarPath(blocked, fromX, fromZ, toX, toZ, opts);
  if (!path || !path.length) return null;
  let px = fromX, pz = fromZ, used = 0, best = null;
  for (const wp of path) {
    const leg = Math.hypot(wp.x - px, wp.z - pz);
    if (used + leg > budget) {
      const remain = budget - used;
      if (remain > 0.5 && leg > 0.01) {
        const t = remain / leg;
        best = { x: px + (wp.x - px) * t, z: pz + (wp.z - pz) * t };
      }
      break;
    }
    px = wp.x; pz = wp.z; used += leg;
    best = { x: px, z: pz };
  }
  return best;
}
