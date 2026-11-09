const {test}=require('node:test');const assert=require('node:assert/strict');
test('inbox rejects anonymous, other recipient and unavailable matches before disclosing listing',async()=>{
 const {handleInbox}=await import('../lib/server/inbox-handler.mjs');const config=()=>({});const req=new Request('https://okki.example/api/inbox?id=11111111-1111-4111-8111-111111111111');
 assert.equal((await handleInbox(req,{config,auth:()=>({auth:{getUser:async()=>({data:{user:null}})}})})).status,401);
 for(const own of [null,{id:'own'}]){const db=()=>({from:table=>{assert.notEqual(table,'broker_listing_details');const q={select(){return this},eq(){return this},gt(){return this},order(){return this},limit(){return Promise.resolve({data:[]})},maybeSingle:async()=>({data:own}),then(resolve){resolve({data:[]})}};return q;}});const r=await handleInbox(req,{config,auth:()=>({auth:{getUser:async()=>({data:{user:{id:'verified'}}})}}),db});assert.equal(r.status,404);assert.match(r.headers.get('cache-control'),/no-store/);}
});
