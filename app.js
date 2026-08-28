import {CLUBS,BALLS,LEVELS} from './equipment.js?v=07';
import {LoftGolfer} from './character.js?v=07';
import {buildCoastalRidge} from './world.js?v=07';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothTo=(a,b,rate,dt)=>lerp(a,b,1-Math.exp(-rate*dt));
const deg=d=>d*Math.PI/180;

window.addEventListener('error',e=>{
  const fatal=$('fatal');
  if(fatal){fatal.classList.add('show');$('fatal-text').textContent=e.message||'Unknown runtime error';}
});

let THREE;
try{
  THREE=await import('https://cdn.jsdelivr.net/npm/three@0.164.1/+esm');
}catch(err){
  $('fatal').classList.add('show');
  $('fatal-text').textContent='The 3D runtime failed to load. '+err.message;
  throw err;
}

const C={
  ink:0x0B0D0D,cream:0xF2EFE8,stone:0xB8B1A6,orange:0xFF6A2A,
  rough:0x476244,fair:0x77936b,green:0x8aa679,sand:0xd8c69d,
  water:0x4a6c72,rock:0x817566,sky:0xc8d7d8
};

const YARD=.9144;
const PIN_YARDS=171;
const windVec=new THREE.Vector3(3.13,0,0);
const terrainH=(x,z)=>
  .38*Math.sin((z+27)*.035)+
  .20*Math.sin((z-18)*.074)+
  .15*Math.sin(x*.11+z*.019)-
  .38*Math.exp(-(x*x+z*z)/180);

const pin=new THREE.Vector3(2.5,terrainH(2.5,-PIN_YARDS*YARD),-PIN_YARDS*YARD);

const state={
  clubId:'iron7',
  ballId:'core01',
  level:1,
  phase:'ready',
  shots:0,
  target:pin.clone(),
  vel:new THREE.Vector3(),
  spinAxis:new THREE.Vector3(),
  spinOmega:0,
  shot:null,
  swingPhase:0,
  learned:{camera:false,line:false,stroke:false},
  cam:{
    yaw:.62,yawTarget:.62,
    pitch:.18,pitchTarget:.18,
    dist:9.6,distTarget:9.6,
    flightYaw:.42,flightYawTarget:.42,
    flightPitch:.20,flightPitchTarget:.20,
    flightDist:10.4,flightDistTarget:10.4
  }
};

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(C.sky);
$('stage').appendChild(renderer.domElement);
const canvas=renderer.domElement;
canvas.tabIndex=0;
canvas.setAttribute('aria-label','LOFT P0.7. Drag to orbit, pinch to zoom, move the orange landing mark to shape The Line, and pull back then swing through the ball.');

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(C.sky,108,315);
const camera=new THREE.PerspectiveCamera(43,1,.1,750);
const camTarget=new THREE.Vector3(0,.8,-12);

scene.add(new THREE.HemisphereLight(0xf8f1e5,0x304438,2.25));
const sun=new THREE.DirectionalLight(0xffefd4,3.05);
sun.position.set(-56,82,38);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=105;sun.shadow.camera.bottom=-235;
scene.add(sun);

const mat=(c,r=.86,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const {world}=buildCoastalRidge(THREE,{C,terrainH,pin});
scene.add(world);

function makeBallBump(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#bcbcbc';ctx.fillRect(0,0,256,256);
  for(let y=13;y<256;y+=27){
    for(let x=13+(y%54?13:0);x<256;x+=27){ctx.fillStyle='#5a5a5a';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1);return t;
}
const ballGroup=new THREE.Group();scene.add(ballGroup);
const ballMat=new THREE.MeshStandardMaterial({color:C.cream,roughness:.73,bumpMap:makeBallBump(),bumpScale:-.032});
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(.23,52,38),ballMat);ballMesh.castShadow=true;ballGroup.add(ballMesh);
const ballDot=new THREE.Mesh(new THREE.SphereGeometry(.034,16,12),mat(C.orange,.65));ballDot.position.set(-.115,-.046,.198);ballGroup.add(ballDot);
ballGroup.position.set(0,terrainH(0,0)+.23,0);

const golfer=new LoftGolfer(THREE,C,LEVELS);
golfer.group.position.set(0,terrainH(0,0),0);
golfer.setClub(CLUBS[state.clubId]);
golfer.setLevel(state.level);
scene.add(golfer.group);

const lineMaterial=new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.32,depthWrite:false});
let lineMesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,1,-1)),8,.032,6,false),lineMaterial);
world.add(lineMesh);
const landingHalo=new THREE.Group();world.add(landingHalo);
const haloRing=new THREE.Mesh(new THREE.TorusGeometry(1.18,.055,8,56),new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.80}));haloRing.rotation.x=Math.PI/2;landingHalo.add(haloRing);
const haloDot=new THREE.Mesh(new THREE.SphereGeometry(.125,18,12),new THREE.MeshBasicMaterial({color:C.orange}));haloDot.position.set(-.80,.12,.80);landingHalo.add(haloDot);
const haloCore=new THREE.Mesh(new THREE.RingGeometry(.18,.27,32),new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.60,side:THREE.DoubleSide}));haloCore.rotation.x=-Math.PI/2;haloCore.position.y=.025;landingHalo.add(haloCore);

function selectedClub(){return CLUBS[state.clubId];}
function selectedBall(){return BALLS[state.ballId];}

function updateLine(){
  const club=selectedClub();
  const start=new THREE.Vector3(0,terrainH(0,0)+.34,0);
  const end=state.target.clone();end.y=terrainH(end.x,end.z)+.10;
  const mid=start.clone().lerp(end,.52);
  const distance=start.distanceTo(end);
  const apex=Math.max(3.5,club.launch*.62+distance*.035);
  mid.y+=apex;
  mid.x+=windVec.x*club.windFactor*selectedBall().wind*.62;
  const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
  const next=new THREE.TubeGeometry(curve,56,.034,6,false);
  lineMesh.geometry.dispose();lineMesh.geometry=next;
  landingHalo.position.copy(end);
  golfer.group.rotation.y=Math.atan2(end.x,-end.z);
}
updateLine();

function clampTargetToClub(){
  const club=selectedClub();
  const angle=Math.atan2(state.target.x,-state.target.z);
  const current=Math.hypot(state.target.x,state.target.z);
  const min=Math.max(5,club.carry*YARD*.28);
  const max=club.carry*YARD*1.10;
  const d=clamp(current,min,max);
  state.target.set(Math.sin(angle)*d,terrainH(Math.sin(angle)*d,-Math.cos(angle)*d)+.1,-Math.cos(angle)*d);
  updateLine();
}

function buildBagUI(){
  const clubGrid=$('club-grid');clubGrid.innerHTML='';
  Object.values(CLUBS).forEach(club=>{
    const b=document.createElement('button');
    b.type='button';b.className='club-card';b.dataset.club=club.id;
    b.innerHTML='<div class="club-top"><span class="club-name">'+club.label+'</span><span class="grade">'+club.grade+'</span></div><div class="club-carry">'+club.carry+' <span style="font-size:11px;font-weight:650;letter-spacing:.08em">YD</span></div><div class="club-meta">CARRY · '+club.feel+'</div><span class="club-mark"></span>';
    b.addEventListener('click',()=>selectClub(club.id,true));
    clubGrid.appendChild(b);
  });
  const ballGrid=$('ball-grid');ballGrid.innerHTML='';
  Object.values(BALLS).forEach(ball=>{
    const b=document.createElement('button');b.type='button';b.className='ball-card';b.dataset.ball=ball.id;
    b.innerHTML='<div class="mini-ball"></div><b>'+ball.label+'</b><span>'+ball.role+'</span>';
    b.addEventListener('click',()=>selectBall(ball.id));
    ballGrid.appendChild(b);
  });
  syncBagUI();
}

function syncBagUI(){
  const club=selectedClub();
  $('bag-short').textContent=club.short;
  $('bag-carry').textContent=club.carry+' YD';
  $('bag-grade').textContent=club.grade+' · '+club.feel;
  rootQueryAll('.club-card').forEach(x=>x.classList.toggle('active',x.dataset.club===state.clubId));
  rootQueryAll('.ball-card').forEach(x=>x.classList.toggle('active',x.dataset.ball===state.ballId));
}
function rootQueryAll(sel){return [...document.querySelectorAll(sel)];}
function selectClub(id,closeSheet=false){
  if(!CLUBS[id])return;
  state.clubId=id;
  golfer.setClub(selectedClub());
  clampTargetToClub();
  syncBagUI();
  showContext(selectedClub().short+' · '+selectedClub().carry+' YD');
  if(closeSheet)setTimeout(closeBag,120);
}
function selectBall(id){
  if(!BALLS[id])return;
  state.ballId=id;syncBagUI();
  const profile=selectedBall();
  ballMat.roughness=id==='tour03'?.62:id==='forged02'?.80:.73;
  ballMat.needsUpdate=true;
  showContext(profile.label+' · '+profile.role);
}
function openBag(){
  $('bag-sheet').classList.add('open');$('bag-sheet').setAttribute('aria-hidden','false');
  $('tip').style.opacity='0';
}
function closeBag(){
  $('bag-sheet').classList.remove('open');$('bag-sheet').setAttribute('aria-hidden','true');
  updateTip();
}
$('bag-chip').addEventListener('click',openBag);
$('sheet-close').addEventListener('click',closeBag);
$('bag-sheet').addEventListener('pointerdown',e=>{if(e.target===$('bag-sheet'))closeBag();});
buildBagUI();

function showContext(text,duration=520){
  $('context-text').textContent=text;$('context').classList.add('show');
  clearTimeout(showContext._timer);showContext._timer=setTimeout(()=>$('context').classList.remove('show'),duration);
}
function setTip(text){$('tip-text').textContent=text;$('tip').style.opacity='1';}
function updateTip(){
  if(state.phase==='result'){setTip('Drag around the ball to inspect the finish');return;}
  if(!state.learned.camera)setTip('Drag anywhere to orbit · pinch to zoom');
  else if(!state.learned.line)setTip('Drag the orange landing mark to shape The Line');
  else if(!state.learned.stroke)setTip('Press near the ball · pull back · drive through impact');
  else $('tip').style.opacity='0';
}

$('level-btn').addEventListener('click',()=>{$('level-menu').classList.toggle('open');});
rootQueryAll('.level').forEach(btn=>btn.addEventListener('click',()=>{
  state.level=Number(btn.dataset.level);
  golfer.setLevel(state.level);
  $('level-text').textContent='LV '+state.level+' · '+LEVELS[state.level].name;
  rootQueryAll('.level').forEach(x=>x.classList.toggle('active',x===btn));
  $('level-menu').classList.remove('open');
  showContext(LEVELS[state.level].name);
}));

function resetCamera(){
  Object.assign(state.cam,{yawTarget:.62,pitchTarget:.18,distTarget:9.6,flightYawTarget:.42,flightPitchTarget:.20,flightDistTarget:10.4});
}
$('cam-reset').addEventListener('click',resetCamera);

function updateCameraSmoothing(dt){
  const c=state.cam;
  c.yaw=smoothTo(c.yaw,c.yawTarget,11,dt);
  c.pitch=smoothTo(c.pitch,c.pitchTarget,11,dt);
  c.dist=smoothTo(c.dist,c.distTarget,12,dt);
  c.flightYaw=smoothTo(c.flightYaw,c.flightYawTarget,10,dt);
  c.flightPitch=smoothTo(c.flightPitch,c.flightPitchTarget,10,dt);
  c.flightDist=smoothTo(c.flightDist,c.flightDistTarget,11,dt);
}
function readyCamera(dt){
  updateCameraSmoothing(dt);
  const base=Math.atan2(state.target.x,-state.target.z);
  const yaw=base+state.cam.yaw;
  const desired=new THREE.Vector3(Math.sin(yaw)*state.cam.dist,2.95+state.cam.pitch*5.5,Math.cos(yaw)*state.cam.dist);
  const forward=new THREE.Vector3(Math.sin(base)*-7,0,Math.cos(base)*7);
  const target=new THREE.Vector3(0,.92,0).add(forward);
  camera.position.lerp(desired,1-Math.exp(-8*dt));
  camTarget.lerp(target,1-Math.exp(-9*dt));
}
function flightCamera(dt){
  updateCameraSmoothing(dt);
  const horizontal=state.vel.clone();horizontal.y=0;
  const base=horizontal.lengthSq()>.02?Math.atan2(horizontal.x,-horizontal.z):Math.atan2(state.target.x,-state.target.z);
  const yaw=base+state.cam.flightYaw;
  const desired=ballGroup.position.clone().add(new THREE.Vector3(Math.sin(yaw)*state.cam.flightDist,3.3+state.cam.flightPitch*6.2+Math.min(2.8,ballGroup.position.y*.11),Math.cos(yaw)*state.cam.flightDist));
  camera.position.lerp(desired,1-Math.exp(-7.5*dt));
  camTarget.lerp(ballGroup.position,1-Math.exp(-10*dt));
}
function resultCamera(dt){
  updateCameraSmoothing(dt);
  const base=Math.atan2(state.target.x,-state.target.z),yaw=base+state.cam.flightYaw;
  const desired=ballGroup.position.clone().add(new THREE.Vector3(Math.sin(yaw)*8.4,3.4+state.cam.flightPitch*5.4,Math.cos(yaw)*8.4));
  camera.position.lerp(desired,1-Math.exp(-5.5*dt));
  const focus=ballGroup.position.clone().lerp(pin.clone().setY(pin.y+.2),.20);
  camTarget.lerp(focus,1-Math.exp(-6.5*dt));
}

const raycaster=new THREE.Raycaster();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function rayGround(cx,cy){
  const r=canvas.getBoundingClientRect();
  const ndc=new THREE.Vector2(((cx-r.left)/r.width)*2-1,-(((cy-r.top)/r.height)*2-1));
  raycaster.setFromCamera(ndc,camera);
  const p=new THREE.Vector3();return raycaster.ray.intersectPlane(groundPlane,p)?p:null;
}
function screenOf(v){
  const r=canvas.getBoundingClientRect(),p=v.clone().project(camera);
  return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};
}
function setTargetFromGround(p){
  if(!p)return;
  const club=selectedClub();
  const angle=Math.atan2(p.x,-p.z);
  const dist=clamp(Math.hypot(p.x,p.z),Math.max(5,club.carry*YARD*.28),club.carry*YARD*1.10);
  state.target.set(Math.sin(angle)*dist,terrainH(Math.sin(angle)*dist,-Math.cos(angle)*dist)+.1,-Math.cos(angle)*dist);
  state.learned.line=true;updateLine();showContext('THE LINE',360);updateTip();
}

const bunkerDefs=[[-14,pin.z+8,8.7,4.8],[17,pin.z-3,7.8,4.2],[12,-94,6,3.2]];
function surfaceAt(x,z){
  const gx=(x-pin.x)/(18*1.34),gz=(z-pin.z)/18;
  if(gx*gx+gz*gz<=1)return'green';
  for(const [bx,bz,sx,sz] of bunkerDefs){const dx=(x-bx)/sx,dz=(z-bz)/sz;if(dx*dx+dz*dz<=1)return'sand';}
  if(x>38&&z<-18)return'water';
  if(Math.abs(x)<18.5&&z<2&&z>-174)return'fairway';
  return'rough';
}
function terrainGradient(x,z){const e=.35;return{dx:(terrainH(x+e,z)-terrainH(x-e,z))/(2*e),dz:(terrainH(x,z+e)-terrainH(x,z-e))/(2*e)};}

function impactSound(quality){
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const ac=new A(),n=ac.currentTime;
    const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(470+quality*430,n);o.frequency.exponentialRampToValueAtTime(155,n+.075);g.gain.setValueAtTime(.085,n);g.gain.exponentialRampToValueAtTime(.0001,n+.10);o.connect(g).connect(ac.destination);o.start(n);o.stop(n+.11);
    const thump=ac.createOscillator(),tg=ac.createGain();thump.type='sine';thump.frequency.setValueAtTime(92,n);tg.gain.setValueAtTime(.045,n);tg.gain.exponentialRampToValueAtTime(.0001,n+.13);thump.connect(tg).connect(ac.destination);thump.start(n);thump.stop(n+.14);
    setTimeout(()=>ac.close(),220);
  }catch{}
}

function classifyStrike(quality,path){
  if(Math.abs(path)>5.2)return path>0?'PUSH':'PULL';
  if(quality>.965)return'PURE';
  if(quality>.90)return'FLUSH';
  if(quality>.80)return'SOLID';
  if(quality>.69)return'PLAYABLE';
  return'HEAVY';
}

function launchShot({power,tempo,path,speedScore}){
  if(state.phase!=='ready')return;
  const club=selectedClub(),ball=selectedBall(),level=LEVELS[state.level];
  const formPenalty=(1-level.form)*.035;
  const tempoScore=1-Math.min(1,Math.abs(tempo-94)/50);
  const pathNoise=(1-level.form)*Math.sin(performance.now()*.011)*1.15;
  const finalPath=clamp(path+pathNoise,-9,9);
  const quality=clamp(.71+.18*tempoScore+.11*speedScore-.016*Math.abs(finalPath)-formPenalty,.54,1.01);
  const strikeLabel=classifyStrike(quality,finalPath);

  if(club.head==='putter'){
    const yaw=Math.atan2(state.target.x,-state.target.z)+deg(finalPath*.28);
    const speed=club.ballSpeed*clamp(power,.35,1.08)*ball.speed;
    state.vel.set(Math.sin(yaw)*speed,0,-Math.cos(yaw)*speed);
    state.spinOmega=0;state.spinAxis.set(0,0,0);
    state.phase='roll';
  }else{
    const yaw=Math.atan2(state.target.x,-state.target.z)+deg(finalPath*.42);
    const launch=deg(club.launch+lerp(-1.2,1.0,quality));
    const speed=club.ballSpeed*clamp(power,.46,1.08)*ball.speed*(.92+.08*quality);
    state.vel.set(Math.sin(yaw)*Math.cos(launch)*speed,Math.sin(launch)*speed,-Math.cos(yaw)*Math.cos(launch)*speed);

    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize();
    const spinRpm=club.spin*ball.spin*(.94+.08*quality);
    state.spinOmega=spinRpm*Math.PI*2/60;
    const axisTilt=deg(clamp(finalPath*1.45,-14,14));
    state.spinAxis.copy(right.multiplyScalar(Math.cos(axisTilt))).add(new THREE.Vector3(0,Math.sin(axisTilt),0)).normalize();
    state.phase='flight';
  }

  state.shot={club:club.id,ball:ball.id,power,tempo,path:finalPath,quality,label:strikeLabel,carryStart:ballGroup.position.clone()};
  state.shots++;
  state.learned.stroke=true;
  state.swingPhase=.60;
  lineMesh.visible=false;landingHalo.visible=false;
  $('tip').style.opacity='0';
  showContext(strikeLabel,650);
  impactSound(quality);
}

function finishShot(){
  if(!state.shot)return;
  state.phase='result';
  const feet=Math.hypot(ballGroup.position.x-pin.x,ballGroup.position.z-pin.z)*3.28084;
  const surface=surfaceAt(ballGroup.position.x,ballGroup.position.z);
  $('result-kicker').textContent=state.shot.label+' · '+selectedClub().short;
  if(surface==='water'){
    $('result-head').textContent='WATER';$('result-sub').textContent='Missed The Line · coastal shelf';
  }else if(feet<2.5){
    $('result-head').textContent='TAP-IN';$('result-sub').textContent='Inside 3 ft · '+surface;
  }else if(feet<45){
    $('result-head').textContent=Math.max(1,Math.round(feet))+' FT';
    $('result-sub').textContent=(feet<12?'DIALED':'ON '+surface.toUpperCase())+' · '+(ballGroup.position.z<pin.z?'LONG':'SHORT');
  }else{
    $('result-head').textContent=Math.round(feet/3)+' YDS';$('result-sub').textContent='FROM PIN · '+surface.toUpperCase();
  }
  $('result').classList.add('show');
  updateTip();
}

function resetShot(){
  state.phase='ready';state.vel.set(0,0,0);state.spinOmega=0;state.shot=null;state.swingPhase=0;
  ballGroup.position.set(0,terrainH(0,0)+.23,0);ballGroup.rotation.set(0,0,0);
  lineMesh.visible=true;landingHalo.visible=true;
  golfer.group.position.set(0,terrainH(0,0),0);golfer.setPhase(0);
  $('result').classList.remove('show');
  resetCamera();updateLine();updateTip();
}
$('again').addEventListener('click',resetShot);

const pointers=new Map();
let gesture=null;

canvas.addEventListener('pointerdown',e=>{
  if($('bag-sheet').classList.contains('open'))return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY});

  if(pointers.size===2){
    const a=[...pointers.values()];
    gesture={type:'pinch',lastDist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),lastMid:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}};
    $('tip').style.opacity='0';
    return;
  }

  const p={x:e.clientX,y:e.clientY};
  const ballScreen=screenOf(ballGroup.position.clone().add(new THREE.Vector3(0,.10,0)));
  const haloScreen=screenOf(landingHalo.position.clone().add(new THREE.Vector3(0,.10,0)));
  const db=Math.hypot(p.x-ballScreen.x,p.y-ballScreen.y);
  const dh=Math.hypot(p.x-haloScreen.x,p.y-haloScreen.y);
  let type='orbit';
  if(state.phase==='ready'&&dh<88)type='line';
  else if(state.phase==='ready'&&db<112)type='swing';

  gesture={type,id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,startT:performance.now(),lastT:performance.now(),deep:e.clientY,deepT:performance.now(),load:0,moved:false,impact:false};
  if(type==='line'){showContext('THE LINE',9999);$('tip').style.opacity='0';}
  if(type==='swing'){showContext('LOAD',9999);$('swing-meter').classList.add('show');$('tip').style.opacity='0';golfer.setPhase(0);}
});

canvas.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId);if(!p)return;e.preventDefault();
  p.px=p.x;p.py=p.y;p.x=e.clientX;p.y=e.clientY;

  if(pointers.size>=2){
    const a=[...pointers.values()].slice(0,2);
    const dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    const mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
    if(gesture?.type!=='pinch')gesture={type:'pinch',lastDist:dist,lastMid:mid};
    const dd=dist-gesture.lastDist,dx=mid.x-gesture.lastMid.x,dy=mid.y-gesture.lastMid.y;
    if(state.phase==='ready'){
      state.cam.distTarget=clamp(state.cam.distTarget*Math.exp(-dd*.0022),6.4,14.8);
      state.cam.yawTarget-=dx*.0042;state.cam.pitchTarget=clamp(state.cam.pitchTarget+dy*.0028,-.08,.54);
    }else{
      state.cam.flightDistTarget=clamp(state.cam.flightDistTarget*Math.exp(-dd*.0022),6.2,16.5);
      state.cam.flightYawTarget-=dx*.0042;state.cam.flightPitchTarget=clamp(state.cam.flightPitchTarget+dy*.0028,-.08,.58);
    }
    state.learned.camera=true;gesture.lastDist=dist;gesture.lastMid=mid;updateTip();return;
  }

  if(!gesture||gesture.id!==e.pointerId)return;
  const dx=e.clientX-gesture.lx,dy=e.clientY-gesture.ly,total=Math.hypot(e.clientX-gesture.sx,e.clientY-gesture.sy);
  if(total>5)gesture.moved=true;

  if(gesture.type==='orbit'){
    if(state.phase==='ready'){
      state.cam.yawTarget-=dx*.0048;
      state.cam.pitchTarget=clamp(state.cam.pitchTarget+dy*.0027,-.08,.54);
    }else{
      state.cam.flightYawTarget-=dx*.0048;
      state.cam.flightPitchTarget=clamp(state.cam.flightPitchTarget+dy*.0027,-.08,.58);
    }
    state.learned.camera=true;updateTip();
  }

  if(gesture.type==='line'){
    const g=rayGround(e.clientX,e.clientY);if(g&&g.z<-5)setTargetFromGround(g);
  }

  if(gesture.type==='swing'&&!gesture.impact){
    const now=performance.now();
    if(e.clientY>gesture.deep){gesture.deep=e.clientY;gesture.deepT=now;}
    const r=canvas.getBoundingClientRect();
    const load=clamp((gesture.deep-gesture.sy)/(r.height*.265),0,1.08);
    gesture.load=Math.max(gesture.load,load);
    $('swing-fill').style.height=(clamp(load,0,1)*100)+'%';
    const reversal=e.clientY<gesture.deep-10;

    if(!reversal){
      golfer.setPhase(clamp(load,0,1)*.38);
      showContext(load>.76?'TURN':'LOAD',9999);
    }else{
      const through=clamp((gesture.deep-e.clientY)/(r.height*.255),0,1.18);
      const phase=.38+through*.22;
      golfer.setPhase(phase);
      showContext('STRIKE',9999);

      if(e.clientY<gesture.sy-16&&gesture.load>.35){
        const frameDt=Math.max(8,now-gesture.lastT);
        const pixelSpeed=Math.hypot(e.clientX-gesture.lx,e.clientY-gesture.ly)/frameDt;
        const transition=Math.max(70,now-gesture.deepT);
        const level=LEVELS[state.level];
        const tempoJitter=Math.sin(now*.015)*level.tempoJitter*10;
        const tempo=clamp(100-Math.abs(238-transition)*.18+tempoJitter,42,100);
        const path=clamp((e.clientX-gesture.sx)/(r.width*.058),-8,8);
        const speedScore=clamp(pixelSpeed/1.10,.64,1.13);
        const power=clamp(gesture.load*.78+speedScore*.22,.45,1.08);
        gesture.impact=true;
        $('swing-meter').classList.remove('show');$('swing-fill').style.height='0';
        launchShot({power,tempo,path,speedScore});
      }
    }
  }

  gesture.lx=e.clientX;gesture.ly=e.clientY;gesture.lastT=performance.now();
});

function endPointer(e){
  pointers.delete(e.pointerId);
  if(pointers.size>0){if(pointers.size===1)gesture=null;return;}
  if(gesture&&gesture.id===e.pointerId){
    if(gesture.type==='orbit'&&!gesture.moved&&state.phase==='ready'){
      const g=rayGround(e.clientX,e.clientY);if(g&&g.z<-5)setTargetFromGround(g);
    }
    if(gesture.type==='line'){$('context').classList.remove('show');updateTip();}
    if(gesture.type==='swing'&&!gesture.impact){
      golfer.setPhase(0);$('context').classList.remove('show');$('swing-meter').classList.remove('show');$('swing-fill').style.height='0';
      setTip('Pull farther back · then accelerate through the ball');
    }
  }
  gesture=null;
}
canvas.addEventListener('pointerup',endPointer);
canvas.addEventListener('pointercancel',endPointer);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  if(state.phase==='ready')state.cam.distTarget=clamp(state.cam.distTarget*Math.exp(Math.sign(e.deltaY)*.06),6.4,14.8);
  else state.cam.flightDistTarget=clamp(state.cam.flightDistTarget*Math.exp(Math.sign(e.deltaY)*.06),6.2,16.5);
},{passive:false});

function resize(){
  const r=$('stage').getBoundingClientRect();
  const w=Math.max(320,r.width),hgt=Math.max(480,r.height);
  renderer.setSize(w,hgt,false);camera.aspect=w/hgt;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($('stage'));resize();

let last=performance.now();
function frame(now){
  const dt=Math.min(.026,(now-last)/1000||.016);last=now;

  if(state.phase==='ready'){
    readyCamera(dt);
  }else if(state.phase==='flight'){
    const level=LEVELS[state.level];
    const finishDuration=lerp(.92,.54,level.form);
    state.swingPhase=clamp(state.swingPhase+dt/finishDuration*.40,.60,1);
    golfer.setPhase(state.swingPhase);

    const rel=state.vel.clone().sub(windVec.clone().multiplyScalar(selectedClub().windFactor*selectedBall().wind));
    const speed=rel.length();
    const drag=rel.clone().multiplyScalar(-.0022*speed);
    const magnus=new THREE.Vector3().crossVectors(state.spinAxis.clone().multiplyScalar(state.spinOmega),rel).multiplyScalar(.00012);
    const acc=new THREE.Vector3(0,-9.81,0).add(drag).add(magnus);
    state.vel.addScaledVector(acc,dt);
    state.spinOmega*=Math.pow(.9994,dt*60);
    ballGroup.position.addScaledVector(state.vel,dt);
    ballGroup.rotation.x+=state.vel.z*dt*.045;ballGroup.rotation.z-=state.vel.x*dt*.045;

    const sf=surfaceAt(ballGroup.position.x,ballGroup.position.z);
    const ground=sf==='water'?-.16:terrainH(ballGroup.position.x,ballGroup.position.z)+.23;
    if(ballGroup.position.y<=ground&&state.vel.y<0){
      ballGroup.position.y=ground;
      if(sf==='water'){
        state.vel.set(0,0,0);setTimeout(finishShot,180);state.phase='resultPending';
      }else if(Math.abs(state.vel.y)>1.8){
        const restitution=sf==='green'?.18:sf==='fairway'?.23:sf==='rough'?.11:sf==='sand'?.05:.12;
        state.vel.y=-state.vel.y*restitution;
        const horizontalLoss=sf==='sand'?.48:sf==='rough'?.68:.82;
        state.vel.x*=horizontalLoss;state.vel.z*=horizontalLoss;
      }else{
        state.vel.y=0;state.phase='roll';
      }
    }
    flightCamera(dt);
  }else if(state.phase==='roll'){
    state.swingPhase=clamp(state.swingPhase+dt*.65,.60,1);golfer.setPhase(state.swingPhase);
    const sf=surfaceAt(ballGroup.position.x,ballGroup.position.z);
    const grad=terrainGradient(ballGroup.position.x,ballGroup.position.z);
    const slopeFactor=sf==='green'?.42:sf==='fairway'?.24:.12;
    state.vel.x+=-grad.dx*9.81*dt*slopeFactor;state.vel.z+=-grad.dz*9.81*dt*slopeFactor;state.vel.y=0;
    const decay=sf==='green'?.988:sf==='fairway'?.974:sf==='rough'?.915:sf==='sand'?.80:.90;
    state.vel.multiplyScalar(Math.pow(decay,dt*60));
    ballGroup.position.addScaledVector(state.vel,dt);
    ballGroup.position.y=terrainH(ballGroup.position.x,ballGroup.position.z)+.23;
    ballGroup.rotation.x+=state.vel.z*dt*.04;ballGroup.rotation.z-=state.vel.x*dt*.04;
    flightCamera(dt);
    if(state.vel.length()<.24)finishShot();
  }else if(state.phase==='result'||state.phase==='resultPending'){
    resultCamera(dt);
  }

  if(state.phase==='ready'){
    haloRing.scale.setScalar(.96+Math.sin(now*.0038)*.04);
  }

  camera.lookAt(camTarget);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}

resetShot();
setTimeout(()=>{
  $('boot').style.opacity='0';
  setTimeout(()=>$('boot')?.remove(),380);
},160);
requestAnimationFrame(frame);