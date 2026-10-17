// tilegrid/trees.ts — tree pass: species classification, colliders, asset
// instancing. Wave 1 of the asset pipeline: the per-species procedural mesh
// builders (763 lines of primitive assembly) are replaced by cooked kit
// assets (foliage.glb / nature.glb — see tools/cook_wave1.mjs) instanced
// through the AssetLibrary. Variant pick + tint are deterministic position
// hashes, so a given spot always grows the same tree.
//
// Seasonal gating: the kit's TwistedTree models render deep crimson (an
// autumn read), and the maples are orange-red — both are RESERVED for the
// 'autumn' variant the generators now emit only as rare forest/riverside
// accents. Meadows receive only green oak/ash maples. The legacy 'willow'
// bucket stays mapped to TwistedTree for regions generated before the
// server-side gating shipped.
//
// IMPORTANT: every emit (immediate or deferred via whenAssetsReady) targets
// the REGION GROUP captured below — grid.group mutates as regions stream, so
// touching grid.group from a deferred callback would pile this region's
// instances into whatever region built last (the origin-cluster bug).
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import type { TileGrid } from '../TileGrid';
import type { PropDef } from '../types';
import { hash2 } from '../materials';
import { CELL } from './shared';
import { scatterAsset, whenAssetsReady, assetsReady } from '../assets';

type TreeData = { tree: PropDef; scale: number; x: number; z: number; ground: number };

// Cooked kit models per species bucket, normalized to a target height in feet
// (silhouettes match the procedural builders they replace). lowgfx mode uses
// only the first variant per species.
const SPECIES: Record<string, { models: string[]; height: number }> = {
  hardwood: { models: ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5'], height: 26 },
  conifer: { models: ['Pine_1', 'Pine_2', 'Pine_3', 'Pine_4', 'Pine_5'], height: 30 },
  birch: { models: ['BirchTree_1', 'BirchTree_2', 'BirchTree_3', 'BirchTree_4', 'BirchTree_5'], height: 24 },
  autumn: { models: ['MapleTree_1', 'MapleTree_2', 'MapleTree_3', 'MapleTree_4', 'MapleTree_5'], height: 26 },
  willow: { models: ['TwistedTree_1', 'TwistedTree_2', 'TwistedTree_3', 'TwistedTree_4', 'TwistedTree_5'], height: 24 },
  dead: { models: ['DeadTree_1', 'DeadTree_2', 'DeadTree_3', 'DeadTree_4', 'DeadTree_5'], height: 20 },
};

export function buildTrees(grid: TileGrid, trees: PropDef[]) {
  if (!trees.length) return;
  const group = grid.group;   // this region's group — captured for deferred emits

  const height = (tree: PropDef) => (tree.scale || 1) * (tree.variant === 'dead' ? 1.15 : 1);
  const buckets: Record<string, TreeData[]> = {
    hardwood: [], conifer: [], willow: [], birch: [], autumn: [], dead: [],
  };

  trees.forEach((tree) => {
    const scale = height(tree);
    const x = tree.x * CELL, z = tree.z * CELL;
    const ground = grid.terrainHeightAt(x, z);
    const data = { tree, scale, x, z, ground };

    if (tree.variant === 'dead') {
      buckets.dead.push(data);
    } else if (tree.variant === 'autumn') {
      buckets.autumn.push(data);
    } else if (tree.variant === 'pine' || tree.variant === 'snowpine') {
      buckets.conifer.push(data);
    } else if (tree.variant === 'willow') {
      buckets.willow.push(data);
    } else if (tree.variant === 'birch') {
      buckets.birch.push(data);
    } else {
      buckets.hardwood.push(data);
    }

    // Authoritative physical trunk collider footprint matching large towering trees
    const colliderRadius = Math.max(0.7, scale * 0.4);
    grid.colliders.push({
      x1: x - colliderRadius,
      z1: z - colliderRadius,
      x2: x + colliderRadius,
      z2: z + colliderRadius,
      yMin: 0,
      yMax: 32 * scale,
    });
  });

  const emit = () => {
    let salt = 0;
    for (const [species, list] of Object.entries(buckets)) {
      salt++;
      if (!list.length) continue;
      const cfg = SPECIES[species];
      const pool = grid.eng.lowgfx ? [cfg.models[0]] : cfg.models;
      scatterAsset(grid, pool, list.map((it) => ({
        x: it.x, y: it.ground, z: it.z,
        s: it.scale,
        ry: hash2(it.tree.x, it.tree.z, 6103) * Math.PI * 2,
        tint: treeTint(species, it),
      })), { height: cfg.height, sink: 0.85, group }, salt);
    }
  };

  if (assetsReady()) emit();
  else whenAssetsReady(() => { if (group.parent) emit(); });
}

/** Per-tree color multiplier: subtle brightness jitter everywhere, a cool
 *  whitening wash for snowpine canopies, a desaturated pallor for deadwood. */
function treeTint(species: string, it: TreeData): [number, number, number] {
  const j = 0.9 + hash2(it.tree.x * 2 + 1, it.tree.z * 3 + 7, 6107) * 0.2;
  if (species === 'conifer' && it.tree.variant === 'snowpine') return [0.72 * j, 0.82 * j, 0.94 * j];
  if (species === 'dead') return [0.85 * j, 0.8 * j, 0.76 * j];
  return [j, j, j];
}
