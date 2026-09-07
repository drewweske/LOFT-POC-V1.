# Integration 034 — Ball Atelier V1 / Ball Topology V2

Retained: 2026-09-06. Normal playable route: `http://127.0.0.1:43117/prototype1/`.

## Gap and definition of great

The Ball Topology and Bag references make the ball an inspectable industrial object.
The existing playable ball had real depressions but only 2–7 unique near-mesh samples
per dimple, flat triangle normals and no Workshop inspection. Enlarging it exposed
faceting; a separate polished menu sphere would have hidden rather than solved the gap.

Great for this bounded pass means the same canonical topology and material in play and
inspection, all 338 bowls actually sampled, one fixed inset signature, tactile curved
lighting, deliberate rotate/zoom controls and immediate return to unchanged golf.

## Built in the actual prototype

- Added a BALL category to the existing Workshop, with one canonical in-play object,
  ruled physical specifications, a quiet ink inspection field and explicit course return.
- The inspector uses the same ball factory, cached geometry and material as gameplay.
  Physical geometry is 42.67 mm across; the existing 26 mm gameplay readability radius
  remains a mesh scale. Physics and the 26.5 mm terrain-contact presentation are unchanged.
- Replaced triangle-flat shading with continuous analytic radial-gradient normals,
  checked against finite differences of the actual depressed surface.
- Indexed 46,080-triangle inspection mesh has at least 37 unique depressed samples in
  every dimple; all 338 reach at least 95% of the specified 0.145 mm depth. Packed buffers
  remain below 2 MB. Gameplay and distant meshes retain 3,380 and 1,620 triangles.
- Near detail is realized lazily on first close inspection, then shared. Normal tee
  startup does not construct the hero buffer. All distant dimples remain represented.
- A fixed object-space, derivative-antialiased circular material mask makes precisely
  one orange depression. It rotates with the ball, without a bead, glow or extra mesh.
- Drag/arrows rotate, wheel and 44 px buttons zoom, Home/reset returns by the nearest
  revolution. Pitch and zoom are bounded; reduced-motion preference bypasses damping.
- One existing WebGL canvas/context is temporarily hosted in the modal. Closing restores
  its parent, accessibility attributes, dimensions and exposure and draws the course in
  that same UI transaction. No world camera, physics ball or scoring state is borrowed.
- Static inspection stops issuing draw calls. Portrait scrolls naturally; short landscape
  retains the object and controls while only its specification column scrolls.
- Added an independent six-check Ball Gauntlet; opt-in `?gauntlet=ball` is for inspection
  QA only, never the normal playable entry route.

## Iterations that earned their place

1. The first 21,780-triangle hero still had visibly coarse bowls. Independent Float32
   sampling measured a minimum of 19, not the initially reported 21. Detail 47 plus
   indexing produced the retained denser surface without multiplying packed memory.
2. The first proposed distant mesh represented only 337 dimples after deformation.
   Detail 8 independently represents all 338.
3. Bright frontal lighting washed out the upper product. A lower, lateral warm key and
   restrained fill reveal the curved bowls while preserving matte ivory.
4. Vertex-only signature color had a polygonal edge at hero scale. The fixed angular
   material mask removed that defect without changing the physical bowl.
5. An 844 × 390 panel initially clipped the inspection controls. A fixed object column
   with independently scrolling specifications passed the second live review.
6. Returning a moved/resized canvas could reveal a stale frame before the next animation
   frame. The close transaction now restores and draws the world synchronously.
7. Eager hero construction imposed work on ordinary tee entry. Lazy LOD realization
   removed that cost from the normal course path and gained a behavioral regression gate.

## Before / after and adversarial verdict

Before: no real ball inspection; shallow sampling, faceted normals and a jagged enlarged
signature undermined the hero-object promise.

After: a rotatable, zoomable, visibly sculpted ball with one restrained signature; its
geometry and material remain the playable object's, not a marketing substitute. This is
a material improvement, not yet the reference board's finished product-render quality.

Scores against the supplied production references, not against the old POC:

| Relevant category | Before | Retained |
| --- | ---: | ---: |
| Close ball visual quality | 4.5 | 7.0 |
| Ball LOFT identity | 5.5 | 7.4 |
| Object inspection interaction | 0.0 | 7.6 |
| Collectibility / desirability | 4.0 | 6.8 |
| Technical integrity | 8.0 | 9.0 |

## Verification and limits

- Visual Gauntlet 37/37, Terrain Gauntlet 14/14, Ball Gauntlet 6/6: PASS.
- Independent dimple coverage/depth/buffer budget, geometric normals, shared LOD/material,
  fixed signature, lazy realization and renderer/input lifecycle: PASS.
- Live desktop, 390 × 844 portrait and 844 × 390 landscape inspected; ball rotation,
  zoom, reset, category switching and course return exercised.
- Portrait title spacing, accessible modal background isolation, Escape and return focus
  verified. Precision map and live Chronicle work after returning from ball inspection.
- Fresh final Chronicle replay returns upright without Reset following the Integration
  033 camera repair. Browser warning/error logs checked clean.
- The latest pass did not repeat a complete manually played three-hole round. The prior
  real-shot checks and current deterministic launch/bounce/roll/water/cup gates remain
  the evidence; do not claim new physical-device or full-round validation.
- No new dependency, renderer context, cloud service or physics/stat change.

The model has one canonical ball, not a collection of invented rarity recolors. The
338-center layout is deterministic but is not claimed as a manufacturing-ready exact
quad-symmetric topology or a certified physical ball. Hardware frame pacing still needs
physical-device testing. World and golfer asset fidelity remain well below the boards.

## One next target

**Live Club Atelier V1.** Replace the Workshop's hero SVG with direct inspection of the
same engineered club assembly held by the golfer. Preserve preview/Equip separation,
all eight clubs, five construction grades, contact transforms and trusted golf numbers.
Prove silhouette, face/sole/cavity/material readability and zero-brand grade differences
on the actual 3D object before considering a richer asset pipeline.
