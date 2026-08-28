import * as THREE from '../../vendor/three.module.js';

const C={ink:0x0B0D0D,cream:0xF2EFE8,stone:0xB8B1A6,orange:0xFF6A2A,skin:0xc99372,hair:0x2b211b};
const host=document.getElementById('app');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
host.appendChild(renderer.domElement);

const scene=new THREE.Scene();scene.background=new THREE.Color(0xd2dcda);scene.fog=new THREE.Fog(0xd2dcda,10,25);
const camera=new THREE.PerspectiveCamera(38,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x48564d,2.25));
const sun=new THREE.DirectionalLight(0xfff0d7,3.1);sun.position.set(-4,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);

const mat=(c,r=.84,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const cream=mat(C.cream,.92),ink=mat(C.ink,.82),stone=mat(C.stone,.9),skin=mat(C.skin,.78),hair=mat(C.hair,.92),orange=mat(C.orange,.72),steel=mat(0xbcbdb7,.35,.58);

const golfer=new THREE.Group();scene.add(golfer);

const ground=new THREE.Mesh(new THREE.CircleGeometry(8,64),mat(0x879f78,.98));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const fair=new THREE.Mesh(new THREE.PlaneGeometry(4.2,14),mat(0xa8bb8d,.98));fair.rotation.x=-Math.PI/2;fair.position.set(0,.012,-4.5);fair.receiveShadow=true;scene.add(fair);

const ball=new THREE.Mesh(new THREE.SphereGeometry(.085,32,24),cream);ball.castShadow=true;ball.position.set(.46,.085,0);scene.add(ball);
const dot=new THREE.Mesh(new THREE.SphereGeometry(.014,14,10),orange);dot.position.set(.39,.057,.048);scene.add(dot);

function mesh(name,geo,material,pos,scale=[1,1,1],rot=[0,0,0]){
  const m=new THREE.Mesh(geo,material);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;golfer.add(m);return m;
}
function capsule(name,a,b,r,material){
  const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.02,len-r*2),7,14),material);
  m.name=name;m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;golfer.add(m);return m;
}

/*
  LOFT human proportion target:
  floor -> cap top ≈ 2.12 units
  head height ≈ .285 units
  ≈ 7.4 heads tall.
  Target direction = -Z. Golfer faces +X toward the ball.
*/
const hipL=new THREE.Vector3(-.50,.91,-.145),hipR=new THREE.Vector3(-.50,.91,.145);
const kneeL=new THREE.Vector3(-.47,.47,-.19),kneeR=new THREE.Vector3(-.44,.48,.20);
const ankleL=new THREE.Vector3(-.45,.115,-.20),ankleR=new THREE.Vector3(-.40,.115,.21);

const shoulderL=new THREE.Vector3(-.38,1.55,-.205),shoulderR=new THREE.Vector3(-.38,1.55,.205);
const sleeveEndL=new THREE.Vector3(-.24,1.40,-.19),sleeveEndR=new THREE.Vector3(-.23,1.41,.19);
const elbowL=new THREE.Vector3(-.08,1.23,-.16),elbowR=new THREE.Vector3(-.055,1.24,.165);
const handL=new THREE.Vector3(.16,.99,-.045),handR=new THREE.Vector3(.17,.985,.042);

// Lower body: athletic, attainable, clean.
mesh('pelvis',new THREE.SphereGeometry(.28,24,18),ink,[-.50,.94,0],[.92,.64,.72],[0,0,-.025]);
capsule('thighL',hipL,kneeL,.092,ink);capsule('thighR',hipR,kneeR,.092,ink);
capsule('calfL',kneeL,ankleL,.074,ink);capsule('calfR',kneeR,ankleR,.074,ink);
mesh('shoeL',new THREE.BoxGeometry(.34,.115,.17),stone,[-.36,.075,-.205],[1,1,1],[0,-.04,0]);
mesh('shoeR',new THREE.BoxGeometry(.34,.115,.17),stone,[-.30,.075,.215],[1,1,1],[0,.04,0]);

// Polo: three softly intersecting authored volumes make a believable garment silhouette.
mesh('torso',new THREE.SphereGeometry(.37,28,20),cream,[-.42,1.33,0],[.73,.95,.66],[0,0,-.12]);
mesh('chest',new THREE.SphereGeometry(.33,28,20),cream,[-.37,1.52,0],[.84,.52,.73],[0,0,-.09]);
mesh('waist',new THREE.SphereGeometry(.26,24,18),cream,[-.48,1.13,0],[.83,.48,.70],[0,0,-.07]);
mesh('belt',new THREE.CylinderGeometry(.235,.235,.055,24),ink,[-.50,1.03,0],[1,1,.76],[0,0,-.03]);

capsule('sleeveL',shoulderL,sleeveEndL,.084,cream);capsule('sleeveR',shoulderR,sleeveEndR,.084,cream);
capsule('upperArmL',sleeveEndL,elbowL,.058,skin);capsule('upperArmR',sleeveEndR,elbowR,.058,skin);
capsule('foreArmL',elbowL,handL,.050,skin);capsule('foreArmR',elbowR,handR,.050,skin);
mesh('handL',new THREE.SphereGeometry(.063,18,12),skin,[handL.x,handL.y,handL.z],[.88,.95,.72]);
mesh('handR',new THREE.SphereGeometry(.063,18,12),skin,[handR.x,handR.y,handR.z],[.88,.95,.72]);

// Head remains intentionally graphic and understated.
mesh('neck',new THREE.CylinderGeometry(.075,.082,.17,16),skin,[-.42,1.78,0],[1,1,.96],[0,0,-.08]);
mesh('head',new THREE.SphereGeometry(.145,30,22),skin,[-.38,1.975,0],[.87,1.04,.88],[0,0,-.05]);
mesh('jaw',new THREE.SphereGeometry(.112,24,18),skin,[-.35,1.895,0],[.90,.58,.82],[0,0,-.08]);
mesh('nose',new THREE.ConeGeometry(.026,.075,12),skin,[-.247,1.98,0],[1,1,1],[0,0,-Math.PI/2]);
mesh('earL',new THREE.SphereGeometry(.026,14,10),skin,[-.40,1.97,-.121],[.7,1,.55]);
mesh('earR',new THREE.SphereGeometry(.026,14,10),skin,[-.40,1.97,.121],[.7,1,.55]);

mesh('hair',new THREE.SphereGeometry(.148,26,18),hair,[-.40,2.06,0],[.91,.44,.90]);
mesh('capCrown',new THREE.SphereGeometry(.154,28,16),ink,[-.39,2.095,0],[.98,.40,1.02]);
mesh('capBrim',new THREE.BoxGeometry(.165,.026,.118),ink,[-.255,2.075,0],[1,1,1],[0,0,-.04]);
mesh('capSignal',new THREE.SphereGeometry(.017,12,8),orange,[-.285,2.113,-.038]);

mesh('eyeL',new THREE.SphereGeometry(.010,10,8),ink,[-.252,1.998,-.043],[1,1,.7]);
mesh('eyeR',new THREE.SphereGeometry(.010,10,8),ink,[-.252,1.998,.043],[1,1,.7]);
mesh('browL',new THREE.BoxGeometry(.034,.009,.010),hair,[-.258,2.020,-.044],[1,1,1],[0,0,-.05]);
mesh('browR',new THREE.BoxGeometry(.034,.009,.010),hair,[-.258,2.020,.044],[1,1,1],[0,0,-.05]);

// Tiny Flag Orange placket is the only apparel signal.
mesh('placket',new THREE.BoxGeometry(.012,.115,.024),orange,[-.10,1.47,0],[1,1,1],[0,0,-.11]);

// Club is constrained through the paired hands to a real address position.
const gripCenter=handL.clone().lerp(handR,.5);
const clubHeadPos=new THREE.Vector3(.39,.055,0);
const gripEnd=gripCenter.clone().lerp(clubHeadPos,.17);
capsule('grip',gripCenter,gripEnd,.027,ink);
capsule('shaft',gripEnd,clubHeadPos,.013,steel);
mesh('clubHead',new THREE.BoxGeometry(.12,.055,.17),steel,[clubHeadPos.x,clubHeadPos.y,clubHeadPos.z],[1,1,1],[0,.04,-.14]);

const shadow=new THREE.Mesh(new THREE.CircleGeometry(.56,40),new THREE.MeshBasicMaterial({color:0x263128,transparent:true,opacity:.11,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.4,.58,1);shadow.position.set(-.18,.018,0);scene.add(shadow);

const views={
  three:{pos:[3.65,2.28,4.25],target:[-.15,1.08,0]},
  front:{pos:[4.2,2.03,0],target:[-.13,1.08,0]},
  side:{pos:[.18,2.05,4.35],target:[-.22,1.08,0]},
  back:{pos:[-4.2,2.06,0],target:[-.32,1.08,0]}
};
let current='three';
function setView(name){current=name;document.querySelectorAll('.views button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
document.querySelectorAll('.views button').forEach(b=>b.onclick=()=>setView(b.dataset.view));

let cameraPos=new THREE.Vector3(...views.three.pos),cameraTarget=new THREE.Vector3(...views.three.target);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

function tick(){
  const v=views[current];
  cameraPos.lerp(new THREE.Vector3(...v.pos),.09);cameraTarget.lerp(new THREE.Vector3(...v.target),.09);
  camera.position.copy(cameraPos);camera.lookAt(cameraTarget);renderer.render(scene,camera);requestAnimationFrame(tick);
}
tick();