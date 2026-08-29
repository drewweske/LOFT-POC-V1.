import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hex=(n)=>({r:(n>>16)&255,g:(n>>8)&255,b:n&255});
const seeded=(seed=1)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

export const COLORS={
  ink:0x0B0D0D,
  cream:0xF2EFE8,
  stone:0xB8B1A6,
  orange:0xFF6A2A,
  rough:0x405d3f,
  roughLight:0x58734d,
  fair:0x718c61,
  fairLight:0x87a36f,
  green:0x8ea878,
  fringe:0x789466,
  sand:0xd9c9a7,
  sandShade:0xc2ad83,
  water:0x597a80,
  rock:0x756b5d,
  rockDark:0x585249,
  sky:0xcbd8d7
};

export const BUNKERS=[
  {x:-14,z:-148,sx:8.8,sz:4.9,seed:.4},
  {x:17,z:-160,sx:7.8,sz:4.2,seed:1.7},
  {x:12,z:-94,sx:6.0,sz:3.3,seed:2.8},
  {x:-8,z:-202,sx:6.4,sz:3.1,seed:3.7}
];

export function fairwayProfile(z){
  const t=clamp((-z+2)/238,0,1);
  const center=
    -1.2+
    Math.sin(t*Math.PI*1.18)*3.2-
    Math.sin(t*Math.PI*2.75)*1.55+
    Math.sin(t*Math.PI*5.1)*.42;
  const width=
    8.8+
    7.8*Math.sin(Math.PI*clamp(t,0,1))+
    1.3*Math.sin(t*Math.PI*3.4);
  return {t,center,width,insideRange:z<=6&&z>=-242};
}

function bunkerDepression(x,z){
  let d=0;
  for(const b of BUNKERS){
    const dx=(x-b.x)/b.sx,dz=(z-b.z)/b.sz;
    const r2=dx*dx+dz*dz;
    if(r2<1){
      const inner=Math.pow(1-r2,1.55);
      d=Math.min(d,-(.20+.62*inner));
    }
  }
  return d;
}

export function terrainHeight(x,z){
  const t=clamp((-z+12)/270,0,1);

  // Broad course architecture first: a climbing coastal shelf with a soft
  // saddle through the middle and a higher lighthouse finish.
  const climb=.38*t+1.18*smoothstep(.10,.80,t);
  const ridge=
    1.72*Math.exp(-Math.pow((z+164)/57,2))*
    (.58+.42*Math.exp(-Math.pow((x+5)/34,2)));
  const shelf=
    .78*Math.exp(-Math.pow((z+78)/37,2))*
    (.62+.38*Math.exp(-Math.pow((x-4)/27,2)));
  const lighthouseRise=
    1.18*Math.exp(-Math.pow((z+220)/30,2))*
    (.65+.35*Math.exp(-Math.pow((x+4)/31,2)));
  const valley=-.52*Math.exp(-Math.pow((z+119)/30,2))*Math.exp(-Math.pow((x+13)/24,2));

  // Long-wave contouring; intentionally low frequency so the course feels
  // shaped by earthwork rather than noise.
  const roll=
    .24*Math.sin((z+18)*.026)+
    .16*Math.sin((z-9)*.057)+
    .13*Math.sin(x*.078+z*.018)+
    .08*Math.cos(x*.135-z*.021);

  // Coastal edge starts to fall before the rock shelf. Physics remains usable
  // while the silhouette reads as real elevation.
  const coast=-.42*smoothstep(25,42,x)*(0.6+0.4*Math.sin((z+35)*.019));

  return climb+ridge+shelf+lighthouseRise+valley+roll+coast+bunkerDepression(x,z);
}

export function greenSurfaceHeight(center,x,z){
  const dx=x-center.x,dz=z-center.z;
  const ellipse=Math.sqrt((dx/23.5)*(dx/23.5)+(dz/18.0)*(dz/18.0));
  const blend=1-smoothstep(.58,1.02,ellipse);
  const authoredPlane=center.y+dx*.0062+dz*.0032+
    .035*Math.sin(dx*.18)*Math.cos(dz*.14);
  return terrainHeight(x,z)*(1-blend)+authoredPlane*blend;
}

const mat=(c,r=.9,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});

function makeNoiseTexture(base,{size=256,grain=16,streak=0,seed=7}={}){
  const rnd=seeded(seed);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const b=hex(base);
  ctx.fillStyle=`rgb(${b.r},${b.g},${b.b})`;ctx.fillRect(0,0,size,size);

  if(streak>0){
    for(let y=0;y<size;y+=12){
      const a=((Math.floor(y/12)%2)?-.025:.025)*streak;
      ctx.fillStyle=`rgba(${a>0?255:0},${a>0?255:0},${a>0?255:0},${Math.abs(a)})`;
      ctx.fillRect(0,y,size,6);
    }
  }

  for(let i=0;i<size*8;i++){
    const v=(rnd()-.5)*grain;
    const rr=clamp(Math.round(b.r+v),0,255),gg=clamp(Math.round(b.g+v),0,255),bb=clamp(Math.round(b.b+v),0,255);
    ctx.fillStyle=`rgba(${rr},${gg},${bb},${.10+rnd()*.13})`;
    const w=.5+rnd()*1.8,h=.5+rnd()*3.2;
    ctx.fillRect(rnd()*size,rnd()*size,w,h);
  }

  const t=new THREE.CanvasTexture(canvas);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=4;
  return t;
}

function makeBumpTexture({size=256,seed=13}={}){
  const rnd=seeded(seed);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#808080';ctx.fillRect(0,0,size,size);
  for(let i=0;i<size*12;i++){
    const v=105+Math.floor(rnd()*55);
    ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.fillRect(rnd()*size,rnd()*size,1+rnd()*2,1+rnd()*2);
  }
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

function applyTexture(material,map,bump,repeatX,repeatY,bumpScale=.035){
  const m=map.clone(),b=bump.clone();
  m.needsUpdate=true;b.needsUpdate=true;
  m.wrapS=m.wrapT=THREE.RepeatWrapping;b.wrapS=b.wrapT=THREE.RepeatWrapping;
  m.repeat.set(repeatX,repeatY);b.repeat.set(repeatX,repeatY);
  material.map=m;material.bumpMap=b;material.bumpScale=bumpScale;
  return material;
}

function deformedPlane(width,depth,segX,segZ,zOffset=0){
  const g=new THREE.PlaneGeometry(width,depth,segX,segZ);g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i)+zOffset;
    p.setZ(i,z);p.setY(i,terrainHeight(x,z));
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function buildRibbon({z0=8,z1=-242,segments=160,widthScale=1,yOffset=.012}={}){
  const pos=[],uv=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,z=z0+(z1-z0)*t;
    const profile=fairwayProfile(z);
    const half=profile.width*widthScale;
    for(const side of [-1,1]){
      const x=profile.center+side*half;
      pos.push(x,terrainHeight(x,z)+yOffset,z);
      uv.push(side<0?0:1,t*32);
    }
    if(i<segments){
      const a=i*2,b=a+1,c=a+2,d=a+3;
      idx.push(a,c,b,b,c,d);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();return g;
}

function buildGreenGeometry(rx=22,rz=17,rings=13,segments=72){
  const pos=[0,0,0],uv=[.5,.5],idx=[];
  for(let r=1;r<=rings;r++){
    const q=r/rings;
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2;
      const wobble=1+.035*Math.sin(a*3.0)+.018*Math.cos(a*5.0);
      pos.push(Math.cos(a)*rx*q*wobble,0,Math.sin(a)*rz*q*wobble);
      uv.push(.5+.5*Math.cos(a)*q,.5+.5*Math.sin(a)*q);
    }
  }
  for(let i=0;i<segments;i++)idx.push(0,1+i,1+((i+1)%segments));
  for(let r=1;r<rings;r++){
    const a0=1+(r-1)*segments,b0=1+r*segments;
    for(let i=0;i<segments;i++){
      const n=(i+1)%segments;
      idx.push(a0+i,b0+i,a0+n,a0+n,b0+i,b0+n);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);return g;
}

function updateGreenGeometry(mesh,center,{offset=.018}={}){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const lx=p.getX(i),lz=p.getZ(i);
    const worldY=greenSurfaceHeight(center,center.x+lx,center.z+lz);
    p.setY(i,worldY-center.y+offset);
  }
  p.needsUpdate=true;mesh.geometry.computeVertexNormals();
  mesh.position.set(center.x,center.y,center.z);
}

function irregularBoundary(b,count=44,scale=1){
  const pts=[];
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2;
    const w=1+.10*Math.sin(a*3+b.seed)+.055*Math.cos(a*5-b.seed)+.025*Math.sin(a*9+b.seed*.7);
    pts.push(new THREE.Vector2(Math.cos(a)*b.sx*w*scale,Math.sin(a)*b.sz*w*scale));
  }
  return pts;
}

function shapeFromPoints(pts){
  const s=new THREE.Shape();s.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++)s.lineTo(pts[i].x,pts[i].y);
  s.closePath();return s;
}

function makeRockGeometry(seed=1){
  const rnd=seeded(seed);
  const g=new THREE.IcosahedronGeometry(1,1);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=.78+rnd()*.38;
    p.setXYZ(i,x*n,y*(.72+rnd()*.28),z*n);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function cloudTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
  x.clearRect(0,0,512,256);
  const blobs=[[110,145,86],[190,122,102],[282,144,92],[355,128,72],[235,165,120]];
  for(const [cx,cy,r] of blobs){
    const g=x.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,'rgba(255,255,255,.68)');
    g.addColorStop(.55,'rgba(255,255,255,.30)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function buildWorld(scene,pin){
  const world=new THREE.Group();world.name='COASTAL_RIDGE_WORLD';scene.add(world);
  const rnd=seeded(2045);

  const roughMap=makeNoiseTexture(COLORS.rough,{grain:20,seed:11});
  const fairMap=makeNoiseTexture(COLORS.fair,{grain:13,streak:.80,seed:21});
  const greenMap=makeNoiseTexture(COLORS.green,{grain:9,streak:.20,seed:31});
  const fringeMap=makeNoiseTexture(COLORS.fringe,{grain:15,seed:41});
  const sandMap=makeNoiseTexture(COLORS.sand,{grain:20,seed:51});
  const bump=makeBumpTexture({seed:71});

  // --- LAND ---------------------------------------------------------------
  const terrainGeo=deformedPlane(170,320,108,196,-116);
  const roughMat=applyTexture(mat(COLORS.rough,.96),roughMap,bump,23,44,.055);
  roughMat.vertexColors=false;
  const terrain=new THREE.Mesh(terrainGeo,roughMat);
  terrain.receiveShadow=true;world.add(terrain);

  // A subtle second rough band around the fairway prevents the course from
  // looking like one flat green rectangle.
  const firstCutGeo=buildRibbon({z0:8,z1:-242,segments:170,widthScale:1.18,yOffset:.014});
  const firstCutMat=applyTexture(mat(0x58734d,.95),roughMap,bump,5,28,.035);
  const firstCut=new THREE.Mesh(firstCutGeo,firstCutMat);firstCut.receiveShadow=true;world.add(firstCut);

  const fairGeo=buildRibbon({z0:8,z1:-242,segments:180,widthScale:1,yOffset:.026});
  const fairMat=applyTexture(mat(COLORS.fair,.91),fairMap,bump,3.6,36,.025);
  const fairway=new THREE.Mesh(fairGeo,fairMat);fairway.receiveShadow=true;world.add(fairway);

  // Tee shelves — small authored cuts, not giant rectangles.
  const teeMat=applyTexture(mat(0x809b6c,.91),fairMap,bump,2,2,.018);
  [[.46,0,7.6,4.8],[-8,10,7.4,4.6],[8,18,7.8,4.8]].forEach(([x,z,w,d])=>{
    const g=new THREE.PlaneGeometry(w,d,8,5);g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const wx=x+p.getX(i),wz=z+p.getZ(i);
      p.setY(i,terrainHeight(wx,wz)+.030);
    }
    p.needsUpdate=true;g.computeVertexNormals();
    const m=new THREE.Mesh(g,teeMat);m.position.set(x,0,z);m.receiveShadow=true;world.add(m);
  });

  // --- GREEN / FRINGE ------------------------------------------------------
  const greenGeo=buildGreenGeometry(22.2,16.8,14,72);
  const fringeGeo=buildGreenGeometry(24.7,19.1,14,72);
  const greenMat=applyTexture(mat(COLORS.green,.88),greenMap,bump,7,7,.015);
  const fringeMat=applyTexture(mat(COLORS.fringe,.94),fringeMap,bump,7,7,.028);
  const fringe=new THREE.Mesh(fringeGeo,fringeMat);fringe.receiveShadow=true;world.add(fringe);
  const green=new THREE.Mesh(greenGeo,greenMat);green.receiveShadow=true;world.add(green);
  updateGreenGeometry(fringe,pin,{offset:.014});
  updateGreenGeometry(green,pin,{offset:.027});

  const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(.086,48),new THREE.MeshBasicMaterial({color:COLORS.ink,side:THREE.DoubleSide}));
  holeDisc.rotation.x=-Math.PI/2;holeDisc.position.set(pin.x,pin.y+.038,pin.z);world.add(holeDisc);

  // --- BUNKERS: depressed floor + grass/sand lip --------------------------
  function bunker(b){
    const inner=irregularBoundary(b,48,.90);
    const outer=irregularBoundary(b,48,1.06);

    const floorGeo=new THREE.ShapeGeometry(shapeFromPoints(inner));floorGeo.rotateX(-Math.PI/2);
    const fp=floorGeo.attributes.position;
    for(let i=0;i<fp.count;i++){
      const lx=fp.getX(i),lz=fp.getZ(i);
      fp.setY(i,terrainHeight(b.x+lx,b.z+lz)+.025);
    }
    fp.needsUpdate=true;floorGeo.computeVertexNormals();
    const floorMat=applyTexture(mat(COLORS.sand,.995),sandMap,bump,4.5,4.5,.070);
    const floor=new THREE.Mesh(floorGeo,floorMat);floor.position.set(b.x,0,b.z);floor.receiveShadow=true;world.add(floor);

    const pos=[],uv=[],idx=[];
    for(let i=0;i<outer.length;i++){
      const o=outer[i],inn=inner[i];
      const oy=terrainHeight(b.x+o.x,b.z+o.y)+.030;
      const iy=terrainHeight(b.x+inn.x,b.z+inn.y)+.030;
      pos.push(o.x,oy,o.y,inn.x,iy,inn.y);
      uv.push(0,i/outer.length,1,i/outer.length);
      const n=(i+1)%outer.length,a=i*2,bb=a+1,c=n*2,d=c+1;
      idx.push(a,c,bb,bb,c,d);
    }
    const lipGeo=new THREE.BufferGeometry();
    lipGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    lipGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    lipGeo.setIndex(idx);lipGeo.computeVertexNormals();
    const lipMat=applyTexture(mat(COLORS.sandShade,.98),sandMap,bump,4,4,.045);
    const lip=new THREE.Mesh(lipGeo,lipMat);lip.position.set(b.x,0,b.z);lip.receiveShadow=true;world.add(lip);
  }
  BUNKERS.forEach(bunker);

  // --- COAST / WATER -------------------------------------------------------
  const waterMat=new THREE.MeshPhysicalMaterial({
    color:COLORS.water,roughness:.25,metalness:.02,transparent:true,opacity:.93,
    clearcoat:.28,clearcoatRoughness:.22
  });
  const water=new THREE.Mesh(new THREE.PlaneGeometry(170,340,1,1),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(108,-1.08,-120);world.add(water);

  const rockMat=mat(COLORS.rock,.97),rockDark=mat(COLORS.rockDark,.99);
  const rockGeo=makeRockGeometry(91);
  const rockGeo2=makeRockGeometry(141);

  function rock(x,z,sx,sy,sz,rot=0,dark=false){
    const m=new THREE.Mesh(dark?rockGeo2:rockGeo,dark?rockDark:rockMat);
    m.position.set(x,terrainHeight(x,z)-.18+sy*.30,z);
    m.scale.set(sx,sy,sz);m.rotation.set((rnd()-.5)*.24,rot,(rnd()-.5)*.12);
    m.castShadow=true;m.receiveShadow=true;world.add(m);return m;
  }

  // Layered cliff shelves with irregular rock clusters instead of boxes.
  for(let z=-28;z>-246;z-=13+rnd()*9){
    const x=34+rnd()*8;
    const base=1.4+rnd()*1.7;
    rock(x,z,3.6+rnd()*3.8,base,3.0+rnd()*4.6,(rnd()-.5)*.48);
    if(rnd()>.35)rock(x+3+rnd()*4,z-2+rnd()*5,2.2+rnd()*2.2,.9+rnd()*1.4,2.5+rnd()*3.0,(rnd()-.5)*.8,true);
  }
  for(let i=0;i<28;i++){
    const z=-20-rnd()*225,x=28+rnd()*14;
    rock(x,z,.55+rnd()*1.2,.45+rnd()*.9,.55+rnd()*1.3,rnd()*Math.PI);
  }

  // --- VEGETATION ----------------------------------------------------------
  function pine(x,z,s=1){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.20*s,2.2*s,10),mat(0x4f3828,.99));
    trunk.position.y=1.10*s;trunk.castShadow=true;g.add(trunk);
    const greens=[0x294834,0x31553b,0x3b6242];
    [[1.65,3.0,2.6,0],[1.30,2.7,3.55,.2],[.98,2.35,4.45,-.12]].forEach(([r,h,y,rr],i)=>{
      const c=new THREE.Mesh(new THREE.ConeGeometry(r*s,h*s,12),mat(greens[i],.99));
      c.position.y=y*s;c.rotation.y=rr;c.castShadow=true;g.add(c);
    });
    g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rnd()*Math.PI*2;world.add(g);
  }

  const trees=[
    [-31,-26,1.05],[-34,-48,.88],[-31,-71,1.12],[-35,-99,.86],[-31,-128,1.12],[-29,-151,.96],[-25,-180,.82],
    [27,-35,.78],[29,-61,.72],[30,-94,.80],[31,-126,.88],[28,-151,.76],[-21,-204,.76],[-29,-222,.91],
    [-43,-35,.70],[-45,-89,.77],[-42,-145,.72],[22,-204,.70]
  ];
  trees.forEach(v=>pine(...v));

  // Instanced native rough. Sparse near play corridors, richer at edges.
  const bladeGeo=new THREE.PlaneGeometry(.075,.38);bladeGeo.translate(0,.19,0);
  const bladeMat=new THREE.MeshStandardMaterial({color:0x6f7c51,roughness:1,side:THREE.DoubleSide});
  const blades=new THREE.InstancedMesh(bladeGeo,bladeMat,1050);
  const dummy=new THREE.Object3D();let bladeCount=0;
  for(let i=0;i<1800&&bladeCount<1050;i++){
    const z=12-rnd()*270;
    const p=fairwayProfile(z);
    const side=rnd()<.5?-1:1;
    const x=p.center+side*(p.width+3+rnd()*30);
    if(x>28||Math.abs(x)>61)continue;
    const y=terrainHeight(x,z);
    const s=.55+rnd()*1.15;
    dummy.position.set(x,y+.01,z);dummy.rotation.set(0,rnd()*Math.PI,0);dummy.scale.set(s,s,s);
    dummy.updateMatrix();blades.setMatrixAt(bladeCount++,dummy.matrix);
  }
  blades.count=bladeCount;blades.castShadow=false;blades.receiveShadow=true;world.add(blades);

  // Near-ball grass detail is regenerated only when the lie changes. This is
  // where fairway/rough length becomes tangible without rendering millions of
  // blades across the entire mobile scene.
  const detailGeo=new THREE.PlaneGeometry(.032,.20);detailGeo.translate(0,.10,0);
  const detailMat=new THREE.MeshStandardMaterial({color:0x78906a,roughness:1,side:THREE.DoubleSide});
  const detailGrass=new THREE.InstancedMesh(detailGeo,detailMat,260);
  detailGrass.castShadow=false;detailGrass.receiveShadow=true;detailGrass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(detailGrass);

  function setDetailFocus(position,surface='fairway'){
    const seed=Math.floor((position.x+80)*29+(position.z+310)*17);
    const rr=seeded(seed>>>0);
    let base=.04,spread=7.5,count=220,color=0x78906a;
    if(surface==='rough'){base=.135;spread=8.6;count=250;color=0x64794f;}
    else if(surface==='fringe'){base=.070;spread=6.8;count=235;color=0x789466;}
    else if(surface==='green'){base=.015;spread=6.2;count=150;color=0x8ea878;}
    else if(surface==='tee'){base=.040;spread=6.5;count=210;color=0x7f986a;}
    else if(surface==='sand'||surface==='water'){base=0;count=0;}
    detailGrass.material.color.setHex(color);

    for(let i=0;i<260;i++){
      if(i>=count||base===0){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const a=rr()*Math.PI*2,r=Math.sqrt(rr())*spread;
      const x=position.x+Math.cos(a)*r,z=position.z+Math.sin(a)*r;
      const h=base*(.68+rr()*.72);
      dummy.position.set(x,terrainHeight(x,z)+.012,z);
      dummy.rotation.set(0,rr()*Math.PI,0);
      dummy.scale.set(.72+rr()*.55,h/.20,.72+rr()*.55);
      dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);
    }
    detailGrass.instanceMatrix.needsUpdate=true;
  }

  const shrubGeo=new THREE.IcosahedronGeometry(.48,1);
  const shrubMat=mat(0x506342,.995);
  const shrubs=new THREE.InstancedMesh(shrubGeo,shrubMat,180);let shrubCount=0;
  for(let i=0;i<260&&shrubCount<180;i++){
    const z=-18-rnd()*220,p=fairwayProfile(z);
    const side=rnd()<.5?-1:1,x=p.center+side*(p.width+7+rnd()*28);
    if(x>29||Math.abs(x)>55)continue;
    const s=.45+rnd()*1.15;dummy.position.set(x,terrainHeight(x,z)+.22*s,z);
    dummy.rotation.set(rnd()*.15,rnd()*Math.PI,rnd()*.10);dummy.scale.set(1.2*s,.72*s,1.0*s);
    dummy.updateMatrix();shrubs.setMatrixAt(shrubCount++,dummy.matrix);
  }
  shrubs.count=shrubCount;shrubs.castShadow=true;shrubs.receiveShadow=true;world.add(shrubs);

  // --- ARCHITECTURE --------------------------------------------------------
  const lodge=new THREE.Group();
  const lodgeStone=mat(0x746957,.96),plaster=mat(0xd5cdbd,.96),roofMat=mat(COLORS.ink,.86);
  const base=new THREE.Mesh(new THREE.BoxGeometry(10.5,2.2,6.3),lodgeStone);base.position.y=1.1;base.castShadow=true;lodge.add(base);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(8.6,1.9,5.1),plaster);upper.position.y=3.05;upper.castShadow=true;lodge.add(upper);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(9.5,.25,5.8),roofMat);roof.position.y=4.12;roof.castShadow=true;lodge.add(roof);
  for(const zz of [-1.4,0,1.4]){
    const w=new THREE.Mesh(new THREE.PlaneGeometry(.82,.72),new THREE.MeshStandardMaterial({color:0x39494c,roughness:.3,metalness:.03}));
    w.position.set(4.31,3.12,zz);w.rotation.y=Math.PI/2;lodge.add(w);
  }
  lodge.position.set(-24,terrainHeight(-24,-154),-154);lodge.rotation.y=.10;lodge.scale.set(.95,.95,.95);world.add(lodge);

  const lighthouse=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.28,1.78,11.8,24),mat(COLORS.cream,.96));tower.position.y=5.9;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.57,1.57,.55,24),mat(COLORS.orange,.84));band.position.y=9.85;lighthouse.add(band);
  const balcony=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.18,24),mat(COLORS.ink,.84));balcony.position.y=11.08;lighthouse.add(balcony);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.46,1.46,1.3,24),new THREE.MeshStandardMaterial({color:0x526061,roughness:.36,metalness:.06}));room.position.y=11.72;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(1.86,2.35,24),mat(COLORS.ink,.84));roof2.position.y=13.55;lighthouse.add(roof2);
  lighthouse.position.set(30,terrainHeight(30,-166),-166);lighthouse.scale.set(.92,.92,.92);world.add(lighthouse);

  // --- ATMOSPHERE ----------------------------------------------------------
  const ctex=cloudTexture();
  const cloudMat=new THREE.MeshBasicMaterial({map:ctex,transparent:true,depthWrite:false,opacity:.54,side:THREE.DoubleSide});
  [[-42,23,-180,34,15],[32,28,-236,42,18],[8,31,-110,30,13]].forEach(([x,y,z,w,h])=>{
    const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cloudMat.clone());
    q.position.set(x,y,z);q.rotation.y=.06;q.renderOrder=-1;world.add(q);
  });

  // --- PIN -----------------------------------------------------------------
  const poleMat=mat(COLORS.cream,.90);poleMat.transparent=true;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,4.5,12),poleMat);pole.position.set(pin.x,pin.y+2.25,pin.z);world.add(pole);
  const fs=new THREE.Shape();fs.moveTo(0,0);fs.bezierCurveTo(.62,.08,1.55,.22,2.18,.49);fs.lineTo(0,1.02);fs.closePath();
  const flagMat=new THREE.MeshStandardMaterial({color:COLORS.orange,side:THREE.DoubleSide,roughness:.84,transparent:true});
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),flagMat);flag.position.set(pin.x,pin.y+3.88,pin.z);flag.rotation.y=Math.PI/2;world.add(flag);

  function setPin(next){
    updateGreenGeometry(fringe,next,{offset:.014});
    updateGreenGeometry(green,next,{offset:.027});
    holeDisc.position.set(next.x,next.y+.038,next.z);
    pole.position.set(next.x,next.y+2.25,next.z);
    flag.position.set(next.x,next.y+3.88,next.z);
  }

  let pinAlpha=1;
  function setPinFade(alpha){
    pinAlpha=clamp(alpha,.08,1);
    pole.material.opacity=pinAlpha;flag.material.opacity=pinAlpha;
    pole.renderOrder=pinAlpha<.5?2:0;flag.renderOrder=pinAlpha<.5?2:0;
  }

  return {world,terrain,fairway,green,fringe,holeDisc,pole,flag,water,setPin,setPinFade,setDetailFocus};
}
