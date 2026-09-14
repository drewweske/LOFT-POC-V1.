// TEST ONLY. All executable legacy source comes from immutable Git objects.
// No working-tree production module is imported or used as a legacy fallback.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';

export const LEGACY_COMMIT='ccb8873f0eeac6fa910dc3f96d71506162fe94a9';
const root=new URL('../../',import.meta.url);
const allowed=new Set(['vendor/three.module.js','prototype1/physics.js','prototype1/surfaces.js',
  'prototype1/worldV2.js','prototype1/round.js','prototype1/coastalHinterland.js','prototype1/equipment.js']);
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=p=>execFileSync('git',['show',LEGACY_COMMIT+':'+p],{cwd:root,maxBuffer:16*1024*1024});
export async function createLegacyOracle(){
  const sources=new Map(),modules=new Map(),edges=[];
  const source=p=>{if(!sources.has(p))sources.set(p,git(p));return sources.get(p).toString('utf8');};
  const context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}});
  // Legacy Three's top-level feature probes may see undefined browser globals;
  // no DOM/render objects are supplied, and injected execution cannot read time.
  vm.runInContext("globalThis.performance={now(){throw Error('Legacy clock read with injected scalar')}};",context);
  function load(p){
    assert.ok(allowed.has(p),'Legacy dependency outside immutable allowlist: '+p);
    if(!modules.has(p))modules.set(p,new vm.SourceTextModule(source(p),{context,identifier:p,
      importModuleDynamically(){throw Error('Legacy dynamic import forbidden');}}));
    return modules.get(p);
  }
  const link=async mod=>{
    if(mod.status==='unlinked')await mod.link((s,parent)=>{
      assert.match(s,/^\.\.?\//);
      const p=path.posix.normalize(path.posix.join(path.posix.dirname(parent.identifier),s));
      edges.push([parent.identifier,p]);return load(p);
    });
    if(mod.status!=='evaluated')await mod.evaluate();
  };
  for(const p of ['prototype1/physics.js','prototype1/worldV2.js','prototype1/equipment.js'])await link(load(p));
  // Vendored Three allocates Object3D UUIDs at module initialization. Let the
  // unmodified library initialize normally; forbid random reads during shots.
  vm.runInContext("Math.random=()=>{throw Error('Legacy ambient random read during shot')};",context);
  assert.deepEqual([...modules.keys()].sort(),[...allowed].sort());
  const field=modules.get('prototype1/worldV2.js').namespace;
  const {GolfPhysics}=modules.get('prototype1/physics.js').namespace;
  const THREE=modules.get('vendor/three.module.js').namespace;
  const equipment=modules.get('prototype1/equipment.js').namespace;
  const game=source('prototype1/game.js');
  // Exact original prefix ends AFTER solver dispatch and BEFORE presentation.
  // No launch expression is copied/retyped, replaced or normalized. The Step 2
  // function already accepts dispersion; even its legacy fallback stays intact.
  const start=game.indexOf('function launchShot(metrics,dispersion){');
  const end=game.indexOf('  state.shot={',start);
  assert.ok(start>=0&&end>start);
  const launchPrefix=game.slice(start,end);
  assert.equal(game.split('function launchShot(metrics,dispersion){').length-1,1);
  assert.match(launchPrefix,/dispersion===undefined\?Math\.sin\(performance\.now\(\)\*\.012\):dispersion/);
  const clamp=game.match(/const clamp=\(v,a,b\)=>Math\.max\(a,Math\.min\(b,v\)\);/)[0];
  const wrappers=game.slice(game.indexOf('function surfaceAt(x,z){'),game.indexOf('function playingContactY(x,z){'));
  const setupStart=game.indexOf('const physics=new GolfPhysics({');
  const setupEnd=game.indexOf('physics.setCup(pin);',setupStart)+'physics.setCup(pin);'.length;
  const setup=game.slice(setupStart,setupEnd);
  assert.ok(setupStart>=0&&setupEnd>setupStart);
  Object.assign(context,{THREE,GolfPhysics,...Object.fromEntries(Object.entries(field))});
  const launch=new vm.Script(clamp+'\n'+wrappers+'\n'+launchPrefix+'}\nlaunchShot;').runInContext(context);
  // Constructor bindings are also executed directly from accepted game source.
  const makePhysics=new vm.Script('(function(){'+setup+'return physics;})').runInContext(context);
  const vector=p=>new THREE.Vector3(p.x,p.y,p.z);
  return {
    field,equipment,THREE,GolfPhysics,
    holes:modules.get('prototype1/round.js').namespace.ROUND_HOLES,
    run(intent,level){
      const hole=this.holes[intent.holeIndex];
      const position=vector(intent.ballRestPosition);
      Object.assign(context,{wind:vector(intent.environmentState.wind),
        pin:new THREE.Vector3(hole.pin[0],field.terrainHeight(hole.pin[0],hole.pin[1]),hole.pin[1]),
        state:{phase:'ready',level,currentLie:intent.lieSurface},LEVELS:{[level]:intent.playerState},
        club:()=>intent.club,aimYaw:()=>intent.aimYaw,ballGroup:{position},TEE:position});
      const physics=makePhysics();context.physics=physics;
      launch(intent.metrics,intent.dispersion);
      return physics;
    },
    provenance(){return {commit:LEGACY_COMMIT,reader:'git show <immutable commit>:<allowlisted path>; no filesystem production imports',
      graph:[...modules.keys()].sort(),edges,sources:[...sources].map(([p,b])=>({path:p,sha256:hash(b)})),
      launchPrefixSha256:hash(launchPrefix),setupSha256:hash(setup),wrapperSha256:hash(wrappers)};}
  };
}
