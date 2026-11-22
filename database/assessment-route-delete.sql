-- Remove routes from the bank while retaining assessment history and an audit record.
begin;
alter table private.bamco_banks add column if not exists deleted_at timestamptz;

create or replace function public.bamco_banks(operation text, args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor jsonb := private.bamco_actor();
  bank text := args->>'kind';
  item_id text := args->>'id';
  expected integer := (args->>'revision')::integer;
  doc jsonb := args->'definition';
  previous private.bamco_banks;
  saved private.bamco_banks;
  field text;
begin
  if actor is null then raise insufficient_privilege; end if;
  if operation='active_prompt' then
    return (select to_jsonb(b)-'updated_by' from private.bamco_banks b
      where kind='prompts' and deleted_at is null and definition->>'active'='true');
  end if;
  if bank is null or bank not in ('routes','prompts') then raise exception 'Invalid bank' using errcode='22023'; end if;
  if operation='list' then
    return (select coalesce(jsonb_agg(to_jsonb(b)-'updated_by' order by updated_at desc,id),'[]')
      from private.bamco_banks b where kind=bank and deleted_at is null);
  end if;
  if actor->>'admin' is distinct from 'true' and not coalesce(actor->'grants' ? 'setup',false) then
    raise insufficient_privilege;
  end if;
  if operation not in ('save','toggle','delete') or operation is null or expected is null or expected<0 then
    raise exception 'Invalid operation' using errcode='22023';
  end if;
  if operation='delete' and (bank<>'routes' or expected=0) then raise exception 'Invalid route deletion' using errcode='22023'; end if;
  -- Serialize prompt activation and version creation across sessions.
  if bank='prompts' then perform pg_catalog.pg_advisory_xact_lock(86222411); end if;
  if expected>0 then
    select * into previous from private.bamco_banks where kind=bank and id=item_id and deleted_at is null for update;
    if not found or previous.revision<>expected then return '{"conflict":true}'; end if;
  elsif operation in ('toggle','delete') then raise exception 'Missing item' using errcode='22023';
  end if;
  if operation='delete' then
    update private.bamco_banks set deleted_at=now(),definition=jsonb_set(definition,'{active}','false'),
      revision=revision+1,updated_at=now(),updated_by=auth.uid()
      where kind=bank and id=item_id and revision=expected returning * into saved;
    return jsonb_build_object('deleted',true,'id',saved.id,'revision',saved.revision);
  end if;
  if operation='toggle' then
    if jsonb_typeof(args->'active') is distinct from 'boolean' then raise exception 'Invalid status' using errcode='22023'; end if;
    doc := jsonb_set(previous.definition,'{active}',args->'active');
  end if;
  if jsonb_typeof(doc) is distinct from 'object' or octet_length(doc::text)>80000
    or jsonb_typeof(doc->'active') is distinct from 'boolean' then
    raise exception 'Invalid definition' using errcode='22023';
  end if;
  if bank='routes' then
    foreach field in array array['name','origin','destination'] loop
      if jsonb_typeof(doc->field) is distinct from 'string' or length(btrim(doc->>field)) not between 1 and 160 then
        raise exception 'Invalid route text' using errcode='22023';
      end if;
    end loop;
    if coalesce(doc->>'routeId','') not in ('urban','rural','hot','mountain','offroad')
      or jsonb_typeof(doc->'bidirectional') is distinct from 'boolean'
      or jsonb_typeof(doc->'notes') is distinct from 'string' or length(doc->>'notes')>3000
      or (coalesce(doc->'km','null')<>'null'::jsonb and
        (jsonb_typeof(doc->'km')<>'number' or (doc->>'km')::numeric<=0 or (doc->>'km')::numeric>200000)) then
      raise exception 'Invalid route' using errcode='22023';
    end if;
    doc := jsonb_build_object('name',btrim(doc->>'name'),'origin',btrim(doc->>'origin'),'destination',btrim(doc->>'destination'),
      'routeId',doc->>'routeId','km',doc->'km','notes',doc->>'notes','bidirectional',doc->'bidirectional','active',doc->'active');
  else
    foreach field in array array['title','content'] loop
      if jsonb_typeof(doc->field) is distinct from 'string' or length(btrim(doc->>field))<1
        or length(doc->>field)>(case when field='title' then 160 else 16000 end) then
        raise exception 'Invalid prompt' using errcode='22023';
      end if;
    end loop;
    if operation='save' then
      item_id := gen_random_uuid()::text;
      doc := jsonb_build_object('title',btrim(doc->>'title'),'content',btrim(doc->>'content'),'active',doc->'active',
        'family',coalesce(previous.definition->>'family',item_id),
        'version',coalesce((select max((definition->>'version')::integer) from private.bamco_banks
          where kind='prompts' and definition->>'family'=previous.definition->>'family'),0)+1);
      if expected>0 then
        update private.bamco_banks set definition=jsonb_set(definition,'{active}','false'),revision=revision+1,
          updated_at=now(),updated_by=auth.uid() where kind=bank and id=previous.id;
      end if;
    end if;
    if doc->>'active'='true' then
      update private.bamco_banks set definition=jsonb_set(definition,'{active}','false'),revision=revision+1,
        updated_at=now(),updated_by=auth.uid() where kind='prompts' and id is distinct from item_id and definition->>'active'='true';
    end if;
  end if;
  if expected=0 or (bank='prompts' and operation='save') then
    item_id := coalesce(nullif(item_id,''),gen_random_uuid()::text);
    insert into private.bamco_banks(kind,id,definition,updated_by) values(bank,item_id,doc,auth.uid())
      on conflict do nothing returning * into saved;
  else
    update private.bamco_banks set definition=doc,revision=revision+1,updated_at=now(),updated_by=auth.uid()
      where kind=bank and id=item_id and revision=expected returning * into saved;
  end if;
  if saved.id is null then return '{"conflict":true}'; end if;
  return to_jsonb(saved)-'updated_by';
end;
$$;
revoke all on function public.bamco_banks(text,jsonb) from public,anon,authenticated;
grant execute on function public.bamco_banks(text,jsonb) to authenticated;

commit;
