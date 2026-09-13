# Integration 042 — The Sealed Shot Step 1 evidence

2026-09-13. Evidence-only checkpoint on Integration 041
`4497fc90827ceda14ddf5d46f10b3ebccff7ec34`. No playable source, physics, UI,
visual asset, equipment value or old Gauntlet was changed. Step 2 was not started.
Publication destination: LOFT `main`, ordinary fast-forward, no history rewrite.
Find the checkpoint SHA with `git log -1 --format=%H -- gauntlet/history/integration_042.md`.

## Governing authority

The exact original documents are archived under `gauntlet/sealed-shot/authority/`:

- Executable Spec v1.2 FINAL DOCX SHA-256:
  `c207a3f6c7c3b8250ea54f9078290f46a395c551b7a2f73b729e4ed6e67678fd`.
- IMPLEMENTATION_FINDINGS (8), archived as IMPLEMENTATION_FINDINGS.md SHA-256:
  `092c264903f714fa28ddb00f598341f51548ccba658bc4ae1ebbc1918d761950`.

v1.2 is CLOSED. F-001 names Step 1's seed gate SEED CONTRACT VECTORS, not SEED
INTEGRITY. The old Shot As Data numerical-choice question is superseded by this
authority. Findings F-008–F-014 are separate inspection/implementation notes; no
frozen sampling or observable runtime semantics were changed.

## Retained artifacts

All paths below are relative to `gauntlet/sealed-shot/`.

| Artifact | Frozen evidence |
| --- | --- |
| `generate-reference-vectors.mjs` | Independent BigInt FNV/fmix + Buffer byte writer; imports only node:fs/node:crypto; no subject or game calls |
| `fixtures/contract-vectors-v1.json` | 11 seed vectors, 9 BoundaryKeys, 2 course encodings; canonical hex bytes, intermediate FNV, final words, floats/digests |
| `contracts-v1.mjs` | Standalone imul/DataView/TextEncoder/Web Crypto subject; no production wiring |
| `course-schema-v1.json` | Explicit version/field sequence, LE fixed-width fields, NFC, -0 normalization, non-finite/unknown-field rejection and explicit exclusions |
| `fixtures/coastal-ridge-v1.json` | Authored hole data + two content-addressed unchanged procedural physics artifacts; not a new terrain evaluator |
| `coastal-feature-ids-v1.json` | Three permanent authored cup IDs; not candidate sets or runtime selection |
| `parity-projection-v1.mjs` / `fixtures/parity-v1.json` | Raw-bit test-only projection v1; six solver-side launch/trajectory/terminal fixtures, 3,176 fixed frames |
| `fixtures/behavior-baseline-v1.json` | 43 baseline Git SHA-256s and pre-Step-1 raw working hashes, anchored to Integration 041 |
| `fixture-lock-v1.json` | 11 immutable authority/schema/fixture/projection digests |
| `evidence/step1-node.json` | Exact command, source hash, stdout/stderr, exit and pass counts for every suite |
| `evidence/step1-browser.json` | Actual Chromium byte-contract test and reload result |
| `evidence/step1-provenance.json` | Direct 041 Git-blob verification, current raw hashes, independent-generator audit and honest runtime matrix |

The current field is procedural, not a serialized mesh. The course schema binds
immutable physics artifacts and explicit numeric hole data; it does not replace
geometry or move field code. Archived source scopes and excluded presentation
fields are explicit in the schema/README. Authoring converts archive line endings
to LF, not game source. Encoded package hashes are not geometric-equivalence hashes.
This is the narrower F-005 guarantee. No package loader or replay claim is made.

## Exact hashes and vectors

| Fixture | Bytes | SHA-256 |
| --- | ---: | --- |
| Coastal Ridge canonical package | 544 | `3c32c824133f2df71bc7750de287db8bc22bdb094b3a7d5738a9805a6d288a20` |
| Binary edge/NFC/-0 package | 122 | `2da352afb20fe28bda421c8f53c7ebe1ede11e7c129471df9c07d98f379f8815` |
| Contract vectors JSON | — | `0dbe102ba707ccc30c6da4f7cb4e202564f223a3083b544b7055b23885d27bd8` |
| Parity projection source | — | `11adea692e88a1636833e00688ceff2eda1d64c7e19904e2d06771975ceee906` |
| Parity fixture JSON | — | `55b4efd39884d52434831d6e79e43b71d43f338ae17609a8d7a2515a268444e5` |
| Preservation baseline JSON | — | `26e0b8dc14c0b519e3d7cb55e8c12f26ed6ac74eba1dba847d5e3c1e44136c41` |

Seed final uint32 words (hex), in checked-in input order S0–S10:
`c1da283b 81db7b20 15488e9f 1078a74f 0ba4ba33 56ffdae2 c3b0d94e 7a5bee80 ca463ccd 803ad59d d19fc363`.
Boundary final words B0–B8:
`d16ae11c 760f97c5 272c1176 ae049542 8c962da1 34ee789e 9a364d54 158fa416 6b28272e`.
Full tuples and input byte strings are in the locked vectors file, not reconstructed
from these summaries. Cases include ambiguous concatenations, UTF-8 byte lengths,
embedded NUL, decomposed/composed text, all domains, zero occurrence and uint32 edges.

Legacy trajectory SHA-256s (launch and terminal projections also checked in):

| Family | Fixed frames | All projected fixed-frame bytes |
| --- | ---: | --- |
| Full swing | 930 | `e8de3e74fa3fa0c981d037786fd4c9751de6d153976210515b238d70d5cf0819` |
| Iron | 870 | `8adfb893c8d46765f8e10cc1b5a843ca77f45120dda2f4e3ab9e6e3cdbba6386` |
| Wedge | 459 | `2758cd48b767fcbad5e9d609797890863a69f269a854246a082fb04efec8eff0` |
| Bunker | 564 | `2801b070a91974f0c0a624b4bd8300a971e25834b42f1dbf60b21b1c5f30606f` |
| Putt | 336 | `f350e4876bd71c4f6bc7f46aed96924e50d6449198c2cd7298a205bc83d91538` |
| Lip putt | 17 | `0123b4ceda10c7522fd7886429e8ccdd17753eeacacd9087e8f71b2f357435cd` |

## Runtime coverage and verdict

**COURSE HASH STABILITY overall: PENDING REQUIRED RUNTIME COVERAGE.** This is not
an every-runtime pass. No requirement has been loosened to close the status.

| Runtime required by governing spec | Actual evidence | State |
| --- | --- | --- |
| Node | v24.15.0, V8 version recorded in provenance report; exact bytes/digests, two fresh Node processes | PASS locally |
| Chromium | Browser UA Chrome/152.0.0.0, V8; 48/48 assertions, then 48/48 after reload | PASS locally |
| WebKit | Not exercised in available Windows test session | PENDING |
| Gecko | Not exercised | PENDING |
| Physical iOS WebView | No physical-device run | PENDING |

The two measured environments both use V8; do not imply independent engine-family
coverage from two runtime rows. The later drift/BOUNDARY SAFETY matrix is not
measured here. No Q/epsilon/band constants were selected.

Full local Gauntlet: **124/124, 0 failures**. Existing 105 unchanged: visual 37,
terrain 14, ball 6, assembly 1, atelier 5, neck 4, forging 3, wedge sole 4,
hinterland 3, putting 13, stroke-input 4, preview 4, flight 7. New Step 1: 19/19.
Closure provenance audit: **4/4** assertions/groups (three requested checks plus
fixture-lock check), with 43/43 old blobs, 43/43 current raw hashes and 11/11 locks.
Node counts describe local assertions, not the pending full runtime matrix gate.

## Commands and cutoff continuation

Before cutoff only, explicit authoring commands generated the artifacts and an
explicit repeat proved identical fixture bytes:

```
node gauntlet/sealed-shot/author-course-fixture.mjs
node gauntlet/sealed-shot/generate-reference-vectors.mjs
node gauntlet/sealed-shot/generate-parity-fixtures.mjs
```

After cutoff: inspect dirty tree and existing evidence, **do not regenerate**, run:

```
node gauntlet/sealed-shot/verify-step1-provenance.mjs
node gauntlet/sealed-shot/run-evidence.mjs
git diff --check
git diff 4497fc90827ceda14ddf5d46f10b3ebccff7ec34 -- prototype1 vendor index.html
```

The final run-evidence command invokes every existing run-*-gauntlet.mjs once plus
run-sealed-shot-gauntlet.mjs, recording exact commands and complete output in JSON.
No old gate/threshold was edited. The provenance command separately reads the old
Git blobs; expected fixtures are never produced by the comparison path. The dirty
tree contains only Step 1 evidence/history and scoped fixture checkout attributes.

One pre-cutoff authoring attempt hit Node's default subprocess buffer limit while
reading the existing vendor file; the authoring-only read buffer was increased,
then generation succeeded. A naive raw-only Git-text baseline was rejected in favor
of recording both raw pre-Step-1 working hashes and exact committed Git blob hashes.
Original byte-protected files remain strictly raw. This did not change live code.
Archived source slices retain their original terminal blank lines. A scoped Git
whitespace attribute permits those exact archive bytes rather than trimming locked
fixtures; no source data, fixture hash or Gauntlet assertion was changed for lint.

## Preserved predicate findings

See local implementation findings F-009–F-011 for actual expressions/locations.
Cup capture uses **swept horizontal distance plus speed**, a distance-dependent
pace limit and existing encounter flags. Rest has **separate pre/post-roll checks**
with 1.55/1.35 factors, speed/grade/resistance, and **no angular-speed rest test**.
Surface classification is **ordered procedural containment**, not triangle-ID
classification. Signed lengths, non-negative elliptic metrics and water's mixed
comparisons must not be collapsed into one scalar/band. No predicates changed.

No invented candidates, REST identities, decisionTrace, hysteresis, Q/epsilon,
runtime seeded dispersion or extraction. SEED INTEGRITY, EXTRACTION PARITY,
PURITY, production DETERMINISM, BOUNDARY SAFETY and REPLAY are not claimed passed.

## Stop boundary

Publish this evidence checkpoint to LOFT main and STOP. Pending WebKit/Gecko/iOS
course-byte evidence remains explicitly open. No visual critic pass was performed.
The normal Integration 041 prototype remains available at
`http://127.0.0.1:43117/prototype1/`; its source and protected behavior are unchanged.

Next authorized work **after Step 1 acceptance**: **make dispersion injectable
while preserving the existing wall-clock behavior exactly**. Do not implement
Step 2 as part of this publication turn.
