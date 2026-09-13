// Step 1 ONLY. No production imports or call sites. §2.1–2.3, final v1.2.
export const VERSIONS = Object.freeze({seed:1, boundary:1, course:1});
export const DOMAIN = Object.freeze({CUP_CAPTURE:1, SURFACE_EDGE:2, REST_THRESHOLD:3});
const utf8 = new TextEncoder();
function u32(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new TypeError('u32 required');
  return value;
}
function string(value, nfc=false) {
  if (typeof value !== 'string') throw new TypeError('string required');
  // Reject malformed UTF-16 rather than silently alias two IDs to U+FFFD.
  for (let i=0;i<value.length;i++) {
    const c=value.charCodeAt(i);
    if (c>=0xd800 && c<=0xdbff) {
      const next=value.charCodeAt(++i);
      if (!(next>=0xdc00 && next<=0xdfff)) throw new TypeError('unpaired surrogate');
    } else if (c>=0xdc00 && c<=0xdfff) throw new TypeError('unpaired surrogate');
  }
  return utf8.encode(nfc ? value.normalize('NFC') : value);
}
class Writer {
  constructor(){this.parts=[];}
  bytes(b){this.parts.push(b);}
  u32(v){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,u32(v),true);this.bytes(b);}
  f64(v){
    if (typeof v!=='number' || !Number.isFinite(v)) throw new TypeError('finite f64 required');
    const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,v===0?0:v,true);this.bytes(b);
  }
  text(s,nfc=false){const b=string(s,nfc);this.u32(b.length);this.bytes(b);}
  array(values,write){if(!Array.isArray(values))throw new TypeError('array required');this.u32(values.length);values.forEach(write);}
  finish(){const b=new Uint8Array(this.parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of this.parts){b.set(p,i);i+=p.length;}return b;}
}
export function fnv1a32(bytes){let h=0x811c9dc5;for(const b of bytes)h=Math.imul(h^b,0x01000193)>>>0;return h;}
export function fmix32(h){h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0;}
export function seedBytes({roundId,playerId,holeIndex,strokeIndex}){
  const w=new Writer();w.text(roundId);w.text(playerId);w.u32(holeIndex);w.u32(strokeIndex);return w.finish();
}
export const shotSeed=tuple=>fmix32(fnv1a32(seedBytes(tuple)));
export const unitFloat=word=>u32(word)/4294967296;
export function boundaryKeyBytes({shotSeed:seed,domain,featureId,occurrence}){
  if(!Object.values(DOMAIN).includes(domain))throw new RangeError('BoundaryContract v1 domain');
  const w=new Writer();w.u32(seed);w.u32(domain);w.text(featureId);w.u32(occurrence);return w.finish();
}
export const boundaryWord=key=>fmix32(fnv1a32(boundaryKeyBytes(key)));

function exactKeys(o,required,optional=[]){
  if(!o || Object.getPrototypeOf(o)!==Object.prototype)throw new TypeError('plain authoring object required');
  for(const k of required)if(!Object.hasOwn(o,k))throw new TypeError('missing '+k);
  for(const k of Object.keys(o))if(!required.includes(k)&&!optional.includes(k))throw new TypeError('unknown field '+k);
}
function rejectNonFinite(value){
  if(typeof value==='number'&&!Number.isFinite(value))throw new TypeError('non-finite package value');
  if(value&&typeof value==='object')for(const v of Object.values(value))rejectNonFinite(v);
}
function digestBytes(hex){
  if(typeof hex!=='string'||!(/^[0-9a-f]{64}$/).test(hex))throw new TypeError('lowercase SHA-256 digest required');
  return Uint8Array.from(hex.match(/../g),b=>parseInt(b,16));
}
// Explicit schema is also checked in as course-schema-v1.json. No inferred key order.
export function courseBytes(p){
  rejectNonFinite(p);
  exactKeys(p,['coursePackageSchemaVersion','courseId','physicsArtifacts','features','holes'],['presentation']);
  if(p.coursePackageSchemaVersion!==1)throw new RangeError('unknown course schema');
  if(p.presentation){exactKeys(p.presentation,[],['displayName','description']);for(const v of Object.values(p.presentation))string(v,true);}
  const w=new Writer();w.u32(1);w.text(p.courseId,true);
  const roles=new Set();
  w.array(p.physicsArtifacts,a=>{
    exactKeys(a,['role','sha256']);const role=a.role.normalize('NFC');
    if(roles.has(role))throw new TypeError('duplicate artifact role');roles.add(role);
    w.text(role,true);w.bytes(digestBytes(a.sha256));
  });
  const ids=new Set(),authorKeys=new Set();
  w.array(p.features,f=>{
    exactKeys(f,['featureId','authorKey']);const id=f.featureId.normalize('NFC');
    const authorKey=f.authorKey.normalize('NFC');
    if(!id||ids.has(id)||!authorKey||authorKeys.has(authorKey))throw new TypeError('duplicate/empty authored identity');
    ids.add(id);authorKeys.add(authorKey);
    w.text(id,true);w.text(f.authorKey,true);
  });
  const holeIds=new Set(),numbers=new Set();
  w.array(p.holes,h=>{
    exactKeys(h,['holeId','number','par','cupFeatureId','tee','pin','defaultWind']);
    const holeId=h.holeId.normalize('NFC');
    if(holeIds.has(holeId)||numbers.has(h.number))throw new TypeError('duplicate hole');
    holeIds.add(holeId);numbers.add(h.number);
    if(!ids.has(h.cupFeatureId.normalize('NFC')))throw new TypeError('unknown authored cupFeatureId');
    w.text(h.holeId,true);w.u32(h.number);w.u32(h.par);w.text(h.cupFeatureId,true);
    for(const pair of [h.tee,h.pin,h.defaultWind]){
      if(!Array.isArray(pair)||pair.length!==2)throw new TypeError('fixed x,z pair required');
      pair.forEach(v=>w.f64(v));
    }
  });
  return w.finish();
}
export async function courseHash(p){
  const hash=await globalThis.crypto.subtle.digest('SHA-256',courseBytes(p));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
// Authoring validation, not runtime feature selection. Never derive an ID from index.
export function assertFeaturePermanence(p,ledger){
  const byKey=new Map(ledger.map(f=>[f.authorKey,f.featureId.normalize('NFC')]));
  if(byKey.size!==ledger.length||new Set(byKey.values()).size!==ledger.length)throw new TypeError('duplicate authored ledger identity');
  const seen=new Set();
  for(const f of p.features){
    if(seen.has(f.authorKey)||byKey.get(f.authorKey)!==f.featureId.normalize('NFC'))throw new Error('authored feature identity changed: '+f.authorKey);
    seen.add(f.authorKey);
  }
}
