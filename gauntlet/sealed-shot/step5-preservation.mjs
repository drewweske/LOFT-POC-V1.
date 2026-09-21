// Exact, fail-closed inverse of ONLY Decision 002 / prototype identity wiring.
// Previous baselines are not rewritten. Calculations come from current files;
// these unique replacements restore accepted Step 4 before Step 3/2 inverses.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const PRE_STEP5_COMMIT='0bfee37c7c2f4ba919d3676e457ca363515d652d';
const root=new URL('../../',import.meta.url);
const lf=s=>s.toString().replace(/\r\n/g,'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline={
  'prototype1/game.js':'eae5925c410c600c145014214cebc069890fd01a63f73b407637a5abb2128b9a',
  'prototype1/shot/resolveShot.js':'e69670f72493ad388bb48c6b0275f9726766c745ef5b906c68a7351d5246dafd'
};
const once=(s,after,before)=>{
  assert.equal(s.split(after).length-1,1,'unique authorized Step 5 edit: '+after);
  return s.replace(after,before);
};
export function restorePreStep5Bytes(path,raw){
  if(!Object.hasOwn(baseline,path))return Buffer.isBuffer(raw)?raw:Buffer.from(raw);
  let s=lf(raw);
  if(path==='prototype1/game.js'){
    s=once(s,"import {deriveShotSeed,dispersionFromShotSeed} from './shot/seedContract.js';\n",'');
    s=once(s,"  roundSequence:0,roundId:'prototype-local-round-0',playerId:'prototype-local-player',\n  strokeIndex:0,\n",'');
    s=once(s,'  const shotIntent=dispersion===undefined?{shotSeed:deriveShotSeed({\n    roundId:state.roundId,playerId:state.playerId,holeIndex:state.holeIndex,strokeIndex:state.strokeIndex\n  })}:null;\n','');
    s=once(s,'dispersionSource:()=>dispersionFromShotSeed(shotIntent.shotSeed)','dispersionSource:()=>Math.sin(performance.now()*.012)');
    s=once(s,'  state.strokeIndex++;\n','');
    s=once(s,'  state.strokeIndex=0;\n','');
    s=once(s,"  state.roundSequence++;state.roundId='prototype-local-round-'+state.roundSequence;\n",'');
  }else{
    s=once(s,'// can run it to rest. Aim is explicit; ShotIntent.shotSeed is the sole production\n// dispersion authority. The launch-level scalar/source seam is retained for tests.',
      '// can run it to rest. Clock/aim readers, when needed by the live adapter, are\n// explicit dependencies and are never looked up by this module.');
    s=once(s,"import {dispersionFromShotSeed} from './seedContract.js';\n",'');
    s=once(s,'  // Optional raw scalar is a test seam; production supplies the frozen seed mapping.',
      '  // Optional raw sine scalar is a test seam; omitted keeps the legacy clock read here.');
    s=once(s,'// and shotSeed. No raw dispersion authority or equipment/level/environment lookup.',
      '// and the Step 2 raw dispersion scalar. No equipment/level/environment lookup.');
    s=once(s,'  const hole=Course.holes[ShotIntent.holeIndex];',
      "  if(!Number.isFinite(ShotIntent.dispersion))throw new Error('Step 3 requires injected dispersion');\n  const hole=Course.holes[ShotIntent.holeIndex];");
    s=once(s,'    aimYaw:()=>ShotIntent.aimYaw,\n    dispersionSource:()=>dispersionFromShotSeed(ShotIntent.shotSeed)',
      '    aimYaw:()=>ShotIntent.aimYaw,dispersion:ShotIntent.dispersion');
  }
  assert.equal(sha(s),baseline[path],path+' exact accepted Step 4 source after narrow inverse');
  return Buffer.from(s);
}
export function assertStep5ProductionScope(){
  const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:16*1024*1024});
  const names=args=>git(...args).toString().trim().split('\n').filter(Boolean);
  const changed=[...new Set([...names(['diff','--name-only',PRE_STEP5_COMMIT,'--','prototype1','vendor','.gitattributes']),
    ...names(['ls-files','--others','--exclude-standard','--','prototype1','vendor'])])].sort();
  assert.deepEqual(changed,['prototype1/game.js','prototype1/shot/resolveShot.js','prototype1/shot/seedContract.js']);
  for(const [p,expected] of Object.entries(baseline)){
    assert.equal(sha(git('show',PRE_STEP5_COMMIT+':'+p)),expected,'immutable pre-Step-5 provenance');
    restorePreStep5Bytes(p,readFileSync(new URL(p,root)));
  }
  // Projection, corpus, independent oracle and all historical evidence immutable.
  const artifacts=['gauntlet/sealed-shot/fixtures','gauntlet/sealed-shot/authority',
    'gauntlet/sealed-shot/parity-projection-v1.mjs','gauntlet/sealed-shot/fixture-lock-v1.json',
    'gauntlet/sealed-shot/step4-inputs-v1.json','gauntlet/sealed-shot/step4-legacy-oracle.mjs',
    ...['step1-node','step1-browser','step1-provenance','step2-node','step3-node','step4-node'].map(n=>'gauntlet/sealed-shot/evidence/'+n+'.json')];
  assert.equal(git('diff',PRE_STEP5_COMMIT,'--',...artifacts).toString(),'','frozen artifacts and prior evidence untouched');
}
