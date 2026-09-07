# Integration 021 — LOFT Coastal Air V1

## Outcome

Every primary gameplay frame now has a calm coastal-blue sky ramp, restrained warm
horizon lift, subtle unique procedural cloud sheets, and a farther fog envelope that
preserves the new headland's geological contrast.

## Built

- frozen `COASTAL_AIR_SPEC` shared by world and renderer setup
- blue-to-warm authored sky dome with restrained key-side horizon warmth
- four deterministic 512 × 256 procedural cloud sheets with unique silhouettes,
  cream upper lobes and blue-stone undersides
- linear fog moved from `165–430` to `235–530`
- executable atmosphere contract covering system identity, fog, sheet count,
  draw calls and the honest 2 MiB procedural texture budget

## Protected contracts

- directional lights, shadow cameras, exposure and tone mapping unchanged
- terrain, headland geometry, water, foam, cup, ball, camera and gameplay unchanged
- no external texture, post-processing, dependency or cloud infrastructure added

## Before / after

Before: a nearly uniform pale sheet bleached the headland and collapsed sky, geology
and ocean into one value plane.

After: sky, headland and water separate in reset, wide, ocean-side, portrait and
short-landscape views while the UI and course remain the visual hierarchy.

## Rejected approaches

- repeated high-opacity cloud cards, because the pattern read as a decal row
- taller over-soft billboards, because they became a fog smear
- instanced 3D sphere clouds, because the live result read as suspended stones
- bloom, sun flares, external sky textures and post-processing, because they add cost
  and generic spectacle without strengthening LOFT's authored world language

## Verification

- Terrain Gauntlet 13 / 13
- Visual Gauntlet 17 / 17
- 1280 × 720 reset, maximum-wide, ocean-side and close-putting inspected
- true 390 × 844 and 844 × 390 responsive views inspected without clipping
- both live tabs have empty warning/error logs
- JavaScript syntax and diff whitespace gates clean

## Next

Choose the next largest every-shot discrepancy between collectible equipment fidelity
and Coastal Ridge ecology/architecture using fresh adversarial review.
