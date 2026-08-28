# Putting 001 — The Pace rebuild

User evidence:
A close putt could take 20+ strokes. Very small gestures produced nearly the same pace, the cup felt impossible to enter, and the flagstick dominated the close camera.

Critic verdict:
LOSS.

Largest meaningful gap:
The putter was still using a full-swing-derived input architecture. That made power discontinuous exactly where golf requires the most precision.

Root causes:
- generic minimum swing threshold
- generic power blend
- no pace visualization
- target halo touch priority over ball touch at short range
- oversized rendered ball relative to cup
- visually oversized flagstick
- no continuous cup sweep
- generic putting camera
- no short-game partial-wedge path

Rebuild:
- dedicated backstroke -> pace model
- in-world pace ghost
- intended-distance pace lock cue
- specialized putter rhythm / path scoring
- specialized putter audio + haptic
- dedicated putting camera
- ball-first near-cup hit testing
- regulation-ratio visual cup / ball relationship
- continuous cup capture
- thinner non-colliding auto-tended flagstick
- true partial wedge energy
- full-swing LOFT Stroke Halo

Primary design target:
The player should be able to deliberately hit a 3-foot putt, a 10-foot putt and a 30-foot lag putt with visibly different gestures and understand the expected pace before impact.
