# Integration 030 — Swing Kinetic Chain V1

## Outcome

The full swing no longer eases to an artificial stop at every internal pose and
lunges into the next one. One shape-preserving tangent-continuous curve now carries
the club, hands and body through a pelvis-led downswing, chest release and toe-planted
finish while the trusted player gesture and ball launch remain untouched.

## Definition of great

- address, top, impact and finish remain deliberate authored checkpoints
- the top owns the one natural change-of-direction pause
- delivery, impact and release retain continuous club momentum
- pelvis begins opening while shoulders retain lag, then shoulders overtake after impact
- weight finishes over the lead side while the trail heel rises around a planted toe
- the putter retains its compact independent pendulum
- impact remains exactly `t = .60`; ball, scoring and round systems do not know this
  visual integration exists

## Built

- frozen `LOFT_KINETIC_CHAIN_V1` timing, sequencing, grounding and protection contract
- non-uniform PCHIP / cubic-Hermite sampling through all seven trusted swing checkpoints
- zero-tangent component reversals at true extrema without zeroing unrelated momentum
- C1 skill-signature tracks replacing triangular sway / delivery / finish cusps while
  retaining their exact values at every authored checkpoint
- smooth quality-dependent finish correction with no release-seam discontinuity
- measured pelvis / shoulder yaw sequence: coil, pelvis-led delivery, impact lag,
  release crossover and fully released finish
- one footwear pivot that keeps the analytic ankle and leg IK unchanged while pinning
  the visual trail toe to the grounded root plane
- a 30th executable Visual Gauntlet gate covering protected checkpoints, seam velocity,
  club momentum, body-width invariance, kinetic ordering, trail-foot contact and putter
  isolation

## Protected contracts

- exact address / top / impact / finish club and hand checkpoints
- exact `t = .60` impact and launch handoff
- club length, grip order, IK segment lengths and equipment construction
- current pointer gesture, load, tempo, path, power and quality calculations
- putter pose function and pace interaction
- ball launch, flight, terrain, cup, scoring, map, camera, result and round behavior
- no drawable, dependency, service or unrelated repository was added

## Before / after

Before: the club speed immediately across the delivery, impact and release seams jumped
from approximately `0.080 → 18.687`, `0.090 → 21.392`, and `0.090 → 19.412` units per
normalized swing phase. The pelvis stayed in its backswing direction through impact and
finished near `-38°` while shoulders finished near `+39°`, producing a robotic opposite-
direction corkscrew. The complete trail shoe floated roughly 51–91 mm above its local
ground plane.

After: left / right seam speeds are `8.359 / 8.382` at delivery, `3.764 / 3.771` at
impact and `5.513 / 5.515` at release for the reference swing. Pelvis / shoulders move
from `+8° / -18°` in delivery to `+34° / +10°` at impact, then `+68° / +91°` at finish.
The trail toe stays at the grounded `-16 mm` local plane while the heel rises 78 mm.

## Rejected

- another per-segment ease curve: changing easing names cannot provide derivative
  continuity when each segment resets its velocity independently
- smoothing only the club: hands, head and body would still visibly hitch around it
- preserving the broken hip / shoulder render orientation because it was an old pose:
  gameplay invariants are protected; demonstrably bad visual biomechanics are not
- moving impact time or ball launch to match the new render curve: the animation must
  serve trusted golf, not rewrite it
- raising and rotating the entire trail shoe: this was the source of the floating toe
- adding mocap files or a new animation dependency: unnecessary for this bounded POC
  correction and incompatible with the current code-native rig

## Verification

- Visual Gauntlet: 30 / 30 PASS
- Terrain Gauntlet: 14 / 14 PASS
- changed JavaScript syntax: PASS
- protected Level 75 iron club / hand checkpoints match the prior build within 20 nm
- every sampled seam across Levels 1, 50 and 75 stays below `0.055` velocity-vector
  discontinuity; delivery / impact / release retain more than `2.5` speed units
- trail toe remains within 4 mm of the grounded plane throughout release
- live top, impact and finish fixtures inspected with the player-facing camera reset
- one real drag swing completed launch, flight, landing, receipt and Next Shot flow

## Honest result

The swing is materially more fluid and biomechanically legible without compromising
the playable golf loop. It remains a procedural seven-checkpoint animation rather than
the eventual production skinned rig and bespoke motion-capture / hand-authored clip set.

## Next

Coastal Atmosphere & Time-of-Day V2: replace the flat gray upper frame with a readable
blue-to-warm sky hierarchy and sculpted deterministic cloud banks that explain the
existing warm key light. Terrain/contact, light direction, exposure, fog depth, water,
ecology, landmarks, camera and gameplay remain protected.
