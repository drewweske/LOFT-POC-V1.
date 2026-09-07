import * as THREE from '../vendor/three.module.js';

const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

const owners=new WeakMap();

// One existing WebGL context changes its presentation destination while the
// Workshop is modal. Closing restores the same canvas, size and renderer state;
// neither the physics ball nor the playing camera is ever borrowed or mutated.
export class LoftObjectAtelier{
  constructor(renderer,host,spec){
    this.spec=spec;
    this.renderer=renderer;this.host=host;this.active=false;
    this.scene=null;this.object=null;this.pointer=null;
    this.yaw=0;this.pitch=0;this.targetYaw=0;this.targetPitch=0;
    this.distance=this.spec.distance;this.targetDistance=this.distance;
    this.dirty=true;this.width=0;this.height=0;
    this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer=new ResizeObserver(()=>{this.dirty=true;});
    this.observer.observe(host);
    host.addEventListener('pointerdown',e=>{
      if(!this.active||e.button!==0||this.pointer)return;
      this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
      host.setPointerCapture(e.pointerId);host.focus({preventScroll:true});
      host.classList.add('turning');e.preventDefault();
    });
    host.addEventListener('pointermove',e=>{
      if(this.pointer?.id!==e.pointerId)return;
      this.targetYaw+=(e.clientX-this.pointer.x)*.008;
      this.targetPitch=clamp(this.targetPitch+(e.clientY-this.pointer.y)*.008,-this.spec.maxPitch,this.spec.maxPitch);
      this.pointer.x=e.clientX;this.pointer.y=e.clientY;this.dirty=true;
    });
    const release=e=>{
      if(this.pointer?.id!==e.pointerId)return;
      this.pointer=null;host.classList.remove('turning');
      if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);
    };
    host.addEventListener('pointerup',release);
    host.addEventListener('pointercancel',release);
    host.addEventListener('lostpointercapture',release);
    host.addEventListener('wheel',e=>{
      if(!this.active)return;
      e.preventDefault();e.stopPropagation();
      this.zoom(e.deltaY>0?1:-1);
    },{passive:false});
    host.addEventListener('keydown',e=>{
      if(!this.active)return;
      if(e.key==='ArrowLeft')this.targetYaw-=.20;
      else if(e.key==='ArrowRight')this.targetYaw+=.20;
      else if(e.key==='ArrowUp')this.targetPitch=clamp(this.targetPitch-.16,-this.spec.maxPitch,this.spec.maxPitch);
      else if(e.key==='ArrowDown')this.targetPitch=clamp(this.targetPitch+.16,-this.spec.maxPitch,this.spec.maxPitch);
      else if(e.key==='Home')this.reset();
      else return;
      e.preventDefault();e.stopPropagation();this.dirty=true;
    });
  }

  _build(){
    throw new Error('An atelier must define its inspection scene.');
  }

  open(){
    if(this.active)return;
    if(owners.has(this.renderer))throw new Error('Close the current atelier before borrowing its renderer.');
    this._build();
    const renderer=this.renderer,canvas=renderer.domElement;
    this.saved={parent:canvas.parentNode,next:canvas.nextSibling,size:renderer.getSize(new THREE.Vector2()),exposure:renderer.toneMappingExposure,tabIndex:canvas.tabIndex,ariaLabel:canvas.getAttribute('aria-label')};
    this.host.appendChild(canvas);canvas.tabIndex=-1;canvas.setAttribute('aria-label',this.spec.label);
    owners.set(renderer,this);
    this.active=true;this.width=0;this.height=0;this.dirty=true;
    this.render(1/60);
  }

  close(){
    if(!this.active)return;
    const canvas=this.renderer.domElement;
    if(this.pointer&&this.host.hasPointerCapture(this.pointer.id))this.host.releasePointerCapture(this.pointer.id);
    this.pointer=null;this.host.classList.remove('turning');this.active=false;owners.delete(this.renderer);
    this.saved.parent.insertBefore(canvas,this.saved.next?.parentNode===this.saved.parent?this.saved.next:null);
    canvas.tabIndex=this.saved.tabIndex;
    if(this.saved.ariaLabel===null)canvas.removeAttribute('aria-label');else canvas.setAttribute('aria-label',this.saved.ariaLabel);
    this.renderer.toneMappingExposure=this.saved.exposure;
    this.renderer.setSize(this.saved.size.x,this.saved.size.y,false);
  }

  reset(){
    // Return by the nearest turn, never unwind several complete revolutions.
    this.targetYaw=Math.round(this.yaw/(Math.PI*2))*Math.PI*2;
    this.targetPitch=0;this.targetDistance=this.spec.distance;this.dirty=true;
  }
  zoom(direction){
    this.targetDistance=clamp(this.targetDistance+direction*this.spec.zoomStep,this.spec.minDistance,this.spec.maxDistance);
    this.dirty=true;
  }

  _pose(){
    this.object.rotation.set(this.pitch,this.yaw,0,'YXZ');
    this.camera.position.set(0,0,this.distance/Math.min(1,this.camera.aspect));
    this.camera.lookAt(0,0,0);
    return false;
  }

  render(dt){
    if(!this.active)return false;
    const {width,height}=this.host.getBoundingClientRect();
    if(width<1||height<1)return true;
    if(this.width!==width||this.height!==height){
      this.width=width;this.height=height;
      this.renderer.setSize(width,height,false);
      this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.dirty=true;
    }
    const factor=this.reducedMotion?1:1-Math.exp(-this.spec.damping*dt);
    this.yaw+=(this.targetYaw-this.yaw)*factor;
    this.pitch+=(this.targetPitch-this.pitch)*factor;
    this.distance+=(this.targetDistance-this.distance)*factor;
    const moving=Math.abs(this.targetYaw-this.yaw)+Math.abs(this.targetPitch-this.pitch)+Math.abs(this.targetDistance-this.distance)>.00001;
    if(!this.dirty&&!moving)return true;
    const extraMotion=this._pose(factor);
    this.renderer.toneMappingExposure=this.spec.exposure;
    this.renderer.render(this.scene,this.camera);
    this.dirty=moving||extraMotion;
    return true;
  }
}
