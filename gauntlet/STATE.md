# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 008
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: THE SIGNAL / putting / stroke control
Iteration: integration_008

## Current provisional score
95.5 / 100 — REAL-DEVICE VALIDATION REQUIRED

Integration 008 was triggered by a critical runtime failure and a deeper UX failure.

User evidence:
- releasing a putt crashed with:
  TypeError: null is not an object (evaluating 'this.lastTrailPoint.copy')
- putting still felt vague
- power was not obvious enough before impact
- tiny / medium / long strokes did not yet read as one coherent LOFT control language
- the user wants every strike to feel authored, controllable and unmistakably LOFT

## Critical runtime fix

Root cause:
Putting intentionally skipped flight-trail initialization, but the frame loop still called the generic flight feedback method. That method attempted to copy into a null lastTrailPoint.

Fix:
- flight feedback now initializes defensively
- putts no longer invoke airborne trail feedback at all

This removes the reported crash at release.

## THE SIGNAL — proprietary LOFT stroke grammar

The generic concept of a power meter has been rejected.

LOFT now uses one branded in-world interaction across putts, chips and full swings:

THE SIGNAL.

Visual language:
- the Flag Orange signal begins at the ball
- a quiet path of Scorecard Cream dimples extends behind the ball
- the signal physically follows the player's backstroke
- the signal returns toward the ball during the downswing
- a Cream contact gate tightens at impact
- the system exists in the world, not in a HUD bar

The orange-dimple behavior directly derives from the official LOFT Ball identity.

## Full swing / chip control

The Line chooses shot intention.

The Signal translates that intention into a readable stroke.

A Cream SET mark appears on the dimple path at the approximate backstroke needed for the chosen target distance.

When the Orange Signal reaches SET:
- the mark tightens
- a tiny branded confirmation appears
- a restrained audio / haptic cue is requested

The game does NOT lock the player there.

Distance is now primarily authored by Signal depth:
- ~90% backstroke depth
- small release-speed contribution
- small commitment contribution

Tempo / path / smoothness / commitment still control strike quality.

This is a major change from the previous opaque power blend.

True partial shots are now valid across the bag.
Short game receives an even larger partial-swing range.

## Putting — THE ROLL

Putting uses THE SIGNAL but gets an additional predicted-stop object.

During the backstroke:
- an actual translucent LOFT-style ghost ball moves down The Line
- it represents approximate level-green stopping distance
- the only numeric readout is physical golf distance in feet
- when predicted stop reaches the player's intended target, the cue reads ON PACE

There is no percentage bar.

The player sees:
1. their finger / golfer backstroke
2. Orange Signal moving backward
3. predicted ghost ball moving down the intended roll
4. feet remaining / ON PACE
5. Signal returning through contact

This is the current simplest expression of complete control.

## Short-putt precision

The backstroke curve was widened substantially.

The first part of the physical gesture is intentionally generous:
- tiny gesture = tap-in pace
- small gesture = short putt
- medium gesture = normal green putt
- longer gesture progressively accelerates for lag putts

No minimum putting power exists.

## Cup / pin integrity inherited from Integration 007

- gameplay ball / cup visual ratio corrected
- cup sweep test prevents tunneling across the hole
- center capture accepts more pace than edge capture
- hot edge pace can lip out
- flagstick is physically non-colliding in the custom ball simulation
- flagstick is visually tended / faded during putting
- dedicated putting camera remains active

## Brand integration

THE SIGNAL uses only:
- Clubhouse Ink
- Scorecard Cream
- Flag Orange

The interaction is intentionally based on the official orange-dimple LOFT Ball grammar.

Goal:
Hide the LOFT logo and the stroke mechanic should still look owned by LOFT.

## Technical validation

PASS:
- game.js
- physics.js
- feedback.js
- camera.js
- world.js
- surfaces.js
- characterRig.js
- topoMap.js
- equipment.js
- round.js

PASS:
- all custom module syntax
- DOM ID contract
- CSS brace integrity

## Largest meaningful gap

Real iPhone feel validation of THE SIGNAL.

Required tests:
1. release a putt — ZERO runtime error
2. 1–2 FT tap-in
3. 3 FT putt
4. 6 FT putt
5. 10 FT putt
6. 20+ FT lag putt
7. intentionally short pace
8. intentionally long pace
9. ON PACE cue
10. center cup capture
11. hot edge lip-out
12. short chip
13. half wedge
14. partial iron
15. full 7I
16. full driver
17. SET mark readability
18. whether THE SIGNAL feels intuitive without explanation

## Critical failures

Any of these fail Integration 008:
- putt release throws any exception
- a tiny putting backstroke still produces medium / long pace
- ghost stop indicator materially disagrees with level-green roll
- touching near the ball manipulates The Line instead
- reasonable centered putt skips across cup
- Signal visuals read as a conventional power meter
- SET mark causes the player to feel auto-aimed / auto-hit
- partial swings still collapse to one minimum power
