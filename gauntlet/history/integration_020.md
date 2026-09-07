# Integration 020 — Lighthouse Headland Backdrop V1

## Outcome

Coastal Ridge now owns an authored off-course sea-cliff composition that grounds
the lighthouse, preserves an ocean band, and replaces the former horizon rhythm
of repeated brown boulder blobs with broad stepped geology.

## Built

- seven matte, vertex-graded geological masses with a deliberate lantern notch
- dark wet-base strata, dry warm stone shelves, heath caps, two sea stacks
- three sparse wind-pruned pine silhouettes and ten restrained heath clusters
- quieter near-coast rock density and scale so the landmark composition can read
- visual-only placement entirely beyond the playable terrain grid

## Protected contracts

- no terrain height, normal, contact, sweep, surface, water or cup function changed
- every headland child is explicitly `nonPlayable`
- nearest world bound is `z = -294.939`, beyond the `z = -294` limit
- the headland is never mutated by `updateWorld()`
- 10 draw calls and 13,044 rendered triangles stay inside the fixed budget

## Before / after

Before: pale horizon, isolated lighthouse, flat ocean strip, bead-like brown rocks.

After: a readable lighthouse promontory, layered coastal silhouette, visible ocean
plane, sparse planting, and stronger zero-brand destination identity.

## Verification

- Terrain Gauntlet 13 / 13
- Visual Gauntlet expanded with an executable headland boundary/performance contract
- desktop reset, modest ocean-side aim, maximum-wide, putting, portrait and short-landscape inspected
- live warning/error logs empty

## Rejected approaches

- on-course cliff overlays, because they would visually disagree with collision
- a sky-only pass, because it could not give the lighthouse a physical place
- the first low headland scale, because it disappeared behind nearer coast rocks
- disabling fog, because it made a distant visual backdrop read as a foreground prop

## Next

Build the bounded Coastal Air system so the new geology, sky and ocean separate as
three depth planes without changing lighting, terrain or gameplay.
