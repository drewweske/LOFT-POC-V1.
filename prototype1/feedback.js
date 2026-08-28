import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));

export class LoftFeedback{
  constructor(scene,C){
    this.scene=scene;
    this.C=C;
    this.audio=null;
    this.master=null;
    this.noiseBuffer=null;

    this.impactLife=0;
    this.landLife=0;
    this.transitionCooldown=0;

    this.impactRing=new THREE.Mesh(
      new THREE.RingGeometry(.10,.15,42),
      new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})
    );
    this.impactRing.rotation.x=-Math.PI/2;
    this.impactRing.renderOrder=8;
    scene.add(this.impactRing);

    this.impactDot=new THREE.Mesh(
      new THREE.SphereGeometry(.045,18,12),
      new THREE.MeshBasicMaterial({color:C.orange,transparent:true,opacity:0,depthWrite:false})
    );
    this.impactDot.renderOrder=9;
    scene.add(this.impactDot);

    this.landRing=new THREE.Mesh(
      new THREE.RingGeometry(.14,.20,42),
      new THREE.MeshBasicMaterial({color:C.cream,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})
    );
    this.landRing.rotation.x=-Math.PI/2;
    this.landRing.renderOrder=7;
    scene.add(this.landRing);

    this.trailN=20;
    this.trailPositions=new Float32Array(this.trailN*3);
    this.trailGeo=new THREE.BufferGeometry();
    this.trailGeo.setAttribute('position',new THREE.BufferAttribute(this.trailPositions,3));
    this.trailMat=new THREE.LineBasicMaterial({color:C.cream,transparent:true,opacity:0,depthWrite:false});
    this.trail=new THREE.Line(this.trailGeo,this.trailMat);
    this.trail.frustumCulled=false;
    this.trail.renderOrder=6;
    scene.add(this.trail);
    this.trailPoints=[];
    this.lastTrailPoint=null;

    this.turf=[];
    const turfMat=new THREE.MeshStandardMaterial({color:0x657f52,roughness:1});
    for(let i=0;i<10;i++){
      const m=new THREE.Mesh(new THREE.BoxGeometry(.018,.010,.050),turfMat);
      m.visible=false;m.castShadow=false;scene.add(m);
      this.turf.push({mesh:m,vel:new THREE.Vector3(),life:0,spin:0});
    }
  }

  async unlock(){
    if(this.audio){
      if(this.audio.state==='suspended')try{await this.audio.resume();}catch{}
      return;
    }
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      this.audio=new AC();
      this.master=this.audio.createGain();
      this.master.gain.value=.56;
      this.master.connect(this.audio.destination);

      const len=Math.floor(this.audio.sampleRate*.16);
      this.noiseBuffer=this.audio.createBuffer(1,len,this.audio.sampleRate);
      const d=this.noiseBuffer.getChannelData(0);
      for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    }catch{}
  }

  _tone(freq0,freq1,dur,gain,type='sine',delay=0){
    if(!this.audio||!this.master)return;
    const t=this.audio.currentTime+delay;
    const o=this.audio.createOscillator(),g=this.audio.createGain();
    o.type=type;o.frequency.setValueAtTime(freq0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq1),t+dur);
    g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.02);
  }

  _noise({freq=2200,q=.7,dur=.08,gain=.05,delay=0}={}){
    if(!this.audio||!this.master||!this.noiseBuffer)return;
    const t=this.audio.currentTime+delay;
    const s=this.audio.createBufferSource(),f=this.audio.createBiquadFilter(),g=this.audio.createGain();
    s.buffer=this.noiseBuffer;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f).connect(g).connect(this.master);s.start(t);s.stop(t+dur+.02);
  }

  _vibrate(pattern){
    try{navigator.vibrate?.(pattern);}catch{}
  }

  loadSet(load=.8){
    const l=clamp(load,0,1.08);
    this._tone(74,58,.045,.010+.010*l,'sine');
    this._tone(520,330,.028,.006+.005*l,'triangle',.003);
    this._vibrate(3);
  }

  transition(load=.75){
    if(this.transitionCooldown>0)return;
    this.transitionCooldown=.08;
    this._tone(92,72,.055,.018+.018*clamp(load,0,1),'sine');
    this._vibrate(4);
  }

  release(speed=.75){
    const s=clamp(speed,0,1.15);
    this._noise({freq:760+520*s,q:.42,dur:.075,gain:.014+.025*s});
    this._tone(220+120*s,105,.055,.009+.010*s,'triangle');
  }

  impact({quality=.8,power=.8,position,direction,club='iron'}){
    const q=clamp(quality,0,1),p=clamp(power,0,1.1);
    this.impactLife=1;
    this.impactRing.position.copy(position);this.impactRing.position.y+=.015;
    this.impactRing.scale.setScalar(.55);
    this.impactRing.material.opacity=.62;
    this.impactDot.position.copy(position);this.impactDot.position.y+=.045;
    this.impactDot.scale.setScalar(.75+.28*q);
    this.impactDot.material.opacity=.30+.42*q;

    // Three-layer strike: low compression body, metallic face click, air snap.
    const body=club==='driver'?112:club==='wood'?124:club==='putter'?82:142;
    const click=club==='driver'?1180:club==='wood'?1320:club==='putter'?560:1760;
    this._tone(body,58,.105,.055+.035*p,'sine');
    this._tone(click,click*.34,.055,.045+.075*q,'triangle',.002);
    this._noise({freq:1800+2200*q,q:.72,dur:.065,gain:.025+.050*q,delay:.001});

    if(q>.94)this._tone(2820,1540,.040,.023,'sine',.006);

    const dir=direction.clone().normalize();
    const side=new THREE.Vector3(dir.z,0,-dir.x);
    const turfCount=club==='driver'||club==='wood'?3:club==='putter'?0:this.turf.length;
    this.turf.forEach((t,i)=>{
      if(i>=turfCount){t.life=0;t.mesh.visible=false;return;}
      const k=i/Math.max(1,turfCount-1)-.5;
      t.mesh.visible=true;
      t.mesh.position.copy(position).add(new THREE.Vector3(0,.025,0));
      t.vel.copy(dir).multiplyScalar(.65+Math.random()*.55)
        .addScaledVector(side,k*.7)
        .add(new THREE.Vector3(0,.42+Math.random()*.52,0));
      t.life=.36+Math.random()*.22;
      t.spin=(Math.random()-.5)*12;
    });

    this._vibrate(q>.94?[5,12,11]:q>.82?[6,10,8]:[8]);
  }

  startFlight(position){
    this.trailPoints=[position.clone()];
    this.lastTrailPoint=position.clone();
    this.trailMat.opacity=0;
  }

  flight(position,quality=.8){
    if(!this.lastTrailPoint||position.distanceToSquared(this.lastTrailPoint)>.28){
      this.trailPoints.push(position.clone());
      if(this.trailPoints.length>this.trailN)this.trailPoints.shift();
      this.lastTrailPoint.copy(position);
    }
    const n=this.trailPoints.length;
    if(n<2){this.trailMat.opacity=0;return;}
    const first=this.trailPoints[0];
    for(let i=0;i<this.trailN;i++){
      const src=this.trailPoints[Math.max(0,n-this.trailN+i)]||first;
      const j=i*3;this.trailPositions[j]=src.x;this.trailPositions[j+1]=src.y;this.trailPositions[j+2]=src.z;
    }
    this.trailGeo.attributes.position.needsUpdate=true;
    this.trailMat.opacity=.08+.10*clamp(quality,0,1);
  }

  cup({position,score=0}={}){
    if(position){
      this.landLife=1;
      this.landRing.position.copy(position);this.landRing.position.y+=.02;
      this.landRing.scale.setScalar(.42);this.landRing.material.opacity=.42;
    }
    // The LOFT cup sound is intentionally small and physical: ball, liner, flagstick.
    this._tone(410,188,.085,.050,'triangle');
    this._tone(780,330,.075,.038,'sine',.025);
    this._noise({freq:1450,q:1.2,dur:.10,gain:.025,delay:.018});
    if(score<0)this._tone(1180,620,.13,.026,'sine',.095);
    this._vibrate(score<0?[7,18,10,24,16]:[8,18,12]);
  }

  surfaceTransition(to,speed=0){
    const s=clamp(speed/8,0,1);
    if(to==='rough'){
      this._noise({freq:820,q:.55,dur:.060,gain:.010+.016*s});
    }else if(to==='sand'){
      this._noise({freq:560,q:.48,dur:.085,gain:.018+.022*s});
      this._vibrate(3);
    }else if(to==='green'||to==='fringe'){
      this._tone(126,84,.040,.008+.008*s,'sine');
    }
  }

  land({surface='fairway',position,quality=.8}){
    this.landLife=1;
    this.landRing.position.copy(position);this.landRing.position.y+=.018;
    this.landRing.scale.setScalar(.60);
    this.landRing.material.opacity=surface==='water'?.42:.30;
    this.trailMat.opacity*=.45;

    if(surface==='sand'){
      this._noise({freq:730,q:.55,dur:.12,gain:.06});
      this._tone(96,56,.085,.028,'sine');
      this._vibrate([5,8,5]);
    }else if(surface==='water'){
      this._noise({freq:420,q:.45,dur:.15,gain:.07});
      this._tone(180,72,.13,.035,'sine');
      this._vibrate([5,10,5]);
    }else{
      this._tone(surface==='green'?122:108,52,.085,.032,'sine');
      this._noise({freq:980,q:.5,dur:.055,gain:.018});
      this._vibrate(5);
    }
  }

  update(dt){
    this.transitionCooldown=Math.max(0,this.transitionCooldown-dt);

    if(this.impactLife>0){
      this.impactLife=Math.max(0,this.impactLife-dt*7.2);
      const t=1-this.impactLife;
      this.impactRing.scale.setScalar(.55+t*2.15);
      this.impactRing.material.opacity=.62*this.impactLife*this.impactLife;
      this.impactDot.scale.setScalar(.9+t*.65);
      this.impactDot.material.opacity=.52*this.impactLife;
    }

    if(this.landLife>0){
      this.landLife=Math.max(0,this.landLife-dt*3.3);
      const t=1-this.landLife;
      this.landRing.scale.setScalar(.6+t*3.1);
      this.landRing.material.opacity=.30*this.landLife*this.landLife;
    }

    for(const t of this.turf){
      if(t.life<=0){t.mesh.visible=false;continue;}
      t.life-=dt;
      t.vel.y-=3.9*dt;
      t.mesh.position.addScaledVector(t.vel,dt);
      t.mesh.rotation.x+=t.spin*dt;
      t.mesh.rotation.z-=t.spin*.7*dt;
      if(t.life<=0)t.mesh.visible=false;
    }

    this.trailMat.opacity=smooth(this.trailMat.opacity,0,1.25,dt);
  }

  clear(){
    this.trailPoints=[];this.lastTrailPoint=null;this.trailMat.opacity=0;
    this.impactLife=0;this.landLife=0;
    this.impactRing.material.opacity=0;this.impactDot.material.opacity=0;this.landRing.material.opacity=0;
    this.turf.forEach(t=>{t.life=0;t.mesh.visible=false;});
  }
}
