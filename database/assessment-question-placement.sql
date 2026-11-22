-- Criterion-based placement; keep driving membership and assigned days unchanged.
begin;
create or replace function private.bamco_question_scope(doc jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_set(doc,'{scope}',
  (case when doc->'scope' ? 'drive' then '["drive"]'::jsonb else '[]'::jsonb end) ||
  jsonb_build_array(case when translate(btrim(doc->>'cat'),'يك','یک') in
   ('فرآیند و طراحی برای تولید','سبک و طراحی ظاهری','هزینه و اقتصاد محصول') then 'supplementary' else 'durability' end));
$$;
revoke all on function private.bamco_question_scope(jsonb) from public,anon,authenticated;
update private.bamco_question_bank set definition=private.bamco_question_scope(definition),revision=revision+1,updated_at=now()
where definition->'scope' is distinct from private.bamco_question_scope(definition)->'scope';

create or replace function public.bamco_question_bank(operation text, args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor jsonb := private.bamco_actor();
  question_id text := args->>'id';
  doc jsonb := args->'definition';
  expected integer := (args->>'revision')::integer;
  result jsonb;
  field text;
begin
  if actor is null then raise insufficient_privilege; end if;
  if operation='list' then
    return (select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'definition',q.definition,
      'revision',q.revision,'updatedAt',q.updated_at) order by q.id),'[]')
      from private.bamco_question_bank q);
  end if;
  if actor->>'admin' is distinct from 'true' and not coalesce(actor->'grants' ? 'setup',false) then
    raise insufficient_privilege;
  end if;
  if operation is distinct from 'save' or question_id is null
    or question_id !~ '^(CR-[0-9]{4}|QB-[0-9a-f-]{36})$'
    or expected is null or expected<0 or jsonb_typeof(doc) is distinct from 'object'
    or octet_length(doc::text)>30000 then
    raise exception 'Invalid question' using errcode='22023';
  end if;
  foreach field in array array['cat','sub','name','profile','measure','route','freq'] loop
    if jsonb_typeof(doc->field) is distinct from 'string' or length(doc->>field)>5000 then
      raise exception 'Invalid question text' using errcode='22023';
    end if;
  end loop;
  if length(btrim(doc->>'name'))=0 or length(btrim(doc->>'cat'))=0 or length(btrim(doc->>'sub'))=0
    or jsonb_typeof(doc->'active') is distinct from 'boolean'
    or jsonb_typeof(doc->'stationary') is distinct from 'boolean'
    or jsonb_typeof(doc->'vehicle') is distinct from 'object' then
    raise exception 'Incomplete question' using errcode='22023';
  end if;
  foreach field in array array['scope','days','routeIds','loadConditions'] loop
    if jsonb_typeof(doc->field) is distinct from 'array' then
      raise exception 'Invalid question list' using errcode='22023';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements_text(doc->'scope') v where v not in ('drive','durability','supplementary'))
    or exists(select 1 from jsonb_array_elements_text(doc->'routeIds') v where v not in ('urban','rural','hot','mountain','offroad'))
    or exists(select 1 from jsonb_array_elements(doc->'days') v where jsonb_typeof(v)<>'number' or v::text !~ '^([1-9]|1[0-9]|2[0-6])$')
    or exists(select 1 from jsonb_array_elements(doc->'loadConditions') v where jsonb_typeof(v)<>'string' or length(v::text)>120)
    or (doc->'scope' ? 'drive' and jsonb_array_length(doc->'days')=0) then
    raise exception 'Invalid question placement' using errcode='22023';
  end if;
  foreach field in array array['cls','body','power','gear','drive'] loop
    if jsonb_typeof(doc->'vehicle'->field) is distinct from 'array'
      or jsonb_array_length(doc->'vehicle'->field)=0
      or exists(select 1 from jsonb_array_elements(doc->'vehicle'->field) v where jsonb_typeof(v)<>'string' or length(v::text)>100) then
      raise exception 'Invalid vehicle conditions' using errcode='22023';
    end if;
  end loop;
  doc := private.bamco_question_scope(doc) - array['id','sourceId','baseId','checkpoint'];
  if expected=0 then
    insert into private.bamco_question_bank as q(id,definition,updated_by)
      values(question_id,doc,auth.uid()) on conflict (id) do nothing
      returning jsonb_build_object('id',q.id,'definition',q.definition,'revision',q.revision,'updatedAt',q.updated_at) into result;
  else
    update private.bamco_question_bank q set definition=doc,revision=q.revision+1,updated_at=now(),updated_by=auth.uid()
      where q.id=question_id and q.revision=expected
      returning jsonb_build_object('id',q.id,'definition',q.definition,'revision',q.revision,'updatedAt',q.updated_at) into result;
  end if;
  return coalesce(result,'{"conflict":true}'::jsonb);
end;
$$;
revoke all on function public.bamco_question_bank(text,jsonb) from public,anon,authenticated;
grant execute on function public.bamco_question_bank(text,jsonb) to authenticated;

commit;
