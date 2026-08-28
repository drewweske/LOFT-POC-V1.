import * as THREE from '../vendor/three.module.js';

export const COLORS={ink:0x0B0D0D,cream:0xF2EFE8,stone:0xB8B1A6,orange:0xFF6A2A,rough:0x496548,fair:0x7e9a70,green:0x91ab7e,sand:0xd7c39a,water:0x4f7178,rock:0x817566,sky:0xcbd8d7};

export function terrainHeight(x,z){
  const micro=
    .32*Math.sin((z+28)*.034)+
    .17*Math.sin((z-20)*.071)+
    .12*Math.sin(x*.108+z*.018)-
    .30*Math.exp(-(x*x+z*z)/190);

  // Broad authored landform: Coastal Ridge rises as the player approaches
  // the green instead of reading as a flat rectangular fairway.
  const approachRise=
    1.18*Math.exp(-Math.pow((z+145)/48,2))*
    (.72+.28*Math.exp(-Math.pow((x+4)/34,2)));

  const midShoulder=
    .42*Math.exp(-Math.pow((z+82)/38,2))*
    (.65+.35*Math.exp(-Math.pow((x+2)/28,2)));

  return micro+approachRise+midShoulder;
}

const mat=(c,r=.9,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});

function makeSurfaceTexture(repeatX=18,repeatY=34,grain=.055){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const x=canvas.getContext('2d');
  x.fillStyle='#f4f2ec';x.fillRect(0,0,128,128);
  for(let i=0;i<1700;i++){
    const v=225+Math.floor(Math.random()*25);
    x.fillStyle='rgba('+v+','+v+','+v+','+(grain*(.45+Math.random()*.75))+')';
    x.fillRect(Math.random()*128,Math.random()*128,1,1+Math.random()*2.2);
  }
  const t=new THREE.CanvasTexture(canvas);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

export function buildWorld(scene,pin){
  const world=new THREE.Group();scene.add(world);
  const roughTex=makeSurfaceTexture(18,32,.045);
  const fairTex=makeSurfaceTexture(5,2,.040);
  const greenTex=makeSurfaceTexture(8,8,.032);
  const sandTex=makeSurfaceTexture(7,7,.070);

  const terrainGeo=new THREE.PlaneGeometry(150,290,64,116);terrainGeo.rotateX(-Math.PI/2);
  const p=terrainGeo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)-115;p.setZ(i,z);p.setY(i,terrainHeight(x,z));}
  p.needsUpdate=true;terrainGeo.computeVertexNormals();
  const roughMat=mat(COLORS.rough,.94);roughMat.map=roughTex;
  const terrain=new THREE.Mesh(terrainGeo,roughMat);terrain.receiveShadow=true;world.add(terrain);

  function buildFairway(){
    const segments=92;
    const pos=[],idx=[],uv=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments;
      const z=-2-t*220;
      const center=-1.0 + Math.sin(t*Math.PI*1.5)*1.8 - Math.sin(t*Math.PI*3.1)*.85;
      const width=9.5 + 7.2*Math.sin(Math.PI*t) + 1.7*Math.sin(t*Math.PI*3.0);
      const leftX=center-width, rightX=center+width;
      pos.push(leftX,terrainHeight(leftX,z)+.048,z,rightX,terrainHeight(rightX,z)+.048,z);
      uv.push(0,t*18,1,t*18);
      if(i<segments){
        const a=i*2,b=a+1,c=a+2,d=a+3;
        idx.push(a,c,b,b,c,d);
      }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setIndex(idx);g.computeVertexNormals();
    const fairMat=mat(COLORS.fair,.90);fairMat.map=fairTex;
    const m=new THREE.Mesh(g,fairMat);m.receiveShadow=true;world.add(m);
    return m;
  }
  buildFairway();

  const gg=new THREE.CircleGeometry(18,72);gg.rotateX(-Math.PI/2);
  const greenMat=mat(COLORS.green,.86);greenMat.map=greenTex;
  const green=new THREE.Mesh(gg,greenMat);green.scale.set(1.36,1,1);green.position.set(pin.x,pin.y+.06,pin.z);green.receiveShadow=true;world.add(green);
  const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(.13,40),new THREE.MeshBasicMaterial({color:COLORS.ink,side:THREE.DoubleSide}));
  holeDisc.rotation.x=-Math.PI/2;holeDisc.position.set(pin.x,pin.y+.071,pin.z);world.add(holeDisc);

  function bunker(x,z,sx,sz,seed){
    const sh=new THREE.Shape();const pts=[];
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2,w=1+.14*Math.sin(a*3+seed)+.06*Math.cos(a*5-seed);pts.push(new THREE.Vector2(Math.cos(a)*sx*w,Math.sin(a)*sz*w));}
    sh.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i].x,pts[i].y);sh.closePath();
    const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);
    const bunkerMat=mat(COLORS.sand,.97);bunkerMat.map=sandTex;
    const b=new THREE.Mesh(g,bunkerMat);b.position.set(x,terrainHeight(x,z)+.075,z);b.receiveShadow=true;world.add(b);
  }
  bunker(-14,pin.z+8,8,4.1,.4);bunker(17,pin.z-3,7.2,3.6,1.7);bunker(12,-94,5.3,2.7,2.8);

  const water=new THREE.Mesh(new THREE.PlaneGeometry(126,290),new THREE.MeshStandardMaterial({color:COLORS.water,roughness:.32,metalness:.04,transparent:true,opacity:.94}));
  water.rotation.x=-Math.PI/2;water.position.set(94,-.38,-115);world.add(water);

  function cliff(x,z,w,d,h,rot=0){
    const g=new THREE.BoxGeometry(w,h,d,3,3,3);const m=new THREE.Mesh(g,mat(COLORS.rock,.94));m.position.set(x,terrainHeight(x,z)+h*.36,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;world.add(m);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w*.95,.16,d*.95),mat(0x758569,.99));cap.position.set(x,m.position.y+h*.52,z);cap.rotation.y=rot;world.add(cap);
  }
  cliff(38,-45,15,20,3.4,.06);cliff(40,-76,18,25,4.5,-.04);cliff(40,-110,17,27,5.1,.04);cliff(38,-145,20,26,5.6,-.03);cliff(36,-180,20,22,4.5,.08);

  function pine(x,z,s=1){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.27*s,2.3*s,8),mat(0x5b4635,.98));trunk.position.y=1.15*s;trunk.castShadow=true;g.add(trunk);
    const c1=new THREE.Mesh(new THREE.ConeGeometry(1.95*s,4.4*s,9),mat(0x294632,.98));c1.position.y=3.9*s;c1.castShadow=true;g.add(c1);
    const c2=new THREE.Mesh(new THREE.ConeGeometry(1.42*s,3.2*s,9),mat(0x365a3e,.98));c2.position.y=5.4*s;c2.castShadow=true;g.add(c2);
    g.position.set(x,terrainHeight(x,z),z);world.add(g);
  }
  [[-30,-25,1],[-33,-49,.84],[-29,-75,1.08],[-33,-111,.95],[-29,-138,1.12],[-25,-166,.82],[29,-34,.78],[28,-68,.70],[30,-124,.82],[-20,-184,.72]].forEach(v=>pine(...v));

  const lodge=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(9,2.3,5.5),mat(0x665c4d,.92));base.position.y=1.15;base.castShadow=true;lodge.add(base);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(7.5,1.7,4.4),mat(0xc6bda9,.94));upper.position.y=3.0;upper.castShadow=true;lodge.add(upper);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(8.3,.28,5.2),mat(COLORS.ink,.84));roof.position.y=4.0;lodge.add(roof);
  lodge.position.set(-23,terrainHeight(-23,-154),-154);lodge.rotation.y=.10;lodge.scale.set(.92,.92,.92);world.add(lodge);

  const lighthouse=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.9,11.5,16),mat(COLORS.cream,.94));tower.position.y=5.75;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.82,1.82,.68,16),mat(COLORS.orange,.82));band.position.y=9.8;lighthouse.add(band);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.75,1.75,1.2,16),mat(0x343c3c,.5,.12));room.position.y=11.45;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(2.05,2.6,16),mat(COLORS.ink,.82));roof2.position.y=13.3;lighthouse.add(roof2);
  lighthouse.position.set(30,terrainHeight(30,-166),-166);lighthouse.scale.set(.90,.90,.90);world.add(lighthouse);

  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,4.5,8),mat(COLORS.cream,.9));pole.position.set(pin.x,pin.y+2.25,pin.z);world.add(pole);
  const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(2.2,.55);fs.lineTo(0,1.1);fs.closePath();
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),new THREE.MeshStandardMaterial({color:COLORS.orange,side:THREE.DoubleSide,roughness:.82}));flag.position.set(pin.x,pin.y+3.9,pin.z);flag.rotation.y=Math.PI/2;world.add(flag);

  function setPin(next){
    green.position.set(next.x,next.y+.06,next.z);
    holeDisc.position.set(next.x,next.y+.071,next.z);
    pole.position.set(next.x,next.y+2.25,next.z);
    flag.position.set(next.x,next.y+3.9,next.z);
  }

  return {world,green,holeDisc,pole,flag,setPin};
}