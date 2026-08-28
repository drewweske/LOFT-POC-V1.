import * as THREE from '../vendor/three.module.js';

const G=9.81;
const FIXED=1/120;

export class GolfPhysics{
  constructor({terrainHeight,surfaceAt,wind}){
    this.terrainHeight=terrainHeight;this.surfaceAt=surfaceAt;this.wind=wind.clone();
    this.active=false;this.state=null;this.accum=0;
  }
  launch({position,club,power,tempo,path,form}){
    const q=Math.max(.54,Math.min(1.01,.73+.18*tempo+.1*form-.016*Math.abs(path)));
    const speed=club.ballSpeed*Math.max(.45,Math.min(1.08,power))*(.92+.08*q);
    const launch=club.launch*Math.PI/180;
    const yaw=path*.42*Math.PI/180;
    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
    const velocity=new THREE.Vector3(forward.x*Math.cos(launch)*speed,Math.sin(launch)*speed,forward.z*Math.cos(launch)*speed);
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize();
    const tilt=Math.max(-14,Math.min(14,path*1.45))*Math.PI/180;
    const axis=right.multiplyScalar(Math.cos(tilt)).add(new THREE.Vector3(0,Math.sin(tilt),0)).normalize();
    this.state={pos:position.clone(),vel:velocity,spinAxis:axis,spinOmega:club.spin*Math.PI*2/60,surface:'air',stopped:false,quality:q};
    this.active=true;this.accum=0;return this.state;
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
      const rel=s.vel.clone().sub(this.wind);const speed=rel.length();
      const drag=rel.clone().multiplyScalar(-.00215*speed);
      const magnus=new THREE.Vector3().crossVectors(s.spinAxis.clone().multiplyScalar(s.spinOmega),rel).multiplyScalar(.00012);
      const acc=new THREE.Vector3(0,-G,0).add(drag).add(magnus);
      s.vel.addScaledVector(acc,FIXED);s.pos.addScaledVector(s.vel,FIXED);s.spinOmega*=.9994;
      const surface=this.surfaceAt(s.pos.x,s.pos.z);
      const ground=surface==='water'?-0.16:this.terrainHeight(s.pos.x,s.pos.z)+.085;
      if(s.pos.y<=ground&&s.vel.y<0){
        s.pos.y=ground;
        if(surface==='water'){s.surface='water';s.vel.set(0,0,0);s.stopped=true;return;}
        if(Math.abs(s.vel.y)>1.8){
          const rest=surface==='green'?.18:surface==='fairway'?.23:surface==='rough'?.11:surface==='sand'?.05:.12;
          const loss=surface==='sand'?.46:surface==='rough'?.68:.82;
          s.vel.y=-s.vel.y*rest;s.vel.x*=loss;s.vel.z*=loss;
        }else{s.vel.y=0;s.surface=surface;}
      }
    }else{
      const surface=this.surfaceAt(s.pos.x,s.pos.z);s.surface=surface;
      const e=.35,dx=(this.terrainHeight(s.pos.x+e,s.pos.z)-this.terrainHeight(s.pos.x-e,s.pos.z))/(2*e),dz=(this.terrainHeight(s.pos.x,s.pos.z+e)-this.terrainHeight(s.pos.x,s.pos.z-e))/(2*e);
      const slope=surface==='green'?.42:surface==='fairway'?.24:.12;
      s.vel.x+=-dx*G*FIXED*slope;s.vel.z+=-dz*G*FIXED*slope;s.vel.y=0;
      const decay=surface==='green'?.988:surface==='fairway'?.974:surface==='rough'?.915:surface==='sand'?.80:.90;
      s.vel.multiplyScalar(Math.pow(decay,FIXED*60));s.pos.addScaledVector(s.vel,FIXED);s.pos.y=this.terrainHeight(s.pos.x,s.pos.z)+.085;
      if(s.vel.length()<.20){s.vel.set(0,0,0);s.stopped=true;}
    }
  }
}