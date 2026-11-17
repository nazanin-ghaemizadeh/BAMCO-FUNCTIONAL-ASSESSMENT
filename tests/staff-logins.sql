-- Run in a transaction that is rolled back; all fixture credentials are synthetic.
do $$
declare u uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); ses uuid:=gen_random_uuid();
 v jsonb; r jsonb; changed jsonb;
begin
 if has_function_privilege('anon','public.bamco_staff_credential(uuid)','execute') or
 has_function_privilege('authenticated','public.bamco_prepare_staff_password(uuid,text)','execute')
 then raise exception 'Unexpected credential endpoint grants'; end if;
 v:=public.bamco_prepare_staff_password(null,'staff_test');
 insert into auth.users(id,email,encrypted_password,raw_app_meta_data) values(u,u||'@example.invalid',
   extensions.crypt(v->>'auth_password',extensions.gen_salt('bf',6)),
   jsonb_build_object('bamco_functional','{"admin":false,"username":"staff_test","grants":[]}'::jsonb,'bamco_staff_ref',v->'reference'));
 insert into auth.users(id,email,raw_app_meta_data) values(a,a||'@example.invalid','{"bamco_functional":{"admin":true,"grants":[]}}');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(ses,a,now(),now());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'session_id',ses,'role','authenticated')::text,true);
 r:=public.bamco_staff_credential(u);
 if r->>'password' is distinct from 'staff_test' or length(r->>'key')<>48 then raise exception 'Initial credential mismatch'; end if;
 changed:=public.bamco_prepare_staff_password(u,'new-staff-test');
 update auth.users set encrypted_password=extensions.crypt(changed->>'auth_password',extensions.gen_salt('bf',6)),
 raw_app_meta_data=jsonb_set(raw_app_meta_data,'{bamco_staff_ref}',changed->'reference') where id=u;
 if public.bamco_staff_credential(u)->>'key' is distinct from r->>'key' or public.bamco_staff_credential(u)->>'password' is distinct from 'new-staff-test'
 then raise exception 'Rotation lost link or kept old password';end if;
 update auth.sessions set user_id=u where id=ses;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'session_id',ses,'role','authenticated')::text,true);
 begin perform public.bamco_staff_credential(u);raise exception 'Ordinary staff read credential';exception when insufficient_privilege then null;end;
end; $$;
