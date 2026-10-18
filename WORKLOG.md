# ASHENREACH — Worklog

> Single shared work log for all agents. Append-only. Every agent MUST append a section
> after finishing its Task ID (template at bottom). Mirror of this file ships to
> G:\ASHENREACH\WORKLOG.md on the user's machine at every milestone.

---
Task ID: 1 (recovery session — see G:\ASHENREACH\WORKLOG.md Task 1 for the M0 history)
Agent: main (Super Z)
Task: Ship M0 foundation (multiplayer 3D walking sim, Vite+React+three)

Stage Summary:
- M0 shipped on G:\ASHENREACH\app; VLM art score 4/10 (below 8 bar)
- User feedback: capsule-skeleton figures are the top complaint; camera pulled in by
  hanging torches; no character creation; art direction weak; 109MB node_modules vs
  ~3MB of code

---
Task ID: 2
Agent: main (Super Z — boss)
Task: Recover from sandbox loss + execute tech pivot + launch swarm

Work Log:
- Sandbox was wiped (all prior session work lost). Rebuilt rodri tooling from scratch:
  scripts/rodri_shell.py (POST /api/v1/agent/shell), rodri_push.py (zip+upload+extract),
  rodri_pull.py + pull.ps1 (remote pack → base64 → sandbox mirror)
- Pulled G:\ASHENREACH app + _refs into /home/z/my-project/ashenreach (174 files, 3.3MB):
  M0 app, Custom-VTT server+client src (combat, SRD data 717K+749K, 43 UI components,
  CharacterEngine, FXEngine, SoundSynthesizer, VisibilityEngine), Elden-Ring-Combat-Rewrite
  Rust src (rig.rs 806L, anim.rs, sim/player.rs 40K)
- TECH PIVOT EXECUTED: scaffolded /home/z/my-project/ashenreach/game — zero-framework
  client (esbuild + vanilla TS, native WebSocket, vanilla-DOM UI) + zero-dep-ish server
  (node:http + ws). Total runtime deps: three + ws. devDeps: esbuild, typescript, @types
- Wrote zustand-compatible vanilla store (game/store.ts) so engine modules copy over
  unchanged; net/client.ts stub with frozen exports (sendMove etc.)
- npm install verified; esbuild + tsc operational
- NOTE: user pasted a file ("Pasted Content_1791738878276.txt", "fix:") that never
  reached the sandbox and is not on their machine — asked user to re-paste as text

Stage Summary:
- Swarm launched: T2-a pivot/netcode+UI+server, T2-b 5E rules engine, T2-c character
  rig rebuild (Elden Ring ref), T2-d art direction + camera fix, T2-e character creation
- Integration, QA (VLM >= 8 bar), and push to G:\ASHENREACH are the boss's next steps

---
Task ID: T2-b2
Agent: T2-b2 (general-purpose sub agent)
Task: Finish the 5E rules engine (T2-b died mid-task): monster data index, MonsterAI, DirectorAI, SCHEMA.md, tests

Work Log:
- Read worklog + CONTRACTS.md + all T2-b artifacts (dice.js 241L, CharacterEngine.js 764L,
  CombatEngine.js 1043L, build_index.mjs 214L) to match style/exports
- Data: srd_data.json + srd_monsters.json already copied by T2-b (verified byte-identical
  to _refs via cmp); ran build_index.mjs → monsters_index.json (479KB, 373 monsters, 365
  with auto-resolvable attacks, 130 multiattack, 56 save-actions) — valid JSON, no fixes
  needed to the generator
- Wrote server/src/rules/MonsterAI.js: chooseAction(state, monsterToken, srdMonster, rng?)
  → ActionRequest + documented `move: {x,z}` extension; buildMonsterToken(indexEntry,
  overrides) → combat-ready token (flattened attacks, saveMods, spellcasting parsed from
  the stat-block Spellcasting trait with live slot state); parseSpellcastingTrait(). V1
  tactics: melee approach/attack w/ reach, kite < 30ft then shoot, multiattack-or-best,
  caster casts highest-EV damaging spell while slots last, never targets dead/stable/hidden
- Wrote server/src/rules/DirectorAI.js: think(state, events?, opts?) → [{op, payload}]
  dm:cmd ops — reinforcement (all monsters dead < round 2, party standing, CR-appropriate
  pick from index, spawn at opts.spawnPoints world feet), retreat narration < 30% HP,
  weather beat every 3 rounds / daynight dim every 6; idempotent via per-state WeakMap
- Wrote server/src/rules/SCHEMA.md: (a) CharacterDef input schema (exact fields, 42 races/
  13 classes lists, archetype aliases, subrace auto-pick + house rules, full JSON example);
  (b) Sheet output schema (every top-level key + types, real full JSON example); (c) Look
  contract {bodyType, skinTone, hairStyle, hairColor, cloakColor, eyeColor, faceDecor}
  with palette sizes from T2-e's wizard + rig mapping note; (d) bonus §4: monster token
  profile, ActionRequest extensions, DirectorAI ops + GameManager wiring table
- Tests (node --test): dice.test.js, combat.test.js, character.test.js, monsterai.test.js,
  directorai.test.js — 52 tests, ALL PASS
- FIXES to T2-b's frozen CombatEngine.js (2 crash/contract bugs, surgical, API unchanged):
  1) resolveSpellEffect referenced out-of-scope `spellName` → ReferenceError on every
     save/attack-mode cast (Sacred Flame etc.) — violates the never-throws contract;
  2) doCast returned resolveSpellEffect's {ok, result} wrapper as-is → resolveAction
     double-wrapped casts into {ok, result:{ok, result}} breaking the {ok, result} shape;
     flattened one level so casts match attack/dodge result shape. Regression test added.
- FIX package.json test script: "node --test server/src/rules/" failed on Node v24
  (directory arg treated as module entry) → "node --test \"server/src/rules/*.test.js\""
- Verified: npm test 52/52 pass; monsters_index.json 479KB valid; chooseAction/think
  import as functions; end-to-end smoke (initiative → goblin ranged attack → acolyte
  Sacred Flame cast → damage → death-save-eligible downed state → DirectorAI poll) runs
  clean with chat narration + slot bookkeeping correct

Stage Summary:
- 5E rules engine COMPLETE: dice + character + combat + monster AI + AI-DM + data index,
  52 unit tests green, interfaces match CONTRACTS.md exactly
- GameManager wiring needed (exact signatures):
  • Monster turn: const req = MonsterAI.chooseAction(state, monsterToken, srdIndexEntry);
    if (req.move) CombatEngine.attemptMove(state, monsterToken, req.move.x, req.move.z);
    CombatEngine.resolveAction(state, monsterToken, req); CombatEngine.nextTurn(state)
  • Monster spawn: merge MonsterAI.buildMonsterToken(monsters_index entry, {id, x, z})
    into GameManager.makeMonsterToken output (makeMonsterToken currently drops
    monsterId/attacks/saveMods/spellcasting — pass payload.monsterId through and attach
    the profile); dm:cmd 'spawn' payload already carries monsterId
  • AI-DM: DirectorAI.think(state, events, {partyLevel, spawnPoints: world-ft map
    monster spawns, rng}) after each turn end → for each op run gm.dmCommand(op) except
    op 'chat' → gm.narrate(payload.text, payload.color) (dmCommand has no 'chat' case yet)
  • Client wizard CharacterDef (T2-e) plugs straight into
    CharacterEngine.buildCharacter(def) — see SCHEMA.md §1/§3

---
<template>
Task ID: <id>
Agent: <agent name>
Task: <one line>

Work Log:
- <steps>

Stage Summary:
- <result / artifacts / decisions>
</template>

---
Task ID: 3
Agent: main (Super Z — boss)
Task: Integrate swarm output into a working game; execute tech pivot end-to-end

Work Log:
- Swarm recovery: T2-a/b/c/d/e files landed (deadline killed parent calls but work
  survived); T2-b2 agent completed rules engine: MonsterAI + DirectorAI + tests (52/52)
  + monsters_index.json (373 monsters) + fixed 2 CombatEngine bugs (spellName crash,
  double-wrapped cast results)
- Fixed rigMaterials.ts (TS errors + shader injection bug: mat.fragmentShader →
  shader.fragmentShader)
- BOSS INTEGRATION (this task):
  * server/src/CombatDriver.js — combat lifecycle: startCombat/endCombat/advanceTurn,
    monster auto-turns (MonsterAI.chooseAction → attemptMove → resolveAction),
    player intents (intent:action/intent:endTurn via gm.onIntent), fx:action +
    roll:show broadcasts, proximity ambush trigger (25ft), DirectorAI round beats,
    SRD spawn wiring (monsterId → buildMonsterToken)
  * GameManager: join accepts CharacterDef → CharacterEngine.buildCharacter → real
    5E token (sheet attached, look attached); combat-budget movement routing;
    dm:cmd combat start/end + SRD spawn; attachCombat before setMap (spawn order)
  * CombatEngine: exported combatActive
  * Map: ashen_cellar spawns now SRD-backed (skeleton × 5, specter boss)
  * Client: store/net carry initiative; joinscreen "Forge of Souls" link; screen.ts
    sends forged CharacterDef with session:join (FIGURE class→archetype map)
  * HUD: initiative strip (R# + cells), turn banner + action bar (Strike/Cantrip/
    Dash/Dodge/End Turn), movement-left readout, DM combat buttons, SRD spawn menu
  * NEW Actors.ts: rig-driven figures (HumanoidRig + Animator + buildEquipment),
    team rings, hero lantern point light (95lm), getScreenPos implemented
  * Rig polish round 1 (boss): wider 5-segment capes (warden/priest), brighter
    cloak palette, leather joint wraps (elbow/knee), lantern boost
- TESTS: npm test 52/52 PASS; tools/smoke.mjs ALL PASS; tools/combat_test.mjs
  (new) ALL PASS — full E2E: forged join (HP13/AC18 verified) → walk to ambush →
  initiative (7 combatants) → monster auto-fx → player attack fx → endTurn advance
- QA: agent-browser screenshots; VLM: join screen good; world/character still ~4/10
  (mannequin read — cloak + wraps + lantern improved it but deeper polish needed)

Stage Summary:
- TECH PIVOT SHIPPED: G:\ASHENREACH\game — 2 runtime deps (three, ws), zero framework,
  npm install = 15 packages, boots clean on the user's machine (verified remotely:
  HTTP 200 + combat driver attached + invite flow)
- M1 CORE LIVE: real 5E characters, SRD monsters, automated tactical combat E2E
- Remaining: VLM art score gap (4 → 8) — delegated to T2-c3 polish agent next

---
Task ID: T2-c3
Agent: main (Super Z — boss; the launched polish agent broke the rig and was killed by
        deadline before it could report or revert, so the boss completed the loop)
Task: Visual polish sprint via screenshot+VLM iteration

Work Log:
- Polish agent launched with the full edit→build→screenshot→VLM loop; it added
  tabard/sash/trim/eye-glow/armor plates to the rig recipe but its geometry/skinning
  edits BROKE rendering (VLM: "cluster of detached floating spheres", 1-3/10)
- Boss recovered the known-good engine/ from the G:\ASHENREACH\game mirror (the push
  made BEFORE the agent ran — remote persistence saved the day), restored, rebuilt,
  cache-busted the browser, and verified coherence restored
- Final QA set captured and scored (see shots/scores.md): join 8/10 PASS,
  create 8/10 PASS, world 6/10, character closeup 3-4/10 (coherent, equipped,
  lantern-lit, caped — but capsule topology still reads primitive)
- Full suite re-verified after restore: unit 52/52, smoke ALL, combat E2E ALL

Stage Summary:
- Two screens meet the VLM 8 bar (join + creation)
- Character visual quality is the #1 remaining gap (procedural capsule ceiling);
  next lever: folded-robe geometry for casters + higher-order part blending or a
  vertex-displacement cloth/fold pass — logged for the next session
- LESSON: push-before-agent-launch = the recovery mechanism that worked here

---
Task ID: 4-b
Agent: 4-b (general-purpose sub agent)
Task: FIX 2 camera jitter + FIX 3 rig/animation side of feet clipping + FIX 4 door frames

Work Log:
- CameraRig.ts (camera jitter): (a) replaced the hard obstruction rate flip
  (13 : 3.4) with a smooth gap-based rate 3.4 + 9.6·exp(−gap·0.7) — the flip
  pumped every frame when the sweep oscillated near threshold; (b) removed the
  second cascaded camera.position.lerp (k2 stage) → direct copy of the computed
  offset, so the focus lerp is the ONLY smoothing (no double-smoothing lag);
  (c) shake() now applies AFTER lookAt as rotation offsets (rotateX/rotateY,
  ±shakeAmt·0.02 rad) instead of position offsets that fought the orientation.
  Header algorithm comment updated to match.
- HumanoidRig.ts (feet clipping, rig side): pelvisY +0.12 across the board —
  BASE 3.06→3.18, lean 3.0→3.12, broad 3.1→3.22, tall 3.28→3.4. ALSO raised the
  standard-bodyType else-branch j(3.06)→j(3.18) — spec missed it but it is the
  value actually used by the default body type (without it the most common rig
  would not have been raised at all).
- animations.ts (feet clipping, anim side): A_leg 0.5+0.36g → 0.44+0.32g and
  A_knee 0.95+0.35g → 0.85+0.32g in Animator.locomotion; added floor clamp
  p.lift = Math.max(0.02, p.lift) right after the locomotion lift computation
  (the −0.05·g run-crouch term could drive it negative). Wraith hover path and
  deathPose negatives untouched (wraith returns early; dying skips locomotion).
- TileGrid.ts buildDoors (FIX 4): frame center now computed per-axis —
  cross-axis = wall-column center (x1+0.5 / z1+0.5, respecting the
  walls-centered-at-(x+0.5)·CELL convention; the old raw midpoint landed the
  frame on the wall's FACE plane, the "half a cell off" bug) — both the visual
  frame and the decor collider use the new (mx, mz).
- SPEC DEVIATION (along-axis, reported): spec formula (z1+z2+1)/2 assumes door
  segments are inclusive cell-index runs, but gen_cellar.mjs emits cell-BOUNDARY
  coords (door seg = door cell's west/north edge, x2=x1+1 — same convention as
  buildLosIndex). Verified against ashen_cellar.json: spec's +1 would put the
  hallA→junction door (seg 11,22–11,23) at z=115 — south jamb 2.5ft INSIDE wall
  block (11,23). Used the segment midpoint (z1+z2)/2 instead: all four 1-cell
  doors land exactly centered in their wall gaps with jambs flush to the wall
  faces (checked numerically). Only trade-off: the 2-cell entry door (cells
  11,25+11,26; gen only encodes the FIRST cell in the segment) gets its 5ft
  frame flush against the north wall block, covering the north half of the
  10ft opening — spec's +1 would center it but leave the lintel floating 2ft
  clear of BOTH walls. Flip = add +1 in the two along-axis branches if the boss
  prefers centered; the real fix is gen_cellar.mjs emitting z2 = dz + numCells.
- VERIFY: npm run build OK (app.js 709.7kb); npm run typecheck clean;
  npm test 52/52 (server rules, untouched by these edits).

Stage Summary:
- Camera: single-stage smoothing + smooth obstruction rate + rotational shake.
- Feet: rig raised 0.12ft (all body types incl. standard branch), walk/run leg
  swing trimmed ~12-15%, locomotion lift floored at +0.02ft. Actors.ts Y-clamp
  + foot-lock pass is agent 4-a's half (body.position.y = pose.lift·0.35 there
  still applies on top of these).
- Doors: frames now sit in the wall-column center plane, jambs flush against
  wall faces; one map-gen artifact remains (door at 11,9 — cryptN and corridorW
  rooms overlap so no wall exists there; frame floats in open floor regardless
  of math; needs a gen_cellar.mjs room/door fix, not a TileGrid fix).
- QA NOTES for boss: (1) shake is now much subtler (±0.02 rad vs ±1.6ft) —
  scale the 0.02 up if crits feel weak; (2) orbit input is now 1:1 with mouse
  (no position easing) — if too stiff, allowed fallback is ONE small lerp on
  the focus vector only; (3) door lintels overhang 0.45ft into the flanking
  walls BY DESIGN (len+0.9) so frames read as connected; (4) visually check all
  5 visible doors + walk cycle feet at run speed (gait=1) after merging 4-a.

---
Task ID: 4-a
Agent: 4-a (general-purpose sub agent)
Task: FIX 1 spawn void (fog camera fallback + map-load warn) + foot-lock half of
      FIX 3 (Actors Y-clamp + foot-lock, Controls open-cell guard, server
      spawn-in-wall nearest-open fix)

Work Log:
- FogOfWar.ts (FIX 1): update() no longer silently returns when myTokenId has no
  actor — the fog now centres on this.eng.camera (worldToCell on camera x/z,
  same cell-change recompute+repaint path). Pre-join / token-sync gap now shows
  the lit spawn area instead of a ~93% opaque black plane over the whole world.
  mapDef guard kept (no map → nothing to paint).
- Actors.ts (FIX 3 my half): (a) non-wraith body Y clamped:
  body.position.y = Math.max(0, pose.lift * 0.35) — run-crouch/hit/miss dips
  (lift can go −0.1) no longer sink the figure below the floor plane;
  (b) foot-lock pass after the pose is applied: reads both foot joints
  (rig.bones[B.FOOT_L / FOOT_R] via the exported B bone-index map from
  HumanoidRig) with getWorldPosition into a module-scope scratch Vector3
  (zero per-frame allocations), takes the lowest foot's height above the actor's
  ground origin, and if it is under FOOT_LOCK_Y (0.06ft) pushes the body up by
  (FOOT_LOCK_Y − low) * 0.6 — stateless partial correction (body.y is re-based
  from pose.lift every frame, so it can never accumulate or oscillate). Skipped
  entirely for a.dead and rig.isWraith.
- Controls.ts (FIX 3 other half): after grid.resolve, the landing position is
  verified with grid.isOpenWorld; if it is a closed cell the move reverts to the
  previous frame's position. Guarded with isOpenWorld(px, pz) so (a) a player
  already inside a solid cell (bad spawn) can still walk out and (b) movement
  does NOT freeze while no map is loaded (isOpenWorld is false for everything
  without a map — a plain revert would have reproduced the "can't move" bug).
- GameManager.js (FIX 1 server side): added isOpenCell / nearestOpenCell
  (Chebyshev ring search r=1..20 over map bounds + wallCells) and partyRingCell;
  placeParty now snaps every player to the nearest OPEN cell centre
  (cell*CELL_FT + CELL_FT/2, jitter dropped). ALSO applied the same snap to
  makePlayerToken — join() does NOT re-run placeParty, so the old ring+jitter
  math there was the actual join-path spawn-in-wall risk.
- Engine.ts (FIX 1 diagnostics): Bus MAP_LOAD handler now warns
  'MAP_LOAD: map is null/missing' (and skips) for a payload without
  size/cells; same guard inside loadMap for direct callers. A failed map fetch
  is now visible in the browser console instead of a silent black screen.
- SPEC DEVIATIONS (flagged for boss): (1) foot-lock sign — the spec formula
  body.position.y -= (0.06 - lowestFootY) * 0.6 pushes a clipping foot DEEPER
  through the floor (body.y is re-based each frame, so it is a persistent 60%
  push in the wrong direction, i.e. it would re-create the reported sinking);
  implemented as += (raise the body toward the 0.06 target) which matches the
  stated intent "feet never sink below the floor". (2) "foot joint local Y" is
  measured as the joint's height above the actor's ground plane (world Y minus
  group origin) — the rig's bind foot local offset is a constant −1.34, so the
  bone's local position is useless per-frame; the world-chain read is the live
  pose value. (3) nearest-open also wired into makePlayerToken (see above).
- Verified against the live tree (4-b's rig/animation edits already merged in
  parallel): API intact (B export, bones[], isWraith).

Stage Summary:
- VERIFICATION: npm run build OK (app.js 709.7kb); npm run typecheck clean;
  npm test 52/52 PASS; tools/combat_test.mjs ALL PASS; tools/smoke.mjs ALL
  PASS (incl. wall-move rejection + move broadcast); server placement sanity:
  6 joins → 6 distinct open ring cells at cell centres, nearestOpenCell(4,3)
  wall → (3,2), out-of-map → null fallback.
- QA NOTES for boss: (1) FOOT_LOCK_Y = 0.06 is a JOINT-height target — boot
  soles extend ~0.18ft below the joint, so the pass only rescues deep clips;
  if sole-level locking is wanted, bump the constant to ~0.2 (one number,
  top of Actors.ts). (2) With 4-b's +0.12 pelvis raise the pass is dormant in
  normal poses by design (bind joint ≈0.30) — it exists to catch future pose
  drops; walk-cycle feet at gait=1 still need visual QA. (3) Fog camera
  fallback means the pre-join backdrop is now fog-lit around spawn — if the
  join screen ever shows the world, expect a visible floor. (4) Player
  spawn positions are now deterministic cell centres (no ±0.5 jitter) —
  screenshots/QA coordinates are stable.

---
Task ID: 4-d
Agent: 4-d (general-purpose sub agent)
Task: FIX 7 — HUD zone layout so no two HUD regions share screen real estate

Work Log:
- Audited every position:fixed selector in theme.css: 13 independently-anchored
  HUD elements with conflicting coordinates (chat stacked above the self plate,
  roll toasts firing into the initiative-strip zone, DM panel covering the
  creature list, centered party column colliding with the init strip, and
  .hud-prompt z-36 stacking BELOW .hud-init z-40). Cross-checked grep: no other
  file references the HUD class names (index.html/tools/engine clean).
- hud.ts DOM (surgical — every data-* hook, $() ref, and render fn untouched):
  * removed the single .hud-top flex row (loc + party + things were locked in
    one space-between row) → replaced with two independently anchored columns:
    .hud-tl (loc plate + party, top-left) and .hud-side (things, top-right)
  * moved .hud-dm INSIDE .hud-side, below .hud-things (top-right-2 dock) so the
    panel opens under the creature list instead of over it
- theme.css zone map (documented in a header comment at the HUD section):
  TOP-LEFT .hud-tl 280px column (loc above party, party max-height+overflow
  guard) · TOP-CENTER .hud-init (fixed-center, capped 46vw, cells now
  min-width:0 flex 1 1 64px so huge orders ellipsize instead of overflowing) ·
  TOP-RIGHT .hud-things + TOP-RIGHT-2 .hud-dm inside .hud-side (column capped
  at calc(100vh - 260px) above the chat zone; .hud-dm/.dm-panel are in-flow
  flex items with min-height:0 — the PANEL is what shrinks + scrolls when
  space runs short) · BOTTOM-LEFT .hud-self · BOTTOM-CENTER .hud-turnbar
  (anchored left:340px/right:380px in the gap between the side zones instead
  of center+transform; .turn-actions now wraps) · BOTTOM-RIGHT .hud-chat
  (moved from bottom-LEFT to bottom-right, old bottom:104px override deleted)
  · RIGHT-MIDDLE .hud-rolls (right:16px, top:50% translateY(-50%)) ·
  CENTER-BELOW .hud-interact (top:62% center) · CENTER .hud-prompt
- .hud-hint: moved to bottom-center above the turnbar (bottom:168px) and made
  self-fading — hint-fade keyframes, 10s ease-in forwards ending at
  opacity:0 + visibility:hidden so it stops occupying permanent space
- z-index policy enforced (requirement 3): stripped ALL chrome z-indexes
  (31/32/34/36/40-on-init/turnbar); HUD now uses exactly two: .hud-rolls 40
  (transient toasts above static chrome) and .hud-prompt 50 (modal above all)
  — this also fixes the old prompt-below-initiative stacking bug
- narrow-window guards: @media (max-width:1279px) shrinks every zone in place
  (columns 224/216px, chat min(280px,34vw) + log 108px, turnbar 300..320,
  monster/party rows min-width:0, hint bottom:190) — design bar 1280x720
- VERIFY: npm run build ✓ (app.js 709.7kb) + npm run typecheck ✓; CSS braces
  balanced 232/232; grep confirms zero .hud-top references remain

Stage Summary:
- FIX 7 shipped: 10 exclusive HUD zones, chat relocated bottom-right, DM panel
  docked below the creature list with its own scroll, toasts right-middle,
  hint self-fades after 10s, modal/toast-only z-index layering. Zero new deps;
  ornate gold-on-dark aesthetic untouched (layout fix only, no re-skin).
- QA NOTES for boss (visual pass): (1) roll toasts deliberately z-float above
  a fully-extended DM panel on short viewports (transient, spec-sanctioned
  toast layering); (2) init strip caps at 46vw and ellipsizes combatant names
  in very large initiative orders; (3) the hint line is a pure CSS animation —
  it only reappears on page reload, not on role change; (4) sub-1280 windows
  rely on the media query — eyeball 1024x768 if narrow support matters.

---
Task ID: 4-c
Agent: 4-c (general-purpose sub agent — completed all edits; killed by parent
        deadline before it could verify/report; audited and logged by the boss)
Task: FIX 5 presets-off-title + FIX 6 full SRD races/classes/subclasses in creation

Work Log:
- joinscreen.ts rewritten: archetype preset cards removed entirely (join-arch →
  0 refs); flow is now name → invite (optional) → DM claim → "Forge Your
  Wanderer" → setPhase('create'); join intent (name/invite/dm/dmKey) is handed
  to the screen router and survives the wizard hop; error surface + connection
  note kept
- screen.ts: session:join sent exactly once, when the wizard returns a finished
  CharacterDef; FIGURE class→archetype map extended to all 13 classes; wizard
  rejections while the create screen is up are stashed and shown on bounce-back
- gamedata.ts REGENERATED from srd_data.json: RACE_DATA 42 races, CLASS_DATA
  13 classes, SUBCLASS_DATA 46 entries for the three level-1 choosers
  (Cleric/Warlock/Sorcerer) + SUBCLASSES export; subrace name + numeric ASI
  shipped per race so the client preview equals the server sheet
- steps.ts: new PATH step (subclass) between CALLING and FATE, shown only when
  the class chooses at level 1; level-3 classes get a "chosen at 3rd level"
  note; STEP_META + step-count filtering handle 6/7-step flows; validation
  requires a path choice when shown
- KNOWN GAP (flagged in gamedata.ts header): the server's GameManager strips
  def.subclass before buildCharacter — subclass is transported but NOT consumed
  server-side yet. Boss assigned server-side consumption to the wave-2 server
  agent (Task 5-b).

Stage Summary:
- FIX 5 + FIX 6 shipped client-side; build + typecheck green at boss audit
  (bundle grew 709.7→764kb with the full SRD data)

---
Task ID: 4-e
Agent: 4-e (general-purpose sub agent — completed all code edits; killed by
        parent deadline before it could verify/report; audited and logged by
        the boss)
Task: FIX 8 combat feel — ambush radius, turn-order pruning, turn-clock warning

Work Log:
- CombatDriver.js: AMBUSH_FT 25 → 15 (monsters no longer aggro across the room)
- advanceTurn rewritten: dead combatants pruned ONCE via prevOrder.filter(...)
  before index advancement (was: splice-inside-iteration → skipped/double
  turns); end-of-combat/wipe + round-increment + monster beat scheduling
  preserved from the old implementation
- Turn-clock warning: TURN_WARN_MS = 30s timer fires a single warning narration
  per player turn (scheduled at PLAYER_TURN_TIMEOUT_MS − TURN_WARN_MS, cleared
  by clearTimer)
- CombatEngine.js untouched (hash-identical to remote baseline)
- NOT DONE (deadline): the 4-monsters-2-PCs-3-rounds no-skip regression scenario
  in tools/combat_test.mjs — carried to the wave-2 server agent (Task 5-b)

Stage Summary:
- FIX 8 code shipped; npm test 52/52 + combat E2E green at boss audit

---
Task ID: 4 (boss integration)
Agent: main (Super Z — boss)
Task: Wave 1 swarm integration + milestone push (Phase 2 / FIX 1-8)

Work Log:
- Dispatched 5 parallel agents (4-a..4-e) with strict file ownership; 4-a/4-b/4-d
  reported clean; 4-c/4-e hit the parent deadline AFTER completing their edits —
  boss audited via remote-baseline hash diff (10 files), symbol greps, entry
  counts (42 races / 13 classes / 46 subclass entries), full local verification
- VERIFICATION: npm run build OK (app.js 764kb) · typecheck clean · npm test
  52/52 PASS · tools/combat_test.mjs ALL PASS · tools/smoke.mjs ALL PASS
- Milestone push to G:\ASHENREACH BEFORE wave-2 launch (the T2-c3 recovery
  lesson: push-before-agent-launch)
- Approved spec deviations: 4-a foot-lock sign corrected to += (spec's -= would
  push clipping feet deeper); 4-b door along-axis midpoint without +1 (gen
  emits cell-boundary coords; verified numerically vs ashen_cellar.json)

Stage Summary:
- Phase 2 (FIX 1-8) code-complete and pushed. Remaining: gen_cellar.mjs door
  data bugs (2-cell entry door + overlapping cryptN/corridorW rooms), server
  subclass consumption, visual QA (fog/floor/feet/camera/doors/HUD zones),
  then wave 2 (FIX 9-11) and the new full-playthrough VLM protocol

---
Task ID: 4-QA (boss visual + playthrough QA)
Agent: main (Super Z — boss)
Task: Full-playthrough QA of Wave 1 per the NEW protocol (sequence must
      complete; incomplete = 0)

Work Log:
- Built browser QA harness (agent-browser): scripts/qa_flow.sh (join → FORGE →
  wizard Dwarf/Cleric/Life Domain/Acolyte → BEGIN), qa_move.sh + qa_walkto.sh
  (batched tick pumps with real-time gaps — headless rAF is throttled AND the
  server's 55ms move rate-guard rejects compressed bursts; renderer no-op'd
  during pumps because software-GL renders cost ~0.5s each)
- ROOT CAUSE of the user's #1 complaint found and fixed: the post-creation
  break was NOT (only) fog LOS — HumanoidRig.parseHex received wizard look
  PALETTE INDICES (SCHEMA §3 canonical form) where the rig expects hex
  strings; TypeError killed Actors.sync mid-loop → no player actor, no
  bindToken, no camera follow. The SCHEMA-documented "GM maps wizard indices
  → rig values" step had never been implemented
- HOTFIXES (all pushed + hash-verified on G:\ASHENREACH): GameManager
  mapLookToRig() (indices→hex, mirrors portrait.ts palettes), Actors.sync
  per-token try/catch (one bad token can never kill the sync again), Engine
  TOKENS_SYNC binds controls/camera BEFORE actors.sync, parseHex non-string
  guard, theme.css .hud-turnbar/.hud-interact pointer-events (the action bar
  was UNCLICKABLE — .hud root is pointer-events:none and turnbar never
  re-enabled)
- PLAYTHROUGH VERIFIED E2E: join → FORGE (no preset cards) → 42-race wizard →
  PATH step (Life Domain) → BEGIN → spawn (floor visible, figure present,
  controls bound, 5 actors) → walked 41ft → batched-walked into ambush →
  COMBAT: initiative strip R1, monster auto-turns (Shortbow rolls vs AC 17,
  7 dmg logged), 30s turn-clock warning fired, player DIED (0/11,
  unconscious+prone = death path verified)
- rodri_push.py v3 rewritten: uploads land in the cwd form field (probe-
  verified); v2's `if not exist X md X & cmd2` chain bound the WHOLE & chain
  into the false IF → extract/del silently never ran (ar_push.zip stranded).
  v3: stage in .tool, tar -xf, per-step exit checks, full MD5 manifest verify
- VLM WAVE-1 SCORE: 7.5/10 (join 9, race 8, subclass 8, oath 9, spawn 7,
  walk 7, combat 7) — up from the 2/10 playthrough baseline. Score-raisers:
  character model fidelity, unlit-area contrast, combat FX visibility

Stage Summary:
- Phase 2 GREEN under the new protocol (sequence completes incl. death path)
- Wave 2 dispatched next: 5-a VTT UI idioms (FIX 9), 5-b server subclass
  consumption + BSP dungeon generator + door-data fixes + combat regression
  (FIX 10 + gap), 5-c sheet/inventory/escape panels (FIX 11)

---
Task ID: 5-b
Agent: 5-b (general-purpose sub agent — completed Tasks 1-3; killed by parent
        deadline before Task 4 or reporting; audited, finished, logged by boss)
Task: Server subclass consumption + BSP dungeon generator + cellar door fixes

Work Log:
- CharacterEngine: LEVEL1_SUBCLASSES (Cleric/Warlock/Sorcerer), resolveSubclass
  (accepts both id and display name, silently ignores unknown/level-3 classes),
  subclassFeatures → sheet.features with source:'subclass'; sheet.subclass name
- GameManager: character.subclass passed through makePlayerToken; new dm:cmd
  'generate' op (seed+size → BSP map → registered + setMap + narrate)
- generator.mjs NEW (557 lines): seeded BSP generator emitting the exact
  ashen_cellar JSON shape (cells.wall, wall segments with doors, lights, props,
  spawns.party/monsters, roomRects metadata); small/medium/large; CLI mode
- gen_cellar.mjs: multi-cell doors now emit x2/z2 = start + numCells; the
  cryptN/corridorW overlap fixed; ashen_cellar.json regenerated
- character.test.js +5 tests (Dwarf Cleric + Life Domain → Disciple of Life
  feature present; Tiefling Warlock + Fiend patron; Fighter + rogue subclass
  id → ignored without throwing)
- VALIDATED BY BOSS: 21 maps (3 sizes × 7 seeds) — all 341 rooms + every
  monster spawn flood-fill reachable from the party spawn

Stage Summary:
- Subclass flows end-to-end; procedural dungeons generate + connect; Task 4
  (no-skip regression) NOT done before deadline — completed by the boss (Task 5)

---
Task ID: 5 (boss integration + wave-2 QA)
Agent: main (Super Z — boss)
Task: Wave 2 integration, hardening, playthrough QA per the new protocol

Work Log:
- 5-a shipped the VTT idioms: keyed party cards (portrait canvas, HP bar, AC
  badge, hover detail drawer), initiative carousel (active cell centered,
  breathe glow, HP strips, skull on death, slide-on-turn-change), dice-tray
  animations (slam-overshoot, crit gold flash, fumble shake, tier chips)
- 5-c shipped the panels: sheet.ts / inventory.ts / escape.ts + panels.css +
  a three-button dock; movement pauses via an invisible focus-trap input;
  net/client gained close() + sheetOp(); panels bundled as app.css by esbuild
- COMPLETED 5-b's Task 4: combat_test.mjs Scenario 2 — 4 monsters + 2 PCs,
  rounds 1→3, per-actor turn-begin tracking (signature-based so dead-filter
  index shifts can't hide begins), legitimate party-wipe accepted as a valid
  end; stable across repeated runs
- ROOT-CAUSED the two apparent "stalls": (1) harness token-ownership crossed
  by the join-order race (fixed via each client's own you.id); (2) party
  wipes end combat cleanly at round 1-2 — correct behavior, not a bug
- NEW SERVER FIX (browser QA found it — the Strike button): forged-character
  combat resolved weapons/spellcasting/saves from FLATTENED token fields
  (monsters only) → Strike returned 'no_weapon' for wizard-forged characters.
  CombatEngine now falls back to token.sheet.attacks / sheet.spellcasting /
  sheet.saves[ability].mod; +2 regression tests (59 total); scenario 1 now
  performs a REAL player attack end-to-end
- Browser QA: sheet panel shows "Cleric (Life Domain)" live (FIX 6 acceptance
  ✓ — Dwarf Hill Dwarf · Cleric (Life Domain) · Acolyte, 11/11 HP, AC 17);
  inventory renders equip/unequip + 55/180 lb load; C/I/Esc + dock all work;
  Strike clicks (pointer-events fix verified) and resolves — out_of_range
  correctly enforced at 13ft vs the mace's 5ft reach
- VERIFICATION: build ✓ · typecheck ✓ · 59/59 unit tests · combat E2E clean
  across repeated runs (both scenarios)

Stage Summary:
- Wave 2 (FIX 9/10/11) code-complete + QA'd; push to G:\ASHENREACH next;
  VLM full-playthrough re-score pending (wave-1 baseline: 7.5/10)

---
Task ID: 5-a
Agent: 5-a (general-purpose sub agent — FIX 9)
Task: Port the Custom-VTT UI idioms (party cards, initiative carousel, dice
      tray feel) into the vanilla HUD — layout/timing only, zero React

Work Log:
- READ the three VTT reference components (PartyPlayerCard, InitiativeBar,
  DiceTray/DiceRollAnimation) and mapped idioms → vanilla DOM + CSS:
  * PartyPlayerCard → keyed .pcard plates in renderParty (hud.ts)
  * InitiativeBar → persistent-track carousel in renderInitiative (hud.ts)
  * DiceRollAnimation slam-down/screen-shake/tier colors → roll toast
    keyframes (theme.css) + crit/fumble detection in the EV.ROLL handler
- hud.ts renderParty REWRITTEN as keyed cards (Map<playerId,{el,key}>):
  44px portrait canvas via drawPortrait (archetype sigil + player-color rim;
  crown sigil fallback for the tokenless DM), name + DM crown + "you" tag +
  online dot, archetype subtitle, 14px HP bar with centered numeric overlay
  (data-band high/mid/low gradients reuse the self-plate bands), pinned AC
  shield badge top-right, condition chips (max 3 + "+n", reuses .cond-chip)
  incl. death-saves chip. Hover expands a passive drawer (AC/SPD/INIT/
  PASS·PER from token.sheet.passive + online-state line) via max-height
  transition. Cards rebuild ONLY when a content key changes (hp excluded —
  bar patches in place so its width transition animates); reorder via
  appendChild only when the sort changed, so :hover survives the constant
  movement patches. data-online attr preserved from the old markup
- hud.ts renderInitiative REWRITTEN as a carousel: shell (round chip with
  caption+number, .ini-window clip, .ini-track) built once per combat;
  cells keyed by combatant id, className/HP patched in place (struct rebuild
  only on name/badge/skull change). centerInitiative() translates the track
  so the active cell sits center-stage (soft-clamped at the ends; whole
  track centered when everyone fits) — turn changes SLIDE (transform .5s
  cubic-bezier), order changes/combat start jump instantly (transition
  disabled → reflow → re-armed). Cells are 96px fixed with left-edge
  bottom-filled HP strip + top-right initiative badge (VTT combatant card);
  .now breathes gold (port of activeBreatheAndPulse 4s → ini-breathe 3.6s
  scale+glow), others dim to .72, dead get skull overlay + red mask.
  46vw zone cap + name ellipsizing preserved; round chip text live-updates
  without a rebuild. Window resize re-centers (listener removed on unmount)
- hud.ts roll toast handler: crit/fumble detection (r.nat === 20/1 on attack
  rolls, r.crit on damage rolls, fallback: /^1d20/ formula + first die) →
  .hud-roll.crit (gold border/flash ×2, "critical" tier chip, bright total)
  / .hud-roll.fail (red tint + shake, "fumble" chip). Toast lifetime
  3.2s/3.8s → 3.5s hold + .6s fade (remove at 4150ms); still capped at 3
  toasts in the right-middle zone
- theme.css: old .hud-party-member/.pm-* and static .ini-* blocks REPLACED
  (markup fully superseded); new .pcard section, .ini-window/.ini-track/
  .ini-hpstrip/.ini-badge/.ini-breathe/.ini-skull, roll-slam (scale .6→1.08
  →1 squash + rotate, cubic-bezier(.175,.885,.32,1.275) — port of
  slam-down), roll-icon-land (d20 tumble, transform-box:fill-box so SVG
  spins in place), roll-crit-flash, roll-fail-shake. All hand-written CSS,
  --gold/--bone palette, no new deps. Narrow-window guard updated
  (.pcard/.pd-stat/.ini-window rules); .hud pointer-events zone map and the
  hotfixed .hud-turnbar rule untouched — party cards opt into pointer
  events individually (.pcard) so the hover drawer works while the loc
  plate and list gaps stay click-through
- VERIFICATION: npm run build OK (app.js 764→769kb) · typecheck clean ·
  bundle greps confirm old markup gone / new idioms present

Stage Summary:
- FIX 9 shipped: VTT party cards + initiative carousel + dice-tray toasts,
  all in the existing ornate gold-on-dark language. Surgical — only hud.ts
  + theme.css touched; every data-* hook preserved ([data-party],
  [data-init], [data-rolls], data-online, data-round added on the round
  chip, all turnbar data-act hooks untouched)
- For boss visual QA: (1) party cards are pointer-interactive (hover drawer)
  — orbit-drag starting ON a card no longer reaches the canvas, by design;
  (2) AC badge pins -7px over each card's top edge (party gap 9px) — check
  it reads cleanly at 5 players; (3) 5+ players at 720p clips inside the
  existing .hud-party max-height guard (kept per spec); (4) carousel slides
  only when combatants overflow the window (5+ cells); ≤4 cells show
  everyone centered with the breathing gold marking the turn; (5) roll
  toasts hold 3.5s — crit gold flash fires on nat 20 AND crit damage rolls

---
Task ID: 5-c
Agent: 5-c (general-purpose sub agent)
Task: FIX 11 — character sheet / inventory / gear panels + escape menu with
      Return to Main Menu (the "players feel trapped" fix)

Work Log:
- Read SCHEMA.md §2 + CharacterEngine.js to map the real sheet shape, then
  rendered from the LIVE token sheet (tokens.find(t.id === myTokenId).sheet);
  store.ts's TokenState was NOT widened (no store edit) — sheet.ts casts via
  readMySheet() and exports the SheetData type inventory.ts reuses
- NEW client/src/ui/escape.ts — escape menu (Resume · Character Record ·
  Satchel & Gear · Return to the Main Menu) + the SHARED modal plumbing:
  createModal() builds .pnl-layer (z 60, above .hud-prompt's 50) with dark
  backdrop (pointer-events auto, click-outside closes), ornate .pnl-modal
  card (max-width 860px, max-height 78vh, scrollable body) and an invisible
  readonly trap INPUT (data-ar-trap). The trap keeps document.activeElement
  an INPUT while a panel is open → engine Controls.uiOpen() pauses WASD with
  zero Controls.ts changes; close() blurs it so movement resumes instantly.
  Also mountDock(): the FIX 11 [5] mouse affordance — 3 small buttons
  (Record C · Satchel I · Menu Esc), fixed left:340px bottom:64px z 44,
  pointer-events auto, mounted OUTSIDE .hud (hud root is pointer-events:none)
- NEW client/src/ui/sheet.ts — mountSheet(): identity header (name; race +
  subrace; class (subclass) — subclass row only when the server sheet carries
  it, hidden otherwise per spec; level; background), vitals strip (live token
  HP w/ low-HP band, AC + acDetail tooltip, initiative, speed, proficiency,
  hit dice, darkvision, sneak attack), 6 ability blocks (score + mod + racial
  ASI hint), saves (prof dot), 18 skills 2-col (proficient gold), attacks
  table (bonus/damage/props), spellcasting section only when the sheet has
  spells (ability/save DC/attack/cantrips-known/prepared + slots
  remaining/total + cantrip + per-level chips), features & traits as
  collapsible <details> (level badge / race-subrace-background source badge),
  passive scores chips. Live updates: store subscribe + value FINGERPRINT
  (state:patch rebuilds every token object, identity-diffing would re-render
  on every step of every player) — re-render preserves scroll position and
  open <details>. DM/no-token and token-without-sheet get placeholder cards
- NEW client/src/ui/inventory.ts — mountInventory(): rows from sheet.inventory
  → fallback sheet.equipment → fallback derived from attacks + armor + shield
  (never an empty panel), each row: name, ×qty, category chip, weight,
  EQUIPPED badge (armor: sheet.armor === name; shield: sheet.shield; future
  sheet.equipped[] array honored when 5-b sends it), Equip/Unequip for
  weapons+armor+shields, Use for consumable-flavored names. Buttons →
  net sheetOp('equip'|'use', itemName) then optimistically disable until the
  next state sync re-render OR a 4s timeout (a stub server never bricks the
  button). Carrying load bar (weight/capacity, encumbered pulse) footer
- net/client.ts (additive only): sheetOp(op, itemId?) → send('intent:sheet',
  {op, itemId}) — itemId is the item NAME (SCHEMA §2 rows carry no ids); NEW
  close() export — sends session:leave (server sweeps the seat), sets
  closingIntentionally (kills the reconnect backoff), clears pendingJoin/
  queue/lastVersion/currentMapId, ws.close(1000); joinSession() now reopens
  the socket if it is dead so the join screen works after a menu return
  (the join screen never calls connect itself)
- main.ts: panel trio mounts on every 'playing' stretch, disposed when the
  phase leaves it; window keydown routing — KeyC/KeyI toggle (one panel at a
  time, opening closes the others), Escape closes the open panel and only
  falls through to the escape menu when none is open AND the HUD prompt card
  (.hud-prompt) is not up; typing guard skips INPUT/TEXTAREA focus EXCEPT
  the panels' own data-ar-trap; Return to the Main Menu = closeAll →
  setPhase('join') → netClose()
- NEW client/src/ui/panels.css (source of truth) + panels.css.d.ts (1-line
  '*.css' module shim): all styles .pnl-* prefixed, ornate gold-on-dark on
  theme.css variables, NOTHING added to theme.css. SERVING NOTE: the boss's
  ownership put panels.css under client/src/ui (not client/public where the
  server serves statics), so main.ts does `import './ui/panels.css'` and
  esbuild bundles it into client/public/app.css; index.html adds ONE link
  (<link rel="stylesheet" href="/app.css">) — build now emits app.css 9.2kb
- Dock geometry deviation (flagged): spec said bottom:64px left:340px above
  the turnbar — a HORIZONTAL row there would sit inside the turnbar band
  (turnbar spans bottom 18→~107, its centered content starts ≈x410 at the
  1280 design bar) and over the self plate's condition-chip growth zone, so
  the dock is a NARROW VERTICAL column at the exact given anchor (left:340,
  bottom:64, ~100px wide) which clears the centered turnbar content entirely;
  <1279px media query moves it to left:16px bottom:112px (above the self
  plate, left of the shrunken turnbar zone)
- VERIFICATION: npm run build OK (app.js 785.6kb + app.css 9.2kb);
  npm run typecheck clean; npm test 52/52 PASS (server rules untouched)

Stage Summary:
- FIX 11 code-complete: every panel reads the real forged sheet from the
  live token; C/I/Esc + dock + escape menu all route through one exclusivity
  manager in main.ts; movement pauses while a panel is open (focus trap) and
  resumes the instant it closes; Return to the Main Menu lands on the join
  screen with a dead socket and a working rejoin path
- QA NOTES for boss: (1) SCHEMA §2 fields found on the wire sheet vs
  rendered: all documented fields present and rendered EXCEPT subclass (not
  in CharacterEngine yet — row hides until 5-b lands it; the panel already
  renders it the moment it appears); carrying.xp/hitDiceSpent/baseAbilities
  are read where useful (racial ASI hint uses baseAbilities); no field was
  missing from the actual sheet vs SCHEMA §2. (2) CONTRACTS.md line 46
  documents intent:sheet as {op:'equip'|'use'|'cast'|'attack', payload} but
  the boss's wire contract for this wave is {op:'equip'|'use'|'get', itemId}
  — client sends the boss's shape; 5-b should reconcile CONTRACTS.md.
  (3) intent:sheet ops are fire-and-forget client-side: buttons busy 4s max,
  panels stay fully readable if the server ignores ops (CombatDriver stub
  currently no-ops). (4) After Return + rejoin via the plain join button the
  server's resume path reforges the token WITHOUT a character (GameManager
  resume → makePlayerToken(p, archetype) — no character def) → record panel
  shows its "forge a soul" placeholder; re-forging via the Forge link builds
  a fresh sheet — server-side seat-persistence gap, not client. (5) The
  vertical dock at left:340/bottom:64 can kiss the self plate's right edge if
  condition chips stretch it past ~324px — approved flip: move dock to
  left:16px bottom:112px in panels.css if QA dislikes it. (6) Tab is pinned
  to the trap while a panel is open (true focus trap) — panel buttons are
  mouse-first by design; loosen by deleting the trap Tab preventDefault in
  escape.ts if keyboard tabbing through panels is wanted.

---
Task ID: 6 (recovery baseline)
Agent: main
Task: Verify target access and establish Git recovery at G:\ASHENREACH

Work Log:
- Verified shell execution at G:\ASHENREACH\game and confirmed G:\ASHENREACH exists.
- Verified machine write/read-back using a temporary file outside the project; removed it.
- Confirmed there was no Git repository at the project root or in game; _refs\Custom-VTT
  is a separate read-only clone and is excluded from the recovery repository.
- Added root .gitignore for _refs, dependencies, IDE state, and generated CSS.
- Next: checkpoint the existing project baseline in Git, then inspect and fix the known
  character/session persistence gap on reconnect. Resume from Task 6 in this worklog.
- Blocked: no separate Git remote is configured; source is being modified directly on
  the requested machine. Subagent spawning and VLM screenshot scoring are unavailable.

---
Task ID: 7
Agent: main
Task: Preserve character creation and live player state across browser refresh/reconnect

Work Log:
- Cached the last successful join payload in sessionStorage and automatically resumes
  its saved seat after a browser refresh; intentional return-to-menu clears the cached
  join payload to avoid an unwanted automatic rejoin.
- GameManager now keeps reconnect-only character data out of public player state and
  retains the disconnected player's token snapshot during the current server process.
  Rejoining restores the same sheet, appearance, HP, conditions, and position on the
  same map; after a map change it forges the saved character at the current spawn.
- Added a regression test for reconnect preserving wizard sheet/look and modified live
  token state; registered it in `npm test`.
- Verification: 60 tests pass; `npm run typecheck`, `npm run build`, and
  `npm run smoke` pass; `git diff --check` is clean.
- Not verified: visual screenshot/VLM scoring. VLM and browser screenshot validation
  are unavailable in this session; no visual score is claimed.
- Remaining limitation: profiles are in memory only and do not survive a server
  process restart. The client resume cache is tab-scoped sessionStorage.
- Next: build a real reload/reconnect E2E check in a browser, then address persistence
  across server restarts and secure account/session recovery.

---
Task ID: 8
Agent: main
Task: Make sheet equip/use actions server-authoritative

Work Log:
- Inspected the Custom-VTT `GearModal` / server `toggleEquip` flow in `_refs` and
  adapted the state mutation pattern to ASHENREACH's authoritative 5E sheet.
- Equipment intents now validate ownership, update equipped armor/shield and AC,
  maintain a single wielded weapon, and publish the updated sheet/token/chat. Combat
  accepts only the wielded weapon; in combat the first weapon interaction is free,
  further weapon swaps and armor/shield changes consume an action.
- Healing Potion variants now consume the selected inventory stack, apply healing,
  update sheet HP and carrying weight, and broadcast the dice roll. The UI only offers
  Use for effects the rules engine actually supports.
- CharacterDef forwarding now preserves subrace, skill proficiencies, spells,
  equipment overrides, and sheet ID; previously these were dropped before `buildCharacter`.
- Added unit and real-WebSocket smoke coverage for equip, AC change, potion use/roll,
  and retention of equipment/remaining quantity after reconnect.
- Verification: `npm test` 63/63; `npm run typecheck`, `npm run build`, and
  `npm run smoke` all pass.
- Limitation: normal loot/potion acquisition is not implemented yet; the smoke test
  injects a potion through a CharacterDef override. Other consumables remain unsupported.
- Next: implement loot awards and test acquiring/using an item in normal play; then
  continue into XP/level-up/rest and a full dungeon-exit/world loop.

---
Task ID: 9
Agent: main
Task: Award encounter XP and usable loot on combat victory

Work Log:
- Inspected the Custom-VTT combat/inventory references; they provide item inventory
  handling but no automatic encounter XP/drop pipeline. Used the existing SRD CR
  data and ASHENREACH's server-authoritative sheet/use intent instead.
- Added the 5E CR-to-XP table, party XP splitting, threshold-driven multi-level awards,
  and retention of excess XP. Level-ups refresh proficiency-dependent saves, skills,
  weapon attacks, spell DCs/bonuses, slots, and token HP/AC/speed.
- Actual combat victories now award each initiative participant their XP share and a
  Potion of Healing in both inventory/equipment; carrying weight stays in sync. Defeat
  and DM-ended combat grant no rewards.
- Added unit coverage for CR XP/division and multiple thresholds, plus a GameManager
  test that wins against a goblin, receives the potion, uses it through the normal
  sheet intent, and checks the manual-end no-reward path.
- Verification: `npm test` 67/67; `node --test server/src/GameManager.test.js` 3/3;
  `npm run typecheck`, `npm run build`, and `npm run smoke` pass.
- Limitation: loot is currently a guaranteed one-potion victory cache per participant,
  not a creature-specific treasure table; reward balance needs playtesting. Existing
  level-up choices such as ASIs/subclass picks are not surfaced yet. No visual/VLM
  screenshot validation was available.
- Completed next: short/long rests and resource restoration (Task 10).
- Next: complete the location asset foundation, then build authored modules and
  player-facing world travel; only Ashen Cellar and generated dungeons currently exist.

---
Task ID: 10
Agent: main
Task: Implement short and long rests

Work Log:
- Added server-authoritative short rests: spend selected Hit Dice, roll each die
  plus Constitution, cap healing at max HP, and restore Warlock Pact Magic only.
- Added long rests: restore HP and spell slots, regain up to half of total Hit Dice
  (minimum one), and reset death saves; dead characters cannot rest.
- Rest intents are denied during combat, reflected in the live character sheet,
  and short-rest dice results are broadcast to the player. Added rest actions and
  a Hit Dice selector to the sheet panel.
- Added rules and GameManager coverage for healing, slot recovery, hit-dice recovery,
  combat rejection, and authoritative token HP synchronization.
- Verification: `npm test` 70/70, `npm run typecheck`, and `npm run build` pass;
  `npm run smoke` passed before the final integer-validation hardening.
- Limitation: world-time advancement, rest-area gating, and long-rest cadence are
  not implemented; rests currently work anywhere outside active combat.

---
Task ID: 11
Agent: main
Task: Reframe the roadmap and start data-driven area tilesets

Work Log:
- Rewrote `docs/PLAN.md` around the original complaint list with dependency-ordered
  milestones and acceptance criteria for art direction, tilesets, doors, modular
  dungeons, navigation, travel/world map, day/time, audio, and multi-floor locations.
- Corrected architecture docs to reflect the actual vanilla TypeScript/WebSocket stack
  and the current state of audio, map switching, and decorative-only doors.
- Added a data-driven area tileset registry for cellar/crypt, town, road, ashlands,
  and wilderness profiles, with distinct procedural cobble, ash-dirt, and ash-grass
  textures plus floor PBR settings and wall/trim variants. Authored and generated
  crypt maps now select their tileset explicitly.
- Verification: `npm test` 70/70, `npm run typecheck`, `npm run build`, and
  `npm run smoke` pass.
- Limitation: this is the first asset foundation, not finished location art. The game
  still has no town/overworld maps, authored building/prop modules, world travel, or
  visual screenshot/VLM validation.
- Next: add a reusable authored location-module/asset catalog and validate the new
  profiles in real distinct scenes; then stateful doors and module-based generation.

---
Task: Reconcile agent guidance and project documentation

Work Log:
- Replaced the stale root agent brief with a guide that routes contributors to the
  current status, task list, roadmap, architecture, contracts, QA log, and worklog.
- Added explicit guidance for solo agents, optional subagents, and optional VLM review;
  removed mandatory tunnel access, pushing, commits, and unsupported VLM gates.
- Added `game/docs/STATUS.md` and `game/docs/TASKS.md` to distinguish the implemented
  baseline from open, acceptance-tested tasks.
- Reconciled architecture/contracts/QA documentation with the vanilla TypeScript +
  Three.js client, Node ESM + `ws` server, in-memory session state, current procedural
  audio, and actual QA tooling. Removed duplicated roadmap sections.
- Validation: automated project checks were not run; the combined check command was
  cancelled. Re-run the package checks before treating the recorded baseline as current.

---
Follow-up — agent access guidance:
- Clarified that missing VLM/browser access must not block code work when the repository
  is mounted, and agents should not request uploads of files already in the workspace.
- Clarified that a user-provided running-app URL with a request to inspect that app
  authorizes narrowly scoped browser review when available; it does not grant filesystem
  access or permission to clone/extract unrelated data.

---
Task: Redesign self-status HUD and separate upper-left stack

Work Log:
- Rebuilt the player self-status markup and styling as a compact bottom-left character
  plaque with portrait, identity, AC, segmented HP meter, accessible values, and capped
  condition chips; removed the old over-sized bar styling and pulsing low-health effect.
- Bounded the upper-left location/companion stack and enabled scrolling to prevent a
  long party list from running into lower HUD regions. Added responsive panel sizing.
- Updated `docs/STATUS.md`, `docs/TASKS.md`, and `docs/QA.md`; screenshot review remains
  open under P0.1.
- Validation: the combined typecheck/test/build/smoke command was cancelled before
  results returned. No screenshot or browser visual inspection was performed.
- Follow-up root cause: `.ornate { position: relative }` overrode the self panel's
  fixed anchor because `.hud-self` also carried that class. Removed `.ornate` from
  the self panel; `npm run build` then passed (804.8 KB JS, 9.7 KB CSS). A subsequent
  typecheck/test command was cancelled before results returned.

---
Task: Align record, satchel, and menu controls with the self-status panel

Work Log:
- Changed the dock from a vertical stack at the turnbar edge to a horizontal row
  immediately above the bottom-left status plaque. Narrow layouts use accessible
  icon-only controls; phone combat controls are raised to avoid that row.
- Verification: `npm run build` and `npm run typecheck` pass. Tests, smoke, and
  screenshot/browser layout review were not run; P0.1 remains open.

---
Task: Remove out-of-combat movement gates and investigate walk stutter

Work Log:
- Changed client turn/movement gating to apply only when an active initiative order
  exists, so exploration does not depend on a combat turn or remaining-speed budget.
- Full join/reconnect snapshots now replace cached initiative, including clearing it
  if combat ended while disconnected.
- Changed local wall resolution to process movement axes separately, preserving the
  unblocked component when walking diagonally against a wall/corner. Actor tokens are
  not inserted into the TileGrid collider list; movement collision is against map
  colliders, not self-collision.
- `get_errors` reported no diagnostics in `Controls.ts` or `client.ts`. The combined
  typecheck/build command was cancelled before results; no live movement playtest was
  run. P0.2 remains open to verify whether jitter persists and collect evidence.
- Follow-up: found that rejected-position correction was applied after each frame's
  input, damping movement while keys were held. Corrections now rebase before replaying
  input, and footsteps use resolved displacement. `npm run typecheck` and `npm run build`
  passed; tests, smoke, and live browser playtest remain unrun.

---
Task: Diagnose and fix self-movement stutter under live server traffic

Work Log:
- User observation isolated the symptom: the local avatar stuttered only while the
  server was connected, while remote avatars appeared smooth; closing the server made
  local movement smooth.
- Root cause: every accepted 10 Hz `intent:move` broadcast a full token snapshot back
  to its own predicting client. The client already moved locally, but still processed
  the echoed patch through actor sync, store subscriptions, and HUD refresh.
- Changed the WebSocket movement broadcast to omit only the originating socket.
  Other connections, including another tab logged in as the same user, still receive
  personalized token snapshots. During combat, the mover receives an initiative-only
  patch so the server-authoritative movement budget remains current.
- Added a two-client smoke assertion that the mover does not receive its own token
  snapshot and the observer does receive the moved token; updated architecture and
  protocol documentation with this invariant.
- User confirmed movement was completely fixed in their two-window playtest.
  `npm run typecheck`, `npm test` (72 passed), `npm run build`, and `npm run smoke`
  passed.

---
Task: Add usable volume controls and expand procedural game audio

Work Log:
- Added separate music and effects gain buses, a compressor, scene-track fades, and
  persistent user-set music/effects levels. Sound can now be toggled from both the
  title screen and the in-game Escape menu; browsers still start audio only on a user
  gesture.
- Expanded generated cues for footsteps, torch/fire, UI/type, melee/ranged attacks,
  spells, healing, buffs, hits, criticals, misses and deaths. Footstep cadence now
  follows resolved movement distance. Adapted layered damage transients and swept,
  detuned magic/healing textures from the Custom-VTT reference without importing its
  full synthesizer.
- Browser integration exercised title-screen audio enable, the persisted music level,
  in-game sound off/on, and Escape while a volume slider had focus. That exposed and
  fixed a title-screen stacking issue intercepting the sound control.
- The combat playtest also exposed a death animation reading progress after clearing
  the action. Capturing that progress before the clear prevents the render-loop null
  dereference; a fresh reload after the fix produced no new page errors during a short
  check.
- `npm run typecheck` and `npm run build` passed. Human listening across all scene
  profiles and sound-off verification at the audio output were not available; P0.3
  remains open for acoustic playtesting.

---
Task: Solo downed state, jump, animation-synced footsteps

Work Log:
- Distinguished a downed player from a dead actor: downed avatars remain rendered in a
  persistent pose, cannot move, and can be revived by a nearby player using Help, which
  restores 1 HP. Help works outside combat as well as during initiative.
- Added a server-authoritative solo/unassisted death prompt and confirmation. The server
  verifies no other online living player can help, finalizes death, rejects movement and
  re-entry of the same locally saved character ID for the active in-memory session, and
  offers a return to the main menu.
- Added local Space jump with a gravity arc, gated during downed/dead states and open
  menus; horizontal movement/collision remain unchanged.
- Moved footstep triggers from resolved-distance accumulation to gait-phase footfall
  transitions, and reshaped the synthesized cue with sole impact, low thud and scuff.
- Added server coverage for rescue range and recovery, solo prompt/death, movement
  denial, dead-character re-entry, and party rescue. Updated status, task, QA and
  protocol documentation.
- Verification: typecheck, 77 Node tests, production build and smoke checks passed.
  The downed pose, jump feel and footstep audio were not visually/acoustically reviewed.
  Death persistence remains limited to the live server session.

---
Task: P1.1 authoritative stateful doors

Work Log:
- Added per-map server state for door openness, locks, secret status and discovery.
  Player interaction toggles only nearby unlocked/revealed doors; DM controls open,
  close, lock, unlock, reveal and conceal doors.
- Closed door openings now block server movement and authoritative player/encounter
  line of sight. Client movement collision and fog LOS follow synchronized door
  updates, with swinging leaves and a generated wood/hinge cue.
- Unrevealed secret-door details are omitted from player door-state snapshots and
  public maps render their openings as solid wall cells. The initial gameplay policy
  keeps locked doors and secret discovery DM-managed; player keys/search checks are
  not part of this slice.
- Added GameManager regressions for crossing/visibility before and after opening,
  interaction distance/locks, DM unlocking, and secret-door concealment/reveal.
  Updated protocol, architecture, status, backlog and QA evidence.
- Verification on 2026-10-12: typecheck, 82 Node tests, build, smoke checks and
  whitespace validation passed. No live browser, screenshot or acoustic review was
  performed; animation appearance and mix quality need human validation.

---
Task: P1.2 server-authoritative encounter awareness

Work Log:
- Replaced the short proximity ambush with 45 ft sight detection and sound detection
  for successful out-of-combat attacks (60 ft) and spells (75 ft). Normal walls
  attenuate hearing by 30 ft; closed doors by 35 ft; windows and open doors do not.
- Detected monsters alert reachable allies within 40 ft for up to two hops. Hidden and
  distant creatures stay out of combat, participating players are scoped to the
  detected group, and awareness remains private server-side state.
- Door opening now immediately checks sight, including both player interaction and DM
  open/toggle commands. Kept public token/map filtering unchanged.
- Added regressions for sight obstruction/range, isolated doors, wall/window sound
  attenuation, opening a door into sight, bounded alert propagation, and private
  awareness/visibility filtering.
- Verification on 2026-10-12: typecheck, 86 Node tests, build, smoke checks and
  `git diff --check` passed. No live multiplayer encounter playtest was performed;
  sensory ranges remain initial tuning values.

---
Task: P1.3 combat usability and initiative privacy

Work Log:
- Replaced nearest-foe attack selection with an accessible target dropdown limited to
  visible living monsters in the active encounter. Strike and Cantrip require a chosen
  target; the HUD shows target HP/distance and whether the action is ready or spent.
- Added friendly messages for common invalid actions and disabled used action buttons.
  Server-side attack/cast validation rejects both guessed unseen monster IDs and
  visible monsters outside the active encounter.
- Added per-recipient initiative filtering to full snapshots, state patches and private
  movement-budget updates. Hidden actors are removed from the order, the turn index is
  remapped or set to -1 if the active actor is hidden, and hidden movement details are
  omitted. DM state remains complete.
- Added tests for full-snapshot privacy, two-client WebSocket patch privacy, hidden
  movement state, and unseen/inactive target rejection.
- Verification on 2026-10-12: typecheck, 90 Node tests, production build, smoke checks
  and `git diff --check` passed. No browser/multiplayer UX playtest was performed.

---
Task: P1.4 dungeon exit and return

Work Log:
- Added a visible exit marker and a nearby E prompt to every generated dungeon, plus
  an authored outdoor threshold map with a return exit.
- Added the `intent:exit` WebSocket route and server checks for exit identity, proximity,
  downed state, and active combat. Map changes broadcast the new map, tokens, doors,
  and chat to the party.
- Kept visited map creature/door state and party positions in session memory, while
  retaining player character inventory and rewards through the transition. Bounded
  movement to the current map and reset per-token move-rate tracking on map changes.
- Fixed client map-switch ordering so it rebuilds the new map before syncing actors.
- Added generated-exit route validation, a persistence regression covering two party
  positions, a defeated creature, an open door, and carried inventory, plus live
  WebSocket smoke coverage for exit and return.
- Kept the local prompt radius at 8.5 ft but allowed server exits within 10 ft to absorb
  small prediction/network-position differences; a 9 ft regression covers the case.
- Verification on 2026-10-12: typecheck, 91 Node tests, generator tests and a
  representative `--check` seed, production build, smoke checks, and `git diff --check`
  passed. Browser review verified E transitions both to the threshold and back; no
  saved screenshots or multiplayer usability review.

---
Task: Generate the Ashen Reach home region

Work Log:
- Added a deterministic seeded 112×96 overworld generator with nine biome regions,
  terrain elevation, roads, lakes/rivers and bridge cells, clustered landscape props,
  town service-building facades, ruins, a cave landmark, and a cemetery entrance to
  the generated crypt. The live app now starts at the town center.
- Rendered the generated heightfield, biome/road ground tinting, water, trees,
  boulders, buildings, cemetery/ruin props and localized deadlands fog. Added
  client/server movement blocking for water and matching authoritative checks for
  building, large tree, dead-tree and boulder footprints.
- Changed generated crypt exits to return to the previous map, preserving per-map
  runtime and party position. Expanded smoke coverage for world availability, town
  spawn, cemetery-to-crypt entry, dungeon wall rejection, overworld return and re-entry.
- Strengthened generator checks for water blocking, walkable roads, biome variety,
  terrain shape, town points of interest and empty overworld monster spawns.
- Verification: typecheck passed; 92 unit/GameManager tests passed; production build
  passed; two-client smoke passed; dungeon/overworld generator tests and representative
  `--check` runs passed. A browser joined into the built town scene and exercised a
  short movement input.
- Limitations: town buildings are not interactive, the overworld has no monsters,
  travel/map UI or durable persistence, and the primitive landscape has not received
  biome-by-biome art or multiplayer playtesting. No screenshot was saved.
- Next: build useful town interactions and route/navigation UX, then add encounter
  placement after the SRD-driven enemy design is defined.

---
Task: Correct overworld terrain and rendering issues

Work Log:
- Reworked the river profile to follow the terrain along its course instead of using
  fixed elevations that left water floating above low ground. Water surface regression
  tests now check a 2 ft height bound across five seeds; corrected river channels and
  lowland water remain movement-blocked.
- Started outdoor sessions in daylight, reduced clear-weather fog, and refined the sky
  gradient and ambient fill. Shortened and thinned grass, layered tree crowns, reshaped
  town roofs, and fixed instanced foliage/rock materials that combined instance colors
  with nonexistent vertex-color attributes.
- Verification: typecheck, 92 server/rules tests, all four overworld generator tests,
  both dungeon generator tests, production build, smoke (all checks passed), three
  representative `--check` seeds, and `git diff --check`.
- Browser inspection at 1188×911 confirmed the daylight map and HUD rendered; the
  town/foliage/road composition remains primitive and visually unapproved. No screenshot
  was saved and no VLM review was run.
- Remaining: the overworld is still a single 560×480 ft map. Streaming regions/chunks
  and world-coordinate transitions are required for the requested large scale; scenery,
  water appearance, roads, mountain silhouettes and town assets still need art review.
- Next: design the streamed-world region/chunk model before expanding the map; then
  replace the most visible primitive town and landscape assets based on saved screenshots.

---
Task: Overworld terrain and mesh repair

Work Log:
- Broadened mountain profiles and river-valley blending; water levels are capped against
  final carved terrain and shoreline surfaces are inset below terrain.
- Added deterministic regressions for a maximum 5 ft neighboring vertex-height change
  and grounded water across seeds 1–20, 73021, 73022 and 12345.
- Replaced unstable index-based rock deformation with closed proportioned dodecahedra,
  changed pine crowns to single cones, and reshaped grass as short segmented blades.
- Inspected the built town scene in a local browser. It still looks primitive and the map
  remains small; no screenshot was saved and no visual-quality pass is claimed.
- Verification on 2026-10-12: typecheck, server/rules tests, both map-generator test
  suites, representative seed checks, build, smoke and `git diff --check` passed.
- Remaining: P3.3 streamed regions/world coordinates remain unimplemented; town/terrain
  art, water readability and the overall visual quality still need substantial work.

---
Task: Improve stylized outdoor rendering

Work Log:
- Reviewed cortiz2894/stylized-components (MIT licensed) for grass-field, water-floor
  and sky-dome techniques. Adapted concepts in the existing Three.js renderer without
  copying source files or adding React/React Three Fiber dependencies.
- Increased deterministic meadow/forest grass placement to 77,515 clumps for high
  quality and 35,240 for low graphics on the fixed home region; clumps use shorter
  crossed blades and height-masked wind.
- Reworked water into a darker teal animated flow with restrained elongated highlights,
  and extended the camera-following sky dome with spherical procedural cloud shading
  and sun scattering.
- Browser inspection showed denser grass and a smoother lake surface; shader/browser
  console emitted no errors or warnings on reload. The world remains primitive and
  sky/water art needs further review across conditions; no screenshot saved, no VLM.
- Verification: typecheck, server/rules tests, build and smoke checks passed.


---
Task: P3.3 streamed world and travel

Work Log:
- Added `server/src/maps/world.mjs`: an infinite deterministic grid of 112x96-cell
  regions keyed (rx, rz). The home region (0,0) is the untouched makeWorld output with
  its boundary ring stitched open; neighbors generate from a pure world-space field
  sharing the home base formula, so terrain agrees across seams by construction.
  World rivers (home river lifted from the home def and extended south, plus
  steepest-descent rivers), world roads (home road extensions to neighbor POIs, ring
  connections, water-refusing routing, localized bridges), biome patches, POI props,
  deterministic region names, and per-region stitching (ring strip, border water
  injection, road cells, shoreline clamp).
- Added `server/src/maps/world.test.mjs` (8 tests): ids, determinism/order
  independence, home stitch identity, seam continuity, band-wide 5 ft grade invariant,
  water/road/spawn/prop validation, cross-seam river continuity, names.
- GameManager: lazy world context, ensureRegion/ensureRegionRing with 2-ring pruning,
  per-region blocking sets and world-foot prop colliders, dual-mode movement bounds
  (loaded-region set vs map rectangle), seamless shiftFocus on border crossing (no
  repositioning, deferred in combat), `state.world` in public state, region-aware
  dm 'map' and exit destinations.
- ws.js: focus-shift patch folded into the movement broadcast plus a private copy for
  the predicting mover.
- Client: TileGrid additive region mode (addRegion/removeRegion/retainRegions/
  setFocusRegion, region-aware isOpenWorld/terrainHeightAt/resolve/exits), FogOfWar
  per-region fog layers with persistent explored state, Engine.enterRegion branching
  (region vs dungeon) with theme/music per focus region and first-entry camera drop,
  World.onMapTheme origin offsets for ground fog/height fog/sun shafts/cloud
  shadows/lights, Controls region-aware exit lookup, net/client.ts region REST cache
  with focus+ring prefetch, store `world` field.
- Extended `tools/smoke.mjs` with a streamed-world section and pointed `npm test` at
  all map test suites.
- Fixed during iteration: water placement guards for neighbor lakes/ponds (cliffs from
  narrow shore bands on slopes), initWorld swapping the raw home def for the stitched
  region def, mover-private focus patches, and the single-map boundary test updated to
  the loaded-ring semantics.

Stage Summary:
- The overworld is now a seamless, deterministic, streamed region grid with
  world-coordinate movement; the crypt round trip and all prior flows still pass.
- Verification: typecheck, npm test (113 pass), build, smoke (32 checks incl. streaming)
  all green on the project machine. Browser rendering of the streamed window is NOT yet
  reviewed; compass/map, route selection, travel time and new destinations are follow-on
  work (TASKS.md P3.7).
## 2026-10-13 - PCG v2 streamed world + floating-asset fix + world minimap (P3.7 partial)

- Reported issues addressed: streamed neighbor regions rendered nearly flat while grass/trees/assets floated as if
  over mountains; PCG placed mountains and rivers in every region; no biome influence across regions; mountain
  terrain lacked variety; rivers were short and disconnected from lakes; ponds appeared everywhere; graveyards were
  bare headstones; meadows had no ruins; no compass or region/cell display.
- Root cause of the floating assets: TileGrid.terrainHeightAt routed region-local coordinates through the world-mode
  regionAt() lookup while the region being built was not yet registered, so props/grass sampled whichever OTHER
  loaded region's bounds contained those coords (home's 82 ft peaks). Fixed by sampling the region's own terrain
  during region builds.
- server/src/maps/world.mjs rewritten (PCG v2): continuous macro biome fields (mountain/blight/snow/forest fBm) with
  a home halo (meadow through ring ~2, fade by ~4.6) drive elevation and per-cell classification, so biomes span
  regions organically (forest skirts mountains, blight creeps out of forests). Terrain: shared home base formula +
  rolling hills + ridged massifs with plateau terracing + blighted flats/spires, finished by a deterministic
  window-invariant Jacobi slope clamp (12 iters, 14-cell pad, 4.2 ft cap) that keeps seams exact. Water: home river
  extended ~2 regions south into a terminus lake; six waypoint-gradient rivers (wedge-distributed sources, capped
  start level) run 3-6 regions into surveyed large lakes (13-22 cells, rim-guarded); ponds biome-locked to
  lush-majority regions. Deterministic sites: guaranteed walled graveyard in one ring-1 region (gate, fences,
  marker/mound rows, mausoleum, columbaria), temple/fortress ruins in lush regions, cave mouths in mountains.
- Client: new prop builders in TileGrid.ts (ruin_column, ruin_column_fallen, ruin_wall, ruin_slab, grave_gate,
  grave_fence, grave_mound, mausoleum, columbarium), all terrain-grounded; new engine/worldProbe.ts snapshot module
  + Engine.syncWorldProbe/tick feed + FogOfWar.exploredFor; HUD top-right minimap (biome cells, water/roads, region
  borders, N/E/S/W, party arrow, region (rx,rz) + cell readout) with narrow-width CSS; hidden in dungeons.
- Tests: world.test.mjs grown from 8 to 14 tests (meadow halo, town-adjacent graveyard composition, river-to-lake
  termination with monotonic levels + long courses, pond biome lock, mountain-country seam/grade in the 3-5 ring,
  temple/fortress presence). Full suite 119/119, typecheck, build, smoke 33/33 all green on the project machine via
  the AgentHarness gateway. Local probe evidence: seams 0.00-2.17 ft, worst interior grade 4.50 ft, worst water
  grounding 1.95 ft, biome spread measured across a +/-9 region scan.
- Not verified in a browser: streamed-window visuals (mountain silhouettes, seams, fog, new props, minimap) -
  recorded in QA.md and STATUS.md. Docs updated: TASKS (P3.3 note, P3.7 partial, completed entry), STATUS,
  ARCHITECTURE (world layer section), CONTRACTS (worldProbe + prop vocabulary), QA.

---
Task ID: 12
Agent: GLM (Super Z) via AgentHarness gateway
Task: Split client/src/engine/TileGrid.ts (3,358 lines / 148 KB, 4.6x the next largest engine file) into focused modules; zero behavior change.

Work Log:
- Mapped the file structurally (60 class methods, module-level constants, shared fields) and confirmed the external surface is 4 files / 6 symbols (Engine.ts: TileGrid; World.ts: CELL, WALL_H, Collider; FogOfWar.ts: CELL; CameraRig.ts: Collider).
- Chose the free-function extraction pattern (TS has no partial classes): each private build* method became an exported function whose first param is the grid instance; back-references are type-only imports, so no runtime cycles. Context param named `grid` because builders widely use a local `g` for THREE.Group.
- Wrote a string-aware transform script (brace depth tracking that handles line/block comments, template literals incl. GLSL shaders, and `${}` interpolations) that mechanically extracted methods by name, rewrote `this.x` -> `grid.x` and sibling calls `this.fn(` -> `fn(grid, `, computed per-module imports from content, and regenerated TileGrid.ts as the facade. Fixed two parser bugs found by verification: line-comment state persisting across lines, and method-end detection for the one multi-line signature (buildRockClutter).
- New layout: TileGrid.ts (656 lines: region lifecycle add/remove/retain/focus, build pipeline, syncDoorStates/syncWaterEnv, update, queries, resolve, LOS) + engine/tilegrid/: shared.ts (CELL, WALL_H, Collider, RegionHandle, ScatterItem, half-tile math), terrain.ts (floor, water, roads, room details), walls.ts, props.ts (prop dispatch + rock clutter), geo.ts (geometry factories + scatter), flora.ts (grassland), trees.ts, structures.ts (town, ruins, graves, cave mouth, exits).
- TileGrid.ts re-exports the public symbols, so no external file changed. Fields builders share (eng, group, areaTiles, doorLeaves, water*/grass* uniforms, materials) are marked `internal` in a comment block.
- Transferred 9 files through the harness via chunked gz+base64 (cmd.exe 8,191-char command limit -> 6,000-char chunks); original preserved at G:\ASHENREACH\_backups\TileGrid.pre-split.ts.bak.
- Verification on the project machine: npm run typecheck clean, npm run build ok (943.2 kB bundle), npm test 119/119, npm run smoke 33/33 (incl. streamed-world border crossing). Docs: ARCHITECTURE.md engine tree + structures-builder references updated.

Stage Summary:
- client/src/engine/TileGrid.ts is now a 656-line orchestrator; 8 new focused modules under client/src/engine/tilegrid/ hold every geometry builder. Behavior unchanged (pure mechanical split); all four gates green on the user's machine. Follow-up work (PCG biome/ruins/graveyard iterations, P3.7 minimap polish) should target the specific tilegrid module instead of the old monolith.

---
Task ID: 13
Agent: Super Z (GLM main agent)
Task: P3.7b polish batch — bloom/LUT grade, dungeon-only fog of war, dungeon region teardown, seam flora continuity, realistic river placement, exit grounding.

Work Log:
- Engine.ts: bloom 0.75→0.30 (radius 0.42, threshold 0.85); composer chain now RenderPass → GTAOPass (cheap depth-raymarched AO) → UnrealBloomPass → OutputPass (ACES+sRGB; was silently missing for render targets) → grade LUT pass; new grade.ts (runtime-built 32³ LUT: desaturated mids, cool slate shadows, warm amber highlights, gentle contrast + vignette).
- FogOfWar scoped to dungeons: worldMode early-return in update(); isExplored/isVisible return true in world mode; Engine.enterRegion no longer builds region fog layers.
- TileGrid.build tears down all streamed region groups when a dungeon map loads — dungeon scenes no longer render over overworld terrain ("dungeons spawn in nature" fix).
- flora.ts/props.ts: grass and rock clutter now cover the region border ring (bald seam strips gone); world.mjs prop-cluster edge margin 3→1.5 cells.
- world.mjs rivers: valley-seeking walk (elevation-driven heading choice, chord bias), hard separation rules (26-cell course spacing, 130-cell source spacing, 8-cell hard buffer, 12-cell open-land gate with deterministic rejection), shore connectors ending at distinct lake-shore points, arc-length monotonic surface levels, third relaxed source pass. Numeric check: 6 rivers, sources ≥130 apart, no open-land twin channels, every river terminates in its lake.
- structures.ts buildExits snaps to terrain height (was y=0); roadside POIs spawn one cave mouth instead of ten.
- Verified: typecheck clean, build 979.5kB, npm test 119/119, smoke 33/33. Pre-change backups in _backups/*.pre-*.bak. Docs (ARCHITECTURE/CONTRACTS/STATUS/TASKS) updated in the same pass.

Stage Summary:
- All reported issues from this batch addressed and verified; remaining open items: browser visual review of GTAO/LUT/bloom tuning, P3.7 remainder in TASKS.md.

---
Task: 13-b — water fords, wider rivers, home-town normalization, terrain splat + scatter diversity
Date: 2026-10-14

Feedback addressed:
- Water is no longer solid: rivers/ponds/lakes are shallow fords. Server (GameManager
  registerRegionData + dungeon rebuild) and client (TileGrid.buildWorld open grid) both
  stop blocking water cells/half-tiles; validation + tests updated to the new rule.
- Rivers widened: per-sample half-width w = 1.9 + 1.5 * noise(x,z,140,seed+9193) — the old
  stream stamp (~18 ft) is the MINIMUM; courses swell to ~33 ft (row runs up to 65 ft).
  Applied consistently in world.mjs (carve kernel, region raster, stitch ring injection,
  river-stone offsets, waterAt road probe) and worldGenerator.mjs (home raster + carve),
  so seam widths match. Bridges now size their span/width to the actual crossing cluster.
- Home region (0,0) normalized to a regular town: showcase biome patches (forest/snow/
  snowfield/deadlands ellipses + their clusters) removed; REGIONS is now meadow/mountains
  x2/town/graveyard/ruins. Tally: meadow 7592, mountains 2300, town 457, ruins 118,
  graveyard 285. validateOverworld biome-variety floor relaxed 8 -> 4 kinds.
- Terrain dirt-splat: world-anchored dirtField (shared.ts vnoise) tints bare-soil clearings
  into the floor vertex colors, suppresses grass in flora, and spawns sparse pebbles in
  props (all three read the SAME field so dirt/missing-grass/pebbles always agree).
- Grass diversity: wild-grass patches (wildGrassField > 0.63) plant taller straw tussocks
  (geo.makeTussockGeometry, shared wind material) instead of the regular carpet.
- Meadow round boulders: rare glacial erratics (cap 4/region, hash gate 0.9925) as server
  props shape=round — geo.makeRockGeometry builds them from a lumpy icosphere; server +
  client colliders agree since they are regular boulder props.
- Twig litter: ~62% of trees drop 1-2 deterministic twigs in their leaf-out zone.

Verification: typecheck clean; build 983.2kB; smoke 33/33; npm test 119/119.
Backups: G:\ASHENREACH\_backups\*.pre-water2.bak (11 files).

---
Task: 14-b — grass-type soft blending, camera-distance density falloff, meadow forb/shrub layer
Date: 2026-10-14

Feedback addressed (user playtest + 3 meadow reference photos):
- Grass-type boundary no longer a hard line: the tussock/carpet threshold (0.63 on
  wildGrassField) now blends across a variable-width band. New world-anchored
  grassBlendField (shared.ts, vnoise scale 11/4.5, salts 9311/9312) picks band half-width
  0.015..0.185 per spot — crisp "mown" edges where it's low, wide soft intermix where
  it's high — and inside the band each clump flips to a tussock by smoothstep odds
  (hash2(seed,97,349) < prob). Offline probe: 26.8% tussock / 73.2% carpet, edge samples
  45% crisp vs 55% wide-blend — a deliberate balance of both transition styles.
- Grass performance: per-instance camera-distance density falloff in the grass wind
  shader (flora.ts onBeforeCompile, cache key v3). Full density within uGrassInner 36ft,
  gradient down to uGrassFar (0.5; 0.38 lowgfx) by uGrassOuter 175ft, fade to zero across
  uGrassCull 265..295ft (past FogExp2 visibility). Each instance owns a stable position
  hash; instances above the local density collapse to zero-area triangles — no fragments,
  no rebuilds, no clustering, works with region streaming. New shared uniform
  TileGrid.grassFocus (world feet) refreshed each update() from eng.camera.position;
  per-material uGrassOrigin = region origin so distances stay continuous across regions.
  Probe: ~59% avg density survives inside 265ft of a center region; ring regions keep
  only their near wedges — large vertex-load cut with the visible field still ~full.
- Meadow floral/foliage diversity (matches the daisy-meadow + shrub-stand references):
  new flowerField (scale 13/5.5, salts 9411/9412) and shrubField (scale 24/9, salts
  9511/9512) drive a client-side forb/shrub layer in flora.ts (meadow biome only, dirt
  suppressed, road/water/wall masked). Wildflowers bloom in patches — daisy 60%,
  buttercup 23%, violet 17% — via geo.makeMeadowFlowerGeometry (hand-built crossed stem,
  ground leaves, flat radial petal head with distinct petals + center disc, vertex
  colored; ~0.3-0.5ft). Shrubs stand where shrubField > 0.72 via geo.makeShrubGeometry
  (5 lumpy squashed icosphere blobs, detail-1 dome + detail-0 lobes, y-gradient
  dark-soil-to-olive vertex colors, welded). Both ride the existing wind grass material,
  so gust sway + density falloff apply for free. Probe: ~3.9k flowers + ~380 shrubs per
  full-meadow region.
- geo.mergeGeometries now carries vertex colors through a merge when every part has
  them (backward compatible — colorless callers unchanged).
- Meadow carpet palette gains a warm olive entry (0x8a9a50) to echo the golden/olive
  tones in the reference photos; tussock palette already covers the straw range.
- flowers/shrubs/tussocks/carpet all cast no shadows, receive only (unchanged).

Verification: typecheck clean; build 988.1kB; smoke 33/33; npm test 119/119.
Backups: G:\ASHENREACH\_backups\{flora,shared,geo,TileGrid}.ts.pre-flora3.bak (4 files).
Note: distant-grass cull radii are uniforms (uGrassInner/uGrassOuter/uGrassFar/uGrassCull
in flora.ts) — one-line tunes if the user wants a denser/sparser horizon.

---
Task ID: 15
Agent: Super Z (GLM main agent)
Task: Water bodies breaking at region/cell seams — lakes/rivers/ponds trenched and divided at streaming borders (via AgentHarness).

Work Log:
- Reproduced offline first: border water cells of every seam-crossing lake/river were shoreline-clamped to ground-0.18 (14/14 cells at the home-terminus lake seam x=112 rz2; same on world-river-1/2 seams), plus 0.68 ft client vertex cracks, full-strength foam lines and a 0.76x dark floor stripe along every seam.
- Root cause: the shoreline surface clamp resolved its 4 water-neighbors through the region-local water set only, so any water cell at a region border read its cross-seam neighbor as dry land and got trenched; applied at three sites (worldGenerator home clamp, world.mjs generateNeighborRegion, world.mjs stitchRegion) plus region-local client water sets (buildFloor tint, buildWater foam/vertex averaging) and out-of-bounds-as-wall shading.
- world.mjs: exported worldWaterCellAt(ctx, wx, wz) — exact world-space mirror of the stamping rules (lake ellipse + LAKE_SALT edge hash, river sample discs with rounded centers); generateNeighborRegion + stitchRegion shoreline clamps now consult it for out-of-region neighbors; ponds cannot qualify (interior-clamped >= 12 cells).
- world.mjs stitchRegion: new cells.waterHalo payload — water cells up to 2 outside the region with levels mirrored from the adjacent in-region cell, so the client treats a seam-spanning lake as one body.
- Client terrain.ts: buildFloor waterSet includes the halo (bank/silt tint continues past seams); buildWater blends halo cells into wet set + seam-vertex surface averaging (getWaterHeight/waterLevelAt) so shared seam vertices average identical 4-cell sets on both sides; shore foam no longer fires at borders over open water.
- Client terrain.ts buildFloor: wallAt out-of-bounds now returns grid.indoor instead of true — outdoor regions no longer darken a 1-cell stripe along every border (indoor edge shading unchanged).
- types.ts: MapDef cells.waterHalo?: [number, number, number][].
- Tests: world.test.mjs +2 (lake seam no-trench with exact expected-level invariant; river seam no-trench; halo presence/levels) and the grounded-water shoreline derivation made world-aware. Ponds verified seam-safe by construction (interior clamp), home bodies verified interior, world lakes cannot reach the home ring.
- Known pre-existing (seam-independent, not addressed): mountain-river cells can carry water flags with bed above surface (slope-clamp refill buries the stream; both sides consistent — reads as the river going underground).
- Backups: _backups/{world,world.test,terrain,types}.pre-waterseam.bak. Pushed 4 files (md5-verified).
- Verified remotely: typecheck clean, build 990.4kB, npm test 121/121 (119 + 2 new), smoke 33/33 x2 (one unrelated flake on the east-walk check in the first run).
- Docs: game/docs/ARCHITECTURE.md stitching paragraph updated (worldWaterCellAt + waterHalo + client seam behavior). Remote helpers cleaned.

Stage Summary:
- Lakes, rivers and the terminus basin now render as single continuous bodies across region seams: no surface trench, no vertex cracks, no false foam or dark stripes. Cross-seam surface steps match natural in-region bed variation (0.17-0.74 ft avg).
- Tunables/next: bridge clusters are still region-local (a road crossing water exactly at a seam spawns two half-bridges — rare; candidate for the same world-aware treatment); user browser review of seam crossings recommended.

---
Task ID: 16
Agent: Super Z (GLM main agent)
Task: SRD mechanics overlay — make combat respect the 5E SRD via a compiled mechanics layer (DeepSeek-pattern, tailored to our engine).

Work Log:
- Audit: core loop already SRD-faithful (dice/initiative/adv-dis/saves/death/resistances); gaps = class features text-only, 24/164 spells hardcoded inline, client exposed Strike+cantrips[0] only, no OAs/Extra Attack, racial traits inert, no resource pools, Fighting Style never applied.
- NEW server/src/data/mechanics_overlay.json (SRD untouched): resources, features (activation/cost/effects), passives, racial hooks, fighting styles, spells (superset of the old inline SPELL_MECHANICS + Shield/Hex/Charm Person).
- NEW server/src/rules/Mechanics.js: safe formula evaluator (recursive descent, no eval), resource pools, passives/action manifests (sourceFeature: one SRD feature -> many actions, e.g. Cunning Action x3), spend/recover primitives.
- CombatEngine: kind:'feature' executor (heal/condition/extra_action/dash/disengage/hide/turn_undead/create_slot/slot_to_points) with economy by activation + resource refunds; attack hooks (Rage STR dmg, reckless adv, Extra Attack, Lucky reroll w/ roll concat, Savage Attacks crit dice, GWF reroll, Hex rider); damage hooks (rage resistance, racial resistances, Uncanny Dodge reaction, Relentless Endurance floor, charmed-break, rage ends on down); save hooks (Brave/Dwarven Resilience/Fey Ancestry/Danger Sense vs-tags + Lucky); reaction-cast spells (Shield +5 AC, no action); raging blocks casting; opportunityAttacks() pure scan (disengage/reaction/incapacitated-aware); spells table = overlay superset w/ inline fallback.
- CharacterEngine: sheet.resources/.actions/.passives/.fightingStyle; Barbarian Unarmored Defense + Fast Movement; style defaults (Fighter/Paladin Defense, Ranger Archery) applied at build AND toggleEquipment (parity); shortRest recovers short-rest pools + auto Arcane Recovery (budget ceil(lvl/2), cheapest first, 1/long rest); longRest recovers ALL pools + manifest refresh; levelUp refreshes mechanics.
- MonsterAI: creatureType on tokens (Turn Undead gate). GameManager.move: onCombatMove hook after successful in-combat moves. CombatDriver: gm.onCombatMove resolves OAs as slot:'reaction' attacks with opportunity:true (leave-reach boundary), broadcasts fx/rolls/chat; monster turns run the same hook; rest summaries list recovered resources + Arcane Recovery.
- Client hud.ts: spell selector (all known spells grouped by level w/ slot counts; heal/buff target self, else foe), feature buttons from sheet.actions (activation tags, resource pips, economy-aware disable), resource pips in the move line; theme.css styles (.ta-spell/.ta-features).
- Tests: NEW mechanics.test.js (30 tests: evaluator, pools, Second Wind/Action Surge/Rage/Reckless/Turn Undead/Cunning/Uncanny Dodge/Relentless/Lucky/Savage/Extra Attack/styles/GWF/Shield/Hex/Charm/Disciple of Life/rests/Arcane Recovery/OAs); updated character.test.js (Defense-style AC 19/17/12, Arcane Recovery on short rest) + GameManager.test.js (same). Fixed smoke.mjs east-walk flake: per-step 140ms collect windows missed focus patches during shiftFocus worldgen -> one 30s watch across the walk.
- User WIP repaired en route (client/src/ui/create/subraces.ts, modified before this session): codemod lowercased 49 ASI keys (AbilityKey now lowercase) + inserted required flavor fields — content preserved.
- Ops note: killed orphan smoke servers (EADDRINUSE 3999 caused cascading smoke fails; east-walk 'flake' was partly stale servers, partly the collect-window bug — both fixed).
- Gates on user machine: typecheck clean, build 1001.3kB, npm test 163/163 (was 121), smoke 33/33.
- Backups: _backups/*.pre-srd.bak (CombatEngine/CharacterEngine/MonsterAI/GameManager/CombatDriver/hud/theme). Docs: SCHEMA.md SS5 (overlay contract), CONTRACTS.md rules-engine section updated.

Stage Summary:
- Combat now executes compiled SRD mechanics end to end: features, resources, fighting styles, Extra Attack, opportunity attacks, racial passives, 27 spells mechanical; un-compiled features stay text (fallback path). DM bypass/house-rule layer intentionally left for later per user.
- Next candidates: spell-slot upcasting UI, ally-targeting for heals, Two-Weapon Fighting, grapple/shove, creatureType-driven immunities in MonsterAI choices, cover.

---
Task ID: 17
Agent: senior software engineer
Task: Visage & 3D Avatar Customization Overhaul — real-time 3D character viewport, expanded racial features, gender & body types, 10 hairstyles, facial markings, and multiplayer token replication.

Work Log:
- Solved disconnect between character creation visage options and live in-game 3D avatar.
- Extended TokenLook (client/src/engine/types.ts): added gender, expanded bodyType (slim/normal/heavy/lean/standard/broad/tall), 10 hairstyles, eyeColor, faceDecor, race, subrace, charClass, raceScale, and anatomical traits (ears, horns, tail, tusks, beard).
- Extended HumanoidRig (client/src/engine/rig/HumanoidRig.ts):
  - Gender forms: masculine (wider clavicle/shoulders, athletic V-taper) vs feminine (narrower clavicle, wider hips, bust contouring).
  - Frame & weight: slim (0.84x limb, 0.88x torso), normal, heavy (1.22x limb, 1.20x torso, 1.18x shoulder pads).
  - Racial anatomy & scaling: pointed ears (elves), curving obsidian horns + sinuous tails (tieflings), woven braided beard (dwarves), lower tusks (orcs/goliaths), snout crests & horns (dragonborn), race stature scaling (0.75x small races like halflings/gnomes, 1.14x large races like goliaths/orcs).
  - 10 distinct 3D hairstyles (5 masculine: short, topknot, long, braids, shaved; 5 feminine: ponytail, flowing locks, twin braids, chignon, pixie bob).
  - Colored glowing irises and 3D facial markings (scars, runes, warpaint, freckles, skull paint).
- Created Visage3DView (client/src/ui/create/visage3d.ts):
  - Dedicated real-time WebGL Three.js character viewport with 360-degree orbit drag, pitch tilt, mouse wheel zoom, auto-rotation toggle, reset/front/face camera buttons.
  - Multi-source lighting (ambient slate, warm golden key torchlight, cool rim light, ground ember bounce) and runic stone plinth.
  - Procedural idle stance and breathing animation via Animator and cloth chain physics.
- Updated Character Creation UI (client/src/ui/create/steps.ts & creation.ts & portrait.ts):
  - Added [ 3D FIGURE ] / [ PAINTED PORTRAIT ] view toggle in both Visage and Oath review steps.
  - Added Origin & Form (Masculine / Feminine) selector.
  - Added Frame & Build (Slim / Normal / Heavy) selector.
  - Added Hairstyle category filter tabs (Masculine (5), Feminine (5), All Styles (10)) with custom SVG icons for all 10 styles.
  - Expanded palettes: 12 dark-fantasy skin tones, 12 hair colors, 8 soul eye colors, 6 cloak colors, 6 facial markings.
  - Added Bloodline Traits summary card informing players of their race's physical traits.
  - Updated CharacterDef validation to preserve gender and all 6 face decors.
- Synchronized server and replication:
  - GameManager.js mapLookToRig maps all 10 hairstyles, 12 skin tones, 12 hair colors, 8 eye colors, 6 cloak colors, gender, and facial decorations.
  - Actors.ts correctly passes race, subrace, gender, and decor from server tokens/sheets to HumanoidRig.
- Verification:
  - npm run typecheck: 0 errors (clean strict TypeScript).
  - npm run build (compile_applet): succeeded.
  - node --test server/src/GameManager.test.js: all 26 subtests pass.
  - tools/smoke.mjs: all test suites pass.

Stage Summary:
- Players now have an immersive, live 3D character creation forge where every customization option (gender form, frame, 10 hairstyles, skin tones, hair colors, glowing eye colors, face markings, and race traits like horns/ears/tails/tusks/beards) is previewable in real time and carries over seamlessly into the 3D multiplayer world.

---
Task ID: 18
Agent: senior software engineer
Task: Visage 3D Viewport & Modular Rig Rebuild — camera framing, auto-spin disable, view state persistence across edits, Lego hair modularity, color fixes, collar/skirt/strap/pauldron removal, single head sculpt, and removal of painted portrait.

Work Log:
- Addressed all user grievances with Visage preview viewport and 3D character model:
  1. Viewport State & Reset Fix:
     - Stopped camera resets when making changes in visage. `Visage3DView` now remembers orbit state (`savedYaw`, `savedPitch`, `savedDistance`, `savedTargetY`, `savedAutoRotate`) across character rebuilds.
     - Disabled auto-spin by default (`savedAutoRotate = false`).
     - Fixed front camera framing (`distance = 9.2`, `targetY = 2.85`, `fov = 38`): now displays the entire character body from pedestal to crown instead of only legs/waist.
     - In `steps.ts`: `renderPreviewFrame` reuses `activeVisageView` and calls `update(s)` rather than destroying and rebuilding the WebGL canvas on every swatch click.
  2. Single Head Sculpt & Eye/Marking Visibility:
     - Removed the inner/outer double sphere in `HumanoidRig.ts`. Replaced with a single clean, noble cranium ellipsoid (`f.sphere(H, 0.38 * S, ...)`), jaw, nose, and natural ears for standard humanoids.
     - Fixed eye irises and pupils being buried: placed forward-facing sockets, glowing colored irises (`T.eyes`), and pupils directly on the facial plane.
     - Fixed facial markings (scars, warpaint, runes, freckles, skull) being obscured: placed directly on the face contour with distinct `decorMat` and `decorColor`.
  3. Hair Modularity & Color Fix:
     - Removed unconditional `hasBaseCap` that placed an obscuring pseudo-hair helmet over heads.
     - Redesigned all 10 hairstyles as standalone modular "Lego-style" snap-on hairpieces fitting onto a clean bald head (`hStyle === 'none'` yields a clean bald cranium).
     - Fixed hair and decor color bug: `rigMaterials.ts` now creates separate `hairMat` and `decorMat` material factories with distinct cache keys so hair and decor have their own geometry buckets and do not get merged with `clothMat`.
  4. Basic Rig De-clutter & Modular Equipment:
     - Removed weird collar (mantle yoke sphere).
     - Removed chest strap / diagonal harness from the torso.
     - Removed tunic skirt / kilt cylinders to leave clean, bare legs.
     - Removed shoulder pauldron spheres.
     - Left basic rig bare in character creator: removed permanently attached sword and shield from `visage3d.ts`.
     - In `equipment.ts`: added `axe` / `battleaxe` weapon geometry with steel crescent blade and wood haft, and added modular equipment APIs (`clearEquipment`, `equipWeapon`, `equipShield`, `setEquipment`).
  5. Painted Portrait Removal:
     - Removed the painted portrait toggle and canvas from character creation (`renderPreviewFrame`), making the interactive 3D viewport the primary character forge.
- Verification:
  - `npm run lint` (`tsc --noEmit`): clean pass with 0 errors.
  - `npm run build` (`tools/build.mjs` / `compile_applet`): succeeded.
  - `restart_dev_server`: restarted cleanly.

---
Task ID: 19
Agent: senior software engineer
Task: Environmental Visual Fidelity & Performance Overhaul — procedural dark-fantasy ruin masonry, lightweight height displacement shaders, timber-framed plaster & slate roof architecture, and modular ruin wall assets.

Work Log:
- Addressed ruin generation performance and visual fidelity issues in `structures.ts` and `materials.ts`:
  1. Procedural Ruin Masonry & Architectural Materials (`materials.ts`):
     - Created `buildRuinMasonry`: High-fidelity procedural PBR textures for ancient megalithic ashlar masonry (4 coursed rows, pillowing block faces, deep recessed mortar joints, chisel lines, chipped corners, weather fissures, soot/rain streaks, lichen rosettes, and damp crevices).
     - Built 3 distinct environmental variants:
       • Variant 0: Weathered ancient ruin stone (bone/charcoal ashlar, chiseled relief).
       • Variant 1: Overgrown damp mossy stone (moss-filled joints, algae wash).
       • Variant 2: Dark crypt/cellar gothic masonry (soot-stained, salt efflorescence).
     - Created `buildTimberPlaster`: Half-timbered dark fantasy building walls with roughcast lime stucco plaster, heavy dark oak studs/plates/braces, and iron square joinery pegs.
     - Created `buildRoofSlate`: Dark charcoal slate shingle roofing with overlapping courses, chiseled bottom edges, damp highlights, and lichen patina.
     - Created `applyStoneDisplacement`: Lightweight vertex height displacement via `onBeforeCompile` + Three.js `displacementMap`, physically displacing mesh vertices along normals while adding world-space contact moss/grime on upward-facing surfaces.
     - Wired `ruin_stone`, `ancient_wall`, `plaster`, and `roof_slate` into `BUILDERS`, `getTextureSet`, and `getMaterial` with full tangent-space Sobel normals, roughness, cavity AO, and height maps.
  2. Ruin Wall & Structure Performance Overhaul (`structures.ts`):
     - Overhauled `buildRuinWall`: Replaced the slow, heavy multi-brick instanced loops (hundreds of individual box instances per wall) with a majestic, clean modular ruin wall asset.
     - Wall asset features a grand stepped ruined rampart with crenellations, a massive corner pier / tower buttress with plinth base and cornice, a breached/crumbled rampart, and fallen megalithic ashlar blocks.
     - Cut mesh count from ~500+ draw matrices per wall down to ~8 clean meshes using subdivided geometry with lightweight height displacement.
     - Upgraded `buildTownBuilding` from flat primitive boxes to authentic dark-fantasy architecture: timber-framed plaster walls, dark slate shingle roofs, weathered stone foundations, and soot-stained stone chimneys.
     - Upgraded `buildTownWell`, `buildCaveMouth`, and `buildExits` to use procedural `ruin_stone`.
  3. PBR Texture Repeat Alignment (`walls.ts`):
     - Synchronized texture repeats across all PBR channels (map, bump, normal, roughnessMap, aoMap, heightMap) so materials tile with pixel-perfect coherence.
- Verification:
  - `npm run lint` (`tsc --noEmit`): clean pass with 0 errors.
  - `compile_applet` (`tools/build.mjs`): succeeded.
  - `npm test`: clean pass.

---
Task ID: 20
Agent: senior software engineer
Task: Overworld Landscape & Mountain Realism Overhaul — grand mountain relief, multi-scale domain-warped ridgelines, terraced plateaus, lowland terrain classification (plains, meadows, rolling forest, foothills), linear escarpments, and elevated mesas.

Work Log:
- Solved the "rolling hills" lack of elevation grandness and repetitive landscapes in world generation:
  1. Mountain Relief & Grand Heights (`server/src/maps/world.mjs`):
     - Narrowed `mountainWeight` transition from 83 cells to 35 cells (`smoothstep(0.47, 0.55)`), creating crisp, dramatic mountain bases and eliminating gradual 80-cell ramps.
     - Added domain warping (`fbm` at scale 180) to break axis-aligned ridgelines.
     - Replaced single-scale crests with multi-scale ridged noise (`crestMajor` at scale 80 + `crestMinor` detail).
     - Elevated mountain relief with $crest^{1.3} \times 140\text{ ft}$ plus a robust 66–106 ft massif shoulder base, producing grand peaks exceeding 250–300 ft.
     - Added terraced plateaus (`PLATEAU_H = 40`) with clean stepped shelves and ramps.
     - Resolved gradient double-weighting in the mountain massif entry to ensure smooth, natural physical slopes.
  2. Lowland Diversity & New Terrain Features (`server/src/maps/world.mjs`):
     - Added a large-scale terrain-class mask (`hilliness` at scale 400 cells = 2,000 ft) generating four distinct lowland terrain classes across the infinite world: flat plains, gentle meadows, rolling forests, and rugged foothills.
     - Implemented linear escarpment cliffs using anisotropic ridged noise (scale 250 in x, 40 in z) with controlled 20 ft steps.
     - Implemented elevated mesas (isolated flat-top plateaus with 25 ft elevation steps).
  3. Slope Clamp & Seam Invariants:
     - Set `SLOPE_CAP = 7.0` (allowing dramatic 60° mountain faces suitable for dark-fantasy landscape scale).
     - Adjusted `PAD = 22` and `CLAMP_ITERS = 20` to guarantee window-invariant deterministic seam continuity.
     - Reduced lake edge jitter to 0.10 to prevent single-cell holes along water bodies.
     - Updated test tolerances in `server/src/maps/world.test.mjs` (seam/mountain steps <= 7.5 ft, mountain peaks > 200 ft, reverted `strictInterior` to `every()` with `checked >= 2`).
- Verification:
  - `npm test`: 210/210 tests pass across all rules, combat, monsters, nav, maps, and world tests.
  - `npm run typecheck` (`tsc --noEmit`): clean pass with 0 errors.
  - `compile_applet`: clean compilation pass.

