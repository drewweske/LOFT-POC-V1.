import * as THREE from '../vendor/three.module.js';
import {CLUBS,LEVELS,DEFAULT_CLUB} from './equipment.js';
import {COLORS,terrainHeight,buildWorld} from './world.js';
import {LoftGolferRig} from './characterRig.js';
import {GolfPhysics} from './physics.js';
import {LoftCamera} from './camera.js';
import {LoftTopoMap} from './topoMap.js';
import {LoftFeedback} from './feedback.js';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const YARD=.9144;
const PIN_YARDS=171;
const pin=new THREE.Vector3(2.5,terrainHeight(2.5,-PIN_YARDS*YARD),-PIN_YARDS*YARD);
const wind=new THREE.Vector3(3.13,0,0);
const TEE=new THREE.Vector3(.46,terrainHeight(.46,0)+.085,0);
const COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));

window.addEventListener('error',e=>{
  $('fatal').classList.add('show');
  $('fatal-text').textContent=e.message||'Unknown runtime error';
});

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;
renderer.setClearColor(COLORS.sky);
$('stage').appendChild(renderer.domElement);
const canvas=renderer.domElement;
canvas.tabIndex=0;

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(COLORS.sky,108,315);
const camera=new THREE.PerspectiveCamera(43,1,.1,750);
scene.add(new THREE.HemisphereLight(0xf8f1e5,0x304438,2.25));
const sun=new THREE.DirectionalLight(0xffefd4,3.05);
sun.position.set(-56,82,38);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=105;sun.shadow.camera.bottom=-235;
scene.add(sun);

buildWorld(scene,pin);

const state={
  phase:'ready',
  clubId:DEFAULT_CLUB,
  level:1,
  aimYaw:COURSE_YAW,
  aimYawTarget:COURSE_YAW,
  targetDistance:160*YARD,
  target:new THREE.Vector3(),
  shot:null,
  swingPhase:0,
  learned:{camera:false,line:false,stroke:false},
  interaction:null,
  shotCount:0,
  landingFX:false,
  ballCompression:0
};

function club(){return CLUBS.find(c=>c.id===state.clubId);}
function aimYaw(){return state.aimYaw;}

function syncTargetFromAim(){
  const x=TEE.x+Math.sin(state.aimYaw)*state.targetDistance;
  const z=TEE.z-Math.cos(state.aimYaw)*state.targetDistance;
  state.target.set(x,terrainHeight(x,z)+.08,z);
}
function defaultTarget(resetAim=true){
  const c=club();
  if(resetAim){state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;}
  state.targetDistance=Math.min(c.carry*YARD,Math.hypot(pin.x-TEE.x,pin.z-TEE.z));
  syncTargetFromAim();
}
defaultTarget();

function makeBallBump(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle='#bcbcbc';x.fillRect(0,0,256,256);
  for(let y=13;y<256;y+=27)for(let xx=13+(y%54?13:0);xx<256;xx+=27){x.fillStyle='#5a5a5a';x.beginPath();x.arc(xx,y,7,0,Math.PI*2);x.fill();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1);return t;
}

const creamMat=new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.73,bumpMap:makeBallBump(),bumpScale:-.032});
const ballGroup=new THREE.Group();scene.add(ballGroup);
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(.085,42,30),creamMat);ballMesh.castShadow=true;ballGroup.add(ballMesh);
const ballSignal=new THREE.Mesh(new THREE.SphereGeometry(.014,14,10),new THREE.MeshStandardMaterial({color:COLORS.orange,roughness:.65}));
ballSignal.position.set(-.043,-.025,.068);ballGroup.add(ballSignal);
ballGroup.position.copy(TEE);

const golfer=new LoftGolferRig(COLORS);
golfer.group.position.set(0,terrainHeight(0,0),0);
golfer.setClub(club().head);golfer.setPose(0,LEVELS[state.level]);scene.add(golfer.group);

const LINE_STEPS=56;
const linePositions=new Float32Array((LINE_STEPS+1)*3);
const lineGeometry=new THREE.BufferGeometry();
lineGeometry.setAttribute('position',new THREE.BufferAttribute(linePositions,3));
const lineMat=new THREE.LineBasicMaterial({color:COLORS.cream,transparent:true,opacity:.38,depthWrite:false});
const lineMesh=new THREE.Line(lineGeometry,lineMat);lineMesh.frustumCulled=false;scene.add(lineMesh);
const halo=new THREE.Group();scene.add(halo);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.038,8,52),new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.82}));
ring.rotation.x=Math.PI/2;halo.add(ring);
const haloDot=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),new THREE.MeshBasicMaterial({color:COLORS.orange}));haloDot.position.set(-.55,.09,.55);halo.add(haloDot);
const core=new THREE.Mesh(new THREE.RingGeometry(.13,.20,32),new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.58,side:THREE.DoubleSide}));
core.rotation.x=-Math.PI/2;core.position.y=.018;halo.add(core);

function updateLine(){
  const start=ballGroup.position.clone();
  const end=state.target.clone();end.y=terrainHeight(end.x,end.z)+.06;
  const c=club();
  const mid=start.clone().lerp(end,.52);
  mid.y+=Math.max(4.2,c.launch*.54+start.distanceTo(end)*.032);
  mid.x+=wind.x*.40;
  // Update a stable line buffer in place. Camera-driven aiming can update every
  // pointer frame without allocating/discarding geometry.
  for(let i=0;i<=LINE_STEPS;i++){
    const t=i/LINE_STEPS,om=1-t;
    const x=om*om*start.x+2*om*t*mid.x+t*t*end.x;
    const y=om*om*start.y+2*om*t*mid.y+t*t*end.y;
    const z=om*om*start.z+2*om*t*mid.z+t*t*end.z;
    const j=i*3;linePositions[j]=x;linePositions[j+1]=y;linePositions[j+2]=z;
  }
  lineGeometry.attributes.position.needsUpdate=true;
  halo.position.copy(end);

  // Camera-driven aiming rotates the entire address relationship around the ball.
  // Keep the model's local address ball (.46m right of stance) pinned to the
  // actual world ball while the golfer rotates with the chosen shot direction.
  const yaw=aimYaw();

  // The rig's authored local target direction is -Z. Three.js +Y rotation maps
  // local -Z toward -X for positive angles, while our gameplay heading uses
  // +X for positive yaw. Therefore the golfer MUST rotate by -yaw. Using +yaw
  // was the source of the strange front-on / mirrored address angles seen on iPhone.
  const rigYaw=-yaw;
  const localAddressBall=new THREE.Vector3(.46,.085,0).applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw);
  golfer.group.position.copy(ballGroup.position).sub(localAddressBall);
  golfer.group.rotation.y=rigYaw;
}
updateLine();

const bunkerDefs=[[-14,pin.z+8,8.8,4.9],[17,pin.z-3,7.8,4.2],[12,-94,6,3.3]];
function surfaceAt(x,z){
  const gx=(x-pin.x)/(18*1.36),gz=(z-pin.z)/18;
  if(gx*gx+gz*gz<=1)return'green';
  for(const [bx,bz,sx,sz] of bunkerDefs){const dx=(x-bx)/sx,dz=(z-bz)/sz;if(dx*dx+dz*dz<=1)return'sand';}
  if(x>38&&z<-18)return'water';
  if(Math.abs(x)<18.5&&z<2&&z>-176)return'fairway';
  return'rough';
}

const physics=new GolfPhysics({terrainHeight,surfaceAt,wind});
const cam=new LoftCamera(camera,{terrainHeight});
const topo=new LoftTopoMap($('course-map'));
const feedback=new LoftFeedback(scene,COLORS);

const raycaster=new THREE.Raycaster();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function rayGround(cx,cy){
  const r=canvas.getBoundingClientRect(),ndc=new THREE.Vector2(((cx-r.left)/r.width)*2-1,-(((cy-r.top)/r.height)*2-1));
  raycaster.setFromCamera(ndc,camera);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(groundPlane,p)?p:null;
}
function screenOf(v){
  const r=canvas.getBoundingClientRect(),p=v.clone().project(camera);
  return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};
}

function showContext(text,duration=520){
  $('context-text').textContent=text;$('context').classList.add('show');
  clearTimeout(showContext.timer);showContext.timer=setTimeout(()=>$('context').classList.remove('show'),duration);
}
function setTip(text){$('tip-text').textContent=text;$('tip').style.opacity='1';}
function updateTip(){
  if(state.phase==='result'){$('tip').style.opacity='0';return;}
  if(!state.learned.camera)setTip('DRAG TO AIM · PINCH TO ZOOM');
  else if(!state.learned.line)setTip('LANDING MARK · SET DISTANCE');
  else if(!state.learned.stroke)setTip('PULL BACK · DRIVE THROUGH');
  else $('tip').style.opacity='0';
}

function buildBag(){
  const grid=$('club-grid');grid.innerHTML='';
  for(const c of CLUBS){
    const b=document.createElement('button');b.className='club-card';b.type='button';b.dataset.club=c.id;
    b.innerHTML='<b>'+c.name+'</b><strong>'+c.carry+'</strong><span>'+c.feel+'</span>';
    b.onclick=()=>selectClub(c.id);
    grid.appendChild(b);
  }
  syncBag();
}
function syncBag(){
  const c=club();$('club-short').textContent=c.short;$('club-carry').textContent=c.carry;
  document.querySelectorAll('.club-card').forEach(x=>x.classList.toggle('active',x.dataset.club===state.clubId));
}
function selectClub(id){
  const next=CLUBS.find(c=>c.id===id);if(!next)return;
  state.clubId=id;golfer.setClub(next.head);
  state.targetDistance=next.carry*YARD;
  syncTargetFromAim();
  updateLine();syncBag();closeBag();showContext(next.name+' · '+next.carry+' YD',650);
}
function openBag(){$('bag').classList.add('open');$('bag').setAttribute('aria-hidden','false');$('tip').style.opacity='0';}
function closeBag(){$('bag').classList.remove('open');$('bag').setAttribute('aria-hidden','true');updateTip();}
$('club-chip').onclick=openBag;$('bag-close').onclick=closeBag;$('bag').addEventListener('pointerdown',e=>{if(e.target===$('bag'))closeBag();});
buildBag();

$('level-chip').onclick=()=>{$('level-menu').classList.toggle('open');};
document.querySelectorAll('#level-menu button').forEach(b=>b.onclick=()=>{
  state.level=Number(b.dataset.level);$('level-chip').textContent='LV '+state.level;
  document.querySelectorAll('#level-menu button').forEach(x=>x.classList.toggle('active',x===b));
  $('level-menu').classList.remove('open');golfer.setPose(0,LEVELS[state.level]);showContext(LEVELS[state.level].name,500);
});
$('camera-reset').onclick=()=>{state.aimYawTarget=COURSE_YAW;cam.resetAim();showContext('PIN LINE',360);};

function setTarget(p){
  const c=club();
  const forward=new THREE.Vector3(Math.sin(state.aimYaw),0,-Math.cos(state.aimYaw));
  const local=new THREE.Vector3(p.x-TEE.x,0,p.z-TEE.z);
  const projected=local.dot(forward);
  const min=Math.max(5,c.carry*YARD*.30),max=c.carry*YARD*1.08;
  state.targetDistance=clamp(projected,min,max);
  syncTargetFromAim();
  state.learned.line=true;updateLine();showContext(Math.round(state.targetDistance/YARD)+' YD',300);updateTip();
}

function classify(q,path){if(Math.abs(path)>5.3)return path>0?'PUSH':'PULL';if(q>.965)return'PURE';if(q>.90)return'FLUSH';if(q>.80)return'SOLID';if(q>.69)return'PLAYABLE';return'HEAVY';}

function launchShot(metrics){
  if(state.phase!=='ready')return;
  const c=club(),L=LEVELS[state.level];

  // LOFT Stroke quality is not one hidden power number. A great strike requires
  // rhythm, centered path, decisive release and useful load.
  const pathNoise=(1-L.form)*Math.sin(performance.now()*.012)*.75;
  const finalPath=clamp(metrics.path+pathNoise,-9,9);
  const skill=
    metrics.tempoScore*.28+
    metrics.rhythm*.18+
    metrics.center*.20+
    metrics.commitment*.18+
    metrics.loadScore*.10+
    metrics.speedScore*.06;

  const q=clamp(.48+.52*skill-.010*Math.abs(finalPath)-(1-L.form)*.025,.42,1.0);
  const direction=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw()));

  if(c.head==='putter'){
    physics.putt({position:ballGroup.position,club:c,power:metrics.power,path:finalPath,aimYaw:aimYaw(),strike:q});
  }else{
    physics.launch({
      position:ballGroup.position,
      club:c,
      power:metrics.power,
      path:finalPath,
      form:L.form,
      aimYaw:aimYaw(),
      strike:q,
      release:metrics.commitment
    });
  }

  state.shot={
    quality:q,
    label:classify(q,finalPath),
    path:finalPath,
    club:c.short,
    rhythm:metrics.rhythm,
    tempo:metrics.tempoScore,
    commitment:metrics.commitment
  };
  state.phase='flight';state.swingPhase=.60;state.shotCount++;
  state.landingFX=false;
  state.ballCompression=1;

  cam.impact(.70+.30*q);
  cam.beginFlight(aimYaw());

  feedback.impact({quality:q,power:metrics.power,position:ballGroup.position,direction,club:c.head});
  feedback.startFlight(ballGroup.position);

  setTimeout(()=>document.getElementById('app')?.classList.remove('swing-focus'),420);
  state.learned.stroke=true;lineMesh.visible=false;halo.visible=false;$('tip').style.opacity='0';
  showContext(state.shot.label,q>.94?780:560);
}

function finishShot(){
  if(state.phase==='result')return;
  state.phase='result';
  cam.beginResult(ballGroup.position,pin);
  const feet=Math.hypot(ballGroup.position.x-pin.x,ballGroup.position.z-pin.z)*3.28084;
  const surface=surfaceAt(ballGroup.position.x,ballGroup.position.z);
  $('result-kicker').textContent=state.shot.label+' · '+state.shot.club;
  if(surface==='water'){$('result-head').textContent='WATER';$('result-sub').textContent='MISSED THE LINE · COASTAL SHELF';}
  else if(feet<2.5){$('result-head').textContent='TAP-IN';$('result-sub').textContent='INSIDE 3 FT · '+surface.toUpperCase();}
  else if(feet<45){$('result-head').textContent=Math.max(1,Math.round(feet))+' FT';$('result-sub').textContent=(feet<12?'DIALED':'ON '+surface.toUpperCase())+' · '+(ballGroup.position.z<pin.z?'LONG':'SHORT');}
  else{$('result-head').textContent=Math.round(feet/3)+' YDS';$('result-sub').textContent='FROM PIN · '+surface.toUpperCase();}
  $('result').classList.add('show');updateTip();
}
function resetShot(){
  state.phase='ready';state.shot=null;state.swingPhase=0;state.landingFX=false;state.ballCompression=0;physics.active=false;physics.state=null;
  ballGroup.position.copy(TEE);ballGroup.rotation.set(0,0,0);
  golfer.group.position.set(0,terrainHeight(0,0),0);golfer.setPose(0,LEVELS[state.level]);
  feedback.clear();ballGroup.scale.set(1,1,1);
  lineMesh.visible=true;halo.visible=true;$('result').classList.remove('show');document.getElementById('app')?.classList.remove('swing-focus');cam.resetAim();defaultTarget();updateLine();updateTip();
}
$('again').onclick=resetShot;

const pointers=new Map();
let gesture=null;
canvas.addEventListener('pointerdown',e=>{
  feedback.unlock();
  if($('bag').classList.contains('open'))return;
  canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY});
  if(pointers.size===2){
    const a=[...pointers.values()];gesture={type:'pinch',lastDist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),lastMid:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}};$('tip').style.opacity='0';return;
  }
  const p={x:e.clientX,y:e.clientY},bs=screenOf(ballGroup.position.clone()),hs=screenOf(halo.position.clone()),db=Math.hypot(p.x-bs.x,p.y-bs.y),dh=Math.hypot(p.x-hs.x,p.y-hs.y);
  let type='orbit';if(state.phase==='ready'&&dh<92)type='line';else if(state.phase==='ready'&&db<116)type='swing';
  const now=performance.now();
  gesture={type,id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,deep:e.clientY,deepT:now,startT:now,lastT:now,load:0,moved:false,impact:false,setCue:false,transitionCue:false,releaseCue:false,samples:[{x:e.clientX,y:e.clientY,t:now}]};
  if(type==='line'){showContext('THE LINE',9999);$('tip').style.opacity='0';}
  if(type==='swing'){state.interaction='swing';state.swingPhase=0;document.getElementById('app')?.classList.add('swing-focus');cam.beginSwing(aimYaw());$('swing-meter').classList.add('show');showContext('LOAD',9999);$('tip').style.opacity='0';}
});
canvas.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId);if(!p)return;e.preventDefault();p.px=p.x;p.py=p.y;p.x=e.clientX;p.y=e.clientY;
  if(pointers.size>=2){
    const a=[...pointers.values()].slice(0,2),dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
    if(gesture?.type!=='pinch')gesture={type:'pinch',lastDist:dist,lastMid:mid};
    const dd=dist-gesture.lastDist,dx=mid.x-gesture.lastMid.x,dy=mid.y-gesture.lastMid.y;
    if(state.phase==='ready'&&!cam.isSwingLocked){cam.aimZoom(dd);cam.aimPitchBy(dy*.45);}
    else if(state.phase==='result'){cam.resultZoom(dd);cam.resultOrbitBy(dx*.20,dy*.20);}
    state.learned.camera=true;gesture.lastDist=dist;gesture.lastMid=mid;updateTip();return;
  }
  if(!gesture||gesture.id!==e.pointerId)return;
  const nowSample=performance.now();
  if(gesture.samples){
    gesture.samples.push({x:e.clientX,y:e.clientY,t:nowSample});
    if(gesture.samples.length>48)gesture.samples.shift();
  }
  const dx=e.clientX-gesture.lx,dy=e.clientY-gesture.ly,total=Math.hypot(e.clientX-gesture.sx,e.clientY-gesture.sy);if(total>5)gesture.moved=true;
  if(gesture.type==='orbit'){
    if(state.phase==='ready'&&!cam.isSwingLocked){
      state.aimYawTarget=clamp(state.aimYawTarget-dx*.0041,COURSE_YAW-.98,COURSE_YAW+.98);
      cam.aimPitchBy(dy);
    }else if(state.phase==='result'){
      cam.resultOrbitBy(dx,dy);
    }
    state.learned.camera=true;updateTip();
  }
  if(gesture.type==='line'){const g=rayGround(e.clientX,e.clientY);if(g&&g.z<-4)setTarget(g);}
  if(gesture.type==='swing'&&!gesture.impact){
    const now=performance.now();
    if(e.clientY>gesture.deep){gesture.deep=e.clientY;gesture.deepT=now;}

    const r=canvas.getBoundingClientRect();
    const load=clamp((gesture.deep-gesture.sy)/(r.height*.265),0,1.08);
    gesture.load=Math.max(gesture.load,load);
    $('swing-fill').style.height=(clamp(load,0,1)*100)+'%';

    const reversal=e.clientY<gesture.deep-10;

    if(!reversal){
      if(load>.80&&!gesture.setCue){
        gesture.setCue=true;
        feedback.loadSet(load);
      }
      const loadPose=clamp(load,0,1);
      state.swingPhase=(loadPose*loadPose*(3-2*loadPose))*.38;
      golfer.setPose(state.swingPhase,LEVELS[state.level]);
      if(state.shotCount===0)showContext(load>.78?'SET':'LOAD',9999);
    }else{
      if(!gesture.transitionCue){
        gesture.transitionCue=true;
        feedback.transition(gesture.load);
      }

      const through=clamp((gesture.deep-e.clientY)/(r.height*.255),0,1.18);
      if(through>.43&&!gesture.releaseCue){
        gesture.releaseCue=true;
        feedback.release(clamp(through,0,1.1));
      }
      state.swingPhase=.38+through*.22;
      golfer.setPose(state.swingPhase,LEVELS[state.level]);
      if(state.shotCount===0)showContext(through>.72?'RELEASE':'STRIKE',9999);

      if(e.clientY<gesture.sy-16&&gesture.load>.35){
        const frameDt=Math.max(8,now-gesture.lastT);
        const pixelSpeed=Math.hypot(e.clientX-gesture.lx,e.clientY-gesture.ly)/frameDt;
        const backswingMs=Math.max(120,gesture.deepT-gesture.startT);
        const downswingMs=Math.max(55,now-gesture.deepT);
        const ratio=backswingMs/downswingMs;

        // Ideal LOFT rhythm is a calm load with a much faster committed release.
        // The window is learnable, but not automatic.
        const tempoScore=Math.exp(-Math.pow((ratio-2.65)/.90,2));

        const pathPx=e.clientX-gesture.sx;
        const path=clamp(pathPx/(r.width*.058),-8,8);
        const center=Math.exp(-Math.pow(path/3.4,2));

        const speedScore=clamp(pixelSpeed/1.12,.48,1.08);
        const commitment=clamp(through/.98,0,1);
        const loadScore=Math.exp(-Math.pow((gesture.load-.88)/.24,2));

        // Downswing smoothness from recent samples. Jerky reversals lose compression.
        const down=(gesture.samples||[]).filter(s=>s.t>=gesture.deepT);
        const speeds=[];
        for(let i=1;i<down.length;i++){
          const dtS=Math.max(6,down[i].t-down[i-1].t);
          speeds.push(Math.hypot(down[i].x-down[i-1].x,down[i].y-down[i-1].y)/dtS);
        }
        let rhythm=.78;
        if(speeds.length>=3){
          const mean=speeds.reduce((a,b)=>a+b,0)/speeds.length;
          const variance=speeds.reduce((a,b)=>a+(b-mean)*(b-mean),0)/speeds.length;
          const cv=Math.sqrt(variance)/Math.max(.08,mean);
          rhythm=clamp(1-cv*.48,.42,1);
        }

        const power=clamp(
          gesture.load*.66+
          speedScore*.20+
          commitment*.14,
          .40,1.08
        );

        gesture.impact=true;
        $('swing-meter').classList.remove('show');
        $('swing-fill').style.height='0';
        launchShot({power,path,speedScore,tempoScore,center,commitment,loadScore,rhythm});
      }
    }
  }
  gesture.lx=e.clientX;gesture.ly=e.clientY;gesture.lastT=performance.now();
});
function endPointer(e){
  pointers.delete(e.pointerId);if(pointers.size>0){if(pointers.size===1)gesture=null;return;}
  if(gesture&&gesture.id===e.pointerId){
    if(gesture.type==='line'){$('context').classList.remove('show');updateTip();}
    if(gesture.type==='swing'&&!gesture.impact){state.interaction=null;state.swingPhase=0;document.getElementById('app')?.classList.remove('swing-focus');cam.cancelSwing();golfer.setPose(0,LEVELS[state.level]);$('context').classList.remove('show');$('swing-meter').classList.remove('show');$('swing-fill').style.height='0';setTip('PULL FARTHER · DRIVE THROUGH');}
  }
  gesture=null;
}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);

function resize(){const r=$('stage').getBoundingClientRect();renderer.setSize(Math.max(320,r.width),Math.max(480,r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('stage'));resize();

let last=performance.now();
let lastMapUpdate=0;
function frame(now){
  const dt=Math.min(.03,(now-last)/1000||.016);last=now;

  if(state.phase==='ready'&&!cam.isSwingLocked){
    const nextYaw=state.aimYaw+(state.aimYawTarget-state.aimYaw)*(1-Math.exp(-14*dt));
    if(Math.abs(nextYaw-state.aimYaw)>.00001){
      state.aimYaw=nextYaw;
      syncTargetFromAim();
      updateLine();
    }
  }

  const yaw=aimYaw();
  if(state.phase==='ready'){
    if(cam.isSwingLocked)cam.updateSwing(dt,{ball:ballGroup.position,aimYaw:yaw,swingProgress:state.swingPhase});
    else cam.updateAim(dt,{ball:ballGroup.position,aimYaw:yaw});
  }else if(state.phase==='flight'){
    const L=LEVELS[state.level];state.swingPhase=clamp(state.swingPhase+dt*lerp(.70,1.15,L.form),.60,1);golfer.setPose(state.swingPhase,L);
    const ps=physics.step(dt);
    if(ps){
      ballGroup.position.copy(ps.pos);
      ballGroup.rotation.x+=ps.vel.z*dt*.05;ballGroup.rotation.z-=ps.vel.x*dt*.05;
      feedback.flight(ballGroup.position,state.shot?.quality||.8);
      cam.updateFlight(dt,{ball:ballGroup.position,velocity:ps.vel,pin});

      if(ps.lastImpactSurface&&!state.landingFX){
        state.landingFX=true;
        feedback.land({surface:ps.lastImpactSurface,position:ballGroup.position,quality:state.shot?.quality||.8});
      }

      if(ps.stopped)finishShot();
    }
  }else if(state.phase==='result')cam.updateResult(dt,{ball:ballGroup.position,pin});
  if(state.ballCompression>0){
    state.ballCompression=Math.max(0,state.ballCompression-dt*18);
    const k=state.ballCompression;
    ballGroup.scale.set(1+.055*k,1-.090*k,1+.055*k);
  }else if(ballGroup.scale.x!==1){
    ballGroup.scale.lerp(new THREE.Vector3(1,1,1),1-Math.exp(-18*dt));
  }

  feedback.update(dt);

  if(state.phase==='ready')ring.scale.setScalar(.96+Math.sin(now*.0038)*.04);
  if(now-lastMapUpdate>66){
    const mapSurface=state.phase==='flight'?'AIR':state.phase==='ready'?'TEE':surfaceAt(ballGroup.position.x,ballGroup.position.z);
    topo.update({ball:ballGroup.position,target:state.target,pin,surface:mapSurface});
    lastMapUpdate=now;
  }
  renderer.render(scene,camera);requestAnimationFrame(frame);
}

setTimeout(()=>{$('boot').style.opacity='0';setTimeout(()=>$('boot')?.remove(),520);$('hole-intro').style.opacity='1';setTimeout(()=>$('hole-intro').style.opacity='0',1300);},220);
updateTip();
requestAnimationFrame(frame);