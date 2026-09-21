# Decision Record 002 — Seeded Dispersion Mapping v1

Status: binding creator decision, 2026-09-14; initial solverVersion=1 behavior.

This resolves the omission recorded in F018 and
`gauntlet/history/step5_contract_audit.md`, discovered before production seeded
dispersion existed. Those audits remain historical evidence. Executable Spec
v1.2 FINAL and SeedContract v1 are unchanged.

SeedContract v1 derives the single authoritative `ShotIntent.shotSeed` from
roundId, playerId, holeIndex and strokeIndex. The raw production scalar is:

```javascript
const u = (shotSeed >>> 0) / 4294967296;
const dispersion = 2 * u - 1;
```

| uint32 shotSeed | Exact JavaScript Number dispersion |
| --- | --- |
| 0x00000000 | -1 |
| 0x40000000 | -0.5 |
| 0x80000000 | 0 |
| 0xC0000000 | 0.5 |
| 0xFFFFFFFF | 0.9999999995343387 |

There is no secondary PRNG, mutable PRNG state, additional hash or domain word.
The discrete mapping has exactly 2^32 possible values in [-1, 1). Existing
downstream `(1-L.form)` and putter `.18` / other-club `.75` factors and their
evaluation order remain untouched. The injected scalar seam remains test-only.

This is **not SeedContract v2**; that version remains reserved for future
commit-reveal/serverNonce. When authoritative records are finalized, this
mapping belongs to initial solverVersion=1. A later dispersion sampling/mapping
change requires a solverVersion bump.

Authorized scope: finish Step 5 and SEED INTEGRITY; stop before Step 6. No result
quantization, records, Q/epsilon, boundary bands, or adjacent changes.

## Prototype identity clarification — 2026-09-20

The creator subsequently fixed the adapter meaning of the existing tuple fields;
the serialized SeedContract v1 bytes are not revised:

- `playerId`: `prototype-local-player`, fixed deterministic local identity.
- `roundId`: `prototype-local-round-` plus an in-memory serial starting at zero;
  advance only on RUN IT BACK. A fresh page starts at serial zero again.
- `holeIndex`: the existing zero-based hole index.
- `strokeIndex`: separate zero-based **physical-shot ordinal in this hole**;
  reset on `startHole()`, increment only after an accepted physical launch.
  Penalties never consume it. `state.strokes` stays separate scoring state.

No accounts, storage, network identity, clock or random identity source is added.
These IDs are intentionally not globally unique or persistent. Normal
`resolveShot(ShotIntent, Course)` uses only `ShotIntent.shotSeed`; raw dispersion
is not a production intent authority. Historical scalars enter only the explicit
launch-level test/parity adapter.
