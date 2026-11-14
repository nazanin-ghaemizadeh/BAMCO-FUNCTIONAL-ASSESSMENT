const {JSDOM,VirtualConsole}=require('jsdom'),Excel=require('exceljs'),fs=require('fs'),assert=require('assert');
(async()=>{
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;w.fetch=async()=>{throw Error('offline')};
for(const f of ['translations-en.js','translations-zh.js','planning-translations.js','dashboard-translations.js','i18n.js','data.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','app.js','polish.js','day-workflow.js','day-pdf.js','day-scores.js'])w.eval(fs.readFileSync(f,'utf8'));
const api=w.BAMCO_ASSESSMENT,feature=w.BAMCO_DAY_SCORES,click=s=>{assert(d.querySelector(s),s);d.querySelector(s).click()};let snapshot;
api.open({setupComplete:true},v=>snapshot=structuredClone(v),false);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert.equal(d.getElementById('dayScoresSave').parentElement.id,'assessmentPageActions');assert.equal(d.getElementById('dayQuestionsPdf').nextElementSibling.id,'dayScoresExcel');
// The language observer is active in production. The page must yield to user input
// after entering scores. Stop a feedback loop explicitly so CI cannot hang.
let labelChanges=0;
const saveLabel=d.querySelector('#dayScoresSave button');
const labelObserver=new w.MutationObserver(records=>{
  labelChanges+=records.length;
  if(labelChanges>10){
    console.error('Entering scores repeatedly rewrote the save button');
    process.exit(1);
  }
});
labelObserver.observe(saveLabel,{childList:true});
await new Promise(resolve=>setTimeout(resolve,0));
labelObserver.disconnect();
assert(labelChanges<=10,'Entering scores repeatedly rewrote the save button');
const first=api.currentTests()[0];click('[data-test="'+first.id+'"][data-score="8"]');let note=d.querySelector('[data-note="'+first.id+'"]');note.value='typed before blur';note.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(snapshot.records['drive:1:'+first.id].note,'typed before blur');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
api.setMission('drive:1',{customTests:[{id:'custom-export',cat:'CUSTOM CAT',sub:'CUSTOM SUB',name:'Custom test',score:7,note:'Evidence',photo:png}]});api.refresh();
click('[data-category]:not([data-category="همه"])');const all=api.currentTests().length,data=feature.collect();assert.equal(data.items.length,all+1);assert.equal(data.items.at(-1).name,'Custom test');assert.equal(data.items.find(t=>t.id===first.id).score,8);
const before=JSON.stringify(api.snapshot()),blob=await feature.build(Excel,data);const bytes=await new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(Buffer.from(reader.result));reader.readAsArrayBuffer(blob)});const book=new Excel.Workbook();await book.xlsx.load(bytes);assert.equal(book.worksheets.length,2);const scores=book.worksheets[0],evidence=book.worksheets[1];assert.equal(scores.rowCount,all+5);assert(scores.getTable('DayScores'));assert.equal(scores.views[0].ySplit,4);assert(scores.views[0].rightToLeft);assert.equal(evidence.getImages().length,1);assert(evidence.getTable('DayEvidence'));assert.equal(scores.getCell(5,5).value,8);assert.notEqual(scores.getCell(5,1).fill.fgColor.argb,scores.getCell(scores.rowCount,1).fill.fgColor.argb);assert.equal(JSON.stringify(api.snapshot()),before);
await feature.build(Excel,{...data,items:[]});
let succeed=false,received;w.BAMCO_CASES={current:()=>({id:'test',title:'Test'}),saveNow:async v=>{received=structuredClone(v);return succeed}};await feature.save();assert(d.getElementById('dayScoresSave').textContent.includes('تأیید نشد'));succeed=true;let releaseImage;api.trackPicture(new Promise(resolve=>releaseImage=resolve));const saving=feature.save();await new Promise(r=>setTimeout(r,0));assert(d.getElementById('dayScoresSave').firstElementChild.disabled);releaseImage();await saving;assert(d.getElementById('dayScoresSave').textContent.includes('در سرور ذخیره'));assert(received.records['drive:1:'+first.id]);
api.open(received,()=>{},false);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert.equal(feature.collect().items.find(t=>t.id===first.id).score,8);assert.equal(feature.collect().items.find(t=>t.id===first.id).note,'typed before blur');
api.open(received,()=>{throw Error('readonly write')},true);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert(!d.getElementById('dayScoresSave'));assert(d.getElementById('dayScoresExcel'));click('[data-daysection="form"]');assert(!d.getElementById('dayScoresExcel'));assert.deepEqual(errors,[]);w.close();console.log('PASS daily scores: immediate notes, save success/failure/reopen, full-day export with filters, custom tests, images, tables, colors and readonly.');
})().catch(e=>{console.error(e);process.exit(1)});
