# Integration 043 — The Sealed Shot Step 2 closure

2026-09-13. Dependency seam only, on accepted Step 1 commit
`7fbb6b877954ebd652e6296f4828ce5e8271e008`. No Step 3 work. The user explicitly
approved publication of the original governing documents and accumulated Step 1
+ Step 2 checkpoint to the verified LOFT origin's `main`. Normal fast-forward
push only. The implementation commit is discoverable with
`git log -1 --format=%H -- gauntlet/history/integration_043.md`.

## Implemented seam and unchanged behavior

`prototype1/game.js:833`: `launchShot(metrics, dispersion)`.

`dispersion` is an optional **raw sine operand**, not scaled path noise. Undefined
(including omitted) keeps `Math.sin(performance.now()*.012)` in the original
multiplication statement, after the ready guard, club/level/lie and left form
factor evaluation. All four live/QA callers still omit it. Form=1 still reads the
clock. Zero and negative zero are actual injections, not fallback values. No
callback API, mutable global, production seed, validation/coercion, or defaults
evaluated before the ready guard were added.

The existing `(1-L.form)` factor, `.18/.75` scales, clamp bounds, gesture weighting,
quality/form penalties, direction, solver input objects, reaction order, camera,
UI and timeout callback are unchanged. Native solver/field/contact/rig/cup/ball/
clubface/equipment/bag/tier/swing-control/MARGIN behavior is untouched.

## Preservation provenance and strict exception

The full pre-Step-2 game.js is read from Git commit `7fbb6b8`, and independently
asserted equal to immutable Integration 041 `4497fc9`. Canonical Git-text SHA-256:

- Before: `36af652ce5836c28f8a2cbde3542c7c0c20d8c3095338c91714ef16b25bd3290`.
- After: `c1254918ae22ab6b56c3f7c5e83b2fa3388c633522148740c3fb3f8b8cf1f7be`.
- After exact inverse seam: the same before SHA-256.

Step 1's preservation fixture was **not** rebaselined. Its final gate now calls
the test-only `undoStep2Seam` for game.js alone: both exact replacements must occur
once, with no old version coexisting. Then the entire restored source must match
the original 041 digest. The other 42 manifest entries compare directly under
their unchanged raw/Git-text policy. This does not claim current game.js bytes
are unchanged. Mutation probes verify that formula/factor/clamp/caller/UI changes
and a duplicate seam cannot hide behind the exception. All 11 frozen locks and
all historical Step 1 evidence remain untouched. The standalone vector generator
and frozen parity projection have no edits. An independent read-only audit also
verified all 43 manifest hashes directly against the 041 Git blobs.

## Executable proof

The harness executes actual old/current composition-root launch functions, not
copies of the launch math. The injected old oracle substitutes only the sine
operand with a supplied test value. Presentation dependencies are instrumented;
the solver and terrain are real. This is **not** structural PURITY, an extraction,
new browser visual evidence, or a production ShotResult/record/replay format.

| Proof | Exact coverage |
| --- | --- |
| Default/live | 2,240 comparisons: 8 clubs × 5 levels × 7 lies × 8 clock values |
| Explicit undefined | Same 2,240 cases, identical to omitted/legacy behavior |
| Injected scalar | 5,880 comparisons: 8 clubs × 5 levels × 7 lies × 3 gestures × 7 scalars |
| Clock independence | Same 5,880 injections repeated with changed clock; clock read throws if attempted |
| Evaluation order | Club/lie/form before clock, form=1 still samples, non-ready guard does no dependency work |
| Per-call isolation | An injected sample cannot leak into the following default call |
| Trajectory preservation | 6 legacy fixture configurations × 5 levels = 30 pairs, 15,901 paired fixed frames |
| Protected scope | 42 direct matches, exact inverse game seam, no additional production file |

Scalars include -1, -.625, -0, +0, .25, Number.MIN_VALUE and +1. Gesture cases
exercise both path-clamp edges and imperfect/clean strikes, with putt pace absent,
sub-foot and long. Snapshots preserve raw IEEE-754 values, signed zero and optional
field presence; compare solver inputs, real launch state, shot state, feedback/
camera/UI calls and deferred callback. The 30 trajectories use supplied gesture
metrics/scalars, not the six original frozen trajectory inputs. The Step 1 suite
separately verifies those six originals and 3,176 fixed frames unchanged.

## Full gauntlet

Command from repository root (Node installed at `C:\Program Files\nodejs\node.exe`):

```
node gauntlet/sealed-shot/run-step2-evidence.mjs
```

**132/132 PASS, 0 failed suites**: atelier 5, ball 6, club-assembly 1,
club-forging 3, club-neck 4, flight 7, hinterland 3, preview 4, putting 13,
stroke-input 4, terrain 14, visual 37, wedge-sole 4, sealed-shot 19, dispersion 8.
The old 105 checks are unchanged. All Step 1 fixtures are unchanged; its final
preservation check has the documented exact-seam exception only.

`gauntlet/sealed-shot/evidence/step2-node.json` records command, source SHA-256,
stdout/stderr, exit code and pass count for every suite, exact pair/frame counts,
game before/after/inverse hashes and all 11 frozen artifact hashes. Tests never
regenerate expected values. Historical `step1-node.json`, `step1-browser.json`
and `step1-provenance.json` are retained unchanged. The Step 1 authoring/provenance
tools remain historical pre-seam tools; do not rerun them to bless the new tree.

Additional closure checks: `node --check prototype1/game.js`, new test-module
syntax checks, `git diff --check`, exact original-document SHA-256 comparison.
The running ordinary preview returned HTTP 200 at `/prototype1/`; its game.js
response contains the current seam. No QA mode, camera or visual change was made.

## Runtime matrix and predicate findings

| Runtime / engine | Evidence |
| --- | --- |
| Node v24.15.0 / V8 13.6.233.17-node.48 / Windows x64 | Current full 132-check and Step 2 launch/trajectory run |
| Chromium 152 / V8 | Historical Step 1 byte-contract 48/48 initial and reload, not re-run in Step 2 |
| WebKit | PENDING |
| Gecko | PENDING |
| Physical iOS WebView | PENDING |

COURSE HASH STABILITY remains **PENDING full required runtime coverage**. No
every-runtime, cross-engine physics identity or physical-device pass is claimed.

F-009–F-011 are unchanged: cup capture compares swept distance **and speed**;
rest has separate pre/post-roll speed/grade/resistance checks and **no angular-speed
rest test**; surface classification is ordered procedural containment, **not
triangle-ID based**. No Q/epsilon, feature candidates, REST semantics, band,
hysteresis or decisionTrace policy was selected.

## Exact changed files in Step 2

1. `prototype1/game.js` — signature, optional operand and one explanatory comment only.
2. `gauntlet/run-sealed-shot-gauntlet.mjs` — exact inverse-seam exception; fixture unchanged.
3. `gauntlet/run-dispersion-gauntlet.mjs` — eight Step 2 proof checks.
4. `gauntlet/sealed-shot/step2-preservation.mjs` — strict two-edit inverse and immutable pre-Step-2 commit.
5. `gauntlet/sealed-shot/run-step2-evidence.mjs` — full-suite runner; writes Step 2 evidence only.
6. `gauntlet/sealed-shot/evidence/step2-node.json` — actual execution evidence.
7. `gauntlet/sealed-shot/IMPLEMENTATION_FINDINGS.md` — F-015 only plus addendum title; F-009–F-011 preserved.
8. `gauntlet/history/integration_043.md` — this closure record.
9. `GAUNTLET_STATE.md` — canonical continuation and resolved publication approval.
10. `gauntlet/STATE.md` — checkpoint summary.

## Governing documents included in accumulated publication

Already committed in Step 1, retained without regeneration and approved for main:

- `gauntlet/sealed-shot/authority/LOFT The Sealed Shot Executable Spec v1.2.docx`:
  `c207a3f6c7c3b8250ea54f9078290f46a395c551b7a2f73b729e4ed6e67678fd`.
- `gauntlet/sealed-shot/authority/IMPLEMENTATION_FINDINGS.md` (original F-001–F-007):
  `092c264903f714fa28ddb00f598341f51548ccba658bc4ae1ebbc1918d761950`.
- `gauntlet/sealed-shot/IMPLEMENTATION_FINDINGS.md` carries the latest append-only
  implementation findings through F-015; original authority remains intact.

Both archive hashes were directly compared with the original Downloads attachments
at closure and matched. The DOCX was not re-exported or edited. v1.2 remains CLOSED.

## Stop and next authorization

Step 2 is complete. Commit and publish accumulated Step 1 + Step 2 to LOFT `main`,
then **STOP before Step 3**. Next authorized work after closure:
**extract resolveShot with native math untouched and injected dispersion, then run
structural PURITY**. Per F-003, the eventual signature is
`resolveShot(ShotIntent, Course)`. No extraction, production seed, authoritative
result, MARGIN change or boundary implementation occurred in this checkpoint.
