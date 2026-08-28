const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class LoftTopoMap{
  constructor(root){
    this.root=root;
    this.player=root.querySelector('#map-player');
    this.target=root.querySelector('#map-target');
    this.aim=root.querySelector('#map-aim');
    this.distance=root.querySelector('#map-distance');
    this.lie=root.querySelector('#map-lie');
    this.svg=root.querySelector('svg');
    this.pinMark=root.querySelector('.map-pin');
    this.tee={x:0,z:0};
    this.pin={x:0,z:-156};
    this.fx=0;this.fz=-1;this.rx=1;this.rz=0;this.length=156;
  }
  setHole(tee,pin){
    this.tee={x:tee.x,z:tee.z};this.pin={x:pin.x,z:pin.z};
    const dx=pin.x-tee.x,dz=pin.z-tee.z;
    this.length=Math.max(1,Math.hypot(dx,dz));
    this.fx=dx/this.length;this.fz=dz/this.length;
    this.rx=-this.fz;this.rz=this.fx;
    if(this.pinMark){
      const p=this.project(pin.x,pin.z);
      this.pinMark.setAttribute('transform',`translate(${p.x} ${p.y})`);
    }
  }
  project(x,z){
    const dx=x-this.tee.x,dz=z-this.tee.z;
    const along=dx*this.fx+dz*this.fz;
    const lateral=dx*this.rx+dz*this.rz;
    const t=clamp(along/this.length,0,1.08);
    return {
      x:clamp(47+lateral*.82,8,86),
      y:clamp(108-t*94,8,112)
    };
  }

  unproject(x,y){
    const sx=clamp(x,8,86),sy=clamp(y,8,112);
    const lateral=(sx-47)/.82;
    const t=clamp((108-sy)/94,0,1.08);
    const along=t*this.length;
    return {
      x:this.tee.x+this.fx*along+this.rx*lateral,
      z:this.tee.z+this.fz*along+this.rz*lateral
    };
  }

  worldFromClient(clientX,clientY){
    if(!this.svg)return null;
    const r=this.svg.getBoundingClientRect();
    if(r.width<1||r.height<1)return null;
    const x=(clientX-r.left)/r.width*94;
    const y=(clientY-r.top)/r.height*120;
    return this.unproject(x,y);
  }

  update({ball,target,pin,surface='TEE',distanceUnit='YD'}){
    const p=this.project(ball.x,ball.z);
    const t=this.project(target.x,target.z);
    this.player?.setAttribute('transform',`translate(${p.x} ${p.y})`);
    this.target?.setAttribute('transform',`translate(${t.x} ${t.y})`);
    if(this.aim){
      this.aim.setAttribute('x1',p.x);this.aim.setAttribute('y1',p.y);
      this.aim.setAttribute('x2',t.x);this.aim.setAttribute('y2',t.y);
    }
    if(this.distance){
      const meters=Math.hypot(target.x-ball.x,target.z-ball.z);
      this.distance.textContent=distanceUnit==='FT'
        ? Math.max(1,Math.round(meters*3.28084))+' FT'
        : Math.max(1,Math.round(meters/.9144))+' YD';
    }
    if(this.lie)this.lie.textContent=surface.toUpperCase();
  }
}
