// The Stroke, scaled to the shot at hand. Pure functions shared by gameplay,
// distance instruments and the deterministic putting Gauntlet.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function puttPaceFromPull(px,height,cupFeet=20){
  const norm=clamp(Math.max(0,px)/(clamp(height,280,1100)*.25),0,1.10);
  // An edge tap gets generous thumb travel; a long lag retains the full range.
  // No automatic aim, minimum pace, or snap-to-hole. Depth still owns distance.
  const rangeFeet=clamp(Math.max(0,cupFeet)*2.7+1.5,2,55);
  return {norm,feet:rangeFeet*Math.pow(norm,1.45),rangeFeet};
}

export function puttingDistance(meters){
  const feet=Math.max(0,Number.isFinite(meters)?meters:0)/.3048;
  if(feet<1)return {value:String(Math.max(1,Math.round(feet*12))),unit:'IN'};
  return {value:feet<10?String(Math.round(feet*10)/10):String(Math.round(feet)),unit:'FT'};
}

export function puttContactProfile(paceFeet,quality){
  const energy=clamp(Math.sqrt(Math.max(0,paceFeet)/18),.12,1);
  const q=clamp(quality,0,1);
  return {energy,hitStop:.004+.008*energy,compression:.06+.16*energy,
    cameraImpulse:(.035+.10*energy)*(.8+.2*q)};
}

// Clubhead backstroke grows with launch speed, not maximum gesture depth.
export const puttStrokeScale=paceFeet=>clamp(.035*Math.sqrt(Math.max(0,paceFeet))/.24,0,1.3);
