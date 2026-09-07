import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {LoftClubAtelier,CLUB_INSPECTION_VIEWS} from '../prototype1/clubAtelier.js';
import {LoftBallAtelier} from '../prototype1/ballAtelier.js';
import {createClubHead,createClubInspectionModel} from '../prototype1/clubAssembly.js';
import {CLUBS} from '../prototype1/equipment.js';

let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS  '+name);};
globalThis.ResizeObserver=class{observe(){} disconnect(){}};
const attrs=new Map(),origin={insertBefore(canvas){canvas.parentNode=this;}};
const canvas={parentNode:origin,nextSibling:null,tabIndex:0,getAttribute:k=>attrs.get(k)??null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};
let size=new THREE.Vector2(1280,720),draws=0;
const renderer={domElement:canvas,toneMappingExposure:.93,getSize:v=>v.copy(size),setSize:(w,h)=>size.set(w,h),render:()=>draws++};
const makeHost=()=>({rect:{width:600,height:300},attrs:new Map(),listeners:new Map(),
  appendChild(c){c.parentNode=this;},addEventListener(k,v){this.listeners.set(k,v);},
  getBoundingClientRect(){return this.rect;},setAttribute(k,v){this.attrs.set(k,v);},
  classList:{add(){},remove(){}},hasPointerCapture:()=>false});
const host=makeHost(),ballHost=makeHost();
const club=new LoftClubAtelier(renderer,host,{environmentFactory:()=>null}),ball=new LoftBallAtelier(renderer,ballHost);
const settle=()=>{for(let n=0;n<180;n++)club.render(1/60);club.scene.updateMatrixWorld(true);club.camera.updateMatrixWorld(true);};

check('all forty inspection heads share the held factory buffers, materials and native transforms',()=>{
  for(const item of CLUBS)for(const level of [1,10,25,50,75]){
    const held=createClubHead(item,level).head,model=createClubInspectionModel(item,level),shown=model.getObjectByName('LOFT_OBJECT_HEAD');
    assert.equal(held.children.length,shown.children.length);
    for(let i=0;i<held.children.length;i++){
      const a=held.children[i],b=shown.children[i];
      assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);
      assert.deepEqual(a.position.toArray(),b.position.toArray());assert.deepEqual(a.quaternion.toArray(),b.quaternion.toArray());assert.deepEqual(a.scale.toArray(),b.scale.toArray());
    }
  }
});
check('one renderer cannot be borrowed by two inspectors and always returns to the true course parent',()=>{
  club.select(CLUBS[3],1);assert.equal(club.scene,null,'selection before opening is lazy');
  club.open();assert.equal(canvas.parentNode,host);assert.throws(()=>ball.open(),/Close the current atelier/);
  assert.equal(canvas.parentNode,host);club.close();assert.equal(canvas.parentNode,origin);
  ball.open();assert.equal(canvas.parentNode,ballHost);assert.throws(()=>club.open(),/Close the current atelier/);
  ball.close();club.open();club.close();assert.equal(canvas.parentNode,origin);
  assert.equal(canvas.tabIndex,0);assert.deepEqual(size.toArray(),[1280,720]);assert.equal(renderer.toneMappingExposure,.93);
});
check('every actual head and full assembly fits desktop, portrait and landscape at all inspection presets',()=>{
  club.open();
  for(const item of CLUBS)for(const level of [1,10,25,50,75]){
    club.select(item,level);
    for(const [w,h] of [[600,300],[320,205],[380,125]])for(const view of Object.keys(CLUB_INSPECTION_VIEWS)){
      host.rect={width:w,height:h};club.setView(view,true);settle();
      const bounds=view==='full'?club.fullBounds:club.headBounds;
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=club.model.localToWorld(new THREE.Vector3(x,y,z)).project(club.camera);
        assert.ok(Math.abs(p.x)<.94&&Math.abs(p.y)<.94&&p.z>-1&&p.z<1,`${item.id}/${level}/${view}/${w} clipped: ${p.toArray()}`);
      }
    }
  }
  club.close();
});
check('selection discards nodes without disposing shared assets and stationary inspection does not draw',()=>{
  club.open();club.select(CLUBS[3],1);settle();
  const old=club.model,shared=old.getObjectByName('LOFT_OBJECT_HEAD').children[0].geometry;
  let disposals=0,instanceDisposals=0;shared.addEventListener('dispose',()=>disposals++);
  old.traverse(node=>{if(node.isInstancedMesh)node.addEventListener('dispose',()=>instanceDisposals++);});
  club.select(CLUBS[7],75);settle();assert.equal(old.parent,null);assert.equal(disposals,0);
  assert.equal(instanceDisposals,1,'replaced groove matrices are released, not leaked');
  const count=draws;club.render(1/60);assert.equal(draws,count);
  for(let i=0;i<100;i++)club.zoom(-1);assert.equal(club.targetDistance,.82);
  for(let i=0;i<100;i++)club.zoom(1);assert.equal(club.targetDistance,1.65);
  club.yaw=8*Math.PI+.3;club.reset();assert.ok(Math.abs(club.targetYaw-club.yaw)<Math.PI);
  club.close();assert.equal(disposals,0);assert.equal(canvas.parentNode,origin);
});
check('Workshop wiring previews actual clubs without equipping and closes the previous owner first',()=>{
  const game=readFileSync(new URL('../prototype1/game.js',import.meta.url),'utf8');
  const hero=game.slice(game.indexOf('function syncBagHero()'),game.indexOf('function syncBag()'));
  assert.match(hero,/clubAtelier\.select\(c,state.level\)/);assert.doesNotMatch(hero,/golfer\.setClub|state\.clubId\s*=|hero:true/);
  const categories=game.slice(game.indexOf('function showBagCategory('),game.indexOf('function restoreCourseCanvas('));
  assert.match(categories,/if\(ball\)clubAtelier.close\(\);else ballAtelier.close\(\)/);
  assert.equal((game.match(/new THREE.WebGLRenderer/g)||[]).length,1);
  assert.match(game,/const wasInspecting=ballAtelier.active\|\|clubAtelier.active/);
  assert.match(game,/if\(clubAtelier.active\)\{clubAtelier.render\(dt\)/);
});
delete globalThis.ResizeObserver;
console.log(`\nLOFT ATELIER GAUNTLET: ${passed}/${passed} PASS`);
