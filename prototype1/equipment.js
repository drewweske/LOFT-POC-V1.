export const CLUBS=[
{id:'driver',name:'Driver',short:'D',carry:250,launch:12,ballSpeed:79,spin:2600,roll:24,head:'driver',feel:'LONG'},
{id:'wood3',name:'3 Wood',short:'3W',carry:225,launch:14,ballSpeed:68,spin:3300,roll:18,head:'wood',feel:'FLIGHT'},
{id:'hybrid5',name:'5 Hybrid',short:'5H',carry:195,launch:18,ballSpeed:55,spin:4200,roll:12,head:'hybrid',feel:'VERSATILE'},
{id:'iron7',name:'7 Iron',short:'7I',carry:160,launch:21,ballSpeed:44.5,spin:6200,roll:7,head:'iron',feel:'CONTROL'},
{id:'iron9',name:'9 Iron',short:'9I',carry:135,launch:24,ballSpeed:38,spin:7600,roll:5,head:'iron',feel:'PRECISE'},
{id:'pw',name:'Pitching Wedge',short:'PW',carry:115,launch:29,ballSpeed:32.8,spin:9000,roll:3,head:'wedge',feel:'SOFT'},
{id:'sw',name:'Sand Wedge',short:'SW',carry:90,launch:34,ballSpeed:28,spin:10000,roll:2,head:'wedge',feel:'SPIN'},
{id:'putter',name:'Putter',short:'P',carry:25,launch:1.5,ballSpeed:7,spin:0,roll:25,head:'putter',feel:'ROLL'}
];

export const LEVELS={
1:{name:'ROOKIE',form:.18,sway:.11,earlyExt:.11,plane:.20,balance:.48,finish:.58,tempoJitter:.18},
10:{name:'LEARNING',form:.40,sway:.075,earlyExt:.075,plane:.14,balance:.64,finish:.70,tempoJitter:.12},
25:{name:'PLAYER',form:.70,sway:.038,earlyExt:.035,plane:.07,balance:.82,finish:.86,tempoJitter:.06},
50:{name:'MASTERED',form:1,sway:.012,earlyExt:.01,plane:.018,balance:.98,finish:1,tempoJitter:.015}
};

export const DEFAULT_CLUB='iron7';