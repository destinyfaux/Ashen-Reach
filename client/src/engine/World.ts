// World — sky, sun/moon discs, day/night, weather machine, atmosphere.
// T2-d art pass: per-map exponential fog (crypt-heavy), volumetric-ish light
// shafts under torches and hanging lanterns, dust motes drifting in light,
// wind-driven rain streak quads, ash-hue sky keyframes, ember sun + bone moon
// discs, animated ground-fog plane, hanging iron cage lanterns (decor colliders),
// cool rim light for silhouette readability.
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { MapDef, LightDef } from './types';
import { CELL, WALL_H } from './TileGrid';
import type { Collider } from './TileGrid';
import { getAreaTileSet, getMaterial } from './materials';
import { playSfx } from '../audio/music';
import {
  softSprite, flameSprite, glowSprite, sparkSprite, streakSprite,
  discSprite, shaftGradient, noiseTexture
} from './sprites';

// Ash-hue sky: deep night ↔ pre-dawn ash purple ↔ ember dawn ↔ pale ash day.
const SKY: [number, number][] = [
  [0.0, 0x05070c], [4.3, 0x070a10], [5.3, 0x241f2b], [6.2, 0x5c4032],
  [7.5, 0x63615a], [12.0, 0x6b6a60], [16.5, 0x5c544a], [18.3, 0x4e3028],
  [19.5, 0x251a1e], [20.7, 0x0a0c12], [24.0, 0x05070c]
];
const SUNCOL: [number, number][] = [
  [0.0, 0x8ca0cc], [4.3, 0x8ca0cc], [6.0, 0xd4813c], [8.0, 0xd8c2a2],
  [12.0, 0xd8d2c2], [17.0, 0xd4b088], [18.8, 0xc06a38], [20.2, 0x8ca0cc], [24.0, 0x8ca0cc]
];

const WEATHERS: Record<string, { fog: number; rain: number }> = {
  clear: { fog: 0.0010, rain: 0 }, overcast: { fog: 0.0018, rain: 0 },
  fog: { fog: 0.0090, rain: 0 }, rain: { fog: 0.0028, rain: 0.55 }, storm: { fog: 0.0040, rain: 1.0 }
};

function lerpHex(a: number, b: number, t: number) {
  const r = (a >> 16 & 255) + (((b >> 16 & 255) - (a >> 16 & 255)) * t) | 0;
  const g = (a >> 8 & 255) + (((b >> 8 & 255) - (a >> 8 & 255)) * t) | 0;
  const bl = (a & 255) + (((b & 255) - (a & 255)) * t) | 0;
  return (r << 16) | (g << 8) | bl;
}
function keyLerp(table: [number, number][], hour: number) {
  for (let i = 0; i < table.length - 1; i++) {
    if (hour >= table[i][0] && hour <= table[i + 1][0]) {
      const t = (hour - table[i][0]) / ((table[i + 1][0] - table[i][0]) || 1);
      return lerpHex(table[i][1], table[i + 1][1], t);
    }
  }
  return table[table.length - 1][1];
}

interface Torch {
  light: THREE.PointLight;
  base: number;
  phase: number;
  sprite: THREE.Sprite;
  core: THREE.Sprite;
  w: number; h: number;
  shaft: THREE.Mesh | null;
  shaftBase: number;
}
interface MoteMeta { hx: number; hy: number; hz: number; r: number; h: number; sp: number; ph: number; }

const _v = new THREE.Vector3();
const _camF = new THREE.Vector3();

export class World {
  private eng: Engine;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;               // cool edge light — silhouettes read
  stars!: THREE.Points;
  rain!: THREE.Mesh;                          // streak quads, wind-driven
  sunDisc!: THREE.Sprite;
  moonDisc!: THREE.Sprite;
  private embers: THREE.Points | null = null;
  private motes: THREE.Points | null = null;
  private groundFog: THREE.Mesh | null = null;
  private groundFogOp = 0;
  private deadlandFog = false;
  private skyDome!: THREE.Mesh;
  private torches: Torch[] = [];
  private washLights: THREE.PointLight[] = [];
  private lanterns: THREE.Group[] = [];
  private embersMeta: { hx: number; hy: number; hz: number; r: number; ph: number; sp: number }[] = [];
  private motesMeta: MoteMeta[] = [];
  /** Extra camera/movement colliders owned by World (hanging lanterns…). Same schema as TileGrid. */
  obstructionBoxes: Collider[] = [];
  private t = 0;
  private fogDensity = 0.001;
  private rainAmt = 0;
  private fogTarget = 0.001;
  private rainTarget = 0;
  private weather = 'clear';
  private isCrypt = true;
  private thunderT = 6;
  private fireSfxT = 2;
  private flashEl: HTMLDivElement;
  private wind = { x: 0.6, z: 0.2 };

  constructor(eng: Engine) {
    this.eng = eng;

    this.hemi = new THREE.HemisphereLight(0x5a6678, 0x241c14, 0.42);
    eng.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0x8a948e, 0.38);
    eng.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xffe8c8, 2.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(eng.lowgfx ? 1024 : 2048, eng.lowgfx ? 1024 : 2048);
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.far = 420;
    this.sun.shadow.bias = -0.0004;   // tuned (T2-d): was -0.0007 (acne)
    this.sun.shadow.normalBias = 1.5; // geo-scale bias for PCFSoft at ft scale
    eng.scene.add(this.sun); eng.scene.add(this.sun.target);
    // rim: cool blue-green from high behind — separates figures from the dark
    this.rim = new THREE.DirectionalLight(0x5a8a86, 0.32);
    this.rim.position.set(60, 70, -90);
    eng.scene.add(this.rim);

    this.buildStars();
    this.buildRain();
    this.buildSkyDiscs();
    this.skyDome = this.buildSkyDome();

    this.flashEl = document.createElement('div');
    this.flashEl.style.cssText = 'position:fixed;inset:0;background:#cfd8ff;opacity:0;pointer-events:none;z-index:55;transition:opacity .12s';
    document.body.appendChild(this.flashEl);
  }

  private buildStars() {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.48 + 0.05, r = 500;
      pos[i * 3] = Math.cos(a) * Math.sin(e) * r;
      pos[i * 3 + 1] = Math.cos(e) * r * 0.6 + 40;
      pos[i * 3 + 2] = Math.sin(a) * Math.sin(e) * r;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xbfcbe8, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false
    }));
    this.eng.scene.add(this.stars);
  }

  private buildSkyDome() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(0x10182c) },
        uHorizon: { value: new THREE.Color(0x625c58) },
        uLow: { value: new THREE.Color(0x927259) },
        uSunset: { value: 0 },
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color(0xffd29a) },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uLow;
        uniform float uSunset;
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        varying vec3 vDirection;
        float skyHash(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float skyNoise(vec3 p) {
          vec3 cell = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(skyHash(cell), skyHash(cell + vec3(1.0, 0.0, 0.0)), f.x),
                mix(skyHash(cell + vec3(0.0, 1.0, 0.0)), skyHash(cell + vec3(1.0, 1.0, 0.0)), f.x), f.y),
            mix(mix(skyHash(cell + vec3(0.0, 0.0, 1.0)), skyHash(cell + vec3(1.0, 0.0, 1.0)), f.x),
                mix(skyHash(cell + vec3(0.0, 1.0, 1.0)), skyHash(cell + vec3(1.0, 1.0, 1.0)), f.x), f.y),
            f.z
          );
        }
        void main() {
          vec3 direction = normalize(vDirection);
          float h = clamp(direction.y, -0.22, 0.92);
          float upper = smoothstep(-0.03, 0.68, h);
          vec3 sky = mix(uHorizon, uTop, upper);
          float lower = 1.0 - smoothstep(-0.18, 0.08, h);
          sky = mix(sky, uLow, lower * 0.78);
          float glow = exp(-pow((h - 0.025) * 10.0, 2.0));
          sky += vec3(0.34, 0.15, 0.065) * glow * uSunset;
          float sunDot = max(dot(direction, normalize(uSunDirection)), 0.0);
          float sunCorona = exp(-(1.0 - sunDot) * 15.0);
          float sunCore = exp(-(1.0 - sunDot) * 180.0);
          sky += uSunColor * (sunCorona * 0.18 + sunCore * 0.8);
          vec3 cloudPoint = direction * 5.4 + vec3(uTime * 0.0018, 0.0, uTime * 0.0011);
          float cloudNoise = skyNoise(cloudPoint) * 0.68 +
            skyNoise(cloudPoint * 2.05 + vec3(4.7, 2.3, 8.1)) * 0.32;
          float clouds = smoothstep(0.4, 0.56, cloudNoise) *
            smoothstep(-0.12, 0.16, direction.y) * 0.68;
          vec3 cloudColor = mix(uLow, uHorizon, smoothstep(-0.12, 0.24, direction.y));
          cloudColor = mix(cloudColor, vec3(0.8, 0.83, 0.85), 0.54);
          cloudColor = mix(cloudColor, uSunColor, smoothstep(0.8, 1.0, sunDot) * 0.2);
          sky = mix(sky, cloudColor, clouds);
          gl_FragColor = vec4(sky, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      toneMapped: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(850, 48, 24), material);
    dome.renderOrder = -1000;
    dome.frustumCulled = false;
    this.eng.scene.add(dome);
    return dome;
  }

  // ── rain: one mesh of streak quads (bright head, feathered tail) ──────────
  private buildRain() {
    const N = this.eng.lowgfx ? 240 : 620;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 12);
    const uv = new Float32Array(N * 8);
    const idx = new Uint32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const o = i * 4, io = i * 6, uo = i * 8;
      idx[io] = o; idx[io + 1] = o + 2; idx[io + 2] = o + 1;
      idx[io + 3] = o + 2; idx[io + 4] = o + 3; idx[io + 5] = o + 1;
      uv[uo] = 0; uv[uo + 1] = 0; uv[uo + 2] = 1; uv[uo + 3] = 0;
      uv[uo + 4] = 0; uv[uo + 5] = 1; uv[uo + 6] = 1; uv[uo + 7] = 1;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.rain = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      map: streakSprite(), color: 0x9fb2c6, transparent: true, opacity: 0,
      depthWrite: false, fog: false
    }));
    this.rain.frustumCulled = false;
    this.rain.renderOrder = 4;
    const drops: { x: number; y: number; z: number; v: number }[] = [];
    for (let i = 0; i < N; i++) drops.push({ x: 0, y: -100, z: 0, v: 40 + Math.random() * 24 });
    this.rain.userData.drops = drops;
    this.eng.scene.add(this.rain);
  }

  private buildSkyDiscs() {
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: discSprite(0.36), color: 0xe0993f, transparent: true, opacity: 0,
      depthWrite: false, fog: false
    }));
    this.sunDisc.scale.setScalar(34);
    this.eng.scene.add(this.sunDisc);
    this.moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: discSprite(0.42), color: 0xd8d2c0, transparent: true, opacity: 0,
      depthWrite: false, fog: false
    }));
    this.moonDisc.scale.setScalar(15);
    this.eng.scene.add(this.moonDisc);
  }

  // ── volumetric-ish light shaft (additive gradient cone, deliberately subtle)
  private buildShaft(x: number, z: number, yTop: number, h: number, topR: number, botR: number, color: number, opacity: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(topR, botR, h, 10, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color, map: shaftGradient(), transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, yTop - h / 2, z);
    m.renderOrder = 3;
    this.eng.scene.add(m);
    return m;
  }

  // ── hanging iron cage lantern (the classic camera-yanker — now decor) ─────
  private buildHangingLantern(l: LightDef) {
    const g = new THREE.Group();
    const iron = getMaterial('iron', 1);
    const dark = getMaterial('iron', 0);
    const x = l.x * CELL, z = l.z * CELL;
    // chain down from the unseen ceiling
    const chainH = WALL_H - 9.7;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, chainH, 5), dark);
    chain.position.y = 9.7 + chainH / 2;
    g.add(chain);
    for (let i = 0; i < 3; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 5, 10), dark);
      link.position.y = 10.0 + i * 0.5; link.rotation.y = i * 1.2;
      g.add(link);
    }
    // cage
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.42, 6), iron);
    cap.position.y = 9.35; cap.castShadow = true; g.add(cap);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), iron);
    plate.position.y = 8.0; g.add(plate);
    for (const [px, pz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as [number, number][]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.4, 0.07), iron);
      post.position.set(px, 8.7, pz); g.add(post);
    }
    g.position.set(x, 0, z);
    this.eng.scene.add(g);
    this.lanterns.push(g);
    // HIGH PROP, thin + decorative → the camera sweep passes it by (yMin 7+)
    this.obstructionBoxes.push({ x1: x - 0.8, z1: z - 0.8, x2: x + 0.8, z2: z + 0.8, yMin: 7.4, yMax: 9.9, decor: true });
  }

  // ── brazier embers (sparks rising off the coals) ──────────────────────────
  private buildEmbers(anchors: { x: number; y: number; z: number }[]) {
    if (!anchors.length) { this.embers = null; return; }
    const N = anchors.length * 10;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    this.embersMeta = [];
    for (let i = 0; i < N; i++) {
      const a = anchors[i % anchors.length];
      const x = a.x + (Math.random() - 0.5) * 2.4, y = a.y + Math.random() * 1.6, z = a.z + (Math.random() - 0.5) * 2.4;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      this.embersMeta.push({ hx: x, hy: y, hz: z, r: 1.7, ph: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.9 });
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.embers = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xe89a4a, size: 0.9, transparent: true, opacity: 0.85,
      map: sparkSprite(), blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.embers.frustumCulled = false;
    this.eng.scene.add(this.embers);
  }

  // ── dust motes drifting in the light (warm at torches, cool at crypt lights)
  private buildMotes(lights: LightDef[]) {
    if (!lights.length) { this.motes = null; return; }
    const N = lights.length * 12;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const cols = new Float32Array(N * 3);
    this.motesMeta = [];
    const warm = new THREE.Color(0xd8b083);
    const cool = new THREE.Color(0x9fd8cc);
    for (let i = 0; i < N; i++) {
      const l = lights[i % lights.length];
      const m: MoteMeta = {
        hx: l.x * CELL, hy: l.flicker ? 4.2 : 6.2, hz: l.z * CELL,
        r: 3.5 + Math.random() * 2.5, h: 1.6 + Math.random() * 1.8,
        sp: 0.1 + Math.random() * 0.22, ph: Math.random() * Math.PI * 2
      };
      this.motesMeta.push(m);
      pos[i * 3] = m.hx; pos[i * 3 + 1] = m.hy; pos[i * 3 + 2] = m.hz;
      const c = l.flicker ? warm : cool;
      cols[i * 3] = c.r * 0.7; cols[i * 3 + 1] = c.g * 0.7; cols[i * 3 + 2] = c.b * 0.7;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    this.motes = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.5, map: softSprite(), vertexColors: true, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.motes.frustumCulled = false;
    this.eng.scene.add(this.motes);
  }

  // ── ground fog: low translucent plane, animated noise alpha ───────────────
  private buildGroundFog(map: MapDef) {
    const W = map.size.w * CELL, H = map.size.h * CELL;
    const deadland = map.biomeBounds?.deadlands?.[0];
    this.deadlandFog = !!deadland;
    const width = deadland ? deadland.radiusX * CELL * 2 : W;
    const height = deadland ? deadland.radiusZ * CELL * 2 : H;
    let centerY = 1.8;
    if (deadland && map.terrain) {
      const x = Math.max(0, Math.min(map.size.w, Math.round(deadland.x)));
      const z = Math.max(0, Math.min(map.size.h, Math.round(deadland.z)));
      centerY = (map.terrain.heightFt[z * map.terrain.width + x] || 0) + 1.6;
    }
    const tex = noiseTexture(256);
    tex.repeat.set(width / 22, height / 22);
    this.groundFog = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: 0x10171a, alphaMap: tex, transparent: true, opacity: 0, depthWrite: false
      })
    );
    this.groundFog.rotation.x = -Math.PI / 2;
    this.groundFog.position.set(
      deadland ? deadland.x * CELL : W / 2,
      centerY,
      deadland ? deadland.z * CELL : H / 2,
    );
    this.groundFog.renderOrder = 1;   // under FogOfWar plane (renderOrder 2)
    this.eng.scene.add(this.groundFog);
  }

  setEnv(env: { time: number; weather: string; mode: string }) {
    this.weather = env.weather;
    this.applyWeather();
  }

  private applyWeather() {
    const w = WEATHERS[this.weather] || WEATHERS.clear;
    if (this.isCrypt) {
      this.fogTarget = 0.026 + w.fog * 0.55;  // dense crypt atmosphere
      this.rainTarget = w.rain * 0.16;        // leak drips only, indoors
    } else {
      this.fogTarget = w.fog;
      this.rainTarget = w.rain;
    }
  }

  onMapTheme(map: MapDef) {
    const tiles = getAreaTileSet(map);
    this.isCrypt = !tiles.outdoor;
    this.clearAtmosphere();
    this.buildGroundFog(map);

    const anchors: { x: number; y: number; z: number }[] = [];
    for (const l of map.lights) {
      const col = new THREE.Color(l.color);
      const braz = l.flicker;                 // flicker = brazier; static = hanging lantern
      const ly = braz ? 5.1 : 8.55;
      const light = new THREE.PointLight(col, braz ? 320 : 190, l.radiusFt * 1.9, 2); // decay 2 = distance²
      light.position.set(l.x * CELL, ly, l.z * CELL);
      light.castShadow = braz && !this.eng.lowgfx;  // only braziers cast (perf)
      if (light.castShadow) {
        light.shadow.mapSize.set(512, 512);
        light.shadow.bias = -0.004;
        light.shadow.normalBias = 0.6;
        (light.shadow.camera as THREE.PerspectiveCamera).near = 0.5;
      }
      this.eng.scene.add(light);
      // wide soft wash — reads like bounce off the walls
      const wash = new THREE.PointLight(col, braz ? 85 : 60, l.radiusFt * 3.2, 2);
      wash.position.set(l.x * CELL, ly + 2.6, l.z * CELL);
      this.eng.scene.add(wash);
      this.washLights.push(wash);
      // flame billboard: white-hot core → ember edges (crypt teal for lanterns)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: flameSprite(braz ? 0 : 1), transparent: true, opacity: 0.96,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      const w = braz ? 3.5 : 1.7, h = braz ? 5.3 : 2.6;
      sprite.scale.set(w, h, 1);
      sprite.position.set(l.x * CELL, ly + (braz ? 0.55 : 0.1), l.z * CELL);
      this.eng.scene.add(sprite);
      const core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSprite(), color: braz ? 0xffe9b0 : 0xbffff2, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      core.scale.setScalar(braz ? 2.6 : 1.3);
      core.position.copy(sprite.position);
      this.eng.scene.add(core);
      // light shaft below the flame
      const shaft = braz
        ? this.buildShaft(l.x * CELL, l.z * CELL, 4.9, 4.6, 0.95, 3.4, 0xff9a4d, 0.05)
        : this.buildShaft(l.x * CELL, l.z * CELL, 8.3, 8.1, 1.0, 2.6, 0x7fd4c8, 0.042);
      if (!braz) this.buildHangingLantern(l);
      else anchors.push({ x: l.x * CELL, y: 5.6, z: l.z * CELL });
      this.torches.push({ light, base: braz ? 330 : 195, phase: Math.random() * 9, sprite, core, w, h, shaft, shaftBase: braz ? 0.05 : 0.042 });
    }
    this.buildEmbers(anchors);
    this.buildMotes(map.lights);
    this.applyWeather();
  }

  private clearAtmosphere() {
    for (const t of this.torches) {
      this.eng.scene.remove(t.light); this.eng.scene.remove(t.sprite); this.eng.scene.remove(t.core);
      t.light.dispose(); (t.sprite.material as THREE.SpriteMaterial).dispose();
      (t.core.material as THREE.SpriteMaterial).dispose();
      if (t.shaft) {
        this.eng.scene.remove(t.shaft);
        t.shaft.geometry.dispose(); (t.shaft.material as THREE.Material).dispose();
      }
    }
    this.torches = [];
    for (const w of this.washLights) { this.eng.scene.remove(w); w.dispose(); }
    this.washLights = [];
    for (const g of this.lanterns) {
      this.eng.scene.remove(g);
      g.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
    }
    this.lanterns = [];
    this.obstructionBoxes = [];
    if (this.embers) { this.eng.scene.remove(this.embers); this.embers.geometry.dispose(); (this.embers.material as THREE.Material).dispose(); this.embers = null; }
    if (this.motes) { this.eng.scene.remove(this.motes); this.motes.geometry.dispose(); (this.motes.material as THREE.Material).dispose(); this.motes = null; }
    if (this.groundFog) {
      this.eng.scene.remove(this.groundFog);
      this.groundFog.geometry.dispose(); (this.groundFog.material as THREE.Material).dispose();
      this.groundFog = null;
    }
  }

  private isNight(hour: number) { return hour < 5.8 || hour > 19.4; }

  update(dt: number, env: { time: number; weather: string; mode: string }) {
    this.t += dt;
    this.fireSfxT -= dt;
    if (this.isCrypt && this.fireSfxT <= 0) {
      this.fireSfxT = 2.5 + Math.random() * 3.5;
      const camera = this.eng.camera.position;
      const nearest = this.torches.reduce((best, torch) => Math.min(best,
        camera.distanceTo(torch.light.position)), Infinity);
      if (nearest < 24) playSfx('fire', 1 - nearest / 24);
    }
    const hour = (env.time / 60) % 24;

    // ── sky / sun / moon
    const sky = keyLerp(SKY, hour), sunC = keyLerp(SUNCOL, hour);
    let nightF = hour < 6 ? (6 - hour) / 2.2 : hour > 18 ? (hour - 18) / 2.2 : 0;
    nightF = Math.min(1, Math.max(0, nightF));
    if (hour < 5 || hour > 20) nightF = 1;
    const night = this.isNight(hour);

    const bg = this.eng.scene.background as THREE.Color | null;
    const fogC = this.eng.scene.fog as THREE.FogExp2;
    const skyUniforms = (this.skyDome.material as THREE.ShaderMaterial).uniforms;
    skyUniforms.uTime.value = this.t;
    skyUniforms.uSunDirection.value.set(-Math.cos(((hour - 6) / 12) * Math.PI),
      Math.sin(((hour - 6) / 12) * Math.PI) * 0.75 + 0.1, 0.32).normalize();
    skyUniforms.uSunColor.value.setHex(sunC);
    if (this.isCrypt) {
      bg?.setHex(0x060a0a);                 // crypt blue-green black
      fogC.color.setHex(0x070c0c);
      skyUniforms.uTop.value.setHex(0x060a0a);
      skyUniforms.uHorizon.value.setHex(0x060a0a);
      skyUniforms.uLow.value.setHex(0x060a0a);
      skyUniforms.uSunset.value = 0;
    } else {
      bg?.setHex(sky);
      fogC.color.setHex(lerpHex(sky, 0x000000, 0.18));
      skyUniforms.uTop.value.setHex(night ? lerpHex(sky, 0x071020, 0.72) : 0x5b9dce);
      skyUniforms.uHorizon.value.setHex(night ? lerpHex(sky, 0x18263a, 0.54) : 0xbad5e6);
      skyUniforms.uLow.value.setHex(night ? lerpHex(sky, 0x111a29, 0.5) : 0xe4d0aa);
      skyUniforms.uSunset.value = Math.max(
        0, 1 - Math.abs(hour - 6.4) / 1.8, 1 - Math.abs(hour - 18.1) / 2.1,
      );
    }
    this.skyDome.position.copy(this.eng.camera.position);

    const sunAngle = ((hour - 6) / 12) * Math.PI;
    const focus = this.eng.actors.focusPoint();
    const dirY = night ? 0.55 : Math.max(0.18, Math.sin(sunAngle));
    this.sun.position.set(focus.x + Math.cos(sunAngle) * -120, 80 + dirY * 100, focus.z + 60);
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.sun.color.setHex(this.isCrypt ? 0x2c2822 : (night ? 0x8ca0cc : sunC));
    this.sun.intensity = this.isCrypt ? 0.3 : (night ? 0.55 : 0.65 + Math.min(1.45, Math.max(0, Math.sin(sunAngle)) * 1.5));
    this.sun.castShadow = !this.isCrypt;    // no sun shadows indoors — torches only
    // rim light: crypt blue-green; night moon-blue; day cool sky
    this.rim.color.setHex(this.isCrypt ? 0x5a8a86 : (night ? 0x8ca0cc : 0x9ab0c8));
    this.rim.intensity = this.isCrypt ? 0.18 : (night ? 0.3 : 0.36);
    this.hemi.color.setHex(this.isCrypt ? 0x36444c : (night ? 0x46506e : 0x6a7488));
    this.hemi.groundColor.setHex(this.isCrypt ? 0x171310 : 0x2a2218);
    this.hemi.intensity = this.isCrypt ? 0.32 : (night ? 0.5 : 0.92);
    this.ambient.color.setHex(this.isCrypt ? 0x6f7d82 : (night ? 0x4a5a78 : 0x9a968c));
    this.ambient.intensity = this.isCrypt ? 0.3 : (night ? 0.5 : 0.82);
    (this.stars.material as THREE.PointsMaterial).opacity = this.isCrypt ? 0 : Math.min(1, Math.max(0, (nightF - 0.3) * 1.5));

    // ── sky discs (ember sun / bone moon) — outdoors only
    if (!this.isCrypt) {
      _v.set(-Math.cos(sunAngle), Math.sin(sunAngle) * 0.75 + 0.1, 0.32).normalize();
      this.sunDisc.position.set(focus.x + _v.x * 460, _v.y * 460, focus.z + _v.z * 460);
      (this.sunDisc.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(1, Math.sin(sunAngle) * 4)) * 0.95;
      _v.set(Math.cos(sunAngle), -Math.sin(sunAngle) * 0.7 + 0.25, -0.3).normalize();
      this.moonDisc.position.set(focus.x + _v.x * 460, _v.y * 460, focus.z + _v.z * 460);
      (this.moonDisc.material as THREE.SpriteMaterial).opacity = nightF * 0.9;
    } else {
      (this.sunDisc.material as THREE.SpriteMaterial).opacity = 0;
      (this.moonDisc.material as THREE.SpriteMaterial).opacity = 0;
    }

    // ── fog / rain blend
    this.fogDensity += (this.fogTarget - this.fogDensity) * Math.min(1, dt * 1.6);
    this.rainAmt += ((this.rainTarget === 0 ? 0 : this.rainTarget) - this.rainAmt) * Math.min(1, dt * 0.4);
    fogC.density = this.fogDensity;

    // ── ground fog drift
    if (this.groundFog) {
      const m = this.groundFog.material as THREE.MeshBasicMaterial;
      const target = this.isCrypt ? 0.42 : this.deadlandFog ? 0.3 : 0.02;
      this.groundFogOp += (target - this.groundFogOp) * Math.min(1, dt * 0.5);
      m.opacity = this.groundFogOp * (0.88 + Math.sin(this.t * 0.23) * 0.12);
      const tex = m.alphaMap!;
      tex.offset.x = (this.t * 0.0065) % 1;
      tex.offset.y = (this.t * 0.0042) % 1;
    }

    // ── brazier embers rise + gutter
    if (this.embers) {
      const arr = (this.embers.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const meta = this.embersMeta;
      for (let i = 0; i < meta.length; i++) {
        const m = meta[i];
        arr[i * 3] = m.hx + Math.sin(this.t * m.sp + m.ph) * m.r * 0.5;
        arr[i * 3 + 1] = m.hy + ((this.t * m.sp * 1.5 + m.ph) % 3.2);
        arr[i * 3 + 2] = m.hz + Math.cos(this.t * m.sp * 0.8 + m.ph) * m.r * 0.5;
      }
      this.embers.geometry.attributes.position.needsUpdate = true;
    }

    // ── dust motes drift in the light shafts
    if (this.motes) {
      const arr = (this.motes.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const meta = this.motesMeta;
      for (let i = 0; i < meta.length; i++) {
        const m = meta[i];
        arr[i * 3] = m.hx + Math.sin(this.t * m.sp * 0.9 + m.ph) * m.r;
        arr[i * 3 + 1] = m.hy + Math.sin(this.t * m.sp * 0.6 + m.ph * 1.7) * m.h;
        arr[i * 3 + 2] = m.hz + Math.cos(this.t * m.sp * 0.7 + m.ph * 0.6) * m.r;
      }
      this.motes.geometry.attributes.position.needsUpdate = true;
    }

    // ── torch flicker (light + flame + shaft together)
    for (const tc of this.torches) {
      const f = 1 + Math.sin(this.t * 13.7 + tc.phase) * 0.14 + Math.sin(this.t * 29.3 + tc.phase * 2) * 0.08;
      tc.light.intensity = tc.base * 1.25 * f;
      tc.sprite.scale.set(tc.w * (0.93 + f * 0.07), tc.h * (0.88 + f * 0.12), 1);
      tc.core.scale.setScalar((tc.w > 2 ? 2.6 : 1.3) * (0.9 + f * 0.1));
      if (tc.shaft) (tc.shaft.material as THREE.MeshBasicMaterial).opacity = tc.shaftBase * (0.75 + 0.25 * f);
    }

    // ── rain streaks (wind-driven quads around the camera)
    const rm = this.rain.material as THREE.MeshBasicMaterial;
    rm.opacity = Math.min(0.5, this.rainAmt * 0.55);
    if (this.rainAmt > 0.015) {
      this.wind.x = Math.sin(this.t * 0.12) * 0.9 + Math.sin(this.t * 0.033) * 0.5;
      this.wind.z = Math.cos(this.t * 0.1) * 0.7;
      const cam = this.eng.camera.position;
      this.eng.camera.getWorldDirection(_camF);
      const wx = this.wind.x * 0.3, wz = this.wind.z * 0.3;
      let ax = wx, ay = -1, az = wz;                      // streak axis (down + slant)
      let al = Math.sqrt(ax * ax + ay * ay + az * az); ax /= al; ay /= al; az /= al;
      let sx = ay * _camF.z - az * _camF.y;               // side = axis × view (billboard)
      let sy = az * _camF.x - ax * _camF.z;
      let sz = ax * _camF.y - ay * _camF.x;
      const sl = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      sx /= sl; sy /= sl; sz /= sl;
      const arr = (this.rain.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const drops = this.rain.userData.drops as { x: number; y: number; z: number; v: number }[];
      const gw = 0.075;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y -= d.v * dt * (0.55 + this.rainAmt * 0.7);
        d.x += wx * 9 * dt * this.rainAmt;
        d.z += wz * 9 * dt * this.rainAmt;
        if (d.y < cam.y - 30) {
          d.x = cam.x + (Math.random() - 0.5) * 130;
          d.y = cam.y + 26 + Math.random() * 26;
          d.z = cam.z + (Math.random() - 0.5) * 130;
        }
        const L = (1.0 + d.v * 0.022) * (0.5 + this.rainAmt * 0.5);
        const o = i * 12;
        arr[o] = d.x - sx * gw - ax * L; arr[o + 1] = d.y - sy * gw - ay * L; arr[o + 2] = d.z - sz * gw - az * L;
        arr[o + 3] = d.x + sx * gw - ax * L; arr[o + 4] = d.y + sy * gw - ay * L; arr[o + 5] = d.z + sz * gw - az * L;
        arr[o + 6] = d.x - sx * gw + ax * L; arr[o + 7] = d.y - sy * gw + ay * L; arr[o + 8] = d.z - sz * gw + az * L;
        arr[o + 9] = d.x + sx * gw + ax * L; arr[o + 10] = d.y + sy * gw + ay * L; arr[o + 11] = d.z + sz * gw + az * L;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // ── thunder
    if (this.weather === 'storm' && !this.isCrypt) {
      this.thunderT -= dt;
      if (this.thunderT <= 0) {
        this.thunderT = 7 + Math.random() * 14;
        this.flashEl.style.opacity = '0.5';
        setTimeout(() => { this.flashEl.style.opacity = '0'; }, 110);
      }
    }
  }

  dispose() { this.flashEl.remove(); this.clearAtmosphere(); }
}
