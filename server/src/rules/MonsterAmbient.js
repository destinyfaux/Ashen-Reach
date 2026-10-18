// ASHENREACH — server/src/rules/MonsterAmbient.js
// P3.10 out-of-combat monster behavior. Plain ESM, zero deps, never throws.
//
// A small deterministic state machine driven by the caller's tick (server runs
// it ~every AMBIENT_TICK_MS while no initiative is active):
//
//   idle ──(timer)──> wander ──(arrive)──> idle
//     │                  │
//     │ (player seen)    │ (player seen)
//     ▼                  ▼
//   chase ──(within ENGAGE_FT)──> caller springs combat via checkAmbush()
//     │ │
//     │ └─(lost sight > LOST_SIGHT_MS)──> investigate lastKnown
//     │                                     │ (arrive / timeout)
//     └─(too far from home > LEASH_FT)──────▼
//                   return ──(home)──> idle
//
// Perception rules (sight distance + wall LOS + hearing) are INJECTED by the
// caller so this module stays pure and testable — GameManager/CombatDriver
// reuse the exact encounter-awareness rules (checkAmbush's lineBlocked /
// canHear), per the task's "reuse the encounter perception" requirement.
//
// Public API:
//   thinkAmbient(monster, ctx) -> { move?: {x, z, rotY}, engage?: playerId, memory }
//     monster : token ({id, x, z, speedFt, ...})
//     ctx     : {
//       now      : number (ms)
//       rng      : () => number
//       players  : [{ id, x, z, down }]            // living party tokens
//       visible  : (player) => bool                // sight + LOS, caller-owned
//       blocked  : (x, z) => bool                  // world-feet solid test
//       path     : (fx, fz, tx, tz) => [{x,z}]|null // Nav-backed route
//       memory   : previous memory object or null
//     }
//   AMBIENT — tuning constants (exported for tests + GameManager clamp)

export const AMBIENT = {
  TICK_MS: 1100,
  AGGRO_FT: 60,          // pre-filter cap on sight checks; the real reach is
                         // light-aware (rules/Light.js effectiveVisionFt via
                         // ctx.visible) — 60ft covers full-daylight normal vision
  ENGAGE_FT: 12,         // close enough → spring combat
  LEASH_FT: 80,          // hard tether from home; break off beyond this
  RETURN_AT_FT: 90,      // hysteresis: start returning past this
  WANDER_R_FT: 40,       // wander target radius around home
  IDLE_MIN_MS: 1800,
  IDLE_MAX_MS: 6500,
  LOST_SIGHT_MS: 6000,   // chase blind for this long, then investigate
  STEP_BUDGET_FT: 5,     // world-feet per tick (≈ speedFt / (speedFt/5))
  ARRIVE_FT: 3.2,        // waypoint arrival tolerance
  INVESTIGATE_MS: 14000, // give up investigating after this long
};

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

const clampMem = (mem, monster) => {
  if (!mem || typeof mem !== 'object') mem = {};
  if (!Number.isFinite(mem.homeX) || !Number.isFinite(mem.homeZ)) {
    mem.homeX = Number(monster.x) || 0;
    mem.homeZ = Number(monster.z) || 0;
  }
  mem.mode = mem.mode || 'idle';
  return mem;
};

/** Face along a movement vector (three.js yaw: forward +Z, so atan2(dx,dz)). */
const face = (dx, dz) => (Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4) ? undefined : Math.atan2(dx, dz);

/**
 * Advance one ambient tick for one monster. Returns a NEW memory object
 * (caller persists); movement/engage intents on the result.
 */
export function thinkAmbient(monster, ctx) {
  const cfg = AMBIENT;
  const rng = ctx.rng || Math.random;
  const mem = clampMem(ctx.memory ? JSON.parse(JSON.stringify(ctx.memory)) : null, monster);
  const out = { memory: mem };
  const x = Number(monster.x) || 0, z = Number(monster.z) || 0;
  const speed = Number(monster.speedFt) || 30;
  // real-time pacing: speedFt per 6s round scaled to the tick interval
  // (30ft/round creature ≈ 5.5ft per 1.1s tick)
  const budget = Math.max(2, Math.min(12, speed * cfg.TICK_MS / 6000));
  const homeD = dist(x, z, mem.homeX, mem.homeZ);

  const living = (ctx.players || []).filter(p => p && !p.down);
  const seen = living.filter(p =>
    dist(x, z, p.x, p.z) <= cfg.AGGRO_FT && (ctx.visible ? ctx.visible(p) : true));

  // ── perception overrides whatever we were doing ──────────────────────────
  if (seen.length) {
    // nearest seen player
    seen.sort((a, b) => dist(x, z, a.x, a.z) - dist(x, z, b.x, b.z));
    const target = seen[0];
    mem.mode = 'chase';
    mem.targetId = target.id;
    mem.lastX = target.x; mem.lastZ = target.z;
    mem.lastSeenAt = ctx.now;
  } else if (mem.mode === 'chase' && ctx.now - (mem.lastSeenAt || 0) > cfg.LOST_SIGHT_MS) {
    mem.mode = 'investigate';
    mem.targetX = mem.lastX; mem.targetZ = mem.lastZ;
    mem.until = ctx.now + cfg.INVESTIGATE_MS;
  } else if (mem.mode === 'chase') {
    // keep closing on the last known spot while sight is briefly blocked
    mem.targetX = mem.lastX; mem.targetZ = mem.lastZ;
  }

  const stepToward = (tx, tz) => {
    if (!Number.isFinite(tx) || !Number.isFinite(tz)) return null;
    if (dist(x, z, tx, tz) <= cfg.ARRIVE_FT) return null;
    const route = ctx.path ? ctx.path(x, z, tx, tz) : null;
    if (route && route.length) {
      // farthest in-budget waypoint; final segment clamped by remaining budget
      let px = x, pz = z, used = 0, dest = null;
      for (const wp of route) {
        const leg = Math.hypot(wp.x - px, wp.z - pz);
        if (used + leg > budget) {
          const remain = budget - used;
          if (remain > 0.4 && leg > 0.01) dest = { x: px + (wp.x - px) * (remain / leg), z: pz + (wp.z - pz) * (remain / leg) };
          break;
        }
        px = wp.x; pz = wp.z; used += leg;
        dest = { x: px, z: pz };
      }
      return dest;
    }
    // no route: fall back to a short direct step (caller validates blockers)
    const d = dist(x, z, tx, tz);
    const s = Math.min(budget, d);
    return { x: x + (tx - x) / d * s, z: z + (tz - z) / d * s };
  };

  const applyStep = (tx, tz) => {
    const dest = stepToward(tx, tz);
    if (!dest) return false;
    if (ctx.blocked && ctx.blocked(dest.x, dest.z)) return false;
    if (ctx.isBanned && ctx.isBanned(dest.x, dest.z)) return false;
    const rotY = face(dest.x - x, dest.z - z);
    out.move = { x: dest.x, z: dest.z, ...(rotY !== undefined ? { rotY } : {}) };
    return true;
  };

  switch (mem.mode) {
    case 'chase': {
      const target = living.find(p => p.id === mem.targetId)
        || seen[0]
        || (living.length ? living[0] : null);
      if (!target) { mem.mode = 'idle'; mem.until = ctx.now + 800; break; }
      const d = dist(x, z, target.x, target.z);
      if (d <= cfg.ENGAGE_FT) { out.engage = target.id; break; }
      if (homeD >= cfg.RETURN_AT_FT && d > cfg.AGGRO_FT) {
        // leashed: give up the chase and pad home
        mem.mode = 'return'; mem.until = 0; break;
      }
      applyStep(mem.targetX ?? target.x, mem.targetZ ?? target.z);
      break;
    }
    case 'investigate': {
      if (ctx.now > (mem.until || 0) || !Number.isFinite(mem.targetX)) {
        mem.mode = 'idle'; mem.until = ctx.now + cfg.IDLE_MIN_MS; break;
      }
      if (!applyStep(mem.targetX, mem.targetZ)) { mem.mode = 'idle'; mem.until = ctx.now + cfg.IDLE_MIN_MS; }
      break;
    }
    case 'return': {
      if (homeD <= cfg.ARRIVE_FT) { mem.mode = 'idle'; mem.until = ctx.now + cfg.IDLE_MIN_MS; break; }
      if (!applyStep(mem.homeX, mem.homeZ)) { mem.mode = 'idle'; mem.until = ctx.now + 800; }
      break;
    }
    case 'wander': {
      const arrived = !Number.isFinite(mem.targetX) || dist(x, z, mem.targetX, mem.targetZ) <= cfg.ARRIVE_FT;
      const expired = ctx.now > (mem.until || 0);
      if (arrived || expired) { mem.mode = 'idle'; mem.until = ctx.now + cfg.IDLE_MIN_MS + rng() * (cfg.IDLE_MAX_MS - cfg.IDLE_MIN_MS); break; }
      if (!applyStep(mem.targetX, mem.targetZ)) { mem.mode = 'idle'; mem.until = ctx.now + 600; }
      break;
    }
    default: { // idle
      if (ctx.now > (mem.until || 0)) {
        // pick a reachable wander target around home (leash respected)
        for (let tries = 0; tries < 6; tries++) {
          const a = rng() * Math.PI * 2;
          const r = cfg.WANDER_R_FT * (0.35 + rng() * 0.65);
          const tx = mem.homeX + Math.cos(a) * r;
          const tz = mem.homeZ + Math.sin(a) * r;
          if (ctx.blocked && ctx.blocked(tx, tz)) continue;
          if (ctx.isBanned && ctx.isBanned(tx, tz)) continue;
          if (ctx.path && !ctx.path(x, z, tx, tz)) continue;   // unreachable pocket
          mem.mode = 'wander';
          mem.targetX = tx; mem.targetZ = tz;
          mem.until = ctx.now + 12000;
          break;
        }
        if (mem.mode !== 'wander') mem.until = ctx.now + 1200;   // caged — re-roll soon
      }
      break;
    }
  }

  // hard tether: a step may never end beyond the leash radius (checked against
  // the DESTINATION, not the origin), and chasing past it breaks off home
  if (out.move) {
    const endD = dist(out.move.x, out.move.z, mem.homeX, mem.homeZ);
    if (endD > cfg.LEASH_FT && endD >= homeD) {
      out.move = undefined;
      if (mem.mode === 'chase' || mem.mode === 'wander' || mem.mode === 'investigate') {
        mem.mode = 'return';
      }
    }
  }
  return out;
}
