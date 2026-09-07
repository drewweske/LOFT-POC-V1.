# Integration 028 — In-World Club Craft V2

## Outcome

The club held in the playable shot is no longer a generic head primitive or, in the
close-putting case, an upright stack of blocks. Six category silhouettes and five
physical construction grades now share one explicit product coordinate system,
ground honestly, address the ball without intersecting it and preserve the trusted
golf model beneath them.

## Definition of great

- driver, wood, hybrid, iron, wedge and putter remain recognizable without labels
- Foundation and Icon differ through construction and silhouette, not rarity paint
- face, sole, chassis / cavity, hosel, alignment and weighting have physical roles
- exactly one restrained signal part appears on eligible premium construction
- the visible face clears the addressed ball by at least 1 mm
- every sole remains within 4 mm below to 14 mm above the analytic turf plane at
  address and impact
- club length, ball landmark, impact timing and all flight numbers remain unchanged
- the complete mobile assembly stays below 14 parts and 14,000 triangles

## Built

- frozen `LOFT_IN_WORLD_CLUB_CRAFT_V2` specification and explicit local-axis contract:
  `X = face-to-back`, `Y = heel-to-toe`, `Z = sole-to-grip`
- rounded driver / wood / hybrid crown, face, sole, chassis, frame, hosel and tier
  construction instead of category-scaled generic masses
- forged iron and high-toe wedge profiles with real face depth, sole, grooves,
  cavities, toplines, bridges and slanted hosels
- blade, Tour blade, Signature mallet and Icon mallet putter constructions
- dark premium mallet chassis with honest-metal crown, alignment and outer wing rails
- instanced face grooves and one bounded physical signal weight
- family-specific tangent-plane contact offsets that separate construction from the
  ball while preserving the analytic head origin and turf height
- rebuilt hosel bridges that continue from the unchanged shaft endpoint into the
  visually offset head rather than leaving a disconnected ferrule
- executable construction, progression, zero-brand, address, impact, contact and
  mobile-budget gates across all 40 club / grade combinations

## Protected contracts

- all eight carry, launch, ball-speed, spin and roll records are unchanged
- exact club lengths, address-ball landmarks, head landmarks and 45 mm head guide
- fixed `t = .60` impact contract and the full analytic swing / putting motion
- terrain, ball, cup, putting, scoring, map, camera and round systems
- no dependency, service or alternate asset pipeline was introduced

## Before / after

Before: the playable putter used its toe width as vertical height, producing a tall
black block stack beside and partly through the ball. Other categories reused
under-articulated primitives, tier changes were difficult to read in-world and the
address relationship had no enforceable face-clearance contract.

After: the Foundation putter reads as a basic low blade and the Icon as a wider,
open-wing engineered mallet at the same camera. All categories use category-specific
construction, every addressed ball sits outside the head assembly, visible face gaps
measure 1.15–6.14 mm and address / impact sole bounds measure -3.87–12.71 mm.

## Rejected live

- preserving the original putter dimensions: physically mislabeled local axes made
  a heel-to-toe measurement stand upright and could not be polished into correctness
- accepting the first corrected low mallet: its all-dark edge-on read was physically
  right but too visually mute for Icon equipment
- crown-only micro-inlays: they disappeared at the real low putting camera, so the
  retained Icon also carries machined outer wing rails
- a direct face-away translation: it would lower parts into turf; the retained
  face-to-back shift includes a measured tangent lift
- changing club length or the address guide to solve the render: that would corrupt
  the trusted swing and ball relationship
- orange ferrules, multiple signals, glow or rarity shells: decoration cannot replace
  industrial design and violates LOFT restraint

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 28 / 28 PASS
- all 40 club / grade combinations inspected by executable geometry and contact gates
- maximum head assembly: 12 parts / 4,292 instance-weighted triangles
- minimum address face gap: 1.148 mm beyond the 26 mm gameplay-ball radius
- address / impact ground envelope: -3.872 mm to 12.708 mm
- Foundation and Icon putters compared live at one camera; Icon face clearance and
  low mallet silhouette inspected at the real two-foot fixture
- live warning / error log empty; changed JavaScript syntax PASS

## Honest result

This decisively removes the incorrect block-stack club and establishes a safe,
collectible in-world construction system. It is still performant code-native geometry,
not a production baked hard-surface asset set; the Workshop remains the appropriate
place for macro machining detail while play prioritizes scale, silhouette and contact.

## Next

The foreground golfer is again the largest screenshot gap. Build Golfer Face & Grip
Cohesion V3: replace the remaining assembled facial / wrist read with a unified LOFT
head silhouette, clearer cap / hair / neck transitions and a believable two-hand golf
grip, while preserving every pose key, limb length, club landmark and impact timing.
