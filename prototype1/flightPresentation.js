// Pure UI policy. No shot-resolution, physics or object ownership.
export function flightHudVisibility(phase,{stopped=false}={}){
  const quiet=phase==='flight'&&!stopped;
  return {round:+!quiet,wind:+!quiet,object:+!quiet,level:+!quiet,map:+!quiet,
    distance:1,context:+!quiet,tip:+!quiet,target:+!quiet};
}
