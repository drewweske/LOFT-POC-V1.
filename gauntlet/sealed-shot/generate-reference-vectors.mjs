// INDEPENDENT ORACLE: written from FINAL v1.2 §2, not imported from contracts-v1
// or any gameplay implementation. BigInt modular arithmetic vs subject imul;
// Buffer fixed-width encoding vs subject DataView. Run explicitly, review diff.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('fixtures/',import.meta.url);
const digest=b=>createHash('sha256').update(b).digest('hex');
const unsigned=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n);return b;};
const text=s=>{const b=Buffer.from(s,'utf8');return Buffer.concat([unsigned(b.length),b]);};
const double=n=>{if(!Number.isFinite(n))throw Error('finite');const b=Buffer.alloc(8);b.writeDoubleLE(n===0?0:n);return b;};
const MASK=0xffffffffn;
function hashWord(bytes){
  let h=2166136261n;
  for(const byte of bytes)h=((h^BigInt(byte))*16777619n)&MASK;
  const fnv=Number(h);
  h=((h^(h>>16n))*2246822507n)&MASK;
  h=((h^(h>>13n))*3266489909n)&MASK;
  h=(h^(h>>16n))&MASK;
  return {fnv1a32:fnv,word:Number(h)};
}
const tuples=[
  ['', '',0,0],['AB','C',0,0],['A','BC',0,0],
  ['round-001','player-001',0,0],['round-001','player-001',0,1],
  ['round-001','player-001',1,0],['round-002','player-001',0,0],
  ['round-001','player-002',0,0],['R\u0000X','P\u0000Y',0xffffffff,0xffffffff],
  ['rondé','球🏌',0x80000000,0x01020304],['ronde\u0301','球🏌',0x80000000,0x01020304]
];
const seedVectors=tuples.map(([roundId,playerId,holeIndex,strokeIndex])=>{
  const bytes=Buffer.concat([text(roundId),text(playerId),unsigned(holeIndex),unsigned(strokeIndex)]);
  const {fnv1a32,word}=hashWord(bytes);
  return {input:{roundId,playerId,holeIndex,strokeIndex},bytes:bytes.toString('hex'),fnv1a32,shotSeed:word,unitFloat:word/4294967296};
});
const keys=[
  [0,1,'fixture.cup',0],[0,2,'fixture.cup',0],[0,3,'fixture.cup',0],
  [0,1,'fixture.cup',1],[1,1,'fixture.cup',0],[0,1,'fixture.edge',0],
  [0xffffffff,3,'',0xffffffff],[0x01020304,2,'edge\u0000é🏌',0x80000000],
  [0x01020304,2,'edge\u0000e\u0301🏌',0x80000000]
];
const boundaryVectors=keys.map(([shotSeed,domain,featureId,occurrence])=>{
  const bytes=Buffer.concat([unsigned(shotSeed),unsigned(domain),text(featureId),unsigned(occurrence)]);
  const {fnv1a32,word}=hashWord(bytes);
  return {input:{shotSeed,domain,featureId,occurrence},bytes:bytes.toString('hex'),fnv1a32,boundaryWord:word};
});
// Independently transcribed course field order; DO NOT load the subject schema
// to drive this writer, or a reordered schema could bless its own bytes.
function courseReference(p){
  const t=s=>text(s.normalize('NFC'));
  const a=(items,encode)=>Buffer.concat([unsigned(items.length),...items.map(encode)]);
  return Buffer.concat([
    unsigned(p.coursePackageSchemaVersion),t(p.courseId),
    a(p.physicsArtifacts,x=>Buffer.concat([t(x.role),Buffer.from(x.sha256,'hex')])),
    a(p.features,x=>Buffer.concat([t(x.featureId),t(x.authorKey)])),
    a(p.holes,x=>Buffer.concat([t(x.holeId),unsigned(x.number),unsigned(x.par),t(x.cupFeatureId),...x.tee.map(double),...x.pin.map(double),...x.defaultWind.map(double)]))
  ]);
}
const p=JSON.parse(readFileSync(new URL('coastal-ridge-v1.json',base),'utf8'));
const small={coursePackageSchemaVersion:1,courseId:'Café',physicsArtifacts:[],features:[{featureId:'cup.é',authorKey:'authored-cup'}],holes:[{holeId:'h',number:1,par:3,cupFeatureId:'cup.é',tee:[-0,1.5],pin:[-2.25,0],defaultWind:[0.125,-0.5]}]};
const courses=[['coastal-ridge-v1',p],['binary-edges-v1',small]].map(([name,input])=>{
  const bytes=courseReference(input);
  return {name,input,byteLength:bytes.length,bytes:bytes.toString('hex'),sha256:digest(bytes)};
});
writeFileSync(new URL('contract-vectors-v1.json',base),JSON.stringify({
  source:'Executable Specification v1.2 FINAL §§2.1–2.3; findings F-001/F-005',
  seedContractVersion:1,boundaryContractVersion:1,coursePackageSchemaVersion:1,
  seedVectors,boundaryVectors,courses
},null,2)+'\n');
console.log(JSON.stringify({seedVectors:seedVectors.length,boundaryVectors:boundaryVectors.length,courses:courses.map(({name,byteLength,sha256})=>({name,byteLength,sha256}))},null,2));
