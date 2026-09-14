# Integration 044 — THE SEALED SHOT Step 3 / PURITY

2026-09-14. Resumed the dirty Step 3 tree and retained the partial resolver.
Verified LOFT root/remotes; accepted Step 2 anchor:
`ccb8873f0eeac6fa910dc3f96d71506162fe94a9`.
Authoritative original v1.2 FINAL DOCX and original findings are unchanged under
`gauntlet/sealed-shot/authority/`; latest clarifications are F-016 in the addendum.
No Step 1/2 restart. No Step 4 gate, visual work, physics retune or scope expansion.

## Verdict

**PURITY PASS. Full gauntlet 144/144, zero failed suites.** Native launch/solver/
field math preserved. No new gameplay/visual behavior intended or observed in
existing gates and live smoke. This does not claim cross-engine physics equality
or the later full legacy-vs-extracted comparison through the frozen projection.

| Suite | Pass count |
| --- | ---: |
| Atelier | 5/5 |
| Ball | 6/6 |
| Club assembly | 1/1 |
| Club forging | 3/3 |
| Club neck | 4/4 |
| Flight | 7/7 |
| Hinterland | 3/3 |
| Preview | 4/4 |
| Putting | 13/13 |
| Stroke input | 4/4 |
| Terrain | 14/14 |
| Visual regression | 37/37 |
| Wedge sole | 4/4 |
| Sealed Shot Step 1 | 19/19 |
| Dispersion Step 2 | 8/8 |
| Purity Step 3 | 12/12 |

## Files / minimal extraction boundary

- `prototype1/game.js`: import and call shared launch function only. Guard, lookups,
  wall-clock source, reaction timing, presentation and incremental stepping stay.
- `prototype1/physics.js`: vector import replacement + export existing FIXED only.
- `prototype1/worldV2.js`: native field scope moved to factory; rendering untouched.
- `prototype1/shot/resolveShot.js`: canonical `resolveShot(ShotIntent, Course)` and
  shared `launchShotPhysics(physics, {metrics,c,L,lie,position,aimYaw,dispersion,dispersionSource})`.
- `prototype1/shot/solverVector.js`: constructor + 16 exact vendor scalar methods.
- `prototype1/shot/courseField.js`: explicit per-course native field/cache closure.
- `.gitattributes`: one raw-byte rule for the relocated mixed-newline field; strict
  necessity and exact byte counts/hashes recorded in F-016. No unrelated rule.
- `gauntlet/run-flight-gauntlet.mjs`, `run-sealed-shot-gauntlet.mjs`,
  `run-dispersion-gauntlet.mjs`: exact relocation-aware preservation adapters;
  current real extracted launch injected into the old Step 2 test VM. No numerical
  assertion, threshold, frozen projection, fixture or expected result changed.
- `gauntlet/run-purity-gauntlet.mjs`: 12 new structural/execution/provenance checks.
- `gauntlet/sealed-shot/step3-preservation.mjs`: exact inverse movement proof.
- `gauntlet/sealed-shot/step3-purity-worker.mjs`: separate bare-Node hostile realm.
- `gauntlet/sealed-shot/run-step3-evidence.mjs`: full current runner; writes only
  `gauntlet/sealed-shot/evidence/step3-node.json` (checked-in measured evidence).
- Documentation: this history, `GAUNTLET_STATE.md`, `gauntlet/STATE.md`,
  `gauntlet/sealed-shot/README.md`, `gauntlet/sealed-shot/IMPLEMENTATION_FINDINGS.md`.

No edits to UI/CSS/HTML/camera/feedback/rig/clubface/cup/ball/assets/stats/round/
surface response. No solver arithmetic, timestep or protected contract edits.
No networking, MARGIN, seed, quantization, boundary band or trace implementation.

## Structural PURITY

Closed parsed module graph:

```
resolveShot.js -> solverVector.js
              -> physics.js -> solverVector.js
                            -> surfaces.js
courseField.js (standalone factory, supplied explicitly as Course)
```

Worker runs source modules unchanged using native Node VM modules. Imports outside
these five files fail; dynamic imports/string compilation fail. Reads of window,
document, navigator, canvas, THREE, performance, Date, process, require, fetch,
timers and animation frame throw; Math.random throws. No forbidden reads occurred.
This test flag is Node harness-only; production is ordinary ESM with no dependency.

Six cases execute to raw rest: full swing 738 frames, iron 849, wedge 485, bunker
575, putt 336, lip-putt 17; total 3,000 per primary run. Identical fresh-process
hashes, unchanged frozen inputs, interleaved calls and independent field instances
are asserted. Hashes are recorded in `step3-node.json`, not frozen expected values
or a replacement parity corpus. Native raw snapshots are not an authoritative
ShotResult format. Putts may have no airborne landing; rest surface remains exact.

Browser delegates to the same launch body and existing solver, keeping its
`step(dt)` accumulator at the original frame site. It does not switch to synchronous
whole-trajectory precomputation at impact. There is one GolfPhysics class and one
pathNoise calculation in production. Explicit aim reads and lazy dispersion retain
the established launch path. No second physics copy in game.js.

## Preservation / independent anchors

The inverse reads **current** moved implementation bodies and returns full accepted
source bytes, not a baseline copied over changed code. Required SHA-256 values:

| Reconstructed accepted Step 2 file | SHA-256 |
| --- | --- |
| game.js, Git text | `c1254918ae22ab6b56c3f7c5e83b2fa3388c633522148740c3fb3f8b8cf1f7be` |
| physics.js, raw bytes | `3f3a446663b9fbd4bafd83bb4b93302f02f4cb7ec6d2d3d0f16712a01a9a7c76` |
| worldV2.js, raw bytes | `4cefe0b45a267ca0266a1e4aaeadaeecd64f1eabdedd86ac84551c892eabb531` |

Anchored against immutable ccb8873 Git blobs. Step 2's unmodified inverse then
restores Integration 041 `4497fc90827ceda14ddf5d46f10b3ebccff7ec34`. All 43 original
baseline entries remain verified, including the exact inverse of the necessary
flight-test import/hash adapter. All 11 frozen artifact locks unchanged.
Seven Step 3 negative mutation probes reject timestep, cup comparison, factory
binding, clock, live step, moved launch scale and moved field width changes.
Constructor and all 16 vector methods match vendor source bodies; prototype marker
semantics match. No tolerance and no frozen parity projection edits.

Existing Step 2 coverage remains: 2,240 default pairs, 2,240 explicit undefined,
5,880 fixed-scalar pairs, 5,880 clock-independent repeats, 30 paired trajectories
and 15,901 fixed frames. All existing launch/reaction comparisons still pass.
These existing checks are retained, not labeled a completed Step 4 gate.

## Failures found and repaired

1. Initial scalar subset lacked `distanceTo` used by terrain's existing velocity
   comparison. Added only vendor-exact distanceTo/distanceToSquared. Did not change
   the terrain test or broaden vector behavior. Terrain and visual now pass.
2. New mutation probe initially named nonexistent `speed<limit`; corrected its
   test target to actual `d<CUP_CAPTURE`. No runtime correction/retuning needed.

No current regression found. F-009–F-011 preserved exactly: cup capture is swept
distance plus speed; rest has separate pre/post-roll speed/grade/resistance checks
and no angular-speed rest test; surfaces are procedural, not triangle-ID based.
No Q/epsilon, candidates, REST identity, hysteresis or decisionTrace schema chosen.

## Commands and measured evidence

From LOFT root, using Node v24.15.0:

```powershell
node --experimental-vm-modules gauntlet/sealed-shot/step3-purity-worker.mjs
node gauntlet/run-purity-gauntlet.mjs
node gauntlet/sealed-shot/run-step3-evidence.mjs
git diff --check
```

`run-step3-evidence.mjs` runs all 16 listed suite commands and records each command,
source digest, stdout/stderr, exit status, pass count, graph, raw case hashes,
preservation hashes and pending runtime rows. Historical Step 1/2 evidence was
not overwritten. All prior fixture/projection generators remain uncalled.

Live in-app browser smoke at `http://127.0.0.1:43117/prototype1/`:

- Normal rendered tee scene at 1280×720 confirmed.
- `?gauntlet=flight-live`: real launch to rest, PURE / 26 YDS / fairway receipt;
  clicked Next Shot, reached stroke 2 / SW / ready targeting.
- `?gauntlet=cup-tap`: HOLED / COMPLETE and 3 STROKES / PAR; clicked Next Hole,
  reached THE SHELF / 02 STROKE 1 / tee.
- Tab warning/error log returned empty. No fresh art review or subjective scores.
- Old local preview process was absent after cutoff; restarted the existing
  loopback-only `gauntlet/serve.mjs 43117 127.0.0.1`, hidden. No server code or
  firewall changes, no new hosting. Normal playable route remains available.

| Runtime evidence | State |
| --- | --- |
| Node v24.15.0, V8 13.6.233.17-node.48, Windows x64 | PASS all current gates |
| Current Codex in-app browser | Playable smoke PASS; engine version unavailable from inspection scope; not a drift matrix |
| Chromium 152 / V8, original Step 1 byte/reload checks | Historical PASS retained, not rerun this step |
| WebKit | PENDING |
| Gecko | PENDING |
| Physical iOS WebView | PENDING |
| Full required COURSE HASH STABILITY runtime coverage | PENDING, not weakened |

## Handoff

Commit/publish this complete Step 3 checkpoint to verified LOFT `main`, ordinary
fast-forward only. Exact committed SHA and remote verification are reported in
the closure response (a commit cannot contain its own final SHA).

**STOP before Step 4.** Next authorized action: **EXTRACTION PARITY through the
frozen parity projection**. If it fails, fix/revert the extraction, never loosen
the oracle, retune physics or normalize differences away.
