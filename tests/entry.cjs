const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');

(async()=>{
  const html = fs.readFileSync('index.html','utf8');
  const dom = new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window, d=w.document;
  const fetched=[], operations=[], row={id:'test',title:'QA',status:'active',revision:1};
  const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
  const until=async test=>{
    for(let i=0;i<100;i++){if(test())return;await tick()}
    assert.fail('Timed out waiting for the entry flow');
  };
  try {
    w.structuredClone=structuredClone;
    w.scrollTo=()=>{};
    w.HTMLElement.prototype.scrollIntoView=()=>{};
    w.fetch=async(url,options)=>{
      const body=JSON.parse(options.body);
      operations.push(body.operation);
      const data=body.operation==='list'?(body.args.status==='active'?[row]:[]):{...row,snapshot:{setupComplete:true}};
      return {ok:true,json:async()=>data};
    };
    // Emulate the network events for precisely the assets requested by the shipped HTML.
    let failBank=true;
    const append=d.head.append.bind(d.head);
    d.head.append=(...nodes)=>{
      append(...nodes);
      for(const el of nodes)if(el.tagName==='SCRIPT'){
        const file=new URL(el.src).pathname.slice(1);
        fetched.push(file);
        queueMicrotask(()=>{
          if(file==='data.js' && failBank){failBank=false;el.onerror();return}
          w.eval(fs.readFileSync(file,'utf8'));
          el.onload();
        });
      }
    };
    new w.MutationObserver(changes=>{
      for(const {target} of changes)if(target.matches('link[data-style][href]')) target.onload();
    }).observe(d.head,{subtree:true,attributes:true,attributeFilter:['href']});

    assert.equal(d.querySelectorAll('script[src]').length,0,'welcome is interactive from the HTML alone');
    assert.equal(d.querySelectorAll('link[rel="stylesheet"]:not([media="print"])').length,0);
    assert(!d.querySelector('link[href*="googleapis"]'));
    assert(d.getElementById('landing-critical').textContent.includes('.gate-card'));
    for(const script of d.scripts)w.eval(script.textContent);
    await tick();
    assert.equal(d.querySelectorAll('#assessmentHub .gate-card svg').length,4);
    d.querySelector('[data-language="en"]').click();
    assert.match(d.querySelector('[data-boot-screen="active"]').textContent,/Active assessments/);
    d.querySelector('[data-boot-screen="active"]').click();
    await until(()=>d.querySelector('.assessment-open-action'));
    assert.deepEqual(fetched,[],'listing in a second language needs no editor or dictionaries');
    d.querySelector('[data-language="fa"]').click();
    d.querySelector('.assessment-open-action').click();
    await until(()=>d.querySelector('#assessmentHub [role="status"]')?.textContent.includes('برقرار نشد'));
    assert.equal(w.BAMCO_CASES.current(),null);
    d.querySelector('.assessment-open-action').click();
    await until(()=>w.BAMCO_CASES.current()?.id==='test');
    assert(d.querySelector('[data-open="assessmentTypes"]'));
    assert.equal(fetched.filter(x=>x==='data.js').length,2);
    assert.equal(fetched.filter(x=>x==='i18n.js').length,1,'retry does not initialize listeners twice');
    assert(!fetched.some(x=>/^translations-(en|zh)/.test(x)),'Persian editor requires neither base dictionary');

    const key='شاخص‌های ارزیابی';
    for(const lang of ['zh','en','zh','fa']){
      d.querySelector('[data-language="'+lang+'"]').click();
      await until(()=>w.BAMCO_I18N.language===lang);
      if(lang!=='fa')assert.notEqual(w.BAMCO_I18N.text(key),key);
    }
    const dictionaryFiles=fetched.filter(x=>/^translations-/.test(x));
    assert.deepEqual(dictionaryFiles,['translations-zh.js','translations-en.js']);
    assert.equal(operations.filter(x=>x==='save').length,0);
    console.log('PASS cold entry, inlined controls, on-demand editor and languages, retry and language switching.');
  } finally {w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
