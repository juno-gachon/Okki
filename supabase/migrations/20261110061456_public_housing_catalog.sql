-- Public-source housing only. Browser roles cannot query tables or invoke the import RPC.
create table public.public_housing_notices (
 id uuid primary key default gen_random_uuid(),
 source text not null default 'lh' check(source='lh'),
 external_id varchar(40) not null,
 system_code varchar(10) not null,
 title varchar(500) not null check(length(trim(title))>0),
 housing_category varchar(100) not null,
 source_status varchar(100) not null,
 posted_on date,
 closes_on date,
 source_url text not null check(source_url like 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?%'),
 schedules jsonb not null default '[]' check(jsonb_typeof(schedules)='array'),
 notes jsonb not null default '[]' check(jsonb_typeof(notes)='array'),
 documents jsonb not null default '[]' check(jsonb_typeof(documents)='array'),
 content_hash varchar(64) not null check(content_hash ~ '^[0-9a-f]{64}$'),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 checked_at timestamptz not null,
 unique(source,system_code,external_id)
);
create table public.public_housing_supplies (
 id uuid primary key default gen_random_uuid(),
 notice_id uuid not null references public.public_housing_notices(id) on delete cascade,
 ordinal integer not null check(ordinal>=0),
 complex_name varchar(300) not null,
 address varchar(500) not null check(address ~ '^충청북도[[:space:]]+옥천군([[:space:]]|$)'),
 housing_type varchar(300), exclusive_area varchar(300), supply_area varchar(300),
 household_count varchar(300), recruitment_count varchar(300),
 deposit_text varchar(300), rent_text varchar(300),
 unique(notice_id,ordinal)
);
create index public_housing_notices_posted on public.public_housing_notices(posted_on desc,id);
alter table public.public_housing_notices enable row level security;
alter table public.public_housing_supplies enable row level security;
revoke all on public.public_housing_notices,public.public_housing_supplies from public,anon,authenticated;
grant select,insert,update,delete on public.public_housing_notices,public.public_housing_supplies to service_role;

create function public.sync_public_housing(p_notices jsonb,p_checked_at timestamptz)
returns integer language plpgsql security invoker set search_path='' as $$
declare n jsonb;s jsonb;target uuid;old_hash text;old_checked timestamptz;i integer;count_saved integer:=0;
begin
 if jsonb_typeof(p_notices) is distinct from 'array' or jsonb_array_length(p_notices)>500 or p_checked_at is null or p_checked_at>now()+interval '5 minutes' then raise exception 'INVALID_IMPORT';end if;
 -- One lock serializes the manual importer; external HTTP is completed before this transaction.
 perform pg_advisory_xact_lock(61110,1);
 for n in select value from jsonb_array_elements(p_notices) loop
   if jsonb_typeof(n->'supplies') is distinct from 'array' or jsonb_array_length(n->'supplies')<1 or jsonb_array_length(n->'supplies')>1000 then raise exception 'INVALID_SUPPLIES';end if;
   target:=null;old_hash:=null;old_checked:=null;
   select id,content_hash,checked_at into target,old_hash,old_checked from public.public_housing_notices where source='lh' and external_id=n->>'external_id' and system_code=n->>'system_code' for update;
   if old_checked>p_checked_at then continue;end if;
   if target is null then
     insert into public.public_housing_notices(external_id,system_code,title,housing_category,source_status,posted_on,closes_on,source_url,schedules,notes,documents,content_hash,checked_at)
     values(n->>'external_id',n->>'system_code',n->>'title',n->>'housing_category',n->>'source_status',(n->>'posted_on')::date,(n->>'closes_on')::date,n->>'source_url',n->'schedules',n->'notes',n->'documents',n->>'content_hash',p_checked_at) returning id into target;
   elsif old_hash is distinct from n->>'content_hash' then
     update public.public_housing_notices set title=n->>'title',housing_category=n->>'housing_category',source_status=n->>'source_status',posted_on=(n->>'posted_on')::date,closes_on=(n->>'closes_on')::date,source_url=n->>'source_url',schedules=n->'schedules',notes=n->'notes',documents=n->'documents',content_hash=n->>'content_hash',version=version+1,updated_at=now(),checked_at=p_checked_at where id=target;
   else
     update public.public_housing_notices set checked_at=p_checked_at where id=target;
     count_saved:=count_saved+1;continue;
   end if;
   delete from public.public_housing_supplies where notice_id=target;
   i:=0;
   for s in select value from jsonb_array_elements(n->'supplies') loop
     insert into public.public_housing_supplies(notice_id,ordinal,complex_name,address,housing_type,exclusive_area,supply_area,household_count,recruitment_count,deposit_text,rent_text)
     values(target,i,s->>'complex_name',s->>'address',s->>'housing_type',s->>'exclusive_area',s->>'supply_area',s->>'household_count',s->>'recruitment_count',s->>'deposit_text',s->>'rent_text');
     i:=i+1;
   end loop;
   count_saved:=count_saved+1;
 end loop;
 return count_saved;
end;
$$;
revoke all on function public.sync_public_housing(jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.sync_public_housing(jsonb,timestamptz) to service_role;
