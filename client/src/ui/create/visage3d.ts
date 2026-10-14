// ═══════════════════════════════════════════════════════════════════════════
// visage3d.ts — live interactive 3D character viewport for the character forge.
//
// Renders the exact in-game Three.js HumanoidRig with class equipment, racial
// anatomy (horns, tails, pointed ears, tusks, beards, scale), gender frame,
// body proportions, and custom visage colors.
// ═══════════════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { HumanoidRig } from '../../engine/rig/HumanoidRig';
import { Animator } from '../../engine/rig/animations';
import type { TokenLook } from '../../engine/types';
import type { CreateState } from './steps';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOAK_COLORS,
} from './portrait';

const RIG_HAIR_KEYS = [
  'short', 'topknot', 'long', 'braids', 'none',
  'ponytail', 'flowing', 'twin_braids', 'chignon', 'bob',
];

const CLASS_TO_ARCHETYPE: Record<string, string> = {
  fighter: 'warden', paladin: 'warden', barbarian: 'warden',
  rogue: 'shadowdancer', ranger: 'shadowdancer', monk: 'shadowdancer',
  wizard: 'ashen_mage', sorcerer: 'ashen_mage', warlock: 'ashen_mage', artificer: 'ashen_mage',
  cleric: 'pale_priest', druid: 'pale_priest', bard: 'pale_priest',
};

export class Visage3DView {
  static savedYaw = 0.08;
  static savedPitch = 0.04;
  static savedDistance = 9.2;
  static savedTargetY = 2.85;
  static savedAutoRotate = false;

  readonly root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private rig: HumanoidRig | null = null;
  private animator = new Animator();

  private animId: number = 0;
  private lastTime = 0;
  private elapsed = 0;

  // camera orbit state — restored from previous edits so the viewport does not reset
  private yaw = Visage3DView.savedYaw;
  private pitch = Visage3DView.savedPitch;
  private distance = Visage3DView.savedDistance;
  private targetY = Visage3DView.savedTargetY;
  private autoRotate = Visage3DView.savedAutoRotate;
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private currentDefKey = '';

  constructor(parent: HTMLElement, private state: CreateState, width = 300, height = 375) {
    this.root = document.createElement('div');
    this.root.className = 'cr-3d-wrap';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cr-3d-canvas';
    this.canvas.width = width * (window.devicePixelRatio || 1);
    this.canvas.height = height * (window.devicePixelRatio || 1);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.root.append(this.canvas);

    // controls toolbar under canvas
    const bar = document.createElement('div');
    bar.className = 'cr-3d-bar';

    const hint = document.createElement('span');
    hint.className = 'cr-3d-hint';
    hint.textContent = 'Drag to rotate · Scroll to zoom';

    const autoBtn = document.createElement('button');
    autoBtn.className = 'cr-3d-btn' + (this.autoRotate ? ' active' : '');
    autoBtn.type = 'button';
    autoBtn.title = 'Toggle slow spin';
    autoBtn.textContent = 'Spin';
    autoBtn.onclick = (e) => {
      e.stopPropagation();
      this.autoRotate = !this.autoRotate;
      Visage3DView.savedAutoRotate = this.autoRotate;
      autoBtn.classList.toggle('active', this.autoRotate);
    };

    const resetBtn = document.createElement('button');
    resetBtn.className = 'cr-3d-btn';
    resetBtn.type = 'button';
    resetBtn.title = 'Reset to full body view';
    resetBtn.textContent = 'Front';
    resetBtn.onclick = (e) => {
      e.stopPropagation();
      const rScale = this.rig?.raceScale || 1.0;
      this.yaw = 0.08;
      this.pitch = 0.04;
      this.distance = 9.2;
      this.targetY = 2.85 * rScale;
      this.saveCamera();
      this.updateCamera();
    };

    const focusBtn = document.createElement('button');
    focusBtn.className = 'cr-3d-btn';
    focusBtn.type = 'button';
    focusBtn.title = 'Close-up of visage and head';
    focusBtn.textContent = 'Face';
    focusBtn.onclick = (e) => {
      e.stopPropagation();
      this.yaw = 0.05;
      this.pitch = 0.02;
      const headY = this.rig ? this.rig.topY * 0.88 : 5.1;
      this.targetY = headY;
      this.distance = 3.2;
      this.saveCamera();
      this.updateCamera();
    };

    bar.append(hint, focusBtn, resetBtn, autoBtn);
    this.root.append(bar);
    parent.append(this.root);

    // Three.js scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.2, 40);
    this.updateCamera();

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height, false);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18;
    } catch (e) {
      console.warn('[Visage3D] WebGL init fallback:', e);
    }

    this.setupLighting();
    this.setupPedestal();
    this.setupInteraction();
    this.rebuildRig();

    this.lastTime = performance.now();
    this.renderLoop = this.renderLoop.bind(this);
    this.animId = requestAnimationFrame(this.renderLoop);
  }

  private setupLighting() {
    // Ambient fill (dim crypt slate)
    const ambient = new THREE.AmbientLight(0x232733, 1.3);
    this.scene.add(ambient);

    // Warm golden torchlight from high front-left
    const key = new THREE.DirectionalLight(0xffdfb2, 2.9);
    key.position.set(3.2, 5.0, 4.0);
    this.scene.add(key);

    // Cool fill from front-right
    const fill = new THREE.DirectionalLight(0xa5c4e0, 1.2);
    fill.position.set(-3.2, 3.2, 3.0);
    this.scene.add(fill);

    // Dramatic rim/silhouette light from back-high
    const rim = new THREE.DirectionalLight(0x7ec2f5, 2.2);
    rim.position.set(0.2, 4.2, -3.8);
    this.scene.add(rim);

    // Low ember ground bounce
    const groundBounce = new THREE.DirectionalLight(0xc46220, 0.8);
    groundBounce.position.set(0, -2.5, 1.5);
    this.scene.add(groundBounce);
  }

  private setupPedestal() {
    // Stone plinth disc
    const plinthGeom = new THREE.CylinderGeometry(1.65, 1.8, 0.14, 32);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x16181f,
      roughness: 0.85,
      metalness: 0.2,
    });
    const plinth = new THREE.Mesh(plinthGeom, plinthMat);
    plinth.position.y = -0.07;
    this.scene.add(plinth);

    // Gold/ember inlaid ring
    const ringGeom = new THREE.RingGeometry(1.42, 1.54, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xb8952f,
      emissive: 0x6e4610,
      roughness: 0.4,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    this.scene.add(ring);
  }

  private setupInteraction() {
    const el = this.canvas;

    el.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      this.yaw -= dx * 0.012;
      this.pitch = Math.max(-0.45, Math.min(0.75, this.pitch + dy * 0.008));
      this.saveCamera();
      this.updateCamera();
    });

    const stopDrag = (e: PointerEvent) => {
      if (this.isDragging) {
        this.isDragging = false;
        try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      }
    };
    el.addEventListener('pointerup', stopDrag);
    el.addEventListener('pointercancel', stopDrag);

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.006;
      this.distance = Math.max(2.2, Math.min(16.0, this.distance + delta));
      this.saveCamera();
      this.updateCamera();
    }, { passive: false });
  }

  private saveCamera() {
    Visage3DView.savedYaw = this.yaw;
    Visage3DView.savedPitch = this.pitch;
    Visage3DView.savedDistance = this.distance;
    Visage3DView.savedTargetY = this.targetY;
    Visage3DView.savedAutoRotate = this.autoRotate;
  }

  private updateCamera() {
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);

    const cx = sinY * cosP * this.distance;
    const cy = this.targetY + sinP * this.distance;
    const cz = cosY * cosP * this.distance;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(0, this.targetY, 0);
  }

  private computeDefKey(state: CreateState): string {
    const l = state.look;
    return [
      state.race, state.charClass, state.subrace,
      l.gender || 'masculine', l.bodyType, l.skinTone, l.hairStyle,
      l.hairColor, l.cloakColor, l.eyeColor, l.faceDecor,
    ].join('|');
  }

  private rebuildRig() {
    if (this.rig) {
      this.rig.dispose();
      this.rig = null;
    }

    const s = this.state;
    const l = s.look;
    const charClass = (s.charClass || 'Fighter').toLowerCase();
    const archetype = CLASS_TO_ARCHETYPE[charClass] || 'warden';

    const skinHex = SKIN_TONES[l.skinTone]?.base || '#cdb69e';
    const hairHex = HAIR_COLORS[l.hairColor]?.base || '#26242e';
    const eyeHex = EYE_COLORS[l.eyeColor]?.iris || '#c8781f';
    const cloakHex = CLOAK_COLORS[l.cloakColor]?.base || '#24262c';
    const hairRigKey = RIG_HAIR_KEYS[l.hairStyle] || 'short';

    const tokenLook: TokenLook = {
      gender: l.gender || 'masculine',
      bodyType: l.bodyType === 'slim' ? 'lean' : l.bodyType === 'heavy' ? 'broad' : 'standard',
      skinTone: skinHex,
      hair: hairRigKey,
      hairColor: hairHex,
      eyeColor: eyeHex,
      cloakColor: cloakHex,
      faceDecor: l.faceDecor,
      race: s.race || 'Human',
      subrace: s.subrace || '',
      charClass: s.charClass || 'Fighter',
      hoodUp: false,
      seed: 0x4a17,
    };

    try {
      this.rig = new HumanoidRig(archetype, tokenLook);
      // Character creation leaves hands unencumbered — no permanent sword/shield attached
      this.scene.add(this.rig.body);
      this.updateCamera();
    } catch (e) {
      console.error('[Visage3D] rig build failed:', e);
    }
  }

  update(state: CreateState): void {
    this.state = state;
    const key = this.computeDefKey(state);
    if (key !== this.currentDefKey) {
      this.currentDefKey = key;
      this.rebuildRig();
    }
  }

  private renderLoop(now: number) {
    this.animId = requestAnimationFrame(this.renderLoop);
    const dt = Math.min((now - this.lastTime) * 0.001, 0.1);
    this.lastTime = now;
    this.elapsed += dt;

    if (this.autoRotate && !this.isDragging) {
      this.yaw += dt * 0.32;
      this.updateCamera();
    }

    if (this.rig) {
      // Natural idle pose with bare hands in character forge
      this.animator.update({
        dt,
        t: this.elapsed,
        speed: 0,
        accel: 0,
        yawRate: 0,
        style: 'none',
        isWraith: false,
        isSkeleton: false,
      }, this.rig);

      // Sway cloak in gentle atmospheric breeze
      this.rig.update(dt, Math.sin(this.elapsed * 1.4) * 0.4, Math.cos(this.elapsed * 1.1) * 0.3, 0.05);
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animId);
    if (this.rig) {
      this.rig.dispose();
      this.rig = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.root.remove();
  }
}
