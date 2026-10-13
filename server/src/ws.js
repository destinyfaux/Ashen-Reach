// ASHENREACH — WebSocket transport layer ('ws' package, zero frameworks).
// One socket per client. Envelope: JSON { ev: '<event>', data: {...} }.
// Event names are FROZEN per docs/CONTRACTS.md.
//
//   client → server : session:join, session:leave, intent:move, intent:action,
//                     intent:endTurn, intent:dialog, intent:sheet, dm:cmd, chat:say
//   server → client : state:sync, state:patch, fx:action, roll:show, prompt,
//                     session:error
import { WebSocketServer } from 'ws';

export function attachWs(server, gm) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const byUser = new Map();          // userId -> Set<WebSocket> (resume = new socket, same user)

  const send = (ws, ev, data) => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ ev, data }));
  };
  const sendToUser = (userId, ev, data) => {
    const set = byUser.get(userId);
    if (set) for (const ws of set) send(ws, ev, data);
  };
  const broadcast = (ev, data, exceptUserId = null, exceptSocket = null) => {
    for (const [uid, set] of byUser) {
      if (uid === exceptUserId) continue;
      const personal = { ...data };
      if (data.tokens) personal.tokens = gm.tokensForUser(uid);
      if (data.players) personal.players = [...new Map(data.players.map((p) => [p.id, p])).values()];
      if (data.map) personal.map = gm.getPublicMap(uid);
      if (data.doors || data.map) personal.doors = gm.doorsForUser(uid);
      if (Object.hasOwn(data, 'initiative')) personal.initiative = gm.initiativeForUser(uid);
      for (const ws of set) if (ws !== exceptSocket) send(ws, ev, personal);
    }
  };

  // Hooks the rules engine (T2-b) uses to push fx / rolls / prompts / patches.
  gm.net = { sendToUser, broadcast };

  const detach = (ws) => {
    const userId = ws.__userId;
    if (!userId) return;
    ws.__userId = null;
    const set = byUser.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      byUser.delete(userId);
      gm.leave(userId);
      broadcast('state:patch', { version: gm.state.version, players: gm.state.players, tokens: gm.state.tokens });
    }
  };

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      const { ev, data } = msg || {};
      if (typeof ev !== 'string') return;
      handle(ws, ev, data || {});
    });
    ws.on('close', () => detach(ws));
    ws.on('error', () => { /* close fires after */ });
  });

  function handle(ws, ev, data) {
    const userId = ws.__userId;

    switch (ev) {
      // ── session lifecycle ────────────────────────────────────────────
      case 'session:join': {
        if (userId) return; // already joined on this socket
        const r = gm.join(data);
        if (!r.ok) {
          send(ws, 'session:error', { code: r.code || 'rejected', message: r.message || 'Rejected.' });
          return;
        }
        ws.__userId = r.you.id;
        if (!byUser.has(r.you.id)) byUser.set(r.you.id, new Set());
        byUser.get(r.you.id).add(ws);
        // full snapshot to the joiner (frozen 'state:sync' contract)
        send(ws, 'state:sync', {
          you: r.you,
          version: gm.state.version,
          state: gm.getPublicState(r.you.id),
          map: gm.getPublicMap(r.you.id)
        });
        gm.checkUnassistedDowned?.();
        // presence ripple to everyone else
        broadcast('state:patch',
          { version: gm.state.version, players: gm.state.players, tokens: gm.state.tokens },
          r.you.id);
        return;
      }

      case 'session:leave': {
        detach(ws);
        return;
      }

      // ── intents ──────────────────────────────────────────────────────
      case 'intent:move': {
        if (!userId) return;
        const r = gm.move(userId, data);
        if (r.ok) {
          // The mover already predicts its own position locally; echoing the
          // full token snapshot back at 10 Hz only repeats actor/HUD work.
          // Combat movement still needs its authoritative remaining budget.
          if (gm.state.initiative) {
            sendToUser(userId, 'state:patch', {
              version: gm.state.version,
              initiative: gm.initiativeForUser(userId)
            });
          }
          broadcast('state:patch', {
            version: gm.state.version,
            tokens: gm.state.tokens,
            initiative: gm.state.initiative
          }, null, ws);
        } else if (r.reason !== 'too_fast' && r.position) {
          send(ws, 'move:rejected', { reason: r.reason, position: r.position });
        }
        return;
      }

      case 'intent:door': {
        if (!userId) return;
        const result = gm.interactDoor(userId, data.wallIndex);
        if (!result.ok) {
          const message = result.reason === 'locked' ? 'The door is locked.'
            : result.reason === 'too_far' ? 'Move closer to interact with the door.'
              : 'There is no door there.';
          send(ws, 'prompt', { kind: 'notice', text: message });
        }
        return;
      }

      case 'intent:exit': {
        if (!userId) return;
        const result = gm.useExit(userId, data.exitId);
        if (!result.ok) {
          const message = result.reason === 'too_far' ? 'Move closer to the exit.'
            : result.reason === 'in_combat' ? 'You cannot leave while an encounter is active.'
              : result.reason === 'actor_down' ? 'You cannot use the exit while down.'
                : 'That exit is unavailable.';
          send(ws, 'prompt', { kind: 'notice', text: message });
        }
        return;
      }

      case 'net:ping':
        if (userId) send(ws, 'net:pong', { sentAt: data.sentAt });
        return;

      case 'intent:action':    // CombatEngine (T2-b) resolves these three;
      case 'intent:endTurn':   // forwarded via the hook until it lands.
      case 'intent:dialog':
      case 'intent:sheet': {
        if (!userId) return;
        if (typeof gm.onIntent === 'function') {
          try { gm.onIntent(userId, ev, data); } catch (e) { console.error('[ws] onIntent', ev, e); }
        } else {
          console.log(`[ws] ${ev} received (rules engine not wired yet)`);
        }
        return;
      }

      case 'chat:say': {
        if (!userId) return;
        if (gm.say(userId, data.text)) {
          broadcast('state:patch', { version: gm.state.version, chat: gm.state.chat });
        }
        return;
      }

      // ── DM commands ──────────────────────────────────────────────────
      case 'dm:cmd': {
        if (!userId || !gm.isDM(userId)) return;
        const r = gm.dmCommand(data);
        if (r && r.error) {
          send(ws, 'session:error', { code: 'dm', message: r.error });
          return;
        }
        const op = String(data.op || '');
        if (op === 'weather' || op === 'daynight') {
          broadcast('state:patch', {
            version: gm.state.version,
            dayNight: gm.getDayNight ? gm.getDayNight() : gm.state.dayNight, weather: gm.state.weather
          });
        } else if (op === 'map') {
          broadcast('state:patch', {
            version: gm.state.version,
            mapId: gm.state.mapId, mapName: gm.state.mapName,
            map: gm.getMap(), tokens: gm.state.tokens, doors: gm.state.doors
          });
        } else if (op === 'door') {
          broadcast('state:patch', { version: gm.state.version, doors: gm.state.doors });
        } else { // spawn / remove
          broadcast('state:patch', { version: gm.state.version, tokens: gm.state.tokens });
        }
        return;
      }

      default:
        console.log(`[ws] unknown event: ${ev}`);
    }
  }

  return wss;
}
