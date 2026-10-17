// ASHENREACH — server/src/rules/Light.js
// P3.13 — one authoritative model of "how much light is here" and "how far can
// this creature see". Pure functions, zero deps, fully unit-testable.
//
// Design (agreed with the user):
//   * Dungeons are dark. Night is dark. Light sources (map braziers/lanterns,
//     equipped torches) carve lit zones out of the dark.
//   * lightLevelAt(x, z) → 0..1 brightness scalar at a world-feet position.
//   * effectiveVisionFt(senses, lit) — the flip-flop the user asked for:
//     normal vision scales UP with light, darkvision scales DOWN; blindsight /
//     truesight ignore light entirely. Everyone keeps a tiny "feel-around"
//     floor so nothing is ever literally blind.
//   * One model, three consumers: checkAmbush sight, ambient-AI sight, and
//     tokensForUser (which monster tokens the client receives at all).
//
// NOTE on "player vision": presentation is deliberately NOT limited by these
// numbers (no render culling / sight sphere / DOF). The client renders real
// darkness — global lights drop to near-zero in dungeons and at night — so
// unlit things are invisible because no light reaches them, not because the
// server hid them. Mechanical ranges only govern AI perception + token reveal.

export const DEFAULT_VISION_FT = 60;   // functional sight in bright light
export const DEFAULT_DARKVISION_FT = 45; // creatures with NO senses object (legacy M0
                                         // monster table, test tokens) keep their historic
                                         // 45ft sight radius — bit-for-bit old behavior
export const VISION_FLOOR_FT = 10;     // even sightless eyes make out a figure this close
export const DUNGEON_BASE_LIGHT = 0.03;
export const NIGHT_BASE_LIGHT = 0.06;  // moonlight — silhouettes, not reading
export const TORCH_REACH_FT = 40;      // RAW torch: bright 20 + dim 20

// SRD gear that feeds the player-light system → effective lit radius (feet).
const LIGHT_GEAR = [
  { re: /^torch$/i, radiusFt: TORCH_REACH_FT },
  { re: /^lamp$/i, radiusFt: 45 },                 // RAW: bright 15 + dim 30
  { re: /^lantern/i, radiusFt: 60 },               // hooded: 30+30; bullseye approximated as radius
];

/** Radius (ft) of a light-source item name, or 0 when it isn't one. */
export function lightRadiusFt(name) {
  const n = String(name || '').trim();
  for (const g of LIGHT_GEAR) if (g.re.test(n)) return g.radiusFt;
  return 0;
}

export function isLightSourceName(name) {
  return lightRadiusFt(name) > 0;
}

/** Robust parse of senses values that may arrive as 60, "60", or "60 ft.". */
export function parseFt(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const m = /(-?\d+(?:\.\d+)?)/.exec(String(v ?? ''));
  return m ? Number(m[1]) : 0;
}

/**
 * Daylight portion of the day clock (minutes 0..1440). 1 = full day,
 * 0 = night, with 90-minute dawn (05:30→07:00) and dusk (18:30→20:00) ramps.
 */
export function daylightFactor(timeMin) {
  const t = ((Number(timeMin) || 0) % 1440 + 1440) % 1440;
  const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  if (t < 5 * 60 + 30) return 0;                       // deep night
  if (t < 7 * 60) return ramp(t, 5 * 60 + 30, 7 * 60); // dawn
  if (t < 18 * 60 + 30) return 1;                      // full day
  if (t < 20 * 60) return 1 - ramp(t, 18 * 60 + 30, 20 * 60); // dusk
  return 0;                                            // night
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * Brightness scalar (0..1) at a world-feet position.
 *
 * @param {object} p
 * @param {boolean} p.isDungeon      true when the party is not in the streamed overworld
 * @param {number} p.x               world feet
 * @param {number} p.z               world feet
 * @param {number} p.timeMin         day clock minutes (dayNight.time)
 * @param {Array}  [p.mapLights]     map def lights [{x, z, radiusFt, color, flicker}]
 * @param {Array}  [p.torchPoints]   bearer lights [{x, z, radiusFt}]
 */
export function lightLevelAt({ isDungeon, x, z, timeMin, mapLights, torchPoints }) {
  const base = isDungeon ? DUNGEON_BASE_LIGHT : Math.max(NIGHT_BASE_LIGHT, daylightFactor(timeMin));
  let lit = base;
  const lift = (lx, lz, radiusFt, strength) => {
    if (!(radiusFt > 0)) return;
    const d = Math.hypot((Number(lx) || 0) - x, (Number(lz) || 0) - z);
    if (d >= radiusFt) return;
    lit = Math.max(lit, clamp01(1 - d / radiusFt) * strength);
  };
  for (const l of Array.isArray(mapLights) ? mapLights : []) {
    lift(l?.x, l?.z, parseFt(l?.radiusFt), 0.9);       // braziers/lanterns never fully "daylight"
  }
  for (const l of Array.isArray(torchPoints) ? torchPoints : []) {
    lift(l?.x, l?.z, parseFt(l?.radiusFt), 0.95);      // a held flame reads as bright light
  }
  return clamp01(lit);
}

/**
 * Effective sight range (ft) for a creature with the given SRD senses object
 * under a light level `lit` (0..1) measured AT THE TARGET. Light only ever
 * helps: a lit target is visible out to normal-vision range scaled by how
 * much light is on it; darkvision (and blindsight/truesight) carry in the
 * dark at full rated range; everything keeps a small close-quarters floor.
 * There is deliberately NO mid-light dip — standing next to a brazier can
 * never halve a hunter's reach (that bug shipped and was caught by tests).
 *
 * @param {object|null} senses  {darkvision?, blindsight?, truesight?, passive_perception?}
 * @param {number} lit          light level at the TARGET's position (how visible it is)
 * @param {number} [normalVisionFt]
 */
export function effectiveVisionFt(senses, lit, normalVisionFt = DEFAULT_VISION_FT) {
  const l = clamp01(Number(lit) || 0);
  const s = senses && typeof senses === 'object' ? senses : null;
  // no senses data → standard dark-adapted dungeon denizen (keeps legacy
  // M0/monster-table tokens at their old 45ft reach)
  const dv = s ? parseFt(s.darkvision) : DEFAULT_DARKVISION_FT;
  const bs = s ? parseFt(s.blindsight) : 0;
  const ts = s ? parseFt(s.truesight) : 0;
  return Math.max(normalVisionFt * l, dv, bs, ts, VISION_FLOOR_FT);
}

/** Light points cast by living, lit players (fed in as torchPoints). */
export function torchPointsFromTokens(tokens) {
  const out = [];
  for (const t of Array.isArray(tokens) ? tokens : []) {
    if (!t || t.kind !== 'player' || t.hp <= 0) continue;
    const radius = lightRadiusFt(t.sheet?.lightSource);
    if (radius > 0) out.push({ x: Number(t.x) || 0, z: Number(t.z) || 0, radiusFt: radius });
  }
  return out;
}
