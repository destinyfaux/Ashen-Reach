// Controls — input → local movement (predicted) + throttled net intents.
// My token moves client-side for responsiveness; server validates + rebroadcasts.
import * as THREE from 'three';
import type { Engine } from './Engine';
import { Bus, EV } from './bus';
import { sendDoorIntent, sendExitIntent, sendMove } from '../net/client';
import { useGame } from '../game/store';

const WALK_FT = 16;      // exploration walk speed (ft/s)
const SPRINT_FT = 26;

export class Controls {
  private eng: Engine;
  tokenId: string | null = null;
  private keys: Record<string, boolean> = {};
  private drag = false;
  private lastX = 0; private lastY = 0;
  private netAccum = 0;
  private jumpHeight = 0;
  private jumpVelocity = 0;
  private jumpRequested = false;
  private wasMoving = false;
  private correction: { x: number; z: number } | null = null;
  private offMoveRejected: () => void;

  constructor(eng: Engine) {
    this.eng = eng;
    this.offMoveRejected = Bus.on(EV.MOVE_REJECTED, (event: { position?: { x: number; z: number }; x?: number; z?: number }) => {
      const actor = this.tokenId ? this.eng.actors.get(this.tokenId) : null;
      const p = event?.position || event;
      if (actor && Number.isFinite(p?.x) && Number.isFinite(p?.z)) this.correction = { x: p.x!, z: p.z! };
    });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const canvas = eng.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get jumpOffset() { return this.jumpHeight; }
  bindToken(id: string | null) { this.tokenId = id; }

  private uiOpen() {
    const s = useGame.getState();
    if (s.phase !== 'playing') return true;
    return !!(document.activeElement &&
      /^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(document.activeElement.tagName)) ||
      !!document.querySelector('.pnl-layer:not([hidden]), .hud-prompt:not([hidden])');
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !this.keys.Space && !this.uiOpen()) this.jumpRequested = true;
    if (e.code === 'KeyE' && !e.repeat && !this.uiOpen()) {
      const actor = this.tokenId ? this.eng.actors.get(this.tokenId) : null;
      if (actor) {
        const x = actor.group.position.x, z = actor.group.position.z;
        const door = this.nearestDoor(x, z);
        const exit = this.nearestExit(x, z);
        if (exit && (!door || exit.distance < door.distance)) sendExitIntent(exit.id);
        else if (door) sendDoorIntent(door.wallIndex);
      }
    }
    this.keys[e.code] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE'].includes(e.code) && !this.uiOpen()) e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys[e.code] = false; };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.drag = true; this.lastX = e.clientX; this.lastY = e.clientY;
  };
  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag) return;
    const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
    this.lastX = e.clientX; this.lastY = e.clientY;
    if (e.target && (e.target as HTMLElement).tagName !== 'CANVAS') { this.drag = false; return; }
    this.eng.cameraRig.orbit(dx, dy);
  };
  private onPointerUp = () => { this.drag = false; };
  private onWheel = (e: WheelEvent) => { this.eng.cameraRig.zoom(e.deltaY); };

  private nearestDoor(x: number, z: number) {
    const doors = useGame.getState().doors;
    const walls = this.eng.grid.map?.walls || [];
    let nearest: { wallIndex: number; distance: number; label: string } | null = null;
    for (const door of doors) {
      const wall = walls[door.wallIndex];
      if (!wall || (wall.type !== 'door' && wall.type !== 'secret_door')) continue;
      const centered = wall.x1 === wall.x2
        ? { ...wall, x1: wall.x1 + 0.5, x2: wall.x2 + 0.5 }
        : { ...wall, z1: wall.z1 + 0.5, z2: wall.z2 + 0.5 };
      const ax = centered.x1 * 5, az = centered.z1 * 5;
      const bx = centered.x2 * 5, bz = centered.z2 * 5;
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      const distance = Math.hypot(x - (ax + t * dx), z - (az + t * dz));
      if (distance > 8.5 || (nearest && nearest.distance <= distance)) continue;
      nearest = {
        wallIndex: door.wallIndex,
        distance,
        label: door.locked ? 'Locked door' : door.open ? 'Close door' : 'Open door',
      };
    }
    return nearest;
  }

  private nearestExit(x: number, z: number) {
    // streamed world: exits live per region at world feet; dungeons keep the
    // single-map lookup
    if (this.eng.grid.worldMode) return this.eng.grid.nearestExitWorld(x, z);
    let nearest: { id: string; distance: number; label: string } | null = null;
    for (const exit of this.eng.grid.map?.exits || []) {
      const distance = Math.hypot(x - exit.x * 5, z - exit.z * 5);
      if (distance > 8.5 || (nearest && nearest.distance <= distance)) continue;
      nearest = { id: exit.id, distance, label: exit.label };
    }
    return nearest;
  }

  update(dt: number) {
    const a = this.tokenId ? this.eng.actors.get(this.tokenId) : null;
    if (!a) {
      const state = useGame.getState();
      if (state.interactLabel) state.setInteract(null);
      return;
    }
    const state = useGame.getState();
    const nearbyDoor = this.nearestDoor(a.group.position.x, a.group.position.z);
    const nearbyExit = this.nearestExit(a.group.position.x, a.group.position.z);
    const nearbyInteraction = nearbyExit && (!nearbyDoor || nearbyExit.distance < nearbyDoor.distance)
      ? nearbyExit : nearbyDoor;
    if (state.interactLabel !== (nearbyInteraction?.label || null)) {
      state.setInteract(nearbyInteraction?.label || null);
    }
    const initiative = state.initiative as { order?: string[]; turnIdx?: number; movement?: { tokenId?: string; usedFt?: number; maxFt?: number } } | null;
    const combatActive = !!initiative?.order?.length;
    const activeId = initiative?.order?.[initiative.turnIdx ?? -1];
    const myTurn = !combatActive || activeId === this.tokenId;
    const movement = initiative?.movement;
    const movementLimit = movement?.tokenId === this.tokenId && Number.isFinite(movement.maxFt)
      ? movement.maxFt! : a.data.speedFt;
    const remaining = combatActive && movement?.tokenId === this.tokenId
      ? Math.max(0, movementLimit - (movement.usedFt || 0)) : a.data.speedFt;
    const alive = a.data.hp > 0 && !a.data.deathSaves?.dead;
    const canMove = alive && (!combatActive || (myTurn && remaining > 0.1));
    const uiBlocked = this.uiOpen();
    const movementEnabled = !uiBlocked && canMove;
    const wantsMove = this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'];
    if (!alive) {
      this.keys.KeyW = this.keys.KeyA = this.keys.KeyS = this.keys.KeyD = false;
      this.keys.Space = false;
      this.jumpRequested = false;
      this.jumpHeight = 0;
      this.jumpVelocity = 0;
      a.group.position.y = this.eng.grid.terrainHeightAt(a.group.position.x, a.group.position.z);
    } else {
      // Quick win: jump feel. Old 7.2/18 gave a 1.4 ft hop that read as broken;
      // 12.4/23 arcs ~3.3 ft (about knee-to-waist on a 5 ft cell) with a snappy
      // 0.54 s rise and ~1.1 s total airtime.
      if (this.jumpRequested && !uiBlocked && this.jumpHeight === 0) this.jumpVelocity = 12.4;
      this.jumpRequested = false;
      if (this.jumpHeight > 0 || this.jumpVelocity > 0) {
        this.jumpHeight = Math.max(0, this.jumpHeight + this.jumpVelocity * dt);
        this.jumpVelocity -= 23 * dt;
        if (this.jumpHeight === 0) this.jumpVelocity = 0;
      }
      a.group.position.y = this.eng.grid.terrainHeightAt(a.group.position.x, a.group.position.z) + this.jumpHeight;
    }

    // Rebase rejected predictions before applying this frame's input. Applying
    // a correction after movement pulls against the keys and visibly damps each
    // step; replaying the current input avoids that tug-of-war.
    if (this.correction) {
      if (movementEnabled && wantsMove) {
        a.group.position.x = this.correction.x;
        a.group.position.z = this.correction.z;
        this.correction = null;
      } else {
        const k = Math.min(1, dt * 8);
        a.group.position.x += (this.correction.x - a.group.position.x) * k;
        a.group.position.z += (this.correction.z - a.group.position.z) * k;
        if (Math.hypot(this.correction.x - a.group.position.x, this.correction.z - a.group.position.z) < 0.35) {
          this.correction = null;
        }
      }
    }

    if (movementEnabled) {
      let mvx = 0, mvz = 0;
      if (this.keys['KeyW']) mvz -= 1;
      if (this.keys['KeyS']) mvz += 1;
      if (this.keys['KeyA']) mvx -= 1;
      if (this.keys['KeyD']) mvx += 1;
      const moving = mvx !== 0 || mvz !== 0;
      if (moving) {
        const len = Math.hypot(mvx, mvz);
        mvx /= len; mvz /= len;
        const yaw = this.eng.cameraRig.yaw;
        const dx = mvx * Math.cos(yaw) + mvz * Math.sin(yaw);
        const dz = -mvx * Math.sin(yaw) + mvz * Math.cos(yaw);
        const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const sp = sprint ? SPRINT_FT : WALK_FT;
        // Server meters combat movement in true feet (arc length). Clamp the
        // predicted step to the remaining budget so the figure glides to a stop
        // at the limit instead of overshooting into a reject-snap correction.
        const budgetFt = combatActive && movement?.tokenId === this.tokenId && Number.isFinite(remaining)
          ? remaining : Infinity;
        const step = Math.min(sp * dt, budgetFt);
        const px = a.group.position.x, pz = a.group.position.z;
        // Resolve axes separately so a blocked diagonal doesn't cancel the
        // unblocked component and make movement catch at wall corners.
        let [nx, nz] = this.eng.grid.resolve(px + dx * step, pz, 1.2);
        if (!this.eng.grid.isOpenWorld(nx, pz) && this.eng.grid.isOpenWorld(px, pz)) {
          nx = px;
        }
        [nx, nz] = this.eng.grid.resolve(nx, pz + dz * step, 1.2);
        if (!this.eng.grid.isOpenWorld(nx, nz)) {
          if (this.eng.grid.isOpenWorld(nx, pz)) {
            nz = pz;
          } else if (this.eng.grid.isOpenWorld(px, nz)) {
            nx = px;
          } else {
            nx = px; nz = pz;
          }
        }
        a.group.position.x = nx; a.group.position.z = nz;
        a.group.rotation.y = Math.atan2(dx, dz);
        // net intent (10 Hz)
        this.netAccum += dt;
        if (this.netAccum > 0.1) {
          this.netAccum = 0;
          sendMove(nx, nz, a.group.rotation.y);
        }
      } else {
        if (this.wasMoving) {
          // Immediately announce final resting position so server and peers never freeze at an older step
          this.netAccum = 0;
          sendMove(a.group.position.x, a.group.position.z, a.group.rotation.y);
        } else {
          // still announce position occasionally so server stays truthful
          this.netAccum += dt;
          if (this.netAccum > 0.5) {
            this.netAccum = 0;
            sendMove(a.group.position.x, a.group.position.z, a.group.rotation.y);
          }
        }
      }
      this.wasMoving = moving;

    }

    // write back into actor data so HP bar / others see the local position
    a.data.x = a.group.position.x;
    a.data.z = a.group.position.z;
    a.data.rotY = a.group.rotation.y;
    // Keep local player position in store in sync so minimap / hud / store are seamless
    const myId = this.tokenId;
    if (myId) {
      const st = useGame.getState();
      const meTok = st.tokens.find(t => t.id === myId);
      if (meTok && (meTok.x !== a.group.position.x || meTok.z !== a.group.position.z)) {
        meTok.x = a.group.position.x;
        meTok.z = a.group.position.z;
        meTok.rotY = a.group.rotation.y;
      }
    }
  }

  dispose() {
    this.offMoveRejected();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}
