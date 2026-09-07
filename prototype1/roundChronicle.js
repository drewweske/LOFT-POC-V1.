import {holeYards,relativeScore,scoreName} from './round.js';

export const ROUND_CHRONICLE_SPEC=Object.freeze({
  system:'LOFT_ROUND_CHRONICLE_V1',
  supportFontMinPx:9,
  minimumTouchTargetPx:44,
  maxHoles:18,
  modes:Object.freeze(['live','final'])
});

const finiteScore=value=>Number.isInteger(value)&&value>=1?value:null;
const freezeRow=row=>Object.freeze(row);

export function buildRoundChronicleModel({
  holes=[],
  rowanScores=[],
  holeScores=[],
  holeIndex=0,
  strokes=0,
  roundComplete=false
}={}){
  const safeHoles=Array.isArray(holes)?holes.slice():[];
  if(!safeHoles.length)throw new Error('Round Chronicle requires at least one hole');
  if(safeHoles.length>ROUND_CHRONICLE_SPEC.maxHoles)throw new Error('Round Chronicle hole limit exceeded');
  safeHoles.forEach((hole,index)=>{
    if(!Number.isInteger(hole?.par)||hole.par<1)throw new Error(`Invalid par at hole ${index+1}`);
    if(!Array.isArray(hole.tee)||!Array.isArray(hole.pin)||hole.tee.length<2||hole.pin.length<2||
      !hole.tee.slice(0,2).every(Number.isFinite)||!hole.pin.slice(0,2).every(Number.isFinite)){
      throw new Error(`Invalid routing at hole ${index+1}`);
    }
  });
  if(!Array.isArray(rowanScores)||rowanScores.length!==safeHoles.length||safeHoles.some((_,index)=>finiteScore(rowanScores[index])===null)){
    throw new Error('Round Chronicle requires one valid Rowan score per hole');
  }
  if(!Array.isArray(holeScores)||holeScores.length>safeHoles.length)throw new Error('Invalid player score sequence');
  if(!Number.isInteger(holeIndex)||holeIndex<0||holeIndex>=safeHoles.length)throw new Error('Invalid active hole');
  if(!Number.isInteger(strokes)||strokes<0)throw new Error('Invalid live stroke count');

  let completedCount=0;
  while(completedCount<safeHoles.length&&finiteScore(holeScores?.[completedCount])!==null)completedCount++;
  for(let index=completedCount;index<holeScores.length;index++){
    if(holeScores[index]!==undefined&&holeScores[index]!==null)throw new Error('Player scores must post in hole order');
  }
  if(roundComplete&&completedCount!==safeHoles.length)throw new Error('Incomplete round cannot be final');
  const final=Boolean(roundComplete);
  const activeIndex=holeIndex;
  const liveStrokes=strokes;
  if(final&&(activeIndex!==safeHoles.length-1||liveStrokes!==finiteScore(holeScores[activeIndex]))){
    throw new Error('Final Chronicle must describe the posted closing hole');
  }
  if(!final&&completedCount!==activeIndex)throw new Error('Live Chronicle requires the active unposted hole');
  const fullPar=safeHoles.reduce((sum,hole)=>sum+hole.par,0);
  const parThrough=safeHoles.slice(0,completedCount).reduce((sum,hole)=>sum+hole.par,0);
  const youThrough=safeHoles.slice(0,completedCount).reduce((sum,_,index)=>sum+(finiteScore(holeScores?.[index])??0),0);
  const rowanThrough=safeHoles.slice(0,completedCount).reduce((sum,_,index)=>sum+(finiteScore(rowanScores?.[index])??0),0);
  const margin=rowanThrough-youThrough;

  let matchLabel='ALL SQUARE',matchDetail=completedCount?`THRU ${completedCount}`:'MATCH BEGINS';
  if(final){
    matchLabel=margin>0?'ROUND WON':margin<0?'ROWAN WINS':'MATCH TIED';
    matchDetail=margin===0?`LEVEL AFTER ${safeHoles.length}`:`BY ${Math.abs(margin)} STROKE${Math.abs(margin)===1?'':'S'}`;
  }else if(margin>0){
    matchLabel='YOU LEAD';matchDetail=`${margin} STROKE${margin===1?'':'S'} · THRU ${completedCount}`;
  }else if(margin<0){
    matchLabel='ROWAN LEADS';matchDetail=`${Math.abs(margin)} STROKE${Math.abs(margin)===1?'':'S'} · THRU ${completedCount}`;
  }

  const rows=safeHoles.map((hole,index)=>{
    const posted=index<completedCount;
    const current=!final&&!posted&&index===activeIndex;
    const youScore=posted?finiteScore(holeScores[index]):null;
    const rowanScore=posted?finiteScore(rowanScores[index]):null;
    return freezeRow({
      state:posted?'posted':current?'current':'upcoming',
      number:String(hole.number??index+1).padStart(2,'0'),
      name:String(hole.name||`HOLE ${index+1}`).toUpperCase(),
      yards:holeYards(hole),
      par:hole.par,
      youScore,
      rowanScore,
      youToPar:youScore===null?null:youScore-hole.par,
      rowanToPar:rowanScore===null?null:rowanScore-hole.par,
      youValue:posted?String(youScore):current?'LIVE':'—',
      youDetail:posted?scoreName(youScore,hole.par):current?`STROKE ${liveStrokes+1}`:'UP NEXT',
      rowanValue:posted&&rowanScore!==null?String(rowanScore):'—',
      rowanDetail:posted&&rowanScore!==null?scoreName(rowanScore,Number(hole.par)||0):'PENDING'
    });
  });

  const score=completedCount?relativeScore(youThrough,parThrough):'E';
  const model={
    system:ROUND_CHRONICLE_SPEC.system,
    mode:final?'final':'live',
    stateLabel:final?'ROUND COMPLETE':'ROUND LIVE',
    courseLabel:'COASTAL RIDGE',
    seriesLabel:'COASTAL SERIES · 01',
    progressLabel:final?`${safeHoles.length} / ${safeHoles.length} POSTED`:`HOLE ${String(activeIndex+1).padStart(2,'0')} / ${String(safeHoles.length).padStart(2,'0')}`,
    activeHoleName:final?'ONE MORE ROUND.':safeHoles[activeIndex].name,
    score,
    scoreDetail:completedCount?`${youThrough} STROKES · PAR ${parThrough}`:'NO SCORES POSTED',
    matchLabel,
    matchDetail,
    rows:Object.freeze(rows),
    totals:Object.freeze({
      label:final?'ROUND':'THRU',
      posted:completedCount,
      holes:safeHoles.length,
      par:final?fullPar:parThrough,
      coursePar:fullPar,
      you:completedCount?String(youThrough):'—',
      rowan:completedCount?String(rowanThrough):'—'
    })
  };
  return Object.freeze(model);
}
