create function public.refresh_web_matches_for(p_actor uuid) returns integer language plpgsql security invoker set search_path='' as $$
declare n integer;begin
 perform pg_advisory_xact_lock(780019);
 insert into public.match_deliveries(housing_request_id,listing_id,channel,status,delivered_at)
 select housing_request_id,listing_id,'web','delivered',now() from public.eligible_broker_pairs e where e.recipient_id=p_actor or exists(select 1 from public.listings l where l.id=e.listing_id and l.owner_user_id=p_actor)
 on conflict(housing_request_id,listing_id) where channel='web' do nothing;
 get diagnostics n=row_count;return n;
end $$;
revoke all on function public.refresh_web_matches_for(uuid) from public,anon,authenticated;
grant execute on function public.refresh_web_matches_for(uuid) to service_role;
-- Preserve the already deployed intake validation and writes; replace only its match call.
do $$ declare source text; begin
 source:=pg_get_functiondef('public.save_intake(uuid,text,uuid,text,uuid,integer,jsonb,text,boolean,uuid[])'::regprocedure);
 if position('perform public.refresh_web_matches();' in source)=0 then raise exception 'UNEXPECTED_SAVE_DEFINITION';end if;
 execute replace(source,'perform public.refresh_web_matches();','perform public.refresh_web_matches_for(p_actor);');
end $$;
revoke all on function public.refresh_web_matches() from service_role;
