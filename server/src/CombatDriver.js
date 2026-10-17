// ASHENREACH — CombatDriver: glues the rules engine into GameManager's world.
// Owns: combat lifecycle (start → turns → end), monster auto-turns (MonsterAI),
// player intent handling (attack/cast/dash/dodge/endTurn), fx/roll broadcasts,
// encounter awareness, and the AI-DM DirectorAI beat after each round.
// Transport-agnostic: pushes through gm.net (set by ws.js) + gm.commit().
import * as CE from './rules/CombatEngine.js';
import { toggleEquipment, shortRest, longRest } from './rules/CharacterEngine.js';
import { awardVictoryRewards } from './rules/Rewards.js';
import { chooseAction, buildMonsterToken } from './rules/MonsterAI.js';
import { think as directorThink } from './rules/DirectorAI.js';
import { routeStep, aStarPath } from './rules/Nav.js';
import { thinkAmbient, AMBIENT } from './rules/MonsterAmbient.js';
import { lightLevelAt, effectiveVisionFt, torchPointsFromTokens } from './rules/Light.js';

const ALERT_CALL_FT = 40;
const MONSTER_TURN_MS = 1150;  // cinematic beat before a monster acts
const BETWEEN_TURNS_MS = 620;  // beat between turns (lets fx play)
const PLAYER_TURN_TIMEOUT_MS = 150_000;
const TURN_WARN_MS = 30_000;   // turn-clock warning beat before the timeout yanks the turn
const CELL_FT = 5;

function lineBlocked(a, b, walls) {
  const rx = b.x - a.x, rz = b.z - a.z;
  for (const wall of walls || []) {
    if (wall.type === 'window' || (wall.isOpen && (wall.type === 'door' || wall.type === 'secret_door'))) continue;
    const sx = (wall.x2 - wall.x1) * CELL_FT, sz = (wall.z2 - wall.z1) * CELL_FT;
    const qx = wall.x1 * CELL_FT - a.x, qz = wall.z1 * CELL_FT - a.z;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-8) continue;
    const t = (qx * sz - qz * sx) / den;
    const u = (qx * rz - qz * rx) / den;
    if (t > 0.02 && t < 0.98 && u >= 0 && u <= 1) return true;
  }
  return false;
}

function canHear(source, listener, radiusFt, walls) {
  const distance = Math.hypot(source.x - listener.x, source.z - listener.z);
  let remaining = radiusFt;
  for (const wall of walls || []) {
    if (wall.type === 'window') continue;
    if ((wall.type === 'door' || wall.type === 'secret_door') && wall.isOpen) continue;
    if (!lineBlocked(source, listener, [wall])) continue;
    remaining -= wall.type === 'door' || wall.type === 'secret_door' ? 35 : 30;
    if (remaining <= 0) return false;
  }
  return distance <= remaining;
}

// figure archetypes the client rig can render (server-side mapping only)
const FIGURE_BY_TYPE = {
  undead: 'skeleton', monstrosity: 'skeleton', giant: 'skeleton',
  aberration: 'wraith', fiend: 'wraith', celestial: 'wraith',
};
function figureFor(entry, fallback = 'skeleton') {
  const t = String(entry?.type || '').toLowerCase();
  if (FIGURE_BY_TYPE[t]) return FIGURE_BY_TYPE[t];
  const n = String(entry?.name || '').toLowerCase();
  if (/wraith|specter|ghost|shadow|phantom|spirit/.test(n)) return 'wraith';
  return fallback;
}

export function attachCombat(gm) {
  if (gm.__combat) return;
  gm.__combat = true;
  gm.__combatEngine = CE;   // GameManager.__combatMove delegates through this

  // ── opportunity attacks (SRD): after any voluntary in-combat move, each
  // hostile that the mover LEFT the reach of gets one reaction attack.
  // Both directions run through this hook (GameManager.move → onCombatMove;
  // monster turns call it directly below). Auto-resolved — house automation.
  gm.onCombatMove = (mover, from) => {
    if (!CE.combatActive(gm.state)) return;
    let oas = [];
    try { oas = CE.opportunityAttacks(gm.state, mover, Number(from?.x), Number(from?.z)); } catch { return; }
    for (const oa of oas) {
      const attacker = gm.tokenById(oa.attackerId);
      if (!attacker || attacker.reactionUsed) continue;
      const req = { kind: 'attack', slot: 'reaction', opportunity: true, targetId: mover.id, weaponName: oa.weaponName };
      let res = null;
      try { res = CE.resolveAction(gm.state, attacker, req); } catch (e) { console.warn('[GM] OA failed', e.message); continue; }
      if (res?.ok) attacker.reactionUsed = true;   // one reaction per round (RAW)
      broadcastOutcome(attacker, req, res);
      gm.commit({ tokens: gm.state.tokens, chat: gm.state.chat });
      gm.checkUnassistedDowned();
      if (checkCombatEnd()) return;
    }
  };

  // filesystem handles are injected by GameManager (avoids duplicate imports)
  const fs = gm.__fs;
  const path = gm.__path;
  let idx = null;
  gm.monsterEntry = (idOrName) => {
    if (!idx) {
      try {
        idx = JSON.parse(fs.readFileSync(
          path.resolve(gm.__dirname, 'data/monsters_index.json'), 'utf-8'));
        if (!Array.isArray(idx)) idx = idx.monsters || Object.values(idx);
      } catch (e) {
        console.warn('[GM] monsters_index unavailable:', e.message);
        idx = [];
      }
    }
    const q = String(idOrName).toLowerCase();
    return idx.find((m) => String(m.id).toLowerCase() === q)
      || idx.find((m) => String(m.name).toLowerCase() === q)
      || null;
  };

  let turnTimer = null;
  let warnTimer = null;
  const clearTimer = () => {
    if (turnTimer) { clearTimeout(turnTimer); turnTimer = null; }
    if (warnTimer) { clearTimeout(warnTimer); warnTimer = null; }
  };

  const liveCombatants = () =>
    gm.state.tokens.filter((t) =>
      (t.kind === 'player' || t.kind === 'monster') &&
      !t.deathSaves?.dead && t.hp > 0);

  // ── fx / rolls plumbing ─────────────────────────────────────────────────
  function broadcastOutcome(actor, req, res) {
    if (!res?.ok) {
      const owner = gm.playerById(actor.ownerId);
      if (owner) {
        const messages = {
          action_used: 'Your action is already spent this turn.',
          actor_down: 'You cannot act while downed.',
          bonus_used: 'Your bonus action is already spent this turn.',
          no_target: 'Choose a target first.',
          no_weapon: 'You have no available weapon for that attack.',
          not_your_turn: 'It is not your turn.',
          out_of_range: `That target is out of range${res.detail?.maxReachFt != null ? ` (maximum ${res.detail.maxReachFt} ft)` : ''}.`,
          target_dead: 'That target is already dead.',
          target_down: 'That target is down and cannot be attacked.',
          target_unavailable: 'Choose a valid visible foe from the current encounter.',
        };
        gm.net?.sendToUser(owner.id, 'prompt', {
          kind: 'notice',
          text: messages[res?.reason] || `That action could not be completed (${res?.reason || 'refused'}).`,
        });
      }
      return;
    }
    const r = res.result || {};
    const fx = r.fx || (req.kind === 'cast'
      ? { actorId: actor.id, targetId: req.targetId, anim: 'spell', ms: 520 }
      : req.kind === 'attack'
        ? { actorId: actor.id, targetId: req.targetId, anim: 'lunge', ms: 320 }
        : { actorId: actor.id, anim: 'buff', ms: 260 });
    gm.net?.broadcast('fx:action', { actorId: fx.actorId ?? actor.id, action: fx, result: r });

    // public dice: attack rolls + damage rolls
    for (const shot of r.attacks || []) {
      if (shot.attackRoll) {
        gm.net?.broadcast('roll:show', {
          formula: shot.attackRoll.formula, rolls: shot.attackRoll.rolls,
          total: shot.attackRoll.total, tag: `${actor.name} attacks`, nat: shot.attackRoll.nat,
        });
      }
      if (shot.damage) {
        gm.net?.broadcast('roll:show', {
          formula: shot.damage.formula, rolls: shot.damage.rolls,
          total: shot.damage.total, tag: `damage (${shot.damage.type || 'hit'})`,
          crit: !!shot.damage.crit,
        });
      }
    }
    if (r.attackRoll) {
      gm.net?.broadcast('roll:show', {
        formula: r.attackRoll.formula, rolls: r.attackRoll.rolls,
        total: r.attackRoll.total, tag: `${actor.name} ${req.kind}`, nat: r.attackRoll.nat,
      });
    }
    if (r.damage && !r.attacks) {
      gm.net?.broadcast('roll:show', {
        formula: r.damage.formula, rolls: r.damage.rolls,
        total: r.damage.total, tag: `damage (${r.damage.type || req.kind})`,
        crit: !!r.damage.crit,
      });
    }
    if (r.healing) {
      gm.net?.broadcast('roll:show', {
        formula: r.healing.formula, rolls: r.healing.rolls,
        total: r.healing.total, tag: `${actor.name} uses a healing item`,
      });
    }
    for (const line of r.chat || []) gm.narrate(String(line), '#b8952f');
  }

  function hasLivingHelper(downed) {
    return gm.state.tokens.some((token) =>
      token.kind === 'player' && token.id !== downed.id && token.hp > 0 &&
      !token.deathSaves?.dead && gm.playerById(token.ownerId)?.online);
  }

  gm.checkUnassistedDowned = () => {
    for (const token of gm.state.tokens) {
      if (token.kind !== 'player') continue;
      const owner = gm.playerById(token.ownerId);
      if (!owner?.online) continue;
      if (token.deathSaves?.dead) {
        if (!token.adventureEnded) {
          token.adventureEnded = true;
          const profile = gm.playerProfiles.get(owner.id);
          if (profile) profile.token = token;
          gm.net?.sendToUser(owner.id, 'prompt', {
            kind: 'character-ended', title: 'The adventure ends',
            text: `${token.name} has died. This character cannot return to this session.`,
            options: [{ label: 'Return to the main menu', action: 'return-menu' }],
          });
        }
        continue;
      }
      if (token.hp > 0) continue;
      if (hasLivingHelper(token)) {
        if (token.soloDeathPrompted) {
          delete token.soloDeathPrompted;
          gm.net?.sendToUser(owner.id, 'prompt', { kind: 'solo-down-cancel' });
        }
        continue;
      }
      if (token.soloDeathPrompted) continue;
      token.soloDeathPrompted = true;
      gm.net?.sendToUser(owner.id, 'prompt', {
        kind: 'solo-down', title: 'No one can reach you',
        text: 'You are down, and no living adventurer is here to help. You cannot move. You may wait for someone to arrive, or end this character’s adventure.',
        options: [{ label: 'End this adventure', action: 'accept-death' }],
      });
    }
  };

  // ── lifecycle ───────────────────────────────────────────────────────────
  gm.startCombat = (opts = {}) => {
    if (CE.combatActive(gm.state)) return;
    const participants = Array.isArray(opts.participants) ? new Set(opts.participants) : null;
    const pool = liveCombatants().filter((t) => !participants || participants.has(t.id));
    if (pool.length < 2) { gm.narrate('No foes worth crossing steel with.', '#8a8378'); return; }
    clearTimer();
    const order = CE.rollInitiative(pool);
    gm.state.initiative = { order, turnIdx: -1, round: 0, movement: null };
    gm.narrate(opts.auto
      ? 'Something lunges from the dark — initiative!'
      : 'Steel rings out — initiative!');
    for (const t of pool) {
      const p = gm.playerById(t.ownerId);
      if (p && t.initiative != null) {
        // no per-player whisper needed; the strip shows everyone
      }
    }
    gm.commit({ tokens: gm.state.tokens, initiative: gm.state.initiative });
    gm.advanceTurn(true);
  };

  gm.endCombat = (why) => {
    if (!gm.state.initiative) return;
    clearTimer();
    const combatOrder = [...(gm.state.initiative.order || [])];
    const participants = combatOrder.map((id) => gm.tokenById(id)).filter((t) => t?.kind === 'player');
    const combatIds = new Set(combatOrder);
    const defeatedMonsters = gm.state.tokens
      .filter((t) => combatIds.has(t.id) && t.kind === 'monster' && (Number(t.hp) <= 0 || t.deathSaves?.dead))
      .map((t) => ({ ...t, cr: t.cr ?? gm.monsterEntry(t.monsterId)?.cr }));
    const survivors = liveCombatants();
    const players = survivors.filter((t) => t.kind === 'player').length;
    gm.state.initiative = null;
    // sweep the fallen (keep player tokens for death-save drama)
    gm.state.tokens = gm.state.tokens.filter((t) =>
      t.kind === 'player' || t.hp > 0 || t.deathSaves?.stable || (t.deathSaves && !t.deathSaves.dead && t.hp <= 0));
    if (why === 'defeat' || players === 0) {
      gm.narrate('The dark closes in. The party falls…', '#7a1f1f');
    } else if (why === 'victory') {
      gm.narrate('The last of them crumbles. The cellar breathes again.', '#b8952f');
      const rewards = awardVictoryRewards(defeatedMonsters, participants);
      for (const reward of rewards.awards) {
        const levelText = reward.levelsGained
          ? ` Level ${reward.levelsGained === 1 ? 'up' : `up (${reward.levelsGained} levels)`}!`
          : '';
        gm.narrate(`${reward.name} gains ${reward.xp} XP and finds a ${reward.item}.${levelText}`, '#b8952f');
      }
      // DirectorAI aftermath: reward beat / weather shift
      try {
        const ops = directorThink(gm.state, { type: 'combat_end', victory: true }, gm.directorOpts?.());
        applyDirectorOps(ops);
      } catch (e) { console.warn('[GM] director aftermath failed', e.message); }
    } else {
      gm.narrate('The battle falls silent.', '#8a8378');
    }
    gm.commit({ tokens: gm.state.tokens, initiative: null });
  };

  const onRoundEnd = () => {
    const ini = gm.state.initiative;
    try {
      const ops = directorThink(gm.state, { type: 'round_end', round: ini.round }, gm.directorOpts?.());
      applyDirectorOps(ops);
    } catch (e) { console.warn('[GM] director beat failed', e.message); }
  };

  function applyDirectorOps(ops) {
    for (const op of Array.isArray(ops) ? ops : []) {
      try {
        if (!op || !op.op) continue;
        if (op.op === 'chat' || op.op === 'narrate') {
          gm.narrate(String(op.payload?.text || ''), op.payload?.color || '#8a8378');
        } else if (op.op === 'spawn') {
          const entry = gm.monsterEntry(op.payload?.monsterId);
          if (entry) {
            const tok = gm.spawnMonster({
              monsterId: entry.id, x: op.payload.x, z: op.payload.z,
              hidden: !!op.payload.hidden, worldCoords: true,
            });
            if (tok && gm.state.initiative) {
              // late joiner to initiative: highest slot it fits below (5E DM discretion)
              gm.state.initiative.order.push(tok.id);
            }
          }
        } else {
          gm.dmCommand(op);
        }
      } catch (e) { console.warn('[GM] director op failed', op?.op, e.message); }
    }
  }

  gm.advanceTurn = () => {
    const ini = gm.state.initiative;
    if (!ini) return;
    clearTimer();

    // Prune the fallen from the order ONCE, up front. (The old loop spliced
    // while iterating — index bookkeeping that only survives by gymnastics and
    // breaks the moment anything else mutates the order mid-flight.) Dying
    // tokens (hp 0 but not dead) STAY in the order: they take no turn while
    // down, but rejoin the moment they are healed.
    const prevOrder = ini.order;
    const kept = prevOrder.filter((id) => {
      const t = gm.tokenById(id);
      return t && !t.deathSaves?.dead;
    });
    if (kept.length === 0) { gm.endCombat('wipe'); return; }

    // Remap the cursor into the pruned order so removals AHEAD of it cannot
    // shift who acts next. If the actor whose turn just ended was itself
    // pruned (died on its own turn), resume just before its first surviving
    // follower so that follower is next.
    const curId = ini.turnIdx >= 0 && ini.turnIdx < prevOrder.length ? prevOrder[ini.turnIdx] : null;
    let cursor = curId != null ? kept.indexOf(curId) : -1;
    if (cursor === -1 && curId != null) {
      // pruned current actor: next up is its first surviving follower
      const after = prevOrder.indexOf(curId) + 1;
      let follower = -1;                 // kept index of that follower
      for (let i = after; i < prevOrder.length; i++) {
        const k = kept.indexOf(prevOrder[i]);
        if (k !== -1) { follower = k; break; }
      }
      // follower 0 legitimately maps to cursor -1 (land on it without wrapping)
      cursor = follower !== -1 ? follower - 1 : kept.length - 1;  // no follower — wrap below
    }

    ini.order = kept;
    // Walk at most one lap for someone who can act; wrapping past the end of
    // the order starts a new round (AI-DM beat included).
    for (let step = 0; step < ini.order.length; step++) {
      const next = cursor + 1;
      const wrapped = next >= ini.order.length;
      cursor = wrapped ? 0 : next;
      if (wrapped) {
        ini.round++;
        onRoundEnd();
        if (!gm.state.initiative) return;   // director may have ended it
      }
      ini.turnIdx = cursor;
      const t = gm.tokenById(ini.order[cursor]);
      if (t && t.hp > 0) { beginTurnFor(t); return; }
      // dying (hp 0, not dead): no turn while down — keep stepping
    }
    // a full lap found nobody able to act
    gm.endCombat('wipe');
  };

  function beginTurnFor(t) {
    const ini = gm.state.initiative;
    CE.beginTurn(gm.state, t.id);
    gm.commit({ tokens: gm.state.tokens, initiative: ini });
    gm.checkUnassistedDowned();
    if (t.kind === 'monster') {
      gm.narrate(`${t.name} stirs…`, '#8a8378');
      turnTimer = setTimeout(() => gm.monsterAct(t.id), MONSTER_TURN_MS);
    } else {
      const p = gm.playerById(t.ownerId);
      if (p && p.online) {
        gm.net?.sendToUser(p.id, 'prompt', { kind: 'turn', tokenId: t.id, round: ini.round });
        gm.narrate(`${t.name} — thy move.`, '#cfc6b8');
      } else {
        gm.narrate(`${t.name} stares into the dark (away).`, '#8a8378');
        turnTimer = setTimeout(() => gm.advanceTurn(), BETWEEN_TURNS_MS);
        return;
      }
      turnTimer = setTimeout(() => {
        const cur = CE.currentActorId(gm.state);
        if (gm.state.initiative && cur === t.id) {
          gm.narrate(`${t.name}'s moment passes.`, '#8a8378');
          gm.advanceTurn();
        }
      }, PLAYER_TURN_TIMEOUT_MS);
      // one warning per player turn, 30s before the clock runs out
      if (PLAYER_TURN_TIMEOUT_MS > TURN_WARN_MS) {
        warnTimer = setTimeout(() => {
          if (!gm.state.initiative || CE.currentActorId(gm.state) !== t.id) return;
          gm.narrate(`The turn clock winds down — 30 seconds remain for ${t.name}.`);
          // narrate() only mutates state; push the chat log so clients render it
          gm.net?.broadcast('state:patch', { version: gm.state.version, chat: gm.state.chat });
        }, PLAYER_TURN_TIMEOUT_MS - TURN_WARN_MS);
      }
    }
  }

  gm.monsterAct = (tokenId) => {
    const t = gm.tokenById(tokenId);
    const ini = gm.state.initiative;
    if (!t || !ini || CE.currentActorId(gm.state) !== t.id) return;
    const entry = t.monsterId ? gm.monsterEntry(t.monsterId) : null;
    let req = null;
    const combatIds = new Set(ini.order);
    const encounterState = { ...gm.state, tokens: gm.state.tokens.filter((token) => combatIds.has(token.id)) };
    try { req = entry ? chooseAction(encounterState, t, entry) : null; } catch (e) { console.warn('[GM] ai failed', e.message); }
    if (!req) req = { kind: 'dodge', slot: 'action' };
    if (req.move && Number.isFinite(req.move.x) && Number.isFinite(req.move.z)) {
      const prevX = t.x, prevZ = t.z;
      try { CE.attemptMove(gm.state, t, req.move.x, req.move.z); } catch { /* keep going */ }
      try { gm.onCombatMove?.(t, { x: prevX, z: prevZ }); } catch { /* OA is best-effort */ }
    }
    let res = null;
    try { res = CE.resolveAction(gm.state, t, req); } catch (e) {
      console.warn('[GM] monster resolve failed', e.message);
      res = { ok: false, reason: 'engine_error' };
    }
    broadcastOutcome(t, req, res);
    gm.commit({ tokens: gm.state.tokens, initiative: ini });
    gm.checkUnassistedDowned();
    if (checkCombatEnd()) return;
    turnTimer = setTimeout(() => gm.advanceTurn(), BETWEEN_TURNS_MS);
  };

  function checkCombatEnd() {
    if (!gm.state.initiative) return true;
    const combatIds = new Set(gm.state.initiative.order);
    const monsters = gm.state.tokens.filter((t) => combatIds.has(t.id) && t.kind === 'monster' && t.hp > 0 && !t.deathSaves?.dead);
    const players = gm.state.tokens.filter((t) => combatIds.has(t.id) && t.kind === 'player' && t.hp > 0 && !t.deathSaves?.dead);
    if (monsters.length === 0) { gm.endCombat('victory'); return true; }
    if (players.length === 0) { gm.endCombat('defeat'); return true; }
    return false;
  }

  // ── player intents (ws.js forwards: action / endTurn / dialog / sheet) ──
  gm.onIntent = (userId, ev, data) => {
    if (ev === 'intent:action') return playerAction(userId, data || {});
    if (ev === 'intent:endTurn') return playerEndTurn(userId);
    if (ev === 'intent:sheet') return playerSheet(userId, data || {});
    if (ev === 'intent:dialog') { /* M2: NPC dialog trees */ return; }
  };

  function playerSheet(userId, request) {
    const actor = gm.tokenOf(userId);
    if (!actor?.sheet) return { ok: false, reason: 'no_sheet' };
    const refuse = reason => {
      const messages = {
        not_your_turn: 'Gear can only be changed on your turn.',
        action_used: 'No action remains to change that gear this turn.',
        item_not_found: 'That item is not in your satchel.',
        not_equippable: 'That item cannot be equipped.',
        in_combat: 'There is no time to rest while combat rages.',
        hit_dice_unavailable: 'Not enough Hit Dice remain for that rest.',
        nothing_to_recover: 'There is nothing left to recover with a short rest.',
        character_dead: 'The dead cannot rest.',
        actor_down: 'You cannot use items while downed.',
      };
      gm.net?.sendToUser(userId, 'prompt', { kind: 'notice', text: messages[reason] || reason });
      return { ok: false, reason };
    };
    if (actor.hp <= 0) return refuse('actor_down');
    if (actor.deathSaves?.dead || actor.adventureEnded) return refuse('character_dead');
    const op = String(request.op || '');

    if (op === 'equip') {
      const itemName = String(request.itemId || '');
      const item = actor.sheet.inventory?.find(i => String(i.name).trim().toLowerCase() === itemName.trim().toLowerCase());
      if (!item) return refuse('item_not_found');

      let usesAction = false;
      if (CE.combatActive(gm.state)) {
        if (CE.currentActorId(gm.state) !== actor.id) return refuse('not_your_turn');
        usesAction = item.kind !== 'weapon' || !!actor.objectInteractionUsed;
        if (usesAction && actor.actionUsed) return refuse('action_used');
      }

      const result = toggleEquipment(actor.sheet, itemName);
      if (!result.ok) return refuse(result.reason);
      actor.ac = actor.sheet.ac;
      if (CE.combatActive(gm.state)) {
        if (usesAction) actor.actionUsed = true;
        else actor.objectInteractionUsed = true;
      }
      gm.narrate(`${actor.name} ${result.equipped ? 'readies' : 'stows'} ${result.item}.`);
      gm.commit({ tokens: gm.state.tokens, initiative: gm.state.initiative, chat: gm.state.chat });
      return result;
    }

    if (op === 'use') {
      const action = { kind: 'use', itemId: String(request.itemId || ''), targetId: actor.id };
      const result = CE.resolveAction(gm.state, actor, action);
      broadcastOutcome(actor, action, result);
      if (result.ok) {
        gm.commit({ tokens: gm.state.tokens, initiative: gm.state.initiative, chat: gm.state.chat });
      }
      return result;
    }

    if (op === 'shortRest' || op === 'longRest') {
      if (CE.combatActive(gm.state)) return refuse('in_combat');
      if (actor.deathSaves?.dead) return refuse('character_dead');
      const result = op === 'shortRest'
        ? shortRest(actor.sheet, request.hitDice)
        : longRest(actor.sheet);
      if (!result.ok) return refuse(result.reason);
      actor.hp = Number(actor.sheet.hp?.current) || 0;
      actor.hpMax = Number(actor.sheet.hp?.max) || actor.hpMax;
      if (actor.sheet.deathSaves) actor.deathSaves = { ...actor.sheet.deathSaves };
      if (op === 'shortRest' && result.rolls.length) {
        const die = actor.sheet.hitDice?.die || `d${actor.sheet.hp?.hitDie || 8}`;
        const con = Number(actor.sheet.mods?.con) || 0;
        const formula = `${result.rolls.length}${die}${con > 0 ? `+${con}` : con < 0 ? con : ''}`;
        gm.net?.sendToUser(userId, 'roll:show', {
          formula, rolls: result.rolls, total: result.hpGained, tag: 'short rest',
        });
      }
      const resBits = Array.isArray(result.resourcesRecovered) && result.resourcesRecovered.length
        ? `, recovered ${result.resourcesRecovered.map(id => String(id).replace(/_/g, ' ')).join(', ')}`
        : '';
      const arcaneBits = result.arcaneRecovery
        ? ` · Arcane Recovery restores ${Object.entries(result.arcaneRecovery.slots).map(([lvl, n]) => `${n}×${lvl}th`).join(', ')} slots`
        : '';
      const summary = op === 'shortRest'
        ? `${actor.name} takes a short rest: ${result.hpGained} HP restored, ${result.hitDiceSpent} Hit Dice spent${result.slotsRecovered ? `, ${result.slotsRecovered} pact slot${result.slotsRecovered === 1 ? '' : 's'} recovered` : ''}${resBits}${arcaneBits}.`
        : `${actor.name} completes a long rest: ${result.hpGained} HP restored, ${result.hitDiceRegained} Hit Dice recovered, ${result.slotsRecovered} spell slot${result.slotsRecovered === 1 ? '' : 's'} restored${resBits}.`;
      gm.narrate(summary);
      gm.commit({ tokens: gm.state.tokens, chat: gm.state.chat });
      return result;
    }

    return refuse('unknown_sheet_op');
  }

  function playerAction(userId, req) {
    const t = gm.tokenOf(userId);
    if (!t) return { ok: false, reason: 'no_token' };
    const wasInCombat = CE.combatActive(gm.state);
    if (req?.kind === 'acceptDeath') {
      if (t.hp > 0 || t.deathSaves?.dead) return { ok: false, reason: 'not_dying' };
      if (hasLivingHelper(t)) {
        delete t.soloDeathPrompted;
        gm.net?.sendToUser(userId, 'prompt', { kind: 'solo-down-cancel' });
        gm.net?.sendToUser(userId, 'prompt', { kind: 'notice', text: 'A living adventurer is here and can help you.' });
        return { ok: false, reason: 'help_available' };
      }
      const result = CE.finalizeDeath(t);
      if (!result.ok) return result;
      t.adventureEnded = true;
      const profile = gm.playerProfiles.get(userId);
      if (profile) profile.token = t;
      gm.commit({ tokens: gm.state.tokens });
      gm.net?.sendToUser(userId, 'prompt', {
        kind: 'character-ended', title: 'The adventure ends',
        text: `${t.name} has died. This character cannot return to this session.`,
        options: [{ label: 'Return to the main menu', action: 'return-menu' }],
      });
      gm.narrate(`${t.name}'s adventure ends in the darkness.`, '#7a1f1f');
      return { ok: true, dead: true };
    }
    if ((req?.kind === 'attack' || req?.kind === 'cast') && req.targetId) {
      const target = gm.tokenById(String(req.targetId));
      const visible = target && gm.tokensForUser(userId).some((token) => token.id === target.id);
      const active = !wasInCombat || !!target && !!gm.state.initiative?.order?.includes(target.id);
      if (!target || (target.kind === 'monster' && (!visible || !active))) {
        const res = { ok: false, reason: 'target_unavailable' };
        broadcastOutcome(t, req, res);
        return res;
      }
    }
    // out-of-combat strike (surprise / execution) is allowed by the engine
    let res = null;
    try { res = CE.resolveAction(gm.state, t, req); } catch (e) {
      console.warn('[GM] player action failed', e.message);
      return { ok: false, reason: 'engine_error' };
    }
    broadcastOutcome(t, req, res);
    // if a monster was dropped out of combat, no combat bookkeeping needed
    if (gm.state.initiative) {
      gm.commit({ tokens: gm.state.tokens, initiative: gm.state.initiative });
      gm.checkUnassistedDowned();
      if (checkCombatEnd()) return res;
    } else {
      gm.commit({ tokens: gm.state.tokens });
      gm.checkUnassistedDowned();
      if (!wasInCombat && res?.ok && (req.kind === 'attack' || req.kind === 'cast')) {
        gm.checkAmbush({
          x: t.x, z: t.z, actorId: t.id,
          radiusFt: req.kind === 'cast' ? 75 : 60,
        });
      }
    }
    return res;
  }

  function playerEndTurn(userId) {
    const t = gm.tokenOf(userId);
    const ini = gm.state.initiative;
    if (!t || !ini) return { ok: false, reason: 'no_combat' };
    if (CE.currentActorId(gm.state) !== t.id) return { ok: false, reason: 'not_your_turn' };
    gm.advanceTurn();
    return { ok: true };
  }

  // ── sight/hearing awareness and alert propagation ────────────────────────
  // P3.13: sight is light-aware. Light level comes from the shared model in
  // rules/Light.js (dungeon darkness / day clock / map braziers / equipped
  // torches), and each monster's reach is its own SRD senses flip-flopped by
  // that light (normal vision in the light, darkvision in the dark). This is
  // the same rule tokensForUser uses to reveal monster tokens to clients.
  const litAt = (x, z) => lightLevelAt({
    isDungeon: !gm.state.world, x, z,
    timeMin: (gm.getDayNight ? gm.getDayNight() : gm.state.dayNight).time,
    mapLights: gm.map?.lights,
    torchPoints: torchPointsFromTokens(gm.state.tokens),
  });
  gm.checkAmbush = (noise = null) => {
    if (CE.combatActive(gm.state)) return;
    const players = gm.state.tokens.filter((t) => t.kind === 'player' && t.hp > 0 && !t.deathSaves?.dead);
    const monsters = gm.state.tokens.filter((t) => t.kind === 'monster' && t.hp > 0 && !t.deathSaves?.dead && !t.hidden);
    const walls = gm.getWallsWithDoorState?.() || gm.map?.walls || [];
    const detected = new Map();
    const alert = (monster, targetId, source, lastKnown) => {
      if (detected.has(monster.id)) return;
      detected.set(monster.id, { monster, targetId, source, lastKnown });
      gm.monsterAwareness.set(monster.id, {
        state: 'alerted', targetId, source, lastKnown,
        at: Date.now(),
      });
    };

    for (const monster of monsters) {
      const seen = players.find((player) =>
        Math.hypot(monster.x - player.x, monster.z - player.z) <= effectiveVisionFt(monster.senses, litAt(player.x, player.z)) &&
        !lineBlocked(monster, player, walls));
      if (seen) alert(monster, seen.id, 'sight', { x: seen.x, z: seen.z });
      if (noise && canHear(noise, monster, noise.radiusFt, walls)) {
        alert(monster, noise.actorId, 'sound', { x: noise.x, z: noise.z });
      }
    }
    if (!detected.size) return;

    const frontier = [...detected.values()].map((item) => item.monster);
    for (let hop = 0; hop < 2 && frontier.length; hop++) {
      const next = [];
      for (const source of frontier) {
        const sourceAwareness = detected.get(source.id) || gm.monsterAwareness.get(source.id);
        for (const ally of monsters) {
          if (detected.has(ally.id)) continue;
          if (canHear(source, ally, ALERT_CALL_FT, walls)) {
            alert(ally, sourceAwareness?.targetId, 'ally');
            next.push(ally);
          }
        }
      }
      frontier.splice(0, frontier.length, ...next);
    }

    const encounterMonsters = [...detected.values()].map((item) => item.monster);
    const monsterIds = new Set(encounterMonsters.map((monster) => monster.id));
    const sourcePlayerId = noise?.actorId;
    const encounterPlayers = players.filter((player) =>
      player.id === sourcePlayerId || encounterMonsters.some((monster) =>
        Math.hypot(monster.x - player.x, monster.z - player.z) <= effectiveVisionFt(monster.senses, litAt(player.x, player.z)) &&
        !lineBlocked(monster, player, walls)));
    if (encounterPlayers.length) {
      gm.startCombat({
        auto: true,
        participants: [...monsterIds, ...encounterPlayers.map((player) => player.id)],
      });
    }
  };

  // ── P3.4 nav facade (state spreads it into the AI's encounterState) ──────
  // One blocked-predicate source of truth: walls + half-walls + closed doors
  // (isBlockedAt), prop footprints (overlapsLandscapeProp), region/map bounds.
  const navBlocked = (cx, cz) => {
    const x = cx * CELL_FT + CELL_FT / 2, z = cz * CELL_FT + CELL_FT / 2;
    return gm.isBlockedAt(x, z)
      || (typeof gm.overlapsLandscapeProp === 'function' && gm.overlapsLandscapeProp(x, z));
  };
  gm.state.nav = {
    step: (fx, fz, tx, tz, budget) => routeStep(navBlocked, fx, fz, tx, tz, budget, { cellFt: CELL_FT }),
    path: (fx, fz, tx, tz) => aStarPath(navBlocked, fx, fz, tx, tz, { cellFt: CELL_FT }),
  };

  // ── P3.10 ambient tick: out-of-combat monster life (idle/wander/investigate
  // /chase → combat) at AMBIENT.TICK_MS. Perception reuses the encounter
  // rules above (light-aware effectiveVisionFt + lineBlocked). Timer is unref'd
  // so headless tests never hang on the event loop.
  // Timer start is deferred to ws.js (gm.startAmbientTick) so the simulation
  // only ever runs against a real transport — never under tests or doubles.
  gm.__ambientMem = new Map();
  gm.startAmbientTick = () => {
    if (gm.__ambientTimer) return;
    gm.__ambientTimer = setInterval(gm.ambientTick, AMBIENT.TICK_MS);
    gm.__ambientTimer.unref?.();
  };
  gm.ambientTick = () => {
    try {
      if (!gm.map || CE.combatActive(gm.state)) return;
      const players = gm.state.tokens.filter((t) => t.kind === 'player' && t.hp > 0 && !t.deathSaves?.dead);
      if (!players.length) return;
      const walls = gm.getWallsWithDoorState?.() || gm.map.walls || [];
      const monsters = gm.state.tokens.filter((t) =>
        t.kind === 'monster' && t.hp > 0 && !t.deathSaves?.dead && !t.hidden && t.wander !== false);
      let moved = false;
      for (const m of monsters) {
        const ctx = {
          now: Date.now(), rng: Math.random,
          players: players.map((p) => ({ id: p.id, x: p.x, z: p.z, down: p.hp <= 0 || !!p.deathSaves?.dead })),
          visible: (p) => Math.hypot(m.x - p.x, m.z - p.z) <= effectiveVisionFt(m.senses, litAt(p.x, p.z)) && !lineBlocked(m, p, walls),
          blocked: (x, z) => gm.isBlockedAt(x, z)
            || (typeof gm.overlapsLandscapeProp === 'function' && gm.overlapsLandscapeProp(x, z)),
          path: gm.state.nav?.path,
          memory: gm.__ambientMem.get(m.id) || null,
        };
        const out = thinkAmbient(m, ctx);
        gm.__ambientMem.set(m.id, out.memory);
        if (out.engage) {
          // close enough to spring the encounter — full awareness rules apply
          gm.checkAmbush({ x: m.x, z: m.z, actorId: m.id, radiusFt: AMBIENT.AGGRO_FT });
          if (CE.combatActive(gm.state)) return;
          continue;
        }
        if (out.move && Number.isFinite(out.move.x) && Number.isFinite(out.move.z)) {
          if (!gm.isBlockedAt(out.move.x, out.move.z)
            && !(typeof gm.overlapsLandscapeProp === 'function' && gm.overlapsLandscapeProp(out.move.x, out.move.z))
            && !gm.crossesClosedDoor(m, { x: out.move.x, z: out.move.z })) {
            m.x = out.move.x; m.z = out.move.z;
            if (Number.isFinite(out.move.rotY)) m.rotY = out.move.rotY;
            moved = true;
          }
        }
      }
      if (moved) {
        gm.commit({ tokens: gm.state.tokens });
        gm.checkAmbush?.();   // a wandering monster may spot (or be spotted by) the party
      }
    } catch (e) { console.warn('[GM] ambient tick failed', e.message); }
  };

  // ── SRD-backed monster spawning ─────────────────────────────────────────
  gm.spawnMonster = (s = {}) => {
    const entry = s.monsterId ? gm.monsterEntry(s.monsterId) : null;
    let tok;
    if (entry) {
      try {
        tok = buildMonsterToken(entry, {
          id: 'mob_' + Math.random().toString(36).slice(2, 9),
          x: s.worldCoords ? Number(s.x) : Number(s.x) * 5,
          z: s.worldCoords ? Number(s.z) : Number(s.z) * 5,
        });
      } catch (e) {
        console.warn('[GM] SRD spawn failed, falling back:', e.message);
        tok = null;
      }
    }
    if (!tok) return gm.__legacySpawn(s);   // GameManager's makeMonsterToken path
    // flavour overrides from the spawn def
    if (s.name) tok.name = s.name;
    tok.archetype = s.archetype || figureFor(entry);
    if (s.hidden != null) tok.hidden = !!s.hidden;
    if (s.size) tok.size = s.size;
    tok.wander = s.wander !== false;
    tok.monsterId = entry.id;
    tok.portraitSeed = (Math.random() * 1e6) | 0;
    gm.state.tokens.push(tok);
    gm.bump();
    return tok;
  };

  // DM combat controls ride dm:cmd
  const origDm = gm.dmCommand.bind(gm);
  gm.dmCommand = (msg = {}) => {
    if (String(msg.op || '') === 'combat') {
      const p = (msg.payload && typeof msg.payload === 'object') ? msg.payload : msg;
      if (p.action === 'end' || p.mode === 'end') { gm.endCombat('dm'); return { ok: true }; }
      gm.startCombat({ auto: false });
      return { ok: true };
    }
    if (String(msg.op || '') === 'spawn' && (msg.payload?.monsterId || msg.monsterId)) {
      const s = msg.payload && typeof msg.payload === 'object' ? msg.payload : msg;
      const tok = gm.spawnMonster({ ...s, worldCoords: true });
      gm.commit({ tokens: gm.state.tokens });
      return { ok: !!tok };
    }
    return origDm(msg);
  };

  console.log('[GM] combat driver attached (5E SRD engine live)');
}
