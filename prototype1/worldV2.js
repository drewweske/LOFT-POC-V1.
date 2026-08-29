import * as THREE from '../vendor/three.module.js';
import {ROUND_HOLES} from './round.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const seeded=(seed=1)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

export const COLORS={
  ink:0x0B0D0D,
  cream:0xF2EFE8,
  stone:0xB8B1A6,
  orange:0xFF6A2A,
  rough:0x536f4c,
  roughLight:0x657e57,
  fair:0x789568,
  fairLight:0x8aa776,
  green:0x91aa79,
  fringe:0x7f986b,
  sand:0xd7c6a1,
  sandShade:0xbca47c,
  water:0x56777b,
  rock:0x736a5e,
  rockDark:0x504a43,
  sky:0xcbd8d7
};

/*
  INTEGRATION 014 — THE LOFT FIELD
  --------------------------------
  One continuous physical/rendered terrain surface.
  No fairway planes on top of rough.
  No green plane on top of fairway.
  No sand floor sitting above a hidden depression.

  The same terrainHeight() sampled by physics is the Y coordinate of every
  visible playable vertex. Surface identity changes material language, not
  collision geometry.
*/
export const SURFACE_LIFT=Object.freeze({
  rough:0,firstCut:0,fairway:0,tee:0,fringe:0,green:0,sand:0
});

export const BUNKERS=[
  {x:-13,z:-125,sx:7.2,sz:3.7,seed:.4},
  {x:24,z:-138,sx:7.4,sz:3.6,seed:1.7},
  {x:28,z:-190,sx:7.0,sz:3.8,seed:2.8},
  {x:-30,z:-239,sx:6.8,sz:3.4,seed:3.7}
];

const TEE_PADS=ROUND_HOLES.map((h,i)=>({
  x:h.tee[0],z:h.tee[1],rx:i===2?4.3:4.0,rz:i===2?3.0:2.8
}));

const GREENS=ROUND_HOLES.map((h,i)=>({
  x:h.pin[0],z:h.pin[1],
  rx:i===2?10.8:9.8,
  rz:i===2?7.7:7.0,
  fringeX:i===2?12.7:11.6,
  fringeZ:i===2?9.5:8.6,
  seed:17+i*23
}));

export function fairwayProfile(z){
  const t=clamp((-z+2)/246,0,1);
  const center=
    -1.1+
    Math.sin(t*Math.PI*1.16)*3.45-
    Math.sin(t*Math.PI*2.62)*1.72+
    Math.sin(t*Math.PI*4.85)*.54;
  const width=
    8.9+
    8.2*Math.sin(Math.PI*clamp(t,0,1))+
    1.35*Math.sin(t*Math.PI*3.25);
  return {t,center,width,insideRange:z<=12&&z>=-252};
}


function fairwayEdgeWidth(z,side){
  const p=fairwayProfile(z);
  const phase=side<0?1.37:-.62;
  const organic=
    .62*Math.sin((z+24)*.061+phase)+
    .28*Math.sin((z-17)*.143-phase*.7)+
    .16*Math.cos((z+81)*.227+phase);
  return p.width+organic;
}

function fairwaySignedDistance(x,z){
  const p=fairwayProfile(z);
  if(!p.insideRange)return Infinity;
  const side=x<p.center?-1:1;
  return Math.abs(x-p.center)-fairwayEdgeWidth(z,side);
}

function hash2(ix,iz){
  let n=(ix*374761393+iz*668265263)^0x5bf03635;
  n=(n^(n>>>13))*1274126177;
  return ((n^(n>>>16))>>>0)/4294967295;
}
function valueNoise(x,z){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const a=hash2(ix,iz),b=hash2(ix+1,iz),c=hash2(ix,iz+1),d=hash2(ix+1,iz+1);
  return lerp(lerp(a,b,ux),lerp(c,d,ux),uz)*2-1;
}
function fbm(x,z){
  let sum=0,amp=.56,freq=1;
  for(let i=0;i<3;i++){
    sum+=valueNoise(x*freq,z*freq)*amp;
    freq*=2.03;amp*=.47;
  }
  return sum;
}

function baseLandHeight(x,z){
  const t=clamp((-z+14)/284,0,1);
  const p=fairwayProfile(z);
  const lateral=x-p.center;

  // Macro architecture: broad golf-scale landforms.
  const climb=3.55*smoothstep(.03,.94,t);
  const ridge=
    2.58*Math.exp(-Math.pow((z+168)/66,2))*
    (.66+.34*Math.exp(-Math.pow((lateral+2)/29,2)));
  const shelfA=
    1.28*Math.exp(-Math.pow((z+82)/48,2))*
    (.74+.26*Math.exp(-Math.pow((lateral-3)/30,2)));
  const shelfB=
    2.08*Math.exp(-Math.pow((z+226)/40,2))*
    (.70+.30*Math.exp(-Math.pow((lateral+1)/31,2)));
  const saddleA=-.94*Math.exp(-Math.pow((z+121)/43,2))*Math.exp(-Math.pow((lateral+9)/32,2));
  const saddleB=-.52*Math.exp(-Math.pow((z+203)/27,2))*Math.exp(-Math.pow((lateral-8)/25,2));

  // Visible, low-frequency natural shaping. No invisible micro-divots.
  const earth=.23*fbm((x+140)*.030,(z+330)*.030)+.070*fbm((x-60)*.071,(z+70)*.071);
  const crossfall=.0096*lateral*Math.sin((z+22)*.0115);
  const broadRoll=.14*Math.sin((z+20)*.021)+.085*Math.cos((z-42)*.038);
  // Drainage and shoulder rolls are deliberately broad and visible.
  const shoulder=.105*Math.sin((z+40)*.034)*
    Math.exp(-Math.pow((Math.abs(lateral)-p.width*.72)/6.8,2));
  const swale=-.085*Math.exp(-Math.pow((lateral+6.5)/8.4,2))*
    Math.exp(-Math.pow((z+148)/62,2));

  // Coastal bluff transitions gradually into the ocean shelf.
  const coastEdge=37.5+2.1*Math.sin((z+32)*.020)+1.1*Math.sin((z-50)*.057);
  const coast=-5.75*smoothstep(coastEdge,coastEdge+12,x);

  return climb+ridge+shelfA+shelfB+saddleA+saddleB+earth+crossfall+broadRoll+shoulder+swale+coast;
}

function nearestGreen(x,z){
  let best=null,bestD=Infinity;
  for(const g of GREENS){
    const d=greenMetric(g,x,z,true);
    if(d<bestD){bestD=d;best=g;}
  }
  return {g:best,d:bestD};
}

function shapedGreenHeight(g,x,z){
  const dx=x-g.x,dz=z-g.z;
  const base=baseLandHeight(x,z);
  const centerBase=baseLandHeight(g.x,g.z);
  // Golf-green contour: readable fall, tiny crown, no hidden noisy bumps.
  const plane=centerBase+dx*.0053+dz*.0035;
  const crown=.055*Math.exp(-((dx*dx)/(7.0*7.0)+(dz*dz)/(5.3*5.3)));
  const shoulder=-.028*Math.exp(-((dx-4.0)*(dx-4.0)/(4.6*4.6)+(dz+2.0)*(dz+2.0)/(4.0*4.0)));
  const authored=plane+crown+shoulder;
  const d=greenMetric(g,x,z,true);
  const blend=1-smoothstep(.72,1.10,d);
  return lerp(base,authored,blend);
}


function bunkerMetric(b,x,z){
  const nx=(x-b.x)/b.sx,nz=(z-b.z)/b.sz;
  const a=Math.atan2(nz,nx);
  const warp=1+
    .085*Math.sin(a*3+b.seed)+
    .045*Math.cos(a*5-b.seed*.7)+
    .022*Math.sin(a*8+b.seed*.3);
  return Math.hypot(nx,nz)/warp;
}

function bunkerShape(x,z){
  let delta=0;
  for(const b of BUNKERS){
    const r=bunkerMetric(b,x,z);
    if(r<1.16){
      const bowl=-.62*Math.pow(1-smoothstep(.20,1.00,r),1.60);
      const lip=.105*(1-smoothstep(.84,1.12,Math.abs(r-.94)+.84));
      delta=Math.min(delta,bowl)+Math.max(0,lip);
    }
  }
  return delta;
}

function teeShape(x,z,current){
  let h=current;
  for(const t of TEE_PADS){
    const dx=(x-t.x)/t.rx,dz=(z-t.z)/t.rz,d=Math.hypot(dx,dz);
    if(d<1.18){
      const center=baseLandHeight(t.x,t.z);
      const pad=center+(x-t.x)*.002+(z-t.z)*.001;
      const blend=1-smoothstep(.78,1.15,d);
      h=lerp(h,pad,blend);
    }
  }
  return h;
}

function rawTerrainHeight(x,z){
  let h=baseLandHeight(x,z);
  const ng=nearestGreen(x,z);
  if(ng.g&&ng.d<1.12)h=shapedGreenHeight(ng.g,x,z);
  h=teeShape(x,z,h);
  h+=bunkerShape(x,z);
  return h;
}

const TERRAIN_GRID=Object.freeze({
  xMin:-92,xMax:92,zMin:-292,zMax:52,nx:184,nz:344
});
const GRID_DX=(TERRAIN_GRID.xMax-TERRAIN_GRID.xMin)/TERRAIN_GRID.nx;
const GRID_DZ=(TERRAIN_GRID.zMax-TERRAIN_GRID.zMin)/TERRAIN_GRID.nz;
const GRID_W=TERRAIN_GRID.nx+1;
const GRID_CACHE=new Float32Array(GRID_W*(TERRAIN_GRID.nz+1));
GRID_CACHE.fill(NaN);

function gridSample(ix,iz){
  ix=clamp(ix,0,TERRAIN_GRID.nx);iz=clamp(iz,0,TERRAIN_GRID.nz);
  const k=iz*GRID_W+ix;
  let h=GRID_CACHE[k];
  if(Number.isNaN(h)){
    const x=TERRAIN_GRID.xMin+ix*GRID_DX;
    const z=TERRAIN_GRID.zMin+iz*GRID_DZ;
    h=rawTerrainHeight(x,z);GRID_CACHE[k]=h;
  }
  return h;
}

export function terrainHeight(x,z){
  if(x<TERRAIN_GRID.xMin||x>TERRAIN_GRID.xMax||z<TERRAIN_GRID.zMin||z>TERRAIN_GRID.zMax){
    return rawTerrainHeight(x,z);
  }
  const gx=(x-TERRAIN_GRID.xMin)/GRID_DX;
  const gz=(z-TERRAIN_GRID.zMin)/GRID_DZ;
  let ix=Math.floor(gx),iz=Math.floor(gz);
  if(ix>=TERRAIN_GRID.nx)ix=TERRAIN_GRID.nx-1;
  if(iz>=TERRAIN_GRID.nz)iz=TERRAIN_GRID.nz-1;
  const u=clamp(gx-ix,0,1),v=clamp(gz-iz,0,1);
  const h00=gridSample(ix,iz),h10=gridSample(ix+1,iz);
  const h01=gridSample(ix,iz+1),h11=gridSample(ix+1,iz+1);
  // Custom terrain geometry uses diagonal B↔C. Interpolate the exact same
  // triangles rather than a curved analytic field beneath a planar mesh.
  if(u+v<=1)return h00+u*(h10-h00)+v*(h01-h00);
  return h11+(1-u)*(h01-h11)+(1-v)*(h10-h11);
}

export function greenSurfaceHeight(center,x,z){
  const g=GREENS.reduce((best,v)=>{
    const d=(v.x-center.x)*(v.x-center.x)+(v.z-center.z)*(v.z-center.z);
    return !best||d<best.d?{v,d}:best;
  },null)?.v;
  return g?shapedGreenHeight(g,x,z):terrainHeight(x,z);
}

function bunkerAt(x,z){
  for(const b of BUNKERS){
    if(bunkerMetric(b,x,z)<=1)return true;
  }
  return false;
}
function teeAt(x,z){
  for(const t of TEE_PADS){
    const dx=(x-t.x)/t.rx,dz=(z-t.z)/t.rz;
    if(dx*dx+dz*dz<=1)return true;
  }
  return false;
}
function greenMetric(g,x,z,fringe=false){
  const rx=fringe?g.fringeX:g.rx,rz=fringe?g.fringeZ:g.rz;
  const nx=(x-g.x)/rx,nz=(z-g.z)/rz;
  const a=Math.atan2(nz,nx);
  const warp=1+
    .038*Math.sin(a*3+g.seed*.13)+
    .022*Math.cos(a*5-g.seed*.07)+
    .011*Math.sin(a*7+g.seed*.19);
  return Math.hypot(nx,nz)/warp;
}
function greenMetrics(x,z){
  let bestGreen=Infinity,bestFringe=Infinity;
  for(const g of GREENS){
    bestGreen=Math.min(bestGreen,greenMetric(g,x,z,false));
    bestFringe=Math.min(bestFringe,greenMetric(g,x,z,true));
  }
  return {green:bestGreen,fringe:bestFringe};
}
function coastEdge(z){
  return 39.0+2.1*Math.sin((z+32)*.020)+1.1*Math.sin((z-50)*.057);
}

export function courseSurfaceAt(x,z){
  if(x>coastEdge(z)+5&&z<-12)return'water';
  if(bunkerAt(x,z))return'sand';
  const gm=greenMetrics(x,z);
  if(gm.green<=1)return'green';
  if(gm.fringe<=1)return'fringe';
  if(teeAt(x,z))return'tee';
  const p=fairwayProfile(z);
  if(p.insideRange&&fairwaySignedDistance(x,z)<=0)return'fairway';
  return'rough';
}

const RGB={};
function rgb(hex){
  if(!RGB[hex])RGB[hex]=new THREE.Color(hex);
  return RGB[hex];
}
function mixColor(a,b,t){
  const A=rgb(a),B=rgb(b);
  return [lerp(A.r,B.r,t),lerp(A.g,B.g,t),lerp(A.b,B.b,t)];
}
function colorAt(x,z){
  const p=fairwayProfile(z);
  const edgeD=fairwaySignedDistance(x,z);
  const fairBlend=p.insideRange?1-smoothstep(-.55,1.20,edgeD):0;
  const firstBlend=p.insideRange?1-smoothstep(1.0,4.25,edgeD):0;

  let c=mixColor(COLORS.rough,COLORS.roughLight,clamp(firstBlend-fairBlend*.35,0,1));
  if(fairBlend>0){
    const mow=.5+.5*Math.sin((z+8)*.54);
    const fairTone=mixColor(COLORS.fair,COLORS.fairLight,.11+.10*mow);
    c=[lerp(c[0],fairTone[0],fairBlend),lerp(c[1],fairTone[1],fairBlend),lerp(c[2],fairTone[2],fairBlend)];
  }

  const gm=greenMetrics(x,z);
  const fringeBlend=1-smoothstep(.92,1.08,gm.fringe);
  if(fringeBlend>0){
    const F=rgb(COLORS.fringe);
    c=[lerp(c[0],F.r,fringeBlend),lerp(c[1],F.g,fringeBlend),lerp(c[2],F.b,fringeBlend)];
  }
  const greenBlend=1-smoothstep(.90,1.04,gm.green);
  if(greenBlend>0){
    const stripe=.5+.5*Math.sin((x+z*.18)*1.25);
    const G=new THREE.Color(COLORS.green).multiplyScalar(.965+.045*stripe);
    c=[lerp(c[0],G.r,greenBlend),lerp(c[1],G.g,greenBlend),lerp(c[2],G.b,greenBlend)];
  }

  if(teeAt(x,z)){
    const T=rgb(0x819b70),t=.92;
    c=[lerp(c[0],T.r,t),lerp(c[1],T.g,t),lerp(c[2],T.b,t)];
  }

  if(bunkerAt(x,z)){
    const S=rgb(COLORS.sand);
    const rake=.5+.5*Math.sin(x*2.45+z*1.74);
    const grain=valueNoise((x+40)*1.18,(z-10)*1.18);
    const n=.935+.050*rake+.020*grain;
    c=[S.r*n,S.g*n,S.b*n];
  }

  // Subtle material grain is evaluated per texel. True slope readability now
  // comes from the dense mesh normals + light, avoiding triangular color bands.
  const earth=.982+.024*valueNoise((x+80)*.24,(z+310)*.24);
  return [clamp(c[0]*earth,0,1),clamp(c[1]*earth,0,1),clamp(c[2]*earth,0,1)];
}


function makeCourseAlbedo(){
  const W=720,H=1344;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{alpha:false});
  const img=ctx.createImageData(W,H),d=img.data;
  for(let py=0;py<H;py++){
    const v=py/(H-1);
    const z=lerp(TERRAIN_GRID.zMax,TERRAIN_GRID.zMin,v);
    for(let px=0;px<W;px++){
      const u=px/(W-1);
      const x=lerp(TERRAIN_GRID.xMin,TERRAIN_GRID.xMax,u);
      const col=colorAt(x,z);
      // Broad baked relief complements real lighting and makes grade readable
      // even on a small phone display. Sampling across 1.6 m prevents any
      // single terrain triangle from becoming visible as a color polygon.
      const e=1.6;
      const h0=terrainHeight(x,z);
      const hL=terrainHeight(x-e,z),hR=terrainHeight(x+e,z);
      const hD=terrainHeight(x,z-e),hU=terrainHeight(x,z+e);
      const dx=(hR-hL)/(2*e),dz=(hU-hD)/(2*e);
      const curvature=((hL+hR+hD+hU)*.25-h0);
      const relief=clamp(1-dx*.095+dz*.060+curvature*.025,.91,1.085);
      const k=(py*W+px)*4;
      d[k]=Math.round(clamp(col[0]*relief,0,1)*255);
      d[k+1]=Math.round(clamp(col[1]*relief,0,1)*255);
      d[k+2]=Math.round(clamp(col[2]*relief,0,1)*255);
      d[k+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(canvas);
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.minFilter=THREE.LinearMipmapLinearFilter;
  t.magFilter=THREE.LinearFilter;
  t.generateMipmaps=true;t.anisotropy=8;
  return t;
}

function makeCourseRoughness(){
  const W=320,H=600;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{alpha:false});
  const img=ctx.createImageData(W,H),d=img.data;
  const values={green:198,fringe:216,fairway:224,tee:220,rough:246,sand:252,water:180};
  for(let py=0;py<H;py++){
    const z=lerp(TERRAIN_GRID.zMax,TERRAIN_GRID.zMin,py/(H-1));
    for(let px=0;px<W;px++){
      const x=lerp(TERRAIN_GRID.xMin,TERRAIN_GRID.xMax,px/(W-1));
      const q=values[courseSurfaceAt(x,z)]??240;
      const k=(py*W+px)*4;d[k]=d[k+1]=d[k+2]=q;d[k+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(canvas);
  t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;
  return t;
}

function makeMicroTexture(){
  const size=512,c=document.createElement('canvas');c.width=c.height=size;
  const x=c.getContext('2d'),rnd=seeded(14014);
  x.fillStyle='#f1f1ef';x.fillRect(0,0,size,size);
  for(let i=0;i<18500;i++){
    const v=215+Math.floor(rnd()*36);
    x.fillStyle=`rgba(${v},${v},${v},${.10+rnd()*.18})`;
    const px=rnd()*size,py=rnd()*size;
    x.fillRect(px,py,.45+rnd()*1.25,1.4+rnd()*4.2);
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(26,52);
  t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  return t;
}
function makeMicroBump(){
  const size=256,c=document.createElement('canvas');c.width=c.height=size;
  const x=c.getContext('2d'),rnd=seeded(777);
  x.fillStyle='#808080';x.fillRect(0,0,size,size);
  for(let i=0;i<12000;i++){
    const v=104+Math.floor(rnd()*52);
    x.fillStyle=`rgb(${v},${v},${v})`;
    x.fillRect(rnd()*size,rnd()*size,.6+rnd()*1.4,.8+rnd()*2.6);
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(31,62);t.anisotropy=8;
  return t;
}

function buildUnifiedTerrain(){
  const nx=TERRAIN_GRID.nx,nz=TERRAIN_GRID.nz;
  const pos=new Float32Array((nx+1)*(nz+1)*3);
  const uv=new Float32Array((nx+1)*(nz+1)*2);
  const idx=new Uint32Array(nx*nz*6);
  let pk=0,uk=0;
  for(let iz=0;iz<=nz;iz++){
    const z=TERRAIN_GRID.zMin+iz*GRID_DZ;
    for(let ix=0;ix<=nx;ix++){
      const x=TERRAIN_GRID.xMin+ix*GRID_DX;
      pos[pk++]=x;pos[pk++]=gridSample(ix,iz);pos[pk++]=z;
      uv[uk++]=ix/nx;uv[uk++]=iz/nz;
    }
  }
  let q=0;
  for(let iz=0;iz<nz;iz++){
    for(let ix=0;ix<nx;ix++){
      const a=iz*GRID_W+ix,b=a+1,c=a+GRID_W,d=c+1;
      idx[q++]=a;idx[q++]=c;idx[q++]=b;
      idx[q++]=b;idx[q++]=c;idx[q++]=d;
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(new THREE.BufferAttribute(idx,1));
  g.computeVertexNormals();g.computeBoundingSphere();
  return g;
}

function makeRockGeometry(seed=1){
  const rnd=seeded(seed);
  const g=new THREE.IcosahedronGeometry(1,2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const r=.88+rnd()*.20;
    p.setXYZ(i,x*r,y*(.72+rnd()*.30),z*r);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function makeBladeClumpGeometry(){
  const pos=[],idx=[];
  const blade=(ang,h,w)=>{
    const c=Math.cos(ang),s=Math.sin(ang);
    const rx=c*w,rz=s*w,tx=-s*w*.22,tz=c*w*.22;
    const n=pos.length/3;
    pos.push(-rx,0,-rz, rx,0,rz, tx,h,tz);
    idx.push(n,n+1,n+2);
  };
  blade(0,.18,.018);blade(Math.PI*.66,.16,.017);blade(Math.PI*1.31,.20,.016);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  g.computeVertexNormals();return g;
}

function waveTexture(){
  const size=256,c=document.createElement('canvas');c.width=c.height=size;
  const x=c.getContext('2d');
  const gr=x.createLinearGradient(0,0,size,size);
  gr.addColorStop(0,'#5a5a5a');gr.addColorStop(.5,'#b8b8b8');gr.addColorStop(1,'#676767');
  x.fillStyle=gr;x.fillRect(0,0,size,size);
  x.globalAlpha=.28;x.strokeStyle='#e8e8e8';x.lineWidth=1.1;
  for(let y=12;y<size;y+=19){
    x.beginPath();
    for(let px=0;px<=size;px+=8){
      const py=y+Math.sin(px*.075+y*.03)*3;
      px===0?x.moveTo(px,py):x.lineTo(px,py);
    }
    x.stroke();
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,20);return t;
}

const pineLobeGeo=new THREE.IcosahedronGeometry(1,2);
const pineTrunkGeo=new THREE.CylinderGeometry(.12,.20,3.1,12);
const pineBarkMat=new THREE.MeshStandardMaterial({color:0x49392c,roughness:1});
const pineLeafMats=[
  new THREE.MeshStandardMaterial({color:0x24432f,roughness:1}),
  new THREE.MeshStandardMaterial({color:0x2e5037,roughness:1}),
  new THREE.MeshStandardMaterial({color:0x395d40,roughness:1})
];

function placeOrganicPine(world,x,z,s,rnd){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(pineTrunkGeo,pineBarkMat);
  trunk.position.y=1.55*s;trunk.scale.setScalar(s);trunk.castShadow=true;g.add(trunk);

  const lobes=[
    {y:2.32,sc:[1.52,.60,1.34],off:[-.10,.00,.04],m:2},
    {y:2.88,sc:[1.34,.62,1.20],off:[.12,.00,-.06],m:1},
    {y:3.43,sc:[1.12,.64,1.02],off:[-.07,.00,.03],m:0},
    {y:3.93,sc:[.88,.65,.81],off:[.06,.00,-.02],m:1},
    {y:4.39,sc:[.59,.68,.55],off:[-.02,.00,.02],m:0}
  ];
  lobes.forEach((l,i)=>{
    const crown=new THREE.Mesh(pineLobeGeo,pineLeafMats[l.m]);
    crown.position.set(l.off[0]*s,l.y*s,l.off[2]*s);
    crown.scale.set(l.sc[0]*s,l.sc[1]*s,l.sc[2]*s);
    crown.rotation.set((rnd()-.5)*.07,rnd()*Math.PI,(rnd()-.5)*.06);
    crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
  });
  g.position.set(x,terrainHeight(x,z),z);
  g.rotation.y=rnd()*Math.PI*2;
  world.add(g);return g;
}


function makeSkyDome(){
  const g=new THREE.SphereGeometry(430,40,22);
  const p=g.attributes.position;
  const colors=new Float32Array(p.count*3);
  const top=new THREE.Color(0xb8cdd0);
  const horizon=new THREE.Color(0xdbe4e1);
  const warm=new THREE.Color(0xe8e0d2);
  for(let i=0;i<p.count;i++){
    const y=p.getY(i)/430;
    let col;
    if(y>=0){
      const t=clamp(Math.pow(y,.55),0,1);
      col=horizon.clone().lerp(top,t);
    }else{
      const t=clamp(-y*2.2,0,1);
      col=horizon.clone().lerp(warm,t*.72);
    }
    colors[i*3]=col.r;colors[i*3+1]=col.g;colors[i*3+2]=col.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false});
  const sky=new THREE.Mesh(g,m);sky.renderOrder=-100;return sky;
}

function makeCloudTexture(seed=1){
  const rnd=seeded(seed);
  const c=document.createElement('canvas');c.width=512;c.height=256;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  for(let i=0;i<8;i++){
    const cx=60+rnd()*390,cy=95+rnd()*80,rx=52+rnd()*92,ry=24+rnd()*43;
    const g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
    g.addColorStop(0,'rgba(255,252,245,.52)');
    g.addColorStop(.48,'rgba(255,252,245,.25)');
    g.addColorStop(1,'rgba(255,252,245,0)');
    x.save();x.translate(cx,cy);x.scale(1,ry/rx);x.translate(-cx,-cy);
    x.fillStyle=g;x.fillRect(cx-rx,cy-rx,rx*2,rx*2);x.restore();
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function makeGableRoofGeometry(width,depth,rise){
  const x=width/2,z=depth/2,y=0;
  const pos=[
    -x,y,-z, x,y,-z,  x,y,z, -x,y,z,
    -x,rise,0, x,rise,0
  ];
  const idx=[
    0,4,1, 1,4,5,
    3,2,4, 2,5,4,
    0,3,4,
    1,5,2,
    0,1,2, 0,2,3
  ];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}

export function validateTerrain(){
  let min=Infinity,max=-Infinity,maxGrade=0,samples=0;
  const e=.45;
  for(let z=28;z>=-276;z-=6){
    for(let x=-70;x<=70;x+=6){
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
  return {ok:true,min,max,maxGrade,samples,system:'LOFT_FIELD_V2'};
}

export function buildWorld(scene,pin){
  const world=new THREE.Group();world.name='LOFT_COASTAL_RIDGE_V2';scene.add(world);
  const rnd=seeded(204514);

  // --- ATMOSPHERIC WORLD SHELL --------------------------------------------
  const sky=makeSkyDome();sky.position.set(0,-32,-110);scene.add(sky);
  const cloudTex=makeCloudTexture(77);
  const cloudMat=new THREE.MeshBasicMaterial({
    map:cloudTex,transparent:true,opacity:.42,depthWrite:false,
    side:THREE.DoubleSide,fog:false
  });
  const clouds=[];
  [
    [-52,24,-190,42,16,.03],
    [34,30,-236,52,18,-.02],
    [4,27,-116,38,14,.01],
    [-18,34,-274,58,19,-.015]
  ].forEach(([x,y,z,w,h,r])=>{
    const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cloudMat.clone());
    q.position.set(x,y,z);q.rotation.y=r;q.renderOrder=-20;
    q.userData.baseX=x;q.userData.phase=r*70+z*.01;
    world.add(q);clouds.push(q);
  });

  // --- ONE CONTINUOUS PLAYABLE SURFACE ------------------------------------
  const terrainGeo=buildUnifiedTerrain();
  const albedo=makeCourseAlbedo(),roughnessMap=makeCourseRoughness(),bump=makeMicroBump();
  const terrainMat=new THREE.MeshStandardMaterial({
    color:0xffffff,map:albedo,bumpMap:bump,bumpScale:.014,
    roughness:1.0,roughnessMap,metalness:0
  });
  const terrain=new THREE.Mesh(terrainGeo,terrainMat);
  terrain.receiveShadow=true;terrain.castShadow=false;world.add(terrain);

  // --- WATER ---------------------------------------------------------------
  const waves=waveTexture();
  const waterMat=new THREE.MeshPhysicalMaterial({
    color:COLORS.water,roughness:.18,metalness:.01,transparent:true,opacity:.91,
    clearcoat:.34,clearcoatRoughness:.20,bumpMap:waves,bumpScale:.075
  });
  const water=new THREE.Mesh(new THREE.PlaneGeometry(190,350,1,1),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(116,-.22,-122);world.add(water);

  // --- COASTAL ROCK / BLUFF LANGUAGE --------------------------------------
  const rockMat=new THREE.MeshStandardMaterial({color:COLORS.rock,roughness:.98});
  const rockDark=new THREE.MeshStandardMaterial({color:COLORS.rockDark,roughness:1});
  const rg1=makeRockGeometry(91),rg2=makeRockGeometry(311);
  function rock(x,z,sx,sy,sz,rot=0,dark=false){
    const m=new THREE.Mesh(dark?rg2:rg1,dark?rockDark:rockMat);
    m.position.set(x,terrainHeight(x,z)-.10+sy*.28,z);
    m.scale.set(sx,sy,sz);m.rotation.set((rnd()-.5)*.20,rot,(rnd()-.5)*.11);
    m.castShadow=true;m.receiveShadow=true;world.add(m);return m;
  }
  for(let z=-25;z>-252;z-=11+rnd()*7){
    const edge=36+rnd()*7;
    rock(edge,z,3.2+rnd()*3.3,1.0+rnd()*1.9,2.8+rnd()*3.7,(rnd()-.5)*.55);
    if(rnd()>.28)rock(edge+2.3+rnd()*4,z-2+rnd()*4,1.2+rnd()*2.0,.65+rnd()*1.25,1.4+rnd()*2.7,rnd()*2.3,true);
  }
  for(let i=0;i<42;i++){
    const z=-18-rnd()*240,x=29+rnd()*15;
    rock(x,z,.38+rnd()*.95,.34+rnd()*.72,.42+rnd()*1.05,rnd()*Math.PI,rnd()>.63);
  }

  // --- TREES / SHRUBS ------------------------------------------------------
  const treePts=[
    [-31,-26,1.05],[-34,-48,.88],[-31,-71,1.12],[-35,-99,.86],[-31,-128,1.12],[-29,-151,.96],[-25,-180,.82],
    [27,-35,.78],[29,-61,.72],[30,-94,.80],[31,-126,.88],[28,-151,.76],[-21,-204,.76],[-29,-222,.91],
    [-43,-35,.70],[-45,-89,.77],[-42,-145,.72],[22,-204,.70],[16,-235,.78],[-37,-256,.84]
  ];
  const treeGroups=treePts.map(v=>placeOrganicPine(world,...v,rnd));

  const dummy=new THREE.Object3D();
  const shrubGeo=makeRockGeometry(501);
  const shrubMat=new THREE.MeshStandardMaterial({color:0x506544,roughness:1});
  const shrubs=new THREE.InstancedMesh(shrubGeo,shrubMat,260);
  let shrubCount=0;
  for(let i=0;i<460&&shrubCount<260;i++){
    const z=-12-rnd()*248,p=fairwayProfile(z);
    const side=rnd()<.5?-1:1,x=p.center+side*(p.width+5.5+rnd()*24);
    if(x>31||Math.abs(x)>58||courseSurfaceAt(x,z)==='sand')continue;
    const s=.34+rnd()*.95;
    dummy.position.set(x,terrainHeight(x,z)+.18*s,z);
    dummy.rotation.set(rnd()*.18,rnd()*Math.PI,rnd()*.12);
    dummy.scale.set(1.45*s,.62*s,1.12*s);
    dummy.updateMatrix();shrubs.setMatrixAt(shrubCount++,dummy.matrix);
  }
  shrubs.count=shrubCount;shrubs.castShadow=true;shrubs.receiveShadow=true;world.add(shrubs);

  // --- ROUGH / DUNE GRASS --------------------------------------------------
  const bladeGeo=makeBladeClumpGeometry();
  const bladeMat=new THREE.MeshStandardMaterial({color:0x657a54,roughness:1,side:THREE.DoubleSide});
  const fieldGrass=new THREE.InstancedMesh(bladeGeo,bladeMat,1800);
  let fieldCount=0;
  for(let i=0;i<3600&&fieldCount<1800;i++){
    const z=18-rnd()*278,x=-62+rnd()*118;
    const s=courseSurfaceAt(x,z);
    if(s!=='rough'||x>31)continue;
    const fp=fairwayProfile(z);
    const edgeDist=Math.abs(x-fp.center)-fp.width;
    if(edgeDist>31&&rnd()>.20)continue;
    const h=.45+rnd()*.95;
    dummy.position.set(x,terrainHeight(x,z)+.006,z);
    dummy.rotation.set((rnd()-.5)*.06,rnd()*Math.PI*2,(rnd()-.5)*.06);
    dummy.scale.set(.75+rnd()*.55,h,.75+rnd()*.55);
    dummy.updateMatrix();fieldGrass.setMatrixAt(fieldCount++,dummy.matrix);
  }
  fieldGrass.count=fieldCount;fieldGrass.castShadow=false;fieldGrass.receiveShadow=true;world.add(fieldGrass);

  // High-density near-ball grass, regenerated per lie.
  const detailMat=new THREE.MeshStandardMaterial({color:0x78906a,roughness:1,side:THREE.DoubleSide});
  const detailGrass=new THREE.InstancedMesh(bladeGeo,detailMat,900);
  detailGrass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);world.add(detailGrass);
  function setDetailFocus(position,surface='fairway'){
    const rr=seeded((Math.floor((position.x+110)*37+(position.z+350)*29))>>>0);
    let height=.20,radius=3.5,count=190,color=0x78906a;
    if(surface==='rough'){height=.72;radius=4.4;count=760;color=0x617750;}
    else if(surface==='fringe'){height=.34;radius=3.4;count=330;color=0x768f65;}
    else if(surface==='green'){height=.07;radius=3.0;count=80;color=0x8da576;}
    else if(surface==='tee'){height=.15;radius=3.2;count=150;color=0x80996e;}
    else if(surface==='sand'||surface==='water'){height=0;count=0;}
    detailGrass.material.color.setHex(color);

    for(let i=0;i<900;i++){
      if(i>=count||height===0){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const a=rr()*Math.PI*2,r=Math.sqrt(rr())*radius;
      const x=position.x+Math.cos(a)*r,z=position.z+Math.sin(a)*r;
      const localSurface=courseSurfaceAt(x,z);
      if(localSurface==='sand'||localSurface==='water'){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const h=height*(.68+rr()*.62);
      dummy.position.set(x,terrainHeight(x,z)+.004,z);
      dummy.rotation.set((rr()-.5)*.08,rr()*Math.PI*2,(rr()-.5)*.08);
      dummy.scale.set(.58+rr()*.58,h,.58+rr()*.58);
      dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);
    }
    detailGrass.instanceMatrix.needsUpdate=true;
  }

  // --- CLUBHOUSE / LIGHTHOUSE ---------------------------------------------
  const lodge=new THREE.Group();
  const lodgeStone=new THREE.MeshStandardMaterial({color:0x756b59,roughness:.97});
  const plaster=new THREE.MeshStandardMaterial({color:0xd8d0c1,roughness:.93});
  const roofMat=new THREE.MeshStandardMaterial({color:COLORS.ink,roughness:.84});
  const base=new THREE.Mesh(new THREE.BoxGeometry(10.8,2.1,6.4,1,1,1),lodgeStone);base.position.y=1.05;base.castShadow=true;lodge.add(base);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(8.8,1.85,5.2),plaster);upper.position.y=3.0;upper.castShadow=true;lodge.add(upper);
  const roof=new THREE.Mesh(makeGableRoofGeometry(9.8,6.0,1.18),roofMat);
  roof.position.y=3.98;roof.castShadow=true;roof.receiveShadow=true;lodge.add(roof);
  const fasciaMat=new THREE.MeshStandardMaterial({color:0x332e28,roughness:.92});
  const fascia=new THREE.Mesh(new THREE.BoxGeometry(10.0,.14,6.12),fasciaMat);
  fascia.position.y=3.94;fascia.castShadow=true;lodge.add(fascia);
  for(const zz of [-1.55,-.52,.52,1.55]){
    const w=new THREE.Mesh(new THREE.PlaneGeometry(.62,.72),new THREE.MeshStandardMaterial({color:0x34454a,roughness:.25}));
    w.position.set(4.41,3.0,zz);w.rotation.y=Math.PI/2;lodge.add(w);
  }
  const deckMat=new THREE.MeshStandardMaterial({color:0x665443,roughness:.96});
  const deck=new THREE.Mesh(new THREE.BoxGeometry(11.7,.18,2.0),deckMat);
  deck.position.set(.35,1.65,4.0);deck.castShadow=true;lodge.add(deck);
  for(let i=-4;i<=4;i+=2){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.0,8),roofMat);
    post.position.set(i*.95,2.15,4.78);lodge.add(post);
  }
  const rail=new THREE.Mesh(new THREE.BoxGeometry(8.2,.055,.055),roofMat);
  rail.position.set(0,2.48,4.78);lodge.add(rail);
  lodge.position.set(-31,terrainHeight(-31,-150),-150);lodge.rotation.y=.10;world.add(lodge);

  const lighthouse=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.26,1.77,11.8,36),new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.94}));
  tower.position.y=5.9;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,.52,36),new THREE.MeshStandardMaterial({color:COLORS.orange,roughness:.82}));
  band.position.y=9.85;lighthouse.add(band);
  const balcony=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.18,36),roofMat);balcony.position.y=11.08;lighthouse.add(balcony);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,1.25,36),new THREE.MeshStandardMaterial({color:0x526061,roughness:.32}));
  room.position.y=11.70;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(1.84,2.30,36),roofMat);roof2.position.y=13.50;lighthouse.add(roof2);
  lighthouse.position.set(37,terrainHeight(37,-172),-172);lighthouse.scale.set(.92,.92,.92);world.add(lighthouse);

  // --- CUP + FLAG -----------------------------------------------------------
  const cupGroup=new THREE.Group();cupGroup.name='LOFT_CUP';world.add(cupGroup);
  const holeMat=new THREE.MeshBasicMaterial({
    color:0x030404,side:THREE.DoubleSide,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-10,polygonOffsetUnits:-10
  });
  const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(.054,64),holeMat);
  holeDisc.rotation.x=-Math.PI/2;holeDisc.renderOrder=12;cupGroup.add(holeDisc);
  const rimMat=new THREE.MeshBasicMaterial({
    color:0xe0d9cc,side:THREE.DoubleSide,transparent:true,opacity:.92,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-12,polygonOffsetUnits:-12
  });
  const cupRim=new THREE.Mesh(new THREE.RingGeometry(.052,.061,64),rimMat);
  cupRim.rotation.x=-Math.PI/2;cupRim.position.y=.0015;cupRim.renderOrder=13;cupGroup.add(cupRim);

  const poleMat=new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.90,transparent:true});
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,4.4,16),poleMat);world.add(pole);
  const fs=new THREE.Shape();fs.moveTo(0,0);fs.bezierCurveTo(.62,.08,1.55,.22,2.18,.49);fs.lineTo(0,1.02);fs.closePath();
  const flagMat=new THREE.MeshStandardMaterial({color:COLORS.orange,side:THREE.DoubleSide,roughness:.84,transparent:true});
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),flagMat);flag.rotation.y=Math.PI/2;world.add(flag);

  function setPin(next){
    const y=terrainHeight(next.x,next.z);
    cupGroup.position.set(next.x,y+.004,next.z);
    pole.position.set(next.x,y+2.20,next.z);
    flag.position.set(next.x,y+3.80,next.z);
  }
  setPin(pin);

  let pinAlpha=1;
  function setPinFade(alpha){
    pinAlpha=clamp(alpha,.08,1);
    pole.material.opacity=pinAlpha;flag.material.opacity=pinAlpha;
    pole.renderOrder=pinAlpha<.5?2:0;flag.renderOrder=pinAlpha<.5?2:0;
  }

  let worldTime=0;
  function updateWorld(dt){
    worldTime+=dt;
    if(waves){
      waves.offset.x=(waves.offset.x+dt*.009)%1;
      waves.offset.y=(waves.offset.y+dt*.017)%1;
    }
    // Coastal wind is present, but restrained. The course should breathe,
    // never wobble like an arcade diorama.
    treeGroups.forEach((g,i)=>{
      g.rotation.z=Math.sin(worldTime*.72+i*.81)*.0028;
      g.rotation.x=Math.cos(worldTime*.54+i*.67)*.0016;
    });
    clouds.forEach((q,i)=>{
      q.position.x=q.userData.baseX+Math.sin(worldTime*.035+q.userData.phase)*5.5;
      q.position.y+=Math.sin(worldTime*.06+i)*.0009;
    });
    flag.rotation.z=Math.sin(worldTime*2.15)*.035+Math.sin(worldTime*3.8)*.012;
  }

  return {
    world,terrain,
    fairway:terrain,green:terrain,fringe:terrain,
    cupGroup,holeDisc,cupRim,pole,flag,water,
    setPin,setPinFade,setDetailFocus,updateWorld
  };
}
