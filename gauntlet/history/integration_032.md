# Integration 032 — Target Steward V1

## Outcome

The required shot is now the primary spatial decision instead of a small number hidden
inside the course map. A quiet world-linked instrument identifies the landing distance,
elevation and surface—or the exact cup distance—while the selected club separately and
explicitly states `CARRY` or `RANGE`.

## Definition of great

- required distance belongs to the real projected landing point or cup
- full shots state landing distance, elevation direction and destination surface
- putts aimed at the hole state cup distance; offset putts state pace and cup distance
- selected clubs communicate capacity without competing with the shot decision
- the instrument never covers existing field controls across desktop or phone layouts
- map, Workshop, swing, flight, result and transition states reclaim the world immediately
- the system observes game state but owns no gameplay state and intercepts no input

## Built

- pure `LOFT_TARGET_STEWARD_V1` copy and placement contract
- golf-native `LANDING`, `TO CUP` and `PUTT PACE` semantic modes
- physical elevation derived from the same playable height field as ball contact
- a restrained ink-to-transparent field veil with one signal rule and target leader
- four-candidate projected placement with viewport bounds, obstacle clearance, front-
  camera/frustum rejection and truthful leader-side preservation after clamping
- explicit `CARRY` for flight clubs and `RANGE` for the putter
- cached semantic DOM updates and resize-time layout measurement; only projection moves
  each frame
- two executable gates covering copy, placement, responsiveness, isolation and lifecycle

## Protected contracts

- `screenOf()` and every canvas/map/bag pointer, touch, wheel and keyboard handler
- all target, club, launch, spin, physics, cup, scoring and round values
- exact terrain/contact field and every atmosphere/world construction contract
- existing map, Workshop, camera, result receipt and Next Shot behavior
- no new dependency, service, gameplay listener or unrelated repository

## Before / after

Before: the map's compact `8 FT` described the immediate putt while the much larger club
card said `65 FT`, with no language explaining that one was the cup decision and the
other the putter's available range. Full-shot elevation and landing surface were not a
primary world-space fact.

After: the eight-foot fixture reads `TO CUP / 8 FT / LEVEL · GREEN`, while the club reads
`RANGE / 65 FT`. Full shots read, for example, `LANDING / 160 YD / ↑ 14 FT · FAIRWAY`.
After a real 83-yard shot, Next Shot refreshed the decision to `LANDING / 83 YD /
↑ 8 FT · GREEN` and the auto-selected wedge to `CARRY / 90 YD`.

## Rejected

- enlarging the map distance: kept the decision detached from the actual world target
- replacing the target ring with a larger disc: improved visibility by making the world
  more arcade-like and obscuring the exact surface being judged
- a persistent center-screen card: competed with golfer, route and shot motion
- using the putter's 65-foot capacity as the putt target: confused equipment envelope
  with the player's chosen pace
- clamped placement without side validation: could label a panel `right` after it had
  moved left of its anchor and made the leader geometrically dishonest
- updating copy every frame: unnecessary DOM churn for semantics that change only on aim
- adding overlay listeners: risked the proven canvas/map/bag interaction contract

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 33 / 33 PASS
- changed JavaScript syntax and whitespace: PASS
- deterministic desktop, portrait and short-landscape placement fixtures: PASS
- edge, obstruction, offscreen, insufficient-room and leader-side fixtures: PASS
- live default full-shot and real eight-foot putting compositions inspected
- map and Workshop both hide the instrument immediately
- real drag swing completed launch, flight, landing, 83-yard receipt and Next Shot
- refreshed target/capacity semantics after automatic club selection: PASS
- live warning/error log empty

## Honest result

The shot decision now has a clear LOFT-native hierarchy and a physical relationship to
the course. The instrument remains an efficient DOM overlay rather than an occlusion-
aware in-scene label, so it deliberately hides when no honest collision-free placement
exists instead of pretending to sit inside 3D geometry.

## Next

Round Chronicle V1: replace the end-only, generic three-card summary with an on-demand,
golf-native score ledger that shows hole context, player versus Rowan and round progress
without adding HUD clutter or interrupting a swing, flight, result or transition.
