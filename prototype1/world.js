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
  rough:0x536f4c,
  roughLight:0x667f58,
  fair:0x789568,
  fairLight:0x8aa776,
  green:0x94ad7d,
  fringe:0x7f996c,
  sand:0xd9c9a7,
  sandShade:0xc2ad83,
  water:0x597a80,
  rock:0x756b5d,
  rockDark:0x585249,
  sky:0xcbd8d7
};

export const SURFACE_LIFT=Object.freeze({
  rough:.0020,
  firstCut:.0025,
  fairway:.0045,
  tee:.0045,
  fringe:.0060,
  green:.0090,
  sand:.0045
});

export const TEE_PADS=[
  {x:.46,z:0,rx:3.8,rz:2.35},
  {x:-8,z:10,rx:3.7,rz:2.25},
  {x:8,z:18,rx:3.9,rz:2.35}
];

export const BUNKERS=[
  // Static Coastal Ridge hazards are deliberately kept outside every moving
  // prototype green footprint. Integration 010 allowed green and bunker
  // geometry to occupy the same space, creating impossible visual overlaps.
  {x:-13,z:-125,sx:7.2,sz:3.7,seed:.4},
  {x:24,z:-138,sx:7.4,sz:3.6,seed:1.7},
  {x:28,z:-190,sx:7.0,sz:3.8,seed:2.8},
  {x:-30,z:-239,sx:6.8,sz:3.4,seed:3.7}
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
  const profile=fairwayProfile(z);
  const lateral=x-profile.center;

  // LOFT terrain is authored in golf-scale landforms, not procedural micro-noise.
  // The full hole rises gradually from tee to lighthouse while three large
  // shelves create readable strategic elevation changes.
  const climb=3.40*smoothstep(.03,.92,t);
  const ridge=
    2.70*Math.exp(-Math.pow((z+168)/64,2))*
    (.66+.34*Math.exp(-Math.pow((lateral+2)/28,2)));
  const middleShelf=
    1.35*Math.exp(-Math.pow((z+86)/47,2))*
    (.72+.28*Math.exp(-Math.pow((lateral-3)/30,2)));
  const lighthouseShelf=
    2.20*Math.exp(-Math.pow((z+224)/38,2))*
    (.70+.30*Math.exp(-Math.pow((lateral+1)/31,2)));

  // Two broad saddles stop the course reading as one continuous ramp.
  const saddleA=-1.00*Math.exp(-Math.pow((z+122)/42,2))*Math.exp(-Math.pow((lateral+10)/31,2));
  const saddleB=-.55*Math.exp(-Math.pow((z+205)/25,2))*Math.exp(-Math.pow((lateral-8)/24,2));

  // Gentle crossfall gives golf-readable lies. These wavelengths are large
  // enough to be visible and predictable; there are no invisible divots.
  const crossfall=.0105*lateral*Math.sin((z+28)*.012);
  const broadRoll=
    .19*Math.sin((z+20)*.022)+
    .11*Math.cos((z-42)*.041)+
    .075*Math.sin((x+8)*.055);

  // Long golf-scale undulations. Wavelengths stay large enough that the player
  // can read them in the lighting; LOFT never hides gameplay in micro-noise.
  const naturalUndulation=
    .095*Math.sin((x*.105)+(z*.041))+
    .070*Math.cos((x*.072)-(z*.033))+
    .045*Math.sin((x*.036)+(z*.079));

  // The ocean side rolls away toward the cliff instead of becoming a sudden wall.
  const coast=-5.20*smoothstep(29,45,x)*(0.88+0.12*Math.cos((z+35)*.017));

  return climb+ridge+middleShelf+lighthouseShelf+saddleA+saddleB+crossfall+broadRoll+naturalUndulation+coast+bunkerDepression(x,z);
}

export function greenSurfaceHeight(center,x,z){
  const dx=x-center.x,dz=z-center.z;
  const ellipse=Math.sqrt((dx/18.5)*(dx/18.5)+(dz/14.5)*(dz/14.5));
  const blend=1-smoothstep(.58,1.02,ellipse);
  const authoredPlane=center.y+dx*.0062+dz*.0032+
    .035*Math.sin(dx*.18)*Math.cos(dz*.14);
  return terrainHeight(x,z)*(1-blend)+authoredPlane*blend;
}


export function bunkerMask(x,z){
  let best=Infinity;
  for(const b of BUNKERS){
    const dx=(x-b.x)/b.sx,dz=(z-b.z)/b.sz;
    const r=Math.sqrt(dx*dx+dz*dz);
    best=Math.min(best,r);
  }
  return best;
}

export function greenEllipse(center,x,z,rx=18.5,rz=14.5){
  const dx=(x-center.x)/rx,dz=(z-center.z)/rz;
  return Math.sqrt(dx*dx+dz*dz);
}

export function courseSurfaceAt(x,z,center){
  if(x>38&&z<-18)return 'water';

  const g=greenEllipse(center,x,z,18.5,14.5);
  if(g<=1)return 'green';
  const fr=greenEllipse(center,x,z,21.0,16.5);
  if(fr<=1)return 'fringe';

  for(const b of BUNKERS){
    const dx=(x-b.x)/(b.sx*.96),dz=(z-b.z)/(b.sz*.96);
    if(dx*dx+dz*dz<=1)return 'sand';
  }

  for(const tee of TEE_PADS){
    const dx=(x-tee.x)/tee.rx,dz=(z-tee.z)/tee.rz;
    if(dx*dx+dz*dz<=1)return 'tee';
  }

  const p=fairwayProfile(z);
  if(p.insideRange&&Math.abs(x-p.center)<=p.width)return 'fairway';
  return 'rough';
}

export function courseSurfaceHeight(x,z,center){
  const s=courseSurfaceAt(x,z,center);
  if(s==='green')return greenSurfaceHeight(center,x,z)+SURFACE_LIFT.green;
  if(s==='fringe')return greenSurfaceHeight(center,x,z)+SURFACE_LIFT.fringe;
  if(s==='sand')return terrainHeight(x,z)+SURFACE_LIFT.sand;
  if(s==='fairway')return terrainHeight(x,z)+SURFACE_LIFT.fairway;
  if(s==='tee')return terrainHeight(x,z)+SURFACE_LIFT.tee;
  return terrainHeight(x,z)+SURFACE_LIFT.rough;
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

  // The canvas texture already contains the intended turf/sand colour.
  // Leaving the MeshStandardMaterial coloured multiplied the albedo twice and
  // produced the near-black course seen on iPhone.
  material.color.setHex(0xffffff);
  material.map=m;material.bumpMap=b;material.bumpScale=bumpScale;
  return material;
}

function terrainReadShade(heightFn,x,z,strength=.72){
  const e=.62;
  const h=heightFn(x,z);
  const dx=(heightFn(x+e,z)-heightFn(x-e,z))/(2*e);
  const dz=(heightFn(x,z+e)-heightFn(x,z-e))/(2*e);
  const inv=1/Math.max(.0001,Math.hypot(dx,1,dz));
  const nx=-dx*inv,ny=inv,nz=-dz*inv;

  // Matches the game key light direction. We intentionally exaggerate only
  // the slope-dependent delta, not the base colour, so a player can SEE the
  // same grade the physics solver sees without contour-line UI.
  const lx=-.34,ly=.85,lz=.40;
  const flatDot=ly;
  const dot=nx*lx+ny*ly+nz*lz;
  const directional=(dot-flatDot)*strength;
  const altitude=clamp((h-2.5)/8,-1,1)*.018;
  return clamp(1+directional+altitude,.80,1.12);
}

function applySlopeColors(geometry,heightFn,{offsetX=0,offsetZ=0,strength=.72}={}){
  const p=geometry.attributes.position;
  const colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)+offsetX,z=p.getZ(i)+offsetZ;
    const s=terrainReadShade(heightFn,x,z,strength);
    colors[i*3]=s;colors[i*3+1]=s;colors[i*3+2]=s;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
}

function deformedPlane(width,depth,segX,segZ,zOffset=0){
  const g=new THREE.PlaneGeometry(width,depth,segX,segZ);g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i)+zOffset;
    p.setZ(i,z);p.setY(i,terrainHeight(x,z));
  }
  p.needsUpdate=true;g.computeVertexNormals();
  applySlopeColors(g,terrainHeight,{strength:.78});
  return g;
}


function colorMix(a,b,t){
  const ca=new THREE.Color(a),cb=new THREE.Color(b);
  return ca.lerp(cb,clamp(t,0,1));
}

function teeVisualWeight(x,z){
  let w=0;
  for(const t of TEE_PADS){
    const r=Math.sqrt(Math.pow((x-t.x)/t.rx,2)+Math.pow((z-t.z)/t.rz,2));
    w=Math.max(w,1-smoothstep(.82,1.12,r));
  }
  return w;
}

function fairwayVisualWeights(x,z){
  const p=fairwayProfile(z);
  if(!p.insideRange)return {fair:0,first:0};
  const d=Math.abs(x-p.center)-p.width;
  const fair=1-smoothstep(-.25,1.05,d);
  const first=(1-smoothstep(.55,3.1,d))*(1-fair*.72);
  return {fair,first};
}

function terrainVisualColor(x,z,center){
  const base=new THREE.Color(COLORS.rough);
  const fw=fairwayVisualWeights(x,z);
  if(fw.first>0)base.lerp(new THREE.Color(COLORS.roughLight),fw.first*.86);
  if(fw.fair>0)base.lerp(new THREE.Color(COLORS.fair),fw.fair);

  const teeW=teeVisualWeight(x,z);
  if(teeW>0)base.lerp(new THREE.Color(0x809b6c),teeW);

  const fr=greenEllipse(center,x,z,21.0,16.5);
  const greenR=greenEllipse(center,x,z,18.5,14.5);
  const fringeW=(1-smoothstep(.91,1.055,fr))*(smoothstep(.78,1.00,greenR));
  const greenW=1-smoothstep(.88,1.035,greenR);
  if(fringeW>0)base.lerp(new THREE.Color(COLORS.fringe),fringeW);
  if(greenW>0)base.lerp(new THREE.Color(COLORS.green),greenW);

  const bm=bunkerMask(x,z);
  const sandW=1-smoothstep(.82,1.04,bm);
  if(sandW>0)base.lerp(new THREE.Color(COLORS.sand),sandW);

  // Mowing / rake direction lives inside the surface instead of as extra
  // geometry. It adds human-made golf texture without z-fighting.
  let weave=1;
  if(greenW>.1)weave+=.018*Math.sin((x+z*.18)*1.22);
  else if(fw.fair>.1)weave+=.020*Math.sin((z+18)*.58);
  else weave+=.008*Math.sin((x*.42-z*.19));
  if(sandW>.25)weave+=.018*Math.sin((x*.70+z*.47));

  const shade=terrainReadShade(
    (xx,zz)=>courseSurfaceHeight(xx,zz,center),
    x,z,.78
  );
  const gain=clamp(shade*weave,.78,1.16);
  base.multiplyScalar(gain);
  return base;
}

function buildTerrainFabricGeometry(center){
  // ~55k vertices / ~110k triangles: dense enough for round bunker lips and
  // smooth elevation on modern phones while remaining dramatically cheaper
  // than multiple overlapping course meshes.
  const width=176,depth=326,segX=168,segZ=310,zOffset=-116;
  const g=new THREE.PlaneGeometry(width,depth,segX,segZ);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  const colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i)+zOffset;
    p.setZ(i,z);
    p.setY(i,courseSurfaceHeight(x,z,center));
    const col=terrainVisualColor(x,z,center);
    colors[i*3]=col.r;colors[i*3+1]=col.g;colors[i*3+2]=col.b;
  }
  p.needsUpdate=true;
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  g.computeVertexNormals();
  return g;
}

function updateTerrainFabric(mesh,center){
  const p=mesh.geometry.attributes.position;
  const colors=mesh.geometry.attributes.color;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    p.setY(i,courseSurfaceHeight(x,z,center));
    const col=terrainVisualColor(x,z,center);
    colors.setXYZ(i,col.r,col.g,col.b);
  }
  p.needsUpdate=true;colors.needsUpdate=true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeBoundingSphere();
}

function neutralFiberTexture({size=256,seed=2045}={}){
  const rnd=seeded(seed);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const x=canvas.getContext('2d');
  x.fillStyle='#ededeb';x.fillRect(0,0,size,size);
  for(let i=0;i<10500;i++){
    const v=218+Math.floor(rnd()*34);
    const a=.045+rnd()*.075;
    x.fillStyle=`rgba(${v},${v},${v},${a})`;
    const px=rnd()*size,py=rnd()*size;
    x.fillRect(px,py,.45+rnd()*1.1,.9+rnd()*2.6);
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(22,42);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=4;
  return tex;
}

function buildRibbon({z0=8,z1=-242,segments=160,crossSegments=12,widthScale=1,yOffset=.001}={}){
  const pos=[],uv=[],idx=[];
  const stride=crossSegments+1;

  for(let i=0;i<=segments;i++){
    const t=i/segments,z=z0+(z1-z0)*t;
    const profile=fairwayProfile(z);
    const half=profile.width*widthScale;

    for(let j=0;j<=crossSegments;j++){
      const u=j/crossSegments;
      const x=profile.center+(u*2-1)*half;
      pos.push(x,terrainHeight(x,z)+yOffset,z);
      uv.push(u,t);
    }

    if(i<segments){
      for(let j=0;j<crossSegments;j++){
        const a=i*stride+j,b=a+1,c=a+stride,d=c+1;
        // Up-facing winding. The previous order produced downward normals,
        // flattening light response and creating dark strip artifacts on iOS.
        idx.push(a,b,c,b,d,c);
      }
    }
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  applySlopeColors(g,terrainHeight,{strength:.82});
  return g;
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
  for(let i=0;i<segments;i++){
    const n=(i+1)%segments;
    idx.push(0,1+n,1+i);
  }
  for(let r=1;r<rings;r++){
    const a0=1+(r-1)*segments,b0=1+r*segments;
    for(let i=0;i<segments;i++){
      const n=(i+1)%segments;
      idx.push(a0+i,a0+n,b0+i,a0+n,b0+n,b0+i);
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
  applySlopeColors(
    mesh.geometry,
    (x,z)=>greenSurfaceHeight(center,x,z),
    {offsetX:center.x,offsetZ:center.z,strength:.92}
  );
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

function buildBunkerFloorGeometry(b,rings=9,segments=48){
  const pos=[0,terrainHeight(b.x,b.z)+SURFACE_LIFT.sand,0],uv=[.5,.5],idx=[];
  for(let r=1;r<=rings;r++){
    const q=r/rings;
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2;
      const w=1+.10*Math.sin(a*3+b.seed)+.055*Math.cos(a*5-b.seed)+.025*Math.sin(a*9+b.seed*.7);
      const x=Math.cos(a)*b.sx*w*.90*q;
      const z=Math.sin(a)*b.sz*w*.90*q;
      pos.push(x,terrainHeight(b.x+x,b.z+z)+SURFACE_LIFT.sand,z);
      uv.push(.5+.5*Math.cos(a)*q,.5+.5*Math.sin(a)*q);
    }
  }
  for(let i=0;i<segments;i++){
    const n=(i+1)%segments;
    idx.push(0,1+n,1+i);
  }
  for(let r=1;r<rings;r++){
    const a0=1+(r-1)*segments,b0=1+r*segments;
    for(let i=0;i<segments;i++){
      const n=(i+1)%segments;
      idx.push(a0+i,a0+n,b0+i,a0+n,b0+n,b0+i);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  applySlopeColors(g,(x,z)=>terrainHeight(b.x+x,b.z+z),{strength:.62});
  return g;
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

export function validateTerrain(){
  let min=Infinity,max=-Infinity,maxGrade=0,samples=0;
  const e=.45;
  for(let z=24;z>=-268;z-=8){
    for(let x=-64;x<=64;x+=8){
      const h=terrainHeight(x,z);
      if(!Number.isFinite(h))return {ok:false,reason:'NON_FINITE_HEIGHT',x,z};
      min=Math.min(min,h);max=Math.max(max,h);samples++;
      const dx=(terrainHeight(x+e,z)-terrainHeight(x-e,z))/(2*e);
      const dz=(terrainHeight(x,z+e)-terrainHeight(x,z-e))/(2*e);
      const grade=Math.hypot(dx,dz);
      if(!Number.isFinite(grade))return {ok:false,reason:'NON_FINITE_GRADE',x,z};
      maxGrade=Math.max(maxGrade,grade);
    }
  }
  return {ok:true,min,max,maxGrade,samples};
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

  // --- LOFT TERRAIN FABRIC ------------------------------------------------
  // Integration 014 removes the stacked fairway / fringe / green / bunker
  // planes entirely. One dense surface now owns both the visible world and
  // the physics height contract. This is the core anti-clipping architecture.
  const fiber=neutralFiberTexture({seed:2045});
  const terrainBump=makeBumpTexture({size:256,seed:771});
  terrainBump.repeat.set(22,42);
  terrainBump.wrapS=terrainBump.wrapT=THREE.RepeatWrapping;
  terrainBump.anisotropy=4;

  const terrainGeo=buildTerrainFabricGeometry(pin);
  const terrainMat=new THREE.MeshStandardMaterial({
    color:0xffffff,
    roughness:.94,
    metalness:0,
    vertexColors:true,
    map:fiber,
    bumpMap:terrainBump,
    bumpScale:.018
  });
  const terrain=new THREE.Mesh(terrainGeo,terrainMat);
  terrain.name='LOFT_TERRAIN_FABRIC';
  terrain.receiveShadow=true;
  world.add(terrain);

  // Compatibility aliases. These are deliberately the SAME mesh: there are no
  // overlapping fairway / green surfaces left to z-fight or trap the ball.
  const fairway=terrain;
  const fringe=terrain;
  const green=terrain;

  // --- CUP -----------------------------------------------------------------
  const cupGroup=new THREE.Group();cupGroup.name='LOFT_CUP';world.add(cupGroup);
  const holeMat=new THREE.MeshBasicMaterial({
    color:0x050606,side:THREE.DoubleSide,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-8,polygonOffsetUnits:-8
  });
  const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(.082,64),holeMat);
  holeDisc.rotation.x=-Math.PI/2;holeDisc.renderOrder=8;cupGroup.add(holeDisc);

  const rimMat=new THREE.MeshStandardMaterial({
    color:0xded8cc,roughness:.92,side:THREE.DoubleSide,
    transparent:true,opacity:.96,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-10,polygonOffsetUnits:-10
  });
  const cupRim=new THREE.Mesh(new THREE.RingGeometry(.078,.097,64),rimMat);
  cupRim.rotation.x=-Math.PI/2;cupRim.position.y=.0018;cupRim.renderOrder=9;cupGroup.add(cupRim);

  // A very shallow internal wall makes the cup read as an opening rather than
  // a painted circle without creating a collider that can reject the ball.
  const cupWall=new THREE.Mesh(
    new THREE.CylinderGeometry(.080,.080,.072,48,1,true),
    new THREE.MeshStandardMaterial({color:0x111313,roughness:1,side:THREE.BackSide,depthWrite:false})
  );
  cupWall.position.y=-.034;cupWall.renderOrder=7;cupGroup.add(cupWall);

  cupGroup.position.set(
    pin.x,
    courseSurfaceHeight(pin.x,pin.z,pin)+.0045,
    pin.z
  );

  // Bunker bowls are sculpted directly into terrainHeight() and colored by the
  // terrain fabric. No separate sand floor or lip geometry exists anymore.

  // --- COAST / WATER -------------------------------------------------------
  const waterMat=new THREE.MeshPhysicalMaterial({
    color:COLORS.water,roughness:.25,metalness:.02,transparent:true,opacity:.93,
    clearcoat:.28,clearcoatRoughness:.22
  });
  const water=new THREE.Mesh(new THREE.PlaneGeometry(170,340,1,1),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(108,-.16,-120);world.add(water);

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
  // LOFT wind-sculpted pines: soft clustered masses instead of stacked cones.
  // The silhouette stays stylized and ownable, but surfaces read as foliage.
  const pineLobeGeo=new THREE.IcosahedronGeometry(1,2);
  const pineMats=[
    mat(0x263f31,1),mat(0x31513a,1),mat(0x3d5f43,1)
  ];
  function pine(x,z,s=1){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.105*s,.19*s,2.55*s,12),mat(0x503928,.99));
    trunk.position.y=1.28*s;trunk.castShadow=true;g.add(trunk);

    const lobes=[
      {y:2.45,sc:[1.42,.72,1.28],off:[-.10,0,.04],m:2},
      {y:3.20,sc:[1.18,.70,1.12],off:[.12,0,-.05],m:1},
      {y:3.88,sc:[.94,.66,.90],off:[-.06,0,.02],m:0},
      {y:4.46,sc:[.60,.72,.58],off:[.04,0,0],m:1}
    ];
    lobes.forEach((l,i)=>{
      const crown=new THREE.Mesh(pineLobeGeo,pineMats[l.m]);
      crown.position.set(l.off[0]*s,l.y*s,l.off[2]*s);
      crown.scale.set(l.sc[0]*s,l.sc[1]*s,l.sc[2]*s);
      crown.rotation.set((rnd()-.5)*.08,rnd()*Math.PI,(rnd()-.5)*.06);
      crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
    });

    g.position.set(x,courseSurfaceHeight(x,z,pin),z);
    g.rotation.y=rnd()*Math.PI*2;
    world.add(g);
  }

  const trees=[
    [-31,-26,1.05],[-34,-48,.88],[-31,-71,1.12],[-35,-99,.86],[-31,-128,1.12],[-29,-151,.96],[-25,-180,.82],
    [27,-35,.78],[29,-61,.72],[30,-94,.80],[31,-126,.88],[28,-151,.76],[-21,-204,.76],[-29,-222,.91],
    [-43,-35,.70],[-45,-89,.77],[-42,-145,.72],[22,-204,.70]
  ];
  trees.forEach(v=>pine(...v));

  // Volumetric near-lie turf. The previous billboard planes read as giant
  // rectangular cards on iPhone. These tapered 3-sided blades are actual 3D
  // geometry and only exist in a small radius around the current ball.
  const dummy=new THREE.Object3D();
  const detailBladeGeo=new THREE.ConeGeometry(.010,.10,5,1,false);
  detailBladeGeo.translate(0,.05,0);
  const detailBladeMat=new THREE.MeshStandardMaterial({color:0x78906a,roughness:1});
  const detailGrass=new THREE.InstancedMesh(detailBladeGeo,detailBladeMat,360);
  detailGrass.castShadow=false;detailGrass.receiveShadow=true;
  detailGrass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(detailGrass);

  function setDetailFocus(position,surface='fairway'){
    const seed=Math.floor((position.x+96)*31+(position.z+330)*19);
    const rr=seeded(seed>>>0);
    let height=.026,radius=3.0,count=105,color=0x7f976f;
    if(surface==='rough'){height=.105;radius=3.6;count=265;color=0x657b55;}
    else if(surface==='fringe'){height=.045;radius=3.0;count=145;color=0x789268;}
    else if(surface==='green'){height=0;radius=2.4;count=0;color=0x93aa7e;}
    else if(surface==='tee'){height=.024;radius=2.8;count=100;color=0x819a70;}
    else if(surface==='sand'||surface==='water'){height=0;count=0;}
    detailGrass.material.color.setHex(color);

    for(let i=0;i<360;i++){
      if(i>=count||height===0){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);
        dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const a=rr()*Math.PI*2,r=Math.sqrt(rr())*radius;
      const x=position.x+Math.cos(a)*r,z=position.z+Math.sin(a)*r;
      const y=courseSurfaceHeight(x,z,pin);
      const h=height*(.72+rr()*.62);
      dummy.position.set(x,y+.004,z);
      dummy.rotation.set((rr()-.5)*.12,rr()*Math.PI*2,(rr()-.5)*.12);
      dummy.scale.set(.78+rr()*.50,h/.10,.78+rr()*.50);
      dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);
    }
    detailGrass.instanceMatrix.needsUpdate=true;
  }


  // Native rough field: sparse permanent 3D blades placed only outside the
  // playable fairway. This gives the course a living edge without filling the
  // green with visual noise or adding any collision geometry.
  const nativeBladeGeo=new THREE.ConeGeometry(.016,.16,5,1,false);
  nativeBladeGeo.translate(0,.08,0);
  const nativeBladeMat=new THREE.MeshStandardMaterial({color:0x64794f,roughness:1});
  const nativeGrass=new THREE.InstancedMesh(nativeBladeGeo,nativeBladeMat,760);
  let nativeCount=0;
  for(let i=0;i<1500&&nativeCount<760;i++){
    const z=-8-rnd()*246;
    const p=fairwayProfile(z);
    const side=rnd()<.5?-1:1;
    const x=p.center+side*(p.width+3.2+rnd()*25);
    if(Math.abs(x)>53||x>30)continue;
    if(courseSurfaceAt(x,z,pin)==='sand'||courseSurfaceAt(x,z,pin)==='water')continue;
    const h=.70+rnd()*1.75;
    dummy.position.set(x,courseSurfaceHeight(x,z,pin)+.004,z);
    dummy.rotation.set((rnd()-.5)*.13,rnd()*Math.PI*2,(rnd()-.5)*.11);
    dummy.scale.set(.65+rnd()*.85,h,.65+rnd()*.85);
    dummy.updateMatrix();nativeGrass.setMatrixAt(nativeCount++,dummy.matrix);
  }
  nativeGrass.count=nativeCount;
  nativeGrass.castShadow=false;nativeGrass.receiveShadow=true;
  world.add(nativeGrass);

  const shrubGeo=new THREE.IcosahedronGeometry(.48,2);
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
  lodge.position.set(-31,terrainHeight(-31,-150),-150);lodge.rotation.y=.10;lodge.scale.set(.95,.95,.95);world.add(lodge);

  const lighthouse=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.28,1.78,11.8,24),mat(COLORS.cream,.96));tower.position.y=5.9;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.57,1.57,.55,24),mat(COLORS.orange,.84));band.position.y=9.85;lighthouse.add(band);
  const balcony=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.18,24),mat(COLORS.ink,.84));balcony.position.y=11.08;lighthouse.add(balcony);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.46,1.46,1.3,24),new THREE.MeshStandardMaterial({color:0x526061,roughness:.36,metalness:.06}));room.position.y=11.72;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(1.86,2.35,24),mat(COLORS.ink,.84));roof2.position.y=13.55;lighthouse.add(roof2);
  lighthouse.position.set(37,terrainHeight(37,-172),-172);lighthouse.scale.set(.92,.92,.92);world.add(lighthouse);

  // --- ATMOSPHERE ----------------------------------------------------------
  const ctex=cloudTexture();
  const cloudMat=new THREE.MeshBasicMaterial({map:ctex,transparent:true,depthWrite:false,opacity:.54,side:THREE.DoubleSide});
  [[-42,23,-180,34,15],[32,28,-236,42,18],[8,31,-110,30,13]].forEach(([x,y,z,w,h])=>{
    const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cloudMat.clone());
    q.position.set(x,y,z);q.rotation.y=.06;q.renderOrder=-1;world.add(q);
  });

  // --- PIN -----------------------------------------------------------------
  const poleMat=mat(COLORS.cream,.90);poleMat.transparent=true;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,4.5,12),poleMat);pole.position.set(pin.x,pin.y+SURFACE_LIFT.green+2.25,pin.z);world.add(pole);
  const fs=new THREE.Shape();fs.moveTo(0,0);fs.bezierCurveTo(.62,.08,1.55,.22,2.18,.49);fs.lineTo(0,1.02);fs.closePath();
  const flagMat=new THREE.MeshStandardMaterial({color:COLORS.orange,side:THREE.DoubleSide,roughness:.84,transparent:true});
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),flagMat);flag.position.set(pin.x,pin.y+SURFACE_LIFT.green+3.88,pin.z);flag.rotation.y=Math.PI/2;world.add(flag);

  function setPin(next){
    updateTerrainFabric(terrain,next);
    const cupY=courseSurfaceHeight(next.x,next.z,next)+.0045;
    cupGroup.position.set(next.x,cupY,next.z);
    pole.position.set(next.x,cupY+2.245,next.z);
    flag.position.set(next.x,cupY+3.875,next.z);
  }

  let pinAlpha=1;
  function setPinFade(alpha){
    pinAlpha=clamp(alpha,.08,1);
    pole.material.opacity=pinAlpha;flag.material.opacity=pinAlpha;
    pole.renderOrder=pinAlpha<.5?2:0;flag.renderOrder=pinAlpha<.5?2:0;
  }

  return {world,terrain,fairway,green,fringe,cupGroup,holeDisc,cupRim,pole,flag,water,setPin,setPinFade,setDetailFocus};
}
