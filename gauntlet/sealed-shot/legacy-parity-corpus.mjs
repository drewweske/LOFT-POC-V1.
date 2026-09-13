// Test-only adapter around the untouched legacy solver. Not resolveShot, not a
// production extraction. Cases are checked-in inputs, never randomized at test time.
import * as THREE from '../../vendor/three.module.js';
import {GolfPhysics} from '../../prototype1/physics.js';
import {CLUBS} from '../../prototype1/equipment.js';
import {terrainHeight,terrainContactY,sampleTerrain,sweepTerrainSegment,courseSurfaceAt} from '../../prototype1/worldV2.js';
import {projectPhysicsFrame} from './parity-projection-v1.mjs';
import {createHash} from 'node:crypto';
export function runLegacyCase(input){
  const vector=([x,z])=>new THREE.Vector3(x,terrainContactY(x,z,.0265),z);
  const physics=new GolfPhysics({terrainHeight,terrainContactY,terrainSample:sampleTerrain,terrainSweep:sweepTerrainSegment,surfaceAt:courseSurfaceAt,wind:new THREE.Vector3(...input.wind)});
  physics.setCup(vector(input.cup));
  const launch={...input.launch,position:vector(input.position),club:CLUBS.find(c=>c.id===input.club)};
  if(!launch.club)throw Error('unknown fixture club');
  physics[input.method](launch);
  const launchFrame=projectPhysicsFrame(physics),trace=createHash('sha256');
  let frames=0;
  while(physics.active){
    if(frames++>4000)throw Error('legacy fixture did not terminate');
    physics.step(1/120);
    trace.update(JSON.stringify(projectPhysicsFrame(physics))+'\n');
  }
  return {launchFrame,frames,trajectorySha256:trace.digest('hex'),terminalFrame:projectPhysicsFrame(physics)};
}
