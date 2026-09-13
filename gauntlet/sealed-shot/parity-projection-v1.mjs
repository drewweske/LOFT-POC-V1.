// TEST ONLY. Frozen raw-bit projection; NOT authoritative ShotResult. No Q/epsilon.
export const PARITY_PROJECTION_VERSION=1;
export const PARITY_FIELDS=Object.freeze([
  'pos','vel','spinAxis','spinOmega','quality','simTime','lastSafePos',
  'surface','lastImpactSurface','lastSurface','surfaceChanged',
  'stopped','bounced','holed','lipTouched','captureRejected','cupLipResolved','recovered'
]);
const bits=value=>{
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('finite parity number');
  const bytes=new Uint8Array(8);new DataView(bytes.buffer).setFloat64(0,value,true);
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
};
const optional=value=>value===undefined?['absent']:['present',value];
export function projectPhysicsFrame(physics){
  const s=physics.state;
  const vector=v=>[bits(v.x),bits(v.y),bits(v.z)];
  return [1,physics.active,bits(physics.accum),
    vector(s.pos),vector(s.vel),vector(s.spinAxis),bits(s.spinOmega),bits(s.quality),bits(s.simTime),vector(s.lastSafePos),
    s.surface,s.lastImpactSurface,s.lastSurface,s.surfaceChanged===null?null:[s.surfaceChanged.from,s.surfaceChanged.to],
    s.stopped,s.bounced,s.holed,s.lipTouched,s.captureRejected,optional(s.cupLipResolved),s.recovered
  ];
}
