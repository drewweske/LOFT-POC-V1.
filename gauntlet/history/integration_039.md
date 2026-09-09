# Integration 039 — Coastal Ridge inland setting

Retained locally: 2026-09-08. Entry `game.js?v=039-final`. Baseline 038 `06954b6`.
No remote push, hosting change, new dependency or generated concept image.

## Reference → gap → great

The World, Main Shot and Live Shot references situate golf inside an authored coastal
landscape. The real retained tee still had a nearly empty flat inland skyline. A bounded
world-first improvement should frame Ridge House with broad hills and a saddle while
keeping the lighthouse, pin, camera and entire playable field unchanged.

## Built in the playable scene

`coastalHinterland.js` builds one continuous off-play apron and inland relief mesh.
It is integrated into `worldV2.js`, not a separate scene or fake screenshot.

- All triangles lie beyond x=-92 or z=-292; physical boundary recovery remains at
  |x|>88 / z<-286. No collider or playable terrain height changes were made.
- All 431 western and 146 northern 0.8 m field-edge stations meet the existing
  Float32 terrain positions and ground colors. Coarser distant sampling spends
  geometry on silhouette and mass rather than invisible sub-metre detail.
- Three broad authored masses and one saddle create a coherent inland setting;
  restrained exposure/heath color supports their shape without noisy micro-scatter.
- One draw, 9,578 vertices /17,946 triangles, no textures, no shadow pass.
  Existing lighting, atmosphere, vegetation and landmarks are unchanged.

## Observe → critique → improve

The first actual render added setting but reached about 42.5 m and read like a wall.
That candidate was rejected. Lower west/shoulder/north masses and softer material
transitions retain a readable inland context while releasing the clubhouse silhouette.
The normal tee frame now has a landform behind the course instead of empty flat sky.

This is not a substitute for authored playable routing, production vegetation, rock
assets or close grass. The near-field ground remains too uniformly painted, and the
new hills are deliberately low-detail background land. The next target addresses
ground-level material scale rather than adding more skyline decoration.

## Verification

77/77: Visual 37 + Terrain 14 + Ball 6 + Assembly 1 + Atelier 5 + Neck 4 + Forging 3
+ Sole 4 + Hinterland 3. Syntax checks and diff check pass.

- Full terrain/contact SHA-256 remains
  `1c16597140c7e18dfe0c6a6d3b87573f1c276d8e83d4b3d53f83a21eb8d03c41`.
- New geometry gates verify actual triangle exclusion, upward winding, finite unit
  normals, deterministic buffers, bounded maximum height and seam position/color.
- Actual camera projections across three holes × three aspects × tee/approach show
  measurable relief; triangle raycasts keep the pin, Ridge House and actual lighthouse
  lantern center unobstructed. This is stronger than scene metadata alone.
- Live desktop/short-landscape tee, phone two-foot putting fixture and map open/close were inspected.
  Browser errors/warnings remained empty. No new complete manual round, motion-capture
  claim or physical-device performance measurement.
- Short-landscape review exposed a pre-existing target-card/golfer overlap: placement
  guards only DOM panels, not the projected character. World/camera/placement inputs
  are unchanged by 039. This is the immediate follow-up before the turf target.
- An initial expression syntax error was caught and immediately repaired before
  browser QA. No such error remains in the retained build.

| Category | Before | After |
| --- | ---: | ---: |
| Course setting / skyline composition | 3.5 | 5.3 |
| Environment overall | 4.8 | 5.0 |
| Technical integrity | 9.0 | 9.0 |

## One next target

Near-field turf and maintained-cut material readability. Inspect tee/putting frames,
measure the existing texture footprint, then improve within the existing shared
albedo/roughness/bump system. Keep field/physics/camera unchanged. No blade speckle,
false-break noise or exaggerated stripes. Judge real phone rendering before retaining.
