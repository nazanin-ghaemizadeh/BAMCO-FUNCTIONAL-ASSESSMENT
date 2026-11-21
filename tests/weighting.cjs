const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

(async () => {
  const w = new JSDOM('<main></main>', {url:'https://example.test/?view=weighting',runScripts:'outside-only'}).window;
  const d = w.document;
  w.scrollTo = () => {};
  for (const file of ['weighting-catalog.js','weighting-content.js','weighting.js']) w.eval(fs.readFileSync(file,'utf8'));
  const catalog = w.BAMCO_WEIGHTING_CATALOG;
  assert.equal(catalog.length,15);
  assert.equal(catalog.reduce((n,c)=>n+c.items.length,0),131);
  for(const file of ['weighting.js','weighting-catalog.js','weighting-content.js']){
    assert(!/[ۀةەھہۃۂﻩﻪﻫﻬ]|ه\u0654/.test(fs.readFileSync(file,'utf8')),file);
  }
  const expectedSizes = catalog.map(c=>c.items.length);
  const sql = fs.readFileSync('database/assessment-weighting.sql','utf8');
  assert(sql.includes('array['+[15,...expectedSizes].join(',')+']'));
  const sets = new Map();
  const panels = new Map();
  async function requestRpc(_, {operation,args}) {
    if (operation==='create') {
      panels.set(args.panel,args.manager);
      sets.set(args.id,{id:args.id,key:args.key,respondent:sets.size+1,profile:structuredClone(args.profile),forms:{},weights:{},analyses:{}});
    }
    if(operation==='list_subcriteria')return {data:[...sets.values()].filter(r=>args.keys[r.id]===r.key).map(r=>({...r,name:r.profile.name,revision:'v1',completed:catalog.filter((_,i)=>r.weights[i+1]).length}))};
    if(operation==='results_subcriteria'){
      assert.equal(panels.get(args.panel),args.manager);
      return {data:[...sets.values()].filter(r=>catalog.every((_,i)=>r.weights[i+1])).map(r=>({...r,name:r.profile.name}))};
    }
    const rec=sets.get(args.id);
    assert(rec&&args.key===rec.key);
    if(operation==='delete'){assert.equal(args.revision,'v1');sets.delete(args.id);return {data:{id:args.id}}}
    if(operation==='save_subcriteria'){
      assert(args.group>0&&args.group<=15);
      assert.equal(JSON.stringify(args.previous),JSON.stringify(rec.forms[args.group]||null));
      rec.forms[args.group]=structuredClone(args.form);
      const f=args.form;
      if(f.bo.every(x=>x!==null)&&f.ow.every(x=>x!==null)){
        rec.weights[args.group]=f.bo.map(()=>1/f.bo.length);
        rec.analyses[args.group]={epsilon:0,xi:0,ci:0.44,linearCR:0,nonlinearCR:0,intervals:f.bo.map(()=>[1/f.bo.length,1/f.bo.length])};
      }
    }
    return {data:structuredClone(rec)};
  }
  const mount=()=>w.BAMCO_WEIGHTING.mount(d.querySelector('main'),{language:'fa',requestRpc,home(){}});
  const byText=(sel,t)=>[...d.querySelectorAll(sel)].find(b=>b.textContent===t);
  const wait=()=>new Promise(resolve=>setTimeout(resolve,0));
  mount();assert.equal(d.querySelectorAll('.bw-tile').length,2);
  d.querySelector('.bw-tile').click();await wait();d.querySelector('.assessment-page-toolbar .bw-new-form').click();
  assert(d.querySelector('.bw-guide[open]'));
  const name=d.querySelector('.bw-fields input');name.value='QA';name.dispatchEvent(new w.Event('input'));
  d.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();
  assert.deepEqual([...d.querySelectorAll('.bw-group-tile strong')].map(x=>x.textContent),Array.from(catalog,x=>x.title[0]));
  const id=[...sets.keys()][0];
  function nav(route) {w.history.pushState(null,'','#'+route);mount()}
  for(let g=1;g<=15;g++){
    const n=expectedSizes[g-1];
    d.querySelectorAll('.bw-group-tile')[g-1].click();await wait();
    assert.equal(d.querySelectorAll('input[name=best]').length,n);
    const definitions=[...d.querySelectorAll('.bw-definitions tbody tr')];
    assert.equal(definitions.length,n);
    definitions.forEach((row,i)=>{
      const item=catalog[g-1].items[i];
      const translations=catalog[g-1].definitions[item[0]];
      assert.equal(translations.length,3);
      assert(translations.every(description=>description.trim().length>10));
      assert.deepEqual([...row.cells].slice(1).map(cell=>cell.textContent),[item[0],translations[0]]);
    });
    assert(!/\b(?:C|SC)\d/.test(d.querySelector('main').textContent));
    if(g===1){
      const observed=[...d.querySelectorAll('input[name=best]')].map(r=>r.parentNode.textContent);
      assert.deepEqual(observed,Array.from(catalog[0].items,s=>s[0]));
    }
    const select=(key,i)=>d.querySelector('input[name="'+key+'"][value="'+i+'"]').click();
    select('best',0);select('worst',n-1);
    assert(d.querySelector('input[name=bo-0][value="1"]').disabled);
    select('bo-'+(n-1),2);assert(d.querySelector('input[name=ow-0][value="2"]').checked);
    if(g===1){
      byText('button','ذخیره').click();await wait();
      assert.equal(d.querySelector('.bw-group-tile .gate-cta').textContent,'در حال تکمیل');
      d.querySelector('.bw-group-tile').click();await wait();assert(d.querySelector('input[name=ow-0][value="2"]').checked);
      select('bo-1',5);byText('button','بازگشت').click();await wait();d.querySelector('.bw-group-tile').click();await wait();
      assert(!d.querySelector('input[name=bo-1][value="5"]').checked);
    }
    for(let j=1;j<n-1;j++){select('bo-'+j,1);select('ow-'+j,2)}
    byText('button','ذخیره').click();await wait();
    assert.equal(w.location.hash,'#e/'+id);
  }
  assert.equal(Object.keys(sets.get(id).weights).length,15);
  // Previously saved main weights must never enter the report.
  sets.get(id).weights[0]=[];
  nav('e/'+id+'/g/0');await wait();assert.equal(w.location.hash,'#e/'+id);
  nav('e/'+id+'/g/5');await wait();assert(d.querySelector('.bw-pie-legend'));
  nav('results');await wait();
  assert.equal(d.querySelectorAll('.bw-group-select option').length,15);
  assert.equal(d.querySelectorAll('table').length,0);
  const sel=d.querySelector('.bw-filter:last-of-type select');sel.value='1';sel.dispatchEvent(new w.Event('change'));
  const group=d.querySelector('.bw-group-select select');
  for(let i=1;i<=15;i++){
    group.value=String(i);group.dispatchEvent(new w.Event('change'));
    assert.equal(d.querySelectorAll('.bw-pie-figure path').length,expectedSizes[i-1]);
    const keys=d.querySelectorAll('.bw-slice-key');
    assert.equal(keys.length,expectedSizes[i-1]);keys[1].click();
    assert.equal(keys[1].getAttribute('aria-pressed'),'true');
    assert.equal(d.querySelector('.bw-selection h3').textContent,catalog[i-1].items[1][0]);
    assert.equal(d.querySelectorAll('.bw-bounds dd').length,4);
  }
  assert(d.querySelector('main').textContent.includes('مدل غیرخطی'));
  sets.get(id).is_example=true;
  nav('results');await wait();
  assert(!d.querySelector('.bw-filter option[value="all"]'));
  assert(d.querySelector('.bw-pie-figure'));
  const other=structuredClone(sets.get(id));other.respondent=2;other.is_example=false;other.weights[11]=[0.75,0.25];
  sets.set('another-respondent',other);
  nav('results');await wait();
  const aggregate=d.querySelector('.bw-filter:last-of-type select');
  assert(aggregate.querySelector('option[value="all"]').textContent.includes('(۱)'));
  aggregate.value='all';aggregate.dispatchEvent(new w.Event('change'));
  const combinedGroup=d.querySelector('.bw-group-select select');
  combinedGroup.value='11';combinedGroup.dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelector('.bw-slice-key bdi').textContent,'۷۵٪');
  sets.delete('another-respondent');
  nav('forms');await wait();assert(!/پیوند|دعوت‌نامه/.test(d.querySelector('main').textContent));
  w.confirm=()=>false;byText('button','حذف').click();await wait();assert.equal(sets.size,1);
  w.confirm=()=>true;byText('button','حذف').click();await wait();assert.equal(sets.size,0);
  assert.equal(d.querySelector('.assessment-row'),null);
  nav('results');await wait();assert.equal(d.querySelector('.bw-pie-figure'),null);
  const sample=JSON.parse(fs.readFileSync('assets/weighting-sample.json','utf8'));
  const sampleGroups=Array.from({length:15},(_,i)=>String(i+1));
  assert.deepEqual(Object.keys(sample.weights),sampleGroups);
  assert.deepEqual(Object.keys(sample.analyses),sampleGroups);
  for(const g of sampleGroups){
    assert.equal(sample.weights[g].length,expectedSizes[g-1]);
    assert.equal(sample.analyses[g].intervals.length,expectedSizes[g-1]);
    assert(Math.abs(sample.weights[g].reduce((a,b)=>a+b,0)-1)<1e-9);
  }
  w.fetch=async url=>{assert.equal(url,'./assets/weighting-sample.json');return {ok:true,json:async()=>sample}};
  byText('button','مشاهده‌ی نمونه‌ی آزمایشی').click();await wait();
  assert.equal(w.location.hash,'#sample');
  const sampleGroup=d.querySelector('.bw-group-select select');sampleGroup.value='11';sampleGroup.dispatchEvent(new w.Event('change'));
  assert.deepEqual([...d.querySelectorAll('.bw-slice-key bdi')].map(n=>n.textContent),['۷۵٪','۲۵٪']);
  byText('button','بازگشت').click();await wait();assert.equal(w.location.hash,'#results');
  w.close();console.log('PASS questionnaire creation, 15 subcriterion groups, drafts, exact saves, pie selections and deletion.');
})().catch(e=>{console.error(e);process.exitCode=1});
