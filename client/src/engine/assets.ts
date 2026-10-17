// engine/assets.ts — cooked-kit asset library (Wave 1 asset pipeline client).
//
// Loads gltfpack-processed kit bundles from /assets/*.glb (meshopt-compressed
// geometry + KTX2/BasisU textures — see tools/cook_wave1.mjs) and registers
// every top-level model as a single merged geometry with one material group
// per source part. Models are instanced through InstancedMesh, shared across
// every region, so their geometries are tagged `arShared` and TileGrid
// teardown skips disposal (the library owns them for the session).
//
// gltfpack ships vertex data interleaved and quantized (EXT_meshopt_compression
// + KHR_mesh_quantization); GLTFLoader defers dequantization to the GPU. Any
// CPU-side math on the raw arrays (applyMatrix4 / mergeGeometries) would
// truncate u16 positions and wrap negatives — which used to shred every kit
// model into map-spanning triangles. densifyGeometry() converts all attributes
// to dense Float32 (normalized semantics applied) before we bake transforms.
//
// Fetch starts at main.ts (primeAssets) — long before the engine boots — and
// parsing happens once a renderer exists (KTX2Loader.detectSupport needs one).
// Builders that want assets call whenAssetsReady(); the callback receives a
// liveness guarantee only if it re-checks group.parent itself.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TileGrid } from './TileGrid';
import { hash2 } from './materials';

export interface AssetModel {
  geometry: THREE.BufferGeometry;   // merged parts, one group per part
  materials: THREE.Material[];      // group-aligned
  height: number;                   // natural height in source units, base at y=0
}

export interface AssetInstance {
  x: number; y: number; z: number;
  s?: number;                               // size multiplier on the normalized model
  ry?: number; rx?: number; rz?: number;    // rotation (radians)
  quat?: THREE.Quaternion;                  // full orientation (terrain-normal alignment for
                                            // ground clutter) — overrides rx/ry/rz when set
  tint?: [number, number, number];          // per-instance color multiplier
  // ScatterItem compatibility — r/g/b carry the tint instead
  r?: number; g?: number; b?: number;
}

export interface AssetPlaceOpts {
  height?: number;        // normalize model height to this many world units
  sink?: number;          // units below the given y (× s) — trunk flare seating
  castShadow?: boolean;
  receiveShadow?: boolean;
  group?: THREE.Object3D; // target group. Builders MUST pass the region group
                          // captured at build time here — grid.group mutates as
                          // regions stream, so a deferred emit that reaches for
                          // grid.group lands every instance inside whatever
                          // region happened to build last (the origin-cluster
                          // bug). Omitting it falls back to grid.group.
}

const KITS = ['foliage', 'nature', 'rocks'] as const;

// ── state machine: fetch → (renderer arrives) → parse → ready ───────────────
const buffers = new Map<string, ArrayBuffer>();     // kit -> glb bytes (empty buffer = fetch failed)
let renderer: THREE.WebGLRenderer | null = null;
let parseStarted = false;
let parsed = false;
const registry = new Map<string, AssetModel>();
const pending: Array<() => void> = [];

export function assetsReady(): boolean { return parsed; }

export function whenAssetsReady(cb: () => void): void {
  if (parsed) cb();
  else pending.push(cb);
}

let readyPromise: Promise<void> | null = null;
export function assetsReadyPromise(): Promise<void> {
  if (!readyPromise) readyPromise = new Promise<void>((res) => whenAssetsReady(res));
  return readyPromise;
}

export function getAssetModel(name: string): AssetModel | undefined {
  return registry.get(name);
}

/** Start fetching kit bundles — call once from main.ts, as early as possible. */
export function primeAssets(): void {
  if (buffers.size) return;
  for (const kit of KITS) {
    fetch(`/assets/${kit}.glb`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then((ab) => { buffers.set(kit, ab); tryParse(); })
      .catch((err) => {
        console.error(`[assets] ${kit}.glb fetch failed — kit disabled`, err);
        buffers.set(kit, new ArrayBuffer(0)); // unblock the state machine, kit stays empty
        tryParse();
      });
  }
}

/** Engine hook — KTX2 decoding support must be probed against the renderer. */
export function setAssetRenderer(r: THREE.WebGLRenderer): void {
  if (renderer) return;
  renderer = r;
  tryParse();
}

function tryParse(): void {
  if (parseStarted || !renderer) return;
  if (!KITS.every((k) => buffers.has(k))) return; // wait for every kit (or its failure)
  parseStarted = true;
  const ktx2 = new KTX2Loader().setTranscoderPath('/assets/vendor/basis/').detectSupport(renderer);
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const jobs = KITS.filter((k) => (buffers.get(k) as ArrayBuffer).byteLength > 0).map(
    (k) =>
      new Promise<void>((res) => {
        loader.parse(buffers.get(k) as ArrayBuffer, '/assets/', (gltf) => {
          try { registerKit(gltf.scene); } catch (e) { console.error('[assets] register failed', k, e); }
          res();
        }, (err) => { console.error('[assets] parse failed', k, err); res(); });
      }),
  );
  void Promise.all(jobs).then(() => {
    parsed = true;
    console.log(`[assets] ${registry.size} models registered from ${KITS.join(' + ')}`);
    for (const cb of pending.splice(0)) cb();
  });
}

// ── registration ────────────────────────────────────────────────────────────
function registerKit(scene: THREE.Object3D): void {
  scene.updateMatrixWorld(true);
  const inv = new THREE.Matrix4();
  for (const wrapper of scene.children) {
    const name = wrapper.name;
    if (!name) continue;
    const parts: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    wrapper.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh || !mesh.geometry) return;
      const geo = mesh.geometry.clone();
      densifyGeometry(geo); // de-interleave + dequantize → dense Float32 (see header)
      inv.copy(wrapper.matrixWorld).invert().multiply(mesh.matrixWorld);
      geo.applyMatrix4(inv); // safe now: dense float32, node dequant folded in
      parts.push(geo);
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      materials.push(mat);
    });
    if (!parts.length) continue;
    // Presentation guard for foliage cards: alpha-tested materials are leaf
    // planes that must read from both sides, and the cutout must never be
    // dropped by a material-path refactor. Bark/trunk materials (alphaTest 0)
    // keep their authored shading untouched.
    for (const mat of materials) {
      if (mat.alphaTest > 0) mat.side = THREE.DoubleSide;
    }
    const merged = harmonizeAndMerge(parts);
    if (!merged) continue;
    merged.computeBoundingBox();
    const bb = merged.boundingBox!;
    merged.translate(0, -bb.min.y, 0);          // ground the model: base at y=0
    const height = Math.max(0.001, bb.max.y - bb.min.y);
    merged.userData.arShared = true;            // TileGrid teardown must not dispose
    merged.computeBoundingSphere();
    registry.set(name, { geometry: merged, materials, height });
  }
}

/**
 * gltfpack (-cc) interleaves and quantizes vertex attributes: positions as
 * u16 fixed-point, normals as snorm i8 octahedral, uvs as unorm u16. GLTFLoader
 * keeps those raw arrays and lets the GPU dequantize via node transforms and
 * normalized reads. We bake node transforms on the CPU (to merge parts), so we
 * must first flatten every attribute into a dense Float32 array with the
 * normalized semantics the GPU would apply — otherwise applyMatrix4 writes
 * its results back into integer arrays, truncating and wrapping values into
 * map-spanning garbage.
 */
function densifyGeometry(geo: THREE.BufferGeometry): void {
  for (const key of Object.keys(geo.attributes)) {
    const src = geo.getAttribute(key);
    const itemSize = src.itemSize;
    const count = src.count;
    const out = new Float32Array(count * itemSize);
    const inter = src as THREE.InterleavedBufferAttribute;
    if (inter.isInterleavedBufferAttribute) {
      // de-interleave: shared buffer, per-attribute offset + stride (elements)
      const buf = inter.data;
      const arr = buf.array as ArrayLike<number>;
      const { denom, snorm } = normSemantics(arr, src.normalized);
      for (let i = 0; i < count; i++) {
        const base = inter.offset + i * buf.stride;
        for (let c = 0; c < itemSize; c++) {
          const v = arr[base + c] / denom;
          out[i * itemSize + c] = snorm ? Math.max(v, -1) : v;
        }
      }
    } else {
      const arr = (src as THREE.BufferAttribute).array as ArrayLike<number>;
      const { denom, snorm } = normSemantics(arr, src.normalized);
      const n = count * itemSize;
      for (let i = 0; i < n; i++) {
        const v = arr[i] / denom;
        out[i] = snorm ? Math.max(v, -1) : v;
      }
    }
    geo.setAttribute(key, new THREE.BufferAttribute(out, itemSize));
  }
}

/** WebGL normalized-read semantics: unorm → raw/denom, snorm → max(raw/denom, -1). */
function normSemantics(arr: ArrayLike<number>, normalized: boolean): { denom: number; snorm: boolean } {
  if (!normalized) return { denom: 1, snorm: false };
  const c = arr.constructor;
  const snorm = c === Int8Array || c === Int16Array;
  const denom = c === Int8Array ? 127 : c === Uint8Array ? 255 : c === Int16Array ? 32767 : c === Uint32Array ? 4294967295 : 65535;
  return { denom, snorm };
}

/** Force a uniform attribute set across parts, then merge with material groups. */
function harmonizeAndMerge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  const keep = ['position', 'normal', 'uv'];
  if (parts.every((p) => p.getAttribute('color'))) keep.push('color');
  for (const p of parts) {
    for (const key of Object.keys(p.attributes)) {
      if (!keep.includes(key)) p.deleteAttribute(key);
    }
    if (!p.getAttribute('normal')) p.computeVertexNormals();
  }
  const indexed = parts.every((p) => p.index);
  const unindexed = parts.every((p) => !p.index);
  let geos = parts;
  if (!indexed && !unindexed) geos = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(geos, true);
  if (!merged) { console.error('[assets] merge failed for', parts.length, 'parts'); return null; }
  return merged;
}

// ── instancing ──────────────────────────────────────────────────────────────
function tintOf(it: AssetInstance): [number, number, number] {
  if (it.tint) return it.tint;
  if (it.r !== undefined && it.g !== undefined && it.b !== undefined) return [it.r, it.g, it.b];
  return [1, 1, 1];
}

/** Synchronously finish every fresh shader program's background link by
 *  building its uniform cache NOW. Measured on-device: a program's first
 *  getUniforms() while its ANGLE/D3D link is still in flight blocks the
 *  main thread 100-400ms (ACTIVE_UNIFORMS/LINK_STATUS force the driver to
 *  finish), and region streaming used to drop dozens of programs into the
 *  render loop — 2-7s freezes. Callers move the wait into build/emit tasks.
 *  Shared flag with the Engine's warmer. */
export function warmShaderPrograms(renderer: THREE.WebGLRenderer): void {
  const progs = renderer.info.programs as unknown as Array<{ __arWarm?: boolean; getUniforms?: () => void }>;
  for (const p of progs) {
    if (!p || p.__arWarm) continue;
    p.__arWarm = true;
    try { if (p.getUniforms) p.getUniforms(); } catch { /* diagnostics only */ }
  }
}

/** Acquire every GPU program variant `obj`'s materials need — in BOTH output
 *  color spaces — and reveal `obj` only once every issued link reports
 *  complete (KHR_parallel_shader_compile). three keys one program PER
 *  OUTPUT COLOR SPACE: a compile() outside the composer only warms the sRGB
 *  (screen) variants, so the first draw inside any composer pass (linear
 *  sRGB render targets) still hit an unlinked program and froze the frame
 *  100-400ms on the driver link (GL-spy-verified: every slow
 *  getProgramParameter sat in new WebGLUniforms under renderBufferDirect
 *  with srgb-linear keys). We bind the composer's render target while
 *  compiling the linear variants, then poll isReady() — the driver links in
 *  the background, no frame ever waits, and `obj` simply pops in when the
 *  GPU is done. */
export function acquireProgramsAsync(
  eng: { renderer: THREE.WebGLRenderer; camera: THREE.Camera; scene: THREE.Scene; composer: { renderTarget1: THREE.WebGLRenderTarget } | null },
  obj: THREE.Object3D,
): void {
  const renderer = eng.renderer;
  const seen = new Set<unknown>(renderer.info.programs as unknown as unknown[]);
  obj.visible = false;
  const issue = () => {
    // compile() gathers LIGHTS via targetScene.traverseVisible — if obj (or
    // the scene holding the lights) is hidden for the gate, the programs get
    // acquired with zero lights and every draw re-acquires them cold. Make
    // obj visible for the synchronous compile window (no rAF can interleave
    // inside this task), then hide it again before the next frame.
    const wasVisible = obj.visible;
    obj.visible = true;
    try {
      if (eng.composer) {
        renderer.setRenderTarget(eng.composer.renderTarget1);
        renderer.compile(obj, eng.camera, eng.scene);
        renderer.setRenderTarget(null);
      }
      renderer.compile(obj, eng.camera, eng.scene);
    } catch { /* diagnostics only */ }
    obj.visible = wasVisible;
  };
  const allReady = () => {
    const progs = renderer.info.programs as unknown as Array<{ isReady?: () => boolean }>;
    for (const p of progs) {
      if (seen.has(p)) continue;
      if (p && typeof p.isReady === 'function' && !p.isReady()) return false;
    }
    return true;
  };
  const poll = () => {
    let ready = true;
    try { ready = allReady(); } catch { ready = true; } // fail-open: never leave a scene hidden
    if (ready) { obj.visible = true; return; }
    requestAnimationFrame(poll);
  };
  issue();
  poll();
}

/** Instance one named model. Returns false when the model is not registered. */
export function instanceAsset(
  grid: TileGrid, name: string, items: AssetInstance[], opts: AssetPlaceOpts = {},
): boolean {
  const model = registry.get(name);
  if (!model || !items.length) return !model ? false : true;
  const norm = opts.height ? opts.height / model.height : 1;
  if (!Number.isFinite(norm) || norm <= 0 || norm > 1e5) {
    console.error(`[assets] ${name}: degenerate normalization (height ${model.height}) — skipped`);
    return false;
  }
  const mesh = new THREE.InstancedMesh(model.geometry, model.materials, items.length);
  // Tag alpha-cutout meshes for the GTAO pass: its MeshNormalMaterial G-buffer
  // override ignores alphaTest, so untagged card meshes write full solid quads
  // into the AO depth buffer (translucent gray slabs over distant canopies).
  mesh.userData.arAlphaCards = model.materials.some((m) => m.alphaTest > 0);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    const s = norm * (it.s ?? 1);
    d.position.set(it.x, it.y - (opts.sink ?? 0) * s, it.z);
    if (it.quat) d.quaternion.copy(it.quat);
    else d.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
    d.scale.setScalar(s);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    const t = tintOf(it);
    col.setRGB(t[0], t[1], t[2]);
    mesh.setColorAt(i, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = opts.castShadow ?? !grid.eng.lowgfx;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  (opts.group ?? grid.group).add(mesh);
  // First-draw stall guard: acquire this mesh's GPU program variants (BOTH
  // output color spaces — see acquireProgramsAsync) and reveal the mesh only
  // once every issued link reports complete. Covers kit meshes emitted after
  // the GLB parse (whenAssetsReady) that attach to already-visible regions.
  // Kit materials are shared per model, so after a model's first instance
  // this resolves almost instantly.
  const eng = grid.eng;
  if (!eng.lowgfx && typeof eng.renderer.compile === 'function') {
    acquireProgramsAsync(eng, mesh);
  }
  return true;
}

/**
 * Scatter a pool of variant models across items — per-item pick is a
 * deterministic position hash, so a given spot always grows the same model.
 * Returns false when none of the pool is registered (caller may fall back).
 */
export function scatterAsset(
  grid: TileGrid, names: string[], items: AssetInstance[], opts: AssetPlaceOpts = {}, salt = 0,
): boolean {
  if (!items.length || !names.length) return true;
  const groups = new Map<string, AssetInstance[]>();
  for (const it of items) {
    const pick = names[Math.floor(hash2(Math.round(it.x * 4), Math.round(it.z * 4), 7000 + salt) * names.length) % names.length];
    const arr = groups.get(pick);
    if (arr) arr.push(it); else groups.set(pick, [it]);
  }
  let ok = false;
  for (const [name, arr] of groups) {
    if (instanceAsset(grid, name, arr, opts)) ok = true;
  }
  return ok;
}
