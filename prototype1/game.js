import * as THREE from '../vendor/three.module.js';
import {CLUBS,LEVELS,DEFAULT_CLUB,equipmentTier,clubPresentationProfile} from './equipment.js';
import {COLORS,COASTAL_AIR_SPEC,COASTAL_TURF_LIGHT_SPEC,WATER_LEVEL,terrainHeight,terrainContactY,sampleTerrain,sweepTerrainSegment,courseSurfaceAt,validateTerrain,buildWorld} from './worldV2.js?v=031-final';
import {GOLFER_GROUND_CLEARANCE,LoftGolferRig} from './characterRig.js?v=038-final';
import {GolfPhysics,BALL_CONTACT_HEIGHT} from './physics.js';
import {LoftCamera} from './camera.js';
import {LoftTopoMap} from './topoMap.js';
import {LoftFeedback} from './feedback.js';
import {ROUND_HOLES,ROWAN_SCORES,holeYards,scoreName,relativeScore} from './round.js';
import {surfaceDisplay} from './surfaces.js';
import {createLoftBallVisual} from './ballVisual.js';
import {clubArtSvg} from './clubVisual.js';
import {buildTargetStewardCopy,solveTargetStewardPlacement} from './targetSteward.js?v=032-final';
import {buildRoundChronicleModel} from './roundChronicle.js?v=033-final';
import {LoftBallAtelier} from './ballAtelier.js';
import {LoftClubAtelier} from './clubAtelier.js';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const YARD=.9144;
const BALL_VISUAL_R=.026;
let holeIndex=0;
let holeDef=ROUND_HOLES[holeIndex];
let pin=new THREE.Vector3(holeDef.pin[0],playingHeight(holeDef.pin[0],holeDef.pin[1]),holeDef.pin[1]);
let wind=new THREE.Vector3(holeDef.wind[0],0,holeDef.wind[1]);
let TEE=new THREE.Vector3(holeDef.tee[0],playingContactY(holeDef.tee[0],holeDef.tee[1]),holeDef.tee[1]);
let COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));

window.addEventListener('error',e=>{
  $('fatal').classList.add('show');
  $('fatal-text').textContent=e.message||'Unknown runtime error';
});

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',stencil:true});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=COASTAL_TURF_LIGHT_SPEC.lighting.exposure;
renderer.setClearColor(COASTAL_AIR_SPEC.fog.color);
$('stage').appendChild(renderer.domElement);
const canvas=renderer.domElement;
canvas.tabIndex=0;
const ballAtelier=new LoftBallAtelier(renderer,$('ball-atelier-view'));
const clubAtelier=new LoftClubAtelier(renderer,$('bag-hero-art'));

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(COASTAL_AIR_SPEC.fog.color,COASTAL_AIR_SPEC.fog.near,COASTAL_AIR_SPEC.fog.far);
const camera=new THREE.PerspectiveCamera(43,1,.1,750);

// Coastal Ridge lighting: warm low-angle key, cool sky fill, soft bounce.
// The previous high-intensity pair flattened every surface into the same value.
const lightSpec=COASTAL_TURF_LIGHT_SPEC.lighting;
const hemi=new THREE.HemisphereLight(lightSpec.hemisphere.sky,lightSpec.hemisphere.ground,lightSpec.hemisphere.intensity);scene.add(hemi);
const sun=new THREE.DirectionalLight(lightSpec.key.color,lightSpec.key.intensity);
// Lower coastal key light reveals the exact grade instead of flattening it.
sun.position.set(...lightSpec.key.position);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.bias=-0.00024;sun.shadow.normalBias=.052;sun.shadow.radius=2;
sun.shadow.camera.left=-160;sun.shadow.camera.right=160;
sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
sun.shadow.camera.near=1;sun.shadow.camera.far=350;
sun.target.position.set(...lightSpec.key.target);
scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight(lightSpec.fill.color,lightSpec.fill.intensity);fill.position.set(...lightSpec.fill.position);scene.add(fill);
const groundBounce=new THREE.DirectionalLight(lightSpec.bounce.color,lightSpec.bounce.intensity);groundBounce.position.set(...lightSpec.bounce.position);scene.add(groundBounce);

const terrainHealth=validateTerrain();
if(!terrainHealth.ok)throw new Error('Terrain validation failed: '+terrainHealth.reason);
window.__LOFT_TERRAIN_HEALTH__=terrainHealth;
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
  cupSinkStartX:0,
  cupSinkStartZ:0,
  cupRestX:0,
  cupRestZ:0,
  cupEntryX:0,
  cupEntryZ:0,
  currentLie:'tee'
};
let bagFocusId=state.clubId;
let bagReturnFocus=null;
let chronicleReturnFocus=null;
let chronicleAvailableCache=null;
const CHRONICLE_BACKGROUND_SELECTORS=['#stage','#hole-intro','.hud','#course-map','#target-steward','#club-chip','.right-tools','#level-menu','#context','#tip','#swing-meter','#result'];
let targetStewardCopyKey='';
let targetStewardVisible=false;
let targetStewardObstacles=[];
let targetStewardViewport={left:0,top:0,width:1,height:1};
let targetStewardAppOrigin={left:0,top:0};
let targetStewardSize={width:154,height:68};

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
  const completedPar=ROUND_HOLES.slice(0,state.holeScores.length).reduce((a,h)=>a+h.par,0);
  const completedStrokes=state.holeScores.reduce((a,b)=>a+(b||0),0);
  $('hud-score').textContent=state.holeScores.length?relativeScore(completedStrokes,completedPar):'E';
  $('intro-series').textContent=holeDef.series+' · '+String(holeDef.number).padStart(2,'0');
  $('intro-name').textContent=holeDef.name;
  $('intro-meta').textContent='PAR '+holeDef.par+' · '+holeYards(holeDef)+' YD';
  const mapHead=$('map-course-name');
  if(mapHead)mapHead.textContent=holeDef.name+' · '+String(holeDef.number).padStart(2,'0');
  const mapFoot=$('map-foot-right');
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
  const c=club();golfer?.setClub?.(c,state.level);
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
  state.target.set(x,playingHeight(x,z)+.04,z);
}
function defaultTarget(resetAim=true){
  const c=club();
  if(resetAim){state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;}
  state.targetDistance=Math.min(c.carry*YARD,Math.hypot(pin.x-TEE.x,pin.z-TEE.z));
  syncTargetFromAim();
}
defaultTarget();

const ballGroup=createLoftBallVisual({radius:BALL_VISUAL_R});scene.add(ballGroup);
ballGroup.position.copy(TEE);

const golfer=new LoftGolferRig(COLORS);
golfer.group.position.set(0,terrainHeight(0,0),0);
golfer.setClub(club(),state.level);golfer.setPose(0,LEVELS[state.level]);scene.add(golfer.group);

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
const puttGhostBall=createLoftBallVisual({radius:BALL_VISUAL_R*.94,ghost:true});
const puttGhostMaterial=puttGhostBall.children[0]?.material;
puttPaceGhost.add(puttGhostBall);
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

  // Distance is authored primarily by backstroke depth. Downswing speed and
  // commitment influence compression and quality, but they no longer obscure
  // the player's distance decision. The SET mark is therefore an honest guide.
  const short=isShortGame();
  const nominalReleaseBonus=short ? .065 : .085;
  const loadShare=short ? .92 : .90;
  return clamp((ratio-nominalReleaseBonus)/loadShare,short ? .08 : .14,1.03);
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

function syncTargetStewardCopy(){
  const copy=buildTargetStewardCopy({
    putting:isPutting(),
    targetDistanceMeters:state.targetDistance,
    cupDistanceMeters:Math.hypot(pin.x-ballGroup.position.x,pin.z-ballGroup.position.z),
    targetToCupMeters:Math.hypot(state.target.x-pin.x,state.target.z-pin.z),
    elevationMeters:playingHeight(state.target.x,state.target.z)-playingHeight(ballGroup.position.x,ballGroup.position.z),
    surface:surfaceDisplay(surfaceAt(state.target.x,state.target.z))
  });
  const key=`${copy.mode}|${copy.kicker}|${copy.value}|${copy.unit}|${copy.detail}`;
  if(key===targetStewardCopyKey)return;
  targetStewardCopyKey=key;
  $('target-steward').dataset.mode=copy.mode;
  $('target-steward-kicker').textContent=copy.kicker;
  $('target-steward-value').textContent=copy.value;
  $('target-steward-unit').textContent=copy.unit;
  $('target-steward-detail').textContent=copy.detail;
}



function updateLine(){
  const start=ballGroup.position.clone();
  const end=state.target.clone();end.y=playingHeight(end.x,end.z)+.04;
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
  const putting=c.head==='putter';
  // On the green the real cup must remain the hero target. Use a restrained
  // exterior sight ring rather than laying a large white arcade marker over it.
  halo.scale.setScalar(putting ? .18 : 1);
  core.visible=!putting;
  ring.material.opacity=putting ? .56 : .82;
  haloDot.scale.setScalar(putting ? .72 : 1);

  // Camera-driven aiming rotates the entire address relationship around the ball.
  // Keep the model's local address ball (.46m right of stance) pinned to the
  // actual world ball while the golfer rotates with the chosen shot direction.
  const yaw=aimYaw();

  // The rig's authored local target direction is -Z. Three.js +Y rotation maps
  // local -Z toward -X for positive angles, while our gameplay heading uses
  // +X for positive yaw. Therefore the golfer MUST rotate by -yaw. Using +yaw
  // was the source of the strange front-on / mirrored address angles seen on iPhone.
  const rigYaw=-yaw;
  const localAddressBall=(golfer.addressBallLocal||new THREE.Vector3(.46,BALL_VISUAL_R,0)).clone().applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw);
  golfer.group.position.copy(ballGroup.position).sub(localAddressBall);

  // Stance grounding: one scalar root height on a sloped course can bury a
  // foot / ankle into the turf. Sample both sides of the stance and lift the
  // rig to the highest local contact. This is a conservative pre-IK solution:
  // no limb is allowed to visually penetrate the playable surface.
  const solePoints=golfer.shoeContactPoints?.()||[new THREE.Vector3(-.40,0,-.18),new THREE.Vector3(-.40,0,.18)];
  const stanceA=solePoints[0].clone().applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw).add(golfer.group.position);
  const stanceB=solePoints[1].clone().applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw).add(golfer.group.position);
  const stanceGround=Math.max(
    playingHeight(golfer.group.position.x,golfer.group.position.z),
    playingHeight(stanceA.x,stanceA.z),
    playingHeight(stanceB.x,stanceB.z)
  );
  golfer.group.position.y=Math.max(golfer.group.position.y,stanceGround+GOLFER_GROUND_CLEARANCE);
  golfer.group.rotation.y=rigYaw;
  syncTargetStewardCopy();
}
updateLine();

function surfaceAt(x,z){
  // Integration 014: one authored field owns both material identity and physics.
  return courseSurfaceAt(x,z);
}
function playingHeight(x,z){
  // Exact Y of the unified visible terrain mesh.
  return terrainHeight(x,z);
}
function playingContactY(x,z){
  return terrainContactY(x,z,BALL_CONTACT_HEIGHT);
}

function cupDistanceFeet(){
  return Math.hypot(pin.x-TEE.x,pin.z-TEE.z)*3.28084;
}
function intendedPuttFeet(){
  return Math.max(.5,state.targetDistance*3.28084);
}
function puttPaceFromPull(px,height){
  // Long physical travel for short putts. The first third of the gesture is
  // intentionally generous so 2–10 FT putts are easy to meter with a thumb.
  // Longer putts then accelerate progressively instead of linearly.
  const norm=clamp(px/(height*.25),0,1.10);
  const feet=.45+46.5*Math.pow(norm,1.45);
  return {norm,feet};
}
function updatePuttPaceGhost(feet){
  if(!isPutting()||state.phase!=='ready'){puttPaceGhost.visible=false;return false;}
  const d=Math.max(.15,feet*.3048);
  const forward=new THREE.Vector3(Math.sin(aimYaw()),0,-Math.cos(aimYaw()));
  const x=TEE.x+forward.x*d,z=TEE.z+forward.z*d;
  puttPaceGhost.position.set(x,playingContactY(x,z),z);
  const intended=intendedPuttFeet();
  const err=Math.abs(feet-intended);
  const close=err<=Math.max(.50,intended*.05);
  puttPaceRing.material.opacity=close ? .92 : .42;
  puttPaceRing.scale.setScalar(close?1.18:1);
  if(puttGhostMaterial)puttGhostMaterial.opacity=close ? .92 : .68;
  puttGhostBall.scale.setScalar(close?1.13:1);
  puttPaceGhost.visible=true;
  return close;
}
function hidePuttPace(){puttPaceGhost.visible=false;}


const physics=new GolfPhysics({
  terrainHeight:playingHeight,
  terrainSample:sampleTerrain,
  terrainContactY,
  terrainSweep:sweepTerrainSegment,
  surfaceAt,
  wind,
  waterLevel:WATER_LEVEL
});
physics.setCup(pin);
const cam=new LoftCamera(camera,{terrainHeight:playingHeight});
const topo=new LoftTopoMap($('course-map'));
const feedback=new LoftFeedback(scene,COLORS);

const courseMap=$('course-map');
const mapExpand=$('map-expand');
let mapDragPointer=null;
let mapDragMoved=false;

function mapIsOpen(){return courseMap.classList.contains('expanded');}
function openPrecisionMap(){
  if(state.phase!=='ready'||cam.isSwingLocked)return;
  closeBag?.();
  $('level-menu').classList.remove('open');
  $('level-chip').setAttribute('aria-expanded','false');
  courseMap.classList.add('expanded');
  courseMap.setAttribute('aria-expanded','true');
  $('app').classList.add('map-open');
  mapExpand.textContent='×';
  mapExpand.setAttribute('aria-label','Close course map');
  $('tip').style.opacity='0';
}
function closePrecisionMap(){
  courseMap.classList.remove('expanded');
  courseMap.setAttribute('aria-expanded','false');
  $('app').classList.remove('map-open');
  mapExpand.textContent='↗';
  mapExpand.setAttribute('aria-label','Expand course map');
  mapDragPointer=null;
  updateHoleHUD();
  updateTip();
}
function setAimFromMapClient(clientX,clientY){
  if(state.phase!=='ready')return;
  const p=topo.worldFromClient(clientX,clientY);
  if(!p)return;
  const dx=p.x-TEE.x,dz=p.z-TEE.z;
  let distance=Math.hypot(dx,dz);
  if(distance<.001)return;

  const c=club();
  const min=c.head==='putter' ? .15 : (isShortGame() ? .35 : Math.max(1.8,c.carry*YARD*.12));
  const max=c.head==='putter' ? 65*.3048 : c.carry*YARD*1.08;
  const yaw=clamp(Math.atan2(dx,-dz),COURSE_YAW-1.10,COURSE_YAW+1.10);

  state.aimYaw=yaw;
  state.aimYawTarget=yaw;
  state.targetDistance=clamp(distance,min,max);
  syncTargetFromAim();
  state.learned.camera=true;state.learned.line=true;
  updateLine();

  const label=c.head==='putter'
    ? Math.max(1,Math.round(state.targetDistance*3.28084))+' FT'
    : Math.max(1,Math.round(state.targetDistance/YARD))+' YD';
  $('map-distance').textContent=label;
  topo.update({ball:ballGroup.position,target:state.target,pin,surface:state.currentLie,distanceUnit:isPutting()?'FT':'YD'});
}

mapExpand.addEventListener('pointerdown',e=>{e.stopPropagation();});
mapExpand.addEventListener('click',e=>{
  e.stopPropagation();
  mapIsOpen()?closePrecisionMap():openPrecisionMap();
});
courseMap.addEventListener('click',e=>{
  if(e.target===mapExpand)return;
  if(!mapIsOpen())openPrecisionMap();
});
topo.svg?.addEventListener('pointerdown',e=>{
  if(!mapIsOpen()||state.phase!=='ready')return;
  e.preventDefault();e.stopPropagation();
  mapDragPointer=e.pointerId;mapDragMoved=false;
  topo.svg.setPointerCapture?.(e.pointerId);
  setAimFromMapClient(e.clientX,e.clientY);
});
topo.svg?.addEventListener('pointermove',e=>{
  if(mapDragPointer!==e.pointerId||!mapIsOpen())return;
  e.preventDefault();e.stopPropagation();
  mapDragMoved=true;
  setAimFromMapClient(e.clientX,e.clientY);
});
function endMapDrag(e){
  if(mapDragPointer!==e.pointerId)return;
  e.preventDefault();e.stopPropagation();
  try{topo.svg.releasePointerCapture?.(e.pointerId);}catch(_){}
  mapDragPointer=null;
}
topo.svg?.addEventListener('pointerup',endMapDrag);
topo.svg?.addEventListener('pointercancel',endMapDrag);

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

const targetStewardProjection=new THREE.Vector3();
const targetStewardWorldPoint=new THREE.Vector3();
const targetStewardCameraForward=new THREE.Vector3();
const targetStewardCameraToPoint=new THREE.Vector3();
const TARGET_STEWARD_OBSTACLE_SELECTORS=['.hole','.wind','#course-map','#club-chip','.right-tools'];

function cacheTargetStewardLayout(){
  const canvasRect=canvas.getBoundingClientRect();
  const appRect=$('app').getBoundingClientRect();
  const stewardRect=$('target-steward').getBoundingClientRect();
  targetStewardViewport={left:canvasRect.left,top:canvasRect.top,width:canvasRect.width,height:canvasRect.height};
  targetStewardAppOrigin={left:appRect.left,top:appRect.top};
  targetStewardSize={width:stewardRect.width||154,height:stewardRect.height||68};
  targetStewardObstacles=TARGET_STEWARD_OBSTACLE_SELECTORS.map(selector=>document.querySelector(selector)).filter(Boolean).map(element=>{
    const rect=element.getBoundingClientRect();
    return {left:rect.left,top:rect.top,width:rect.width,height:rect.height};
  }).filter(rect=>rect.width>0&&rect.height>0);
}

function setTargetStewardVisible(visible){
  if(visible===targetStewardVisible)return;
  targetStewardVisible=visible;
  const steward=$('target-steward');
  steward.classList.toggle('is-visible',visible);
  steward.setAttribute('aria-hidden',String(!visible));
}

function positionTargetSteward(){
  const steward=$('target-steward');
  const ready=state.phase==='ready'&&!cam.isSwingLocked&&!mapIsOpen()&&!$('bag').classList.contains('open')&&!$('level-menu').classList.contains('open')&&!$('round-end').classList.contains('show');
  const introVisible=$('hole-intro').style.opacity==='1';
  if(!ready||introVisible){setTargetStewardVisible(false);return;}

  const targetLift=isPutting()?.16:.72;
  targetStewardWorldPoint.set(state.target.x,playingHeight(state.target.x,state.target.z)+targetLift,state.target.z);
  camera.updateMatrixWorld();
  camera.getWorldDirection(targetStewardCameraForward);
  targetStewardCameraToPoint.subVectors(targetStewardWorldPoint,camera.position);
  if(targetStewardCameraToPoint.dot(targetStewardCameraForward)<=.05){setTargetStewardVisible(false);return;}

  targetStewardProjection.copy(targetStewardWorldPoint).project(camera);
  if(targetStewardProjection.x< -1||targetStewardProjection.x>1||targetStewardProjection.y< -1||targetStewardProjection.y>1||targetStewardProjection.z< -1||targetStewardProjection.z>1){
    setTargetStewardVisible(false);return;
  }
  const anchor={
    x:targetStewardViewport.left+(targetStewardProjection.x*.5+.5)*targetStewardViewport.width,
    y:targetStewardViewport.top+(-targetStewardProjection.y*.5+.5)*targetStewardViewport.height
  };
  const placement=solveTargetStewardPlacement({
    anchor,
    viewport:targetStewardViewport,
    size:targetStewardSize,
    obstacles:targetStewardObstacles
  });
  if(!placement.visible){setTargetStewardVisible(false);return;}
  steward.dataset.placement=placement.placement;
  steward.style.transform=`translate3d(${placement.x-targetStewardAppOrigin.left}px,${placement.y-targetStewardAppOrigin.top}px,0)`;
  setTargetStewardVisible(true);
}

function showContext(text,duration=520){
  $('context-text').textContent=text;
  const el=$('context');
  el.classList.toggle('signal',text==='SET'||text==='ON PACE');
  el.classList.add('show');
  clearTimeout(showContext.timer);showContext.timer=setTimeout(()=>{el.classList.remove('show','signal');},duration);
}
function setTip(text){$('tip-text').textContent=text;$('tip').style.opacity='1';}
function updateTip(){
  if(state.phase==='result'){$('tip').style.opacity='0';return;}
  if(isPutting()&&!state.learned.putt){setTip('PULL THE SIGNAL BACK · RETURN THROUGH BALL');return;}
  if(!state.learned.camera)setTip('DRAG TO AIM · PINCH / SCROLL TO ZOOM');
  else if(!state.learned.line)setTip('LANDING MARK · SET DISTANCE');
  else if(!state.learned.stroke)setTip('PULL THE SIGNAL BACK · DRIVE THROUGH');
  else $('tip').style.opacity='0';
}

function buildBag(){
  const grid=$('club-grid');grid.innerHTML='';
  const tier=equipmentTier(state.level);
  bagFocusId=state.clubId;
  CLUBS.forEach((c,index)=>{
    const b=document.createElement('button');b.className='club-card tier-'+tier.id;b.type='button';b.dataset.club=c.id;b.setAttribute('role','option');
    const hero=c.head==='putter'?65:c.carry;
    const unit=c.head==='putter'?'FT':'YD';
    b.setAttribute('aria-label','Preview '+c.name+' '+hero+' '+unit+' · '+tier.name+' '+tier.rarity);
    b.innerHTML=`<span class="club-card-number">${String(index+1).padStart(2,'0')}</span>
      <span class="club-card-state">${c.id===state.clubId?'IN BAG':'VIEW'}</span>
      <span class="club-card-art">${clubArtSvg(c,{tier,hero:false,instance:'rail-'+index})}</span>
      <span class="club-card-copy"><b>${c.model}</b><small>${c.short} · ${hero} ${unit}</small></span>`;
    b.onclick=()=>previewClub(c.id);
    b.onkeydown=e=>{
      if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
      e.preventDefault();
      const next=(index+(e.key==='ArrowRight'?1:-1)+CLUBS.length)%CLUBS.length;
      previewClub(CLUBS[next].id);grid.children[next]?.focus({preventScroll:true});
    };
    grid.appendChild(b);
  });
  syncBag();
}
function previewClub(id){
  if(!CLUBS.some(c=>c.id===id))return;
  bagFocusId=id;syncBagHero();
}
function syncBagHero(){
  const c=CLUBS.find(item=>item.id===bagFocusId)||club();
  const tier=equipmentTier(state.level);
  const index=Math.max(0,CLUBS.findIndex(item=>item.id===c.id));
  const hero=c.head==='putter'?65:c.carry;
  const unit=c.head==='putter'?'FT':'YD';
  const equipped=c.id===state.clubId;
  const stage=$('bag-hero-stage');
  stage.className='bag-hero tier-'+tier.id;
  stage.setAttribute('aria-label',c.model+' '+tier.name+' club object view');
  $('bag-hero-series').textContent='COASTAL OBJECT / '+String(index+1).padStart(2,'0');
  $('bag-hero-finish').textContent=tier.finish;
  $('bag-hero-process').textContent=tier.process;
  clubAtelier.select(c,state.level);
  $('bag-hero-tier').textContent=tier.name+' · '+tier.rarity;
  $('bag-equipped-state').textContent=equipped?'IN BAG':'INSPECTION';
  $('bag-hero-model').textContent=c.model;
  $('bag-hero-name').textContent=c.name.toUpperCase()+' · '+c.feel;
  $('bag-hero-carry').textContent=hero;
  $('bag-hero-unit').textContent=unit;
  $('bag-hero-story').textContent=c.story;
  $('bag-hero-loft').textContent=c.loft+' / '+c.launch+'°';
  $('bag-hero-flight').textContent=c.spin?c.spin.toLocaleString()+' RPM / '+c.roll+' YD':c.roll+' YD TRUE ROLL';
  $('bag-hero-material').textContent=tier.material;
  $('bag-hero-construction').textContent=tier.construction;
  const profile=clubPresentationProfile(c);
  for(const key of ['power','control','spin','forgiveness']){
    $('bag-stat-'+key).style.width=profile[key]+'%';
    $('bag-stat-'+key+'-value').textContent=profile[key];
  }
  const equip=$('bag-equip');
  equip.disabled=equipped;equip.classList.toggle('equipped',equipped);
  equip.setAttribute('aria-label',equipped?c.name+' is equipped':'Equip '+c.name);
  $('bag-equip-copy').textContent=equipped?'EQUIPPED':'EQUIP '+c.short;
  document.querySelectorAll('.club-card').forEach(x=>{
    const focused=x.dataset.club===c.id;
    const active=x.dataset.club===state.clubId;
    x.classList.toggle('focused',focused);x.classList.toggle('active',active);
    x.setAttribute('aria-selected',String(focused));
    if(active)x.setAttribute('aria-current','true');else x.removeAttribute('aria-current');
    const action=x.querySelector('.club-card-state');if(action)action.textContent=active?'IN BAG':focused?'INSPECT':'VIEW';
  });
}
function syncBag(){
  const c=club(),tier=equipmentTier(state.level);$('club-short').textContent=c.short;
  $('club-range-label').textContent=c.head==='putter'?'RANGE':'CARRY';
  $('club-carry').textContent=c.head==='putter'?65:c.carry;
  $('club-carry').dataset.unit=c.head==='putter'?'FT':'YD';
  $('club-model').textContent=c.model;
  $('club-tier').textContent=tier.name+' · '+tier.rarity;
  $('club-chip-art').dataset.head=c.head;
  $('bag-grade').textContent=tier.name+' · '+tier.rarity+' · '+tier.finish;
  $('bag-level').textContent='ABILITY LV '+state.level;
  syncBagHero();
}
function selectClub(id){
  const next=CLUBS.find(c=>c.id===id);if(!next)return;
  state.clubId=id;golfer.setClub(next,state.level);
  state.targetDistance=Math.min(next.carry*YARD,pinDistanceYards()*YARD*1.04);
  syncTargetFromAim();
  puttPaceGhost.visible=false;
  const distanceLabel=next.head==='putter'?'65 FT':next.carry+' YD';
  updateLine();syncBag();closeBag();showContext(next.name+' · '+distanceLabel,650);updateTip();
}
function openBag(){
  if(state.phase!=='ready'||cam.isSwingLocked||chronicleIsOpen())return;
  closePrecisionMap();$('level-menu').classList.remove('open');$('level-chip').setAttribute('aria-expanded','false');
  bagFocusId=state.clubId;bagReturnFocus=document.activeElement;syncBagHero();
  $('bag').classList.add('open');$('bag').setAttribute('aria-hidden','false');$('tip').style.opacity='0';
  setChronicleBackgroundInert(true);
  showBagCategory('clubs');
  $('bag-close').focus({preventScroll:true});
}
function closeBag(){
  const wasOpen=$('bag').classList.contains('open');
  const wasInspecting=ballAtelier.active||clubAtelier.active;
  ballAtelier.close();clubAtelier.close();
  $('bag').classList.remove('open');$('bag').setAttribute('aria-hidden','true');bagFocusId=state.clubId;updateTip();
  if(wasOpen){setChronicleBackgroundInert(false);resize();if(wasInspecting)restoreCourseCanvas();}
  if(wasOpen)requestAnimationFrame(()=>{const target=bagReturnFocus?.isConnected?bagReturnFocus:$('club-chip');target?.focus?.({preventScroll:true});});
}
$('club-chip').onclick=openBag;$('bag-close').onclick=closeBag;$('bag').addEventListener('pointerdown',e=>{if(e.target===$('bag'))closeBag();});
$('bag-equip').onclick=()=>{if(bagFocusId!==state.clubId)selectClub(bagFocusId);};
function showBagCategory(category){
  const ball=category==='ball';
  // Return the one canvas to its true course parent before the sibling
  // inspector borrows it. Nested owners would otherwise strand the canvas.
  if(ball)clubAtelier.close();else ballAtelier.close();
  $('bag-clubs-panel').hidden=ball;$('bag-ball-panel').hidden=!ball;
  for(const name of ['clubs','ball']){
    const tab=$('bag-tab-'+name),selected=category===name;
    tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  }
  $('bag').dataset.category=category;
  if(ball)ballAtelier.open();else clubAtelier.open();
}
function restoreCourseCanvas(){
  // Restore pixels in this same UI transaction, not one animation frame after
  // moving the canvas. A fixture may enter the Workshop before its first RAF.
  if(!cam.initialized)cam.updateAim(0,{ball:ballGroup.position,pin,aimYaw:aimYaw(),putting:isPutting()});
  renderer.render(scene,camera);
}
for(const category of ['clubs','ball']){
  const tab=$('bag-tab-'+category);
  tab.onclick=()=>showBagCategory(category);
  tab.onkeydown=e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const next=e.key==='Home'?'clubs':e.key==='End'?'ball':category==='clubs'?'ball':'clubs';
    showBagCategory(next);$('bag-tab-'+next).focus({preventScroll:true});
  };
}
$('ball-zoom-out').onclick=()=>ballAtelier.zoom(1);
$('ball-zoom-in').onclick=()=>ballAtelier.zoom(-1);
$('ball-reset').onclick=()=>ballAtelier.reset();
$('ball-return').onclick=closeBag;
document.querySelectorAll('[data-club-view]').forEach(button=>button.onclick=()=>clubAtelier.setView(button.dataset.clubView));
$('club-zoom-out').onclick=()=>clubAtelier.zoom(1);
$('club-zoom-in').onclick=()=>clubAtelier.zoom(-1);
$('club-reset').onclick=()=>clubAtelier.reset();
$('bag').addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!$('bag').classList.contains('open'))return;
  const focusable=[...$('bag').querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(el=>el.tabIndex>=0&&el.offsetParent!==null);if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus({preventScroll:true});}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus({preventScroll:true});}
});
buildBag();
topo.setHole(TEE,pin);
world.setDetailFocus?.(TEE,state.currentLie);
updateHoleHUD();syncChronicleAvailability();

$('level-chip').onclick=()=>{closePrecisionMap();closeBag();const open=$('level-menu').classList.toggle('open');$('level-chip').setAttribute('aria-expanded',String(open));};
document.querySelectorAll('#level-menu button[data-level]').forEach(b=>b.onclick=()=>{
  state.level=Number(b.dataset.level);$('level-chip').textContent='LV '+state.level;
  document.querySelectorAll('#level-menu button[data-level]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active));});
  $('level-menu').classList.remove('open');$('level-chip').setAttribute('aria-expanded','false');golfer.setClub(club(),state.level);golfer.setPose(0,LEVELS[state.level]);buildBag();showContext(LEVELS[state.level].grade+' · '+LEVELS[state.level].name,700);
});
$('camera-reset').onclick=()=>{
  closePrecisionMap();
  state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;
  syncTargetFromAim();updateLine();cam.resetAim();showContext('PIN LINE',360);
};

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
  state.phase='flight';state.swingPhase=.60;state.shotCount++;state.strokes++;syncChronicleAvailability();
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
  closePrecisionMap();
  state.phase='ready';state.shot=null;state.swingPhase=0;state.landingFX=false;state.ballCompression=0;state.hitStop=0;state.cupSink=0;
  state.cupSinkStartX=state.cupSinkStartZ=state.cupRestX=state.cupRestZ=0;
  physics.active=false;physics.state=null;
  if(penalty)state.strokes++;

  TEE.copy(position);
  TEE.y=playingContactY(TEE.x,TEE.z);
  state.currentLie=lieOverride||surfaceAt(TEE.x,TEE.z);
  world.setDetailFocus?.(TEE,state.currentLie);
  ballGroup.visible=true;ballGroup.position.copy(TEE);ballGroup.rotation.set(0,0,0);ballGroup.scale.set(1,1,1);

  COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));
  state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;

  chooseAutoClub();
  defaultTarget(false);
  golfer.setPose(0,LEVELS[state.level]);
  feedback.clear();hidePuttPace();hideStrokeSignal();

  lineMesh.visible=true;halo.visible=true;
  $('result').classList.remove('show');
  document.getElementById('app')?.classList.remove('swing-focus','result-open');
  cam.resetAim();
  updateLine();updateHoleHUD();updateTip();syncChronicleAvailability();
}

function chronicleIsOpen(){return $('round-end').classList.contains('show');}

function setChronicleBackgroundInert(inert){
  for(const selector of CHRONICLE_BACKGROUND_SELECTORS){
    const element=document.querySelector(selector);if(element)element.inert=inert;
  }
}

function syncChronicleAvailability(){
  const app=$('app');
  const available=state.phase==='ready'&&!cam.isSwingLocked&&!app.classList.contains('swing-focus')&&!chronicleIsOpen();
  if(available===chronicleAvailableCache)return;
  chronicleAvailableCache=available;
  const trigger=$('chronicle-open');
  trigger.disabled=!available;
  trigger.setAttribute('aria-disabled',String(!available));
}

function chronicleScoreCell(value,detail,toPar){
  const cell=document.createElement('td');
  if(Number.isFinite(toPar))cell.classList.add(toPar<0?'under':toPar>0?'over':'even');
  const primary=document.createElement('b');primary.textContent=value;
  const secondary=document.createElement('small');secondary.textContent=detail;
  cell.append(primary,secondary);return cell;
}

function renderRoundChronicle(model){
  const overlay=$('round-end');
  overlay.dataset.mode=model.mode;
  $('chronicle-state').textContent=model.stateLabel;
  $('chronicle-title').textContent=model.courseLabel;
  $('chronicle-progress').textContent=model.progressLabel;
  $('chronicle-active-hole').textContent=model.activeHoleName;
  $('round-score').textContent=model.score;
  $('round-total').textContent=model.scoreDetail;
  $('chronicle-match').textContent=model.matchLabel;
  $('chronicle-match-detail').textContent=model.matchDetail;
  const brandSeries=document.querySelector('.chronicle-brand span');
  if(brandSeries)brandSeries.textContent='ROUND CHRONICLE / '+model.seriesLabel.replace(' SERIES · ',' ');

  const body=$('scorecard-body');body.replaceChildren(...model.rows.map(row=>{
    const tr=document.createElement('tr');tr.className=row.state;
    if(row.state==='current')tr.setAttribute('aria-current','true');
    const label=document.createElement('th');label.scope='row';
    const number=document.createElement('span');number.textContent=row.number;
    const name=document.createElement('b');name.textContent=row.name;
    const route=document.createElement('small');route.textContent=row.yards+' YD · PAR '+row.par;
    label.append(number,name,route);
    const par=document.createElement('td');const parValue=document.createElement('b');parValue.textContent=String(row.par);par.append(parValue);
    tr.append(label,par,chronicleScoreCell(row.youValue,row.youDetail,row.youToPar),chronicleScoreCell(row.rowanValue,row.rowanDetail,row.rowanToPar));
    return tr;
  }));

  $('chronicle-total-label').textContent=model.totals.label;
  $('chronicle-posted').textContent=model.totals.posted+' / '+model.totals.holes+' POSTED';
  $('chronicle-total-par').textContent=String(model.totals.par);
  $('chronicle-total-you').textContent=model.totals.you;
  $('chronicle-total-rowan').textContent=model.totals.rowan;
  $('chronicle-close').hidden=model.mode==='final';
  $('run-it-back').hidden=model.mode!=='final';
}

function syncRoundChronicle(){
  const model=buildRoundChronicleModel({
    holes:ROUND_HOLES,
    rowanScores:ROWAN_SCORES,
    holeScores:state.holeScores,
    holeIndex,
    strokes:state.strokes,
    roundComplete:state.roundComplete
  });
  renderRoundChronicle(model);return model;
}

function openRoundChronicle({final=false}={}){
  const finalMode=Boolean(final);
  if(chronicleIsOpen())return false;
  if(finalMode){
    if(state.phase!=='round-end'||!state.roundComplete)return false;
  }else if(state.phase!=='ready'||cam.isSwingLocked||$('app').classList.contains('swing-focus'))return false;

  chronicleReturnFocus=document.activeElement;
  closePrecisionMap();closeBag();
  $('level-menu').classList.remove('open');$('level-chip').setAttribute('aria-expanded','false');
  const model=syncRoundChronicle();
  if((model.mode==='final')!==finalMode)return false;
  const overlay=$('round-end');
  overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
  $('app').classList.add('chronicle-open');$('chronicle-open').setAttribute('aria-expanded','true');
  setChronicleBackgroundInert(true);
  $('tip').style.opacity='0';setTargetStewardVisible(false);syncChronicleAvailability();
  requestAnimationFrame(()=>$(finalMode?'run-it-back':'chronicle-close').focus({preventScroll:true}));
  return true;
}

function closeRoundChronicle({restoreFocus=true,force=false}={}){
  const overlay=$('round-end');
  const wasOpen=overlay.classList.contains('show');
  if(!wasOpen)return false;
  if(overlay.dataset.mode==='final'&&!force)return false;
  overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');overlay.dataset.mode='live';
  $('app').classList.remove('chronicle-open');$('chronicle-open').setAttribute('aria-expanded','false');
  setChronicleBackgroundInert(false);
  $('chronicle-close').hidden=false;$('run-it-back').hidden=true;
  chronicleAvailableCache=null;syncChronicleAvailability();
  if(state.phase==='ready')updateTip();
  if(restoreFocus){
    const target=chronicleReturnFocus?.isConnected?chronicleReturnFocus:$('chronicle-open');
    requestAnimationFrame(()=>target?.focus?.({preventScroll:true}));
  }
  chronicleReturnFocus=null;return true;
}

function startHole(index,{intro=true}={}){
  closeRoundChronicle({restoreFocus:false,force:true});
  closePrecisionMap();
  holeIndex=index;state.holeIndex=index;holeDef=ROUND_HOLES[index];
  state.strokes=0;state.phase='ready';state.shot=null;state.roundComplete=false;
  state.swingPhase=0;state.landingFX=false;state.ballCompression=0;state.hitStop=0;state.cupSink=0;
  state.cupSinkStartX=state.cupSinkStartZ=state.cupRestX=state.cupRestZ=0;
  physics.active=false;physics.state=null;

  pin.set(holeDef.pin[0],playingHeight(holeDef.pin[0],holeDef.pin[1]),holeDef.pin[1]);
  wind.set(holeDef.wind[0],0,holeDef.wind[1]);
  physics.wind.copy(wind);physics.setCup(pin);
  world.setPin(pin);

  const originalTee=new THREE.Vector3(holeDef.tee[0],playingContactY(holeDef.tee[0],holeDef.tee[1]),holeDef.tee[1]);
  topo.setHole(originalTee,pin);
  TEE.copy(originalTee);
  state.currentLie='tee';
  world.setDetailFocus?.(TEE,state.currentLie);

  COURSE_YAW=Math.atan2(pin.x-TEE.x,-(pin.z-TEE.z));
  state.aimYaw=COURSE_YAW;state.aimYawTarget=COURSE_YAW;
  chooseAutoClub();defaultTarget(false);

  ballGroup.visible=true;ballGroup.position.copy(TEE);ballGroup.rotation.set(0,0,0);ballGroup.scale.set(1,1,1);
  golfer.setPose(0,LEVELS[state.level]);
  feedback.clear();hidePuttPace();hideStrokeSignal();lineMesh.visible=true;halo.visible=true;
  $('result').classList.remove('show');
  document.getElementById('app')?.classList.remove('swing-focus','hole-transition','result-open','chronicle-open');
  cam.resetAim();updateLine();updateHoleHUD();updateTip();chronicleAvailableCache=null;syncChronicleAvailability();
  if(intro)showHoleIntro();
}

function showRoundEnd(){
  state.roundComplete=true;
  syncChronicleAvailability();openRoundChronicle({final:true});
}

function finishShot(){
  if(state.phase==='result'||state.phase==='round-end')return;
  const holed=Boolean(physics.state?.holed);
  state.phase='result';syncChronicleAvailability();
  cam.beginResult(ballGroup.position,pin,{cup:holed});

  const feet=Math.hypot(ballGroup.position.x-pin.x,ballGroup.position.z-pin.z)*3.28084;
  const surface=holed?'cup':surfaceAt(ballGroup.position.x,ballGroup.position.z);
  if(surface!=='water')world.setDetailFocus?.(ballGroup.position,holed?'green':surface);
  $('result-kicker').textContent=state.shot.label+' · '+state.shot.club;

  if(holed){
    const ix=Number.isFinite(state.cupEntryX)?state.cupEntryX:ballGroup.position.x;
    const iz=Number.isFinite(state.cupEntryZ)?state.cupEntryZ:ballGroup.position.z;
    let dx=pin.x-ix,dz=pin.z-iz;
    const dl=Math.hypot(dx,dz);
    if(dl>.0001){dx/=dl;dz/=dl;}else{dx=Math.sin(state.aimYaw);dz=-Math.cos(state.aimYaw);}
    // Physics owns acceptance. Presentation begins just inside the near lip and
    // lets the full-size ball continue to the far side of the liner bottom.
    state.cupSink=1;
    state.cupSinkStartX=pin.x-dx*.014;
    state.cupSinkStartZ=pin.z-dz*.014;
    state.cupRestX=pin.x+dx*.020;
    state.cupRestZ=pin.z+dz*.020;
    state.cupSinkStartY=playingContactY(pin.x,pin.z);
    ballGroup.position.set(state.cupSinkStartX,state.cupSinkStartY,state.cupSinkStartZ);
    state.holeScores[holeIndex]=state.strokes;
    feedback.cup?.({position:pin,score:state.strokes-holeDef.par});
    $('result-kicker').textContent='HOLE '+String(holeDef.number).padStart(2,'0')+' · '+state.strokes+' STROKE'+(state.strokes===1?'':'S');
    $('result-head').textContent=scoreName(state.strokes,holeDef.par);
    $('result-sub').textContent=scoreToParText()+' · '+holeDef.name;
    $('again').textContent=holeIndex<ROUND_HOLES.length-1?'NEXT HOLE':'FINISH ROUND';
    state.resultAction=holeIndex<ROUND_HOLES.length-1?'nextHole':'finishRound';
    showContext('IN THE HOLE',900);
    document.getElementById('app')?.classList.add('result-open');
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
  document.getElementById('app')?.classList.add('result-open');
  $('result').classList.add('show');updateTip();
}

function handleResultAction(){
  $('result').classList.remove('show');
  document.getElementById('app')?.classList.remove('result-open');
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
$('chronicle-open').onclick=()=>openRoundChronicle();
$('chronicle-close').onclick=()=>closeRoundChronicle();
$('round-end').addEventListener('pointerdown',e=>{if(e.target===$('round-end'))closeRoundChronicle();});
$('round-end').addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!chronicleIsOpen())return;
  const focusable=[...$('round-end').querySelectorAll('button:not([disabled]):not([hidden])')].filter(button=>getComputedStyle(button).display!=='none');
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus({preventScroll:true});}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus({preventScroll:true});}
});
$('run-it-back').onclick=()=>{
  state.holeScores=[];state.shotCount=0;state.learned={camera:true,line:true,stroke:true,putt:true};
  startHole(0,{intro:true});
};

const pointers=new Map();
let gesture=null;
canvas.addEventListener('pointerdown',e=>{
  feedback.unlock();
  if($('bag').classList.contains('open')||chronicleIsOpen())return;
  $('level-menu').classList.remove('open');$('level-chip').setAttribute('aria-expanded','false');
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
  if(type==='swing'){state.interaction='swing';state.swingPhase=0;document.getElementById('app')?.classList.add('swing-focus');cam.beginSwing(aimYaw());syncChronicleAvailability();$('swing-meter').classList.add('show');beginStrokeSignal({putting:gesture.putt,shortGame:gesture.shortGame});showContext(gesture.putt?'PULL FOR DISTANCE':(gesture.shortGame?'TOUCH':'LOAD'),9999);$('tip').style.opacity='0';}
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
      const yawRate=isPutting() ? .00245 : .0041;
      state.aimYawTarget=clamp(state.aimYawTarget-dx*yawRate,COURSE_YAW-1.10,COURSE_YAW+1.10);
      cam.aimPitchBy(dy*(isPutting() ? .48 : 1));
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

          // THE SIGNAL owns distance. Release quality matters, but a player
          // should never wonder whether the same backstroke will suddenly fly 30% farther.
          const power=gesture.shortGame
            ? clamp(gesture.load*.92+speedScore*.03+commitment*.05,.055,.86)
            : clamp(gesture.load*.90+speedScore*.06+commitment*.04,.10,1.08);

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
    if(gesture.type==='swing'&&!gesture.impact){state.interaction=null;state.swingPhase=0;document.getElementById('app')?.classList.remove('swing-focus');cam.cancelSwing();syncChronicleAvailability();golfer.setPose(0,LEVELS[state.level]);hidePuttPace();hideStrokeSignal();$('context').classList.remove('show');$('swing-meter').classList.remove('show');$('swing-fill').style.height='0';setTip(gesture.putt?'PULL THE SIGNAL BACK · RETURN THROUGH BALL':'PULL THE SIGNAL BACK · DRIVE THROUGH');}
  }
  gesture=null;
}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);

canvas.addEventListener('wheel',e=>{
  if(mapIsOpen()||$('bag').classList.contains('open')||chronicleIsOpen())return;
  e.preventDefault();
  const delta=-e.deltaY;
  if(state.phase==='ready'&&!cam.isSwingLocked)cam.aimZoom(delta);
  else if(state.phase==='result')cam.resultZoom(delta);
  state.learned.camera=true;updateTip();
},{passive:false});

window.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(chronicleIsOpen()){if(closeRoundChronicle()){e.preventDefault();e.stopPropagation();}return;}
  if($('bag').classList.contains('open')){closeBag();$('club-chip').focus({preventScroll:true});return;}
  if(mapIsOpen()){closePrecisionMap();$('map-expand').focus({preventScroll:true});return;}
  if($('level-menu').classList.contains('open')){$('level-menu').classList.remove('open');$('level-chip').setAttribute('aria-expanded','false');$('level-chip').focus({preventScroll:true});}
});

function resize(){const r=$('stage').getBoundingClientRect();if(!ballAtelier.active&&!clubAtelier.active)renderer.setSize(Math.max(320,r.width),Math.max(480,r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();cacheTargetStewardLayout();}
new ResizeObserver(resize).observe($('stage'));resize();

let last=performance.now();
let lastMapUpdate=0;
function frame(now){
  const dt=Math.min(.03,(now-last)/1000||.016);last=now;
  if(ballAtelier.active){ballAtelier.render(dt);requestAnimationFrame(frame);return;}
  if(clubAtelier.active){clubAtelier.render(dt);requestAnimationFrame(frame);return;}

  if(state.phase==='ready'&&!cam.isSwingLocked){
    const nextYaw=state.aimYaw+(state.aimYawTarget-state.aimYaw)*(1-Math.exp(-8.6*dt));
    if(Math.abs(nextYaw-state.aimYaw)>.00001){
      state.aimYaw=nextYaw;
      syncTargetFromAim();
      updateLine();
    }
  }

  const yaw=aimYaw();
  if(state.phase==='ready'){
    if(cam.isSwingLocked)cam.updateSwing(dt,{ball:ballGroup.position,pin,aimYaw:yaw,swingProgress:state.swingPhase,putting:isPutting()});
    else cam.updateAim(dt,{ball:ballGroup.position,pin,aimYaw:yaw,putting:isPutting()});
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
    const beforeCupX=ballGroup.position.x,beforeCupZ=ballGroup.position.z;
    const ps=physics.step(dt);
    if(ps){
      if(ps.holed){state.cupEntryX=beforeCupX;state.cupEntryZ=beforeCupZ;}
      ballGroup.position.copy(ps.pos);
      if(ps.surface!=='air'&&ps.surface!=='cup'&&!ps.holed){
        const visualGround=playingContactY(ballGroup.position.x,ballGroup.position.z);
        if(Number.isFinite(visualGround)&&ballGroup.position.y<visualGround)ballGroup.position.y=visualGround;
      }
      if(ps.surface==='air'&&ps.spinAxis&&ps.spinOmega>0){
        ballGroup.rotateOnWorldAxis(ps.spinAxis,ps.spinOmega*dt);
      }else{
        const hs=Math.hypot(ps.vel.x,ps.vel.z);
        if(hs>.001){
          const rollAxis=new THREE.Vector3(-ps.vel.z,0,ps.vel.x).normalize();
          ballGroup.rotateOnWorldAxis(rollAxis,(hs/BALL_VISUAL_R)*dt);
        }
      }
      if(!state.shot?.putting)feedback.flight(ballGroup.position,state.shot?.quality||.8);
      if(ps.surfaceChanged){
        feedback.surfaceTransition(ps.surfaceChanged.to,Math.hypot(ps.vel.x,ps.vel.z));
        ps.surfaceChanged=null;
      }
      if(ps.surface!=='air'&&ps.surface!=='cup'&&ps.surface!=='water'&&!ps.stopped){
        feedback.roll(ps.surface,Math.hypot(ps.vel.x,ps.vel.z));
      }
      cam.updateFlight(dt,{ball:ballGroup.position,velocity:ps.vel,pin,putting:Boolean(state.shot?.putting)});

      if(ps.lastImpactSurface&&!state.landingFX){
        state.landingFX=true;
        feedback.land({surface:ps.lastImpactSurface,position:ballGroup.position,quality:state.shot?.quality||.8});
      }

      if(ps.stopped){
        if(ps.recovered)showContext('BALL SETTLED',520);
        finishShot();
      }
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
  world.updateWorld?.(dt);

  if(state.cupSink>0){
    state.cupSink=Math.max(0,state.cupSink-dt*1.65);
    const t=1-state.cupSink;
    const travel=t*t*(3-2*t);
    const cupRestLocal=world.cupGroup?.userData?.ballRestY??-.0736;
    const bottomY=(world.cupGroup?.position.y??playingHeight(pin.x,pin.z))+cupRestLocal;
    let y;
    if(t<.58){
      const drop=t/.58;
      y=lerp(state.cupSinkStartY,bottomY,drop*drop);
    }else{
      const settle=(t-.58)/.42;
      y=bottomY+Math.abs(Math.sin(settle*Math.PI*2.25))*.0085*(1-settle);
    }
    ballGroup.position.set(
      lerp(state.cupSinkStartX,state.cupRestX,travel),
      y,
      lerp(state.cupSinkStartZ,state.cupRestZ,travel)
    );
    ballGroup.scale.setScalar(1);
  }

  const tendingPin=(state.phase==='ready'&&isPutting())||(state.phase==='flight'&&state.shot?.putting)||(state.phase==='result'&&state.shot?.putting);
  world.setPinFade(tendingPin ? .10 : 1);
  if(world.cupGroup)world.cupGroup.visible=true;

  if(state.phase==='ready')ring.scale.setScalar(.96+Math.sin(now*.0038)*.04);
  if(now-lastMapUpdate>66){
    const mapSurface=state.phase==='flight'?(state.shot?.putting?surfaceAt(ballGroup.position.x,ballGroup.position.z):'AIR'):state.phase==='ready'?state.currentLie:surfaceAt(ballGroup.position.x,ballGroup.position.z);
    topo.update({ball:ballGroup.position,target:state.target,pin,surface:mapSurface,distanceUnit:isPutting()?'FT':'YD'});
    lastMapUpdate=now;
  }
  positionTargetSteward();
  renderer.render(scene,camera);requestAnimationFrame(frame);
}

setTimeout(()=>{$('boot').style.opacity='0';setTimeout(()=>$('boot')?.remove(),520);$('hole-intro').style.opacity='1';setTimeout(()=>$('hole-intro').style.opacity='0',1300);},220);

// Deterministic, opt-in visual fixture for the persistent Gauntlet. Normal
// players never enter this path; `?gauntlet=cup` starts a real eight-foot putt
// and `cup-close` starts a two-foot inspection using the same gameplay, camera,
// physics, score, and result systems.
const gauntletFixture=new URLSearchParams(location.search).get('gauntlet');
if(gauntletFixture==='cup'||gauntletFixture==='cup-close'){
  setTimeout(()=>{
    const fixtureFeet=gauntletFixture==='cup-close'?2:8;
    const back=TEE.clone().sub(pin);back.y=0;
    if(back.lengthSq()<.001)back.set(0,0,1);else back.normalize();
    const fixture=pin.clone().addScaledVector(back,fixtureFeet/3.28084);
    fixture.y=playingContactY(fixture.x,fixture.z);
    state.learned={camera:true,line:true,stroke:true,putt:true};
    prepareShotAt(fixture,{lieOverride:'green'});
    showContext('CUP FIXTURE · '+fixtureFeet+' FT',650);
  },90);
}else if(gauntletFixture==='ball'){
  setTimeout(()=>{openBag();showBagCategory('ball');},90);
}else if(gauntletFixture==='chronicle-live'||gauntletFixture==='chronicle-final'){
  // Scorecard fixtures only arrange legitimate round state, then enter through
  // the same renderer and modal lifecycle used by live play.
  setTimeout(()=>{
    const final=gauntletFixture==='chronicle-final';
    state.learned={camera:true,line:true,stroke:true,putt:true};
    state.holeScores=final?[2,3,4]:[2];
    startHole(final?ROUND_HOLES.length-1:1,{intro:false});
    state.strokes=final?4:2;updateHoleHUD();
    if(final){state.phase='round-end';showRoundEnd();}
    else openRoundChronicle();
  },90);
}else if(gauntletFixture?.startsWith('character-')){
  // Read-only pose fixtures let the visual Gauntlet judge the actual gameplay
  // model at biomechanically meaningful states without bypassing its rig.
  const poseName=gauntletFixture.slice('character-'.length);
  const poseT={address:0,top:.38,impact:.60,finish:1}[poseName];
  if(Number.isFinite(poseT))setTimeout(()=>{
    state.learned={camera:true,line:true,stroke:true,putt:true};
    golfer.setPose(poseT,LEVELS[state.level]);
    showContext('CHARACTER FIXTURE · '+poseName.toUpperCase(),850);
  },90);
}
updateTip();
requestAnimationFrame(frame);
