# LOFT Gauntlet State

Updated: 2026-09-14

Build: Integration 044 THE SEALED SHOT Step 3 / PURITY; native gameplay remains Integration 041

Branch: `prototype-1-gauntlet`

Playable artifact: `/prototype1/`

Publication approval: the user explicitly approved publishing the original
governing DOCX and findings with the accumulated Step 1 + Step 2 checkpoint to
LOFT `main`. The earlier document-publication blocker is resolved. Both original
archives remain byte-identical; latest local findings are a separate addendum.
Destination is the verified LOFT origin, ordinary fast-forward, never force push.

## Current build assessment

**Step 3 / PURITY: PASS, 144/144 checks (105 existing + 19 Step 1 + 8 Step 2 + 12 Step 3).**
`prototype1/shot/resolveShot.js` executes six shot cases in bare Node with explicit
inputs, native math and injected dispersion. Its closed dependency graph contains
only the resolver, scalar vector subset, existing solver, surface response and
per-course field factory. No Three.js/DOM/renderer/ambient clock is required.
The browser calls shared `launchShotPhysics` and the same `GolfPhysics.step(dt)`;
it does not synchronously precompute a whole shot at impact. Live clock fallback,
frame scheduling and presentation remain at their original browser boundaries.
Step 2's 2,240 default + 2,240 undefined + 5,880 injected + 5,880 repeat comparisons
and 30 paired trajectories / 15,901 fixed frames still pass unchanged.
Exact inverses reconstruct accepted Step 2 game/solver/field bytes from the moved
implementation, then Step 2's unchanged inverse restores Integration 041. No
fixture rebaseline or tolerance. All 11 frozen locks and predicate findings remain.
The missing distance API discovered by the terrain gate was repaired with the
exact two vendored methods; terrain 14/14 and visual 37/37 pass. No open regression.
Normal browser render, flight/result/Next Shot and cup/Next Hole smoke passed.
Details: `gauntlet/history/integration_044.md`, `gauntlet/sealed-shot/evidence/step3-node.json`.
**STOP before Step 4. EXTRACTION PARITY is not claimed.** Runtime rows remain pending.

**Current checkpoint:** Flight camera/UI and the official-logo correction are
implemented. All 105 executable gates pass. Across 378 trajectories / 166,269
frames, minimum apex sky coverage is 68.77%, worst ball-edge margin is 9.057%
(required 6.667%), and the actual ball occupies at least six vertical apex pixels
in desktop/portrait/short-landscape test views. One distance instrument survives
airborne play; normal HUD/receipt and Next Shot return at rest. The full protected
040 solver/terrain/rig/clubface/ball bytes are unchanged by this camera/UI work.

Official Bag and Chronicle logos use the unchanged checked-in WebP asset. The
invented monochrome SVG was rejected and deleted. Only a cream-matte master is
available; use its native surface, never invent a logo to simulate transparency.

Flight-only scores: **IMPACT 6.8 / FLIGHT 7.1 / LANDING 6.3**. These are not
production-quality claims and do not score the golfer. Detailed before/after,
rejected candidates, limitations and live checks: `gauntlet/history/integration_041.md`.
The earlier putting/iPhone-preview work is separately recorded in history 040.

**THE SEALED SHOT v1.2 FINAL supersedes the old pending numerical decision.**
Read its exact archived authority and latest findings under `gauntlet/sealed-shot/`.
v1.2 is CLOSED: native physics stays unchanged; later authoritative results and
measured boundary handling follow its explicit build order. No old numerical-choice
question remains blocking. Integration 041 was verified on remote main at `4497fc9`.

**Step 1 artifacts are implemented and locally verified; required runtime coverage remains pending.** Independent seed/key vectors, concrete
versioned course encoding/hash, authored cup-ID permanence, frozen raw-bit parity
projection and predicate findings are checked in. 105 unchanged existing + 19 new
checks pass. Browser byte checks pass 48/48 before and after reload. No gameplay,
visual, physics, equipment, control or networking source changed. Detailed commands,
counts, hashes, vectors and limitations: `gauntlet/history/integration_042.md`.

| Sealed Shot gate | State |
| --- | --- |
| SEED CONTRACT VECTORS | PASS — 11 independent fixtures, standalone implementation |
| COURSE HASH STABILITY | PENDING full required matrix — PASS on Node + Chromium/reload; WebKit, Gecko, physical iOS WebView untested |
| BOUNDARY KEY VECTORS | PASS — 9 independent byte/word fixtures; no runtime bands |
| Parity fixture/version | FROZEN v1 — 6 solver-side trajectories, 3,176 fixed frames |
| Step 2 injection/preservation | PASS — Node v24.15.0/V8; exact default operand/site, fixed-scalar parity, narrow inverse seam |
| SEED INTEGRITY | Not implemented — production seeded dispersion belongs to Step 5 |
| PURITY | PASS — Step 3, 12 checks; isolated bare Node graph and source-faithful moves |
| EXTRACTION PARITY | NOT RUN — next authorized Step 4, frozen projection untouched |
| DETERMINISM / BOUNDARY SAFETY / REPLAY | Not implemented — later authorized steps |

The assessment below is retained historical context through 039, not this session's
active target or a fresh visual critic pass.

Integration 039 adds a bounded inland hill/saddle setting, precisely joined beyond
the playable field. The first over-tall hill candidate was lowered after live review.
It adds one draw / 17,946 triangles / no textures or shadows; all 77 gates pass,
including the unchanged complete terrain/contact hash. Integrations 036–038 repair actual iron/wedge heel attachment, slim shaft/ferrule,
recessed forgings and purpose-built wedge soles. PW has a 20 mm working sole; SW
has a 38 mm relieved platform. Faces, repaired necks, grips,
head motion and every golf number remain unchanged. Only wedge sole geometry and
its material were intentionally superseded in 038. The published v1 checkpoint on main is
still 035 (`55350bd` including publication notes) at the start of this run. The latest
user now requests publishing each completed checkpoint. See publication status below.

The prototype is functionally healthy and materially closer to one LOFT world, but it
does not yet meet the Good Work production bar. Integrations 016–030 now provide a
deterministic field/contact foundation, spatial ball/cup, coherent golfer surface,
landmark/air/ecology/architecture composition and a true club-object Workshop. The
golfer now has one focused craniofacial silhouette, a stable two-hand grip and a
tangent-continuous ground-up swing. Coastal Ridge has a camera-readable blue-to-warm sky
and sculpted cloud hierarchy. Required distance now belongs to the projected world
target while club capacity is explicitly labeled. Integration 033 adds one real live/final
Round Chronicle and repairs cross-hole camera rebasing. Integration 034 makes the actual
338-dimple ball inspectable in the Workshop with shared geometry/material, curved normals,
one circular signature and lazy close-detail realization. Integration 035 replaces the
Workshop hero drawing with the actual held club assembly and a shared single-context
inspection lifecycle. The root homepage now opens this build, not P0.7. The entire
checkpoint was published to LOFT main for assessment at `568c9348995e27686e7466a466a701289973eac3`
(implementation commit `da53550` plus document formatting), with a clean working tree.
Remote main was verified. No force push or history rewrite was used.
Production-grade 3D assets and
the remaining end-to-end product surfaces remain visible ceilings.

The scores below are recalibrated against the supplied production boards. Earlier scores
were too generous to code-native progress; lower world/character scores are a stricter
assessment, not evidence that this iteration changed or damaged those assets.

| Category | Honest score | Assessment |
| --- | ---: | --- |
| Technical integrity | 9.0/10 | 77 executable gates, off-play scenery/seam checks, closed soles and exact terrain/ball contact; physical-device performance is not yet validated. |
| UI / UX clarity | 7.2/10 | World-linked shot facts, preview/Equip separation and one live/final ledger; primary navigation, progression and settings remain. |
| LOFT identity | 6.2/10 | Restrained direction is established, but raw course and character screenshots still expose prototype construction. |
| Terrain / environment | 5.0/10 | The inland setting now frames the course and the physical field is unchanged; close turf, playable routing, vegetation and geology remain far below the destination references. |
| Character / animation | 4.8/10 | Connected anatomy, grip and swing are improved; face, garment deformation and silhouette still need production-level craft. |
| Equipment desirability | 6.2/10 | Repaired heel attachment, real recesses and purpose-built wedge soles; thick face/body proportions and machining remain below the production references. |
| Ball identity | 7.4/10 | Same 338-dimple ball is inspectable with dense bowls, curved normals and one fixed signature; exact quad-symmetric production topology remains unproven. |
| Cup / hole integrity | 7.2/10 | Spatial aperture, liner, depth and pace-sensitive capture agree; cut-turf and lip shading can mature. |
| Camera / game feel | 7.7/10 | Close putting remains accessible; cross-hole rebasing prevents backward/underground interpolation while local resets stay smooth. |

## Completed improvements

- Integration 044: Step 3 native resolver extraction, scalar-only solver vector
  dependency, per-course cache ownership, strict relocation proof and 144 checks.
  No seeded dispersion, authoritative result, Q/epsilon/bands or MARGIN work.
- Integration 043: Step 2 dependency seam only. Native clock default and all
  launch/reaction computations retained; exact input/state/trajectory comparisons,
  strict inverse-seam preservation and full 132-check evidence. Original governing
  documents approved for publication without modification. No Step 3 work.
- Integration 042: Step 1 contract evidence only. Exact authorities archived;
  seed/key independent BigInt oracle, DataView subject, binary course schema and
  artifact closure, immutable ID ledger, raw-bit parity oracle, predicate audit,
  full regression evidence. Original playable source/asset bytes preserved.

- Integration 041: height-driven broadcast flight framing, continuous captured-pose
  handoff, measured-displacement carry, short-landscape ball readability, exact
  airborne UI silence, SVG instrument arrows, clean Chronicle score layout and
  restored official logo asset. Existing punch and protected systems untouched.
- Integration 040, before the Flight freeze: inbound cup rejection repair, tiny
  pace control, quiet contact/drop, complete/holed score ordering, two-finger
  cancellation and safe current-address LAN preview. See its separate history.

- Integration 039: one authored off-play inland hill/saddle mesh, 431 western and
  146 northern matching 0.8 m seam stations, restrained heath color and one draw.
  Actual camera projections/rays across three holes and three aspects preserve
  target and landmark visibility; the existing contact field is bit-for-bit protected.
  See `gauntlet/history/integration_039.md`.
- Integration 038: actual narrow PW / wide SW cambered soles, trailing and heel/toe
  relief, controlled edge shoulders and analytic surface normals. Four independently
  authored gates use actual triangles and reject deliberately broken geometry.
  Low-tier sole penetration is removed at measured impact; full pose/face/golf data
  remains exact. See `gauntlet/history/integration_038.md`.
- Integration 037: closed forged-back shells, physical tier-section progression,
  recessed outline-following inserts, rising sole-to-toe muscle, body-only material
  hierarchy and corrected planar-cap shading. Three new geometry-derived gates;
  faces, soles, heel joints, motion and gameplay remain protected. See history 037.
- Integration 036: heel-attached iron/wedge neck, slim shared shaft/ferrule and one
  rigid station solver; unchanged striking faces, soles, hands, head motion, golf
  profiles and all other families. Actual triangle/endpoint/corridor and 101-pose
  parity checks provide four new gates. See `gauntlet/history/integration_036.md`.
- Integration 016: one rendered/physical LOFT Field V4 terrain, exact shared triangle
  height/normal, swept contact, deterministic roll/water/cup fixtures, readable cuts,
  organic surface boundaries, dimensional turf, coastal landform pass.
- Integration 017: LOFT ink/cream/stone/orange field language, responsive HUD/map,
  Workshop equipment experience, editorial result receipts, five physical equipment
  grades through Level 75, category-specific club assemblies, fixed-length analytic
  character rig, grounded stance, rigid club, smoother/closer camera, vegetation and
  light cleanup.
- Integration 018: a spatial regulation-led cup with aperture stencil, turf wall,
  liner, recessed bottom, flagstick sleeve, and full-size capture/drop presentation;
  one actual playable LOFT ball with exactly 338 deterministic depressed dimples,
  one fixed orange signature dimple, matte microtexture, and matching near/far LOD.
- Integration 019: sculpted elliptical thigh/calf/sleeve/arm/forearm shells replaced
  gameplay cylinders; joint bridges were buried; glove/bare hands and shoe uppers
  gained authored profiles; the face, cap, hair, polo shoulder/hem, belt, trousers,
  outsole, and material hierarchy were rebuilt around the protected analytic rig.
- Integration 020: a bounded seven-mass Lighthouse Headland, wet/dry geological
  strata, sea stacks, wind-pruned pines and quieter shore-rock rhythm grounded the
  primary landmark beyond the playable world boundary.
- Integration 021: Coastal Air established a blue-to-warm authored sky, four subtle
  unique cloud sheets and a farther `235–530` fog envelope without post-processing.
- Integration 022: the 4 × 2 club catalog became a hero-object Workshop with
  reversible preview, explicit Equip, a horizontal family rail, honest specs, five
  physical SVG construction grades and responsive product inspection.
- Integration 023: repeated nine-mesh pines, uniform grass and one-off rock scatter
  were replaced by three instanced tree silhouettes, three understory families,
  clustered fescue and two authored shoreline rock families; the complete ecology is
  deterministic, grounded, non-playable and bounded to 10 draws / 88,655 triangles.
- Integration 024: the beige clubhouse block became a grounded Ridge House with
  stepped stone/plaster massing, nested roofs, chimney, wrap terrace, 11 windows and
  23 timber-frame details in seven draws / 724 triangles.
- Integration 025: the protected analytic golfer gained asymmetric trouser-seat and
  tailored polo shells, buried garment transitions, moving cuffs and a separate
  upper / midsole / outsole footwear stack without changing animation landmarks.
- Integration 026: close putting gained a mobile-first safe-field composition, clearer
  two-foot cup read and shared ready / swing framing across phone and desktop aspects.
- Integration 027: one shared turf/light specification aligned baked grade with the
  live sun, widened honest surface response, quieted painted mowing, added restrained
  turf weave and locked 297,361 exact terrain/contact/surface probes by SHA-256.
- Integration 028: the actual held club gained a coordinate / contact contract, six
  category-specific hard-surface constructions, five physical grades, one restrained
  premium signal, grounded soles and measured ball-face clearance across all 40
  club / grade combinations without changing any golf numbers or swing landmarks.
- Integration 029: the golfer gained one closed soft-square craniofacial shell,
  sculpted cap / hair / neck continuity, restrained ball-focused gaze, permanent lead /
  trail handle stations, fixed anatomical palms and one continuous visible grip while
  every trusted pose, IK endpoint, club landmark and impact time remained unchanged.
- Integration 030: seven independently eased swing segments became one shape-preserving
  cubic motion; pelvis-led delivery, retained shoulder lag, chest release and a planted
  trail-toe pivot now surround the unchanged impact / launch handoff.
- Integration 031: the flat gray upper frame became a production-camera-readable
  blue-to-warm sky with four deterministic warm-crown / cool-underside cloud banks,
  open-ocean negative space and a measured five-pass atmosphere budget.
- Integration 032: one projected Target Steward now makes landing/cup distance,
  elevation and surface the primary world-linked decision while the selected object
  explicitly distinguishes `CARRY` from putter `RANGE`; it is responsive, obstruction-
  aware, pointer-transparent and absent during map, Workshop, swing, flight and result.
- Integration 033: phase-safe live/final Round Chronicle with completed-only totals,
  Rowan comparison, ruled ledger, inert background and focus restoration; a real
  cross-hole camera discontinuity was reproduced and fixed with one-time rebasing.
- Integration 034: actual playable ball inspection, shared physical geometry/material,
  analytic bowl normals, indexed 46,080-triangle lazy hero LOD, one fixed circular
  signature, direct rotate/zoom and single-context renderer restoration.
- Integration 035: actual held-club factory shared with direct Workshop inspection;
  craft/face/sole/full views, rotation/zoom, scene-local studio reflections, safe
  Club/Ball canvas handoff, bounded framing and instance-buffer lifecycle. Official
  root entry points to the current game. No head/shaft/grip geometry or pose changed.
- Deterministic address/top/impact/finish visual fixtures now make character review
  repeatable without changing real gameplay motion.
- Current gates: terrain 14/14; visual 37/37; ball 6/6; assembly preservation 1/1;
  atelier 5/5; neck 4/4; forging 3/3; wedge sole 4/4; hinterland 3/3: PASS. Latest live checks cover desktop/portrait/short landscape,
  actual club inspection and Club/Ball/Club/course return. Full manual three-hole
  and physical-device tests were not repeated in 038–039. The two-foot real putting
  fixture and map open/close were inspected in 039, not a new full manual round.
- No Supabase, AEZRIO, unrelated repository, or new dependency was introduced.

## Current regressions

No confirmed runtime regression is open in the tested 041 matrix. The user-reported
wrong logo was a real regression and has been corrected to the official asset.
An inherited browser/server interruption was recovered by starting only the LOFT
loopback server; normal preview is available again. No network/firewall setting changed.

Publication status: code push to LOFT main succeeded. Existing GitHub Pages workflow
34128693974 failed at Configure Pages: no Pages site exists, and its workflow token
cannot create one. The repository is already public. Enabling a new public Pages site
was rejected by the approval reviewer because the user authorized a main-branch push,
not that persistent hosting change. No Pages setting was changed and no workaround was
attempted. Ask for explicit approval before enabling public GitHub Pages or retrying it.
The normal local playable route remains available; this is not a runtime regression.

No confirmed regression is open. Integration 033's world-cut camera defect was repaired,
not dismissed as a browser artifact. Integration 034's clipped landscape controls and
stale return-canvas frame were fixed and reviewed again. During Integration 018, the first topology factory
exposed one stale putt-ghost material reference on the exact two-foot fixture. That
fault was fixed, the fixture was rerun in a clean session, and the ACE/result path
completed with an empty warning/error log. Trusted launch/carry/spin/roll,
putting, cup acceptance/rejection, scoring, map, automatic club selection, result,
hole transition, and round state remain intact. The items below are quality gaps, not
new functional damage.

## Open quality gaps — ranked

1. **THE SEALED SHOT — after this closure, Step 4 only.** EXTRACTION PARITY through
   the frozen parity projection. If comparison fails, fix/revert extraction;
   never normalize the discrepancy away. Do not seed, quantize or install bands.
2. **Near-field turf / cut readability — queued, out of scope:** the course has more setting
   but the ground under the golfer still reads as a smooth painted sheet. Improve the
   maintained-grass/rough/fringe/sand material scale in real tee and putting views,
   without adding noisy false-break lines, changing contact geometry or adding systems.
2. **Production character asset pipeline:** the code-native golfer is coherent, but a
   future skinned mesh, facial blendshapes, wardrobe variants, and secondary motion
   are required to reach the character-board production ceiling.
3. **Remaining UI surfaces:** primary navigation, progression and settings need the same
   standard. The live scorecard and final round ledger are now complete.
4. **Production hard-surface club ceiling:** five grades are differentiated and grounded,
   but head proportions, premium dark-material read, bevels and machining still fall
   below the reference. Do not label construction correct merely because tests pass.
5. **Cup finish pass:** improve cut-turf fibers, liner response, and flag relationship
   without enlarging the regulation aperture or changing capture physics.
6. **Production atmosphere asset ceiling:** V2 now carries a truthful composed sky, but
   a future production volumetric or artist-authored pipeline can add parallax and
   physically richer illumination without changing the protected world grade.
7. **Production turf asset ceiling:** V2 now carries truthful readable response, but a
   future production material pipeline can add finer species/season detail and LOD.

## Current Gauntlet target

**THE SEALED SHOT — Step 3 / PURITY closure; stop after publication.**

Steps 1 and 2 are accepted and were not redone. Step 3 is extracted and verified;
Step 4 must not begin in this turn. COURSE HASH STABILITY remains pending on WebKit, Gecko
and physical iOS WebView; these rows are not waived. Governing v1.2 + findings are archived with
digests. Existing math/contact/geometry/assets/stats remain protected. Freeze all
v1 contract fixtures; never regenerate them to hide a regression or silently change
serialization. No visual critic pass was authorized or performed this session.

## Reference comparison

The Main Shot and Live Shot references are explicitly mobile-first: the golfer and ball
remain large enough to read while the route and target stay spatially clear. Integration
026 now carries that hierarchy into putting across portrait and wide-phone views.
The World Style, Main Shot, Live Shot, and zero-brand boards also show a composed coastal
destination: layered cliff geology, coves and shore break, warm directional depth,
designed vegetation ecology, strong clubhouse/lighthouse landmarks, and golf surfaces
embedded into the land. Headland, air, route ecology and Ridge House now provide a
coherent destination, and Integration 027 now gives its maintained cuts an aligned
material/light hierarchy. The Bag and Live Shot boards expose the next foreground gap:
the held club needs the same collectible industrial-design authority as its Workshop
presentation. Integration 028 now carries that industrial-design logic into the held
club, including zero-brand silhouettes, honest construction roles and measured ball /
turf integrity. The Character and zero-brand boards now expose the largest foreground
gap: Integration 029 now gives the close golfer a coherent focused head and ordered
grip, but the Character and Live Shot boards expose the next failure in motion—the
Integration 030 now carries the character through one grounded kinetic chain. Integration
031 now gives the World, Main Shot and Live Shot composition a substantial warm coastal
sky and sculpted cloud hierarchy. Integration 032 resolves the next gameplay-reference
disconnect by making target distance the dominant spatial fact and club range a clearly
labeled equipment fact. The UI board and scorecard screens now expose the next feasible
gap: Integration 033 now resolves that round story into one live/final ledger. The Ball
Topology and Bag references then exposed sparse close geometry and missing physical
inspection; Integration 034 resolves those with the real playable ball. The Bag and
zero-brand Object Test exposed another discrepancy: club hero drawings could not prove
the desirability of actual held models. Integration 035 now inspects those assemblies;
it exposed a center-mounted iron/wedge shaft. Integrations 036–038 repair the heel,
forged back and wedge support. Integration 039 begins restoring the World/Main Shot
reference's course setting with a bounded inland ridgeline. The remaining ground-level
discrepancy is material scale: turf still reads painted and too uniform in real play.

## Experiments attempted

- 042: independent BigInt/Buffer oracle and imul/DataView subject agree; explicit
  regeneration reproduces locked fixtures. Node fresh processes and Chromium reload
  agree on all encoded vectors and course digests. Solver-side parity fixtures retain
  all raw bits. A fixture-authoring Git subprocess buffer limit was raised for the
  existing vendor file; no live code was affected. See finding F-013 for checkout
  line-ending evidence and raw-byte protection boundaries.

- 041: height-driven pitch won apex sky but initially left a tiny trailing ball.
  Actual-displacement carry repaired that lag; camera-side trace culling removed
  an eye-plane streak. Responsive short-landscape distance closed the remaining
  four-pixel ball gap. All old gates and four new flight gates pass.
- 041: a traced monochrome logo was rejected by the user. Replaced with the exact
  official asset; no new logo or derivative image was created.

- Integration 039's first hills reached about 42.5 m and read as a wall behind Ridge
  House. Lower authored masses retained the setting without overwhelming the frame.
  Every shared-edge vertex/color matches the retained field. An initial expression
  syntax error was immediately corrected before browser QA; all final imports pass.
- Integration 038 replaced identical capsule soles with real purpose-specific support.
  The first smooth-edged candidate passed geometry checks but looked padded. Controlled
  machining shoulders and analytic cap normals reduced that defect. Corrected wedge
  ground tests use actual vertices, not impossible transformed-AABB corners. The old
  actual Foundation hover remains documented rather than hidden by a loose box test.
- Integration 037 authored a closed recessed shell instead of a raised back plaque.
  The first Foundation cap shaded like a cushion; planar cap-ring normals won live
  reinspection and now have a geometry-derived regression assertion. Real depth,
  manifold winding and bright-enough restrained body materials passed all grades.
- Integration 036 moved only the heel neck, then connected the fixed head/grip through
  one shared solver. Actual body-triangle intersection and reconstructed cylinder
  stations proved continuity, not metadata claims. Live face and craft views won.
- Integration 035 extracted and fingerprinted all 40 held assemblies unchanged, then
  replaced hero art with real shared geometry. Independent review identified nested
  renderer borrowing; explicit exclusive ownership and close-before-open repair won.
  Fixed short-landscape object space, live category switching and four-angle projection
  checks retained the inspector. Existing actual club defects are now explicit.
- Integration 016 moved cup capture from magnetic behavior to regulation-led,
  pace-sensitive acceptance with hot and edge rejection.
- Integration 018 kept `_tryCup()` untouched and rebuilt only the visible aperture,
  liner, flag relationship, drop, and result camera seam.
- The first ball factory retained the existing playable `ballGroup`, so position,
  spin, compression, terrain contact, flight, camera tracking, and cup logic remained
  unchanged while its internal render object became the authored LOFT topology.
- The close, center, hot, score, and next-hole fixtures prove the cup and ball work as
  gameplay objects rather than decorative duplicates.
- Integration 019 kept `_poses()`, `_puttPose()`, `_poseAt()`, IK lengths, hand/club
  guide, grounding, and the protected `t = .60` impact untouched. Only the visible
  meshes/materials around those landmarks changed.
- The first light-khaki trouser trial was rejected live because it merged with skin
  and exposed knee segmentation. A deeper warm field-stone value retained the design
  hierarchy with better apparel separation.
- Live address/top/impact/finish/putting/result frames show no tube limbs, ball joints,
  floating hands, or fatal/warning logs.
- Integration 020 kept all new geology beyond `z = -294`, marked it non-playable and
  stayed inside 10 draw calls / 20k triangles.
- Integration 021 rejected repeated cards, fog-smear sheets and stone-like sphere
  clouds before retaining four quiet procedural sheets and the farther fog envelope.
- Integration 022 separated inspection from equipment mutation, then proved the live
  HUD and target remain unchanged until the explicit Equip action.
- Integration 023 rejected its first batched material pass because dark instance tint
  multiplied dark vertex color into black blobs. Near-neutral family tint, brighter
  authored values and integrated branch geometry won the second desktop/mobile pass.
- Integration 024 merged same-material architecture families and instanced structural
  cadence, turning a seven-material/fifteen-object hut into a clearer seven-draw
  destination while keeping the full footprint off maintained play.
- Integration 025 retained every animation key while replacing rotational body shells
  with asymmetric apparel profiles and resolving footwear into three honest layers.
- Integration 025's responsive proof isolated portrait putting—not settled full shots—
  as the camera defect. Integration 026 solved it through projection, not guesswork.
- The first portrait shift cleared the viewport but grazed the center map; a smaller
  portrait shift plus an independent wide-phone release won the live comparison.
- Integration 027 rejected its first numerically valid turf candidate because the
  close green still looked smooth; a stronger exact-grade response and two-scale weave
  won the second live comparison.
- A deliberately exaggerated 15% green stripe verified stale browser module caching,
  then was rejected and reduced to a restrained 3.5% nap cue for the retained build.
- Integration 028 traced the tall close-putting block stack to a mislabeled local club
  axis, then replaced it with an explicit face / toe / sole coordinate contract rather
  than hiding the fault with camera placement.
- The first corrected Icon mallet was physically sound but too dark at the low putting
  angle; crown-only detail was insufficient, so the retained head adds honest-metal
  outer wing rails while remaining one restrained dark chassis.
- A measured tangent-plane construction offset created real ball-face clearance without
  moving the analytic club endpoint or lowering the head through the turf.
- Integration 029 rejected a wrist-to-contact palm bridge after measurement proved it
  could collapse to 12 mm or stretch to 74 mm. Fixed 52–64 mm palm volumes at permanent
  55 mm stations retained human scale without moving analytic wrists or the club.
- Live shot, landing and Next Shot transition were completed after Integration 029;
  the normal route remained continuously playable with an empty runtime log.
- Integration 030 measured the old delivery / impact / release velocity resets before
  replacing them with one shape-preserving cubic curve. The retained build holds paired
  seam speeds within 0.03 while leaving the top as the only natural near-stop.
- The old finish raised the complete trail shoe; a shared footwear pivot now pins the
  toe at the grounded root plane and raises only the heel.
- Integration 031 rejected its first larger cloud layout after live review showed four
  sheets merging into one soft ceiling. Smaller authored transforms restored negative
  space, but exposed a row of oval puffs; a single soft-union foundation under each
  crown produced the retained connected silhouettes.
- A real post-atmosphere drag swing completed flight, landing, receipt and Next Shot;
  double-sided single-pass materials kept banks stable as the camera moved through them.
- Integration 032 rejected a map-only distance enlargement because it stayed detached
  from the real landing point. The retained read-only steward derives elevation from the
  protected terrain, projects the actual target and yields to every interactive overlay.
- A first solver pass allowed viewport clamping to move a panel across its anchor while
  retaining the wrong leader direction. Side-valid candidates and no-room rejection now
  make the visible leader geometrically honest at screen edges.
- A real post-steward drag swing proved immediate flight hiding, unchanged landing /
  receipt behavior and fresh target/carry semantics after Next Shot.
- Integration 033 retained completed-only score truth and tested responsive/focus/phase
  behavior. Adversarial replay inspection repaired a real world-cut camera defect while
  keeping ordinary reset damping.
- Integration 034 independently measured deformed Float32 geometry, rejected sparse hero
  and incomplete far candidates, retained indexed detail 47/12/8, repaired normal seams
  and the enlarged signature edge, and deferred hero construction until needed.
- Lateral product lighting replaced washed-out bowls; fixed landscape object space with
  independently scrolling specifications replaced clipped controls. Full experiments
  and before/after scores are in `gauntlet/history/integration_034.md`.

## Rejected approaches

- **Inspector-only club upgrades:** would reintroduce the artwork/gameplay mismatch.
  Change the shared assembly and prove contact/pose integrity instead.
- **Larger flat target disc:** clearer as UI but less believable and still non-spatial.
- **Magnetic catch radius:** breaks golf integrity and existing hot/edge rejection.
- **Pure texture/decal hole:** cannot show wall, depth, occlusion, or believable drop.
- **Detached orange bead:** reads as a floating marker rather than one industrial-
  design signature dimple.
- **Ball texture pretending to be topology:** cannot pass the silhouette, lighting, or
  close inspection tests and introduces seams/pole distortion.
- **Replacing the proven rig with unverified animation:** risks contact timing and is
  not required to improve the visible golfer surface in this pass.
- **Light khaki at current exposure:** merged with the warm skin and recreated a
  mannequin-hinge read; the deeper field-stone trouser was retained.
- **More evenly scattered trees and rocks:** increases object count without creating
  believable ecology or coastal composition.
- **Changing terrain height for visual drama:** would invalidate the shared rendered /
  physical contract; the next world pass must work around the protected land field.
- **Extra turf overlay mesh or fourth detail texture:** adds cost and reopens visual /
  contact disagreement when aligned light plus existing maps solve the current gap.
- **Individual putting-green blade cards:** become black speckle and false-break noise
  at actual phone distance.
- **Richer borders around the old 4 × 2 Bag grid:** decoration could not repair the
  missing product hierarchy.
- **Recolor-only club rarity:** fails the zero-brand object and ownership tests.
- **Tier-driven performance claims:** rejected because no such physics progression is
  implemented yet.
- **First Icon putter drawing:** rejected because its paired arcs read as eyewear;
  replaced with a face bar, rear wings, open channel and alignment bridge.
- **Dark-on-dark batched understory:** technically correct instancing still failed the
  live image; retained tints preserve heath/gorse/evergreen value separation.
- **New ecology over old scatter:** rejected because it preserved the performance and
  visual problem; the old tree, field-grass and one-off shore-rock loops were removed.
- **Polishing the upright putter stack:** rejected because its heel-to-toe dimension was
  physically vertical; the coordinate error had to be removed before styling.
- **Moving the protected club endpoint to create clearance:** rejected because it would
  change shaft length, swing presentation and contact landmarks; only render construction
  moves within the fixed head frame.
- **Glow, rarity shells or orange ferrules:** rejected because signal color cannot replace
  product construction and LOFT permits one purposeful premium signal part.
- **Decorating the old head sphere:** rejected because added features could not repair
  the primitive silhouette; one continuous craniofacial shell was required.
- **Endpoint-sized palms:** rejected because changing length between poses recreated the
  random-resizing defect the character pass was required to eliminate.
- **Per-segment easing replacement:** rejected because independently resetting any ease
  function still breaks velocity at its boundary; the full pose track needs shared tangents.
- **Preserving contradictory hip yaw as a sacred pose:** rejected because visual pose
  defects may change when club/hand impact, timing and gameplay stay protected.
- **Larger overlapping cloud sheets:** rejected because four assets merged into one
  gray ceiling and erased the open coastal sky.
- **Hard-max cloud lobes:** rejected because technically distinct shapes still read as
  a synthetic row of oval puffs at real gameplay distance.
- **Front-side-only or default double-sided clouds:** rejected because one can pop from
  flight cameras and the other silently doubles the render pass count; double-sided
  forced-single-pass presentation satisfies both view and performance integrity.
- **Bigger map distance as the shot hierarchy:** rejected because it remains screen-
  anchored and does not identify the real landing surface or elevation.
- **Persistent center target card:** rejected because it competes with the golfer and
  ball; the retained instrument follows the target and hides whenever the screen cannot
  support an honest unobstructed placement.
- **Overlay-owned target or input state:** rejected because a presentation system must
  not mutate the proven map, canvas, swing, physics or round contracts.
- **Separate beautiful menu ball:** hides playable-object weaknesses. The inspector
  shares the real ball factory, material and buffers instead.
- **Trusting topology metadata:** actual surface measurements caught a missing far
  dimple and overstated hero coverage; tests now count deformed geometric samples.
- **Eager hero detail at tee startup:** unnecessary inspection cost; lazy realization
  constructs the cached high-detail surface only when a camera needs it.

## Next action

**STOP after Step 3 closure publication.** Next authorized work in a later turn:
**Step 4 — EXTRACTION PARITY through the frozen parity projection.** Read archived
v1.2, F-001–F-007 and local F-008–F-016 first. Keep the live wall-clock behavior;
no seed before Step 5. Do not change the projection or invent a tolerance. Step 3
raw output is not authoritative quantization or a ShotRecord lifecycle. Do not
mislabel existing Step 2 comparisons as the completed Step 4 gate.

Normal preview: `http://127.0.0.1:43117/prototype1/`, hidden Node
`gauntlet/serve.mjs 43117`. If absent, restart only this LOFT-local server. Current
entry is `game.js?v=041-flight`. Normal route has no automated fixture/freeze.
Physical iPhone testing remains pending; use README's same-Wi-Fi instructions.
No Pages authorization was granted; do not attempt a hosting workaround.
