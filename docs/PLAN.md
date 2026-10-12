gameplay acceptance checks pass. Procedural output is content, not automatically good
# ASHENREACH — Plan & Milestones

This is the strategic roadmap, not the live task checklist. See [`STATUS.md`](STATUS.md)
for the verified baseline and [`TASKS.md`](TASKS.md) for current actionable work.

There is a playable browser-based multiplayer RPG slice and a deterministic generated
home region connected to the crypt, not a complete RPG world loop. Town services, world
navigation/travel, overworld enemies, durable persistence, and visual validation remain
incomplete. Procedural content and code presence do not imply quality. Do not claim a
VLM pass unless one actually reviewed the recorded screenshot.

## P0 — Verify and stabilize the current slice
- Validate the latest companion/self HUD separation, current-turn indicator, movement
  gating/reconciliation, server visibility filtering, and transient rejection feedback
  in real browser sessions at desktop and narrow sizes.
- Reproduce and measure movement/camera jitter before further camera/netcode edits.
- Playtest the opted-in WebAudio loops/SFX and separate music/effects mixer in menu,
  crypt, combat, and town profiles. Browser UI coverage exists; acoustic listening
  remains open.
- Acceptance: two-client playtest, no repeated turn-denial chat spam, readable HUD,
  no serious console errors; screenshots and limitations logged in `QA.md`.

## P1 — Finish the dungeon encounter/traversal slice
- Make doors authoritative and interactive (open/closed/locked/secret) across movement,
  collision, LOS, rendering, and audio.
- Continue combat UX verification with multiple players and monsters. The visible active
  target picker and per-player initiative filtering are implemented; broader usability
  review remains part of P0 browser QA.
- Provide a visible dungeon exit/return loop and retain cleared state and party
  position while the session is live. The crypt now returns to the generated Ashen
  Reach home region; this is still session-memory continuity.
- Acceptance: deterministic route validation and integration tests for door state,
  perception, encounter membership, targeting, exit, and return. Session-only dungeon
  return and the first generated home-region connection are implemented; durable
  persistence and the broader world loop remain future work.

## P2 — Build a real visual/audio content pipeline
- Define art direction through inspected images: silhouette, value range, scale, material
  response, lighting and palettes per biome.
- Keep the data-driven tileset registry, but add reusable authored model/texture/prop
  manifests and a small cohesive crypt kit before broadening biome count.
- Tune PBR maps/material response and any shader effects against real screenshots and
  low/high graphics settings. Current procedural Canvas textures and primitive geometry
  are a foundation only, not a finished asset library.
- Evolve synthesized WebAudio with spatial attenuation, panning, occlusion,
  per-surface footsteps, and owned/licensed or documented synthesized content.
  Separate user volume/mute controls are implemented; their acoustic balance remains
  a playtest item.
- Acceptance: measured screenshot comparisons and audio playtests; no made-up VLM score.

## P3 — Expand the world loop
- A fixed-seed (73021), 112×96 home region is generated with clustered meadow, forest,
  snow, deadlands, mountain, town, graveyard and ruin scenery; hills, roads, water, a
  town-center spawn and a cemetery crypt entrance. It intentionally has no monster
  placements. Generator invariants and town→crypt→overworld smoke coverage pass.
  Water surfaces follow terrain levels, shorelines sit below ground, and a 22-seed
  regression bounds neighboring vertex-height changes to 5 ft. This 560×480 ft single
  map is a prototype region, not the requested large open world.
- Turn the procedural town facades into interactive shops, NPCs and a safe rest point;
  visually compose and review the location rather than treating generated props as a
  finished art kit.
- First establish deterministic region/chunk streaming with stable world coordinates
  and server-authoritative boundary transitions; then add world map/compass, route
  selection, travel/time advancement, additional connected wilderness/dungeon entrances,
  and persistent per-location state.
- Add server-authoritative pathfinding and then multi-floor levels, stairs, floor-aware
  visibility/collision, and clear floor navigation UI.
- Acceptance: enter town → choose route → travel → enter/exit dungeon → return with
  location state intact.

## P4 — Persistence and release quality
- Define durable account/ownership/save semantics before adding server-side persistence.
- Add network telemetry beyond RTT (loss/jitter/sync status) and a privacy-safe diagnostics
  panel; retain reconnect/resume regression coverage.
- Update the Playwright screenshot harness to run against the shipped Node server and
  current selectors; capture browser console/page errors and real multi-client states.
- Expand quests/journal, loot, character progression choices, onboarding, balance, and
  human/AI DM workflows after the core world loop exists.

## Completed foundations (not quality sign-off)
- Server-authoritative invite/session, player tokens, WebSocket state/intent routing,
  reconnect, movement validation, initiative/combat, character sheets, rests, rewards.
- Area tileset registry and procedural floor/wall materials; deterministic BSP dungeon
  modules, sockets, boss arena, layout validation/tests.
- Server-private encounter awareness with fixed-range sight/hearing, wall/door sound
  attenuation, bounded ally alert calls, and scoped encounter membership.
- Visible active-target selection, action-ready/spent feedback, and per-player initiative
  filtering that omits concealed actors and movement details from player payloads.
- Client-side fog presentation plus server-side monster token/spawn filtering by range
  and LOS; opt-in procedural music/SFX; turn-aware HUD and RTT indicator.

See `STATUS.md` for limitations and `TASKS.md` for prioritized next work.

## Development protocol
- Use the package scripts in the `game/` directory: `npm run typecheck`, `npm test`,
  `npm run build`, `npm run smoke`.
- Preserve existing user changes. Run relevant checks, record limitations, and update
  `STATUS.md`, `TASKS.md`, and `QA.md` when a task changes the baseline.
- Screenshots/VLM are optional evidence tools, not assumed services. Never invent a score.
