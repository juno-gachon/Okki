alter table public.housing_requests add column sharing text check(sharing in ('단독 주거만','공동거주 가능','상담 후 결정'));
create or replace function public.save_intake(p_actor uuid,p_kind text,p_key uuid,p_hash text,p_id uuid,p_version integer,p_data jsonb,p_phone text,p_optional boolean,p_media uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.idempotency_records; result jsonb; target uuid; provider uuid; seeker uuid; c uuid; tbl text; old_version integer; media_count integer;
begin
 if p_actor is null or p_kind not in ('waiting','broker','resident','vacancy') then raise exception 'INVALID_INPUT'; end if;
 -- Server getUser verifies Auth. Foreign keys enforce existence without reading the private Auth table.
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
 select * into prior from public.idempotency_records where owner_user_id=p_actor and operation=p_kind and key=p_key;
 if found then if prior.request_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return prior.result;end if;
 if (select count(*) from public.idempotency_records where owner_user_id=p_actor and created_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMITED';end if;
 if p_kind='waiting' then
 insert into public.seekers(auth_user_id) values(p_actor) on conflict(auth_user_id) do nothing;
 select id into seeker from public.seekers where auth_user_id=p_actor;
 select id,version into target,old_version from public.housing_requests where seeker_id=seeker for update;
 if target is not null and (p_id is null or p_id<>target or p_version<>old_version) then raise exception 'VERSION_CONFLICT';end if;
 if target is null and p_id is not null then raise exception 'NOT_FOUND';end if;
 target:=coalesce(target,gen_random_uuid());
 if old_version is not null then
 update public.housing_requests h set "sharing"=r."sharing","situation"=r."situation","date"=r."date","latest_date"=r."latest_date","start_date"=r."start_date","duration"=r."duration","work_region"=r."work_region","work_village"=r."work_village","regions"=r."regions","any_region"=r."any_region","deposit"=r."deposit","budget"=r."budget","types"=r."types","kitchen"=r."kitchen","bath"=r."bath","transport"=r."transport","commute"=r."commute","must"=r."must","preferences"=r."preferences",version=h.version+1,updated_at=now() from jsonb_populate_record(null::public.housing_requests,p_data) r where h.id=target;
 else
 insert into public.housing_requests select r.* from jsonb_populate_record(null::public.housing_requests,p_data||jsonb_build_object('id',target,'seeker_id',seeker,'owner_user_id',p_actor,'version',coalesce(old_version,0)+1,'created_at',now(),'updated_at',now(),'status','waiting','delete_after',now()+interval '90 days')) r;
 end if;
 else
 if p_id is not null then
 select id,version into target,old_version from public.listings where id=p_id and owner_user_id=p_actor and kind=p_kind for update;
 if target is null then raise exception 'NOT_FOUND';end if;
 if p_version<>old_version then raise exception 'VERSION_CONFLICT';end if;
 else target:=gen_random_uuid();end if;
 insert into public.providers(auth_user_id,type) values(p_actor,case when p_kind='broker' then 'broker' else 'tenant' end) on conflict(auth_user_id,type) do nothing;
 select id into provider from public.providers where auth_user_id=p_actor and type=case when p_kind='broker' then 'broker' else 'tenant' end and account_status<>'suspended';
 if provider is null then raise exception 'PROVIDER_SUSPENDED';end if;
 if old_version is null then insert into public.listings(id,owner_user_id,provider_id,kind,review_status) values(target,p_actor,provider,p_kind,case when p_kind='broker' then 'not_required' else 'received' end);
 else update public.listings set version=version+1,updated_at=now() where id=target;end if;
 tbl:=case p_kind when 'broker' then 'broker_listing_details' when 'resident' then 'shared_housing_details' else 'vacancy_report_details' end;
 execute format('delete from public.%I where listing_id=$1',tbl) using target;
 execute format('insert into public.%I select r.* from jsonb_populate_record(null::public.%I,$1) r',tbl,tbl) using p_data||jsonb_build_object('listing_id',target);
 select count(*) into media_count from public.listing_media where id=any(p_media) and owner_user_id=p_actor and status='ready' and ((listing_id is null and expires_at>now()) or listing_id=target);
 if cardinality(p_media)>5 or media_count<>cardinality(p_media) or (not p_optional and cardinality(p_media)>0) then raise exception 'INVALID_MEDIA';end if;
 -- Replaced objects remain marked for deletion until the cleanup worker removes Storage objects.
 update public.listing_media set status='deleting' where listing_id=target and not(id=any(p_media));
 update public.listing_media set listing_id=target where id=any(p_media);
 end if;
 insert into public.consents(owner_user_id,housing_request_id,listing_id,purpose,policy_version) values(p_actor,case when p_kind='waiting' then target end,case when p_kind<>'waiting' then target end,'intake','privacy-v1-2026-11-08') returning id into c;
 update public.consents set attested_truth=coalesce((p_data->>'attested_truth')::boolean,false),attested_updates=coalesce((p_data->>'attested_updates')::boolean,false) where id=c;
 if p_optional then insert into public.consents(owner_user_id,housing_request_id,listing_id,purpose,policy_version) values(p_actor,case when p_kind='waiting' then target end,case when p_kind<>'waiting' then target end,'optional','privacy-v1-2026-11-08');end if;
 delete from public.applicant_contacts where housing_request_id=target or listing_id=target;
 insert into public.applicant_contacts(housing_request_id,listing_id,phone_e164,collection_consent_id) values(case when p_kind='waiting' then target end,case when p_kind<>'waiting' then target end,p_phone,c);
 result:=jsonb_build_object('id',target,'kind',p_kind,'version',coalesce(old_version,0)+1);
 insert into public.idempotency_records(owner_user_id,operation,key,request_hash,result) values(p_actor,p_kind,p_key,p_hash,result);
 return result;
end $$;
revoke all on function public.save_intake(uuid,text,uuid,text,uuid,integer,jsonb,text,boolean,uuid[]) from public,anon,authenticated;
grant execute on function public.save_intake(uuid,text,uuid,text,uuid,integer,jsonb,text,boolean,uuid[]) to service_role;
