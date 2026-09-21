// Historical Step 2 dependency-seam regression. Step 5's exact, fail-closed
// inverse removes only its authorized browser identity/seed adapter. This keeps
// the accepted wall-clock comparisons as historical evidence, not a claim about
// the normal seeded production default. The current shared launch body is used.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {CLUBS,LEVELS} from '../prototype1/equipment.js';
import {GolfPhysics} from '../prototype1/physics.js';
import {terrainHeight,terrainContactY,sampleTerrain,sweepTerrainSegment,courseSurfaceAt} from '../prototype1/worldV2.js';
import {puttContactProfile} from '../prototype1/putting.js';
import {flightHudVisibility} from '../prototype1/flightPresentation.js';
import {projectPhysicsFrame} from './sealed-shot/parity-projection-v1.mjs';
import {undoStep2Seam,PRE_STEP2_COMMIT} from './sealed-shot/step2-preservation.mjs';
import {restoreStep2Bytes,assertStep3ProductionScope} from './sealed-shot/step3-preservation.mjs';
import {restorePreStep5Bytes} from './sealed-shot/step5-preservation.mjs';
import {launchShotPhysics} from '../prototype1/shot/resolveShot.js';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const lf=bytes=>bytes.toString('utf8').replace(/\r\n/g,'\n');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const pre=git('show',PRE_STEP2_COMMIT+':prototype1/game.js');
const integration041=git('show','4497fc90827ceda14ddf5d46f10b3ebccff7ec34:prototype1/game.js');
const post=lf(read('prototype1/game.js'));
const historicalPost=lf(restorePreStep5Bytes('prototype1/game.js',read('prototype1/game.js')));
const preservedPost=lf(restoreStep2Bytes('prototype1/game.js',read('prototype1/game.js')));
const legacyClock='Math.sin(performance.now()*.012)';
const functionSource=game=>{
  const start=game.indexOf('function classify(q,path)'),end=game.indexOf('function prepareShotAt(');
  assert.ok(start>=0&&end>start);
  return game.slice(start,end)+'\nlaunchShot;';
};
const legacySource=functionSource(pre),currentSource=functionSource(historicalPost);
// Supply an operand to the immutable old function, not a retyped launch formula.
// This single test-only substitution lets both versions receive the same scalar.
assert.equal(legacySource.split(legacyClock).length-1,1);
const suppliedLegacySource=legacySource.replace(legacyClock,'testDispersion');

// Raw-number snapshot, including signed zero, NaN, and optional-field presence.
// No tolerance, decimal rounding, or authoritative result format is introduced.
function bits(value){
  if(typeof value==='number'){const b=Buffer.alloc(8);b.writeDoubleLE(value);return ['f64',b.toString('hex')];}
  if(value===undefined)return ['undefined'];
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(bits);
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,bits(v)]));
}
const snapshot=value=>JSON.stringify(bits(value));
const point=([x,z])=>new THREE.Vector3(x,terrainContactY(x,z,.0265),z);
const clean={power:1,path:0,tempoScore:1,rhythm:1,center:1,commitment:1,loadScore:1,speedScore:1};
const metricCases=[clean,
  {power:.057,path:-8.95,tempoScore:.13,rhythm:.31,center:.47,commitment:.27,loadScore:.6,speedScore:.22},
  {power:1.08,path:8.99,tempoScore:.89,rhythm:.77,center:.81,commitment:.93,loadScore:.82,speedScore:.97}
];
const surfaces=['tee','fairway','rough','firstCut','sand','fringe','green'];
const scalars=[-1,-.625,-0,0,.25,Number.MIN_VALUE,1];
const times=[0,-0,1,44.5,1000,123456.789,1e8,2**40];
let passed=0,failed=0;
const counts={defaultPairs:0,explicitUndefinedPairs:0,injectedPairs:0,repeatPairs:0,trajectoryPairs:0,trajectoryFrames:0};
function check(name,fn){try{fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.error('FAIL  '+name+' — '+e.stack);}}

function harness(source){
  let trace=[],timers=[],elements=new Map(),current,clockReads=0,launchInput,method;
  const mark=name=>(...args)=>trace.push([name,...args]);
  const element=id=>{
    if(!elements.has(id))elements.set(id,{style:{},classList:{toggle:mark(id+'.toggle'),remove:mark(id+'.remove')}});
    return elements.get(id);
  };
  const context={THREE,Math,LEVELS,launchShotPhysics,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    club:()=>{trace.push(['club']);return current.club;},
    surfaceAt:(x,z)=>{trace.push(['lie',x,z]);return current.fallbackLie;},
    aimYaw:()=>{trace.push(['aim']);return current.aim;},
    intendedPuttFeet:()=>current.targetFeet,
    performance:{now:()=>{clockReads++;trace.push(['clock']);if(current.forbidClock)throw Error('injected path read clock');return current.time;}},
    cam:{impact:mark('camera.impact'),beginFlight:mark('camera.beginFlight')},
    feedback:{impact:mark('feedback.impact'),startFlight:mark('feedback.startFlight')},
    syncChronicleAvailability:mark('chronicle'),hidePuttPace:mark('hidePace'),hideStrokeSignal:mark('hideSignal'),showContext:mark('context'),
    $:element,document:{getElementById:element},setTimeout:(fn,ms)=>{trace.push(['timer',ms]);timers.push(fn);},
    puttContactProfile,flightHudVisibility
  };
  const launch=new vm.Script(source).runInNewContext(context);
  return {
    run(options={},args=[]){
      current={club:CLUBS[0],level:1,lie:'tee',fallbackLie:'fairway',position:[.46,0],cup:[2.5,-156.36],wind:[3.13,0,0],metrics:clean,aim:.012,targetFeet:2,time:0,phase:'ready',...options};
      trace=[];timers=[];elements=new Map();clockReads=0;launchInput=null;method=null;
      const ballPosition=point(current.position);
      const physics=new GolfPhysics({terrainHeight,terrainContactY,terrainSample:sampleTerrain,terrainSweep:sweepTerrainSegment,surfaceAt:courseSurfaceAt,wind:new THREE.Vector3(...current.wind)});
      physics.setCup(point(current.cup));
      for(const name of ['launch','putt']){
        const original=physics[name].bind(physics);
        physics[name]=input=>{trace.push(['physics.'+name]);method=name;launchInput=bits(input);assert.equal(input.club,current.club);assert.equal(input.position,ballPosition);return original(input);};
      }
      Object.assign(context,{
        LEVELS:current.observeForm?Object.fromEntries(Object.entries(LEVELS).map(([k,v])=>[k,new Proxy(v,{get:(t,p)=>{if(p==='form')trace.push(['form']);return t[p];}})])):LEVELS,
        state:{phase:current.phase,level:current.level,currentLie:current.lie,shotCount:3,strokes:2,learned:{}},
        physics,ballGroup:{position:ballPosition},TEE:ballPosition.clone(),lineMesh:{visible:true},halo:{visible:true},
        testDispersion:current.scalar
      });
      launch(current.metrics,...args);
      // Execute the deferred callback as well; no actual wall-clock timers run.
      for(const fn of timers)fn();
      return {physics,clockReads,trace:structuredClone(trace),snapshot:snapshot({method,launchInput,
        physics:physics.state?projectPhysicsFrame(physics):null,state:context.state,
        trace,styles:[...elements].map(([id,e])=>[id,e.style]),line:context.lineMesh.visible,halo:context.halo.visible})};
    }
  };
}
const legacy=harness(legacySource),current=harness(currentSource),suppliedLegacy=harness(suppliedLegacySource);

check('EXACT SCOPE: inverse of two unique edits restores entire pre-Step-2 and Integration 041 game bytes',()=>{
  assert.equal(pre,integration041);
  assert.equal(undoStep2Seam(preservedPost),pre);
  assert.equal(pre.match(/launchShot\(\{/g).length,4,'all four live/QA call sites remain one-argument');
  const manifest=JSON.parse(read('gauntlet/sealed-shot/fixtures/behavior-baseline-v1.json'));
  assert.equal(hash(Buffer.from(pre)),manifest.files['prototype1/game.js'].sha256);
  console.log('INFO pre-Step-2 '+PRE_STEP2_COMMIT+' game SHA-256 '+hash(Buffer.from(pre)));
  console.log('INFO reconstructed accepted Step 2 game SHA-256 '+hash(Buffer.from(preservedPost)));
  console.log('INFO current extracted game SHA-256 '+hash(Buffer.from(post)));
});

check('PRESERVATION FAILS CLOSED: altered formula, scale, clamp, caller or unrelated UI is rejected',()=>{
  const rejects=s=>assert.throws(()=>assert.equal(undoStep2Seam(s),pre));
  rejects(preservedPost.replace('performance.now()*.012','performance.now()*.013'));
  rejects(preservedPost.replace("? .18 : .75","? .18 : .76"));
  rejects(preservedPost.replace('clamp(metrics.path+pathNoise,-9,9)','clamp(metrics.path+pathNoise,-8,8)'));
  rejects(preservedPost.replace('launchShot({','launchShot(null,{'));
  rejects(preservedPost.replace("$('tip').style.opacity='0'","$('tip').style.opacity='1'"));
  rejects(preservedPost+'\n'+preservedPost.match(/function launchShot\(metrics,dispersion\)\{/)[0]);
});

check('HISTORICAL DEFAULT: legacy clock expression, launch inputs, real solver launch and all reaction calls are bit-identical',()=>{
  for(const club of CLUBS)for(const level of Object.keys(LEVELS))for(const lie of surfaces)for(const time of times){
    const metrics={...metricCases[counts.defaultPairs%3],puttPaceFeet:counts.defaultPairs%2?undefined:2};
    const options={club,level,lie,time,metrics,aim:[-.31,0,.19][counts.defaultPairs%3]};
    const a=legacy.run(options),b=current.run(options);
    assert.equal(b.snapshot,a.snapshot,`${club.id}/${level}/${lie}/${time}`);
    assert.equal(b.clockReads,1);counts.defaultPairs++;
    assert.equal(current.run(options,[undefined]).snapshot,a.snapshot);counts.explicitUndefinedPairs++;
  }
});

check('INJECTION: fixed raw scalars including +0/-0 bypass clock and match legacy operand substitution exactly',()=>{
  for(const club of CLUBS)for(const level of Object.keys(LEVELS))for(const lie of surfaces)for(const metrics0 of metricCases)for(const scalar of scalars){
    const metrics={...metrics0,puttPaceFeet:counts.injectedPairs%3===0?undefined:counts.injectedPairs%3===1?.22:24};
    const options={club,level,lie,metrics,scalar,forbidClock:true,aim:[-.45,0,.22][counts.injectedPairs%3]};
    const a=suppliedLegacy.run(options),b=current.run(options,[scalar]);
    assert.equal(b.clockReads,0);
    assert.equal(b.snapshot,a.snapshot,`${club.id}/${level}/${lie}/${scalar}`);counts.injectedPairs++;
    assert.equal(current.run({...options,time:1e12},[scalar]).snapshot,b.snapshot);counts.repeatPairs++;
  }
});

check('HISTORICAL CLOCK LOCATION: ready guard, club/lie/form read order, full-form clock read and delayed reactions are preserved',()=>{
  for(const level of [1,50,75])for(const lie of ['tee',null]){
    const opts={observeForm:true,level,lie,time:44.5};
    const a=legacy.run(opts),b=current.run(opts);
    assert.equal(b.snapshot,a.snapshot);
    assert.deepEqual(b.trace.slice(0,lie?3:4).map(x=>x[0]),lie?['club','form','clock']:['club','lie','form','clock']);
    assert.equal(b.clockReads,1,'form=1 must not short-circuit legacy sampling');
  }
  for(const phase of ['flight','result','holed']){
    const opts={phase,forbidClock:true};
    assert.equal(current.run(opts).snapshot,legacy.run(opts).snapshot);
    assert.deepEqual(current.run(opts,[.5]).trace,[],'non-ready call does no dependency work');
  }
});

check('INJECTION IS PER CALL: fixed sample cannot leak into the next historical default shot',()=>{
  const opts={time:18765,metrics:metricCases[1]};
  const a=legacy.run(opts).snapshot;
  current.run({...opts,forbidClock:true},[0]);
  assert.equal(current.run(opts).snapshot,a);
  current.run({...opts,forbidClock:true},[-1]);
  assert.equal(current.run(opts,[undefined]).snapshot,a);
});

check('REAL TRAJECTORIES: supplied scalar preserves launch/every fixed frame/rest across six legacy cases and five levels',()=>{
  const fixtures=JSON.parse(read('gauntlet/sealed-shot/fixtures/parity-v1.json')).cases;
  for(const {input} of fixtures)for(const level of Object.keys(LEVELS)){
    const scalar=scalars[counts.trajectoryPairs%scalars.length];
    const options={club:CLUBS.find(c=>c.id===input.club),level,position:input.position,cup:input.cup,wind:input.wind,
      lie:input.launch.lie??'green',aim:input.launch.aimYaw,scalar,forbidClock:true,
      metrics:{...metricCases[counts.trajectoryPairs%3],power:input.launch.power,path:input.launch.path,puttPaceFeet:input.launch.paceFeet}};
    const a=suppliedLegacy.run(options),b=current.run(options,[scalar]);
    assert.equal(b.snapshot,a.snapshot);
    let frames=0;
    while(a.physics.active||b.physics.active){
      assert.ok(frames++<4000,'solver must terminate');
      a.physics.step(1/120);b.physics.step(1/120);
      assert.deepEqual(projectPhysicsFrame(b.physics),projectPhysicsFrame(a.physics),input.name+' frame '+frames);
    }
    counts.trajectoryPairs++;counts.trajectoryFrames+=frames;
  }
});

check('PROTECTED SCOPE: exact authorized extraction inverses only; frozen baseline and protected math unchanged',()=>{
  const manifest=JSON.parse(read('gauntlet/sealed-shot/fixtures/behavior-baseline-v1.json'));
  for(const [path,entry] of Object.entries(manifest.files)){
    if(path==='prototype1/game.js')continue;
    const raw=restoreStep2Bytes(path,read(path));assert.equal(hash(entry.comparison==='raw bytes'?raw:Buffer.from(lf(raw))),entry.sha256,path);
  }
  assertStep3ProductionScope();
});

console.log('INFO coverage '+JSON.stringify(counts));
console.log(`\nLOFT DISPERSION STEP 2: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('Historical Node/V8 Step 2 seam proof retained through the exact Step 5 inverse. Normal production uses shotSeed, not this historical clock adapter. WebKit, Gecko and physical iOS WebView remain pending; no authoritative ShotResult.');
process.exitCode=failed?1:0;
