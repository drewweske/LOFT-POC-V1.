import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createClubHead,createClubInspectionModel} from '../prototype1/clubAssembly.js';
import {LoftGolferRig} from '../prototype1/characterRig.js';
import {CLUBS,LEVELS} from '../prototype1/equipment.js';

const levels=[1,10,25,50,75],wedges=CLUBS.filter(c=>c.id==='pw'||c.id==='sw');
const COLORS={ink:0x0b0d0d,cream:0xf2efe8,stone:0xb8b1a6,orange:0xff6a2a};
const soleOf=head=>head.children.find(part=>part.name==='LOFT_WEDGE_RELIEF_SOLE');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS  '+name);};

// Measured from transformed mesh vertices at clean 309d09f, not transformed
// bounding boxes. Both wedge IDs shared this exact capsule/support baseline.
const BASELINE_MIN_Y=Object.freeze({
  1:Object.freeze({address:.015212333776546942,impact:-.0004894170815327656}),
  10:Object.freeze({address:.012014263681492803,impact:.0016688461099709802}),
  25:Object.freeze({address:.00732180028988199,impact:.005329704945550053}),
  50:Object.freeze({address:.003010511754327301,impact:.011491374825808089}),
  75:Object.freeze({address:.004312352054015407,impact:.01305611790616507})
});

function triangles(geometry,callback){
  const p=geometry.attributes.position,index=geometry.index,count=index?index.count:p.count;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<count;i+=3){
    a.fromBufferAttribute(p,index?index.getX(i):i);
    b.fromBufferAttribute(p,index?index.getX(i+1):i+1);
    c.fromBufferAttribute(p,index?index.getX(i+2):i+2);
    callback(a,b,c,i);
  }
}
function bottomZ(geometry,x,y){
  const ray=new THREE.Ray(new THREE.Vector3(x,y,-1),new THREE.Vector3(0,0,1)),hit=new THREE.Vector3();
  let bottom=Infinity;
  triangles(geometry,(a,b,c)=>{if(ray.intersectTriangle(a,b,c,false,hit))bottom=Math.min(bottom,hit.z);});
  assert.ok(Number.isFinite(bottom),`underside probe must hit actual triangles at ${x},${y}`);
  return bottom;
}
function centerSection(geometry){
  let minX=Infinity,maxX=-Infinity;
  const include=x=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);};
  triangles(geometry,(a,b,c)=>{
    const points=[a,b,c];
    for(let k=0;k<3;k++){
      const p=points[k],q=points[(k+1)%3];
      if(Math.abs(p.y)<1e-9)include(p.x);
      if(p.y*q.y<0)include(p.x+(q.x-p.x)*(-p.y/(q.y-p.y)));
    }
  });
  assert.ok(Number.isFinite(minX)&&maxX>minX,'actual central triangle section exists');
  return {minX,maxX,width:maxX-minX};
}
function soleMeasurements(mesh,ball){
  const position=mesh.geometry.attributes.position,v=new THREE.Vector3();
  let minY=Infinity,distance=Infinity;
  for(let i=0;i<position.count;i++)minY=Math.min(minY,v.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld).y);
  const triangle=new THREE.Triangle(),closest=new THREE.Vector3();
  triangles(mesh.geometry,(a,b,c)=>{
    a.applyMatrix4(mesh.matrixWorld);b.applyMatrix4(mesh.matrixWorld);c.applyMatrix4(mesh.matrixWorld);
    triangle.set(a,b,c);
    // A degenerate triangle has no physical area; topology test rejects one in
    // the new surface, while avoiding NaN from a closest-point denominator.
    if(triangle.getArea()<=1e-12)return;
    triangle.closestPointToPoint(ball,closest);distance=Math.min(distance,closest.distanceTo(ball));
  });
  return {minY,ballGap:distance-.026};
}

check('purpose-built wedge soles are closed outward-wound physical surfaces within one bounded draw',()=>{
  for(const item of wedges)for(const level of levels){
    const head=createClubHead(item,level).head,sole=soleOf(head),g=sole.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
    const label=item.id+'/'+level;
    assert.equal(head.children.filter(part=>part.userData.clubRole==='sole').length,1,label+' one sole, no ornamental stack');
    assert.ok(index&&index.count/3<=1024,label+' indexed 1024-triangle budget');
    assert.ok(head.children.length<=14,label+' existing assembly draw budget');
    const weld=new Map(),ids=[],edges=new Map();let nextId=0,volume=0;
    for(let i=0;i<p.count;i++){
      const coordinates=[p.getX(i),p.getY(i),p.getZ(i)];assert.ok(coordinates.every(Number.isFinite),label+' finite vertices');
      const key=coordinates.map(value=>Math.round(value*1e7)).join(':');
      if(!weld.has(key))weld.set(key,nextId++);ids[i]=weld.get(key);
      assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5,label+' unit physical shading normals');
    }
    triangles(g,(a,b,c,offset)=>{
      assert.ok(new THREE.Triangle(a,b,c).getArea()>1e-12,label+' no degenerate surface triangles');
      volume+=a.dot(b.clone().cross(c))/6;
      const corners=[ids[index.getX(offset)],ids[index.getX(offset+1)],ids[index.getX(offset+2)]];
      for(let k=0;k<3;k++){
        const from=corners[k],to=corners[(k+1)%3],key=Math.min(from,to)+':'+Math.max(from,to),edge=edges.get(key)||{count:0,winding:0};
        edge.count++;edge.winding+=from<to?1:-1;edges.set(key,edge);
      }
    });
    assert.ok(volume>1e-7&&volume<.0001,label+' positive enclosed sole volume');
    for(const edge of edges.values()){assert.equal(edge.count,2,label+' closed welded boundary');assert.equal(edge.winding,0,label+' outward-consistent winding');}
    // A closed mesh can still fold through itself. Rays must enter through the
    // underside and exit once through the top, with real metal between them.
    g.computeBoundingBox();const box=g.boundingBox,hit=new THREE.Vector3();
    for(const u of [.2,.5,.8])for(const v of [.3,.53,.7]){
      const x=box.min.x+(box.max.x-box.min.x)*u,y=box.min.y+(box.max.y-box.min.y)*v;
      const ray=new THREE.Ray(new THREE.Vector3(x,y,-1),new THREE.Vector3(0,0,1)),hits=[];
      triangles(g,(a,b,c)=>{if(ray.intersectTriangle(a,b,c,false,hit)){
        const normal=new THREE.Triangle(a,b,c).getNormal(new THREE.Vector3());
        if(!hits.some(existing=>Math.abs(existing.z-hit.z)<1e-7))hits.push({z:hit.z,normalZ:normal.z});
      }});
      hits.sort((a,b)=>a.z-b.z);assert.equal(hits.length,2,label+' no folded/self-intersecting support');
      assert.ok(hits[1].z-hits[0].z>=.001,label+' at least 1 mm of physical thickness');
      assert.ok(hits[0].normalZ<0&&hits[1].normalZ>0,label+' underside/top never invert');
    }
  }
});

check('sand wedges own a wider working sole than pitching wedges at every construction grade',()=>{
  for(const level of levels){
    const sections=wedges.map(item=>centerSection(soleOf(createClubHead(item,level).head).geometry));
    const pw=sections[wedges.findIndex(item=>item.id==='pw')],sw=sections[wedges.findIndex(item=>item.id==='sw')];
    assert.ok(sw.width>=pw.width*1.5,level+' actual SW face-to-back section is at least 1.5x PW');
    assert.ok(pw.width>=.012&&sw.width<=.050,level+' physical sole dimensions, not an arbitrary display scale');
    if(process.argv.includes('--report'))console.log('width',level,{pw:pw.width,sw:sw.width,ratio:sw.width/pw.width});
  }
});

check('actual underside triangles carry convex camber, trailing relief and lifted heel/toe edges',()=>{
  for(const item of wedges)for(const level of levels){
    const g=soleOf(createClubHead(item,level).head).geometry,section=centerSection(g),label=item.id+'/'+level;
    g.computeBoundingBox();const ySpan=g.boundingBox.max.y-g.boundingBox.min.y;
    const x=station=>section.minX+section.width*station;
    const leading=bottomZ(g,x(.15),0),middle=bottomZ(g,x(.50),0),trailing=bottomZ(g,x(.85),0);
    // The sole may carry an authored linear tangent compensation inside the
    // posed head frame. A chord/tangent test cancels that tilt; raw local Z
    // differences alone would mistake native orientation for physical camber.
    assert.ok(.5*(leading+trailing)-middle>=.0005,label+' convex center lies below the leading/trailing chord');
    const tangent35=bottomZ(g,x(.35),0),trailingTangent=middle+(middle-tangent35)*(.85-.50)/(.50-.35);
    assert.ok(trailing-trailingTangent>=.0005,label+' trailing relief rises above working-section tangent');
    for(const sign of [-1,1])assert.ok(bottomZ(g,x(.50),sign*ySpan*.35)-middle>=.0005,label+' deliberate heel/toe lift');
    const depths=[.25,.375,.5,.625,.75].map(station=>bottomZ(g,x(station),0));
    for(let i=1;i<depths.length-1;i++)assert.ok(depths[i]<=.5*(depths[i-1]+depths[i+1])+.00005,label+' convex supporting section, no concave trough');
    if(process.argv.includes('--report'))console.log('camber',label,{leading,middle,trailing,heel:bottomZ(g,x(.50),-ySpan*.35),toe:bottomZ(g,x(.50),ySpan*.35)});
  }
});

check('new soles remain ball-clear and preserve the measured address/impact support envelope',()=>{
  const rig=new LoftGolferRig(COLORS);
  for(const item of wedges)for(const level of levels){
    rig.setClub(item,level);
    const shown=createClubInspectionModel(item,level),shownSole=soleOf(shown.getObjectByName('LOFT_OBJECT_HEAD'));
    const heldSole=soleOf(rig.clubHead),label=item.id+'/'+level;
    assert.equal(heldSole.geometry,shownSole.geometry,label+' actual held and inspected buffer identity');
    assert.equal(heldSole.material,shownSole.material,label+' actual held and inspected material identity');
    assert.deepEqual(heldSole.position.toArray(),shownSole.position.toArray());assert.deepEqual(heldSole.scale.toArray(),shownSole.scale.toArray());
    for(const [name,phase] of [['address',0],['impact',.60]]){
      rig.setPose(phase,LEVELS[level]);rig.group.updateMatrixWorld(true);
      const measured=soleMeasurements(heldSole,rig.addressBallLocal),old=BASELINE_MIN_Y[level][name];
      assert.ok(measured.minY>=Math.min(0,old)-.0002,label+'/'+name+' actual penetration does not worsen by more than 0.2 mm');
      assert.ok(measured.minY<=old+.002,label+'/'+name+' actual hovering does not increase by more than 2 mm');
      if(name==='address')assert.ok(measured.ballGap>=.001,label+' actual sole is clear of the addressed ball by at least 1 mm');
      if(process.argv.includes('--report'))console.log('contact',label,name,{oldMinY:old,...measured});
    }
  }
});

console.log(`\nLOFT WEDGE SOLE GAUNTLET: ${passed}/${passed} PASS`);
