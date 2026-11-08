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
if(process.argv[2]==='init'){
 assert.ok(!fs.existsSync(file),'Clean up previous verification accounts before init.');
 const users=[];fs.writeFileSync(file,JSON.stringify(users));
 for(const label of ['operator','ordinary']){
 const email='okki-admin-check-20261109-'+label+'@example.com',password=randomBytes(32).toString('base64url')+'aA1!';
 const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});assert.equal(error,null);
 users.push({id:data.user.id,email,password});fs.writeFileSync(file,JSON.stringify(users));
 }
 console.log('PASS: two synthetic verification accounts created');
}else{
 const users=JSON.parse(fs.readFileSync(file,'utf8'));
 try{
 if(process.argv[2]!=='cleanup'){
 for(const [i,user] of users.entries()){
 const cookies=[];const auth=createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{cookieOptions:{httpOnly:true,sameSite:'lax',path:'/'},cookies:{getAll:()=>[],setAll:changes=>cookies.push(...changes)}});
 const {error}=await auth.auth.signInWithPassword({email:user.email,password:user.password});assert.equal(error,null);
 const cookie=cookies.map(c=>c.name+'='+c.value).join('; ');
 for(const path of ['/admin','/api/admin?session=1','/api/admin?kind=waiting']){
 const r=await request(path,cookie);assert.equal(r.status,i===0?200:path==='/admin'?404:403,path);
 assert.match(r.headers.get('cache-control'),/no-store/);if(i===1)assert.doesNotMatch(await r.text(),/phone_e164|admin-root/);
 }
 }
 for(const path of ['/admin','/api/admin']){const r=await request(path);assert.equal(r.status,path==='/admin'?404:401);}
 console.log('PASS: actual Auth cookies: operator page/API/list allowed, ordinary page/API/list denied, anonymous denied, no-store');
 }
 }finally{
 for(const user of users){const {error}=await db.auth.admin.deleteUser(user.id);assert.equal(error,null);}
 fs.unlinkSync(file);console.log('PASS: synthetic accounts and memberships removed');
 }
}
