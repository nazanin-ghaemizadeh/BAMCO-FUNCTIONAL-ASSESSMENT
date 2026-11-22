-- Disposable fixtures only. No changes survive this integration test.
begin;
do $$
declare
 claims jsonb;
 doc jsonb;
 saved jsonb;
 result jsonb;
 fixture text := 'QB-' || gen_random_uuid()::text;
 denied boolean := false;
begin
 if has_function_privilege('anon','public.bamco_question_bank(text,jsonb)','execute')
  or has_function_privilege('authenticated','private.bamco_question_scope(jsonb)','execute') then
  raise exception 'Unexpected direct access';
 end if;
 perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.bamco_question_bank('list','{}');
 exception when insufficient_privilege then denied := true;
 end;
 if not denied then raise exception 'Missing actor was accepted'; end if;
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated') into claims
 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.raw_app_meta_data->'bamco_functional'->>'admin'='true'
 and (u.banned_until is null or u.banned_until<=now())
 and (not (u.raw_app_meta_data ? 'bamco_functional_since')
 or s.created_at >= (u.raw_app_meta_data->>'bamco_functional_since')::timestamptz)
 limit 1;
 if claims is null then raise exception 'No authorized fixture context'; end if;
 perform set_config('request.jwt.claims',claims::text,true);
 doc := '{"cat":"فرآیند و طراحی برای تولید","sub":"fixture","name":"Placement fixture","profile":"","measure":"","route":"","freq":"","active":true,"stationary":false,"scope":["drive","durability"],"days":[1,4,26],"routeIds":[],"loadConditions":[],"vehicle":{"cls":["all"],"body":["all"],"power":["all"],"gear":["all"],"drive":["all"]}}';
 saved := public.bamco_question_bank('save',jsonb_build_object('id',fixture,'revision',0,'definition',doc));
 if saved->'definition'->'scope' is distinct from '["drive","supplementary"]'::jsonb
 or saved->'definition'->'days' is distinct from '[1,4,26]'::jsonb then
  raise exception 'Static placement or driving days changed incorrectly';
 end if;
 doc := jsonb_set(saved->'definition','{cat}','"ایمنی"');
 saved := public.bamco_question_bank('save',jsonb_build_object('id',fixture,'revision',1,'definition',doc));
 if saved->'definition'->'scope' is distinct from '["drive","durability"]'::jsonb
 or saved->'definition'->'days' is distinct from '[1,4,26]'::jsonb then
  raise exception 'Durability placement or driving days changed incorrectly';
 end if;
 result := public.bamco_question_bank('save',jsonb_build_object('id',fixture,'revision',1,'definition',doc));
 if result->>'conflict' is distinct from 'true' then raise exception 'Stale revision accepted'; end if;
end;
$$;
rollback;
select 'PASS: category placement, preserved driving membership and days, empty road conditions, stale revisions and access checks' as result;
