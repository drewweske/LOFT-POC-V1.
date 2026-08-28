# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 009
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: camera / precision aiming / topographic map
Iteration: integration_009

## Current provisional score
96 / 100 — REAL-DEVICE VALIDATION REQUIRED

Integration 009 was triggered by successful completion of all three demo holes plus a final control/readability issue:

User evidence:
- the three-hole demo is now fully playable end-to-end
- THE SIGNAL / putting loop is materially improved
- putting camera still returns to an angled composition that makes precise aiming harder
- camera should remain straightforward, fluid and easy to trust
- topographic map is useful but too small
- map should expand for deliberate precision aiming on both long drives and short putts

## Camera rebuild

### Putting camera rule
Putting now obeys one hard rule:

CAMERA AXIS = INTENDED ROLL AXIS.

At address:
- camera sits almost directly behind the ball
- lateral cinematic offset is nearly removed
- look direction follows The Line
- camera is lower and quieter than the full-swing camera

During the putting stroke:
- entering swing-lock does NOT rotate to a new side angle
- camera remains on the same ball-to-target axis
- motion damping is slightly slower / smoother than full swing

During roll:
- lateral tracking offset is reduced almost to zero
- camera follows the ball down its roll axis

Goal:
Straight on screen must mean straight in simulation.

### Precision orbit
When putting:
- horizontal camera/aim sensitivity is reduced
- vertical pitch sensitivity is reduced
- allowed aim arc is slightly widened but remains bounded

The result should be finer thumb control without twitching.

## Precision Topographic Map

The compact topographic map is now slightly larger by default.

The entire map card is tappable.

Tap:
- expands into a focused large-format course instrument
- dims the rest of the interface
- preserves official LOFT Cream / Ink / Stone / Orange visual language

Expanded map:
- can be dragged directly to aim
- map coordinates are reversibly projected back into the actual 3D world
- dragging changes BOTH shot direction and target distance
- putting reports target distance in FT
- normal shots report target distance in YD
- the map target and The Line remain synchronized

This is not a decorative minimap anymore.

It is a second precision aiming surface.

### Interaction model

COMPACT MAP
tap → expand

EXPANDED MAP
drag anywhere on course → move target / aim
× → close

After closing:
- camera smoothly resolves to the newly selected target
- golfer / The Line rotate to the same shot intention

The player can therefore:
- roughly aim by moving the 3D camera
- precisely aim by expanding the topographic map
- return immediately to THE SIGNAL for the stroke

## Technical validation

PASS:
- game.js
- camera.js
- topoMap.js
- physics.js
- feedback.js
- world.js
- surfaces.js

PASS:
- DOM ID contract
- CSS brace integrity
- map reverse projection path

## Largest meaningful gap

Real iPhone feel validation of:
1. straight putting camera at 1–3 FT
2. straight putting camera at 10–20 FT
3. camera transition from aim → stroke
4. roll-follow camera
5. compact map readability
6. map tap-to-expand
7. map drag-to-aim
8. long-drive map precision
9. short-putt map precision
10. close map → camera settles cleanly on chosen line

## Critical failures

Any of these fail Integration 009:
- putting view still reads diagonally relative to The Line
- entering stroke rotates camera unexpectedly
- expanded map cannot move the shot target
- map drag and world target disagree
- compact map overlaps major HUD elements
- map becomes visually dominant during normal play
- expanded map traps the player or cannot close
