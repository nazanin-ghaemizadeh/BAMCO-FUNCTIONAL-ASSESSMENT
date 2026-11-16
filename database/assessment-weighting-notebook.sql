-- Per-form outputs of BWM_Codes.ipynb. The existing normalized weights solve Eq. 19.
-- Eq. 2 is solved by bisection on its ratio deviation. At fixed xi, constraints
-- become pairwise linear bounds, so models 5 and 6 have exact ratio envelopes.
create function private.bamco_bwm_analysis(form jsonb, weights jsonb)
returns jsonb language plpgsql immutable strict set search_path = '' as $$
declare
  n integer := jsonb_array_length(weights);
  b integer := (form->>'best')::int+1;
  w integer := (form->>'worst')::int+1;
  a float8[]; c float8[]; weight float8[];
  low_xi float8 := 0; high_xi float8 := 10; xi float8;
  min_ratio float8; max_ratio float8;
  eps float8 := 0; ci float8;
  ci_table constant float8[] := array[0,0.44,1,1.63,2.30,3,3.73,4.47,5.23];
  inf constant float8 := 'Infinity';
  bound float8[] := array_fill('Infinity'::float8,array[n,n]);
  min_sum float8; max_sum float8;
  lo float8; hi float8; intervals jsonb := '[]';
begin
  for i in 1..n loop
    a[i] := (form->'bo'->>(i-1))::float8;
    c[i] := (form->'ow'->>(i-1))::float8;
    weight[i] := (weights->>(i-1))::float8;
  end loop;
  for i in 1..n loop
    eps := greatest(eps,abs(weight[b]-a[i]*weight[i]),abs(weight[i]-c[i]*weight[w]));
  end loop;
  ci := ci_table[a[w]::int]; -- The questionnaire accepts integers 1 through 9.
  -- For r = wB/wW, the feasible interval for wj/wW must satisfy both
  -- comparison vectors. Eliminating wj gives the following bounds on r.
  for iteration in 0..55 loop
    xi := case when iteration=0 then 0 else (low_xi+high_xi)/2 end;
    min_ratio := greatest(0,a[w]-xi);
    max_ratio := a[w]+xi;
    for i in 1..n loop
      if i not in (b,w) then
        min_ratio := greatest(min_ratio,greatest(0,a[i]-xi)*greatest(0,c[i]-xi));
        max_ratio := least(max_ratio,(a[i]+xi)*(c[i]+xi));
      end if;
    end loop;
    if min_ratio<=max_ratio then
      high_xi := xi;
      if xi=0 then exit; end if;
    else
      low_xi := xi;
    end if;
  end loop;
  xi := high_xi;
  -- bound[i][j] bounds wj/wi. Its min-product transitive closure gives
  -- the tight implied bounds; a missing reverse inequality remains infinite.
  for i in 1..n loop
    bound[i][i] := 1;
    if i<>b then
      bound[i][b] := a[i]+xi;
      if a[i]>xi then bound[b][i] := 1/(a[i]-xi); end if;
    end if;
    if i<>w then
      bound[w][i] := c[i]+xi;
      if c[i]>xi then bound[i][w] := 1/(c[i]-xi); end if;
    end if;
  end loop;
  for k in 1..n loop
    for i in 1..n loop
      for j in 1..n loop
        bound[i][j] := least(bound[i][j],bound[i][k]*bound[k][j]);
      end loop;
    end loop;
  end loop;
  -- Setting target wi to one, all implied upper bounds are jointly attainable
  -- (as are all lower bounds). Normalize their sums to obtain the LP extrema.
  for i in 1..n loop
    min_sum := 0; max_sum := 0;
    for j in 1..n loop
      min_sum := min_sum+1/bound[j][i];
      max_sum := max_sum+bound[i][j];
    end loop;
    lo := case when max_sum=inf then 0 else 1/max_sum end;
    hi := greatest(lo,1/min_sum);
    intervals := intervals || jsonb_build_array(jsonb_build_array(lo,hi));
  end loop;
  return jsonb_build_object('epsilon',eps,'xi',xi,'ci',ci,
    'linearCR',case when ci=0 then 0 else eps/ci end,
    'nonlinearCR',case when ci=0 then 0 else xi/ci end,'intervals',intervals);
end;
$$;
revoke all on function private.bamco_bwm_analysis(jsonb,jsonb) from public, anon, authenticated;

alter table private.bamco_weighting_sets add column analyses jsonb not null default '{}';
update private.bamco_weighting_sets s set analyses=(
  select jsonb_object_agg(g.key,private.bamco_bwm_analysis(s.forms->g.key,g.value))
  from jsonb_each(s.weights) g
) where s.weights <> '{}';

create or replace function private.bamco_weighting_impl(operation text,args jsonb)
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
    select coalesce(jsonb_agg(jsonb_build_object('respondent',s.respondent,'name',s.profile->>'name','weights',s.weights,'analyses',s.analyses)
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
                     else jsonb_set(weights,array[g::text],calculated) end,
        analyses=case when calculated is null then analyses-g::text
                      else jsonb_set(analyses,array[g::text],private.bamco_bwm_analysis(args->'form',calculated)) end
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
    'forms',rec.forms,'weights',rec.weights,'analyses',rec.analyses);
end;
$$;
