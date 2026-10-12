// FogOfWar — per-player explored/visible grid (VTT feature, 3D presentation).
// A shadow plane above the floor: black = unexplored, dim = explored, clear = visible.
// LOS via TileGrid.losClear against the map's wall segments.
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { MapDef } from './types';
import { CELL } from './TileGrid';
import { useGame } from '../game/store';

const VISION_CELLS = 9;     // 45 ft base vision
const REFRESH = 0.18;       // seconds between LOS passes

export class FogOfWar {
  private eng: Engine;
  private plane: THREE.Mesh | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  private explored: Uint8Array = new Uint8Array(1);
  private visible: Uint8Array = new Uint8Array(1);
  private W = 1; private H = 1;
  private accum = 1;
  private mapDef: MapDef | null = null;
  private myCell = { cx: -1, cz: -1 };

  constructor(eng: Engine) {
    this.eng = eng;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 8;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new THREE.CanvasTexture(this.canvas);
  }

  build(map: MapDef) {
    this.mapDef = map;
    this.W = map.size.w; this.H = map.size.h;
    this.explored = new Uint8Array(this.W * this.H);
    this.visible = new Uint8Array(this.W * this.H);
    this.eng.grid.buildLosIndex(map.walls);

    // upscaled canvas (4px per cell) for soft edges
    this.canvas.width = this.W * 4;
    this.canvas.height = this.H * 4;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex.dispose();
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.magFilter = THREE.LinearFilter;

    if (this.plane) { this.eng.scene.remove(this.plane); this.plane.geometry.dispose(); (this.plane.material as THREE.Material).dispose(); }
    const terrain = map.terrain;
    const fogGeometry = terrain && terrain.width === this.W + 1 && terrain.height === this.H + 1
      ? this.buildTerrainGeometry(map)
      : new THREE.PlaneGeometry(this.W * CELL, this.H * CELL);
    this.plane = new THREE.Mesh(
      fogGeometry,
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, opacity: 0.985 })
    );
    if (terrain && terrain.width === this.W + 1 && terrain.height === this.H + 1) {
      this.plane.position.y = 0.38;
    } else {
      this.plane.rotation.x = -Math.PI / 2;
      this.plane.position.set((this.W * CELL) / 2, 0.32, (this.H * CELL) / 2);
    }
    this.plane.renderOrder = 2;
    this.eng.scene.add(this.plane);
    this.accum = 1; // force refresh
    this.repaint();
  }

  syncDoorStates(map: MapDef) {
    this.mapDef = map;
    this.accum = 1;
  }

  private buildTerrainGeometry(map: MapDef) {
    const vertices = (this.W + 1) * (this.H + 1);
    const positions = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const indices = new Uint32Array(this.W * this.H * 6);
    const heights = map.terrain!.heightFt;
    for (let z = 0; z <= this.H; z++) for (let x = 0; x <= this.W; x++) {
      const at = (z * (this.W + 1) + x) * 3;
      positions[at] = x * CELL;
      positions[at + 1] = heights[z * (this.W + 1) + x] || 0;
      positions[at + 2] = z * CELL;
      const uvAt = (z * (this.W + 1) + x) * 2;
      uvs[uvAt] = x / this.W;
      uvs[uvAt + 1] = 1 - z / this.H;
    }
    for (let z = 0; z < this.H; z++) for (let x = 0; x < this.W; x++) {
      const cell = z * this.W + x, at = cell * 6;
      const a = z * (this.W + 1) + x, b = a + 1, c = a + this.W + 1, d = c + 1;
      indices.set([a, c, b, b, c, d], at);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  update(dt: number) {
    this.accum += dt;
    if (this.accum < REFRESH) return;
    this.accum = 0;
    if (!this.mapDef) return;
    const myId = useGame.getState().myTokenId;
    const a = myId ? this.eng.actors.get(myId) : null;
    // No player figure yet (join backdrop / token-sync gap) → centre the fog on
    // the camera instead of bailing: the plane would otherwise stay ~93% black
    // and the world reads as an empty void with no floor.
    const fx = a ? a.group.position.x : this.eng.camera.position.x;
    const fz = a ? a.group.position.z : this.eng.camera.position.z;
    const { cx, cz } = this.eng.grid.worldToCell(fx, fz);
    if (cx === this.myCell.cx && cz === this.myCell.cz) return; // no move → no recompute
    this.myCell = { cx, cz };
    this.compute(cx, cz);
    this.repaint();
  }

  private compute(px: number, pz: number) {
    const R = VISION_CELLS;
    // clear transient visibility, keep explored (persistent memory)
    this.visible.fill(0);
    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dz * dz > R * R) continue;
        const cx = px + dx, cz = pz + dz;
        if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) continue;
        const idx = cz * this.W + cx;
        // LOS from player eye to cell center
        const eye = this.eng.grid.cellToWorld(px, pz);
        const c = this.eng.grid.cellToWorld(cx, cz);
        if (this.eng.grid.losClear(eye.x, eye.z, c.x, c.z)) {
          this.explored[idx] = 1;
          this.visible[idx] = 1;
        }
      }
    }
  }

  private tmpCanvas = document.createElement('canvas');

  private repaint() {
    const S = 4; // px per cell — canvas row/col map 1:1 to cell z/x
    // paint the cell-exact fog onto a temp canvas…
    const t = this.tmpCanvas;
    if (t.width !== this.canvas.width) { t.width = this.canvas.width; t.height = this.canvas.height; }
    const tg = t.getContext('2d')!;
    tg.globalCompositeOperation = 'source-over';
    tg.globalAlpha = 0.93;
    tg.fillStyle = '#020304';
    tg.fillRect(0, 0, t.width, t.height);
    for (let z = 0; z < this.H; z++) {
      for (let x = 0; x < this.W; x++) {
        if (this.explored[z * this.W + x] === 0) continue;
        const vis = this.visible[z * this.W + x] === 1;
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
    const g = this.ctx;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    try { g.filter = 'blur(2.5px)'; } catch (e) { /* older browsers */ }
    g.drawImage(t, 0, 0);
    g.filter = 'none';
    this.tex.needsUpdate = true;
  }

  isExplored(cx: number, cz: number) {
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) return false;
    return this.explored[cz * this.W + cx] > 0;
  }
  isVisible(cx: number, cz: number) {
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.H) return false;
    return this.visible[cz * this.W + cx] === 1;
  }

  dispose() { this.plane?.removeFromParent(); this.tex.dispose(); }
}
