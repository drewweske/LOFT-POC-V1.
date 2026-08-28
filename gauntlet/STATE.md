# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 004
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: Real-device integrated validation
Iteration: integration_004

## Current provisional score
92 / 100 — NOT GRADUATED

This candidate is materially ahead of Integration 003 at source/architecture level, but final graduation is still blocked on the newly rendered iPhone artifact.

## Integration 004 wins

### Camera intelligence
- explicit AIM / SWING_LOCK / FLIGHT / RESULT state machine
- heading/camera/character transform bug fixed
- camera remains in a stable trailing golf composition during aim
- horizontal drag defines heading
- vertical drag adjusts pitch
- pinch adjusts aim distance
- swing input locks camera to ball/golfer relationship
- no user camera transforms during swing or flight
- automatic flight camera follows ball direction with capped yaw response
- result camera returns semi-free lie inspection
- state-specific FOV, damping and distance clamps
- ground/floor protection
- stable world-up horizon
- full-club finish framing checked before handoff

### Critical transform fix
The rig's authored shot direction is local -Z.
Gameplay heading uses positive yaw toward +X.
The previous implementation rotated the golfer by +aimYaw, mirroring golfer orientation relative to the target/camera.

Integration 004 now uses:
rigYaw = -aimYaw

The address ball offset uses the same rigYaw.

This removes the front-on / mirrored camera-angle pathology visible in Integration 003 screenshots.

### Character
- spherical toy torso replaced by tapered authored LatheGeometry volumes
- pelvis, torso, chest and waist now taper like clothing/body masses
- tapered limbs
- knee/elbow joint caps
- capsule shoes
- smaller hands
- reduced head/jaw/nose
- controlled micro facial features
- proper low-profile golf cap instead of beret-like cap
- smaller clubheads
- quiet collar
- micro Flag Orange signal only

### Brand lock
- Clubhouse Ink #0B0D0D
- Scorecard Cream #F2EFE8
- Fairway Stone #B8B1A6
- Flag Orange #FF6A2A
- glass/backdrop-filter styling removed
- primary UI surfaces are solid Ink/Cream
- course map uses Cream/Stone/Ink identity language
- world greens remain in the game world, not core UI identity
- no logo geometry changes
- interaction copy tightened
- HUD/map nearly disappear during The Stroke

### Technical validation
- all custom JS modules parse successfully
- CSS braces balanced
- zero stale Camera 003 API references
- no backdrop-filter/glass styling remains

## Graduated systems
None at final 94/100 integrated graduation level yet.

## Largest meaningful gap
Real-device evidence for Integration 004.

## Next critic fixture
1. default address screenshot
2. aim 45° left
3. aim 45° right
4. Level 1 top-of-backswing
5. Level 50 top-of-backswing
6. Level 1 finish
7. Level 50 finish
8. ball flight
9. result camera
10. topographic map / HUD hierarchy

## Critical failures that still automatically fail the build
- golfer flips to face camera while merely aiming
- golfer/ball relationship shifts as heading rotates
- swing camera clips head, feet or club
- camera accepts orbit input during The Stroke
- flight camera corkscrews from spin/bounce
- result camera creates empty-ground framing
- character still reads as a primitive toy/mannequin
- cap reads like a beret
- any limb detaches/disappears
- UI drifts outside official Ink/Cream/Stone/Orange brand system
- mobile Safari interaction breaks
