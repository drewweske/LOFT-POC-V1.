// Step 5 production execution, not a ShotRecord or a new parity projection.
// No source substitution: this realm executes the shipped seed-only resolver.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {CLUBS,LEVELS} from '../../prototype1/equipment.js';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const vectors=JSON.parse(read('gauntlet/sealed-shot/fixtures/contract-vectors-v1.json'));
const coursePackage=JSON.parse(read('gauntlet/sealed-shot/fixtures/coastal-ridge-v1.json'));
const cases=JSON.parse(read('gauntlet/sealed-shot/fixtures/parity-v1.json')).cases;
const edgeSeeds=[0x00000000,0x40000000,0x80000000,0xc0000000,0xffffffff];
const allowed=new Set(['prototype1/physics.js','prototype1/shot/courseField.js',
  'prototype1/shot/resolveShot.js','prototype1/shot/seedContract.js',
  'prototype1/shot/solverVector.js','prototype1/surfaces.js']);
const modules=new Map(),edges=[],blocked=[],sources=[];
const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});
for(const name of ['window','document','navigator','canvas','THREE','performance','Date',
  'process','require','fetch','crypto','localStorage','sessionStorage','setTimeout',
  'setInterval','requestAnimationFrame','TextEncoder']){
  Object.defineProperty(context,name,{get(){blocked.push(name);throw Error('Forbidden ambient read: '+name);}});
}
// A caught forbidden read must also fail the audit, so record before throwing.
Object.defineProperty(vm.runInContext('Math',context),'random',{value:()=>{
  blocked.push('Math.random');throw Error('Ambient randomness forbidden');
},writable:false,configurable:false});
vm.runInContext('Object.freeze(Math)',context);
function load(path){
  assert.ok(allowed.has(path),'Dependency outside closed production graph: '+path);
  if(!modules.has(path)){
    const source=read(path),code=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\r\n]*/g,'');
    assert.doesNotMatch(code,/\b(window|document|navigator|canvas|performance|Date|process|require|fetch|crypto|localStorage|sessionStorage|setTimeout|setInterval|requestAnimationFrame)\b|Math\.random|\beval\s*\(|\bFunction\s*\(/,path);
    sources.push({path,sha256:sha(source)});
    modules.set(path,new vm.SourceTextModule(source,{context,identifier:path,
      importModuleDynamically(){throw Error('Dynamic imports forbidden');}}));
  }
  return modules.get(path);
}
for(const path of ['prototype1/shot/resolveShot.js','prototype1/shot/courseField.js']){
  const mod=load(path);
  if(mod.status==='unlinked')await mod.link((specifier,parent)=>{
    assert.match(specifier,/^\.\.?\//,'Only explicit local dependencies');
    const dependency=new URL(specifier,new URL(parent.identifier,root)).href.slice(root.href.length);
    edges.push([parent.identifier,dependency]);return load(dependency);
  });
  await mod.evaluate();
}
assert.deepEqual([...modules.keys()].sort(),[...allowed].sort());
const {resolveShot,launchShotPhysics}=modules.get('prototype1/shot/resolveShot.js').namespace;
const {deriveShotSeed,dispersionFromShotSeed}=modules.get('prototype1/shot/seedContract.js').namespace;
const {GolfPhysics,SOLVER_FIXED_STEP}=modules.get('prototype1/physics.js').namespace;
const {Vector3}=modules.get('prototype1/shot/solverVector.js').namespace;
const {createCourseField}=modules.get('prototype1/shot/courseField.js').namespace;
assert.equal(SOLVER_FIXED_STEP,1/120);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
// This is a test-only bit digest of the complete native result, not authoritative
// quantization, serialization or a replacement for the frozen Step 4 projection.
const raw=value=>JSON.stringify(value,(_k,v)=>typeof v==='number'?['f64',(()=>{
  const b=Buffer.alloc(8);b.writeDoubleLE(v);return b.toString('hex');
})()]:v===undefined?['undefined']:v);
const digest=value=>sha(raw(value));
const holes=freeze(structuredClone(coursePackage.holes));
const courseHash=vectors.courses[0].sha256;
const course=Object.freeze({...createCourseField(holes),holes,courseHash});
const clean={tempoScore:1,rhythm:1,center:1,commitment:1,loadScore:1,speedScore:1};
const intents=cases.flatMap(({input})=>edgeSeeds.map(shotSeed=>{
  const [x,z]=input.position;
  const holeIndex=holes.findIndex(h=>h.pin[0]===input.cup[0]&&h.pin[1]===input.cup[1]);
  assert.ok(holeIndex>=0,input.name+' authored cup');
  return {name:input.name,intent:freeze({courseHash,holeIndex,shotSeed,
    ballRestPosition:{x,y:course.terrainContactY(x,z,.0265),z},
    lieSurface:input.launch.lie??'green',club:structuredClone(CLUBS.find(c=>c.id===input.club)),
    playerState:structuredClone(LEVELS[25]),
    metrics:{...clean,power:input.launch.power,path:input.launch.path,puttPaceFeet:input.launch.paceFeet},
    aimYaw:input.launch.aimYaw,environmentState:{wind:{x:input.wind[0],y:input.wind[1],z:input.wind[2]}}})};
}));
const before=digest({holes,intents});
const xyz=p=>({x:p.x,y:p.y,z:p.z});
const vector=p=>new Vector3(p.x,p.y,p.z);
const snapshot=state=>({...state,pos:xyz(state.pos),vel:xyz(state.vel),spinAxis:xyz(state.spinAxis),
  lastSafePos:xyz(state.lastSafePos),surfaceChanged:state.surfaceChanged?{...state.surfaceChanged}:state.surfaceChanged});
function injectedLaunchPath(intent){
  const physics=new GolfPhysics({terrainHeight:course.terrainHeight,terrainSample:course.sampleTerrain,
    terrainContactY:course.terrainContactY,terrainSweep:course.sweepTerrainSegment,
    surfaceAt:course.courseSurfaceAt,wind:vector(intent.environmentState.wind),waterLevel:course.WATER_LEVEL});
  const hole=holes[intent.holeIndex];
  physics.setCup(new Vector3(hole.pin[0],course.terrainHeight(hole.pin[0],hole.pin[1]),hole.pin[1]));
  const launch=launchShotPhysics(physics,{metrics:intent.metrics,c:intent.club,L:intent.playerState,
    lie:intent.lieSurface,position:vector(intent.ballRestPosition),aimYaw:()=>intent.aimYaw,
    dispersion:dispersionFromShotSeed(intent.shotSeed),
    dispersionSource:()=>{throw Error('Injected scalar must bypass source');}});
  const launchState=snapshot(physics.state),trajectory=[];
  while(physics.active){assert.ok(trajectory.length<4000);physics.step(SOLVER_FIXED_STEP);trajectory.push(snapshot(physics.state));}
  return {quality:launch.q,path:launch.finalPath,launchState,trajectory,
    landingSurface:physics.state.lastImpactSurface,restState:snapshot(physics.state)};
}
const results=intents.map(({name,intent})=>{
  const result=resolveShot(intent,course),resultDigest=digest(result);
  assert.ok(result.trajectory.length>0&&result.trajectory.length<4000);
  assert.equal(result.restState.stopped,true);
  assert.equal(result.launchState.simTime,0);
  assert.equal(result.trajectory[0].simTime,SOLVER_FIXED_STEP);
  assert.equal(digest(result.trajectory.at(-1)),digest(result.restState));
  assert.equal(digest(injectedLaunchPath(intent)),resultDigest,name+' exact mapped-scalar launch path');
  // Raw scalar is not a second production authority. A throwing accessor also
  // proves resolveShot does not read an ignored legacy field before proceeding.
  const withOldField={...intent};
  Object.defineProperty(withOldField,'dispersion',{get(){throw Error('Production read raw dispersion');}});
  assert.equal(digest(resolveShot(withOldField,course)),resultDigest,name+' raw field not read');
  assert.equal(digest(resolveShot({...intent,dispersion:.375},course)),resultDigest,name+' raw override ignored');
  return {name,shotSeed:intent.shotSeed,dispersion:dispersionFromShotSeed(intent.shotSeed),
    frames:result.trajectory.length,resultSha256:resultDigest};
});
for(let i=intents.length-1;i>=0;i--)assert.equal(digest(resolveShot(intents[i].intent,course)),results[i].resultSha256);
const invalidSeeds=[undefined,null,-1,1.5,4294967296,NaN,Infinity,-Infinity,'0',false,{},[]];
for(const shotSeed of invalidSeeds){
  assert.throws(()=>resolveShot({...intents[0].intent,shotSeed},course),/shotSeed|uint32/);
  assert.throws(()=>resolveShot({...intents[0].intent,shotSeed,dispersion:0},course),/shotSeed|uint32/);
}
const productionVectors=vectors.seedVectors.map(({input,shotSeed})=>{
  assert.equal(deriveShotSeed(input),shotSeed);
  return {shotSeed,dispersion:dispersionFromShotSeed(shotSeed)};
});
assert.equal(digest({holes,intents}),before,'caller-owned inputs unchanged');
assert.deepEqual(blocked,[]);
console.log(JSON.stringify({node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  graph:[...modules.keys()].sort(),edges,sources:sources.sort((a,b)=>a.path.localeCompare(b.path)),
  blockedAmbientReads:blocked,seedVectorCount:productionVectors.length,productionVectors,
  seedCases:results,productionExecutions:results.length*4,injectedComparisons:results.length,
  invalidSeedRejections:invalidSeeds.length*2,
  assertions:{bareNode:true,closedGraph:true,noEntropy:true,sameProductionSeedModule:true,
    mappedScalarLaunchIdentical:true,rawDispersionNotRead:true,rawOverrideIgnored:true,
    frozenInputsUnchanged:true,warmReverseRepeat:true,missingInvalidSeedRejected:true},
  runtimeScope:'Node/V8 only; WebKit, Gecko, physical iOS WebView and full COURSE HASH STABILITY matrix remain pending.'}));
