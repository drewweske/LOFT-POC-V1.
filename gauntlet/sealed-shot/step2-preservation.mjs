// Test-only inverse of the EXACT authorized Step 2 edit. Never imported by play.
// Keeps the Integration 041 fixture immutable; this is not a new baseline.
import assert from 'node:assert/strict';
export const PRE_STEP2_COMMIT='7fbb6b877954ebd652e6296f4828ce5e8271e008';
export const STEP2_EDITS=Object.freeze([
  Object.freeze(['function launchShot(metrics){','function launchShot(metrics,dispersion){']),
  Object.freeze([
    "  const pathNoise=(1-L.form)*Math.sin(performance.now()*.012)*(c.head==='putter' ? .18 : .75);",
    "  // Optional raw sine scalar is a test seam; omitted keeps the legacy clock read here.\n  const pathNoise=(1-L.form)*(dispersion===undefined?Math.sin(performance.now()*.012):dispersion)*(c.head==='putter' ? .18 : .75);"
  ])
]);
export function undoStep2Seam(canonicalGame){
  let source=canonicalGame;
  for(const [before,after] of STEP2_EDITS){
    assert.equal(source.split(after).length-1,1,'exact Step 2 edit must occur once');
    assert.equal(source.split(before).length-1,0,'legacy edit must not coexist');
    source=source.replace(after,before);
  }
  return source;
}
