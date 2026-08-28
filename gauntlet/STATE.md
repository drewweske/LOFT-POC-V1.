# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 006
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: terrain / landing / rollout
Iteration: integration_006

## Current provisional score
94 / 100 — REAL-DEVICE VALIDATION REQUIRED

Integration 006 is the first dedicated terrain-behavior pass.

The largest gap from Integration 005 was not airborne physics. It was what happened AFTER the ball touched the ground:
too much retained horizontal speed, too little surface identity, and too little static settling.

## Integration 006 terrain model

### Canonical surface physics
Surface properties now live in /prototype1/surfaces.js.

Each cut owns:
- normal restitution
- tangential impact retention
- rolling deceleration
- static settling grade
- stop threshold
- spin/turf grip
- cut-to-cut transition bite
- lie launch speed
- lie spin retention
- lie launch bias

Surfaces:
- tee
- fairway
- green
- fringe
- rough
- sand
- water

### Landing behavior
The ball no longer uses a mostly-global bounce/slide model.

Landing resolves against:
- actual local terrain normal
- current surface restitution
- surface tangential retention
- spin/contact slip
- surface spin grip

Result target:
- fairway: one readable hop + controlled release
- green: low bounce + wedge check
- fringe: intermediate first-cut behavior
- rough: obvious grab
- sand: immediate deadening

### Rolling behavior
Frame-rate damping is not used as the primary stopping mechanism.

Roll now uses:
- gravity along local grade
- calibrated rolling resistance in m/s²
- surface transition losses
- static friction / settling

The static-friction layer is critical:
a nearly stopped ball on ordinary fairway, rough or sand now RESTS instead of creeping indefinitely down small geometry slopes.

### Gameplay calibration
Level-ground target stopping behavior after the ball is already rolling:

At 3 m/s:
- green ≈ 6.3 m
- fringe ≈ 4.3 m
- fairway ≈ 2.8 m
- rough ≈ 1.2 m
- sand ≈ 0.7 m

Actual shot rollout is shorter because landing impact and cut transitions shed additional speed first.

### Cut transitions
Crossing cuts now has physical consequence:
- fairway → rough grabs
- fringe → green remains smooth
- rough → sand deadens dramatically

Small restrained audio cues reinforce the surface change.

### Visual / physical alignment
- fairway physics uses the same authored fairway profile as the rendered fairway
- bunker render footprints now use the shared bunker definitions
- green receives a real playable fringe
- rendered green slope now matches putting physics
- green fringe is visually distinct
- bunkers have a subtle carved/lip read
- fairway receives restrained mowing-band texture behavior

## Technical validation
PASS:
- surfaces.js
- physics.js
- world.js
- game.js
- feedback.js

All modified custom modules parse successfully.

## Largest meaningful gap
Real iPhone validation of:
- driver fairway rollout
- iron stopping distance
- wedge green check
- rough grab
- bunker deadening
- putt pace
- fringe transition
- ball settling on small slopes

## Critical failures
Any of these fail Integration 006:
- ball continues creeping after visibly losing momentum
- rough behaves like fairway
- sand behaves like grass
- green approach shots skate unrealistically
- ordinary fairway drives roll cartoonishly far
- rendered surface and physical lie disagree
- putts die instantly or remain excessively fast
