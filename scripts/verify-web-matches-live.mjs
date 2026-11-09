import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
nextEnv.loadEnvConfig(process.cwd());
assert.equal(new URL(process.env.SUPABASE_URL).hostname,'osmxevxdsgvphqvdjnls.supabase.co');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const file='.next/admin-verification.json';
const base=process.env.VERIFY_APP_URL||'http://localhost:3011';
assert.ok(['http://localhost:3011','https://github-vercel-okki-develop-tech-for-impact.vercel.app'].includes(base));
const protection=process.env.VERIFY_VERCEL_OIDC_TOKEN||process.env.VERCEL_OIDC_TOKEN;
const headers=protection?{'x-vercel-trusted-oidc-idp-token':protection}:{};
async function request(path,cookie='') {
 if(process.env.ADMIN_VERIFY_CLI==='true') {
  // Send Auth cookies on stdin, never in shell command text or logs. No environment download.
  assert.ok(!/[\r\n"\\]/.test(cookie));
  const result=spawnSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js','--yes','vercel@65.11.0','curl',path,'--deployment',base,'--','--silent','--include','--config','-','--write-out','\n%{http_code}'],{input:cookie?'header = "Cookie: '+cookie+'"\n':'',encoding:'utf8',timeout:60000,windowsHide:true});
  assert.equal(result.status,0,'Vercel authenticated request failed');
  const statuses=[...result.stdout.matchAll(/HTTP\/\S+\s+(\d{3})/g)];
  const status=Number(statuses.at(-1)?.[1]);
  return {status,headers:{get:name=>{const m=result.stdout.match(new RegExp('^'+name+':([^\\r\\n]*)','im'));return m?m[1].trim():null;}},text:async()=>result.stdout};
 }
 const r=await fetch(base+path,{headers:{...headers,...(cookie?{cookie}:{})},redirect:'manual'});
 assert.ok(r.status<300||r.status>=400,'Deployment protection redirect; refresh authentication before verification');
 return r;
}
const pair=JSON.parse(fs.readFileSync('.vercel/matching-test-records.json','utf8'));
assert.equal(pair.length,2);
const seeker=pair.find(x=>x.kind==='waiting'),broker=pair.find(x=>x.kind==='broker');
if(process.argv[2]==='seed'){
 const first=await db.rpc('refresh_web_matches_for',{p_actor:seeker.user});assert.equal(first.error,null);
 const second=await db.rpc('refresh_web_matches_for',{p_actor:seeker.user});assert.equal(second.error,null);assert.equal(second.data,0);
 const stored=await db.from('match_deliveries').select('id').eq('housing_request_id',seeker.application).eq('listing_id',broker.application).eq('channel','web');assert.equal(stored.error,null);assert.equal(stored.data.length,1);console.log('PASS: existing test pair persisted one web notification; repeat created zero');
}else{
 const cookies=[];
 for(const row of [seeker,broker]){
 const user=await db.auth.admin.getUserById(row.user);assert.equal(user.error,null);assert.match(user.data.user.email,/^okki-match-.*@example\.com$/);
 // Only previously created synthetic accounts. No email is sent; token remains in memory.
 const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user.email});assert.equal(link.error,null);
 const changes=[];const auth=createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>[],setAll:c=>changes.push(...c)}});
 const login=await auth.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});assert.equal(login.error,null);cookies.push(changes.map(c=>c.name+'='+c.value).join('; '));
 }
 const json=async(path,cookie,status=200)=>{const r=await request(path,cookie);assert.equal(r.status,status,path);const text=await r.text();if(status!==200)return;return JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));};
 const inbox=await json('/api/inbox',cookies[0]);const matches=inbox.notifications.filter(x=>x.listing_id===broker.application);assert.equal(matches.length,1);
 const detail=await json('/api/inbox?id='+matches[0].id,cookies[0]);assert.equal(detail.listing.rent,40);assert.equal(detail.listing.fee,5);assert.equal(detail.listing.address,undefined);assert.equal(detail.listing.phone_e164,undefined);
 await json('/api/inbox?id='+matches[0].id,cookies[1],404);await json('/api/inbox','',401);
 const admin=await json('/api/admin?kind=waiting&id='+seeker.application,cookies[1]);assert.ok(admin.matches.some(x=>x.id===matches[0].id));
 console.log('PASS: deployed recipient inbox/detail, other recipient denial, anonymous denial and administrator same match ID');
}

