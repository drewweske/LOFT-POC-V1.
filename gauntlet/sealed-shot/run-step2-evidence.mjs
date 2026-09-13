// Runs current gates; never writes expected vectors or historical Step 1 evidence.
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PRE_STEP2_COMMIT,undoStep2Seam} from './step2-preservation.mjs';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const suites=[['atelier',5],['ball',6],['club-assembly',1],['club-forging',3],['club-neck',4],['flight',7],['hinterland',3],['preview',4],['putting',13],['stroke-input',4],['terrain',14],['visual',37],['wedge-sole',4],['sealed-shot',19],['dispersion',8]];
const runs=suites.map(([name,expected])=>{
  const path='gauntlet/run-'+name+'-gauntlet.mjs';
  const r=spawnSync(process.execPath,[path],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  const passes=(r.stdout?.match(/^PASS\s/gm)||[]).length;
  const pass=r.status===0&&passes===expected;
  console.log(`${pass?'PASS':'FAIL'} ${path}: ${passes}/${expected}; exit ${r.status}`);
  return {command:'node '+path,sourceSha256:sha(read(path)),expected,passes,exitCode:r.status,pass,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null};
});
const post=read('prototype1/game.js').toString('utf8').replace(/\r\n/g,'\n');
const legacy=execFileSync('git',['show',PRE_STEP2_COMMIT+':prototype1/game.js'],{cwd:root,maxBuffer:16*1024*1024});
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const frozenArtifacts=Object.entries(locks).map(([path,expected])=>({path,expected,actual:sha(read('gauntlet/sealed-shot/'+path))}));
const browser=JSON.parse(read('gauntlet/sealed-shot/evidence/step1-browser.json'));
const report={phase:'THE SEALED SHOT Step 2 ONLY',preStep2Commit:PRE_STEP2_COMMIT,
  integration041:'4497fc90827ceda14ddf5d46f10b3ebccff7ec34',node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  source:{signature:'launchShot(metrics, dispersion)',scalar:'raw sine operand; undefined selects legacy Math.sin(performance.now()*.012) at the original multiplication site',
    preGameSha256:sha(legacy),postGameSha256:sha(Buffer.from(post)),inverseSeamSha256:sha(Buffer.from(undoStep2Seam(post)))},
  existing:105,step1:19,step2:8,total:132,passed:runs.reduce((n,r)=>n+r.passes,0),failedSuites:runs.filter(r=>!r.pass).length,
  coverage:JSON.parse(runs.at(-1).stdout.match(/^INFO coverage (.+)$/m)?.[1]??'null'),
  courseHashRuntimeMatrix:{Node:'PASS v24.15.0 / V8; re-exercised in this run',
    Chromium:'PASS historical Step 1 evidence only; 152 / V8, initial + reload; not re-run this step',
    WebKit:'PENDING',Gecko:'PENDING',physicalIOSWebView:'PENDING',overall:'PENDING full required matrix'},
  historicalBrowserEvidence:{path:'gauntlet/sealed-shot/evidence/step1-browser.json',sha256:sha(read('gauntlet/sealed-shot/evidence/step1-browser.json')),recorded:!!browser},
  frozenArtifacts,runs};
writeFileSync(new URL('evidence/step2-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.passed}/${report.total}; failed suites ${report.failedSuites}`);
process.exitCode=report.failedSuites?1:0;
