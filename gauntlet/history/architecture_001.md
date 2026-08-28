# Architecture 001

Artifact: isolated Prototype 1 branch + vendored Three.js runtime.

Result: PASS for current vertical-slice stage.

Largest gap found before rebuild:
The previous P0.x runtime depended on a fragile external module import and had become structurally coupled to disposable prototype code.

Build response:
- created branch `prototype-1-gauntlet`
- preserved P0.x as negative control
- vendored Three.js r164 at `/vendor/three.module.js`
- started a clean modular Prototype 1 implementation under `/prototype1/`

Boundary:
Real iPhone Safari performance still requires device validation.
