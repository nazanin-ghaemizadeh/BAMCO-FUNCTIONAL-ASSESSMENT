begin;

-- Only GoTrue Admin can set app_metadata. Read current grants, not stale token claims.
create or replace function private.bamco_actor()
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',u.id,'email',u.email) || (u.raw_app_meta_data->'bamco_functional')
  from auth.users u join auth.sessions s on s.user_id=u.id
  where u.id=(select auth.uid()) and s.id::text=(select auth.jwt()->>'session_id')
    and (u.banned_until is null or u.banned_until <= now())
    and jsonb_typeof(u.raw_app_meta_data->'bamco_functional')='object'
    and (not (u.raw_app_meta_data ? 'bamco_functional_since')
      or s.created_at >= (u.raw_app_meta_data->>'bamco_functional_since')::timestamptz);
$$;
revoke all on function private.bamco_actor() from public, anon, authenticated;

create or replace function public.bamco_access_profile()
returns jsonb language sql stable security definer set search_path='' as $$
  select private.bamco_actor();
$$;
create or replace function public.bamco_access_users()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not coalesce((private.bamco_actor()->>'admin')::boolean,false) then
    raise insufficient_privilege;
  end if;
  return (select coalesce(jsonb_agg((u.raw_app_meta_data->'bamco_functional') || jsonb_build_object('id',u.id,'email',u.email)
    order by coalesce((u.raw_app_meta_data->'bamco_functional'->>'admin')::boolean,false) desc,u.created_at),'[]'::jsonb)
    from auth.users u where jsonb_typeof(u.raw_app_meta_data->'bamco_functional')='object');
end;
$$;

-- Remove membership in this application. Other applications may use the same Auth identity.
create or replace function public.bamco_remove_access(staff_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor jsonb := private.bamco_actor(); meta jsonb; secret_ref text;
begin
  if (actor->>'admin')::boolean is distinct from true or staff_id is null or staff_id=auth.uid() then
    raise insufficient_privilege;
  end if;
  select raw_app_meta_data into meta from auth.users where id=staff_id for update;
  if meta->>'bamco_functional_removed'='true' then return; end if;
  if (meta->'bamco_functional'->>'admin')::boolean is distinct from false then
    raise insufficient_privilege;
  end if;
  secret_ref := meta->>'bamco_staff_ref';
  update auth.users set raw_app_meta_data=(meta-'bamco_functional'-'bamco_staff_ref'-'bamco_functional_since')
    || '{"bamco_functional_removed":true}'::jsonb, updated_at=now() where id=staff_id;
  delete from vault.secrets s where s.id::text=secret_ref and s.description='bamco-functional/staff-login/v1'
    and not exists(select 1 from auth.users u where u.raw_app_meta_data->>'bamco_staff_ref'=secret_ref);
end;
$$;
revoke all on function public.bamco_remove_access(uuid) from public, anon, authenticated;
grant execute on function public.bamco_remove_access(uuid) to authenticated;

-- A deliberate new enrollment can reuse a removed login. Normal edits cannot reinstate it.
create or replace function public.bamco_removed_user_id(login_email text)
returns uuid language sql stable security definer set search_path='' as $$
  select id from auth.users where lower(email)=lower(login_email)
    and raw_app_meta_data->>'bamco_functional_removed'='true'
    and (raw_app_meta_data->'bamco_functional') is null;
$$;
revoke all on function public.bamco_removed_user_id(text) from public, anon, authenticated;
grant execute on function public.bamco_removed_user_id(text) to service_role;

create or replace function private.bamco_guard_reenrollment()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.raw_app_meta_data->>'bamco_functional_removed' is distinct from 'true'
    or new.raw_app_meta_data->>'bamco_functional_removed' is distinct from 'false' then
    raise insufficient_privilege;
  end if;
  new.raw_app_meta_data := (new.raw_app_meta_data-'bamco_functional_removed')
    || jsonb_build_object('bamco_functional_since',clock_timestamp());
  return new;
end;
$$;
revoke all on function private.bamco_guard_reenrollment() from public, anon, authenticated;
drop trigger if exists bamco_guard_reenrollment on auth.users;
create trigger bamco_guard_reenrollment before update of raw_app_meta_data on auth.users
  for each row when (jsonb_typeof(new.raw_app_meta_data->'bamco_functional')='object'
    and (old.raw_app_meta_data->>'bamco_functional_removed'='true' or new.raw_app_meta_data ? 'bamco_functional_removed'))
  execute function private.bamco_guard_reenrollment();

-- Unknown/legacy keys stay in the stored snapshot on a partial save.
create or replace function private.bamco_field_scope(k text)
returns text language sql immutable set search_path='' as $$
 select case split_part(k,':',1) when 'supplementary' then 'static' when 'comprehensive-dashboard' then 'results'
  when 'results' then 'results' when 'drive' then 'drive' when 'durability' then 'durability'
  when 'comprehensive' then 'comprehensive' else null end;
$$;
create or replace function private.bamco_scoped_map(source jsonb, permissions jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(coalesce(nullif(source,'null'::jsonb),'{}'::jsonb))
 where permissions ? private.bamco_field_scope(key);
$$;
create or replace function private.bamco_view_snapshot(source jsonb,g jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
  visible jsonb:=g; out_doc jsonb:='{}'; cfg jsonb; k text; distance jsonb:='{"drive":{},"durability":{}}';
  redact_missions jsonb; report_inputs jsonb;
begin
  if not (g ?| array['setup','drive','durability','static','comprehensive','results']) then return out_doc; end if;
  select coalesce(jsonb_object_agg(key,value),'{}') into cfg from jsonb_each(coalesce(source->'config','{}'))
    where g ? 'setup' or key=any(array['vclass','body','power','gear','driveType','twoDiff','driveKm','durKm','durDays','startOdo','durabilityPlannerVersion','routeCaps','routeShares','startCity']);
  if g ? 'results' then visible:=g || '["drive","durability","static","comprehensive"]'::jsonb; end if;
  foreach k in array array['drive','durability'] loop
    if visible ? k or (g ? 'setup' and k='durability') then distance:=jsonb_set(distance,array[k],coalesce(source->'mileage'->k,'{}')); end if;
  end loop;
  redact_missions:=private.bamco_scoped_map(source->'missions',g);
  if g ? 'results' then
    -- Reports require scoring inputs, dates, custom questions and the evaluation log.
    select coalesce(jsonb_object_agg(m.key,(select coalesce(jsonb_object_agg(v.key,v.value),'{}') from jsonb_each(m.value) v
      where v.key in ('date','customTests','updatedAt'))),'{}') into report_inputs
      from jsonb_each(coalesce(source->'missions','{}')) m
      where private.bamco_field_scope(m.key) in ('drive','durability','static','comprehensive')
        and not (g ? private.bamco_field_scope(m.key)) and jsonb_typeof(m.value)='object';
    redact_missions:=report_inputs || redact_missions;
    if source->'missions' ? 'audit:general' then redact_missions:=redact_missions||jsonb_build_object('audit:general',source->'missions'->'audit:general'); end if;
  end if;
  out_doc:=jsonb_build_object('config',cfg,'setupComplete',coalesce(source->'setupComplete','false'),'records',private.bamco_scoped_map(source->'records',visible),
    'missions',redact_missions,'mileage',distance);
  if visible ? 'durability' or g ? 'setup' then
    foreach k in array array['durabilitySchedule','checkpointAssignments'] loop
      if source ? k then out_doc:=out_doc||jsonb_build_object(k,source->k);end if;
    end loop;
  end if;
  return out_doc;
end;
$$;
create or replace function private.bamco_merge_snapshot(original jsonb, submitted jsonb, g jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare out_doc jsonb:=original; k text; changed jsonb; writable jsonb; old_fields jsonb; audit jsonb; distance jsonb:=coalesce(original->'mileage','{}');
begin
  if jsonb_typeof(submitted) is distinct from 'object' or octet_length(submitted::text)>12000000 then raise invalid_parameter_value; end if;
  foreach k in array array['records','missions'] loop
    old_fields:=coalesce(original->k,'{}');
    writable:=private.bamco_scoped_map(old_fields,g);
    changed:=private.bamco_scoped_map(submitted->k,g);
    out_doc:=jsonb_set(out_doc,array[k],(old_fields - array(select jsonb_object_keys(writable))) || changed);
  end loop;
  -- Derive bounded audit entries from the authorized score changes only.
  select jsonb_agg(jsonb_build_object('at',now(),'action','scoreChange','testId',split_part(key,':',3),
    'from',original->'records'->key->'score','to',value->'score')) into audit
  from jsonb_each(private.bamco_scoped_map(submitted->'records',g)) r
    where value->'score' is distinct from original->'records'->key->'score';
  if audit is not null then
    select jsonb_agg(value order by n) into audit from (select value,n from jsonb_array_elements(coalesce(original#>'{missions,audit:general,entries}','[]')||audit)
      with ordinality x(value,n) order by n desc limit 2000) recent;
    out_doc:=jsonb_set(out_doc,array['missions','audit:general'],jsonb_build_object('entries',audit));
  end if;
  if g ? 'setup' then
    foreach k in array array['config','setupComplete'] loop
      if submitted ? k then out_doc:=jsonb_set(out_doc,array[k],submitted->k);end if;
    end loop;
  elsif g ? 'durability' then
    changed:=coalesce(original->'config','{}');
    foreach k in array array['durDays','durabilityPlannerVersion'] loop
      if submitted->'config' ? k then changed:=jsonb_set(changed,array[k],submitted->'config'->k);end if;
    end loop;
    out_doc:=jsonb_set(out_doc,'{config}',changed);
  end if;
  foreach k in array array['drive','durability'] loop
    if g ? k and submitted->'mileage' ? k then distance:=jsonb_set(distance,array[k],submitted->'mileage'->k);end if;
  end loop;
  out_doc:=jsonb_set(out_doc,'{mileage}',distance);
  if g ?| array['setup','durability'] then
    foreach k in array array['durabilitySchedule','checkpointAssignments'] loop
      if submitted ? k then out_doc:=jsonb_set(out_doc,array[k],submitted->k);end if;
    end loop;
  end if;
  return out_doc;
end;
$$;
create or replace function public.bamco_assessment(operation text,args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor jsonb:=private.bamco_actor(); g jsonb:=coalesce(actor->'grants','[]'::jsonb); state text; kind text; old_doc jsonb; result jsonb; needed text;
begin
  if actor is null then raise insufficient_privilege;end if;
  if actor->>'admin'='true' then return private.bamco_assessment_impl(operation,args);end if;
  if operation='list' then
    needed:=case args->>'status' when 'active' then 'active' when 'completed' then 'history' end;
    if not coalesce(g ? needed,false) then raise insufficient_privilege;end if;
  elsif operation='create' then
    if not (g ?& array['active','setup']) then raise insufficient_privilege;end if;
    args:=args || jsonb_build_object('snapshot',private.bamco_merge_snapshot('{}',coalesce(args->'snapshot','{}'),g));
  else
    select a.status,a.snapshot,a.assessment_type into state,old_doc,kind from public.bamco_assessments a where a.id=(args->>'id')::uuid for update;
    if state is null then return null;end if;
    needed:=case state when 'active' then 'active' else 'history' end;
    if not coalesce(g ? needed,false) then raise insufficient_privilege;end if;
    if kind is not null then
      g:=g - array(select k from unnest(array['drive','durability','static','comprehensive']) k where k<>kind);
    end if;
    case operation
      when 'open' then
        if kind is not null and not (g ?| array[kind,'setup','results']) then raise insufficient_privilege;end if;
        result:=private.bamco_assessment_impl(operation,args);
        return jsonb_set(result,'{snapshot}',private.bamco_view_snapshot(old_doc,g));
      when 'save' then
        if state<>'active' or not(g ?| array['setup','drive','durability','static','comprehensive','results']) then raise insufficient_privilege;end if;
        args:=args || jsonb_build_object('snapshot',private.bamco_merge_snapshot(old_doc,args->'snapshot',g));
      when 'edit' then
        if not(g ? 'setup') or (args ? 'status' and not(g ?& array['active','history'])) then raise insufficient_privilege;end if;
      when 'gps_start','gps_point','gps_stop' then
        if state<>'active' or (kind is not null and kind not in ('drive','durability')) or not(g ?| array['drive','durability']) then raise insufficient_privilege;end if;
      else raise insufficient_privilege;
    end case;
  end if;
  return private.bamco_assessment_impl(operation,args);
end;
$$;
create or replace function public.bamco_live_locations()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a jsonb:=private.bamco_actor();
begin
  if coalesce(a->>'admin'='true' or (a->'grants') ? 'observer',false) then return private.bamco_live_locations_impl();end if;
  raise insufficient_privilege;
end;
$$;
create or replace function public.bamco_weighting(operation text,args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare a jsonb:=private.bamco_actor();
begin
  if not coalesce(a->>'admin'='true' or (a->'grants') ? 'weighting',false) then raise insufficient_privilege;end if;
  if operation in ('list_subcriteria','results_subcriteria','save_subcriteria','delete') then return private.bamco_weighting_subcriteria(operation,args);end if;
  return private.bamco_weighting_impl(operation,args);
end;
$$;
revoke all on function private.bamco_assessment_impl(text,jsonb),private.bamco_live_locations_impl(),private.bamco_weighting_impl(text,jsonb),
 private.bamco_weighting_subcriteria(text,jsonb),private.bamco_view_snapshot(jsonb,jsonb),private.bamco_merge_snapshot(jsonb,jsonb,jsonb),
 private.bamco_scoped_map(jsonb,jsonb),private.bamco_field_scope(text) from public,anon,authenticated;
revoke all on function public.bamco_assessment(text,jsonb),public.bamco_live_locations(),public.bamco_weighting(text,jsonb),
 public.bamco_access_profile(),public.bamco_access_users() from public,anon,authenticated;
grant execute on function public.bamco_assessment(text,jsonb),public.bamco_live_locations(),public.bamco_weighting(text,jsonb),
 public.bamco_access_profile(),public.bamco_access_users() to authenticated;
commit;
