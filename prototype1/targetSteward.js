import {puttingDistance} from './putting.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const YARD=.9144;
const FOOT=.3048;

export const TARGET_STEWARD_SPEC=Object.freeze({
  system:'LOFT_TARGET_STEWARD_V1',
  viewportInset:12,
  anchorGap:18,
  obstaclePadding:8,
  maxOverlapRatio:.04,
  cupSnapMeters:.25,
  supportFontMinPx:9,
  mobilePrimaryFontMinPx:24,
  candidates:Object.freeze(['above','below','right','left'])
});

const roundedDistance=(meters,unit)=>Math.max(1,Math.round(meters/(unit==='FT'?FOOT:YARD)));

function elevationCopy(meters){
  const feet=meters/FOOT;
  if(Math.abs(feet)<1)return'LEVEL';
  return `${feet>0?'↑':'↓'} ${Math.abs(Math.round(feet))} FT`;
}

export function buildTargetStewardCopy({
  putting=false,
  targetDistanceMeters=0,
  cupDistanceMeters=0,
  targetToCupMeters=Infinity,
  elevationMeters=0,
  surface='FAIRWAY'
}={}){
  const safeTarget=Math.max(0,Number.isFinite(targetDistanceMeters)?targetDistanceMeters:0);
  const safeCup=Math.max(0,Number.isFinite(cupDistanceMeters)?cupDistanceMeters:0);
  const safeElevation=Number.isFinite(elevationMeters)?elevationMeters:0;
  const safeSurface=(String(surface||'FAIRWAY').trim()||'FAIRWAY').toUpperCase();
  const atCup=Boolean(putting&&Number.isFinite(targetToCupMeters)&&targetToCupMeters<=TARGET_STEWARD_SPEC.cupSnapMeters);

  if(atCup){
    return Object.freeze({
      mode:'cup',kicker:'TO CUP',...puttingDistance(safeCup),
      detail:`${elevationCopy(safeElevation)} · ${safeSurface}`
    });
  }
  if(putting){
    return Object.freeze({
      mode:'putt',kicker:'PUTT PACE',...puttingDistance(safeTarget),
      detail:`CUP ${puttingDistance(safeCup).value} ${puttingDistance(safeCup).unit}`
    });
  }
  return Object.freeze({
    mode:'landing',kicker:'LANDING',value:String(roundedDistance(safeTarget,'YD')),unit:'YD',
    detail:`${elevationCopy(safeElevation)} · ${safeSurface}`
  });
}

const finiteNumber=value=>Number.isFinite(Number(value))?Number(value):null;

const normalizedRect=rect=>{
  const left=finiteNumber(rect?.left)??0,top=finiteNumber(rect?.top)??0;
  const right=finiteNumber(rect?.right),bottom=finiteNumber(rect?.bottom);
  const explicitWidth=finiteNumber(rect?.width),explicitHeight=finiteNumber(rect?.height);
  const width=Math.max(0,explicitWidth??((right??left)-left));
  const height=Math.max(0,explicitHeight??((bottom??top)-top));
  return {left,top,right:left+width,bottom:top+height,width,height};
};

const intersectionArea=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
  Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

export function solveTargetStewardPlacement({anchor,viewport,size,obstacles=[]}={}){
  const frame=normalizedRect(viewport),width=Math.max(1,Number(size?.width)||1),height=Math.max(1,Number(size?.height)||1);
  if(!anchor||anchor.visible===false||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||frame.width<=0||frame.height<=0){
    return Object.freeze({visible:false,reason:'OFFSCREEN'});
  }
  const spec=TARGET_STEWARD_SPEC,inset=spec.viewportInset,gap=spec.anchorGap;
  if(anchor.x<frame.left||anchor.x>frame.right||anchor.y<frame.top||anchor.y>frame.bottom){
    return Object.freeze({visible:false,reason:'OFFSCREEN'});
  }
  if(width>frame.width-inset*2||height>frame.height-inset*2){
    return Object.freeze({visible:false,reason:'NO_ROOM'});
  }
  const minX=frame.left+inset,maxX=Math.max(minX,frame.right-inset-width);
  const minY=frame.top+inset,maxY=Math.max(minY,frame.bottom-inset-height);
  const inflated=obstacles.map(normalizedRect).filter(rect=>rect.width>0&&rect.height>0).map(rect=>({
    left:rect.left-spec.obstaclePadding,top:rect.top-spec.obstaclePadding,
    right:rect.right+spec.obstaclePadding,bottom:rect.bottom+spec.obstaclePadding,
    width:rect.width+spec.obstaclePadding*2,height:rect.height+spec.obstaclePadding*2
  }));
  const raw={
    above:[anchor.x-width*.5,anchor.y-height-gap],
    below:[anchor.x-width*.5,anchor.y+gap],
    right:[anchor.x+gap,anchor.y-height*.5],
    left:[anchor.x-width-gap,anchor.y-height*.5]
  };
  const options=spec.candidates.map((placement,index)=>{
    const source=raw[placement],x=clamp(source[0],minX,maxX),y=clamp(source[1],minY,maxY);
    const rect={left:x,top:y,right:x+width,bottom:y+height,width,height};
    const overlap=inflated.reduce((sum,obstacle)=>sum+intersectionArea(rect,obstacle),0);
    const centreX=x+width*.5,centreY=y+height*.5;
    const displacement=Math.hypot(centreX-anchor.x,centreY-anchor.y);
    const sideValid=placement==='above'?rect.bottom<=anchor.y-gap:
      placement==='below'?rect.top>=anchor.y+gap:
      placement==='right'?rect.left>=anchor.x+gap:
      rect.right<=anchor.x-gap;
    return {placement,x,y,overlap,displacement,sideValid,score:overlap*100000+displacement+index*.001};
  }).filter(option=>option.sideValid).sort((a,b)=>a.score-b.score);
  const winner=options[0],area=width*height;
  if(!winner)return Object.freeze({visible:false,reason:'NO_SIDE'});
  if(!winner||winner.overlap>area*spec.maxOverlapRatio){
    return Object.freeze({visible:false,reason:'OBSTRUCTED',overlap:winner?.overlap??0});
  }
  return Object.freeze({
    visible:true,placement:winner.placement,x:winner.x,y:winner.y,
    overlap:winner.overlap,displacement:winner.displacement
  });
}
