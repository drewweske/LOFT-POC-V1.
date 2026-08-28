# Performance 001

Result: PASS for source architecture.

Findings and fixes:
- The Line was rebuilding/discarding TubeGeometry on every aim pointer frame.
- replaced with one stable BufferGeometry + Line updated in place
- course-map DOM updates throttled to approximately 15 Hz
- dynamic lens projection matrix updates now occur only when FOV materially changes
- articulated body segments remain stable transform-driven meshes

Largest remaining gap:
Measure FPS and memory on physical iPhone.
