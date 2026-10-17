// ASHENREACH engine root — owns renderer + module orchestration. Framework-free.
// World coordinates: 1 unit = 1 foot. One grid cell = 5 ft = 5 units.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createGradePass } from './grade';
import { World } from './World';
import { TileGrid } from './TileGrid';
import { Vision } from './Vision';
import { Actors } from './Actors';
import { CameraRig } from './CameraRig';
import { Controls } from './Controls';
import { Effects, DMG_TEXT_COLOR } from './Effects';
import { Bus, EV } from './bus';
import { useGame } from '../game/store';
import type { DoorState } from '../game/store';
import type { MapDef } from './types';
import { playSfx, ELEMENT_SFX, setMusicScene } from '../audio/music';
import type { MusicScene } from '../audio/music';
import { resolveZoneMusic } from '../audio/zoneMusic';
import { setAssetRenderer } from './assets';
import { acquireProgramsAsync } from './assets';
import { worldProbe } from './worldProbe';
import type { GameStore } from '../game/store';

/** Region id scheme — mirrors server/src/maps/world.mjs regionId(). */
function regionIdOf(rx: number, rz: number): string {
  if (rx === 0 && rz === 0) return 'ashen_reach';
  const enc = (n: number) => (n < 0 ? 'm' + Math.abs(n) : String(n));
  return `w${enc(rx)}_${enc(rz)}`;
}

export class Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock = new THREE.Clock();

  world: World;
  grid: TileGrid;
  vision: Vision;
  actors: Actors;
  cameraRig: CameraRig;
  controls: Controls;
  effects: Effects;

  myTokenId: string | null = null;
  private raf = 0;
  private disposed = false;
  private lastEnv = { time: 21 * 60, weather: 'clear', mode: 'cycle' };
  private timeAccum = 0;
  private areaMusic: MusicScene = 'town';
  private currentMusicScene: MusicScene = 'town';
  private candidateMusicScene: MusicScene = 'town';
  private candidateMusicTimer = 0;
  private musicCheckTimer = 0;
  private victoryTimer = 0;
  private activeMapDef: MapDef | null = null;
  private doorOpenByWall = new Map<number, boolean>();
  private themeRegionId: string | null = null;   // atmosphere rebuild guard (streamed world)
  private worldEntered = false;                  // camera drop only on first overworld entry
  composer: EffectComposer | null = null;
  bloomPass: UnrealBloomPass | null = null;
  gtaoPass: GTAOPass | null = null;
  gradePass: ShaderPass | null = null;
  readonly lowgfx: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.lowgfx = /lowgfx=1/.test(location.search) ||
      (navigator.hardwareConcurrency || 8) <= 4;
    // ── renderer polish (T2-d): ACES filmic + PCFSoft + AA + pixelRatio cap 2.
    // Point lights use physically-correct distance² falloff (decay 2, set in
    // World per light). Shadow bias/normalBias are tuned on the lights in World.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lowgfx, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowgfx ? 1 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    setAssetRenderer(this.renderer); // cooked-kit assets (KTX2 support probe)
    // ANGLE/D3D: shader info-log queries (getProgramInfoLog / getShaderInfoLog /
    // LINK_STATUS) force a synchronous wait for the driver's background link.
    // three runs them for EVERY new program on first draw because
    // debug.checkShaderErrors defaults to true — profiler-measured as 2-7s
    // main-thread freezes at every region-ring crossing (sampled stacks:
    // WebGLProgram onFirstUse under setProgram/renderBufferDirect). Release
    // behavior: trust the shaders, never query the logs.
    this.renderer.debug.checkShaderErrors = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090c);
    this.scene.fog = new THREE.FogExp2(0x07090c, 0.010);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 900);
    this.camera.position.set(30, 11, 44); // under the indoor ceiling cap from frame one

    if (!this.lowgfx) {
      const renderPass = new RenderPass(this.scene, this.camera);
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.30, // strength: restrained halo — fires and emissives glow without washing the frame
        0.42, // radius: tight, soft blooming halo
        0.85  // threshold: only true highlights (sky, flames, spells) bloom
      );
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderPass);
      // cheap raytraced occlusion: GTAO ray-marches the depth buffer for
      // contact shadows — grounded, object-anchored shading at a modest cost
      this.gtaoPass = new GTAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
      this.gtaoPass.output = GTAOPass.OUTPUT.Default;
      // GTAO's G-buffer pre-pass renders the scene with a MeshNormalMaterial
      // override, which ignores alphaTest: every alpha-cutout card (tree/bush
      // foliage) writes a FULL solid quad into the AO depth buffer. The beauty
      // pass discards those texels, so GTAO ends up darkening sky/background
      // that shows through — distant canopies sprout translucent gray slabs
      // that stack into black geometric blocks. Hide alpha-card meshes for the
      // duration of the GTAO render only; real shadow maps keep foliage
      // grounded on the ground and canopy interiors stay lit by lights.
      {
        const gtaoAny = this.gtaoPass as unknown as { render: (...a: unknown[]) => void };
        const origGtaoRender = gtaoAny.render.bind(this.gtaoPass);
        const engine = this;
        gtaoAny.render = (...args: unknown[]) => {
          const hidden: THREE.Object3D[] = [];
          engine.scene.traverse((o) => {
            if (o.userData && o.userData.arAlphaCards && o.visible) { o.visible = false; hidden.push(o); }
          });
          try { origGtaoRender(...args); }
          finally { for (const o of hidden) o.visible = true; }
        };
      }
      this.composer.addPass(this.gtaoPass);
      this.composer.addPass(this.bloomPass);
      // r152+ materials skip tone mapping + sRGB for render targets; OutputPass
      // applies ACES + sRGB at the end of the chain (was silently missing)
      this.composer.addPass(new OutputPass());
      // display LUT grade (Elden Ring tone) + vignette, final pass
      this.gradePass = createGradePass();
      this.composer.addPass(this.gradePass);
    }

    this.world = new World(this);
    this.grid = new TileGrid(this);
    this.vision = new Vision(this);
    this.actors = new Actors(this);
    this.effects = new Effects(this);
    this.cameraRig = new CameraRig(this);
    this.controls = new Controls(this);

    this.wire();
    window.addEventListener('resize', this.onResize);
    // Boot-time program gate: hide the scene until the boot content's GPU
    // programs (sky dome, atmosphere, terrain defaults, hero rig base…) have
    // finished their background driver links in BOTH output color spaces
    // (see acquireProgramsAsync). The player is still at the character forge
    // during this window — nobody sees the world — and the first rendered
    // frame never blocks on a shader link. Regions and kit meshes gate
    // themselves the same way on arrival (TileGrid.addRegion / instanceAsset).
    if (!this.lowgfx && typeof this.renderer.compile === 'function') {
      acquireProgramsAsync(this, this.scene);
    }
    (window as any).__AR_ENGINE__ = this; // QA/diagnostic hook

    // ── program uniform-cache warmer ─────────────────────────────────────
    // The last freeze class, profiler-pinned three times: a program's FIRST
    // getUniforms() call builds WebGLUniforms, and its ACTIVE_UNIFORMS /
    // LINK_STATUS queries force ANGLE/D3D to finish the background shader
    // link synchronously (~100-300ms per program — 2-7s when a region burst
    // drops a dozen programs into one frame). Gates on regions/kit meshes
    // narrowed but never closed every first-draw path (deferred emits,
    // actors, equipment…). This warmer closes them all: after every frame,
    // any program whose async link has COMPLETED (isReady via
    // KHR_parallel_shader_compile) gets its uniform cache built right here —
    // cheap, because the link is already done — so no draw anywhere ever
    // runs the constructor against an in-flight link.
    const programs = this.renderer.info.programs as unknown as Array<{
      __arWarm?: boolean; isReady?: () => boolean; getUniforms?: () => unknown;
    }>;
    const warmPrograms = () => {
      try {
        for (const p of programs) {
          if (!p || p.__arWarm) continue;
          if (typeof p.isReady === 'function' && !p.isReady()) continue;
          p.__arWarm = true;
          if (typeof p.getUniforms === 'function') p.getUniforms();
        }
      } catch { /* diagnostics only — never break the frame */ }
    };
    const warmTimer = window.setInterval(warmPrograms, 80);
    window.addEventListener('beforeunload', () => window.clearInterval(warmTimer));
    const prevDispose = this.dispose.bind(this);
    this.dispose = () => { window.clearInterval(warmTimer); prevDispose(); };
  }

  private wire() {
    useGame.subscribe((state, previous) => {
      if (state.phase !== previous.phase) {
        if (state.phase !== 'playing') {
          setMusicScene('menu');
        } else {
          this.syncMusic(true);
        }
        return;
      }
      if (state.initiative !== previous.initiative) {
        if (previous.initiative && !state.initiative && state.phase === 'playing') {
          // Combat victory stinger
          this.victoryTimer = 12;
        } else if (state.initiative) {
          this.victoryTimer = 0;
        }
        this.syncMusic(true);
      }
    });
    // net → engine
    Bus.on(EV.MAP_LOAD, (map: MapDef) => {
      if (!map || !map.size || !map.cells) {
        // a null/failed payload would otherwise render as a silent black world
        console.warn('MAP_LOAD: map is null/missing — world geometry skipped');
        return;
      }
      this.doorOpenByWall.clear();
      useGame.getState().setInteract(null);
      this.loadMap(map);
    });
    Bus.on(EV.DOORS_SYNC, (doors: DoorState[]) => {
      if (!Array.isArray(doors)) return;
      for (const door of doors) {
        const previous = this.doorOpenByWall.get(door.wallIndex);
        if (previous !== undefined && previous !== door.open) playSfx('door');
        this.doorOpenByWall.set(door.wallIndex, door.open);
      }
      this.grid.syncDoorStates(doors);
    });
    Bus.on(EV.TOKENS_SYNC, (tokens: any[]) => {
      // bind BEFORE syncing — even if a token figure throws, controls + camera
      // stay bound (Actors.sync guards per-token, but belt and braces)
      const me = useGame.getState();
      this.myTokenId = me.myTokenId;
      this.controls.bindToken(this.myTokenId);
      this.cameraRig.follow(this.myTokenId);
      this.actors.sync(tokens);
      // reveal my monster list only when not hidden (server decides later; M0 shows all)
    });
    Bus.on(EV.ENV_SYNC, (env: any) => {
      if (env.dayNight) this.lastEnv.time = env.dayNight.time ?? this.lastEnv.time;
      if (env.dayNight?.mode) this.lastEnv.mode = env.dayNight.mode;
      if (env.weather?.type) this.lastEnv.weather = env.weather.type;
      this.world.setEnv(this.lastEnv);
    });
    Bus.on(EV.FX, (f: any) => {
      this.actors.playAction(f.actorId, f.action);
      const sounds: Record<string, string> = {
        lunge: 'attack', shoot: 'shoot', spell: 'spell', heal: 'heal',
        buff: 'buff', hit: 'hit', crit: 'crit', miss: 'miss', die: 'die',
      };
      const sound = sounds[f.action?.anim];
      if (sound) playSfx(sound);
      this.applyCombatJuice(f);
    });
    Bus.on(EV.SFX, (s: any) => { if (s?.name) playSfx(s.name, s.volume); });
    // P2.6: dice-tray audio — attack rolls clatter; nat 20/1 get fanfare stingers
    Bus.on(EV.ROLL, (r: any) => {
      const tag = String(r?.tag || '');
      if (/damage/i.test(tag)) return;               // damage rolls stay silent (impact sounds carry it)
      playSfx('dice');
      if (/attack/i.test(tag) && r?.nat === 20) playSfx('crit-success', 0.7);
      else if (/attack/i.test(tag) && r?.nat === 1) playSfx('crit-fail', 0.7);
    });
  }

  /** P2.6 combat juice: float damage/heal numbers + typed impact VFX from the
   *  fx:action result payload (server already broadcasts totals + types). */
  private applyCombatJuice(f: any) {
    const r = f?.result;
    if (!r) return;
    const targetId = f.action?.targetId || f.actorId;
    const shots: any[] = Array.isArray(r.attacks)
      ? r.attacks.map((s: any) => s?.damage).filter(Boolean)
      : (r.damage ? [r.damage] : []);
    let n = 0;
    for (const dmg of shots) {
      const total = Number(dmg?.total);
      if (!Number.isFinite(total) || total <= 0) continue;
      const anchor = this.actors.anchorWorld(targetId);
      if (!anchor) continue;
      anchor.x += (Math.random() - 0.5) * 2.4;                       // spread stacked numbers
      anchor.y += 0.4 + n * 0.7;
      n++;
      const kind = dmg.crit ? 'crit' : 'dmg';
      this.effects.floatText(anchor, String(Math.round(total)), kind, DMG_TEXT_COLOR[String(dmg.type || '').toLowerCase()]);
      this.effects.impact(anchor, String(dmg.type || ''));
      const elem = ELEMENT_SFX[String(dmg.type || '').toLowerCase()];
      if (elem) playSfx(elem, 0.8);
    }
    const heal = Number(r.healing?.total);
    if (Number.isFinite(heal) && heal > 0) {
      const anchor = this.actors.anchorWorld(targetId);
      if (anchor) {
        anchor.y += 0.4;
        this.effects.floatText(anchor, '+' + Math.round(heal), 'heal');
        this.effects.impact(anchor, 'healing');
      }
    }
    if (f.action?.anim === 'miss' && !shots.length) {
      const anchor = this.actors.anchorWorld(targetId);
      if (anchor) this.effects.floatText(anchor, 'miss', 'miss');
    }
  }

  loadMap(map: MapDef) {
    if (!map || !map.size || !map.cells) {
      console.warn('MAP_LOAD: map is null/missing');
      return;
    }
    if (map.region) {
      this.enterRegion(map);
      return;
    }
    // dungeon / single-map path (P3.3: unchanged)
    worldProbe.active = false;
    worldProbe.regions.length = 0;
    this.themeRegionId = null;
    this.doorOpenByWall.clear();
    this.grid.build(map);
    this.actors.clearAll();
    this.world.onMapTheme(map);
    this.activeMapDef = map;
    this.syncMusic(true);
    this.controls.bindToken(this.myTokenId);
    // drop camera at party spawn for the join backdrop (indoor-safe height)
    const sp = map.spawns.party[0];
    this.camera.position.set(sp[0] * 5 + 10, 10.5, sp[1] * 5 + 16);
    this.camera.lookAt(sp[0] * 5, 4, sp[1] * 5);
  }

  /** P3.3 streamed world: add (or refocus) an overworld region. Regions build
   *  additively at their world offsets; the focus region drives theme/music. */
  private enterRegion(map: MapDef) {
    const world = useGame.getState().world;
    const isFocus = !world || (map.region!.rx === world.focus.rx && map.region!.rz === world.focus.rz);
    const alreadyBuilt = this.grid.hasRegion(map.id);
    this.grid.addRegion(map);
    // fog of war is a dungeon-only feature now — the overworld renders fully
    // revealed (no dark planes per region, monsters always visible outdoors)
    this.syncWorldProbe();
    if (isFocus) {
      const def = this.grid.setFocusRegion(map.id);
      this.controls.bindToken(this.myTokenId);
      if (def && this.themeRegionId !== map.id) {
        this.themeRegionId = map.id;
        this.world.onMapTheme(def, map.worldOriginFt || { x: 0, z: 0 });
        this.activeMapDef = def;
        this.syncMusic(true);
      }
      if (!this.worldEntered) {
        this.worldEntered = true;
        // first overworld entry: drop the camera near the party spawn backdrop
        const sp = map.spawns.party[0];
        const origin = map.worldOriginFt || { x: 0, z: 0 };
        this.camera.position.set(origin.x + sp[0] * 5 + 10, 12.5, origin.z + sp[1] * 5 + 16);
        this.camera.lookAt(origin.x + sp[0] * 5, 4, origin.z + sp[1] * 5);
      }
    }
    if (!alreadyBuilt && isFocus) {
      // prune regions that fell outside the focus ring (def cache is the
      // server's concern; the client only keeps what it renders)
      this.pruneFarRegions(world);
    }
  }

  private pruneFarRegions(world: GameStore['world']) {
    if (!world) return;
    const keep = new Set<string>();
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        keep.add(regionIdOf(world.focus.rx + dx, world.focus.rz + dz));
      }
    }
    this.grid.retainRegions(keep);
    this.syncWorldProbe();
  }

  /** Rebuild the HUD-minimap snapshot after the streamed region set changes.
   *  Water/road masks are rebuilt here (rare) so the HUD loop only reads. */
  private syncWorldProbe() {
    worldProbe.active = this.grid.worldMode && this.grid.regions.size > 0;
    const regions = [];
    for (const r of this.grid.regions.values()) {
      const w = r.map.size.w, h = r.map.size.h;
      const water = new Uint8Array(w * h);
      for (const [x, z] of r.map.cells.water || []) {
        if (x >= 0 && z >= 0 && x < w && z < h) water[z * w + x] = 1;
      }
      const road = new Uint8Array(w * h);
      for (const [x, z] of r.map.cells.road || []) {
        if (x >= 0 && z >= 0 && x < w && z < h) road[z * w + x] = 1;
      }
      regions.push({
        id: r.id, rx: r.rx, rz: r.rz,
        name: r.map.name || r.id,
        w, h,
        originX: r.origin.x, originZ: r.origin.z,
        biome: r.map.biomes?.cells ?? null,
        kinds: r.map.biomes?.kinds ?? [],
        water, road,
        explored: null,   // P3.13: fog of war removed — minimap renders fully revealed
      });
    }
    worldProbe.regions = regions;
  }

  start() {
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      // QA harness hook: freeze rendering while a screenshot is being taken
      if ((window as any).__AR_PAUSE__) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.tick(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private tick(dt: number) {
    this.timeAccum += dt;
    // advance world clock (server env is authoritative but we interpolate locally)
    if (this.lastEnv.mode === 'cycle') {
      this.lastEnv.time = (this.lastEnv.time + dt * 1.2) % 1440;
      const currentMin = Math.floor(this.lastEnv.time);
      if (currentMin !== useGame.getState().dayTime) {
        useGame.setState({ dayTime: currentMin });
      }
    }

    this.world.update(dt, this.lastEnv);
    // HUD minimap feed: local token world position (feet) + facing
    worldProbe.active = this.grid.worldMode && this.grid.regions.size > 0;
    const myActor = this.myTokenId ? this.actors.get(this.myTokenId) : null;
    if (myActor) {
      worldProbe.player.x = myActor.group.position.x;
      worldProbe.player.z = myActor.group.position.z;
      worldProbe.player.rotY = myActor.group.rotation.y;
    }
    this.grid.update(dt);
    this.controls.update(dt);
    this.actors.update(dt, this.timeAccum);
    this.vision.update(dt);
    this.effects.update(dt);
    this.cameraRig.update(dt);

    // Dynamic zone & region music progression
    if (this.victoryTimer > 0) {
      this.victoryTimer = Math.max(0, this.victoryTimer - dt);
      if (this.victoryTimer === 0) this.syncMusic(true);
    }
    this.candidateMusicTimer += dt;
    this.musicCheckTimer += dt;
    if (this.musicCheckTimer >= 0.25) {
      this.musicCheckTimer = 0;
      this.syncMusic(false);
    }

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /** Evaluates current player position and state against regions/zones, switching music scenes when appropriate. */
  private syncMusic(immediate = false) {
    const state = useGame.getState();
    if (state.phase !== 'playing') return;

    let px = 0, pz = 0;
    const myActor = this.myTokenId ? this.actors.get(this.myTokenId) : null;
    if (myActor) {
      px = myActor.group.position.x;
      pz = myActor.group.position.z;
    } else if (this.activeMapDef?.spawns.party[0]) {
      const sp = this.activeMapDef.spawns.party[0];
      const orig = this.activeMapDef.worldOriginFt || { x: 0, z: 0 };
      px = orig.x + sp[0] * 5;
      pz = orig.z + sp[1] * 5;
    }

    const scene = resolveZoneMusic({
      playerX: px,
      playerZ: pz,
      map: this.activeMapDef || this.grid.map,
      regions: this.grid.regions,
      worldMode: this.grid.worldMode,
      inCombat: Boolean(state.initiative),
      tokens: state.tokens,
      myTokenId: this.myTokenId,
      victoryCooldown: this.victoryTimer,
    });

    if (scene !== 'combat' && scene !== 'boss' && scene !== 'victory' && scene !== 'gameover') {
      this.areaMusic = scene;
    }

    if (immediate || scene === 'combat' || scene === 'boss' || scene === 'gameover' || scene === 'victory') {
      this.currentMusicScene = scene;
      this.candidateMusicScene = scene;
      this.candidateMusicTimer = 0;
      setMusicScene(scene);
    } else {
      if (scene !== this.currentMusicScene) {
        if (scene === this.candidateMusicScene) {
          // Stable candidate for 0.6s -> smoothly crossfade into the new area track
          if (this.candidateMusicTimer >= 0.6) {
            this.currentMusicScene = scene;
            setMusicScene(scene);
          }
        } else {
          this.candidateMusicScene = scene;
          this.candidateMusicTimer = 0;
        }
      } else {
        this.candidateMusicScene = scene;
        this.candidateMusicTimer = 0;
      }
    }
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    this.gtaoPass?.setSize(window.innerWidth, window.innerHeight);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.bloomPass?.dispose();
    this.gtaoPass?.dispose();
    this.gradePass?.dispose?.();
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
