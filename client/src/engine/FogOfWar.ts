// FogOfWar — per-player explored/visible grid (VTT feature, 3D presentation).
// A shadow plane above the floor: black = unexplored, dim = explored, clear = visible.
// LOS via TileGrid.losClear against the map's wall segments.
//
// P3.3: in streamed-world mode every loaded region owns an independent fog
// layer (its own explored state, canvas and terrain-conforming plane), so
// crossing a region border keeps each region's exploration memory intact.
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { MapDef } from './types';
import { CELL } from './TileGrid';
import { useGame } from '../game/store';

const VISION_CELLS = 9;     // 45 ft base vision
const REFRESH = 0.18;       // seconds between LOS passes

interface FogLayer {
  mapDef: MapDef;
  origin: { x: number; z: number };
  W: number; H: number;
  plane: THREE.Mesh | null;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  explored: Uint8Array;
  visible: Uint8Array;
  myCell: { cx: number; cz: number };
}

function makeLayer(map: MapDef, origin: { x: number; z: number }): FogLayer {
  const canvas = document.createElement('canvas');
  canvas.width = map.size.w * 4;
  canvas.height = map.size.h * 4;
  return {
    mapDef: map,
    origin,
    W: map.size.w, H: map.size.h,
    plane: null,
    canvas,
    ctx: canvas.getContext('2d')!,
    tex: new THREE.CanvasTexture(canvas),
    explored: new Uint8Array(map.size.w * map.size.h),
    visible: new Uint8Array(map.size.w * map.size.h),
    myCell: { cx: -1, cz: -1 },
  };
}

export class FogOfWar {
  private eng: Engine;
  private dungeon: FogLayer | null = null;
  private regions = new Map<string, FogLayer>();
  private accum = 1;

  constructor(eng: Engine) {
    this.eng = eng;
  }

  /** Dungeon / single-map mode (clears all region fog). */
  build(map: MapDef) {
    this.clearRegions();
    if (this.dungeon) this.disposeLayer(this.dungeon);
    this.dungeon = makeLayer(map, { x: 0, z: 0 });
    this.eng.grid.buildLosIndex(map.walls);
    this.mountPlane(this.dungeon);
    this.accum = 1;
    this.repaint(this.dungeon);
  }

  /** Streamed world: add or refresh one region's fog layer. */
  buildRegion(map: MapDef) {
    if (!map.region) { this.build(map); return; }
    const id = map.id;
    const existing = this.regions.get(id);
    const origin = map.worldOriginFt || { x: 0, z: 0 };
    if (existing) {
      existing.mapDef = map;   // refreshed def (door states etc.); keep explored
      this.accum = 1;
      return;
    }
    const layer = makeLayer(map, origin);
    this.regions.set(id, layer);
    this.mountPlane(layer);
    this.repaint(layer);
  }

  removeRegion(id: string) {
    const layer = this.regions.get(id);
    if (!layer) return;
    this.disposeLayer(layer);
    this.regions.delete(id);
  }

  /** Explored memory for one region (HUD minimap reads this). */
  exploredFor(id: string): Uint8Array | null {
    return this.regions.get(id)?.explored ?? null;
  }

  retainRegions(keep: Set<string>) {
    for (const id of [...this.regions.keys()]) {
      if (!keep.has(id)) this.removeRegion(id);
    }
  }

  clearRegions() {
    for (const layer of this.regions.values()) this.disposeLayer(layer);
    this.regions.clear();
  }

  syncDoorStates(map: MapDef) {
    if (this.dungeon) this.dungeon.mapDef = map;
    const regionLayer = map.region ? this.regions.get(map.id) : null;
    if (regionLayer) regionLayer.mapDef = map;
    this.accum = 1;
  }

  private mountPlane(layer: FogLayer) {
    if (layer.plane) {
      this.eng.scene.remove(layer.plane);
      layer.plane.geometry.dispose();
      (layer.plane.material as THREE.Material).dispose();
      layer.plane = null;
    }
    const map = layer.mapDef;
    const terrain = map.terrain;
    const fogGeometry = terrain && terrain.width === layer.W + 1 && terrain.height === layer.H + 1
      ? this.buildTerrainGeometry(map, layer.origin)
      : new THREE.PlaneGeometry(layer.W * CELL, layer.H * CELL);
    layer.plane = new THREE.Mesh(
      fogGeometry,
      new THREE.MeshBasicMaterial({ map: layer.tex, transparent: true, depthWrite: false, opacity: 0.985 })
    );
    if (terrain && terrain.width === layer.W + 1 && terrain.height === layer.H + 1) {
      layer.plane.position.set(layer.origin.x, 0.38, layer.origin.z);
    } else {
      layer.plane.rotation.x = -Math.PI / 2;
      layer.plane.position.set(
        layer.origin.x + (layer.W * CELL) / 2, 0.32, layer.origin.z + (layer.H * CELL) / 2);
    }
    layer.plane.renderOrder = 2;
    this.eng.scene.add(layer.plane);
  }

  private disposeLayer(layer: FogLayer) {
    if (layer.plane) {
      layer.plane.removeFromParent();
      layer.plane.geometry.dispose();
      (layer.plane.material as THREE.Material).dispose();
      layer.plane = null;
    }
    layer.tex.dispose();
  }

  private buildTerrainGeometry(map: MapDef, origin: { x: number; z: number }) {
    const W = this.layerOf(map)?.W ?? map.size.w;
    const H = this.layerOf(map)?.H ?? map.size.h;
    const vertices = (W + 1) * (H + 1);
    const positions = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const indices = new Uint32Array(W * H * 6);
    const heights = map.terrain!.heightFt;
    for (let z = 0; z <= H; z++) for (let x = 0; x <= W; x++) {
      const at = (z * (W + 1) + x) * 3;
      positions[at] = origin.x + x * CELL;
      positions[at + 1] = heights[z * (W + 1) + x] || 0;
      positions[at + 2] = origin.z + z * CELL;
      const uvAt = (z * (W + 1) + x) * 2;
      uvs[uvAt] = x / W;
      uvs[uvAt + 1] = 1 - z / H;
    }
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const cell = z * W + x, at = cell * 6;
      const a = z * (W + 1) + x, b = a + 1, c = a + W + 1, d = c + 1;
      indices.set([a, c, b, b, c, d], at);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  private layerOf(map: MapDef): FogLayer | null {
    if (map.region) return this.regions.get(map.id) || null;
    return this.dungeon && this.dungeon.mapDef.id === map.id ? this.dungeon : null;
  }

  update(dt: number) {
    // fog of war is a dungeon-only feature — the streamed overworld renders
    // fully revealed, so there is nothing to recompute while outdoors
    if (this.eng.grid.worldMode) return;
    this.accum += dt;
    if (this.accum < REFRESH) return;
    this.accum = 0;
    // pick the fog layer under the viewer (streamed world) or the dungeon layer
    const myId = useGame.getState().myTokenId;
    const a = myId ? this.eng.actors.get(myId) : null;
    const px = a ? a.group.position.x : this.eng.camera.position.x;
    const pz = a ? a.group.position.z : this.eng.camera.position.z;
    let layer: FogLayer | null = null;
    let fx = px, fz = pz;
    if (this.eng.grid.worldMode) {
      const region = this.eng.grid.regionAt(px, pz);
      if (!region) return;
      layer = this.regions.get(region.id) || null;
      if (!layer) { // engine built the region before fog caught up — mount now
        this.buildRegion(region.map);
        layer = this.regions.get(region.id) || null;
      }
    } else {
      layer = this.dungeon;
    }
    if (!layer) return;
    const lx = fx - layer.origin.x, lz = fz - layer.origin.z;
    const { cx, cz } = {
      cx: Math.floor(lx / CELL),
      cz: Math.floor(lz / CELL),
    };
    if (cx === layer.myCell.cx && cz === layer.myCell.cz) return; // no move → no recompute
    layer.myCell = { cx, cz };
    this.compute(layer, lx, lz);
    this.repaint(layer);
  }

  private compute(layer: FogLayer, lx: number, lz: number) {
    const R = VISION_CELLS;
    layer.visible.fill(0);
    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dz * dz > R * R) continue;
        const cx = Math.floor(lx / CELL) + dx, cz = Math.floor(lz / CELL) + dz;
        if (cx < 0 || cz < 0 || cx >= layer.W || cz >= layer.H) continue;
        const idx = cz * layer.W + cx;
        // LOS from player eye to cell center (world feet)
        const eye = {
          x: layer.origin.x + Math.floor(lx / CELL) * CELL + CELL / 2,
          z: layer.origin.z + Math.floor(lz / CELL) * CELL + CELL / 2,
        };
        const c = { x: layer.origin.x + cx * CELL + CELL / 2, z: layer.origin.z + cz * CELL + CELL / 2 };
        if (this.eng.grid.losClear(eye.x, eye.z, c.x, c.z)) {
          layer.explored[idx] = 1;
          layer.visible[idx] = 1;
        }
      }
    }
  }

  private tmpCanvas = document.createElement('canvas');

  private repaint(layer: FogLayer) {
    const S = 4; // px per cell — canvas row/col map 1:1 to cell z/x
    // paint the cell-exact fog onto a temp canvas…
    const t = this.tmpCanvas;
    if (t.width !== layer.canvas.width) { t.width = layer.canvas.width; t.height = layer.canvas.height; }
    const tg = t.getContext('2d')!;
    tg.globalCompositeOperation = 'source-over';
    tg.globalAlpha = 0.93;
    tg.fillStyle = '#020304';
    tg.fillRect(0, 0, t.width, t.height);
    for (let z = 0; z < layer.H; z++) {
      for (let x = 0; x < layer.W; x++) {
        if (layer.explored[z * layer.W + x] === 0) continue;
        const vis = layer.visible[z * layer.W + x] === 1;
        if (!vis) {
          tg.clearRect(x * S, z * S, S, S);
          tg.globalAlpha = 0.5;
          tg.fillStyle = '#020304';
          tg.fillRect(x * S, z * S, S, S);
          tg.globalAlpha = 0.93;
        } else {
          tg.clearRect(x * S, z * S, S, S);
        }
      }
    }
    // …then blur it onto the visible fog canvas for soft edges
    const g = layer.ctx;
    g.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    try { g.filter = 'blur(2.5px)'; } catch (e) { /* older browsers */ }
    g.drawImage(t, 0, 0);
    g.filter = 'none';
    layer.tex.needsUpdate = true;
  }

  isExplored(cx: number, cz: number) {
    if (this.eng.grid.worldMode) return true;   // overworld is always revealed
    const layer = this.dungeon;
    if (!layer || cx < 0 || cz < 0 || cx >= layer.W || cz >= layer.H) return false;
    return layer.explored[cz * layer.W + cx] > 0;
  }
  isVisible(cx: number, cz: number) {
    if (this.eng.grid.worldMode) return true;   // overworld is always visible
    const layer = this.dungeon;
    if (!layer || cx < 0 || cz < 0 || cx >= layer.W || cz >= layer.H) return false;
    return layer.visible[cz * layer.W + cx] === 1;
  }

  dispose() {
    if (this.dungeon) this.disposeLayer(this.dungeon);
    this.dungeon = null;
    this.clearRegions();
  }
}
