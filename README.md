# LOFT v1 — Coastal Ridge

The official, isolated playable LOFT prototype. The current v1 assessment build is
**Gauntlet Integration 035**, including the complete terrain, golf, character, camera,
equipment, ball/cup, map and round work developed through the Gauntlet.

The repository homepage opens the current game in `prototype1/`, not the archived
P0.7 entry. GitHub Pages deploys this repository automatically on pushes to `main`.

## Run locally

From this repository, using Node.js:

```sh
node gauntlet/serve.mjs 43117
```

Open [Coastal Ridge](http://127.0.0.1:43117/prototype1/). No install, build step,
cloud service or database is required; Three.js and game assets are checked in.
The game needs a browser with WebGL. Serve it over HTTP rather than opening a file URL.

## Verify

```sh
node gauntlet/run-visual-gauntlet.mjs
node gauntlet/run-terrain-gauntlet.mjs
node gauntlet/run-ball-gauntlet.mjs
node gauntlet/run-club-assembly-gauntlet.mjs
node gauntlet/run-atelier-gauntlet.mjs
```

The v1 checkpoint passes 63 executable gates. It remains a prototype, not a claim of
production fidelity. Physical-device performance and a new complete manual three-hole
round were not validated in Integration 035. The real club inspector now exposes the
next modeling target: iron/wedge heel attachment and shaft/hosel construction.

Development rules: `AGENTS.md`. Visual constitution: `LOFT_VISUAL_STANDARD.md`.
Resume the loop from `GAUNTLET_STATE.md`; iteration evidence lives in `gauntlet/history/`.
