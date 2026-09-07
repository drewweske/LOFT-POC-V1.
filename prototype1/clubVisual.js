/*
  LOFT CLUB OBJECT DRAWINGS
  -------------------------
  Pure SVG product drawings for the Workshop. These are intentionally kept
  separate from gameplay: they inspect the same trusted club records while
  expressing category and equipment-grade construction at collectible scale.
*/

const number=n=>Number(n.toFixed(2));
const safe=value=>String(value).replace(/[^a-z0-9_-]+/gi,'-').toLowerCase();

function longHead(club,tier){
  const t=tier.designLevel;
  const family=club.head;
  const familySize=family==='driver' ? 1 : (family==='wood' ? .90 : .82);
  const rear=number(78+(1-familySize)*34+(t-1)*3.4);
  const crown=number(91+(1-familySize)*19+(t-1)*2.4);
  const floor=number(202-(1-familySize)*13-(t-1)*1.5);
  const toe=number(288-(1-familySize)*14-(t-1)*1.8);
  const waist=t>=4?15:t>=3?9:3;
  const body=`M ${rear} ${number(139-waist*.18)} C ${number(rear+20)} ${crown}, ${number(toe-53)} ${number(crown-12)}, ${toe} ${number(crown+31)} C ${number(toe+9)} ${number(crown+52)}, ${number(toe-12)} ${number(floor-9)}, ${number(toe-52)} ${floor} C ${number(toe-106)} ${number(floor+8)}, ${number(rear+15)} ${number(floor-12)}, ${number(rear-7)} ${number(floor-43)} C ${number(rear-14)} ${number(floor-62)}, ${number(rear-7+waist)} ${number(crown+61)}, ${rear} ${number(139-waist*.18)} Z`;
  const impact=`M ${number(toe-28)} ${number(crown+17)} C ${number(toe+1)} ${number(crown+27)}, ${number(toe+6)} ${number(crown+51)}, ${number(toe-14)} ${number(floor-18)} L ${number(toe-34)} ${number(floor-9)} C ${number(toe-21)} ${number(floor-38)}, ${number(toe-20)} ${number(crown+42)}, ${number(toe-28)} ${number(crown+17)} Z`;
  const parts=[
    `<path class="club-silhouette" d="${body}"/>`,
    `<path class="club-impact" d="${impact}"/>`,
    `<path class="club-structure" d="M ${number(rear+13)} ${number(floor-34)} C ${number(rear+58)} ${number(floor+2)}, ${number(toe-73)} ${number(floor+2)}, ${number(toe-25)} ${number(floor-21)}"/>`
  ];
  if(t===1){
    parts.push(`<path class="club-wear" d="M ${number(rear+36)} ${number(floor-13)} l 25 4 M ${number(rear+72)} ${number(floor-7)} l 18 1"/>`);
  }
  if(t>=2){
    parts.push(`<path class="club-structure" d="M ${number(rear+23)} ${number(crown+25)} C ${number(rear+66)} ${number(crown+1)}, ${number(toe-78)} ${number(crown+3)}, ${number(toe-39)} ${number(crown+24)}"/>`);
  }
  if(t>=3){
    parts.push(`<path class="club-hardware" d="M ${number(rear+49)} ${number(floor-32)} C ${number(rear+90)} ${number(floor-17)}, ${number(toe-81)} ${number(floor-16)}, ${number(toe-44)} ${number(floor-31)} L ${number(toe-55)} ${number(floor-18)} C ${number(rear+92)} ${number(floor-7)}, ${number(rear+62)} ${number(floor-10)}, ${number(rear+38)} ${number(floor-23)} Z"/>`);
  }
  if(t>=4){
    parts.push(`<path class="club-insert" d="M ${number(rear+49)} ${number(crown+24)} C ${number(rear+84)} ${number(crown+2)}, ${number(toe-88)} ${number(crown+5)}, ${number(toe-52)} ${number(crown+25)} C ${number(toe-85)} ${number(crown+41)}, ${number(rear+80)} ${number(crown+42)}, ${number(rear+49)} ${number(crown+24)} Z"/>`);
    parts.push(`<circle class="club-signal" cx="${number(toe-62)}" cy="${number(floor-26)}" r="5.2"/>`);
  }
  if(t>=5){
    parts.push(`<path class="club-ceramic" d="M ${number(rear+68)} ${number(crown+27)} C ${number(rear+97)} ${number(crown+10)}, ${number(toe-93)} ${number(crown+12)}, ${number(toe-64)} ${number(crown+28)} C ${number(toe-93)} ${number(crown+36)}, ${number(rear+94)} ${number(crown+38)}, ${number(rear+68)} ${number(crown+27)} Z"/>`);
    parts.push(`<path class="club-machine" d="M ${number(rear+59)} ${number(floor-51)} C ${number(rear+93)} ${number(floor-34)}, ${number(toe-88)} ${number(floor-34)}, ${number(toe-53)} ${number(floor-49)} M ${number(rear+70)} ${number(floor-40)} C ${number(rear+99)} ${number(floor-27)}, ${number(toe-92)} ${number(floor-27)}, ${number(toe-63)} ${number(floor-39)}"/>`);
  }
  return parts.join('');
}

function ironHead(club,tier){
  const t=tier.designLevel;
  const wedge=club.head==='wedge';
  const sand=club.id==='sw';
  const shortIron=club.id==='iron9';
  const compact=(t-1)*3.6+(shortIron?3:0);
  const heel=number(83+compact);
  const toe=number(286-compact*.62-(wedge?0:4));
  const top=number((wedge?63:72)+compact*.30-(sand?5:0));
  const sole=number(210-compact*.14+(wedge?8:0)+(sand?4:0));
  const shoulder=number(top+(wedge?19:9));
  const body=`M ${heel} ${number(top+27)} L ${number(toe-25)} ${top} Q ${toe} ${number(top+5)} ${number(toe+4)} ${shoulder} L ${number(toe-2)} ${number(sole-31)} Q ${number(toe-18)} ${sole} ${number(heel+22)} ${number(sole-5)} L ${number(heel-7)} ${number(sole-31)} Z`;
  const cavity=`M ${number(heel+24)} ${number(top+34)} L ${number(toe-34)} ${number(top+16)} Q ${number(toe-18)} ${number(top+20)} ${number(toe-18)} ${number(top+33)} L ${number(toe-28)} ${number(sole-48)} Q ${number(toe-69)} ${number(sole-27)} ${number(heel+31)} ${number(sole-42)} Z`;
  const parts=[
    `<path class="club-silhouette" d="${body}"/>`,
    `<path class="club-impact" d="${cavity}"/>`,
    `<path class="club-structure" d="M ${number(heel+13)} ${number(sole-26)} Q ${number(heel+83)} ${number(sole-1)} ${number(toe-20)} ${number(sole-33)}"/>`
  ];
  const lineCount=wedge?(t+3):(t+2);
  for(let i=0;i<lineCount;i++){
    const y=number(top+48+i*8.2);
    const x1=number(heel+32+i*.6);
    const x2=number(toe-33-i*1.5);
    parts.push(`<path class="club-machine" d="M ${x1} ${y} L ${x2} ${number(y-9)}"/>`);
  }
  if(t===1){
    parts.push(`<path class="club-wear" d="M ${number(heel+48)} ${number(sole-17)} l 27 5 M ${number(toe-75)} ${number(sole-13)} l 20 -3"/>`);
  }
  if(t>=2){
    parts.push(`<path class="club-structure" d="M ${number(heel+31)} ${number(top+30)} Q ${number(heel+92)} ${number(top+4)} ${number(toe-35)} ${number(top+17)}"/>`);
  }
  if(t>=3){
    parts.push(`<path class="club-hardware" d="M ${number(heel+42)} ${number(sole-57)} Q ${number(heel+98)} ${number(sole-31)} ${number(toe-44)} ${number(sole-53)} L ${number(toe-54)} ${number(sole-38)} Q ${number(heel+98)} ${number(sole-20)} ${number(heel+34)} ${number(sole-47)} Z"/>`);
  }
  if(t>=4){
    parts.push(`<path class="club-insert" d="M ${number(heel+53)} ${number(top+38)} L ${number(toe-55)} ${number(top+24)} Q ${number(toe-40)} ${number(top+28)} ${number(toe-45)} ${number(top+42)} L ${number(toe-58)} ${number(sole-59)} Q ${number(heel+98)} ${number(sole-40)} ${number(heel+51)} ${number(sole-55)} Z"/>`);
    parts.push(`<circle class="club-signal" cx="${number(toe-56)}" cy="${number(sole-50)}" r="5"/>`);
  }
  if(t>=5){
    parts.push(`<path class="club-ceramic" d="M ${number(heel+65)} ${number(top+42)} L ${number(toe-67)} ${number(top+29)} L ${number(toe-72)} ${number(sole-66)} Q ${number(heel+101)} ${number(sole-51)} ${number(heel+63)} ${number(sole-61)} Z"/>`);
    parts.push(`<path class="club-machine" d="M ${number(heel+64)} ${number(sole-72)} Q ${number(heel+104)} ${number(sole-52)} ${number(toe-72)} ${number(sole-70)} M ${number(heel+72)} ${number(sole-62)} Q ${number(heel+106)} ${number(sole-48)} ${number(toe-80)} ${number(sole-61)}"/>`);
  }
  return parts.join('');
}

function putterHead(_club,tier){
  const t=tier.designLevel;
  const parts=[];
  if(t<=3){
    const inset=(t-1)*8;
    parts.push(`<path class="club-silhouette" d="M ${number(58+inset)} 135 L ${number(286-inset)} ${number(130+(t-1)*3)} Q ${number(300-inset)} 132 ${number(296-inset)} 164 L ${number(290-inset)} 181 L ${number(62+inset)} 184 Q ${number(45+inset)} 179 ${number(48+inset)} 151 Z"/>`);
    parts.push(`<path class="club-impact" d="M ${number(56+inset)} 137 L ${number(291-inset)} ${number(133+(t-1)*3)} L ${number(290-inset)} 150 L ${number(54+inset)} 154 Z"/>`);
    parts.push(`<path class="club-structure" d="M 158 150 L 158 179 M 166 150 L 166 179"/>`);
    if(t===1)parts.push(`<path class="club-wear" d="M 83 176 l 36 2 M 216 175 l 27 -2"/>`);
    if(t>=2)parts.push(`<path class="club-structure" d="M ${number(82+inset)} 163 L ${number(263-inset)} 160"/>`);
    if(t>=3){
      parts.push(`<path class="club-hardware" d="M ${number(72+inset)} 157 H ${number(118+inset)} V 176 H ${number(76+inset)} Z M ${number(220-inset)} 155 H ${number(271-inset)} L ${number(267-inset)} 174 H ${number(222-inset)} Z"/>`);
      parts.push(`<path class="club-machine" d="M 122 142 v 10 M 132 141 v 11 M 142 141 v 11 M 183 140 v 11 M 193 140 v 10 M 203 139 v 10"/>`);
    }
  }else{
    const icon=t===5;
    const left=icon?59:67,right=icon?291:283;
    parts.push(`<path class="club-silhouette" d="M ${left} 174 L ${number(left+4)} 143 Q ${number(left+12)} 116 111 112 L 151 128 L 141 151 L 111 139 Q 94 140 92 158 L 91 174 Z M 197 128 L 235 112 Q ${number(right-8)} 115 ${right} 143 L ${number(right+2)} 174 L ${number(right-31)} 174 L ${number(right-34)} 157 Q ${number(right-38)} 139 ${number(right-56)} 139 L 207 151 Z"/>`);
    parts.push(`<path class="club-impact" d="M ${number(left-7)} 166 Q 171 157 ${number(right+7)} 166 L ${number(right+4)} 188 Q 171 197 ${number(left-4)} 188 Z"/>`);
    parts.push(`<path class="club-insert" d="M 151 126 H 196 L 207 173 H 140 Z"/>`);
    parts.push(`<path class="club-structure" d="M 171 132 V 185 M 98 158 Q 121 145 145 158 M 202 158 Q 228 145 254 158"/>`);
    parts.push(`<circle class="club-signal" cx="173" cy="142" r="5"/>`);
    if(icon){
      parts.push(`<path class="club-ceramic" d="M 78 146 Q 86 126 112 123 L 143 134 L 137 146 L 110 137 Q 96 138 92 151 Z M 205 134 L 235 123 Q 260 125 273 146 L 258 151 Q 252 137 236 137 L 211 146 Z"/>`);
      parts.push(`<path class="club-machine" d="M 75 179 Q 111 188 145 179 M 201 179 Q 236 188 274 179 M 91 128 Q 118 113 145 126 M 204 126 Q 235 112 263 129"/>`);
    }
  }
  return parts.join('');
}

function headDrawing(club,tier){
  if(club.head==='putter')return putterHead(club,tier);
  if(club.head==='driver'||club.head==='wood'||club.head==='hybrid')return longHead(club,tier);
  return ironHead(club,tier);
}

export function clubArtSvg(club,{tier,hero=false,instance='object'}={}){
  if(!club||!tier)throw new Error('clubArtSvg requires club and tier');
  const uid=safe(`${instance}-${club.id}-${tier.id}`);
  const bodyGradient=`body-${uid}`;
  const faceGradient=`face-${uid}`;
  const shadowGradient=`shadow-${uid}`;
  const t=tier.designLevel;
  const headAnchor=club.head==='putter'?(tier.designLevel>=4?{x:155,y:125}:{x:102,y:131}):club.head==='driver'||club.head==='wood'||club.head==='hybrid'?{x:92,y:130}:{x:94,y:120};
  const shaftStart=hero?{x:41,y:-18}:{x:36,y:-12};
  const shaft=`<path class="club-shaft" d="M ${shaftStart.x} ${shaftStart.y} L ${headAnchor.x} ${headAnchor.y}"/>`;
  const hosel=`<path class="club-hosel" d="M ${number(headAnchor.x-4)} ${number(headAnchor.y-7)} L ${number(headAnchor.x+7)} ${number(headAnchor.y+13)}"/>`;
  const shadow=hero?`<ellipse class="club-shadow" cx="174" cy="224" rx="111" ry="15" fill="url(#${shadowGradient})"/>`:'';
  const detail=t>=3?`<path class="club-blueprint" d="M 24 219 H 302 M 27 225 H 186"/>`:'';
  return `<svg viewBox="0 0 320 250" role="img" aria-label="${club.model} ${tier.name} club object" data-loft-system="LOFT_CLUB_OBJECT_V2" data-family="${club.head}" data-tier="${tier.id}" data-design-level="${t}">
    <defs>
      <linearGradient id="${bodyGradient}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--tier-body-hi)"/><stop offset=".48" stop-color="var(--tier-body)"/><stop offset="1" stop-color="var(--tier-body-low)"/></linearGradient>
      <linearGradient id="${faceGradient}" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="var(--tier-face-hi)"/><stop offset="1" stop-color="var(--tier-face)"/></linearGradient>
      <radialGradient id="${shadowGradient}"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    ${detail}${shadow}${shaft}${hosel}<g class="club-head-object" style="--club-body-gradient:url(#${bodyGradient});--club-face-gradient:url(#${faceGradient})">${headDrawing(club,tier)}</g>
  </svg>`;
}

export function clubArtGeometrySignature(markup){
  return [...String(markup).matchAll(/<(?:path|circle|ellipse|polygon|rect)\b[^>]*>/g)]
    .map(match=>match[0]
      .replace(/\s(?:class|fill|stroke|id|opacity|aria-label)="[^"]*"/g,'')
      .replace(/\s+/g,' ')
      .trim())
    .join('|');
}

export function clubArtPrimitiveCount(markup){
  return [...String(markup).matchAll(/<(?:path|circle|ellipse|polygon|rect)\b/g)].length;
}
