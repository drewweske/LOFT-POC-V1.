# Integration 022 — LOFT Club Object Workshop V2

## Outcome

The Bag is no longer an eight-card catalog. It is now a calm product-inspection
space where one selected club owns the frame, the complete object family remains one
gesture away, and equipment changes happen only through an explicit decision.

## Built

- dark clubhouse-ink hero stage inside the existing scorecard-cream Workshop shell
- large selected-object drawing, editorial model/carry hierarchy, honest flight
  values, material, finish, construction and process language
- eight-object horizontal family rail with separate focused and equipped states
- preview state that cannot mutate the live club, target distance, golfer or HUD
- explicit Equip action that delegates to the trusted existing selection path
- deterministic, physics-neutral object-profile presentation values
- five physical SVG construction grades for every club family:
  - Foundation: broad one-piece casting, sparse scoring and restrained wear
  - Field: cleaner seam, tuned sole and insert structure
  - Tour: compact forged form and machined cavity / sole hardware
  - Signature: multi-material bridge and one functional signal weight
  - Icon: ink exoskeleton, pearl ceramic insert, flow machining and exactly one
    signal component
- true family silhouettes for driver, wood, hybrid, iron, wedge and putter
- keyboard arrow inspection, contained Tab focus, Escape cancellation, opener-focus
  return and native horizontal touch scrolling
- responsive portrait and short-landscape compositions that retain hero, action and
  family access without reverting to a stacked card grid

## Protected contracts

- every trusted carry, launch, ball-speed, spin and roll value is unchanged
- preview does not call `selectClub()` or alter live gameplay
- Equip still uses the original club-selection path, 3D rig update, target update,
  line update, feedback and close behavior
- automatic lie-based club selection remains authoritative when the Workshop opens
- five existing 3D equipment tiers and their turf-clearance contract are unchanged
- no gameplay physics, terrain, cup, scoring, map, round, camera or saved state changed

## Before / after

Before: eight equal-weight cards, tiny diagonal-shaft thumbnails, identical tier
geometry and one-click mutation made the Bag read like a generic shop catalog.

After: one club is large enough to inspect, construction progression survives a
grayscale test, the rail reads as a product family, and preview / equip are distinct,
intentional actions. The interface is substantially closer to the authoritative Bag
reference while remaining native to the current prototype.

## Rejected approaches

- retaining the 4 × 2 grid with richer borders, because hierarchy—not decoration—was
  the fundamental problem
- recolor-only rarity, because it fails the zero-brand object test
- tier-driven performance bars, because the current physics does not implement tier
  performance changes and the interface must not advertise fiction
- the first product framing, because the intrinsic SVG aspect ratio clipped the club
  head instead of presenting the whole object
- the first Icon putter drawing, because its paired arcs read as eyewear; the retained
  design uses an explicit face bar, two rear wings, open channel and alignment bridge
- immediate equip on rail click, because inspection should be reversible and should
  not silently move the target line

## Verification

- Terrain Gauntlet: 13 / 13 PASS
- Visual Gauntlet: 22 / 22 PASS
- JavaScript syntax clean for game, equipment and club-object modules
- live Foundation / Icon, iron / driver / putter comparisons inspected
- preview Driver retained the equipped 7 Iron until explicit Equip
- Equip Driver closed the Workshop and updated the HUD to `D / 250 YD`
- preview Putter then Escape retained the equipped club and restored opener focus
- true 390 × 844 portrait and 844 × 390 short-landscape layouts inspected
- live warning/error log empty

## Honest result

Workshop hierarchy rises from roughly 5.5 / 10 to 7.4 / 10 and equipment desirability
from roughly 5.5 / 10 to 6.7 / 10. The new drawings communicate real category and
construction progression, but they remain code-native vector product studies rather
than final production 3D hero renders. The actual in-world 3D club families still
need corresponding close-product machining and material refinement.

## Next

Return to the highest-frequency zero-brand gap: replace the remaining evenly repeated
course-edge planting and prototype prop rhythm with one bounded Coastal Ridge ecology
composition pass, preserving the exact rendered / physical terrain contract.
