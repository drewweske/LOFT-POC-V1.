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
const CUP_THROAT=CUP_RADIUS-BALL_RADIUS;
// A few millimetres of mobile forgiveness around the regulation throat keeps
// putting welcoming without snapping a visibly rim-straddling ball into cup.
const CUP_CAPTURE=CUP_THROAT+.0035;
const CUP_LIP_CONTACT=CUP_RADIUS+BALL_RADIUS;
export const BALL_CONTACT_HEIGHT=.0265;
const CONTACT_HEIGHT=BALL_CONTACT_HEIGHT;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class GolfPhysics{
  constructor({terrainHeight,terrainSample=null,terrainContactY=null,terrainSweep=null,surfaceAt,wind,waterLevel=-.22}){
    this.terrainHeight=terrainHeight;
    this.terrainSample=terrainSample;
    this.terrainContactY=terrainContactY;
    this.terrainSweep=terrainSweep;
    this.surfaceAt=surfaceAt;
    this.wind=wind.clone();
    this.waterLevel=waterLevel;
    this.active=false;
    this.state=null;
    this.accum=0;
    this.cup=null;
    this._frame={height:0,dx:0,dz:0,grade:0,normal:{x:0,y:1,z:0}};
  }

  _groundFrame(x,z){
    if(this.terrainSample)return this.terrainSample(x,z,this._frame);
    const e=.35,height=this.terrainHeight(x,z);
    const dx=(this.terrainHeight(x+e,z)-this.terrainHeight(x-e,z))/(2*e);
    const dz=(this.terrainHeight(x,z+e)-this.terrainHeight(x,z-e))/(2*e);
    const inv=1/Math.hypot(dx,1,dz),out=this._frame;
    out.height=height;out.dx=dx;out.dz=dz;out.grade=Math.hypot(dx,dz);
    out.normal.x=-dx*inv;out.normal.y=inv;out.normal.z=-dz*inv;
    return out;
  }

  _groundY(x,z){
    return this.terrainContactY?this.terrainContactY(x,z,CONTACT_HEIGHT):this.terrainHeight(x,z)+CONTACT_HEIGHT;
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
      captureRejected:false,
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
      captureRejected:false,
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
    if(d>CUP_LIP_CONTACT)return false;

    const speed=Math.hypot(s.vel.x,s.vel.z);
    const direct=d<CUP_CAPTURE;

    // Real cups accept a firm center strike but reject hot edge pace.
    // The continuous segment test prevents a perfectly aimed putt tunneling
    // across the cup between 120 Hz fixed steps.
    const edge=clamp(d/CUP_CAPTURE,0,1);
    const captureSpeed=1.95-(1.95-.50)*Math.pow(edge,1.62);
    const normalCapture=direct&&speed<captureSpeed&&!s.captureRejected;

    if(normalCapture){
      s.holed=true;s.stopped=true;s.surface='cup';s.vel.set(0,0,0);
      s.pos.set(this.cup.x,this._groundY(this.cup.x,this.cup.z),this.cup.z);
      this.active=false;
      return true;
    }

    if(direct&&speed>=captureSpeed){
      // Once pace has exceeded the acceptance window it cannot be slowed by
      // the rim and then accepted on the next fixed step.
      s.captureRejected=true;
    }

    const ballDx=s.pos.x-this.cup.x,ballDz=s.pos.z-this.cup.z;
    const radialMotion=ballDx*s.vel.x+ballDz*s.vel.z;
    // Resolve the rim only after the ball reaches and begins leaving its
    // closest approach. Resolving on the inbound outer-overlap radius creates
    // an invisible wall in front of an otherwise centred putt.
    if(!s.lipTouched&&speed>.12&&radialMotion>=0){
      s.lipTouched=true;
      if(d<CUP_CAPTURE){s.vel.multiplyScalar(.82);return false;}
      const n=new THREE.Vector3(ballDx||dx||.001,0,ballDz||dz||.001).normalize();
      const tangent=new THREE.Vector3(-n.z,0,n.x);
      const tangential=s.vel.dot(tangent);
      const radial=s.vel.dot(n);
      const bite=1-clamp((d-CUP_CAPTURE)/(CUP_LIP_CONTACT-CUP_CAPTURE),0,1);
      s.vel.copy(tangent).multiplyScalar(tangential*(.78-.16*bite));
      s.vel.addScaledVector(n,radial<0?(-radial*(.13+.08*bite)):radial*.55);
    }
    return false;
  }

  _recover(reason='SAFETY'){
    const s=this.state;if(!s)return;
    const p=s.lastSafePos&&Number.isFinite(s.lastSafePos.x)?s.lastSafePos:new THREE.Vector3(0,0,0);
    const x=clamp(p.x,-78,78),z=clamp(p.z,-272,38);
    const ground=this._groundY(x,z);
    s.pos.set(x,Number.isFinite(ground)?ground:CONTACT_HEIGHT,z);
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
    if(this.terrainSweep){
      const hit=this.terrainSweep(a,b,CONTACT_HEIGHT);
      return hit?{t:hit.t,point:new THREE.Vector3(hit.x,hit.y,hit.z)}:null;
    }
    const clearance=(p)=>{
      const y=this._groundY(p.x,p.z);
      return Number.isFinite(y)?p.y-y:Infinity;
    };
    let prevT=0,prevC=clearance(a);
    const endC=clearance(b);
    if(prevC<=1e-7&&endC>prevC+1e-7)return null;
    if(prevC< -1e-6||(endC<prevC-1e-6&&prevC<=1e-7)){
      const p=a.clone();p.y=this._groundY(p.x,p.z);return {t:0,point:p};
    }
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
        hit.y=this._groundY(hit.x,hit.z);
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
      let ground=surface==='water'?this.waterLevel+CONTACT_HEIGHT:this._groundY(s.pos.x,s.pos.z);
      let sweptContact=false;

      if(surface!=='water'){
        const hit=this._sweptTerrainHit(previous,s.pos);
        if(hit){
          s.pos.copy(hit.point);
          surface=this.surfaceAt(s.pos.x,s.pos.z);
          sampled=this.terrainHeight(s.pos.x,s.pos.z);
          ground=this._groundY(s.pos.x,s.pos.z);
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
          const frame=this._groundFrame(s.pos.x,s.pos.z);
          const n=new THREE.Vector3(frame.normal.x,frame.normal.y,frame.normal.z);
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

      const frame=this._groundFrame(s.pos.x,s.pos.z);
      const dx=frame.dx,dz=frame.dz,grade=frame.grade;
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

      // Ground spin-to-roll coupling. Wedges can check, low-spin shots
      // release, and the transition converges toward pure rolling instead of
      // discarding aerodynamic spin the instant the ball touches grass.
      if(s.spinOmega>1&&s.spinAxis.lengthSq()>.001){
        const n=new THREE.Vector3(frame.normal.x,frame.normal.y,frame.normal.z);
        const omega=s.spinAxis.clone().multiplyScalar(s.spinOmega);
        const arm=n.clone().multiplyScalar(-BALL_RADIUS);
        const contactVel=s.vel.clone().add(new THREE.Vector3().crossVectors(omega,arm));
        const normalComponent=n.clone().multiplyScalar(contactVel.dot(n));
        const slip=contactVel.sub(normalComponent);
        const slipSpeed=slip.length();
        if(slipSpeed>.002){
          const maxDv=material.spinGrip*G*.42*FIXED;
          const dv=Math.min(slipSpeed,maxDv);
          s.vel.addScaledVector(slip.normalize(),-dv);
        }
        s.spinOmega*=Math.exp(-material.spinGrip*5.2*FIXED);
      }

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
      const nextSurface=this.surfaceAt(s.pos.x,s.pos.z);
      if(nextSurface==='water'){
        s.surface='water';s.lastSurface='water';s.pos.y=this.waterLevel+CONTACT_HEIGHT;
        s.vel.set(0,0,0);s.stopped=true;this.active=false;return;
      }
      const nextGround=this._groundY(s.pos.x,s.pos.z);
      if(!Number.isFinite(nextGround)){this._recover('HEIGHTFIELD');return;}
      s.pos.y=nextGround;

      if(this._tryCup(s,nextSurface,fromX,fromZ))return;

      let nextMaterial=material;
      if(nextSurface!==surface){
        nextMaterial=surfacePhysics(nextSurface);
        s.vel.x*=nextMaterial.transitionRetain;s.vel.z*=nextMaterial.transitionRetain;
        s.surfaceChanged={from:surface,to:nextSurface};
      }
      s.surface=nextSurface;s.lastSurface=nextSurface;
      const nextFrame=this._groundFrame(s.pos.x,s.pos.z);
      const nextSlopeAccel=G*ROLLING_GRAVITY_FACTOR*nextFrame.grade/Math.sqrt(1+nextFrame.grade*nextFrame.grade);
      const nextCanHold=nextSlopeAccel<nextMaterial.rollingDecel*.94;
      if(Math.hypot(s.vel.x,s.vel.z)<nextMaterial.settleSpeed*1.35&&(nextFrame.grade<nextMaterial.staticGrade||nextCanHold)){
        s.vel.set(0,0,0);
        s.stopped=true;
        this.active=false;
      }
    }
  }
}
