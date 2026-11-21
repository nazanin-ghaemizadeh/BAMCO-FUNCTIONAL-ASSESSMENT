-- Apply after assessment-access.sql. Admin questionnaire management uses the live account role.
CREATE OR REPLACE FUNCTION private.bamco_weighting_impl(operation text, args jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  admin_edit boolean := coalesce(private.bamco_actor()->>'admin'='true',false) and operation in ('open','profile','save');
  record_id uuid;
  panel_id_arg uuid;
  manager_key text;
  invite_key text;
  secret text;
  digest bytea;
  rec private.bamco_weighting_sets;
  profile_data jsonb;
  g int; n int; calculated jsonb; result jsonb;
  -- Positions match the stable v1 criterion/subcriterion order in weighting-catalog.js.
  sizes constant int[] := array[15,8,4,11,3,22,22,3,12,13,5,2,7,7,3,9];
begin
  if args is null or jsonb_typeof(args) <> 'object' or octet_length(args::text)>120000 then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  if operation in ('results','create') then
    panel_id_arg := (args->>'panel')::uuid;
    manager_key := args->>'manager';
    invite_key := args->>'invite';
    if panel_id_arg is null then raise exception 'Missing panel' using errcode='42501'; end if;
  end if;
  if operation='results' then
    if manager_key is null or manager_key !~ '^[0-9a-f]{64}$' or not exists (
      select 1 from private.bamco_weighting_panels p where p.id=panel_id_arg
        and p.manager_hash=sha256(convert_to(manager_key,'UTF8'))
    ) then raise exception 'Private results link required' using errcode='42501'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('respondent',s.respondent,'name',s.profile->>'name','weights',s.weights,'analyses',s.analyses)
      order by s.respondent),'[]') into result from private.bamco_weighting_sets s
      where s.panel_id=panel_id_arg and (select count(*) from jsonb_object_keys(s.weights))=16;
    return result;
  end if;
  if operation='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'respondent',s.respondent,
      'name',s.profile->>'name','completed',(select count(*) from jsonb_object_keys(s.weights)))
      order by s.respondent desc),'[]') into result
    from jsonb_each_text(args->'keys') k join private.bamco_weighting_sets s
      on s.id=k.key::uuid and s.edit_hash=sha256(convert_to(k.value,'UTF8'));
    return result;
  end if;
  record_id := (args->>'id')::uuid;
  secret := args->>'key';
  if record_id is null or (not admin_edit and (secret is null or secret !~ '^[0-9a-f]{64}$')) then
    raise exception 'Invalid edit link' using errcode='42501';
  end if;
  digest := sha256(convert_to(secret,'UTF8'));
  if operation in ('create','profile') then
    profile_data := args->'profile';
    if jsonb_typeof(profile_data) is distinct from 'object'
       or jsonb_typeof(profile_data->'name') is distinct from 'string'
       or length(btrim(profile_data->>'name')) not between 1 and 150
       or octet_length(profile_data::text)>6000 then
      raise exception 'Invalid profile' using errcode='22023';
    end if;
  end if;
  if operation='create' then
    if invite_key is null or invite_key !~ '^[0-9a-f]{64}$' then
      raise exception 'Invitation required' using errcode='42501';
    end if;
    if manager_key is not null then
      if manager_key !~ '^[0-9a-f]{64}$' or manager_key=invite_key then
        raise exception 'Invalid panel link' using errcode='42501';
      end if;
      insert into private.bamco_weighting_panels(id,manager_hash,invite_hash)
        values(panel_id_arg,sha256(convert_to(manager_key,'UTF8')),sha256(convert_to(invite_key,'UTF8')))
        on conflict(id) do nothing;
    end if;
    if not exists (select 1 from private.bamco_weighting_panels p where p.id=panel_id_arg
      and p.invite_hash=sha256(convert_to(invite_key,'UTF8'))) then
      raise exception 'Invalid invitation' using errcode='42501';
    end if;
    insert into private.bamco_weighting_sets(panel_id,id,edit_hash,profile)
      values(panel_id_arg,record_id,digest,profile_data) on conflict(id) do nothing;
  end if;
  select * into rec from private.bamco_weighting_sets
    where id=record_id and (admin_edit or edit_hash=digest) for update;
  if not found then raise exception 'Invalid edit link' using errcode='42501'; end if;
  if operation='save' then
    g := (args->>'group')::int;
    if g is null or g not between 0 and 15 then raise exception 'Invalid group' using errcode='22023'; end if;
    n := sizes[g+1];
    calculated := private.bamco_bwm_weights(args->'form',n);
    if rec.forms->g::text is distinct from args->'form' then
      if coalesce(rec.forms->g::text,'null') is distinct from args->'previous' then
        raise exception 'Concurrent edit' using errcode='40001';
      end if;
      update private.bamco_weighting_sets set forms=jsonb_set(forms,array[g::text],args->'form'),
        weights=case when calculated is null then weights-g::text
                     else jsonb_set(weights,array[g::text],calculated) end,
        analyses=case when calculated is null then analyses-g::text
                      else jsonb_set(analyses,array[g::text],private.bamco_bwm_analysis(args->'form',calculated)) end
      where id=record_id returning * into rec;
    end if;
  elsif operation='profile' then
    if rec.profile is distinct from profile_data then
      if rec.profile is distinct from args->'previous' then
        raise exception 'Concurrent edit' using errcode='40001';
      end if;
      update private.bamco_weighting_sets set profile=profile_data where id=record_id returning * into rec;
    end if;
  elsif operation not in ('open','create') or operation is null then
    raise exception 'Unknown operation' using errcode='22023';
  end if;
  return jsonb_build_object('id',rec.id,'panel',rec.panel_id,'respondent',rec.respondent,'profile',rec.profile,
    'forms',rec.forms,'weights',rec.weights,'analyses',rec.analyses);
end;
$function$
;
CREATE OR REPLACE FUNCTION private.bamco_weighting_subcriteria(operation text, args jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  is_admin boolean := coalesce(private.bamco_actor()->>'admin'='true',false);
  rec private.bamco_weighting_sets;
  result jsonb;
  panel_id_arg uuid;
begin
  if args is null or jsonb_typeof(args) <> 'object' or octet_length(args::text)>120000 then
    raise exception 'Invalid arguments' using errcode='22023';
  end if;
  if operation='list_subcriteria' then
    select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'respondent',s.respondent,'name',s.profile->>'name',
      'created_at',s.created_at,'revision',md5(jsonb_build_array(s.profile,s.forms)::text),
      'completed',(select count(*) from jsonb_object_keys(s.weights-'0'))) order by (select count(*) from jsonb_object_keys(s.weights-'0')) desc,s.respondent desc),'[]')
    into result from private.bamco_weighting_sets s
    where not s.is_example and (is_admin or s.edit_hash=sha256(convert_to(args->'keys'->>(s.id::text),'UTF8')));
    return result;
  elsif operation='results_subcriteria' then
    panel_id_arg := (args->>'panel')::uuid;
    if not exists (select 1 from private.bamco_weighting_panels p where p.id=panel_id_arg
         and p.manager_hash=sha256(convert_to(args->>'manager','UTF8'))) then
      raise exception 'Access denied' using errcode='42501';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('respondent',s.respondent,'name',s.profile->>'name',
      'weights',s.weights-'0','analyses',s.analyses-'0','is_example',s.is_example) order by s.respondent),'[]') into result
    from private.bamco_weighting_sets s where s.panel_id=panel_id_arg
      and (select count(*) from jsonb_object_keys(s.weights-'0'))=15;
    return result;
  elsif operation='delete' then
    select * into rec from private.bamco_weighting_sets s where s.id=(args->>'id')::uuid
      and (is_admin or s.edit_hash=sha256(convert_to(args->>'key','UTF8'))) for update;
    if not found then raise exception 'Access denied or questionnaire removed' using errcode='42501'; end if;
    if args->>'revision' is distinct from md5(jsonb_build_array(rec.profile,rec.forms)::text) then
      raise exception 'Questionnaire changed' using errcode='40001';
    end if;
    delete from private.bamco_weighting_sets where id=rec.id;
    return jsonb_build_object('id',rec.id);
  elsif operation='save_subcriteria' then
    if coalesce((args->>'group')::int,0) not between 1 and 15 then
      raise exception 'Select a subcriterion group' using errcode='22023';
    end if;
    return private.bamco_weighting_impl('save',args);
  end if;
  raise exception 'Unknown operation' using errcode='22023';
end;
$function$
;

