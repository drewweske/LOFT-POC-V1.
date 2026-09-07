import * as THREE from '../vendor/three.module.js';
import {createClubHead,createClubShaftParts,clubFerruleStations,releaseClubInstance} from './clubAssembly.js';
export {IN_WORLD_CLUB_SPEC} from './clubAssembly.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const out=t=>1-Math.pow(1-t,3);
const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

// Visual outsole depth below the analytic ankle landmark. Game grounding uses
// the same value so the authored sole cannot disappear into the exact terrain.
export const GOLFER_GROUND_CLEARANCE=.016;


export const GOLFER_COHESION_SPEC=Object.freeze({
  system:'LOFT_GOLFER_FACE_GRIP_V3',
  headShellSections:8,
  headRadialSegments:32,
  addressGazeRadians:-.22,
  topGazeRadians:-.16,
  finishGazeRadians:-.045,
  puttingGazeRadians:-.27,
  gripButtExtension:.060,
  leadGripStation:-.010,
  trailGripStation:.045,
  gripContactSeparation:.055,
  gripFaceOffset:.017,
  gripAcrossOffset:.010,
  maxHandToContact:.085,
  palmLengthMin:.052,
  palmLengthMax:.064,
  protected:Object.freeze(['poseKeys','ikLengths','handLandmarks','clubLength','clubHeadLandmark','impactTiming'])
});

// The swing remains driven by the trusted gameplay phase, but its visible
// motion now has one continuous ground-up grammar. These curves do not move
// the authored hands, head or club guide at protected key times; they govern
// interpolation continuity and the orientation of the body around those
// landmarks.
export const KINETIC_CHAIN_SPEC=Object.freeze({
  system:'LOFT_KINETIC_CHAIN_V1',
  times:Object.freeze([0,.16,.38,.50,.60,.77,1]),
  names:Object.freeze(['address','takeaway','top','delivery','impact','release','finish']),
  pelvisYawDeg:Object.freeze([0,-11.3,-22.9,8,34,56,68]),
  shoulderYawDeg:Object.freeze([0,-24.6,-51.5,-18,10,62,91]),
  backTrack:Object.freeze([0,.470588235,.882352941,.529411765,.235294118,0,0]),
  downswingTrack:Object.freeze([0,0,.227272727,.772727273,.772727273,0,0]),
  finishTrack:Object.freeze([0,0,0,0,0,.178571429,1]),
  trailPivotStart:.60,
  trailPivotRadians:.40,
  trailToeGroundY:-GOLFER_GROUND_CLEARANCE,
  trailToeTolerance:.004,
  finishHeelLift:Object.freeze([.065,.095]),
  maxAddedDrawables:0,
  protectedTimes:Object.freeze([0,.38,.60,1]),
  protected:Object.freeze(['ballLaunch','impactTiming','poseKeys','headLandmark','handLandmarks','clubHeadLandmark','clubLength','putterPendulum'])
});

export class LoftGolferRig{
  constructor(C){
    this.C=C;this.group=new THREE.Group();this.group.name='LOFT_GOLFER';
    this.mat=(c,r=.84,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    this.skin=this.mat(0xb77c5a,.88);
    this.ink=this.mat(C.ink,.90);
    this.cream=this.mat(C.cream,.96);
    this.stone=this.mat(C.stone,.94);
    this.polo=this.mat(0x273230,.90);
    this.poloTrim=this.mat(0x4b5752,.94);
    this.pants=this.mat(0x626257,.92);
    this.pantsTrim=this.mat(0x4e5149,.96);
    this.shoeLeather=this.mat(0xe7e0d4,.76);
    this.shoeMidsole=this.mat(0xc8c3b9,.88);
    this.hair=this.mat(0x241e1a,.97);
    this.lip=this.mat(0x754b3e,.94);
    this.orange=this.mat(C.orange,.74);
    this.steel=this.mat(0xb6b8b4,.32,.60);
    this.parts=[];
    this.addressBallLocal=new THREE.Vector3(.46,.026,0);
    this.clubAddressX=.43;this.clubAddressHeight=.045;
    this.armUpper=.365;this.armLower=.345;this.legUpper=.425;this.legLower=.405;
    this._bodyGeometryCache=new Map();
    this._build();
    this.setClub({id:'iron7',head:'iron',name:'7 Iron'},1);
    this.setPose(0,{form:.18,sway:.11,earlyExt:.11,plane:.20,balance:.48,finish:.58});
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
      const [y,depth,width,offsetX=0,offsetZ=0]=sections[s];
      for(let i=0;i<radial;i++){
        const a=i/radial*Math.PI*2;
        pos.push(offsetX+Math.cos(a)*depth,y,offsetZ+Math.sin(a)*width);
      }
    }
    for(let s=0;s<sections.length-1;s++){
      for(let i=0;i<radial;i++){
        const n=(i+1)%radial;
        const a=s*radial+i,b=s*radial+n,c=(s+1)*radial+i,d=(s+1)*radial+n;
        idx.push(a,c,b,b,c,d);
      }
    }

    // Cap rings are duplicated so the flat cap normals do not contaminate the
    // garment wall. Shared cap vertices produced alternating black teeth at
    // the polo hem under grazing coastal light.
    const bottomCapRing=pos.length/3;
    for(let i=0;i<radial;i++){
      const j=i*3;pos.push(pos[j],pos[j+1],pos[j+2]);
    }
    const topRing=(sections.length-1)*radial;
    const topCapRing=pos.length/3;
    for(let i=0;i<radial;i++){
      const j=(topRing+i)*3;pos.push(pos[j],pos[j+1],pos[j+2]);
    }
    const bottomCenter=pos.length/3;
    pos.push(0,sections[0][0],0);
    const topCenter=pos.length/3;
    pos.push(0,sections[sections.length-1][0],0);
    for(let i=0;i<radial;i++){
      const n=(i+1)%radial;
      idx.push(bottomCenter,bottomCapRing+n,bottomCapRing+i);
      idx.push(topCenter,topCapRing+i,topCapRing+n);
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
  _sculptedSegment(kind,profile,mat,radial=18){
    let geo=this._bodyGeometryCache.get(kind);
    if(!geo){
      const pos=[],idx=[];
      for(let s=0;s<profile.length;s++){
        const [y,rx,rz,ox=0,oz=0]=profile[s];
        for(let i=0;i<radial;i++){
          const a=i/radial*Math.PI*2;
          pos.push(ox+Math.cos(a)*rx,y,oz+Math.sin(a)*rz);
        }
      }
      for(let s=0;s<profile.length-1;s++){
        for(let i=0;i<radial;i++){
          const n=(i+1)%radial;
          const a=s*radial+i,b=s*radial+n,c=(s+1)*radial+i,d=(s+1)*radial+n;
          idx.push(a,c,b,b,c,d);
        }
      }
      const start=pos.length/3;
      pos.push(profile[0][3]||0,profile[0][0],profile[0][4]||0);
      const end=pos.length/3;
      const last=profile.at(-1);
      pos.push(last[3]||0,last[0],last[4]||0);
      const finalRing=(profile.length-1)*radial;
      for(let i=0;i<radial;i++){
        const n=(i+1)%radial;
        idx.push(start,i,n);
        idx.push(end,finalRing+n,finalRing+i);
      }
      geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      geo.setIndex(idx);geo.computeVertexNormals();
      geo.userData.loftShell=kind;
      geo.userData.profile=profile.map(r=>r.slice());
      this._bodyGeometryCache.set(kind,geo);
    }
    const mesh=this._add(new THREE.Mesh(geo,mat));
    mesh.userData.loftShell=kind;
    mesh.userData.profileRings=profile.length;
    return mesh;
  }
  _craniofacialGeometry(sections,radial=GOLFER_COHESION_SPEC.headRadialSegments,kind='LOFT_CRANIOFACIAL_V3'){
    const pos=[],idx=[],power=(v,n)=>Math.sign(v)*Math.pow(Math.abs(v),2/n);
    for(let s=0;s<sections.length;s++){
      const [y,front,back,halfWidth,exponent,offsetX=0,offsetZ=0]=sections[s];
      for(let i=0;i<radial;i++){
        const a=i/radial*Math.PI*2,c=Math.cos(a),z=Math.sin(a);
        pos.push(offsetX+(c>=0?front:back)*power(c,exponent),y,offsetZ+halfWidth*power(z,exponent));
      }
    }
    for(let s=0;s<sections.length-1;s++){
      for(let i=0;i<radial;i++){
        const n=(i+1)%radial,a=s*radial+i,b=s*radial+n,c=(s+1)*radial+i,d=(s+1)*radial+n;
        idx.push(a,c,b,b,c,d);
      }
    }

    // Separate cap vertices keep the soft-square wall normals intact while
    // closing the shell beneath the chin and hat. This is a single continuous
    // craniofacial volume, not the old sphere-and-jaw stack.
    const bottomCapRing=pos.length/3;
    for(let i=0;i<radial;i++)pos.push(...pos.slice(i*3,i*3+3));
    const topSource=(sections.length-1)*radial,topCapRing=pos.length/3;
    for(let i=0;i<radial;i++)pos.push(...pos.slice((topSource+i)*3,(topSource+i)*3+3));
    const first=sections[0],last=sections.at(-1),bottomCenter=pos.length/3;
    pos.push(first[5]||0,first[0],first[6]||0);
    const topCenter=pos.length/3;
    pos.push(last[5]||0,last[0],last[6]||0);
    for(let i=0;i<radial;i++){
      const n=(i+1)%radial;
      idx.push(bottomCenter,bottomCapRing+n,bottomCapRing+i);
      idx.push(topCenter,topCapRing+i,topCapRing+n);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingBox();
    geo.userData.loftShell=kind;geo.userData.profile=sections.map(r=>r.slice());geo.userData.closedShell=true;
    return geo;
  }
  _rearHairGeometry(sections,arcSegments=20){
    const pos=[],idx=[],start=1.72,end=4.56,cols=arcSegments+1;
    for(const [y,depth,width,offsetX=0,offsetZ=0] of sections){
      for(let i=0;i<cols;i++){
        const a=start+(end-start)*i/arcSegments;
        pos.push(offsetX+Math.cos(a)*depth,y,offsetZ+Math.sin(a)*width);
      }
    }
    for(let s=0;s<sections.length-1;s++)for(let i=0;i<arcSegments;i++){
      const a=s*cols+i,b=a+1,c=(s+1)*cols+i,d=c+1;idx.push(a,c,b,b,c,d);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
    geo.userData.loftShell='sculpted-hair-shell';geo.userData.tuckedUnderCap=true;return geo;
  }
  _noseWedgeGeometry(){
    const p=[
      0,.040,-.007, 0,.040,.007, 0,-.027,-.010, 0,-.027,.010,
      .039,.001,-.008, .039,.001,.008, .043,-.016,-.013, .043,-.016,.013
    ];
    const i=[0,4,1,1,4,5, 0,2,4,2,6,4, 1,5,3,3,5,7, 2,3,6,3,7,6, 4,6,5,5,6,7, 0,1,2,1,3,2];
    const indexed=new THREE.BufferGeometry();indexed.setAttribute('position',new THREE.Float32BufferAttribute(p,3));indexed.setIndex(i);
    const geo=indexed.toNonIndexed();geo.computeVertexNormals();geo.userData.loftShell='angular-nose-wedge';return geo;
  }
  _visorGeometry(){
    const shape=new THREE.Shape();
    shape.moveTo(.018,-.058);
    shape.quadraticCurveTo(.060,-.086,.119,-.086);
    shape.quadraticCurveTo(.180,-.078,.205,0);
    shape.quadraticCurveTo(.180,.078,.119,.086);
    shape.quadraticCurveTo(.060,.086,.018,.058);
    shape.quadraticCurveTo(.042,0,.018,-.058);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.012,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.003,bevelThickness:.0025});
    const p=geo.attributes.position;
    for(let n=0;n<p.count;n++){
      const x=p.getX(n),z=p.getY(n),y=p.getZ(n)-.006;p.setXYZ(n,x,y,z);
    }
    p.needsUpdate=true;geo.deleteAttribute('normal');geo.computeVertexNormals();geo.userData.loftShell='curved-visor';return geo;
  }
  _featureCurveGeometry(points,radius=.0025){
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,radius,6,false);
  }
  _anchoredBetween(mesh,a,b){
    const delta=b.clone().sub(a),len=Math.max(.001,delta.length());
    mesh.position.copy(a);mesh.scale.set(1,len,1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.multiplyScalar(1/len));
    mesh.userData.anchorStart=a.toArray();mesh.userData.anchorEnd=b.toArray();mesh.userData.anchorLength=len;
  }
  _fixedPalmBetween(anchor,visual,a,b){
    const delta=b.clone().sub(a),distance=Math.max(.001,delta.length()),direction=delta.clone().multiplyScalar(1/distance);
    const length=clamp(distance,GOLFER_COHESION_SPEC.palmLengthMin,GOLFER_COHESION_SPEC.palmLengthMax);
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
    // The distal cap owns contact. Extra anatomical length buries into the
    // forearm, while the small wrist seal covers the rare long-reach residue.
    // No palm can telescope past or through its assigned grip station.
    const shellStart=b.clone().addScaledVector(direction,-length);
    anchor.position.copy(a);anchor.quaternion.identity();anchor.scale.set(1,1,1);
    visual.position.copy(shellStart.sub(a));visual.quaternion.copy(rotation);visual.scale.set(1,length,1);
    anchor.userData.anchorStart=a.toArray();anchor.userData.anchorEnd=b.toArray();anchor.userData.contactDistance=distance;
    anchor.userData.visualPalmLength=length;
  }
  _between(mesh,a,b,r){
    const mid=a.clone().add(b).multiplyScalar(.5),len=Math.max(.001,a.distanceTo(b));
    mesh.position.copy(mid);
    mesh.scale.set(1,len*1.085,1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  }
  _build(){
    // Authored LOFT body volumes: tapered, human, athletic, not toy-spherical.
    this.pelvis=this._ellipticBody([
      [-.170,.106,.156,.018],[-.140,.120,.181,.006],[-.080,.132,.198,-.006],
      [.000,.135,.204,-.012],[.070,.127,.193,-.003],[.115,.112,.169,.008]
    ],this.pants,22);
    this.pelvis.userData.loftShell='tailored-trouser-seat';
    this.pelvis.userData.profileSections=6;

    // One authored shirt volume: narrow waist, believable chest depth,
    // broad but attainable shoulders. This removes the stacked-barrel torso read.
    this.torso=this._ellipticBody([
      [-.38,.126,.170,.010],
      [-.31,.132,.181,.010],
      [-.20,.140,.190,.012],
      [-.06,.151,.208,.015],
      [.08,.163,.231,.014],
      [.18,.169,.258,.006],
      [.24,.157,.244,-.003],
      [.30,.116,.142,-.008],
      [.35,.080,.076,-.010]
    ],this.polo,18);
    this.torso.userData.loftShell='tailored-polo';
    this.torso.userData.profileSections=9;

    // Golf-specific garment construction. These are children of the shirt so
    // they rotate with the ribcage instead of floating during the swing.
    this.placket=new THREE.Mesh(new THREE.BoxGeometry(.012,.145,.030),this.stone);
    this.placket.position.set(.150,.185,0);this.placket.castShadow=true;this.torso.add(this.placket);
    this.collarWingL=new THREE.Mesh(new THREE.BoxGeometry(.018,.090,.085),this.stone);
    this.collarWingL.position.set(.145,.295,-.064);this.collarWingL.rotation.x=-.32;this.collarWingL.rotation.y=.12;this.torso.add(this.collarWingL);
    this.collarWingR=this.collarWingL.clone();
    this.collarWingR.position.z=.064;this.collarWingR.rotation.y=-.12;this.torso.add(this.collarWingR);
    this.shirtHem=new THREE.Mesh(new THREE.TorusGeometry(.166,.010,7,34),this.polo);
    this.shirtHem.position.set(0,-.354,0);this.shirtHem.rotation.x=Math.PI/2;
    this.shirtHem.scale.set(.80,1,1.04);this.shirtHem.castShadow=true;this.torso.add(this.shirtHem);

    this.chest=this._lathe([[.01,-.01],[.01,.01]],this.polo,8);
    this.chest.visible=false;
    this.waist=this._lathe([[.01,-.01],[.01,.01]],this.polo,8);
    this.waist.visible=false;

    this.belt=this._shape(new THREE.CylinderGeometry(.175,.175,.044,30),this.ink);
    this.buckle=new THREE.Mesh(new THREE.BoxGeometry(.022,.060,.075),this.steel);
    this.buckle.position.set(.137,.014,0);this.buckle.castShadow=true;this.pelvis.add(this.buckle);

    // Hidden overlap volumes are deliberate: this is a stylized human, not a
    // collection of disconnected primitives. These seals keep silhouette
    // continuity through the full golf motion.
    this.hipSealL=this._shape(new THREE.SphereGeometry(.067,20,14),this.pants,[0,0,0],[.94,.66,1.06]);
    this.hipSealR=this._shape(new THREE.SphereGeometry(.067,20,14),this.pants,[0,0,0],[.94,.66,1.06]);
    this.shoulderSealL=this._shape(new THREE.SphereGeometry(.066,20,14),this.polo,[0,0,0],[1.02,.66,.92]);
    this.shoulderSealR=this._shape(new THREE.SphereGeometry(.066,20,14),this.polo,[0,0,0],[1.02,.66,.92]);
    this.wristSealL=this._shape(new THREE.SphereGeometry(.029,16,12),this.cream,[0,0,0],[.82,.62,.80]);
    this.wristSealR=this._shape(new THREE.SphereGeometry(.029,16,12),this.skin,[0,0,0],[.82,.62,.80]);
    this.ankleSealL=this._shape(new THREE.SphereGeometry(.050,16,12),this.pants,[0,0,0],[.84,.64,.86]);
    this.ankleSealR=this._shape(new THREE.SphereGeometry(.050,16,12),this.pants,[0,0,0],[.84,.64,.86]);

    // Profiled elliptical shells carry human mass and taper through every pose.
    // Their local Y remains exactly one metre, so the analytic landmark and
    // fixed-length contracts below do not change.
    const thighProfile=[
      [-.50,.091,.084],[-.32,.096,.088],[-.08,.090,.083],[.18,.080,.075],[.39,.069,.065],[.50,.062,.059]
    ];
    const calfProfile=[
      [-.50,.063,.060],[-.34,.071,.066],[-.10,.076,.070],[.16,.069,.064],[.38,.054,.051],[.50,.046,.044]
    ];
    const sleeveProfile=[
      [-.50,.075,.070],[-.30,.082,.076],[-.02,.080,.074],[.24,.071,.066],[.43,.061,.057],[.50,.058,.054]
    ];
    const upperArmProfile=[
      [-.50,.054,.051],[-.28,.058,.054],[-.02,.057,.053],[.24,.052,.048],[.43,.047,.044],[.50,.044,.041]
    ];
    const forearmProfile=[
      [-.50,.047,.044],[-.31,.051,.047],[-.06,.052,.048],[.20,.047,.043],[.40,.038,.035],[.50,.034,.032]
    ];
    this.thighL=this._sculptedSegment('thigh',thighProfile,this.pants);this.thighR=this._sculptedSegment('thigh',thighProfile,this.pants);
    this.calfL=this._sculptedSegment('calf',calfProfile,this.pants);this.calfR=this._sculptedSegment('calf',calfProfile,this.pants);
    this.kneeL=this._shape(new THREE.SphereGeometry(.057,18,14),this.pants,[0,0,0],[.92,.72,.88]);
    this.kneeR=this._shape(new THREE.SphereGeometry(.057,18,14),this.pants,[0,0,0],[.92,.72,.88]);

    const shoeProfile=[
      [-.118,.041,.050],[-.100,.054,.061],[-.060,.061,.064],[.005,.060,.063],[.068,.055,.060],[.108,.049,.054],[.118,.043,.047]
    ];
    this.shoeL=this._sculptedSegment('shoe-upper',shoeProfile,this.shoeLeather,20);
    this.shoeR=this._sculptedSegment('shoe-upper',shoeProfile,this.shoeLeather,20);
    this.midsoleL=this._shape(new THREE.CapsuleGeometry(.010,.184,4,16),this.shoeMidsole,[0,0,0],[1,1,4.42],[0,0,Math.PI/2]);
    this.midsoleR=this._shape(new THREE.CapsuleGeometry(.010,.184,4,16),this.shoeMidsole,[0,0,0],[1,1,4.42],[0,0,Math.PI/2]);
    this.midsoleL.castShadow=false;this.midsoleR.castShadow=false;
    this.soleL=this._shape(new THREE.CapsuleGeometry(.0065,.188,4,16),this.ink,[0,0,0],[1,1,4.52],[0,0,Math.PI/2]);
    this.soleR=this._shape(new THREE.CapsuleGeometry(.0065,.188,4,16),this.ink,[0,0,0],[1,1,4.52],[0,0,Math.PI/2]);

    // Tailored terminations make the clothes read as clothes instead of body
    // segments. The bands inherit the analytic limb transform and never create
    // an independent animation landmark.
    const garmentBand=(parent,radius,mat,scaleZ=.94)=>{
      const band=new THREE.Mesh(new THREE.TorusGeometry(radius,.0045,7,24),mat);
      band.position.y=.472;band.rotation.x=Math.PI/2;band.scale.z=scaleZ;band.castShadow=false;
      parent.add(band);this.parts.push(band);return band;
    };

    this.sleeveL=this._sculptedSegment('sleeve',sleeveProfile,this.polo);this.sleeveR=this._sculptedSegment('sleeve',sleeveProfile,this.polo);
    this.sleeveCuffL=garmentBand(this.sleeveL,.058,this.poloTrim,.94);
    this.sleeveCuffR=garmentBand(this.sleeveR,.058,this.poloTrim,.94);
    this.upperL=this._sculptedSegment('upper-arm',upperArmProfile,this.skin);this.upperR=this._sculptedSegment('upper-arm',upperArmProfile,this.skin);
    this.foreL=this._sculptedSegment('forearm',forearmProfile,this.skin);this.foreR=this._sculptedSegment('forearm',forearmProfile,this.skin);
    this.elbowL=this._shape(new THREE.SphereGeometry(.041,16,12),this.skin,[0,0,0],[.92,.74,.90]);
    this.elbowR=this._shape(new THREE.SphereGeometry(.041,16,12),this.skin,[0,0,0],[.92,.74,.90]);
    // Palms are normalized wrist-to-contact bridges. Their analytic wrist
    // positions remain the authored IK endpoints; only the visible hand shell
    // reaches inward to a distinct, axially stacked contact on the grip.
    const gloveProfile=[[0,.021,.020],[.16,.029,.026],[.46,.034,.030],[.76,.031,.027],[1,.022,.020]];
    const bareProfile=[[0,.020,.019],[.18,.028,.025],[.48,.033,.029],[.77,.030,.026],[1,.021,.019]];
    this.handL=new THREE.Group();this.handR=new THREE.Group();
    this.handL.name='LOFT_LEAD_HAND_ANCHOR';this.handR.name='LOFT_TRAIL_HAND_ANCHOR';
    this.handL.userData.gripRole='lead-glove';this.handR.userData.gripRole='trail-bare';
    this.group.add(this.handL,this.handR);
    this.handLVisual=this._sculptedSegment('glove-hand',gloveProfile,this.cream,16);
    this.handRVisual=this._sculptedSegment('bare-hand',bareProfile,this.skin,16);
    this.handL.add(this.handLVisual);this.handR.add(this.handRVisual);
    this.gripWrapL=this._shape(new THREE.TorusGeometry(.0205,.0065,7,18,Math.PI*1.62),this.cream);
    this.gripWrapR=this._shape(new THREE.TorusGeometry(.0195,.0062,7,18,Math.PI*1.62),this.skin);
    this.gripWrapL.name='LOFT_LEAD_FINGER_WRAP';this.gripWrapR.name='LOFT_TRAIL_FINGER_WRAP';
    this.gloveCuff=this._shape(new THREE.TorusGeometry(.0245,.0042,7,18),this.poloTrim);
    this.gloveCuff.name='LOFT_GLOVE_CUFF';
    this.trouserCuffL=garmentBand(this.calfL,.046,this.pantsTrim,.96);
    this.trouserCuffR=garmentBand(this.calfR,.046,this.pantsTrim,.96);

    this.neck=this._sculptedSegment('neck-bridge-v3',[
      [-.059,.071,.064,-.010],[-.030,.069,.063,-.006],[0,.065,.060,0],[.032,.061,.057,.006],[.059,.058,.055,.010]
    ],this.skin,20);

    // Face, hair and cap share one transform. Their proportions can no longer
    // drift apart during a swing because they are authored as one LOFT head.
    this.headRoot=new THREE.Group();this.headRoot.name='LOFT_HEAD';this.group.add(this.headRoot);
    const headPart=(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0])=>{
      const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;this.headRoot.add(m);this.parts.push(m);return m;
    };
    const facialSections=[
      [-.140,.034,.035,.040,2.20,.020,0],[-.118,.067,.057,.070,3.20,.015,-.001],
      [-.078,.091,.077,.093,3.20,.012,-.001],[-.035,.101,.089,.105,2.80,.007,.001],
      [.020,.103,.098,.109,2.50,.003,.001],[.060,.100,.103,.108,2.35,-.001,0],
      [.100,.086,.106,.102,2.15,-.009,-.001],[.132,.058,.083,.076,2.00,-.017,-.001]
    ];
    this.head=headPart(this._craniofacialGeometry(facialSections),this.skin);
    this.head.userData.loftFaceDNA='V3';this.head.userData.profileSections=facialSections.length;
    this.jaw=this.head; // Compatibility alias: the jaw is now part of one shell.
    this.nose=headPart(this._noseWedgeGeometry(),this.skin,[.101,-.004,0]);
    this.noseBridge=this.nose;
    this.earL=headPart(new THREE.SphereGeometry(.021,14,10),this.skin,[-.014,-.003,-.108],[.62,1,.50]);
    this.earR=headPart(new THREE.SphereGeometry(.021,14,10),this.skin,[-.014,-.002,.108],[.62,.98,.50]);
    this.hairMass=headPart(this._rearHairGeometry([
      [-.072,.070,.076,-.006],[-.035,.098,.108,-.006],[.020,.111,.114,-.006],[.065,.112,.110,-.009],[.105,.091,.092,-.014]
    ]),this.hair);
    this.sideburnL=headPart(new THREE.CapsuleGeometry(.010,.036,4,9),this.hair,[-.020,.002,-.101],[.70,1,.72],[0,0,.08]);
    this.sideburnR=headPart(new THREE.CapsuleGeometry(.010,.034,4,9),this.hair,[-.020,.003,.101],[.70,1,.72],[0,0,.08]);
    const capSections=[
      [.080,.096,.100,.116,2.50,-.008,0],[.105,.108,.112,.120,2.50,-.010,0],
      [.135,.095,.105,.109,2.30,-.014,0],[.162,.070,.087,.085,2.15,-.018,0],[.178,.035,.045,.046,2.00,-.020,0]
    ];
    this.cap=headPart(this._craniofacialGeometry(capSections,28,'sculpted-cap-crown'),this.stone);
    this.capBand=headPart(new THREE.TorusGeometry(.108,.0075,8,32),this.stone,[-.008,.087,0],[.95,1,1.03],[Math.PI/2,0,0]);
    const visorGeometry=this._visorGeometry();
    this.underBrim=headPart(visorGeometry.clone(),this.ink,[0,.083,0],[.985,.35,.985]);
    this.brim=headPart(visorGeometry,this.stone,[0,.090,0]);
    this.capSignal=headPart(new THREE.SphereGeometry(.0065,12,8),this.orange,[.081,.145,0],[.38,1,1]);
    this.eyeL=headPart(new THREE.SphereGeometry(.010,16,10),this.ink,[.105,.019,-.037],[.16,.42,1.55]);
    this.eyeR=headPart(new THREE.SphereGeometry(.010,16,10),this.ink,[.105,.019,.037],[.16,.42,1.55]);
    const browGeometry=this._featureCurveGeometry([
      new THREE.Vector3(0,-.001,-.017),new THREE.Vector3(0,.002,0),new THREE.Vector3(0,0,.017)
    ],.0028);
    this.browL=headPart(browGeometry,this.hair,[.106,.047,-.038]);
    this.browR=headPart(browGeometry.clone(),this.hair,[.106,.048,.038],[1,1,-1]);
    this.mouth=headPart(this._featureCurveGeometry([
      new THREE.Vector3(0,0,-.020),new THREE.Vector3(0,-.002,0),new THREE.Vector3(0,.001,.020)
    ],.0021),this.lip,[.1085,-.057,0]);

    // Collar and signal are garment details, parented to the shirt volume.
    this.collar=new THREE.Mesh(new THREE.TorusGeometry(.076,.009,8,26),this.stone);
    this.collar.position.set(0,.322,0);this.collar.rotation.x=Math.PI/2;this.collar.scale.z=.88;this.torso.add(this.collar);
    this.chestSignal=new THREE.Mesh(new THREE.SphereGeometry(.009,10,8),this.orange);
    this.chestSignal.position.set(.145,.10,-.055);this.torso.add(this.chestSignal);

    const shaftParts=createClubShaftParts(1);
    this.grip=this._add(shaftParts.grip);this.shaft=this._add(shaftParts.shaft);this.ferrule=this._add(shaftParts.ferrule);
    this.clubHead=new THREE.Group();this.clubHead.name='LOFT_OBJECT_HEAD';this.group.add(this.clubHead);
    this.clubType=null;this.clubId=null;this.clubLevel=null;this.clubLength=.93;
  }

  setClub(club='iron',level=1){
    const data=typeof club==='string'?{id:club,head:club,name:club}:club;
    const type=data?.head||'iron',id=data?.id||type;
    if(this.clubType===type&&this.clubId===id&&this.clubLevel===level)return;
    const {head,materials:M,profile,visualSettle}=createClubHead(data,level);
    this.clubType=type;this.clubId=id;this.clubLevel=level;
    // Factory buffers are shared with the Workshop. Detach only the old
    // transform nodes: disposing a geometry here would invalidate inspection.
    // Keep the animated head root; release only replaced instance-owned buffers.
    for(const part of [...this.clubHead.children])releaseClubInstance(part);
    this.clubHead.clear();
    for(const part of [...head.children])this.clubHead.add(part);
    this.clubHead.name=head.name;this.clubHead.userData={...head.userData};
    const parts=createClubShaftParts(level,type);
    for(const name of ['grip','shaft','ferrule']){
      this[name].geometry=parts[name].geometry;this[name].material=parts[name].material;
      this[name].userData.baseRadius=parts[name].userData.baseRadius;
    }
    this.clubLength=profile.length;
    this.addressBallLocal.set(profile.ballX,profile.ballY,0);
    this.clubAddressX=profile.headX;this.clubAddressHeight=profile.headY;
    this.clubVisualSettle=visualSettle;
  }
  _v(a){return new THREE.Vector3(a[0],a[1],a[2]);}
  _mix(a,b,t){const o={};for(const k in a){const A=a[k],B=b[k];o[k]=[lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t)];}return o;}
  _pchipTangent(values,index,times=KINETIC_CHAIN_SPEC.times){
    const last=values.length-1;
    if(index<=0)return (values[1]-values[0])/(times[1]-times[0]);
    if(index>=last)return (values[last]-values[last-1])/(times[last]-times[last-1]);
    const h0=times[index]-times[index-1],h1=times[index+1]-times[index];
    const d0=(values[index]-values[index-1])/h0,d1=(values[index+1]-values[index])/h1;
    // Component extrema are real reversals (especially the top of the swing),
    // so arrive with zero tangent. Monotone components use the non-uniform
    // harmonic PCHIP tangent: continuous without spline overshoot.
    if(Math.abs(d0)<1e-10||Math.abs(d1)<1e-10||d0*d1<=0)return 0;
    const w0=2*h1+h0,w1=h1+2*h0;
    return (w0+w1)/(w0/d0+w1/d1);
  }
  _hermite(a,b,ma,mb,u,span){
    const u2=u*u,u3=u2*u;
    return (2*u3-3*u2+1)*a+(u3-2*u2+u)*span*ma+(-2*u3+3*u2)*b+(u3-u2)*span*mb;
  }
  _sampleTrack(values,t,times=KINETIC_CHAIN_SPEC.times){
    const last=times.length-1;
    if(t<=times[0])return values[0];
    if(t>=times[last])return values[last];
    const exact=times.findIndex(time=>Math.abs(t-time)<1e-10);
    if(exact>=0)return values[exact];
    let segment=0;while(segment<last-1&&t>times[segment+1])segment++;
    const span=times[segment+1]-times[segment],u=(t-times[segment])/span;
    return this._hermite(values[segment],values[segment+1],this._pchipTangent(values,segment,times),this._pchipTangent(values,segment+1,times),u,span);
  }
  _splinePose(poses,t){
    const names=KINETIC_CHAIN_SPEC.names,times=KINETIC_CHAIN_SPEC.times;
    const exact=times.findIndex(time=>Math.abs(t-time)<1e-10);
    if(exact>=0){
      const source=poses[names[exact]],copy={};
      for(const key in source)copy[key]=source[key].slice();
      return copy;
    }
    const result={};
    for(const key in poses.address){
      result[key]=[0,1,2].map(axis=>this._sampleTrack(names.map(name=>poses[name][key][axis]),t,times));
    }
    return result;
  }
  _pairYaw(left,right,yawDeg){
    const center=left.clone().lerp(right,.5),dx=right.x-left.x,dz=right.z-left.z;
    const radius=Math.hypot(dx,dz),yaw=yawDeg*Math.PI/180;
    const planar=new THREE.Vector3(Math.sin(yaw)*radius,0,Math.cos(yaw)*radius);
    const L=left.clone(),R=right.clone();
    L.x=center.x-planar.x*.5;L.z=center.z-planar.z*.5;
    R.x=center.x+planar.x*.5;R.z=center.z+planar.z*.5;
    return [L,R];
  }
  _pairYawDeg(left,right){return Math.atan2(right.x-left.x,right.z-left.z)*180/Math.PI;}
  _kineticFrameAt(t,hipL,hipR,shoulderL,shoulderR){
    if(this.clubType==='putter')return {
      isolated:true,pelvisYawDeg:this._pairYawDeg(hipL,hipR),shoulderYawDeg:this._pairYawDeg(shoulderL,shoulderR),
      hipL,hipR,shoulderL,shoulderR
    };
    const pelvisYawDeg=this._sampleTrack(KINETIC_CHAIN_SPEC.pelvisYawDeg,t);
    const shoulderYawDeg=this._sampleTrack(KINETIC_CHAIN_SPEC.shoulderYawDeg,t);
    const hips=this._pairYaw(hipL,hipR,pelvisYawDeg),shoulders=this._pairYaw(shoulderL,shoulderR,shoulderYawDeg);
    return {isolated:false,pelvisYawDeg,shoulderYawDeg,hipL:hips[0],hipR:hips[1],shoulderL:shoulders[0],shoulderR:shoulders[1]};
  }
  _poses(){
    return {
      address:{pelvis:[-.42,.88,0],torso:[-.35,1.20,0],chest:[-.29,1.43,0],head:[-.25,1.75,0],
        hipL:[-.42,.87,-.155],hipR:[-.42,.87,.155],kneeL:[-.29,.47,-.17],kneeR:[-.28,.47,.17],ankleL:[-.39,.085,-.18],ankleR:[-.37,.085,.18],
        shoulderL:[-.27,1.45,-.215],shoulderR:[-.27,1.45,.215],sleeveL:[-.18,1.34,-.18],sleeveR:[-.18,1.34,.18],elbowL:[-.04,1.17,-.14],elbowR:[-.04,1.17,.14],handL:[.12,.94,-.038],handR:[.13,.935,.038],club:[.43,.045,0]},
      takeaway:{pelvis:[-.43,.88,.008],torso:[-.37,1.21,.018],chest:[-.34,1.44,.030],head:[-.26,1.75,.018],
        hipL:[-.40,.87,-.14],hipR:[-.46,.87,.16],kneeL:[-.28,.47,-.17],kneeR:[-.30,.48,.17],ankleL:[-.39,.085,-.18],ankleR:[-.37,.085,.18],
        shoulderL:[-.25,1.47,-.13],shoulderR:[-.41,1.48,.22],sleeveL:[-.20,1.38,-.08],sleeveR:[-.35,1.39,.21],elbowL:[-.08,1.28,-.01],elbowR:[-.26,1.29,.23],handL:[-.04,1.18,.17],handR:[-.07,1.16,.23],club:[-.05,.29,.73]},
      top:{pelvis:[-.44,.89,.030],torso:[-.40,1.22,.060],chest:[-.40,1.45,.092],head:[-.28,1.76,.055],
        hipL:[-.38,.87,-.09],hipR:[-.49,.88,.17],kneeL:[-.27,.47,-.16],kneeR:[-.32,.49,.17],ankleL:[-.39,.085,-.18],ankleR:[-.37,.085,.18],
        shoulderL:[-.20,1.45,.015],shoulderR:[-.47,1.51,.23],sleeveL:[-.26,1.43,.10],sleeveR:[-.43,1.44,.27],elbowL:[-.29,1.47,.18],elbowR:[-.47,1.47,.34],handL:[-.36,1.68,.36],handR:[-.41,1.66,.42],club:[-.80,1.94,.91]},
      delivery:{pelvis:[-.39,.89,-.022],torso:[-.34,1.21,-.006],chest:[-.31,1.45,-.020],head:[-.24,1.75,.005],
        hipL:[-.35,.88,-.17],hipR:[-.45,.87,.10],kneeL:[-.26,.47,-.18],kneeR:[-.31,.50,.17],ankleL:[-.39,.085,-.18],ankleR:[-.37,.085,.18],
        shoulderL:[-.24,1.49,-.19],shoulderR:[-.36,1.44,.13],sleeveL:[-.14,1.38,-.15],sleeveR:[-.27,1.34,.14],elbowL:[-.05,1.24,-.11],elbowR:[-.17,1.20,.14],handL:[.02,1.08,-.006],handR:[.01,1.065,.068],club:[.01,.39,.29]},
      impact:{pelvis:[-.36,.90,-.045],torso:[-.31,1.22,-.040],chest:[-.28,1.46,-.066],head:[-.23,1.75,-.018],
        hipL:[-.32,.89,-.18],hipR:[-.44,.87,.07],kneeL:[-.25,.47,-.18],kneeR:[-.32,.51,.16],ankleL:[-.39,.085,-.18],ankleR:[-.37,.085,.18],
        shoulderL:[-.23,1.50,-.22],shoulderR:[-.31,1.43,.10],sleeveL:[-.12,1.38,-.19],sleeveR:[-.21,1.32,.11],elbowL:[-.01,1.22,-.16],elbowR:[-.08,1.17,.10],handL:[.13,.955,-.050],handR:[.14,.945,.040],club:[.44,.045,-.02]},
      release:{pelvis:[-.35,.91,-.078],torso:[-.32,1.25,-.10],chest:[-.31,1.49,-.14],head:[-.25,1.78,-.072],
        hipL:[-.31,.90,-.19],hipR:[-.44,.88,.04],kneeL:[-.24,.47,-.18],kneeR:[-.33,.54,.13],ankleL:[-.39,.085,-.18],ankleR:[-.37,.10,.17],
        shoulderL:[-.31,1.54,-.27],shoulderR:[-.24,1.46,.025],sleeveL:[-.22,1.44,-.29],sleeveR:[-.12,1.36,-.03],elbowL:[-.10,1.34,-.32],elbowR:[-.01,1.27,-.14],handL:[-.02,1.29,-.37],handR:[-.05,1.27,-.30],club:[-.16,.66,-.88]},
      finish:{pelvis:[-.36,.92,-.095],torso:[-.37,1.29,-.15],chest:[-.38,1.53,-.19],head:[-.31,1.82,-.12],
        hipL:[-.30,.91,-.19],hipR:[-.46,.89,.015],kneeL:[-.24,.48,-.18],kneeR:[-.38,.58,.08],ankleL:[-.39,.085,-.18],ankleR:[-.43,.14,.12],
        shoulderL:[-.45,1.58,-.27],shoulderR:[-.27,1.53,-.045],sleeveL:[-.40,1.50,-.32],sleeveR:[-.20,1.44,-.11],elbowL:[-.36,1.47,-.37],elbowR:[-.19,1.40,-.26],handL:[-.32,1.66,-.42],handR:[-.37,1.63,-.36],club:[-.92,1.94,-.91]}
    };
  }
  _puttPose(t,level){
    const base=this._poses().address;
    const p={};for(const k in base)p[k]=[...base[k]];

    // Compact putting setup: narrower base, eyes quieter, arms hanging under shoulders.
    p.ankleL[2]=-.14;p.ankleR[2]=.14;
    p.kneeL[2]=-.13;p.kneeR[2]=.13;
    p.pelvis[0]=-.40;p.torso[0]=-.31;p.chest[0]=-.24;p.head[0]=-.18;
    p.head[1]=1.70;
    p.shoulderL=[-.22,1.43,-.18];p.shoulderR=[-.22,1.43,.18];
    p.sleeveL=[-.12,1.31,-.15];p.sleeveR=[-.12,1.31,.15];
    p.elbowL=[-.01,1.09,-.11];p.elbowR=[-.01,1.09,.11];

    const tt=clamp(t,0,1);
    let phase;
    if(tt<.38)phase=lerp(0,.24,ease(tt/.38));        // backstroke
    else if(tt<.60)phase=lerp(.24,0,out((tt-.38)/.22)); // return to impact
    else phase=lerp(0,-.34,out((tt-.60)/.40));          // roll-through

    p.handL=[.12,.845,-.035+phase*.24];
    p.handR=[.13,.838,.038+phase*.24];
    p.club=[this.clubAddressX,this.clubAddressHeight,phase];

    // The shoulders rock; hips stay nearly still.
    p.shoulderL[1]+=phase*.055;p.shoulderR[1]-=phase*.055;
    return p;
  }

  _poseAt(t,level){
    if(this.clubType==='putter')return this._puttPose(t,level);
    const P=this._poses();
    P.address.club=[this.clubAddressX,this.clubAddressHeight,0];
    P.impact.club=[this.clubAddressX,this.clubAddressHeight,-.02];
    const p=this._splinePose(P,t);

    const rookie=1-level.form;
    // Ability changes timing and efficiency, never anatomy. Clamp visual error
    // so Level 1 remains recognisably human while the trusted gameplay form
    // values continue to drive shot quality exactly as before.
    const visualSway=Math.min(level.sway,.065);
    const visualEarly=Math.min(level.earlyExt,.060);
    const visualPlane=Math.min(level.plane,.085);
    // Skill signatures keep their exact authored checkpoint values, but the
    // old triangular cusps have been replaced by the same C1 track sampler as
    // the body. They can no longer reintroduce a stop or lunge at a pose seam.
    const downswing=this._sampleTrack(KINETIC_CHAIN_SPEC.downswingTrack,t);
    const back=this._sampleTrack(KINETIC_CHAIN_SPEC.backTrack,t);
    const fin=this._sampleTrack(KINETIC_CHAIN_SPEC.finishTrack,t);
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
    p.head[0]+=Math.sin(t*Math.PI*2.1)*visualSway;
    p.head[2]+=back*visualSway*.45;

    // Limited coil at the top: hands/club never reach the clean mastered height.
    p.handL[1]-=back*rookie*.13;p.handR[1]-=back*rookie*.13;
    p.club[1]-=back*rookie*.20;
    p.handL[0]+=back*rookie*.05;p.handR[0]+=back*rookie*.05;

    // Early extension + steeper delivery create a visibly less athletic strike.
    p.torso[0]+=downswing*visualEarly;
    p.chest[0]+=downswing*visualEarly*.82;
    p.pelvis[0]+=downswing*visualEarly*.62;
    p.handL[0]-=downswing*visualPlane*.34;p.handR[0]-=downswing*visualPlane*.34;
    p.handL[2]+=downswing*visualPlane*.62;p.handR[2]+=downswing*visualPlane*.62;
    p.club[0]-=downswing*visualPlane*.58;p.club[2]+=downswing*visualPlane*1.18;
    // A developing swing can arrive steep, but the authored sole never passes
    // through the visible field at impact. Raise the guide by the exact visual
    // skill delta; gameplay contact continues to launch at protected t=.60.
    p.club[1]+=downswing*rookie*.30;

    // Rookie release gets a small chicken-wing / low finish signature.
    p.elbowL[0]+=fin*rookie*.08;
    p.elbowL[2]+=fin*rookie*.10;
    p.handL[1]-=fin*rookie*.17;p.handR[1]-=fin*rookie*.17;
    p.handL[2]+=fin*rookie*.09;p.handR[2]+=fin*rookie*.09;
    p.ankleR[1]+=fin*rookie*.08*Math.sin(Math.PI*fin);
    p.kneeR[0]-=fin*rookie*.09;
    p.chest[2]+=fin*rookie*.08;

    if(t>.77){
      const imperfect=(1-level.finish)*smooth01((t-.77)/.23);
      p.club[1]=lerp(p.club[1],1.58,imperfect);
      p.club[2]=lerp(p.club[2],-.64,imperfect);
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

  _solveChain(start,target,l1,l2,pole){
    const raw=target.clone().sub(start);
    const distance=Math.max(.0001,raw.length());
    const direction=raw.multiplyScalar(1/distance);
    const solvedDistance=clamp(distance,Math.abs(l1-l2)+.002,l1+l2-.002);
    const end=start.clone().addScaledVector(direction,solvedDistance);
    const along=(l1*l1-l2*l2+solvedDistance*solvedDistance)/(2*solvedDistance);
    const height=Math.sqrt(Math.max(0,l1*l1-along*along));
    const bend=pole.clone().sub(start);
    bend.addScaledVector(direction,-bend.dot(direction));
    if(bend.lengthSq()<.00001){
      bend.set(1,0,0).addScaledVector(direction,-direction.x);
      if(bend.lengthSq()<.00001)bend.set(0,0,1);
    }
    bend.normalize();
    const joint=start.clone().addScaledVector(direction,along).addScaledVector(bend,height);
    return {joint,end};
  }

  setPose(t,level){
    t=clamp(t,0,1);const p=this._poseAt(t,level);
    const V=k=>this._v(p[k]);
    const frame=this._kineticFrameAt(t,V('hipL'),V('hipR'),V('shoulderL'),V('shoulderR'));
    const hipL=frame.hipL,hipR=frame.hipR,shoulderL=frame.shoulderL,shoulderR=frame.shoulderR;
    this._kineticFrame={
      system:KINETIC_CHAIN_SPEC.system,isolated:frame.isolated,
      pelvisYawDeg:frame.pelvisYawDeg,shoulderYawDeg:frame.shoulderYawDeg,
      hipL:hipL.toArray(),hipR:hipR.toArray(),shoulderL:shoulderL.toArray(),shoulderR:shoulderR.toArray()
    };
    const hipCenter=hipL.clone().lerp(hipR,.5),shoulderCenter=shoulderL.clone().lerp(shoulderR,.5);

    const ankleL=V('ankleL'),ankleR=V('ankleR');
    const legL=this._solveChain(hipL,ankleL,this.legUpper,this.legLower,V('kneeL'));
    const legR=this._solveChain(hipR,ankleR,this.legUpper,this.legLower,V('kneeR'));
    const armL=this._solveChain(shoulderL,V('handL'),this.armUpper,this.armLower,V('elbowL'));
    const armR=this._solveChain(shoulderR,V('handR'),this.armUpper,this.armLower,V('elbowR'));
    const sleeveL=shoulderL.clone().lerp(armL.joint,.27),sleeveR=shoulderR.clone().lerp(armR.joint,.27);

    this.pelvis.position.copy(V('pelvis'));this.pelvis.scale.set(.96,.88,.96);
    this._orientBody(this.pelvis,hipCenter.clone().add(new THREE.Vector3(0,1,0)),hipCenter,hipR.clone().sub(hipL));

    this.torso.position.copy(V('torso')).add(new THREE.Vector3(.012,.015,0));this.torso.scale.set(.99,.99,.99);
    this._orientBody(this.torso,shoulderCenter,hipCenter,shoulderR.clone().sub(shoulderL));

    this.belt.position.copy(V('pelvis')).add(new THREE.Vector3(.022,.058,0));this.belt.scale.set(.72,1,1.04);
    this.belt.quaternion.copy(this.pelvis.quaternion);

    this.hipSealL.position.copy(hipL);this.hipSealR.position.copy(hipR);
    this.shoulderSealL.position.copy(shoulderL).lerp(sleeveL,.18);
    this.shoulderSealR.position.copy(shoulderR).lerp(sleeveR,.18);

    this._between(this.thighL,hipL,legL.joint,.086);this._between(this.thighR,hipR,legR.joint,.086);
    this._between(this.calfL,legL.joint,legL.end,.071);this._between(this.calfR,legR.joint,legR.end,.071);
    this.kneeL.position.copy(legL.joint);this.kneeR.position.copy(legR.joint);
    this.ankleSealL.position.copy(legL.end);this.ankleSealR.position.copy(legR.end);
    const pivotPhase=clamp((t-KINETIC_CHAIN_SPEC.trailPivotStart)/(1-KINETIC_CHAIN_SPEC.trailPivotStart),0,1);
    const heelRelease=(pivotPhase*pivotPhase*(3-2*pivotPhase))*(this.clubType==='putter'?0:1);
    this.shoeL.position.copy(legL.end).add(new THREE.Vector3(.076,-.036,0));
    this.shoeR.position.copy(legR.end).add(new THREE.Vector3(.076,-.036,0));
    this.shoeL.scale.set(.92,.92,.82);this.shoeR.scale.set(.92,.92,.82);
    this.shoeL.rotation.set(0,0,Math.PI/2);
    this.shoeR.rotation.set(0,0,Math.PI/2-heelRelease*KINETIC_CHAIN_SPEC.trailPivotRadians);
    this.midsoleL.position.copy(legL.end).add(new THREE.Vector3(.076,-.081,0));
    this.midsoleR.position.copy(legR.end).add(new THREE.Vector3(.076,-.081,0));
    this.midsoleL.rotation.set(0,0,Math.PI/2);this.midsoleR.rotation.set(0,0,Math.PI/2-heelRelease*KINETIC_CHAIN_SPEC.trailPivotRadians);
    this.soleL.position.copy(legL.end).add(new THREE.Vector3(.076,-.094,0));
    this.soleR.position.copy(legR.end).add(new THREE.Vector3(.076,-.094,0));
    this.soleL.rotation.set(0,0,Math.PI/2);this.soleR.rotation.set(0,0,Math.PI/2-heelRelease*KINETIC_CHAIN_SPEC.trailPivotRadians);
    if(heelRelease>0){
      // Pivot all three footwear layers around one planted outsole point. The
      // old animation raised and rotated the entire shoe, leaving the trail
      // toe floating at finish. This correction is visual-only: ankle/leg IK
      // and every authored pose landmark remain untouched.
      const soleRadius=this.soleR.geometry.parameters.radius||.0065;
      const soleLength=(this.soleR.geometry.parameters.length||.188)*.5+soleRadius;
      const toeOffset=new THREE.Vector3(-soleRadius,-soleLength,0)
        .multiply(this.soleR.scale).applyEuler(this.soleR.rotation);
      const correction=KINETIC_CHAIN_SPEC.trailToeGroundY-(this.soleR.position.y+toeOffset.y);
      this.shoeR.position.y+=correction;this.midsoleR.position.y+=correction;this.soleR.position.y+=correction;
      const heelOffset=new THREE.Vector3(-soleRadius,soleLength,0)
        .multiply(this.soleR.scale).applyEuler(this.soleR.rotation);
      this._trailToeLocal=this.soleR.position.clone().add(toeOffset);
      this._trailHeelLocal=this.soleR.position.clone().add(heelOffset);
    }else{
      this._trailToeLocal=null;this._trailHeelLocal=null;
    }
    this._soleLocal=[this.soleL.position.clone(),this.soleR.position.clone()];

    this._between(this.sleeveL,shoulderL,sleeveL,.073);this._between(this.sleeveR,shoulderR,sleeveR,.073);
    this._between(this.upperL,sleeveL,armL.joint,.052);this._between(this.upperR,sleeveR,armR.joint,.052);
    this._between(this.foreL,armL.joint,armL.end,.046);this._between(this.foreR,armR.joint,armR.end,.046);
    this.elbowL.position.copy(armL.joint);this.elbowR.position.copy(armR.joint);
    this.wristSealL.position.copy(armL.end);this.wristSealR.position.copy(armR.end);

    const H=V('head');
    this.neck.position.copy(H).add(new THREE.Vector3(-.026,-.142,0));this.neck.scale.set(.96,1,.96);
    this.neck.quaternion.copy(this.torso.quaternion);
    this.headRoot.position.copy(H);
    let gaze;
    if(this.clubType==='putter')gaze=GOLFER_COHESION_SPEC.puttingGazeRadians;
    else if(t<.38)gaze=lerp(GOLFER_COHESION_SPEC.addressGazeRadians,GOLFER_COHESION_SPEC.topGazeRadians,ease(t/.38));
    else if(t<.60)gaze=lerp(GOLFER_COHESION_SPEC.topGazeRadians,GOLFER_COHESION_SPEC.addressGazeRadians,ease((t-.38)/.22));
    else gaze=lerp(GOLFER_COHESION_SPEC.addressGazeRadians,GOLFER_COHESION_SPEC.finishGazeRadians,ease((t-.60)/.40));
    this.headRoot.rotation.set(0,0,gaze);this.headRoot.userData.gazeRadians=gaze;

    const gripCenter=armL.end.clone().lerp(armR.end,.5),guide=V('club');
    const dir=guide.sub(gripCenter);if(dir.lengthSq()<.0001)dir.set(1,-1,0);dir.normalize();
    // Permanent anatomical ordering: lead glove above, trail hand below. The
    // authored wrist targets can pass one another after impact, but the visible
    // grip can never invert or collapse back into a single mitten.
    const leadContact=gripCenter.clone().addScaledVector(dir,GOLFER_COHESION_SPEC.leadGripStation);
    const trailContact=gripCenter.clone().addScaledVector(dir,GOLFER_COHESION_SPEC.trailGripStation);
    const face=new THREE.Vector3(1,0,0).addScaledVector(dir,-dir.x);
    if(face.lengthSq()<.0001)face.set(0,0,1).addScaledVector(dir,-dir.z);
    face.normalize();const across=new THREE.Vector3().crossVectors(dir,face).normalize();
    // Hands occupy opposite quadrants of the real cylindrical handle. A small
    // face-plane component keeps glove and bare hand readable in LOFT's
    // side-biased gameplay camera instead of hiding both in camera depth.
    const leadSurface=leadContact.clone()
      .addScaledVector(face,GOLFER_COHESION_SPEC.gripFaceOffset)
      .addScaledVector(across,GOLFER_COHESION_SPEC.gripAcrossOffset);
    const trailSurface=trailContact.clone()
      .addScaledVector(face,-GOLFER_COHESION_SPEC.gripFaceOffset)
      .addScaledVector(across,-GOLFER_COHESION_SPEC.gripAcrossOffset);
    this._fixedPalmBetween(this.handL,this.handLVisual,armL.end,leadSurface);
    this._fixedPalmBetween(this.handR,this.handRVisual,armR.end,trailSurface);
    const gripFrame=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),dir);
    this.gripWrapL.position.copy(leadContact);this.gripWrapL.quaternion.copy(gripFrame);this.gripWrapL.rotateZ(.34);
    this.gripWrapR.position.copy(trailContact);this.gripWrapR.quaternion.copy(gripFrame);this.gripWrapR.rotateZ(-.28);
    const gloveDirection=leadSurface.clone().sub(armL.end).normalize();
    this.gloveCuff.position.copy(armL.end).lerp(leadSurface,.14);
    this.gloveCuff.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),gloveDirection);
    const foreDirectionL=armL.end.clone().sub(armL.joint).normalize().add(gloveDirection).normalize();
    const bareDirection=trailSurface.clone().sub(armR.end).normalize();
    const foreDirectionR=armR.end.clone().sub(armR.joint).normalize().add(bareDirection).normalize();
    this.wristSealL.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),foreDirectionL);
    this.wristSealR.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),foreDirectionR);
    this._gripContactsLocal=[leadContact.clone(),trailContact.clone()];
    this._gripSurfaceContactsLocal=[leadSurface.clone(),trailSurface.clone()];
    this._handWristLocal=[armL.end.clone(),armR.end.clone()];
    const gripEnd=gripCenter.clone().addScaledVector(dir,.155);
    const gripButt=gripCenter.clone().addScaledVector(dir,-GOLFER_COHESION_SPEC.gripButtExtension);
    const club=gripCenter.clone().addScaledVector(dir,this.clubLength);
    this.clubHead.position.copy(club);
    this.clubHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);this.clubHead.rotateX(Math.PI/2);
    // The head origin remains the protected analytic landmark. Construction
    // settles below it by family, so the ferrule follows that same visual-only
    // offset and meets the hosel without changing clubLength or the swing path.
    const stations=clubFerruleStations(this.clubHead,gripEnd);
    const ferruleEnd=stations?.end||club.clone().addScaledVector(dir,(this.clubVisualSettle||0)-.014);
    const ferruleStart=stations?.start||ferruleEnd.clone().addScaledVector(dir,-.061);
    this._between(this.grip,gripButt,gripEnd,.027);
    this.grip.userData.visualButt=gripButt.toArray();this.grip.userData.visualEnd=gripEnd.toArray();
    this.grip.userData.contactSeparation=leadContact.distanceTo(trailContact);
    this._between(this.shaft,gripEnd,ferruleStart,.013);
    this._between(this.ferrule,ferruleStart,ferruleEnd,.016);
  }

  shoeContactPoints(){
    return (this._soleLocal||[new THREE.Vector3(-.39,0,-.18),new THREE.Vector3(-.37,0,.18)]).map(v=>v.clone());
  }
}
