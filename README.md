# LOFT v1 — Coastal Ridge

The isolated playable LOFT prototype. Current retained build: **Integration 041 —
THE FLIGHT**, including the terrain, golf, character, equipment, putting, ball/cup,
map and round work developed through the Gauntlet. Publication status is recorded
in `GAUNTLET_STATE.md`; no unreleased architecture feature is implied.

The repository homepage opens the current game in `prototype1/`, not the archived
P0.7 entry. A GitHub Pages workflow exists, but Pages is not enabled; a source push
does not currently create a playable public site. No hosting setting was changed.

## Run locally

From this repository, using Node.js:

```sh
node gauntlet/serve.mjs 43117
```

Open [Coastal Ridge](http://127.0.0.1:43117/prototype1/). No install, build step,
cloud service or database is required; Three.js and game assets are checked in.
The game needs a browser with WebGL. Serve it over HTTP rather than opening a file URL.

## Test on iPhone

On the PC, from this repository:

```sh
node gauntlet/serve.mjs 43118 --lan
```

Open the printed URL in iPhone Safari on the same trusted Wi-Fi; keep the PC awake.
Do not use `127.0.0.1` on the phone—that points to the phone itself. `--lan` detects
the current private address; if multiple interfaces exist, pass your Wi-Fi IPv4
explicitly instead. The server serves only the game assets, not repository metadata.
If Safari cannot connect, check same-Wi-Fi and Windows inbound access; no firewall
rule is created automatically. Viewport/input tests pass, but actual iPhone Safari
connectivity, audio and performance are not yet verified.

## Verify

```sh
node gauntlet/run-visual-gauntlet.mjs
node gauntlet/run-terrain-gauntlet.mjs
node gauntlet/run-ball-gauntlet.mjs
node gauntlet/run-club-assembly-gauntlet.mjs
node gauntlet/run-atelier-gauntlet.mjs
node gauntlet/run-club-neck-gauntlet.mjs
node gauntlet/run-club-forging-gauntlet.mjs
node gauntlet/run-wedge-sole-gauntlet.mjs
node gauntlet/run-hinterland-gauntlet.mjs
node gauntlet/run-putting-gauntlet.mjs
node gauntlet/run-stroke-input-gauntlet.mjs
node gauntlet/run-preview-gauntlet.mjs
node gauntlet/run-flight-gauntlet.mjs
```

Integration 041 passes **105 executable gates**. Flight also passes 30/60/120 FPS
delivery: 378 trajectories, 166,269 frames, at least 68.77% apex sky, 9.057% ball-edge
margin and six-pixel actual-ball apex diameter in the tested viewports. These are
bounded automated tests, not universal or physical-device performance claims.
Shot As Data's determinism/purity/replay gates are not implemented yet.

Development rules: `AGENTS.md`. Visual constitution: `LOFT_VISUAL_STANDARD.md`.
Resume the loop from `GAUNTLET_STATE.md`; iteration evidence lives in `gauntlet/history/`.
