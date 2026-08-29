import * as THREE from '../vendor/three.module.js';
import {surfacePhysics,lieShotModifiers} from './surfaces.js';

const G=9.80665;
const FIXED=1/120;
const AIR_DENSITY=1.225;
const BALL_MASS=.04593;
const BALL_RADIUS=.021335;
const BALL_AREA=Math.PI*BALL_RADIUS*BALL_RADIUS;
// Pure rolling sphere acceleration down a slope is 5/7 g·sin(theta).
// Using full gravity made greens and fairways feel like ice on visible grade.
const ROLLING_GRAVITY_FACTOR=5/7;
// Regulation geometry. The visual ball is very slightly enlarged for mobile
// readability, but cup/ball physics stay anchored to real golf dimensions.
const CUP_RADIUS=.053975;
const CUP_CAPTURE=.0495;
export const BALL_CONTACT_HEIGHT=.0265;
const CONTACT_HEIGHT=BALL_CONTACT_HEIGHT;
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
    const speed=club.ballSpeed*clamp(power,.055,1.08)*formEff*contactEff*releaseEff*lieMods.speed;

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
      lastSurface:null,
      surfaceChanged:null,
      simTime:0,
      recovered:false,
      lastSafePos:position.clone()
    };
    this.active=true;this.accum=0;
    return this.state;
  }

  putt({position,club,power=.3,paceFeet=null,path,aimYaw=0,strike=.8}){
    const q=clamp(strike,0,1);
    const yaw=aimYaw+path*(.16+.06*(1-q))*Math.PI/180;

    // Putting is distance-authored by the player's actual backstroke.
    // A displayed 10 FT pace means approximately 10 feet of level-green roll.
    const speed=paceFeet!=null
      ? Math.sqrt(2*surfacePhysics('green').rollingDecel*Math.max(.12,paceFeet*.3048))*(.985+.025*q)
      : club.ballSpeed*clamp(power,.035,1.08)*(.86+.14*q);
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
      lastSurface:this.surfaceAt(position.x,position.z),
      surfaceChanged:null,
      simTime:0,
      recovered:false,
      lastSafePos:position.clone()
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

  _tryCup(s,surface,fromX=null,fromZ=null){
    if(!this.cup||surface!=='green'||s.holed)return false;

    let closestX=s.pos.x,closestZ=s.pos.z;
    if(fromX!=null&&fromZ!=null){
      const ax=fromX,az=fromZ,bx=s.pos.x,bz=s.pos.z;
      const vx=bx-ax,vz=bz-az;
      const vv=vx*vx+vz*vz;
      if(vv>1e-8){
        const t=clamp(((this.cup.x-ax)*vx+(this.cup.z-az)*vz)/vv,0,1);
        closestX=ax+vx*t;closestZ=az+vz*t;
      }
    }

    const dx=closestX-this.cup.x,dz=closestZ-this.cup.z;
    const d=Math.hypot(dx,dz);
    if(d>CUP_RADIUS)return false;

    const speed=Math.hypot(s.vel.x,s.vel.z);
    const direct=d<CUP_CAPTURE;

    // Real cups accept a firm center strike but reject hot edge pace.
    // The continuous segment test prevents a perfectly aimed putt tunneling
    // across the cup between 120 Hz fixed steps.
    const edge=clamp(d/CUP_CAPTURE,0,1);
    const captureSpeed=1.95-(1.95-.58)*Math.pow(edge,1.62);
    const normalCapture=direct&&speed<captureSpeed;

    if(normalCapture){
      s.holed=true;s.stopped=true;s.surface='cup';s.vel.set(0,0,0);
      s.pos.set(this.cup.x,this.terrainHeight(this.cup.x,this.cup.z)+CONTACT_HEIGHT,this.cup.z);
      this.active=false;
      return true;
    }

    // A genuine hot lip-out should still be readable rather than an invisible wall.
    if(!s.lipTouched&&speed>.18){
      s.lipTouched=true;
      const n=new THREE.Vector3(dx||.001,0,dz||.001).normalize();
      const tangent=new THREE.Vector3(-n.z,0,n.x);
      const sign=Math.sign(s.vel.dot(tangent))||1;
      s.vel.multiplyScalar(.54).addScaledVector(tangent,sign*.28);
    }
    return false;
  }

  _recover(reason='SAFETY'){
    const s=this.state;if(!s)return;
    const p=s.lastSafePos&&Number.isFinite(s.lastSafePos.x)?s.lastSafePos:new THREE.Vector3(0,0,0);
    const x=clamp(p.x,-78,78),z=clamp(p.z,-272,38);
    const ground=this.terrainHeight(x,z);
    s.pos.set(x,Number.isFinite(ground)?ground+CONTACT_HEIGHT:CONTACT_HEIGHT,z);
    s.vel.set(0,0,0);
    s.surface=this.surfaceAt(x,z);
    s.lastSurface=s.surface;
    s.stopped=true;
    s.recovered=reason;
    this.active=false;
  }

  _sweptTerrainHit(a,b){
    // The rendered LOFT field is a triangle heightfield. A fast shot can cross
    // more than one triangle in a fixed step, so endpoint-only collision is not
    // sufficient. Sample the path, then bisect the first clearance crossing.
    const clearance=(p)=>{
      const h=this.terrainHeight(p.x,p.z);
      return Number.isFinite(h)?p.y-(h+CONTACT_HEIGHT):Infinity;
    };
    let prevT=0,prevC=clearance(a);
    if(prevC<=0)return {t:0,point:a.clone()};
    const probe=new THREE.Vector3();
    const samples=5;
    for(let i=1;i<=samples;i++){
      const t=i/samples;
      probe.copy(a).lerp(b,t);
      const cc=clearance(probe);
      if(cc<=0){
        let lo=prevT,hi=t;
        for(let k=0;k<11;k++){
          const m=(lo+hi)*.5;
          probe.copy(a).lerp(b,m);
          if(clearance(probe)>0)lo=m;else hi=m;
        }
        const hit=a.clone().lerp(b,hi);
        hit.y=this.terrainHeight(hit.x,hit.z)+CONTACT_HEIGHT;
        return {t:hi,point:hit};
      }
      prevT=t;prevC=cc;
    }
    return null;
  }

  _fixed(){
    const s=this.state;if(s.stopped)return;
    s.simTime=(s.simTime||0)+FIXED;

    // A golf shot may never soft-lock the game. Protect the deterministic
    // height-field solver from NaN, runaway coordinates and endless rolling.
    const finite=
      Number.isFinite(s.pos.x)&&Number.isFinite(s.pos.y)&&Number.isFinite(s.pos.z)&&
      Number.isFinite(s.vel.x)&&Number.isFinite(s.vel.y)&&Number.isFinite(s.vel.z);
    if(!finite){this._recover('NUMERIC');return;}
    if(Math.abs(s.pos.x)>88||s.pos.z>48||s.pos.z<-286){this._recover('BOUNDARY');return;}
    if(s.simTime>26){this._recover('TIMEOUT');return;}

    if(Math.abs(s.pos.x)<78&&s.pos.z<38&&s.pos.z>-272&&s.pos.y>-4){
      s.lastSafePos.copy(s.pos);
    }

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

      const previous=s.pos.clone();
      s.vel.addScaledVector(acc,FIXED);
      s.pos.addScaledVector(s.vel,FIXED);
      s.spinOmega*=.9994;

      let surface=this.surfaceAt(s.pos.x,s.pos.z);
      let sampled=this.terrainHeight(s.pos.x,s.pos.z);
      if(!Number.isFinite(sampled)){this._recover('HEIGHTFIELD');return;}
      let ground=surface==='water'?-0.16:sampled+CONTACT_HEIGHT;
      let sweptContact=false;

      if(surface!=='water'){
        const hit=this._sweptTerrainHit(previous,s.pos);
        if(hit){
          s.pos.copy(hit.point);
          surface=this.surfaceAt(s.pos.x,s.pos.z);
          sampled=this.terrainHeight(s.pos.x,s.pos.z);
          ground=sampled+CONTACT_HEIGHT;
          s.pos.y=ground;
          sweptContact=true;
        }else if(s.pos.y<ground-.018){
          // Should be unreachable with the exact rendered heightfield, but keep
          // a tiny final guard rather than ever drawing the ball inside turf.
          s.pos.y=ground;sweptContact=true;
        }
      }

      if(s.pos.y<=ground&&(s.vel.y<=0||sweptContact)){
        s.pos.y=ground;
        s.lastImpactSurface=surface;

        if(this._tryCup(s,surface))return;

        if(surface==='water'){
          s.surface='water';
          s.vel.set(0,0,0);
          s.stopped=true;
          this.active=false;
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
      if(surface==='water'){
        s.vel.set(0,0,0);s.stopped=true;this.active=false;return;
      }
      const material=surfacePhysics(surface);

      // Crossing from one cut into another has a physical bite. A ball leaving
      // fairway for rough loses momentum immediately; entering sand is dramatic.
      if(s.lastSurface&&surface!==s.lastSurface){
        const from=s.lastSurface;
        const retain=material.transitionRetain;
        s.vel.x*=retain;s.vel.z*=retain;
        s.surfaceChanged={from,to:surface};
      }
      s.lastSurface=surface;

      const e=.35;
      const dx=(this.terrainHeight(s.pos.x+e,s.pos.z)-this.terrainHeight(s.pos.x-e,s.pos.z))/(2*e);
      const dz=(this.terrainHeight(s.pos.x,s.pos.z+e)-this.terrainHeight(s.pos.x,s.pos.z-e))/(2*e);
      const grade=Math.hypot(dx,dz);
      const hs0=Math.hypot(s.vel.x,s.vel.z);

      // Static friction / turf indentation matters. A nearly stopped golf ball
      // should not mysteriously creep on a grade whose downslope gravity is
      // weaker than the surface's calibrated rolling resistance.
      const slopeAccel=G*ROLLING_GRAVITY_FACTOR*grade/Math.sqrt(1+grade*grade);
      const canPhysicallyHold=slopeAccel<material.rollingDecel*.94;
      if(hs0<material.settleSpeed*1.55&&(grade<material.staticGrade||canPhysicallyHold)){
        s.vel.set(0,0,0);
        s.stopped=true;
        this.active=false;
        return;
      }

      // Gravity follows the local grade.
      s.vel.x+=-dx*G*ROLLING_GRAVITY_FACTOR*FIXED;
      s.vel.z+=-dz*G*ROLLING_GRAVITY_FACTOR*FIXED;
      s.vel.y=0;

      // Turf resistance has two physical-feeling components:
      // a low-speed rolling term and a speed-sensitive deformation/grass drag.
      // This keeps putts exquisitely controllable while preventing long shots
      // from skating across fairway/rough like polished ice.
      const hs=Math.hypot(s.vel.x,s.vel.z);
      if(hs>0){
        const decel=material.rollingDecel+(material.speedDrag||0)*hs*hs;
        const drop=Math.min(hs,decel*FIXED);
        const k=(hs-drop)/hs;
        s.vel.x*=k;s.vel.z*=k;
      }

      const fromX=s.pos.x,fromZ=s.pos.z;
      s.pos.addScaledVector(s.vel,FIXED);
      const nextGround=this.terrainHeight(s.pos.x,s.pos.z);
      if(!Number.isFinite(nextGround)){this._recover('HEIGHTFIELD');return;}
      s.pos.y=nextGround+CONTACT_HEIGHT;

      if(this._tryCup(s,surface,fromX,fromZ))return;

      if(Math.hypot(s.vel.x,s.vel.z)<material.settleSpeed*1.35&&(grade<material.staticGrade||canPhysicallyHold)){
        s.vel.set(0,0,0);
        s.stopped=true;
        this.active=false;
      }
    }
  }
}
