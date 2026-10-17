// HumanoidRig — procedural skeleton + skinned-mesh figure builder.
//
// Ported in spirit from _refs/ELDEN-RING-Combat-Rewrite/src/rig.rs: a bone
// hierarchy (pelvis→spine→chest→neck→head, clavicle→arm→forearm→hand,
// hip→thigh→shin→foot) with body parts authored between joints and skinned by
// distance-falloff weights, so bent elbows/knees stay smooth.
//
// Scale: 1 unit = 1 foot (engine convention). Heroic proportions ~7.5 heads,
// ~6ft tall, slightly broad shoulders. Body geometry is authored ONCE per
// archetype|bodyType|hair|hood and shared between actors (skinning is computed
// per-actor from its own bone matrices). Colours are per-actor material clones
// keyed by role, so looks never leak through the shared geometry cache.
import * as THREE from 'three';
import type { TokenLook } from '../types';
import { softSprite } from '../sprites';
import {
  PAL, clothMat, leatherMat, skinMat, hairMat, decorMat, metalMat, boneMat, tatterMat,
  glowMat, cloakMat, cloneMat,
} from './rigMaterials';

// ── bone indices (fixed order; animations.ts relies on these) ─────────────────
export const B = {
  PELVIS: 0, SPINE1: 1, SPINE2: 2, NECK: 3, HEAD: 4,
  CLAV_L: 5, ARM_L: 6, FOREARM_L: 7, HAND_L: 8,
  CLAV_R: 9, ARM_R: 10, FOREARM_R: 11, HAND_R: 12,
  THIGH_L: 13, SHIN_L: 14, FOOT_L: 15,
  THIGH_R: 16, SHIN_R: 17, FOOT_R: 18,
} as const;
export const BONE_COUNT = 19;

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const IDQ = new THREE.Quaternion();
const IDENTITY = new THREE.Matrix4();
const WHITE = new THREE.Color(1, 1, 1);
const weightsScratch = new Float64Array(BONE_COUNT);

// child joint used for each bone's influence segment (leaf tips extended)
const SEG_CHILD: Record<number, number> = {
  [B.PELVIS]: B.SPINE1, [B.SPINE1]: B.SPINE2, [B.SPINE2]: B.NECK, [B.NECK]: B.HEAD,
  [B.CLAV_L]: B.ARM_L, [B.ARM_L]: B.FOREARM_L, [B.FOREARM_L]: B.HAND_L,
  [B.CLAV_R]: B.ARM_R, [B.ARM_R]: B.FOREARM_R, [B.FOREARM_R]: B.HAND_R,
  [B.THIGH_L]: B.SHIN_L, [B.SHIN_L]: B.FOOT_L,
  [B.THIGH_R]: B.SHIN_R, [B.SHIN_R]: B.FOOT_R,
};

// ── proportions (feet; heroic ~7.5 head-heights) ──────────────────────────────
export interface Proportions {
  pelvisY: number; spine1: number; spine2: number; neck: number; headDy: number;
  clavX: number; clavDy: number; armDx: number; upperArm: number; forearm: number; hand: number;
  hipDx: number; hipDy: number; thigh: number; shin: number; ankle: number;
  limbR: number;          // limb capsule radius multiplier
  torsoW: number;         // torso ellipse width scale
  skullScale: number;
  shoulderPad: number;    // pauldron radius
}

const BASE: Proportions = {
  pelvisY: 3.18, spine1: 0.55, spine2: 0.76, neck: 0.62, headDy: 0.32,
  clavX: 0.26, clavDy: 0.44, armDx: 0.56, upperArm: 1.22, forearm: 1.12, hand: 0.52,
  hipDx: 0.35, hipDy: -0.06, thigh: 1.48, shin: 1.34, ankle: 0.16,
  limbR: 1, torsoW: 1, skullScale: 1, shoulderPad: 0.3,
};

function presetFor(bodyType: string, gender: string, race: string, jitter: number): { prop: Proportions; raceScale: number } {
  const p = { ...BASE };
  const j = (v: number) => v * jitter;
  const raceLow = (race || '').toLowerCase();
  
  // ── 1. Race scaling & frame baseline ─────────────────────────────────────────
  let raceScale = 1.0;
  if (raceLow.includes('halfling') || raceLow.includes('gnome') || raceLow.includes('goblin') || raceLow.includes('kobold') || raceLow.includes('fairy')) {
    raceScale = 0.72; // small races naturally shrunk down
    p.skullScale = 1.12;
  } else if (raceLow.includes('dwarf')) {
    raceScale = 0.84; // stocky dwarven stature
    p.torsoW = 1.25;
    p.limbR = 1.2;
    p.clavX = 0.3;
    p.armDx = 0.62;
    p.shoulderPad = 0.35;
  } else if (raceLow.includes('goliath') || raceLow.includes('orc') || raceLow.includes('firbolg') || raceLow.includes('bugbear')) {
    raceScale = 1.14; // tall/powerful martial frames
    p.torsoW = 1.12;
    p.limbR = 1.1;
  }

  // ── 2. Gender form differences ──────────────────────────────────────────────
  if (gender === 'feminine') {
    p.clavX = Math.min(p.clavX, 0.23);
    p.armDx = Math.min(p.armDx, 0.48);
    p.hipDx = Math.max(p.hipDx, 0.38); // wider hips relative to shoulders
    p.torsoW *= 0.94;
    p.limbR *= 0.92;
    p.shoulderPad *= 0.88;
  } else {
    // masculine / default
    p.clavX = Math.max(p.clavX, 0.28);
    p.armDx = Math.max(p.armDx, 0.58);
    p.hipDx = Math.min(p.hipDx, 0.34); // athletic V-taper
  }

  // ── 3. Frame / weight variations ───────────────────────────────────────────
  if (bodyType === 'lean' || bodyType === 'slim') {
    p.limbR *= 0.84;
    p.torsoW *= 0.88;
    p.pelvisY = j(3.12);
    p.shoulderPad *= 0.85;
  } else if (bodyType === 'broad' || bodyType === 'heavy') {
    p.limbR *= 1.22;
    p.torsoW *= 1.20;
    p.pelvisY = j(3.22);
    p.shoulderPad *= 1.18;
  } else if (bodyType === 'tall') {
    p.pelvisY = j(3.38);
    p.thigh = 1.58;
    p.shin = 1.42;
    p.upperArm = 1.28;
    p.forearm = 1.18;
  } else {
    p.pelvisY = j(3.18);
  }

  return { prop: p, raceScale };
}

// deterministic micro-variation from a seed (xorshift-ish)
function hashSeed(s: number): number {
  let x = (s | 0) || 1;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x >>> 0) % 1000) / 1000;
}

// ── template materials (module singletons — geometry-bucket keys) ────────────
// Buckets are keyed by these; per-actor colours are applied to clones by role.
let TPL: Record<string, THREE.Material> | null = null;
function templates(): Record<string, THREE.Material> {
  if (TPL) return TPL;
  TPL = {
    cloth: clothMat(0xffffff),       // tunic/legs/hood — colour per actor
    skin: skinMat(0xffffff),         // head/hands — tone per actor
    hair: hairMat(0xffffff),         // hair — colour per actor
    eyes: glowMat(0xffffff),         // colored glowing irises
    decor: decorMat(0xffffff),       // facial warpaint/scars/runes
    horn: metalMat(0x2d2420, 0.2, 0.8), // tiefling horns / claws
    tusk: boneMat(PAL.bone),         // orc tusks
    leather: leatherMat(),
    metal: metalMat(PAL.iron, 0.5, 0.62),
    bone: boneMat(PAL.bone),
    rag: clothMat(0x241f1a),
    eyesSkel: glowMat(0xff4a2a),
    eyesWraith: glowMat(0x9fe8dc),
    void: glowMat(0x05070a),
    tatter: tatterMat(0x2a3438),
  };
  return TPL;
}

// default per-archetype cloth tints (muted, low-saturation)
const ARCH_CLOTH: Record<string, number> = {
  warden: 0x3f4650, shadowdancer: 0x23272e, ashen_mage: 0x4a3c2e, pale_priest: 0x6a6558,
};
const ARCH_EMBER: Record<string, number> = {
  warden: 0xe0a84a, shadowdancer: 0x9a7fd4, ashen_mage: 0xe08a3a, pale_priest: 0x7fd4c8,
};
const ARCH_CLOAK: Record<string, number> = {
  warden: 0x5a2f26, shadowdancer: 0x2a3038, ashen_mage: 0x5c4530, pale_priest: 0xcfc6b8,
};
const HAIR_CHOICES = [PAL.hairBlack, PAL.hairBrown, PAL.hairRust, PAL.hairAsh];

function parseHex(s: string | undefined, fallback: number): number {
  if (typeof s !== 'string' || !s) return fallback;   // numbers/objects must not crash the rig
  const n = parseInt(s.replace('#', ''), 16);
  return Number.isFinite(n) ? n : fallback;
}

// ── skinned-part factory ───────────────────────────────────────────────────────
interface PartOpts {
  tint?: THREE.Color;                     // vertex-colour multiplier (part shading)
  sx?: number; sy?: number; sz?: number;  // ellipse scale
  lock?: number;                          // lock all weights to one bone
  bias?: Record<number, number>;          // bone → weight multiplier
  radial?: number;                        // radial segments
  rotY?: number;                          // pre-rotation about Y (spheres/tubes)
}

class PartFactory {
  private buckets = new Map<THREE.Material, { pos: number[]; nor: number[]; uv: number[]; col: number[]; si: number[]; sw: number[] }>();
  private segTips: THREE.Vector3[];
  constructor(private joints: THREE.Vector3[]) {
    // influence segment endpoints for every bone (leaf bones get authored tips)
    this.segTips = [];
    for (let i = 0; i < BONE_COUNT; i++) {
      const tip = new THREE.Vector3();
      if (i === B.HEAD) tip.copy(joints[i]).add(V(0, 0.42, 0.08));
      else if (i === B.HAND_L || i === B.HAND_R) tip.copy(joints[i]).add(V(0, -0.5, 0.04));
      else if (i === B.FOOT_L || i === B.FOOT_R) tip.copy(joints[i]).add(V(0, -0.14, 0.62));
      else if (SEG_CHILD[i] !== undefined) tip.copy(joints[SEG_CHILD[i]]);
      else tip.copy(joints[i]);
      this.segTips.push(tip);
    }
  }

  private bucket(m: THREE.Material) {
    let b = this.buckets.get(m);
    if (!b) { b = { pos: [], nor: [], uv: [], col: [], si: [], sw: [] }; this.buckets.set(m, b); }
    return b;
  }

  /** push a primitive (already in bind space) with computed skin weights */
  private push(geom: THREE.BufferGeometry, mat: THREE.Material, o: PartOpts) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    const b = this.bucket(mat);
    const pos = g.attributes.position.array as ArrayLike<number>;
    const nor = (g.attributes.normal ? g.attributes.normal.array : null) as ArrayLike<number> | null;
    const uv = (g.attributes.uv ? g.attributes.uv.array : null) as ArrayLike<number> | null;
    const n = pos.length / 3;
    const tint = o.tint ?? WHITE;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      b.pos.push(x, y, z);
      if (nor) b.nor.push(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]); else b.nor.push(0, 1, 0);
      if (uv) b.uv.push(uv[i * 2], uv[i * 2 + 1]); else b.uv.push(0, 0);
      b.col.push(tint.r, tint.g, tint.b);
      // skin weights: top-4 bones by 1/d^2.4 over all bone segments
      let i0 = 0, i1 = 0, i2 = 0, i3 = 0;
      let w0 = 0, w1 = 0, w2 = 0, w3 = 0;
      if (o.lock !== undefined) { i0 = o.lock; w0 = 1; }
      else {
        const ws = weightsScratch;
        for (let k = 0; k < BONE_COUNT; k++) {
          const d0 = distToSegment(x, y, z, this.joints[k], this.segTips[k]);
          const d = d0 < 0.02 ? 0.02 : d0;
          let w = 1 / (d * d * d * d * d); // d^2.4 ≈ d^2·d^·... keep cheap: d^5 falloff is steep but joints still blend
          if (o.bias) { const m = o.bias[k]; if (m !== undefined) w *= m; }
          ws[k] = w;
        }
        for (let k = 0; k < BONE_COUNT; k++) {
          const w = ws[k];
          if (w <= 0) continue;
          if (w > w0) { w3 = w2; i3 = i2; w2 = w1; i2 = i1; w1 = w0; i1 = i0; w0 = w; i0 = k; }
          else if (w > w1) { w3 = w2; i3 = i2; w2 = w1; i2 = i1; w1 = w; i1 = k; }
          else if (w > w2) { w3 = w2; i3 = i2; w2 = w; i2 = k; }
          else if (w > w3) { w3 = w; i3 = k; }
        }
        const sum = w0 + w1 + w2 + w3;
        if (sum > 0) { w0 /= sum; w1 /= sum; w2 /= sum; w3 /= sum; }
        else { i0 = B.PELVIS; w0 = 1; }
      }
      b.si.push(i0, i1, i2, i3);
      b.sw.push(w0, w1, w2, w3);
    }
    if (g !== geom) g.dispose();
  }

  /** capsule spanning a→b (bind-space points); joint overlap rounds the bend */
  capsule(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, o: PartOpts = {}) {
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length(), 0.05);
    const body = Math.max(len - r * 1.25, 0.06);
    const g = new THREE.CapsuleGeometry(r, body, 4, o.radial ?? 9);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    const m = new THREE.Matrix4().compose(
      a.clone().add(b).multiplyScalar(0.5), q, V(o.sx ?? 1, 1, o.sz ?? 1));
    g.applyMatrix4(m);
    this.push(g, mat, o);
  }

  /** vertical tapered cylinder (skirts, shrouds, belts) centered at c, height h */
  tube(c: THREE.Vector3, rTop: number, rBot: number, h: number, mat: THREE.Material, o: PartOpts = {}, open = true) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, o.radial ?? 10, 1, open);
    if (o.rotY) g.rotateY(o.rotY);
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));
    this.push(g, mat, o);
  }

  box(c: THREE.Vector3, size: THREE.Vector3, mat: THREE.Material, o: PartOpts = {}, rot?: THREE.Euler) {
    const g = new THREE.BoxGeometry(size.x, size.y, size.z);
    const m = new THREE.Matrix4().compose(
      c, rot ? new THREE.Quaternion().setFromEuler(rot) : new THREE.Quaternion(), V(1, 1, 1));
    g.applyMatrix4(m);
    this.push(g, mat, o);
  }

  /** sphere (optionally partial: phiLen around, thetaLen from the top pole) */
  sphere(c: THREE.Vector3, r: number, mat: THREE.Material, o: PartOpts = {}, phiLen = Math.PI * 2, thetaLen = Math.PI) {
    const g = new THREE.SphereGeometry(r, o.radial ?? 10, 7, 0, phiLen, 0, thetaLen);
    // default gap (phiLen<2π) faces +X; spin it to +Z (the face)
    if (phiLen < Math.PI * 2) g.rotateY(2.42);
    const m = new THREE.Matrix4().compose(c, new THREE.Quaternion(), V(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
    g.applyMatrix4(m);
    this.push(g, mat, o);
  }

  /** rib arc: partial torus ringing the torso in the XZ plane, gap at the sternum */
  rib(c: THREE.Vector3, r: number, tube: number, mat: THREE.Material, o: PartOpts = {}) {
    const g = new THREE.TorusGeometry(r, tube, 5, 12, 4.4);
    g.rotateX(Math.PI / 2);
    g.rotateY(3.93); // sternum gap → +Z front
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));
    this.push(g, mat, o);
  }

  finish(): Map<THREE.Material, THREE.BufferGeometry> {
    const out = new Map<THREE.Material, THREE.BufferGeometry>();
    for (const [mat, b] of this.buckets) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(b.si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(b.sw, 4));
      out.set(mat, g);
    }
    this.buckets.clear();
    return out;
  }
}

function distToSegment(px: number, py: number, pz: number, a: THREE.Vector3, b: THREE.Vector3): number {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const apx = px - a.x, apy = py - a.y, apz = pz - a.z;
  const ab2 = abx * abx + aby * aby + abz * abz;
  let t = ab2 > 1e-9 ? (apx * abx + apy * aby + apz * abz) / ab2 : 0;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ── cloak: cheap verlet chains (3 for humanoids, 7 for wraith) ───────────────
class ClothChain {
  pts: THREE.Vector3[] = [];
  prev: THREE.Vector3[] = [];
  segLen: number;
  private meshes: THREE.Mesh[] = [];
  private anchorLocal: THREE.Vector3;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private tmpQ = new THREE.Quaternion();
  private tmpQ2 = new THREE.Quaternion();
  private dir = new THREE.Vector3();

  constructor(private bone: THREE.Bone, anchor: THREE.Vector3, segs: number, len: number,
    width: number, mat: THREE.Material, taper = 0.32) {
    this.segLen = len / segs;
    this.anchorLocal = anchor.clone();
    for (let i = 0; i <= segs; i++) {
      this.pts.push(new THREE.Vector3());
      this.prev.push(new THREE.Vector3());
    }
    for (let i = 0; i < segs; i++) {
      const w = width * (1 - taper * (i / Math.max(1, segs - 1)));
      const g = new THREE.PlaneGeometry(w, this.segLen * 1.06, 1, 2);
      g.translate(0, -this.segLen * 0.53, 0);
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      bone.add(mesh);
      this.meshes.push(mesh);
    }
    bone.updateWorldMatrix(true, false);
    this.bone.localToWorld(this.tmpA.copy(this.anchorLocal));
    for (let i = 0; i <= segs; i++) {
      this.pts[i].copy(this.tmpA).addScaledVector(DOWN, this.segLen * i);
      this.prev[i].copy(this.pts[i]);
    }
  }

  /** wind = world-space airflow the cloth reacts to (motion + breeze), ft/s */
  update(dt: number, windX: number, windZ: number, windUp: number, damp: number, floorY = 0.06) {
    const bone = this.bone;
    bone.localToWorld(this.tmpA.copy(this.anchorLocal));
    const pts = this.pts, prev = this.prev;
    const dampK = Math.exp(-damp * dt);
    const g = -26 * dt * dt;      // gravity (ft/s²)
    const wx = windX * 14 * dt * dt, wz = windZ * 14 * dt * dt, wu = windUp * dt * dt;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = prev[i];
      const vx = (p.x - q.x) * dampK, vy = (p.y - q.y) * dampK, vz = (p.z - q.z) * dampK;
      q.copy(p);
      p.x += vx - wx;
      p.y += vy + g + wu;
      p.z += vz - wz;
      if (p.y < floorY) p.y = floorY;
    }
    pts[0].copy(this.tmpA);
    prev[0].copy(this.tmpA);
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        this.dir.subVectors(b, a);
        const L = this.dir.length() || 1e-5;
        const corr = (L - this.segLen) / L;
        if (i === 1) b.addScaledVector(this.dir, -corr);
        else { a.addScaledVector(this.dir, corr * 0.5); b.addScaledVector(this.dir, -corr * 0.5); }
      }
    }
    // place segment meshes (anchor-bone local; one frame of matrixWorld lag = cloth weight)
    bone.getWorldQuaternion(this.tmpQ2);
    this.tmpQ.copy(this.tmpQ2).invert();
    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];
      this.tmpB.copy(pts[i]);
      bone.worldToLocal(this.tmpB);
      mesh.position.copy(this.tmpB);
      this.dir.subVectors(pts[i + 1], pts[i]).normalize();
      this.tmpQ2.setFromUnitVectors(DOWN, this.dir);
      mesh.quaternion.copy(this.tmpQ).multiply(this.tmpQ2);
    }
  }

  dispose() {
    for (const m of this.meshes) { m.removeFromParent(); m.geometry.dispose(); }
  }
}

// ── the rig ────────────────────────────────────────────────────────────────────
interface CachedBody {
  geoms: Map<THREE.Material, THREE.BufferGeometry>;  // template material → shared geometry
}

export class HumanoidRig {
  body = new THREE.Group();          // bones + skinned meshes (bobbed/leaned by Actors)
  bones: THREE.Bone[] = [];
  skeleton!: THREE.Skeleton;
  prop: Proportions;
  bindQuats: THREE.Quaternion[] = [];
  joints: THREE.Vector3[] = [];

  // equipment + FX anchors (equipment.ts fills equip*; Actors reads the rest)
  equipR = new THREE.Group();
  equipL = new THREE.Group();
  palmR = new THREE.Object3D();
  palmL = new THREE.Object3D();
  headTop = new THREE.Object3D();
  trailTip: THREE.Object3D | null = null;
  trailBase: THREE.Object3D | null = null;

  isWraith: boolean;
  isSkeleton: boolean;
  hasCloak: boolean;
  topY: number;                      // crown height for plaque / screen pos
  raceScale: number = 1.0;
  palmSprite: THREE.Sprite | null = null;   // spell ember (off hand)
  innerGlow: THREE.Sprite | null = null;    // wraith core glow
  private chains: ClothChain[] = [];
  private bodyMats: THREE.MeshStandardMaterial[] = []; // per-actor clones (dissolve)
  private flash = 0;                                   // P2.6 hit flash energy
  private flashOrig: { mat: THREE.MeshStandardMaterial; c: THREE.Color; i: number }[] | null = null;
  private skinned: THREE.SkinnedMesh[] = [];

  private static bodyCache = new Map<string, CachedBody>();

  constructor(archetype: string, look: TokenLook) {
    this.isWraith = archetype === 'wraith';
    this.isSkeleton = archetype === 'skeleton';

    const seed = look.seed ?? 0;
    const jitterBucket = Math.floor(hashSeed(seed + 7) * 5) - 2;   // -2..2
    const jitter = 1 + jitterBucket * 0.012;                        // ±2.4% height
    let bodyType = look.bodyType ?? 'standard';
    if (this.isWraith) bodyType = 'tall';
    if (this.isSkeleton) bodyType = 'lean';
    const gender = look.gender ?? 'masculine';
    const race = look.race ?? '';
    const preset = presetFor(bodyType, gender, race, jitter);
    this.prop = preset.prop;
    this.raceScale = preset.raceScale;
    if (this.isSkeleton) { this.prop.limbR = 0.52; this.prop.torsoW = 0.86; this.prop.skullScale = 1.14; }
    if (this.isWraith) { this.prop.limbR = 0.5; this.prop.torsoW = 0.8; this.prop.pelvisY += 1.05; }
    const P = this.prop;

    // ── skeleton (bind pose: limbs straight, arms/legs slightly splayed) ──
    this.buildBones();
    if (this.raceScale !== 1.0) {
      this.body.scale.setScalar(this.raceScale);
    }

    // ── body geometry (shared, cached per archetype|gender|bodyType|hair|race|hood|decor|jitter) ──
    const T = templates();
    const hair = look.hair ?? (this.isSkeleton || this.isWraith ? 'none' : 'short');
    const hoodUp = look.hoodUp ?? (archetype === 'shadowdancer' || this.isWraith || this.isSkeleton);
    const decor = look.faceDecor ?? 'none';
    const cacheKey = `${archetype}|${gender}|${bodyType}|${hair}|${race}|${hoodUp ? 1 : 0}|${decor}|${jitterBucket}`;
    let cached = HumanoidRig.bodyCache.get(cacheKey);
    if (!cached) {
      const f = new PartFactory(this.joints);
      if (this.isWraith) this.wraithParts(f, T);
      else if (this.isSkeleton) this.skeletonParts(f, T);
      else this.humanoidParts(f, T, { gender, hair, hoodUp, race, faceDecor: decor });
      cached = { geoms: f.finish() };
      HumanoidRig.bodyCache.set(cacheKey, cached);
    }

    // ── per-actor material clones (look colours / dissolve never touch others) ──
    const clothColor = parseHex(look.clothTint, ARCH_CLOTH[archetype] ?? 0x33383f);
    const skinColor = parseHex(look.skinTone, this.isSkeleton ? PAL.bone : (this.isWraith ? 0xb8c4be : PAL.skinAshen));
    const hairColor = parseHex(look.hairColor, HAIR_CHOICES[Math.floor(hashSeed(seed + 31) * HAIR_CHOICES.length)]);
    const eyeColor = parseHex(look.eyeColor, 0xc8781f);
    let decorColor = 0xba766c;
    if (decor === 'scars') decorColor = 0xb25950;
    else if (decor === 'warpaint') decorColor = 0x942222;
    else if (decor === 'runes') decorColor = 0xe09838;
    else if (decor === 'skull') decorColor = 0xdad5ca;
    else if (decor === 'freckles') decorColor = 0x5c3822;

    const roleColor: Record<string, number | null> = {
      cloth: clothColor, skin: skinColor, hair: hairColor,
      eyes: eyeColor, decor: decorColor, horn: 0x241d1a, tusk: PAL.bone,
      leather: null, metal: null, bone: null, rag: null,
      eyesSkel: null, eyesWraith: null, void: null, tatter: null,
    };
    const nameOf = (m: THREE.Material) => Object.keys(T).find(k => T[k] === m);

    const matMap = new Map<THREE.Material, THREE.Material>();
    for (const [tpl] of cached.geoms) {
      const clone = cloneMat(tpl);
      const role = nameOf(tpl);
      const col = role ? roleColor[role] : null;
      if (col !== null && col !== undefined && (clone as any).color) {
        (clone as any).color.set(col);
      }
      matMap.set(tpl, clone);
      if ((clone as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        this.bodyMats.push(clone as THREE.MeshStandardMaterial);
      }
    }

    // ── skinned meshes + bind ──
    this.body.add(this.bones[B.PELVIS]);
    this.body.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(this.bones);
    for (const [tpl, geom] of cached.geoms) {
      const mesh = new THREE.SkinnedMesh(geom, matMap.get(tpl)!);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      this.body.add(mesh);
      mesh.bind(this.skeleton, IDENTITY);
      this.skinned.push(mesh);
    }

    // hand equipment anchors — palm frame: -Y runs out of the fist, +Z = palm normal
    this.bones[B.HAND_R].add(this.equipR);
    this.bones[B.HAND_L].add(this.equipL);
    this.equipR.position.set(0, -0.24, 0.05);
    this.equipL.position.set(0, -0.24, 0.05);
    this.bones[B.HAND_R].add(this.palmR); this.palmR.position.set(0, -0.18, 0.13);
    this.bones[B.HAND_L].add(this.palmL); this.palmL.position.set(0, -0.18, 0.13);
    this.bones[B.HEAD].add(this.headTop);
    this.headTop.position.set(0, 0.5 * P.skullScale, 0.05);

    // ── cloak / ribbons ──
    this.hasCloak = false;
    if (!this.isWraith && !this.isSkeleton) {
      const cm = cloakMat(parseHex(look.cloakColor, ARCH_CLOAK[archetype] ?? 0x262b33));
      const cape = archetype === 'warden' || archetype === 'pale_priest';   // full cape
      this.addChain(this.bones[B.SPINE2], V(-0.52, 0.32, -0.36), cape ? 5 : 4, cape ? 3.6 : 3.0, 1.24, cm);
      this.addChain(this.bones[B.SPINE2], V(0, 0.36, -0.40), cape ? 5 : 4, cape ? 3.75 : 3.15, 1.42, cm);
      this.addChain(this.bones[B.SPINE2], V(0.52, 0.32, -0.36), cape ? 5 : 4, cape ? 3.6 : 3.0, 1.24, cm);
      this.hasCloak = true;
    } else if (this.isWraith) {
      const t = cloneMat(T.tatter);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        this.addChain(this.bones[B.PELVIS], V(Math.cos(a) * 0.5, -0.1, Math.sin(a) * 0.42), 4, 2.9, 0.5, t, 0.5);
      }
      this.addChain(this.bones[B.PELVIS], V(-0.55, -0.3, 0.3), 5, 3.9, 0.24, t, 0.15);
      this.addChain(this.bones[B.PELVIS], V(0.55, -0.3, 0.3), 5, 3.9, 0.24, t, 0.15);
    }

    // spell ember on the off-hand palm
    if (!this.isWraith && !this.isSkeleton) {
      this.palmSprite = makeGlowSprite(ARCH_EMBER[archetype] ?? 0xe0a84a, 0.001);
      this.palmL.add(this.palmSprite);
    }
    if (this.isWraith) {
      this.innerGlow = makeGlowSprite(0x7fe8d8, 2.4);
      this.innerGlow.position.set(0, 0.35, 0);
      this.bones[B.SPINE2].add(this.innerGlow);
    }

    this.topY = (this.joints[B.HEAD].y + 0.62 * P.skullScale + (hoodUp ? 0.18 : 0)) * this.raceScale;
    this.topY = Math.max(this.topY, 3.8 * this.raceScale);
  }

  private addChain(bone: THREE.Bone, anchor: THREE.Vector3, segs: number, len: number, w: number, mat: THREE.Material, taper = 0.32) {
    this.chains.push(new ClothChain(bone, anchor, segs, len, w, cloneMat(mat), taper));
  }

  private buildBones() {
    const P = this.prop;
    const mk = () => new THREE.Bone();
    const pelvis = mk(); pelvis.position.set(0, P.pelvisY, 0);
    const spine1 = mk(); spine1.position.set(0, P.spine1, 0.02);
    const spine2 = mk(); spine2.position.set(0, P.spine2, 0);
    const neck = mk(); neck.position.set(0, P.neck, 0.03);
    const head = mk(); head.position.set(0, P.headDy, 0.02);
    spine1.add(spine2); spine2.add(neck); neck.add(head); pelvis.add(spine1);

    const clavL = mk(); clavL.position.set(P.clavX, P.clavDy, 0);
    const armL = mk(); armL.position.set(P.armDx, 0, 0);
    const foreL = mk(); foreL.position.set(0, -P.upperArm, 0);
    const handL = mk(); handL.position.set(0, -P.forearm, 0);
    clavL.add(armL); armL.add(foreL); foreL.add(handL); spine2.add(clavL);
    const clavR = mk(); clavR.position.set(-P.clavX, P.clavDy, 0);
    const armR = mk(); armR.position.set(-P.armDx, 0, 0);
    const foreR = mk(); foreR.position.set(0, -P.upperArm, 0);
    const handR = mk(); handR.position.set(0, -P.forearm, 0);
    clavR.add(armR); armR.add(foreR); foreR.add(handR); spine2.add(clavR);

    const thighL = mk(); thighL.position.set(P.hipDx, P.hipDy, 0);
    const shinL = mk(); shinL.position.set(0, -P.thigh, 0);
    const footL = mk(); footL.position.set(0, -P.shin, 0.02);
    thighL.add(shinL); shinL.add(footL); pelvis.add(thighL);
    const thighR = mk(); thighR.position.set(-P.hipDx, P.hipDy, 0);
    const shinR = mk(); shinR.position.set(0, -P.thigh, 0);
    const footR = mk(); footR.position.set(0, -P.shin, 0.02);
    thighR.add(shinR); shinR.add(footR); pelvis.add(thighR);

    this.bones = [
      pelvis, spine1, spine2, neck, head,
      clavL, armL, foreL, handL,
      clavR, armR, foreR, handR,
      thighL, shinL, footL,
      thighR, shinR, footR,
    ];

    // bind quats: arms splayed ~8°, legs ~2.5° — everything else identity
    this.bindQuats = this.bones.map(() => new THREE.Quaternion());
    this.bindQuats[B.ARM_L].setFromAxisAngle(Z_AXIS, 0.14);
    this.bindQuats[B.ARM_R].setFromAxisAngle(Z_AXIS, -0.14);
    this.bindQuats[B.THIGH_L].setFromAxisAngle(Z_AXIS, 0.045);
    this.bindQuats[B.THIGH_R].setFromAxisAngle(Z_AXIS, -0.045);
    for (let i = 0; i < BONE_COUNT; i++) this.bones[i].quaternion.copy(this.bindQuats[i]);
    this.body.updateMatrixWorld(true);
    this.joints = this.bones.map(b => b.getWorldPosition(new THREE.Vector3()));
  }

  // ── body part recipes (bind space) ─────────────────────────────────────────
  private humanoidParts(f: PartFactory, T: Record<string, THREE.Material>, cfg: { gender: string; hair: string; hoodUp: boolean; race: string; faceDecor: string }) {
    const J = this.joints, P = this.prop;
    const lerp = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
    const shade = (m: number) => new THREE.Color(m, m, m);
    const chest = lerp(J[B.SPINE2], J[B.NECK], 0.42);
    const waist = lerp(J[B.SPINE1], J[B.SPINE2], 0.12);
    const LR = P.limbR;

    // torso: tunic over belly + chest (broad shoulders, tapered waist)
    f.capsule(waist, chest, 0.42 * P.torsoW, T.cloth, { sx: 1.12, sz: 0.86 });
    f.capsule(chest, lerp(J[B.SPINE2], J[B.NECK], 0.8), 0.5 * P.torsoW, T.cloth, { sx: 1.18, sz: 0.82, tint: shade(0.96) });

    // feminine bust contouring
    if (cfg.gender === 'feminine') {
      f.sphere(chest.clone().add(V(0.16 * P.torsoW, 0.04, 0.35)), 0.22 * P.torsoW, T.cloth,
        { sx: 1.05, sy: 0.92, sz: 1.15, tint: shade(0.96), bias: { [B.SPINE2]: 8 } });
      f.sphere(chest.clone().add(V(-0.16 * P.torsoW, 0.04, 0.35)), 0.22 * P.torsoW, T.cloth,
        { sx: 1.05, sy: 0.92, sz: 1.15, tint: shade(0.96), bias: { [B.SPINE2]: 8 } });
    }

    // sleeves + pants (clean bare limbs ready for modular equipment)
    for (const side of [B.ARM_L, B.ARM_R]) {
      const fore = side === B.ARM_L ? B.FOREARM_L : B.FOREARM_R;
      const hand = side === B.ARM_L ? B.HAND_L : B.HAND_R;
      const sh = J[side].clone().add(V(0, 0.06, 0));
      f.capsule(sh, lerp(J[fore], sh, 0.06), 0.17 * LR, T.cloth, { tint: shade(0.92) });
      f.capsule(J[fore], J[hand], 0.13 * LR, T.cloth, { tint: shade(0.86) });
    }
    for (const [th, sh, ft] of [[B.THIGH_L, B.SHIN_L, B.FOOT_L], [B.THIGH_R, B.SHIN_R, B.FOOT_R]] as [number, number, number][]) {
      const hip = J[th].clone().add(V(0, -0.04, 0));
      f.capsule(hip, J[sh], 0.2 * LR, T.cloth, { tint: shade(0.62) });
      f.capsule(J[sh], lerp(J[ft], J[sh], 0.28), 0.16 * LR, T.cloth, { tint: shade(0.56) });
    }
    // joint wraps: leather bands bridge the capsule seams (elbows + knees)
    for (const side of [B.FOREARM_L, B.FOREARM_R]) {
      f.box(J[side].clone().add(V(0, 0.05, 0.02)), V(0.34, 0.3, 0.34), T.leather, { tint: shade(0.9) });
    }
    for (const side of [B.SHIN_L, B.SHIN_R]) {
      f.box(J[side].clone().add(V(0, 0.12, 0.03)), V(0.4, 0.36, 0.42), T.leather, { tint: shade(0.95) });
    }
    // boots + feet
    for (const ft of [B.FOOT_L, B.FOOT_R]) {
      const a = J[ft];
      f.box(V(a.x, a.y + 0.16, a.z), V(0.34, 0.4, 0.4), T.leather, { tint: shade(0.55) });
      f.box(V(a.x, a.y - 0.07, a.z + 0.22), V(0.34, 0.22, 0.78), T.leather, { tint: shade(0.7) });
      f.box(V(a.x, a.y - 0.07, a.z + 0.58), V(0.3, 0.16, 0.22), T.leather, { tint: shade(0.5) });
    }
    // simple waist belt + buckle (no chest strap)
    f.tube(V(0, J[B.PELVIS].y + 0.42, 0), 0.47 * P.torsoW, 0.47 * P.torsoW, 0.16, T.leather, { tint: shade(0.85) }, false);
    f.box(V(0, J[B.PELVIS].y + 0.42, 0.46 * P.torsoW), V(0.15, 0.15, 0.06), T.metal, { bias: { [B.SPINE1]: 4, [B.PELVIS]: 3 } });

    // bracers + glove mitts
    for (const [fo, ha] of [[B.FOREARM_L, B.HAND_L], [B.FOREARM_R, B.HAND_R]] as [number, number][]) {
      f.capsule(lerp(J[fo], J[ha], 0.3), lerp(J[fo], J[ha], 0.86), 0.155 * LR, T.leather, { tint: shade(0.9) });
      f.sphere(J[ha].clone().add(V(0, -0.16, 0.01)), 0.145, T.leather,
        { sx: 1.1, sy: 1.35, sz: 0.85, tint: shade(0.75), bias: { [ha]: 8 } });
    }

    // neck + single sculpt head (skin) — clean cranium, jaw contour, ears, and forward eyes
    f.capsule(J[B.NECK], lerp(J[B.HEAD], J[B.NECK], 0.2), 0.135, T.skin, { sx: 0.95, sz: 0.95, tint: shade(0.82) });
    const H = J[B.HEAD], S = P.skullScale;
    // Single unified head sphere (no nested spheres)
    f.sphere(H, 0.38 * S, T.skin, { sx: 0.88, sy: 1.04, sz: 0.95, bias: { [B.HEAD]: 20 } });
    // Tapered jaw & chin
    f.box(H.clone().add(V(0, -0.22 * S, 0.10 * S)), V(0.28 * S, 0.18 * S, 0.26 * S), T.skin, { bias: { [B.HEAD]: 20 } });
    // Subtle nose bridge
    f.box(H.clone().add(V(0, -0.04 * S, 0.37 * S)), V(0.065 * S, 0.12 * S, 0.07 * S), T.skin, { bias: { [B.HEAD]: 20 } });

    // Normal humanoid ears (if not elf)
    if (!cfg.race.toLowerCase().includes('elf') && !cfg.race.toLowerCase().includes('fairy')) {
      for (const side of [1, -1]) {
        f.capsule(
          H.clone().add(V(side * 0.34 * S, 0.02 * S, -0.02 * S)),
          H.clone().add(V(side * 0.36 * S, -0.08 * S, -0.04 * S)),
          0.045 * S,
          T.skin,
          { sx: 0.6, sz: 1.1, bias: { [B.HEAD]: 20 } }
        );
      }
    }

    // Eyes with visible irises & pupils on the front facial plane
    for (const ex of [-0.115, 0.115]) {
      // Sclera / eye socket
      f.sphere(H.clone().add(V(ex * S, 0.02 * S, 0.355 * S)), 0.042 * S, T.void, { sx: 1.1, sy: 0.85, sz: 0.4, bias: { [B.HEAD]: 50 } });
      // Iris (colored with T.eyes)
      f.sphere(H.clone().add(V(ex * S, 0.02 * S, 0.366 * S)), 0.032 * S, T.eyes, { sx: 1.0, sy: 1.0, sz: 0.3, bias: { [B.HEAD]: 50 } });
      // Pupil (dark center)
      f.sphere(H.clone().add(V(ex * S, 0.02 * S, 0.374 * S)), 0.016 * S, T.void, { sx: 1.0, sy: 1.0, sz: 0.2, bias: { [B.HEAD]: 50 } });
    }

    // ── racial anatomical features ──────────────────────────────────────────
    const raceLow = (cfg.race || '').toLowerCase();
    const isElf = raceLow.includes('elf') || raceLow.includes('fairy');
    const isTiefling = raceLow.includes('tiefling') || raceLow.includes('hexblood') || raceLow.includes('satyr');
    const isDwarf = raceLow.includes('dwarf');
    const isOrc = raceLow.includes('orc') || raceLow.includes('goliath');
    const isDragon = raceLow.includes('dragon') || raceLow.includes('lizard') || raceLow.includes('kobold');
    const hasTail = isTiefling || raceLow.includes('lizard') || raceLow.includes('tabaxi');

    // Pointed ears (Elves)
    if (isElf) {
      for (const side of [1, -1]) {
        f.capsule(
          H.clone().add(V(side * 0.34 * S, 0.02 * S, -0.02 * S)),
          H.clone().add(V(side * 0.58 * S, 0.22 * S, -0.22 * S)),
          0.065 * S,
          T.skin,
          { sx: 0.5, sz: 1.1, bias: { [B.HEAD]: 40 } }
        );
      }
    }

    // Horns (Tieflings)
    if (isTiefling) {
      for (const side of [1, -1]) {
        const h0 = H.clone().add(V(side * 0.18 * S, 0.26 * S, 0.16 * S));
        const h1 = H.clone().add(V(side * 0.28 * S, 0.48 * S, 0.02 * S));
        const h2 = H.clone().add(V(side * 0.36 * S, 0.68 * S, -0.16 * S));
        f.capsule(h0, h1, 0.08 * S, T.horn, { bias: { [B.HEAD]: 40 } });
        f.capsule(h1, h2, 0.055 * S, T.horn, { bias: { [B.HEAD]: 40 } });
      }
    }

    // Tusks (Orcs)
    if (isOrc) {
      for (const side of [1, -1]) {
        const t0 = H.clone().add(V(side * 0.12 * S, -0.24 * S, 0.28 * S));
        const t1 = H.clone().add(V(side * 0.14 * S, -0.08 * S, 0.35 * S));
        f.capsule(t0, t1, 0.038 * S, T.tusk, { bias: { [B.HEAD]: 40 } });
      }
    }

    // Dwarven full braided beard
    if (isDwarf) {
      const b0 = H.clone().add(V(0, -0.16 * S, 0.24 * S));
      const b1 = H.clone().add(V(0, -0.58 * S, 0.32 * S));
      f.capsule(b0, b1, 0.22 * S, T.hair, { sx: 1.25, sz: 0.9, bias: { [B.HEAD]: 25, [B.NECK]: 15 } });
      for (const side of [1, -1]) {
        f.capsule(
          H.clone().add(V(side * 0.14 * S, -0.38 * S, 0.3 * S)),
          H.clone().add(V(side * 0.16 * S, -0.85 * S, 0.32 * S)),
          0.075 * S,
          T.hair,
          { bias: { [B.HEAD]: 15, [B.NECK]: 20 } }
        );
      }
    }

    // Tail (Tieflings / Lizards)
    if (hasTail) {
      let tPos = V(0, J[B.PELVIS].y - 0.1, -0.32);
      const tSegs = [
        V(0, J[B.PELVIS].y - 0.45, -0.55),
        V(0, J[B.PELVIS].y - 0.88, -0.72),
        V(0.08, J[B.PELVIS].y - 1.25, -0.65),
        V(0.12, J[B.PELVIS].y - 1.48, -0.42),
      ];
      for (let i = 0; i < tSegs.length; i++) {
        const next = tSegs[i];
        const r = 0.08 - i * 0.012;
        f.capsule(tPos, next, Math.max(0.03, r), T.horn, { bias: { [B.PELVIS]: 30 } });
        tPos = next;
      }
    }

    // Dragonborn snout & crest
    if (isDragon) {
      f.box(H.clone().add(V(0, -0.06 * S, 0.42 * S)), V(0.24 * S, 0.16 * S, 0.24 * S), T.skin, { bias: { [B.HEAD]: 40 } });
      for (let i = 0; i < 3; i++) {
        f.box(H.clone().add(V(0, (0.32 + i * 0.08) * S, (-0.05 - i * 0.12) * S)), V(0.06 * S, 0.14 * S, 0.12 * S),
          T.horn, { bias: { [B.HEAD]: 40 } });
      }
    }

    // ── 3D facial markings ──────────────────────────────────────────────────
    // ── 3D facial markings (precisely positioned on the front facial plane) ──
    if (cfg.faceDecor === 'scars') {
      f.box(H.clone().add(V(-0.13 * S, 0.02 * S, 0.372 * S)), V(0.035 * S, 0.24 * S, 0.02 * S), T.decor,
        { bias: { [B.HEAD]: 50 } }, new THREE.Euler(0, 0, 0.3));
    } else if (cfg.faceDecor === 'warpaint') {
      f.box(H.clone().add(V(0, 0.02 * S, 0.372 * S)), V(0.44 * S, 0.065 * S, 0.02 * S), T.decor,
        { bias: { [B.HEAD]: 50 } });
    } else if (cfg.faceDecor === 'runes') {
      f.box(H.clone().add(V(0, 0.18 * S, 0.358 * S)), V(0.09 * S, 0.09 * S, 0.025 * S), T.decor,
        { bias: { [B.HEAD]: 50 } }, new THREE.Euler(0, 0, Math.PI / 4));
      f.sphere(H.clone().add(V(0, 0.18 * S, 0.364 * S)), 0.03 * S, T.decor,
        { bias: { [B.HEAD]: 50 } });
    } else if (cfg.faceDecor === 'freckles') {
      for (const fx of [-0.14, -0.07, 0.07, 0.14]) {
        f.sphere(H.clone().add(V(fx * S, -0.03 * S, 0.37 * S)), 0.016 * S, T.decor,
          { bias: { [B.HEAD]: 50 } });
      }
    } else if (cfg.faceDecor === 'skull') {
      f.box(H.clone().add(V(0, -0.16 * S, 0.35 * S)), V(0.24 * S, 0.12 * S, 0.03 * S), T.decor,
        { bias: { [B.HEAD]: 50 } });
    }

    // ── 10 modular hairstyles (Lego-style snap-on pieces over a clean bald head) ──
    const hStyle = cfg.hair;
    if (hStyle === 'short') {
      // Cropped warrior cut
      f.sphere(H.clone().add(V(0, 0.07 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.box(H.clone().add(V(0, 0.18 * S, 0.22 * S)), V(0.34 * S, 0.12 * S, 0.24 * S), T.hair, { bias: { [B.HEAD]: 20 } });
      for (const side of [1, -1]) {
        f.box(H.clone().add(V(side * 0.34 * S, 0.02 * S, 0.04 * S)), V(0.04 * S, 0.18 * S, 0.18 * S), T.hair, { bias: { [B.HEAD]: 20 } });
      }
    } else if (hStyle === 'topknot') {
      // Topknot: smooth swept cap + bun + tie
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.39 * S, T.hair,
        { sx: 0.93, sy: 0.97, sz: 0.98, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.5);
      f.sphere(H.clone().add(V(0, 0.44 * S, -0.04 * S)), 0.15 * S, T.hair, { bias: { [B.HEAD]: 30 } });
      f.tube(V(0, H.y + 0.38 * S, -0.04 * S), 0.08 * S, 0.09 * S, 0.05 * S, T.leather, { bias: { [B.HEAD]: 30 } });
    } else if (hStyle === 'long') {
      // Long hair flowing down the back and shoulders
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.box(H.clone().add(V(0, -0.32 * S, -0.28 * S)), V(0.44 * S, 0.82 * S, 0.14 * S), T.hair, { bias: { [B.HEAD]: 10, [B.NECK]: 10 } });
      for (const side of [1, -1]) {
        f.capsule(H.clone().add(V(side * 0.28 * S, 0.04 * S, 0.06 * S)), H.clone().add(V(side * 0.26 * S, -0.5 * S, 0.12 * S)),
          0.065 * S, T.hair, { bias: { [B.HEAD]: 12, [B.NECK]: 10 } });
      }
    } else if (hStyle === 'braids') {
      // Viking braids
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      for (const side of [1, -1]) {
        f.capsule(H.clone().add(V(side * 0.26 * S, 0.04 * S, 0.08 * S)), H.clone().add(V(side * 0.2 * S, -0.65 * S, 0.18 * S)),
          0.07 * S, T.hair, { bias: { [B.HEAD]: 12, [B.NECK]: 15 } });
      }
    } else if (hStyle === 'ponytail') {
      // High ponytail arching back
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.sphere(H.clone().add(V(0, 0.34 * S, -0.22 * S)), 0.13 * S, T.hair, { bias: { [B.HEAD]: 25 } });
      f.capsule(H.clone().add(V(0, 0.32 * S, -0.24 * S)), H.clone().add(V(0.04 * S, -0.38 * S, -0.46 * S)),
        0.095 * S, T.hair, { bias: { [B.HEAD]: 25 } });
    } else if (hStyle === 'flowing') {
      // Flowing locks cascading over shoulders and back
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.box(H.clone().add(V(0, -0.42 * S, -0.3 * S)), V(0.56 * S, 1.05 * S, 0.18 * S), T.hair, { bias: { [B.HEAD]: 10, [B.NECK]: 10 } });
      for (const side of [1, -1]) {
        f.capsule(H.clone().add(V(side * 0.28 * S, 0.02 * S, 0.06 * S)), H.clone().add(V(side * 0.28 * S, -0.68 * S, 0.18 * S)),
          0.085 * S, T.hair, { bias: { [B.HEAD]: 10, [B.NECK]: 12 } });
      }
    } else if (hStyle === 'twin_braids') {
      // Twin maiden braids hanging over front
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      for (const side of [1, -1]) {
        f.capsule(H.clone().add(V(side * 0.28 * S, 0.04 * S, 0.04 * S)), H.clone().add(V(side * 0.24 * S, -0.72 * S, 0.22 * S)),
          0.065 * S, T.hair, { bias: { [B.HEAD]: 10, [B.NECK]: 15 } });
        f.sphere(H.clone().add(V(side * 0.24 * S, -0.74 * S, 0.22 * S)), 0.04 * S, T.leather, { bias: { [B.HEAD]: 10 } });
      }
    } else if (hStyle === 'chignon') {
      // Low braided chignon bun at nape
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.sphere(H.clone().add(V(0, -0.08 * S, -0.38 * S)), 0.22 * S, T.hair, { sx: 1.2, sy: 1.0, sz: 0.85, bias: { [B.HEAD]: 25 } });
      f.rib(H.clone().add(V(0, -0.08 * S, -0.38 * S)), 0.18 * S, 0.04 * S, T.hair, { bias: { [B.HEAD]: 25 } });
    } else if (hStyle === 'bob') {
      // Pixie bob contouring the jawline
      f.sphere(H.clone().add(V(0, 0.06 * S, -0.01 * S)), 0.395 * S, T.hair,
        { sx: 0.94, sy: 0.98, sz: 1.0, bias: { [B.HEAD]: 20 } }, Math.PI * 2, Math.PI * 0.52);
      f.capsule(H.clone().add(V(0.36 * S, 0.08 * S, 0)), H.clone().add(V(0.32 * S, -0.32 * S, 0.12 * S)), 0.11 * S, T.hair, { bias: { [B.HEAD]: 25 } });
      f.capsule(H.clone().add(V(-0.36 * S, 0.08 * S, 0)), H.clone().add(V(-0.32 * S, -0.32 * S, 0.12 * S)), 0.11 * S, T.hair, { bias: { [B.HEAD]: 25 } });
      f.box(H.clone().add(V(0, -0.15 * S, -0.34 * S)), V(0.48 * S, 0.45 * S, 0.14 * S), T.hair, { bias: { [B.HEAD]: 25 } });
    }

    // hood up: deep cowl; down: bare neck/shoulders (no collar)
    if (cfg.hoodUp) {
      const cowl = H.clone().add(V(0, 0.08 * S, -0.05));
      f.sphere(cowl, 0.5 * S, T.cloth,
        { sx: 1.02, sy: 1.12, sz: 1.06, tint: shade(0.9), bias: { [B.HEAD]: 5, [B.NECK]: 0.6 } },
        Math.PI * 1.45, Math.PI * 0.72);
      f.tube(V(0, J[B.NECK].y + 0.1, -0.1), 0.42, 0.62, 0.55, T.cloth, { tint: shade(0.75), bias: { [B.NECK]: 4, [B.SPINE2]: 2 } });
    }
  }

  private skeletonParts(f: PartFactory, T: Record<string, THREE.Material>) {
    const J = this.joints, P = this.prop;
    const lerp = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
    const shade = (m: number) => new THREE.Color(m, m, m);
    const boneM = T.bone;
    // pelvis wedge + tattered rags
    f.box(V(0, J[B.PELVIS].y, 0), V(0.6, 0.3, 0.4), boneM, { bias: { [B.PELVIS]: 8 } });
    f.box(V(0, J[B.PELVIS].y - 0.55, 0.2), V(0.44, 0.85, 0.06), T.rag, { tint: shade(0.8), bias: { [B.PELVIS]: 6 } }, new THREE.Euler(0.06, 0.1, 0));
    f.box(V(0.28, J[B.PELVIS].y - 0.5, 0.05), V(0.3, 0.7, 0.05), T.rag, { tint: shade(0.62), bias: { [B.PELVIS]: 6 } }, new THREE.Euler(0.1, 0, 0.22));
    // spine + open rib cage
    f.capsule(J[B.SPINE1], lerp(J[B.SPINE2], J[B.NECK], 0.1), 0.085, boneM, { bias: { [B.SPINE1]: 3, [B.SPINE2]: 3 } });
    for (let i = 0; i < 4; i++) {
      f.box(V(0, lerp(J[B.SPINE1], J[B.SPINE2], i / 3).y, -0.13), V(0.15, 0.09, 0.11), boneM, { bias: { [B.SPINE1]: 3, [B.SPINE2]: 3 } });
    }
    const chest = lerp(J[B.SPINE2], J[B.NECK], 0.4);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      f.rib(V(0, lerp(J[B.SPINE1], chest, 0.12 + t * 0.82).y, 0.02), 0.52 - t * 0.16, 0.042, boneM,
        { bias: { [B.SPINE1]: 1.4, [B.SPINE2]: 2.2 } });
    }
    f.box(V(0, lerp(J[B.SPINE1], chest, 0.62).y, 0.44), V(0.09, 0.9, 0.06), boneM, { bias: { [B.SPINE2]: 3 } });
    // clavicle bars
    for (const side of [B.CLAV_L, B.CLAV_R]) {
      const arm = J[side === B.CLAV_L ? B.ARM_L : B.ARM_R];
      f.capsule(J[B.NECK].clone().add(V(side === B.CLAV_L ? 0.1 : -0.1, -0.04, 0.06)), arm, 0.05, boneM, { bias: { [side]: 4 } });
    }
    // arms + claw hands
    for (const [ar, fo, ha] of [[B.ARM_L, B.FOREARM_L, B.HAND_L], [B.ARM_R, B.FOREARM_R, B.HAND_R]] as [number, number, number][]) {
      f.sphere(J[ar], 0.11, boneM, { bias: { [ar]: 6 } });
      f.capsule(J[ar], J[fo], 0.095, boneM, { bias: { [ar]: 2, [fo]: 2 } });
      f.sphere(J[fo], 0.085, boneM, { bias: { [fo]: 6 } });
      f.capsule(J[fo], J[ha], 0.075, boneM, { bias: { [fo]: 2, [ha]: 2 } });
      f.box(J[ha].clone().add(V(0, -0.14, 0.02)), V(0.13, 0.26, 0.09), boneM, { bias: { [ha]: 10 } });
      for (let c = 0; c < 3; c++) {
        f.box(J[ha].clone().add(V((c - 1) * 0.05, -0.34, 0.05 + Math.abs(c - 1) * 0.02)), V(0.032, 0.2, 0.032), boneM,
          { bias: { [ha]: 30 } }, new THREE.Euler(0.12, 0, (c - 1) * 0.1));
      }
    }
    // legs + feet
    for (const [th, sh, ft] of [[B.THIGH_L, B.SHIN_L, B.FOOT_L], [B.THIGH_R, B.SHIN_R, B.FOOT_R]] as [number, number, number][]) {
      f.capsule(J[th], J[sh], 0.1, boneM, { bias: { [th]: 2, [sh]: 2 } });
      f.sphere(J[sh], 0.09, boneM, { bias: { [sh]: 6 } });
      f.capsule(J[sh], J[ft], 0.08, boneM, { bias: { [sh]: 2, [ft]: 2 } });
      f.box(V(J[ft].x, J[ft].y - 0.08, J[ft].z + 0.24), V(0.24, 0.15, 0.62), boneM, { bias: { [ft]: 12 } });
    }
    // skull — heavy brow, big jaw, ember eyes
    const H = J[B.HEAD], S = P.skullScale;
    f.sphere(H, 0.4 * S, boneM, { sx: 0.9, sy: 1.0, sz: 0.95, bias: { [B.HEAD]: 8 } });
    f.box(H.clone().add(V(0, 0.09 * S, 0.3 * S)), V(0.42, 0.08, 0.14), boneM, { bias: { [B.HEAD]: 12 } });
    f.box(H.clone().add(V(0, -0.26 * S, 0.14 * S)), V(0.3, 0.22, 0.34), boneM, { bias: { [B.HEAD]: 12 } });
    f.box(H.clone().add(V(0, -0.17 * S, 0.3 * S)), V(0.26, 0.05, 0.05), boneM, { tint: shade(0.8), bias: { [B.HEAD]: 20 } });
    for (const ex of [-0.13, 0.13]) {
      f.sphere(H.clone().add(V(ex * S, 0.02 * S, 0.31 * S)), 0.055, T.eyesSkel, { bias: { [B.HEAD]: 60 } });
      f.sphere(H.clone().add(V(ex * S, -0.12 * S, 0.26 * S)), 0.07, boneM, { tint: shade(0.72), bias: { [B.HEAD]: 12 } });
    }
    // one battered pauldron (asymmetry reads as character)
    f.sphere(J[B.ARM_L].clone().add(V(0.05, 0.12, 0)), 0.28, T.metal,
      { sx: 1.15, sy: 0.88, sz: 1.05, tint: shade(0.85), bias: { [B.ARM_L]: 30 } }, Math.PI * 2, Math.PI * 0.6);
  }

  private wraithParts(f: PartFactory, T: Record<string, THREE.Material>) {
    const J = this.joints;
    const lerp = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
    const shade = (m: number) => new THREE.Color(m, m, m);
    // shroud skirt (translucent, flaring down from the pelvis)
    f.tube(V(0, J[B.PELVIS].y + 0.1, 0), 0.42, 0.98, 2.5, T.tatter, { tint: shade(0.92), bias: { [B.PELVIS]: 3, [B.SPINE1]: 1.4 } });
    // gaunt bone-pale torso + rib hints
    f.capsule(J[B.SPINE1], lerp(J[B.SPINE2], J[B.NECK], 0.3), 0.34, T.bone, { sx: 1.04, sz: 0.78, bias: { [B.SPINE1]: 2, [B.SPINE2]: 2 } });
    for (let i = 0; i < 3; i++) {
      f.rib(V(0, lerp(J[B.SPINE1], J[B.SPINE2], 0.35 + i * 0.3).y, 0.02), 0.4 - i * 0.05, 0.035, T.bone, { tint: shade(0.85), bias: { [B.SPINE1]: 1.2, [B.SPINE2]: 2 } });
    }
    // deep cowl + void face + pale eyes
    const H = J[B.HEAD];
    f.sphere(H.clone().add(V(0, 0.1, -0.06)), 0.52, T.tatter,
      { sx: 1.04, sy: 1.14, sz: 1.08, bias: { [B.HEAD]: 5, [B.NECK]: 0.6 } }, Math.PI * 1.5, Math.PI * 0.75);
    f.sphere(H.clone().add(V(0, -0.02, 0.1)), 0.3, T.void, { bias: { [B.HEAD]: 50 } });
    for (const ex of [-0.12, 0.12]) {
      f.sphere(H.clone().add(V(ex, 0.04, 0.3)), 0.05, T.eyesWraith, { sy: 1.5, bias: { [B.HEAD]: 60 } });
    }
    // long arms + claws
    for (const [ar, fo, ha] of [[B.ARM_L, B.FOREARM_L, B.HAND_L], [B.ARM_R, B.FOREARM_R, B.HAND_R]] as [number, number, number][]) {
      f.capsule(J[ar], J[fo], 0.082, T.bone, { bias: { [ar]: 2, [fo]: 2 } });
      f.capsule(J[fo], J[ha], 0.068, T.bone, { bias: { [fo]: 2, [ha]: 2 } });
      f.sphere(J[fo], 0.075, T.bone, { bias: { [fo]: 6 } });
      for (let c = 0; c < 3; c++) {
        f.box(J[ha].clone().add(V((c - 1) * 0.055, -0.3, 0.04)), V(0.04, 0.34, 0.04), T.bone,
          { bias: { [ha]: 30 } }, new THREE.Euler(0.18, 0, (c - 1) * 0.12));
      }
    }
  }

  // ── per-frame ────────────────────────────────────────────────────────────────
  /** cloth chains: wind = ambient breeze + motion-relative airflow (world ft/s) */
  update(dt: number, windX: number, windZ: number, windUp = 0) {
    for (const c of this.chains) c.update(dt, windX, windZ, windUp, this.isWraith ? 2.2 : 3.4);
    this.updateFlash(dt);
  }

  /** P2.6 hit flash: white emissive surge that decays back to the rest pose.
   *  k = 0..1.2 (crits brighter). Captures each material's original emissive
   *  once, lerps toward white, restores when the energy drains. */
  setFlash(k: number) {
    this.flash = Math.max(this.flash, Math.min(1.2, k));
  }

  private updateFlash(dt: number) {
    if (this.flash <= 0) return;
    if (!this.flashOrig) {
      this.flashOrig = this.bodyMats.map(m => ({ mat: m, c: m.emissive.clone(), i: m.emissiveIntensity }));
    }
    this.flash = Math.max(0, this.flash - dt * 3.4);
    const k = Math.min(1, this.flash);
    if (k <= 0) {
      for (const o of this.flashOrig) { o.mat.emissive.copy(o.c); o.mat.emissiveIntensity = o.i; }
      this.flashOrig = null;                     // re-capture next flash
      return;
    }
    for (const o of this.flashOrig) {
      o.mat.emissive.setRGB(
        o.c.r + (1 - o.c.r) * k,
        o.c.g + (1 - o.c.g) * k,
        o.c.b + (1 - o.c.b) * k,
      );
      o.mat.emissiveIntensity = o.i + (1.6 - o.i) * k;
    }
  }

  setDissolve(t: number) {
    const op = Math.max(0, 1 - t);
    for (const m of this.bodyMats) {
      if (op < 1) { m.transparent = true; m.opacity = op; }
      else { m.transparent = false; m.opacity = 1; }
    }
  }

  dispose() {
    this.body.removeFromParent();
    for (const c of this.chains) c.dispose();
    for (const s of this.skinned) s.removeFromParent();
    for (const m of this.bodyMats) m.dispose();
  }
}

// ── small helpers ──────────────────────────────────────────────────────────────
function makeGlowSprite(color: number, scale: number): THREE.Sprite {
  const m = new THREE.SpriteMaterial({
    map: softSprite(), color, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}
