// Executes tests only. Never generates expected vectors or parity baselines.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const suites=[['atelier',5],['ball',6],['club-assembly',1],['club-forging',3],['club-neck',4],['flight',7],['hinterland',3],['preview',4],['putting',13],['stroke-input',4],['terrain',14],['visual',37],['wedge-sole',4],['sealed-shot',19]];
const runs=suites.map(([name,expected])=>{
  const path='gauntlet/run-'+name+'-gauntlet.mjs';
  const r=spawnSync(process.execPath,[path],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
  const passes=(r.stdout?.match(/^PASS\s/gm)||[]).length;
  const pass=r.status===0&&passes===expected;
  console.log(`${pass?'PASS':'FAIL'} ${path}: ${passes}/${expected}; exit ${r.status}`);
  return {command:'node '+path,sourceSha256:createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex'),expected,passes,exitCode:r.status,pass,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null};
});
const report={phase:'THE SEALED SHOT Step 1',baseCommit:'4497fc90827ceda14ddf5d46f10b3ebccff7ec34',node:process.version,platform:process.platform,arch:process.arch,existing:105,step1:19,total:124,passed:runs.reduce((n,r)=>n+r.passes,0),failed:runs.filter(r=>!r.pass).length,runs};
mkdirSync(new URL('evidence/',import.meta.url),{recursive:true});
writeFileSync(new URL('evidence/step1-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.passed}/${report.total}; failed suites ${report.failed}`);
process.exitCode=report.failed?1:0;
