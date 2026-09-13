// Explicit baseline authoring command only. Never run automatically by a gate.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runLegacyCase} from './legacy-parity-corpus.mjs';
const base=new URL('./',import.meta.url),root=new URL('../../',import.meta.url);
const fixtures=[
  {name:'full-swing',method:'launch',club:'driver',position:[.46,0],cup:[2.50,-156.36],wind:[3.13,0,0],launch:{power:.8,path:1.25,form:.7,aimYaw:.012,strike:.87,release:.88,lie:'tee'}},
  {name:'iron',method:'launch',club:'iron7',position:[.46,0],cup:[2.50,-156.36],wind:[3.13,0,0],launch:{power:1,path:-.7,form:1,aimYaw:.014,strike:.96,release:1,lie:'fairway'}},
  {name:'wedge',method:'launch',club:'pw',position:[2,-100],cup:[2.50,-156.36],wind:[0,0,0],launch:{power:.55,path:.5,form:.38,aimYaw:0,strike:.8,release:.75,lie:'rough'}},
  {name:'bunker',method:'launch',club:'sw',position:[-13,-125],cup:[2.50,-156.36],wind:[3.13,0,0],launch:{power:.8,path:1.5,form:.7,aimYaw:.3,strike:.88,release:.8,lie:'sand'}},
  {name:'putt',method:'putt',club:'putter',position:[2.50,-153.36],cup:[2.50,-156.36],wind:[0,0,0],launch:{power:.3,paceFeet:10.4,path:0,aimYaw:0,strike:.95}},
  {name:'lip-putt',method:'putt',club:'putter',position:[2.50,-156.295],cup:[2.50,-156.36],wind:[0,0,0],launch:{power:.01,paceFeet:.15,path:0,aimYaw:0,strike:1}}
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const walk=dir=>readdirSync(new URL(dir,root),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+e.name+'/'):[dir+e.name]);
const paths=[...walk('prototype1/'),...walk('vendor/'),'index.html',...readdirSync(new URL('gauntlet/',root)).filter(p=>/^run-.*-gauntlet.mjs$/.test(p)&&p!=='run-sealed-shot-gauntlet.mjs').map(p=>'gauntlet/'+p)].sort();
const rawProtected=['physics.js','worldV2.js','characterRig.js','clubVisual.js','clubAssembly.js','ballVisual.js'];
const baseline=Object.fromEntries(paths.map(p=>{
  const raw=readFileSync(new URL(p,root));
  const byteExact=p.includes('/assets/')||rawProtected.some(name=>p==='prototype1/'+name);
  const canonical=byteExact?raw:Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n'));
  const gitBytes=execFileSync('git',['show','4497fc90827ceda14ddf5d46f10b3ebccff7ec34:'+p],{maxBuffer:16*1024*1024});
  if(hash(canonical)!==hash(gitBytes))throw Error('Baseline differs from committed game: '+p);
  return [p,{workingSha256:hash(raw),sha256:hash(canonical),comparison:byteExact?'raw bytes':'Git text LF (CRLF only normalized)'}];
}));
writeFileSync(new URL('fixtures/behavior-baseline-v1.json',base),JSON.stringify({baseCommit:'4497fc90827ceda14ddf5d46f10b3ebccff7ec34',files:baseline},null,2)+'\n');
const cases=fixtures.map(input=>({input,expected:runLegacyCase(input)}));
const projectionSha256=hash(readFileSync(new URL('parity-projection-v1.mjs',base)));
writeFileSync(new URL('fixtures/parity-v1.json',base),JSON.stringify({parityProjectionVersion:1,projectionSha256,comparison:'raw IEEE-754 little-endian bits; negative zero preserved; no quantization; launch + every 1/120 frame + terminal; optional-field presence explicit',runtime:process.version,cases},null,2)+'\n');
console.log(JSON.stringify({projectionSha256,protectedFiles:paths.length,cases:cases.map(c=>({name:c.input.name,frames:c.expected.frames,sha256:c.expected.trajectorySha256}))},null,2));
