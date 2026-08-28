import * as THREE from '../vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const out=t=>1-Math.pow(1-t,3);

export class LoftGolferRig{
  constructor(C){
    this.C=C;this.group=new THREE.Group();this.group.name='LOFT_GOLFER';
    this.mat=(c,r=.84,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    this.skin=this.mat(0xc99372,.78);this.ink=this.mat(C.ink,.82);this.cream=this.mat(C.cream,.92);this.stone=this.mat(C.stone,.9);this.hair=this.mat(0x2b211b,.92);this.orange=this.mat(C.orange,.72);this.steel=this.mat(0xbcbdb7,.35,.58);
    this.parts=[];this._build();this.setPose(0,{form:.18,sway:.11,earlyExt:.11,plane:.20,balance:.48,finish:.58});
  }
  _add(mesh){mesh.castShadow=true;this.group.add(mesh);this.parts.push(mesh);return mesh;}
  _shape(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
    const m=this._add(new THREE.Mesh(geo,mat));m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);return m;
  }
  _segment(r,mat){
    const m=this._add(new THREE.Mesh(new THREE.CylinderGeometry(r,r*.96,1,12),mat));
    m.userData.baseRadius=r;
    return m;
  }
  _between(mesh,a,b,r){
    const mid=a.clone().add(b).multiplyScalar(.5),len=Math.max(.001,a.distanceTo(b));
    mesh.position.copy(mid);
    mesh.scale.set(1,len,1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  }
  _build(){
    this.pelvis=this._shape(new THREE.SphereGeometry(.255,24,18),this.ink);
    this.torso=this._shape(new THREE.CapsuleGeometry(.19,.30,8,18),this.cream);
    this.chest=this._shape(new THREE.SphereGeometry(.28,28,20),this.cream);
    this.waist=this._shape(new THREE.SphereGeometry(.22,24,18),this.cream);
    this.belt=this._shape(new THREE.CylinderGeometry(.215,.215,.050,24),this.ink);

    this.thighL=this._segment(.092,this.ink);this.thighR=this._segment(.092,this.ink);
    this.calfL=this._segment(.074,this.ink);this.calfR=this._segment(.074,this.ink);
    this.shoeL=this._shape(new THREE.SphereGeometry(.16,20,14),this.stone,[0,0,0],[1.05,.38,.58]);
    this.shoeR=this._shape(new THREE.SphereGeometry(.16,20,14),this.stone,[0,0,0],[1.05,.38,.58]);

    this.sleeveL=this._segment(.084,this.cream);this.sleeveR=this._segment(.084,this.cream);
    this.upperL=this._segment(.058,this.skin);this.upperR=this._segment(.058,this.skin);
    this.foreL=this._segment(.050,this.skin);this.foreR=this._segment(.050,this.skin);
    this.handL=this._shape(new THREE.SphereGeometry(.063,18,12),this.skin,[0,0,0],[.88,.95,.72]);
    this.handR=this._shape(new THREE.SphereGeometry(.063,18,12),this.skin,[0,0,0],[.88,.95,.72]);

    this.neck=this._shape(new THREE.CylinderGeometry(.075,.082,.17,16),this.skin);
    this.head=this._shape(new THREE.SphereGeometry(.145,30,22),this.skin,[0,0,0],[.87,1.04,.88]);
    this.jaw=this._shape(new THREE.SphereGeometry(.112,24,18),this.skin,[0,0,0],[.90,.58,.82]);
    this.nose=this._shape(new THREE.ConeGeometry(.026,.075,12),this.skin,[0,0,0],[1,1,1],[0,0,-Math.PI/2]);
    this.earL=this._shape(new THREE.SphereGeometry(.026,14,10),this.skin,[0,0,0],[.7,1,.55]);
    this.earR=this._shape(new THREE.SphereGeometry(.026,14,10),this.skin,[0,0,0],[.7,1,.55]);
    this.hairMass=this._shape(new THREE.SphereGeometry(.148,26,18),this.hair,[0,0,0],[.91,.44,.90]);
    this.cap=this._shape(new THREE.SphereGeometry(.154,28,16),this.ink,[0,0,0],[.98,.40,1.02]);
    this.brim=this._shape(new THREE.BoxGeometry(.165,.026,.118),this.ink);
    this.capSignal=this._shape(new THREE.SphereGeometry(.017,12,8),this.orange);

    this.eyeL=this._shape(new THREE.SphereGeometry(.010,10,8),this.ink,[0,0,0],[1,1,.7]);
    this.eyeR=this._shape(new THREE.SphereGeometry(.010,10,8),this.ink,[0,0,0],[1,1,.7]);
    this.placket=this._shape(new THREE.BoxGeometry(.012,.115,.024),this.orange);

    this.grip=this._segment(.027,this.ink);
    this.shaft=this._segment(.013,this.steel);
    this.clubHead=this._shape(new THREE.BoxGeometry(.12,.055,.17),this.steel);
    this.clubType='iron';
  }
  setClub(type='iron'){
    if(this.clubType===type)return;this.clubType=type;
    this.clubHead.geometry.dispose();
    if(type==='driver'){
      this.clubHead.geometry=new THREE.SphereGeometry(.078,22,16);this.clubHead.scale.set(1.30,.70,1.45);this.clubHead.material=this.ink;
    }else if(type==='wood'){
      this.clubHead.geometry=new THREE.SphereGeometry(.070,22,16);this.clubHead.scale.set(1.22,.67,1.35);this.clubHead.material=this.ink;
    }else if(type==='hybrid'){
      this.clubHead.geometry=new THREE.SphereGeometry(.062,20,14);this.clubHead.scale.set(1.12,.64,1.26);this.clubHead.material=this.ink;
    }else if(type==='putter'){
      this.clubHead.geometry=new THREE.BoxGeometry(.13,.045,.22);this.clubHead.scale.set(1,1,1);this.clubHead.material=this.ink;
    }else{
      this.clubHead.geometry=new THREE.BoxGeometry(.105,.050,.155);this.clubHead.scale.set(1,1,1);this.clubHead.material=this.steel;
    }
  }
  _v(a){return new THREE.Vector3(a[0],a[1],a[2]);}
  _mix(a,b,t){const o={};for(const k in a){const A=a[k],B=b[k];o[k]=[lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t)];}return o;}
  _poses(){
    return {
      address:{pelvis:[-.50,.94,0],torso:[-.42,1.33,0],chest:[-.37,1.52,0],head:[-.38,1.975,0],
        hipL:[-.50,.91,-.145],hipR:[-.50,.91,.145],kneeL:[-.47,.47,-.19],kneeR:[-.44,.48,.20],ankleL:[-.45,.115,-.20],ankleR:[-.40,.115,.21],
        shoulderL:[-.38,1.55,-.205],shoulderR:[-.38,1.55,.205],sleeveL:[-.24,1.40,-.19],sleeveR:[-.23,1.41,.19],elbowL:[-.08,1.23,-.16],elbowR:[-.055,1.24,.165],handL:[.16,.99,-.045],handR:[.17,.985,.042],club:[.39,.055,0]},
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
  _poseAt(t,level){
    const P=this._poses();let p;
    if(t<.16)p=this._mix(P.address,P.takeaway,ease(t/.16));
    else if(t<.38)p=this._mix(P.takeaway,P.top,ease((t-.16)/.22));
    else if(t<.50)p=this._mix(P.top,P.delivery,ease((t-.38)/.12));
    else if(t<.60)p=this._mix(P.delivery,P.impact,out((t-.50)/.10));
    else if(t<.77)p=this._mix(P.impact,P.release,out((t-.60)/.17));
    else p=this._mix(P.release,P.finish,out((t-.77)/.23));

    const rookie=1-level.form,downswing=Math.max(0,1-Math.abs(t-.55)/.22),back=Math.max(0,1-Math.abs(t-.34)/.34),fin=clamp((t-.72)/.28,0,1);
    p.head[0]+=Math.sin(t*Math.PI*2.1)*level.sway;p.head[2]+=back*level.sway*.5;
    p.torso[0]+=downswing*level.earlyExt;p.chest[0]+=downswing*level.earlyExt*.75;p.pelvis[0]+=downswing*level.earlyExt*.55;
    p.handL[0]-=downswing*level.plane*.22;p.handR[0]-=downswing*level.plane*.22;p.handL[2]+=downswing*level.plane*.5;p.handR[2]+=downswing*level.plane*.5;
    p.club[0]-=downswing*level.plane*.45;p.club[2]+=downswing*level.plane;
    p.ankleR[1]+=fin*rookie*.06*Math.sin(Math.PI*fin);p.kneeR[0]-=fin*rookie*.07;
    if(t>.77){p.club[1]=lerp(1.70,p.club[1],level.finish);p.club[2]=lerp(-.72,p.club[2],level.finish);}
    return p;
  }
  setPose(t,level){
    t=clamp(t,0,1);const p=this._poseAt(t,level);
    const V=k=>this._v(p[k]);
    this.pelvis.position.copy(V('pelvis'));this.pelvis.scale.set(.96,.72,.76);
    this.torso.position.copy(V('torso'));this.torso.scale.set(1.02,1.0,.76);this.torso.rotation.z=-.11;
    this.chest.position.copy(V('chest'));this.chest.scale.set(.96,.58,.78);this.chest.rotation.z=-.08;
    this.waist.position.copy(V('torso').lerp(V('pelvis'),.68));this.waist.scale.set(.94,.54,.74);
    this.belt.position.copy(V('pelvis')).add(new THREE.Vector3(0,.09,0));this.belt.scale.set(1,1,.78);

    this._between(this.thighL,V('hipL'),V('kneeL'),.092);this._between(this.thighR,V('hipR'),V('kneeR'),.092);
    this._between(this.calfL,V('kneeL'),V('ankleL'),.074);this._between(this.calfR,V('kneeR'),V('ankleR'),.074);
    this.shoeL.position.copy(V('ankleL')).add(new THREE.Vector3(.09,-.04,0));this.shoeR.position.copy(V('ankleR')).add(new THREE.Vector3(.09,-.04,0));

    this._between(this.sleeveL,V('shoulderL'),V('sleeveL'),.084);this._between(this.sleeveR,V('shoulderR'),V('sleeveR'),.084);
    this._between(this.upperL,V('sleeveL'),V('elbowL'),.058);this._between(this.upperR,V('sleeveR'),V('elbowR'),.058);
    this._between(this.foreL,V('elbowL'),V('handL'),.050);this._between(this.foreR,V('elbowR'),V('handR'),.050);
    this.handL.position.copy(V('handL'));this.handR.position.copy(V('handR'));

    const H=V('head');
    this.neck.position.copy(H).add(new THREE.Vector3(-.04,-.19,0));this.neck.rotation.z=-.08;
    this.head.position.copy(H);this.jaw.position.copy(H).add(new THREE.Vector3(.03,-.08,0));this.nose.position.copy(H).add(new THREE.Vector3(.133,.005,0));
    this.earL.position.copy(H).add(new THREE.Vector3(-.02,0,-.121));this.earR.position.copy(H).add(new THREE.Vector3(-.02,0,.121));
    this.hairMass.position.copy(H).add(new THREE.Vector3(-.02,.085,0));this.cap.position.copy(H).add(new THREE.Vector3(-.01,.12,0));this.brim.position.copy(H).add(new THREE.Vector3(.125,.10,0));this.brim.rotation.z=-.04;
    this.capSignal.position.copy(H).add(new THREE.Vector3(.095,.138,-.038));
    this.eyeL.position.copy(H).add(new THREE.Vector3(.128,.023,-.043));this.eyeR.position.copy(H).add(new THREE.Vector3(.128,.023,.043));
    this.placket.position.copy(V('chest')).add(new THREE.Vector3(.27,-.05,0));this.placket.rotation.z=-.10;

    const h1=V('handL'),h2=V('handR'),gripCenter=h1.clone().lerp(h2,.5),club=V('club'),gripEnd=gripCenter.clone().lerp(club,.17);
    this._between(this.grip,gripCenter,gripEnd,.027);this._between(this.shaft,gripEnd,club,.013);this.clubHead.position.copy(club);
    const dir=club.clone().sub(gripEnd).normalize();this.clubHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);this.clubHead.rotateX(Math.PI/2);
  }
}