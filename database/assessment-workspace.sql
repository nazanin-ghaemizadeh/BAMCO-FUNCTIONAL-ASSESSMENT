begin;

create table public.bamco_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'completed')),
  snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(snapshot) = 'object'),
  revision integer not null default 0,
  created_at timestamptz not null default now()
);

create index on public.bamco_assessments (owner_id, status, created_at desc);
alter table public.bamco_assessments enable row level security;
revoke all on public.bamco_assessments from public, anon, authenticated;
grant select, delete on public.bamco_assessments to authenticated;
grant insert (title, snapshot), update (title, status, snapshot, revision) on public.bamco_assessments to authenticated;

create policy assessment_owner on public.bamco_assessments
  for all to authenticated
  using (owner_id = (select auth.uid()) and not coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false))
  with check (owner_id = (select auth.uid()) and not coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false));

create table public.bamco_assessment_gps (
  assessment_id uuid primary key references public.bamco_assessments(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  observer_email text check (observer_email = lower(btrim(observer_email))),
  sharing boolean not null default false,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  recorded_at timestamptz,
  check ((latitude is null and longitude is null and recorded_at is null)
      or (latitude is not null and longitude is not null and recorded_at is not null))
);

create index on public.bamco_assessment_gps (observer_email) where sharing;
alter table public.bamco_assessment_gps enable row level security;
revoke all on public.bamco_assessment_gps from public, anon, authenticated;
grant select on public.bamco_assessment_gps to authenticated;
grant insert (assessment_id, observer_email, sharing, latitude, longitude, recorded_at),
  update (observer_email, sharing, latitude, longitude, recorded_at)
  on public.bamco_assessment_gps to authenticated;

create policy gps_owner_read on public.bamco_assessment_gps for select to authenticated
  using (owner_id = (select auth.uid()));

create policy gps_observer_read on public.bamco_assessment_gps for select to authenticated
  using (sharing and observer_email = lower((select auth.jwt() ->> 'email'))
    and not coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false)
    and recorded_at > now() - interval '2 minutes');

create policy gps_owner_insert on public.bamco_assessment_gps for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.bamco_assessments a where a.id = assessment_id and a.owner_id = (select auth.uid()) and a.status = 'active'));

create policy gps_owner_update on public.bamco_assessment_gps for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (not sharing or exists (
    select 1 from public.bamco_assessments a where a.id = assessment_id and a.owner_id = (select auth.uid()) and a.status = 'active')));

create function public.bamco_end_assessment_gps() returns trigger
  language plpgsql security invoker set search_path = ''
  as $$
  begin
    update public.bamco_assessment_gps
    set sharing = false, latitude = null, longitude = null, recorded_at = null
    where assessment_id = new.id;
    return new;
  end;
  $$;

create trigger bamco_end_assessment_gps
  after update of status on public.bamco_assessments
  for each row when (old.status is distinct from new.status and new.status = 'completed')
  execute function public.bamco_end_assessment_gps();

commit;
