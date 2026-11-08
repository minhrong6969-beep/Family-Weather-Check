/* Family Weather small-group Netlify Function service.
   Netlify Blobs supports conditional writes, but is NOT a transactional database.
   Suitable for a small demonstration group, not safety-critical infrastructure.
   This module is dependency-injected for local tests. */
const te=new TextEncoder();
const MAX_MEMBERS=15, MAX_ALERTS=60, MAX_GROUP_SIZE=150000;
const allowCities=new Set(['hcm','hn','dn','hue','haiphong','nhatrang','quynhon','vinh','cantho','dalat','phuquoc','vungtau','thanhhoa','quangngai','donghoi']);
const levels=new Set(['clear','watch','high','severe']);
const now=()=>new Date().toISOString();
function err(status,message){const e=new Error(message);e.status=status;throw e}
function uuid(){return crypto.randomUUID()}
function randomCode(n=10){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);return Array.from(bytes,x=>chars[x%chars.length]).join('')}
function token(){const x=new Uint8Array(32);crypto.getRandomValues(x);return Array.from(x,v=>v.toString(16).padStart(2,'0')).join('')}
async function hash(v){const d=await crypto.subtle.digest('SHA-256',te.encode(v));return Array.from(new Uint8Array(d),v=>v.toString(16).padStart(2,'0')).join('')}
function cleanName(n,max=42){return typeof n==='string'&&n.trim().length>=2&&n.trim().length<=max&&!/[<>\x00-\x1f]/.test(n)}
function validCity(id){return allowCities.has(id)}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function safeGroup(g,viewerId){return {...g,members:g.members.map(({hash:secretHash,gps,...m})=>({...m,...(m.id===viewerId?{gps}:{} )})),alerts:g.alerts.slice(0,MAX_ALERTS),rateLimits:undefined,deleted:undefined}}
function bearer(req){const v=req.headers.get('authorization')||'';return v.startsWith('Bearer ')?v.slice(7):''}
function getIP(req){return (req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')||'').split(',')[0]}
async function getRec(store,key){const x=await store.getWithMetadata(key,{type:'json',consistency:'strong'});return x?{data:x.data,etag:x.etag}:null}
async function mutate(store,key,fn){for(let i=0;i<6;i++){
 const rec=await getRec(store,key);if(!rec||rec.data?.deleted)err(404,'Group not found');const g=structuredClone(rec.data);let result=await fn(g);if(!result?.write)return result?.value;
 if(JSON.stringify(g).length>MAX_GROUP_SIZE)err(413,'Group too large');
 const write=await store.setJSON(key,g,{onlyIfMatch:rec.etag});if(write.modified)return result.value;
 }err(409,'Group changed concurrently. Please try again')}
async function requireMember(store,groupId,request){if(typeof groupId!=='string'||!/^[a-f0-9-]{36}$/.test(groupId))err(400,'Invalid group ID');const r=await getRec(store,'groups/'+groupId);if(!r||r.data.deleted)err(404,'Group not found');const t=bearer(request);if(!/^[a-f0-9]{64}$/.test(t))err(401,'Invalid access token');const h=await hash(t);const member=r.data.members.find(m=>m.hash===h&&m.kind==='human');if(!member)err(403,'Not a member of this group');return {group:r.data,me:member,tokenHash:h}}
function sanitizeAlert({memberId,memberName,cityId,level,wind,rain,actor}){return{id:uuid(),memberId,memberName,cityId,level,wind:wind??null,rain:rain??null,actor,simulation:true,createdAt:now()}}
function ttlRate(g,memberId){const cutoff=Date.now()-30*60*1000;g.rateLimits??={};const existing=(g.rateLimits[memberId]||[]).filter(t=>Date.parse(t)>cutoff);if(existing.length>=5)err(429,'Too many test alerts. Try again later.');existing.push(now());g.rateLimits[memberId]=existing}
export function makeHandler(store){return async function handle(req){try{
 const url=new URL(req.url),path=url.pathname.replace(/^\/api\/v1\/?/,'');const method=req.method;
 if(path==='health'&&method==='GET')return json({ok:true,backend:'netlify',version:2});
 if(method==='OPTIONS')return new Response(null,{status:204});
 if(method==='POST'&&path==='groups'){
  const b=await req.json();if(!cleanName(b?.name,36)||!cleanName(b?.groupName,42))err(400,'Invalid name or group name');const id=uuid(),memberId=uuid(),memberToken=token(),tokenHash=await hash(memberToken);const group={id,name:b.groupName.trim(),ownerId:memberId,createdAt:now(),version:2,members:[{id:memberId,name:b.name.trim(),hash:tokenHash,kind:'human',role:'owner',cityId:'hcm',gps:null,joinedAt:now()}],alerts:[],rateLimits:{},deleted:false};const w=await store.setJSON('groups/'+id,group,{onlyIfNew:true});if(!w.modified)err(409,'ID conflict');return json({groupId:id,memberId,token:memberToken},201);
 }
 if(method==='POST'&&path==='join'){
  const b=await req.json();if(!cleanName(b?.name,36)||typeof b.code!=='string'||!/^FW-[A-Z2-9]{10}$/.test(b.code))err(400,'Invalid invite code');const inviteKey='invites/'+await hash(b.code);const ir=await getRec(store,inviteKey);if(!ir||ir.data.used||Date.now()>Date.parse(ir.data.expiresAt))err(404,'Invite expired, already used or invalid');
  const key='groups/'+ir.data.groupId;const rec=await getRec(store,key);if(!rec||rec.data.deleted)err(404,'Group unavailable');if(rec.data.members.length>=MAX_MEMBERS)err(409,'Group is full');
  // Atomic claim of invite key prevents multiple redemptions; group update may
  // still fail due concurrency. In that case the invitation may be consumed.
  const claim=await store.setJSON(inviteKey,{...ir.data,used:true,usedAt:now()},{onlyIfMatch:ir.etag});if(!claim.modified)err(409,'Invite already claimed');
  const memberId=uuid(),memberToken=token(),h=await hash(memberToken);
  await mutate(store,key,g=>{if(g.members.length>=MAX_MEMBERS)err(409,'Group is full');g.members.push({id:memberId,name:b.name.trim(),hash:h,kind:'human',role:'member',cityId:'hcm',gps:null,joinedAt:now()});return {write:true,value:null}});
  return json({groupId:ir.data.groupId,memberId,token:memberToken},201);
 }
 if(path==='dashboard'&&method==='GET'){
  const groupId=url.searchParams.get('groupId');const {group,me}=await requireMember(store,groupId,req);return json({group:safeGroup(group,me.id)});
 }
 if(path==='action'&&method==='POST'){
  const b=await req.json();if(!b||typeof b.action!=='string')err(400,'Missing action');const {me,tokenHash}=await requireMember(store,b.groupId,req);const key='groups/'+b.groupId;
  if(b.action==='invite'){
   if(me.role!=='owner')err(403,'Only group owners can invite');for(let i=0;i<4;i++){const code='FW-'+randomCode(10);const obj={groupId:b.groupId,creatorId:me.id,expiresAt:new Date(Date.now()+72*3600000).toISOString(),used:false};const w=await store.setJSON('invites/'+await hash(code),obj,{onlyIfNew:true});if(w.modified)return json({code,expiresAt:obj.expiresAt})}err(503,'Could not generate invite');
  }
  if(b.action==='delete-group'){
   if(me.role!=='owner')err(403,'Only owner can delete group');await mutate(store,key,g=>{g.deleted=true;g.members=[];g.alerts=[];return{write:true,value:null}});return json({ok:true});
  }
  await mutate(store,key,g=>{
   const actor=g.members.find(m=>m.hash===tokenHash&&m.kind==='human');if(!actor)err(403,'Access revoked');const owner=actor.role==='owner';
   if(b.action==='set-city'){if(!validCity(b.cityId))err(400,'Unknown city');actor.cityId=b.cityId;actor.gps=null;}
   else if(b.action==='set-gps'){if(!Number.isFinite(b.lat)||!Number.isFinite(b.lon)||Math.abs(b.lat)>90||Math.abs(b.lon)>180)err(400,'Invalid GPS');actor.gps={lat:b.lat,lon:b.lon,updatedAt:now()};}
   else if(b.action==='add-bot'){if(!owner)err(403,'Only owner can manage bots');if(g.members.length>=MAX_MEMBERS)err(409,'Group is full');if(!cleanName(b.name,36)||!validCity(b.cityId))err(400,'Invalid bot');g.members.push({id:uuid(),name:b.name.trim(),kind:'bot',role:'member',cityId:b.cityId,sim:'clear',joinedAt:now()});}
   else if(b.action==='edit-bot'){if(!owner)err(403,'Only owner can manage bots');const bot=g.members.find(m=>m.id===b.botId&&m.kind==='bot');if(!bot)err(404,'Bot not found');if(!cleanName(b.name,36)||!validCity(b.cityId)||!levels.has(b.level))err(400,'Invalid bot settings');bot.name=b.name.trim();bot.cityId=b.cityId;bot.sim=b.level;}
   else if(b.action==='remove-member'){if(!owner)err(403,'Only owner can remove members');const target=g.members.find(m=>m.id===b.memberId);if(!target||target.role==='owner')err(400,'Cannot remove owner');g.members=g.members.filter(m=>m.id!==b.memberId);}
   else if(b.action==='leave'){if(owner)err(403,'Owner must delete group');g.members=g.members.filter(m=>m.id!==actor.id);}
   else if(b.action==='test-alert'){
    const target=g.members.find(m=>m.id===(b.memberId||actor.id));if(!target)err(404,'Member not found');if(target.id!==actor.id&&!owner)err(403,'Only owner can simulate other members');if(!levels.has(b.level))err(400,'Invalid risk level');if(b.cityId!=null&&!validCity(b.cityId))err(400,'Invalid location');if(b.wind!=null&&(!Number.isFinite(b.wind)||b.wind<0||b.wind>200))err(400,'Invalid wind');if(b.rain!=null&&(!Number.isFinite(b.rain)||b.rain<0||b.rain>300))err(400,'Invalid rain');ttlRate(g,actor.id);g.alerts.unshift(sanitizeAlert({memberId:target.id,memberName:target.name,cityId:b.cityId||target.cityId,level:b.level,wind:b.wind,rain:b.rain,actor:target.id===actor.id?'user':'admin'}));g.alerts=g.alerts.slice(0,MAX_ALERTS);
   }else err(400,'Unknown action');
   return {write:true,value:null};
  });return json({ok:true});
 }
 err(404,'Not found');
 }catch(e){const status=e.status||500;if(status===500)console.error('FamilyWeather error:',e);return json({error:status===500?'Unexpected server error':e.message},status)}
}}
