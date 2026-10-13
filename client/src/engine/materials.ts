// materials.ts — ASHENREACH procedural texture + material library (T2-d art pass).
// 100% canvas-generated (zero downloads), seeded (deterministic per variant), cached.
// PBR-ish: color map + bump map per kind; roughness/metalness via material params.
//
// Art direction (ARCHITECTURE.md — law):
//   charcoal #0d0f12 · bone #cfc6b8 · ember gold #b8952f · blood #7a1f1f · crypt #3d5a5a
//   grim, low-saturation, grime-heavy, torch-lit; readability first.
//
// Kinds:
//   flagstone(v0 cellar stone, v1 crypt)  brick(v0 intact, v1 ruined/missing bricks)
//   wood(old planks)  iron(v0 sooty, v1 rusted)  bone(pale accent stone)  ember(coal glow)
import * as THREE from 'three';

export const PALETTE = {
  charcoal: 0x0d0f12,
  bone: 0xcfc6b8,
  ember: 0xb8952f,
  blood: 0x7a1f1f,
  crypt: 0x3d5a5a,
} as const;

/** mulberry32 — small fast seeded RNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash of 2D integer coords -> [0,1). Stable per cell => deterministic world variation. */
export function hash2(x: number, z: number, salt = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(salt | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** RNG seeded from a hash — per-object random without storing state. */
export function rngFrom(h: number): () => number {
  return rng(Math.max(1, (h * 0x7fffffff) | 0));
}

interface TextureSet { map: THREE.CanvasTexture; bump: THREE.CanvasTexture; }

function mkCanvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d')! };
}

function toTex(c: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function poly(g: CanvasRenderingContext2D, pts: number[][]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

/** Draw at 9 wrapped offsets so random blobs never break texture tiling. */
function wrap9(g: CanvasRenderingContext2D, S: number, x: number, y: number, draw: (g: CanvasRenderingContext2D) => void) {
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    g.save(); g.translate(x + ox * S, y + oy * S); draw(g); g.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (a) dungeon flagstone — irregular slabs, per-slab tone jitter, cracks, chips,
//     grime AO in the gaps, moss in the corners (crypt variant much more).
//     Shared jittered lattice wraps => seamless tiling.
// ─────────────────────────────────────────────────────────────────────────────
function buildFlagstone(variant: number): TextureSet {
  const S = 512, N = 8, cell = S / N;
  const crypt = variant === 1;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;

  const jx: number[][] = [], jy: number[][] = [];
  const lr = rng(0xce11a0 + variant * 7919);
  for (let y = 0; y < N; y++) {
    jx.push([]); jy.push([]);
    for (let x = 0; x < N; x++) {
      jx[y].push((lr() - 0.5) * cell * 0.36);
      jy[y].push((lr() - 0.5) * cell * 0.36);
    }
  }
  const px = (x: number, y: number): [number, number] => {
    const gx = ((x % N) + N) % N, gy = ((y % N) + N) % N;
    return [x * cell + jx[gy][gx], y * cell + jy[gy][gx]];
  };

  g.fillStyle = crypt ? '#0a0d0b' : '#121009';  // gap grime (charcoal)
  g.fillRect(0, 0, S, S);
  b.fillStyle = '#000'; b.fillRect(0, 0, S, S);

  const base = crypt ? [64, 70, 66] : [82, 78, 69];
  // -1..N so border slabs spill and tile seamlessly (same lattice hash => same tone)
  for (let y = -1; y <= N; y++) for (let x = -1; x <= N; x++) {
    const gx = ((x % N) + N) % N, gy = ((y % N) + N) % N;
    const r = rngFrom(hash2(gx, gy, 0x51ab + variant));
    const p0 = px(x, y), p1 = px(x + 1, y), p2 = px(x + 1, y + 1), p3 = px(x, y + 1);
    const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4, cy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
    const k = 0.84 + r() * 0.07;
    const pts = [p0, p1, p2, p3].map(([vx, vy]) => [cx + (vx - cx) * k, cy + (vy - cy) * k] as [number, number]);

    const tone = 0.76 + r() * 0.42;
    const warm = (r() - 0.5) * 0.12;
    g.fillStyle = `rgb(${Math.round(base[0] * tone * (1 + warm))},${Math.round(base[1] * tone)},${Math.round(base[2] * tone * (1 - warm * 0.6))})`;
    poly(g, pts); g.fill();

    // bevel + slab-interior damage, clipped to the slab
    g.save(); poly(g, pts); g.clip();
    g.save(); g.translate(0, -2.2); poly(g, pts); g.strokeStyle = 'rgba(255,242,212,0.13)'; g.lineWidth = 3.5; g.stroke(); g.restore();
    g.save(); g.translate(0, 2.6); poly(g, pts); g.strokeStyle = 'rgba(0,0,0,0.32)'; g.lineWidth = 4; g.stroke(); g.restore();
    if (r() < 0.42) {  // crack — random walk across the slab
      g.strokeStyle = 'rgba(12,9,6,0.55)'; g.lineWidth = 0.8 + r() * 1.1;
      g.beginPath();
      let cxx = cx + (r() - 0.5) * cell * 0.5, cyy = cy + (r() - 0.5) * cell * 0.5;
      g.moveTo(cxx, cyy);
      const steps = 3 + Math.floor(r() * 3);
      for (let i = 0; i < steps; i++) { cxx += (r() - 0.5) * cell * 0.7; cyy += (r() - 0.5) * cell * 0.7; g.lineTo(cxx, cyy); }
      g.stroke();
    }
    if (r() < 0.3) {  // chipped corner
      const cp = pts[Math.floor(r() * 4)];
      const cs = 3 + r() * 6;
      g.fillStyle = 'rgba(8,6,4,0.5)';
      g.beginPath(); g.moveTo(cp[0], cp[1]);
      g.lineTo(cp[0] + cs, cp[1] + cs * 0.4); g.lineTo(cp[0] + cs * 0.3, cp[1] + cs);
      g.closePath(); g.fill();
    }
    g.restore();

    // bump: slabs raised with per-slab height jitter, seams sunk to black
    poly(b, pts);
    const bt = Math.round(105 + tone * 80);
    b.fillStyle = `rgb(${bt},${bt},${bt})`; b.fill();
    b.save(); poly(b, pts); b.clip();
    b.save(); b.translate(0, -2.2); poly(b, pts); b.strokeStyle = 'rgba(255,255,255,0.5)'; b.lineWidth = 3; b.stroke(); b.restore();
    b.save(); b.translate(0, 2.6); poly(b, pts); b.strokeStyle = 'rgba(0,0,0,0.55)'; b.lineWidth = 4; b.stroke(); b.restore();
    b.restore();
  }

  // moss pooling at slab corners (water gathers in joints)
  const mossP = crypt ? 0.42 : 0.14;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (hash2(x, y, 0x3005 + variant) > mossP) continue;
    const [mx, my] = px(x, y);
    const mr = 5 + hash2(x, y, 0x3006 + variant) * 11;
    wrap9(g, S, mx, my, (gg) => {
      const rg = gg.createRadialGradient(0, 0, 0, 0, 0, mr);
      rg.addColorStop(0, 'rgba(64,94,86,0.34)');
      rg.addColorStop(1, 'rgba(64,94,86,0)');
      gg.fillStyle = rg; gg.beginPath(); gg.arc(0, 0, mr, 0, Math.PI * 2); gg.fill();
    });
  }

  // grime speckle + damp blotches
  const sr = rng(0x6211c + variant);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = sr() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(122,116,98,0.1)';
    g.fillRect(sr() * S, sr() * S, 1 + sr() * 2.4, 1 + sr() * 2.4);
  }
  for (let i = 0; i < 7; i++) {
    const bx = sr() * S, by = sr() * S, br = 30 + sr() * 70;
    wrap9(g, S, bx, by, (gg) => {
      const rg = gg.createRadialGradient(0, 0, 0, 0, 0, br);
      rg.addColorStop(0, 'rgba(5,5,3,0.10)'); rg.addColorStop(1, 'rgba(5,5,3,0)');
      gg.fillStyle = rg; gg.beginPath(); gg.arc(0, 0, br, 0, Math.PI * 2); gg.fill();
    });
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// (b) brick wall — staggered courses, chipped bricks, missing-brick variant,
//     soot gradient toward the top, damp green base, vertical grime streaks.
// ─────────────────────────────────────────────────────────────────────────────
function buildBrick(variant: number): TextureSet {
  const S = 512, rows = 8, cols = 4, bh = S / rows, bw = S / cols;
  const ruined = variant === 1;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;

  g.fillStyle = '#17140f'; g.fillRect(0, 0, S, S);  // mortar
  b.fillStyle = '#000'; b.fillRect(0, 0, S, S);

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw * 0.5;
    for (let c = -1; c <= cols; c++) {
      const gx = ((c % cols) + cols) % cols;   // wrapped brick id => seamless tone
      const rr = rngFrom(hash2(gx, r, 0xb21c + variant * 31));
      const x = c * bw + off + 3, y = r * bh + 3, w = bw - 6, h = bh - 6;

      if (ruined && rr() < 0.1) {  // missing brick — dark recess + broken stub
        g.fillStyle = '#0b0906'; g.fillRect(x, y, w, h);
        g.fillStyle = 'rgb(52,47,40)';
        g.fillRect(x, y + h * 0.45, w * (0.3 + rr() * 0.4), h * 0.55);
        b.fillStyle = '#000'; b.fillRect(x, y, w, h);
        continue;
      }
      const tone = 0.72 + rr() * 0.42;
      const blood = rr() < 0.07;  // rare blood-tinted brick (palette accent)
      const base = blood ? [88, 48, 40] : [76, 70, 62];
      const warm = (rr() - 0.5) * 0.1;
      g.fillStyle = `rgb(${Math.round(base[0] * tone * (1 + warm))},${Math.round(base[1] * tone)},${Math.round(base[2] * tone * (1 - warm * 0.5))})`;
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,238,208,0.09)'; g.fillRect(x, y, w, 3);        // lit top lip
      g.fillStyle = 'rgba(0,0,0,0.24)'; g.fillRect(x, y + h - 3, w, 3);      // shaded base
      const nChip = ruined ? (rr() < 0.75 ? 2 : 1) : (rr() < 0.42 ? 1 : 0);
      for (let i = 0; i < nChip; i++) {
        g.fillStyle = 'rgba(6,5,3,0.42)';
        g.fillRect(x + rr() * w * 0.6, y + rr() * h * 0.5, 4 + rr() * 12, 3 + rr() * 6);
      }
      if (ruined && rr() < 0.3) {  // jagged crack down the brick
        g.strokeStyle = 'rgba(5,4,2,0.5)'; g.lineWidth = 1 + rr();
        g.beginPath();
        let cxx = x + rr() * w, cyy = y;
        g.moveTo(cxx, cyy);
        for (let i = 0; i < 4; i++) { cxx += (rr() - 0.5) * 10; cyy += h / 4; g.lineTo(cxx, cyy); }
        g.stroke();
      }
      const bt = Math.round(112 + tone * 84);
      b.fillStyle = `rgb(${bt},${bt},${bt})`; b.fillRect(x, y, w, h);
      b.fillStyle = 'rgba(255,255,255,0.35)'; b.fillRect(x, y, w, 3);
      b.fillStyle = 'rgba(0,0,0,0.5)'; b.fillRect(x, y + h - 3, w, 3);
    }
  }

  // soot gradient (smoke rises), damp algae base
  let gr = g.createLinearGradient(0, 0, 0, S * 0.55);
  gr.addColorStop(0, 'rgba(4,3,2,0.28)'); gr.addColorStop(1, 'rgba(4,3,2,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.55);
  gr = g.createLinearGradient(0, S, 0, S * 0.74);
  gr.addColorStop(0, 'rgba(14,22,18,0.36)'); gr.addColorStop(1, 'rgba(14,22,18,0)');
  g.fillStyle = gr; g.fillRect(0, S * 0.74, S, S * 0.26);

  const sr = rng(0x517 + variant);
  for (let i = 0; i < 34; i++) {  // vertical grime streaks (wrap-drawn)
    const x = sr() * S, w2 = 2 + sr() * 5, h2 = 40 + sr() * 170, y0 = sr() * S * 0.5;
    const a = 0.06 + sr() * 0.09;
    wrap9(g, S, x, 0, (gg) => { gg.fillStyle = `rgba(8,7,5,${a})`; gg.fillRect(-w2 / 2, y0, w2, h2); });
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// (c) old wood — warped planks, wavy grain, knots, nail heads.
// ─────────────────────────────────────────────────────────────────────────────
function buildWood(): TextureSet {
  const S = 256, P = 6, pw = S / P;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  g.fillStyle = '#0d0a07'; g.fillRect(0, 0, S, S);
  b.fillStyle = '#000'; b.fillRect(0, 0, S, S);

  for (let p = 0; p < P; p++) {
    const r = rngFrom(hash2(p, 3, 0x700d));
    const x = p * pw + 1.5, w = pw - 3;
    const tone = 0.78 + r() * 0.4;
    const warm = (r() - 0.5) * 0.1;
    g.fillStyle = `rgb(${Math.round(82 * tone * (1 + warm))},${Math.round(64 * tone)},${Math.round(46 * tone)})`;
    g.fillRect(x, 0, w, S);
    // warped grain
    const n = 9 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      g.strokeStyle = `rgba(18,10,5,${0.05 + r() * 0.09})`;
      g.lineWidth = 0.8 + r() * 1.3;
      const gx = x + r() * w;
      g.beginPath(); g.moveTo(gx, -4);
      g.bezierCurveTo(gx + (r() - 0.5) * 6, S * 0.33, gx + (r() - 0.5) * 6, S * 0.66, gx + (r() - 0.5) * 5, S + 4);
      g.stroke();
    }
    // knot
    if (r() < 0.35) {
      const kx = x + w * (0.3 + r() * 0.4), ky = r() * S, kr = 3 + r() * 5;
      const rg = g.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.2);
      rg.addColorStop(0, 'rgba(16,9,4,0.7)'); rg.addColorStop(0.5, 'rgba(30,18,9,0.35)'); rg.addColorStop(1, 'rgba(30,18,9,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(kx, ky, kr * 2.2, 0, Math.PI * 2); g.fill();
    }
    // nail heads (same positions on map + bump)
    const nails: [number, number][] = [];
    for (const ny of [12, S - 12]) nails.push([x + w * (0.25 + r() * 0.5), ny]);
    for (const [nx, ny] of nails) {
      g.fillStyle = '#0a0806'; g.beginPath(); g.arc(nx, ny, 2.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(190,180,160,0.5)'; g.beginPath(); g.arc(nx - 0.7, ny - 0.7, 0.8, 0, Math.PI * 2); g.fill();
    }
    // bump
    const bt = Math.round(120 + tone * 70);
    b.fillStyle = `rgb(${bt},${bt},${bt})`; b.fillRect(x, 0, w, S);
    for (const [nx, ny] of nails) {
      b.fillStyle = 'rgba(255,255,255,0.85)'; b.beginPath(); b.arc(nx, ny, 2.2, 0, Math.PI * 2); b.fill();
    }
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// (d) rusted iron — mottled patina, riveted bands, scratches.
//     v0 = sooty (braziers, chains), v1 = rusted (bands, frames, cages).
// ─────────────────────────────────────────────────────────────────────────────
function buildIron(variant: number): TextureSet {
  const S = 256;
  const sooty = variant === 0;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  g.fillStyle = sooty ? '#1b1d20' : '#26241f'; g.fillRect(0, 0, S, S);
  b.fillStyle = 'rgb(58,58,58)'; b.fillRect(0, 0, S, S);

  const r = rng(0x1204 + variant * 17);
  for (let i = 0; i < 30; i++) {  // patina mottle
    const bx = r() * S, by = r() * S, br = 6 + r() * 22;
    const rust = sooty ? r() < 0.3 : r() < 0.75;
    const a = 0.05 + r() * (sooty ? 0.13 : 0.17);
    const col = rust ? `rgba(112,64,34,${a.toFixed(3)})` : `rgba(5,5,6,${(a * 1.2).toFixed(3)})`;
    wrap9(g, S, bx, by, (gg) => {
      const rg = gg.createRadialGradient(0, 0, 0, 0, 0, br);
      rg.addColorStop(0, col); rg.addColorStop(1, rust ? 'rgba(112,64,34,0)' : 'rgba(5,5,6,0)');
      gg.fillStyle = rg; gg.beginPath(); gg.arc(0, 0, br, 0, Math.PI * 2); gg.fill();
    });
  }
  for (let i = 0; i < 200; i++) {  // speckle
    g.fillStyle = r() < 0.6 ? `rgba(140,84,44,${(0.06 + r() * 0.1).toFixed(3)})` : `rgba(0,0,0,${(0.08 + r() * 0.12).toFixed(3)})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 1.6, 1 + r() * 1.6);
  }
  for (const by of [46, S - 46]) {  // riveted bands
    g.fillStyle = '#2e3136'; g.fillRect(0, by - 12, S, 24);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, by - 12, S, 3);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, by + 9, S, 3);
    b.fillStyle = 'rgb(120,120,120)'; b.fillRect(0, by - 12, S, 24);
    for (let x = 16; x < S; x += 32) {
      g.fillStyle = '#3c4046'; g.beginPath(); g.arc(x, by, 3.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(x + 0.8, by + 0.9, 2.6, 0, Math.PI * 2); g.fill();
      b.fillStyle = 'rgb(210,210,210)'; b.beginPath(); b.arc(x, by, 3.4, 0, Math.PI * 2); b.fill();
    }
  }
  for (let i = 0; i < 7; i++) {  // scratches
    g.strokeStyle = `rgba(200,205,214,${(0.05 + r() * 0.05).toFixed(3)})`;
    g.lineWidth = 0.8;
    const x0 = r() * S, y0 = r() * S;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (r() - 0.5) * 70, y0 + (r() - 0.5) * 26); g.stroke();
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// (e) bone-pale stone — desaturated bone with mottling, veins, pocks.
// ─────────────────────────────────────────────────────────────────────────────
function buildBone(): TextureSet {
  const S = 256;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  g.fillStyle = '#b0aa9b'; g.fillRect(0, 0, S, S);
  b.fillStyle = 'rgb(150,150,150)'; b.fillRect(0, 0, S, S);

  const r = rng(0xb0be);
  for (let i = 0; i < 22; i++) {  // mottling
    const bx = 8 + r() * (S - 16), by = 8 + r() * (S - 16), br = 8 + r() * 30;
    const a = 0.05 + r() * 0.09;
    wrap9(g, S, bx, by, (gg) => {
      const rg = gg.createRadialGradient(0, 0, 0, 0, 0, br);
      rg.addColorStop(0, `rgba(96,92,80,${a.toFixed(3)})`); rg.addColorStop(1, 'rgba(96,92,80,0)');
      gg.fillStyle = rg; gg.beginPath(); gg.arc(0, 0, br, 0, Math.PI * 2); gg.fill();
    });
    wrap9(b, S, bx, by, (gg) => {
      const rg = gg.createRadialGradient(0, 0, 0, 0, 0, br);
      rg.addColorStop(0, `rgba(70,70,70,${(a * 1.6).toFixed(3)})`); rg.addColorStop(1, 'rgba(70,70,70,0)');
      gg.fillStyle = rg; gg.beginPath(); gg.arc(0, 0, br, 0, Math.PI * 2); gg.fill();
    });
  }
  for (let i = 0; i < 9; i++) {  // veins
    g.strokeStyle = `rgba(128,122,106,${(0.25 + r() * 0.2).toFixed(3)})`;
    g.lineWidth = 0.8 + r() * 0.7;
    g.beginPath();
    let x = 8 + r() * (S - 16), y = 8 + r() * (S - 16);
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 34; i++) {  // pocks
    const x = 6 + r() * (S - 12), y = 6 + r() * (S - 12), pr = 0.8 + r() * 2.2;
    wrap9(g, S, x, y, (gg) => {
      gg.fillStyle = `rgba(70,66,56,${(0.3 + r0(x, y) * 0.3).toFixed(3)})`;
      gg.beginPath(); gg.arc(0, 0, pr, 0, Math.PI * 2); gg.fill();
    });
    wrap9(b, S, x, y, (gg) => {
      gg.fillStyle = 'rgba(20,20,20,0.8)';
      gg.beginPath(); gg.arc(0, 0, pr, 0, Math.PI * 2); gg.fill();
    });
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}
// stable per-pock alpha (wrap9 copies must match)
function r0(x: number, y: number) { return hash2(x * 10 | 0, y * 10 | 0, 0x9c); }

function buildCobble(): TextureSet {
  const S = 512, N = 8, cell = S / N;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  g.fillStyle = '#171614'; g.fillRect(0, 0, S, S);
  b.fillStyle = '#080808'; b.fillRect(0, 0, S, S);
  const jx: number[][] = [], jy: number[][] = [];
  const lattice = rng(0xc0bb1e);
  for (let y = 0; y < N; y++) {
    jx.push([]); jy.push([]);
    for (let x = 0; x < N; x++) {
      jx[y].push((lattice() - 0.5) * cell * 0.18);
      jy[y].push((lattice() - 0.5) * cell * 0.18);
    }
  }
  const point = (x: number, y: number): [number, number] => {
    const gx = ((x % N) + N) % N, gy = ((y % N) + N) % N;
    return [x * cell + jx[gy][gx], y * cell + jy[gy][gx]];
  };
  for (let y = -1; y <= N; y++) for (let x = -1; x <= N; x++) {
    const r = rngFrom(hash2((x % N + N) % N, (y % N + N) % N, 0xc0bb1e));
    const pts = [point(x, y), point(x + 1, y), point(x + 1, y + 1), point(x, y + 1)];
    const cx = pts.reduce((sum, p) => sum + p[0], 0) / 4;
    const cy = pts.reduce((sum, p) => sum + p[1], 0) / 4;
    const polyPts = pts.map(([px, py]) => [cx + (px - cx) * 0.88, cy + (py - cy) * 0.88]);
    const tone = 0.75 + r() * 0.42;
    g.fillStyle = `rgb(${Math.round(83 * tone)},${Math.round(80 * tone)},${Math.round(73 * tone)})`;
    poly(g, polyPts); g.fill();
    g.save(); poly(g, polyPts); g.clip();
    g.strokeStyle = 'rgba(238,224,194,0.12)'; g.lineWidth = 3; g.stroke();
    g.restore();
    const bump = Math.round(110 + tone * 80);
    b.fillStyle = `rgb(${bump},${bump},${bump})`; poly(b, polyPts); b.fill();
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

function buildAshGround(kind: 'ash_dirt' | 'ash_grass', variant: number): TextureSet {
  const S = 512;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  const grass = kind === 'ash_grass';
  const road = variant > 0;
  const base = grass ? [45, 55, 43] : road ? [59, 53, 46] : [67, 57, 46];
  g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(0, 0, S, S);
  b.fillStyle = 'rgb(105,105,105)'; b.fillRect(0, 0, S, S);
  const random = rng((grass ? 0xa551 : 0xd17) + variant * 7919);
  for (let i = 0; i < 180; i++) {
    const x = random() * S, y = random() * S, radius = 5 + random() * 30;
    const shade = random() < 0.5 ? 1 : -1;
    const alpha = 0.035 + random() * 0.09;
    const color = grass
      ? (shade > 0 ? `rgba(96,105,67,${alpha})` : `rgba(18,24,18,${alpha})`)
      : (shade > 0 ? `rgba(130,104,76,${alpha})` : `rgba(20,17,14,${alpha})`);
    wrap9(g, S, x, y, (ctx) => {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, color); gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    });
    wrap9(b, S, x, y, (ctx) => {
      ctx.fillStyle = `rgba(${shade > 0 ? '210,210,210' : '20,20,20'},${alpha * 1.8})`;
      ctx.beginPath(); ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2); ctx.fill();
    });
  }
  for (let i = 0; i < (grass ? 1500 : 700); i++) {
    const x = random() * S, y = random() * S;
    if (grass) {
      const height = 2 + random() * 7;
      const color = random() < 0.5 ? 'rgba(112,119,75,0.28)' : 'rgba(22,31,23,0.32)';
      const width = 0.6 + random() * 0.7;
      const lean = (random() - 0.5) * 3;
      wrap9(g, S, x, y, (ctx) => {
        ctx.strokeStyle = color; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lean, -height); ctx.stroke();
      });
    } else {
      const radius = 0.5 + random() * (road ? 1.5 : 2.5);
      const rotation = random() * Math.PI;
      const alpha = 0.12 + random() * 0.16;
      wrap9(g, S, x, y, (ctx) => {
        ctx.fillStyle = `rgba(16,13,11,${alpha})`;
        ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.4, radius, rotation, 0, Math.PI * 2); ctx.fill();
      });
    }
  }
  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// (h) tree bark — deep vertical furrows, weathered ridges, lichen & moss flecks.
//     v0: rugged dark oak/ash; v1: pine/conifer reddish-brown plates;
//     v2: pale/dead charred; v3: white paper birch with lenticels;
//     v4: gnarled mossy river willow
// ─────────────────────────────────────────────────────────────────────────────
function buildBark(variant = 0): TextureSet {
  const S = 512;
  const cm = mkCanvas(S), cb = mkCanvas(S);
  const g = cm.g, b = cb.g;
  const r = rng(0xba4c + variant * 37);

  // Base tones
  const baseTones = variant === 1
    ? [68, 48, 38]   // pine reddish-amber
    : variant === 2
      ? [50, 48, 46] // dead / charred weathered grey
      : variant === 3
        ? [224, 226, 222] // silver / white paper birch
        : variant === 4
          ? [60, 55, 45]   // gnarled olive-brown willow
          : [56, 44, 34];  // rugged dark oak / hardwood
  g.fillStyle = `rgb(${baseTones[0]},${baseTones[1]},${baseTones[2]})`;
  g.fillRect(0, 0, S, S);
  b.fillStyle = variant === 3 ? 'rgb(170,170,170)' : 'rgb(110,110,110)';
  b.fillRect(0, 0, S, S);

  // Vertical bark plates / ridges
  if (variant !== 3) {
    const numFurrows = variant === 1 ? 16 : variant === 4 ? 18 : 22;
    const furrowWidth = S / numFurrows;
    for (let f = 0; f < numFurrows; f++) {
      const fx = f * furrowWidth;
      const plateTone = 0.8 + r() * 0.45;
      const col = [
        Math.min(255, Math.round(baseTones[0] * plateTone)),
        Math.min(255, Math.round(baseTones[1] * plateTone)),
        Math.min(255, Math.round(baseTones[2] * plateTone)),
      ];
      g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      g.fillRect(fx + 2, 0, furrowWidth - 4, S);

      // Deep shadowed furrows between plates
      g.fillStyle = 'rgba(12, 9, 7, 0.72)';
      g.fillRect(fx - 2, 0, 4, S);
      b.fillStyle = 'rgb(35, 35, 35)';
      b.fillRect(fx - 2, 0, 4, S);

      // Ridge highlights on plate center
      b.fillStyle = `rgb(${Math.round(130 + plateTone * 60)},${Math.round(130 + plateTone * 60)},${Math.round(130 + plateTone * 60)})`;
      b.fillRect(fx + 3, 0, furrowWidth - 6, S);
    }
  } else {
    // Birch: faint paper peeling bands and subtle vertical shading
    for (let i = 0; i < 12; i++) {
      const bx = r() * S;
      const bw = 20 + r() * 50;
      g.fillStyle = `rgba(205, 208, 202, ${0.15 + r() * 0.2})`;
      g.fillRect(bx, 0, bw, S);
    }
  }

  // Wavy vertical grain fibers & fissures across the trunk
  const grainLines = variant === 3 ? 30 : 90;
  for (let i = 0; i < grainLines; i++) {
    const gx = r() * S;
    const w = 1.2 + r() * 3.2;
    const dark = r() < 0.7;
    const alpha = variant === 3 ? (0.06 + r() * 0.1) : (0.12 + r() * 0.22);
    const color = variant === 3
      ? `rgba(50,45,40,${alpha})`
      : dark ? `rgba(10,8,6,${alpha})` : `rgba(120,95,70,${alpha * 0.8})`;
    wrap9(g, S, gx, 0, (ctx) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      let cx = 0;
      ctx.moveTo(cx, 0);
      for (let y = 0; y <= S; y += 32) {
        cx += (r() - 0.5) * 5.5;
        ctx.lineTo(cx, y);
      }
      ctx.stroke();
    });

    wrap9(b, S, gx, 0, (ctx) => {
      ctx.strokeStyle = dark ? 'rgba(20,20,20,0.5)' : 'rgba(235,235,235,0.45)';
      ctx.lineWidth = w;
      ctx.beginPath();
      let cx = 0;
      ctx.moveTo(cx, 0);
      for (let y = 0; y <= S; y += 32) {
        cx += (r() - 0.5) * 5.5;
        ctx.lineTo(cx, y);
      }
      ctx.stroke();
    });
  }

  // Horizontal fissures (lenticels & weather cracks)
  // For birch (v3), horizontal dark lenticels are the defining visual hallmark!
  const numLenticels = variant === 3 ? 110 : 45;
  for (let i = 0; i < numLenticels; i++) {
    const cx = r() * S;
    const cy = r() * S;
    const len = variant === 3 ? (10 + r() * 36) : (8 + r() * 24);
    const lw = variant === 3 ? (1.8 + r() * 3.0) : (1.6 + r() * 1.5);
    const lenticelColor = variant === 3 ? 'rgba(24, 20, 18, 0.88)' : 'rgba(8,6,5,0.65)';
    wrap9(g, S, cx, cy, (ctx) => {
      ctx.strokeStyle = lenticelColor;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.lineTo(len * 0.5, (r() - 0.5) * 2);
      ctx.stroke();

      // For birch, occasional dark triangular node scars
      if (variant === 3 && r() < 0.12) {
        ctx.fillStyle = 'rgba(22, 18, 16, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-len * 0.3, 0);
        ctx.lineTo(len * 0.3, 0);
        ctx.lineTo(0, -5 - r() * 6);
        ctx.closePath();
        ctx.fill();
      }
    });
    wrap9(b, S, cx, cy, (ctx) => {
      ctx.strokeStyle = 'rgba(20,20,20,0.75)';
      ctx.lineWidth = lw + 0.5;
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.lineTo(len * 0.5, 0);
      ctx.stroke();
    });
  }

  // Lichen & moss clusters on the bark
  if (variant !== 2) {
    const mossClusters = variant === 4 ? 42 : variant === 3 ? 14 : 28;
    for (let i = 0; i < mossClusters; i++) {
      const mx = r() * S, my = r() * S, mr = 4 + r() * 14;
      const isLichen = variant === 3 ? true : r() < 0.45;
      const mossColor = isLichen
        ? `rgba(164, 178, 142, ${0.28 + r() * 0.3})`
        : variant === 4
          ? `rgba(45, 78, 32, ${0.45 + r() * 0.35})` // lush wetland moss
          : `rgba(62, 84, 46, ${0.32 + r() * 0.35})`;
      wrap9(g, S, mx, my, (ctx) => {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, mr);
        grad.addColorStop(0, mossColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, mr, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  return { map: toTex(cm.c, true), bump: toTex(cb.c, false) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — everything cached.
// ─────────────────────────────────────────────────────────────────────────────
const texCache = new Map<string, TextureSet>();
const matCache = new Map<string, THREE.Material>();

const BUILDERS: Record<string, (v: number) => TextureSet> = {
  flagstone: buildFlagstone,
  cobble: () => buildCobble(),
  ash_dirt: (v) => buildAshGround('ash_dirt', v),
  ash_grass: (v) => buildAshGround('ash_grass', v),
  brick: buildBrick,
  wood: () => buildWood(),
  iron: buildIron,
  bone: () => buildBone(),
  bark: (v) => buildBark(v),
};

export interface AreaTileSet {
  id: string;
  outdoor: boolean;
  ambience: 'crypt' | 'town' | 'wilderness';
  floor: { kind: string; variant: number; repeatFt: number; roughness: number; bumpScale: number; metalness: number };
  wall: { kind: string; intactVariant: number; ruinedVariant: number };
  trim: { woodVariant: number; ironVariant: number; sootVariant: number };
}

const CELLAR_TILESET: AreaTileSet = {
  id: 'cellar', outdoor: false, ambience: 'crypt',
  floor: { kind: 'flagstone', variant: 0, repeatFt: 27.5, roughness: 0.96, bumpScale: 0.45, metalness: 0.02 },
  wall: { kind: 'brick', intactVariant: 0, ruinedVariant: 1 },
  trim: { woodVariant: 0, ironVariant: 1, sootVariant: 0 },
};

const AREA_TILESETS: Record<string, AreaTileSet> = {
  cellar: CELLAR_TILESET,
  crypt: { ...CELLAR_TILESET, id: 'crypt', floor: { ...CELLAR_TILESET.floor, variant: 1 } },
  dungeon: { ...CELLAR_TILESET, id: 'dungeon', floor: { ...CELLAR_TILESET.floor, variant: 1 } },
  town: {
    ...CELLAR_TILESET, id: 'town', outdoor: true, ambience: 'town',
    floor: { kind: 'cobble', variant: 0, repeatFt: 22, roughness: 0.9, bumpScale: 0.32, metalness: 0.01 },
  },
  road: {
    ...CELLAR_TILESET, id: 'road', outdoor: true, ambience: 'wilderness',
    floor: { kind: 'ash_dirt', variant: 1, repeatFt: 34, roughness: 0.98, bumpScale: 0.22, metalness: 0 },
  },
  ashlands: {
    ...CELLAR_TILESET, id: 'ashlands', outdoor: true, ambience: 'wilderness',
    floor: { kind: 'ash_dirt', variant: 0, repeatFt: 31, roughness: 0.98, bumpScale: 0.24, metalness: 0 },
  },
  wilderness: {
    ...CELLAR_TILESET, id: 'wilderness', outdoor: true, ambience: 'wilderness',
    floor: { kind: 'ash_grass', variant: 0, repeatFt: 34, roughness: 0.96, bumpScale: 0.28, metalness: 0 },
  },
};

export function getAreaTileSet(map: { theme?: string; floor?: string; tileSet?: string }): AreaTileSet {
  const keyOf = (value?: string) => String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
  const explicit = keyOf(map.tileSet);
  if (explicit && !AREA_TILESETS[explicit]) {
    console.warn(`[materials] unknown area tileset "${map.tileSet}"; resolving map theme/floor instead`);
  }
  return AREA_TILESETS[explicit] || AREA_TILESETS[keyOf(map.theme)] ||
    AREA_TILESETS[keyOf(map.floor)] || CELLAR_TILESET;
}

/** Cached procedural texture pair (color + bump) for a kind/variant. */
export function getTextureSet(kind: string, variant = 0): TextureSet {
  const key = `${kind}:${variant}`;
  let set = texCache.get(key);
  if (!set) {
    const build = BUILDERS[kind];
    if (!build) throw new Error(`[materials] unknown kind: ${kind}`);
    set = build(variant);
    texCache.set(key, set);
  }
  return set;
}

/** Cached material for a kind/variant. NOTE: texture repeat is shared per kind. */
export function getMaterial(kind: string, variant = 0): THREE.Material {
  const key = `${kind}:${variant}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  let m: THREE.MeshStandardMaterial;
  if (kind === 'ember') {  // glowing coal bed (braziers)
    m = new THREE.MeshStandardMaterial({
      color: 0x1a0c05, emissive: 0xff5a1f, emissiveIntensity: 2.3, roughness: 1
    });
  } else {
    const set = getTextureSet(kind, variant);
    let roughness = 0.9, metalness = 0, bumpScale = 0.4;
    if (kind === 'flagstone') { roughness = 0.96; metalness = 0.02; bumpScale = 0.45; }
    else if (kind === 'brick') { roughness = 0.93; metalness = 0.03; bumpScale = 0.55; }
    else if (kind === 'wood') { roughness = 0.88; bumpScale = 0.35; }
    else if (kind === 'iron') {
      roughness = variant === 0 ? 0.66 : 0.5;
      metalness = variant === 0 ? 0.58 : 0.82;
      bumpScale = 0.3;
    } else if (kind === 'bone') { roughness = 0.9; metalness = 0.02; bumpScale = 0.3; }
    else if (kind === 'bark') {
      roughness = variant === 3 ? 0.92 : 0.97;
      metalness = 0.01;
      bumpScale = variant === 3 ? 0.38 : variant === 4 ? 0.72 : 0.65;
    }
    m = new THREE.MeshStandardMaterial({
      map: set.map, bumpMap: set.bump, bumpScale, roughness, metalness
    });
  }
  matCache.set(key, m);
  return m;
}
