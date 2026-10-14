// ASHENREACH smoke test — boots the real server, opens 2 WebSocket clients,
// runs the join → sync → move → chat flow and prints PASS/FAIL lines.
// Usage: node tools/smoke.mjs   (from game/)
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import WebSocket from 'ws';

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
let failures = 0;

function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !extra ? '' : ' — ' + extra}`);
  if (!ok) failures++;
}

function connectWs() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function send(ws, ev, data) {
  ws.send(JSON.stringify({ ev, data }));
}

/** Resolve the next envelope matching ev (with timeout). */
function expect(ws, ev, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${ev}`)), timeoutMs);
    const onMsg = (raw) => {
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.ev === ev) {
        clearTimeout(timer);
        ws.off('message', onMsg);
        resolve(msg.data);
      } else if (msg.ev === 'session:error') {
        clearTimeout(timer);
        ws.off('message', onMsg);
        reject(new Error(`session:error ${msg.data?.code}: ${msg.data?.message}`));
      }
    };
    ws.on('message', onMsg);
  });
}

/** Collect every envelope of the given type for a window. */
function collect(ws, ev, ms) {
  return new Promise((resolve) => {
    const got = [];
    const onMsg = (raw) => {
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.ev === ev) got.push(msg.data);
    };
    ws.on('message', onMsg);
    setTimeout(() => { ws.off('message', onMsg); resolve(got); }, ms);
  });
}

async function waitForServer(timeoutMs = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await sleep(150);
  }
  throw new Error('server did not come up');
}

// ── boot ───────────────────────────────────────────────────────────────────
const server = spawn(process.execPath, ['server/src/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[server:err] ${d}`));

const killServer = () => { try { server.kill('SIGKILL'); } catch {} };
process.on('exit', killServer);

let ws1, ws2;
try {
  await waitForServer();
  check('server boots + /api/health', true);

  // static serving
  const indexRes = await fetch(`${BASE}/`);
  const indexHtml = await indexRes.text();
  check('GET / serves index.html', indexRes.status === 200 && indexHtml.includes('ASHENREACH'), `status=${indexRes.status}`);

  const themeRes = await fetch(`${BASE}/theme.css`);
  check('GET /theme.css serves css', themeRes.status === 200 && (themeRes.headers.get('content-type') || '').includes('text/css'));

  const fontRes = await fetch(`${BASE}/fonts/Cinzel.woff2`);
  check('GET /fonts/Cinzel.woff2 serves font', fontRes.status === 200 && (fontRes.headers.get('content-type') || '').includes('font'));

  const missing = await fetch(`${BASE}/nope.js`);
  check('missing asset 404s', missing.status === 404);

  const inviteRes = await fetch(`${BASE}/api/invite`, { method: 'POST' });
  const invite = await inviteRes.json();
  check('POST /api/invite returns {url, code}', inviteRes.status === 200 && !!invite.code && invite.url === `/j/${invite.code}`, JSON.stringify(invite));

  const spaRes = await fetch(`${BASE}/j/${invite.code}`);
  check('GET /j/<code> serves index.html (invite link)', spaRes.status === 200 && (await spaRes.text()).includes('ASHENREACH'));

  const mapRes = await fetch(`${BASE}/api/map/ashen_cellar`);
  const map = await mapRes.json();
  check('GET /api/map/ashen_cellar returns map def', mapRes.status === 200 && map.id === 'ashen_cellar');
  const worldRes = await fetch(`${BASE}/api/map/ashen_reach`);
  const world = await worldRes.json();
  check('GET /api/map/ashen_reach returns generated world content',
    worldRes.status === 200 && world.id === 'ashen_reach' &&
    world.pointsOfInterest?.some(point => point.kind === 'inn') &&
    world.exits?.some(exit => exit.destinationMapId === 'ashen_cellar'));

  // ── two clients join ────────────────────────────────────────────────
  ws1 = await connectWs();
  check('ws client 1 connects to /ws', true);

  const sync1P = expect(ws1, 'state:sync');
  send(ws1, 'session:join', {
    invite: invite.code, name: 'Osric', archetype: 'warden',
    character: {
      name: 'Osric', race: 'Human', class: 'Fighter', level: 1,
      abilities: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
      equipmentOverrides: { items: [
        { name: 'Chain Mail', qty: 1, kind: 'armor' },
        { name: 'Longsword', qty: 1, kind: 'weapon' },
        { name: 'Shield', qty: 1, kind: 'shield' },
        { name: 'Crossbow, Light', qty: 1, kind: 'weapon' },
        { name: 'Potion of Healing', qty: 2, kind: 'gear', weight: 0.5 },
      ] },
    },
  });
  const sync1 = await sync1P;
  check('client 1 state:sync (you + state)', !!sync1.you?.id && !!sync1.state?.tokens?.length &&
    sync1.state.players.length === 1 && sync1.state.mapId === 'ashen_reach',
  JSON.stringify(sync1).slice(0, 120));
  check('sync includes map def + version', !!sync1.map?.id && typeof sync1.version === 'number');
  check('new player spawns at the town center',
    sync1.map?.id === 'ashen_reach' &&
    sync1.state.tokens.some(token => token.ownerId === sync1.you.id &&
      Math.hypot(token.x - sync1.map.spawns.party[0][0] * 5,
        token.z - sync1.map.spawns.party[0][1] * 5) < 12));

  ws2 = await connectWs();
  const sync2P = expect(ws2, 'state:sync');
  const patch1P = collect(ws1, 'state:patch', 1200);
  send(ws2, 'session:join', { invite: invite.code, name: 'Vael', archetype: 'ashen_mage' });
  const sync2 = await sync2P;
  check('client 2 state:sync sees both players', sync2.state.players.length === 2 &&
    sync2.state.tokens.filter(t => t.kind === 'player').length === 2);

  const patches1 = await patch1P;
  check('client 1 receives presence state:patch', patches1.some(p => p.players?.length === 2));

  const equipPatchP = expect(ws1, 'state:patch');
  send(ws1, 'intent:sheet', { op: 'equip', itemId: 'Shield' });
  const equipPatch = await equipPatchP;
  const equippedToken = equipPatch.tokens?.find(t => t.ownerId === sync1.you.id);
  check('intent:sheet equip changes shield AC and broadcasts state', equippedToken?.sheet?.shield === false &&
    equippedToken.ac === sync1.state.tokens.find(t => t.ownerId === sync1.you.id).ac - 2);

  const usePatchP = expect(ws1, 'state:patch');
  const potionRollP = expect(ws1, 'roll:show');
  send(ws1, 'intent:sheet', { op: 'use', itemId: 'Potion of Healing' });
  const [usePatch, potionRoll] = await Promise.all([usePatchP, potionRollP]);
  const usedToken = usePatch.tokens?.find(t => t.ownerId === sync1.you.id);
  const potion = usedToken?.sheet?.inventory?.find(i => i.name === 'Potion of Healing');
  check('intent:sheet use consumes the selected potion and rolls its SRD effect', potion?.qty === 1 &&
    potionRoll.formula === '2d4+2' && potionRoll.rolls?.length === 2);

  // ── movement ripple ─────────────────────────────────────────────────
  const movePatches = collect(ws2, 'state:patch', 900);
  const ownMovePatches = collect(ws1, 'state:patch', 250);
  const me1 = sync1.state.tokens.find(t => t.kind === 'player');
  send(ws1, 'intent:move', { x: me1.x + 4, z: me1.z - 3, rotY: 1.2 });
  const [receivedMovePatches, receivedOwnMovePatches] = await Promise.all([movePatches, ownMovePatches]);
  const moved = receivedMovePatches.filter(p => Array.isArray(p.tokens));
  const tok1After = moved[moved.length - 1]?.tokens?.find(t => t.id === me1.id);
  check('intent:move broadcasts token patch', !!tok1After && Math.abs(tok1After.x - (me1.x + 4)) < 0.01,
    JSON.stringify(tok1After).slice(0, 100));
  check('intent:move does not echo token snapshot to predicting client',
    !receivedOwnMovePatches.some(p => Array.isArray(p.tokens)), JSON.stringify(receivedOwnMovePatches));

  // ── chat ripple ─────────────────────────────────────────────────────
  const chatP = collect(ws2, 'state:patch', 900);
  send(ws1, 'chat:say', { text: 'hail, ash-walker' });
  const chatPatches = (await chatP).filter(p => p.chat);
  const said = chatPatches[chatPatches.length - 1]?.chat?.slice(-1)[0];
  check('chat:say broadcasts chat patch', !!said && said.text === 'hail, ash-walker' && said.from === 'Osric');

  // ── DM command gate ─────────────────────────────────────────────────
  const dmErrP = expect(ws2, 'session:error').catch(() => null); // ws2 is a player
  const dmWatch = collect(ws1, 'state:patch', 600);
  send(ws2, 'dm:cmd', { op: 'weather', payload: { type: 'storm' } });
  await sleep(400);
  const dmPatches = await dmWatch;
  check('dm:cmd from player ignored', dmPatches.length === 0);
  const _ignored = await dmErrP; // may or may not emit an error; gate is the assert

  // bad invite rejected
  const ws3 = await connectWs();
  const badP = expect(ws3, 'session:error');
  send(ws3, 'session:join', { invite: 'wrong1', name: 'Imposter' });
  const bad = await badP;
  check('wrong invite code → session:error', bad.code === 'bad_invite');
  ws3.close();

  // reconnect by resumeId
  const ws1b = await connectWs();
  const resumeP = expect(ws1b, 'state:sync');
  send(ws1b, 'session:join', { resumeId: sync1.you.id, name: 'Osric' });
  const resumed = await resumeP;
  check('resumeId reconnects with same identity', resumed.you?.id === sync1.you.id &&
    resumed.state.players.some(p => p.id === sync1.you.id && p.online));
  const resumedToken = resumed.state.tokens.find(t => t.ownerId === sync1.you.id);
  check('reconnect preserves equipped state and remaining potion', resumedToken?.sheet?.shield === false &&
    resumedToken.sheet.inventory.find(i => i.name === 'Potion of Healing')?.qty === 1);
  ws1b.close();

  // ── P3.3 streamed world: region crossing + REST region fetch ────────
  {
    const syncWorld = sync1.state.world;
    check('state:sync carries streamed world info',
      !!syncWorld && syncWorld.focus.rx === 0 && syncWorld.focus.rz === 0 &&
      syncWorld.regionW === 112 && syncWorld.regionH === 96, JSON.stringify(syncWorld));
    const regionRes = await fetch(`${BASE}/api/map/w1_0`);
    const region1 = await regionRes.json();
    check('GET /api/map/w1_0 serves the streamed east region',
      regionRes.status === 200 && region1.id === 'w1_0' && region1.region?.rx === 1 &&
      Array.isArray(region1.cells.water) && region1.terrain?.heightFt?.length > 10000,
      JSON.stringify({ id: region1.id, region: region1.region }));
    // walk east until the token crosses into region (1,0) (world x = 560 ft)
    const walker = sync1.state.tokens.find(token => token.ownerId === sync1.you.id);
    const startX = walker.x;
    let focusPatch = null;
    let crossedX = startX;
    for (let x = startX; x <= startX + 420 && !focusPatch; x += 45) {
      await sleep(70);
      send(ws1, 'intent:move', { x, z: walker.z, rotY: 0 });
      const batch = await collect(ws1, 'state:patch', 140);
      focusPatch = batch.find(p => p.world && p.world.focus && (p.world.focus.rx !== 0 || p.world.focus.rz !== 0));
      crossedX = x;
    }
    check('walking east crosses the region border and shifts world focus',
      !!focusPatch && focusPatch.world.focus.rx === 1 && focusPatch.mapId === 'w1_0',
      JSON.stringify(focusPatch && { mapId: focusPatch.mapId, focus: focusPatch.world.focus }));
    // walk back west: the focus must return to the home region and the token
    // must settle near its start before the cemetery route below runs
    const watchHome = collect(ws2, 'state:patch', 30000);  // ws2 observes; the mover is excluded from its own token echoes
    for (let x = crossedX - 45; x >= startX - 12; x -= 45) {
      await sleep(75);
      send(ws1, 'intent:move', { x, z: walker.z, rotY: 0 });
    }
    const homePatches = await watchHome;
    check('walking west restores the home region focus',
      homePatches.some(p => p.world && p.world.focus && p.world.focus.rx === 0 && p.world.focus.rz === 0),
      JSON.stringify(homePatches.find(p => p.world)?.world?.focus));
    const homeToken = homePatches.filter(p => Array.isArray(p.tokens)).at(-1)?.tokens
      ?.find(t => t.ownerId === sync1.you.id);
    check('party walked home to the town area',
      !!homeToken && Math.abs(homeToken.x - startX) <= 32,
      JSON.stringify({ x: homeToken?.x, startX }));
  }

  // ── town → cemetery crypt → overworld round trip ──────────────────────
  const cryptEntrance = sync1.map.exits?.find(exit => exit.destinationMapId === 'ashen_cellar');
  const startToken = sync1.state.tokens.find(token => token.ownerId === sync1.you.id);
  const gate = { x: cryptEntrance.x * 5, z: cryptEntrance.z * 5 };
  const distance = Math.hypot(gate.x - startToken.x, gate.z - startToken.z);
  const steps = Math.ceil(distance / 40);
  for (let step = 1; step <= steps; step++) {
    await sleep(60);
    const progressP = expect(ws2, 'state:patch');
    send(ws1, 'intent:move', {
      x: startToken.x + (gate.x - startToken.x) * step / steps,
      z: startToken.z + (gate.z - startToken.z) * step / steps,
      rotY: 0,
    });
    await progressP;
  }
  await sleep(60);
  const enterP = expect(ws1, 'state:patch');
  send(ws1, 'intent:exit', { exitId: cryptEntrance.id });
  const dungeon = await enterP;
  check('town cemetery entrance leads into the crypt',
    dungeon.mapId === 'ashen_cellar' && dungeon.map?.id === 'ashen_cellar');

  const dungeonToken = dungeon.tokens.find(token => token.ownerId === sync1.you.id);
  const wall = dungeon.map.cells.wall.reduce((nearest, cell) => {
    const candidate = { x: cell[0] * 5 + 2.5, z: cell[1] * 5 + 2.5 };
    return Math.hypot(candidate.x - dungeonToken.x, candidate.z - dungeonToken.z) <
      Math.hypot(nearest.x - dungeonToken.x, nearest.z - dungeonToken.z) ? candidate : nearest;
  }, { x: Infinity, z: Infinity });
  const rejP = expect(ws1, 'move:rejected');
  send(ws1, 'intent:move', { x: wall.x, z: wall.z, rotY: 0 });
  const rej = await rejP.catch(() => null);
  check('move into dungeon wall cell rejected', !!rej && rej.reason === 'blocked' && !!rej.position, JSON.stringify(rej));

  const dungeonExit = dungeon.map.exits?.find(exit => exit.returnToPrevious);
  await sleep(60);
  const exitMoveP = expect(ws2, 'state:patch');
  send(ws1, 'intent:move', { x: dungeonExit.x * 5, z: dungeonExit.z * 5, rotY: 0 });
  await exitMoveP;
  const overworldPatchP = expect(ws1, 'state:patch');
  send(ws1, 'intent:exit', { exitId: dungeonExit.id });
  const overworld = await overworldPatchP;
  check('crypt exit returns the party to the overworld',
    overworld.mapId === 'ashen_reach' && overworld.map?.id === 'ashen_reach' &&
    overworld.tokens?.some(token => token.ownerId === sync1.you.id));

  const returnEntrance = overworld.map.exits.find(exit => exit.destinationMapId === 'ashen_cellar');
  const returnMoveP = expect(ws2, 'state:patch');
  send(ws1, 'intent:move', { x: returnEntrance.x * 5, z: returnEntrance.z * 5, rotY: 0 });
  await returnMoveP;
  const reenterP = expect(ws1, 'state:patch');
  send(ws1, 'intent:exit', { exitId: returnEntrance.id });
  const reentered = await reenterP;
  check('crypt entrance can be used again from the overworld',
    reentered.mapId === 'ashen_cellar' && reentered.map?.id === 'ashen_cellar');
} catch (e) {
  check('flow completed without exception', false, e?.message || e);
} finally {
  try { ws1?.close(); ws2?.close(); } catch {}
  killServer();
  await sleep(150);
}

console.log(failures === 0 ? '\nALL SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
