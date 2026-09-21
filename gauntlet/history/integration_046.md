# Integration 046 — THE SEALED SHOT / Step 5 SEED INTEGRITY

2026-09-20. Resumed the existing dirty audit/decision/implementation; Step 5 only.
Accepted base and verified remote main before closure:
`0bfee37c7c2f4ba919d3676e457ca363515d652d`. Local branch:
`prototype-1-gauntlet`. Publication destination: verified LOFT origin `main`,
ordinary fast-forward `git push origin HEAD:main`, never force push.

## Authority / historical omission

Original v1.2 FINAL DOCX and original findings archive remain byte-identical.
F-018 and `step5_contract_audit.md` preserve the omission discovered before
production seeded dispersion. Creator Decision Record 002 supplied the missing
mapping; the audit is appended with its resolution, not erased. A later creator
clarification fixed physical-shot ordinal semantics independently of scoring.

Mapping (initial solverVersion=1; not SeedContract v2):

```javascript
const u = (shotSeed >>> 0) / 4294967296;
const dispersion = 2 * u - 1;
```

| Word | Exact output |
| --- | --- |
| 0x00000000 | -1 |
| 0x40000000 | -0.5 |
| 0x80000000 | +0 |
| 0xC0000000 | 0.5 |
| 0xFFFFFFFF | 0.9999999995343387 |

No second PRNG, draw, hash/domain word, seed argument or mutable random state.
Any later dispersion mapping/sampling change requires solverVersion bump.
SeedContract v2 remains reserved for commit-reveal/serverNonce.

## Production path and identity lifecycle

`game.js` derives once, after ready guard and before accepted launch, from:

- `playerId='prototype-local-player'`, fixed and prototype-local.
- `roundId='prototype-local-round-'+roundSequence`, sequence starts at zero and
  advances only on RUN IT BACK. Reload intentionally starts over at zero.
- Existing zero-based `state.holeIndex`.
- Separate zero-based `state.strokeIndex`, physical launches in this hole.
  `startHole()` resets it. Successful launch increments it before presentation
  reactions. Cancelled, guarded and failed launches do not increment it.

Penalties still increment only `state.strokes`. Scoring is neither repurposed nor
used as seed ordinal. No storage, accounts, global uniqueness or networking.

Shared `shot/seedContract.js` encodes raw UTF-8 (no NFC, unpaired surrogates refuse),
uint32 LE byte lengths, round/player bytes, uint32 LE hole/stroke. Frozen
FNV-1a then fmix32 produces the single `shotIntent.shotSeed`. Integer mixing is
audited separately from UTF-8 byte encoding and the approved signed adapter.

Browser incremental play and bare-Node resolution use the same mapper and
`launchShotPhysics`. Normal `resolveShot(ShotIntent,Course)` reads only
`ShotIntent.shotSeed`; raw `dispersion` properties are never read, cannot override
a valid seed, and do not rescue a missing/invalid seed. No seed is derived again
inside resolution. `performance.now()` still serves untouched gesture/render
timing elsewhere; it is absent from the production dispersion path.

The native expression is unchanged:
`(1-L.form)*(dispersion===undefined?dispersionSource():dispersion)*(c.head==='putter' ? .18 : .75)`.
All factors, quality/path clamps, aim reads, launch order and solver inputs after
that raw source remain intact. Solver/timestep/contact/cup/rest/surface files,
vector layer, course sampling/cache code, stats and visual assets are untouched.
Only the explicitly authorized sine-to-discrete sampling change affects shots.

## Preservation / historical regression adapters

`step5-preservation.mjs` applies exact unique inverse substitutions to current
game/resolver source and checks accepted Step 4 Git hashes. It does not replace
whole files with baseline code. Existing Step 3 and Step 2 inverses then restore
the Integration 041 43-file manifest. Deliberate mutations to ordinal mapping,
reset, increment, source callback, math and unrelated behavior fail closed.

Old phase-specific tests needed explicit adapters, not waived assertions:

- Step 2's clock-default comparisons now label and execute the exact inverse
  historical browser wrapper. Numeric/reaction/trajectory assertions and counts
  remain intact. They do **not** claim that current production reads a clock.
- PURITY checks the current seeded implementation and a historical injected
  implementation in distinct closed test realms, with six pure module sources.
- `step5-test-adapter.mjs` replaces exactly one unique launch argument in
  test-loaded resolver source: seed callback → existing raw injected operand.
  All remaining current source runs as is. Production imports no test adapter
  and receives no new override authority. This avoids copying a second resolver.
- Step 4's non-frozen loader admits the new pure seed dependency and explicit
  launch test adapter; scope audit now permits only exact Step 5 source edits.
  Comparator, reference implementation, corpus, projection, expected outcomes
  and every numerical assertion are unchanged.

Frozen projection v1 SHA-256:
`11adea692e88a1636833e00688ceff2eda1d64c7e19904e2d06771975ceee906`.
Frozen input corpus SHA-256:
`011d8269d6eaed1613cab1703a8ec8d2cd8b550c7fafc69051e1848bcb4d2b51`.
Independent legacy oracle still loads only accepted Step 2 Git objects at
`ccb8873f0eeac6fa910dc3f96d71506162fe94a9`. Oracle source is byte-identical.
All accepted Step 1–4 evidence/fixtures and both authority archives are unchanged.

## Exact executable evidence

Command: `node gauntlet/sealed-shot/run-step5-evidence.mjs`.
Individual commands/source hashes/stdout/stderr and reports are checked in at
`gauntlet/sealed-shot/evidence/step5-node.json`. It writes only the new Step 5
evidence; no previous evidence or expected fixture is regenerated.

**172/172 PASS; 19 suites; zero failed suites.**

| Suite | Passed |
| --- | ---: |
| atelier / ball | 5 / 6 |
| club assembly / forging / neck | 1 / 3 / 4 |
| flight / hinterland / preview | 7 / 3 / 4 |
| putting / stroke input / terrain | 13 / 4 / 14 |
| visual / wedge sole | 37 / 4 |
| sealed-shot Step 1 | 19 |
| historical dispersion | 8 |
| PURITY | 12 |
| historical extraction parity | 8 |
| SEED INTEGRITY | 13 |
| prototype seed lifecycle/context | 7 |

- All **11** independent Step 1 seed vectors match canonical bytes, FNV word,
  fmix word and seed; all **5** mapping edge vectors pass exactly.
- **11,000** repeated context derivations; four independent single-field mutation
  fixtures. This is not a claim that a 32-bit hash is collision-free.
- Two fresh seed-worker processes produce bit-identical reports. Each runs
  **30 cases** (six shot families × five edge seeds), **120** normal seeded
  resolutions, **30** mapped-scalar launch comparisons, **24** invalid-seed
  refusal probes, frozen inputs and reverse-cache repeats. One case pass totals
  **14,996** fixed frames. Complete raw-result f64 digests, not quantized outputs.
- Actual game lifecycle source executes with inert presentation adapters and
  real field/physics. Penalty/no-penalty sequences produce identical physical
  seed tuples; hole reset, round restart, cancellation and rejection checks pass.
- One actual live launch-adapter/Node resolver comparison: **639 frames**, seed
  **3692739324**, identical launch/trajectory/rest; no browser engine is inferred.
- PURITY **12/12**: six normal seeded and six historical injected cases, repeated
  in fresh processes; closed graph resolver/seed/vector/physics/field/surfaces,
  no browser/render/clock/random globals, per-course cache isolation.
- Historical Step 2: **2,240** default + **2,240** undefined + **5,880** injected +
  **5,880** repeats; **30** trajectory pairs / **15,901** frames.
- Historical Step 4: **420** pairs / **223,944** frames, **224,784** returned
  snapshot comparisons, **zero mismatches**. Six original reference cases still
  cover **3,176** fixed frames. No extraction repair or tolerance introduced.
- An independent read-only agent reran SEED INTEGRITY 13/13 and context 7/7 and
  found no blocking defect in production scope, lifecycle or test isolation.
- New context-harness bootstrap failures (missing test constants and wrong club
  identifier) were repaired only in test setup. No physics/test threshold changed.

## Runtime / availability, not visual criticism

| Runtime / check | Actual status |
| --- | --- |
| Node v24.15.0 / V8 13.6.233.17-node.48 / win32 x64 | PASS, current execution |
| Chromium | Historical Step 1 evidence only; no fresh runtime claim |
| Embedded-browser smoke | UNAVAILABLE: kernel assets initialization, os error 3 |
| Existing normal preview | HTTP 200 at http://127.0.0.1:43117/prototype1/ |
| Repository non-interactive preview gate | 4/4 PASS |
| WebKit / Gecko / physical iOS WebView | PENDING |
| Full COURSE HASH STABILITY runtime matrix | PENDING |

The absent local preview process was restarted using the existing LOFT-only
`gauntlet/serve.mjs 43117 127.0.0.1` in a hidden window. No server code, binding,
firewall or production change accommodates the embedded-tool failure. No new
browser-testing replacement or runtime claim; no visual critic pass.

## Exact changed-file inventory

Production (only):

- `prototype1/game.js`
- `prototype1/shot/resolveShot.js`
- `prototype1/shot/seedContract.js` (new)

Executable evidence / regression adapters:

- `gauntlet/run-dispersion-gauntlet.mjs`
- `gauntlet/run-parity-gauntlet.mjs`
- `gauntlet/run-purity-gauntlet.mjs`
- `gauntlet/run-sealed-shot-gauntlet.mjs`
- `gauntlet/run-seed-context-gauntlet.mjs` (new)
- `gauntlet/run-seed-integrity-gauntlet.mjs` (new)
- `gauntlet/sealed-shot/step3-preservation.mjs`
- `gauntlet/sealed-shot/step3-purity-worker.mjs`
- `gauntlet/sealed-shot/step4-parity-worker.mjs`
- `gauntlet/sealed-shot/step5-preservation.mjs` (new)
- `gauntlet/sealed-shot/step5-test-adapter.mjs` (new)
- `gauntlet/sealed-shot/step5-seed-worker.mjs` (new)
- `gauntlet/sealed-shot/run-step5-evidence.mjs` (new)
- `gauntlet/sealed-shot/evidence/step5-node.json` (new)

Authority clarification / history:

- `gauntlet/sealed-shot/decision-record-002.md` (new, creator decision retained)
- `gauntlet/sealed-shot/IMPLEMENTATION_FINDINGS.md` (F-018 preserved, F-019 appended)
- `gauntlet/history/step5_contract_audit.md` (new, prior audit preserved + resolution)
- `gauntlet/history/integration_046.md` (this file)
- `GAUNTLET_STATE.md`

22 files total; no dependency/configuration/asset changes.

Original predicate findings remain: swept-distance plus speed cup capture;
separate pre/post-roll speed/grade/resistance rest tests with no angular-speed
rest criterion; procedural surfaces rather than triangle IDs. No Q/epsilon,
bands, authoritative result quantization, Submission/Record lifecycle, decision
trace, MARGIN, networking, persistence, accounts, UI or visual work.

**Step 5 closed. STOP before Step 6; await creator acceptance/authorization.**
