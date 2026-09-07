import * as THREE from '../vendor/three.module.js';
import {LoftObjectAtelier} from './objectAtelier.js';
import {createClubInspectionModel,releaseClubInstance} from './clubAssembly.js';

export const CLUB_ATELIER_SPEC=Object.freeze({
  system:'LOFT_LIVE_CLUB_ATELIER_V1',fieldOfView:32,distance:1,minDistance:.82,
  maxDistance:1.65,maxPitch:Math.PI*.48,damping:12,zoomStep:.10,exposure:1,
  label:'Actual LOFT club, interactive 3D inspection',environmentWidth:256
});
export const CLUB_INSPECTION_VIEWS=Object.freeze({
  craft:Object.freeze({yaw:-.40,pitch:.24,full:false}),
  face:Object.freeze({yaw:Math.PI-.12,pitch:.04,full:false}),
  sole:Object.freeze({yaw:-.22,pitch:-1.16,full:false}),
  full:Object.freeze({yaw:-.30,pitch:.10,full:true})
});

// A small, local radiance field for honest steel reflections. It belongs to this
// scene, never to the shared club materials or the playing world. No downloaded
// HDR, second context, background scene or persistent render loop is required.
export function buildClubStudioEnvironment(renderer){
  const w=CLUB_ATELIER_SPEC.environmentWidth,h=w/2,data=new Uint16Array(w*h*4);
  const panels=[
    {direction:new THREE.Vector3(-.7,.55,.8).normalize(),color:[3.0,2.65,2.20],power:28},
    {direction:new THREE.Vector3(.7,.15,-.4).normalize(),color:[1.25,1.65,1.8],power:46},
    {direction:new THREE.Vector3(.2,.9,-.1).normalize(),color:[1.4,1.4,1.25],power:9}
  ];
  const dir=new THREE.Vector3();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const theta=Math.PI*(y+.5)/h,phi=2*Math.PI*(x+.5)/w;
    dir.set(-Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
    const light=[.055,.068,.067];
    for(const panel of panels){const strength=Math.pow(Math.max(0,dir.dot(panel.direction)),panel.power);for(let c=0;c<3;c++)light[c]+=strength*panel.color[c];}
    const i=(y*w+x)*4;
    for(let c=0;c<3;c++)data[i+c]=THREE.DataUtils.toHalfFloat(light[c]);
    data[i+3]=THREE.DataUtils.toHalfFloat(1);
  }
  const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.HalfFloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const generator=new THREE.PMREMGenerator(renderer);
  try{return generator.fromEquirectangular(texture);}finally{generator.dispose();texture.dispose();}
}

export class LoftClubAtelier extends LoftObjectAtelier{
  constructor(renderer,host,{environmentFactory=buildClubStudioEnvironment}={}){
    super(renderer,host,CLUB_ATELIER_SPEC);
    this.environmentFactory=environmentFactory;this.selection=null;this.model=null;
    this.view='craft';this.focus=new THREE.Vector3();this.targetFocus=new THREE.Vector3();
    this.radius=.08;this.targetRadius=.08;
  }
  _build(){
    if(this.scene)return;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111819);
    this.camera=new THREE.PerspectiveCamera(this.spec.fieldOfView,1,.001,20);
    this.scene.add(new THREE.HemisphereLight(0xf8eedc,0x667578,.85));
    const key=new THREE.DirectionalLight(0xffead0,3.0);key.position.set(-2,3,4);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xd6e8ef,1.8);fill.position.set(3,1,1);this.scene.add(fill);
    const rim=new THREE.DirectionalLight(0xf0eee4,2);rim.position.set(1,2,-3);this.scene.add(rim);
    this.environment=this.environmentFactory(this.renderer);
    if(this.environment)this.scene.environment=this.environment.texture;
    this.object=new THREE.Group();this.scene.add(this.object);
    this.nativeFrame=new THREE.Group();
    // Native X/Y/Z face-to-back / heel-to-toe / sole-to-grip becomes Z/X/Y.
    this.nativeFrame.setRotationFromMatrix(new THREE.Matrix4().set(0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,1));
    this.object.add(this.nativeFrame);
    this._buildSelection();
  }
  select(club,level){
    if(this.selection?.id===club.id&&this.selection.level===level)return;
    this.selection={id:club.id,club,level};
    if(this.scene)this._buildSelection();
  }
  _buildSelection(){
    if(!this.selection)return;
    // Only transform nodes are discarded. Factory-owned geometry and material
    // stay shared with the golfer and are never disposed by the inspector.
    if(this.model)releaseClubInstance(this.model);
    this.model=createClubInspectionModel(this.selection.club,this.selection.level);
    this.nativeFrame.add(this.model);
    this.model.updateWorldMatrix(false,true);
    // Read local canonical bounds, not an inherited camera or animated pose.
    const head=this.model.getObjectByName('LOFT_OBJECT_HEAD');
    this.model.removeFromParent();this.model.updateMatrixWorld(true);
    this.headBounds=new THREE.Box3().setFromObject(head);
    this.fullBounds=new THREE.Box3().setFromObject(this.model);
    this.nativeFrame.add(this.model);
    this.setView('craft',true);
    this.host.setAttribute('aria-label',this.selection.club.name+' 3D object. Drag or use arrows to rotate. Home resets.');
  }
  setView(view,immediate=false){
    let pose=CLUB_INSPECTION_VIEWS[view];if(!pose||!this.model)return;
    if(view==='craft'){
      const family=this.selection.club.head;
      if(family==='putter')pose={...pose,yaw:-.65,pitch:.93};
      else if(['driver','wood','hybrid'].includes(family))pose={...pose,yaw:-.65,pitch:.60};
    }
    this.view=view;
    const box=pose.full?this.fullBounds:this.headBounds;
    box.getCenter(this.targetFocus);
    this.targetRadius=box.getSize(new THREE.Vector3()).length()*.5;
    // Shortest route to a deliberate inspection view; no multi-turn unwinding.
    this.targetYaw=this.yaw+Math.atan2(Math.sin(pose.yaw-this.yaw),Math.cos(pose.yaw-this.yaw));
    this.targetPitch=pose.pitch;this.targetDistance=1;
    if(immediate){this.yaw=this.targetYaw;this.pitch=this.targetPitch;this.distance=1;this.focus.copy(this.targetFocus);this.radius=this.targetRadius;}
    this.dirty=true;
  }
  reset(){this.setView('craft');}
  _pose(factor){
    this.focus.lerp(this.targetFocus,factor);this.radius+=(this.targetRadius-this.radius)*factor;
    this.model.position.copy(this.focus).multiplyScalar(-1);
    this.object.rotation.set(this.pitch,this.yaw,-.14,'YXZ');
    const halfV=THREE.MathUtils.degToRad(this.spec.fieldOfView)*.5;
    const halfH=Math.atan(Math.tan(halfV)*this.camera.aspect);
    // Sphere fit protects all head corners at every rotation and aspect. Full
    // view frames the entire real shaft/grip; head view deliberately crops it.
    const fit=this.radius/Math.sin(Math.min(halfV,halfH)) * 1.12;
    this.camera.position.set(0,0,fit*this.distance);this.camera.lookAt(0,0,0);
    return this.focus.distanceTo(this.targetFocus)+Math.abs(this.targetRadius-this.radius)>.00001;
  }
}
