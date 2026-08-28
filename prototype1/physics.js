import * as THREE from '../vendor/three.module.js';
import {surfacePhysics,lieShotModifiers} from './surfaces.js';

const G=9.80665;
const FIXED=1/120;
const AIR_DENSITY=1.225;
const BALL_MASS=.04593;
const BALL_RADIUS=.021335;
const BALL_AREA=Math.PI*BALL_RADIUS*BALL_RADIUS;
const CUP_RADIUS=.054;
const CUP_CAPTURE=.047;
const CONTACT_HEIGHT=.052;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class GolfPhysics{
  constructor({terrainHeight,surfaceAt,wind}){
    this.terrainHeight=terrainHeight;
    this.surfaceAt=surfaceAt;
    this.wind=wind.clone();
    this.active=false;
    this.state=null;
    this.accum=0;
    this.cup=null;
  }

  setCup(position){this.cup=position?position.clone():null;}

  launch({position,club,power,path,form,aimYaw=0,strike=.8,release=.8,lie='fairway'}){
    const q=clamp(strike,0,1);
    const formEff=.92+.08*clamp(form,0,1);
    const contactEff=.84+.16*q;
    const releaseEff=.94+.06*clamp(release,0,1);
    const lieMods=lieShotModifiers(lie,club.head);
    const speed=club.ballSpeed*clamp(power,.42,1.08)*formEff*contactEff*releaseEff*lieMods.speed;

    // Poor contact and poor lies alter launch/spin as well as speed.
    const launchDeg=club.launch+(1-q)*2.4-(1-release)*1.2+lieMods.launch;
    const launch=launchDeg*Math.PI/180;

    const faceError=path*(.32+.15*(1-q));
    const yaw=aimYaw+faceError*Math.PI/180;
    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
    const velocity=new THREE.Vector3(
      forward.x*Math.cos(launch)*speed,
      Math.sin(launch)*speed,
      forward.z*Math.cos(launch)*speed
    );

    // Backspin axis: forward × up. The previous opposite cross-product pushed
    // Magnus force downward. This orientation produces physical upward lift.
    const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
    const tiltDeg=clamp(path*1.18+(1-q)*Math.sign(path||1)*2.0,-14,14);
    const tilt=tiltDeg*Math.PI/180;
    const axis=right.multiplyScalar(Math.cos(tilt)).add(new THREE.Vector3(0,Math.sin(tilt),0)).normalize();

    const spinEfficiency=(.82+.18*q)*lieMods.spin;
    this.state={
      pos:position.clone(),
      vel:velocity,
      spinAxis:axis,
      spinOmega:club.spin*spinEfficiency*Math.PI*2/60,
      surface:'air',
      stopped:false,
      quality:q,
      lastImpactSurface:null,
      bounced:false,
      holed:false,
      lipTouched:false,
      lastSurface:null
    };
    this.active=true;this.accum=0;
    return this.state;
  }

  putt({position,club,power,path,aimYaw=0,strike=.8}){
    const q=clamp(strike,0,1);
    const yaw=aimYaw+path*(.20+.08*(1-q))*Math.PI/180;
    const speed=club.ballSpeed*clamp(power,.08,1.08)*(.86+.14*q);
    this.state={
      pos:position.clone(),
      vel:new THREE.Vector3(Math.sin(yaw)*speed,0,-Math.cos(yaw)*speed),
      spinAxis:new THREE.Vector3(),
      spinOmega:0,
      surface:this.surfaceAt(position.x,position.z),
      stopped:false,
      quality:q,
      lastImpactSurface:null,
      bounced:false,
      holed:false,
      lipTouched:false,
      lastSurface:this.surfaceAt(position.x,position.z)
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

  _tryCup(s,surface){
    if(!this.cup||surface!=='green'||s.holed)return false;
    const dx=s.pos.x-this.cup.x,dz=s.pos.z-this.cup.z;
    const d=Math.hypot(dx,dz);
    if(d>CUP_RADIUS)return false;

    const speed=Math.hypot(s.vel.x,s.vel.z);
    const direct=d<CUP_CAPTURE;

    // Regulation cup is 108 mm diameter. Capture speed falls rapidly toward
    // the lip: center strikes can fall at a firmer pace, edge strikes must die.
    const edge=clamp(d/CUP_CAPTURE,0,1);
    const captureSpeed=1.55-(1.55-.58)*Math.pow(edge,1.65);
    const normalCapture=direct&&speed<captureSpeed;

    if(normalCapture){
      s.holed=true;s.stopped=true;s.surface='cup';s.vel.set(0,0,0);
      s.pos.set(this.cup.x,this.terrainHeight(this.cup.x,this.cup.z)+CONTACT_HEIGHT,this.cup.z);
      return true;
    }

    // Lip-out: conserve direction broadly, shed speed, and push tangentially.
    if(!s.lipTouched&&speed>.12){
      s.lipTouched=true;
      const n=new THREE.Vector3(dx,0,dz).normalize();
      const tangent=new THREE.Vector3(-n.z,0,n.x);
      const sign=Math.sign(s.vel.dot(tangent))||1;
      s.vel.multiplyScalar(.48).addScaledVector(tangent,sign*.42);
    }
    return false;
  }

  _fixed(){
    const s=this.state;if(s.stopped)return;

    if(s.surface==='air'){
      const rel=s.vel.clone().sub(this.wind);
      const speed=Math.max(.01,rel.length());

      // Aerodynamics are based on a regulation 45.93 g / 42.67 mm golf ball.
      // Drag coefficient rises with spin parameter; lift is derived from backspin.
      const spinParam=Math.abs(s.spinOmega)*BALL_RADIUS/speed;
      const cd=clamp(.19+.18*spinParam,.20,.285);
      const cl=clamp(.70*spinParam,0,.32);
      const q=.5*AIR_DENSITY*BALL_AREA/BALL_MASS;
      const drag=rel.clone().normalize().multiplyScalar(-q*cd*speed*speed);

      let magnus=new THREE.Vector3();
      if(s.spinOmega>1&&cl>0){
        magnus.crossVectors(s.spinAxis,rel).normalize().multiplyScalar(q*cl*speed*speed);
      }
      const acc=new THREE.Vector3(0,-G,0).add(drag).add(magnus);

      s.vel.addScaledVector(acc,FIXED);
      s.pos.addScaledVector(s.vel,FIXED);
      s.spinOmega*=.9994;

      const surface=this.surfaceAt(s.pos.x,s.pos.z);
      const ground=surface==='water'?-0.16:this.terrainHeight(s.pos.x,s.pos.z)+CONTACT_HEIGHT;

      if(s.pos.y<=ground&&s.vel.y<0){
        s.pos.y=ground;
        s.lastImpactSurface=surface;

        if(this._tryCup(s,surface))return;

        if(surface==='water'){
          s.surface='water';
          s.vel.set(0,0,0);
          s.stopped=true;
          return;
        }

        const material=surfacePhysics(surface);

        if(Math.abs(s.vel.y)>1.45){
          // Resolve against the actual terrain normal. Surface identity now
          // determines bounce, skid, and spin grab instead of one global slide.
          const e=.30;
          const hx=(this.terrainHeight(s.pos.x+e,s.pos.z)-this.terrainHeight(s.pos.x-e,s.pos.z))/(2*e);
          const hz=(this.terrainHeight(s.pos.x,s.pos.z+e)-this.terrainHeight(s.pos.x,s.pos.z-e))/(2*e);
          const n=new THREE.Vector3(-hx,1,-hz).normalize();
          const vn=s.vel.dot(n);
          const normal=n.clone().multiplyScalar(vn);
          const tangent=s.vel.clone().sub(normal).multiplyScalar(material.tangentRetain);

          // Spin/ground coupling: greens grab wedges, fairways release,
          // rough absorbs, and sand kills the skid.
          const omega=s.spinAxis.clone().multiplyScalar(s.spinOmega);
          const contactArm=n.clone().multiplyScalar(-BALL_RADIUS);
          const contactSlip=tangent.clone().add(new THREE.Vector3().crossVectors(omega,contactArm));
          contactSlip.y=0;
          const maxImpulse=Math.max(0,Math.abs(vn))*material.spinGrip;
          if(contactSlip.lengthSq()>.0001&&maxImpulse>0){
            const impulse=Math.min(contactSlip.length(),maxImpulse);
            tangent.addScaledVector(contactSlip.normalize(),-impulse);
          }

          s.vel.copy(tangent).addScaledVector(n,-vn*material.restitution);
          s.spinOmega*=surface==='green'?.70:surface==='fairway'?.76:surface==='rough'?.60:surface==='sand'?.34:.68;
          s.lastSurface=surface;
          s.bounced=true;
        }else{
          s.vel.y=0;
          s.surface=surface;
          s.lastSurface=surface;
        }
      }
    }else{
      const surface=this.surfaceAt(s.pos.x,s.pos.z);
      s.surface=surface;
      const material=surfacePhysics(surface);

      if(this._tryCup(s,surface))return;

      // Crossing from one cut into another has a physical bite. A ball leaving
      // fairway for rough loses momentum immediately; entering sand is dramatic.
      if(s.lastSurface&&surface!==s.lastSurface){
        const retain=material.transitionRetain;
        s.vel.x*=retain;s.vel.z*=retain;
      }
      s.lastSurface=surface;

      const e=.35;
      const dx=(this.terrainHeight(s.pos.x+e,s.pos.z)-this.terrainHeight(s.pos.x-e,s.pos.z))/(2*e);
      const dz=(this.terrainHeight(s.pos.x,s.pos.z+e)-this.terrainHeight(s.pos.x,s.pos.z-e))/(2*e);
      const grade=Math.hypot(dx,dz);
      const hs0=Math.hypot(s.vel.x,s.vel.z);

      // Static friction matters. Once a ball has almost finished, ordinary
      // fairway/rough slopes should hold it instead of letting it creep forever.
      if(hs0<material.settleSpeed&&grade<material.staticGrade){
        s.vel.set(0,0,0);
        s.stopped=true;
        return;
      }

      // Gravity follows the local grade.
      s.vel.x+=-dx*G*FIXED;
      s.vel.z+=-dz*G*FIXED;
      s.vel.y=0;

      // Rolling resistance is a calibrated physical deceleration in m/s².
      // It makes grass cuts meaningfully different without arbitrary frame damping.
      const hs=Math.hypot(s.vel.x,s.vel.z);
      if(hs>0){
        const drop=Math.min(hs,material.rollingDecel*FIXED);
        const k=(hs-drop)/hs;
        s.vel.x*=k;s.vel.z*=k;
      }

      s.pos.addScaledVector(s.vel,FIXED);
      s.pos.y=this.terrainHeight(s.pos.x,s.pos.z)+CONTACT_HEIGHT;

      if(Math.hypot(s.vel.x,s.vel.z)<material.settleSpeed&&grade<material.staticGrade){
        s.vel.set(0,0,0);
        s.stopped=true;
      }
    }
  }
}
