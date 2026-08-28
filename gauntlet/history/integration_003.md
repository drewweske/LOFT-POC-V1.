# Integration 003

Status: BUILT — next real-device candidate.

This iteration responds directly to the user's Integration 001 iPhone evidence.

## Camera intelligence
- ready-state horizontal camera motion defines shot heading
- heading is damped for deliberate rather than twitchy aim
- character rotates and relocates around the fixed ball as heading changes
- vertical drag controls pitch
- pinch controls camera distance
- The Line handle now adjusts distance, not duplicate heading
- entering The Stroke triggers a dedicated ball-lock camera
- swing camera ignores camera gestures until impact
- contextual FOV: address 40°, swing 38°, flight 43°, result 40°
- post-shot camera is local lie inspection rather than an empty-ground overview

## Portrait framing test
430×932 mathematical projection:

Address:
ball (0.42,-0.32)
head (-0.14,0.29)
feet (-0.18,-0.34)

Swing:
ball (0.52,-0.34)
head (-0.19,0.46)
feet (-0.24,-0.39)

All are NDC and inside the viewport with margin.

## LOFT map
Added top-center 2D topographic Coastal Ridge map:
- contour lines
- fairway
- green
- water
- bunkers
- pin
- player
- target
- aim vector
- target distance
- lie
- compact duel state

## Visual cleanup
- visible vertical swing meter removed
- HUD fades during The Stroke
- result instruction redundancy removed
- hole/wind chrome reduced
- result card reduced
- character body mass reduced
- wood/driver heads reduced and darkened
- fairway replaced by variable-width authored strip
- Coastal Ridge approach now rises toward the green

## Performance
- The Line uses a stable line buffer
- no geometry allocation on every aim update
- no per-frame line bounding-sphere calculation
- map updates are throttled
- camera projection matrix updates only when FOV changes

## Provisional verdict
WIN versus Integration 001 architecture and framing.

Not graduated until the candidate is rendered and touched on the user's iPhone.

Largest meaningful gap:
real-device motion/touch evidence.
