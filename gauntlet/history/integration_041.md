# Integration 041 — THE FLIGHT

Retained 2026-09-09. Camera / UI only after the 040 protection freeze.

## Scope and result

Normalized physical height owns camera pitch: open sky during ascent, hold through
apex, reveal the landing on descent. The release pose is captured and blended into
flight. Actual ball displacement carries the camera rig while its framing remains
damped. The existing hit-stop and 0.28 m punch remain unchanged.

Short-landscape flight distance is 4.2 m, versus 7.2 m for desktop/portrait, to keep
the actual protected ball readable without changing its scale or asset. An existing
trace crossing the camera eye plane is culled to prevent a screen-long streak.

Only the hole card's live distance-to-target survives flight, including roll. Round
and wind return at rest; object/level controls return with the normal Next Shot state.
This preserves the existing result receipt rather than overlaying equipment on it.

Deck Clear replaces visible instrument arrows with currentColor SVG paths, removes
rarity reads while retaining canonical tiers, fixes completed-stroke ordering and
separates +1 / TO PAR / 11 STROKES · PAR 10 in both phone orientations.

The first inline monochrome wordmark was **rejected by the user**: it was an
approximation, not the official logo. Removed it completely. Both headers now load
the unchanged `assets/loft-wordmark-official.webp`. The only supplied master has a
cream matte, so the Chronicle brand header uses cream; no transparent master or new
logo was invented. AGENTS.md now explicitly prohibits logo tracing/redesign.

## Critic rounds and rejected candidates

1. Height-driven pitch opened the sky, but damping world translation left the rig
   several metres behind the shot and the ball remained tiny. Rejected as incomplete.
2. Measured displacement carry improved ball size. A long trace crossing the eye
   plane was exposed in live frames and removed through camera visibility only.
3. Short-landscape ball still occupied about four pixels. A responsive closer rig
   now passes a minimum six-pixel apex diameter in all tested trajectories/aspects.

## Prior flight-only critic verdict

Scores describe the retained camera/UI sequence, not golfer or asset quality.
No new general visual critic pass was performed during the subsequent data request.

| Sequence | Before | Retained | Remaining limitation |
| --- | ---: | ---: | --- |
| IMPACT | 4.8 | 6.8 | Handoff is continuous; physical-device feel still needs observation. |
| FLIGHT | 3.0 | 7.1 | Ball now reads against open sky; protected low-detail world remains the ceiling. |
| LANDING | 5.0 | 6.3 | Target and bounce stay readable; destination context remains modest. |

The archived 038 camera fails every apex-sky case in the new matrix. It already
passes the numerical continuity envelope: do not claim the gate reproduced a hard
teleport. Live camera composition and the recorded-pose handoff motivated that fix.
Baseline comparison uses old camera with the current protected solver, not a full
historical UI build.

## Gates and live evidence

Full suite: **105/105** (visual 37, terrain 14, ball 6, assembly 1, atelier 5,
neck 4, forging 3, wedge sole 4, hinterland 3, putting 13, input 4, preview 4,
flight 7). No numerical/geometry gate was relaxed. The new logo source assertion
was corrected to enforce the user's official-asset requirement, not the rejected SVG.

Flight matrix: 3 holes × 7 airborne clubs × 2 stroke profiles × 3 aspects = 126
trajectories per timing run; 30/60/120 FPS delivery totals **378 trajectories /
166,269 frames**. The 30 FPS harness uses the existing .03 frontend time cap.

- APEX SKY: minimum terrain-ray sky coverage **68.77%**, optical **73.17%**.
- BALL FRAMING: worst whole-ball margin **9.057%**, above required 6.667%; actual
  apex ball diameter at least six vertical pixels in the tested viewports.
- UI SILENCE: pure policy plus launch/settlement wiring; live computed styles show
  only distance visible. Airborne and first-bounce screenshots inspected.
- CONTINUOUS IMPACT: exact beginFlight transform continuity. First 120 ms permits
  actual shot travel plus existing punch `.28 × 1.25 = .35 m`; angular envelope
  is `atan(.35/5.45) + 1.4375°`. Maximum observed step rotation **0.0694°**.

Live desktop, 390×844 and 844×390 release/apex/landing/rest were inspected; signal
height and ball height are exposed by opt-in capture fixtures. A real flight-live
sequence reached receipt, Next Shot, stroke 2, automatic SW selection, Bag, then
live scorecard with an empty warning/error log. Bogey Chronicle spacing is measured
and visually checked in both phone orientations. Latest landscape legibility was
also checked in the live renderer. Screenshots were viewed, not exported as files.

Protected full-file hashes for solver, field/cup, rig/landmarks, clubface/assembly,
ball factory/asset remain identical to the 040 freeze. `.gitattributes` prevents
checkout newline conversion from invalidating those literal byte checks.

## Continuation boundary

THE FLIGHT's runtime faults are closed within the tested matrix. Real iPhone
performance/feel and arbitrary lies are not proven by viewport/trajectory tests.
Normal entry has no fixture, no automated stroke and no frozen animation frame.

Next requested target is THE SHOT AS DATA, not more art or tuning. Read-only audit
found a requirements conflict: protected native Math operations do not guarantee
cross-engine bit identity forever. Await the user's numerical/runtime decision
before changing shot resolution. Preserve supplemental power/speedScore/pace and
form; six named gestures alone do not cover every existing launch input.
