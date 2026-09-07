# Integration 035 — Live Club Atelier V1 / official v1 assessment checkpoint

Retained: 2026-09-07. Playable route: `/prototype1/` (`game.js?v=035-final`).
The user requested the entire current Gauntlet prototype be published to LOFT's main
branch immediately for assessment. The next modeling experiment is intentionally not
part of this stable checkpoint.

## Gap and definition of great

The Bag and zero-brand Object references make physical equipment the hero. A large SVG
and a different held 3D club could not prove that the collectible object was desirable.
This iteration must show the actual held assembly with useful angles, direct rotation,
zoom, responsive controls and immediate return to unchanged play. No second renderer,
hidden golfer, invented rarity stats or inspection-only premium model.

## Built

- Extracted all eight clubs / five physical grades into `clubAssembly.js`. Both golfer
  and Workshop use the same cached head, shaft, ferrule and grip buffers/materials.
- Forty complete geometry/material fingerprints and seven poses per object prove the
  extraction preserves the held build exactly. A second protected fingerprint locks
  non-hosel construction and head/grip transforms before future neck work.
- Real 3D hero replaces the Workshop SVG. Rail drawings remain small navigation aids,
  never the inspected object. Preview still does not equip until explicit confirmation.
- Craft, Face, Sole and Full Club views; drag/arrows, bounded zoom, reset and damped
  focus transitions. Family-specific craft poses show mallet/wood depth.
- The existing single canvas/context is borrowed through `objectAtelier.js`, shared
  with Ball Atelier. Exclusive ownership rejects nested borrowing; category switches
  return to the true course parent before handing the canvas to the next inspector.
- Local procedural studio radiance and lights reveal the actual shared materials.
  Reflection resources are scene-local, not assigned to the in-play material.
- No continuous draws at rest. Selection releases instance-owned groove matrices,
  never shared geometry or materials. The normal course camera and physics are untouched.
- Portrait uses natural scrolling; short landscape keeps the object/controls visible
  with a separately scrolling specification column and compact family rail.
- Official root entry now opens `prototype1/` instead of old P0.7, including under a
  GitHub Pages repository subpath. The README identifies the current assessment build.

## Observe, critique, compare

Before: large flat hero artwork could look more finished than the actual held object;
face, sole and complete club could not be freely inspected.

After: the real object can be rotated and compared from four useful views, and both
ball and club inspection return to play without state mutation. This is a clear gain
in interaction and presentation integrity, not a finished industrial-design result.

| Relevant category | Before | Retained |
| --- | ---: | ---: |
| Real-object inspection | 2.0 | 7.4 |
| Presentation / gameplay parity | 3.0 | 9.0 |
| Interaction clarity | 6.8 | 7.5 |
| Actual club visual quality | 4.5 | 4.5 |
| Actual club desirability | 4.5 | 4.5 |
| Technical integrity | 8.8 | 9.0 |

Inspection exposed an existing flaw: the iron/wedge shaft and oversized ferrule meet
near the middle of the face, creating a paddle/flask silhouette. Premium dark bodies
also need more legible material/edge treatment. These defects were not repaired by
this extraction and must not be called correct simply because structural tests pass.

## Rejected / corrected in this iteration

- Independent inspectors borrowing an already-borrowed canvas: incorrect restoration
  parent. One explicit owner and close-before-open handoff retained instead.
- A second WebGL context or hidden full golfer: unnecessary cost and duplicated state.
- Disposing shared geometry on selection: would damage play. Only instance-owned GPU
  transforms are released.
- Initial edge-on putter craft angle: replaced by a more elevated family-specific view.
- Clipped short-landscape controls: replaced by fixed object space and scrolling specs.
- A new heel/hosel edit during the urgent publication: deferred until after the requested
  official assessment snapshot. Current geometry remains exactly the trusted baseline.

## Verification and limits

- Visual 37/37; Terrain 14/14; Ball 6/6; Assembly preservation 1/1; Atelier 5/5: PASS.
- All 40 objects × 4 views × 3 inspection aspects fit projected bounds at default zoom.
- Real desktop, 390 × 844 portrait and 844 × 390 short-landscape views inspected.
- Live Club → Ball → Club → Escape sequence restored the upright course and focus.
- Foundation 7 Iron, Icon 7 Iron, full assembly and putter inspected in the actual game.
- Syntax checks and browser warning/error log checked; no new dependency or cloud.
- A fresh complete manual three-hole round and physical-device frame pacing were not
  tested. Automated launch/contact/roll/water/cup and protected motion remain the evidence.

## One next target

**Iron/wedge heel-attached shaft and hosel.** Keep the head's face center and protected
ball-contact landmark fixed; do not move the whole head to disguise center attachment.
Move only the native hosel/ferrule attachment toward the heel and connect to the fixed
grip endpoint in both shared inspection assembly and golfer pose. Judge Foundation/Icon
7 Iron and wedges live, with face clearance, continuous joints, unchanged head/grip
motion, contact/sole checks and the complete preserved Gauntlets.

## Publication evidence

The entire accumulated source was committed as `da53550`; document whitespace cleanup
is `568c9348995e27686e7466a466a701289973eac3`. A normal fast-forward push moved the verified
LOFT remote main from `52e048f` to `568c934`. The actual existing repository name has a
trailing dot: `drewweske/LOFT-POC-V1.`; its authenticated metadata matches the local
origin `https://github.com/drewweske/LOFT-POC-V1..git`.

GitHub Actions run 34128693974 failed at Configure Pages: the Pages site does not exist
and the workflow token cannot create one. An attempt to authorize enabling Pages was
rejected by the approval reviewer as a persistent hosting change beyond the main-push
request. No hosting setting changed. Explicit user approval is required; do not retry
through an alternative tool. Local play and the requested code publication succeeded.
