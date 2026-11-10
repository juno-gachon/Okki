import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {housingStatus,officialLhUrl} from '../shared/public-housing.mjs';
const fields='id,title,housing_category,source_status,posted_on,closes_on,source_url,schedules,notes,documents,version,checked_at';
const supplyFields='notice_id,ordinal,complex_name,address,housing_type,exclusive_area,supply_area,household_count,recruitment_count,deposit_text,rent_text';
export async function handlePublicHousing(request,deps={}) {
  // This unauthenticated endpoint exposes only verified public LH content, never intake/user data.
  // Service-role access is limited to fixed tables, projections and filters; no upstream fetch here.
  const finish=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  try{
    const id=new URL(request.url).searchParams.get('id');
    if(id&&!/^[0-9a-f-]{36}$/i.test(id))return finish({error:'공고를 찾을 수 없습니다.'},404);
    const db=deps.db??createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    let query=db.from('public_housing_notices').select(fields).order('posted_on',{ascending:false}).order('id').limit(500);
    if(id)query=query.eq('id',id);
    const {data:rows,error}=await query;if(error)throw new Error();
    if(id&&!rows.length)return finish({error:'공고를 찾을 수 없습니다.'},404);
    if(!rows.length)return finish({notices:[],automaticSync:false});
    const {data:supplies,error:supplyError}=await db.from('public_housing_supplies').select(supplyFields).in('notice_id',rows.map(n=>n.id)).order('ordinal').limit(1000);
    if(supplyError||supplies.length===1000)throw new Error();
    const notices=rows.map(n=>({...n,source_url:officialLhUrl(n.source_url),display_status:housingStatus(n,deps.now??new Date()),supplies:supplies.filter(s=>s.notice_id===n.id)})).filter(n=>n.source_url&&n.supplies.length);
    return finish({notices,automaticSync:false,truncated:rows.length===500});
  }catch{return finish({error:'공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'},503);}
}
