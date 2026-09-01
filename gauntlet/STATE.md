# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 016
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: LOFT Terrain System V1 — shared render/contact field, course cuts, coastal world
Iteration: integration_016

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
