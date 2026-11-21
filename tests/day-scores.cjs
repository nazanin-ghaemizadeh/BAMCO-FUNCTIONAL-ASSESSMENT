const {JSDOM,VirtualConsole}=require('jsdom'),Excel=require('exceljs'),fs=require('fs'),assert=require('assert');
(async()=>{
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const w=new JSDOM(fs.readFileSync('case.html','utf8'),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;w.fetch=async()=>{throw Error('offline')};
for(const f of ['translations-en.js','translations-zh.js','planning-translations.js','dashboard-translations.js','pre-drive-checklist.js','i18n.js','data.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','app.js','dropdowns.js','polish.js','day-workflow.js','day-pdf.js','day-scores.js'])w.eval(fs.readFileSync(f,'utf8'));
const api=w.BAMCO_ASSESSMENT,feature=w.BAMCO_DAY_SCORES,click=s=>{require('./navigation.cjs')(d,s);if(s==='[data-open="results"]'&&d.getElementById('assessmentDashboard'))return;assert(d.querySelector(s),s);d.querySelector(s).click()};let snapshot;
api.open({setupComplete:true},v=>snapshot=structuredClone(v),false);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert.equal(d.getElementById('dayScoresSave').parentElement.id,'assessmentPageActions');assert.equal(d.getElementById('dayQuestionsPdf').nextElementSibling.id,'dayScoresExcel');
const road=d.getElementById('dayProgressRoad'),meter=road.querySelector('[role="progressbar"]');
const dailyTotal=api.currentTests().length;
const fa=n=>n.toLocaleString('fa-IR');
function checkProgress(answered,total) {
  assert(!road.hidden);
  assert.equal(d.getElementById('dayProgressCount').textContent,fa(answered)+' از '+fa(total)+' سؤال پاسخ داده شده');
  assert.equal(Number(meter.getAttribute('aria-valuenow')),total ? Math.round(100*answered/total) : 0);
}
checkProgress(0,dailyTotal);
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
const first=api.currentTests()[0];click('[data-test="'+first.id+'"][data-score="8"]');checkProgress(1,dailyTotal);let note=d.querySelector('[data-note="'+first.id+'"]');note.value='typed before blur';note.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(snapshot,undefined);assert.equal(api.snapshot().records['drive:1:'+first.id].note,'typed before blur');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
api.setMission('drive:1',{date:'1405/8/23',customTests:[{id:'custom-export',cat:first.cat,sub:first.sub,name:'Custom test',score:7,note:'Evidence',photo:png}]});api.refresh();
checkProgress(2,dailyTotal+1);
click('[data-custom-score="7"]');checkProgress(1,dailyTotal+1);
click('[data-custom-score="7"]');checkProgress(2,dailyTotal+1);
click('[data-category]:not([data-category="همه"])');const all=api.currentTests().length,data=feature.collect();checkProgress(2,dailyTotal+1);assert.equal(data.items.length,all+1);assert.equal(data.items.at(-1).name,'Custom test');assert.equal(data.items.find(t=>t.id===first.id).score,8);
data.title='Nazi';const before=JSON.stringify(api.snapshot()),blob=await feature.build(Excel,data);const bytes=await new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(Buffer.from(reader.result));reader.readAsArrayBuffer(blob)});const book=new Excel.Workbook();await book.xlsx.load(bytes);assert.equal(book.worksheets.length,2);const scores=book.worksheets[0],evidence=book.worksheets[1];assert.equal(scores.rowCount,all+3);assert(scores.getTable('DayScores'));assert.equal(scores.views[0].ySplit,2);assert(scores.views[0].rightToLeft);assert.equal(evidence.getImages().length,1);assert(evidence.getTable('DayEvidence'));assert.equal(scores.getCell(3,5).value,8);assert.notEqual(scores.getCell(3,1).fill.fgColor.argb,scores.getCell(scores.rowCount,1).fill.fgColor.argb);assert.equal(JSON.stringify(api.snapshot()),before);
assert.deepEqual(scores.getRow(2).values.slice(1),['ردیف','شاخص','زیرشاخص','آزمون','نمره از ۱۰']);
for (const ws of book.worksheets) {
  const isScore=ws===scores, last=isScore?'E':'F', face=isScore?'B Nazanin':'Tahoma';
  assert.equal(ws.getCell('A1').value,'Nazi | قابلیت رانندگی | روز 1 | ۱۴۰۵/۰۸/۲۳');
  assert.equal(ws.getCell('A2').value,'ردیف');
  assert.equal(ws.getCell('A3').value,1);
  assert.equal(ws.getCell('A1').fill.fgColor.argb,ws.getCell(last+'2').fill.fgColor.argb);
  for (const pos of ['A1',last+'1','A2','D3',last+'3']) assert.equal(ws.getCell(pos).font.name,face);
  assert.equal(ws.getRow(1).height,36);
  assert.equal(ws.getRow(2).height,31.95);
  assert.equal(ws.getRow(3).height,54);
  assert.equal(ws.getCell('A1').font.size,isScore?14:11);
  assert.equal(ws.getCell('A2').font.size,11);
  assert.equal(ws.getCell('D3').font.size,isScore?12:11);
  assert.equal(ws.getTables()[0].model.tableRef,'A2:'+last+ws.rowCount);
  assert.equal(ws.pageSetup.printTitlesRow,'1:2');
  const customRow=ws.getRows(3,ws.rowCount-2).find(row=>row.getCell(4).value==='Custom test');
  assert.equal(customRow.getCell(2).value,first.cat);
  assert.equal(customRow.getCell(3).value,first.sub);
  assert.equal(ws.getRow(customRow.number-1).getCell(3).value,first.sub);
  for(let col=1;col<=ws.columnCount;col++){
    assert.equal(customRow.getCell(col).font.color.argb,'FFFF0000');
    assert.equal(customRow.getCell(col).fill.fgColor.argb,ws.getCell(3,col).fill.fgColor.argb);
  }
}
assert.equal(evidence.getImages()[0].range.tl.nativeRow,evidence.rowCount-1);
const imageRange=evidence.getImages()[0].range;
assert.equal(imageRange.br.nativeColOff-imageRange.tl.nativeColOff,200*9525);
assert.equal(imageRange.br.nativeRowOff-imageRange.tl.nativeRowOff,135*9525);
assert.equal(evidence.lastRow.height,112.05);
w.ExcelJS=Excel;w.BAMCO_CASES={current:()=>({id:'test',title:'Nazi'})};
async function filename(){
  const exported=new Promise(resolve=>{api.exportFile=(_,name)=>resolve(name)});
  click('#dayScoresExcel');return await exported;
}
assert.equal(await filename(),'Nazi-driveability-day-1-scores.xlsx');
await feature.build(Excel,{...data,items:[]});
let succeed=false,received;w.BAMCO_CASES={current:()=>({id:'test',title:'Test'}),saveNow:async v=>{received=structuredClone(v);return succeed}};await feature.save();assert(d.getElementById('dayScoresSave').textContent.includes('تأیید نشد'));succeed=true;let releaseImage;api.trackPicture(new Promise(resolve=>releaseImage=resolve));const saving=feature.save();await new Promise(r=>setTimeout(r,0));assert(d.getElementById('dayScoresSave').firstElementChild.disabled);releaseImage();await saving;assert(d.getElementById('dayScoresSave').textContent.includes('در سرور ذخیره'));assert(received.records['drive:1:'+first.id]);
api.open(received,()=>{},false);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert.equal(feature.collect().items.find(t=>t.id===first.id).score,8);assert.equal(feature.collect().items.find(t=>t.id===first.id).note,'typed before blur');
api.open(received,()=>{throw Error('readonly write')},true);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');assert(!d.getElementById('dayScoresSave'));assert(d.getElementById('dayScoresExcel'));click('[data-daysection="form"]');assert(!d.getElementById('dayScoresExcel'));assert(road.hidden);click('#assessmentTabActions button');assert(road.hidden);
click('[data-daysection="route"]');assert(road.hidden);click('#assessmentTabActions button');assert(road.hidden);
assert.equal(d.getElementById('dayNavigation').nextElementSibling,road);
click('#assessmentTabActions button');assert(road.hidden);click('[data-day="2"]');assert(road.hidden);click('[data-daysection="scores"]');checkProgress(0,api.currentTests().length);
w.BAMCO_I18N.setLanguage('en');await new Promise(r=>setTimeout(r,0));assert(d.getElementById('dayProgressCount').textContent.includes('questions answered'));
w.BAMCO_I18N.setLanguage('fa');api.open({setupComplete:true},()=>{},false);assert(road.hidden);
click('[data-open="durability"]');assert(road.hidden);click('[data-day="1"]');
const planCount=api.currentTests().length;
api.setMission('durability:1',{customTests:[{id:'c',name:'آزمون',score:null}]});api.refresh();
assert(road.hidden);click('[data-daysection="scores"]');checkProgress(0,planCount+1);click('[data-custom-score="5"]');checkProgress(1,planCount+1);
assert.equal(await filename(),'Test-durability-day-1-scores.xlsx');
w.confirm=()=>true;click('[data-custom-delete="c"]');checkProgress(0,planCount);
const pickup=road.querySelector('.day-road-body img');
assert(pickup && fs.existsSync(pickup.getAttribute('src')));
for(const mode of ['supplementary','comprehensive']){
  api.open({setupComplete:true,missions:{'supplementary:general':{customTests:[{id:'CUSTOM-road',cat:'شاخص',sub:'زیرشاخص',name:'آزمون'}]}}},()=>{},false);
  click('[data-open="'+mode+'"]');
  const total=api.currentTests().length;checkProgress(0,total);
  click('#questionsPanel [data-score="6"]');checkProgress(1,total);
  api.openDashboard(mode);assert(road.hidden);
}
assert.deepEqual(errors,[]);w.close();console.log('PASS daily scores: immediate notes, save success/failure/reopen, full-day export with filters, custom tests, images, tables, colors and readonly.');
})().catch(e=>{console.error(e);process.exit(1)});
