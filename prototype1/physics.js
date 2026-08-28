import * as THREE from '../vendor/three.module.js';

const G=9.81;
const FIXED=1/120;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class GolfPhysics{
  constructor({terrainHeight,surfaceAt,wind}){
    this.terrainHeight=terrainHeight;
    this.surfaceAt=surfaceAt;
    this.wind=wind.clone();
    this.active=false;
    this.state=null;
    this.accum=0;
  }

  launch({position,club,power,path,form,aimYaw=0,strike=.8,release=.8}){
    const q=clamp(strike,0,1);
    const formEff=.92+.08*clamp(form,0,1);
    const contactEff=.84+.16*q;
    const releaseEff=.94+.06*clamp(release,0,1);
    const speed=club.ballSpeed*clamp(power,.42,1.08)*formEff*contactEff*releaseEff;

    // Poor contact does not just lose speed. It changes launch and spin efficiency,
    // so the gesture has a physically readable consequence.
    const launchDeg=club.launch+(1-q)*2.4-(1-release)*1.2;
    const launch=launchDeg*Math.PI/180;

    const faceError=path*(.32+.15*(1-q));
    const yaw=aimYaw+faceError*Math.PI/180;
    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
    const velocity=new THREE.Vector3(
      forward.x*Math.cos(launch)*speed,
      Math.sin(launch)*speed,
      forward.z*Math.cos(launch)*speed
    );

    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize();
    const tiltDeg=clamp(path*1.18+(1-q)*Math.sign(path||1)*2.0,-14,14);
    const tilt=tiltDeg*Math.PI/180;
    const axis=right.multiplyScalar(Math.cos(tilt)).add(new THREE.Vector3(0,Math.sin(tilt),0)).normalize();

    const spinEfficiency=.82+.18*q;
    this.state={
      pos:position.clone(),
      vel:velocity,
      spinAxis:axis,
      spinOmega:club.spin*spinEfficiency*Math.PI*2/60,
      surface:'air',
      stopped:false,
      quality:q,
      lastImpactSurface:null,
      bounced:false
    };
    this.active=true;this.accum=0;
    return this.state;
  }

  putt({position,club,power,path,aimYaw=0,strike=.8}){
    const q=clamp(strike,0,1);
    const yaw=aimYaw+path*(.20+.08*(1-q))*Math.PI/180;
    const speed=club.ballSpeed*clamp(power,.22,1.08)*(.86+.14*q);
    this.state={
      pos:position.clone(),
      vel:new THREE.Vector3(Math.sin(yaw)*speed,0,-Math.cos(yaw)*speed),
      spinAxis:new THREE.Vector3(),
      spinOmega:0,
      surface:this.surfaceAt(position.x,position.z),
      stopped:false,
      quality:q,
      lastImpactSurface:null,
      bounced:false
    };
    this.active=true;this.accum=0;
    return this.state;
  }

  step(dt){
    if(!this.active||!this.state)return this.state;
    this.accum+=Math.min(dt,.04);
    while(this.accum>=FIXED){this._fixed();this.accum-=FIXED;}
    return this.state;
  }

  _fixed(){
    const s=this.state;if(s.stopped)return;

    if(s.surface==='air'){
      const rel=s.vel.clone().sub(this.wind);
      const speed=rel.length();
      const drag=rel.clone().multiplyScalar(-.00215*speed);
      const magnus=new THREE.Vector3()
        .crossVectors(s.spinAxis.clone().multiplyScalar(s.spinOmega),rel)
        .multiplyScalar(.00012);
      const acc=new THREE.Vector3(0,-G,0).add(drag).add(magnus);

      s.vel.addScaledVector(acc,FIXED);
      s.pos.addScaledVector(s.vel,FIXED);
      s.spinOmega*=.9994;

      const surface=this.surfaceAt(s.pos.x,s.pos.z);
      const ground=surface==='water'?-0.16:this.terrainHeight(s.pos.x,s.pos.z)+.085;

      if(s.pos.y<=ground&&s.vel.y<0){
        s.pos.y=ground;
        s.lastImpactSurface=surface;

        if(surface==='water'){
          s.surface='water';
          s.vel.set(0,0,0);
          s.stopped=true;
          return;
        }

        if(Math.abs(s.vel.y)>1.8){
          const rest=surface==='green'?.18:surface==='fairway'?.23:surface==='rough'?.11:surface==='sand'?.05:.12;
          const loss=surface==='sand'?.46:surface==='rough'?.68:.82;
          s.vel.y=-s.vel.y*rest;
          s.vel.x*=loss;s.vel.z*=loss;
          s.bounced=true;
        }else{
          s.vel.y=0;
          s.surface=surface;
        }
      }
    }else{
      const surface=this.surfaceAt(s.pos.x,s.pos.z);
      s.surface=surface;

      const e=.35;
      const dx=(this.terrainHeight(s.pos.x+e,s.pos.z)-this.terrainHeight(s.pos.x-e,s.pos.z))/(2*e);
      const dz=(this.terrainHeight(s.pos.x,s.pos.z+e)-this.terrainHeight(s.pos.x,s.pos.z-e))/(2*e);
      const slope=surface==='green'?.42:surface==='fairway'?.24:.12;

      s.vel.x+=-dx*G*FIXED*slope;
      s.vel.z+=-dz*G*FIXED*slope;
      s.vel.y=0;

      const decay=surface==='green'?.988:surface==='fairway'?.974:surface==='rough'?.915:surface==='sand'?.80:.90;
      s.vel.multiplyScalar(Math.pow(decay,FIXED*60));
      s.pos.addScaledVector(s.vel,FIXED);
      s.pos.y=this.terrainHeight(s.pos.x,s.pos.z)+.085;

      if(s.vel.length()<.20){
        s.vel.set(0,0,0);
        s.stopped=true;
      }
    }
  }
}
