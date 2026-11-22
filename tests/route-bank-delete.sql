-- Transactional integration test: only a temporary fixture is changed; everything rolls back.
begin;
do $$
declare
  claims jsonb;
  saved jsonb;
  result jsonb;
  route_id text;
  before_count integer;
  denied boolean := false;
begin
  if has_function_privilege('anon','public.bamco_banks(text,jsonb)','execute') then
    raise exception 'Anonymous execution must remain denied';
  end if;
  perform set_config('request.jwt.claims','{}',true);
  begin
    perform public.bamco_banks('list','{"kind":"routes"}');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Missing actor was accepted'; end if;

  select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated') into claims
  from auth.users u join auth.sessions s on s.user_id=u.id
  where u.raw_app_meta_data->'bamco_functional'->>'admin'='true'
    and (u.banned_until is null or u.banned_until<=now())
    and (not (u.raw_app_meta_data ? 'bamco_functional_since')
      or s.created_at >= (u.raw_app_meta_data->>'bamco_functional_since')::timestamptz)
  limit 1;
  if claims is null then raise exception 'No existing authorized test context available'; end if;
  perform set_config('request.jwt.claims',claims::text,true);
  before_count := jsonb_array_length(public.bamco_banks('list','{"kind":"routes"}'));
  saved := public.bamco_banks('save','{"kind":"routes","revision":0,"definition":{"name":"Transactional route fixture","origin":"A","destination":"B","routeId":"urban","active":true,"bidirectional":true,"km":1,"notes":""}}');
  route_id := saved->>'id';
  if route_id is null then raise exception 'Fixture creation failed'; end if;
  result := public.bamco_banks('delete',jsonb_build_object('kind','routes','id',route_id,'revision',99));
  if result->>'conflict' is distinct from 'true' then raise exception 'Stale deletion was accepted'; end if;
  result := public.bamco_banks('delete',jsonb_build_object('kind','routes','id',route_id,'revision',1));
  if result->>'deleted' is distinct from 'true' then raise exception 'Deletion failed'; end if;
  if jsonb_array_length(public.bamco_banks('list','{"kind":"routes"}'))<>before_count then
    raise exception 'Deleted route remains in the bank';
  end if;
  if not exists(select 1 from private.bamco_banks where kind='routes' and id=route_id
    and deleted_at is not null and definition->>'active'='false' and revision=2) then
    raise exception 'Audit copy is missing';
  end if;
  result := public.bamco_banks('toggle',jsonb_build_object('kind','routes','id',route_id,'revision',2,'active',true));
  if result->>'conflict' is distinct from 'true' then raise exception 'Deleted route was reactivated'; end if;
  denied := false;
  begin
    perform public.bamco_banks('delete','{"kind":"prompts","id":"not-used","revision":1}');
  exception when invalid_parameter_value then denied := true;
  end;
  if not denied then raise exception 'Prompt deletion must remain unavailable'; end if;
end;
$$;
rollback;
select 'PASS: route deletion, stale edits, audit retention, bank filtering, anonymous access and prompt isolation' as result;
