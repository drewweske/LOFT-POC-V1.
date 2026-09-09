import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as THREE from '../vendor/three.module.js';
import {GolfPhysics as CurrentPhysics} from '../prototype1/physics.js';
import {puttPaceFromPull,puttingDistance,puttContactProfile,puttStrokeScale} from '../prototype1/putting.js';
import {LoftFeedback} from '../prototype1/feedback.js';
import {LoftCamera} from '../prototype1/camera.js';
import {LoftGolferRig} from '../prototype1/characterRig.js';
import {CLUBS,LEVELS} from '../prototype1/equipment.js';
import {COLORS,terrainHeight,terrainContactY,sampleTerrain,courseSurfaceAt} from '../prototype1/worldV2.js';
import {ROUND_HOLES} from '../prototype1/round.js';
import {LoftTopoMap} from '../prototype1/topoMap.js';
let Physics=CurrentPhysics;
if(process.argv.includes('--baseline')){
  let source=execFileSync('git',['show','06954b6:prototype1/physics.js'],{encoding:'utf8'});
  source=source.replace('../vendor/three.module.js',new URL('../vendor/three.module.js',import.meta.url).href)
    .replace('./surfaces.js',new URL('../prototype1/surfaces.js',import.meta.url).href);
  Physics=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).GolfPhysics;
}
let passes=0,failures=0;
const check=(name,fn)=>{try{fn();passes++;console.log('PASS  '+name);}catch(e){failures++;console.log('FAIL  '+name+' — '+e.message);}};
const putter=CLUBS.find(c=>c.id==='putter');
function flat({x=0,z=.08,speed=.8,paceFeet=null,cup=true,dt=1/120}={}){
  const physics=new Physics({terrainHeight:()=>0,surfaceAt:()=> 'green',wind:new THREE.Vector3()});
  if(cup)physics.setCup(new THREE.Vector3());
  physics.putt({position:new THREE.Vector3(x,.0265,z),club:putter,path:0,paceFeet});
  if(paceFeet===null)physics.state.vel.set(0,0,-speed);
  for(let i=0;i<4000&&physics.active;i++)physics.step(dt);
  assert.equal(physics.active,false,'putt must settle');return physics;
}
check('firm centred entries are not rejected at the inbound throat boundary',()=>{
  for(const speed of [.65,.8,1.2,1.8])for(const z of [.065,.08,.11])for(const dt of [1/30,1/60,1/120]){
    assert.equal(flat({speed,z,dt}).state.holed,true,`${speed} m/s from ${z}, frame ${dt}`);
  }
});
check('hot centres and glancing edges remain honest misses',()=>{
  for(const speed of [2.2,2.6,5])assert.equal(flat({speed}).state.holed,false);
  for(const [x,speed] of [[.025,1.6],[.04,.8],[.05,.7],[.077,.3]])assert.equal(flat({x,speed}).state.holed,false,`${x} / ${speed}`);
});
check('slow unsupported overhang falls before static-friction settlement',()=>{
  for(const x of [.038,.045,.049,.052])for(const speed of [0,.04,.08]){
    assert.equal(flat({x,z:0,speed}).state.holed,true,`${x} m, ${speed} m/s`);
  }
});
check('supported rim and near-cup rests are not magnetized',()=>{
  for(const x of [.0535,.054,.060,.075,.09]){
    const s=flat({x,z:0,speed:0}).state;
    assert.equal(s.holed,false);assert.equal(s.pos.x,x);assert.equal(s.pos.z,0);
  }
});
check('rim rejection cannot slow-capture in the same pass but clears on a new encounter',()=>{
  const p=new Physics({terrainHeight:()=>0,surfaceAt:()=> 'green',wind:new THREE.Vector3()});p.setCup(new THREE.Vector3());
  p.putt({position:new THREE.Vector3(0,.0265,-.015),club:putter,path:0});
  const s=p.state;s.vel.set(0,0,-2.6);assert.equal(p._tryCup(s,'green'),false);
  s.vel.set(0,0,-.3);assert.equal(p._tryCup(s,'green'),false);
  s.pos.z=-.1;p._tryCup(s,'green');s.pos.z=-.02;s.vel.z=.3;
  assert.equal(p._tryCup(s,'green'),true);
});
check('pace-authored sub-inch strokes have no twelve-centimetre launch floor',()=>{
  const distances=[.02,.04,.08,.16,.3].map(paceFeet=>Math.abs(flat({cup:false,z:0,paceFeet}).state.pos.z));
  assert.ok(distances[0]<.01,JSON.stringify(distances));
  for(let i=1;i<distances.length;i++)assert.ok(distances[i]>distances[i-1]*1.25);
});
check('short-putt thumb range is generous and continuous at every supported height',()=>{
  for(const height of [390,720,844]){
    assert.equal(puttPaceFromPull(0,height,.2).feet,0);
    let prior=-1,count=0;
    for(let px=8;px<height*.25;px++){
      const {feet}=puttPaceFromPull(px,height,.2);assert.ok(feet>prior);prior=feet;
      if(feet>.1&&feet<.6)count++;
    }
    assert.ok(count>22,`tap-in control window ${count}px`);
    assert.ok(puttPaceFromPull(height*.25,height,30).feet>=55);
  }
  assert.deepEqual(puttingDistance(.06),{value:'2',unit:'IN'});
  assert.deepEqual(puttingDistance(.6096),{value:'2',unit:'FT'});
});
check('real three-hole greens accept deliberate four-inch finishes from all directions',()=>{
  for(const hole of ROUND_HOLES)for(let i=0;i<12;i++){
    const yaw=i*Math.PI/6,pin=new THREE.Vector3(hole.pin[0],0,hole.pin[1]);
    pin.y=terrainHeight(pin.x,pin.z);
    const physics=new Physics({terrainHeight,terrainContactY,terrainSample:sampleTerrain,surfaceAt:courseSurfaceAt,wind:new THREE.Vector3()});physics.setCup(pin);
    const p=pin.clone().add(new THREE.Vector3(-Math.sin(yaw)*.1016,0,Math.cos(yaw)*.1016));p.y=terrainContactY(p.x,p.z,.0265);
    physics.putt({position:p,club:putter,paceFeet:.65,path:0,aimYaw:yaw,strike:.9});
    for(let step=0;step<1200&&physics.active;step++)physics.step(1/60);
    assert.equal(physics.state.holed,true,`${hole.number} bearing ${i}`);
  }
});
check('tap contact stays quiet throughout its envelope; full shots retain weight',()=>{
  const feedback=new LoftFeedback(new THREE.Scene(),COLORS),position=new THREE.Vector3(),direction=new THREE.Vector3(0,0,-1);
  feedback.impact({club:'putter',paceFeet:.2,quality:.95,position,direction});
  const start=feedback.impactRing.material.opacity;
  feedback.update(1/60);
  assert.ok(feedback.impactRing.material.opacity<start);assert.ok(feedback.impactRing.scale.x<.5);
  const tap=puttContactProfile(.2,.95),lag=puttContactProfile(20,.95);
  assert.ok(tap.hitStop<.01&&tap.compression<.1&&tap.cameraImpulse<.1);assert.ok(lag.energy>tap.energy*3);
  feedback.impact({club:'iron',quality:.95,position,direction});feedback.update(1/60);
  assert.ok(feedback.impactRing.material.opacity>.4);assert.ok(feedback.impactRing.scale.x>.7);
});
check('cup reward meets the actual drop instead of finishing its audio at the rim',()=>{
  const feedback=new LoftFeedback(new THREE.Scene(),COLORS),noise=[],tones=[];
  feedback._noise=event=>noise.push(event);feedback._tone=(...event)=>tones.push(event);
  feedback.cup({position:new THREE.Vector3(),score:0});feedback.update(1/60);
  assert.ok(tones.some(event=>event[5]>=.30&&event[5]<=.36));
  assert.ok(noise.some(event=>event.delay>=.33&&event.delay<=.38));
  assert.ok(feedback.landRing.scale.x<.6&&feedback.landRing.material.opacity<.3);
});
check('the course map reports a holed ball as HOLED, not an invented inch remaining',()=>{
  const elements=new Map(),root={querySelector:selector=>{
    if(!elements.has(selector))elements.set(selector,{setAttribute(){},textContent:''});
    return elements.get(selector);
  }};
  const map=new LoftTopoMap(root),ball=new THREE.Vector3(.02,-.0736,0),target=new THREE.Vector3();
  map.update({ball,target,pin:target,surface:'cup',distanceUnit:'FT'});
  assert.equal(elements.get('#map-distance').textContent,'HOLED');assert.equal(elements.get('#map-lie').textContent,'CUP');
  map.update({ball:new THREE.Vector3(.065,0,0),target,pin:target,surface:'green',distanceUnit:'FT'});
  assert.equal(elements.get('#map-distance').textContent,'3 IN');
});
check('scaled pendulum has a continuous reversal and stable impact grip',()=>{
  const rig=new LoftGolferRig(COLORS);rig.setClub(putter,1);
  for(const feet of [.2,2,8,30]){
    rig.puttStrokeScale=puttStrokeScale(feet);
    const top=rig._puttPose(.38,LEVELS[1]),returning=rig._puttPose(.380001,LEVELS[1]);
    assert.ok(new THREE.Vector3(...top.club).distanceTo(new THREE.Vector3(...returning.club))<.00001);
    assert.ok(Math.abs(top.club[2]-.035*Math.sqrt(feet))<1e-9);
    const impact=rig._puttPose(.6,LEVELS[1]);assert.equal(impact.club[2],0);
  }
});
check('putt contact retains the green-reading lens and camera position',()=>{
  for(const [w,h] of [[1280,720],[390,844],[844,390]]){
    const camera=new THREE.PerspectiveCamera(43,w/h,.1,750),controller=new LoftCamera(camera);
    const ball=new THREE.Vector3(0,.0265,0),pin=new THREE.Vector3(0,0,-.10);
    for(let i=0;i<180;i++)controller.updateAim(1/60,{ball,pin,aimYaw:0,putting:true});
    controller.beginSwing(0);controller.beginFlight(0);
    const before=camera.position.clone(),fov=camera.fov;
    controller.updateFlight(1/60,{ball,velocity:new THREE.Vector3(0,0,-.5),pin,putting:true});
    assert.ok(camera.position.distanceTo(before)<.01);assert.ok(Math.abs(camera.fov-fov)<.01);
  }
});
console.log(`\nLOFT PUTTING GAUNTLET: ${passes}/${passes+failures} checks passed`);
if(failures)process.exitCode=1;
