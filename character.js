const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);

export class LoftGolfer {
  constructor(THREE, colors, levels){
    this.THREE=THREE;
    this.C=colors;
    this.levels=levels;
    this.level=1;
    this.group=new THREE.Group();
    this.group.name='LOFT_Golfer';
    this._build();
    this.setPhase(0);
  }

  _mat(color,rough=.82,metal=0){
    return new this.THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
  }

  _segment(radius,material,segments=12){
    const THREE=this.THREE;
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.94,1,segments),material);
    mesh.castShadow=true;
    this.group.add(mesh);
    return mesh;
  }

  _build(){
    const THREE=this.THREE, C=this.C;
    this.skin=this._mat(0xc99372,.76);
    this.ink=this._mat(C.ink,.82);
    this.cream=this._mat(C.cream,.9);
    this.stone=this._mat(C.stone,.86);
    this.hair=this._mat(0x2b211b,.9);
    this.orange=this._mat(C.orange,.72);
    this.steel=new THREE.MeshStandardMaterial({color:0xc6c3bc,roughness:.32,metalness:.58});

    this.pelvis=new THREE.Mesh(new THREE.CylinderGeometry(.29,.34,.42,16),this.ink);
    this.pelvis.scale.set(1,.92,.82); this.pelvis.castShadow=true; this.group.add(this.pelvis);

    this.torso=new THREE.Mesh(new THREE.CylinderGeometry(.32,.39,.86,18),this.cream);
    this.torso.scale.set(1,.98,.78); this.torso.castShadow=true; this.group.add(this.torso);

    this.shoulderMass=new THREE.Mesh(new THREE.SphereGeometry(.36,20,14),this.cream);
    this.shoulderMass.scale.set(1,.42,1.05); this.shoulderMass.castShadow=true; this.group.add(this.shoulderMass);

    this.belt=new THREE.Mesh(new THREE.CylinderGeometry(.337,.337,.07,18),this.ink);
    this.belt.scale.set(1,1,.82); this.group.add(this.belt);

    this.headGroup=new THREE.Group(); this.group.add(this.headGroup);
    this.head=new THREE.Mesh(new THREE.SphereGeometry(.245,24,18),this.skin);
    this.head.scale.set(.88,1.08,.90); this.head.castShadow=true; this.headGroup.add(this.head);
    this.jaw=new THREE.Mesh(new THREE.SphereGeometry(.19,20,14),this.skin);
    this.jaw.scale.set(.88,.62,.84); this.jaw.position.set(.035,-.16,0); this.headGroup.add(this.jaw);
    this.nose=new THREE.Mesh(new THREE.ConeGeometry(.045,.13,10),this.skin);
    this.nose.rotation.z=-Math.PI/2; this.nose.position.set(.218,.015,0); this.headGroup.add(this.nose);
    this.eyeLead=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),this.ink);
    this.eyeTrail=this.eyeLead.clone();
    this.eyeLead.position.set(.208,.065,-.078); this.eyeTrail.position.set(.208,.065,.078);
    this.headGroup.add(this.eyeLead,this.eyeTrail);
    this.browLead=new THREE.Mesh(new THREE.BoxGeometry(.055,.014,.014),this.hair);
    this.browTrail=this.browLead.clone();
    this.browLead.position.set(.205,.105,-.077); this.browTrail.position.set(.205,.105,.077);
    this.browLead.rotation.x=.08; this.browTrail.rotation.x=-.08;
    this.headGroup.add(this.browLead,this.browTrail);
    this.earLead=new THREE.Mesh(new THREE.SphereGeometry(.047,12,8),this.skin);
    this.earTrail=this.earLead.clone(); this.earLead.position.set(0,0,-.215);this.earTrail.position.set(0,0,.215);
    this.headGroup.add(this.earLead,this.earTrail);

    this.hairMass=new THREE.Mesh(new THREE.SphereGeometry(.245,20,14),this.hair);
    this.hairMass.scale.set(.9,.55,.92); this.hairMass.position.set(-.025,.17,0); this.headGroup.add(this.hairMass);
    this.capCrown=new THREE.Mesh(new THREE.SphereGeometry(.255,20,12),this.ink);
    this.capCrown.scale.set(.96,.46,1.0); this.capCrown.position.set(0,.205,0); this.headGroup.add(this.capCrown);
    this.capBrim=new THREE.Mesh(new THREE.BoxGeometry(.26,.035,.18),this.ink);
    this.capBrim.position.set(.19,.19,0); this.capBrim.rotation.z=-.06; this.headGroup.add(this.capBrim);
    this.capDot=new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),this.orange);
    this.capDot.position.set(.242,.215,-.055); this.headGroup.add(this.capDot);

    const collarShape=new THREE.Shape();
    collarShape.moveTo(0,0); collarShape.lineTo(.11,.12); collarShape.lineTo(.02,.18); collarShape.closePath();
    this.collarL=new THREE.Mesh(new THREE.ShapeGeometry(collarShape),this.stone);
    this.collarR=this.collarL.clone();
    this.collarL.position.set(.285,1.72,-.055); this.collarR.position.set(.285,1.72,.055);
    this.collarL.rotation.set(0,Math.PI/2,.1); this.collarR.rotation.set(0,-Math.PI/2,-.1);
    this.group.add(this.collarL,this.collarR);
    this.placket=new THREE.Mesh(new THREE.BoxGeometry(.018,.19,.035),this.orange);
    this.placket.position.set(.31,1.57,0); this.group.add(this.placket);

    this.upperLead=this._segment(.075,this.skin);
    this.foreLead=this._segment(.065,this.skin);
    this.upperTrail=this._segment(.075,this.skin);
    this.foreTrail=this._segment(.065,this.skin);
    this.thighLead=this._segment(.118,this.ink);
    this.shinLead=this._segment(.102,this.ink);
    this.thighTrail=this._segment(.118,this.ink);
    this.shinTrail=this._segment(.102,this.ink);

    this.handLead=new THREE.Mesh(new THREE.SphereGeometry(.082,14,10),this.skin);this.handLead.scale.set(.8,1,.72);this.group.add(this.handLead);
    this.handTrail=this.handLead.clone();this.group.add(this.handTrail);

    this.shoeLead=new THREE.Mesh(new THREE.BoxGeometry(.42,.13,.20),this.stone);
    this.shoeTrail=this.shoeLead.clone();
    this.shoeLead.castShadow=this.shoeTrail.castShadow=true;
    this.group.add(this.shoeLead,this.shoeTrail);

    this.clubShaft=this._segment(.024,this.steel,10);
    this.grip=this._segment(.042,this.ink,10);
    this.clubHead=new THREE.Mesh(new THREE.BoxGeometry(.16,.07,.24),this.steel);
    this.clubHead.castShadow=true;this.group.add(this.clubHead);
    this.clubFace=new THREE.Mesh(new THREE.BoxGeometry(.015,.095,.23),this._mat(0xa9a7a1,.38,.62));
    this.group.add(this.clubFace);

    this.currentHeadType='iron';
  }

  setLevel(level){
    this.level=Number(level)||1;
    this.setPhase(0);
  }

  setClub(club){
    const THREE=this.THREE;
    this.currentHeadType=club.head;
    this.group.remove(this.clubHead);
    this.clubHead.geometry.dispose();
    if(club.head==='driver'){
      this.clubHead=new THREE.Mesh(new THREE.SphereGeometry(.13,20,14),this._mat(0x202425,.45,.28));
      this.clubHead.scale.set(1.25,.72,1.45);
    }else if(club.head==='wood'){
      this.clubHead=new THREE.Mesh(new THREE.SphereGeometry(.115,20,14),this._mat(0x25292a,.48,.26));
      this.clubHead.scale.set(1.18,.68,1.34);
    }else if(club.head==='hybrid'){
      this.clubHead=new THREE.Mesh(new THREE.SphereGeometry(.105,18,12),this._mat(0x2d3131,.5,.25));
      this.clubHead.scale.set(1.05,.62,1.22);
    }else if(club.head==='putter'){
      this.clubHead=new THREE.Mesh(new THREE.BoxGeometry(.18,.07,.32),this._mat(this.C.ink,.52,.2));
    }else{
      this.clubHead=new THREE.Mesh(new THREE.BoxGeometry(.15,.075,.245),this.steel);
    }
    this.clubHead.castShadow=true;
    this.group.add(this.clubHead);
    this.clubFace.visible=!['driver','wood','hybrid','putter'].includes(club.head);
  }

  _segmentBetween(mesh,a,b){
    const THREE=this.THREE;
    const mid=a.clone().add(b).multiplyScalar(.5);
    const dir=b.clone().sub(a);
    const len=dir.length();
    mesh.position.copy(mid);
    mesh.scale.set(1,len,1);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
    mesh.quaternion.copy(q);
  }

  _mix(a,b,t){
    const out={};
    for(const k in a){
      if(Array.isArray(a[k])){
        const av=a[k],bv=b[k];
        out[k]=[lerp(av[0],bv[0],t),lerp(av[1],bv[1],t),lerp(av[2],bv[2],t)];
      }
    }
    return out;
  }

  _v(a){return new this.THREE.Vector3(a[0],a[1],a[2]);}

  _poses(){
    const address={
      pelvis:[-.72,.98,0], chest:[-.69,1.50,0], head:[-.61,2.16,0],
      leadShoulder:[-.58,1.73,-.23], trailShoulder:[-.58,1.73,.23],
      leadElbow:[-.36,1.37,-.18], trailElbow:[-.34,1.37,.18],
      hands:[-.12,1.06,.01],
      leadHip:[-.72,.96,-.16], trailHip:[-.72,.96,.16],
      leadKnee:[-.63,.52,-.23], trailKnee:[-.63,.52,.23],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.58,.08,.27],
      club:[0,.055,0]
    };
    const takeaway={
      pelvis:[-.72,.98,.01], chest:[-.70,1.51,.02], head:[-.61,2.16,.025],
      leadShoulder:[-.53,1.72,-.15], trailShoulder:[-.68,1.74,.27],
      leadElbow:[-.31,1.39,-.06], trailElbow:[-.44,1.43,.24],
      hands:[-.22,1.23,.26],
      leadHip:[-.68,.96,-.13], trailHip:[-.75,.96,.18],
      leadKnee:[-.61,.52,-.22], trailKnee:[-.65,.52,.23],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.58,.08,.27],
      club:[-.10,.23,.78]
    };
    const top={
      pelvis:[-.73,.99,.04], chest:[-.74,1.52,.09], head:[-.64,2.16,.07],
      leadShoulder:[-.46,1.69,.03], trailShoulder:[-.78,1.77,.29],
      leadElbow:[-.42,1.62,.18], trailElbow:[-.69,1.66,.43],
      hands:[-.56,1.94,.45],
      leadHip:[-.62,.96,-.08], trailHip:[-.78,.97,.20],
      leadKnee:[-.58,.51,-.20], trailKnee:[-.69,.54,.21],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.58,.08,.27],
      club:[-.82,2.31,1.00]
    };
    const delivery={
      pelvis:[-.67,1.00,-.035], chest:[-.66,1.52,.01], head:[-.59,2.15,.025],
      leadShoulder:[-.52,1.72,-.18], trailShoulder:[-.67,1.73,.18],
      leadElbow:[-.35,1.42,-.14], trailElbow:[-.45,1.39,.16],
      hands:[-.24,1.24,.10],
      leadHip:[-.59,.98,-.18], trailHip:[-.73,.98,.12],
      leadKnee:[-.55,.51,-.23], trailKnee:[-.67,.56,.19],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.58,.08,.27],
      club:[-.08,.40,.34]
    };
    const impact={
      pelvis:[-.64,1.00,-.06], chest:[-.63,1.53,-.07], head:[-.58,2.15,-.03],
      leadShoulder:[-.53,1.75,-.28], trailShoulder:[-.64,1.70,.14],
      leadElbow:[-.30,1.38,-.22], trailElbow:[-.34,1.33,.11],
      hands:[-.08,1.04,-.035],
      leadHip:[-.55,.99,-.22], trailHip:[-.70,.98,.09],
      leadKnee:[-.52,.51,-.24], trailKnee:[-.68,.57,.17],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.57,.09,.26],
      club:[0,.055,-.025]
    };
    const release={
      pelvis:[-.63,1.01,-.10], chest:[-.64,1.56,-.15], head:[-.60,2.18,-.10],
      leadShoulder:[-.61,1.80,-.35], trailShoulder:[-.57,1.73,.05],
      leadElbow:[-.38,1.48,-.38], trailElbow:[-.28,1.43,-.12],
      hands:[-.20,1.38,-.48],
      leadHip:[-.55,1.0,-.24], trailHip:[-.70,.99,.05],
      leadKnee:[-.52,.51,-.24], trailKnee:[-.70,.60,.13],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.57,.12,.23],
      club:[-.10,.78,-.90]
    };
    const finish={
      pelvis:[-.64,1.02,-.12], chest:[-.70,1.61,-.20], head:[-.64,2.23,-.16],
      leadShoulder:[-.76,1.86,-.36], trailShoulder:[-.54,1.82,-.02],
      leadElbow:[-.65,1.75,-.44], trailElbow:[-.38,1.65,-.31],
      hands:[-.48,1.97,-.55],
      leadHip:[-.55,1.02,-.24], trailHip:[-.72,1.0,.02],
      leadKnee:[-.52,.52,-.24], trailKnee:[-.77,.64,.08],
      leadFoot:[-.58,.08,-.27], trailFoot:[-.66,.16,.18],
      club:[-.88,2.24,-1.08]
    };
    return {address,takeaway,top,delivery,impact,release,finish};
  }

  _poseAt(t){
    t=clamp(t,0,1);
    const P=this._poses();
    let pose;
    if(t<.16) pose=this._mix(P.address,P.takeaway,easeInOut(t/.16));
    else if(t<.38) pose=this._mix(P.takeaway,P.top,easeInOut((t-.16)/.22));
    else if(t<.50) pose=this._mix(P.top,P.delivery,easeInOut((t-.38)/.12));
    else if(t<.60) pose=this._mix(P.delivery,P.impact,easeOut((t-.50)/.10));
    else if(t<.76) pose=this._mix(P.impact,P.release,easeOut((t-.60)/.16));
    else pose=this._mix(P.release,P.finish,easeOut((t-.76)/.24));

    const L=this.levels[this.level]||this.levels[1];
    const rookie=1-L.form;
    const downswing=Math.max(0,1-Math.abs(t-.55)/.22);
    const finish=Math.max(0,(t-.70)/.30);
    const backswing=Math.max(0,1-Math.abs(t-.34)/.34);

    pose.head[0]+=Math.sin(t*Math.PI*2.1)*L.sway;
    pose.head[2]+=backswing*L.sway*.65;
    pose.chest[0]+=downswing*L.earlyExt;
    pose.pelvis[0]+=downswing*L.earlyExt*.7;
    pose.hands[0]-=downswing*L.plane*.30;
    pose.hands[2]+=downswing*L.plane*.62;
    pose.club[0]-=downswing*L.plane*.55;
    pose.club[2]+=downswing*L.plane;
    pose.chest[1]-=(1-L.form)*L.addressSlouch*(1-t);
    pose.head[1]-=(1-L.form)*L.addressSlouch*(1-t)*.7;
    pose.trailFoot[1]+=finish*rookie*.12*Math.sin(Math.PI*finish);
    pose.trailKnee[0]-=finish*rookie*.11;

    const finishScale=lerp(L.finish,1,L.form);
    if(t>.76){
      pose.hands[1]=lerp(1.65,pose.hands[1],finishScale);
      pose.club[1]=lerp(1.78,pose.club[1],finishScale);
      pose.club[2]=lerp(-.78,pose.club[2],finishScale);
    }
    return pose;
  }

  setPhase(t){
    const pose=this._poseAt(t);
    this._render(pose,t);
  }

  _render(p,t){
    const THREE=this.THREE;
    const pelvis=this._v(p.pelvis), chest=this._v(p.chest), head=this._v(p.head);
    this.pelvis.position.copy(pelvis);
    this.torso.position.copy(chest);
    this.shoulderMass.position.set(chest.x+.015,chest.y+.19,chest.z);
    this.belt.position.set(pelvis.x,pelvis.y+.18,pelvis.z);
    this.headGroup.position.copy(head);

    const lean=-.10 + (this.levels[this.level]?.addressSlouch||0)*(1-t);
    this.torso.rotation.z=lean;
    this.shoulderMass.rotation.z=lean;
    this.pelvis.rotation.y=lerp(0,.10,Math.max(0,(t-.45)/.55));

    this.collarL.position.set(chest.x+.31,chest.y+.18,chest.z-.055);
    this.collarR.position.set(chest.x+.31,chest.y+.18,chest.z+.055);
    this.placket.position.set(chest.x+.315,chest.y+.02,chest.z);

    const LS=this._v(p.leadShoulder),TS=this._v(p.trailShoulder),LE=this._v(p.leadElbow),TE=this._v(p.trailElbow),H=this._v(p.hands);
    this._segmentBetween(this.upperLead,LS,LE);this._segmentBetween(this.foreLead,LE,H);
    this._segmentBetween(this.upperTrail,TS,TE);this._segmentBetween(this.foreTrail,TE,H);
    this.handLead.position.copy(H).add(new THREE.Vector3(.02,.015,-.035));
    this.handTrail.position.copy(H).add(new THREE.Vector3(-.015,-.005,.035));

    const LH=this._v(p.leadHip),TH=this._v(p.trailHip),LK=this._v(p.leadKnee),TK=this._v(p.trailKnee),LF=this._v(p.leadFoot),TF=this._v(p.trailFoot);
    this._segmentBetween(this.thighLead,LH,LK);this._segmentBetween(this.shinLead,LK,LF);
    this._segmentBetween(this.thighTrail,TH,TK);this._segmentBetween(this.shinTrail,TK,TF);
    this.shoeLead.position.copy(LF);this.shoeTrail.position.copy(TF);
    this.shoeLead.rotation.y=0;this.shoeTrail.rotation.y=0;

    const club=this._v(p.club);
    const gripEnd=H.clone().lerp(club,.18);
    this._segmentBetween(this.grip,H,gripEnd);
    this._segmentBetween(this.clubShaft,gripEnd,club);
    this.clubHead.position.copy(club);

    const shaftDir=club.clone().sub(H).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),shaftDir);
    this.clubHead.quaternion.copy(q);
    this.clubHead.rotateX(Math.PI/2);
    this.clubFace.position.copy(club).add(new THREE.Vector3(.018,.005,0));
    this.clubFace.quaternion.copy(this.clubHead.quaternion);
  }
}