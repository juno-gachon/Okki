create table public.admin_memberships(user_id uuid primary key references auth.users on delete cascade,role text not null check(role in ('owner','operator','analyst')),active boolean not null default false);
create table public.admin_records(id uuid primary key default gen_random_uuid(),housing_request_id uuid references public.housing_requests on delete cascade,listing_id uuid references public.listings on delete cascade,actor uuid references auth.users on delete set null,created_at timestamptz not null default now(),action text not null check(action in ('view','contact','review')),result text not null,note varchar(1000) not null default '',check(num_nonnulls(housing_request_id,listing_id)=1));
create index admin_records_request on public.admin_records(housing_request_id,created_at);
create index admin_records_listing on public.admin_records(listing_id,created_at);
-- Delivery evidence is separate from a candidate or an operator's contact note.
create table public.match_deliveries(id uuid primary key default gen_random_uuid(),housing_request_id uuid not null references public.housing_requests on delete cascade,listing_id uuid not null references public.listings on delete cascade,created_at timestamptz not null default now(),channel text not null check(channel in ('web','sms')),status text not null check(status in ('accepted','delivered','failed','unknown')),delivered_at timestamptz,check((status='delivered')=(delivered_at is not null)));
create index match_deliveries_request on public.match_deliveries(housing_request_id,created_at);
create index match_deliveries_listing on public.match_deliveries(listing_id);
alter table public.admin_memberships enable row level security;
alter table public.admin_records enable row level security;
alter table public.match_deliveries enable row level security;
revoke all on public.admin_memberships,public.admin_records,public.match_deliveries from public,anon,authenticated;
grant select on public.admin_memberships to service_role;
grant select,insert on public.admin_records to service_role;
grant select on public.match_deliveries to service_role;
-- Caller is a server-verified Auth UUID. Membership is locked and rechecked in the transaction.
create function public.record_admin_action(p_actor uuid,p_kind text,p_id uuid,p_version integer,p_action text,p_result text,p_note text) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.admin_memberships where user_id=p_actor and active and role in ('owner','operator') for share;
 if not found then raise exception 'FORBIDDEN';end if;
 if p_kind not in ('waiting','broker','resident','vacancy') or p_action not in ('contact','review','view') or length(p_note)>1000 then raise exception 'INVALID_INPUT';end if;
 if p_kind='waiting' then
 perform 1 from public.housing_requests where id=p_id and delete_after>now() and (p_action='view' or version=p_version) for update;
 else
 perform 1 from public.listings where id=p_id and kind=p_kind and delete_after>now() and (p_action='view' or version=p_version) for update;
 end if;
 if not found then raise exception 'CONFLICT';end if;
 if p_action='review' then
 if p_kind not in ('resident','vacancy') or p_result not in ('received','reviewing','needs_update','reviewed') then raise exception 'INVALID_INPUT';end if;
 update public.listings set review_status=p_result,version=version+1,updated_at=now() where id=p_id;
 elsif p_action='contact' then
 if p_result not in ('attempted','unreachable','connected','follow_up','closed') then raise exception 'INVALID_INPUT';end if;
 if p_kind='waiting' then update public.housing_requests set version=version+1,updated_at=now() where id=p_id;
 else update public.listings set version=version+1,updated_at=now() where id=p_id;end if;
 end if;
 insert into public.admin_records(housing_request_id,listing_id,actor,action,result,note) values(case when p_kind='waiting' then p_id end,case when p_kind<>'waiting' then p_id end,p_actor,p_action,p_result,p_note);
end $$;
revoke all on function public.record_admin_action(uuid,text,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.record_admin_action(uuid,text,uuid,integer,text,text,text) to service_role;
