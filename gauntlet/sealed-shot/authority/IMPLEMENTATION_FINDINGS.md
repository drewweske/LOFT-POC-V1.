# LOFT — Implementation Findings

Living log for **THE SEALED SHOT, Executable Specification v1.2 (final)**.

v1.2 is closed. This file carries everything discovered during implementation
that does **not** change a frozen contract.

## Governance — what goes here vs. what forces a version bump

| Change | Where it goes |
| --- | --- |
| Clarifies, orders, or asserts something without changing any frozen bytes or semantics | **This file.** |
| Changes serialisation, a hash, a sampling algorithm, a field's meaning, or any contract's observable behaviour | **Version bump** on the relevant `*Version` field. Never a silent edit. |

This rule exists so the findings log cannot quietly become v1.3.

---

## F-001 · SEED INTEGRITY is attached to the wrong step

**Status:** accepted, corrects v1.2 §8.

The gate asserts two things: that independently derived vectors match, and that
the production PRNG uses only permitted integer operations. At step 1 the
fixtures exist but the production seed path does not, so half the gate has
nothing to inspect.

Split it, restoring the spec's own rule that a gate runs only after what it
measures exists:

- **Step 1 — SEED CONTRACT VECTORS.** Independently derived vectors match a
  standalone implementation written from §2.1.
- **Step 5 — SEED INTEGRITY.** The production implementation uses only
  `Math.imul`, `^`, `<<`, `>>>`, `&` and division by a power of two, and
  reproduces the vectors.

`COURSE HASH STABILITY` stays at step 1. It has everything it needs there.

---

## F-002 · BoundaryKey implementation assertions

**Status:** accepted, additions marked.

Freeze these beside the implementation rather than letting them be invented:

- **`E >= 1`**, or `% (2E)` is invalid.
- **`2E` is bounded by the width of the random source, not by the safe-integer
  range.** `boundaryWord` spans `0 … 2³²−1`, so `2E <= 2³²` is the hard
  ceiling — above it, residue bins above `2³²−1` can never occur and the
  weighting is not biased but broken.

  > **Revision B.** An earlier version required only
  > `2E <= Number.MAX_SAFE_INTEGER`. That is the wrong invariant: the
  > constraint belongs to the width of the source being reduced, not to the
  > numeric type.

  The *useful* ceiling is far lower, though the earlier table stating it was
  wrong.

  > **Revision C.** An earlier version listed `2E = 2¹⁶` as carrying ~0.0015%
  > bias and `2E = 2²⁴` as ~0.4%. **Both are exactly zero.** Powers of two
  > divide 2³² exactly, so `x % 2ⁿ` over uniform `[0, 2³²)` has no bias at all.
  > The general bound `n / 2³²` applies to *arbitrary* moduli, not to exact
  > divisors.

  Corrected statement: for an **arbitrary** modulus `n <= 2¹⁶`, worst-case
  relative residue imbalance is bounded on the order of `n / 2³² ≈ 1.5 × 10⁻⁵`.
  For `n` a power of two, it is zero.

  **Freeze `E ∈ [64, 32768]`**, so `2E <= 2¹⁶`.

  **Prefer a power of two** — `E ∈ {64, 128, … , 32768}` — in which case modulo
  bias is not merely negligible but **exactly zero by construction**, and
  F-004's "intentionally accepted bias" becomes moot for that predicate.

  > **Subordinate to physics.** Prefer a power of two **only where the
  > evidence-derived `Q` and `ε` permit it without materially changing the
  > selected band.** Never tune a physically justified epsilon to make modulo
  > arithmetic prettier. Any value in range is acceptable at ≤1.5 × 10⁻⁵, and
  > that is a smaller error than a mis-sized band.
- **`occurrence` numbering is frozen explicitly.** Use **zero-based**. Do not
  leave the convention to the implementation.
- **Domain-specific `featureId`s are frozen, not opportunistic.** §2.3 defines
  authored identities mainly for terrain. Also freeze:
  - `CUP_CAPTURE` → the authored cup identity for the hole. **Occurrence
    increments per band entry** — a ball can approach, lip out and return.
  - `SURFACE_EDGE` → the authored terrain feature or edge identity.
  - `REST_THRESHOLD` → a canonical sentinel. **Occurrence increments per band
    entry unless repository inspection proves there can only be one.**

> **Revision A.** An earlier version of this finding froze `REST_THRESHOLD` as
> "one decision per shot." That was an assumption about a predicate this log
> explicitly requires reading first. If rest is tested repeatedly during roll —
> as is likely — a shot can enter the ambiguous band, resolve "still moving,"
> and enter it again. Read the predicate, then freeze the convention.

### `occurrence` is an episode, not a timestep

A ball hovering near the lip for six fixed timesteps must receive **one** seeded
capture decision, not six. Six independent draws would give a lip-hover six
chances at capture — wrong probability and wrong physics.

**Frozen semantics.** For each `(DOMAIN, featureId)`, `occurrence` increments on
an **out-of-band → in-band transition** of the integer band-membership
predicate. Continuous timesteps inside the same band reuse the same
`occurrence`. A new occurrence begins only after the shot has left that band and
subsequently re-entered it.

**Implementation consequence — cache the residue, not the decision.**

> **Revision C.** An earlier version said the decision is computed once on entry
> and cached for the episode. **That defeats the weighted band entirely.** A ball
> approaching the cup enters at the outer edge where `k ≈ 2E`, so the entry
> decision is "outside" with near-certainty. Caching it means the ball then
> travels all the way through the ambiguous region — even to `k = 0`, deep
> inside — and is never captured. The weighted band collapses into a decision
> about *which side the ball entered from* rather than *how deeply it travels*.

The correct construction:

```
On episode entry (once):
  r = boundaryWord % (2E)          seeded residue, fixed for this episode

On every boundary test within the episode:
  m = round(measure / Q)           current quantized measure
  k = clamp(m − (T − E), 0, 2E)    current integer band position
  decision = (r < k) ? outsideResult : insideResult
```

One seeded value per episode. No repeated draws, no PRNG consumption order, no
lottery tickets — and the decision now responds to where the ball actually is.

### What this construction actually models

`r` is not randomness applied to a decision. **It is a per-shot seeded position
for a boundary whose true location is uncertain below perception.**

The decision flips exactly when `k` crosses `r`, which happens at
`measure = (T − E + r) · Q`. So for this shot, at this feature, the effective
capture radius sits at one of `2E` discrete positions spanning `± ε` around the
nominal one, and the ball is captured when it physically crosses *that* radius.
The distribution over those positions is exactly uniform when `2E` divides 2³²
and carries the deliberately accepted modulo bias otherwise.

That is a physically honest model of a knife edge, and it is why the
construction is right rather than merely deterministic. Cup capture, rest
detection and surface crossing all become **deterministic shifted boundaries**,
never repeated random trials.

Occurrence semantics are unchanged: a genuinely new approach — leaving the band
and re-entering — draws a new `r`, and therefore a new seeded boundary position.

**Watch for episode churn.** If the quantized measure dithers across the band
edge, a single physical approach could fragment into many episodes. Have the
adversarial corpus report **episodes per shot** alongside band-fire frequency.
If churn appears, the remedy is one bin of hysteresis — an episode ends only
when `m` exits the band by at least one bin. Do not add it pre-emptively;
measure first.

> **Governance.** Hysteresis is **not** a findings-log clarification. It changes
> when an occurrence ends, therefore when a new `r` is drawn, therefore the
> resulting shot. Under the rule at the top of this file, implementing it
> **requires a `boundaryContractVersion` bump.**

Residual sensitivity remains if two runtimes disagree about exactly when an
episode exits and re-enters. That is expected and already handled: the
adversarial corpus measures it, and the server is the backstop.
- **If `decisionTrace` activates, the new versioned trace schema must include
  `DOMAIN`** — a trace has to identify the same semantic decision the
  BoundaryKey contract identifies. But see F-007: v1.2's reserved shape does not
  contain `DOMAIN`, so this is **not** an addition this log can authorise.
  Activating any trace schema is a `shotSchemaVersion` bump.

### Addition — `E_MIN`

`E >= 1` is necessary but not sufficient. At `E = 1`, `2E = 2` and `k ∈ {0,1,2}`
— the weighted draw collapses to a coin flip with three positions. The band
needs enough bins for the weighting to mean anything.

**`E_MIN = 64`, frozen.** Combined with the source-width bound above, the
frozen range is **`E ∈ [64, 32768]`**. Evidence chooses within it.

> **Revision A.** An earlier version read "`E_MIN = 64`; prefer 256," which
> leaves an agent making a taste decision inside what is supposed to be an
> executable assertion. Freeze the floor; let evidence go higher.

### Design sanity rule — reported, not gated

```
drift  <<  Q  <<  ε  <<  perceptual threshold
```

This is engineering intuition and is **not a gate**, because `<<` has no
quantitative meaning until minimum ratios are specified. Instead, the
BOUNDARY SAFETY report records the actual ratios per predicate:

| Reported | Meaning |
| --- | --- |
| `Q / max_observed_drift` | Bin-assignment stability margin |
| `ε / Q` (= `E`) | Band resolution. Must be `>= 64`. |
| `ε / tolerance` | **Predicate-specific, same-unit.** How far the band sits below a meaningful physical or perceptual tolerance in that predicate's own units. |

> **Revision C.** An earlier version proposed `ε / resultQuantum` for every
> predicate. That reintroduces the dimensional error this log corrects
> elsewhere: it is valid for capture, where both terms are lengths, and
> meaningless for a barycentric surface measure or a rest speed. Declare a
> same-unit tolerance per predicate — the 1 mm result quantum for capture, the
> smallest authored feature size for surface, the speed below which motion is
> imperceptible for rest.

A human reads those three numbers per predicate. If a predicate cannot produce
a comfortable set, that predicate escalates to deterministic arithmetic — the
constants do not get loosened to make it pass.

### Addition — rounding mode and measure sign

`m = round(measure / Q)` is underspecified. `Math.round` in JavaScript rounds
half toward `+Infinity`, which is asymmetric across zero: `Math.round(0.5) === 1`
but `Math.round(-0.5) === -0`. A predicate whose measure can go negative — a
signed distance in a surface classifier, for instance — would inherit that
asymmetry as a silent bias at the bin boundary.

**Require every predicate measure to be non-negative by construction.** Distance
and speed already are. A signed measure is offset into non-negative range before
binning, and the offset is frozen with the predicate. With that guaranteed,
`Math.round` is unambiguous and no rounding-mode declaration is needed.

**The offset applies to both sides, and must be bin-aligned.** If a signed
classifier is offset, the same frozen transform applies to the measure **and**
the threshold.

> **Revision C.** Equal offsets alone are not sufficient. Quantization is not
> translation-invariant: `round((x + c) / Q)` equals `round(x / Q) + c / Q` only
> when `c / Q` is an integer. An arbitrary offset applied to both sides can
> still move the classification boundary after rounding — the exact failure the
> symmetry rule was meant to prevent.

**Require any offset to be an integer number of `Q` bins**, or better, define
the predicate directly in a naturally non-negative measure and use no offset at
all.

### Addition — the band is invoked, not always run

`clamp(m − (T − E), 0, 2E)` is defensive, not a substitute for a band test. The
seeded path should be **entered only when `m` is within `[T − E, T + E]`**.

Two reasons this matters beyond efficiency:

1. Running the seeded path unconditionally hides when the band actually fired.
2. `decisionTrace` is only small because most shots contain no banded
   decisions. That claim is only true if banded and unambiguous decisions are
   distinguished at the point of decision.

### The reconciliation decision needs four measures, not one

> **Revision A.** An earlier version called band-fire rate "the number" that
> decides terminal-only versus decision-trace reconciliation. It is not
> sufficient. A high band-fire rate with perfect cross-runtime agreement does
> not justify transmitting traces. A very low band-fire rate that occasionally
> produces an obvious early visual divergence might.

BOUNDARY SAFETY reports all four:

| Measure | Question it answers |
| --- | --- |
| **Band-fire frequency** | How often does the seeded path run at all? |
| **Cross-runtime disagreement frequency** | How often do runtimes actually differ? |
| **Early-divergence frequency** | How often does a disagreement occur early enough to change the visible path? |
| **Correction perceptibility** | How bad is the snap when terminal reconciliation fires? |

On the last one: **measure it perceptually, not in metres.** A three-centimetre
correction on a 250-yard drive is invisible. The same correction on a two-foot
putt is the difference between made and missed, and it is the most closely
watched moment in the game.

The sharpest single measure is binary: **does the correction change the hole-out
result?** A visual snap is ugly. A corrected hole-out is a trust violation, and
they are not the same category of problem.

§3.7's reconciliation mode is chosen from that evidence set, not from any one
number.

**Episode churn is a separate diagnostic**, reported alongside but not part of
the reconciliation set. It answers a different question — whether the episode
definition itself is stable enough to keep — rather than which reconciliation
mode to ship.

| Diagnostic | Question it answers |
| --- | --- |
| **Episodes per `(shot, DOMAIN, featureId)`** — distribution and maximum | Does one physical approach fragment into several episodes? |
| **Immediate edge re-entry frequency** | Is the band edge dithering? |

These two decide whether hysteresis needs considering at all — and per the
governance note in the episode section, adopting it is a contract version bump.

---

## F-003 · Duplicated seed source in `resolveShot`

**Status:** accepted, corrects v1.2 §8 signature.

`ShotIntent` carries the seed, and the lifecycle also passed `Seed` as a
separate argument. Two sources that can disagree.

**Canonical signature:**

```
resolveShot(ShotIntent, Course) -> ShotResult
```

`ShotIntent.shotSeed` is the single authoritative seed.

The same principle governs `Course`: `ShotIntent.courseHash` identifies the
package, so the supplied `Course` must either be **loaded by that hash** or
**asserted to match it**, and the function refuses on mismatch rather than
resolving against the wrong geometry.

---

## F-004 · Modulo weighting — accurate wording, and a correction to the prohibition

**Status:** accepted. v1.2 §2.2 overstated in two directions.

The spec said the probability is *exactly* `k / 2E` and then acknowledged modulo
bias because 2³² is generally not divisible by `2E`. Both cannot be literally
true. The behaviour is correct; the description was not.

**Accurate wording:** an *approximately* `k / 2E` weighted deterministic draw
with intentionally accepted modulo bias.

**Correction to the prohibition.** v1.2 forbade any rejection loop on the
grounds that it "breaks determinism." That is wrong — integer-only rejection
sampling is perfectly deterministic. The prohibition was doing the right job for
the wrong reason.

**Replace it with the rule that actually protects history:**

> BoundaryContract v1 intentionally accepts modulo bias. Any change to the
> sampling algorithm requires a `boundaryContractVersion` bump.

That protects every historical record without making a false mathematical claim.

---

## F-005 · Course hash guarantee, stated narrowly

**Status:** accepted, wording correction to v1.2 §2.3.

The spec said "identical geometry encoded two different ways must produce
identical bytes." Read literally that is wrong, and it conflicts with the
contract's own preservation of authored array order — two geometrically
equivalent meshes with different vertex ordering **will** hash differently, and
they should.

**The actual guarantee:** the same canonical course package always produces the
same bytes and the same digest, on every runtime, forever.

The `COURSE HASH STABILITY` gate already states this correctly. Only the prose
in §2.3 was loose.

---

## F-006 · This phase enables server authority; it does not deliver it

**Status:** accepted, scoping clarification.

§6 of the spec describes simulation authority as "delivered by this phase."
Networking and backend work are explicitly prohibited in this phase, so no
server exists to be authoritative.

**Accurate scoping:** this phase produces a **server-runnable authoritative
primitive**. Operational authority arrives when a server does. Nothing in the
build order changes; the claim does.

---

## F-007 · `decisionTrace` semantics are deferred until evidence requires them

**Status:** new. A consequence of Revision C that the reserved field no longer
covers.

F-002 reserved a trace entry as `DOMAIN + featureId + occurrence + decision`.
Revision C makes that shape insufficient: within one occurrence, `r` is fixed
while `k` moves with the measure, so **the decision can legitimately change
inside a single occurrence** when `k` crosses `r`. There is no longer one
authoritative decision per episode to record.

**Rule.** Terminal reconciliation remains fully implementable under
BoundaryContract v1 and requires no trace. **If BOUNDARY SAFETY shows that
early decision-trace reconciliation is necessary, freeze the trace event
semantics before implementing them.** An occurrence identifier plus a single
decision value is not sufficient under the shifted-boundary model.

Do not invent the shape now. But the evidence will need to distinguish two
disagreement modes, and the shape follows from which one appears:

| Mode | What diverged | What a trace would have to carry |
| --- | --- | --- |
| **Measure divergence** | Runtimes computed different `m`, so `k` crossed `r` at different points | The authoritative transition — a step index or a quantized measure at the crossing |
| **Episode divergence** | Runtimes disagree about which occurrence they are in, so they drew different `r` | The authoritative `occurrence`, and by extension the authoritative `r` |

**A third mode exists, and the earlier claim that divergence is "always upstream
in the measure or the episode boundary" was not exhaustive.**

| Mode | What diverged | What a trace would have to carry |
| --- | --- | --- |
| **Feature divergence** | Runtimes selected **different `featureId`s** for the same physical boundary event | The authoritative `featureId` |

This applies chiefly to `SURFACE_EDGE`. Authored IDs can be perfectly stable
while *selection among candidates* differs — a ball near a vertex where several
terrain features meet. Because `featureId` participates in `boundaryWord`, two
machines then derive different `r` despite agreeing on shot seed and occurrence.

**The fix belongs in deterministic feature selection, never in widening `Q` or
`ε`.** Widening the band cannot repair a disagreement about *which* boundary is
being tested, and chasing it with constants would consume the entire margin
without touching the cause.

Concretely: the selection rule must be **total and deterministic**, resolving
ties by **canonical ordering of authored `featureId`s** — lowest authored ID
among all candidates within tolerance. Authored IDs are stable by construction
because they are part of the hashed course package, so the tie-break inherits
that stability.

**Harness requirement:** emit `DOMAIN`, `featureId`, `occurrence` and both raw
and quantized measures at every boundary test — not measures alone. Feature
divergence is invisible in a measures-only report.

Transmitting `r` alone does not help in any mode: `r` is integer-derived and
bit-exact given the same `DOMAIN`, `featureId` and `occurrence`, so a client
agreeing on those three already computes it. Divergence is always upstream of
`r` — in the quantized measure, the episode boundary, or the feature
selection.

**Governance.** Changing the reserved trace representation alters a serialised
record shape. Per the rule at the top of this file, that is a
`shotSchemaVersion` bump, not a findings-log clarification.

---



These are not defects. They are things the spec deliberately leaves to evidence.

1. What are the actual predicates? Read the rest test, capture test and surface
   classifier and write down exactly which quantities each compares, before
   assigning any constants. (§3.2)
2. Does the rest predicate use angular velocity? If so it gets a second
   `Q`/`ε` pair. Do **not** normalise it into a single scalar — that is a
   physics change and is not authorized.

   > **Structural consequence, not merely a constants question.** The episode
   > algorithm in F-002 assumes **one scalar measure, one `T`/`E` pair, and one
   > occurrence stream per semantic boundary.** If inspection reveals two
   > independent rest comparisons, a single `REST_THRESHOLD` sentinel with one
   > occurrence counter cannot track them — a ball can be inside the linear
   > band and outside the angular one simultaneously. Each independent
   > comparison needs its own semantic identity, its own band, and its own
   > episode state.
   >
   > **Preferred encoding if it proves necessary:** two canonical `featureId`s
   > under the existing `REST_THRESHOLD` domain — `rest.linear` and
   > `rest.angular` — rather than new `DOMAIN` integers. `featureId` is already
   > an arbitrary length-prefixed string in the frozen serialisation, so this
   > requires **no BoundaryKeyContract change**, whereas adding `DOMAIN` values
   > would.
   >
   > The composite rest decision is then a conjunction of two independently
   > seeded boundaries. Do not decide any of this before reading the actual rest
   > code.
3. What is the measured cross-runtime drift per predicate, per dimension?
   (§3.3 harness)
4. What does the four-measure reconciliation evidence set show — band-fire
   frequency, cross-runtime disagreement, early divergence, and correction
   perceptibility? Decides terminal-only versus decision-trace. (F-002, §3.7)
5. Does re-simulating N records meet a preparation-time budget on the minimum
   supported device? (FLIGHT PREPARATION)

## Still open, and not this phase

- Radial dial versus linear signal for the swing control. Creator decision.
- SeedContract v2 commit-reveal. (§5)
- Input authority and account-state authority. (§6)
