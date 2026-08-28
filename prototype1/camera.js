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
    this.pos=new THREE.Vector3();
    this.look=new THREE.Vector3();
    this.initialized=false;

    this.aimPitch=.12;this.aimPitchT=.12;
    this.aimDist=8.7;this.aimDistT=8.7;

    this.flightHeading=0;
    this.flightDist=9.7;

    this.resultOrbit=0;this.resultOrbitT=0;
    this.resultPitch=.18;this.resultPitchT=.18;
    this.resultDist=5.9;this.resultDistT=5.9;

    this.lockedAimYaw=0;
    this.impactKick=0;
    this.resultCup=false;
  }

  get isSwingLocked(){return this.mode===CAMERA_MODE.SWING;}
  get isShotLocked(){return this.mode===CAMERA_MODE.SWING||this.mode===CAMERA_MODE.FLIGHT;}

  _enter(mode){this.mode=mode;}

  resetAim(){
    this._enter(CAMERA_MODE.AIM);
    this.aimPitchT=.12;
    this.aimDistT=8.7;
    this.resultOrbit=this.resultOrbitT=0;
    this.impactKick=0;
  }

  beginSwing(aimYaw){
    this.lockedAimYaw=aimYaw;
    this._enter(CAMERA_MODE.SWING);
  }

  cancelSwing(){this._enter(CAMERA_MODE.AIM);}

  beginFlight(aimYaw){
    this.lockedAimYaw=aimYaw;
    this.flightHeading=aimYaw;
    this._enter(CAMERA_MODE.FLIGHT);
  }

  beginResult(ball,pin,{cup=false}={}){
    const toPin=pin.clone().sub(ball);toPin.y=0;
    if(toPin.lengthSq()>.01)this.flightHeading=Math.atan2(toPin.x,-toPin.z);
    this.resultCup=cup;
    this.resultOrbit=this.resultOrbitT=0;
    this.resultPitch=this.resultPitchT=cup?.06:.18;
    this.resultDist=this.resultDistT=cup?3.25:5.9;
    this._enter(CAMERA_MODE.RESULT);
  }

  impact(amount=1){
    this.impactKick=clamp(amount,0,1.25);
  }

  aimPitchBy(dy){
    if(this.mode!==CAMERA_MODE.AIM)return;
    this.aimPitchT=clamp(this.aimPitchT+dy*.00215,-.02,.30);
  }

  aimZoom(delta){
    if(this.mode!==CAMERA_MODE.AIM)return;
    this.aimDistT=clamp(this.aimDistT*Math.exp(-delta*.0018),7.2,10.8);
  }

  resultOrbitBy(dx,dy){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultOrbitT=clamp(this.resultOrbitT-dx*.0033,-.50,.50);
    this.resultPitchT=clamp(this.resultPitchT+dy*.0021,0,.36);
  }

  resultZoom(delta){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultDistT=clamp(this.resultDistT*Math.exp(-delta*.0017),4.8,8.0);
  }

  _setFov(target,dt){
    const next=smooth(this.camera.fov,target,9,dt);
    if(Math.abs(next-this.camera.fov)>.002){
      this.camera.fov=next;
      this.camera.updateProjectionMatrix();
    }
  }

  _safeY(v,minAbove=1.1){
    const ground=this.terrainHeight(v.x,v.z);
    v.y=Math.max(v.y,ground+minAbove);
    return v;
  }

  _commit(desiredPos,desiredLook,posRate,lookRate,dt){
    if(!this.initialized){
      this.pos.copy(desiredPos);this.look.copy(desiredLook);this.initialized=true;
    }else{
      this.pos.lerp(desiredPos,1-Math.exp(-posRate*dt));
      this.look.lerp(desiredLook,1-Math.exp(-lookRate*dt));
    }
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }

  updateAim(dt,{ball,aimYaw,putting=false}){
    if(this.mode!==CAMERA_MODE.AIM)this._enter(CAMERA_MODE.AIM);
    this.aimPitch=smooth(this.aimPitch,this.aimPitchT,10,dt);
    this.aimDist=smooth(this.aimDist,this.aimDistT,11,dt);
    this._setFov(putting ? 36.6 : 38.5,dt);

    const forward=new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    // PUTT READ: camera axis is the intended roll axis.
    // No cinematic side angle here — the player must visually trust that
    // straight on screen means straight in the simulation.
    const viewDist=putting ? clamp(5.9+(this.aimDist-8.7)*.30,5.15,6.45) : this.aimDist;
    const desiredPos=ball.clone()
      .addScaledVector(forward,-viewDist*(putting ? .985 : .93))
      .addScaledVector(right,putting ? .06 : viewDist*.024)
      .add(new THREE.Vector3(0,(putting ? 1.24 : 1.70)+this.aimPitch*(putting ? 1.72 : 3.45),0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,putting ? 2.45 : 2.85)
      .add(new THREE.Vector3(0,putting ? .16 : .58,0));

    this._safeY(desiredPos,1.12);
    this._commit(desiredPos,desiredLook,11.5,12.5,dt);
  }

  updateSwing(dt,{ball,swingProgress=0,putting=false}){
    if(this.mode!==CAMERA_MODE.SWING)return;
    this._setFov(putting ? 36.8 : 39.2,dt);

    const forward=new THREE.Vector3(Math.sin(this.lockedAimYaw),0,-Math.cos(this.lockedAimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    const turn=Math.sin(clamp(swingProgress,0,1)*Math.PI);
    const impactPulse=Math.exp(-Math.pow((swingProgress-.58)/.12,2));
    const desiredPos=ball.clone()
      .addScaledVector(forward,putting ? (-5.70+impactPulse*.04) : (-6.55+impactPulse*.16))
      .addScaledVector(right,putting ? .07 : (1.12+turn*.14))
      .add(new THREE.Vector3(0,putting ? (1.25-impactPulse*.015) : (2.28-impactPulse*.04),0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,putting ? (2.20+impactPulse*.08) : (1.55+impactPulse*.22))
      .add(new THREE.Vector3(0,putting ? .16 : .58,0));

    this._safeY(desiredPos,1.18);
    this._commit(desiredPos,desiredLook,17,18,dt);
  }

  updateFlight(dt,{ball,velocity,pin,putting=false}){
    if(this.mode!==CAMERA_MODE.FLIGHT)return;

    this.impactKick=smooth(this.impactKick,0,13,dt);
    this._setFov(41.8+this.impactKick*1.15,dt);

    const horizontal=velocity.clone();horizontal.y=0;
    let desiredHeading=this.flightHeading;
    if(horizontal.lengthSq()>.035)desiredHeading=Math.atan2(horizontal.x,-horizontal.z);
    this.flightHeading=smoothAngle(this.flightHeading,desiredHeading,4.0,dt);

    const speed=horizontal.length();
    const height=Math.max(0,ball.y-this.terrainHeight(ball.x,ball.z));
    const rolling=height<.28&&speed<8.0;
    const dynamicDist=putting ? clamp(3.8+speed*.34,3.9,5.5) : (rolling ? clamp(4.9+speed*.28,5.0,7.1) : clamp(8.2+speed*.045+height*.022,8.4,12.3));
    this.flightDist=smooth(this.flightDist,dynamicDist,rolling?6.2:4.8,dt);

    const forward=new THREE.Vector3(Math.sin(this.flightHeading),0,-Math.cos(this.flightHeading)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();

    const desiredPos=ball.clone()
      .addScaledVector(forward,-this.flightDist*.88-this.impactKick*.28)
      .addScaledVector(right,this.flightDist*(putting ? .012 : (rolling ? .045 : .095)))
      .add(new THREE.Vector3(0,(putting ? .92 : (rolling ? 1.58 : 2.70))+clamp(height*.085,0,1.95)+this.impactKick*.05,0));

    const toPin=pin.clone().sub(ball);toPin.y=0;
    const pinBias=toPin.lengthSq()>.01?toPin.normalize():forward;
    const desiredLook=ball.clone()
      .addScaledVector(forward,1.00)
      .addScaledVector(pinBias,.30)
      .add(new THREE.Vector3(0,.10,0));

    this._safeY(desiredPos,1.25);
    this._commit(desiredPos,desiredLook,7.8,10.0,dt);
  }

  updateResult(dt,{ball,pin}){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultOrbit=smooth(this.resultOrbit,this.resultOrbitT,8.5,dt);
    this.resultPitch=smooth(this.resultPitch,this.resultPitchT,8.5,dt);
    this.resultDist=smooth(this.resultDist,this.resultDistT,9,dt);
    this._setFov(this.resultCup?34.5:38.0,dt);

    const toPin=pin.clone().sub(ball);toPin.y=0;
    const base=toPin.lengthSq()>.01?Math.atan2(toPin.x,-toPin.z):this.flightHeading;
    const yaw=base+this.resultOrbit;

    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
    const pinDir=toPin.lengthSq()>.01?toPin.normalize():new THREE.Vector3(Math.sin(base),0,-Math.cos(base));

    const desiredPos=ball.clone()
      .addScaledVector(forward,-this.resultDist)
      .add(new THREE.Vector3(0,1.65+this.resultPitch*2.45,0));

    const desiredLook=ball.clone()
      .addScaledVector(pinDir,this.resultCup?.32:.95)
      .add(new THREE.Vector3(0,this.resultCup?.06:.10,0));

    this._safeY(desiredPos,1.08);
    this._commit(desiredPos,desiredLook,7.4,8.6,dt);
  }
}
