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
import type { MapDef, PropDef, WallSeg } from './types';
import type { DoorState } from '../game/store';
import { useGame } from '../game/store';
import { getAreaTileSet, getMaterial, getTextureSet, hash2, rngFrom } from './materials';
import type { AreaTileSet } from './materials';
import { glowSprite } from './sprites';

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
    for (const [x, z] of map.cells.wall) wallSet.add(this.key(x, z));
    const blockedSet = new Set(wallSet);
    for (const [x, z] of map.cells.water || []) blockedSet.add(this.key(x, z));
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      this.open[z * W + x] = blockedSet.has(this.key(x, z)) ? 0 : 1;
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
    const cells = map.cells.water || [];
    if (!cells.length) return;
    const positions = new Float32Array(cells.length * 4 * 3);
    const indices = new Uint32Array(cells.length * 6);
    const heights = map.terrain?.heightFt || [];
    const terrainWidth = map.terrain?.width || 0;
    for (let i = 0; i < cells.length; i++) {
      const [x, z] = cells[i], vertex = i * 4, index = i * 6;
      const corners = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
      for (let c = 0; c < 4; c++) {
        const [cx, cz] = corners[c];
        const ground = terrainWidth ? heights[cz * terrainWidth + cx] || 0 : 0;
        const at = (vertex + c) * 3;
        positions[at] = cx * CELL;
        positions[at + 1] = ground + 0.22;
        positions[at + 2] = cz * CELL;
      }
      indices.set([vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3], index);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    const surfaceLevels = map.cells.waterSurfaceFt || [];
    const wet = new Set(cells.map(([x, z]) => this.key(x, z)));
    const fallbackHeight = (x: number, z: number) =>
      terrainWidth ? heights[z * terrainWidth + x] || 0 : 0;
    const levelAtCell = (x: number, z: number) => {
      const level = surfaceLevels[z * map.size.w + x];
      return typeof level === 'number' ? level : fallbackHeight(x, z) + 0.28;
    };
    for (let i = 0; i < cells.length; i++) {
      const [x, z] = cells[i], vertex = i * 4;
      const corners = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
      for (let corner = 0; corner < 4; corner++) {
        const [vx, vz] = corners[corner];
        let total = 0, count = 0, shoreline = false;
        for (const [cx, cz] of [[vx - 1, vz - 1], [vx, vz - 1], [vx - 1, vz], [vx, vz]]) {
          if (cx < 0 || cz < 0 || cx >= map.size.w || cz >= map.size.h ||
              !wet.has(this.key(cx, cz))) continue;
          total += levelAtCell(cx, cz);
          count++;
          if ([[cx - 1, cz], [cx + 1, cz], [cx, cz - 1], [cx, cz + 1]]
            .some(([nx, nz]) => nx < 0 || nz < 0 || nx >= map.size.w || nz >= map.size.h ||
              !wet.has(this.key(nx, nz)))) shoreline = true;
        }
        if (count) {
          const ground = heights[vz * terrainWidth + vx] || 0;
          const surface = total / count;
          positions[(vertex + corner) * 3 + 1] = shoreline ? Math.min(surface, ground - 0.12) : surface;
        }
      }
    }
    geometry.attributes.position.needsUpdate = true;
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
    const cells = map.cells.road || [];
    if (!cells.length) return;
    const positions = new Float32Array(cells.length * 12);
    const uvs = new Float32Array(cells.length * 8);
    const colors = new Float32Array(cells.length * 12);
    const indices = new Uint32Array(cells.length * 6);
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
    for (let i = 0; i < cells.length; i++) {
      const [x, z] = cells[i], vertex = i * 4, index = i * 6;
      const corners = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
      for (let c = 0; c < 4; c++) {
        const [cx, cz] = corners[c], at = (vertex + c) * 3, uv = (vertex + c) * 2;
        positions[at] = cx * CELL;
        positions[at + 1] = this.terrainHeightAt(cx * CELL, cz * CELL) + 0.09;
        positions[at + 2] = cz * CELL;
        uvs[uv] = cx * CELL / 26;
        uvs[uv + 1] = cz * CELL / 26;
        const shade = 0.78 + hash2(x, z, 51) * 0.3;
        colors[at] = tint.r * shade;
        colors[at + 1] = tint.g * shade;
        colors[at + 2] = tint.b * shade;
      }
      indices.set([vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3], index);
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
    const natureGround: ScatterItem[] = [];
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
      } else if (['grass', 'wildflower', 'fern', 'twig', 'snow_drift', 'dead_brush'].includes(p.type)) {
        const scale = (p.scale || 1) * (p.type === 'grass' ? 0.72 : p.type === 'wildflower' ? 0.48 : 0.8);
        const dead = p.type === 'dead_brush' || p.variant === 'deadlands';
        const snow = p.type === 'snow_drift' || p.variant === 'snow_forest' || p.variant === 'snowfield';
        natureGround.push({
          x: x + (r() - 0.5) * 1.7, y: this.terrainHeightAt(x, z) + scale * 0.28,
          z: z + (r() - 0.5) * 1.7, s: scale,
          rx: 0, ry: p.rotY || r() * Math.PI * 2, rz: (r() - 0.5) * 0.25,
          r: snow ? 0.82 : dead ? 0.58 : p.type === 'wildflower' ? 0.9 : 0.48 + r() * 0.4,
          g: snow ? 0.9 : dead ? 0.42 : p.type === 'wildflower' ? 0.58 : 0.56 + r() * 0.35,
          b: snow ? 0.98 : dead ? 0.3 : p.type === 'wildflower' ? 0.36 : 0.34 + r() * 0.27,
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
    // one instanced mesh for all loose rubble (walk-over flavor, no collider)
    this.scatter(rocks, new THREE.DodecahedronGeometry(1, 0), getMaterial('bone', 0));
    for (const [shape, batch] of natureRocks) {
      this.scatter(batch, this.makeRockGeometry(shape), new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.96, metalness: 0,
      }));
    }
    this.scatter(natureGround, new THREE.ConeGeometry(0.42, 1.2, 5), new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.9,
    }));
    this.buildTrees(trees);
    this.buildGrassland(map);
  }

  private makeRockGeometry(shape: string) {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const proportions: Record<string, [number, number, number]> = {
      angular: [1, 0.92, 1], slab: [1.35, 0.54, 0.88],
      spire: [0.76, 1.5, 0.82], ridge: [1.5, 0.78, 0.68],
      split: [0.9, 1.08, 1.34],
    };
    const [sx, sy, sz] = proportions[shape] || proportions.angular;
    geometry.scale(sx, sy, sz);
    geometry.computeVertexNormals();
    return geometry;
  }

  private buildGrassland(map: MapDef) {
    const biomeCells = map.biomes?.cells;
    const kinds = map.biomes?.kinds;
    if (!biomeCells || !kinds || biomeCells.length !== map.size.w * map.size.h) return;
    const road = new Set((map.cells.road || []).map(([x, z]) => this.key(x, z)));
    const water = new Set((map.cells.water || []).map(([x, z]) => this.key(x, z)));
    const wall = new Set(map.cells.wall.map(([x, z]) => this.key(x, z)));
    const clumps: { x: number; z: number; y: number; scale: number; color: number }[] = [];
    for (let z = 1; z < map.size.h - 1; z++) for (let x = 1; x < map.size.w - 1; x++) {
      const cell = this.key(x, z), biome = kinds[biomeCells[z * map.size.w + x]];
      if ((biome !== 'meadow' && biome !== 'forest') ||
          road.has(cell) || water.has(cell) || wall.has(cell)) continue;
      const density = hash2(x, z, 207);
      const count = biome === 'meadow'
        ? this.eng.lowgfx
          ? 6 + Math.floor(density * 7)
          : 14 + Math.floor(density * 13)
        : density > 0.32
          ? this.eng.lowgfx ? 2 + Math.floor(density * 3) : 4 + Math.floor(density * 5)
          : 0;
      for (let i = 0; i < count; i++) {
        const seed = i + z * map.size.w + x * 997;
        const px = (x + 0.12 + hash2(seed, 17, 223) * 0.76) * CELL;
        const pz = (z + 0.12 + hash2(seed, 31, 227) * 0.76) * CELL;
        const palette = biome === 'meadow'
          ? [0x628442, 0x7b9b4b, 0x9aab5b, 0x526f3d]
          : [0x45633c, 0x5f7945, 0x78834a];
        clumps.push({
          x: px, z: pz, y: this.terrainHeightAt(px, pz),
          scale: (biome === 'meadow' ? 0.82 : 0.68) + hash2(seed, 43, 229) * 0.55,
          color: palette[Math.floor(hash2(seed, 59, 233) * palette.length)],
        });
      }
    }
    if (!clumps.length) return;
    const positions: number[] = [], indices: number[] = [];
    const vertexColors: number[] = [];
    for (let blade = 0; blade < 3; blade++) {
      const angle = blade * Math.PI / 3;
      const widthX = Math.cos(angle) * 0.21, widthZ = Math.sin(angle) * 0.21;
      const bendX = -Math.sin(angle) * 0.075, bendZ = Math.cos(angle) * 0.075;
      const offset = positions.length / 3;
      positions.push(
        -widthX, 0, -widthZ,
        widthX, 0, widthZ,
        bendX - widthX * 0.68, 0.34, bendZ - widthZ * 0.68,
        bendX + widthX * 0.68, 0.34, bendZ + widthZ * 0.68,
        bendX * 2 - widthX * 0.1, 0.74, bendZ * 2 - widthZ * 0.1,
        bendX * 2 + widthX * 0.1, 0.74, bendZ * 2 + widthZ * 0.1,
      );
      vertexColors.push(
        0.58, 0.72, 0.52, 0.58, 0.72, 0.52,
        0.82, 0.92, 0.67, 0.82, 0.92, 0.67,
        1, 1, 0.79, 1, 1, 0.79,
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
    material.customProgramCacheKey = () => 'ashenreach-instanced-grass-wind-v1';
    const mesh = new THREE.InstancedMesh(geometry, material, clumps.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const object = new THREE.Object3D(), color = new THREE.Color();
    clumps.forEach((clump, index) => {
      object.position.set(clump.x, clump.y, clump.z);
      object.rotation.y = hash2(index, 67, 239) * Math.PI * 2;
      object.scale.setScalar(clump.scale);
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
    for (const side of [-1, 1]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), stone);
      rock.position.set(side * 4.2, 1.5, 0); rock.scale.set(1.1, 1.2, 1.3);
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
    return this.isOpenCell(c.cx, c.cz);
  }
  /** CONTRACTS.md: world coords, cell center test. */
  isBlocked(x: number, z: number) { return !this.isOpenWorld(x, z); }

  // ── movement collision: circle (r ft) vs wall AABBs — resolve push-out.
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
