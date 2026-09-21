// New execution evidence only. Never regenerate accepted Step 1–4 evidence.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertStep5ProductionScope,PRE_STEP5_COMMIT} from './step5-preservation.mjs';
const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const suites=[['atelier',5],['ball',6],['club-assembly',1],['club-forging',3],['club-neck',4],['flight',7],
  ['hinterland',3],['preview',4],['putting',13],['stroke-input',4],['terrain',14],['visual',37],
  ['wedge-sole',4],['sealed-shot',19],['dispersion',8],['purity',12],['parity',8],['seed-integrity',13],['seed-context',7]];
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const before=Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))]));
const details={};
const runs=suites.map(([name,expected])=>{
  const p='gauntlet/run-'+name+'-gauntlet.mjs';
  console.log('RUN '+p);
  const r=spawnSync(process.execPath,[p],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  const passes=(r.stdout?.match(/^PASS\s/gm)||[]).length,pass=r.status===0&&passes===expected;
  for(const label of ['parity','seed-integrity','purity'])if(name===label){
    details[label]=JSON.parse(r.stdout?.match(new RegExp('^INFO '+label+' (.+)$','m'))?.[1]??'null');
  }
  console.log(`${pass?'PASS':'FAIL'} ${p}: ${passes}/${expected}; exit ${r.status}`);
  return {command:'node '+p,sourceSha256:sha(read(p)),expected,passes,exitCode:r.status,pass,
    stdout:r.stdout?.replace(/^INFO (?:parity|seed-integrity|purity) .+\r?\n/gm,'INFO full report stored in details field\n'),
    stderr:r.stderr,error:r.error?.message??null};
});
let scopeError=null;try{assertStep5ProductionScope();}catch(e){scopeError=e.stack;}
const frozenArtifacts=Object.entries(locks).map(([p,expected])=>({path:p,expected,before:before[p],after:sha(read('gauntlet/sealed-shot/'+p))}));
const files=['prototype1/game.js','prototype1/shot/resolveShot.js','prototype1/shot/seedContract.js',
  'gauntlet/sealed-shot/decision-record-002.md','gauntlet/sealed-shot/step5-preservation.mjs',
  'gauntlet/sealed-shot/step5-test-adapter.mjs','gauntlet/sealed-shot/step5-seed-worker.mjs',
  'gauntlet/sealed-shot/step3-preservation.mjs','gauntlet/sealed-shot/step3-purity-worker.mjs',
  'gauntlet/sealed-shot/step4-parity-worker.mjs','gauntlet/sealed-shot/run-step5-evidence.mjs'];
const report={phase:'THE SEALED SHOT Step 5 ONLY',node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  preStep5Commit:PRE_STEP5_COMMIT,existing:152,step5:20,total:172,
  passed:runs.reduce((n,r)=>n+r.passes,0),failedSuites:runs.filter(r=>!r.pass).length,scopeError,
  runtimeMatrix:{Node:'Current execution: '+process.version+' / V8 '+process.versions.v8,
    Chromium:'Historical Step 1 evidence only; no fresh Step 5 browser execution',
    embeddedBrowserSmoke:'UNAVAILABLE: failed to write kernel assets (os error 3); not a gameplay failure',
    WebKit:'PENDING',Gecko:'PENDING',physicalIOSWebView:'PENDING',courseHashOverall:'PENDING full required matrix'},
  frozenArtifacts,files:files.map(p=>({path:p,sha256:sha(read(p))})),details,runs};
try{
  const response=await fetch('http://127.0.0.1:43117/prototype1/');
  report.preview={url:response.url,status:response.status,method:'HTTP GET to existing gauntlet/serve.mjs preview; not browser execution'};
}catch(error){report.preview={status:'unavailable',error:error.message};}
report.pass=report.failedSuites===0&&scopeError===null&&frozenArtifacts.every(x=>x.before===x.expected&&x.after===x.expected);
writeFileSync(new URL('evidence/step5-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.passed}/${report.total}; failed suites ${report.failedSuites}; scope/locks ${report.pass?'PASS':'FAIL'}`);
process.exitCode=report.pass?0:1;
