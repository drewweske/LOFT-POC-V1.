import * as THREE from '../vendor/three.module.js';
import {equipmentTier} from './equipment.js';

const lerp=(a,b,t)=>a+(b-a)*t;
const materialCache=new Map(),headCache=new Map(),segmentGeometryCache=new Map();

export const IN_WORLD_CLUB_SPEC=Object.freeze({
  system:'LOFT_IN_WORLD_CLUB_CRAFT_V2',
  coordinateContract:Object.freeze({x:'FACE_TO_BACK',y:'HEEL_TO_TOE',z:'SOLE_TO_GRIP'}),
  maxHeadParts:14,
  maxHeadTriangles:14000,
  signalPartsPerPremiumHead:1,
  addressContact:Object.freeze({
    ballRadius:.026,
    minimumFaceGap:.001,
    // A tangent-plane shift separates visible construction from the ball
    // while the protected analytic head landmark and swing path stay fixed.
    tangentLiftRatio:.383,
    familyOffset:Object.freeze({driver:.025,wood:.024,hybrid:.022,iron:.012,wedge:.0102,putter:.021})
  }),
  protected:Object.freeze(['clubLength','addressBallLocal','clubAddressX','clubAddressHeight','impactTiming','flightPhysics'])
});

// The one construction source for the held object and the Workshop. These
// builders retain the trusted face/contact construction. Neck refinements are
// shared by inspection and play, never an inspection-only substitute.
class ClubHeadBuilder{
  constructor(){
    this.clubHead=new THREE.Group();
    this.addressBallLocal=new THREE.Vector3();
  }
  _clubMaterials(level){
    const tier=equipmentTier(level),key=tier.id;
    if(materialCache.has(key))return materialCache.get(key);
    const palette={
      foundation:{body:0x8f918d,face:0xb8bab5,dark:0x4c504f,accent:0xb8b1a6,rough:.72,metal:.30},
      field:{body:0x303536,face:0xbfc1bc,dark:0x111515,accent:0x8f8b83,rough:.50,metal:.50},
      tour:{body:0xc9c5bb,face:0xe1dfd9,dark:0x202425,accent:0xff6a2a,rough:.32,metal:.68},
      signature:{body:0x111516,face:0xd7d3cb,dark:0x070909,accent:0xff6a2a,rough:.22,metal:.78},
      icon:{body:0x101414,face:0xebe4d6,dark:0x050707,accent:0xff6a2a,rough:.15,metal:.84}
    }[key];
    const physical=(color,roughness,metalness,clearcoat=0)=>new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat,clearcoatRoughness:.18});
    const mats={
      body:physical(palette.body,palette.rough,palette.metal,key==='signature'?.48:key==='icon'?.72:.10),
      face:physical(palette.face,Math.max(.18,palette.rough-.08),Math.min(.92,palette.metal+.08),.25),
      dark:physical(palette.dark,.34,.44,.18),
      accent:physical(palette.accent,.38,.36,.20),
      tier
    };
    materialCache.set(key,mats);return mats;
  }
  _clubPart(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
    const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;this.clubHead.add(m);return m;
  }
  _clubNamedPart(name,geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],role='structure'){
    const part=this._clubPart(geo,mat,pos,scale,rot);
    part.name=name;part.userData.clubRole=role;return part;
  }
  _roundedPlanGeometry(front,back,halfWidth,height,radius=.010){
    const r=Math.min(radius,(back-front)*.45,halfWidth*.45),shape=new THREE.Shape();
    shape.moveTo(front,-halfWidth+r);
    shape.quadraticCurveTo(front,-halfWidth,front+r,-halfWidth);
    shape.lineTo(back-r,-halfWidth);shape.quadraticCurveTo(back,-halfWidth,back,-halfWidth+r);
    shape.lineTo(back,halfWidth-r);shape.quadraticCurveTo(back,halfWidth,back-r,halfWidth);
    shape.lineTo(front+r,halfWidth);shape.quadraticCurveTo(front,halfWidth,front,halfWidth-r);
    shape.closePath();
    const bevel=Math.min(.0045,height*.18,r*.42);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:height,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
    geo.translate(0,0,-height*.5);geo.computeVertexNormals();return geo;
  }
  _wingPlanGeometry(side=1,height=.026,reach=.090,width=.040){
    const inner=.020,outer=inner+width,shape=new THREE.Shape();
    const y0=side*inner,y1=side*outer;
    shape.moveTo(-.002,Math.min(y0,y1));
    shape.lineTo(.030,Math.min(y0,y1));
    shape.quadraticCurveTo(reach*.92,Math.min(y0,y1)*1.05,reach,side*(inner+width*.34));
    shape.quadraticCurveTo(reach*1.03,side*(inner+width*.78),reach*.82,Math.max(y0,y1));
    shape.lineTo(.006,Math.max(y0,y1));
    shape.quadraticCurveTo(-.006,Math.max(y0,y1)*.92,-.002,Math.min(y0,y1));
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:height,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.004,bevelThickness:.0035});
    geo.translate(0,0,-height*.5);geo.computeVertexNormals();return geo;
  }
  _ironPlateGeometry(width=.108,height=.082,thickness=.018,highToe=0,bevel=.004){
    // Shape is authored in heel/toe × sole/top, then permuted so extrusion
    // becomes physical face depth. This is the explicit local club contract:
    // X face/back, Y heel/toe, Z sole/up.
    const half=width*.5,shape=new THREE.Shape();
    shape.moveTo(-half*.76,-height*.46);
    shape.quadraticCurveTo(-half,-height*.42,-half*.92,-height*.22);
    shape.lineTo(-half*.70,height*.33);
    shape.quadraticCurveTo(-half*.58,height*.47,-half*.34,height*.46);
    shape.lineTo(half*.70,height*(.46+highToe));
    shape.quadraticCurveTo(half*1.03,height*(.40+highToe*.45),half,height*.14);
    shape.lineTo(half*.88,-height*.35);
    shape.quadraticCurveTo(half*.66,-height*.48,half*.32,-height*.49);
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:Math.min(bevel,thickness*.24)});
    const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){
      const u=p.getX(i),v=p.getY(i),depth=p.getZ(i)-thickness*.5;
      p.setXYZ(i,depth,u,v);
    }
    p.needsUpdate=true;geo.deleteAttribute('normal');geo.computeVertexNormals();geo.computeBoundingBox();return geo;
  }
  _clubBridge(name,a,b,r,mat,role='hosel'){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
    const mid=start.clone().add(end).multiplyScalar(.5),length=start.distanceTo(end);
    const part=this._clubNamedPart(name,new THREE.CylinderGeometry(r*.84,r,length,14),mat,mid.toArray(),[1,1,1],[0,0,0],role);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());
    part.userData.bridgeStart=start.toArray();part.userData.bridgeEnd=end.toArray();part.userData.bridgeLength=length;
    return part;
  }
  _clubGrooves(name,width,zStart,count,spacing,x,mat){
    const geo=new THREE.BoxGeometry(.0025,width,.0017);
    const grooves=new THREE.InstancedMesh(geo,mat,count),dummy=new THREE.Object3D();
    grooves.name=name;grooves.userData.clubRole='face-grooves';grooves.castShadow=true;grooves.receiveShadow=true;
    for(let i=0;i<count;i++){
      dummy.position.set(x,0,zStart+i*spacing);dummy.updateMatrix();grooves.setMatrixAt(i,dummy.matrix);
    }
    grooves.instanceMatrix.needsUpdate=true;this.clubHead.add(grooves);return grooves;
  }
  _clubSignal(M,pos){
    if(!M.tier.signal)return null;
    const signal=this._clubNamedPart('LOFT_CLUB_SIGNAL_WEIGHT',new THREE.SphereGeometry(.0065,16,10),M.accent,pos,[1,.72,1],[0,0,0],'signal-weight');
    signal.userData.signal=true;return signal;
  }
  setClub(club='iron',level=1){
    const data=typeof club==='string'?{id:club,head:club,name:club}:club;
    const type=data?.head||'iron',id=data?.id||type;
    if(this.clubType===type&&this.clubId===id&&this.clubLevel===level)return;
    this.clubType=type;this.clubId=id;this.clubLevel=level;
    while(this.clubHead.children.length){
      const child=this.clubHead.children.pop();child.geometry?.dispose?.();
    }
    const M=this._clubMaterials(level);
    // Each category owns a believable address radius as well as a rigid club
    // length. The long clubs move the player farther from the ball instead of
    // extending the head through the ground plane.
    const profile={
      driver:{length:1.00,ballX:.63,headX:.60},
      wood:{length:.975,ballX:.58,headX:.55},
      hybrid:{length:.95,ballX:.52,headX:.49},
      iron:{length:.93,ballX:.46,headX:.43},
      wedge:{length:.90,ballX:.40,headX:.37},
      putter:{length:.86,ballX:.46,headX:.43}
    }[type]||{length:.93,ballX:.46,headX:.43};
    this.clubLength=profile.length;
    this.addressBallLocal.set(profile.ballX,.026,0);
    this.clubAddressX=profile.headX;this.clubAddressHeight=.045;
    const gradeBulk={foundation:1.13,field:1.07,tour:1.02,signature:.98,icon:.94}[M.tier.id]||1;

    const design=M.tier.designLevel;
    if(type==='driver'){
      this._clubNamedPart('LOFT_DRIVER_CROWN',new THREE.SphereGeometry(.062,32,22),M.body,[.066,0,.045],[1.52*gradeBulk,1.04,.52],[0,-.45,-.035],'crown');
      this._clubNamedPart('LOFT_DRIVER_FACE',new THREE.CylinderGeometry(.050,.054,.008,30),M.face,[-.004,0,.012],[1,1,1],[0,0,Math.PI/2],'face');
      this._clubNamedPart('LOFT_DRIVER_SOLE',new THREE.SphereGeometry(.058,28,16),M.dark,[.070,0,.014],[1.43*gradeBulk,.97,.16],[0,-.45,0],'sole');
      this._clubNamedPart('LOFT_DRIVER_REAR_CHASSIS',this._roundedPlanGeometry(.050,.145,.048,.018,.012),M.body,[0,0,.012],[1,1,1],[0,-.45,0],'rear-chassis');
      this._clubNamedPart('LOFT_DRIVER_FACE_FRAME',new THREE.TorusGeometry(.050,.004,6,28),M.body,[-.009,0,.012],[1,1,.92],[0,Math.PI/2,0],'face-frame');
      if(design>=3)this._clubNamedPart('LOFT_DRIVER_CROWN_INSET',new THREE.SphereGeometry(.052,26,14),M.dark,[.064,0,.072],[1.27,.78,.075],[0,.02,-.03],'crown-inset');
      if(design>=4)this._clubNamedPart('LOFT_DRIVER_SOLE_RAIL',new THREE.BoxGeometry(.084,.010,.007),M.face,[.075,0,.016],[1,1,1],[0,0,.04],'sole-rail');
      this._clubSignal(M,[.137,0,.048]);
      this._clubBridge('LOFT_DRIVER_HOSEL',[.016,-.048,.048],[0,-.005,.014],.012,M.body);
    }else if(type==='wood'||type==='hybrid'){
      const hybrid=type==='hybrid',k=hybrid?.88:1;
      this._clubNamedPart(`LOFT_${type.toUpperCase()}_CROWN`,new THREE.SphereGeometry(.056,30,20),M.body,[.052*k,0,.036],[1.42*k*gradeBulk,hybrid?.94:1.04,hybrid?.62:.50],[0,-.42,-.025],'crown');
      this._clubNamedPart(`LOFT_${type.toUpperCase()}_FACE`,new THREE.CylinderGeometry(.043*k,.046*k,.007,28),M.face,[-.004,0,.008],[1,1,1],[0,0,Math.PI/2],'face');
      this._clubNamedPart(`LOFT_${type.toUpperCase()}_SOLE`,new THREE.SphereGeometry(.050,24,14),M.dark,[.052*k,0,.009],[1.34*k,.92*k,.15],[0,-.42,0],'sole');
      this._clubNamedPart(`LOFT_${type.toUpperCase()}_TRAIL`,this._roundedPlanGeometry(.036*k,.112*k,.040*k,.015,.009),M.body,[0,0,.009],[1,1,1],[0,-.42,0],'trail');
      if(design>=2)this._clubNamedPart(`LOFT_${type.toUpperCase()}_FACE_FRAME`,new THREE.TorusGeometry(.042*k,.0035,6,26),M.body,[-.008,0,.008],[1,1,.90],[0,Math.PI/2,0],'face-frame');
      if(design>=3)this._clubNamedPart(`LOFT_${type.toUpperCase()}_CROWN_CHANNEL`,new THREE.BoxGeometry(.060*k,.007,.005),M.face,[.054*k,0,.061],[1,1,1],[0,0,.02],'crown-channel');
      if(design>=4)this._clubNamedPart(`LOFT_${type.toUpperCase()}_REAR_WEIGHT`,new THREE.CylinderGeometry(.009,.009,.008,18),M.dark,[.108*k,0,.026],[1,1,1],[Math.PI/2,0,0],'rear-weight');
      this._clubSignal(M,[.104*k,0,.043]);
      this._clubBridge(`LOFT_${type.toUpperCase()}_HOSEL`,[.012,-.041*k,.041],[0,-.004,.014],.0105,M.body);
    }else if(type==='putter'){
      if(design<=2){
        this._clubNamedPart('LOFT_PUTTER_BLADE',this._roundedPlanGeometry(.002,.056,.078,.026,.009),M.body,[0,0,-.003],[1,1,1],[0,-.36,0],'blade');
        this._clubNamedPart('LOFT_PUTTER_FACE',new THREE.BoxGeometry(.006,.148,.024),M.face,[-.004,0,-.010],[1,1,1],[0,0,0],'face');
        this._clubNamedPart('LOFT_PUTTER_TOPLINE',new THREE.BoxGeometry(.044,.006,.004),M.accent,[.022,0,.016],[1,1,1],[0,-.36,0],'alignment');
        if(design===2)this._clubNamedPart('LOFT_PUTTER_BACK_CAVITY',new THREE.BoxGeometry(.008,.112,.012),M.dark,[.052,0,.013],[1,1,1],[0,0,0],'cavity');
      }else if(design===3){
        this._clubNamedPart('LOFT_PUTTER_TOUR_BLADE',this._roundedPlanGeometry(.002,.064,.082,.024,.010),M.body,[0,0,-.003],[1,1,1],[0,-.36,0],'blade');
        this._clubNamedPart('LOFT_PUTTER_FACE',new THREE.BoxGeometry(.006,.155,.023),M.face,[-.004,0,-.010],[1,1,1],[0,0,0],'face');
        this._clubNamedPart('LOFT_PUTTER_CAVITY',new THREE.BoxGeometry(.010,.116,.011),M.dark,[.056,0,.014],[1,1,1],[0,0,0],'cavity');
        this._clubNamedPart('LOFT_PUTTER_SIGHTLINE',new THREE.BoxGeometry(.050,.005,.004),M.face,[.029,0,.017],[1,1,1],[0,-.36,0],'alignment');
      }else{
        this._clubNamedPart('LOFT_PUTTER_FACE_BRIDGE',this._roundedPlanGeometry(.002,.029,.086,.027,.009),M.body,[0,0,-.003],[1,1,1],[0,-.36,0],'face-bridge');
        this._clubNamedPart('LOFT_PUTTER_HEEL_WING',this._wingPlanGeometry(-1,.026,.094,.040),M.body,[0,0,-.003],[1,1,1],[0,-.36,0],'wing');
        this._clubNamedPart('LOFT_PUTTER_TOE_WING',this._wingPlanGeometry(1,.026,.094,.040),M.body,[0,0,-.003],[1,1,1],[0,-.36,0],'wing');
        this._clubNamedPart('LOFT_PUTTER_FACE',new THREE.BoxGeometry(.006,.162,.024),M.face,[-.004,0,-.010],[1,1,1],[0,0,0],'face');
        this._clubNamedPart('LOFT_PUTTER_REAR_BRIDGE',new THREE.BoxGeometry(.018,.112,.018),M.dark,[.088,0,.027],[1,1,1],[0,0,0],'rear-bridge');
        // The premium mallet keeps a dark structural chassis but carries a
        // continuous, honest-metal crown line and two machined wing rails.
        // These are geometry, not rarity paint: from the default putting
        // camera they make the low head readable without inventing vertical
        // mass or obscuring the ball.
        this._clubNamedPart('LOFT_PUTTER_FACE_CROWN',new THREE.BoxGeometry(.030,.168,.0045),M.face,[.011,0,.020],[1,1,1],[0,-.36,0],'crown-rail');
        this._clubNamedPart('LOFT_PUTTER_ALIGNMENT_RAIL',new THREE.BoxGeometry(.074,.011,.0055),M.face,[.054,0,.028],[1,1,1],[0,-.36,0],'alignment');
        if(design>=5){
          this._clubNamedPart('LOFT_PUTTER_HEEL_INLAY',this._roundedPlanGeometry(.014,.084,.0038,.013,.003),M.face,[0,-.063,-.002],[1,1,1],[0,-.36,0],'wing-inlay');
          this._clubNamedPart('LOFT_PUTTER_TOE_INLAY',this._roundedPlanGeometry(.014,.084,.0038,.013,.003),M.face,[0,.063,-.002],[1,1,1],[0,-.36,0],'wing-inlay');
        }
      }
      this._clubGrooves('LOFT_PUTTER_FACE_GROOVES',.126,-.017,3,.006,-.007,M.dark);
      this._clubSignal(M,[design>=4?.087:.045,0,design>=4?.045:.022]);
      this._clubBridge('LOFT_PUTTER_SLANT_NECK',[.018,-.062,-.001],[0,-.004,.014],.009,M.body);
    }else{
      const wedge=type==='wedge',nine=id==='iron9';
      const width=(wedge?.120:nine?.111:.106)*gradeBulk;
      const height=wedge?.090:nine?.085:.082;
      const highToe=wedge?.11:nine?.045:0;
      this._clubNamedPart(wedge?'LOFT_WEDGE_FORGED_BODY':'LOFT_IRON_FORGED_BODY',this._ironPlateGeometry(width,height,.022*gradeBulk,highToe,.0048),M.body,[.014,0,.007],[1,1,1],[0,0,0],'forged-body');
      this._clubNamedPart(wedge?'LOFT_WEDGE_FACE':'LOFT_IRON_FACE',this._ironPlateGeometry(width*.96,height*.94,.004,highToe,.0024),M.face,[-.002,0,.007],[1,1,1],[0,0,0],'face');
      this._clubNamedPart(wedge?'LOFT_WEDGE_RELIEF_SOLE':'LOFT_IRON_SOLE',new THREE.CapsuleGeometry(.0075,width*.72,4,16),M.dark,[.018,0,-.032],[1,1,wedge?1.45:1],[0,0,0],'sole');
      this._clubGrooves(wedge?'LOFT_WEDGE_FACE_GROOVES':'LOFT_IRON_FACE_GROOVES',width*.70,-.021,6,.009,-.005,M.dark);
      if(design>=2)this._clubNamedPart(wedge?'LOFT_WEDGE_BACK_CHANNEL':'LOFT_IRON_CAVITY',new THREE.BoxGeometry(.008,width*.58,height*.40),M.dark,[.030,0,.007],[1,1,1],[0,0,0],'cavity');
      if(design>=3)this._clubNamedPart(wedge?'LOFT_WEDGE_TOP_RAIL':'LOFT_IRON_TOPLINE',new THREE.CapsuleGeometry(.005,width*.56,4,14),M.face,[.023,0,.043],[1,1,.68],[0,0,0],'topline');
      if(design>=4)this._clubNamedPart(wedge?'LOFT_WEDGE_CAVITY_BRIDGE':'LOFT_IRON_CAVITY_BRIDGE',new THREE.BoxGeometry(.008,.012,height*.52),M.face,[.038,0,.008],[1,1,1],[0,0,0],'cavity-bridge');
      this._clubSignal(M,[.041,width*.28,-.014]);
      // The shaft belongs at the heel, outside the scoring face. Keep the face
      // center and analytic strike landmark fixed; only the neck changes.
      const ferruleAnchor=[0,-width*.48,.075];
      this._clubBridge(wedge?'LOFT_WEDGE_HOSEL':'LOFT_IRON_HOSEL',[.014,-width*.34,.017],ferruleAnchor,.0095,M.body);
      this.clubHead.userData.ferruleAnchor=ferruleAnchor;
      this.clubHead.userData.ferruleLength=.035;
      this.clubHead.userData.neckSystem='LOFT_HEEL_ATTACHMENT_V1';
    }

    const contactOffset=IN_WORLD_CLUB_SPEC.addressContact.familyOffset[type]||0;
    const contactLift=contactOffset*IN_WORLD_CLUB_SPEC.addressContact.tangentLiftRatio;
    for(const part of this.clubHead.children){
      if(part.userData.clubRole==='hosel'&&part.userData.bridgeStart&&part.userData.bridgeEnd){
        const bodyEnd=new THREE.Vector3(...part.userData.bridgeStart).add(new THREE.Vector3(contactOffset,0,contactLift));
        const shaftEnd=new THREE.Vector3(...part.userData.bridgeEnd);
        const bridgeLength=bodyEnd.distanceTo(shaftEnd);
        part.position.copy(bodyEnd).add(shaftEnd).multiplyScalar(.5);
        part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),shaftEnd.clone().sub(bodyEnd).normalize());
        part.scale.y=bridgeLength/part.userData.bridgeLength;
        part.userData.contactBodyEnd=bodyEnd.toArray();part.userData.contactShaftEnd=shaftEnd.toArray();
      }else{
        part.position.x+=contactOffset;part.position.z+=contactLift;
      }
    }

    this.clubHead.name='LOFT_OBJECT_HEAD';
    this.clubHead.userData.system=IN_WORLD_CLUB_SPEC.system;
    this.clubHead.userData.family=type;
    this.clubHead.userData.tier=M.tier.id;
    this.clubHead.userData.designLevel=design;
    this.clubHead.userData.coordinateContract=IN_WORLD_CLUB_SPEC.coordinateContract;
    this.clubHead.userData.signalCount=this.clubHead.children.filter(part=>part.userData.signal===true).length;
    this.clubHead.userData.contactOffset=contactOffset;
    this.clubHead.userData.contactLift=contactLift;
    const settleRange={driver:[.032,.006],wood:[.038,.022],hybrid:[.044,.029],iron:[.017,.011],wedge:[.0264,.021],putter:[.020,.020]}[type]||[.017,.011];
    this.clubVisualSettle=lerp(settleRange[0],settleRange[1],(design-1)/4);
    for(const part of this.clubHead.children)part.position.z-=this.clubVisualSettle;
    this.clubHead.userData.visualSettle=this.clubVisualSettle;
    if(this.clubHead.userData.ferruleAnchor)this.clubHead.userData.ferruleAnchor[2]-=this.clubVisualSettle;
  }
}

// Cached buffers/materials are factory-owned. Callers own cloned transform
// nodes only and must not dispose their shared geometries or materials.
export function createClubHead(club='iron',level=1){
  const data=typeof club==='string'?{id:club,head:club,name:club}:club;
  const type=data?.head||'iron',id=data?.id||type,tier=equipmentTier(level);
  const key=id+':'+type+':'+tier.id;
  let cached=headCache.get(key);
  if(!cached){
    const builder=new ClubHeadBuilder();builder.setClub(data,level);
    cached={
      head:builder.clubHead,
      materials:materialCache.get(tier.id),
      profile:Object.freeze({length:builder.clubLength,ballX:builder.addressBallLocal.x,headX:builder.clubAddressX,ballY:builder.addressBallLocal.y,headY:builder.clubAddressHeight}),
      visualSettle:builder.clubVisualSettle
    };
    headCache.set(key,cached);
  }
  return {...cached,head:cached.head.clone(true)};
}

export function createClubShaftParts(level=1,family='iron'){
  // Resolves the same shared material family as the head without constructing
  // an unnecessary head or a golfer in the inspection scene.
  const builder=new ClubHeadBuilder(),M=builder._clubMaterials(level);
  const part=(name,r,taper,material)=>{
    const key=name+':'+r+':'+taper;
    if(!segmentGeometryCache.has(key))segmentGeometryCache.set(key,new THREE.CylinderGeometry(r*taper,r,1,12));
    const mesh=new THREE.Mesh(segmentGeometryCache.get(key),material);
    mesh.name='LOFT_CLUB_'+name.toUpperCase();mesh.castShadow=true;
    mesh.userData.baseRadius=r;return mesh;
  };
  const heel=family==='iron'||family==='wedge';
  return {grip:part('grip',.023,.96,M.dark),shaft:part('shaft',heel?.00625:.0105,.98,M.face),ferrule:part('ferrule',heel?.008:.016,.92,M.dark)};
}

// The same rigid attachment solver is used by the golfer and the inspector.
// Head transform and grip endpoint are inputs, never moved by this construction.
export function clubFerruleStations(head,gripEnd){
  if(!head.userData.ferruleAnchor)return null;
  const end=new THREE.Vector3(...head.userData.ferruleAnchor).applyQuaternion(head.quaternion).add(head.position);
  const start=end.clone().addScaledVector(gripEnd.clone().sub(end).normalize(),head.userData.ferruleLength);
  return {start,end};
}

// Instanced groove transforms are instance-owned GPU buffers. Releasing their
// mesh does not dispose the cached geometry or the material shared with play.
export function releaseClubInstance(group){
  group.traverse(node=>{if(node.isInstancedMesh)node.dispose();});
  group.removeFromParent();
}

function between(mesh,a,b){
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.scale.set(1,Math.max(.001,a.distanceTo(b))*1.085,1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
}

export function createClubInspectionModel(club,level=1){
  const {head,materials,profile,visualSettle}=createClubHead(club,level);
  const parts=createClubShaftParts(level,head.userData.family),group=new THREE.Group();
  group.name='LOFT_CLUB_INSPECTION_ASSEMBLY';
  group.add(head,parts.grip,parts.shaft,parts.ferrule);
  // Canonical head axes: X face/back, Y heel/toe, Z sole/grip.
  // The golfer rotates local +Z opposite its grip-to-head direction. Inverse
  // that exact frame here so the complete object has identical shaft stations.
  const point=z=>new THREE.Vector3(0,0,z);
  const gripButt=point(profile.length+.060),gripEnd=point(profile.length-.155);
  const stations=clubFerruleStations(head,gripEnd);
  const ferruleEnd=stations?.end||point(.014-visualSettle),ferruleStart=stations?.start||point(.075-visualSettle);
  between(parts.grip,gripButt,gripEnd);
  between(parts.shaft,gripEnd,ferruleStart);
  between(parts.ferrule,ferruleStart,ferruleEnd);
  parts.grip.userData.visualButt=gripButt.toArray();parts.grip.userData.visualEnd=gripEnd.toArray();
  parts.grip.userData.contactSeparation=.055;
  group.userData={
    system:'LOFT_SHARED_CLUB_ASSEMBLY_V1',clubId:typeof club==='string'?club:club?.id,
    family:head.userData.family,tier:materials.tier.id,clubLength:profile.length,
    coordinateContract:IN_WORLD_CLUB_SPEC.coordinateContract,sharedFactoryOwnedResources:true
  };
  group.updateMatrixWorld(true);
  return group;
}
