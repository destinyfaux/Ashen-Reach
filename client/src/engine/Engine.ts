// ASHENREACH engine root — owns renderer + module orchestration. Framework-free.
// World coordinates: 1 unit = 1 foot. One grid cell = 5 ft = 5 units.
import * as THREE from 'three';
import { World } from './World';
import { TileGrid } from './TileGrid';
import { FogOfWar } from './FogOfWar';
import { Actors } from './Actors';
import { CameraRig } from './CameraRig';
import { Controls } from './Controls';
import { Effects } from './Effects';
import { Bus, EV } from './bus';
import { useGame } from '../game/store';
import type { DoorState } from '../game/store';
import type { MapDef } from './types';
import { playSfx } from '../audio/music';
import { setMusicScene } from '../audio/music';
import { getAreaTileSet } from './materials';

export class Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock = new THREE.Clock();

  world: World;
  grid: TileGrid;
  fog: FogOfWar;
  actors: Actors;
  cameraRig: CameraRig;
  controls: Controls;
  effects: Effects;

  myTokenId: string | null = null;
  private raf = 0;
  private disposed = false;
  private lastEnv = { time: 21 * 60, weather: 'clear', mode: 'cycle' };
  private timeAccum = 0;
  private areaMusic: 'crypt' | 'town' = 'crypt';
  private doorOpenByWall = new Map<number, boolean>();
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090c);
    this.scene.fog = new THREE.FogExp2(0x07090c, 0.010);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 900);
    this.camera.position.set(30, 11, 44); // under the indoor ceiling cap from frame one

    this.world = new World(this);
    this.grid = new TileGrid(this);
    this.fog = new FogOfWar(this);
    this.actors = new Actors(this);
    this.effects = new Effects(this);
    this.cameraRig = new CameraRig(this);
    this.controls = new Controls(this);

    this.wire();
    window.addEventListener('resize', this.onResize);
    (window as any).__AR_ENGINE__ = this; // QA/diagnostic hook
  }

  private wire() {
    useGame.subscribe((state, previous) => {
      if (state.initiative !== previous.initiative || state.phase !== previous.phase) {
        setMusicScene(state.phase === 'playing' ? (state.initiative ? 'combat' : this.areaMusic) : 'menu');
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
      const map = this.grid.syncDoorStates(doors);
      if (map) this.fog.syncDoorStates(map);
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
    });
    Bus.on(EV.SFX, (s: any) => { if (s?.name) playSfx(s.name, s.volume); });
  }

  loadMap(map: MapDef) {
    if (!map || !map.size || !map.cells) {
      console.warn('MAP_LOAD: map is null/missing');
      return;
    }
    this.grid.build(map);
    this.fog.build(map);
    this.actors.clearAll();
    this.world.onMapTheme(map);
    this.areaMusic = getAreaTileSet(map).ambience === 'town' ? 'town' : 'crypt';
    const state = useGame.getState();
    setMusicScene(state.initiative ? 'combat' : this.areaMusic);
    this.controls.bindToken(this.myTokenId);
    // drop camera at party spawn for the join backdrop (indoor-safe height)
    const sp = map.spawns.party[0];
    this.camera.position.set(sp[0] * 5 + 10, 10.5, sp[1] * 5 + 16);
    this.camera.lookAt(sp[0] * 5, 4, sp[1] * 5);
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
    if (this.lastEnv.mode === 'cycle') this.lastEnv.time = (this.lastEnv.time + dt * 1.2) % 1440;

    this.world.update(dt, this.lastEnv);
    this.grid.update(dt);
    this.controls.update(dt);
    this.actors.update(dt, this.timeAccum);
    this.fog.update(dt);
    this.effects.update(dt);
    this.cameraRig.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
