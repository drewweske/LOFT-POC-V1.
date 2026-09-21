// Executes actual game.js lifecycle functions, not a retyped state machine.
// Presentation adapters are inert; launch, field and solver are real production.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {CLUBS,LEVELS,DEFAULT_CLUB} from '../prototype1/equipment.js';
import {ROUND_HOLES} from '../prototype1/round.js';
import {GolfPhysics,SOLVER_FIXED_STEP} from '../prototype1/physics.js';
import {createCourseField} from '../prototype1/shot/courseField.js';
import {deriveShotSeed,dispersionFromShotSeed} from '../prototype1/shot/seedContract.js';
import {launchShotPhysics,resolveShot} from '../prototype1/shot/resolveShot.js';
import {puttContactProfile} from '../prototype1/putting.js';
import {flightHudVisibility} from '../prototype1/flightPresentation.js';
import {assertStep5ProductionScope,restorePreStep5Bytes} from './sealed-shot/step5-preservation.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const game=read('prototype1/game.js');
const between=(a,b)=>{const i=game.indexOf(a),j=game.indexOf(b,i);assert.ok(i>=0&&j>i);return game.slice(i,j);};
const pieces={
  state:between('const state={','let bagFocusId='),
  launch:between('function classify(q,path)','function prepareShotAt('),
  prepare:between('function prepareShotAt(','function finishShot('),
  start:between('function startHole(','function showRoundEnd('),
  again:between("$('run-it-back').onclick=()=>{",'const pointers=new Map();'),
  cancel:between('function cancelPendingStroke(){',"canvas.addEventListener('pointerdown'")
};
// prepareShotAt is followed by other declarations before finishShot in the
// composition root. Keep only its declaration, using the known next declaration.
pieces.prepare=pieces.prepare.slice(0,pieces.prepare.indexOf('\nfunction ',1));
const source=Object.values(pieces).join('\n');
assert.doesNotMatch(source,/performance\.|Date\.|Math\.random|localStorage|sessionStorage/);
let passed=0,failed=0;
const check=(name,fn)=>{try{fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.error('FAIL  '+name+' — '+e.stack);}};
function harness(){
  const field=createCourseField(ROUND_HOLES),nodes=new Map(),seeds=[],launches=[];
  const noop=()=>{},node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add:noop,remove:noop,toggle:noop}});return nodes.get(id);};
  const wind=new THREE.Vector3(...[ROUND_HOLES[0].wind[0],0,ROUND_HOLES[0].wind[1]]);
  const physics=new GolfPhysics({terrainHeight:field.terrainHeight,terrainSample:field.sampleTerrain,
    terrainContactY:field.terrainContactY,terrainSweep:field.sweepTerrainSegment,surfaceAt:field.courseSurfaceAt,wind});
  const context={THREE,LEVELS,DEFAULT_CLUB,YARD:.9144,ROUND_HOLES,COURSE_YAW:0,physics,wind,pin:new THREE.Vector3(),TEE:new THREE.Vector3(),
    holeIndex:0,holeDef:ROUND_HOLES[0],chronicleAvailableCache:null,
    ballGroup:{position:new THREE.Vector3(),rotation:new THREE.Vector3(),scale:new THREE.Vector3()},
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),puttContactProfile,flightHudVisibility,
    $:node,document:{getElementById:node},setTimeout:noop,
    club:()=>CLUBS.find(c=>c.id==='iron7'),aimYaw:()=>context.state.aimYaw,
    surfaceAt:field.courseSurfaceAt,playingHeight:field.terrainHeight,playingContactY:(x,z)=>field.terrainContactY(x,z,.0265),
    deriveShotSeed:tuple=>{const shotSeed=deriveShotSeed(tuple);seeds.push({...tuple,shotSeed,dispersion:dispersionFromShotSeed(shotSeed)});return shotSeed;},
    dispersionFromShotSeed,
    launchShotPhysics:(p,input)=>{const value=launchShotPhysics(p,input);launches.push({value,input});return value;},
    cam:{impact:noop,beginFlight:noop,resetAim:noop,cancelSwing:noop,isSwingLocked:true},
    feedback:{impact:noop,startFlight:noop,clear:noop},world:{setPin:noop,setDetailFocus:noop},topo:{setHole:noop},
    golfer:{setPose:noop},lineMesh:{},halo:{},
    closeRoundChronicle:noop,closePrecisionMap:noop,chooseAutoClub:noop,defaultTarget:noop,
    updateLine:noop,updateHoleHUD:noop,updateTip:noop,showHoleIntro:noop,syncChronicleAvailability:noop,
    hidePuttPace:noop,hideStrokeSignal:noop,showContext:noop,setTip:noop,isPutting:()=>false,intendedPuttFeet:()=>2
  };
  for(const key of ['performance','Date','navigator','localStorage','sessionStorage'])Object.defineProperty(context,key,{get(){throw Error('Forbidden adapter entropy/state '+key);}});
  const realm=vm.createContext(context);
  vm.runInContext('Math.random=()=>{throw Error("No random source")};',realm);
  context.state=vm.runInContext(pieces.state+'\nstate;',realm);
  vm.runInContext([pieces.launch,pieces.prepare,pieces.start,pieces.again,pieces.cancel].join('\n'),realm);
  return {context,seeds,launches,field,nodes,call:code=>vm.runInContext(code,realm)};
}
const metrics={power:.65,path:.22,tempoScore:.91,rhythm:.86,center:.92,commitment:.88,loadScore:.95,speedScore:.94};
function shoot(h){h.context.metrics=metrics;h.call('launchShot(metrics)');}
check('Prototype identity: deterministic fresh-page player/round; first accepted physical shot uses ordinal zero',()=>{
  for(let i=0;i<2;i++){
    const h=harness();h.call('startHole(0,{intro:false})');shoot(h);
    assert.deepEqual(h.seeds[0],{roundId:'prototype-local-round-0',playerId:'prototype-local-player',holeIndex:0,strokeIndex:0,
      shotSeed:deriveShotSeed({roundId:'prototype-local-round-0',playerId:'prototype-local-player',holeIndex:0,strokeIndex:0}),
      dispersion:dispersionFromShotSeed(deriveShotSeed({roundId:'prototype-local-round-0',playerId:'prototype-local-player',holeIndex:0,strokeIndex:0}))});
    assert.equal(h.context.state.strokeIndex,1);assert.equal(h.context.state.strokes,1);
  }
});
check('Penalty isolation: actual prepareShotAt increments score only; next physical shot keeps ordinal one',()=>{
  const h=harness();h.call('startHole(0,{intro:false})');shoot(h);
  h.call('prepareShotAt(TEE.clone(),{penalty:true})');
  assert.equal(h.context.state.strokes,2);assert.equal(h.context.state.strokeIndex,1);
  shoot(h);assert.equal(h.seeds[1].strokeIndex,1);assert.equal(h.context.state.strokeIndex,2);assert.equal(h.context.state.strokes,3);
  const twin=harness();twin.call('startHole(0,{intro:false})');shoot(twin);twin.call('prepareShotAt(TEE.clone())');shoot(twin);
  assert.deepEqual(h.seeds,twin.seeds,'same physical shots with/without penalty => same seed context');
});
check('startHole resets physical ordinal, retains round identity, uses existing zero-based hole index',()=>{
  const h=harness();h.call('startHole(0,{intro:false})');shoot(h);
  h.call('startHole(1,{intro:false})');assert.equal(h.context.state.strokeIndex,0);shoot(h);
  assert.equal(h.seeds[1].holeIndex,1);assert.equal(h.seeds[1].strokeIndex,0);
  assert.equal(h.seeds[1].roundId,h.seeds[0].roundId);assert.notEqual(h.seeds[1].shotSeed,h.seeds[0].shotSeed);
});
check('RUN IT BACK advances in-memory round serial only; no persistence, clock or entropy',()=>{
  const h=harness();h.call('startHole(0,{intro:false})');shoot(h);
  for(let round=1;round<=3;round++){
    h.nodes.get('run-it-back').onclick();assert.equal(h.context.state.roundId,'prototype-local-round-'+round);
    assert.equal(h.context.state.roundSequence,round);assert.equal(h.context.state.strokeIndex,0);shoot(h);
    assert.equal(h.seeds.at(-1).roundId,'prototype-local-round-'+round);
  }
  assert.equal(new Set(h.seeds.map(s=>s.shotSeed)).size,4);
});
check('Cancelled/guarded/failed launch consumes no ordinal; ordinal advances strictly after physics accepts',()=>{
  const h=harness();h.call('startHole(0,{intro:false})');h.call('cancelPendingStroke()');
  assert.equal(h.context.state.strokeIndex,0);assert.equal(h.seeds.length,0);
  for(const phase of ['flight','result','round-end']){h.context.state.phase=phase;shoot(h);}
  assert.equal(h.context.state.strokeIndex,0);assert.equal(h.seeds.length,0);
  h.context.state.phase='ready';const original=h.context.physics.launch;
  h.context.physics.launch=()=>{assert.equal(h.context.state.strokeIndex,0);throw Error('test rejected launch');};
  assert.throws(()=>shoot(h),/test rejected launch/);assert.equal(h.context.state.strokeIndex,0);
  h.context.physics.launch=original;shoot(h);assert.equal(h.context.state.strokeIndex,1);
  assert.equal(h.seeds.at(-1).shotSeed,h.seeds.at(-2).shotSeed);
});
check('Live game launch and bare-Node resolveShot use same authoritative seed, launch values and full native trajectory',()=>{
  const h=harness();h.call('startHole(0,{intro:false})');
  const position={...h.context.ballGroup.position};shoot(h);
  const courseHash='step5-context-test',course={...createCourseField(ROUND_HOLES),holes:ROUND_HOLES,courseHash};
  const intent={courseHash,holeIndex:0,ballRestPosition:position,lieSurface:'tee',club:h.context.club(),playerState:LEVELS[1],
    metrics,aimYaw:h.context.state.aimYaw,shotSeed:h.seeds[0].shotSeed,
    environmentState:{wind:{x:h.context.wind.x,y:0,z:h.context.wind.z}}};
  const result=resolveShot(intent,course),raw=s=>({...s,pos:{...s.pos},vel:{...s.vel},spinAxis:{...s.spinAxis},lastSafePos:{...s.lastSafePos}});
  assert.deepEqual(raw(h.context.physics.state),result.launchState);
  assert.equal(result.path,h.launches[0].value.finalPath);assert.equal(result.quality,h.launches[0].value.q);
  let frame=0;while(h.context.physics.active){h.context.physics.step(SOLVER_FIXED_STEP);assert.deepEqual(raw(h.context.physics.state),result.trajectory[frame++]);}
  assert.equal(frame,result.trajectory.length);assert.deepEqual(raw(h.context.physics.state),result.restState);
  console.log('INFO browser-adapter physical trajectory frames '+frame+'; shotSeed '+intent.shotSeed);
});
check('Exact protected source inverse and mutation refusal; only seed/context wiring changes production',()=>{
  assertStep5ProductionScope();
  for(const [a,b] of [['strokeIndex:state.strokeIndex','strokeIndex:state.strokes'],['state.strokeIndex++;','state.strokeIndex+=2;'],
    ['state.strokeIndex=0;','state.strokeIndex=1;'],["state.roundSequence++;","state.roundSequence+=2;"]]){
    assert.ok(game.includes(a));assert.throws(()=>restorePreStep5Bytes('prototype1/game.js',game.replace(a,b)));
  }
});
console.log('INFO actual game lifecycle source hashes '+JSON.stringify(Object.fromEntries(Object.entries(pieces).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]))));
console.log(`\nLOFT SEED CONTEXT STEP 5: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('Actual browser-adapter code executed in Node VM, not a physical iOS/browser-runtime claim. STOP before Step 6.');
process.exitCode=failed?1:0;
