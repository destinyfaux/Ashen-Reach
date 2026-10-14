// worldProbe — lightweight shared snapshot between the engine and the HUD
// world-minimap (P3.7). The engine writes on region add/prune and each tick;
// the HUD reads on its own animation loop. No Bus churn, no store churn:
// the region arrays are rebuilt only when the streamed region set changes.
export interface WorldProbeRegion {
  id: string;
  rx: number;
  rz: number;
  name: string;
  w: number;
  h: number;
  originX: number;
  originZ: number;
  /** per-cell biome index into kinds (ArrayLike so server arrays fit) */
  biome: ArrayLike<number> | null;
  kinds: string[];
  /** 1 = water cell, 1 = road cell (cell order, w*h) */
  water: Uint8Array | null;
  road: Uint8Array | null;
  /** fog explored memory (cell order, w*h); null until fog builds */
  explored: Uint8Array | null;
}

export const worldProbe = {
  /** true while the streamed overworld is on screen (dungeons hide the map) */
  active: false,
  player: { x: 0, z: 0, rotY: 0 },
  regions: [] as WorldProbeRegion[],
};

export type WorldProbe = typeof worldProbe;
