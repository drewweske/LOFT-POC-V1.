// Step 4: independent accepted legacy implementation, frozen raw-bit projection.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreStep2Bytes} from './sealed-shot/step3-preservation.mjs';
import {assertStep5ProductionScope} from './sealed-shot/step5-preservation.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:16*1024*1024});
const legacyCommit='ccb8873f0eeac6fa910dc3f96d71506162fe94a9';
const extractedCheckpoint='bfbb386876c314d8b755f5ddd76efb2d16d23238';
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const before=Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))]));
let report,passed=0,failed=0;
const check=(name,fn)=>{try{fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.error('FAIL  '+name+' — '+e.stack);}};
check('EXTRACTION PARITY: isolated Step 2 oracle vs actual resolveShot, every frozen projected frame',()=>{
  assert.deepEqual(before,locks,'all frozen artifacts before execution');
  report=JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','gauntlet/sealed-shot/step4-parity-worker.mjs'],
    {cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']}));
  assert.equal(report.mismatchCount,0);assert.equal(report.assertions.allProjectedFramesEqual,true);
});
check('Independent oracle: every legacy module byte is from accepted ccb8873; separate closed module realms',()=>{
  assert.equal(report.legacy.commit,legacyCommit);assert.equal(report.assertions.oracleIsolated,true);
  const oracle=read('gauntlet/sealed-shot/step4-legacy-oracle.mjs').toString();
  assert.doesNotMatch(oracle,/from ['"](?:\.\.\/)+prototype1|readFileSync|import\(/);
  assert.ok(report.legacy.graph.includes('vendor/three.module.js'));
  assert.ok(!report.legacy.graph.some(p=>p.includes('/shot/')));
  for(const {path,sha256} of report.legacy.sources)assert.equal(sha(git('show',legacyCommit+':'+path)),sha256,path);
});
check('Original frozen corpus: six independent-reference and extracted-solver cases, 3176 steps, expectations untouched',()=>{
  assert.equal(report.corpus.baseCases.length,6);
  assert.equal(report.corpus.baseCases.reduce((n,c)=>n+c.frames,0),3176);
  assert.equal(report.assertions.frozenDirectCases,true);
});
check('Full pipeline: 210 frozen-input cases, five levels, seven exact scalars; identical inputs/dispersion',()=>{
  assert.equal(report.corpus.fullPipelineCases,210);assert.equal(report.corpus.scalarBits.length,7);
  assert.deepEqual(report.corpus.levels,[1,10,25,50,75]);
  assert.deepEqual(report.corpus.families,['full-swing','iron','wedge','bunker','putt','lip-putt']);
  assert.equal(report.assertions.inputsIdentical,true);assert.deepEqual(report.blockedAmbientReads,[]);
});
check('Course-cache ownership / former ambient state: reverse interleaving repeats every shot against independent legacy',()=>{
  assert.equal(report.totalPairedRuns,420);assert.equal(report.assertions.warmReverseEqual,true);
  for(const first of report.runs.filter(r=>r.pass==='initial')){
    const again=report.runs.find(r=>r.id===first.id&&r.pass==='warm-reverse');
    assert.equal(again.inputSha256,first.inputSha256);assert.equal(again.projectionSha256,first.projectionSha256);
  }
});
check('Returned launch/trajectory/rest snapshots: unchanged projection, actual observed active/accum, no inferred metadata',()=>{
  assert.equal(report.assertions.returnedSnapshotsEqual,true);
  assert.equal(report.returnedSnapshotComparisons,report.totalPairedFrames+report.totalPairedRuns*2);
  assert.ok(report.outcomes.holed>0);assert.ok(report.outcomes.bounced>0);assert.ok(report.outcomes.surfaceTransitions>0);
});
check('Protected source audit: exact Step 5 seed wiring only; old launch/solver/field invert byte-exactly',()=>{
  assert.equal(report.extracted.checkpoint,extractedCheckpoint);
  for(const {path,sha256} of report.extracted.sources)assert.equal(sha(read(path)),sha256);
  assertStep5ProductionScope();
  assert.equal(report.testAdapter.replacementCount,1);
  for(const p of ['prototype1/game.js','prototype1/physics.js','prototype1/worldV2.js']){
    const restored=restoreStep2Bytes(p,read(p));
    assert.equal(sha(p.endsWith('game.js')?Buffer.from(restored.toString().replace(/\r\n/g,'\n')):restored),sha(git('show',legacyCommit+':'+p)),p);
  }
  assert.deepEqual(report.extractionFixes,[]);
});
check('Frozen projection v1/locks unchanged before and after; comparator rejects six deliberate test corruptions',()=>{
  assert.equal(report.projection.version,1);
  assert.equal(report.projection.beforeSha256,'11adea692e88a1636833e00688ceff2eda1d64c7e19904e2d06771975ceee906');
  assert.equal(report.projection.afterSha256,report.projection.beforeSha256);
  assert.equal(report.comparatorMutationRejections,6);
  assert.deepEqual(Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))])),before);
});
if(report)console.log('INFO parity '+JSON.stringify(report));
console.log(`\nLOFT EXTRACTION PARITY STEP 4: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('Historical injected-dispersion parity retained via explicit test adapter; normal seeded production tested separately. WebKit, Gecko and physical iOS WebView remain PENDING.');
process.exitCode=failed?1:0;
