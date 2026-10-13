# ASHENREACH Worklog

## Milestone: Weeping willow canopy redesign, dead tree limb connectivity fix, hill rock normal alignment, and sunken trees on slopes

- **Weeping Willow Canopy Redesign**: Replaced the awkward vertical cylindrical drapes with a lush, authentic weeping willow canopy:
  - 5 wide arching limbs sweeping outwards in an umbrella fountain structure with secondary downward switch boughs.
  - 3 overarching crown umbrella domes forming the expansive canopy top.
  - 15 cascading organic foliage masses (soft dodecahedron clusters stretched vertically in 3 descending tiers per limb) draping down towards the water and ground in painterly willow sage and moss green tones.
- **Dead Tree Limb Connectivity Fix**:
  - Eliminated disconnected / floating branches on dead snags: transformed local limb origin and direction vectors by the trunk's actual orientation quaternion (`trunkQuat = dummy.quaternion.clone()`) and base position.
  - Added 4 splinter fork stubs emerging directly from the fractured dead boughs, ensuring every branch is physically and mathematically embedded in the wood core regardless of trunk tilt or lean.
- **Slope Anchoring & Anti-Floating Trees**:
  - Sunk all trees 0.85 * scale into the terrain, and extended the trunk cylinder base downward (`trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0)`) so the flared base reaches over 2 units underground.
  - Prevents trees on hills, ridges, and slopes from ever having their bases hover above ground.
  - Preserved strict vertical growth for trees and grass (`quaternion = (0, 0, 0, 1)`).
- **Rock Hillside Normal Alignment**:
  - Implemented `terrainNormalAt(x, z)` in `TileGrid.ts` to compute exact terrain surface normals on slopes.
  - Oriented all landscape boulders, rocks, scree, and clutter pebbles to align their Up vector `(0, 1, 0)` with the terrain surface normal plus local yaw, embedding them firmly into hillsides so they sit naturally on slopes without jutting out or hovering.
- **PCG Tree Scale Calibration**:
  - Adjusted tree scale range in `server/src/maps/worldGenerator.mjs` to 0.8–3.0 max (down from 4.0), preventing oversized trees while preserving towering grand forest scale.
- **Verification**: `compile_applet` passed, `lint_applet` clean (0 errors), `node --test` generator tests passed (10/10), `npm test` passed (94/94), `npm run smoke` passed (28/28).

## Milestone: River, lake, and pond terrain deformation

- **Feature**: Water bodies deform the terrain heightfield underneath into natural basins and channels.
- **Ponds**: Added forest pond (18, 26, radius 3.0×2.4) and meadow pond (75, 62, radius 2.8×2.4) to `server/src/maps/worldGenerator.mjs` and exposed `metadata.water.ponds`.
- **Terrain deformation**:
  - Lakes and ponds depress terrain beds by 1.0–1.4 ft at center, smoothly rising to 0.35–0.5 ft below water level at the inner waterline, and cradle into surrounding banks with smooth shore blending.
  - River channel carves a 1.25 ft deep bed at centerline, smoothly sloping up to banks and feathering into surrounding terrain without exceeding the 5 ft/cell slope limit across seeds.
  - Water surface calculation sets shoreline water inset below surrounding banks (<= ground - 0.18 ft) while preventing water from floating above ground.
- **Verification**:
  - `node --test server/src/maps/worldGenerator.test.mjs` passes (6 tests, including 22-seed regression and explicit pond/lake terrain deformation assertions).
  - `node server/src/maps/worldGenerator.mjs --seed 73021 --check` passes.
  - `npm run typecheck`, `npm run build`, `npm run smoke` pass.

## Milestone: Riverbed depth subtraction, bridge crossing fix, and prop collision alignment

- **Riverbed depth subtraction**: River waypoint levels descend strictly monotonically from headwaters to outlet; river samples carve a 1.8–2.0 ft channel directly into the terrain heightmap so the ground is strictly below the river water plane across hillsides.
- **Wide walkable bridges**: Road crossings over rivers now create an expanded 3×3 crossing corridor cleared of water cells and water half-tiles, leveling roadway terrain to bank height; bridge visual mesh upgraded to a wide 8.5×10 ft wooden plank deck with sturdy side stringers and handrails.
- **Aligned collision & smooth sliding**: Adjusted tree trunk and boulder collider radii across server (`GameManager.js`) and client (`TileGrid.ts`) to match visual geometry instead of oversized bounding boxes, and improved movement resolution in `Controls.ts` to allow fluid axis-sliding along obstacles without freezing.
- **Verification**: All 6 overworld generator tests, 22-seed gradient checks, full smoke integration suite, typecheck, and build pass cleanly.

## Milestone: Sky system overhaul, planar FBM clouds, procedural moon, and dynamic cloud shadows

- **Atmospheric Sky & Continuous 24-Hour Schedule**: Replaced binary day/night state with a 14-keyframe continuous, non-linear atmospheric model (`SKY_KEYFRAMES` + `interpolateSky`). Dawn and golden hour (5:30–7:00, 17:30–19:30) feature rich cadmium orange, salmon, peach, coral, and plum-magenta gradients, with Rayleigh/Mie horizon belts and solar corona glow.
- **Realistic Celestial Bodies**:
  - Procedural 256×256 Moon (`moonTexture`): High-resolution cratered lunar disc with basalt maria (Oceanus Procellarum, Mare Imbrium), impact ejecta rays (Tycho), and celestial halo glow at 62-unit scale; tracks opposite the sun in the celestial arc.
  - Procedural 256×256 Sun (`sunSprite`): Incandescent solar core with multi-stop radial coronal flare at 55-unit scale.
- **Planar Troposphere FBM Cloud Canopy**:
  - Replaced spherical noise sphere with perspective-correct planar troposphere projection and 4-octave domain-warped FBM noise.
  - Realistic cloud lighting: Modeled self-shadowing (dark undersides, bright illuminated tops), Mie forward scattering (silver lining on sunlit edges), fiery alpenglow during golden hour, and realistic nocturnal shading (dark slate-charcoal bellies with cool silver moonlit highlights instead of spinning white noise).
  - Crepuscular god rays radiate from the sun position across the sky dome and break through openings in the cloud deck.
- **Dynamic Terrain-Conforming Cloud Shadows**:
  - Added terrain-conforming cloud shadow overlay mesh synchronized with wind drift vector and weather cloud coverage.
  - Drifting cloud shadows darken ground terrain naturally; directional sunlight dims smoothly when clouds pass overhead.
- **Volumetric Light Shafts**: Sun and moon god rays transition smoothly between solar and lunar illumination with weather-adaptive intensity.
- **Verification**:
  - `npm run typecheck`, `npm run build`, `npm test` (93/93 tests passing), `node --test server/src/maps/worldGenerator.test.mjs` (8/8 tests passing), `npm run smoke` (all smoke checks passing), and `compile_applet` passed cleanly.
