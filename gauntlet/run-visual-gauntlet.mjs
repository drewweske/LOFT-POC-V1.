import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {GOLFER_COHESION_SPEC,GOLFER_GROUND_CLEARANCE,IN_WORLD_CLUB_SPEC,KINETIC_CHAIN_SPEC,LoftGolferRig} from '../prototype1/characterRig.js';
import {CAMERA_COMPOSITION_SPEC,LoftCamera,CAMERA_MODE,cameraCompositionProfile} from '../prototype1/camera.js';
import {CLUBS,EQUIPMENT_TIERS,LEVELS,equipmentTier,clubPresentationProfile} from '../prototype1/equipment.js';
import {COLORS,COASTAL_AIR_SPEC,COASTAL_ECOLOGY_SPEC,COASTAL_TURF_LIGHT_SPEC,RIDGE_HOUSE_SPEC,buildCoastalAir,buildCoastalCloudBlueprint,sampleCoastalSkyColor,terrainHeight,validateCoastalAir,validateCoastalEcology,validateCoastalTurfLight,validateLighthouseHeadland,validateRidgeHouse,validateTerrain} from '../prototype1/worldV2.js';
import {LOFT_BALL_SPEC,buildDimpleDirections,buildLoftBallGeometry} from '../prototype1/ballVisual.js';
import {clubArtSvg,clubArtGeometrySignature,clubArtPrimitiveCount} from '../prototype1/clubVisual.js';
import {ROUND_HOLES,ROWAN_SCORES} from '../prototype1/round.js';
import {TARGET_STEWARD_SPEC,buildTargetStewardCopy,solveTargetStewardPlacement} from '../prototype1/targetSteward.js';
import {ROUND_CHRONICLE_SPEC,buildRoundChronicleModel} from '../prototype1/roundChronicle.js';

const checks=[];
const check=(name,fn)=>{
  fn();checks.push(name);console.log(`PASS  ${name}`);
};
const near=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
const finiteVector=v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);

check('repository boundary is LOFT-POC-V1 with no unrelated services',()=>{
  const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim().replaceAll('\\','/');
  const remote=execFileSync('git',['config','--get','remote.origin.url'],{encoding:'utf8'}).trim();
  assert.ok(root.endsWith('/LOFT-POC-V1'));
  assert.match(remote,/drewweske\/LOFT-POC-V1\.\.git$/);
  const source=['prototype1/game.js','prototype1/index.html','prototype1/styles.css','prototype1/equipment.js','prototype1/clubVisual.js','prototype1/characterRig.js']
    .map(file=>readFileSync(file,'utf8')).join('\n');
  assert.doesNotMatch(source,/supabase|aezrio/i);
});

check('trusted club flight and carry numbers remain unchanged',()=>{
  const expected={
    driver:[250,12,82.8,2600,24],wood3:[225,14,69.8,3300,18],hybrid5:[195,18,56.7,4200,12],
    iron7:[160,21,45.7,6200,7],iron9:[135,24,40.8,7600,5],pw:[115,29,36.8,9000,3],
    sw:[90,34,31.5,10000,2],putter:[25,0,5.4,0,25]
  };
  for(const club of CLUBS){
    assert.deepEqual([club.carry,club.launch,club.ballSpeed,club.spin,club.roll],expected[club.id]);
    assert.ok(club.model&&club.loft&&club.feel);
  }
});

check('five collectible equipment grades resolve deterministically',()=>{
  assert.deepEqual(Object.keys(EQUIPMENT_TIERS).map(Number),[1,10,25,50,75]);
  assert.equal(equipmentTier(1).id,'foundation');
  assert.equal(equipmentTier(24).id,'field');
  assert.equal(equipmentTier(49).id,'tour');
  assert.equal(equipmentTier(74).id,'signature');
  assert.equal(equipmentTier(75).id,'icon');
  assert.equal(LEVELS[75].form,LEVELS[50].form);
  assert.deepEqual(Object.values(EQUIPMENT_TIERS).map(tier=>tier.designLevel),[1,2,3,4,5]);
  assert.equal(new Set(Object.values(EQUIPMENT_TIERS).map(tier=>tier.construction)).size,5);
});

check('club presentation profiles are bounded, deterministic and physics-neutral',()=>{
  const snapshot=JSON.stringify(CLUBS);
  for(const club of CLUBS){
    const first=clubPresentationProfile(club);
    const second=clubPresentationProfile(club.id);
    assert.deepEqual(first,second);
    assert.deepEqual(Object.keys(first).sort(),['control','forgiveness','power','spin']);
    for(const value of Object.values(first))assert.ok(Number.isInteger(value)&&value>=0&&value<=100);
  }
  assert.equal(JSON.stringify(CLUBS),snapshot);
});

check('every club earns physical construction from Foundation to Icon',()=>{
  for(const club of CLUBS){
    const foundation=clubArtSvg(club,{tier:equipmentTier(1),hero:true,instance:'foundation'});
    const icon=clubArtSvg(club,{tier:equipmentTier(75),hero:true,instance:'icon'});
    assert.notEqual(clubArtGeometrySignature(foundation),clubArtGeometrySignature(icon),`${club.id} changes geometry`);
    assert.ok(clubArtPrimitiveCount(icon)>=clubArtPrimitiveCount(foundation)+2,`${club.id} gains engineered detail`);
    assert.doesNotMatch(foundation,/class="club-signal"/,`${club.id} Foundation uses no orange signal hardware`);
    assert.equal((icon.match(/class="club-signal"/g)||[]).length,1,`${club.id} Icon uses one signal component`);
  }
});

check('six club families retain distinct zero-brand silhouettes',()=>{
  const ids=['driver','wood3','hybrid5','iron7','pw','putter'];
  const signatures=ids.map(id=>{
    const club=CLUBS.find(item=>item.id===id);
    return clubArtGeometrySignature(clubArtSvg(club,{tier:equipmentTier(25),hero:true,instance:'family-'+id}));
  });
  assert.equal(new Set(signatures).size,ids.length);
});

check('hero and rail drawings scope every SVG resource id',()=>{
  const club=CLUBS.find(item=>item.id==='iron7'),tier=equipmentTier(75);
  const markup=clubArtSvg(club,{tier,hero:true,instance:'hero'})+clubArtSvg(club,{tier,hero:false,instance:'rail'});
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,ref] of markup.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(ref));
});

const rig=new LoftGolferRig(COLORS);

check('every club is a multi-part engineered object at base and icon grades',()=>{
  const minimumParts={driver:6,wood:5,hybrid:5,iron:5,wedge:5,putter:4};
  for(const level of [1,75]){
    for(const club of CLUBS){
      rig.setClub(club,level);
      assert.ok(rig.clubHead.children.length>=minimumParts[club.head],`${club.id} has a complete head assembly`);
      assert.equal(rig.clubId,club.id);
      assert.equal(rig.clubLevel,level);
      for(const part of rig.clubHead.children){
        assert.ok(part.geometry?.attributes?.position?.count>0);
        assert.equal(part.castShadow,true);
      }
    }
  }
});

check('every authored club sole clears turf at address and impact',()=>{
  for(const level of [1,75]){
    for(const club of CLUBS){
      rig.setClub(club,level);
      for(const phase of [0,.60]){
        rig.setPose(phase,LEVELS[level]);rig.group.updateMatrixWorld(true);
        const bounds=new THREE.Box3().setFromObject(rig.clubHead);
        assert.ok(bounds.min.y>=-.004,`${club.id} at level ${level} clears turf at ${phase}`);
      }
    }
  }
});

check('low and legendary putters have materially different construction',()=>{
  const putter=CLUBS.find(club=>club.id==='putter');
  rig.setClub(putter,1);
  const foundation=rig.clubHead.children.map(part=>part.geometry.type).join('|');
  const foundationCount=rig.clubHead.children.length;
  rig.setClub(putter,75);
  const icon=rig.clubHead.children.map(part=>part.geometry.type).join('|');
  assert.notEqual(rig.clubHead.children.length,foundationCount);
  assert.notEqual(icon,foundation);
});

check('playable club craft is collectible, grounded and ball-clear across every grade',()=>{
  const levels=[1,10,25,50,75];
  const protectedProfile={
    driver:[1,.63,.60],wood:[.975,.58,.55],hybrid:[.95,.52,.49],
    iron:[.93,.46,.43],wedge:[.90,.40,.37],putter:[.86,.46,.43]
  };
  const familySignatures=new Map();
  for(const club of CLUBS){
    const tierSignatures=[];
    for(const level of levels){
      const tier=equipmentTier(level);
      rig.setClub(club,level);
      assert.equal(rig.clubHead.userData.system,IN_WORLD_CLUB_SPEC.system);
      assert.equal(rig.clubHead.userData.family,club.head);
      assert.equal(rig.clubHead.userData.tier,tier.id);
      assert.equal(rig.clubHead.userData.designLevel,tier.designLevel);
      assert.deepEqual(rig.clubHead.userData.coordinateContract,IN_WORLD_CLUB_SPEC.coordinateContract);
      assert.equal(rig.clubHead.userData.contactOffset,IN_WORLD_CLUB_SPEC.addressContact.familyOffset[club.head]);
      assert.ok(rig.clubHead.children.length<=IN_WORLD_CLUB_SPEC.maxHeadParts,`${club.id} remains a bounded draw assembly`);

      const signals=rig.clubHead.children.filter(part=>part.userData.signal===true);
      assert.equal(signals.length,tier.signal?IN_WORLD_CLUB_SPEC.signalPartsPerPremiumHead:0,`${club.id} ${tier.id} uses restrained signal hardware`);
      assert.equal(rig.clubHead.userData.signalCount,signals.length);

      let triangles=0;
      const partSignature=[];
      for(const part of rig.clubHead.children){
        const position=part.geometry?.attributes?.position;
        assert.ok(position?.count>0,`${club.id} ${part.name} owns geometry`);
        for(let i=0;i<position.count;i++){
          assert.ok(Number.isFinite(position.getX(i))&&Number.isFinite(position.getY(i))&&Number.isFinite(position.getZ(i)),`${part.name} has finite construction`);
        }
        const baseTriangles=part.geometry.index?part.geometry.index.count/3:position.count/3;
        triangles+=baseTriangles*(part.isInstancedMesh?part.count:1);
        part.geometry.computeBoundingBox();
        const size=part.geometry.boundingBox.getSize(new THREE.Vector3());
        partSignature.push(`${part.userData.clubRole}:${part.geometry.type}:${position.count}:${size.toArray().map(value=>value.toFixed(4)).join(',')}`);
      }
      assert.ok(triangles<=IN_WORLD_CLUB_SPEC.maxHeadTriangles,`${club.id} stays inside the mobile triangle budget`);
      tierSignatures.push(partSignature.sort().join('|'));

      const [length,ballX,headX]=protectedProfile[club.head];
      assert.ok(near(rig.clubLength,length));
      assert.ok(near(rig.addressBallLocal.x,ballX));
      assert.ok(near(rig.addressBallLocal.y,IN_WORLD_CLUB_SPEC.addressContact.ballRadius));
      assert.ok(near(rig.clubAddressX,headX));
      assert.ok(near(rig.clubAddressHeight,.045));

      rig.setPose(0,LEVELS[level]);rig.group.updateMatrixWorld(true);
      const ballCenter=rig.addressBallLocal.clone();
      const faceDistance=Math.min(...rig.clubHead.children
        .filter(part=>part.userData.clubRole==='face')
        .map(part=>new THREE.Box3().setFromObject(part).distanceToPoint(ballCenter)));
      assert.ok(faceDistance>=IN_WORLD_CLUB_SPEC.addressContact.ballRadius+IN_WORLD_CLUB_SPEC.addressContact.minimumFaceGap-1e-5,`${club.id} ${tier.id} does not intersect the addressed ball`);
      assert.ok(faceDistance<=.034,`${club.id} ${tier.id} still reads as addressed to the ball`);
      const addressBounds=new THREE.Box3().setFromObject(rig.clubHead);
      assert.equal(addressBounds.containsPoint(ballCenter),false,`${club.id} ${tier.id} keeps the ball outside its assembly`);
      assert.ok(addressBounds.min.y>=-.004&&addressBounds.min.y<=.014,`${club.id} ${tier.id} sole is grounded at address`);

      rig.setPose(.60,LEVELS[level]);rig.group.updateMatrixWorld(true);
      const impactBounds=new THREE.Box3().setFromObject(rig.clubHead);
      assert.ok(impactBounds.min.y>=-.004&&impactBounds.min.y<=.014,`${club.id} ${tier.id} sole agrees with impact turf`);

      if(level===75){
        const size=addressBounds.getSize(new THREE.Vector3());
        familySignatures.set(club.head,`${size.toArray().map(value=>value.toFixed(3)).join(':')}|${partSignature.map(value=>value.split(':')[0]).sort().join(',')}`);
      }
    }
    assert.notEqual(tierSignatures[0],tierSignatures.at(-1),`${club.id} gains physical product design rather than a recolor`);
  }
  assert.equal(familySignatures.size,6);
  assert.equal(new Set(familySignatures.values()).size,6,'six playable club families pass the zero-brand silhouette test');
});

check('swing anatomy and club length stay fixed through 201 samples',()=>{
  rig.setClub(CLUBS.find(club=>club.id==='driver'),75);
  const level=LEVELS[1];
  const lengths={thighL:[],thighR:[],calfL:[],calfR:[],upperL:[],upperR:[],foreL:[],foreR:[],club:[]};
  for(let i=0;i<=200;i++){
    rig.setPose(i/200,level);
    for(const key of Object.keys(lengths).filter(key=>key!=='club'))lengths[key].push(rig[key].scale.y/1.085);
    const hands=rig.handL.position.clone().lerp(rig.handR.position,.5);
    lengths.club.push(hands.distanceTo(rig.clubHead.position));
    assert.ok(finiteVector(rig.clubHead.position));
    assert.ok(finiteVector(rig.headRoot.position));
    for(const foot of rig.shoeContactPoints())assert.ok(finiteVector(foot));
  }
  const expected={thighL:rig.legUpper,thighR:rig.legUpper,calfL:rig.legLower,calfR:rig.legLower,
    upperL:rig.armUpper*.73,upperR:rig.armUpper*.73,foreL:rig.armLower,foreR:rig.armLower,club:rig.clubLength};
  for(const [key,values] of Object.entries(lengths)){
    const spread=Math.max(...values)-Math.min(...values);
    assert.ok(spread<.00002,`${key} does not telescope`);
    assert.ok(near(values[0],expected[key],.006),`${key} keeps authored length`);
  }
});

check('putting motion stays anatomically rigid and on the authored address',()=>{
  rig.setClub(CLUBS.find(club=>club.id==='putter'),50);
  for(let i=0;i<=120;i++){
    rig.setPose(i/120,LEVELS[50]);
    const hands=rig.handL.position.clone().lerp(rig.handR.position,.5);
    assert.ok(near(hands.distanceTo(rig.clubHead.position),rig.clubLength,.00002));
  }
  assert.ok(near(rig.addressBallLocal.x,.46));
});

check('head and garment details inherit the character transforms',()=>{
  assert.equal(rig.head.parent,rig.headRoot);
  assert.equal(rig.cap.parent,rig.headRoot);
  assert.equal(rig.eyeL.parent,rig.headRoot);
  assert.equal(rig.collar.parent,rig.torso);
  assert.equal(rig.placket.parent,rig.torso);
});

check('golfer limbs use sculpted anatomical shells instead of cylinder mannequins',()=>{
  const expected={thighL:'thigh',thighR:'thigh',calfL:'calf',calfR:'calf',
    sleeveL:'sleeve',sleeveR:'sleeve',upperL:'upper-arm',upperR:'upper-arm',
    foreL:'forearm',foreR:'forearm'};
  for(const [key,kind] of Object.entries(expected)){
    assert.equal(rig[key].userData.loftShell,kind,`${key} owns the ${kind} shell`);
    assert.equal(rig[key].geometry.type,'BufferGeometry',`${key} is not a primitive cylinder`);
    assert.ok(rig[key].userData.profileRings>=6,`${key} has authored mass and taper`);
  }
  assert.ok(rig.kneeL.geometry.parameters.radius<.060,'knee bridge stays buried in leg shells');
  assert.ok(rig.elbowL.geometry.parameters.radius<.045,'elbow bridge stays buried in arm shells');
  assert.equal(rig.handLVisual.userData.loftShell,'glove-hand');
  assert.equal(rig.handRVisual.userData.loftShell,'bare-hand');
  assert.equal(rig.shoeL.userData.loftShell,'shoe-upper');
  assert.equal(rig.cap.material,rig.stone,'cap uses restrained scorecard-stone material');
  assert.equal(rig.mouth.parent,rig.headRoot,'restrained facial features inherit the head');
});

check('golfer face, focus and grip form one coherent LOFT system',()=>{
  assert.equal(GOLFER_COHESION_SPEC.system,'LOFT_GOLFER_FACE_GRIP_V3');
  assert.equal(rig.jaw,rig.head,'jaw belongs to the unified craniofacial shell');
  assert.equal(rig.noseBridge,rig.nose,'nose is one bridge-to-tip wedge');
  assert.equal(rig.head.geometry.userData.closedShell,true);
  assert.equal(rig.head.userData.profileSections,GOLFER_COHESION_SPEC.headShellSections);
  const headSize=new THREE.Vector3();rig.head.geometry.boundingBox.getSize(headSize);
  assert.ok(headSize.x>=.215&&headSize.x<=.230,`head depth ${headSize.x.toFixed(3)}m is human and stylized`);
  assert.ok(headSize.y>=.270&&headSize.y<=.280,`head height ${headSize.y.toFixed(3)}m is bounded`);
  assert.ok(headSize.z>=.210&&headSize.z<=.225,`head width ${headSize.z.toFixed(3)}m is bounded`);
  assert.ok(rig.eyeL.scale.z/rig.eyeL.scale.y>=3.2&&rig.eyeL.scale.z/rig.eyeL.scale.y<=4.2,'eyes stay restrained almonds');
  assert.ok(rig.capSignal.position.x>0,'single cap signal lives on the front panel');
  assert.equal(rig.headRoot.children.filter(child=>child.material===rig.orange).length,1,'head uses exactly one orange signal');
  assert.ok(rig.headRoot.children.filter(child=>child.isMesh).length<=19,'head construction stays silhouette-first');
  assert.equal(rig.handLVisual.parent,rig.handL);assert.equal(rig.handRVisual.parent,rig.handR);
  assert.equal(rig.gripWrapL.parent,rig.group);assert.equal(rig.gripWrapR.parent,rig.group);

  for(const clubId of ['iron7','putter'])for(const level of [1,50,75]){
    rig.setClub(CLUBS.find(club=>club.id===clubId),level);
    for(let i=0;i<=100;i++){
      const t=i/100,profile=LEVELS[level],authored=rig._poseAt(t,profile);
      rig.setPose(t,profile);
      assert.ok(rig.headRoot.position.distanceTo(rig._v(authored.head))<1e-7,'gaze never moves the authored head landmark');
      assert.ok(Number.isFinite(rig.headRoot.userData.gazeRadians));
      assert.ok(rig.headRoot.userData.gazeRadians>=GOLFER_COHESION_SPEC.puttingGazeRadians-.0001);
      assert.ok(rig.headRoot.userData.gazeRadians<=GOLFER_COHESION_SPEC.finishGazeRadians+.0001);
      const [lead,trail]=rig._gripContactsLocal,[leadSurface,trailSurface]=rig._gripSurfaceContactsLocal;
      assert.ok(near(lead.distanceTo(trail),GOLFER_COHESION_SPEC.gripContactSeparation,.000002));
      assert.ok(rig.handL.position.distanceTo(rig._handWristLocal[0])<1e-7,'lead wrist landmark is unchanged');
      assert.ok(rig.handR.position.distanceTo(rig._handWristLocal[1])<1e-7,'trail wrist landmark is unchanged');
      const leadReach=rig.handL.position.distanceTo(leadSurface),trailReach=rig.handR.position.distanceTo(trailSurface);
      assert.ok(leadReach<=GOLFER_COHESION_SPEC.maxHandToContact+.0001,`lead hand reach ${leadReach.toFixed(4)}m stays bounded`);
      assert.ok(trailReach<=GOLFER_COHESION_SPEC.maxHandToContact+.0001,`trail hand reach ${trailReach.toFixed(4)}m stays bounded`);
      for(const hand of [rig.handL,rig.handR]){
        assert.ok(hand.userData.visualPalmLength>=GOLFER_COHESION_SPEC.palmLengthMin-.0001);
        assert.ok(hand.userData.visualPalmLength<=GOLFER_COHESION_SPEC.palmLengthMax+.0001);
      }
      const gripButt=new THREE.Vector3().fromArray(rig.grip.userData.visualButt);
      const gripEnd=new THREE.Vector3().fromArray(rig.grip.userData.visualEnd);
      assert.ok(near(gripButt.distanceTo(gripEnd),.155+GOLFER_COHESION_SPEC.gripButtExtension,.000002));
    }
  }
});

check('full swing is one grounded pelvis-led kinetic chain',()=>{
  assert.equal(KINETIC_CHAIN_SPEC.system,'LOFT_KINETIC_CHAIN_V1');
  assert.deepEqual(KINETIC_CHAIN_SPEC.times,[0,.16,.38,.50,.60,.77,1]);
  assert.equal(KINETIC_CHAIN_SPEC.protectedTimes.includes(.60),true);
  assert.equal(KINETIC_CHAIN_SPEC.maxAddedDrawables,0);

  rig.setClub(CLUBS.find(club=>club.id==='iron7'),75);
  const elite=LEVELS[75];
  const protectedCheckpoints=new Map([
    [0,{club:[.43,.045,0],handL:[.12,.94,-.038],handR:[.13,.935,.038]}],
    [.38,{club:[-.8007909090909091,1.94,.9116090909090909],handL:[-.3604636363636364,1.68,.3608454545454545],handR:[-.41046363636363636,1.66,.4208454545454545]}],
    [.60,{club:[.4273109090909091,.045,-.014529090909090908],handL:[.12842363636363638,.955,-.04712545454545455],handR:[.1384236363636364,.945,.04287454545454546]}],
    [1,{club:[-.92,1.94,-.91],handL:[-.32,1.66,-.42],handR:[-.37,1.63,-.36]}]
  ]);
  for(const [t,expected] of protectedCheckpoints){
    const pose=rig._poseAt(t,elite);
    for(const key of ['club','handL','handR'])for(let axis=0;axis<3;axis++){
      assert.ok(near(pose[key][axis],expected[key][axis],2e-8),`${key} checkpoint ${t} axis ${axis} is unchanged`);
    }
  }

  // Central differences on each side of a seam must agree. The former easing
  // reset produced jumps above 18 m / normalized phase at delivery and impact.
  const h=.0001,seams=KINETIC_CHAIN_SPEC.times.slice(1,-1);
  for(const levelNumber of [1,50,75]){
    const profile=LEVELS[levelNumber];rig.setClub(CLUBS.find(club=>club.id==='iron7'),levelNumber);
    const V=(t,key)=>new THREE.Vector3(...rig._poseAt(t,profile)[key]);
    for(const key of ['club','handL','handR','head','pelvis'])for(const seam of seams){
      const centre=V(seam,key);
      const before=centre.clone().sub(V(seam-h,key)).multiplyScalar(1/h);
      const after=V(seam+h,key).sub(centre).multiplyScalar(1/h);
      assert.ok(before.distanceTo(after)<.055,`${key} velocity stays continuous at ${seam}`);
      if(key==='club'&&[.50,.60,.77].includes(seam)){
        assert.ok(Math.min(before.length(),after.length())>2.5,`club carries momentum through ${seam}`);
        assert.ok(Math.max(before.length(),after.length())/Math.min(before.length(),after.length())<1.03,`club speed does not lunge at ${seam}`);
      }
    }
  }

  rig.setClub(CLUBS.find(club=>club.id==='iron7'),50);
  const sequence=[
    {t:.38,hip:-22.9,shoulder:-51.5},
    {t:.50,hip:8,shoulder:-18},
    {t:.60,hip:34,shoulder:10},
    {t:.77,hip:56,shoulder:62},
    {t:1,hip:68,shoulder:91}
  ];
  for(const phase of sequence){
    const raw=rig._poseAt(phase.t,LEVELS[50]);rig.setPose(phase.t,LEVELS[50]);
    const frame=rig._kineticFrame;
    assert.ok(near(frame.pelvisYawDeg,phase.hip,.001));
    assert.ok(near(frame.shoulderYawDeg,phase.shoulder,.001));
    const rawHip=Math.hypot(raw.hipR[0]-raw.hipL[0],raw.hipR[2]-raw.hipL[2]);
    const framedHip=Math.hypot(frame.hipR[0]-frame.hipL[0],frame.hipR[2]-frame.hipL[2]);
    const rawShoulder=Math.hypot(raw.shoulderR[0]-raw.shoulderL[0],raw.shoulderR[2]-raw.shoulderL[2]);
    const framedShoulder=Math.hypot(frame.shoulderR[0]-frame.shoulderL[0],frame.shoulderR[2]-frame.shoulderL[2]);
    assert.ok(near(rawHip,framedHip,1e-9)&&near(rawShoulder,framedShoulder,1e-9),'unwind preserves body width');
  }
  assert.ok(sequence[1].hip-sequence[1].shoulder>=25,'pelvis leads delivery');
  assert.ok(sequence[2].hip-sequence[2].shoulder>=20,'pelvis remains ahead through impact');
  assert.ok(sequence[3].shoulder>sequence[3].hip,'shoulders overtake only after impact');
  assert.ok(sequence[4].shoulder-sequence[4].hip>=20,'finish releases toward the target');

  for(const t of [.61,.70,.77,.90,1]){
    rig.setPose(t,LEVELS[50]);
    assert.ok(rig._trailToeLocal&&rig._trailHeelLocal,'trail foot owns a measured pivot');
    assert.ok(Math.abs(rig._trailToeLocal.y-KINETIC_CHAIN_SPEC.trailToeGroundY)<=KINETIC_CHAIN_SPEC.trailToeTolerance,'trail toe remains planted');
  }
  const heelLift=rig._trailHeelLocal.y-rig._trailToeLocal.y;
  assert.ok(heelLift>=KINETIC_CHAIN_SPEC.finishHeelLift[0]&&heelLift<=KINETIC_CHAIN_SPEC.finishHeelLift[1],'finish rises through the heel around the toe');

  rig.setClub(CLUBS.find(club=>club.id==='putter'),50);rig.setPose(.82,LEVELS[50]);
  assert.equal(rig._kineticFrame.isolated,true,'putter retains its independent pendulum');
  assert.equal(rig._trailToeLocal,null,'putter never receives a full-swing foot pivot');
});

check('golfer apparel uses tailored body shells and layered footwear',()=>{
  assert.equal(rig.pelvis.userData.loftShell,'tailored-trouser-seat');
  assert.equal(rig.pelvis.userData.profileSections,6);
  assert.equal(rig.torso.userData.loftShell,'tailored-polo');
  assert.equal(rig.torso.userData.profileSections,9);
  assert.equal(rig.pelvis.geometry.type,'BufferGeometry');
  assert.equal(rig.torso.geometry.type,'BufferGeometry');
  assert.equal(rig.sleeveCuffL.parent,rig.sleeveL);
  assert.equal(rig.sleeveCuffR.parent,rig.sleeveR);
  assert.equal(rig.trouserCuffL.parent,rig.calfL);
  assert.equal(rig.trouserCuffR.parent,rig.calfR);
  assert.notEqual(rig.midsoleL.material,rig.soleL.material);
  assert.notEqual(rig.midsoleR.material,rig.soleR.material);
  assert.equal(rig.midsoleL.castShadow,false);
  assert.equal(rig.midsoleR.castShadow,false);
  assert.equal(rig.sleeveCuffL.castShadow,false);
  assert.equal(rig.trouserCuffL.castShadow,false);
  rig.setClub(CLUBS.find(club=>club.id==='iron7'),50);
  for(const phase of [0,.38,.60,1]){
    rig.setPose(phase,LEVELS[50]);
    rig.group.updateMatrixWorld(true);
    assert.ok(finiteVector(rig.midsoleL.position)&&finiteVector(rig.midsoleR.position));
    assert.ok(near(rig.shoeR.position.y-rig.midsoleR.position.y,.045));
    assert.ok(near(rig.midsoleR.position.y-rig.soleR.position.y,.013));
    assert.ok(near(rig.shoeR.rotation.z,rig.midsoleR.rotation.z));
    assert.ok(near(rig.midsoleR.rotation.z,rig.soleR.rotation.z));
    const soleLBounds=new THREE.Box3().setFromObject(rig.soleL);
    const soleRBounds=new THREE.Box3().setFromObject(rig.soleR);
    assert.ok(soleLBounds.min.y+GOLFER_GROUND_CLEARANCE>=-.0006,'lead outsole clears the grounded root plane');
    assert.ok(soleRBounds.min.y+GOLFER_GROUND_CLEARANCE>=-.0006,'trail outsole clears the grounded root plane');
  }
  const toe=new THREE.Vector3(0,-.1,0).applyMatrix4(rig.soleR.matrixWorld);
  const heel=new THREE.Vector3(0,.1,0).applyMatrix4(rig.soleR.matrixWorld);
  assert.ok(heel.y>toe.y+.03,'trail heel releases above the planted toe');
});

check('camera exposes close, fluid full-shot, putting and result envelopes',()=>{
  const camera=new THREE.PerspectiveCamera(40,16/9,.05,1000);
  const loftCamera=new LoftCamera(camera,{terrainHeight:()=>0});
  const ball=new THREE.Vector3(0,.03,0),pin=new THREE.Vector3(0,.03,-18);
  loftCamera.updateAim(1/60,{ball,pin,aimYaw:0,putting:false});
  loftCamera.aimZoom(10000);
  assert.equal(loftCamera.aimDistT,4.8);
  loftCamera.aimZoom(-10000);
  assert.equal(loftCamera.aimDistT,12);
  loftCamera.updateAim(1/60,{ball,pin,aimYaw:0,putting:true});
  loftCamera.aimZoom(10000);
  assert.equal(loftCamera.puttDistT,3);
  loftCamera.aimZoom(-10000);
  assert.equal(loftCamera.puttDistT,7.2);
  loftCamera.beginSwing(0);
  assert.equal(loftCamera.mode,CAMERA_MODE.SWING);
  loftCamera.cancelSwing();
  loftCamera.beginResult(ball,pin);
  loftCamera.resultZoom(10000);
  assert.equal(loftCamera.resultDistT,3.2);
  loftCamera.resultZoom(-10000);
  assert.equal(loftCamera.resultDistT,9);
});

check('camera rebases world cuts without sacrificing local aim damping',()=>{
  const point=(route,ball=false)=>new THREE.Vector3(
    route[0],
    terrainHeight(route[0],route[1])+(ball?.026:0),
    route[1]
  );
  const sightClearance=(controller,samples=24)=>{
    let clearance=Infinity;
    for(let index=1;index<samples;index++){
      const t=index/samples;
      const x=THREE.MathUtils.lerp(controller.pos.x,controller.look.x,t);
      const y=THREE.MathUtils.lerp(controller.pos.y,controller.look.y,t);
      const z=THREE.MathUtils.lerp(controller.pos.z,controller.look.z,t);
      clearance=Math.min(clearance,y-terrainHeight(x,z));
    }
    return clearance;
  };

  for(const [fromIndex,toIndex] of [[0,1],[1,2],[2,0]]){
    const from=ROUND_HOLES[fromIndex],to=ROUND_HOLES[toIndex];
    const fromBall=point(from.tee,true),fromPin=point(from.pin);
    const fromYaw=Math.atan2(fromPin.x-fromBall.x,-(fromPin.z-fromBall.z));
    const camera=new THREE.PerspectiveCamera(43,16/9,.1,750);
    const controller=new LoftCamera(camera,{terrainHeight});
    for(let frame=0;frame<180;frame++)controller.updateAim(1/60,{ball:fromBall,pin:fromPin,aimYaw:fromYaw,putting:false});
    controller.beginFlight(fromYaw);
    controller.beginResult(fromPin,fromPin,{cup:true});
    for(let frame=0;frame<180;frame++)controller.updateResult(1/60,{ball:fromPin,pin:fromPin});

    const toBall=point(to.tee,true),toPin=point(to.pin);
    const toYaw=Math.atan2(toPin.x-toBall.x,-(toPin.z-toBall.z));
    controller.resetAim();
    controller.updateAim(1/60,{ball:toBall,pin:toPin,aimYaw:toYaw,putting:false});

    const view=controller.look.clone().sub(controller.pos);
    const horizontalView=new THREE.Vector3(view.x,0,view.z).normalize();
    const courseForward=new THREE.Vector3(Math.sin(toYaw),0,-Math.cos(toYaw));
    assert.ok(horizontalView.dot(courseForward)>.90,`hole ${fromIndex+1} to ${toIndex+1} faces the new route immediately`);
    assert.ok(view.length()>4.8,`hole ${fromIndex+1} to ${toIndex+1} retains a stable view baseline`);
    assert.ok(controller.pos.y-terrainHeight(controller.pos.x,controller.pos.z)>=1.1,`hole ${fromIndex+1} to ${toIndex+1} camera clears terrain`);
    assert.ok(sightClearance(controller)>=0,`hole ${fromIndex+1} to ${toIndex+1} sightline clears terrain`);
  }

  // Resetting a local, player-authored orbit is not a cut. It must retain the
  // premium damped return rather than snapping to the canonical composition.
  const hole=ROUND_HOLES[0],ball=point(hole.tee,true),pin=point(hole.pin);
  const routeYaw=Math.atan2(pin.x-ball.x,-(pin.z-ball.z));
  const localCamera=new THREE.PerspectiveCamera(43,16/9,.1,750);
  const localController=new LoftCamera(localCamera,{terrainHeight});
  const orbitYaw=routeYaw+1.05;
  for(let frame=0;frame<180;frame++)localController.updateAim(1/60,{ball,pin,aimYaw:orbitYaw,putting:false});
  const before=localController.pos.clone();
  localController.resetAim();
  localController.updateAim(1/60,{ball,pin,aimYaw:routeYaw,putting:false});
  const canonicalCamera=new THREE.PerspectiveCamera(43,16/9,.1,750);
  const canonicalController=new LoftCamera(canonicalCamera,{terrainHeight});
  canonicalController.updateAim(1/60,{ball,pin,aimYaw:routeYaw,putting:false});
  assert.ok(localController.pos.distanceTo(before)>.05,'local reset begins returning toward the route');
  assert.ok(localController.pos.distanceTo(canonicalController.pos)>.50,'local reset remains damped on its first frame');
});

check('mobile camera composition keeps golfer, ball, pin and cup inside the live field',()=>{
  assert.equal(CAMERA_COMPOSITION_SPEC.system,'LOFT_MOBILE_COMPOSITION_V1');
  assert.ok(cameraCompositionProfile(390/844,true).lateralShift>=.30);
  assert.ok(cameraCompositionProfile(844/390,true).lateralShift<=-.11);

  const viewports=[
    {width:390,height:844,label:'portrait'},
    {width:844,height:390,label:'landscape'},
    {width:1280,height:720,label:'desktop'}
  ];
  const project=(point,camera,width,height)=>{
    const p=point.clone().project(camera);
    return {x:(p.x+1)/2,y:(1-p.y)/2,z:p.z,px:(p.x+1)*width/2,py:(1-p.y)*height/2};
  };
  const bodyRect=(subject,camera,width,height)=>{
    subject.group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const excluded=new Set([subject.grip,subject.shaft,subject.ferrule]);
    subject.clubHead.traverse(object=>excluded.add(object));
    const rect={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
    subject.group.traverse(object=>{
      if(!object.isMesh||!object.visible||excluded.has(object))return;
      object.geometry.computeBoundingBox();
      const box=object.geometry.boundingBox;
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const p=project(new THREE.Vector3(x,y,z).applyMatrix4(object.matrixWorld),camera,width,height);
        rect.minX=Math.min(rect.minX,p.x);rect.maxX=Math.max(rect.maxX,p.x);
        rect.minY=Math.min(rect.minY,p.y);rect.maxY=Math.max(rect.maxY,p.y);
      }
    });
    rect.height=rect.maxY-rect.minY;return rect;
  };
  const settle=(controller,args,frames=120)=>{for(let i=0;i<frames;i++)controller.updateAim(1/60,args);};
  const frameFixture=({width,height,putting,yaw,pinDistance})=>{
    const ball=new THREE.Vector3(0,.026,0);
    const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
    const pin=ball.clone().addScaledVector(forward,pinDistance);
    const subject=new LoftGolferRig(COLORS);
    subject.setClub(CLUBS.find(club=>club.id===(putting?'putter':'iron7')),50);
    subject.setPose(0,LEVELS[50]);
    const rigYaw=-yaw;
    const address=subject.addressBallLocal.clone().applyAxisAngle(new THREE.Vector3(0,1,0),rigYaw);
    subject.group.position.copy(ball).sub(address);subject.group.position.y=GOLFER_GROUND_CLEARANCE;
    subject.group.rotation.y=rigYaw;
    const camera=new THREE.PerspectiveCamera(43,width/height,.05,1000);
    const controller=new LoftCamera(camera,{terrainHeight:()=>0});
    settle(controller,{ball,pin,aimYaw:yaw,putting});
    const body=bodyRect(subject,camera,width,height);
    const ballScreen=project(ball,camera,width,height),pinScreen=project(pin,camera,width,height);
    const ballTop=project(ball.clone().add(new THREE.Vector3(0,.026,0)),camera,width,height);
    const ballBottom=project(ball.clone().add(new THREE.Vector3(0,-.026,0)),camera,width,height);
    return {body,ball:ballScreen,pin:pinScreen,ballDiameter:Math.abs(ballTop.py-ballBottom.py),controller,camera,subject};
  };

  const fullHeights=[];
  for(const viewport of viewports){
    for(const hole of ROUND_HOLES){
      const dx=hole.pin[0]-hole.tee[0],dz=hole.pin[1]-hole.tee[1];
      const yaw=Math.atan2(dx,-dz),distance=Math.hypot(dx,dz);
      const frame=frameFixture({...viewport,putting:false,yaw,pinDistance:distance});
      const {body,ball,pin}=frame;
      assert.ok(body.height>=.30&&body.height<=.52,viewport.label+' full-shot body scale');
      assert.ok(body.minX>=.04&&body.maxX<=.80&&body.minY>=.17&&body.maxY<=.84,viewport.label+' full-shot body safe field');
      assert.ok(ball.x>=.38&&ball.x<=.76&&ball.y>=.55&&ball.y<=.78,viewport.label+' full-shot ball field');
      assert.ok(pin.x>=.20&&pin.x<=.80&&pin.y>=.12&&pin.y<=.50&&pin.z>-1&&pin.z<1,viewport.label+' route target field');
      const minBall=viewport.label==='portrait'?6:viewport.label==='landscape'?3:5;
      assert.ok(frame.ballDiameter>=minBall,viewport.label+' playable ball diameter');
      fullHeights.push({label:viewport.label,height:body.height});
    }
  }
  const portraitHeight=fullHeights.find(item=>item.label==='portrait').height;
  const landscapeHeight=fullHeights.find(item=>item.label==='landscape').height;
  assert.ok(Math.abs(portraitHeight-landscapeHeight)<=.08,'phone orientations retain normalized golfer scale');

  for(const viewport of viewports){
    const putt=frameFixture({...viewport,putting:true,yaw:0,pinDistance:2/3.28084});
    const {body,ball,pin}=putt;
    assert.ok(body.height>=.42&&body.height<=.66,viewport.label+' putting body scale');
    assert.ok(body.minX>=.02&&body.maxX<=.78&&body.minY>=.08&&body.maxY<=.84,viewport.label+' putting body safe field '+JSON.stringify(body));
    assert.ok(ball.x>=.45&&ball.x<=.80&&ball.y>=.58&&ball.y<=.80,viewport.label+' putting ball field');
    assert.ok(Math.abs(ball.y-pin.y)>=.04,viewport.label+' two-foot cup separation');
    const minBall=viewport.label==='portrait'?9:viewport.label==='landscape'?5:8;
    assert.ok(putt.ballDiameter>=minBall,viewport.label+' putting ball diameter');
    assert.ok(ball.z>-1&&ball.z<1&&pin.z>-1&&pin.z<1,viewport.label+' putting subjects inside frustum');
    putt.controller.beginSwing(0);
    for(let i=0;i<90;i++)putt.controller.updateSwing(1/60,{ball:new THREE.Vector3(0,.026,0),pin:new THREE.Vector3(0,.026,-2/3.28084),swingProgress:.5,putting:true});
    const swingBody=bodyRect(putt.subject,putt.camera,viewport.width,viewport.height);
    const swingBall=project(new THREE.Vector3(0,.026,0),putt.camera,viewport.width,viewport.height);
    assert.ok(swingBody.minX>=.02&&swingBody.maxX<=.78&&swingBody.minY>=.08&&swingBody.maxY<=.84,viewport.label+' putting swing retains safe composition');
    assert.ok(swingBall.x>=.45&&swingBall.x<=.80&&swingBall.y>=.58&&swingBall.y<=.80,viewport.label+' putting swing retains the ball');
  }

  const recovery=frameFixture({width:390,height:844,putting:false,yaw:0,pinDistance:146});
  recovery.controller.aimZoom(-10000);
  settle(recovery.controller,{ball:new THREE.Vector3(0,.026,0),pin:new THREE.Vector3(0,.026,-146),aimYaw:0,putting:false});
  recovery.controller.resetAim();
  settle(recovery.controller,{ball:new THREE.Vector3(0,.026,0),pin:new THREE.Vector3(0,.026,-146),aimYaw:0,putting:false},45);
  assert.ok(bodyRect(recovery.subject,recovery.camera,390,844).height>=.26,'reset recovers decision-scale golfer within 45 frames');
});

check('LOFT field, workshop and receipt UI contracts are present',()=>{
  const html=readFileSync('prototype1/index.html','utf8');
  const css=readFileSync('prototype1/styles.css','utf8');
  const game=readFileSync('prototype1/game.js','utf8');
  const required=['app','stage','hole-number','hole-par','hud-score','wind-value','course-map','map-course-name','map-distance',
    'map-expand','map-aim','map-target','map-player','club-chip','club-short','club-carry','club-tier','level-chip','camera-reset',
    'level-menu','context','tip','swing-meter','bag','bag-close','bag-workbench','bag-hero-stage','bag-hero-art','bag-hero-model',
    'bag-hero-name','bag-hero-tier','bag-hero-carry','bag-hero-loft','bag-hero-construction','bag-hero-stats','bag-equip','club-grid',
    'result','again','round-end','scorecard','run-it-back','fatal'];
  for(const id of required)assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(html,/LOFT WORKSHOP/i);
  assert.match(html,/data-level="75"/);
  assert.match(css,/--ink:\s*#0b0d0d/i);
  assert.match(css,/--cream:\s*#f2efe8/i);
  assert.match(css,/--orange:\s*#ff6a2a/i);
  assert.match(css,/\.club-card\.tier-icon/);
  assert.match(game,/button\[data-level\]/);
  assert.match(game,/addEventListener\(['"]wheel['"]/);
});

check('Target Steward expresses the shot decision and survives responsive placement',()=>{
  assert.equal(TARGET_STEWARD_SPEC.system,'LOFT_TARGET_STEWARD_V1');
  assert.ok(TARGET_STEWARD_SPEC.supportFontMinPx>=9);
  assert.ok(TARGET_STEWARD_SPEC.mobilePrimaryFontMinPx>=24);
  assert.deepEqual(buildTargetStewardCopy({
    targetDistanceMeters:160*.9144,elevationMeters:4*.3048,surface:'fairway'
  }),{mode:'landing',kicker:'LANDING',value:'160',unit:'YD',detail:'↑ 4 FT · FAIRWAY'});
  assert.deepEqual(buildTargetStewardCopy({
    putting:true,targetDistanceMeters:8*.3048,cupDistanceMeters:8*.3048,
    targetToCupMeters:0,elevationMeters:0,surface:'green'
  }),{mode:'cup',kicker:'TO CUP',value:'8',unit:'FT',detail:'LEVEL · GREEN'});
  assert.deepEqual(buildTargetStewardCopy({
    putting:true,targetDistanceMeters:8*.3048,cupDistanceMeters:8*.3048,
    targetToCupMeters:1,elevationMeters:-3.6*.3048,surface:'green'
  }),{mode:'putt',kicker:'PUTT PACE',value:'8',unit:'FT',detail:'CUP 8 FT'});
  assert.equal(buildTargetStewardCopy({surface:'   '}).detail,'LEVEL · FAIRWAY');
  assert.equal(buildTargetStewardCopy({elevationMeters:-3.6*.3048,surface:'bunker'}).detail,'↓ 4 FT · BUNKER');

  const fixtures=[
    {
      viewport:{left:0,top:0,width:1280,height:720},anchor:{x:640,y:280},size:{width:154,height:68},
      obstacles:[{left:18,top:16,width:216,height:82},{left:1114,top:16,width:148,height:70},{left:1114,top:96,width:148,height:170},{left:18,top:576,width:244,height:126},{left:1092,top:643,width:170,height:59}]
    },
    {
      viewport:{left:0,top:0,width:390,height:844},anchor:{x:195,y:160},size:{width:136,height:61},
      obstacles:[{left:11,top:11,width:96,height:58},{left:139,top:11,width:112,height:137},{left:291,top:11,width:88,height:54},{left:11,top:729,width:183,height:104},{left:265,top:779,width:114,height:54}]
    },
    {
      viewport:{left:0,top:0,width:844,height:390},anchor:{x:422,y:80},size:{width:140,height:58},
      obstacles:[{left:18,top:16,width:216,height:69},{left:351,top:10,width:142,height:44},{left:678,top:16,width:148,height:70},{left:18,top:280,width:208,height:92},{left:656,top:321,width:170,height:59}]
    }
  ];
  const assertSide=(result,anchor,size)=>{
    const gap=TARGET_STEWARD_SPEC.anchorGap;
    if(result.placement==='above')assert.ok(result.y+size.height<=anchor.y-gap+1e-8);
    else if(result.placement==='below')assert.ok(result.y>=anchor.y+gap-1e-8);
    else if(result.placement==='right')assert.ok(result.x>=anchor.x+gap-1e-8);
    else assert.ok(result.x+size.width<=anchor.x-gap+1e-8);
  };
  for(const fixture of fixtures){
    const result=solveTargetStewardPlacement(fixture);
    assert.equal(result.visible,true);
    assert.equal(result.overlap,0);
    assertSide(result,fixture.anchor,fixture.size);
    assert.ok(result.x>=fixture.viewport.left+TARGET_STEWARD_SPEC.viewportInset);
    assert.ok(result.y>=fixture.viewport.top+TARGET_STEWARD_SPEC.viewportInset);
    assert.ok(result.x+fixture.size.width<=fixture.viewport.left+fixture.viewport.width-TARGET_STEWARD_SPEC.viewportInset);
    assert.ok(result.y+fixture.size.height<=fixture.viewport.top+fixture.viewport.height-TARGET_STEWARD_SPEC.viewportInset);
  }
  const topEdge={viewport:{left:0,top:0,width:1280,height:720},anchor:{x:640,y:20},size:{width:154,height:68}};
  const topResult=solveTargetStewardPlacement(topEdge);
  assert.equal(topResult.visible,true);
  assert.notEqual(topResult.placement,'above');
  assertSide(topResult,topEdge.anchor,topEdge.size);
  assert.deepEqual(
    solveTargetStewardPlacement({viewport:{left:0,top:0,width:100,height:80},anchor:{x:50,y:40},size:{width:154,height:68}}),
    {visible:false,reason:'NO_ROOM'}
  );
  const zeroEdge=solveTargetStewardPlacement({viewport:{left:-100,top:0,right:0,bottom:100},anchor:{x:-50,y:50},size:{width:30,height:20}});
  assert.equal(zeroEdge.visible,true);
});

check('Target Steward is a read-only world instrument with explicit club range semantics',()=>{
  const game=readFileSync('prototype1/game.js','utf8').replaceAll('\r','');
  const html=readFileSync('prototype1/index.html','utf8').replaceAll('\r','');
  const css=readFileSync('prototype1/styles.css','utf8').replaceAll('\r','');
  const stewardSource=readFileSync('prototype1/targetSteward.js','utf8').replaceAll('\r','');
  assert.match(html,/id="target-steward"[^>]+role="status"[^>]+aria-live="off"[^>]+aria-hidden="true"/);
  assert.match(html,/id="club-range-label">CARRY<\/small>/);
  const stewardRule=css.match(/\.target-steward\{([^}]+)\}/)?.[1]||'';
  assert.match(stewardRule,/left:0/);
  assert.match(stewardRule,/top:0/);
  assert.match(stewardRule,/pointer-events:none/);
  assert.match(stewardRule,/touch-action:none/);
  assert.match(css,/\.club-chip-distance small\{[^}]*font:[^;}]*9px\/10px/);
  assert.doesNotMatch(stewardSource,/^\s*import\s/m);
  assert.doesNotMatch(stewardSource,/\b(?:document|window|addEventListener|PointerEvent|THREE)\b/);
  assert.match(game,/from '\.\/targetSteward\.js\?v=032-/);
  assert.match(game,/\$\('club-range-label'\)\.textContent=c\.head==='putter'\?'RANGE':'CARRY'/);
  assert.doesNotMatch(game,/\$\('target-steward'\)\.(?:onclick|onpointerdown|addEventListener)/);
  assert.equal((game.match(/syncTargetStewardCopy\(\);/g)||[]).length,1);
  assert.equal((game.match(/positionTargetSteward\(\);/g)||[]).length,1);
  const lineBody=game.slice(game.indexOf('function updateLine(){'),game.indexOf('\n}\nupdateLine();',game.indexOf('function updateLine(){')));
  assert.ok(lineBody.indexOf('syncTargetStewardCopy();')>lineBody.indexOf('golfer.group.rotation.y=rigYaw;'));
  const projectionBody=game.slice(game.indexOf('function positionTargetSteward(){'),game.indexOf('\n}\n\nfunction showContext',game.indexOf('function positionTargetSteward(){')));
  assert.match(projectionBody,/state\.phase==='ready'/);
  assert.match(projectionBody,/!cam\.isSwingLocked/);
  assert.match(projectionBody,/!mapIsOpen\(\)/);
  assert.match(projectionBody,/!\$\('bag'\)\.classList\.contains\('open'\)/);
  const screenBody=game.slice(game.indexOf('function screenOf('),game.indexOf('\n}\n\nconst targetStewardProjection',game.indexOf('function screenOf(')));
  assert.doesNotMatch(screenBody,/targetSteward|target-steward/);
  const frameBody=game.slice(game.indexOf('function frame(now){'),game.indexOf('\n}\n\nsetTimeout',game.indexOf('function frame(now){')));
  assert.ok(frameBody.indexOf('positionTargetSteward();')<frameBody.indexOf('renderer.render(scene,camera)'));
});

check('Round Chronicle models live and final score truth without counting the active hole',()=>{
  assert.equal(ROUND_CHRONICLE_SPEC.system,'LOFT_ROUND_CHRONICLE_V1');
  assert.ok(ROUND_CHRONICLE_SPEC.supportFontMinPx>=9);
  assert.ok(ROUND_CHRONICLE_SPEC.minimumTouchTargetPx>=44);
  const input={holes:ROUND_HOLES,rowanScores:ROWAN_SCORES,holeScores:[2],holeIndex:1,strokes:2};
  const snapshot=JSON.stringify(input);
  const start=buildRoundChronicleModel({holes:ROUND_HOLES,rowanScores:ROWAN_SCORES,holeScores:[],holeIndex:0,strokes:0});
  assert.equal(start.score,'E');assert.equal(start.matchDetail,'MATCH BEGINS');
  assert.deepEqual(start.rows.map(row=>row.state),['current','upcoming','upcoming']);
  assert.deepEqual(start.totals,{label:'THRU',posted:0,holes:3,par:0,coursePar:10,you:'—',rowan:'—'});

  const partial=buildRoundChronicleModel(input);
  assert.equal(JSON.stringify(input),snapshot,'Chronicle never mutates gameplay input');
  assert.equal(partial.score,'-1');assert.equal(partial.scoreDetail,'2 STROKES · PAR 3');
  assert.equal(partial.matchLabel,'YOU LEAD');assert.equal(partial.matchDetail,'1 STROKE · THRU 1');
  assert.equal(partial.rows[1].youValue,'LIVE');assert.equal(partial.rows[1].youDetail,'STROKE 3');
  assert.deepEqual(partial.totals,{label:'THRU',posted:1,holes:3,par:3,coursePar:10,you:'2',rowan:'3'});

  const penalty=buildRoundChronicleModel({holes:ROUND_HOLES,rowanScores:ROWAN_SCORES,holeScores:[3],holeIndex:1,strokes:3});
  assert.equal(penalty.score,'E');assert.equal(penalty.matchLabel,'ALL SQUARE');
  assert.equal(penalty.rows[1].youDetail,'STROKE 4');
  assert.deepEqual([penalty.totals.par,penalty.totals.you,penalty.totals.rowan],[3,'3','3']);

  const final=buildRoundChronicleModel({holes:ROUND_HOLES,rowanScores:ROWAN_SCORES,holeScores:[2,3,4],holeIndex:2,strokes:4,roundComplete:true});
  assert.equal(final.mode,'final');assert.equal(final.score,'-1');
  assert.equal(final.scoreDetail,'9 STROKES · PAR 10');assert.equal(final.matchLabel,'ROUND WON');assert.equal(final.matchDetail,'BY 1 STROKE');
  assert.deepEqual(final.rows.map(row=>row.state),['posted','posted','posted']);
  assert.deepEqual(final.totals,{label:'ROUND',posted:3,holes:3,par:10,coursePar:10,you:'9',rowan:'10'});
  assert.ok(Object.isFrozen(final)&&Object.isFrozen(final.rows)&&Object.isFrozen(final.totals)&&final.rows.every(Object.isFrozen));

  const valid={holes:ROUND_HOLES,rowanScores:ROWAN_SCORES,holeScores:[],holeIndex:0,strokes:0};
  assert.throws(()=>buildRoundChronicleModel({...valid,rowanScores:[...ROWAN_SCORES,4]}),/one valid Rowan score/);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[0]}),/score/i);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[2.5]}),/score/i);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[2,,4],holeIndex:1}),/hole order/);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[2],holeIndex:2}),/active unposted hole/);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[2,3],holeIndex:1,strokes:3,roundComplete:true}),/cannot be final/);
  assert.throws(()=>buildRoundChronicleModel({...valid,holeScores:[2,3,4],holeIndex:2,strokes:3,roundComplete:true}),/posted closing hole/);
});

check('Round Chronicle is a responsive golf-native ledger with accessible controls',()=>{
  const html=readFileSync('prototype1/index.html','utf8').replaceAll('\r','');
  const css=readFileSync('prototype1/styles.css','utf8').replaceAll('\r','');
  const required=['chronicle-open','round-end','chronicle-state','chronicle-title','chronicle-progress','round-score','round-total',
    'chronicle-match','chronicle-match-detail','chronicle-active-hole','chronicle-close','scorecard','scorecard-body','chronicle-total-label',
    'chronicle-posted','chronicle-total-par','chronicle-total-you','chronicle-total-rowan','run-it-back'];
  for(const id of required)assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(html,/id="chronicle-open"[^>]+aria-haspopup="dialog"[^>]+aria-controls="round-end"[^>]+aria-expanded="false"/);
  assert.match(html,/id="round-end"[^>]+aria-hidden="true"[^>]+role="dialog"[^>]+aria-modal="true"[^>]+aria-labelledby="chronicle-title"/);
  assert.match(html,/<table id="scorecard"[^>]+aria-label="Coastal Ridge scorecard">[\s\S]*<tbody id="scorecard-body"><\/tbody>[\s\S]*<tfoot>/);
  assert.doesNotMatch(html,/round-end-card|score-hole/);
  assert.match(css,/\.chronicle-trigger span\{[^}]*font:[^;}]*9px\/11px/);
  const panelCss=css.slice(css.indexOf('#round-end{'),css.indexOf('#fatal{'));
  assert.doesNotMatch(panelCss,/font(?:-size)?:[^;}]*\b[1-8](?:\.\d+)?px/i,'ledger support type stays at least 9px');
  assert.match(panelCss,/\.chronicle-ledger\{[^}]*overflow-y:auto[^}]*touch-action:pan-y[^}]*overscroll-behavior:contain/);
  assert.match(panelCss,/\.chronicle-ledger>header button\{width:44px;height:44px/);
  assert.match(panelCss,/#run-it-back\{[^}]*height:48px/);
  const portrait=css.slice(css.indexOf('@media(max-width:700px)'),css.indexOf('@media(min-width:701px)'));
  assert.match(portrait,/\.chronicle-sheet\{grid-template-columns:1fr;grid-template-rows:180px minmax\(0,1fr\)/);
  assert.match(portrait,/\.chronicle-summary\{display:block;min-height:180px/);
  assert.match(portrait,/\.chronicle-ledger\{min-height:0;[^}]*overflow-y:auto/);
  assert.match(portrait,/#run-it-back\{width:100%;min-width:0;height:46px/);
  const shortStart=css.indexOf('@media(max-height:600px)');
  const landscapeStart=css.indexOf('@media(min-width:701px) and (max-height:600px)');
  assert.ok(landscapeStart>shortStart);
  assert.doesNotMatch(css.slice(shortStart,landscapeStart),/\.chronicle-sheet/,'narrow short phones keep the portrait ledger');
  const landscape=css.slice(landscapeStart,css.indexOf('@media\(prefers-reduced-motion'));
  assert.match(landscape,/\.chronicle-sheet\{grid-template-columns:190px minmax\(0,1fr\);grid-template-rows:1fr;[^}]*height:calc\(100vh - 20px\)/);
  assert.match(landscape,/\.chronicle-summary\{display:flex;min-height:0/);
  assert.match(landscape,/#run-it-back\{height:44px/);
});

check('Round Chronicle is modal, phase-safe and isolated from scoring and shot input',()=>{
  const game=readFileSync('prototype1/game.js','utf8').replaceAll('\r','');
  const chronicle=readFileSync('prototype1/roundChronicle.js','utf8').replaceAll('\r','');
  assert.match(game,/from '\.\/roundChronicle\.js\?v=033-/);
  assert.doesNotMatch(chronicle,/\b(?:document|window|addEventListener|PointerEvent|THREE)\b/);
  assert.doesNotMatch(game,/\$\('scorecard'\)\.innerHTML/);
  const render=game.slice(game.indexOf('function renderRoundChronicle'),game.indexOf('\n}\n\nfunction syncRoundChronicle',game.indexOf('function renderRoundChronicle')));
  assert.doesNotMatch(render,/\bstate\./,'rendering never writes gameplay state');
  assert.match(render,/\$\('scorecard-body'\)/);assert.match(render,/body\.replaceChildren/);
  const open=game.slice(game.indexOf('function openRoundChronicle'),game.indexOf('\n}\n\nfunction closeRoundChronicle',game.indexOf('function openRoundChronicle')));
  assert.match(open,/state\.phase!=='ready'/);assert.match(open,/cam\.isSwingLocked/);assert.match(open,/classList\.contains\('swing-focus'\)/);
  assert.doesNotMatch(open,/state\.phase\s*=(?!=)/,'live scorecard never changes the play phase');
  assert.match(open,/closePrecisionMap\(\);closeBag\(\)/);assert.match(open,/classList\.add\('chronicle-open'\)/);
  assert.match(open,/setChronicleBackgroundInert\(true\)/);
  const close=game.slice(game.indexOf('function closeRoundChronicle'),game.indexOf('\n}\n\nfunction startHole',game.indexOf('function closeRoundChronicle')));
  assert.match(close,/setChronicleBackgroundInert\(false\)/);
  const end=game.slice(game.indexOf('function showRoundEnd'),game.indexOf('\n}\n\nfunction finishShot',game.indexOf('function showRoundEnd')));
  assert.match(end,/state\.roundComplete=true/);assert.match(end,/openRoundChronicle\(\{final:true\}\)/);
  assert.doesNotMatch(end,/\.reduce\(|\.innerHTML|scoreName/);
  assert.match(game,/state\.phase='flight';[^\n]+syncChronicleAvailability\(\)/);
  assert.match(game,/state\.phase='result';syncChronicleAvailability\(\)/);
  assert.match(game,/function startHole\([^]*?closeRoundChronicle\(\{restoreFocus:false,force:true\}\)/);
  assert.match(game,/\$\('round-end'\)\.addEventListener\('keydown'[^]*?button:not\(\[disabled\]\):not\(\[hidden\]\)/);
  assert.match(game,/if\(chronicleIsOpen\(\)\)\{if\(closeRoundChronicle\(\)\)/);
  assert.match(game,/if\(\$\('bag'\)\.classList\.contains\('open'\)\|\|chronicleIsOpen\(\)\)return/);
  assert.match(game,/state\.holeScores=\[\];state\.shotCount=0/);
  assert.match(game,/gauntletFixture==='chronicle-live'\|\|gauntletFixture==='chronicle-final'/);
  assert.match(game,/!\$\('round-end'\)\.classList\.contains\('show'\)/);
});

check('Workshop preview does not equip until explicit confirmation',()=>{
  const game=readFileSync('prototype1/game.js','utf8');
  const build=game.slice(game.indexOf('function buildBag'),game.indexOf('function previewClub'));
  const open=game.slice(game.indexOf('function openBag'),game.indexOf('function closeBag'));
  assert.match(game,/let bagFocusId\s*=\s*state\.clubId/);
  assert.match(open,/bagFocusId\s*=\s*state\.clubId/);
  assert.doesNotMatch(build,/b\.onclick\s*=\s*\(\)\s*=>\s*selectClub\(/);
  assert.match(build,/b\.onclick\s*=\s*\(\)\s*=>\s*previewClub\(/);
  assert.match(game,/\$\(['"]bag-equip['"]\)\.onclick\s*=\s*\(\)\s*=>\s*\{if\(bagFocusId!==state\.clubId\)selectClub\(bagFocusId\)/);
});

check('spatial cup owns a regulation aperture, liner, depth and full-size drop',()=>{
  const world=readFileSync('prototype1/worldV2.js','utf8');
  const game=readFileSync('prototype1/game.js','utf8');
  const camera=readFileSync('prototype1/camera.js','utf8');
  assert.match(game,/stencil:true/);
  assert.match(world,/const CUP_RADIUS=\.053975/);
  assert.match(world,/const CUP_DEPTH=\.1016/);
  assert.match(world,/NotEqualStencilFunc/);
  assert.match(world,/LOFT_CUP_APERTURE/);
  assert.match(world,/LOFT_CUP_TURF_CUT/);
  assert.match(world,/LOFT_CUP_LINER/);
  assert.match(world,/LOFT_CUP_BOTTOM/);
  assert.match(world,/LOFT_FLAGSTICK_SLEEVE/);
  assert.match(game,/ballGroup\.scale\.setScalar\(1\)/);
  assert.doesNotMatch(game,/playingHeight\(pin\.x,pin\.z\)-\.18/);
  assert.doesNotMatch(game,/lerp\(1,\.72,t\)/);
  assert.doesNotMatch(game,/if\(state\.cupSink===0\)ballGroup\.visible=false/);
  assert.match(camera,/const anchor=this\.resultCup\?pin:ball/);
  assert.match(game,/halo\.scale\.setScalar\(putting \? \.18 : 1\)/);
  assert.match(game,/gauntletFixture===['"]cup['"]/);
  assert.match(game,/gauntletFixture===['"]cup-close['"]/);
});

check('the playable LOFT ball has 338 real dimples and one fixed signature',()=>{
  const centers=buildDimpleDirections();
  assert.equal(centers.length,338);
  const expected=new THREE.Vector3(...LOFT_BALL_SPEC.signatureDirection).normalize();
  assert.ok(centers[0].distanceTo(expected)<1e-10);
  for(const detail of [LOFT_BALL_SPEC.closeDetail,LOFT_BALL_SPEC.farDetail]){
    const geometry=buildLoftBallGeometry(.026,detail);
    assert.equal(geometry.userData.system,'LOFT_BALL_TOPOLOGY_V1');
    assert.equal(geometry.userData.dimpleCount,338);
    assert.equal(geometry.userData.signatureCount,1);
    assert.ok(geometry.userData.signatureVertices>0);
    assert.ok(near(geometry.userData.deepestRatio,LOFT_BALL_SPEC.dimpleDepth/LOFT_BALL_SPEC.physicalRadius,1e-10));
    const p=geometry.attributes.position;
    let minRadius=Infinity,maxRadius=0;
    for(let i=0;i<p.count;i++){
      const radius=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));
      minRadius=Math.min(minRadius,radius);maxRadius=Math.max(maxRadius,radius);
    }
    assert.ok(minRadius<.026);
    assert.ok(maxRadius<=.02600001);
  }
  const game=readFileSync('prototype1/game.js','utf8');
  assert.match(game,/createLoftBallVisual\(\{radius:BALL_VISUAL_R\}\)/);
  assert.doesNotMatch(game,/const ballSignal=/);
  assert.doesNotMatch(game,/function makeBallBump/);
});

check('protected terrain contact identity remains intact and greens have no blade speckle',()=>{
  const terrain=validateTerrain();
  const world=readFileSync('prototype1/worldV2.js','utf8');
  assert.equal(terrain.ok,true);
  assert.equal(terrain.system,'LOFT_FIELD_V4_CONTACT');
  assert.match(world,/surface==='green'\|\|surface==='tee'\?0/);
});

check('Coastal Turf & Light V2 separates cuts without touching the protected field',()=>{
  const health=validateCoastalTurfLight();
  assert.equal(health.ok,true);
  assert.equal(health.system,'LOFT_COASTAL_TURF_LIGHT_V2');
  assert.equal(health.contactSystem,'LOFT_FIELD_V4_CONTACT');
  assert.equal(health.renderPhysicsContract,'TRIANGLE_HEIGHT_SHARED_NORMAL');
  assert.equal(health.vectorLength,1);
  assert.ok(health.keyToAmbient>=2.8);
  assert.equal(health.roughnessOrdered,true);
  assert.equal(health.lumaOrdered,true);
  assert.equal(health.restrainedVariation,true);
  assert.equal(health.materialBudget.terrainDrawCalls,1);
  assert.equal(health.materialBudget.terrainMaterials,1);
  assert.equal(health.materialBudget.terrainTextures,3);
  assert.ok(health.rawTextureBytes<=COASTAL_TURF_LIGHT_SPEC.textures.maxRawBytes);
  assert.ok(health.tileX>=4&&health.tileX<=8&&health.tileZ>=4&&health.tileZ<=8);
  assert.ok(health.relief.min>=.90&&health.relief.max<=1.12);
  assert.ok(health.stats.green.roughness<health.stats.fairway.roughness);
  assert.ok(health.stats.fairway.roughness<health.stats.firstCut.roughness);
  assert.ok(health.stats.firstCut.roughness<health.stats.rough.roughness);
  const world=readFileSync('prototype1/worldV2.js','utf8');
  const game=readFileSync('prototype1/game.js','utf8');
  assert.match(game,/COASTAL_TURF_LIGHT_SPEC\.lighting/);
  assert.match(world,/LOFT_COASTAL_TURF_LIGHT_V2/);
  assert.doesNotMatch(world,/displacementMap|displacementScale/);
  assert.equal((world.match(/terrainMat\.bumpScale\s*=/g)||[]).length,0);
});

check('Lighthouse Headland stays off-course, bounded and immutable at runtime',()=>{
  const health=validateLighthouseHeadland();
  assert.equal(health.ok,true);
  assert.equal(health.system,'LOFT_LIGHTHOUSE_HEADLAND_BACKDROP_V1');
  assert.equal(health.nonPlayable,true);
  assert.equal(health.massCount,7);
  assert.ok(health.nearestZ<health.frontLimit);
  assert.equal(health.frontLimit,-294);
  assert.ok(health.drawCalls<=10);
  assert.ok(health.triangles<=20000);
  const world=readFileSync('prototype1/worldV2.js','utf8');
  const updateBody=world.slice(world.indexOf('function updateWorld(dt)'),world.indexOf('\n  return {',world.indexOf('function updateWorld(dt)')));
  assert.doesNotMatch(updateBody,/headland/i);
});

check('Coastal Atmosphere V2 is authored, camera-readable and gameplay-neutral',()=>{
  const health=validateCoastalAir();
  assert.equal(health.ok,true);
  assert.equal(COASTAL_AIR_SPEC.system,'LOFT_COASTAL_AIR_V2');
  assert.deepEqual(COASTAL_AIR_SPEC.fog,{color:0xcbd8d7,near:235,far:530});

  // Atmosphere cannot silently regrade the protected turf/light contract or
  // weaken the terrain suite that owns ball contact.
  assert.equal(
    createHash('sha256').update(JSON.stringify(COASTAL_TURF_LIGHT_SPEC)).digest('hex'),
    '3aebd36da1fd27ac873b667eaed4b8684197eb65d21ed5bb5884df9865b9fb5e'
  );
  const terrainRun=execFileSync(process.execPath,['gauntlet/run-terrain-gauntlet.mjs'],{encoding:'utf8'});
  assert.match(terrainRun,/LOFT TERRAIN GAUNTLET: 14\/14 checks passed/);

  // Pin the visible cloud assets, not labels. Transparent pixels are required
  // to be black, so these hashes cannot differ only in invisible RGB fringe.
  const expectedFingerprints=['2987deb4','324e82bd','617fbfbc','6162d35c'];
  const fnv=bytes=>{
    let hash=2166136261;
    for(let i=0;i<bytes.length;i++)hash=Math.imul(hash^bytes[i],16777619)>>>0;
    return hash.toString(16).padStart(8,'0');
  };
  const alphaHashes=new Set();
  COASTAL_AIR_SPEC.clouds.banks.forEach((bank,i)=>{
    const first=buildCoastalCloudBlueprint(bank.seed);
    const repeat=buildCoastalCloudBlueprint(bank.seed);
    assert.deepEqual(first.data,repeat.data);
    assert.equal(fnv(first.data),expectedFingerprints[i]);
    assert.equal(first.metrics.fingerprint,expectedFingerprints[i]);
    assert.equal(first.metrics.edgeMaxAlpha,0);
    assert.equal(first.metrics.transparentRgbMax,0);
    assert.ok(first.metrics.coverage>=.16&&first.metrics.coverage<=.36);
    assert.equal(first.metrics.peakAlpha,246);
    const alpha=new Uint8Array(first.width*first.height);
    for(let p=0;p<alpha.length;p++)alpha[p]=first.data[p*4+3];
    alphaHashes.add(createHash('sha256').update(alpha).digest('hex'));

    const weightedBand=(from,to)=>{
      const rgb=[0,0,0];let weight=0;
      for(let y=Math.floor(first.height*from);y<Math.floor(first.height*to);y++){
        for(let x=0;x<first.width;x++){
          const p=(y*first.width+x)*4,a=first.data[p+3];
          if(a<12)continue;
          rgb[0]+=first.data[p]*a;rgb[1]+=first.data[p+1]*a;rgb[2]+=first.data[p+2]*a;weight+=a;
        }
      }
      assert.ok(weight>0);
      return rgb.map(value=>value/weight);
    };
    // DataTexture.flipY maps this authored upper band to the plane crown.
    const crown=weightedBand(.20,.48),underside=weightedBand(.60,.80);
    assert.ok(Math.hypot(...crown.map((value,n)=>value-underside[n]))>=65);
    assert.ok((crown[0]-crown[2])-(underside[0]-underside[2])>=32);
  });
  assert.equal(alphaHashes.size,4);

  // Traverse the same DOM-free assembly used by the live world. No counter in
  // a spec or userData object is accepted as proof of the actual scene cost.
  const parent=new THREE.Group(),air=buildCoastalAir(parent);
  parent.updateMatrixWorld(true);
  const meshes=[];air.traverse(object=>{if(object.isMesh)meshes.push(object);});
  const sky=meshes.find(mesh=>mesh.name==='LOFT_COASTAL_SKY_DOME_V2');
  const clouds=meshes.filter(mesh=>mesh.name.startsWith('LOFT_COASTAL_CLOUD_SHEET_'))
    .sort((a,b)=>a.name.localeCompare(b.name));
  assert.ok(sky);
  assert.equal(clouds.length,4);
  assert.equal(new Set(clouds.map(cloud=>cloud.material.map)).size,4);
  assert.deepEqual(clouds.map(cloud=>cloud.material.map.userData.metrics.fingerprint),expectedFingerprints);
  assert.ok(clouds.every(cloud=>cloud.material.map.flipY===true));
  assert.ok(clouds.every(cloud=>cloud.material.transparent&&cloud.material.side===THREE.DoubleSide&&cloud.material.forceSinglePass));
  const renderPasses=clouds.reduce((sum,cloud)=>sum+(
    cloud.material.transparent&&cloud.material.side===THREE.DoubleSide&&!cloud.material.forceSinglePass?2:1
  ),0);
  const triangles=mesh=>(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
  assert.equal(renderPasses,4);
  assert.equal(triangles(sky),1680);
  assert.equal(clouds.reduce((sum,cloud)=>sum+triangles(cloud),0),8);
  assert.equal(meshes.reduce((sum,mesh)=>sum+triangles(mesh),0),1688);
  assert.equal(clouds.reduce((sum,cloud)=>sum+cloud.material.map.image.data.byteLength,0),2097152);
  assert.equal(meshes.length,5);
  assert.ok(air.userData.nonPlayable===true&&meshes.every(mesh=>mesh.userData.nonPlayable===true));
  assert.ok(meshes.every(mesh=>!mesh.castShadow&&!mesh.receiveShadow&&!mesh.material.depthWrite));
  clouds.forEach((cloud,i)=>{
    const bank=COASTAL_AIR_SPEC.clouds.banks[i];
    assert.deepEqual(cloud.position.toArray(),bank.position);
    assert.equal(cloud.rotation.y,bank.rotation);
    assert.deepEqual([cloud.geometry.parameters.width,cloud.geometry.parameters.height],bank.size);
  });
});

check('Coastal Atmosphere V2 lives inside every production camera envelope',()=>{
  // Test the sky through the settled production camera at phone, landscape and
  // desktop aspect ratios on every hole. The gradient must live in the real
  // gameplay field of view rather than only at an unseen zenith.
  const air=buildCoastalAir(new THREE.Group());
  air.updateMatrixWorld(true);
  const sky=air.children.find(child=>child.name==='LOFT_COASTAL_SKY_DOME_V2');
  assert.ok(sky);
  const rows=[.04,.10,.16,.22,.28];
  const sphereCentre=new THREE.Vector3();sky.getWorldPosition(sphereCentre);
  const radius=COASTAL_AIR_SPEC.sky.radius;
  const skyAtScreen=(camera,row)=>{
    const origin=camera.position.clone();
    const point=new THREE.Vector3(0,1-row*2,.5).unproject(camera);
    const direction=point.sub(origin).normalize(),offset=origin.clone().sub(sphereCentre);
    const b=offset.dot(direction),c=offset.lengthSq()-radius*radius;
    const discriminant=b*b-c;
    assert.ok(discriminant>0);
    const distance=-b+Math.sqrt(discriminant);
    const hit=origin.addScaledVector(direction,distance).sub(sphereCentre).divideScalar(radius);
    return sampleCoastalSkyColor(hit.x,hit.y);
  };
  const luma=color=>color.r*.2126+color.g*.7152+color.b*.0722;
  const rgbDistance=(a,b)=>Math.hypot(a.r-b.r,a.g-b.g,a.b-b.b);
  for(const [width,height] of [[390,844],[844,390],[1280,720]]){
    for(const hole of ROUND_HOLES){
      const camera=new THREE.PerspectiveCamera(43,width/height,.1,750);
      const controller=new LoftCamera(camera,{terrainHeight});
      const ball=new THREE.Vector3(hole.tee[0],terrainHeight(hole.tee[0],hole.tee[1])+.026,hole.tee[1]);
      const pin=new THREE.Vector3(hole.pin[0],terrainHeight(hole.pin[0],hole.pin[1]),hole.pin[1]);
      const aimYaw=Math.atan2(pin.x-ball.x,-(pin.z-ball.z));
      for(let frame=0;frame<180;frame++)controller.updateAim(1/60,{ball,pin,aimYaw,putting:false});
      camera.updateMatrixWorld(true);
      const colors=rows.map(row=>skyAtScreen(camera,row));
      for(let i=1;i<colors.length;i++){
        assert.ok(luma(colors[i])>luma(colors[i-1]));
        assert.ok(rgbDistance(colors[i],colors[i-1])>.008);
      }
      const distance=rgbDistance(colors[0],colors.at(-1));
      const lumaLift=luma(colors.at(-1))-luma(colors[0]);
      assert.ok(distance>=.12&&distance<=.45,`${width}x${height} hole ${hole.number} RGB ${distance}`);
      assert.ok(lumaLift>=.055&&lumaLift<=.28,`${width}x${height} hole ${hole.number} luma ${lumaLift}`);
    }
  }
  const sunward=sampleCoastalSkyColor(-.70,.08),away=sampleCoastalSkyColor(.70,.08);
  assert.ok((sunward.r-sunward.b)-(away.r-away.b)>=.035);

  const game=readFileSync('prototype1/game.js','utf8');
  const world=readFileSync('prototype1/worldV2.js','utf8');
  assert.match(game,/new THREE\.Fog\(COASTAL_AIR_SPEC\.fog\.color,COASTAL_AIR_SPEC\.fog\.near,COASTAL_AIR_SPEC\.fog\.far\)/);
  assert.match(world,/buildCoastalAir\(scene\)/);
  assert.doesNotMatch(world,/LOFT_COASTAL_CUMULUS_FIELD_V1/);
});

check('Coastal Ecology replaces perimeter repetition with bounded grounded communities',()=>{
  const health=validateCoastalEcology();
  assert.equal(health.ok,true);
  assert.equal(health.system,'LOFT_COASTAL_ECOLOGY_V1');
  assert.equal(health.nonPlayable,true);
  assert.equal(health.treeCount,18);
  assert.equal(health.treeArchetypes,3);
  assert.equal(health.understoryFamilies,3);
  assert.ok(health.understoryCount>=130&&health.understoryCount<=210);
  assert.ok(health.fescueCount>=700&&health.fescueCount<=1300);
  assert.equal(health.rockCount,24);
  assert.equal(health.invalidSites,0);
  assert.ok(health.maxGroundError<=.01);
  assert.equal(health.deterministic,true);
  assert.match(health.fingerprint,/^[0-9a-f]{8}$/);
  assert.ok(health.treeDrawCalls<=COASTAL_ECOLOGY_SPEC.treeDrawCallBudget);
  assert.ok(health.shadowDrawCalls<=COASTAL_ECOLOGY_SPEC.shadowDrawCallBudget);
  assert.ok(health.drawCalls<=COASTAL_ECOLOGY_SPEC.totalDrawCallBudget);
  assert.ok(health.triangles<=COASTAL_ECOLOGY_SPEC.triangleBudget);
  const world=readFileSync('prototype1/worldV2.js','utf8');
  assert.match(world,/LOFT_ECOLOGY_SHARED_TRUNKS/);
  assert.match(world,/LOFT_ECOLOGY_CLUSTERED_FESCUE/);
  assert.match(world,/LOFT_ECOLOGY_COASTAL_ROCKS_/);
  assert.doesNotMatch(world,/function\s+rock\s*\(/);
  assert.doesNotMatch(world,/new THREE\.InstancedMesh\(bladeGeo,bladeMat,1800\)/);
  assert.doesNotMatch(world,/placeOrganicPine/);
});

check('Ridge House is a grounded bounded destination instead of a box placeholder',()=>{
  const health=validateRidgeHouse();
  assert.equal(health.ok,true);
  assert.equal(health.system,'LOFT_RIDGE_HOUSE_V1');
  assert.equal(health.nonPlayable,true);
  assert.equal(health.allRough,true);
  assert.equal(health.grounded,true);
  assert.ok(health.minRouteClearance>10);
  assert.equal(health.signalCount,1);
  assert.ok(health.windowCount>=10);
  assert.ok(health.beamCount>=20);
  assert.ok(health.drawCalls<=RIDGE_HOUSE_SPEC.drawCallBudget);
  assert.ok(health.shadowDrawCalls<=RIDGE_HOUSE_SPEC.shadowDrawCallBudget);
  assert.ok(health.triangles<=RIDGE_HOUSE_SPEC.triangleBudget);
  const world=readFileSync('prototype1/worldV2.js','utf8');
  assert.match(world,/LOFT_RIDGE_HOUSE_NESTED_ROOFS/);
  assert.match(world,/LOFT_RIDGE_HOUSE_WRAP_TERRACE/);
  assert.match(world,/LOFT_RIDGE_HOUSE_TIMBER_FRAME/);
  assert.match(world,/LOFT_RIDGE_HOUSE_WINDOWS/);
  assert.doesNotMatch(world,/const lodge=new THREE\.Group/);
});

console.log(`\nLOFT VISUAL GAUNTLET: ${checks.length}/${checks.length} PASS`);
