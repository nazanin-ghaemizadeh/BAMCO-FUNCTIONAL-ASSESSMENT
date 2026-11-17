-- Run in a transaction and roll back. Only generated fixture accounts and cases are touched.
do $check$
declare uid uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); item uuid; res jsonb; doc jsonb;
  original jsonb:='{"config":{"vclass":"M1","legacy":"keep"},"setupComplete":true,"records":{"drive:1:test":{"score":4},"durability:1:test":{"score":9}},"missions":{"durability:1":{"notes":"keep"},"audit:general":{"entries":[]}},"mileage":{"drive":{"1":5},"durability":{"1":99}},"newField":"preserve"}';
begin
  if has_function_privilege('anon','public.bamco_assessment(text,jsonb)','EXECUTE')
    or has_function_privilege('anon','public.bamco_weighting(text,jsonb)','EXECUTE')
    or has_function_privilege('anon','public.bamco_live_locations()','EXECUTE')
    or has_function_privilege('authenticated','private.bamco_assessment_impl(text,jsonb)','EXECUTE') then
    raise exception 'RPC role grants do not match portal policy';end if;
  insert into auth.users(id,email,raw_app_meta_data) values(uid,uid::text||'@example.invalid',
    '{"bamco_functional":{"name":"Fixture","admin":false,"grants":["active","drive"]}}');
  insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,uid,now(),now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated')::text,true);
  if private.bamco_actor()->>'id' is distinct from uid::text then raise exception 'Profile lookup failed';end if;
  res:=private.bamco_assessment_impl('create',jsonb_build_object('title','Portal permission fixture','snapshot',original));
  item:=(res->>'id')::uuid;
  res:=public.bamco_assessment('open',jsonb_build_object('id',item));doc:=res->'snapshot';
  if doc->'records' ? 'durability:1:test' or doc->'config' ? 'legacy' or doc->'missions' ? 'durability:1'
    or doc#>>'{records,drive:1:test,score}' is distinct from '4' then raise exception 'Case projection failed';end if;
  doc:=jsonb_set(doc,'{records,drive:1:test,score}','7');
  res:=public.bamco_assessment('save',jsonb_build_object('id',item,'revision',res->'revision','snapshot',doc));
  if res is null then raise exception 'Scoped save failed';end if;
  res:=private.bamco_assessment_impl('open',jsonb_build_object('id',item));doc:=res->'snapshot';
  if doc#>>'{records,drive:1:test,score}' is distinct from '7' or doc#>>'{records,durability:1:test,score}' is distinct from '9'
    or doc#>>'{config,legacy}' is distinct from 'keep' or doc#>>'{mileage,durability,1}' is distinct from '99'
    or doc#>>'{missions,durability:1,notes}' is distinct from 'keep' or doc->>'newField' is distinct from 'preserve' then raise exception 'Scoped save lost data';end if;
  begin perform public.bamco_access_users();raise exception 'User administration grant leak';exception when insufficient_privilege then null;end;
  begin perform public.bamco_live_locations();raise exception 'Location grant leak';exception when insufficient_privilege then null;end;
  begin perform public.bamco_assessment('list','{"status":"completed"}');raise exception 'Case list grant leak';exception when insufficient_privilege then null;end;
  begin perform public.bamco_assessment('delete',jsonb_build_object('id',item));raise exception 'Delete grant leak';exception when insufficient_privilege then null;end;
  update auth.users set raw_app_meta_data='{"bamco_functional":{"name":"Fixture","admin":false,"grants":[]}}' where id=uid;
  begin perform public.bamco_assessment('open',jsonb_build_object('id',item));raise exception 'Revoked permission remained active';exception when insufficient_privilege then null;end;
end;
$check$;
