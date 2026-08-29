import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const out=t=>1-Math.pow(1-t,3);

export class LoftGolferRig{
  constructor(C){
    this.C=C;this.group=new THREE.Group();this.group.name='LOFT_GOLFER';
    this.mat=(c,r=.84,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    this.skin=this.mat(0xb77c5a,.88);
    this.ink=this.mat(C.ink,.90);
    this.cream=this.mat(C.cream,.96);
    this.stone=this.mat(C.stone,.94);
    this.hair=this.mat(0x241e1a,.97);
    this.orange=this.mat(C.orange,.74);
    this.steel=this.mat(0xb6b8b4,.32,.60);
    this.parts=[];this._build();this.setPose(0,{form:.18,sway:.11,earlyExt:.11,plane:.20,balance:.48,finish:.58});
  }
  _add(mesh){mesh.castShadow=true;this.group.add(mesh);this.parts.push(mesh);return mesh;}
  _shape(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
    const m=this._add(new THREE.Mesh(geo,mat));m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);return m;
  }
  _lathe(profile,mat,segments=24){
    const pts=profile.map(([r,y])=>new THREE.Vector2(r,y));
    return this._add(new THREE.Mesh(new THREE.LatheGeometry(pts,segments),mat));
  }
  _ellipticBody(sections,mat,radial=16){
    const pos=[],idx=[];
    for(let s=0;s<sections.length;s++){
      const [y,depth,width]=sections[s];
      for(let i=0;i<radial;i++){
        const a=i/radial*Math.PI*2;
        pos.push(Math.cos(a)*depth,y,Math.sin(a)*width);
      }
    }
    for(let s=0;s<sections.length-1;s++){
      for(let i=0;i<radial;i++){
        const n=(i+1)%radial;
        const a=s*radial+i,b=s*radial+n,c=(s+1)*radial+i,d=(s+1)*radial+n;
        idx.push(a,c,b,b,c,d);
      }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setIndex(idx);g.computeVertexNormals();
    return this._add(new THREE.Mesh(g,mat));
  }
  _segment(r,mat,taper=.88,segments=14){
    const m=this._add(new THREE.Mesh(new THREE.CylinderGeometry(r*taper,r,1,segments),mat));
    m.userData.baseRadius=r;
    return m;
  }
  _between(mesh,a,b,r){
    const mid=a.clone().add(b).multiplyScalar(.5),len=Math.max(.001,a.distanceTo(b));
    mesh.position.copy(mid);
    mesh.scale.set(1,len*1.085,1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  }
  _build(){
    // Authored LOFT body volumes: tapered, human, athletic, not toy-spherical.
    this.pelvis=this._lathe([
      [.165,-.16],[.195,-.11],[.208,-.02],[.202,.08],[.174,.16]
    ],this.ink,26);

    // One authored shirt volume: narrow waist, believable chest depth,
    // broad but attainable shoulders. This removes the stacked-barrel torso read.
    this.torso=this._ellipticBody([
      [-.38,.128,.170],
      [-.27,.138,.184],
      [-.10,.148,.202],
      [.08,.158,.226],
      [.23,.165,.257],
      [.35,.142,.278]
    ],this.cream,18);

    this.chest=this._lathe([[.01,-.01],[.01,.01]],this.cream,8);
    this.chest.visible=false;
    this.waist=this._lathe([[.01,-.01],[.01,.01]],this.cream,8);
    this.waist.visible=false;

    this.belt=this._shape(new THREE.CylinderGeometry(.198,.198,.048,30),this.ink);

    // Hidden overlap volumes are deliberate: this is a stylized human, not a
    // collection of disconnected primitives. These seals keep silhouette
    // continuity through the full golf motion.
    this.hipSealL=this._shape(new THREE.SphereGeometry(.098,20,14),this.ink,[0,0,0],[.92,.78,1.02]);
    this.hipSealR=this._shape(new THREE.SphereGeometry(.098,20,14),this.ink,[0,0,0],[.92,.78,1.02]);
    this.shoulderSealL=this._shape(new THREE.SphereGeometry(.092,20,14),this.cream,[0,0,0],[1.10,.92,1.02]);
    this.shoulderSealR=this._shape(new THREE.SphereGeometry(.092,20,14),this.cream,[0,0,0],[1.10,.92,1.02]);
    this.wristSealL=this._shape(new THREE.SphereGeometry(.040,16,12),this.skin,[0,0,0],[.90,.86,.90]);
    this.wristSealR=this._shape(new THREE.SphereGeometry(.040,16,12),this.skin,[0,0,0],[.90,.86,.90]);
    this.ankleSealL=this._shape(new THREE.SphereGeometry(.062,16,12),this.ink,[0,0,0],[.86,.72,.90]);
    this.ankleSealR=this._shape(new THREE.SphereGeometry(.062,16,12),this.ink,[0,0,0],[.86,.72,.90]);

    // Tapered limbs with joint caps remove the segmented mannequin read.
    this.thighL=this._segment(.086,this.ink,.82,16);this.thighR=this._segment(.086,this.ink,.82,16);
    this.calfL=this._segment(.071,this.ink,.76,16);this.calfR=this._segment(.071,this.ink,.76,16);
    this.kneeL=this._shape(new THREE.SphereGeometry(.073,18,14),this.ink);
    this.kneeR=this._shape(new THREE.SphereGeometry(.073,18,14),this.ink);

    this.shoeL=this._shape(new THREE.CapsuleGeometry(.065,.15,6,14),this.stone,[0,0,0],[1,1,1],[0,0,Math.PI/2]);
    this.shoeR=this._shape(new THREE.CapsuleGeometry(.065,.15,6,14),this.stone,[0,0,0],[1,1,1],[0,0,Math.PI/2]);

    this.sleeveL=this._segment(.073,this.cream,.84,16);this.sleeveR=this._segment(.073,this.cream,.84,16);
    this.upperL=this._segment(.052,this.skin,.84,16);this.upperR=this._segment(.052,this.skin,.84,16);
    this.foreL=this._segment(.046,this.skin,.78,16);this.foreR=this._segment(.046,this.skin,.78,16);
    this.elbowL=this._shape(new THREE.SphereGeometry(.050,16,12),this.skin);
    this.elbowR=this._shape(new THREE.SphereGeometry(.050,16,12),this.skin);
    this.handL=this._shape(new THREE.CapsuleGeometry(.035,.050,5,12),this.skin,[0,0,0],[.92,.92,.78]);
    this.handR=this._shape(new THREE.CapsuleGeometry(.035,.050,5,12),this.skin,[0,0,0],[.92,.92,.78]);

    this.neck=this._shape(new THREE.CylinderGeometry(.068,.075,.165,18),this.skin);
    this.head=this._shape(new THREE.SphereGeometry(.137,34,26),this.skin,[0,0,0],[.78,1.02,.84]);
    this.jaw=this._shape(new THREE.SphereGeometry(.088,28,20),this.skin,[0,0,0],[.82,.48,.76]);
    this.jaw.visible=true;
    this.nose=this._shape(new THREE.SphereGeometry(.024,18,14),this.skin,[0,0,0],[1.18,.70,.72]);
    this.earL=this._shape(new THREE.SphereGeometry(.022,14,10),this.skin,[0,0,0],[.65,1,.52]);
    this.earR=this._shape(new THREE.SphereGeometry(.022,14,10),this.skin,[0,0,0],[.65,1,.52]);

    // Hair stays subordinate to a proper low-profile golf cap.
    this.hairMass=this._shape(new THREE.SphereGeometry(.138,24,16),this.hair,[0,0,0],[.84,.34,.88]);
    this.cap=this._shape(new THREE.CylinderGeometry(.126,.143,.060,30),this.ink);
    this.capDome=this._shape(new THREE.SphereGeometry(.143,30,20),this.ink,[0,0,0],[1,.28,1]);
    this.brim=this._shape(new THREE.CapsuleGeometry(.032,.105,5,12),this.ink,[0,0,0],[1,.36,1],[Math.PI/2,0,Math.PI/2]);
    this.capSignal=this._shape(new THREE.SphereGeometry(.012,12,8),this.orange);

    // Controlled face: tiny features, no emoji / caricature expression.
    this.eyeL=this._shape(new THREE.SphereGeometry(.0065,10,8),this.ink,[0,0,0],[1,.90,.65]);
    this.eyeR=this._shape(new THREE.SphereGeometry(.0065,10,8),this.ink,[0,0,0],[1,.90,.65]);
    this.browL=this._shape(new THREE.BoxGeometry(.027,.006,.008),this.hair);
    this.browR=this._shape(new THREE.BoxGeometry(.027,.006,.008),this.hair);
    this.collar=this._shape(new THREE.TorusGeometry(.076,.009,8,26),this.stone,[0,0,0],[1,1,.88],[Math.PI/2,0,0]);
    this.collar.visible=true;
    this.chestSignal=this._shape(new THREE.SphereGeometry(.009,10,8),this.orange);

    this.grip=this._segment(.023,this.ink,.96,12);
    this.shaft=this._segment(.0105,this.steel,.98,12);
    this.clubHead=this._shape(new THREE.BoxGeometry(.098,.045,.146),this.steel);
    this.clubType='iron';
  }

  setClub(type='iron'){
    if(this.clubType===type)return;this.clubType=type;
    this.clubHead.geometry.dispose();
    if(type==='driver'){
      this.clubHead.geometry=new THREE.SphereGeometry(.054,28,20);this.clubHead.scale.set(1.18,.58,1.34);this.clubHead.material=this.ink;
    }else if(type==='wood'){
      this.clubHead.geometry=new THREE.SphereGeometry(.049,26,18);this.clubHead.scale.set(1.14,.58,1.26);this.clubHead.material=this.ink;
    }else if(type==='hybrid'){
      this.clubHead.geometry=new THREE.SphereGeometry(.055,20,14);this.clubHead.scale.set(1.10,.61,1.24);this.clubHead.material=this.ink;
    }else if(type==='putter'){
      this.clubHead.geometry=new THREE.BoxGeometry(.118,.032,.168);this.clubHead.scale.set(1,1,1);this.clubHead.material=this.ink;
    }else{
      this.clubHead.geometry=new THREE.BoxGeometry(.098,.045,.146);this.clubHead.scale.set(1,1,1);this.clubHead.material=this.steel;
    }
  }
  _v(a){return new THREE.Vector3(a[0],a[1],a[2]);}
  _mix(a,b,t){const o={};for(const k in a){const A=a[k],B=b[k];o[k]=[lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t)];}return o;}
  _poses(){
    return {
      address:{pelvis:[-.50,.94,0],torso:[-.42,1.33,0],chest:[-.37,1.52,0],head:[-.38,1.975,0],
        hipL:[-.50,.91,-.145],hipR:[-.50,.91,.145],kneeL:[-.47,.47,-.19],kneeR:[-.44,.48,.20],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.34,1.53,-.215],shoulderR:[-.34,1.53,.215],sleeveL:[-.20,1.37,-.19],sleeveR:[-.20,1.38,.19],elbowL:[-.04,1.18,-.15],elbowR:[-.035,1.19,.155],handL:[.17,.94,-.042],handR:[.18,.935,.040],club:[.39,.055,0]},
      takeaway:{pelvis:[-.51,.94,.01],torso:[-.44,1.34,.02],chest:[-.41,1.53,.03],head:[-.39,1.975,.025],
        hipL:[-.48,.91,-.13],hipR:[-.53,.91,.16],kneeL:[-.46,.47,-.19],kneeR:[-.46,.48,.20],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.33,1.55,-.13],shoulderR:[-.48,1.56,.23],sleeveL:[-.22,1.42,-.10],sleeveR:[-.36,1.43,.22],elbowL:[-.10,1.32,-.04],elbowR:[-.28,1.34,.24],handL:[-.08,1.25,.18],handR:[-.10,1.23,.25],club:[-.04,.30,.73]},
      top:{pelvis:[-.52,.95,.035],torso:[-.48,1.35,.07],chest:[-.48,1.54,.10],head:[-.41,1.98,.07],
        hipL:[-.45,.91,-.08],hipR:[-.56,.92,.18],kneeL:[-.44,.47,-.18],kneeR:[-.49,.50,.19],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.27,1.52,.04],shoulderR:[-.55,1.58,.25],sleeveL:[-.29,1.49,.13],sleeveR:[-.49,1.50,.29],elbowL:[-.34,1.52,.20],elbowR:[-.55,1.53,.36],handL:[-.45,1.78,.37],handR:[-.50,1.76,.43],club:[-.72,2.02,.92]},
      delivery:{pelvis:[-.47,.95,-.025],torso:[-.42,1.34,.0],chest:[-.39,1.54,-.015],head:[-.37,1.97,.015],
        hipL:[-.42,.92,-.17],hipR:[-.52,.91,.11],kneeL:[-.42,.47,-.20],kneeR:[-.49,.52,.18],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.31,1.56,-.19],shoulderR:[-.43,1.52,.14],sleeveL:[-.18,1.43,-.15],sleeveR:[-.31,1.39,.15],elbowL:[-.08,1.29,-.12],elbowR:[-.19,1.25,.15],handL:[.06,1.10,.00],handR:[.045,1.08,.075],club:[.02,.42,.30]},
      impact:{pelvis:[-.45,.96,-.05],torso:[-.39,1.35,-.045],chest:[-.36,1.55,-.07],head:[-.36,1.97,-.02],
        hipL:[-.39,.93,-.19],hipR:[-.51,.91,.08],kneeL:[-.40,.47,-.20],kneeR:[-.50,.53,.17],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.30,1.58,-.23],shoulderR:[-.38,1.51,.11],sleeveL:[-.17,1.44,-.20],sleeveR:[-.26,1.37,.12],elbowL:[-.04,1.27,-.18],elbowR:[-.11,1.22,.11],handL:[.16,.995,-.055],handR:[.17,.985,.042],club:[.39,.055,-.02]},
      release:{pelvis:[-.44,.97,-.085],torso:[-.40,1.38,-.11],chest:[-.39,1.58,-.15],head:[-.38,2.00,-.08],
        hipL:[-.38,.94,-.20],hipR:[-.51,.92,.05],kneeL:[-.39,.47,-.20],kneeR:[-.51,.56,.14],ankleL:[-.45,.115,-.20],ankleR:[-.40,.125,.20],
        shoulderL:[-.39,1.63,-.28],shoulderR:[-.31,1.54,.03],sleeveL:[-.28,1.51,-.30],sleeveR:[-.18,1.43,-.04],elbowL:[-.14,1.39,-.33],elbowR:[-.05,1.32,-.16],handL:[.02,1.31,-.39],handR:[-.015,1.29,-.32],club:[-.08,.72,-.82]},
      finish:{pelvis:[-.45,.98,-.10],torso:[-.46,1.42,-.16],chest:[-.47,1.62,-.20],head:[-.45,2.04,-.13],
        hipL:[-.38,.95,-.20],hipR:[-.53,.93,.02],kneeL:[-.39,.48,-.20],kneeR:[-.56,.60,.09],ankleL:[-.45,.115,-.20],ankleR:[-.48,.15,.15],
        shoulderL:[-.54,1.67,-.28],shoulderR:[-.34,1.61,-.05],sleeveL:[-.48,1.58,-.33],sleeveR:[-.27,1.51,-.12],elbowL:[-.41,1.55,-.39],elbowR:[-.23,1.48,-.28],handL:[-.35,1.76,-.45],handR:[-.40,1.73,-.39],club:[-.78,2.05,-.95]}
    };
  }
  _puttPose(t,level){
    const base=this._poses().address;
    const p={};for(const k in base)p[k]=[...base[k]];

    // Compact putting setup: narrower base, eyes quieter, arms hanging under shoulders.
    p.ankleL[2]=-.14;p.ankleR[2]=.14;
    p.kneeL[2]=-.13;p.kneeR[2]=.13;
    p.pelvis[0]=-.48;p.torso[0]=-.37;p.chest[0]=-.31;p.head[0]=-.25;
    p.head[1]=1.90;
    p.shoulderL=[-.30,1.51,-.18];p.shoulderR=[-.30,1.51,.18];
    p.sleeveL=[-.17,1.34,-.15];p.sleeveR=[-.17,1.34,.15];
    p.elbowL=[-.02,1.17,-.11];p.elbowR=[-.02,1.17,.11];

    const tt=clamp(t,0,1);
    let phase;
    if(tt<.38)phase=lerp(0,.24,ease(tt/.38));        // backstroke
    else if(tt<.60)phase=lerp(.24,0,out((tt-.38)/.22)); // return to impact
    else phase=lerp(0,-.34,out((tt-.60)/.40));          // roll-through

    const rookie=1-level.form;
    const wobble=rookie*.025*Math.sin(tt*Math.PI*2.2);
    p.handL=[.17,.94,-.035+phase*.24+wobble];
    p.handR=[.18,.935,.038+phase*.24-wobble*.5];
    p.club=[.40,.055,phase];

    // The shoulders rock; hips stay nearly still.
    p.shoulderL[1]+=phase*.055;p.shoulderR[1]-=phase*.055;
    p.head[2]+=rookie*.012*Math.sin(tt*Math.PI);
    return p;
  }

  _poseAt(t,level){
    if(this.clubType==='putter')return this._puttPose(t,level);
    const P=this._poses();let p;
    if(t<.16)p=this._mix(P.address,P.takeaway,ease(t/.16));
    else if(t<.38)p=this._mix(P.takeaway,P.top,ease((t-.16)/.22));
    else if(t<.50)p=this._mix(P.top,P.delivery,ease((t-.38)/.12));
    else if(t<.60)p=this._mix(P.delivery,P.impact,out((t-.50)/.10));
    else if(t<.77)p=this._mix(P.impact,P.release,out((t-.60)/.17));
    else p=this._mix(P.release,P.finish,out((t-.77)/.23));

    const rookie=1-level.form;
    const downswing=Math.max(0,1-Math.abs(t-.55)/.22);
    const back=Math.max(0,1-Math.abs(t-.34)/.34);
    const fin=clamp((t-.72)/.28,0,1);
    const setupBias=1-.42*t;

    // Athletic golf posture is present at every level: hip hinge toward the ball,
    // soft knees, shorter neck and arms hanging naturally from the shoulders.
    // Skill changes the QUALITY of that posture, not whether it looks like golf.
    const hinge=.075+.032*level.form;
    p.head[0]+=hinge;
    p.head[1]-=.050;
    p.chest[0]+=hinge*.78;
    p.torso[0]+=hinge*.58;
    p.shoulderL[0]+=hinge*.72;p.shoulderR[0]+=hinge*.72;
    p.sleeveL[0]+=hinge*.55;p.sleeveR[0]+=hinge*.55;
    p.kneeL[0]+=.026;p.kneeR[0]+=.026;
    p.kneeL[1]-=.010;p.kneeR[1]-=.010;

    // Even before motion begins, mastery is visible in posture and base.
    p.head[0]+=rookie*.035*setupBias;
    p.torso[0]+=rookie*.028*setupBias;
    p.chest[0]+=rookie*.022*setupBias;
    p.handL[1]+=rookie*.020*setupBias;p.handR[1]+=rookie*.020*setupBias;
    p.ankleL[2]+=rookie*.018*setupBias;p.ankleR[2]-=rookie*.018*setupBias;
    p.kneeL[0]+=rookie*.018*setupBias;p.kneeR[0]+=rookie*.018*setupBias;

    // Beginner form is visibly inefficient rather than merely slower.
    p.head[0]+=Math.sin(t*Math.PI*2.1)*level.sway;
    p.head[2]+=back*level.sway*.55;

    // Limited coil at the top: hands/club never reach the clean mastered height.
    p.handL[1]-=back*rookie*.13;p.handR[1]-=back*rookie*.13;
    p.club[1]-=back*rookie*.20;
    p.handL[0]+=back*rookie*.05;p.handR[0]+=back*rookie*.05;

    // Early extension + steeper delivery create a visibly less athletic strike.
    p.torso[0]+=downswing*level.earlyExt;
    p.chest[0]+=downswing*level.earlyExt*.82;
    p.pelvis[0]+=downswing*level.earlyExt*.62;
    p.handL[0]-=downswing*level.plane*.34;p.handR[0]-=downswing*level.plane*.34;
    p.handL[2]+=downswing*level.plane*.62;p.handR[2]+=downswing*level.plane*.62;
    p.club[0]-=downswing*level.plane*.58;p.club[2]+=downswing*level.plane*1.18;

    // Rookie release gets a small chicken-wing / low finish signature.
    p.elbowL[0]+=fin*rookie*.08;
    p.elbowL[2]+=fin*rookie*.10;
    p.handL[1]-=fin*rookie*.17;p.handR[1]-=fin*rookie*.17;
    p.handL[2]+=fin*rookie*.09;p.handR[2]+=fin*rookie*.09;
    p.ankleR[1]+=fin*rookie*.08*Math.sin(Math.PI*fin);
    p.kneeR[0]-=fin*rookie*.09;
    p.chest[2]+=fin*rookie*.08;

    if(t>.77){
      p.club[1]=lerp(1.58,p.club[1],level.finish);
      p.club[2]=lerp(-.64,p.club[2],level.finish);
    }
    return p;
  }
  _orientBody(mesh,top,bottom,lateral){
    const y=top.clone().sub(bottom).normalize();
    const z=lateral.clone().normalize();
    const x=new THREE.Vector3().crossVectors(y,z).normalize();
    const zz=new THREE.Vector3().crossVectors(x,y).normalize();
    const m=new THREE.Matrix4().makeBasis(x,y,zz);
    mesh.quaternion.setFromRotationMatrix(m);
  }

  setPose(t,level){
    t=clamp(t,0,1);const p=this._poseAt(t,level);
    const V=k=>this._v(p[k]);
    const hipL=V('hipL'),hipR=V('hipR'),shoulderL=V('shoulderL'),shoulderR=V('shoulderR');
    const hipCenter=hipL.clone().lerp(hipR,.5),shoulderCenter=shoulderL.clone().lerp(shoulderR,.5);

    this.pelvis.position.copy(V('pelvis'));this.pelvis.scale.set(.68,.96,.94);
    this._orientBody(this.pelvis,shoulderCenter,hipCenter,hipR.clone().sub(hipL));

    this.torso.position.copy(V('torso')).add(new THREE.Vector3(.012,.015,0));this.torso.scale.set(.99,.99,.99);
    this._orientBody(this.torso,shoulderCenter,hipCenter,shoulderR.clone().sub(shoulderL));

    this.belt.position.copy(V('pelvis')).add(new THREE.Vector3(0,.075,0));this.belt.scale.set(.74,1,.94);
    this.belt.quaternion.copy(this.pelvis.quaternion);

    this.hipSealL.position.copy(hipL);this.hipSealR.position.copy(hipR);
    this.shoulderSealL.position.copy(shoulderL);this.shoulderSealR.position.copy(shoulderR);

    this._between(this.thighL,V('hipL'),V('kneeL'),.086);this._between(this.thighR,V('hipR'),V('kneeR'),.086);
    this._between(this.calfL,V('kneeL'),V('ankleL'),.071);this._between(this.calfR,V('kneeR'),V('ankleR'),.071);
    this.kneeL.position.copy(V('kneeL'));this.kneeR.position.copy(V('kneeR'));
    this.ankleSealL.position.copy(V('ankleL'));this.ankleSealR.position.copy(V('ankleR'));
    this.shoeL.position.copy(V('ankleL')).add(new THREE.Vector3(.080,-.040,0));this.shoeR.position.copy(V('ankleR')).add(new THREE.Vector3(.080,-.040,0));
    this.shoeL.scale.set(.92,.92,.82);this.shoeR.scale.set(.92,.92,.82);

    this._between(this.sleeveL,V('shoulderL'),V('sleeveL'),.073);this._between(this.sleeveR,V('shoulderR'),V('sleeveR'),.073);
    this._between(this.upperL,V('sleeveL'),V('elbowL'),.052);this._between(this.upperR,V('sleeveR'),V('elbowR'),.052);
    this._between(this.foreL,V('elbowL'),V('handL'),.046);this._between(this.foreR,V('elbowR'),V('handR'),.046);
    this.elbowL.position.copy(V('elbowL'));this.elbowR.position.copy(V('elbowR'));
    this.handL.position.copy(V('handL'));this.handR.position.copy(V('handR'));
    this.wristSealL.position.copy(V('handL'));this.wristSealR.position.copy(V('handR'));

    const H=V('head');
    this.neck.position.copy(H).add(new THREE.Vector3(-.032,-.202,0));this.neck.scale.set(.94,1.34,.94);
    this.neck.quaternion.copy(this.torso.quaternion);
    this.head.position.copy(H);
    this.jaw.position.copy(H).add(new THREE.Vector3(.020,-.071,0));
    this.nose.position.copy(H).add(new THREE.Vector3(.101,-.004,0));
    this.earL.position.copy(H).add(new THREE.Vector3(-.015,-.002,-.112));this.earR.position.copy(H).add(new THREE.Vector3(-.015,-.002,.112));

    this.hairMass.position.copy(H).add(new THREE.Vector3(-.020,.074,0));
    this.cap.position.copy(H).add(new THREE.Vector3(-.008,.115,0));
    this.capDome.position.copy(H).add(new THREE.Vector3(-.008,.150,0));
    this.brim.position.copy(H).add(new THREE.Vector3(.118,.112,0));this.brim.rotation.set(Math.PI/2,0,Math.PI/2-.04);
    this.capSignal.position.copy(H).add(new THREE.Vector3(.074,.164,-.036));

    this.eyeL.position.copy(H).add(new THREE.Vector3(.106,.018,-.037));this.eyeR.position.copy(H).add(new THREE.Vector3(.106,.018,.037));
    this.browL.position.copy(H).add(new THREE.Vector3(.104,.041,-.038));this.browR.position.copy(H).add(new THREE.Vector3(.104,.041,.038));
    this.collar.position.copy(V('chest')).add(new THREE.Vector3(-.015,.185,0));
    this.chestSignal.position.copy(V('chest')).add(new THREE.Vector3(.182,.015,-.050));this.chestSignal.scale.setScalar(.72);

    const h1=V('handL'),h2=V('handR'),gripCenter=h1.clone().lerp(h2,.5),club=V('club'),gripEnd=gripCenter.clone().lerp(club,.17);
    this._between(this.grip,gripCenter,gripEnd,.027);this._between(this.shaft,gripEnd,club,.013);this.clubHead.position.copy(club);
    const dir=club.clone().sub(gripEnd).normalize();this.clubHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);this.clubHead.rotateX(Math.PI/2);
  }
}