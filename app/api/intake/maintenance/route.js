import { timingSafeEqual,createHash } from 'node:crypto';
import { authConfig } from '../../../../lib/server/supabase-auth.mjs';
import { dataClient } from '../../../../lib/server/intake-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request) {
  const secret=process.env.CRON_SECRET;
  const hash=s=>createHash('sha256').update(s).digest();
  if(!secret || !timingSafeEqual(hash(request.headers.get('authorization')||''),hash('Bearer '+secret)))return Response.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
  try{
    const db=dataClient(authConfig());let deleted=0;
    for(const table of ['housing_requests','listings']){
      const {data,error}=await db.from(table).select(table==='listings'?'id,owner_user_id,version,kind':'id,owner_user_id,version').lte('delete_after',new Date().toISOString()).limit(100);
      if(error)throw error;
      for(const a of data){const {error}=await db.rpc('delete_intake',{p_actor:a.owner_user_id,p_kind:a.kind||'waiting',p_id:a.id,p_version:a.version});if(error)throw error;deleted++;}
    }
    // 미완료·교체된 사진은 먼저 DB에서 격리해 신청 연결과 경합하지 않게 한 뒤 Storage에서 삭제한다.
    const {error:markError}=await db.from('listing_media').update({status:'deleting'}).is('listing_id',null).lte('expires_at',new Date().toISOString());if(markError)throw markError;
    const {data:media,error:mediaError}=await db.from('listing_media').select('id,object_path').eq('status','deleting').limit(100);if(mediaError)throw mediaError;
    for(const m of media){const {error}=await db.storage.from('listing-photos').remove([m.object_path]);if(error)throw error;const result=await db.from('listing_media').delete().eq('id',m.id).eq('status','deleting');if(result.error)throw result.error;}
    return Response.json({deleted,photos:media.length},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Cleanup failed'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
