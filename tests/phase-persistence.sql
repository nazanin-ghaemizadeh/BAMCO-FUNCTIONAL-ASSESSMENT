-- Test only temporary snapshots and roll everything back.
begin;
do $$
declare claims jsonb; created jsonb; saved jsonb; opened jsonb; source jsonb; viewed jsonb; merged jsonb;
begin
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated') into claims
 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.raw_app_meta_data->'bamco_functional'->>'admin'='true'
 and (u.banned_until is null or u.banned_until<=now())
 and (not (u.raw_app_meta_data ? 'bamco_functional_since')
 or s.created_at >= (u.raw_app_meta_data->>'bamco_functional_since')::timestamptz)
 limit 1;
 if claims is null then raise exception 'No authorized fixture context'; end if;
 perform set_config('request.jwt.claims',claims::text,true);

 source := '{"setupComplete":true,"config":{"durKm":35000,"durabilityPhaseVersion":1,"durabilityPhaseTargets":[{"urban":4000},{"urban":2000},{"urban":2000},{"urban":750}]},"durabilitySchedule":[{"day":1,"phase":1,"cycle":1,"routeId":"urban","roadId":"fixture-route","km":100}],"records":{"durability:phase-1:CR-0002":{"score":8},"durability:phase-2:CR-0002":{"score":6},"drive:1:CR-0002":{"score":9}},"mileage":{"drive":{},"durability":{}},"missions":{}}';
 created := public.bamco_assessment('create',jsonb_build_object('title','Transactional phase fixture','assessment_type','durability','snapshot',source));
 opened := public.bamco_assessment('open',jsonb_build_object('id',created->>'id'));
 if opened->'snapshot' is distinct from source then raise exception 'Phase create/reopen lost data'; end if;
 source := jsonb_set(source,'{records,durability:phase-3:CR-0002}','{"score":7}');
 saved := public.bamco_assessment('save',jsonb_build_object('id',created->>'id','revision',opened->'revision','snapshot',source));
 if saved->>'revision' is null then raise exception 'Phase save failed'; end if;
 opened := public.bamco_assessment('open',jsonb_build_object('id',created->>'id'));
 if opened->'snapshot' is distinct from source then raise exception 'Phase save/reopen lost data'; end if;
 viewed := private.bamco_view_snapshot(source,'["durability"]');
 if viewed#>'{config,durabilityPhaseTargets}' is distinct from source#>'{config,durabilityPhaseTargets}'
 or viewed#>'{config,durabilityPhaseVersion}' is distinct from '1'::jsonb
 or viewed#>'{records,durability:phase-1:CR-0002,score}' is distinct from '8'::jsonb
 or viewed->'records' ? 'drive:1:CR-0002' then raise exception 'Scoped phase read failed'; end if;
 viewed := jsonb_set(viewed,'{records,durability:phase-1:CR-0002,score}','10');
 viewed := jsonb_set(viewed,'{config,durabilityPhaseTargets}','[]');
 merged := private.bamco_merge_snapshot(source,viewed,'["durability"]');
 if merged#>'{config,durabilityPhaseTargets}' is distinct from source#>'{config,durabilityPhaseTargets}'
 or merged#>'{records,drive:1:CR-0002,score}' is distinct from '9'::jsonb
 or merged#>'{records,durability:phase-1:CR-0002,score}' is distinct from '10'::jsonb
 or merged#>'{records,durability:phase-2:CR-0002,score}' is distinct from '6'::jsonb then
 raise exception 'Scoped phase write changed protected data'; end if;
end;
$$;
rollback;
select 'PASS: four-phase save/reopen, scoped reads and writes, isolated answers and protected route targets' as result;
