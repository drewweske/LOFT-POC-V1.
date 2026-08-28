# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 003
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: Real-device integrated validation
Iteration: integration_003

## Current provisional score
89 / 100 — NOT GRADUATED

The score increased because the user-provided iPhone evidence exposed structural camera/UI/character problems and those systems were rebuilt rather than patched cosmetically. Final scoring remains blocked on the newly rendered device artifact.

## Real-device failures from previous candidate
- swing camera cropped the golfer
- camera behaved independently of aim
- post-shot camera created giant empty-ground compositions
- golfer remained too round / toy-like
- driver head was oversized
- visible vertical swing bar violated The Stroke philosophy
- center duel pill competed with the shot
- fairway still read too flat / generic

## Current integrated response
### Camera / Aim
- ready-state horizontal camera drag now IS shot heading
- aim heading is damped rather than jittering directly
- golfer rotates around the fixed ball as aim changes
- camera pitch remains semi-free
- pinch zoom remains available
- starting The Stroke blends into a ball-locked composition
- camera input is ignored while swinging
- impact transitions to flight camera
- post-shot camera focuses the lie
- reset restores the pin line

### The Line
- orange landing mark adjusts distance along the selected heading
- heading comes from camera, not duplicate left/right controls
- stable allocation-free line geometry

### Topographic Map
- 2D overhead Coastal Ridge course map at top center
- contours
- fairway
- green
- bunkers
- water
- pin
- player marker
- target marker
- aim line
- target distance
- lie
- duel state demoted to map footer

### Character / Swing
- slimmer torso / pelvis hierarchy
- reduced driver / wood head scale
- dark premium wood finish
- stronger Level 1 posture/form defects
- more obvious Level 50 mastery contrast
- paired-hand grip and club constraint retained

### World
- curved variable-width fairway
- broad approach ridge
- mid-course landform
- lodge / lighthouse relationship improved
- coastal identity retained

### UI
- visible swing meter removed
- secondary HUD fades during the stroke
- hole / wind chrome reduced
- result-tip redundancy removed

### Performance
- The Line no longer allocates geometry while aiming
- map DOM updates throttled
- FOV matrix work reduced
- body rig remains transform-driven

## Portrait framing evidence
430×932 model projection:

Address
- ball ≈ (0.42, -0.32) NDC
- head ≈ (-0.14, 0.29)
- feet ≈ (-0.18, -0.34)

Swing lock
- ball ≈ (0.52, -0.34)
- head ≈ (-0.19, 0.46)
- feet ≈ (-0.24, -0.39)

All critical landmarks remain inside frame with meaningful margin.

## Graduated systems
None at final 94/100 graduation level yet.

## Largest meaningful gap
Real-device validation of Integration 002.

## Next critic fixture
1. address screenshot
2. rotate camera left/right and confirm golfer + Line follow
3. alter distance using orange landing mark
4. Level 1 full swing
5. Level 50 full swing
6. bag interaction
7. ball flight
8. result camera
9. topographic map hierarchy

## Boundary
Source inspection and mathematical projection cannot certify physical iPhone touch feel, rendering, browser chrome interaction or frame rate. The next Gauntlet judgment must use the newly rendered iPhone build.


## Integration 003 delta
- portrait camera framing was mathematically calibrated after Camera 002 failed projection
- camera horizontal drag now defines heading and character address
- address geometry stays pinned to the ball during rotation
- swing camera is state-locked to ball
- topographic map is live
- visible power meter is gone
- golfer proportions and equipment scale refined
- Level 1 vs Level 50 form divergence increased
- course silhouette and elevation strengthened
- repeated pointer-frame allocations reduced

The score is capped below graduation until real-device evidence is received.
