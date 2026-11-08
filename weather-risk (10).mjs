// Experimental forecast risk categories. Not a typhoon detection or official warning.
// Rain threshold is hourly precipitation (mm/hour), gust is km/h.
export function assessForecast(hourly, start=0) {
  const gusts=(hourly?.wind_gusts_10m||[]).slice(start,start+24);
  const rains=(hourly?.precipitation||[]).slice(start,start+24);
  const good=v=>typeof v==='number' && Number.isFinite(v) && v>=0;
  const vg=gusts.filter(good), vr=rains.filter(good);
  const gustMax=vg.length?Math.max(...vg):null;
  const rainMax=vr.length?Math.max(...vr):null;
  const rainSum=vr.length?vr.reduce((a,b)=>a+b,0):null;
  // A severe signal can be shown despite some missing hours; a SAFE signal needs coverage.
  let level='unknown';
  if((gustMax!==null&&gustMax>=75)||(rainMax!==null&&rainMax>=20))level='danger';
  else if((gustMax!==null&&gustMax>=50)||(rainMax!==null&&rainMax>=10))level='watch';
  else if(vg.length>=6&&vr.length>=6)level='safe';
  return {level,gustMax,rainMax,rainSum,validGustHours:vg.length,validRainHours:vr.length};
}
