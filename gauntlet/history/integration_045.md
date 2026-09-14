# Integration 045 — THE SEALED SHOT / Step 4 EXTRACTION PARITY

2026-09-14. Step 3 was accepted; no extraction was restarted. Step 4 only.
Authority remains the byte-identical v1.2 FINAL DOCX and findings archives plus
the local findings addendum. No visual review or production work was authorized.

## Independent reference and scope

- Legacy oracle: accepted Step 2 commit
  `ccb8873f0eeac6fa910dc3f96d71506162fe94a9`.
- Extracted checkpoint: accepted Step 3 commit
  `bfbb386876c314d8b755f5ddd76efb2d16d23238`. `git ls-remote origin refs/heads/main`
  returned this exact SHA before implementation; the working tree was clean.
- `prototype1/`, `vendor/`, `.gitattributes`, all prior gate scripts, original
  authority, projection and frozen fixtures are unchanged. **No extraction fix.**
- Old Step 2 comparisons were insufficient as the Step 4 oracle because their
  two paths both use today's solver. They remain unchanged regression tests.

`step4-legacy-oracle.mjs` executes only immutable `git show <commit>:<path>` bytes
in its own VM module realm, in a child Node process. There is no production import
from the working tree, no fallback to current modules and no temporary worktree
whose files might accidentally resolve against the current checkout. Its parsed
allowlisted graph is old physics, surfaces, worldV2, round, equipment,
coastalHinterland and vendored Three. Every source SHA is checked against ccb8873.
The current resolver runs in a **different realm**, with its own five-file pure
graph. It cannot provide modules to the legacy linker.

The exact legacy `launchShot(metrics,dispersion)` prefix is taken directly from
old game.js through solver dispatch, stopping before `state.shot`/presentation.
Ready guard, club/level/lie reads, arithmetic, lazy clock fallback and launch order
are not rewritten. Original `playingHeight`/`surfaceAt` wrappers and the original
GolfPhysics constructor/setCup statement are likewise evaluated from old source.
Only explicit test inputs and a closing function brace are supplied by the adapter.
Presentation reactions remain covered by the unchanged Step 2 suite.

| Legacy source scope | SHA-256 |
| --- | --- |
| Full old game.js | c1254918ae22ab6b56c3f7c5e83b2fa3388c633522148740c3fb3f8b8cf1f7be |
| Full old physics.js | 3f3a446663b9fbd4bafd83bb4b93302f02f4cb7ec6d2d3d0f16712a01a9a7c76 |
| Full old worldV2.js | 4cefe0b45a267ca0266a1e4aaeadaeecd64f1eabdedd86ac84551c892eabb531 |
| Unedited launch prefix | 9dcbc3025c223803aaf49bb195c4d5753b837bfc6dd03cfac132e1d30526612c |
| Constructor/setCup scope | db28c565c50f04b3dd034fb5bd476ba44e9302817948b7ecb24163e74d8d0890 |
| Height/surface wrappers | 2436b081595d3fcf90192543ea5fb823a2a07cd43a9a13426a8b4a598eed78ac |

## Frozen projection and corpus

Projection **v1**, unchanged raw little-endian Float64 bits, including negative
zero, optional-field presence, activity and accumulator. SHA-256 before/after:
`11adea692e88a1636833e00688ceff2eda1d64c7e19904e2d06771975ceee906`.
No quantization, new fields, decimal comparison, tolerance or altered projection.

1. The original six `fixtures/parity-v1.json` solver inputs/expected outputs run
   independently through the ccb8873 solver and current solver. Full swing, iron,
   wedge, bunker, putt and lip-putt: **3,176 fixed frames**, plus launch and rest,
   exactly reproduce the existing frozen expectations. No generator was run.
2. Those fixtures start **after** gesture resolution. The new input-only companion
   `step4-inputs-v1.json` adds full-pipeline input cases, not new expected outputs:
   six base configurations × five existing levels × seven injected scalar bit
   patterns = **210 cases**. The three six-measurement profiles already used by
   Step 2 rotate across those cases. Frozen base position/cup/wind/club/power/path/
   pace/aim stay intact. Existing direct-solver form/strike/release values are
   still tested in layer 1; layer 2 resolves quality from its explicit gestures.
3. Resolved club/modifiers and initial contact height come only from ccb8873 data/
   field, then the **same deeply frozen ShotIntent object** is given to both paths.
   In-memory input SHA-256 is checked before/after both executions. Raw scalar
   bytes preserve -1, -.625, -0, +0, .25, Number.MIN_VALUE and +1. This test-only
   input provenance is not a ShotRecord serialization format.
4. All 210 cases repeat in reverse order with warmed independent field caches:
   **420 paired complete trajectories**. Each repeat is compared anew to the old
   implementation, as well as its initial digest. No expected output comes from
   extracted code.

Input companion SHA-256 (literal-locked by the new worker):
`011d8269d6eaed1613cab1703a8ec8d2cd8b550c7fafc69051e1848bcb4d2b51`.

The current resolver is called directly, not replaced with the browser helper.
A test-only observer around the isolated realm's existing launch/putt/step methods
calls each original method once and projects the **actual physics instance**.
The observer is restored in `finally`. Returned launch/trajectory/rest snapshots
are also projected using the actual observed activity/accumulator at that frame;
neither value is guessed or synthesized. No production diagnostic or decisionTrace.
Every projected frame is compared directly; SHA digests summarize evidence only.

## Extraction-risk audit

| Risk | Evidence |
| --- | --- |
| Vector semantics/order | Independent old r164 Vector3 versus extracted scalar subset; existing constructor/method source-preservation checks retained; all projected velocity/spin/position bits compared. |
| Course sampling/cache | Independent old module-global field versus explicit current course factory; same authored hole order; Float32 caches, scratch sample, triangle height/normal and native sweep preserved by exact source inverse; initial/reverse-interleaved trajectories match. |
| Launch arithmetic/dispersion | Exact old launch prefix, identical injected scalar and six gesture values; no clock read permitted during either shot path; every launch projection matches. |
| Timestep | Old native step and actual current resolveShot both use 1/120; each observed current step is asserted equal to that interval; actual accumulator/activity are included. No arithmetic/clamps reordered. |
| Collision/contact | Every step includes velocity, surface/last impact/transition, bounce/recovery flags; old full solver bytes versus reconstructed moved bytes remain identical. |
| Cup/rest/surface | Holed, lip, rejected capture, rest, surfaces and optional cupLipResolved presence are in the frozen projection. Native predicates are untouched. |
| Former ambient state | Same resolved club, player modifiers, lie, ball position, aim, wind, hole/cup and field bindings enter explicitly; inputs remain frozen; reverse order cannot leak prior shot state. |
| Browser path | Existing PURITY gate still proves one shared launch body and GolfPhysics implementation; default clock and reaction sequence remain checked by Step 2. No browser rendering or scheduling change. |

F-009–F-011 remain exactly intact: cup capture compares swept horizontal distance
and speed; rest has separate pre/post-roll speed/grade/resistance checks and no
angular-speed rest test; surface classification is procedural, not triangle-ID.
No Q/epsilon, candidate set, REST identity, boundary band or trace schema chosen.

## Attempts and measured result

First harness attempt failed **before any shot**: denying Math.random during
vendored Three import blocked its Object3D UUID initialization. This was an oracle
bootstrap error, not a projected shot mismatch. The untouched legacy library now
initializes normally; Math.random is denied immediately afterward, before any
shot. performance.now is denied throughout injected execution. No legacy source
or physics was changed. Six deliberate projected test corruptions are rejected
(activity, signed-zero accumulator, position, surface, holed and optional presence).

Standalone `node gauntlet/run-parity-gauntlet.mjs`: **8/8 PASS**, zero mismatches.
Full closure runner: **152/152 PASS**, zero failed suites (144 existing + 8 new).
The full run independently repeated the complete Step 4 comparison: **223,944
paired fixed frames**, plus launch/rest, and **224,784 returned-snapshot projection
comparisons**. Per-case/frame/source evidence: `evidence/step4-node.json`.

Initial-pass observed outcomes: 35 holed, 140 bounced, 250 surface transitions;
rest surfaces green 91 / fairway 75 / fringe 9 / cup 35. This corpus did not fire
lipTouched, captureRejected or recovery; their unchanged false/absent/present
values are compared, but branch coverage for those outcomes is **not claimed**.
This is extraction parity on the checked-in corpus, not the later adversarial
boundary/drift matrix. Existing putting/terrain gates remain unchanged and pass.

## Commands and runtime boundary

```powershell
node gauntlet/run-parity-gauntlet.mjs
node gauntlet/sealed-shot/run-step4-evidence.mjs
git diff --check
git diff bfbb386876c314d8b755f5ddd76efb2d16d23238 -- prototype1 vendor .gitattributes
```

The full runner executes all 144 existing assertions unchanged plus eight Step 4
checks, writing only new `step4-node.json`. Historical Step 1/2/3 evidence and all
11 authority/schema/projection/fixture locks are retained. It records complete
commands, output, source hashes, graphs and per-case input/projection hashes.

| Runtime | Evidence |
| --- | --- |
| Node v24.15.0 / V8 13.6.233.17-node.48 / Windows x64 | Step 4 same-runtime extraction comparison |
| Chromium 152 / V8 | Historical Step 1 bytes/reload only; no new Step 4 run |
| WebKit | PENDING |
| Gecko | PENDING |
| Physical iOS WebView | PENDING |
| Full required COURSE HASH STABILITY matrix | PENDING, not weakened |

Normal preview `http://127.0.0.1:43117/prototype1/` returned HTTP 200. No server was
restarted and no visual or physical-iPhone validation is claimed in this step.

## Publication / handoff

Commit only Step 4 test/evidence/history files, push to verified LOFT main using
ordinary fast-forward and verify remote SHA. Final commit/push SHA is reported in
the closure response (a commit cannot contain its own SHA).

**STOP before Step 5.** Next authorized step after acceptance: **install seeded
integer dispersion and then run SEED INTEGRITY**. No Step 5 implementation here.
