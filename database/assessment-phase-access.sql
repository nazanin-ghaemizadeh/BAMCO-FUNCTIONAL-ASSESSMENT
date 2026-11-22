-- Keep phase plans visible to the existing assessment roles.
begin;
create or replace function private.bamco_view_snapshot(source jsonb,g jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
  visible jsonb:=g; out_doc jsonb:='{}'; cfg jsonb; k text; distance jsonb:='{"drive":{},"durability":{}}';
  redact_missions jsonb; report_inputs jsonb;
begin
  if not (g ?| array['setup','drive','durability','static','comprehensive','results']) then return out_doc; end if;
  select coalesce(jsonb_object_agg(key,value),'{}') into cfg from jsonb_each(coalesce(source->'config','{}'))
    where g ? 'setup' or key=any(array['vclass','body','power','gear','driveType','twoDiff','driveKm','durKm','durDays','startOdo','durabilityPlannerVersion','durabilityPhaseVersion','durabilityPhaseTargets','routeCaps','routeShares','startCity']);
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
    foreach k in array array['durDays','durabilityPlannerVersion','durabilityPhaseVersion'] loop
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
commit;
