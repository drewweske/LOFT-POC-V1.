export const ROUND_HOLES=[
  {
    number:1,
    name:'THE RIDGE',
    series:'COASTAL SERIES',
    par:3,
    tee:[0.46,0],
    pin:[2.50,-156.36],
    wind:[3.13,0],
    windLabel:'7 MPH ↠'
  },
  {
    number:2,
    name:'THE SHELF',
    series:'COASTAL SERIES',
    par:3,
    tee:[-8,10],
    pin:[12,-170],
    wind:[-2.24,-0.55],
    windLabel:'5 MPH ↞'
  },
  {
    number:3,
    name:'LIGHTHOUSE',
    series:'COASTAL SERIES',
    par:4,
    tee:[8,18],
    pin:[-8,-218],
    wind:[1.75,-1.40],
    windLabel:'6 MPH ↘'
  }
];

export const ROWAN_SCORES=[3,3,4];

export function holeYards(h){
  const dx=h.pin[0]-h.tee[0],dz=h.pin[1]-h.tee[1];
  return Math.round(Math.hypot(dx,dz)/0.9144);
}

export function scoreName(strokes,par){
  if(strokes===1)return'ACE';
  const d=strokes-par;
  if(d<=-3)return'ALBATROSS';
  if(d===-2)return'EAGLE';
  if(d===-1)return'BIRDIE';
  if(d===0)return'PAR';
  if(d===1)return'BOGEY';
  if(d===2)return'DOUBLE';
  return d>0?'+'+d:String(d);
}

export function relativeScore(total,parTotal){
  const d=total-parTotal;
  if(d===0)return'E';
  return d>0?'+'+d:String(d);
}
