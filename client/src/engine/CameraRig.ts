// CameraRig — third-person follow + orbit + combat framing + obstruction sweep.
// T2-d FIX: the old crude midpoint-vs-box test yanked the camera whenever ANY
// collider (brazier, hanging torch, wall corner) sat near the focus↔camera
// midpoint — hanging torches pulled it to minimum distance constantly.
//
// New algorithm:
//   1. desired camera = head(focus y≈5) + yaw/pitch/dist orbit, height-capped
//      below wall tops (indoor only) so the view never rises over indoor walls,
//      while allowing unconstrained height outdoors / on elevated terrain.
//   2. TRUE 3D segment-vs-AABB sweep head→desired over colliders (slab test).
//      Boxes whose y-range the sightline passes above/below are ignored
//      (low props yMax≤4 vs sightline starting at head height; high props
//      yMin≥7), and thin/ornamental boxes flagged decor are skipped entirely.
//   3. actual length lerps toward min(desiredLen, clearLen−pad) with a smooth
//      gap-based rate (fast when far from target, gentle near it) — the old
//      hard 13/3.4 rate flip pumped when the sweep oscillated near threshold.
//   4. failsafe push-out if the smoothed position still ends inside a box.
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { Collider } from './TileGrid';

function segAabbT(
  px: number, py: number, pz: number,
  qx: number, qy: number, qz: number,
  x1: number, x2: number,
  z1: number, z2: number,
  yMin: number, yMax: number
): number {
  const dx = qx - px, dy = qy - py, dz = qz - pz;
  let tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-9) { if (px < x1 || px > x2) return Infinity; }
  else {
    let t1 = (x1 - px) / dx, t2 = (x2 - px) / dx;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) { if (py < yMin || py > yMax) return Infinity; }
  else {
    let t1 = (yMin - py) / dy, t2 = (yMax - py) / dy;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return Infinity;
  }
  if (Math.abs(dz) < 1e-9) { if (pz < z1 || pz > z2) return Infinity; }
  else {
    let t1 = (z1 - pz) / dz, t2 = (z2 - pz) / dz;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

/** Segment P→Q vs Collider (AABB or OBB); entry t ∈ (0,1] if it crosses, else Infinity. */
function segBoxT(
  px: number, py: number, pz: number,
  qx: number, qy: number, qz: number,
  b: Collider
): number {
  if (b.rotY) {
    const cx = b.cx !== undefined ? b.cx : (b.x1 + b.x2) / 2;
    const cz = b.cz !== undefined ? b.cz : (b.z1 + b.z2) / 2;
    const hw = Math.abs(b.x2 - b.x1) / 2;
    const hd = Math.abs(b.z2 - b.z1) / 2;
    const cos = Math.cos(b.rotY), sin = Math.sin(b.rotY);
    const dx1 = px - cx, dz1 = pz - cz;
    const dx2 = qx - cx, dz2 = qz - cz;
    const lpx = dx1 * cos + dz1 * sin;
    const lpz = -dx1 * sin + dz1 * cos;
    const lqx = dx2 * cos + dz2 * sin;
    const lqz = -dx2 * sin + dz2 * cos;
    return segAabbT(lpx, py, lpz, lqx, qy, lqz, -hw, hw, -hd, hd, b.yMin, b.yMax);
  }
  return segAabbT(px, py, pz, qx, qy, qz, b.x1, b.x2, b.z1, b.z2, b.yMin, b.yMax);
}

const _head = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _tmp = new THREE.Vector3();

export class CameraRig {
  private eng: Engine;
  yaw = Math.PI * 0.12;
  pitch = 0.34;
  dist = 26;
  private curLen = 26;          // smoothed actual focus→camera length
  private shakeAmt = 0;
  private frameIds: string[] | null = null;
  private frameT = 0;
  private frameFocus = new THREE.Vector3();
  private focusInit = false;

  constructor(eng: Engine) { this.eng = eng; }

  follow(tokenId: string | null) {
    this.eng.actors.focusId = tokenId;
    this.frameIds = null;
    this.focusInit = false;
  }

  frameCombat(tokenIds: string[]) {
    this.frameIds = tokenIds.length ? tokenIds : null;
    this.frameT = 0;
    this.focusInit = false;
  }

  orbit(dx: number, dy: number) {
    this.yaw -= dx * 0.0042;
    this.pitch = Math.max(0.07, Math.min(1.18, this.pitch + dy * 0.003));
  }
  zoom(d: number) { this.dist = Math.max(12, Math.min(60, this.dist + d * 0.03)); }
  shake(amt: number) { this.shakeAmt = Math.min(1.6, this.shakeAmt + amt); }

  qaCam: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;

  update(dt: number) {
    const eng = this.eng;
    // QA harness override: fixed cinematic camera
    if ((window as any).__AR_QA_CAM__) {
      const q = (window as any).__AR_QA_CAM__;
      eng.camera.position.set(q.pos.x, q.pos.y, q.pos.z);
      eng.camera.lookAt(q.look.x, q.look.y, q.look.z);
      return;
    }

    // ── resolve the focus point (single actor or combat-frame centroid) ────
    let fx = 0, fz = 0, fy = 0;
    let framing = false;
    if (this.frameIds) {
      let n = 0, cx = 0, cySum = 0, cz = 0;
      for (const id of this.frameIds) {
        const a = eng.actors.get(id);
        if (!a) continue;
        cx += a.group.position.x;
        cySum += a.group.position.y;
        cz += a.group.position.z;
        n++;
      }
      if (n > 0) {
        cx /= n;
        const avgY = cySum / n;
        cz /= n;
        let spread = 0;
        for (const id of this.frameIds) {
          const a = eng.actors.get(id);
          if (!a) continue;
          spread = Math.max(spread, Math.hypot(a.group.position.x - cx, a.group.position.z - cz));
        }
        framing = true;
        // slow tactical orbit + fitted zoom
        this.yaw += dt * 0.11;
        const fit = Math.max(18, Math.min(55, spread * 2.1 + 18));
        this.dist += (fit - this.dist) * (1 - Math.exp(-dt * 1.6));
        _tmp.set(cx, avgY, cz);
        const k = this.focusInit ? 1 - Math.exp(-dt * 3) : 1;
        this.frameFocus.lerp(_tmp, k);
        fx = this.frameFocus.x;
        fy = this.frameFocus.y;
        fz = this.frameFocus.z;
        this.frameT += dt;
      } else {
        this.frameIds = null;
      }
    }
    if (!framing) {
      const focus = eng.actors.focusId ? eng.actors.get(eng.actors.focusId) : null;
      if (!focus) return;
      _tmp.set(focus.group.position.x, focus.group.position.y, focus.group.position.z);
      const k = this.focusInit ? 1 - Math.exp(-dt * 14) : 1;
      this.frameFocus.lerp(_tmp, k);
      fx = this.frameFocus.x;
      fy = this.frameFocus.y;
      fz = this.frameFocus.z;
    }
    this.focusInit = true;

    // ── desired camera: orbit offset, height capped vs wall tops (indoor) ──
    const headY = fy + 5;                       // sightline origin: head height
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const horiz = this.dist * cp;
    let cy = headY + this.dist * sp;

    // Ceiling cap: only apply if finite and indoor. If the character ascends a mountain
    // or elevated terrain, ensure maxY never forces the camera below head height.
    const gridMaxY = eng.grid.cameraMaxY;
    const isOutdoor = (eng.grid as any).isIndoor === false;
    const hasCeiling = !isOutdoor && gridMaxY != null && Number.isFinite(gridMaxY);
    const maxY = hasCeiling ? Math.max(gridMaxY, headY + 2) : Infinity;

    if (cy > maxY) cy = maxY;
    if (cy < 2.4) cy = 2.4;
    _desired.set(fx + Math.sin(this.yaw) * horiz, cy, fz + Math.cos(this.yaw) * horiz);
    _head.set(fx, headY, fz);

    // ── true 3D obstruction sweep head→desired ──────────────────────────────
    _dir.subVectors(_desired, _head);
    const L = _dir.length();
    if (L > 1e-4) _dir.multiplyScalar(1 / L);
    const maxT = this.sweepClearT(_head, _desired, Math.min(headY, cy), Math.max(headY, cy));

    const targetLen = Math.min(L, Math.max(7, maxT * L - 1.7));
    // smooth rate of the gap: fast when far from target, gentle when close —
    // a hard rate flip here pumped/jittered when the sweep oscillated
    const rate = targetLen < this.curLen ? 14 : 2.4;
    this.curLen += (targetLen - this.curLen) * (1 - Math.exp(-dt * rate));
    if (this.curLen > L) this.curLen = L;
    if (this.curLen < 7) this.curLen = 7;

    _tmp.copy(_head).addScaledVector(_dir, this.curLen);
    this.pushOutOfBoxes(_tmp, _head);

    // single smoothing stage: the focus lerp above is the only smoothing —
    // a second cascaded position lerp doubled the lag and fed the jitter
    eng.camera.position.copy(_tmp);
    if (eng.camera.position.y > maxY) eng.camera.position.y = maxY;
    if (eng.camera.position.y < 1.6) eng.camera.position.y = 1.6;
    eng.camera.lookAt(fx, headY - 0.5, fz);

    if (this.shakeAmt > 0.001) {
      this.shakeAmt *= Math.exp(-dt * 5.5);
      // rotation offset AFTER lookAt — a position offset fought the orientation
      eng.camera.rotateX((Math.random() - 0.5) * this.shakeAmt * 0.02);
      eng.camera.rotateY((Math.random() - 0.5) * this.shakeAmt * 0.02);
    }
  }

  /** Min entry-t of the segment against all relevant boxes (1 = clear). */
  private sweepClearT(p: THREE.Vector3, q: THREE.Vector3, segLo: number, segHi: number): number {
    let maxT = 1;
    const test = (b: Collider) => {
      if (b.decor) return;                                  // ornamental → ignore
      if (segHi < b.yMin + 0.01 || segLo > b.yMax - 0.01) return; // passes over/under
      const t = segBoxT(p.x, p.y, p.z, q.x, q.y, q.z, b);
      if (t < maxT) maxT = t;
    };
    const a = this.eng.grid.colliders;
    for (let i = 0; i < a.length; i++) test(a[i]);
    const b2 = this.eng.world.obstructionBoxes;
    for (let i = 0; i < b2.length; i++) test(b2[i]);
    return maxT;
  }

  /** Failsafe: if the smoothed position sits inside a solid box, slide toward the head. */
  private pushOutOfBoxes(p: THREE.Vector3, head: THREE.Vector3) {
    const lists = [this.eng.grid.colliders, this.eng.world.obstructionBoxes];
    for (let n = 0; n < 6; n++) {
      let hit = false;
      for (const list of lists) {
        for (const b of list) {
          if (b.decor) continue;
          if (p.y < b.yMin || p.y > b.yMax) continue;
          if (b.rotY) {
            const cx = b.cx !== undefined ? b.cx : (b.x1 + b.x2) / 2;
            const cz = b.cz !== undefined ? b.cz : (b.z1 + b.z2) / 2;
            const hw = Math.abs(b.x2 - b.x1) / 2;
            const hd = Math.abs(b.z2 - b.z1) / 2;
            const cos = Math.cos(b.rotY), sin = Math.sin(b.rotY);
            const dx = p.x - cx, dz = p.z - cz;
            const lx = dx * cos + dz * sin;
            const lz = -dx * sin + dz * cos;
            if (lx > -hw - 0.4 && lx < hw + 0.4 && lz > -hd - 0.4 && lz < hd + 0.4) {
              hit = true; break;
            }
          } else {
            if (p.x > b.x1 - 0.4 && p.x < b.x2 + 0.4 && p.z > b.z1 - 0.4 && p.z < b.z2 + 0.4) {
              hit = true; break;
            }
          }
        }
        if (hit) break;
      }
      if (!hit) return;
      p.lerp(head, 0.3);
    }
  }
}