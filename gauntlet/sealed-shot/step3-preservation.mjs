// Test-only exact inverse of Step 3 extraction. No fixture is regenerated and
// no whole file is replaced with baseline text: moved code is read from today's
// implementation, inverted structurally, then checked against accepted Step 2.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const PRE_STEP3_COMMIT='ccb8873f0eeac6fa910dc3f96d71506162fe94a9';
export const STEP3_BASELINE_HASHES=Object.freeze({
  'prototype1/game.js':'c1254918ae22ab6b56c3f7c5e83b2fa3388c633522148740c3fb3f8b8cf1f7be',
  'prototype1/physics.js':'3f3a446663b9fbd4bafd83bb4b93302f02f4cb7ec6d2d3d0f16712a01a9a7c76',
  'prototype1/worldV2.js':'4cefe0b45a267ca0266a1e4aaeadaeecd64f1eabdedd86ac84551c892eabb531',
  'gauntlet/run-flight-gauntlet.mjs':'39fccb7096852f40696ff8fd2e3982f07f80d7c0a94217890db26a0f2ea0eab9'
});
export const STEP3_NEW_PRODUCTION_FILES=Object.freeze([
  'prototype1/shot/courseField.js','prototype1/shot/resolveShot.js','prototype1/shot/solverVector.js'
]);
const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const lf=text=>text.replace(/\r\n/g,'\n');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const once=(source,after,before,label)=>{
  assert.equal(source.split(after).length-1,1,label+' must occur exactly once');
  return source.replace(after,before);
};
const publicNames='SURFACE_LIFT,BUNKERS,WATER_LEVEL,fairwayProfile,terrainHeight,sampleTerrain,terrainContactY,sweepTerrainSegment,greenSurfaceHeight,waterAt,courseSurfaceAt';
const rendererNames='FIRST_CUT_WIDTH,fairwaySignedDistance,valueNoise,fbm,bunkerMetric,TERRAIN_GRID,GRID_DX,GRID_DZ,GRID_W,gridSample,gridNormal,bunkerAt,greenMetrics,coastEdge,teeMetricAt';
const fieldHeader='// Native Coastal Ridge field, moved without numerical edits. Cache/scratch state\n// belongs to this explicit course instance, never a renderer or global game.\nexport function createCourseField(ROUND_HOLES){\n';
const fieldFooter='return {\n  '+publicNames+',\n  '+rendererNames+'\n};\n}\n';
const fieldBindings='const coastalField=createCourseField(ROUND_HOLES);\nconst {\n  '+publicNames+',\n  '+rendererNames+'\n}=coastalField;\nexport {\n  '+publicNames+'\n};\n\n';
const gameCall='  const {q,finalPath,direction}=launchShotPhysics(physics,{\n    metrics,c,L,lie,position:ballGroup.position,aimYaw,dispersion,\n    dispersionSource:()=>Math.sin(performance.now()*.012)\n  });';
const launchSignature='export function launchShotPhysics(physics,{metrics,c,L,lie,position,aimYaw,dispersion,dispersionSource}){\n';

export function restoreStep2Bytes(path,raw,movedSources={}){
  let source=Buffer.isBuffer(raw)?raw.toString('utf8'):raw;
  const movedSource=path=>movedSources[path]??read(path);
  if(path==='prototype1/game.js'){
    source=lf(source);
    const resolver=lf(movedSource('prototype1/shot/resolveShot.js'));
    assert.equal(resolver.split(launchSignature).length-1,1,'exact extracted launch signature');
    const start=resolver.indexOf(launchSignature)+launchSignature.length;
    const end=resolver.indexOf('  return {q,finalPath,direction};\n}',start);
    assert.ok(end>start,'exact extracted launch return');
    let moved=resolver.slice(start,end);
    moved=once(moved,'dispersion===undefined?dispersionSource():dispersion','dispersion===undefined?Math.sin(performance.now()*.012):dispersion','dispersion operand');
    assert.equal(moved.split('position:position').length-1,2,'exact two launch positions');
    moved=moved.replaceAll('position:position','position:ballGroup.position');
    assert.ok(moved.endsWith('\n'));
    source=once(source,gameCall,moved.slice(0,-1),'game launch adapter');
    source=once(source,"import {launchShotPhysics} from './shot/resolveShot.js';\n",'','game extraction import');
  }else if(path==='prototype1/physics.js'){
    source=once(source,"import * as THREE from './shot/solverVector.js';","import * as THREE from '../vendor/three.module.js';",'solver vector import');
    source=once(source,'\nexport {FIXED as SOLVER_FIXED_STEP};\n','','fixed-step export only');
  }else if(path==='prototype1/worldV2.js'){
    let field=movedSource('prototype1/shot/courseField.js');
    assert.ok(field.startsWith(fieldHeader),'exact course factory prefix');
    assert.ok(field.endsWith(fieldFooter),'exact course factory suffix');
    field=field.slice(fieldHeader.length,-fieldFooter.length);
    const helperStart=source.indexOf('const clamp='),helperEnd=source.indexOf('const seeded=');
    assert.ok(helperStart>=0&&helperEnd>helperStart);
    const helpers=source.slice(helperStart,helperEnd)+'\n';
    assert.ok(field.startsWith(helpers),'moved helper statements match unchanged rendered helpers');
    field=field.slice(helpers.length);
    for(const name of publicNames.split(',')){
      const kind=['SURFACE_LIFT','BUNKERS','WATER_LEVEL'].includes(name)?'const':'function';
      const declaration=kind+' '+name+(kind==='const'?'=':'(');
      field=once(field,declaration,'export '+declaration,'moved field export '+name);
    }
    source=once(source,fieldBindings,field,'world field factory binding');
    source=once(source,"\nimport {createCourseField} from './shot/courseField.js';",'','world factory import');
  }else if(path==='gauntlet/run-flight-gauntlet.mjs'){
    source=lf(source);
    source=once(source,'protected bytes reconstruct exactly through authorized extraction only; cup, poses, clubface and ball unchanged','protected solver, contact field, cup, poses, clubface and ball bytes are unchanged this session','flight scope label');
    source=once(source,"import {restoreStep2Bytes} from './sealed-shot/step3-preservation.mjs';\n",'','flight preservation import');
    source=once(source,"const hash=path=>createHash('sha256').update(restoreStep2Bytes(path,readFileSync(new URL('../'+path,import.meta.url)))).digest('hex');","const hash=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');",'flight hash adapter');
  }else return Buffer.isBuffer(raw)?raw:Buffer.from(raw);
  const restored=Buffer.from(source);
  assert.equal(hash(restored),STEP3_BASELINE_HASHES[path],path+' exact reconstruction of accepted Step 2');
  return restored;
}

export function assertStep3ProductionScope(){
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
  const changed=git('diff','--name-only',PRE_STEP3_COMMIT,'--','prototype1','vendor').split('\n').filter(Boolean);
  const untracked=git('ls-files','--others','--exclude-standard','--','prototype1','vendor').split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...changed,...untracked])].sort(),[
    'prototype1/game.js','prototype1/physics.js','prototype1/worldV2.js',...STEP3_NEW_PRODUCTION_FILES
  ].sort(),'only exact three moves and three new extraction modules');
  for(const path of ['prototype1/game.js','prototype1/physics.js','prototype1/worldV2.js']){
    const before=execFileSync('git',['show',PRE_STEP3_COMMIT+':'+path],{cwd:root,maxBuffer:16*1024*1024});
    assert.equal(hash(before),STEP3_BASELINE_HASHES[path],path+' immutable checkpoint provenance');
    restoreStep2Bytes(path,readFileSync(new URL(path,root)));
  }
}
