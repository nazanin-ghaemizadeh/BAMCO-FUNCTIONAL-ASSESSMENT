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
  w.structuredClone=structuredClone;
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async(_,request)=>({ok:true,json:()=>reply(JSON.parse(request.body))});
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
  for(const script of [...d.scripts])w.eval(script.textContent);
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
  assert.equal(l.querySelectorAll('#assessmentHub .gate-card svg').length,4);
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
