begin;

alter table public.bamco_assessment_gps
  add column monitoring_hash bytea,
  add column monitoring_viewer_hash bytea;

create index bamco_assessment_monitoring_idx
  on public.bamco_assessment_gps (monitoring_hash) where sharing;

create function public.bamco_start_site_monitoring(browser_key text, assessment_id uuid, viewer_key text, monitoring_key text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  started jsonb;
begin
  if monitoring_key is null or monitoring_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid monitoring key' using errcode = '22023';
  end if;
  started := public.bamco_browser_assessment(browser_key, 'gps_start',
    jsonb_build_object('id', assessment_id, 'viewer', viewer_key));
  if started is distinct from 'true'::jsonb then return null; end if;
  update public.bamco_assessment_gps g
    set monitoring_hash = sha256(convert_to(monitoring_key, 'UTF8')),
        monitoring_viewer_hash = g.viewer_hash
    where g.assessment_id = bamco_start_site_monitoring.assessment_id;
  return started;
end;
$$;

create function public.bamco_site_monitoring_locations(monitoring_key text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('latitude', g.latitude, 'longitude', g.longitude,
    'recorded_at', g.recorded_at) order by g.recorded_at desc), '[]')
  from public.bamco_assessment_gps g
  join public.bamco_assessments a on a.id = g.assessment_id
  where monitoring_key ~ '^[0-9a-f]{64}$'
    and g.monitoring_hash = sha256(convert_to(monitoring_key, 'UTF8'))
    and g.viewer_hash = g.monitoring_viewer_hash and g.sharing and a.status = 'active'
    and g.recorded_at > now() - interval '2 minutes';
$$;

revoke all on function public.bamco_start_site_monitoring(text,uuid,text,text),
  public.bamco_site_monitoring_locations(text) from public, anon, authenticated;
grant execute on function public.bamco_start_site_monitoring(text,uuid,text,text),
  public.bamco_site_monitoring_locations(text) to anon, authenticated;

commit;
