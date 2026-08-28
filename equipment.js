export const CLUBS = {
  driver: {
    id:'driver', label:'Driver', short:'D', family:'WOOD', grade:'CORE', carry:250,
    launch:12, ballSpeed:79.3, spin:2600, windFactor:1.0, roll:24,
    feel:'LONG', material:'MATTE GRAPHITE', head:'driver'
  },
  wood3: {
    id:'wood3', label:'3 Wood', short:'3W', family:'WOOD', grade:'CORE', carry:225,
    launch:14, ballSpeed:67.8, spin:3300, windFactor:.98, roll:18,
    feel:'FLIGHT', material:'MATTE GRAPHITE', head:'wood'
  },
  hybrid5: {
    id:'hybrid5', label:'5 Hybrid', short:'5H', family:'HYBRID', grade:'CORE', carry:195,
    launch:18, ballSpeed:55.1, spin:4200, windFactor:.96, roll:12,
    feel:'VERSATILE', material:'DARK PVD', head:'hybrid'
  },
  iron7: {
    id:'iron7', label:'7 Iron', short:'7I', family:'IRON', grade:'CORE', carry:160,
    launch:21, ballSpeed:44.4, spin:6200, windFactor:.93, roll:7,
    feel:'CONTROL', material:'BEAD-BLASTED STEEL', head:'iron'
  },
  iron9: {
    id:'iron9', label:'9 Iron', short:'9I', family:'IRON', grade:'CORE', carry:135,
    launch:24, ballSpeed:37.9, spin:7600, windFactor:.90, roll:5,
    feel:'PRECISE', material:'BEAD-BLASTED STEEL', head:'iron'
  },
  pw: {
    id:'pw', label:'Pitching Wedge', short:'PW', family:'WEDGE', grade:'CORE', carry:115,
    launch:29, ballSpeed:32.7, spin:9000, windFactor:.86, roll:3,
    feel:'SOFT', material:'BRUSHED STEEL', head:'wedge'
  },
  sw: {
    id:'sw', label:'Sand Wedge', short:'SW', family:'WEDGE', grade:'CORE', carry:90,
    launch:34, ballSpeed:28.0, spin:10000, windFactor:.82, roll:2,
    feel:'SPIN', material:'BRUSHED STEEL', head:'wedge'
  },
  putter: {
    id:'putter', label:'Putter', short:'P', family:'PUTTER', grade:'CORE', carry:25,
    launch:1.5, ballSpeed:7.0, spin:0, windFactor:0, roll:25,
    feel:'ROLL', material:'INK + CREAM INSERT', head:'putter'
  }
};

export const BALLS = {
  core01: {
    id:'core01', label:'CORE 01', grade:'CORE', role:'BALANCED', speed:1, spin:1, wind:1,
    material:'SCORECARD CREAM'
  },
  forged02: {
    id:'forged02', label:'FORGED 02', grade:'FORGED', role:'CONTROL', speed:.99, spin:1.08, wind:.88,
    material:'STONE + CREAM'
  },
  tour03: {
    id:'tour03', label:'TOUR 03', grade:'TOUR', role:'FLIGHT', speed:1.02, spin:.92, wind:.94,
    material:'CREAM + MICRO ORANGE'
  }
};

export const LEVELS = {
  1: {
    name:'ROOKIE', form:.18, sway:.16, earlyExt:.13, plane:.28, finish:.54, balance:.46,
    addressSlouch:.09, tempoJitter:.18
  },
  10: {
    name:'LEARNING', form:.38, sway:.11, earlyExt:.09, plane:.19, finish:.67, balance:.61,
    addressSlouch:.06, tempoJitter:.12
  },
  25: {
    name:'PLAYER', form:.68, sway:.055, earlyExt:.045, plane:.09, finish:.84, balance:.81,
    addressSlouch:.025, tempoJitter:.06
  },
  50: {
    name:'MASTERED', form:1, sway:.018, earlyExt:.012, plane:.025, finish:1, balance:.98,
    addressSlouch:0, tempoJitter:.015
  }
};