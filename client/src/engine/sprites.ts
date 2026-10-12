// sprites — soft particle + light sprites (shared cache), procedural.
// T2-d art pass: flame gradient, glow, ember spark, rain streak, sky disc,
// shaft gradient, tileable fbm noise. softSprite + clothTexture exports are
// FROZEN (Actors/rig + Effects import them).
import * as THREE from 'three';

// ── soft radial (contact shadows, orbs, generic particles) ──────────────────
let _soft: THREE.CanvasTexture | null = null;
export function softSprite(): THREE.CanvasTexture {
  if (_soft) return _soft;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const rg = g.createRadialGradient(32, 32, 1, 32, 32, 31);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.35, 'rgba(255,255,255,0.62)');
  rg.addColorStop(0.7, 'rgba(255,255,255,0.18)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
  _soft = new THREE.CanvasTexture(c);
  return _soft;
}

// ── wide feathered contact shadow (grounding figures) ───────────────────────
let _shadow: THREE.CanvasTexture | null = null;
export function shadowSprite(): THREE.CanvasTexture {
  if (_shadow) return _shadow;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  rg.addColorStop(0, 'rgba(0,0,0,0.88)');
  rg.addColorStop(0.45, 'rgba(0,0,0,0.52)');
  rg.addColorStop(0.8, 'rgba(0,0,0,0.14)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  _shadow = new THREE.CanvasTexture(c);
  return _shadow;
}

// ── flame: white-hot core -> ember edges (stretched by sprite scale) ────────
// variant 0 = ember (braziers/torches), 1 = crypt (teal witch-light)
let _flame: THREE.CanvasTexture[] = [];
export function flameSprite(variant = 0): THREE.CanvasTexture {
  if (_flame[variant]) return _flame[variant];
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  const ell = (cx: number, cy: number, rx: number, ry: number, stops: [number, string][]) => {
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    for (const [o, col] of stops) rg.addColorStop(o, col);
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  if (variant === 1) {
    ell(32, 72, 26, 50, [
      [0, 'rgba(235,255,250,0.9)'], [0.22, 'rgba(160,255,230,0.7)'],
      [0.45, 'rgba(60,190,166,0.34)'], [0.7, 'rgba(24,110,96,0.14)'],
      [1, 'rgba(8,40,36,0)']
    ]);
    ell(32, 88, 11, 22, [
      [0, 'rgba(255,255,255,1)'], [0.4, 'rgba(190,255,240,0.85)'], [1, 'rgba(120,230,205,0)']
    ]);
  } else {
    ell(32, 76, 26, 50, [
      [0, 'rgba(255,244,214,0.9)'], [0.22, 'rgba(255,196,88,0.75)'],
      [0.45, 'rgba(255,120,36,0.38)'], [0.7, 'rgba(198,60,16,0.14)'],
      [1, 'rgba(110,24,8,0)']
    ]);
    ell(32, 88, 11, 22, [
      [0, 'rgba(255,255,244,1)'], [0.4, 'rgba(255,232,170,0.85)'], [1, 'rgba(255,180,80,0)']
    ]);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  _flame[variant] = t;
  return t;
}

// ── wide soft glow halo (light bloom, altar auras) ──────────────────────────
let _glow: THREE.CanvasTexture | null = null;
export function glowSprite(): THREE.CanvasTexture {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const rg = g.createRadialGradient(64, 64, 1, 64, 64, 63);
  rg.addColorStop(0, 'rgba(255,255,255,0.85)');
  rg.addColorStop(0.3, 'rgba(255,255,255,0.32)');
  rg.addColorStop(0.65, 'rgba(255,255,255,0.08)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.beginPath(); g.arc(64, 64, 63, 0, Math.PI * 2); g.fill();
  _glow = new THREE.CanvasTexture(c);
  return _glow;
}

// ── tight ember spark (rising embers) ───────────────────────────────────────
let _spark: THREE.CanvasTexture | null = null;
export function sparkSprite(): THREE.CanvasTexture {
  if (_spark) return _spark;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const rg = g.createRadialGradient(16, 16, 0, 16, 16, 15);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.25, 'rgba(255,244,220,0.9)');
  rg.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.beginPath(); g.arc(16, 16, 15, 0, Math.PI * 2); g.fill();
  _spark = new THREE.CanvasTexture(c);
  return _spark;
}

// ── rain streak (bright head at v=1, feathered tail at v=0) ─────────────────
let _streak: THREE.CanvasTexture | null = null;
export function streakSprite(): THREE.CanvasTexture {
  if (_streak) return _streak;
  const c = document.createElement('canvas'); c.width = 16; c.height = 64;
  const g = c.getContext('2d')!;
  const vg = g.createLinearGradient(0, 0, 0, 64);
  vg.addColorStop(0, 'rgba(255,255,255,0)');
  vg.addColorStop(0.55, 'rgba(255,255,255,0.3)');
  vg.addColorStop(0.92, 'rgba(255,255,255,0.9)');
  vg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = vg; g.fillRect(0, 0, 16, 64);
  // soft horizontal edges
  const hg = g.createLinearGradient(0, 0, 16, 0);
  hg.addColorStop(0, 'rgba(0,0,0,0)');
  hg.addColorStop(0.5, 'rgba(0,0,0,1)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = hg; g.fillRect(0, 0, 16, 64);
  _streak = new THREE.CanvasTexture(c);
  return _streak;
}

// ── sky disc (moon / ember sun): hard core + tight halo ─────────────────────
let _disc: Record<number, THREE.CanvasTexture> = {};
export function discSprite(core = 0.4): THREE.CanvasTexture {
  if (_disc[core]) return _disc[core];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const rg = g.createRadialGradient(64, 64, 1, 64, 64, 63);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(core, 'rgba(255,255,255,1)');
  rg.addColorStop(Math.min(1, core + 0.03), 'rgba(255,255,255,0.28)');
  rg.addColorStop(0.75, 'rgba(255,255,255,0.07)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.beginPath(); g.arc(64, 64, 63, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  _disc[core] = t;
  return t;
}

// ── vertical gradient for volumetric-ish light shafts (top bright) ──────────
let _shaft: THREE.CanvasTexture | null = null;
export function shaftGradient(): THREE.CanvasTexture {
  if (_shaft) return _shaft;
  const c = document.createElement('canvas'); c.width = 16; c.height = 128;
  const g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 0, 128);  // canvas top = cone top (v=1)
  lg.addColorStop(0, 'rgba(255,255,255,0.85)');
  lg.addColorStop(0.55, 'rgba(255,255,255,0.32)');
  lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, 16, 128);
  _shaft = new THREE.CanvasTexture(c);
  return _shaft;
}

// ── tileable fbm value noise (ground fog alpha) ─────────────────────────────
let _noise: THREE.CanvasTexture | null = null;
export function noiseTexture(size = 256): THREE.CanvasTexture {
  if (_noise) return _noise;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const oct: [number, number][] = [[4, 0.5], [8, 0.25], [16, 0.15], [32, 0.1]];
  let seed = 0x5eed;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const lattices = oct.map(([n]) => {
    const a = new Float32Array(n * n);
    for (let i = 0; i < a.length; i++) a[i] = rnd();
    return a;
  });
  const sm = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (let o = 0; o < oct.length; o++) {
      const n = oct[o][0], w = oct[o][1], lat = lattices[o];
      const fx = (x / size) * n, fy = (y / size) * n;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = sm(fx - x0), ty = sm(fy - y0);
      const xa = x0 % n, xb = (x0 + 1) % n, ya = y0 % n, yb = (y0 + 1) % n;
      const v00 = lat[ya * n + xa], v10 = lat[ya * n + xb];
      const v01 = lat[yb * n + xa], v11 = lat[yb * n + xb];
      v += w * ((v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty);
    }
    v = Math.max(0, Math.min(1, (v - 0.3) * 1.8));
    const b = (v * 255) | 0;
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  _noise = t;
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy generators kept for compatibility (frozen surface). New geometry uses
// materials.ts (getMaterial / getTextureSet) instead.
// ─────────────────────────────────────────────────────────────────────────────

// procedural stone floor texture (canvas) — seeded variation
let _floor: { stone: THREE.CanvasTexture; crypt: THREE.CanvasTexture } | null = null;
export function floorTextures() {
  if (_floor) return _floor;
  const make = (base: string, vein: string, dark: string, seed: number) => {
    const S = 512;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d')!;
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    const cell = S / 10;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const shade = 0.74 + rnd() * 0.42;
      const rgb = hexToRgb(base);
      g.fillStyle = `rgb(${(rgb[0] * shade) | 0},${(rgb[1] * shade) | 0},${(rgb[2] * shade) | 0})`;
      const jx = (rnd() - 0.5) * 4, jy = (rnd() - 0.5) * 4;
      g.fillRect(x * cell + 2 + jx, y * cell + 2 + jy, cell - 4, cell - 4);
      if (rnd() < 0.4) {
        g.strokeStyle = vein; g.lineWidth = 1 + rnd();
        g.beginPath();
        let px = x * cell + rnd() * cell, py = y * cell + rnd() * cell;
        g.moveTo(px, py);
        for (let k = 0; k < 3; k++) { px += (rnd() - 0.5) * cell * 0.8; py += (rnd() - 0.5) * cell * 0.8; g.lineTo(px, py); }
        g.stroke();
      }
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.09)' : dark;
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
    }
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
  _floor = {
    stone: make('#5a564e', 'rgba(24,22,18,0.55)', 'rgba(110,102,86,0.14)', 1234567),
    crypt: make('#4a504d', 'rgba(14,18,16,0.6)', 'rgba(80,96,88,0.16)', 7654321)
  };
  return _floor;
}

// procedural stone-brick wall texture
let _wall: THREE.CanvasTexture | null = null;
export function wallTexture(): THREE.CanvasTexture {
  if (_wall) return _wall;
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!;
  let seed = 424242;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = '#2c2a26'; g.fillRect(0, 0, S, S);
  const rows = 8, bh = S / rows;
  for (let r = 0; r < rows; r++) {
    const cols = 4, bw = S / cols;
    const offset = (r % 2) * bw / 2;
    for (let cc = -1; cc < cols + 1; cc++) {
      const x = cc * bw + offset + 3, y = r * bh + 3;
      const w = bw - 6, h = bh - 6;
      const shade = 0.72 + rnd() * 0.4;
      const base = [58, 55, 50].map(v => Math.min(255, (v * shade) | 0));
      g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,240,210,0.09)';
      g.fillRect(x, y, w, 3);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(x, y + h - 3, w, 3);
      if (rnd() < 0.5) {
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(x + rnd() * w * 0.7, y + rnd() * h * 0.7, 4 + rnd() * 10, 2 + rnd() * 5);
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(10,10,8,${0.05 + rnd() * 0.08})`;
    const x = rnd() * S;
    g.fillRect(x, rnd() * S * 0.4, 2 + rnd() * 5, 40 + rnd() * 160);
  }
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  _wall = tx;
  return tx;
}

// procedural cloth texture (weave + patches + hem grime)
const _cloths: THREE.CanvasTexture[] = [];
export function clothTexture(variant = 0): THREE.CanvasTexture {
  if (_cloths[variant]) return _cloths[variant];
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!;
  let seed = 9001 + variant * 137;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * S;
    g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`;
    g.fillRect(x, 0, 1 + rnd() * 2, S);
  }
  for (let i = 0; i < 120; i++) {
    const y = rnd() * S;
    g.fillStyle = `rgba(255,246,228,${0.04 + rnd() * 0.05})`;
    g.fillRect(0, y, S, 1);
  }
  for (let i = 0; i < 5; i++) {
    const x = rnd() * S, y = rnd() * S, w = 18 + rnd() * 36, h = 14 + rnd() * 30;
    g.fillStyle = `rgba(20,14,8,${0.06 + rnd() * 0.07})`;
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.12)';
    g.strokeRect(x, y, w, h);
  }
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(14,10,6,${0.04 + rnd() * 0.07})`;
    g.beginPath();
    g.arc(rnd() * S, rnd() * S, 4 + rnd() * 16, 0, Math.PI * 2);
    g.fill();
  }
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(2, 2);
  tx.colorSpace = THREE.SRGBColorSpace;
  _cloths[variant] = tx;
  return tx;
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
