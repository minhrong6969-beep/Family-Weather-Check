import {dateAge, severityRank} from './core.mjs';

export const FLOAT_KEY = 'family_weather_floating_group_open_v1';
const MAX_FORECAST_AGE = 3 * 3600 * 1000;
const TEST_DISPLAY_AGE = 2 * 3600 * 1000;
const valid = new Set(['clear', 'watch', 'high', 'severe']);

/** Return a transparent status: unknown, forecast, or TEST. Never claim safety without data. */
export function getFloatingMemberStatus(member, {alerts = [], forecast = {}, meId = ''} = {}, at = Date.now()) {
  const unknown = {level:'unknown', source:'unknown', updatedAt:null};
  if (!member || typeof member.id !== 'string') return unknown;
  if (member.kind === 'bot') return {
    level: valid.has(member.sim) ? member.sim : 'unknown',
    source:'test', updatedAt:null
  };

  // A recent User Mode test overrides the visual badge for up to two hours,
  // and is ALWAYS marked TEST (never presented as observed weather).
  const recentTest = alerts.filter(a => a?.simulation === true && a.memberId === member.id
    && valid.has(a.level) && Date.parse(a.createdAt) <= at
    && at - Date.parse(a.createdAt) >= 0
    && at - Date.parse(a.createdAt) < TEST_DISPLAY_AGE)
    .sort((a,b)=> Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
  if (recentTest) return {level:recentTest.level, source:'test', updatedAt:recentTest.createdAt};

  const live = member.weatherSnapshot;
  if (live && valid.has(live.risk) && Number.isFinite(Date.parse(live.updatedAt))
      && at - Date.parse(live.updatedAt) >= 0 && at - Date.parse(live.updatedAt) < MAX_FORECAST_AGE) {
    return {level:live.risk, source:'forecast', updatedAt:live.updatedAt};
  }
  const gps = member.id === meId ? member.gps : null;
  const key = gps && Number.isFinite(gps.lat) && Number.isFinite(gps.lon)
    && dateAge(gps.updatedAt) < 2*3600*1000
    ? `gps:${member.id}:${gps.lat.toFixed(3)},${gps.lon.toFixed(3)}` : member.cityId;
  const f = forecast[key];
  if (f && valid.has(f.risk) && Number.isFinite(Date.parse(f.at))
      && at-Date.parse(f.at) >= 0 && at-Date.parse(f.at) < MAX_FORECAST_AGE) {
    return {level:f.risk, source:'forecast', updatedAt:f.at};
  }
  return unknown;
}

export function getFloatingMembers(group, forecast, meId, at = Date.now()) {
  const items = Array.isArray(group?.members) ? group.members : [];
  return items.map((m,idx)=>({...getFloatingMemberStatus(m,{alerts:group.alerts,forecast,meId},at),member:m,order:idx}))
    .sort((a,b)=>{
      // danger first, warning second, unknown next, safe last
      const tier = x => x.level==='severe'||x.level==='high' ? 0 : x.level==='watch' ? 1 : x.level==='unknown' ? 2 : 3;
      return tier(a)-tier(b) || severityRank(b.level)-severityRank(a.level) || a.order-b.order;
    });
}
