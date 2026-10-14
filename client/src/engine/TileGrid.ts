// TileGrid — region streaming orchestrator: owns build state, queries, collision, LOS.
// T2-d art pass: 100% procedural materials via materials.ts; per-cell seeded
// variation; grime halos where floor meets walls; ruined-wall variants with
// crumbled tops; rubble scatter; iron-banded door frames; braziers with sooty
// iron + glowing coal beds.
//
// COLLIDER SCHEMA (camera + movement share it — see CameraRig):
//   { x1, z1, x2, z2, yMin, yMax, decor? }
//   walls   yMin 0    yMax WALL_H(16)   — full-height occluders
//   pillars yMin 0    yMax WALL_H(16)
//   low props (brazier/coffin/altar) yMax 3–4 — sightline passes above
//   high props (hanging lanterns) yMin 7+ — sightline passes below
//   decor: true → thin/ornamental (door frames, hanging torches): ignored by
//   the camera sweep AND movement so they never snag or yank the view.
// Geometry builders were mechanically extracted into tilegrid/* modules; this
// file owns region lifecycle (add/remove/retain/focus), the build() pipeline,
// server sync (doors, water env), queries, resolve() and the LOS index.

import * as THREE from 'three';
import type { Engine } from './Engine';
import type { MapDef, WallSeg } from './types';
import type { DoorState } from '../game/store';
import { useGame } from '../game/store';
import { getAreaTileSet } from './materials';
import type { AreaTileSet } from './materials';
import { CELL, WALL_H, normalizeHalfTile, isPointInHalfTile } from './tilegrid/shared';
import type { Collider, RegionHandle } from './tilegrid/shared';
import { buildFloor, buildRoads, buildRoomDetails, buildWater } from './tilegrid/terrain';
import { buildDoors, buildWalls } from './tilegrid/walls';
import { buildProps } from './tilegrid/props';
import { buildExits } from './tilegrid/structures';

export { CELL, WALL_H, normalizeHalfTile, isPointInHalfTile, addRotatedCollider } from './tilegrid/shared';
export type { Collider, RegionHandle } from './tilegrid/shared';

function resolveCollider(c: Collider, x: number, z: number, r: number): [number, number] {
  if (c.decor || c.yMin > 5.5 || c.yMax < 0.5) return [x, z];

  if (c.rotY) {
    const cx = c.cx !== undefined ? c.cx : (c.x1 + c.x2) / 2;
    const cz = c.cz !== undefined ? c.cz : (c.z1 + c.z2) / 2;
    const hw = Math.abs(c.x2 - c.x1) / 2;
    const hd = Math.abs(c.z2 - c.z1) / 2;

    const cos = Math.cos(c.rotY);
    const sin = Math.sin(c.rotY);
    const dx = x - cx;
    const dz = z - cz;

    // Transform world point into local space of the box (-rotY)
    const lx = dx * cos + dz * sin;
    const lz = -dx * sin + dz * cos;

    // Closest point in local AABB [-hw, hw] x [-hd, hd]
    const px = Math.max(-hw, Math.min(lx, hw));
    const pz = Math.max(-hd, Math.min(lz, hd));

    const ldx = lx - px;
    const ldz = lz - pz;
    const dist = Math.hypot(ldx, ldz);

    if (dist < r) {
      let pushX = 0, pushZ = 0;
      if (dist > 0.0001) {
        const overlap = r - dist;
        pushX = (ldx / dist) * overlap;
        pushZ = (ldz / dist) * overlap;
      } else {
        const left = lx - (-hw);
        const right = hw - lx;
        const top = lz - (-hd);
        const bottom = hd - lz;
        const minPen = Math.min(left, right, top, bottom);
        if (minPen === left) pushX = -(left + r);
        else if (minPen === right) pushX = (right + r);
        else if (minPen === top) pushZ = -(top + r);
        else pushZ = (bottom + r);
      }
      x += pushX * cos - pushZ * sin;
      z += pushX * sin + pushZ * cos;
    }
    return [x, z];
  }

  const px = Math.max(c.x1, Math.min(x, c.x2));
  const pz = Math.max(c.z1, Math.min(z, c.z2));
  const dx = x - px, dz = z - pz;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < r) {
    if (d > 0.0001) {
      x = px + (dx / d) * r;
      z = pz + (dz / d) * r;
    } else {
      const l = Math.abs(x - c.x1), rr = Math.abs(c.x2 - x), t = Math.abs(z - c.z1), b = Math.abs(c.z2 - z);
      const m = Math.min(l, rr, t, b);
      if (m === l) x = c.x1 - r; else if (m === rr) x = c.x2 + r;
      else if (m === t) z = c.z1 - r; else z = c.z2 + r;
    }
  }
  return [x, z];
}

export class TileGrid {
  // internal: shared with tilegrid/* builder modules (not public API)
  eng: Engine;
  group = new THREE.Group();
  areaTiles!: AreaTileSet;
  private sourceMap: MapDef | null = null;
  doorLeaves = new Map<number, THREE.Group>();
  private doorAnimations = new Map<number, { target: number }>();
  waterMaterial: THREE.MeshStandardMaterial | null = null;
  waterTime = { value: 0 };
  waterSkyZenith = { value: new THREE.Color(0x224880) };
  waterSkyHorizon = { value: new THREE.Color(0xa6b2c6) };
  waterNightFactor = { value: 0.0 };
  waterWindOffset = { value: new THREE.Vector2() };
  waterCloudCoverage = { value: 0.38 };
  grassMaterial: THREE.MeshStandardMaterial | null = null;
  grassTime = { value: 0 };
  // shared grass falloff focus (world feet) — the camera tracks the player,
  // so its position is a stable anchor for the density gradient
  grassFocus = { value: new THREE.Vector3(0, 0, 0) };
  map: MapDef | null = null;
  open: Uint8Array = new Uint8Array(1);      // 1 = walkable
  blockedHalfTiles = new Map<number, Set<'nw' | 'ne' | 'se' | 'sw'>>();
  roadHalfTiles = new Map<number, Set<'nw' | 'ne' | 'se' | 'sw'>>();
  colliders: Collider[] = [];
  indoor = true;
  cameraMaxY = WALL_H - 4;                   // camera height cap (indoor default)
  // ── P3.3 streamed world state ──
  regions = new Map<string, RegionHandle>();
  worldMode = false;
  focusRegionId: string | null = null;
  private regionBuild = false;               // true while buildWorld fills a region group

  constructor(eng: Engine) {
    this.eng = eng;
  }

  key(cx: number, cz: number) { return cz * 4096 + cx; }

  /** CONTRACTS.md alias for build(). */
  load(map: MapDef) { this.build(map); }

  build(map: MapDef) {
    this.sourceMap = map;
    if (!map.region && this.worldMode) {
      // entering a dungeon / single map from the streamed world: tear down ALL
      // overworld region groups. They used to stay mounted under the dungeon,
      // so dungeon scenes rendered on top of grass, trees and hills — the
      // "dungeons spawn in nature" bug.
      this.worldMode = false;
      this.focusRegionId = null;
      this.retainRegions(new Set());
    }
    this.buildWorld(map);
  }

  // ── streamed world (P3.3) ────────────────────────────────────────────
  hasRegion(id: string) { return this.regions.has(id); }

  regionIds() { return [...this.regions.keys()]; }

  /** Add (or refocus) a region def. Additive: existing geometry is untouched. */
  addRegion(map: MapDef): RegionHandle | null {
    if (!map.region) return null;
    const id = map.id;
    const existing = this.regions.get(id);
    if (existing) return existing;
    if (!this.worldMode) {
      // entering the streamed world: tear down any single-map (dungeon) scene
      this.worldMode = true;
      this.focusRegionId = null;
      this.doorLeaves.clear();
      this.doorAnimations.clear();
      this.segWorld = [];
      this.waterMaterial?.dispose();
      this.waterMaterial = null;
      this.grassMaterial?.dispose();
      this.grassMaterial = null;
      this.eng.scene.remove(this.group);
      this.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      this.group = new THREE.Group();
    }
    const origin = map.worldOriginFt || { x: map.region.rx * map.size.w * CELL, z: map.region.rz * map.size.h * CELL };
    const group = new THREE.Group();
    group.position.set(origin.x, 0, origin.z);
    this.regionBuild = true;
    this.group = group;                       // buildWorld fills the region group
    this.colliders = [];
    this.blockedHalfTiles = new Map();
    this.roadHalfTiles = new Map();
    this.buildWorld(map);
    const region: RegionHandle = {
      id,
      rx: map.region.rx, rz: map.region.rz,
      origin,
      group,
      open: this.open,
      blockedHalfTiles: this.blockedHalfTiles,
      // colliders were built in region-local feet; store them world-resolved
      colliders: this.colliders.map((c) => ({
        ...c,
        x1: c.x1 + origin.x, x2: c.x2 + origin.x,
        z1: c.z1 + origin.z, z2: c.z2 + origin.z,
        cx: c.cx !== undefined ? c.cx + origin.x : (c.rotY ? (c.x1 + c.x2) / 2 + origin.x : undefined),
        cz: c.cz !== undefined ? c.cz + origin.z : (c.rotY ? (c.z1 + c.z2) / 2 + origin.z : undefined),
      })),
      exits: (map.exits || []).map((e) => ({
        id: e.id, label: e.label,
        x: e.x * CELL + origin.x, z: e.z * CELL + origin.z,
      })),
      map,
      minX: origin.x, minZ: origin.z,
      maxX: origin.x + map.size.w * CELL, maxZ: origin.z + map.size.h * CELL,
      waterMaterial: this.waterMaterial,
      grassMaterial: this.grassMaterial,
    };
    this.waterMaterial = null;                // ownership moved into the handle
    this.grassMaterial = null;
    this.regionBuild = false;
    this.eng.scene.add(group);
    this.regions.set(id, region);
    return region;
  }

  removeRegion(id: string) {
    const r = this.regions.get(id);
    if (!r) return;
    this.eng.scene.remove(r.group);
    r.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    r.waterMaterial?.dispose();
    r.grassMaterial?.dispose();
    this.regions.delete(id);
  }

  /** Keep only the listed regions (prunes geometry beyond the stream ring). */
  retainRegions(keep: Set<string>) {
    for (const id of [...this.regions.keys()]) {
      if (!keep.has(id)) this.removeRegion(id);
    }
  }

  setFocusRegion(id: string): MapDef | null {
    const r = this.regions.get(id);
    if (!r) return null;
    this.focusRegionId = id;
    this.map = r.map;
    this.sourceMap = r.map;
    this.indoor = false;
    this.cameraMaxY = 60;
    return r.map;
  }

  regionAt(x: number, z: number): RegionHandle | null {
    for (const r of this.regions.values()) {
      if (x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ) return r;
    }
    return null;
  }

  /** Nearest interactable exit across all loaded regions (world feet). */
  nearestExitWorld(x: number, z: number, radiusFt = 8.5) {
    let nearest: { id: string; distance: number; label: string } | null = null;
    for (const r of this.regions.values()) {
      for (const exit of r.exits) {
        const distance = Math.hypot(x - exit.x, z - exit.z);
        if (distance > radiusFt || (nearest && nearest.distance <= distance)) continue;
        nearest = { id: exit.id, distance, label: exit.label };
      }
    }
    return nearest;
  }

  private buildWorld(map: MapDef) {
    this.map = map;
    this.doorLeaves.clear();
    this.doorAnimations.clear();
    this.areaTiles = getAreaTileSet(map);
    this.colliders = [];  // reset (was missing before → collider dupes on reload)
    this.blockedHalfTiles.clear();
    this.roadHalfTiles.clear();
    this.indoor = !this.areaTiles.outdoor;
    this.cameraMaxY = this.indoor ? WALL_H - 4 : 60;

    if (!this.regionBuild) {
      // clear previous geometry (single-map mode only; region builds fill a
      // caller-owned group and dispose via removeRegion)
      this.waterMaterial?.dispose();
      this.waterMaterial = null;
      this.grassMaterial?.dispose();
      this.grassMaterial = null;
      this.eng.scene.remove(this.group);
      this.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      this.group = new THREE.Group();
    }

    const W = map.size.w, H = map.size.h;
    this.open = new Uint8Array(W * H);
    const wallSet = new Set<number>();
    for (const cell of map.cells.wall) {
      const [x, z, orientation] = cell;
      if (orientation) {
        const k = this.key(x, z);
        let s = this.blockedHalfTiles.get(k);
        if (!s) { s = new Set(); this.blockedHalfTiles.set(k, s); }
        s.add(normalizeHalfTile(orientation));
      } else {
        wallSet.add(this.key(x, z));
      }
    }
    const blockedSet = new Set(wallSet);
    // water is walkable by design (shallow fords) — it no longer blocks movement
    for (const h of map.cells.halfTiles || []) {
      const k = this.key(h.x, h.z);
      if (h.type === 'wall') {
        let s = this.blockedHalfTiles.get(k);
        if (!s) { s = new Set(); this.blockedHalfTiles.set(k, s); }
        s.add(normalizeHalfTile(h.orientation));
      } else if (h.type === 'road') {
        let s = this.roadHalfTiles.get(k);
        if (!s) { s = new Set(); this.roadHalfTiles.set(k, s); }
        s.add(normalizeHalfTile(h.orientation));
      }
    }
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const k = this.key(x, z);
      let isBlocked = blockedSet.has(k);
      const halfs = this.blockedHalfTiles.get(k);
      if (halfs) {
        if ((halfs.has('nw') && halfs.has('se')) || (halfs.has('ne') && halfs.has('sw'))) {
          isBlocked = true;
        }
      }
      this.open[z * W + x] = isBlocked ? 0 : 1;
    }

    buildFloor(this, map, wallSet);
    buildRoads(this, map);
    buildWater(this, map);
    buildRoomDetails(this, map);
    buildWalls(this, map, wallSet);
    buildDoors(this, map);
    buildProps(this, map);
    buildExits(this, map);

    if (!this.regionBuild) this.eng.scene.add(this.group);
  }

  syncDoorStates(states: DoorState[]): MapDef | null {
    if (!this.sourceMap) return null;
    const oldMap = this.map;
    const isDM = useGame.getState().me?.role === 'dm';
    const revealedSecretCells = new Set<number>();
    for (const state of states) {
      if (!state.secret || !state.revealed) continue;
      const wall = this.sourceMap.walls[state.wallIndex];
      if (!wall) continue;
      if (wall.x1 === wall.x2) {
        for (let z = Math.floor(Math.min(wall.z1, wall.z2)); z < Math.ceil(Math.max(wall.z1, wall.z2)); z++) {
          revealedSecretCells.add(this.key(Math.floor(wall.x1), z));
        }
      } else {
        for (let x = Math.floor(Math.min(wall.x1, wall.x2)); x < Math.ceil(Math.max(wall.x1, wall.x2)); x++) {
          revealedSecretCells.add(this.key(x, Math.floor(wall.z1)));
        }
      }
    }
    const doorByWall = new Map(states.map((state) => [state.wallIndex, state]));
    const next: MapDef = {
      ...this.sourceMap,
      cells: {
        ...this.sourceMap.cells,
        wall: this.sourceMap.cells.wall.filter(([x, z]) => !revealedSecretCells.has(this.key(x, z))),
      },
      walls: this.sourceMap.walls.map((wall, wallIndex) => {
        const state = doorByWall.get(wallIndex);
        if (!state) return wall;
        return {
          ...wall,
          type: state.secret && (state.revealed || isDM) ? 'secret_door' : state.secret ? 'normal' : wall.type,
          isOpen: state.open,
          locked: state.locked,
        };
      }),
    };
    if (oldMap && JSON.stringify(oldMap.walls) === JSON.stringify(next.walls) &&
        JSON.stringify(oldMap.cells.wall) === JSON.stringify(next.cells.wall)) return oldMap;

    const oldOpen = new Map((oldMap?.walls || []).map((wall, index) => [index, !!wall.isOpen]));
    this.buildWorld(next);
    this.buildLosIndex(next.walls);
    for (const state of states) {
      if (oldOpen.get(state.wallIndex) === state.open) continue;
      const leaf = this.doorLeaves.get(state.wallIndex);
      if (!leaf) continue;
      leaf.rotation.y = oldOpen.get(state.wallIndex) ? 1.9 : 0;
      this.doorAnimations.set(state.wallIndex, { target: state.open ? 1.9 : 0 });
    }
    return next;
  }

  update(dt: number) {
    this.waterTime.value += dt;
    this.grassTime.value += dt;
    this.grassFocus.value.copy(this.eng.camera.position);
    for (const [wallIndex, animation] of this.doorAnimations) {
      const leaf = this.doorLeaves.get(wallIndex);
      if (!leaf) { this.doorAnimations.delete(wallIndex); continue; }
      const delta = animation.target - leaf.rotation.y;
      leaf.rotation.y += delta * Math.min(1, dt * 5);
      if (Math.abs(delta) < 0.015) {
        leaf.rotation.y = animation.target;
        this.doorAnimations.delete(wallIndex);
      }
    }
  }

  syncWaterEnv(env: {
    nightFactor: number;
    zenith: number;
    horizon: number;
    windOffset: THREE.Vector2;
    cloudCoverage: number;
  }) {
    this.waterNightFactor.value = env.nightFactor;
    this.waterSkyZenith.value.setHex(env.zenith);
    this.waterSkyHorizon.value.setHex(env.horizon);
    this.waterWindOffset.value.copy(env.windOffset);
    this.waterCloudCoverage.value = env.cloudCoverage;
  }

  terrainHeightAt(x: number, z: number) {
    // regionBuild: coordinates are region-local for the map currently being
    // built, and that region is not yet registered — the world lookup below
    // would match a DIFFERENT loaded region's bounds and sample its heights
    // (grass/trees floating over the wrong region's mountains). Sample the
    // region's own terrain until it is registered.
    if (this.worldMode && !this.regionBuild) {
      const r = this.regionAt(x, z);
      if (!r) return 0;
      const terrain = r.map.terrain;
      if (!terrain || terrain.width !== r.map.size.w + 1 || terrain.height !== r.map.size.h + 1) return 0;
      const lx = x - r.origin.x, lz = z - r.origin.z;
      const cx = Math.max(0, Math.min(r.map.size.w - 1, lx / CELL));
      const cz = Math.max(0, Math.min(r.map.size.h - 1, lz / CELL));
      const x0 = Math.floor(cx), z0 = Math.floor(cz), tx = cx - x0, tz = cz - z0;
      const at = (px: number, pz: number) => terrain.heightFt[pz * terrain.width + px] || 0;
      const north = at(x0, z0) + (at(x0 + 1, z0) - at(x0, z0)) * tx;
      const south = at(x0, z0 + 1) + (at(x0 + 1, z0 + 1) - at(x0, z0 + 1)) * tx;
      return north + (south - north) * tz;
    }
    const terrain = this.map?.terrain;
    if (!terrain || terrain.width !== this.map!.size.w + 1 ||
        terrain.height !== this.map!.size.h + 1) return 0;
    const cx = Math.max(0, Math.min(this.map!.size.w - 1, x / CELL));
    const cz = Math.max(0, Math.min(this.map!.size.h - 1, z / CELL));
    const x0 = Math.floor(cx), z0 = Math.floor(cz), tx = cx - x0, tz = cz - z0;
    const at = (px: number, pz: number) => terrain.heightFt[pz * terrain.width + px] || 0;
    const north = at(x0, z0) + (at(x0 + 1, z0) - at(x0, z0)) * tx;
    const south = at(x0, z0 + 1) + (at(x0 + 1, z0 + 1) - at(x0, z0 + 1)) * tx;
    return north + (south - north) * tz;
  }

  terrainNormalAt(x: number, z: number, out = new THREE.Vector3()) {
    const eps = 0.5;
    const hL = this.terrainHeightAt(x - eps, z);
    const hR = this.terrainHeightAt(x + eps, z);
    const hD = this.terrainHeightAt(x, z - eps);
    const hU = this.terrainHeightAt(x, z + eps);
    out.set((hL - hR) / (2 * eps), 1.0, (hD - hU) / (2 * eps)).normalize();
    return out;
  }


  // ── coordinate helpers ─────────────────────────────────────────────────────
  worldToCell(x: number, z: number) { return { cx: Math.floor(x / CELL), cz: Math.floor(z / CELL) }; }
  cellToWorld(cx: number, cz: number) { return { x: cx * CELL + CELL / 2, z: cz * CELL + CELL / 2 }; }
  inBounds(cx: number, cz: number) {
    return this.map ? cx >= 0 && cz >= 0 && cx < this.map.size.w && cz < this.map.size.h : false;
  }
  isOpenCell(cx: number, cz: number) {
    if (!this.inBounds(cx, cz)) return false;
    return this.open[cz * this.map!.size.w + cx] === 1;
  }
  isOpenWorld(x: number, z: number) {
    if (this.worldMode) {
      const r = this.regionAt(x, z);
      if (!r) return false;                  // not loaded -> solid
      const lx = x - r.origin.x, lz = z - r.origin.z;
      const cx = Math.floor(lx / CELL), cz = Math.floor(lz / CELL);
      if (cx < 0 || cz < 0 || cx >= r.map.size.w || cz >= r.map.size.h) return false;
      if (r.open[cz * r.map.size.w + cx] !== 1) return false;
      const halfSet = r.blockedHalfTiles.get(this.key(cx, cz));
      if (halfSet && halfSet.size > 0) {
        const u = (lx - cx * CELL) / CELL;
        const v = (lz - cz * CELL) / CELL;
        for (const orientation of halfSet) {
          if (isPointInHalfTile(u, v, orientation)) return false;
        }
      }
      return true;
    }
    const c = this.worldToCell(x, z);
    if (!this.inBounds(c.cx, c.cz)) return false;
    if (this.open[c.cz * this.map!.size.w + c.cx] !== 1) return false;
    const halfSet = this.blockedHalfTiles.get(this.key(c.cx, c.cz));
    if (halfSet && halfSet.size > 0) {
      const u = (x - c.cx * CELL) / CELL;
      const v = (z - c.cz * CELL) / CELL;
      for (const orientation of halfSet) {
        if (isPointInHalfTile(u, v, orientation)) return false;
      }
    }
    return true;
  }
  /** CONTRACTS.md: world coords, cell center test. */
  isBlocked(x: number, z: number) { return !this.isOpenWorld(x, z); }

  // ── movement collision: circle (r ft) vs wall AABBs and half-tile right triangles — resolve push-out.
  // Only boxes that occupy standing height (0–6ft) or non-decorative boxes
  // block movement: braziers/coffins block legs, hanging lanterns and door
  // frames (decor) never snag a walking token.
  resolve(nx: number, nz: number, r = 2.0): [number, number] {
    let x = nx, z = nz;
    if (this.worldMode) {
      // collider sweep across loaded regions near the point (bbox pre-filter)
      for (const region of this.regions.values()) {
        if (x < region.minX - 24 || x > region.maxX + 24 ||
            z < region.minZ - 24 || z > region.maxZ + 24) continue;
        for (const c of region.colliders) {
          [x, z] = resolveCollider(c, x, z, r);
        }
      }
      // half-tile push-out in the point's neighborhood (region-local lookup)
      for (const region of this.regions.values()) {
        if (x < region.minX - 8 || x > region.maxX + 8 ||
            z < region.minZ - 8 || z > region.maxZ + 8) continue;
        if (region.blockedHalfTiles.size === 0) continue;
        const W = region.map.size.w, H = region.map.size.h;
        let lx = x - region.origin.x, lz = z - region.origin.z;
        const minCx = Math.max(0, Math.floor((lx - r - 1) / CELL));
        const maxCx = Math.min(W - 1, Math.floor((lx + r + 1) / CELL));
        const minCz = Math.max(0, Math.floor((lz - r - 1) / CELL));
        const maxCz = Math.min(H - 1, Math.floor((lz + r + 1) / CELL));
        for (let cz = minCz; cz <= maxCz; cz++) {
          for (let cx = minCx; cx <= maxCx; cx++) {
            const halfSet = region.blockedHalfTiles.get(this.key(cx, cz));
            if (!halfSet || halfSet.size === 0) continue;
            const x0 = cx * CELL, z0 = cz * CELL;
            const x1 = (cx + 1) * CELL, z1 = (cz + 1) * CELL;
            for (const orientation of halfSet) {
              let ax = 0, az = 0, bx = 0, bz = 0, nx0 = 0, nz0 = 0;
              if (orientation === 'nw') {
                ax = x0; az = z1; bx = x1; bz = z0;
                nx0 = 0.70710678; nz0 = 0.70710678;
              } else if (orientation === 'se') {
                ax = x0; az = z1; bx = x1; bz = z0;
                nx0 = -0.70710678; nz0 = -0.70710678;
              } else if (orientation === 'ne') {
                ax = x0; az = z0; bx = x1; bz = z1;
                nx0 = -0.70710678; nz0 = 0.70710678;
              } else {
                ax = x0; az = z0; bx = x1; bz = z1;
                nx0 = 0.70710678; nz0 = -0.70710678;
              }
              const abx = bx - ax, abz = bz - az;
              const abLenSq = abx * abx + abz * abz || 1;
              const apx = lx - ax, apz = lz - az;
              const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
              const px = ax + t * abx, pz = az + t * abz;

              const u = (lx - x0) / CELL, v = (lz - z0) / CELL;
              const inside = isPointInHalfTile(u, v, orientation);
              const dx = lx - px, dz = lz - pz;
              const d = Math.hypot(dx, dz);

              if (inside) {
                lx = px + nx0 * r;
                lz = pz + nz0 * r;
              } else if (d < r) {
                const overlap = r - d;
                if (d > 0.0001) {
                  lx += (dx / d) * overlap;
                  lz += (dz / d) * overlap;
                } else {
                  lx += nx0 * overlap;
                  lz += nz0 * overlap;
                }
              }
            }
          }
        }
        x = lx + region.origin.x;
        z = lz + region.origin.z;
      }
      return [x, z];
    }
    for (const c of this.colliders) {
      [x, z] = resolveCollider(c, x, z, r);
    }

    if (this.blockedHalfTiles.size > 0 && this.map) {
      const minCx = Math.max(0, Math.floor((x - r - 1) / CELL));
      const maxCx = Math.min(this.map.size.w - 1, Math.floor((x + r + 1) / CELL));
      const minCz = Math.max(0, Math.floor((z - r - 1) / CELL));
      const maxCz = Math.min(this.map.size.h - 1, Math.floor((z + r + 1) / CELL));

      for (let cz = minCz; cz <= maxCz; cz++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const halfSet = this.blockedHalfTiles.get(this.key(cx, cz));
          if (!halfSet || halfSet.size === 0) continue;
          const x0 = cx * CELL, z0 = cz * CELL;
          const x1 = (cx + 1) * CELL, z1 = (cz + 1) * CELL;

          for (const orientation of halfSet) {
            let ax = 0, az = 0, bx = 0, bz = 0, nx0 = 0, nz0 = 0;
            if (orientation === 'nw') {
              ax = x0; az = z1; bx = x1; bz = z0;
              nx0 = 0.70710678; nz0 = 0.70710678;
            } else if (orientation === 'se') {
              ax = x0; az = z1; bx = x1; bz = z0;
              nx0 = -0.70710678; nz0 = -0.70710678;
            } else if (orientation === 'ne') {
              ax = x0; az = z0; bx = x1; bz = z1;
              nx0 = -0.70710678; nz0 = 0.70710678;
            } else if (orientation === 'sw') {
              ax = x0; az = z0; bx = x1; bz = z1;
              nx0 = 0.70710678; nz0 = -0.70710678;
            }

            const abx = bx - ax, abz = bz - az;
            const abLenSq = abx * abx + abz * abz || 1;
            const apx = x - ax, apz = z - az;
            const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
            const px = ax + t * abx, pz = az + t * abz;

            const u = (x - x0) / CELL, v = (z - z0) / CELL;
            const inside = isPointInHalfTile(u, v, orientation);
            const dx = x - px, dz = z - pz;
            const d = Math.hypot(dx, dz);

            if (inside) {
              x = px + nx0 * r;
              z = pz + nz0 * r;
            } else if (d < r) {
              const overlap = r - d;
              if (d > 0.0001) {
                x += (dx / d) * overlap;
                z += (dz / d) * overlap;
              } else {
                x += nx0 * overlap;
                z += nz0 * overlap;
              }
            }
          }
        }
      }
    }
    return [x, z];
  }

  // ── LOS: ray vs wall segments (XZ plane) ───────────────────────────────────
  private segWorld: { x1: number; z1: number; x2: number; z2: number; blocks: boolean }[] = [];
  losClear(ax: number, az: number, bx: number, bz: number): boolean {
    const dx = bx - ax, dz = bz - az;
    for (const s of this.segWorld) {
      if (!s.blocks) continue;
      const sx = s.x2 - s.x1, sz = s.z2 - s.z1;
      const den = sx * dz - sz * dx;
      if (Math.abs(den) < 1e-9) continue;
      const ddx = s.x1 - ax, ddz = s.z1 - az;
      const T1 = (sx * ddz - sz * ddx) / den;   // along ray
      const T2 = (dx * ddz - dz * ddx) / den;   // along segment
      if (T1 > 0.02 && T1 < 0.98 && T2 >= 0 && T2 <= 1) return false;
    }
    return true;
  }

  buildLosIndex(walls: WallSeg[]) {
    this.segWorld = walls
      .filter(w => w.type !== 'window' && !(w.type === 'door' && w.isOpen) && !(w.type === 'secret_door' && w.isOpen))
      .map((wall) => {
        const w = wall.type === 'door' || wall.type === 'secret_door'
          ? wall.x1 === wall.x2
            ? { ...wall, x1: wall.x1 + 0.5, x2: wall.x2 + 0.5 }
            : { ...wall, z1: wall.z1 + 0.5, z2: wall.z2 + 0.5 }
          : wall;
        return {
          x1: w.x1 * CELL, z1: w.z1 * CELL, x2: w.x2 * CELL, z2: w.z2 * CELL, blocks: true
        };
      });
  }
}
