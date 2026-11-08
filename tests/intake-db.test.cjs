const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
test('Postgres intake transaction: all four kinds, ownership, idempotency, version and rollback',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    for(const file of fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort()) await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
    const {intakeFields}=await import('../lib/shared/intake-fields.mjs');
    const actor=randomUUID(),other=randomUUID();await db.query('insert into auth.users values($1),($2)',[actor,other]);
    // 실제 Supabase처럼 Auth 테이블 SELECT 권한이 없는 서비스 역할로 검증한다.
    await db.exec('set role service_role');
    const rows={};
    for(const kind of Object.keys(intakeFields)){
      const row={};for(const field of intakeFields[kind])row[field.column]=field.kind==='boolean'?true:field.kind==='array'?[]:field.kind.includes('date')?'2026-11-12':field.kind.includes('number')||field.kind==='unknown'?1:field.items?.[0]??'합성 테스트';
      row.region='옥천읍';row.regions=['옥천읍'];rows[kind]=row;
      const key=randomUUID();
      const args=[actor,kind,key,'hash',null,null,JSON.stringify(row),'+821000000000',true,[]];
      const sql='select public.save_intake($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result';
      const first=(await db.query(sql,args)).rows[0].result;
      assert.equal(first.kind,kind);assert.equal(first.version,1);
      assert.deepEqual((await db.query(sql,args)).rows[0].result,first);
      await assert.rejects(db.query(sql,args.map((x,i)=>i===3?'other-hash':x)),/IDEMPOTENCY_CONFLICT/);
      const edit=[actor,kind,randomUUID(),'edit',first.id,first.version,JSON.stringify(row),'+821000000000',false,[]];
      assert.equal((await db.query(sql,edit)).rows[0].result.version,2);
      await assert.rejects(db.query(sql,[...edit.slice(0,2),randomUUID(),...edit.slice(3)]),/VERSION_CONFLICT/);
      await assert.rejects(db.query(sql,[other,kind,randomUUID(),'other',first.id,2,JSON.stringify(row),'+821000000000',false,[]]),/NOT_FOUND/);
      if(kind==='waiting')await assert.rejects(db.query(sql,[actor,kind,randomUUID(),'duplicate',null,null,JSON.stringify(row),'+821000000000',false,[]]),/VERSION_CONFLICT/);
    }
    const bad=JSON.stringify({...rows.broker,min:-1});
    const before=(await db.query('select count(*)::int n from public.listings')).rows[0].n;
    await assert.rejects(db.query('select public.save_intake($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[actor,'broker',randomUUID(),'rollback',null,null,bad,'+821000000000',true,[]]));
    assert.equal((await db.query('select count(*)::int n from public.listings')).rows[0].n,before);
    await db.exec('reset role');
    for(const role of ['anon','authenticated']){
      await db.exec('set role '+role);
      await assert.rejects(db.query('select * from public.applicant_contacts'),/permission denied/);
      await assert.rejects(db.query('select public.save_intake($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[actor,'broker',randomUUID(),'forbidden',null,null,bad,'+821000000000',true,[]]),/permission denied/);
      await db.exec('reset role');
    }
  }finally{await db.close();}
});
