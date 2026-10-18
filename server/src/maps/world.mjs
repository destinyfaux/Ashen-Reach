// ASHENREACH — world.mjs (P3.3 streamed world layer, PCG v2).
// The overworld is an infinite grid of 112x96-cell regions keyed by (rx, rz).
// Region (0,0) is the home region: generateOverworld() output, unchanged, so
// every worldGenerator invariant/test keeps holding. Neighboring regions are
// generated from pure, world-space fields:
//
//   macro biome fields  — continuous low-frequency mountain/blight/snow/
//                         forest weights sampled per world vertex and per
//                         world cell. Region biomes are classifications of
//                         the same fields, so biome patches follow organic
//                         massifs across region seams and biome-adjacency
//                         rules (forests skirt mountains, blight grows out
//                         of forests, meadow halo around home) emerge from
//                         the field instead of per-region dice.
//   terrain             — the shared home base formula plus biome-driven
//                         relief (rolling hills, ridged mountain crests,
//                         plateau terracing, deadland flats and spires),
//                         finished by a deterministic Jacobi slope clamp
//                         (<= 4.2 ft per vertex step) computed on a padded
//                         window so the result is window-invariant: two
//                         regions always evaluate the identical value at a
//                         shared border vertex, keeping seams continuous by
//                         construction. Near home the field blends back to
//                         the home base formula so region (0,0) stitches
//                         exactly.
//   rivers and lakes    — world-space features. Home's river is lifted from
//                         the home def and extended far south into a
//                         deterministic terminus lake; other rivers
//                         steepest-descend the world field from highland
//                         sources until they reach a large lake basin
//                         (or spawn one where they end). Large lakes are
//                         world bodies that cross seams; small ponds are
//                         biome-locked and region-local.
//   roads               — home road extensions to neighbor POIs chained in
//                         a ring, routed around rivers and large lakes.
//
// All randomness is hash-seeded — generating region (rx, rz) never depends
// on which other regions were generated first.

import { layoutTown, flattenTownFootprint, siteSupportsTown } from './townLayout.mjs';
import {
  buildGrandLakes, grandLakeDistance, grandLakeDepthTier,
  grandLakeShoreType, isGrandLakeIsland,
} from './worldGrandLakes.mjs';

const CELL_FT = 5;
export const REGION_W = 112;
export const REGION_H = 96;
export const WORLD_SEED = 73021;

const CLUSTER_VARIANTS_FALLBACK = ['rock', 'twig'];
// Same order as worldGenerator.BIOMES for first 9; new biomes appended cleanly.
const BIOME_ORDER = [
  'meadow', 'forest', 'snow_forest', 'snowfield', 'deadlands',
  'mountains', 'town', 'graveyard', 'ruins',
  'swamp', 'volcanic', 'coastal',
];
const BIOME_INDEX = Object.fromEntries(BIOME_ORDER.map((b, i) => [b, i]));

// ── deterministic noise (identical formulas to worldGenerator.mjs) ─────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, z, salt) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) +
    Math.imul(salt | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function noise(x, z, scale, seed) {
  const gx = x / scale, gz = z / scale;
  const ix = Math.floor(gx), iz = Math.floor(gz);
  const tx = smooth(gx - ix), tz = smooth(gz - iz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

// Fractal sum of the value noise above; returns ~[0,1].
function fbm(x, z, scale, seed, octaves) {
  let value = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    value += noise(x, z, scale / freq, seed + o * 131) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / norm;
}

// Ridged fBm for mountain crests: sharp highs along noise zero-crossings.
function ridged(x, z, scale, seed, octaves) {
  let value = 0, amp = 0.55, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = noise(x, z, scale / freq, seed + o * 173);
    value += (1 - Math.abs(2 * n - 1)) * amp;
    norm += amp;
    amp *= 0.45;
    freq *= 2.1;
  }
  return value / norm;
}

function smoothstep(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

const lerp = (a, b, t) => a + (b - a) * t;

// ── region identity ────────────────────────────────────────────────────────
const enc = (n) => (n < 0 ? 'm' + Math.abs(n) : String(n));
const dec = (s) => (s[0] === 'm' ? -Number(s.slice(1)) : Number(s));

/** Home region keeps its historical map id; neighbors use w<rx>_<rz> with
 *  'm' marking negative parts (ids must match /^\/api\/map\/([a-z0-9_]+)$/). */
export function regionId(rx, rz) {
  if (rx === 0 && rz === 0) return 'ashen_reach';
  return `w${enc(rx)}_${enc(rz)}`;
}

export function parseRegionId(id) {
  if (id === 'ashen_reach') return { rx: 0, rz: 0 };
  const m = /^w(m?\d+)_(m?\d+)$/.exec(String(id || ''));
  if (!m) return null;
  return { rx: dec(m[1]), rz: dec(m[2]) };
}

export const regionKey = (rx, rz) => `${rx},${rz}`;
export function regionOriginFt(rx, rz) {
  return { x: rx * REGION_W * CELL_FT, z: rz * REGION_H * CELL_FT };
}

// ── home base elevation (pure, seam-continuous) ────────────────────────────
// These peaks/broad/local constants mirror worldGenerator.makeWorld exactly;
// region (0,0) additionally applies its valley/town/water carving on top, so
// the shared border rows evaluate to the same values on both sides.
const HOME_PEAKS = [
  { x: 59, z: 18, radius: 34, height: 82 },
  { x: 91, z: 34, radius: 29, height: 66 },
  { x: 101, z: 24, radius: 24, height: 52 },
];

function baseElevation(gx, gz, seed) {
  const mountain = HOME_PEAKS.reduce((peak, range) => {
    const distance = Math.hypot((gx - range.x) * 0.88, gz - range.z);
    return Math.max(peak, Math.pow(Math.max(0, 1 - distance / range.radius), 1.7) * range.height);
  }, 0);
  const broad = (noise(gx, gz, 32, seed) - 0.5) * 12;
  const local = (noise(gx, gz, 9, seed + 101) - 0.5) * 3;
  return Math.max(0, 5 + broad + local + mountain);
}

// ── macro biome fields ─────────────────────────────────────────────────────
// Chebyshev distance from the home-region center, in region units.
function homeDistance(gx, gz) {
  return Math.max(Math.abs(gx - REGION_W / 2) / REGION_W,
    Math.abs(gz - REGION_H / 2) / REGION_H);
}

// 1 inside the home halo (meadow heartland: full through ring ~2, fading to
// 0 by ring ~4.6) so the world opens as meadow before biomes take over.
function homeHalo(gx, gz) {
  return 1 - smoothstep(2.05, 4.6, homeDistance(gx, gz));
}

// 1 within the home rectangle plus a 10-cell margin, fading to 0 across the
// next 40 cells. Neighbor terrain blends back to the home base formula
// inside this band so the home seam evaluates identically on both sides.
function seamMask(gx, gz) {
  const ox = Math.max(gx - (REGION_W + 10), -10 - gx, 0);
  const oz = Math.max(gz - (REGION_H + 10), -10 - gz, 0);
  return 1 - smoothstep(0, 40, Math.hypot(ox, oz));
}

// Continuous 0..1 weights sampled per world vertex (or cell center).
function mountainWeight(gx, gz, seed) {
  // ~35-cell transition (smoothstep 0.47..0.55) keeping mountain-branch gradients below 2*SLOPE_CAP
  const massif = smoothstep(0.47, 0.55, fbm(gx, gz, 640, seed + 301, 3));
  return massif * (1 - homeHalo(gx, gz));
}

function forestWeight(gx, gz, seed) {
  return smoothstep(0.45, 0.56, fbm(gx, gz, 470, seed + 509, 3));
}

function blightWeight(gx, gz, seed) {
  const raw = smoothstep(0.58, 0.70, fbm(gx, gz, 780, seed + 407, 3));
  // blight creeps out of the forest band more readily than meadow or rock
  const creep = forestWeight(gx, gz, seed) * 0.15;
  return Math.min(1, raw + creep * (1 - raw)) * (1 - homeHalo(gx, gz));
}

function snowWeight(gx, gz, seed) {
  const field = fbm(gx, gz, 1080, seed + 613, 2) + Math.max(0, (-gz - 700) / 4200);
  return smoothstep(0.52, 0.64, field) * (1 - homeHalo(gx, gz));
}

function swampWeight(gx, gz, seed) {
  const elev = baseElevation(gx, gz, seed);
  const flat = 1 - smoothstep(4, 18, elev);
  const wet = smoothstep(0.50, 0.70, fbm(gx, gz, 750, seed + 8001, 3));
  const moist = forestWeight(gx, gz, seed);
  return flat * wet * (0.35 + 0.65 * moist) * (1 - homeHalo(gx, gz));
}

function volcanicWeight(gx, gz, seed) {
  const hotspot = smoothstep(0.58, 0.76, fbm(gx, gz, 850, seed + 9001, 2));
  const mountain = mountainWeight(gx, gz, seed);
  const blight = blightWeight(gx, gz, seed);
  const hot = Math.max(hotspot * (0.35 + 0.65 * mountain), blight * hotspot * 1.2);
  return hot * (1 - homeHalo(gx, gz));
}

function coastalWeight(gx, gz, grandLakes) {
  if (!grandLakes || !grandLakes.length) return 0;
  for (const lake of grandLakes) {
    const d = grandLakeDistance(lake, gx, gz);
    if (d >= 0.88 && d <= 1.18) {
      return 1.0 - Math.abs(d - 1.03) / 0.15;
    }
  }
  return 0;
}

// Discrete biome for a world point (cell centers / region centers).
// Priority: volcanic > mountains > deadlands > swamp > coastal > snow > forest > meadow
export function classifyBiome(gx, gz, seed, grandLakes = []) {
  const halo = homeHalo(gx, gz);
  const wM = mountainWeight(gx, gz, seed);
  const wB = blightWeight(gx, gz, seed);
  const wS = snowWeight(gx, gz, seed);
  const moist = forestWeight(gx, gz, seed);
  const wV = volcanicWeight(gx, gz, seed);
  const wSwamp = swampWeight(gx, gz, seed);
  const wCoast = coastalWeight(gx, gz, grandLakes);

  if (halo > 0.86 && wM < 0.02 && wB < 0.02) {
    return 'meadow';
  }
  if (wV > 0.52) return 'volcanic';
  if (wM > 0.58) return 'mountains';
  if (wB > 0.52) return 'deadlands';
  if (wSwamp > 0.48) return 'swamp';
  if (wCoast > 0.40) return 'coastal';
  if (wM > 0.34 && wB < 0.4) return 'forest';
  if (wS > 0.55) return moist > 0.5 ? 'snow_forest' : 'snowfield';
  // Snow skirt
  if (wS > 0.45) return 'forest';
  if (moist > 0.5 + halo * 0.12) return 'forest';
  return 'meadow';
}

// ── world terrain elevation (pure, seam-continuous) ────────────────────────
// Biome-driven relief on top of the shared home base formula. Every kernel
// below is a smooth world-space field; the Jacobi slope clamp in the region
// builder is what enforces the <= 5.0 ft vertex-step budget for the union.
function worldElevation(gx, gz, seed) {
  const seam = seamMask(gx, gz);
  if (seam > 0.999) return baseElevation(gx, gz, seed);
  const halo = homeHalo(gx, gz);
  const wM = mountainWeight(gx, gz, seed);
  const wB = blightWeight(gx, gz, seed);
  const moist = forestWeight(gx, gz, seed);

  const broad = (noise(gx, gz, 32, seed) - 0.5) * 12;   // shared with home
  const local = (noise(gx, gz, 9, seed + 101) - 0.5) * 3; // shared with home
  let e = 5 + broad + local;

  // Large-scale terrain class (scale 400 cells = 2000 ft) for varied lowland relief
  const hilliness = smoothstep(0.38, 0.62, fbm(gx, gz, 400, seed + 501, 2));

  // Three lowland relief layers: broad, mid, local (plains, gentle meadows, rolling forest, rugged foothills)
  const hillsBroad = (fbm(gx, gz, 120, seed + 71, 3) - 0.5) * 30 * hilliness;
  const hillsMid   = (fbm(gx, gz,  45, seed + 73, 3) - 0.5) * 14 * (0.3 + 0.7 * hilliness);
  const hillsLocal = (fbm(gx, gz,  16, seed + 79, 2) - 0.5) * 5;
  const lowlandRelief = hillsBroad + hillsMid + hillsLocal;
  e += lowlandRelief * (0.4 + 0.6 * moist) * (1 - wM) * (1 - wB * 0.8) * (1 - halo * 0.45);

  // ESCARPMENTS — long linear cliffs via strongly anisotropic ridged field (scale 250 in x, 40 in z)
  const escarpmentField = ridged(gx, gz * 6.25, 250, seed + 1101, 3);
  const escarpMask = smoothstep(0.60, 0.85, escarpmentField) * hilliness * (1 - wM) * 0.5 * (1 - halo * 0.5);
  if (escarpMask > 0.01) {
    e += escarpMask * 20;
  }

  // MESAS — isolated elevated flats
  const mesaNoise = fbm(gx, gz, 200, seed + 1201, 2);
  const mesaCore = smoothstep(0.50, 0.65, mesaNoise) * smoothstep(0.80, 0.65, mesaNoise);
  const mesaMask = mesaCore * hilliness * (1 - wM) * 0.5 * (1 - halo * 0.5);
  if (mesaMask > 0.01) {
    e += mesaMask * 25;
  }

  // mountain massifs: domain-warped multi-scale ridges, elevated shoulder base, plateaus
  if (wM > 0.001) {
    // 1. Domain warp — breaks the axis-aligned look of raw ridged noise
    const warpX = (fbm(gx, gz, 180, seed + 201, 2) - 0.5) * 40;
    const warpZ = (fbm(gx, gz, 180, seed + 211, 2) - 0.5) * 40;
    const wx = gx + warpX, wz = gz + warpZ;

    // 2. Multi-scale ridges: major 400 ft scale + minor detail
    const crestMajor = ridged(wx, wz, 80, seed + 809, 4);
    const crestMinor = ridged(wx, wz, 30, seed + 819, 2);

    // 3. Amplitude: crest^1.3 elevates average mountain body, grand shoulder
    const shoulder = 66 + 40 * wM;
    const relief   = Math.pow(crestMajor, 1.3) * 140
                   + crestMinor * 35 * (1 - crestMajor * 0.5);

    // 4. Mountains sit on a broad raised base
    let mh = Math.max(e, 40) + shoulder + relief;

    // 5. Plateaus — terracing with a controlled ramp
    const plateauMask = smoothstep(0.62, 0.82, fbm(gx, gz, 200, seed + 907, 2))
                      * smoothstep(0.55, 0.80, wM);
    if (plateauMask > 0.001) {
      const PLATEAU_H = 40;
      const terraced = Math.floor(mh / PLATEAU_H) * PLATEAU_H
                     + smoothstep(0.3, 0.7, (mh % PLATEAU_H) / PLATEAU_H) * PLATEAU_H;
      mh = lerp(mh, terraced, plateauMask * 0.85);
    }

    // 6. Clean entry into massif
    e = lerp(e, mh, wM);
  }

  // deadlands: blighted flats with occasional jagged spires
  if (wB > 0.001) {
    const flat = lerp(e, 4 + broad * 0.4 + local, wB * 0.85);
    const spike = Math.pow(Math.max(0, fbm(gx, gz, 24, seed + 1009, 2) - 0.6) / 0.4, 1.5) * 24;
    e = flat + spike * wB * (1 - wM);
  }

  // volcanic: dark basalt ridges and vents
  const wV = volcanicWeight(gx, gz, seed);
  if (wV > 0.001) {
    const basalt = Math.pow(Math.max(0, fbm(gx, gz, 34, seed + 9101, 2) - 0.52) / 0.48, 1.3) * 16;
    e += basalt * wV * (1 - wM);
  }

  // swamp: low marshy settling
  const wSwamp = swampWeight(gx, gz, seed);
  if (wSwamp > 0.001) {
    e = lerp(e, 3.5 + (noise(gx, gz, 24, seed + 8051) - 0.5) * 2.0, wSwamp * 0.65 * (1 - wM));
  }

  e = Math.max(0, e);
  return lerp(e, baseElevation(gx, gz, seed), seam);
}

// Deterministic Jacobi slope clamp: enforces |h(v) - h(n)| <= cap against
// all four neighbors using only the previous iteration's values, so a
// vertex's value after K iterations depends solely on raw values within
// L1 distance K. With pad >= K every region evaluates the identical clamped
// value at shared border vertices — window-invariant seam continuity.
function slopeClampField(h, w, hgt, iterations, cap) {
  const next = new Float64Array(h.length);
  for (let it = 0; it < iterations; it++) {
    for (let z = 0; z < hgt; z++) {
      for (let x = 0; x < w; x++) {
        const at = z * w + x;
        const v = h[at];
        let maxN = -Infinity, minN = Infinity;
        if (x > 0) { const n = h[at - 1]; if (n > maxN) maxN = n; if (n < minN) minN = n; }
        if (x < w - 1) { const n = h[at + 1]; if (n > maxN) maxN = n; if (n < minN) minN = n; }
        if (z > 0) { const n = h[at - w]; if (n > maxN) maxN = n; if (n < minN) minN = n; }
        if (z < hgt - 1) { const n = h[at + w]; if (n > maxN) maxN = n; if (n < minN) minN = n; }
        const lo = maxN - cap, hi = minN + cap;
        if (lo <= hi) next[at] = Math.max(lo, Math.min(hi, v));
        else next[at] = (maxN + minN) / 2;
      }
    }
    h.set(next);
  }
  return h;
}

// ── world water: rivers and lakes ──────────────────────────────────────────
function samplesFromWaypoints(waypoints) {
  const samples = [];
  for (let segment = 0; segment < waypoints.length - 1; segment++) {
    const a = waypoints[segment], b = waypoints[segment + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 3);
    for (let i = (segment === 0 ? 0 : 1); i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t + Math.sin(t * Math.PI) * 0.8;
      const z = a.z + (b.z - a.z) * t;
      const level = Math.round((a.level + (b.level - a.level) * t) * 4) / 4;
      samples.push({ x, z, level });
    }
  }
  return samples;
}

const inHomeRect = (x, z, margin = 8) =>
  x >= -margin && z >= -margin && x <= REGION_W + margin && z <= REGION_H + margin;

// Distance in cells from the expanded home rectangle (negative means inside).
function homeRectClearance(x, z) {
  const dx = Math.max(-26 - x, x - (REGION_W + 26), 0);
  const dz = Math.max(-26 - z, z - (REGION_H + 26), 0);
  return Math.hypot(dx, dz);
}

function lakeTouches(body, x, z, stretch = 1.0) {
  if (body.grand) {
    if (isGrandLakeIsland(body, x, z)) return false;
    return grandLakeDistance(body, x, z) < stretch;
  }
  const dx = (x - body.x) / (body.rx * stretch);
  const dz = (z - body.z) / (body.rz * stretch);
  return dx * dx + dz * dz < 1;
}

/** World rivers + world lakes. Home's river is lifted from the home def and
 *  extended far south into a terminus lake; six further rivers descend from
 *  highland sources until they reach a large lake (spawning a terminal lake
 *  when they end on open lowland). All bodies are world-space and pure. */
function buildWorldWater(homeDef, seed, elevationAt, mountainAt) {
  const lakes = [];
  const rivers = [];

  // ── home river: waypoints + long southward extension + terminus lake ──
  const homeWaypoints = (homeDef?.metadata?.water?.river || []).map((p) => ({ ...p }));
  if (homeWaypoints.length >= 2) {
    const last = homeWaypoints[homeWaypoints.length - 1];
    const prev = homeWaypoints[homeWaypoints.length - 2];
    const dir = { x: last.x - prev.x, z: last.z - prev.z };
    const len = Math.hypot(dir.x, dir.z) || 1;
    dir.x /= len; dir.z /= len;
    let level = last.level;
    let px = last.x, pz = last.z;
    const extension = [];
    for (let step = 0; step < 52; step++) {
      const wobble = (hash2(step * 3 + 7, 91, seed) - 0.5) * 3.4;
      px += dir.x * 3.4 - dir.z * wobble * 0.35;
      pz += dir.z * 3.4 + dir.x * wobble * 0.35;
      level = Math.max(2.2, level - 0.22);
      extension.push({ x: Math.round(px * 2) / 2, z: Math.round(pz * 2) / 2, level: Math.round(level * 4) / 4 });
    }
    const end = extension[extension.length - 1];
    rivers.push({ id: 'home-river', samples: samplesFromWaypoints([...homeWaypoints, ...extension]) });
    // terminus lake just past the river mouth, still heading downstream
    const lakeLevel = Math.max(2.2, end.level - 0.4);
    lakes.push({
      id: 'home-terminus',
      x: Math.round(end.x + dir.x * 10), z: Math.round(end.z + dir.z * 10),
      rx: 14 + hash2(3, 7, seed) * 3, rz: 10.5 + hash2(5, 11, seed) * 2.5,
      level: Math.round(lakeLevel * 4) / 4, kind: 'lake', big: true,
    });
  }

  // ── large lakes: deterministic lowland basin search ──────────────────────
  const candidates = [];
  for (let rz = -6; rz <= 6; rz++) {
    for (let rx = -6; rx <= 6; rx++) {
      if (Math.max(Math.abs(rx), Math.abs(rz)) <= 1) continue; // home ring stays open
      const pick = hash2(rx * 13 + 4, rz * 7 + 1, seed ^ 0x1a7e);
      if (pick > 0.42) continue;
      const cx = Math.round(rx * REGION_W + REGION_W * (0.2 + hash2(rx * 3, rz * 5, seed + 21) * 0.6));
      const cz = Math.round(rz * REGION_H + REGION_H * (0.2 + hash2(rx * 9, rz * 2, seed + 23) * 0.6));
      if (homeRectClearance(cx, cz) < 42) continue;
      if (mountainAt(cx, cz) > 0.3) continue;
      const centerE = elevationAt(cx, cz);
      if (centerE > 24) continue;
      candidates.push({ rx, rz, cx, cz, pick, centerE });
    }
  }
  candidates.sort((a, b) => a.pick - b.pick);
  for (const c of candidates) {
    if (lakes.length >= 8) break;
    const rx = 13 + hash2(c.cx, c.cz, seed + 31) * 9;
    const rz = 9.5 + hash2(c.cz, c.cx, seed + 33) * 6.5;
    // rim survey: the water surface must sit below the surrounding terrain so
    // the lake reads as a basin instead of a puddle on a slope
    let rimMin = Infinity;
    for (let a = 0; a < 14; a++) {
      const ang = (a / 14) * Math.PI * 2;
      rimMin = Math.min(rimMin, elevationAt(c.cx + Math.cos(ang) * rx * 1.45, c.cz + Math.sin(ang) * rz * 1.45));
    }
    if (rimMin < 4.2) continue;
    const level = Math.round(Math.max(2.4, Math.min(c.centerE - 1.0, rimMin - 1.8)) * 4) / 4;
    let tooClose = false;
    for (const other of lakes) {
      if (Math.hypot(other.x - c.cx, other.z - c.cz) < (other.rx + rx) * 2.1) tooClose = true;
    }
    if (tooClose) continue;
    lakes.push({
      id: 'world-lake-' + c.rx + '_' + c.rz,
      x: c.cx, z: c.cz, rx, rz, level, kind: 'lake', big: true,
    });
  }

  // ── grand lakes: multi-region freshwater seas ───────────────────────────
  const grandLakes = buildGrandLakes({
    seed,
    elevationAt,
    mountainAt,
    volcanicAt: (x, z) => volcanicWeight(x, z, seed),
    swampAt: (x, z) => swampWeight(x, z, seed),
    forestAt: (x, z) => forestWeight(x, z, seed),
  });
  lakes.push(...grandLakes);

  // ── world rivers: valley-seeking descent from highland sources into lakes ─
  // Routing is a hill-descending walk biased toward the source→lake chord:
  // each step samples candidate headings and prefers lower ground, so courses
  // follow valleys and skirt mountain massifs instead of gouging straight
  // canyons through them. Hard separation rules keep sources and courses
  // apart (no more parallel twin rivers a few cells apart), and a connector
  // tail guarantees every river terminates inside its target lake.
  const RIVER_COUNT = 7;
  const MIN_RIVER_SEP = 26;     // min cells between distinct river centerlines
  const MIN_SOURCE_SEP = 130;   // min cells between river sources
  const sources = [];
  // coarse spatial buckets over every accepted river sample (home included)
  // so the separation query stays cheap during routing
  const sepGrid = new Map();
  const sepKey = (x, z) => Math.floor(x / 24) + ',' + Math.floor(z / 24);
  const sepAdd = (samples) => {
    for (const s of samples) {
      const k = sepKey(s.x, s.z);
      let list = sepGrid.get(k);
      if (!list) { list = []; sepGrid.set(k, list); }
      list.push(s);
    }
  };
  const sepNear = (x, z) => {
    const bx = Math.floor(x / 24), bz = Math.floor(z / 24);
    let best = Infinity;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const list = sepGrid.get((bx + dx) + ',' + (bz + dz));
      if (!list) continue;
      for (const s of list) {
        const d = Math.hypot(x - s.x, z - s.z);
        if (d < best) best = d;
      }
    }
    return best;
  };
  for (const river of rivers) sepAdd(river.samples);   // home river counts too
  // (per-sample half-widths are assigned just before return, once every
  // sample — home extension, world courses and connector tails — is final)
  const descended = [];
  for (let pass = 0; pass < 3 && descended.length < 5; pass++) {
    const minMountain = pass === 0 ? 0.18 : pass === 1 ? 0.08 : 0.04;
    const minSourceH = pass === 0 ? 16 : pass === 1 ? 11 : 8;
    for (let i = 0; i < RIVER_COUNT; i++) {
      if (descended.includes(i)) continue;
      const rng = mulberry32((hash2(i * 31 + 3, 17 + pass * 97, seed ^ 0x5f5f) * 0x7fffffff) | 0);
      let source = null, sourceH = -Infinity;
      // each river draws from its own directional wedge around the world so
      // sources spread out instead of stacking on the tallest massif
      const wedgeAng = i * 0.9 + hash2(i, 5, seed) * 1.2;
      const wedgeX = Math.cos(wedgeAng), wedgeZ = Math.sin(wedgeAng);
      for (let c = 0; c < 40; c++) {
        const ring = 2 + Math.floor(rng() * 3.4);
        const rx = Math.round((rng() * 2 - 1) * ring);
        const rz = Math.round((rng() * 2 - 1) * ring);
        if (rx === 0 && rz === 0) continue;
        const x = Math.round(rx * REGION_W + 14 + rng() * (REGION_W - 28));
        const z = Math.round(rz * REGION_H + 14 + rng() * (REGION_H - 28));
        if (inHomeRect(x, z)) continue;
        if (mountainAt(x, z) < minMountain) continue;
        const pl = Math.hypot(x, z) || 1;
        if ((x / pl) * wedgeX + (z / pl) * wedgeZ < (pass === 0 ? 0.1 : -1)) continue;
        let nearSource = false;
        for (const s of sources) {
          if (Math.hypot(s.x - x, s.z - z) < MIN_SOURCE_SEP) { nearSource = true; break; }
        }
        if (nearSource) continue;
        const h = elevationAt(x, z);
        if (h > sourceH) { sourceH = h; source = { x, z }; }
      }
      if (!source || sourceH < minSourceH) continue;
      // every river runs a waypoint gradient from its highland source to a
      // distant lake (the same construction as the home river): a meandering
      // walk toward the target with surface levels easing down smoothly, so
      // channels reliably span many regions instead of dying in pits
      let target = null, targetScore = Infinity;
      const lakeUse = {};
      for (const river of rivers) {
        const used = river.samples[river.samples.length - 1];
        for (const lake of lakes) {
          const dx = (used.x - lake.x) / (lake.rx * 1.4), dz = (used.z - lake.z) / (lake.rz * 1.4);
          if (dx * dx + dz * dz < 1) lakeUse[lake.id] = (lakeUse[lake.id] || 0) + 1;
        }
      }
      for (const lake of lakes) {
        if ((lakeUse[lake.id] || 0) >= 2) continue; // spread rivers across basins
        const dx = lake.x - source.x, dz = lake.z - source.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 260 || dist > 1500) continue;
        const score = dist - Math.abs(hash2(i, lake.x, seed)) * 320;
        if (score < targetScore) { targetScore = score; target = lake; }
      }
      if (!target) continue;
      const runX = target.x - source.x, runZ = target.z - source.z;
      const runLen = Math.hypot(runX, runZ) || 1;
      // valley-seeking walk: at each step pick the lowest-elevation candidate
      // heading, penalized for straying from the chord and for approaching
      // another river's course
      const walk = [{ x: source.x, z: source.z }];
      let dirX = runX / runLen, dirZ = runZ / runLen;
      let wx = source.x, wz = source.z;
      const stepLen = 2.2;
      const maxSteps = Math.ceil((runLen * 1.9) / stepLen);
      const reachR = Math.max(target.rx, target.rz) * 1.1;
      for (let step = 0; step < maxSteps; step++) {
        if (Math.hypot(target.x - wx, target.z - wz) < reachR) break;
        let bestScore = Infinity, bestX = wx, bestZ = wz, bestHx = dirX, bestHz = dirZ;
        let blockedAny = false, allBlocked = true;
        for (let a = -2; a <= 2; a++) {
          const ang = a * 0.34;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const hx = dirX * ca - dirZ * sa, hz = dirX * sa + dirZ * ca;
          let px2 = wx + hx * stepLen, pz2 = wz + hz * stepLen;
          // deflect around the home rectangle (rivers never cross the town)
          if (px2 > -10 && px2 < REGION_W + 10 && pz2 > -10 && pz2 < REGION_H + 10) {
            const dl = px2 + 10, dr = REGION_W + 10 - px2, dt = pz2 + 10, db = REGION_H + 10 - pz2;
            const m = Math.min(dl, dr, dt, db);
            if (m === dl) px2 = -13; else if (m === dr) px2 = REGION_W + 13;
            else if (m === dt) pz2 = -13; else pz2 = REGION_H + 13;
          }
          const proj = (px2 - source.x) * runX + (pz2 - source.z) * runZ;
          const tClamp = Math.max(0, Math.min(runLen * runLen, proj)) / (runLen * runLen);
          const chordX = source.x + runX * tClamp, chordZ = source.z + runZ * tClamp;
          const dev = Math.hypot(px2 - chordX, pz2 - chordZ);
          const sep = sepNear(px2, pz2);
          const sepPenalty = sep < MIN_RIVER_SEP ? (MIN_RIVER_SEP - sep) * 6.0 : 0;
          const score = elevationAt(px2, pz2) + dev * 0.12 + sepPenalty +
            (hash2(step, i * 7 + a + 40, seed + 400) - 0.5) * 0.4;
          // hard buffer: entering another river's bed is a last resort — only
          // chosen when every candidate heading is blocked (forced corridor)
          const blocked = sep < 8;
          if (score < bestScore && !(blocked && !allBlocked)) {
            bestScore = score; bestX = px2; bestZ = pz2; bestHx = hx; bestHz = hz;
          }
          if (blocked) blockedAny = true; else allBlocked = false;
        }
        wx = bestX; wz = bestZ;
        dirX = dirX * 0.42 + bestHx * 0.58;
        dirZ = dirZ * 0.42 + bestHz * 0.58;
        const dl = Math.hypot(dirX, dirZ) || 1;
        dirX /= dl; dirZ /= dl;
        walk.push({ x: wx, z: wz });
      }
      // surface level: smooth monotonic descent along arc length
      const arc = [0];
      for (let k = 1; k < walk.length; k++) {
        arc.push(arc[k - 1] + Math.hypot(walk[k].x - walk[k - 1].x, walk[k].z - walk[k - 1].z));
      }
      const total = arc[arc.length - 1] || 1;
      const startLevel = Math.min(sourceH - 1.2, 56);
      const samples = [];
      let prevLevel = Infinity;
      for (let k = 0; k < walk.length; k++) {
        const t = arc[k] / total;
        let level = Math.max(2, startLevel + (target.level - startLevel) * smooth(t));
        if (level > prevLevel) level = prevLevel;   // monotonic guarantee
        prevLevel = level;
        samples.push({ x: Math.round(walk[k].x * 2) / 2, z: Math.round(walk[k].z * 2) / 2, level: Math.round(level * 4) / 4 });
      }
      // connector: walk the mouth down to the lake SHORE (not the center) so
      // river water cells join the basin and two tributaries feeding the same
      // lake converge on distinct shoreline points instead of overlapping
      const mouth = samples[samples.length - 1];
      const mdx0 = target.x - mouth.x, mdz0 = target.z - mouth.z;
      const mdist = Math.hypot(mdx0, mdz0);
      if (mdist > 2) {
        const join = Math.ceil(mdist / 2.2);
        for (let k = 1; k <= join; k++) {
          const t = k / join;
          const px2 = mouth.x + mdx0 * t, pz2 = mouth.z + mdz0 * t;
          samples.push({
            x: Math.round(px2 * 2) / 2,
            z: Math.round(pz2 * 2) / 2,
            level: target.level,
          });
          if (lakeTouches(target, px2, pz2, 1.02)) break;
        }
      }
      // hand the last samples over to the lake's surface level
      for (let k = Math.max(0, samples.length - 4); k < samples.length; k++) {
        samples[k].level = target.level;
      }
      // final separation gate: reject a course that still runs closer than 10
      // cells to an existing river outside shared basins (walk got forced).
      // Near a lake the exclusion widens — tributaries legitimately converge.
      let openSep = Infinity;
      for (const s of samples) {
        let nearBasin = false;
        for (const lake of lakes) {
          if (lakeTouches(lake, s.x, s.z, 2.2)) { nearBasin = true; break; }
        }
        if (nearBasin) continue;
        const d = sepNear(s.x, s.z);
        if (d < openSep) openSep = d;
      }
      if (openSep < 12) continue;   // deterministic rejection — this slot retries in pass 2
      rivers.push({ id: 'world-river-' + i, samples });
      sepAdd(samples);
      sources.push(source);
      descended.push(i);
    }
  }
  // per-sample half-width: the stream stamp is the floor; rivers swell with a
  // slow world-space noise so courses breathe between fords and broad sweeps.
  // worldGenerator.mjs uses the identical formula so seam widths match.
  for (const river of rivers) {
    for (const s of river.samples) {
      s.w = 1.9 + 1.5 * noise(s.x, s.z, 140, seed + 9193);
    }
  }
  return { rivers, lakes };
}

// ── world roads ────────────────────────────────────────────────────────────
// Extensions continue each home road outward to a POI in the neighboring
// region; loop segments chain those POIs into a ring road around home.
function buildWorldRoads(homeDef, seed, waterAt) {
  const segments = [];
  const anchors = (homeDef?.metadata?.roads || []).map((path) => path[path.length - 1]);
  const town = homeDef?.metadata?.townCenter || { x: 56, z: 55 };
  const pois = [];
  anchors.forEach((anchor, index) => {
    const rng = mulberry32((hash2(anchor.x, anchor.z, seed ^ 0xa0a0) * 0x7fffffff) | 0);
    const dir = { x: anchor.x - town.x, z: anchor.z - town.z };
    const len = Math.hypot(dir.x, dir.z) || 1;
    dir.x /= len; dir.z /= len;
    // target POI 42-78 cells out, inside whichever region it lands in
    const distance = 42 + rng() * 36;
    let target = { x: Math.round(anchor.x + dir.x * distance), z: Math.round(anchor.z + dir.z * distance) };
    target.x += Math.round((rng() - 0.5) * 18);
    target.z += Math.round((rng() - 0.5) * 18);
    const path = roadPath(anchor, target, rng, waterAt);
    if (path.length > 4) {
      segments.push({ id: 'road-ext-' + index, cells: path, width: 0 });
      pois.push({ x: target.x, z: target.z, anchorIndex: index });
    }
  });
  // loop roads between consecutive POIs (ring around home)
  for (let i = 0; i < pois.length; i++) {
    const a = pois[i], b = pois[(i + 1) % pois.length];
    if (a.anchorIndex === b.anchorIndex) continue;
    const rng = mulberry32((hash2(a.x + b.x, a.z + b.z, seed ^ 0x0b0b) * 0x7fffffff) | 0);
    const path = roadPath(a, b, rng, waterAt);
    if (path.length > 4) segments.push({ id: 'road-loop-' + i, cells: path, width: 0 });
  }
  return { segments, pois };
}

// Wobbling line walk that refuses to touch water (reroutes perpendicular a
// few times before giving up) so roads never sit on water cells.
function roadPath(from, to, rng, waterAt) {
  const path = [];
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const steps = Math.ceil(len * 2);
  let perp = 0;
  let blockedStreak = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wobble = Math.sin(t * Math.PI * 3) * Math.min(3, len * 0.05);
    let x = from.x + dx * t - (dz / len) * (wobble + perp);
    let z = from.z + dz * t + (dx / len) * (wobble + perp);
    if (waterAt(x, z)) {
      let fixed = false;
      for (const offset of [1.5, -1.5, 3, -3, 4.5, -4.5, 6, -6, 8, -8]) {
        const ox = x - (dz / len) * offset, oz = z + (dx / len) * offset;
        if (!waterAt(ox, oz)) { x = ox; z = oz; fixed = true; break; }
      }
      if (!fixed) {
        perp += 2.2 * (rng() < 0.5 ? 1 : -1);
        blockedStreak++;
        if (blockedStreak > 10) return path; // give up, keep the connected part
      } else {
        blockedStreak = 0;
      }
    } else {
      blockedStreak = 0;
    }
    const cell = { x: Math.round(x * 2) / 2, z: Math.round(z * 2) / 2 };
    const last = path[path.length - 1];
    if (!last || Math.abs(last.x - cell.x) >= 0.5 || Math.abs(last.z - cell.z) >= 0.5) {
      path.push(cell);
    }
  }
  return path;
}

// ── world context (shared, lazy) ───────────────────────────────────────────
let worldCtxCache = null;
export function getWorldContext({ seed = WORLD_SEED, homeDef = null } = {}) {
  if (worldCtxCache && worldCtxCache.seed === seed && worldCtxCache.homeDef === homeDef) {
    return worldCtxCache;
  }
  const elevationAt = (x, z) => worldElevation(x, z, seed);
  const mountainAt = (x, z) => mountainWeight(x, z, seed);
  const { rivers, lakes } = buildWorldWater(homeDef, seed, elevationAt, mountainAt);
  const homeBodies = [
    ...((homeDef?.metadata?.water?.lakes || [])),
    ...((homeDef?.metadata?.water?.ponds || [])),
  ];
  // water probe used by road routing: rivers within their per-sample half-width
  // plus margin, home bodies and world lakes by ellipse
  const waterAt = (x, z) => {
    for (const river of rivers) {
      for (const s of river.samples) {
        if (Math.abs(s.x - x) > 5 || Math.abs(s.z - z) > 5) continue;
        if (Math.hypot(s.x - x, s.z - z) < (s.w || 1.9) + 0.6) return true;
      }
    }
    for (const body of homeBodies) {
      if (Math.abs(body.x - x) > body.rx + 1.5 || Math.abs(body.z - z) > body.rz + 1.5) continue;
      if (Math.hypot((x - body.x) / body.rx, (z - body.z) / body.rz) < 1.05) return true;
    }
    for (const lake of lakes) {
      if (Math.abs(lake.x - x) > lake.rx + 2 || Math.abs(lake.z - z) > lake.rz + 2) continue;
      if (lakeTouches(lake, x, z, 1.06)) return true;
    }
    return false;
  };
  const roads = buildWorldRoads(homeDef, seed, waterAt);
  const grandLakes = lakes.filter((l) => l.grand);
  worldCtxCache = {
    seed, homeDef, rivers, lakes, roads, elevationAt, mountainAt,
    baseAt: (x, z) => baseElevation(x, z, seed),
    waterAt,
    riverSampleGrid: buildRiverGrid(rivers),
    grandLakes,
    shoreTypeAt: (x, z) => {
      for (const lake of grandLakes) {
        const d = grandLakeDistance(lake, x, z);
        if (d >= 0.85 && d <= 1.25) return grandLakeShoreType(lake, x, z);
      }
      return null;
    },
    lakeDepthTierAt: (x, z) => {
      for (const lake of grandLakes) {
        const tier = grandLakeDepthTier(lake, x, z);
        if (tier) return tier;
      }
      return null;
    },
  };
  return worldCtxCache;
}

// Coarse spatial bucket for river samples: carving/lookups touch thousands of
// vertices per region; scanning every sample per vertex is too slow.
function buildRiverGrid(rivers) {
  const grid = new Map();
  const key = (bx, bz) => bx + ',' + bz;
  for (const river of rivers) {
    for (const s of river.samples) {
      const bx = Math.floor(s.x / 8), bz = Math.floor(s.z / 8);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const k = key(bx + dx, bz + dz);
        let list = grid.get(k);
        if (!list) { list = []; grid.set(k, list); }
        list.push(s);
      }
    }
  }
  return grid;
}

function riverNear(ctx, x, z) {
  const list = ctx.riverSampleGrid.get(Math.floor(x / 8) + ',' + Math.floor(z / 8));
  if (!list) return null;
  let nearest = null, minD = Infinity;
  for (const s of list) {
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < minD) { minD = d; nearest = s; }
  }
  return { sample: nearest, distance: minD };
}

/** World-space water probe: does world cell (wx, wz) hold water, and at what
 *  surface level? Exact mirror of the per-region stamping rules (lake ellipse
 *  with the LAKE_SALT edge hash + river sample discs), so the answer is
 *  identical from both sides of a region seam. Ponds are region-local but
 *  clamped >=12 cells from borders, so they never need to qualify here.
 *  Returns the water surface level (ft) or null when the cell is dry. */
export function worldWaterCellAt(ctx, wx, wz) {
  for (const lake of ctx.lakes) {
    if (lake.grand) {
      if (Math.abs(wx - lake.x) > lake.rx * 1.35 || Math.abs(wz - lake.z) > lake.rz * 1.35) continue;
      if (isGrandLakeIsland(lake, wx, wz)) continue;
      const edge = 1 + (hash2(wx, wz, LAKE_SALT) - 0.5) * 0.08;
      if (grandLakeDistance(lake, wx, wz) < edge) return lake.level;
      continue;
    }
    if (Math.abs(wx - lake.x) > lake.rx * 1.3 + 1 || Math.abs(wz - lake.z) > lake.rz * 1.3 + 1) continue;
    const edge = 1 + (hash2(wx, wz, LAKE_SALT) - 0.5) * 0.10;
    if (lakeTouches(lake, wx, wz, edge)) return lake.level;
  }
  const list = ctx.riverSampleGrid.get(Math.floor(wx / 8) + ',' + Math.floor(wz / 8));
  if (list) {
    for (const s of list) {
      const halfW = (s.w || 1.9) + 0.1;
      const dx = Math.round(s.x) - wx, dz = Math.round(s.z) - wz;
      if (dx * dx + dz * dz <= halfW * halfW) return s.level;
    }
  }
  return null;
}

// ── neighbor region generation ─────────────────────────────────────────────
const PAD = 22;            // slope-clamp padding (>= CLAMP_ITERS keeps seams exact)
const CLAMP_ITERS = 20;
const SLOPE_CAP = 6.75;    // ft per vertex step (allows dramatic mountain faces while keeping quantized steps <= 7.0 ft)
const LAKE_SALT = 7001;

const NEIGHBOR_CLUSTER_VARIANTS = {
  forest: ['tree', 'tree', 'boulder', 'fern', 'twig', 'rock'],
  meadow: ['wildflower', 'grass', 'grass', 'wildflower', 'grass', 'rock', 'wildflower', 'grass', 'tree'],
  snow_forest: ['tree', 'tree', 'tree', 'boulder', 'snow_drift', 'rock'],
  // snowfield gains a sparse tree mix (user ruling: snow country gets a good
  // mix of trees — the snowpine stock we already use — plus dead trees to
  // sell the frozen look; both draw from existing kit species buckets).
  snowfield: ['tree', 'snow_drift', 'snow_drift', 'rock', 'boulder', 'tree'],
  deadlands: ['tree', 'tree', 'dead_brush', 'rock', 'boulder'],
  mountains: ['boulder', 'boulder', 'rock', 'tree', 'scree'],
  ruins: ['rubble', 'rubble', 'rock', 'ruin_pillar'],
  graveyard: ['grave_marker', 'dead_brush', 'rock'],
  swamp: ['tree', 'dead_brush', 'fern', 'rock', 'boulder'],
  volcanic: ['boulder', 'boulder', 'rock', 'scree', 'dead_brush'],
  coastal: ['grass', 'rock', 'boulder', 'twig', 'wildflower'],
};

// The guaranteed graveyard sits in exactly one ring-1 region (high chance of
// a cemetery next to the town, per the town-adjacency rule).
const RING1 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
export function graveyardSiteRegion(seed = WORLD_SEED) {
  const idx = Math.floor(hash2(91, 37, seed ^ 0x6a6a) * 8) % 8;
  return { rx: RING1[idx][0], rz: RING1[idx][1] };
}

function isPondBiome(biome) {
  return biome === 'meadow' || biome === 'forest' || biome === 'snow_forest' || biome === 'swamp';
}

function generateNeighborRegion(rx, rz, ctx) {
  const seed = ctx.seed;
  const originX = rx * REGION_W, originZ = rz * REGION_H;
  const regionRng = mulberry32((hash2(rx * 3 + 1, rz * 7 + 2, seed ^ 0xbeef) * 0x7fffffff) | 0);
  const PW = REGION_W + 1 + PAD * 2, PH = REGION_H + 1 + PAD * 2;

  // ── 1. raw world elevation over the padded window ────────────────────────
  const raw = new Float64Array(PW * PH);
  for (let pz = 0; pz < PH; pz++) {
    const gz = originZ + pz - PAD;
    for (let px = 0; px < PW; px++) {
      raw[pz * PW + px] = ctx.elevationAt(originX + px - PAD, gz);
    }
  }

  // ── 2. biome cells: classify the macro field per world cell ─────────────
  const grandLakes = ctx.grandLakes || (ctx.lakes || []).filter((l) => l.grand);
  const kinds = [...BIOME_ORDER];
  const cells = new Array(REGION_W * REGION_H);
  for (let z = 0; z < REGION_H; z++) {
    for (let x = 0; x < REGION_W; x++) {
      cells[z * REGION_W + x] = BIOME_INDEX[classifyBiome(originX + x + 0.5, originZ + z + 0.5, seed, grandLakes)];
    }
  }
  // Island biomes within grand lakes override the water bed
  for (const lake of grandLakes) {
    for (const isl of (lake.islands || [])) {
      for (let z = 0; z < REGION_H; z++) {
        for (let x = 0; x < REGION_W; x++) {
          const wx = originX + x + 0.5, wz = originZ + z + 0.5;
          const dx = (wx - isl.x) / isl.rx, dz = (wz - isl.z) / isl.rz;
          if (dx * dx + dz * dz <= 1.0) {
            cells[z * REGION_W + x] = BIOME_INDEX[isl.biome || 'ruins'];
          }
        }
      }
    }
  }
  const dominant = classifyBiome(originX + REGION_W / 2, originZ + REGION_H / 2, seed, grandLakes);
  const tally = {};
  for (const c of cells) tally[kinds[c]] = (tally[kinds[c]] || 0) + 1;
  const majorityBiome = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  const lushShare = cells.filter((c) => isPondBiome(kinds[c])).length / cells.length;

  // ── 3. ponds (region-local, biome-locked) decided on the raw field ──────
  const ponds = [];
  const pondCount = isPondBiome(majorityBiome) && regionRng() < 0.45 ? 1 : 0;
  for (let i = 0; i < pondCount; i++) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const cx = 16 + regionRng() * (REGION_W - 32);
      const cz = 14 + regionRng() * (REGION_H - 28);
      const wx = originX + cx, wz = originZ + cz;
      const near = ctx.riverSampleGrid ? riverNear(ctx, wx, wz) : null;
      if (near && near.distance < 8) continue;
      let lakeHit = false;
      for (const lake of ctx.lakes) {
        if (Math.abs(lake.x - wx) < (lake.rx + 8) && Math.abs(lake.z - wz) < (lake.rz + 8) &&
          lakeTouches(lake, wx, wz, 1.5)) { lakeHit = true; break; }
      }
      if (lakeHit) continue;
      const rX = 2.4 + regionRng() * 1.2, rZ = 2 + regionRng() * 1;
      const centerAt = Math.round(cz + PAD) * PW + Math.round(cx + PAD);
      const centerH = raw[centerAt];
      if (centerH > 42) continue;
      let ringMean = 0, ringN = 0, ringMax = -Infinity;
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        const sx = Math.round(cx + Math.cos(ang) * (rX * 1.2 + 1));
        const sz = Math.round(cz + Math.sin(ang) * (rZ * 1.2 + 1));
        if (sx < 0 || sz < 0 || sx > REGION_W || sz > REGION_H) continue;
        const hh = raw[Math.round(sz + PAD) * PW + Math.round(sx + PAD)];
        ringMean += hh; ringN++;
        if (hh > ringMax) ringMax = hh;
      }
      ringMean /= Math.max(1, ringN);
      const level = Math.max(2, Math.min(14, centerH - 1.2));
      if (ringMean - level > 2.5 || ringMax - level > 5.5) continue;
      ponds.push({ x: cx, z: cz, rx: rX, rz: rZ, level, kind: 'pond' });
      break;
    }
  }

  // ── 3. carve water beds into the raw field (pre-clamp) ───────────────────
  const carveBody = (body, maxDepth) => {
    const rxBound = body.grand ? body.rx * 1.35 : body.rx * 1.6;
    const rzBound = body.grand ? body.rz * 1.35 : body.rz * 1.6;
    const minX = Math.max(0, Math.floor(body.x - rxBound - 2) - originX + PAD);
    const maxX = Math.min(PW - 1, Math.ceil(body.x + rxBound + 2) - originX + PAD);
    const minZ = Math.max(0, Math.floor(body.z - rzBound - 2) - originZ + PAD);
    const maxZ = Math.min(PH - 1, Math.ceil(body.z + rzBound + 2) - originZ + PAD);
    for (let pz = minZ; pz <= maxZ; pz++) {
      const wz = originZ + pz - PAD;
      for (let px = minX; px <= maxX; px++) {
        const wx = originX + px - PAD;
        if (body.grand && isGrandLakeIsland(body, wx, wz)) continue;
        const d = body.grand
          ? grandLakeDistance(body, wx, wz)
          : Math.hypot((wx - body.x) / body.rx, (wz - body.z) / body.rz);
        if (d > 1.5) continue;
        const at = pz * PW + px;
        const bed = body.level - maxDepth + Math.pow(Math.min(1, d), 2) * (maxDepth - 0.4);
        const bank = body.level + 0.8 * Math.sin(Math.min(1, (d - 1.0) / 0.45) * (Math.PI / 2));
        const target = d <= 1.0 ? bed : bank;
        const shoreBlend = smooth(Math.max(0, Math.min(1, (1.45 - d) / 0.45)));
        raw[at] += (Math.min(raw[at], target) - raw[at]) * shoreBlend;
      }
    }
  };
  for (const lake of ctx.lakes) {
    const stretch = lake.grand ? 1.4 : 1.7;
    if (lake.x + lake.rx * stretch < originX - PAD || lake.x - lake.rx * stretch > originX + REGION_W + PAD) continue;
    if (lake.z + lake.rz * stretch < originZ - PAD || lake.z - lake.rz * stretch > originZ + REGION_H + PAD) continue;
    carveBody(lake, lake.grand ? 5.5 : 3.2);
  }
  for (const pond of ponds) carveBody(pond, 1.5);
  // river beds (same kernel as home so seams with the home region match)
  for (let pz = 0; pz < PH; pz++) {
    const wz = originZ + pz - PAD;
    for (let px = 0; px < PW; px++) {
      const wx = originX + px - PAD;
      const near = riverNear(ctx, wx, wz);
      if (!near || near.distance >= 7.0) continue;
      const at = pz * PW + px;
      const { sample, distance } = near;
      const w = sample.w || 1.9;
      const riverBed = sample.level - (1.0 + 0.2 * w) + Math.min(1, distance / w) * 0.4;
      const riverBank = sample.level + 0.35 + (distance - w) * 1.0;
      const target = distance <= w ? riverBed : riverBank;
      const blend = smooth(Math.max(0, Math.min(1, (7.0 - distance) / 5.5)));
      raw[at] += (Math.min(raw[at], target) - raw[at]) * blend;
    }
  }

  // ── 4. deterministic Jacobi slope clamp (window-invariant) ───────────────
  const preClamp = Float64Array.from(raw);
  slopeClampField(raw, PW, PH, CLAMP_ITERS, SLOPE_CAP);

  // ── 5. extract the inner vertex grid, blending back to the raw shared
  //       field near home so the home seam evaluates identically both sides
  const heights = new Array((REGION_W + 1) * (REGION_H + 1));
  for (let z = 0; z <= REGION_H; z++) {
    const gz = originZ + z;
    for (let x = 0; x <= REGION_W; x++) {
      const gx = originX + x;
      let h = raw[(z + PAD) * PW + (x + PAD)];
      const seam = seamMask(gx, gz);
      if (seam > 0) h = lerp(h, preClamp[(z + PAD) * PW + (x + PAD)], seam);
      heights[z * (REGION_W + 1) + x] = Math.round(h * 4) / 4;
    }
  }

  // ── 6. water cells: world lakes, rivers, ponds ───────────────────────────
  const waterCells = new Set();
  const waterSurface = new Array(REGION_W * REGION_H).fill(null);
  const setWater = (x, z, level) => {
    const cell = z * REGION_W + x;
    const existing = waterSurface[cell];
    if (existing === null || existing === undefined || level < existing) {
      waterCells.add(cell);
      waterSurface[cell] = level;
    }
  };
  for (const lake of ctx.lakes) {
    const stretch = lake.grand ? 1.35 : 1.3;
    const minX = Math.max(0, Math.floor(lake.x - lake.rx * stretch - 1) - originX);
    const maxX = Math.min(REGION_W - 1, Math.ceil(lake.x + lake.rx * stretch + 1) - originX);
    const minZ = Math.max(0, Math.floor(lake.z - lake.rz * stretch - 1) - originZ);
    const maxZ = Math.min(REGION_H - 1, Math.ceil(lake.z + lake.rz * stretch + 1) - originZ);
    if (maxX < 0 || maxZ < 0 || minX > REGION_W - 1 || minZ > REGION_H - 1) continue;
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const wx = originX + x, wz = originZ + z;
        if (lake.grand && isGrandLakeIsland(lake, wx, wz)) continue;
        const edge = 1 + (hash2(wx, wz, LAKE_SALT) - 0.5) * (lake.grand ? 0.08 : 0.10);
        if (!lakeTouches(lake, wx, wz, edge)) continue;
        setWater(x, z, lake.level);
      }
    }
  }
  for (const river of ctx.rivers) {
    for (const s of river.samples) {
      const lx = s.x - originX, lz = s.z - originZ;
      if (lx < -5 || lz < -5 || lx > REGION_W + 5 || lz > REGION_H + 5) continue;
      const centerX = Math.round(lx), centerZ = Math.round(lz);
      // half-width from the sample: the old stream stamp is the minimum width
      const halfW = (s.w || 1.9) + 0.1;
      const maxR2 = halfW * halfW;
      for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dz * dz > maxR2) continue;
        const x = centerX + dx, z = centerZ + dz;
        if (x < 0 || z < 0 || x >= REGION_W || z >= REGION_H) continue;
        setWater(x, z, s.level);
      }
    }
  }
  for (const pond of ponds) {
    for (let z = Math.floor(pond.z - pond.rz - 1); z <= pond.z + pond.rz + 1; z++) {
      for (let x = Math.floor(pond.x - pond.rx - 1); x <= pond.x + pond.rx + 1; x++) {
        if (x < 0 || z < 0 || x >= REGION_W || z >= REGION_H) continue;
        const dx = (x - pond.x) / pond.rx, dz = (z - pond.z) / pond.rz;
        const edge = 1 + (hash2(originX + x, originZ + z, 7301 + ponds.indexOf(pond) * 6) - 0.5) * 0.2;
        if (dx * dx + dz * dz < edge) setWater(x, z, pond.level);
      }
    }
  }

  // lake/pond bed centers stay depressed below the surface (home constants)
  for (const body of [...ctx.lakes, ...ponds]) {
    const cx = Math.round(body.x - originX), cz = Math.round(body.z - originZ);
    if (cx < 0 || cz < 0 || cx > REGION_W || cz > REGION_H) continue;
    const maxCenterGround = body.level - 0.4;
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) {
      const at = (cz + dz) * (REGION_W + 1) + (cx + dx);
      if (at >= 0 && at < heights.length && heights[at] > maxCenterGround) heights[at] = maxCenterGround;
    }
  }

  // shoreline water surface safety clamp (same constants as home). Neighbors
  // across a region seam are resolved through the world water field so lakes
  // and rivers read as one body instead of getting trenched at the border.
  for (const cell of waterCells) {
    const x = cell % REGION_W, z = Math.floor(cell / REGION_W);
    const ground = (
      heights[z * (REGION_W + 1) + x] +
      heights[z * (REGION_W + 1) + x + 1] +
      heights[(z + 1) * (REGION_W + 1) + x] +
      heights[(z + 1) * (REGION_W + 1) + x + 1]
    ) / 4;
    if (waterSurface[cell] > ground + 1.95) waterSurface[cell] = ground + 1.95;
    const isWater = (nx, nz) => {
      if (nx >= 0 && nx < REGION_W && nz >= 0 && nz < REGION_H) return waterCells.has(nz * REGION_W + nx);
      return worldWaterCellAt(ctx, originX + nx, originZ + nz) !== null;
    };
    const shoreline = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .some(([dx, dz]) => !isWater(x + dx, z + dz));
    if (shoreline) waterSurface[cell] = Math.min(waterSurface[cell], ground - 0.18);
  }

  // ── 7. roads from world segments + bridges per crossing cluster ──────────
  // Wide carriageways (user ruling ~4x): each path cell stamps a radius-2
  // disc (≈4-5 cells / 20-25 ft). The CENTER cell always stamps (so rare
  // path-on-river cells still form crossing clusters → bridges), while disc
  // OFFSETS stamp on land only — wide roads narrow to the bank instead of
  // spawning phantom bridges over lake rims.
  const roadCells = new Set();
  for (const segment of ctx.roads.segments) {
    for (const p of segment.cells) {
      const lx = Math.round(p.x - originX), lz = Math.round(p.z - originZ);
      if (lx < 0 || lz < 0 || lx >= REGION_W || lz >= REGION_H) continue;
      roadCells.add(lz * REGION_W + lx);
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dz === 0) continue;
        if (dx * dx + dz * dz > 4.35) continue;
        const nx = lx + dx, nz = lz + dz;
        if (nx < 0 || nz < 0 || nx >= REGION_W || nz >= REGION_H) continue;
        const ncell = nz * REGION_W + nx;
        if (waterCells.has(ncell)) continue;
        roadCells.add(ncell);
      }
    }
  }
  const bridges = [];
  const crossings = [...roadCells].filter((cell) => waterCells.has(cell) && (waterSurface[cell] ?? 0) < 18);
  const seenCluster = new Set();
  for (const startCell of crossings) {
    if (seenCluster.has(startCell) || bridges.length >= 4) continue;
    // flood-fill the connected road-over-water cluster
    const cluster = [startCell];
    seenCluster.add(startCell);
    for (let i = 0; i < cluster.length; i++) {
      const cx = cluster[i] % REGION_W, cz = Math.floor(cluster[i] / REGION_W);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const n = (cz + dz) * REGION_W + (cx + dx);
        if (crossings.includes(n) && !seenCluster.has(n)) { seenCluster.add(n); cluster.push(n); }
      }
    }
    const avgX = cluster.reduce((sum, c) => sum + (c % REGION_W), 0) / cluster.length;
    const avgZ = cluster.reduce((sum, c) => sum + Math.floor(c / REGION_W), 0) / cluster.length;
    const nearest = riverNear(ctx, originX + avgX, originZ + avgZ);
    const roadDir = nearest
      ? { x: -(nearest.sample.z - (originZ + avgZ)), z: nearest.sample.x - (originX + avgX) }
      : { x: 1, z: 0 };
    const rotY = Math.atan2(roadDir.x, roadDir.z);
    // size the span to the actual crossing cluster so wide river sections
    // still get a deck that reaches both banks
    let bxMin = Infinity, bxMax = -Infinity, bzMin = Infinity, bzMax = -Infinity;
    for (const c of cluster) {
      const lx2 = (c % REGION_W) - avgX, lz2 = Math.floor(c / REGION_W) - avgZ;
      const rlx = lx2 * Math.cos(-rotY) - lz2 * Math.sin(-rotY);
      const rlz = lx2 * Math.sin(-rotY) + lz2 * Math.cos(-rotY);
      bxMin = Math.min(bxMin, rlx); bxMax = Math.max(bxMax, rlx);
      bzMin = Math.min(bzMin, rlz); bzMax = Math.max(bzMax, rlz);
    }
    const bridgeWidth = Math.max(2.4, bxMax - bxMin + 1.8);   // roadway ≥ 12 ft
    const bridgeLength = Math.max(5.2, bzMax - bzMin + 2.8);  // span reaches both banks
    const span = Math.ceil(bridgeLength / 2) + 1;
    for (let dz = -span; dz <= span; dz++) {
      for (let dx = -span; dx <= span; dx++) {
        const bx = Math.round(avgX) + dx, bz = Math.round(avgZ) + dz;
        if (bx < 0 || bz < 0 || bx >= REGION_W || bz >= REGION_H) continue;
        const localX = (bx - avgX) * Math.cos(-rotY) - (bz - avgZ) * Math.sin(-rotY);
        const localZ = (bx - avgX) * Math.sin(-rotY) + (bz - avgZ) * Math.cos(-rotY);
        if (Math.abs(localX) <= bridgeWidth / 2 + 0.6 && Math.abs(localZ) <= bridgeLength / 2 + 0.6) {
          const bcell = bz * REGION_W + bx;
          waterCells.delete(bcell);
          waterSurface[bcell] = null;
          roadCells.add(bcell);
        }
      }
    }
    bridges.push({ x: avgX + 0.5, z: avgZ + 0.5, type: 'bridge', width: bridgeWidth, length: bridgeLength, rotY, scale: 1.0 });
  }

  // Wide-road sweep: disc offsets already stamp on land only, but the road
  // CENTER cells still stamp raw (bridge detection needs them). After the
  // bridge corridors de-water their cells, strip any road cell still sitting
  // on water — roads narrow to the bank, bridges keep their crossings.
  for (const cell of [...roadCells]) {
    if (waterCells.has(cell)) roadCells.delete(cell);
  }

  // ── 8. site overrides paint the site footprints onto the biome field ────
  const overrideEllipse = (cx, cz, rx, rz, biomeName) => {
    for (let z = Math.max(0, Math.floor(cz - rz)); z <= Math.min(REGION_H - 1, Math.ceil(cz + rz)); z++) {
      for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(REGION_W - 1, Math.ceil(cx + rx)); x++) {
        const dx = (x - cx) / rx, dz = (z - cz) / rz;
        if (dx * dx + dz * dz <= 1) cells[z * REGION_W + x] = BIOME_INDEX[biomeName];
      }
    }
  };

  // ── 9. sites: graveyard (ring-1 guarantee), temple/fortress ruins ────────
  const props = [];
  const clusters = [];
  const addProp = (type, x, z, options = {}) => props.push({ type, x, z, ...options });
  const pointsOfInterest = [];
  const isLand = (x, z) => {
    const cx = Math.floor(x), cz = Math.floor(z);
    if (cx < 2 || cz < 2 || cx >= REGION_W - 2 || cz >= REGION_H - 2) return false;
    const cell = cz * REGION_W + cx;
    return !waterCells.has(cell) && !roadCells.has(cell);
  };
  const nearRoad = (x, z, radius) => {
    const cx = Math.floor(x), cz = Math.floor(z);
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= REGION_W || nz >= REGION_H) continue;
        if (roadCells.has(nz * REGION_W + nx)) return { x: nx, z: nz };
      }
    }
    return null;
  };
  const findSite = (rng, half, avoid = null) => {
    const avoidHit = (x, z) => avoid && Math.abs(x - avoid.x) < avoid.r && Math.abs(z - avoid.z) < avoid.r;
    // prefer spots near a road so ruins/graveyards read as destinations
    for (let attempt = 0; attempt < 26; attempt++) {
      const x = half + 4 + rng() * (REGION_W - half * 2 - 8);
      const z = half + 4 + rng() * (REGION_H - half * 2 - 8);
      if (!isLand(x, z) || avoidHit(x, z)) continue;
      if (nearRoad(x, z, 14)) return { x, z };
    }
    for (let attempt = 0; attempt < 26; attempt++) {
      const x = half + 4 + rng() * (REGION_W - half * 2 - 8);
      const z = half + 4 + rng() * (REGION_H - half * 2 - 8);
      if (isLand(x, z) && !avoidHit(x, z)) return { x, z };
    }
    return null;
  };
  const facingToward = (site, roadCell) => {
    if (!roadCell) return Math.PI; // default: face south-ish
    return Math.atan2(roadCell.x + 0.5 - site.x, roadCell.z + 0.5 - site.z);
  };

  const GRAVE_LABELS = ['The Pale Rows', 'The Silent Rows', 'The Old Resting Ground'];
  let graveyardHere = false;
  const graveSite = graveyardSiteRegion(seed);
  if (graveSite.rx === rx && graveSite.rz === rz) {
    const site = findSite(regionRng, 13);
    if (site) {
      graveyardHere = true;
      const roadCell = nearRoad(site.x, site.z, 14);
      const phi = facingToward(site, roadCell);
      const ux = Math.sin(phi), uz = Math.cos(phi);   // forward (toward gate)
      const px2 = uz, pz2 = -ux;                       // right perpendicular
      const gateX = site.x + ux * 10.5, gateZ = site.z + uz * 10.5;
      if (isLand(gateX, gateZ)) {
        addProp('grave_gate', gateX, gateZ, { rotY: phi, clusterId: 'graveyard-site' });
      }
      // marker rows between the gate and the mausoleum
      for (let row = 0; row < 7; row++) {
        const d = 7.6 - row * 2.7;
        for (let col = -2; col <= 2; col++) {
          if (hash2(row, col + 3, seed ^ 0x91) < 0.24) continue;
          const off = col * 2.5 + (hash2(row, col, seed ^ 0x92) - 0.5) * 0.7;
          const mx = site.x + ux * d + px2 * off;
          const mz = site.z + uz * d + pz2 * off;
          if (!isLand(mx, mz)) continue;
          if (hash2(row * 5, col, seed ^ 0x93) < 0.24) {
            addProp('grave_mound', mx, mz, { scale: 0.9 + hash2(row, col, seed ^ 0x94) * 0.5, rotY: phi, clusterId: 'graveyard-site' });
          } else {
            addProp('grave_marker', mx, mz, {
              scale: 0.7 + hash2(row, col, seed ^ 0x95) * 0.5,
              rotY: phi + (hash2(row, col, seed ^ 0x96) - 0.5) * 0.3,
              clusterId: 'graveyard-site',
            });
          }
        }
      }
      // mausoleum at the back, columbaria flanking it
      const backX = site.x - ux * 7.2, backZ = site.z - uz * 7.2;
      if (isLand(backX, backZ)) addProp('mausoleum', backX, backZ, { rotY: phi, clusterId: 'graveyard-site' });
      for (const side of [-1, 1]) {
        const colX = site.x - ux * 9.4 + px2 * side * 6.4;
        const colZ = site.z - uz * 9.4 + pz2 * side * 6.4;
        if (isLand(colX, colZ)) addProp('columbarium', colX, colZ, { rotY: phi, clusterId: 'graveyard-site' });
      }
      // low stone fence around three sides (gate side stays open), with gaps
      for (let t = -9; t <= 9; t += 1.9) {
        for (const side of [-1, 1]) {
          if (hash2(Math.round(t * 3), side, seed ^ 0x97) < 0.2) continue;
          const fx = site.x + px2 * side * 8.2 + ux * t;
          const fz = site.z + pz2 * side * 8.2 + uz * t;
          if (isLand(fx, fz)) addProp('grave_fence', fx, fz, { rotY: phi + Math.PI / 2, scale: 1, clusterId: 'graveyard-site' });
        }
        // back edge
        if (hash2(Math.round(t * 3), 7, seed ^ 0x98) < 0.2) continue;
        const bx2 = site.x - ux * 9.8 + px2 * t;
        const bz2 = site.z - uz * 9.8 + pz2 * t;
        if (isLand(bx2, bz2)) addProp('grave_fence', bx2, bz2, { rotY: phi, scale: 1, clusterId: 'graveyard-site' });
      }
      // neglect: dead brush and a pair of dead trees
      for (let i = 0; i < 10; i++) {
        const bx = site.x + (regionRng() - 0.5) * 15, bz = site.z + (regionRng() - 0.5) * 12;
        if (isLand(bx, bz)) addProp('dead_brush', bx, bz, { scale: 0.7 + regionRng() * 0.8, rotY: regionRng() * Math.PI * 2, clusterId: 'graveyard-site' });
      }
      for (const side of [-1, 1]) {
        const tx = site.x - ux * 4 + px2 * side * 9.5, tz = site.z - uz * 4 + pz2 * side * 9.5;
        if (isLand(tx, tz)) addProp('tree', tx, tz, { scale: 0.9 + regionRng() * 0.8, variant: 'dead', rotY: regionRng() * Math.PI * 2, clusterId: 'graveyard-site' });
      }
      overrideEllipse(site.x, site.z, 12.5, 10, 'graveyard');
      clusters.push({ id: 'graveyard-site', rule: 'walled-cemetery', biome: 'graveyard', x: site.x, z: site.z, radius: 12 });
      pointsOfInterest.push({
        id: `graveyard-${rx}_${rz}`, kind: 'graveyard',
        label: GRAVE_LABELS[Math.floor(hash2(rx, rz, seed ^ 0x99) * GRAVE_LABELS.length) % GRAVE_LABELS.length],
        x: site.x, z: site.z,
      });
    }
  }

  // ── 9b. town sites (P3.8): rare road-adjacent hamlets on buildable land ──
  // A dedicated rng stream keeps the region's other draw sequences untouched;
  // the roll is hash-pure so town placement is order-independent.
  let townBuilt = false;
  let townSite = null;
  let townRecord = null;
  const townRng = mulberry32((hash2(rx * 13 + 5, rz * 11 + 3, seed ^ 0x70bd) * 0x7fffffff) | 0);
  const townRoll = hash2(rx * 7 + 1, rz * 17 + 4, seed ^ 0x70be);
  const TOWN_ODDS = 0.12;
  const townSurvey = {
    blocked: (x, z, kind) => {
      const cx2 = Math.floor(x), cz2 = Math.floor(z);
      if (cx2 < 2 || cz2 < 2 || cx2 >= REGION_W - 2 || cz2 >= REGION_H - 2) return true;
      const cell = cz2 * REGION_W + cx2;
      if (waterCells.has(cell)) return true;
      if (kind === 'water') return false;
      return roadCells.has(cell);
    },
    inBounds: (x, z) => x > 20 && z > 20 && x < REGION_W - 20 && z < REGION_H - 20,
    heightAt: (x, z) => heights[Math.max(0, Math.min(REGION_H, Math.round(z))) * (REGION_W + 1) + Math.max(0, Math.min(REGION_W, Math.round(x)))],
  };
  if (!graveyardHere && townRoll < TOWN_ODDS && dominant !== 'mountains' && dominant !== 'deadlands' && dominant !== 'snowfield') {
    // site survey: whole footprint clear of water (+margin), near a road,
    // level ground, well inside the region so pads never cross a seam
    // road-adjacent sites preferred (yaw anchor + travel access); plots may
    // also anchor the layout when no road is near, so fall back after 20 tries
    for (let attempt = 0; attempt < 40 && !townSite; attempt++) {
      const x = 42 + townRng() * (REGION_W - 84);
      const z = 38 + townRng() * (REGION_H - 76);
      const support = siteSupportsTown({ cx: x, cz: z, rx: 14, rz: 11, margin: 2, survey: townSurvey, heightAt: townSurvey.heightAt, maxGradeFt: 14 });
      if (!support.ok) continue;
      if (attempt < 20 && !nearRoad(x, z, 12)) continue;
      townSite = { x, z };
    }
    if (townSite) {
      const roadCell = nearRoad(townSite.x, townSite.z, 16);
      const roadDir = roadCell ? { x: roadCell.x - townSite.x, z: roadCell.z - townSite.z } : null;
      const town = layoutTown({ rng: townRng, cx: townSite.x, cz: townSite.z, roadDir, survey: townSurvey, maxRadius: 20 });
      if (town) {
        flattenTownFootprint(heights, REGION_W + 1, town, { vertexH: REGION_H + 1 });
        for (const b of town.buildings) addProp('building', b.x, b.z, b);
        addProp('well', town.well.x, town.well.z, { clusterId: 'town-site' });
        for (const l of town.lanterns) addProp('street_lantern', l.x, l.z, { clusterId: 'town-site' });
        overrideEllipse(townSite.x, townSite.z, 17, 14, 'town');
        clusters.push({ id: 'town-site', rule: 'town_center', biome: 'town', x: townSite.x, z: townSite.z, radius: 15 });
        pointsOfInterest.push({
          id: `town-${rx}_${rz}`, kind: 'town',
          label: `${nameForRegion(rx, rz, seed)} Crossing`, x: townSite.x, z: townSite.z,
        });
        townBuilt = true;
        townRecord = { variant: town.variant, axis: { ...town.axis }, cx: town.cx, cz: town.cz };
      }
    }
  }

  const siteRoll = hash2(rx * 17 + 3, rz * 5 + 8, seed ^ 0x33dd);
  if (!graveyardHere && lushShare > 0.5) {
    const templeOdds = dominant === 'meadow' ? 0.16 : 0.0;
    const fortressOdds = dominant === 'meadow' ? 0.11 : 0.10;
    if (siteRoll < templeOdds || siteRoll < templeOdds + fortressOdds) {
      const isTemple = siteRoll < templeOdds;
      const site = findSite(regionRng, isTemple ? 10 : 12, townBuilt ? { x: townSite.x, z: townSite.z, r: 26 } : null);
      if (site) {
        const roadCell = nearRoad(site.x, site.z, 14);
        const phi = facingToward(site, roadCell);
        if (isTemple) {
          const skipA = Math.floor(regionRng() * 9), skipB = Math.floor(regionRng() * 9);
          for (let i = 0; i < 9; i++) {
            if (i === skipA || i === skipB) continue; // fallen columns leave gaps
            const ang = (i / 9) * Math.PI * 2;
            const colX = site.x + Math.cos(ang) * 6.8, colZ = site.z + Math.sin(ang) * 6.8;
            if (!isLand(colX, colZ)) continue;
            addProp('ruin_column', colX, colZ, {
              scale: 0.7 + hash2(i, 3, seed ^ 0xa1) * 0.9, rotY: ang, clusterId: 'temple-site',
            });
          }
          for (let i = 0; i < 2; i++) {
            const fx = site.x + (regionRng() - 0.5) * 7, fz = site.z + (regionRng() - 0.5) * 7;
            if (isLand(fx, fz)) addProp('ruin_column_fallen', fx, fz, {
              scale: 0.9 + regionRng() * 0.7, rotY: regionRng() * Math.PI * 2, clusterId: 'temple-site',
            });
          }
          if (isLand(site.x, site.z)) addProp('ruin_slab', site.x, site.z, { scale: 1.1, rotY: phi, clusterId: 'temple-site' });
          for (let i = 0; i < 8; i++) {
            const ang = regionRng() * Math.PI * 2, dist = 3 + regionRng() * 6;
            const rx2 = site.x + Math.cos(ang) * dist, rz2 = site.z + Math.sin(ang) * dist;
            if (isLand(rx2, rz2)) addProp('rubble', rx2, rz2, { scale: 0.5 + regionRng() * 0.9, rotY: regionRng() * Math.PI * 2, clusterId: 'temple-site' });
          }
          overrideEllipse(site.x, site.z, 7.5, 7.5, 'ruins');
          clusters.push({ id: 'temple-site', rule: 'ruined-temple-circle', biome: 'ruins', x: site.x, z: site.z, radius: 8 });
          pointsOfInterest.push({ id: `temple-${rx}_${rz}`, kind: 'ruins', label: 'Ruined Temple', x: site.x, z: site.z });
        } else {
          const ux = Math.sin(phi), uz = Math.cos(phi);
          const px2 = uz, pz2 = -ux;
          for (let along = -8; along <= 8; along += 2.6) {
            for (const side of [-1, 1]) {
              if (hash2(Math.round(along * 3), side, seed ^ 0xb1) < 0.3) continue;
              const wx2 = site.x + ux * 5.5 + px2 * along;
              const wz2 = site.z + uz * 5.5 + pz2 * along;
              if (isLand(wx2, wz2)) addProp('ruin_wall', wx2, wz2, { rotY: phi + Math.PI / 2, scale: 0.9 + hash2(along, side, seed ^ 0xb2) * 0.6, clusterId: 'fortress-site' });
              const wx3 = site.x - ux * 5.5 + px2 * along;
              const wz3 = site.z - uz * 5.5 + pz2 * along;
              if (isLand(wx3, wz3)) addProp('ruin_wall', wx3, wz3, { rotY: phi + Math.PI / 2, scale: 0.9 + hash2(along, side, seed ^ 0xb3) * 0.6, clusterId: 'fortress-site' });
            }
          }
          for (let along = -5.5; along <= 5.5; along += 2.6) {
            for (const side of [-1, 1]) {
              if (hash2(Math.round(along * 3), side + 9, seed ^ 0xb4) < 0.3) continue;
              const wx2 = site.x + ux * along + px2 * side * 8;
              const wz2 = site.z + uz * along + pz2 * side * 8;
              if (isLand(wx2, wz2)) addProp('ruin_wall', wx2, wz2, { rotY: phi, scale: 0.9 + hash2(along, side, seed ^ 0xb5) * 0.6, clusterId: 'fortress-site' });
            }
          }
          for (const corner of [[-8, -5.5], [8, -5.5]]) {
            const tx = site.x + ux * corner[1] + px2 * corner[0];
            const tz = site.z + uz * corner[1] + pz2 * corner[0];
            if (isLand(tx, tz)) addProp('ruin_column', tx, tz, { scale: 1.5, rotY: phi, clusterId: 'fortress-site' });
          }
          for (let i = 0; i < 2; i++) {
            const sx2 = site.x + (regionRng() - 0.5) * 8, sz2 = site.z + (regionRng() - 0.5) * 6;
            if (isLand(sx2, sz2)) addProp('ruin_slab', sx2, sz2, { scale: 0.9 + regionRng() * 0.5, rotY: regionRng() * Math.PI * 2, clusterId: 'fortress-site' });
          }
          for (let i = 0; i < 10; i++) {
            const ang = regionRng() * Math.PI * 2, dist = 2 + regionRng() * 9;
            const rx2 = site.x + Math.cos(ang) * dist, rz2 = site.z + Math.sin(ang) * dist;
            if (isLand(rx2, rz2)) addProp('rubble', rx2, rz2, { scale: 0.5 + regionRng() * 1, rotY: regionRng() * Math.PI * 2, clusterId: 'fortress-site' });
          }
          overrideEllipse(site.x, site.z, 10.5, 8, 'ruins');
          clusters.push({ id: 'fortress-site', rule: 'ruined-fortress-walls', biome: 'ruins', x: site.x, z: site.z, radius: 10 });
          pointsOfInterest.push({ id: `fortress-${rx}_${rz}`, kind: 'ruins', label: 'Ruined Keep', x: site.x, z: site.z });
        }
      }
    }
  }

  // ── 10. biome prop clusters (scaled to each biome's presence) ────────────
  // bounds/cell lists are computed after the site overrides so cluster
  // placement sees the final biome field
  const bounds = {};
  const cellLists = {};
  for (let q = 0; q < cells.length; q++) {
    const name = kinds[cells[q]];
    (cellLists[name] ||= []).push(q);
  }
  for (const [name, list] of Object.entries(cellLists)) {
    let sx = 0, sz = 0;
    for (const q of list) { sx += q % REGION_W; sz += Math.floor(q / REGION_W); }
    const cx = sx / list.length, cz = sz / list.length;
    let maxD = 0;
    for (const q of list) maxD = Math.max(maxD, Math.hypot(q % REGION_W - cx, Math.floor(q / REGION_W) - cz));
    bounds[name] = [{
      x: cx, z: cz,
      radiusX: Math.min(60, 8 + Math.sqrt(list.length) * 1.35 + maxD * 0.18),
      radiusZ: Math.min(52, 7 + Math.sqrt(list.length) * 1.2 + maxD * 0.16),
    }];
  }
  const makeCluster = (id, biomeName, x, z, radius, count) => {
    clusters.push({ id, biome: biomeName, rule: biomeName + '-cluster', x, z, radius, count });
    for (let i = 0; i < count; i++) {
      const angle = regionRng() * Math.PI * 2;
      const distance = Math.sqrt(regionRng()) * radius;
      const px = x + Math.cos(angle) * distance;
      const pz = z + Math.sin(angle) * distance;
      const variants = NEIGHBOR_CLUSTER_VARIANTS[biomeName] || CLUSTER_VARIANTS_FALLBACK;
      const type = variants[Math.floor(regionRng() * variants.length)];
      if (px < 1.5 || pz < 1.5 || px > REGION_W - 1.5 || pz > REGION_H - 1.5) continue;
      const cell = Math.floor(pz) * REGION_W + Math.floor(px);
      if (waterCells.has(cell) || roadCells.has(cell)) continue;
      // Seasonal gating (mirrors worldGenerator.mjs): no crimson trees in
      // meadows — the kit TwistedTree reads as autumn and is reserved for its
      // own biome. Stream discipline: the general branch makes exactly one
      // regionRng() draw (as the old ternary did) and reuses it for both the
      // autumn roll and the oak/pine pick, so deterministic region layouts
      // do not shift — only the variant labels change.
      let treeVariant;
      if (biomeName === 'deadlands' || biomeName === 'volcanic') treeVariant = 'dead';
      else if (biomeName === 'swamp') treeVariant = regionRng() < 0.4 ? 'dead' : (regionRng() < 0.7 ? 'ash' : 'oak');
      else if (biomeName === 'coastal') treeVariant = regionRng() < 0.65 ? 'pine' : 'dead';
      else if (biomeName === 'snow_forest') treeVariant = regionRng() < 0.72 ? 'snowpine' : 'dead';
      else if (biomeName === 'snowfield') treeVariant = regionRng() < 0.6 ? 'snowpine' : 'dead';
      else if (biomeName === 'mountains') treeVariant = regionRng() < 0.25 ? 'birch' : 'pine';
      else if (biomeName === 'meadow') treeVariant = regionRng() < 0.65 ? 'oak' : 'ash';
      else {
        const r = regionRng();
        treeVariant = r < 0.12 ? 'autumn' : (r < 0.56 ? 'oak' : 'pine');
      }
      const scale = type === 'tree' ? 0.8 + regionRng() * 2.2
        : type === 'boulder' ? 1.25 + regionRng() * 1.75
          : 0.7 + regionRng() * 1.8;
      const shape = ['angular', 'slab', 'spire', 'ridge', 'split'][Math.floor(regionRng() * 5)];
      addProp(type, px, pz, {
        scale,
        shape: type === 'boulder' ? shape : undefined,
        variant: type === 'tree' ? treeVariant : biomeName,
        rotY: Math.floor(regionRng() * 4) * Math.PI / 2,
        clusterId: id,
      });
    }
  };
  for (const [name, list] of Object.entries(cellLists)) {
    if (name === 'graveyard' || name === 'ruins' || name === 'town') continue;
    const bound = bounds[name][0];
    const count = Math.max(26, Math.min(88, Math.round(list.length / 85)));
    const clusterCount = name === dominant ? 2 : 1;
    for (let i = 0; i < clusterCount; i++) {
      const q = list[Math.floor(regionRng() * list.length)];
      makeCluster(`${name}-patch-${rx}_${rz}_${i}`, name,
        q % REGION_W, Math.floor(q / REGION_W),
        Math.max(bound.radiusX, bound.radiusZ) * 0.55, count);
    }
  }

  // rare glacial erratics: round boulders dot open meadow at minimal density
  let erraticCount = 0;
  for (let z = 2; z < REGION_H - 2 && erraticCount < 4; z += 3) {
    for (let x = 2; x < REGION_W - 2 && erraticCount < 4; x += 3) {
      const cell = z * REGION_W + x;
      if (kinds[cells[cell]] !== 'meadow' || waterCells.has(cell) || roadCells.has(cell)) continue;
      if (hash2(originX + x, originZ + z, 9613) <= 0.9925) continue;
      const px = x + 0.5 + (hash2(x, z, 9617) - 0.5) * 1.6;
      const pz = z + 0.5 + (hash2(z, x, 9619) - 0.5) * 1.6;
      const pc = Math.floor(pz) * REGION_W + Math.floor(px);
      if (waterCells.has(pc) || roadCells.has(pc)) continue;
      addProp('boulder', px, pz, {
        scale: 1.1 + hash2(x, z, 9623) * 0.9, shape: 'round',
        rotY: hash2(x, z, 9629) * Math.PI * 2, clusterId: 'meadow-erratic',
      });
      erraticCount++;
    }
  }

  // POIs: world-road endpoints in this region
  for (const poi of ctx.roads.pois) {
    const lx = poi.x - originX, lz = poi.z - originZ;
    if (lx < 8 || lz < 8 || lx >= REGION_W - 8 || lz >= REGION_H - 8) continue;
    const kind = poi.anchorIndex % 2 === 0 ? 'ruins' : 'cave';
    for (let i = 0; i < 10; i++) {
      const px = lx + (regionRng() - 0.5) * 6;
      const pz = lz + (regionRng() - 0.5) * 6;
      const cell = Math.floor(pz) * REGION_W + Math.floor(px);
      if (waterCells.has(cell) || roadCells.has(cell)) continue;
      if (kind === 'cave') {
        // a waypoint hosts ONE cave mouth — scattering ten of them read as
        // random dungeon holes dumped into nature; the rest is rubble/rock
        addProp(i === 0 ? 'cave_entrance' : (i % 3 ? 'rubble' : 'rock'), px, pz, {
          scale: 0.8 + regionRng() * 1.1, rotY: regionRng() * Math.PI * 2, clusterId: `poi-${poi.anchorIndex}`,
        });
      } else {
        addProp(i % 3 ? 'rubble' : 'ruin_pillar', px, pz, {
          scale: 0.8 + regionRng() * 1.1, rotY: regionRng() * Math.PI * 2, clusterId: `poi-${poi.anchorIndex}`,
        });
      }
    }
    clusters.push({ id: `poi-${poi.anchorIndex}`, rule: 'roadside-waypoint', biome: kind, x: lx, z: lz, radius: 6 });
    pointsOfInterest.push({
      id: `waypoint-${poi.anchorIndex}-${rx}_${rz}`, kind,
      label: kind === 'ruins' ? 'Roadside Ruins' : 'Waypoint Cave', x: lx, z: lz,
    });
  }

  // standing stones in quiet grassland
  if (!graveyardHere && regionRng() < 0.35 && lushShare > 0.5) {
    const site = findSite(regionRng, 6, townBuilt ? { x: townSite.x, z: townSite.z, r: 26 } : null);
    if (site) {
      for (let i = 0; i < 6; i++) {
        addProp('standing_stone', site.x + (regionRng() - 0.5) * 5, site.z + (regionRng() - 0.5) * 5, {
          scale: 0.9 + regionRng() * 0.8, rotY: regionRng() * Math.PI * 2, clusterId: `stones-${rx}_${rz}`,
        });
      }
      clusters.push({ id: `stones-${rx}_${rz}`, rule: 'standing-stones', biome: dominant, x: site.x, z: site.z, radius: 5 });
      pointsOfInterest.push({ id: `stones-${rx}_${rz}`, kind: 'ruins', label: 'Standing Stones', x: site.x, z: site.z });
    }
  }

  // ── 9d. Rich procedural POI expansion ────────────────────────────────────
  // Distinctive landmarks with realistic world-placement gating:
  // Mountain Pass, Abandoned Mine, Steaming Springs, Hermit's Sanctuary,
  // Megalith Henge, Wrecked Caravan, Ancient Barrow Mound, Sunken Shrine.
  const poiRng = mulberry32((hash2(rx * 31 + 7, rz * 29 + 13, seed ^ 0x901e) * 0x7fffffff) | 0);
  const poiRoll = hash2(rx * 23 + 1, rz * 41 + 5, seed ^ 0x81fa);
  if (!graveyardHere && !townBuilt && pointsOfInterest.length < 2 && poiRoll < 0.42) {
    if (dominant === 'mountains' && poiRoll < 0.22) {
      // 1. Mountain Pass: high notch with ruined watchtower & fortified gate
      const site = findSite(poiRng, 8);
      if (site) {
        addProp('ruin_wall', site.x - 3.5, site.z, { scale: 1.2, rotY: 0, clusterId: 'mountain-pass' });
        addProp('ruin_wall', site.x + 3.5, site.z, { scale: 1.2, rotY: 0, clusterId: 'mountain-pass' });
        addProp('ruin_pillar', site.x, site.z - 3.8, { scale: 1.5, clusterId: 'mountain-pass' });
        addProp('street_lantern', site.x, site.z + 2, { clusterId: 'mountain-pass' });
        for (let k = 0; k < 5; k++) {
          addProp('rubble', site.x + (poiRng() - 0.5) * 6, site.z + (poiRng() - 0.5) * 6, { scale: 0.8 + poiRng() * 0.6, clusterId: 'mountain-pass' });
        }
        clusters.push({ id: 'mountain-pass', rule: 'mountain-pass', biome: 'mountains', x: site.x, z: site.z, radius: 8 });
        pointsOfInterest.push({ id: `pass-${rx}_${rz}`, kind: 'pass', label: 'High Mountain Pass', x: site.x, z: site.z });
      }
    } else if ((dominant === 'mountains' || dominant === 'volcanic') && poiRoll < 0.38) {
      // 2. Abandoned Mine: timbered portal into the hillside with ore rubble
      const site = findSite(poiRng, 7);
      if (site) {
        addProp('cave_entrance', site.x, site.z, { scale: 1.3, rotY: poiRng() * Math.PI * 2, clusterId: 'mine-site' });
        addProp('ruin_pillar', site.x + 3.2, site.z + 1, { scale: 1.1, clusterId: 'mine-site' });
        addProp('street_lantern', site.x - 2.8, site.z + 1.2, { clusterId: 'mine-site' });
        for (let k = 0; k < 6; k++) {
          addProp('rubble', site.x + (poiRng() - 0.5) * 7, site.z + (poiRng() - 0.5) * 7, { scale: 0.9 + poiRng() * 0.7, clusterId: 'mine-site' });
        }
        clusters.push({ id: 'mine-site', rule: 'abandoned-mine', biome: dominant, x: site.x, z: site.z, radius: 8 });
        pointsOfInterest.push({ id: `mine-${rx}_${rz}`, kind: 'mine', label: 'Abandoned Mine', x: site.x, z: site.z });
      }
    } else if (dominant === 'volcanic' || (dominant === 'snowfield' && poiRoll < 0.28)) {
      // 3. Hot Springs: mineral spires, basalt columns, round steam rocks
      const site = findSite(poiRng, 6);
      if (site) {
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2;
          addProp('standing_stone', site.x + Math.cos(ang) * 4.2, site.z + Math.sin(ang) * 4.2, { scale: 1.1, clusterId: 'hot-spring' });
        }
        for (let k = 0; k < 4; k++) {
          addProp('boulder', site.x + (poiRng() - 0.5) * 5, site.z + (poiRng() - 0.5) * 5, { scale: 1.2, shape: 'round', clusterId: 'hot-spring' });
        }
        clusters.push({ id: 'hot-spring', rule: 'hot-springs', biome: dominant, x: site.x, z: site.z, radius: 7 });
        pointsOfInterest.push({ id: `spring-${rx}_${rz}`, kind: 'spring', label: 'Steaming Springs', x: site.x, z: site.z });
      }
    } else if ((dominant === 'forest' || dominant === 'swamp' || dominant === 'meadow') && poiRoll < 0.22) {
      // 4. Hermit's Hut: isolated dwelling, garden fence, well
      const site = findSite(poiRng, 9);
      if (site && !nearRoad(site.x, site.z, 16)) {
        addProp('building', site.x, site.z, { width: 3, depth: 3, rotY: poiRng() * Math.PI * 2, clusterId: 'hermit-hut' });
        addProp('well', site.x + 3.2, site.z + 2.2, { clusterId: 'hermit-hut' });
        addProp('grave_fence', site.x - 3.8, site.z, { rotY: 0, clusterId: 'hermit-hut' });
        addProp('dead_brush', site.x + 2, site.z - 2.8, { scale: 1.1, clusterId: 'hermit-hut' });
        clusters.push({ id: 'hermit-hut', rule: 'hermit-hut', biome: dominant, x: site.x, z: site.z, radius: 9 });
        pointsOfInterest.push({ id: `hermit-${rx}_${rz}`, kind: 'dwelling', label: "Hermit's Sanctuary", x: site.x, z: site.z });
      }
    } else if (dominant === 'deadlands' || (dominant === 'meadow' && poiRoll > 0.32)) {
      // 5. Ancient Barrow Mound: great earth tumulus with standing monoliths
      const site = findSite(poiRng, 8);
      if (site) {
        addProp('grave_mound', site.x, site.z, { scale: 2.2, clusterId: 'ancient-barrow' });
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2;
          addProp('standing_stone', site.x + Math.cos(ang) * 5.2, site.z + Math.sin(ang) * 5.2, { scale: 1.25, clusterId: 'ancient-barrow' });
        }
        clusters.push({ id: 'ancient-barrow', rule: 'ancient-barrow', biome: dominant, x: site.x, z: site.z, radius: 8 });
        pointsOfInterest.push({ id: `barrow-${rx}_${rz}`, kind: 'barrow', label: 'Ancient Barrow Mound', x: site.x, z: site.z });
      }
    } else if (nearRoad(REGION_W / 2, REGION_H / 2, 28) && poiRoll < 0.35) {
      // 6. Wrecked Caravan: roadside debris, broken axles, shattered crates
      const roadSpot = nearRoad(REGION_W / 2 + (poiRng() - 0.5) * 32, REGION_H / 2 + (poiRng() - 0.5) * 32, 10);
      if (roadSpot && isLand(roadSpot.x + 2, roadSpot.z + 2)) {
        const sx = roadSpot.x + 2, sz = roadSpot.z + 2;
        addProp('ruin_column_fallen', sx, sz, { scale: 1.2, rotY: poiRng() * Math.PI, clusterId: 'wrecked-caravan' });
        addProp('rubble', sx + 2.2, sz - 1.5, { scale: 0.9, clusterId: 'wrecked-caravan' });
        addProp('rubble', sx - 1.8, sz + 2.1, { scale: 0.8, clusterId: 'wrecked-caravan' });
        addProp('dead_brush', sx + 1.5, sz + 1.8, { scale: 0.8, clusterId: 'wrecked-caravan' });
        clusters.push({ id: 'wrecked-caravan', rule: 'wrecked-caravan', biome: dominant, x: sx, z: sz, radius: 6 });
        pointsOfInterest.push({ id: `caravan-${rx}_${rz}`, kind: 'ruins', label: 'Wrecked Caravan', x: sx, z: sz });
      }
    } else if (dominant === 'swamp' || dominant === 'coastal') {
      // 7. Sunken Shrine: half-submerged megalith slab with mossy columns
      const site = findSite(poiRng, 7);
      if (site) {
        addProp('ruin_slab', site.x, site.z, { scale: 1.2, rotY: poiRng() * Math.PI * 2, clusterId: 'sunken-shrine' });
        addProp('ruin_column', site.x - 3, site.z + 1.5, { scale: 1.1, clusterId: 'sunken-shrine' });
        addProp('ruin_column_fallen', site.x + 2.5, site.z - 2, { scale: 1.0, clusterId: 'sunken-shrine' });
        clusters.push({ id: 'sunken-shrine', rule: 'sunken-shrine', biome: dominant, x: site.x, z: site.z, radius: 7 });
        pointsOfInterest.push({ id: `shrine-${rx}_${rz}`, kind: 'ruins', label: 'Sunken Shrine', x: site.x, z: site.z });
      }
    } else {
      // 8. Ancient Megalith Ring: concentric stone circle
      const site = findSite(poiRng, 7);
      if (site) {
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          addProp('standing_stone', site.x + Math.cos(ang) * 5.6, site.z + Math.sin(ang) * 5.6, { scale: 1.15, clusterId: 'megalith-ring' });
        }
        addProp('ruin_slab', site.x, site.z, { scale: 1.1, clusterId: 'megalith-ring' });
        clusters.push({ id: 'megalith-ring', rule: 'megalith-ring', biome: dominant, x: site.x, z: site.z, radius: 8 });
        pointsOfInterest.push({ id: `megalith-${rx}_${rz}`, kind: 'ruins', label: 'Ancient Megalith Circle', x: site.x, z: site.z });
      }
    }
  }

  // river stones along banks (same idea as home)
  for (const river of ctx.rivers) {
    for (let i = 0; i < river.samples.length; i += 3) {
      const s = river.samples[i];
      const lx = s.x - originX, lz = s.z - originZ;
      if (lx < 3 || lz < 3 || lx > REGION_W - 3 || lz > REGION_H - 3) continue;
      for (const side of [-1, 1]) {
        if (hash2(i, side, 311) < 0.38) {
          const dist = (s.w || 1.9) + 0.4 + hash2(i, side, 419) * 1.2;
          const px = lx + Math.cos(side * 1.57) * dist;
          const pz = lz + Math.sin(side * 1.57) * dist;
          const cell = Math.floor(pz) * REGION_W + Math.floor(px);
          if (!waterCells.has(cell) && !roadCells.has(cell)) {
            addProp('rock', px, pz, {
              scale: 0.45 + hash2(i, side, 521) * 0.5, shape: 'slab',
              variant: 'river_stone', clusterId: 'river-bank',
            });
          }
        }
      }
    }
  }
  props.push(...bridges);

  // ── 10b. half-tile transitions for water and road edges ──────────────────
  // Diagonal corner triangles: when a cell sits next to water on both of two
  // adjacent sides (NW+W, NE+E, SW+W, SE+E), emit a triangular half-tile so
  // the visual surface steps diagonally instead of as a square corner. Same
  // rule the home region uses (worldGenerator.mjs) — restored here because
  // neighbor regions were returning halfTiles: [] and their shorelines and
  // road corners read blocky next to the home region's.
  const halfTiles = [];
  for (let z = 2; z < REGION_H - 2; z++) {
    for (let x = 2; x < REGION_W - 2; x++) {
      const cell = z * REGION_W + x;
      if (waterCells.has(cell) || roadCells.has(cell)) continue;
      const isWaterNeighbor = (k) => waterCells.has(k);
      const nW = isWaterNeighbor((z - 1) * REGION_W + x);
      const sW = isWaterNeighbor((z + 1) * REGION_W + x);
      const wW = isWaterNeighbor(z * REGION_W + x - 1);
      const eW = isWaterNeighbor(z * REGION_W + x + 1);
      if (nW && wW) halfTiles.push({ x, z, type: 'water', orientation: 'nw' });
      else if (nW && eW) halfTiles.push({ x, z, type: 'water', orientation: 'ne' });
      else if (sW && wW) halfTiles.push({ x, z, type: 'water', orientation: 'sw' });
      else if (sW && eW) halfTiles.push({ x, z, type: 'water', orientation: 'se' });
    }
  }
  for (let z = 2; z < REGION_H - 2; z++) {
    for (let x = 2; x < REGION_W - 2; x++) {
      const cell = z * REGION_W + x;
      if (roadCells.has(cell) || waterCells.has(cell)) continue;
      const nR = roadCells.has((z - 1) * REGION_W + x);
      const sR = roadCells.has((z + 1) * REGION_W + x);
      const wR = roadCells.has(z * REGION_W + x - 1);
      const eR = roadCells.has(z * REGION_W + x + 1);
      if (nR && wR) halfTiles.push({ x, z, type: 'road', orientation: 'nw' });
      else if (nR && eR) halfTiles.push({ x, z, type: 'road', orientation: 'ne' });
      else if (sR && wR) halfTiles.push({ x, z, type: 'road', orientation: 'sw' });
      else if (sR && eR) halfTiles.push({ x, z, type: 'road', orientation: 'se' });
    }
  }

  // ── 11. spawn: snapped open cell near the region center ──────────────────
  let spawn = null;
  for (let r = 0; r < 24 && !spawn; r++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const cx = Math.floor(REGION_W / 2 + (regionRng() - 0.5) * r * 2);
      const cz = Math.floor(REGION_H / 2 + (regionRng() - 0.5) * r * 2);
      const cell = cz * REGION_W + cx;
      if (!waterCells.has(cell) && !roadCells.has(cell)) { spawn = [cx + 0.5, cz + 0.5]; break; }
    }
  }
  if (!spawn) spawn = [REGION_W / 2, REGION_H / 2];

  return {
    id: regionId(rx, rz),
    name: nameForRegion(rx, rz, seed),
    seed,
    generated: true,
    size: { w: REGION_W, h: REGION_H },
    theme: 'wilderness',
    tileSet: 'wilderness',
    floor: 'ash_grass',
    cells: {
      wall: [],
      water: [...waterCells].sort((a, b) => a - b).map((cell) => [cell % REGION_W, Math.floor(cell / REGION_W)]),
      waterSurfaceFt: waterSurface,
      road: [...roadCells].sort((a, b) => a - b).map((cell) => [cell % REGION_W, Math.floor(cell / REGION_W)]),
      halfTiles,
    },
    terrain: { width: REGION_W + 1, height: REGION_H + 1, heightFt: heights },
    biomes: { kinds, cells },
    biomeBounds: bounds,
    clusters,
    props,
    walls: [],
    lights: pointsOfInterest.slice(0, 2).map((poi, i) => ({
      x: poi.x + 0.5, z: poi.z + 0.5, radiusFt: 24, color: i === 0 ? '#9a7951' : '#d7aa65', flicker: true,
    })),
    spawns: { party: [spawn], monsters: [] },
    exits: [],
    pointsOfInterest,
    metadata: {
      townCenter: townBuilt ? { x: townSite.x, z: townSite.z } : { x: -999, z: -999 },
      town: townRecord,
      water: {
        lakes: [],
        ponds,
        river: [],
        grandLakes: grandLakes.filter((gl) => Math.hypot(gl.x - (originX + REGION_W / 2), gl.z - (originZ + REGION_H / 2)) < gl.rx * 1.5).map((gl) => ({ id: gl.id, name: gl.name })),
      },
      roads: [],
    },
  };
}

const NAME_A = ['Ashen', 'Pale', 'Grim', 'Hollow', 'Winter', 'Ember', 'Thorn', 'Mist', 'Grey', 'Briar'];
const NAME_B = ['Reach', 'March', 'Fells', 'Weald', 'Moors', 'Barrens', 'Downs', 'Vale', 'Waste', 'Fen'];
export function nameForRegion(rx, rz, seed = WORLD_SEED) {
  if (rx === 0 && rz === 0) return 'The Ashen Reach';
  const a = NAME_A[Math.floor(hash2(rx, rz, seed) * NAME_A.length)];
  const b = NAME_B[Math.floor(hash2(rz, rx, seed + 7) * NAME_B.length)];
  return `The ${a} ${b}`;
}

// ── stitching (all regions, home included) ─────────────────────────────────
// 1. strip the artificial boundary ring so players can walk between regions
// 2. inject river water cells in the border strip so rivers flow across seams
// 3. add world road cells inside the window (home keeps its raw roads too)
// 4. re-apply the shoreline surface clamp on injected water
export function stitchRegion(def, rx, rz, ctx) {
  const w = def.size.w, h = def.size.h;
  const stitched = structuredClone(def);
  const key = (x, z) => z * w + x;
  const onRing = (x, z) => x === 0 || z === 0 || x === w - 1 || z === h - 1;

  stitched.cells.wall = (stitched.cells.wall || []).filter(([x, z]) => !onRing(x, z));

  const originX = rx * REGION_W, originZ = rz * REGION_H;
  const surface = stitched.cells.waterSurfaceFt || new Array(w * h).fill(null);
  const water = new Set((stitched.cells.water || []).map(([x, z]) => key(x, z)));
  const heights = stitched.terrain.heightFt;

  for (const river of ctx.rivers) {
    for (const s of river.samples) {
      const lx = s.x - originX, lz = s.z - originZ;
      const nearRing = lx >= -4.2 && lx <= w + 3.2 && lz >= -4.2 && lz <= h + 3.2 &&
        (lx < 4.2 || lz < 4.2 || lx > w - 5.2 || lz > h - 5.2);
      if (!nearRing) continue;
      const centerX = Math.round(lx), centerZ = Math.round(lz);
      const halfW = (s.w || 1.9) + 0.1;
      const maxR2 = halfW * halfW;
      for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dz * dz > maxR2) continue;
        const x = centerX + dx, z = centerZ + dz;
        if (x < 0 || z < 0 || x >= w || z >= h) continue;
        const cell = key(x, z);
        const existing = surface[cell];
        if (existing === null || existing === undefined || s.level < existing) {
          water.add(cell);
          surface[cell] = s.level;
        }
      }
    }
  }

  // world road cells inside the window (unique, keep sorted for determinism)
  const road = new Set((stitched.cells.road || []).map(([x, z]) => key(x, z)));
  for (const segment of ctx.roads.segments) {
    for (const p of segment.cells) {
      const lx = Math.round(p.x - originX), lz = Math.round(p.z - originZ);
      if (lx < 0 || lz < 0 || lx >= w || lz >= h) continue;
      const cell = key(lx, lz);
      if (!water.has(cell)) road.add(cell);
    }
  }

  // shoreline clamp (same constants as the generators). Cross-seam neighbors
  // resolve through the world water field so border water is not trenched.
  for (const cell of water) {
    const x = cell % w, z = Math.floor(cell / w);
    if (surface[cell] === null || surface[cell] === undefined) continue;
    const ground = (
      heights[z * (w + 1) + x] + heights[z * (w + 1) + x + 1] +
      heights[(z + 1) * (w + 1) + x] + heights[(z + 1) * (w + 1) + x + 1]
    ) / 4;
    if (surface[cell] > ground + 1.95) surface[cell] = ground + 1.95;
    const isWater = (nx, nz) => {
      if (nx >= 0 && nx < w && nz >= 0 && nz < h) return water.has(key(nx, nz));
      return worldWaterCellAt(ctx, originX + nx, originZ + nz) !== null;
    };
    const shoreline = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .some(([dx, dz]) => !isWater(x + dx, z + dz));
    if (shoreline) surface[cell] = Math.min(surface[cell], ground - 0.18);
  }

  // world water halo: cells up to 2 outside the region that hold water on the
  // far side of a seam. The client blends these into shore foam, bank tinting
  // and seam-vertex surface averaging, so a lake reads as one body instead of
  // two halves glued at the border. Levels mirror the adjacent in-region cell
  // (the bed is continuous across the seam), falling back to the raw level.
  const waterHalo = [];
  for (let z = -2; z < h + 2; z++) {
    for (let x = -2; x < w + 2; x++) {
      if (x >= 0 && x < w && z >= 0 && z < h) continue;
      const lvl = worldWaterCellAt(ctx, originX + x, originZ + z);
      if (lvl === null) continue;
      const mx = Math.max(0, Math.min(w - 1, x)), mz = Math.max(0, Math.min(h - 1, z));
      const mLevel = water.has(key(mx, mz)) ? surface[key(mx, mz)] : null;
      waterHalo.push([x, z, mLevel != null ? mLevel : lvl]);
    }
  }
  stitched.cells.waterHalo = waterHalo;

  stitched.cells.water = [...water].sort((a, b) => a - b).map((cell) => [cell % w, Math.floor(cell / w)]);
  stitched.cells.waterSurfaceFt = surface;
  stitched.cells.road = [...road].sort((a, b) => a - b).map((cell) => [cell % w, Math.floor(cell / w)]);
  stitched.region = { rx, rz };
  stitched.worldOriginFt = regionOriginFt(rx, rz);
  if (rx === 0 && rz === 0) {
    // home keeps its historical id/name; the plate can show the same strings
    stitched.id = 'ashen_reach';
    stitched.name = 'The Ashen Reach';
  }
  return stitched;
}

/** Public entry: deterministic MapDef for any region on the grid. */
export function generateRegion(rx, rz, { seed = WORLD_SEED, homeDef = null, ctx = null } = {}) {
  if (!Number.isInteger(rx) || !Number.isInteger(rz)) {
    throw new TypeError('region coordinates must be integers');
  }
  const worldCtx = ctx || getWorldContext({ seed, homeDef });
  const home = worldCtx.homeDef || homeDef;
  const isHome = rx === 0 && rz === 0;
  if (isHome && !home) throw new TypeError('home region requires the generated homeDef');
  const raw = isHome ? home : generateNeighborRegion(rx, rz, worldCtx);
  return stitchRegion(raw, rx, rz, worldCtx);
}

/** Max adjacent-vertex step across the shared border of two adjacent regions
 *  (seam-continuity evidence for tests). */
export function seamMaxStep(a, b) {
  // a and b are stitched defs; figure out their relative border
  const ra = a.region, rb = b.region;
  const w = a.size.w, h = a.size.h;
  let maxStep = 0;
  const check = (va, vb) => { maxStep = Math.max(maxStep, Math.abs(va - vb)); };
  if (rb.rx === ra.rx + 1 && rb.rz === ra.rz) {
    // east border of a == west border of b: vertex column x = w (a) == 0 (b)
    for (let z = 0; z <= h; z++) {
      check(a.terrain.heightFt[z * (w + 1) + w], b.terrain.heightFt[z * (w + 1)]);
    }
  } else if (rb.rx === ra.rx - 1 && rb.rz === ra.rz) {
    for (let z = 0; z <= h; z++) {
      check(a.terrain.heightFt[z * (w + 1)], b.terrain.heightFt[z * (w + 1) + w]);
    }
  } else if (rb.rz === ra.rz + 1 && rb.rx === ra.rx) {
    for (let x = 0; x <= w; x++) {
      check(a.terrain.heightFt[h * (w + 1) + x], b.terrain.heightFt[x]);
    }
  } else if (rb.rz === ra.rz - 1 && rb.rx === ra.rx) {
    for (let x = 0; x <= w; x++) {
      check(a.terrain.heightFt[x], b.terrain.heightFt[h * (w + 1) + x]);
    }
  } else {
    throw new TypeError('regions are not adjacent');
  }
  return maxStep;
}