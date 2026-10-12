// ASHENREACH — server/src/rules/DirectorAI.js
// AI-DM v1 heuristics. Plain ESM, zero deps, never throws.
//
// Public API (frozen in docs/CONTRACTS.md):
//   think(state, events?, opts?) -> [{op, payload}]     // dm:cmd ops, in order
//
//     op 'spawn'    payload: {name, archetype, x, z, hp, ac, speedFt, monsterId, cr}
//                     — x/z are WORLD FEET; matches GameManager.dmCommand('spawn')
//                       (makeMonsterToken copies name/archetype/x/z/hp/ac/speedFt;
//                       pass `monsterId` through so CombatEngine/MonsterAI can
//                       resolve the stat block)
//     op 'chat'     payload: {text, color?}   — narration line (gm.narrate)
//     op 'weather'  payload: {type: 'clear'|'rain'|'storm'|'fog', intensity: 0..1}
//     op 'daynight' payload: {mode: 'fixed', time: minutes 0..1440}
//
// Design: think() is a POLL — call it once per turn end (or per notable event).
// It only ever returns NEW beats: per-state memory (WeakMap) suppresses repeats,
// so calling it every turn is safe and idempotent. All picks are deterministic
// for a given state; pass opts.rng for seeded narration variety.
//
// V1 heuristics:
//   1. reinforcement — all monsters dead while the fight is still young
//      (round < 2) and the party still stands → spawn 1-2 CR-appropriate
//      monsters near the map's monster spawn points
//   2. retreat beat   — first living monster to drop below 30% HP triggers a
//      one-shot "the horde falters" narration
//   3. ambient beats  — every 3 combat rounds a weather shift (fog → rain →
//      storm cadence); every 6 rounds the light dies a little more

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONSTERS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'monsters_index.json'), 'utf-8'))
  .filter(e => e && e.id && e.cr != null && Array.isArray(e.attacks) && e.attacks.length > 0);

const RETREAT_HP_RATIO = 0.3;
const REINFORCE_BEFORE_ROUND = 2;    // "all monsters dead < 2 rounds"
const WEATHER_EVERY_N_ROUNDS = 3;
const DAYNIGHT_EVERY_N_ROUNDS = 6;

const NARRATION_COLOR = '#b8952f';   // matches GameManager.narrate default

const RETREAT_LINES = [
  (m) => `${m} staggers, black ichor threading the ash — the horde falters.`,
  (m) => `A thin shriek cuts the dark: ${m} turns to flee, and the line breaks behind it.`,
  (m) => `${m} wavers, whatever passed for courage in it guttering out. The advance becomes a retreat.`
];

const WEATHER_BEATS = [
  { type: 'fog',   intensity: 0.6, line: 'A pale fog seeps between the stones, swallowing the far wall.' },
  { type: 'rain',  intensity: 0.5, line: 'Rain begins to fall — soft at first, then drumming on rot and iron.' },
  { type: 'storm', intensity: 0.9, line: 'Thunder rolls across the reach; lightning stitches the dark shut.' },
  { type: 'rain',  intensity: 0.7, line: 'The rain thickens to a hiss, drowning every torch to a blue nub.' }
];

// visual archetype guess for spawn payloads (rig flavor; DM may override)
const ARCHETYPE_BY_TYPE = {
  undead: 'skeleton', humanoid: 'skeleton', fiend: 'wraith', dragon: 'wraith',
  elemental: 'wraith', monstrosity: 'wraith', aberration: 'wraith'
};

// per-state memory (WeakMap → no leaks when sessions are dropped)
const MEMORY = new WeakMap();

function memoryOf(state) {
  let m = MEMORY.get(state);
  if (!m) {
    m = { sawCombat: false, lastRound: 0, reinforced: false, retreatNarrated: false, weatherRound: 0 };
    MEMORY.set(state, m);
  }
  return m;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Average party level guess from token hp (tokens don't carry level in v0). */
function inferPartyLevel(players) {
  if (!players.length) return 1;
  const avgHpMax = players.reduce((s, t) => s + (Number(t.hpMax) || 10), 0) / players.length;
  return clamp(Math.round(avgHpMax / 10), 1, 20);
}

/** CR-appropriate picks from the monster index (deterministic). */
function pickReinforcements(count, partyLevel) {
  const targetCr = clamp(partyLevel * 0.25, 0.25, 5);
  const sorted = [...MONSTERS].sort((a, b) =>
    Math.abs(a.cr - targetCr) - Math.abs(b.cr - targetCr) ||
    (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const picks = [];
  for (const e of sorted) {
    if (picks.length >= count) break;
    if (picks.some(p => p.id === e.id)) continue;
    picks.push(e);
  }
  return picks;
}

/** World-feet spawn position near the map's monster spawns (or off the party). */
function spawnPosition(state, i, spawnPoints) {
  const pts = (spawnPoints || [])
    .map(p => Array.isArray(p) ? { x: Number(p[0]), z: Number(p[1]) } : { x: Number(p?.x), z: Number(p?.z) })
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.z));
  if (pts.length) return pts[i % pts.length];
  // fallback: ring around the party centroid, out of immediate sight
  const players = (state?.tokens || []).filter(t => t.kind === 'player' && t.hp > 0);
  const cx = players.length ? players.reduce((s, t) => s + Number(t.x), 0) / players.length : 0;
  const cz = players.length ? players.reduce((s, t) => s + Number(t.z), 0) / players.length : 0;
  const ang = 0.7 + i * 2.4;   // golden-ish spread, deterministic
  return { x: clamp(cx + Math.cos(ang) * 35, -390, 390), z: clamp(cz + Math.sin(ang) * 35, -390, 390) };
}

function chatOp(text, color = NARRATION_COLOR) {
  return { op: 'chat', payload: { text, color } };
}

/**
 * AI-DM brain. Call after each turn end (events optional; state is polled).
 * @param {object} state GameManager state
 * @param {Array|object} [events] recent engine events (informational in v1;
 *        {type, round, ...} entries may refine the round)
 * @param {object} [opts] {partyLevel?, spawnPoints?: [{x,z}] world feet,
 *        archetypeFor?: (entry) => string, rng?: () => number}
 * @returns {Array<{op, payload}>} dm:cmd ops to execute, in order (may be empty)
 */
export function think(state, events = [], opts = {}) {
  const ops = [];
  if (!state || typeof state !== 'object') return ops;
  const rng = opts.rng || Math.random;
  const mem = memoryOf(state);

  const tokens = Array.isArray(state.tokens) ? state.tokens : [];
  const ini = state.initiative;
  const combat = !!(ini && Array.isArray(ini.order) && ini.order.length > 0);
  if (combat) { mem.sawCombat = true; mem.lastRound = Math.max(mem.lastRound, Number(ini.round) || 0); }

  const evList = Array.isArray(events) ? events : (events ? [events] : []);
  for (const e of evList) {
    if (e && Number.isFinite(Number(e.round))) mem.lastRound = Math.max(mem.lastRound, Number(e.round));
  }
  const round = combat ? (Number(ini.round) || 0) : mem.lastRound;

  const monsters = tokens.filter(t => t.kind === 'monster');
  const aliveMonsters = monsters.filter(t => t.hp > 0 && !t.deathSaves?.dead);
  const alivePlayers = tokens.filter(t => t.kind === 'player' && t.hp > 0 && !t.deathSaves?.dead);

  // 1 ── reinforcement: the party wiped the board too fast, send the next wave
  if (
    !mem.reinforced && mem.sawCombat &&
    monsters.length > 0 && aliveMonsters.length === 0 && alivePlayers.length > 0 &&
    round < REINFORCE_BEFORE_ROUND
  ) {
    mem.reinforced = true;
    const partyLevel = Number(opts.partyLevel) || inferPartyLevel(alivePlayers);
    const count = alivePlayers.length >= 3 ? 2 : 1;
    const picks = pickReinforcements(count, partyLevel);
    if (picks.length) {
      ops.push(chatOp(`The dark answers: ${picks.map(p => p.name).join(' and ')} ` +
        `${picks.length > 1 ? 'emerge' : 'emerges'} from the ash at the chamber's edge.`));
      picks.forEach((entry, i) => {
        const pos = spawnPosition(state, i, opts.spawnPoints);
        ops.push({
          op: 'spawn',
          payload: {
            name: entry.name,
            archetype: (opts.archetypeFor && opts.archetypeFor(entry)) ||
              ARCHETYPE_BY_TYPE[String(entry.type || '').toLowerCase()] || 'skeleton',
            x: pos.x, z: pos.z,                       // world feet
            hp: entry.hp, hpMax: entry.hp,
            ac: entry.ac, speedFt: entry.speedFt,
            monsterId: entry.id, cr: entry.cr
          }
        });
      });
    }
  }

  // 2 ── retreat beat: first monster to drop below 30% HP
  if (!mem.retreatNarrated && aliveMonsters.length > 0) {
    const wounded = aliveMonsters.find(t => t.hp / (Number(t.hpMax) || 1) < RETREAT_HP_RATIO);
    if (wounded) {
      mem.retreatNarrated = true;
      const line = RETREAT_LINES[Math.floor(rng() * RETREAT_LINES.length)](wounded.name || 'The creature');
      ops.push(chatOp(line));
    }
  }

  // 3 ── ambient beats: weather shift every few rounds, dying light beyond that
  if (combat && round >= WEATHER_EVERY_N_ROUNDS && round - mem.weatherRound >= WEATHER_EVERY_N_ROUNDS) {
    mem.weatherRound = round;
    const beat = WEATHER_BEATS[(Math.floor(round / WEATHER_EVERY_N_ROUNDS) - 1) % WEATHER_BEATS.length];
    ops.push({ op: 'weather', payload: { type: beat.type, intensity: beat.intensity } });
    ops.push(chatOp(beat.line));
    if (round % DAYNIGHT_EVERY_N_ROUNDS === 0) {
      const time = (20 * 60 + Math.round((round * 13) % 180)) % 1440;   // sink toward night
      ops.push({ op: 'daynight', payload: { mode: 'fixed', time } });
      ops.push(chatOp('The last light drains from the reach; the dark leans in.'));
    }
  }

  return ops;
}
