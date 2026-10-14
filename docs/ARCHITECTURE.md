# ASHENREACH — Architecture

A 3D multiplayer dark-fantasy RPG for the browser. D&D 5E (SRD) ruleset, automated
combat that preserves player agency, human-DM or AI-DM. Players join via invite links,
each on their own device. Spiritual successor to Custom-VTT (2D) — its proven systems
(fog, LOS, initiative, sheets, sync) are ported into a 3D world.

## Current constraints
- The server is authoritative for game simulation and validates client intents; clients
  render state and send requests.
- Each player has an independent browser client. The current server/session model is a
  prototype, not a production multiplayer or durable campaign service.
- A DM role and some DM commands exist. A complete AI-DM campaign workflow is not
  implemented.
- Human review, automated tests, and screenshots are valid QA evidence. VLM review is
  optional when available; no fixed score is an automatic pass criterion.
- See `STATUS.md` for implementation truth and `TASKS.md` for remaining work. Do not infer
  completeness from this target architecture or the original vision.

## Stack
| Layer     | Tech | Current state |
|-----------|------|---------------|
| Client    | Vanilla TypeScript + esbuild | Framework-free DOM UI; no React/Vite runtime |
| 3D        | Three.js via vanilla engine modules | Engine owns its render loop; procedural geometry and texture library |
| Styling   | Hand-written CSS | Cinzel + EB Garamond, charcoal/ember/bone palette |
| Server    | Node ESM + native WebSocket (`ws`) | GameManager owns authoritative state and intent validation |
| Rules     | 5E SRD rules modules | Dice, CharacterEngine, combat, monsters, rewards |
| Audio     | Procedural WebAudio | Opt-in scene music and synthesized cues; persistent music/effects levels and in-game toggle; no spatial mixer |
| QA        | Node tests, build, WebSocket smoke harness | Screenshot/VLM tools are not currently an automated release gate |

## Layout
```
client/
  src/
    engine/     # Three.js world engine, Bus, geometry, materials, input, effects
      engine/tilegrid/  # TileGrid build passes split by domain: shared, terrain, walls,
                        # props, geo, flora, trees, structures (TileGrid.ts orchestrates)
    net/        # native WebSocket client and intent/event routing
    game/       # lightweight reactive state store
    ui/         # vanilla DOM screens, HUD, character sheet, inventory
  public/       # static HTML, styles, and generated build output

server/
  src/
    index.js          # HTTP static/REST bootstrap
    ws.js             # native WebSocket event handlers
    GameManager.js    # sessions, players, tokens, maps, authoritative state
    rules/
      dice.js         # formula parser (ported from VTT)
      CharacterEngine.js # 5E character math (ported/adapted)
      CombatEngine.js # initiative, turns, actions, saves, concentration, death saves
      MonsterAI.js    # SRD monster tactics (multiattack, spells, movement)
      DirectorAI.js   # AI-DM: encounter pacing, posession of NPCs/dialog
    data/
      srd_data.json       # classes/races/spells (from VTT, trimmed)
      srd_monsters.json   # monster statblocks (from VTT)
      monsters_index.json # fast lookup
    maps/
      *.json          # authored maps; generator.mjs/worldGenerator.mjs build seeded maps
tools/
  build.mjs          # client production bundle
  smoke.mjs          # server and WebSocket integration smoke checks
docs/
  ARCHITECTURE.md CONTRACTS.md PLAN.md
```

## Core game loop (target)
1. DM (or AI-DM) opens a session → gets invite URL.
2. Players open invite → character creation (or import JSON / pick premade) → enter world.
3. Explore in real-time-ish movement on 5ft grid; fog of war per player (LOS + darkvision
   + light sources). Triggers start **structured 5E combat** (initiative, turns).
4. On your turn: move (budgeted ft), pick action/bonus/reaction from your live sheet
   (attack rolls, spells, saves all resolved server-side, animated client-side).
   Enemies act automatically (MonsterAI) with cinematic presentation (ER-feel: telegraphs,
   hit-stop, hit reactions, lunges).
5. Out of combat: NPC dialog, shops, rest, quests, map switching, DM live-editing
   (walls, monsters, lights, weather, day/night).
6. Durable character/account persistence and export/import remain future work; current
   character convenience saves are browser-local and authoritative session state is in
   process memory.

## Netcode model (from VTTManager)
- Server holds state plus a version. Mutations broadcast `state:patch`; joining or
  reconnecting receives a `state:sync` bootstrap.
- Client sends **intents** (`intent:move`, `intent:action`, `intent:dialog`), server
  validates (turn owner, movement budget, LOS, range) → resolves → broadcasts.
- The local player token is client-predicted. Do not echo accepted movement's full token
  snapshot to the originating socket: the prediction already has that position, and the
  echoed patch needlessly re-runs token synchronization and HUD/store work at movement
  frequency. Send authoritative combat-budget fields privately when needed; send position
  snapshots to other connections so their remote-actor interpolation can update. Keep a
  two-client regression check for both recipient behaviors.
- Client fog presentation is calculated locally from map geometry. Separately, the server
  filters monster tokens and spawn data per recipient using range/line-of-sight checks;
  do not treat client fog as a security boundary. Exact filtering behavior is in
  `GameManager.tokensForUser()` / `getPublicMap()` and should be tested when changed.
- Initiative is personalized at the server boundary as well: player snapshots and
  patches include only visible actors in `initiative.order`; `turnIdx` is `-1` when
  the active actor is concealed, and concealed movement data is omitted. The DM retains
  the full order. Player attack/cast intents are rejected for unseen monsters and for
  visible monsters that are not members of the active encounter. The combat HUD lets
  players select among visible active foes and reports whether their action is spent.
- Dungeon `MapDef` data may include exits with cell-coordinate positions and stable IDs.
  The client renders them and advertises nearby E interaction; `GameManager` validates
  the exit, distance, actor state, and encounter state before switching the whole party.
  It retains each visited map's creature/door state and party positions in session
  memory, so returning does not respawn defeated monsters or reset doors. The
  the cemetery exit from `ashen_reach` leads to the crypt, whose return route resumes
  the saved overworld position. The legacy `ashen_threshold` remains registered only
  for compatibility.
- Encounter detection is server-authoritative: monsters see living players within 45 ft
  through unobstructed sight, hear out-of-combat attacks/spells within their event range
  with normal-wall/closed-door attenuation, and can alert reachable allies over up to
  two 40 ft hops. Hidden, distant, and unrelated creatures stay out of the encounter;
  awareness is private server state, separate from per-player token visibility.
- A player at 0 HP is downed, not yet dead: the client keeps the actor in a downed pose
  and blocks local movement, while `GameManager.move()` independently rejects movement.
  An adjacent ally's Help action revives at 1 HP. Solo death confirmation and finalized
  character identity are server-validated, but last only for the in-memory session.

## Audio
- `client/src/audio/music.ts` owns the Web Audio graph: cross-fading scene music and
  generated SFX use separate gain buses. The shared levels persist in browser storage.
- Browsers require a user gesture to start/resume audio. The title screen and in-game
  Escape menu both expose sound on/off; the mixer provides separate music and effects
  sliders. Disabling sound mutes both generated buses.
- Movement, nearby crypt fire and combat action FX feed procedural cues through this
  client audio graph. Sound remains opt-in; spatial attenuation/panning, occlusion and
  surface-aware footsteps are not implemented. P0.3 listening checks remain required.

Transport uses the `ws` package with JSON envelopes `{ ev, data }` on `/ws`, not
Socket.IO. Supported messages and payload shapes are documented in `CONTRACTS.md` and
implemented in `server/src/ws.js`; update both together when changing the protocol.

## Map format (3D)
```jsonc
{
  "id": "tavern_cellar",
  "name": "The Ashen Cellar",
  "size": { "w": 44, "h": 30 },        // in 5ft cells
  "ambient": "dungeon",                 // desired audio/ambience profile (engine pending)
  "tileSet": "crypt",                   // visual/material profile, independent of ambient
  "elevation": [ /* optional per-cell height 0-3 */ ],
  "cells": { "wall": [[x,z],...], "pillar": [...], "water": [...], "difficult": [...] },
  "walls": [ {x1,z1,x2,z2,type:"normal|door|secret_door|window",isOpen?,locked?,revealed?} ],
  "lights": [ {x,z,radius,color,flicker} ],
  "props": [ {type:"brazier|barrel|table|coffin|chest",x,z,rotY} ],
  "spawns": { "party": [[x,z]], "monsters": [ {monsterId,x,z,patrol?} ] },
  "npcs": [ {id,x,z,dialogTree,shop?} ]
}
```
Area tile profiles include `cellar | crypt | town | road | ashlands | wilderness`.
Profiles resolve floor texture/PBR values, wall variants, trim, indoor/outdoor
classification, and an ambience label. The first profiles are procedural texture
sets; they are a data foundation, not a complete authored asset library.

The live server starts in `ashen_reach`, a fixed-seed (`73021`) 112×96 home region
generated by `server/src/maps/worldGenerator.mjs`. Since P3.3 the overworld is a
streamed grid of such regions (see the world layer section below). Its MapDef carries a row-major
`(w+1)×(h+1)` `terrain.heightFt` vertex heightfield, `biomes.cells` per terrain cell,
and distinct `cells.water` and `cells.road` lists. Water cells block movement on both
client and server; roads remain walkable. Deterministic biome clusters place primitive
trees, rocks, landscape clutter, town facades, graveyard markers, ruins and a cave
mouth. The town facades are not interactive services, and no overworld enemies are
generated. Party spawn is in the town center; the cemetery exit enters `ashen_cellar`.

## World layer (P3.3 streamed overworld)

`server/src/maps/world.mjs` turns the single home map into an infinite, deterministic
grid of 112×96-cell regions:

- **Region identity.** `(rx, rz)` → id `ashen_reach` for `(0,0)` else `w<rx>_<rz>`
  (`m` marks negative parts; ids must match `/api/map/:id`). `worldOriginFt` places a
  region's local (0,0) at world feet; tokens always live in world coordinates.
- **Seam-continuous terrain (PCG v2).** Neighbor terrain comes from pure world-space
  fields. Continuous macro biome weights (mountain/blight/snow/forest fBm at 470-1080
  cell scales, multiplied by a home halo that keeps ring ≤2 meadow and fades out by
  ring ~4.6) drive both the elevation (`baseElevation` + rolling hills, ridged mountain
  massifs with plateau terracing, blighted flats with spires) and the per-cell biome
  classification, so biomes, terrain, and props all follow the same organic massifs
  across seams. Near home the field blends back to the home base formula (seam mask),
  and a deterministic Jacobi slope clamp (≤4.2 ft per vertex step, 12 iterations on a
  14-cell padded window) enforces the grade budget while staying window-invariant —
  two regions evaluate the identical clamped value at a shared border vertex. Raw home
  output is untouched. `world.test.mjs` asserts seams and interior grades across a 5×5
  band plus mountain-country pairs in the 3-5 ring.
- **World water (rivers and lakes).** Home's river is lifted from the generated home
  def (exact waypoints/levels) and extended ~2 regions south into a deterministic
  terminus lake. Six further rivers each run a waypoint gradient from a directional
  highland source to a distant large lake through a valley-seeking walk (each step
  samples candidate headings and takes the lowest ground, biased toward the
  source→lake chord) with smoothly easing, arc-length-monotonic surface levels;
  hard separation rules (26-cell course spacing, 130-cell source spacing, an
  8-cell hard buffer and a 12-cell open-land rejection gate) keep channels apart
  so parallel twin rivers cannot spawn, and a shore connector guarantees every
  river meets standing water — tributaries sharing a basin converge on distinct
  shoreline points. Large lakes
  (13-22 × 9.5-16 cells) are world-space bodies placed at surveyed lowland basins
  (rim guard); they cross seams and are carved before the slope clamp. Roads extend
  each home road outward to a POI in the neighboring region, chain those POIs in a
  ring, and route around rivers and large lakes (per-cluster bridges where they still
  cross). Small ponds are region-local and biome-locked (lush-majority regions only).
- **Stitching.** Every region def (home included) is post-processed: the artificial
  boundary ring is stripped, river water cells are injected into border strips so
  rivers flow across seams, world-road cells inside the window are added, and the
  shoreline surface clamp is reapplied. Raw home output still feeds the untouched
  `worldGenerator` tests.
- **World sites.** Deterministic composition sites: exactly one ring-1 region (hash
  chosen) carries a walled graveyard (gate, fence with gaps, marker/mound rows,
  mausoleum, columbaria, dead brush) — town-adjacency rule; lush meadow/forest regions
  roll ruined temples (column circle, fallen drums, central slab) or fortress ruins
  (broken wall rectangles, corner stumps, rubble); mountains get cave mouths. These
  render through client prop builders in `tilegrid/structures.ts` (`ruin_column`,
  `ruin_column_fallen`, `ruin_wall`, `ruin_slab`, `grave_gate`, `grave_fence`,
  `grave_mound`, `mausoleum`, `columbarium`), all grounded on region terrain.
- **Server streaming.** `GameManager` keeps the focus region + 1-ring registered
  (`ensureRegion`/`ensureRegionRing`), caches per-region blocking sets and world-foot
  prop colliders, and validates movement against the loaded region set. When a token's
  cell crosses a border out of combat, `shiftFocus` swaps the focus without moving
  anyone and queues a `world`/`mapId`/`mapName` patch that `ws.js` folds into the
  movement broadcast (plus a private copy for the predicting mover). Regions beyond a
  2-ring are pruned; they regenerate deterministically. Dungeon maps and exits are
  unchanged.
- **Client streaming.** `net/client.ts` caches region defs from `/api/map/:id`
  (`ensureWorldRegions` fetches focus + ring; focus-shift patches retrigger it), and
  `Engine.enterRegion` → `TileGrid.addRegion` builds each region additively at its
  world offset. Queries (`isOpenWorld`, `terrainHeightAt`, `resolve`, exits) resolve the
  region containing the query point; `FogOfWar` is dungeon-only — the streamed overworld
  renders fully revealed (no region fog planes; monsters always visible outdoors); `World.onMapTheme(map, origin)` offsets atmosphere/lighting to the
  focus region. During a region build `terrainHeightAt` samples the region's own
  terrain (region-local coords) because the region is not yet registered — the world
  lookup would otherwise match a different region's bounds and float its grass/props.
  Dungeon loads keep the single-map path.
- **World minimap (P3.7).** `Engine.syncWorldProbe()` publishes a snapshot of the
  loaded regions (biome/water/road masks + fog `explored` arrays) into
  `engine/worldProbe.ts` each time the region set changes, and the tick loop feeds the
  party's world-feet position/heading. The HUD (`ui/hud.ts`) renders a top-right
  minimap from that probe — biome-colored explored cells, water/roads, region borders,
  N/E/S/W compass letters, party arrow, and a `Region (rx, rz) · cell cx, cz` readout —
  and hides it in dungeons.

- **Post-processing (P3.7b).** `EffectComposer` chain: `RenderPass` → `GTAOPass`
  (cheap depth-buffer-raymarched ambient occlusion — raytraced contact shading) →
  `UnrealBloomPass` (0.30 / 0.42 / 0.85 — restrained halo, only true highlights
  bloom) → `OutputPass` (ACES tone mapping + sRGB at chain end; three r152+
  materials skip both for render targets, so this was silently missing) → LUT
  grade pass (`engine/grade.ts`): a runtime-built 32³ display LUT (muted
  saturation, cool slate shadows, warm amber highlights, gentle filmic contrast)
  plus a soft vignette — Elden-Ring-style tone. Low-graphics mode bypasses the
  whole chain. Dungeon loads tear down all streamed region groups
  (`TileGrid.build`), so dungeon scenes no longer composite over overworld
  terrain. Overworld exit portals snap to `terrainHeightAt` instead of y=0.

Door state is authoritative in `GameManager.state.doors`, keyed by wall index rather
than mutating the registered map. Players can open/close unlocked doors within 8.5 ft
with E; locked doors and unrevealed secrets are DM-managed through the door controls.
Closed doors block movement and line of sight on the server and client. Public map/state
snapshots omit unrevealed secret-door state and render its opening as a solid wall.
Clients animate the leaf and play a procedural cue after state synchronization. Key,
lockpicking, and player search checks are not implemented.

## Intended art direction (not yet quality-validated)
Grim, low-saturation. Palette: charcoal `#0d0f12`, bone `#cfc6b8`, ember gold `#b8952f`,
blood `#7a1f1f`, crypt blue-green `#3d5a5a`. Fog-heavy, torch-lit. Readability first:
silhouettes + rim light; combat must read at a glance (team ring colors, telegraph
decals, damage numbers). The current engine generates geometry and several textures
procedurally; authored location assets and an asset-import pipeline are roadmap work.
VLM grading is not assumed to be available. Record actual screenshots and reviewer/evidence
details in `QA.md`; do not invent a score or describe an unreviewed image as validated.
