import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {createCoastalHinterland,COASTAL_HINTERLAND_SPEC,hinterlandLift} from '../prototype1/coastalHinterland.js';
import {terrainHeight,courseVisualSample} from '../prototype1/worldV2.js';
import {LoftCamera} from '../prototype1/camera.js';
import {ROUND_HOLES} from '../prototype1/round.js';

let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS  '+name);};
const build=()=>createCoastalHinterland(terrainHeight,(x,z)=>courseVisualSample(x,z).color);
const mesh=build(),g=mesh.geometry,p=g.attributes.position,index=g.index;
mesh.updateMatrixWorld(true);

check('authored hinterland is deterministic bounded scenery entirely outside the playable recovery envelope',()=>{
  assert.ok(index.count/3<=COASTAL_HINTERLAND_SPEC.maxTriangles);
  assert.equal(mesh.castShadow,false);assert.equal(mesh.material.map,null);
  assert.equal(mesh.material.roughness,1);assert.equal(mesh.material.metalness,0);
  const normal=g.attributes.normal,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<index.count;i+=3){
    const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    assert.ok(ids.every(j=>p.getX(j)<=-92)||ids.every(j=>p.getZ(j)<=-292),'whole triangle stays outside the rendered field');
    a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
    assert.ok(new THREE.Triangle(a,b,c).getNormal(new THREE.Vector3()).y>0,'upward nondegenerate terrain winding');
  }
  for(let i=0;i<p.count;i++){
    assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(normal.getX(i),normal.getY(i),normal.getZ(i))-1)<1e-5);
  }
  assert.ok(g.boundingBox.max.y<35,'ridgeline frames the course rather than a mountain wall');
  const fingerprint=geometry=>createHash('sha256').update(Buffer.from(geometry.attributes.position.array.buffer))
    .update(Buffer.from(geometry.attributes.color.array.buffer)).update(Buffer.from(geometry.index.array.buffer)).digest('hex');
  const again=build();assert.equal(fingerprint(g),fingerprint(again.geometry));again.geometry.dispose();again.material.dispose();
});

check('every 0.8 metre field seam remains physically coincident and color-continuous',()=>{
  let west=0,north=0;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    const seamWest=x===-92&&z>=-292,seamNorth=z===-292&&x>=-92;
    if(!seamWest&&!seamNorth)continue;
    // Compare against the same Float32 field vertices, allowing only the tiny
    // Float32 X/Z interpolation error at a stored 0.8 m station.
    assert.ok(Math.abs(p.getY(i)-terrainHeight(x,z))<.00001,'no floating apron or hidden terrain overlay');
    assert.ok(hinterlandLift(x,z)<1e-9,'authored lift vanishes at the existing edge');
    const col=new THREE.Color().setRGB(...courseVisualSample(x,z).color).convertSRGBToLinear();
    const stored=g.attributes.color;
    assert.ok(Math.abs(col.r-stored.getX(i))<.00002&&Math.abs(col.g-stored.getY(i))<.00002&&Math.abs(col.b-stored.getZ(i))<.00002);
    if(seamWest)west++;if(seamNorth)north++;
  }
  assert.equal(west,431,'every western field-edge vertex is retained');
  assert.equal(north,146,'every northern apron seam vertex is retained');
});

check('real camera frames retain visible landform relief without occluding golf targets or landmarks',()=>{
  const point=([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+.026,z);
  for(const aspect of [1280/720,390/844,844/390])for(const hole of ROUND_HOLES){
    for(const approach of [false,true]){
      const pin=point(hole.pin),ball=approach?pin.clone().add(new THREE.Vector3(0,0,38)):point(hole.tee);
      ball.y=terrainHeight(ball.x,ball.z)+.026;
      const camera=new THREE.PerspectiveCamera(43,aspect,.1,750),controller=new LoftCamera(camera,{terrainHeight});
      const yaw=Math.atan2(pin.x-ball.x,-(pin.z-ball.z));
      for(let i=0;i<180;i++)controller.updateAim(1/60,{ball,pin,aimYaw:yaw,putting:false});
      camera.updateMatrixWorld(true);let visible=0,maxRelief=0;
      for(let i=0;i<p.count;i++){
        const world=new THREE.Vector3().fromBufferAttribute(p,i),screen=world.clone().project(camera);
        if(screen.z<0||screen.z>1||Math.abs(screen.x)>.98||Math.abs(screen.y)>.98)continue;
        const ground=world.clone();ground.y=terrainHeight(world.x,world.z);ground.project(camera);
        const relief=(screen.y-ground.y)*.5;
        if(relief>.008){visible++;maxRelief=Math.max(maxRelief,relief);}
      }
      assert.ok(visible>=12&&maxRelief>.015,'actual hill geometry is perceptible, not only present in scene data');
      // Current worldV2 lighthouse: (38.5, terrainHeight(38.5,-172), -172),
      // scale .82, lantern-room center y=11.70 in its authored local frame.
      for(const landmark of [pin,new THREE.Vector3(-39,terrainHeight(-39,-151)+5,-151),new THREE.Vector3(38.5,terrainHeight(38.5,-172)+11.7*.82,-172)]){
        const direction=landmark.clone().sub(camera.position),distance=direction.length();
        const ray=new THREE.Raycaster(camera.position,direction.normalize(),0,distance-.1);
        assert.equal(ray.intersectObject(mesh,false).length,0,'scenery never stands in front of the pin, clubhouse or lighthouse');
      }
    }
  }
});

console.log(`\nLOFT HINTERLAND GAUNTLET: ${passed}/${passed} PASS`);
