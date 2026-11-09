import 'server-only';
import {NextResponse} from 'next/server.js';
import {authConfig,createAuthClient} from './supabase-auth.mjs';
import {dataClient} from './intake-handler.mjs';
import {requireAdmin} from './admin-auth.mjs';
import {AuthFailure,readJson} from './auth-input.mjs';
import {uuid} from './intake-input.mjs';
import {intakeFields} from '../shared/intake-fields.mjs';
export async function handleAdmin(request,deps={}) {
 let config;const cookies=[];
 const finish=(body,status=200)=>{const r=NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','Referrer-Policy':'no-referrer'}});for(const c of cookies)r.cookies.set(c.name,c.value,c.options);return r;};
 try{
 config=(deps.config??authConfig)();
 if(request.method==='POST' && (request.headers.get('origin')!==config.origin || ['cross-site','same-site'].includes(request.headers.get('sec-fetch-site'))))throw new AuthFailure(403,'ORIGIN','접근할 수 없습니다.');
 const db=(deps.db??dataClient)(config);
 const actor=await requireAdmin((deps.auth??createAuthClient)(request,config,cookies),db);
 const p=new URL(request.url).searchParams;
 if(p.has('session'))return finish({admin:true});
 // Global history is operator-only, just like intake details. Never include contact data.
 if(request.method==='GET' && p.get('kind')==='matches'){
 if(p.has('match')){
 const id=p.get('match');if(!uuid.test(id))throw new AuthFailure(404,'MISSING','매칭을 찾을 수 없습니다.');
 const read=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 const m=await read(db.from('match_deliveries').select('housing_request_id,listing_id').eq('id',id).maybeSingle());if(!m)throw new AuthFailure(404,'MISSING','매칭을 찾을 수 없습니다.');
 // Operator-only comparison uses allowlisted current conditions, never contacts or free text.
 const [h,b]=await Promise.all([read(db.from('housing_requests').select('regions,any_region,types,deposit,budget,date,latest_date,sharing,transport,work_region').eq('id',m.housing_request_id).maybeSingle()),read(db.from('broker_listing_details').select('region,type,deposit,rent,fee,date').eq('listing_id',m.listing_id).maybeSingle())]);
 return finish({request:h,listing:b});
 }
 const offset=Number(p.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)throw new AuthFailure(400,'INPUT','페이지를 확인해주세요.');
 const {data,error}=await db.from('match_deliveries').select('id,housing_request_id,listing_id,created_at,channel,status,delivered_at').order('created_at',{ascending:false}).order('id').range(offset,offset+49);
 if(error)throw error;return finish({matches:data});
 }
 const kind=p.get('kind')||'waiting';if(!intakeFields[kind])throw new AuthFailure(400,'INPUT','신청 유형을 확인해주세요.');
 const table=kind==='waiting'?'housing_requests':'listings',fk=kind==='waiting'?'housing_request_id':'listing_id';
 const run=async q=>{const {data,error}=await q;if(error)throw error;return data;};
 if(request.method==='POST'){
 const b=await readJson(request);
 if(!uuid.test(b.id||'')||!Number.isInteger(b.version)||!['review','contact'].includes(b.action)||typeof b.result!=='string'||typeof b.note!=='string'||b.note.length>1000)throw new AuthFailure(400,'INPUT','입력 내용을 확인해주세요.');
 const {error}=await db.rpc('record_admin_action',{p_actor:actor.userId,p_kind:kind,p_id:b.id,p_version:b.version,p_action:b.action,p_result:b.result,p_note:b.note});
 if(error)throw new AuthFailure(409,'CONFLICT','내용이 변경되었거나 저장할 수 없습니다. 다시 조회해주세요.');return finish({saved:true});
 }
 let q=db.from(table).select(kind==='waiting'?'id,version,created_at,status':'id,version,created_at,review_status').gt('delete_after',new Date().toISOString());if(kind!=='waiting')q=q.eq('kind',kind);
 if(!p.has('id')){const offset=Number(p.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)throw new AuthFailure(400,'INPUT','페이지를 확인해주세요.');return finish({applications:await run(q.order('created_at',{ascending:false}).order('id').range(offset,offset+49))});}
 const id=p.get('id');if(!uuid.test(id))throw new AuthFailure(404,'NOT_FOUND','신청을 찾을 수 없습니다.');const base=await run(q.eq('id',id).maybeSingle());if(!base)throw new AuthFailure(404,'NOT_FOUND','신청을 찾을 수 없습니다.');
 // Audit before releasing contact details. Never copy phone or form data to the audit record.
 const {error}=await db.rpc('record_admin_action',{p_actor:actor.userId,p_kind:kind,p_id:id,p_version:base.version,p_action:'view',p_result:'intake_follow_up',p_note:''});if(error)throw error;
 const detailTable=kind==='waiting'?table:kind==='broker'?'broker_listing_details':kind==='resident'?'shared_housing_details':'vacancy_report_details';
 const [fields,contact,history,matches]=await Promise.all([
 run(db.from(detailTable).select(intakeFields[kind].map(f=>f.column).join(',')).eq(kind==='waiting'?'id':'listing_id',id).single()),
 run(db.from('applicant_contacts').select('phone_e164,verification_status').eq(fk,id).maybeSingle()),
 run(db.from('admin_records').select('id,created_at,action,result,note').eq(fk,id).order('created_at',{ascending:false}).limit(100)),
 run(db.from('match_deliveries').select('id,housing_request_id,listing_id,created_at,channel,status,delivered_at').eq(fk,id).order('created_at',{ascending:false}).limit(100))]);
 return finish({application:base,fields:intakeFields[kind].map(f=>({label:f.label,value:fields[f.column]})),contact,history,matches});
 }catch(e){return finish({error:{message:e instanceof AuthFailure?e.message:'관리 서버에 연결할 수 없습니다.'}},e instanceof AuthFailure?e.status:503);}
}
