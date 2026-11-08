import test from 'node:test';
import assert from 'node:assert/strict';
import {getFloatingMembers,getFloatingMemberStatus} from '../assets/floating-group.mjs';
const now=Date.now();
const iso=n=>new Date(n).toISOString();
test('No forecast is not falsely classified safe',()=>{
 assert.equal(getFloatingMemberStatus({id:'one',kind:'human',cityId:'hn'}, {}, now).level,'unknown');
});
test('Bot simulation is marked TEST; danger sorted ahead of safe',()=>{
 const g={members:[{id:'a',kind:'bot',name:'A',sim:'clear',cityId:'hcm'},{id:'b',kind:'bot',name:'B',sim:'severe',cityId:'dn'},{id:'c',kind:'bot',name:'C',sim:'watch',cityId:'hn'}],alerts:[]};
 const result=getFloatingMembers(g,{},'a',now);
 assert.deepEqual(result.map(x=>x.member.id),['b','c','a']);
 assert.equal(result[0].source,'test');
});
test('recent human simulation has explicit TEST origin',()=>{
 const m={id:'u',kind:'human',cityId:'hn'};
 const value=getFloatingMemberStatus(m,{alerts:[{id:'t',simulation:true,memberId:'u',level:'high',createdAt:iso(now-10*60_000)}]},now);
 assert.equal(value.level,'high');assert.equal(value.source,'test');
});
test('expired simulation falls back to fresh forecast',()=>{
 const m={id:'u',kind:'human',cityId:'hn'};
 const value=getFloatingMemberStatus(m,{alerts:[{simulation:true,memberId:'u',level:'severe',createdAt:iso(now-3*3600_000)}],forecast:{hn:{risk:'clear',at:iso(now-5*60_000)}}},now);
 assert.equal(value.level,'clear');assert.equal(value.source,'forecast');
});
test('stale model data is unknown',()=>{
 const m={id:'u',kind:'human',cityId:'hn'};
 const value=getFloatingMemberStatus(m,{forecast:{hn:{risk:'clear',at:iso(now-7*3600_000)}}},now);
 assert.equal(value.level,'unknown');
});
test('only local user can use GPS forecast key',()=>{
 const m={id:'u',kind:'human',cityId:'hcm',gps:{lat:10.22,lon:106.123,updatedAt:iso(now-5*60_000)}};
 const forecast={'gps:u:10.220,106.123':{risk:'high',at:iso(now)}};
 assert.equal(getFloatingMemberStatus(m,{forecast,meId:'u'},now).level,'high');
 assert.equal(getFloatingMemberStatus(m,{forecast,meId:'other'},now).level,'unknown');
});
