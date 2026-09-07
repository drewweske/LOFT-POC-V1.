import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {createClubHead} from '../prototype1/clubAssembly.js';
import {CLUBS} from '../prototype1/equipment.js';

let passed=0;const check=(name,test)=>{test();passed++;console.log('PASS  '+name);};
const grades=[1,10,25,50,75],items=CLUBS.filter(c=>['iron','wedge'].includes(c.head));
function backX(geometry,y,z){
  const ray=new THREE.Ray(new THREE.Vector3(1,y,z),new THREE.Vector3(-1,0,0));
  const p=geometry.attributes.position,index=geometry.index;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3();
  let back=-Infinity;
  for(let i=0;i<index.count;i+=3){
    a.fromBufferAttribute(p,index.getX(i));b.fromBufferAttribute(p,index.getX(i+1));c.fromBufferAttribute(p,index.getX(i+2));
    if(ray.intersectTriangle(a,b,c,false,hit))back=Math.max(back,hit.x);
  }
  assert.ok(Number.isFinite(back),'probe intersects actual back triangles');return back;
}
const bodyOf=head=>head.children.find(p=>p.userData.clubRole==='forged-body');

check('every forging is a closed outward-wound manifold inside a bounded geometry budget',()=>{
  for(const item of items)for(const level of grades){
    const body=bodyOf(createClubHead(item,level).head),g=body.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
    assert.ok(index&&index.count/3<=1024,'back shell stays within 1024 triangles');
    const edges=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let volume=0;
    for(let i=0;i<index.count;i+=3){
      const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
      a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
      volume+=a.dot(b.clone().cross(c))/6;
      for(let k=0;k<3;k++){const from=ids[k],to=ids[(k+1)%3],key=Math.min(from,to)+':'+Math.max(from,to);const edge=edges.get(key)||{count:0,winding:0};edge.count++;edge.winding+=from<to?1:-1;edges.set(key,edge);}
    }
    assert.ok(volume>1e-5&&volume<.001,'positive enclosed physical volume');
    for(const edge of edges.values()){assert.equal(edge.count,2,'no open boundary');assert.equal(edge.winding,0,'consistent winding');}
    for(let i=0;i<p.count;i++){
      assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5,'finite unit shading normal');
    }
  }
});

check('physical section progresses from solid casting to a genuinely recessed forged cavity',()=>{
  for(const item of items){
    let lastDepth=-Infinity;
    for(const level of grades){
      const head=createClubHead(item,level).head,body=bodyOf(head),g=body.geometry;
      g.computeBoundingBox();
      const center=backX(g,0,0),shoulder=backX(g,0,g.boundingBox.min.z*.62),depth=shoulder-center;
      const vertices=g.attributes.position,normals=g.attributes.normal;let planarSamples=0;
      for(let i=0;i<vertices.count;i++)if(Math.abs(vertices.getX(i)-center)<1e-8){
        assert.ok(normals.getX(i)>.99999,'broad back/floor plane must not shade as a cushion');planarSamples++;
      }
      assert.ok(planarSamples>=65,'flat region is geometrically represented, not only claimed');
      if(process.argv.includes('--report'))console.log(item.id,level,{center,shoulder,depth});
      if(level===1)assert.ok(depth<.004,'affordable casting has a solid back');
      else assert.ok(depth>.005,'recess is more than a painted or coplanar patch');
      assert.ok(depth>lastDepth,'successive construction grades refine the physical section');lastDepth=depth;
      const insert=head.children.find(p=>p.userData.clubRole==='cavity');
      if(insert){
        insert.geometry.computeBoundingBox();
        const insertBack=insert.position.x+insert.geometry.boundingBox.max.x;
        assert.ok(insertBack<body.position.x+shoulder-.003,'insert sits inside the metal shoulder, not atop the back');
        assert.ok(insertBack>body.position.x+center,'insert remains visible above the cavity floor');
      }
    }
  }
});

check('tier progression owns different geometry and restrained readable body finishes without altering the strike face',()=>{
  for(const item of items){
    const signatures=new Set();
    for(const level of grades){
      const head=createClubHead(item,level).head,body=bodyOf(head),material=body.material;
      signatures.add(createHash('sha256').update(Buffer.from(body.geometry.attributes.position.array.buffer)).digest('hex'));
      assert.ok(material.roughness>=.30&&material.roughness<=.65,'satin/utility, not mirror polish');
      assert.ok(material.metalness>=.45&&material.metalness<=.80,'intentional metal response');
      assert.equal(material.emissive.getHex(),0,'no emissive rarity');
      const bodyLight=(material.color.r+material.color.g+material.color.b)/3;
      assert.ok(bodyLight>.20,'body mass survives the dark product field');
      if(level===75)assert.ok(bodyLight>.50,'pearl tier no longer contradicts its finish with a black body');
      assert.ok(head.children.length<=14);
      if(level>=50)assert.equal(head.children.find(p=>p.userData.clubRole==='cavity-bridge').geometry.type,'ExtrudeGeometry','shaped rising muscle replaces the rectangular badge');
    }
    assert.equal(signatures.size,5,'product progression is physical construction, not recoloring');
  }
});

console.log(`\nLOFT CLUB FORGING GAUNTLET: ${passed}/${passed} PASS`);
