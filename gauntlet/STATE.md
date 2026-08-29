# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 011
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: terrain integrity + world rendering
Iteration: integration_011

## Previous round

Integration 010: LOSS — CRITICAL VISUAL / RUNTIME FAILURE.

Real-device evidence showed:
- terrain rendered near-black
- intended elevation existed physically but was visually unreadable
- visible/physical terrain diverged around green / fringe
- billboard grass rendered as large rectangular artifacts
- character framing could leave the golfer partly off screen
- a ball could enter an invalid terrain state and leave the shot soft-locked
- shadow / overlay banding damaged course readability

Largest meaningful gap:
THE PLAYABLE HEIGHTFIELD WAS NOT BEING PRESENTED AS A TRUSTWORTHY VISIBLE SURFACE.

Why it matters:
LOFT depends on the player reading slope, lie, elevation and landing geometry instantly. Invisible hills or a ball disappearing beneath terrain is a critical failure.

## Integration 011 rebuild

### 1. Terrain colour / material failure fixed

Root cause:
The canvas turf textures already contained the intended surface colour, but the MeshStandardMaterial was also using the same coloured base. Three.js multiplied them together, pushing dark greens toward near-black.

Fix:
Textured turf / sand materials now use white material albedo and let the texture own the final surface colour.

Result target:
Readable coastal greens in daylight with preserved material contrast.

### 2. Terrain architecture rewritten

The terrain function now uses broad golf-scale landforms rather than micro-noise:
- progressive 3.4 m course climb
- authored middle shelf
- ridge shelf
- lighthouse shelf
- two broad saddles
- gentle crossfall
- low-frequency roll only
- real coastal falloff

No procedural high-frequency divots are allowed in the playable heightfield.

### 3. Coastline made real

The terrain now physically falls beneath the ocean beyond the coastal edge instead of continuing as hidden land underneath the water plane.

The playable water boundary stops the ball before invalid terrain travel.

### 4. Visual / physics surface lock

Green and fringe now use the same authored surface function in:
- rendering
- ball physics
- camera ground protection
- target placement
- The Line

Visible footprints were aligned:
- green = 24.4 m × 18.0 m authored ellipse
- fringe = 27.0 m × 20.4 m authored ellipse

This removes invisible green/fringe height changes.

### 5. Broken grass cards removed

The large rectangular billboard blades visible on iPhone are retired.

New near-lie turf uses restrained tapered 3-sided volumetric blades only in a small radius around the current ball:
- green: extremely tight
- tee/fairway: short
- fringe: medium
- rough: tall
- sand/water: none

No giant planar grass cards remain.

### 6. Bunker / terrain relationship preserved

Bunkers remain actual depressions in the master heightfield, with:
- irregular sand floor
- visible transition lip
- lowered floor
- surface-specific physics

### 7. Physics soft-lock protection

The deterministic ball solver now includes:
- non-finite numeric guard
- heightfield validity guard
- below-terrain penetration resolution
- playable-world boundary recovery
- 26-second absolute shot watchdog
- rolling-water stop
- last-safe-position recovery
- automatic physics deactivation on settled balls

A bad shot may produce a bad golf result.
It may not freeze LOFT.

### 8. Camera terrain lock

The camera now protects itself against the same PLAYABLE surface used by the ball, including green and fringe.

Aim framing was widened and shifted toward the golfer so the body remains in frame without sacrificing the ball-to-target axis.

### 9. Shadow field repaired

Directional-light target and shadow frustum are centered on Coastal Ridge.
Normal bias is increased to reduce terrain striping / self-shadow acne.

### 10. Character continuity fix

The procedural shirt mesh is now capped at neck and waist.
Large spherical shoulder seals were reduced / tucked inside the sleeve connection.
This targets the disconnected-body silhouette visible in Integration 010.

## Runtime health

A terrain validator now samples the heightfield before play.
If a non-finite height or grade is found, LOFT fails fast instead of starting a corrupted round.

## Current status

TECHNICAL PASS.
REAL-DEVICE VISUAL VALIDATION REQUIRED.

No graduation score is assigned until Integration 011 is played on iPhone.

## Next A/B fixtures

A01 — tee address
A02 — fairway lie
A03 — rough lie
A04 — bunker floor and lip
A05 — green / fringe transition
A06 — side view showing elevation
A07 — coastline / lighthouse
M01 — full shot landing on slope
M02 — putt across green grade
M03 — intentionally wild shot toward course boundary
M04 — swing top / impact / finish

## Critical pass conditions

- no near-black terrain
- no rectangular grass artifacts
- no invisible hills
- no ball below visible terrain
- no terrain soft-lock
- no full-width black geometry bands
- green / fringe ball height matches visible surface
- elevation reads visually before the ball reveals it
- golfer remains compositionally readable
