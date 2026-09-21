// Structural Step 3 execution only. No frozen parity projection is imported.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {CLUBS,LEVELS} from '../../prototype1/equipment.js';
import {injectedResolverSource} from './step5-test-adapter.mjs';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const coursePackage=JSON.parse(read('gauntlet/sealed-shot/fixtures/coastal-ridge-v1.json'));
const courseDigest=JSON.parse(read('gauntlet/sealed-shot/fixtures/contract-vectors-v1.json')).courses[0].sha256;
const inputs=JSON.parse(read('gauntlet/sealed-shot/fixtures/parity-v1.json')).cases.map(c=>c.input);
const allowed=new Set(['prototype1/shot/resolveShot.js','prototype1/shot/solverVector.js','prototype1/shot/courseField.js','prototype1/shot/seedContract.js','prototype1/physics.js','prototype1/surfaces.js']);
const modules=new Map(),edges=[],blocked=[];
const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});
// The resolver's realm has neither Node globals nor browser conveniences. Reads
// fail loudly (including clocks/randomness), rather than passing with a stub.
for(const name of ['window','document','navigator','canvas','THREE','performance','Date','process','require','fetch','setTimeout','setInterval','requestAnimationFrame']){
  Object.defineProperty(context,name,{get(){blocked.push(name);throw Error('Forbidden ambient dependency: '+name);}});
}
vm.runInContext("Math.random=()=>{throw Error('Ambient randomness forbidden')};Object.freeze(Math);",context);
function load(path){
  assert.ok(allowed.has(path),'Dependency outside pure graph: '+path);
  if(!modules.has(path)){
    const source=read(path);
    const code=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\r\n]*/g,'');
    assert.doesNotMatch(code,/\b(window|document|navigator|canvas|performance|Date|process|require|fetch|setTimeout|setInterval|requestAnimationFrame)\b|Math\.random|\beval\s*\(|\bFunction\s*\(/,path);
    modules.set(path,new vm.SourceTextModule(source,{context,identifier:path,
      importModuleDynamically(){throw Error('Dynamic imports forbidden');}}));
  }
  return modules.get(path);
}
async function link(mod){
  if(mod.status!=='unlinked')return;
  await mod.link((specifier,parent)=>{
    assert.match(specifier,/^\.\.?\//,'Only explicit local dependencies');
    const path=new URL(specifier,new URL(parent.identifier,root)).href.slice(root.href.length);
    edges.push([parent.identifier,path]);return load(path);
  });
}
const resolver=load('prototype1/shot/resolveShot.js'),field=load('prototype1/shot/courseField.js');
await link(resolver);await link(field);await resolver.evaluate();await field.evaluate();
assert.deepEqual([...modules.keys()].sort(),[...allowed].sort());
assert.deepEqual(blocked,[]);
const {resolveShot,launchShotPhysics}=resolver.namespace;
// Historical raw scalars belong exclusively to this explicit test adapter.
// The normal resolver above is also executed below, unmodified, with shotSeed.
const injectedResolver=new vm.SourceTextModule(injectedResolverSource(read('prototype1/shot/resolveShot.js')),
  {context,identifier:'prototype1/shot/resolveShot.js',importModuleDynamically(){throw Error('Dynamic imports forbidden');}});
await injectedResolver.link((specifier,parent)=>{
  const path=new URL(specifier,new URL(parent.identifier,root)).href.slice(root.href.length);
  assert.ok(modules.has(path),'Test seam must reuse the audited production graph');
  return modules.get(path);
});
await injectedResolver.evaluate();
const resolveInjected=injectedResolver.namespace.resolveShot;
const {deriveShotSeed}=modules.get('prototype1/shot/seedContract.js').namespace;
const {GolfPhysics,SOLVER_FIXED_STEP}=modules.get('prototype1/physics.js').namespace;
const {Vector3}=modules.get('prototype1/shot/solverVector.js').namespace;
const {createCourseField}=field.namespace;
const deepFreeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(deepFreeze);Object.freeze(o);}return o;};
const raw=value=>JSON.stringify(value,(_k,v)=>typeof v==='number'?['f64',(()=>{const b=Buffer.alloc(8);b.writeDoubleLE(v);return b.toString('hex');})()]:v===undefined?['undefined']:v);
const digest=o=>createHash('sha256').update(raw(o)).digest('hex');
const holes=deepFreeze(structuredClone(coursePackage.holes));
const course=Object.freeze({...createCourseField(holes),holes,courseHash:courseDigest});
const clean={tempoScore:1,rhythm:1,center:1,commitment:1,loadScore:1,speedScore:1};
const intents=inputs.map((input,index)=>{
  const [x,z]=input.position;
  return deepFreeze({courseHash:courseDigest,holeIndex:0,ballRestPosition:{x,y:course.terrainContactY(x,z,.0265),z},
    lieSurface:input.launch.lie??'green',club:structuredClone(CLUBS.find(c=>c.id===input.club)),
    playerState:structuredClone(LEVELS[25]),metrics:{...clean,power:input.launch.power,path:input.launch.path,puttPaceFeet:input.launch.paceFeet},
    aimYaw:input.launch.aimYaw,dispersion:[-.625,-0,.25,1,-1,.5][index],
    environmentState:{wind:{x:input.wind[0],y:input.wind[1],z:input.wind[2]}}});
});
const inputBefore=raw(intents),holeBefore=raw(holes);
const seededIntents=intents.map((intent,index)=>{
  const {dispersion,...normal}=intent;
  return deepFreeze({...normal,shotSeed:deriveShotSeed({roundId:'purity-round-0',playerId:'purity-player',holeIndex:0,strokeIndex:index})});
});
const seededBefore=raw(seededIntents);
const results=intents.map(intent=>resolveInjected(intent,course));
const seededResults=seededIntents.map(intent=>resolveShot(intent,course));
for(const r of [...results,...seededResults]){
  assert.ok(r.trajectory.length>0&&r.trajectory.length<4000);
  assert.equal(r.restState.stopped,true);
  assert.ok(Object.values(r.restState.pos).every(Number.isFinite));
  assert.equal(raw(r.trajectory.at(-1)),raw(r.restState));
  assert.equal(r.launchState.simTime,0);
  assert.equal(r.trajectory[0].simTime,SOLVER_FIXED_STEP);
  assert.equal(Object.getPrototypeOf(r.restState.pos),vm.runInContext('Object.prototype',context));
}
// Same-call identity / isolation evidence, not a legacy-vs-extracted parity gate.
const resultDigests=results.map(digest);
const seededDigests=seededResults.map(digest);
for(let i=intents.length-1;i>=0;i--){
  assert.equal(digest(resolveInjected(intents[i],course)),resultDigests[i]);
  assert.equal(digest(resolveShot(seededIntents[i],course)),seededDigests[i]);
  // A raw scalar on an arbitrary caller object is never a second production
  // authority. Valid shotSeed alone determines the normal resolver's mapping.
  assert.equal(digest(resolveShot({...seededIntents[i],dispersion:999},course)),seededDigests[i]);
}
const anotherCourse=Object.freeze({...createCourseField(holes),holes,courseHash:courseDigest});
assert.notEqual(course.BUNKERS,anotherCourse.BUNKERS,'authored arrays are instance-owned');
course.BUNKERS[0].x+=100; // Disturb another instance; never a shipped/runtime edit.
for(let i=0;i<intents.length;i++){
  assert.equal(digest(resolveInjected(intents[i],anotherCourse)),resultDigests[i]);
  assert.equal(digest(resolveShot(seededIntents[i],anotherCourse)),seededDigests[i]);
}
assert.equal(raw(intents),inputBefore);assert.equal(raw(holes),holeBefore);
assert.equal(raw(seededIntents),seededBefore);
assert.throws(()=>resolveShot({...seededIntents[0],courseHash:'wrong'},anotherCourse),/courseHash/);
assert.throws(()=>resolveShot({...seededIntents[0],shotSeed:undefined,dispersion:.5},anotherCourse),/shotSeed/);
assert.throws(()=>resolveShot({...seededIntents[0],holeIndex:-1},anotherCourse),/holeIndex/);
assert.deepEqual(blocked,[]);
// Both entry points reach the same launch body and GolfPhysics class. Observe
// explicit reader order; no local stand-in for the solver is used here.
let scalarReads=0,aimReads=0,putts=0;
const physics=new GolfPhysics({terrainHeight:anotherCourse.terrainHeight,terrainSample:anotherCourse.sampleTerrain,
  terrainContactY:anotherCourse.terrainContactY,terrainSweep:anotherCourse.sweepTerrainSegment,
  surfaceAt:anotherCourse.courseSurfaceAt,wind:new Vector3(0,0,0)});
const puttIntent=intents.find(i=>i.club.head==='putter');
const originalPutt=physics.putt.bind(physics);
physics.putt=p=>{putts++;return originalPutt(p);};
const call=dispersion=>launchShotPhysics(physics,{metrics:puttIntent.metrics,c:puttIntent.club,L:puttIntent.playerState,
  lie:puttIntent.lieSurface,position:new Vector3(...Object.values(puttIntent.ballRestPosition)),
  aimYaw:()=>{aimReads++;return puttIntent.aimYaw;},dispersion,dispersionSource:()=>{scalarReads++;return -.625;}});
call(.25);assert.equal(scalarReads,0);assert.equal(aimReads,3);assert.equal(putts,1);
call(undefined);assert.equal(scalarReads,1);assert.equal(aimReads,6);assert.equal(putts,2);
console.log(JSON.stringify({node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  graph:[...modules.keys()].sort(),edges,blockedAmbientReads:blocked,
  cases:inputs.map((input,i)=>({name:input.name,frames:results[i].trajectory.length,resultSha256:resultDigests[i]})),
  seededCases:inputs.map((input,i)=>({name:input.name,shotSeed:seededIntents[i].shotSeed,frames:seededResults[i].trajectory.length,resultSha256:seededDigests[i]})),
  assertions:{bareNode:true,closedGraph:true,noAmbientReads:true,frozenInputsUnchanged:true,courseInstancesIsolated:true,
    rawResults:true,injectedSource:true,courseIdentityRefusal:true,singleSeedAuthority:true},
  phase:'Step 3 PURITY regression with Step 5 production seed authority and explicit historical test seam; not Step 4 EXTRACTION PARITY'}));
