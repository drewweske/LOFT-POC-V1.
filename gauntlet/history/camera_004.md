# Camera 004 — State-machine rewrite

Result: WIN versus Camera 003 architecture.

Largest meaningful gap found:
Camera 003 still behaved like one blended camera with state-specific formulas. It allowed residual offsets and user input paths to leak between aiming, swinging, flight and result.

Build response:
- explicit AIM / SWING_LOCK / FLIGHT / RESULT modes
- state-specific input permissions
- state-specific distance, pitch, FOV and damping
- floor protection
- stable world-up / horizon
- automatic flight heading with capped yaw response
- semi-free result inspection only after landing
- no user camera transforms during swing or flight
