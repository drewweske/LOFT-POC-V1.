# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 013
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: terrain contact fidelity + cup visibility + camera clipping
Iteration: integration_013

## Integration 012 device verdict

CLEAR IMPROVEMENT / NOT YET FINAL.

Confirmed improvements:
- turf lighting and landform readability improved
- course grass began reading as an actual authored golf surface
- prior near-black terrain failure did not return
- slope perception improved enough to expose remaining geometry/contact issues

Remaining device failures:
- ball could still visually penetrate terrain at some surface boundaries
- result / tap-in views could still pass too close to the golfer rig
- golfer feet could intersect sloped ground because the rig used one root-height sample
- the physical cup opening could disappear into the green
- gameplay controls could ghost underneath the result card
- visible surface overlays and physics contact height were not yet one unified contract

## Integration 013 rebuild

### 1. One visual/physical terrain contract

Playable cut layers now have explicit render lifts:
- rough
- first cut
- fairway
- tee
- fringe
- green
- sand

The same lifts are now consumed by playingHeight(), which feeds physics and ball placement.

This removes a class of bugs where:
the renderer showed one surface height while collision / rolling used a slightly lower one.

### 2. Deterministic ball ground clearance

Physics now exports one BALL_CONTACT_HEIGHT.

The gameplay renderer uses the same value for:
- tee placement
- post-shot placement
- putting
- roll contact
- pace ghost placement

A final visual safety clamp prevents a rolling ball center from ever rendering below the visible playable surface.

This is intentionally millimeter-scale. The ball should look seated on turf, not floating.

### 3. Cup rebuilt as a dedicated render object

The old cup was one nearly coplanar black circle.

On a mobile depth buffer it could disappear into the green.

Integration 013 introduces LOFT_CUP:
- dedicated black opening
- restrained physical liner/rim
- raised deterministic render layer
- aggressive local polygon offset
- independent render order
- remains visible while the flagstick fades for putting

Cup capture remains controlled by the physics solver.

The visual cup cannot disappear merely because green geometry wins a depth test.

### 4. Golfer stance grounding

The golfer previously inherited the ball's single terrain height.

On meaningful slope, one side of the stance could therefore penetrate the ground.

Integration 013 samples:
- rig center
- left stance contact
- right stance contact

The root is conservatively raised to the highest local stance surface.

This is a pre-IK grounding pass designed specifically to eliminate visible lower-body terrain penetration before a later final character rig system.

### 5. Near-cup camera collision avoidance

A key sign error was identified:
the old positive camera-side offset moved toward the golfer in the authored address coordinate system.

Near-cup aim, swing, and result cameras now:
- move to the opposite side of the golfer
- pull farther back
- rise more aggressively
- widen FOV slightly
- preserve the ball-to-cup read axis

This targets the giant-arm / club / torso framing seen at 1–2 FT.

### 6. Result-state HUD ownership

When a shot result is shown:
- club chip hides
- level/camera controls hide
- tip hides
- swing meter hides

The score/result card now owns the bottom viewport instead of stacking over active gameplay controls.

## Current status

TECHNICAL PASS.
REAL-DEVICE VALIDATION REQUIRED.

## Next device fixtures

V01 — 20–35 FT green putt
V02 — 1 FT tap-in address
V03 — 1 FT tap-in result
V04 — fairway/rough boundary roll
V05 — fringe/green boundary roll
V06 — ball resting on pronounced side slope
V07 — golfer stance on pronounced side slope
V08 — cup visible with flagstick faded
V09 — cup visible after shot result
V10 — result card with no underlying HUD controls

## Critical pass conditions

- ball never visibly penetrates green, fringe, fairway, rough or sand
- cup opening never disappears
- no result-state HUD overlap
- no camera passes through golfer during tap-in
- no golfer foot is visibly buried in the terrain
- visible surface boundary and collision boundary agree
- ball remains settled unless actual slope overcomes turf resistance
