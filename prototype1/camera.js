import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));
const TAU=Math.PI*2;
const wrap=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;};
const smoothAngle=(a,b,r,dt)=>a+wrap(b-a)*(1-Math.exp(-r*dt));

export const CAMERA_MODE=Object.freeze({
  AIM:'aim',
  SWING:'swing_lock',
  FLIGHT:'flight',
  RESULT:'result'
});

export class LoftCamera{
  constructor(camera,{terrainHeight=()=>0}={}){
    this.camera=camera;
    this.terrainHeight=terrainHeight;
    this.camera.up.set(0,1,0);

    this.mode=CAMERA_MODE.AIM;
    this.transition=1;

    this.pos=new THREE.Vector3();
    this.look=new THREE.Vector3();
    this.initialized=false;

    // AIM: heading itself comes from game aim. These are only composition controls.
    this.aimPitch=.14;
    this.aimPitchT=.14;
    this.aimDist=8.9;
    this.aimDistT=8.9;

    // FLIGHT is intentionally automatic. We smooth toward ball velocity rather
    // than letting pointer input create accidental cinematic angles mid-shot.
    this.flightHeading=0;
    this.flightPitch=.18;
    this.flightDist=10.0;

    // RESULT regains semi-free inspection around the final lie.
    this.resultOrbit=0;
    this.resultOrbitT=0;
    this.resultPitch=.20;
    this.resultPitchT=.20;
    this.resultDist=7.3;
    this.resultDistT=7.3;

    this.lockedAimYaw=0;
    this.lastMode=CAMERA_MODE.AIM;
  }

  get isSwingLocked(){return this.mode===CAMERA_MODE.SWING;}
  get isShotLocked(){return this.mode===CAMERA_MODE.SWING||this.mode===CAMERA_MODE.FLIGHT;}

  _enter(mode){
    if(this.mode===mode)return;
    this.lastMode=this.mode;
    this.mode=mode;
    this.transition=0;
  }

  resetAim(){
    this._enter(CAMERA_MODE.AIM);
    this.aimPitchT=.14;
    this.aimDistT=8.9;
    this.resultOrbit=this.resultOrbitT=0;
  }

  beginSwing(aimYaw){
    this.lockedAimYaw=aimYaw;
    this._enter(CAMERA_MODE.SWING);
  }

  cancelSwing(){
    this._enter(CAMERA_MODE.AIM);
  }

  beginFlight(aimYaw){
    this.lockedAimYaw=aimYaw;
    this.flightHeading=aimYaw;
    this._enter(CAMERA_MODE.FLIGHT);
  }

  beginResult(ball,pin){
    const toPin=pin.clone().sub(ball);toPin.y=0;
    if(toPin.lengthSq()>.01)this.flightHeading=Math.atan2(toPin.x,-toPin.z);
    this.resultOrbit=this.resultOrbitT=0;
    this.resultPitch=this.resultPitchT=.20;
    this.resultDist=this.resultDistT=7.3;
    this._enter(CAMERA_MODE.RESULT);
  }

  aimPitchBy(dy){
    if(this.mode!==CAMERA_MODE.AIM)return;
    this.aimPitchT=clamp(this.aimPitchT+dy*.00235,-.035,.34);
  }

  aimZoom(delta){
    if(this.mode!==CAMERA_MODE.AIM)return;
    this.aimDistT=clamp(this.aimDistT*Math.exp(-delta*.0019),7.0,11.4);
  }

  resultOrbitBy(dx,dy){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultOrbitT=clamp(this.resultOrbitT-dx*.0038,-.58,.58);
    this.resultPitchT=clamp(this.resultPitchT+dy*.0023,-.02,.42);
  }

  resultZoom(delta){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultDistT=clamp(this.resultDistT*Math.exp(-delta*.0018),5.8,9.8);
  }

  _setFov(target,dt){
    const next=smooth(this.camera.fov,target,8,dt);
    if(Math.abs(next-this.camera.fov)>.002){
      this.camera.fov=next;
      this.camera.updateProjectionMatrix();
    }
  }

  _safeY(v,minAbove=1.15){
    const ground=this.terrainHeight(v.x,v.z);
    v.y=Math.max(v.y,ground+minAbove);
    return v;
  }

  _commit(desiredPos,desiredLook,posRate,lookRate,dt){
    this.transition=clamp(this.transition+dt*4.5,0,1);
    if(!this.initialized){
      this.pos.copy(desiredPos);
      this.look.copy(desiredLook);
      this.initialized=true;
    }else{
      this.pos.lerp(desiredPos,1-Math.exp(-posRate*dt));
      this.look.lerp(desiredLook,1-Math.exp(-lookRate*dt));
    }
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }

  updateAim(dt,{ball,aimYaw}){
    if(this.mode!==CAMERA_MODE.AIM)this._enter(CAMERA_MODE.AIM);
    this.aimPitch=smooth(this.aimPitch,this.aimPitchT,10,dt);
    this.aimDist=smooth(this.aimDist,this.aimDistT,11,dt);
    this._setFov(39.5,dt);

    const forward=new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    // Deliberately trailing, not a free 360° orbit. This prevents accidental
    // front-on / side-on address angles while still letting heading change freely.
    const desiredPos=ball.clone()
      .addScaledVector(forward,-this.aimDist*.91)
      .addScaledVector(right,this.aimDist*.24)
      .add(new THREE.Vector3(0,1.78+this.aimPitch*3.65,0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,2.15)
      .add(new THREE.Vector3(0,.63,0));

    this._safeY(desiredPos,1.15);
    this._commit(desiredPos,desiredLook,10.5,11.5,dt);
  }

  updateSwing(dt,{ball,swingProgress=0}){
    if(this.mode!==CAMERA_MODE.SWING)return;
    this._setFov(40.5,dt);

    const forward=new THREE.Vector3(Math.sin(this.lockedAimYaw),0,-Math.cos(this.lockedAimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    // The swing camera is a fixed cinematic rail around the BALL. The only
    // movement is a tiny authored push through impact, never user input.
    const impactPulse=Math.exp(-Math.pow((swingProgress-.58)/.14,2));
    const desiredPos=ball.clone()
      .addScaledVector(forward,-6.28+impactPulse*.18)
      .addScaledVector(right,2.58)
      .add(new THREE.Vector3(0,2.42-impactPulse*.05,0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,1.10+impactPulse*.25)
      .add(new THREE.Vector3(0,.64,0));

    this._safeY(desiredPos,1.22);
    this._commit(desiredPos,desiredLook,16,17,dt);
  }

  updateFlight(dt,{ball,velocity,pin}){
    if(this.mode!==CAMERA_MODE.FLIGHT)return;
    this._setFov(42.5,dt);

    const horizontal=velocity.clone();horizontal.y=0;
    let desiredHeading=this.flightHeading;
    if(horizontal.lengthSq()>.035)desiredHeading=Math.atan2(horizontal.x,-horizontal.z);

    // Follow actual ball direction, but cap how fast the camera is allowed to
    // yaw. This removes sudden corkscrew / side-angle changes from spin or bounce.
    this.flightHeading=smoothAngle(this.flightHeading,desiredHeading,4.2,dt);

    const speed=horizontal.length();
    const height=Math.max(0,ball.y-this.terrainHeight(ball.x,ball.z));
    const dynamicDist=clamp(8.4+speed*.045+height*.025,8.6,12.8);
    this.flightDist=smooth(this.flightDist,dynamicDist,4.5,dt);

    const forward=new THREE.Vector3(Math.sin(this.flightHeading),0,-Math.cos(this.flightHeading)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    const desiredPos=ball.clone()
      .addScaledVector(forward,-this.flightDist*.86)
      .addScaledVector(right,this.flightDist*.16)
      .add(new THREE.Vector3(0,2.85+clamp(height*.09,0,2.1),0));

    const toPin=pin.clone().sub(ball);toPin.y=0;
    const pinBias=toPin.lengthSq()>.01?toPin.normalize():forward;
    const desiredLook=ball.clone()
      .addScaledVector(forward,.95)
      .addScaledVector(pinBias,.35)
      .add(new THREE.Vector3(0,.12,0));

    this._safeY(desiredPos,1.3);
    this._commit(desiredPos,desiredLook,7.4,9.6,dt);
  }

  updateResult(dt,{ball,pin}){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultOrbit=smooth(this.resultOrbit,this.resultOrbitT,8.5,dt);
    this.resultPitch=smooth(this.resultPitch,this.resultPitchT,8.5,dt);
    this.resultDist=smooth(this.resultDist,this.resultDistT,9,dt);
    this._setFov(39.5,dt);

    const toPin=pin.clone().sub(ball);toPin.y=0;
    const base=toPin.lengthSq()>.01?Math.atan2(toPin.x,-toPin.z):this.flightHeading;
    const yaw=base+this.resultOrbit;

    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
    const pinDir=toPin.lengthSq()>.01?toPin.normalize():new THREE.Vector3(Math.sin(base),0,-Math.cos(base));

    const desiredPos=ball.clone()
      .addScaledVector(forward,-this.resultDist)
      .add(new THREE.Vector3(0,2.28+this.resultPitch*3.25,0));

    const desiredLook=ball.clone()
      .addScaledVector(pinDir,1.75)
      .add(new THREE.Vector3(0,.16,0));

    this._safeY(desiredPos,1.12);
    this._commit(desiredPos,desiredLook,7.2,8.2,dt);
  }
}
