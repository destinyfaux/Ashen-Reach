// ASHENREACH — server/src/rules/light.test.js
// P3.13: the light & vision model — day clock, light scalar, senses flip-flop,
// torch gear equipping, and the light-aware ambush/reveal integration.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  daylightFactor, lightLevelAt, effectiveVisionFt, lightRadiusFt,
  isLightSourceName, torchPointsFromTokens,
  DEFAULT_VISION_FT, DEFAULT_DARKVISION_FT, VISION_FLOOR_FT,
  DUNGEON_BASE_LIGHT, NIGHT_BASE_LIGHT, TORCH_REACH_FT,
} from './Light.js';
import { buildCharacter, toggleEquipment } from './CharacterEngine.js';
import { GameManager } from '../GameManager.js';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── daylight curve ──────────────────────────────────────────────────────────

test('daylightFactor: full day at noon, pitch dark at midnight, smooth ramps', () => {
  assert.equal(daylightFactor(0), 0);                       // midnight
  assert.equal(daylightFactor(1440), 0);                    // wraps to midnight
  assert.equal(daylightFactor(720), 1);                     // noon
  assert.equal(daylightFactor(12 * 60), 1);
  assert.equal(daylightFactor(6 * 60 + 15), 0.5);           // mid-dawn (05:30→07:00)
  assert.equal(daylightFactor(19 * 60 + 15), 0.5);          // mid-dusk (18:30→20:00)
  assert.equal(daylightFactor(23 * 60), 0);                 // back to night
  assert.equal(daylightFactor(-60), daylightFactor(1380));  // negatives wrap
});

// ── light scalar ────────────────────────────────────────────────────────────

test('lightLevelAt: dungeon floors are near-black, overworld follows the clock', () => {
  const dungeon = lightLevelAt({ isDungeon: true, x: 0, z: 0, timeMin: 720 });
  assert.ok(near(dungeon, DUNGEON_BASE_LIGHT));
  assert.ok(dungeon < 0.05);

  const noon = lightLevelAt({ isDungeon: false, x: 0, z: 0, timeMin: 720 });
  assert.equal(noon, 1);
  const midnight = lightLevelAt({ isDungeon: false, x: 0, z: 0, timeMin: 0 });
  assert.ok(near(midnight, NIGHT_BASE_LIGHT));
  assert.ok(midnight > DUNGEON_BASE_LIGHT);                 // moonlight > cave dark
});

test('lightLevelAt: map lights lift the scalar with distance falloff (max, not sum)', () => {
  const lights = [{ x: 10, z: 10, radiusFt: 30 }];
  const at = (x, z) => lightLevelAt({ isDungeon: true, x, z, timeMin: 720, mapLights: lights });

  const center = at(10, 10);
  assert.ok(near(center, 0.9));                             // brazier core
  const mid = at(25, 10);                                   // 15ft out
  assert.ok(near(mid, (1 - 15 / 30) * 0.9));
  const outside = at(50, 10);                               // 40ft: out of reach
  assert.ok(near(outside, DUNGEON_BASE_LIGHT));
  assert.ok(center > mid && mid > outside);                 // monotonic falloff

  // torch overlapping a brazier: brightest source wins, no additivity
  const both = lightLevelAt({
    isDungeon: true, x: 10, z: 10, timeMin: 720,
    mapLights: lights, torchPoints: [{ x: 10, z: 10, radiusFt: TORCH_REACH_FT }],
  });
  assert.ok(near(both, 0.95));
});

test('lightLevelAt: an equipped torch lights its bearer and the area around them', () => {
  const torch = [{ x: 0, z: 0, radiusFt: TORCH_REACH_FT }];
  assert.ok(near(lightLevelAt({ isDungeon: true, x: 0, z: 0, timeMin: 720, torchPoints: torch }), 0.95));
  const half = lightLevelAt({ isDungeon: true, x: 20, z: 0, timeMin: 720, torchPoints: torch });
  assert.ok(near(half, 0.475));                            // 20ft out: (1 - 20/40) * 0.95
  const edge = lightLevelAt({ isDungeon: true, x: 39, z: 0, timeMin: 720, torchPoints: torch });
  assert.ok(near(edge, DUNGEON_BASE_LIGHT));               // torch tail (0.024) sinks below the cave floor (0.03)
});

// ── effective vision (the flip-flop) ────────────────────────────────────────

test('effectiveVisionFt: senses-less tokens keep the historic 45ft reach', () => {
  // light only ever helps: in darkness they keep exactly their old radius
  assert.equal(effectiveVisionFt(null, DUNGEON_BASE_LIGHT), DEFAULT_DARKVISION_FT);
  assert.equal(effectiveVisionFt(null, 0), DEFAULT_DARKVISION_FT);
  const lit = effectiveVisionFt(null, 1);
  assert.equal(lit, DEFAULT_VISION_FT);
});

test('effectiveVisionFt: darkvision carries in the dark at full rating; light never shrinks reach', () => {
  const aboleth = { darkvision: 120, passive_perception: 19 };
  assert.equal(effectiveVisionFt(aboleth, 0), 120);         // pitch dark → darkvision
  assert.equal(effectiveVisionFt(aboleth, 1), 120);         // bright light → no worse

  const dv60 = { darkvision: 60 };
  assert.equal(effectiveVisionFt(dv60, 0), 60);             // ~60 in the dark
  assert.equal(effectiveVisionFt(dv60, 0.5), 60);           // half-lit: no dip
  assert.equal(effectiveVisionFt(dv60, 1), 60);
});

test('effectiveVisionFt: no darkvision means groping at arm\'s reach in the dark', () => {
  const acolyte = { passive_perception: 12 };               // SRD: no darkvision
  const dark = effectiveVisionFt(acolyte, 0);
  assert.equal(dark, VISION_FLOOR_FT);
  assert.equal(effectiveVisionFt(acolyte, 1), DEFAULT_VISION_FT);

  // a creature's reach only ever grows as light rises
  let prev = effectiveVisionFt(acolyte, 0);
  for (const l of [0.25, 0.5, 0.75, 1]) {
    const v = effectiveVisionFt(acolyte, l);
    assert.ok(v >= prev - 1e-9, `vision shrank at lit=${l}`);
    prev = v;
  }
});

test('effectiveVisionFt: blindsight ignores light; senses parse as number or string', () => {
  const bat = { blindsight: 60 };
  assert.equal(effectiveVisionFt(bat, 0), 60);
  assert.equal(effectiveVisionFt(bat, 1), 60);

  assert.equal(effectiveVisionFt({ darkvision: '90 ft.' }, 0), 90);   // string parse
  assert.equal(effectiveVisionFt({ darkvision: '90 feet' }, 0), 90);
  assert.equal(effectiveVisionFt({ darkvision: '90' }, 0), 90);
});

// ── light gear ──────────────────────────────────────────────────────────────

test('light gear names map to SRD radii; other gear is not a light source', () => {
  assert.equal(lightRadiusFt('Torch'), TORCH_REACH_FT);
  assert.equal(lightRadiusFt('Lamp'), 45);
  assert.equal(lightRadiusFt('Lantern, hooded'), 60);
  assert.equal(lightRadiusFt('Lantern, bullseye'), 60);
  assert.equal(lightRadiusFt('Longsword'), 0);
  assert.equal(lightRadiusFt(''), 0);
  assert.equal(isLightSourceName('torch'), true);           // case-insensitive
  assert.equal(isLightSourceName('Longsword'), false);
});

test('torchPointsFromTokens: only living, lit players cast light points', () => {
  const tokens = [
    { kind: 'player', hp: 10, x: 1, z: 2, sheet: { lightSource: 'Torch' } },
    { kind: 'player', hp: 10, x: 3, z: 4, sheet: {} },                     // unlit
    { kind: 'player', hp: 0, x: 5, z: 6, sheet: { lightSource: 'Torch' } },// downed
    { kind: 'monster', hp: 10, x: 7, z: 8, sheet: { lightSource: 'Torch' } },
  ];
  const pts = torchPointsFromTokens(tokens);
  assert.deepEqual(pts, [{ x: 1, z: 2, radiusFt: TORCH_REACH_FT }]);
});

// ── sheet: torch inventory + equipping ──────────────────────────────────────

test('every new hero carries two torches and can equip/unequip them as a light source', () => {
  const sheet = buildCharacter({
    name: 'Torchbearer', race: 'human', class: 'Fighter', level: 1,
    abilities: { str: 14, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    background: 'wanderer', skillProficiencies: [],
  });
  const torches = sheet.inventory.filter(i => i.name === 'Torch');
  assert.equal(torches.length, 1);
  assert.equal(torches[0].qty, 2);
  assert.equal(sheet.lightSource ?? null, null);

  const equip = toggleEquipment(sheet, 'Torch');
  assert.equal(equip.ok, true);
  assert.equal(equip.equipped, true);
  assert.equal(sheet.lightSource, 'Torch');
  assert.equal(sheet.inventory.find(i => i.name === 'Torch').equipped, true);

  const stow = toggleEquipment(sheet, 'Torch');
  assert.equal(stow.ok, true);
  assert.equal(stow.equipped, false);
  assert.equal(sheet.lightSource ?? null, null);
  assert.equal(sheet.inventory.find(i => i.name === 'Torch').equipped, false);
});

// ── integration: light-aware ambush + token reveal ─────────────────────────

function lightTestMap(gm) {
  const map = {
    ...gm.getMap(),
    id: 'light_test',
    cells: { ...gm.getMap().cells, wall: [] },
    walls: [],
    lights: [],                                             // fully controlled light
    spawns: { party: [[1, 1]], monsters: [] },
  };
  gm.maps.set(map.id, map);
  gm.setMap(map.id);
  return map;
}

function mkMonster(id, x, z, senses = null) {
  return { id, kind: 'monster', name: id, monsterId: 'skeleton', hp: 8, hpMax: 8,
    x, z, hidden: false, initiative: 0, senses };
}

function mkPlayer(gm, joined) {
  const player = gm.tokenOf(joined.you.id);
  player.x = 10; player.z = 10;
  return player;
}

test('in a pitch-dark room, sightless monsters only spot you at arm\'s reach; darkvision hunters do not care', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = mkPlayer(gm, joined);
  lightTestMap(gm);
  // blind: 30ft from the player, beyond shouting range of the seer (55ft apart)
  const blind = mkMonster('blind', 40, 10, { passive_perception: 12 });
  const seer = mkMonster('seer', 95, 10, { darkvision: 90 });             // 85ft away
  gm.state.tokens = [player, blind, seer];

  try {
    gm.checkAmbush();
    assert.equal(gm.monsterAwareness.has(blind.id), false, '30ft is beyond a sightless monster in the dark');
    assert.equal(gm.monsterAwareness.get(seer.id)?.source, 'sight', 'darkvision 90 spots at 60ft');
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
  }
});

test('lighting a torch lets distant monsters spot you: light trades stealth for reach', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = mkPlayer(gm, joined);
  lightTestMap(gm);

  // senses-less (45ft dark reach): 50ft away is safe in the dark...
  const lurker = mkMonster('lurker', 60, 10);               // 50ft
  gm.state.tokens = [player, lurker];
  try {
    gm.checkAmbush();
    assert.equal(gm.monsterAwareness.has(lurker.id), false, '50ft outruns 45ft dark reach');

    // ...but a lit torch lifts the player's light to ~0.95 → 60ft normal vision
    player.sheet = { ...(player.sheet || {}), lightSource: 'Torch' };
    gm.checkAmbush();
    assert.equal(gm.monsterAwareness.get(lurker.id)?.source, 'sight', 'torchlight reveals the bearer');
  } finally {
    if (gm.state.initiative) gm.endCombat('dm');
    player.sheet = null;
  }
});

test('tokensForUser reveals monsters by their own effective sight, torch bearer widens the reveal', () => {
  const gm = new GameManager();
  const joined = gm.join({ name: 'Mourn' });
  const player = mkPlayer(gm, joined);
  lightTestMap(gm);
  const lurker = mkMonster('lurker', 60, 10);               // 50ft, senses-less
  gm.state.tokens = [player, lurker];

  const revealed = () => gm.tokensForUser(joined.you.id).some(t => t.id === lurker.id);
  assert.equal(revealed(), false, 'hidden beyond dark reach in an unlit room');

  player.sheet = { ...(player.sheet || {}), lightSource: 'Torch' };
  assert.equal(revealed(), true, 'torchlight pulls the token into view');
  player.sheet = null;
});
