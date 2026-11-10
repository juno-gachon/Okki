import 'server-only';

const endpoints = {list:'lhLeaseNoticeInfo1/lhLeaseNoticeInfo1', supply:'lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1'};
export async function boundedText(response, limit=4000000) {
  const reader=response.body.getReader();let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new Error('LH_RESPONSE_TOO_LARGE');}chunks.push(value);}
  return Buffer.concat(chunks).toString('utf8');
}
export async function lhRequest(kind, params, deps={}) {
  const key=deps.key??process.env.DATA_GO_KR_KEY;
  if(!key||!endpoints[kind])throw new Error('LH_CONFIG_MISSING');
  // Only fixed upstream endpoints receive the key; redirects and raw errors must not leak it.
  const url=new URL('https://apis.data.go.kr/B552555/'+endpoints[kind]);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
  url.searchParams.set('ServiceKey',key);
  try{
    const res=await (deps.fetch??fetch)(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(25000)});
    if(!res.ok)throw new Error('HTTP');
    const data=JSON.parse(await boundedText(res));
    if(!Array.isArray(data))throw new Error('SHAPE');
    const result=data.find(x=>Array.isArray(x.resHeader));
    if(result?.resHeader?.[0]?.SS_CODE!=='Y')throw new Error('UPSTREAM');
    return {result,search:data.find(x=>x.dsSch)?.dsSch?.[0]??{}};
  }catch{throw new Error('LH_'+kind.toUpperCase()+'_UNAVAILABLE');}
}
export async function listLhNotices({from,to,types=['06','13']},deps={}) {
  if(!/^\d{8}$/.test(from)||!/^\d{8}$/.test(to)||from>to)throw new Error('INVALID_RANGE');
  const result=[];
  for(const type of types){
    const seen=new Set();let total=null;let count=0;
    for(let page=1;page<=200;page++){
      const {result:body,search}=await lhRequest('list',{PG_SZ:100,PAGE:page,UPP_AIS_TP_CD:type,PAN_ST_DT:from,PAN_ED_DT:to},deps);
      if(search.PAN_ST_DT!==from||search.PAN_ED_DT!==to)throw new Error('LH_RANGE_MISMATCH');
      const rows=body.dsList;if(!Array.isArray(rows))throw new Error('LH_LIST_SHAPE');
      const nextTotal=rows.length?Number(rows[0].ALL_CNT):0;
      if(total===null)total=nextTotal;
      if(!Number.isSafeInteger(total)||total<0|| (rows.length&&total!==nextTotal))throw new Error('LH_COUNT_CHANGED');
      for(const row of rows){const id=row.CCR_CNNT_SYS_DS_CD+':'+row.PAN_ID;if(!row.PAN_ID||seen.has(id))throw new Error('LH_DUPLICATE_PAGE');seen.add(id);result.push(row);}
      count+=rows.length;
      if(count===total)break;
      if(!rows.length||count>total||page===200)throw new Error('LH_INCOMPLETE_LIST');
    }
  }
  return result;
}
export async function supplyLhNotice(row,deps={}) {
  const params=Object.fromEntries(['SPL_INF_TP_CD','CCR_CNNT_SYS_DS_CD','PAN_ID','UPP_AIS_TP_CD','AIS_TP_CD'].map(k=>[k,row[k]]));
  if(Object.values(params).some(v=>!v||!/^\w{1,40}$/.test(v)))throw new Error('LH_SUPPLY_CODES_MISSING');
  const {result}=await lhRequest('supply',params,deps);
  return Object.entries(result).filter(([k,v])=>/^dsList\d+$/.test(k)&&Array.isArray(v)).flatMap(([,v])=>v);
}
