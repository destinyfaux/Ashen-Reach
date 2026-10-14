// game/store.ts — tiny reactive store, zustand-API-compatible (getState/setState/subscribe).
// Engine modules call useGame.getState(); vanilla UI modules call useGame.subscribe().
// NO React, NO zustand import — this is the whole state library (~50 lines).

export interface PlayerInfo { id: string; name: string; color: string; role: 'dm' | 'player'; online: boolean; }
export interface TokenState {
  id: string; kind: 'player' | 'monster' | 'npc';
  ownerId: string; name: string; color?: string; archetype: string;
  x: number; z: number; rotY: number;
  hp: number; hpMax: number; ac: number; speedFt: number;
  conditions: string[]; size: number; hidden: boolean; wander?: boolean;
  deathSaves?: { ok: number; fail: number; stable: boolean; dead: boolean } | null;
  initiative?: number;
  actionUsed?: boolean;
  bonusUsed?: boolean;
}
export interface ChatMsg { from: string; color?: string; text: string; t: number; }
export interface DoorState {
  wallIndex: number;
  open: boolean;
  locked: boolean;
  secret: boolean;
  revealed: boolean;
  x1?: number;
  z1?: number;
  x2?: number;
  z2?: number;
}

export type Phase = 'connecting' | 'join' | 'create' | 'playing';

export interface GameStore {
  phase: Phase;
  me: PlayerInfo | null;
  players: PlayerInfo[];
  tokens: TokenState[];
  doors: DoorState[];
  myTokenId: string | null;
  chat: ChatMsg[];
  mapName: string;
  /** P3.3 streamed overworld info; null while in a dungeon/menu. */
  world: { seed: number; regionW: number; regionH: number; focus: { rx: number; rz: number }; mapId: string } | null;
  dayTime: number;          // minutes 0..1440
  weather: string;
  interactLabel: string | null;
  connection: 'offline' | 'online' | 'reconnecting';
  pingMs: number | null;
  initiative: unknown | null;      // {order, turnIdx, round, movement} while combat is on
  // actions
  setPhase: (p: Phase) => void;
  setJoined: (me: PlayerInfo, players: PlayerInfo[], tokens: TokenState[], mapName: string) => void;
  applyPatch: (p: Partial<{ players: PlayerInfo[]; tokens: TokenState[]; doors: DoorState[]; chat: ChatMsg[]; mapName: string; world: GameStore['world']; dayTime: number; weather: string; initiative: any }>) => void;
  setInteract: (label: string | null) => void;
  setConnection: (c: GameStore['connection']) => void;
}

type Listener = (state: GameStore, prev: GameStore) => void;

function createStore(initial: GameStore) {
  let state = initial;
  const listeners = new Set<Listener>();
  const setState = (patch: Partial<GameStore>) => {
    const prev = state;
    state = { ...state, ...patch };
    for (const l of listeners) l(state, prev);
  };
  return {
    getState: () => state,
    setState,
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const useGame = createStore({
  phase: 'connecting',
  me: null,
  players: [],
  tokens: [],
  doors: [],
  myTokenId: null,
  chat: [],
  mapName: '',
  world: null,
  dayTime: 21 * 60,
  weather: 'clear',
  interactLabel: null,
  connection: 'offline',
  pingMs: null,
  initiative: null,
  setPhase: (p) => useGame.setState({ phase: p }),
  setJoined: (me, players, tokens, mapName) => useGame.setState({
    phase: 'playing', me, players, tokens, mapName,
    myTokenId: 'tok_' + me.id.slice(2),
  }),
  applyPatch: (p) => useGame.setState(p as Partial<GameStore>),
  setInteract: (label) => useGame.setState({ interactLabel: label }),
  setConnection: (c) => useGame.setState({ connection: c }),
});
