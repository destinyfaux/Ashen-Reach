// Vision — P3.13 light & darkvision presentation (the user's chosen design).
//
// Two hero-attached lights + a touch of dark adaptation:
//   darkLight  — the "darkvision halo". castShadow=false per the design ruling:
//                dark-adapted sight is not a flame, it never casts shadows.
//                Reach = the hero's SRD darkvision range (sheet.darkvisionFt);
//                humans without darkvision keep a faint 12ft "eyes adjusting"
//                splash so they are never literally blind.
//   torchLight — a real flame when the hero has a light source equipped
//                (sheet.lightSource: Torch / Lamp / Lantern). castShadow=true
//                (only the torch earns shadows), 40ft reach, animated flame.
//                Equipping one also extends the halo to the flame's reach —
//                "a torch expands or adds to your darkvision range".
//   exposure   — subtle dark adaptation: ACES exposure eases a few percent
//                brighter in darkness for darkvision races only. Night stays
//                moody for humans; elves don't get a washed-out picture.
//
// Darkness source: dungeons are always dark; the overworld follows the day
// clock (World.nightFactor). The value is smoothed so dusk/door transitions
// never snap. Mechanical perception ranges live server-side (rules/Light.js);
// this module is purely presentation.
import * as THREE from 'three';
import type { Engine } from './Engine';
import { flameSprite, glowSprite } from './sprites';
import { useGame } from '../game/store';

const MIN_HALO_FT = 12;          // eyes-adjusted splash for darkvision-less heroes
const TORCH_REACH_FT = 40;       // mirrors rules/Light.js TORCH_REACH_FT
const HALO_INTENSITY = 95;       // decay-2 physical falloff, matches World's light scale
const TORCH_INTENSITY = 175;

export class Vision {
  private eng: Engine;
  private darkLight: THREE.PointLight;
  private torchLight: THREE.PointLight;
  private flame: THREE.Sprite;
  private flameCore: THREE.Sprite;
  private t = 0;
  private darkness = 0;                 // smoothed 0..1 (1 = fully dark-adapted scene)
  private exposureBase: number;
  private flamePhase = Math.random() * 9;

  constructor(eng: Engine) {
    this.eng = eng;
    this.exposureBase = eng.renderer.toneMappingExposure;

    this.darkLight = new THREE.PointLight(0xc7d8ea, 0, MIN_HALO_FT, 2);
    this.darkLight.castShadow = false;  // design ruling: darkvision never casts shadows
    eng.scene.add(this.darkLight);

    this.torchLight = new THREE.PointLight(0xff9a4d, 0, TORCH_REACH_FT, 2);
    if (!eng.lowgfx) {
      this.torchLight.castShadow = true;   // only an actual flame earns shadows
      this.torchLight.shadow.mapSize.set(512, 512);
      this.torchLight.shadow.bias = -0.004;
      this.torchLight.shadow.normalBias = 0.6;
      (this.torchLight.shadow.camera as THREE.PerspectiveCamera).near = 0.5;
    }
    eng.scene.add(this.torchLight);

    // small hand-flame billboard (same sprite DNA as World's braziers)
    this.flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flameSprite(0), transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.flame.scale.set(1.5, 2.3, 1);
    this.flame.visible = false;
    eng.scene.add(this.flame);
    this.flameCore = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: 0xffe9b0, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.flameCore.scale.setScalar(1.2);
    this.flameCore.visible = false;
    eng.scene.add(this.flameCore);
  }

  update(dt: number) {
    this.t += dt;
    // dungeons are always dark; the overworld follows the day clock
    const target = this.eng.grid.worldMode ? this.eng.world.nightFactor : 1;
    this.darkness += (target - this.darkness) * Math.min(1, dt * 2.2);

    // ── bind to my token figure ────────────────────────────────────────────
    const tokenId = this.eng.controls.tokenId;
    const hero = tokenId ? this.eng.actors.get(tokenId) : null;
    const st = useGame.getState();
    const tok = st.tokens?.find(t => t.id === st.myTokenId) || null;
    const sheet = (tok?.sheet ?? null) as { darkvisionFt?: number | null; lightSource?: string | null } | null;
    const darkvisionFt = Number(sheet?.darkvisionFt) || 0;
    const torchLit = !!sheet?.lightSource;

    if (!hero) {
      this.darkLight.intensity = 0;
      this.torchLight.intensity = 0;
      this.flame.visible = false;
      this.flameCore.visible = false;
      return;
    }
    const p = hero.group.position;
    const rotY = hero.group.rotation.y || 0;
    const reach = torchLit ? Math.max(darkvisionFt, TORCH_REACH_FT) : Math.max(darkvisionFt, MIN_HALO_FT);

    // darkvision halo — brighter the darker it gets, zero in daylight.
    // Hoisted a full foot above the crown (~6.5ft rig): at +5.2 the light sat
    // inside the head mesh, so decay-2 falloff at ~0.3ft range nuked the head
    // at ~1000× and bloomed like a supernova every night.
    this.darkLight.distance = reach;
    this.darkLight.position.set(p.x, p.y + 7.6, p.z);
    this.darkLight.intensity = HALO_INTENSITY * this.darkness * (torchLit ? 0.55 : 1);

    // torch — a held flame: warm, flickering, shadow-casting
    const flicker = 1 + Math.sin(this.t * 13.7 + this.flamePhase) * 0.14 + Math.sin(this.t * 29.3 + this.flamePhase * 2) * 0.08;
    this.torchLight.distance = TORCH_REACH_FT;
    const fx = p.x + Math.sin(rotY) * 1.5 - Math.cos(rotY) * 0.9;
    const fz = p.z + Math.cos(rotY) * 1.5 + Math.sin(rotY) * 0.9;
    this.torchLight.position.set(fx, p.y + 4.6, fz);
    this.torchLight.intensity = torchLit ? TORCH_INTENSITY * flicker : 0;
    this.flame.visible = torchLit;
    this.flameCore.visible = torchLit;
    if (torchLit) {
      this.flame.position.set(fx, p.y + 5.4, fz);
      this.flameCore.position.copy(this.flame.position);
      this.flame.scale.set(1.5 * (0.93 + flicker * 0.07), 2.3 * (0.88 + flicker * 0.12), 1);
      this.flameCore.scale.setScalar(1.2 * (0.9 + flicker * 0.1));
    }

    // ── subtle dark adaptation: only darkvision races brighten, and only a
    // few percent — night stays night for everyone else ────────────────────
    const adaptBonus = darkvisionFt >= 120 ? 1.0 : darkvisionFt >= 60 ? 0.6 : 0;
    const targetExposure = this.exposureBase * (1 + 0.09 * adaptBonus * this.darkness);
    const cur = this.eng.renderer.toneMappingExposure;
    this.eng.renderer.toneMappingExposure = cur + (targetExposure - cur) * Math.min(1, dt * 1.6);
  }
}
