# Integration 025 — LOFT Golfer Silhouette V3

## Outcome

The foreground golfer now reads as one tailored athletic figure rather than a stack
of rotationally symmetric body pieces. The proven analytic pose, fixed limb lengths,
grip, club guide, impact time and turf contacts remain unchanged.

## Built

- six-section asymmetric trouser-seat shell with a readable hip line
- nine-section forward-biased polo profile with shoulder, chest and waist shaping
- larger buried hip and shoulder seals to close high-motion silhouette gaps
- restrained sleeve and trouser cuff construction attached to the moving garments
- separate cream leather upper, stone midsole and thin dark outsole layers
- correct trail-foot toe plant / heel release with a fixed three-layer shoe stack
- shared 16 mm grounding clearance derived from the authored outsole depth
- quieter clubhouse-ink polo and field-stone trouser material hierarchy
- executable apparel-shell and layered-footwear contract across four swing phases

## Protected contracts

- `_poses()`, `_puttPose()`, `_poseAt()` and all analytic animation keys are unchanged
- limb lengths, IK resolution, grip midpoint, shaft relationship and impact phase are
  unchanged
- the original ground-contact landmarks remain the source of shoe placement, with
  one explicit outsole-depth allowance shared by rig and world grounding
- the new midsoles follow the same ankle and heel-release transform as the outsole
- no golf, ball, terrain, cup, camera, scoring, map, equipment or round logic changed

## Before / after

Before: the pelvis and trousers read as a radially symmetric barrel, the polo had a
flat tube profile, and a white shoe block sat directly on a heavy black platform.

After: the trouser seat carries an intentional side profile, the polo narrows and
projects like clothing over an athletic torso, moving garment ends are resolved, and
the footwear has a believable upper / midsole / outsole stack. The improvement is
visible at address, top, impact, finish and close putting distance.

## Verification

- Terrain Gauntlet: 13 / 13 PASS
- Visual Gauntlet: 25 / 25 PASS
- live address, top, impact, finish and close-putting fixtures inspected
- desktop, 390 × 844 portrait and 844 × 390 short-landscape inspected
- live warning / error log empty
- trusted animation and gameplay paths untouched

## Honest result

Silhouette continuity and apparel readability decisively beat Integration 024, but
this remains a code-native analytic golfer rather than a production skinned character.
Hands, face, garment hems and deformation still have a visible ceiling at extreme
close range. Those limitations do not justify risking the currently reliable swing.

## Next

The responsive review exposed a specific every-shot issue: close portrait putting
clips the golfer off the left edge and into the top instruments while the two-foot cup
read is compressed. Build Mobile-First Camera Composition V1 without disturbing the
already healthy normalized full-shot scale.
