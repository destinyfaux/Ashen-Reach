// ASHENREACH — server/src/rules/spawnRules.test.js
// Tests for biome spawn tables, shoreline gating, and ambient movement constraints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPAWN_TABLE,
  getSpawnTableAt,
  isMonsterBannedAt,
  chooseMonsterForBiome,
} from './SpawnRules.js';
import { thinkAmbient } from './MonsterAmbient.js';

test('SpawnRules: tables exist for all core and new biomes', () => {
  const biomes = ['meadow', 'forest', 'snow_forest', 'snowfield', 'deadlands', 'mountains', 'swamp', 'volcanic', 'coastal'];
  for (const b of biomes) {
    assert.ok(SPAWN_TABLE[b], `spawn table missing for ${b}`);
    assert.ok(Array.isArray(SPAWN_TABLE[b].monsters), `monsters array missing for ${b}`);
    assert.ok(Array.isArray(SPAWN_TABLE[b].never), `never list missing for ${b}`);
    assert.ok(SPAWN_TABLE[b].monsters.length > 0, `monsters empty for ${b}`);
  }
});

test('SpawnRules: banned monster gating prevents invalid spawns', () => {
  // Fire elementals should never spawn in snow or swamp
  assert.equal(isMonsterBannedAt('fire_elemental', 'snowfield'), true);
  assert.equal(isMonsterBannedAt('fire_elemental', 'swamp'), true);
  assert.equal(isMonsterBannedAt('fire_elemental', 'volcanic'), false);

  // Yeti and polar bears should never spawn in volcanic or swamp
  assert.equal(isMonsterBannedAt('yeti', 'volcanic'), true);
  assert.equal(isMonsterBannedAt('yeti', 'swamp'), true);
  assert.equal(isMonsterBannedAt('polar_bear', 'volcanic'), true);

  // Giant crabs belong to coastal/shelf, not volcanic or mountains
  assert.equal(isMonsterBannedAt('giant_crab', 'volcanic'), true);
  assert.equal(isMonsterBannedAt('giant_crab', 'mountains'), true);
  assert.equal(isMonsterBannedAt('giant_crab', 'coastal'), false);
});

test('SpawnRules: grand lake depth tiers gate aquatic encounters', () => {
  const deepTable = getSpawnTableAt('coastal', { depthTier: 'deep' });
  const deepIds = deepTable.monsters.map((m) => m.id);
  assert.ok(deepIds.includes('water_elemental'), 'deep basin hosts water elementals');
  assert.equal(isMonsterBannedAt('wolf', 'coastal', { depthTier: 'deep' }), true, 'wolves never spawn in deep lakes');

  const shelfTable = getSpawnTableAt('coastal', { depthTier: 'shelf' });
  const shelfIds = shelfTable.monsters.map((m) => m.id);
  assert.ok(shelfIds.includes('giant_crab') || shelfIds.includes('giant_frog'), 'shallow shelf hosts amphibians/crabs');
});

test('SpawnRules: chooseMonsterForBiome returns valid monster and respects shore types', () => {
  const swampMonster = chooseMonsterForBiome('swamp');
  assert.ok(typeof swampMonster === 'string' && swampMonster.length > 0);
  assert.equal(isMonsterBannedAt(swampMonster, 'swamp'), false);

  const volcanicMonster = chooseMonsterForBiome('volcanic');
  assert.ok(typeof volcanicMonster === 'string' && volcanicMonster.length > 0);
  assert.equal(isMonsterBannedAt(volcanicMonster, 'volcanic'), false);

  const rockyShoreMonster = chooseMonsterForBiome('mountains', { shoreType: 'rocky' });
  assert.ok(typeof rockyShoreMonster === 'string');
});

test('SpawnRules + MonsterAmbient: monster refuses to step into banned biome', () => {
  const monster = { id: 'mob_polar_bear', x: 50, z: 50, speedFt: 30 };
  const targetX = 55, targetZ = 50;
  const ctx = {
    now: 1000,
    rng: () => 0.5,
    players: [],
    visible: () => false,
    blocked: () => false,
    // Step toward targetX=55, targetZ=50 is banned (e.g. entering volcanic border)
    isBanned: (x) => x > 51,
    path: () => [{ x: targetX, z: targetZ }],
    memory: { mode: 'chase', targetX, targetZ, lastX: targetX, lastZ: targetZ, homeX: 50, homeZ: 50 },
  };
  const out = thinkAmbient(monster, ctx);
  assert.equal(out.move, undefined, 'movement cancelled because destination is in a banned biome');
});
