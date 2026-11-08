const {test}=require('node:test');const assert=require('node:assert/strict');
const id='11111111-1111-4111-8111-111111111111';
test('admin API denies unverified, ordinary and inactive users before any intake query',async()=>{
 const {handleAdmin}=await import('../lib/server/admin-handler.mjs');
 for(const [user,membership,status] of [[null,null,401],[{id},null,403],[{id},{role:'operator',active:false},403],[{id},{role:'analyst',active:true},403]]){
 const r=await handleAdmin(new Request('https://okki.example/api/admin'),{config:()=>({origin:'https://okki.example'}),auth:()=>({auth:{getUser:async()=>({data:{user}})}}),db:()=>({from:t=>{assert.equal(t,'admin_memberships');return {select(){return this},eq(){return this},maybeSingle:async()=>({data:membership})}}})});assert.equal(r.status,status);assert.match(r.headers.get('cache-control'),/no-store/);
 }
});
test('admin detail returns allowlisted form, phone, contact history and actual delivery records after audit',async()=>{
 const {handleAdmin}=await import('../lib/server/admin-handler.mjs');let audited=false;
 const db={rpc:async()=>{audited=true;return {}},from:t=>{let row=t==='admin_memberships'?{role:'operator',active:true}:t==='housing_requests'?{id,version:1}:t==='applicant_contacts'?{phone_e164:'+821000000000',verification_status:'unverified'}:t==='admin_records'?[{action:'contact',result:'connected'}]:[{listing_id:id,status:'delivered'}];const q={select(){return this},eq(){return this},gt(){return this},order(){return this},limit(){assert.ok(audited);return Promise.resolve({data:row})},maybeSingle:async()=>({data:row}),single:async()=>({data:{situation:'입사 예정'}})};return q}};
 const r=await handleAdmin(new Request('https://okki.example/api/admin?kind=waiting&id='+id),{config:()=>({origin:'https://okki.example'}),auth:()=>({auth:{getUser:async()=>({data:{user:{id}}})}}),db:()=>db});assert.equal(r.status,200);const d=await r.json();assert.equal(d.contact.verification_status,'unverified');assert.equal(d.history[0].result,'connected');assert.equal(d.matches[0].status,'delivered');assert.ok(audited);
});
