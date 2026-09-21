# Step 5 preflight — signed dispersion contract missing

2026-09-14. Step 4 accepted; resumed clean LOFT tree at
`0bfee37c7c2f4ba919d3676e457ca363515d652d`. No parity rerun, no runtime edits.

Read the complete archived Executable Spec v1.2 FINAL, original F-001–F-007,
latest F-008–F-017, current resolver/source seam, standalone contracts and vector
generator/fixtures. Repository-wide searches found no additional shot-dispersion
contract. An independent read-only agent audit reached the same conclusion.

## What is frozen

- Spec §2.1: length-prefixed raw UTF-8 roundId/playerId, u32le holeIndex/strokeIndex;
  ShotSeed = fmix32(fnv1a32(canonicalBytes)). Both integer stages are explicit.
- Spec §2.1: unsigned unit float is `(x >>> 0) / 4294967296`, range [0,1).
- F-001: protected seed/PRNG operation whitelist; F-003: ShotIntent.shotSeed is
  the single seed input to resolveShot, not a second argument/ambient source.
- Latest F-015 and current launchShotPhysics: the injected operand replaces
  Math.sin(performance.now()*.012), a signed [-1,1] value, ahead of the unchanged
  `(1-L.form)` and putter .18 / other-club .75 factors.

## Missing definition

No authority defines how ShotSeed/unitFloat becomes that **signed** operand:
whether the word is used directly or advanced/domain-separated, the signed map,
orientation, output endpoints or distribution. Spec §8 only names the Step 5
action. `contracts-v1.mjs` ends at shotSeed/unitFloat; all 11 independent seed
vectors end at bytes/FNV/ShotSeed/unitFloat, with no signed-dispersion expectations.

For example, `2*u-1` and `1-2*u` both use the frozen unit conversion and a centered
range, but produce opposite shots for the same seed. Direct use of u drops the
negative half of the existing operand range. Signed reinterpretation, extra hash
mixing or another PRNG would also choose new observable semantics. None is adopted.
The first two examples also need the operation-audit boundary to distinguish the
integer seed computation from any explicitly authorized signed-range adapter.

The requested hash/serialization itself is implementable. The blocker is the
missing downstream sampling definition, not failed vectors or a physics defect.
The user's stop-on-contract-conflict rule prevents silently filling this gap.

## State / handoff

SEED INTEGRITY and Step 5 deterministic-dispersion checks: **NOT RUN / BLOCKED**
pending the exact signed-dispersion contract. No Step 5 production module, seed
integration, new fixture, solver change or normalization has been added. No full
gauntlet rerun: last accepted Step 4 evidence remains historical 152/152, unchanged.
No commit/push of a successful Step 5 build is possible yet. Only this audit,
GAUNTLET_STATE.md and appended F-018 record the stop.

WebKit, Gecko, physical iOS WebView and full required course-hash runtime matrix
remain pending. No new runtime coverage claim. Step 6 has not started.

**Required next input:** provide the missing frozen seed-to-signed-dispersion
contract, or explicitly authorize its definition (including exact mapping and
operation-audit/version boundaries). Then implement Step 5 only, preserving seed
bytes, existing downstream launch math and all Step 4 frozen artifacts.

## Resolution appended — 2026-09-20

The historical audit above is preserved, not withdrawn. The creator supplied the
missing signed mapping in Decision Record 002: `u=(shotSeed>>>0)/4294967296`,
`dispersion=2*u-1`, with five exact edge vectors, no PRNG/extra hash/state, and
initial solverVersion=1 ownership. SeedContract v1 and the original v1.2 DOCX are
unchanged; SeedContract v2 remains reserved for commit-reveal/serverNonce.
The later physical-shot ordinal clarification is recorded in that decision.

Implementation and executable closure: `integration_046.md`, latest findings
F-019, and `../sealed-shot/evidence/step5-node.json`. Full executable gauntlet
172/172; no Step 6 work. Historical/browser pending rows are not upgraded.
