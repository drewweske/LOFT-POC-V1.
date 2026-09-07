import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {createClubInspectionModel} from '../prototype1/clubAssembly.js';
import {LoftGolferRig} from '../prototype1/characterRig.js';
import {CLUBS,LEVELS} from '../prototype1/equipment.js';

const COLORS={ink:0x0b0d0d,cream:0xf2efe8,stone:0xb8b1a6,orange:0xff6a2a};
const grades=[1,10,25,50,75],heelFamily=c=>c.head==='iron'||c.head==='wedge';
const rig=new LoftGolferRig(COLORS);
let passed=0;
const check=(name,test)=>{test();passed++;console.log('PASS  '+name);};
const near=(a,b,label,tolerance=1e-8)=>assert.ok(a.distanceTo(b)<tolerance,`${label}: ${a.distanceTo(b)}`);

// Reconstruct endpoints from the actual cylinder and its transform. No bridge,
// anchor or contact userData is used to prove the connection. Animated segments
// have the pre-existing 8.5% overlap; removing that gives the intended joint.
function endpoints(mesh,reference,overlap=1){
  const half=mesh.geometry.parameters.height*.5/overlap;
  const inverse=reference.matrixWorld.clone().invert();
  return [-half,half].map(y=>new THREE.Vector3(0,y,0).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
}
function vertices(mesh,reference){
  const inverse=reference.matrixWorld.clone().invert(),p=mesh.geometry.attributes.position,result=[];
  for(let i=0;i<p.count;i++)result.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
  return result;
}
function parts(model){
  const head=model.getObjectByName('LOFT_OBJECT_HEAD');
  return {head,hosel:head.children.find(n=>n.userData.clubRole==='hosel'),
    face:head.children.find(n=>n.userData.clubRole==='face'),
    body:head.children.find(n=>n.userData.clubRole==='forged-body'),
    grip:model.getObjectByName('LOFT_CLUB_GRIP'),shaft:model.getObjectByName('LOFT_CLUB_SHAFT'),ferrule:model.getObjectByName('LOFT_CLUB_FERRULE')};
}
function rayExitExists(mesh,origin,direction){
  const inverse=mesh.matrixWorld.clone().invert();
  const ray=new THREE.Ray(origin.clone(),direction.clone()).applyMatrix4(inverse);
  const geometry=mesh.geometry,p=geometry.attributes.position,index=geometry.index;
  const count=index?index.count:p.count,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3();
  for(let i=0;i<count;i+=3){
    a.fromBufferAttribute(p,index?index.getX(i):i);b.fromBufferAttribute(p,index?index.getX(i+1):i+1);c.fromBufferAttribute(p,index?index.getX(i+2):i+2);
    if(ray.intersectTriangle(a,b,c,false,hit)&&hit.distanceToSquared(ray.origin)>1e-14)return true;
  }
  return false;
}

check('all twenty iron/wedge necks enter the solid heel and meet the ferrule without a floating joint',()=>{
  for(const item of CLUBS.filter(heelFamily))for(const level of grades){
    const model=createClubInspectionModel(item,level),p=parts(model),label=item.id+'/'+level;
    model.updateMatrixWorld(true);
    const [bodyEnd,socket]=endpoints(p.hosel,p.head),[ferruleStart,ferruleEnd]=endpoints(p.ferrule,p.head,1.085);
    near(socket,ferruleEnd,label+' socket to ferrule');
    const [shaftStart,shaftEnd]=endpoints(p.shaft,p.head,1.085),[,gripEnd]=endpoints(p.grip,p.head,1.085);
    near(shaftEnd,ferruleStart,label+' ferrule to shaft');near(shaftStart,gripEnd,label+' shaft to grip');
    assert.ok(Math.abs(ferruleStart.distanceTo(ferruleEnd)-.035)<1e-10,label+' controlled ferrule length');
    assert.ok(Math.abs(p.shaft.geometry.parameters.radiusBottom-.00625)<1e-12,label+' refined shaft radius');
    assert.ok(Math.abs(p.ferrule.geometry.parameters.radiusBottom-.008)<1e-12,label+' refined ferrule radius');
    assert.equal(p.grip.geometry.parameters.radiusBottom,.023,'hand/grip radius is protected');
    // A bounding box alone could bless a disconnected socket at a rounded heel.
    // Intersect actual body triangles from the joint in six directions instead.
    const worldBodyEnd=p.head.localToWorld(bodyEnd.clone());
    for(const xyz of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
      assert.ok(rayExitExists(p.body,worldBodyEnd,new THREE.Vector3(...xyz)),label+' hosel root is inside the actual forged body');
    }
    const actualCap=endpoints(p.ferrule,p.head)[1];
    assert.ok(actualCap.distanceTo(socket)<.0016,label+' bounded visible joint overlap');
  }
});

check('the heel neck leaves the central scoring face unobstructed at every grade',()=>{
  for(const item of CLUBS.filter(heelFamily))for(const level of grades){
    const model=createClubInspectionModel(item,level),p=parts(model),label=item.id+'/'+level;
    model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromPoints(vertices(p.face,p.head));
    const corridorHeel=bounds.getCenter(new THREE.Vector3()).y-bounds.getSize(new THREE.Vector3()).y*.25;
    const socket=endpoints(p.hosel,p.head)[1];
    assert.ok(socket.y<corridorHeel,label+' shaft belongs at the heel, not the face center');
    for(const mesh of [p.hosel,p.ferrule,p.shaft])for(const point of vertices(mesh,p.head)){
      if(point.z>=bounds.min.z&&point.z<=bounds.max.z){
        assert.ok(point.y<corridorHeel,label+' actual neck vertex obstructs the central 50% scoring corridor');
      }
    }
  }
});

check('held and inspected clubs share the exact construction and every rigid joint throughout 101 swing samples',()=>{
  for(const item of CLUBS)for(const level of grades){
    const model=createClubInspectionModel(item,level),shown=parts(model),label=item.id+'/'+level;
    model.updateMatrixWorld(true);rig.setClub(item,level);
    const originals=new Map(['grip','shaft','ferrule'].map(name=>[name,endpoints(shown[name],shown.head,1.085)]));
    for(let i=0;i<rig.clubHead.children.length;i++){
      const held=rig.clubHead.children[i],preview=shown.head.children[i];
      assert.equal(held.geometry,preview.geometry,label+' shared head buffer');assert.equal(held.material,preview.material,label+' shared material');
      assert.deepEqual(held.position.toArray(),preview.position.toArray());assert.deepEqual(held.quaternion.toArray(),preview.quaternion.toArray());assert.deepEqual(held.scale.toArray(),preview.scale.toArray());
    }
    for(let phase=0;phase<=100;phase++){
      rig.setPose(phase/100,LEVELS[level]);rig.group.updateMatrixWorld(true);
      for(const name of ['grip','shaft','ferrule']){
        assert.equal(rig[name].geometry,shown[name].geometry,label+' shared '+name+' buffer');assert.equal(rig[name].material,shown[name].material);
        const actual=endpoints(rig[name],rig.clubHead,1.085),expected=originals.get(name);
        near(actual[0],expected[0],label+'/'+phase+' '+name+' start');near(actual[1],expected[1],label+'/'+phase+' '+name+' end');
        assert.ok(Math.abs(actual[0].distanceTo(actual[1])-expected[0].distanceTo(expected[1]))<1e-9,label+' no telescoping '+name);
      }
      if(heelFamily(item)){
        const heldHosel=rig.clubHead.children.find(n=>n.userData.clubRole==='hosel');
        near(endpoints(heldHosel,rig.clubHead)[1],endpoints(rig.ferrule,rig.clubHead,1.085)[1],label+'/'+phase+' moving socket');
      }
    }
  }
});

const record=o=>({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),
  geometry:o.geometry&&{type:o.geometry.type,index:o.geometry.index&&Array.from(o.geometry.index.array),attrs:Object.fromEntries(Object.entries(o.geometry.attributes).map(([k,v])=>[k,Array.from(v.array)]))},
  material:o.material&&{type:o.material.type,color:o.material.color?.getHex(),roughness:o.material.roughness,metalness:o.material.metalness,clearcoat:o.material.clearcoat,clearcoatRoughness:o.material.clearcoatRoughness,transparent:o.material.transparent,opacity:o.material.opacity,side:o.material.side},
  instances:o.instanceMatrix&&Array.from(o.instanceMatrix.array),children:o.children.map(record)});
check('driver, wood, hybrid and putter retain the frozen twenty-object construction and seven-pose baseline',()=>{
  const result=[];
  for(const item of CLUBS.filter(c=>!heelFamily(c)))for(const level of grades){
    rig.setClub(item,level);const head=record(rig.clubHead);head.p=[0,0,0];head.q=[0,0,0,1];head.s=[1,1,1];
    const phases=[0,.16,.38,.5,.60,.77,1].map(phase=>{rig.setPose(phase,LEVELS[level]);return [rig.clubHead,rig.grip,rig.shaft,rig.ferrule].map(o=>[o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);});
    result.push([item.id,level,head,phases]);
  }
  // Recorded against the clean 55350bd build before the heel attachment edit.
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),'5a21f90f56310c7196d7f56c34a6b753b42a74af64efeae520c06f788d41d5d3');
});

console.log(`\nLOFT CLUB NECK GAUNTLET: ${passed}/${passed} PASS`);
