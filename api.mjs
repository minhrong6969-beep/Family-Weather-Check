import {getStore} from '@netlify/blobs';
import {makeHandler} from '../../lib/service.mjs';

export default async function handler(request){
  const store=getStore({name:'family-weather-groups-v2',consistency:'strong'});
  return makeHandler(store)(request);
}
export const config={path:'/api/v1/*'};
