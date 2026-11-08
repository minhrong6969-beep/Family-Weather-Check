import test from 'node:test';
import assert from 'node:assert/strict';
import {riskFromForecast,makeDemo,cleanDemo,CITIES,cityLabel,validName} from '../assets/core.mjs';
import {makeHandler} from '../lib/service.mjs';
import {monitorGroups} from '../lib/weather-worker-core.mjs';

class Store {
  constructor(){this.m=new Map();this.n=0}
  async getWithMetadata(k){let x=this.m.get(k);return x?{data:structuredClone(x.data),etag:x.etag,metadata:{}}:null}
  async get(k){let v=this.m.get(k);return v?.data??null}
  async set(k,v){return this.setJSON(k,v)}
  async list({prefix}){return{blobs:[...this.m.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}}
  async setJSON(k,v,opt={}){const old=this.m.get(k);if(opt.onlyIfNew&&old)return{modified:false};if(opt.onlyIfMatch&&old?.etag!==opt.onlyIfMatch)return{modified:false};const etag='"'+(++this.n)+'"';this.m.set(k,{data:structuredClone(v),etag});return{modified:true,etag}}
}
function req(path,method='GET',body,token){return new Request('https://family.example/api/v1/'+path,{method,headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})})}
async function run(h,p,m,b,t){let r=await h(req(p,m,b,t));return {status:r.status,data:await r.json()}}
test('weather rules distinguish demo levels',()=>{
 assert.equal(riskFromForecast({gust:15,rain:1}),'clear');
 assert.equal(riskFromForecast({gust:55,rain:1}),'watch');
 assert.equal(riskFromForecast({gust:79,rain:1}),'high');
 assert.equal(riskFromForecast({gust:100,rain:1}),'severe');
 assert.equal(riskFromForecast({gust:-1,rain:1}),'unknown');
 assert.equal(CITIES.length>10,true);assert.equal(cityLabel('dn','vi'),'Đà Nẵng');assert.equal(validName('A'),false);
});
test('demo state and self-owned local data',()=>{
 const g=cleanDemo(makeDemo('Minh'));assert.equal(g.members.length,3);assert.equal(g.ownerId,'me');assert.equal(g.members[1].kind,'bot');
});
test('online flow create/invite/join/bot/update/test/privacy/roles',async()=>{
 const store=new Store(),h=makeHandler(store);
 let health=await run(h,'health');assert.equal(health.status,200);assert.equal(health.data.backend,'netlify');
 let created=await run(h,'groups','POST',{name:'Minh',groupName:'Gia đình'});assert.equal(created.status,201);
 const {groupId,memberId:ownerId,token:ownerToken}=created.data;
 let dashboard=await run(h,'dashboard?groupId='+groupId,'GET',null,ownerToken);assert.equal(dashboard.status,200);assert.equal(dashboard.data.group.members[0].hash,undefined);
 let notAuth=await run(h,'dashboard?groupId='+groupId);assert.equal(notAuth.status,401);
 let invited=await run(h,'action','POST',{groupId,action:'invite'},ownerToken);assert.match(invited.data.code,/^FW-/);
 let joined=await run(h,'join','POST',{name:'Lan',code:invited.data.code});assert.equal(joined.status,201);
 let reuse=await run(h,'join','POST',{name:'An',code:invited.data.code});assert.equal(reuse.status,404);
 let memberInvite=await run(h,'action','POST',{groupId,action:'invite'},joined.data.token);assert.equal(memberInvite.status,403);
 let addbot=await run(h,'action','POST',{groupId,action:'add-bot',name:'Robot Hue',cityId:'hue'},ownerToken);assert.equal(addbot.status,200);
 let memberBot=await run(h,'action','POST',{groupId,action:'add-bot',name:'Wrong bot',cityId:'dn'},joined.data.token);assert.equal(memberBot.status,403);
 dashboard=await run(h,'dashboard?groupId='+groupId,'GET',null,joined.data.token);
 const bot=dashboard.data.group.members.find(m=>m.kind==='bot');assert.ok(bot);
 let editBot=await run(h,'action','POST',{groupId,action:'edit-bot',botId:bot.id,name:'Storm Bot',cityId:'dn',level:'severe'},ownerToken);assert.equal(editBot.status,200);
 let notify=await run(h,'action','POST',{groupId,action:'test-alert',memberId:bot.id,level:'severe',actor:'admin'},ownerToken);assert.equal(notify.status,200);
 dashboard=await run(h,'dashboard?groupId='+groupId,'GET',null,joined.data.token);
 assert.equal(dashboard.data.group.alerts.length,1);assert.equal(dashboard.data.group.alerts[0].simulation,true);assert.equal(dashboard.data.group.alerts[0].level,'severe');assert.equal(dashboard.data.group.members.find(m=>m.id===bot.id).cityId,'dn');
 let gps=await run(h,'action','POST',{groupId,action:'set-gps',lat:16.03,lon:108.5},joined.data.token);assert.equal(gps.status,200);
 dashboard=await run(h,'dashboard?groupId='+groupId,'GET',null,ownerToken);assert.equal(dashboard.data.group.members.find(m=>m.id===joined.data.memberId).gps,undefined);
 let bad=await run(h,'action','POST',{groupId,action:'test-alert',memberId:bot.id,level:'severe'},joined.data.token);assert.equal(bad.status,403);
 let kick=await run(h,'action','POST',{groupId,action:'remove-member',memberId:joined.data.memberId},ownerToken);assert.equal(kick.status,200);
 let revoked=await run(h,'dashboard?groupId='+groupId,'GET',null,joined.data.token);assert.equal(revoked.status,403);
 let deleteGroup=await run(h,'action','POST',{groupId,action:'delete-group'},ownerToken);assert.equal(deleteGroup.status,200);
 let gone=await run(h,'dashboard?groupId='+groupId,'GET',null,ownerToken);assert.equal(gone.status,404);
});

test('hourly worker saves real forecast and does not duplicate unchanged event',async()=>{
 const store=new Store(),h=makeHandler(store);
 const created=await run(h,'groups','POST',{name:'Minh',groupName:'Weather Group'});
 const response={ok:true,json:async()=>({hourly:{wind_gusts_10m:[40,80],precipitation:[1,7]}})};
 const forecast=async()=>response;
 const first=await monitorGroups(store,forecast);
 assert.equal(first.groups,1);assert.equal(first.queries,1);
 let dashboard=await run(h,'dashboard?groupId='+created.data.groupId,'GET',null,created.data.token);
 assert.equal(dashboard.data.group.members[0].weatherSnapshot.risk,'high');
 assert.equal(dashboard.data.group.alerts.length,1);
 assert.equal(dashboard.data.group.alerts[0].simulation,false);
 await monitorGroups(store,forecast);
 dashboard=await run(h,'dashboard?groupId='+created.data.groupId,'GET',null,created.data.token);
 assert.equal(dashboard.data.group.alerts.length,1);
});
