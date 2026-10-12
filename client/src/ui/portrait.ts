// ui/portrait.ts — procedural portrait circle for the self plate (canvas).
// Dark radial ground, wanderer-colored ring, archetype sigil inked with the
// Path2D data shared with sigils.ts. No image assets.
import { SIGILS } from './sigils';

export function drawPortrait(canvas: HTMLCanvasElement, o: {
  archetype: string; color: string; name: string; size?: number;
}): void {
  const size = o.size || 64;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== size * dpr) { canvas.width = size * dpr; canvas.height = size * dpr; }
  const g = canvas.getContext('2d');
  if (!g) return;
  g.save();
  g.scale(dpr, dpr);
  g.clearRect(0, 0, size, size);

  const c = size / 2;

  // ground: charcoal radial with a faint ember glow off-center
  const bg = g.createRadialGradient(c * 0.82, c * 0.74, size * 0.05, c, c, c);
  bg.addColorStop(0, '#2b2418');
  bg.addColorStop(0.55, '#14110b');
  bg.addColorStop(1, '#080a0d');
  g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.closePath();
  g.fillStyle = bg; g.fill();
  // clip everything else to the disc
  g.clip();

  // grime speckle (seeded by name so it is stable per character)
  let s = 7;
  for (let i = 0; i < o.name.length; i++) s = (s * 31 + o.name.charCodeAt(i)) >>> 4;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * c;
    g.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,0.35)' : 'rgba(184,149,47,0.10)';
    g.fillRect(c + Math.cos(a) * r, c + Math.sin(a) * r, 1 + rnd(), 1 + rnd());
  }

  // sigil, scaled from the 0..100 sigil box into the disc (~88% coverage)
  const def = SIGILS[o.archetype] || SIGILS.warden;
  const scale = (size * 0.88) / 100;
  g.save();
  g.translate(c, c);
  g.scale(scale, scale);
  g.translate(-50, -50);
  g.lineWidth = 5.5;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = def.accent;
  g.shadowColor = def.accent;
  g.shadowBlur = 7;
  const p = new Path2D(def.path);
  g.stroke(p);
  g.shadowBlur = 0;
  g.globalAlpha = 0.24;
  g.fillStyle = def.accent;
  g.fill(p);
  g.restore();

  // wanderer-colored rim
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.beginPath(); g.arc(c, c, c - 1.4, 0, Math.PI * 2);
  g.lineWidth = 2.6;
  g.strokeStyle = o.color || '#b8952f';
  g.stroke();
  g.beginPath(); g.arc(c, c, c - 0.2, 0, Math.PI * 2);
  g.lineWidth = 1;
  g.strokeStyle = 'rgba(0,0,0,0.85)';
  g.stroke();
  g.restore();
}
