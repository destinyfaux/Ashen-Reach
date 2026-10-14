// ═══════════════════════════════════════════════════════════════════════════
// portrait.ts — procedural 2D painted bust for the character creator (T2-e).
//
// TECHNIQUE (stylized oil-painting feel, no photorealism):
//   Layered canvas-2D passes — background atmosphere → cloak/hood fabric →
//   chiaroscuro face (single warm light source upper-left, multiply shadows,
//   screen highlights) → race features (ears/horns/tusks/beard) → eyes with
//   glowing catchlights → hair → face decor → class-specific hints →
//   "brushstroke" pass (hundreds of short overlay-blended strokes following
//   the light) → film grain (seeded noise tiles) → vignette + rim light.
//   Deterministic per seed (mulberry32) so the same character always paints
//   the same portrait — safe for QA screenshots and the export→3D-rig handoff.
// ═══════════════════════════════════════════════════════════════════════════

export type Gender = 'masculine' | 'feminine';
export type BodyType = 'slim' | 'normal' | 'heavy';
export type FaceDecor = 'none' | 'scars' | 'runes' | 'warpaint' | 'freckles' | 'skull';

export interface LookState {
  gender?: Gender;
  bodyType: BodyType;
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  cloakColor: number;
  eyeColor: number;
  faceDecor: FaceDecor;
}

export interface PortraitOpts { race: string; class: string; look: LookState; seed?: number; }

// ── palettes (indexed by the CharacterDef.look numeric fields) ──────────────
export interface Tone { name: string; light: string; base: string; shadow: string; }

export const SKIN_TONES: Tone[] = [
  { name: 'Pale Moth',    light: '#ead9c4', base: '#cdb69e', shadow: '#6e584a' },
  { name: 'Ashen',        light: '#cfc9c2', base: '#a8a29b', shadow: '#565249' },
  { name: 'Weathered',    light: '#d9b489', base: '#b28a5f', shadow: '#66482e' },
  { name: 'Olive Dusk',   light: '#c0a87e', base: '#998059', shadow: '#4f4128' },
  { name: 'Deep Umber',   light: '#8c6746', base: '#664629', shadow: '#2c1c10' },
  { name: 'Crypt Sallow', light: '#bcb7a0', base: '#918c74', shadow: '#46433a' },
  { name: 'Sun Bronze',   light: '#df9e66', base: '#b87b46', shadow: '#5d3718' },
  { name: 'Dark Ebony',   light: '#61402c', base: '#382417', shadow: '#150c07' },
  { name: 'Drow Obsidian',light: '#423e4e', base: '#282630', shadow: '#100f14' },
  { name: 'Ivory Pearl',  light: '#f7efe6', base: '#e5dacf', shadow: '#887d72' },
  { name: 'Fiery Crimson',light: '#af4a47', base: '#843330', shadow: '#3c1211' },
  { name: 'Orcish Moss',  light: '#809467', base: '#5e6e4a', shadow: '#28321e' },
];

export const HAIR_COLORS: Tone[] = [
  { name: 'Ink Black',      light: '#565664', base: '#26242e', shadow: '#0d0c12' },
  { name: 'Ash Brown',      light: '#8f7a66', base: '#57452f', shadow: '#251b10' },
  { name: 'Chestnut',       light: '#a06c40', base: '#6d4526', shadow: '#301a0c' },
  { name: 'Copper',         light: '#cf8340', base: '#934d1f', shadow: '#421c07' },
  { name: 'Bone Silver',    light: '#ddd6c6', base: '#a79f8e', shadow: '#4f4a3f' },
  { name: 'Ember Auburn',   light: '#a85a30', base: '#732f16', shadow: '#2c0f05' },
  { name: 'Golden Wheat',   light: '#cbab69', base: '#ab8645', shadow: '#563e18' },
  { name: 'Platinum Honey', light: '#eee5cf', base: '#d2c5a8', shadow: '#76684c' },
  { name: 'Raven Jet',      light: '#353440', base: '#121118', shadow: '#050508' },
  { name: 'Blood Crimson',  light: '#ba3636', base: '#8a1e1e', shadow: '#3a0808' },
  { name: 'Void Amethyst',  light: '#695182', base: '#453358', shadow: '#1b1224' },
  { name: 'Pale Frost',     light: '#e2e7ec', base: '#c8d0d6', shadow: '#6a7680' },
];

export const HAIR_STYLES = [
  'Cropped', 'Topknot', 'Long', 'Braids', 'Shaved',
  'High Ponytail', 'Flowing Locks', 'Twin Braids', 'Braided Chignon', 'Pixie Bob',
];

export const MALE_HAIR_STYLES = [0, 1, 2, 3, 4];
export const FEMALE_HAIR_STYLES = [5, 6, 7, 8, 9];

export const EYE_COLORS: { name: string; iris: string; glow: string }[] = [
  { name: 'Ember',    iris: '#c8781f', glow: '#ffcf7a' },
  { name: 'Crypt',    iris: '#3f7a72', glow: '#8fe3d4' },
  { name: 'Steel',    iris: '#6f879c', glow: '#cfe0ef' },
  { name: 'Blood',    iris: '#7c2422', glow: '#d05248' },
  { name: 'Emerald',  iris: '#2b783c', glow: '#6be384' },
  { name: 'Void',     iris: '#6b3fa0', glow: '#c18ffd' },
  { name: 'Gold',     iris: '#c29827', glow: '#ffe478' },
  { name: 'Obsidian', iris: '#1a1a1e', glow: '#5a5a6a' },
];
export const CLOAK_COLORS: Tone[] = [
  { name: 'Charcoal',   light: '#45484f', base: '#24262c', shadow: '#0b0c10' },
  { name: 'Ember Umber', light: '#6e4c2a', base: '#46301a', shadow: '#180f07' },
  { name: 'Crypt Teal', light: '#42605c', base: '#2a403c', shadow: '#0c1615' },
  { name: 'Blood Maroon', light: '#642c2a', base: '#3f1a19', shadow: '#140807' },
  { name: 'Moss Olive', light: '#5b5838', base: '#38351f', shadow: '#11110a' },
  { name: 'Slate',      light: '#5c6370', base: '#373d47', shadow: '#121419' },
];

// ── tiny color utils ─────────────────────────────────────────────────────────
type RGB = [number, number, number];
function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const A = rgb(a), B = rgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function fade(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── seeded rng ───────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ── race geometry table ──────────────────────────────────────────────────────
// FIX 6: all 42 SRD races. The six core races keep their exact T2-e looks;
// the other 36 map onto the nearest existing preset (the server builds the real
// sheet — this is only the bust preview, and unknown ids still fall back to
// Human, so nothing can crash).
interface RaceGeom { scale: number; jaw: number; ears: 'round' | 'pointed'; beard: boolean; tusks: boolean; horns: boolean; tint: string | null; }
const RACE_GEOM: Record<string, RaceGeom> = {
  // ── the six core bloodlines (unchanged T2-e presets) ──
  Human:     { scale: 1.0,  jaw: 1.0,  ears: 'round',   beard: false, tusks: false, horns: false, tint: null },
  Elf:       { scale: 0.94, jaw: 0.9,  ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#8ea3b0' },
  Dwarf:     { scale: 1.06, jaw: 1.18, ears: 'round',   beard: true,  tusks: false, horns: false, tint: '#7a4a30' },
  Halfling:  { scale: 0.88, jaw: 1.04, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#a67c4e' },
  'Half-Orc': { scale: 1.08, jaw: 1.2, ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#5a7050' },
  Tiefling:  { scale: 1.0,  jaw: 0.96, ears: 'round',   beard: false, tusks: false, horns: true,  tint: '#7a2a24' },
  // ── elf-blooded (pointed ears, slighter frame) ──
  'Half-Elf': { scale: 0.98, jaw: 0.95, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#9aa8ae' },
  'Astral Elf': { scale: 0.94, jaw: 0.9, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#8a92c0' },
  Fairy:     { scale: 0.86, jaw: 0.88, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#9ac0b8' },
  Owlin:     { scale: 0.92, jaw: 0.92, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#7f8ea0' },
  Firbolg:   { scale: 1.1,  jaw: 1.05, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#7a8a7a' },
  // ── the small folk ──
  Gnome:     { scale: 0.88, jaw: 1.02, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#a67c4e' },
  'Deep Gnome': { scale: 0.88, jaw: 1.02, ears: 'round', beard: false, tusks: false, horns: false, tint: '#7a6a80' },
  Goblin:    { scale: 0.88, jaw: 1.1,  ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#6d7a4a' },
  Kobold:    { scale: 0.86, jaw: 1.08, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#8a4a3a' },
  Verdan:    { scale: 0.88, jaw: 1.0,  ears: 'round',   beard: false, tusks: false, horns: false, tint: '#6a8a6a' },
  Harengon:  { scale: 0.9,  jaw: 0.98, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#9a8a7a' },
  // ── the big folk (tusks / broad jaws) ──
  Orc:       { scale: 1.1,  jaw: 1.22, ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#5a7050' },
  Goliath:   { scale: 1.12, jaw: 1.15, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#8a8f96' },
  Bugbear:   { scale: 1.08, jaw: 1.2,  ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#6d7a5a' },
  Hobgoblin: { scale: 1.04, jaw: 1.14, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#8a5a3a' },
  Leonin:    { scale: 1.08, jaw: 1.16, ears: 'round',   beard: true,  tusks: true,  horns: false, tint: '#b08a4a' },
  Giff:      { scale: 1.1,  jaw: 1.24, ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#6d7050' },
  'Thri-kreen': { scale: 1.02, jaw: 1.06, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#7a8a5a' },
  // ── horned / scaled ──
  Dragonborn: { scale: 1.04, jaw: 1.1, ears: 'round',   beard: false, tusks: false, horns: true,  tint: '#7a5a3a' },
  'Gem Dragonborn': { scale: 1.04, jaw: 1.1, ears: 'round', beard: false, tusks: false, horns: true, tint: '#6a5a8a' },
  Lizardfolk: { scale: 1.0,  jaw: 1.12, ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#5a7a5a' },
  'Yuan-ti Pureblood': { scale: 1.0, jaw: 1.0, ears: 'round', beard: false, tusks: false, horns: false, tint: '#6a8a5a' },
  Hexblood:  { scale: 1.0,  jaw: 0.96, ears: 'round',   beard: false, tusks: false, horns: true,  tint: '#5a6a5a' },
  // ── beast-blooded ──
  Tabaxi:    { scale: 0.98, jaw: 0.95, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#a08a5a' },
  Satyr:     { scale: 0.98, jaw: 0.98, ears: 'pointed', beard: false, tusks: false, horns: true,  tint: '#8a6a4a' },
  Hadozee:   { scale: 0.96, jaw: 1.06, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#7a6a5a' },
  // ── elemental / planar / strange ──
  Genasi:    { scale: 1.0,  jaw: 1.0,  ears: 'round',   beard: false, tusks: false, horns: false, tint: '#8a8ab0' },
  Aasimar:   { scale: 1.0,  jaw: 0.96, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#c8b890' },
  Triton:    { scale: 0.98, jaw: 0.94, ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#6a9a9a' },
  Aarakocra: { scale: 0.94, jaw: 0.9,  ears: 'pointed', beard: false, tusks: false, horns: false, tint: '#a08a6a' },
  Kenku:     { scale: 0.94, jaw: 1.08, ears: 'round',   beard: false, tusks: true,  horns: false, tint: '#6a6a72' },
  Dhampir:   { scale: 1.0,  jaw: 0.94, ears: 'pointed', beard: false, tusks: true,  horns: false, tint: '#b0a8b8' },
  Reborn:    { scale: 1.0,  jaw: 1.0,  ears: 'round',   beard: false, tusks: false, horns: false, tint: '#9aa89a' },
  'Custom Lineage': { scale: 1.0, jaw: 1.0, ears: 'round', beard: false, tusks: false, horns: false, tint: null },
  Autognome: { scale: 0.88, jaw: 1.04, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#8a8f96' },
  Plasmoid:  { scale: 0.98, jaw: 0.92, ears: 'round',   beard: false, tusks: false, horns: false, tint: '#7a8a9a' },
};

const BODY_SCALE: Record<BodyType, number> = { slim: 0.85, normal: 1.0, heavy: 1.18 };

// ── main entry ───────────────────────────────────────────────────────────────
export function paintPortrait(canvas: HTMLCanvasElement, opts: PortraitOpts): void {
  const W = 512, H = 640;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const look = opts.look;
  const rng = mulberry32((opts.seed ?? 7) ^ 0x9e37);
  const race = RACE_GEOM[opts.race] || RACE_GEOM.Human;
  const skin = SKIN_TONES[look.skinTone % SKIN_TONES.length];
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  const cloak = CLOAK_COLORS[look.cloakColor % CLOAK_COLORS.length];
  const eye = EYE_COLORS[look.eyeColor % EYE_COLORS.length];
  const cls = opts.class || 'Fighter';

  const s = race.scale, body = BODY_SCALE[look.bodyType] || 1;
  const CX = W / 2;
  const headW = 140 * s, headH = 172 * s;
  const crownY = 116, chinY = crownY + headH;
  const halfW = headW / 2;
  const eyeY = crownY + headH * 0.44;
  const eyeDx = halfW * 0.46;
  const shoulderY = chinY + 74;
  const shoulderHalf = 168 * body;
  const isBarb = cls === 'Barbarian';

  ctx.clearRect(0, 0, W, H);

  paintBackground(ctx, rng, cloak);
  if (cls === 'Cleric') paintHalo(ctx, CX, crownY, halfW);
  paintCloak(ctx, rng, cloak, CX, shoulderY, shoulderHalf, H, isBarb);
  paintHood(ctx, rng, cloak, CX, crownY, halfW, shoulderHalf, shoulderY, isBarb);
  if (!isBarb) paintHoodRimLight(ctx, cloak, CX, crownY, halfW, shoulderHalf, shoulderY);
  paintNeck(ctx, skin, CX, chinY, shoulderY, halfW * (0.34 * body + 0.1), race);
  const facePath = buildFacePath(CX, halfW, crownY, chinY, eyeY, race.jaw);
  paintFace(ctx, facePath, skin, race, halfW, eyeY, chinY);
  paintEars(ctx, race, skin, CX, halfW, eyeY, s);           // pokes out of the hood
  if (race.horns) paintHorns(ctx, hair, CX, halfW, crownY);
  if (race.tusks) paintTusks(ctx, skin, CX, halfW, eyeY, headH);
  paintHoodShadow(ctx, CX, halfW, crownY, eyeY, isBarb, cls);
  paintEyes(ctx, eye, hair, cls, CX, eyeY, eyeDx, race, s);
  paintNoseMouth(ctx, skin, hair, race, CX, halfW, eyeY, headH);
  paintHair(ctx, rng, hair, look.hairStyle, CX, halfW, crownY, eyeY, chinY, shoulderY, isBarb);
  if (race.beard) paintBeard(ctx, hair, CX, halfW, eyeY, headH, shoulderY);
  paintFaceDecor(ctx, look.faceDecor, rng, CX, halfW, eyeY, headH, cls);
  paintClassHint(ctx, rng, cls, CX, crownY, halfW, shoulderHalf, shoulderY, eye, cloak);
  paintBrushStrokes(ctx, rng, CX, crownY, shoulderY, shoulderHalf);
  paintGrain(ctx, rng, W, H);
  paintVignette(ctx, cls, W, H);
  paintRimLight(ctx, facePath, CX, crownY, halfW, cls);
}

// ── layers ───────────────────────────────────────────────────────────────────
function paintBackground(ctx: CanvasRenderingContext2D, rng: () => number, cloak: Tone) {
  const g = ctx.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, '#0e0f13'); g.addColorStop(0.55, '#0a0b0e'); g.addColorStop(1, '#060708');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 640);
  // warm ember key light, upper-left
  const key = ctx.createRadialGradient(120, 90, 20, 120, 90, 420);
  key.addColorStop(0, 'rgba(201,116,52,0.14)'); key.addColorStop(1, 'rgba(201,116,52,0)');
  ctx.fillStyle = key; ctx.fillRect(0, 0, 512, 640);
  // cold counter-glow, right
  const cold = ctx.createRadialGradient(470, 300, 30, 470, 300, 380);
  cold.addColorStop(0, 'rgba(61,90,90,0.10)'); cold.addColorStop(1, 'rgba(61,90,90,0)');
  ctx.fillStyle = cold; ctx.fillRect(0, 0, 512, 640);
  // drifting smoke wisps
  for (let i = 0; i < 7; i++) {
    const x = 40 + rng() * 440, y = 80 + rng() * 420, r = 60 + rng() * 130;
    const w = ctx.createRadialGradient(x, y, 0, x, y, r);
    w.addColorStop(0, `rgba(${8 + rng() * 14 | 0},${8 + rng() * 12 | 0},${10 + rng() * 12 | 0},0.16)`);
    w.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = w; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // faint cloak-colored ambience behind the figure
  const amb = ctx.createRadialGradient(256, 300, 60, 256, 300, 330);
  amb.addColorStop(0, fade(cloak.base, 0.10)); amb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = amb; ctx.fillRect(0, 0, 512, 640);
}

function paintHalo(ctx: CanvasRenderingContext2D, cx: number, crownY: number, halfW: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const r = halfW * 1.7;
  const g = ctx.createRadialGradient(cx, crownY + 10, r * 0.62, cx, crownY + 10, r);
  g.addColorStop(0, 'rgba(230,199,102,0)'); g.addColorStop(0.55, 'rgba(230,199,102,0.16)');
  g.addColorStop(0.8, 'rgba(230,199,102,0.05)'); g.addColorStop(1, 'rgba(230,199,102,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, crownY + 10, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function paintCloak(ctx: CanvasRenderingContext2D, rng: () => number, cloak: Tone,
                    cx: number, shoulderY: number, shoulderHalf: number, H: number, fur: boolean) {
  ctx.save();
  // body: shoulders → bottom of frame
  const path = new Path2D();
  path.moveTo(cx - shoulderHalf * 0.86, shoulderY - 6);
  path.quadraticCurveTo(cx - shoulderHalf, shoulderY + 26, cx - shoulderHalf * 0.97, shoulderY + 70);
  path.quadraticCurveTo(cx - shoulderHalf * 0.85, (shoulderY + H) / 2, cx - shoulderHalf * 0.8, H);
  path.lineTo(cx + shoulderHalf * 0.8, H);
  path.quadraticCurveTo(cx + shoulderHalf * 0.85, (shoulderY + H) / 2, cx + shoulderHalf * 0.97, shoulderY + 70);
  path.quadraticCurveTo(cx + shoulderHalf, shoulderY + 26, cx + shoulderHalf * 0.86, shoulderY - 6);
  path.quadraticCurveTo(cx, shoulderY - 30, cx - shoulderHalf * 0.86, shoulderY - 6);
  const g = ctx.createLinearGradient(cx - shoulderHalf, shoulderY, cx + shoulderHalf * 0.7, H);
  const base = fur ? '#3d3629' : cloak.base;
  const light = fur ? '#57503c' : cloak.light;
  const shadow = fur ? '#14110a' : cloak.shadow;
  g.addColorStop(0, mix(light, base, 0.35)); g.addColorStop(0.45, base); g.addColorStop(1, shadow);
  ctx.fillStyle = g; ctx.fill(path);
  // fabric folds
  ctx.clip(path);
  for (let i = 0; i < 9; i++) {
    const x = cx + (rng() * 2 - 1) * shoulderHalf * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, shoulderY - 10);
    ctx.quadraticCurveTo(x + (rng() * 60 - 30), shoulderY + 150, x + (rng() * 90 - 45), H);
    ctx.strokeStyle = fade(i % 2 ? shadow : light, 0.10 + rng() * 0.08);
    ctx.lineWidth = 6 + rng() * 14; ctx.lineCap = 'round'; ctx.stroke();
  }
  // shoulder highlight sweep
  const sh = ctx.createLinearGradient(0, shoulderY - 20, 0, shoulderY + 90);
  sh.addColorStop(0, fade(light, 0.18)); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh; ctx.fillRect(cx - shoulderHalf, shoulderY - 20, shoulderHalf * 2, 110);
  ctx.restore();
  if (fur) paintFur(ctx, rng, cx, shoulderY, shoulderHalf, H);
}

function paintFur(ctx: CanvasRenderingContext2D, rng: () => number, cx: number, shoulderY: number, shoulderHalf: number, H: number) {
  // barbarian mantle: shaggy strokes over the shoulders
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const side = rng() < 0.5 ? -1 : 1;
    const t = rng();
    const x = cx + side * (18 + t * shoulderHalf * 0.92);
    const y = shoulderY - 26 + Math.pow(rng(), 0.7) * 150 + t * 20;
    if (y > H) continue;
    const len = 9 + rng() * 16;
    const ang = -Math.PI / 2 + (rng() - 0.5) * 1.6 + side * 0.35;
    const c = rng() < 0.24 ? '#6e6350' : rng() < 0.5 ? '#4a4132' : '#2c2618';
    ctx.strokeStyle = fade(c, 0.5 + rng() * 0.4);
    ctx.lineWidth = 1.2 + rng() * 1.8;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + side * 3, y + Math.sin(ang) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function paintHood(ctx: CanvasRenderingContext2D, rng: () => number, cloak: Tone,
                  cx: number, crownY: number, halfW: number, shoulderHalf: number, shoulderY: number, skip: boolean) {
  if (skip) return; // barbarians wear a fur mantle, not a cowl
  ctx.save();
  const outer = new Path2D();
  outer.moveTo(cx - shoulderHalf * 0.8, shoulderY + 34);
  outer.quadraticCurveTo(cx - halfW * 1.5, shoulderY - 40, cx - halfW * 1.22, crownY + 46);
  outer.quadraticCurveTo(cx - halfW * 1.05, crownY - 58, cx, crownY - 54);
  outer.quadraticCurveTo(cx + halfW * 1.05, crownY - 58, cx + halfW * 1.22, crownY + 46);
  outer.quadraticCurveTo(cx + halfW * 1.5, shoulderY - 40, cx + shoulderHalf * 0.8, shoulderY + 34);
  outer.quadraticCurveTo(cx, shoulderY + 66, cx - shoulderHalf * 0.8, shoulderY + 34);
  // face opening
  const inner = new Path2D();
  inner.ellipse(cx, crownY + halfW * 0.72, halfW * 1.0, halfW * 1.05, 0, 0, Math.PI * 2);
  const both = new Path2D();
  both.addPath(outer); both.addPath(inner);
  const g = ctx.createLinearGradient(cx - halfW * 1.3, crownY - 60, cx + halfW * 1.1, shoulderY + 40);
  g.addColorStop(0, mix(cloak.light, cloak.base, 0.45));
  g.addColorStop(0.5, cloak.base);
  g.addColorStop(1, cloak.shadow);
  ctx.fillStyle = g;
  ctx.fill(both, 'evenodd');
  // cowl folds
  ctx.save(); ctx.clip(both, 'evenodd');
  for (let i = 0; i < 6; i++) {
    const x = cx + (rng() * 2 - 1) * halfW * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, crownY - 50);
    ctx.quadraticCurveTo(x + (rng() * 90 - 45), shoulderY - 60, x + (rng() * 120 - 60), shoulderY + 40);
    ctx.strokeStyle = fade(i % 2 ? cloak.shadow : cloak.light, 0.12 + rng() * 0.08);
    ctx.lineWidth = 8 + rng() * 16; ctx.lineCap = 'round'; ctx.stroke();
  }
  // inner edge shadow (depth of the cowl)
  const es = ctx.createRadialGradient(cx, crownY + halfW * 0.72, halfW * 0.72, cx, crownY + halfW * 0.72, halfW * 1.12);
  es.addColorStop(0, 'rgba(0,0,0,0)'); es.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = es; ctx.fillRect(cx - halfW * 1.5, crownY - 80, halfW * 3, halfW * 2.6);
  ctx.restore();
  ctx.restore();
}

function paintHoodRimLight(ctx: CanvasRenderingContext2D, cloak: Tone, cx: number, crownY: number, halfW: number, shoulderHalf: number, shoulderY: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(230,199,102,0.28)';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - shoulderHalf * 0.78, shoulderY + 22);
  ctx.quadraticCurveTo(cx - halfW * 1.48, shoulderY - 44, cx - halfW * 1.2, crownY + 42);
  ctx.quadraticCurveTo(cx - halfW * 1.02, crownY - 56, cx, crownY - 52);
  ctx.stroke();
  ctx.restore();
}

function paintNeck(ctx: CanvasRenderingContext2D, skin: Tone, cx: number, chinY: number, shoulderY: number, halfNeck: number, race: RaceGeom) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfNeck, chinY - 26);
  ctx.quadraticCurveTo(cx - halfNeck * 0.9, shoulderY - 8, cx - halfNeck * 1.25, shoulderY + 18);
  ctx.lineTo(cx + halfNeck * 1.25, shoulderY + 18);
  ctx.quadraticCurveTo(cx + halfNeck * 0.9, shoulderY - 8, cx + halfNeck, chinY - 26);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - halfNeck, chinY, cx + halfNeck, shoulderY);
  g.addColorStop(0, mix(skin.base, skin.shadow, 0.45)); g.addColorStop(0.6, skin.shadow); g.addColorStop(1, mix(skin.shadow, '#000', 0.4));
  ctx.fillStyle = g; ctx.fill();
  // throat shadow cast by the jaw
  ctx.beginPath();
  ctx.ellipse(cx, chinY + 6, halfNeck * 1.5, 30, 0, 0, Math.PI * 2);
  const j = ctx.createRadialGradient(cx, chinY - 4, 4, cx, chinY - 4, 56);
  j.addColorStop(0, 'rgba(0,0,0,0.42)'); j.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = j; ctx.fill();
  void race;
  ctx.restore();
}

function buildFacePath(cx: number, halfW: number, crownY: number, chinY: number, eyeY: number, jaw: number): Path2D {
  const p = new Path2D();
  const templeY = crownY + (eyeY - crownY) * 0.42;
  p.moveTo(cx - halfW * 0.96, templeY);
  p.bezierCurveTo(cx - halfW * 0.94, crownY - 6, cx - halfW * 0.5, crownY - 14, cx, crownY - 13);
  p.bezierCurveTo(cx + halfW * 0.5, crownY - 14, cx + halfW * 0.94, crownY - 6, cx + halfW * 0.96, templeY);
  p.bezierCurveTo(cx + halfW * 1.02, eyeY + 14, cx + halfW * (0.7 + 0.2 * jaw), chinY - 42, cx + halfW * 0.42 * jaw, chinY - 8);
  p.quadraticCurveTo(cx, chinY + 4, cx - halfW * 0.42 * jaw, chinY - 8);
  p.bezierCurveTo(cx - halfW * (0.7 + 0.2 * jaw), chinY - 42, cx - halfW * 1.02, eyeY + 14, cx - halfW * 0.96, templeY);
  p.closePath();
  return p;
}

function paintFace(ctx: CanvasRenderingContext2D, facePath: Path2D, skin: Tone, race: RaceGeom, halfW: number, eyeY: number, chinY: number) {
  ctx.save();
  ctx.clip(facePath);
  // base: warm light from upper-left → cool shadow lower-right
  const g = ctx.createLinearGradient(256 - halfW, eyeY - 70, 256 + halfW * 0.9, chinY + 20);
  g.addColorStop(0, mix(skin.light, skin.base, 0.25));
  g.addColorStop(0.42, skin.base);
  g.addColorStop(1, mix(skin.base, skin.shadow, 0.8));
  ctx.fillStyle = g;
  ctx.fillRect(256 - halfW * 1.2, eyeY - 120, halfW * 2.4, chinY - eyeY + 180);
  // broad form shadow (right side of the face)
  ctx.globalCompositeOperation = 'multiply';
  const rs = ctx.createRadialGradient(256 + halfW * 0.66, eyeY + 34, 12, 256 + halfW * 0.66, eyeY + 34, halfW * 1.15);
  rs.addColorStop(0, 'rgba(30,22,20,0.5)'); rs.addColorStop(1, 'rgba(30,22,20,0)');
  ctx.fillStyle = rs; ctx.fillRect(256 - halfW, eyeY - 110, halfW * 2, chinY - eyeY + 150);
  // race tint
  if (race.tint) {
    ctx.fillStyle = fade(race.tint, race.tint === '#8ea3b0' ? 0.07 : 0.15);
    ctx.fillRect(256 - halfW, eyeY - 110, halfW * 2, chinY - eyeY + 150);
  }
  // cheekbone + forehead highlights
  ctx.globalCompositeOperation = 'screen';
  const hi = (x: number, y: number, r: number, a: number) => {
    const h = ctx.createRadialGradient(x, y, 0, x, y, r);
    h.addColorStop(0, `rgba(255,232,200,${a})`); h.addColorStop(1, 'rgba(255,232,200,0)');
    ctx.fillStyle = h; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  hi(256 - halfW * 0.52, eyeY + 20, 44, 0.16);   // left cheek
  hi(256 - halfW * 0.16, eyeY - 52, 40, 0.13);   // forehead
  hi(256 + halfW * 0.42, eyeY + 26, 30, 0.07);   // right cheek (dimmer)
  ctx.restore();
}

function paintEars(ctx: CanvasRenderingContext2D, race: RaceGeom, skin: Tone, cx: number, halfW: number, eyeY: number, s: number) {
  const draw = (side: number) => {
    ctx.save();
    ctx.translate(cx + side * halfW * 0.98, eyeY + 6);
    ctx.beginPath();
    if (race.ears === 'pointed') {
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(side * 26 * s, -20 * s, side * 30 * s, -2);
      ctx.quadraticCurveTo(side * 24 * s, 14, 0, 16);
    } else {
      ctx.ellipse(0, 0, 9 * s, 17 * s, 0, 0, Math.PI * 2);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(side * -6, -10, side * 22, 10);
    g.addColorStop(0, mix(skin.base, skin.shadow, 0.35)); g.addColorStop(1, mix(skin.base, skin.shadow, 0.6));
    ctx.fillStyle = g; ctx.fill();
    // inner ear shadow
    ctx.beginPath();
    if (race.ears === 'pointed') {
      ctx.moveTo(side * 2, -4);
      ctx.quadraticCurveTo(side * 16, -8, side * 18, 0);
      ctx.quadraticCurveTo(side * 12, 6, side * 2, 8);
    } else {
      ctx.ellipse(side * 1, 1, 4 * s, 9 * s, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(20,12,10,0.45)'; ctx.fill();
    ctx.restore();
  };
  draw(-1); draw(1);
}

function paintHorns(ctx: CanvasRenderingContext2D, hair: Tone, cx: number, halfW: number, crownY: number) {
  const horn = (side: number) => {
    ctx.save();
    ctx.translate(cx + side * halfW * 0.52, crownY + 10);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(side * 30, 4, side * 44, -30);
    ctx.quadraticCurveTo(side * 47, -44, side * 38, -50);
    ctx.quadraticCurveTo(side * 40, -30, side * 22, -14);
    ctx.quadraticCurveTo(side * 12, -4, 0, 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, side * 46, -50);
    g.addColorStop(0, mix(hair.shadow, '#2b2019', 0.5)); g.addColorStop(1, '#6e5b45');
    ctx.fillStyle = g; ctx.fill();
    // ridges
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(side * (10 + t * 26), -2 - t * 30);
      ctx.quadraticCurveTo(side * (16 + t * 22), -6 - t * 30, side * (14 + t * 24), -12 - t * 28);
      ctx.stroke();
    }
    ctx.restore();
  };
  horn(-1); horn(1);
}

function paintTusks(ctx: CanvasRenderingContext2D, skin: Tone, cx: number, halfW: number, eyeY: number, headH: number) {
  const mouthY = eyeY + headH * 0.27;
  const tusk = (side: number) => {
    ctx.save();
    ctx.translate(cx + side * halfW * 0.3, mouthY + 8);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(side * 5, -6, side * 3, -16);
    ctx.quadraticCurveTo(side * 8, -6, side * 4, 8);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -16, 0, 8);
    g.addColorStop(0, '#e8ddc4'); g.addColorStop(1, mix(skin.base, '#c9b896', 0.5));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  };
  tusk(-1); tusk(1);
}

function paintHoodShadow(ctx: CanvasRenderingContext2D, cx: number, halfW: number, crownY: number, eyeY: number, noHood: boolean, cls: string) {
  // the cowl casts a soft band over the brow
  ctx.save();
  if (noHood) { ctx.restore(); return; }
  const g = ctx.createLinearGradient(0, crownY - 10, 0, eyeY + 6);
  g.addColorStop(0, 'rgba(4,3,3,0.62)'); g.addColorStop(1, 'rgba(4,3,3,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, crownY + (eyeY - crownY) * 0.5, halfW * 1.12, (eyeY - crownY) * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  if (cls === 'Rogue') {
    // hood pulled low — a blade of shadow across the eyes
    const b = ctx.createLinearGradient(0, eyeY - 14, 0, eyeY + 16);
    b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(0.5, 'rgba(0,0,0,0.34)'); b.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = b;
    ctx.fillRect(cx - halfW * 1.2, eyeY - 14, halfW * 2.4, 30);
  }
  ctx.restore();
}

function paintEyes(ctx: CanvasRenderingContext2D, eye: { iris: string; glow: string }, hair: Tone, cls: string, cx: number, eyeY: number, eyeDx: number, race: RaceGeom, s: number) {
  const ew = 15 * s, eh = 6.5 * s;         // half-width / half-height of the almond
  const r = 6.6 * s;                        // iris radius
  const warlock = cls === 'Warlock';
  const draw = (side: number) => {
    const x = cx + side * eyeDx, y = eyeY;
    ctx.save();
    // socket shadow
    let g = ctx.createRadialGradient(x, y - 2, 4, x, y, 26);
    g.addColorStop(0, 'rgba(18,10,8,0.4)'); g.addColorStop(1, 'rgba(18,10,8,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
    // sclera (dim, not white — dark fantasy)
    ctx.beginPath();
    ctx.moveTo(x - ew, y);
    ctx.quadraticCurveTo(x, y - eh * 1.7, x + ew, y);
    ctx.quadraticCurveTo(x, y + eh * 1.5, x - ew, y);
    ctx.closePath();
    g = ctx.createLinearGradient(x, y - eh, x, y + eh);
    g.addColorStop(0, '#b8ad9c'); g.addColorStop(1, '#6e6355');
    ctx.fillStyle = g; ctx.fill();
    // iris + pupil
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, eye.glow); g.addColorStop(0.55, eye.iris); g.addColorStop(1, mix(eye.iris, '#000', 0.62));
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0705'; ctx.fill();
    // iris rim
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    // catchlight — the "alive" dot
    ctx.save();
    ctx.shadowColor = eye.glow; ctx.shadowBlur = warlock ? 10 : 5;
    ctx.fillStyle = 'rgba(255,250,238,0.95)';
    ctx.beginPath(); ctx.arc(x - r * 0.38, y - r * 0.42, 1.9 * s, 0, Math.PI * 2); ctx.fill();
    if (warlock) { // burning gaze
      ctx.shadowBlur = 14; ctx.fillStyle = fade(eye.glow, 0.5);
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // upper lid
    ctx.beginPath();
    ctx.moveTo(x - ew * 1.04, y - 1);
    ctx.quadraticCurveTo(x, y - eh * 1.8, x + ew * 1.04, y - 1);
    ctx.strokeStyle = 'rgba(16,9,7,0.8)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke();
    // lower lid (soft)
    ctx.beginPath();
    ctx.moveTo(x - ew * 0.9, y + 3.4);
    ctx.quadraticCurveTo(x, y + eh * 1.6, x + ew * 0.9, y + 3.4);
    ctx.strokeStyle = 'rgba(16,9,7,0.3)'; ctx.lineWidth = 1.4; ctx.stroke();
    // brow
    ctx.beginPath();
    ctx.moveTo(x - ew * 1.15, y - eh - 10);
    ctx.quadraticCurveTo(x + side * 2, y - eh - (race.tusks ? 18 : 15), x + ew * 1.2, y - eh - (race.tusks ? 11 : 8));
    ctx.strokeStyle = mix(hair.shadow, hair.base, 0.4);
    ctx.lineWidth = race.tusks ? 6.5 : 5.2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  };
  draw(-1); draw(1);
}

function paintNoseMouth(ctx: CanvasRenderingContext2D, skin: Tone, hair: Tone, race: RaceGeom, cx: number, halfW: number, eyeY: number, headH: number) {
  const noseY = eyeY + headH * 0.17;
  const noseTip = eyeY + headH * 0.145;
  const mouthY = eyeY + headH * 0.27;
  ctx.save();
  // nose: shadowed ridge + tip light
  ctx.beginPath();
  ctx.moveTo(cx - 3, eyeY - 2);
  ctx.quadraticCurveTo(cx - 7, noseY, cx - 8.5, noseTip + 5);
  ctx.quadraticCurveTo(cx, noseTip + 11, cx + 8.5, noseTip + 5);
  ctx.quadraticCurveTo(cx + 7, noseY, cx + 3, eyeY - 2);
  ctx.closePath();
  let g = ctx.createLinearGradient(cx - 8, eyeY, cx + 9, noseTip);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(20,12,10,0.20)'); g.addColorStop(1, 'rgba(20,12,10,0.34)');
  ctx.fillStyle = g; ctx.fill();
  // nostril hints
  ctx.fillStyle = 'rgba(14,8,6,0.5)';
  ctx.beginPath(); ctx.ellipse(cx - 5.5, noseTip + 4, 2.4, 1.5, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 5.5, noseTip + 4, 2.4, 1.5, 0.4, 0, Math.PI * 2); ctx.fill();
  // tip highlight
  ctx.globalCompositeOperation = 'screen';
  g = ctx.createRadialGradient(cx - 2, noseTip, 0, cx - 2, noseTip, 10);
  g.addColorStop(0, 'rgba(255,232,200,0.15)'); g.addColorStop(1, 'rgba(255,232,200,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - 12, noseTip - 10, 24, 20);
  ctx.globalCompositeOperation = 'source-over';
  if (!race.beard) {
    // mouth: a grim line + lower-lip light
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.30, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + (race.tusks ? 2 : 4.5), cx + halfW * 0.30, mouthY);
    ctx.strokeStyle = 'rgba(24,12,10,0.72)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.globalCompositeOperation = 'screen';
    g = ctx.createRadialGradient(cx, mouthY + 9, 0, cx, mouthY + 9, 12);
    g.addColorStop(0, 'rgba(255,220,190,0.12)'); g.addColorStop(1, 'rgba(255,220,190,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 12, mouthY - 3, 24, 24);
  }
  ctx.restore();
}

function paintHair(ctx: CanvasRenderingContext2D, rng: () => number, hair: Tone, style: number,
                   cx: number, halfW: number, crownY: number, eyeY: number, chinY: number, shoulderY: number, noHood: boolean) {
  const cap = () => {
    // scalp cap hugging the crown — visible inside the hood opening / without hood
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.97, crownY + 34);
    ctx.bezierCurveTo(cx - halfW * 0.95, crownY - 12, cx - halfW * 0.5, crownY - 22, cx, crownY - 21);
    ctx.bezierCurveTo(cx + halfW * 0.5, crownY - 22, cx + halfW * 0.95, crownY - 12, cx + halfW * 0.97, crownY + 34);
    ctx.quadraticCurveTo(cx + halfW * 0.5, crownY + 22, cx, crownY + 26);
    ctx.quadraticCurveTo(cx - halfW * 0.5, crownY + 22, cx - halfW * 0.97, crownY + 34);
    ctx.closePath();
    const g = ctx.createLinearGradient(cx - halfW, crownY - 24, cx + halfW * 0.6, crownY + 40);
    g.addColorStop(0, mix(hair.light, hair.base, 0.3)); g.addColorStop(0.55, hair.base); g.addColorStop(1, mix(hair.base, hair.shadow, 0.5));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  };
  const strands = (n: number, y0: number, y1: number, spread: number, alpha: number) => {
    // a few flyaway strands for the painted feel
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const side = rng() < 0.5 ? -1 : 1;
      const x = cx + side * halfW * (0.5 + rng() * 0.5);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + side * 10, y0 + (y1 - y0) * 0.5, x + side * (4 + rng() * 14), y1);
      ctx.strokeStyle = fade(rng() < 0.5 ? hair.light : hair.shadow, alpha);
      ctx.lineWidth = 1 + rng() * 2;
      ctx.stroke();
    }
    void spread;
    ctx.restore();
  };

  ctx.save();
  if (style === 4) {
    // shaved — stubble grain on the scalp
    cap();
    ctx.save();
    for (let i = 0; i < 500; i++) {
      const x = cx + (rng() * 2 - 1) * halfW * 0.92;
      const t = Math.abs(x - cx) / (halfW * 0.95);
      const y = crownY - 8 + Math.sqrt(Math.max(0, 1 - t * t)) * 34 * rng() + rng() * 12;
      ctx.fillStyle = fade(rng() < 0.5 ? hair.shadow : hair.base, 0.5);
      ctx.fillRect(x, y, 1.3, 1.3);
    }
    ctx.restore();
  } else if (style === 1) {
    // topknot — cap + a bound knot above the crown (pokes past the hood)
    cap();
    ctx.beginPath();
    ctx.ellipse(cx, crownY - 26, halfW * 0.3, halfW * 0.24, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - 10, crownY - 34, 4, cx, crownY - 26, halfW * 0.34);
    g.addColorStop(0, hair.light); g.addColorStop(0.7, hair.base); g.addColorStop(1, hair.shadow);
    ctx.fillStyle = g; ctx.fill();
    // tie band
    ctx.beginPath(); ctx.ellipse(cx, crownY - 12, halfW * 0.22, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2c1c'; ctx.fill();
    strands(6, crownY - 30, crownY - 2, halfW, 0.5);
  } else if (style === 2 || style === 3) {
    // long / braids — crown cap + heavy locks spilling past the cowl onto the chest
    cap();
    const lock = (side: number, tilt: number, len: number, braid: boolean) => {
      ctx.save();
      const x0 = cx + side * halfW * 0.78, y0 = crownY + 30;
      ctx.beginPath();
      ctx.moveTo(x0 - 12, y0);
      ctx.bezierCurveTo(x0 + side * 6 - 14, y0 + 60, x0 + side * tilt - 10, y0 + len * 0.55, x0 + side * tilt - 6, y0 + len);
      ctx.lineTo(x0 + side * tilt + 10, y0 + len);
      ctx.bezierCurveTo(x0 + side * tilt + 16, y0 + len * 0.55, x0 + side * 10 + 14, y0 + 60, x0 + 12, y0);
      ctx.closePath();
      const g = ctx.createLinearGradient(x0 - 14, y0, x0 + side * tilt + 12, y0 + len);
      g.addColorStop(0, mix(hair.light, hair.base, 0.35)); g.addColorStop(0.5, hair.base); g.addColorStop(1, mix(hair.base, hair.shadow, 0.55));
      ctx.fillStyle = g; ctx.fill();
      if (braid) {
        // chevron ties down the braid
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2.4;
        for (let i = 1; i <= 5; i++) {
          const t = i / 6, y = y0 + len * t, x = x0 + side * tilt * t;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 5); ctx.quadraticCurveTo(x, y + 3, x + 10, y - 5);
          ctx.stroke();
        }
      }
      // sheen stroke
      ctx.beginPath();
      ctx.moveTo(x0 + side * 2 - 6, y0 + 8);
      ctx.quadraticCurveTo(x0 + side * tilt * 0.5 - 4, y0 + len * 0.5, x0 + side * tilt - 2, y0 + len - 8);
      ctx.strokeStyle = fade(hair.light, 0.28); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    };
    lock(-1, -26, Math.min(shoulderY + 150 - (crownY + 30), 210), style === 3);
    lock(1, 30, Math.min(shoulderY + 150 - (crownY + 30), 200), style === 3);
    if (noHood) strands(10, crownY + 20, chinY + 30, halfW, 0.45);
  } else if (style === 5) {
    // high ponytail — pulled crown with long arching ponytail down the side
    cap();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx + halfW * 0.22, crownY - 14, halfW * 0.26, halfW * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = hair.base; ctx.fill();
    // flowing tail
    ctx.beginPath();
    ctx.moveTo(cx + halfW * 0.22, crownY - 14);
    ctx.bezierCurveTo(cx + halfW * 0.95, crownY + 20, cx + halfW * 0.85, chinY + 30, cx + halfW * 0.65, shoulderY + 80);
    ctx.bezierCurveTo(cx + halfW * 0.55, chinY + 50, cx + halfW * 0.45, crownY + 20, cx + halfW * 0.16, crownY - 8);
    ctx.closePath();
    const g = ctx.createLinearGradient(cx, crownY, cx + halfW * 0.8, shoulderY + 80);
    g.addColorStop(0, hair.light); g.addColorStop(0.5, hair.base); g.addColorStop(1, hair.shadow);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    strands(7, crownY + 10, chinY + 40, halfW, 0.4);
  } else if (style === 6) {
    // flowing locks — voluminous mane cascading past shoulders
    cap();
    ctx.save();
    const cascade = (side: number) => {
      ctx.beginPath();
      const x0 = cx + side * halfW * 0.72;
      ctx.moveTo(x0 - 16, crownY + 26);
      ctx.bezierCurveTo(x0 + side * 28, crownY + 80, x0 + side * 34, shoulderY + 40, x0 + side * 14, shoulderY + 180);
      ctx.lineTo(x0 - side * 8, shoulderY + 175);
      ctx.bezierCurveTo(x0 + side * 8, shoulderY + 40, x0, crownY + 70, x0 - 12, crownY + 30);
      ctx.closePath();
      const g = ctx.createLinearGradient(x0 - 20, crownY + 26, x0 + side * 30, shoulderY + 180);
      g.addColorStop(0, hair.light); g.addColorStop(0.5, hair.base); g.addColorStop(1, hair.shadow);
      ctx.fillStyle = g; ctx.fill();
    };
    cascade(-1); cascade(1);
    ctx.restore();
    strands(12, crownY + 20, chinY + 60, halfW, 0.5);
  } else if (style === 7) {
    // twin braids — two distinct forward plaits
    cap();
    ctx.save();
    const b = (side: number) => {
      const x0 = cx + side * halfW * 0.68;
      ctx.beginPath();
      ctx.moveTo(x0 - 10, crownY + 30);
      ctx.bezierCurveTo(x0 + side * 8, crownY + 90, x0 + side * 4, shoulderY + 70, x0, shoulderY + 150);
      ctx.lineTo(x0 + 10, shoulderY + 150);
      ctx.bezierCurveTo(x0 + side * 12 + 10, shoulderY + 70, x0 + side * 12, crownY + 90, x0 + 10, crownY + 30);
      ctx.closePath();
      ctx.fillStyle = hair.base; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2.2;
      for (let i = 1; i <= 6; i++) {
        const y = crownY + 30 + (shoulderY + 120 - crownY) * (i / 7);
        ctx.beginPath(); ctx.moveTo(x0 - 8, y - 4); ctx.lineTo(x0 + 8, y + 4); ctx.stroke();
      }
    };
    b(-1); b(1);
    ctx.restore();
  } else if (style === 8) {
    // braided chignon — sleek front into low coiled bun
    cap();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, crownY + 12, halfW * 0.44, halfW * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = hair.shadow; ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, crownY + 10, halfW * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = hair.base; ctx.fill();
    ctx.strokeStyle = fade(hair.light, 0.4); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  } else if (style === 9) {
    // pixie bob — jawline framing chic cropped bob
    cap();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.95, crownY + 30);
    ctx.quadraticCurveTo(cx - halfW * 1.05, chinY - 4, cx - halfW * 0.6, chinY + 10);
    ctx.lineTo(cx - halfW * 0.45, chinY - 6);
    ctx.quadraticCurveTo(cx, crownY + 44, cx + halfW * 0.45, chinY - 6);
    ctx.lineTo(cx + halfW * 0.6, chinY + 10);
    ctx.quadraticCurveTo(cx + halfW * 1.05, chinY - 4, cx + halfW * 0.95, crownY + 30);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, crownY + 20, 0, chinY + 10);
    g.addColorStop(0, hair.light); g.addColorStop(0.6, hair.base); g.addColorStop(1, hair.shadow);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    strands(6, crownY + 25, chinY - 5, halfW, 0.4);
  } else {
    // cropped — cap + short fringe over the brow
    cap();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.9, crownY + 32);
    ctx.quadraticCurveTo(cx - halfW * 0.4, crownY + 46, cx - halfW * 0.05, crownY + 40);
    ctx.quadraticCurveTo(cx + halfW * 0.5, crownY + 34, cx + halfW * 0.92, crownY + 30);
    ctx.quadraticCurveTo(cx + halfW * 0.5, crownY + 18, cx, crownY + 20);
    ctx.quadraticCurveTo(cx - halfW * 0.5, crownY + 18, cx - halfW * 0.9, crownY + 32);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, crownY + 16, 0, crownY + 46);
    g.addColorStop(0, mix(hair.light, hair.base, 0.25)); g.addColorStop(1, mix(hair.base, hair.shadow, 0.4));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    strands(5, crownY + 26, crownY + 52, halfW, 0.5);
  }
  ctx.restore();
}

function paintBeard(ctx: CanvasRenderingContext2D, hair: Tone, cx: number, halfW: number, eyeY: number, headH: number, shoulderY: number) {
  const mouthY = eyeY + headH * 0.27;
  ctx.save();
  // full dwarven beard flowing down over the chest
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.86, eyeY + 26);
  ctx.quadraticCurveTo(cx - halfW * 0.95, mouthY + 30, cx - halfW * 0.5, shoulderY + 96);
  ctx.quadraticCurveTo(cx, shoulderY + 122, cx + halfW * 0.5, shoulderY + 96);
  ctx.quadraticCurveTo(cx + halfW * 0.95, mouthY + 30, cx + halfW * 0.86, eyeY + 26);
  ctx.quadraticCurveTo(cx, eyeY + 44, cx - halfW * 0.86, eyeY + 26);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - halfW, eyeY + 20, cx + halfW * 0.7, shoulderY + 110);
  g.addColorStop(0, mix(hair.light, hair.base, 0.3)); g.addColorStop(0.45, hair.base); g.addColorStop(1, mix(hair.base, hair.shadow, 0.6));
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  // woven strands
  ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const x = cx + (i % 20 - 10) * halfW * 0.09;
    const y0 = eyeY + 30 + (i * 7) % 30;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + ((i * 13) % 17) - 8, (y0 + shoulderY) / 2, x + ((i * 29) % 21) - 10, shoulderY + 90 + (i % 3) * 10);
    ctx.strokeStyle = fade(i % 3 === 0 ? hair.light : i % 3 === 1 ? hair.base : hair.shadow, 0.3);
    ctx.lineWidth = 2 + (i % 3);
    ctx.stroke();
  }
  ctx.restore();
  // mustache over the mouth
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.34, mouthY - 2);
  ctx.quadraticCurveTo(cx - halfW * 0.5, mouthY + 12, cx - halfW * 0.62, mouthY + 20);
  ctx.quadraticCurveTo(cx - halfW * 0.3, mouthY + 14, cx, mouthY + 6);
  ctx.quadraticCurveTo(cx + halfW * 0.3, mouthY + 14, cx + halfW * 0.62, mouthY + 20);
  ctx.quadraticCurveTo(cx + halfW * 0.5, mouthY + 12, cx + halfW * 0.34, mouthY - 2);
  ctx.closePath();
  ctx.fillStyle = mix(hair.base, hair.shadow, 0.25); ctx.fill();
  ctx.restore();
}

function paintFaceDecor(ctx: CanvasRenderingContext2D, decor: FaceDecor, rng: () => number, cx: number, halfW: number, eyeY: number, headH: number, cls: string) {
  if (decor === 'none') return;
  ctx.save();
  if (decor === 'scars') {
    // pale scar tissue — light ridge with a dark seam
    const scar = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.strokeStyle = 'rgba(10,6,5,0.55)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + 1.6, y0 - 1.6); ctx.lineTo(x1 + 1.6, y1 - 1.6);
      ctx.strokeStyle = 'rgba(235,215,190,0.4)'; ctx.lineWidth = 1.3; ctx.stroke();
    };
    scar(cx - halfW * 0.5, eyeY - 26, cx - halfW * 0.18, eyeY + 26);          // over the brow, down the cheek
    scar(cx + halfW * 0.3, eyeY + headH * 0.1, cx + halfW * 0.52, eyeY + headH * 0.22);
    if (cls === 'Fighter' || rng() < 0.6) scar(cx + halfW * 0.12, eyeY - 18, cx + halfW * 0.34, eyeY - 6);
  } else if (decor === 'runes') {
    // ember-lit glyph strokes on the cheekbone
    const glyph = (x: number, y: number, r: number) => {
      const pts = 3 + Math.floor(rng() * 3);
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = rng() * Math.PI * 2, rr = r * (0.5 + rng() * 0.5);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(255,176,96,0.85)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'miter';
      ctx.shadowColor = '#ff9a3d'; ctx.shadowBlur = 7; ctx.stroke();
    };
    glyph(cx - halfW * 0.5, eyeY + 22, 7);
    glyph(cx - halfW * 0.34, eyeY + 34, 5);
    glyph(cx + halfW * 0.42, eyeY + headH * 0.14, 6);
    glyph(cx + halfW * 0.1, eyeY - 34, 5);
  } else if (decor === 'warpaint') {
    // two bold strokes slashed across the eyes
    const bar = (y: number, h: number, a: number, color: string) => {
      ctx.save();
      ctx.translate(cx, y); ctx.rotate(-0.06);
      ctx.beginPath();
      ctx.moveTo(-halfW * 1.1, -h / 2); ctx.lineTo(halfW * 1.1, -h / 2);
      ctx.lineTo(halfW * 1.05, h / 2); ctx.lineTo(-halfW * 1.15, h / 2);
      ctx.closePath();
      ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fill();
      ctx.restore();
    };
    const color = cls === 'Cleric' ? '#8a6a1f' : cls === 'Barbarian' ? '#7a1f1f' : '#7a1f1f';
    bar(eyeY - 2, 10, 0.5, color);
    bar(eyeY + 16, 7, 0.34, color);
  } else if (decor === 'freckles') {
    // stippled freckles across nose and cheekbones
    ctx.fillStyle = 'rgba(78, 42, 22, 0.42)';
    for (let i = 0; i < 45; i++) {
      const rx = cx + (rng() * 2 - 1) * halfW * 0.55;
      const ry = eyeY + 12 + (rng() * 2 - 1) * 14;
      ctx.beginPath();
      ctx.arc(rx, ry, 0.9 + rng() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (decor === 'skull') {
    // ash bone paint around eyes and jaw
    ctx.fillStyle = 'rgba(230, 225, 215, 0.55)';
    ctx.beginPath();
    ctx.arc(cx - halfW * 0.4, eyeY, halfW * 0.28, 0, Math.PI * 2);
    ctx.arc(cx + halfW * 0.4, eyeY, halfW * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 16, 14, 0.7)';
    ctx.lineWidth = 2.4;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 8, eyeY + headH * 0.28 - 6);
      ctx.lineTo(cx + i * 8, eyeY + headH * 0.28 + 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintClassHint(ctx: CanvasRenderingContext2D, rng: () => number, cls: string,
                        cx: number, crownY: number, halfW: number, shoulderHalf: number, shoulderY: number,
                        eye: { glow: string }, cloak: Tone) {
  ctx.save();
  if (cls === 'Fighter') {
    // steel pauldron on the lit shoulder + gold trim
    const px = cx - shoulderHalf * 0.72, py = shoulderY - 6;
    ctx.beginPath();
    ctx.moveTo(px - 58, py + 58);
    ctx.quadraticCurveTo(px - 66, py - 6, px - 10, py - 18);
    ctx.quadraticCurveTo(px + 42, py - 10, px + 50, py + 44);
    ctx.quadraticCurveTo(px - 6, py + 66, px - 58, py + 58);
    ctx.closePath();
    const g = ctx.createLinearGradient(px - 60, py - 18, px + 44, py + 60);
    g.addColorStop(0, '#8b8f97'); g.addColorStop(0.5, '#4c4f56'); g.addColorStop(1, '#23252a');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(230,199,102,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 4; i++) { // rivets
      ctx.beginPath(); ctx.arc(px - 40 + i * 24, py + 12 + Math.sin(i) * 8, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230,199,102,0.55)'; ctx.fill();
    }
  } else if (cls === 'Wizard') {
    // floating ember motes
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 9; i++) {
      const x = cx + (rng() * 2 - 1) * halfW * 2.4, y = crownY - 40 + rng() * 260;
      if (Math.abs(x - cx) < halfW * 1.05 && y > crownY && y < crownY + halfW * 2) continue; // keep off the face
      const r = 1.2 + rng() * 2.4;
      ctx.shadowColor = '#ffb45e'; ctx.shadowBlur = 9;
      ctx.fillStyle = `rgba(255,190,110,${0.5 + rng() * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (cls === 'Sorcerer') {
    // rising ember sparks
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 14; i++) {
      const x = cx + (rng() * 2 - 1) * halfW * 2.6, y = 620 - rng() * 380;
      if (Math.abs(x - cx) < halfW * 1.15 && y > crownY - 20 && y < crownY + halfW * 2.2) continue;
      const len = 6 + rng() * 14;
      const g = ctx.createLinearGradient(x, y, x, y - len);
      g.addColorStop(0, 'rgba(255,150,60,0)'); g.addColorStop(1, `rgba(255,190,110,${0.35 + rng() * 0.4})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() * 6 - 3), y - len); ctx.stroke();
    }
  } else if (cls === 'Warlock') {
    // violet smoke curling up from the frame floor
    for (let i = 0; i < 5; i++) {
      const x = cx + (rng() * 2 - 1) * shoulderHalf;
      const y = 600 - rng() * 60;
      const r = 50 + rng() * 80;
      const g = ctx.createRadialGradient(x, y, 4, x, y, r);
      g.addColorStop(0, 'rgba(88,52,110,0.12)'); g.addColorStop(1, 'rgba(88,52,110,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    void eye; void cloak;
  }
  ctx.restore();
}

function paintBrushStrokes(ctx: CanvasRenderingContext2D, rng: () => number, cx: number, crownY: number, shoulderY: number, shoulderHalf: number) {
  // the "oil paint" pass: short strokes following the light, overlay-blended
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.lineCap = 'round';
  const N = 850;
  for (let i = 0; i < N; i++) {
    // bias strokes onto the figure
    const t = rng();
    let x: number, y: number, ang: number, len: number;
    if (t < 0.55) { // face region
      x = cx + (rng() * 2 - 1) * 72; y = crownY + rng() * 210;
      ang = Math.PI / 2 + (rng() - 0.5) * 0.9;            // downward along the form
    } else {        // cloak region
      x = cx + (rng() * 2 - 1) * shoulderHalf;
      y = shoulderY - 10 + rng() * (640 - shoulderY);
      ang = Math.PI / 2 + (rng() - 0.5) * 0.5 + (x < cx ? -0.5 : 0.5);
    }
    len = 7 + rng() * 15;
    const light = rng() < 0.5;
    const warm = rng() < 0.35;
    ctx.strokeStyle = light
      ? `rgba(${warm ? '255' : '240'},${warm ? '220' : '236'},${warm ? '180' : '225'},${0.025 + rng() * 0.045})`
      : `rgba(10,8,${warm ? 10 : 14},${0.03 + rng() * 0.05})`;
    ctx.lineWidth = 1.6 + rng() * 3.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (rng() - 0.5) * 5, y + Math.sin(ang) * len * 0.5,
                         x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function paintGrain(ctx: CanvasRenderingContext2D, rng: () => number, w: number, h: number) {
  // film grain — two seeded speckle passes at different densities
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const n = (w * h) / 90;
  for (let i = 0; i < n; i++) {
    const v = rng();
    ctx.fillStyle = v < 0.5
      ? `rgba(255,250,240,${0.02 + v * 0.05})`
      : `rgba(8,6,10,${0.02 + (v - 0.5) * 0.06})`;
    ctx.fillRect(rng() * w, rng() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function paintVignette(ctx: CanvasRenderingContext2D, cls: string, w: number, h: number) {
  ctx.save();
  const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.28, w / 2, h * 0.46, h * 0.82);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.75, cls === 'Warlock' ? 'rgba(6,3,10,0.34)' : 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0.66)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // floor shadow anchoring the bust
  const f = ctx.createLinearGradient(0, h - 140, 0, h);
  f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = f; ctx.fillRect(0, h - 140, w, 140);
  ctx.restore();
}

function paintRimLight(ctx: CanvasRenderingContext2D, facePath: Path2D, cx: number, crownY: number, halfW: number, cls: string) {
  // warm rim light tracing the lit side of the face — the chiaroscuro signature
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = cls === 'Cleric' ? 'rgba(240,214,150,0.5)' : 'rgba(235,190,130,0.38)';
  ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - halfW * 0.7, crownY - 8);
  ctx.bezierCurveTo(cx - halfW * 0.95, crownY + 8, cx - halfW * 0.96, crownY + 42, cx - halfW * 0.86, crownY + 72);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(235,190,130,0.2)';
  ctx.lineWidth = 5;
  ctx.stroke(facePath);
  ctx.restore();
}
