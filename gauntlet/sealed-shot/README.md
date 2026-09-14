# The Sealed Shot — evidence through Step 3

Authority: **Executable Specification v1.2 FINAL**, SHA-256
`c207a3f6c7c3b8250ea54f9078290f46a395c551b7a2f73b729e4ed6e67678fd`;
supplied **IMPLEMENTATION_FINDINGS (8).md**, SHA-256
`092c264903f714fa28ddb00f598341f51548ccba658bc4ae1ebbc1918d761950`.
Original authority is archived under `authority/`. Do not edit it. Local inspection
findings are in `IMPLEMENTATION_FINDINGS.md` beside this file.

## Scope

Nothing in this directory is imported by the playable game. Production extraction
is in `prototype1/shot/`; this directory contains authority and test-only evidence.
Current closure: Step 3 PURITY, 144/144 checks. Run current evidence with:

```powershell
node gauntlet/sealed-shot/run-step3-evidence.mjs
```

It writes only `evidence/step3-node.json`. Do not rerun historical `run-evidence.mjs`
or `run-step2-evidence.mjs` to overwrite accepted past evidence. Individual legacy
gate commands remain current and are included by the Step 3 runner.
See history 044 and F-016 for exact extraction boundary, inputs and limitations.
No production seeded dispersion, boundary bands, quantized result or record replay.
F-001 names the seed gate **SEED CONTRACT VECTORS**. Full **SEED INTEGRITY** belongs
to Step 5. EXTRACTION PARITY is pending; the projection and legacy oracle exist,
but the Step 4 comparison has not been run or claimed.

Historical Step 1 commands (retained for provenance, not closure instructions):

```powershell
node gauntlet/run-sealed-shot-gauntlet.mjs
node gauntlet/sealed-shot/run-evidence.mjs
node gauntlet/sealed-shot/verify-step1-provenance.mjs
```

The latter runs every existing Gauntlet unchanged and the Step 1 gate, and writes
the exact command/output/count evidence to `evidence/step1-node.json`.
None of these commands generates expected fixtures. The test fixtures below are frozen.

The provenance audit reads Integration 041's immutable Git blobs directly and
compares all 43 manifest digests, separately verifies pre-Step-1 working-byte hashes,
inspects the independent generator's imports/arithmetic and checks fixture locks.
It does not run a generator. Results: `evidence/step1-provenance.json`.

**COURSE HASH STABILITY overall: PENDING required runtime coverage.** Node v24.15.0
and Chromium 152 passed the checked-in byte/digest cases, including browser reload.
WebKit, Gecko and physical iOS WebView have not been exercised. A Node-suite PASS is
not an every-runtime PASS; none of the pending rows is waived or inferred from V8.

## Byte contracts

`contracts-v1.mjs` is a standalone implementation from §§2.1–2.3. Seed and BoundaryKey
strings are raw UTF-8, with byte-length prefixes and no inferred normalization.
Course strings are NFC. Valid IDs are Unicode scalar strings; unpaired UTF-16
surrogates are rejected rather than converted to a replacement character. Indices
and occurrence are uint32, validated before writing, not coerced or truncated.
Occurrence vectors include zero and uint32 maximum; no runtime counter exists yet.

`generate-reference-vectors.mjs` is an independent oracle: BigInt modular products
and shifts with decimal constants, Buffer byte writes and node:crypto SHA-256.
It does not import the subject, schema or game. The subject independently uses
Math.imul, DataView, TextEncoder and Web Crypto. All expected bytes, intermediate
FNV words, final words, floats and digests are checked in. The gate reads them;
it never regenerates them. No modulo sampling or band logic is implemented.

## CoursePackageCanonicalization v1

`course-schema-v1.json` freezes the concrete field sequence authorized at Step 1.
Every encoded structure is a sequence, not an object/map. JSON files are authoring
and fixture containers, **not canonical bytes**. Digests are 32 raw bytes. Float
pairs are two float64 values, x then z. Collections preserve authored order.
Negative zero normalizes only in course numeric encoding; non-finite numbers fail
even inside excluded presentation metadata. Unknown fields and versions fail closed.

The current course is a procedural program, not an authored triangle package.
The Step 1 package therefore binds two immutable **physics program artifacts** by
SHA-256 plus explicit authored hole data and an ID ledger. This preserves every
field formula, constant, grid, normal, interpolation and surface response without
extracting/re-evaluating the field or inventing new geometry. Archived `.txt` files
are inert source artifacts, not new runtime modules. Their dependency ROUND_HOLES
is represented by the explicit numeric hole sequence. `solverVersion` separately
owns solver math and cup constants; equipment has its own version outside this
package. No decimal numeric field is serialized into the course byte stream.

`author-course-fixture.mjs` documents the exact legacy source scopes: helper
clamp/lerp/smoothstep; SURFACE_LIFT through courseSurfaceAt; surface material/lie
response before surfaceDisplay. It canonicalizes archive line endings to LF **at
authoring only**, never touches source files. Hashing later uses archived bytes
without rewriting. Source-program edits, even comments in these physics artifacts,
create a new artifact/hash. This is intentionally narrower than a semantic-geometry
equivalence claim (F-005). Presentation exclusions are explicitly enumerated.

The three cup IDs are authored literals in `coastal-feature-ids-v1.json`, linked
by named author keys and explicit hole identities. Reordering arrays changes the
package hash but does not renumber IDs. Geometry may change without renaming the
same authored object. Existing ledger identities are permanent; future new features
are new authored entries, not ordinal allocation. These are **not** candidate sets:
no surface IDs, nearest-feature selection, REST sentinel or episode state has been
invented. Those require later inspection/diagnostic evidence under F-002/F-007.

This snapshot does not install a package loader or claim an old shot can already
replay. Old package bytes and artifact files are retained when a new package is
authored. Production consumption is later work, not an excuse to alter Step 1 bytes.

## Parity projection v1

`parity-projection-v1.mjs` freezes raw little-endian Float64 **bits**, including -0,
for launch, every fixed-step state, and terminal state. It includes velocities,
spin, quality, simulation time, last-safe position, active/accumulator, surfaces,
transition events, rest/holed/recovery flags and optional cupLipResolved presence.
`PARITY_FIELDS` declares the state field order. No tolerance, Q or epsilon is chosen.
This deliberately strict same-runtime comparison is separate from the future 1 mm
authoritative result. It is not a cross-engine physics identity claim.

`legacy-parity-corpus.mjs` is a test adapter around the **unchanged legacy solver**,
not a second solver or resolveShot. Six checked-in post-quality launch inputs cover
full swing, iron, wedge, bunker, putt and lip putt. Their launch/terminal projections,
frame counts, and SHA-256 of every projected fixed frame followed by LF are frozen.
These are solver-side baselines; later EXTRACTION PARITY must also exercise the
legacy composition-root path with identical injected dispersion. Do not claim that
gate passed just because these baselines replay. Never regenerate a baseline to
make an extraction pass. A changed projection is a new projection version.

## Explicit authoring commands (not test commands)

These were run before the usage cutoff at Integration 042 to create the fixtures,
and rerun to prove identical bytes. They were NOT rerun during the closure audit.
They must never be called from a gate or CI comparison path:

```powershell
node gauntlet/sealed-shot/author-course-fixture.mjs
node gauntlet/sealed-shot/generate-reference-vectors.mjs
node gauntlet/sealed-shot/generate-parity-fixtures.mjs
```

Reference v1 files and schema are digest-locked. Future accepted changes require
the appropriate new version/new filenames, with old fixtures retained.

## Browser check

```powershell
node gauntlet/sealed-shot/serve-contract-check.mjs
```

Open the printed loopback URL. The runner checks the same seed/key/course byte
vectors and Web Crypto digests, -0 and non-finite behavior. It has three explicit
read-only routes, no game imports, and does not expose the repository. Reload to
test a fresh module instance. Stop this diagnostic server after testing; the
normal playable preview on port 43117 is independent and stays running.

Next authorized step: **Step 4 — EXTRACTION PARITY through the frozen projection.**
STOP after Step 3 publication. Never loosen the projection to hide extraction drift.
