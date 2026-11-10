const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const {JSDOM}=require('jsdom');
const url='https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=synthetic';
test('public housing status: source closure/cancellation, future/current windows, KST and uncertain boundaries',async()=>{
  const {housingStatus,officialLhUrl,dateOnly}=await import('../lib/shared/public-housing.mjs');
  const now=new Date('2026-11-10T06:00:00Z');
  assert.equal(housingStatus({source_status:'접수마감'},now),'접수 마감');
  assert.equal(housingStatus({source_status:'공고중'},now),'접수 일정 확인');
  assert.equal(housingStatus({source_status:'접수중'},now),'신청 중');
  assert.equal(housingStatus({source_status:'접수중',title:'[취소공고] 합성'},now),'취소');
  assert.equal(housingStatus({schedules:[{start:'2026-11-11',end:'2026-11-12'}]},now),'신청 전');
  assert.equal(housingStatus({schedules:[{start:'2026-11-09',end:'2026-11-11'}]},now),'신청 중');
  assert.equal(housingStatus({schedules:[{start:'2026-11-09',end:'2026-11-10'}]},now),'접수 시간 확인');
  assert.equal(housingStatus({schedules:[{start:'2026-11-09',end:'2026-11-10'}]},new Date('2026-11-10T15:00:00Z')),'접수 마감');
  assert.equal(officialLhUrl('https://apply.lh.or.kr.evil.test/'),null);assert.equal(officialLhUrl('javascript:alert(1)'),null);
  assert.equal(dateOnly('20260230'),null);assert.equal(dateOnly('2026.11.10'),'2026-11-10');
});
test('upstream list: pagination must complete; failures never become empty success and keys are not in errors',async()=>{
  const {listLhNotices,lhRequest}=await import('../lib/server/lh-api.mjs');
  const mock=async u=>{const page=Number(u.searchParams.get('PAGE'));return Response.json([{dsSch:[{PAN_ST_DT:'20260101',PAN_ED_DT:'20261110'}]},{resHeader:[{SS_CODE:'Y'}],dsList:[{PAN_ID:String(page),CCR_CNNT_SYS_DS_CD:'03',ALL_CNT:'2'}]}]);};
  assert.equal((await listLhNotices({from:'20260101',to:'20261110',types:['06']},{key:'synthetic-secret',fetch:mock})).length,2);
  await assert.rejects(lhRequest('list',{}, {key:'synthetic-secret',fetch:async()=>{throw new Error('secret URL synthetic-secret');}}),e=>!e.message.includes('synthetic-secret')&&e.message==='LH_LIST_UNAVAILABLE');
  await assert.rejects(listLhNotices({from:'20260101',to:'20261110',types:['06']},{key:'test',fetch:async()=>Response.json([{dsSch:[{PAN_ST_DT:'20260910',PAN_ED_DT:'20261110'}]},{resHeader:[{SS_CODE:'Y'}],dsList:[]}])}),/RANGE_MISMATCH/);
});
test('official page region evidence excludes other districts and their default schedule',async()=>{
  const {parseLhPage}=await import('../scripts/lib/lh-page.mjs');
  const html='<div id="wrtancSbdTab0"><h4>합성옥천</h4><div class="box_st4"><li>소재지 : 충청북도 옥천군 합성로</li></div></div><div id="wrtancSbdTab1"><h4>합성청주</h4><div class="box_st4"><li>소재지 : 충청북도 청주시 합성로</li></div></div><section><h3>공급일정 <label id="refText">(합성청주)</label></h3><label id="sta_acpDt">2026.11.10 ~ 2026.11.12</label></section><script>throw Error("must not execute")</script>';
  const result=parseLhPage(html);assert.equal(result.complexes.length,1);assert.equal(result.schedules.length,0);
  const local=parseLhPage(html.replace('(합성청주)','(합성옥천)'));assert.equal(local.schedules[0].start,'2026-11-10');
});
test('catalog transaction: only Okcheon, rollback, repeat/stale import, browser grants denied',async()=>{
  const db=new PGlite();
  try{
    await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
    await db.exec(fs.readFileSync('supabase/migrations/20261110061456_public_housing_catalog.sql','utf8'));
    const n={external_id:'synthetic',system_code:'03',title:'합성 공고',housing_category:'행복주택',source_status:'공고중',posted_on:'2026-01-01',closes_on:'2026-01-30',source_url:url,schedules:[],notes:[],documents:[],content_hash:'a'.repeat(64),supplies:[{complex_name:'합성',address:'충청북도 옥천군 합성로',deposit_text:'공고문 참조'}]};
    const sql='select public.sync_public_housing($1,$2)';
    await db.exec('set role service_role');
    await db.query(sql,[JSON.stringify([n]),'2026-01-01']);await db.query(sql,[JSON.stringify([n]),'2026-01-02']);
    assert.equal((await db.query('select version from public.public_housing_notices')).rows[0].version,1);
    await assert.rejects(db.query(sql,[JSON.stringify([{...n,content_hash:'b'.repeat(64),supplies:[{complex_name:'bad',address:'충청북도 청주시'}]}]),'2026-01-03']));
    assert.equal((await db.query('select version from public.public_housing_notices')).rows[0].version,1);
    await db.query(sql,[JSON.stringify([{...n,content_hash:'c'.repeat(64),source_status:'접수마감'}]),'2026-01-03']);
    await db.query(sql,[JSON.stringify([n]),'2026-01-02']);
    assert.equal((await db.query('select source_status from public.public_housing_notices')).rows[0].source_status,'접수마감');
    assert.equal((await db.query('select count(*)::int n from public.public_housing_supplies')).rows[0].n,1);
    await db.exec('reset role');
    for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select * from public.public_housing_notices'),/permission denied/);await assert.rejects(db.query(sql,[JSON.stringify([n]),'2026-01-04']),/permission denied/);await db.exec('reset role');}
  }finally{await db.close();}
});
test('live public UI: source status, all five local rows, inert malicious text, filters and failed fetch',async()=>{
  const dom=new JSDOM('<main id="main" tabindex="-1"></main>',{url:'https://okki.example/#/public',runScripts:'outside-only'});const w=dom.window;
  w.nav=()=>{};w.scrollTo=()=>{};
  const notice={id:'synthetic',title:'<img src=x onerror=alert(1)>',housing_category:'행복주택',source_status:'접수마감',display_status:'접수 마감',posted_on:'2026-01-01',closes_on:'2026-01-02',checked_at:'2026-01-03T00:00:00Z',source_url:url,schedules:[],notes:['<script>bad</script>'],documents:[],supplies:Array.from({length:5},(_,i)=>({complex_name:'합성',address:'충청북도 옥천군 합성로',housing_type:'유형'+i,deposit_text:'공고문 참조'}))};
  w.fetch=async()=>({ok:true,json:async()=>({notices:[notice]})});w.eval(fs.readFileSync('src/public-housing-live.js','utf8')+'\nwindow.renderLivePublicHousing=renderLivePublicHousing;');
  await w.renderLivePublicHousing('notice','synthetic',false);
  assert.equal(w.document.querySelectorAll('tbody tr').length,5);assert.equal(w.document.querySelectorAll('img,script').length,0);assert.match(w.document.body.textContent,/접수 마감/);assert.match(w.document.body.textContent,/공고문 참조/);
  await w.renderLivePublicHousing('',null,false);const selects=w.document.querySelectorAll('select');selects[1].value='신청 중';selects[1].dispatchEvent(new w.Event('change'));assert.match(w.document.body.textContent,/해당하는 공고가 없습니다/);
  w.fetch=async()=>{throw new Error();};await w.renderLivePublicHousing('',null,false);assert.match(w.document.body.textContent,/불러오지 못했습니다/);assert.ok(w.document.querySelector('button'));
  dom.window.close();
});
