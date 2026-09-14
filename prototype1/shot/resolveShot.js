// Step 3: shared native launch/solver pipeline. No authoritative quantization or
// record format yet. The browser advances the same solver incrementally; Node
// can run it to rest. Clock/aim readers, when needed by the live adapter, are
// explicit dependencies and are never looked up by this module.
import * as THREE from './solverVector.js';
import {GolfPhysics,SOLVER_FIXED_STEP} from '../physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function launchShotPhysics(physics,{metrics,c,L,lie,position,aimYaw,dispersion,dispersionSource}){
  // LOFT Stroke quality is not one hidden power number. A great strike requires
  // rhythm, centered path, decisive release and useful load.
  // Optional raw sine scalar is a test seam; omitted keeps the legacy clock read here.
  const pathNoise=(1-L.form)*(dispersion===undefined?dispersionSource():dispersion)*(c.head==='putter' ? .18 : .75);
  const finalPath=clamp(metrics.path+pathNoise,-9,9);
  const skill=c.head==='putter'
    ? metrics.tempoScore*.30+metrics.rhythm*.27+metrics.center*.29+metrics.commitment*.14
    : metrics.tempoScore*.28+metrics.rhythm*.18+metrics.center*.20+metrics.commitment*.18+metrics.loadScore*.10+metrics.speedScore*.06;

  const q=c.head==='putter'
    ? clamp(.58+.42*skill-.007*Math.abs(finalPath)-(1-L.form)*.012,.52,1.0)
    : clamp(.48+.52*skill-.010*Math.abs(finalPath)-(1-L.form)*.025,.42,1.0);
  const direction=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw()));

  if(c.head==='putter'){
    physics.putt({position:position,club:c,power:metrics.power,paceFeet:metrics.puttPaceFeet,path:finalPath,aimYaw:aimYaw(),strike:q});
  }else{
    physics.launch({
      position:position,
      club:c,
      power:metrics.power,
      path:finalPath,
      form:L.form,
      aimYaw:aimYaw(),
      strike:q,
      release:metrics.commitment,
      lie
    });
  }
  return {q,finalPath,direction};
}

const vector=p=>new THREE.Vector3(p.x,p.y,p.z);
const xyz=p=>({x:p.x,y:p.y,z:p.z});
function snapshot(state){
  return {...state,pos:xyz(state.pos),vel:xyz(state.vel),spinAxis:xyz(state.spinAxis),
    lastSafePos:xyz(state.lastSafePos),surfaceChanged:state.surfaceChanged?{...state.surfaceChanged}:state.surfaceChanged};
}

// In-memory Step 3 inputs, not the later ShotSubmission/ShotRecord serialization:
// ShotIntent: courseHash, holeIndex, ballRestPosition, lieSurface, club (resolved
// equipment values), playerState (resolved modifiers), metrics (all six gesture
// measurements + power/speedScore/puttPaceFeet), aimYaw, environmentState.wind,
// and the Step 2 raw dispersion scalar. No equipment/level/environment lookup.
// Course: matching courseHash, authored holes, and explicit native field methods.
export function resolveShot(ShotIntent,Course){
  if(typeof ShotIntent.courseHash!=='string'||!ShotIntent.courseHash||ShotIntent.courseHash!==Course.courseHash){
    throw new Error('ShotIntent courseHash does not match Course');
  }
  if(!Number.isFinite(ShotIntent.dispersion))throw new Error('Step 3 requires injected dispersion');
  const hole=Course.holes[ShotIntent.holeIndex];
  if(!Number.isInteger(ShotIntent.holeIndex)||!hole)throw new Error('Unknown holeIndex');
  const physics=new GolfPhysics({
    terrainHeight:Course.terrainHeight,terrainSample:Course.sampleTerrain,
    terrainContactY:Course.terrainContactY,terrainSweep:Course.sweepTerrainSegment,
    surfaceAt:Course.courseSurfaceAt,wind:vector(ShotIntent.environmentState.wind),waterLevel:Course.WATER_LEVEL
  });
  physics.setCup(new THREE.Vector3(hole.pin[0],Course.terrainHeight(hole.pin[0],hole.pin[1]),hole.pin[1]));
  const launch=launchShotPhysics(physics,{
    metrics:ShotIntent.metrics,c:ShotIntent.club,L:ShotIntent.playerState,
    lie:ShotIntent.lieSurface,position:vector(ShotIntent.ballRestPosition),
    aimYaw:()=>ShotIntent.aimYaw,dispersion:ShotIntent.dispersion
  });
  const launchState=snapshot(physics.state),trajectory=[];
  while(physics.active){
    physics.step(SOLVER_FIXED_STEP);
    trajectory.push(snapshot(physics.state));
  }
  // Raw, non-authoritative output. No quantum, serialization, trace or scoring
  // policy is installed here; ordinary game/round reactions remain at the caller.
  return {quality:launch.q,path:launch.finalPath,launchState,trajectory,
    landingSurface:physics.state.lastImpactSurface,restState:snapshot(physics.state)};
}
