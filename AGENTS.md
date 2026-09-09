# LOFT POC V1 — Autonomous Development Contract

This repository belongs only to LOFT. These instructions apply to the entire
repository and must survive across Gauntlet sessions.

## Absolute boundary

- Verify the Git root is `LOFT-POC-V1` before every implementation run.
- Never read from for implementation, import, reference, modify, deploy from, or
  depend on AEZRIO, AEZRIO Engine, unrelated repositories, or unrelated local
  projects.
- Never introduce Supabase. Do not add cloud infrastructure, frameworks, or
  dependencies unless LOFT demonstrably needs them and the user authorizes the
  expansion.
- Treat LOFT brand canon, gameplay canon, and assets as unique to this repository.
- Preserve existing user changes and unrelated dirty-worktree changes.

## Protected game contracts

Preserve functioning golf gameplay, The Line, The Stroke, gesture timing, launch,
spin, bounce, roll, lies, putting, pace-sensitive cup capture, scoring, hole and
round progression, map aiming, equipment selection, camera controls, saved state,
and the one-more-shot / one-more-round loop.

`LOFT_FIELD_V4_CONTACT` and `TRIANGLE_HEIGHT_SHARED_NORMAL` are protected terrain
contracts. Visual terrain and physical terrain must remain one surface. A risky
change must first prove why these contracts cannot satisfy the goal.

When a regression appears, stop the Gauntlet and repair it before continuing.
Never rewrite Git history to hide a failed iteration.

## Persistent Gauntlet

Use this loop:

1. **Reference** — study the authoritative Good Work images and
   `LOFT_VISUAL_STANDARD.md`.
2. **Inspect** — run and interact with the actual prototype; do not judge only
   source code.
3. **Gap** — select the single highest-impact discrepancy by player impact,
   frequency, LOFT differentiation, quality gap, and feasibility.
4. **Define great** — state a concrete, judgeable success condition.
5. **Build** — improve the actual playable prototype. Documentation and mockups are
   not substitutes for implementation.
6. **Run** — exercise the changed state and all nearby preserved systems.
7. **Observe** — inspect rendered frames, motion, physics, input, and responsive
   layouts.
8. **Critique** — switch to an adversarial reviewer and score the result honestly.
9. **Compare** — keep only work that materially beats the previous build.
10. **One gap** — record and begin the next largest discrepancy.

Use competing approaches only when the design uncertainty warrants them. Prefer a
small number of deep, cohesive improvements over feature count or ornamental polish.

## Visual quality rules

- The authoritative Good Work images are the strongest source of truth. The written
  visual standard translates them; it does not replace them.
- LOFT targets stylized realism, sculpted simplicity, controlled curvature, honest
  matte materials, warm natural light, restrained orange signal, and human-first
  golf culture.
- Use the official checked-in LOFT logo asset. Never trace, approximate, generate,
  or redesign the mark. If a transparent master is unavailable, preserve the
  official asset and place it on its native cream surface; do not invent a mark.
- Apply the zero-brand test: remove logo, typography, and orange. The world,
  character, object, or interface should still belong unmistakably to LOFT.
- The world is the hero. UI informs, frames, and leaves. Avoid generic web-app
  cards, glassmorphism, neon, excessive pills, noisy overlays, and decorative state.
- Equipment progression must change physical product design—not merely color,
  glow, border, label, or particle effects.
- Characters require coherent anatomy, readable silhouette, grounded contact, and
  connected kinetic-chain motion. Disconnected primitive limbs are not an acceptable
  destination.
- Never generate concept art as the deliverable when the request is to improve the
  playable prototype. Build code-native or production-ready game assets instead.

## Testing and evidence

- Run syntax checks and the relevant automated Gauntlets after meaningful changes.
- For physics, verify deterministic behavior and visual/physical agreement. A unit
  test alone does not prove game feel.
- For visual, UI, camera, or animation work, inspect the actual live build at desktop,
  portrait mobile, and short landscape when relevant.
- Exercise the complete nearby loop: shot, flight, contact, result, next shot, cup,
  score, and next hole when the change can affect it.
- Check browser warnings/errors and `git diff --check` before declaring a winner.
- Keep performance disciplined through reuse, instancing, culling, sensible geometry,
  and restrained materials. Premium includes frame stability.

## State and continuation

`GAUNTLET_STATE.md` is the canonical continuation file. Update it after every
meaningful iteration with the current assessment, completed work, regressions,
ranked gaps, exactly one current target, experiments, rejected approaches, and one
next action. Preserve detailed history under `gauntlet/history/`.

If context, usage, runtime, or environment limits approach, leave the prototype
working and `GAUNTLET_STATE.md` deterministic enough that “Continue the LOFT
Gauntlet” is sufficient to resume.
