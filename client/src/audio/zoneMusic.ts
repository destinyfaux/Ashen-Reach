// client/src/audio/zoneMusic.ts — dynamic music zone & region resolver.
// Evaluates player world position, region biomes, points of interest,
// building facades, dungeon room modules, and encounter state to select
// the matching soundtrack from the 16 synthesized compositions in music.ts.

import type { MusicScene } from './music';
import type { MapDef } from '../engine/types';
import type { RegionHandle } from '../engine/tilegrid/shared';
import type { TokenState } from '../game/store';

export interface ZoneMusicQuery {
  playerX: number; // world feet
  playerZ: number; // world feet
  map: MapDef | null;
  regions?: Map<string, RegionHandle>;
  worldMode?: boolean;
  inCombat?: boolean;
  tokens?: TokenState[];
  myTokenId?: string | null;
  victoryCooldown?: number; // >0 if victory stinger is active
}

/**
 * Resolves the appropriate MusicScene for the given world position and state.
 * Returns one of the 16 thematic scenes defined in music.ts.
 */
export function resolveZoneMusic(q: ZoneMusicQuery): MusicScene {
  const { playerX, playerZ, map, regions, worldMode, inCombat, tokens, myTokenId, victoryCooldown } = q;

  // 1. Life check — game over when local player character is dead
  if (myTokenId && tokens) {
    const me = tokens.find((t) => t.id === myTokenId);
    if (me) {
      const isDead = Boolean(
        me.deathSaves?.dead || (me.hp <= 0 && me.deathSaves && me.deathSaves.fail >= 3)
      );
      if (isDead) return 'gameover';
    }
  }

  // 2. Victory stinger check — plays after combat ends
  if (!inCombat && (victoryCooldown ?? 0) > 0) {
    return 'victory';
  }

  // 3. Combat check — distinguishes boss fights from standard encounters
  if (inCombat) {
    const isBossFight = tokens?.some(
      (t) =>
        t.initiative !== undefined &&
        t.kind === 'monster' &&
        (t.archetype === 'wraith' ||
          t.name.toLowerCase().includes('warden') ||
          t.name.toLowerCase().includes('boss') ||
          (t as unknown as { monsterId?: string }).monsterId === 'specter')
    );
    if (isBossFight) return 'boss';
    return 'combat';
  }

  // If no map definition is loaded yet, fall back to town
  if (!map) return 'town';

  const isOverworld = Boolean(worldMode || map.region || map.id === 'ashen_reach');

  // 4. Dungeon exploration
  if (!isOverworld) {
    const cx = Math.floor(playerX / 5);
    const cz = Math.floor(playerZ / 5);

    // Check specific authored room modules
    if (map.roomRects && map.roomRects.length > 0) {
      for (const r of map.roomRects) {
        if (cx >= r.x1 && cx <= r.x2 && cz >= r.z1 && cz <= r.z2) {
          if (
            r.module === 'warden_arena' ||
            r.module === 'warden_sanctum' ||
            r.id === map.bossRoom
          ) {
            return 'boss';
          }
          if (r.module === 'burial_chapel') return 'cathedral';
          if (r.module === 'library' || r.module === 'archive') return 'library';
          if (r.module === 'abyss' || r.module === 'void') return 'abyss';
          if (
            r.module === 'ossuary' ||
            r.module === 'entry_vestibule' ||
            r.module === 'processional_gallery' ||
            r.module === 'guard_chamber'
          ) {
            return 'crypt';
          }
        }
      }
    }

    if (map.theme === 'dungeon' || map.tileSet === 'dungeon') return 'dungeon';
    return 'crypt';
  }

  // 5. Overworld exploration — determine current region & local cell
  let curMap = map;
  let origin = map.worldOriginFt || { x: 0, z: 0 };

  if (regions && regions.size > 0) {
    for (const reg of regions.values()) {
      const rw = reg.map.size.w * 5;
      const rh = reg.map.size.h * 5;
      if (
        playerX >= reg.origin.x &&
        playerX < reg.origin.x + rw &&
        playerZ >= reg.origin.z &&
        playerZ < reg.origin.z + rh
      ) {
        curMap = reg.map;
        origin = reg.origin;
        break;
      }
    }
  }

  const lx = playerX - origin.x;
  const lz = playerZ - origin.z;
  const w = curMap.size.w;
  const h = curMap.size.h;
  const cellX = Math.max(0, Math.min(w - 1, Math.floor(lx / 5)));
  const cellZ = Math.max(0, Math.min(h - 1, Math.floor(lz / 5)));

  // A. Building proximity (inn / tavern detection)
  for (const prop of curMap.props || []) {
    if (prop.type === 'building' && prop.variant === 'inn') {
      const dist = Math.hypot(cellX - prop.x, cellZ - prop.z);
      const span = Math.max(prop.width || 8, prop.depth || 6);
      if (dist <= span / 2 + 5) return 'tavern';
    }
  }

  // B. Points of Interest proximity (sorted closest first)
  const pois = (curMap.pointsOfInterest || [])
    .map((poi) => ({
      poi,
      dist: Math.hypot(cellX - poi.x, cellZ - poi.z),
    }))
    .sort((a, b) => a.dist - b.dist);

  for (const { poi, dist } of pois) {
    const kind = (poi.kind || '').toLowerCase();
    const label = (poi.label || '').toLowerCase();

    // Tavern / Inn
    if (
      kind === 'inn' ||
      label.includes('inn') ||
      label.includes('tavern') ||
      label.includes('ember & ash') ||
      label.includes("wayfarer's rest")
    ) {
      if (dist <= 9) return 'tavern';
    }

    // Graveyard / Cemetery
    if (
      kind === 'graveyard' ||
      label.includes('cemetery') ||
      label.includes('graveyard') ||
      label.includes('pale rows') ||
      label.includes('silent rows') ||
      label.includes('resting ground')
    ) {
      if (dist <= 15) return 'graveyard';
    }

    // Temple / Cathedral / Basilica
    if (
      label.includes('temple') ||
      label.includes('cathedral') ||
      label.includes('chapel') ||
      label.includes('basilica')
    ) {
      if (dist <= 12) return 'cathedral';
    }

    // Keep / Fortress / Castle
    if (
      label.includes('keep') ||
      label.includes('fortress') ||
      label.includes('castle') ||
      label.includes('citadel')
    ) {
      if (dist <= 14) return 'castle';
    }

    // Ruins / Ancient watch
    if (
      kind === 'ruins' ||
      label.includes('ruin') ||
      label.includes('watch') ||
      label.includes('standing stone')
    ) {
      if (dist <= 12) return 'ruins';
    }

    // Cave / Chasm / Dungeon mouth / Mine / Pass
    if (kind === 'cave' || kind === 'mine' || kind === 'pass' || label.includes('cave') || label.includes('mine') || label.includes('pass')) {
      if (dist <= 10) return 'dungeon';
    }

    // Barrow / Tomb / Grave
    if (kind === 'barrow' || label.includes('barrow')) {
      if (dist <= 14) return 'graveyard';
    }

    // Springs / Sacred pools
    if (kind === 'spring' || label.includes('spring')) {
      if (dist <= 10) return 'cathedral';
    }

    // Dwelling / Sanctuary
    if (kind === 'dwelling' || label.includes('sanctuary') || label.includes('hut')) {
      if (dist <= 10) return 'tavern';
    }

    // Library / Archive
    if (kind === 'library' || label.includes('library') || label.includes('archive')) {
      if (dist <= 12) return 'library';
    }
  }

  // C. Structural Clusters proximity
  for (const cluster of curMap.clusters || []) {
    const dist = Math.hypot(cellX - cluster.x, cellZ - cluster.z);
    if (dist <= (cluster.radius || 10)) {
      if (cluster.rule === 'walled-cemetery' || cluster.biome === 'graveyard') return 'graveyard';
      if (cluster.rule === 'ruined-temple-circle') return 'cathedral';
      if (cluster.rule === 'ruined-fortress-walls') return 'castle';
      if (cluster.rule === 'fallen-ruins' || cluster.biome === 'ruins') return 'ruins';
      if (cluster.rule === 'town_center' || cluster.biome === 'town') return 'town';
      if (cluster.rule === 'charred_stand' || cluster.biome === 'deadlands') return 'abyss';
      if (cluster.rule === 'oak_grove' || cluster.rule === 'pine_stand' || cluster.biome === 'forest') {
        return 'forest';
      }
    }
  }

  // D. Town center radius
  const meta = (curMap as unknown as { metadata?: { town?: { cx?: number; cz?: number }; townCenter?: { x?: number; z?: number } } }).metadata;
  const tcX = meta?.town?.cx ?? meta?.townCenter?.x;
  const tcZ = meta?.town?.cz ?? meta?.townCenter?.z;
  if (typeof tcX === 'number' && typeof tcZ === 'number' && tcX > 0 && tcZ > 0) {
    const distTown = Math.hypot(cellX - tcX, cellZ - tcZ);
    if (distTown <= 18) return 'town';
  }

  // E. Exact Cell Biome
  if (curMap.biomes?.cells && curMap.biomes.kinds) {
    const cellIdx = cellZ * w + cellX;
    const biomeIdx = curMap.biomes.cells[cellIdx];
    const biomeKind = curMap.biomes.kinds[biomeIdx];
    if (biomeKind) {
      switch (biomeKind) {
        case 'swamp':
          return 'crypt';
        case 'volcanic':
          return 'abyss';
        case 'coastal':
          return 'forest';
        case 'town':
          return 'town';
        case 'graveyard':
          return 'graveyard';
        case 'ruins':
          return 'ruins';
        case 'forest':
        case 'snow_forest':
          return 'forest';
        case 'deadlands':
          return 'abyss';
        case 'mountains':
        case 'snowfield':
          return 'ruins';
        case 'meadow':
          return 'forest';
      }
    }
  }

  // F. Overworld default fallback
  return curMap.theme === 'town' ? 'town' : 'forest';
}
