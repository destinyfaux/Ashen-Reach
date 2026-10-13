# Active task list

This is the actionable backlog. Keep items small enough to verify. Mark a task complete only when its acceptance evidence exists; a code change alone is not proof of visual/audio quality. `STATUS.md` summarizes what is already in the product; `PLAN.md` gives the dependency-ordered longer view.

## P0 — Validate and stabilize the current playable slice

- [x] **P0.1 UI review with real screenshots.** Capture 1280×720, 1600×900, and a narrow viewport for solo, two-player, combat, DM, chat and open panels. Verify companion cards are unique, self appears only in the self plate, labels/buttons do not overlap, logs stay above the OS watermark, and current-turn feedback is obvious. Update `QA.md`; use a VLM only if one is actually available and record its prompt/result.
- [x] **P0.2 Movement/network playtest.** Run two clients for at least a minute in exploration and during another player's turn. Verify unrestricted out-of-combat movement, smooth wall/corner sliding, local/remote motion, prediction correction, turn/movement-budget gating, reconnect and RTT. Record any remaining jitter and add a reproducible test before changing camera/netcode again.
- [x] **P0.3 Sound playtest.** Use the title-screen opt-in and in-game Escape-menu mixer to verify scene changes cross-fade among menu/crypt/combat/town, footsteps/torch/UI/combat cues are audible but restrained, and disabling sound silences all generated audio. Browser UI checks are recorded; acoustic listening across the scene profiles remains.

## P1 — Complete the dungeon traversal/combat slice

- [x] **P1.1 Stateful doors.** Add authoritative open/closed/locked/secret state; connect interaction, collision, LOS, visual animation and audio. Closed doors must block movement and sight; open doors must clear both. Players can toggle nearby unlocked doors with E; the DM manages locks and secret-door discovery.
- [x] **P1.2 Encounter awareness.** Expand current proximity/LOS ambush behavior to explicit sight/hearing rules and monster alert propagation that respects walls/doors. Add isolated-room regression tests and preserve per-player visibility filtering.
- [x] **P1.3 Combat usability.** Add explicit target selection and improve turn/action feedback. Verify inactive actors and unseen monsters are not exposed by initiative, UI lists or network payloads.
- [x] **P1.4 Dungeon exit loop.** Add a discoverable exit and return transition; preserve party position and cleared/looted state for the session. The return destination is now the Ashen Reach home region rather than the temporary threshold.

## P2 — Improve visual/audio quality, based on evidence

- [ ] **P2.1 Art direction + asset workflow.** Establish a small visual bible and measured screenshot targets. Add a manifest/import workflow for authored models and material maps; replace the most visible primitive placeholder assets first. Do not call procedural Canvas textures a finished PBR asset pipeline.
- [ ] **P2.2 Location kits.** Author coherent crypt room/corridor/arena kits, then a recognizable town kit. Keep deterministic procedural variants as support, not substitutes for composition.
- [ ] **P2.3 Material/light pass.** Tune roughness/normal response, scale, contact shadows and torch falloff against actual screenshots and target hardware. Confirm materials use the intended color space and are readable in low graphics mode.
- [ ] **P2.4 Spatial audio.** Add spatial attenuation/panning and occlusion; improve footsteps by surface and expand authored/synthesized ambience without adding unlicensed recordings.
- [ ] **P2.5 Conditions/VFX.** Extend existing HUD chips and condition rings with readable, non-obstructive status cues; cover add/remove/update and reduced-motion/accessibility behavior.

## P3 — Build the world loop

- [x] **P3.1 Procedural home region.** Generate a deterministic, walkable overworld with a town-center spawn, clustered biomes/props, uneven terrain, roads/water and a crypt route. Keep enemy placement out of scope until SRD encounter design. Generator and end-to-end transition checks pass; five-foot adjacent-height and water/shoreline invariants now cover 22 seeds. Composition still needs visual/art review.
- [ ] **P3.2 Hub/town interactions.** Turn the service-building facades into useful NPC/shop/rest interactions and establish a more authored town composition with distinct town audio/materials.
- [ ] **P3.3 Streamed world and travel.** Replace the single 560×480 ft overworld with deterministic, connected, streamable regions/chunks and world-coordinate movement/loading before adding compass/map, route selection, travel time, and additional wilderness/dungeon destinations. Do not fake the requested scale by enlarging this one map or its props.
- [ ] **P3.4 Navigation.** Add server-authoritative grid pathfinding for monsters/doors/difficult terrain and route validation for generated layouts.
- [ ] **P3.5 Multi-floor.** Add floor/elevation identity, stairs/ladders, per-floor visibility/collision and HUD orientation.
- [ ] **P3.6 Persistence.** Define account/ownership/session semantics before adding durable server-side character and map saves.

## P4 — QA / release readiness

- [ ] Update `tools/shoot.py`: it currently targets a Vite-style port/selectors that do not match the shipped Node server and current screens. Point it at `npm run build` + Node server (port 3000 by default), update selectors, and check browser console/page errors.
- [ ] Add repeatable two-client browser tests for duplicate/reconnect identities, role-filtered monster replication, combat turn restrictions and the responsive HUD.
- [ ] Maintain screenshots and honest human/VLM review in `docs/QA.md`; never fabricate a score or claim screenshot validation when no image was inspected.
- [ ] Keep `npm run typecheck`, `npm test`, `npm run build`, and `npm run smoke` green.

## Completed recently

- [x] Add server-authoritative door states with proximity-checked E interaction, closed-door movement/LOS blocking, client collision/LOS synchronization, swinging leaves and a procedural door cue. DM controls lock/unlock, open/close and reveal/conceal; unrevealed secret-door state is omitted from player snapshots and represented as a solid wall.
- [x] Make combat Dash meaningfully extend a player's movement budget; show the remaining/total budget, allow movement through the added distance, and reject Dash outside an active movement turn.
- [x] Separate downed player state from death, block movement while down, add an adjacent Help rescue at 1 HP, and let unassisted players confirm final death. Add local Space jump and animation-phase footsteps. Server tests cover rescue, final death, solo prompt, movement denial and same-session character rejection; visual and acoustic quality still needs human review.
- [x] Hide self from companion cards; deduplicate player snapshots by ID and synchronize token names on reconnect.
- [x] Gate exploration/combat movement locally by active turn and remaining movement; carry updated initiative in accepted move patches.
- [x] Route movement rejections separately from persistent chat and add short aggregated feedback/correction.
- [x] Add explicit initiative turn label, labeled AC, clearer health colors, responsive party scrolling, and move chat above the OS watermark.
- [x] Filter monster tokens/spawn metadata per player on the server and scope automatic combat to visible nearby participants.
- [x] Add RTT display, procedural scene music/SFX, and condition-colored actor rings.
- [x] Add server tests for encounter scoping, player visibility filtering, and duplicate public player records.
- [x] Add server-private encounter awareness: 45 ft sight, attack/spell hearing with wall/closed-door attenuation, and two-hop monster alert calls; keep unrelated and hidden monsters out of initiative and preserve player-specific token filtering.
- [x] Add explicit visible-active-foe selection, action-ready/spent feedback, friendly action refusal messages, and per-player initiative/movement filtering; reject guessed hidden targets and visible monsters outside the current encounter.
- [x] Add a visible E-interactable dungeon exit and return path to the generated Ashen Reach; cache per-map door/creature state and party positions for the session, preserve carried character loot, and validate transitions server-side.
- [x] Generate the fixed-seed Ashen Reach home region, terrain, biomes, roads/water, clustered landscape props and town service facades; start the live app at its town center and connect the cemetery crypt entrance to the existing dungeon return loop. No overworld enemies or functional town services are included.
- [x] Redesign the self-status panel as a compact character plaque; remove the `.ornate` positioning conflict that placed it over the upper-left location/time/weather plate; bound the companion stack; align record/satchel/menu controls horizontally above the plaque with a narrow-screen icon mode. Code change only; screenshot/layout acceptance remains part of P0.1.
- [x] Make the client movement gate depend on an active initiative order, clear cached initiative from join/reconnect snapshots, and resolve diagonal wall collision axis-by-axis. P0.2 playtesting remains open.
- [x] Implement atmospheric height fog and volumetrics: added dynamic Mie-scattering sun/moon volumetric light shafts, an analytical exponential height fog volume with solar in-scattering, and tiered rolling ground mist with radial feathering and dual-octave noise drift. Built-in low-graphics bypass preserves performance. Build, typecheck, and smoke tests pass.
- [x] Implement UnrealBloomPass postprocessing: wired EffectComposer with RenderPass and UnrealBloomPass (strength 0.75, radius 0.5, threshold 0.82) to accentuate brazier flames, torch glow, volumetric light beams, and spell effects with a low-graphics bypass. Build, typecheck, and smoke tests pass.
- [x] Redesign procedural grass asset: rebuilt clump geometry with 6 blades fanned radially with heights ranging from 0.44 to 1.18 ft for internal asset height variation, and spread instance positions across cell boundaries with stratified jitter and independent XZ/Y scale jitter for continuous ground coverage. Build, typecheck, and smoke tests pass.
- [x] Make rivers, lakes, and ponds deform the terrain underneath: added forest and meadow pond water bodies to overworld generation, deformed terrain heightfields along river channels (1.25 ft depth at center) and lake/pond basins (1.0–1.4 ft depth with smooth shore blends), and ensured water surfaces sit properly inset into the surrounding terrain banks. Generator checks, 22-seed elevation assertions, and full smoke suite pass.
- [x] Riverbed depth subtraction, wide walkable bridges, and prop collision alignment: subtracted 1.8–2.0 ft riverbed channels beneath monotonic river water levels to prevent terrain overtaking water on slopes, widened and leveled bridge crossings (removing water collision and half-tiles), and matched client-server tree/boulder collision envelopes to physical visual meshes with improved axis-sliding movement. All unit, generator, and smoke tests pass.
- [x] Water slope carving, river-lake proximity merging, bridge orientation, and shoreline bank materials: established continuous monotonic downhill river water levels and carved deep V-shaped river ravines down mountain/hill slopes with terrain slope relaxation (<= 4.2 ft step); added proximity merging to bridge rivers and adjacent lakes/ponds with continuous water channels and synchronized surface levels; aligned bridge yaw (`rotY = atan2(dx, dz)`) with road vectors spanning rivers with 12 ft roadway, 25 ft span, and leveled banks; added shoreline gravel, sand, and river silt vertex color transitions with bank noise and spawned river stone props along banks; tightened tree collision to physical trunk radius. All 8 generator tests, full 93-test rules suite, and smoke checks pass.
- [x] Synchronize the HUD clock and game store with the advancing world time: linked the 3D engine's interpolated day/night cycle to the client reactive store so the top-left HUD clock updates in real time alongside atmospheric/sky progression, centered the sun icon SVG disk geometry, and made the server calculate elapsed session time in cycle mode so joins/reconnects reflect the current game time. All unit, rules, generator, and smoke tests pass.
- [x] Overhaul water material shader with full scene lighting, shadows, Fresnel reflections, and beach ripples: replaced unlit flat ShaderMaterial with a shadow-receiving MeshStandardMaterial customized via onBeforeCompile. Features include dual-flow animated wave normals, Fresnel sky/moon reflections, beach foam/ripples calibrated with an aShore distance-to-bank attribute, cloud shadow dimming, and grounded deep-water albedo that naturally shades dark with nocturnal lighting to eliminate nighttime glowing. All unit, rules, generator, and smoke tests pass.


## Task update rule

When work changes implementation status, update this file and `STATUS.md` in the same documentation pass. Record test results and unverified limitations in `QA.md` or the root worklog. Do not mark screenshot-dependent work complete without inspected screenshots.
