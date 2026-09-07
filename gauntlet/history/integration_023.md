# Integration 023 — LOFT Coastal Ecology V1

## Outcome

Coastal Ridge no longer spends hundreds of submissions drawing one repeated pine,
one repeated shrub blob and a uniform grass scatter. The playable route is now
framed by a deterministic ecology system with distinct wind exposure, shelter and
maintenance communities.

## Built

- three zero-brand-readable tree archetypes:
  - wind-pruned coastal pine with leaning branch structure and asymmetric crown
  - taller irregular ridge pine with a narrow stepped silhouette
  - broad sculpted sentinel with visible lateral structure
- one shared instanced trunk pool plus one instanced crown pool per archetype
- three authored understory families: low heath, warm gorse and compact evergreen
- clustered fescue communities with deliberate open windows at tee, landing shelves,
  approach and green rather than a uniform perimeter carpet
- two instanced coastal-rock families composed relative to the shoreline
- one deterministic layout fingerprint and executable ecology health contract
- explicit non-playable metadata on the ecology root and every visible descendant

## Performance delta

- previous route ecology estimate: about 216 draws / 233,776 instance-weighted tris
- retained ecology: 10 draws / 6 shadow draws / 88,655 instance-weighted tris
- main-course trees: about 180 individual submissions reduced to 4 instanced draws
- 18 trees, 172 understory objects, 1,113 fescue clumps and 24 rocks remain bounded
  inside a 150,000-triangle hard ceiling

## Protected contracts

- `LOFT_FIELD_V4_CONTACT` remains the only rendered / physical terrain authority
- every tree, plant and rock is grounded from `terrainHeight()`
- no ecology instance enters fairway, first cut, tee, fringe, green or sand
- coastal rocks remain within the already non-playable shoreline / cliff envelope
- no ecology collider or alternative heightfield was introduced
- golf, ball, cup, putting, scoring, map, round and camera logic are unchanged

## Before / after

Before: the route edge was an evenly punctuated row of one nine-mesh broccoli pine,
one dark mound shrub, individual boulders and uniformly scattered grass. Ecology cost
more instance-weighted triangles than the complete terrain.

After: the route keeps open golf sightlines while distinct inland, windward and
sheltered communities create asymmetrical framing. Tree silhouettes survive without
labels or orange, gorse and heath have different value structure, and shore rock
rhythm is authored rather than random.

## Rejected live

- the first batched understory material multiplied dark instance tint by dark vertex
  color and collapsed into black blobs; retained tints are near-neutral and let the
  authored material values remain visible
- the first tree crowns retained stacked-disc silhouettes; the retained archetypes
  have broader vertical overlap, larger presence and visible branch geometry inside
  the same four-draw tree budget
- adding a new ecology layer above the old loops; the old tree, grass and rock routes
  were replaced instead
- collidable decorative rocks in playable rough; solid-looking masses remain at the
  shoreline where water / cliff state is already non-playable

## Verification

- Terrain Gauntlet: 13 / 13 PASS
- Visual Gauntlet: 23 / 23 PASS
- deterministic fingerprint: `446bb213`
- zero invalid sites; maximum stored grounding delta approximately 8.1 mm
- desktop tee, close inland, close windward and ocean-side frames inspected
- true 390 × 844 portrait and 844 × 390 short-landscape frames inspected
- live warning / error log empty
- JavaScript syntax and diff whitespace clean

## Honest result

Environmental cohesion rises materially because the course edge is no longer one
repeated procedural stamp, and the replacement is also substantially cheaper. The
ecology remains code-native and deliberately low-noise rather than production scanned
foliage. Its strongest gain is composition, silhouette and performance discipline.

## Next

The distant clubhouse is now the weakest designed world object in nearly every route
overview. Replace the beige box-and-roof placeholder with one bounded, recognizable
Ridge House silhouette that shares the headland, equipment and LOFT curved / honest-
material language without touching the protected course or physics.
