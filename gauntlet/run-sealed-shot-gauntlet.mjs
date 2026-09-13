import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {seedBytes,shotSeed,fnv1a32,fmix32,unitFloat,boundaryKeyBytes,boundaryWord,courseBytes,courseHash,assertFeaturePermanence} from './sealed-shot/contracts-v1.mjs';
import {projectPhysicsFrame,PARITY_FIELDS} from './sealed-shot/parity-projection-v1.mjs';
import {runLegacyCase} from './sealed-shot/legacy-parity-corpus.mjs';
const root=new URL('../',import.meta.url),base=new URL('./sealed-shot/',import.meta.url);
const read=p=>readFileSync(new URL(p,base));
const json=p=>JSON.parse(read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const hex=b=>Buffer.from(b).toString('hex');
const clone=structuredClone;
const fixture=json('fixtures/contract-vectors-v1.json'),parity=json('fixtures/parity-v1.json');
const course=json('fixtures/coastal-ridge-v1.json'),ledger=json('coastal-feature-ids-v1.json');
let passed=0,failed=0;
async function check(name,fn){try{await fn();console.log('PASS  '+name);passed++;}catch(e){console.error('FAIL  '+name+' — '+e.stack);failed++;}}

await check('Frozen v1 authority, schema, ID ledger, vectors and parity fixture digests match',()=>{
  for(const [path,sha] of Object.entries(json('fixture-lock-v1.json')))assert.equal(hash(read(path)),sha,path);
});

await check('SEED CONTRACT VECTORS: 11 independently derived byte/FNV/fmix/u32/float vectors',()=>{
  assert.equal(fnv1a32(new TextEncoder().encode('hello')),0x4f9f2cab);assert.equal(fmix32(0),0);
  for(const f of fixture.seedVectors){assert.equal(hex(seedBytes(f.input)),f.bytes);assert.equal(fnv1a32(seedBytes(f.input)),f.fnv1a32);assert.equal(shotSeed(f.input),f.shotSeed);assert.equal(unitFloat(f.shotSeed),f.unitFloat);}
});
await check('Seed lengths distinguish ambiguous concatenation; seed IDs are raw UTF-8, not NFC',()=>{
  assert.notEqual(fixture.seedVectors[1].shotSeed,fixture.seedVectors[2].shotSeed);
  assert.notEqual(fixture.seedVectors[9].shotSeed,fixture.seedVectors[10].shotSeed);
});
await check('Seed rejects invalid integers and malformed ID input rather than truncating',()=>{
  const p=fixture.seedVectors[3].input;
  for(const v of [-1,2**32,1.1,NaN,Infinity,'1',null])for(const key of ['holeIndex','strokeIndex'])assert.throws(()=>shotSeed({...p,[key]:v}));
  for(const v of [null,42,'\ud800','\udc00'])assert.throws(()=>shotSeed({...p,roundId:v}));
});
await check('BOUNDARY KEY VECTORS: 9 independent frozen byte/word vectors, no band implementation',()=>{
  for(const f of fixture.boundaryVectors){const b=boundaryKeyBytes(f.input);assert.equal(hex(b),f.bytes);assert.equal(fnv1a32(b),f.fnv1a32);assert.equal(boundaryWord(f.input),f.boundaryWord);}
  assert.equal(new Set(fixture.boundaryVectors.slice(0,6).map(f=>f.boundaryWord)).size,6);
});
await check('Boundary domain and occurrence are validated; zero-based occurrence survives',()=>{
  const p=fixture.boundaryVectors[0].input;
  assert.equal(p.occurrence,0);
  for(const domain of [0,4,-1,'1',NaN])assert.throws(()=>boundaryWord({...p,domain}));
  for(const v of [-1,2**32,.5,NaN,Infinity]){assert.throws(()=>boundaryWord({...p,occurrence:v}));assert.throws(()=>boundaryWord({...p,shotSeed:v}));}
});
await check('Reference generator is isolated from subject/game code; gates never regenerate fixtures',()=>{
  const oracle=read('generate-reference-vectors.mjs').toString();
  const imports=[...oracle.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m=>m[1]);
  assert.deepEqual(imports,['node:fs','node:crypto']);assert.match(oracle,/2166136261n/);
  assert.doesNotMatch(read('contracts-v1.mjs').toString(),/performance\.now|Math\.(sin|cos|tan|pow|exp|random)|from\s+['"].*prototype1/);
});
await check('COURSE HASH STABILITY: explicit binary order matches two independent byte/digest fixtures',async()=>{
  for(const f of fixture.courses){const bytes=courseBytes(f.input);assert.equal(bytes.length,f.byteLength);assert.equal(hex(bytes),f.bytes);assert.equal(await courseHash(f.input),f.sha256);}
  assert.equal(await courseHash(course),fixture.courses[0].sha256);
});
await check('Course negative-zero normalization is recursive over numeric fields',async()=>{
  const p=clone(fixture.courses[1].input),original=await courseHash(p);p.holes[0].tee[0]=-0;p.holes[0].pin[1]=-0;
  assert.equal(await courseHash(p),original);
});
await check('Non-finite values rejected, even in excluded presentation data and unknown fields',()=>{
  for(const v of [NaN,Infinity,-Infinity]){
    for(const field of ['tee','pin','defaultWind']){const p=clone(course);p.holes[0][field][0]=v;assert.throws(()=>courseBytes(p),/non-finite/);}
    const p=clone(course);p.presentation.description=v;assert.throws(()=>courseBytes(p),/non-finite/);
    assert.throws(()=>courseBytes({...course,hidden:{value:v}}),/non-finite/);
  }
});
await check('Course NFC applies to strings, never inferred object key order',async()=>{
  const p=clone(fixture.courses[1].input),expected=await courseHash(p);
  p.courseId='Cafe\u0301';p.features[0].featureId='cup.e\u0301';p.holes[0].cupFeatureId='cup.e\u0301';
  assert.equal(await courseHash(p),expected);
  const reordered=Object.fromEntries(Object.entries(p).reverse());reordered.holes=p.holes.map(h=>Object.fromEntries(Object.entries(h).reverse()));
  assert.equal(await courseHash(reordered),expected);
});
await check('Authored array order and every encoded physics/identity field affect the digest',async()=>{
  const expected=await courseHash(course);
  for(const array of ['holes','features','physicsArtifacts']){const p=clone(course);p[array].reverse();assert.notEqual(await courseHash(p),expected);}
  const changes=[p=>p.courseId+='x',p=>p.physicsArtifacts[0].role+='x',p=>p.physicsArtifacts[0].sha256='00'.repeat(32),p=>p.features[0].authorKey+='x',p=>p.holes[0].holeId+='x',p=>p.holes[0].number=42,p=>p.holes[0].par=4,p=>p.holes[0].cupFeatureId=p.features[1].featureId];
  for(const field of ['tee','pin','defaultWind'])for(const axis of [0,1])changes.push(p=>p.holes[0][field][axis]+=.001);
  for(const change of changes){const p=clone(course);change(p);assert.notEqual(await courseHash(p),expected);}
});
await check('Presentation exclusions are finite, explicit and closed; unknown versions/fields refuse',async()=>{
  const p=clone(course);p.presentation={displayName:'Another title',description:'No gameplay meaning'};assert.equal(await courseHash(p),await courseHash(course));
  p.presentation.futureField='no';assert.throws(()=>courseBytes(p));
  for(const version of [0,2,'1'])assert.throws(()=>courseBytes({...course,coursePackageSchemaVersion:version}));
  assert.throws(()=>courseBytes({...course,slope:5}));
});
await check('Authored feature permanence rejects renamed/reindexed IDs, not geometry edits or reordered arrays',()=>{
  const p=clone(course);p.features.reverse();p.holes[0].pin[0]+=.01;assertFeaturePermanence(p,ledger);
  p.features[0].featureId='feature-0';assert.throws(()=>assertFeaturePermanence(p,ledger));
  const duplicate=clone(course);duplicate.features[1].featureId=duplicate.features[0].featureId;assert.throws(()=>courseBytes(duplicate));
  const missing=clone(course);missing.holes[0].cupFeatureId='missing';assert.throws(()=>courseBytes(missing));
});
await check('Course physics artifact closure: both immutable sources verified; authored holes match legacy',async()=>{
  for(const a of course.physicsArtifacts)assert.equal(hash(read('fixtures/'+a.sha256+'.txt')),a.sha256);
  const {ROUND_HOLES}=await import('../prototype1/round.js');
  assert.deepEqual(course.holes.map(h=>[h.number,h.par,h.tee,h.pin,h.defaultWind]),ROUND_HOLES.map(h=>[h.number,h.par,h.tee,h.pin,h.wind]));
});
await check('Seeds, keys and course bytes/digests repeat in a fresh bare Node process',()=>{
  // Use file URLs directly to avoid OS path/encoding assumptions.
  const run=`import {readFileSync} from 'node:fs';import {shotSeed,boundaryWord,courseHash} from ${JSON.stringify(new URL('contracts-v1.mjs',base).href)};const f=JSON.parse(readFileSync(new URL(${JSON.stringify(new URL('fixtures/contract-vectors-v1.json',base).href)})));console.log(JSON.stringify({seeds:f.seedVectors.map(x=>shotSeed(x.input)),keys:f.boundaryVectors.map(x=>boundaryWord(x.input)),courses:await Promise.all(f.courses.map(x=>courseHash(x.input)))}));`;
  const expected={seeds:fixture.seedVectors.map(f=>f.shotSeed),keys:fixture.boundaryVectors.map(f=>f.boundaryWord),courses:fixture.courses.map(f=>f.sha256)};
  for(let i=0;i<2;i++)assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',run],{encoding:'utf8'})),expected);
});
await check('Frozen parity projection version/source and all six legacy trajectories remain exact',()=>{
  assert.equal(parity.parityProjectionVersion,1);assert.equal(hash(read('parity-projection-v1.mjs')),parity.projectionSha256);
  for(const c of parity.cases)assert.deepEqual(runLegacyCase(c.input),c.expected,c.input.name);
  assert.equal(parity.cases.length,6);
});
await check('Parity projection retains -0 and optional presence; does not quantize or omit state fields',()=>{
  const p={active:true,accum:0,state:{pos:{x:0,y:1,z:2},vel:{x:0,y:0,z:0},spinAxis:{x:0,y:0,z:0},spinOmega:0,quality:1,simTime:0,lastSafePos:{x:0,y:1,z:2},surface:'air',lastImpactSurface:null,lastSurface:null,surfaceChanged:null,stopped:false,bounced:false,holed:false,lipTouched:false,captureRejected:false,recovered:false}};
  assert.deepEqual(Object.keys(p.state).sort(),PARITY_FIELDS.filter(f=>f!=='cupLipResolved').slice().sort());
  const a=projectPhysicsFrame(p);p.state.pos.x=-0;assert.notDeepEqual(projectPhysicsFrame(p),a);p.state.pos.x=0;p.state.cupLipResolved=false;assert.notDeepEqual(projectPhysicsFrame(p),a);
});
await check('ZERO BEHAVIOR CHANGE: 43 gameplay/asset/vendor/old-gate files match Git baseline; protected bytes exact',()=>{
  const baseline=json('fixtures/behavior-baseline-v1.json');
  assert.equal(baseline.baseCommit,'4497fc90827ceda14ddf5d46f10b3ebccff7ec34');
  assert.equal(Object.keys(baseline.files).length,43);
  for(const [path,entry] of Object.entries(baseline.files)){
    const raw=readFileSync(new URL(path,root));
    const canonical=entry.comparison==='raw bytes'?raw:Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n'));
    assert.equal(hash(canonical),entry.sha256,path);
  }
});
console.log(`\nLOFT SEALED SHOT STEP 1: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('SEED INTEGRITY, EXTRACTION PARITY, production DETERMINISM and BOUNDARY SAFETY remain NOT IMPLEMENTED.');
process.exitCode=failed?1:0;
