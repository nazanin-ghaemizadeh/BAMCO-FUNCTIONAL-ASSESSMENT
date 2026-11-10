begin;

alter table public.bamco_assessments
  alter column owner_id drop not null,
  add column browser_hash bytea,
  add constraint bamco_assessment_owner_kind check (num_nonnulls(owner_id, browser_hash) = 1);

create index bamco_assessments_browser_idx
  on public.bamco_assessments (browser_hash, status, created_at desc) where browser_hash is not null;

alter table public.bamco_assessment_gps
  alter column owner_id drop not null,
  add column viewer_hash bytea;

create unique index bamco_assessment_viewer_idx
  on public.bamco_assessment_gps (viewer_hash) where viewer_hash is not null;

create function public.bamco_browser_assessment(browser_key text, operation text, args jsonb default '{}')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  owner_hash bytea;
  owned_id uuid;
  result jsonb;
begin
  if browser_key is null or browser_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid browser key' using errcode = '22023';
  end if;
  owner_hash := sha256(convert_to(browser_key, 'UTF8'));
  if operation = 'list' then
    select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'status', a.status, 'revision', a.revision)
      order by a.created_at desc), '[]') into result
    from public.bamco_assessments a where a.browser_hash = owner_hash and a.status = args->>'status';
  elsif operation = 'create' then
    insert into public.bamco_assessments as a (owner_id, browser_hash, title, snapshot)
      values (null, owner_hash, btrim(args->>'title'), coalesce(args->'snapshot','{}'))
      returning jsonb_build_object('id', a.id) into result;
  elsif operation = 'open' then
    select jsonb_build_object('id', a.id, 'title', a.title, 'status', a.status,
      'snapshot', a.snapshot, 'revision', a.revision) into result
    from public.bamco_assessments a where a.browser_hash = owner_hash and a.id = (args->>'id')::uuid;
  elsif operation = 'save' then
    update public.bamco_assessments a set snapshot = args->'snapshot', revision = a.revision + 1
      where a.browser_hash = owner_hash and a.id = (args->>'id')::uuid
        and a.status = 'active' and a.revision = (args->>'revision')::integer
      returning jsonb_build_object('revision',a.revision) into result;
  elsif operation = 'edit' then
    update public.bamco_assessments a set title = coalesce(btrim(args->>'title'),a.title),
      status = coalesce(args->>'status',a.status), revision = a.revision + 1
      where a.browser_hash = owner_hash and a.id = (args->>'id')::uuid and a.revision = (args->>'revision')::integer
      returning jsonb_build_object('id',a.id) into result;
  elsif operation = 'delete' then
    delete from public.bamco_assessments a
      where a.browser_hash = owner_hash and a.id = (args->>'id')::uuid and a.revision = (args->>'revision')::integer
      returning jsonb_build_object('id',a.id) into result;
  elsif operation in ('gps_start','gps_point','gps_stop') then
    select a.id into owned_id from public.bamco_assessments a
      where a.browser_hash = owner_hash and a.id = (args->>'id')::uuid and a.status = 'active'
      for update;
    if owned_id is null then return null; end if;
    if args->>'viewer' is null or args->>'viewer' !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid observer key' using errcode = '22023';
    end if;
    if operation = 'gps_start' then
      insert into public.bamco_assessment_gps (assessment_id, owner_id, viewer_hash, sharing)
        values (owned_id, null, sha256(convert_to(args->>'viewer','UTF8')), true)
        on conflict on constraint bamco_assessment_gps_pkey do update
        set viewer_hash = excluded.viewer_hash, sharing = true, latitude = null, longitude = null, recorded_at = null
        returning 'true'::jsonb into result;
    elsif operation = 'gps_point' then
      update public.bamco_assessment_gps g
        set latitude = (args->>'latitude')::double precision, longitude = (args->>'longitude')::double precision, recorded_at = now()
        where g.assessment_id = (args->>'id')::uuid and g.sharing
          and g.viewer_hash = sha256(convert_to(args->>'viewer','UTF8'))
        returning 'true'::jsonb into result;
    else
      update public.bamco_assessment_gps g set sharing = false, viewer_hash = null,
        latitude = null, longitude = null, recorded_at = null
        where g.assessment_id = (args->>'id')::uuid
          and g.viewer_hash = sha256(convert_to(args->>'viewer','UTF8'));
      result := 'true'::jsonb;
    end if;
  else
    raise exception 'Unknown assessment operation' using errcode = '22023';
  end if;
  return result;
end;
$$;

create function public.bamco_observer_location(viewer_key text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('latitude', g.latitude, 'longitude', g.longitude, 'recorded_at', g.recorded_at)
  from public.bamco_assessment_gps g
  where viewer_key ~ '^[0-9a-f]{64}$' and g.viewer_hash = sha256(convert_to(viewer_key,'UTF8'))
    and g.sharing and g.recorded_at > now() - interval '2 minutes';
$$;

revoke all on function public.bamco_browser_assessment(text,text,jsonb), public.bamco_observer_location(text)
  from public, anon, authenticated;
grant execute on function public.bamco_browser_assessment(text,text,jsonb), public.bamco_observer_location(text)
  to anon, authenticated;

commit;
