// ASHENREACH — server/src/rules/CombatEngine.js
// Structured 5E combat: initiative, turns, actions, damage, saves, concentration,
// death saves, and the per-turn movement budget. Plain ESM, zero deps.
//
// Ported from Custom-VTT's proven combat flow (server.js + VTTManager.js):
//   • initiative: d20 + DEX mod, tiebreak DEX then id (VTTManager.setInitiativeOrder)
//   • movement budget: trail + LIFO rewind refund, Chebyshev cell cost (S3 system)
//   • death saves: nat 20 -> 1 HP, nat 1 -> 2 fails, 3 fails dead, 3 oks stable
//   • damage at 0 HP -> 1 fail (2 on crit), massive damage (>= hpMax) -> instant death
//   • healing from 0 resets death save progress
//   • potions registry (itemEffects.js) for usable items
// Extended with: full action economy (attack/multiattack/cast/dash/dodge/disengage/
// help/ready/use), spell resolution with slot consumption + concentration, 5E
// advantage/disadvantage matrix, resistances/immunities/vulnerabilities, sneak attack.
//
// STATE SHAPE (docs/CONTRACTS.md — GameManager owns it, we mutate it):
//   state.tokens[]   — every creature; combat-relevant extras documented in SCHEMA.md
//   state.initiative — { order: [tokenIds], turnIdx, round,
//                        movement: { tokenId, usedFt, maxFt, trail: [{x,z,cumFt}] } }
//
// Tokens carry a combat profile (from CharacterEngine.buildCombatProfile for players,
// MonsterAI.buildMonsterToken for monsters): attacks[], saveMods, spellcasting,
// dexMod, sneakAttackDice, plus hp/hpMax/ac/speedFt/conditions/deathSaves.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { d20, rollDiceFormula, rollDamage, parseDiceFormula } from './dice.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRD = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'srd_data.json'), 'utf-8'));

export const CELL_FT = 5;          // one grid cell = 5 feet
const TRAIL_MATCH_FT = 2.5;        // rewind match tolerance (same-cell in continuous coords)

// ── small helpers ────────────────────────────────────────────────────────────

const tokenById = (state, id) => (state.tokens || []).find(t => t.id === id) || null;
const has = (token, cond) => (token.conditions || []).includes(cond);

export function distFt(a, b) {
  const dx = Number(a.x) - Number(b.x);
  const dz = Number(a.z) - Number(b.z);
  return Math.sqrt(dx * dx + dz * dz);
}

export function combatActive(state) {
  return !!(state.initiative && Array.isArray(state.initiative.order) && state.initiative.order.length > 0);
}

export function currentActorId(state) {
  if (!combatActive(state)) return null;
  return state.initiative.order[state.initiative.turnIdx] || null;
}

function isHostile(a, b) {
  if (!a || !b || a.id === b.id) return false;
  return a.kind !== b.kind;   // players vs monsters/npcs (PvP is GM-manual)
}

// ── speed / movement budget (VTT S3 port, world-feet edition) ────────────────

export function effectiveSpeedFt(state, token) {
  if (!token) return 0;
  if (token.hp <= 0 || token.deathSaves?.dead) return 0;
  for (const c of ['restrained', 'grappled', 'paralyzed', 'stunned', 'unconscious', 'petrified']) {
    if (has(token, c)) return 0;
  }
  let speed = Number(token.speedFt) || 30;
  if (has(token, 'prone')) speed = Math.floor(speed / 2);   // crawling
  return speed;
}

// Chebyshev cell distance * 5ft, minimum one 5ft step (VTT stepCostFt).
function stepCostFt(fromX, fromZ, toX, toZ) {
  const cells = Math.max(Math.abs(Number(toX) - Number(fromX)), Math.abs(Number(toZ) - Number(fromZ))) / CELL_FT;
  if (cells < 0.01) return 0;
  return Math.max(1, Math.round(cells)) * CELL_FT;
}

// Start-of-turn anchor: fresh budget for the combatant where they stand.
export function anchorMovement(state, tokenId) {
  if (!tokenId) { if (state.initiative) state.initiative.movement = null; return null; }
  const token = tokenById(state, tokenId);
  if (!token) return null;
  const m = {
    tokenId,
    usedFt: 0,
    maxFt: effectiveSpeedFt(state, token),
    trail: [{ x: Number(token.x) || 0, z: Number(token.z) || 0, cumFt: 0 }]
  };
  if (state.initiative) state.initiative.movement = m;
  return m;
}

/**
 * The one gate every in-combat token move flows through (VTT attemptMove port).
 * @returns {{ok: true, usedFt, cost, x, z} | {ok: false, reason, x, z, usedFt, speed, needed}}
 *   reasons: not_found | not_your_turn | no_movement
 * Out of combat movement is free — GameManager handles position updates directly;
 * this gate only enforces the budget mid-encounter.
 */
export function attemptMove(state, token, x, z, { isDM = false } = {}) {
  if (!token) return { ok: false, reason: 'not_found' };
  const nx = Number(x), nz = Number(z);
  if (!Number.isFinite(nx) || !Number.isFinite(nz)) return { ok: false, reason: 'bad_coords' };

  if (!combatActive(state) || isDM) {
    token.x = nx; token.z = nz;
    // keep the active combatant's budget truthful after a DM reposition (VTT pattern)
    const m = state.initiative?.movement;
    if (combatActive(state) && m && m.tokenId === token.id) {
      m.trail = [{ x: token.x, z: token.z, cumFt: m.usedFt }];
    }
    return { ok: true, free: true, usedFt: 0, cost: 0, x: token.x, z: token.z };
  }

  if (currentActorId(state) !== token.id) {
    return { ok: false, reason: 'not_your_turn', x: token.x, z: token.z, usedFt: 0, speed: effectiveSpeedFt(state, token) };
  }

  const budget = state.initiative.movement && state.initiative.movement.tokenId === token.id
    ? state.initiative.movement : null;
  if (!budget) {
    // legacy/lost budget: re-anchor instead of crashing (VTT behavior)
    anchorMovement(state, token.id);
    token.x = nx; token.z = nz;
    return { ok: true, free: true, usedFt: 0, cost: 0, x: token.x, z: token.z };
  }

  // Rewind: dropping on (or next to) any earlier trail point refunds the spend since.
  for (let i = budget.trail.length - 2; i >= 0; i--) {
    const step = budget.trail[i];
    if (Math.abs(step.x - nx) < TRAIL_MATCH_FT && Math.abs(step.z - nz) < TRAIL_MATCH_FT) {
      token.x = nx; token.z = nz;
      budget.trail = budget.trail.slice(0, i + 1);
      budget.usedFt = step.cumFt;
      return { ok: true, rewound: true, usedFt: budget.usedFt, cost: 0, x: token.x, z: token.z };
    }
  }

  const head = budget.trail[budget.trail.length - 1];
  const cost = stepCostFt(head.x, head.z, nx, nz);
  const speed = budget.maxFt ?? effectiveSpeedFt(state, token);
  if (budget.usedFt + cost > speed) {
    return { ok: false, reason: 'no_movement', x: token.x, z: token.z, usedFt: budget.usedFt, speed, needed: cost };
  }

  token.x = nx; token.z = nz;
  budget.usedFt += cost;
  budget.trail.push({ x: token.x, z: token.z, cumFt: budget.usedFt });
  return { ok: true, usedFt: budget.usedFt, cost, x: token.x, z: token.z };
}

// ── initiative ────────────────────────────────────────────────────────────────

/**
 * Roll initiative for a set of tokens.
 * @param {Array} tokens token objects (need id; dexMod or combat profile consulted)
 * @param {() => number} rng injectable
 * @returns {string[]} ordered token ids (initiative desc, then DEX desc, then id asc)
 * Also writes token.initiative so the client can render it.
 */
export function rollInitiative(tokens, rng = Math.random) {
  const list = (tokens || []).filter(Boolean).map(t => {
    const dexMod = Number(t.dexMod ?? t.combat?.dexMod ?? t.initiativeBonus ?? 0) || 0;
    const roll = d20(dexMod, {}, rng);
    t.initiative = roll.total;
    return { id: t.id, initiative: roll.total, dexMod, nat: roll.nat, rolls: roll.rolls };
  });
  list.sort((a, b) =>
    (b.initiative - a.initiative) ||
    (b.dexMod - a.dexMod) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return list.map(e => e.id);
}

// ── turns ────────────────────────────────────────────────────────────────────

/**
 * Begin a combatant's turn: point the initiative cursor, re-anchor the movement
 * budget, clear last-turn flags, tick start-of-turn effects.
 * @returns {{ok: true, tokenId, round, notes: string[], fx: Array} | {ok: false, reason}}
 */
export function beginTurn(state, tokenId) {
  if (!combatActive(state)) return { ok: false, reason: 'no_combat' };
  const order = state.initiative.order;
  const idx = order.indexOf(tokenId);
  if (idx === -1) return { ok: false, reason: 'not_in_initiative' };
  const token = tokenById(state, tokenId);
  if (!token) return { ok: false, reason: 'no_token' };

  const prevIdx = state.initiative.turnIdx ?? -1;
  state.initiative.turnIdx = idx;
  if (!state.initiative.round || state.initiative.round < 1) state.initiative.round = 1;
  // NOTE: round incrementation on wrap lives in nextTurn(); jumping the cursor
  // backwards (DM set_turn) does NOT change the round.

  const notes = [];
  const fx = [];

  // fresh turn economy
  token.actionUsed = false;
  token.bonusUsed = false;
  token.reactionUsed = false;
  token.objectInteractionUsed = false;
  token.helpTarget = null;
  token.readyAction = null;
  toggleCondition(token, 'dodging', false);     // dodge lasts until start of next turn
  toggleCondition(token, 'disengaged', false);
  if (token.effects) {
    for (const [name, rounds] of Object.entries(token.effects)) {
      const left = rounds - 1;
      if (left <= 0) { delete token.effects[name]; toggleCondition(token, name, false); }
      else token.effects[name] = left;
    }
  }

  // movement anchor
  anchorMovement(state, tokenId);

  if (token.deathSaves?.dead) {
    notes.push(`${token.name} lies dead.`);
    return { ok: true, tokenId, round: state.initiative.round, notes, fx, dead: true };
  }
  if (token.hp <= 0) {
    notes.push(`${token.name} is down and dying.`);
    return { ok: true, tokenId, round: state.initiative.round, notes, fx, dying: true };
  }

  // start-of-turn effect stubs (real hooks, heuristic payloads)
  if (has(token, 'bleeding')) {
    const r = rollDiceFormula('1d4', Math.random);
    const dmg = Math.max(1, r ? r.total : 1);
    applyDamage(state, token, dmg, { type: 'necrotic', source: 'bleeding' });
    notes.push(`${token.name} bleeds for ${dmg} damage.`);
    fx.push({ actorId: token.id, action: { anim: 'hit', power: dmg } });
  }
  if (has(token, 'regenerating') && token.hp > 0 && token.hp < token.hpMax) {
    const heal = Math.min(token.hpMax - token.hp, 5);
    applyHealing(state, token, heal);
    notes.push(`${token.name} regenerates ${heal} HP.`);
    fx.push({ actorId: token.id, action: { anim: 'heal', power: heal } });
  }
  if (token.concentrating) {
    notes.push(`${token.name} is concentrating on ${token.concentrating.spellId || 'a spell'}.`);
  }

  return { ok: true, tokenId, round: state.initiative.round, notes, fx };
}

/** Advance to the next combatant (wrapping increments the round), then begin their turn. */
export function nextTurn(state) {
  if (!combatActive(state)) return { ok: false, reason: 'no_combat' };
  const order = state.initiative.order;
  const nextIdx = (state.initiative.turnIdx + 1) % order.length;
  const wrapped = nextIdx === 0;
  if (wrapped) state.initiative.round = (state.initiative.round || 1) + 1;
  state.initiative.turnIdx = nextIdx;
  return beginTurn(state, order[nextIdx]);
}

function toggleCondition(token, cond, on) {
  if (!Array.isArray(token.conditions)) token.conditions = [];
  const i = token.conditions.indexOf(cond);
  if (on && i === -1) token.conditions.push(cond);
  if (!on && i !== -1) token.conditions.splice(i, 1);
}

/** Add a timed effect (rounds counted down at the OWNER's turn start). */
function addEffect(token, name, rounds) {
  token.effects = token.effects || {};
  token.effects[name] = rounds;
  toggleCondition(token, name, true);
}

// ── saves / concentration / death ────────────────────────────────────────────

function saveModFor(token, ability) {
  const key = String(ability || '').toLowerCase();
  if (token.saveMods && token.saveMods[key] !== undefined) return Number(token.saveMods[key]) || 0;
  if (token.combat?.saveMods && token.combat.saveMods[key] !== undefined) return Number(token.combat.saveMods[key]) || 0;
  // forged characters: sheet.saves[ability].mod (mod already includes proficiency)
  if (token.sheet?.saves?.[key]?.mod !== undefined) return Number(token.sheet.saves[key].mod) || 0;
  return 0;
}

/**
 * A single saving throw. nat 20 auto-succeeds, nat 1 auto-fails (RAW).
 * @returns {{rolls, total, nat, success, dc, ability}}
 */
export function rollSave(state, token, ability, { dc, adv = false, dis = false } = {}, rng = Math.random) {
  const mod = saveModFor(token, ability);
  const r = d20(mod, { adv, dis }, rng);
  let success;
  if (r.nat === 20) success = true;
  else if (r.nat === 1) success = false;
  else success = r.total >= dc;
  return { rolls: r.rolls, total: r.total, nat: r.nat, mod, success, dc, ability };
}

/** Immediate concentration check from damage (5E: DC = max(10, half damage)). */
export function concentrationCheck(state, token, dmgAmount, rng = Math.random) {
  if (!token || !token.concentrating || dmgAmount <= 0) return { ok: true, broke: false };
  const dc = Math.max(10, Math.floor(dmgAmount / 2));
  const save = rollSave(state, token, 'con', { dc }, rng);
  const spellId = token.concentrating.spellId || null;
  if (!save.success) {
    token.concentrating = null;
    toggleCondition(token, 'concentrating', false);
  }
  return { ok: true, broke: !save.success, spellId, dc, save };
}

function ensureDeathSaves(token) {
  if (!token.deathSaves || typeof token.deathSaves !== 'object') {
    token.deathSaves = { ok: 0, fail: 0, stable: false, dead: false };
  }
  return token.deathSaves;
}

/**
 * Roll a death saving throw for a dying token.
 * nat 20 -> revive at 1 HP; nat 1 -> 2 fails; >=10 -> success; <10 -> fail.
 * 3 fails -> dead; 3 successes -> stable.
 */
export function rollDeathSave(state, token, rng = Math.random) {
  if (!token) return { ok: false, reason: 'no_token' };
  const ds = ensureDeathSaves(token);
  if (ds.dead) return { ok: false, reason: 'already_dead' };
  if (token.hp > 0) return { ok: false, reason: 'not_dying' };
  if (ds.stable) return { ok: false, reason: 'stable' };

  const r = d20(0, {}, rng);
  const out = { ok: true, nat: r.nat, rolls: r.rolls };
  if (r.nat === 20) {
    token.hp = 1;
    token.deathSaves = { ok: 0, fail: 0, stable: false, dead: false };
    toggleCondition(token, 'unconscious', false);
    toggleCondition(token, 'prone', false);
    delete token.soloDeathPrompted;
    if (token.sheet?.hp) token.sheet.hp.current = 1;
    out.revived = true;
    out.hp = 1;
    return out;
  }
  if (r.nat === 1) ds.fail += 2;
  else if (r.nat >= 10) ds.ok += 1;
  else ds.fail += 1;

  if (ds.fail >= 3) {
    ds.dead = true;
    out.dead = true;
  } else if (ds.ok >= 3) {
    ds.stable = true;
    out.stable = true;
  }
  out.deathSaves = { ...ds };
  return out;
}

/** Stabilize a dying creature (Medicine DC 10 succeeded, or a stabilizing effect). */
export function stabilize(state, token) {
  if (!token || token.hp > 0) return { ok: false, reason: 'not_dying' };
  const ds = ensureDeathSaves(token);
  if (ds.dead) return { ok: false, reason: 'already_dead' };
  ds.stable = true;
  return { ok: true, deathSaves: { ...ds } };
}

/** Permanently end a downed token's adventure for this server session. */
export function finalizeDeath(token) {
  if (!token) return { ok: false, reason: 'no_token' };
  if (token.hp > 0) return { ok: false, reason: 'not_dying' };
  const ds = ensureDeathSaves(token);
  if (ds.dead) return { ok: false, reason: 'already_dead' };
  markDead(token);
  if (token.sheet?.hp) token.sheet.hp.current = 0;
  return { ok: true, deathSaves: { ...ds } };
}

// ── damage / healing ─────────────────────────────────────────────────────────

/**
 * Apply damage with full 5E death mechanics.
 * - resistance: half (floor) | vulnerability: x2 | immunity: 0
 * - dropping to exactly 0: downed (no auto-fail)
 * - damage while AT 0: 1 death save fail (+1 more if crit)
 * - massive damage (>= hpMax, incl. carrying over past 0): instant death
 * - monsters (deathSaves == null) die at 0 (common automation default)
 * - concentrating targets get an immediate concentration check
 * @returns {{ok: true, hp, downed, dead, notes} | {ok: false, reason}}
 */
export function applyDamage(state, token, amount, { type = null, source = null, crit = false, rng = Math.random } = {}) {
  if (!token) return { ok: false, reason: 'no_token' };
  if (token.deathSaves?.dead) return { ok: false, reason: 'already_dead' };
  let dmg = Math.max(0, Math.round(Number(amount) || 0));
  const notes = [];

  if (type) {
    const t = String(type).toLowerCase();
    const immunities = token.immunities || [];
    const resistances = token.resistances || [];
    const vulnerabilities = token.vulnerabilities || [];
    if (immunities.includes(t)) { if (dmg > 0) notes.push(`${token.name} is immune to ${t}.`); dmg = 0; }
    else if (vulnerabilities.includes(t)) { dmg *= 2; notes.push(`${token.name} is vulnerable to ${t}!`); }
    else if (resistances.includes(t)) { dmg = Math.floor(dmg / 2); notes.push(`${token.name} resists ${t}.`); }
  }
  if (dmg <= 0) {
    return { ok: true, hp: token.hp, downed: token.hp <= 0, dead: !!token.deathSaves?.dead, notes, amount: 0 };
  }

  // concentration break check happens on any damage taken
  if (token.concentrating) {
    const conc = concentrationCheck(state, token, dmg, rng);
    if (conc.broke) notes.push(`${token.name} loses concentration on ${conc.spellId}!`);
  }

  const wasAtZero = token.hp <= 0;
  const hpMax = Number(token.hpMax) || 1;
  token.hp = Number(token.hp) || 0;

  if (!wasAtZero) {
    token.hp -= dmg;
    let dead = false, downed = false;
    if (token.hp <= 0) {
      const leftover = -token.hp;
      token.hp = 0;
      downed = true;
      // RAW instant death: damage REMAINING after dropping to 0 >= hpMax
      if (leftover >= hpMax) {
        dead = true;
        notes.push(`Massive damage tears the life from ${token.name}!`);
      }
    }
    if (downed && !dead) {
      if (token.deathSaves == null) {
        dead = true;                                    // monsters die at 0 (automation default)
      } else {
        ensureDeathSaves(token);
        toggleCondition(token, 'unconscious', true);
        toggleCondition(token, 'prone', true);
        notes.push(`${token.name} is down!`);
      }
    }
    if (dead) markDead(token);
    return { ok: true, hp: token.hp, downed, dead, notes, amount: dmg };
  }

  // already dying: damage = fails (crit = 2 fails); massive = death
  const ds = ensureDeathSaves(token);
  if (dmg >= hpMax) {
    ds.fail = 3;
    markDead(token);
    notes.push(`${token.name} dies instantly from massive damage!`);
    return { ok: true, hp: 0, downed: true, dead: true, notes, amount: dmg };
  }
  const fails = crit ? 2 : 1;
  ds.fail += fails;
  notes.push(`${token.name} suffers ${fails} death save failure${fails > 1 ? 's' : ''} from damage!`);
  if (ds.fail >= 3) {
    markDead(token);
    notes.push(`${token.name} is dead.`);
  }
  return { ok: true, hp: 0, downed: true, dead: !!ds.dead, notes, amount: dmg };
}

function markDead(token) {
  const ds = ensureDeathSaves(token);
  ds.dead = true;
  toggleCondition(token, 'dead', true);
}

/** Heal a token; returning from 0 HP resets death saves (RAW). */
export function applyHealing(state, token, amount) {
  if (!token) return { ok: false, reason: 'no_token' };
  const heal = Math.max(0, Math.round(Number(amount) || 0));
  if (token.deathSaves?.dead) return { ok: false, reason: 'already_dead' };
  const wasDying = token.hp <= 0;
  const before = Number(token.hp) || 0;
  token.hp = Math.min(Number(token.hpMax) || 1, token.hp + heal);
  const gained = token.hp - before;
  if (wasDying && token.hp > 0) {
    token.deathSaves = { ok: 0, fail: 0, stable: false, dead: false };
    toggleCondition(token, 'unconscious', false);
    delete token.soloDeathPrompted;
    if (token.sheet?.hp) token.sheet.hp.current = token.hp;
  }
  return { ok: true, hp: token.hp, gained, revived: wasDying && token.hp > 0 };
}

// ── advantage / disadvantage matrix (real 5E) ────────────────────────────────

function attackerHidden(state, attacker, target) {
  return !!attacker.hidden || has(attacker, 'invisible');
}

function adjacentHostile(state, token, of) {
  return (state.tokens || []).some(t => t.id !== token.id && isHostile(t, token) && distFt(t, token) <= CELL_FT + 0.01);
}

/**
 * Compute {adv, dis} for an attack roll. Multiple sources stack within their side;
 * ANY advantage + ANY disadvantage cancels to a straight roll (RAW).
 */
export function attackAdvantage(state, attacker, target, weapon, request = {}) {
  const adv = [], dis = [];
  const melee = !weapon.ranged;

  if (has(target, 'prone') && melee) adv.push('target prone');
  if (has(target, 'prone') && !melee) dis.push('target prone (ranged)');
  if (has(target, 'dodging')) dis.push('target dodging');
  if (has(target, 'restrained') || has(target, 'paralyzed') || has(target, 'stunned') || has(target, 'unconscious')) adv.push('target incapacitated');
  if (attackerHidden(state, attacker, target)) adv.push('unseen attacker');
  if (has(attacker, 'prone')) dis.push('attacker prone');
  if (has(attacker, 'restrained')) dis.push('attacker restrained');
  if (has(attacker, 'poisoned')) dis.push('attacker poisoned');
  if (has(attacker, 'blinded') || target.hidden || has(target, 'invisible')) dis.push('unseen target');
  if (has(attacker, 'frightened')) dis.push('attacker frightened');
  if (has(target, 'guided')) adv.push('guided by magic');   // Guiding Bolt payoff

  // Help action / pack-tactics flanking (house rule, AI-supplied hint)
  const helped = (state.tokens || []).some(t =>
    t.id !== attacker.id && !isHostile(t, attacker) && t.helpTarget === target.id);
  if (helped) adv.push('helped ally');
  if (request.flank) {
    const flanking = (state.tokens || []).some(t =>
      t.id !== attacker.id && t.id !== target.id && !isHostile(t, attacker) && distFt(t, target) <= CELL_FT + 0.01);
    if (flanking) adv.push('flanking');
  }

  // ranged attack with a hostile breathing down your neck
  if (!melee && adjacentHostile(state, attacker)) dis.push('ranged in melee');

  // long range band -> disadvantage
  if (weapon.rangeFt && weapon.longRangeFt) {
    const d = distFt(attacker, target);
    if (d > weapon.rangeFt && d <= weapon.longRangeFt) dis.push('long range');
  }

  if (adv.length && dis.length) return { adv: false, dis: false, sources: [...adv, ...dis] };
  return { adv: adv.length > 0, dis: dis.length > 0, sources: [...adv, ...dis] };
}

// ── spell mechanics (curated SRD subset; see SCHEMA.md) ──────────────────────

// mode: attack | save | auto | heal | buff | sleep | shield | utility
const SPELL_MECHANICS = {
  'Fire Bolt': { mode: 'attack', dice: '1d10', type: 'fire', cantripScale: true },
  'Ray of Frost': { mode: 'attack', dice: '1d8', type: 'cold', cantripScale: true },
  'Eldritch Blast': { mode: 'attack', dice: '1d10', type: 'force', cantripScale: 'beams' },
  'Acid Splash': { mode: 'save', save: 'dex', dice: '1d6', type: 'acid', cantripScale: true },
  'Poison Spray': { mode: 'save', save: 'con', dice: '1d12', type: 'poison', cantripScale: true },
  'Sacred Flame': { mode: 'save', save: 'dex', dice: '1d8', type: 'radiant', cantripScale: true },
  'Toll the Dead': { mode: 'save', save: 'wis', dice: '1d8', type: 'necrotic', cantripScale: true, missingHpDice: '1d12' },
  'Vicious Mockery': { mode: 'save', save: 'wis', dice: '1d4', type: 'psychic', cantripScale: true },
  'Magic Missile': { mode: 'auto', dice: '1d4+1', type: 'force', darts: 3, extraDartPerSlot: 1 },
  'Chromatic Orb': { mode: 'attack', dice: '3d8', type: 'choose', choose: ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'], perSlotDice: 1 },
  'Guiding Bolt': { mode: 'attack', dice: '4d6', type: 'radiant', perSlotDice: 2, grants: 'guided' },
  'Inflict Wounds': { mode: 'attack', dice: '3d10', type: 'necrotic', perSlotDice: 1 },
  'Cure Wounds': { mode: 'heal', dice: '1d8', mod: true, perSlotDice: 1 },
  'Healing Word': { mode: 'heal', dice: '1d4', mod: true, perSlotDice: 1, bonus: true },
  'Burning Hands': { mode: 'save', save: 'dex', dice: '3d6', type: 'fire', half: true, radiusFt: 15, perSlotDice: 1 },
  'Thunderwave': { mode: 'save', save: 'con', dice: '2d8', type: 'thunder', half: true, radiusFt: 15, push: 10, knockProne: false, perSlotDice: 1 },
  'Sleep': { mode: 'sleep', dice: '5d8', radiusFt: 20, perSlotDice: 2 },
  'Fireball': { mode: 'save', save: 'dex', dice: '8d6', type: 'fire', half: true, radiusFt: 20, perSlotDice: 1 },
  'Bless': { mode: 'buff', effect: 'blessed', effectRounds: 10, targets: 3, concentration: true },
  'Bane': { mode: 'buff', effect: 'baned', effectRounds: 10, targets: 3, concentration: true, save: 'cha' },
  'Shield of Faith': { mode: 'buff', effect: 'shield_of_faith', effectRounds: 10, targets: 1, concentration: true },
  'Mage Armor': { mode: 'buff', effect: 'mage_armored', effectRounds: 100, targets: 1 },
  'Hold Person': { mode: 'save', save: 'wis', effect: 'paralyzed', effectRounds: 10, concentration: true, perSlotTarget: 1 },
  'Spiritual Weapon': { mode: 'attack', dice: '1d8', mod: true, type: 'force', concentration: true, perSlotDice: 1, bonus: true }
};

function diceStringWithCount(dice, extraDice) {
  const m = /^(\d+)d(\d+)$/.exec(String(dice));
  if (!m) return dice;
  return `${Number(m[1]) + extraDice}d${m[2]}`;
}

function casterLevelOf(actor) {
  return Number(actor.level ?? actor.combat?.level ?? 1) || 1;
}

/** Effective AC including temporary magical effects (shield, shield of faith, mage armor). */
export function effectiveAc(token) {
  let ac = Number(token.ac) || 10;
  if (has(token, 'shielded')) ac += 5;
  if (has(token, 'shield_of_faith')) ac += 2;
  if (has(token, 'mage_armored')) {
    const dexMod = Number(token.dexMod ?? token.combat?.dexMod ?? 0) || 0;
    ac = Math.max(ac, 13 + dexMod);
  }
  return ac;
}

// ── item effects (VTT itemEffects port) ──────────────────────────────────────

const HEALING_TIER_RE = /^potion\s+of\s+(?:(greater|superior|supreme)\s+)?healing$/i;
const TIER_FORMULAS = { regular: '2d4+2', greater: '4d4+4', superior: '8d4+8', supreme: '10d4+20' };

export function resolveItemEffect(name) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const tier = HEALING_TIER_RE.exec(key);
  if (!tier) return null;
  const t = tier[1] ? tier[1].toLowerCase() : 'regular';
  return { label: `Potion of ${t === 'regular' ? '' : tier[1][0].toUpperCase() + tier[1].slice(1) + ' '}Healing`.replace('  ', ' '), effect: { type: 'heal', formula: TIER_FORMULAS[t] } };
}

// ── action resolution ────────────────────────────────────────────────────────

/**
 * Resolve a combat action. THE entry point for players and MonsterAI alike.
 * @param {object} state  authoritative GameManager state (mutated)
 * @param {object|string} actor  token object or token id
 * @param {object} request  ActionRequest (+ extensions, see SCHEMA.md)
 * @param {() => number} rng
 * @returns {{ok: true, result: object} | {ok: false, reason: string, detail?: any}}
 */
export function resolveAction(state, actor, request, rng = Math.random) {
  const token = typeof actor === 'string' ? tokenById(state, actor) : actor;
  if (!token) return { ok: false, reason: 'no_token' };
  request = request || {};

  if (token.deathSaves?.dead || (token.hp <= 0 && request.kind !== 'deathSave')) {
    return { ok: false, reason: 'actor_down' };
  }

  const active = combatActive(state);
  if (active && request.slot !== 'reaction') {
    if (currentActorId(state) !== token.id) return { ok: false, reason: 'not_your_turn' };
    const isBonus = request.slot === 'bonus';
    if (isBonus && token.bonusUsed) return { ok: false, reason: 'bonus_used' };
    if (!isBonus && token.actionUsed) return { ok: false, reason: 'action_used' };
  }

  let outcome;
  switch (request.kind) {
    case 'attack': outcome = doAttack(state, token, request, rng); break;
    case 'cast': outcome = doCast(state, token, request, rng); break;
    case 'dash': outcome = doDash(state, token, request); break;
    case 'dodge': outcome = doDodge(state, token, request); break;
    case 'disengage': outcome = doDisengage(state, token, request); break;
    case 'help': outcome = doHelp(state, token, request); break;
    case 'ready': outcome = doReady(state, token, request); break;
    case 'use': case 'item': outcome = doUseItem(state, token, request, rng); break;
    case 'deathSave': outcome = rollDeathSave(state, token, rng); if (outcome.ok) { outcome.kind = 'deathSave'; } break;
    default: return { ok: false, reason: 'unknown_action' };
  }

  if (outcome.ok === false) return outcome;

  // consume economy (only for full actions / bonus actions in combat)
  if (active && request.slot !== 'reaction') {
    if (request.slot === 'bonus') token.bonusUsed = true;
    else token.actionUsed = true;
  }
  return { ok: true, result: outcome };
}

// —— attack ——

function findAttackEntry(token, request) {
  // monsters carry flattened attacks; forged characters carry them on the sheet
  const attacks = token.attacks || token.combat?.attacks || token.sheet?.attacks || [];
  if (!attacks.length) return null;
  const equipped = Array.isArray(token.sheet?.equipped) ? token.sheet.equipped : null;
  const key = value => String(value || '').trim().toLowerCase();
  const wanted = request.weaponName || request.attackName;
  if (wanted) {
    return attacks.find(a => key(a.name) === key(wanted) && (!equipped || equipped.some(name => key(name) === key(a.name)))) || null;
  }
  if (equipped) return [...attacks].reverse().find(a => equipped.some(name => key(name) === key(a.name))) || null;
  return attacks[0];
}

function doAttack(state, actor, request, rng) {
  const target = tokenById(state, request.targetId);
  if (!target) return { ok: false, reason: 'no_target' };
  if (target.deathSaves?.dead) return { ok: false, reason: 'target_dead' };
  if (target.hp <= 0 && target.deathSaves != null) return { ok: false, reason: 'target_down' };

  // multiattack: request.attacks = [names] (MonsterAI), else single weapon
  const names = Array.isArray(request.attacks) && request.attacks.length
    ? request.attacks : [request.weaponName || request.attackName || null];

  const results = [];
  const chat = [];
  for (const name of names) {
    const entry = findAttackEntry(actor, name ? { weaponName: name } : request);
    if (!entry) return { ok: false, reason: 'no_weapon' };

    // normalize attack shape (CharacterEngine profile vs monsters_index entry)
    const weapon = {
      name: entry.name,
      toHit: Number(entry.toHit ?? entry.attackBonus ?? 0),
      dmg: entry.dmg || entry.damageFormula || '1d4',
      dmgType: (entry.dmgType || entry.damageType || 'bludgeoning').toLowerCase(),
      ranged: !!(entry.ranged || entry.rangeFt),
      reachFt: Number(entry.reachFt || 5),
      rangeFt: entry.rangeFt ?? null,
      longRangeFt: entry.longRangeFt ?? entry.longRange ?? null,
      finesse: !!entry.finesse
    };

    // range gate
    const d = distFt(actor, target);
    const maxReach = weapon.ranged ? (weapon.longRangeFt || weapon.rangeFt || 20) : weapon.reachFt;
    if (d > maxReach + 0.01) {
      return { ok: false, reason: 'out_of_range', detail: { distanceFt: Math.round(d), maxReachFt: maxReach } };
    }

    // advantage / disadvantage
    const { adv, dis, sources } = attackAdvantage(state, actor, target, weapon, request);
    const roll = d20(weapon.toHit, { adv, dis }, rng);

    // bless / bane d4s (raw 5E)
    let bonus = 0;
    if (has(actor, 'blessed')) bonus += (rollDiceFormula('1d4', rng)?.total ?? 0);
    if (has(actor, 'baned')) bonus -= (rollDiceFormula('1d4', rng)?.total ?? 0);

    const nat = roll.nat;
    const isCrit = nat === 20;
    const isFumble = nat === 1;
    const total = roll.total + bonus;
    const ac = effectiveAc(target);
    const hit = isCrit || (!isFumble && total >= ac);

    const shot = {
      weapon: weapon.name, targetId: target.id,
      attackRoll: { formula: `1d20${weapon.toHit >= 0 ? '+' : ''}${weapon.toHit}`, rolls: roll.rolls, nat, total, adv, dis, sources },
      hit, crit: isCrit, fumble: isFumble
    };

    if (!hit) {
      chat.push(`${actor.name} swings ${weapon.name} at ${target.name} and misses (${total} vs AC ${ac}).`);
      results.push({ ...shot, damage: null, targetHp: target.hp });
      continue;
    }

    // damage (crit doubles dice; resistances; sneak attack when eligible)
    const dmgRoll = rollDamage(weapon.dmg, { crit: isCrit, rng });
    let dmg = dmgRoll.total;
    let sneakRoll = null;
    const allyAdjacent = (state.tokens || []).some(t =>
      t.id !== actor.id && !isHostile(t, actor) && t.hp > 0 && distFt(t, target) <= CELL_FT + 0.01);
    if (actor.sneakAttackDice && (weapon.finesse || weapon.ranged) && (adv || allyAdjacent)) {
      sneakRoll = rollDamage(actor.sneakAttackDice, { crit: isCrit, rng });
      dmg += sneakRoll.total;
    }

    const applied = applyDamage(state, target, dmg, { type: weapon.dmgType, source: actor.id, crit: isCrit, rng });
    const fxAnim = weapon.ranged ? 'shoot' : 'lunge';
    shot.damage = { total: applied.amount ?? dmg, rolls: dmgRoll.rolls, formula: weapon.dmg, type: weapon.dmgType, sneak: sneakRoll ? sneakRoll.total : null, crit: isCrit };
    shot.targetHp = target.hp;
    shot.fx = { actorId: actor.id, targetId: target.id, anim: fxAnim, power: applied.amount ?? dmg, ms: 320 };
    chat.push(
      isCrit
        ? `CRITICAL! ${actor.name} lands ${weapon.name} on ${target.name} for ${applied.amount} ${weapon.dmgType} damage! (${target.hp}/${target.hpMax} HP)`
        : `${actor.name} hits ${target.name} with ${weapon.name} for ${applied.amount} ${weapon.dmgType} damage. (${target.hp}/${target.hpMax} HP)`);
    (applied.notes || []).forEach(n => chat.push(n));
    results.push(shot);
  }

  const first = results[0];
  return {
    ok: true, kind: 'attack', actorId: actor.id, targetId: target.id,
    attacks: results, chat, fx: first?.fx || { actorId: actor.id, targetId: target.id, anim: 'lunge' },
    targetHp: target.hp
  };
}

// —— cast ——

function doCast(state, actor, request, rng) {
  const sc = actor.spellcasting || actor.combat?.spellcasting || actor.sheet?.spellcasting;
  if (!sc) return { ok: false, reason: 'no_spellcasting' };

  const spellName = request.spellId || request.spellName;
  const spell = SRD.spells?.[spellName] || Object.values(SRD.spells || {}).find(s => s.name === spellName);
  if (!spell) return { ok: false, reason: 'unknown_spell', detail: spellName };

  const mech = SPELL_MECHANICS[spellName] || null;
  const spellLevel = Number(spell.level) || 0;
  const casterLevel = casterLevelOf(actor);

  // slot bookkeeping (cantrips are free)
  let slotLevel = spellLevel;
  if (spellLevel > 0) {
    slotLevel = Math.max(spellLevel, Number(request.slotLevel) || spellLevel);
    const slots = sc.slots || {};
    const bucket = slots[slotLevel];
    if (!bucket || bucket.used >= bucket.total) return { ok: false, reason: 'no_slot', detail: { slotLevel } };
  }

  // resolve
  const out = resolveSpellEffect(state, actor, request, spell, mech, { slotLevel, spellLevel, casterLevel, sc }, rng);
  if (out.ok === false) return out;

  // consume the slot
  if (spellLevel > 0) {
    sc.slots[slotLevel].used += 1;
    out.result.slotLevel = slotLevel;
    out.result.slots = { ...sc.slots };
  }

  // concentration marking (switching is voluntary — no save needed)
  if (spell.concentration || mech?.concentration) {
    actor.concentrating = { spellId: spellName, sinceRound: state.initiative?.round ?? 0 };
    toggleCondition(actor, 'concentrating', true);
    out.result.concentrating = spellName;
  }

  out.result.kind = 'cast';
  out.result.spellId = spellName;
  out.result.actorId = actor.id;
  // FIX (T2-b2): resolveSpellEffect already returns {ok, result}; returning it
  // as-is made resolveAction double-wrap casts into {ok, result:{ok, result}},
  // breaking the {ok, result} contract every other action follows. Flatten one
  // level so casts match the attack/dash/dodge result shape.
  return { ok: true, ...out.result };
}

function resolveSpellEffect(state, actor, request, spell, mech, ctx, rng) {
  const { slotLevel, spellLevel, casterLevel, sc } = ctx;
  const chat = [];
  const target = tokenById(state, request.targetId);
  const saveDC = Number(sc.saveDC) || 10;
  const atkBonus = Number(sc.attackBonus) || 0;
  // FIX (T2-b2): spellName was referenced here but only existed in doCast's
  // scope — every save/attack-mode spell cast (e.g. Sacred Flame) crashed with
  // ReferenceError. resolveAction must never throw (see header contract).
  const spellName = request.spellId || request.spellName || spell?.name || 'the spell';

  // cantrip scaling: +1 die at caster levels 5/11/17
  let dice = mech?.dice || null;
  let extraDice = 0;
  if (mech?.cantripScale === true) {
    extraDice = (casterLevel >= 5 ? 1 : 0) + (casterLevel >= 11 ? 1 : 0) + (casterLevel >= 17 ? 1 : 0);
    if (extraDice) dice = diceStringWithCount(dice, extraDice);
  }
  if (mech?.perSlotDice && slotLevel > spellLevel) {
    dice = diceStringWithCount(dice, (slotLevel - spellLevel) * mech.perSlotDice);
  }

  // uncurated spell: consume the slot, play the fx, narrate — no mechanics (v1)
  if (!mech) {
    return { ok: true, result: { resolved: 'utility', chat: [`${actor.name} casts ${spellName}.`], fx: { actorId: actor.id, targetId: target?.id, anim: 'spell' }, rolls: [] } };
  }

  switch (mech.mode) {
    case 'attack': {
      if (!target) return { ok: false, reason: 'no_target' };
      const d = distFt(actor, target);
      const rangeStr = String(spell.range || '');
      let rangeFt = 120;
      if (/self|touch/i.test(rangeStr)) rangeFt = /touch/i.test(rangeStr) ? 5 : 0;
      else { const m = /(\d+)/.exec(rangeStr); if (m) rangeFt = Number(m[1]); }
      if (rangeFt > 0 && d > rangeFt + 0.01) return { ok: false, reason: 'out_of_range', detail: { distanceFt: Math.round(d), maxReachFt: rangeFt } };

      const { adv, dis, sources } = attackAdvantage(state, actor, target, { ranged: true }, request);
      const roll = d20(atkBonus, { adv, dis }, rng);
      const isCrit = roll.nat === 20;
      const isFumble = roll.nat === 1;
      const hit = isCrit || (!isFumble && roll.total >= effectiveAc(target));
      const dmgType = mech.choose ? (request.damageType && mech.choose.includes(request.damageType) ? request.damageType : mech.choose[0]) : mech.type;

      if (!hit) {
        return { ok: true, result: { chat: [`${actor.name}'s ${spellName} streaks past ${target.name} and fades.`], fx: { actorId: actor.id, targetId: target.id, anim: 'spell' }, attackRoll: { rolls: roll.rolls, nat: roll.nat, total: roll.total, adv, dis, sources }, hit: false } };
      }
      let mod = mech.mod ? (Number(sc.abilityMod) || 0) : 0;
      const dmgRoll = rollDamage(dice, { crit: isCrit, bonusMod: mod, rng });
      const applied = applyDamage(state, target, dmgRoll.total, { type: dmgType, source: actor.id, crit: isCrit, rng });
      if (mech.grants) addEffect(target, mech.grants, 1);   // e.g. Guiding Bolt advantage
      chat.push(`${actor.name}'s ${spellName} ${isCrit ? 'ERUPTS critically' : 'strikes'} ${target.name} for ${applied.amount} ${dmgType} damage. (${target.hp}/${target.hpMax} HP)`);
      (applied.notes || []).forEach(n => chat.push(n));
      return { ok: true, result: { chat, hit: true, crit: isCrit, attackRoll: { rolls: roll.rolls, nat: roll.nat, total: roll.total, adv, dis, sources }, damage: { total: applied.amount, rolls: dmgRoll.rolls, type: dmgType, crit: isCrit }, targetHp: target.hp, fx: { actorId: actor.id, targetId: target.id, anim: 'spell', power: applied.amount } } };
    }

    case 'save': {
      // single-target save cantrip, or AoE centered on target/point
      const radius = mech.radiusFt || 0;
      let targets;
      if (radius > 0) {
        const origin = target || actor;
        targets = (state.tokens || []).filter(t => t.hp >= 0 && !t.deathSaves?.dead && distFt(t, origin) <= radius + 0.01 && t.id !== actor.id);
      } else {
        if (!target) return { ok: false, reason: 'no_target' };
        targets = [target];
      }
      const outcomes = [];
      for (const t of targets) {
        const save = rollSave(state, t, mech.save, { dc: saveDC }, rng);
        let dmg = 0;
        let dmgRoll = null;
        if (mech.effect) {
          // control spell (Hold Person): fail -> condition
          if (!save.success) { addEffect(t, mech.effect, mech.effectRounds || 10); chat.push(`${t.name} succumbs to ${spellName}!`); }
          else chat.push(`${t.name} shrugs off ${spellName}.`);
          outcomes.push({ targetId: t.id, save: { nat: save.nat, total: save.total }, failed: !save.success, condition: mech.effect });
          continue;
        }
        let useDice = dice;
        // Toll the Dead style: bigger die when the target is wounded
        if (mech.missingHpDice && t.hp < t.hpMax) {
          const dd = /^(\d+)d(\d+)$/.exec(dice);
          const md = /^(\d+)d(\d+)$/.exec(mech.missingHpDice);
          if (dd && md) useDice = `${dd[1]}d${Math.max(Number(dd[2]), Number(md[2]))}`;
        }
        dmgRoll = rollDamage(useDice, { rng });
        dmg = save.success && mech.half ? Math.floor(dmgRoll.total / 2) : dmgRoll.total;
        const applied = applyDamage(state, t, dmg, { type: mech.type, source: actor.id, rng });
        chat.push(save.success
          ? `${t.name} saves against ${spellName} — ${applied.amount} ${mech.type} damage. (${t.hp}/${t.hpMax} HP)`
          : `${t.name} FAILS against ${spellName} — ${applied.amount} ${mech.type} damage! (${t.hp}/${t.hpMax} HP)`);
        (applied.notes || []).forEach(n => chat.push(n));
        if (mech.push && !save.success) {
          const ang = Math.atan2(Number(t.z) - Number(actor.z), Number(t.x) - Number(actor.x));
          t.x = Number(t.x) + Math.cos(ang) * mech.push;
          t.z = Number(t.z) + Math.sin(ang) * mech.push;
          chat.push(`${t.name} is blasted ${mech.push} ft away!`);
        }
        outcomes.push({ targetId: t.id, save: { nat: save.nat, total: save.total, success: save.success }, damage: applied.amount, hp: t.hp });
      }
      return { ok: true, result: { chat, outcomes, saveDC, fx: { actorId: actor.id, targetId: target?.id, anim: 'spell', power: Math.max(0, ...outcomes.map(o => o.damage || 0)) }, rolls: outcomes.map(o => o.save) } };
    }

    case 'auto': {
      // Magic Missile: darts auto-hit
      if (!target) return { ok: false, reason: 'no_target' };
      const extraDarts = mech.extraDartPerSlot ? (slotLevel - spellLevel) * mech.extraDartPerSlot : 0;
      const darts = mech.darts + extraDarts;
      let total = 0;
      const rolls = [];
      for (let i = 0; i < darts; i++) {
        const r = rollDamage(mech.dice, { rng });
        rolls.push(...r.rolls);
        total += r.total;
      }
      const applied = applyDamage(state, target, total, { type: mech.type, source: actor.id, rng });
      chat.push(`${actor.name}'s ${spellName} — ${darts} darts slam into ${target.name} for ${applied.amount} force damage. (${target.hp}/${target.hpMax} HP)`);
      (applied.notes || []).forEach(n => chat.push(n));
      return { ok: true, result: { chat, damage: { total: applied.amount, rolls, darts }, targetHp: target.hp, fx: { actorId: actor.id, targetId: target.id, anim: 'spell', power: applied.amount } } };
    }

    case 'heal': {
      const dest = target || actor;    // self-cast allowed
      if (dest.deathSaves?.dead) return { ok: false, reason: 'target_dead' };
      const mod = mech.mod ? (Number(sc.abilityMod) || 0) : 0;
      const r = rollDamage(dice, { bonusMod: mod, rng });
      const applied = applyHealing(state, dest, r.total);
      chat.push(`${actor.name} casts ${spellName} on ${dest.name} — ${applied.gained} HP restored. (${dest.hp}/${dest.hpMax} HP)`);
      if (applied.revived) chat.push(`${dest.name} surges back to consciousness!`);
      return { ok: true, result: { chat, healing: { total: r.total, gained: applied.gained, rolls: r.rolls }, targetHp: dest.hp, targetId: dest.id, fx: { actorId: actor.id, targetId: dest.id, anim: 'heal', power: applied.gained } } };
    }

    case 'buff': {
      const count = mech.targets || 1;
      const dests = [];
      if (mech.save) {
        // Bane: enemies of the caster's choice save or be baned
        const t = target;
        if (!t) return { ok: false, reason: 'no_target' };
        const save = rollSave(state, t, mech.save, { dc: saveDC }, rng);
        if (!save.success) { addEffect(t, mech.effect, mech.effectRounds); chat.push(`${t.name} is wracked by ${spellName}!`); }
        else chat.push(`${t.name} resists ${spellName}.`);
        dests.push(t.id);
      } else {
        // Bless / Mage Armor: allies incl. self
        dests.push(actor.id);
        let added = 1;
        for (const t of state.tokens || []) {
          if (added >= count) break;
          if (t.id !== actor.id && !isHostile(t, actor) && distFt(t, actor) <= 30) { dests.push(t.id); added++; }
        }
        for (const id of dests) {
          const t = tokenById(state, id);
          if (t) { addEffect(t, mech.effect, mech.effectRounds); chat.push(`${t.name} is wreathed in ${spellName}.`); }
        }
      }
      return { ok: true, result: { chat, buff: mech.effect, targets: dests, fx: { actorId: actor.id, targetId: dests[0], anim: 'buff' } } };
    }

    case 'sleep': {
      const origin = target || actor;
      const pool = rollDamage(dice, { rng });
      let remaining = pool.total;
      const victims = (state.tokens || [])
        .filter(t => isHostile(t, actor) && t.hp > 0 && distFt(t, origin) <= (mech.radiusFt || 20) + 0.01)
        .sort((a, b) => a.hp - b.hp);
      const slept = [];
      for (const v of victims) {
        if (v.hp <= remaining) {
          remaining -= v.hp;
          addEffect(v, 'unconscious', 100);
          slept.push(v.id);
          chat.push(`${v.name} slumps into magical sleep.`);
        }
      }
      if (!slept.length) chat.push(`${actor.name}'s ${spellName} washes harmlessly over the field.`);
      return { ok: true, result: { chat, slept, pool: pool.total, fx: { actorId: actor.id, targetId: origin.id, anim: 'spell' } } };
    }

    case 'shield': {
      addEffect(actor, 'shielded', 1);   // +5 AC until start of next turn
      chat.push(`${actor.name} throws up a shimmering arcane shield.`);
      return { ok: true, result: { chat, buff: 'shielded', fx: { actorId: actor.id, targetId: actor.id, anim: 'buff' } } };
    }

    default:
      return { ok: true, result: { resolved: 'utility', chat: [`${actor.name} casts ${spellName}.`], fx: { actorId: actor.id, anim: 'spell' }, rolls: [] } };
  }
}

// —— the rest of the action menu ——

function doDash(state, actor, request) {
  const m = state.initiative?.movement;
  if (!combatActive(state) || !m || m.tokenId !== actor.id) {
    return { ok: false, reason: 'no_movement' };
  }
  const addedFt = effectiveSpeedFt(state, actor);
  if (addedFt <= 0) return { ok: false, reason: 'no_movement' };
  m.maxFt = (m.maxFt ?? addedFt) + addedFt;
  return {
    ok: true, kind: 'dash', actorId: actor.id, addedFt,
    movement: { usedFt: m.usedFt, maxFt: m.maxFt },
    chat: [`${actor.name} dashes, gaining ${addedFt} ft of movement.`],
    fx: { actorId: actor.id, anim: 'buff' }
  };
}

function doDodge(state, actor, request) {
  toggleCondition(actor, 'dodging', true);
  return { ok: true, kind: 'dodge', actorId: actor.id, conditions: actor.conditions, chat: [`${actor.name} takes the Dodge action — attackers have disadvantage until ${actor.name}'s next turn.`], fx: { actorId: actor.id, anim: 'buff' } };
}

function doDisengage(state, actor, request) {
  toggleCondition(actor, 'disengaged', true);
  return { ok: true, kind: 'disengage', actorId: actor.id, conditions: actor.conditions, chat: [`${actor.name} disengages — no opportunity attacks this turn.`], fx: { actorId: actor.id, anim: 'buff' } };
}

function doHelp(state, actor, request) {
  const target = tokenById(state, request.targetId);
  if (!target) return { ok: false, reason: 'no_target' };
  if (target.deathSaves?.dead) return { ok: false, reason: 'already_dead' };
  if (target.hp <= 0) {
    if (isHostile(actor, target)) return { ok: false, reason: 'hostile_target' };
    if (distFt(actor, target) > 5.01) return { ok: false, reason: 'out_of_reach' };
    const healed = applyHealing(state, target, 1);
    if (!healed.ok || target.hp !== 1) return { ok: false, reason: 'rescue_failed' };
    toggleCondition(target, 'prone', false);
    if (target.sheet?.hp) target.sheet.hp.current = target.hp;
    return {
      ok: true, kind: 'help', actorId: actor.id, targetId: target.id,
      revived: true, hp: target.hp,
      chat: [`${actor.name} pulls ${target.name} back from death's door!`],
      fx: { actorId: target.id, anim: 'heal', ms: 520 },
    };
  }
  actor.helpTarget = target.id;
  return { ok: true, kind: 'help', actorId: actor.id, targetId: target.id, chat: [`${actor.name} creates an opening — the next ally attacking ${target.name} has advantage.`], fx: { actorId: actor.id, targetId: target.id, anim: 'buff' } };
}

function doReady(state, actor, request) {
  actor.readyAction = { trigger: request.trigger || 'unspecified', request: request.action || null };
  return { ok: true, kind: 'ready', actorId: actor.id, chat: [`${actor.name} readies an action (${actor.readyAction.trigger}).`], fx: { actorId: actor.id, anim: 'buff' } };
}

function doUseItem(state, actor, request, rng) {
  const itemName = request.itemId || request.itemName;
  const effect = resolveItemEffect(itemName);
  if (!effect) return { ok: false, reason: 'no_effect', detail: itemName };

  const inv = actor.sheet?.inventory || actor.inventory || actor.combat?.inventory;
  if (!Array.isArray(inv)) return { ok: false, reason: 'no_inventory' };
  const key = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const idx = inv.findIndex(i => key(i.name) === key(itemName));
  if (idx < 0) return { ok: false, reason: 'item_not_found', detail: itemName };
  const item = inv[idx];
  const qtyKey = item.qty != null ? 'qty' : 'quantity';
  const quantity = Math.max(1, Number(item[qtyKey]) || 1);
  if (quantity > 1) item[qtyKey] = quantity - 1;
  else inv.splice(idx, 1);
  const equipment = actor.sheet?.equipment;
  if (Array.isArray(equipment)) {
    const equippedItemIndex = equipment.findIndex(i => key(i.name) === key(itemName));
    if (equippedItemIndex >= 0) {
      const equippedItem = equipment[equippedItemIndex];
      const equipmentQtyKey = equippedItem.qty != null ? 'qty' : 'quantity';
      const equipmentQty = Math.max(1, Number(equippedItem[equipmentQtyKey]) || 1);
      if (equipmentQty > 1) equippedItem[equipmentQtyKey] = equipmentQty - 1;
      else equipment.splice(equippedItemIndex, 1);
    }
  }
  if (actor.sheet?.carrying) {
    actor.sheet.carrying.weight = Math.max(0, (Number(actor.sheet.carrying.weight) || 0) - (Number(item.weight) || 0));
    actor.sheet.carrying.encumbered = actor.sheet.carrying.weight > actor.sheet.carrying.capacity;
  }

  const dest = tokenById(state, request.targetId) || actor;   // administer to another
  const r = rollDiceFormula(effect.effect.formula, rng);
  const applied = applyHealing(state, dest, r ? r.total : 0);
  if (dest === actor && actor.sheet?.hp) actor.sheet.hp.current = actor.hp;
  return {
    ok: true, kind: 'use', actorId: actor.id, targetId: dest.id,
    healing: { total: r?.total ?? 0, gained: applied.gained, rolls: r?.rolls ?? [], formula: effect.effect.formula },
    targetHp: dest.hp,
    chat: [`${actor.name} uses ${effect.label} — ${dest.name} regains ${applied.gained} HP. (${dest.hp}/${dest.hpMax} HP)`],
    fx: { actorId: actor.id, targetId: dest.id, anim: 'heal', power: applied.gained }
  };
}
