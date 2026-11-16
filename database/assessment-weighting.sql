-- The assessment site has no accounts. A private edit link identifies each respondent.
create schema if not exists private;
create table private.bamco_weighting_panels (
  id uuid primary key,
  manager_hash bytea not null,
  invite_hash bytea not null
);
alter table private.bamco_weighting_panels enable row level security;
revoke all on private.bamco_weighting_panels from public, anon, authenticated;
create table private.bamco_weighting_sets (
  panel_id uuid not null references private.bamco_weighting_panels(id),
  id uuid primary key,
  respondent bigint generated always as identity unique,
  edit_hash bytea not null,
  profile jsonb not null,
  forms jsonb not null default '{}',
  weights jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table private.bamco_weighting_sets enable row level security;
revoke all on private.bamco_weighting_sets from public, anon, authenticated;

create index bamco_weighting_panel_idx on private.bamco_weighting_sets(panel_id);

-- Linear BWM (Rezaei, 2016). Return null for a valid draft.
create function private.bamco_bwm_weights(form jsonb, n integer)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  b int := (form->>'best')::int;
  w int := (form->>'worst')::int;
  a int[]; c int[]; p int[]; d int[];
  value numeric; worst_raw numeric; best_raw numeric;
  raw numeric[]; total numeric; result jsonb;
begin
  if jsonb_typeof(form) is distinct from 'object'
     or not (form ?& array['best','worst','bo','ow'])
     or (form - array['best','worst','bo','ow']) <> '{}'
     or jsonb_typeof(form->'bo') is distinct from 'array'
     or jsonb_typeof(form->'ow') is distinct from 'array' then
    raise exception 'Invalid form' using errcode='22023';
  end if;
  if jsonb_array_length(form->'bo') <> n or jsonb_array_length(form->'ow') <> n
     or (b is not null and (jsonb_typeof(form->'best') <> 'number' or b not between 0 and n-1))
     or (w is not null and (jsonb_typeof(form->'worst') <> 'number' or w not between 0 and n-1))
     or b = w then raise exception 'Invalid selection' using errcode='22023'; end if;
  for i in 0..n-1 loop
    if coalesce((form->'bo'->i)::text,'null') !~ '^(null|[1-9])$'
       or coalesce((form->'ow'->i)::text,'null') !~ '^(null|[1-9])$' then
      raise exception 'Invalid comparison' using errcode='22023';
    end if;
    a[i+1] := (form->'bo'->>i)::int;
    c[i+1] := (form->'ow'->>i)::int;
  end loop;
  b := b+1; w := w+1;
  if (b is not null and a[b] is distinct from 1)
     or (w is not null and c[w] is distinct from 1)
     or (b is not null and w is not null and a[w] is distinct from c[b]) then
    raise exception 'Inconsistent comparison anchors' using errcode='22023';
  end if;
  if b is null or w is null or array_position(a,null) is not null or array_position(c,null) is not null then
    return null;
  end if;

  -- Scale a positive optimal deviation to one, then maximize the sum of raw
  -- weights. For given worst weight t, the feasible best weight lies in
  -- [p_i*t-d_i, p_i*t+d_i] for every i. All upper bounds increase with t.
  for i in 1..n loop
    p[i] := a[i]*c[i];
    d[i] := case when i in (b,w) then 1 else a[i]+1 end;
  end loop;
  for i in 1..n loop
    for j in 1..n loop
      if p[i] > p[j] then
        value := (d[i]+d[j])::numeric/(p[i]-p[j]);
        worst_raw := least(worst_raw,value);
      end if;
    end loop;
  end loop;
  if worst_raw is null then
    -- All products agree, so c already gives a zero-deviation solution.
    raw := c::numeric[];
  else
    for i in 1..n loop
      best_raw := least(best_raw,p[i]*worst_raw+d[i]);
    end loop;
    for i in 1..n loop
      raw[i] := case when i=b then best_raw when i=w then worst_raw
        else least((best_raw+1)/a[i],c[i]*worst_raw+1) end;
    end loop;
  end if;
  select sum(x) into total from unnest(raw) x;
  select jsonb_agg(x/total order by pos) into result from unnest(raw) with ordinality as u(x,pos);
  return result;
end;
$$;

create function private.bamco_weighting_impl(operation text,args jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
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
    select coalesce(jsonb_agg(jsonb_build_object('respondent',s.respondent,'name',s.profile->>'name','weights',s.weights)
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
  if record_id is null or secret is null or secret !~ '^[0-9a-f]{64}$' then
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
    where id=record_id and edit_hash=digest for update;
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
                     else jsonb_set(weights,array[g::text],calculated) end
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
    'forms',rec.forms,'weights',rec.weights);
end;
$$;
create function public.bamco_weighting(operation text,args jsonb default '{}')
returns jsonb language sql security invoker set search_path = '' as $$
  select private.bamco_weighting_impl(operation,args);
$$;
revoke all on function private.bamco_bwm_weights(jsonb,integer), private.bamco_weighting_impl(text,jsonb),
  public.bamco_weighting(text,jsonb) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.bamco_weighting_impl(text,jsonb),public.bamco_weighting(text,jsonb) to anon,authenticated;
