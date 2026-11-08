/* Scheduled monitoring for small, non-safety-critical family groups. Data is
   sourced from Open-Meteo forecast models. No official typhoon track claims.
   On Netlify production runs hourly; no browser need be open. */
import {CITIES,riskFromForecast,locationEffective,severityRank} from '../assets/core.mjs';
const cityMap=Object.fromEntries(CITIES.map(c=>[c.id,c]));
const STORE='family-weather-groups-v2';
const strong=(store,key)=>store.getWithMetadata(key,{type:'json',consistency:'strong'});
async function updateSnapshot(store,key,results){for(let attempt=0;attempt<4;attempt++){
 const rec=await strong(store,key);if(!rec||rec.data.deleted)return;const g=structuredClone(rec.data);let touched=false;
 for(const m of g.members){if(m.kind==='bot')continue;const snapshot=results.get(m.id);if(!snapshot)continue;
 m.weatherSnapshot=snapshot;touched=true;
 if(severityRank(snapshot.risk)<1)continue;
 const recent=g.alerts.find(a=>!a.simulation&&a.memberId===m.id&&a.level===snapshot.risk&&Date.now()-Date.parse(a.createdAt)<6*3600*1000);
 if(recent)continue;
 g.alerts.unshift({id:crypto.randomUUID(),memberId:m.id,memberName:m.name,cityId:m.cityId,level:snapshot.risk,wind:snapshot.gust,rain:snapshot.rain,actor:'weather-worker',simulation:false,source:'Open-Meteo',forecastHorizonHours:12,createdAt:new Date().toISOString()});
 }
 if(!touched)return;
 g.alerts=g.alerts.slice(0,60);
 const save=await store.setJSON(key,g,{onlyIfMatch:rec.etag});if(save.modified)return;
 }
}
export async function monitorGroups(store,fetchForecast=fetch){
 const list=await store.list({prefix:'groups/'});
 const keys=(list.blobs||[]).map(x=>x.key).filter(k=>k.startsWith('groups/')).sort();
 if(!keys.length)return{groups:0,queries:0};
 const cursor=await store.get('maintenance/weather-cursor',{type:'text',consistency:'strong'});
 let index=Math.max(0,keys.findIndex(k=>k>cursor));
 if(cursor&&index===0&&keys.some(k=>k>cursor)===false)index=0;
 const selected=[];for(let i=0;i<Math.min(6,keys.length);i++)selected.push(keys[(index+i)%keys.length]);
 let queries=0;
 for(const key of selected){const rec=await strong(store,key);if(!rec||rec.data.deleted)continue;const members=rec.data.members.filter(m=>m.kind==='human').slice(0,15);
 const results=new Map();const cache=new Map();
 for(const m of members){if(queries>=45)break;const loc=locationEffective(m);if(!loc)continue;const coordKey=loc.lat.toFixed(2)+','+loc.lon.toFixed(2);
 try{
 let forecast=cache.get(coordKey);
 if(!forecast){let u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',String(loc.lat));u.searchParams.set('longitude',String(loc.lon));u.searchParams.set('hourly','wind_gusts_10m,precipitation,weather_code');u.searchParams.set('forecast_hours','12');u.searchParams.set('wind_speed_unit','kmh');u.searchParams.set('timezone','Asia/Ho_Chi_Minh');const response=await fetchForecast(u.toString(),{signal:AbortSignal.timeout(4500)});if(!response.ok)throw Error('Open-Meteo unavailable');const data=await response.json();const gust=Math.max(0,...(data.hourly?.wind_gusts_10m||[]).filter(Number.isFinite));const rain=Math.max(0,...(data.hourly?.precipitation||[]).filter(Number.isFinite));forecast={risk:riskFromForecast({gust,rain}),gust,rain,updatedAt:new Date().toISOString(),source:'Open-Meteo',locationSource:loc.source};cache.set(coordKey,forecast);queries++;}
 results.set(m.id,forecast);
 }catch(e){console.warn('Weather forecast unavailable',e.message)}
 }
 try{await updateSnapshot(store,key,results)}catch(e){console.warn('Group snapshot update error',e.message)}
 }
 await store.set('maintenance/weather-cursor',selected.at(-1));
 return{groups:selected.length,queries};
}
