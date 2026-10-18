// ASHENREACH — server/src/rules/SpawnRules.js
// Biome and shoreline spawn gating for SRD encounters and ambient roaming.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tablePath = path.resolve(__dirname, '../data/spawnTable.json');

export const SPAWN_TABLE = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

/**
 * Returns filtered spawn candidates and banned lists for a biome, shore type, and optional lake depth tier.
 */
export function getSpawnTableAt(biome, { shoreType = null, depthTier = null } = {}) {
  const primaryKey = depthTier === 'deep' ? 'grand_lake_deep'
    : depthTier === 'shelf' ? 'grand_lake_shelf'
    : (biome || 'meadow');

  const base = SPAWN_TABLE[primaryKey] || SPAWN_TABLE.meadow;
  const shore = shoreType ? SPAWN_TABLE[`shore_${shoreType}`] : null;

  const never = new Set(base.never || []);
  if (shore?.never) {
    for (const id of shore.never) never.add(id);
  }

  const monsterMap = new Map();
  for (const m of base.monsters || []) {
    if (!never.has(m.id)) monsterMap.set(m.id, (monsterMap.get(m.id) || 0) + m.weight);
  }

  if (shore?.monsters) {
    for (const m of shore.monsters) {
      if (!never.has(m.id)) monsterMap.set(m.id, (monsterMap.get(m.id) || 0) + m.weight);
    }
  }

  const monsters = [...monsterMap.entries()].map(([id, weight]) => ({ id, weight }));
  return {
    biome,
    shoreType,
    depthTier,
    monsters,
    never: [...never],
    propBias: base.propBias || [],
  };
}

/**
 * Checks whether a specific monster ID is forbidden from entering or existing in a biome / shoreline.
 */
export function isMonsterBannedAt(monsterId, biome, { shoreType = null, depthTier = null } = {}) {
  if (!monsterId) return false;
  const normalizedId = String(monsterId).toLowerCase();
  const info = getSpawnTableAt(biome, { shoreType, depthTier });
  return info.never.includes(normalizedId);
}

/**
 * Weighted random pick of a monster ID suitable for the biome/shoreline.
 */
export function chooseMonsterForBiome(biome, { shoreType = null, depthTier = null, rng = Math.random } = {}) {
  const table = getSpawnTableAt(biome, { shoreType, depthTier });
  const candidates = table.monsters;
  if (!candidates.length) return 'wolf';
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of candidates) {
    if (roll < c.weight) return c.id;
    roll -= c.weight;
  }
  return candidates[0].id;
}
