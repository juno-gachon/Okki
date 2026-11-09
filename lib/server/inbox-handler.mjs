import 'server-only';
import {NextResponse} from 'next/server.js';
import {authConfig,createAuthClient} from './supabase-auth.mjs';
import {dataClient} from './intake-handler.mjs';
import {AuthFailure} from './auth-input.mjs';
import {uuid} from './intake-input.mjs';
export async function handleInbox(request,deps={}){
 const changes=[];let config;
 const finish=(data,status=200)=>{const r=NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});for(const c of changes)r.cookies.set(c.name,c.value,c.options);return r;};
 try{config=(deps.config??authConfig)();const auth=(deps.auth??createAuthClient)(request,config,changes);const {data,error}=await auth.auth.getUser();if(error||!data?.user)throw new AuthFailure(401,'AUTH','로그인이 필요합니다.');const db=(deps.db??dataClient)(config);const run=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 // Service access bypasses RLS: verified owner and current eligibility are mandatory on every read.
 const own=await run(db.from('housing_requests').select('id').eq('owner_user_id',data.user.id).gt('delete_after',new Date().toISOString()).maybeSingle());if(!own){if(new URL(request.url).searchParams.has('id'))throw new AuthFailure(404,'MISSING','현재 안내 가능한 매물이 아닙니다.');return finish({notifications:[]});}
 const rows=await run(db.from('match_deliveries').select('id,listing_id,created_at,status').eq('housing_request_id',own.id).eq('channel','web').order('created_at',{ascending:false}).limit(100));
 const eligible=await run(db.from('eligible_broker_pairs').select('listing_id').eq('housing_request_id',own.id));const valid=new Set(eligible.map(x=>x.listing_id));const notifications=rows.filter(x=>valid.has(x.listing_id));
 const id=new URL(request.url).searchParams.get('id');if(!id)return finish({notifications});const match=notifications.find(x=>x.id===id);if(!uuid.test(id)||!match)throw new AuthFailure(404,'MISSING','현재 안내 가능한 매물이 아닙니다.');
 // Explicit public summary only: never applicant contact, exact address or internal notes.
 const photoId=new URL(request.url).searchParams.get('photo');
 if(photoId){
  if(!uuid.test(photoId))throw new AuthFailure(404,'MISSING','사진을 찾을 수 없습니다.');
  // 매번 수신자·유효한 매칭과 사진의 매물 연결을 검증한다. Storage 경로는 노출하지 않는다.
  const media=await run(db.from('listing_media').select('object_path').eq('id',photoId).eq('listing_id',match.listing_id).eq('status','ready').maybeSingle());
  if(!media)throw new AuthFailure(404,'MISSING','사진을 찾을 수 없습니다.');
  const {data:blob,error:downloadError}=await db.storage.from('listing-photos').download(media.object_path);if(downloadError)throw downloadError;
  const response=new NextResponse(await blob.arrayBuffer(),{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  for(const c of changes)response.cookies.set(c.name,c.value,c.options);return response;
 }
 const listing=await run(db.from('broker_listing_details').select('title,type,region,deposit,rent,fee,fee_items,date,min,max,kitchen,bath,facilities,rules,office').eq('listing_id',match.listing_id).single());
 const media=await run(db.from('listing_media').select('id').eq('listing_id',match.listing_id).eq('status','ready').limit(5));
 return finish({match,listing,photos:media.map(x=>({id:x.id,url:'/api/inbox?id='+encodeURIComponent(match.id)+'&photo='+encodeURIComponent(x.id)}))});
 }catch(e){return finish({error:{message:e instanceof AuthFailure?e.message:'알림을 불러오지 못했습니다.'}},e instanceof AuthFailure?e.status:503);}
}
