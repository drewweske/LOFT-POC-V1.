import * as THREE from '../vendor/three.module.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));

export class LoftCamera{
  constructor(camera){
    this.camera=camera;this.target=new THREE.Vector3(0,.85,-7);
    this.yaw=.62;this.yawT=.62;this.pitch=.18;this.pitchT=.18;this.dist=9.2;this.distT=9.2;
    this.flightYaw=.42;this.flightYawT=.42;this.flightPitch=.20;this.flightPitchT=.20;this.flightDist=10.2;this.flightDistT=10.2;
  }
  reset(){this.yawT=.62;this.pitchT=.18;this.distT=9.2;this.flightYawT=.42;this.flightPitchT=.20;this.flightDistT=10.2;}
  orbit(dx,dy,flight=false){
    if(!flight){this.yawT-=dx*.0047;this.pitchT=clamp(this.pitchT+dy*.0027,-.08,.52);}
    else{this.flightYawT-=dx*.0047;this.flightPitchT=clamp(this.flightPitchT+dy*.0027,-.08,.58);}
  }
  zoom(delta,flight=false){
    if(!flight)this.distT=clamp(this.distT*Math.exp(-delta*.0022),6.2,14.5);
    else this.flightDistT=clamp(this.flightDistT*Math.exp(-delta*.0022),6.0,16.5);
  }
  _smooth(dt){this.yaw=smooth(this.yaw,this.yawT,11,dt);this.pitch=smooth(this.pitch,this.pitchT,11,dt);this.dist=smooth(this.dist,this.distT,12,dt);this.flightYaw=smooth(this.flightYaw,this.flightYawT,10,dt);this.flightPitch=smooth(this.flightPitch,this.flightPitchT,10,dt);this.flightDist=smooth(this.flightDist,this.flightDistT,11,dt);}
  address(dt,aimYaw){
    this._smooth(dt);const yaw=aimYaw+this.yaw;
    const pos=new THREE.Vector3(Math.sin(yaw)*this.dist,2.72+this.pitch*5.2,Math.cos(yaw)*this.dist);
    const look=new THREE.Vector3(Math.sin(aimYaw)*-6.2,.87,Math.cos(aimYaw)*6.2);
    this.camera.position.lerp(pos,1-Math.exp(-8*dt));this.target.lerp(look,1-Math.exp(-9*dt));this.camera.lookAt(this.target);
  }
  flight(dt,ball,velocity,aimYaw){
    this._smooth(dt);const h=velocity.clone();h.y=0;const base=h.lengthSq()>.02?Math.atan2(h.x,-h.z):aimYaw,yaw=base+this.flightYaw;
    const pos=ball.clone().add(new THREE.Vector3(Math.sin(yaw)*this.flightDist,3.2+this.flightPitch*5.8+Math.min(2.6,ball.y*.10),Math.cos(yaw)*this.flightDist));
    this.camera.position.lerp(pos,1-Math.exp(-7.5*dt));this.target.lerp(ball,1-Math.exp(-10*dt));this.camera.lookAt(this.target);
  }
  result(dt,ball,pin,aimYaw){
    this._smooth(dt);const yaw=aimYaw+this.flightYaw;
    const pos=ball.clone().add(new THREE.Vector3(Math.sin(yaw)*8.2,3.3+this.flightPitch*5.1,Math.cos(yaw)*8.2));
    const look=ball.clone().lerp(pin.clone().setY(pin.y+.15),.18);
    this.camera.position.lerp(pos,1-Math.exp(-5.5*dt));this.target.lerp(look,1-Math.exp(-6.5*dt));this.camera.lookAt(this.target);
  }
}