# ASHENREACH — Contracts (shared interfaces)

This document summarizes shared interfaces for contributors working alone or in parallel.
It is not permission to assume subagents exist. Verify declarations and behavior in source
before changing them; update this document when shared interfaces change. The client is
framework-free TypeScript/DOM; the server is ESM JavaScript.

## Engine ↔ World data
```ts
// engine/TileGrid.ts
interface MapDef { /* see ARCHITECTURE.md map format */ }
interface MapExit {
  id: string; label: string; x: number; z: number; // map cell coordinates
  destinationMapId?: string; returnToPrevious?: boolean;
}
TileGrid.load(map: MapDef): void
TileGrid.isBlocked(x: number, z: number): boolean        // world coords, cell center
TileGrid.cellOf(x: number, z: number): {cx: number, cz: number}
TileGrid.worldOf(cx: number, cz: number): {x: number, z: number} // center of cell

// P3.3 streamed world (region defs carry `region` + `worldOriginFt`):
TileGrid.addRegion(map: MapDef): RegionHandle | null     // additive build at world offset
TileGrid.removeRegion(id: string): void
TileGrid.retainRegions(keep: Set<string>): void          // prune beyond the stream ring
TileGrid.setFocusRegion(id: string): MapDef | null
TileGrid.regionAt(x: number, z: number): RegionHandle | null
TileGrid.nearestExitWorld(x: number, z: number, radiusFt?): { id, distance, label } | null
// isOpenWorld / isBlocked / terrainHeightAt / resolve are region-aware when
// grid.worldMode is true (they resolve the region containing the query point).

// engine/FogOfWar.ts — dungeon-only since P3.7b; the streamed overworld is
// always revealed (no region fog planes) and world-mode visibility is always true
FogOfWar.build(map: MapDef)                // dungeon/single-map layer
FogOfWar.buildRegion(map: MapDef)          // API compat; no longer called for streamed regions
FogOfWar.removeRegion(id) / retainRegions(keep) / clearRegions()
FogOfWar.isExplored(cx, cz): boolean       // true in world mode; dungeon layer otherwise
FogOfWar.isVisible(cx, cz): boolean        // true in world mode; dungeon layer otherwise
FogOfWar.exploredFor(id): Uint8Array | null // null in world mode (HUD minimap shows all)

// P3.7 world minimap probe (engine writes, HUD reads)
engine/worldProbe.ts
worldProbe: { active: boolean, player: {x, z, rotY}, regions: WorldProbeRegion[] }
WorldProbeRegion: { id, rx, rz, name, w, h, originX, originZ,
                    biome: ArrayLike<number> | null, kinds: string[],
                    water: Uint8Array | null, road: Uint8Array | null,
                    explored: Uint8Array | null }
// Rebuilt on every region add/prune (Engine.syncWorldProbe); player position
// is refreshed every tick. Dungeon loads set active = false and clear regions.
```

## WebSocket protocol (`ws` JSON envelopes)

Transport is the `ws` package on `/ws`; messages are JSON `{ ev: string, data: object }`.
The list below is a guide, not an exhaustive schema—see `server/src/ws.js` and
`client/src/net/client.ts` as the implementation. Keep both ends and this document aligned.
Client → Server:
```
'session:join'   {invite, name, archetype, dm?, dmKey?, resumeId?} → personalized 'state:sync'
'session:leave'
'intent:move'    {x, z, rotY}                               // server-validated world position
'intent:door'    {wallIndex}                                // toggle nearby unlocked door
'intent:exit'    {exitId}                                   // nearby map transition, outside combat
'intent:action'  ActionRequest                              // includes help rescue + acceptDeath
'intent:endTurn'
'intent:dialog'  {npcId, choiceId}
'intent:sheet'   {op: 'equip'|'use'|'get'|'shortRest'|'longRest', itemId?, hitDice?}
'dm:cmd'         {op: string, payload}                     // DM only (spawn, weather, daynight, map, door...)
'chat:say'       {text}
```
Server → Client:
```
'state:sync'     {you, version, state, map}                 // personalized full join snapshot
'state:patch'    {version, ...changed state fields}         // personalized broadcast
'fx:action'      {actorId, action: ActionFx, result: ActionResult}  // play + log
'roll:show'      {formula, rolls, total, tag}              // dice tray animation
'prompt'         {kind: 'save'|'check'|'choice'|'solo-down'|'character-ended', ...}
'session:error'  {code, message}
'move:rejected'  {reason, position}                         // sent to the rejected mover
'net:pong'       {sentAt}                                   // response to `net:ping`
```
`state` (join snapshots) and `state:patch` payloads carry `world` while the party is in
the streamed overworld: `{ seed, regionW, regionH, focus: {rx, rz}, mapId }`. `world` is
`null` inside dungeons. Region boundary crossings are seamless: an accepted move whose
cell lands in a neighboring region produces the same movement patch plus
`world/mapId/mapName` (no inline map def — clients fetch region defs from
`/api/map/:id`); the crossing mover additionally receives the focus patch privately
because the movement broadcast excludes the predicting socket.

## Streamed world (P3.3)

- The overworld is an infinite grid of 112×96-cell regions keyed by integer region
  coordinates `(rx, rz)`. Region ids are `ashen_reach` (home, `(0,0)`) or
  `w<rx>_<rz>` with `m` marking negative parts (e.g. `wm1_2`); ids match
  `/api/map/:id` (`[a-z0-9_]+`). Region names are deterministic per region.
- Region defs are the normal MapDef shape plus `region: {rx, rz}` and
  `worldOriginFt: {x, z}`; token positions are always world feet. `/api/map/:id`
  serves any loaded region def (overworld regions carry no secret state).
- The server keeps the focus region plus a 1-ring registered; farther regions are
  pruned and regenerate deterministically on demand. Client-side, the engine builds
  each fetched region additively at its world offset and prunes beyond the ring;
  region defs are cached and fetched via REST (`ensureWorldRegions` in
  `client/src/net/client.ts`).
- Movement validation is region-based: the point's region must be loaded and its
  cell not water/wall. Dungeon maps keep their rectangle bounds. Crossing a border
  shifts the party's focus region without repositioning any token (world coordinates
  are unchanged). Focus shifts are deferred during combat.
- Dungeon round-trips are unchanged (`useExit` → `ashen_cellar`, `returnToPrevious`
  → the overworld region the party left, restoring saved world positions).

Door state is included in join snapshots and state patches as
`doors: [{wallIndex, open, locked, secret, revealed, x1, z1, x2, z2}]`.
Unrevealed secret doors are omitted from player door arrays; their public map segment
is disguised as a normal wall and its opening is added to solid wall cells. The DM
alone can manage door state with `dm:cmd` operation `door` and payload
`{wallIndex, action}` where action is `open|close|toggle|lock|unlock|reveal|conceal`.
Players may toggle a nearby unlocked, revealed door; the server validates identity,
door availability, distance, and current state before broadcasting the update. The DM
must reveal a secret door before opening it. Locked doors and secret-door discovery are
DM-managed; player keys, lockpicking, and search checks are not yet supported.

Map definitions may include `exits: MapExit[]`. Exit positions use cell coordinates,
while player token positions use world feet (5 ft per cell). An `intent:exit` is
accepted only for an exit on the active map when the player's living token is within
10 ft and no encounter is active. The client advertises exits within 8.5 ft (across
all loaded regions in world mode), while the server's slightly larger acceptance
radius tolerates movement-prediction and network delay. A fixed `destinationMapId`
leads to that registered map; its `returnToPrevious` exit returns to the most recently
entered fixed-destination map. In the live app the party starts in `ashen_reach` and
its cemetery entrance leads to `ashen_cellar`. The server sends a personalized
`state:patch` containing the new `mapId`, `mapName`, map definition, tokens, doors,
and chat. The client rebuilds map geometry before synchronizing tokens (for region
defs it streams additively instead of rebuilding).

Visited map creature and door state plus per-player positions are retained in the
`GameManager` session runtime. Character tokens (including inventory/rewards) remain
with the party through the transition. This is in-memory session continuity, not
durable persistence; a server restart clears the route and progress.

The generated `ashen_reach` MapDef uses `terrain.heightFt` as a row-major vertex
heightfield with dimensions `(size.w + 1) × (size.h + 1)`, and `biomes.cells` as a
row-major biome index for each map cell. `cells.water` is movement-blocking on both
client and server; `cells.road` marks walkable terrain. Prop and exit coordinates are
in cells, while player tokens are in world feet. The current fixed seed is `73021`;
regions carry no monster spawns. Overworld prop vocabulary also includes the ruin/graveyard kit (`ruin_column`, `ruin_column_fallen`, `ruin_wall`, `ruin_slab`, `grave_gate`, `grave_fence`, `grave_mound`, `mausoleum`, `columbarium`) rendered by dedicated client builders. Town buildings are visual props, not shops/NPC
interactions. World generation rules and invariants are in
`server/src/maps/worldGenerator.mjs` (home region) and `server/src/maps/world.mjs`
(region grid, world-space rivers/roads, seam stitching).

Accepted movement is broadcast with personalized token snapshots to other connections,
not echoed to the predicting mover. During combat, the mover receives a private
`state:patch` containing the authoritative `initiative` movement budget only,
including `movement.maxFt`. Dash adds one effective speed to this turn's budget;
the client uses the updated maximum both to gate movement and display remaining
movement. Initiative in player snapshots and patches is also personalized: `order`
contains only actors visible to that player, `turnIdx` is remapped to that filtered
order or set to `-1` when the active actor is not visible, and `movement` is omitted
when its actor is concealed (movement trails are not sent to players). The DM receives
the full initiative state.
Client sends `net:ping {sentAt}` periodically; server replies with `net:pong`.

`ActionRequest = { kind: 'attack'|'cast'|'dash'|'dodge'|'disengage'|'help'|'ready'|'use'|'item'|'acceptDeath',
  targetId?: string, spellId?: string, itemId?: string, slot?: 'action'|'bonus' }`

`help` raises an adjacent (5 ft) allied player who is down but not dead to 1 HP.
`dash` consumes the action in combat and adds one effective speed to the actor's
movement budget for that turn; it is rejected when there is no active movement budget.
Combat attack/cast requests against monsters require a currently visible target that
belongs to the active encounter. Player combat HUD target choices are drawn from that
same visible active set; Strike and Cantrip remain disabled until a target is selected.
`acceptDeath` is accepted only for the sender's downed token and only when no other
online living player token can help. Character IDs on locally saved characters prevent
rejoining a finalized character during that server session; server state is in-memory.

`ActionFx = { anim: 'lunge'|'spell'|'shoot'|'heal'|'hit'|'crit'|'miss'|'die'|'buff',
  power?: number, dir?: number, ms?: number }`

## GameManager state (authoritative)
```js
state = {
  version, sessionId, inviteCode, dmId,
  mapId,                                  // focus region id or dungeon map id
  world: { seed, regionW, regionH, focus: {rx, rz}, mapId } | null,
  dayNight: {mode, time01}, weather: {type, wind, intensity},
  players: [{id, name, color, tokenId, online}],
  tokens: [{                         // every creature incl. players
    id, kind: 'player'|'monster'|'npc',
    ownerId, name, portraitSeed,
    x, z, rotY,                       // world coords (feet)
    hp, hpMax, ac, speedFt, initiative,
    conditions: [], deathSaves: {ok, fail, stable, dead},
    characterId?, adventureEnded?, soloDeathPrompted?,
    sheetId | monsterId,              // rules source
    hidden, size,
  }],
  initiative: { order: [tokenIds], turnIdx, round, movement: {tokenId, usedFt, maxFt, trail} },
  chat: [...last 100],
  fogShared: { explored: [[cx,cz]...] },   // DM-visible shared exploration (optional)
}
```

## 5E rules engine (server/src/rules — plain ESM, unit-testable, no deps)
```
dice.js:        rollDiceFormula(formula, rng?) -> {total, rolls, formula}|null
                d20(mod?, {adv, dis}) -> {rolls, total, nat}
CharacterEngine: buildCharacter(def) -> Sheet   // abilities, proficiencies, HP, AC, attacks, spell slots
                levelUp(sheet), xpForLevel(n)
CombatEngine:   rollInitiative(tokens, rng) -> order
                beginTurn(state, tokenId) -> movement anchor + start-of-turn effects
                resolveAction(state, actor, request, rng) -> {ok, result|reason}
                applyDamage/Heal, saves, concentration checks, death saves
MonsterAI:      chooseAction(state, monsterToken, srdMonster) -> ActionRequest
DirectorAI:     think(state, events) -> [dm:cmd]              // AI-DM
```

## Session/invite flow
- Server boots → one default session per process (v0): `POST /api/invite` → `{url}`.
- URL: `http://host:port/j/<code>` → client auto-fills invite, straight to char select.
- DM role: first user presents `?dm=<key>` or uses `--dm` launcher script.

## Persistence (current limitations)
- Server-authoritative session state is currently held in process memory; durable server
  session/character persistence and account ownership are not implemented.
- Character convenience saves are browser-local. Do not build on the aspirational file
  paths or save behavior from earlier plans without first implementing and testing it.

## QA tooling
- Automated commands: `npm run typecheck`, `npm test` (includes rules, GameManager and
  all map test suites), `npm run build`, `npm run smoke`.
- `tools/shoot.py` exists but its URL/selectors are known to be out of sync with the
  shipped Node server and current UI; see `TASKS.md` before relying on it.
- Screenshots and VLM review are optional. Store actual evidence and any real review
  details in `QA.md`; never invent a score or claim a screenshot was inspected.
