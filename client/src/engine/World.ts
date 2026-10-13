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
  discSprite, shaftGradient, noiseTexture, moonTexture, sunSprite
} from './sprites';

export interface SkyState {
  zenith: number;
  midSky: number;
  horizon: number;
  low: number;
  sunsetGlow: number;
  sunColor: number;
  moonColor: number;
  hemiSky: number;
  hemiGround: number;
  ambient: number;
  rim: number;
  sunIntensity: number;
  sunsetAmt: number;
  nightFactor: number;
}

interface SkyKeyframe extends SkyState {
  hour: number;
}

// 24-hour continuous atmospheric lighting schedule with rich golden hours (orange, pink, peach, magenta)
const SKY_KEYFRAMES: SkyKeyframe[] = [
  // 00:00 Midnight - Velvet space navy, luminous moon, cool silver glow
  {
    hour: 0.0,
    zenith: 0x030610, midSky: 0x070d1a, horizon: 0x0b1322, low: 0x080e18,
    sunsetGlow: 0x162032, sunColor: 0x9ab8e2, moonColor: 0xb8d0f4,
    hemiSky: 0x1c263a, hemiGround: 0x0c121c, ambient: 0x242e42, rim: 0x6e8cb8,
    sunIntensity: 0.55, sunsetAmt: 0.0, nightFactor: 1.0
  },
  // 04:30 Deep pre-dawn - Night holding, faint violet hint
  {
    hour: 4.5,
    zenith: 0x050916, midSky: 0x091024, horizon: 0x121b30, low: 0x0d1422,
    sunsetGlow: 0x222438, sunColor: 0x90a8cc, moonColor: 0xb0c8ec,
    hemiSky: 0x202a3e, hemiGround: 0x0e141e, ambient: 0x283248, rim: 0x6884aa,
    sunIntensity: 0.50, sunsetAmt: 0.0, nightFactor: 0.95
  },
  // 05:30 Astronomical Dawn - Deep violet-purple mid sky, faint rose-crimson horizon ember
  {
    hour: 5.5,
    zenith: 0x0a1428, midSky: 0x241a38, horizon: 0x54243e, low: 0x361626,
    sunsetGlow: 0x9a363a, sunColor: 0xcd7452, moonColor: 0x94acd2,
    hemiSky: 0x2e2c48, hemiGround: 0x161420, ambient: 0x3e3650, rim: 0x82729a,
    sunIntensity: 0.58, sunsetAmt: 0.45, nightFactor: 0.65
  },
  // 06:15 Civil Dawn - Flaming cadmium orange, coral & salmon dawn, vibrant pink/magenta mid-sky
  {
    hour: 6.25,
    zenith: 0x162c56, midSky: 0x5a2d56, horizon: 0xd45032, low: 0xeb783c,
    sunsetGlow: 0xfc6238, sunColor: 0xff8e40, moonColor: 0x8298b8,
    hemiSky: 0x52446a, hemiGround: 0x281c20, ambient: 0x6e525e, rim: 0xb27464,
    sunIntensity: 1.05, sunsetAmt: 0.95, nightFactor: 0.18
  },
  // 07:00 Morning Golden Hour - Radiant amber gold, apricot, peach haze
  {
    hour: 7.0,
    zenith: 0x224a7c, midSky: 0x567da8, horizon: 0xd68b54, low: 0xebb478,
    sunsetGlow: 0xf49c4e, sunColor: 0xffbe64, moonColor: 0x768ba4,
    hemiSky: 0x646684, hemiGround: 0x322820, ambient: 0x867e78, rim: 0xbfa27e,
    sunIntensity: 1.50, sunsetAmt: 0.55, nightFactor: 0.02
  },
  // 08:30 Crisp Morning - Atmospheric clear dark-fantasy azure
  {
    hour: 8.5,
    zenith: 0x25528e, midSky: 0x5a8cb8, horizon: 0x90bddc, low: 0xc8e0ec,
    sunsetGlow: 0xffd288, sunColor: 0xffe6be, moonColor: 0x667a92,
    hemiSky: 0x6e7e98, hemiGround: 0x2c2620, ambient: 0x9aa09c, rim: 0xa0b2c8,
    sunIntensity: 1.85, sunsetAmt: 0.0, nightFactor: 0.0
  },
  // 12:00 High Noon - Brilliant sunlit clarity, rich deep azure zenith
  {
    hour: 12.0,
    zenith: 0x204e8a, midSky: 0x5286b6, horizon: 0x88b6d8, low: 0xc0dcf0,
    sunsetGlow: 0xfff0d0, sunColor: 0xfffae8, moonColor: 0x5a6e84,
    hemiSky: 0x7586a0, hemiGround: 0x302820, ambient: 0xa2a8a4, rim: 0x9cb4cb,
    sunIntensity: 2.10, sunsetAmt: 0.0, nightFactor: 0.0
  },
  // 16:30 Late Afternoon - Sun tilting lower, warm golden dust
  {
    hour: 16.5,
    zenith: 0x224880, midSky: 0x5882ac, horizon: 0xa6b2c6, low: 0xd6c6ac,
    sunsetGlow: 0xf4b266, sunColor: 0xffd288, moonColor: 0x60748a,
    hemiSky: 0x70788c, hemiGround: 0x30261c, ambient: 0x9a9488, rim: 0xb2a690,
    sunIntensity: 1.75, sunsetAmt: 0.20, nightFactor: 0.0
  },
  // 17:45 Golden Hour - Rich honey amber, warm apricot and bronze gradients
  {
    hour: 17.75,
    zenith: 0x1d3868, midSky: 0x5e6894, horizon: 0xd47e44, low: 0xeba25e,
    sunsetGlow: 0xf68c3e, sunColor: 0xffa04e, moonColor: 0x7286a0,
    hemiSky: 0x665a76, hemiGround: 0x34241a, ambient: 0x94786c, rim: 0xc68c64,
    sunIntensity: 1.55, sunsetAmt: 0.75, nightFactor: 0.0
  },
  // 18:30 Peak Sunset - Flaming fiery orange, flamingo pink, coral, luscious plum-magenta mid sky
  {
    hour: 18.5,
    zenith: 0x15244e, midSky: 0x702a5c, horizon: 0xdc462a, low: 0xf27c3e,
    sunsetGlow: 0xfc5034, sunColor: 0xff6624, moonColor: 0x8698b4,
    hemiSky: 0x58365c, hemiGround: 0x2a181c, ambient: 0x7e4e56, rim: 0xcc6452,
    sunIntensity: 1.25, sunsetAmt: 1.0, nightFactor: 0.12
  },
  // 19:20 Dusk / Twilight - Deep crimson-ruby horizon ember, royal amethyst, midnight cobalt
  {
    hour: 19.33,
    zenith: 0x0e1a3a, midSky: 0x381c44, horizon: 0x6c223a, low: 0x4a1828,
    sunsetGlow: 0x9e2e3a, sunColor: 0xcc4c38, moonColor: 0x9cb2d2,
    hemiSky: 0x362a48, hemiGround: 0x1a121a, ambient: 0x443648, rim: 0x905068,
    sunIntensity: 0.70, sunsetAmt: 0.60, nightFactor: 0.58
  },
  // 20:15 Blue Hour - Moon taking the sky, deep twilight blue, subtle rose horizon fade
  {
    hour: 20.25,
    zenith: 0x060e22, midSky: 0x10162e, horizon: 0x20182a, low: 0x14101e,
    sunsetGlow: 0x362030, sunColor: 0x98aed4, moonColor: 0xb0c8ec,
    hemiSky: 0x22283c, hemiGround: 0x10121a, ambient: 0x2c3446, rim: 0x7086a8,
    sunIntensity: 0.58, sunsetAmt: 0.15, nightFactor: 0.88
  },
  // 21:00 Nightfall - Moonlight ruling the obsidian sky
  {
    hour: 21.0,
    zenith: 0x030610, midSky: 0x070d1a, horizon: 0x0c1424, low: 0x080f1c,
    sunsetGlow: 0x162234, sunColor: 0x9ab8e2, moonColor: 0xb8d0f4,
    hemiSky: 0x1c263a, hemiGround: 0x0c121c, ambient: 0x222c40, rim: 0x6a86b4,
    sunIntensity: 0.55, sunsetAmt: 0.0, nightFactor: 1.0
  },
  // 24:00 Midnight wrap
  {
    hour: 24.0,
    zenith: 0x030610, midSky: 0x070d1a, horizon: 0x0b1322, low: 0x080e18,
    sunsetGlow: 0x162032, sunColor: 0x9ab8e2, moonColor: 0xb8d0f4,
    hemiSky: 0x1c263a, hemiGround: 0x0c121c, ambient: 0x242e42, rim: 0x6e8cb8,
    sunIntensity: 0.55, sunsetAmt: 0.0, nightFactor: 1.0
  }
];

const WEATHERS: Record<string, { fog: number; rain: number; cloudCoverage: number; cloudDensity: number }> = {
  clear: { fog: 0.0010, rain: 0, cloudCoverage: 0.38, cloudDensity: 0.85 },
  overcast: { fog: 0.0022, rain: 0, cloudCoverage: 0.72, cloudDensity: 1.15 },
  fog: { fog: 0.0090, rain: 0, cloudCoverage: 0.62, cloudDensity: 1.00 },
  rain: { fog: 0.0028, rain: 0.55, cloudCoverage: 0.80, cloudDensity: 1.25 },
  storm: { fog: 0.0042, rain: 1.0, cloudCoverage: 0.90, cloudDensity: 1.45 }
};

function lerpHex(a: number, b: number, t: number): number {
  const r = (a >> 16 & 255) + (((b >> 16 & 255) - (a >> 16 & 255)) * t) | 0;
  const g = (a >> 8 & 255) + (((b >> 8 & 255) - (a >> 8 & 255)) * t) | 0;
  const bl = (a & 255) + (((b & 255) - (a & 255)) * t) | 0;
  return (r << 16) | (g << 8) | bl;
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothT(t: number): number {
  return t * t * (3 - 2 * t);
}

export function interpolateSky(hour: number): SkyState {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
    const k0 = SKY_KEYFRAMES[i];
    const k1 = SKY_KEYFRAMES[i + 1];
    if (h >= k0.hour && h <= k1.hour) {
      const rawT = (h - k0.hour) / ((k1.hour - k0.hour) || 1);
      const t = smoothT(rawT);
      return {
        zenith: lerpHex(k0.zenith, k1.zenith, t),
        midSky: lerpHex(k0.midSky, k1.midSky, t),
        horizon: lerpHex(k0.horizon, k1.horizon, t),
        low: lerpHex(k0.low, k1.low, t),
        sunsetGlow: lerpHex(k0.sunsetGlow, k1.sunsetGlow, t),
        sunColor: lerpHex(k0.sunColor, k1.sunColor, t),
        moonColor: lerpHex(k0.moonColor, k1.moonColor, t),
        hemiSky: lerpHex(k0.hemiSky, k1.hemiSky, t),
        hemiGround: lerpHex(k0.hemiGround, k1.hemiGround, t),
        ambient: lerpHex(k0.ambient, k1.ambient, t),
        rim: lerpHex(k0.rim, k1.rim, t),
        sunIntensity: lerpNum(k0.sunIntensity, k1.sunIntensity, t),
        sunsetAmt: lerpNum(k0.sunsetAmt, k1.sunsetAmt, t),
        nightFactor: lerpNum(k0.nightFactor, k1.nightFactor, t),
      };
    }
  }
  const last = SKY_KEYFRAMES[SKY_KEYFRAMES.length - 1];
  return { ...last };
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
  private groundFogLayers: THREE.Mesh[] = [];
  private heightFogVolume: THREE.Mesh | null = null;
  private sunShafts: THREE.Mesh | null = null;
  private heightFogMat: THREE.ShaderMaterial | null = null;
  private sunShaftsMat: THREE.ShaderMaterial | null = null;
  private cloudShadows: THREE.Mesh | null = null;
  private cloudShadowMat: THREE.ShaderMaterial | null = null;
  private cloudOffset = new THREE.Vector2(0, 0);
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

  private buildSkyDiscs() {
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunSprite(256), color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, fog: false
    }));
    this.sunDisc.scale.setScalar(55);
    this.eng.scene.add(this.sunDisc);

    this.moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moonTexture(256), color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, fog: false
    }));
    this.moonDisc.scale.setScalar(62);
    this.eng.scene.add(this.moonDisc);
  }

  private buildSkyDome() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uZenith: { value: new THREE.Color(0x25528e) },
        uMidSky: { value: new THREE.Color(0x5a8cb8) },
        uHorizon: { value: new THREE.Color(0x90bddc) },
        uLow: { value: new THREE.Color(0xc8e0ec) },
        uSunsetGlow: { value: new THREE.Color(0xfc5438) },
        uSunsetAmt: { value: 0.0 },
        uNightFactor: { value: 0.0 },
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uMoonDirection: { value: new THREE.Vector3(0, -1, 0) },
        uSunColor: { value: new THREE.Color(0xfffae8) },
        uMoonColor: { value: new THREE.Color(0xb8d0f4) },
        uCloudCoverage: { value: 0.38 },
        uCloudDensity: { value: 0.85 },
        uWindOffset: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uMidSky;
        uniform vec3 uHorizon;
        uniform vec3 uLow;
        uniform vec3 uSunsetGlow;
        uniform float uSunsetAmt;
        uniform float uNightFactor;
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uMoonDirection;
        uniform vec3 uSunColor;
        uniform vec3 uMoonColor;
        uniform float uCloudCoverage;
        uniform float uCloudDensity;
        uniform vec2 uWindOffset;

        varying vec3 vDirection;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
            mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.5000 * vnoise(p); p = p * 2.02 + vec2(1.6, 2.3);
          v += 0.2500 * vnoise(p); p = p * 2.03 - vec2(2.1, 1.4);
          v += 0.1250 * vnoise(p); p = p * 2.01 + vec2(3.5, 0.8);
          v += 0.0625 * vnoise(p);
          return v;
        }

        void main() {
          vec3 dir = normalize(vDirection);
          float h = dir.y;

          // 1. Atmospheric Gradient
          float upper = smoothstep(0.02, 0.72, h);
          float mid = smoothstep(-0.04, 0.38, h);
          vec3 sky = mix(uHorizon, uZenith, upper);
          sky = mix(sky, uMidSky, (1.0 - upper) * mid);
          float lower = 1.0 - smoothstep(-0.24, 0.06, h);
          sky = mix(sky, uLow, lower * 0.82);

          // 2. Sunset / Golden Hour Atmospheric Scattering Belt
          vec3 normSunDir = normalize(uSunDirection);
          vec3 normMoonDir = normalize(uMoonDirection);
          float sunAzimuth = max(0.0, dot(normalize(vec3(dir.x, 0.0, dir.z)), normalize(vec3(normSunDir.x, 0.0, normSunDir.z))));
          float sunsetBelt = exp(-pow((h - 0.035) * 8.5, 2.0));
          float sunsetDome = exp(-pow(max(0.0, h) * 3.2, 1.8));
          vec3 sunsetAtmosphere = uSunsetGlow * (sunsetBelt * (0.55 + 0.95 * pow(sunAzimuth, 2.0)) + sunsetDome * pow(sunAzimuth, 4.0) * 0.85);
          sky += sunsetAtmosphere * uSunsetAmt;

          // 3. Sun and Moon Coronas / Atmospheric Halos
          float sunDot = max(dot(dir, normSunDir), 0.0);
          float sunCorona = pow(sunDot, 64.0) * 0.45 + pow(sunDot, 12.0) * 0.18;
          sky += uSunColor * sunCorona * (1.0 - uNightFactor);

          float moonDot = max(dot(dir, normMoonDir), 0.0);
          float moonCorona = pow(moonDot, 96.0) * 0.38 + pow(moonDot, 14.0) * 0.14;
          sky += uMoonColor * moonCorona * uNightFactor * 0.75;

          // 4. Subtle background starry sparkle at night
          if (uNightFactor > 0.05 && h > 0.05) {
            float starGrid = hash21(floor(dir.xz / (h + 0.1) * 350.0));
            float starTwinkle = sin(uTime * 4.0 + starGrid * 60.0) * 0.5 + 0.5;
            float starBrightness = step(0.996, starGrid) * (0.3 + 0.7 * starTwinkle) * smoothstep(0.05, 0.25, h) * uNightFactor;
            sky += vec3(0.85, 0.92, 1.0) * starBrightness * 0.8;
          }

          // 5. Planar Troposphere Cloud Layer
          if (h > -0.05 && uCloudDensity > 0.01) {
            float planeDist = 1.0 / max(h + 0.18, 0.08);
            vec2 cloudCoord = (dir.xz * planeDist) * 0.0032 + uWindOffset;

            // Domain warping for billowing clouds
            vec2 warp = vec2(fbm(cloudCoord * 1.8 + vec2(0.0, 1.4)), fbm(cloudCoord * 1.8 + vec2(4.3, 2.8)));
            float rawDensity = fbm(cloudCoord * 2.2 + warp * 0.45);

            // Weather coverage thresholding
            float cloudThresh = 1.0 - uCloudCoverage;
            float cloudShape = smoothstep(cloudThresh - 0.18, cloudThresh + 0.22, rawDensity);
            float horizonFade = smoothstep(-0.02, 0.20, h);
            float cloudAlpha = clamp(cloudShape * horizonFade * uCloudDensity, 0.0, 1.0);

            if (cloudAlpha > 0.002) {
              // Modeling & Self-Shadowing: sample shifted towards sun
              vec2 sunShift = normalize(normSunDir.xz + vec2(0.001)) * 0.14;
              float sunSample = fbm((cloudCoord + sunShift) * 2.2 + warp * 0.45);
              float directSunIllum = clamp((rawDensity - sunSample * 0.85) * 2.6 + 0.38, 0.15, 1.25);

              // Forward Mie scattering (silver lining on sunlit edges)
              float forwardScatter = pow(sunDot, 5.0) * (1.0 - cloudShape * 0.75) * 1.35;

              // Daylight clouds
              vec3 cloudSunlit = vec3(0.94, 0.93, 0.90) * uSunColor * 1.1;
              vec3 cloudBelly = mix(uHorizon * 0.65, vec3(0.36, 0.40, 0.48), 0.52);
              vec3 dayCloud = mix(cloudBelly, cloudSunlit, clamp(directSunIllum + forwardScatter, 0.0, 1.0));

              // Golden Hour / Sunset clouds (vibrant peach, coral, salmon, and crimson alpenglow)
              vec3 sunsetCloud = mix(vec3(0.32, 0.18, 0.26), uSunsetGlow * 1.42, directSunIllum * 0.85 + forwardScatter * 1.3);

              // Night clouds (REALISTIC: dark slate charcoal, subtle moon silver illumination)
              vec2 moonShift = normalize(normMoonDir.xz + vec2(0.001)) * 0.14;
              float moonSample = fbm((cloudCoord + moonShift) * 2.2 + warp * 0.45);
              float moonIllum = clamp((rawDensity - moonSample * 0.85) * 2.0 + 0.25, 0.05, 0.95);
              float moonScatter = pow(moonDot, 4.0) * (1.0 - cloudShape * 0.7) * 0.35;
              vec3 nightCloudBase = vec3(0.022, 0.028, 0.042);
              vec3 nightCloudHighlight = vec3(0.12, 0.16, 0.24) * uMoonColor * 1.2;
              vec3 nightCloud = mix(nightCloudBase, nightCloudHighlight, clamp(moonIllum * 0.5 + moonScatter, 0.0, 1.0));

              // Blend day -> sunset -> night
              vec3 litCloud = mix(dayCloud, sunsetCloud, uSunsetAmt);
              litCloud = mix(litCloud, nightCloud, uNightFactor);

              // Crepuscular god rays breaking through cloud canopy
              float rayAngle = atan(dir.x - normSunDir.x, dir.y - normSunDir.y);
              float rays = sin(rayAngle * 14.0 + uTime * 0.025) * 0.5 + 0.5;
              rays = pow(rays, 3.0) * pow(sunDot, 2.2) * (1.0 - cloudAlpha * 0.65);
              vec3 rayColor = mix(uSunColor, uSunsetGlow, uSunsetAmt);
              sky += rayColor * rays * 0.35 * (1.0 - uNightFactor);

              // Composite cloud layer over sky
              sky = mix(sky, litCloud, cloudAlpha);
            }
          }

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

  // ── layered ground fog with undulating waves, radial feathering, and dual-noise drift ──
  private buildGroundFog(map: MapDef) {
    const W = map.size.w * CELL, H = map.size.h * CELL;
    const deadland = map.biomeBounds?.deadlands?.[0];
    this.deadlandFog = !!deadland;
    const width = deadland ? deadland.radiusX * CELL * 2.2 : W * 1.15;
    const height = deadland ? deadland.radiusZ * CELL * 2.2 : H * 1.15;
    let baseElevation = 0;
    if (deadland && map.terrain) {
      const x = Math.max(0, Math.min(map.size.w, Math.round(deadland.x)));
      const z = Math.max(0, Math.min(map.size.h, Math.round(deadland.z)));
      baseElevation = map.terrain.heightFt[z * map.terrain.width + x] || 0;
    }

    const nTex = noiseTexture(256);
    const centerX = deadland ? deadland.x * CELL : W / 2;
    const centerZ = deadland ? deadland.z * CELL : H / 2;

    const tierHeights = this.isCrypt ? [0.8, 2.2] : [1.4, 3.8, 7.2];
    const tierSpeeds: [number, number][] = [
      [0.007, 0.0035],
      [-0.0045, 0.006],
      [0.003, -0.0045]
    ];

    for (let i = 0; i < tierHeights.length; i++) {
      const yPos = baseElevation + tierHeights[i];
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uNoiseTex: { value: nTex },
          uColor: { value: new THREE.Color(this.isCrypt ? 0x0c1618 : 0x1b1d1e) },
          uOpacity: { value: 0.0 },
          uSpeed: { value: new THREE.Vector2(tierSpeeds[i][0], tierSpeeds[i][1]) },
          uTile: { value: new THREE.Vector2(width / (26 + i * 8), height / (26 + i * 8)) },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 0.045 + uTime * 0.7 + float(${i})) * cos(pos.y * 0.045 + uTime * 0.6) * 0.4;
            vec4 wp = modelMatrix * vec4(pos, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform sampler2D uNoiseTex;
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform vec2 uSpeed;
          uniform vec2 uTile;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            // Soft radial feathering - no hard rectangular borders
            float distFromCenter = length(vUv * 2.0 - 1.0);
            float radial = 1.0 - smoothstep(0.42, 0.98, distFromCenter);
            if (radial <= 0.001) discard;

            vec2 uv1 = vUv * uTile + uSpeed * uTime * 0.25;
            vec2 uv2 = vUv * (uTile * 1.6) - vec2(uSpeed.y, uSpeed.x) * uTime * 0.2;
            float n1 = texture2D(uNoiseTex, uv1).r;
            float n2 = texture2D(uNoiseTex, uv2).r;
            float mist = mix(n1, n2, 0.48);
            mist = smoothstep(0.2, 0.8, mist);

            float alpha = uOpacity * radial * mist;
            gl_FragColor = vec4(uColor, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 16, 16), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(centerX, yPos, centerZ);
      plane.renderOrder = 1;
      this.eng.scene.add(plane);
      this.groundFogLayers.push(plane);
    }
  }

  // ── volumetric height fog volume: exponential altitude attenuation + solar in-scattering ──
  private buildHeightFogVolume(map: MapDef) {
    const W = map.size.w * CELL, H = map.size.h * CELL;
    const radius = Math.max(W, H) * 0.75 + 160;
    const volumeHeight = this.isCrypt ? 42 : 180;
    const geo = new THREE.CylinderGeometry(radius, radius, volumeHeight, 28, 8, true);

    this.heightFogMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: new THREE.Vector3() },
        uFogColor: { value: new THREE.Color(this.isCrypt ? 0x070c0c : 0x4a545e) },
        uSunColor: { value: new THREE.Color(0xd8c2a2) },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uBaseHeight: { value: 0.0 },
        uHeightFalloff: { value: this.isCrypt ? 0.075 : 0.038 },
        uDensity: { value: 0.22 },
        uNoiseTex: { value: noiseTexture(256) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mvp.xyz;
          gl_Position = projectionMatrix * mvp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        uniform vec3 uFogColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDirection;
        uniform float uBaseHeight;
        uniform float uHeightFalloff;
        uniform float uDensity;
        uniform sampler2D uNoiseTex;
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;

        void main() {
          vec3 toFrag = vWorldPos - uCameraPos;
          float dist = length(toFrag);
          vec3 viewDir = normalize(toFrag);

          // Exponential height falloff: dense in low valleys/crypts, thinning above
          float fragH = max(0.0, vWorldPos.y - uBaseHeight);
          float camH = max(0.0, uCameraPos.y - uBaseHeight);
          float avgH = (fragH + camH) * 0.5;
          float heightFactor = exp(-avgH * uHeightFalloff);

          // Optical depth accumulation along the ray
          float distFactor = 1.0 - exp(-dist * 0.0075);

          // Billowing atmospheric noise drifting in world space
          vec2 noiseCoord = vWorldPos.xz * 0.005 + vec2(uTime * 0.0025, uTime * 0.0018);
          float n = texture2D(uNoiseTex, noiseCoord).r;
          float mistBillow = 0.72 + 0.38 * n;

          float fogFactor = clamp(distFactor * heightFactor * uDensity * mistBillow, 0.0, 0.88);

          // Forward solar in-scattering (Mie glow when facing sun/moon)
          float sunDot = max(0.0, dot(viewDir, normalize(uSunDirection)));
          float sunScatter = pow(sunDot, 5.0) * 0.42;
          vec3 finalColor = mix(uFogColor, uSunColor, sunScatter);

          // Fade smoothly near camera to prevent hard near-plane clipping
          float camFade = smoothstep(6.0, 30.0, dist);
          fogFactor *= camFade;

          if (fogFactor <= 0.002) discard;
          gl_FragColor = vec4(finalColor, fogFactor);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    this.heightFogVolume = new THREE.Mesh(geo, this.heightFogMat);
    this.heightFogVolume.position.set(W / 2, volumeHeight / 2 - 5, H / 2);
    this.heightFogVolume.renderOrder = 2;
    this.eng.scene.add(this.heightFogVolume);
  }

  // ── volumetric sun & moon light shafts (god rays) ──────────────────────────
  private buildVolumetricShafts(map: MapDef) {
    if (this.eng.lowgfx) return; // preserve low-end performance
    const W = map.size.w * CELL, H = map.size.h * CELL;
    const baseR = this.isCrypt ? 85 : 340;
    const topR = this.isCrypt ? 12 : 35;
    const height = this.isCrypt ? 90 : 380;
    const geo = new THREE.CylinderGeometry(topR, baseR, height, 22, 6, true);

    this.sunShaftsMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color(0xffe8c8) },
        uCameraPos: { value: new THREE.Vector3() },
        uIntensity: { value: 0.15 },
        uNoiseTex: { value: noiseTexture(256) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mvp.xyz;
          gl_Position = projectionMatrix * mvp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        uniform vec3 uCameraPos;
        uniform float uIntensity;
        uniform sampler2D uNoiseTex;
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;

        void main() {
          if (uIntensity <= 0.001) discard;
          vec3 viewDir = normalize(vWorldPos - uCameraPos);
          vec3 sunDir = normalize(uSunDirection);

          // Mie forward scattering phase function
          float cosTheta = dot(viewDir, sunDir);
          float g = 0.68;
          float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5);
          phase = clamp(phase * 0.28, 0.06, 2.5);

          // Height falloff along the beam
          float beamFade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.55, vUv.y);

          // Animated dust and cloud filament streaks scrolling through the shaft
          vec2 uv1 = vec2(vUv.x * 3.5 + uTime * 0.012, vUv.y * 1.8 - uTime * 0.024);
          vec2 uv2 = vec2(vUv.x * 6.0 - uTime * 0.018, vUv.y * 3.2 - uTime * 0.038);
          float n1 = texture2D(uNoiseTex, uv1).r;
          float n2 = texture2D(uNoiseTex, uv2).r;
          float shaftDensity = mix(n1, n2, 0.45);
          shaftDensity = smoothstep(0.18, 0.78, shaftDensity) * 1.35;

          // Camera near fade to prevent harsh clipping
          float dist = length(vViewPos);
          float camNearFade = smoothstep(6.0, 32.0, dist);

          float alpha = uIntensity * phase * beamFade * shaftDensity * camNearFade;
          if (alpha <= 0.002) discard;

          vec3 color = uSunColor * (1.0 + phase * 0.45);
          gl_FragColor = vec4(color * alpha, alpha * 0.82);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.sunShafts = new THREE.Mesh(geo, this.sunShaftsMat);
    this.sunShafts.position.set(W / 2, 70, H / 2);
    this.sunShafts.renderOrder = 3;
    this.eng.scene.add(this.sunShafts);
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
    this.buildHeightFogVolume(map);
    this.buildVolumetricShafts(map);
    this.buildCloudShadows(map);

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

  private buildCloudShadows(map: MapDef) {
    if (this.cloudShadows) {
      this.eng.scene.remove(this.cloudShadows);
      this.cloudShadows.geometry.dispose();
      (this.cloudShadows.material as THREE.Material).dispose();
      this.cloudShadows = null;
      this.cloudShadowMat = null;
    }
    if (this.isCrypt) return;

    const W = map.size.w;
    const H = map.size.h;
    const terrain = map.terrain;
    let geo: THREE.BufferGeometry;

    if (terrain && terrain.width === W + 1 && terrain.height === H + 1) {
      const vertices = (W + 1) * (H + 1);
      const positions = new Float32Array(vertices * 3);
      const uvs = new Float32Array(vertices * 2);
      const indices = new Uint32Array(W * H * 6);
      const heights = terrain.heightFt;
      for (let z = 0; z <= H; z++) for (let x = 0; x <= W; x++) {
        const at = (z * (W + 1) + x) * 3;
        positions[at] = x * CELL;
        positions[at + 1] = (heights[z * (W + 1) + x] || 0) + 0.20;
        positions[at + 2] = z * CELL;
        const uvAt = (z * (W + 1) + x) * 2;
        uvs[uvAt] = x / W;
        uvs[uvAt + 1] = 1 - z / H;
      }
      for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
        const at = z * W + x;
        const base = at * 6;
        const i0 = z * (W + 1) + x;
        const i1 = i0 + 1;
        const i2 = i0 + (W + 1);
        const i3 = i2 + 1;
        indices.set([i0, i2, i1, i1, i2, i3], base);
      }
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
    } else {
      geo = new THREE.PlaneGeometry(W * CELL, H * CELL, 32, 32);
    }

    this.cloudShadowMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindOffset: { value: this.cloudOffset },
        uCloudCoverage: { value: 0.38 },
        uShadowStrength: { value: 0.36 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec2 uWindOffset;
        uniform float uCloudCoverage;
        uniform float uShadowStrength;
        varying vec3 vWorldPos;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i + vec2(0.0,0.0)), hash21(i + vec2(1.0,0.0)), u.x),
            mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0,1.0)), u.x),
            u.y
          );
        }
        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.5000 * vnoise(p); p = p * 2.02 + vec2(1.6, 2.3);
          v += 0.2500 * vnoise(p); p = p * 2.03 - vec2(2.1, 1.4);
          v += 0.1250 * vnoise(p); p = p * 2.01 + vec2(3.5, 0.8);
          v += 0.0625 * vnoise(p);
          return v;
        }

        void main() {
          if (uShadowStrength <= 0.005) discard;
          vec2 cloudCoord = vWorldPos.xz * 0.0032 + uWindOffset;
          vec2 warp = vec2(fbm(cloudCoord * 1.8 + vec2(0.0, 1.4)), fbm(cloudCoord * 1.8 + vec2(4.3, 2.8)));
          float rawDensity = fbm(cloudCoord * 2.2 + warp * 0.45);
          float cloudThresh = 1.0 - uCloudCoverage;
          float shadowDensity = smoothstep(cloudThresh - 0.14, cloudThresh + 0.26, rawDensity);
          float alpha = shadowDensity * uShadowStrength;
          if (alpha <= 0.005) discard;
          gl_FragColor = vec4(0.012, 0.016, 0.026, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });

    this.cloudShadows = new THREE.Mesh(geo, this.cloudShadowMat);
    if (!terrain || terrain.width !== W + 1 || terrain.height !== H + 1) {
      this.cloudShadows.rotation.x = -Math.PI / 2;
      this.cloudShadows.position.set((W * CELL) / 2, 0.20, (H * CELL) / 2);
    }
    this.cloudShadows.renderOrder = 1;
    this.eng.scene.add(this.cloudShadows);
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
    for (const layer of this.groundFogLayers) {
      this.eng.scene.remove(layer);
      layer.geometry.dispose();
      (layer.material as THREE.Material).dispose();
    }
    this.groundFogLayers = [];
    if (this.heightFogVolume) {
      this.eng.scene.remove(this.heightFogVolume);
      this.heightFogVolume.geometry.dispose();
      (this.heightFogVolume.material as THREE.Material).dispose();
      this.heightFogVolume = null;
      this.heightFogMat = null;
    }
    if (this.sunShafts) {
      this.eng.scene.remove(this.sunShafts);
      this.sunShafts.geometry.dispose();
      (this.sunShafts.material as THREE.Material).dispose();
      this.sunShafts = null;
      this.sunShaftsMat = null;
    }
    if (this.cloudShadows) {
      this.eng.scene.remove(this.cloudShadows);
      this.cloudShadows.geometry.dispose();
      (this.cloudShadows.material as THREE.Material).dispose();
      this.cloudShadows = null;
      this.cloudShadowMat = null;
    }
  }

  update(dt: number, env: { time: number; weather: string; mode: string }) {
    this.t += dt;
    this.cloudOffset.x += this.wind.x * dt * 0.0006;
    this.cloudOffset.y += this.wind.z * dt * 0.0006;

    this.fireSfxT -= dt;
    if (this.isCrypt && this.fireSfxT <= 0) {
      this.fireSfxT = 2.5 + Math.random() * 3.5;
      const camera = this.eng.camera.position;
      const nearest = this.torches.reduce((best, torch) => Math.min(best,
        camera.distanceTo(torch.light.position)), Infinity);
      if (nearest < 24) playSfx('fire', 1 - nearest / 24);
    }
    const hour = (env.time / 60) % 24;

    // Continuous 24-hour atmospheric interpolation
    const atmo = interpolateSky(hour);
    const wConfig = WEATHERS[this.weather] || WEATHERS.clear;
    const cloudCoverage = wConfig.cloudCoverage ?? 0.38;
    const cloudDensity = wConfig.cloudDensity ?? 1.0;

    const bg = this.eng.scene.background as THREE.Color | null;
    const fogC = this.eng.scene.fog as THREE.FogExp2;
    const skyUniforms = (this.skyDome.material as THREE.ShaderMaterial).uniforms;

    const sunAngle = ((hour - 6) / 12) * Math.PI;
    const moonAngle = sunAngle + Math.PI;

    const sunDir = new THREE.Vector3(-Math.cos(sunAngle), Math.sin(sunAngle) * 0.88, 0.28).normalize();
    const moonDir = new THREE.Vector3(-Math.cos(moonAngle), Math.sin(moonAngle) * 0.88, -0.28).normalize();

    skyUniforms.uTime.value = this.t;
    skyUniforms.uSunDirection.value.copy(sunDir);
    skyUniforms.uMoonDirection.value.copy(moonDir);
    skyUniforms.uSunColor.value.setHex(atmo.sunColor);
    skyUniforms.uMoonColor.value.setHex(atmo.moonColor);
    skyUniforms.uZenith.value.setHex(this.isCrypt ? 0x060a0a : atmo.zenith);
    skyUniforms.uMidSky.value.setHex(this.isCrypt ? 0x060a0a : atmo.midSky);
    skyUniforms.uHorizon.value.setHex(this.isCrypt ? 0x060a0a : atmo.horizon);
    skyUniforms.uLow.value.setHex(this.isCrypt ? 0x060a0a : atmo.low);
    skyUniforms.uSunsetGlow.value.setHex(atmo.sunsetGlow);
    skyUniforms.uSunsetAmt.value = this.isCrypt ? 0 : atmo.sunsetAmt;
    skyUniforms.uNightFactor.value = this.isCrypt ? 1 : atmo.nightFactor;
    skyUniforms.uCloudCoverage.value = cloudCoverage;
    skyUniforms.uCloudDensity.value = this.isCrypt ? 0 : cloudDensity;
    skyUniforms.uWindOffset.value.copy(this.cloudOffset);

    if (this.isCrypt) {
      bg?.setHex(0x060a0a);
      fogC.color.setHex(0x070c0c);
    } else {
      bg?.setHex(atmo.horizon);
      fogC.color.setHex(lerpHex(atmo.horizon, 0x000000, 0.16));
    }
    this.skyDome.position.copy(this.eng.camera.position);

    const focus = this.eng.actors.focusPoint();

    // ── sky discs (sun / moon) — outdoors only
    if (!this.isCrypt) {
      this.sunDisc.position.set(focus.x + sunDir.x * 480, sunDir.y * 480, focus.z + sunDir.z * 480);
      const sunVisible = Math.max(0, Math.min(1, (sunDir.y + 0.05) * 6));
      (this.sunDisc.material as THREE.SpriteMaterial).opacity = sunVisible * (1.0 - atmo.nightFactor * 0.85);

      this.moonDisc.position.set(focus.x + moonDir.x * 480, moonDir.y * 480, focus.z + moonDir.z * 480);
      const moonVisible = Math.max(0, Math.min(1, (moonDir.y + 0.05) * 6));
      (this.moonDisc.material as THREE.SpriteMaterial).opacity = moonVisible * atmo.nightFactor * 0.95;
    } else {
      (this.sunDisc.material as THREE.SpriteMaterial).opacity = 0;
      (this.moonDisc.material as THREE.SpriteMaterial).opacity = 0;
    }

    // ── directional celestial light (sun during day, moon during night)
    const isDay = sunDir.y > 0.02;
    const activeDir = isDay ? sunDir : moonDir;
    const activeColor = isDay ? atmo.sunColor : atmo.moonColor;

    // Check overhead cloud cover above focus to gently dim sunlight when in cloud shadow
    const overheadUvX = focus.x * 0.0032 + this.cloudOffset.x;
    const overheadUvZ = focus.z * 0.0032 + this.cloudOffset.y;
    const cloudOsc = Math.sin(overheadUvX * 12.0) * Math.cos(overheadUvZ * 12.0) * 0.5 + 0.5;
    const inCloudShadow = isDay && !this.isCrypt && cloudCoverage > 0.35 ? cloudOsc * 0.28 : 0.0;

    const activeIntensity = isDay
      ? atmo.sunIntensity * (1.0 - inCloudShadow)
      : (atmo.sunIntensity * 0.75 + 0.25 * atmo.nightFactor);

    this.sun.position.set(
      focus.x - activeDir.x * 120,
      80 + Math.max(18, activeDir.y * 100),
      focus.z - activeDir.z * 120
    );
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.sun.color.setHex(this.isCrypt ? 0x2c2822 : activeColor);
    this.sun.intensity = this.isCrypt ? 0.3 : activeIntensity;
    this.sun.castShadow = !this.isCrypt;

    // ── ambient & rim lighting
    this.rim.color.setHex(this.isCrypt ? 0x5a8a86 : atmo.rim);
    this.rim.intensity = this.isCrypt ? 0.18 : (isDay ? 0.34 : 0.28);
    this.hemi.color.setHex(this.isCrypt ? 0x36444c : atmo.hemiSky);
    this.hemi.groundColor.setHex(this.isCrypt ? 0x171310 : atmo.hemiGround);
    this.hemi.intensity = this.isCrypt ? 0.32 : (isDay ? 0.88 : 0.48);
    this.ambient.color.setHex(this.isCrypt ? 0x6f7d82 : atmo.ambient);
    this.ambient.intensity = this.isCrypt ? 0.3 : (isDay ? 0.80 : 0.44);
    (this.stars.material as THREE.PointsMaterial).opacity = this.isCrypt ? 0 : Math.min(1, Math.max(0, (atmo.nightFactor - 0.2) * 1.35));

    // ── dynamic cloud shadows on landscape
    if (this.cloudShadowMat) {
      this.cloudShadowMat.uniforms.uTime.value = this.t;
      this.cloudShadowMat.uniforms.uWindOffset.value.copy(this.cloudOffset);
      this.cloudShadowMat.uniforms.uCloudCoverage.value = cloudCoverage;
      const baseShadowStrength = (1.0 - atmo.nightFactor) * 0.42 + atmo.nightFactor * 0.08;
      this.cloudShadowMat.uniforms.uShadowStrength.value = this.isCrypt ? 0 : baseShadowStrength * (1.0 - this.rainAmt * 0.35);
    }

    // ── volumetric sun / moon shafts update
    if (this.sunShafts && this.sunShaftsMat) {
      this.sunShaftsMat.uniforms.uTime.value = this.t;
      this.sunShaftsMat.uniforms.uCameraPos.value.copy(this.eng.camera.position);
      const shaftDir = activeDir.clone();
      this.sunShaftsMat.uniforms.uSunDirection.value.copy(shaftDir);
      this.sunShaftsMat.uniforms.uSunColor.value.setHex(activeColor);

      const shaftIntensity = this.isCrypt
        ? 0.08
        : (isDay
          ? (0.18 + Math.max(0, sunDir.y) * 0.14) * (1.0 - this.rainAmt * 0.65)
          : (0.10 * atmo.nightFactor) * (1.0 - this.rainAmt * 0.65));
      this.sunShaftsMat.uniforms.uIntensity.value = this.weather === 'storm' ? shaftIntensity * 0.2 : shaftIntensity;

      this.sunShafts.position.set(focus.x, 80, focus.z);
      _v.copy(shaftDir).negate();
      this.sunShafts.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v);
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
