# Terrain 003 — Read What You Play

Integration 011 passed stability but failed complete terrain communication.

The key finding from device screenshots:
the physics surface and visible surface could be mathematically related while still being perceptually different.

New hard rule:
LOFT terrain is not complete until the player can predict the ball's break from the rendered landform.

Root-cause discovery:
custom fairway / green / bunker meshes were wound downward. Their normals were wrong.

Integration 012:
- repairs winding
- bakes restrained grade-dependent shading from the physical heightfield
- strengthens key light / reduces flattening fill
- removes low-speed false creep
- protects tap-in camera
- replaces electronic feedback with material-based golf sound design

Critic question:
"Before I hit, can I see the shot the ground is asking for?"

Sound critic question:
"With my eyes closed, does the contact sound like golf or like a mobile UI?"

Both must pass before terrain / feedback graduate.
