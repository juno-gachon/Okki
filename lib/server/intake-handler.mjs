import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server.js';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { authConfig, createAuthClient } from './supabase-auth.mjs';
import { AuthFailure } from './auth-input.mjs';
import { validateIntake, uuid } from './intake-input.mjs';
import { intakeFields } from '../shared/intake-fields.mjs';
const failure=(status,code,message)=>new AuthFailure(status,code,message);
export function dataClient(config) {
  const key=process.env.SUPABASE_SECRET_KEY;
  if (!key?.startsWith('sb_secret_')) throw failure(503,'DATA_UNAVAILABLE','신청 저장 연결을 준비 중입니다.');
  // 서비스 권한은 RLS를 우회하므로 이 클라이언트를 호출하기 전에 서버 인증이 필수다.
  return createClient(config.url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(20000)})}});
}
async function limitedBody(request,limit) {
  const reader=request.body?.getReader(); if(!reader) throw failure(400,'EMPTY_BODY','입력 내용을 확인해주세요.');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw failure(413,'TOO_LARGE','파일 또는 입력 내용이 너무 큽니다.');}chunks.push(value);}
  return Buffer.concat(chunks);
}
export async function handleIntake(request, mode='application', deps={}) {
  let config;const changes=[];
  const finish=(body,status=200)=>{const response=NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie, Origin','Referrer-Policy':'no-referrer'}});for(const c of changes)response.cookies.set(c.name,c.value,{...c.options,httpOnly:true,secure:config?.secure??true,sameSite:'lax',path:'/'});return response;};
  try {
    config=(deps.config??authConfig)();
    if(!['GET','POST'].includes(request.method))throw failure(405,'METHOD_NOT_ALLOWED','허용되지 않은 요청입니다.');
    if(request.method==='POST' && (request.headers.get('origin')!==config.origin || ['cross-site','same-site'].includes(request.headers.get('sec-fetch-site'))))throw failure(403,'INVALID_ORIGIN','이 페이지에서 다시 요청해주세요.');
    const auth=(deps.auth??createAuthClient)(request,config,changes);
    const {data:userData,error:authError}=await auth.auth.getUser();
    if(authError || !userData?.user)throw failure(401,'LOGIN_REQUIRED','로그인 후 신청해주세요.');
    const actor=userData.user.id;
    const db=(deps.db??dataClient)(config);
    if(mode==='delete') {
      if(request.method!=='POST')throw failure(405,'METHOD_NOT_ALLOWED','허용되지 않은 요청입니다.');
      let input;try{input=JSON.parse((await limitedBody(request,4096)).toString('utf8'));}catch{throw failure(400,'INVALID_INPUT','입력 내용을 확인해주세요.');}
      if(!uuid.test(input.id||'')||!intakeFields[input.kind]||!Number.isInteger(input.version))throw failure(400,'INVALID_INPUT','신청을 다시 확인해주세요.');
      const {error}=await db.rpc('delete_intake',{p_actor:actor,p_kind:input.kind,p_id:input.id,p_version:input.version});
      if(error)throw failure(/CONFLICT/.test(error.message)?409:404,'DELETE_FAILED','신청이 변경되었거나 삭제할 수 없습니다. 다시 확인해주세요.');
      return finish({deleted:true});
    }
    if(mode==='media') {
      if(request.method!=='POST')throw failure(405,'METHOD_NOT_ALLOWED','허용되지 않은 요청입니다.');
      if(!['image/jpeg','image/png','image/webp'].includes(request.headers.get('content-type')))throw failure(415,'INVALID_IMAGE','JPEG, PNG, WebP 사진만 업로드해주세요.');
      const bytes=await limitedBody(request,1048576);
      let output;try{output=await sharp(bytes,{limitInputPixels:16000000,animated:false}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();}catch{throw failure(400,'INVALID_IMAGE','사진을 읽을 수 없습니다.');}
      if(output.length>1048576)throw failure(413,'TOO_LARGE','사진 크기를 줄여주세요.');
      const id=randomUUID(),path=actor+'/'+id+'.webp';
      const {error:reserveError}=await db.rpc('reserve_intake_media',{p_actor:actor,p_id:id,p_path:path});
      if(reserveError)throw failure(429,'UPLOAD_LIMIT','잠시 후 사진을 다시 추가해주세요.');
      const {error:uploadError}=await db.storage.from('listing-photos').upload(path,output,{contentType:'image/webp',upsert:false});
      if(uploadError)throw failure(503,'UPLOAD_FAILED','사진 저장에 실패했습니다. 다시 시도해주세요.');
      const {error:readyError}=await db.from('listing_media').update({status:'ready',byte_size:output.length}).eq('id',id).eq('owner_user_id',actor);
      if(readyError)throw failure(503,'UPLOAD_FAILED','사진 저장 결과를 확인할 수 없습니다.');
      return finish({id});
    }
    if(request.method==='GET') {
      const params=new URL(request.url).searchParams;
      if(params.has('id')) {
        const id=params.get('id'),kind=params.get('kind');
        if(!uuid.test(id||'')||!intakeFields[kind])throw failure(404,'NOT_FOUND','신청을 찾을 수 없습니다.');
        const parent=kind==='waiting'?'housing_requests':'listings';
        let query=db.from(parent).select('id,version,created_at,delete_after').eq('id',id).eq('owner_user_id',actor).gt('delete_after',new Date().toISOString());
        if(kind!=='waiting')query=query.eq('kind',kind);
        const {data:base,error:baseError}=await query.maybeSingle();
        if(baseError)throw baseError;if(!base)throw failure(404,'NOT_FOUND','신청을 찾을 수 없습니다.');
        const table=kind==='waiting'?'housing_requests':kind==='broker'?'broker_listing_details':kind==='resident'?'shared_housing_details':'vacancy_report_details';
        const columns=intakeFields[kind].map(x=>x.column).join(',');
        const {data:stored,error:detailError}=await db.from(table).select(columns).eq(kind==='waiting'?'id':'listing_id',id).single();
        if(detailError)throw detailError;
        const values={};for(const field of intakeFields[kind]){values[field.name]=stored[field.column];if(field.kind.startsWith('unknown')&&stored[field.column]===null)values[field.name+'Unknown']=true;}
        const {data:contact,error:contactError}=await db.from('applicant_contacts').select('phone_e164').eq(kind==='waiting'?'housing_request_id':'listing_id',id).single();
        if(contactError)throw contactError;values.phone='0'+contact.phone_e164.slice(3);
        const photos=[];
        if(kind!=='waiting'){
          const {data:media,error:mediaError}=await db.from('listing_media').select('id,object_path').eq('listing_id',id).eq('owner_user_id',actor).eq('status','ready');
          if(mediaError)throw mediaError;
          for(const m of media){const {data:signed,error}=await db.storage.from('listing-photos').createSignedUrl(m.object_path,300);if(error)throw error;photos.push({id:m.id,url:signed.signedUrl});}
        }
        return finish({application:{...base,kind,data:values,photos}});
      }
      const result=[];
      for(const kind of Object.keys(intakeFields)){
        const table=kind==='waiting'?'housing_requests':'listings';
        let query=db.from(table).select('id,version,created_at,delete_after').eq('owner_user_id',actor).gt('delete_after',new Date().toISOString()).order('created_at',{ascending:false}).limit(100);
        if(kind!=='waiting')query=query.eq('kind',kind);
        const {data,error}=await query;if(error)throw error;
        // 목록은 최소 메타데이터만 반환한다. 번호·주소·전체 DB 행을 직렬화하지 않는다.
        for(const row of data)result.push({...row,kind});
      }
      return finish({applications:result});
    }
    if(!request.headers.get('content-type')?.startsWith('application/json'))throw failure(415,'JSON_REQUIRED','요청 형식을 확인해주세요.');
    let body;try{body=JSON.parse((await limitedBody(request,65536)).toString('utf8'));}catch(e){if(e instanceof AuthFailure)throw e;throw failure(400,'INVALID_JSON','입력 내용을 확인해주세요.');}
    const key=request.headers.get('idempotency-key');const input=validateIntake(body,key);
    const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const {data,error}=await db.rpc('save_intake',{p_actor:actor,p_kind:input.kind,p_key:key,p_hash:hash,p_id:input.id,p_version:input.version,p_data:input.data,p_phone:input.phone,p_optional:input.optional,p_media:input.media});
    if(error){const msg=error.message??'';if(/CONFLICT/.test(msg))throw failure(409,'CONFLICT','신청이 이미 있거나 변경되었습니다. 저장 내역을 확인해주세요.');if(/NOT_FOUND/.test(msg))throw failure(404,'NOT_FOUND','수정할 신청을 찾을 수 없습니다.');if(/RATE_LIMIT/.test(msg))throw failure(429,'RATE_LIMITED','신청이 많습니다. 잠시 후 다시 시도해주세요.');throw failure(400,'SAVE_FAILED','입력 내용과 사진을 확인한 뒤 다시 저장해주세요.');}
    return finish({application:data},201);
  } catch(error) {
    // 요청·외부 오류에는 번호/주소/키가 포함될 수 있으므로 로깅하거나 원문 반환하지 않는다.
    const e=error instanceof AuthFailure?error:failure(503,'DATA_UNAVAILABLE','저장 서버에 연결할 수 없습니다. 같은 화면에서 다시 시도해주세요.');
    return finish({error:{code:e.code,message:e.message}},e.status);
  }
}
