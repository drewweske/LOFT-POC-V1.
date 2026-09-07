# Integration 029 — Golfer Face & Grip Cohesion V3

## Outcome

The playable golfer no longer uses a horizon-staring sphere / jaw stack and a pair
of shaft-oriented mitten primitives. One continuous LOFT craniofacial shell, a
designed cap / hair / neck silhouette, restrained ball-focused gaze and an ordered
two-hand grip now surround the unchanged analytic swing.

## Definition of great

- soft-square jaw, cheek and brow planes read from the primary gameplay profile
- cap, brim, hair, nape, ears and tapered neck form one calm human silhouette
- eyes remain restrained almonds and expression stays focused rather than theatrical
- head looks down at the ball through address and impact, then releases naturally
- lead glove stays above the bare trail hand through every swing and putting phase
- palms retain anatomical size instead of telescoping to moving endpoint distances
- the visual grip continues above the lead hand and into the unchanged shaft endpoint
- every pose key, IK length, hand landmark, club landmark and `t = .60` impact survives

## Built

- frozen `LOFT_GOLFER_FACE_GRIP_V3` facial, gaze, palm and handle contract
- one closed eight-section / 32-radial superellipse head shell with asymmetric front /
  back depth, square jaw, cheek plane, brow plane and controlled chin
- one embedded bridge-to-tip angular nose wedge, two shallow almond eye inserts,
  curved natural brows and one understated asymmetric mouth line
- one rear hair shell with tucked sideburn transitions instead of a detached hair ball
- low sculpted cap crown, curved broad visor, honest dark under-brim and exactly one
  restrained front-panel signal
- five-ring tapered neck bridge with deep head / collar overlap
- phase-authored focus from 12.6 degrees down at address / impact to 2.6 degrees at
  finish; putting remains a deliberate 15.5 degrees down
- permanent lead / trail handle stations at -10 mm and +45 mm from grip centre
- fixed 52–64 mm palm volumes parented to unchanged analytic wrist anchors
- physical handle-quadrant contact, finger wraps, smaller oriented wrist seals and a
  215 mm visible grip spanning 60 mm above centre to the unchanged shaft start
- executable shell, signal, gaze, landmark, hand-reach, palm-size, grip-order and
  handle-length gates across driver / putter motion and Levels 1, 50 and 75

## Protected contracts

- `_poses()`, `_puttPose()`, `_poseAt()` and every authored animation landmark
- arm / leg lengths, IK solving, hand-anchor positions and club-head position
- exact `clubLength`, address-ball relationship and `t = .60` impact timing
- all launch, carry, spin, bounce, roll, terrain, cup, scoring, map and round behavior
- no dependency, service, skinned-asset pipeline or unrelated repository was added

## Before / after

Before: two intersecting head spheres, box bridge, cone nose, bead eyes, bar brows /
mouth, pipe neck and detached dark hair mass read as assembled mannequin primitives.
The head stared at the horizon. Both hands were identical moving shells centred on
laterally separated wrists, rotated along the shaft and able to invert grip order after
impact.

After: an unbranded profile has a continuous jaw / cheek / brow silhouette, integrated
hat / hair / nape and a visible focus toward the ball. Glove and bare hand keep fixed
human proportions, occupy separate handle stations, remain correctly ordered through
the finish and meet a continuous visible grip without moving the trusted swing.

## Rejected live

- retaining the head sphere and merely adding facial detail: more parts did not remove
  the primitive silhouette that dominated every close gameplay frame
- rotating the entire rig to fake focus: it would move club and body landmarks; only
  the visual head assembly receives a bounded pitch
- first endpoint-exact palm bridge: measured palm length collapsed to 12–18 mm in
  several phases while width stayed near 68 mm, recreating the random-resize defect
- centring a fixed palm over each wrist/contact segment: stable size, but the distal
  shell overran its station and merged both hands into one knot
- allowing wrist projections to choose hand order: the projections invert just after
  impact; permanent anatomical stations are required
- separate finger beads, glossy eyes, nostrils, teeth or expression exaggeration:
  micro-noise cannot replace silhouette, focus and grip integrity
- moving a pose target, clubhead or shaft endpoint to hide contact: rejected because
  render polish may not corrupt golf motion

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 29 / 29 PASS
- head shell bounds: 221 mm deep × 272 mm high × 218 mm wide
- complete head assembly: 17 visible parts / 5,200 triangles
- exact lead / trail station separation: 55 mm through all sampled phases
- fixed palm envelope: 52–64 mm; sampled maximum wrist-to-contact reach: 59.93 mm
  lead / 83.55 mm trail, covered by palm plus buried wrist transition
- 215 mm visible grip with unchanged lower endpoint / shaft start
- address, top, impact and close-putting frames inspected at the actual live camera
- live warning / error log empty; changed JavaScript syntax PASS

## Honest result

This decisively removes the assembled face and unstable mitten system and gives the
foreground golfer a stronger LOFT silhouette and believable visual intent. It remains
a performant code-native procedural character rather than the eventual production
skinned mesh with blendshapes, cloth weighting and bespoke animation data.

## Next

Adversarial comparison of the live swing, always-visible world and field HUD selects
the next single highest-impact Gauntlet target. No broader system will move until that
comparison identifies a clear winner.
