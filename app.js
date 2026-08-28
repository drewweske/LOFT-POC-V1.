const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

let THREE;
try{
  THREE=await import("https://cdn.jsdelivr.net/npm/three@0.164.1/+esm");
}catch(err){
  $("fatal").classList.add("show");
  $("fatal-text").textContent="Three.js failed to load. "+err.message;
  throw err;
}

const C={
  ink:0x0B0D0D,cream:0xF2EFE8,orange:0xFF6A2A,
  rough:0x466145,fair:0x76936b,green:0x8aa679,
  sand:0xd8c69d,water:0x4b6c72,rock:0x817566,
  sky:0xc8d7d8,skin:0xc99573
};

const Y=.9144;
const WIND=3.13;
const PIN_YARDS=171;
const terrainH=(x,z)=>
  .34*Math.sin((z+27)*.035)+
  .18*Math.sin((z-18)*.074)+
  .14*Math.sin(x*.11+z*.019)-
  .35*Math.exp(-(x*x+z*z)/180);

const pin=new THREE.Vector3(2.5,terrainH(2.5,-PIN_YARDS*Y),-PIN_YARDS*Y);

const levels={
  1:{name:"ROOKIE",sway:.18,plane:.26,balance:.48,finish:.52},
  10:{name:"LEARNING",sway:.12,plane:.17,balance:.62,finish:.66},
  25:{name:"PLAYER",sway:.06,plane:.08,balance:.82,finish:.84},
  50:{name:"MASTERED",sway:.02,plane:.02,balance:.98,finish:1}
};

const state={
  level:1,
  phase:"ready",
  shots:0,
  target:pin.clone(),
  vel:new THREE.Vector3(),
  shot:null,
  orbitYaw:.5,
  orbitPitch:.21,
  orbitDist:10,
  flightYaw:.42,
  flightPitch:.22,
  flightDist:10.5,
  follow:.5,
  learned:{camera:false,line:false,stroke:false}
};

const host=$("stage");
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(C.sky);
host.appendChild(renderer.domElement);
const canvas=renderer.domElement;

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(C.sky,100,295);

const camera=new THREE.PerspectiveCamera(45,1,.1,700);
const camTarget=new THREE.Vector3(0,.8,-15);

scene.add(new THREE.HemisphereLight(0xf8f1e5,0x304438,2.3));
const sun=new THREE.DirectionalLight(0xffefd3,3);
sun.position.set(-55,78,35);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-120;
sun.shadow.camera.right=120;
sun.shadow.camera.top=105;
sun.shadow.camera.bottom=-230;
scene.add(sun);

const mat=(c,r=.86,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const world=new THREE.Group();
scene.add(world);

function buildTerrain(){
  const g=new THREE.PlaneGeometry(132,235,46,84);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i);
    const z=p.getZ(i)-98;
    p.setZ(i,z);
    p.setY(i,terrainH(x,z));
  }
  p.needsUpdate=true;
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat(C.rough));
  m.receiveShadow=true;
  world.add(m);
}
buildTerrain();

function ribbon(w,d,c,x,z){
  const g=new THREE.PlaneGeometry(w,d,10,56);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const lx=p.getX(i),lz=p.getZ(i);
    const wx=x+lx,wz=z+lz;
    p.setY(i,terrainH(wx,wz)+.035);
  }
  p.needsUpdate=true;
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat(c));
  m.position.set(x,0,z);
  m.receiveShadow=true;
  world.add(m);
}
ribbon(31,170,C.fair,-1,-85);
ribbon(13,10,C.green,0,2);

const greenGeo=new THREE.CircleGeometry(18,56);
greenGeo.rotateX(-Math.PI/2);
const green=new THREE.Mesh(greenGeo,mat(C.green));
green.scale.set(1.34,1,1);
green.position.set(pin.x,pin.y+.055,pin.z);
green.receiveShadow=true;
world.add(green);

const water=new THREE.Mesh(
  new THREE.PlaneGeometry(110,235),
  new THREE.MeshStandardMaterial({color:C.water,roughness:.35,transparent:true,opacity:.92})
);
water.rotation.x=-Math.PI/2;
water.position.set(88,-.34,-98);
world.add(water);

function bunker(x,z,sx,sz){
  const g=new THREE.CircleGeometry(1,44);
  g.rotateX(-Math.PI/2);
  const b=new THREE.Mesh(g,mat(C.sand));
  b.scale.set(sx,1,sz);
  b.position.set(x,terrainH(x,z)+.06,z);
  world.add(b);
}
bunker(-14,pin.z+8,8,4.2);
bunker(17,pin.z-3,7,3.7);
bunker(12,-94,5.2,2.7);

function tree(x,z,s=1){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2*s,.3*s,2.4*s,8),mat(0x594534));
  trunk.position.y=1.2*s;
  trunk.castShadow=true;
  g.add(trunk);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(2*s,5*s,9),mat(0x294632));
  crown.position.y=4.2*s;
  crown.castShadow=true;
  g.add(crown);
  const crown2=new THREE.Mesh(new THREE.ConeGeometry(1.45*s,3.4*s,9),mat(0x36593e));
  crown2.position.y=5.9*s;
  crown2.castShadow=true;
  g.add(crown2);
  g.position.set(x,terrainH(x,z),z);
  world.add(g);
}
[
  [-30,-30,1],[-30,-65,.9],[-29,-105,1],[-26,-145,.9],
  [30,-45,.8],[29,-110,.8],[-25,-170,.8]
].forEach(v=>tree(...v));

function rock(x,z,s=.8){
  const r=new THREE.Mesh(new THREE.IcosahedronGeometry(3.6*s,1),mat(C.rock));
  r.scale.y=.72;
  r.position.set(x,terrainH(x,z)+1.2*s,z);
  r.rotation.set(.2,.4,.1);
  r.castShadow=true;
  world.add(r);
}
for(let i=0;i<14;i++) rock(46+(i%4)*6,-28-Math.floor(i/4)*40,.62+(i%3)*.13);

const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,4.5,8),mat(C.cream));
pole.position.set(pin.x,pin.y+2.25,pin.z);
world.add(pole);

const fs=new THREE.Shape();
fs.moveTo(0,0);
fs.lineTo(2.2,.55);
fs.lineTo(0,1.1);
fs.closePath();
const flag=new THREE.Mesh(
  new THREE.ShapeGeometry(fs),
  new THREE.MeshStandardMaterial({color:C.orange,side:THREE.DoubleSide,roughness:.82})
);
flag.position.set(pin.x,pin.y+3.9,pin.z);
flag.rotation.y=Math.PI/2;
world.add(flag);

/* LOFT Ball */
const ballG=new THREE.Group();
scene.add(ballG);
const ball=new THREE.Mesh(new THREE.SphereGeometry(.23,42,30),mat(C.cream,.72));
ball.castShadow=true;
ballG.add(ball);
const dot=new THREE.Mesh(new THREE.SphereGeometry(.035,14,10),mat(C.orange,.65));
dot.position.set(-.115,-.045,.198);
ballG.add(dot);
ballG.position.set(0,terrainH(0,0)+.23,0);

/* Procedural golfer */
const golfer=new THREE.Group();
scene.add(golfer);
golfer.position.set(-.82,terrainH(0,0),.15);

const hips=new THREE.Mesh(new THREE.BoxGeometry(.58,.36,.34),mat(C.ink));
hips.position.set(0,1,.08);
hips.castShadow=true;
golfer.add(hips);

const torso=new THREE.Mesh(new THREE.CylinderGeometry(.33,.41,.9,14),mat(C.cream));
torso.position.set(0,1.58,0);
torso.castShadow=true;
golfer.add(torso);

const head=new THREE.Mesh(new THREE.SphereGeometry(.25,20,14),mat(C.skin,.8));
head.position.set(0,2.25,-.03);
head.castShadow=true;
golfer.add(head);

const cap=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.12,18),mat(C.ink));
cap.position.set(0,2.48,-.03);
golfer.add(cap);

const armMat=mat(C.skin,.8);
const armL=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.72,9),armMat);
armL.position.set(.2,1.48,-.1);
armL.rotation.z=-.55;
golfer.add(armL);
const armR=armL.clone();
armR.position.set(-.2,1.48,.09);
armR.rotation.z=.55;
golfer.add(armR);

const swing=new THREE.Group();
swing.position.set(.02,1.38,-.08);
golfer.add(swing);

const shaft=new THREE.Mesh(
  new THREE.CylinderGeometry(.024,.028,1.55,9),
  new THREE.MeshStandardMaterial({color:0xc7c4bd,roughness:.3,metalness:.55})
);
shaft.position.y=-.76;
shaft.castShadow=true;
swing.add(shaft);

const clubHead=new THREE.Mesh(
  new THREE.BoxGeometry(.42,.12,.16),
  mat(C.ink,.45,.25)
);
clubHead.position.set(.18,-1.52,0);
clubHead.castShadow=true;
swing.add(clubHead);
swing.rotation.z=-.28;

/* The Line */
const lineMat=new THREE.MeshBasicMaterial({
  color:C.cream,transparent:true,opacity:.35,depthWrite:false
});
let line=new THREE.Mesh(
  new THREE.TubeGeometry(
    new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,1,-1)),
    8,.035,5,false
  ),
  lineMat
);
world.add(line);

const halo=new THREE.Group();
world.add(halo);
const ring=new THREE.Mesh(
  new THREE.TorusGeometry(1.15,.055,8,48),
  new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.78})
);
ring.rotation.x=Math.PI/2;
halo.add(ring);
const haloDot=new THREE.Mesh(
  new THREE.SphereGeometry(.12,16,10),
  new THREE.MeshBasicMaterial({color:C.orange})
);
haloDot.position.set(-.8,.12,.8);
halo.add(haloDot);

function updateLine(){
  const a=new THREE.Vector3(0,terrainH(0,0)+.33,0);
  const b=state.target.clone();
  b.y=terrainH(b.x,b.z)+.1;
  const m=a.clone().lerp(b,.52);
  m.y+=24;
  m.x+=WIND*.7;
  const g=new THREE.TubeGeometry(
    new THREE.QuadraticBezierCurve3(a,m,b),
    50,.035,6,false
  );
  line.geometry.dispose();
  line.geometry=g;
  halo.position.copy(b);
  golfer.rotation.y=Math.atan2(b.x,-b.z);
}
updateLine();

const ray=new THREE.Raycaster();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);

function rayGround(cx,cy){
  const r=canvas.getBoundingClientRect();
  const n=new THREE.Vector2(
    ((cx-r.left)/r.width)*2-1,
    -(((cy-r.top)/r.height)*2-1)
  );
  ray.setFromCamera(n,camera);
  const p=new THREE.Vector3();
  return ray.ray.intersectPlane(groundPlane,p)?p:null;
}

function screenOf(v){
  const r=canvas.getBoundingClientRect();
  const p=v.clone().project(camera);
  return {
    x:r.left+(p.x*.5+.5)*r.width,
    y:r.top+(-p.y*.5+.5)*r.height
  };
}

function showContext(text){
  $("context-text").textContent=text;
  $("context").classList.add("show");
}
function hideContext(){
  $("context").classList.remove("show");
}
function setTip(text){
  $("tip-text").textContent=text;
  $("tip").style.opacity="1";
}
function updateTip(){
  if(!state.learned.camera) setTip("Drag anywhere to orbit · pinch to zoom");
  else if(!state.learned.line) setTip("Drag the orange landing mark to shape The Line");
  else if(!state.learned.stroke) setTip("Press near the ball · pull back · drive through");
  else $("tip").style.opacity="0";
}

function setTarget(p){
  if(!p)return;
  const d=clamp(Math.hypot(p.x,p.z),90,168);
  const a=Math.atan2(p.x,-p.z);
  state.target.set(
    Math.sin(a)*d,
    terrainH(Math.sin(a)*d,-Math.cos(a)*d)+.1,
    -Math.cos(a)*d
  );
  state.learned.line=true;
  updateLine();
  showContext("THE LINE");
  setTimeout(hideContext,420);
  updateTip();
}

function surfaceAt(x,z){
  const gx=(x-pin.x)/(18*1.34);
  const gz=(z-pin.z)/18;
  if(gx*gx+gz*gz<=1)return "green";
  if(x>39&&z<-16)return "water";
  if(Math.abs(x)<19&&z<2&&z>-170)return "fairway";
  return "rough";
}

function animateGolfer(t){
  const L=levels[state.level];
  const rookie=1-L.balance;

  if(t<.5){
    const u=t/.5;
    swing.rotation.z=lerp(-.28,1.30,u);
    swing.rotation.x=Math.sin(u*Math.PI)*L.plane*.22;
    torso.rotation.y=lerp(0,-.30,u);
    hips.rotation.y=lerp(0,-.12,u);
    head.position.x=Math.sin(u*Math.PI)*L.sway;
    torso.position.x=rookie*.06*Math.sin(u*Math.PI);
  }else{
    const u=(t-.5)/.5;
    swing.rotation.z=lerp(1.30,-1.28*L.finish,u);
    swing.rotation.x=Math.sin(u*Math.PI)*L.plane*.40;
    torso.rotation.y=lerp(-.30,.31,u);
    hips.rotation.y=lerp(-.12,.14,u);
    head.position.x=lerp(L.sway,0,u);
    torso.position.x=rookie*.08*Math.sin(u*Math.PI);
    armL.rotation.z=lerp(-.55,-.20,u);
    armR.rotation.z=lerp(.55,.25,u);
  }
}

function launch(power,tempo,path,speed){
  if(state.phase!=="ready")return;

  const L=levels[state.level];
  const penalty=(1-L.balance)*.055;
  const tempoScore=1-Math.min(1,Math.abs(tempo-94)/50);
  const quality=clamp(
    .72+.18*tempoScore+.1*speed-.018*Math.abs(path)-penalty,
    .52,1.01
  );

  const range=PIN_YARDS*Y*clamp(power*(1-penalty),.45,1.08)*quality;
  const launchAngle=22*Math.PI/180;
  const v0=Math.sqrt(Math.max(3,range*9.81/Math.sin(2*launchAngle)));
  const yaw=
    Math.atan2(state.target.x,-state.target.z)+
    (path+L.plane*4)*.46*Math.PI/180;

  state.vel.set(
    Math.sin(yaw)*v0,
    Math.sin(launchAngle)*v0,
    -Math.cos(yaw)*v0
  );

  state.phase="flight";
  state.shot={
    quality,
    label:quality>.94?"PURE":quality>.84?"SOLID":quality>.72?"PLAYABLE":path>0?"PUSH":"PULL"
  };
  state.shots++;
  state.learned.stroke=true;
  state.follow=.5;

  line.visible=false;
  halo.visible=false;

  showContext(state.shot.label);
  setTimeout(hideContext,600);
  $("tip").style.opacity="0";
}

function finishShot(){
  state.phase="result";
  const ft=Math.hypot(ballG.position.x-pin.x,ballG.position.z-pin.z)*3.28084;
  const s=surfaceAt(ballG.position.x,ballG.position.z);

  $("result-kicker").textContent=state.shot.label;

  if(s==="water"){
    $("result-head").textContent="WATER";
    $("result-sub").textContent="Right of The Line";
  }else if(ft<3){
    $("result-head").textContent="TAP-IN";
    $("result-sub").textContent="Inside 3 ft";
  }else if(ft<40){
    $("result-head").textContent=Math.round(ft)+" FT";
    $("result-sub").textContent=(ft<12?"Dialed":"On "+s)+" · "+(ballG.position.z<pin.z?"long":"short");
  }else{
    $("result-head").textContent=Math.round(ft/3)+" YDS";
    $("result-sub").textContent="From pin · "+s;
  }

  $("result").classList.add("show");
  setTip("Drag around the ball to inspect the finish");
}

function resetShot(){
  state.phase="ready";
  state.vel.set(0,0,0);
  state.shot=null;
  ballG.position.set(0,terrainH(0,0)+.23,0);
  ballG.rotation.set(0,0,0);
  line.visible=true;
  halo.visible=true;
  state.orbitYaw=.5;
  state.orbitPitch=.21;
  state.orbitDist=10;
  state.follow=.5;
  animateGolfer(0);
  $("result").classList.remove("show");
  updateTip();
}

$("again").addEventListener("click",resetShot);
$("cam-reset").addEventListener("click",()=>{
  state.orbitYaw=.5;
  state.orbitPitch=.21;
  state.orbitDist=10;
  state.flightYaw=.42;
  state.flightPitch=.22;
  state.flightDist=10.5;
});

$("level-btn").addEventListener("click",()=>{
  $("level-menu").classList.toggle("open");
});

document.querySelectorAll(".level").forEach(btn=>{
  btn.addEventListener("click",()=>{
    state.level=Number(btn.dataset.level);
    $("level-text").textContent="LV "+state.level+" · "+levels[state.level].name;
    document.querySelectorAll(".level").forEach(x=>x.classList.toggle("active",x===btn));
    $("level-menu").classList.remove("open");
    animateGolfer(0);
    showContext(levels[state.level].name);
    setTimeout(hideContext,500);
  });
});

const pointers=new Map();
let gesture=null;

canvas.addEventListener("pointerdown",e=>{
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY});

  if(pointers.size===2){
    gesture={type:"pinch",last:null,lastMid:null};
    $("tip").style.opacity="0";
    return;
  }

  const p={x:e.clientX,y:e.clientY};
  const bs=screenOf(ballG.position.clone());
  const hs=screenOf(halo.position.clone());
  const db=Math.hypot(p.x-bs.x,p.y-bs.y);
  const dh=Math.hypot(p.x-hs.x,p.y-hs.y);

  let type="orbit";
  if(state.phase==="ready"&&dh<82)type="line";
  else if(state.phase==="ready"&&db<100)type="swing";

  gesture={
    type,id:e.pointerId,
    sx:e.clientX,sy:e.clientY,
    lx:e.clientX,ly:e.clientY,
    deep:e.clientY,
    deepT:performance.now(),
    lt:performance.now(),
    load:0,
    moved:false,
    impact:false
  };

  if(type==="line"){
    showContext("THE LINE");
    $("tip").style.opacity="0";
  }

  if(type==="swing"){
    showContext("LOAD");
    $("swing-meter").classList.add("show");
    $("tip").style.opacity="0";
  }
});

canvas.addEventListener("pointermove",e=>{
  const p=pointers.get(e.pointerId);
  if(!p)return;
  e.preventDefault();

  p.px=p.x;p.py=p.y;
  p.x=e.clientX;p.y=e.clientY;

  if(pointers.size>=2){
    const a=[...pointers.values()].slice(0,2);
    const dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    const mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};

    if(gesture?.type!=="pinch")gesture={type:"pinch",last:dist,lastMid:mid};

    if(gesture.last){
      const dd=dist-gesture.last;
      const dx=mid.x-gesture.lastMid.x;
      const dy=mid.y-gesture.lastMid.y;

      if(state.phase==="ready"){
        state.orbitDist=clamp(state.orbitDist-dd*.018,6.5,15);
        state.orbitYaw-=dx*.0046;
        state.orbitPitch=clamp(state.orbitPitch+dy*.003,-.1,.58);
      }else{
        state.flightDist=clamp(state.flightDist-dd*.018,6.2,16);
        state.flightYaw-=dx*.0046;
        state.flightPitch=clamp(state.flightPitch+dy*.003,-.08,.60);
      }

      state.learned.camera=true;
      updateTip();
    }

    gesture.last=dist;
    gesture.lastMid=mid;
    return;
  }

  if(!gesture||gesture.id!==e.pointerId)return;

  const dx=e.clientX-gesture.lx;
  const dy=e.clientY-gesture.ly;
  const total=Math.hypot(e.clientX-gesture.sx,e.clientY-gesture.sy);
  if(total>5)gesture.moved=true;

  if(gesture.type==="orbit"){
    if(state.phase==="ready"){
      state.orbitYaw-=dx*.005;
      state.orbitPitch=clamp(state.orbitPitch+dy*.003,-.1,.58);
    }else{
      state.flightYaw-=dx*.005;
      state.flightPitch=clamp(state.flightPitch+dy*.003,-.08,.60);
    }
    state.learned.camera=true;
    updateTip();
  }

  if(gesture.type==="line"){
    const p=rayGround(e.clientX,e.clientY);
    if(p&&p.z<-8)setTarget(p);
  }

  if(gesture.type==="swing"&&!gesture.impact){
    const now=performance.now();

    if(e.clientY>gesture.deep){
      gesture.deep=e.clientY;
      gesture.deepT=now;
    }

    const r=canvas.getBoundingClientRect();
    const load=clamp((gesture.deep-gesture.sy)/(r.height*.27),0,1.08);
    gesture.load=Math.max(gesture.load,load);
    $("swing-fill").style.height=(clamp(load,0,1)*100)+"%";

    if(e.clientY>=gesture.deep-10){
      animateGolfer(load*.5);
      showContext(load>.74?"TURN":"LOAD");
    }else{
      const through=clamp((gesture.deep-e.clientY)/(r.height*.27),0,1.1);
      animateGolfer(.5+through*.5);
      showContext("STRIKE");

      if(e.clientY<gesture.sy-18&&gesture.load>.34){
        const frameDt=Math.max(8,now-gesture.lt);
        const px=Math.hypot(e.clientX-gesture.lx,e.clientY-gesture.ly)/frameDt;
        const transition=Math.max(70,now-gesture.deepT);
        const tempo=clamp(100-Math.abs(238-transition)*.18,42,100);
        const path=clamp((e.clientX-gesture.sx)/(r.width*.055),-8,8);
        const speed=clamp(px/1.12,.65,1.12);
        const power=clamp(gesture.load*.79+speed*.21,.45,1.08);

        gesture.impact=true;
        $("swing-meter").classList.remove("show");
        $("swing-fill").style.height="0";
        launch(power,tempo,path,speed);
      }
    }
  }

  gesture.lx=e.clientX;
  gesture.ly=e.clientY;
  gesture.lt=performance.now();
});

function endPointer(e){
  pointers.delete(e.pointerId);

  if(pointers.size>0){
    if(pointers.size===1)gesture=null;
    return;
  }

  if(gesture&&gesture.id===e.pointerId){
    if(gesture.type==="orbit"&&!gesture.moved&&state.phase==="ready"){
      const p=rayGround(e.clientX,e.clientY);
      if(p&&p.z<-8)setTarget(p);
    }

    if(gesture.type==="swing"&&!gesture.impact){
      animateGolfer(0);
      $("swing-meter").classList.remove("show");
      $("swing-fill").style.height="0";
      hideContext();
      setTip("Pull farther back · then drive through impact");
    }

    if(gesture.type==="line"){
      hideContext();
      updateTip();
    }
  }

  gesture=null;
}
canvas.addEventListener("pointerup",endPointer);
canvas.addEventListener("pointercancel",endPointer);

function readyCam(dt){
  const yaw=Math.atan2(state.target.x,-state.target.z)+state.orbitYaw;
  const d=new THREE.Vector3(
    Math.sin(yaw)*state.orbitDist,
    3.3+state.orbitPitch*5.2,
    Math.cos(yaw)*state.orbitDist
  );
  camera.position.lerp(d,clamp(dt*7,0,1));
  camTarget.lerp(new THREE.Vector3(0,.9,-10),clamp(dt*8,0,1));
}

function flightCam(dt){
  const v=state.vel.clone();
  v.y=0;
  const base=v.lengthSq()>.01?Math.atan2(v.x,-v.z):0;
  const yaw=base+state.flightYaw;
  const d=ballG.position.clone().add(
    new THREE.Vector3(
      Math.sin(yaw)*state.flightDist,
      3.5+state.flightPitch*6,
      Math.cos(yaw)*state.flightDist
    )
  );
  camera.position.lerp(d,clamp(dt*7.5,0,1));
  camTarget.lerp(ballG.position,clamp(dt*10,0,1));
}

function resize(){
  const r=host.getBoundingClientRect();
  const w=Math.max(320,r.width);
  const hh=Math.max(520,r.height);
  renderer.setSize(w,hh,false);
  camera.aspect=w/hh;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

let last=performance.now();

function frame(now){
  const dt=Math.min(.026,(now-last)/1000||.016);
  last=now;

  if(state.phase==="ready"){
    readyCam(dt);
  }else if(state.phase==="flight"){
    state.follow=clamp(state.follow+dt*1.2,.5,1);
    animateGolfer(state.follow);

    const v=state.vel;
    const s=v.length();
    v.multiplyScalar(Math.exp(-.0018*s*dt));
    v.x+=WIND*.086*dt;
    v.y-=9.81*dt;

    ballG.position.addScaledVector(v,dt);
    ballG.rotation.x+=v.z*dt*.044;
    ballG.rotation.z-=v.x*dt*.044;

    const gy=terrainH(ballG.position.x,ballG.position.z)+.23;

    if(ballG.position.y<=gy&&v.y<0){
      const sf=surfaceAt(ballG.position.x,ballG.position.z);
      ballG.position.y=gy;

      if(sf==="water"){
        state.phase="result";
        setTimeout(finishShot,150);
      }else if(Math.abs(v.y)>2){
        const rest=sf==="green"?.18:sf==="fairway"?.23:sf==="rough"?.12:.055;
        v.y=-v.y*rest;
        v.x*=.8;
        v.z*=.84;
      }else{
        v.y=0;
        state.phase="roll";
      }
    }

    flightCam(dt);
  }else if(state.phase==="roll"){
    const v=state.vel;
    const sf=surfaceAt(ballG.position.x,ballG.position.z);
    v.multiplyScalar(Math.pow(sf==="green"?.988:sf==="fairway"?.976:.925,dt*60));
    ballG.position.addScaledVector(v,dt);
    ballG.position.y=terrainH(ballG.position.x,ballG.position.z)+.23;
    ballG.rotation.x+=v.z*dt*.04;
    ballG.rotation.z-=v.x*dt*.04;

    flightCam(dt);

    if(v.length()<.28)finishShot();
  }else if(state.phase==="result"){
    flightCam(dt);
  }

  if(state.phase==="ready"){
    ring.scale.setScalar(.96+Math.sin(now*.0038)*.04);
  }

  camera.lookAt(camTarget);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}

animateGolfer(0);
updateTip();
$("boot").remove();
requestAnimationFrame(frame);