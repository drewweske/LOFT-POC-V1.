import * as THREE from '../vendor/three.module.js';

export const COASTAL_HINTERLAND_SPEC=Object.freeze({
  system:'LOFT_INLAND_HORIZON_V1',nonPlayable:true,
  fieldEdge:Object.freeze({x:-92,z:-292}),
  bounds:Object.freeze({xMin:-212,xMax:24,zMin:-388,zMax:52}),
  maxTriangles:24000,drawCalls:1,textureCount:0,shadowDrawCalls:0
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const hill=(x,z,cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));

// These masses are scenery beyond the existing boundary recovery, not new
// playable land or hidden colliders. The joined apron uses the existing edge
// samples; nothing is draped over the maintained field or its rough.
export function hinterlandLift(x,z){
  const outside=Math.hypot(Math.max(0,-92-x),Math.max(0,-292-z));
  const apron=smooth(0,24,outside),coastRelease=1-smooth(-10,24,x);
  const west=17*hill(x,z,-151,-164,43,118);
  const shoulder=22*hill(x,z,-151,-291,61,67);
  const north=19*hill(x,z,-62,-351,70,38);
  const saddle=-6*hill(x,z,-105,-305,35,38);
  return Math.max(0,west+shoulder+north+saddle)*apron*coastRelease;
}

export function createCoastalHinterland(heightAt,colorAt){
  // The field uses 0.8 m seam stations. Keep every one at the shared edges,
  // then spend much less geometry on the distant broad landforms.
  const xs=[-212,-204,-196,-188,-180,-172,-164,-156,-148,-140,-132,-124,-116,-108,-100,-96];
  for(let i=0;i<=145;i++)xs.push(-92+i*.8);
  const zs=[-388,-380,-372,-364,-356,-348,-340,-332,-324,-316,-308,-300,-296];
  for(let i=0;i<=430;i++)zs.push(-292+i*.8);
  const positions=[],colors=[],indices=[],vertices=new Map();
  const vertex=(ix,iz)=>{
    const key=ix+':'+iz;if(vertices.has(key))return vertices.get(key);
    const x=xs[ix],z=zs[iz],lift=hinterlandLift(x,z),y=heightAt(x,z)+lift;
    const d=Math.hypot(Math.max(0,-92-x),Math.max(0,-292-z));
    const near=colorAt(clamp(x,-92,92),clamp(z,-292,52));
    const grass=new THREE.Color().setRGB(...near).convertSRGBToLinear();
    const windPatch=Math.sin(x*.037+z*.020+Math.sin(z*.032)*1.5)*Math.sin(z*.041-x*.018);
    const exposed=clamp(smooth(4,26,lift)*.52+windPatch*.12,0,1);
    const heath=new THREE.Color(0x737b59).lerp(new THREE.Color(0x969273),exposed);
    grass.lerp(heath,smooth(0,38,d)*.72);
    const index=positions.length/3;positions.push(x,y,z);colors.push(grass.r,grass.g,grass.b);
    vertices.set(key,index);return index;
  };
  for(let iz=0;iz<zs.length-1;iz++)for(let ix=0;ix<xs.length-1;ix++){
    if(xs[ix]>=-92&&zs[iz]>=-292)continue;
    const a=vertex(ix,iz),b=vertex(ix+1,iz),c=vertex(ix,iz+1),d=vertex(ix+1,iz+1);
    indices.push(a,c,b,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,dithering:true});
  const mesh=new THREE.Mesh(geometry,material);mesh.name=COASTAL_HINTERLAND_SPEC.system;
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData={...COASTAL_HINTERLAND_SPEC};
  return mesh;
}
