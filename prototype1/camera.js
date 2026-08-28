import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));

export class LoftCamera{
  constructor(camera){
    this.camera=camera;
    this.target=new THREE.Vector3();

    this.pitch=.16;
    this.pitchT=.16;
    this.dist=9.0;
    this.distT=9.0;

    this.swingBlend=0;
    this.swinging=false;

    this.flightYaw=.38;
    this.flightYawT=.38;
    this.flightPitch=.18;
    this.flightPitchT=.18;
    this.flightDist=9.8;
    this.flightDistT=9.8;

    this.resultYaw=.42;
    this.resultPitch=.24;
  }

  reset(){
    this.pitchT=.16;
    this.distT=9.0;
    this.flightYawT=.38;
    this.flightPitchT=.18;
    this.flightDistT=9.8;
  }

  setSwinging(v){
    this.swinging=!!v;
  }

  aimVertical(dy){
    this.pitchT=clamp(this.pitchT+dy*.0025,-.06,.44);
  }

  zoom(delta,flight=false){
    if(!flight)this.distT=clamp(this.distT*Math.exp(-delta*.0020),6.3,12.6);
    else this.flightDistT=clamp(this.flightDistT*Math.exp(-delta*.0020),6.2,15.0);
  }

  flightOrbit(dx,dy){
    this.flightYawT-=dx*.0044;
    this.flightPitchT=clamp(this.flightPitchT+dy*.0026,-.06,.52);
  }

  _setFov(target,dt){
    this.camera.fov=smooth(this.camera.fov,target,7,dt);
    this.camera.updateProjectionMatrix();
  }

  _smooth(dt){
    this.pitch=smooth(this.pitch,this.pitchT,10,dt);
    this.dist=smooth(this.dist,this.distT,11,dt);
    this.flightYaw=smooth(this.flightYaw,this.flightYawT,10,dt);
    this.flightPitch=smooth(this.flightPitch,this.flightPitchT,10,dt);
    this.flightDist=smooth(this.flightDist,this.flightDistT,11,dt);
    const desired=this.swinging?1:0;
    this.swingBlend=smooth(this.swingBlend,desired,this.swinging?18:10,dt);
  }

  /*
    Address/Aim camera:
    - aimYaw is driven by the player's camera drag in game.js
    - therefore golfer + The Line rotate with the camera-facing direction
    - pitch/zoom remain semi-free
    - when swing starts, the camera blends to a ball-locked golf composition
  */
  address(dt,ball,aimYaw){
    this._smooth(dt);
    this._setFov(this.swinging?38:40,dt);

    const forward=new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw)).normalize();
    const right=new THREE.Vector3(forward.z,0,-forward.x).normalize();
    const up=new THREE.Vector3(0,1,0);

    // Semi-free address composition. The shot direction remains readable.
    const freePos=ball.clone()
      .addScaledVector(forward,-this.dist*.78)
      .addScaledVector(right,this.dist*.46)
      .addScaledVector(up,2.25+this.pitch*4.8);

    const freeLook=ball.clone()
      .addScaledVector(forward,7.2)
      .addScaledVector(up,.72);

    // Swing-lock composition: tightly anchored to the ball while keeping
    // the golfer + target line in frame. No user camera transforms during stroke.
    const swingDist=7.0;
    const swingPos=ball.clone()
      .addScaledVector(forward,-swingDist*.67)
      .addScaledVector(right,swingDist*.48)
      .addScaledVector(up,2.18);

    const swingLook=ball.clone()
      .addScaledVector(forward,1.25)
      .addScaledVector(up,.52);

    const desiredPos=freePos.clone().lerp(swingPos,this.swingBlend);
    const desiredLook=freeLook.clone().lerp(swingLook,this.swingBlend);

    this.camera.position.lerp(desiredPos,1-Math.exp(-10*dt));
    this.target.lerp(desiredLook,1-Math.exp(-11*dt));
    this.camera.lookAt(this.target);
  }

  flight(dt,ball,velocity,aimYaw){
    this._smooth(dt);
    this._setFov(43,dt);
    const horizontal=velocity.clone();horizontal.y=0;
    const base=horizontal.lengthSq()>.02?Math.atan2(horizontal.x,-horizontal.z):aimYaw;
    const yaw=base+this.flightYaw;
    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
    const right=new THREE.Vector3(forward.z,0,-forward.x);

    const desired=ball.clone()
      .addScaledVector(forward,-this.flightDist*.82)
      .addScaledVector(right,this.flightDist*.28)
      .add(new THREE.Vector3(0,3.0+this.flightPitch*5.2+Math.min(2.2,ball.y*.09),0));

    this.camera.position.lerp(desired,1-Math.exp(-7.6*dt));
    this.target.lerp(ball.clone().add(new THREE.Vector3(0,.14,0)),1-Math.exp(-10*dt));
    this.camera.lookAt(this.target);
  }

  result(dt,ball,pin,aimYaw){
    this._smooth(dt);
    this._setFov(40,dt);
    const toPin=pin.clone().sub(ball);toPin.y=0;
    const base=toPin.lengthSq()>.01?Math.atan2(toPin.x,-toPin.z):aimYaw;
    const yaw=base+this.flightYaw;
    const viewForward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
    const pinDir=toPin.lengthSq()>.01?toPin.normalize():new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw));

    // Result camera is a lie-inspection camera, not a giant empty-ground overview.
    // It remains inspectable after landing through the same damped orbit state.
    const desired=ball.clone()
      .addScaledVector(viewForward,-7.0)
      .add(new THREE.Vector3(0,2.8+this.flightPitch*3.6,0));

    const look=ball.clone()
      .addScaledVector(pinDir,2.0)
      .add(new THREE.Vector3(0,.18,0));

    this.camera.position.lerp(desired,1-Math.exp(-6.4*dt));
    this.target.lerp(look,1-Math.exp(-7.2*dt));
    this.camera.lookAt(this.target);
  }
}