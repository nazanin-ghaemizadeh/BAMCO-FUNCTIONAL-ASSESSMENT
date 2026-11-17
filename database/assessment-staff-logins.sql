-- Staff have a private sign-in link and an administrator-issued password.
-- Only the current portal administrator may read a single staff credential.
create or replace function public.bamco_prepare_staff_password(staff_id uuid, issued_password text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  account jsonb;
  device_key text;
  secret_ref uuid;
begin
  if issued_password is null or length(issued_password)<6 or octet_length(issued_password)>72 then
    raise exception 'Invalid staff password' using errcode='22023';
  end if;
  if staff_id is not null then
    select u.raw_app_meta_data into account from auth.users u where u.id=staff_id;
    if account->'bamco_functional'->>'username' is null or
       (account->'bamco_functional'->>'admin')::boolean is distinct from false then
      raise insufficient_privilege;
    end if;
    select (s.decrypted_secret::jsonb)->>'key' into strict device_key from vault.decrypted_secrets s
      where s.id=(account->>'bamco_staff_ref')::uuid and s.description='bamco-functional/staff-login/v1';
  else
    device_key := encode(extensions.gen_random_bytes(24),'hex');
  end if;
  -- Retire abandoned and superseded versions after concurrent Auth requests have settled.
  delete from vault.secrets s where s.description='bamco-functional/staff-login/v1'
    and s.created_at < now()-interval '2 days'
    and not exists (select 1 from auth.users u where u.raw_app_meta_data->>'bamco_staff_ref'=s.id::text);
  secret_ref := vault.create_secret(jsonb_build_object('key',device_key,'password',issued_password)::text,
    null,'bamco-functional/staff-login/v1');
  return jsonb_build_object('reference',secret_ref,'auth_password',
    encode(extensions.digest(convert_to(device_key||':'||issued_password,'UTF8'),'sha256'),'hex'));
end; $$;
revoke all on function public.bamco_prepare_staff_password(uuid,text) from public,anon,authenticated;
grant execute on function public.bamco_prepare_staff_password(uuid,text) to service_role;

create or replace function public.bamco_staff_credential(staff_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not coalesce((private.bamco_actor()->>'admin')::boolean,false) then raise insufficient_privilege; end if;
  select s.decrypted_secret::jsonb into strict result
    from auth.users u join vault.decrypted_secrets s on s.id=(u.raw_app_meta_data->>'bamco_staff_ref')::uuid
    where u.id=staff_id and (u.raw_app_meta_data->'bamco_functional'->>'admin')::boolean=false
      and u.raw_app_meta_data->'bamco_functional'->>'username' is not null
      and s.description='bamco-functional/staff-login/v1'
      and extensions.crypt(encode(extensions.digest(convert_to((s.decrypted_secret::jsonb->>'key')||':'||
        (s.decrypted_secret::jsonb->>'password'),'UTF8'),'sha256'),'hex'),u.encrypted_password)=u.encrypted_password;
  return result;
end; $$;
revoke all on function public.bamco_staff_credential(uuid) from public,anon,authenticated;
grant execute on function public.bamco_staff_credential(uuid) to authenticated;
