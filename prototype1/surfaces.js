const freeze=o=>Object.freeze(o);

/*
  LOFT SURFACE MODEL
  ------------------
  These values are gameplay-calibrated physical properties, not hidden
  difficulty multipliers. The design target is believable golf with readable
  consequences and predictable stopping behavior on mobile.

  rollingDecel: low-speed m/s² rolling resistance on level ground.
  speedDrag: additional turf resistance proportional to speed².
  staticGrade:  slope ratio under which a nearly stopped ball may settle.
  restitution: normal-energy return on first bounce.
  tangentRetain: horizontal/tangential energy retained at impact.
  spinGrip: how strongly contact-point slip is converted into check/release.
  transitionRetain: speed retained when a rolling ball crosses onto the surface.
*/
export const SURFACE_PHYSICS=freeze({
  tee:freeze({
    restitution:.19,
    tangentRetain:.54,
    rollingDecel:1.75,
    speedDrag:.045,
    staticGrade:.22,
    settleSpeed:.075,
    spinGrip:.085,
    transitionRetain:.90,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  fairway:freeze({
    restitution:.17,
    tangentRetain:.52,
    rollingDecel:1.58,
    speedDrag:.052,
    staticGrade:.20,
    settleSpeed:.070,
    spinGrip:.120,
    transitionRetain:.86,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  firstCut:freeze({
    restitution:.12,
    tangentRetain:.42,
    rollingDecel:2.28,
    speedDrag:.065,
    staticGrade:.28,
    settleSpeed:.086,
    spinGrip:.080,
    transitionRetain:.76,
    launchSpeed:.96,
    launchSpin:.86,
    launchBias:.55
  }),
  green:freeze({
    restitution:.11,
    tangentRetain:.47,
    rollingDecel:.72,
    speedDrag:.020,
    staticGrade:.070,
    settleSpeed:.038,
    spinGrip:.240,
    transitionRetain:.88,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  fringe:freeze({
    restitution:.13,
    tangentRetain:.49,
    rollingDecel:1.05,
    speedDrag:.038,
    staticGrade:.115,
    settleSpeed:.052,
    spinGrip:.170,
    transitionRetain:.82,
    launchSpeed:.98,
    launchSpin:.92,
    launchBias:.2
  }),
  rough:freeze({
    restitution:.055,
    tangentRetain:.28,
    rollingDecel:3.65,
    speedDrag:.085,
    staticGrade:.40,
    settleSpeed:.105,
    spinGrip:.050,
    transitionRetain:.64,
    launchSpeed:.90,
    launchSpin:.72,
    launchBias:1.45
  }),
  sand:freeze({
    restitution:.018,
    tangentRetain:.11,
    rollingDecel:6.40,
    speedDrag:.135,
    staticGrade:.62,
    settleSpeed:.125,
    spinGrip:.180,
    transitionRetain:.34,
    launchSpeed:.70,
    launchSpin:.52,
    launchBias:3.1
  }),
  water:freeze({
    restitution:0,
    tangentRetain:0,
    rollingDecel:99,
    speedDrag:0,
    staticGrade:1,
    settleSpeed:1,
    spinGrip:0,
    transitionRetain:0,
    launchSpeed:0,
    launchSpin:0,
    launchBias:0
  })
});

export function surfacePhysics(name){
  return SURFACE_PHYSICS[name]||SURFACE_PHYSICS.rough;
}

export function lieShotModifiers(lie,clubHead){
  const s=surfacePhysics(lie);
  if(lie==='sand'){
    const wedge=clubHead==='wedge';
    return {
      speed:wedge?.82:.66,
      spin:wedge?.84:.48,
      launch:wedge?5.0:3.0
    };
  }
  return {speed:s.launchSpeed,spin:s.launchSpin,launch:s.launchBias};
}

export function surfaceDisplay(name){
  return ({
    tee:'TEE',
    fairway:'FAIRWAY',
    firstCut:'FIRST CUT',
    rough:'ROUGH',
    sand:'BUNKER',
    green:'GREEN',
    fringe:'FRINGE',
    water:'WATER',
    cup:'CUP'
  })[name]||String(name||'').toUpperCase();
}
