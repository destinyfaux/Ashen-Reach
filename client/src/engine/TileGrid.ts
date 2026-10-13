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
}

export class TileGrid {
  private eng: Engine;
  private group = new THREE.Group();
  private areaTiles!: AreaTileSet;
  private sourceMap: MapDef | null = null;
  private doorLeaves = new Map<number, THREE.Group>();
  private doorAnimations = new Map<number, { target: number }>();
  private waterMaterial: THREE.ShaderMaterial | null = null;
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
    if (this.waterMaterial) this.waterMaterial.uniforms.uTime.value += dt;
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
    for (const h of map.cells.halfTiles || []) {
      if (h.type === 'road') roadSet.add(this.key(h.x, h.z));
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

    const heights = map.terrain?.heightFt || [];
    const terrainWidth = map.terrain?.width || 0;
    const fallbackHeight = (x: number, z: number) =>
      terrainWidth ? heights[z * terrainWidth + x] || 0 : 0;
    const surfaceLevels = map.cells.waterSurfaceFt || [];
    const levelAtCell = (x: number, z: number) => {
      const level = surfaceLevels[z * map.size.w + x];
      return typeof level === 'number' ? level : fallbackHeight(x, z) + 0.28;
    };

    const wet = new Set<number>();
    for (const u of units) wet.add(this.key(u.x, u.z));

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

          const cellX = Math.min(map.size.w - 1, Math.max(0, Math.floor(vx)));
          const cellZ = Math.min(map.size.h - 1, Math.max(0, Math.floor(vz)));
          const surface = levelAtCell(cellX, cellZ);
          const ground = fallbackHeight(vx, vz);

          let touchesDry = false;
          for (const [cx, cz] of [[vx - 1, vz - 1], [vx, vz - 1], [vx - 1, vz], [vx, vz]]) {
            if (cx < 0 || cz < 0 || cx >= map.size.w || cz >= map.size.h || !wet.has(this.key(cx, cz))) {
              touchesDry = true;
            }
          }
          if (orientation) touchesDry = true;

          positions[at + 1] = touchesDry ? Math.min(surface, ground - 0.12) : surface;
          indices[vIdx] = vIdx;
          vIdx++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = cameraPosition - world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        float hash21(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float waterNoise(vec2 p) {
          vec2 cell = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), f.x),
            mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0, 1.0)), f.x), f.y);
        }
        float waterCells(vec2 p) {
          vec2 cell = floor(p), f = fract(p);
          float nearest = 2.0, nextNearest = 2.0;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 point = offset + 0.5 + 0.32 * sin(6.28318 * hash21(cell + offset));
            float distanceToPoint = length(point - f);
            if (distanceToPoint < nearest) {
              nextNearest = nearest;
              nearest = distanceToPoint;
            } else if (distanceToPoint < nextNearest) {
              nextNearest = distanceToPoint;
            }
          }
          return nextNearest - nearest;
        }
        void main() {
          vec2 p = vWorld.xz;
          vec2 flow = vec2(uTime * 0.035, -uTime * 0.021);
          float broad = waterNoise(p * 0.12 + flow);
          float fine = waterNoise(p * 0.31 - flow.yx * 1.4);
          float cells = waterCells(p * 0.095 + flow * 0.45);
          float edge = 1.0 - smoothstep(0.025, 0.11, cells);
          float swell = 0.5 + 0.5 * sin(p.x * 0.16 +
            sin(p.y * 0.1 + uTime * 0.24) + uTime * 0.35);
          float pattern = clamp(broad * 0.27 + fine * 0.16 + swell * 0.57, 0.0, 1.0);
          float fresnel = pow(1.0 - max(dot(normalize(vViewDirection), vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
          vec3 deep = vec3(0.012, 0.05, 0.065);
          vec3 middle = vec3(0.035, 0.12, 0.13);
          vec3 light = vec3(0.12, 0.23, 0.19);
          vec3 color = mix(deep, middle, smoothstep(0.22, 0.65, pattern));
          color = mix(color, light, smoothstep(0.72, 0.94, pattern) * 0.62 + fresnel * 0.14);
          color = mix(color, deep * 0.8, edge * 0.12);
          float ripple = 0.5 + 0.5 * sin(p.x * 0.24 +
            sin(p.y * 0.08 + uTime * 0.18) * 1.2 + uTime * 0.28);
          float rippleLine = smoothstep(0.86, 0.98, ripple) * (0.65 + broad * 0.35);
          color += vec3(0.08, 0.12, 0.09) * rippleLine * (0.14 + fresnel * 0.22);
          gl_FragColor = vec4(color, 0.96);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: false, depthWrite: true, side: THREE.DoubleSide,
    });
    this.waterMaterial.toneMapped = true;
    this.waterMaterial.uniforms.uTime.value = 0;
    this.waterMaterial.needsUpdate = true;
    this.waterMaterial.defines = { USE_UV: '' };
    const water = new THREE.Mesh(geometry, this.waterMaterial);
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
        const shape = p.shape || (p.type === 'boulder' ? 'angular' : 'slab');
        const batch = natureRocks.get(shape) || [];
        batch.push({
          x, y: ground + scale * 0.45, z, s: scale,
          rx: r() * 0.3, ry: p.rotY || r() * Math.PI, rz: r() * 0.3,
          r: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.78 : 0.62 + r() * 0.25,
          g: p.variant === 'deadlands' ? 0.39 + r() * 0.16 : 0.58 + r() * 0.25,
          b: p.variant === 'snowfield' || p.variant === 'snow_forest' ? 0.86 : 0.5 + r() * 0.24,
        });
        natureRocks.set(shape, batch);

        if (p.type === 'boulder') {
          const radius = Math.max(1, scale * 0.8);
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
            pebbleCluster.push({
              x: px, y: pGround + pScale * 0.32, z: pz, s: pScale,
              rx: r() * 3, ry: r() * 3, rz: r() * 3,
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
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.8), wood);
        bridge.position.set(x, this.terrainHeightAt(x, z) + 0.45, z);
        bridge.rotation.y = p.rotY || 0;
        bridge.receiveShadow = true;
        bridge.castShadow = true;
        this.group.add(bridge);
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

          if (pScale > 0.42) {
            const shape = hash2(kSeed, 89, 4013) > 0.5 ? 'talus' : 'angular';
            const batch = natureRocks.get(shape) || [];
            batch.push({
              x: px, y: ground + pScale * 0.35, z: pz, s: pScale,
              rx: rotX, ry: rotY, rz: rotZ,
              r: rCol, g: gCol, b: bCol,
            });
            natureRocks.set(shape, batch);
          } else {
            pebbleCluster.push({
              x: px, y: ground + pScale * 0.28, z: pz, s: pScale,
              rx: rotX, ry: rotY, rz: rotZ,
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
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3c27, roughness: 0.96 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94 });
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.78, 7, 7), trunkMat, trees.length);
    const trunks = new THREE.Object3D();
    const trunkColor = new THREE.Color();
    const canopies = new Map<string, PropDef[]>();
    const palettes: Record<string, number[]> = {
      oak: [0x586a3e, 0x697b48, 0x52623b], pine: [0x354d40, 0x425d49, 0x30473b],
      ash: [0x646a46, 0x77734b, 0x526143], snowpine: [0x71867d, 0x91a69c, 0x607c75],
      dead: [0x665043],
    };
    const height = (tree: PropDef) => (tree.scale || 1) * (tree.variant === 'dead' ? 1.2 : 1);
    trees.forEach((tree, index) => {
      const x = tree.x * CELL, z = tree.z * CELL, scale = height(tree);
      const ground = this.terrainHeightAt(x, z);
      trunks.position.set(x, ground + 3.5 * scale, z);
      trunks.rotation.set(0, tree.rotY || 0, tree.variant === 'dead' ? 0.05 : 0);
      trunks.scale.setScalar(scale);
      trunks.updateMatrix();
      trunk.setMatrixAt(index, trunks.matrix);
      const colors = palettes[tree.variant || 'oak'] || palettes.oak;
      trunkColor.setHex(colors[index % colors.length]);
      trunk.setColorAt(index, trunkColor);
      if (tree.variant !== 'dead') {
        const variant = tree.variant === 'snowpine' ? 'snowpine' : tree.variant === 'pine' ? 'pine' : 'oak';
        const batch = canopies.get(variant) || [];
        batch.push(tree);
        canopies.set(variant, batch);
      }
      const radius = Math.max(1.1, scale * 0.85);
      this.colliders.push({ x1: x - radius, z1: z - radius, x2: x + radius, z2: z + radius, yMin: 0, yMax: 7 * scale });
    });
    trunk.instanceMatrix.needsUpdate = true;
    if (trunk.instanceColor) trunk.instanceColor.needsUpdate = true;
    trunk.castShadow = true; trunk.receiveShadow = true;
    this.group.add(trunk);

    for (const [variant, batch] of canopies) {
      const pine = variant === 'pine' || variant === 'snowpine';
      const layers = pine ? 1 : 5;
      const geometry = pine
        ? new THREE.ConeGeometry(3.7, 11, 8, 1)
        : new THREE.SphereGeometry(1, 9, 7);
      const mesh = new THREE.InstancedMesh(geometry, leafMat, batch.length * layers);
      const object = new THREE.Object3D();
      const color = new THREE.Color();
      batch.forEach((tree, treeIndex) => {
        const scale = height(tree), x = tree.x * CELL, z = tree.z * CELL;
        const options = palettes[variant] || palettes.oak;
        const baseY = this.terrainHeightAt(x, z);
        for (let layer = 0; layer < layers; layer++) {
          if (pine) {
            object.position.set(x, baseY + 10.5 * scale, z);
            object.rotation.set(0, tree.rotY || 0, 0);
            object.scale.set(scale, scale, scale);
          } else {
            const offsets: [number, number, number, number][] = [
              [0, 0, 0, 2.6], [-2.3, 0.8, 0.2, 2.05], [2.2, 0.7, -0.2, 2.05],
              [0, 0.6, 2.25, 2.0], [0.2, 0.9, -2.2, 2.0],
            ];
            const [ox, oy, oz, size] = offsets[layer];
            object.position.set(x + ox * scale, baseY + (8.3 + oy) * scale, z + oz * scale);
            object.rotation.set(0, (tree.rotY || 0) + layer * 0.61, 0);
            object.scale.set(size * scale, (size + 0.25) * scale, size * scale);
          }
          object.updateMatrix();
          const index = treeIndex * layers + layer;
          mesh.setMatrixAt(index, object.matrix);
          color.setHex(options[(treeIndex + layer) % options.length]);
          mesh.setColorAt(index, color);
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh);
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
      d.rotation.set(it.rx, it.ry, it.rz);
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
