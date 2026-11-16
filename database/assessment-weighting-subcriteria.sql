-- Keep the historic group 0 responses intact. Current questionnaires use groups 1–15.
create or replace function private.bamco_weighting_subcriteria(operation text, args jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
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
      'completed',(select count(*) from jsonb_object_keys(s.weights-'0'))) order by s.respondent desc),'[]')
    into result from jsonb_each_text(args->'keys') k join private.bamco_weighting_sets s
      on s.id=k.key::uuid and s.edit_hash=sha256(convert_to(k.value,'UTF8'));
    return result;
  elsif operation='results_subcriteria' then
    panel_id_arg := (args->>'panel')::uuid;
    if not exists (select 1 from private.bamco_weighting_panels p where p.id=panel_id_arg
         and p.manager_hash=sha256(convert_to(args->>'manager','UTF8'))) then
      raise exception 'Access denied' using errcode='42501';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('respondent',s.respondent,'name',s.profile->>'name',
      'weights',s.weights-'0','analyses',s.analyses-'0') order by s.respondent),'[]') into result
    from private.bamco_weighting_sets s where s.panel_id=panel_id_arg
      and (select count(*) from jsonb_object_keys(s.weights-'0'))=15;
    return result;
  elsif operation='delete' then
    select * into rec from private.bamco_weighting_sets s where s.id=(args->>'id')::uuid
      and s.edit_hash=sha256(convert_to(args->>'key','UTF8')) for update;
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
$$;

revoke all on function private.bamco_weighting_subcriteria(text,jsonb) from public;
grant execute on function private.bamco_weighting_subcriteria(text,jsonb) to anon,authenticated;

create or replace function public.bamco_weighting(operation text,args jsonb default '{}')
returns jsonb language sql security invoker set search_path = '' as $$
  select case when operation in ('list_subcriteria','results_subcriteria','save_subcriteria','delete')
    then private.bamco_weighting_subcriteria(operation,args)
    else private.bamco_weighting_impl(operation,args) end;
$$;
