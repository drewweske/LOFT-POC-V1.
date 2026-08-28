# Terrain 001 — Surface identity / rollout rebuild

User evidence:
The full-round prototype was playable, but the ball slid too far across essentially every geometry type and made otherwise good shots too difficult to control.

Critic verdict:
LOSS.

Largest meaningful gap:
Ground contact did not communicate golf-course material. The ball retained too much horizontal speed and lacked a robust static-settling model.

Rebuild:
- canonical surface property table
- tee / fairway / green / fringe / rough / sand / water
- per-surface restitution
- per-surface tangential impact retention
- per-surface rolling resistance
- per-surface static settling
- per-surface spin grip
- cut transition energy loss
- exact rendered fairway profile reused by physics
- shared bunker definitions
- physically playable fringe
- rendered green grade matched to putting grade
- fairway mowing character
- bunker lip / material separation
- restrained surface-transition sound

Primary design target:
A good shot should be rewarded by predictable golf-course behavior rather than punished by endless rollout.
