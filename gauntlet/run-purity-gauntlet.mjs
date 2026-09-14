// Step 3 structural evidence. Does not import or modify the frozen projection.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {restoreStep2Bytes,assertStep3ProductionScope} from './sealed-shot/step3-preservation.mjs';
import {Vector3} from '../prototype1/shot/solverVector.js';
import {Vector3 as VendorVector3} from '../vendor/three.module.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const lf=b=>b.toString().replace(/\r\n/g,'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline='ccb8873f0eeac6fa910dc3f96d71506162fe94a9';
const old=p=>execFileSync('git',['show',baseline+':'+p],{cwd:root,maxBuffer:16*1024*1024});
const run=()=>JSON.parse(execFileSync(process.execPath,['--experimental-vm-modules','gauntlet/sealed-shot/step3-purity-worker.mjs'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']}));
let passed=0,failed=0,report;
const check=(name,fn)=>{try{fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.error('FAIL  '+name+' — '+e.stack);}};
check('PURITY / bare Node: six native shot cases execute to rest in isolated module realms, repeated in fresh process',()=>{
  report=run();assert.equal(report.assertions.bareNode,true);assert.equal(report.cases.length,6);
  assert.deepEqual(run(),report);assert.ok(report.cases.every(c=>c.frames>0));
});
check('PURITY / parsed dependency graph: only five local modules; no Three.js, DOM, canvas or renderer import',()=>{
  assert.equal(report.assertions.closedGraph,true);
  assert.deepEqual(report.graph,['prototype1/physics.js','prototype1/shot/courseField.js','prototype1/shot/resolveShot.js','prototype1/shot/solverVector.js','prototype1/surfaces.js']);
  assert.equal(report.edges.length,4);
});
check('PURITY / forbidden ambient state: browser and Node globals, clocks and random sources unavailable',()=>{
  assert.equal(report.assertions.noAmbientReads,true);assert.deepEqual(report.blockedAmbientReads,[]);
});
check('PURITY / ownership: frozen shot/hole inputs unchanged; per-course caches and arrays do not leak between calls',()=>{
  assert.equal(report.assertions.frozenInputsUnchanged,true);assert.equal(report.assertions.courseInstancesIsolated,true);
  const field=lf(read('prototype1/shot/courseField.js'));
  for(const name of ['GRID_CACHE','GRID_NORMAL_CACHE','CONTACT_SAMPLE'])assert.ok(field.indexOf('const '+name)>field.indexOf('export function createCourseField(ROUND_HOLES){'));
});
check('Native output: launch + every existing fixed step + terminal state; no authoritative rounding or trace schema',()=>{
  assert.equal(report.assertions.rawResults,true);
  const source=lf(read('prototype1/shot/resolveShot.js'));
  assert.match(source,/physics\.step\(SOLVER_FIXED_STEP\)/);
  assert.doesNotMatch(source,/Math\.round|Math\.fround|toFixed\(|decisionTrace\s*:|shotSchemaVersion\s*:/);
});
check('Injected dispersion: explicit scalar bypasses source; omitted raw operand samples once at original branch',()=>{
  assert.equal(report.assertions.injectedSource,true);
  const source=lf(read('prototype1/shot/resolveShot.js'));
  assert.match(source,/dispersion===undefined\?dispersionSource\(\):dispersion/);
  // Whole launch-body preservation is checked below; legacy numerical/reaction
  // comparisons continue to run separately in the existing Step 2 suite.
});
check('Browser delegation: one shared launch body and one GolfPhysics implementation; live incremental stepping retained',()=>{
  const game=lf(read('prototype1/game.js')),resolver=lf(read('prototype1/shot/resolveShot.js'));
  assert.match(game,/import \{launchShotPhysics\} from '\.\/shot\/resolveShot\.js'/);
  assert.match(game,/launchShotPhysics\(physics,\{/);assert.match(resolver,/launchShotPhysics\(physics,\{/);
  assert.doesNotMatch(game,/const pathNoise=|class GolfPhysics|_tryCup\(/);
  assert.match(game,/const ps=physics\.step\(dt\)/);
  assert.match(game,/dispersionSource:\(\)=>Math\.sin\(performance\.now\(\)\*\.012\)/);
  function files(dir){return readdirSync(new URL(dir,root),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):[dir+'/'+e.name]);}
  const js=files('prototype1').filter(p=>p.endsWith('.js'));
  assert.deepEqual(js.filter(p=>/class GolfPhysics\b/.test(lf(read(p)))),['prototype1/physics.js']);
  assert.deepEqual(js.filter(p=>/const pathNoise=/.test(lf(read(p)))),['prototype1/shot/resolveShot.js']);
});
check('Source-faithful relocation: entire solver/field raw bytes and game Git text reconstruct accepted Step 2',()=>{
  for(const p of ['prototype1/game.js','prototype1/physics.js','prototype1/worldV2.js']){
    const restored=restoreStep2Bytes(p,read(p));
    assert.equal(sha(p.endsWith('game.js')?Buffer.from(lf(restored)):restored),sha(old(p)),p);
  }
});
check('Preservation rejects altered timestep, predicates, field math, live clock and caller edits; no tolerance',()=>{
  const probes=[['prototype1/physics.js','const FIXED=1/120','const FIXED=1/119'],
    ['prototype1/physics.js','d<CUP_CAPTURE','d<=CUP_CAPTURE'],
    ['prototype1/worldV2.js','createCourseField(ROUND_HOLES)','createCourseField([])'],
    ['prototype1/game.js','performance.now()*.012','performance.now()*.013'],
    ['prototype1/game.js','physics.step(dt)','physics.step(dt*.99)']];
  for(const [p,from,to] of probes){
    const source=read(p).toString();assert.ok(source.includes(from),'mutation target '+from);
    assert.throws(()=>{const restored=restoreStep2Bytes(p,Buffer.from(source.replace(from,to)));assert.equal(sha(p.endsWith('game.js')?Buffer.from(lf(restored)):restored),sha(old(p)));},p+' '+from);
  }
  for(const [parent,moved,from,to] of [
    ['prototype1/game.js','prototype1/shot/resolveShot.js','? .18 : .75','? .18 : .76'],
    ['prototype1/worldV2.js','prototype1/shot/courseField.js','const FIRST_CUT_WIDTH=2.35','const FIRST_CUT_WIDTH=2.36']]){
    const source=read(moved).toString();assert.ok(source.includes(from));
    assert.throws(()=>restoreStep2Bytes(parent,read(parent),{[moved]:source.replace(from,to)}));
  }
  const clamp='const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));';
  assert.ok(lf(old('prototype1/game.js')).includes(clamp));
  assert.ok(lf(read('prototype1/shot/resolveShot.js')).includes(clamp));
});
check('Vector audit: constructor and all 16 scalar methods retain exact vendored bodies and prototype marker semantics',()=>{
  const methods=Object.getOwnPropertyNames(Vector3.prototype).filter(n=>n!=='isVector3');
  assert.equal(methods.length,17);
  for(const method of methods){
    const own=method==='constructor'?Vector3.toString().slice(Vector3.toString().indexOf('constructor('),Vector3.toString().indexOf('\n\tset(')):Vector3.prototype[method].toString();
    const original=method==='constructor'?VendorVector3.toString().slice(VendorVector3.toString().indexOf('constructor('),VendorVector3.toString().indexOf('\n\tset(')):VendorVector3.prototype[method].toString();
    assert.equal(lf(own).trim(),lf(original).trim(),method);
  }
  new Vector3();new VendorVector3();
  assert.deepEqual(Object.getOwnPropertyDescriptor(Vector3.prototype,'isVector3'),Object.getOwnPropertyDescriptor(VendorVector3.prototype,'isVector3'));
});
check('Protected scope: only three production moves and three new pure modules; all frozen fixture locks unchanged',()=>{
  assertStep3ProductionScope();
  const attributeAddition='# Step 3 relocated field retains the original raw/mixed-newline source bytes.\nprototype1/shot/courseField.js -text whitespace=cr-at-eol\n';
  const attributes=lf(read('.gitattributes'));
  assert.equal(attributes.split(attributeAddition).length-1,1);
  assert.equal(attributes.replace(attributeAddition,''),lf(old('.gitattributes')));
  const field=read('prototype1/shot/courseField.js').toString();
  assert.ok(field.includes('\r\n')&&/(?<!\r)\n/.test(field),'moved field retains mixed original bytes');
  assert.match(execFileSync('git',['check-attr','text','--','prototype1/shot/courseField.js'],{cwd:root,encoding:'utf8'}),/text: unset/);
  const locks=JSON.parse(read('gauntlet/sealed-shot/fixture-lock-v1.json'));
  for(const [path,expected] of Object.entries(locks))assert.equal(sha(read('gauntlet/sealed-shot/'+path)),expected,path);
});
check('Canonical boundary: mismatched course identity and absent injected dispersion refuse; no seed installed',()=>{
  assert.equal(report.assertions.courseIdentityRefusal,true);
  assert.match(lf(read('prototype1/shot/resolveShot.js')),/export function resolveShot\(ShotIntent,Course\)/);
  for(const p of report.graph)assert.doesNotMatch(lf(read(p)),/fnv1a32|fmix32|boundaryWord|seedContractVersion/);
});
if(report)console.log('INFO purity '+JSON.stringify(report));
console.log(`\nLOFT PURITY STEP 3: ${passed}/${passed+failed} PASS; ${failed} FAIL`);
console.log('EXTRACTION PARITY is NOT RUN. WebKit, Gecko and physical iOS WebView remain PENDING.');
process.exitCode=failed?1:0;
