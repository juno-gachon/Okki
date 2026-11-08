const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const actor=randomUUID();
const config=()=>({url:'https://develop.supabase.co',origin:'https://okki.example',secure:true});
const auth=()=>({auth:{getUser:async()=>({data:{user:{id:actor}}})}});
function request(body,origin='https://okki.example') {const req=new Request('https://okki.example/api/intake',{method:'POST',headers:{origin,'content-type':'application/json','idempotency-key':randomUUID()},body:JSON.stringify(body)});req.cookies={getAll:()=>[]};return req;}
function valid(){return {kind:'waiting',phone:'010-0000-0000',consent:true,optionalConsent:false,data:{situation:'입사 예정',date:'2026-11-12',regions:['옥천읍'],anyRegion:false,deposit:null,budget:50}};}
test('intake API verifies Auth, CSRF, minimum input and binds ownership to server UUID',async()=>{
 const {handleIntake}=await import('../lib/server/intake-handler.mjs');let sent;
 const db=()=>({rpc:async(name,args)=>{sent=args;return {data:{id:randomUUID(),kind:'waiting',version:1}};}});
 assert.equal((await handleIntake(request(valid(),'https://evil.example'),'application',{config,auth:()=>assert.fail(),db})).status,403);
 assert.equal((await handleIntake(request(valid()),'application',{config,auth:()=>({auth:{getUser:async()=>({data:{user:null}})}}),db:()=>assert.fail()})).status,401);
 const body=valid();body.user_id='attacker';body.data.owner_user_id='attacker';body.data.phone='do-not-store';body.data.must='선택 미동의 원문';
 const response=await handleIntake(request(body),'application',{config,auth,db});
 assert.equal(response.status,201);assert.equal(sent.p_actor,actor);assert.equal(sent.p_phone,'+821000000000');
 assert.equal(sent.p_data.owner_user_id,undefined);assert.equal(sent.p_data.phone,undefined);assert.equal(sent.p_data.must,null);assert.match(response.headers.get('cache-control'),/no-store/);
 for(const change of [b=>b.consent=false,b=>b.phone='bad',b=>b.data.date='2026-02-30',b=>b.data.budget=-1,b=>b.data.regions=['unknown']]){const b=valid();change(b);assert.equal((await handleIntake(request(b),'application',{config,auth,db:()=>({rpc:()=>assert.fail()})})).status,400);}
});
test('intake upload decodes content instead of trusting image MIME',async()=>{
 const {handleIntake}=await import('../lib/server/intake-handler.mjs');
 const req=new Request('https://okki.example/api/intake/media',{method:'POST',headers:{origin:'https://okki.example','content-type':'image/jpeg'},body:'not an image'});req.cookies={getAll:()=>[]};
 assert.equal((await handleIntake(req,'media',{config,auth,db:()=>({rpc:()=>assert.fail()})})).status,400);
});
test('own detail is hidden from a different owner before contacts or Storage are queried',async()=>{
 const {handleIntake}=await import('../lib/server/intake-handler.mjs');
 const req=new Request('https://okki.example/api/intake?id='+randomUUID()+'&kind=broker');req.cookies={getAll:()=>[]};
 const filters=[];const query={select(){return this;},eq(k,v){filters.push([k,v]);return this;},gt(){return this;},maybeSingle:async()=>({data:null})};
 const response=await handleIntake(req,'application',{config,auth,db:()=>({from:table=>{assert.equal(table,'listings');return query;}})});
 assert.equal(response.status,404);assert.ok(filters.some(([k,v])=>k==='owner_user_id'&&v===actor));
});
