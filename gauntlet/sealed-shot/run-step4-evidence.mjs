// Writes current execution evidence only. Never regenerates reference fixtures.
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const suites=[['atelier',5],['ball',6],['club-assembly',1],['club-forging',3],['club-neck',4],['flight',7],['hinterland',3],['preview',4],['putting',13],['stroke-input',4],['terrain',14],['visual',37],['wedge-sole',4],['sealed-shot',19],['dispersion',8],['purity',12],['parity',8]];
const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
const before=Object.fromEntries(Object.keys(locks).map(p=>[p,sha(read('gauntlet/sealed-shot/'+p))]));
let parity;
const runs=suites.map(([name,expected])=>{
  const p='gauntlet/run-'+name+'-gauntlet.mjs';
  const r=spawnSync(process.execPath,[p],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  const passes=(r.stdout?.match(/^PASS\s/gm)||[]).length;
  const pass=r.status===0&&passes===expected;
  if(name==='parity')parity=JSON.parse(r.stdout?.match(/^INFO parity (.+)$/m)?.[1]??'null');
  console.log(`${pass?'PASS':'FAIL'} ${p}: ${passes}/${expected}; exit ${r.status}`);
  return {command:'node '+p,sourceSha256:sha(read(p)),expected,passes,exitCode:r.status,pass,
    stdout:name==='parity'?r.stdout?.replace(/^INFO parity .+\r?\n/m,'INFO parity: full report stored in top-level parity field\n'):r.stdout,
    stderr:r.stderr,error:r.error?.message??null};
});
const scope=execFileSync('git',['diff','bfbb386876c314d8b755f5ddd76efb2d16d23238','--','prototype1','vendor','.gitattributes'],{cwd:root,encoding:'utf8'});
const report={phase:'THE SEALED SHOT Step 4 ONLY',node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,
  legacyCommit:'ccb8873f0eeac6fa910dc3f96d71506162fe94a9',extractedCheckpoint:'bfbb386876c314d8b755f5ddd76efb2d16d23238',
  existing:144,step4:8,total:152,passed:runs.reduce((n,r)=>n+r.passes,0),failedSuites:runs.filter(r=>!r.pass).length,
  protectedScopeDiff:scope,parity,runtimeMatrix:{Node:'PASS only if current runs pass: '+process.version+' / V8 '+process.versions.v8,
    Chromium:'Historical Step 1 course-byte/reload evidence only; not a Step 4 run',WebKit:'PENDING',Gecko:'PENDING',physicalIOSWebView:'PENDING',courseHashOverall:'PENDING full required matrix'},
  frozenArtifacts:Object.entries(locks).map(([p,expected])=>({path:p,expected,before:before[p],after:sha(read('gauntlet/sealed-shot/'+p))})),
  files:['gauntlet/run-parity-gauntlet.mjs','gauntlet/sealed-shot/step4-inputs-v1.json','gauntlet/sealed-shot/step4-legacy-oracle.mjs',
    'gauntlet/sealed-shot/step4-parity-worker.mjs','gauntlet/sealed-shot/run-step4-evidence.mjs'].map(p=>({path:p,sha256:sha(read(p))})),runs};
const success=report.failedSuites===0&&scope===''&&report.frozenArtifacts.every(x=>x.expected===x.before&&x.expected===x.after);
report.pass=success;
writeFileSync(new URL('evidence/step4-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.passed}/${report.total}; failed suites ${report.failedSuites}; scope/locks ${success?'PASS':'FAIL'}`);
process.exitCode=success?0:1;
