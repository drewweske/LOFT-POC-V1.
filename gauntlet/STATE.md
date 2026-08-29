# LOFT Prototype 1 — Gauntlet State

Current build: Prototype 1 / Integration 010
Branch: prototype-1-gauntlet
Playable artifact: /prototype1/
Active subsystem: visual world / terrain / character / brand typography
Iteration: integration_010

## Current provisional score
96.5 / 100 — REAL-DEVICE VISUAL VALIDATION REQUIRED

Integration 010 begins the first major visual-graphics overhaul after the user completed the full three-hole demo.

User evidence:
- core gameplay is now a credible foundation
- THE SIGNAL / putting / round loop are good enough to move forward
- character still reads low-poly, separated and goofy
- swing exposes gaps between body parts
- course terrain reads too flat and synthetic
- cliffs / rocks / trees / rough / bunkers lack authored depth
- visual geometry overlaps remain distracting
- prototype typography still reads like an engineering fallback instead of LOFT

## World Art Rebuild

Coastal Ridge is no longer built as a flat green plane with box cliffs.

The terrain system now includes:
- broad authored elevation architecture
- climbing coastal shelf
- middle saddle / valley
- lighthouse rise
- long-wave contouring
- coastal falloff
- bunker depressions integrated into terrain height
- higher-resolution terrain tessellation
- textured rough / first cut / fairway / green / fringe surfaces
- mowing-direction variation on fairway
- near-field bump detail
- tee shelves
- sculpted dynamic green geometry
- green visual surface and golf physics now share the same height function

## Bunker Rebuild

Bunkers now have:
- irregular authored outlines
- actual depressed sand floors
- grass/sand transition lips
- coarse sand material variation
- visual depth that matches terrain height

The previous flat beige shape-on-top-of-grass approach is retired.

## Coastal Geology Rebuild

Box cliffs have been removed.

Coast now uses:
- layered irregular rock shelves
- clustered boulders
- broad faceted planes
- dark secondary stone variation
- an actual falling coastal edge into water

## Vegetation Rebuild

Course vegetation now contains:
- multi-layer coastal pines
- native rough blades
- shrubs / low bushes
- denser edge ecology
- restrained play corridor so gameplay remains readable

Near the current ball lie, a dynamic grass-detail field communicates actual grass length:
- GREEN = extremely tight
- TEE / FAIRWAY = short
- FRINGE = intermediate
- ROUGH = visibly taller
- SAND / WATER = none

This gives close camera shots real surface identity without rendering millions of blades on mobile.

## Architecture / Landmark Rebuild

The lighthouse and lodge were upgraded with:
- more segments
- better silhouette
- material hierarchy
- windows / balcony details
- more deliberate proportion

Coastal Ridge retains the lighthouse as its hero visual landmark.

## Lighting Rebuild

The previous over-bright dual-light setup flattened form.

New lighting:
- warm directional coastal key
- cool sky hemisphere fill
- restrained secondary cool fill
- lower exposure
- farther atmospheric fog
- physically readable surface shadows

Goal:
warm, dimensional, editorial coastal light rather than flat mobile-game illumination.

## Character Rebuild

The current procedural golfer remains a prototype asset, but the primitive mannequin system has been materially rebuilt.

Changes:
- overlapping anatomical joints prevent visible limb separation
- shoulder seals
- hip seals
- wrist seals
- ankle seals
- broader authored shirt volume
- dynamically oriented ribcage
- dynamically oriented pelvis
- torso rotation now follows shoulder / hip motion
- neck now physically overlaps torso and head
- quieter head proportions
- refined cap
- quieter face
- smaller / more believable driver, woods and putter heads
- left-hand golf glove
- polo placket and collar wings
- belt buckle
- garment details move with the body rather than floating

The goal is a connected stylized human silhouette at every swing phase.

## Brand Typography

Canonical family architecture is now represented directly in the prototype:

LOFT Display
LOFT Text

The custom font files do not yet exist in the repository, so the browser currently falls back to Avenir Next / neutral humanist system faces.

However, hierarchy, tracking, casing and weight now follow the LOFT type system:
- Display for hero numerals, club data, result states and primary actions
- Text for body copy and utility language
- uppercase tracked micro-labels
- tight, confident display numerals
- Inter removed as the visual default

When official LOFT font files are authored later, the existing CSS family names can receive them without redesigning the interface.

## Official Brand Assets

The locked official LOFT wordmark and LOFT Ball assets remain the boot / round-result source of truth.

Core UI colors remain:
- Clubhouse Ink #0B0D0D
- Scorecard Cream #F2EFE8
- Fairway Stone #B8B1A6
- Flag Orange #FF6A2A

Flag Orange remains a signal, not decoration.

## Performance Discipline

The new world remains mobile-first:
- one higher-resolution terrain mesh
- instanced native rough
- instanced shrubs
- dynamic near-ball grass detail only
- no external runtime 3D assets
- no backend
- no generated imagery
- no fragile CDN asset dependency added

## Technical validation

PASS:
- game.js
- world.js
- characterRig.js
- camera.js
- topoMap.js
- physics.js
- feedback.js

PASS:
- DOM ID contract
- CSS brace integrity
- authored green physics/render height lock

## Largest meaningful gap

Real iPhone visual validation.

Required screenshots:
1. tee address wide
2. fairway address
3. rough address
4. bunker lie
5. green / putting
6. Level 1 top-of-backswing
7. Level 50 top-of-backswing
8. impact
9. finish
10. coastline / lighthouse no-UI view

The next visual gap should be chosen from actual device evidence, not guessed from code.
