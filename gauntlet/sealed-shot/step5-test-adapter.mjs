// TEST ONLY. The frozen Step 4 corpus contains injected raw scalars, not seeds.
// Wire that operand into the unchanged Step 2 launch-level seam in an isolated
// module realm. This file is never imported by production. No math is copied,
// no oracle/fixture is regenerated, and no production ShotIntent gains a second
// dispersion authority. Every other byte of the current resolver executes as is.
import assert from 'node:assert/strict';
export function injectedResolverSource(source){
  const normal='    dispersionSource:()=>dispersionFromShotSeed(ShotIntent.shotSeed)';
  assert.equal(source.split(normal).length-1,1,'unique production seed operand');
  return source.replace(normal,'    dispersion:ShotIntent.dispersion');
}
