import * as THREE from '../vendor/three.module.js';
import {CLUBS,LEVELS,DEFAULT_CLUB} from './equipment.js';
import {COLORS,BUNKERS,fairwayProfile,terrainHeight,buildWorld} from './world.js';
import {LoftGolferRig} from './characterRig.js';
import {GolfPhysics} from './physics.js';
import {LoftCamera} from './camera.js';
import {LoftTopoMap} from './topoMap.js';
import {LoftFeedback} from './feedback.js';
import {ROUND_HOLES,ROWAN_SCORES,holeYards,scoreName,relativeScore} from './round.js';
import {surfaceDisplay} from './surfaces.js';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const YARD=.9144;
const BALL_VISUAL_R=.034;
let holeIndex=0;
let holeDef=ROUND_HOLES[holeIndex];
let pin=new THREE.Vector3(holeDef.pin[0],terrainHeight(holeDef.pin[0],holeDef.pin[1]),holeDef.pin[1]);
let wind=new THREE.Vector3(holeDef.wind[0],0,holeDef.wind[1]);
let TEE=new THREE.Vector3(holeDef.tee[0],terrainHeight(holeDef.tee[0],holeDef.tee[1])+BALL_VISUAL_R,holeDef.tee[1]);
let COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));

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

const world=buildWorld(scene,pin);

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
  learned:{camera:false,line:false,stroke:false,putt:false},
  interaction:null,
  shotCount:0,
  holeIndex:0,
  strokes:0,
  holeScores:[],
  roundComplete:false,
  landingFX:false,
  ballCompression:0,
  hitStop:0,
  cupSink:0,
  cupSinkStartY:0,
  currentLie:'tee'
};

function club(){return CLUBS.find(c=>c.id===state.clubId);}
function isPutting(){return club()?.head==='putter';}
function isShortGame(){return club()?.head==='wedge'&&pinDistanceYards()<45;}
function aimYaw(){return state.aimYaw;}
function pinDistanceYards(){return Math.hypot(pin.x-TEE.x,pin.z-TEE.z)/YARD;}
function scoreToParText(strokes=state.strokes,par=holeDef.par){const d=strokes-par;return d===0?'E':d>0?'+'+d:String(d);}

function updateHoleHUD(){
  const nextStroke=state.strokes+1;
  $('hole-number').textContent=String(holeDef.number).padStart(2,'0')+' · STROKE '+nextStroke;
  $('hole-par').textContent='PAR '+holeDef.par;
  $('wind-value').textContent=holeDef.windLabel;
  $('intro-series').textContent=holeDef.series+' · '+String(holeDef.number).padStart(2,'0');
  $('intro-name').textContent=holeDef.name;
  $('intro-meta').textContent='PAR '+holeDef.par+' · '+holeYards(holeDef)+' YD';
  const mapHead=document.querySelector('.map-head span');
  if(mapHead)mapHead.textContent=holeDef.name+' · '+String(holeDef.number).padStart(2,'0');
  const mapFoot=document.querySelector('.map-foot span:last-child');
  if(mapFoot){
    const played=state.holeScores.length;
    const total=state.holeScores.reduce((a,b)=>a+(b||0),0);
    const rowan=ROWAN_SCORES.slice(0,played).reduce((a,b)=>a+b,0);
    const pars=ROUND_HOLES.slice(0,played).reduce((a,h)=>a+h.par,0);
    mapFoot.textContent='YOU '+(played?relativeScore(total,pars):'E')+' · ROWAN '+(played?relativeScore(rowan,pars):'E');
  }
}

function chooseAutoClub(){
  const lie=state.currentLie||surfaceAt(TEE.x,TEE.z);
  const y=pinDistanceYards();
  let id='driver';
  if(lie==='green'||lie==='fringe')id='putter';
  else if(y<=92)id='sw';
  else if(y<=118)id='pw';
  else if(y<=140)id='iron9';
  else if(y<=178)id='iron7';
  else if(y<=205)id='hybrid5';
  else if(y<=232)id='wood3';
  state.clubId=id;
  const c=club();golfer?.setClub?.(c.head);
  syncBag?.();
}

function showHoleIntro(){
  $('hole-intro').style.opacity='1';
  clearTimeout(showHoleIntro.timer);
  showHoleIntro.timer=setTimeout(()=>$('hole-intro').style.opacity='0',1450);
}

function syncTargetFromAim(){
  const x=TEE.x+Math.sin(state.aimYaw)*state.targetDistance;
  const z=TEE.z-Math.cos(state.aimYaw)*state.targetDistance;
  state.target.set(x,terrainHeight(x,z)+.04,z);
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

const creamMat=new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.80,bumpMap:makeBallBump(),bumpScale:-.052});
const ballGroup=new THREE.Group();scene.add(ballGroup);
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(BALL_VISUAL_R,48,36),creamMat);ballMesh.castShadow=true;ballGroup.add(ballMesh);
const ballSignal=new THREE.Mesh(new THREE.SphereGeometry(.0052,16,12),new THREE.MeshStandardMaterial({color:COLORS.orange,roughness:.82}));
ballSignal.position.set(-.0155,-.010,.029);ballGroup.add(ballSignal);
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


const puttPaceGhost=new THREE.Group();puttPaceGhost.visible=false;scene.add(puttPaceGhost);
const puttGhostBall=new THREE.Mesh(
  new THREE.SphereGeometry(BALL_VISUAL_R*.94,28,20),
  new THREE.MeshStandardMaterial({color:COLORS.cream,roughness:.86,transparent:true,opacity:.72,depthWrite:false})
);
puttPaceGhost.add(puttGhostBall);
const puttGhostSignal=new THREE.Mesh(
  new THREE.SphereGeometry(.005,14,10),
  new THREE.MeshBasicMaterial({color:COLORS.orange,transparent:true,opacity:.95,depthWrite:false})
);
puttGhostSignal.position.set(-.015,-.010,.027);puttPaceGhost.add(puttGhostSignal);
const puttPaceRing=new THREE.Mesh(
  new THREE.TorusGeometry(.095,.010,8,42),
  new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.46,depthWrite:false})
);
puttPaceRing.rotation.x=Math.PI/2;puttPaceRing.position.y=-.018;puttPaceGhost.add(puttPaceRing);

/*
  THE SIGNAL
  ----------
  LOFT never exposes a generic power bar. During every stroke a single Flag
  Orange signal travels along an authored Cream path physically attached to
  the ball. Pulling the finger back moves the signal back. Returning through
  impact brings it home. The same visual grammar works for putts, chips and
  full swings.
*/
const STROKE_TRACE_STEPS=34;
const strokeTracePositions=new Float32Array(STROKE_TRACE_STEPS*3);
const strokeTraceGeo=new THREE.BufferGeometry();
strokeTraceGeo.setAttribute('position',new THREE.BufferAttribute(strokeTracePositions,3));
const strokeTraceMat=new THREE.LineBasicMaterial({color:COLORS.cream,transparent:true,opacity:.46,depthWrite:false});
const strokeTrace=new THREE.Line(strokeTraceGeo,strokeTraceMat);strokeTrace.frustumCulled=false;strokeTrace.visible=false;scene.add(strokeTrace);
const strokeDimples=[];
const strokeDimpleMat=new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.34,depthWrite:false});
for(let i=0;i<9;i++){
  const d=new THREE.Mesh(new THREE.CircleGeometry(.026,18),strokeDimpleMat.clone());
  d.rotation.x=-Math.PI/2;d.visible=false;scene.add(d);strokeDimples.push(d);
}
const strokeSignalDot=new THREE.Mesh(
  new THREE.SphereGeometry(.036,18,12),
  new THREE.MeshBasicMaterial({color:COLORS.orange,transparent:true,opacity:.96,depthWrite:false})
);
strokeSignalDot.visible=false;scene.add(strokeSignalDot);
const strokeSetMark=new THREE.Mesh(
  new THREE.TorusGeometry(.060,.012,8,32),
  new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.70,depthWrite:false})
);
strokeSetMark.rotation.x=Math.PI/2;strokeSetMark.visible=false;scene.add(strokeSetMark);
const strokeContactGate=new THREE.Mesh(
  new THREE.RingGeometry(.075,.102,42),
  new THREE.MeshBasicMaterial({color:COLORS.cream,transparent:true,opacity:.0,side:THREE.DoubleSide,depthWrite:false})
);
strokeContactGate.rotation.x=-Math.PI/2;strokeContactGate.visible=false;scene.add(strokeContactGate);

function strokeSignalPoint(t,{putting=isPutting(),shortGame=isShortGame()}={}){
  const forward=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw())).normalize();
  const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();
  const maxBack=putting ? .82 : (shortGame ? 1.02 : 1.52);
  const side=putting ? 0 : (shortGame ? .10 : .24);
  const tt=clamp(t,0,1.08);
  const p=ballGroup.position.clone()
    .addScaledVector(forward,-maxBack*tt)
    .addScaledVector(right,side*Math.sin(tt*Math.PI*.92));
  p.y=playingHeight(p.x,p.z)+.025;
  return p;
}

function recommendedLoad(){
  const c=club();
  if(!c||c.head==='putter')return 0;
  const ratio=clamp(state.targetDistance/Math.max(1,c.carry*YARD),.04,1.06);
  // The Line chooses intent; the Cream SET mark translates that intent into
  // a readable physical backstroke without ever auto-hitting the shot.
  return isShortGame()
    ? clamp(.08+.72*ratio,.10,.74)
    : clamp(.14+.74*ratio,.18,.92);
}

function beginStrokeSignal({putting=isPutting(),shortGame=isShortGame()}={}){
  for(let i=0;i<STROKE_TRACE_STEPS;i++){
    const t=i/(STROKE_TRACE_STEPS-1);
    const p=strokeSignalPoint(t,{putting,shortGame});
    const j=i*3;strokeTracePositions[j]=p.x;strokeTracePositions[j+1]=p.y;strokeTracePositions[j+2]=p.z;
  }
  strokeTraceGeo.attributes.position.needsUpdate=true;
  strokeTraceMat.opacity=putting ? .16 : .13;
  strokeTrace.visible=true;
  strokeDimples.forEach((d,i)=>{
    const t=(i+1)/strokeDimples.length;
    d.position.copy(strokeSignalPoint(t,{putting,shortGame}));d.position.y+=.012;
    d.scale.setScalar(putting ? .72 : (shortGame ? .84 : 1));
    d.material.opacity=putting ? .36 : .30;
    d.visible=true;
  });
  strokeSignalDot.visible=true;
  strokeSignalDot.position.copy(ballGroup.position);strokeSignalDot.position.y+=.032;
  strokeSignalDot.scale.setScalar(putting ? .76 : .90);
  if(!putting){
    const setPoint=strokeSignalPoint(recommendedLoad(),{putting:false,shortGame});
    strokeSetMark.position.copy(setPoint);strokeSetMark.position.y+=.018;
    strokeSetMark.scale.setScalar(shortGame ? .84 : 1);
    strokeSetMark.material.opacity=.66;
    strokeSetMark.visible=true;
  }else strokeSetMark.visible=false;
  strokeContactGate.position.copy(ballGroup.position);strokeContactGate.position.y=playingHeight(ballGroup.position.x,ballGroup.position.z)+.018;
  strokeContactGate.visible=true;strokeContactGate.material.opacity=.26;
}

function updateStrokeSignal(t,{putting=isPutting(),shortGame=isShortGame(),returning=false}={}){
  if(!strokeTrace.visible)beginStrokeSignal({putting,shortGame});
  const p=strokeSignalPoint(t,{putting,shortGame});
  strokeSignalDot.position.copy(p);strokeSignalDot.position.y+=.018;
  const nearImpact=returning&&t<.14;
  if(!putting&&strokeSetMark.visible){
    const setDelta=Math.abs(clamp(t,0,1)-recommendedLoad());
    const onSet=setDelta<.045&&!returning;
    strokeSetMark.material.opacity=onSet ? .98 : .66;
    strokeSetMark.scale.setScalar((shortGame ? .84 : 1)*(onSet?1.20:1));
  }
  strokeContactGate.material.opacity=nearImpact ? .72 : .26;
  strokeContactGate.scale.setScalar(nearImpact?1.16:1);
  strokeSignalDot.scale.setScalar((putting ? .76 : .90)*(nearImpact?1.18:1));
}

function hideStrokeSignal(){
  strokeTrace.visible=false;strokeDimples.forEach(d=>d.visible=false);strokeSignalDot.visible=false;strokeSetMark.visible=false;strokeContactGate.visible=false;
  strokeContactGate.material.opacity=0;
}



function updateLine(){
  const start=ballGroup.position.clone();
  const end=state.target.clone();end.y=terrainHeight(end.x,end.z)+.04;
  const c=club();
  const mid=start.clone().lerp(end,.52);
  if(c.head==='putter'){
    mid.y=Math.max(start.y,end.y)+.10;
  }else{
    mid.y+=Math.max(4.2,c.launch*.54+start.distanceTo(end)*.032);
    mid.x+=wind.x*.40;
    mid.z+=wind.z*.28;
  }
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
  halo.scale.setScalar(isPutting() ? .42 : 1);

  // Camera-driven aiming rotates the entire address relationship around the ball.
  // Keep the model's local address ball (.46m right of stance) pinned to the
  // actual world ball while the golfer rotates with the chosen shot direction.
  const yaw=aimYaw();

  // The rig's authored local target direction is -Z. Three.js +Y rotation maps
  // local -Z toward -X for positive angles, while our gameplay heading uses
  // +X for positive yaw. Therefore the golfer MUST rotate by -yaw. Using +yaw
  // was the source of the strange front-on / mirrored address angles seen on iPhone.
  const rigYaw=-yaw;
  const localAddressBall=new THREE.Vector3(.46,BALL_VISUAL_R,0).applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw);
  golfer.group.position.copy(ballGroup.position).sub(localAddressBall);
  golfer.group.rotation.y=rigYaw;
}
updateLine();

function surfaceAt(x,z){
  const gx=(x-pin.x)/(18*1.36),gz=(z-pin.z)/18;
  const greenR=gx*gx+gz*gz;
  if(greenR<=1)return'green';
  if(greenR<=1.24)return'fringe';

  for(const b of BUNKERS){
    const dx=(x-b.x)/b.sx,dz=(z-b.z)/b.sz;
    if(dx*dx+dz*dz<=1)return'sand';
  }

  if(x>38&&z<-18)return'water';

  // Physics now uses the exact same authored fairway ribbon as the renderer.
  // If it looks like fairway, it IS fairway.
  const profile=fairwayProfile(z);
  if(profile.insideRange&&Math.abs(x-profile.center)<=profile.width)return'fairway';

  return'rough';
}
function playingHeight(x,z){
  if(surfaceAt(x,z)==='green'){
    // A subtle authored 0.7% / 0.35% green grade. Small enough to read as a
    // designed putting surface, large enough for real break to matter.
    return pin.y+(x-pin.x)*.007+(z-pin.z)*.0035;
  }
  return terrainHeight(x,z);
}

function cupDistanceFeet(){
  return Math.hypot(pin.x-TEE.x,pin.z-TEE.z)*3.28084;
}
function intendedPuttFeet(){
  return Math.max(.5,state.targetDistance*3.28084);
}
function puttPaceFromPull(px,height){
  const norm=clamp(px/(height*.18),0,1.08);
  const feet=.7+64*Math.pow(norm,1.55);
  return {norm,feet};
}
function updatePuttPaceGhost(feet){
  if(!isPutting()||state.phase!=='ready'){puttPaceGhost.visible=false;return false;}
  const d=Math.max(.15,feet*.3048);
  const forward=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw()));
  const x=TEE.x+forward.x*d,z=TEE.z+forward.z*d;
  puttPaceGhost.position.set(x,playingHeight(x,z)+BALL_VISUAL_R*.94,z);
  const intended=intendedPuttFeet();
  const err=Math.abs(feet-intended);
  const close=err<=Math.max(.50,intended*.05);
  puttPaceRing.material.opacity=close ? .92 : .42;
  puttPaceRing.scale.setScalar(close?1.18:1);
  puttGhostBall.material.opacity=close ? .92 : .68;
  puttGhostBall.scale.setScalar(close?1.13:1);
  puttGhostSignal.scale.setScalar(close?1.18:1);
  puttPaceGhost.visible=true;
  return close;
}
function hidePuttPace(){puttPaceGhost.visible=false;}


const physics=new GolfPhysics({terrainHeight:playingHeight,surfaceAt,wind});
physics.setCup(pin);
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
  if(isPutting()&&!state.learned.putt){setTip('PULL THE SIGNAL BACK · RETURN THROUGH BALL');return;}
  if(!state.learned.camera)setTip('DRAG TO AIM · PINCH TO ZOOM');
  else if(!state.learned.line)setTip('LANDING MARK · SET DISTANCE');
  else if(!state.learned.stroke)setTip('PULL THE SIGNAL BACK · DRIVE THROUGH');
  else $('tip').style.opacity='0';
}

function buildBag(){
  const grid=$('club-grid');grid.innerHTML='';
  for(const c of CLUBS){
    const b=document.createElement('button');b.className='club-card';b.type='button';b.dataset.club=c.id;
    const hero=c.head==='putter'?65:c.carry;
    const unit=c.head==='putter'?'FT':'YD';
    b.innerHTML='<b>'+c.name+'</b><strong data-unit="'+unit+'">'+hero+'</strong><span>'+c.feel+'</span>';
    b.onclick=()=>selectClub(c.id);
    grid.appendChild(b);
  }
  syncBag();
}
function syncBag(){
  const c=club();$('club-short').textContent=c.short;
  $('club-carry').textContent=c.head==='putter'?65:c.carry;
  $('club-carry').dataset.unit=c.head==='putter'?'FT':'YD';
  document.querySelectorAll('.club-card').forEach(x=>x.classList.toggle('active',x.dataset.club===state.clubId));
}
function selectClub(id){
  const next=CLUBS.find(c=>c.id===id);if(!next)return;
  state.clubId=id;golfer.setClub(next.head);
  state.targetDistance=Math.min(next.carry*YARD,pinDistanceYards()*YARD*1.04);
  syncTargetFromAim();
  puttPaceGhost.visible=false;
  updateLine();syncBag();closeBag();showContext(next.name+' · '+next.carry+' YD',650);updateTip();
}
function openBag(){$('bag').classList.add('open');$('bag').setAttribute('aria-hidden','false');$('tip').style.opacity='0';}
function closeBag(){$('bag').classList.remove('open');$('bag').setAttribute('aria-hidden','true');updateTip();}
$('club-chip').onclick=openBag;$('bag-close').onclick=closeBag;$('bag').addEventListener('pointerdown',e=>{if(e.target===$('bag'))closeBag();});
buildBag();
topo.setHole(TEE,pin);
updateHoleHUD();

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
  const min=c.head==='putter' ? .30 : (isShortGame() ? .45 : Math.max(2.5,c.carry*YARD*.18)),max=c.carry*YARD*1.08;
  state.targetDistance=clamp(projected,min,max);
  syncTargetFromAim();
  state.learned.line=true;updateLine();showContext(Math.round(state.targetDistance/YARD)+' YD',300);updateTip();
}

function classify(q,path){if(Math.abs(path)>5.3)return path>0?'PUSH':'PULL';if(q>.965)return'PURE';if(q>.90)return'FLUSH';if(q>.80)return'SOLID';if(q>.69)return'PLAYABLE';return'HEAVY';}
function classifyPutt(q,path,paceFeet){
  if(Math.abs(path)>4.2)return path>0?'PUSH':'PULL';
  const target=intendedPuttFeet();
  const paceErr=Math.abs((paceFeet??target)-target)/target;
  if(q>.965&&paceErr<.07)return'PURE ROLL';
  if(q>.92)return'CLEAN ROLL';
  if(q>.82)return'SOLID ROLL';
  return'TOUCH';
}

function launchShot(metrics){
  if(state.phase!=='ready')return;
  const c=club(),L=LEVELS[state.level],lie=state.currentLie||surfaceAt(TEE.x,TEE.z);

  // LOFT Stroke quality is not one hidden power number. A great strike requires
  // rhythm, centered path, decisive release and useful load.
  const pathNoise=(1-L.form)*Math.sin(performance.now()*.012)*(c.head==='putter' ? .18 : .75);
  const finalPath=clamp(metrics.path+pathNoise,-9,9);
  const skill=c.head==='putter'
    ? metrics.tempoScore*.30+metrics.rhythm*.27+metrics.center*.29+metrics.commitment*.14
    : metrics.tempoScore*.28+metrics.rhythm*.18+metrics.center*.20+metrics.commitment*.18+metrics.loadScore*.10+metrics.speedScore*.06;

  const q=c.head==='putter'
    ? clamp(.58+.42*skill-.007*Math.abs(finalPath)-(1-L.form)*.012,.52,1.0)
    : clamp(.48+.52*skill-.010*Math.abs(finalPath)-(1-L.form)*.025,.42,1.0);
  const direction=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw()));

  if(c.head==='putter'){
    physics.putt({position:ballGroup.position,club:c,power:metrics.power,paceFeet:metrics.puttPaceFeet,path:finalPath,aimYaw:aimYaw(),strike:q});
  }else{
    physics.launch({
      position:ballGroup.position,
      club:c,
      power:metrics.power,
      path:finalPath,
      form:L.form,
      aimYaw:aimYaw(),
      strike:q,
      release:metrics.commitment,
      lie
    });
  }

  state.shot={
    quality:q,
    label:c.head==='putter'?classifyPutt(q,finalPath,metrics.puttPaceFeet):classify(q,finalPath),
    path:finalPath,
    club:c.short,
    rhythm:metrics.rhythm,
    tempo:metrics.tempoScore,
    commitment:metrics.commitment,
    putting:c.head==='putter',
    paceFeet:metrics.puttPaceFeet??null
  };
  state.phase='flight';state.swingPhase=.60;state.shotCount++;state.strokes++;
  state.landingFX=false;
  state.ballCompression=1;
  state.hitStop=q>.94 ? .030 : q>.82 ? .022 : .014;

  cam.impact(.70+.30*q);
  cam.beginFlight(aimYaw());

  feedback.impact({quality:q,power:metrics.power,position:ballGroup.position,direction,club:c.head});
  if(c.head!=='putter')feedback.startFlight(ballGroup.position);
  hidePuttPace();hideStrokeSignal();

  setTimeout(()=>document.getElementById('app')?.classList.remove('swing-focus'),420);
  state.learned.stroke=true;if(c.head==='putter')state.learned.putt=true;lineMesh.visible=false;halo.visible=false;$('tip').style.opacity='0';
  showContext(state.shot.label,q>.94?780:560);
}

function prepareShotAt(position,{penalty=false,lieOverride=null}={}){
  state.phase='ready';state.shot=null;state.swingPhase=0;state.landingFX=false;state.ballCompression=0;state.hitStop=0;state.cupSink=0;
  physics.active=false;physics.state=null;
  if(penalty)state.strokes++;

  TEE.copy(position);
  TEE.y=playingHeight(TEE.x,TEE.z)+BALL_VISUAL_R;
  state.currentLie=lieOverride||surfaceAt(TEE.x,TEE.z);
  ballGroup.visible=true;ballGroup.position.copy(TEE);ballGroup.rotation.set(0,0,0);ballGroup.scale.set(1,1,1);

  COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));
  state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;

  chooseAutoClub();
  defaultTarget(false);
  golfer.setPose(0,LEVELS[state.level]);
  feedback.clear();hidePuttPace();hideStrokeSignal();

  lineMesh.visible=true;halo.visible=true;
  $('result').classList.remove('show');
  document.getElementById('app')?.classList.remove('swing-focus');
  cam.resetAim();
  updateLine();updateHoleHUD();updateTip();
}

function startHole(index,{intro=true}={}){
  holeIndex=index;state.holeIndex=index;holeDef=ROUND_HOLES[index];
  state.strokes=0;state.phase='ready';state.shot=null;state.roundComplete=false;
  state.swingPhase=0;state.landingFX=false;state.ballCompression=0;state.hitStop=0;
  physics.active=false;physics.state=null;

  pin.set(holeDef.pin[0],terrainHeight(holeDef.pin[0],holeDef.pin[1]),holeDef.pin[1]);
  wind.set(holeDef.wind[0],0,holeDef.wind[1]);
  physics.wind.copy(wind);physics.setCup(pin);
  world.setPin(pin);

  const originalTee=new THREE.Vector3(holeDef.tee[0],terrainHeight(holeDef.tee[0],holeDef.tee[1])+BALL_VISUAL_R,holeDef.tee[1]);
  topo.setHole(originalTee,pin);
  TEE.copy(originalTee);
  state.currentLie='tee';

  COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));
  state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;
  chooseAutoClub();defaultTarget(false);

  ballGroup.visible=true;ballGroup.position.copy(TEE);ballGroup.rotation.set(0,0,0);ballGroup.scale.set(1,1,1);
  golfer.setPose(0,LEVELS[state.level]);
  feedback.clear();hidePuttPace();hideStrokeSignal();lineMesh.visible=true;halo.visible=true;
  $('result').classList.remove('show');$('round-end').classList.remove('show');
  document.getElementById('app')?.classList.remove('swing-focus','hole-transition');
  cam.resetAim();updateLine();updateHoleHUD();updateTip();
  if(intro)showHoleIntro();
}

function showRoundEnd(){
  state.roundComplete=true;
  const total=state.holeScores.reduce((a,b)=>a+b,0);
  const parTotal=ROUND_HOLES.reduce((a,h)=>a+h.par,0);
  $('round-score').textContent=relativeScore(total,parTotal);
  const rowanTotal=ROWAN_SCORES.reduce((a,b)=>a+b,0);
  const match=total<rowanTotal?'WIN · '+(rowanTotal-total):total>rowanTotal?'DOWN · '+(total-rowanTotal):'TIED';
  $('round-total').textContent=total+' STROKES · PAR '+parTotal+' · '+match;
  $('scorecard').innerHTML=ROUND_HOLES.map((h,i)=>{
    const s=state.holeScores[i]??'—';
    return '<div class="score-hole"><span>'+String(h.number).padStart(2,'0')+' · PAR '+h.par+'</span><b>'+s+'</b><small>'+(typeof s==='number'?scoreName(s,h.par):h.name)+'</small></div>';
  }).join('');
  $('round-end').classList.add('show');
}

function finishShot(){
  if(state.phase==='result'||state.phase==='round-end')return;
  const holed=Boolean(physics.state?.holed);
  state.phase='result';
  cam.beginResult(ballGroup.position,pin,{cup:holed});

  const feet=Math.hypot(ballGroup.position.x-pin.x,ballGroup.position.z-pin.z)*3.28084;
  const surface=holed?'cup':surfaceAt(ballGroup.position.x,ballGroup.position.z);
  $('result-kicker').textContent=state.shot.label+' · '+state.shot.club;

  if(holed){
    state.cupSink=1;state.cupSinkStartY=ballGroup.position.y;
    state.holeScores[holeIndex]=state.strokes;
    feedback.cup?.({position:pin,score:state.strokes-holeDef.par});
    $('result-kicker').textContent='HOLE '+String(holeDef.number).padStart(2,'0')+' · '+state.strokes+' STROKE'+(state.strokes===1?'':'S');
    $('result-head').textContent=scoreName(state.strokes,holeDef.par);
    $('result-sub').textContent=scoreToParText()+' · '+holeDef.name;
    $('again').textContent=holeIndex<ROUND_HOLES.length-1?'NEXT HOLE':'FINISH ROUND';
    state.resultAction=holeIndex<ROUND_HOLES.length-1?'nextHole':'finishRound';
    showContext('IN THE HOLE',900);
    setTimeout(()=>$('result').classList.add('show'),620);
    updateHoleHUD();return;
  }

  if(surface==='water'){
    $('result-head').textContent='WATER';
    $('result-sub').textContent='STROKE + DISTANCE · +1';
    $('again').textContent='DROP +1';
    state.resultAction='waterDrop';
  }else{
    if(feet<2.5){$('result-head').textContent=Math.max(1,Math.round(feet))+' FT';$('result-sub').textContent='AT THE CUP · FINISH IT';}
    else if(feet<45){$('result-head').textContent=Math.max(1,Math.round(feet))+' FT';$('result-sub').textContent=(feet<12?'DIALED':'ON '+surfaceDisplay(surface))+' · '+(ballGroup.position.z<pin.z?'LONG':'SHORT');}
    else{$('result-head').textContent=Math.round(feet/3)+' YDS';$('result-sub').textContent='TO PIN · '+surfaceDisplay(surface);}
    $('again').textContent='NEXT SHOT';
    state.resultAction='continue';
  }
  $('result').classList.add('show');updateTip();
}

function handleResultAction(){
  $('result').classList.remove('show');
  if(state.resultAction==='continue'){
    prepareShotAt(ballGroup.position.clone());
  }else if(state.resultAction==='waterDrop'){
    prepareShotAt(TEE.clone(),{penalty:true,lieOverride:state.currentLie});
    showContext('DROP · +1',650);
  }else if(state.resultAction==='nextHole'){
    document.getElementById('app')?.classList.add('hole-transition');
    setTimeout(()=>startHole(holeIndex+1,{intro:true}),280);
  }else if(state.resultAction==='finishRound'){
    state.phase='round-end';showRoundEnd();
  }
}
$('again').onclick=handleResultAction;
$('run-it-back').onclick=()=>{
  state.holeScores=[];state.shotCount=0;state.learned={camera:true,line:true,stroke:true,putt:true};
  startHole(0,{intro:true});
};

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
  let type='orbit';
  const ballHitRadius=isPutting()?150:116;
  // Ball intent wins when the target halo overlaps a short putt. This removes
  // the maddening near-cup ambiguity where touching the ball could grab The Line.
  if(state.phase==='ready'&&db<ballHitRadius)type='swing';
  else if(state.phase==='ready'&&dh<92)type='line';
  const now=performance.now();
  gesture={type,id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,deep:e.clientY,deepT:now,startT:now,lastT:now,load:0,moved:false,impact:false,setCue:false,transitionCue:false,releaseCue:false,paceCue:false,putt:isPutting(),shortGame:isShortGame(),puttPaceFeet:0,samples:[{x:e.clientX,y:e.clientY,t:now}]};
  if(type==='line'){showContext('THE LINE',9999);$('tip').style.opacity='0';}
  if(type==='swing'){state.interaction='swing';state.swingPhase=0;document.getElementById('app')?.classList.add('swing-focus');cam.beginSwing(aimYaw());$('swing-meter').classList.add('show');beginStrokeSignal({putting:gesture.putt,shortGame:gesture.shortGame});showContext(gesture.putt?'PULL FOR DISTANCE':(gesture.shortGame?'TOUCH':'LOAD'),9999);$('tip').style.opacity='0';}
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
    const backPx=Math.max(0,gesture.deep-gesture.sy);

    if(gesture.putt){
      // PUTTING: the backstroke itself authors pace. Tiny strokes remain tiny.
      // There is deliberately no hidden minimum-power floor.
      const pace=puttPaceFromPull(backPx,r.height);
      gesture.load=Math.max(gesture.load,pace.norm);
      gesture.puttPaceFeet=Math.max(gesture.puttPaceFeet,pace.feet);
      const reversal=e.clientY<gesture.deep-4;

      if(!reversal){
        const loadPose=clamp(pace.norm/.82,0,1);
        state.swingPhase=(loadPose*loadPose*(3-2*loadPose))*.38;
        golfer.setPose(state.swingPhase,LEVELS[state.level]);
        updateStrokeSignal(clamp(pace.norm,0,1),{putting:true,returning:false});

        const close=updatePuttPaceGhost(pace.feet);
        const paceText=pace.feet<10?pace.feet.toFixed(1):String(Math.round(pace.feet));
        showContext(close?'ON PACE':paceText+' FT',9999);

        if(close&&!gesture.paceCue){
          gesture.paceCue=true;
          feedback.paceLock();
        }
      }else{
        if(!gesture.transitionCue){
          gesture.transitionCue=true;
          feedback.puttTransition(pace.norm);
        }

        const strokeSpan=Math.max(16,backPx);
        const through=clamp((gesture.deep-e.clientY)/(strokeSpan*1.08),0,1.25);
        state.swingPhase=.38+through*.22;
        golfer.setPose(state.swingPhase,LEVELS[state.level]);
        const signalT=clamp(gesture.load*(1-through),0,1);
        updateStrokeSignal(signalT,{putting:true,returning:true});

        showContext(through>.72?'CONTACT':'RETURN',9999);

        // A putt can be genuinely tiny: ~8px backstroke is enough to produce
        // a tap-in. Impact occurs as the finger returns through its start point.
        if(e.clientY<gesture.sy-3&&backPx>7){
          const pixelSpeed=Math.hypot(e.clientX-gesture.lx,e.clientY-gesture.ly)/Math.max(8,now-gesture.lastT);
          const backswingMs=Math.max(100,gesture.deepT-gesture.startT);
          const downswingMs=Math.max(55,now-gesture.deepT);
          const ratio=backswingMs/downswingMs;

          // Putting rhythm is calmer than a full swing. Around 2:1 feels
          // intentional while still allowing a broad human window.
          const tempoScore=Math.exp(-Math.pow((ratio-2.0)/.72,2));

          const pathPx=e.clientX-gesture.sx;
          const path=clamp(pathPx/(r.width*.078),-6,6);
          const center=Math.exp(-Math.pow(path/2.8,2));

          const down=(gesture.samples||[]).filter(s=>s.t>=gesture.deepT);
          const speeds=[];
          for(let i=1;i<down.length;i++){
            const dtS=Math.max(6,down[i].t-down[i-1].t);
            speeds.push(Math.hypot(down[i].x-down[i-1].x,down[i].y-down[i-1].y)/dtS);
          }
          let rhythm=.86;
          if(speeds.length>=3){
            const mean=speeds.reduce((a,b)=>a+b,0)/speeds.length;
            const variance=speeds.reduce((a,b)=>a+(b-mean)*(b-mean),0)/speeds.length;
            const cv=Math.sqrt(variance)/Math.max(.06,mean);
            rhythm=clamp(1-cv*.42,.54,1);
          }

          const commitment=clamp(through/.92,0,1);
          const speedScore=clamp(pixelSpeed/.70,.45,1.05);
          const power=clamp(gesture.puttPaceFeet/55,.025,1.0);

          gesture.impact=true;
          launchShot({
            power,
            path,
            speedScore,
            tempoScore,
            center,
            commitment,
            loadScore:1,
            rhythm,
            puttPaceFeet:gesture.puttPaceFeet
          });
        }
      }
    }else{
      // FULL SWING: power emerges from load + acceleration + commitment.
      const load=clamp(backPx/(r.height*(gesture.shortGame ? .17 : .265)),0,1.08);
      gesture.load=Math.max(gesture.load,load);
      updateStrokeSignal(load,{putting:false,shortGame:gesture.shortGame,returning:false});
      const reversal=e.clientY<gesture.deep-(gesture.shortGame?6:10);

      if(!reversal){
        const setLoad=recommendedLoad();
        if(Math.abs(load-setLoad)<.045&&!gesture.setCue){
          gesture.setCue=true;
          feedback.loadSet(load);
        }
        const loadPose=clamp(load,0,1);
        state.swingPhase=(loadPose*loadPose*(3-2*loadPose))*.38;
        golfer.setPose(state.swingPhase,LEVELS[state.level]);
        if(state.shotCount===0){
          const onSet=Math.abs(load-recommendedLoad())<.045;
          showContext(onSet?'SET':(gesture.shortGame?'TOUCH':'LOAD'),9999);
        }
      }else{
        if(!gesture.transitionCue){
          gesture.transitionCue=true;
          feedback.transition(gesture.load);
        }

        const through=clamp((gesture.deep-e.clientY)/(r.height*.255),0,1.18);
        updateStrokeSignal(clamp(gesture.load*(1-through),0,1),{putting:false,shortGame:gesture.shortGame,returning:true});
        if(through>.43&&!gesture.releaseCue){
          gesture.releaseCue=true;
          feedback.release(clamp(through,0,1.1));
        }
        state.swingPhase=.38+through*.22;
        golfer.setPose(state.swingPhase,LEVELS[state.level]);
        if(state.shotCount===0)showContext(through>.72?'RELEASE':'STRIKE',9999);

        if(e.clientY<gesture.sy-(gesture.shortGame?6:10)&&gesture.load>(gesture.shortGame ? .07 : .14)){
          const frameDt=Math.max(8,now-gesture.lastT);
          const pixelSpeed=Math.hypot(e.clientX-gesture.lx,e.clientY-gesture.ly)/frameDt;
          const backswingMs=Math.max(120,gesture.deepT-gesture.startT);
          const downswingMs=Math.max(55,now-gesture.deepT);
          const ratio=backswingMs/downswingMs;
          const tempoTarget=gesture.shortGame?2.20:2.65;
          const tempoWindow=gesture.shortGame ? .82 : .90;
          const tempoScore=Math.exp(-Math.pow((ratio-tempoTarget)/tempoWindow,2));

          const pathPx=e.clientX-gesture.sx;
          const path=clamp(pathPx/(r.width*.058),-8,8);
          const center=Math.exp(-Math.pow(path/3.4,2));

          const speedScore=clamp(pixelSpeed/1.12,.48,1.08);
          const commitment=clamp(through/.98,0,1);
          const loadScore=Math.exp(-Math.pow((gesture.load-.88)/.24,2));

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

          const power=gesture.shortGame
            ? clamp(gesture.load*.74+speedScore*.08+commitment*.18,.055,.74)
            : clamp(gesture.load*.70+speedScore*.14+commitment*.16,.12,1.08);

          gesture.impact=true;
          launchShot({power,path,speedScore,tempoScore,center,commitment,loadScore,rhythm});
        }
      }
    }
  }
  gesture.lx=e.clientX;gesture.ly=e.clientY;gesture.lastT=performance.now();
});
function endPointer(e){
  pointers.delete(e.pointerId);if(pointers.size>0){if(pointers.size===1)gesture=null;return;}
  if(gesture&&gesture.id===e.pointerId){
    if(gesture.type==='line'){$('context').classList.remove('show');updateTip();}
    if(gesture.type==='swing'&&!gesture.impact){state.interaction=null;state.swingPhase=0;document.getElementById('app')?.classList.remove('swing-focus');cam.cancelSwing();golfer.setPose(0,LEVELS[state.level]);hidePuttPace();hideStrokeSignal();$('context').classList.remove('show');$('swing-meter').classList.remove('show');$('swing-fill').style.height='0';setTip(gesture.putt?'PULL THE SIGNAL BACK · RETURN THROUGH BALL':'PULL THE SIGNAL BACK · DRIVE THROUGH');}
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
    if(cam.isSwingLocked)cam.updateSwing(dt,{ball:ballGroup.position,aimYaw:yaw,swingProgress:state.swingPhase,putting:isPutting()});
    else cam.updateAim(dt,{ball:ballGroup.position,aimYaw:yaw,putting:isPutting()});
  }else if(state.phase==='flight'){
    const L=LEVELS[state.level];
    if(state.hitStop>0){
      state.hitStop=Math.max(0,state.hitStop-dt);
      golfer.setPose(.60,L);
    }else{
      const followRate=.84+.38*(state.shot?.quality||.8)+.18*(state.shot?.commitment||.8);
      state.swingPhase=clamp(state.swingPhase+dt*followRate,.60,1);
      golfer.setPose(state.swingPhase,L);
    }
    const ps=physics.step(dt);
    if(ps){
      ballGroup.position.copy(ps.pos);
      ballGroup.rotation.x+=ps.vel.z*dt*.05;ballGroup.rotation.z-=ps.vel.x*dt*.05;
      if(!state.shot?.putting)feedback.flight(ballGroup.position,state.shot?.quality||.8);
      if(ps.surfaceChanged){
        feedback.surfaceTransition(ps.surfaceChanged.to,Math.hypot(ps.vel.x,ps.vel.z));
        ps.surfaceChanged=null;
      }
      cam.updateFlight(dt,{ball:ballGroup.position,velocity:ps.vel,pin,putting:Boolean(state.shot?.putting)});

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

  if(state.cupSink>0){
    state.cupSink=Math.max(0,state.cupSink-dt*2.35);
    const t=1-state.cupSink;
    ballGroup.position.y=lerp(state.cupSinkStartY,playingHeight(pin.x,pin.z)-.18,t*t);
    const s=lerp(1,.72,t);
    ballGroup.scale.setScalar(s);
    if(state.cupSink===0)ballGroup.visible=false;
  }

  const tendingPin=(state.phase==='ready'&&isPutting())||(state.phase==='flight'&&state.shot?.putting)||(state.phase==='result'&&state.shot?.putting);
  world.setPinFade(tendingPin ? .10 : 1);

  if(state.phase==='ready')ring.scale.setScalar(.96+Math.sin(now*.0038)*.04);
  if(now-lastMapUpdate>66){
    const mapSurface=state.phase==='flight'?(state.shot?.putting?surfaceAt(ballGroup.position.x,ballGroup.position.z):'AIR'):state.phase==='ready'?state.currentLie:surfaceAt(ballGroup.position.x,ballGroup.position.z);
    topo.update({ball:ballGroup.position,target:state.target,pin,surface:mapSurface});
    lastMapUpdate=now;
  }
  renderer.render(scene,camera);requestAnimationFrame(frame);
}

setTimeout(()=>{$('boot').style.opacity='0';setTimeout(()=>$('boot')?.remove(),520);$('hole-intro').style.opacity='1';setTimeout(()=>$('hole-intro').style.opacity='0',1300);},220);
updateTip();
requestAnimationFrame(frame);