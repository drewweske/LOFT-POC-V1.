export function buildCoastalRidge(THREE,{C,terrainH,pin}){
  const mat=(c,r=.86,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const world=new THREE.Group();
  world.name='LOFT_Coastal_Ridge';

  const terrainGeo=new THREE.PlaneGeometry(142,245,58,96);
  terrainGeo.rotateX(-Math.PI/2);
  const tp=terrainGeo.attributes.position;
  for(let i=0;i<tp.count;i++){
    const x=tp.getX(i),z=tp.getZ(i)-103;
    tp.setZ(i,z);tp.setY(i,terrainH(x,z));
  }
  tp.needsUpdate=true;terrainGeo.computeVertexNormals();
  const terrain=new THREE.Mesh(terrainGeo,mat(C.rough,.92));
  terrain.receiveShadow=true;world.add(terrain);

  function ribbon(w,d,c,x,z,segments=64){
    const g=new THREE.PlaneGeometry(w,d,14,segments);g.rotateX(-Math.PI/2);const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const lx=p.getX(i),lz=p.getZ(i),wx=x+lx,wz=z+lz;
      p.setY(i,terrainH(wx,wz)+.04);
    }
    p.needsUpdate=true;g.computeVertexNormals();
    const m=new THREE.Mesh(g,mat(c,.95));m.position.set(x,0,z);m.receiveShadow=true;world.add(m);return m;
  }
  ribbon(32,174,C.fair,-1,-87);
  ribbon(13,10,C.green,0,2,12);

  const greenGeo=new THREE.CircleGeometry(18,64);greenGeo.rotateX(-Math.PI/2);
  const green=new THREE.Mesh(greenGeo,mat(C.green,.96));green.scale.set(1.34,1,1);green.position.set(pin.x,pin.y+.06,pin.z);green.receiveShadow=true;world.add(green);

  function bunker(x,z,sx,sz,seed=0){
    const shape=new THREE.Shape();
    const pts=[];
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2;
      const wobble=1+.13*Math.sin(a*3+seed)+.07*Math.cos(a*5-seed*.7);
      pts.push(new THREE.Vector2(Math.cos(a)*sx*wobble,Math.sin(a)*sz*wobble));
    }
    shape.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,pts[i].y);
    shape.closePath();
    const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
    const b=new THREE.Mesh(g,mat(C.sand,.98));b.position.set(x,terrainH(x,z)+.075,z);b.receiveShadow=true;world.add(b);
  }
  bunker(-14,pin.z+8,8,4.1,.5);
  bunker(17,pin.z-3,7,3.7,1.8);
  bunker(12,-94,5.4,2.8,3.0);

  const waterMat=new THREE.MeshStandardMaterial({color:C.water,roughness:.32,metalness:.03,transparent:true,opacity:.94});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(122,245),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(92,-.38,-103);world.add(water);

  const rockMat=mat(C.rock,.93);
  function shelf(x,z,w,d,hgt,rot=0){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,hgt,d),rockMat);
    m.position.set(x,terrainH(x,z)-.1+hgt*.45,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;world.add(m);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w*.94,.12,d*.94),mat(0x7f8a6c,.96));
    cap.position.set(x,m.position.y+hgt*.52,z);cap.rotation.y=rot;world.add(cap);
  }
  shelf(37,-50,14,19,3.3,.06);
  shelf(40,-78,18,23,4.2,-.05);
  shelf(39,-111,16,26,5.0,.04);
  shelf(37,-146,20,25,5.5,-.03);
  shelf(35,-178,20,20,4.2,.08);

  function pine(x,z,s=1){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.19*s,.28*s,2.4*s,8),mat(0x5b4635,.95));trunk.position.y=1.2*s;trunk.castShadow=true;g.add(trunk);
    const c1=new THREE.Mesh(new THREE.ConeGeometry(2.05*s,4.7*s,9),mat(0x294632,.96));c1.position.y=4.0*s;c1.castShadow=true;g.add(c1);
    const c2=new THREE.Mesh(new THREE.ConeGeometry(1.5*s,3.4*s,9),mat(0x365a3e,.96));c2.position.y=5.65*s;c2.castShadow=true;g.add(c2);
    g.position.set(x,terrainH(x,z),z);world.add(g);
  }
  [[-30,-24,1],[-33,-48,.86],[-29,-75,1.08],[-33,-111,.95],[-29,-137,1.14],[-25,-165,.82],[28,-32,.78],[27,-67,.72],[29,-123,.82],[-20,-182,.7]].forEach(v=>pine(...v));

  function grassCluster(x,z,s=1){
    const g=new THREE.Group();
    for(let i=0;i<7;i++){
      const blade=new THREE.Mesh(new THREE.ConeGeometry(.055*s,.7*s,5),mat(0x82906f,.98));
      blade.position.set((i-3)*.08*s,.34*s,(i%2?1:-1)*.07*s);
      blade.rotation.z=(i-3)*.08;
      g.add(blade);
    }
    g.position.set(x,terrainH(x,z),z);world.add(g);
  }
  for(const p of [[-20,-20,1],[-23,-42,.9],[-22,-95,.8],[-20,-151,1],[22,-90,.8],[24,-153,.9]])grassCluster(...p);

  const lodge=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(9,2.3,5.5),mat(0x665c4d,.9));base.position.y=1.15;base.castShadow=true;lodge.add(base);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(7.5,1.7,4.4),mat(0xc6bda9,.92));upper.position.y=3.0;upper.castShadow=true;lodge.add(upper);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(8.2,.28,5.1),mat(C.ink,.8));roof.position.y=4.0;roof.rotation.z=.015;lodge.add(roof);
  for(let i=-2;i<=2;i++){
    const w=new THREE.Mesh(new THREE.BoxGeometry(.75,.72,.05),mat(0x36494a,.42,.08));w.position.set(i*1.35,3.1,-2.23);lodge.add(w);
  }
  lodge.position.set(15,terrainH(15,-183),-183);lodge.rotation.y=-.12;world.add(lodge);

  const lighthouse=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.9,11.5,16),mat(C.cream,.92));tower.position.y=5.75;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.82,1.82,.68,16),mat(C.orange,.8));band.position.y=9.8;lighthouse.add(band);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.75,1.75,1.2,16),mat(0x343c3c,.5,.12));room.position.y=11.45;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(2.05,2.6,16),mat(C.ink,.8));roof2.position.y=13.3;lighthouse.add(roof2);
  lighthouse.position.set(29,terrainH(29,-190),-190);world.add(lighthouse);

  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,4.5,8),mat(C.cream,.9));
  pole.position.set(pin.x,pin.y+2.25,pin.z);world.add(pole);
  const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(2.2,.55);fs.lineTo(0,1.1);fs.closePath();
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),new THREE.MeshStandardMaterial({color:C.orange,side:THREE.DoubleSide,roughness:.82}));
  flag.position.set(pin.x,pin.y+3.9,pin.z);flag.rotation.y=Math.PI/2;world.add(flag);

  return {world,green,water,ringLandmarks:{lodge,lighthouse}};
}