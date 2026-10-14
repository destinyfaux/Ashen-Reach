// Actors — every creature token as a SKELETAL figure (rig/HumanoidRig) with
// procedural animation (rig/animations), equipment (rig/equipment), cloth cloak,
// HP plaque, contact shadow and team ring. True 5E medium scale (~6ft) on 5ft grid.
import * as THREE from 'three';
import type { Engine } from './Engine';
import type { ActionFx, TokenView } from './types';
import { Bus, EV } from './bus';
import { softSprite } from './sprites';
import { B, HumanoidRig } from './rig/HumanoidRig';
import { Animator } from './rig/animations';
import type { WeaponStyle } from './rig/animations';
import { buildEquipment } from './rig/equipment';

const WEAPON_STYLE: Record<string, WeaponStyle> = {
  warden: 'sword', shadowdancer: 'dagger', ashen_mage: 'staff', pale_priest: 'mace',
  skeleton: 'sword', wraith: 'none',
};

// foot-lock pass: keep the lowest foot joint at least this high above the floor
const FOOT_LOCK_Y = 0.06;
const _footV = new THREE.Vector3();   // shared scratch — no per-frame allocations
const REMOTE_POSITION_DELAY_MS = 150; // buffers the 10 Hz movement snapshots
const MAX_REMOTE_POSITION_SAMPLES = 8;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

interface PositionSample {
  x: number;
  z: number;
  rotY: number;
  at: number;
}

interface Actor {
  id: string;
  group: THREE.Group;          // world root: networked position + rotY
  rig: HumanoidRig;
  anim: Animator;
  style: WeaponStyle;
  hpBar: THREE.Sprite;
  hpCanvas: HTMLCanvasElement;
  hpTex: THREE.CanvasTexture;
  plaqueY: number;
  data: TokenView;
  // motion tracking (smoothed, fed to the Animator like sim/player.rs)
  speed: number;
  prevSpeed: number;
  accel: number;
  yawRate: number;
  lastX: number; lastZ: number; lastRotY: number;
  remotePositions: PositionSample[];
  dieT: number;                // -1 alive; 0..1 death progress
  dead: boolean;
  downed: boolean;
  spawnT: number;
  ring: THREE.Mesh;
  statusRing: THREE.Mesh;
  lantern: THREE.PointLight | null;
}

export class Actors {
  private eng: Engine;
  private actors = new Map<string, Actor>();
  private labelHost: HTMLDivElement;
  focusId: string | null = null;

  constructor(eng: Engine) {
    this.eng = eng;
    this.labelHost = document.createElement('div');
    this.labelHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:20';
    document.body.appendChild(this.labelHost);
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => { for (const [, a] of this.actors) this.drawHp(a); });
    }
  }

  // ── HP plaque (canvas sprite) ─────────────────────────────────────────
  private makeHpBar(): { sprite: THREE.Sprite; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture } {
    const canvas = document.createElement('canvas');
    canvas.width = 168; canvas.height = 42;
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: false }));
    sprite.scale.set(7.5, 1.9, 1);
    sprite.center.set(0.5, 0);
    return { sprite, canvas, tex };
  }

  private drawHp(a: Actor) {
    const g = a.hpCanvas.getContext('2d')!;
    const W = 168, H = 42;
    g.clearRect(0, 0, W, H);
    const pct = Math.max(0, Math.min(1, a.data.hp / a.data.hpMax));
    g.beginPath();
    const r = 6;
    g.moveTo(r + 1, 1); g.lineTo(W - r - 1, 1); g.quadraticCurveTo(W - 1, 1, W - 1, r + 1);
    g.lineTo(W - 1, H - r - 1); g.quadraticCurveTo(W - 1, H - 1, W - r - 1, H - 1);
    g.lineTo(r + 1, H - 1); g.quadraticCurveTo(1, H - 1, 1, H - r - 1);
    g.lineTo(1, r + 1); g.quadraticCurveTo(1, 1, r + 1, 1);
    g.closePath();
    g.fillStyle = 'rgba(10,9,12,0.82)';
    g.fill();
    g.strokeStyle = 'rgba(184,149,47,0.55)';
    g.lineWidth = 1.4;
    g.stroke();
    let fs = 17;
    g.font = `600 ${fs}px Cinzel, Georgia, serif`;
    while (g.measureText(a.data.name).width > W - 24 && fs > 10) {
      fs -= 1; g.font = `600 ${fs}px Cinzel, Georgia, serif`;
    }
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,0.8)';
    g.fillText(a.data.name, W / 2 + 1, 17);
    g.fillStyle = a.data.kind === 'player' ? (a.data.color || '#e6c766') : '#d8d2c4';
    g.fillText(a.data.name, W / 2, 16);
    const bx = 22, bw = 124, by = 25, bh = 8;
    g.fillStyle = '#181210';
    g.fillRect(bx, by, bw, bh);
    const col = pct > 0.5 ? '#8a2a1f' : pct > 0.25 ? '#a33a1f' : '#c9541f';
    g.fillStyle = a.data.kind === 'player' ? '#77864a' : col;
    g.fillRect(bx, by, bw * pct, bh);
    g.strokeStyle = 'rgba(200,190,170,0.35)';
    g.lineWidth = 1;
    g.strokeRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);
    a.hpTex.needsUpdate = true;
  }

  // ── sync with server tokens ──────────────────────────────────────────
  sync(tokens: TokenView[]) {
    const seen = new Set<string>();
    for (const t of tokens) {
      if (t.hidden && t.kind === 'monster') continue; // hidden monsters not drawn
      seen.add(t.id);
      let a = this.actors.get(t.id);
      if (!a) {
        const seed = hashStr(t.id) ^ ((t as any).portraitSeed ?? 0);
        const look = { ...(t.look || {}), seed } as any;
        const sheet = (t as any).sheet;
        if (sheet?.race && !look.race) look.race = sheet.race;
        if (sheet?.subrace && !look.subrace) look.subrace = sheet.subrace;
        if (sheet?.look) {
          if (sheet.look.gender && !look.gender) look.gender = sheet.look.gender;
          if (sheet.look.faceDecor && !look.faceDecor) look.faceDecor = sheet.look.faceDecor;
        }
        const group = new THREE.Group();
        let rig: HumanoidRig;
        try {
          const equipClass = sheet?.class || t.archetype;
          rig = new HumanoidRig(t.archetype, look);
          buildEquipment(rig, equipClass);
        } catch (e) {
          console.error('[actors] rig build failed for ' + t.id + ' — figure skipped, sync continues', e);
          continue;
        }
        group.add(rig.body);

        const rScale = rig.raceScale || 1.0;
        // soft contact shadow grounding the figure
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(2.1 * rScale, 24),
          new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false,
            alphaMap: softSprite()
          })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.13;
        group.add(shadow);

        // team ring: player colour / blood for monsters / ember for the local hero
        const isLocal = t.id === ('tok_' + String((this.eng as any).controls?.tokenId ?? '').slice(4));
        const ringColor = t.kind === 'player'
          ? new THREE.Color(t.color || '#c9a227')
          : new THREE.Color(0x7a1f1f);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.85 * rScale, 2.12 * rScale, 40),
          new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: isLocal ? 0.5 : 0.28, depthWrite: false })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.14;
        group.add(ring);

        const statusRing = new THREE.Mesh(
          new THREE.RingGeometry(2.22 * rScale, 2.46 * rScale, 40),
          new THREE.MeshBasicMaterial({ color: 0x8fe8b0, transparent: true, opacity: 0.6, depthWrite: false })
        );
        statusRing.rotation.x = -Math.PI / 2;
        statusRing.position.y = 0.2;
        statusRing.visible = false;
        group.add(statusRing);

        // hero lantern: warm diegetic point light so player figures always read
        let lantern: THREE.PointLight | null = null;
        if (t.kind === 'player') {
          lantern = new THREE.PointLight(0xd8a85a, 95, 34, 1.8);
          lantern.position.set(0, 5.2 * rScale, 0.4 * rScale);
          group.add(lantern);
        }

        const { sprite, canvas, tex } = this.makeHpBar();
        const plaqueY = (rig.topY + 1.15) * (t.size || 1);
        sprite.position.y = plaqueY;
        group.add(sprite);
        group.position.set(t.x, 0, t.z);
        group.rotation.y = t.rotY || 0;
        this.eng.scene.add(group);
        const receivedAt = performance.now();
        a = {
          id: t.id, group, rig, anim: new Animator(seed),
          style: WEAPON_STYLE[t.archetype] || 'sword',
          hpBar: sprite, hpCanvas: canvas, hpTex: tex, plaqueY,
          data: t,
          speed: 0, prevSpeed: 0, accel: 0, yawRate: 0,
          lastX: t.x, lastZ: t.z, lastRotY: t.rotY || 0,
          remotePositions: [{ x: t.x, z: t.z, rotY: t.rotY || 0, at: receivedAt }],
          dieT: -1, dead: false, downed: false, spawnT: 0.55, ring, statusRing,
          lantern,
        };
        a.downed = t.hp <= 0 && !t.deathSaves?.dead && t.kind === 'player';
        a.anim.setDowned(a.downed);
        this.actors.set(t.id, a);
        this.drawHp(a);
      } else {
        const prevHp = a.data.hp;
        const wasDead = a.dead;
        if (t.id !== this.eng.controls.tokenId &&
            (t.x !== a.data.x || t.z !== a.data.z || t.rotY !== a.data.rotY)) {
          const receivedAt = performance.now();
          const previous = a.remotePositions[a.remotePositions.length - 1];
          a.remotePositions.push({
            x: t.x, z: t.z, rotY: t.rotY || 0,
            at: Math.max(receivedAt, previous.at + 0.001),
          });
          if (a.remotePositions.length > MAX_REMOTE_POSITION_SAMPLES) {
            a.remotePositions.splice(0, a.remotePositions.length - MAX_REMOTE_POSITION_SAMPLES);
          }
        }
        a.data = t;
        if (t.hp !== prevHp || a.dead !== wasDead) this.drawHp(a);
        // look changed (e.g. re-forge) → rebuild the figure next sync cycle
        if (JSON.stringify(t.look || null) !== JSON.stringify((a.rig as any).__lookKey ?? null)) {
          // rare; accept the old figure for now (v1)
        }
      }
    }
    for (const [id, a] of this.actors) {
      if (!seen.has(id)) {
        this.eng.scene.remove(a.group);
        a.rig.dispose();
        this.actors.delete(id);
      }
    }
  }

  clearAll() {
    for (const [, a] of this.actors) {
      this.eng.scene.remove(a.group);
      a.rig.dispose();
    }
    this.actors.clear();
  }

  get(id: string) { return this.actors.get(id); }

  focusPoint(): { x: number; z: number } {
    const a = this.focusId ? this.actors.get(this.focusId) : null;
    if (a) return { x: a.group.position.x, z: a.group.position.z };
    return { x: 100, z: 80 };
  }

  /** Head-top world position (camera focus + screen projection). */
  private headPos(a: Actor, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(a.group.position.x, a.plaqueY - 0.9, a.group.position.z);
  }

  getScreenPos(actorId: string): { x: number; y: number } | null {
    const a = this.actors.get(actorId);
    if (!a) return null;
    const v = this.headPos(a).project(this.eng.camera);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }

  // ── action FX (Elden Ring feel: windup → strike → recover via Animator) ──
  playAction(actorId: string, fx: ActionFx) {
    const a = this.actors.get(actorId);
    if (!a) return;
    const power = Math.max(0.4, Math.min(2.4, fx.power ?? 1));
    switch (fx.anim) {
      case 'lunge': a.anim.trigger('attack', power, fx.dir ?? 0); break;
      case 'spell': a.anim.trigger('spell', power, fx.dir ?? 0); break;
      case 'shoot': a.anim.trigger('shoot', power, fx.dir ?? 0); break;
      case 'heal':
        a.anim.trigger('heal', power);
        this.eng.effects.burst(a.group.position, 0x8fe8b0, 16, 8);
        break;
      case 'buff': a.anim.trigger('buff', power); break;
      case 'hit':
        a.anim.trigger('hit');
        this.eng.effects.burst(a.group.position, 0xc93a2a, 18);
        this.eng.cameraRig.shake(0.45);
        break;
      case 'crit':
        a.anim.trigger('crit', power);
        this.eng.effects.burst(a.group.position, 0xff6a2a, 34);
        this.eng.cameraRig.shake(0.9);
        break;
      case 'miss': a.anim.trigger('miss'); break;
      case 'die':
        if (!a.dead) { a.dead = true; a.dieT = 0; a.anim.trigger('die'); }
        break;
    }
  }

  update(dt: number, t: number) {
    const windX = 1.1 + Math.sin(t * 0.23) * 0.7;
    const windZ = 0.5 + Math.cos(t * 0.31) * 0.5;
    const remoteRenderTime = performance.now() - REMOTE_POSITION_DELAY_MS;
    for (const [id, a] of this.actors) {
      const isLocal = id === this.eng.controls.tokenId;
      const d = a.data;
      const cell = this.eng.grid.worldToCell(a.group.position.x, a.group.position.z);
      const inSight = d.kind !== 'monster' || this.eng.fog.isVisible(cell.cx, cell.cz);
      a.group.visible = !d.hidden && inSight;
      a.hpBar.visible = !isLocal && inSight && !d.hidden;
      const condition = String(d.conditions?.[0] || '').toLowerCase();
      const statusColor = /poison|disease/.test(condition) ? 0x80bb5d
        : /burn|fire/.test(condition) ? 0xf28b45
        : /fear|fright/.test(condition) ? 0x83a9db
        : /stun|paraly/.test(condition) ? 0xb190dc : 0xe0ca70;
      const isDowned = d.hp <= 0 && d.kind === 'player' && !d.deathSaves?.dead;
      const isDead = !!d.deathSaves?.dead || (d.kind !== 'player' && d.hp <= 0);
      if (isDowned !== a.downed) {
        a.downed = isDowned;
        a.anim.setDowned(isDowned);
        if (isDowned) { a.speed = 0; a.prevSpeed = 0; a.accel = 0; }
      }
      a.statusRing.visible = (!!d.conditions?.length || a.downed) && !a.dead;
      (a.statusRing.material as THREE.MeshBasicMaterial).color.setHex(a.downed ? 0xb84531 : statusColor);
      (a.statusRing.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 4) * 0.12;

      // ── dying: rig collapse + dissolve, plaque fades ──
      if (isDead && !a.dead) { a.dead = true; a.dieT = 0; a.anim.setDowned(false); a.anim.trigger('die'); }
      if (a.dead) {
        if (a.dieT >= 0) a.dieT = Math.min(1, a.dieT + dt * 0.8);
        a.rig.setDissolve(a.dieT);
        a.group.position.y = -a.dieT * 0.55;
        (a.hpBar.material as THREE.SpriteMaterial).opacity = 1 - a.dieT;
        (a.ring.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - a.dieT);
      }

      // ── local prediction; remote actors render between buffered snapshots ──
      if (!isLocal && !a.dead) {
        const samples = a.remotePositions;
        while (samples.length > 2 && samples[1].at <= remoteRenderTime) samples.shift();
        const from = samples[0];
        const to = samples[1];
        if (from && remoteRenderTime >= from.at) {
          const alpha = to
            ? Math.max(0, Math.min(1, (remoteRenderTime - from.at) / (to.at - from.at)))
            : 1;
          a.group.position.x = from.x + ((to?.x ?? from.x) - from.x) * alpha;
          a.group.position.z = from.z + ((to?.z ?? from.z) - from.z) * alpha;
          let dy = (to?.rotY ?? from.rotY) - from.rotY;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          a.group.rotation.y = from.rotY + dy * alpha;
        }
      }
      const groundY = this.eng.grid.terrainHeightAt(a.group.position.x, a.group.position.z);
      a.group.position.y = a.dead
        ? groundY - a.dieT * 0.55
        : groundY + (isLocal ? this.eng.controls.jumpOffset : 0);

      // ── motion measurement (smoothed — drives the Animator) ──
      const dx = a.group.position.x - a.lastX, dz = a.group.position.z - a.lastZ;
      const inst = Math.sqrt(dx * dx + dz * dz) / Math.max(dt, 1e-4);
      a.speed += (inst - a.speed) * Math.min(1, dt * 9);
      let dYaw = a.group.rotation.y - a.lastRotY;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      a.yawRate += ((dYaw / Math.max(dt, 1e-4)) - a.yawRate) * Math.min(1, dt * 7);
      a.accel += ((a.speed - a.prevSpeed) / Math.max(dt, 1e-4) - a.accel) * Math.min(1, dt * 5);
      a.prevSpeed = a.speed;
      a.lastX = a.group.position.x; a.lastZ = a.group.position.z; a.lastRotY = a.group.rotation.y;

      // ── pose solve (writes bone quaternions) ──
      const pose = a.anim.update({
        dt, t, speed: a.speed, accel: a.accel, yawRate: a.yawRate,
        style: a.style, isWraith: a.rig.isWraith, isSkeleton: a.rig.isSkeleton,
      }, a.rig);
      if (isLocal) {
        for (let step = 0; step < pose.footfalls; step++) Bus.emit(EV.SFX, { name: 'step', volume: 0.72 });
      }

      // ── visual root extras: lunge offset (forward = +Z of the group) ──
      const body = a.rig.body;
      body.position.x = 0;
      body.position.z = pose.lungeF * 0.42;
      if (a.rig.isWraith) body.position.y = 1.15 + pose.lift;   // hover carries the shroud
      else body.position.y = Math.max(0, pose.lift * 0.35);     // never dip below the floor plane

      // ── foot-lock: a pose can drag a foot joint through the floor — measure
      // the lowest foot (world Y minus the group's ground origin) and softly
      // push the body up so it stays above the floor. Partial (0.6) correction
      // = pop-free; skipped for the dead (collapse) and wraiths (no legs).
      if (!a.dead && !a.rig.isWraith) {
        const gy = a.group.position.y;
        const bones = a.rig.bones;
        const fl = bones[B.FOOT_L].getWorldPosition(_footV).y - gy;
        const fr = bones[B.FOOT_R].getWorldPosition(_footV).y - gy;
        const low = fl < fr ? fl : fr;
        if (low < FOOT_LOCK_Y) body.position.y += (FOOT_LOCK_Y - low) * 0.6;
      }

      // ── cloth: ambient breeze + motion airflow + billow ──
      a.rig.update(dt, windX - Math.sin(a.group.rotation.y) * a.speed * 0.35,
        windZ - Math.cos(a.group.rotation.y) * a.speed * 0.35, pose.windUp);

      // ── palm ember (spell glow) ──
      if (a.rig.palmSprite) {
        const m = a.rig.palmSprite.material as THREE.SpriteMaterial;
        m.opacity = 0.25 + pose.glow * 0.75;
        a.rig.palmSprite.scale.setScalar(Math.max(0.001, 0.35 + pose.glow * 1.5));
      }
      if (a.rig.innerGlow) {
        const m = a.rig.innerGlow.material as THREE.SpriteMaterial;
        m.opacity = 0.45 + Math.sin(t * 2.1) * 0.12 + pose.glow * 0.4;
      }

      // ── hero lantern flicker ──
      if (a.lantern) {
        const fl = 1 + Math.sin(t * 13.7 + a.lastX) * 0.12 + Math.sin(t * 31.3 + a.lastZ) * 0.07;
        a.lantern.intensity = 95 * fl;
      }

      // ── spawn pop: scale in ──
      if (a.spawnT > 0) {
        a.spawnT = Math.max(0, a.spawnT - dt);
        const s = 1 - a.spawnT / 0.55;
        const sc = 0.86 + 0.14 * s;
        a.group.scale.setScalar(sc);
      }
    }
  }

  dispose() { this.labelHost.remove(); }
}
