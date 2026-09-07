# Integration 027 — Coastal Turf & Light Readability V2

## Outcome

Coastal Ridge no longer relies on one flattened olive response. Rough, first cut,
fairway, fringe, green, tee and sand now carry an ordered material hierarchy; broad
terrain grade reads in the same direction as the real sun; and maintained turf keeps
a restrained, inspection-scale weave without blade-card speckle.

## Built

- frozen `LOFT_COASTAL_TURF_LIGHT_V2` presentation and performance specification
- one shared key-light vector for live illumination and baked grade response
- reduced ambient wash with a warmer, stronger coastal key
- physically ordered surface roughness from green through fairway, first cut, rough
  and sand
- quieter, warped fairway mowing and restrained green / tee nap
- deterministic two-scale turf weave and broader wind-shaped rough variation
- low-amplitude interlocking-fibre bump source with no extra texture or draw call
- executable surface-statistics, lighting-ratio, texture-budget and material gates
- literal SHA-256 lock over 297,361 terrain/contact/surface probes

## Protected contracts

- all 99,561 terrain vertices and 197,800 triangles are byte-identical in behavior
- every sampled triangle height, shared normal and course surface retains the
  protected `1c165971…d03c41` fingerprint
- `SURFACE_LIFT` remains zero for every playable surface
- one terrain mesh, one terrain material and the same three texture sources
- ball, lie, bounce, roll, cup, scoring, map, camera and round behavior are untouched

## Before / after

Before: baked terrain relief pointed toward a different light than the live sun,
ambient/fill intensity compressed the mesh normals, surface roughness clustered near
fully matte, and regular mowing stripes read more strongly than the land beneath them.
The close green and lower full-shot frame became broad single-value planes.

After: baked and live response agree, key-to-ambient ratio is 2.83:1, effective
roughness spans approximately 0.69 on green to 0.95 in sand, neighboring cuts hold
measured luma separation, and local grade / turf nap remain readable on desktop and
phone without looking painted or noisy.

## Rejected live

- accepting the first numerically valid candidate: its close green still read too
  smooth, so grade strength and meter-scale weave were raised within bounded limits
- a 15% diagnostic green stripe used only to prove browser cache freshness; it
  visibly overpowered contour and was reduced to the retained 3.5% response
- another detail texture or overlay mesh: unnecessary draw/memory cost and a direct
  risk to terrain/physics visual agreement
- individual green blade cards: previous captures proved they become black speckle
  at gameplay distance

## Verification

- Terrain Gauntlet: 14 / 14 PASS
- Visual Gauntlet: 27 / 27 PASS
- protected contact fingerprint: `1c16597140c7e18dfe0c6a6d3b87573f1c276d8e83d4b3d53f83a21eb8d03c41`
- one terrain draw / one material / three textures / 4,900,864 raw texture bytes
- desktop tee and precision green inspected live
- 390 × 844 portrait and 844 × 390 short-landscape inspected live
- live warning / error log empty

## Honest result

The raw course is materially more readable and internally truthful, but the renderer
remains a lightweight code-native prototype rather than a production scanned-turf
pipeline. Surface response now supports the land instead of contradicting it; it does
not pretend to be final photoreal grass.

## Next

The largest every-shot object gap is the in-world club. Workshop drawings establish
designed families, but the playable putter and metal heads still read as primitive
assemblies at address. Build In-World Club Craft V2: recognizable industrial design,
honest face/sole/hosel construction, tier-readable geometry and exact ball/ground
clearance without changing club physics or swing landmarks.
