// Step 5 only: production SeedContract v1 + creator-approved signed mapping.
// Read independent frozen vectors; never invoke a fixture generator.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {seedBytes,fnv1a32,fmix32,deriveShotSeed,dispersionFromShotSeed} from '../prototype1/shot/seedContract.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const source=p=>read(p).toString().replace(/\r\n/g,'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const compact=s=>s.replace(/\s/g,'');
const vectorsPath='gauntlet/sealed-shot/fixtures/contract-vectors-v1.json';
const vectors=JSON.parse(read(vectorsPath));
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const before=Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))]));
const mappingVectors=[[0x00000000,-1],[0x40000000,-.5],[0x80000000,0],[0xc0000000,.5],[0xffffffff,.9999999995343387]];
const run=()=>JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','gauntlet/sealed-shot/step5-seed-worker.mjs'],
  {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']}));
let passed=0,failed=0,report;
const check=(name,fn)=>{try{fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.error('FAIL  '+name+' — '+e.stack);}};
check('SEED INTEGRITY: all 11 independent Step 1 byte/FNV/fmix/shotSeed vectors match production exactly',()=>{
  assert.deepEqual(before,locks,'frozen fixtures before execution');
  assert.equal(vectors.seedContractVersion,1);assert.equal(vectors.seedVectors.length,11);
  for(const row of vectors.seedVectors){
    const bytes=seedBytes(row.input);
    assert.equal(Buffer.from(bytes).toString('hex'),row.bytes);
    assert.equal(fnv1a32(bytes),row.fnv1a32);
    assert.equal(fmix32(row.fnv1a32),row.shotSeed);
    assert.equal(deriveShotSeed(row.input),row.shotSeed);
  }
});
check('Decision Record 002: all five signed edge vectors exact, including positive zero and open upper endpoint',()=>{
  for(const [seed,value] of mappingVectors)assert.equal(dispersionFromShotSeed(seed),value,'0x'+seed.toString(16).padStart(8,'0'));
  assert.equal(Object.is(dispersionFromShotSeed(0x80000000),0),true);
  assert.equal(dispersionFromShotSeed(0xffffffff),1-1/2147483648);
  assert.equal(dispersionFromShotSeed(1)-dispersionFromShotSeed(0),1/2147483648);
  const mapping=dispersionFromShotSeed.toString();
  assert.match(mapping,/const u = \(shotSeed >>> 0\) \/ 4294967296;/);
  assert.match(mapping,/const dispersion = 2 \* u - 1;/);
});
check('Permitted integer core: exact frozen FNV-1a/fmix32 operations/order; signed affine mapping is separate',()=>{
  // A fail-closed source whitelist for the two arithmetic functions. UTF-8 byte
  // encoding/length bookkeeping are separate from the frozen hash arithmetic.
  assert.equal(compact(fnv1a32.toString()),compact(`function fnv1a32(bytes){
    let h=0x811c9dc5;for(const b of bytes)h=Math.imul(h^b,0x01000193)>>>0;return h>>>0;
  }`));
  assert.equal(compact(fmix32.toString()),compact(`function fmix32(h){
    h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;
    h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0;
  }`));
  assert.equal(compact(deriveShotSeed.toString()),'functionderiveShotSeed(context){returnfmix32(fnv1a32(seedBytes(context)));}');
});
check('Raw UTF-8 contract: independent Unicode encoding boundaries, no normalization or surrogate replacement',()=>{
  const scalars=[0,0x7f,0x80,0x7ff,0x800,0xd7ff,0xe000,0xffff,0x10000,0x10ffff];
  for(const scalar of scalars){
    const value=String.fromCodePoint(scalar),round=Buffer.from(value,'utf8'),player=Buffer.from('P\0🏌','utf8');
    const expected=Buffer.alloc(16+round.length+player.length);
    let offset=0;expected.writeUInt32LE(round.length,offset);offset+=4;round.copy(expected,offset);offset+=round.length;
    expected.writeUInt32LE(player.length,offset);offset+=4;player.copy(expected,offset);offset+=player.length;
    expected.writeUInt32LE(0x80000000,offset);expected.writeUInt32LE(0xffffffff,offset+4);
    assert.equal(Buffer.from(seedBytes({roundId:value,playerId:'P\0🏌',holeIndex:0x80000000,strokeIndex:0xffffffff})).toString('hex'),expected.toString('hex'));
  }
  assert.notEqual(deriveShotSeed(vectors.seedVectors[9].input),deriveShotSeed(vectors.seedVectors[10].input));
  for(const bad of ['\ud800','\udfff','A\ud800B','\ud800\ud800','\udc00\ud800']){
    assert.throws(()=>seedBytes({roundId:bad,playerId:'p',holeIndex:0,strokeIndex:0}),/surrogate/);
    assert.throws(()=>seedBytes({roundId:'r',playerId:bad,holeIndex:0,strokeIndex:0}),/surrogate/);
  }
});
check('Input rejection: no coercion of identities, indices or authoritative uint32 shotSeed',()=>{
  const base={roundId:'r',playerId:'p',holeIndex:0,strokeIndex:0};
  for(const value of [undefined,null,-1,1.5,4294967296,NaN,Infinity,-Infinity,'0',false,{},[]]){
    assert.throws(()=>dispersionFromShotSeed(value),/uint32/);
    for(const key of ['holeIndex','strokeIndex'])assert.throws(()=>deriveShotSeed({...base,[key]:value}),/uint32/);
  }
  for(const value of [undefined,null,1,{},[]])for(const key of ['roundId','playerId']){
    assert.throws(()=>deriveShotSeed({...base,[key]:value}),/string/);
  }
});
check('Context determinism: 11000 repeated derivations retain exactly the frozen seed and signed scalar',()=>{
  for(let i=0;i<1000;i++)for(const row of vectors.seedVectors){
    const seed=deriveShotSeed(Object.freeze({...row.input}));
    assert.equal(seed,row.shotSeed);assert.equal(dispersionFromShotSeed(seed),2*row.unitFloat-1);
  }
});
check('Tuple sensitivity: isolated round/player/hole/stroke changes match their independent frozen vectors',()=>{
  const base=vectors.seedVectors[3];
  for(const [key,index] of [['strokeIndex',4],['holeIndex',5],['roundId',6],['playerId',7]]){
    const changed=vectors.seedVectors[index];
    assert.deepEqual(Object.keys(base.input).filter(k=>base.input[k]!==changed.input[k]),[key]);
    assert.notEqual(deriveShotSeed(base.input),deriveShotSeed(changed.input));
    assert.equal(deriveShotSeed(changed.input),changed.shotSeed);
  }
  // This is evidence for these independent vectors, not a collision-free claim.
});
check('Fixture independence: production imports no test code; standalone generator imports no production implementation',()=>{
  const production=source('prototype1/shot/seedContract.js').replace(/\/\/[^\n]*/g,'');
  assert.doesNotMatch(production,/\bimport\b|\brequire\s*\(|gauntlet|fixture|generate-reference/i);
  const generator=source('gauntlet/sealed-shot/generate-reference-vectors.mjs').replace(/\/\/[^\n]*/g,'');
  for(const match of generator.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g))assert.ok(match[1].startsWith('node:'),match[1]);
  assert.doesNotMatch(generator,/\bimport\s*\(|prototype1|seedContract\.js|contracts-v1\.mjs/);
});
check('Production Node execution: closed six-module graph, 30 seeded cases, blocked clocks/random/browser reads',()=>{
  report=run();
  assert.equal(report.assertions.bareNode,true);assert.equal(report.assertions.closedGraph,true);
  assert.equal(report.assertions.noEntropy,true);assert.deepEqual(report.blockedAmbientReads,[]);
  assert.equal(report.seedVectorCount,11);assert.equal(report.seedCases.length,30);
  assert.equal(new Set(report.seedCases.map(c=>c.name)).size,6);
  assert.deepEqual(report.graph,['prototype1/physics.js','prototype1/shot/courseField.js','prototype1/shot/resolveShot.js',
    'prototype1/shot/seedContract.js','prototype1/shot/solverVector.js','prototype1/surfaces.js']);
  assert.equal(report.productionExecutions,120);
});
check('Fresh process + reverse cache-order repeats: every native launch/trajectory/rest bit identical',()=>{
  assert.deepEqual(run(),report);
  assert.equal(report.assertions.warmReverseRepeat,true);assert.equal(report.assertions.frozenInputsUnchanged,true);
});
check('Single authority: raw dispersion is never read; supplied scalar cannot override seed, missing/invalid seeds reject',()=>{
  assert.equal(report.assertions.rawDispersionNotRead,true);assert.equal(report.assertions.rawOverrideIgnored,true);
  assert.equal(report.assertions.missingInvalidSeedRejected,true);assert.equal(report.invalidSeedRejections,24);
  const resolver=source('prototype1/shot/resolveShot.js');
  assert.doesNotMatch(resolver,/ShotIntent\.dispersion\b|deriveShotSeed|seedBytes|fmix32|fnv1a32/);
  assert.match(resolver,/export function resolveShot\(ShotIntent,Course\)/);
  assert.match(resolver,/dispersionSource:\(\)=>dispersionFromShotSeed\(ShotIntent\.shotSeed\)/);
});
check('Shared browser/Node seed code: same module path and mapper, no production clock fallback; injected launch seam retained',()=>{
  const game=source('prototype1/game.js'),resolver=source('prototype1/shot/resolveShot.js');
  assert.match(game,/import \{deriveShotSeed,dispersionFromShotSeed\} from '\.\/shot\/seedContract\.js'/);
  assert.match(resolver,/import \{dispersionFromShotSeed\} from '\.\/seedContract\.js'/);
  assert.match(game,/dispersionSource:\(\)=>dispersionFromShotSeed\(shotIntent\.shotSeed\)/);
  assert.doesNotMatch(game,/dispersionSource:[^\n]*(?:performance|Date|random)/);
  assert.match(resolver,/\(1-L\.form\)\*\(dispersion===undefined\?dispersionSource\(\):dispersion\)\*\(c\.head==='putter' \? \.18 : \.75\)/);
  assert.equal(report.assertions.mappedScalarLaunchIdentical,true);assert.equal(report.injectedComparisons,30);
  for(const {path,sha256} of report.sources)assert.equal(sha(read(path)),sha256,path);
});
check('Seed module has no mutable outer state or entropy and the frozen Step 1 vectors remain byte-identical',()=>{
  const module=source('prototype1/shot/seedContract.js').replace(/\/\/[^\n]*/g,'');
  let outside='',depth=0;
  for(const line of module.split('\n')){
    if(depth===0&&!/^\s*(?:export )?function\b/.test(line))outside+=line;
    for(const c of line){if(c==='{')depth++;else if(c==='}')depth--;}
  }
  assert.equal(outside.trim(),'','Only function declarations at module scope');
  assert.doesNotMatch(module,/performance|Date|Math\.random|crypto|localStorage|sessionStorage|Math\.sin|\bPRNG\b/);
  assert.deepEqual(Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))])),before);
});
if(report)console.log('INFO seed-integrity '+JSON.stringify({mappingVectors,fixtureSha256:sha(read(vectorsPath)),...report}));
console.log(`\nLOFT SEED INTEGRITY STEP 5: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('Node/V8 evidence only. WebKit, Gecko, physical iOS WebView and full COURSE HASH STABILITY matrix remain PENDING. STOP before Step 6.');
process.exitCode=failed?1:0;
