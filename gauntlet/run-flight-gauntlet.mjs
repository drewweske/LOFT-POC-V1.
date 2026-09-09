// Independent THE FLIGHT gates: real launch/solver/contact trajectories, actual
// perspective-camera projection, and explicit airborne HUD state. This is not
// a screenshot-quality score and cannot replace the live flight critic pass.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as THREE from '../vendor/three.module.js';
import * as currentCamera from '../prototype1/camera.js';
import {GolfPhysics} from '../prototype1/physics.js';
import {CLUBS} from '../prototype1/equipment.js';
import {ROUND_HOLES} from '../prototype1/round.js';
import {terrainHeight,terrainContactY,sampleTerrain,sweepTerrainSegment,courseSurfaceAt} from '../prototype1/worldV2.js';
import {hinterlandLift,COASTAL_HINTERLAND_SPEC} from '../prototype1/coastalHinterland.js';

let Camera=currentCamera.LoftCamera;
const baseline=process.argv.includes('--baseline');
if(baseline){
  let source=execFileSync('git',['show','06954b6:prototype1/camera.js'],{encoding:'utf8'});
  source=source.replace('../vendor/three.module.js',new URL('../vendor/three.module.js',import.meta.url).href);
  Camera=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).LoftCamera;
}
const spec=currentCamera.FLIGHT_CAMERA_SPEC||{punchDistance:.28,minFollowDistance:7.2,impactBlendSeconds:.78};
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const hash=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
const viewports=[{name:'desktop',width:1280,height:720},{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}];
const profiles=[{name:'clean',power:1,path:0,form:1,strike:1,release:1},{name:'imperfect',power:.74,path:7,form:.38,strike:.7,release:.8}];
const frameStep=process.argv.includes('--30fps')?.03:process.argv.includes('--120fps')?1/120:1/60;
const point=([x,z])=>new THREE.Vector3(x,terrainContactY(x,z,.0265),z);
const margin=1/15;
const maxPunch=.28*1.25; // Existing .28m punch displacement and 1.25 clamp.
const maxPunchFov=THREE.MathUtils.degToRad(1.15*1.25);
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log('PASS  '+name);}catch(error){failed++;console.log('FAIL  '+name+' — '+error.message);}}

check('protected solver, contact field, cup, poses, clubface and ball bytes are unchanged this session',()=>{
  // Captured from the resumed working build, not HEAD: 039/040 were already
  // uncommitted. New flight work may not erase or alter those accepted changes.
  const protectedHashes={
    'prototype1/physics.js':'3f3a446663b9fbd4bafd83bb4b93302f02f4cb7ec6d2d3d0f16712a01a9a7c76',
    'prototype1/worldV2.js':'4cefe0b45a267ca0266a1e4aaeadaeecd64f1eabdedd86ac84551c892eabb531',
    'prototype1/characterRig.js':'b82ff9aca3345f7bb8c0e10bff3a9a6719f2f6d12c0e36551c037031408e0054',
    'prototype1/clubVisual.js':'138a69ec0cf59b028e1af67a530b205f72dc3bc2b1b01ac139ccb06769002898',
    'prototype1/clubAssembly.js':'bb88b8185900b0840e2013d0303058628a4036dd2889105f6f0fce63c4b9afd7',
    'prototype1/ballVisual.js':'c9bac03182ba292889c59fe996e38d6b4f5fe1dadbca729c7972cc650801a264',
    'prototype1/assets/loft-ball-official.webp':'91057931f1d6dd52f1bf0f0af02249f529ac850c7aabc8f22c0ffd8b6919536d'
  };
  for(const [path,expected] of Object.entries(protectedHashes))assert.equal(hash(path),expected,path);
  assert.match(read('prototype1/physics.js'),/const FIXED=1\/120/);
});

function opticalSkyFraction(camera){
  const forward=camera.getWorldDirection(new THREE.Vector3());forward.y=0;forward.normalize();
  const horizon=camera.position.clone().addScaledVector(forward,10000).project(camera);
  return THREE.MathUtils.clamp((1-horizon.y)*.5,0,1);
}

function terrainSkyFraction(camera){
  // A deterministic screen-space grid casts against the actual heightfield,
  // existing coastal apron and sea plane. Buildings/trees remain a live visual
  // review requirement. A low optical horizon alone is not sufficient evidence.
  const columns=19,rows=15,bounds=COASTAL_HINTERLAND_SPEC.bounds;
  let sky=0;
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const direction=new THREE.Vector3((x+.5)/columns*2-1,1-(y+.5)/rows*2,.5).unproject(camera).sub(camera.position).normalize();
    let blocked=false;
    for(let distance=.5;distance<=650;distance+=Math.max(.6,distance*.08)){
      const p=camera.position.clone().addScaledVector(direction,distance);
      let ground=-.22;
      const field=p.x>=-92&&p.x<=92&&p.z>=-292&&p.z<=52;
      const apron=(p.x<=-92||p.z<=-292)&&p.x>=bounds.xMin&&p.x<=bounds.xMax&&p.z>=bounds.zMin&&p.z<=bounds.zMax;
      if(field||apron)ground=terrainHeight(p.x,p.z)+(apron?hinterlandLift(p.x,p.z):0);
      if(p.y<=ground){blocked=true;break;}
    }
    if(!blocked)sky++;
  }
  return sky/(columns*rows);
}

function projectedBallMargin(camera,ball){
  camera.updateMatrixWorld(true);
  const center=ball.clone().project(camera);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const radius=.026*1.055; // Existing visual ball + maximum impact compression.
  const top=ball.clone().addScaledVector(up,radius).project(camera);
  const side=ball.clone().addScaledVector(right,radius).project(camera);
  const rx=Math.abs(side.x-center.x)*.5,ry=Math.abs(top.y-center.y)*.5;
  return {margin:Math.min((1-Math.abs(center.x))*.5-rx,(1-Math.abs(center.y))*.5-ry),radiusY:ry,depth:center.z,x:center.x,y:center.y};
}

let runs;
function trajectories(){
  if(runs)return runs;
  runs=[];
  for(const hole of ROUND_HOLES)for(const club of CLUBS.filter(club=>club.head!=='putter'))for(const profile of profiles)for(const viewport of viewports){
    const label=`${hole.number}/${club.id}/${profile.name}/${viewport.name}`;
    const ball=point(hole.tee),pin=point(hole.pin),yaw=Math.atan2(pin.x-ball.x,-(pin.z-ball.z));
    const physics=new GolfPhysics({terrainHeight,terrainContactY,terrainSample:sampleTerrain,terrainSweep:sweepTerrainSegment,surfaceAt:courseSurfaceAt,wind:new THREE.Vector3(hole.wind[0],0,hole.wind[1])});
    const camera=new THREE.PerspectiveCamera(43,viewport.width/viewport.height,.1,750),controller=new Camera(camera,{terrainHeight});
    for(let frame=0;frame<120;frame++)controller.updateAim(1/60,{ball,pin,aimYaw:yaw});
    controller.beginSwing(yaw);
    for(let frame=0;frame<=36;frame++)controller.updateSwing(1/60,{ball,pin,swingProgress:frame/60,putting:false});
    const shot=physics.launch({position:ball,club,...profile,aimYaw:yaw,lie:courseSurfaceAt(ball.x,ball.z)});
    const priorPosition=camera.position.clone(),priorRotation=camera.quaternion.clone();
    controller.impact(.70+.30*profile.strike);
    controller.beginFlight(yaw,{ball:shot.pos,velocity:shot.vel,pin,putting:false});
    camera.updateMatrixWorld(true);
    const row={label,instantPosition:camera.position.distanceTo(priorPosition),instantRotation:camera.quaternion.angleTo(priorRotation),worstMargin:1,worstMarginAt:0,maxImpactTranslationExcess:0,maxImpactAngle:0,apex:null,firstBounce:null,rest:null,frames:0};
    let priorBall=ball.clone(),lastVy=shot.vel.y,maxBallY=-Infinity;
    for(let frame=0;frame<Math.ceil(34/frameStep)&&physics.active;frame++){
      const positionBefore=camera.position.clone(),rotationBefore=camera.quaternion.clone();
      const state=physics.step(frameStep);
      controller.updateFlight(frameStep,{ball:state.pos,velocity:state.vel,pin,putting:false,grounded:Boolean(state.lastImpactSurface)});
      camera.updateMatrixWorld(true);
      const screen=projectedBallMargin(camera,state.pos);
      if(screen.margin<row.worstMargin){row.worstMargin=screen.margin;row.worstMarginAt=state.simTime;row.worstProjection=screen;}
      if(screen.depth< -1||screen.depth>1)row.depthError={at:state.simTime,depth:screen.depth};
      if(state.simTime<=.125){
        // The camera can translate with the actual shot plus its pre-existing
        // punch. Camera cuts unrelated to that travel exceed this envelope.
        row.maxImpactTranslationExcess=Math.max(row.maxImpactTranslationExcess,camera.position.distanceTo(positionBefore)-state.pos.distanceTo(priorBall));
        row.maxImpactAngle=Math.max(row.maxImpactAngle,camera.quaternion.angleTo(rotationBefore));
      }
      if(!state.lastImpactSurface&&state.pos.y>maxBallY){
        maxBallY=state.pos.y;row.apex={time:state.simTime,height:state.pos.y-terrainHeight(state.pos.x,state.pos.z),ballPixels:screen.radiusY*2*viewport.height,opticalSky:opticalSkyFraction(camera),camera:camera.clone()};
      }
      if(lastVy>0&&state.vel.y<=0&&!state.lastImpactSurface&&row.apex)row.apex.crossed=true;
      if(!row.firstBounce&&state.lastImpactSurface)row.firstBounce={time:state.simTime,margin:screen.margin};
      if(state.stopped)row.rest={time:state.simTime,margin:screen.margin,recovered:state.recovered};
      lastVy=state.vel.y;priorBall.copy(state.pos);row.frames++;
    }
    if(row.apex){row.apex.terrainSky=terrainSkyFraction(row.apex.camera);delete row.apex.camera;}
    runs.push(row);
  }
  return runs;
}

check('APEX SKY: actual seven-club / three-hole trajectories retain > half sky in all three aspect ratios',()=>{
  const rows=trajectories(),bad=rows.filter(row=>!row.apex?.crossed||row.apex.opticalSky<=.5||row.apex.terrainSky<=.5);
  assert.equal(rows.length,126);
  assert.deepEqual(bad.map(({label,apex})=>({label,apex})).slice(0,12),[],`${bad.length}/${rows.length} failing apex frames`);
});

check('BALL FRAMING: the whole gameplay ball stays > 1/15 from every edge from release through rest',()=>{
  const bad=trajectories().filter(row=>row.worstMargin<margin||row.depthError||!row.rest);
  assert.deepEqual(bad.map(row=>({label:row.label,margin:row.worstMargin,time:row.worstMarginAt,depth:row.depthError,rest:row.rest})).slice(0,12),[],`${bad.length}/126 failing trajectories`);
  assert.deepEqual(trajectories().filter(row=>row.apex.ballPixels<6).map(row=>({label:row.label,pixels:row.apex.ballPixels})),[],'the actual ball must occupy at least six vertical pixels at apex, including short landscape');
});

check('CONTINUOUS IMPACT: mode handoff is exact; translation and rotation stay inside the established punch envelope',()=>{
  assert.equal(spec.punchDistance,.28,'do not enlarge the punch to weaken a continuity gate');
  // The narrowest existing full-swing framing is 5.45m. Its view-space punch
  // angle plus the existing transient 1.15-degree FOV kick bounds a legal hit.
  const angularLimit=Math.atan2(maxPunch,5.45)+maxPunchFov;
  const bad=trajectories().filter(row=>row.instantPosition>1e-9||row.instantRotation>1e-7||row.maxImpactTranslationExcess>maxPunch||row.maxImpactAngle>angularLimit);
  assert.deepEqual(bad.map(row=>({label:row.label,instantPosition:row.instantPosition,instantRotation:row.instantRotation,translationExcess:row.maxImpactTranslationExcess,rotation:row.maxImpactAngle})).slice(0,12),[],`${bad.length}/126 discontinuities; thresholds ${maxPunch.toFixed(3)}m + actual ball travel / ${(angularLimit*180/Math.PI).toFixed(2)}deg`);
});

check('camera-side trace visibility rejects an eye-plane crossing without changing effect geometry',()=>{
  const camera=new THREE.PerspectiveCamera(40,16/9,.1,750),controller=new currentCamera.LoftCamera(camera);
  camera.position.set(0,1,8);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);
  assert.equal(controller.flightTraceVisible([new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,4)]),true);
  assert.equal(controller.flightTraceVisible([new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,9)]),false);
});

check('Deck Clear: marks are inline geometry, tiers have no rarity, and completed strokes precede the HUD refresh',()=>{
  const html=read('prototype1/index.html'),game=read('prototype1/game.js');
  const equipment=read('prototype1/equipment.js'),marks=read('prototype1/uiMarks.js');
  assert.doesNotMatch(equipment,/rarity\s*:/);assert.doesNotMatch(game,/tier\.rarity/);
  assert.doesNotMatch(html,/COMMON\+?|LEGENDARY|EPIC|RARE/);
  assert.match(game,/mapExpand\.innerHTML=uiIconMarkup\('expand'\)/);
  assert.match(game,/wind-value'\)\.innerHTML=windReadoutMarkup/);
  assert.match(marks,/stroke="currentColor"/);
  assert.match(html,/class="chronicle-brand"><img[^>]*src="\.\/assets\/loft-wordmark-official\.webp"/);
  assert.match(html,/class="bag-brand"><img[^>]*src="\.\/assets\/loft-wordmark-official\.webp"/);
  assert.doesNotMatch(html,/<symbol id="loft-wordmark-mono"/,'the official logo must never be redrawn');
  assert.match(html,/id="round-score"[^]*?<\/div><small id="round-total"/);
  assert.match(game,/complete\?' · COMPLETE'/);
  const holed=game.slice(game.indexOf('function finishShot(){'),game.indexOf('function handleResultAction(){'));
  assert.ok(holed.indexOf('state.holeScores[holeIndex]=state.strokes')<holed.indexOf('updateHoleHUD();return'));
});

try{
  const {flightHudVisibility}=await import('../prototype1/flightPresentation.js');
  check('UI SILENCE: one live target-distance element survives airborne and other HUD stays absent until rest',()=>{
    for(const putting of [false,true])for(const firstBounce of [false,true]){
      const visibility=flightHudVisibility('flight',{putting,firstBounce,stopped:false});
      assert.deepEqual(Object.entries(visibility).filter(([,opacity])=>opacity>0).map(([name])=>name),['distance']);
      assert.equal(visibility.distance,1);
    }
    const restored=flightHudVisibility('result',{stopped:true});
    assert.ok(restored.round>0&&restored.wind>0&&restored.object>0&&restored.level>0);
    const game=read('prototype1/game.js'),css=read('prototype1/flight.css');
    const launch=game.slice(game.indexOf('function launchShot('),game.indexOf('function prepareShotAt('));
    assert.match(launch,/flight-active|syncFlightPresentation|applyFlightPresentation|syncFlightHUD/,'visibility must change in the launch transaction, before the next frame');
    assert.match(css,/flight-active/);assert.match(css,/#map-distance/,'actual DOM distance element must be the survivor');
    assert.doesNotMatch(launch,/setTimeout\([^\n]*remove\([^\n]*flight-active/,'flight silence cannot be removed on a timer');
    assert.match(css,/opacity:0!important/,'flight silence must override the old dimmed-address styles');
    const finish=game.slice(game.indexOf('function finishShot('),game.indexOf('function finishShot(')+450);
    assert.match(finish,/classList\.remove\('flight-active'\)/,'HUD restoration belongs to rest settlement');
  });
}catch(error){failed++;console.log('FAIL  UI SILENCE setup — '+error.message);}

if(runs){
  const low=(field)=>runs.reduce((best,row)=>row.apex?.[field]<(best.apex?.[field]??Infinity)?row:best,runs[0]);
  const framing=runs.reduce((best,row)=>row.worstMargin<best.worstMargin?row:best,runs[0]);
  console.log('\nMEASURED '+JSON.stringify({build:baseline?'06954b6 camera with protected current solver':'current camera with protected current solver',trajectories:runs.length,frames:runs.reduce((sum,row)=>sum+row.frames,0),minimumOpticalSky:{value:low('opticalSky').apex?.opticalSky,shot:low('opticalSky').label},minimumTerrainSky:{value:low('terrainSky').apex?.terrainSky,shot:low('terrainSky').label},minimumBallMargin:{value:framing.worstMargin,shot:framing.label,time:framing.worstMarginAt},maxImpactRotationDegrees:Math.max(...runs.map(row=>row.maxImpactAngle))*180/Math.PI}));
}
console.log(`\nLOFT FLIGHT GAUNTLET: ${passed}/${passed+failed} checks passed`);
if(failed)process.exitCode=1;
