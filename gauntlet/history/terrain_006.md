# Terrain 006 — LOFT Terrain System V1

Status:
BUILT — automated and stable mobile Gauntlet candidate.

## Mission

Move Coastal Ridge beyond a dark low-poly proof of concept without replacing the golf game around it.

The course must explain every bounce, break, check, roll, lie and hazard through the land the player can actually see.

## Root causes removed

1. Course albedo was authored through linear `THREE.Color` values and then tagged as sRGB. That double encoding crushed turf separation into near-black olive.
2. Physics sampled triangle height but still derived its own finite-difference normal, allowing a visible fall line and physical fall line to disagree.
3. Sphere contact used vertical radius only, allowing a ball to appear buried on readable side slopes.
4. Grounded lateral segments entering uphill terrain could miss `t = 0` because the crossing loop required a positive starting clearance.
5. The lazy Float32 height cache returned a double on first access and a rounded value later, creating order-dependent contact drift.
6. First cut existed as a visual suggestion but not as a full physical lie.
7. Water, foam and terrain classification used related but different shoreline assumptions.
8. Per-vertex random rock deformation tore duplicated icosahedron vertices and exposed bright seams.

## Built system

- single dense continuous terrain mesh
- triangle-exact rendered / physical height
- shared barycentric rendered / physical normal
- normal-aware golf-ball contact height
- exact segment sweep across grid and triangle boundaries
- order-invariant height cache
- fairway, first cut, rough, fringe, green, tee, sand and water identities
- distinct first-cut physics and feedback
- shared water level and coastline predicate
- regulation-led, pace-sensitive cup capture
- authored ridge, shelf, saddle, crest, hollow, crossfall, swale, approach and collection forms
- authored green planes, crowns and collection shoulders
- course-space sRGB albedo, roughness, micro bump and baked grade relief
- organic surface masks and maintained-cut hierarchy
- dimensional rough, lie-aware near-ball turf and bunker-lip grass
- smoother windswept pines, organic shrubs and coherent coastal rock strata
- moving cloud banks, ocean bump, shoreline foam, restrained vegetation and flag motion
- grazing warm key, cool fill and reduced ambient wash

## Gauntlet result

PASS — 13 / 13 automated terrain checks.

The suite covers repository isolation, field health, randomized shared samples, all course identities, surface coefficients, exact terrain sweep, grounded launch, first bounce, first-cut transition, fixed-step determinism, water, cup and critical gameplay DOM contracts.

The exact-ground regression includes 12,000 deterministic lateral segments. Every qualifying uphill case resolves at `t = 0`; short upward departures remain collision-free.

The independent final critic gate added:

- 25,000 randomized swept segments / 8,710 crossings with zero missed, late or invalid hits
- 12,000 seam probes continuous to approximately 1.5e-7 m
- 160 randomized full shots identical at 30 and 120 Hz
- zero penetration, recovery, non-finite or unfinished shot states

## Mobile evidence

- 390 × 844 stable portrait: clean load, map, bag, stroke, result and terrain contact
- 430 × 932 stable portrait: correct compact and expanded map across repeated reloads
- 844 × 390 landscape: maintained-cut hierarchy, cross-course slope, bluff vegetation and ocean layer visible through the playable camera orbit
- no console warning / error and no fatal overlay in the stable runs

## Preservation check

Preserved:

- The Line
- The Stroke
- address / swing / flight / result camera modes
- golfer and club flow
- ball flight
- cup and putting
- equipment and lie selection
- scoring and round progression
- precision map
- one-more-round loop

No backend service, unrelated repository or external project was introduced.
