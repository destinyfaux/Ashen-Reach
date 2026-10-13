import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { WebSocket } from 'ws';
import { GameManager } from './GameManager.js';
import { attachWs } from './ws.js';
import { generateOverworld } from './maps/worldGenerator.mjs';

test('server movement collision matches large overworld prop footprints', () => {
  const gm = new GameManager();
  gm.map = {
    props: [
      { type: 'building', x: 10, z: 10, width: 8, depth: 6, rotY: Math.PI / 2 },
      { type: 'tree', x: 20, z: 20, scale: 1.4 },
      { type: 'boulder', x: 30, z: 30, scale: 2 },
      { type: 'tree', x: 40, z: 40, scale: 0.95, variant: 'dead' },
    ],
  };
  assert.equal(gm.overlapsLandscapeProp(10 * 5, 10 * 5), true);
  assert.equal(gm.overlapsLandscapeProp(20 * 5, 20 * 5), true);
  assert.equal(gm.overlapsLandscapeProp(30 * 5, 30 * 5), true);
  assert.equal(gm.overlapsLandscapeProp(40 * 5, 40 * 5), true);
  assert.equal(gm.overlapsLandscapeProp(0, 0), false);
});

test('rejoining restores the forged character and live token state', () => {
  const gm = new GameManager();
  const character = {
    name: 'Ilyra',
    race: 'Elf',
    class: 'Wizard',
    level: 1,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    look: { bodyType: 'slim', skinTone: 4, hairStyle: 2, hairColor: 3, cloakColor: 1 },
  };
  const joined = gm.join({ name: character.name, character });
  assert.equal(joined.ok, true);

  const token = gm.tokenOf(joined.you.id);
  assert.ok(token.sheet);
  token.hp = 2;
  token.sheet.hp.current = 2;
  token.conditions.push('poisoned');
  const previousPosition = { x: token.x, z: token.z };
  gm.leave(joined.you.id);
  assert.equal(gm.tokenOf(joined.you.id), undefined);

  const resumed = gm.join({ resumeId: joined.you.id, name: character.name });
  assert.equal(resumed.ok, true);
  assert.strictEqual(gm.tokenOf(joined.you.id), token);
  assert.equal(token.hp, 2);
  assert.equal(token.sheet.hp.current, 2);
  assert.deepEqual(token.conditions, ['poisoned']);
  assert.deepEqual({ x: token.x, z: token.z }, previousPosition);
  assert.equal(token.sheet.class, 'Wizard');
  assert.deepEqual(token.look, {
    bodyType: 'lean', skinTone: '#664629', hair: 'long',
    hairColor: '#934d1f', cloakColor: '#46301a',
  });
  assert.equal(Object.hasOwn(resumed.you, 'character'), false);
});

test('solo downing prompts for death; confirmation is final for the saved character this session', () => {
  const gm = new GameManager();
  const character = {
    id: 'solo-character-1', name: 'Ashen', race: 'Human', class: 'Fighter', level: 1,
  };
  const joined = gm.join({ name: character.name, character });
  const token = gm.tokenOf(joined.you.id);
  const prompts = [];
  gm.net = {
    broadcast: () => {},
    sendToUser: (userId, ev, data) => prompts.push({ userId, ev, data }),
  };

  token.hp = 0;
  token.sheet.hp.current = 0;
  token.conditions.push('unconscious', 'prone');
  gm.checkUnassistedDowned();
  assert.ok(prompts.some((p) => p.ev === 'prompt' && p.data.kind === 'solo-down'));
  assert.equal(gm.move(joined.you.id, { x: token.x + 1, z: token.z }).reason, 'actor_down');
  assert.equal(gm.onIntent(joined.you.id, 'intent:sheet', { op: 'use', itemId: 'Potion of Healing' }).reason, 'actor_down');

  const ended = gm.onIntent(joined.you.id, 'intent:action', { kind: 'acceptDeath' });
  assert.equal(ended.ok, true);
  assert.equal(token.deathSaves.dead, true);
  assert.equal(token.adventureEnded, true);
  assert.ok(prompts.some((p) => p.ev === 'prompt' && p.data.kind === 'character-ended'));

  const playersBeforeRetry = gm.state.players.length;
  const retry = gm.join({ name: character.name, character });
  assert.equal(retry.ok, false);
  assert.equal(retry.code, 'character_dead');
  assert.equal(gm.state.players.length, playersBeforeRetry);

  gm.leave(joined.you.id);
  const resumed = gm.join({ resumeId: joined.you.id, name: character.name });
  assert.equal(resumed.ok, true);
  assert.equal(gm.tokenOf(joined.you.id).deathSaves.dead, true);
});

test('a living online party member suppresses solo death and can use Help from exploration', () => {
  const gm = new GameManager();
  const fallen = gm.join({ name: 'Fallen' });
  const helper = gm.join({ name: 'Helper' });
  const target = gm.tokenOf(fallen.you.id);
  const actor = gm.tokenOf(helper.you.id);
  const prompts = [];
  gm.net = {
    broadcast: () => {},
    sendToUser: (userId, ev, data) => prompts.push({ userId, ev, data }),
  };

  target.hp = 0;
  target.conditions.push('unconscious', 'prone');
  actor.x = target.x + 3;
  actor.z = target.z + 4;
  gm.checkUnassistedDowned();
  assert.ok(!prompts.some((p) => p.data.kind === 'solo-down'));

  const result = gm.onIntent(helper.you.id, 'intent:action', { kind: 'help', targetId: target.id });
  assert.equal(result.ok, true);
  assert.equal(target.hp, 1);
  assert.deepEqual(target.conditions, []);
});

test('sheet intents equip gear and consume the selected healing potion', () => {
  const gm = new GameManager();
  const joined = gm.join({
    name: 'Vael',
    character: {
      name: 'Vael', race: 'Human', class: 'Fighter', level: 1,
      abilities: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 },
      equipmentOverrides: { items: [
        { name: 'Chain Mail', qty: 1, kind: 'armor' },
        { name: 'Longsword', qty: 1, kind: 'weapon' },
        { name: 'Shield', qty: 1, kind: 'shield' },
        { name: 'Potion of Healing', qty: 2, kind: 'gear', weight: 0.5 },
      ] },
    },
  });
  const token = gm.tokenOf(joined.you.id);
  const initialAc = token.ac;
  const patches = [];
  gm.net = {
    broadcast: (ev, data) => patches.push({ ev, data }),
    sendToUser: () => {},
  };

  const equipped = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'equip', itemId: 'Shield' });
  assert.equal(equipped.ok, true);
  assert.equal(token.sheet.shield, false);
  assert.equal(token.ac, initialAc - 2);
  assert.ok(patches.some(p => p.ev === 'state:patch' && p.data.chat && p.data.tokens));

  token.hp = 2;
  token.sheet.hp.current = 2;
  const carriedWeight = token.sheet.carrying.weight;
  const used = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'use', itemId: 'Potion of Healing' });
  assert.equal(used.ok, true);
  assert.ok(used.result.healing.gained > 0);
  assert.equal(token.sheet.hp.current, token.hp);
  assert.equal(token.sheet.inventory.find(i => i.name === 'Potion of Healing').qty, 1);
  assert.equal(token.sheet.equipment.find(i => i.name === 'Potion of Healing').qty, 1);
  assert.equal(token.sheet.carrying.weight, carriedWeight - 0.5);
});

test('short and long rest intents restore resources and are refused during combat', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Ilyra', character: {
    name: 'Ilyra', race: 'Human', class: 'Wizard', level: 2,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  } });
  const token = gm.tokenOf(joined.you.id);
  token.hp = 1;
  token.sheet.hp.current = 1;
  token.sheet.spellcasting.slots[1].used = 1;

  const short = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'shortRest', hitDice: 1 });
  assert.equal(short.ok, true);
  assert.equal(token.hp, token.sheet.hp.current);
  assert.ok(token.hp > 1);
  assert.equal(token.sheet.hitDice.remaining, 1);
  assert.equal(token.sheet.spellcasting.slots[1].used, 1);

  gm.state.initiative = { order: [token.id], turnIdx: 0, round: 1, movement: null };
  const denied = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'longRest' });
  assert.equal(denied.reason, 'in_combat');
  assert.equal(token.hp, token.sheet.hp.current);
  gm.state.initiative = null;

  const long = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'longRest' });
  assert.equal(long.ok, true);
  assert.equal(token.hp, token.hpMax);
  assert.equal(token.sheet.spellcasting.slots[1].used, 0);
  assert.equal(token.sheet.hitDice.remaining, 2);
});

test('combat victory grants XP and a usable healing potion; manual combat end grants neither', () => {
  const gm = new GameManager();
  const joined = gm.join({
    name: 'Vael',
    character: { name: 'Vael', race: 'Human', class: 'Fighter', level: 1 },
  });
  const token = gm.tokenOf(joined.you.id);
  const goblin = {
    id: 'goblin_test', kind: 'monster', name: 'Goblin', monsterId: 'goblin',
    hp: 0, hpMax: 7, x: token.x + 5, z: token.z,
  };
  gm.state.tokens = [token, goblin];
  gm.state.initiative = { order: [token.id, goblin.id], turnIdx: 0, round: 1, movement: null };

  gm.endCombat('victory');

  assert.equal(token.sheet.xp, 50);
  assert.equal(token.sheet.inventory.find(i => i.name === 'Potion of Healing').qty, 1);
  assert.equal(token.sheet.equipment.find(i => i.name === 'Potion of Healing').qty, 1);
  assert.equal(gm.state.initiative, null);
  token.hp = 2;
  token.sheet.hp.current = 2;
  const usedReward = gm.onIntent(joined.you.id, 'intent:sheet', { op: 'use', itemId: 'Potion of Healing' });
  assert.equal(usedReward.ok, true);
  assert.ok(usedReward.result.healing.gained > 0);
  assert.equal(token.sheet.hp.current, token.hp);

  const manual = new GameManager();
  const second = manual.join({ name: 'Mourn', character: { name: 'Mourn', race: 'Dwarf', class: 'Cleric', level: 1 } });
  const secondToken = manual.tokenOf(second.you.id);
  const deadMonster = { ...goblin, id: 'goblin_manual' };
  manual.state.tokens = [secondToken, deadMonster];
  manual.state.initiative = { order: [secondToken.id, deadMonster.id], turnIdx: 0, round: 1, movement: null };
  manual.endCombat('dm');
  assert.equal(secondToken.sheet.xp, 0);
  assert.ok(!secondToken.sheet.inventory.some(i => i.name === 'Potion of Healing'));
});

test('automatic encounters start when monsters see a player and exclude blocked or distant creatures', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  player.x = 10; player.z = 10;
  const monster = (id, x, z) => ({
    id, kind: 'monster', name: id, monsterId: 'skeleton', hp: 8, hpMax: 8,
    x, z, hidden: false, initiative: 0,
  });
  const visible = monster('visible', 10, 50);
  const occluded = monster('occluded', 50, 10);
  const distant = monster('distant', 100, 10);
  gm.state.tokens = [player, visible, occluded, distant];
  gm.map = { ...gm.map, walls: [{ x1: 3, z1: 1.8, x2: 3, z2: 2.2, type: 'normal' }] };
  gm.state.doors = [];

  try {
    gm.checkAmbush();
    assert.deepEqual(new Set(gm.state.initiative.order), new Set([player.id, visible.id]));
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
  }
});

function setAwarenessMap(gm, walls) {
  const map = {
    ...gm.getMap(),
    id: 'awareness_test',
    cells: { ...gm.getMap().cells, wall: [] },
    walls,
    spawns: { party: [[1, 1]], monsters: [] },
  };
  gm.maps.set(map.id, map);
  gm.setMap(map.id);
  return map;
}

function awarenessMonster(id, x, z, hidden = false) {
  return {
    id, kind: 'monster', ownerId: 'DM', name: id, hp: 8, hpMax: 8,
    x, z, hidden, deathSaves: null, conditions: [],
  };
}

test('an attack heard through a closed door does not alert an isolated room; an open door carries the alarm', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  const map = setAwarenessMap(gm, [
    { x1: 3, z1: 0, x2: 3, z2: 20, type: 'door' },
  ]);
  const monster = awarenessMonster('beyond-door', 65, 50);
  gm.state.tokens = [player, monster];
  player.x = 10;
  player.z = 50;

  try {
    gm.checkAmbush({ x: player.x, z: player.z, actorId: player.id, radiusFt: 60 });
    assert.equal(gm.monsterAwareness.has(monster.id), false);
    assert.equal(gm.state.initiative, null);

    assert.deepEqual(gm.interactDoor(joined.you.id, 0), { ok: true, open: true });
    gm.checkAmbush({ x: player.x, z: player.z, actorId: player.id, radiusFt: 60 });
    assert.equal(gm.monsterAwareness.get(monster.id).source, 'sound');
    assert.ok(gm.state.initiative.order.includes(monster.id));
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
  }
});

test('normal walls attenuate noise while windows allow it through', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  setAwarenessMap(gm, [
    { x1: 3, z1: 0, x2: 3, z2: 20, type: 'normal' },
  ]);
  const monster = awarenessMonster('beyond-wall', 65, 50);
  gm.state.tokens = [player, monster];
  player.x = 10;
  player.z = 50;
  const noise = { x: player.x, z: player.z, actorId: player.id, radiusFt: 60 };

  try {
    gm.checkAmbush(noise);
    assert.equal(gm.monsterAwareness.has(monster.id), false);
    assert.equal(gm.state.initiative, null);

    gm.map = { ...gm.map, walls: [{ x1: 3, z1: 0, x2: 3, z2: 20, type: 'window' }] };
    gm.checkAmbush(noise);
    assert.equal(gm.monsterAwareness.get(monster.id).source, 'sound');
    assert.ok(gm.state.initiative.order.includes(monster.id));
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
  }
});

test('opening a door starts an encounter when it brings a monster into sight', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  setAwarenessMap(gm, [
    { x1: 3, z1: 0, x2: 3, z2: 20, type: 'door' },
  ]);
  const monster = awarenessMonster('seen-through-door', 50, 50);
  gm.state.tokens = [player, monster];
  player.x = 10;
  player.z = 50;

  try {
    gm.checkAmbush();
    assert.equal(gm.state.initiative, null);
    assert.deepEqual(gm.interactDoor(joined.you.id, 0), { ok: true, open: true });
    assert.equal(gm.monsterAwareness.get(monster.id).source, 'sight');
    assert.ok(gm.state.initiative.order.includes(monster.id));
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
  }
});

test('alert calls propagate only through reachable nearby monsters and stay out of public token data', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  setAwarenessMap(gm, []);
  const first = awarenessMonster('first-listener', 40, 50);
  const second = awarenessMonster('second-listener', 75, 50);
  const third = awarenessMonster('third-listener', 110, 50);
  const distant = awarenessMonster('distant-listener', 155, 50);
  const hidden = awarenessMonster('hidden-listener', 35, 50, true);
  gm.state.tokens = [player, first, second, third, distant, hidden];
  player.x = 10;
  player.z = 50;

  gm.checkAmbush({ x: player.x, z: player.z, actorId: player.id, radiusFt: 35 });

  assert.equal(gm.monsterAwareness.get(first.id).source, 'sight');
  assert.equal(gm.monsterAwareness.get(second.id).source, 'ally');
  assert.equal(gm.monsterAwareness.get(third.id).source, 'ally');
  assert.equal(gm.monsterAwareness.has(distant.id), false);
  assert.equal(gm.monsterAwareness.has(hidden.id), false);
  assert.ok(!Object.hasOwn(first, 'awareness'));
  assert.ok(!gm.getPublicState(joined.you.id).tokens.some((token) => token.id === hidden.id));
  assert.ok(gm.state.initiative.order.includes(first.id));
  assert.ok(gm.state.initiative.order.includes(second.id));
  assert.ok(gm.state.initiative.order.includes(third.id));
  assert.ok(!gm.state.initiative.order.includes(distant.id));
  gm.endCombat('dm');
});

test('player snapshots omit unseen monsters and public map spawn locations', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  player.x = 10; player.z = 10;
  const monster = (id, x, z) => ({ id, kind: 'monster', hp: 8, x, z, hidden: false });
  gm.state.tokens = [player, monster('visible', 10, 20), monster('occluded', 20, 10), monster('distant', 100, 10)];
  gm.state.players.push({ ...joined.you });
  gm.map = { ...gm.map, walls: [{ x1: 3, z1: 1.8, x2: 3, z2: 2.2, type: 'normal' }] };
  gm.state.doors = [];

  const snapshot = gm.getPublicState(joined.you.id);
  assert.deepEqual(snapshot.tokens.map((t) => t.id).sort(), [player.id, 'visible'].sort());
  assert.equal(snapshot.players.filter((p) => p.id === joined.you.id).length, 1);
  assert.deepEqual(gm.getPublicMap(joined.you.id).spawns.monsters, []);
  assert.ok(gm.getPublicMap(joined.you.id).spawns.monsters.length < gm.getMap().spawns.monsters.length);
});

test('player initiative snapshots omit unseen monsters and concealed active movement', () => {
  const gm = new GameManager();
  const dm = gm.join({ name: 'Director', dm: true });
  const viewer = gm.join({ name: 'Mourn' });
  const distantPlayer = gm.join({ name: 'Ash' });
  const playerToken = gm.tokenOf(viewer.you.id);
  const distantToken = gm.tokenOf(distantPlayer.you.id);
  playerToken.x = 10; playerToken.z = 10;
  distantToken.x = 200; distantToken.z = 200;
  gm.map = { ...gm.map, walls: [] };
  gm.state.doors = [];
  const seen = awarenessMonster('visible-foe', 10, 20);
  const unseen = awarenessMonster('unseen-foe', 200, 210);
  gm.state.tokens.push(seen, unseen);
  gm.state.initiative = {
    order: [playerToken.id, seen.id, distantToken.id, unseen.id],
    turnIdx: 3,
    round: 2,
    movement: { tokenId: unseen.id, usedFt: 5, maxFt: 30, trail: [[200, 210]] },
  };

  const playerState = gm.getPublicState(viewer.you.id);
  assert.deepEqual(playerState.initiative.order, [playerToken.id, seen.id, distantToken.id]);
  assert.equal(playerState.initiative.turnIdx, -1);
  assert.equal(playerState.initiative.movement, null);
  assert.ok(!JSON.stringify(playerState).includes(unseen.id));
  assert.deepEqual(gm.getPublicState(dm.you.id).initiative, gm.state.initiative);

  gm.state.initiative.turnIdx = 1;
  assert.equal(gm.getPublicState(viewer.you.id).initiative.turnIdx, 1);
});

test('initiative state patches are filtered independently for each player', async () => {
  const gm = new GameManager();
  const server = http.createServer();
  const wss = attachWs(server, gm);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const url = `ws://127.0.0.1:${address.port}/ws`;
  const connect = () => new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
  const waitFor = (socket, predicate) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error('timed out waiting for WebSocket event'));
    }, 2000);
    const onMessage = (raw) => {
      const message = JSON.parse(raw.toString());
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.off('message', onMessage);
      resolve(message);
    };
    socket.on('message', onMessage);
  });
  let sockets = [];
  try {
    const first = await connect();
    sockets.push(first);
    const firstSync = waitFor(first, (message) => message.ev === 'state:sync');
    first.send(JSON.stringify({ ev: 'session:join', data: { invite: gm.session.inviteCode, name: 'Mourn' } }));
    const firstState = (await firstSync).data.state;

    const second = await connect();
    sockets.push(second);
    const secondSync = waitFor(second, (message) => message.ev === 'state:sync');
    second.send(JSON.stringify({ ev: 'session:join', data: { invite: gm.session.inviteCode, name: 'Ash' } }));
    const secondState = (await secondSync).data.state;

    const firstToken = gm.tokenOf(firstState.players.find((player) => player.name === 'Mourn').id);
    const secondToken = gm.tokenOf(secondState.players.find((player) => player.name === 'Ash').id);
    firstToken.x = 10; firstToken.z = 10;
    secondToken.x = 200; secondToken.z = 200;
    gm.map = { ...gm.map, walls: [] };
    gm.state.doors = [];
    const seen = awarenessMonster('visible-foe-wire', 10, 20);
    const unseen = awarenessMonster('unseen-foe-wire', 200, 210);
    gm.state.tokens.push(seen, unseen);
    gm.state.initiative = {
      order: [firstToken.id, seen.id, secondToken.id, unseen.id],
      turnIdx: 3,
      round: 1,
      movement: { tokenId: unseen.id, usedFt: 5, maxFt: 30, trail: [[200, 210]] },
    };

    const firstPatch = waitFor(first, (message) => message.ev === 'state:patch' && message.data.initiative);
    const secondPatch = waitFor(second, (message) => message.ev === 'state:patch' && message.data.initiative);
    gm.commit({ tokens: gm.state.tokens, initiative: gm.state.initiative });
    const [firstResult, secondResult] = await Promise.all([firstPatch, secondPatch]);
    assert.ok(!JSON.stringify(firstResult.data).includes(unseen.id));
    assert.ok(!JSON.stringify(firstResult.data).includes('unseen-foe-wire'));
    assert.equal(firstResult.data.initiative.turnIdx, -1);
    assert.equal(firstResult.data.initiative.movement, null);
    assert.ok(secondResult.data.initiative.order.includes(unseen.id));
    assert.equal(secondResult.data.initiative.turnIdx, 2);
  } finally {
    for (const socket of sockets) socket.close();
    await new Promise((resolve) => wss.close(resolve));
    await new Promise((resolve) => server.close(resolve));
  }
});

test('players cannot target unseen monsters by guessing their token IDs', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  player.x = 10; player.z = 10;
  const monster = awarenessMonster('hidden-target', 10, 20, true);
  gm.state.tokens.push(monster);
  gm.map = { ...gm.map, walls: [] };
  gm.state.doors = [];
  const prompts = [];
  gm.net = {
    broadcast: () => {},
    sendToUser: (userId, ev, data) => prompts.push({ userId, ev, data }),
  };

  const result = gm.onIntent(joined.you.id, 'intent:action', {
    kind: 'attack', targetId: monster.id,
  });

  assert.deepEqual(result, { ok: false, reason: 'target_unavailable' });
  assert.equal(monster.hp, 8);
  const targetPrompt = prompts.find((prompt) => prompt.data.text === 'Choose a valid visible foe from the current encounter.');
  assert.ok(targetPrompt);
  assert.deepEqual(gm.onIntent(joined.you.id, 'intent:action', {
    kind: 'attack', targetId: 'not-a-real-token',
  }), result);
  assert.ok(!JSON.stringify(prompts).includes(monster.id));
});

test('players cannot target a visible monster outside the active encounter', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = gm.tokenOf(joined.you.id);
  player.x = 10; player.z = 10;
  const active = awarenessMonster('active-foe', 10, 15);
  const inactive = awarenessMonster('inactive-foe', 10, 20);
  gm.state.tokens.push(active, inactive);
  gm.map = { ...gm.map, walls: [] };
  gm.state.doors = [];
  gm.state.initiative = {
    order: [player.id, active.id],
    turnIdx: 0,
    round: 1,
    movement: null,
  };

  const result = gm.onIntent(joined.you.id, 'intent:action', {
    kind: 'attack', targetId: inactive.id,
  });

  assert.deepEqual(result, { ok: false, reason: 'target_unavailable' });
  assert.equal(inactive.hp, 8);
  assert.equal(player.actionUsed, undefined);
});

function useDoorTestMap(gm, type = 'door', locked = false) {
  const map = {
    ...gm.getMap(),
    id: 'door_test',
    cells: { ...gm.getMap().cells, wall: [] },
    walls: [{ x1: 2, z1: 2, x2: 2, z2: 3, type, locked }],
    spawns: { party: [[1, 2]], monsters: [] },
  };
  gm.maps.set(map.id, map);
  gm.setMap(map.id);
  return map;
}

test('closed doors block crossing until an adjacent player opens them', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const token = gm.tokenOf(joined.you.id);
  useDoorTestMap(gm);
  token.x = 10;
  token.z = 12;
  const monster = { id: 'door-side-monster', kind: 'monster', x: 17, z: 12, hidden: false };
  gm.state.tokens.push(monster);

  assert.equal(gm.move(joined.you.id, { x: 15, z: 12 }).reason, 'blocked');
  assert.ok(!gm.tokensForUser(joined.you.id).some((item) => item.id === monster.id));
  assert.deepEqual(gm.interactDoor(joined.you.id, 0), { ok: true, open: true });
  assert.ok(gm.tokensForUser(joined.you.id).some((item) => item.id === monster.id));
  gm.lastMoveAt.delete(token.id);
  assert.equal(gm.move(joined.you.id, { x: 15, z: 12 }).ok, true);
  assert.deepEqual(gm.interactDoor(joined.you.id, 0), { ok: true, open: false });
  gm.lastMoveAt.delete(token.id);
  assert.equal(gm.move(joined.you.id, { x: 10, z: 12 }).reason, 'blocked');
});

test('locked doors reject player interaction and DM can unlock them', () => {
  const gm = new GameManager();
  const dm = gm.join({ name: 'Director', dm: true });
  const player = gm.join({ name: 'Mourn' });
  useDoorTestMap(gm, 'door', true);
  const token = gm.tokenOf(player.you.id);
  token.x = 100;
  token.z = 100;
  assert.equal(gm.interactDoor(player.you.id, 0).reason, 'too_far');
  token.x = 7;
  token.z = 12;

  assert.equal(gm.interactDoor(player.you.id, 0).reason, 'locked');
  assert.equal(gm.dmCommand({ op: 'door', payload: { wallIndex: 0, action: 'unlock' } }).ok, true);
  assert.equal(gm.interactDoor(player.you.id, 0).ok, true);
  assert.equal(gm.doorsForUser(dm.you.id)[0].locked, false);
});

test('unrevealed secret doors are concealed and remain solid until the DM reveals them', () => {
  const gm = new GameManager();
  const dm = gm.join({ name: 'Director', dm: true });
  const player = gm.join({ name: 'Mourn' });
  useDoorTestMap(gm, 'secret_door');

  const publicMap = gm.getPublicMap(player.you.id);
  assert.equal(publicMap.walls[0].type, 'normal');
  assert.equal(Object.hasOwn(publicMap.walls[0], 'isOpen'), false);
  assert.equal(Object.hasOwn(publicMap.walls[0], 'locked'), false);
  assert.equal(Object.hasOwn(publicMap.walls[0], 'revealed'), false);
  assert.ok(publicMap.cells.wall.some(([x, z]) => x === 2 && z === 2));
  assert.equal(gm.getPublicState(player.you.id).doors.length, 0);
  assert.equal(gm.getPublicMap(dm.you.id).walls[0].type, 'secret_door');
  assert.equal(gm.wallCells.has('2,2'), true);

  assert.equal(gm.dmCommand({ op: 'door', payload: { wallIndex: 0, action: 'open' } }).error, 'door_unrevealed');
  assert.equal(gm.state.doors[0].open, false);
  assert.equal(gm.dmCommand({ op: 'door', payload: { wallIndex: 0, action: 'reveal' } }).ok, true);
  assert.equal(gm.wallCells.has('2,2'), false);
  assert.equal(gm.getPublicMap(player.you.id).walls[0].type, 'secret_door');
  assert.equal(gm.getPublicState(player.you.id).doors[0].revealed, true);
});

test('dungeon exit returns to the overworld without resetting party or map progress', () => {
  const gm = new GameManager();
  gm.maps.set('ashen_reach', generateOverworld({ seed: 73021 }));
  gm.exitReturnMapId = 'ashen_reach';
  const joined = gm.join({
    name: 'Vael',
    character: { name: 'Vael', race: 'Human', class: 'Fighter', level: 1 },
  });
  const joinedAlly = gm.join({ name: 'Ilyra' });
  const token = gm.tokenOf(joined.you.id);
  const ally = gm.tokenOf(joinedAlly.you.id);
  const dungeonId = gm.state.mapId;
  const dungeon = gm.map;
  const exit = dungeon.exits[0];
  const monster = {
    id: 'remembered-foe', kind: 'monster', name: 'Remembered foe',
    x: token.x + 20, z: token.z, hp: 0, hpMax: 8, conditions: [],
  };
  gm.state.tokens.push(monster);
  gm.state.doors[0].open = true;
  token.sheet.inventory.push({ name: 'Cellar Cache', qty: 1, kind: 'gear', weight: 0 });
  token.x = exit.x * 5;
  token.z = exit.z * 5;
  ally.x = token.x + 5;
  ally.z = token.z + 5;
  const patches = [];
  gm.net = { broadcast: (ev, data) => patches.push({ ev, data }) };

  assert.deepEqual(gm.useExit(joined.you.id, 'missing'), { ok: false, reason: 'no_exit' });
  token.x += 100;
  assert.deepEqual(gm.useExit(joined.you.id, exit.id), { ok: false, reason: 'too_far' });
  token.x = exit.x * 5;
  gm.state.initiative = { order: [token.id], turnIdx: 0, round: 1, movement: null };
  assert.deepEqual(gm.useExit(joined.you.id, exit.id), { ok: false, reason: 'in_combat' });
  gm.state.initiative = null;

  token.x = exit.x * 5 + 9;
  const dungeonPosition = { x: token.x, z: token.z, rotY: token.rotY };
  const allyDungeonPosition = { x: ally.x, z: ally.z, rotY: ally.rotY };
  assert.deepEqual(gm.useExit(joined.you.id, exit.id), {
    ok: true, mapId: 'ashen_reach',
  });
  assert.equal(gm.state.mapId, 'ashen_reach');
  assert.equal(gm.tokenOf(joined.you.id), token);
  assert.equal(gm.tokenOf(joinedAlly.you.id), ally);
  assert.ok(patches.some(({ ev, data }) =>
    ev === 'state:patch' && data.mapId === 'ashen_reach' && data.map?.exits?.length));
  gm.lastMoveAt.delete(token.id);
  token.x = 1;
  token.z = 90;
  assert.equal(gm.move(joined.you.id, { x: -1, z: 90 }).reason, 'out_of_bounds');

  const returnExit = gm.map.exits.find((item) => item.destinationMapId === dungeonId);
  token.x = returnExit.x * 5;
  token.z = returnExit.z * 5;
  assert.deepEqual(gm.useExit(joined.you.id, returnExit.id), { ok: true, mapId: dungeonId });

  assert.strictEqual(gm.map, dungeon);
  assert.equal(gm.state.mapId, dungeonId);
  assert.deepEqual({ x: token.x, z: token.z, rotY: token.rotY }, dungeonPosition);
  assert.deepEqual({ x: ally.x, z: ally.z, rotY: ally.rotY }, allyDungeonPosition);
  assert.equal(gm.state.doors[0].open, true);
  assert.equal(gm.state.tokens.find((item) => item.id === monster.id).hp, 0);
  assert.deepEqual(token.sheet.inventory.find((item) => item.name === 'Cellar Cache'), {
    name: 'Cellar Cache', qty: 1, kind: 'gear', weight: 0,
  });
});

test('GameManager movement validates half-tiles: token can walk on dry half of half-water tile, rejected in water half', () => {
  const gm = new GameManager();
  gm.map = {
    id: 'test_map',
    size: { w: 10, h: 10 },
    cells: {
      wall: [],
      water: [[5, 5, 'nw']],
    },
    walls: [],
    props: [],
    spawns: { party: [[4.5, 4.5]], monsters: [] },
  };
  gm.rebuildWallCells();

  const joined = gm.join({ name: 'Explorer' });
  const token = gm.tokenOf(joined.you.id);
  token.x = 22;
  token.z = 27;

  // Move onto open land portion (SE half: x=29, z=29) of cell (5, 5)
  const dryMove = gm.move(joined.you.id, { x: 29, z: 29 });
  assert.equal(dryMove.ok, true, 'move onto dry half of half-tile must succeed');

  // Attempt to step into the water half (NW half: x=26, z=26)
  gm.lastMoveAt.delete(token.id);
  const wetMove = gm.move(joined.you.id, { x: 26, z: 26 });
  assert.equal(wetMove.ok, false, 'move into water half of half-tile must be rejected');
  assert.equal(wetMove.reason, 'blocked', 'rejection reason must be blocked');
});

test('game time advances along side world time in cycle mode and responds to DM command', () => {
  const gm = new GameManager({ startMapId: 'ashen_reach' });
  const initial = gm.getDayNight();
  assert.equal(initial.mode, 'cycle');
  assert.equal(initial.time, 600); // 10:00

  // Simulate 10 seconds of elapsed real time (10s * 1.2 min/s = 12 game minutes)
  gm.dayNightBaseTimestamp = Date.now() - 10_000;
  const advanced = gm.getDayNight();
  assert.equal(advanced.time, 612);

  const publicState = gm.getPublicState('user_1');
  assert.equal(publicState.dayNight.time, 612);

  // DM updates day/night time and mode
  gm.dmCommand({ op: 'daynight', mode: 'fixed', time: 720 });
  const fixed = gm.getDayNight();
  assert.equal(fixed.mode, 'fixed');
  assert.equal(fixed.time, 720);

  // Fixed mode does not drift with elapsed time
  gm.dayNightBaseTimestamp = Date.now() - 50_000;
  assert.equal(gm.getDayNight().time, 720);
});

