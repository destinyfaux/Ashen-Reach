// townLayout.mjs — P3.8 enforced town construction rules.
//
// Single source of truth for town layout, imported by BOTH region generators
// (worldGenerator.mjs home town + world.mjs streamed town sites). Pure and
// deterministic: every decision comes from the caller-provided rng stream in
// a fixed order, so a given seed always yields the same town.
//
// Enforced rules (P3.8):
//   1. ~3 layout variants: 'grid' | 'crescent' | 'scattered'
//   2. terrain is flattened under every building footprint (buildings never
//      float) — see flattenTownFootprint()
//   3. sensible spacing: oriented building rects keep >= MIN_YARD_GAP cells
//      of yard between them
//   4. building yaw aligned to roads/plots: grid rows face the road axis,
//      crescent/scattered face the central plaza
//   5. towns are placed away from water: siteSupportsTown() surveys the whole
//      footprint (+ margin) against caller-supplied water/road predicates
//      before any plot exists, so rivers never run under or through a town
//
// Units: positions in CELLS (1 cell = 5 ft), heights in feet. rotY is the
// three.js yaw where the building's door (+z local) points toward
// (sin(rotY), cos(rotY)) — matching facingToward() in world.mjs.

export const TOWN_VARIANTS = ['grid', 'crescent', 'scattered', 'hamlet']; // hamlet = services-only last resort

// Tunables (exported so tests and validators share the exact numbers).
export const TOWN_RULES = {
  MIN_YARD_GAP: 1.2,        // cells of alley between building rects (authored-town density)
  SURVEY_MARGIN: 1.0,       // cells of cleared margin around each footprint (WATER)
  ROAD_INSET: 0.75,         // buildings may overlap road cells by this much
                            // (the authored home town did; roads are fronted)
  ROAD_CENTER_BOX: 0.3608,  // GameManager's server collider: w * CELL * 0.82 * 0.44
                            // ft per unit width / CELL -> cells; a road CELL
                            // CENTER inside this box would block walking
  PAD_MARGIN: 0.5,          // footprint cells widened by this for the pad (keeps pads disjoint)
  BLEND_CELLS: 5,           // pad -> terrain blend ring width (gentle grade)
  RELAX_CAP: 4.2,           // ft per vertex step in the pad blend ring
  GRID_ROW_OFFSET: 6.0,     // cells from street centerline to building center
  GRID_SECOND_ROW: 14.0,    // cells for the outer streets (keeps 2.5 gap)
  CRESCENT_R: 18,           // single horseshoe ring radius (cells)
  CRESCENT_GAP_PAD: 1.0,    // slack added to chord widths inside the ring
  CRESCENT_NUDGE_R: 1.4,    // dodge radius nudge when a ring slot is blocked
  CRESCENT_NUDGE_A: 0.07,   // dodge angle nudge (rad)
  SCATTER_MIN_R: 4,
  SCATTER_MAX_R: 13,
  YAW_TOL: 0.25,            // rad tolerance for "faces the plaza" checks
  AXIS_TOL: 0.12,           // rad tolerance for grid axis alignment
};

// Service buildings every town must have (validateOverworld asserts these).
const SERVICE_SPECS = [
  { variant: 'inn', label: "The Wayfarer's Rest", width: 8, depth: 6 },
  { variant: 'general_store', label: 'General Store', width: 6, depth: 5 },
  { variant: 'smithy', label: 'The Bent Nail', width: 7, depth: 6 },
  { variant: 'healer', label: 'Hearth & Remedy', width: 6, depth: 5 },
];
const HOUSE_SPECS = [
  { variant: 'house', label: '', width: 5, depth: 5 },
  { variant: 'house', label: '', width: 6, depth: 5 },
  { variant: 'house', label: '', width: 5, depth: 5 },
  { variant: 'house', label: '', width: 6, depth: 5 },
];

export function pickTownVariant(rng) {
  const r = rng();
  if (r < 0.4) return 'grid';
  if (r < 0.75) return 'crescent';
  return 'scattered';
}

// Per-axis half extents of an oriented rect (cells), margin-expanded.
export function buildingExtents(b, margin = 0) {
  const c = Math.abs(Math.cos(b.rotY || 0)), s = Math.abs(Math.sin(b.rotY || 0));
  return {
    hx: (b.width / 2 + margin) * c + (b.depth / 2 + margin) * s,
    hz: (b.width / 2 + margin) * s + (b.depth / 2 + margin) * c,
  };
}

// Corners + center of an oriented rect (5 points, cell coords).
export function buildingCorners(b, margin = 0) {
  const { hx, hz } = buildingExtents(b, margin);
  return [
    { x: b.x - hx, z: b.z - hz }, { x: b.x + hx, z: b.z - hz },
    { x: b.x + hx, z: b.z + hz }, { x: b.x - hx, z: b.z + hz },
    { x: b.x, z: b.z },
  ];
}

// Conservative separation between two oriented rects (cells). Returns a LOWER
// bound of the true edge distance when separated (enforcing this guarantees
// real spacing), or -1 when they overlap. SAT: separated iff ANY axis shows a
// positive projection gap; the reported gap is the largest such projection.
export function rectGap(a, b) {
  const axes = [];
  for (const r of [a, b]) {
    const rot = r.rotY || 0;
    axes.push({ x: Math.cos(rot), z: -Math.sin(rot) }, { x: Math.sin(rot), z: Math.cos(rot) });
  }
  const dx = b.x - a.x, dz = b.z - a.z;
  let best = -Infinity;
  for (const ax of axes) {
    const aExt = (a.width / 2) * Math.abs(ax.x) + (a.depth / 2) * Math.abs(ax.z);
    const bExt = (b.width / 2) * Math.abs(ax.x) + (b.depth / 2) * Math.abs(ax.z);
    best = Math.max(best, Math.abs(dx * ax.x + dz * ax.z) - aExt - bExt);
  }
  return best > 0 ? best : -1;
}

// Two-lattice footprint check. WATER is a hard blocker (strict margin — a
// river must never run under a building); ROADS are checked on an INSET rect
// because buildings legitimately front/overlap road edges (the authored home
// town shipped that way). survey.blocked(x, z, kind) with kind 'water' or
// 'road' lets callers separate the two; a 2-arg blocked() is treated as
// strict-for-both.
function rectFits(b, survey) {
  const lxh = b.width / 2, lzh = b.depth / 2;
  const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
  const sweep = (margin, kind) => {
    const ex = lxh + margin, ez = lzh + margin;
    if (ex <= 0 || ez <= 0) return false;
    // pitch 0.8 < 1 cell so no single water cell can hide between samples
    const step = kind === 'water' ? 0.8 : 1.4;
    const nx = Math.max(1, Math.ceil((2 * ex) / step));
    const nz = Math.max(1, Math.ceil((2 * ez) / step));
    for (let iz = 0; iz <= nz; iz++) {
      for (let ix = 0; ix <= nx; ix++) {
        const lx = -ex + (2 * ex * ix) / nx;
        const lz = -ez + (2 * ez * iz) / nz;
        const x = b.x + lx * c + lz * s;
        const z = b.z - lx * s + lz * c;
        if (survey.blocked(x, z, kind)) return true;
      }
    }
    return false;
  };
  if (sweep(TOWN_RULES.SURVEY_MARGIN, 'water')) return false;
  // road rule: edges may overlap (roads are fronted), but a road CELL CENTER
  // inside the server collider box would make the street unwalkable
  const rc = Math.cos(b.rotY || 0), rs = Math.sin(b.rotY || 0);
  const bx = Math.abs(b.width * TOWN_RULES.ROAD_CENTER_BOX * rc) +
    Math.abs(b.depth * TOWN_RULES.ROAD_CENTER_BOX * rs);
  const bz = Math.abs(b.width * TOWN_RULES.ROAD_CENTER_BOX * rs) +
    Math.abs(b.depth * TOWN_RULES.ROAD_CENTER_BOX * rc);
  const minX = Math.floor(b.x - bx - 1), maxX = Math.ceil(b.x + bx + 1);
  const minZ = Math.floor(b.z - bz - 1), maxZ = Math.ceil(b.z + bz + 1);
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      if (!survey.blocked(x + 0.5, z + 0.5, 'road')) continue;
      const dx = x + 0.5 - b.x, dz = z + 0.5 - b.z;
      if (Math.abs(dx) < bx + 0.17 && Math.abs(dz) < bz + 0.17) return false;
    }
  }
  return true;
}

function spaced(b, placed) {
  for (const other of placed) {
    if (rectGap(b, other) < TOWN_RULES.MIN_YARD_GAP - 1e-6) return false;
  }
  return true;
}

function yawToward(from, to) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/**
 * Build a deterministic town layout.
 * @param opts { rng, cx, cz, roadDir?, survey, maxRadius?, variant? }
 *   survey: { blocked(x,z) — water/road/out-of-map, inBounds(x,z) }
 *   roadDir: optional {x,z} direction of the nearest road (grid alignment).
 * @returns { variant, buildings, well, lanterns, footprint, pads, cx, cz, axis }
 *   or null when no variant can place the full set (caller decides to skip).
 */
export function layoutTown(opts) {
  const { rng, cx, cz, survey, roadDir = null } = opts;
  const maxRadius = opts.maxRadius || 22;
  // Plaza recentering scan: the requested center can sit on a road junction
  // or shoreline; slide the plaza to the most open position within 9 cells so
  // every variant builds a TIGHT settlement instead of fighting corridors.
  // Deterministic candidate ladder, no rng draws (pure geometry scoring).
  const candidates = [[0, 0]];
  for (const r of [3, 6, 9, 12]) {
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      candidates.push([Math.round(Math.cos(ang) * r * 10) / 10, Math.round(Math.sin(ang) * r * 10) / 10]);
    }
  }
  let plazaList = [];
  for (const [ox, oz] of candidates) {
    const px = cx + ox, pz = cz + oz;
    if (!survey.inBounds(px, pz) || survey.blocked(px, pz)) continue;
    let clear = 0, total = 0;
    let minH = Infinity, maxH = -Infinity;
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      for (const rr of [4, 8, 12]) {
        total++;
        const sx = px + Math.cos(ang) * rr, sz = pz + Math.sin(ang) * rr;
        if (!survey.blocked(sx, sz)) clear++;
        if (survey.heightAt) {
          const h = survey.heightAt(sx, sz);
          if (typeof h === 'number') { minH = Math.min(minH, h); maxH = Math.max(maxH, h); }
        }
      }
    }
    // flatness matters as much as openness: pads on a slope cliff at their
    // rim no matter how wide the blend is, so prefer level ground
    const open = clear / total;
    const flat = survey.heightAt ? 1 - Math.min(1, (maxH - minH) / 16) : 1;
    const score = open * flat;
    plazaList.push({ x: px, z: pz, score });
  }
  // try the best few plazas (open+flat scoring ties break by scan order —
  // stable sort keeps determinism)
  plazaList.sort((a, b) => b.score - a.score);
  const plazas = plazaList.slice(0, 3);
  if (!plazas.length) return null;
  const chosen = opts.variant || pickTownVariant(rng);
  const attempts = chosen === 'grid' ? ['grid', 'scattered', 'hamlet']
    : chosen === 'crescent' ? ['crescent', 'grid', 'scattered', 'hamlet']
      : ['scattered', 'grid', 'scattered', 'hamlet'];
  for (const plaza of plazas) {
    for (const variant of attempts) {
      const town = layoutVariant(variant, { rng, cx: plaza.x, cz: plaza.z, survey, roadDir, maxRadius });
      if (town) return town;
    }
  }
  return null;
}

// Place one spec at pos. yaw may be a number or a function of the final
// (jittered) position so scattered buildings always face the plaza. When
// jitter > 0 (scattered), retries with deterministic jitter from the rng
// stream; exact placements (grid/crescent) fail fast so the variant fallback
// chain takes over. corridor = {ax, az, cx, cz} (unit axis through the plaza):
// a placement whose SERVER collider box would cover the axis line is rejected,
// keeping every town's main street walkable straight through.
const serverBoxPerp = (w, d) => (w + d) * TOWN_RULES.ROAD_CENTER_BOX / 2 + 0.2;
function placeWithRetry(spec, pos, yaw, placed, survey, rng, tries = 24, jitter = 0, corridor = null) {
  for (let i = 0; i < tries; i++) {
    const jx = i === 0 || !jitter ? 0 : (rng() - 0.5) * jitter;
    const jz = i === 0 || !jitter ? 0 : (rng() - 0.5) * jitter;
    const at = { x: pos.x + jx, z: pos.z + jz };
    const b = {
      type: 'building', variant: spec.variant, label: spec.label,
      x: at.x, z: at.z,
      width: spec.width, depth: spec.depth,
      rotY: typeof yaw === 'function' ? yaw(at) : yaw,
    };
    if (corridor) {
      const off = Math.abs((b.x - corridor.cx) * corridor.az - (b.z - corridor.cz) * corridor.ax);
      if (off < serverBoxPerp(b.width, b.depth)) continue;
    }
    if (rectFits(b, survey) && spaced(b, placed)) return b;
    if (!jitter) return null;
  }
  return null;
}

// Cumulative left-to-right packing of a street row: centers derived from the
// fixed widths + MIN_YARD_GAP so same-row spacing holds by construction.
function rowCenters(specs) {
  const total = specs.reduce((s, sp) => s + sp.width, 0) + TOWN_RULES.MIN_YARD_GAP * (specs.length - 1);
  const centers = [];
  let cursor = -total / 2;
  for (const sp of specs) {
    centers.push(cursor + sp.width / 2);
    cursor += sp.width + TOWN_RULES.MIN_YARD_GAP;
  }
  return { centers, halfSpan: total / 2 };
}

// Grid attempt on ONE axis orientation: street rows + mirror ladder + dodge
// ladders. Returns { placed, buildings, axis } or null. No rng draws (exact
// placements), so the axis ladder stays deterministic.
function tryGridAxis(axis, { rng, cx, cz, survey, corridor }) {
  const perp = { x: -axis.z, z: axis.x };
  const at = (along, across) => ({
    x: cx + axis.x * along + perp.x * across,
    z: cz + axis.z * along + perp.z * across,
  });
  const face = (side) => Math.atan2(perp.x * -side, perp.z * -side);
  const streetSpecs = [
    { across: -TOWN_RULES.GRID_ROW_OFFSET, specs: [SERVICE_SPECS[0], SERVICE_SPECS[2], HOUSE_SPECS[0]] },
    { across: TOWN_RULES.GRID_ROW_OFFSET, specs: [SERVICE_SPECS[1], SERVICE_SPECS[3], HOUSE_SPECS[1]] },
    { across: -TOWN_RULES.GRID_SECOND_ROW, specs: [HOUSE_SPECS[2]], optional: true },
    { across: TOWN_RULES.GRID_SECOND_ROW, specs: [HOUSE_SPECS[3]], optional: true },
  ];
  for (const mirror of [1, -1]) {
    const trial = [];
    const trialPlaced = [];
    let ok = true;
    for (const street of streetSpecs) {
      const across = street.across * mirror;
      const side = Math.sign(across);
      const { centers } = rowCenters(street.specs);
      const acrossNudges = [0, 1.5, -1.5, 3, -3, 4.5, -4.5];
      for (let i = 0; i < street.specs.length; i++) {
        const alongNudges = [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12, 14, -14];
        let b = null;
        outer:
        for (const dn of alongNudges) {
          for (const dc of acrossNudges) {
            const cand = placeWithRetry(street.specs[i], at(centers[i] + dn, across + dc), face(side), trialPlaced, survey, rng, 1, 0, corridor);
            if (cand) { b = cand; break outer; }
          }
        }
        if (!b) {
          if (street.optional) continue;
          ok = false;
          break;
        }
        trialPlaced.push(b);
        trial.push(b);
      }
      if (!ok) break;
    }
    if (ok && trial.filter((b) => b.variant === 'house').length >= 2) {
      return { placed: trialPlaced, buildings: trial, axis };
    }
  }
  return null;
}

function layoutVariant(variant, { rng, cx, cz, survey, roadDir, maxRadius }) {
  const placed = [];
  const buildings = [];

  const commit = (spec, pos, yaw) => {
    const b = placeWithRetry(spec, pos, yaw, placed, survey, rng);
    if (!b) return false;
    placed.push(b);
    buildings.push(b);
    return true;
  };

  let axis = { x: 1, z: 0 };
  const axisLen0 = Math.hypot(roadDir?.x || 1, roadDir?.z || 0) || 1;
  const corridor = { ax: (roadDir?.x || 1) / axisLen0, az: (roadDir?.z || 0) / axisLen0, cx, cz };

  if (variant === 'grid') {
    const len = Math.hypot(roadDir?.x || 1, roadDir?.z || 0) || 1;
    axis = { x: (roadDir?.x || 1) / len, z: (roadDir?.z || 0) / len };
    // axis rotation ladder: radiating roads often make ONE axis orientation
    // unbuildable (rows land in a road wedge), so try the perpendicular axis
    // before giving up the variant — no rng draws, pure geometry
    const axisCandidates = [axis, { x: -axis.z, z: axis.x }];
    let placed = [], buildings = [], axisChosen = null;
    for (const axisCand of axisCandidates) {
      const res = tryGridAxis(axisCand, { rng, cx, cz, survey, corridor, placed: [], buildings: [] });
      if (res) { placed = res.placed; buildings = res.buildings; axis = res.axis; axisChosen = res.axis; break; }
    }
    if (!axisChosen) return null;
    return finish(variant, buildings, { cx, cz, survey, rng, axis });
  } else if (variant === 'crescent') {
    const base = roadDir ? Math.atan2(roadDir.x, roadDir.z) : 0;
    // Single horseshoe ring around the plaza: chord-based angular widths
    // (chord = width + yard gap + slack) keep >= MIN_YARD_GAP edge distance
    // between neighbors; the ring opens toward the road.
    const ringR = TOWN_RULES.CRESCENT_R;
    const ringOrder = [
      SERVICE_SPECS[0], HOUSE_SPECS[0], SERVICE_SPECS[1], HOUSE_SPECS[1],
      SERVICE_SPECS[2], HOUSE_SPECS[2], SERVICE_SPECS[3], HOUSE_SPECS[3],
    ];
    const chordAngle = (cells) => 2 * Math.asin(Math.min(1, cells / (2 * ringR)));
    // depth term: radially-facing rects on an arc project extra tangential
    // extent (d/2*sin ~ rotation mismatch); budgeting it here keeps SAT gaps
    // honest so the ring does not self-overlap
    const awOf = (sp) => chordAngle(sp.width + sp.depth / 2 + TOWN_RULES.MIN_YARD_GAP + TOWN_RULES.CRESCENT_GAP_PAD);
    const halfArc = ringOrder.reduce((s, sp) => s + awOf(sp), 0) / 2;
    // whole-ring rotation ladder: radiating roads cross ring slots, so try
    // swinging the entire arc before per-slot nudges
    for (const swing of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05]) {
      const ringBase = base + swing;
      const trial = [];
      const trialPlaced = [];
      let ringOk = true;
      let ang = ringBase - halfArc;
      for (const sp of ringOrder) {
        const aw = awOf(sp);
        ang += aw / 2;
        // corridor guard: slots sitting on the road axis (through traffic)
        // must dodge angularly — a back gate on the axis keeps the town
        // walkable straight through
        const corridorHit = (a2, r2) => {
          if (!roadDir) return false;
          const px2 = cx + Math.sin(a2) * r2, pz2 = cz + Math.cos(a2) * r2;
          const off = Math.abs((px2 - corridor.cx) * corridor.az - (pz2 - corridor.cz) * corridor.ax);
          return off < serverBoxPerp(sp.width, sp.depth);
        };
        const baseNudges = [[0, 0], [0, 1], [0, -1], [-1, 0], [-1, 1], [-1, -1], [1, 0], [1, 1], [1, -1],
          [0, 2], [0, -2], [-2, 0], [-2, 1], [-2, -1], [2, 0], [2, 1], [2, -1],
          [0, 3], [0, -3], [-3, 0], [-3, 2], [-3, -2], [3, 0], [3, 2], [3, -2], [0, 4], [0, -4]];
        const nudges = corridorHit(ang, ringR)
          ? [[-4, 0], [4, 0], [-5, 0], [5, 0], [-4, 1], [4, 1], [-4, -1], [4, -1], [-5, 2], [5, 2], ...baseNudges]
          : baseNudges;
        let b = null;
        for (const [dr, da] of nudges) {
          const a2 = ang + da * TOWN_RULES.CRESCENT_NUDGE_A;
          const r2 = ringR + dr * TOWN_RULES.CRESCENT_NUDGE_R;
          if (corridorHit(a2, r2)) continue;
          const pos = { x: cx + Math.sin(a2) * r2, z: cz + Math.cos(a2) * r2 };
          b = placeWithRetry(sp, pos, (p) => yawToward(p, { x: cx, z: cz }), trialPlaced, survey, rng, 1, 0, corridor);
          if (b) break;
        }
        if (!b && sp.variant === 'house') {
          ang += aw / 2; // house skipped — still advance the arc
          continue;
        }
        if (!b) {
          ringOk = false;
          break;
        }
        trialPlaced.push(b);
        trial.push(b);
        ang += aw / 2;
      }
      if (ringOk && trial.filter((b) => b.variant === 'house').length >= 2) {
        placed.push(...trial);
        buildings.push(...trial);
        return finish(variant, buildings, { cx, cz, survey, rng, axis });
      }
    }
    return null;
  } else {
    // scattered / hamlet: ring rejection sampling, yaw toward the plaza;
    // attempt budget grows with crowding so late buildings keep hunting.
    // Services are mandatory; houses are best-effort (>= 2) except in the
    // hamlet last resort, which ships services only.
    const hamlet = variant === 'hamlet';
    // largest footprint first: the inn/smithy need the most room, so they get
    // first pick of the pocket before smaller buildings fragment it
    const specs = (hamlet ? SERVICE_SPECS : [...SERVICE_SPECS, ...HOUSE_SPECS])
      .slice().sort((a, b) => (b.width * b.depth) - (a.width * a.depth));
    let housesPlaced = 0;
    for (const spec of specs) {
      const isHouse = spec.variant === 'house';
      let done = false;
      const budget = hamlet ? 220 : 60 + placed.length * 25;
      const minR = hamlet ? 2 : TOWN_RULES.SCATTER_MIN_R;
      const maxR = hamlet ? Math.min(maxRadius, 10) : Math.min(maxRadius, TOWN_RULES.SCATTER_MAX_R);
      for (let attempt = 0; attempt < budget && !done; attempt++) {
        const ang = rng() * Math.PI * 2;
        const r = minR + rng() * (maxR - minR);
        const pos = { x: cx + Math.cos(ang) * r, z: cz + Math.sin(ang) * r };
        const b = placeWithRetry(spec, pos, (p) => yawToward(p, { x: cx, z: cz }), placed, survey, rng, 12, 3.0, corridor);
        if (b) { placed.push(b); buildings.push(b); done = true; if (isHouse) housesPlaced++; }
      }
      if (!done && !isHouse) return null;
    }
    if (!hamlet && housesPlaced < 2) return null;
  }
  return finish(variant, buildings, { cx, cz, survey, rng, axis });
}

// Shared tail: plaza furniture (well + lanterns), footprint bounds, town record.
function finish(variant, buildings, { cx, cz, survey, rng, axis }) {
  const axisV = axis || { x: 1, z: 0 };
  const perp = { x: -axisV.z, z: axisV.x };
  // Well: first unblocked offset from the plaza center (roads converge on the
  // center, so the well prefers stepping aside). Wide ladder: five radii on
  // ten headings + center; if a road-ringed pocket leaves nothing, the well
  // settles at the plaza center anyway (historically accurate, and client
  // collision routes around it).
  const wellOffsets = [];
  for (const r of [2.2, 3.4, 4.6, 6.0, 8.0]) {
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2 + 0.31; // half-step off the road axes
      wellOffsets.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r });
    }
  }
  let well = null;
  for (const off of wellOffsets) {
    const w = { x: cx + off.x, z: cz + off.z };
    if (survey.inBounds(w.x, w.z) && !survey.blocked(w.x, w.z)) { well = w; break; }
  }
  if (!well) {
    // road-ringed pocket: settle at the plaza center (routes around it)
    if (survey.inBounds(cx, cz)) well = { x: cx, z: cz };
  }
  if (!well) return null;
  const lanterns = [];
  for (const side of [-1, 1]) {
    const l = { x: cx + axisV.x * side * 5.2 + perp.x * 2.2, z: cz + axisV.z * side * 5.2 + perp.z * 2.2 };
    if (survey.inBounds(l.x, l.z) && !survey.blocked(l.x, l.z)) lanterns.push(l);
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of buildings) {
    for (const p of buildingCorners(b, TOWN_RULES.PAD_MARGIN + TOWN_RULES.BLEND_CELLS)) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
  }
  return {
    variant, buildings, well, lanterns,
    footprint: { minX, maxX, minZ, maxZ },
    pads: [], // filled by flattenTownFootprint
    cx, cz, axis: axisV,
  };
}

/**
 * Survey whether a town site is buildable: every cell of the footprint
 * ellipse (plus margin) must be land, in-bounds, and clear of roads.
 * @param p { cx, cz, rx, rz, margin?, survey, heightAt?, maxGradeFt? }
 */
export function siteSupportsTown(p) {
  const margin = p.margin ?? 2;
  const { cx, cz, rx, rz, survey } = p;
  for (let z = Math.floor(cz - rz - margin); z <= Math.ceil(cz + rz + margin); z++) {
    for (let x = Math.floor(cx - rx - margin); x <= Math.ceil(cx + rx + margin); x++) {
      const dx = (x + 0.5 - cx) / (rx + margin), dz = (z + 0.5 - cz) / (rz + margin);
      if (dx * dx + dz * dz > 1) continue;
      if (!survey.inBounds(x, z) || survey.blocked(x, z)) return { ok: false, reason: `blocked cell ${x},${z}` };
    }
  }
  if (p.heightAt) {
    let minH = Infinity, maxH = -Infinity;
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const h = p.heightAt(cx + Math.cos(ang) * rx, cz + Math.sin(ang) * rz);
      minH = Math.min(minH, h); maxH = Math.max(maxH, h);
    }
    if (maxH - minH > (p.maxGradeFt ?? 26)) return { ok: false, reason: 'site grade too steep' };
  }
  return { ok: true, reason: '' };
}

const round025 = (h) => Math.round(h * 4) / 4;

/**
 * Flatten terrain under every building footprint so buildings never float:
 * each building gets a flat pad (mean of its corner heights, quantized to the
 * field's 0.25 ft grid), blended back to the surrounding terrain over
 * BLEND_CELLS, then a local relax pass enforces the per-vertex step cap
 * inside the blended ring. Mutates heights in place; returns pad records.
 * Pads never touch the region border (callers keep sites >= 20 cells in).
 */
export function flattenTownFootprint(heights, vertexW, town, opts = {}) {
  const vh = opts.vertexH || Math.round(heights.length / vertexW);
  const cap = opts.relaxCap ?? TOWN_RULES.RELAX_CAP;
  const at = (x, z) => z * vertexW + x;
  const round025b = (h) => Math.round(h * 4) / 4;

  // Per-building pad level = mean of its true oriented-corner heights,
  // quantized to the field's 0.25 ft grid. Corner heights are read from the
  // current field so pads sit near the natural grade (no big cut/fill).
  const pads = town.buildings.map((b) => {
    const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([ux, uz]) => {
      const wx = b.x + (b.width / 2) * ux * c + (b.depth / 2) * uz * s;
      const wz = b.z - (b.width / 2) * ux * s + (b.depth / 2) * uz * c;
      return heights[at(Math.max(0, Math.min(vertexW - 1, Math.round(wx))), Math.max(0, Math.min(vh - 1, Math.round(wz))))];
    });
    return { x: b.x, z: b.z, pad: round025b(corners.reduce((sum, h) => sum + h, 0) / 4) };
  });

  // Merge adjacent pads to a shared level: touching pads at different
  // elevations would need a retaining wall (violating the world's step cap).
  // Union-find over center distance vs building sizes.
  const parent = pads.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };
  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const a = town.buildings[i], b = town.buildings[j];
      const gap = Math.hypot(pads[i].x - pads[j].x, pads[i].z - pads[j].z) -
        (a.width + b.width + a.depth + b.depth) / 4;
      // merge whenever blend shells can touch: separate levels at a shared
      // shell seam create the very cliffs the relax cannot smooth
      if (gap < TOWN_RULES.MIN_YARD_GAP + 2 * TOWN_RULES.BLEND_CELLS) union(i, j);
    }
  }
  const groups = new Map();
  for (let i = 0; i < pads.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }
  for (const members of groups.values()) {
    const level = round025b(members.reduce((s, i) => s + pads[i].pad, 0) / members.length);
    for (const i of members) pads[i].pad = level;
  }
  town.pads = pads;

  // Zone helpers: tier-1 sacred zone (oriented rect +0.55) and the oriented
  // blend shell (rect +0.55 .. +BLEND_CELLS, smoothstep falloff).
  const zones = town.buildings.map((b) => {
    const c = Math.cos(b.rotY || 0), s = Math.sin(b.rotY || 0);
    return { cx: b.x, cz: b.z, c, s, hx: b.width / 2 + 0.55, hz: b.depth / 2 + 0.55 };
  });
  const localOf = (z0, x0, p) => {
    const wx = x0 - p.cx, wz = z0 - p.cz;
    return { lx: wx * p.c - wz * p.s, lz: wx * p.s + wz * p.c };
  };

  // Tier-1: exact flat pad over each sacred zone (zones are pairwise disjoint
  // because building rects keep >= MIN_YARD_GAP > 2 * 0.55).
  for (let i = 0; i < zones.length; i++) {
    const p = zones[i];
    const ex = p.hx * Math.abs(p.c) + p.hz * Math.abs(p.s);
    const ez = p.hx * Math.abs(p.s) + p.hz * Math.abs(p.c);
    for (let z = Math.max(0, Math.floor(p.cz - ez)); z <= Math.min(vh - 1, Math.ceil(p.cz + ez)); z++) {
      for (let x = Math.max(0, Math.floor(p.cx - ex)); x <= Math.min(vertexW - 1, Math.ceil(p.cx + ex)); x++) {
        const { lx, lz } = localOf(z, x, p);
        if (Math.abs(lx) <= p.hx && Math.abs(lz) <= p.hz) heights[at(x, z)] = pads[i].pad;
      }
    }
  }

  // Oriented blend shell around each zone, Voronoi-deferred so overlapping
  // shells never double-blend a vertex.
  for (let i = 0; i < zones.length; i++) {
    const p = zones[i];
    const outer = TOWN_RULES.BLEND_CELLS;
    const ex = (p.hx + outer) * Math.abs(p.c) + (p.hz + outer) * Math.abs(p.s);
    const ez = (p.hx + outer) * Math.abs(p.s) + (p.hz + outer) * Math.abs(p.c);
    for (let z = Math.max(0, Math.floor(p.cz - ez)); z <= Math.min(vh - 1, Math.ceil(p.cz + ez)); z++) {
      for (let x = Math.max(0, Math.floor(p.cx - ex)); x <= Math.min(vertexW - 1, Math.ceil(p.cx + ex)); x++) {
        const { lx, lz } = localOf(z, x, p);
        const d = Math.max(Math.abs(lx) - p.hx, Math.abs(lz) - p.hz, 0);
        if (d === 0 || d > outer) continue; // inside zone handled by tier-1
        let mine = true;
        for (let j = 0; j < zones.length && mine; j++) {
          if (j === i) continue;
          const o = zones[j];
          if (Math.hypot(x - o.cx, z - o.cz) < Math.hypot(x - p.cx, z - p.cz)) mine = false;
        }
        if (!mine) continue;
        const tt = d >= outer ? 1 : (d / outer) * (d / outer) * (3 - 2 * (d / outer));
        const idx = at(x, z);
        heights[idx] = round025b(pads[i].pad + (heights[idx] - pads[i].pad) * tt);
      }
    }
  }

  // Local relax over a generous window (pad pulls fully decay before the
  // window edge so the boundary pair respects the global step cap). Tier-1
  // zone vertices are PINNED: step corrections move only ring vertices, so
  // buildings stay exactly flat while the shell absorbs the drop.
  const padInfluence = TOWN_RULES.BLEND_CELLS + 10;
  const minX = Math.max(1, Math.floor(town.footprint.minX) - padInfluence);
  const maxX = Math.min(vertexW - 2, Math.ceil(town.footprint.maxX) + padInfluence);
  const minZ = Math.max(1, Math.floor(town.footprint.minZ) - padInfluence);
  const maxZ = Math.min(vh - 2, Math.ceil(town.footprint.maxZ) + padInfluence);
  const pinned = (x, z) => zones.some((p) => {
    const { lx, lz } = localOf(z, x, p);
    return Math.abs(lx) <= p.hx && Math.abs(lz) <= p.hz;
  });
  for (let iter = 0; iter < 10; iter++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = at(x, z);
        const pairs = [];
        if (x > minX) pairs.push(idx - 1);
        if (z > minZ) pairs.push(idx - vertexW);
        for (const other of pairs) {
          const ox = other % vertexW, oz = Math.floor(other / vertexW);
          const idxPinned = pinned(x, z), otherPinned = pinned(ox, oz);
          if (idxPinned && otherPinned) continue;
          const diff = heights[idx] - heights[other];
          if (diff > cap) {
            if (!idxPinned) heights[idx] = heights[other] + cap;
            else heights[other] = heights[idx] - cap;
          } else if (diff < -cap) {
            if (!otherPinned) heights[other] = heights[idx] + cap;
            else heights[idx] = heights[other] - cap;
          }
        }
      }
    }
  }

  // Re-assert tier-1 (relax pins already match, this is a cheap safety net).
  for (let i = 0; i < zones.length; i++) {
    const p = zones[i];
    const ex = p.hx * Math.abs(p.c) + p.hz * Math.abs(p.s);
    const ez = p.hx * Math.abs(p.s) + p.hz * Math.abs(p.c);
    for (let z = Math.max(0, Math.floor(p.cz - ez)); z <= Math.min(vh - 1, Math.ceil(p.cz + ez)); z++) {
      for (let x = Math.max(0, Math.floor(p.cx - ex)); x <= Math.min(vertexW - 1, Math.ceil(p.cx + ex)); x++) {
        const { lx, lz } = localOf(z, x, p);
        if (Math.abs(lx) <= p.hx && Math.abs(lz) <= p.hz) heights[at(x, z)] = pads[i].pad;
      }
    }
  }
  return pads;
}

// Yaw-alignment rule check (used by validators/tests).
export function yawAligned(b, town) {
  if (town.variant === 'grid') {
    const axis = town.axis || { x: 1, z: 0 };
    const target = Math.atan2(-axis.z, axis.x); // matches face(side) rows
    const rot = b.rotY || 0;
    return [0, Math.PI].some((flip) => {
      const t = target + flip;
      const d = Math.abs(Math.atan2(Math.sin(rot - t), Math.cos(rot - t)));
      return d <= TOWN_RULES.AXIS_TOL;
    });
  }
  const want = yawToward({ x: b.x, z: b.z }, { x: town.cx, z: town.cz });
  const d = Math.abs(Math.atan2(Math.sin((b.rotY || 0) - want), Math.cos((b.rotY || 0) - want)));
  return d <= TOWN_RULES.YAW_TOL;
}
