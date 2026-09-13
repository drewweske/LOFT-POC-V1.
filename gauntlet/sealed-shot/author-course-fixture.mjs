// Explicit authoring command, NEVER invoked by a gate. Does not edit production.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ROUND_HOLES} from '../../prototype1/round.js';
const base=new URL('./',import.meta.url),root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const world=read('prototype1/worldV2.js').replace(/\r\n/g,'\n');
const surface=read('prototype1/surfaces.js').replace(/\r\n/g,'\n');
// Both endpoints are literal unique declarations. Include ALL field helpers and
// scratch/grid logic, not scenery. These are archived data, not a new evaluator.
const between=(s,a,b)=>{
  if(s.split(a).length!==2||s.split(b).length!==2)throw new Error('source scope changed');
  return s.slice(s.indexOf(a),s.indexOf(b));
};
const artifacts=[
  ['contact-field-v4',between(world,'const clamp=','const seeded=')+'\n'+between(world,'export const SURFACE_LIFT=','const RGB={};')],
  ['surface-response-v1',surface.slice(0,surface.indexOf('export function surfaceDisplay'))]
];
mkdirSync(new URL('fixtures/',base),{recursive:true});
const physicsArtifacts=artifacts.map(([role,source])=>{
  const sha256=hash(source);writeFileSync(new URL('fixtures/'+sha256+'.txt',base),source);return {role,sha256};
});
const features=JSON.parse(readFileSync(new URL('coastal-feature-ids-v1.json',base),'utf8'));
// Literal authoring table, not IDs synthesized from iteration order.
const holeIdentity={
  1:{holeId:'coastal.ridge',cupFeatureId:'coastal.ridge.cup'},
  2:{holeId:'coastal.shelf',cupFeatureId:'coastal.shelf.cup'},
  3:{holeId:'coastal.lighthouse',cupFeatureId:'coastal.lighthouse.cup'}
};
const holes=ROUND_HOLES.map(h=>({...holeIdentity[h.number],number:h.number,par:h.par,tee:h.tee,pin:h.pin,defaultWind:h.wind}));
writeFileSync(new URL('fixtures/coastal-ridge-v1.json',base),JSON.stringify({
  coursePackageSchemaVersion:1,courseId:'coastal-ridge',physicsArtifacts,features,holes,
  presentation:{displayName:'Coastal Ridge',description:'Integration 041 authoring snapshot; not loaded by gameplay.'}
},null,2)+'\n');
console.log('Authored Coastal Ridge package and '+artifacts.length+' immutable physics artifacts. No runtime files changed.');
