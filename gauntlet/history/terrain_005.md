# Terrain 005 — LOFT Field V2

The prior course architecture had reached its ceiling.

Adding more texture and more polygons to stacked planes would not solve the real problem:
the ball, physics, and visible golf course were still negotiating between separate surfaces.

Integration 014 replaces that model.

The course is now one continuous authored height field.

Visual Y = physical Y.

Fairway, rough, green, fringe and sand are material identities on one terrain, not separate colliders pretending to be one piece of earth.

That is the foundation required for a believable golf world.

## New standard

LOFT terrain should feel:
- sculpted by geology
- refined by a course architect
- maintained by groundskeepers
- illuminated clearly enough to read
- stylized only in taste, not in physical logic

The player should never need to wonder whether a ball moved because of:
- a bug
- invisible geometry
- hidden collision
- a real slope

If the ball breaks, kicks, checks, rolls or hangs, the land under it must visually explain why.

## Physics principle

At golf-ball speed, endpoint collision is not enough.

A fast ball can travel more than half a metre in one 120 Hz step.

LOFT now solves terrain contact over the travelled segment and searches for the exact crossing point before resolving impact.

That is the new anti-tunneling baseline.

## World principle

The course should not be wallpaper behind the mechanic.

The course is the mechanic.

Elevation, lie, cut, vegetation, bunker shape, coast, wind and sightline all participate in the shot.

Integration 014 is the first build where the prototype world is being treated as a real LOFT world system rather than scenery around a swing test.
