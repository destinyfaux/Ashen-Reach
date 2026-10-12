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

// engine/FogOfWar.ts
FogOfWar.resize(w: number, h: number)                     // cells
FogOfWar.update(origin: {x,z}, radiusFt: number, walls: WallSeg[], lights: LightDef[])
FogOfWar.isExplored(cx, cz): boolean
FogOfWar.isVisible(cx, cz): boolean
FogOfWar.getTexture(): THREE.CanvasTexture               // projected over ground

// engine/Actors.ts
Actors.sync(tokens: TokenState[])                         // create/update/remove by id
Actors.playAction(actorId: string, action: ActionFx)     // lunge/cast/hit/die/telegraph
Actors.getScreenPos(actorId): {x,y}                       // for floating text

// engine/Effects.ts
Effects.burst(pos, color, count)
Effects.floatText(pos, text, kind: 'dmg'|'heal'|'miss'|'crit'|'info')
Effects.teleground(pos, radiusFt, color)                  // ground telegraph decal

// engine/CameraRig.ts
CameraRig.follow(actorId | null)                          // null = free orbit
CameraRig.frameCombat(actorIds: string[])                 // tactical framing
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
10 ft and no encounter is active. The client advertises exits within 8.5 ft, while
the server's slightly larger acceptance radius tolerates movement-prediction and
network delay. A fixed `destinationMapId` leads to that registered map; its `returnToPrevious` exit
returns to the most recently entered fixed-destination map. In the live app the party
starts in `ashen_reach` and its cemetery entrance leads to `ashen_cellar`.
The server sends a personalized `state:patch` containing the new `mapId`, `mapName`,
map definition, tokens, doors, and chat. The client rebuilds map geometry before
synchronizing tokens.

Visited map creature and door state plus per-player positions are retained in the
`GameManager` session runtime. Character tokens (including inventory/rewards) remain
with the party through the transition. This is in-memory session continuity, not
durable persistence; a server restart clears the route and progress.

The generated `ashen_reach` MapDef uses `terrain.heightFt` as a row-major vertex
heightfield with dimensions `(size.w + 1) × (size.h + 1)`, and `biomes.cells` as a
row-major biome index for each map cell. `cells.water` is movement-blocking on both
client and server; `cells.road` marks walkable terrain. Prop and exit coordinates are
in cells, while player tokens are in world feet. The current fixed seed is `73021`;
the home region has no monster spawns. Town buildings are visual props, not shops/NPC
interactions. World generation rules and invariants are in
`server/src/maps/worldGenerator.mjs`.

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
  mapId, dayNight: {mode, time01}, weather: {type, wind, intensity},
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
- Automated commands: `npm run typecheck`, `npm test`, `npm run build`, `npm run smoke`.
- `tools/shoot.py` exists but its URL/selectors are known to be out of sync with the
  shipped Node server and current UI; see `TASKS.md` before relying on it.
- Screenshots and VLM review are optional. Store actual evidence and any real review
  details in `QA.md`; never invent a score or claim a screenshot was inspected.
