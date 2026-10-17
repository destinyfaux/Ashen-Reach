// conditionFX — 3D port of Custom-VTT's conditionFX.js (client/src/engine/conditionFX.ts)
// Persistent per-condition particle auras attached to actor tokens.
//
// The VTT drew stateless 2D canvas auras per frame (bubbles, stars, hearts,
// bolts…). This port keeps the same visual language and motion patterns but
// renders them as small THREE.Sprite pools parented to each actor group, so
// they follow the figure, scale with its race scale, and cost nothing when a
// token has no conditions. Glyph textures (star/heart/Z/bolt/bubble/ring) are
// baked once into a shared cache; each sprite animates its own opacity/scale.
//
// Motion patterns (ported from the 2D aura math, re-projected to 3D):
//   rise     — spawn at the base ring, sway upward, fade (poison, charm, Zzz)
//   fall     — spawn near the head, sink to the ground (bleeding, exhaustion)
//   orbit    — circle the head with fake depth scaling (stun, fear wisps)
//   pulse    — breathing ground ring (rage, restrained, dead)
//   ring     — expanding fading ground rings (deafened, invisible)
//   drift    — slow wander near the head (blinded dark, petrify dust)
//   crackle  — hash-gated lightning flashes (paralyzed)
//
// Policy: these are status EFFECTS, not plaques — no names, no numbers, no HP.
// Accessibility: prefers-reduced-motion swaps animation for a static ring.

import * as THREE from 'three';
import { softSprite } from './sprites';

const TAU = Math.PI * 2;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// ── glyph textures (baked once, shared across all actors) ────────────────────
const glyphCache = new Map<string, THREE.Texture>();

function radial(g: CanvasRenderingContext2D, color: string) {
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, color);
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  // hex → rgba for a soft edge
  g.fillStyle = grad;
  g.globalAlpha = 1;
  g.beginPath(); g.arc(32, 32, 30, 0, TAU); g.fill();
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function glyph(kind: string, color: string): THREE.Texture {
  const key = kind + '|' + color;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = color; g.fillStyle = color;
  g.lineWidth = 5.5; g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'soft': radial(g, hexA(color, 0.9)); break;
    case 'bubble': {
      g.beginPath(); g.arc(32, 32, 22, 0, TAU); g.stroke();
      g.globalAlpha = 0.65;
      g.beginPath(); g.arc(24, 24, 6, 0, TAU); g.fill();
      break;
    }
    case 'star': {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 26 : 11;
        const a = (i / 10) * TAU - Math.PI / 2;
        const px = 32 + Math.cos(a) * r, py = 32 + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.fill();
      break;
    }
    case 'heart': {
      g.beginPath();
      g.moveTo(32, 46);
      g.bezierCurveTo(56, 26, 46, 6, 32, 20);
      g.bezierCurveTo(18, 6, 8, 26, 32, 46);
      g.fill();
      break;
    }
    case 'z': {
      g.font = '800 44px Georgia, serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('Z', 32, 34);
      break;
    }
    case 'x': {
      g.beginPath();
      g.moveTo(16, 16); g.lineTo(48, 48);
      g.moveTo(48, 16); g.lineTo(16, 48);
      g.stroke();
      break;
    }
    case 'bolt': {
      g.beginPath();
      g.moveTo(38, 6); g.lineTo(22, 30); g.lineTo(34, 32); g.lineTo(20, 58);
      g.stroke();
      break;
    }
    case 'ring': {
      g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.stroke();
      break;
    }
    case 'dash': {
      g.setLineDash([9, 7]);
      g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.stroke();
      break;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  glyphCache.set(key, tex);
  return tex;
}

// ── style table (ported from ref AURAS + engine conditions) ─────────────────
type Pattern = 'rise' | 'fall' | 'orbit' | 'pulse' | 'ring' | 'drift' | 'crackle';
interface CondStyle {
  color: string;          // css hex
  tex: 'soft' | 'bubble' | 'star' | 'heart' | 'z' | 'x' | 'bolt' | 'ring' | 'dash';
  pattern: Pattern;
  count: number;          // sprites for this condition
  size: number;           // world ft
  additive?: boolean;     // glow blending
  speed?: number;         // pattern speed multiplier
}

const STYLES: Record<string, CondStyle> = {
  Poisoned:      { color: '#7cff6b', tex: 'bubble', pattern: 'rise', count: 3, size: 0.5 },
  Stunned:       { color: '#ffe36b', tex: 'star',   pattern: 'orbit', count: 3, size: 0.42, speed: 1 },
  Paralyzed:     { color: '#fff59b', tex: 'bolt',   pattern: 'crackle', count: 2, size: 1.1 },
  Frightened:    { color: '#b26bff', tex: 'soft',   pattern: 'orbit', count: 2, size: 0.5, speed: 1.7 },
  Charmed:       { color: '#ff8ad0', tex: 'heart',  pattern: 'rise', count: 2, size: 0.5 },
  Blinded:       { color: '#16161f', tex: 'soft',   pattern: 'drift', count: 3, size: 0.6 },
  Deafened:      { color: '#8f9bb0', tex: 'ring',   pattern: 'ring', count: 2, size: 0.9, speed: 0.8 },
  Grappled:      { color: '#a8763e', tex: 'dash',   pattern: 'pulse', count: 1, size: 1.9 },
  Restrained:    { color: '#c9c9c9', tex: 'dash',   pattern: 'pulse', count: 1, size: 1.9, speed: 0.6 },
  Incapacitated: { color: '#c8c8c8', tex: 'x',      pattern: 'orbit', count: 1, size: 0.5, speed: 0.4 },
  Petrified:     { color: '#8d8d94', tex: 'soft',   pattern: 'rise', count: 2, size: 0.55, speed: 0.4 },
  Unconscious:   { color: '#9fd8ff', tex: 'z',      pattern: 'rise', count: 2, size: 0.55, speed: 0.7 },
  Invisible:     { color: '#cfe9ff', tex: 'dash',   pattern: 'ring', count: 2, size: 1.0, speed: 0.5 },
  Dead:          { color: '#9aa0a6', tex: 'ring',   pattern: 'pulse', count: 1, size: 1.9, speed: 0.5 },
  Exhaustion:    { color: '#e0a53c', tex: 'soft',   pattern: 'fall', count: 2, size: 0.4, speed: 0.8 },
  // engine/overlay conditions beyond the VTT set
  Bleeding:      { color: '#b22222', tex: 'soft',   pattern: 'fall', count: 2, size: 0.34, speed: 1.2 },
  Burning:       { color: '#ff8c00', tex: 'soft',   pattern: 'rise', count: 3, size: 0.5, additive: true, speed: 1.5 },
  Blessed:       { color: '#ffd700', tex: 'soft',   pattern: 'rise', count: 3, size: 0.4, additive: true, speed: 0.8 },
  Raging:        { color: '#c93a2a', tex: 'ring',   pattern: 'pulse', count: 1, size: 1.9, speed: 1.4 },
  Concentrating: { color: '#6ad4c8', tex: 'soft',   pattern: 'orbit', count: 2, size: 0.34, speed: 2.2 },
  Hexed:         { color: '#8a2be2', tex: 'soft',   pattern: 'drift', count: 2, size: 0.45 },
  Surprised:     { color: '#ffe36b', tex: 'x',      pattern: 'orbit', count: 1, size: 0.5, speed: 0.9 },
};

const MAX_ACTIVE = 3;   // visual cap: the 3 most recently applied conditions

function fallbackStyle(name: string): CondStyle {
  const h = hash(String(name).split('').reduce((a, ch) => a + ch.charCodeAt(0), 7));
  const hue = Math.floor(h * 360);
  return {
    color: `hsl(${hue} 70% 62%)`,
    tex: 'soft', pattern: 'rise', count: 2, size: 0.4, speed: 0.9,
  };
}

// ── the per-actor controller ─────────────────────────────────────────────────
interface Active {
  name: string;
  style: CondStyle;
  sprites: THREE.Sprite[];
  age: number;
  seed: number;
}

export class ConditionFX {
  private host: THREE.Group;      // actor group (sprites live in its local space)
  private radius: number;         // ground ring radius (ft)
  private headY: number;          // head height above the group origin (ft)
  private active: Active[] = [];
  private reduced: boolean;

  constructor(host: THREE.Group, radius: number, headY: number) {
    this.host = host;
    this.radius = radius;
    this.headY = headY;
    this.reduced = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setConditions(names: string[]) {
    const want = (names || []).filter(Boolean).slice(0, MAX_ACTIVE);
    const have = new Set(this.active.map(a => a.name));
    const gone = this.active.filter(a => !want.includes(a.name));
    for (const a of gone) this.remove(a);
    for (const name of want) {
      if (have.has(name)) continue;
      const style = STYLES[name] || fallbackStyle(name);
      const seed = hash(String(name).split('').reduce((a, ch) => a + ch.charCodeAt(0), 31)) * 100;
      const sprites: THREE.Sprite[] = [];
      const n = this.reduced ? 1 : style.count;
      for (let i = 0; i < n; i++) {
        const mat = new THREE.SpriteMaterial({
          map: glyph(style.tex, style.color),
          transparent: true, opacity: 0, depthWrite: false,
          blending: style.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        });
        const sp = new THREE.Sprite(mat);
        sp.scale.setScalar(0.001);
        sp.visible = false;
        this.host.add(sp);
        sprites.push(sp);
      }
      this.active.push({ name, style, sprites, age: 0, seed });
    }
  }

  private remove(a: Active) {
    for (const sp of a.sprites) { sp.removeFromParent(); (sp.material as THREE.Material).dispose(); }
    this.active.splice(this.active.indexOf(a), 1);
  }

  update(dt: number, t: number) {
    for (const a of this.active) {
      a.age += dt;
      const n = a.sprites.length;
      for (let i = 0; i < n; i++) {
        this.updateSprite(a, i, n, dt, t);
      }
    }
  }

  private updateSprite(a: Active, i: number, n: number, _dt: number, t: number) {
    const sp = a.sprites[i];
    const m = sp.material as THREE.SpriteMaterial;
    const s = a.style;
    const ph = (a.age * (s.speed || 1) * 0.55 + i / n + a.seed) % 1;
    const sway = Math.sin(t * 1.6 + i * 2.1 + a.seed) * this.radius * 0.3;

    if (this.reduced) {
      // accessibility: one static, faint ground marker per condition
      sp.position.set(0, 0.22, 0);
      const k = this.radius * 1.06;
      sp.scale.set(k, k, 1);
      m.opacity = 0.42;
      sp.visible = true;
      return;
    }

    switch (s.pattern) {
      case 'rise': {
        const r = this.radius * (0.85 - ph * 0.45);
        sp.position.set(
          Math.cos(i / n * TAU + a.seed) * r + sway * 0.4,
          0.4 + ph * (this.headY + 0.5),
          Math.sin(i / n * TAU + a.seed) * r,
        );
        m.opacity = Math.sin(ph * Math.PI) * 0.9;
        const k = s.size * (1 - ph * 0.25);
        sp.scale.set(k, k, 1);
        break;
      }
      case 'fall': {
        const r = this.radius * (0.4 + ph * 0.5);
        sp.position.set(
          Math.cos(i / n * TAU + a.seed) * r + sway * 0.3,
          this.headY + 0.3 - ph * (this.headY + 0.1),
          Math.sin(i / n * TAU + a.seed) * r,
        );
        m.opacity = Math.sin(ph * Math.PI) * 0.8;
        const k = s.size;
        sp.scale.set(k, k, 1);
        break;
      }
      case 'orbit': {
        const ang = t * (s.speed || 1) * 1.5 + (i / n) * TAU + a.seed;
        const depth = (Math.sin(ang) + 1) / 2;   // fake 3D: front sprites bigger
        const r = this.radius * 0.78;
        sp.position.set(Math.cos(ang) * r, this.headY * (s.size > 0.45 ? 0.8 : 1.02) + Math.sin(t * 2 + i) * 0.1, Math.sin(ang) * r * 0.45);
        m.opacity = 0.55 + depth * 0.4;
        const k = s.size * (0.8 + depth * 0.45);
        sp.scale.set(k, k, 1);
        break;
      }
      case 'pulse': {
        const b = 0.5 + Math.sin(t * 2.4 * (s.speed || 1) + a.seed) * 0.5;
        sp.position.set(0, 0.3, 0);
        const k = this.radius * (1.5 + b * 0.25);
        sp.scale.set(k, k, 1);
        m.opacity = 0.3 + b * 0.45;
        break;
      }
      case 'ring': {
        const k = this.radius * (0.5 + ph * 1.1);
        sp.position.set(0, 0.3, 0);
        sp.scale.set(k, k, 1);
        m.opacity = (1 - ph) * 0.5;
        break;
      }
      case 'drift': {
        sp.position.set(
          Math.sin(t * 0.7 + i * 2.6 + a.seed) * this.radius * 0.7,
          this.headY * 0.78 + Math.sin(t * 0.9 + i * 1.7) * 0.25,
          Math.cos(t * 0.6 + i * 2.2 + a.seed) * this.radius * 0.7,
        );
        m.opacity = 0.45 + Math.sin(t * 2.3 + i * 3.1) * 0.2;
        const k = s.size * (1 + Math.sin(t * 1.7 + i) * 0.15);
        sp.scale.set(k, k, 1);
        break;
      }
      case 'crackle': {
        // short bursts: ~2 of every 5 half-second steps (ported gate)
        const step = Math.floor(t * 2);
        const on = hash(step + a.seed) > 0.62;
        if (!on) { sp.visible = false; m.opacity = 0; return; }
        const ang = hash(step * 3.7 + i * 11.3) * TAU;
        const r = this.radius * (0.9 + hash(step + i * 5.1) * 0.35);
        sp.position.set(Math.cos(ang) * r, 0.8 + hash(step * 1.3 + i) * (this.headY - 1), Math.sin(ang) * r);
        m.opacity = 0.45 + hash(step * 7.9 + i) * 0.5;
        const k = s.size * (0.7 + hash(step + i * 2.3) * 0.6);
        sp.scale.set(k, k, 1);
        break;
      }
    }
    sp.visible = m.opacity > 0.02;
  }

  dispose() {
    for (const a of [...this.active]) this.remove(a);
  }
}

// one-shot burst style per condition application (ported CONDITION_BURST_STYLE)
export const CONDITION_BURST: Record<string, string> = {
  Poisoned: 'poison', Stunned: 'lightning', Paralyzed: 'lightning', Frightened: 'dark',
  Charmed: 'radiant', Blinded: 'smoke', Deafened: 'thunder', Grappled: 'bleeding',
  Restrained: 'force', Incapacitated: 'frost', Petrified: 'smoke', Unconscious: 'dark',
  Dead: 'dark', Exhaustion: 'smoke', Invisible: 'frost', Burning: 'fire',
  Bleeding: 'bleeding', Blessed: 'radiant', Raging: 'fire', Concentrating: 'frost',
};

export { softSprite };
