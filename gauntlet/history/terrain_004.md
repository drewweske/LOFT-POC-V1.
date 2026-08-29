# Terrain 004 — Never Through The Ground

Device review after Integration 012 showed a new standard:

LOFT cannot merely simulate the same terrain concept in two places.
The visible top surface and the physical contact surface must be the same contract.

Integration 013 therefore unifies:
- playable surface render lift
- physics contact height
- ready-ball placement
- putting placement
- pace ghost placement

A dedicated visual clamp exists as a final renderer safeguard.

The cup also became its own render object because a golf game cannot permit the destination itself to disappear into a depth buffer.

Camera-side sign was corrected for near-cup views, and golfer stance grounding now samples both sides of the stance.

New critic questions:

1. Can I ever see the ball inside solid turf?
2. Can I always see where the hole actually is?
3. Does the camera ever make the golfer larger than the shot?
4. Does the golfer appear attached to the ground instead of intersecting it?

Any YES to 1 or 3, or NO to 2 or 4, fails the build.
