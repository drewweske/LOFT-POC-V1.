import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,r,dt)=>a+(b-a)*(1-Math.exp(-r*dt));

export class LoftFeedback{
  constructor(scene,C){
    this.scene=scene;
    this.C=C;
    this.audio=null;
    this.master=null;
    this.compressor=null;
    this.noiseBuffer=null;
    this.ambientBuffer=null;
    this.ambienceStarted=false;
    this.rollCooldown=0;

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
      if(!this.ambienceStarted)this._startAmbience();
      return;
    }
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      this.audio=new AC();

      this.master=this.audio.createGain();
      this.master.gain.value=.68;

      this.compressor=this.audio.createDynamicsCompressor();
      this.compressor.threshold.value=-13;
      this.compressor.knee.value=12;
      this.compressor.ratio.value=4;
      this.compressor.attack.value=.0025;
      this.compressor.release.value=.13;
      this.master.connect(this.compressor).connect(this.audio.destination);

      // Short transient source for clubface / turf / cup events.
      const len=Math.floor(this.audio.sampleRate*.42);
      this.noiseBuffer=this.audio.createBuffer(1,len,this.audio.sampleRate);
      const d=this.noiseBuffer.getChannelData(0);
      let brown=0;
      for(let i=0;i<len;i++){
        const white=Math.random()*2-1;
        brown=(brown*.86+white*.14);
        d[i]=(white*.78+brown*.22);
      }

      // Long non-repeating-ish coastal bed. Filtering and slow modulation make
      // this read as wind / distant surf rather than electronic white noise.
      const ambLen=Math.floor(this.audio.sampleRate*5.4);
      this.ambientBuffer=this.audio.createBuffer(1,ambLen,this.audio.sampleRate);
      const a=this.ambientBuffer.getChannelData(0);
      let low=0;
      for(let i=0;i<ambLen;i++){
        const white=Math.random()*2-1;
        low=low*.992+white*.008;
        a[i]=white*.32+low*1.8;
      }
      this._startAmbience();
    }catch{}
  }

  _startAmbience(){
    if(!this.audio||!this.master||!this.ambientBuffer||this.ambienceStarted)return;
    this.ambienceStarted=true;
    const now=this.audio.currentTime;

    const wind=this.audio.createBufferSource();
    const windFilter=this.audio.createBiquadFilter();
    const windGain=this.audio.createGain();
    wind.buffer=this.ambientBuffer;wind.loop=true;
    windFilter.type='bandpass';windFilter.frequency.value=620;windFilter.Q.value=.34;
    windGain.gain.value=.016;
    wind.connect(windFilter).connect(windGain).connect(this.master);

    const windLfo=this.audio.createOscillator();
    const windLfoGain=this.audio.createGain();
    windLfo.frequency.value=.075;windLfoGain.gain.value=.008;
    windLfo.connect(windLfoGain).connect(windGain.gain);

    const surf=this.audio.createBufferSource();
    const surfFilter=this.audio.createBiquadFilter();
    const surfGain=this.audio.createGain();
    surf.buffer=this.ambientBuffer;surf.loop=true;
    surfFilter.type='lowpass';surfFilter.frequency.value=290;surfFilter.Q.value=.55;
    surfGain.gain.value=.010;
    surf.connect(surfFilter).connect(surfGain).connect(this.master);

    const surfLfo=this.audio.createOscillator();
    const surfLfoGain=this.audio.createGain();
    surfLfo.frequency.value=.115;surfLfoGain.gain.value=.009;
    surfLfo.connect(surfLfoGain).connect(surfGain.gain);

    wind.start(now);windLfo.start(now);
    surf.start(now+.21);surfLfo.start(now);
  }

  _tone(freq0,freq1,dur,gain,type='sine',delay=0){
    if(!this.audio||!this.master)return;
    const t=this.audio.currentTime+delay;
    const o=this.audio.createOscillator(),g=this.audio.createGain();
    o.type=type;o.frequency.setValueAtTime(freq0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq1),t+dur);
    g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.02);
  }

  _noise({freq=2200,q=.7,dur=.08,gain=.05,delay=0,type='bandpass'}={}){
    if(!this.audio||!this.master||!this.noiseBuffer)return;
    const t=this.audio.currentTime+delay;
    const s=this.audio.createBufferSource(),f=this.audio.createBiquadFilter(),g=this.audio.createGain();
    s.buffer=this.noiseBuffer;
    f.type=type;f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.002);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t,Math.random()*.08);s.stop(t+dur+.025);
  }

  _vibrate(pattern){
    try{navigator.vibrate?.(pattern);}catch{}
  }

  loadSet(load=.8){
    const l=clamp(load,0,1.08);
    this._noise({freq:520+180*l,q:.72,dur:.026,gain:.006+.006*l});
    this._tone(82,58,.034,.004+.004*l,'sine');
    this._vibrate(3);
  }

  paceLock(){
    if(this.transitionCooldown>0)return;
    this.transitionCooldown=.11;
    // A tiny "magnetic" confirmation when the live pace ghost crosses the
    // chosen landing distance. It is a cue, never an auto-lock.
    this._noise({freq:1650,q:1.25,dur:.018,gain:.010});
    this._tone(150,104,.025,.004,'sine');
    this._vibrate(2);
  }

  puttTransition(load=.35){
    if(this.transitionCooldown>0)return;
    this.transitionCooldown=.06;
    const l=clamp(load,0,1);
    this._noise({freq:620+260*l,q:.55,dur:.028,gain:.006+.006*l});
    this._vibrate(2);
  }

  transition(load=.75){
    if(this.transitionCooldown>0)return;
    this.transitionCooldown=.08;
    this._noise({freq:460,q:.48,dur:.040,gain:.010+.012*clamp(load,0,1)});
    this._tone(76,54,.045,.006+.006*clamp(load,0,1),'sine');
    this._vibrate(4);
  }

  release(speed=.75){
    const s=clamp(speed,0,1.15);
    this._noise({freq:880+980*s,q:.38,dur:.085,gain:.012+.030*s,type:'highpass'});
    this._noise({freq:540+420*s,q:.50,dur:.060,gain:.007+.010*s});

  }

  impact({quality=.8,power=.8,position,direction,club='iron'}){
    const q=clamp(quality,0,1),p=clamp(power,0,1.1);
    this.impactLife=1;
    this.impactRing.position.copy(position);this.impactRing.position.y+=.015;
    this.impactRing.scale.setScalar(club==='putter'?.34:.55);
    this.impactRing.material.opacity=club==='putter'?.42:.62;
    this.impactDot.position.copy(position);this.impactDot.position.y+=.045;
    this.impactDot.scale.setScalar(club==='putter'?.58:(.75+.28*q));
    this.impactDot.material.opacity=club==='putter'?(.22+.24*q):(.30+.42*q);

    if(club==='putter'){
      // Real putting character: elastomer/body knock + milled face tick.
      // No musical success chime; quality is heard as a cleaner, shorter strike.
      this._tone(318,190,.050,.014+.010*p,'sine');
      this._noise({freq:1450+650*q,q:1.35,dur:.025,gain:.026+.032*q});
      this._noise({freq:4200,q:.82,dur:.012,gain:.008+.012*q,delay:.001,type:'highpass'});
      if(q>.955)this._noise({freq:2850,q:2.4,dur:.018,gain:.013,delay:.004});
    }else if(club==='driver'||club==='wood'){
      // Driver / wood: compressed ball-body crack, composite face transient,
      // then a very short air snap. Better strike = tighter transient, not louder UI.
      const body=club==='driver'?104:118;
      this._tone(body,54,.090,.032+.020*p,'sine');
      this._noise({freq:club==='driver'?2450:2850,q:.82,dur:.037,gain:.052+.050*q});
      this._noise({freq:5200,q:.55,dur:.018,gain:.018+.024*q,delay:.002,type:'highpass'});
      if(q>.94)this._noise({freq:3550,q:2.1,dur:.020,gain:.018,delay:.003});
    }else{
      // Iron / wedge: dense metallic face contact with a small turf component.
      const wedge=club==='wedge';
      this._tone(wedge?132:146,66,.070,.025+.018*p,'sine');
      this._noise({freq:wedge?2650:3300,q:1.55,dur:.030,gain:.045+.050*q});
      this._noise({freq:6100,q:.72,dur:.014,gain:.012+.018*q,delay:.001,type:'highpass'});
      this._noise({freq:wedge?520:680,q:.42,dur:wedge?.085:.060,gain:wedge?.025:.016,delay:.010});
    }

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

    this._vibrate(club==='putter'?(q>.95?[3,10,5]:[3]):(q>.94?[5,12,11]:q>.82?[6,10,8]:[8]));
  }

  startFlight(position){
    this.trailPoints=[position.clone()];
    this.lastTrailPoint=position.clone();
    this.trailMat.opacity=0;
  }

  flight(position,quality=.8){
    // Defensive initialization: putting intentionally skips startFlight().
    // Never let a feedback effect crash the entire game loop.
    if(!this.lastTrailPoint){
      this.trailPoints=[position.clone()];
      this.lastTrailPoint=position.clone();
      this.trailMat.opacity=0;
      return;
    }
    if(position.distanceToSquared(this.lastTrailPoint)>.28){
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
    // Cup is the most important reward sound in LOFT: ball catches liner,
    // drops into the cup, then a restrained flagstick/liner tail.
    this._noise({freq:1750,q:1.45,dur:.028,gain:.060});
    this._tone(360,150,.080,.030,'sine',.010);
    this._noise({freq:760,q:.60,dur:.095,gain:.030,delay:.020});
    this._noise({freq:2850,q:2.0,dur:.036,gain:.020,delay:.050});
    if(score<0)this._noise({freq:2100,q:1.25,dur:.050,gain:.018,delay:.090});
    this._vibrate(score<0?[7,18,10,24,16]:[8,18,12]);
  }

  surfaceTransition(to,speed=0){
    const s=clamp(speed/8,0,1);
    if(to==='rough'){
      this._noise({freq:820,q:.55,dur:.060,gain:.010+.016*s});
    }else if(to==='firstCut'){
      this._noise({freq:920,q:.58,dur:.044,gain:.007+.011*s});
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
      this._noise({freq:430,q:.36,dur:.150,gain:.058});
      this._noise({freq:1150,q:.48,dur:.070,gain:.022,delay:.006});
      this._tone(82,48,.095,.015,'sine');
      this._vibrate([5,8,5]);
    }else if(surface==='water'){
      this._noise({freq:310,q:.30,dur:.190,gain:.072});
      this._noise({freq:1350,q:.40,dur:.110,gain:.028,delay:.010});
      this._tone(120,52,.120,.018,'sine');
      this._vibrate([5,10,5]);
    }else if(surface==='rough'||surface==='firstCut'){
      this._noise({freq:520,q:.38,dur:.105,gain:.034});
      this._tone(94,52,.070,.012,'sine');
      this._vibrate(surface==='rough'?5:4);
    }else{
      const green=surface==='green'||surface==='fringe';
      this._tone(green?108:96,52,.070,.016,'sine');
      this._noise({freq:green?1280:860,q:.52,dur:green?.045:.060,gain:green?.018:.024});
      this._vibrate(green?3:5);
    }
  }

  roll(surface='fairway',speed=0){
    if(!this.audio||speed<.035||this.rollCooldown>0)return;
    const v=clamp(speed,0,8);
    const green=surface==='green'||surface==='fringe';
    const rough=surface==='rough';
    const firstCut=surface==='firstCut';
    const sand=surface==='sand';

    // Sparse grains imply the ball's dimples interacting with the cut without
    // turning the soundtrack into a continuous hiss.
    if(sand){
      this._noise({freq:360,q:.32,dur:.028,gain:.004+.004*clamp(v/2,0,1)});
    }else if(rough){
      this._noise({freq:520,q:.40,dur:.020,gain:.003+.004*clamp(v/3,0,1)});
    }else if(firstCut){
      this._noise({freq:700,q:.46,dur:.017,gain:.0028+.0038*clamp(v/3.5,0,1)});
    }else if(green){
      this._noise({freq:1500,q:.80,dur:.010,gain:.0025+.0035*clamp(v/2.2,0,1)});
    }else{
      this._noise({freq:920,q:.55,dur:.014,gain:.003+.004*clamp(v/4,0,1)});
    }
    this.rollCooldown=clamp(.115-v*.008,.045,.115);
  }

  update(dt){
    this.transitionCooldown=Math.max(0,this.transitionCooldown-dt);
    this.rollCooldown=Math.max(0,this.rollCooldown-dt);

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
