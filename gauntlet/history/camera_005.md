# Camera 005 — Transform critic

Result: CRITICAL LOSS discovered before handoff.

Largest meaningful gap:
The golfer was rotating with the opposite sign from gameplay heading. The authored rig shoots down local -Z, while gameplay yaw uses positive +X for positive heading. Applying +yaw to the rig mirrored the golfer relative to the camera/target.

Why it mattered:
This produced the exact strange front-on and mirrored address angles visible in the user's iPhone screenshots.

Fix:
- golfer uses rigYaw = -aimYaw
- address-ball offset uses the same rigYaw
- camera and target continue using gameplay aimYaw
- character/camera composition is now invariant as heading rotates

Projection result:
At aim extremes ±0.98 rad, ball/head/feet remain at effectively identical NDC positions instead of wandering across the screen.
