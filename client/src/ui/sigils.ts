// ui/sigils.ts — inline SVG icon + sigil vocabulary. NO emoji anywhere in
// the HUD; every glyph is a stroked SVG path in a 0 0 100 100 box using
// currentColor, so CSS tints per context. Path data is also consumed by the
// canvas portrait painter (Path2D) — keep shapes path-only (no <circle> etc).

export interface SigilDef { id: string; name: string; title: string; desc: string; accent: string; path: string; }

// ── the four wanderer archetypes ───────────────────────────────────────────
export const SIGILS: Record<string, SigilDef> = {
  warden: {
    id: 'warden', name: 'warden', title: 'Warden', accent: '#b8952f',
    desc: 'Bulwark of the last gate. Sword and oath.',
    path: 'M50 8 L84 22 V50 C84 71 69 85 50 93 C31 85 16 71 16 50 V22 Z M50 26 V60 M40 60 H60 M50 60 V72 M50 78 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'
  },
  shadowdancer: {
    id: 'shadowdancer', name: 'shadowdancer', title: 'Shadowdancer', accent: '#5a7a8c',
    desc: 'A whisper in the dark. Blade and venom.',
    path: 'M66 14 A38 38 0 1 0 66 86 A30 30 0 1 1 66 14 Z M26 84 L54 56 M48 50 L60 62'
  },
  ashen_mage: {
    id: 'ashen_mage', name: 'ashen_mage', title: 'Ashen Mage', accent: '#c96a2b',
    desc: 'Ember-bound scholar of the burning word.',
    path: 'M50 8 C60 24 76 34 76 56 C76 75 64 90 50 90 C36 90 24 75 24 56 C24 42 33 36 37 26 C40 36 46 40 46 40 C41 25 45 15 50 8 Z M50 80 C44 80 40 74 40 67 C40 61 45 58 50 53 C55 58 60 61 60 67 C60 74 56 80 50 80 Z'
  },
  pale_priest: {
    id: 'pale_priest', name: 'pale_priest', title: 'Pale Priest', accent: '#9db8a6',
    desc: 'Keeper of the last light. Mercy and ruin.',
    path: 'M50 12 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M50 24 V84 M30 44 H70 M38 84 H62 M26 20 L18 12 M74 20 L82 12'
  }
};

export const ARCH_ORDER: string[] = ['warden', 'shadowdancer', 'ashen_mage', 'pale_priest'];

// ── UI glyphs (stroke paths, 0 0 100 100) ──────────────────────────────────
export const ICONS: Record<string, string> = {
  crown: 'M22 76 H78 L72 42 L59 56 L50 30 L41 56 L28 42 Z M50 66 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0',
  d20: 'M50 6 L88 50 L50 94 L12 50 Z M50 24 L70 50 L50 76 L30 50 Z M50 24 V6 M70 50 H88 M50 76 V94 M30 50 H12',
  send: 'M14 10 L86 50 L14 90 L30 50 Z',
  x: 'M28 28 L72 72 M72 28 L28 72',
  droplet: 'M50 12 C62 32 74 44 74 60 A24 24 0 1 1 26 60 C26 44 38 32 50 12 Z',
  shield: 'M50 10 L78 21 V46 C78 63 66 75 50 82 C34 75 22 63 22 46 V21 Z',
  moon: 'M62 14 A34 34 0 1 0 62 86 A27 27 0 1 1 62 14 Z',
  sun: 'M50 22 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M50 2 V9 M50 91 V98 M2 50 H9 M91 50 H98 M16 16 L21 21 M79 79 L84 84 M84 16 L79 21 M21 79 L16 84',
  rain: 'M25 52 A13 13 0 0 1 25 26 A17 17 0 0 1 57 20 A12 12 0 0 1 66 52 Z M38 62 L34 74 M52 62 L48 74 M64 62 L60 74',
  storm: 'M25 50 A13 13 0 0 1 25 24 A17 17 0 0 1 57 18 A12 12 0 0 1 66 50 Z M52 54 L40 74 H49 L43 92 L60 68 H50 L56 54 Z',
  fog: 'M20 32 Q35 26 50 32 T80 32 M20 50 Q35 44 50 50 T80 50 M20 68 Q35 62 50 68 T80 68',
  sparkle: 'M50 10 L56 44 L90 50 L56 56 L50 90 L44 56 L10 50 L44 44 Z',
  skull: 'M50 14 C30 14 20 28 20 42 C20 52 26 58 32 62 L32 74 H68 L68 62 C74 58 80 52 80 42 C80 28 70 14 50 14 Z M38 42 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M62 42 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 52 L46 60 H54 Z M42 74 V82 M50 74 V82 M58 74 V82',
  chat: 'M18 18 H82 A7 7 0 0 1 89 25 V56 A7 7 0 0 1 82 63 H47 L31 79 V63 H18 A7 7 0 0 1 11 56 V25 A7 7 0 0 1 18 18 Z M30 34 H70 M30 46 H56',
  link: 'M38 62 A16 16 0 0 1 38 39 L46 31 M62 38 A16 16 0 0 1 62 61 L54 69 M40 52 L60 44',
  sword: 'M70 12 L78 20 L44 54 L36 46 Z M34 48 L46 60 M26 56 L38 68 M30 72 L22 80',
  map: 'M16 22 L38 14 L62 22 L84 14 V78 L62 86 L38 78 L16 86 Z M38 14 V78 M62 22 V86',
  chevron: 'M30 36 L50 56 L70 36',
  ember: 'M50 16 C58 30 68 38 68 54 C68 68 60 78 50 78 C40 78 32 68 32 54 C32 44 38 40 40 32 C42 40 47 43 47 43 C44 32 46 23 50 16 Z',
  boot: 'M32 16 V48 C32 56 26 58 22 62 C18 66 20 72 26 74 L70 84 C76 85 80 82 80 76 C80 62 68 58 60 52 C54 47 52 40 52 16 Z',
  hourglass: 'M30 12 H70 M30 88 H70 M34 12 C34 34 46 40 46 50 C46 60 34 66 34 88 M66 12 C66 34 54 40 54 50 C54 60 66 66 66 88'
};

/** Wrap path data in a stroke-only SVG. */
export function svg(path: string, cls = '', size = 100): string {
  return `<svg class="${cls}" viewBox="0 0 100 100" fill="none" stroke="currentColor" ` +
    `stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}

export function icon(name: keyof typeof ICONS | string, cls = ''): string {
  return svg(ICONS[name] || ICONS.sparkle, cls);
}

export function sigilSvg(archetype: string, cls = ''): string {
  const s = SIGILS[archetype];
  return svg(s ? s.path : SIGILS.warden.path, cls);
}

export function weatherIcon(type: string): string {
  switch (type) {
    case 'rain': return icon('rain');
    case 'storm': return icon('storm');
    case 'fog': return icon('fog');
    default: return icon('sparkle');
  }
}

export function clockIcon(dayTime: number): string {
  const h = Math.floor((dayTime / 60) % 24);
  return (h >= 7 && h < 19) ? icon('sun') : icon('moon');
}
