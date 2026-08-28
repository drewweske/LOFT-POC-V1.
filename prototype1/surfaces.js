const freeze=o=>Object.freeze(o);

/*
  LOFT SURFACE MODEL
  ------------------
  These values are gameplay-calibrated physical properties, not hidden
  difficulty multipliers. The design target is believable golf with readable
  consequences and predictable stopping behavior on mobile.

  rollingDecel: m/s² of rolling resistance on level ground.
  staticGrade:  slope ratio under which a nearly stopped ball may settle.
  restitution: normal-energy return on first bounce.
  tangentRetain: horizontal/tangential energy retained at impact.
  spinGrip: how strongly contact-point slip is converted into check/release.
  transitionRetain: speed retained when a rolling ball crosses onto the surface.
*/
export const SURFACE_PHYSICS=freeze({
  tee:freeze({
    restitution:.19,
    tangentRetain:.67,
    rollingDecel:1.75,
    staticGrade:.18,
    settleSpeed:.075,
    spinGrip:.065,
    transitionRetain:.90,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  fairway:freeze({
    restitution:.17,
    tangentRetain:.64,
    rollingDecel:1.58,
    staticGrade:.16,
    settleSpeed:.070,
    spinGrip:.090,
    transitionRetain:.86,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  green:freeze({
    restitution:.11,
    tangentRetain:.61,
    rollingDecel:.72,
    staticGrade:.052,
    settleSpeed:.038,
    spinGrip:.150,
    transitionRetain:.88,
    launchSpeed:1,
    launchSpin:1,
    launchBias:0
  }),
  fringe:freeze({
    restitution:.13,
    tangentRetain:.59,
    rollingDecel:1.05,
    staticGrade:.085,
    settleSpeed:.052,
    spinGrip:.115,
    transitionRetain:.82,
    launchSpeed:.98,
    launchSpin:.92,
    launchBias:.2
  }),
  rough:freeze({
    restitution:.055,
    tangentRetain:.34,
    rollingDecel:3.65,
    staticGrade:.34,
    settleSpeed:.105,
    spinGrip:.035,
    transitionRetain:.64,
    launchSpeed:.90,
    launchSpin:.72,
    launchBias:1.45
  }),
  sand:freeze({
    restitution:.018,
    tangentRetain:.18,
    rollingDecel:6.40,
    staticGrade:.62,
    settleSpeed:.125,
    spinGrip:.115,
    transitionRetain:.34,
    launchSpeed:.70,
    launchSpin:.52,
    launchBias:3.1
  }),
  water:freeze({
    restitution:0,
    tangentRetain:0,
    rollingDecel:99,
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
    rough:'ROUGH',
    sand:'BUNKER',
    green:'GREEN',
    fringe:'FRINGE',
    water:'WATER',
    cup:'CUP'
  })[name]||String(name||'').toUpperCase();
}
