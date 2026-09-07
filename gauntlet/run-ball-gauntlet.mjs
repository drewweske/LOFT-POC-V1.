import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {LOFT_BALL_SPEC as spec,buildDimpleDirections,buildLoftBallGeometry,createLoftBallVisual} from '../prototype1/ballVisual.js';
import {LoftBallAtelier,BALL_ATELIER_SPEC} from '../prototype1/ballAtelier.js';

let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS  '+name);};
const centers=buildDimpleDirections();
const edge=Math.cos(Math.asin(spec.dimpleDiameter*.5/spec.physicalRadius));
const depth=spec.dimpleDepth/spec.physicalRadius;
const nearest=p=>{
  let index=0,dot=-2;
  for(let i=0;i<centers.length;i++){const value=p.dot(centers[i]);if(value>dot){dot=value;index=i;}}
  return {index,dot};
};

check('ordinary tee creation defers hero geometry until a near camera needs the shared surface',()=>{
  const first=createLoftBallVisual().children[0];
  const mid=first.levels[1].object.geometry;
  assert.equal(first.levels[0].object.geometry,mid);
  assert.ok(first.levels.every(({object})=>object.geometry.userData.detail!==spec.heroDetail));
  const camera=new THREE.PerspectiveCamera();
  camera.position.set(0,0,6);camera.updateMatrixWorld();first.update(camera);
  assert.equal(first.getCurrentLevel(),1);
  assert.equal(first.levels[0].object.geometry,mid,'ordinary view does not realize the hero');
  camera.position.z=.11;camera.updateMatrixWorld();first.update(camera);
  const hero=first.levels[0].object.geometry;
  assert.equal(first.getCurrentLevel(),0);
  assert.equal(hero.userData.detail,spec.heroDetail);
  assert.notEqual(hero,mid);
  assert.equal(first.levels[1].object.geometry,mid,'realization preserves the gameplay buffer');
  const second=createLoftBallVisual({radius:spec.physicalRadius}).children[0];
  assert.equal(second.levels[0].object.geometry,mid);
  second.update(camera);
  assert.equal(second.levels[0].object.geometry,hero,'later inspectors share the realized hero buffer');
});

const physical=buildLoftBallGeometry(spec.physicalRadius,spec.heroDetail);

check('all 338 hero dimples have dense curved geometry and full physical depth',()=>{
  const position=physical.attributes.position,normal=physical.attributes.normal;
  const samples=new Uint16Array(338),peaks=new Float64Array(338),unique=new Map();
  for(let i=0;i<position.count;i++){
    const p=new THREE.Vector3().fromBufferAttribute(position,i);
    const n=new THREE.Vector3().fromBufferAttribute(normal,i);
    assert.ok(Math.abs(n.length()-1)<1e-6);
    const key=p.toArray().map(v=>Math.round(v*1e10)).join(':');
    if(unique.has(key)){assert.ok(n.distanceTo(unique.get(key))<1e-6);continue;}
    unique.set(key,n);
    const radius=p.length();assert.ok(radius<=spec.physicalRadius+3e-9);
    assert.ok(radius>=spec.physicalRadius-spec.dimpleDepth-3e-9);
    const {index,dot}=nearest(p.normalize());
    if(dot>edge){samples[index]++;peaks[index]=Math.max(peaks[index],spec.physicalRadius-radius);}
  }
  assert.equal(samples.filter(Boolean).length,338);
  // Count unique deformed Float32 positions, not repeated triangle vertices.
  assert.ok(Math.min(...samples)>=36,`minimum samples ${Math.min(...samples)}`);
  assert.ok(Math.min(...peaks)>=spec.dimpleDepth*.95,`shallowest bowl ${Math.min(...peaks)}`);
  assert.equal(physical.index.count/3,46080);
  const bytes=Object.values(physical.attributes).reduce((sum,attr)=>sum+attr.array.byteLength,physical.index.array.byteLength);
  assert.ok(bytes<2_000_000,`hero buffer budget ${bytes}`);
});

check('surface normals agree with finite-difference geometry instead of flat triangle seams',()=>{
  const surface=direction=>{
    const {dot}=nearest(direction),t=Math.max(0,(dot-edge)/(1-edge));
    return direction.clone().multiplyScalar(1-depth*t*t*(3-2*t));
  };
  const p=physical.attributes.position,n=physical.attributes.normal;
  for(let i=53;i<p.count;i+=997){
    const u=new THREE.Vector3().fromBufferAttribute(p,i).normalize();
    const tangent=new THREE.Vector3(0,1,0).cross(u).normalize();
    const bitangent=u.clone().cross(tangent).normalize();
    const derivative=axis=>surface(u.clone().addScaledVector(axis,1e-5).normalize()).sub(surface(u.clone().addScaledVector(axis,-1e-5).normalize()));
    const measured=derivative(tangent).cross(derivative(bitangent)).normalize();
    assert.ok(measured.dot(new THREE.Vector3().fromBufferAttribute(n,i))>.99999);
  }
});

check('gameplay, inspection and ghost reuse physical buffers without changing display/contact radii',()=>{
  const playable=createLoftBallVisual(),inspection=createLoftBallVisual({radius:spec.physicalRadius}),ghost=createLoftBallVisual({ghost:true});
  const gameLod=playable.children[0],inspectionLod=inspection.children[0];
  assert.equal(gameLod.levels.length,3);
  for(let i=0;i<3;i++){
    const a=gameLod.levels[i].object,b=inspectionLod.levels[i].object;
    assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);
    assert.ok(Math.abs(a.scale.x*spec.physicalRadius-.026)<1e-12);
    assert.equal(b.scale.x,1);
  }
  assert.equal(ghost.children[0].geometry,gameLod.levels[2].object.geometry);
  const camera=new THREE.PerspectiveCamera();
  for(const [distance,level] of [[.11,0],[1,1],[20,2]]){
    camera.position.set(0,0,distance);camera.updateMatrixWorld();gameLod.update(camera);
    assert.equal(gameLod.getCurrentLevel(),level);
    assert.equal(gameLod.levels.filter(item=>item.object.visible).length,1);
  }
  const far=gameLod.levels[2].object.geometry;
  const represented=new Set();
  for(let i=0;i<far.attributes.position.count;i++){
    const {index,dot}=nearest(new THREE.Vector3().fromBufferAttribute(far.attributes.position,i).normalize());
    if(dot>edge)represented.add(index);
  }
  assert.equal(represented.size,338);
  assert.ok(far.index.count/3<=1620);
});

check('one permanent signature follows the surface across all LODs',()=>{
  const signature=new THREE.Vector3(...spec.signatureDirection).normalize();
  assert.ok(centers[0].distanceTo(signature)<1e-10);
  const visual=createLoftBallVisual();
  for(const {object} of visual.children[0].levels){
    const p=object.geometry.attributes.position,c=object.geometry.attributes.color;
    let colored=0;
    for(let i=0;i<p.count;i++)if(c.getX(i)>c.getY(i)*2){
      const direction=new THREE.Vector3().fromBufferAttribute(p,i).normalize();
      assert.ok(direction.dot(signature)>edge-1e-7);colored++;
    }
    assert.ok(colored>0);
    const shader={vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};
    object.material.onBeforeCompile(shader);
    assert.match(shader.vertexShader,/normalize\(position\)/);
    assert.match(shader.fragmentShader,/fwidth\(loftSignatureDot\)/);
    assert.equal(object.material.emissive.getHex(),0);
  }
});

check('Workshop borrows and restores one renderer, bounds input, and stops drawing at rest',()=>{
  globalThis.ResizeObserver=class{observe(){} disconnect(){}};
  const listeners=new Map(),attrs=new Map(),original={insertBefore(canvas){canvas.parentNode=this;}};
  const canvas={parentNode:original,nextSibling:null,tabIndex:0,getAttribute:key=>attrs.get(key)??null,setAttribute:(key,value)=>attrs.set(key,value),removeAttribute:key=>attrs.delete(key)};
  let draws=0,size=new THREE.Vector2(1280,720);
  const renderer={domElement:canvas,toneMappingExposure:.93,getSize:target=>target.copy(size),setSize:(x,y)=>size.set(x,y),render:()=>{draws++;}};
  const host={appendChild:canvas=>{canvas.parentNode=host;},addEventListener:(name,fn)=>listeners.set(name,fn),getBoundingClientRect:()=>({width:520,height:320}),classList:{add(){},remove(){}},hasPointerCapture:()=>false};
  const atelier=new LoftBallAtelier(renderer,host);
  atelier.open();assert.equal(canvas.parentNode,host);assert.equal(canvas.tabIndex,-1);
  assert.equal(size.x,520);assert.equal(draws,1);atelier.render(1/60);assert.equal(draws,1);
  for(let i=0;i<30;i++)atelier.zoom(-1);
  assert.equal(atelier.targetDistance,BALL_ATELIER_SPEC.minDistance);
  for(let i=0;i<60;i++)atelier.zoom(1);
  assert.equal(atelier.targetDistance,BALL_ATELIER_SPEC.maxDistance);
  listeners.get('keydown')({key:'ArrowRight',preventDefault(){},stopPropagation(){}});
  atelier.render(1/60);assert.ok(atelier.yaw>0&&atelier.yaw<atelier.targetYaw);
  atelier.reset();assert.equal(atelier.targetYaw,0);
  for(let i=0;i<120;i++)atelier.render(1/60);
  const settledDraws=draws;atelier.render(1/60);assert.equal(draws,settledDraws);
  atelier.close();assert.equal(canvas.parentNode,original);assert.equal(canvas.tabIndex,0);
  assert.deepEqual(size.toArray(),[1280,720]);assert.equal(renderer.toneMappingExposure,.93);
  assert.equal(atelier.render(1/60),false);assert.equal(draws,settledDraws);
  atelier.open();assert.equal(canvas.parentNode,host);atelier.close();assert.equal(canvas.parentNode,original);
  delete globalThis.ResizeObserver;
});

console.log(`\nLOFT BALL GAUNTLET: ${passed}/${passed} PASS`);
