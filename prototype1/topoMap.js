const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class LoftTopoMap{
  constructor(root){
    this.root=root;
    this.player=root.querySelector('#map-player');
    this.target=root.querySelector('#map-target');
    this.aim=root.querySelector('#map-aim');
    this.distance=root.querySelector('#map-distance');
    this.lie=root.querySelector('#map-lie');
  }
  project(x,z){
    // Coastal Ridge prototype bounds: x ±48m, tee z 0m, green ~-156m.
    return {
      x:clamp(47+x*.72,8,86),
      y:clamp(108+z*.59,8,112)
    };
  }
  update({ball,target,pin,surface='TEE'}){
    const p=this.project(ball.x,ball.z);
    const t=this.project(target.x,target.z);
    this.player?.setAttribute('transform',`translate(${p.x} ${p.y})`);
    this.target?.setAttribute('transform',`translate(${t.x} ${t.y})`);
    if(this.aim){
      this.aim.setAttribute('x1',p.x);this.aim.setAttribute('y1',p.y);
      this.aim.setAttribute('x2',t.x);this.aim.setAttribute('y2',t.y);
    }
    if(this.distance){
      const yards=Math.hypot(target.x-ball.x,target.z-ball.z)/.9144;
      this.distance.textContent=Math.round(yards)+' YD';
    }
    if(this.lie)this.lie.textContent=surface.toUpperCase();
  }
}