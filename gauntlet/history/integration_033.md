# Integration 033 — Round Chronicle V1

## Outcome

The round now has one calm, on-demand score ledger instead of an end-only stack of
generic summary cards. The live Chronicle tells the current hole, completed-hole
scores, player-versus-Rowan match and honest totals; the same composed surface becomes
the final round result without interrupting the playable shot loop.

## Definition of great

- scorecard rhythm, ruled rows and golf language rather than dashboard cards
- completed holes alone own score-to-par, par-through and match totals
- current strokes remain a live row fact and never leak into posted totals
- one shared live/final ledger with a quiet world-first entry affordance
- no opening during swing, flight, result or transition
- desktop, portrait, short-landscape and narrow-short phone layouts remain readable
- close, Escape, backdrop, focus return and final replay have deliberate behavior
- presentation reads state but cannot mutate golf, cup, scoring or round systems

## Built

- pure frozen `LOFT_ROUND_CHRONICLE_V1` data model with strict score-order and final-
  state validation
- current, posted and upcoming hole rows with score names and exact par context
- completed-only score, match and total calculations against the same Rowan holes
- one split ink / scorecard-cream ledger for live and final round modes
- the entire hole instrument as an unobtrusive 44+ px scorecard entry target
- responsive single-column portrait layout and separately gated wide short-landscape
  layout, including narrow/short crossover protection
- scroll ownership for future regulation-length 18-hole ledgers
- modal focus trap, Escape and backdrop closure in live mode, focus restoration, and
  a final mode that can leave only through `ONE MORE ROUND`
- inert background world/input while open, immediate target-instrument yielding and
  cached availability across real shot phases
- opt-in live/final visual fixtures and three executable Chronicle gates

## Protected contracts

- existing `ROUND_HOLES`, `ROWAN_SCORES`, `state.strokes` and contiguous
  `state.holeScores` ownership
- score posting only after physical cup capture and penalty handling only in gameplay
- every launch, flight, terrain, cup, result, next-shot and next-hole transition
- map, Workshop, target, camera, swing and pointer/wheel/keyboard controls
- exact terrain/contact field, world construction and all club/character contracts
- no dependency, service, database or unrelated repository

## Before / after

Before: the round story was unavailable during play and ended in three generic cards.
It mixed final facts into one line, did not show Rowan hole-by-hole, and had no live
scorecard behavior or accessibility contract.

After: the live fixture reads `-1 / 2 STROKES · PAR 3`, `YOU LEAD / 1 STROKE · THRU 1`,
marks The Shelf `LIVE / STROKE 3`, and totals only the posted opening hole. The final
fixture reuses that ledger for `ROUND WON / BY 1 STROKE` and `9` against par `10`, then
returns through one focused `ONE MORE ROUND` action to a clean, playable first tee.

## Rejected

- polishing the old three-card summary: decoration could not create a live round story
- including current strokes in round totals: compared unequal sets of holes and made
  penalties appear twice
- a permanently expanded leaderboard: competed with the course during every shot
- opening during result or flight: made a score surface capable of interrupting play
- one two-column rule for every phone: collapsed the ledger on narrow/short devices
- a fixed three-hole-only panel: failed the declared 18-hole scorecard contract
- CSS-only modal isolation: left background controls available to keyboard/assistive use

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 37 / 37 PASS (including world-cut camera regression)
- changed JavaScript syntax and whitespace: PASS
- start, partial, current-penalty and final model matrix: PASS
- invalid par/routing/Rowan/score-order/progression/final state rejection: PASS
- desktop live/final and compact live layouts inspected
- portrait summary clipping and narrow/short media collision fixed after adversarial pass
- live close, backdrop, Escape and trigger focus return: PASS
- final Escape/backdrop rejection and Run It Back score reset: PASS
- real drag swing locked the trigger through flight and result; Next Shot restored it
- adversarial review reproduced a real cross-hole camera defect: position and look
  interpolated at different rates across 150–230 m world cuts, briefly looking backward
  or through terrain; this was not dismissed as a browser capture artifact
- `resetAim` now requests a one-time rebase only across a >32 m discontinuity; local
  orbit resets remain damped and ordinary ball flight cannot trigger the rebase
- all three hole-to-tee cuts pass facing, sightline and clearance gates; a fresh final
  fixture replay returned upright to the first tee without pressing Reset
- live warning/error logs empty

## Honest result

Round state now feels authored and legible rather than appended at the end. The ledger
uses the real three-hole POC data today but its layout/model contract can carry eighteen
holes. It remains a local two-player comparison; networked live-party chronology and a
full-season score history are intentionally outside this integration.

## Next

Ball Atelier V1: let the real 338-dimple playable ball become a collectible hero inside
the Workshop with one restrained product-inspection surface. Establish the canonical
object first; do not invent rarity variants or change ball physics to fill a catalog.
