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
    if(operation==='list')return {data:[...sets.values()].filter(r=>args.keys[r.id]===r.key).map(r=>({...r,name:r.profile.name,completed:Object.keys(r.weights).length}))};
    if(operation==='results'){
      assert.equal(panels.get(args.panel),args.manager);
      return {data:[...sets.values()].filter(r=>Object.keys(r.weights).length===16).map(r=>({...r,name:r.profile.name}))};
    }
    const rec=sets.get(args.id);
    assert(rec&&args.key===rec.key);
    if(operation==='save'){
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
  d.querySelector('.bw-tile').click();await wait();byText('button','ایجاد پرسش‌نامه').click();
  assert(d.querySelector('.bw-guide[open]'));
  const name=d.querySelector('.bw-fields input');name.value='QA';name.dispatchEvent(new w.Event('input'));
  d.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();
  assert.deepEqual([...d.querySelectorAll('.bw-row strong')].map(x=>x.textContent),['شاخص‌های اصلی','زیرشاخص‌ها']);
  const id=[...sets.keys()][0];
  function nav(route) {w.history.pushState(null,'','#'+route);mount()}
  for(let g=0;g<16;g++){
    const n=g===0?15:expectedSizes[g-1];
    if(g===1){
      d.querySelectorAll('.bw-row')[1].click();await wait();
      assert.equal(d.querySelectorAll('.bw-row').length,15);
      assert.equal(w.location.hash,'#e/'+id+'/sub');
    }
    d.querySelectorAll('.bw-row')[g===0?0:g-1].click();await wait();
    assert.equal(d.querySelectorAll('input[name=best]').length,n);
    assert(!/\b(?:C|SC)\d/.test(d.querySelector('main').textContent));
    if(g===1){
      const observed=[...d.querySelectorAll('input[name=best]')].map(r=>r.parentNode.textContent);
      assert.deepEqual(observed,Array.from(catalog[0].items,s=>s[0]));
    }
    const select=(key,i)=>d.querySelector('input[name="'+key+'"][value="'+i+'"]').click();
    select('best',0);select('worst',n-1);
    assert(d.querySelector('input[name=bo-0][value="1"]').disabled);
    select('bo-'+(n-1),2);assert(d.querySelector('input[name=ow-0][value="2"]').checked);
    if(g===0){
      byText('button','ذخیره').click();await wait();
      assert.equal(d.querySelector('.bw-row small').textContent,'در حال تکمیل');
      d.querySelector('.bw-row').click();await wait();assert(d.querySelector('input[name=ow-0][value="2"]').checked);
      select('bo-1',5);byText('button','بازگشت').click();await wait();d.querySelector('.bw-row').click();await wait();
      assert(!d.querySelector('input[name=bo-1][value="5"]').checked);
    }
    for(let j=1;j<n-1;j++){select('bo-'+j,1);select('ow-'+j,2)}
    byText('button','ذخیره').click();await wait();
    assert.equal(w.location.hash,'#e/'+id+(g===0?'':'/sub'));
  }
  byText('button','بازگشت').click();await wait();
  assert.equal(d.querySelectorAll('.bw-row').length,2);
  nav('e/'+id+'/g/5');await wait();
  assert(d.querySelector('.bw-intervals'));
  byText('button','بازگشت').click();await wait();
  assert.equal(d.querySelectorAll('.bw-row').length,15);
  assert.equal(Object.keys(sets.get(id).weights).length,16);
  nav('results');await wait();
  assert.equal(d.querySelectorAll('.bw-result').length,15);
  assert.equal(d.querySelectorAll('.bw-result tbody tr').length,131);
  const select=d.querySelector('.bw-filter:last-of-type select');select.value='1';select.dispatchEvent(new w.Event('change'));
  assert(d.querySelector('.bw-card').textContent.includes('مدل خطی'));
  assert.equal(d.querySelectorAll('.bw-intervals').length,16);
  assert.equal(d.querySelectorAll('.bw-intervals tbody tr').length,146);
  assert(d.querySelector('main').textContent.includes('مدل غیرخطی'));
  w.close();console.log('PASS weighting: 16 forms, 131 names, independent drafts, mirrored comparisons, explicit saves, individual and group results.');
})().catch(e=>{console.error(e);process.exitCode=1});
