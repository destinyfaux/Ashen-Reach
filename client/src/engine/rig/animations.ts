// animations — procedural pose system (no AnimationMixer; pure math per bone,
// in the spirit of _refs/ELDEN-RING-Combat-Rewrite/src/anim.rs + rig.rs):
//
//  · one shared stride phase across gaits (changing speed never snaps feet)
//  · locomotion = idle↔walk↔run blends driven by measured speed
//  · actions (attack/spell/shoot/heal/buff/hit/miss/die) are overlays with
//    per-phase weights; exponential cross-fade to the shown pose = zero popping
//  · turn-in-place lean, acceleration lean, run lean, breathing, weight sway
//
// Rotations are per-bone Euler (rx, ry, rz) composed as qx·qz·qy on top of the
// bind pose. Sign conventions (model faces +Z):
//   limb bones point DOWN: -rx swings a limb forward; +rx swings it back
//   spine bones point UP:  +rx pitches the torso forward
//   knee bends back = +rx; elbow bends forward = -rx; arm raise = -rx
import * as THREE from 'three';
import { B, BONE_COUNT, type HumanoidRig } from './HumanoidRig';

export type ActionKind = 'attack' | 'spell' | 'shoot' | 'heal' | 'buff' | 'hit' | 'crit' | 'miss' | 'die';
export type WeaponStyle = 'sword' | 'dagger' | 'staff' | 'mace' | 'none';

export interface MotionIn {
  dt: number;
  t: number;          // seconds since scene start
  speed: number;      // ft/s (measured, smoothed)
  accel: number;      // ft/s² (smoothed, + = speeding up)
  yawRate: number;    // rad/s (smoothed)
  style: WeaponStyle;
  isWraith: boolean;
  isSkeleton: boolean;
}

export interface PoseOut {
  rootPitch: number;   // + leans forward
  rootRoll: number;    // + tips left (into a left turn)
  lift: number;        // pelvis Y offset (bob / crouch / wraith hover)
  lungeF: number;      // forward lunge impulse (ft) — consumed by Actors
  trail: number;       // weapon-trail strength 0..1
  glow: number;        // palm ember strength 0..1
  windUp: number;      // cloak billow strength 0..1
  dieT: number;        // death progress 0..1, or -1 when alive
  actionDone: boolean;
  footfalls: number;
}

class PoseBuf {
  e = new Float32Array(BONE_COUNT * 3);  // rx, ry, rz per bone
  rootPitch = 0; rootRoll = 0; lift = 0;
  lungeF = 0; trail = 0; glow = 0; windUp = 0;
  set(o: PoseBuf) {
    this.e.set(o.e);
    this.rootPitch = o.rootPitch; this.rootRoll = o.rootRoll; this.lift = o.lift;
    this.lungeF = o.lungeF; this.trail = o.trail; this.glow = o.glow; this.windUp = o.windUp;
  }
}

const clamp = (v: number, a: number, b: number) => v < a ? a : v > b ? b : v;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => t * t * (3 - 2 * t);

export class Animator {
  phase = Math.random();          // stride phase, shared across gaits
  gait = 0;                       // 0 walk → 1 run
  moveBlend = 0;                  // 0 idle → 1 moving
  action: { kind: ActionKind; t: number; dur: number; power: number; dir: number } | null = null;
  private shown = new PoseBuf();  // what is on screen (cross-fade source)
  private target = new PoseBuf();
  private seed: number;
  private seed2: number;
  downed = false;

  constructor(seed = 0) {
    this.seed = (seed % 97) * 0.618 + 0.31;
    this.seed2 = (seed % 53) * 0.471 + 1.17;
  }

  trigger(kind: ActionKind, power = 1, dir = 0) {
    const durs: Record<ActionKind, number> = {
      attack: 0.8, spell: 1.15, shoot: 0.8, heal: 1.3, buff: 1.2,
      hit: 0.42, crit: 0.6, miss: 0.42, die: 1.7,
    };
    const p = kind === 'crit' ? 1.8 : (kind === 'attack' ? clamp(power, 0.4, 2) : power);
    this.action = { kind, t: 0, dur: durs[kind] / (kind === 'attack' ? (0.75 + 0.25 * p) : 1), power: p, dir };
  }

  setDowned(value: boolean) { this.downed = value; }

  /** advance + solve; writes bone quaternions into the rig, returns blended outputs */
  update(m: MotionIn, rig: HumanoidRig): PoseOut {
    const dt = m.dt;
    // ── gait blending (continuous phase, like rig.rs) ──
    const previousPhase = this.phase;
    const strideLen = 5.6 + 2.6 * this.gait;                       // ft per full cycle
    let footfalls = 0;
    if (m.speed > 0.2) {
      const advance = dt * m.speed / strideLen;
      this.phase = (this.phase + advance) % 1;
      if (m.speed > 2 && !this.downed && this.action?.kind !== 'die') {
        footfalls = Math.max(0, Math.floor((previousPhase + advance) * 2) - Math.floor(previousPhase * 2));
      }
    }
    this.gait += (smooth(13, 24, m.speed) - this.gait) * Math.min(1, dt * 5);
    this.moveBlend += (smooth(1.2, 4.5, m.speed) - this.moveBlend) * Math.min(1, dt * 6);

    // ── build target pose ──
    const p = this.target;
    p.e.fill(0);
    p.rootPitch = 0; p.rootRoll = 0; p.lift = 0;
    p.lungeF = 0; p.trail = 0; p.glow = 0; p.windUp = 0;

    const dying = this.action?.kind === 'die';
    if (dying) this.actionPose(p, m);
    else if (this.downed) this.downedPose(p);
    else {
      this.locomotion(p, m);
      if (this.action) this.actionPose(p, m);
      else this.turnInPlace(p, m);
    }

    // ── cross-fade toward target (exponential = pop-free, zero alloc) ──
    const rate = dying ? 14 : this.action ? (this.action.kind === 'attack' && this.action.t / this.action.dur > 0.28 ? 42 : 26) : 11;
    const k = 1 - Math.exp(-rate * dt);
    const s = this.shown;
    for (let i = 0; i < s.e.length; i++) s.e[i] += (p.e[i] - s.e[i]) * k;
    s.rootPitch += (p.rootPitch - s.rootPitch) * k;
    s.rootRoll += (p.rootRoll - s.rootRoll) * k;
    s.lift += (p.lift - s.lift) * k;
    s.lungeF = p.lungeF; s.trail = p.trail; s.glow = p.glow; s.windUp = p.windUp;

    this.applyToRig(rig, s);

    // ── outputs ──
    OUT.actionDone = false;
    OUT.footfalls = footfalls;
    OUT.dieT = -1;
    if (this.action) {
      const action = this.action;
      action.t += dt;
      if (action.kind === 'die') OUT.dieT = clamp(action.t / action.dur, 0, 1);
      if (action.t >= action.dur) { this.action = null; OUT.actionDone = true; }
    }
    OUT.rootPitch = s.rootPitch; OUT.rootRoll = s.rootRoll; OUT.lift = s.lift;
    OUT.lungeF = s.lungeF; OUT.trail = s.trail; OUT.glow = s.glow; OUT.windUp = s.windUp;
    return OUT;
  }

  private downedPose(p: PoseBuf) {
    const e = p.e;
    const set = (b: number, rx: number, ry = 0, rz = 0) => {
      e[b * 3] = rx; e[b * 3 + 1] = ry; e[b * 3 + 2] = rz;
    };
    set(B.THIGH_L, -0.8, 0, 0.12); set(B.THIGH_R, -0.95, 0, -0.12);
    set(B.SHIN_L, 1.15); set(B.SHIN_R, 1.25);
    set(B.FOOT_L, -0.25); set(B.FOOT_R, -0.3);
    set(B.SPINE1, 0.26); set(B.SPINE2, 0.35, 0.08);
    set(B.NECK, 0.1); set(B.HEAD, 0.24, 0.25, 0.08);
    set(B.ARM_L, -0.32, 0, 0.65); set(B.ARM_R, -0.28, 0, -0.62);
    set(B.FOREARM_L, -0.22); set(B.FOREARM_R, -0.2);
    p.lift = 0.02;
  }

  // ── base: idle + walk/run locomotion ────────────────────────────────────────
  private locomotion(p: PoseBuf, m: MotionIn) {
    const e = p.e;
    const set = (b: number, rx: number, ry = 0, rz = 0) => { e[b * 3] = rx; e[b * 3 + 1] = ry; e[b * 3 + 2] = rz; };
    const add = (b: number, rx = 0, ry = 0, rz = 0) => { e[b * 3] += rx; e[b * 3 + 1] += ry; e[b * 3 + 2] += rz; };
    const t = m.t, ph = this.phase;
    const idle = 1 - this.moveBlend;
    const g = this.gait;
    const skel = m.isSkeleton ? 0.45 : 1;   // the dead move stiffly

    // wraith: floating drift, no legs
    if (m.isWraith) {
      const hover = 1.15 + Math.sin(t * 1.25 + this.seed) * 0.17;
      p.lift = hover;
      set(B.PELVIS, 0, Math.sin(t * 0.5 + this.seed) * 0.08, Math.sin(t * 0.62) * 0.05);
      set(B.SPINE2, 0.06 + Math.sin(t * 0.9) * 0.02, Math.sin(t * 0.44 + this.seed2) * 0.1, 0);
      set(B.NECK, 0.08, 0, 0);
      set(B.HEAD, -0.14, Math.sin(t * 0.3 + this.seed) * 0.2, Math.sin(t * 0.4) * 0.06);
      for (const [arm, fore, hand, s] of [[B.ARM_L, B.FOREARM_L, B.HAND_L, 1], [B.ARM_R, B.FOREARM_R, B.HAND_R, -1]] as [number, number, number, number][]) {
        const w = Math.sin(t * 0.7 + this.seed + s * 2.1);
        set(arm, -0.18 + w * 0.06, 0, s * (0.16 + w * 0.04));
        set(fore, -0.3 + Math.sin(t * 0.55 + s) * 0.08, 0, 0);
        set(hand, -0.2, 0, 0);
      }
      // drift lean with motion
      p.rootPitch = clamp(m.speed * 0.008, 0, 0.18);
      p.rootRoll = clamp(m.yawRate * 0.04, -0.12, 0.12);
      return;
    }

    // ── legs: opposed phase, arm counter-swing (walk ↔ run amplitude blend) ──
    const A_leg = 0.44 + 0.32 * g;    // trimmed ~15% so the swing foot's arc stays off the floor
    const A_knee = 0.85 + 0.32 * g;
    const A_bob = 0.085 + 0.1 * g;
    const A_arm = (0.3 + 0.34 * g) * skel;
    const A_roll = 0.05 + 0.02 * g;
    const wobble = Math.sin(t * 1.9 + this.seed) * 0.02;   // breathing sync

    for (const [th, sh, ft, off] of [[B.THIGH_L, B.SHIN_L, B.FOOT_L, 0], [B.THIGH_R, B.SHIN_R, B.FOOT_R, 0.5]] as [number, number, number, number][]) {
      const lp = (ph + off) % 1;
      const swing = Math.sin(lp * Math.PI * 2);
      const thigh = -A_leg * swing * this.moveBlend;
      const knee = A_knee * (0.18 + 0.82 * Math.max(0, Math.sin((lp - 0.8) * Math.PI * 2))) * this.moveBlend;
      const toe = Math.max(0, Math.sin((lp - 0.68) * Math.PI * 2)) * (0.3 + 0.25 * g) * this.moveBlend;
      set(th, thigh);
      set(sh, knee);
      set(ft, -(thigh + knee) * 0.38 + toe - 0.05);
    }
    // pelvis: two-beat bob (low at contact), roll + hip yaw
    p.lift = (0.5 + 0.5 * Math.cos(ph * Math.PI * 4)) * A_bob * this.moveBlend
      + wobble * idle
      - 0.05 * g * this.moveBlend;                     // running crouch
    p.lift = Math.max(0.02, p.lift);                   // floor clamp — never dip below the soles
    set(B.PELVIS, 0.02, -0.1 * Math.sin(ph * Math.PI * 2) * this.moveBlend, A_roll * Math.sin(ph * Math.PI * 2) * this.moveBlend);
    // spine counter-rotation + run arch
    set(B.SPINE1, 0.04 + 0.1 * g * this.moveBlend, 0.06 * Math.sin(ph * Math.PI * 2) * this.moveBlend, 0);
    set(B.SPINE2, 0.03 + 0.12 * g * this.moveBlend, 0.13 * Math.sin(ph * Math.PI * 2) * this.moveBlend,
      -A_roll * Math.sin(ph * Math.PI * 2) * this.moveBlend * 0.7);
    set(B.NECK, -0.03 - 0.05 * g * this.moveBlend, 0, 0);
    set(B.HEAD, -0.02 - 0.06 * g * this.moveBlend + Math.sin(t * 0.37 + this.seed2) * 0.05 * idle,
      Math.sin(t * 0.31 + this.seed) * 0.16 * idle + 0.06 * Math.sin(ph * Math.PI * 2) * this.moveBlend, 0);

    // ── arms ──
    const armSwing = Math.sin(ph * Math.PI * 2) * A_arm * this.moveBlend;
    const breathe = Math.sin(t * 1.9 + this.seed) * 0.02;
    for (const [arm, fore, hand, s] of [[B.ARM_L, B.FOREARM_L, B.HAND_L, 1], [B.ARM_R, B.FOREARM_R, B.HAND_R, -1]] as [number, number, number, number][]) {
      // idle carry + walk swing; right arm carries the weapon
      let idleRx = -0.06, idleElb = -0.28, idleRz = s * 0.1;
      if (s < 0) {  // weapon arm carry pose (keeps the blade off the ground)
        if (m.style === 'sword') { idleRx = -0.34; idleElb = -0.62; idleRz = -0.12; }
        else if (m.style === 'dagger') { idleRx = -0.16; idleElb = -0.8; idleRz = -0.08; }
        else if (m.style === 'staff') { idleRx = -0.1; idleElb = -0.18; idleRz = -0.04; }
        else if (m.style === 'mace') { idleRx = -0.24; idleElb = -0.42; idleRz = -0.1; }
      }
      const rx = idleRx * idle + (-armSwing * s) + breathe * idle;
      set(arm, rx, 0, idleRz * idle + s * 0.05 * this.moveBlend * (0.5 + g));
      set(fore, idleElb * idle - (0.15 + 0.5 * g) * this.moveBlend * Math.max(0, -s * armSwing), 0, 0);
      set(hand, -0.12 * idle, 0, 0);
      void hand;
    }
    // clavicle breathing (subtle shoulder rise)
    set(B.CLAV_L, breathe * 0.4, 0, 0);
    set(B.CLAV_R, breathe * 0.4, 0, 0);
    // skeleton unquiet twitch
    if (m.isSkeleton) {
      add(B.HEAD, Math.sin(t * 12.7) * 0.015, Math.sin(t * 9.3 + 2) * 0.03, 0);
      add(B.SPINE2, 0, Math.sin(t * 7.1) * 0.02, 0);
    }
    // ── lean: acceleration + run + into turns ──
    p.rootPitch = (clamp(m.accel * 0.005, -0.1, 0.2) + 0.13 * g) * this.moveBlend;
    p.rootRoll = clamp(m.yawRate * 0.05, -0.14, 0.14) * this.moveBlend;
    p.rootPitch += Math.sin(t * 0.5 + this.seed2) * 0.012 * idle;
    p.rootRoll += Math.sin(t * 0.42 + this.seed) * 0.014 * idle;
  }

  // ── turn-in-place: torso leads the body around ─────────────────────────────
  private turnInPlace(p: PoseBuf, m: MotionIn) {
    if (m.speed > 1 || Math.abs(m.yawRate) < 1.1) return;
    const w = clamp(Math.abs(m.yawRate) / 3, 0, 1) * (1 - this.moveBlend);
    const dir = Math.sign(m.yawRate);
    const e = p.e;
    e[B.SPINE2 * 3 + 1] += dir * 0.3 * w;
    e[B.HEAD * 3 + 1] += dir * 0.22 * w;
    e[B.PELVIS * 3] -= 0.04 * w;
    p.rootRoll += dir * 0.06 * w;
  }

  // ── action overlays ─────────────────────────────────────────────────────────
  private actionPose(p: PoseBuf, m: MotionIn) {
    const a = this.action!;
    const u = clamp(a.t / a.dur, 0, 1);
    const e = p.e;
    const mix = (b: number, rx: number, ry: number, rz: number, w: number) => {
      if (w <= 0) return;
      e[b * 3] += (rx - e[b * 3]) * w;
      e[b * 3 + 1] += (ry - e[b * 3 + 1]) * w;
      e[b * 3 + 2] += (rz - e[b * 3 + 2]) * w;
    };

    if (a.kind === 'die') { this.deathPose(p, m, u); return; }

    if (a.kind === 'attack') {
      // 3-phase: windup → strike → recover (ER: committed, weighty swings)
      const W = 0.3, S = 0.55;
      if (u < W) {
        const w = ease(u / W);
        mix(B.ARM_R, -2.45, 0.25, -0.42, w);
        mix(B.FOREARM_R, -1.45, 0, 0, w);
        mix(B.HAND_R, -0.3, 0, 0, w);
        mix(B.SPINE2, -0.12, -0.4, 0, w);
        mix(B.PELVIS, 0.02, 0.18, 0, w * 0.8);
        mix(B.ARM_L, -0.75, 0, 0.18, w);      // guard arm forward
        mix(B.FOREARM_L, -1.0, 0, 0, w);
        mix(B.HEAD, 0.06, 0.18, 0, w);
        p.windUp = Math.max(p.windUp, w * 0.5);
      } else if (u < S) {
        const s = ease((u - W) / (S - W));
        const snap = 1 - Math.pow(1 - s, 3);  // fast-in
        mix(B.ARM_R, -0.7, -0.2, 0.18, snap);
        mix(B.FOREARM_R, -0.25, 0, 0, snap);
        mix(B.HAND_R, -0.1, 0, 0, snap);
        mix(B.SPINE2, 0.32, 0.3, 0, snap);
        mix(B.PELVIS, 0.06, -0.24, 0, snap);
        mix(B.ARM_L, -0.5, 0, 0.1, snap);
        mix(B.FOREARM_L, -0.8, 0, 0, snap);
        mix(B.HEAD, -0.04, -0.1, 0, snap);
        p.rootPitch += 0.14 * snap;
        p.lift -= 0.06 * snap;
        p.lungeF = Math.sin(s * Math.PI) * (1.5 + a.power * 0.9);
        p.trail = Math.sin(s * Math.PI) * clamp(0.7 + a.power * 0.3, 0, 1.4);
      } else {
        const r = ease((u - S) / (1 - S));
        // settle back toward the carry stance
        const w = 1 - r;
        mix(B.ARM_R, -0.34, 0, -0.12, w * 0.9 + r * 0.1);
        mix(B.FOREARM_R, -0.62, 0, 0, w * 0.9);
        mix(B.SPINE2, 0.1 * w, 0.2 * w, 0, w);
        p.rootPitch += 0.06 * w;
        p.trail = 0;
      }
      return;
    }

    if (a.kind === 'spell') {
      const raise = ease(clamp(u / 0.32, 0, 1));
      const push = ease(clamp((u - 0.42) / 0.2, 0, 1));
      const fall = ease(clamp((u - 0.62) / 0.38, 0, 1));
      const w = raise * (1 - fall * 0.85);
      mix(B.ARM_L, -1.32 - push * 0.18, 0.1, 0.3, w);
      mix(B.FOREARM_L, -0.32 + push * 0.1, 0, 0, w);
      mix(B.HAND_L, -0.25, 0, 0, w);
      mix(B.SPINE2, -0.08 + push * 0.2, 0.22, 0, w);
      mix(B.PELVIS, 0, -0.12, 0, w * 0.7);
      mix(B.HEAD, -0.12, 0.1, 0, w);
      mix(B.ARM_R, -0.15, 0, -0.2, w * 0.6);
      p.glow = raise * (1 - fall) * (0.7 + 0.3 * Math.sin(u * Math.PI));
      p.windUp = raise * (1 - fall) * 0.9;
      p.lift += 0.05 * w;
      return;
    }

    if (a.kind === 'shoot') {
      const draw = ease(clamp(u / 0.45, 0, 1));
      const release = ease(clamp((u - 0.45) / 0.14, 0, 1));
      const fall = ease(clamp((u - 0.62) / 0.38, 0, 1));
      const w = draw * (1 - fall);
      mix(B.ARM_R, 0.4 - release * 1.5, 0, -0.25, w);
      mix(B.FOREARM_R, -1.75 + release * 1.45, 0, 0, w);
      mix(B.ARM_L, -1.38 + release * 0.1, 0.15, 0.08, w);
      mix(B.FOREARM_L, -0.18, 0, 0, w);
      mix(B.SPINE2, 0.04, -0.3, 0, w);
      mix(B.HEAD, 0.02, -0.1, 0, w);
      p.trail = 0;
      if (release > 0.55 && release < 0.75) p.lungeF = -0.3;  // tiny recoil
      return;
    }

    if (a.kind === 'heal' || a.kind === 'buff') {
      const raise = ease(clamp(u / 0.4, 0, 1));
      const fall = ease(clamp((u - 0.72) / 0.28, 0, 1));
      const w = raise * (1 - fall);
      const up = a.kind === 'buff' ? -2.85 : -1.55;
      mix(B.ARM_R, up, 0, a.kind === 'buff' ? -0.3 : -0.5, w);
      mix(B.FOREARM_R, a.kind === 'buff' ? -0.35 : -0.5, 0, 0, w);
      mix(B.ARM_L, -1.5, 0, 0.55, w);
      mix(B.FOREARM_L, -0.4, 0, 0, w);
      mix(B.SPINE2, -0.14, 0, 0, w);
      mix(B.HEAD, -0.22, 0, 0, w);
      p.glow = w * (a.kind === 'heal' ? 0.9 : 0.55);
      p.windUp = w * 0.8;
      p.lift += 0.08 * w;
      return;
    }

    // hit / crit / miss — spine recoil + stagger (miss = sidestep sway)
    const strong = a.kind === 'crit' ? 1.6 : 1;
    if (a.kind === 'miss') {
      const w = Math.sin(u * Math.PI);
      const dir = a.dir >= 0 ? 1 : -1;
      mix(B.SPINE2, 0.08, -0.3 * dir, 0.12 * dir, w);
      mix(B.ARM_L, -0.5, 0, 0.5, w * 0.7);
      mix(B.ARM_R, -0.4, 0, -0.5, w * 0.7);
      p.rootRoll += dir * 0.13 * w;
      p.lift -= 0.05 * w;
      return;
    }
    const u0 = u;
    const w = Math.sin(u0 * Math.PI) * strong;
    const shudder = Math.sin(u0 * 26) * 0.06 * (1 - u0) * strong;
    mix(B.SPINE2, -0.42 * strong, 0.08, 0, clamp(w, 0, 1));
    mix(B.SPINE1, -0.18 * strong, 0, 0, clamp(w, 0, 1));
    mix(B.HEAD, -0.3 * strong, 0.1, 0, clamp(w, 0, 1));
    mix(B.ARM_L, -0.35, 0, 0.55, clamp(w, 0, 1) * 0.8);
    mix(B.ARM_R, -0.3, 0, -0.55, clamp(w, 0, 1) * 0.8);
    mix(B.PELVIS, -0.06, 0, 0, clamp(w, 0, 1));
    p.rootPitch -= 0.13 * clamp(w, 0, 1);
    p.rootRoll += shudder;
    p.lift -= 0.1 * clamp(w, 0, 1);
  }

  // ── death: knees → fold → collapse forward, then dissolve (Actors fades) ────
  private deathPose(p: PoseBuf, m: MotionIn, u: number) {
    const e = p.e;
    const mix = (b: number, rx: number, ry: number, rz: number, w: number) => {
      e[b * 3] += (rx - e[b * 3]) * w;
      e[b * 3 + 1] += (ry - e[b * 3 + 1]) * w;
      e[b * 3 + 2] += (rz - e[b * 3 + 2]) * w;
    };
    if (m.isWraith) {
      // no legs: fold + sink into the floor, ribbons go limp
      const sink = ease(u);
      mix(B.SPINE1, 0.5 * sink, 0, 0, sink);
      mix(B.SPINE2, 0.35 * sink, 0, 0, sink);
      mix(B.HEAD, 0.45 * sink, 0.2 * sink, 0.1 * sink, sink);
      mix(B.ARM_L, -0.3 - 0.4 * sink, 0, 0.9 * sink, sink);
      mix(B.ARM_R, -0.3 - 0.4 * sink, 0, -0.9 * sink, sink);
      p.lift = 1.15 - 3.3 * sink;
      p.rootPitch = 0.85 * sink;
      return;
    }
    if (u < 0.24) {
      const w = ease(u / 0.24);
      mix(B.THIGH_L, -0.95, 0, 0.1, w); mix(B.THIGH_R, -0.95, 0, -0.1, w);
      mix(B.SHIN_L, 1.6, 0, 0, w); mix(B.SHIN_R, 1.6, 0, 0, w);
      mix(B.FOOT_L, -0.3, 0, 0, w); mix(B.FOOT_R, -0.3, 0, 0, w);
      mix(B.SPINE2, 0.2, 0, 0, w);
      mix(B.ARM_L, -0.35, 0, 0.5, w); mix(B.ARM_R, -0.35, 0, -0.5, w);
      mix(B.HEAD, -0.15, 0, 0, w);
      p.lift = -1.15 * w;
      p.rootPitch = 0.12 * w;
    } else if (u < 0.52) {
      const w = ease((u - 0.24) / 0.28);
      mix(B.THIGH_L, -1.4, 0, 0.12, 1); mix(B.THIGH_R, -1.4, 0, -0.12, 1);
      mix(B.SHIN_L, 2.15, 0, 0, 1); mix(B.SHIN_R, 2.15, 0, 0, 1);
      mix(B.FOOT_L, -0.4, 0, 0, 1); mix(B.FOOT_R, -0.4, 0, 0, 1);
      mix(B.SPINE1, 0.5, 0, 0, 1); mix(B.SPINE2, 0.5, 0.1, 0, 1);
      mix(B.HEAD, 0.42, 0.15, 0, 1);
      mix(B.ARM_L, -0.5, 0, 0.35, 1); mix(B.ARM_R, -0.5, 0, -0.35, 1);
      mix(B.FOREARM_L, -0.3, 0, 0, 1); mix(B.FOREARM_R, -0.3, 0, 0, 1);
      p.lift = -1.15 - 0.85 * w;
      p.rootPitch = 0.12 + 0.3 * w;
    } else {
      const w = ease((u - 0.52) / 0.48);
      mix(B.THIGH_L, -0.5, 0, 0.14, 1); mix(B.THIGH_R, -0.5, 0, -0.14, 1);
      mix(B.SHIN_L, 0.45, 0, 0, 1); mix(B.SHIN_R, 0.45, 0, 0, 1);
      mix(B.FOOT_L, -0.5, 0, 0, 1); mix(B.FOOT_R, -0.5, 0, 0, 1);
      mix(B.SPINE1, 0.3, 0, 0, 1); mix(B.SPINE2, 0.24, 0, 0, 1);
      mix(B.HEAD, -0.2, 0.35, 0.15, 1);
      mix(B.ARM_L, -0.2, 0, 1.15, 1); mix(B.ARM_R, -0.2, 0, -1.15, 1);
      mix(B.FOREARM_L, -0.15, 0, 0, 1); mix(B.FOREARM_R, -0.15, 0, 0, 1);
      p.lift = -2.0 - 0.85 * w;
      p.rootPitch = 0.42 + 0.95 * w;
    }
  }

  // ── write the shown pose into the rig bones ────────────────────────────────
  private applyToRig(rig: HumanoidRig, s: PoseBuf) {
    const e = s.e;
    for (let i = 0; i < BONE_COUNT; i++) {
      const rx = e[i * 3], ry = e[i * 3 + 1], rz = e[i * 3 + 2];
      if (rx === 0 && ry === 0 && rz === 0) {
        rig.bones[i].quaternion.copy(rig.bindQuats[i]);
        continue;
      }
      QX.setFromAxisAngle(AXIS_X, rx);
      QZ.setFromAxisAngle(AXIS_Z, rz);
      QY.setFromAxisAngle(AXIS_Y, ry);
      QX.multiply(QZ).multiply(QY);
      rig.bones[i].quaternion.copy(rig.bindQuats[i]).multiply(QX);
    }
  }
}

// module-scope scratch (zero allocations in the update loop)
const OUT: PoseOut = { rootPitch: 0, rootRoll: 0, lift: 0, lungeF: 0, trail: 0, glow: 0, windUp: 0, dieT: -1, actionDone: false, footfalls: 0 };
const QX = new THREE.Quaternion(), QY = new THREE.Quaternion(), QZ = new THREE.Quaternion();
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
