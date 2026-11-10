begin;

-- Assessments are system-wide records. Browser, device and contact identifiers no longer
-- determine which active or completed assessments are visible.
drop function if exists public.bamco_start_site_monitoring(text,uuid,text,text);
drop function if exists public.bamco_site_monitoring_locations(text);
drop function if exists public.bamco_observer_location(text);
drop function if exists public.bamco_browser_assessment(text,text,jsonb);

drop policy if exists assessment_owner on public.bamco_assessments;
drop policy if exists gps_owner_read on public.bamco_assessment_gps;
drop policy if exists gps_observer_read on public.bamco_assessment_gps;
drop policy if exists gps_owner_insert on public.bamco_assessment_gps;
drop policy if exists gps_owner_update on public.bamco_assessment_gps;

revoke all on public.bamco_assessments, public.bamco_assessment_gps
  from public, anon, authenticated;

drop policy if exists bamco_assessments_no_direct_access on public.bamco_assessments;
create policy bamco_assessments_no_direct_access on public.bamco_assessments
  for all to anon, authenticated using (false) with check (false);

drop policy if exists bamco_gps_no_direct_access on public.bamco_assessment_gps;
create policy bamco_gps_no_direct_access on public.bamco_assessment_gps
  for all to anon, authenticated using (false) with check (false);

drop index if exists public.bamco_assessments_browser_idx;
drop index if exists public.bamco_assessments_owner_id_status_created_at_idx;
drop index if exists public.bamco_assessment_gps_observer_email_idx;
drop index if exists public.bamco_assessment_monitoring_idx;

alter table public.bamco_assessments
  drop constraint if exists bamco_assessment_owner_kind;

alter table public.bamco_assessment_gps
  drop constraint if exists bamco_assessment_gps_owner_id_fkey,
  drop column if exists owner_id,
  drop column if exists observer_email,
  drop column if exists monitoring_hash,
  drop column if exists monitoring_viewer_hash;

alter table public.bamco_assessments
  drop constraint if exists bamco_assessments_owner_id_fkey,
  drop column if exists owner_id,
  drop column if exists browser_hash,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists bamco_assessments_global_status_idx
  on public.bamco_assessments (status, created_at desc);

alter table public.bamco_assessment_gps
  add column if not exists accuracy_m double precision;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bamco_assessment_gps_accuracy_check'
      and conrelid = 'public.bamco_assessment_gps'::regclass
  ) then
    alter table public.bamco_assessment_gps
      add constraint bamco_assessment_gps_accuracy_check
      check (accuracy_m is null or accuracy_m between 0 and 10000);
  end if;
end;
$$;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.bamco_assessment_impl(operation text, args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  assessment_uuid uuid;
  status_filter text;
  clean_title text;
  next_status text;
  location_session text;
  latitude_value double precision;
  longitude_value double precision;
  accuracy_value double precision;
begin
  if args is null or jsonb_typeof(args) <> 'object' then
    raise exception 'Invalid arguments' using errcode = '22023';
  end if;

  if operation = 'list' then
    status_filter := args->>'status';
    if status_filter not in ('active','completed') then
      raise exception 'Invalid assessment status' using errcode = '22023';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'status', a.status,
      'revision', a.revision,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ) order by a.created_at desc), '[]'::jsonb)
    into result
    from public.bamco_assessments a
    where a.status = status_filter;

  elsif operation = 'create' then
    clean_title := btrim(args->>'title');
    if clean_title is null or char_length(clean_title) not between 1 and 120 then
      raise exception 'Invalid assessment title' using errcode = '22023';
    end if;
    if jsonb_typeof(coalesce(args->'snapshot','{}'::jsonb)) <> 'object'
       or octet_length(coalesce(args->'snapshot','{}'::jsonb)::text) > 12000000 then
      raise exception 'Invalid assessment snapshot' using errcode = '22023';
    end if;
    insert into public.bamco_assessments as a
      (title, snapshot, updated_at)
    values
      (clean_title, coalesce(args->'snapshot','{}'::jsonb), now())
    returning jsonb_build_object('id', a.id) into result;

  elsif operation = 'open' then
    assessment_uuid := (args->>'id')::uuid;
    select jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'status', a.status,
      'snapshot', a.snapshot,
      'revision', a.revision,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    )
    into result
    from public.bamco_assessments a
    where a.id = assessment_uuid;

  elsif operation = 'save' then
    assessment_uuid := (args->>'id')::uuid;
    if jsonb_typeof(args->'snapshot') <> 'object'
       or octet_length((args->'snapshot')::text) > 12000000 then
      raise exception 'Invalid assessment snapshot' using errcode = '22023';
    end if;
    update public.bamco_assessments a
    set snapshot = args->'snapshot',
        revision = a.revision + 1,
        updated_at = now()
    where a.id = assessment_uuid
      and a.status = 'active'
      and a.revision = (args->>'revision')::integer
    returning jsonb_build_object('revision',a.revision,'updated_at',a.updated_at)
    into result;

  elsif operation = 'edit' then
    assessment_uuid := (args->>'id')::uuid;
    clean_title := case when args ? 'title' then btrim(args->>'title') else null end;
    next_status := case when args ? 'status' then args->>'status' else null end;
    if args ? 'title' and (clean_title is null or char_length(clean_title) not between 1 and 120) then
      raise exception 'Invalid assessment title' using errcode = '22023';
    end if;
    if next_status is not null and next_status not in ('active','completed') then
      raise exception 'Invalid assessment status' using errcode = '22023';
    end if;
    update public.bamco_assessments a
    set title = coalesce(clean_title,a.title),
        status = coalesce(next_status,a.status),
        revision = a.revision + 1,
        updated_at = now()
    where a.id = assessment_uuid
      and a.revision = (args->>'revision')::integer
    returning jsonb_build_object('id',a.id,'revision',a.revision)
    into result;

  elsif operation = 'delete' then
    assessment_uuid := (args->>'id')::uuid;
    delete from public.bamco_assessments a
    where a.id = assessment_uuid
      and a.revision = (args->>'revision')::integer
    returning jsonb_build_object('id',a.id) into result;

  elsif operation = 'gps_start' then
    assessment_uuid := (args->>'id')::uuid;
    location_session := lower(args->>'session');
    if location_session is null or location_session !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid location session' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.bamco_assessments a
      where a.id = assessment_uuid and a.status = 'active'
    ) then
      return null;
    end if;
    insert into public.bamco_assessment_gps as g
      (assessment_id, sharing, latitude, longitude, accuracy_m, recorded_at, viewer_hash)
    values
      (assessment_uuid, true, null, null, null, null,
       sha256(convert_to(location_session,'UTF8')))
    on conflict (assessment_id) do update
    set sharing = true,
        latitude = null,
        longitude = null,
        accuracy_m = null,
        recorded_at = null,
        viewer_hash = excluded.viewer_hash
    returning 'true'::jsonb into result;

  elsif operation = 'gps_point' then
    assessment_uuid := (args->>'id')::uuid;
    location_session := lower(args->>'session');
    latitude_value := (args->>'latitude')::double precision;
    longitude_value := (args->>'longitude')::double precision;
    accuracy_value := greatest(0,least(10000,coalesce((args->>'accuracy')::double precision,0)));
    if location_session is null or location_session !~ '^[0-9a-f]{64}$'
       or latitude_value not between -90 and 90
       or longitude_value not between -180 and 180 then
      raise exception 'Invalid location point' using errcode = '22023';
    end if;
    update public.bamco_assessment_gps g
    set latitude = latitude_value,
        longitude = longitude_value,
        accuracy_m = accuracy_value,
        recorded_at = now()
    where g.assessment_id = assessment_uuid
      and g.sharing
      and g.viewer_hash = sha256(convert_to(location_session,'UTF8'))
      and exists (
        select 1 from public.bamco_assessments a
        where a.id = g.assessment_id and a.status = 'active'
      )
    returning 'true'::jsonb into result;

  elsif operation = 'gps_stop' then
    assessment_uuid := (args->>'id')::uuid;
    location_session := lower(args->>'session');
    if location_session is null or location_session !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid location session' using errcode = '22023';
    end if;
    update public.bamco_assessment_gps g
    set sharing = false,
        latitude = null,
        longitude = null,
        accuracy_m = null,
        recorded_at = null,
        viewer_hash = null
    where g.assessment_id = assessment_uuid
      and g.viewer_hash = sha256(convert_to(location_session,'UTF8'))
    returning 'true'::jsonb into result;

  else
    raise exception 'Unknown assessment operation' using errcode = '22023';
  end if;

  return result;
end;
$$;

create or replace function private.bamco_live_locations_impl()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'assessment_id', a.id,
    'title', a.title,
    'latitude', g.latitude,
    'longitude', g.longitude,
    'accuracy_m', g.accuracy_m,
    'recorded_at', g.recorded_at
  ) order by g.recorded_at desc), '[]'::jsonb)
  from public.bamco_assessment_gps g
  join public.bamco_assessments a on a.id = g.assessment_id
  where g.sharing
    and a.status = 'active'
    and g.latitude is not null
    and g.longitude is not null
    and g.recorded_at > now() - interval '2 minutes';
$$;

revoke all on function private.bamco_assessment_impl(text,jsonb),
  private.bamco_live_locations_impl() from public;
grant execute on function private.bamco_assessment_impl(text,jsonb),
  private.bamco_live_locations_impl() to anon, authenticated;

create or replace function public.bamco_assessment(operation text, args jsonb default '{}'::jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.bamco_assessment_impl(operation,args);
$$;

create or replace function public.bamco_live_locations()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.bamco_live_locations_impl();
$$;

revoke all on function public.bamco_assessment(text,jsonb),
  public.bamco_live_locations() from public;
grant execute on function public.bamco_assessment(text,jsonb),
  public.bamco_live_locations() to anon, authenticated;

create or replace function public.bamco_end_assessment_gps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.bamco_assessment_gps
  set sharing = false,
      latitude = null,
      longitude = null,
      accuracy_m = null,
      recorded_at = null,
      viewer_hash = null
  where assessment_id = new.id;
  return new;
end;
$$;

commit;
