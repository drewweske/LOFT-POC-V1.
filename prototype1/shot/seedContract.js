// SeedContract v1: raw UTF-8 (no normalization), length-prefixed LE strings,
// then uint32 LE hole/stroke indices. No fixture or mutable runtime state.
function uint32(value,name){
  if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new Error(name+' must be uint32');
  return value;
}
function utf8(value){
  if(typeof value!=='string')throw new Error('Seed identity must be a string');
  const bytes=[];
  for(let i=0;i<value.length;i++){
    let c=value.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff){
      const low=value.charCodeAt(++i);
      if(!(low>=0xdc00&&low<=0xdfff))throw new Error('Unpaired UTF-16 surrogate');
      c=0x10000+((c&0x3ff)<<10)+(low&0x3ff);
    }else if(c>=0xdc00&&c<=0xdfff)throw new Error('Unpaired UTF-16 surrogate');
    if(c<0x80)bytes.push(c);
    else if(c<0x800)bytes.push(0xc0|(c>>>6),0x80|(c&0x3f));
    else if(c<0x10000)bytes.push(0xe0|(c>>>12),0x80|((c>>>6)&0x3f),0x80|(c&0x3f));
    else bytes.push(0xf0|(c>>>18),0x80|((c>>>12)&0x3f),0x80|((c>>>6)&0x3f),0x80|(c&0x3f));
  }
  return bytes;
}
export function seedBytes({roundId,playerId,holeIndex,strokeIndex}){
  const bytes=[];
  const word=value=>{for(let shift=0;shift<32;shift+=8)bytes.push((value>>>shift)&0xff);};
  for(const value of [roundId,playerId]){
    const encoded=utf8(value);
    word(uint32(encoded.length,'UTF-8 byte length'));
    for(const byte of encoded)bytes.push(byte);
  }
  word(uint32(holeIndex,'holeIndex'));word(uint32(strokeIndex,'strokeIndex'));
  return new Uint8Array(bytes);
}
export function fnv1a32(bytes){
  let h=0x811c9dc5;
  for(const b of bytes)h=Math.imul(h^b,0x01000193)>>>0;
  return h>>>0;
}
export function fmix32(h){
  h^=h>>>16;
  h=Math.imul(h,0x85ebca6b)>>>0;
  h^=h>>>13;
  h=Math.imul(h,0xc2b2ae35)>>>0;
  h^=h>>>16;
  return h>>>0;
}
export function deriveShotSeed(context){return fmix32(fnv1a32(seedBytes(context)));}

// Decision Record 002: initial solverVersion=1 mapping, NOT SeedContract v2.
// Keep the signed adapter separate from the frozen integer derivation above.
export function dispersionFromShotSeed(shotSeed){
  uint32(shotSeed,'ShotIntent.shotSeed');
  const u = (shotSeed >>> 0) / 4294967296;
  const dispersion = 2 * u - 1;
  return dispersion;
}
