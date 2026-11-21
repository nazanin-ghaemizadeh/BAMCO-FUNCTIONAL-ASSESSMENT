const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function until(check){
  for(let i=0;i<100;i++){if(check())return;await tick()}
  assert.fail('Timed out waiting for navigation');
}

function visit(path,url,reply,options={}){
  const dom=new JSDOM(fs.readFileSync(path,'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window,d=w.document,fetched=[];
  if(!w.HTMLDialogElement.prototype.showModal){
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
    w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  }
  w.structuredClone=structuredClone;
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async(url,request)=>({ok:true,json:()=>String(url).includes('/release.json?') ? JSON.parse(fs.readFileSync('release.json','utf8')) : reply(JSON.parse(request.body))});
  const append=d.head.append.bind(d.head);
  d.head.append=(...nodes)=>{
    append(...nodes);
    for(const el of nodes)if(el.tagName==='SCRIPT'){
      const file=new URL(el.src).pathname.slice(1);
      fetched.push(file);
      queueMicrotask(()=>{
        if(file===options.failOnce){options.failOnce=null;el.onerror();return}
        w.eval(fs.readFileSync(file,'utf8'));el.onload();
      });
    }
  };
  new w.MutationObserver(changes=>{
    for(const {target} of changes)if(target.matches('link[data-style][href]'))target.onload();
  }).observe(d.head,{subtree:true,attributes:true,attributeFilter:['href']});
  require('./portal-fixture.cjs')(w,options.grants??null);
  options.beforeStart?.(w);
  for(const script of [...d.scripts])if(script.id!=='portal-runtime')w.eval(script.textContent);
  return {w,d,fetched,close:()=>w.close()};
}
(async()=>{
  const row={id:'vehicle',title:'QA',status:'active',revision:5};
  const operations=[];
  let snapshot={setupComplete:true};
  const reply=({operation,args})=>{
    operations.push(operation);
    if(operation==='list')return args.status==='active'?[row]:[];
    assert.equal(operation,'open');assert.equal(args.id,row.id);
    return {...row,snapshot};
  };
  const landing=visit('index.html','https://example.test/',reply);
  const l=landing.d;
  assert.equal(l.querySelectorAll('script[src]').length,0);
  assert.equal(l.querySelectorAll('link[rel="stylesheet"]:not([media="print"])').length,0);
  assert.equal(l.querySelectorAll('#assessmentHub .gate-card svg').length,6);
  assert(l.querySelector('.gate-card[data-create-test]'));
  assert(l.querySelector('.gate-card[data-boot-screen="questions"]'));
  l.querySelector('[data-language="en"]').click();
  assert.match(l.querySelector('[data-boot-screen="active"]').textContent,/Active assessments/);
  l.querySelector('[data-boot-screen="active"]').click();
  await until(()=>l.querySelector('.assessment-open-action'));
  const url=l.querySelector('.assessment-open-action').href;
  assert.equal(new URL(url).pathname,'/case.html');
  assert.equal(new URL(landing.w.location).searchParams.get('view'),'active');
  assert.deepEqual(landing.fetched,[]);
  assert(!l.querySelector('#caseView'));
  landing.close();

  const newRows=[1,2,3].map(i=>({...row,id:'previous-'+i,title:'Vehicle '+i,assessment_type:'drive'}));
  const typedHome=visit('index.html','https://example.test/',({operation,args})=>{
    if(operation==='list')return args.status==='active'?newRows:[];
    assert.equal(operation,'create');
    newRows.push({...row,title:args.title,assessment_type:args.assessment_type});return {id:row.id};
  });
  const ui=typedHome.d;
  ui.querySelector('[data-create-test]').click();
  const dialog=ui.querySelector('.assessment-create-panel'),form=dialog.querySelector('form');
  assert(dialog.open);assert.equal(form.checkValidity(),false);
  form.querySelector('input[type=text]').value='Typed fixture';assert.equal(form.checkValidity(),false);
  form.querySelector('[value=durability]').click();form.requestSubmit();
  await until(()=>ui.querySelector('.assessment-row-title')?.textContent==='Typed fixture');
  assert.equal(new URL(typedHome.w.location.href).searchParams.get('type'),'durability');
  ui.querySelector('.assessment-back-action').click();
  assert.equal(ui.querySelectorAll('.assessment-type-card').length,4);
  const sprite=new JSDOM(fs.readFileSync('assets/assessment-modules.svg','utf8'),{contentType:'image/svg+xml'});
  for(const card of ui.querySelectorAll('.assessment-type-card')){
    const type=card.dataset.type;
    assert.equal(card.querySelector('use').getAttribute('href'),'./assets/assessment-modules.svg#'+type);
    assert(sprite.window.document.getElementById(type));
  }
  sprite.window.close();
  assert.equal(ui.querySelector('[data-type=drive] .gate-cta').textContent,'۳ ارزیابی');
  assert.equal(ui.querySelector('details'),null);
  ui.querySelector('[data-type=drive]').click();
  await until(()=>ui.querySelectorAll('.assessment-row-title').length===3);
  ui.querySelector('.assessment-back-action').click();
  ui.querySelector('[data-type=static]').click();
  await until(()=>ui.querySelector('.assessment-empty-state'));assert.equal(ui.querySelector('.assessment-row'),null);
  typedHome.close();

  const point=(id,title,latitude)=>({assessment_id:id,title,latitude,longitude:51,recorded_at:'2026-10-01T08:00:00Z',accuracy_m:12});
  let points=[point('a','Case A',35),point('b','Case B',36)],calls=0,poll,replyToPoll;
  const maps=[];
  const observer=visit('index.html','https://example.test/?view=observer',()=>{
    calls++;
    return points;
  },{beforeStart(w){
    w.eval(fs.readFileSync('vendor/leaflet-1.9.4.js','utf8'));
    w.L.Map.addInitHook(function(){maps.push(this)});
    w.setInterval=(fn,ms)=>{if(ms===60000)return 52;assert.equal(ms,10000);poll=fn;return 51};
    w.clearInterval=id=>{assert.equal(id,51);poll=null};
  }});
  const captions=()=>[...observer.d.querySelectorAll('.location-card figcaption strong')].map(el=>el.textContent);
  await until(()=>captions().length===2);
  assert.deepEqual(captions(),['Case A','Case B']);
  const first=observer.d.querySelector('.location-map'),marker=first.querySelector('.location-pin');
  assert(marker);assert.equal(first.nextElementSibling.tagName,'FIGCAPTION');
  assert(maps[0].scrollWheelZoom.enabled());
  assert(maps[0].dragging.enabled());
  first.querySelector('.leaflet-control-zoom-in').click();
  assert.equal(maps[0].getZoom(),16);
  assert.equal(maps[1].getZoom(),15);
  points=[point('c','Case C',33),point('a','Case A renamed',34)];
  await poll();
  assert.deepEqual(captions(),['Case A renamed','Case C']);
  assert.equal(observer.d.querySelector('.location-map'),first);
  assert.equal(first.querySelector('.location-pin'),marker);
  assert.equal(maps[0].getZoom(),16,'Updates preserve zoom on the existing map');
  points=Promise.reject(new Error('offline'));await poll();
  assert.equal(captions().length,2);assert(observer.d.querySelector('.location-summary').textContent.includes('آخرین موقعیت دریافتی'));
  points=[];await poll();assert.deepEqual(captions(),[]);
  assert(observer.d.querySelector('.location-summary').textContent.includes('هیچ پرونده'));
  points=new Promise(resolve=>replyToPoll=resolve);
  const expectedCalls=calls+1,pendingPoll=poll();
  await until(()=>calls===expectedCalls);
  await poll();assert.equal(calls,expectedCalls);
  observer.d.querySelector('.assessment-back-action').click();assert.equal(poll,null);
  replyToPoll([point('late','Late reply',32)]);await pendingPoll;
  assert.equal(observer.d.querySelector('.location-card'),null);
  observer.close();

  for(const [kind,mode] of [['drive','drive'],['durability','durability'],['static','supplementary'],['comprehensive','comprehensive']]){
    let stored={};
    const typed=visit('case.html',url+'#types/'+(kind==='drive'?'supplementary':'drive')+'/scores',({operation,args})=>{
      if(operation==='open')return {...row,assessment_type:kind,snapshot:stored};
      assert.equal(operation,'save');stored=structuredClone(args.snapshot);return {revision:6};
    });
    const doc=typed.d;
    await until(()=>!doc.getElementById('caseView').hidden);
    assert.equal(typed.w.location.hash,'');
    const gates=[...doc.querySelectorAll('#moduleLanding button')];
    assert.deepEqual(gates.map(b=>b.dataset.open),['setup',mode]);
    gates[1].click();assert.equal(doc.body.dataset.view,'setup');
    assert.equal(doc.querySelectorAll('#vehicleForm > .formgrid > .field:not([hidden])').length,kind==='drive'||kind==='durability'?7:6);
    assert.equal(doc.getElementById('driveKm').closest('.field').hidden,kind!=='drive');
    assert.equal(doc.querySelector('.durability-planner-setup').hidden,kind!=='durability');
    if(kind==='durability'){
      const target=doc.getElementById('durKm');assert.equal(target.type,'range');
      assert.deepEqual([target.min,target.max,target.step,target.value],['10000','50000','5000','35000']);
      const update=el=>el.dispatchEvent(new typed.w.Event('input',{bubbles:true}));
      const days=()=>doc.getElementById('durDays').value;
      assert.equal(days(),'۸۹');assert(doc.getElementById('startCity').readOnly);
      assert.equal(doc.getElementById('startCity').value,'تهران');
      const shares=[...doc.querySelectorAll('[id^=share-]')];
      assert(shares.every(el=>el.readOnly));
      assert.deepEqual(shares.map(el=>el.value),['۲۵','۴۰','۱۵','۲','۱۸']);
      doc.getElementById('twoDiff').value='yes';doc.getElementById('twoDiff').dispatchEvent(new typed.w.Event('change',{bubbles:true}));
      assert.deepEqual(shares.map(el=>el.value),['۲۵','۴۰','۱۵','۲','۱۸']);
      for(const value of ['10000','50000','35000']){target.value=value;update(target);assert.equal(target.value,value)}
      const cap=doc.getElementById('cap-urban');cap.value='150';update(cap);assert.notEqual(days(),'۸۹');
      cap.value='300';update(cap);assert.equal(days(),'۸۹');
    }
    doc.getElementById('vehicleForm').requestSubmit();
    await until(()=>doc.body.dataset.view===mode);
    assert(stored.setupComplete);
    if(kind==='durability'){assert.equal(stored.durabilitySchedule.length,89);assert.equal(stored.durabilitySchedule.at(-1).cum,35000)}
    else assert.equal(stored.durabilitySchedule,undefined);
    assert.equal(doc.getElementById('backModulesBtn').dataset.open,'modules');
    typed.close();
  }

  const session=visit('case.html',url,reply,{failOnce:'data.js'});
  const {w,d,fetched}=session;
  assert(!d.getElementById('assessmentHub'),'the vehicle list cannot appear in the case document');
  assert(d.getElementById('caseView').hidden);
  await until(()=>!d.getElementById('caseRetry').hidden);
  assert.equal(w.BAMCO_CASES.current(),null);
  d.getElementById('caseRetry').click();
  await until(()=>!d.getElementById('caseView').hidden);
  assert.equal(w.BAMCO_CASES.current().revision,5);
  assert(d.getElementById('caseEntry').hidden);
  const choices=()=>[...d.querySelectorAll('#moduleLanding button')].map(b=>b.dataset.open||b.dataset.moduleDashboard);
  assert.deepEqual(choices(),['setup','assessmentTypes']);
  const click=s=>d.querySelector(s).click();
  click('[data-open="assessmentTypes"]');
  assert.deepEqual(choices(),['driveMenu','durabilityMenu','supplementaryMenu','comprehensiveMenu']);
  for(const mode of ['drive','durability','supplementary','comprehensive']){
    click('[data-open="'+mode+'Menu"]');
    assert.equal(d.querySelectorAll('#moduleLanding button').length,2);
    assert(d.querySelector('[data-open="'+mode+'"]'));
    click('[data-module-dashboard="'+mode+'"]');
    assert.equal(w.location.hash,'#types/'+mode+'/dashboard');
    if(mode==='comprehensive'){
      assert(!d.getElementById('comprehensiveDashboard').hidden);
      assert(d.getElementById('comprehensiveDashboard').querySelector('iframe'));
      assert(d.getElementById('workPanel').classList.contains('hidden'));
      assert.equal(w.BAMCO_ASSESSMENT.scoreContext(),null);
    }
    w.history.back();await until(()=>w.location.hash==='#types/'+mode&&choices().length===2);
    assert(d.getElementById('comprehensiveDashboard').hidden);
    click('#backModulesBtn');await until(()=>w.location.hash==='#types');
  }
  click('[data-open="comprehensiveMenu"]');
  click('[data-open="comprehensive"]');
  assert.equal(w.location.hash,'#types/comprehensive/scores');
  assert(!d.querySelector('#assessmentPageActions [data-module-dashboard]'));
  assert.equal(fetched.filter(x=>x==='i18n.js').length,1);
  assert(!fetched.some(x=>/^translations-(en|zh)/.test(x)));
  for(const lang of ['zh','en','zh','fa']){
    click('[data-language="'+lang+'"]');await until(()=>w.BAMCO_I18N.language===lang);
    if(lang!=='fa')assert.notEqual(w.BAMCO_I18N.text('شاخص‌های ارزیابی'),'شاخص‌های ارزیابی');
  }
  assert.deepEqual(fetched.filter(x=>/^translations-/.test(x)),['translations-zh.js','translations-en.js']);
  session.close();
  const deep=visit('case.html',url+'#types/drive/calendar/1/menu',reply);
  await until(()=>!deep.d.getElementById('caseView').hidden);
  assert.equal(deep.w.location.hash,'','unknown route returns to the case home');
  deep.close();
  const deepScore=visit('case.html',url+'#types/drive/calendar/1/scores',reply);
  await until(()=>!deepScore.d.getElementById('caseView').hidden);
  assert.equal(deepScore.w.BAMCO_ASSESSMENT.dayContext().section,'scores');
  assert.equal(deepScore.w.BAMCO_ASSESSMENT.dayContext().day,1);
  deepScore.close();
  snapshot={};
  const draft=visit('case.html',url,reply);
  await until(()=>!draft.d.getElementById('caseView').hidden);
  assert(draft.d.querySelector('[data-open="setup"]')&&draft.d.querySelector('[data-open="assessmentTypes"]'));
  draft.d.querySelector('[data-open="assessmentTypes"]').click();
  draft.d.querySelector('[data-open="driveMenu"]').click();
  draft.d.querySelector('[data-open="drive"]').click();
  assert.equal(draft.d.body.dataset.view,'setup');
  draft.close();
  assert(!operations.includes('save'));
  let saved={setupComplete:true},writes=0,fail=false,hold;
  const manual=visit('case.html',url+'#types/supplementary',async({operation,args})=>{
    if(operation==='open')return {...row,snapshot:structuredClone(saved)};
    assert.equal(operation,'save');writes++;
    if(fail)throw Error('offline');
    if(hold)await hold;
    saved=structuredClone(args.snapshot);return {revision:row.revision+writes};
  });
  const page=manual.d,win=manual.w;
  await until(()=>!page.getElementById('caseView').hidden);
  const enter=()=>page.querySelector('[data-open="supplementary"]').click();
  const leave=async()=>{win.history.back();await until(()=>page.body.dataset.view==='supplementaryMenu')};
  const rate=n=>page.querySelector('#questionsPanel [data-score="'+n+'"]').click();
  const note=value=>{
    const field=page.querySelector('#questionsPanel [data-note]');
    field.value=value;field.dispatchEvent(new win.Event('input',{bubbles:true}));
  };
  const selected=()=>page.querySelector('#questionsPanel .question [data-score].selected')?.dataset.score;
  enter();assert(!page.querySelector('#kpis,.kpis .kpi'));rate(8);note('discard');
  const id=page.querySelector('#questionsPanel [data-score]').dataset.test,key='supplementary:general:'+id;
  page.querySelector('[data-pagejump="1"]').click();page.querySelector('[data-pagejump="0"]').click();
  assert.equal(selected(),'8');assert.equal(page.querySelector('[data-note]').value,'discard');
  await leave();enter();assert.equal(selected(),undefined);assert.equal(page.querySelector('[data-note]').value,'');assert.equal(writes,0);
  let release;hold=new Promise(resolve=>{release=resolve});
  rate(7);note('confirmed');page.querySelector('#dayScoresSave button').click();await until(()=>writes===1);
  rate(9);note('entered after clicking Save');hold=null;release();
  await until(()=>!page.querySelector('#dayScoresSave button').disabled);
  assert.equal(saved.records[key].score,7);assert.equal(saved.records[key].note,'confirmed');
  assert.equal(saved.missions['audit:general'].entries.length,1);
  await leave();enter();assert.equal(selected(),'7');assert.equal(page.querySelector('[data-note]').value,'confirmed');
  fail=true;rate(6);page.querySelector('#dayScoresSave button').click();
  await until(()=>page.querySelector('#dayScoresSave [role=status]').textContent.includes('تأیید نشد'));
  assert.equal(selected(),'6');await leave();enter();assert.equal(selected(),'7');
  assert.equal(saved.records[key].score,7);assert.equal(writes,2);
  manual.close();
  console.log('PASS independent case document, exclusive views, fresh read, retry, all menu branches, browser Back, language loading and unconfigured cases.');
})().catch(error=>{console.error(error);process.exit(1)});
