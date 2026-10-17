// Effects — floating combat text, particle bursts, ground telegraphs.
// P2.6: damage-type impact presets ported from Custom-VTT's FXEngine STYLES
// (palette + density + fall behavior per damage type).
import * as THREE from 'three';
import type { Engine } from './Engine';
import { softSprite } from './sprites';

interface FloatItem { el: HTMLDivElement; x: number; y: number; z: number; t: number; life: number; }
interface BurstItem { points: THREE.Points; vels: Float32Array; t: number; life: number; grav: number; }

// impact presets — [colors, count, spread, size, life, gravity, additive]
// gravity < 0 rises (fire/holy), > 0 falls (blood/impact)
const IMPACT: Record<string, { colors: number[]; count: number; spread: number; size: number; life: number; grav: number; add?: boolean }> = {
  fire:        { colors: [0xfff3e9, 0xffe57f, 0xffd700, 0xff8c00, 0xff4500], count: 26, spread: 6, size: 1.7, life: 0.85, grav: -8, add: true },
  cold:        { colors: [0xa5f2f3, 0xe0ffff, 0x80deea, 0xffffff], count: 22, spread: 5.5, size: 1.5, life: 0.9, grav: 6 },
  frost:       { colors: [0xa5f2f3, 0xe0ffff, 0x80deea, 0xffffff], count: 22, spread: 5.5, size: 1.5, life: 0.9, grav: 6 },
  lightning:   { colors: [0xffffff, 0xe1f5fe, 0x81d4fa, 0x29b6f6], count: 24, spread: 9, size: 1.1, life: 0.55, grav: 0, add: true },
  acid:        { colors: [0x32cd32, 0xadff2f, 0x00ff00], count: 22, spread: 5, size: 1.3, life: 0.8, grav: 9 },
  poison:      { colors: [0x32cd32, 0xadff2f, 0x7cff6b], count: 22, spread: 5, size: 1.3, life: 0.8, grav: 7 },
  radiant:     { colors: [0xffd700, 0xffeb3b, 0xffffff, 0xfff8dc], count: 24, spread: 5.5, size: 1.5, life: 0.95, grav: -4, add: true },
  holy:        { colors: [0xffd700, 0xffeb3b, 0xffffff, 0xfff8dc], count: 24, spread: 5.5, size: 1.5, life: 0.95, grav: -4, add: true },
  necrotic:    { colors: [0x4b0082, 0x6a0dad, 0x8a2be2, 0x2e004f], count: 22, spread: 4.5, size: 1.9, life: 1.0, grav: -2 },
  dark:        { colors: [0x4b0082, 0x6a0dad, 0x8a2be2, 0x2e004f], count: 22, spread: 4.5, size: 1.9, life: 1.0, grav: -2 },
  psychic:     { colors: [0xb388ff, 0x7c4dff, 0xe040fb, 0xffffff], count: 20, spread: 6, size: 1.4, life: 0.8, grav: 0, add: true },
  force:       { colors: [0xb388ff, 0x7c4dff, 0x3d5afe, 0xffffff], count: 20, spread: 7, size: 1.3, life: 0.7, grav: 0, add: true },
  thunder:     { colors: [0x81d4fa, 0xffffff, 0x4fc3f7], count: 26, spread: 10, size: 1.2, life: 0.6, grav: 0, add: true },
  slashing:    { colors: [0xffffff, 0xe0f7fa, 0xffd54f], count: 18, spread: 8, size: 1.0, life: 0.5, grav: 2, add: true },
  piercing:    { colors: [0xffffff, 0xe0f7fa, 0xcfd8dc], count: 16, spread: 8, size: 1.0, life: 0.5, grav: 2 },
  bludgeoning: { colors: [0x8d6e63, 0xa1887f, 0xd7ccc8, 0x5d4037], count: 20, spread: 5, size: 1.6, life: 0.85, grav: 12 },
  bleeding:    { colors: [0x800000, 0xb22222, 0x5e0000, 0x8b0000], count: 20, spread: 4.5, size: 1.4, life: 0.9, grav: 14 },
  smoke:       { colors: [0x3d3d3d, 0x555555, 0x777777, 0x999999], count: 18, spread: 3.5, size: 2.1, life: 1.1, grav: -5 },
  healing:     { colors: [0x22c55e, 0x4ade80, 0x86efac, 0xbbf7d0, 0xffffff], count: 22, spread: 4, size: 1.5, life: 1.0, grav: -7, add: true },
};

// damage-type → floating-number tint (theme.css .float-text.dmg is the default)
export const DMG_TEXT_COLOR: Record<string, string> = {
  fire: '#ff9a4a', cold: '#9fe8f3', frost: '#9fe8f3', lightning: '#9fd0ff',
  acid: '#8dff5e', poison: '#8dff5e', radiant: '#ffe082', necrotic: '#c98aff',
  psychic: '#e08aff', force: '#b39aff', thunder: '#8ad4ff', slashing: '#f0f0f0',
  piercing: '#d8e0e6', bludgeoning: '#d7bfa8', healing: '#8fe8b0',
};

export class Effects {
  private eng: Engine;
  private host: HTMLDivElement;
  private floats: FloatItem[] = [];
  private bursts: BurstItem[] = [];
  private telegraphs: { mesh: THREE.Mesh; t: number; life: number }[] = [];

  constructor(eng: Engine) {
    this.eng = eng;
    this.host = document.createElement('div');
    this.host.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:22';
    document.body.appendChild(this.host);
  }

  floatText(pos: THREE.Vector3, text: string, kind: 'dmg' | 'heal' | 'miss' | 'crit' | 'info' = 'dmg', color?: string) {
    const el = document.createElement('div');
    el.className = 'float-text ' + kind;
    el.textContent = text;
    if (color) el.style.color = color;      // damage-type tint (P2.6)
    this.host.appendChild(el);
    this.floats.push({ el, x: pos.x, y: pos.y, z: pos.z, t: 0, life: kind === 'miss' ? 0.9 : 1.25 });
  }

  burst(pos: THREE.Vector3, color: number, count = 20, spread = 5) {
    this.burstStyled(pos, { colors: [color], count, spread, size: 1.9, life: 0.8, grav: 26, add: true });
  }

  /** P2.6 impact: damage-type preset burst (ported FXEngine palettes). */
  impact(pos: THREE.Vector3, type: string) {
    const key = String(type || '').toLowerCase();
    const preset = IMPACT[key] || IMPACT.bludgeoning;
    this.burstStyled(pos, preset);
  }

  private burstStyled(pos: THREE.Vector3, p: { colors: number[]; count: number; spread: number; size: number; life: number; grav: number; add?: boolean }) {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(p.count * 3);
    const vels = new Float32Array(p.count * 3);
    const cols = new Float32Array(p.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      arr[i * 3] = pos.x + (Math.random() - 0.5) * 1.2;
      arr[i * 3 + 1] = pos.y + 3.5 + Math.random() * 2.2;
      arr[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.2;
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.6 + 0.25;
      const v = p.spread * (0.5 + Math.random());
      vels[i * 3] = Math.cos(a) * Math.sin(e) * v;
      vels[i * 3 + 1] = Math.cos(e) * v * 1.4;
      vels[i * 3 + 2] = Math.sin(a) * Math.sin(e) * v;
      col.setHex(p.colors[i % p.colors.length]);
      cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({
      vertexColors: true, size: p.size, transparent: true, opacity: 1, map: softSprite(),
      blending: p.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false
    }));
    pts.frustumCulled = false;
    this.eng.scene.add(pts);
    this.bursts.push({ points: pts, vels, t: 0, life: p.life, grav: p.grav });
  }

  telegraph(x: number, z: number, radiusFt: number, color = 0xc9541f) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(radiusFt, 36),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.35, z);
    this.eng.scene.add(mesh);
    this.telegraphs.push({ mesh, t: 0, life: 0.9 });
  }

  update(dt: number) {
    // floats: project to screen, rise + fade
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.t += dt;
      const p = f.t / f.life;
      if (p >= 1) { f.el.remove(); this.floats.splice(i, 1); continue; }
      const v = new THREE.Vector3(f.x, f.y + 10 + p * 6, f.z).project(this.eng.camera);
      if (v.z > 1) { f.el.style.display = 'none'; continue; }
      f.el.style.display = 'block';
      f.el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      f.el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      f.el.style.opacity = String(p < 0.7 ? 1 : (1 - p) / 0.3);
      if (p < 0.25) f.el.style.transform = `translate(-50%,-50%) scale(${0.7 + p / 0.25 * 0.5})`;
    }
    // bursts: velocity + gravity + fade
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt;
      const p = b.t / b.life;
      if (p >= 1) { this.eng.scene.remove(b.points); b.points.geometry.dispose(); (b.points.material as THREE.Material).dispose(); this.bursts.splice(i, 1); continue; }
      const arr = (b.points.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let j = 0; j < arr.length / 3; j++) {
        b.vels[j * 3 + 1] -= b.grav * dt;
        arr[j * 3] += b.vels[j * 3] * dt;
        arr[j * 3 + 1] += b.vels[j * 3 + 1] * dt;
        arr[j * 3 + 2] += b.vels[j * 3 + 2] * dt;
        if (arr[j * 3 + 1] < 0.4) { arr[j * 3 + 1] = 0.4; b.vels[j * 3 + 1] *= -0.35; }
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = 1 - p;
    }
    // telegraphs: pulse in + out
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tg = this.telegraphs[i];
      tg.t += dt;
      const p = tg.t / tg.life;
      if (p >= 1) { this.eng.scene.remove(tg.mesh); tg.mesh.geometry.dispose(); (tg.mesh.material as THREE.Material).dispose(); this.telegraphs.splice(i, 1); continue; }
      const m = tg.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = Math.sin(p * Math.PI) * 0.4;
      tg.mesh.scale.setScalar(0.6 + p * 0.55);
    }
  }

  dispose() { this.host.remove(); }
}
