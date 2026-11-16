-- This test runs inside a rolled-back transaction and uses only its own records.
begin;
set local role anon;
do $test$
declare
  id uuid:=gen_random_uuid(); panel uuid:=gen_random_uuid();
  k text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  m text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  invite text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  auth jsonb:=jsonb_build_object('id',id,'key',k);
  scope jsonb:=jsonb_build_object('panel',panel,'manager',m);
  listing jsonb:=jsonb_build_object('keys',jsonb_build_object(id::text,k));
  sizes int[]:=array[8,4,11,3,22,22,3,12,13,5,2,7,7,3,9];
  f jsonb; rec jsonb; rows jsonb; rev text;
begin
  perform public.bamco_weighting('create',auth||scope||jsonb_build_object('invite',invite,'profile',jsonb_build_object('name','Test')));
  rev:=public.bamco_weighting('list_subcriteria',listing)->0->>'revision';
  for g in 1..15 loop
    f:=jsonb_build_object('best',0,'worst',1,'bo',array_fill(1,array[sizes[g]]),'ow',array_fill(1,array[sizes[g]]));
    rec:=public.bamco_weighting('save_subcriteria',auth||jsonb_build_object('group',g,'form',f,'previous',null));
  end loop;
  rows:=public.bamco_weighting('results_subcriteria',scope);
  assert jsonb_array_length(rows)=1 and not ((rows->0->'weights')?'0');
  assert (public.bamco_weighting('list_subcriteria',listing)->0->>'completed')::int=15;
  begin
    perform public.bamco_weighting('save_subcriteria',auth||jsonb_build_object('group',0,'form',f));
    raise exception 'Unexpected main form';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.bamco_weighting('delete',auth||jsonb_build_object('revision',rev));
    raise exception 'Unexpected stale deletion';
  exception when serialization_failure then null; end;
  rev:=public.bamco_weighting('list_subcriteria',listing)->0->>'revision';
  begin
    perform public.bamco_weighting('delete',jsonb_build_object('id',id,'key',m,'revision',rev));
    raise exception 'Unexpected unauthorized deletion';
  exception when insufficient_privilege then null; end;
  perform public.bamco_weighting('delete',auth||jsonb_build_object('revision',rev));
  assert public.bamco_weighting('list_subcriteria',listing)='[]'::jsonb;
  assert public.bamco_weighting('results_subcriteria',scope)='[]'::jsonb;
end;
$test$;
rollback;
