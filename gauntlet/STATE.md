# LOFT Prototype 1 — Gauntlet State

Current build: Official v1 assessment / Integration 035
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: Live Club Atelier V1 complete; iron/wedge heel attachment selected next
Iteration: integration_035

Canonical continuation: `../GAUNTLET_STATE.md`. Updated 2026-09-07.

## Integration 035 verdict

The actual held club is now the Workshop hero: shared buffers/materials for all 40
objects, four inspection views, direct rotation/zoom and one borrowed WebGL context.
Exclusive ownership prevents nested Club/Ball restoration; selection releases only
instance-owned groove matrices. Portrait and short-landscape controls remain usable.

- Visual 37, Terrain 14, Ball 6, Assembly 1 and Atelier 5 gates: 63/63 PASS.
- Complete held geometry/material/profile and seven-pose fingerprints unchanged.
- Live desktop/portrait/landscape inspection and Club/Ball/Club/course return checked.
- Root homepage now opens current v1, not P0.7. Entire accumulated Gauntlet checkpoint
  is being published to LOFT main at the user's explicit request.
- Existing center-face iron/wedge shaft attachment is now exposed, not accepted as
  production craft. That shared neck is the ONE next target; no repair is included yet.
- Full manual three-hole round and physical-device performance were not repeated.

Evidence and exact continuation: `history/integration_035.md` and `../GAUNTLET_STATE.md`.

The Integration 034 and older sections below are retained historical verdicts.

## Integration 034 verdict

The real playable ball now has a Workshop inspection surface, shared physical geometry
and material, analytic dimple normals, one circular object-space signature and lazy
hero detail. Rotate/zoom/reset controls, modal focus and responsive layouts were checked
in the live game. One existing WebGL canvas/context moves to the inspector and returns
to the unchanged playable course; static inspection stops drawing.

- Actual retained LODs: 46,080 / 3,380 / 1,620 triangles; hero packed buffers <2 MB.
- Every hero dimple has >=37 unique depressed samples and >=95% specified depth.
- All 338 dimples are represented even in the distant mesh.
- Visual 37/37, Terrain 14/14, Ball 6/6 checks pass.
- Desktop, portrait and short-landscape inspection reviewed; landscape controls stay
  visible with independent specification scrolling. Return, focus, map and live ledger
  checked after inspection. Browser warning/error logs clean.
- No new dependency/context, no physics/stat changes and no unrelated project edits.
- Physical-device performance and another complete manual three-hole round were not
  tested in this pass. The world and golfer remain visibly below the reference boards.

Detailed critique, rejected candidates and evidence: `history/integration_034.md`.

### One next target

Live Club Atelier V1: replace the hero SVG with the actual held club assembly, preserving
preview/Equip, all eight choices, five physical grades, protected transforms and numbers.
Use the existing single-renderer lifecycle and prove Foundation/Icon iron differences
on the actual object first. Normal playable URL remains
`http://127.0.0.1:43117/prototype1/` (`game.js?v=034-final`).

## Integration 033 verdict

One shared live/final Round Chronicle replaces end-only summary cards. Completed holes
alone contribute to totals and Rowan match state. Ready-phase entry, inert background,
focus trap/return, responsive ledger and final replay are implemented and verified.

Adversarial replay review also reproduced a real cross-hole camera interpolation defect.
A reset-requested >32 m discontinuity now rebases once; local resets retain damping.
Three world cuts pass first-frame facing/sightline/clearance gates and fresh final replay
returns upright without needing Reset. See `history/integration_033.md`.

## Integration 032 verdict

Integration 032 makes required landing/cup distance the primary spatial fact and labels
club capacity separately, without taking ownership of any gameplay or input state.

### Built

- pure `LOFT_TARGET_STEWARD_V1` copy and responsive placement contract
- `LANDING`, `TO CUP` and `PUTT PACE` semantics linked to the actual projected target
- physical elevation/surface copy sourced from the protected playable terrain
- quiet ink-to-transparent field instrument with one restrained orange signal
- obstruction, frustum, front-camera, viewport and truthful leader-side handling
- explicit club `CARRY` versus putter `RANGE` language
- cached semantic/layout updates and pointer-transparent per-frame projection
- deterministic responsive, isolation and lifecycle gates

### Protected

- every canvas, map, Workshop, camera, swing and keyboard input path
- all target, club, physics, cup, scoring and round values
- exact terrain/contact, turf/light, world and atmosphere contracts
- no dependency, service, listener or unrelated repository added

### Verification

- Visual Gauntlet: 33 / 33 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- Default full-shot and real eight-foot putting views inspected live.
- Map and Workshop hiding inspected live.
- Real drag swing, flight, landing, 83-yard receipt and Next Shot completed.
- Refreshed `LANDING 83 YD / ↑ 8 FT · GREEN` and wedge `CARRY 90 YD` verified.
- Live warning/error log empty.

### Honest result

The current shot no longer competes with an unlabeled equipment number. The steward is
still an efficient DOM field instrument, so it hides when placement would be dishonest
rather than pretending to understand 3D occlusion.

### Next target

Round Chronicle V1: replace the end-only generic score summary with a calm on-demand
golf ledger for current hole, completed holes, player versus Rowan and round totals.

## Integration 031 verdict

Integration 031 replaces the washed-out upper frame with a camera-readable coastal sky
and four measured sculpted cloud banks while leaving the complete playable world and
terrain/contact contract untouched.

### Built

- `LOFT_COASTAL_AIR_V2` frozen sky, cloud, fog and performance contract
- one shared pure sky sampler whose hierarchy lives inside production camera views
- four deterministic RGBA cloud assets with warm crowns, cool undersides and clean edges
- a restrained course-facing composition with open-ocean negative space
- double-sided single-pass clouds, DOM-free live/test assembly and actual scene traversal
- executable texture, camera-ray, world-preservation and render-budget gates

### Protected

- exact terrain/contact fingerprint and exact Turf & Light V2 specification
- existing key direction/exposure and exact 235–530 fog envelope
- water, ecology, landmarks, camera and all golf / cup / round behavior
- no dependency, service, collision or shadow path added

### Verification

- Visual Gauntlet: 31 / 31 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- Four unique clouds: 24.9–27.4% coverage, 65.6% peak, clean borders.
- Actual atmosphere: 5 passes, 1,688 triangles, 2 MiB raw RGBA.
- All three holes pass settled sky-ray checks at portrait, landscape and desktop sizes.
- Default, course, open-ocean, flight and result views inspected live.
- Real drag swing, landing, receipt and Next Shot completed with an empty runtime log.

### Honest result

Coastal Ridge now has a coherent atmosphere and time-of-day read instead of a placeholder
gray clear field. The bounded four-sheet treatment remains below a future production
volumetric or artist-authored sky pipeline.

### Next target

Target Steward V1: separate required shot distance from club capacity in one quiet,
world-linked instrument, especially for short putting, without touching any input path.

## Integration 030 verdict

Integration 030 replaces stop-and-lunge pose interpolation with one continuous,
ground-up full swing while keeping the real gesture, exact impact and ball launch intact.

### Built

- `LOFT_KINETIC_CHAIN_V1` frozen motion and grounding contract
- non-uniform shape-preserving cubic-Hermite interpolation through seven checkpoints
- continuous skill-signature envelopes and release-quality finish correction
- pelvis-led delivery, retained shoulder lag and post-impact chest crossover
- one trail-shoe pivot around a measured, planted outsole toe
- executable checkpoint, velocity, sequencing, contact and putter-isolation gates

### Protected

- exact address / top / impact / finish club and hand landmarks
- `t = .60` launch timing, club length, IK lengths and grip order
- pointer load / return interaction and the complete putter pendulum
- ball, terrain, cup, scoring, map, camera, result and round systems

### Verification

- Visual Gauntlet: 30 / 30 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- Delivery seam speed: 8.359 / 8.382; impact: 3.764 / 3.771;
  release: 5.513 / 5.515 instead of near-zero / 18–21 unit jumps.
- Trail toe stays on the grounded local plane through a 78 mm finish heel rise.
- Real drag swing, flight, landing, receipt and Next Shot completed live.

### Honest result

The swing now reads as one athletic action instead of a sequence of independently eased
poses. It remains a code-native procedural rig rather than the eventual production
skinned character and bespoke clip library.

### Next target

Coastal Atmosphere & Time-of-Day V2: give the washed-out upper frame a readable sky,
warm directional air and sculpted cloud masses that explain the existing key light,
without touching terrain, lighting direction, camera or gameplay.

## Integration 029 verdict

Integration 029 replaces the assembled horizon-staring face and unstable mitten grip
with one focused LOFT head silhouette and a measured two-hand golf grip around the
unchanged analytic swing.

### Built

- `LOFT_GOLFER_FACE_GRIP_V3` frozen facial, gaze, palm and handle contract
- closed soft-square craniofacial shell with cheek, brow, jaw and chin hierarchy
- integrated cap, curved visor, rear hair, sideburn and tapered neck silhouettes
- restrained almond eyes, angular nose, natural brows and quiet expression
- phase-authored ball focus through address / impact with natural finish release
- fixed 52–64 mm palms at permanent 55 mm lead / trail handle stations
- continuous 215 mm visual grip, finger wraps, glove cuff and buried wrist transitions

### Protected

- every `_poses()`, `_puttPose()` and `_poseAt()` landmark
- limb lengths, IK endpoints, club length, club head and `t = .60` impact
- golf, terrain, cup, putting, scoring, map, camera and round systems

### Verification

- Visual Gauntlet: 29 / 29 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- Head assembly: 17 visible parts / 5,200 triangles.
- Palm envelope: 52–64 mm; handle station separation: exactly 55 mm.
- Live address, top, impact, putting, full shot, landing and Next Shot inspected.
- Live warning/error log empty.

### Honest result

The golfer now reads as one focused, coherent character at gameplay distance and the
grip no longer changes order or scale. The largest remaining character defect is the
stop-and-lunge swing interpolation and contradictory hip / shoulder unwind.

### Next target

Swing Kinetic Chain V1: create tangent-continuous athletic motion and a grounded trail-
foot release while preserving exact protected key poses, impact time, putter motion and
all ball / round behavior.

## Integration 028 verdict

Integration 028 replaces the incorrect playable club primitives with a bounded,
category-specific product construction system that agrees with ball and turf.

### Built

- `LOFT_IN_WORLD_CLUB_CRAFT_V2` coordinate, contact and render-budget contract
- distinct driver, wood, hybrid, iron, wedge and putter constructions
- five geometry-led equipment grades from basic blade / cavity forms to Icon chassis
- real face, sole, grooves, hosel, cavity / chassis, alignment and weighting roles
- one restrained signal part on eligible premium heads
- tangent-plane face clearance and rebuilt head-to-ferrule hosel continuity

### Protected

- exact club length, address-ball / head guides and `t = .60` impact timing
- all carry, launch, ball-speed, spin and roll values
- terrain, ball, cup, putting, scoring, map, camera and round systems

### Verification

- Visual Gauntlet: 28 / 28 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- All 40 club / grade combinations stay within 12 parts / 4,292 triangles.
- Address face clearance: 1.15–6.14 mm beyond ball radius.
- Address / impact sole envelope: -3.87–12.71 mm.
- Foundation / Icon putters compared live at the same two-foot camera.
- Live warning/error log empty.

### Honest result

The held club now has correct low product proportions, recognizable category / grade
silhouettes and enforceable contact integrity. It remains efficient code-native hard
surface geometry rather than the final baked production asset set.

### Next target

Golfer Face & Grip Cohesion V3: unify the foreground head, cap, hair, neck, hands and
two-hand grip read around the protected analytic motion without changing a pose key,
limb length, club landmark or impact time.

## Integration 027 verdict

Integration 027 gives the protected unified field one truthful, authored material and
light response instead of flattening it beneath mismatched baked and real illumination.

### Built

- `LOFT_COASTAL_TURF_LIGHT_V2` shared material / lighting specification
- aligned live and baked key direction with restrained physical grade response
- ordered green, fairway, first-cut, rough and sand roughness hierarchy
- quieter warped mowing, meter-scale turf weave and broad rough variation
- three-texture / one-draw budget gate plus interior surface statistics
- literal 297,361-probe terrain/contact/surface SHA-256 lock

### Protected

- all 99,561 vertices, 197,800 triangles, shared normals and surface identities
- golf, bounce, roll, cup, scoring, map, camera, equipment and round systems

### Verification

- Visual Gauntlet: 27 / 27 PASS.
- Terrain Gauntlet: 14 / 14 PASS.
- Desktop tee / close green and both phone orientations inspected.
- Live warning/error log empty.

### Honest result

The course now separates maintained cuts and reads grade without zebra striping or
extra geometry. It remains an efficient code-native turf treatment rather than a
production scanned-material pipeline.

### Next target

In-World Club Craft V2: bring the actual playable club up toward the Workshop's
industrial-design language, especially the crude close-putting head, while preserving
club physics, swing landmarks, ground clearance and ball contact.

## Integration 026 verdict

Integration 026 replaces generic one-frame-fits-all close putting with an executable,
aspect-aware mobile composition contract.

### Built

- `LOFT_MOBILE_COMPOSITION_V1` portrait and wide-phone framing profiles
- full-body portrait putting lane with the ball / cup held in the right decision field
- compact-map clearance in short landscape
- closer 5.0 m reset envelope and raised putting look axis
- shared ready / swing-lock composition and fixed-step projection validation

### Protected

- full-shot composition and every manual zoom / orbit envelope
- flight, result, terrain, golf, cup, scoring, equipment, map and round systems

### Verification

- Visual Gauntlet: 26 / 26 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- 390 × 844 portrait, 844 × 390 short landscape and 1280 × 720 inspected.
- All real hole headings and a true two-foot putt pass the safe-field gate.
- Live warning/error log empty.

### Honest result

Portrait putting now presents the complete golfer, putter, ball and cup at useful scale
without covering the target with UI. The pass deliberately leaves flight / result
cinematography unchanged.

### Next target

Coastal Turf & Light Readability V2: remove the broad flat-olive read and strengthen
surface / slope comprehension without changing one vertex or contact result.

## Integration 025 verdict

Integration 025 refines the foreground golfer around the protected analytic rig.

### Built

- asymmetric six-section trouser-seat and nine-section tailored polo shells
- larger buried hip / shoulder seals and moving sleeve / trouser cuff construction
- cream leather uppers, stone midsoles and thin dark outsoles as separate layers
- calmer ink / field-stone apparel material hierarchy
- four-phase apparel and footwear transform contract

### Protected

- exact pose keys, IK lengths, grip, club guide, impact timing and ground landmarks
- golf, ball, terrain, cup, scoring, map, equipment and round systems unchanged

### Verification

- Visual Gauntlet: 25 / 25 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- Address, top, impact, finish and close-putting fixtures inspected live.
- Desktop, portrait and short-landscape responsive frames inspected.
- Live warning/error log empty.

### Honest result

The golfer reads as one dressed athletic silhouette rather than radial body pieces.
It remains a code-native character below the final skinned-mesh ceiling, especially at
extreme close distance.

### Next target

Mobile-First Camera Composition V1: close portrait putting clips the golfer and crowds
the top instruments even though settled full-shot scale is healthy. Preserve all orbit,
zoom and gameplay contracts while restoring deliberate phone putting composition.

## Integration 024 verdict

Integration 024 replaces the beige clubhouse box with one grounded, bounded and
recognizable Ridge House destination silhouette.

### Built

- stepped stone, warm structure and nested dark-roof massing
- taller west volume, lower pavilion, chimney and wrap terrace
- 11 instanced windows / entries and 23 instanced timber-frame elements
- exactly one restrained entry signal
- architecture placement, grounding, route-clearance and render-budget validator

### Protected

- complete 18.5 × 14 m footprint stays on rough
- minimum sampled route clearance approximately 15.7 m
- foundation covers 0.74 m sampled ground variation
- entire object tree marked non-playable
- no terrain, golf, physics, camera, map, scoring or round changes

### Verification

- Visual Gauntlet: 24 / 24 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- 7 total draws / 5 shadow draws / 724 instance-weighted triangles.
- Desktop, close orbit, portrait and short-landscape inspected.
- Live warning/error log empty.

### Honest result

At route distance the Ridge House now reads as authored coastal architecture instead
of a generic hut. It remains a deliberately efficient distant landmark rather than an
explorable production building.

### Next target

Golfer Silhouette V3: preserve the trusted analytic motion and refine the foreground
body/apparel construction where pelvis, trouser, shoe and upper-body transitions still
show the code-native rig.

## Integration 023 verdict

Integration 023 replaces the repeated route-edge prop scatter with one deterministic,
grounded and performance-bounded Coastal Ridge ecology system.

### Built

- three tree silhouettes with integrated branch structure and four total tree draws
- heath, gorse and compact-evergreen understory communities
- clustered route-edge fescue with deliberate maintained sightline gaps
- two authored instanced coastal-rock families inside the shoreline envelope
- deterministic placement fingerprint, protected-surface, grounding, draw, shadow
  and triangle validation

### Protected

- all ecology descendants are visual-only and explicitly non-playable
- zero placements enter fairway, first cut, tee, fringe, green or sand
- maximum recorded ground delta is approximately 8.1 mm
- exact terrain/contact, water, ball, cup, scoring, map and round systems unchanged

### Rejected live

- dark-on-dark understory multiplication that read as black ground blobs
- stacked-disc tree crowns without visible lateral branch structure
- retaining the old grass and rock loops beneath a new decorative layer

### Verification

- Visual Gauntlet: 23 / 23 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- 10 total draws / 6 shadow draws / 88,655 instance-weighted triangles.
- Desktop tee, close inland, windward/ocean, 390 × 844 portrait and 844 × 390
  short-landscape frames inspected.
- Live warning/error log empty.
- JavaScript syntax and diff whitespace clean.

### Honest result

Route composition, silhouette diversity and world performance decisively beat the
uniform prototype scatter. The plants remain code-native, but they now behave like
one intentionally composed coastal ecology rather than repeated props.

### Next target

Ridge House Destination V1: replace the small beige clubhouse box with one authored,
bounded coastal clubhouse silhouette and honest material hierarchy, without changing
the protected route, terrain or gameplay physics.

## Integration 022 verdict

Integration 022 turns the Workshop from an equal-card catalog into a genuine
hero-object inspection and equipment decision surface.

### Built

- one dominant dark product stage inside the scorecard-cream Workshop
- selected club story, trusted flight data, material, finish and construction brief
- horizontal eight-object family rail with distinct focused and equipped states
- reversible preview followed by explicit Equip confirmation
- five physically different SVG product constructions for every club family
- one restrained signal component at Signature / Icon, none at Foundation
- keyboard inspection, focus containment, Escape cancellation and touch rail
- purposeful desktop, portrait and short-landscape compositions

### Protected

- trusted carry, launch, speed, spin and roll values are byte-for-byte unchanged
- preview cannot call the live selection path
- Equip delegates to the existing trusted rig / target / line / HUD update path
- golf, terrain, cup, putting, scoring, map, round and camera systems unchanged

### Rejected live

- retaining the 4 × 2 catalog with richer decoration: hierarchy remained generic
- the first hero framing: intrinsic SVG sizing clipped the product
- the first Icon putter: paired arcs read as eyewear rather than golf equipment
- tier-dependent performance claims: the current physics does not implement them

### Verification

- Visual Gauntlet: 22 / 22 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- Desktop Foundation / Icon and iron / driver / putter inspected.
- True 390 × 844 portrait and 844 × 390 short-landscape inspected.
- Preview / Equip / Escape behavior verified against the live HUD.
- Live warning/error log empty.
- JavaScript syntax and diff whitespace clean.

### Honest result

The Bag now behaves like part of the ownership fantasy rather than a generic catalog.
Construction progression is recognizable without labels or rarity color, but the
code-native drawings and in-world 3D clubs remain below the final product-render
ceiling. The next largest every-shot discrepancy is repeated prototype planting and
prop rhythm along the playable route.

### Next target

Coastal Ridge Ecological Composition V1: replace the remaining evenly scattered
course-edge vegetation / prop rhythm with authored wind, drainage and maintenance
communities while preserving `LOFT_FIELD_V4_CONTACT` and performance budgets.

## Integration 021 verdict

Integration 021 gives Coastal Ridge a bounded atmospheric identity without changing
the proven course, camera, lighting or gameplay systems.

### Built

- frozen `LOFT_COASTAL_AIR_V1` specification shared by world and renderer
- coastal-blue upper sky, quiet natural horizon and restrained sunward warmth
- four deterministic procedural cloud sheets with unique silhouettes and subtle
  cream / blue-stone value structure
- fog envelope moved from `165–430` to `235–530`, restoring geological depth
- executable atmosphere budget and implementation contract

### Rejected live

- repeated high-opacity cards: visible decal rhythm
- taller soft sheets: fog-smear silhouette
- instanced 3D sphere clouds: suspended-stone read

### Verification

- Visual Gauntlet: 17 / 17 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- Desktop reset, maximum-wide, ocean-side and close-putting inspected.
- True 390 × 844 portrait and 844 × 390 short-landscape inspected.
- Live warning/error logs empty.
- JavaScript syntax and diff whitespace clean.

### Honest result

The sky, headland and ocean now read as separate depth planes and the atmosphere no
longer erases the new geology. The procedural clouds remain intentionally quiet and
below production volumetric quality; they pass because they support rather than
compete with the course.

## Integration 020 verdict

Integration 020 builds the first authored Coastal Ridge destination silhouette
outside the protected playable field.

### Built

- seven broad stepped Lighthouse Headland masses with warm/dark geological strata
- low lantern notch, two sea stacks, dark wet base, three wind-pruned pines and heath
- quieter near-shore rock frequency and scale
- `nonPlayable` boundary, draw-call and triangle validation

### Protected

- nearest bound `z = -294.939`, beyond the protected `z = -294` limit
- exact terrain/contact/surface/water/cup systems unchanged
- headland excluded from runtime world animation
- 10 draw calls and 13,044 triangles inside budget

### Before / after

Before: isolated lighthouse, pale horizon, flat ocean strip and repeated brown blobs.

After: lighthouse grounded by a deliberate promontory, ocean retained, geology and
sparse planting composed as one recognizable coastal landmark.

### Next target

Fresh adversarial review is comparing the remaining collectible-club fidelity gap
against the remaining every-shot ecology/architecture gap. Exactly one will advance.

## Integration 019 verdict

Integration 019 rebuilds the gameplay golfer's visible surface around the proven Integration 017 analytic motion.

### Built

- profiled elliptical thigh, calf, sleeve, upper-arm and forearm shells
- buried knee, elbow, shoulder, wrist, hip and ankle bridges
- shaped glove/bare hands and shoe uppers with rounded outsoles
- sloped polo shoulder construction and corrected cap-separated hem normals
- simplified angular nose, horizontal eyes, brows, mouth, soft-square jaw
- sculpted rear hair mass, sideburns, cream cap crown/band/brim and one restrained signal
- dark matte polo, warm field-stone trousers, cream cap/shoes, ink belt/sole hierarchy
- deterministic address, top, impact and finish visual fixtures

### Explicitly preserved

- all pose keys and ability motion curves
- fixed arm and leg lengths
- analytic two-bone IK
- hand and club guide paths
- rigid grip, shaft, ferrule and club head
- grounded shoe contact points
- putting address and shoulder-rock motion
- protected `t = .60` impact / launch contract

### Verification

- Visual Gauntlet: 15 / 15 PASS.
- Terrain Gauntlet: 13 / 13 PASS.
- Live address, top, impact, finish, close putting and result views inspected.
- Live warning/error logs empty.
- JavaScript syntax and diff whitespace clean.

### Honest result

This is a substantial code-native character step, not a claim of production skinning. The golfer now reads as one designed athletic silhouette instead of a set of moving primitives. Production mesh deformation, facial animation, wardrobe variants and secondary motion remain open.

### Next target

Coastal Ridge Zero-Brand World Pass V5: improve the raw-world composition while preserving the shared rendered/physical terrain contract.

## Integration 018 verdict

Integration 018 replaces two high-frequency visual cheats with real playable objects.

### Spatial cup

- Regulation-proportioned aperture is cut from the rendered terrain with a stencil.
- The opening owns a turf wall, cream liner, restrained lip, recessed bottom and flagstick sleeve.
- The flagstick relationship is spatial rather than layered over a flat token.
- `_tryCup()` remains the trusted pace-sensitive center / hot / edge authority.
- Accepted putts remain full size and visibly drop below the lip before settling.
- Result framing follows the pin, so the camera no longer descends with the sinking ball.
- The next-hole transition clears the sink state deterministically.

### Playable LOFT ball topology

- The real gameplay ball now owns exactly 338 deterministic depressed dimples.
- One fixed signature dimple maps to normalized `(-.382, -.382, .813)` and is colored in the same vertex-deformed surface.
- There is no detached orange bead and no repeating bump-map substitute.
- The material is matte off-white with restrained deterministic microtexture.
- Near and far LODs share one topology definition; only one draw object is active.
- Position, spin, rolling rotation, compression, camera tracking, physics and cup integration remain on the existing gameplay root.

### Verification

- Terrain Gauntlet: 13 / 13 PASS.
- Visual Gauntlet: 14 / 14 PASS.
- Changed JavaScript syntax: PASS.
- `git diff --check`: PASS.
- Clean live two-foot center fixture: ACE receipt and empty warning / error log.
- Clean live hot fixture: pace rejection and long result preserved.
- Score, result and next-hole transition remain intact.

### Next target

LOFT Golfer Surface and Silhouette V2. The analytic fixed-length motion is now a protected foundation; the face, clothing, hands, joints and footwear remain the largest every-shot mismatch against the Character DNA reference.

## Integration 017 verdict

Integration 017 is the first complete LOFT visual-language candidate. It replaces the generic floating-pills prototype grammar with one brand system spanning live play, collection, ability, results and the coastal world.

### LOFT field language

- Clubhouse Ink is structure.
- Scorecard Cream is editorial space.
- Fairway Stone is hierarchy and neutral equipment finish.
- Flag Orange is reserved for live state, selection, impact and primary direction.
- The live HUD, wind read, course map and camera controls are field instruments.
- The bag and club selector are Workshop objects.
- Shot, hole and round results are editorial receipts.
- All official LOFT wordmark / ball assets remain on their intended cream field.

The expanded map is right-docked on wide screens and a readable precision sheet on portrait. The Workshop presents eight real model families in four columns on desktop / short landscape and two columns on mobile. All established gameplay DOM identifiers remain intact.

### Collectible equipment system

Every club now owns a model, loft, flight brief and multi-part procedural head assembly. Driver, wood, hybrid, iron, wedge and putter construction are visually distinct.

Five grades are live:

1. Foundation / Common — broad, brushed utility steel
2. Field / Common+ — refined silver satin
3. Tour / Rare — compact forged chrome
4. Signature / Epic — black titanium and orange signal
5. Icon / Legendary — compact ink / pearl ceramic construction with precise orange crown detail

Foundation and Icon are not simple recolors. Head bulk, part count, crown treatment and putter construction differ. Long-club address radius is authored by category, every club length stays rigid, and every sole now clears the visual terrain plane.

Trusted carry, launch, ball-speed, spin and roll numbers are unchanged. Level 75 shares Level 50's mastered physics ceiling; its value is collection identity and finish.

### Human motion and camera

The golfer no longer telescopes between keyframes. Arms and legs use fixed-length analytic two-bone chains across address, takeaway, top, delivery, impact, release and finish. Head features inherit one head transform, garment details inherit the shirt, shoe contacts ground the stance against the real terrain, and the club is one rigid grip / shaft / ferrule / head object.

Impact remains at the protected `t = .60` launch contract. Ability changes posture, plane, balance and finish without changing anatomy. Putting uses a quieter shoulder-rock motion and lower, more credible hand position.

Camera distance now supports:

- full-shot aim from 4.8 m to 12.0 m
- putting aim from 3.0 m to 7.2 m
- result inspection from 3.2 m to 9.0 m
- mouse-wheel and existing pinch zoom
- selected zoom inheritance into the swing
- exact putting-line alignment without the former tap-in camera jump
- terrain line-of-sight clearance and smoother aim / flight response

### Coastal world delta

Integration 016's shared visual / physical terrain contract is locked and preserved. The visual layer now adds clustered multi-lobe coastal scrub, more asymmetric windswept pines, smoother rocks, corrected non-drifting cloud motion, wider and softer coastal light coverage, cleaner exposure and a less overpowering lighthouse. Explicit blade geometry was removed from greens and tees, eliminating the black-speckle artifact while maintaining their material response.

### Automated and live Gauntlet

12 / 12 visual-system checks pass:

- verified LOFT-only repository boundary and no unrelated service references
- trusted club-stat fixture preservation
- deterministic five-grade resolution
- complete multi-part object assemblies at Foundation and Icon
- address-turf clearance for every club at both grade extremes
- materially different Foundation and Icon putter construction
- 201-sample fixed anatomy and fixed club length
- rigid putting motion and authored address contract
- inherited head and garment transforms
- full-shot, putting and result camera envelopes
- complete field / Workshop / receipt UI contract
- protected LOFT Field V4 contact identity and clean greens

The existing terrain Gauntlet remains 13 / 13. Syntax validation passes for every changed JavaScript module and `git diff --check` is clean.

Live browser regression covers 390 × 844 portrait, 844 × 390 short landscape and 1280 × 720 desktop; compact / expanded map; Foundation / Icon equipment comparison; Workshop; wheel zoom; tee shot; approach; close-camera long putt; two-foot tap-in; pace-sensitive cup capture; score update; shot receipt; hole receipt; auto club selection; and next-hole transition. Console warnings / errors remain empty.

### Preservation and boundary

Preserved:

- The Line and The Stroke
- ball flight, contact, bounce, roll and cup physics
- lies and automatic club selection
- putting and pace-sensitive capture
- scoring, hole progression and round state
- compact / precision map
- one-more-round flow
- LOFT Field V4 terrain / contact system

No Supabase dependency, AEZRIO file or unrelated project was touched.

This remains a code-native Prototype 1 visual system. Production character skinning, authored facial animation and production GLB club assets remain later asset-pipeline work; they are not used as an excuse for primitive motion or generic collection presentation in this build.

## Integration 016 verdict

Integration 016 is the first complete LOFT Terrain System candidate.

The structural contract is now:

- one authored land field
- one triangle-interpolated rendered height
- one shared rendered / physical normal frame
- one golf-ball sphere contact height
- one exact swept terrain crossing
- one shared coastline / water threshold
- one physical and visible surface identity at every playable point

System identifier:
LOFT_FIELD_V4_CONTACT

Render / physics contract:
TRIANGLE_HEIGHT_SHARED_NORMAL

### Decisive visual delta

The prior build double-encoded course albedo through the color pipeline, crushing intended turf values into a near-black olive field. Integration 016 authors the course canvas directly in sRGB and separates the maintained cuts with deliberately restrained value and chroma spacing.

Coastal Ridge now has:

- a crisp, physical first cut between fairway and rough
- readable fairway mowing direction
- distinct green / fringe / fairway / first-cut / rough / sand identities
- a broad landing crest and shallow hollow on the opening climb
- stronger crossfall, shoulder, swale, approach ramp and collection landforms
- authored putting-green tilt, crown and collection shoulders
- bunker bowls, lips, rake and recessed sand tone on the same collider
- denser native rough and local lie-aware turf
- smoother windswept pines and organic color-varied shrubs
- coastline-aligned rock strata, shared shoreline foam and a deeper ocean treatment
- a lower coastal key with reduced ambient wash so physical grade reads on a phone

### Contact / physics delta

The rendered mesh, ball contact and roll solver now share height and normal data. Sphere contact lifts the ball along the visible smoothed normal, preventing side-slope burial without inventing a second surface.

Terrain sweep now:

- ignores a grounded ball that is genuinely separating on launch or after bounce
- resolves every grounded non-departing uphill entry at the segment origin
- enumerates height-grid and triangle-diagonal crossings for airborne entry
- refines the first positive-to-negative contact interval
- returns the exact visible contact height

The lazy height cache returns the same Float32 value on first and later access, removing order-dependent sub-micron contact drift.

Cup capture is regulation-led and pace-sensitive. Hot or edge entries reject to the lip instead of being magnetized into the hole. Water crossing resolves on the same fixed step as the visible shoreline.

### Automated terrain Gauntlet

13 / 13 checks pass, including:

- verified LOFT-only repository boundary and remote
- 4,000 random shared height / normal / contact samples
- course cut and hazard identity fixtures
- surface personality ordering
- 12,000 deterministic grounded uphill sweep probes
- clean grounded launch and first-bounce separation
- immediate, height-safe fairway to first-cut transition
- identical fixed-step shot result under 30 / 60 / 120 Hz frame delivery
- same-step visible water crossing
- controlled centre cup acceptance and hot / edge rejection
- critical golf, map, bag, result and round DOM contracts

The independent final regression gate added 25,000 randomized terrain sweeps, 12,000 terrain-seam probes and 160 randomized full shots. It found zero missed / late / invalid contacts, seam continuity held to approximately 1.5e-7 m, and 30 / 120 Hz shot outcomes were identical with zero penetration, recovery, non-finite or unfinished states.

### Stable mobile verdict

The settled 390 × 844 and 430 × 932 builds render with no fatal overlay or console warnings / errors. Bag selection, precision map expand / close, a full iron stroke, flight, bounce, roll, result and next-shot flow remain working. Sampled iron landings remain visibly tangent to the physical terrain.

Rapid reload captures can briefly show a partially composited browser frame. Eight stable 430 × 932 reloads confirmed the inline map, camera orientation, WebGL world and HUD are correct after the document settles; this is not a LOFT runtime state defect.

### Preserved systems

No scoring, hole progression, round, equipment, target-map, gesture, camera-mode or one-more-round contract was replaced. Changes are isolated to terrain/world presentation, shared contact, surface response and surface feedback.

### Remaining hardware gate

The code and in-app mobile Gauntlet pass. A physical iPhone remains the final authority for sustained GPU frame pacing, speaker mix and haptics.

## Device verdict entering 015

Integration 014 was a meaningful structural improvement, but real-device review still failed the visual bar.

Confirmed remaining problems:
- terrain still read as geometric / prototype-grade at phone distance
- large color regions exposed triangle / low-resolution surface language
- grass cuts lacked enough material character
- course edges were too mathematically clean
- some ball / terrain penetration could still be perceived
- trees / architecture still read as primitive assets
- the world did not yet feel alive enough to carry the LOFT identity

The requirement for 015 is a structural visual step, not another cosmetic tint pass.

## Integration 015 — LOFT Field V3 Exact

### 1. Physics now samples the exact rendered terrain triangles

The previous unified field still had one subtle source of disagreement:

renderer:
- interpolated between heightfield mesh vertices as triangles

physics:
- sampled the underlying continuous analytic terrain function

Those two surfaces could differ slightly between grid vertices.

Integration 015 separates:
- rawTerrainHeight(): authored continuous landform
- terrainHeight(): the exact triangle-interpolated field that is rendered

The terrain mesh and physics solver now share:
- identical grid vertices
- identical B↔C cell diagonal
- identical triangle interpolation
- identical ground Y

This removes the final architectural source of sub-cell ball penetration.

Current grid:
- approximately 0.80 m cells
- 230 × 430 cells
- roughly 100k terrain vertices
- roughly 198k terrain triangles

System identifier:
LOFT_FIELD_V3_EXACT

Render / physics contract:
TRIANGLE_EXACT

### 2. High-resolution course-space terrain skin

Vertex-color course painting has been replaced by a high-resolution course-space albedo.

The terrain now receives:
- sub-meter visual course boundaries
- organic fairway edge modulation
- organic green silhouettes
- organic bunker silhouettes
- fairway mowing direction
- green mowing direction
- bunker rake / grain character
- subtle broad relief shading
- physical roughness variation by cut
- micro turf bump
- mipmapped / anisotropic filtering

This removes the large triangular color shapes visible in earlier device captures.

### 3. Organic surface geometry language

Fairway edges now use several superimposed long-wavelength edge harmonics.

Greens use seeded multi-frequency radial distortion rather than perfect ellipses.

Bunkers use the same seeded organic metric for:
- physical terrain depression
- sand surface identity
- visible boundary

The visual boundary and physics boundary therefore remain one authored system.

### 4. More natural strategic terrain

The existing ridge / shelf / saddle architecture remains, with additional restrained:
- fairway shoulder rolls
- drainage swale
- long-wavelength earth movement

No micro-noise controls physics.

If a slope can materially move the ball, it is intended to be visible through:
- silhouette
- lighting
- broad baked relief
- mowing / surface read

### 5. Final-demo terrain density

Terrain tessellation has been increased significantly.

This specifically improves:
- bunker bowl curvature
- green shoulder curvature
- side-slope silhouettes
- ridge transitions
- camera-close terrain

The field remains one draw surface rather than multiple stacked meshes.

### 6. Dimensional turf system

LOFT now has three turf-detail scales:

Global:
- course-space albedo + micro bump

Mid-range:
- permanent native rough / dune grass

Near-ball:
- regenerated instanced turf by local cut

Near-ball grass now samples the actual local surface for each blade:
- rough = tallest
- fringe = medium
- fairway = short
- tee = short
- green = extremely tight

A fairway / rough or fringe / green boundary therefore has dimensional grass-length continuity.

Bunker lips also receive restrained dimensional turf detail without adding collision geometry.

### 7. Sculpted LOFT vegetation

The previous stacked-cone conifers were replaced.

New pines use:
- shared higher-detail sculpted foliage lobes
- asymmetrical wind-shaped crown placement
- restrained tonal layering
- smoother silhouette
- tapered trunk

This keeps LOFT stylized while removing the primitive mobile-placeholder read.

### 8. Living Coastal Ridge atmosphere

The course now has:
- gradient sky dome
- soft procedural cloud banks
- slowly moving coastal clouds
- animated ocean bump
- restrained tree movement
- subtle flag movement

Motion is deliberately quiet.

LOFT should feel alive, not arcade-wobbly.

### 9. Clubhouse pass

The placeholder flat roof was replaced by a gabled clubhouse silhouette with:
- fascia
- terrace / deck
- rail detail
- retained warm stone / plaster language

The lighthouse remains the course landmark.

### 10. Golf-ball physics refinement

Air / terrain collision now performs multi-probe swept contact across each fixed step before binary search.

This catches rising terrain even when both fixed-step endpoints would otherwise miss a narrow crossing.

Ground roll now uses the physical 5/7 rolling-sphere gravity factor instead of full point-mass slope acceleration.

Result:
- slopes remain important
- greens no longer behave as if the ball is sliding on ice
- visible grade produces a more physically credible break

Spin is no longer discarded at the beginning of ground roll.

A restrained spin-to-roll coupling now lets:
- wedge shots check
- low-spin shots release
- rolling converge naturally toward pure roll

### 11. Coastal lighting pass

The key light has been lowered to a more grazing coastal angle.

The lighting now prioritizes:
- visible grade
- long sculpted landforms
- readable green contour
- surface texture

Fog begins farther from the player so near terrain keeps more contrast.

## Non-negotiable device fixtures

V01 — fairway / rough boundary at camera-close distance
V02 — green / fringe boundary
V03 — bunker lip and bowl
V04 — ball rolling across a terrain-cell boundary
V05 — high-speed iron into rising terrain
V06 — wedge landing with visible check / release
V07 — 30–40 FT putt across visible break
V08 — ball at rest on side slope
V09 — rough lie with dimensional grass
V10 — clubhouse / trees / coastline wide view
V11 — full three-hole round
V12 — no ball penetration in slow-motion visual inspection

## Hard pass conditions

- ball never renders inside solid terrain
- visible field and physical field agree at sub-cell scale
- no triangular course-color artifacts at normal phone distance
- fairway / green / bunker edges read organic rather than primitive
- bunker bowl reads as actual shaped terrain
- grass length communicates the lie
- slopes are visually legible before the shot
- world assets no longer read as stacked primitive placeholders
- terrain remains stable for a complete three-hole round
