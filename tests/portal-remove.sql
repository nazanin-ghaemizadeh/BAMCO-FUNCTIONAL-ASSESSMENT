-- UUIDs, sessions and names below are fixtures.
begin;
do $test$
declare
  staff uuid := gen_random_uuid(); manager uuid := gen_random_uuid();
  staff_session uuid := gen_random_uuid(); admin_session uuid := gen_random_uuid(); cred uuid;
  staff_profile jsonb := '{"name":"Fixture","admin":false,"grants":["active"]}';
  meta jsonb;
begin
  if has_function_privilege('anon','public.bamco_remove_access(uuid)','execute')
     or has_function_privilege('authenticated','public.bamco_removed_user_id(text)','execute')
     or not has_function_privilege('authenticated','public.bamco_remove_access(uuid)','execute') then
    raise exception 'Incorrect removal grants'; end if;
  cred := vault.create_secret('test-only',null,'bamco-functional/staff-login/v1');
  insert into auth.users(id,email,raw_app_meta_data) values
    (manager,manager||'@example.invalid','{"bamco_functional":{"admin":true,"grants":[]}}'),
    (staff,staff||'@example.invalid',jsonb_build_object('bamco_functional',staff_profile,'bamco_staff_ref',cred,'other_app',true));
  insert into auth.sessions(id,user_id,created_at,updated_at) values
    (admin_session,manager,now(),now()),(staff_session,staff,now(),now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'session_id',staff_session)::text,true);
  begin perform public.bamco_remove_access(manager);raise exception 'Staff allowed to remove a user';
    exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager,'session_id',admin_session)::text,true);
  begin perform public.bamco_remove_access(manager);raise exception 'Admin allowed to remove self';
    exception when insufficient_privilege then null; end;
  perform public.bamco_remove_access(staff);
  perform public.bamco_remove_access(staff);
  if exists (select 1 from jsonb_array_elements(public.bamco_access_users()) p where p->>'id'=staff::text)
     or exists (select 1 from vault.secrets where id=cred)
     or public.bamco_removed_user_id(staff||'@example.invalid') is distinct from staff then
    raise exception 'Removal incomplete'; end if;
  select raw_app_meta_data into strict meta from auth.users where id=staff;
  if meta->'other_app' is distinct from 'true'::jsonb then raise exception 'Unrelated settings changed'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'session_id',staff_session)::text,true);
  if private.bamco_actor() is not null then raise exception 'Removed session still active'; end if;
  begin
    update auth.users set raw_app_meta_data=meta||jsonb_build_object('bamco_functional',staff_profile) where id=staff;
    raise exception 'Stale edit reinstated account';
  exception when insufficient_privilege then null; end;
  update auth.users set raw_app_meta_data=meta||jsonb_build_object('bamco_functional_removed',false,'bamco_functional',staff_profile)
    where id=staff;
  if private.bamco_actor() is not null then raise exception 'Old session gained new membership'; end if;
  staff_session:=gen_random_uuid();
  insert into auth.sessions(id,user_id,created_at,updated_at) values(staff_session,staff,clock_timestamp(),clock_timestamp());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'session_id',staff_session)::text,true);
  if private.bamco_actor()->>'id' is distinct from staff::text then raise exception 'Fresh member cannot enter'; end if;
end;
$test$;

rollback;
