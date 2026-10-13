// TileGrid — map geometry (floor, walls, doors, props) + collision + LOS index.
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
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { MapDef, PropDef, WallSeg, HalfTileOrientation, HalfTileDef } from './types';
import type { DoorState } from '../game/store';
import { useGame } from '../game/store';
import { getAreaTileSet, getMaterial, getTextureSet, hash2, rngFrom } from './materials';
import type { AreaTileSet } from './materials';
import { glowSprite } from './sprites';

export function normalizeHalfTile(orientation?: string): 'nw' | 'ne' | 'se' | 'sw' {
  if (!orientation) return 'nw';
  const o = orientation.toLowerCase();
  if (o === 'tl' || o === 'top_left' || o === 'nw' || o === 'northwest') return 'nw';
  if (o === 'tr' || o === 'top_right' || o === 'ne' || o === 'northeast') return 'ne';
  if (o === 'br' || o === 'bottom_right' || o === 'se' || o === 'southeast') return 'se';
  if (o === 'bl' || o === 'bottom_left' || o === 'sw' || o === 'southwest') return 'sw';
  return 'nw';
}

export function isPointInHalfTile(u: number, v: number, orientation?: HalfTileOrientation): boolean {
  const norm = normalizeHalfTile(orientation);
  if (norm === 'nw') return u + v <= 1.0;
  if (norm === 'se') return u + v >= 1.0;
  if (norm === 'ne') return u >= v;
  if (norm === 'sw') return u <= v;
  return true;
}

export const CELL = 5;      // feet per cell → world units per cell
export const WALL_H = 16;   // wall mesh height (ft)
const ROOM_STONE = new THREE.MeshBasicMaterial({
  color: 0x9b8860, transparent: true, opacity: 0.28, depthWrite: false,
  side: THREE.DoubleSide
});
const BOSS_STONE = new THREE.MeshBasicMaterial({
  color: 0xb58a42, transparent: true, opacity: 0.36, depthWrite: false,
  side: THREE.DoubleSide
});
const EXIT_FRAME = new THREE.MeshStandardMaterial({
  color: 0x366d68, emissive: 0x245d56, emissiveIntensity: 1.2,
  metalness: 0.15, roughness: 0.35,
});
const EXIT_VEIL = new THREE.MeshBasicMaterial({
  color: 0x8be2cd, transparent: true, opacity: 0.52, side: THREE.DoubleSide,
});

export interface Collider {
  x1: number; z1: number; x2: number; z2: number;
  yMin: number; yMax: number;
  decor?: boolean;
}

interface ScatterItem {
  x: number; y: number; z: number; s: number;
  rx: number; ry: number; rz: number;
  r: number; g: number; b: number;
  quat?: THREE.Quaternion;
}

export class TileGrid {
  private eng: Engine;
  private group = new THREE.Group();
  private areaTiles!: AreaTileSet;
  private sourceMap: MapDef | null = null;
  private doorLeaves = new Map<number, THREE.Group>();
  private doorAnimations = new Map<number, { target: number }>();
  private waterMaterial: THREE.MeshStandardMaterial | null = null;
  private waterTime = { value: 0 };
  private waterSkyZenith = { value: new THREE.Color(0x224880) };
  private waterSkyHorizon = { value: new THREE.Color(0xa6b2c6) };
  private waterNightFactor = { value: 0.0 };
  private waterWindOffset = { value: new THREE.Vector2() };
  private waterCloudCoverage = { value: 0.38 };
  private grassMaterial: THREE.MeshStandardMaterial | null = null;
  private grassTime = { value: 0 };
  map: MapDef | null = null;
  open: Uint8Array = new Uint8Array(1);      // 1 = walkable
  blockedHalfTiles = new Map<number, Set<'nw' | 'ne' | 'se' | 'sw'>>();
  roadHalfTiles = new Map<number, Set<'nw' | 'ne' | 'se' | 'sw'>>();
  colliders: Collider[] = [];
  indoor = true;
  cameraMaxY = WALL_H - 4;                   // camera height cap (indoor default)

  constructor(eng: Engine) {
    this.eng = eng;
  }

  key(cx: number, cz: number) { return cz * 4096 + cx; }

  /** CONTRACTS.md alias for build(). */
  load(map: MapDef) { this.build(map); }

  build(map: MapDef) {
    this.sourceMap = map;
    this.buildWorld(map);
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

    // clear previous geometry
    this.waterMaterial?.dispose();
    this.waterMaterial = null;
    this.grassMaterial?.dispose();
    this.grassMaterial = null;
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.eng.scene.remove(this.group);
    this.group = new THREE.Group();

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
    for (const cell of map.cells.water || []) {
      const [x, z, orientation] = cell;
      if (orientation) {
        const k = this.key(x, z);
        let s = this.blockedHalfTiles.get(k);
        if (!s) { s = new Set(); this.blockedHalfTiles.set(k, s); }
        s.add(normalizeHalfTile(orientation));
      } else {
        blockedSet.add(this.key(x, z));
      }
    }
    for (const h of map.cells.halfTiles || []) {
      const k = this.key(h.x, h.z);
      if (h.type === 'water' || h.type === 'wall') {
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

    this.buildFloor(map, wallSet);
    this.buildRoads(map);
    this.buildWater(map);
    this.buildRoomDetails(map);
    this.buildWalls(map, wallSet);
    this.buildDoors(map);
    this.buildProps(map);
    this.buildExits(map);

    this.eng.scene.add(this.group);
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

  // ── floor: one plane, per-cell vertex-color variation + wall grime halos ──
  private buildFloor(map: MapDef, wallSet: Set<number>) {
    const W = map.size.w, H = map.size.h;
    const floorSet = this.areaTiles.floor;
    const set = getTextureSet(floorSet.kind, floorSet.variant);
    set.map.repeat.set((W * CELL) / floorSet.repeatFt, (H * CELL) / floorSet.repeatFt);
    set.bump.repeat.copy(set.map.repeat);
    const positions = new Float32Array(W * H * 4 * 3);
    const uvs = new Float32Array(W * H * 4 * 2);
    const colors = new Float32Array(W * H * 4 * 3);
    const indices = new Uint32Array(W * H * 6);
    const wallAt = (x: number, z: number) =>
      x < 0 || z < 0 || x >= W || z >= H ? true : wallSet.has(this.key(x, z));
    const roadSet = new Set((map.cells.road || []).map(([x, z]) => this.key(x, z)));
    const waterSet = new Set((map.cells.water || []).map(([x, z]) => this.key(x, z)));
    for (const h of map.cells.halfTiles || []) {
      if (h.type === 'road') roadSet.add(this.key(h.x, h.z));
      if (h.type === 'water') waterSet.add(this.key(h.x, h.z));
    }
    const biomeTints: Record<string, [number, number, number]> = {
      forest: [0.78, 1.08, 0.78], meadow: [1.08, 1.12, 0.86],
      snow_forest: [1.15, 1.24, 1.25], snowfield: [1.45, 1.52, 1.58],
      deadlands: [1.04, 0.91, 0.76], mountains: [1.12, 1.12, 1.1],
      town: [1.28, 1.16, 0.93], graveyard: [0.82, 0.96, 0.78],
      ruins: [0.88, 0.92, 0.8],
    };
    const terrainHeights = map.terrain?.heightFt || [];
    const terrainWidth = map.terrain?.width || 0;
    const heightAt = (x: number, z: number) => terrainWidth
      ? terrainHeights[z * terrainWidth + x] || 0 : 0;
    const kinds = map.biomes?.kinds || [];
    const biomeCells = map.biomes?.cells || [];

    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const q = z * W + x, vertex = q * 4, index = q * 6;
      const corners = [
        [x, z, 0, 0], [x + 1, z, 1, 0],
        [x, z + 1, 0, 1], [x + 1, z + 1, 1, 1],
      ];
      const biomeIndex = biomeCells[q];
      const biome = (biomeIndex === undefined ? undefined : kinds[biomeIndex]) || kinds[0];
      const tint = [...(biomeTints[biome] || [1, 1, 1])];
      // Deterministic per-cell tones preserve the old maps' surface variation.
      let shade = 0.82 + hash2(x, z, 11) * 0.3;
      const near = wallAt(x, z - 1) || wallAt(x, z + 1) || wallAt(x - 1, z) || wallAt(x + 1, z);
      if (near) shade *= 0.76;
      if (roadSet.has(this.key(x, z))) { tint[0] *= 1.12; tint[1] *= 0.94; tint[2] *= 0.78; }

      // Shoreline bank: transition ground toward sand, gravel, and river silt near water
      let minWaterDist = 99;
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (waterSet.has(this.key(x + dx, z + dz))) {
            const d = Math.hypot(dx, dz);
            if (d < minWaterDist) minWaterDist = d;
          }
        }
      }
      if (minWaterDist <= 2.2) {
        const shoreBlend = Math.min(1, (2.2 - minWaterDist) / 1.4);
        tint[0] = tint[0] * (1 - shoreBlend) + 0.70 * shoreBlend;
        tint[1] = tint[1] * (1 - shoreBlend) + 0.63 * shoreBlend;
        tint[2] = tint[2] * (1 - shoreBlend) + 0.51 * shoreBlend;
        if (minWaterDist <= 0.9) {
          shade *= 0.88;
          shade += (hash2(x * 7 | 0, z * 7 | 0, 883) - 0.5) * 0.16;
        }
      }
      for (let c = 0; c < 4; c++) {
        const [cx, cz, u, v] = corners[c];
        const vi = (vertex + c) * 3, ti = (vertex + c) * 2;
        positions[vi] = cx * CELL;
        positions[vi + 1] = heightAt(cx, cz);
        positions[vi + 2] = cz * CELL;
        uvs[ti] = cx / W;
        uvs[ti + 1] = cz / H;
        colors[vi] = tint[0] * shade;
        colors[vi + 1] = tint[1] * shade;
        colors[vi + 2] = tint[2] * shade;
      }
      indices.set([vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3], index);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      map: set.map, bumpMap: set.bump, bumpScale: floorSet.bumpScale,
      roughness: floorSet.roughness, metalness: floorSet.metalness, vertexColors: true
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  private buildWater(map: MapDef) {
    const rawCells = map.cells.water || [];
    const halfDefs = (map.cells.halfTiles || []).filter(h => h.type === 'water');
    if (!rawCells.length && !halfDefs.length) return;

    interface WaterUnit {
      x: number;
      z: number;
      orientation?: 'nw' | 'ne' | 'se' | 'sw';
    }
    const units: WaterUnit[] = [];
    for (const cell of rawCells) {
      const [x, z, orientation] = cell;
      units.push({ x, z, orientation: orientation ? normalizeHalfTile(orientation) : undefined });
    }
    for (const h of halfDefs) {
      units.push({ x: h.x, z: h.z, orientation: normalizeHalfTile(h.orientation) });
    }

    let triCount = 0;
    for (const u of units) {
      triCount += u.orientation ? 1 : 2;
    }
    const vertexCount = triCount * 3;
    const positions = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(vertexCount);
    const shores = new Float32Array(vertexCount);

    const heights = map.terrain?.heightFt || [];
    const terrainWidth = map.terrain?.width || 0;
    const fallbackHeight = (x: number, z: number) =>
      terrainWidth ? heights[z * terrainWidth + x] || 0 : 0;
    const surfaceLevels = map.cells.waterSurfaceFt || [];

    const wet = new Set<number>();
    for (const u of units) wet.add(this.key(u.x, u.z));

    const getWaterHeight = (vx: number, vz: number) => {
      let sum = 0;
      let count = 0;
      for (const [cx, cz] of [[vx - 1, vz - 1], [vx, vz - 1], [vx - 1, vz], [vx, vz]]) {
        if (cx >= 0 && cz >= 0 && cx < map.size.w && cz < map.size.h && wet.has(this.key(cx, cz))) {
          const lvl = surfaceLevels[cz * map.size.w + cx];
          if (typeof lvl === 'number') {
            sum += lvl;
            count++;
          }
        }
      }
      if (count > 0) return sum / count;
      return fallbackHeight(vx, vz) + 0.15;
    };

    let vIdx = 0;
    for (const u of units) {
      const { x, z, orientation } = u;
      const nw = [x, z], ne = [x + 1, z], sw = [x, z + 1], se = [x + 1, z + 1];
      const tris: number[][][] = [];
      if (!orientation) {
        tris.push([nw, sw, ne], [ne, sw, se]);
      } else if (orientation === 'nw') {
        tris.push([nw, sw, ne]);
      } else if (orientation === 'se') {
        tris.push([se, ne, sw]);
      } else if (orientation === 'ne') {
        tris.push([ne, nw, se]);
      } else if (orientation === 'sw') {
        tris.push([sw, se, nw]);
      }

      for (const tri of tris) {
        for (const [vx, vz] of tri) {
          const at = vIdx * 3;
          positions[at] = vx * CELL;
          positions[at + 2] = vz * CELL;
          positions[at + 1] = getWaterHeight(vx, vz);

          let touchesDry = false;
          for (const [cx, cz] of [[vx - 1, vz - 1], [vx, vz - 1], [vx - 1, vz], [vx, vz]]) {
            if (cx < 0 || cz < 0 || cx >= map.size.w || cz >= map.size.h || !wet.has(this.key(cx, cz))) {
              touchesDry = true;
            }
          }
          if (orientation) touchesDry = true;

          shores[vIdx] = touchesDry ? 1.0 : 0.0;
          indices[vIdx] = vIdx;
          vIdx++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aShore', new THREE.BufferAttribute(shores, 1));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x071518,
      roughness: 0.10,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    this.waterMaterial = waterMat;

    waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaterTime = this.waterTime;
      shader.uniforms.uSkyZenith = this.waterSkyZenith;
      shader.uniforms.uSkyHorizon = this.waterSkyHorizon;
      shader.uniforms.uNightFactor = this.waterNightFactor;
      shader.uniforms.uWindOffset = this.waterWindOffset;
      shader.uniforms.uCloudCoverage = this.waterCloudCoverage;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        attribute float aShore;
        varying vec3 vWorldPosition;
        varying vec3 vViewTangent;
        varying vec3 vViewBitangent;
        varying float vShore;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vViewTangent = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
        vViewBitangent = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
        vShore = aShore;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorldPosition;
        varying vec3 vViewTangent;
        varying vec3 vViewBitangent;
        varying float vShore;
        uniform float uWaterTime;
        uniform vec3 uSkyZenith;
        uniform vec3 uSkyHorizon;
        uniform float uNightFactor;
        uniform vec2 uWindOffset;
        uniform float uCloudCoverage;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float waterWaveHeight(vec2 p, float t) {
          vec2 flow1 = vec2(t * 0.07, t * 0.045);
          vec2 flow2 = vec2(-t * 0.05, t * 0.06);
          float n1 = vnoise(p * 0.22 + flow1);
          float n2 = vnoise(p * 0.48 + flow2);
          float swell = sin(p.x * 0.18 + sin(p.y * 0.12 + t * 0.3) * 1.5 + t * 0.4) * 0.5 + 0.5;
          float micro = sin(p.x * 0.85 - p.y * 0.7 + t * 1.2) * cos(p.x * 0.6 + p.y * 0.9 - t * 0.8) * 0.5 + 0.5;
          return n1 * 0.42 + n2 * 0.26 + swell * 0.22 + micro * 0.10;
        }`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 wavePosC = vWorldPosition.xz;
        float depthWeight = clamp(1.0 - vShore, 0.0, 1.0);

        vec3 deepWater = vec3(0.012, 0.038, 0.045);
        vec3 shallowWater = vec3(0.035, 0.078, 0.075);
        vec3 waterBase = mix(shallowWater, deepWater, smoothstep(0.12, 0.85, depthWeight));

        float shoreWave = sin(vShore * 24.0 - uWaterTime * 3.2 + sin(wavePosC.x * 0.4 + wavePosC.y * 0.4) * 1.5);
        float waveCrest = smoothstep(0.55, 0.98, shoreWave) * smoothstep(0.05, 0.85, vShore);
        float contactLine = smoothstep(0.75, 0.98, vShore);
        float foam = clamp(waveCrest * 0.70 + contactLine * 0.80, 0.0, 1.0);

        vec3 dayFoam = vec3(0.48, 0.58, 0.60);
        vec3 nightFoam = vec3(0.08, 0.12, 0.15);
        vec3 foamColor = mix(dayFoam, nightFoam, uNightFactor);
        vec3 waterAlbedo = mix(waterBase, foamColor, foam * 0.55);

        float cBroad = vnoise(wavePosC * 0.0032 + uWindOffset);
        float cFine = vnoise(wavePosC * 0.012 - uWindOffset * 1.5);
        float cClouds = clamp((cBroad * 0.65 + cFine * 0.35 - (1.0 - uCloudCoverage)) * 2.5, 0.0, 1.0);
        float cloudDim = 1.0 - cClouds * 0.40 * (1.0 - uNightFactor * 0.7);
        waterAlbedo *= cloudDim;

        diffuseColor.rgb = waterAlbedo;
        diffuseColor.a = mix(0.85, 0.96, depthWeight);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.08, 0.45, foam);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec2 wavePosN = vWorldPosition.xz;
        float h0 = waterWaveHeight(wavePosN, uWaterTime);
        float hx = waterWaveHeight(wavePosN + vec2(0.12, 0.0), uWaterTime);
        float hz = waterWaveHeight(wavePosN + vec2(0.0, 0.12), uWaterTime);
        float dWaveX = (hx - h0) * 1.8;
        float dWaveZ = (hz - h0) * 1.8;
        vec3 waveNormal = normalize(-vViewTangent * dWaveX - vViewBitangent * dWaveZ + normal);
        normal = normalize(mix(normal, waveNormal, 0.78));`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 viewDir = normalize( - vViewPosition );
        float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
        float fresnel = pow(1.0 - NdotV, 3.8);

        vec3 skyColor = mix(uSkyHorizon, uSkyZenith, 0.55);
        float reflectAtten = (1.0 - uNightFactor * 0.85) * (1.0 - foam * 0.7) * cloudDim;
        vec3 skyReflect = skyColor * fresnel * 0.42 * reflectAtten;
        totalEmissiveRadiance += skyReflect;`
      );
    };

    waterMat.customProgramCacheKey = () => 'ashenreach-grounded-water-v3';
    const water = new THREE.Mesh(geometry, waterMat);
    water.receiveShadow = true;
    water.renderOrder = 1;
    this.group.add(water);
  }

  private buildRoads(map: MapDef) {
    const rawCells = map.cells.road || [];
    const halfDefs = (map.cells.halfTiles || []).filter(h => h.type === 'road');
    if (!rawCells.length && !halfDefs.length) return;

    interface RoadUnit {
      x: number;
      z: number;
      orientation?: 'nw' | 'ne' | 'se' | 'sw';
    }
    const units: RoadUnit[] = [];
    for (const cell of rawCells) {
      const [x, z, orientation] = cell;
      units.push({ x, z, orientation: orientation ? normalizeHalfTile(orientation) : undefined });
    }
    for (const h of halfDefs) {
      units.push({ x: h.x, z: h.z, orientation: normalizeHalfTile(h.orientation) });
    }

    let triCount = 0;
    for (const u of units) {
      triCount += u.orientation ? 1 : 2;
    }
    const vertexCount = triCount * 3;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const colors = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(vertexCount);

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 128; textureCanvas.height = 128;
    const context = textureCanvas.getContext('2d');
    if (!context) throw new Error('Unable to create road texture canvas');
    context.fillStyle = '#76684e';
    context.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const x = hash2(i, 3, 421) * 128, z = hash2(i, 5, 821) * 128;
      const shade = 70 + Math.floor(hash2(i, 7, 1229) * 55);
      context.fillStyle = `rgba(${shade},${shade * 0.88},${shade * 0.68},${0.18 + hash2(i, 11, 31) * 0.28})`;
      context.beginPath();
      context.ellipse(x, z, 0.8 + hash2(i, 13, 73) * 2.4, 0.7 + hash2(i, 17, 97) * 1.5,
        hash2(i, 19, 131) * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    const tint = new THREE.Color(0xb4a184);

    let vIdx = 0;
    for (const u of units) {
      const { x, z, orientation } = u;
      const nw = [x, z], ne = [x + 1, z], sw = [x, z + 1], se = [x + 1, z + 1];
      const tris: number[][][] = [];
      if (!orientation) {
        tris.push([nw, sw, ne], [ne, sw, se]);
      } else if (orientation === 'nw') {
        tris.push([nw, sw, ne]);
      } else if (orientation === 'se') {
        tris.push([se, ne, sw]);
      } else if (orientation === 'ne') {
        tris.push([ne, nw, se]);
      } else if (orientation === 'sw') {
        tris.push([sw, se, nw]);
      }

      for (const tri of tris) {
        for (const [vx, vz] of tri) {
          const at = vIdx * 3, uv = vIdx * 2;
          const worldX = vx * CELL, worldZ = vz * CELL;
          positions[at] = worldX;
          positions[at + 1] = this.terrainHeightAt(worldX, worldZ) + 0.09;
          positions[at + 2] = worldZ;
          uvs[uv] = worldX / 26;
          uvs[uv + 1] = worldZ / 26;
          const shade = 0.78 + hash2(x, z, 51) * 0.3;
          colors[at] = tint.r * shade;
          colors[at + 1] = tint.g * shade;
          colors[at + 2] = tint.b * shade;
          indices[vIdx] = vIdx;
          vIdx++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    const road = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      map: texture, color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -1,
    }));
    road.receiveShadow = true;
    road.renderOrder = 1;
    this.group.add(road);
  }

  terrainHeightAt(x: number, z: number) {
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

  private buildRoomDetails(map: MapDef) {
    if (!map.roomRects?.length) return;
    const addRing = (x: number, z: number, inner: number, outer: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x * CELL, 0.035, z * CELL);
      mesh.renderOrder = 1;
      this.group.add(mesh);
    };
    const addBar = (x: number, z: number, width: number, depth: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.025, depth), material);
      mesh.position.set(x * CELL, 0.04, z * CELL);
      mesh.renderOrder = 1;
      this.group.add(mesh);
      return mesh;
    };

    for (const room of map.roomRects) {
      const cx = (room.x1 + room.x2 + 1) / 2;
      const cz = (room.z1 + room.z2 + 1) / 2;
      const width = (room.x2 - room.x1 - 1) * CELL;
      const depth = (room.z2 - room.z1 - 1) * CELL;
      const boss = room.id === map.bossRoom;

      if (boss) {
        const radius = Math.min(width, depth) * 0.38;
        addRing(cx, cz, radius - 0.42, radius, BOSS_STONE);
        addRing(cx, cz, radius * 0.56 - 0.32, radius * 0.56, ROOM_STONE);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const x = cx + Math.cos(angle) * radius * 0.78 / CELL;
          const z = cz + Math.sin(angle) * radius * 0.78 / CELL;
          const bar = addBar(x, z, 1.3, 0.28, BOSS_STONE);
          bar.rotation.y = -angle;
        }
      } else if (room.module === 'burial_chapel') {
        const radius = Math.min(width, depth) * 0.24;
        addRing(cx, cz, radius - 0.32, radius, ROOM_STONE);
        addRing(cx, cz, radius * 0.55 - 0.24, radius * 0.55, ROOM_STONE);
      } else if (room.module === 'processional_gallery') {
        const alongX = width >= depth;
        const length = (alongX ? width : depth) * 0.82;
        const halfWidth = Math.min(width, depth) * 0.22;
        if (alongX) {
          addBar(cx, cz - halfWidth / (2 * CELL), length, 0.24, ROOM_STONE);
          addBar(cx, cz + halfWidth / (2 * CELL), length, 0.24, ROOM_STONE);
          for (let i = -1; i <= 1; i++) addBar(cx + i * length / (3 * CELL), cz, 0.24, halfWidth, ROOM_STONE);
        } else {
          addBar(cx - halfWidth / (2 * CELL), cz, 0.24, length, ROOM_STONE);
          addBar(cx + halfWidth / (2 * CELL), cz, 0.24, length, ROOM_STONE);
          for (let i = -1; i <= 1; i++) addBar(cx, cz + i * length / (3 * CELL), halfWidth, 0.24, ROOM_STONE);
        }
      } else if (room.module === 'entry_vestibule') {
        addBar(cx, cz - 0.55, width * 0.7, 0.22, ROOM_STONE);
        addBar(cx, cz + 0.55, width * 0.7, 0.22, ROOM_STONE);
      }
    }
  }

  // ── walls: instanced bricks, seeded per-instance color jitter, ruined tops ─
  private buildWalls(map: MapDef, wallSet: Set<number>) {
    const W = map.size.w, H = map.size.h;
    const wallSetDef = this.areaTiles.wall;
    const intact: [number, number][] = [];
    const ruined: [number, number][] = [];
    const supportsAlongX: [number, number][] = [];
    const supportsAlongZ: [number, number][] = [];
    const open = (x: number, z: number) =>
      x >= 0 && z >= 0 && x < W && z < H && !wallSet.has(this.key(x, z));
    for (const [x, z] of map.cells.wall) {
      const visible = open(x, z - 1) || open(x, z + 1) || open(x - 1, z) || open(x + 1, z);
      (visible && hash2(x, z, 7) < 0.22 ? ruined : intact).push([x, z]);
      if (visible && hash2(x, z, 29) < 0.23) {
        const faces: [boolean, number, number][] = [];
        if (open(x, z - 1)) faces.push([true, x * CELL + CELL / 2, z * CELL + 0.55]);
        if (open(x, z + 1)) faces.push([true, x * CELL + CELL / 2, (z + 1) * CELL - 0.55]);
        if (open(x - 1, z)) faces.push([false, x * CELL + 0.55, z * CELL + CELL / 2]);
        if (open(x + 1, z)) faces.push([false, (x + 1) * CELL - 0.55, z * CELL + CELL / 2]);
        const face = faces[Math.floor(hash2(x, z, 31) * faces.length)];
        if (face) (face[0] ? supportsAlongX : supportsAlongZ).push([face[1], face[2]]);
      }
      this.colliders.push({
        x1: x * CELL, z1: z * CELL, x2: (x + 1) * CELL, z2: (z + 1) * CELL,
        yMin: 0, yMax: WALL_H
      });
    }

    // texture repeat shared by both variants (1 tile = 10ft tall on a 16ft wall)
    for (const v of new Set([wallSetDef.intactVariant, wallSetDef.ruinedVariant])) {
      const s = getTextureSet(wallSetDef.kind, v);
      s.map.repeat.set(1, 1.6);
      s.bump.repeat.set(1, 1.6);
    }

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const build = (cells: [number, number][], variant: number) => {
      if (!cells.length) return;
      const geo = new THREE.BoxGeometry(CELL, WALL_H, CELL);
      const materialVariant = variant === 0 ? wallSetDef.intactVariant : wallSetDef.ruinedVariant;
      const mesh = new THREE.InstancedMesh(geo, getMaterial(wallSetDef.kind, materialVariant), cells.length);
      mesh.castShadow = true; mesh.receiveShadow = true;
      cells.forEach(([x, z], i) => {
        dummy.position.set(x * CELL + CELL / 2, WALL_H / 2, z * CELL + CELL / 2);
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        // per-instance warm/cool brick jitter (seeded → stable)
        const v = 0.78 + hash2(x, z, 3) * 0.32;
        const w = (hash2(x, z, 5) - 0.5) * 0.08;
        col.setRGB(v * (1 + w), v, v * (1 - w * 0.8));
        if (variant === 1) col.multiplyScalar(0.92);  // ruined runs sootier
        mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.group.add(mesh);
    };
    build(intact, 0);
    build(ruined, 1);

    const supportMaterial = getMaterial(wallSetDef.kind, wallSetDef.intactVariant);
    const addSupports = (positions: [number, number][], alongX: boolean) => {
      if (!positions.length) return;
      const sizes = [
        alongX ? [1.45, WALL_H - 2.2, 1.0] : [1.0, WALL_H - 2.2, 1.45],
        alongX ? [2.75, 1.15, 1.35] : [1.35, 1.15, 2.75],
        alongX ? [2.75, 1.15, 1.35] : [1.35, 1.15, 2.75]
      ];
      const heights = [WALL_H / 2, 0.8, WALL_H - 0.8];
      sizes.forEach(([sx, sy, sz], part) => {
        const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(sx, sy, sz), supportMaterial, positions.length);
        const dummy = new THREE.Object3D();
        positions.forEach(([px, pz], i) => {
          dummy.position.set(px, heights[part], pz);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, new THREE.Color(part === 0 ? 0.76 : 0.88, part === 0 ? 0.76 : 0.88, part === 0 ? 0.76 : 0.88));
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
      });
    };
    addSupports(supportsAlongX, true);
    addSupports(supportsAlongZ, false);

    // broken-brick crumble on ruined tops (jagged silhouette)
    const chunks: ScatterItem[] = [];
    for (const [x, z] of ruined) {
      const r = rngFrom(hash2(x, z, 23));
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const s = 0.55 + r() * 0.95;
        chunks.push({
          x: x * CELL + 0.9 + r() * (CELL - 1.8),
          y: WALL_H - 0.1 - s * 0.35,
          z: z * CELL + 0.9 + r() * (CELL - 1.8),
          s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
          r: 0.72 + r() * 0.26, g: 0.68 + r() * 0.26, b: 0.62 + r() * 0.26
        });
      }
    }
    this.scatter(chunks, new THREE.BoxGeometry(1, 0.85, 1), getMaterial(wallSetDef.kind, wallSetDef.ruinedVariant));
  }

  // ── door frames: iron-banded wood with stateful, animated leaves ─────────
  private buildDoors(map: MapDef) {
    const wood = getMaterial('wood', this.areaTiles.trim.woodVariant);
    const iron = getMaterial('iron', this.areaTiles.trim.ironVariant);
    for (const [wallIndex, w] of map.walls.entries()) {
      if (w.type !== 'door' && w.type !== 'secret_door') continue;
      const len = Math.max(Math.abs(w.x2 - w.x1), Math.abs(w.z2 - w.z1)) * CELL;
      // frame center: cross-axis = wall-column center (wall cells sit at
      // (x+0.5)*CELL — the old raw midpoint landed on the wall's face plane,
      // half a cell off the doorway); along-axis = segment midpoint, which is
      // the door cell's center (segments are cell-boundary coords, x2 = x1+1)
      const isNS = w.x1 === w.x2;   // wall runs north-south
      const cx = isNS ? w.x1 + 0.5 : (w.x1 + w.x2) / 2;
      const cz = isNS ? (w.z1 + w.z2) / 2 : w.z1 + 0.5;
      const mx = cx * CELL, mz = cz * CELL;
      const g = new THREE.Group();
      g.position.set(mx, 0, mz);
      if (w.x1 === w.x2) g.rotation.y = Math.PI / 2;  // wall runs along z
      const hw = len / 2;
      const jambGeo = new THREE.BoxGeometry(0.85, 10.6, 1.35);
      for (const sx of [-hw + 0.42, hw - 0.42]) {
        const j = new THREE.Mesh(jambGeo, wood);
        j.position.set(sx, 5.3, 0);
        j.castShadow = true; j.receiveShadow = true;
        g.add(j);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(len + 0.9, 1.5, 1.45), wood);
      lintel.position.set(0, 10.4, 0); lintel.castShadow = true; g.add(lintel);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(len + 1.0, 0.5, 1.55), iron);
      strap.position.set(0, 10.15, 0); g.add(strap);
      // ajar leaf on a hinge at the left jamb (hugs the wall, never blocks the cell)
      const leaf = new THREE.Group();
      leaf.position.set(-hw + 0.85, 0, 0.35);
      const lw = len - 1.6;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(lw, 9.4, 0.42), wood);
      panel.position.set(lw / 2, 4.9, 0); panel.castShadow = true; leaf.add(panel);
      for (const by of [2.3, 7.4]) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(lw + 0.14, 0.6, 0.54), iron);
        band.position.set(lw / 2, by, 0); leaf.add(band);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 6, 14), iron);
      ring.position.set(lw - 0.5, 4.6, 0.4); ring.rotation.x = Math.PI / 2; leaf.add(ring);
      leaf.rotation.y = w.isOpen ? 1.9 : 0;
      g.add(leaf);
      this.group.add(g);
      this.doorLeaves.set(wallIndex, leaf);
      // Door trim is decorative, while the closed leaf gets a separate blocker.
      const ex = w.x1 === w.x2 ? 1.2 : hw + 0.8;
      const ez = w.x1 === w.x2 ? hw + 0.8 : 1.2;
      this.colliders.push({ x1: mx - ex, z1: mz - ez, x2: mx + ex, z2: mz + ez, yMin: 0, yMax: 11, decor: true });
      if (!w.isOpen) {
        const barrierHalfX = w.x1 === w.x2 ? 0.36 : Math.max(0.5, hw - 0.6);
        const barrierHalfZ = w.x1 === w.x2 ? Math.max(0.5, hw - 0.6) : 0.36;
        this.colliders.push({
          x1: mx - barrierHalfX, z1: mz - barrierHalfZ,
          x2: mx + barrierHalfX, z2: mz + barrierHalfZ,
          yMin: 0, yMax: 10.2,
        });
      }
    }
  }

  // ── props ──────────────────────────────────────────────────────────────────
  private buildProps(map: MapDef) {
    const wood = getMaterial('wood', this.areaTiles.trim.woodVariant);
    const ironSooty = getMaterial('iron', this.areaTiles.trim.sootVariant);
    const ironRust = getMaterial('iron', this.areaTiles.trim.ironVariant);
    const bone = getMaterial('bone', 0);
    const coal = getMaterial('ember');
    const rocks: ScatterItem[] = [];
    const natureRocks = new Map<string, ScatterItem[]>();
    const pebbleCluster: ScatterItem[] = [];
    const twigs: ScatterItem[] = [];
    const wildflowers: ScatterItem[] = [];
    const ferns: ScatterItem[] = [];
    const snowDrifts: ScatterItem[] = [];
    const trees: PropDef[] = [];

    for (const p of map.props) {
      const x = p.x * CELL, z = p.z * CELL;
      const r = rngFrom(hash2(p.x * 64 | 0, p.z * 64 | 0, 101));  // seeded per prop

      if (p.type === 'tree') {
        trees.push(p);
      } else if (p.type === 'building') {
        this.buildTownBuilding(p, x, z);
      } else if (p.type === 'boulder' || p.type === 'rock' || p.type === 'scree') {
        const scale = (p.scale || 1) * (p.type === 'boulder' ? 1.9 : p.type === 'rock' ? 0.55 : 0.8);
        const ground = this.terrainHeightAt(x, z);
        const normal = this.terrainNormalAt(x, z);
        const shape = p.shape || (p.type === 'boulder' ? 'angular' : 'slab');
        const batch = natureRocks.get(shape) || [];
        const yaw = p.rotY ?? (r() * Math.PI * 2);
        // Align rock with terrain surface normal so rocks on hills sit naturally without jutting off or floating
        const qAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const quat = qAlign.multiply(qYaw);
        batch.push({
          x, y: ground + scale * 0.12, z, s: scale,
          rx: 0, ry: 0, rz: 0,
          quat,
          r: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.78 : 0.62 + r() * 0.25,
          g: p.variant === 'deadlands' ? 0.39 + r() * 0.16 : 0.58 + r() * 0.25,
          b: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.86 : 0.5 + r() * 0.24,
        });
        natureRocks.set(shape, batch);

        if (p.type === 'boulder') {
          const radius = Math.max(1.1, scale * 0.75);
          this.colliders.push({ x1: x - radius, z1: z - radius, x2: x + radius, z2: z + radius, yMin: 0, yMax: 5 });
        }

        // PCG: Spawn realistic satellite pebble & talus cluster around boulders and large rocks
        if (p.type === 'boulder' || scale > 0.75) {
          const numTalus = p.type === 'scree' ? 5 + Math.floor(r() * 6) : 3 + Math.floor(r() * 4);
          for (let k = 0; k < numTalus; k++) {
            const angle = r() * Math.PI * 2;
            const dist = scale * (0.8 + r() * 1.2);
            const px = x + Math.cos(angle) * dist;
            const pz = z + Math.sin(angle) * dist;
            const pScale = scale * (0.16 + r() * 0.28);
            const pGround = this.terrainHeightAt(px, pz);
            const pNormal = this.terrainNormalAt(px, pz);
            const pYaw = r() * Math.PI * 2;
            const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
            const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pYaw);
            const pQuat = pAlign.multiply(pQYaw);
            pebbleCluster.push({
              x: px, y: pGround + pScale * 0.08, z: pz, s: pScale,
              rx: 0, ry: 0, rz: 0,
              quat: pQuat,
              r: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.76 : 0.58 + r() * 0.24,
              g: p.variant === 'deadlands' ? 0.37 + r() * 0.16 : 0.55 + r() * 0.24,
              b: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.84 : 0.48 + r() * 0.24,
            });
          }
        }
      } else if (p.type === 'twig' || p.type === 'dead_brush') {
        const scale = (p.scale || 1) * (p.type === 'dead_brush' ? 0.85 : 0.65);
        const gx = x + (r() - 0.5) * 1.6, gz = z + (r() - 0.5) * 1.6;
        twigs.push({
          x: gx, y: this.terrainHeightAt(gx, gz) + scale * 0.15, z: gz, s: scale,
          rx: (r() - 0.5) * 0.4, ry: p.rotY || r() * Math.PI * 2, rz: (r() - 0.5) * 0.4,
          r: 0.38 + r() * 0.12, g: 0.28 + r() * 0.1, b: 0.2 + r() * 0.08,
        });
      } else if (p.type === 'wildflower') {
        const scale = (p.scale || 1) * 0.55;
        const gx = x + (r() - 0.5) * 1.8, gz = z + (r() - 0.5) * 1.8;
        // Rich palette: poppy red, marigold amber, violet, cornflower blue
        const flowerCols = [
          [0.92, 0.24, 0.24],
          [0.95, 0.72, 0.18],
          [0.72, 0.38, 0.90],
          [0.34, 0.58, 0.95],
        ];
        const chosen = flowerCols[Math.floor(r() * flowerCols.length)];
        wildflowers.push({
          x: gx, y: this.terrainHeightAt(gx, gz) + scale * 0.35, z: gz, s: scale,
          rx: 0, ry: r() * Math.PI * 2, rz: (r() - 0.5) * 0.2,
          r: chosen[0], g: chosen[1], b: chosen[2],
        });
      } else if (p.type === 'fern') {
        const scale = (p.scale || 1) * 0.75;
        const gx = x + (r() - 0.5) * 1.7, gz = z + (r() - 0.5) * 1.7;
        ferns.push({
          x: gx, y: this.terrainHeightAt(gx, gz) + scale * 0.25, z: gz, s: scale,
          rx: 0, ry: r() * Math.PI * 2, rz: (r() - 0.5) * 0.2,
          r: 0.24 + r() * 0.12, g: 0.52 + r() * 0.18, b: 0.22 + r() * 0.1,
        });
      } else if (p.type === 'snow_drift') {
        const scale = (p.scale || 1) * 1.25;
        const gx = x + (r() - 0.5) * 2.0, gz = z + (r() - 0.5) * 2.0;
        snowDrifts.push({
          x: gx, y: this.terrainHeightAt(gx, gz) + scale * 0.22, z: gz, s: scale,
          rx: 0, ry: r() * Math.PI * 2, rz: 0,
          r: 0.88, g: 0.92, b: 0.98,
        });
      } else if (p.type === 'bridge') {
        const bg = new THREE.Group();
        const bWidth = (p.width || 2.4) * CELL;
        const bLength = (p.length || 5.0) * CELL;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.45, bLength), wood);
        deck.position.y = 0.22;
        deck.receiveShadow = true;
        deck.castShadow = true;
        bg.add(deck);

        // Side beam supports and handrails
        const railMat = getMaterial('wood', 0);
        const railOffset = bWidth / 2 - 0.45;
        for (const side of [-railOffset, railOffset]) {
          const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, bLength + 0.2), railMat);
          stringer.position.set(side, 0.1, 0);
          stringer.castShadow = true;
          bg.add(stringer);

          const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, bLength + 0.2), railMat);
          handrail.position.set(side, 2.2, 0);
          handrail.castShadow = true;
          bg.add(handrail);

          const postCount = 6;
          for (let pi = 0; pi < postCount; pi++) {
            const pz = -bLength / 2 + (bLength / (postCount - 1)) * pi;
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.1, 0.35), railMat);
            post.position.set(side, 1.1, pz);
            post.castShadow = true;
            bg.add(post);
          }
        }
        bg.position.set(x, this.terrainHeightAt(x, z) + 0.18, z);
        bg.rotation.y = p.rotY || 0;
        this.group.add(bg);
      } else if (p.type === 'grave_marker') {
        const marker = new THREE.Group();
        const stone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.45), bone);
        stone.position.y = 1.25; stone.castShadow = true; marker.add(stone);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 0.55), bone);
        cap.position.y = 2.45; marker.add(cap);
        marker.position.set(x, this.terrainHeightAt(x, z), z);
        marker.rotation.y = p.rotY || 0;
        this.group.add(marker);
      } else if (p.type === 'ruin_pillar') {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 4.5 * (p.scale || 1), 7), bone);
        pillar.position.set(x, this.terrainHeightAt(x, z) + 2.25 * (p.scale || 1), z);
        pillar.rotation.z = 0.12 * (p.scale || 1);
        pillar.castShadow = true; pillar.receiveShadow = true;
        this.group.add(pillar);
      } else if (p.type === 'cave_entrance') {
        this.buildCaveMouth(x, z);
      } else if (p.type === 'well') {
        this.buildTownWell(x, z);
      } else if (p.type === 'street_lantern') {
        this.buildStreetLantern(x, z);
      } else if (p.type === 'brazier') {
        const g = new THREE.Group();
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.0, 1.8, 10), ironSooty);
        bowl.position.y = 3.4; bowl.castShadow = true; g.add(bowl);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.17, 8, 18), ironRust);
        rim.rotation.x = Math.PI / 2; rim.position.y = 4.28; g.add(rim);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.6, 3.1, 8), ironSooty);
        stand.position.y = 1.6; stand.castShadow = true; g.add(stand);
        // glowing coal bed
        for (let i = 0; i < 5; i++) {
          const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + r() * 0.22, 0), coal);
          c.position.set((r() - 0.5) * 1.7, 4.05 + r() * 0.35, (r() - 0.5) * 1.7);
          c.rotation.set(r() * 3, r() * 3, r() * 3);
          g.add(c);
        }
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowSprite(), color: 0xff8a3a, transparent: true, opacity: 0.55,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        glow.scale.setScalar(4.6); glow.position.y = 4.3; g.add(glow);
        g.position.set(x, 0, z);
        this.group.add(g);
        // LOW prop: blocks legs, never the sightline (starts at head height)
        this.colliders.push({ x1: x - 1.4, z1: z - 1.4, x2: x + 1.4, z2: z + 1.4, yMin: 0, yMax: 4 });
      } else if (p.type === 'pillar') {
        const g = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.45, WALL_H, 12), bone);
        shaft.position.y = WALL_H / 2; shaft.castShadow = true; shaft.receiveShadow = true; g.add(shaft);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 5.4), bone);
        cap.position.y = WALL_H - 0.55; cap.castShadow = true; g.add(cap);
        const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.0, 5.8), bone);
        base.position.y = 0.5; base.receiveShadow = true; g.add(base);
        // rubble scatter around the base
        const n = 3 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, rr = 3.0 + r() * 1.5;
          const s = 0.32 + r() * 0.55;
          rocks.push({
            x: x + Math.cos(a) * rr, y: s * 0.5 + 0.08, z: z + Math.sin(a) * rr,
            s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
            r: 0.5 + r() * 0.3, g: 0.48 + r() * 0.3, b: 0.44 + r() * 0.3
          });
        }
        g.position.set(x, 0, z);
        this.group.add(g);
        this.colliders.push({ x1: x - 2.4, z1: z - 2.4, x2: x + 2.4, z2: z + 2.4, yMin: 0, yMax: WALL_H });
      } else if (p.type === 'coffin') {
        const g = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 8.6), wood);
        box.position.y = 1.2; box.castShadow = true; box.receiveShadow = true; g.add(box);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 8.2, 10, 1, false, 0, Math.PI), wood);
        lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2;
        lid.position.y = 2.4; lid.castShadow = true; g.add(lid);
        g.position.set(x, 0, z);
        this.group.add(g);
        this.colliders.push({ x1: x - 2.2, z1: z - 4.4, x2: x + 2.2, z2: z + 4.4, yMin: 0, yMax: 3 });
      } else if (p.type === 'altar') {
        const g = new THREE.Group();
        const block = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 6), bone);
        block.position.y = 1.6; block.castShadow = true; block.receiveShadow = true; g.add(block);
        const step = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 8), bone);
        step.position.y = 0.6; step.receiveShadow = true; g.add(step);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowSprite(), color: 0x7fd4c8, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        glow.scale.setScalar(7); glow.position.y = 5; g.add(glow);
        g.position.set(x, 0, z);
        this.group.add(g);
        this.colliders.push({ x1: x - 5, z1: z - 3, x2: x + 5, z2: z + 3, yMin: 0, yMax: 3.5 });
      } else if (p.type === 'rubble') {
        const n = 2 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const s = 0.4 + r() * 1.1;
          rocks.push({
            x: x + (r() - 0.5) * 3, y: s * 0.45 + 0.08, z: z + (r() - 0.5) * 3,
            s, rx: r() * 3, ry: r() * 3, rz: r() * 3,
            r: 0.45 + r() * 0.35, g: 0.43 + r() * 0.35, b: 0.4 + r() * 0.35
          });
        }
      }
    }
    // PCG: Spawn landscape pebble & rock clusters across open terrain biomes
    this.buildRockClutter(map, pebbleCluster, natureRocks);

    const rockMat = this.makeRockMaterial();
    // Loose rubble in crypt/dungeons and ruins now uses sculpted talus and rock shader
    if (rocks.length) {
      this.scatter(rocks, this.makeRockGeometry('talus'), rockMat);
    }
    for (const [shape, batch] of natureRocks) {
      this.scatter(batch, this.makeRockGeometry(shape), rockMat);
    }
    // Scatter the PCG talus & companion pebbles around boulders, scree, and field clusters
    if (pebbleCluster.length) {
      this.scatter(pebbleCluster, this.makeRockGeometry('pebble'), rockMat);
    }

    // Model and scatter ground clutter with dedicated assets (replacing generic white cones)
    if (twigs.length) {
      const twigGeo = this.makeTwigGeometry();
      this.scatter(twigs, twigGeo, new THREE.MeshStandardMaterial({ color: 0x4a3b2e, roughness: 0.94 }));
    }
    if (wildflowers.length) {
      const flowerGeo = this.makeWildflowerGeometry();
      this.scatter(wildflowers, flowerGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }));
    }
    if (ferns.length) {
      const fernGeo = this.makeFernGeometry();
      this.scatter(ferns, fernGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide }));
    }
    if (snowDrifts.length) {
      const snowGeo = this.makeSnowDriftGeometry();
      this.scatter(snowDrifts, snowGeo, new THREE.MeshStandardMaterial({ color: 0xecf2fa, roughness: 0.82 }));
    }
    this.buildTrees(trees);
    this.buildGrassland(map);
  }

  // ── PCG ground clutter & pebble clusters ────────────────────────────────────
  private buildRockClutter(
    map: MapDef,
    pebbleCluster: ScatterItem[],
    natureRocks: Map<string, ScatterItem[]>
  ) {
    const biomeCells = map.biomes?.cells;
    const kinds = map.biomes?.kinds;
    if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;

    const road = new Set((map.cells.road || []).map(([x, z]) => this.key(x, z)));
    const water = new Set((map.cells.water || []).map(([x, z]) => this.key(x, z)));
    const wall = new Set(map.cells.wall.map(([x, z]) => this.key(x, z)));
    const townCenter = { x: 56.5, z: 55.5 };

    for (let z = 2; z < map.size.h - 2; z += 2) {
      for (let x = 2; x < map.size.w - 2; x += 2) {
        const cell = this.key(x, z);
        if (road.has(cell) || water.has(cell) || wall.has(cell)) continue;
        if (Math.hypot(x - townCenter.x, z - townCenter.z) < 14) continue;

        const biome = kinds[biomeCells[z * map.size.w + x]];
        const clusterRoll = hash2(x, z, 4001);

        let spawnCluster = false;
        let clusterCount = 0;
        let baseScale = 0.25;

        if (biome === 'mountains') {
          if (clusterRoll > 0.42) {
            spawnCluster = true;
            clusterCount = 4 + Math.floor(hash2(x, z, 4002) * 5);
            baseScale = 0.28 + hash2(x, z, 4003) * 0.24;
          }
        } else if (biome === 'forest') {
          if (clusterRoll > 0.74) {
            spawnCluster = true;
            clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 3);
            baseScale = 0.22 + hash2(x, z, 4003) * 0.18;
          }
        } else if (biome === 'meadow') {
          if (clusterRoll > 0.82) {
            spawnCluster = true;
            clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 3);
            baseScale = 0.18 + hash2(x, z, 4003) * 0.16;
          }
        } else if (biome === 'deadlands') {
          if (clusterRoll > 0.62) {
            spawnCluster = true;
            clusterCount = 3 + Math.floor(hash2(x, z, 4002) * 4);
            baseScale = 0.24 + hash2(x, z, 4003) * 0.22;
          }
        } else if (biome === 'snowfield' || biome === 'snow_forest') {
          if (clusterRoll > 0.68) {
            spawnCluster = true;
            clusterCount = 2 + Math.floor(hash2(x, z, 4002) * 4);
            baseScale = 0.24 + hash2(x, z, 4003) * 0.20;
          }
        }

        if (!spawnCluster) continue;

        const cx = x * CELL + CELL * 0.5;
        const cz = z * CELL + CELL * 0.5;

        for (let k = 0; k < clusterCount; k++) {
          const kSeed = k + z * 103 + x * 991;
          const angle = hash2(kSeed, 11, 4004) * Math.PI * 2;
          const dist = (0.3 + hash2(kSeed, 23, 4005) * 1.8) * CELL * 0.45;
          const px = cx + Math.cos(angle) * dist;
          const pz = cz + Math.sin(angle) * dist;

          const pCell = this.key(Math.floor(px / CELL), Math.floor(pz / CELL));
          if (water.has(pCell) || wall.has(pCell)) continue;

          const pScale = baseScale * (0.65 + hash2(kSeed, 37, 4006) * 0.7);
          const ground = this.terrainHeightAt(px, pz);
          const rotX = hash2(kSeed, 41, 4007) * 3;
          const rotY = hash2(kSeed, 53, 4008) * 3;
          const rotZ = hash2(kSeed, 67, 4009) * 3;

          let rCol = 0.58 + hash2(kSeed, 71, 4010) * 0.24;
          let gCol = 0.55 + hash2(kSeed, 79, 4011) * 0.24;
          let bCol = 0.50 + hash2(kSeed, 83, 4012) * 0.24;

          if (biome === 'snowfield' || biome === 'snow_forest') {
            rCol = 0.76 + hash2(kSeed, 71, 4010) * 0.16;
            gCol = 0.80 + hash2(kSeed, 79, 4011) * 0.16;
            bCol = 0.88 + hash2(kSeed, 83, 4012) * 0.10;
          } else if (biome === 'deadlands') {
            rCol = 0.34 + hash2(kSeed, 71, 4010) * 0.14;
            gCol = 0.32 + hash2(kSeed, 79, 4011) * 0.12;
            bCol = 0.30 + hash2(kSeed, 83, 4012) * 0.12;
          }

          const pNormal = this.terrainNormalAt(px, pz);
          const pYaw = hash2(kSeed, 53, 4008) * Math.PI * 2;
          const pAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pNormal);
          const pQYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pYaw);
          const quat = pAlign.multiply(pQYaw);

          if (pScale > 0.42) {
            const shape = hash2(kSeed, 89, 4013) > 0.5 ? 'talus' : 'angular';
            const batch = natureRocks.get(shape) || [];
            batch.push({
              x: px, y: ground + pScale * 0.10, z: pz, s: pScale,
              rx: 0, ry: 0, rz: 0,
              quat,
              r: rCol, g: gCol, b: bCol,
            });
            natureRocks.set(shape, batch);
          } else {
            pebbleCluster.push({
              x: px, y: ground + pScale * 0.06, z: pz, s: pScale,
              rx: 0, ry: 0, rz: 0,
              quat,
              r: rCol, g: gCol, b: bCol,
            });
          }
        }
      }
    }
  }

  private makeRockMaterial() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0.02,
    });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vLocalY;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          mat3 normalMatrixInst = mat3(modelMatrix) * mat3(instanceMatrix);
          vWorldNormal = normalize(normalMatrixInst * normal);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        #endif
        vLocalY = position.y;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vLocalY;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // ── 1. World-Space Macro Texturing & Sedimentary Strata ──
        float wsWarp = sin(vWorldPosition.x * 0.16 + vWorldPosition.z * 0.12) * 1.6;
        float strataCoord = (vWorldPosition.y + wsWarp) * 0.72;
        float strata = sin(strataCoord * 3.14159) * 0.5 + 0.5;
        float fineBands = sin(strataCoord * 8.6) * 0.5 + 0.5;

        float n1 = sin(vWorldPosition.x * 0.38 + sin(vWorldPosition.z * 0.32) * 2.2) *
                   cos(vWorldPosition.y * 0.44 + vWorldPosition.z * 0.28);
        float n2 = sin(vWorldPosition.x * 1.15 + vWorldPosition.y * 0.85) *
                   cos(vWorldPosition.z * 1.05 + vWorldPosition.x * 0.65);
        float n3 = sin(vWorldPosition.x * 2.6 + vWorldPosition.z * 2.2) *
                   cos(vWorldPosition.y * 2.8);
        float macroNoise = n1 * 0.54 + n2 * 0.31 + n3 * 0.15;

        vec3 rockBase = diffuseColor.rgb * (0.80 + macroNoise * 0.26 + strata * 0.10 - fineBands * 0.05);

        // ── 2. Top Overburden Blend (Moss / Snow / Lichen / Ash depending on biome) ──
        vec3 wNorm = normalize(vWorldNormal);
        float upSlope = clamp(wNorm.y, 0.0, 1.0);
        float topElev = smoothstep(-0.20, 0.55, vLocalY + macroNoise * 0.25);
        float topWeight = smoothstep(0.42, 0.85, upSlope) * topElev;

        vec3 mossColor   = vec3(0.24, 0.38, 0.17);
        vec3 snowColor   = vec3(0.92, 0.95, 0.99);
        vec3 ashColor    = vec3(0.17, 0.16, 0.15);
        vec3 lichenColor = vec3(0.50, 0.54, 0.44);

        vec3 topColor = mossColor;
        if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
          topColor = snowColor;
        } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
          topColor = ashColor;
        } else if (diffuseColor.r > 0.56 && diffuseColor.g > 0.52 && diffuseColor.b > 0.46) {
          topColor = lichenColor;
        }

        vec3 stoneWithTop = mix(rockBase, topColor, topWeight * 0.80);

        // ── 3. Bottom Ground Contact Blend (Loam / Mud / Slush / Ash at rock base) ──
        float groundFactor = 1.0 - smoothstep(-0.55, 0.28, vLocalY + macroNoise * 0.18);
        vec3 groundSoil = vec3(0.18, 0.14, 0.10);
        if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
          groundSoil = vec3(0.72, 0.78, 0.86);
        } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
          groundSoil = vec3(0.11, 0.10, 0.09);
        }

        diffuseColor.rgb = mix(stoneWithTop, groundSoil, groundFactor * 0.72);`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.90, 0.98, topWeight * 0.5);`
      );
    };
    mat.customProgramCacheKey = () => 'ashenreach-rock-ws-height-v2';
    return mat;
  }

  private makeRockGeometry(shape: string) {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const proportions: Record<string, [number, number, number]> = {
      angular: [1.06, 0.88, 1.02],
      slab:    [1.48, 0.42, 1.15],
      spire:   [0.72, 1.68, 0.78],
      ridge:   [1.65, 0.72, 0.68],
      split:   [0.96, 1.04, 1.34],
      pebble:  [0.85, 0.44, 0.76],
      talus:   [1.14, 0.54, 0.82],
    };
    const [sx, sy, sz] = proportions[shape] || proportions.angular;
    geometry.scale(sx, sy, sz);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let vx = pos.getX(i);
      let vy = pos.getY(i);
      let vz = pos.getZ(i);

      // Chiseled organic faceting displacement
      const facetNoise = Math.sin(vx * 2.8 + vy * 3.4) * Math.cos(vz * 2.6 + vx * 1.5) * 0.12;
      vx += vx * facetNoise;
      vy += vy * facetNoise;
      vz += vz * facetNoise;

      // Base flattening: rocks seat firmly into the earth instead of sharp points underneath
      if (vy < -0.20 * sy) {
        vy = -0.32 * sy + (vy + 0.20 * sy) * 0.22;
      }

      pos.setXYZ(i, vx, vy, vz);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  private mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const nonIndexed = geos.map(g => g.index ? g.toNonIndexed() : g);
    let totalPositions = 0;
    for (const g of nonIndexed) {
      const pos = g.getAttribute('position');
      if (pos) totalPositions += pos.array.length;
    }
    const positions = new Float32Array(totalPositions);
    const normals = new Float32Array(totalPositions);
    let posOffset = 0;
    for (const g of nonIndexed) {
      const pos = g.getAttribute('position');
      const norm = g.getAttribute('normal');
      if (pos) {
        positions.set(pos.array, posOffset);
        if (norm) normals.set(norm.array, posOffset);
        posOffset += pos.array.length;
      }
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    return merged;
  }

  private makeFernGeometry(): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2 + (f % 2 ? 0.16 : -0.16);
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const perpX = -sinA, perpZ = cosA;
      const length = 1.15 + (f % 3) * 0.18;
      const segs = 4;

      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const y = Math.sin(t * Math.PI * 0.85) * 0.36 * (1.0 - t * 0.35);
        const r = t * length;
        const cx = cosA * r, cz = sinA * r;
        const w = (s === 0 ? 0.05 : s === segs ? 0.02 : 0.28 * Math.sin(t * Math.PI)) * 0.5;

        const baseIdx = positions.length / 3;
        positions.push(
          cx - perpX * w, y, cz - perpZ * w,
          cx + perpX * w, y, cz + perpZ * w,
        );
        normals.push(0, 1, 0, 0, 1, 0);

        const gTone = 0.40 + t * 0.24;
        colors.push(
          0.16, gTone, 0.12,
          0.16, gTone, 0.12,
        );

        if (s > 0) {
          const prev = baseIdx - 2;
          indices.push(
            prev, prev + 1, baseIdx,
            prev + 1, baseIdx + 1, baseIdx,
          );
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private makeTwigGeometry(): THREE.BufferGeometry {
    const mainStem = new THREE.CylinderGeometry(0.045, 0.08, 1.8, 5);
    mainStem.rotateZ(Math.PI / 2);
    mainStem.rotateY(0.25);
    mainStem.translate(0, 0.04, 0);

    const fork1 = new THREE.CylinderGeometry(0.025, 0.045, 0.85, 4);
    fork1.rotateZ(Math.PI / 2 + 0.65);
    fork1.rotateY(-0.4);
    fork1.translate(0.25, 0.03, 0.22);

    const fork2 = new THREE.CylinderGeometry(0.02, 0.035, 0.6, 4);
    fork2.rotateZ(Math.PI / 2 - 0.55);
    fork2.rotateY(0.35);
    fork2.translate(-0.35, 0.03, -0.16);

    const merged = this.mergeGeometries([mainStem, fork1, fork2]);
    mainStem.dispose();
    fork1.dispose();
    fork2.dispose();
    return merged;
  }

  private makeWildflowerGeometry(): THREE.BufferGeometry {
    const stem = new THREE.CylinderGeometry(0.03, 0.045, 0.52, 4);
    stem.translate(0, 0.26, 0);

    const leaf1 = new THREE.BoxGeometry(0.28, 0.02, 0.08);
    leaf1.rotateY(0.4);
    leaf1.translate(0.08, 0.06, 0.04);

    const leaf2 = new THREE.BoxGeometry(0.26, 0.02, 0.08);
    leaf2.rotateY(-0.9);
    leaf2.translate(-0.07, 0.08, -0.05);

    const blossom = new THREE.DodecahedronGeometry(0.18, 0);
    blossom.translate(0, 0.54, 0);

    const merged = this.mergeGeometries([stem, leaf1, leaf2, blossom]);
    stem.dispose();
    leaf1.dispose();
    leaf2.dispose();
    blossom.dispose();
    return merged;
  }

  private makeSnowDriftGeometry(): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
    geo.scale(1.4, 0.28, 0.95);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      let vy = pos.getY(i);
      const vz = pos.getZ(i);
      vy += Math.sin(vx * 1.5 + vz * 0.8) * 0.06;
      pos.setXYZ(i, vx, Math.max(0.02, vy), vz);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  private buildGrassland(map: MapDef) {
    const biomeCells = map.biomes?.cells;
    const kinds = map.biomes?.kinds;
    if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;
    const road = new Set((map.cells.road || []).map(([x, z]) => this.key(x, z)));
    const water = new Set((map.cells.water || []).map(([x, z]) => this.key(x, z)));
    const wall = new Set(map.cells.wall.map(([x, z]) => this.key(x, z)));
    const clumps: { x: number; z: number; y: number; scaleXZ: number; scaleY: number; color: number }[] = [];
    for (let z = 1; z < map.size.h - 1; z++) for (let x = 1; x < map.size.w - 1; x++) {
      const cell = this.key(x, z), biome = kinds[biomeCells[z * map.size.w + x]];
      if ((biome !== 'meadow' && biome !== 'forest') ||
          road.has(cell) || water.has(cell) || wall.has(cell)) continue;
      const density = hash2(x, z, 207);
      const count = biome === 'meadow'
        ? this.eng.lowgfx
          ? 7 + Math.floor(density * 6)
          : 15 + Math.floor(density * 12)
        : density > 0.28
          ? this.eng.lowgfx ? 3 + Math.floor(density * 4) : 6 + Math.floor(density * 6)
          : 0;
      for (let i = 0; i < count; i++) {
        const seed = i + z * map.size.w + x * 997;
        // Jitter widely across cell boundaries for seamless coverage without clumping
        const px = (x - 0.15 + hash2(seed, 17, 223) * 1.3) * CELL;
        const pz = (z - 0.15 + hash2(seed, 31, 227) * 1.3) * CELL;
        const targetCell = this.key(Math.floor(px / CELL), Math.floor(pz / CELL));
        if (road.has(targetCell) || water.has(targetCell) || wall.has(targetCell)) continue;

        const palette = biome === 'meadow'
          ? [0x628442, 0x7b9b4b, 0x9aab5b, 0x526f3d]
          : [0x45633c, 0x5f7945, 0x78834a];
        const baseScale = (biome === 'meadow' ? 1.08 : 0.9) + hash2(seed, 43, 229) * 0.45;
        const heightScale = baseScale * (0.82 + hash2(seed, 71, 241) * 0.48);
        clumps.push({
          x: px, z: pz, y: this.terrainHeightAt(px, pz),
          scaleXZ: baseScale,
          scaleY: heightScale,
          color: palette[Math.floor(hash2(seed, 59, 233) * palette.length)],
        });
      }
    }
    if (!clumps.length) return;
    const positions: number[] = [], indices: number[] = [];
    const vertexColors: number[] = [];

    // Varied blade profiles in the asset itself: heights range from 0.44 to 1.18 ft
    const bladeDefs = [
      { angle: 0.15, width: 0.22, height: 1.18, bendX: 0.14, bendZ: 0.05 },
      { angle: 1.25, width: 0.18, height: 0.82, bendX: -0.15, bendZ: -0.08 },
      { angle: 2.20, width: 0.16, height: 0.52, bendX: 0.18, bendZ: 0.12 },
      { angle: 3.25, width: 0.20, height: 1.05, bendX: -0.12, bendZ: -0.06 },
      { angle: 4.35, width: 0.17, height: 0.70, bendX: 0.19, bendZ: 0.10 },
      { angle: 5.35, width: 0.15, height: 0.44, bendX: -0.14, bendZ: 0.07 },
    ];

    for (let b = 0; b < bladeDefs.length; b++) {
      const def = bladeDefs[b];
      const widthX = Math.cos(def.angle) * def.width;
      const widthZ = Math.sin(def.angle) * def.width;
      const midH = def.height * 0.46;
      const topH = def.height;
      const offset = positions.length / 3;

      positions.push(
        -widthX, 0, -widthZ,
        widthX, 0, widthZ,
        def.bendX - widthX * 0.65, midH, def.bendZ - widthZ * 0.65,
        def.bendX + widthX * 0.65, midH, def.bendZ + widthZ * 0.65,
        def.bendX * 2.2 - widthX * 0.12, topH, def.bendZ * 2.2 - widthZ * 0.12,
        def.bendX * 2.2 + widthX * 0.12, topH, def.bendZ * 2.2 + widthZ * 0.12,
      );
      vertexColors.push(
        0.52, 0.68, 0.46, 0.52, 0.68, 0.46,
        0.78, 0.90, 0.64, 0.78, 0.90, 0.64,
        0.98, 1.0, 0.78, 0.98, 1.0, 0.78,
      );
      indices.push(
        offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2,
        offset + 2, offset + 3, offset + 4, offset + 3, offset + 5, offset + 4,
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, metalness: 0,
      side: THREE.DoubleSide, vertexColors: true,
    });
    this.grassMaterial = material;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGrassTime = this.grassTime;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uGrassTime;`,
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 grassOrigin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          mat3 grassRotation = mat3(
            normalize(instanceMatrix[0].xyz),
            normalize(instanceMatrix[1].xyz),
            normalize(instanceMatrix[2].xyz)
          );
          vec3 windLocal = transpose(grassRotation) * vec3(0.88, 0.0, 0.48);
          float gust = sin(grassOrigin.x * 0.12 + grassOrigin.z * 0.08 + uGrassTime * 0.85);
          transformed += windLocal * gust * position.y * position.y * 0.12;
        #endif`,
      );
    };
    material.customProgramCacheKey = () => 'ashenreach-instanced-grass-wind-v2';
    const mesh = new THREE.InstancedMesh(geometry, material, clumps.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const object = new THREE.Object3D(), color = new THREE.Color();
    clumps.forEach((clump, index) => {
      object.position.set(clump.x, clump.y, clump.z);
      object.rotation.y = hash2(index, 67, 239) * Math.PI * 2;
      object.scale.set(clump.scaleXZ, clump.scaleY, clump.scaleXZ);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      color.setHex(clump.color);
      mesh.setColorAt(index, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  private buildTrees(trees: PropDef[]) {
    if (!trees.length) return;

    // ── Bark Materials with PBR procedural texture + bump ─────────────
    const barkOak = getMaterial('bark', 0) as THREE.MeshStandardMaterial;
    const barkPine = getMaterial('bark', 1) as THREE.MeshStandardMaterial;
    const barkDead = getMaterial('bark', 2) as THREE.MeshStandardMaterial;
    const barkBirch = getMaterial('bark', 3) as THREE.MeshStandardMaterial;
    const barkWillow = getMaterial('bark', 4) as THREE.MeshStandardMaterial;

    // Foliage Material with flat shading for painterly dappled canopy volume
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    });

    const palettes: Record<string, number[]> = {
      oak: [0x3c5427, 0x4d6832, 0x5b753c, 0x364823, 0x435c2d],
      ash: [0x54633b, 0x627343, 0x485832, 0x6e7e4d, 0x3d4d29],
      pine: [0x223b2c, 0x2b4635, 0x1d3326, 0x33513d, 0x182a1f],
      snowpine: [0x4d635a, 0x5e796e, 0x3c5249, 0x6f8b7f, 0x8aa499],
      willow: [0x4d6335, 0x5a743e, 0x688547, 0x41542d, 0x73944f, 0x556e3b],
      birch: [0x82a033, 0x94b03d, 0xa8c049, 0x6d8b26, 0xb2c852],
      dead: [0x423832, 0x342c27, 0x52443c],
    };

    const height = (tree: PropDef) => (tree.scale || 1) * (tree.variant === 'dead' ? 1.15 : 1);

    type TreeData = { tree: PropDef; scale: number; x: number; z: number; ground: number; index: number };
    const hardwoodTrees: TreeData[] = [];
    const coniferTrees: TreeData[] = [];
    const willowTrees: TreeData[] = [];
    const birchTrees: TreeData[] = [];
    const deadTrees: TreeData[] = [];

    trees.forEach((tree, index) => {
      const scale = height(tree);
      const x = tree.x * CELL, z = tree.z * CELL;
      const ground = this.terrainHeightAt(x, z);
      const data = { tree, scale, x, z, ground, index };

      if (tree.variant === 'dead') {
        deadTrees.push(data);
      } else if (tree.variant === 'pine' || tree.variant === 'snowpine') {
        coniferTrees.push(data);
      } else if (tree.variant === 'willow') {
        willowTrees.push(data);
      } else if (tree.variant === 'birch') {
        birchTrees.push(data);
      } else {
        hardwoodTrees.push(data);
      }

      // Authoritative physical trunk collider footprint matching large towering trees
      const colliderRadius = Math.max(0.7, scale * 0.4);
      this.colliders.push({
        x1: x - colliderRadius,
        z1: z - colliderRadius,
        x2: x + colliderRadius,
        z2: z + colliderRadius,
        yMin: 0,
        yMax: 32 * scale,
      });
    });

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const upVector = new THREE.Vector3(0, 1, 0);

    // ──────────────────────────────────────────────────────────────────
    // 1. Hardwood Trees (Grand Ancient Oak & Noble Ash)
    // - Massive flared trunk (height 16)
    // - 4 heavy boughs (length 7.5) rooted inside the trunk surface
    // - 8 voluminous organic canopy clouds reaching 25+ height
    // ──────────────────────────────────────────────────────────────────
    if (hardwoodTrees.length > 0) {
      const trunkHeight = 16.0, baseR = 1.35, topR = 0.72;
      const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 9);
      // Extra bottom margin (-1.2) ensures trunk extends deep underground on slopes
      trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
      const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkOak, hardwoodTrees.length);

      const boughsPerTree = 4;
      const boughLength = 7.5, boughBaseR = 0.44, boughTipR = 0.22;
      const boughGeom = new THREE.CylinderGeometry(boughTipR, boughBaseR, boughLength, 6);
      boughGeom.translate(0, boughLength / 2, 0); // Base at (0, 0, 0) for locked attachment
      const boughMesh = new THREE.InstancedMesh(boughGeom, barkOak, hardwoodTrees.length * boughsPerTree);

      const foliagePerTree = 8;
      const foliageGeom = new THREE.DodecahedronGeometry(3.6, 1);
      const foliageMesh = new THREE.InstancedMesh(foliageGeom, leafMat, hardwoodTrees.length * foliagePerTree);

      hardwoodTrees.forEach((item, tIdx) => {
        const { tree, scale, x, z, ground } = item;
        const seed = hash2(Math.round(x), Math.round(z), 0x73ee);
        const r = rngFrom(seed);
        const baseRotY = tree.rotY || (r() * Math.PI * 2);
        // Sunk firmly into the ground to ensure no base ever floats on slopes
        const sinkDepth = 0.85 * scale;
        const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

        // Trunk instance: strictly upright
        dummy.position.copy(trunkBasePos);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(tIdx, dummy.matrix);

        const trunkQuat = dummy.quaternion.clone();

        // 4 Rooted Main Boughs
        const attachHeights = [9.5, 11.2, 12.8, 14.2];
        const boughAngles = [0.2, 1.8, 3.4, 4.9];
        const boughTips: { x: number; y: number; z: number }[] = [];

        for (let b = 0; b < boughsPerTree; b++) {
          const bAngle = boughAngles[b] + (r() - 0.5) * 0.15;
          const hAttach = attachHeights[b];
          const t = hAttach / trunkHeight;
          const rTrunk = baseR + (topR - baseR) * t;

          // Local anchor inside trunk wooden core
          const localRoot = new THREE.Vector3(
            Math.sin(bAngle) * (rTrunk * 0.45),
            hAttach,
            Math.cos(bAngle) * (rTrunk * 0.45)
          );
          const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

          const pitch = 0.82 + (r() - 0.5) * 0.16; // outward-upward angle (~47 deg)
          const localDir = new THREE.Vector3(
            Math.sin(bAngle) * Math.sin(pitch),
            Math.cos(pitch),
            Math.cos(bAngle) * Math.sin(pitch)
          ).normalize();
          const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(worldRoot);
          dummy.quaternion.setFromUnitVectors(upVector, worldDir);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          boughMesh.setMatrixAt(tIdx * boughsPerTree + b, dummy.matrix);

          // Save tip position for canopy placement
          boughTips.push({
            x: worldRoot.x + worldDir.x * (boughLength * scale),
            y: worldRoot.y + worldDir.y * (boughLength * scale),
            z: worldRoot.z + worldDir.z * (boughLength * scale),
          });
        }

        // Full dappled hardwood canopy (4 bough tip clusters + 1 central summit + 3 mid fills)
        const leafPalette = palettes[tree.variant || 'oak'] || palettes.oak;
        for (let c = 0; c < foliagePerTree; c++) {
          let cx = x, cy = ground - sinkDepth + 20.5 * scale, cz = z, cScale = 1.0;
          if (c < 4) {
            // Clustered right at the tips of the 4 main boughs
            cx = boughTips[c].x;
            cy = boughTips[c].y + 0.8 * scale;
            cz = boughTips[c].z;
            cScale = 1.05;
          } else if (c === 4) {
            // Summit dome
            cx = x;
            cy = ground - sinkDepth + 21.0 * scale;
            cz = z;
            cScale = 1.35;
          } else {
            // Mid-canopy fills
            const fillAngle = baseRotY + (c * 2.0);
            cx = x + Math.sin(fillAngle) * 4.2 * scale;
            cy = ground - sinkDepth + (16.5 + (c - 5) * 1.8) * scale;
            cz = z + Math.cos(fillAngle) * 4.2 * scale;
            cScale = 1.1;
          }

          dummy.position.set(cx, cy, cz);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(r() * 0.5, baseRotY + c * 0.9, r() * 0.5);
          dummy.scale.set(
            cScale * scale * (0.95 + r() * 0.2),
            cScale * scale * 0.82,
            cScale * scale * (0.95 + r() * 0.2)
          );
          dummy.updateMatrix();

          const fIdx = tIdx * foliagePerTree + c;
          foliageMesh.setMatrixAt(fIdx, dummy.matrix);
          color.setHex(leafPalette[(tIdx + c) % leafPalette.length]);
          foliageMesh.setColorAt(fIdx, color);
        }
      });

      trunkMesh.instanceMatrix.needsUpdate = true;
      trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
      this.group.add(trunkMesh);

      boughMesh.instanceMatrix.needsUpdate = true;
      boughMesh.castShadow = true; boughMesh.receiveShadow = true;
      this.group.add(boughMesh);

      foliageMesh.instanceMatrix.needsUpdate = true;
      if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
      foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
      this.group.add(foliageMesh);
    }

    // ──────────────────────────────────────────────────────────────────
    // 2. Conifer Trees (Towering Pines & Snowpines)
    // - Towering mast trunk (height 24)
    // - 4 exposed lower radial whorl branches rooted to trunk
    // - 5 cascading tiered cone skirts reaching 28+ height
    // ──────────────────────────────────────────────────────────────────
    if (coniferTrees.length > 0) {
      const trunkHeight = 24.0, baseR = 1.15, topR = 0.22;
      const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 8);
      trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
      const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkPine, coniferTrees.length);

      const branchesPerTree = 4;
      const branchLength = 4.5, branchBaseR = 0.22, branchTipR = 0.08;
      const branchGeom = new THREE.CylinderGeometry(branchTipR, branchBaseR, branchLength, 5);
      branchGeom.translate(0, branchLength / 2, 0);
      const branchMesh = new THREE.InstancedMesh(branchGeom, barkPine, coniferTrees.length * branchesPerTree);

      const tiersPerTree = 5;
      const tierGeom = new THREE.ConeGeometry(1.0, 1.0, 8);
      tierGeom.translate(0, 0.5, 0); // Base of cone at 0
      const foliageMesh = new THREE.InstancedMesh(tierGeom, leafMat, coniferTrees.length * tiersPerTree);

      coniferTrees.forEach((item, tIdx) => {
        const { tree, scale, x, z, ground } = item;
        const seed = hash2(Math.round(x), Math.round(z), 0x91bb);
        const r = rngFrom(seed);
        const baseRotY = tree.rotY || (r() * Math.PI * 2);
        const sinkDepth = 0.85 * scale;
        const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

        // Mast Trunk: strictly upright, firmly sunk into slopes
        dummy.position.copy(trunkBasePos);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(tIdx, dummy.matrix);

        const trunkQuat = dummy.quaternion.clone();

        // Lower Radial Whorl Branches
        const branchHeights = [5.5, 7.2, 8.8, 10.4];
        for (let b = 0; b < branchesPerTree; b++) {
          const bAngle = (b * Math.PI * 0.5) + (r() - 0.5) * 0.2;
          const hAttach = branchHeights[b];
          const localRoot = new THREE.Vector3(
            Math.sin(bAngle) * 0.45,
            hAttach,
            Math.cos(bAngle) * 0.45
          );
          const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

          const pitch = 1.82 + (r() - 0.5) * 0.15; // droop slightly below horizontal
          const localDir = new THREE.Vector3(
            Math.sin(bAngle) * Math.sin(pitch),
            Math.cos(pitch),
            Math.cos(bAngle) * Math.sin(pitch)
          ).normalize();
          const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(worldRoot);
          dummy.quaternion.setFromUnitVectors(upVector, worldDir);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          branchMesh.setMatrixAt(tIdx * branchesPerTree + b, dummy.matrix);
        }

        // 5 Cascading Needle Skirts (bottom to spire)
        const leafPalette = palettes[tree.variant || 'pine'] || palettes.pine;
        const tierSpecs = [
          { yOffset: 9.5, radius: 5.6, height: 6.2 }, // lowest skirt
          { yOffset: 13.8, radius: 4.5, height: 5.8 },
          { yOffset: 17.8, radius: 3.5, height: 5.2 },
          { yOffset: 21.8, radius: 2.4, height: 4.6 },
          { yOffset: 25.5, radius: 1.3, height: 4.2 }, // top spire
        ];

        for (let tier = 0; tier < tiersPerTree; tier++) {
          const spec = tierSpecs[tier];
          dummy.position.set(x, ground - sinkDepth + spec.yOffset * scale, z);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(0, baseRotY + tier * 0.73, 0);
          dummy.scale.set(spec.radius * scale, spec.height * scale, spec.radius * scale);
          dummy.updateMatrix();

          const fIdx = tIdx * tiersPerTree + tier;
          foliageMesh.setMatrixAt(fIdx, dummy.matrix);
          color.setHex(leafPalette[(tIdx + tier) % leafPalette.length]);
          foliageMesh.setColorAt(fIdx, color);
        }
      });

      trunkMesh.instanceMatrix.needsUpdate = true;
      trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
      this.group.add(trunkMesh);

      branchMesh.instanceMatrix.needsUpdate = true;
      branchMesh.castShadow = true; branchMesh.receiveShadow = true;
      this.group.add(branchMesh);

      foliageMesh.instanceMatrix.needsUpdate = true;
      if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
      foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
      this.group.add(foliageMesh);
    }

    // ──────────────────────────────────────────────────────────────────
    // 3. Weeping Willow Trees (Riparian / Riverbank Giants)
    // - Muscular flared gnarled trunk (height 13.5) with olive bark
    // - 4 heavy spreading arching limbs
    // - 8 trailing vertical weeping frond drapes cascading downward
    // - 2 full crown dome clusters giving romantic silhouette
    // ──────────────────────────────────────────────────────────────────
    if (willowTrees.length > 0) {
      const trunkHeight = 14.5, baseR = 1.75, topR = 1.05;
      const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 9);
      trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
      const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkWillow, willowTrees.length);

      const limbsPerTree = 5;
      const limbLength = 8.8, limbBaseR = 0.52, limbTipR = 0.26;
      const limbGeom = new THREE.CylinderGeometry(limbTipR, limbBaseR, limbLength, 6);
      limbGeom.translate(0, limbLength / 2, 0);
      const limbMesh = new THREE.InstancedMesh(limbGeom, barkWillow, willowTrees.length * limbsPerTree);

      // Drooping switch branches extending from limbs
      const switchesPerTree = 5;
      const switchLength = 5.2, switchBaseR = 0.26, switchTipR = 0.12;
      const switchGeom = new THREE.CylinderGeometry(switchTipR, switchBaseR, switchLength, 5);
      switchGeom.translate(0, switchLength / 2, 0);
      const switchMesh = new THREE.InstancedMesh(switchGeom, barkWillow, willowTrees.length * switchesPerTree);

      // Weeping willow canopy: 3 crown umbrella domes + 15 cascading drooping foliage masses (NO cylinders)
      const crownsPerTree = 3;
      const crownGeom = new THREE.DodecahedronGeometry(4.4, 1);
      const crownMesh = new THREE.InstancedMesh(crownGeom, leafMat, willowTrees.length * crownsPerTree);

      const drapesPerTree = 15;
      const drapeGeom = new THREE.DodecahedronGeometry(3.2, 1);
      const drapeMesh = new THREE.InstancedMesh(drapeGeom, leafMat, willowTrees.length * drapesPerTree);

      willowTrees.forEach((item, tIdx) => {
        const { scale, x, z, ground } = item;
        const seed = hash2(Math.round(x), Math.round(z), 0x7177);
        const r = rngFrom(seed);
        const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
        const sinkDepth = 0.85 * scale;
        const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

        // Gnarled Trunk: strictly upright, firmly sunk into slopes
        dummy.position.copy(trunkBasePos);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(tIdx, dummy.matrix);

        const trunkQuat = dummy.quaternion.clone();

        // 5 Arching Umbrella Limbs
        const limbHeights = [8.2, 9.4, 10.6, 11.8, 12.8];
        const limbAngles = [0.2, 1.45, 2.7, 3.95, 5.2];
        const limbTips: { x: number; y: number; z: number }[] = [];
        const limbMids: { x: number; y: number; z: number }[] = [];

        for (let l = 0; l < limbsPerTree; l++) {
          const lAngle = limbAngles[l] + (r() - 0.5) * 0.12;
          const hAttach = limbHeights[l];
          const t = hAttach / trunkHeight;
          const rTrunk = baseR + (topR - baseR) * t;

          const localRoot = new THREE.Vector3(
            Math.sin(lAngle) * (rTrunk * 0.45),
            hAttach,
            Math.cos(lAngle) * (rTrunk * 0.45)
          );
          const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

          // Sweeping outward-arching pitch (~60 deg)
          const pitch = 1.05 + (r() - 0.5) * 0.12;
          const localDir = new THREE.Vector3(
            Math.sin(lAngle) * Math.sin(pitch),
            Math.cos(pitch),
            Math.cos(lAngle) * Math.sin(pitch)
          ).normalize();
          const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(worldRoot);
          dummy.quaternion.setFromUnitVectors(upVector, worldDir);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          limbMesh.setMatrixAt(tIdx * limbsPerTree + l, dummy.matrix);

          const midPt = {
            x: worldRoot.x + worldDir.x * (limbLength * 0.55 * scale),
            y: worldRoot.y + worldDir.y * (limbLength * 0.55 * scale),
            z: worldRoot.z + worldDir.z * (limbLength * 0.55 * scale),
          };
          const tipPt = {
            x: worldRoot.x + worldDir.x * (limbLength * scale),
            y: worldRoot.y + worldDir.y * (limbLength * scale),
            z: worldRoot.z + worldDir.z * (limbLength * scale),
          };
          limbMids.push(midPt);
          limbTips.push(tipPt);

          // Drooping switch branch angling downward from mid-limb
          const switchPitch = 1.82 + (r() - 0.5) * 0.14; // curving downward below horizontal
          const localSwitchDir = new THREE.Vector3(
            Math.sin(lAngle + 0.15) * Math.sin(switchPitch),
            Math.cos(switchPitch),
            Math.cos(lAngle + 0.15) * Math.sin(switchPitch)
          ).normalize();
          const worldSwitchDir = localSwitchDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.set(midPt.x, midPt.y, midPt.z);
          dummy.quaternion.setFromUnitVectors(upVector, worldSwitchDir);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          switchMesh.setMatrixAt(tIdx * switchesPerTree + l, dummy.matrix);
        }

        const willowPalette = palettes.willow;

        // 3 Overarching Crown Umbrella Domes
        for (let c = 0; c < crownsPerTree; c++) {
          const cAngle = baseRotY + c * 2.1;
          const cx = x + Math.sin(cAngle) * 1.8 * scale;
          const cy = ground - sinkDepth + (16.2 + c * 1.2) * scale;
          const cz = z + Math.cos(cAngle) * 1.8 * scale;

          dummy.position.set(cx, cy, cz);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set((r() - 0.5) * 0.15, cAngle, (r() - 0.5) * 0.15);
          dummy.scale.set(scale * 1.25, scale * 0.92, scale * 1.25);
          dummy.updateMatrix();

          const cIdx = tIdx * crownsPerTree + c;
          crownMesh.setMatrixAt(cIdx, dummy.matrix);
          color.setHex(willowPalette[(tIdx + c) % willowPalette.length]);
          crownMesh.setColorAt(cIdx, color);
        }

        // 15 Cascading Weeping Foliage Masses (3 cascading draped clusters per limb)
        for (let l = 0; l < limbsPerTree; l++) {
          const mid = limbMids[l];
          const tip = limbTips[l];

          // 1. Upper limb cluster (broad soft rounded canopy mass)
          const idx1 = tIdx * drapesPerTree + (l * 3 + 0);
          dummy.position.set(mid.x, mid.y + 0.6 * scale, mid.z);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(r() * 0.4, baseRotY + l * 1.2, r() * 0.4);
          dummy.scale.set(scale * 1.15, scale * 1.2, scale * 1.15);
          dummy.updateMatrix();
          drapeMesh.setMatrixAt(idx1, dummy.matrix);
          color.setHex(willowPalette[(tIdx + l) % willowPalette.length]);
          drapeMesh.setColorAt(idx1, color);

          // 2. Outer bough drooping drape mass (vertically stretched weeping cluster)
          const idx2 = tIdx * drapesPerTree + (l * 3 + 1);
          dummy.position.set(tip.x, tip.y - 0.4 * scale, tip.z);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(r() * 0.3, baseRotY + l * 1.2 + 0.5, r() * 0.3);
          dummy.scale.set(scale * 1.1, scale * 1.45, scale * 1.1);
          dummy.updateMatrix();
          drapeMesh.setMatrixAt(idx2, dummy.matrix);
          color.setHex(willowPalette[(tIdx + l + 1) % willowPalette.length]);
          drapeMesh.setColorAt(idx2, color);

          // 3. Lower hanging weeping drape (cascades downward towards the ground)
          const idx3 = tIdx * drapesPerTree + (l * 3 + 2);
          dummy.position.set(
            tip.x + (mid.x - tip.x) * 0.25,
            tip.y - 3.2 * scale,
            tip.z + (mid.z - tip.z) * 0.25
          );
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(r() * 0.25, baseRotY + l * 1.2 + 1.1, r() * 0.25);
          dummy.scale.set(scale * 0.95, scale * 1.6, scale * 0.95);
          dummy.updateMatrix();
          drapeMesh.setMatrixAt(idx3, dummy.matrix);
          color.setHex(willowPalette[(tIdx + l + 2) % willowPalette.length]);
          drapeMesh.setColorAt(idx3, color);
        }
      });

      trunkMesh.instanceMatrix.needsUpdate = true;
      trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
      this.group.add(trunkMesh);

      limbMesh.instanceMatrix.needsUpdate = true;
      limbMesh.castShadow = true; limbMesh.receiveShadow = true;
      this.group.add(limbMesh);

      switchMesh.instanceMatrix.needsUpdate = true;
      switchMesh.castShadow = true; switchMesh.receiveShadow = true;
      this.group.add(switchMesh);

      crownMesh.instanceMatrix.needsUpdate = true;
      if (crownMesh.instanceColor) crownMesh.instanceColor.needsUpdate = true;
      crownMesh.castShadow = true; crownMesh.receiveShadow = true;
      this.group.add(crownMesh);

      drapeMesh.instanceMatrix.needsUpdate = true;
      if (drapeMesh.instanceColor) drapeMesh.instanceColor.needsUpdate = true;
      drapeMesh.castShadow = true; drapeMesh.receiveShadow = true;
      this.group.add(drapeMesh);
    }

    // ──────────────────────────────────────────────────────────────────
    // 4. Silver Paper Birch Trees (Slender Light-Dappled Canopy)
    // - Slender tall chalk-white trunk (height 20) with dark lenticels
    // - 4 high steep ascending boughs
    // - 6 airy fluttering golden-lime canopy clouds
    // ──────────────────────────────────────────────────────────────────
    if (birchTrees.length > 0) {
      const trunkHeight = 20.0, baseR = 0.65, topR = 0.22;
      const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 8);
      trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
      const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkBirch, birchTrees.length);

      const boughsPerTree = 4;
      const boughLength = 6.8, boughBaseR = 0.24, boughTipR = 0.1;
      const boughGeom = new THREE.CylinderGeometry(boughTipR, boughBaseR, boughLength, 5);
      boughGeom.translate(0, boughLength / 2, 0);
      const boughMesh = new THREE.InstancedMesh(boughGeom, barkBirch, birchTrees.length * boughsPerTree);

      const foliagePerTree = 6;
      const foliageGeom = new THREE.DodecahedronGeometry(2.8, 1);
      const foliageMesh = new THREE.InstancedMesh(foliageGeom, leafMat, birchTrees.length * foliagePerTree);

      birchTrees.forEach((item, tIdx) => {
        const { scale, x, z, ground } = item;
        const seed = hash2(Math.round(x), Math.round(z), 0xb12c);
        const r = rngFrom(seed);
        const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
        const sinkDepth = 0.85 * scale;
        const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

        // Slender White Trunk: strictly upright, sunk into ground
        dummy.position.copy(trunkBasePos);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(tIdx, dummy.matrix);

        const trunkQuat = dummy.quaternion.clone();

        // 4 Ascending Boughs
        const attachHeights = [12.5, 14.2, 15.8, 17.2];
        const boughAngles = [0.5, 2.0, 3.6, 5.2];
        const boughTips: { x: number; y: number; z: number }[] = [];

        for (let b = 0; b < boughsPerTree; b++) {
          const bAngle = boughAngles[b] + (r() - 0.5) * 0.15;
          const hAttach = attachHeights[b];
          const t = hAttach / trunkHeight;
          const rTrunk = baseR + (topR - baseR) * t;

          const localRoot = new THREE.Vector3(
            Math.sin(bAngle) * (rTrunk * 0.45),
            hAttach,
            Math.cos(bAngle) * (rTrunk * 0.45)
          );
          const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

          const pitch = 0.55 + (r() - 0.5) * 0.12; // steep upward angle (~32 deg)
          const localDir = new THREE.Vector3(
            Math.sin(bAngle) * Math.sin(pitch),
            Math.cos(pitch),
            Math.cos(bAngle) * Math.sin(pitch)
          ).normalize();
          const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(worldRoot);
          dummy.quaternion.setFromUnitVectors(upVector, worldDir);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          boughMesh.setMatrixAt(tIdx * boughsPerTree + b, dummy.matrix);

          boughTips.push({
            x: worldRoot.x + worldDir.x * (boughLength * scale),
            y: worldRoot.y + worldDir.y * (boughLength * scale),
            z: worldRoot.z + worldDir.z * (boughLength * scale),
          });
        }

        // Fluttering Birch Foliage
        const birchPalette = palettes.birch;
        for (let c = 0; c < foliagePerTree; c++) {
          let cx = x, cy = ground - sinkDepth + 23.5 * scale, cz = z, cSize = 1.0;
          if (c < 4) {
            cx = boughTips[c].x;
            cy = boughTips[c].y + 0.6 * scale;
            cz = boughTips[c].z;
            cSize = 1.05;
          } else if (c === 4) {
            cx = x;
            cy = ground - sinkDepth + 24.2 * scale;
            cz = z;
            cSize = 1.2;
          } else {
            cx = x + Math.sin(baseRotY + 1.2) * 2.2 * scale;
            cy = ground - sinkDepth + 19.5 * scale;
            cz = z + Math.cos(baseRotY + 1.2) * 2.2 * scale;
            cSize = 1.0;
          }

          dummy.position.set(cx, cy, cz);
          dummy.quaternion.set(0, 0, 0, 1);
          dummy.rotation.set(r() * 0.5, baseRotY + c * 0.9, r() * 0.5);
          dummy.scale.set(cSize * scale * (0.95 + r() * 0.2), cSize * scale * 0.85, cSize * scale * (0.95 + r() * 0.2));
          dummy.updateMatrix();

          const fIdx = tIdx * foliagePerTree + c;
          foliageMesh.setMatrixAt(fIdx, dummy.matrix);
          color.setHex(birchPalette[(tIdx + c) % birchPalette.length]);
          foliageMesh.setColorAt(fIdx, color);
        }
      });

      trunkMesh.instanceMatrix.needsUpdate = true;
      trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
      this.group.add(trunkMesh);

      boughMesh.instanceMatrix.needsUpdate = true;
      boughMesh.castShadow = true; boughMesh.receiveShadow = true;
      this.group.add(boughMesh);

      foliageMesh.instanceMatrix.needsUpdate = true;
      if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
      foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
      this.group.add(foliageMesh);
    }

    // ──────────────────────────────────────────────────────────────────
    // 5. Dead Snag Trees (Charred / Blighted Deadlands)
    // - Gnarly broken trunk (height 17.5) with lean and pale/charred bark
    // - 4 fractured jagged dead limbs rooted inside trunk with splintered ends
    // ──────────────────────────────────────────────────────────────────
    if (deadTrees.length > 0) {
      const trunkHeight = 17.5, baseR = 1.35, topR = 0.45;
      const deadTrunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 7);
      deadTrunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
      const deadTrunkMesh = new THREE.InstancedMesh(deadTrunkGeom, barkDead, deadTrees.length);

      const limbsPerTree = 4;
      const limbLength = 6.8, limbBaseR = 0.38, limbTipR = 0.12;
      const limbGeom = new THREE.CylinderGeometry(limbTipR, limbBaseR, limbLength, 5);
      limbGeom.translate(0, limbLength / 2, 0);
      const deadLimbMesh = new THREE.InstancedMesh(limbGeom, barkDead, deadTrees.length * limbsPerTree);

      const stubsPerTree = 4;
      const stubLength = 3.2, stubBaseR = 0.22, stubTipR = 0.08;
      const stubGeom = new THREE.CylinderGeometry(stubTipR, stubBaseR, stubLength, 4);
      stubGeom.translate(0, stubLength / 2, 0);
      const deadStubMesh = new THREE.InstancedMesh(stubGeom, barkDead, deadTrees.length * stubsPerTree);

      deadTrees.forEach((item, tIdx) => {
        const { scale, x, z, ground } = item;
        const seed = hash2(Math.round(x), Math.round(z), 0xdead);
        const r = rngFrom(seed);
        const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
        const lean = 0.12 + (r() - 0.5) * 0.08;
        const sinkDepth = 0.85 * scale;
        const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

        // Snag main trunk with natural lean, securely sunk into slopes
        dummy.position.copy(trunkBasePos);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(Math.sin(baseRotY) * lean, baseRotY, Math.cos(baseRotY) * lean);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        deadTrunkMesh.setMatrixAt(tIdx, dummy.matrix);

        // Capture exact trunk orientation so branches root seamlessly into leaning trunk
        const trunkQuat = dummy.quaternion.clone();

        // Fractured dead boughs rooted into leaning trunk
        const attachHeights = [7.5, 9.8, 12.2, 14.5];
        for (let l = 0; l < limbsPerTree; l++) {
          const lAngle = l * 1.6 + (r() - 0.5) * 0.25;
          const hAttach = attachHeights[l];
          const t = hAttach / trunkHeight;
          const rTrunk = baseR + (topR - baseR) * t;

          // Local anchor inside the trunk core
          const localRoot = new THREE.Vector3(
            Math.sin(lAngle) * (rTrunk * 0.35),
            hAttach,
            Math.cos(lAngle) * (rTrunk * 0.35)
          );
          // Transform by trunkQuat so it is 100% attached to the actual tilted trunk!
          const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

          const pitch = 0.95 + (r() - 0.5) * 0.28;
          const localDir = new THREE.Vector3(
            Math.sin(lAngle) * Math.sin(pitch),
            Math.cos(pitch),
            Math.cos(lAngle) * Math.sin(pitch)
          ).normalize();
          const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(worldRoot);
          dummy.quaternion.setFromUnitVectors(upVector, worldDir);
          dummy.scale.set(scale * 0.95, scale * (0.85 + r() * 0.3), scale * 0.95);
          dummy.updateMatrix();
          deadLimbMesh.setMatrixAt(tIdx * limbsPerTree + l, dummy.matrix);

          // Fractured splinter stub branching off from the dead limb
          const forkOrigin = worldRoot.clone().add(worldDir.clone().multiplyScalar(limbLength * 0.52 * scale));
          const forkPitch = pitch + 0.45;
          const localForkDir = new THREE.Vector3(
            Math.sin(lAngle + 0.8) * Math.sin(forkPitch),
            Math.cos(forkPitch),
            Math.cos(lAngle + 0.8) * Math.sin(forkPitch)
          ).normalize();
          const worldForkDir = localForkDir.clone().applyQuaternion(trunkQuat).normalize();

          dummy.position.copy(forkOrigin);
          dummy.quaternion.setFromUnitVectors(upVector, worldForkDir);
          dummy.scale.set(scale * 0.8, scale * 0.75, scale * 0.8);
          dummy.updateMatrix();
          deadStubMesh.setMatrixAt(tIdx * stubsPerTree + l, dummy.matrix);
        }
      });

      deadTrunkMesh.instanceMatrix.needsUpdate = true;
      deadTrunkMesh.castShadow = true; deadTrunkMesh.receiveShadow = true;
      this.group.add(deadTrunkMesh);

      deadLimbMesh.instanceMatrix.needsUpdate = true;
      deadLimbMesh.castShadow = true; deadLimbMesh.receiveShadow = true;
      this.group.add(deadLimbMesh);

      deadStubMesh.instanceMatrix.needsUpdate = true;
      deadStubMesh.castShadow = true; deadStubMesh.receiveShadow = true;
      this.group.add(deadStubMesh);
    }
  }

  private buildTownBuilding(prop: PropDef, x: number, z: number) {
    const style: Record<string, { wall: number; roof: number; trim: number }> = {
      inn: { wall: 0x76553b, roof: 0x49302a, trim: 0xb69558 },
      general_store: { wall: 0x796446, roof: 0x564037, trim: 0xc1a96c },
      smithy: { wall: 0x554943, roof: 0x3b3331, trim: 0xa37842 },
      healer: { wall: 0x687055, roof: 0x4c5946, trim: 0xb3a879 },
      house: { wall: 0x66594a, roof: 0x4b3831, trim: 0x8e7654 },
    };
    const palette = style[prop.variant || 'house'] || style.house;
    const width = (prop.width || 5) * CELL * 0.82;
    const depth = (prop.depth || 5) * CELL * 0.82;
    const ground = this.terrainHeightAt(x, z);
    const group = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 8.5, depth), new THREE.MeshStandardMaterial({
      color: palette.wall, roughness: 0.94,
    }));
    wall.position.y = 4.25; wall.castShadow = true; wall.receiveShadow = true; group.add(wall);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.98 });
    for (const side of [-1, 1]) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.7, depth + 1.4), roofMaterial);
      roof.position.set(side * width * 0.245, 10.7, 0);
      roof.rotation.z = -side * 0.47;
      roof.castShadow = true; roof.receiveShadow = true; group.add(roof);
    }
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-width / 2, 8.4);
    gableShape.lineTo(width / 2, 8.4);
    gableShape.lineTo(0, 13.1);
    gableShape.closePath();
    const gableMaterial = new THREE.MeshStandardMaterial({
      color: palette.wall, roughness: 0.96, side: THREE.DoubleSide,
    });
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), gableMaterial);
    for (const side of [-1, 1]) {
      const end = gable.clone();
      end.position.z = side * (depth / 2 - 0.08);
      group.add(end);
    }
    const trim = new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 0.92 });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.65, 8.4, 0.65), trim);
      post.position.set(side * (width / 2 - 0.5), 4.2, depth / 2 + 0.12);
      post.castShadow = true; group.add(post);
      const brace = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 0.38), trim);
      brace.position.set(side * (width / 2 - 1.6), 7.5, depth / 2 + 0.14);
      brace.rotation.z = side * -0.45; group.add(brace);
    }
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.42, 0.42), trim);
    fascia.position.set(0, 8.35, depth / 2 + 0.15); group.add(fascia);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, 0.24), getMaterial('wood', 0));
    door.position.set(0, 2.6, depth / 2 + 0.14); group.add(door);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xf0b557, emissive: 0xa84d1d, emissiveIntensity: 0.65 });
    for (const side of [-1, 1]) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.55, 0.22), windowMat);
      window.position.set(side * width * 0.27, 5.5, depth / 2 + 0.13); group.add(window);
    }
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.6, 2.4), getMaterial('bone', 0));
    chimney.position.set(width * 0.29, 11.4, -depth * 0.22);
    chimney.castShadow = true; chimney.receiveShadow = true; group.add(chimney);
    group.position.set(x, ground, z);
    group.rotation.y = prop.rotY || 0;
    this.group.add(group);
    const halfWidth = (prop.rotY && Math.abs(Math.sin(prop.rotY)) > 0.5 ? depth : width) * 0.44;
    const halfDepth = (prop.rotY && Math.abs(Math.sin(prop.rotY)) > 0.5 ? width : depth) * 0.44;
    this.colliders.push({
      x1: x - halfWidth, z1: z - halfDepth,
      x2: x + halfWidth, z2: z + halfDepth, yMin: 0, yMax: 12,
    });
  }

  private buildTownWell(x: number, z: number) {
    const group = new THREE.Group(), stone = getMaterial('bone', 0), wood = getMaterial('wood', 0);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 1.5, 12), stone);
    ring.position.y = 0.75; ring.castShadow = true; group.add(ring);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.75, 16), new THREE.MeshStandardMaterial({
      color: 0x355860, roughness: 0.28,
    }));
    water.rotation.x = -Math.PI / 2; water.position.y = 1.52; group.add(water);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.5), wood);
      post.position.set(side * 2.3, 2.25, 0); group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 0.55), wood);
    beam.position.y = 4.3; group.add(beam);
    group.position.set(x, this.terrainHeightAt(x, z), z);
    this.group.add(group);
  }

  private buildStreetLantern(x: number, z: number) {
    const group = new THREE.Group();
    const iron = getMaterial('iron', 0), glass = new THREE.MeshStandardMaterial({
      color: 0xe0a651, emissive: 0xe58b32, emissiveIntensity: 1.1,
    });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 7, 7), iron);
    post.position.y = 3.5; post.castShadow = true; group.add(post);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 1.2), glass);
    lamp.position.y = 7.2; group.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 6), iron);
    cap.position.y = 8.2; group.add(cap);
    group.position.set(x, this.terrainHeightAt(x, z), z);
    this.group.add(group);
  }

  private buildCaveMouth(x: number, z: number) {
    const group = new THREE.Group(), stone = getMaterial('bone', 0);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(4.3, 12), new THREE.MeshBasicMaterial({
      color: 0x090b0b, side: THREE.DoubleSide,
    }));
    mouth.position.set(0, 4.2, 0.2); group.add(mouth);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4, 1.15, 7, 12, Math.PI), stone);
    arch.position.set(0, 4.2, 0); group.add(arch);
    const rockMat = this.makeRockMaterial();
    for (const side of [-1, 1]) {
      const rock = new THREE.Mesh(this.makeRockGeometry('angular'), rockMat);
      rock.position.set(side * 4.2, 1.5, 0); rock.scale.set(2.2, 2.4, 2.6);
      rock.castShadow = true; group.add(rock);
    }
    group.position.set(x, this.terrainHeightAt(x, z), z);
    this.group.add(group);
  }

  private buildExits(map: MapDef) {
    const stone = getMaterial('bone', 0);
    for (const exit of map.exits || []) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.35, 8), stone);
      base.position.y = 0.2;
      base.receiveShadow = true;
      g.add(base);
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.8, 1.1), stone);
        pillar.position.set(side * 1.7, 2.4, 0);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        g.add(pillar);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.9, 1.3), stone);
      lintel.position.y = 4.75;
      lintel.castShadow = true;
      g.add(lintel);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.13, 8, 28), EXIT_FRAME);
      ring.position.set(0, 2.55, 0.28);
      g.add(ring);
      const veil = new THREE.Mesh(new THREE.CircleGeometry(1.2, 28), EXIT_VEIL);
      veil.position.set(0, 2.55, 0.3);
      g.add(veil);
      g.position.set(exit.x * CELL, 0, exit.z * CELL);
      this.group.add(g);
    }
  }

  private scatter(items: ScatterItem[], geo: THREE.BufferGeometry, mat: THREE.Material) {
    if (!items.length) return;
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      d.position.set(it.x, it.y, it.z);
      if (it.quat) {
        d.quaternion.copy(it.quat);
      } else {
        d.rotation.set(it.rx, it.ry, it.rz);
      }
      d.scale.setScalar(it.s);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      col.setRGB(it.r, it.g, it.b);
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.group.add(mesh);
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
    for (const c of this.colliders) {
      if (c.decor || c.yMin > 5.5 || c.yMax < 0.5) continue;
      const px = Math.max(c.x1, Math.min(x, c.x2));
      const pz = Math.max(c.z1, Math.min(z, c.z2));
      let dx = x - px, dz = z - pz;
      let d = Math.sqrt(dx * dx + dz * dz);
      if (d < r) {
        if (d > 0.0001) { x = px + (dx / d) * r; z = pz + (dz / d) * r; }
        else {
          const l = Math.abs(x - c.x1), rr = Math.abs(c.x2 - x), t = Math.abs(z - c.z1), b = Math.abs(c.z2 - z);
          const m = Math.min(l, rr, t, b);
          if (m === l) x = c.x1 - r; else if (m === rr) x = c.x2 + r;
          else if (m === t) z = c.z1 - r; else z = c.z2 + r;
        }
      }
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
