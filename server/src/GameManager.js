// ASHENREACH — GameManager: authoritative world state (VTTManager pattern).
// Owns: session, players, tokens, movement validation, map registry, chat.
// Transport-agnostic: ws.js registers `gm.net = { sendToUser, broadcast }` and
// calls the mutators below; the rules engine (T2-b) can push fx/rolls/prompts
// through gm.net or gm.commit() without touching transport code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachCombat } from './CombatDriver.js';
import { buildCharacter } from './rules/CharacterEngine.js';
import { lightLevelAt, effectiveVisionFt, torchPointsFromTokens } from './rules/Light.js';
import { generateDungeon } from './maps/generator.mjs';
import { generateOverworld } from './maps/worldGenerator.mjs';
import {
  REGION_W, REGION_H, WORLD_SEED,
  regionId, parseRegionId, regionOriginFt,
  getWorldContext, generateRegion,
} from './maps/world.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CELL_FT = 5;                 // one grid cell = 5 feet
const MAX_PLAYERS = 6;
const PLAYER_COLORS = ['#c9a227', '#3f7fbf', '#7a2fa0', '#bf5f2f', '#3fae7a', '#bf3f5f'];

// M0 archetype stat flavors (5E engine lands with T2-b; these seed the HUD)
const ARCHETYPES = {
  warden:       { hp: 18, hpMax: 18, ac: 16, speedFt: 30 },
  shadowdancer: { hp: 12, hpMax: 12, ac: 15, speedFt: 35 },
  ashen_mage:   { hp: 10, hpMax: 10, ac: 12, speedFt: 30 },
  pale_priest:  { hp: 14, hpMax: 14, ac: 14, speedFt: 30 },
};

export class GameManager {
  constructor({ startMapId = 'ashen_cellar' } = {}) {
    // combat driver needs fs/path context for SRD data loading
    this.__fs = fs;
    this.__path = path;
    this.__dirname = __dirname;
    this.session = {
      id: 'sess_' + Date.now().toString(36),
      inviteCode: this.makeInvite(),
      startedAt: Date.now()
    };
    this.state = {
      version: 0,
      mapId: startMapId,
      mapName: '',
      world: null, // streamed-overworld info {seed, regionW, regionH, focus, mapId} while outdoors
      dayNight: {
        mode: 'cycle',
        time: startMapId === 'ashen_reach' ? 10 * 60 : 21 * 60,
      }, // outdoor exploration starts in daylight; the dungeon retains its night baseline
      weather: { type: 'clear', intensity: 0 },
      players: [],
      tokens: [],
      doors: [],
      chat: [],
      initiative: null // { order:[ids], turnIdx, round, movement } when combat is on (T2-b)
    };
    this.dayNightBaseTime = this.state.dayNight.time;
    this.dayNightBaseTimestamp = this.session.startedAt;
    this.maps = new Map();             // id -> MapDef
    this.mapRuntime = new Map();       // per-map doors, creatures, and party positions for this session
    this.exitReturnMapId = startMapId;
    this.playerProfiles = new Map();    // private reconnect data; not part of public player state
    this.map = null;                   // current MapDef
    this.monsterAwareness = new Map();  // private encounter state; never sent in player snapshots
    this.wallCells = new Set();        // "cx,cz" of blocked cells for move validation
    this.halfWallCells = new Map();    // "cx,cz" -> Set of blocked orientations ('nw'|'ne'|'se'|'sw')
    this.lastMoveAt = new Map();       // tokenId -> ms (movement rate guard)
    this.net = null;                   // set by ws.js: { sendToUser, broadcast }
    this.loadMapRegistry();
    // Keep the first playable dungeon on the same authored-module path as the
    // generator tool; a fixed seed makes the default scene stable for QA.
    const starterDungeon = generateDungeon({ seed: 41003, size: 'medium' });
    if (starterDungeon) {
      this.maps.set('ashen_cellar', {
        ...starterDungeon,
        id: 'ashen_cellar',
        name: 'The Ashen Cellar',
      });
    }
    this.maps.set('ashen_reach', generateOverworld({ seed: 73021 }));
    this.dmKey = 'dm_' + this.makeInvite();
    // P3.3 streamed world: the overworld is a grid of regions; the party's
    // focus region + its 1-ring are generated and registered on demand.
    this.worldCtx = null;            // lazy world context (rivers/roads/features)
    this.worldFocus = null;          // {rx, rz} while the party is in the overworld
    this.regionBlocks = new Map();   // "rx,rz" -> { walls:Set, halfs:Map } (region-local cells)
    this.regionProps = new Map();    // "rx,rz" -> world-ft prop colliders
    this.worldPatch = null;          // pending focus-change payload consumed by ws.js
    if (startMapId === 'ashen_reach') this.initWorld();
    // director options feed (spawn points from the current map)
    this.directorOpts = () => ({
      spawnPoints: (this.map?.spawns?.monsters || []).map((s) => ({
        monsterId: s.monsterId || null,
        x: s.x * CELL_FT, z: s.z * CELL_FT,
      })),
      partyLevel: Math.max(1, this.state.players.length),
    });
    attachCombat(this);          // before setMap: first map load uses SRD spawns
    this.setMap(this.state.mapId);
    this.state.world = this.publicWorld();
    console.log(`[GM] DM key: ${this.dmKey}`);
    console.log(`[GM] invite: ${this.session.inviteCode}`);
  }

  // ─── helpers ───────────────────────────────────────────────────────────
  makeInvite() { return Math.random().toString(36).slice(2, 8); }
  bump() { this.state.version++; return this.state.version; }
  presenceCount() { return this.state.players.filter(p => p.online).length; }
  playerById(id) { return this.state.players.find(p => p.id === id); }
  tokenById(id) { return this.state.tokens.find(t => t.id === id); }
  tokenOf(userId) { return this.state.tokens.find(t => t.kind === 'player' && t.ownerId === userId); }
  isDM(userId) { const p = this.playerById(userId); return !!(p && p.role === 'dm'); }

  /** Authoritative commit: bump version + broadcast a state:patch. Rules
   *  engine (T2-b) should call this after any direct state mutation. */
  commit(patch = {}, exceptUserId = null) {
    this.bump();
    this.net?.broadcast('state:patch', { version: this.state.version, ...patch }, exceptUserId);
  }

  loadMapRegistry() {
    const dir = path.resolve(__dirname, 'maps');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
    for (const f of files) {
      try {
        const def = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        this.maps.set(def.id, def);
      } catch (e) { console.warn('[GM] bad map file', f, e.message); }
    }
    console.log(`[GM] loaded ${this.maps.size} maps: ${[...this.maps.keys()].join(', ')}`);
  }

  getMap(id) { return this.maps.get(id ?? this.state.mapId) || null; }

  // ─── streamed world (P3.3) ──────────────────────────────────────────
  initWorld() {
    if (this.worldCtx) return;
    const home = this.maps.get('ashen_reach');   // raw def feeds the world context
    this.worldCtx = getWorldContext({ seed: WORLD_SEED, homeDef: home });
    this.worldFocus = { rx: 0, rz: 0 };
    // swap the raw home def for the stitched, region-marked one so movement,
    // blocking and the client all treat it as a streamable region
    this.maps.delete('ashen_reach');
    this.ensureRegionRing(0, 0);
  }

  ensureRegion(rx, rz) {
    if (!Number.isInteger(rx) || !Number.isInteger(rz)) return false;
    const id = regionId(rx, rz);
    if (this.maps.has(id)) return true;
    if (!this.worldCtx) this.initWorld();
    try {
      const def = generateRegion(rx, rz, {
        seed: WORLD_SEED, ctx: this.worldCtx, homeDef: this.maps.get('ashen_reach'),
      });
      this.maps.set(id, def);
      this.registerRegionData(def, rx, rz);
      return true;
    } catch (e) {
      console.warn('[GM] region generate failed', rx, rz, e.message);
      return false;
    }
  }

  /** Focus region + 1-ring stay registered; farther regions are pruned from
   *  the def cache (deterministic regeneration on demand). Per-region session
   *  runtime in mapRuntime is retained for the whole session. */
  ensureRegionRing(rx, rz) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) this.ensureRegion(rx + dx, rz + dz);
    }
    for (const id of [...this.maps.keys()]) {
      const parsed = parseRegionId(id);
      if (!parsed) continue;
      if (Math.abs(parsed.rx - rx) > 2 || Math.abs(parsed.rz - rz) > 2) this.maps.delete(id);
    }
    for (const key of [...this.regionBlocks.keys()]) {
      const [kx, kz] = key.split(',').map(Number);
      if (Math.abs(kx - rx) > 2 || Math.abs(kz - rz) > 2) {
        this.regionBlocks.delete(key);
        this.regionProps.delete(key);
      }
    }
  }

  registerRegionData(def, rx, rz) {
    const key = rx + ',' + rz;
    const walls = new Set();
    const halfs = new Map();
    const addHalf = (cx, cz, orientation) => {
      const k = cx + ',' + cz;
      let set = halfs.get(k);
      if (!set) { set = new Set(); halfs.set(k, set); }
      set.add(this.normalizeHalfTile(orientation));
    };
    for (const cell of def.cells?.wall || []) {
      if (cell[2]) addHalf(cell[0], cell[1], cell[2]);
      else walls.add(cell[0] + ',' + cell[1]);
    }
    // water is walkable by design (shallow fords) — it no longer blocks movement
    for (const ht of def.cells?.halfTiles || []) {
      if (ht.type === 'wall') addHalf(ht.x, ht.z, ht.orientation);
    }
    this.regionBlocks.set(key, { walls, halfs });
    const origin = regionOriginFt(rx, rz);
    const colliders = [];
    for (const prop of def.props || []) {
      const fp = this.propFootprint(prop, origin.x, origin.z);
      if (fp) colliders.push(fp);
    }
    this.regionProps.set(key, colliders);
  }

  publicWorld() {
    if (!this.worldFocus) return null;
    return {
      seed: WORLD_SEED,
      regionW: REGION_W,
      regionH: REGION_H,
      focus: { ...this.worldFocus },
      mapId: this.state.mapId,
    };
  }

  /** Seamless border crossing: the token keeps its world position; the party's
   *  focus region (and the client's render window) follows. No repositioning,
   *  no runtime reset — overworld regions hold no doors or monsters. */
  shiftFocus(rx, rz) {
    if (!this.worldCtx) this.initWorld();
    if (!this.ensureRegion(rx, rz)) return;
    this.worldFocus = { rx, rz };
    this.ensureRegionRing(rx, rz);
    const id = regionId(rx, rz);
    this.map = this.maps.get(id);
    this.state.mapId = id;
    this.state.mapName = this.map.name || id;
    this.state.world = this.publicWorld();
    this.monsterAwareness.clear();
    this.worldPatch = {
      world: this.state.world,
      mapId: this.state.mapId,
      mapName: this.state.mapName,
    };
    this.bump();
  }

  /** ws.js consumes this after an accepted move to fold the focus change into
   *  the same state:patch broadcast. */
  consumeWorldPatch() { const p = this.worldPatch; this.worldPatch = null; return p; }
  doorsForUser(userId) {
    const isDM = this.playerById(userId)?.role === 'dm';
    return (this.state.doors || [])
      .filter((door) => !door.secret || door.revealed || isDM)
      .map((door) => {
        const wall = this.map?.walls?.[door.wallIndex];
        return { ...door, x1: wall?.x1, z1: wall?.z1, x2: wall?.x2, z2: wall?.z2 };
      });
  }

  getWallsWithDoorState() {
    const doors = new Map((this.state.doors || []).map((door) => [door.wallIndex, door]));
    return (this.map?.walls || []).map((wall, wallIndex) => {
      const door = doors.get(wallIndex);
      if (!door) return wall;
      const centered = wall.x1 === wall.x2
        ? { ...wall, x1: wall.x1 + 0.5, x2: wall.x2 + 0.5 }
        : { ...wall, z1: wall.z1 + 0.5, z2: wall.z2 + 0.5 };
      return { ...centered, isOpen: door.open };
    });
  }

  getPublicMap(userId, mapId = this.state.mapId) {
    const map = this.getMap(mapId);
    if (!map) return map;
    const isDM = this.playerById(userId)?.role === 'dm';
    const doorStates = mapId === this.state.mapId ? this.state.doors : (map.walls || []).flatMap((wall, wallIndex) =>
      wall.type === 'door' || wall.type === 'secret_door'
        ? [{
          wallIndex, open: !!wall.isOpen, locked: !!wall.locked,
          secret: wall.type === 'secret_door',
          revealed: wall.type !== 'secret_door' || !!wall.revealed,
        }]
        : []);
    const doors = new Map((doorStates || []).map((door) => [door.wallIndex, door]));
    const walls = (map.walls || []).map((wall, wallIndex) => {
      const door = doors.get(wallIndex);
      if (!door) return wall;
      if (door.secret && !door.revealed && !isDM) {
        const disguised = { ...wall, type: 'normal' };
        delete disguised.isOpen;
        delete disguised.locked;
        delete disguised.revealed;
        return disguised;
      }
      return {
        ...wall,
        isOpen: door.open,
        locked: door.locked,
      };
    });
    const cells = { ...(map.cells || {}), wall: [...(map.cells?.wall || [])] };
    if (!isDM) {
      for (const door of doorStates || []) {
        if (door.secret && !door.revealed) {
          for (const [x, z] of this.secretDoorCells(map.walls[door.wallIndex])) {
            if (!cells.wall.some(([cx, cz]) => cx === x && cz === z)) cells.wall.push([x, z]);
          }
        }
      }
    }
    return {
      ...map,
      walls,
      cells,
      spawns: isDM ? map.spawns : { ...map.spawns, monsters: [] },
    };
  }

  secretDoorCells(wall) {
    if (!wall) return [];
    const cells = [];
    if (wall.x1 === wall.x2) {
      for (let z = Math.floor(Math.min(wall.z1, wall.z2)); z < Math.ceil(Math.max(wall.z1, wall.z2)); z++) {
        cells.push([Math.floor(wall.x1), z]);
      }
    } else {
      for (let x = Math.floor(Math.min(wall.x1, wall.x2)); x < Math.ceil(Math.max(wall.x1, wall.x2)); x++) {
        cells.push([x, Math.floor(wall.z1)]);
      }
    }
    return cells;
  }

  normalizeHalfTile(orientation) {
    if (!orientation) return 'nw';
    const o = String(orientation).toLowerCase();
    if (o === 'tl' || o === 'top_left' || o === 'nw' || o === 'northwest') return 'nw';
    if (o === 'tr' || o === 'top_right' || o === 'ne' || o === 'northeast') return 'ne';
    if (o === 'br' || o === 'bottom_right' || o === 'se' || o === 'southeast') return 'se';
    if (o === 'bl' || o === 'bottom_left' || o === 'sw' || o === 'southwest') return 'sw';
    return 'nw';
  }

  isPointInHalfTile(u, v, orientation) {
    const norm = this.normalizeHalfTile(orientation);
    if (norm === 'nw') return u + v <= 1.0;
    if (norm === 'se') return u + v >= 1.0;
    if (norm === 'ne') return u >= v;
    if (norm === 'sw') return u <= v;
    return true;
  }

  rebuildWallCells() {
    this.wallCells = new Set();
    this.halfWallCells = new Map();

    const addCell = (cell) => {
      const cx = cell[0], cz = cell[1], orientation = cell[2];
      const key = cx + ',' + cz;
      if (orientation) {
        let set = this.halfWallCells.get(key);
        if (!set) { set = new Set(); this.halfWallCells.set(key, set); }
        set.add(this.normalizeHalfTile(orientation));
      } else {
        this.wallCells.add(key);
      }
    };

    for (const cell of this.map?.cells?.wall || []) addCell(cell);
    // water is walkable by design (shallow fords) — it no longer blocks movement
    for (const h of this.map?.cells?.halfTiles || []) {
      if (h.type === 'wall') {
        const key = h.x + ',' + h.z;
        let set = this.halfWallCells.get(key);
        if (!set) { set = new Set(); this.halfWallCells.set(key, set); }
        set.add(this.normalizeHalfTile(h.orientation));
      }
    }
    for (const [key, set] of this.halfWallCells) {
      if ((set.has('nw') && set.has('se')) || (set.has('ne') && set.has('sw'))) {
        this.wallCells.add(key);
      }
    }

    for (const door of this.state.doors || []) {
      if (door.secret && !door.revealed) {
        for (const [cx, cz] of this.secretDoorCells(this.map.walls[door.wallIndex])) {
          this.wallCells.add(cx + ',' + cz);
        }
      }
    }
  }

  isBlockedAt(x, z) {
    if (this.worldFocus && this.map?.region) {
      // streamed world: the point's region holds the blocking data (region-local)
      const gx = Math.floor(x / CELL_FT), gz = Math.floor(z / CELL_FT);
      const rx = Math.floor(gx / REGION_W), rz = Math.floor(gz / REGION_H);
      const blocks = this.regionBlocks.get(rx + ',' + rz);
      if (!blocks) return true;              // region not loaded -> solid
      const lx = gx - rx * REGION_W, lz = gz - rz * REGION_H;
      const key = lx + ',' + lz;
      if (blocks.walls.has(key)) return true;
      const half = blocks.halfs.get(key);
      if (half && half.size > 0) {
        const u = (x - gx * CELL_FT) / CELL_FT;
        const v = (z - gz * CELL_FT) / CELL_FT;
        for (const orientation of half) {
          if (this.isPointInHalfTile(u, v, orientation)) return true;
        }
      }
      return false;
    }
    if (!this.map || x < 0 || z < 0 ||
      x >= this.map.size.w * CELL_FT || z >= this.map.size.h * CELL_FT) {
      return true;
    }
    const cx = Math.floor(x / CELL_FT), cz = Math.floor(z / CELL_FT);
    const key = cx + ',' + cz;
    if (this.wallCells.has(key)) return true;
    const half = this.halfWallCells?.get(key);
    if (half && half.size > 0) {
      const u = (x - cx * CELL_FT) / CELL_FT;
      const v = (z - cz * CELL_FT) / CELL_FT;
      for (const orientation of half) {
        if (this.isPointInHalfTile(u, v, orientation)) return true;
      }
    }
    return false;
  }

  doorDistance(token, wall) {
    const centered = wall.x1 === wall.x2
      ? { ...wall, x1: wall.x1 + 0.5, x2: wall.x2 + 0.5 }
      : { ...wall, z1: wall.z1 + 0.5, z2: wall.z2 + 0.5 };
    const ax = centered.x1 * CELL_FT, az = centered.z1 * CELL_FT;
    const bx = centered.x2 * CELL_FT, bz = centered.z2 * CELL_FT;
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((token.x - ax) * dx + (token.z - az) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(token.x - (ax + t * dx), token.z - (az + t * dz));
  }

  crossesClosedDoor(from, to) {
    const rx = to.x - from.x, rz = to.z - from.z;
    for (const door of this.state.doors || []) {
      if (door.open) continue;
      const wall = this.map?.walls?.[door.wallIndex];
      if (!wall) continue;
      const centered = wall.x1 === wall.x2
        ? { ...wall, x1: wall.x1 + 0.5, x2: wall.x2 + 0.5 }
        : { ...wall, z1: wall.z1 + 0.5, z2: wall.z2 + 0.5 };
      const sx = (centered.x2 - centered.x1) * CELL_FT, sz = (centered.z2 - centered.z1) * CELL_FT;
      const qx = centered.x1 * CELL_FT - from.x, qz = centered.z1 * CELL_FT - from.z;
      const den = rx * sz - rz * sx;
      if (Math.abs(den) < 1e-8) continue;
      const t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
      if (t > 0.001 && t <= 1 && u >= 0 && u <= 1) return true;
    }
    return false;
  }

  /** Quick win (kit collision): single source of truth for prop collision
   *  footprints in world feet, mirroring the client's tilegrid/props.ts +
   *  structures.ts boxes. Used by registerRegionData (streamed overworld) and
   *  overlapsLandscapeProp (dungeon maps) so server validation agrees with
   *  client prediction. Deliberately collidable but RNG-shaped (ruin_wall's
   *  walkable breach) and decorative-walkable props (grave_fence, grave_mound,
   *  grave_marker, rubble, snow_drift, twig) stay collider-free on BOTH sides.
   *  Returns {minX,minZ,maxX,maxZ,tol} or null. */
  propFootprint(prop, ox, oz) {
    const cx = prop.x * CELL_FT + ox, cz = prop.z * CELL_FT + oz;
    const rotated = Math.abs(Math.sin(prop.rotY || 0)) > 0.5;
    const box = (halfX, halfZ, tol = 0.85) =>
      ({ minX: cx - halfX, minZ: cz - halfZ, maxX: cx + halfX, maxZ: cz + halfZ, tol });
    switch (prop.type) {
      case 'building': {
        const width = prop.width || 5, depth = prop.depth || 5;
        return box((rotated ? depth : width) * CELL_FT * 0.82 * 0.44, (rotated ? width : depth) * CELL_FT * 0.82 * 0.44);
      }
      case 'tree': {
        const scale = (prop.scale || 1) * (prop.variant === 'dead' ? 1.2 : 1);
        if (scale <= 1.12) return null;
        const radius = Math.max(0.65, scale * 0.35);
        return box(radius, radius, 0.75);
      }
      case 'boulder': {
        const radius = Math.max(1.1, (prop.scale || 1) * 0.75);
        return box(radius, radius);
      }
      // ── dungeon kit props (boxes mirror props.ts colliders exactly) ──
      case 'pillar': return box(2.4, 2.4, 0.7);
      case 'brazier': return box(1.4, 1.4, 0.7);
      case 'coffin': return box(rotated ? 4.3 : 2.1, rotated ? 2.1 : 4.3, 0.8);
      case 'altar': return box(rotated ? 3 : 5, rotated ? 5 : 3, 0.8);
      // ── world structure kits (boxes mirror structures.ts colliders) ──
      case 'well': return box(2.5, 2.5, 0.8);
      case 'ruin_column': {
        const s = prop.scale || 1;
        return box(1.1 * s, 1.1 * s, 0.75);
      }
      case 'ruin_column_fallen': {
        const s = prop.scale || 1;
        return box(rotated ? 1.3 * s : 2.0 * s, rotated ? 2.0 * s : 1.3 * s, 0.8);
      }
      case 'ruin_slab': return box(rotated ? 2.2 : 3, rotated ? 3 : 2.2, 0.8);
      case 'grave_gate': return box(rotated ? 1.0 : 4.6, rotated ? 4.6 : 1.0, 0.7);
      case 'mausoleum': return box(rotated ? 3.6 : 4.9, rotated ? 4.9 : 3.6);
      case 'columbarium': return box(rotated ? 1.0 : 4.9, rotated ? 4.9 : 1.0, 0.75);
      case 'ruin_pillar': {
        const s = prop.scale || 1;
        return box(1.1 * s, 1.1 * s, 0.75);
      }
      default: return null;
    }
  }

  overlapsLandscapeProp(x, z) {
    if (this.worldFocus && this.map?.region) {
      const gx = Math.floor(x / CELL_FT), gz = Math.floor(z / CELL_FT);
      const rx = Math.floor(gx / REGION_W), rz = Math.floor(gz / REGION_H);
      const colliders = this.regionProps.get(rx + ',' + rz);
      if (!colliders) return false;
      for (const c of colliders) {
        const dx = Math.max(c.minX - x, 0, x - c.maxX);
        const dz = Math.max(c.minZ - z, 0, z - c.maxZ);
        if (Math.hypot(dx, dz) < (c.tol || 0.85)) return true;
      }
      return false;
    }
    const overlapsCollider = (minX, minZ, maxX, maxZ, tolerance = 0.85) => {
      const dx = Math.max(minX - x, 0, x - maxX);
      const dz = Math.max(minZ - z, 0, z - maxZ);
      return Math.hypot(dx, dz) < tolerance;
    };
    for (const prop of this.map?.props || []) {
      const fp = this.propFootprint(prop, 0, 0);
      if (fp && overlapsCollider(fp.minX, fp.minZ, fp.maxX, fp.maxZ, fp.tol)) return true;
    }
    return false;
  }

  interactDoor(userId, wallIndex) {
    const token = this.tokenOf(userId);
    const door = this.state.doors?.find((item) => item.wallIndex === Number(wallIndex));
    if (!token || !door) return { ok: false, reason: 'no_door' };
    if (door.secret && !door.revealed) return { ok: false, reason: 'no_door' };
    const wall = this.map?.walls?.[door.wallIndex];
    if (!wall || this.doorDistance(token, wall) > 8.5) return { ok: false, reason: 'too_far' };
    if (door.locked) return { ok: false, reason: 'locked' };
    door.open = !door.open;
    this.bump();
    this.net?.broadcast('state:patch', { version: this.state.version, doors: this.state.doors });
    this.checkAmbush?.();
    return { ok: true, open: door.open };
  }

  tokensForUser(userId) {
    const player = this.tokenOf(userId);
    if (!player || this.playerById(userId)?.role === 'dm') return this.state.tokens;
    const walls = this.getWallsWithDoorState();
    const blocked = (a, b) => {
      const rx = b.x - a.x, rz = b.z - a.z;
      for (const wall of walls) {
        if (wall.type === 'window' || (wall.isOpen && (wall.type === 'door' || wall.type === 'secret_door'))) continue;
        const sx = (wall.x2 - wall.x1) * CELL_FT, sz = (wall.z2 - wall.z1) * CELL_FT;
        const qx = wall.x1 * CELL_FT - a.x, qz = wall.z1 * CELL_FT - a.z;
        const den = rx * sz - rz * sx;
        if (Math.abs(den) < 1e-8) continue;
        const t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
        if (t > 0.02 && t < 0.98 && u >= 0 && u <= 1) return true;
      }
      return false;
    };
    // P3.13: token reveal is light-aware — a monster is sent to the client
    // when it is within its own effective sight of the player (the same
    // flip-flop the AI uses). In dark rooms low-darkvision creatures stay
    // hidden until you're close; rendering darkness hides unlit figures.
    const timeMin = this.getDayNight().time;
    const torches = torchPointsFromTokens(this.state.tokens);
    const litAt = (x, z) => lightLevelAt({
      isDungeon: !this.state.world, x, z, timeMin,
      mapLights: this.map?.lights, torchPoints: torches,
    });
    return this.state.tokens.filter((token) => {
      if (token.kind === 'player') return true;
      if (token.hidden) return false;
      return Math.hypot(token.x - player.x, token.z - player.z) <= effectiveVisionFt(token.senses, litAt(player.x, player.z))
        && !blocked(player, token);
    });
  }
  initiativeForUser(userId) {
    const initiative = this.state.initiative;
    if (!initiative || !Array.isArray(initiative.order)) return initiative;
    if (this.playerById(userId)?.role === 'dm') return initiative;
    const visibleIds = new Set(this.tokensForUser(userId).map((token) => token.id));
    const order = initiative.order.filter((id) => visibleIds.has(id));
    const activeId = initiative.order[initiative.turnIdx];
    const turnIdx = order.indexOf(activeId);
    const movement = initiative.movement && visibleIds.has(initiative.movement.tokenId)
      ? {
        tokenId: initiative.movement.tokenId,
        usedFt: initiative.movement.usedFt,
        maxFt: initiative.movement.maxFt,
      }
      : null;
    return { order, turnIdx, round: initiative.round, movement };
  }
  listMaps() { return [...this.maps.values()].map(m => ({ id: m.id, name: m.name })); }

  partySpawn() {
    // map defs store CELL coords — tokens store WORLD FEET (cell * 5)
    const s = (this.map?.spawns?.party && this.map.spawns.party[0]) || [6.5, 27.5];
    const c = Array.isArray(s) ? { x: s[0], z: s[1] } : { x: s.x ?? 0, z: s.z ?? 0 };
    return { x: c.x * CELL_FT, z: c.z * CELL_FT };
  }

  /** In-bounds AND not a wall cell (map cells.wall is the only solid class). */
  isOpenCell(cx, cz) {
    const m = this.map;
    if (!m || cx < 0 || cz < 0 || cx >= m.size.w || cz >= m.size.h) return false;
    return !this.wallCells.has(cx + ',' + cz);
  }

  /** (cx,cz) if open, else the first open cell found on Chebyshev rings r=1..20. */
  nearestOpenCell(cx, cz) {
    if (this.isOpenCell(cx, cz)) return { cx, cz };
    for (let r = 1; r <= 20; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;   // ring cells only
          if (this.isOpenCell(cx + dx, cz + dz)) return { cx: cx + dx, cz: cz + dz };
        }
      }
    }
    return null;
  }

  /** Ring slot i around the party spawn, snapped to the nearest OPEN cell so a
   *  token never materialises inside a wall (ring cells are 1.2 ≈ 6ft out). */
  partyRingCell(i) {
    const spawn = this.partySpawn();
    const scx = Math.floor(spawn.x / CELL_FT), scz = Math.floor(spawn.z / CELL_FT);
    const ang = (i / 6) * Math.PI * 2;
    return this.nearestOpenCell(
      scx + Math.round(Math.cos(ang) * 1.2),
      scz + Math.round(Math.sin(ang) * 1.2)
    ) || { cx: scx, cz: scz };
  }

  setMap(id) {
    const m = this.maps.get(id);
    if (!m) return false;
    if (this.map && this.state.mapId !== id) this.saveMapRuntime();
    this.map = m;
    this.monsterAwareness.clear();
    this.lastMoveAt.clear();
    this.state.mapId = id;
    this.state.mapName = m.name || id;
    const runtime = this.mapRuntime.get(id);
    this.state.doors = runtime
      ? runtime.doors.map((door) => ({ ...door }))
      : (m.walls || []).flatMap((wall, wallIndex) =>
        wall.type === 'door' || wall.type === 'secret_door'
          ? [{
            wallIndex,
            open: !!wall.isOpen,
            locked: !!wall.locked,
            secret: wall.type === 'secret_door',
            revealed: wall.type !== 'secret_door' || !!wall.revealed,
          }]
          : []);
    this.rebuildWallCells();
    const players = this.state.tokens.filter((token) => token.kind === 'player');
    if (runtime) {
      this.state.tokens = [...players, ...runtime.monsters.map((token) => ({ ...token }))];
      this.placeParty(runtime.partyPositions);
    } else {
      this.state.tokens = players;
      for (const s of m.spawns.monsters || []) {
        const tok = this.spawnMonster
          ? this.spawnMonster(s)
          : this.makeMonsterToken(s);
        if (tok && !this.state.tokens.includes(tok)) this.state.tokens.push(tok);
      }
      this.placeParty();
    }
    this.state.world = this.map?.region ? this.publicWorld() : null;
    this.bump();
    return true;
  }

  saveMapRuntime() {
    const partyPositions = Object.fromEntries(this.state.tokens
      .filter((token) => token.kind === 'player')
      .map((token) => [token.ownerId, { x: token.x, z: token.z, rotY: token.rotY || 0 }]));
    this.mapRuntime.set(this.state.mapId, {
      doors: this.state.doors.map((door) => ({ ...door })),
      monsters: this.state.tokens
        .filter((token) => token.kind !== 'player')
        .map((token) => structuredClone(token)),
      partyPositions,
    });
  }

  useExit(userId, exitId) {
    const token = this.tokenOf(userId);
    const exit = this.map?.exits?.find((item) => item.id === exitId);
    if (!token || !exit) return { ok: false, reason: 'no_exit' };
    if (token.hp <= 0 || token.deathSaves?.dead) return { ok: false, reason: 'actor_down' };
    if (this.state.initiative) return { ok: false, reason: 'in_combat' };
    if (Math.hypot(token.x - exit.x * CELL_FT, token.z - exit.z * CELL_FT) > 10) {
      return { ok: false, reason: 'too_far' };
    }

    const destinationId = exit.returnToPrevious
      ? this.exitReturnMapId
      : exit.destinationMapId;
    if (typeof destinationId !== 'string' || !this.maps.has(destinationId)) {
      // region destinations regenerate deterministically when pruned from the
      // def cache; only truly unknown ids are rejected here
      const parsed = parseRegionId(destinationId || '');
      if (!parsed) return { ok: false, reason: 'no_destination' };
    }
    if (!exit.returnToPrevious) this.exitReturnMapId = this.state.mapId;
    const destRegion = parseRegionId(destinationId);
    if (destRegion) {
      if (!this.worldCtx) this.initWorld();
      if (!this.ensureRegion(destRegion.rx, destRegion.rz)) return { ok: false, reason: 'no_destination' };
      this.worldFocus = { rx: destRegion.rx, rz: destRegion.rz };
      this.ensureRegionRing(destRegion.rx, destRegion.rz);
    }
    if (!this.setMap(destinationId)) return { ok: false, reason: 'no_destination' };
    this.narrate(destinationId === 'ashen_reach'
      ? 'The party emerges into the Ashen Reach.'
      : destinationId === 'ashen_cellar'
        ? 'The party descends into the crypt.'
        : destRegion
          ? 'The party presses on into the wilds.'
          : 'The party returns to the road.', '#7fd4c8');
    this.commit({
      mapId: this.state.mapId,
      mapName: this.state.mapName,
      map: this.map,
      tokens: this.state.tokens,
      doors: this.state.doors,
      chat: this.state.chat,
      // streamed-world focus rides along (null inside dungeons) so clients
      // keep a truthful `world` across map transitions instead of a stale
      // pre-dungeon focus
      world: this.state.world,
    });
    return { ok: true, mapId: destinationId };
  }

  makeMonsterToken(s, worldCoords = false) {
    const wx = worldCoords ? s.x : s.x * CELL_FT;
    const wz = worldCoords ? s.z : s.z * CELL_FT;
    const t = {
      id: 'mob_' + Math.random().toString(36).slice(2, 9),
      kind: 'monster',
      ownerId: 'DM',
      name: s.name || 'Creature',
      archetype: s.archetype || 'skeleton',
      x: wx, z: wz, rotY: s.rotY || 0,
      hp: s.hp || 12, hpMax: s.hp || 12, ac: s.ac || 13, speedFt: s.speedFt || 30,
      initiative: 0,
      conditions: [],
      deathSaves: null,
      size: s.size || 1,
      hidden: !!s.hidden,
      wander: s.wander !== false,
      portraitSeed: (Math.random() * 1e6) | 0
    };
    if (s.monsterId) t.monsterId = s.monsterId;
    return t;
  }

  /** Legacy/spawn fallback used by CombatDriver when no SRD entry matches. */
  __legacySpawn(s) {
    const tok = this.makeMonsterToken(s, true);
    this.state.tokens.push(tok);
    this.bump();
    return tok;
  }

  placeParty(positions = null) {
    let i = 0;
    for (const t of this.state.tokens) {
      if (t.kind !== 'player') continue;
      const slot = i++;
      const saved = positions?.[t.ownerId];
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
        t.x = saved.x;
        t.z = saved.z;
        t.rotY = Number.isFinite(saved.rotY) ? saved.rotY : 0;
        continue;
      }
      // distribute players in a ring around the party spawn so they never stack
      // (nearest-open snap: a plain ring can land a token inside a wall cell)
      const cell = this.partyRingCell(slot);
      t.x = cell.cx * CELL_FT + CELL_FT / 2;
      t.z = cell.cz * CELL_FT + CELL_FT / 2;
    }
  }

  // ─── join / leave ─────────────────────────────────────────────────────
  join(msg = {}) {
    const name = String(msg.name || '').trim().slice(0, 20) || 'Wanderer';
    const archetype = ARCHETYPES[msg.archetype] ? msg.archetype : 'warden';

    // 1. Reconnect by id (survives dropped sockets + page reloads; bypasses
    //    invite + cap). If the token was swept by leave(), reforge it.
    if (msg.resumeId) {
      const p = this.playerById(String(msg.resumeId));
      if (p) {
        p.online = true;
        if (msg.name) p.name = name;
        const currentToken = this.tokenOf(p.id);
        if (currentToken) currentToken.name = p.name;
        if (!this.tokenOf(p.id)) {
          const profile = this.playerProfiles.get(p.id);
          const token = profile?.token && profile.mapId === this.state.mapId
            ? profile.token
            : this.makePlayerToken(p, archetype, profile?.character);
          token.name = p.name;
          this.state.tokens.push(token);
          if (profile) {
            profile.token = null;
            profile.mapId = this.state.mapId;
          }
        }
        this.bump();
        this.checkUnassistedDowned?.();
        return { ok: true, you: p };
      }
      // unknown resume id → fall through to a fresh join
    }

    // 2. Invite gate — only enforced when the client claims a code
    if (msg.invite && String(msg.invite) !== this.session.inviteCode) {
      return { ok: false, code: 'bad_invite', message: 'That summons is cold — the invite code does not match this session.' };
    }

    // 3. Capacity
    if (this.presenceCount() >= MAX_PLAYERS) {
      return { ok: false, code: 'full', message: 'The reach is crowded (6 max).' };
    }

    // 4. DM claim — first presentation wins (checkbox or ?dm=<key> from the launcher)
    const wantsDM = msg.dm === true || (typeof msg.dmKey === 'string' && msg.dmKey.length > 0 && msg.dmKey === this.dmKey);
    const dmActive = this.state.players.some(p => p.role === 'dm' && p.online);
    const role = wantsDM && !dmActive ? 'dm' : 'player';

    const id = 'u_' + Math.random().toString(36).slice(2, 9);
    const color = PLAYER_COLORS[this.state.players.length % PLAYER_COLORS.length];
    const player = { id, name, color, role, online: true };
    const character = msg.character && typeof msg.character === 'object' && !Array.isArray(msg.character)
      ? msg.character : null;
    const characterId = typeof character?.id === 'string' ? character.id : null;
    if (characterId && [...this.playerProfiles.values()].some(profile =>
      profile.character?.id === characterId && (profile.token?.deathSaves?.dead || profile.token?.adventureEnded))) {
      return { ok: false, code: 'character_dead', message: 'This character’s adventure has ended.' };
    }
    this.state.players.push(player);
    this.playerProfiles.set(id, { character, token: null, mapId: this.state.mapId });
    this.state.tokens.push(this.makePlayerToken(player, archetype, character));
    this.bump();
    return { ok: true, you: player };
  }

  /** Player token at a free spot on the party spawn ring. With a CharacterDef
   *  (from the creation wizard) the token gets REAL 5E stats via the SRD engine;
   *  otherwise it falls back to the M0 archetype flavors. */
  makePlayerToken(player, archetype, character = null) {
    let sheet = null;
    if (character && typeof character === 'object' && character.class) {
      try {
        sheet = buildCharacter({
          name: player.name,
          race: character.race || 'human',
          class: character.class,
          subrace: character.subrace,
          ...(character.subclass ? { subclass: character.subclass } : {}), // level-1 path (FIX 6)
          level: Number(character.level) || 1,
          abilities: character.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          background: character.background || 'wanderer',
          skillProficiencies: character.skillProficiencies || [],
          spells: character.spells,
          equipmentOverrides: character.equipmentOverrides,
          id: character.id,
          look: character.look || {},
        });
        archetype = sheet.archetype || archetype;   // engine maps class → figure
      } catch (e) {
        console.warn('[GM] character build failed, using archetype stats:', e.message);
        sheet = null;
      }
    }
    const a = ARCHETYPES[ARCHETYPES[archetype] ? archetype : 'warden'];
    const ringIdx = this.state.tokens.filter(t => t.kind === 'player').length;
    const cell = this.partyRingCell(ringIdx);
    const hpMax = sheet ? sheet.hp.max : a.hpMax;
    const token = {
      id: 'tok_' + player.id.slice(2),
      kind: 'player',
      ownerId: player.id,
      name: player.name, color: player.color, archetype,
      x: cell.cx * CELL_FT + CELL_FT / 2,
      z: cell.cz * CELL_FT + CELL_FT / 2, rotY: 0,
      hp: sheet ? sheet.hp.current : a.hp, hpMax,
      ac: sheet ? sheet.ac : a.ac,
      speedFt: sheet ? (sheet.speedFt || a.speedFt) : a.speedFt,
      initiative: 0,
      conditions: [], deathSaves: { ok: 0, fail: 0, stable: false, dead: false },
      size: 1, hidden: false, wander: false,
      portraitSeed: (Math.random() * 1e6) | 0
    };
    if (sheet) {
      token.sheet = sheet;             // full 5E sheet (attacks, spells, skills)
      if (typeof character?.id === 'string') token.characterId = character.id;
      if (typeof character?.id === 'string') token.characterId = character.id;
      // sheet.look keeps the canonical wizard form (palette indices, SCHEMA §3);
      // token.look is the RIG form (hex strings) — see mapLookToRig. The raw
      // pass-through fed numbers to the rig's hex parser and crashed the whole
      // client TOKENS_SYNC (post-creation "no figure / can't move" bug).
      token.look = this.mapLookToRig(sheet.look || character?.look);
    }
    return token;
  }

  /** SCHEMA.md §3 documented-but-previously-missing mapping: wizard look palette
   *  indices → 3D rig look (engine/types.ts TokenLook — hex strings + rig
   *  bodyType/hair tokens). Hex values mirror ui/create/portrait.ts palettes
   *  (base tones) so the portrait preview and the 3D figure agree. */
  mapLookToRig(look) {
    if (!look || typeof look !== 'object') return null;
    const idx = (v, len) => (typeof v === 'number' && Number.isFinite(v) ? ((v % len) + len) % len : 0);
    const SKIN = [
      '#cdb69e', '#a8a29b', '#b28a5f', '#998059', '#664629', '#918c74',
      '#b87b46', '#382417', '#282630', '#e5dacf', '#843330', '#5e6e4a'
    ];
    const HAIR = [
      '#26242e', '#57452f', '#6d4526', '#934d1f', '#a79f8e', '#732f16',
      '#ab8645', '#d2c5a8', '#121118', '#8a1e1e', '#453358', '#c8d0d6'
    ];
    const CLOAK = ['#24262c', '#46301a', '#2a403c', '#3f1a19', '#38351f', '#373d47'];
    const EYE = ['#c8781f', '#3f7a72', '#6f879c', '#7c2422', '#2b783c', '#6b3fa0', '#c29827', '#1a1a1e'];

    // 10 hairstyles: 0..4 masculine/classic, 5..9 feminine
    const STYLE = [
      'short', 'topknot', 'long', 'braids', 'none',
      'ponytail', 'flowing', 'twin_braids', 'chignon', 'bob'
    ];
    const BODY = { slim: 'lean', normal: 'standard', heavy: 'broad' };

    const out = {
      bodyType: BODY[look.bodyType] || 'standard',
      skinTone: SKIN[idx(look.skinTone, SKIN.length)],
      hair: STYLE[idx(look.hairStyle, STYLE.length)] || 'short',
      hairColor: HAIR[idx(look.hairColor, HAIR.length)],
      cloakColor: CLOAK[idx(look.cloakColor, CLOAK.length)],
    };

    if (look.gender) out.gender = look.gender;
    if (look.eyeColor !== undefined) out.eyeColor = EYE[idx(look.eyeColor, EYE.length)];
    if (look.faceDecor && look.faceDecor !== 'none') out.faceDecor = look.faceDecor;

    return out;
  }

  leave(userId) {
    const p = this.playerById(userId);
    if (!p) return;
    p.online = false;
    const token = this.tokenOf(userId);
    const profile = this.playerProfiles.get(userId);
    if (token && profile) {
      profile.token = token;
      profile.mapId = this.state.mapId;
      if (token.hp <= 0 && !token.deathSaves?.dead) delete token.soloDeathPrompted;
    }
    this.state.tokens = this.state.tokens.filter(t => !(t.kind === 'player' && t.ownerId === userId));
    // if the DM leaves, the DM seat is free again
    this.bump();
    this.checkUnassistedDowned?.();
  }

  // ─── movement (server-validated, out-of-combat free for now) ──────────
  move(userId, msg = {}) {
    const p = this.playerById(userId);
    if (!p) return { ok: false, reason: 'no_session' };
    const token = this.tokenOf(userId);
    if (!token) return { ok: false, reason: 'no_token' };
    if (token.hp <= 0 || token.deathSaves?.dead) return { ok: false, reason: 'actor_down' };
    const reject = (reason) => ({
      ok: false, reason,
      position: { x: token.x, z: token.z, rotY: token.rotY || 0 }
    });
    const nx = Number(msg.x), nz = Number(msg.z);
    if (!Number.isFinite(nx) || !Number.isFinite(nz)) return reject('bad_coords');

    // rate guard: client sends 10Hz; tolerate bursts, drop the spammy tail
    const now = Date.now();
    const last = this.lastMoveAt.get(token.id) || 0;
    if (now - last < 55) return { ok: false, reason: 'too_fast' };
    this.lastMoveAt.set(token.id, now);

    // speed guard: no legitimate step exceeds this between intents
    const dist = Math.hypot(nx - token.x, nz - token.z);
    if (dist > 60) return reject('too_far');

    // Bounds: dungeon maps keep their rectangle; the streamed overworld is
    // bounded by the loaded region set (focus + 1-ring).
    if (this.worldFocus && this.map?.region) {
      const gx = Math.floor(nx / CELL_FT), gz = Math.floor(nz / CELL_FT);
      const rx = Math.floor(gx / REGION_W), rz = Math.floor(gz / REGION_H);
      if (!this.regionBlocks.has(rx + ',' + rz)) return reject('out_of_bounds');
    } else if (!this.map || nx < 0 || nz < 0 ||
      nx >= this.map.size.w * CELL_FT || nz >= this.map.size.h * CELL_FT) {
      return reject('out_of_bounds');
    }
    const x = nx;
    const z = nz;

    // wall/water validation — reject moves whose destination is solid
    if (this.isBlockedAt(x, z)) return reject('blocked');
    if (this.overlapsLandscapeProp(x, z)) return reject('blocked');
    if (this.crossesClosedDoor(token, { x, z })) return reject('blocked');

    // in combat: route through the 5E movement budget (trail + refund)
    if (this.state.initiative) {
      const prevX = token.x, prevZ = token.z;
      const r = this.__combatMove(token, x, z);
      if (!r.ok) return reject(r.reason || 'no_movement');
      // Opportunity attacks (SRD): leaving a hostile's reach provokes — the
      // CombatDriver hook resolves each as a reaction attack (fx + rolls + chat).
      if (typeof this.onCombatMove === 'function') {
        try { this.onCombatMove(token, { x: prevX, z: prevZ }); }
        catch (e) { console.warn('[GM] combat move hook failed', e.message); }
      }
    } else {
      token.x = x;
      token.z = z;
    }
    if (Number.isFinite(msg.rotY)) token.rotY = Number(msg.rotY);
    this.bump();
    // seamless region crossing: follow the party's focus once a token's CELL
    // crosses a region border (pre-generates the new ring while the mover is
    // still a region-width away from unloaded terrain)
    if (this.worldFocus && this.map?.region && !this.state.initiative) {
      const rx = Math.floor(Math.floor(x / CELL_FT) / REGION_W);
      const rz = Math.floor(Math.floor(z / CELL_FT) / REGION_H);
      if (rx !== this.worldFocus.rx || rz !== this.worldFocus.rz) {
        this.shiftFocus(rx, rz);
      }
    }
    // ambush check — monsters close to a PC spring combat
    if (this.checkAmbush) this.checkAmbush();
    return { ok: true };
  }

  /** Combat-budgeted movement (delegates to CombatEngine.attemptMove). */
  __combatMove(token, x, z) {
    try {
      const { attemptMove } = this.__combatEngine;
      const r = attemptMove(this.state, token, x, z);
      return r.ok ? r : { ok: false, reason: r.reason || 'no_movement' };
    } catch (e) {
      console.warn('[GM] combat move failed', e.message);
      return { ok: false, reason: 'engine_error' };
    }
  }

  // ─── chat ──────────────────────────────────────────────────────────────
  say(userId, raw) {
    const p = this.playerById(userId);
    if (!p) return false;
    const text = String(raw || '').trim().slice(0, 300);
    if (!text) return false;
    this.state.chat.push({ from: p.name, color: p.color, role: p.role, text, t: Date.now() });
    if (this.state.chat.length > 100) this.state.chat = this.state.chat.slice(-100);
    this.bump();
    return true;
  }

  /** Push a system/narration line (rules engine + AI-DM will use this). */
  narrate(text, color = '#b8952f') {
    this.state.chat.push({ from: '', color, role: 'system', text, t: Date.now() });
    if (this.state.chat.length > 100) this.state.chat = this.state.chat.slice(-100);
    this.bump();
  }

  // ─── DM commands ───────────────────────────────────────────────────────
  // Envelope: { op: string, payload: object } — payload spread form also
  // accepted ({ op, type, ... }) for compatibility with the M0 client.
  dmCommand(msg = {}) {
    const op = String(msg.op || '');
    const p = (msg.payload && typeof msg.payload === 'object') ? msg.payload : msg;
    switch (op) {
      case 'weather':
        this.state.weather = { type: WEATHER.has(p.type) ? p.type : 'clear', intensity: Number(p.intensity) || 0 };
        break;
      case 'daynight':
        this.state.dayNight = {
          ...this.state.dayNight,
          mode: p.mode === 'fixed' ? 'fixed' : 'cycle',
          time: Math.max(0, Math.min(1440, Number(p.time) || 0))
        };
        this.dayNightBaseTime = this.state.dayNight.time;
        this.dayNightBaseTimestamp = Date.now();
        break;
      case 'map': {
        const parsedRegion = parseRegionId(String(p.id));
        if (parsedRegion) {
          if (!this.worldCtx) this.initWorld();
          if (!this.ensureRegion(parsedRegion.rx, parsedRegion.rz)) return { error: 'map_not_found' };
          this.worldFocus = { rx: parsedRegion.rx, rz: parsedRegion.rz };
          this.ensureRegionRing(parsedRegion.rx, parsedRegion.rz);
        }
        if (!this.setMap(String(p.id))) return { error: 'map_not_found' };
        break;
      }
      case 'door': {
        const door = this.state.doors?.find((item) => item.wallIndex === Number(p.wallIndex));
        if (!door) return { error: 'door_not_found' };
        const action = String(p.action || '');
        if (door.secret && !door.revealed && (action === 'open' || action === 'toggle')) {
          return { error: 'door_unrevealed' };
        }
        if (action === 'open') door.open = true;
        else if (action === 'close') door.open = false;
        else if (action === 'toggle') door.open = !door.open;
        else if (action === 'lock') { door.locked = true; door.open = false; }
        else if (action === 'unlock') door.locked = false;
        else if (action === 'reveal' && door.secret) door.revealed = true;
        else if (action === 'conceal' && door.secret) { door.revealed = false; door.open = false; }
        else return { error: 'invalid_door_action' };
        this.rebuildWallCells();
        break;
      }
      case 'generate': {
        // Procedural dungeon (FIX 10): seed + size → BSP map registered as a
        // new id and switched to. Same broadcast shape as the 'map' op (mapId +
        // mapName + full map def + tokens) — pushed via commit() because ws.js
        // only special-cases the known DM ops for its own fan-out.
        const seed = Number.isFinite(Number(p.seed)) ? Math.floor(Number(p.seed)) : (Date.now() & 0x7fffffff);
        const size = ['small', 'medium', 'large'].includes(String(p.size)) ? String(p.size) : 'medium';
        let def = null;
        try { def = generateDungeon({ seed, size }); } catch (e) {
          console.warn('[GM] dungeon generate failed:', e.message);
        }
        if (!def || !def.id) return { error: 'generate_failed' };
        this.maps.set(def.id, def);               // registry + /api/map/:id serve it
        if (!this.setMap(def.id)) return { error: 'generate_failed' };
        this.narrate(`The stone shifts — a new depth unfolds (${def.name}).`, '#7fd4c8');
        this.commit({
          mapId: this.state.mapId, mapName: this.state.mapName,
          map: this.map, tokens: this.state.tokens
        });
        return { ok: true, mapId: def.id };
      }
      case 'spawn': {
        const s = p.spawn || p;
        // DM spawn x/z are WORLD FEET
        this.state.tokens.push(this.makeMonsterToken(
          { ...s, x: Number(s.x) || 0, z: Number(s.z) || 0 }, true));
        break;
      }
      case 'remove': {
        const t = this.tokenById(String(p.id));
        if (t && t.kind !== 'player') this.state.tokens = this.state.tokens.filter(x => x.id !== t.id);
        break;
      }
      default:
        return { error: 'unknown_op' };
    }
    this.bump();
    if (op === 'door' && this.state.doors?.find((door) => door.wallIndex === Number(p.wallIndex))?.open) {
      this.checkAmbush?.();
    }
    return { ok: true };
  }

  getDayNight() {
    if (this.state.dayNight.mode !== 'cycle') return this.state.dayNight;
    const elapsedMinutes = ((Date.now() - this.dayNightBaseTimestamp) / 1000) * 1.2;
    const time = (this.dayNightBaseTime + elapsedMinutes) % 1440;
    return {
      ...this.state.dayNight,
      time: Math.floor(time)
    };
  }

  getPublicState(userId) {
    return {
      version: this.state.version,
      sessionId: this.session.id,
      mapId: this.state.mapId,
      mapName: this.state.mapName,
      world: this.publicWorld(),
      dayNight: this.getDayNight(),
      weather: this.state.weather,
      players: [...new Map(this.state.players.map((p) => [p.id, p])).values()],
      tokens: this.tokensForUser(userId),
      doors: this.doorsForUser(userId),
      chat: this.state.chat.slice(-50),
      initiative: this.initiativeForUser(userId)
    };
  }
}

const WEATHER = new Set(['clear', 'rain', 'storm', 'fog']);
