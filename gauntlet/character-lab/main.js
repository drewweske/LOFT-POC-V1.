import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const C={ink:0x0B0D0D,cream:0xF2EFE8,stone:0xB8B1A6,orange:0xFF6A2A,skin:0xc99372,hair:0x2b211b};
const host=document.getElementById('app');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd2dcda);scene.fog=new THREE.Fog(0xd2dcda,10,24);
const camera=new THREE.PerspectiveCamera(39,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x48564d,2.3));
const sun=new THREE.DirectionalLight(0xfff0d7,3);sun.position.set(-4,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);

const mat=(c,r=.84,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const cream=mat(C.cream,.92),ink=mat(C.ink,.82),stone=mat(C.stone,.9),skin=mat(C.skin,.78),hair=mat(C.hair,.92),orange=mat(C.orange,.72),steel=mat(0xbcbdb7,.35,.58);
const golfer=new THREE.Group();scene.add(golfer);

const ground=new THREE.Mesh(new THREE.CircleGeometry(8,64),mat(0x879f78,.98));ground.rotation.x=-Math.PI/2;ground.position.y=0;ground.receiveShadow=true;scene.add(ground);
const fair=new THREE.Mesh(new THREE.PlaneGeometry(4.2,14),mat(0xa8bb8d,.98));fair.rotation.x=-Math.PI/2;fair.position.set(0,.012,-4.5);fair.receiveShadow=true;scene.add(fair);
const ball=new THREE.Mesh(new THREE.SphereGeometry(.105,32,24),cream);ball.castShadow=true;ball.position.set(.55,.105,0);scene.add(ball);
const dot=new THREE.Mesh(new THREE.SphereGeometry(.017,14,10),orange);dot.position.set(.463,.07,.06);scene.add(dot);

function ellipsoid(name,geo,material,pos,scale,rot=[0,0,0]){
  const m=new THREE.Mesh(geo,material);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;golfer.add(m);return m;
}
function capsuleBetween(name,a,b,r,material){
  const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);
  const g=new THREE.CapsuleGeometry(r,Math.max(.02,len-r*2),7,14);
  const m=new THREE.Mesh(g,material);m.name=name;m.position.copy(mid);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  m.castShadow=true;golfer.add(m);return m;
}

// Local coordinate system: target = -Z, golfer faces +X toward ball.
const hipL=new THREE.Vector3(-.55,.98,-.17),hipR=new THREE.Vector3(-.55,.98,.17);
const kneeL=new THREE.Vector3(-.50,.54,-.22),kneeR=new THREE.Vector3(-.48,.54,.23);
const ankleL=new THREE.Vector3(-.48,.15,-.23),ankleR=new THREE.Vector3(-.43,.15,.25);
const shoulderL=new THREE.Vector3(-.43,1.67,-.245),shoulderR=new THREE.Vector3(-.43,1.67,.245);
const elbowL=new THREE.Vector3(-.16,1.32,-.19),elbowR=new THREE.Vector3(-.13,1.33,.20);
const handL=new THREE.Vector3(.12,1.03,-.055),handR=new THREE.Vector3(.13,1.02,.05);

// Pants + legs: full, continuous athletic silhouette.
ellipsoid('pelvis',new THREE.SphereGeometry(.36,24,18),ink,[-.55,1.00,0],[1.02,.72,.82],[0,0,-.02]);
capsuleBetween('thighL',hipL,kneeL,.115,ink);capsuleBetween('thighR',hipR,kneeR,.115,ink);
capsuleBetween('calfL',kneeL,ankleL,.092,ink);capsuleBetween('calfR',kneeR,ankleR,.092,ink);
ellipsoid('shoeL',new THREE.BoxGeometry(.44,.16,.22),stone,[-.37,.105,-.24],[1,1,1],[0,-.06,0]);
ellipsoid('shoeR',new THREE.BoxGeometry(.44,.16,.22),stone,[-.31,.105,.25],[1,1,1],[0,.04,0]);

// Polo body built from overlapping authored volumes, not a cylinder.
ellipsoid('torso',new THREE.SphereGeometry(.48,28,20),cream,[-.47,1.45,0],[.82,.92,.72],[0,0,-.13]);
ellipsoid('chest',new THREE.SphereGeometry(.42,28,20),cream,[-.43,1.63,0],[.95,.52,.83],[0,0,-.10]);
ellipsoid('waist',new THREE.SphereGeometry(.33,24,18),cream,[-.53,1.20,0],[.9,.58,.79],[0,0,-.08]);
ellipsoid('belt',new THREE.CylinderGeometry(.30,.30,.065,24),ink,[-.55,1.09,0],[1,.98,.82],[0,0,-.03]);

// Sleeves create actual shoulder mass before bare forearm.
capsuleBetween('sleeveL',shoulderL,new THREE.Vector3(-.30,1.48,-.22),.105,cream);
capsuleBetween('sleeveR',shoulderR,new THREE.Vector3(-.29,1.49,.22),.105,cream);
capsuleBetween('upperArmL',new THREE.Vector3(-.30,1.48,-.22),elbowL,.074,skin);
capsuleBetween('upperArmR',new THREE.Vector3(-.29,1.49,.22),elbowR,.074,skin);
capsuleBetween('foreArmL',elbowL,handL,.065,skin);capsuleBetween('foreArmR',elbowR,handR,.065,skin);
ellipsoid('handL',new THREE.SphereGeometry(.085,18,12),skin,[handL.x,handL.y,handL.z],[.9,.9,.72]);
ellipsoid('handR',new THREE.SphereGeometry(.085,18,12),skin,[handR.x,handR.y,handR.z],[.9,.9,.72]);

// Neck/head, simplified human planes.
ellipsoid('neck',new THREE.CylinderGeometry(.105,.115,.20,16),skin,[-.48,1.94,0],[1,1,.98],[0,0,-.10]);
ellipsoid('head',new THREE.SphereGeometry(.245,30,22),skin,[-.43,2.18,0],[.88,1.08,.88],[0,0,-.07]);
ellipsoid('jaw',new THREE.SphereGeometry(.19,24,18),skin,[-.38,2.04,0],[.92,.60,.82],[0,0,-.10]);
ellipsoid('nose',new THREE.ConeGeometry(.045,.13,12),skin,[-.205,2.18,0],[1,1,1],[0,0,-Math.PI/2]);
ellipsoid('earL',new THREE.SphereGeometry(.043,14,10),skin,[-.47,2.17,-.205],[.7,1,.55]);
ellipsoid('earR',new THREE.SphereGeometry(.043,14,10),skin,[-.47,2.17,.205],[.7,1,.55]);
ellipsoid('hair',new THREE.SphereGeometry(.247,26,18),hair,[-.47,2.32,0],[.91,.46,.90]);
ellipsoid('capCrown',new THREE.SphereGeometry(.258,28,16),ink,[-.45,2.38,0],[.98,.43,1.02]);
ellipsoid('capBrim',new THREE.BoxGeometry(.26,.038,.19),ink,[-.22,2.35,0],[1,1,1],[0,0,-.05]);
ellipsoid('capSignal',new THREE.SphereGeometry(.027,12,8),orange,[-.28,2.40,-.06],[1,1,1]);

// Facial features stay controlled and graphic.
ellipsoid('eyeL',new THREE.SphereGeometry(.016,10,8),ink,[-.222,2.22,-.073],[1,1,.7]);
ellipsoid('eyeR',new THREE.SphereGeometry(.016,10,8),ink,[-.222,2.22,.073],[1,1,.7]);
ellipsoid('browL',new THREE.BoxGeometry(.055,.014,.014),hair,[-.229,2.26,-.073],[1,1,1],[0,0,-.06]);
ellipsoid('browR',new THREE.BoxGeometry(.055,.014,.014),hair,[-.229,2.26,.073],[1,1,1],[0,0,-.06]);

// Quiet polo detail.
ellipsoid('placket',new THREE.BoxGeometry(.018,.18,.035),orange,[-.055,1.58,0],[1,1,1],[0,0,-.12]);

// Club goes through hands to ball. It is a real 3D line, not a sideways pivot.
const gripMid=handL.clone().lerp(handR,.5);
const clubHeadPos=new THREE.Vector3(.47,.07,0);
capsuleBetween('grip',gripMid,gripMid.clone().lerp(clubHeadPos,.18),.035,ink);
const shaft=capsuleBetween('shaft',gripMid.clone().lerp(clubHeadPos,.18),clubHeadPos,.018,steel);
ellipsoid('clubHead',new THREE.BoxGeometry(.16,.075,.23),steel,[clubHeadPos.x,clubHeadPos.y,clubHeadPos.z],[1,1,1],[0,.05,-.15]);

// Subtle contact shadow.
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.7,40),new THREE.MeshBasicMaterial({color:0x263128,transparent:true,opacity:.12,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.5,.55,1);shadow.position.set(-.25,.018,0);scene.add(shadow);

golfer.position.set(0,0,0);

const views={
  three:{pos:[4.3,2.6,5.1],target:[-.22,1.16,0]},
  front:{pos:[5.0,2.15,0],target:[-.2,1.18,0]},
  side:{pos:[.3,2.15,5.3],target:[-.28,1.18,0]},
  back:{pos:[-5.0,2.2,0],target:[-.35,1.18,0]}
};
let current='three';
function setView(name){current=name;document.querySelectorAll('.views button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
document.querySelectorAll('.views button').forEach(b=>b.onclick=()=>setView(b.dataset.view));

let cameraPos=new THREE.Vector3(...views.three.pos),cameraTarget=new THREE.Vector3(...views.three.target);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();

function tick(){
  const v=views[current];cameraPos.lerp(new THREE.Vector3(...v.pos),.09);cameraTarget.lerp(new THREE.Vector3(...v.target),.09);
  camera.position.copy(cameraPos);camera.lookAt(cameraTarget);renderer.render(scene,camera);requestAnimationFrame(tick);
}
tick();