# Project status

This file is the short, current snapshot. `TASKS.md` is the actionable checklist; `PLAN.md` is the longer roadmap; `ARCHITECTURE.md` and `CONTRACTS.md` describe the implementation. Update these when code changes materially. The root `WORKLOG.md` is chronological history, not the current source of truth.

## Repository and runtime

- Repository root: `G:\ASHENREACH`; application root: `G:\ASHENREACH\game`.
- Client: vanilla TypeScript, Three.js, hand-written DOM/CSS, esbuild. No React, Vite, ECS package, or WebRTC.
- Server: Node.js ESM, native HTTP server, `ws` WebSocket transport. `GameManager` is authoritative for the single in-memory session in a server process.
- Runtime dependencies: `three`, `ws`. Dev/build dependencies: `esbuild`, TypeScript, Three.js/WS typings.
- Client source: `client/src/engine`, `client/src/net`, `client/src/game`, `client/src/ui`, `client/src/audio`.
- Server source: `server/src/GameManager.js`, `ws.js`, `CombatDriver.js`, `rules/`, `maps/`.

## Implemented foundation

- Invite-based join, local character creation/save, reconnect by session ID, player/DM roles, authoritative WebSocket state patches and intents.
- Client-predicted exploration movement with server validation; turn ownership and movement budgets apply only during active combat, while out-of-combat movement remains free. Combat Dash adds one effective speed to the turn budget; the client movement gate and HUD use the authoritative expanded budget. Rejected positions are reconciled, diagonal movement resolves walls axis-by-axis, and remote actors interpolate timestamped server positions. Accepted movement does not echo a full token snapshot to its predicting connection; the user confirmed the self-movement stutter is fixed in a two-window playtest. RTT ping is shown in the location HUD.
- Monster tokens/map spawn details are filtered for players by server-side range/line of sight; DM retains full visibility. Encounters begin when living monsters see players within 45 ft or hear out-of-combat attacks (60 ft) and spells (75 ft), with each intersected normal wall attenuating sound by 30 ft and each closed door by 35 ft. Alert calls travel up to two 40 ft hops; hidden monsters and unrelated/distant creatures are excluded. Awareness state stays server-private.
- 5E rules foundation: character sheets, dice, initiative/combat actions, monster AI, death saves, short/long rests, XP/rewards and inventory actions. See `server/src/rules/` and tests for exact coverage.
- Downed player characters are immobile and use a persistent downed pose rather than the death dissolve. An adjacent living ally can use Help to revive them at 1 HP; when no living online ally is available, the downed player can wait or confirm the end of the adventure. Dead saved characters are rejected on re-entry for the lifetime of the in-memory server session. Space triggers a local collision-safe jump; footstep cues follow the local gait's footfall phase.
- Doors have server-authoritative open/closed/locked/secret state. Players can toggle nearby unlocked doors with E; the DM can lock/unlock, open/close and reveal/conceal doors. Closed leaves block movement and sight on both server and client, opening synchronizes an animated leaf and procedural sound, and unrevealed secret doors are sent to players as solid walls without secret metadata.
- The live app starts at 10:00 in the deterministic 112×96 Ashen Reach home region (seed `73021`): a town-center spawn, nine landscape/settlement biomes, uneven terrain, connected roads and rivers/lakes, clustered props, four town-service building facades, ruins/caves, and a cemetery crypt entrance. Broadened mountain profiles and blended river valleys keep adjacent terrain vertices within 5 ft across 22 tested seeds; water is capped against local terrain and shoreline surfaces sit below it. The crypt exit returns to the overworld. Generated worlds have no enemy placements yet; town buildings are scenery, not working shops or services.
- Map transitions are server-validated, movement is bounded to the active map, water blocks movement on client and server, and per-map creature/door state plus party positions are retained in memory for the current session. Character inventory remains with each party token. The old threshold map remains registered for compatibility but is no longer the intended route.
- The registered starter dungeon is a deterministic, generated crypt (`seed=41003`, medium) named `ashen_cellar`. Generator modules include an entry, ossuary, gallery, chapel, guard chamber, sanctum, and boss arena, with socket metadata and tests. `ashen_cellar.json` remains an authored-map source/reference.
- Three.js world renderer uses procedural Canvas textures, `MeshStandardMaterial`, shadows, fog, procedural geometry/props, area tileset profiles, module floor inlays and wall supports. Atmospheric systems include dynamic sun/moon volumetric light shafts with Mie scattering and animated beam noise, an analytical exponential height fog volume with solar in-scattering, tiered undulating rolling ground mist with radial feathering, and dynamic terrain-conforming cloud shadows drifting across the landscape. The sky dome features a continuous 24-hour non-linear atmospheric model with rich golden hour transitions (orange, pink, peach, magenta), a high-resolution procedural moon with basalt maria and impact craters, glowing solar corona, and a planar troposphere FBM cloud canopy with modeled self-shadowing, silver linings, and nocturnal illumination (clouds shade to dark slate-charcoal with silver highlights at night rather than flat white). Sunlight dynamically dims when clouds pass overhead, and crepuscular god rays break through cloud gaps. Postprocessing uses `EffectComposer` with `RenderPass` and `UnrealBloomPass` to give rich bloom halos to fire, emissives, and magical VFX. Outdoor grass uses 6-blade clumps with height variation (0.44 to 1.18 ft) and stratified boundary-crossing jitter for natural density and coverage; the water shader layers flow, noise, and highlights. Low-graphics mode cleanly disables heavyweight volumetrics and bloom.
- Opt-in Web Audio synthesizes menu, crypt exploration, combat and town music with cross-fading scene tracks, separate persistent music/effects levels, a title-screen control and an in-game Escape-menu toggle. Procedural cues cover footsteps, nearby torch crackle, UI/type sounds, attacks, spells, healing, buffs, hits, misses, criticals and deaths. Browser UI behavior is checked; the listening/mix acceptance test remains open.
- The join screen has a low-contrast animated sigil behind its vignette, staggered title-letter glints, and an accessible five-click crown easter egg. Sigil/title motion respects reduced-motion preferences.
- HUD includes a compact bottom-left self-status plaque (portrait, name/archetype, AC, segmented vitality meter and capped condition chips), companion cards, initiative/turn indication, combat actions, DM tools, chat and RTT. Combat turns require choosing a visible active foe before Strike or Cantrip is enabled; action availability is shown and spent actions are disabled. Initiative order and movement state are filtered per player so hidden actors and their movement data are not sent to players; the DM retains the full encounter. Record/satchel/menu controls are a horizontal row above the plaque and collapse to accessible icon buttons at narrow widths. The self panel no longer uses `.ornate`, whose relative positioning had overridden its fixed bottom-left anchor and placed it over the upper-left location/time/weather plate. The upper-left location/party stack is height-bounded and scrollable. Self is omitted from companion cards; party data is deduplicated by ID; movement denials do not enter persistent chat. Screenshot review is still needed.

## Known gaps (do not describe these as complete)

- No world-map/compass UI, travel-time or route-selection systems, interactive town NPCs/shops/rest services, additional dungeon destinations, enemy placements in the overworld, durable map persistence, or multistory traversal. The generated home region and map progress exist only in the current in-memory session; a server restart resets them.
- The overworld is still one 112×96 map of 5 ft cells (560×480 ft), not a Skyrim/GTA-scale world. Larger landscapes need chunk streaming and world-coordinate/loading changes; simply enlarging props or this single terrain is not a substitute. Roads, rivers, town composition, primitive scenery and water appearance still need visual iteration.
- Door locks and secret discovery are DM-managed; player key, lockpicking, and search/ability-check mechanics are not implemented.
- No general navigation/pathfinding service; monster alertness currently uses fixed sight/hearing ranges and simple wall/door attenuation rather than stealth, perception checks, or richer sensory rules.
- Combat target selection is a visible-active-foe dropdown; area-spell targeting and selecting multiple targets remain limited.
- Materials remain mostly procedural textures and primitive geometry. No mature authored model/texture pipeline, biome prop catalog, or demonstrated PBR art quality.
- Audio is synthesized and opt-in; no recorded/owned sound library, spatial panning/attenuation, robust per-surface footsteps, or sound occlusion. Volume controls and mute are implemented; acoustic balance and restraint still need human playtesting.
- RTT is implemented; packet loss, jitter, authoritative reconciliation telemetry, and a network diagnostics panel are not.
- UI fixes have automated type/build/smoke coverage but still need real multiplayer screenshots and focused layout/accessibility review. There is no known always-available VLM service; if one is unavailable, record that and use human/playwright evidence without inventing scores.
- Account/login and durable server-side character/world saves are not implemented. Character convenience saves are browser-local; authoritative session state is process-memory state.
- Character death and character-ID rejection are session-memory only; there is no account identity or durable server persistence. Jumping has no gameplay/collision-height effect, by design.

## Current automated verification

From `G:\ASHENREACH\game`:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run smoke`

Latest verification for the water slope carving, bridge orientation, river-lake merging, and shoreline bank pass: typecheck, build, smoke, full rules tests (93 tests), and all map-generator test suites (8 tests) passed. Overworld generation tests verify water elevation grounding, 22-seed gradual grades (<= 4.2 ft step), depression of terrain beds below water surfaces for rivers, lakes, and ponds, proximity merging of rivers and nearby lakes, proper bridge crossing yaw (`rotY`) and walkability across spans, and placement of river stone props. Shoreline bank transitions blend floor colors into sand, gravel, and river silt near water. Automated checks do not prove art quality or browser audio.

## Documentation ownership

- Actionable work: `docs/TASKS.md`
- Current snapshot: `docs/STATUS.md` (this file)
- Strategic/dependency roadmap: `docs/PLAN.md`
- Actual architecture: `docs/ARCHITECTURE.md`
- Wire/data contracts: `docs/CONTRACTS.md`
- QA history/evidence and known harness limitations: `docs/QA.md`
- Chronological implementation notes: `G:\ASHENREACH\WORKLOG.md`
