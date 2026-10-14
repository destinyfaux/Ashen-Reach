// grade.ts — display-referred color grade + vignette, applied as the final
// composer pass. The "LUT" is a real 32x32x32 3D lookup table built at boot
// from the grade math below (Elden Ring-style tone: muted saturation, cool
// slate shadows, warm amber highlights, gentle filmic contrast), uploaded as
// a 1024x32 strip DataTexture and sampled in the shader. Cost is one texture
// fetch + a handful of ALU ops per pixel — effectively free next to bloom.
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const LUT_N = 32;

// Display-referred grade for one color in [0,1]^3. The same math runs for
// every LUT entry, so what you see is exactly this function.
function gradeColor(r: number, g: number, b: number): [number, number, number] {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // 1) gentle filmic contrast (slight lift so blacks keep detail)
  let cr = (r - 0.5) * 1.07 + 0.502;
  let cg = (g - 0.5) * 1.07 + 0.5;
  let cb = (b - 0.5) * 1.07 + 0.498;
  // 2) muted saturation — the Lands Between never reads candy-colored
  const sat = 0.87;
  cr = lum + (cr - lum) * sat;
  cg = lum + (cg - lum) * sat;
  cb = lum + (cb - lum) * sat;
  // 3) split toning: cool slate-teal shadows, warm amber highlights
  const shadow = 1 - Math.min(1, Math.max(0, lum / 0.55));
  const high = Math.max(0, (lum - 0.5) / 0.5);
  cr += shadow * 0.020 + high * 0.045;
  cg += shadow * 0.026 + high * 0.032;
  cb += shadow * 0.038 + high * 0.012;
  // 4) a hair of extra green in the mids (mossy, weathered read)
  const mid = Math.max(0, 1 - Math.abs(lum - 0.45) / 0.45);
  cg += mid * 0.012;
  return [
    Math.max(0, Math.min(1, cr)),
    Math.max(0, Math.min(1, cg)),
    Math.max(0, Math.min(1, cb)),
  ];
}

// Strip layout: 1024x32 texture — tile index = RED, in-tile x = BLUE, y = GREEN.
// Data is row-major (y outer, then x), so we iterate green rows outermost,
// then red tiles, then blue inside the tile. This must match the shader's
// lutLookup(), which samples x = red*32 + blue, y = green.
function buildLutTexture(): THREE.DataTexture {
  const data = new Uint8Array(LUT_N * LUT_N * LUT_N * 4);
  let i = 0;
  for (let gy = 0; gy < LUT_N; gy++) {
    for (let r = 0; r < LUT_N; r++) {
      for (let bx = 0; bx < LUT_N; bx++) {
        const [cr, cg, cb] = gradeColor(
          r / (LUT_N - 1), gy / (LUT_N - 1), bx / (LUT_N - 1));
        data[i++] = Math.round(cr * 255);
        data[i++] = Math.round(cg * 255);
        data[i++] = Math.round(cb * 255);
        data[i++] = 255;
      }
    }
  }
  const tex = new THREE.DataTexture(data, LUT_N * LUT_N, LUT_N, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uLut: { value: null as THREE.Texture | null },
    uStrength: { value: 1.0 },   // 0 = bypass grade, 1 = full LUT
    uVignette: { value: 0.34 },  // subtle corner falloff, Elden Ring framing
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D uLut;
    uniform float uStrength;
    uniform float uVignette;
    varying vec2 vUv;

    // Trilinear-ish lookup in the 32^3 LUT strip: red picks the tile, blue is
    // interpolated inside the tile by hand (two taps), green by row blending.
    vec3 lutLookup(vec3 c) {
      const float n = 32.0;
      c = clamp(c, 0.0, 1.0);
      float rI = c.r * (n - 1.0);
      float tile = floor(rI);
      float f = rI - tile;
      float gI = c.g * (n - 1.0);
      float bI = c.b * (n - 1.0);
      float x0 = tile * n + bI + 0.5;
      float x1 = min((tile + 1.0) * n + bI + 0.5, n * n - 0.5);
      vec2 uv0 = vec2(x0 / (n * n), (gI + 0.5) / n);
      vec2 uv1 = vec2(x1 / (n * n), (gI + 0.5) / n);
      vec3 s0 = texture2D(uLut, uv0).rgb;
      vec3 s1 = texture2D(uLut, uv1).rgb;
      return mix(s0, s1, f);
    }

    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      vec3 graded = lutLookup(src.rgb);
      graded = mix(src.rgb, graded, uStrength);
      vec2 q = vUv - 0.5;
      graded *= 1.0 - dot(q, q) * uVignette;
      gl_FragColor = vec4(graded, src.a);
    }`,
};

export function createGradePass(): ShaderPass {
  const pass = new ShaderPass(GradeShader);
  pass.uniforms.uLut.value = buildLutTexture();
  return pass;
}