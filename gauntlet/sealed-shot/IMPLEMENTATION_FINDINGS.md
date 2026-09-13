# Step 1 implementation findings

2026-09-13. Addendum to the unmodified authoritative F-001–F-007 log in
`authority/IMPLEMENTATION_FINDINGS.md`. v1.2 remains CLOSED. No existing seed/key
bytes, sampling, polarity, predicate or gameplay semantics were revised here.

## F-008 — The existing course is procedural, not a data mesh

Inspected `prototype1/worldV2.js:135–604`, `round.js:1–34`, and `surfaces.js:1–134`
at baseline `4497fc90827ceda14ddf5d46f10b3ebccff7ec34`.

No serialized course package or authored featureId exists in the current runtime.
Grid heights/normals are lazily derived Float32 caches; out-of-grid height uses the
raw field. Replacing this with an invented mesh/exporter would exceed Step 1 and
could change contact. The newly declared Step 1 schema binds the **unchanged full
physics program artifacts** by content digest and the authored hole numerics by
explicit fixed-width encoding. The archive includes all field helpers, shaping,
bunker/tee/green parameters, surface classifier, grid/cache/interpolation/sweep
logic and surface response. It excludes rendering/ecology/material presentation.
This is an authoring artifact, not a runtime extraction or package loader.

The schema and numeric field order were previously required but not instantiated;
Step 1 explicitly authorizes freezing them now. Source-program hashes are raw
32-byte digests, not floating-point values formatted as text. Artifact closure is
checked independently. Exact source scopes/exclusions are in the schema and author
script. Changes to the declared schema/encoding require a schema version bump;
ordinary authored package changes produce new hashes with old artifacts retained.

Only three literal cup identities were authored, with an immutable named ledger.
No candidate set, surface-edge identity mapping, REST sentinel, feature tie-break,
band, occurrence tracker or hysteresis was installed. IDs are not inferred from
array order. Boundary vectors use **fixture-only labels**, not runtime assignments.

## F-009 — Cup capture is a compound distance/speed predicate

Actual code: `physics.js:149–217`, constants at `physics.js:5–20`.

| Test | Actual measured quantity and comparison | Units / polarity |
| --- | --- | --- |
| Admission | Cup exists, current supplied surface is exactly `green`, not already holed | Discrete prerequisites |
| Segment projection | Horizontal segment squared length `vv > 1e-8`; otherwise current x/z is tested. Closest point uses clamped dot/vv. | m², not a capture radius |
| Encounter envelope | `d = hypot(closestX-cup.x, closestZ-cup.z)`; if `d > CUP_RADIUS + BALL_RADIUS`, reset captureRejected/cupLipResolved and return false | m; increasing d is outside |
| Direct throat | `d < CUP_CAPTURE`, where capture = radius - ball radius + .0035 | m; increasing d is outside |
| Pace acceptance | `hypot(vel.x,vel.z) < 1.95-(1.95-.50)*pow(clamp(d/CUP_CAPTURE,0,1),1.62)` and not captureRejected | m/s; threshold depends on d; increasing speed rejects |
| Unsupported centre | `d < CUP_RADIUS-.0015 && horizontalSpeed < .12` | m AND m/s; separate alternative to normal capture |
| Lip response | Not cupLipResolved, speed > .12, and `(pos.x-cup.x)*vel.x + (pos.z-cup.z)*vel.z >= 0` | m/s AND m²/s; outbound/closest-approach guard |

Constants observed, **not retuned**: cup radius .053975 m, ball radius .021335 m,
capture .03614 m, lip overlap .07531 m. Arrival, pre-roll settle and swept post-roll
paths can call `_tryCup`. Existing captureRejected/cupLipResolved are physical
encounter state, not BoundaryContract episodes. They must not be casually reused as
occurrence counters. Successful capture sets holed/stopped, surface cup, velocity
zero and the physical state to cup x/z at `_groundY`; visual drop is elsewhere.

The spec's distance polarity remains correct, but treating the **whole** capture
condition as distance alone would drop speed-dependent physics. Later diagnostics
must retain these comparisons and their prerequisites, not replace them with one
new scalar. No measure transform, Q, epsilon, T/E or semantic subdivision chosen.

## F-010 — Rest uses horizontal linear speed, grade and resistance, not angular speed

Actual code: `physics.js:398–414` (pre-roll) and `physics.js:471–479` (post-roll).
Both execute repeatedly during roll, up to the existing 120 Hz fixed step rate.

Pre-roll rest requires:

```
hypot(vel.x,vel.z) < material.settleSpeed * 1.55
AND (grade < material.staticGrade
     OR G*(5/7)*grade/sqrt(1+grade*grade) < material.rollingDecel*.94)
```

It tries cup capture before settling. Post-roll uses the next surface, next frame,
and **1.35 instead of 1.55**, after motion, cup checking and any surface transition.
The quantities are horizontal speed (m/s), grade (dimensionless slope), and slope
acceleration versus rolling deceleration (m/s²). Increasing speed opposes rest;
grade/resistance determine whether rest is physically permitted. Neither check
compares `spinOmega` to a rest threshold. `spinOmega > 1` and spin-axis squared norm
> .001 only enable spin-to-roll coupling; they are **not** angular REST predicates.

Two rest sites are observed; they are not assumed to be two independent angular/
linear semantic identities. No `rest.linear`/`rest.angular` IDs were invented. Later
diagnostics must distinguish these sites before choosing bands/episode identities.
Water, cup capture, bounds, non-finite recovery and 26-second timeout also stop the
solver; they are not the ordinary rest threshold. No physics conjunction changed.

## F-011 — Surface classification is ordered analytic containment

Actual code: `worldV2.js:292–301`, `538–604`. Precedence is frozen by current code:
water → sand → green → fringe → tee → fairway → firstCut → rough.

| Classifier | Actual comparisons | Units / direction |
| --- | --- | --- |
| Water | `z < -12 && x > coastEdge(z) && terrainHeight(x,z) <= WATER_LEVEL+.015` | Three lengths (m), mixed polarity |
| Bunker | First authored bunker whose `hypot((x-b.x)/b.sx,(z-b.z)/b.sz) / warp <= 1` | Non-negative dimensionless; increasing is outside |
| Green/fringe | Minimum of separate warped elliptic metrics across greens, each `<= 1`, green tested first | Non-negative dimensionless; increasing is outside |
| Tee | Any ellipse with normalized dx²+dz² `<= 1` | Non-negative dimensionless squared metric; not the green/bunker metric |
| Fairway | Guard z <= 12 and z >= -252, then `abs(x-center)-organicWidth <= 0` | Signed metres; increasing is outside |
| First cut | Same signed distance `<= 2.35`, only after fairway fails | Signed metres; increasing is outside |

Bunker and green warps call atan2 and sin/cos. Current bunker overlap chooses the
first array match; green/fringe reduce to a scalar minimum and discard identity;
tee returns a boolean. **No candidate features or tolerance tie-break exist.** A
future lowest-authored-ID rule cannot be inserted now without changing behavior.
The signed fairway classifier needs evidence before any bin-aligned non-negative
transform is declared. Infinity sentinels in procedural calculations are not
authored numeric package fields and were not changed by finite-value serialization.

The contact grid's `u+v <= 1` triangle choice is a different predicate from
`courseSurfaceAt`; a triangle ID must not be substituted for a surface feature ID.
No global surface epsilon would describe all these quantities in the same units.

## F-012 — Evidence boundaries

- SEED CONTRACT VECTORS and COURSE HASH STABILITY are Step 1 gates, not production
  SEED INTEGRITY, BOUNDARY SAFETY, DETERMINISM, PURITY or REPLAY.
- Raw-bit parity has no rounding tolerance. It freezes a same-runtime solver-side
  oracle, not a full composition-root extraction comparison. EXTRACTION PARITY
  must later compare both pipelines with identical injected dispersion.
- Node v24.15.0 and Chromium 152 ran the byte vectors; browser reload repeated all
  results. WebKit/Gecko/physical iOS were not run in this session. The later full
  physics drift matrix is not claimed by these byte-encoding tests.
- No rest/capture/surface quantum, epsilon, sampling band, decisionTrace schema,
  episode/hysteresis or runtime feature-selection policy was added.

Next authorized step: **make dispersion injectable while preserving current
wall-clock behavior.** Stop after successful Step 1 publication.

## F-013 — Checkout representation is not a physics change

The clean baseline contains mixed/CRLF working files whose committed Git blobs are
LF (camera, equipment, feedback, game, round, surfaces, topoMap, world, vendor).
The new preservation fixture records both raw working SHA-256 and committed SHA-256,
and proves their equality after **CRLF-only** Git text normalization at authoring.
Its test uses Git-text comparison only on these ordinary text files. Previously
byte-protected solver, field, rig, clubface, assembly, ball and assets remain raw
byte comparisons. No production file or old gate was edited or normalized. New
fixture files use explicit LF checkout attributes so their digest locks are portable.

## F-014 — Closure provenance and runtime coverage qualification

The post-cutoff audit did not regenerate any fixture. It read each of 43 blobs
directly from immutable Integration 041 commit
`4497fc90827ceda14ddf5d46f10b3ebccff7ec34`, and verified every manifest SHA-256.
All 43 current raw working hashes also match the pre-Step-1 snapshot. The original
authoring command collected working bytes but refused to emit a baseline unless
they matched that exact commit (CRLF-only normalization for Git text; original
byte-protected files/assets compared raw). It cannot bless a modified game tree.
All 11 authority/schema/fixture/projection locks remain unchanged.

The SeedContract/BoundaryKey generator has only `node:fs` and `node:crypto` imports,
no dynamic imports/require/eval/Function, and no production-contract calls. Its
FNV/fmix path is locally implemented using BigInt modular arithmetic; its byte
writer uses Buffer. The standalone subject independently uses imul/DataView.
The course JSON read by that generator is authoring input, not executable code.

**COURSE HASH STABILITY is PENDING for the full required runtime matrix.** Actual
measured rows: Node v24.15.0 (V8) and Chromium 152 (V8), including browser reload.
WebKit, Gecko and physical iOS WebView were not run and remain explicitly pending.
This corrects an over-broad status label, not the gate assertion or contract.
No claim of every-runtime coverage is made. See `evidence/step1-provenance.json`.

F-009–F-011's predicate audit is preserved exactly. No Q/epsilon, runtime boundary
logic, sampling change, physics/visual change or Step 2 implementation occurred.
