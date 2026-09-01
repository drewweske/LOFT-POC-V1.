import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {
  BUNKERS,
  WATER_LEVEL,
  courseSurfaceAt,
  fairwayProfile,
  sampleTerrain,
  sweepTerrainSegment,
  terrainContactY,
  terrainHeight,
  validateTerrain
} from '../prototype1/worldV2.js';
import {ROUND_HOLES} from '../prototype1/round.js';
import {GolfPhysics,BALL_CONTACT_HEIGHT} from '../prototype1/physics.js';
import {SURFACE_PHYSICS} from '../prototype1/surfaces.js';

const checks=[];
const check=(name,fn)=>{
  fn();checks.push(name);console.log(`PASS  ${name}`);
};
const near=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
const wind=new THREE.Vector3(0,0,0);

function makePhysics(){
  return new GolfPhysics({
    terrainHeight,
    terrainSample:sampleTerrain,
    terrainContactY,
    terrainSweep:sweepTerrainSegment,
    surfaceAt:courseSurfaceAt,
    wind,
    waterLevel:WATER_LEVEL
  });
}

function seeded(seed=1){
  return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
}

function stepUntilDone(physics,seconds=26,dt=1/120,onStep=()=>{}){
  const count=Math.ceil(seconds/dt);
  for(let i=0;i<count&&physics.active;i++){
    const state=physics.step(dt);onStep(state);
  }
  return physics.state;
}

function rollingState(position,velocity,surface){
  return {
    pos:position.clone(),vel:velocity.clone(),spinAxis:new THREE.Vector3(),spinOmega:0,
    surface,stopped:false,quality:1,lastImpactSurface:null,bounced:true,holed:false,
    lipTouched:false,lastSurface:surface,surfaceChanged:null,simTime:0,recovered:false,
    lastSafePos:position.clone()
  };
}

check('repository boundary is the verified LOFT remote',()=>{
  const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim().replaceAll('\\','/');
  const remote=execFileSync('git',['config','--get','remote.origin.url'],{encoding:'utf8'}).trim();
  assert.ok(root.endsWith('/LOFT-POC-V1'));
  assert.match(remote,/drewweske\/LOFT-POC-V1\.\.git$/);
  const source=['prototype1/game.js','prototype1/worldV2.js','prototype1/physics.js','prototype1/surfaces.js']
    .map(file=>readFileSync(file,'utf8')).join('\n');
  assert.doesNotMatch(source,/supabase|aezrio/i);
});

const health=validateTerrain();
check('LOFT Field V4 validates',()=>{
  assert.equal(health.ok,true);
  assert.equal(health.system,'LOFT_FIELD_V4_CONTACT');
  assert.equal(health.renderPhysicsContract,'TRIANGLE_HEIGHT_SHARED_NORMAL');
  assert.equal(health.grid.dx,.8);assert.equal(health.grid.dz,.8);
  assert.ok(health.minNormalY>.80);
});

check('terrain samples share height and a unit readable normal',()=>{
  const rnd=seeded(16016);
  for(let i=0;i<4000;i++){
    const x=health.grid.xMin+rnd()*(health.grid.xMax-health.grid.xMin);
    const z=health.grid.zMin+rnd()*(health.grid.zMax-health.grid.zMin);
    const frame=sampleTerrain(x,z);
    assert.ok(near(frame.height,terrainHeight(x,z),2e-6));
    assert.ok(near(Math.hypot(frame.normal.x,frame.normal.y,frame.normal.z),1,2e-6));
    assert.ok(frame.normal.y>.72);
    assert.ok(terrainContactY(x,z,BALL_CONTACT_HEIGHT)>=frame.height+BALL_CONTACT_HEIGHT-2e-6);
  }
});

check('course cuts and hazards resolve to visible physical identities',()=>{
  for(const hole of ROUND_HOLES){
    assert.equal(courseSurfaceAt(hole.tee[0],hole.tee[1]),'tee');
    assert.equal(courseSurfaceAt(hole.pin[0],hole.pin[1]),'green');
  }
  for(const bunker of BUNKERS)assert.equal(courseSurfaceAt(bunker.x,bunker.z),'sand');
  for(const z of [-46,-104,-214]){
    const profile=fairwayProfile(z),seen=new Set();
    for(let x=profile.center;x<=profile.center+profile.width+8;x+=.10)seen.add(courseSurfaceAt(x,z));
    assert.ok(seen.has('fairway'));assert.ok(seen.has('firstCut'));assert.ok(seen.has('rough'));
  }
  assert.equal(courseSurfaceAt(70,-150),'water');
});

check('surface personalities progress from green through sand',()=>{
  const p=SURFACE_PHYSICS;
  assert.ok(p.green.rollingDecel<p.fairway.rollingDecel);
  assert.ok(p.fairway.rollingDecel<p.firstCut.rollingDecel);
  assert.ok(p.firstCut.rollingDecel<p.rough.rollingDecel);
  assert.ok(p.rough.rollingDecel<p.sand.rollingDecel);
  assert.ok(p.green.restitution>p.rough.restitution&&p.rough.restitution>p.sand.restitution);
});

check('exact sweep ignores departing contact and catches entering terrain',()=>{
  const x=0,z=-80,y=terrainContactY(x,z,BALL_CONTACT_HEIGHT);
  const leaving=sweepTerrainSegment({x,y,z},{x:x+.2,y:y+1,z:z-.4},BALL_CONTACT_HEIGHT);
  assert.equal(leaving,null);
  const entering=sweepTerrainSegment(
    {x:x-1,y:terrainContactY(x-1,z+1,BALL_CONTACT_HEIGHT)+1.8,z:z+1},
    {x:x+1,y:terrainContactY(x+1,z-1,BALL_CONTACT_HEIGHT)-.8,z:z-1},
    BALL_CONTACT_HEIGHT
  );
  assert.ok(entering&&entering.t>0&&entering.t<1);
  assert.ok(near(entering.y,terrainContactY(entering.x,entering.z,BALL_CONTACT_HEIGHT),1e-7));

  // Regression: an exactly grounded airborne sample moving laterally into a
  // rising triangle is contact at the segment origin, not an endpoint hit.
  const random=seeded(0x16c0ffee);
  let uphillCases=0;
  for(let i=0;i<12000;i++){
    const sx=-76+random()*152,sz=-247+random()*230;
    const angle=random()*Math.PI*2,distance=.16+random()*.72;
    const sy=terrainContactY(sx,sz,BALL_CONTACT_HEIGHT);
    const next={
      x:sx+Math.cos(angle)*distance,
      y:sy+random()*.002,
      z:sz+Math.sin(angle)*distance
    };
    const endClearance=next.y-terrainContactY(next.x,next.z,BALL_CONTACT_HEIGHT);
    if(endClearance>=-1e-4)continue;
    uphillCases++;
    const hit=sweepTerrainSegment({x:sx,y:sy,z:sz},next,BALL_CONTACT_HEIGHT);
    assert.ok(hit,`missed grounded uphill entry at ${sx.toFixed(3)},${sz.toFixed(3)}`);
    assert.ok(hit.t<=1e-7,`grounded uphill entry resolved late at t=${hit.t}`);
  }
  assert.ok(uphillCases>100,'regression sampler did not exercise enough uphill entries');
});

const iron={head:'iron',ballSpeed:55,launch:17,spin:5200};
check('grounded launch separates cleanly into air',()=>{
  const physics=makePhysics();
  const x=.46,z=0,start=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.launch({position:start,club:iron,power:.82,path:0,form:1,aimYaw:0,strike:1,release:1,lie:'tee'});
  physics.step(1/120);
  assert.equal(physics.state.surface,'air');
  assert.ok(physics.state.pos.y>start.y);
  assert.ok(physics.state.vel.y>0);
});

check('first bounce separates instead of re-colliding at time zero',()=>{
  const physics=makePhysics();
  const x=.46,z=0,start=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.launch({position:start,club:iron,power:.72,path:0,form:1,aimYaw:0,strike:1,release:1,lie:'tee'});
  let found=false;
  for(let i=0;i<1800&&physics.active;i++){
    physics.step(1/120);
    if(physics.state.bounced&&physics.state.surface==='air'&&physics.state.vel.y>0){found=true;break;}
  }
  assert.equal(found,true);
  const y0=physics.state.pos.y;physics.step(1/120);
  assert.equal(physics.state.surface,'air');
  assert.ok(physics.state.pos.y>y0);
  assert.ok(physics.state.pos.y>terrainContactY(physics.state.pos.x,physics.state.pos.z,BALL_CONTACT_HEIGHT));
});

check('fairway to first-cut transition is immediate and height-safe',()=>{
  const z=-104,profile=fairwayProfile(z);
  let boundary=null;
  for(let x=profile.center;x<profile.center+profile.width+6;x+=.005){
    if(courseSurfaceAt(x,z)==='firstCut'){boundary=x;break;}
  }
  assert.ok(boundary!==null);
  const x=boundary-.018,surface=courseSurfaceAt(x,z);
  assert.equal(surface,'fairway');
  const physics=makePhysics(),position=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.state=rollingState(position,new THREE.Vector3(4,0,0),surface);physics.active=true;
  physics.step(1/120);
  assert.equal(physics.state.surface,'firstCut');
  assert.deepEqual(physics.state.surfaceChanged,{from:'fairway',to:'firstCut'});
  assert.ok(physics.state.pos.y>=terrainContactY(physics.state.pos.x,physics.state.pos.z,BALL_CONTACT_HEIGHT)-2e-6);
  assert.ok(Math.hypot(physics.state.vel.x,physics.state.vel.z)<4);
});

function scriptedShot(frameDt){
  const physics=makePhysics();
  const x=.46,z=0,start=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.launch({position:start,club:iron,power:.76,path:.35,form:.95,aimYaw:0,strike:.93,release:.94,lie:'tee'});
  let minClearance=Infinity;
  const state=stepUntilDone(physics,12,frameDt,s=>{
    if(s.surface!=='air'&&s.surface!=='cup'&&s.surface!=='water'){
      const clearance=s.pos.y-terrainContactY(s.pos.x,s.pos.z,BALL_CONTACT_HEIGHT);
      minClearance=Math.min(minClearance,clearance);assert.ok(clearance>=-2e-5);
    }
  });
  assert.equal(state.recovered,false);
  return {pos:state.pos.clone(),vel:state.vel.clone(),surface:state.surface,stopped:state.stopped,minClearance};
}

check('fixed-step shot is deterministic across 30/60/120 Hz frame delivery',()=>{
  const a=scriptedShot(1/30),b=scriptedShot(1/60),c=scriptedShot(1/120);
  for(const q of [b,c]){
    assert.ok(a.pos.distanceTo(q.pos)<.025);
    assert.ok(a.vel.distanceTo(q.vel)<.025);
    assert.equal(a.surface,q.surface);assert.equal(a.stopped,q.stopped);
  }
  assert.ok(a.minClearance>=-2e-5);
});

check('water transition resolves on the crossing step at the visible ocean',()=>{
  const z=-150;
  let boundary=null;
  for(let x=25;x<80;x+=.01){if(courseSurfaceAt(x,z)==='water'){boundary=x;break;}}
  assert.ok(boundary!==null);
  const x=boundary-.025,surface=courseSurfaceAt(x,z);
  assert.notEqual(surface,'water');
  const physics=makePhysics(),position=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.state=rollingState(position,new THREE.Vector3(9,0,0),surface);physics.active=true;
  physics.step(1/120);
  assert.equal(physics.state.surface,'water');
  assert.equal(physics.state.stopped,true);
  assert.ok(near(physics.state.pos.y,WATER_LEVEL+BALL_CONTACT_HEIGHT,1e-7));
});

function runPutt({offsetX=0,distance=1.2,paceFeet=8}){
  const pinDef=ROUND_HOLES[0].pin,pin=new THREE.Vector3(pinDef[0],terrainHeight(pinDef[0],pinDef[1]),pinDef[1]);
  const x=pin.x+offsetX,z=pin.z+distance;
  const physics=makePhysics();physics.setCup(pin);
  const start=new THREE.Vector3(x,terrainContactY(x,z,BALL_CONTACT_HEIGHT),z);
  physics.putt({position:start,club:{ballSpeed:8},paceFeet,path:0,aimYaw:0,strike:1});
  return stepUntilDone(physics,12,1/120);
}

check('cup accepts a controlled centre putt and rejects hot/edge entries',()=>{
  const centre=runPutt({distance:.8,paceFeet:3});
  assert.equal(centre.holed,true);assert.equal(centre.surface,'cup');
  const hot=runPutt({distance:1.2,paceFeet:75});
  assert.equal(hot.holed,false);assert.equal(hot.lipTouched,true);
  const edge=runPutt({offsetX:.050,distance:1.2,paceFeet:8});
  assert.equal(edge.holed,false);assert.equal(edge.lipTouched,true);
});

check('critical gameplay DOM contracts remain present',()=>{
  const html=readFileSync('prototype1/index.html','utf8');
  for(const id of [
    'app','stage','fatal','course-map','map-expand','club-chip','level-chip','camera-reset',
    'bag','bag-close','context','tip','swing-meter','result','again','round-end','run-it-back'
  ])assert.match(html,new RegExp(`id=["']${id}["']`));
});

console.log(`\nLOFT TERRAIN GAUNTLET: ${checks.length}/${checks.length} checks passed`);
