import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import {listLhNotices,supplyLhNotice} from '../lib/server/lh-api.mjs';
import {officialLhUrl,dateOnly} from '../lib/shared/public-housing.mjs';
import {fetchLhPage} from './lib/lh-page.mjs';

const args=process.argv.slice(2);const apply=args.includes('--apply');
const value=(flag,fallback)=>{const i=args.indexOf(flag);return i<0?fallback:args[i+1];};
const to=value('--to',new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-',''));
const from=value('--from',to.slice(0,4)+'0101');
const checkedAt=new Date().toISOString();
const norm=s=>String(s??'').replace(/\s/g,'');
const field=(v,max=300)=>String(v??'').trim().slice(0,max)||null;
try{
  if(apply && (process.env.LH_SYNC_TARGET!=='develop'||new URL(process.env.SUPABASE_URL).hostname!=='osmxevxdsgvphqvdjnls.supabase.co'))throw new Error('DEVELOP_TARGET_REQUIRED');
  const rows=await listLhNotices({from,to});
  const candidates=rows.filter(r=>/임대|행복주택|장기전세/.test(r.AIS_TP_CD_NM??'')&&!/상가|어린이집/.test(r.AIS_TP_CD_NM??'')&&(/충청북도|전국/.test(r.CNP_CD_NM??'')||!r.CNP_CD_NM||/옥천|충북/.test(r.PAN_NM??'')));
  console.log(JSON.stringify({phase:'listed',from,to,total:rows.length,candidates:candidates.length}));
  const bundles=[];let skipped=0;let failures=0;
  for(const [index,row] of candidates.entries()){
    try{
      const url=officialLhUrl(row.DTL_URL);if(!url)throw new Error('BAD_URL');
      const page=await fetchLhPage(url);
      if(!page.complexes.length){skipped++;continue;}
      const supply=await supplyLhNotice(row);
      const local=supply.flatMap(s=>{
        const complex=page.complexes.find(c=>norm(c.name)===norm(s.SBD_LGO_NM));
        if(!complex)return [];
        return [{complex_name:complex.name,address:complex.address,housing_type:field(s.HTY_NNA),exclusive_area:field(s.DDO_AR),supply_area:field(s.SPL_AR),household_count:field(s.HSH_CNT),recruitment_count:field(s.NOW_HSH_CNT),deposit_text:field(s.LS_GMY),rent_text:field(s.RFE)}];
      });
      if(!local.length)throw new Error('LOCAL_SUPPLY_UNRESOLVED');
      const notice={external_id:row.PAN_ID,system_code:row.CCR_CNNT_SYS_DS_CD,title:field(row.PAN_NM,500),housing_category:field(row.AIS_TP_CD_NM),source_status:field(row.PAN_SS),posted_on:dateOnly(row.PAN_NT_ST_DT),closes_on:dateOnly(row.CLSG_DT),source_url:url,schedules:page.schedules,notes:page.notes,documents:page.documents};
      const content_hash=createHash('sha256').update(JSON.stringify({notice,supplies:local})).digest('hex');
      bundles.push({...notice,supplies:local,content_hash});
      console.log(JSON.stringify({phase:'verified',title:notice.title,supplies:local.length}));
    }catch{failures++;console.log(JSON.stringify({phase:'unresolved',index:index+1}));}
    finally{if((index+1)%10===0)console.log(JSON.stringify({phase:'progress',processed:index+1,total:candidates.length}));}
  }
  // A failed region/detail lookup is not evidence that an existing notice disappeared.
  // Only complete notices are upserted. No absence-based delete or automatic notification.
  if(apply&&bundles.length){
    const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await db.rpc('sync_public_housing',{p_notices:bundles,p_checked_at:checkedAt});
    if(error)throw new Error('DB_SYNC_FAILED');
  }
  console.log(JSON.stringify({phase:'finished',apply,notices:bundles.length,supplies:bundles.reduce((n,b)=>n+b.supplies.length,0),unverifiedRegion:skipped,failures,checkedAt}));
  if(failures)process.exitCode=2;
}catch(error){console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error.message)?error.message:'SYNC_FAILED'}));process.exitCode=1;}
