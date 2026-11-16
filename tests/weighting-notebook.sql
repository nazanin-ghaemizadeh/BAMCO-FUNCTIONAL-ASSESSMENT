-- Rounded reference values saved in the three worked examples of BWM_Codes.ipynb.
-- Arrays follow the input order: Quality, Price, Comfort, Safety, Style.
do $verify$
declare
  example jsonb; form jsonb; weights jsonb; analysis jsonb; k text;
begin
  for example in select value from jsonb_array_elements($samples$
[{"form":{"best":1,"worst":4,"bo":[2,1,4,2,8],"ow":[4,8,2,4,1]},"weights":[0.210526,0.421053,0.105263,0.210526,0.052632],"intervals":[[0.2105,0.2105],[0.4211,0.4211],[0.1053,0.1053],[0.2105,0.2105],[0.0526,0.0526]],"epsilon":0.0,"xi":0.0,"linearCR":0.0,"nonlinearCR":0.0},
{"form":{"best":1,"worst":4,"bo":[2,1,4,3,8],"ow":[4,8,2,3,1]},"weights":[0.229508,0.448087,0.114754,0.153005,0.054645],"intervals":[[0.2145,0.2289],[0.4461,0.4571],[0.1085,0.1176],[0.1563,0.1602],[0.0548,0.0561]],"epsilon":0.010929,"xi":0.145898,"linearCR":0.0024,"nonlinearCR":0.0326},
{"form":{"best":1,"worst":4,"bo":[2,1,4,3,8],"ow":[4,8,4,2,1]},"weights":[0.246154,0.430769,0.123077,0.153846,0.046154],"intervals":[[0.1579,0.2469],[0.4286,0.4932],[0.1429,0.1644],[0.1111,0.1579],[0.0476,0.0548]],"epsilon":0.061538,"xi":1.0,"linearCR":0.0138,"nonlinearCR":0.2237}]
$samples$::jsonb) loop
    form := example->'form';
    weights := private.bamco_bwm_weights(form,5);
    analysis := private.bamco_bwm_analysis(form,weights);
    assert (analysis->>'ci')::numeric=4.47;
    foreach k in array array['epsilon','xi','linearCR','nonlinearCR'] loop
      assert abs((analysis->>k)::numeric-(example->>k)::numeric)
        <= case when k like '%CR' then 0.000051 else 0.00000051 end, k;
    end loop;
    for i in 0..4 loop
      assert abs((weights->>i)::numeric-(example->'weights'->>i)::numeric)<=0.00000051, 'linear weight';
      for j in 0..1 loop
        assert abs((analysis->'intervals'->i->>j)::numeric-
                   (example->'intervals'->i->>j)::numeric)<=0.000051, 'interval endpoint';
      end loop;
    end loop;
  end loop;
end;
$verify$;
