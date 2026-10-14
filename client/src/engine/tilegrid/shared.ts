// tilegrid/shared.ts — constants, shared types, half-tile math.
// Mechanically extracted from TileGrid.ts; behavior unchanged.

import * as THREE from 'three';
import type { MapDef, HalfTileOrientation } from '../types';
import { hash2 } from '../materials';

export const CELL = 5;      // feet per cell -> world units per cell
export const WALL_H = 16;   // wall mesh height (ft)

export interface Collider {
  x1: number; z1: number; x2: number; z2: number;
  yMin: number; yMax: number;
  decor?: boolean;
  rotY?: number;
  cx?: number;
  cz?: number;
}

/** Pushes an exact oriented bounding collider rotated around root (x, z) */
export function addRotatedCollider(
  colliders: Collider[],
  rootX: number,
  rootZ: number,
  localX: number,
  localZ: number,
  halfW: number,
  halfD: number,
  yMin: number,
  yMax: number,
  rotY = 0,
  decor = false
) {
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const worldX = rootX + localX * cos - localZ * sin;
  const worldZ = rootZ + localX * sin + localZ * cos;

  colliders.push({
    x1: worldX - halfW,
    x2: worldX + halfW,
    z1: worldZ - halfD,
    z2: worldZ + halfD,
    cx: worldX,
    cz: worldZ,
    rotY,
    yMin,
    yMax,
    decor
  });
}

/** P3.3 streamed world: one built overworld region placed at its world offset. */
export interface RegionHandle {
  id: string;
  rx: number; rz: number;
  origin: { x: number; z: number };
  group: THREE.Group;
  open: Uint8Array;
  blockedHalfTiles: Map<number, Set<'nw' | 'ne' | 'se' | 'sw'>>;
  colliders: Collider[];              // world feet
  exits: { id: string; label: string; x: number; z: number }[];  // world feet
  map: MapDef;
  minX: number; minZ: number; maxX: number; maxZ: number;
  waterMaterial: THREE.MeshStandardMaterial | null;
  grassMaterial: THREE.MeshStandardMaterial | null;
}

export interface ScatterItem {
  x: number; y: number; z: number; s: number;
  rx: number; ry: number; rz: number;
  r: number; g: number; b: number;
  quat?: THREE.Quaternion;
}

export function normalizeHalfTile(orientation?: string): 'nw' | 'ne' | 'se' | 'sw' {
  if (!orientation) return 'nw';
  const o = orientation.toLowerCase();
  if (o === 'tl' || o === 'top_left' || o === 'nw' || o === 'northwest') return 'nw';
  if (o === 'tr' || o === 'top_right' || o === 'ne' || o === 'northeast') return 'ne';
  if (o === 'br' || o === 'bottom_right' || o === 'se' || o === 'southeast') return 'se';
  if (o === 'bl' || o === 'bottom_left' || o === 'sw' || o === 'southwest') return 'sw';
  return 'nw';
}

export function isPointInHalfTile(u: number, v: number, orientation?: HalfTileOrientation): boolean {
  const norm = normalizeHalfTile(orientation);
  if (norm === 'nw') return u + v <= 1.0;
  if (norm === 'se') return u + v >= 1.0;
  if (norm === 'ne') return u >= v;
  if (norm === 'sw') return u <= v;
  return true;
}

// ── world-anchored scatter fields ──────────────────────────────────────────
// Smooth value noise built on the shared hash2. Build passes key these on
// WORLD cell coords (region origin + local cell) so patches continue across
// region seams instead of repeating per region.

function vnoise(gx: number, gz: number, scale: number, salt: number): number {
  const fx = gx / scale, fz = gz / scale;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const rawX = fx - ix, rawZ = fz - iz;
  const tx = rawX * rawX * (3 - 2 * rawX);
  const tz = rawZ * rawZ * (3 - 2 * rawZ);
  const a = hash2(ix, iz, salt), b = hash2(ix + 1, iz, salt);
  const c = hash2(ix, iz + 1, salt), d = hash2(ix + 1, iz + 1, salt);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

/** 0..1 bare-dirt field. Above ~0.6 the terrain reads as a dirt splat: flora
 *  stays bare, props drop pebbles, and the floor tint shifts toward soil. */
export function dirtField(wx: number, wz: number): number {
  return vnoise(wx, wz, 21, 9101) * 0.68 + vnoise(wx, wz, 8.5, 9102) * 0.32;
}

/** 0..1 wild-grass patch field (taller straw tussocks in meadow country). */
export function wildGrassField(wx: number, wz: number): number {
  return vnoise(wx, wz, 17, 9301) * 0.7 + vnoise(wx, wz, 7, 9302) * 0.3;
}

/** 0..1 transition-softness field for the grass-type boundary. Where this is
 *  low the tussock edge stays crisp (hard mown lines exist in nature); where
 *  high, the two grass types intermix across a wide gradient band. */
export function grassBlendField(wx: number, wz: number): number {
  return vnoise(wx, wz, 11, 9311) * 0.65 + vnoise(wx, wz, 4.5, 9312) * 0.35;
}

/** 0..1 wildflower patch field (meadow forbs bloom in noise-driven clusters). */
export function flowerField(wx: number, wz: number): number {
  return vnoise(wx, wz, 13, 9411) * 0.66 + vnoise(wx, wz, 5.5, 9412) * 0.34;
}

/** 0..1 shrub-stand field (low woody clumps dot open meadow in sparse stands). */
export function shrubField(wx: number, wz: number): number {
  return vnoise(wx, wz, 24, 9511) * 0.7 + vnoise(wx, wz, 9, 9512) * 0.3;
}
