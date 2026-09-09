// Field-instrument marks are geometry, never font-fallback glyphs.
const ICON_PATHS=Object.freeze({
  arrow:'M4 12h15M13 6l6 6-6 6',
  expand:'M6 18 18 6M7 6h11v11',
  close:'m6 6 12 12M18 6 6 18'
});

export function uiIconMarkup(kind='arrow',rotation=0){
  const path=ICON_PATHS[kind]||ICON_PATHS.arrow;
  const angle=Number.isFinite(rotation)?rotation:0;
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}" transform="rotate(${angle} 12 12)"/></svg>`;
}

export function windReadoutMarkup(label='0 MPH'){
  const text=String(label),speed=text.match(/\d+(?:\.\d+)?\s*MPH/i)?.[0]||'0 MPH';
  // Keep the authored direction label, while rendering its meaning as a path.
  const direction=text.trim().codePointAt(text.trim().length-1);
  const angles={0x2192:0,0x21a0:0,0x2198:45,0x2193:90,0x2199:135,0x2190:180,0x219e:180,0x2196:225,0x2191:270,0x2197:315};
  return `${speed.toUpperCase()}${uiIconMarkup('arrow',angles[direction]??0)}`;
}
