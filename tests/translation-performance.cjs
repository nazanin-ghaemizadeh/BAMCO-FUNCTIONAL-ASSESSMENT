const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
(async()=>{
 const dom=new JSDOM('<body><main id="large"></main><section id="updates"></section></body>',{url:'https://example.test',runScripts:'outside-only'});
 const w=dom.window,d=w.document,tick=()=>new Promise(resolve=>setTimeout(resolve,10));
 d.getElementById('large').innerHTML='<p>ایمنی</p>'.repeat(1000);
 w.BAMCO_TRANSLATIONS={en:{'ایمنی':'Safety'},zh:{'ایمنی':'安全'}};
 w.eval(fs.readFileSync('i18n.js','utf8'));w.BAMCO_I18N.setLanguage('en');await tick();
 const walk=d.createTreeWalker.bind(d);let wholePageScans=0;
 d.createTreeWalker=(root,...args)=>{if(root===d.body)wholePageScans++;return walk(root,...args)};
 const label=d.createElement('span');label.textContent='ایمنی';label.title='ایمنی';d.getElementById('updates').append(label);await tick();
 assert.equal(label.textContent,'Safety');assert.equal(label.title,'Safety');assert.equal(wholePageScans,0);
 label.textContent='ایمنی';await tick();assert.equal(label.textContent,'Safety');assert.equal(wholePageScans,0);
 w.BAMCO_I18N.setLanguage('fa');assert.equal(label.textContent,'ایمنی');assert(wholePageScans>0);
 dom.window.close();console.log('PASS translation performance: incremental updates skip unchanged page content while language switching translates the whole page.');
})().catch(error=>{console.error(error);process.exit(1)});
