import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));
const TAU=Math.PI*2;
const wrap=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;};
const smoothAngle=(a,b,r,dt)=>a+wrap(b-a)*(1-Math.exp(-r*dt));
const AIM_REBASE_DISTANCE=32;

export const CAMERA_MODE=Object.freeze({
  AIM:'aim',
  SWING:'swing_lock',
  FLIGHT:'flight',
  RESULT:'result'
});

export const CAMERA_COMPOSITION_SPEC=Object.freeze({
  system:'LOFT_MOBILE_COMPOSITION_V1',
  portraitFull:0.50,
  portraitRelease:0.82,
  wideStart:1.72,
  wideFull:2.10,
  puttingDistance:5.0,
  puttingLateralShift:0.31,
  puttingWideShift:-0.12,
  puttingLookLift:0.42
});

// Portrait putting needs a deliberately off-centre frame: ball and cup remain
// decision-scale on the right while the complete golfer stays clear of the HUD.
// Landscape and desktop naturally release back to the neutral optical axis.
export function cameraCompositionProfile(aspect,putting=false){
  const safeAspect=clamp(Number.isFinite(aspect)?aspect:1,0.42,2.40);
  const portrait=clamp(
    (CAMERA_COMPOSITION_SPEC.portraitRelease-safeAspect)/
    (CAMERA_COMPOSITION_SPEC.portraitRelease-CAMERA_COMPOSITION_SPEC.portraitFull),
    0,1
  );
  const wide=clamp(
    (safeAspect-CAMERA_COMPOSITION_SPEC.wideStart)/
    (CAMERA_COMPOSITION_SPEC.wideFull-CAMERA_COMPOSITION_SPEC.wideStart),
    0,1
  );
  return Object.freeze({
    portrait,
    wide,
    lateralShift:putting?
      CAMERA_COMPOSITION_SPEC.puttingLateralShift*portrait+CAMERA_COMPOSITION_SPEC.puttingWideShift*wide:
      0,
    lookLift:putting?CAMERA_COMPOSITION_SPEC.puttingLookLift:0
  });
}

export class LoftCamera{
  constructor(camera,{terrainHeight=()=>0}={}){
    this.camera=camera;
    this.terrainHeight=terrainHeight;
    this.camera.up.set(0,1,0);

    this.mode=CAMERA_MODE.AIM;
    this.pos=new THREE.Vector3();
    this.look=new THREE.Vector3();
    this.initialized=false;

    this.aimPitch=.10;this.aimPitchT=.10;
    this.aimDist=8.4;this.aimDistT=8.4;
    this.puttDist=CAMERA_COMPOSITION_SPEC.puttingDistance;this.puttDistT=CAMERA_COMPOSITION_SPEC.puttingDistance;
    this.puttingActive=false;this.swingDist=8.4;

    this.flightHeading=0;
    this.flightDist=9.7;

    this.resultOrbit=0;this.resultOrbitT=0;
    this.resultPitch=.18;this.resultPitchT=.18;
    this.resultDist=5.4;this.resultDistT=5.4;

    this.lockedAimYaw=0;
    this.impactKick=0;
    this.resultCup=false;
    this.resultNear=false;
    this.aimRebasePending=false;
  }

  get isSwingLocked(){return this.mode===CAMERA_MODE.SWING;}
  get isShotLocked(){return this.mode===CAMERA_MODE.SWING||this.mode===CAMERA_MODE.FLIGHT;}

  _enter(mode){this.mode=mode;}

  resetAim(){
    this._enter(CAMERA_MODE.AIM);
    this.aimPitchT=.10;
    this.aimDistT=8.4;
    this.puttDistT=CAMERA_COMPOSITION_SPEC.puttingDistance;
    this.resultOrbit=this.resultOrbitT=0;
    this.impactKick=0;
    // A reset can mean either a local framing adjustment or a true world cut
    // (next hole, replay, long drop, deterministic fixture). Defer that choice
    // until the next authored aim pose is known so local resets stay fluid.
    this.aimRebasePending=true;
  }

  beginSwing(aimYaw){
    this.lockedAimYaw=aimYaw;
    this.swingDist=this.puttingActive?this.puttDist:this.aimDist;
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
    const dist=toPin.length();
    this.resultCup=cup;
    this.resultNear=dist<2.2;
    this.resultOrbit=this.resultOrbitT=0;
    this.resultPitch=this.resultPitchT=cup?.18:(this.resultNear?.22:.16);
    this.resultDist=this.resultDistT=cup?4.0:(this.resultNear?4.4:5.4);
    this._enter(CAMERA_MODE.RESULT);
  }

  impact(amount=1){
    this.impactKick=clamp(amount,0,1.25);
  }

  aimPitchBy(dy){
    if(this.mode!==CAMERA_MODE.AIM)return;
    this.aimPitchT=clamp(this.aimPitchT+dy*.0020,-.08,.34);
  }

  aimZoom(delta){
    if(this.mode!==CAMERA_MODE.AIM)return;
    if(this.puttingActive)this.puttDistT=clamp(this.puttDistT*Math.exp(-delta*.0019),3.0,7.2);
    else this.aimDistT=clamp(this.aimDistT*Math.exp(-delta*.0018),4.8,12.0);
  }

  resultOrbitBy(dx,dy){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultOrbitT=clamp(this.resultOrbitT-dx*.0033,-.50,.50);
    this.resultPitchT=clamp(this.resultPitchT+dy*.0021,0,.36);
  }

  resultZoom(delta){
    if(this.mode!==CAMERA_MODE.RESULT)return;
    this.resultDistT=clamp(this.resultDistT*Math.exp(-delta*.0017),3.2,9.0);
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

  _clearSight(pos,look,clearance=.38){
    let lift=0;
    for(let i=1;i<=6;i++){
      const t=i/7;
      const x=lerp(pos.x,look.x,t),z=lerp(pos.z,look.z,t),rayY=lerp(pos.y,look.y,t);
      lift=Math.max(lift,this.terrainHeight(x,z)+clearance-rayY);
    }
    if(lift>0)pos.y+=Math.min(1.35,lift);
    return pos;
  }

  _commit(desiredPos,desiredLook,posRate,lookRate,dt){
    const rebaseDistanceSq=AIM_REBASE_DISTANCE*AIM_REBASE_DISTANCE;
    const rebase=this.aimRebasePending&&this.initialized&&(
      this.pos.distanceToSquared(desiredPos)>rebaseDistanceSq||
      this.look.distanceToSquared(desiredLook)>rebaseDistanceSq
    );
    this.aimRebasePending=false;
    if(!this.initialized||rebase){
      this.pos.copy(desiredPos);this.look.copy(desiredLook);this.initialized=true;
    }else{
      this.pos.lerp(desiredPos,1-Math.exp(-posRate*dt));
      this.look.lerp(desiredLook,1-Math.exp(-lookRate*dt));
    }
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }

  updateAim(dt,{ball,pin=null,aimYaw,putting=false}){
    if(this.mode!==CAMERA_MODE.AIM)this._enter(CAMERA_MODE.AIM);
    this.puttingActive=putting;
    this.aimPitch=smooth(this.aimPitch,this.aimPitchT,6.6,dt);
    this.aimDist=smooth(this.aimDist,this.aimDistT,6.0,dt);
    this.puttDist=smooth(this.puttDist,this.puttDistT,6.0,dt);
    this._setFov(putting ? 37.8 : 40.0,dt);

    const forward=new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();
    const composition=cameraCompositionProfile(this.camera.aspect,putting);

    // PUTT READ: camera axis is the intended roll axis.
    // No cinematic side angle here — the player must visually trust that
    // straight on screen means straight in the simulation.
    const pinDistance=pin?Math.hypot(pin.x-ball.x,pin.z-ball.z):999;
    const viewDist=putting?this.puttDist:this.aimDist;
    const lookAhead=putting?clamp(Math.min(pinDistance,viewDist*.55),.55,2.4):2.95;
    const desiredPos=ball.clone()
      .addScaledVector(forward,-viewDist*(putting ? 1.0 : .93))
      .addScaledVector(right,putting ? (.035+composition.lateralShift) : clamp(viewDist*.058,.32,.62))
      .add(new THREE.Vector3(0,(putting ? (.68+viewDist*.105) : 1.68)+this.aimPitch*(putting ? 1.55 : 3.15),0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,lookAhead)
      .addScaledVector(right,putting ? composition.lateralShift : .08)
      .add(new THREE.Vector3(0,putting ? (.07+composition.lookLift) : .57,0));

    this._clearSight(desiredPos,desiredLook,putting ? .30 : .44);
    this._safeY(desiredPos,putting ? .84 : 1.12);
    this._commit(desiredPos,desiredLook,putting ? 6.1 : 6.4,putting ? 7.6 : 7.8,dt);
  }

  updateSwing(dt,{ball,pin=null,swingProgress=0,putting=false}){
    if(this.mode!==CAMERA_MODE.SWING)return;
    this._setFov(putting ? 38.8 : 39.2,dt);

    const forward=new THREE.Vector3(Math.sin(this.lockedAimYaw),0,-Math.cos(this.lockedAimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();
    const composition=cameraCompositionProfile(this.camera.aspect,putting);

    const turn=Math.sin(clamp(swingProgress,0,1)*Math.PI);
    const impactPulse=Math.exp(-Math.pow((swingProgress-.58)/.12,2));
    const framing=putting?clamp(this.swingDist,3.0,7.2):clamp(this.swingDist,5.45,10.5);
    const desiredPos=ball.clone()
      .addScaledVector(forward,-framing+impactPulse*(putting ? .035 : .14))
      .addScaledVector(right,putting ? (.035+composition.lateralShift) : (clamp(framing*.12,.62,1.05)+turn*.10))
      .add(new THREE.Vector3(0,putting ? (.68+framing*.105-impactPulse*.012) : (2.12-impactPulse*.035),0));

    const desiredLook=ball.clone()
      .addScaledVector(forward,putting ? clamp(framing*.45,.75,2.35) : (1.55+impactPulse*.22))
      .addScaledVector(right,putting ? composition.lateralShift : 0)
      .add(new THREE.Vector3(0,putting ? (.07+composition.lookLift) : .56,0));

    this._clearSight(desiredPos,desiredLook,putting ? .30 : .42);
    this._safeY(desiredPos,putting ? .84 : 1.12);
    this._commit(desiredPos,desiredLook,putting ? 7.2 : 10.5,putting ? 8.4 : 11.5,dt);
  }

  updateFlight(dt,{ball,velocity,pin,putting=false}){
    if(this.mode!==CAMERA_MODE.FLIGHT)return;

    this.impactKick=smooth(this.impactKick,0,13,dt);
    this._setFov(41.8+this.impactKick*1.15,dt);

    const horizontal=velocity.clone();horizontal.y=0;
    let desiredHeading=this.flightHeading;
    if(horizontal.lengthSq()>.035)desiredHeading=Math.atan2(horizontal.x,-horizontal.z);
    this.flightHeading=smoothAngle(this.flightHeading,desiredHeading,3.4,dt);

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
    this._setFov(this.resultCup?40.0:(this.resultNear?40.5:38.0),dt);

    // A holed ball drops below the green. Keep the result composition anchored
    // to the cup mouth instead of following the presentation animation underground.
    const anchor=this.resultCup?pin:ball;
    const toPin=pin.clone().sub(anchor);toPin.y=0;
    const base=toPin.lengthSq()>.01?Math.atan2(toPin.x,-toPin.z):this.flightHeading;
    const yaw=base+this.resultOrbit;

    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();
    const pinDir=toPin.lengthSq()>.01?toPin.normalize():new THREE.Vector3(Math.sin(base),0,-Math.cos(base));

    const desiredPos=anchor.clone()
      .addScaledVector(forward,-this.resultDist)
      .addScaledVector(right,this.resultNear?-.34:0)
      .add(new THREE.Vector3(0,(this.resultNear?1.12:1.58)+this.resultPitch*2.20,0));

    const desiredLook=anchor.clone()
      .addScaledVector(pinDir,this.resultCup?.32:.95)
      .add(new THREE.Vector3(0,this.resultCup?.06:.10,0));

    this._clearSight(desiredPos,desiredLook,.28);
    this._safeY(desiredPos,.88);
    this._commit(desiredPos,desiredLook,6.2,7.3,dt);
  }
}
