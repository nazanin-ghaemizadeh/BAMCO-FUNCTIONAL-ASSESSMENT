-- All fixtures roll back; production routes are not modified.
begin;
do $$
declare claims jsonb; saved jsonb; result jsonb; doc jsonb; denied boolean:=false;
begin
 if has_function_privilege('anon','public.bamco_banks(text,jsonb)','execute') then raise exception 'Anonymous access'; end if;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.bamco_banks('list','{"kind":"routes"}'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Missing actor accepted'; end if;
  select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated') into claims
  from auth.users u join auth.sessions s on s.user_id=u.id
  where u.raw_app_meta_data->'bamco_functional'->>'admin'='true'
    and (u.banned_until is null or u.banned_until<=now())
    and (not (u.raw_app_meta_data ? 'bamco_functional_since')
      or s.created_at >= (u.raw_app_meta_data->>'bamco_functional_since')::timestamptz)
  limit 1;
  if claims is null then raise exception 'No existing authorized test context available'; end if;
  perform set_config('request.jwt.claims',claims::text,true);

 doc:='{"name":"Route integrity fixture","origin":"QA integrity A","destination":"QA integrity B","routeId":"rural","active":true,"bidirectional":true,"km":12,"notes":"","originPoint":[51.389,35.6892],"destinationPoint":[53.395,35.577]}';
 saved:=public.bamco_banks('save',jsonb_build_object('kind','routes','revision',0,'definition',doc));
 if saved->>'id' is null or saved->'definition'->'destinationPoint'<>doc->'destinationPoint' then raise exception 'Coordinates not saved'; end if;
 doc:=doc||'{"origin":"QA integrity B","destination":"QA integrity A","routeId":"hot"}';
 result:=public.bamco_banks('save',jsonb_build_object('kind','routes','revision',0,'definition',doc));
 if result->>'duplicate' is distinct from 'true' then raise exception 'Reverse road accepted'; end if;
 doc:=doc||'{"origin":"QA integrity A","destination":"QA integrity B","routeId":"mountain"}';
 result:=public.bamco_banks('save',jsonb_build_object('kind','routes','revision',0,'definition',doc));
 if result->>'duplicate' is distinct from 'true' then raise exception 'Second road category accepted'; end if;
 result:=public.bamco_banks('save',jsonb_build_object('kind','routes','id',saved->>'id','revision',1,'definition',doc));
 if result->>'revision'<>'2' or result->'definition'->>'routeId'<>'mountain' then raise exception 'Own category edit rejected'; end if;
 doc:=doc||'{"origin":"QA different city","destinationPoint":[-100,200]}';denied:=false;
 begin perform public.bamco_banks('save',jsonb_build_object('kind','routes','revision',0,'definition',doc)); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'Invalid coordinates accepted'; end if;
end;
$$;
rollback;
select 'PASS: coordinate persistence/validation, exclusive categories, reverse duplicates, self-edit and authorization' as result;
