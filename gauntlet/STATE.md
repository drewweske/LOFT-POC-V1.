# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 012
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: terrain readability + physical soundscape
Iteration: integration_012

## Integration 011 device verdict

PARTIAL PASS.

What improved:
- course no longer rendered near-black
- heightfield remained playable across all three holes
- coastline / world silhouette became substantially more coherent
- severe terrain soft-lock from Integration 010 did not recur

What still failed:
- ground grade was visually too ambiguous
- visible land could still read flatter than the physics surface
- long dark seams / strips remained in several views
- putting and short-game camera could clip deeply into the golfer near the cup
- very slow ball motion could look like unexplained terrain creep
- audio remained too synthetic / UI-like for the physical golf experience

The player still had to GUESS some slopes rather than READ them.
That is not acceptable for LOFT.

## Integration 012 rebuild

### 1. Surface normal orientation fixed

Root cause discovered:
The custom fairway ribbon, green mesh and bunker bowl used reversed triangle winding.

That produced downward-facing normals on surfaces that should face up.

Consequences included:
- flattened or incorrect light response
- intermittent dark strip artifacts
- poor slope readability
- inconsistent mobile rendering

All playable custom terrain meshes now use upward-facing triangle winding.

### 2. Terrain Read shading

A restrained baked slope-light term is now generated from the SAME height function used by ball physics.

It is applied to:
- rough base terrain
- first cut
- fairway
- green
- fringe
- bunker floors

This is not an arbitrary contour overlay.

Each vertex samples the physical grade around itself and receives a subtle light/dark multiplier matching the scene key-light direction.

Design goal:
A player should be able to look at a hill and understand which way it falls before the ball proves it.

### 3. Stronger terrain lighting

The previous hemisphere fill was flattening the course.

Integration 012:
- reduces ambient hemisphere intensity
- increases directional key light
- slightly increases exposure
- keeps cool fill restrained

This creates actual shape on ridges, saddles and green contours without returning to the near-black failure.

### 4. False terrain creep removed

Rolling physics now tests whether downslope gravity is strong enough to overcome the calibrated rolling resistance of the current surface.

At very low speed:
- if turf can physically hold the ball, it settles
- if the grade truly overcomes the surface, it continues to roll

This replaces the old grade-threshold-only settle test.

Surface static hold thresholds were also recalibrated.

The ball should no longer perform tiny unexplained slides on visually gentle ground.

### 5. Tap-in camera protection

Very short putts now use a dedicated close-range composition:
- camera pulls farther back
- camera rises
- slight lateral offset clears the golfer rig
- ball-to-cup axis remains visually straight
- result camera also protects against body / arm clipping

This specifically addresses the giant-arm / club closeups seen near 1 FT.

### 6. LOFT physical golf soundscape

The old oscillator-heavy feedback has been rebuilt.

The new sound architecture uses layered physical transients rather than obvious UI tones:

Driver / wood:
- compressed low ball-body impact
- composite face crack
- short high-frequency air snap
- tighter transient for elite contact

Iron / wedge:
- dense metallic face transient
- lower body resonance
- turf component on wedge / iron contact

Putter:
- soft body knock
- milled-face tick
- delicate high-frequency contact only on centered strike

Landing:
- green/fairway turf contact
- rough absorption
- sand burst
- water splash body

Ball roll:
- sparse surface-specific micro-grains
- green roll is light and crisp
- fairway is softer
- rough is muted
- sand is granular

Cup:
- liner catch
- physical drop
- restrained flagstick / liner tail

Ambient course:
- low coastal wind
- distant surf bed
- slow organic amplitude movement

All audio remains generated locally in WebAudio so the prototype has no network sample dependency and no third-party licensing dependency.

### 7. LOFT sound rule

Sound must communicate MATERIAL + CONTACT + QUALITY.

It may not communicate success by playing a gamey reward jingle.

A perfect strike should sound cleaner, tighter and more compressed.
A poor strike should sound duller and less resolved.
The cup should be a physical reward first.

## Current status

TECHNICAL PASS.
REAL-DEVICE VISUAL + AUDIO VALIDATION REQUIRED.

## Next device fixtures

T01 — fairway side slope
T02 — ridge / saddle transition
T03 — green break from 20–35 FT
T04 — fringe transition
T05 — bunker lip + bowl
T06 — long course view with fairway strips
T07 — tap-in at 1–2 FT

A01 — driver center strike
A02 — driver poor contact
A03 — iron center strike
A04 — wedge + turf
A05 — putter center strike
A06 — putt rolling on green
A07 — cup drop
A08 — bunker landing
A09 — ambient idle for 20 seconds

## Critical pass conditions

- no black terrain strips
- no reversed / disappearing fairway faces
- no invisible grade
- visible slope direction agrees with ball break
- ball settles when turf friction should hold it
- ball continues only when grade physically earns it
- no camera inside golfer on tap-ins
- golf sounds read as physical golf contact, not UI beeps
- cup sound feels like a reward without becoming arcade audio
