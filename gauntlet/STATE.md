# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 007
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: The Stroke / putting / cup
Iteration: integration_007

## Current provisional score
95 / 100 — REAL-DEVICE VALIDATION REQUIRED

Integration 007 is the first dedicated putting and short-game control pass.

The triggering user evidence was decisive:
- close putts required repeated attempts
- tiny input still produced too much pace
- there was no readable power / pace reference
- the flagstick dominated close camera compositions
- the rendered ball / cup ratio did not convincingly communicate that the ball could fall
- short-range ball touch could overlap The Line target interaction
- the HUD reported AIR while a putt was rolling
- near-green wedge shots still inherited a full-swing minimum energy floor

## Integration 007 wins

### PACE — LOFT putting control
Putting no longer inherits the generic full-swing power formula.

The putter now uses a dedicated backstroke-to-pace model:
- tiny backstroke = tiny putt
- longer backstroke = longer roll
- no hidden minimum-power floor
- the return stroke still judges path, tempo, smoothness and commitment

The live readout is expressed as golf distance:
PACE 3.4 FT
PACE 9.8 FT
PACE 15 FT

Not a debug percentage.

### In-world pace ghost
During a putting backstroke, a restrained LOFT pace marker moves down The Line to show the approximate level-green stopping distance.

When the pace marker crosses the player's intended target distance:
- the marker visually tightens
- a tiny acoustic cue plays
- a tiny haptic cue is requested where supported

It never auto-locks the shot.

### Input precision
A putt can now be made with approximately an 8 px backstroke on the test iPhone-class viewport.

Representative mapping:
- ~8 px -> ~1 FT pace
- ~35 px -> ~3.5 FT
- ~50 px -> ~5.5 FT
- ~75 px -> ~9.8 FT
- ~100 px -> ~15 FT
- ~150 px -> ~27 FT

This creates a large precision band for tap-ins and short putts.

### Ball intent priority
At short range, the ball and The Line target can occupy overlapping touch regions.

The previous hit-test checked The Line first.

Integration 007 reverses that:
touching the ball now wins when those zones overlap.

This removes a major near-cup ambiguity.

### Putting strike quality
Putting gets its own contact model:
- calmer ~2:1 rhythm target
- path accuracy
- stroke smoothness
- commitment through impact
- reduced Level 1 random path contamination

Feedback labels include:
- PURE ROLL
- CLEAN ROLL
- SOLID ROLL
- TOUCH
- PUSH / PULL

### Putter sound / haptics
The putter no longer shares the full iron impact sound.

It now gets:
- soft low contact body
- crisp face tick
- restrained upper harmonic for exceptional contact
- shorter tactile response
- separate transition cue

The cup sound remains a separate physical reward.

### Cup / flag geometry
The gameplay ball, cup and flagstick now share a much more believable relative scale.

- gameplay ball radius reduced
- visible cup increased to preserve a regulation-like ball/cup ratio
- cup capture footprint aligned to the visible cup
- continuous 120 Hz segment capture prevents a centered putt skipping over the hole
- center pace can be firmer than edge pace
- hot edge strikes still lip out
- flagstick is dramatically thinner
- flagstick has NO ball collision
- while putting, LOFT automatically tends the pin visually so it cannot dominate the sightline

### Putting camera
Putting has its own:
- address/read composition
- swing-lock composition
- ground-roll tracking composition

It is lower, closer and slightly off the direct flag axis.

### Full-swing visual control
A new in-world LOFT Stroke Halo gives full swings a visual load reference without bringing back a generic power bar.

The Orange signal moves around a Cream ground halo as load builds.

### Short game
Close-range wedge shots no longer inherit a 40% minimum full-swing energy floor.

Within short-game range:
- smaller backstrokes are valid
- partial wedge energy is valid
- touch shots can be played around the green

### UI cleanup
The putter no longer advertises a misleading 25 YD carry.

The equipment surface now presents putter reach as 65 FT.

The course map reports the actual green/fringe lie while a putt is rolling instead of AIR.

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

DOM contract: PASS
CSS brace integrity: PASS

## Largest meaningful gap
Real iPhone validation of the new tactile putting loop.

Required tests:
1. 1–2 FT tap-in
2. 3 FT putt
3. 6 FT putt
4. 10 FT putt
5. 20+ FT lag putt
6. pace intentionally short
7. pace intentionally long
8. center strike at cup
9. hot lip-out
10. aimed break
11. fringe putt
12. short rough chip
13. perfect drive versus mediocre drive
14. full-swing load halo readability

## Critical failures
Any of these fail Integration 007:
- tiny putts still launch at near-identical speed
- touching the ball near the cup grabs The Line
- a centered reasonable-pace putt visibly passes through the hole
- flagstick blocks the putting sightline
- pace readout and actual roll distance are materially disconnected
- short wedge shots remain impossible
- full-swing visual feedback reads like a generic power meter
