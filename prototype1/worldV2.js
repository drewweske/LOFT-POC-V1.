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
  rough:0x465f42,
  roughLight:0x58734d,
  firstCut:0x647d52,
  firstCutLight:0x718a5c,
  fair:0x799665,
  fairLight:0x8aa572,
  green:0x95aa77,
  fringe:0x839b69,
  sand:0xd7c6a1,
  sandShade:0xbca47c,
  water:0x416f78,
  rock:0x736a5e,
  rockDark:0x504a43,
  sky:0xcbd8d7
};

export const COASTAL_AIR_SPEC=Object.freeze({
  system:'LOFT_COASTAL_AIR_V2',
  sky:Object.freeze({
    radius:430,widthSegments:40,heightSegments:22,
    top:0x668da2,upper:0x97b4bf,horizon:0xcbd8d7,warm:0xf2c187,
    upperStart:.018,upperPower:.38,zenithStart:.08,zenithEnd:.45,zenithStrength:.92,
    warmStrength:.42,warmFalloff:7.2,
    visibleRows:Object.freeze({low:.075,high:.24,minRgbDistance:.12,minLumaDistance:.055})
  }),
  fog:Object.freeze({color:COLORS.sky,near:235,far:530}),
  clouds:Object.freeze({
    sheets:4,drawCalls:4,textureCount:4,textureWidth:512,textureHeight:256,
    rawByteBudget:2*1024*1024,opacity:.68,borderPixels:8,
    coverage:Object.freeze({min:.16,max:.36}),
    effectivePeak:Object.freeze({min:.52,max:.68}),
    banks:Object.freeze([
      Object.freeze({position:Object.freeze([-58,31,-195]),size:Object.freeze([76,27]),rotation:.025,seed:77}),
      Object.freeze({position:Object.freeze([56,36,-252]),size:Object.freeze([92,32]),rotation:-.018,seed:120}),
      Object.freeze({position:Object.freeze([6,29,-146]),size:Object.freeze([60,23]),rotation:.012,seed:163}),
      Object.freeze({position:Object.freeze([-42,45,-310]),size:Object.freeze([110,38]),rotation:-.012,seed:206})
    ])
  }),
  atmosphere:Object.freeze({drawCallBudget:6,triangleBudget:2500,nonPlayable:true})
});

/*
  INTEGRATION 027 — COASTAL TURF & LIGHT READABILITY V2
  -----------------------------------------------------
  The exact terrain/contact field remains protected. This one shared spec
  keeps the baked grade response, live coastal light and material hierarchy
  pointed in the same direction, so the course reads as land rather than a
  stack of painted surface labels.
*/
export const COASTAL_TURF_LIGHT_SPEC=Object.freeze({
  system:'LOFT_COASTAL_TURF_LIGHT_V2',
  contactSystem:'LOFT_FIELD_V4_CONTACT',
  renderPhysicsContract:'TRIANGLE_HEIGHT_SHARED_NORMAL',
  textures:Object.freeze({
    count:3,
    albedo:Object.freeze({width:720,height:1344}),
    roughness:Object.freeze({width:320,height:600}),
    bump:Object.freeze({width:256,height:256,repeat:Object.freeze([31,62])}),
    anisotropy:8,
    maxRawBytes:5*1024*1024
  }),
  material:Object.freeze({roughness:.96,bumpScale:.014,metalness:0}),
  surfaceRoughness:Object.freeze({
    green:184,tee:192,fairway:205,fringe:218,firstCut:232,rough:248,sand:252,water:180
  }),
  relief:Object.freeze({sampleRadius:1.6,strength:.90,curvature:.45,min:.92,max:1.085}),
  lighting:Object.freeze({
    exposure:1.02,
    hemisphere:Object.freeze({sky:0xe8f0ed,ground:0x4c574a,intensity:.60}),
    key:Object.freeze({color:0xffdfbd,intensity:2.12,position:Object.freeze([-82,54,44]),target:Object.freeze([0,0,-122])}),
    fill:Object.freeze({color:0xc8dad9,intensity:.10,position:Object.freeze([52,34,-72])}),
    bounce:Object.freeze({color:0xe4d7c6,intensity:.05,position:Object.freeze([-18,14,64])})
  })
});

const TURF_KEY_VECTOR=(()=>{
  const p=COASTAL_TURF_LIGHT_SPEC.lighting.key.position;
  const t=COASTAL_TURF_LIGHT_SPEC.lighting.key.target;
  const x=p[0]-t[0],y=p[1]-t[1],z=p[2]-t[2],inv=1/Math.hypot(x,y,z);
  return Object.freeze({x:x*inv,y:y*inv,z:z*inv});
})();

export const COASTAL_ECOLOGY_SPEC=Object.freeze({
  system:'LOFT_COASTAL_ECOLOGY_V1',
  treeArchetypes:3,
  understoryFamilies:3,
  treeDrawCallBudget:4,
  totalDrawCallBudget:10,
  shadowDrawCallBudget:6,
  triangleBudget:150000,
  protectedSurfaces:Object.freeze(['fairway','firstCut','green','fringe','tee','sand']),
  nonPlayable:true
});

export const RIDGE_HOUSE_SPEC=Object.freeze({
  system:'LOFT_RIDGE_HOUSE_V1',
  position:Object.freeze({x:-39,z:-151,rotation:.09}),
  footprint:Object.freeze({width:18.5,depth:14}),
  drawCallBudget:7,
  shadowDrawCallBudget:5,
  triangleBudget:12000,
  nonPlayable:true
});

/*
  INTEGRATION 016 — LOFT TERRAIN SYSTEM V1
  ----------------------------------------
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

export const WATER_LEVEL=-.22;
const FIRST_CUT_WIDTH=2.35;

const TEE_PADS=ROUND_HOLES.map((h,i)=>({
  x:h.tee[0],z:h.tee[1],rx:i===2?4.3:4.0,rz:i===2?3.0:2.8
}));

const GREENS=ROUND_HOLES.map((h,i)=>({
  x:h.pin[0],z:h.pin[1],
  rx:i===2?10.8:9.8,
  rz:i===2?7.7:7.0,
  fringeX:i===2?12.7:11.6,
  fringeZ:i===2?9.5:8.6,
  seed:17+i*23,
  // Each green has an authored putting character. Values remain restrained
  // enough for readable mobile putting while giving the three holes identity.
  tiltX:[-.0048,.0072,-.0060][i],
  tiltZ:[-.0030,.0018,.0046][i],
  crownX:[-1.8,2.2,-2.4][i],
  crownZ:[1.0,-1.2,1.6][i]
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
  const crossfall=.0175*lateral*Math.sin((z+22)*.0115);
  const broadRoll=.14*Math.sin((z+20)*.021)+.085*Math.cos((z-42)*.038);
  // A broad landing crest followed by a shallow hollow breaks the opening
  // climb into a readable golf landform instead of one long visual ramp.
  const landingCrest=.75*Math.exp(-Math.pow((z+75)/25,2))*
    (.82+.18*Math.exp(-Math.pow(lateral/30,2)));
  const landingHollow=-.45*Math.exp(-Math.pow((z+102)/21,2))*
    Math.exp(-Math.pow(lateral/31,4));
  // Drainage and shoulder rolls are deliberately broad and visible.
  const shoulder=.22*Math.sin((z+40)*.034)*
    Math.exp(-Math.pow((Math.abs(lateral)-p.width*.72)/6.8,2));
  const swale=-.15*Math.exp(-Math.pow((lateral+6.5)/8.4,2))*
    Math.exp(-Math.pow((z+148)/62,2));
  // Course-architect scale features: a readable approach ramp into the Ridge
  // complex and a collection swale below the Lighthouse shelf. Both are broad
  // enough to read in silhouette and never masquerade as procedural bumps.
  const approachRamp=.52*Math.exp(-Math.pow((z+139)/30,2))*
    Math.exp(-Math.pow(lateral/25,4));
  const collection=-.27*Math.exp(-Math.pow((z+194)/27,2))*
    Math.exp(-Math.pow((lateral+8.5)/9.0,2));

  // Coastal bluff transitions gradually into the ocean shelf.
  const coastEdge=37.5+2.1*Math.sin((z+32)*.020)+1.1*Math.sin((z-50)*.057);
  const coast=-5.75*smoothstep(coastEdge,coastEdge+12,x);

  return climb+ridge+shelfA+shelfB+saddleA+saddleB+earth+crossfall+broadRoll+landingCrest+landingHollow+shoulder+swale+approachRamp+collection+coast;
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
  // Golf-green contour: an authored fall line, broad crown and one honest
  // collection shoulder. Nothing smaller than the player can visually read
  // is allowed to move a putt.
  const plane=centerBase+dx*g.tiltX+dz*g.tiltZ;
  const cdx=dx-g.crownX,cdz=dz-g.crownZ;
  const crown=.064*Math.exp(-((cdx*cdx)/(6.8*6.8)+(cdz*cdz)/(5.1*5.1)));
  const shoulder=-.036*Math.exp(-((dx+g.crownX*.72)*(dx+g.crownX*.72)/(4.8*4.8)+(dz-g.crownZ*.58)*(dz-g.crownZ*.58)/(4.1*4.1)));
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
  xMin:-92,xMax:92,zMin:-292,zMax:52,nx:230,nz:430
});
const GRID_DX=(TERRAIN_GRID.xMax-TERRAIN_GRID.xMin)/TERRAIN_GRID.nx;
const GRID_DZ=(TERRAIN_GRID.zMax-TERRAIN_GRID.zMin)/TERRAIN_GRID.nz;
const GRID_W=TERRAIN_GRID.nx+1;
const GRID_CACHE=new Float32Array(GRID_W*(TERRAIN_GRID.nz+1));
GRID_CACHE.fill(NaN);
const GRID_NORMAL_CACHE=new Float32Array(GRID_W*(TERRAIN_GRID.nz+1)*3);
GRID_NORMAL_CACHE.fill(NaN);

function gridSample(ix,iz){
  ix=clamp(ix,0,TERRAIN_GRID.nx);iz=clamp(iz,0,TERRAIN_GRID.nz);
  const k=iz*GRID_W+ix;
  let h=GRID_CACHE[k];
  if(Number.isNaN(h)){
    const x=TERRAIN_GRID.xMin+ix*GRID_DX;
    const z=TERRAIN_GRID.zMin+iz*GRID_DZ;
    GRID_CACHE[k]=rawTerrainHeight(x,z);
    // Return the same Float32 value on first and every later access. The mesh
    // consumes this cache too, so lazy initialization cannot move contact by a
    // fraction of a micron between otherwise identical samples.
    h=GRID_CACHE[k];
  }
  return h;
}

function ensureGridNormal(ix,iz){
  ix=clamp(ix,0,TERRAIN_GRID.nx);iz=clamp(iz,0,TERRAIN_GRID.nz);
  const k=(iz*GRID_W+ix)*3;
  if(Number.isNaN(GRID_NORMAL_CACHE[k])){
    const lx=Math.max(0,ix-1),rx=Math.min(TERRAIN_GRID.nx,ix+1);
    const dz=Math.max(0,iz-1),uz=Math.min(TERRAIN_GRID.nz,iz+1);
    const gx=(gridSample(rx,iz)-gridSample(lx,iz))/Math.max(GRID_DX,((rx-lx)*GRID_DX));
    const gz=(gridSample(ix,uz)-gridSample(ix,dz))/Math.max(GRID_DZ,((uz-dz)*GRID_DZ));
    const inv=1/Math.hypot(gx,1,gz);
    GRID_NORMAL_CACHE[k]=-gx*inv;
    GRID_NORMAL_CACHE[k+1]=inv;
    GRID_NORMAL_CACHE[k+2]=-gz*inv;
  }
  return k;
}

function gridNormal(ix,iz,out={x:0,y:1,z:0}){
  const k=ensureGridNormal(ix,iz);
  out.x=GRID_NORMAL_CACHE[k];out.y=GRID_NORMAL_CACHE[k+1];out.z=GRID_NORMAL_CACHE[k+2];
  return out;
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
  // ~0.80 m terrain cells preserve the authored roll while keeping the field
  // efficient enough for current iPhones. Custom geometry uses diagonal B↔C.
  // Interpolate the exact same
  // triangles rather than a curved analytic field beneath a planar mesh.
  if(u+v<=1)return h00+u*(h10-h00)+v*(h01-h00);
  return h11+(1-u)*(h01-h11)+(1-v)*(h10-h11);
}

/*
  One sampled terrain frame powers shading, ball contact and rolling. Heights
  remain exact to the rendered triangles; normals are barycentrically blended
  from the same vertex-normal field used by the mesh, so a visible fall line
  and a physical fall line cannot quietly disagree at a cell diagonal.
*/
export function sampleTerrain(x,z,out={}){
  if(x<TERRAIN_GRID.xMin||x>TERRAIN_GRID.xMax||z<TERRAIN_GRID.zMin||z>TERRAIN_GRID.zMax){
    const e=.40;
    const height=rawTerrainHeight(x,z);
    const gx=(rawTerrainHeight(x+e,z)-rawTerrainHeight(x-e,z))/(2*e);
    const gz=(rawTerrainHeight(x,z+e)-rawTerrainHeight(x,z-e))/(2*e);
    const inv=1/Math.hypot(gx,1,gz);
    out.height=height;
    out.normal=out.normal||{x:0,y:1,z:0};
    out.normal.x=-gx*inv;out.normal.y=inv;out.normal.z=-gz*inv;
    out.dx=gx;out.dz=gz;out.grade=Math.hypot(gx,gz);out.triangle=-1;
    return out;
  }

  const gx=(x-TERRAIN_GRID.xMin)/GRID_DX,gz=(z-TERRAIN_GRID.zMin)/GRID_DZ;
  let ix=Math.floor(gx),iz=Math.floor(gz);
  if(ix>=TERRAIN_GRID.nx)ix=TERRAIN_GRID.nx-1;
  if(iz>=TERRAIN_GRID.nz)iz=TERRAIN_GRID.nz-1;
  const u=clamp(gx-ix,0,1),v=clamp(gz-iz,0,1);
  const h00=gridSample(ix,iz),h10=gridSample(ix+1,iz);
  const h01=gridSample(ix,iz+1),h11=gridSample(ix+1,iz+1);
  const k00=ensureGridNormal(ix,iz),k10=ensureGridNormal(ix+1,iz);
  const k01=ensureGridNormal(ix,iz+1),k11=ensureGridNormal(ix+1,iz+1);
  let height,nx,ny,nz,tri;
  if(u+v<=1){
    const w=1-u-v;
    height=h00*w+h10*u+h01*v;
    nx=GRID_NORMAL_CACHE[k00]*w+GRID_NORMAL_CACHE[k10]*u+GRID_NORMAL_CACHE[k01]*v;
    ny=GRID_NORMAL_CACHE[k00+1]*w+GRID_NORMAL_CACHE[k10+1]*u+GRID_NORMAL_CACHE[k01+1]*v;
    nz=GRID_NORMAL_CACHE[k00+2]*w+GRID_NORMAL_CACHE[k10+2]*u+GRID_NORMAL_CACHE[k01+2]*v;tri=0;
  }else{
    const w11=u+v-1,w01=1-u,w10=1-v;
    height=h11*w11+h01*w01+h10*w10;
    nx=GRID_NORMAL_CACHE[k11]*w11+GRID_NORMAL_CACHE[k01]*w01+GRID_NORMAL_CACHE[k10]*w10;
    ny=GRID_NORMAL_CACHE[k11+1]*w11+GRID_NORMAL_CACHE[k01+1]*w01+GRID_NORMAL_CACHE[k10+1]*w10;
    nz=GRID_NORMAL_CACHE[k11+2]*w11+GRID_NORMAL_CACHE[k01+2]*w01+GRID_NORMAL_CACHE[k10+2]*w10;tri=1;
  }
  const inv=1/Math.max(1e-8,Math.hypot(nx,ny,nz));nx*=inv;ny*=inv;nz*=inv;
  out.height=height;out.normal=out.normal||{x:0,y:1,z:0};
  out.normal.x=nx;out.normal.y=ny;out.normal.z=nz;
  out.dx=-nx/Math.max(.18,ny);out.dz=-nz/Math.max(.18,ny);
  out.grade=Math.hypot(out.dx,out.dz);out.cellX=ix;out.cellZ=iz;out.triangle=tri;
  return out;
}

const CONTACT_SAMPLE={normal:{x:0,y:1,z:0}};
export function terrainContactY(x,z,radius=0){
  const s=sampleTerrain(x,z,CONTACT_SAMPLE);
  // Smooth normal offset keeps the visual ball tangent to readable slopes.
  // Clamp only guards non-playable coastal cliff extremes.
  const normalLift=radius/Math.max(.74,s.normal.y);
  return s.height+normalLift;
}

export function sweepTerrainSegment(a,b,radius=0){
  const CONTACT_EPS=2e-6;
  const contact=(t)=>{
    const x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t),z=lerp(a.z,b.z,t);
    return y-terrainContactY(x,z,radius);
  };
  const start=contact(0),end=contact(1);
  // A grounded ball moving away from the surface is not an impact. This is
  // essential for both launch and post-bounce separation.
  if(start<=CONTACT_EPS&&end>start+CONTACT_EPS)return null;
  // Every other grounded or penetrating segment is already in contact. In
  // particular, a lateral step into an uphill triangle must resolve at t=0;
  // waiting for a positive-to-negative root would miss the shared vertex.
  if(start<=CONTACT_EPS)return {t:0,x:a.x,y:terrainContactY(a.x,a.z,radius),z:a.z};

  const ts=[0,1],dx=b.x-a.x,dz=b.z-a.z;
  if(Math.abs(dx)>1e-9){
    const lo=Math.ceil((Math.min(a.x,b.x)-TERRAIN_GRID.xMin)/GRID_DX);
    const hi=Math.floor((Math.max(a.x,b.x)-TERRAIN_GRID.xMin)/GRID_DX);
    for(let i=Math.max(1,lo);i<=Math.min(TERRAIN_GRID.nx-1,hi);i++){
      const t=(TERRAIN_GRID.xMin+i*GRID_DX-a.x)/dx;if(t>1e-8&&t<1-1e-8)ts.push(t);
    }
  }
  if(Math.abs(dz)>1e-9){
    const lo=Math.ceil((Math.min(a.z,b.z)-TERRAIN_GRID.zMin)/GRID_DZ);
    const hi=Math.floor((Math.max(a.z,b.z)-TERRAIN_GRID.zMin)/GRID_DZ);
    for(let i=Math.max(1,lo);i<=Math.min(TERRAIN_GRID.nz-1,hi);i++){
      const t=(TERRAIN_GRID.zMin+i*GRID_DZ-a.z)/dz;if(t>1e-8&&t<1-1e-8)ts.push(t);
    }
  }
  ts.sort((p,q)=>p-q);
  const base=ts.slice();
  for(let i=0;i<base.length-1;i++){
    const ta=base[i],tb=base[i+1],tm=(ta+tb)*.5;
    const mx=lerp(a.x,b.x,tm),mz=lerp(a.z,b.z,tm);
    const ix=clamp(Math.floor((mx-TERRAIN_GRID.xMin)/GRID_DX),0,TERRAIN_GRID.nx-1);
    const iz=clamp(Math.floor((mz-TERRAIN_GRID.zMin)/GRID_DZ),0,TERRAIN_GRID.nz-1);
    const u0=(a.x-TERRAIN_GRID.xMin-ix*GRID_DX)/GRID_DX;
    const v0=(a.z-TERRAIN_GRID.zMin-iz*GRID_DZ)/GRID_DZ;
    const du=dx/GRID_DX,dv=dz/GRID_DZ,den=du+dv;
    if(Math.abs(den)>1e-10){
      const td=(1-u0-v0)/den;if(td>ta+1e-8&&td<tb-1e-8)ts.push(td);
    }
  }
  ts.sort((p,q)=>p-q);
  let prevT=ts[0],prevC=contact(prevT);
  for(let i=1;i<ts.length;i++){
    const t=ts[i];if(t-prevT<1e-8)continue;
    const c=contact(t);
    if(prevC>0&&c<=0){
      // Height is planar inside this interval; the shared smooth-normal sphere
      // lift is not perfectly linear, so refine the analytic crossing.
      let lo=prevT,hi=t;
      for(let k=0;k<10;k++){
        const mid=(lo+hi)*.5;if(contact(mid)>0)lo=mid;else hi=mid;
      }
      const hitT=hi;
      const x=lerp(a.x,b.x,hitT),z=lerp(a.z,b.z,hitT);
      return {t:hitT,x,y:terrainContactY(x,z,radius),z};
    }
    prevT=t;prevC=c;
  }
  return null;
}

export function greenSurfaceHeight(center,x,z){
  // Retained for compatibility; never expose the pre-tessellation analytic
  // green as a second physical surface.
  return terrainHeight(x,z);
}

function bunkerAt(x,z){
  for(const b of BUNKERS){
    if(bunkerMetric(b,x,z)<=1)return b;
  }
  return null;
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
function teeMetricAt(x,z){
  let best=Infinity;
  for(const t of TEE_PADS){
    const dx=(x-t.x)/t.rx,dz=(z-t.z)/t.rz;
    best=Math.min(best,Math.hypot(dx,dz));
  }
  return best;
}

export function waterAt(x,z){
  return z<-12&&x>coastEdge(z)&&terrainHeight(x,z)<=WATER_LEVEL+.015;
}

export function courseSurfaceAt(x,z){
  if(waterAt(x,z))return'water';
  if(bunkerAt(x,z))return'sand';
  const gm=greenMetrics(x,z);
  if(gm.green<=1)return'green';
  if(gm.fringe<=1)return'fringe';
  if(teeAt(x,z))return'tee';
  const p=fairwayProfile(z);
  if(p.insideRange){
    const edge=fairwaySignedDistance(x,z);
    if(edge<=0)return'fairway';
    if(edge<=FIRST_CUT_WIDTH)return'firstCut';
  }
  return'rough';
}

const RGB={};
function rgb(hex){
  // Canvas pixels are authored in sRGB. THREE.Color stores hexadecimal input
  // in linear working space, so using it here would encode the course twice
  // and crush (79,104,71) rough into roughly (20,35,16).
  if(!RGB[hex])RGB[hex]={r:((hex>>16)&255)/255,g:((hex>>8)&255)/255,b:(hex&255)/255};
  return RGB[hex];
}
function mixColor(a,b,t){
  const A=rgb(a),B=rgb(b);
  return [lerp(A.r,B.r,t),lerp(A.g,B.g,t),lerp(A.b,B.b,t)];
}
function colorAt(x,z){
  const p=fairwayProfile(z);
  const edgeD=fairwaySignedDistance(x,z);
  const fairBlend=p.insideRange?1-smoothstep(-.18,.42,edgeD):0;
  // Hold the intermediate cut at full value until its outer boundary. The
  // fairway mask is applied afterwards, producing three readable cuts without
  // layered geometry or a physics/visual seam.
  const firstBlend=p.insideRange?1-smoothstep(FIRST_CUT_WIDTH-.20,FIRST_CUT_WIDTH+.34,edgeD):0;

  // Rough is a broad, wind-combed living groundcover rather than a uniform
  // dark border. The low-frequency variation is deliberately quieter than a
  // texture overlay and remains legible after phone-sized mip filtering.
  const roughMacro=.5+.5*fbm((x+91)*.055,(z+307)*.055);
  const roughMix=clamp(.13+.20*roughMacro+.045*valueNoise(x*.21,z*.21),.10,.39);
  let c=mixColor(COLORS.rough,COLORS.roughLight,roughMix);
  if(firstBlend>0){
    const cutGrain=valueNoise((x-17)*.11,(z+43)*.08);
    const cutTone=mixColor(COLORS.firstCut,COLORS.firstCutLight,.25+.035*cutGrain);
    c=[lerp(c[0],cutTone[0],firstBlend),lerp(c[1],cutTone[1],firstBlend),lerp(c[2],cutTone[2],firstBlend)];
  }
  if(fairBlend>0){
    // Signed, gently warped mower passes support the contour instead of
    // overpowering it with evenly painted zebra bands.
    const mow=Math.sin((z+8)*.42+.24*valueNoise(x*.055,z*.035));
    const fairTone=mixColor(COLORS.fair,COLORS.fairLight,.20+.10*mow);
    const mowTone=1.002+.016*mow;
    c=[lerp(c[0],fairTone[0]*mowTone,fairBlend),lerp(c[1],fairTone[1]*mowTone,fairBlend),lerp(c[2],fairTone[2]*mowTone,fairBlend)];
  }

  const gm=greenMetrics(x,z);
  const fringeBlend=1-smoothstep(.92,1.08,gm.fringe);
  if(fringeBlend>0){
    const F=rgb(COLORS.fringe);
    c=[lerp(c[0],F.r,fringeBlend),lerp(c[1],F.g,fringeBlend),lerp(c[2],F.b,fringeBlend)];
  }
  const greenBlend=1-smoothstep(.90,1.04,gm.green);
  if(greenBlend>0){
    const stripe=Math.sin((x+z*.18)*.90+.10*valueNoise(x*.16,z*.13));
    const G=rgb(COLORS.green),tone=1+.035*stripe;
    c=[lerp(c[0],G.r*tone,greenBlend),lerp(c[1],G.g*tone,greenBlend),lerp(c[2],G.b*tone,greenBlend)];
  }

  const teeBlend=1-smoothstep(.86,1.08,teeMetricAt(x,z));
  if(teeBlend>0){
    const T=rgb(0x819b70),mow=1+.010*Math.sin(z*.48+x*.05),t=.92*teeBlend;
    c=[lerp(c[0],T.r*mow,t),lerp(c[1],T.g*mow,t),lerp(c[2],T.b*mow,t)];
  }

  const bunker=bunkerAt(x,z);
  if(bunker){
    const S=rgb(COLORS.sand);
    const nx=(x-bunker.x)/bunker.sx,nz=(z-bunker.z)/bunker.sz;
    const a=Math.atan2(nz,nx),r=bunkerMetric(bunker,x,z);
    const rake=.5+.5*Math.sin(r*31+a*2.4+bunker.seed*3.1);
    const grain=valueNoise((x+40)*1.18,(z-10)*1.18);
    const recessed=smoothstep(.58,1,r);
    const n=.955+.036*rake+.018*grain-.035*recessed;
    c=[S.r*n,S.g*n,S.b*n];
  }

  if(!bunker){
    const surface=courseSurfaceAt(x,z);
    const amplitude={rough:.050,firstCut:.035,fairway:.028,fringe:.035,green:.045,tee:.040}[surface]??0;
    // A soft two-scale weave gives maintained grass density at inspection
    // distance without individual black blade cards, repeated texture seams,
    // or high-frequency noise that would shimmer on a phone.
    const nap=valueNoise((x+13)*.82,(z-29)*.73)*.68+
      valueNoise((x-41)*1.63,(z+17)*1.29)*.32;
    const comb=surface==='green'?Math.sin((x-z*.11)*2.10)*.24:
      surface==='tee'?Math.sin((z+x*.08)*1.82)*.20:
      surface==='fairway'?Math.sin((z+x*.035)*1.34)*.16:0;
    const weave=amplitude*(nap+comb);
    c=[c[0]*(1+weave*.82),c[1]*(1+weave),c[2]*(1+weave*.72)];
  }

  // Subtle material grain is evaluated per texel. True slope readability now
  // comes from the dense mesh normals + light, avoiding triangular color bands.
  const earth=.995+.012*valueNoise((x+80)*.24,(z+310)*.24);
  return [clamp(c[0]*earth,0,1),clamp(c[1]*earth,0,1),clamp(c[2]*earth,0,1)];
}

function turfReliefAt(x,z){
  const spec=COASTAL_TURF_LIGHT_SPEC.relief,e=spec.sampleRadius;
  const h0=terrainHeight(x,z);
  const hL=terrainHeight(x-e,z),hR=terrainHeight(x+e,z);
  const hD=terrainHeight(x,z-e),hU=terrainHeight(x,z+e);
  const dx=(hR-hL)/(2*e),dz=(hU-hD)/(2*e);
  const curvature=(hL+hR+hD+hU)*.25-h0;
  const inv=1/Math.hypot(dx,1,dz);
  const lightDot=((-dx)*TURF_KEY_VECTOR.x+TURF_KEY_VECTOR.y+(-dz)*TURF_KEY_VECTOR.z)*inv;
  return clamp(1+(lightDot-TURF_KEY_VECTOR.y)*spec.strength-curvature*spec.curvature,spec.min,spec.max);
}

function roughnessByteAt(x,z,surface=courseSurfaceAt(x,z)){
  const base=COASTAL_TURF_LIGHT_SPEC.surfaceRoughness[surface]??240;
  // Fine response variation breaks a synthetic constant highlight without
  // becoming visible color noise. Green is kept especially restrained.
  const amplitude=surface==='green'||surface==='tee'?2:surface==='sand'?3:4;
  return Math.round(clamp(base+valueNoise((x+31)*.37,(z-19)*.31)*amplitude,0,255));
}

export function courseVisualSample(x,z){
  const surface=courseSurfaceAt(x,z);
  const base=colorAt(x,z),relief=turfReliefAt(x,z);
  const color=base.map(channel=>clamp(channel*relief,0,1));
  return {
    surface,color,relief,
    luma:color[0]*.2126+color[1]*.7152+color[2]*.0722,
    roughness:roughnessByteAt(x,z,surface)/255*COASTAL_TURF_LIGHT_SPEC.material.roughness
  };
}


function makeCourseAlbedo(){
  const {width:W,height:H}=COASTAL_TURF_LIGHT_SPEC.textures.albedo;
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
      // One broad grade cue complements the real light. Both now derive from
      // the same key vector, so a visible highlight can never imply the
      // opposite fall line from the physical terrain normal.
      const relief=turfReliefAt(x,z);
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
  t.generateMipmaps=true;t.anisotropy=COASTAL_TURF_LIGHT_SPEC.textures.anisotropy;
  return t;
}

function makeCourseRoughness(){
  const {width:W,height:H}=COASTAL_TURF_LIGHT_SPEC.textures.roughness;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{alpha:false});
  const img=ctx.createImageData(W,H),d=img.data;
  for(let py=0;py<H;py++){
    const z=lerp(TERRAIN_GRID.zMax,TERRAIN_GRID.zMin,py/(H-1));
    for(let px=0;px<W;px++){
      const x=lerp(TERRAIN_GRID.xMin,TERRAIN_GRID.xMax,px/(W-1));
      const q=roughnessByteAt(x,z);
      const k=(py*W+px)*4;d[k]=d[k+1]=d[k+2]=q;d[k+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(canvas);
  t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;
  t.anisotropy=COASTAL_TURF_LIGHT_SPEC.textures.anisotropy;
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
  const {width,height,repeat}=COASTAL_TURF_LIGHT_SPEC.textures.bump;
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const x=c.getContext('2d',{alpha:false});
  const img=x.createImageData(width,height),d=img.data;
  // Low-amplitude interlocking fibres survive mip filtering as a tactile
  // response. They do not create false putting-break lines or phone shimmer.
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const comb=Math.sin(py*2.42+Math.sin(px*.17)*.72)*5.8;
    const cross=Math.sin((px+py*.13)*1.73)*3.2;
    const grain=valueNoise((px+7)*.63,(py-11)*.67)*4.6;
    const v=Math.round(clamp(128+comb+cross+grain,96,160));
    const k=(py*width+px)*4;d[k]=d[k+1]=d[k+2]=v;d[k+3]=255;
  }
  x.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);
  t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;
  t.anisotropy=COASTAL_TURF_LIGHT_SPEC.textures.anisotropy;
  return t;
}

function buildUnifiedTerrain(){
  const nx=TERRAIN_GRID.nx,nz=TERRAIN_GRID.nz;
  const pos=new Float32Array((nx+1)*(nz+1)*3);
  const nor=new Float32Array((nx+1)*(nz+1)*3);
  const uv=new Float32Array((nx+1)*(nz+1)*2);
  const idx=new Uint32Array(nx*nz*6);
  let pk=0,nk=0,uk=0;
  const normalScratch={x:0,y:1,z:0};
  for(let iz=0;iz<=nz;iz++){
    const z=TERRAIN_GRID.zMin+iz*GRID_DZ;
    for(let ix=0;ix<=nx;ix++){
      const x=TERRAIN_GRID.xMin+ix*GRID_DX;
      pos[pk++]=x;pos[pk++]=gridSample(ix,iz);pos[pk++]=z;
      const n=gridNormal(ix,iz,normalScratch);
      nor[nk++]=n.x;nor[nk++]=n.y;nor[nk++]=n.z;
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
  g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(new THREE.BufferAttribute(idx,1));
  g.computeBoundingSphere();
  return g;
}

function makeRockGeometry(seed=1){
  // Shared subdivision keeps hero rocks smooth enough for a close camera while
  // coherent deformation preserves the broad coastal strata.
  const g=new THREE.IcosahedronGeometry(1,3);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    // IcosahedronGeometry duplicates vertices per face. Random displacement per
    // buffer vertex tears those shared corners open and exposes bright sky
    // triangles. Position-coherent shaping keeps every duplicate welded while
    // retaining broad, authored coastal planes.
    const wave=Math.sin(x*11.17+z*7.31+y*5.83+seed*.73)*.5+
      Math.sin(x*4.21-z*9.07+seed*1.19)*.25;
    const radial=.92+wave*.075;
    const softLayer=lerp(y,Math.round(y*3.2)/3.2,.14);
    p.setXYZ(i,x*radial,softLayer*(.78+.035*Math.sin(seed+y*4.7)),z*radial);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function makeHeadlandMassGeometry(seed=1){
  // A distant headland needs broad geological shelves, not another scaled
  // boulder. Repeated radii create deliberate strata while a restrained,
  // position-coherent profile keeps the silhouette natural from every orbit.
  const segments=18;
  const rings=[
    {y:0.00,rx:.91,rz:.97,c:0x343d3c},
    {y:0.07,rx:1.00,rz:1.00,c:0x3c403c},
    {y:0.19,rx:.96,rz:.96,c:0x4d4940},
    {y:0.31,rx:.93,rz:.93,c:0x584f43},
    {y:0.335,rx:.84,rz:.84,c:0x5e5446},
    {y:0.51,rx:.81,rz:.81,c:0x595044},
    {y:0.535,rx:.71,rz:.72,c:0x615649},
    {y:0.70,rx:.68,rz:.68,c:0x5c5245},
    {y:0.725,rx:.58,rz:.59,c:0x64584a},
    {y:0.90,rx:.55,rz:.55,c:0x605648},
    {y:0.92,rx:.50,rz:.51,c:0x46513f}
  ];
  const positions=[],colors=[],indices=[];
  const color=new THREE.Color();
  rings.forEach((ring,ri)=>{
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2;
      const identity=
        1+
        Math.sin(a*2.0+seed*.83)*.065+
        Math.sin(a*5.0-seed*1.31)*.028+
        Math.cos(a*3.0+seed*.37)*.018;
      const terraceLean=ring.y*(.025*Math.sin(seed*.61));
      const x=Math.cos(a)*ring.rx*identity+terraceLean;
      const z=Math.sin(a)*ring.rz*(1+Math.cos(a*4+seed)*.022)-ring.y*.026;
      positions.push(x,ring.y,z);
      color.setHex(ring.c);
      const faceShade=.93+.07*Math.max(0,Math.sin(a+.45));
      colors.push(color.r*faceShade,color.g*faceShade,color.b*faceShade);
    }
  });
  for(let r=0;r<rings.length-1;r++){
    for(let i=0;i<segments;i++){
      const ni=(i+1)%segments,a=r*segments+i,b=r*segments+ni;
      const c=(r+1)*segments+i,d=(r+1)*segments+ni;
      indices.push(a,c,b,b,c,d);
    }
  }
  const topIndex=positions.length/3;
  positions.push(.012,.935,-.014);
  color.setHex(0x46513f);colors.push(color.r,color.g,color.b);
  const topRing=(rings.length-1)*segments;
  for(let i=0;i<segments;i++)indices.push(topRing+i,topIndex,topRing+(i+1)%segments);
  const bottomIndex=positions.length/3;
  positions.push(0,0,0);
  color.setHex(0x343d3c);colors.push(color.r,color.g,color.b);
  for(let i=0;i<segments;i++)indices.push(bottomIndex,i,(i+1)%segments);

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  return g;
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

function shorelineX(z){
  for(let x=coastEdge(z);x<=TERRAIN_GRID.xMax;x+=.20){
    if(terrainHeight(x,z)<=WATER_LEVEL+.015)return x;
  }
  return TERRAIN_GRID.xMax;
}

function makeFoamRibbon(offset=.18,width=.34,opacity=.22){
  const positions=[],indices=[];
  let row=0;
  for(let z=-18;z>=-266;z-=2.6){
    const x=shorelineX(z)+offset+Math.sin(z*.083+offset*4)*.16;
    positions.push(x,WATER_LEVEL+.018,z,x+width,WATER_LEVEL+.019,z);
    if(row>0){
      const a=(row-1)*2,b=a+1,c=row*2,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    row++;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
  const m=new THREE.MeshBasicMaterial({
    color:COLORS.cream,transparent:true,opacity,depthWrite:false,
    side:THREE.DoubleSide,fog:true
  });
  const mesh=new THREE.Mesh(g,m);mesh.renderOrder=1;return mesh;
}

function makePineLobeGeometry(){
  const g=new THREE.SphereGeometry(1,16,10);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const edge=1+.055*Math.sin(x*5.2+z*3.8)+.035*Math.sin(z*7.1-y*4.3);
    p.setXYZ(i,x*edge,y*(.94+.025*Math.cos(x*4.7)),z*edge);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}
const pineLobeGeo=makePineLobeGeometry();

function makeShrubGeometry(){
  const positions=[],indices=[];
  const lobes=[
    {p:[-.46,.42,.03],s:[.78,.43,.68]},
    {p:[.37,.38,.10],s:[.70,.38,.66]},
    {p:[-.02,.62,-.13],s:[.73,.47,.70]},
    {p:[.02,.29,.39],s:[.62,.32,.55]}
  ];
  let offset=0;
  lobes.forEach((l,n)=>{
    const base=new THREE.SphereGeometry(1,12,8),p=base.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const edge=1+.045*Math.sin(x*5.1+z*3.9+n*1.7)+.025*Math.cos(y*6.2-z*4.1);
      positions.push(l.p[0]+x*l.s[0]*edge,l.p[1]+y*l.s[1],l.p[2]+z*l.s[2]*edge);
    }
    const idx=base.index.array;for(let i=0;i<idx.length;i++)indices.push(idx[i]+offset);
    offset+=p.count;base.dispose();
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const shrubClusterGeo=makeShrubGeometry();
const TREE_ARCHETYPES=Object.freeze({
  windswept:Object.freeze({
    size:1.08,
    trunk:{height:4.25,bottom:.22,top:.095,lean:-.42},
    lobes:Object.freeze([
      {p:[-.88,2.66,.06],s:[.92,.40,.72],tone:0x48654b},
      {p:[-.24,2.98,-.18],s:[1.20,.46,.92],tone:0x587554},
      {p:[-1.02,3.30,.14],s:[1.48,.48,1.02],tone:0x3e5c45},
      {p:[-.30,3.67,-.05],s:[1.06,.47,.84],tone:0x607c59},
      {p:[-.74,4.02,.08],s:[.68,.43,.58],tone:0x4d6e4d}
    ]),
    branches:Object.freeze([
      {a:[-.08,2.10,0],b:[-.82,2.70,.08],r:.075,tone:0x544638},
      {a:[-.10,2.46,0],b:[-1.22,3.16,-.12],r:.068,tone:0x4b3e32},
      {a:[-.14,2.88,.01],b:[-.72,3.60,.10],r:.056,tone:0x594a3a}
    ])
  }),
  ridge:Object.freeze({
    size:1.09,
    trunk:{height:5.10,bottom:.205,top:.075,lean:-.10},
    lobes:Object.freeze([
      {p:[.08,2.72,.02],s:[.86,.35,.72],tone:0x3b5943},
      {p:[-.18,3.12,-.10],s:[1.02,.39,.84],tone:0x4d6d4c},
      {p:[.10,3.55,.09],s:[.88,.40,.74],tone:0x426348},
      {p:[-.18,3.98,-.05],s:[.74,.41,.63],tone:0x587552},
      {p:[.02,4.38,.04],s:[.56,.40,.49],tone:0x45684a},
      {p:[-.13,4.72,0],s:[.34,.36,.32],tone:0x607f58}
    ]),
    branches:Object.freeze([
      {a:[-.02,2.45,0],b:[.56,2.85,.05],r:.060,tone:0x514235},
      {a:[-.06,2.83,0],b:[-.70,3.24,-.08],r:.055,tone:0x493b30},
      {a:[-.08,3.25,0],b:[.48,3.62,.06],r:.047,tone:0x574638}
    ])
  }),
  sentinel:Object.freeze({
    size:1.14,
    trunk:{height:4.60,bottom:.27,top:.10,lean:-.18},
    lobes:Object.freeze([
      {p:[-.72,3.30,.08],s:[1.26,.50,1.02],tone:0x3c5a43},
      {p:[.63,3.46,-.16],s:[1.24,.51,.96],tone:0x52704f},
      {p:[-.05,3.78,.11],s:[1.62,.57,1.20],tone:0x466548},
      {p:[-.78,4.05,-.06],s:[1.06,.48,.85],tone:0x607b57},
      {p:[.61,4.10,.09],s:[.98,.49,.77],tone:0x4d6d4c},
      {p:[.02,4.28,-.03],s:[.88,.50,.72],tone:0x587653}
    ]),
    branches:Object.freeze([
      {a:[-.05,2.54,0],b:[-1.16,3.28,.08],r:.086,tone:0x544438},
      {a:[-.07,2.65,0],b:[1.04,3.40,-.11],r:.082,tone:0x4a3c31},
      {a:[-.11,2.94,0],b:[-.66,3.80,.05],r:.068,tone:0x59483a},
      {a:[-.12,3.02,0],b:[.68,3.86,.04],r:.064,tone:0x4d3f33}
    ])
  })
});

const TREE_SITES=Object.freeze([
  {kind:'sentinel',x:-31,z:-29,s:1.03,r:-.10},{kind:'ridge',x:-43,z:-43,s:.86,r:.12},
  {kind:'ridge',x:-39,z:-70,s:.96,r:-.08},{kind:'sentinel',x:-44,z:-96,s:.82,r:.08},
  {kind:'ridge',x:-42,z:-126,s:.92,r:-.11},{kind:'sentinel',x:-38,z:-157,s:1.04,r:.06},
  {kind:'ridge',x:-34,z:-184,s:.88,r:-.08},{kind:'sentinel',x:-31,z:-211,s:.90,r:.09},
  {kind:'ridge',x:-42,z:-246,s:.92,r:-.05},
  {kind:'windswept',x:29,z:-36,s:.82,r:.04},{kind:'windswept',x:32,z:-63,s:.90,r:-.08},
  {kind:'windswept',x:31,z:-101,s:.84,r:.10},{kind:'windswept',x:30,z:-132,s:.92,r:-.06},
  {kind:'windswept',x:29,z:-161,s:.78,r:.07},{kind:'windswept',x:27,z:-196,s:.84,r:-.09},
  {kind:'windswept',x:24,z:-225,s:.77,r:.05},{kind:'ridge',x:18,z:-247,s:.76,r:-.04},
  {kind:'sentinel',x:-25,z:-229,s:.78,r:.08}
]);

const UNDERSTORY_COMMUNITIES=Object.freeze([
  {family:'heath',anchors:[[-38,-24],[-42,-82],[-35,-181],[27,-48],[30,-112],[27,-178],[23,-231]],members:12,rx:5.2,rz:7.2},
  {family:'gorse',anchors:[[-47,-48],[-44,-119],[-36,-164],[-32,-220],[33,-78],[29,-151]],members:9,rx:4.1,rz:5.0},
  {family:'evergreen',anchors:[[-34,-143],[-25,-151],[-28,-203],[22,-205],[-38,-243]],members:8,rx:3.6,rz:4.2}
]);

// These communities follow the maintained cut without tracing it uniformly.
// The missing stretches are intentional windows toward the lodge, lighthouse,
// landing shelves and green rather than failed distribution attempts.
const FESCUE_COMMUNITIES=Object.freeze([
  {zone:'inland-lee',anchors:[[-27,-19],[-31,-48],[-29,-82],[-32,-112],[-28,-146],[-31,-178],[-27,-208],[-25,-238]],members:62,rx:6.6,rz:8.4},
  {zone:'windward-heath',anchors:[[24,-22],[27,-51],[27,-83],[26,-116],[25,-149],[23,-181],[21,-212],[18,-240]],members:62,rx:5.8,rz:8.0},
  {zone:'sheltered-pocket',anchors:[[-43,-67],[-39,-197],[31,-98],[27,-225]],members:48,rx:4.4,rz:5.6}
]);

// Rock coordinates are defined relative to the authored coastline. Their
// physical-looking mass stays inside the already non-playable water/cliff
// threshold, avoiding a second invisible collision language on the course.
const COASTAL_ROCK_COMMUNITIES=Object.freeze([
  {family:'shelf',seed:91,color:COLORS.rock,sites:[
    {z:-24,o:.3,s:[3.5,1.20,3.0],r:-.22},{z:-43,o:1.1,s:[4.4,1.42,3.8],r:.18},
    {z:-68,o:-.2,s:[3.0,1.02,3.4],r:-.31},{z:-91,o:.8,s:[4.8,1.56,4.1],r:.12},
    {z:-116,o:.1,s:[3.7,1.18,3.1],r:.35},{z:-141,o:1.4,s:[4.6,1.50,4.4],r:-.16},
    {z:-167,o:.5,s:[3.2,1.08,3.8],r:.27},{z:-190,o:1.0,s:[4.4,1.46,3.5],r:-.28},
    {z:-214,o:.2,s:[3.6,1.18,3.2],r:.18},{z:-238,o:1.3,s:[4.8,1.55,4.2],r:-.09},
    {z:-258,o:.5,s:[3.4,1.12,3.7],r:.31},{z:-74,o:4.4,s:[1.7,.70,1.9],r:.72},
    {z:-156,o:4.1,s:[1.8,.72,1.5],r:-.64},{z:-226,o:4.6,s:[1.6,.64,1.9],r:.49}
  ]},
  {family:'dark',seed:311,color:COLORS.rockDark,sites:[
    {z:-31,o:4.2,s:[1.5,.72,1.8],r:.54},{z:-56,o:2.9,s:[1.9,.84,1.6],r:-.43},
    {z:-82,o:5.2,s:[1.3,.60,1.6],r:.81},{z:-105,o:3.2,s:[1.7,.78,2.0],r:-.57},
    {z:-129,o:4.8,s:[1.4,.65,1.6],r:.38},{z:-151,o:2.7,s:[2.0,.88,1.8],r:-.21},
    {z:-177,o:4.5,s:[1.5,.67,1.9],r:.66},{z:-201,o:3.1,s:[1.8,.80,1.5],r:-.74},
    {z:-224,o:5.1,s:[1.4,.62,1.7],r:.24},{z:-247,o:3.0,s:[1.9,.82,1.8],r:-.46}
  ]}
]);

function makeLobedEcologyGeometry(lobes,segments=10,rings=7,branches=[]){
  const positions=[],colors=[],indices=[];let offset=0;
  lobes.forEach((l,n)=>{
    const base=new THREE.SphereGeometry(1,segments,rings),p=base.attributes.position;
    const tone=new THREE.Color(l.tone);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const edge=1+.048*Math.sin(x*5.3+z*4.1+n*1.83)+.025*Math.cos(y*6.4-z*3.6+n);
      positions.push(l.p[0]+x*l.s[0]*edge,l.p[1]+y*l.s[1],l.p[2]+z*l.s[2]*edge);
      const shade=.88+.12*clamp((y+1)*.5,0,1);
      colors.push(tone.r*shade,tone.g*shade,tone.b*shade);
    }
    const idx=base.index.array;for(let i=0;i<idx.length;i++)indices.push(idx[i]+offset);
    offset+=p.count;base.dispose();
  });
  branches.forEach(branch=>{
    const a=new THREE.Vector3(...branch.a),b=new THREE.Vector3(...branch.b),direction=b.clone().sub(a);
    const base=new THREE.CylinderGeometry(branch.r*.62,branch.r,direction.length(),7,1,false);
    base.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
    base.translate((a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5);
    const p=base.attributes.position,tone=new THREE.Color(branch.tone);
    for(let i=0;i<p.count;i++){
      positions.push(p.getX(i),p.getY(i),p.getZ(i));
      const shade=.88+.12*clamp(p.getY(i)/5,0,1);colors.push(tone.r*shade,tone.g*shade,tone.b*shade);
    }
    const idx=base.index.array;for(let i=0;i<idx.length;i++)indices.push(idx[i]+offset);
    offset+=p.count;base.dispose();
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}

function makeEcologyTrunkGeometry(spec){
  const g=new THREE.CylinderGeometry(spec.top,spec.bottom,spec.height,9,5,false);
  g.translate(0,spec.height*.5,0);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),t=clamp(y/spec.height,0,1);
    p.setX(i,p.getX(i)+spec.lean*Math.pow(t,1.55));
    p.setZ(i,p.getZ(i)+Math.sin(t*Math.PI)*.035);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function understoryLobes(family){
  if(family==='heath')return [
    {p:[-.48,.28,.02],s:[.78,.27,.68],tone:0x465c40},{p:[.32,.27,.10],s:[.68,.25,.61],tone:0x526947},
    {p:[-.04,.39,-.14],s:[.74,.30,.70],tone:0x3e563c},{p:[.03,.20,.38],s:[.62,.20,.53],tone:0x647551}
  ];
  if(family==='gorse')return [
    {p:[-.34,.35,0],s:[.52,.40,.48],tone:0x596542},{p:[.28,.38,.08],s:[.48,.44,.46],tone:0x6d7143},
    {p:[0,.58,-.05],s:[.50,.48,.47],tone:0x77764a},{p:[.02,.25,.31],s:[.42,.31,.40],tone:0x4e5f3d}
  ];
  return [
    {p:[-.31,.34,.03],s:[.57,.36,.54],tone:0x324d37},{p:[.30,.34,.02],s:[.57,.36,.54],tone:0x3b573c},
    {p:[0,.56,-.06],s:[.64,.44,.60],tone:0x294432},{p:[0,.23,.28],s:[.48,.28,.45],tone:0x486346}
  ];
}

function ecologyFingerprint(sites){
  let hash=2166136261;
  for(const site of sites){
    const value=`${site.type}|${site.family}|${site.x.toFixed(3)}|${site.y.toFixed(3)}|${site.z.toFixed(3)}`;
    for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

function buildCoastalEcology(world){
  const ecology=new THREE.Group();ecology.name=COASTAL_ECOLOGY_SPEC.system;
  ecology.userData.nonPlayable=true;ecology.userData.physics='NONE_VISUAL_ECOLOGY';
  ecology.userData.drawCallBudget=COASTAL_ECOLOGY_SPEC.totalDrawCallBudget;
  ecology.userData.triangleBudget=COASTAL_ECOLOGY_SPEC.triangleBudget;
  ecology.userData.sites=[];world.add(ecology);
  const dummy=new THREE.Object3D();
  const barkMat=new THREE.MeshStandardMaterial({color:0x4b3e31,roughness:1});
  const trunkBase={height:4.25,bottom:.22,top:.085,lean:-.20};
  const trunks=new THREE.InstancedMesh(makeEcologyTrunkGeometry(trunkBase),barkMat,TREE_SITES.length);
  trunks.name='LOFT_ECOLOGY_SHARED_TRUNKS';trunks.userData.nonPlayable=true;
  TREE_SITES.forEach((site,i)=>{
    const spec=TREE_ARCHETYPES[site.kind];
    const size=site.s*spec.size;
    dummy.position.set(site.x,terrainHeight(site.x,site.z),site.z);
    dummy.rotation.set(0,site.r,0);
    dummy.scale.set(size,size*(spec.trunk.height/trunkBase.height),size);
    dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  });
  trunks.instanceMatrix.needsUpdate=true;trunks.castShadow=true;trunks.receiveShadow=true;ecology.add(trunks);
  for(const [kind,spec] of Object.entries(TREE_ARCHETYPES)){
    const sites=TREE_SITES.filter(site=>site.kind===kind);
    const crowns=new THREE.InstancedMesh(
      makeLobedEcologyGeometry(spec.lobes,10,7,spec.branches),
      new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1}),
      sites.length
    );
    crowns.name=`LOFT_ECOLOGY_${kind.toUpperCase()}_CROWNS`;crowns.userData.nonPlayable=true;
    sites.forEach((site,i)=>{
      const size=site.s*spec.size;
      dummy.position.set(site.x,terrainHeight(site.x,site.z),site.z);
      dummy.rotation.set(0,site.r,0);dummy.scale.setScalar(size);dummy.updateMatrix();
      crowns.setMatrixAt(i,dummy.matrix);
      const y=terrainHeight(site.x,site.z);
      ecology.userData.sites.push({type:'tree',family:kind,x:site.x,y,z:site.z,surface:courseSurfaceAt(site.x,site.z)});
    });
    crowns.instanceMatrix.needsUpdate=true;crowns.castShadow=true;crowns.receiveShadow=true;ecology.add(crowns);
  }

  // Instance tint stays near neutral because it multiplies the authored
  // vertex color; dark-on-dark made the first live pass read as black blobs.
  const rr=seeded(723901),familyTints={heath:0xe1e8d9,gorse:0xf0e5c1,evergreen:0xd8e4d6};
  for(const community of UNDERSTORY_COMMUNITIES){
    const capacity=community.anchors.length*community.members;
    const mesh=new THREE.InstancedMesh(
      makeLobedEcologyGeometry(understoryLobes(community.family),9,6),
      new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1}),capacity
    );
    mesh.name=`LOFT_ECOLOGY_UNDERSTORY_${community.family.toUpperCase()}`;mesh.userData.nonPlayable=true;
    const tint=new THREE.Color(),baseTint=new THREE.Color(familyTints[community.family]);let count=0;
    community.anchors.forEach(([ax,az],cluster)=>{
      for(let i=0;i<community.members;i++){
        const a=rr()*Math.PI*2,r=Math.sqrt(rr());
        const x=ax+Math.cos(a)*community.rx*r,z=az+Math.sin(a)*community.rz*r;
        if(Math.abs(x)>58||x>coastEdge(z)-4||courseSurfaceAt(x,z)!=='rough')continue;
        const s=.43+rr()*.58;
        const y=terrainHeight(x,z)-.008*s;
        dummy.position.set(x,y,z);
        dummy.rotation.set((rr()-.5)*.05,(rr()-.5)*.72,(rr()-.5)*.05);
        dummy.scale.set((.88+rr()*.28)*s,(.78+rr()*.32)*s,(.86+rr()*.30)*s);
        dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);
        tint.copy(baseTint).multiplyScalar(.90+rr()*.16);mesh.setColorAt(count,tint);
        ecology.userData.sites.push({type:'understory',family:community.family,x,y,z,surface:'rough',cluster});count++;
      }
    });
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=false;mesh.receiveShadow=true;ecology.add(mesh);
  }

  const fescueCapacity=FESCUE_COMMUNITIES.reduce((sum,community)=>sum+community.anchors.length*community.members,0);
  const fescue=new THREE.InstancedMesh(
    makeBladeClumpGeometry(),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),
    fescueCapacity
  );
  fescue.name='LOFT_ECOLOGY_CLUSTERED_FESCUE';fescue.userData.nonPlayable=true;
  const fr=seeded(918273),fescueTones=[0x596f49,0x6a7c50,0x77855a,0x4f6846],fescueTint=new THREE.Color();let fescueCount=0;
  for(const community of FESCUE_COMMUNITIES){
    community.anchors.forEach(([ax,az],cluster)=>{
      for(let i=0;i<community.members;i++){
        const a=fr()*Math.PI*2,r=Math.sqrt(fr());
        const x=ax+Math.cos(a)*community.rx*r,z=az+Math.sin(a)*community.rz*r;
        if(Math.abs(x)>58||x>coastEdge(z)-4||courseSurfaceAt(x,z)!=='rough')continue;
        const edge=Math.abs(x-fairwayProfile(z).center)-fairwayProfile(z).width;
        if(edge>29&&fr()>.34)continue;
        const y=terrainHeight(x,z)+.004,h=.82+fr()*1.34,w=.72+fr()*.54;
        dummy.position.set(x,y,z);
        dummy.rotation.set((fr()-.5)*.05,fr()*Math.PI*2,(fr()-.5)*.05);
        dummy.scale.set(w,h,w*(.90+fr()*.20));dummy.updateMatrix();
        fescue.setMatrixAt(fescueCount,dummy.matrix);
        fescueTint.setHex(fescueTones[Math.floor(fr()*fescueTones.length)]).multiplyScalar(.94+fr()*.10);
        fescue.setColorAt(fescueCount,fescueTint);
        ecology.userData.sites.push({type:'fescue',family:community.zone,x,y,z,surface:'rough',cluster});fescueCount++;
      }
    });
  }
  fescue.count=fescueCount;fescue.instanceMatrix.needsUpdate=true;
  if(fescue.instanceColor)fescue.instanceColor.needsUpdate=true;
  fescue.castShadow=false;fescue.receiveShadow=true;ecology.add(fescue);

  let rockCount=0;
  for(const community of COASTAL_ROCK_COMMUNITIES){
    const rocks=new THREE.InstancedMesh(
      makeRockGeometry(community.seed),
      new THREE.MeshStandardMaterial({color:community.color,roughness:1}),
      community.sites.length
    );
    rocks.name=`LOFT_ECOLOGY_COASTAL_ROCKS_${community.family.toUpperCase()}`;rocks.userData.nonPlayable=true;
    community.sites.forEach((site,i)=>{
      const x=coastEdge(site.z)+site.o,groundY=terrainHeight(x,site.z),y=groundY+site.s[1]*.28;
      dummy.position.set(x,y,site.z);
      dummy.rotation.set(Math.sin(site.z*.17)*.08,site.r,Math.cos(site.z*.11)*.05);
      dummy.scale.set(site.s[0],site.s[1],site.s[2]);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
      ecology.userData.sites.push({type:'rock',family:community.family,x,y,z:site.z,groundY,surface:courseSurfaceAt(x,site.z)});
      rockCount++;
    });
    rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;rocks.receiveShadow=true;ecology.add(rocks);
  }

  ecology.userData.treeCount=TREE_SITES.length;
  ecology.userData.understoryCount=ecology.userData.sites.filter(site=>site.type==='understory').length;
  ecology.userData.fescueCount=fescueCount;
  ecology.userData.rockCount=rockCount;
  ecology.userData.archetypeCount=Object.keys(TREE_ARCHETYPES).length;
  ecology.userData.familyCount=UNDERSTORY_COMMUNITIES.length;
  ecology.userData.fingerprint=ecologyFingerprint(ecology.userData.sites);
  return ecology;
}


export function sampleCoastalSkyColor(x,y){
  const spec=COASTAL_AIR_SPEC.sky;
  const top=new THREE.Color(spec.top),upper=new THREE.Color(spec.upper);
  const horizon=new THREE.Color(spec.horizon),warm=new THREE.Color(spec.warm);
  if(y>=0){
    const upperT=clamp(Math.pow(Math.max(0,y-spec.upperStart),spec.upperPower),0,1);
    const zenithT=smoothstep(spec.zenithStart,spec.zenithEnd,y)*spec.zenithStrength;
    const col=horizon.clone().lerp(upper,upperT).lerp(top,zenithT);
    const keySide=clamp(.68-x*.55,0,1);
    const coastalWarm=Math.exp(-y*spec.warmFalloff)*keySide*spec.warmStrength;
    return col.lerp(warm,coastalWarm);
  }
  const t=clamp(-y*2.2,0,1);
  return horizon.clone().lerp(warm,t*.64);
}

function makeSkyDome(){
  const spec=COASTAL_AIR_SPEC.sky;
  const g=new THREE.SphereGeometry(spec.radius,spec.widthSegments,spec.heightSegments);
  const p=g.attributes.position;
  const colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const col=sampleCoastalSkyColor(p.getX(i)/spec.radius,p.getY(i)/spec.radius);
    colors[i*3]=col.r;colors[i*3+1]=col.g;colors[i*3+2]=col.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false});
  const sky=new THREE.Mesh(g,m);
  sky.name='LOFT_COASTAL_SKY_DOME_V2';sky.renderOrder=-100;
  sky.castShadow=false;sky.receiveShadow=false;
  sky.userData.nonPlayable=true;sky.userData.physics='NONE_VISUAL_ATMOSPHERE';
  sky.userData.vertexCount=p.count;sky.userData.triangles=(g.index?.count??p.count)/3;
  sky.userData.depthWrite=false;
  return sky;
}

const mixByte=(a,b,t)=>Math.round(lerp(a,b,clamp(t,0,1)));

function byteFingerprint(bytes){
  let hash=2166136261;
  for(let i=0;i<bytes.length;i++)hash=Math.imul(hash^bytes[i],16777619)>>>0;
  return hash.toString(16).padStart(8,'0');
}

export function measureCoastalCloudRgba(data,width,height,seed=0){
  const border=COASTAL_AIR_SPEC.clouds.borderPixels;
  let covered=0,alphaSum=0,peakAlpha=0,edgeMaxAlpha=0,transparentRgbMax=0;
  let warmPixels=0,creamPixels=0,coolPixels=0;
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const index=(py*width+px)*4,r=data[index],g=data[index+1],b=data[index+2],alpha=data[index+3];
    const isBorder=px<border||py<border||px>=width-border||py>=height-border;
    if(isBorder)edgeMaxAlpha=Math.max(edgeMaxAlpha,alpha);
    if(alpha===0)transparentRgbMax=Math.max(transparentRgbMax,r,g,b);
    if(alpha<12)continue;
    covered++;alphaSum+=alpha;peakAlpha=Math.max(peakAlpha,alpha);
    if(r-b>=28&&r>180)warmPixels++;
    else if(b-r>=12&&b>100)coolPixels++;
    else creamPixels++;
  }
  return Object.freeze({
    seed,coverage:covered/(width*height),meanAlpha:covered?alphaSum/covered:0,
    peakAlpha,edgeMaxAlpha,transparentRgbMax,warmPixels,creamPixels,coolPixels,
    fingerprint:byteFingerprint(data)
  });
}

/* A pure RGBA blueprint keeps the authored cloud measurable in Node and in the
   browser. It uses no canvas rasterizer, external image or hidden DOM state. */
export function buildCoastalCloudBlueprint(seed=77){
  const spec=COASTAL_AIR_SPEC.clouds,rnd=seeded(seed);
  const width=spec.textureWidth,height=spec.textureHeight;
  const data=new Uint8Array(width*height*4);
  const crownCount=7+Math.floor(rnd()*3),lobes=[];
  for(let i=0;i<crownCount;i++){
    const t=i/(crownCount-1);
    lobes.push({
      x:.17+t*.66+(rnd()-.5)*.050,
      y:.545-Math.sin(t*Math.PI)*(.14+rnd()*.045)+(rnd()-.5)*.032,
      rx:(.098+rnd()*.058)*.72,ry:(.135+rnd()*.082)*.72,gain:.82+rnd()*.17
    });
  }
  // One low, wide foundation unifies the crown without turning the silhouette
  // into a repeated row of pebble-shaped puffs.
  lobes.push({
    x:.50+(rnd()-.5)*.020,y:.610+(rnd()-.5)*.022,
    rx:.34+rnd()*.030,ry:.105+rnd()*.025,gain:.58+rnd()*.08
  });

  const warm=[255,231,200],cream=[244,239,225],cool=[102,134,150];
  for(let py=0;py<height;py++){
    const v=(py+.5)/height;
    for(let px=0;px<width;px++){
      const u=(px+.5)/width,index=(py*width+px)*4;
      let field=0;
      for(const lobe of lobes){
        const dx=(u-lobe.x)/lobe.rx,dy=(v-lobe.y)/lobe.ry,q=dx*dx+dy*dy;
        if(q<1){
          // Soft-union the sculpted lobes into one cloud body. A hard max left
          // visible rows of identical oval puffs at gameplay distance.
          const contribution=Math.pow(1-q,.82)*lobe.gain;
          field=1-(1-field)*(1-contribution*.82);
        }
      }
      const contour=(Math.sin(u*43+seed*.071)+Math.sin(v*37-seed*.053)+Math.sin((u+v)*67+seed*.019))*.009;
      field=clamp(field+contour*field*(1-field),0,1);
      let alpha=Math.round(smoothstep(.105,.67,field)*246);
      const isBorder=px<spec.borderPixels||py<spec.borderPixels||px>=width-spec.borderPixels||py>=height-spec.borderPixels;
      if(isBorder)alpha=0;
      if(alpha<12)alpha=0;

      const warmWeight=(1-smoothstep(.32,.545,v))*(.70+.30*(1-u));
      const coolWeight=smoothstep(.535,.755,v)*(.74+.26*u);
      let r=mixByte(cream[0],warm[0],warmWeight),g=mixByte(cream[1],warm[1],warmWeight),b=mixByte(cream[2],warm[2],warmWeight);
      r=mixByte(r,cool[0],coolWeight);g=mixByte(g,cool[1],coolWeight);b=mixByte(b,cool[2],coolWeight);
      const bodyLift=.90+.10*smoothstep(.24,.88,field);
      if(alpha===0){
        data[index]=0;data[index+1]=0;data[index+2]=0;data[index+3]=0;
      }else{
        data[index]=Math.round(r*bodyLift);data[index+1]=Math.round(g*bodyLift);data[index+2]=Math.round(b*bodyLift);data[index+3]=alpha;
      }

    }
  }
  const measured=measureCoastalCloudRgba(data,width,height,seed);
  const metrics=Object.freeze({...measured,crownLobes:crownCount,totalLobes:lobes.length});
  return {data,width,height,metrics};
}

function makeCloudTexture(seed=77){
  const blueprint=buildCoastalCloudBlueprint(seed);
  const texture=new THREE.DataTexture(blueprint.data,blueprint.width,blueprint.height,THREE.RGBAFormat,THREE.UnsignedByteType);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=true;texture.flipY=true;texture.needsUpdate=true;
  texture.userData={system:COASTAL_AIR_SPEC.system,metrics:blueprint.metrics,orientation:'WARM_CROWN_UP'};
  return texture;
}

export function buildCoastalAir(parent){
  const air=new THREE.Group();air.name=COASTAL_AIR_SPEC.system;
  air.userData.nonPlayable=true;air.userData.physics='NONE_VISUAL_ATMOSPHERE';
  parent?.add(air);
  const sky=makeSkyDome();sky.position.set(0,-46,-110);air.add(sky);
  const cloudMaterial=new THREE.MeshBasicMaterial({
    transparent:true,opacity:COASTAL_AIR_SPEC.clouds.opacity,depthWrite:false,
    side:THREE.DoubleSide,fog:false
  });
  cloudMaterial.forceSinglePass=true;
  const clouds=[];
  COASTAL_AIR_SPEC.clouds.banks.forEach((bank,i)=>{
    const [x,y,z]=bank.position,[w,h]=bank.size,r=bank.rotation;
    const material=cloudMaterial.clone();material.map=makeCloudTexture(bank.seed);
    material.forceSinglePass=true;
    const cloud=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
    cloud.name=`LOFT_COASTAL_CLOUD_SHEET_${i+1}`;
    cloud.position.set(x,y,z);cloud.rotation.y=r;cloud.renderOrder=-20;
    cloud.castShadow=false;cloud.receiveShadow=false;
    cloud.userData.nonPlayable=true;cloud.userData.physics='NONE_VISUAL_ATMOSPHERE';
    cloud.userData.baseX=x;cloud.userData.baseY=y;cloud.userData.phase=r*70+z*.01;
    cloud.userData.seed=bank.seed;cloud.userData.metrics=material.map.userData.metrics;
    cloud.userData.angularWidth=2*Math.atan(w/(2*Math.hypot(x,z)));
    cloud.userData.effectivePeakAlpha=cloud.userData.metrics.peakAlpha/255*material.opacity;
    cloud.userData.orientation=material.map.userData.orientation;
    cloud.userData.renderPasses=1;cloud.userData.depthWrite=material.depthWrite;
    air.add(cloud);clouds.push(cloud);
  });
  cloudMaterial.dispose();
  air.userData.cloudCount=clouds.length;
  air.userData.cloudRenderPasses=clouds.reduce((sum,cloud)=>sum+cloud.userData.renderPasses,0);
  air.userData.drawCalls=1+clouds.length;
  air.userData.triangles=sky.userData.triangles+clouds.reduce((sum,cloud)=>sum+(cloud.geometry.index?.count??cloud.geometry.attributes.position.count)/3,0);
  air.userData.textureBytes=clouds.reduce((sum,cloud)=>sum+(cloud.material.map.image.data?.byteLength??0),0);
  air.userData.fingerprint=clouds.map(cloud=>cloud.userData.metrics.fingerprint).join(':');
  return air;
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

function mergePlacedGeometry(parts){
  const positions=[],indices=[];let offset=0;
  for(const part of parts){
    const geometry=part.geometry;
    const position=new THREE.Vector3(...(part.position??[0,0,0]));
    const rotation=new THREE.Euler(...(part.rotation??[0,0,0]));
    const scale=new THREE.Vector3(...(part.scale??[1,1,1]));
    geometry.applyMatrix4(new THREE.Matrix4().compose(position,new THREE.Quaternion().setFromEuler(rotation),scale));
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++)positions.push(p.getX(i),p.getY(i),p.getZ(i));
    if(geometry.index){
      for(let i=0;i<geometry.index.count;i++)indices.push(geometry.index.getX(i)+offset);
    }else{
      for(let i=0;i<p.count;i++)indices.push(i+offset);
    }
    offset+=p.count;geometry.dispose();
  }
  const merged=new THREE.BufferGeometry();
  merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  merged.setIndex(indices);merged.computeVertexNormals();merged.computeBoundingBox();merged.computeBoundingSphere();
  return merged;
}

function buildRidgeHouse(world){
  const house=new THREE.Group();house.name=RIDGE_HOUSE_SPEC.system;
  house.userData.nonPlayable=true;house.userData.physics='NONE_VISUAL_DESTINATION';
  house.userData.drawCallBudget=RIDGE_HOUSE_SPEC.drawCallBudget;
  house.userData.triangleBudget=RIDGE_HOUSE_SPEC.triangleBudget;
  house.userData.footprint=RIDGE_HOUSE_SPEC.footprint;
  const {x,z,rotation}=RIDGE_HOUSE_SPEC.position;
  const groundY=terrainHeight(x,z);
  house.position.set(x,groundY-.42,z);house.rotation.y=rotation;house.userData.groundY=groundY;
  world.add(house);

  const add=(mesh,name,{cast=true,receive=true}={})=>{
    mesh.name=name;mesh.userData.nonPlayable=true;mesh.castShadow=cast;mesh.receiveShadow=receive;house.add(mesh);return mesh;
  };
  const stoneMat=new THREE.MeshStandardMaterial({color:0x776c5b,roughness:.98});
  const plasterMat=new THREE.MeshStandardMaterial({color:0xd9d0bf,roughness:.94});
  const roofMat=new THREE.MeshStandardMaterial({color:0x202628,roughness:.86});
  const timberMat=new THREE.MeshStandardMaterial({color:0x443a31,roughness:.95});
  const glassMat=new THREE.MeshStandardMaterial({color:0x31454a,roughness:.28,metalness:.04,emissive:0x172225,emissiveIntensity:.16});

  add(new THREE.Mesh(mergePlacedGeometry([
    {geometry:new THREE.BoxGeometry(15.8,1.8,7.8),position:[0,.72,0]},
    {geometry:new THREE.BoxGeometry(5.2,.74,2.5),position:[5.5,.23,4.65]},
    {geometry:new THREE.BoxGeometry(.92,3.55,.92),position:[4.45,5.16,-.90]}
  ]),stoneMat),'LOFT_RIDGE_HOUSE_STONE');

  add(new THREE.Mesh(mergePlacedGeometry([
    {geometry:new THREE.BoxGeometry(12.5,2.65,6.2),position:[1.15,2.84,0]},
    {geometry:new THREE.BoxGeometry(5.3,3.80,6.45),position:[-4.65,3.42,-.08]},
    {geometry:new THREE.BoxGeometry(3.45,2.18,5.45),position:[6.20,2.61,.18]}
  ]),plasterMat),'LOFT_RIDGE_HOUSE_WARM_STRUCTURE');

  add(new THREE.Mesh(mergePlacedGeometry([
    {geometry:makeGableRoofGeometry(13.75,7.10,1.52),position:[1.15,4.18,0]},
    {geometry:makeGableRoofGeometry(6.15,7.35,1.66),position:[-4.65,5.32,-.08]},
    {geometry:new THREE.BoxGeometry(16.4,.16,2.34),position:[0,4.08,4.46]}
  ]),roofMat),'LOFT_RIDGE_HOUSE_NESTED_ROOFS');

  add(new THREE.Mesh(mergePlacedGeometry([
    {geometry:new THREE.BoxGeometry(16.9,.20,2.45),position:[0,1.55,4.58]},
    {geometry:new THREE.BoxGeometry(2.45,.20,6.45),position:[7.28,1.55,2.30]},
    {geometry:new THREE.BoxGeometry(3.0,.18,.62),position:[5.65,1.35,6.05]},
    {geometry:new THREE.BoxGeometry(2.55,.16,.58),position:[5.65,1.17,6.55]}
  ]),timberMat),'LOFT_RIDGE_HOUSE_WRAP_TERRACE');

  const beamSites=[];
  for(const px of [-7.1,-4.75,-2.35,0,2.35,4.75,7.1])beamSites.push({p:[px,2.80,5.34],s:[.13,2.52,.13]});
  beamSites.push(
    {p:[-4.75,2.22,5.43],s:[4.45,.10,.10]},{p:[4.70,2.22,5.43],s:[4.55,.10,.10]},
    {p:[-4.75,2.72,5.43],s:[4.45,.08,.08]},{p:[4.70,2.72,5.43],s:[4.55,.08,.08]},
    {p:[-7.22,3.45,3.18],s:[.11,3.15,.11]},{p:[-2.08,3.45,3.18],s:[.11,3.15,.11]},
    {p:[1.15,4.08,3.16],s:[12.9,.13,.13]},{p:[-4.65,5.23,3.26],s:[5.65,.13,.13]}
  );
  for(const px of [-6.25,-5.35,-3.95,-3.05,2.80,3.70,5.15,6.05])beamSites.push({p:[px,2.44,5.42],s:[.055,.50,.055]});
  const beams=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),timberMat,beamSites.length);
  const dummy=new THREE.Object3D();
  beamSites.forEach((site,i)=>{dummy.position.set(...site.p);dummy.rotation.set(0,0,0);dummy.scale.set(...site.s);dummy.updateMatrix();beams.setMatrixAt(i,dummy.matrix);});
  beams.count=beamSites.length;beams.instanceMatrix.needsUpdate=true;
  add(beams,'LOFT_RIDGE_HOUSE_TIMBER_FRAME');

  const windowSites=[
    {p:[-5.55,3.30,3.18],s:[1.00,1.30,.07]},{p:[-3.78,3.30,3.18],s:[1.00,1.30,.07]},
    {p:[-5.55,4.72,3.18],s:[.88,.72,.07]},{p:[-3.78,4.72,3.18],s:[.88,.72,.07]},
    {p:[-.35,2.78,3.13],s:[1.18,2.05,.07]},{p:[1.55,2.96,3.13],s:[1.02,1.32,.07]},
    {p:[3.50,2.96,3.13],s:[1.02,1.32,.07]},{p:[5.43,2.96,3.13],s:[1.02,1.32,.07]},
    {p:[7.94,2.78,-1.70],s:[.07,1.08,1.00]},{p:[7.94,2.78,0],s:[.07,1.08,1.00]},
    {p:[7.94,2.78,1.70],s:[.07,1.08,1.00]}
  ];
  const windows=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),glassMat,windowSites.length);
  windowSites.forEach((site,i)=>{dummy.position.set(...site.p);dummy.rotation.set(0,0,0);dummy.scale.set(...site.s);dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);});
  windows.count=windowSites.length;windows.instanceMatrix.needsUpdate=true;
  add(windows,'LOFT_RIDGE_HOUSE_WINDOWS',{cast:false,receive:true});

  const signalMat=new THREE.MeshStandardMaterial({color:COLORS.orange,roughness:.70,emissive:0x5a1603,emissiveIntensity:.16});
  const entrySignal=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),signalMat);
  entrySignal.position.set(-.35,3.94,3.22);add(entrySignal,'LOFT_RIDGE_HOUSE_ENTRY_SIGNAL',{cast:false,receive:false});

  house.userData.beamCount=beamSites.length;
  house.userData.windowCount=windowSites.length;
  house.userData.foundationBottom=-.18;
  house.userData.foundationTop=1.62;
  return house;
}

function buildLighthouseHeadland(world){
  const headland=new THREE.Group();
  headland.name='LOFT_LIGHTHOUSE_HEADLAND_BACKDROP_V1';
  headland.userData.nonPlayable=true;
  headland.userData.physics='NONE_VISUAL_BACKDROP';
  headland.userData.frontLimit=TERRAIN_GRID.zMin-2;
  headland.userData.drawCallBudget=10;
  headland.userData.triangleBudget=20000;
  world.add(headland);

  const headlandMat=new THREE.MeshStandardMaterial({
    color:0xffffff,vertexColors:true,roughness:.97,metalness:0,dithering:true
  });
  const massGeometries=[
    makeHeadlandMassGeometry(4.2),
    makeHeadlandMassGeometry(7.8),
    makeHeadlandMassGeometry(12.4)
  ];
  const shoulderBase=WATER_LEVEL-.34,shoulderHeight=12.2;
  const eastBase=WATER_LEVEL-.35,eastHeight=17.4;
  const rearBase=WATER_LEVEL-.38,rearHeight=20.2;
  const masses=[
    // A low west shoulder keeps a clean notch around the lantern while the
    // taller east bluff gives the lighthouse a believable coastal footing.
    {role:'west-shoulder',g:1,p:[53,shoulderBase,-313],s:[31,shoulderHeight,17],r:.035},
    {role:'east-bluff',g:0,p:[78,eastBase,-319],s:[33,eastHeight,21],r:-.045},
    {role:'rear-crown',g:2,p:[96,rearBase,-337],s:[27,rearHeight,21],r:.025},
    {role:'west-shelf',g:0,p:[12,WATER_LEVEL-.37,-313],s:[15,7.2,14],r:-.07},
    {role:'east-shelf',g:1,p:[116,WATER_LEVEL-.39,-315],s:[16,9.4,14],r:.08},
    {role:'west-sea-stack',g:2,p:[24,WATER_LEVEL-.43,-307],s:[3.2,6.4,4.8],r:.18},
    {role:'east-sea-stack',g:2,p:[119,WATER_LEVEL-.45,-307],s:[4.2,8.2,5.8],r:-.14}
  ];
  const frontLimit=headland.userData.frontLimit;
  masses.forEach((cfg,i)=>{
    const mesh=new THREE.Mesh(massGeometries[cfg.g],headlandMat);
    mesh.name=`LOFT_HEADLAND_MASS_${i+1}_${cfg.role.toUpperCase()}`;
    mesh.position.set(...cfg.p);mesh.scale.set(...cfg.s);mesh.rotation.y=cfg.r;
    mesh.castShadow=false;mesh.receiveShadow=false;
    mesh.userData.nonPlayable=true;mesh.userData.role=cfg.role;
    headland.add(mesh);
    mesh.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(mesh);
    if(bounds.max.z>=frontLimit){
      mesh.position.z-=bounds.max.z-frontLimit+.25;
      mesh.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(mesh);
    }
    mesh.userData.nearestZ=bounds.max.z;
  });

  // Three wind-pruned silhouettes are built as two instanced draw calls. They
  // are deliberately sparse: the geology and lighthouse remain the heroes.
  const treeSites=[
    {x:57,y:shoulderBase+shoulderHeight*.935,z:-315,s:.76,lean:-.10},
    {x:69,y:eastBase+eastHeight*.935,z:-319,s:1.04,lean:-.12},
    {x:88,y:eastBase+eastHeight*.935,z:-322,s:.88,lean:-.09}
  ];
  const farTrunkGeo=new THREE.CylinderGeometry(.10,.19,3.5,8);
  const farBarkMat=new THREE.MeshStandardMaterial({color:0x42392f,roughness:1});
  const farLeafMat=new THREE.MeshStandardMaterial({color:0x324a35,roughness:1});
  const farTrunks=new THREE.InstancedMesh(farTrunkGeo,farBarkMat,treeSites.length);
  farTrunks.name='LOFT_HEADLAND_WIND_PRUNED_TRUNKS';farTrunks.userData.nonPlayable=true;
  const farCrowns=new THREE.InstancedMesh(pineLobeGeo,farLeafMat,treeSites.length*4);
  farCrowns.name='LOFT_HEADLAND_WIND_PRUNED_CROWNS';farCrowns.userData.nonPlayable=true;
  const dummy=new THREE.Object3D();let crownIndex=0;
  treeSites.forEach((site,i)=>{
    dummy.position.set(site.x+site.lean*site.s*1.2,site.y+1.75*site.s,site.z);
    dummy.rotation.set(0,.10+i*.62,site.lean);dummy.scale.setScalar(site.s);
    dummy.updateMatrix();farTrunks.setMatrixAt(i,dummy.matrix);
    [
      {y:2.62,x:-.38,sc:[1.08,.26,.74]},
      {y:3.02,x:.18,sc:[1.38,.32,.90]},
      {y:3.38,x:.55,sc:[1.10,.34,.76]},
      {y:3.72,x:.32,sc:[.68,.35,.55]}
    ].forEach((l,j)=>{
      dummy.position.set(site.x+(l.x+site.lean*2.0)*site.s,site.y+l.y*site.s,site.z+(j%2?-.08:.06)*site.s);
      dummy.rotation.set(0,.42*j+i*.31,site.lean*.18);
      dummy.scale.set(l.sc[0]*site.s,l.sc[1]*site.s,l.sc[2]*site.s);
      dummy.updateMatrix();farCrowns.setMatrixAt(crownIndex++,dummy.matrix);
    });
  });
  farTrunks.instanceMatrix.needsUpdate=true;farCrowns.instanceMatrix.needsUpdate=true;
  headland.add(farTrunks,farCrowns);

  const heathSites=[
    [47,shoulderBase+shoulderHeight*.925,-312,.70],[62,shoulderBase+shoulderHeight*.925,-316,.82],
    [65,eastBase+eastHeight*.925,-314,.72],[75,eastBase+eastHeight*.925,-322,.86],
    [84,eastBase+eastHeight*.925,-314,.68],[94,eastBase+eastHeight*.925,-321,.79],
    [88,rearBase+rearHeight*.925,-337,.67],[104,rearBase+rearHeight*.925,-334,.77],
    [8,WATER_LEVEL-.37+7.2*.925,-313,.55],[113,WATER_LEVEL-.39+9.4*.925,-316,.62]
  ];
  const heathMat=new THREE.MeshStandardMaterial({color:0x3b503b,roughness:1});
  const heath=new THREE.InstancedMesh(shrubClusterGeo,heathMat,heathSites.length);
  heath.name='LOFT_HEADLAND_COASTAL_HEATH';heath.userData.nonPlayable=true;
  heathSites.forEach((p,i)=>{
    dummy.position.set(p[0],p[1],p[2]);dummy.rotation.set(0,i*.71,0);
    dummy.scale.set(p[3]*1.35,p[3]*.72,p[3]);dummy.updateMatrix();heath.setMatrixAt(i,dummy.matrix);
  });
  heath.instanceMatrix.needsUpdate=true;headland.add(heath);
  headland.userData.massCount=masses.length;
  headland.userData.drawCalls=masses.length+3;
  return headland;
}

export function validateLighthouseHeadland(){
  const scratch=new THREE.Group();
  const headland=buildLighthouseHeadland(scratch);
  const masses=headland.children.filter(child=>child.name.startsWith('LOFT_HEADLAND_MASS_'));
  let drawCalls=0,triangles=0,allNonPlayable=headland.userData.nonPlayable===true;
  headland.traverse(object=>{
    if(object!==headland&&object.userData.nonPlayable!==true)allNonPlayable=false;
    if(!object.isMesh)return;
    drawCalls++;
    const instances=object.isInstancedMesh?object.count:1;
    const primitiveCount=object.geometry.index?.count??object.geometry.attributes.position.count;
    triangles+=primitiveCount/3*instances;
  });
  const nearestZ=Math.max(...masses.map(mass=>mass.userData.nearestZ));
  const frontLimit=headland.userData.frontLimit;
  return {
    ok:masses.length===7&&nearestZ<frontLimit&&allNonPlayable&&
      drawCalls<=headland.userData.drawCallBudget&&triangles<=headland.userData.triangleBudget,
    system:headland.name,
    nonPlayable:allNonPlayable,
    massCount:masses.length,
    nearestZ,frontLimit,drawCalls,triangles,
    drawCallBudget:headland.userData.drawCallBudget,
    triangleBudget:headland.userData.triangleBudget
  };
}

export function validateCoastalAir(runtimeAir=null){
  const spec=COASTAL_AIR_SPEC,cloudSpec=spec.clouds;
  const air=runtimeAir??buildCoastalAir(new THREE.Group());
  const meshes=[];air.traverse(object=>{if(object.isMesh)meshes.push(object);});
  const sky=meshes.find(mesh=>mesh.name==='LOFT_COASTAL_SKY_DOME_V2');
  const cloudMeshes=meshes.filter(mesh=>mesh.name.startsWith('LOFT_COASTAL_CLOUD_SHEET_'))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const maps=cloudMeshes.map(cloud=>cloud.material.map);
  const cloudMetrics=maps.map((map,i)=>measureCoastalCloudRgba(
    map.image.data,map.image.width,map.image.height,cloudSpec.banks[i].seed
  ));
  const textureBytes=maps.reduce((sum,map)=>sum+(map.image.data?.byteLength??0),0);
  const fingerprints=new Set(cloudMetrics.map(metrics=>metrics.fingerprint));
  const expectedFingerprints=cloudSpec.banks.map(bank=>buildCoastalCloudBlueprint(bank.seed).metrics.fingerprint);
  const effectivePeaks=cloudMetrics.map((metrics,i)=>metrics.peakAlpha/255*cloudMeshes[i].material.opacity);
  const angularWidths=cloudMeshes.map(cloud=>{
    const width=cloud.geometry.parameters.width;
    return 2*Math.atan(width/(2*Math.hypot(cloud.position.x,cloud.position.z)));
  });
  const low=sampleCoastalSkyColor(0,spec.sky.visibleRows.low);
  const high=sampleCoastalSkyColor(0,spec.sky.visibleRows.high);
  const rgbDistance=Math.hypot(high.r-low.r,high.g-low.g,high.b-low.b);
  const luma=color=>color.r*.2126+color.g*.7152+color.b*.0722;
  const lumaDistance=Math.abs(luma(high)-luma(low));
  const triangleCount=mesh=>((mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3)*(mesh.isInstancedMesh?mesh.count:1);
  const cloudRenderPasses=cloudMeshes.reduce((sum,cloud)=>sum+(
    cloud.material.transparent&&cloud.material.side===THREE.DoubleSide&&!cloud.material.forceSinglePass?2:1
  ),0);
  const atmosphere={
    drawCalls:meshes.length,cloudRenderPasses,
    triangles:meshes.reduce((sum,mesh)=>sum+triangleCount(mesh),0),
    uniqueCloudMaps:new Set(maps).size,
    drawCallBudget:spec.atmosphere.drawCallBudget,
    triangleBudget:spec.atmosphere.triangleBudget
  };
  const allNonPlayable=air.userData.nonPlayable===true&&meshes.every(mesh=>mesh.userData.nonPlayable===true);
  const noShadows=meshes.every(mesh=>mesh.castShadow===false&&mesh.receiveShadow===false);
  const depthWriteSafe=meshes.every(mesh=>mesh.material.depthWrite===false);
  const textureContract=maps.length===cloudSpec.sheets&&maps.every(map=>
    map?.isDataTexture&&map.image.data instanceof Uint8Array&&map.flipY===true&&
    map.colorSpace===THREE.SRGBColorSpace&&map.minFilter===THREE.LinearFilter&&map.magFilter===THREE.LinearFilter
  );
  const passContract=cloudMeshes.every(cloud=>cloud.material.side===THREE.DoubleSide&&cloud.material.forceSinglePass===true);
  const transformContract=cloudMeshes.every((cloud,i)=>{
    const bank=cloudSpec.banks[i],[x,y,z]=bank.position,[width,height]=bank.size;
    return Math.abs(cloud.position.x-x)<1e-9&&Math.abs(cloud.position.y-y)<1e-9&&Math.abs(cloud.position.z-z)<1e-9&&
      Math.abs(cloud.rotation.y-bank.rotation)<1e-9&&cloud.geometry.parameters.width===width&&cloud.geometry.parameters.height===height;
  });
  const runtimeMetadataMatches=air.userData.drawCalls===atmosphere.drawCalls&&
    air.userData.cloudRenderPasses===cloudRenderPasses&&air.userData.triangles===atmosphere.triangles&&
    air.userData.textureBytes===textureBytes;
  const metricsOk=cloudMetrics.every(metrics=>
    metrics.coverage>=cloudSpec.coverage.min&&metrics.coverage<=cloudSpec.coverage.max&&
    metrics.edgeMaxAlpha===0&&metrics.transparentRgbMax===0&&metrics.peakAlpha>0&&
    metrics.warmPixels>0&&metrics.creamPixels>0&&metrics.coolPixels>0
  );
  const peakOk=effectivePeaks.every(peak=>peak>=cloudSpec.effectivePeak.min&&peak<=cloudSpec.effectivePeak.max);
  const angleOk=angularWidths.every(angle=>angle>=.28&&angle<=.58);
  const skyOk=rgbDistance>=spec.sky.visibleRows.minRgbDistance&&lumaDistance>=spec.sky.visibleRows.minLumaDistance;
  return {
    ok:spec.system==='LOFT_COASTAL_AIR_V2'&&
      spec.fog.near===235&&spec.fog.far===530&&spec.fog.far>spec.fog.near&&
      cloudSpec.sheets===4&&cloudMeshes.length===4&&cloudSpec.drawCalls<=4&&cloudSpec.textureCount===4&&
      textureBytes<=cloudSpec.rawByteBudget&&fingerprints.size===cloudSpec.sheets&&
      cloudMetrics.every((metrics,i)=>metrics.fingerprint===expectedFingerprints[i])&&
      metricsOk&&peakOk&&angleOk&&skyOk&&allNonPlayable&&noShadows&&depthWriteSafe&&
      textureContract&&passContract&&transformContract&&runtimeMetadataMatches&&sky&&
      atmosphere.drawCalls<=atmosphere.drawCallBudget&&atmosphere.cloudRenderPasses<=4&&
      atmosphere.uniqueCloudMaps===cloudSpec.textureCount&&atmosphere.triangles<=atmosphere.triangleBudget,
    ...spec,textureBytes,cloudMetrics,effectivePeaks,angularWidths,
    skyVisibleRows:{rgbDistance,lumaDistance,low:low.getHex(),high:high.getHex()},
    atmosphere,allNonPlayable,noShadows,depthWriteSafe,textureContract,passContract,
    transformContract,runtimeMetadataMatches
  };
}

export function validateCoastalEcology(){
  const scratch=new THREE.Group(),ecology=buildCoastalEcology(scratch);
  let drawCalls=0,treeDrawCalls=0,shadowDrawCalls=0,triangles=0,allNonPlayable=ecology.userData.nonPlayable===true;
  ecology.traverse(object=>{
    if(object!==ecology&&object.userData.nonPlayable!==true)allNonPlayable=false;
    if(!object.isMesh)return;
    drawCalls++;if(object.castShadow)shadowDrawCalls++;
    if(object.name.includes('_TRUNKS')||object.name.includes('_CROWNS'))treeDrawCalls++;
    const instances=object.isInstancedMesh?object.count:1;
    const primitiveCount=object.geometry.index?.count??object.geometry.attributes.position.count;
    triangles+=primitiveCount/3*instances;
  });
  const invalidSites=ecology.userData.sites.filter(site=>{
    if(site.type==='rock')return site.x<coastEdge(site.z)-.5||Math.abs(site.x)>70||COASTAL_ECOLOGY_SPEC.protectedSurfaces.includes(site.surface);
    return site.surface!=='rough'||site.x>coastEdge(site.z)-4||Math.abs(site.x)>58;
  });
  let maxGroundError=0;
  ecology.userData.sites.forEach(site=>{
    const anchor=site.type==='rock'?site.groundY:site.y;
    maxGroundError=Math.max(maxGroundError,Math.abs(anchor-terrainHeight(site.x,site.z)));
  });
  const treeFamilies=new Set(ecology.userData.sites.filter(site=>site.type==='tree').map(site=>site.family));
  const understoryFamilies=new Set(ecology.userData.sites.filter(site=>site.type==='understory').map(site=>site.family));
  const repeat=buildCoastalEcology(new THREE.Group());
  const deterministic=ecology.userData.fingerprint===repeat.userData.fingerprint;
  return {
    ok:ecology.name===COASTAL_ECOLOGY_SPEC.system&&allNonPlayable&&invalidSites.length===0&&
      treeFamilies.size===COASTAL_ECOLOGY_SPEC.treeArchetypes&&
      understoryFamilies.size===COASTAL_ECOLOGY_SPEC.understoryFamilies&&
      treeDrawCalls<=COASTAL_ECOLOGY_SPEC.treeDrawCallBudget&&
      drawCalls<=COASTAL_ECOLOGY_SPEC.totalDrawCallBudget&&
      shadowDrawCalls<=COASTAL_ECOLOGY_SPEC.shadowDrawCallBudget&&
      triangles<=COASTAL_ECOLOGY_SPEC.triangleBudget&&maxGroundError<=.01&&deterministic&&
      ecology.userData.fescueCount>=700&&ecology.userData.rockCount>=20,
    system:ecology.name,nonPlayable:allNonPlayable,
    treeCount:ecology.userData.treeCount,understoryCount:ecology.userData.understoryCount,
    fescueCount:ecology.userData.fescueCount,rockCount:ecology.userData.rockCount,
    treeArchetypes:treeFamilies.size,understoryFamilies:understoryFamilies.size,
    invalidSites:invalidSites.length,maxGroundError,deterministic,fingerprint:ecology.userData.fingerprint,
    treeDrawCalls,shadowDrawCalls,drawCalls,triangles,
    drawCallBudget:COASTAL_ECOLOGY_SPEC.totalDrawCallBudget,
    shadowDrawCallBudget:COASTAL_ECOLOGY_SPEC.shadowDrawCallBudget,
    triangleBudget:COASTAL_ECOLOGY_SPEC.triangleBudget
  };
}

export function validateRidgeHouse(){
  const scratch=new THREE.Group(),house=buildRidgeHouse(scratch);
  let drawCalls=0,shadowDrawCalls=0,triangles=0,allNonPlayable=house.userData.nonPlayable===true,signalCount=0;
  house.traverse(object=>{
    if(object!==house&&object.userData.nonPlayable!==true)allNonPlayable=false;
    if(!object.isMesh)return;
    drawCalls++;if(object.castShadow)shadowDrawCalls++;
    if(object.name==='LOFT_RIDGE_HOUSE_ENTRY_SIGNAL')signalCount++;
    const instances=object.isInstancedMesh?object.count:1;
    const primitiveCount=object.geometry.index?.count??object.geometry.attributes.position.count;
    triangles+=primitiveCount/3*instances;
  });
  const {x,z,rotation}=RIDGE_HOUSE_SPEC.position,{width,depth}=RIDGE_HOUSE_SPEC.footprint;
  const c=Math.cos(rotation),s=Math.sin(rotation),sites=[];
  for(let lx=-width*.5;lx<=width*.5+.01;lx+=width*.25){
    for(let lz=-depth*.5;lz<=depth*.5+.01;lz+=depth*.25){
      const px=x+lx*c+lz*s,pz=z-lx*s+lz*c;
      sites.push({x:px,z:pz,y:terrainHeight(px,pz),surface:courseSurfaceAt(px,pz),route:fairwaySignedDistance(px,pz)});
    }
  }
  const minGround=Math.min(...sites.map(site=>site.y)),maxGround=Math.max(...sites.map(site=>site.y));
  const foundationBottom=house.position.y+house.userData.foundationBottom;
  const foundationTop=house.position.y+house.userData.foundationTop;
  const minRouteClearance=Math.min(...sites.map(site=>site.route));
  const allRough=sites.every(site=>site.surface==='rough');
  const grounded=Math.abs(house.userData.groundY-terrainHeight(x,z))<=1e-7&&
    foundationBottom<=minGround&&foundationTop>=maxGround;
  return {
    ok:house.name===RIDGE_HOUSE_SPEC.system&&allNonPlayable&&allRough&&grounded&&
      minRouteClearance>FIRST_CUT_WIDTH&&signalCount===1&&house.userData.windowCount>=10&&house.userData.beamCount>=20&&
      drawCalls<=RIDGE_HOUSE_SPEC.drawCallBudget&&shadowDrawCalls<=RIDGE_HOUSE_SPEC.shadowDrawCallBudget&&
      triangles<=RIDGE_HOUSE_SPEC.triangleBudget,
    system:house.name,nonPlayable:allNonPlayable,allRough,grounded,signalCount,
    drawCalls,shadowDrawCalls,triangles,minRouteClearance,
    groundRange:maxGround-minGround,foundationBottom,foundationTop,
    windowCount:house.userData.windowCount,beamCount:house.userData.beamCount,
    drawCallBudget:RIDGE_HOUSE_SPEC.drawCallBudget,
    shadowDrawCallBudget:RIDGE_HOUSE_SPEC.shadowDrawCallBudget,
    triangleBudget:RIDGE_HOUSE_SPEC.triangleBudget
  };
}

export function validateCoastalTurfLight(){
  const spec=COASTAL_TURF_LIGHT_SPEC;
  const terrain=validateTerrain();
  const groups={rough:[],firstCut:[],fairway:[],fringe:[],green:[],tee:[],sand:[]};
  const roughness={rough:[],firstCut:[],fairway:[],fringe:[],green:[],tee:[],sand:[]};
  const probe=.35;
  // Judge surface interiors only. Transitional pixels remain intentionally
  // blended and should not weaken the contract for the authored cuts.
  for(let z=28;z>=-276;z-=1.6)for(let x=-70;x<=70;x+=1.6){
    const surface=courseSurfaceAt(x,z);
    if(!groups[surface])continue;
    if(courseSurfaceAt(x-probe,z)!==surface||courseSurfaceAt(x+probe,z)!==surface||
      courseSurfaceAt(x,z-probe)!==surface||courseSurfaceAt(x,z+probe)!==surface)continue;
    const sample=courseVisualSample(x,z);
    groups[surface].push(sample.luma);roughness[surface].push(sample.roughness);
  }
  const percentile=(values,p)=>{
    if(!values.length)return NaN;
    const sorted=values.slice().sort((a,b)=>a-b);
    return sorted[Math.floor((sorted.length-1)*p)];
  };
  const stats={};
  for(const surface of Object.keys(groups)){
    stats[surface]={
      count:groups[surface].length,
      p10:percentile(groups[surface],.10),
      p50:percentile(groups[surface],.50),
      p90:percentile(groups[surface],.90),
      roughness:percentile(roughness[surface],.50)
    };
  }
  const t=spec.textures;
  const rawTextureBytes=(t.albedo.width*t.albedo.height+t.roughness.width*t.roughness.height+
    t.bump.width*t.bump.height)*4;
  const tileX=(TERRAIN_GRID.xMax-TERRAIN_GRID.xMin)/t.bump.repeat[0];
  const tileZ=(TERRAIN_GRID.zMax-TERRAIN_GRID.zMin)/t.bump.repeat[1];
  const vectorLength=Math.hypot(TURF_KEY_VECTOR.x,TURF_KEY_VECTOR.y,TURF_KEY_VECTOR.z);
  const light=spec.lighting;
  const keyToAmbient=light.key.intensity/(light.hemisphere.intensity+light.fill.intensity+light.bounce.intensity);
  const roughnessOrdered=stats.green.roughness<stats.fairway.roughness&&
    stats.fairway.roughness<stats.firstCut.roughness&&stats.firstCut.roughness<stats.rough.roughness&&
    stats.rough.roughness<=stats.sand.roughness;
  const lumaOrdered=stats.firstCut.p50-stats.rough.p50>=.055&&
    stats.fairway.p50-stats.firstCut.p50>=.045&&stats.green.p50-stats.fairway.p50>=.035&&
    stats.sand.p50-stats.green.p50>=.075;
  const restrainedVariation=Object.values(stats).every(s=>s.count>2&&s.p90-s.p10>=.006&&s.p90-s.p10<=.13);
  const materialBudget={terrainDrawCalls:1,terrainMaterials:1,terrainTextures:t.count};
  return {
    ok:spec.system==='LOFT_COASTAL_TURF_LIGHT_V2'&&terrain.ok&&
      terrain.system===spec.contactSystem&&terrain.renderPhysicsContract===spec.renderPhysicsContract&&
      t.count===3&&rawTextureBytes<=t.maxRawBytes&&tileX>=4&&tileX<=8&&tileZ>=4&&tileZ<=8&&
      Math.abs(tileX-tileZ)/Math.max(tileX,tileZ)<=.10&&Math.abs(vectorLength-1)<1e-9&&
      spec.relief.min>=.90&&spec.relief.max<=1.12&&spec.relief.min<1&&spec.relief.max>1&&
      keyToAmbient>=2.8&&roughnessOrdered&&lumaOrdered&&restrainedVariation&&
      Object.values(stats).every(s=>s.roughness>=.68&&s.roughness<=1)&&
      materialBudget.terrainDrawCalls===1&&materialBudget.terrainMaterials===1&&materialBudget.terrainTextures<=3,
    system:spec.system,contactSystem:terrain.system,renderPhysicsContract:terrain.renderPhysicsContract,
    keyVector:{...TURF_KEY_VECTOR},vectorLength,keyToAmbient,rawTextureBytes,tileX,tileZ,
    roughnessOrdered,lumaOrdered,restrainedVariation,stats,materialBudget,
    relief:{...spec.relief},lighting:spec.lighting,textures:spec.textures
  };
}

export function validateTerrain(){
  let min=Infinity,max=-Infinity,maxGrade=0,minNormalY=1,samples=0;
  for(let z=28;z>=-276;z-=6){
    for(let x=-70;x<=70;x+=6){
      const h=terrainHeight(x,z);
      if(!Number.isFinite(h))return {ok:false,reason:'NON_FINITE_HEIGHT',x,z};
      min=Math.min(min,h);max=Math.max(max,h);samples++;
      const frame=sampleTerrain(x,z);
      const grade=frame.grade;
      if(!Number.isFinite(grade))return {ok:false,reason:'NON_FINITE_GRADE',x,z};
      maxGrade=Math.max(maxGrade,grade);
      minNormalY=Math.min(minNormalY,frame.normal.y);
    }
  }
  return {
    ok:true,min,max,maxGrade,minNormalY,samples,
    system:'LOFT_FIELD_V4_CONTACT',
    grid:{...TERRAIN_GRID,dx:GRID_DX,dz:GRID_DZ},
    renderPhysicsContract:'TRIANGLE_HEIGHT_SHARED_NORMAL'
  };
}

export function buildWorld(scene,pin){
  const world=new THREE.Group();world.name='LOFT_COASTAL_RIDGE_TERRAIN_V1';scene.add(world);
  const rnd=seeded(204514);

  // --- ATMOSPHERIC WORLD SHELL --------------------------------------------
  const air=buildCoastalAir(scene);
  const sky=air.getObjectByName('LOFT_COASTAL_SKY_DOME_V2');
  const clouds=air.children.filter(child=>child.name.startsWith('LOFT_COASTAL_CLOUD_SHEET_'));

  // --- ONE CONTINUOUS PLAYABLE SURFACE ------------------------------------
  const terrainGeo=buildUnifiedTerrain();
  const albedo=makeCourseAlbedo(),roughnessMap=makeCourseRoughness(),bump=makeMicroBump();
  const terrainMat=new THREE.MeshStandardMaterial({
    color:0xffffff,map:albedo,bumpMap:bump,bumpScale:COASTAL_TURF_LIGHT_SPEC.material.bumpScale,
    roughness:COASTAL_TURF_LIGHT_SPEC.material.roughness,roughnessMap,
    metalness:COASTAL_TURF_LIGHT_SPEC.material.metalness,dithering:true
  });
  terrainMat.name='LOFT_COASTAL_TURF_LIGHT_V2';
  terrainMat.userData.presentationSystem=COASTAL_TURF_LIGHT_SPEC.system;
  terrainMat.userData.contactSystem=COASTAL_TURF_LIGHT_SPEC.contactSystem;
  // The cup writes one tiny aperture into stencil before the field renders.
  // The terrain remains one untouched physical mesh while its pixels yield to
  // the regulation cup interior at the active pin.
  terrainMat.stencilWrite=true;
  terrainMat.stencilRef=1;
  terrainMat.stencilFunc=THREE.NotEqualStencilFunc;
  terrainMat.stencilFail=THREE.KeepStencilOp;
  terrainMat.stencilZFail=THREE.KeepStencilOp;
  terrainMat.stencilZPass=THREE.KeepStencilOp;
  const terrain=new THREE.Mesh(terrainGeo,terrainMat);
  terrain.receiveShadow=true;terrain.castShadow=false;world.add(terrain);

  // --- WATER ---------------------------------------------------------------
  const waves=waveTexture();
  const waterMat=new THREE.MeshPhysicalMaterial({
    color:COLORS.water,roughness:.18,metalness:.01,transparent:true,opacity:.96,
    clearcoat:.48,clearcoatRoughness:.20,bumpMap:waves,bumpScale:.075
  });
  const water=new THREE.Mesh(new THREE.PlaneGeometry(190,350,1,1),waterMat);
  water.rotation.x=-Math.PI/2;water.position.set(116,WATER_LEVEL,-122);world.add(water);
  const foamA=makeFoamRibbon(.10,.55,.34),foamB=makeFoamRibbon(1.18,.28,.17);
  world.add(foamA,foamB);
  const headland=buildLighthouseHeadland(world);

  // --- AUTHORED COASTAL ECOLOGY ------------------------------------------
  // Trees, understory, transition fescue and coastal rock are grouped by wind,
  // shelter and maintenance rather than distributed as repeated perimeter
  // cadence. Everything is visual-only, grounded on the shared terrain and
  // batched by a deliberately small family of recognizable silhouettes.
  const ecology=buildCoastalEcology(world);
  const dummy=new THREE.Object3D();

  // Bunker lips get restrained dimensional turf. This is visual only; the
  // single terrain field remains the sole collider.
  const bladeGeo=makeBladeClumpGeometry();
  const bunkerEdgeMat=new THREE.MeshStandardMaterial({color:0x6f845b,roughness:1,side:THREE.DoubleSide});
  const bunkerEdgeGrass=new THREE.InstancedMesh(bladeGeo,bunkerEdgeMat,240);
  let bunkerEdgeCount=0;
  for(const b of BUNKERS){
    for(let i=0;i<56&&bunkerEdgeCount<240;i++){
      const a=(i/56)*Math.PI*2;
      const warp=1+
        .085*Math.sin(a*3+b.seed)+
        .045*Math.cos(a*5-b.seed*.7)+
        .022*Math.sin(a*8+b.seed*.3);
      const rr=1.01+.045*Math.sin(a*7+b.seed*2.1);
      const x=b.x+Math.cos(a)*b.sx*warp*rr;
      const z=b.z+Math.sin(a)*b.sz*warp*rr;
      dummy.position.set(x,terrainHeight(x,z)+.004,z);
      dummy.rotation.set((rnd()-.5)*.06,a+(rnd()-.5)*.45,(rnd()-.5)*.06);
      const h=.38+rnd()*.55;
      dummy.scale.set(.55+rnd()*.38,h,.55+rnd()*.38);
      dummy.updateMatrix();bunkerEdgeGrass.setMatrixAt(bunkerEdgeCount++,dummy.matrix);
    }
  }
  bunkerEdgeGrass.count=bunkerEdgeCount;bunkerEdgeGrass.castShadow=false;bunkerEdgeGrass.receiveShadow=true;
  world.add(bunkerEdgeGrass);

  // High-density near-ball turf, regenerated per lie. Each sampled blade
  // reads the LOCAL cut, so a fairway/rough or fringe/green boundary has actual
  // grass-length continuity instead of one blanket height.
  const detailMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide});
  const detailGrass=new THREE.InstancedMesh(bladeGeo,detailMat,900);
  detailGrass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);world.add(detailGrass);
  const grassProfile={
    rough:{h:.78,c:0x5e744e},
    firstCut:{h:.30,c:0x687f58},
    fairway:{h:.12,c:0x718a60},
    fringe:{h:.26,c:0x758d62},
    // Maintained green / tee turf reads through bump and roughness. Explicit
    // double-sided blade triangles created the black flecks in close captures.
  };
  function setDetailFocus(position,surface='fairway'){
    const rr=seeded((Math.floor((position.x+110)*37+(position.z+350)*29))>>>0);
    const radius=surface==='rough'?4.7:surface==='green'?3.2:surface==='firstCut'?4.1:3.8;
    const count=surface==='rough'?640:surface==='green'||surface==='tee'?0:surface==='fringe'?220:surface==='firstCut'?320:170;
    const tmpColor=new THREE.Color();

    for(let i=0;i<900;i++){
      if(i>=count){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);dummy.updateMatrix();
        detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const a=rr()*Math.PI*2,r=Math.sqrt(rr())*radius;
      const x=position.x+Math.cos(a)*r,z=position.z+Math.sin(a)*r;
      const localSurface=courseSurfaceAt(x,z);
      const profile=grassProfile[localSurface];
      if(!profile){
        dummy.position.set(0,-1000,0);dummy.scale.setScalar(0);dummy.updateMatrix();
        detailGrass.setMatrixAt(i,dummy.matrix);continue;
      }
      const h=profile.h*(.72+rr()*.58);
      dummy.position.set(x,terrainHeight(x,z)+.003,z);
      dummy.rotation.set((rr()-.5)*.07,rr()*Math.PI*2,(rr()-.5)*.07);
      dummy.scale.set(.52+rr()*.52,h,.52+rr()*.52);
      dummy.updateMatrix();detailGrass.setMatrixAt(i,dummy.matrix);
      tmpColor.setHex(profile.c).multiplyScalar(.94+rr()*.10);
      detailGrass.setColorAt(i,tmpColor);
    }
    detailGrass.instanceMatrix.needsUpdate=true;
    if(detailGrass.instanceColor)detailGrass.instanceColor.needsUpdate=true;
  }

  // --- RIDGE HOUSE / LIGHTHOUSE -------------------------------------------
  const ridgeHouse=buildRidgeHouse(world);

  const lighthouse=new THREE.Group();
  const lighthouseRoofMat=new THREE.MeshStandardMaterial({color:COLORS.ink,roughness:.84});
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.26,1.77,11.8,36),new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.94}));
  tower.position.y=5.9;tower.castShadow=true;lighthouse.add(tower);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,.52,36),new THREE.MeshStandardMaterial({color:COLORS.orange,roughness:.82}));
  band.position.y=9.85;lighthouse.add(band);
  const balcony=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.18,36),lighthouseRoofMat);balcony.position.y=11.08;lighthouse.add(balcony);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,1.25,36),new THREE.MeshStandardMaterial({color:0x526061,roughness:.32}));
  room.position.y=11.70;lighthouse.add(room);
  const roof2=new THREE.Mesh(new THREE.ConeGeometry(1.84,2.30,36),lighthouseRoofMat);roof2.position.y=13.50;lighthouse.add(roof2);
  lighthouse.position.set(38.5,terrainHeight(38.5,-172),-172);lighthouse.scale.set(.82,.82,.82);world.add(lighthouse);

  // --- SPATIAL CUP + FLAG ---------------------------------------------------
  const CUP_RADIUS=.053975;
  const CUP_DEPTH=.1016;
  const FLAGSTICK_HEIGHT=2.45;
  const cupGroup=new THREE.Group();cupGroup.name='LOFT_CUP_SPATIAL_V1';world.add(cupGroup);
  cupGroup.userData.radius=CUP_RADIUS;
  cupGroup.userData.depth=CUP_DEPTH;
  cupGroup.userData.ballRestY=-CUP_DEPTH+.028;

  // Colorless stencil aperture. It removes only the terrain pixels inside the
  // real mouth; physics continues to sample the original shared field.
  const apertureMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,depthTest:false,depthWrite:false});
  apertureMat.colorWrite=false;
  apertureMat.stencilWrite=true;
  apertureMat.stencilRef=1;
  apertureMat.stencilFunc=THREE.AlwaysStencilFunc;
  apertureMat.stencilFail=THREE.ReplaceStencilOp;
  apertureMat.stencilZFail=THREE.ReplaceStencilOp;
  apertureMat.stencilZPass=THREE.ReplaceStencilOp;
  const cupAperture=new THREE.Mesh(new THREE.CircleGeometry(CUP_RADIUS,64),apertureMat);
  cupAperture.name='LOFT_CUP_APERTURE';
  cupAperture.rotation.x=-Math.PI/2;cupAperture.position.y=.002;cupAperture.renderOrder=-10;cupGroup.add(cupAperture);

  const soilMat=new THREE.MeshStandardMaterial({color:0x29271f,roughness:1,side:THREE.BackSide});
  const cupWall=new THREE.Mesh(new THREE.CylinderGeometry(CUP_RADIUS*.997,CUP_RADIUS*.997,.017,64,1,true),soilMat);
  cupWall.name='LOFT_CUP_TURF_CUT';cupWall.position.y=-.0085;cupWall.renderOrder=3;cupGroup.add(cupWall);

  const linerMat=new THREE.MeshStandardMaterial({color:0xd9d4ca,roughness:.96,side:THREE.BackSide});
  const linerHeight=CUP_DEPTH-.015;
  const cupLiner=new THREE.Mesh(new THREE.CylinderGeometry(CUP_RADIUS-.0022,CUP_RADIUS-.0022,linerHeight,64,2,true),linerMat);
  cupLiner.name='LOFT_CUP_LINER';cupLiner.position.y=-.015-linerHeight*.5;cupLiner.renderOrder=3;cupGroup.add(cupLiner);

  const rimMat=new THREE.MeshStandardMaterial({color:0xe3ddd2,roughness:.90,metalness:0});
  const cupRim=new THREE.Mesh(new THREE.TorusGeometry(CUP_RADIUS-.00125,.00125,8,64),rimMat);
  cupRim.name='LOFT_CUP_LIP';cupRim.rotation.x=-Math.PI/2;cupRim.position.y=-.0045;cupRim.renderOrder=4;cupGroup.add(cupRim);

  const bottomMat=new THREE.MeshStandardMaterial({color:0x101212,roughness:1,side:THREE.DoubleSide});
  const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(CUP_RADIUS-.0024,64),bottomMat);
  holeDisc.name='LOFT_CUP_BOTTOM';holeDisc.rotation.x=-Math.PI/2;holeDisc.position.y=-CUP_DEPTH;holeDisc.renderOrder=2;cupGroup.add(holeDisc);
  const sleeve=new THREE.Mesh(
    new THREE.CylinderGeometry(.014,.016,.027,24),
    new THREE.MeshStandardMaterial({color:0xbab5aa,roughness:.88})
  );
  sleeve.name='LOFT_FLAGSTICK_SLEEVE';sleeve.position.y=-CUP_DEPTH+.0135;cupGroup.add(sleeve);

  const poleLength=FLAGSTICK_HEIGHT+CUP_DEPTH-.006;
  const poleMat=new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.90,transparent:true,depthWrite:false});
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,poleLength,16),poleMat);pole.name='LOFT_FLAGSTICK';world.add(pole);
  const fs=new THREE.Shape();
  fs.moveTo(0,0);fs.bezierCurveTo(.25,-.012,.55,-.025,.72,-.10);fs.lineTo(.64,-.34);fs.bezierCurveTo(.42,-.29,.18,-.36,0,-.40);fs.closePath();
  const flagMat=new THREE.MeshStandardMaterial({color:COLORS.orange,side:THREE.DoubleSide,roughness:.84,transparent:true,depthWrite:false});
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(fs),flagMat);flag.name='LOFT_PIN_FLAG';flag.rotation.y=Math.PI/2;world.add(flag);

  function setPin(next){
    const y=terrainHeight(next.x,next.z);
    cupGroup.position.set(next.x,y,next.z);
    pole.position.set(next.x,y+(FLAGSTICK_HEIGHT-CUP_DEPTH+.006)*.5,next.z);
    flag.position.set(next.x,y+FLAGSTICK_HEIGHT,next.z);
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
    clouds.forEach((q,i)=>{
      q.position.x=q.userData.baseX+Math.sin(worldTime*.035+q.userData.phase)*5.5;
      q.position.y=q.userData.baseY+Math.sin(worldTime*.06+i)*.28;
    });
    foamA.material.opacity=.32+Math.sin(worldTime*.55)*.018;
    foamB.material.opacity=.15+Math.sin(worldTime*.42+1.6)*.012;
    flag.rotation.z=Math.sin(worldTime*2.15)*.035+Math.sin(worldTime*3.8)*.012;
  }

  return {
    world,terrain,air,sky,clouds,
    fairway:terrain,green:terrain,fringe:terrain,
    cupGroup,cupAperture,cupWall,cupLiner,holeDisc,cupRim,pole,flag,water,headland,ecology,ridgeHouse,
    setPin,setPinFade,setDetailFocus,updateWorld
  };
}
