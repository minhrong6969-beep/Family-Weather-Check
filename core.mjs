/* Shared, side-effect-free rules for the demo and online client. */
export const CITIES = [
  {id:'hcm',vi:'TP. Hồ Chí Minh',en:'Ho Chi Minh City',lat:10.8231,lon:106.6297},
  {id:'hn',vi:'Hà Nội',en:'Hanoi',lat:21.0285,lon:105.8542},
  {id:'dn',vi:'Đà Nẵng',en:'Da Nang',lat:16.0544,lon:108.2022},
  {id:'hue',vi:'Huế',en:'Hue',lat:16.4637,lon:107.5909},
  {id:'haiphong',vi:'Hải Phòng',en:'Hai Phong',lat:20.8449,lon:106.6881},
  {id:'nhatrang',vi:'Nha Trang',en:'Nha Trang',lat:12.2388,lon:109.1967},
  {id:'quynhon',vi:'Quy Nhơn',en:'Quy Nhon',lat:13.7829,lon:109.2197},
  {id:'vinh',vi:'Vinh',en:'Vinh',lat:18.6796,lon:105.6813},
  {id:'cantho',vi:'Cần Thơ',en:'Can Tho',lat:10.0452,lon:105.7469},
  {id:'dalat',vi:'Đà Lạt',en:'Da Lat',lat:11.9404,lon:108.4583},
  {id:'phuquoc',vi:'Phú Quốc',en:'Phu Quoc',lat:10.2270,lon:103.9670},
  {id:'vungtau',vi:'Vũng Tàu',en:'Vung Tau',lat:10.4114,lon:107.1362},
  {id:'thanhhoa',vi:'Thanh Hóa',en:'Thanh Hoa',lat:19.8067,lon:105.7852},
  {id:'quangngai',vi:'Quảng Ngãi',en:'Quang Ngai',lat:15.1214,lon:108.8044},
  {id:'donghoi',vi:'Đồng Hới',en:'Dong Hoi',lat:17.4689,lon:106.6223}
];
export const CITY_BY_ID = Object.fromEntries(CITIES.map(c=>[c.id,c]));
export const SEVERITIES = ['clear','watch','high','severe'];
export function cityLabel(id,lang='vi'){return CITY_BY_ID[id]?.[lang]||id||'—';}
export function riskFromForecast({gust=0,rain=0,thunder=false}={}) {
  if(!Number.isFinite(gust)||!Number.isFinite(rain)||gust<0||rain<0) return 'unknown';
  if(gust>=95||rain>=35) return 'severe';
  if(gust>=75||rain>=20) return 'high';
  if(gust>=50||rain>=10||thunder) return 'watch';
  return 'clear';
}
export const severityRank = (a) => SEVERITIES.indexOf(a);
export function escapeHtml(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
export function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}
export function dateAge(iso){const n=Date.parse(iso);return Number.isFinite(n)?Date.now()-n:Infinity}
export function validName(value,max=36){return typeof value==='string'&&value.trim().length>=2&&value.trim().length<=max&&!/[<>\x00-\x1f]/.test(value)}
export function locationById(id){const c=CITY_BY_ID[id];return c?{cityId:id,lat:c.lat,lon:c.lon,source:'fixed',updatedAt:new Date().toISOString()}:null}
export function locationEffective(member){let loc=member?.gps;if(loc && Number.isFinite(loc.lat)&&Number.isFinite(loc.lon)&&dateAge(loc.updatedAt)<2*60*60*1000)return {...loc,source:'gps'};return locationById(member?.cityId||'hcm')}
export function formatDate(iso,lang='vi'){try{return new Intl.DateTimeFormat(lang==='vi'?'vi-VN':'en-US',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}catch{return '—'}}
export const DEMO_KEY='family_weather_studio_demo_v2';
export function makeDemo(name='Minh'){
 const ts=new Date().toISOString();return {
  id:'demo-family',name:'Nhà của '+name,ownerId:'me',createdAt:ts,invite:null,
  members:[{id:'me',name,role:'owner',kind:'human',cityId:'hcm',gps:null,sim:'clear',joinedAt:ts},{id:'bot-lan',name:'Lan (bot)',role:'member',kind:'bot',cityId:'dn',sim:'watch',joinedAt:ts},{id:'bot-an',name:'An (bot)',role:'member',kind:'bot',cityId:'hn',sim:'clear',joinedAt:ts}],
  alerts:[],version:2
 };
}
export function cleanDemo(group){if(!group||!Array.isArray(group.members))return null;return {...group,members:group.members.map(m=>({...m,sim:SEVERITIES.includes(m.sim)?m.sim:'clear'})),alerts:(group.alerts||[]).slice(0,50)};}
export function newAlert({member,level,actor='admin',cityId,wind,rain}){
 return {id:uid(),memberId:member.id,memberName:member.name,cityId:cityId||member.cityId,level,actor,wind:wind??null,rain:rain??null,simulation:true,createdAt:new Date().toISOString()};
}
