import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {puttPaceFromPull,puttingDistance,puttStrokeScale} from '../prototype1/putting.js';
import {LEVELS} from '../prototype1/equipment.js';
// Execute the actual registered pointer handlers against an event/DOM adapter.
// This is a deterministic input unit test, not a claimed physical iPhone test.
const game=readFileSync(new URL('../prototype1/game.js',import.meta.url),'utf8');
const source=game.slice(game.indexOf('const pointers=new Map();'),game.indexOf("canvas.addEventListener('wheel'"));
assert.ok(source.includes('function endPointer')&&source.includes('cancelPendingStroke'));
function harness({height=844,width=390,putting=true,cupFeet=.22}={}){
  const handlers={},launches=[],poses=[];let time=0;
  const noop=()=>{},element={classList:{add:noop,remove:noop,contains:()=>false},style:{},setAttribute:noop};
  const state={phase:'ready',level:1,learned:{},shotCount:0,aimYawTarget:0};
  const cam={isSwingLocked:false,zoom:0,beginSwing(){this.isSwingLocked=true;},cancelSwing(){this.isSwingLocked=false;},aimZoom(delta){this.zoom+=delta;},aimPitchBy:noop,resultOrbitBy:noop,resultZoom:noop};
  const context={THREE,Math,Map,LEVELS,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),state,cam,
    document:{getElementById:()=>element},$:()=>element,
    performance:{now:()=>time},canvas:{addEventListener:(type,fn)=>handlers[type]=fn,setPointerCapture:noop,getBoundingClientRect:()=>({width,height})},
    feedback:{unlock:noop,puttTransition:noop,paceLock:noop,loadSet:noop,transition:noop,release:noop},
    golfer:{setPose:phase=>poses.push(phase)},ballGroup:{position:new THREE.Vector3()},halo:{position:new THREE.Vector3()},
    screenOf:()=>({x:width*.68,y:height*.66}),isPutting:()=>putting,isShortGame:()=>false,
    aimYaw:()=>0,COURSE_YAW:0,cupDistanceFeet:()=>cupFeet,recommendedLoad:()=>.8,
    chronicleIsOpen:()=>false,showContext:noop,setTip:noop,updateTip:noop,syncChronicleAvailability:noop,
    beginStrokeSignal:noop,hidePuttPace:noop,hideStrokeSignal:noop,updateStrokeSignal:noop,updatePuttPaceGhost:()=>false,
    puttPaceFromPull,puttingDistance,puttStrokeScale,
    launchShot:metrics=>{launches.push(metrics);state.phase='flight';}
  };
  vm.runInNewContext(source,context);
  const x=width*.68,y=height*.66;
  const emit=(type,{id=1,dx=0,dy=0,ms=16}={})=>{
    time+=ms;handlers[type]({pointerId:id,clientX:x+dx,clientY:y+dy,preventDefault:noop});
  };
  return {emit,state,cam,launches,poses};
}
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS  '+name);};
check('portrait and landscape pull-return strokes launch once with their authored pace',()=>{
  for(const [width,height] of [[390,844],[844,390],[1280,720]]){
    const h=harness({width,height}),depth=height*.25*.25;
    h.emit('pointerdown');
    for(let i=1;i<=8;i++)h.emit('pointermove',{dy:depth*i/8,ms:50});
    for(let i=1;i<=8;i++)h.emit('pointermove',{dy:depth-(depth+6)*i/8,ms:25});
    h.emit('pointermove',{dy:-20});h.emit('pointerup',{dy:-20});
    assert.equal(h.launches.length,1);assert.ok(h.launches[0].puttPaceFeet<.4&&h.launches[0].puttPaceFeet>.2);
    assert.ok(h.launches[0].tempoScore>.8);assert.equal(h.launches[0].path,0);
    assert.equal(h.state.phase,'flight');
  }
});
check('lift/cancel during the backstroke costs no stroke and releases the view',()=>{
  for(const event of ['pointerup','pointercancel']){
    const h=harness();h.emit('pointerdown');h.emit('pointermove',{dy:45});h.emit(event,{dy:45});
    assert.equal(h.launches.length,0);assert.equal(h.cam.isSwingLocked,false);assert.equal(h.state.interaction,null);
    assert.equal(h.poses.at(-1),0);
  }
});
check('a second finger releases provisional swing intent and pinch zoom remains live',()=>{
  const h=harness();h.emit('pointerdown');assert.equal(h.cam.isSwingLocked,true);
  h.emit('pointerdown',{id:2,dx:-100});assert.equal(h.cam.isSwingLocked,false);
  h.emit('pointermove',{id:2,dx:-150});assert.ok(Math.abs(h.cam.zoom)>0);
  h.emit('pointerup',{id:2,dx:-150});h.emit('pointerup');
  assert.equal(h.launches.length,0);assert.equal(h.state.phase,'ready');
  h.emit('pointerdown');h.emit('pointermove',{dy:50});h.emit('pointermove',{dy:-6,ms:200});h.emit('pointerup',{dy:-6});
  assert.equal(h.launches.length,1,'putting remains usable after pinch');
});
check('full-swing return still launches with load, rhythm, release and path metrics',()=>{
  const h=harness({putting:false});h.emit('pointerdown');
  for(let i=1;i<=8;i++)h.emit('pointermove',{dy:i*25,ms:65});
  for(let i=1;i<=8;i++)h.emit('pointermove',{dy:200-i*28,ms:25});
  h.emit('pointerup',{dy:-24});assert.equal(h.launches.length,1);
  for(const key of ['power','path','tempoScore','rhythm','commitment','loadScore','speedScore'])assert.ok(Number.isFinite(h.launches[0][key]),key);
  assert.ok(h.launches[0].power>.8);assert.equal(h.launches[0].puttPaceFeet,undefined);
});
console.log(`\nLOFT STROKE INPUT GAUNTLET: ${count}/${count} checks passed`);
