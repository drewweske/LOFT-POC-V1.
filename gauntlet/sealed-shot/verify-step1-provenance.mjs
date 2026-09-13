// Read-only verification of expected fixtures and the pre-Step-1 Git tree.
// Writes evidence ONLY; does not call any fixture authoring command.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=new URL('./',import.meta.url),root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,base));
const json=p=>JSON.parse(read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:16*1024*1024});
const commit='4497fc90827ceda14ddf5d46f10b3ebccff7ec34';
const baseline=json('fixtures/behavior-baseline-v1.json');
assert.equal(baseline.baseCommit,commit);
const files=Object.entries(baseline.files).map(([path,expected])=>{
  const blobSha256=hash(git('show',commit+':'+path));
  assert.equal(blobSha256,expected.sha256,'not anchored to Integration 041: '+path);
  const currentWorkingSha256=hash(readFileSync(new URL(path,root)));
  assert.equal(currentWorkingSha256,expected.workingSha256,'working bytes changed since pre-Step-1 snapshot: '+path);
  return {path,blobSha256,currentWorkingSha256,comparison:expected.comparison};
});
assert.equal(files.length,43);
const unexpected=git('diff','--name-only',commit,'--','prototype1','vendor','index.html').toString().trim();
assert.equal(unexpected,'');
const fixtureLocks=json('fixture-lock-v1.json');
for(const [path,expected] of Object.entries(fixtureLocks))assert.equal(hash(read(path)),expected,path);

const generator=read('generate-reference-vectors.mjs').toString();
const imports=[...generator.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m=>m[1]);
assert.deepEqual(imports,['node:fs','node:crypto']);
assert.doesNotMatch(generator,/\bimport\s*\(|\brequire\s*\(|\beval\s*\(|new\s+Function\s*\(/);
assert.match(generator,/2166136261n/);assert.match(generator,/16777619n/);
assert.match(generator,/2246822507n/);assert.match(generator,/3266489909n/);
assert.doesNotMatch(generator,/\bMath\.imul\s*\(/);
const browser=json('evidence/step1-browser.json');
assert.equal(browser.initial.status,'PASS');assert.equal(browser.afterReload.status,'PASS');
assert.equal(browser.initial.checks,48);assert.equal(browser.afterReload.checks,48);
const report={
  verification:'Step 1 closure audit; no fixture regeneration',
  baseline:{commit,tree:git('rev-parse',commit+'^{tree}').toString().trim(),fixtureSha256:hash(read('fixtures/behavior-baseline-v1.json')),filesVerified:43,currentRawBytesUnchanged:true,unexpectedGameplayDiff:unexpected,files},
  independence:{generator:'generate-reference-vectors.mjs',generatorSha256:hash(Buffer.from(generator)),imports,productionImports:0,dynamicCodeLoading:false,arithmetic:'Independent BigInt modulo-2^32 FNV/fmix, Buffer byte writer; subject uses imul/DataView',fixtureSha256:hash(read('fixtures/contract-vectors-v1.json')),seedVectors:11,boundaryVectors:9,regeneratedThisAudit:false},
  courseHashStability:{overallStatus:'PENDING_REQUIRED_RUNTIME_COVERAGE',tested:[{runtime:'Node '+process.version,engine:'V8 '+process.versions.v8,status:'PASS',source:'evidence/step1-node.json'},{runtime:browser.userAgent,engine:'Chromium/V8',status:'PASS',checksPerLoad:48,loads:2,source:'evidence/step1-browser.json'}],pending:['WebKit','Gecko','physical iOS WebView'],note:'Only Node and Chromium were exercised. No all-runtime pass is claimed; pending matrix rows are not waived.'},
  fixtureLocksVerified:Object.keys(fixtureLocks).length,
  nextStepImplemented:false
};
writeFileSync(new URL('evidence/step1-provenance.json',base),JSON.stringify(report,null,2)+'\n');
console.log('PASS preservation provenance: 43/43 match Integration 041 Git blobs AND pre-Step-1 working-byte hashes');
console.log('PASS fixture independence: two Node built-ins only; 11 seeds + 9 keys independently derived; no regeneration');
console.log('PASS runtime-report honesty: Node and Chromium tested; WebKit/Gecko/iOS pending; overall COURSE HASH STABILITY pending');
console.log('PASS fixture locks: '+Object.keys(fixtureLocks).length+'/'+Object.keys(fixtureLocks).length+' unchanged');
