# Integration 031 — Coastal Atmosphere & Time-of-Day V2

## Outcome

Coastal Ridge no longer ends in a uniform fog-gray upper frame. One authored
blue-to-warm sky now carries the existing low coastal light, while four deterministic
self-shaded cloud banks give the route depth without post-processing, gameplay
collision, shadows, card edges or a new dependency.

## Definition of great

- the visible gameplay sky—not an unseen zenith—has a clear vertical value and hue
  hierarchy in portrait, short landscape and desktop cameras
- the warm horizon agrees with the existing immutable key-light direction
- clouds read as restrained sculpted masses with warm crowns and cool undersides
- open-ocean views retain negative sky space
- cloud sheets do not disappear when flight and result cameras pass behind them
- atmosphere is visual-only, bounded, deterministic and cheap
- fog depth, turf/light, terrain/contact, water, landmarks, camera and gameplay stay
  exactly protected

## Built

- frozen `LOFT_COASTAL_AIR_V2` sky, fog, cloud and performance contract
- one production-camera-readable vertex-color sky sampler shared by the dome and tests
- four pure RGBA cloud blueprints with transparent borders, black transparent pixels,
  deterministic visible fingerprints and a warm-crown / cool-underside material read
- one soft-union foundation per cloud that joins crown lobes without a broad fog smear
  or a repeated string of separate oval puffs
- four authored bank transforms with open-ocean negative space and slow bounded drift
- double-sided transparent presentation with `forceSinglePass`, so flight cameras do
  not pop a bank and the four-cloud pass budget remains real
- DOM-free `buildCoastalAir()` construction shared by the live world and validator
- two executable Atmosphere gates covering actual scene contents, texture bytes,
  visual fingerprints, camera rays, light/fog preservation and rendering cost

## Protected contracts

- exact `LOFT_FIELD_V4_CONTACT` field and its 297,361-probe fingerprint
- exact `LOFT_COASTAL_TURF_LIGHT_V2` specification and key direction/exposure
- fog `{ color: 0xcbd8d7, near: 235, far: 530 }`
- all golf, ball, cup, putting, scoring, map, equipment, camera and round behavior
- water, ecology, Lighthouse Headland and Ridge House construction
- no collision, shadow, service, dependency or unrelated repository was added

## Before / after

Before: most gameplay frames presented a nearly uniform pale gray sky. The earlier
cloud sheets were faint, broad smudges whose effective opacity was approximately 36%,
so the directional warmth on the land had no convincing atmospheric source.

After: every settled full-shot camera samples a measurable blue-to-light horizon
sequence inside its top 28% of screen space. Four distinct cloud assets hold 24.9–27.4%
visible coverage, a 65.6% effective peak, transparent eight-pixel borders and clearly
separated warm crowns / cool undersides. The final bank layout leaves open ocean clear
while the course-facing view gains a deliberate sky composition.

## Rejected

- the first V2 bank layout: 96–152 m sheets overlapped into one soft ceiling
- simply shrinking those sheets: exposed a repeated string of disconnected oval puffs
- hard-max lobe composition: preserved bead-like seams between cloud elements
- front-side-only sheets: could disappear when a flight/result camera crossed behind
- transparent double-sided defaults: silently doubled four clouds to eight color passes
- canvas-only cloud generation: could not be measured identically in Node and browser
- invisible RGB in zero-alpha texels: created filtering-fringe risk and dishonest hashes
- changing terrain light, exposure or fog to make the sky look stronger: would break the
  established world and distance contracts

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 31 / 31 PASS
- changed JavaScript syntax: PASS
- cloud fingerprints: `2987deb4`, `324e82bd`, `617fbfbc`, `6162d35c`
- cloud coverage: 24.9–27.4%; effective peak: 65.6%; outer-border alpha: 0
- actual atmosphere assembly: 5 draws / 5 color passes / 1,688 triangles / 2 MiB raw
  RGBA; four unique maps; no shadows, depth writes or gameplay objects
- actual settled LoftCamera rays pass on all three holes at 390 × 844, 844 × 390 and
  1280 × 720 with monotonic vertical separation
- live default, course-facing, open-ocean and flight/result views inspected
- a real drag swing completed launch, flight, landing, receipt and Next Shot
- live warning/error log empty

## Honest result

The upper frame now participates in Coastal Ridge's lighting and place identity instead
of reading as a placeholder clear color. The clouds remain an efficient code-native
four-sheet solution, below the eventual production volumetric or artist-authored sky
pipeline, but they are materially stronger and rigorously bounded for this POC.

## Next

Target Steward V1: establish an unambiguous world-linked hierarchy between the required
shot distance and the selected club's capacity—especially the current 8-foot putt versus
65-foot putter-range conflict—without intercepting one canvas, map, bag or swing input.
