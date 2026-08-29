# Terrain 002 — Integrity Before Decoration

Verdict on Integration 010:
LOSS / CRITICAL FAILURE.

The screenshots established that the previous visual pass failed the most basic terrain contract: the player could not reliably see the surface the simulation was using.

Root causes identified:
1. Turf texture colour was multiplied by the same dark material colour.
2. Green/fringe rendering and physics did not use the identical surface definition.
3. Planar grass instances became obvious rectangular cards.
4. Shot simulation had no hard recovery path for an invalid / endless terrain state.
5. Course elevation was driven partly by low-value procedural undulation rather than a small number of legible golf-scale landforms.
6. Shadow coverage / bias could create large dark bands.

Builder round:
- repair albedo model
- rewrite elevation architecture
- align physical and rendered surfaces
- remove billboard grass
- add volumetric local turf
- harden physics
- center shadow field
- cap / reconnect golfer geometry
- widen stable camera composition

Critic question for next device pass:
"Can I trust what the ground is telling me before I hit the shot?"

Graduation requires YES.
