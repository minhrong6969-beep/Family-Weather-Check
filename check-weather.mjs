import {getStore} from '@netlify/blobs';
import {monitorGroups} from '../../lib/weather-worker-core.mjs';

export default async()=>{
  const store=getStore({name:'family-weather-groups-v2',consistency:'strong'});
  const result=await monitorGroups(store);
  console.log('Family Weather scheduled run',result);
  return new Response(null,{status:204});
};
export const config={schedule:'0 * * * *'};
