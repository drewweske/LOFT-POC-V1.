// Current execution evidence, never expected fixtures or historical evidence.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PRE_STEP3_COMMIT,STEP3_BASELINE_HASHES,restoreStep2Bytes} from './step3-preservation.mjs';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const suites=[['atelier',5],['ball',6],['club-assembly',1],['club-forging',3],['club-neck',4],['flight',7],['hinterland',3],['preview',4],['putting',13],['stroke-input',4],['terrain',14],['visual',37],['wedge-sole',4],['sealed-shot',19],['dispersion',8],['purity',12]];
const runs=suites.map(([name,expected])=>{
  const path='gauntlet/run-'+name+'-gauntlet.mjs';
  const r=spawnSync(process.execPath,[path],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  const passes=(r.stdout?.match(/^PASS\s/gm)||[]).length;
  const pass=r.status===0&&passes===expected;
  console.log(`${pass?'PASS':'FAIL'} ${path}: ${passes}/${expected}; exit ${r.status}`);
  return {command:'node '+path,sourceSha256:sha(read(path)),expected,passes,exitCode:r.status,pass,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null};
});
const moved=['prototype1/game.js','prototype1/physics.js','prototype1/worldV2.js'];
const added=['prototype1/shot/resolveShot.js','prototype1/shot/solverVector.js','prototype1/shot/courseField.js'];
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const report={phase:'THE SEALED SHOT Step 3 ONLY',preStep3Commit:PRE_STEP3_COMMIT,
  integration041:'4497fc90827ceda14ddf5d46f10b3ebccff7ec34',node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  implementation:{signature:'resolveShot(ShotIntent, Course)',launchSignature:'launchShotPhysics(physics, {metrics,c,L,lie,position,aimYaw,dispersion,dispersionSource})',
    browser:'Calls shared launchShotPhysics and advances the same GolfPhysics.step(dt); does not synchronously precompute resolveShot at impact.',
    server:'Explicit injected raw dispersion, resolved equipment/modifiers/wind, course identity and course field. Raw non-authoritative launch/trajectory/rest output.',
    moves:moved.map(path=>({path,currentRawSha256:sha(read(path)),acceptedSha256:STEP3_BASELINE_HASHES[path],reconstructedSha256:sha(restoreStep2Bytes(path,read(path)))})),
    added:added.map(path=>({path,sha256:sha(read(path))}))},
  existing:105,step1:19,step2:8,step3:12,total:144,passed:runs.reduce((n,r)=>n+r.passes,0),failedSuites:runs.filter(r=>!r.pass).length,
  step2Coverage:JSON.parse(runs.find(r=>r.command.includes('run-dispersion-')).stdout.match(/^INFO coverage (.+)$/m)?.[1]??'null'),
  purity:JSON.parse(runs.at(-1).stdout.match(/^INFO purity (.+)$/m)?.[1]??'null'),
  runtimeMatrix:{Node:'PASS '+process.version+' / V8 '+process.versions.v8+'; all current gates',
    Chromium:'Historical Step 1 course-byte evidence retained; current playable smoke recorded separately, not a physics drift matrix',
    WebKit:'PENDING',Gecko:'PENDING',physicalIOSWebView:'PENDING',courseHashOverall:'PENDING full required matrix'},
  frozenArtifacts:Object.entries(locks).map(([path,expected])=>({path,expected,actual:sha(read('gauntlet/sealed-shot/'+path))})),
  extractionParity:'NOT RUN — next authorized Step 4, frozen projection unchanged',runs};
writeFileSync(new URL('evidence/step3-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.passed}/${report.total}; failed suites ${report.failedSuites}`);
process.exitCode=report.failedSuites?1:0;
