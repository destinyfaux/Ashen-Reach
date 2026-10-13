// Shared engine types
export interface WallSeg {
  x1: number; z1: number; x2: number; z2: number;
  type: 'normal' | 'door' | 'secret_door' | 'window';
  isOpen?: boolean;
  locked?: boolean;
  revealed?: boolean;
}
export interface LightDef { x: number; z: number; radiusFt: number; color: string; flicker: boolean; }
export interface PropDef {
  type: string; x: number; z: number; rotY?: number;
  scale?: number; variant?: string; shape?: string; label?: string; clusterId?: string;
  width?: number; depth?: number;
}
export interface WorldCluster {
  id: string; biome: string; rule: string; x: number; z: number;
  radius: number; count?: number; variants?: string[];
}
export interface RoomRect {
  id: number; x1: number; z1: number; x2: number; z2: number; module: string;
}
export interface MapExit {
  id: string; label: string; x: number; z: number;
  destinationMapId?: string; returnToPrevious?: boolean;
}
export type HalfTileOrientation =
  | 'nw' | 'ne' | 'se' | 'sw'
  | 'tl' | 'tr' | 'br' | 'bl';

export type TileCell = [number, number] | [number, number, HalfTileOrientation];

export interface HalfTileDef {
  x: number;
  z: number;
  type: 'water' | 'road' | 'wall' | 'floor';
  orientation: HalfTileOrientation;
}

export interface MapDef {
  id: string; name: string;
  size: { w: number; h: number };
  theme: string; floor: string;
  tileSet?: string;
  cells: {
    wall: TileCell[];
    water?: TileCell[];
    waterSurfaceFt?: (number | null)[];
    road?: TileCell[];
    halfTiles?: HalfTileDef[];
  };
  walls: WallSeg[];
  lights: LightDef[];
  props: PropDef[];
  spawns: { party: [number, number][]; monsters: any[] };
  exits?: MapExit[];
  terrain?: { width: number; height: number; heightFt: number[] };
  biomes?: { kinds: string[]; cells: number[] };
  biomeBounds?: Record<string, { x: number; z: number; radiusX: number; radiusZ: number }[]>;
  clusters?: WorldCluster[];
  pointsOfInterest?: { id: string; kind: string; label: string; x: number; z: number; exitId?: string }[];
  roomRects?: RoomRect[];
  bossRoom?: number | null;
}
// TokenLook — additive per-actor appearance (T2-c rig / T2-e character creation).
// Every field optional; producers may send partial data. Producers: character
// creation UI (players), DM spawn / boss (monsters). Consumers: Actors.ts rig.
export interface TokenLook {
  bodyType?: 'lean' | 'standard' | 'broad' | 'tall'; // proportions preset (default 'standard')
  skinTone?: string;      // hex, e.g. '#c9ac8e' — head/hands (default per archetype)
  hair?: 'none' | 'short' | 'long' | 'topknot';      // hair style (default per archetype)
  hairColor?: string;     // hex
  hoodUp?: boolean;       // cowl raised over the head (default per archetype)
  cloakColor?: string;    // hex — cloak + hood cloth
  clothTint?: string;     // hex — tunic/legs base tint
  seed?: number;          // deterministic micro-variation (height ±3%, cloth jitter)
}
export interface TokenView {
  id: string; kind: string; ownerId: string; name: string; color?: string;
  archetype: string; x: number; z: number; rotY: number;
  hp: number; hpMax: number; ac: number; speedFt: number;
  deathSaves?: { ok: number; fail: number; stable: boolean; dead: boolean } | null;
  conditions: string[]; size: number; hidden: boolean; wander?: boolean;
  look?: TokenLook;
}
export type ActionFx = {
  anim: 'lunge' | 'spell' | 'shoot' | 'heal' | 'hit' | 'crit' | 'miss' | 'die' | 'buff';
  power?: number; dir?: number; ms?: number;
};
