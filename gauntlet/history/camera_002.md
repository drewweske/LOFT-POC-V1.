# Camera 002 — Projection critic

Artifact:
First ball-lock / camera-driven-aim implementation.

Result: LOSS before device handoff.

Largest meaningful gap:
The initial free-address composition looked too far through the ball toward the course. Mathematical projection on a 430×932 portrait viewport placed the ball outside horizontal NDC bounds (x ≈ 1.45), recreating the same composition risk seen in the screenshots.

Next builder:
Camera Builder.

Next artifact:
Recompose both free address and swing lock using explicit portrait framing tests.
