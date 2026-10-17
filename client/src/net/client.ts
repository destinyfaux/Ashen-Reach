// net/client.ts — native WebSocket client. Single socket, JSON envelope
// {ev: '<event>', data: {...}}. Event names FROZEN per docs/CONTRACTS.md.
//
// Dispatch design (documented in worklog):
//   state:sync  → first join: store.setJoined + Bus MAP_LOAD / TOKENS_SYNC /
//                 ENV_SYNC (engine bootstrap); reconnect: store.applyPatch full
//   state:patch → store.applyPatch (players/tokens/chat/mapName/dayTime/
//                 weather) + Bus TOKENS_SYNC / ENV_SYNC; mapId change → map
//                 fetched from /api/map/:id (or inline def) → Bus MAP_LOAD
//   fx:action   → Bus EV.FX        (engine plays the animation)
//   roll:show   → Bus EV.ROLL      (HUD dice toast — no store churn)
//   prompt      → Bus EV.PROMPT    (HUD agency card)
//   session:error → Bus EV.ERROR; drops back to the join screen only when
//                 not already playing (mid-game rejections surface as toasts)
//
// FROZEN EXPORTS (engine files import these — signatures fixed):
//   sendMove(x, z, rotY) · joinSession(invite, name, archetype) ·
//   say(text) · dmCmd(op, payload) · connect(url?)
// Extras (additive, safe): sendAction, endTurn, replayBootstrap, sheetOp,
//   close.
import { Bus, EV } from '../engine/bus';
import { useGame } from '../game/store';
import type { ChatMsg, DoorState, PlayerInfo, TokenState } from '../game/store';

type StorePatch = Partial<{
  players: PlayerInfo[]; tokens: TokenState[]; chat: ChatMsg[];
  doors: DoorState[];
  mapName: string; dayTime: number; weather: string; initiative: unknown;
}>;

let ws: WebSocket | null = null;
let wsOpen = false;
let attempt = 0;                 // reconnect attempt counter (reset on open)
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let closingIntentionally = false;
let lastVersion = -1;            // state:patch de-dupe / ordering
let currentMapId = '';           // detect map switches in patches

// P3.3 streamed world: cached region defs fetched from /api/map/:id
const regionCache = new Map<string, unknown>();
const regionFetching = new Set<string>();
const REGION_CACHE_MAX = 40;
function regionIdOf(rx: number, rz: number): string {
  if (rx === 0 && rz === 0) return 'ashen_reach';
  const enc = (n: number) => (n < 0 ? 'm' + Math.abs(n) : String(n));
  return `w${enc(rx)}_${enc(rz)}`;
}

/** Ensure the focus region + its 1-ring are fetched and emitted to the engine.
 *  The focus def goes first so the engine can theme immediately. */
function ensureWorldRegions() {
  const w = useGame.getState().world;
  if (!w) return;
  void fetchRegion(regionIdOf(w.focus.rx, w.focus.rz), 0);
  let i = 0;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dz === 0) continue;
      void fetchRegion(regionIdOf(w.focus.rx + dx, w.focus.rz + dz), ++i);
    }
  }
}

async function fetchRegion(id: string, stagger = 0) {
  if (regionFetching.has(id)) return;
  const cached = regionCache.get(id);
  if (cached) {
    // Cached defs must still be RE-EMITTED: the engine can legitimately have
    // torn the region down since (entering a dungeon wipes every built
    // overworld region — TileGrid.build retains nothing), and a silent return
    // here is how the post-exit world got stuck on the focus region alone.
    // addRegion() is idempotent for regions still held, so in the common case
    // this is free. Re-emits are staggered so rebuilding a whole ring after a
    // dungeon exit never stalls one frame with 8 geometry builds, and dropped
    // if we've since gone back indoors (stale timer could otherwise mount a
    // world region over a dungeon scene).
    setTimeout(() => {
      if (useGame.getState().world) Bus.emit(EV.MAP_LOAD, cached);
    }, stagger * 40);
    return;
  }
  regionFetching.add(id);
  try {
    const r = await fetch(`/api/map/${encodeURIComponent(id)}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const map = await r.json();
    regionFetching.delete(id);
    regionCache.set(id, map);
    if (regionCache.size > REGION_CACHE_MAX) {
      const oldest = regionCache.keys().next().value;
      if (oldest !== undefined && oldest !== useGame.getState().world?.mapId) regionCache.delete(oldest);
    }
    Bus.emit(EV.MAP_LOAD, map);
  } catch (e) {
    regionFetching.delete(id);
    console.error('[net] region fetch failed', id, e);
  }
}

// latest bootstrap snapshot — replayed for the engine if it boots after the
// first sync (engine constructs on phase 'playing', sync arrives on join)
let lastMap: unknown = null;
let lastTokens: unknown[] | null = null;
let lastEnv: { dayNight?: unknown; weather?: unknown } | null = null;
let lastDoors: DoorState[] = [];

// join payload cached so a reconnect can reclaim the seat (resumeId first,
// full re-join as fallback if the server forgot us)
const JOIN_STORAGE_KEY = 'ar_join';
function loadPendingJoin(): Record<string, unknown> | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(JOIN_STORAGE_KEY) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

let pendingJoin: Record<string, unknown> | null = loadPendingJoin();
let joinedOnce = false;
let joinQueued = false;

// messages queued while the socket is down (flushed on open)
const queue: string[] = [];
const QUEUE_MAX = 100;

// ─── connection ────────────────────────────────────────────────────────────
export function connect(url?: string): WebSocket {
  if (ws && ws.readyState <= 1) return ws;
  closingIntentionally = false;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(url || `${proto}//${location.host}/ws`);
  ws.onopen = onOpen;
  ws.onmessage = onMessage;
  ws.onclose = onClose;
  ws.onerror = () => { /* close follows */ };
  return ws;
}

function onOpen() {
  wsOpen = true;
  attempt = 0;
  const g = useGame.getState();
  g.setConnection('online');
  if (g.phase === 'connecting') g.setPhase('join');
  // flush queued envelopes
  const hadQueuedJoin = joinQueued;
  joinQueued = false;
  while (queue.length) {
    const raw = queue.shift()!;
    ws?.send(raw);
  }
  // reclaim a previous seat after a drop
  if (!hadQueuedJoin && pendingJoin && (joinedOnce || sessionStorage.getItem('ar_uid'))) {
    send('session:join', { ...pendingJoin, resumeId: sessionStorage.getItem('ar_uid') || undefined });
  }
}

function onClose() {
  wsOpen = false;
  ws = null;
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = null;
  useGame.setState({ pingMs: null });
  if (closingIntentionally) return;
  useGame.getState().setConnection('reconnecting');
  // exponential backoff: 0.5s → 1s → 2s → 4s → 8s (cap) ± 20% jitter
  const delay = Math.min(8000, 500 * 2 ** attempt) * (0.8 + Math.random() * 0.4);
  attempt++;
  if (attempt >= 3) {
    Bus.emit(EV.ERROR, { message: 'WebSocket connection failed (502 / proxy error). If tunneling, ensure your tunnel supports WebSockets.' });
  }
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => { retryTimer = null; connect(); }, delay);
}

// ─── envelope send ─────────────────────────────────────────────────────────
function send(ev: string, data: unknown) {
  const raw = JSON.stringify({ ev, data });
  if (ws && wsOpen) ws.send(raw);
  else if (queue.length < QUEUE_MAX) queue.push(raw);
}

// ─── dispatch ──────────────────────────────────────────────────────────────
function onMessage(e: MessageEvent) {
  let msg: { ev?: string; data?: any };
  try { msg = JSON.parse(String(e.data)); } catch { return; }
  if (!msg || typeof msg.ev !== 'string') return;
  const data = msg.data ?? {};
  try {
    dispatch(msg.ev, data);
  } catch (err) {
    console.error(`[net] dispatch ${msg.ev}`, err);
  }
}

function dispatch(ev: string, data: any) {
  const g = useGame.getState;
  switch (ev) {
    case 'state:sync': {
      const st = data.state || {};
      lastVersion = typeof data.version === 'number' ? data.version : st.version ?? -1;
      if (st.inviteCode) useGame.setState({ inviteCode: st.inviteCode });
      if (st.world) useGame.setState({ world: st.world });
      if (data.map) { lastMap = data.map; currentMapId = data.map.id || ''; }
      lastTokens = st.tokens || [];
      lastDoors = st.doors || [];
      lastEnv = { dayNight: st.dayNight, weather: st.weather };

      if (data.you) {
        // first successful join (or reconnect reclaim) → playing
        sessionStorage.setItem('ar_uid', data.you.id);
        joinedOnce = true;
        g().setJoined(data.you, st.players || [], st.tokens || [], st.mapName || st.mapId || '');
        // A reconnect/bootstrap may arrive after combat ended while this client
        // was away; never retain an obsolete turn gate from the previous state.
        useGame.setState({ initiative: st.initiative ?? null });
      } else {
        g().applyPatch({
          players: st.players, tokens: st.tokens, chat: st.chat,
          mapName: st.mapName || st.mapId,
          dayTime: st.dayNight?.time, weather: st.weather?.type
        });
      }
      useGame.setState({
        chat: st.chat || [],
        doors: lastDoors,
        dayTime: st.dayNight?.time ?? useGame.getState().dayTime,
        weather: st.weather?.type ?? useGame.getState().weather
      });
      // engine bootstrap events
      if (data.map) Bus.emit(EV.MAP_LOAD, data.map);
      else if (st.mapId && st.mapId !== currentMapId) void fetchMap(st.mapId);
      Bus.emit(EV.DOORS_SYNC, lastDoors);
      Bus.emit(EV.TOKENS_SYNC, st.tokens || []);
      Bus.emit(EV.ENV_SYNC, lastEnv);
      Bus.emit(EV.JOINED, data);
      ensureWorldRegions();
      break;
    }

    case 'state:patch': {
      if (typeof data.version === 'number') {
        if (data.version <= lastVersion) return; // stale / duplicate
        lastVersion = data.version;
      }
      const patch: StorePatch = {};
      if (data.world !== undefined) useGame.setState({ world: data.world });
      if (data.players) patch.players = data.players;
      const mapId = data.mapId as string | undefined;
      const mapChanged = !!mapId && mapId !== currentMapId;
      if (data.tokens) {
        patch.tokens = data.tokens;
        lastTokens = data.tokens;
        if (!mapChanged) Bus.emit(EV.TOKENS_SYNC, data.tokens);
      }
      if (data.chat) patch.chat = data.chat;
      if (data.mapName || data.mapId) patch.mapName = data.mapName || data.mapId;
      if (data.dayNight) { patch.dayTime = data.dayNight.time; }
      if (data.weather) { patch.weather = data.weather.type; }
      if (data.initiative !== undefined) { patch.initiative = data.initiative; }
      if (data.doors) { patch.doors = data.doors; lastDoors = data.doors; }
      g().applyPatch(patch);
      if (data.dayNight || data.weather) {
        lastEnv = {
          dayNight: data.dayNight ?? (lastEnv?.dayNight as any),
          weather: data.weather ?? lastEnv?.weather
        };
        Bus.emit(EV.ENV_SYNC, lastEnv);
      }
      // map switch mid-session
      if (mapChanged) {
        if (data.map) {
          currentMapId = data.map.id || mapId!;
          lastMap = data.map;
          Bus.emit(EV.MAP_LOAD, data.map);
          Bus.emit(EV.DOORS_SYNC, lastDoors);
          Bus.emit(EV.TOKENS_SYNC, lastTokens || []);
          // Region re-entry (leaving a dungeon): building the dungeon map wiped
          // every locally built region (TileGrid.build retains nothing) and the
          // inline def only restores the focus region — without this refetch
          // the world stays a single region until the next border crossing.
          // regionCache/fetch guards make this free for anything still held.
          if (data.map.region) ensureWorldRegions();
        } else {
          currentMapId = mapId!;
          if (data.world && data.world.mapId === mapId) {
            // streamed region focus shift: fetch focus + ring, no inline def
            ensureWorldRegions();
          } else {
            void fetchMap(mapId!);
          }
        }
      }
      else if (data.doors) Bus.emit(EV.DOORS_SYNC, data.doors);
      break;
    }

    case 'fx:action': Bus.emit(EV.FX, data); break;
    case 'roll:show': Bus.emit(EV.ROLL, data); break;
    case 'prompt': Bus.emit(EV.PROMPT, data); break;
    case 'move:rejected': Bus.emit(EV.MOVE_REJECTED, data); break;

    case 'session:error': {
      Bus.emit(EV.ERROR, data);
      const s = useGame.getState();
      // mid-game rejections (e.g. move_rejected) surface as HUD toasts instead
      // of dumping the player back to the join screen
      if (s.phase !== 'playing' && data.code !== 'move_rejected' && data.code !== 'dm') {
        s.setPhase('join');
      }
      break;
    }

    case 'net:pong':
      if (Number.isFinite(data.sentAt)) useGame.setState({ pingMs: Math.max(0, Date.now() - data.sentAt) });
      break;

    default:
      break; // unknown events are ignored (forward-compat)
  }
}

async function fetchMap(mapId: string) {
  try {
    const r = await fetch(`/api/map/${encodeURIComponent(mapId)}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const map = await r.json();
    currentMapId = map.id || mapId;
    lastMap = map;
    if (map.region) regionCache.set(mapId, map);
    Bus.emit(EV.MAP_LOAD, map);
    Bus.emit(EV.DOORS_SYNC, lastDoors);
    Bus.emit(EV.TOKENS_SYNC, lastTokens || []);
  } catch (e) {
    console.error('[net] map fetch failed', mapId, e);
  }
}

/** Re-emit the latest map/tokens/env onto the Bus. Called right after the 3D
 *  engine boots (it subscribes to the Bus in its constructor, which can be
 *  after the first state:sync arrived). */
export function replayBootstrap() {
  if (lastMap) Bus.emit(EV.MAP_LOAD, lastMap);
  Bus.emit(EV.DOORS_SYNC, lastDoors);
  if (lastTokens) Bus.emit(EV.TOKENS_SYNC, lastTokens);
  if (lastEnv) Bus.emit(EV.ENV_SYNC, lastEnv);
  // the engine missed the ring-region fetches that ran before it existed
  ensureWorldRegions();
}

// ─── frozen intent API ─────────────────────────────────────────────────────
export function sendMove(x: number, z: number, rotY: number) {
  send('intent:move', { x, z, rotY });
}

export function sendDoorIntent(wallIndex: number) {
  send('intent:door', { wallIndex });
}

export function sendExitIntent(exitId: string) {
  send('intent:exit', { exitId });
}

/** opts is additive: { dm?: boolean, dmKey?: string, resumeId?: string }. */
export function joinSession(invite: string, name: string, archetype: string, opts: Record<string, unknown> = {}) {
  pendingJoin = { invite, name, archetype, ...opts };
  sessionStorage.setItem(JOIN_STORAGE_KEY, JSON.stringify(pendingJoin));
  // FIX 11: after close() (Return to the Main Menu) the socket is down and
  // the reconnect backoff is suppressed — reopen it so the queued
  // session:join actually reaches the server (the join screen does not
  // know the socket died).
  if (!ws || ws.readyState > 1) connect();
  if (!wsOpen) joinQueued = true;
  send('session:join', { invite, name, archetype, ...opts, resumeId: sessionStorage.getItem('ar_uid') || undefined });
}

export function say(text: string) {
  send('chat:say', { text });
}

export function dmCmd(op: string, payload: any) {
  send('dm:cmd', { op, payload });
}

// ─── extra intents (CombatEngine, T2-b) ────────────────────────────────────
export function sendAction(req: unknown) {
  send('intent:action', req as any);
}
export function endTurn() {
  send('intent:endTurn', {});
}

// ─── FIX 11 — sheet/inventory ops + intentional disconnect ────────────────
/** Sheet operations use item names for inventory actions and Hit Dice count
 *  for short rests; results return through the normal state/chat events. */
export function sheetOp(op: 'equip' | 'use' | 'get' | 'shortRest' | 'longRest', item?: string | number) {
  send('intent:sheet', typeof item === 'number' ? { op, hitDice: item } : item ? { op, itemId: item } : { op });
}

/** Intentional disconnect (FIX 11: Return to the Main Menu). Tells the server
 *  to sweep the seat (session:leave), suppresses the reconnect backoff, and
 *  clears cached join state so the next session:join starts clean —
 *  joinSession() reopens the socket when the player enters the reach again. */
export function close(): void {
  closingIntentionally = true;
  pendingJoin = null;
  joinedOnce = false;
  joinQueued = false;
  sessionStorage.removeItem(JOIN_STORAGE_KEY);
  lastVersion = -1;
  currentMapId = '';
  queue.length = 0;
  regionCache.clear();
  regionFetching.clear();
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  if (ws && wsOpen) {
    try { ws.send(JSON.stringify({ ev: 'session:leave', data: {} })); } catch { /* socket already dying */ }
  }
  if (ws) { try { ws.close(1000, 'menu'); } catch { /* already closing */ } }
  ws = null;
  wsOpen = false;
  useGame.getState().setConnection('offline');
}
