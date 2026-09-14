# Sealed Shot implementation findings

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

## F-015 — Step 2 dispersion is a per-call raw-operand seam only

2026-09-13, Integration 043. Step 1 is accepted; nothing was regenerated.
The user explicitly approved publishing the unchanged original DOCX and original
F-001–F-007 findings archive alongside this latest addendum to LOFT GitHub main.

Signature: `launchShot(metrics, dispersion)`. The optional scalar is the raw
`Math.sin(performance.now()*.012)` operand, before `(1-L.form)` and the existing
putter `.18` / other-club `.75` factors. Tests supply finite scalars in [-1,1].
No new validation/clamping/coercion, callback source, global override or seed is
introduced. Omitted **or explicitly undefined** evaluates the same clock formula
at the original operand in the original statement. The ready guard still runs
first; club/level/lie and the left `(1-L.form)` factor still evaluate before the
clock. Even form=1 retains the clock read. All four call sites remain one-argument.
There is no production wiring for injected data or persistence between calls.

The pre-Step-2 source comes from immutable commit
`7fbb6b877954ebd652e6296f4828ce5e8271e008`; its complete game.js is equal to
Integration 041 `4497fc90827ceda14ddf5d46f10b3ebccff7ec34`. Test-only VM adapters
execute the actual old/current launch bodies, with the real unchanged GolfPhysics.
For fixed-scalar comparison, only the old sine operand is replaced by a supplied
test value, not a retyped path/quality/launch calculation. Raw F64 snapshots retain
signed zero and undefined presence. Reactions are checked as instrumented calls
and state, **not** a new browser visual review.

Step 1's 43-file preservation fixture remains unchanged. Its game.js check now
inverts **only** the two unique, exact authorized edits, then hashes the entire
reconstructed file against the original 041 digest. It is not a byte-equality
claim for current game.js and not a broad exemption. Deliberate formula, factor,
clamp, caller, UI and duplicate-seam mutations are rejected. All 42 other entries
still compare directly with the frozen raw/Git-text policy. Historical Step 1
evidence, projection, vectors and all 11 locks are untouched.

Evidence: 132/132 (105 existing + 19 Step 1 + 8 Step 2); 2,240 default pairs,
2,240 explicit-undefined pairs, 5,880 injected pairs, 5,880 clock-independent
repeats. Thirty paired trajectories use six legacy fixture configurations × five
levels with supplied metrics/scalars: all 15,901 fixed frames match exactly.
The six original frozen trajectories are separately verified by the Step 1 gate.
Full command/stdout/source hashes: `evidence/step2-node.json` and history 043.

Runtime: Node v24.15.0, V8 13.6.233.17-node.48, Windows x64. Chromium 152 initial/
reload byte evidence remains historical Step 1 evidence, not a Step 2 run. WebKit,
Gecko and physical iOS WebView remain PENDING. No every-runtime claim.

F-009–F-011 remain byte-for-byte unchanged: swept-distance + speed cup capture;
separate pre/post-roll speed/grade/resistance rest checks with no angular-speed
rest test; procedural surface classification, not triangle-ID classification.
No Q/epsilon, bands, feature candidates, REST identity policy, hysteresis or trace
schema was chosen. No frozen serialization/hash/sampling semantics changed.

Step 2 is closed. STOP before Step 3. Next authorized work: extract `resolveShot`
with native math untouched and injected dispersion, then structural PURITY.

## F-016 — Step 3 is a shared native pipeline, not a new simulation policy

2026-09-14, Integration 044. Resumed the existing partial extraction; did not
discard/restart it. Authority archives, F-009–F-011, all frozen fixtures and the
parity projection remain unchanged. v1.2 is CLOSED. No predicate, serialization,
hash, sampling, rounding, seed or MARGIN semantics were revised.

### Exact boundary

- `prototype1/shot/resolveShot.js`: shared `launchShotPhysics(physics,
  {metrics,c,L,lie,position,aimYaw,dispersion,dispersionSource})` contains the moved
  launch calculation and dispatch. `resolveShot(ShotIntent, Course)` constructs a
  fresh existing solver, launches through that function, advances its existing
  exported fixed step to rest and returns raw launch/trajectory/rest snapshots.
- `game.js`: imports/calls that launch function at the old launch site. It still
  performs the ready guard, club/level/lie lookup and ordinary reactions. The
  original `Math.sin(performance.now()*.012)` is supplied as a lazy source; injected
  scalar bypasses it. No second launch calculation or solver body remains there.
- `physics.js`: only the vector dependency import changes and existing `FIXED`
  becomes exported as `SOLVER_FIXED_STEP`. Entire arithmetic/class body preserved.
- `shot/solverVector.js`: constructor and 16 scalar methods copied from the exact
  checked-in vendor source; no Three.js import. Method bodies, operation order,
  defaults and `isVector3` prototype semantics match. MIT attribution retained.
- `shot/courseField.js`: exact numerical field scope moved into
  `createCourseField(ROUND_HOLES)`. Lazy Float32 height/normal caches, scratch contact
  sample, authored-derived arrays and helpers belong to that explicit instance.
  The browser world constructs one instance and reexports its same field methods;
  the server caller supplies a field instance. No new mesh/classifier/candidate IDs.
- `worldV2.js`: only factory import/bindings replace the moved scope. Renderer,
  material/ecology/terrain mesh construction and protected field contract labels
  remain unchanged. `surfaces.js` is still the exact shared response table/program.

The browser uses shared `launchShotPhysics` plus the same `GolfPhysics.step(dt)`.
It does **not** call synchronous whole-shot `resolveShot` at impact: precomputing
then replacing playback would be an adjacent timing/presentation change. Both
entry paths use one launch body and one solver class. Browser clocks, presentation,
frame scheduling, score/round reactions and cup drop animation stay in the caller.

### Explicit in-memory input/output, not a frozen record change

Current ShotIntent supplies `courseHash`, `holeIndex`, `ballRestPosition`,
`lieSurface`, resolved `club`, resolved `playerState`, `metrics`, `aimYaw`,
`environmentState.wind` and the injected raw `dispersion` scalar. Legacy metrics
retain their names (`loadScore`, `tempoScore`, `path`, `center`, `commitment`,
`rhythm`, plus power/speedScore/puttPaceFeet). The supplied Course carries matching
`courseHash`, authored `holes` and native field methods. A mismatched hash refuses.
This is an in-memory extraction adapter, not Step 6 submission/record serialization
or server trust validation. SeedContract remains fixture-only until Step 5.

Output is non-authoritative: quality/path, raw launchState, fixed-step trajectory,
last landingSurface and restState. A putt with no airborne contact legitimately
has `landingSurface: null`; actual rest surface/holed state is in `restState`.
No 1 mm rounding, decisionTrace, penalties/scoring schema or replay lifecycle yet.

### Purity and preservation evidence

12/12 Step 3 checks. Six native cases (full swing, iron, wedge, bunker, putt,
lip-putt) execute in a separate bare Node process using parsed VM modules and a
closed five-file graph. Forbidden global reads throw; clocks/randomness are denied;
dynamic imports/string compilation are denied. No Three.js, renderer, DOM/canvas,
browser globals, Node ambient process or mutable external gameplay state is used.
Frozen inputs stay unchanged; repeated/interleaved shots and independent course
instances are checked. Six case frame counts: 738, 849, 485, 575, 336, 17 (3,000).
Repeated fresh process matches raw state hashes. These are isolation checks, not
the later legacy-vs-extracted EXTRACTION PARITY gate.

`step3-preservation.mjs` reconstructs old files **from current moved bodies**, then
requires entire-file accepted ccb8873 hashes. It does not copy a baseline over the
current body or exempt an entire file. Game text returns to accepted Step 2; the
unchanged Step 2 inverse then returns to 041. Solver/field reconstruct exact raw
bytes. Existing gate adapters only account for these specific moves; numerical
assertions, thresholds, fixtures and projections are not loosened. Seven Step 3
deliberate timestep/predicate/binding/clock/caller/moved-math mutations fail closed.
All 43 original baseline entries and 11 frozen locks remain verified.

The initial vector subset omitted `distanceTo`/`distanceToSquared`, discovered by
the existing terrain gate. Restored their exact vendor bodies; did not edit that
test. Terrain now 14/14 and visual 37/37. A test mutation initially named a nonexistent
predicate variable; corrected the test target to actual `d<CUP_CAPTURE`, not physics.

### Why the single .gitattributes addition is necessary

`prototype1/shot/courseField.js -text whitespace=cr-at-eol` is the only new rule.
The moved file retains 219 CRLF + 263 bare-LF line endings, 17,813 bytes. Its raw
SHA-256 is `efd65bcbee3f651b455ba0120a1d7953e23987ad19de1153673719edd82a794e`;
normalizing to LF changes it to
`81d04a68f716fefaa4578663b445617c18d9d37e9dd702b7b9ade56f4cf97ff3`.
Without the rule, checkout conversion can invalidate exact reconstruction of the
raw-byte-protected world. It preserves provenance, not new math; the gate asserts
the exact two-line addition and no other attributes change. No file normalization.

### Closure and limits

Full gauntlet: **144/144** (105 existing + 19 Step 1 + 8 Step 2 + 12 Step 3).
Step 2 still checks 2,240 default + 2,240 undefined + 5,880 injected + 5,880 repeats,
30 trajectory pairs / 15,901 fixed frames. Its existing projection comparisons
remain historical regression checks, not a completed Step 4 gate.
Commands, stdout, source hashes and graph: `evidence/step3-node.json`; history 044.

Runtime: Node v24.15.0 / V8 13.6.233.17-node.48, Windows x64. Current in-app browser
smoke verifies normal render, flight/result/Next Shot, cup-tap/3-stroke PAR and Next
Hole to The Shelf; no warnings/errors reported by the tab log. Browser engine
version was not available through the read-only inspection scope, so no new engine
matrix claim. Historical Chromium 152 byte/reload evidence is retained, not rerun.
WebKit, Gecko, physical iOS WebView remain PENDING. Full COURSE HASH STABILITY
runtime matrix remains PENDING. No fresh visual critic scoring or retuning.

Step 3 passes. STOP after publication. Next authorized step: **Step 4 — EXTRACTION
PARITY through the frozen parity projection**. No tolerance or normalization may
hide extraction drift. No seeded dispersion, Q/epsilon, bands or authoritative
result work in this checkpoint.
