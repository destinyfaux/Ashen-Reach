// rigMaterials — dark-fantasy palette + cached skinnable materials for the actor rig.
// All figures share a handful of program permutations: MeshStandardMaterial with an
// injected fresnel rim term (torch-lit silhouettes) + vertex-colour part shading.
import * as THREE from 'three';
import { clothTexture } from '../sprites';

// ── palette (ARCHITECTURE.md: grim, low-saturation, silhouette-first) ──────────
export const PAL = {
  charcoal: 0x1a1d22,   // base cloth
  clothAlt: 0x262b33,   // secondary cloth
  bone: 0xcfc6b8,       // pale bone / priest cowl
  ember: 0xb8952f,      // ember gold trim
  blood: 0x7a1f1f,      // monster accents
  crypt: 0x3d5a5a,      // crypt blue-green (wraith cloth)
  leather: 0x2e2620,    // straps, boots, belts
  iron: 0x494e55,       // rusty iron
  steel: 0x8b9099,      // blade steel
  oldSteel: 0x6d6a62,   // tarnished blade (skeleton weapons)
  wood: 0x3a2c1c,       // hafts, grips
  skinPale: 0xc9ac8e,
  skinAshen: 0xa89a86,
  skinWeathered: 0x9a7a5e,
  hairBlack: 0x191714,
  hairBrown: 0x3a2a1a,
  hairRust: 0x5e3a20,
  hairAsh: 0x8d8474,
};

// rim-light colours per family (warm ember for the living, cold for the dead)
const RIM_WARM = new THREE.Color(0xc8a24a);
const RIM_COLD = new THREE.Color(0x6ad4c8);

// ── fresnel rim injection (MeshStandardMaterial) ───────────────────────────────
// emissive += rimColor * rimStrength * pow(1 - dot(N, V), 3.2)
function rimify(mat: THREE.MeshStandardMaterial, color: THREE.Color, strength: number) {
  (mat as any)._rimDef = { color: color.clone(), strength };
  mat.onBeforeCompile = (shader: any) => {
    shader.uniforms.uRimColor = { value: (mat as any)._rimDef.color };
    shader.uniforms.uRimStrength = { value: (mat as any)._rimDef.strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float rimDot = 1.0 - saturate(dot(normalize(normal), normalize(vViewPosition)));
          totalEmissiveRadiance += uRimColor * uRimStrength * pow(rimDot, 3.2);
        }`
      );
  };
  // one shared program variant per rim config → shader cache friendly
  (mat as any).customProgramCacheKey = () => 'ar-rim-' + strength.toFixed(2);
  return mat;
}

/** Per-actor clone of a (possibly rim-patched) material. THREE's Material.clone()
 *  drops `onBeforeCompile`/`customProgramCacheKey` own-props, so re-inject. */
export function cloneMat<T extends THREE.Material>(m: T): T {
  const rim = (m as any)._rimDef as { color: THREE.Color; strength: number } | undefined;
  const c = m.clone() as T;
  if (rim) rimify(c as unknown as THREE.MeshStandardMaterial, rim.color, rim.strength);
  return c;
}

// ── material factory + cache (shared across actors with identical look) ───────
const _cache = new Map<string, THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>();

function cached(key: string, make: () => THREE.MeshStandardMaterial): THREE.MeshStandardMaterial;
function cached(key: string, make: () => THREE.MeshBasicMaterial): THREE.MeshBasicMaterial;
function cached(key: string, make: () => any): any {
  let m = _cache.get(key);
  if (m === undefined) { const made = make(); _cache.set(key, made); m = made; }
  return m;
}

function hex(n: number): string { return '#' + n.toString(16).padStart(6, '0'); }

/** cloth (tunic / legs / hood) — vertex-coloured parts, woven canvas map */
export function clothMat(color: number): THREE.MeshStandardMaterial {
  return cached('cloth' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.94, metalness: 0.02,
    map: clothTexture(0), bumpMap: clothTexture(0), bumpScale: 0.35,
    vertexColors: true,
  }), RIM_WARM, 0.34));
}

/** hair strands & braids — smooth satin sheen, distinct from woven cloth */
export function hairMat(color: number): THREE.MeshStandardMaterial {
  return cached('hair' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.78, metalness: 0.12, vertexColors: true,
  }), RIM_WARM, 0.35));
}

/** facial warpaint, scars, and runes */
export function decorMat(color: number): THREE.MeshStandardMaterial {
  return cached('decor' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.65, metalness: 0.08, vertexColors: true,
  }), RIM_WARM, 0.4));
}

/** leather / straps / boots / belts */
export function leatherMat(color = PAL.leather): THREE.MeshStandardMaterial {
  return cached('leather' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.82, metalness: 0.08, vertexColors: true,
  }), RIM_WARM, 0.38));
}

/** bare skin (head, hands) */
export function skinMat(color: number): THREE.MeshStandardMaterial {
  return cached('skin' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.72, metalness: 0.0, vertexColors: true,
  }), RIM_WARM, 0.3));
}

/** metal — blades, pauldron rims, buckles */
export function metalMat(color: number, rough = 0.42, metal = 0.85): THREE.MeshStandardMaterial {
  return cached(`metal${hex(color)}${rough}${metal}`, () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal, vertexColors: true,
  }), RIM_WARM, 0.5));
}

/** bone — skeleton bodies, wraith-pale torsos */
export function boneMat(color = PAL.bone): THREE.MeshStandardMaterial {
  return cached(`bone${hex(color)}`, () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.88, metalness: 0.0, vertexColors: true,
  }), RIM_COLD, 0.42));
}

/** wraith tatter cloth — translucent, cold rim, faint self-glow */
export function tatterMat(color: number, opacity = 0.88): THREE.MeshStandardMaterial {
  return cached(`tatter${hex(color)}${opacity}`, () => {
    const m = new THREE.MeshStandardMaterial({
      color, roughness: 1, metalness: 0, transparent: true, opacity,
      side: THREE.DoubleSide, vertexColors: true,
      emissive: new THREE.Color(color).multiplyScalar(0.22), emissiveIntensity: 0.8,
    });
    return rimify(m, RIM_COLD, 0.75);
  });
}

/** cloak strips (verlet chains) — plain double-sided cloth */
export function cloakMat(color: number): THREE.MeshStandardMaterial {
  return cached('cloak' + hex(color), () => rimify(new THREE.MeshStandardMaterial({
    color, roughness: 0.96, metalness: 0.0, side: THREE.DoubleSide,
    map: clothTexture(1), bumpMap: clothTexture(1), bumpScale: 0.4,
  }), RIM_WARM, 0.4));
}

/** unlit glow bits (eyes, embers) */
export function glowMat(color: number): THREE.MeshBasicMaterial {
  return cached('glow' + hex(color), () => new THREE.MeshBasicMaterial({ color, fog: false }));
}

/** additive trail / spell arcs — vertex colours fade to black = invisible */
export function trailMat(color: number): THREE.MeshBasicMaterial {
  return cached('trail' + hex(color), () => new THREE.MeshBasicMaterial({
    color, vertexColors: true, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
  }));
}
