# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 014
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: LOFT Field V2 — unified terrain, course ecology, swept collision
Iteration: integration_014

## Device verdict entering 014

Integration 013 fixed the cup and reduced several clipping regressions, but the course itself was still visually early-prototype:
- geometric / low-poly landform language
- stacked surface meshes and visible cut boundaries
- terrain that could still disagree with ball contact
- sparse environmental detail
- stylized placeholder rocks / trees
- insufficient material differentiation
- occasional fast-ball penetration at rising terrain
- physical terrain that was more complex than the player could visually read

The new requirement is not another cosmetic pass.
The world renderer and terrain physics must become the same authored field.

## Integration 014 — LOFT Field V2

### 1. Unified terrain architecture

A new /prototype1/worldV2.js system replaces the layered-course approach.

The entire playable course is now one continuous, dense 3D terrain mesh.

There are no longer independent coplanar:
- rough planes
- fairway ribbons
- green planes
- fringe planes
- bunker floors

The same terrainHeight(x,z) function now drives:
- every visible terrain vertex
- ball collision
- rolling slope
- ready-ball placement
- golfer grounding
- camera floor safety
- cup placement

This removes the most important structural source of ball/terrain clipping.

### 2. Natural golf-scale landforms

The terrain field now combines:
- broad strategic climb
- ridge systems
- middle shelves
- lighthouse shelf
- two saddles
- coastal crossfall
- restrained low-frequency earth variation
- shaped tee pads
- shaped greens
- actual bunker depressions
- a continuous coastal bluff transition

Physical detail is intentionally low-frequency.
No invisible micro-noise is allowed to alter ball roll.

If the ball reacts to a slope, the player should be able to see that slope.

### 3. Organic course-surface language

Surface identity is painted into the unified mesh rather than stacked above it.

The terrain color field now blends:
- rough
- first-cut transition
- fairway
- fairway mowing variation
- fringe
- green mowing variation
- tee cuts
- sand

Slope-facing and broad earth variation are also encoded into the color field so grade can be read visually before a shot.

### 4. Bunkers are now actual terrain

Each bunker is carved into the physical height field.

The sand surface and ball collision are therefore the same geometry.

Bunkers now include:
- bowl depth
- irregular elliptical shaping
- restrained raised lip
- sand-specific visual color field
- realistic physical resistance through the existing surface solver

There is no hidden depressed collision floor beneath a flat visual plane.

### 5. Denser world detail

The Coastal Ridge environment now includes:
- higher-detail organically distorted rocks
- layered coastal bluff rock clusters
- six-tier procedural conifers
- expanded shrub ecology
- 1,800-instance rough / dune grass field
- up to 900 high-density near-ball grass instances
- cut-specific near-lie grass height
- refined clubhouse
- higher-resolution lighthouse
- animated ocean micro-bump

The target remains LOFT's visual ratio:
stylized authorship with physically believable terrain and materials.

### 6. Ball physics — swept terrain contact

The fixed solver remains 120 Hz.

Integration 014 adds swept height-field collision for airborne balls.

When a fast ball crosses from above the terrain to below it inside one physics step:
- the travelled segment is binary searched
- the exact terrain crossing is found
- contact is resolved at that point
- bounce then uses the real local surface normal

This specifically prevents a fast iron / driver from tunneling through a rising bank.

### 7. Regulation geometry

Physics now uses regulation golf dimensions for the destination relationship:
- regulation ball physical radius
- regulation cup radius
- near-regulation capture radius

The rendered ball remains slightly enlarged for mobile readability, but its visual radius has been reduced substantially from the earlier oversized prototype.

### 8. Real ball rotation

The visible LOFT ball no longer spins by an arbitrary tiny multiplier.

In flight:
- aerodynamic spin axis / angular velocity drive rotation.

On the ground:
- roll angle is derived from travel speed / ball radius.

This makes the ball itself behave visually like a physical object.

### 9. Speed-sensitive turf resistance

Rolling resistance now combines:
- low-speed rolling resistance
- speed-squared turf deformation / grass drag

This allows:
- controllable putting pace
- believable fairway release
- stronger rough bite
- decisive bunker slowdown

without returning to the earlier ice-rink sliding problem.

## Numerical terrain validation

LOFT Field V2 validation:
- finite height field: PASS
- finite gradients: PASS
- sampled min elevation: approximately -5.70 m
- sampled max elevation: approximately 6.62 m
- maximum sampled grade: approximately 0.73
- terrain system: LOFT_FIELD_V2

Representative probes:
- Tee 01: tee
- Ridge green: green
- Shelf green: green
- Lighthouse green: green
- bunker center: sand
- central corridor: fairway
- coastline: water

## Critical device fixtures

V01 — long iron into rising fairway bank
V02 — ball landing exactly on fairway / rough transition
V03 — ball rolling across fringe / green
V04 — bunker entry and stop
V05 — bunker escape
V06 — 30–40 FT putt across visible grade
V07 — ball resting on side slope
V08 — camera close-up of turf under ball
V09 — coastline / bluff view
V10 — long drive with flight-follow camera
V11 — cup / green relationship at 1–3 FT
V12 — three-hole complete round without terrain penetration

## Hard pass conditions

- no visible ball-through-terrain event
- no hidden slope that materially moves the ball
- no coplanar fairway/green/sand z-fighting
- bunker visual floor and physical floor agree
- green contour is readable before the putt
- terrain silhouettes are smooth at normal play distance
- rough has true dimensional grass near the ball
- environmental geometry reads as authored LOFT rather than primitive placeholders
- a full three-hole round can be completed without terrain soft-lock
