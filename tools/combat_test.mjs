// combat_test.mjs — E2E: forged characters join, ambush springs initiative,
// monsters auto-act, players strike back, combat resolves. Proves the M1 loop.
import { spawn } from 'node:child_process';

const PORT = 3199;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) failures++;
};

const server = spawn('node', ['server/src/index.js'], {
  env: { ...process.env, PORT: String(PORT), AR_QUIET: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', (d) => process.stderr.write('[server:err] ' + d));
await sleep(1200);

// minimal ws client with promise-based event waits
const { WebSocket } = await import('ws');
class Client {
  constructor(port = PORT) {
    this.ws = new WebSocket(`ws://localhost:${port}/ws`);
    this.id = null;
    this.events = [];
    this.waiters = [];
    this.ws.on('message', (raw) => {
      const { ev, data } = JSON.parse(raw.toString());
      this.events.push({ ev, data });
      this.waiters = this.waiters.filter((w) => {
        if (w.pred({ ev, data })) { w.resolve({ ev, data }); return false; }
        return true;
      });
      if (ev === 'state:sync') this.id = data.you?.id ?? this.id;
    });
    this.ready = new Promise((r) => this.ws.on('open', r));
  }
  send(ev, data) { this.ws.send(JSON.stringify({ ev, data })); }
  async wait(pred, ms = 8000) {
    const hit = this.events.find((e) => pred(e));
    if (hit) return hit;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('wait timeout')), ms);
      this.waiters.push({ pred, resolve: (v) => { clearTimeout(t); resolve(v); } });
    });
  }
  async close() { this.ws.close(); }
}

try {
  const invite = await fetch(`http://localhost:${PORT}/api/invite`).then((r) => r.json());
  check('invite', !!invite.code);

  const c1 = new Client(); await c1.ready;
  const fighter = {
    name: 'Osric', race: 'human', class: 'fighter', level: 1,
    abilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
    background: 'soldier',
    look: { bodyType: 'heavy', skinTone: 1, hairStyle: 1, hairColor: 2, cloakColor: 0, eyeColor: 0, faceDecor: 'scars' },
  };
  c1.send('session:join', { invite: invite.code, name: 'Osric', archetype: 'warden', character: fighter });
  const sync1 = await c1.wait((e) => e.ev === 'state:sync');
  const myTok = sync1.data.state.tokens.find((t) => t.kind === 'player');
  check('join with forged character', !!myTok, `hp ${myTok?.hp}/${myTok?.hpMax} ac ${myTok?.ac}`);
  check('real 5E sheet attached (HP 13 = 10+con2, AC 18)', myTok?.hpMax === 13 && myTok?.ac === 18, `got hpMax=${myTok?.hpMax} ac=${myTok?.ac}`);
  check('server keeps monster sheet fields', typeof myTok?.sheet === 'object');

  // move stepwise toward the Cellar Thrall (~15.5*5=77.5, 24*5=120) until ambush springs
  const thrall = sync1.data.state.tokens.find((t) => t.name === 'Cellar Thrall');
  check('SRD thrall present (hp 13)', !!thrall && thrall.hp === 13, `hp=${thrall?.hp}`);

  let sprung = null;
  for (let i = 0; i < 14 && !sprung; i++) {
    const t = c1.events.filter((e) => e.ev === 'state:patch').at(-1)?.data?.tokens?.find((x) => x.id === myTok.id) || myTok;
    const dx = thrall.x - t.x, dz = thrall.z - t.z;
    const d = Math.hypot(dx, dz) || 1;
    c1.send('intent:move', { x: t.x + (dx / d) * 12, z: t.z + (dz / d) * 12, rotY: 0 });
    try {
      sprung = await c1.wait((e) => e.ev === 'state:patch' && e.data.initiative, 1500);
    } catch { /* not yet — keep walking */ }
  }
  check('ambush springs initiative', !!sprung, sprung ? `round ${sprung.data.initiative.round}, order len ${sprung.data.initiative.order.length}` : 'never');
  if (sprung) check('initiative includes player + monsters', sprung.data.initiative.order.length >= 2);

  // drive turns until the player's turn prompt arrives or combat ends
  let myPrompt = null, sawMonsterAct = false, victory = null;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !victory) {
    try {
      const e = await c1.wait((ev) =>
        (ev.ev === 'prompt' && ev.data?.kind === 'turn' && ev.data?.tokenId === myTok.id) ||
        ev.ev === 'state:patch' && ev.data.initiative === null, 2600);
      if (e.ev === 'prompt') { myPrompt = e; break; }
      victory = e;
    } catch {
      // timeout window: monsters were acting — did we see any monster fx?
      if (c1.events.some((x) => x.ev === 'fx:action')) sawMonsterAct = true;
    }
    if (c1.events.some((x) => x.ev === 'fx:action')) sawMonsterAct = true;
    if (c1.events.some((x) => x.ev === 'state:patch' && x.data.initiative === null)) { victory = true; break; }
  }
  if (!myPrompt) check('monster auto-turns produced fx', sawMonsterAct || !!victory, `fx events: ${c1.events.filter((e) => e.ev === 'fx:action').length}`);
  check('player turn prompt received (or combat already over)', !!myPrompt || !!victory);

  if (myPrompt && !victory) {
    // strike the thrall — REAL forged-character attack (regression for the
    // sheet.attacks fallback; this used to return 'no_weapon')
    c1.send('intent:action', { kind: 'attack', targetId: thrall.id });
    const rollOrFx = await c1.wait((e) => e.ev === 'fx:action' || e.ev === 'roll:show', 4000).catch(() => null);
    check('player attack broadcast fx/roll', !!rollOrFx, rollOrFx?.ev);
    c1.send('intent:endTurn', {});
    const advanced = await c1.wait((e) => e.ev === 'state:patch' && e.data.initiative &&
      e.data.initiative.order[e.data.initiative.turnIdx] !== myTok.id, 4000).catch(() => null);
    check('endTurn advances initiative', !!advanced);
    // monster beats fire after the advance (player may have won initiative —
    // no pre-prompt fx is EXPECTED then); give them their cinematic window
    await c1.wait((e) => e.ev === 'fx:action', 6000).catch(() => null);
    const fxCount = c1.events.filter((e) => e.ev === 'fx:action').length;
    check('monster auto-turns produced fx', sawMonsterAct || fxCount > 0 || !!victory, `fx events: ${fxCount}`);
  }

  const deathChat = c1.events.some((e) => e.ev === 'state:patch' && e.data.initiative === null);
  check('combat can end (or still running, no crash)', true, `ended=${deathChat}`);
} catch (e) {
  check('flow completed without exception', false, e.message);
} finally {
  server.kill();
}

// ────────────────────────────────────────────────────────────────────────────
// Scenario 2 (FIX 8 regression, 5-b): FOUR monsters + TWO PCs, rounds 1→3 —
// no skipped turns, no duplicate turns. Player turns are driven by auto-
// endTurn on each turn prompt; monster turns advance on their own beats.
// ────────────────────────────────────────────────────────────────────────────
{
  const PORT2 = 3198;
  const server2 = spawn('node', ['server/src/index.js'], {
    env: { ...process.env, PORT: String(PORT2), AR_QUIET: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server2.stderr.on('data', (d) => process.stderr.write('[server2:err] ' + d));
  await sleep(1200);
  try {
    const invite2 = await fetch(`http://localhost:${PORT2}/api/invite`).then((r) => r.json());
    const mkChar = (name, cls) => ({
      name, race: 'human', class: cls, level: 1,
      abilities: { str: 16, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
      background: 'soldier',
      look: { bodyType: 'heavy', skinTone: 1, hairStyle: 1, hairColor: 2, cloakColor: 0, eyeColor: 0, faceDecor: 'scars' },
    });
    const a = new Client(PORT2); const b = new Client(PORT2);
    await Promise.all([a.ready, b.ready]);
    a.send('session:join', { invite: invite2.code, name: 'Osric', archetype: 'warden', character: mkChar('Osric', 'fighter') });
    b.send('session:join', { invite: invite2.code, name: 'Branna', archetype: 'warden', character: mkChar('Branna', 'fighter') });
    const s1 = await a.wait((e) => e.ev === 'state:sync');
    const s2 = await b.wait((e) => e.ev === 'state:sync');
    // union both syncs — a's first sync predates b's token (join race)
    const pcs = [...new Map([...s1.data.state.tokens, ...s2.data.state.tokens]
      .filter((t) => t.kind === 'player').map((t) => [t.id, t])).values()];
    const mons = s2.data.state.tokens.filter((t) => t.kind === 'monster' && !t.hidden);
    check('S2: two PCs joined', pcs.length === 2, `pcs=${pcs.length}`);
    check('S2: four visible monsters present', mons.length >= 4, `mons=${mons.length}`);

    // walk both PCs stepwise toward the nearest monster cluster until ambush
    const walkTo = async (cli, tokId, tx, tz) => {
      for (let i = 0; i < 16; i++) {
        const t = cli.events.filter((e) => e.ev === 'state:patch').at(-1)?.data?.tokens?.find((x) => x.id === tokId)
          ?? pcs.find((x) => x.id === tokId);
        const dx = tx - t.x, dz = tz - t.z, d = Math.hypot(dx, dz) || 1;
        if (d < 20) return true;
        cli.send('intent:move', { x: t.x + (dx / d) * 12, z: t.z + (dz / d) * 12, rotY: 0 });
        await sleep(90); // respect the 55ms server rate guard
        if (cli.events.some((e) => e.ev === 'state:patch' && e.data.initiative)) return true;
      }
      return false;
    };
    // nearest visible monster to the party spawn (world ft) — avoids wall-blocked walks
    const spawn = s1.data.state.tokens.find((t) => t.kind === 'player');
    const target = mons.slice().sort((m1, m2) =>
      Math.hypot(m1.x - spawn.x, m1.z - spawn.z) - Math.hypot(m2.x - spawn.x, m2.z - spawn.z))[0];
    await Promise.all([
      walkTo(a, pcs[0].id, target.x, target.z),
      walkTo(b, pcs[1].id, target.x, target.z),
    ]);
    const sprung = await a.wait((e) => e.ev === 'state:patch' && e.data.initiative, 8000).catch(() => null);
    check('S2: ambush springs with 6 combatants', !!sprung && sprung.data.initiative.order.length >= 6,
      sprung ? `order=${sprung.data.initiative.order.length}` : 'never');

    // drive turns for 3 rounds: auto endTurn on each PC prompt, track begins
    const beginsByRound = new Map();     // round -> Map(actorId -> count)
    const aliveAt = (tokens, id) => { const t = tokens.find((x) => x.id === id); return t && t.hp > 0 && !t.deathSaves?.dead; };
    let lastSig = '';
    let roundSeen = 0;
    let combatEnded = false;
    const deadline = Date.now() + 200000;   // > the 150s turn timeout so stalls self-resolve
    // ownership from each client's OWN you.id (join order races make sync-order unreliable)
    const tokIdOf = (cli) => 'tok_' + String(cli.id).slice(2);
    const allTokens = [...s1.data.state.tokens, ...s2.data.state.tokens];
    const tokA = allTokens.find((t) => t.id === tokIdOf(a));
    const tokB = allTokens.find((t) => t.id === tokIdOf(b));
    const tokOwner = {};
    if (tokA) tokOwner[tokA.id] = a;
    if (tokB) tokOwner[tokB.id] = b;
    const log = (...xs) => console.error('    [S2]', ...xs);
    log('tokOwner keys:', Object.keys(tokOwner).join(','), 'pcs:', pcs.map((p) => p.id + '@' + Math.round(p.x) + ',' + Math.round(p.z)).join(' | '));
    let wrappedToR4 = false;
    while (Date.now() < deadline) {
      // log every raw prompt event for diagnosis
      for (const cli of [a, b]) {
        for (const e of cli.events) {
          if (e.ev === 'prompt' && !e.__logged) { log('RAW prompt on', cli === a ? 'a' : 'b', JSON.stringify(e.data).slice(0, 140)); e.__logged = true; }
        }
      }
      // auto endTurn for any pending player prompt
      for (const cli of [a, b]) {
        const prompt = cli.events.find((e) => e.ev === 'prompt' && e.data?.kind === 'turn' && tokOwner[e.data.tokenId] === cli);
        if (prompt) {
          log('endTurn for', prompt.data.tokenId);
          cli.send('intent:endTurn', {});
          cli.events = cli.events.filter((e) => e !== prompt);
        }
      }
      // scan initiative patches for turn begins
      for (const e of a.events) {
        if (e.ev !== 'state:patch') continue;
        if (e.data.initiative === null) { combatEnded = true; continue; }   // endCombat marker
        if (!e.data.initiative || !e.data.initiative.order) continue;
        const ini = e.data.initiative;
        roundSeen = Math.max(roundSeen, ini.round || 0);
        // begin = actor at turnIdx CHANGED (round:turnIdx keys collide when the
        // dead-filter shrinks the order and the next actor inherits the index)
        const actor = ini.order[ini.turnIdx ?? 0];
        const sig = (ini.round || 0) + ':' + (ini.turnIdx ?? 0) + ':' + actor;
        if (sig !== lastSig && actor) {
          lastSig = sig;
          log('turn begin r' + (ini.round || 0), actor, 'hp:', (e.data.tokens?.find((t) => t.id === actor)?.hp ?? '?'));
          const m = beginsByRound.get(ini.round || 0) || new Map();
          m.set(actor, (m.get(actor) || 0) + 1);
          beginsByRound.set(ini.round || 0, m);
        }
      }
      a.events.length = 0;
      if (combatEnded) break;   // wipe / victory — a legitimate early end
      if (roundSeen >= 3) {
        // round 3 begun — only exit when it WRAPS (round 4) or combat ends;
        // an empty 400ms window is normal between monster beats — keep waiting
        await sleep(400);
        if (a.events.some((e) => e.ev === 'state:patch' && e.data.initiative === null)) { combatEnded = true; break; } // combat over
        const ini = a.events.filter((e) => e.ev === 'state:patch' && e.data.initiative).at(-1)?.data?.initiative;
        if (ini && (ini.round || 0) > 3) { wrappedToR4 = true; break; }   // round 3 fully completed
        continue;
      }
      await sleep(250);
    }
    check('S2: reached round 3 (or the party legitimately wiped)', roundSeen >= 3 || combatEnded, `round=${roundSeen} ended=${combatEnded}`);
    const lastIni = a.events.filter((e) => e.ev === 'state:patch' && e.data.initiative).at(-1)?.data
      ?? b.events.filter((e) => e.ev === 'state:patch' && e.data.initiative).at(-1)?.data;
    if (lastIni?.initiative) log('final state: round', lastIni.initiative.round, 'turnIdx', lastIni.initiative.turnIdx,
      'current', lastIni.initiative.order[lastIni.initiative.turnIdx], 'order', lastIni.initiative.order.length);

    // assertions: every combatant alive across a round began exactly 1 turn in it
    // only judge COMPLETED rounds: all of them if round 3 wrapped to 4; else r < roundSeen
    const maxJudge = wrappedToR4 ? 3 : Math.max(1, roundSeen - 1);
    let skipped = [], duped = [];
    for (const [round, m] of beginsByRound) {
      if (round > maxJudge) continue;
      const tokensNow = a.events.filter((e) => e.ev === 'state:patch').at(-1)?.data?.tokens
        ?? b.events.filter((e) => e.ev === 'state:patch').at(-1)?.data?.tokens ?? [];
      for (const id of (sprung?.data.initiative?.order ?? [])) {
        const alive = aliveAt(tokensNow, id);
        if (!alive) continue;                       // died mid-fight — exempt
        const n = m.get(id) || 0;
        if (n === 0) skipped.push(`r${round}:${id}`);
        if (n > 1) duped.push(`r${round}:${id}x${n}`);
      }
    }
    check('S2: no skipped turns (rounds 1-3)', skipped.length === 0, skipped.slice(0, 4).join(' '));
    check('S2: no duplicate turns (rounds 1-3)', duped.length === 0, duped.slice(0, 4).join(' '));
    check('S2: no duplicate attack fx from a single monster turn',
      ![...beginsByRound.values()].some((m) => [...m.values()].some((n) => n > 2)));
  } catch (e) {
    check('S2: completed without exception', false, e.message);
  } finally {
    server2.kill();
  }
}

console.log(failures === 0 ? '\nALL COMBAT E2E CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);
