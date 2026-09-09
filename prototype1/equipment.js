/*
  LOFT OBJECT SYSTEM
  ------------------
  A club is not just a carry number. It is the primary collectible in LOFT, so
  every object owns a model name, construction brief and head silhouette. The
  player level selects a finish tier without changing the trusted shot numbers.
*/
export const CLUBS=[
{id:'driver',name:'Driver',model:'RIDGE D1',short:'D',carry:250,launch:12,loft:'10.5°',ballSpeed:82.8,spin:2600,roll:24,head:'driver',feel:'MAX FLIGHT',story:'A deep coastal crown and broad trailing sole make speed look planted, not loud.'},
{id:'wood3',name:'3 Wood',model:'COAST 3',short:'3W',carry:225,launch:14,loft:'15°',ballSpeed:69.8,spin:3300,roll:18,head:'wood',feel:'PIERCING FLIGHT',story:'A shallow fairway profile with a clean leading edge built to launch from tight turf.'},
{id:'hybrid5',name:'5 Hybrid',model:'CROSS 5',short:'5H',carry:195,launch:18,loft:'22°',ballSpeed:56.7,spin:4200,roll:12,head:'hybrid',feel:'ANY LIE',story:'A compact utility body that carries wood confidence into imperfect lies.'},
{id:'iron7',name:'7 Iron',model:'FIELD 7',short:'7I',carry:160,launch:21,loft:'32°',ballSpeed:45.7,spin:6200,roll:7,head:'iron',feel:'CONTROL',story:'A confident mid-iron with a readable topline, grounded sole and honest cavity structure.'},
{id:'iron9',name:'9 Iron',model:'FIELD 9',short:'9I',carry:135,launch:24,loft:'41°',ballSpeed:40.8,spin:7600,roll:5,head:'iron',feel:'PRECISION',story:'A compact scoring profile that puts face, turf entry and distance control first.'},
{id:'pw',name:'Pitching Wedge',model:'TOUCH P',short:'PW',carry:115,launch:29,loft:'46°',ballSpeed:36.8,spin:9000,roll:3,head:'wedge',feel:'SOFT FLIGHT',story:'A softened toe and deliberate sole radius make finesse visible before the swing.'},
{id:'sw',name:'Sand Wedge',model:'TOUCH S',short:'SW',carry:90,launch:34,loft:'56°',ballSpeed:31.5,spin:10000,roll:2,head:'wedge',feel:'CHECK + SPIN',story:'A wider relief sole and high-toe face give sand and short grass their own tool.'},
{id:'putter',name:'Putter',model:'LINE 01',short:'P',carry:25,launch:0,loft:'3°',ballSpeed:5.4,spin:0,roll:25,head:'putter',feel:'TRUE ROLL',story:'A low, quiet alignment object designed around one clear start line.'}
];

export const EQUIPMENT_TIERS=Object.freeze({
  1:{id:'foundation',name:'FOUNDATION',finish:'BRUSHED STONE',material:'UTILITY STEEL',construction:'ONE-PIECE CAST',process:'BROAD SOLE · EXPOSED SEAM',accent:'STONE',signal:false,designLevel:1},
  10:{id:'field',name:'FIELD',finish:'SILVER SATIN',material:'REFINED STEEL',construction:'CLEAN CAST + INSERT',process:'TUNED SOLE · CLEAN EDGE',accent:'CREAM',signal:false,designLevel:2},
  25:{id:'tour',name:'TOUR',finish:'SMOKED CHROME',material:'FORGED CHROME',construction:'COMPACT FORGED BODY',process:'MACHINED CAVITY · THIN TOPLINE',accent:'INK',signal:true,designLevel:3},
  50:{id:'signature',name:'SIGNATURE',finish:'BLACK TITANIUM',material:'CARBON + TITANIUM',construction:'MULTI-MATERIAL CHASSIS',process:'CARBON BRIDGE · TUNGSTEN PORT',accent:'ORANGE',signal:true,designLevel:4},
  75:{id:'icon',name:'ICON',finish:'PEARL CERAMIC',material:'CERAMIC + TITANIUM',construction:'CERAMIC MONO-SHELL',process:'FLOATING FACE · SIGNATURE WEIGHT',accent:'SIGNAL ORANGE',signal:true,designLevel:5}
});

export const CLUB_PRESENTATION_PROFILES=Object.freeze({
  driver:Object.freeze({power:96,control:66,spin:48,forgiveness:88}),
  wood3:Object.freeze({power:89,control:73,spin:58,forgiveness:84}),
  hybrid5:Object.freeze({power:79,control:82,spin:67,forgiveness:90}),
  iron7:Object.freeze({power:70,control:88,spin:80,forgiveness:82}),
  iron9:Object.freeze({power:61,control:92,spin:89,forgiveness:78}),
  pw:Object.freeze({power:54,control:94,spin:95,forgiveness:76}),
  sw:Object.freeze({power:46,control:91,spin:99,forgiveness:72}),
  putter:Object.freeze({power:20,control:99,spin:32,forgiveness:96})
});

export function clubPresentationProfile(clubOrId){
  const id=typeof clubOrId==='string'?clubOrId:clubOrId?.id;
  return CLUB_PRESENTATION_PROFILES[id]||CLUB_PRESENTATION_PROFILES.iron7;
}

export const LEVELS={
  1:{name:'DEVELOPING',grade:'FOUNDATION',form:.14,sway:.16,earlyExt:.17,plane:.28,balance:.42,finish:.46,tempoJitter:.22},
  10:{name:'GROOVED',grade:'FIELD',form:.38,sway:.10,earlyExt:.105,plane:.18,balance:.61,finish:.65,tempoJitter:.13},
  25:{name:'TOUR READY',grade:'TOUR',form:.70,sway:.045,earlyExt:.045,plane:.075,balance:.82,finish:.86,tempoJitter:.06},
  50:{name:'SIGNATURE',grade:'SIGNATURE',form:1,sway:.010,earlyExt:.008,plane:.015,balance:.99,finish:1,tempoJitter:.012},
  75:{name:'ICONIC',grade:'ICON',form:1,sway:.004,earlyExt:.004,plane:.006,balance:1,finish:1,tempoJitter:.004}
};

export function equipmentTier(level=1){
  const levels=Object.keys(EQUIPMENT_TIERS).map(Number).sort((a,b)=>a-b);
  let chosen=levels[0];
  for(const n of levels)if(level>=n)chosen=n;
  return EQUIPMENT_TIERS[chosen];
}

export const DEFAULT_CLUB='iron7';
