// Step 4 only: real legacy Git modules versus the actual current resolveShot.
// The unmodified frozen projection is the ONLY shot-comparison representation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';
import vm from 'node:vm';
import path from 'node:path';
import {createLegacyOracle,LEGACY_COMMIT} from './step4-legacy-oracle.mjs';
import {projectPhysicsFrame,PARITY_PROJECTION_VERSION} from './parity-projection-v1.mjs';
import {injectedResolverSource} from './step5-test-adapter.mjs';

const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const frozen=JSON.parse(read('gauntlet/sealed-shot/fixtures/parity-v1.json'));
const corpusPath='gauntlet/sealed-shot/step4-inputs-v1.json';
const corpusBytes=read(corpusPath),corpus=JSON.parse(corpusBytes);
assert.equal(sha(corpusBytes),'011d8269d6eaed1613cab1703a8ec8d2cd8b550c7fafc69051e1848bcb4d2b51','frozen Step 4 input-only companion');
const projectionPath='gauntlet/sealed-shot/parity-projection-v1.mjs';
assert.equal(sha(read(projectionPath)),frozen.projectionSha256);
assert.equal(PARITY_PROJECTION_VERSION,frozen.parityProjectionVersion);
assert.equal(corpus.legacyCommit,LEGACY_COMMIT);
const projectionBefore=sha(read(projectionPath));
const allowed=new Set(['prototype1/shot/resolveShot.js','prototype1/shot/solverVector.js',
  'prototype1/shot/courseField.js','prototype1/physics.js','prototype1/surfaces.js','prototype1/shot/seedContract.js']);
const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});
const blocked=[];
for(const name of ['window','document','navigator','canvas','THREE','performance','Date','process','require','fetch','setTimeout','setInterval','requestAnimationFrame']){
  Object.defineProperty(context,name,{get(){blocked.push(name);throw Error('Forbidden current ambient read: '+name);}});
}
vm.runInContext("Math.random=()=>{throw Error('Current ambient random read')};Object.freeze(Math);",context);
const modules=new Map(),sources=new Map(),edges=[];
function load(p){
  assert.ok(allowed.has(p),'Current dependency outside pure graph: '+p);
  if(!modules.has(p)){
    sources.set(p,read(p));
    const source=sources.get(p).toString('utf8');
    modules.set(p,new vm.SourceTextModule(p==='prototype1/shot/resolveShot.js'?injectedResolverSource(source):source,{context,identifier:p,
      importModuleDynamically(){throw Error('Current dynamic import forbidden');}}));
  }
  return modules.get(p);
}
for(const p of ['prototype1/shot/resolveShot.js','prototype1/shot/courseField.js']){
  const mod=load(p);
  if(mod.status==='unlinked')await mod.link((s,parent)=>{
    assert.match(s,/^\.\.?\//);
    const p=path.posix.normalize(path.posix.join(path.posix.dirname(parent.identifier),s));
    edges.push([parent.identifier,p]);return load(p);
  });
  await mod.evaluate();
}
assert.deepEqual([...modules.keys()].sort(),[...allowed].sort());
const {resolveShot}=modules.get('prototype1/shot/resolveShot.js').namespace;
const {GolfPhysics,SOLVER_FIXED_STEP}=modules.get('prototype1/physics.js').namespace;
const {Vector3}=modules.get('prototype1/shot/solverVector.js').namespace;
const {createCourseField}=modules.get('prototype1/shot/courseField.js').namespace;
assert.equal(SOLVER_FIXED_STEP,1/120);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const sameFrame=(actual,expected,id)=>assert.deepEqual(actual,expected,id);
const traceHash=frames=>sha(frames.map(f=>JSON.stringify(f)+'\n').join(''));

// Validate the isolated reference itself against all unchanged Step 1 fixtures.
// Also execute current low-level solver; this layer does not claim full-pipeline
// parity. It keeps the original six expected launches/trajectories/rests intact.
const fixtureOracle=await createLegacyOracle();
assert.notEqual(fixtureOracle.GolfPhysics,GolfPhysics,'Different realms/implementations');
const directField=createCourseField(fixtureOracle.holes);
const direct=[];
function directCase(input,Ctor,V3,field){
  const point=([x,z])=>new V3(x,fixtureOracle.field.terrainContactY(x,z,.0265),z);
  const physics=new Ctor({terrainHeight:field.terrainHeight,terrainContactY:field.terrainContactY,
    terrainSample:field.sampleTerrain,terrainSweep:field.sweepTerrainSegment,surfaceAt:field.courseSurfaceAt,wind:new V3(...input.wind)});
  physics.setCup(point(input.cup));
  physics[input.method]({...input.launch,position:point(input.position),club:fixtureOracle.equipment.CLUBS.find(c=>c.id===input.club)});
  const launchFrame=projectPhysicsFrame(physics),frames=[];
  while(physics.active){assert.ok(frames.length<4000);physics.step(1/120);frames.push(projectPhysicsFrame(physics));}
  return {launchFrame,frames:frames.length,trajectorySha256:traceHash(frames),terminalFrame:projectPhysicsFrame(physics)};
}
for(const c of frozen.cases){
  const legacy=directCase(c.input,fixtureOracle.GolfPhysics,fixtureOracle.THREE.Vector3,fixtureOracle.field);
  const extracted=directCase(c.input,GolfPhysics,Vector3,directField);
  assert.deepEqual(legacy,c.expected,c.input.name+' independent oracle vs frozen fixture');
  assert.deepEqual(extracted,c.expected,c.input.name+' extracted solver vs frozen fixture');
  direct.push({name:c.input.name,frames:legacy.frames,trajectorySha256:legacy.trajectorySha256});
}

// Fresh legacy realm/current field for the composition-root corpus. All resolved
// input values originate in frozen files / accepted legacy modules, never current
// solver outputs. Both runners receive the SAME frozen in-memory intent object.
const legacy=await createLegacyOracle();
const holes=freeze(structuredClone(legacy.holes));
const courseHash=JSON.parse(read('gauntlet/sealed-shot/fixtures/contract-vectors-v1.json')).courses[0].sha256;
const course=Object.freeze({...createCourseField(holes),holes,courseHash});
const intents=corpus.cases.map(row=>{
  const base=frozen.cases.find(c=>c.input.name===row.baseCase)?.input;
  assert.ok(base,'Unknown frozen base case');
  const holeIndex=holes.findIndex(h=>h.pin[0]===base.cup[0]&&h.pin[1]===base.cup[1]);
  assert.ok(holeIndex>=0);
  const [x,z]=base.position;
  const dispersion=Buffer.from(row.dispersionF64LE,'hex').readDoubleLE();
  const intent=freeze({courseHash,holeIndex,ballRestPosition:{x,y:legacy.field.terrainContactY(x,z,.0265),z},
    lieSurface:base.launch.lie??'green',club:structuredClone(legacy.equipment.CLUBS.find(c=>c.id===base.club)),
    playerState:structuredClone(legacy.equipment.LEVELS[row.level]),
    metrics:{...row.gesture,power:base.launch.power,path:base.launch.path,puttPaceFeet:base.launch.paceFeet},
    aimYaw:base.launch.aimYaw,dispersion,environmentState:{wind:{x:base.wind[0],y:base.wind[1],z:base.wind[2]}}});
  const check=Buffer.alloc(8);check.writeDoubleLE(intent.dispersion);assert.equal(check.toString('hex'),row.dispersionF64LE);
  return {row,intent,inputSha256:sha(serialize(intent))};
});
assert.equal(new Set(intents.map(c=>c.row.id)).size,intents.length);
const runs=[],outcomes={holed:0,bounced:0,lipTouched:0,captureRejected:0,recovered:0,surfaceTransitions:0,restSurfaces:{}};
let totalFrames=0,snapshotComparisons=0;
function runCase(c,pass){
  const {row,intent,inputSha256}=c;
  assert.equal(sha(serialize(intent)),inputSha256,'input before legacy');
  const old=legacy.run(intent,row.level),expected=[projectPhysicsFrame(old)];
  while(old.active){assert.ok(expected.length<=4000,row.id+' legacy termination');old.step(1/120);expected.push(projectPhysicsFrame(old));}
  const terminal=projectPhysicsFrame(old);
  assert.equal(sha(serialize(intent)),inputSha256,'input after legacy / before current');
  const observations=[];
  const originals=Object.fromEntries(['launch','putt','step'].map(n=>[n,GolfPhysics.prototype[n]]));
  let launches=0,steps=0;
  // Observer is installed ONLY on the isolated test realm, never production.
  // It calls each original method once and projects the real instance, preserving
  // actual active/accum. No guessed accumulator or synthesized activity flag.
  for(const name of Object.keys(originals))GolfPhysics.prototype[name]=function(...args){
    if(name==='step'){assert.equal(args[0],1/120);steps++;assert.ok(steps<=4000);}
    else launches++;
    const result=Reflect.apply(originals[name],this,args);
    const frame=projectPhysicsFrame(this);
    sameFrame(frame,expected[observations.length],`${row.id} ${pass} ${name} frame ${observations.length}`);
    observations.push({frame,active:this.active,accum:this.accum});
    return result;
  };
  let result;
  try{result=resolveShot(intent,course);}finally{
    for(const [name,method] of Object.entries(originals))GolfPhysics.prototype[name]=method;
  }
  assert.equal(launches,1);assert.equal(steps,expected.length-1);
  assert.equal(result.trajectory.length,steps);
  // Validate the actual returned raw snapshots through the SAME projection.
  // Metadata is the real observed solver metadata for that exact frame, not a
  // change to the projection and not part of a new production result contract.
  const states=[result.launchState,...result.trajectory];
  states.forEach((state,i)=>{
    const {active,accum}=observations[i];
    sameFrame(projectPhysicsFrame({state,active,accum}),expected[i],row.id+' returned snapshot '+i);
    snapshotComparisons++;
  });
  const last=observations.at(-1);
  sameFrame(projectPhysicsFrame({state:result.restState,active:last.active,accum:last.accum}),terminal,row.id+' returned rest');
  snapshotComparisons++;
  assert.equal(sha(serialize(intent)),inputSha256,'input after current');
  const legacyDigest=traceHash(expected),extractedDigest=traceHash(observations.map(o=>o.frame));
  assert.equal(extractedDigest,legacyDigest);
  if(pass==='warm-reverse')assert.equal(legacyDigest,runs.find(r=>r.id===row.id).projectionSha256,row.id+' cache/interleaving repeat');
  if(pass==='initial'){
    for(const key of ['holed','bounced','lipTouched','captureRejected','recovered'])if(old.state[key])outcomes[key]++;
    outcomes.restSurfaces[old.state.surface]=(outcomes.restSurfaces[old.state.surface]??0)+1;
    for(let i=1;i<expected.length;i++)if(expected[i][10]!==expected[i-1][10])outcomes.surfaceTransitions++;
  }
  runs.push({id:row.id,pass,inputSha256,frames:steps,projectionSha256:legacyDigest,extractedProjectionSha256:extractedDigest,
    terminalFrame:terminal});totalFrames+=steps;
}
for(const c of intents)runCase(c,'initial');
for(const c of [...intents].reverse())runCase(c,'warm-reverse');

// Fail-closed comparator checks use deliberately altered TEST projections only.
// Not tolerances, production mutations, new decision traces, or fixture rewrites.
const sample=projectPhysicsFrame(legacy.run(intents[0].intent,intents[0].row.level));
const mutations=[f=>f[1]=!f[1],f=>f[2]='0000000000000080',f=>f[3][0]='0000000000000000',
  f=>f[10]='water',f=>f[16]=!f[16],f=>f[19]=['present',false]];
for(const mutate of mutations){const altered=structuredClone(sample);mutate(altered);assert.throws(()=>sameFrame(altered,sample,'deliberate corruption'));}
assert.deepEqual(blocked,[]);
assert.equal(sha(read(projectionPath)),projectionBefore,'projection after');
assert.equal(sha(read(corpusPath)),sha(corpusBytes),'input-only corpus after');
for(const [p,b] of sources)assert.equal(sha(read(p)),sha(b),'production source unchanged during execution: '+p);
console.log(JSON.stringify({phase:'Step 4 frozen injected corpus regression through Step 5 test-only launch adapter',node:process.version,v8:process.versions.v8,
  testAdapter:{path:'gauntlet/sealed-shot/step5-test-adapter.mjs',sha256:sha(read('gauntlet/sealed-shot/step5-test-adapter.mjs')),replacementCount:1},
  platform:process.platform,arch:process.arch,legacy:legacy.provenance(),
  extracted:{checkpoint:corpus.extractedCheckpoint,graph:[...modules.keys()].sort(),edges,sources:[...sources].map(([p,b])=>({path:p,sha256:sha(b)}))},
  projection:{version:PARITY_PROJECTION_VERSION,beforeSha256:projectionBefore,afterSha256:sha(read(projectionPath))},
  corpus:{path:corpusPath,sha256:sha(corpusBytes),baseCases:direct,fullPipelineCases:intents.length,
    families:[...new Set(corpus.cases.map(c=>c.baseCase))],levels:[...new Set(corpus.cases.map(c=>c.level))],
    scalarBits:[...new Set(corpus.cases.map(c=>c.dispersionF64LE))],passes:['initial','warm-reverse']},
  totalPairedRuns:runs.length,totalPairedFrames:totalFrames,returnedSnapshotComparisons:snapshotComparisons,
  mismatchCount:0,extractionFixes:[],blockedAmbientReads:blocked,comparatorMutationRejections:mutations.length,outcomes,
  inputProof:'Same deeply frozen object at both call boundaries; v8.serialize SHA-256 before/after each; signed-zero scalar bits checked. Test-only provenance, not record serialization.',
  assertions:{oracleIsolated:true,frozenDirectCases:true,allProjectedFramesEqual:true,returnedSnapshotsEqual:true,
    inputsIdentical:true,warmReverseEqual:true,productionUnchanged:true,projectionUnchanged:true},runs}));
