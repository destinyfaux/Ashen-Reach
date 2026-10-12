# QA and Evidence Log

This document records checks and evidence that were actually run or inspected. It is not a feature checklist; open work belongs in `TASKS.md`. Build/tests/smoke do not certify visual quality, usability, or audio. VLM evaluation is optional and must never be fabricated.

## Current recorded baseline

The latest project status records these automated checks as passing: `npm run typecheck`, `npm test` (90 tests), `npm run build`, and `npm run smoke`. Re-run them before relying on that result; see `STATUS.md` for scope and commands. A local combat-HUD browser review is recorded below; no comprehensive screenshot sweep, VLM score, or browser audio inspection is recorded.

## HUD self-status redesign

- Reworked the self panel into a bottom-left character plaque with portrait, identity, armor class, segmented vitality meter, accessible HP values, and capped condition chips. Constrained the upper-left location/companion region and made the party list scroll within its available height.
- Root-caused the overlap: `.hud-self` also had `.ornate`, whose later `position: relative` declaration overrode the panel's `position: fixed`, leaving it over the upper-left location/time/weather plate. Removed `.ornate` from the self panel.
- Moved the record/satchel/menu dock into a horizontal row above the self-status plaque; on narrow screens it becomes accessible icon-only buttons, and the phone combat bar is raised to preserve a separate lane.
- After the latest layout changes, `npm run build` and `npm run typecheck` passed. Unit tests and smoke checks were not run. No screenshot/browser visual review was performed; confirm desktop and narrow layouts under P0.1 before calling the overlap fixed visually.

## Movement stutter investigation

- Client movement previously applied the turn/speed gate to any truthy initiative object, and join/reconnect snapshots did not replace cached initiative. The gate now applies only when the initiative order is non-empty, and bootstrap state clears/replaces stale initiative. The local wall resolver now handles diagonal input axis-by-axis for corner sliding. These changes have not been verified in a live playtest.
- Rejected-move correction now rebases before applying the current movement input, rather than pulling backward after each step; footsteps also follow actual resolved distance. This prevents the correction loop itself from damping held movement.
- Local browser tracing found continuous local motion in open space with no rejected-move corrections. Remote actors previously eased toward the latest 10 Hz server position, making frame-to-frame speed follow packet arrival timing. Remote actor transforms now interpolate timestamped position/rotation samples with a 150 ms render buffer; local prediction and collision remain unchanged.
- The movement sender was also receiving every full token patch for its own predicted position. This repeatedly ran token synchronization and HUD state updates on the same client at the 10 Hz send cadence. Accepted movement now broadcasts token snapshots to other connections except the predicting socket; in combat, the mover gets a private initiative-only patch to keep its authoritative movement budget current.
- Root-cause confirmation: the user reported that remote players already looked smooth, while their own avatar stuttered with the server running and became smooth when the server closed. After suppressing the redundant self-echo, the user confirmed movement was completely fixed.
- Verification on 2026-10-12: `npm run typecheck`, `npm test` (72 passed), `npm run build`, and `npm run smoke` all pass. Smoke covers two-client movement broadcasts, verifies the sender does not receive its own token snapshot, and tests wall rejection. A browser check of the remote interpolation path matched its timestamped midpoint within 0.005 ft and followed the short rotation arc across ±π. The user confirmed the self-movement fix in their two-window playtest.

## Historical visual iterations

The entries below are historical notes from earlier scene-review iterations; they are not a current quality pass and their images/results should be rechecked before reuse.

| Iteration | Recorded result | Notes |
|---|---:|---|
| 1 | 1/10 | Stacked player tokens, fog clear issue and spawn distribution; fixes were recorded at the time. |
| 2 | 2/10 | Lighting scale and entry-room lighting issues; fixes were recorded at the time. |
| 3 | 2/10 | Character scale, floor-stone scale, framing and HP plaque issues; fixes were recorded at the time. |
| 4 | 4/10 | Character silhouette, lantern shape and light falloff issues; fixes were recorded at the time. |
| 5 | ~4/10 | Character arms/shoulders/cloak volume remained weak; post-processing was proposed. |

These scores came from a prior review process; reviewer identity, prompt, screenshot paths, and reproducibility are not preserved in this log. Do not treat them as current VLM evidence or a release gate.

## Functional coverage previously recorded

- Join and character entry, movement/collision, two-tab state synchronization and disconnect cleanup.
- Fog presentation, DM weather/day-night commands and monster placement.
- Rules/server tests and smoke coverage are maintained in the project scripts; consult current tests rather than assuming this historical list is exhaustive.

## Evidence entry template

For each meaningful manual/browser review, record date, commit or worktree revision if available, command/setup, viewport/client roles, screenshot or log paths, observed outcome, console/page errors, reviewer/tool (including prompt and model only if used), and unresolved limitations. Mark unavailable checks as not run.

## Audio mixer and procedural effects

- Added independent persistent music/effects volume sliders and an on/off control on
  the title screen and in the in-game Escape menu. Scene music now changes through
  fading track buses. Procedural effects distinguish footsteps, fire, UI/type, attack,
  ranged attack, spell, heal, buff, hit, critical, miss and death cues.
- Used the Custom-VTT synthesizer as design reference for layered damage transients,
  sweeping spell noise, and a detuned healing shimmer; implemented these as smaller
  effects in the existing Web Audio module rather than importing its full synthesizer.
- Verification on 2026-10-12: `npm run typecheck` and `npm run build` passed. In a local
  browser session, the title sound control enabled audio, the music slider updated to
  45% and persisted, and after entering the game the Escape menu reflected that level;
  sound could be toggled off/on there, and Escape closed the menu while a volume slider
  had focus. Fixed a title-screen stacking issue found during this check that had let
  the centered panel intercept the sound button.
- The combat browser run surfaced a death-animation null dereference: animation progress
  was read after its action had been cleared. Progress is now captured before clearing;
  a fresh reload after the fix produced no new page errors during a short check.
- Not verified: subjective loudness/restraint, the full menu/crypt/combat/town
  transitions, every generated cue, or measured silence at the audio output. P0.3
  remains open for human listening/playtesting; automated build/UI checks do not prove
  audio quality.

## Downed characters, jump and footsteps

- Downed player tokens now stay visible in a persistent downed pose and cannot move
  client-side or through server movement intents. An adjacent living player can use
  Help, in or out of combat, to revive the fallen character at 1 HP. A solo/unassisted
  player can wait or explicitly end the character's adventure; the server rejects that
  action if a living online helper is available. Saved character IDs prevent re-entry
  after finalized death for the lifetime of this in-memory session.
- Space now produces a local vertical jump arc. Horizontal collision and movement
  remain unchanged; jump height is cosmetic and is not sent to the server.
- Footstep triggers now come from gait-phase footfall crossings, rather than a fixed
  distance accumulator. The synthesized cue layers a short sole impact, low thud and
  brief scuff.
- Automated verification on 2026-10-12: `npm run typecheck`, `npm test` (77 tests),
  `npm run build`, and `npm run smoke` passed. New server tests cover solo prompt,
  movement rejection, final death, same-session character rejection, party rescue and
  the 5 ft Help range.
- Not visually reviewed or acoustically listened to in a live browser. The downed pose,
  jump feel and footstep tone/cadence still need human playtesting. Character death is
  not durable beyond the running server process.

## Main-menu character deletion

- Returning-character cards now include a separate delete control. It asks for
  confirmation, removes only that character from this browser's saved character list,
  and refreshes the menu without disturbing the other characters.
- `npm run typecheck` and `npm run build` passed on 2026-10-12. No interactive browser
  review was performed.

## Combat Dash movement

- Dash now adds one effective movement speed to the current combat turn's movement
  budget. Client movement gating and the turn HUD use the server budget, and the HUD
  displays remaining movement over the total. The server rejects Dash when no active
  movement budget exists instead of reporting success without an effect.
- Verification on 2026-10-12: `npm run typecheck`, `npm test` (79 tests),
  `npm run build`, `npm run smoke`, and `git diff --check` passed. New rules tests confirm the
  doubled budget can be spent, movement stops at the new limit, a second Dash consumes
  no action and is rejected, and out-of-combat Dash is rejected.
- No interactive combat browser playtest was performed.

## Join-screen atmospheric polish

- Added two barely-there counter-rotating rings behind the vignette, staggered
  left-to-right title highlights, and a crown easter egg that reveals “The old crown
  remembers.” on the fifth click. The crown is keyboard-accessible; generated title
  letters expose the single accessible heading name `ASHENREACH`.
- Verification on 2026-10-12: `npm run typecheck`, `npm run build`, and
  `git diff --check` passed. In a local browser at 1280×800 and 390×844, inspected
  screenshots and confirmed the title/menu fit with no horizontal overflow; after
  five crown clicks the message appeared without overlapping the eyebrow. Reduced
  motion disables the ring and title animations. Reload produced no page or console
  errors. Follow-up visual fix explicitly removes the title's inherited dark shadow
  from the animated letter layers while preserving the amber glow; computed styles
  confirmed `text-shadow: none` on the sweep layer. Screenshots were inspected
  in-session but no image artifact was saved. A further polish moves the animated
  amber pass behind each crisp letter, applies an 8px blur, and removes the title's
  black drop shadow; browser computed styles confirmed isolated negative stacking
  for the glow and `blur(8px)`. The final refinement replaces per-letter timing with
  one whole-word sweep, runs it over a 14-second cycle with a long rest between passes,
  and uses a softer 9px blur. Browser preview confirmed one shared animation across
  the complete heading, retained `ASHENREACH` as its accessible name, and no overflow.

## Stateful doors

- `GameManager` owns each door's open, locked, secret and revealed state. Player E
  interaction validates the player's token, a revealed door, and an 8.5 ft reach;
  locked doors return a notice. DM controls expose open/close, lock/unlock and
  reveal/conceal; the DM must reveal a secret before opening it. Unrevealed secret
  doors are absent from player door-state snapshots and appear as solid wall cells in
  player map data.
- Closed door planes block server movement and server-side player/encounter LOS. Client
  door updates rebuild local collision and LOS data, animate the leaf, and play a
  synthesized cue. Door centers use the opening-cell center on both client and server.
- Verification on 2026-10-12: `npm run typecheck`, `npm test` (82 tests), `npm run
  build`, `npm run smoke`, and `git diff --check` passed. New server regression tests
  cover closed/open movement and visibility, too-distant and locked interaction,
  DM unlocking, and hidden/revealed secret-door data and collision.
- No live browser interaction, screenshot inspection, or acoustic review was performed;
  leaf appearance/animation and sound balance remain unverified by human review.

## Encounter awareness

- Server encounter detection uses 45 ft sight through unobstructed walls and hearing
  for out-of-combat attacks (60 ft) and spells (75 ft). Each intersected normal wall
  reduces remaining sound range by 30 ft; each closed door reduces it by 35 ft, while
  open doors and windows do not attenuate it. Opening a door checks sight immediately.
- Detected monsters can alert reachable nearby allies across at most two 40 ft hops.
  Hidden monsters are excluded, encounter membership is limited to detected monsters
  and their visible players (plus the acting player for a noise event), and awareness
  remains private rather than being serialized onto token data.
- Regression coverage verifies blocked/distant sight, closed-door isolation versus an
  open door, normal-wall attenuation versus a window, opening a door into sight,
  bounded alert propagation, hidden-monster exclusion, and player-specific token
  filtering.
- Verification: typecheck, all 86 Node tests, production build, smoke checks, and
  `git diff --check` passed. No live multiplayer encounter or browser playtest was
  performed; sound ranges and attenuation remain initial gameplay values, not
  playtested balance.

## Combat target selection and initiative privacy

- The turn bar now requires selecting a visible active encounter foe before Strike or
  Cantrip is enabled. The selector shows current target HP and distance; action-ready
  versus action-spent feedback is explicit, and used action buttons disable. Server
  refusals map common combat reasons to player-facing messages.
- Server-filtered initiative snapshots and patches expose only actors currently visible
  to each player. When the active actor is concealed, the player receives `turnIdx: -1`
  and no movement data for that actor. The DM retains the full initiative. Player
  attack/cast requests against guessed unseen monsters or visible non-participants are
  rejected.
- Automated regressions cover filtered full snapshots, two-player WebSocket initiative
  patches with different visibility, concealed movement/turns, and server target
  rejection for unseen/inactive monsters. The HUD target list is derived only from the
  filtered client token state and current initiative order.
- Final verification: `npm run typecheck`, `npm test` (90/90), `npm run build`,
  `npm run smoke`, and `git diff --check` all passed.
- Local browser review on the built Node server (port 3000): inspected the combat HUD
  at 1280×800 and a narrower viewport. During the character's turn, the target selector
  listed visible active foes; Strike was disabled without a target, and the selected
  target displayed its HP and distance. The action bar fit within the desktop viewport.
  Reload produced no page or console errors. Screenshots were inspected but not saved.
- This was a single-client UI check, not a full multiplayer usability review. Combat
  outcomes, action-spent feedback after a successful action, and narrow-screen combat
  usability still need live playtesting.

## Dungeon exit and return

- Generated crypts include a visible portal exit in the entry chamber. The E prompt
  sends `intent:exit`; the server checks proximity, actor state, and that combat is
  inactive. The generated overworld cemetery entrance leads to the crypt, and the
  crypt's return exit restores the party's saved overworld position. The old outdoor
  threshold map remains registered only for compatibility.
- Per-map runtime stores creature state, door state, and each party member's position.
  The integration regression exits and returns with a defeated monster, an open door,
  two distinct party positions, and carried character inventory intact. Invalid exits,
  distant use, active combat, and crossing the exterior map boundary are also tested.
- Generator validation confirms each generated exit lies on reachable floor.
- The exit regression places the server-side token 9 ft from the portal: the client
  prompt remains limited to 8.5 ft, while the server accepts within 10 ft so a recent
  predicted movement update does not make an advertised interaction fail.
- Verification for P1.4 before the overworld addition: `npm run typecheck`, `npm test`
  (91/91), `npm run build`, `npm run smoke`, and dungeon generator checks passed.

## Procedural home region

- Added the deterministic seed-73021, 112×96 Ashen Reach with a town-center spawn,
  nine biomes/settlement regions, a vertex heightfield, connected roads, lakes/rivers
  with bridge cells, grouped landscape props, town building facades, a graveyard crypt
  entrance, ruins, and a cave landmark. Water cells are blocked on the client and server;
  road cells remain walkable. No overworld enemies or interactive town services exist.
- Tests cover fixed-seed determinism, varied biomes, terrain, town services as scenery,
  crypt route/POIs, zero monsters, tree scale, water blocking and road walkability.
  GameManager coverage checks authoritative collision around building/tree/boulder
  footprints. Smoke covers town spawn, movement to the cemetery, crypt entry, dungeon
  wall rejection, return to the overworld, and re-entry.
- Verification: `npm run typecheck`, `npm test` (92 tests), `npm run build`,
  `npm run smoke` (all checks passed), both map-generator test suites, and representative
  dungeon/overworld `--check` commands passed.
- Local browser check on the built Node server (port 3000): joined a saved character
  into the town and confirmed the Three.js scene and HUD rendered; a short movement
  input also completed. The scene is visibly primitive and very dark at the default
  evening setting. A brief console/page-error capture during movement found no errors.
  No screenshot was saved; no biome-by-biome visual review, longer multiplayer browser
  playtest, or art-quality sign-off was performed.

## Overworld visual and hydrology correction

- Corrected river generation to derive descending water levels from the local terrain
  profile and constrained per-cell water surfaces against the carved ground. Added
  deterministic assertions limiting water elevation to 2 ft above the mean of each
  cell's four terrain vertices.
- Verification on 2026-10-12: generator test passed for seeds 73021, 1, 7, 73022 and
  12345; each passed world validation and had no water cell more than 2 ft above its
  averaged terrain. `npm run typecheck`, `npm run build`, `npm test`, both map-generator
  test suites and `npm run smoke` passed.
- Updated the outdoor start to 10:00, eased clear-weather fog, refined the daylight
  sky gradient and foliage lighting, shortened/sparsified grass, layered tree crowns,
  replaced town cone roofs with gables, and removed incompatible vertex-color flags
  from instanced foliage/rock materials.
- Browser inspection on the local Node server at 1188×911 showed the daylight town
  scene and foliage. The scene remains primitive and visually uneven; water appearance,
  town composition, mountain/road quality and large-world scale are not signed off.
  No screenshot was saved and no VLM review was run.

## Overworld terrain and mesh repair

- Reduced peak steepness and broadened river-channel blending to ease abrupt grade
  changes. Water cells are now capped against the final carved terrain, with shoreline
  cells lowered below ground. Regression tests enforce a maximum 5 ft vertex step and
  verify water elevation/shoreline inset across seeds 1–20, 73021, 73022 and 12345.
- Replaced unstable index-based rock vertex perturbation with closed proportioned
  dodecahedra, changed pine crowns to a single cone, and reshaped grass clumps into
  short, wider, bent segmented blades.
- A local browser screenshot showed the default town at daylight and the updated
  renderer; primitive town/terrain composition and the small bounded map remain visible
  limitations. The screenshot was not saved. No VLM review or quality sign-off.
- Verification on 2026-10-12: generator tests (including both map-generator suites),
  twenty-seed grade stress test, representative `--check` seeds, typecheck, full
  server/rules tests, production build, smoke and `git diff --check` passed.

## Stylized outdoor rendering pass

- Reviewed [stylized-components](https://github.com/cortiz2894/stylized-components)
  (MIT licensed) for its instanced wind-bent grass, procedural water patterns and
  spherical sky-dome techniques. Adapted the rendering ideas in the existing Three.js
  engine; no reference source was copied and no React/React Three Fiber dependencies
  were added.
- Meadow/forest grass is deterministic per cell and remains instanced. The fixed home
  region now places 77,515 grass clumps in high quality and 35,240 in low graphics;
  each clump is three crossed, shorter blades with tip-to-base color and a height-masked
  wind bend.
- Reworked water shading around a dark teal palette, broad animated flow and restrained
  elongated highlights rather than the prior bright flat cyan. Added spherical,
  time-varying sky noise, cloud shading and a sun corona while retaining day/night
  colors.
- Browser review on the built local Node server confirmed the grass and lake shaders
  render and the daytime sky is visible. No console errors/warnings or page errors were
  observed during a fresh load. The scene remains primitive, and the sky cloud pattern
  and water quality need broader visual review across weather/time-of-day and low-end
  hardware; no screenshot was saved and no VLM review was run.
- Verification on 2026-10-12: `npm run typecheck`, `npm test`, and `npm run build`
  passed, as did `npm run smoke`.
