# Camera 003 — Portrait framing critic

Artifact:
Projection-calibrated intelligent camera.

Result: PROVISIONAL PASS; device feel still required.

430×932 portrait projection checks:

Address:
- ball NDC ≈ (0.42, -0.32)
- golfer head ≈ (-0.14, 0.29)
- feet ≈ (-0.18, -0.34)

Swing lock:
- ball NDC ≈ (0.52, -0.34)
- golfer head ≈ (-0.19, 0.46)
- feet ≈ (-0.24, -0.39)

All critical golfer + ball landmarks remain inside frame with margin.

System behavior:
- horizontal ready-state camera drag now sets shot heading
- golfer rotates and repositions around the fixed ball
- vertical drag adjusts camera pitch
- pinch adjusts distance
- The Line drag adjusts distance only
- swing touch locks the camera to the ball
- camera transforms are ignored during the stroke
- impact transitions to flight camera
- result camera focuses the lie instead of giant empty ground
- contextual FOV changes by state

Largest remaining gap:
Real iPhone touch/camera feel.
