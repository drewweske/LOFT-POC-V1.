import * as THREE from '../vendor/three.module.js';

export const LOFT_BALL_SPEC=Object.freeze({
  dimpleCount:338,
  physicalRadius:.021335,
  dimpleDiameter:.00392,
  dimpleDepth:.000145,
  signatureDirection:Object.freeze([-.382,-.382,.813]),
  // The inspection level is the first tier with enough vertices to resolve
  // every authored depression as a curved product surface. The ordinary
  // gameplay tier preserves the prior cost; the far tier is the smallest
  // mesh that still samples every one of the 338 authored centers.
  heroDetail:47,
  closeDetail:12,
  farDetail:8,
  heroDistance:.30,
  farDistance:7.5
});

const RING_COUNTS=Object.freeze([4,12,16,20,24,28,32,32,32,32,28,24,20,16,12,4]);
const geometryCache=new Map();
let heroMaterial=null;
let ghostMaterial=null;
let microtexture=null;

const signatureDirection=()=>new THREE.Vector3(...LOFT_BALL_SPEC.signatureDirection).normalize();

export function buildDimpleDirections(){
  const total=LOFT_BALL_SPEC.dimpleCount;
  const centers=[new THREE.Vector3(0,1,0)];
  let consumed=1;
  RING_COUNTS.forEach((count,ringIndex)=>{
    // Equal-area band centers keep dimple density calm from pole to pole.
    const bandCenter=(consumed+count*.5)/total;
    const y=1-2*bandCenter;
    const radius=Math.sqrt(Math.max(0,1-y*y));
    const phase=(ringIndex%2?Math.PI/count:0)+(ringIndex%4)*.0065;
    for(let i=0;i<count;i++){
      const a=phase+i*Math.PI*2/count;
      centers.push(new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius));
    }
    consumed+=count;
  });
  centers.push(new THREE.Vector3(0,-1,0));
  if(centers.length!==total)throw new Error(`LOFT ball topology expected ${total} dimples; received ${centers.length}`);

  // The first authored dimple is the permanent industrial-design signature.
  const rotate=new THREE.Quaternion().setFromUnitVectors(centers[0],signatureDirection());
  centers.forEach(center=>center.applyQuaternion(rotate).normalize());
  return centers;
}

function makeGeometry(radius,detail){
  const key=`${radius.toFixed(6)}:${detail}`;
  if(geometryCache.has(key))return geometryCache.get(key);

  const geometry=new THREE.IcosahedronGeometry(1,detail);
  const positions=geometry.attributes.position;
  const first=new THREE.Vector3().fromBufferAttribute(positions,0).normalize();
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(first,signatureDirection()));

  const centers=buildDimpleDirections();
  const colorArray=new Float32Array(positions.count*3);
  const cream=new THREE.Color(0xf2efe8),orange=new THREE.Color(0xff6a2a);
  const angularRadius=Math.asin((LOFT_BALL_SPEC.dimpleDiameter*.5)/LOFT_BALL_SPEC.physicalRadius);
  const edgeDot=Math.cos(angularRadius);
  const depthRatio=LOFT_BALL_SPEC.dimpleDepth/LOFT_BALL_SPEC.physicalRadius;
  const p=new THREE.Vector3(),normal=new THREE.Vector3(),tangentGradient=new THREE.Vector3();
  const normalArray=new Float32Array(positions.count*3);
  const uniqueSamples=new Uint16Array(centers.length);
  const peakDepths=new Float64Array(centers.length);
  const vertexCache=new Map();
  let deepest=0,signatureUniqueVertices=0;

  for(let i=0;i<positions.count;i++){
    p.fromBufferAttribute(positions,i).normalize();
    // PolyhedronGeometry is non-indexed so most surface vertices occur once
    // per adjacent triangle. Cache by direction: deformation and the nearest
    // authored dimple are solved once, and every duplicate receives the same
    // analytic normal. This is both substantially cheaper at hero detail and
    // removes the faceted normals produced by computeVertexNormals().
    const directionKey=`${Math.round(p.x*1e9)}:${Math.round(p.y*1e9)}:${Math.round(p.z*1e9)}`;
    let sample=vertexCache.get(directionKey);
    if(!sample){
      let nearest=-1,nearestDot=-2;
      for(let d=0;d<centers.length;d++){
        const dot=p.dot(centers[d]);
        if(dot>nearestDot){nearestDot=dot;nearest=d;}
      }

      let depression=0,depthDerivative=0;
      if(nearestDot>edgeDot){
        const t=(nearestDot-edgeDot)/(1-edgeDot);
        depression=depthRatio*(t*t*(3-2*t));
        // d(depression)/d(dot). The smoothstep has zero slope at the rim and
        // center, producing a continuous spherical surface rather than a
        // ring of hard triangle-normal breaks.
        depthDerivative=depthRatio*(6*t*(1-t))/(1-edgeDot);
        uniqueSamples[nearest]++;
        peakDepths[nearest]=Math.max(peakDepths[nearest],depression);
      }

      const surfaceRadius=radius*(1-depression);
      const x=p.x*surfaceRadius,y=p.y*surfaceRadius,z=p.z*surfaceRadius;
      if(depression>0){
        tangentGradient.copy(centers[nearest]).addScaledVector(p,-nearestDot);
        normal.copy(p).multiplyScalar(1-depression).addScaledVector(tangentGradient,depthDerivative).normalize();
      }else normal.copy(p);

      const signature=nearest===0&&nearestDot>edgeDot;
      if(signature)signatureUniqueVertices++;
      deepest=Math.max(deepest,depression);
      sample={x,y,z,nx:normal.x,ny:normal.y,nz:normal.z,nearest,inside:nearestDot>edgeDot,signature};
      vertexCache.set(directionKey,sample);
    }

    positions.setXYZ(i,sample.x,sample.y,sample.z);
    normalArray[i*3]=sample.nx;normalArray[i*3+1]=sample.ny;normalArray[i*3+2]=sample.nz;
    const signature=sample.signature;
    const color=signature?orange:cream;
    colorArray[i*3]=color.r;colorArray[i*3+1]=color.g;colorArray[i*3+2]=color.b;
  }

  geometry.setAttribute('color',new THREE.BufferAttribute(colorArray,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(normalArray,3));
  positions.needsUpdate=true;
  const triangleCount=positions.count/3;
  // Index shared vertices before upload. Preserve UV seam duplicates while
  // removing sixfold triangle duplication from the close inspection buffer.
  const uv=geometry.attributes.uv,packed=[],packedNormals=[],packedColors=[],packedUV=[],indices=[],indexByVertex=new Map();
  let signatureVertices=0;
  for(let i=0;i<positions.count;i++){
    const key=[positions.getX(i),positions.getY(i),positions.getZ(i),uv.getX(i),uv.getY(i)].join(':');
    let index=indexByVertex.get(key);
    if(index===undefined){
      index=packed.length/3;indexByVertex.set(key,index);
      packed.push(positions.getX(i),positions.getY(i),positions.getZ(i));
      packedNormals.push(normalArray[i*3],normalArray[i*3+1],normalArray[i*3+2]);
      packedColors.push(colorArray[i*3],colorArray[i*3+1],colorArray[i*3+2]);
      if(colorArray[i*3]>colorArray[i*3+1]*2)signatureVertices++;
      packedUV.push(uv.getX(i),uv.getY(i));
    }
    indices.push(index);
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(packed,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(packedNormals,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(packedColors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(packedUV,2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const realizedDimpleCount=Array.from(uniqueSamples).filter(Boolean).length;
  const minimumDimpleSamples=Math.min(...uniqueSamples);
  const dimplesAt95PercentDepth=Array.from(peakDepths).filter(value=>value>=depthRatio*.95).length;
  geometry.userData={
    system:'LOFT_BALL_TOPOLOGY_V1',
    topologyVersion:2,
    normalModel:'ANALYTIC_RADIAL_GRADIENT',
    dimpleCount:centers.length,
    realizedDimpleCount,
    minimumDimpleSamples,
    dimplesAt95PercentDepth,
    signatureCount:1,
    signatureVertices,
    signatureUniqueVertices,
    deepestRatio:deepest,
    radius,
    detail,
    triangleCount,
    uniqueVertexCount:vertexCache.size
  };
  geometryCache.set(key,geometry);
  return geometry;
}

export function buildLoftBallGeometry(radius=.026,detail=LOFT_BALL_SPEC.closeDetail){
  return makeGeometry(radius,detail);
}

function ballMicrotexture(){
  if(microtexture||typeof document==='undefined')return microtexture;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const context=canvas.getContext('2d');
  const image=context.createImageData(128,128);
  let seed=0x10f7ba11;
  for(let i=0;i<128*128;i++){
    seed=(seed*1664525+1013904223)>>>0;
    const grain=122+((seed>>>25)&7);
    const j=i*4;image.data[j]=image.data[j+1]=image.data[j+2]=grain;image.data[j+3]=255;
  }
  context.putImageData(image,0,0);
  microtexture=new THREE.CanvasTexture(canvas);
  microtexture.wrapS=microtexture.wrapT=THREE.RepeatWrapping;
  microtexture.repeat.set(3,2);
  return microtexture;
}

function materialFor(ghost=false){
  if(ghost&&ghostMaterial)return ghostMaterial;
  if(!ghost&&heroMaterial)return heroMaterial;
  const material=new THREE.MeshStandardMaterial({
    color:0xffffff,
    vertexColors:true,
    roughness:ghost?.90:.84,
    metalness:0,
    bumpMap:ghost?null:ballMicrotexture(),
    bumpScale:ghost?0:.00018,
    transparent:ghost,
    opacity:ghost?.70:1,
    depthWrite:!ghost
  });
  // The signature belongs to one angular dimple, not to whichever vertices a
  // particular LOD happens to sample. The object-space mask keeps its circular
  // inset edge and physical footprint stable at every inspection distance.
  const cream=new THREE.Color(0xf2efe8),orange=new THREE.Color(0xff6a2a);
  const direction=signatureDirection();
  const edge=Math.cos(Math.asin(LOFT_BALL_SPEC.dimpleDiameter*.5/LOFT_BALL_SPEC.physicalRadius));
  const glslColor=color=>`vec3(${color.r.toFixed(9)},${color.g.toFixed(9)},${color.b.toFixed(9)})`;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLoftBallDirection;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLoftBallDirection=normalize(position);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLoftBallDirection;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float loftSignatureDot=dot(normalize(vLoftBallDirection),vec3(${direction.x.toFixed(9)},${direction.y.toFixed(9)},${direction.z.toFixed(9)}));
      float loftSignatureAA=max(fwidth(loftSignatureDot),0.000015);
      float loftSignatureMask=smoothstep(${edge.toFixed(9)}-loftSignatureAA,${edge.toFixed(9)}+loftSignatureAA,loftSignatureDot);
      diffuseColor.rgb=mix(${glslColor(cream)},${glslColor(orange)},loftSignatureMask);`);
  };
  material.customProgramCacheKey=()=> 'LOFT_BALL_SIGNATURE_OBJECT_SPACE_V2';
  if(ghost)ghostMaterial=material;else heroMaterial=material;
  return material;
}

function ballMesh(radius,detail,{ghost=false}={}){
  // Every instance, including the playable 26 mm readability treatment and
  // the regulation-size inspector, shares the same physical topology buffers.
  // Presentation size lives on the mesh; gameplay owns the root transform.
  const mesh=new THREE.Mesh(makeGeometry(LOFT_BALL_SPEC.physicalRadius,detail),materialFor(ghost));
  mesh.scale.setScalar(radius/LOFT_BALL_SPEC.physicalRadius);
  mesh.name=ghost?'LOFT_BALL_GHOST':'LOFT_BALL_PLAYABLE';
  mesh.castShadow=!ghost;
  mesh.receiveShadow=false;
  mesh.userData.topology='LOFT_BALL_TOPOLOGY_V1';
  mesh.userData.topologyVersion=2;
  mesh.userData.displayRadius=radius;
  return mesh;
}

export function createLoftBallVisual({radius=.026,ghost=false}={}){
  const root=new THREE.Group();
  root.name=ghost?'LOFT_BALL_GUIDE':'LOFT_BALL_HERO';
  root.userData={
    system:'LOFT_BALL_TOPOLOGY_V1',
    topologyVersion:2,
    dimpleCount:LOFT_BALL_SPEC.dimpleCount,
    signatureCount:1,
    signatureDirection:[...LOFT_BALL_SPEC.signatureDirection],
    physicalRadius:LOFT_BALL_SPEC.physicalRadius,
    displayRadius:radius
  };

  if(ghost){
    root.add(ballMesh(radius,LOFT_BALL_SPEC.farDetail,{ghost:true}));
    return root;
  }

  const lod=new THREE.LOD();lod.name='LOFT_BALL_LOD';
  // Ordinary course entry should not construct the inspection surface. The
  // near slot starts on the shared gameplay buffer; LOD selection realizes
  // the cached hero buffer only when a camera actually needs it, before the
  // renderer traverses these children. Every later inspector/ball reuses it.
  const hero=ballMesh(radius,LOFT_BALL_SPEC.closeDetail);
  let heroReady=false;
  lod.addLevel(hero,0,.12);
  lod.addLevel(ballMesh(radius,LOFT_BALL_SPEC.closeDetail),LOFT_BALL_SPEC.heroDistance,.12);
  lod.addLevel(ballMesh(radius,LOFT_BALL_SPEC.farDetail),LOFT_BALL_SPEC.farDistance,.12);
  lod.update=function(camera){
    THREE.LOD.prototype.update.call(this,camera);
    if(!heroReady&&this.getCurrentLevel()===0){
      hero.geometry=makeGeometry(LOFT_BALL_SPEC.physicalRadius,LOFT_BALL_SPEC.heroDetail);
      heroReady=true;
    }
  };
  root.add(lod);
  return root;
}
