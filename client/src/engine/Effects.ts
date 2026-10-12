// Effects — floating combat text, particle bursts, ground telegraphs.
import * as THREE from 'three';
import type { Engine } from './Engine';
import { softSprite } from './sprites';

interface FloatItem { el: HTMLDivElement; x: number; y: number; z: number; t: number; life: number; }
interface BurstItem { points: THREE.Points; vels: Float32Array; t: number; life: number; }

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

  floatText(pos: THREE.Vector3, text: string, kind: 'dmg' | 'heal' | 'miss' | 'crit' | 'info' = 'dmg') {
    const el = document.createElement('div');
    el.className = 'float-text ' + kind;
    el.textContent = text;
    this.host.appendChild(el);
    this.floats.push({ el, x: pos.x, y: pos.y, z: pos.z, t: 0, life: kind === 'miss' ? 0.9 : 1.25 });
  }

  burst(pos: THREE.Vector3, color: number, count = 20, spread = 5) {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = pos.x + (Math.random() - 0.5) * 1.2;
      arr[i * 3 + 1] = pos.y + 4 + Math.random() * 2;
      arr[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.2;
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.6 + 0.25;
      const v = spread * (0.5 + Math.random());
      vels[i * 3] = Math.cos(a) * Math.sin(e) * v;
      vels[i * 3 + 1] = Math.cos(e) * v * 1.4;
      vels[i * 3 + 2] = Math.sin(a) * Math.sin(e) * v;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({
      color, size: 1.9, transparent: true, opacity: 1, map: softSprite(),
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    pts.frustumCulled = false;
    this.eng.scene.add(pts);
    this.bursts.push({ points: pts, vels, t: 0, life: 0.8 });
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
        b.vels[j * 3 + 1] -= 26 * dt;
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
