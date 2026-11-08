import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import fs from 'node:fs';
import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {intakeFields} from '../lib/shared/intake-fields.mjs';
nextEnv.loadEnvConfig(process.cwd());
assert.equal(new URL(process.env.SUPABASE_URL).hostname,'osmxevxdsgvphqvdjnls.supabase.co');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const records=[];const file='.next/matching-test-records.json';assert.ok(!fs.existsSync(file),'Existing test records must be reviewed first');
function payload(kind){const data={};for(const f of intakeFields[kind])data[f.name]=f.kind==='boolean'?true:f.kind==='array'?[]:f.kind.includes('date')?'2026-11-12':f.kind.includes('number')||f.kind==='unknown'?1:f.items?.[0]??'합성 매칭 검증';data.region='옥천읍';data.workRegion='옥천읍';data.regions=['옥천읍'];data.anyRegion=false;data.deposit=300;data.date='2026-11-12';if(kind==='waiting'){data.budget=50;data.types=['원룸'];data.sharing='단독 주거만';}else{data.type='원룸';data.rent=40;data.fee=5;data.title='합성 테스트 · 월세 40 관리비 5';}return {kind,data,phone:'010-0000-0000',consent:true,optionalConsent:true,truth:true,updates:true,media:[]};}
for(const kind of ['waiting','broker']){
 const email='okki-match-'+randomUUID()+'@example.com',password=randomBytes(32).toString('base64url')+'aA1!';
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);
 const row={kind,user:created.data.user.id};records.push(row);fs.writeFileSync(file,JSON.stringify(records));
 const cookies=[];const auth=createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>[],setAll:c=>cookies.push(...c)}});assert.equal((await auth.auth.signInWithPassword({email,password})).error,null);
 const response=await fetch('http://localhost:3011/api/intake',{method:'POST',headers:{origin:new URL(process.env.APP_BASE_URL).origin,'content-type':'application/json','idempotency-key':randomUUID(),cookie:cookies.map(c=>c.name+'='+c.value).join('; ')},body:JSON.stringify(payload(kind))});
 const result=await response.json();assert.equal(response.status,201,result.error?.message);row.application=result.application.id;fs.writeFileSync(file,JSON.stringify(records));console.log('PASS: actual Auth + application API saved '+kind);
}
const [seeker,broker]=records;
const deliveries=await db.from('match_deliveries').select('id',{count:'exact'}).eq('housing_request_id',seeker.application).eq('listing_id',broker.application);assert.equal(deliveries.error,null);
console.log('OBSERVED: matching delivery rows = '+deliveries.count+'; matching creation and recipient inbox APIs are absent.');
console.log('Retained: two synthetic accounts and two applications for operator inspection; no passwords stored.');
