// Opt-in integration verification. Creates only synthetic users/data in the named development project.
// Credentials, cookies, UUIDs and signed URLs stay in memory; output contains only check names/counts.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';
import sharp from 'sharp';
import { intakeFields } from '../lib/shared/intake-fields.mjs';
nextEnv.loadEnvConfig(process.cwd());
assert.equal(process.env.INTAKE_LIVE_VERIFY,'develop','Set INTAKE_LIVE_VERIFY=develop explicitly.');
assert.equal(new URL(process.env.SUPABASE_URL).hostname,'osmxevxdsgvphqvdjnls.supabase.co','Development project only.');
const base=process.env.VERIFY_APP_URL||'http://localhost:3011';
const target=new URL(base);
assert.ok(['localhost','127.0.0.1'].includes(target.hostname) || target.origin==='https://github-vercel-okki-develop-tech-for-impact.vercel.app','Use only localhost or the explicitly approved develop Preview.');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],paths=new Set();let checks=0;
function pass(label){checks++;console.log('PASS: '+label);}
function good(result,label){assert.equal(result.error,null,label);return result.data;}
async function api(user,path,body,options={}){
  const protection=process.env.VERIFY_VERCEL_OIDC_TOKEN?{'x-vercel-trusted-oidc-idp-token':process.env.VERIFY_VERCEL_OIDC_TOKEN}:{};
  const headers={...protection,origin:base,...(user?{cookie:user.cookie}:{}),...options.headers};
  if(body!==undefined&&!Buffer.isBuffer(body))headers['content-type']='application/json';
  const response=await fetch(base+path,{method:body===undefined?'GET':'POST',...options,headers,body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  return {response,body:await response.json()};
}
function payload(kind){
  const data={};
  for(const f of intakeFields[kind])data[f.name]=f.kind==='boolean'?true:f.kind==='array'?[]:f.kind.includes('date')?'2026-11-12':f.kind.includes('number')||f.kind==='unknown'?1:f.items?.[0]??'합성 테스트';
  data.region='옥천읍';data.workRegion='옥천읍';data.regions=['옥천읍'];data.anyRegion=false;
  if(kind==='resident')data.authority='임차인·필요한 동의 확보';
  if(kind==='vacancy'){data.certainty='날짜 확정';data.landlordNotified='아직 알리지 않았어요';}
  return {kind,data,phone:'010-0000-0000',consent:true,optionalConsent:true,truth:true,updates:true,media:[]};
}
try {
  for(const label of ['a','b']){
    const email='okki-intake-'+randomUUID()+'-'+label+'@example.com';
    const password=randomBytes(30).toString('base64url')+'aA1!';
    const created=good(await admin.auth.admin.createUser({email,password,email_confirm:true}),'create synthetic account');
    const user={id:created.user.id,cookie:'',client:createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})};users.push(user);
    const login=await api(null,'/api/auth/login',{email,password});assert.equal(login.response.status,200,'real app login');
    const cookies=login.response.headers.getSetCookie();assert.ok(cookies.length,'session cookies issued');
    user.cookie=cookies.map(x=>x.split(';')[0]).join('; ');
    good(await user.client.auth.signInWithPassword({email,password}),'direct Auth session for denied Data API tests');
  }
  pass('two synthetic accounts logged in through actual Auth cookies');
  const [a,b]=users;
  assert.equal((await api(null,'/api/intake')).response.status,401);pass('unauthenticated API denied');
  const photo=await sharp({create:{width:80,height:60,channels:3,background:'#b0b0b0'}}).jpeg().toBuffer();
  const uploaded=await api(a,'/api/intake/media',photo,{headers:{'content-type':'image/jpeg'}});assert.equal(uploaded.response.status,200,'real upload');
  const mediaId=uploaded.body.id;
  const media=good(await admin.from('listing_media').select('object_path,status,byte_size').eq('id',mediaId).single(),'verify uploaded metadata');paths.add(media.object_path);
  assert.equal(media.status,'ready');assert.ok(media.byte_size>0&&media.byte_size<=1048576);
  const downloaded=good(await admin.storage.from('listing-photos').download(media.object_path),'download synthetic image for verification');
  const meta=await sharp(Buffer.from(await downloaded.arrayBuffer())).metadata();assert.equal(meta.format,'webp');assert.equal(meta.exif,undefined);
  pass('actual Storage upload, WebP re-encoding and metadata stripping');
  const anonymous=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
  for(const [label,client] of [['anon',anonymous],['signed-in B',b.client]]){
    assert.ok((await client.from('applicant_contacts').select('phone_e164')).error,label+' direct contact read denied');
    assert.ok((await client.rpc('save_intake',{p_actor:a.id,p_kind:'waiting',p_key:randomUUID(),p_hash:'forged',p_id:null,p_version:null,p_data:{},p_phone:'+821000000000',p_optional:false,p_media:[]})).error,label+' direct RPC denied');
    assert.ok((await client.storage.from('listing-photos').download(media.object_path)).error,label+' direct Storage read denied');
  }
  pass('anon and ordinary JWT denied direct contacts, privileged RPC and private photo');
  for(const kind of ['waiting','broker','resident','vacancy']){
    const input=payload(kind);if(kind==='broker')input.media=[mediaId];
    const key=randomUUID();const options={headers:{'idempotency-key':key}};
    const created=await api(a,'/api/intake',input,options);if(created.response.status!==201)console.log('Save diagnostic:',created.body.error?.code,created.body.error?.message);assert.equal(created.response.status,201,kind+' save');
    const saved=created.body.application;assert.equal(saved.version,1);
    const duplicate=await api(a,'/api/intake',input,options);assert.equal(duplicate.response.status,201);assert.deepEqual(duplicate.body.application,saved);
    const changed=await api(a,'/api/intake',{...input,phone:'010-0000-0001'},options);assert.equal(changed.response.status,409);
    const own=await api(a,'/api/intake?id='+saved.id+'&kind='+kind);assert.equal(own.response.status,200);assert.equal(own.body.application.data.phone,'01000000000');
    if(kind==='broker'){
      assert.equal(own.body.application.photos.length,1);
      const photoUrl=own.body.application.photos[0].url;
      assert.equal(new URL(photoUrl).origin,base,'same-origin authenticated photo');
      const image=await fetch(photoUrl,{headers:{cookie:a.cookie}});assert.equal(image.status,200);assert.match(image.headers.get('cache-control'),/no-store/);await image.arrayBuffer();
      assert.equal((await fetch(photoUrl,{headers:{cookie:b.cookie}})).status,404);
      assert.equal((await fetch(photoUrl)).status,401);
    }
    const foreign=await api(b,'/api/intake?id='+saved.id+'&kind='+kind);assert.equal(foreign.response.status,404);assert.equal(foreign.body.application,undefined);
    const edit={...input,data:kind==='waiting'?{...input.data,sharing:'공동거주 가능'}:input.data,id:saved.id,version:1,phone:'010-0000-0002'};
    const forged=await api(b,'/api/intake',edit,{headers:{'idempotency-key':randomUUID()}});assert.equal(forged.response.status,404,kind+' cross-account update');
    const forbiddenDelete=await api(b,'/api/intake/delete',saved);assert.equal(forbiddenDelete.response.status,404);
    const edited=await api(a,'/api/intake',edit,{headers:{'idempotency-key':randomUUID()}});assert.equal(edited.response.status,201,kind+' edit');assert.equal(edited.body.application.version,2);
    const stale=await api(a,'/api/intake',edit,{headers:{'idempotency-key':randomUUID()}});assert.equal(stale.response.status,409);
    const updated=await api(a,'/api/intake?id='+saved.id+'&kind='+kind);assert.equal(updated.body.application.data.phone,'01000000002');if(kind==='waiting')assert.equal(updated.body.application.data.sharing,'공동거주 가능');
    const fk=kind==='waiting'?'housing_request_id':'listing_id';
    const contact=good(await admin.from('applicant_contacts').select('phone_e164,verification_status').eq(fk,saved.id).single(),'actual contact persisted');assert.equal(contact.phone_e164,'+821000000002');assert.equal(contact.verification_status,'unverified');
    const consents=good(await admin.from('consents').select('purpose').eq(fk,saved.id),'actual consent persisted');assert.ok(consents.some(x=>x.purpose==='intake'));
    const removed=await api(a,'/api/intake/delete',{...saved,version:2});assert.equal(removed.response.status,200,kind+' delete');
    assert.equal((await api(a,'/api/intake?id='+saved.id+'&kind='+kind)).response.status,404);
    assert.equal(good(await admin.from('applicant_contacts').select('id').eq(fk,saved.id),'contact cascade').length,0);
    assert.equal(good(await admin.from('consents').select('id').eq(fk,saved.id),'consent cascade').length,0);
    pass(kind+': save/read/edit/delete, idempotency, version conflict and other-account denial');
  }
  const bCreated=await api(b,'/api/intake',payload('waiting'),{headers:{'idempotency-key':randomUUID()}});assert.equal(bCreated.response.status,201);
  assert.equal((await api(a,'/api/intake')).body.applications.length,0);
  assert.equal((await api(b,'/api/intake')).body.applications.length,1);
  assert.equal((await api(b,'/api/intake/delete',bCreated.body.application)).response.status,200);
  pass('account-specific list isolation');
  assert.equal((await api(null,'/api/intake/maintenance',{})).response.status,401);pass('maintenance endpoint fails closed without its secret');
} finally {
  // Scope cleanup to UUIDs created by this process; never run global cleanup on unrelated development data.
  let cleanupFailed=false;
  for(const user of users){
    try{
      const photos=good(await admin.from('listing_media').select('id,object_path').eq('owner_user_id',user.id),'cleanup media lookup');
      for(const photo of photos)paths.add(photo.object_path);
      if(paths.size)good(await admin.storage.from('listing-photos').remove([...paths]),'cleanup synthetic Storage');
      for(const table of ['listing_media','housing_requests','listings','consents','idempotency_records'])good(await admin.from(table).delete().eq('owner_user_id',user.id),'cleanup synthetic '+table);
      for(const table of ['seekers','providers'])good(await admin.from(table).delete().eq('auth_user_id',user.id),'cleanup synthetic '+table);
      await user.client.auth.signOut({scope:'global'});
      good(await admin.auth.admin.deleteUser(user.id),'cleanup synthetic Auth');
    }catch{cleanupFailed=true;}
  }
  if(cleanupFailed)throw new Error('Synthetic cleanup incomplete; inspect only this verification run before finishing.');
  pass('synthetic Auth users, application rows and Storage objects cleaned up');
}
console.log('Live verification completed: '+checks+' checks.');
