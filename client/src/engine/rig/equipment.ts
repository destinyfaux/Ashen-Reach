// equipment — archetype weapons/shields attached to the rig's hand anchors.
// Equipment frame (see HumanoidRig): origin at the fist, -Y runs out of the
// grip toward the tip, +Z is the palm/edge normal, +X outward from the body.
// Each weapon set merges into ONE vertex-coloured geometry (one draw call);
// materials are per-actor clones so death-dissolve stays per-actor.
import * as THREE from 'three';
import type { HumanoidRig } from './HumanoidRig';
import { softSprite } from '../sprites';
import { metalMat, cloneMat } from './rigMaterials';

interface Part {
  geom: THREE.BufferGeometry;   // already transformed into equip space
  color: THREE.Color;
}

// palette as vertex-colour hues on a white material
const C = {
  steel: new THREE.Color(0.62, 0.65, 0.7),
  darkSteel: new THREE.Color(0.34, 0.36, 0.4),
  rust: new THREE.Color(0.42, 0.33, 0.24),
  wood: new THREE.Color(0.24, 0.18, 0.11),
  gold: new THREE.Color(0.72, 0.58, 0.18),
  bone: new THREE.Color(0.78, 0.74, 0.66),
  leather: new THREE.Color(0.2, 0.16, 0.12),
  pale: new THREE.Color(0.8, 0.78, 0.7),
};

function boxPart(parts: Part[], cx: number, cy: number, cz: number,
  sx: number, sy: number, sz: number, color: THREE.Color, rot?: THREE.Euler) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (rot) {
    g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromEuler(rot), new THREE.Vector3(1, 1, 1)));
  } else {
    g.translate(cx, cy, cz);
  }
  parts.push({ geom: g, color });
}

function cylPart(parts: Part[], cx: number, cy: number, cz: number,
  rTop: number, rBot: number, h: number, color: THREE.Color, radial = 7) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, radial);
  g.translate(cx, cy, cz);
  parts.push({ geom: g, color });
}

function octaPart(parts: Part[], cx: number, cy: number, cz: number, r: number, color: THREE.Color) {
  const g = new THREE.OctahedronGeometry(r, 0);
  g.translate(cx, cy, cz);
  parts.push({ geom: g, color });
}

/** merge parts (non-indexed) into one geometry with vertex colours */
function mergeParts(parts: Part[]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  for (const p of parts) {
    const g = p.geom.index ? p.geom.toNonIndexed() : p.geom;
    if (g !== p.geom) p.geom.dispose();
    const pa = g.attributes.position.array as ArrayLike<number>;
    const na = g.attributes.normal.array as ArrayLike<number>;
    const ua = (g.attributes.uv ? g.attributes.uv.array : null) as ArrayLike<number> | null;
    const n = pa.length / 3;
    for (let i = 0; i < n; i++) {
      pos.push(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]);
      nor.push(na[i * 3], na[i * 3 + 1], na[i * 3 + 2]);
      if (ua) uv.push(ua[i * 2], ua[i * 2 + 1]); else uv.push(0, 0);
      col.push(p.color.r, p.color.g, p.color.b);
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// shared geometry cache per weapon id (built once, cloned never — meshes share it)
const geomCache = new Map<string, { geom: THREE.BufferGeometry; tipY: number; glow?: { y: number; color: number } }>();

function weaponGeom(id: string): { geom: THREE.BufferGeometry; tipY: number; glow?: { y: number; color: number } } {
  let w = geomCache.get(id);
  if (w) return w;
  const P: Part[] = [];
  let tipY = 0;
  let glow: { y: number; color: number } | undefined;

  if (id === 'longsword') {
    boxPart(P, 0, 0.2, 0, 0.09, 0.09, 0.09, C.gold);                       // pommel
    boxPart(P, 0, 0.02, 0, 0.07, 0.42, 0.07, C.wood);                      // grip
    boxPart(P, 0, -0.16, 0, 0.09, 0.1, 0.09, C.leather);
    boxPart(P, 0, -0.26, 0, 0.62, 0.055, 0.13, C.steel);                   // cross guard
    boxPart(P, 0, -0.3, 0, 0.02, 0.075, 0.028, C.gold);                    // ricasso
    boxPart(P, 0, -1.75, 0, 0.11, 2.9, 0.035, C.steel);                    // blade
    boxPart(P, 0, -3.32, 0, 0.062, 0.24, 0.028, C.steel);                  // tapered tip
    tipY = -3.4;
  } else if (id === 'dagger') {
    boxPart(P, 0, 0.16, 0, 0.07, 0.06, 0.07, C.darkSteel);
    boxPart(P, 0, 0.02, 0, 0.055, 0.3, 0.055, C.wood);
    boxPart(P, 0, -0.17, 0, 0.2, 0.04, 0.09, C.darkSteel);                 // curved guard
    boxPart(P, 0.04, -0.19, 0, 0.12, 0.035, 0.08, C.darkSteel, new THREE.Euler(0, 0, -0.5));
    boxPart(P, 0, -0.75, 0, 0.075, 1.1, 0.022, C.darkSteel);               // blade
    boxPart(P, 0, -1.36, 0, 0.045, 0.2, 0.018, C.darkSteel);
    tipY = -1.45;
  } else if (id === 'staff') {
    cylPart(P, 0, -0.2, 0, 0.055, 0.075, 4.2, C.wood);                      // shaft: +1.9 … -2.3
    cylPart(P, 0.05, 1.55, 0, 0.05, 0.07, 0.6, C.wood, 5);                  // gnarl branch
    boxPart(P, 0, 1.78, 0, 0.16, 0.16, 0.16, C.wood);                       // knot
    boxPart(P, 0.1, 1.66, 0.04, 0.1, 0.22, 0.1, C.wood, new THREE.Euler(0.4, 0, 0.5));
    for (let i = 0; i < 3; i++) {                                           // claw prongs cradling the ember
      const a = (i / 3) * Math.PI * 2;
      boxPart(P, Math.cos(a) * 0.11, 1.98, Math.sin(a) * 0.11, 0.035, 0.3, 0.035, C.rust,
        new THREE.Euler(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35));
    }
    octaPart(P, 0, 2.1, 0, 0.11, C.gold);
    tipY = 2.1;
    glow = { y: 2.1, color: 0xe08a3a };
  } else if (id === 'mace') {
    boxPart(P, 0, 0.2, 0, 0.09, 0.09, 0.09, C.bone);                        // skull pommel
    boxPart(P, 0, 0.0, 0, 0.07, 0.4, 0.07, C.wood);
    boxPart(P, 0, -0.22, 0, 0.3, 0.05, 0.3, C.gold);                        // collar
    boxPart(P, 0, -0.48, 0, 0.2, 0.44, 0.2, C.darkSteel);                   // head
    for (let i = 0; i < 4; i++) {                                           // flanges
      const a = (i / 4) * Math.PI;
      boxPart(P, Math.cos(a) * 0.17, -0.48, Math.sin(a) * 0.17, 0.32, 0.34, 0.05, C.darkSteel,
        new THREE.Euler(0, -a + Math.PI / 2, 0));
    }
    tipY = -0.8;
  } else if (id === 'tattered_sword') {
    boxPart(P, 0, 0.18, 0, 0.09, 0.08, 0.09, C.rust);
    boxPart(P, 0, 0.02, 0, 0.07, 0.34, 0.07, C.wood);
    boxPart(P, 0, -0.2, 0, 0.5, 0.05, 0.11, C.rust);
    boxPart(P, 0, -1.35, 0, 0.1, 2.2, 0.03, C.rust);                        // notched blade
    boxPart(P, 0.04, -1.9, 0.02, 0.085, 0.9, 0.028, C.rust, new THREE.Euler(0.1, 0.1, 0.08)); // broken tip offset
    tipY = -2.4;
  }
  w = { geom: mergeParts(P), tipY, glow };
  geomCache.set(id, w);
  return w;
}

function shieldGeom(id: string): THREE.BufferGeometry {
  const key = 'shield:' + id;
  let g = geomCache.get(key);
  if (g) return g.geom;
  const P: Part[] = [];
  if (id === 'kite') {
    // board: tall kite shape from stacked boxes (cheap silhouette)
    boxPart(P, 0, 0, 0, 0.09, 1.5, 1.05, C.wood);
    boxPart(P, 0, -0.62, 0, 0.085, 0.55, 0.78, C.wood);
    boxPart(P, 0, -1.02, 0, 0.08, 0.3, 0.5, C.wood);
    boxPart(P, 0.05, 0, 0, 0.04, 1.52, 1.07, C.rust);                      // iron rim
    boxPart(P, 0.05, -0.62, 0, 0.035, 0.57, 0.8, C.rust);
    boxPart(P, 0.08, 0.12, 0, 0.07, 0.24, 0.24, C.gold);                    // boss + sigil
    boxPart(P, 0.08, -0.35, 0, 0.06, 0.5, 0.07, C.gold);
    boxPart(P, 0.08, -0.35, 0, 0.06, 0.07, 0.5, C.gold);
  } else if (id === 'tome') {
    boxPart(P, 0, -0.28, 0, 0.55, 0.7, 0.16, C.leather);                    // cover
    boxPart(P, 0, -0.28, 0.085, 0.47, 0.6, 0.05, C.pale);                   // pages
    boxPart(P, 0, 0.06, 0, 0.5, 0.07, 0.19, C.gold);                        // clasp
    boxPart(P, 0.2, -0.28, 0, 0.1, 0.74, 0.05, C.gold);
  } else if (id === 'reliquary') {
    boxPart(P, 0, -0.05, 0, 0.06, 0.34, 0.06, C.darkSteel);                 // chain rod
    for (let i = 0; i < 3; i++) boxPart(P, 0, -0.28 - i * 0.09, 0, 0.025, 0.1, 0.025, C.darkSteel);
    boxPart(P, 0, -0.66, 0, 0.3, 0.34, 0.3, C.rust);                        // censer box
    boxPart(P, 0, -0.66, 0.16, 0.14, 0.14, 0.03, C.gold);                   // grate
    boxPart(P, 0, -0.85, 0, 0.18, 0.06, 0.18, C.gold);
  }
  const geom = mergeParts(P);
  geomCache.set(key, { geom, tipY: 0 });
  return geom;
}

// sprite materials for weapon glows (constant — safe to share)
const spriteMats = new Map<number, THREE.SpriteMaterial>();
function glowSprite(color: number, scale: number): THREE.Sprite {
  let m = spriteMats.get(color);
  if (!m) {
    m = new THREE.SpriteMaterial({
      map: softSprite(), color, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    spriteMats.set(color, m);
  }
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

const BASE_SETS: Record<string, { main: string; off: string | null; mainTrail: boolean }> = {
  warden: { main: 'longsword', off: 'kite', mainTrail: true },
  shadowdancer: { main: 'dagger', off: 'dagger', mainTrail: true },
  ashen_mage: { main: 'staff', off: 'tome', mainTrail: false },
  pale_priest: { main: 'mace', off: 'reliquary', mainTrail: false },
  skeleton: { main: 'tattered_sword', off: null, mainTrail: true },
  wraith: { main: '', off: null, mainTrail: false },
};

const CLASS_MAP: Record<string, string> = {
  fighter: 'warden', paladin: 'warden', barbarian: 'warden',
  rogue: 'shadowdancer', ranger: 'shadowdancer', monk: 'shadowdancer',
  wizard: 'ashen_mage', sorcerer: 'ashen_mage', warlock: 'ashen_mage', artificer: 'ashen_mage',
  cleric: 'pale_priest', druid: 'pale_priest', bard: 'pale_priest',
};

/** attach the archetype's equipment to the rig's hand anchors */
export function buildEquipment(rig: HumanoidRig, archetype: string): void {
  const norm = (archetype || 'warden').toLowerCase();
  const setKey = BASE_SETS[norm] ? norm : (CLASS_MAP[norm] ?? 'warden');
  const set = BASE_SETS[setKey] ?? BASE_SETS.warden;
  if (!set.main) return;
  const mat = cloneMat(metalMat(0xffffff, 0.45, 0.7));  // vertex colours carry the hues

  const main = weaponGeom(set.main);
  const mainMesh = new THREE.Mesh(main.geom, mat);
  mainMesh.castShadow = true;
  mainMesh.frustumCulled = false;
  rig.equipR.add(mainMesh);
  if (main.glow) {
    const s = glowSprite(main.glow.color, 1.0);
    s.position.set(0, main.glow.y, 0);
    mainMesh.add(s);
  }
  if (set.mainTrail && main.tipY < -0.5) {
    const tip = new THREE.Object3D(); tip.position.set(0, main.tipY, 0);
    const base = new THREE.Object3D(); base.position.set(0, main.tipY * 0.4, 0);
    mainMesh.add(tip); mainMesh.add(base);
    rig.trailTip = tip;
    rig.trailBase = base;
  }

  if (set.off) {
    const offGeom = shieldGeom(set.off);
    const offMesh = new THREE.Mesh(offGeom, mat);
    offMesh.castShadow = true;
    offMesh.frustumCulled = false;
    if (set.off === 'kite') {
      // strapped to the left forearm: board faces outward (+X), slight forward cant
      offMesh.position.set(0.22, 0.1, 0.05);
      offMesh.rotation.set(0.1, 0, -0.12);
    } else if (set.off === 'tome') {
      offMesh.position.set(0, -0.34, 0.16);
      offMesh.rotation.set(-0.5, 0.15, 0);
    } else if (set.off === 'reliquary') {
      offMesh.position.set(0.02, -0.5, 0.1);
      const s = glowSprite(0x7fd4c8, 0.8);
      s.position.set(0, -0.66, 0.1);
      offMesh.add(s);
    }
    rig.equipL.add(offMesh);
  }
}
