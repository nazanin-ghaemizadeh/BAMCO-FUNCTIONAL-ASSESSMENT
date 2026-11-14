const {JSDOM,VirtualConsole}=require('jsdom');
const Excel=require('exceljs'), fs=require('node:fs'), assert=require('node:assert/strict');

(async()=>{
  const errors=[], console=new VirtualConsole();
  console.on('jsdomError',e=>errors.push(e.message));
  const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console}).window;
  const d=w.document;
  w.structuredClone=structuredClone;w.ExcelJS=Excel;w.scrollTo=()=>{};
  for(const f of ['translations-en.js','translations-zh.js','pre-drive-checklist.js','i18n.js','data.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','app.js','polish.js','day-workflow.js','day-scores.js']) w.eval(fs.readFileSync(f,'utf8'));
  const app=w.BAMCO_ASSESSMENT, find=s=>{const el=d.querySelector(s);assert(el,s);return el};
  const click=s=>find(s).click();
  const enter=(tab='drive',day=1)=>{click('[data-open="'+tab+'"]');click('[data-day="'+day+'"]');click('[data-daysection="form"]')};
  const id=s=>d.getElementById(s), saveButton=id('bamco-day-start'), controls=id('dayFormActions');
  const form=()=>id('bamco-day-form');
  const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
  let confirmed=true, stored, writes=0;
  w.BAMCO_CASES={current:()=>({title:'Case A',id:'test'}),saveNow:async snapshot=>{writes++;if(confirmed)stored=structuredClone(snapshot);return confirmed}};
  const save=async()=>{saveButton.click();await tick()};
  app.open({setupComplete:true,missions:{'drive:1':{preDrive:{note:'یادداشت قدیمی'}}}},()=>{},false);assert(controls.hidden);enter();
  assert.equal(saveButton.form,form());assert.equal(saveButton.closest('nav').id,'assessmentPageActions');assert(!controls.hidden);
  assert.equal(form().lastElementChild.className,'bamco-day-block pre-drive');
  assert.equal(d.querySelectorAll('[data-inspection]').length,71);
  assert.equal(d.querySelectorAll('[data-inspection-comment]').length,8);
  assert.equal(d.querySelectorAll('[data-inspection]:checked').length,0);
  assert.equal(new Set(w.BAMCO_PRE_DRIVE.flatMap(g=>g.items.map(x=>x.key))).size,71);
  const cards=d.querySelectorAll('.pre-drive-grid > section');
  assert.equal(cards.length,8);
  const sprite=new w.DOMParser().parseFromString(fs.readFileSync('checklist-icons.svg','utf8'),'image/svg+xml');
  cards.forEach((card,i)=>{
    const group=w.BAMCO_PRE_DRIVE[i];
    assert.equal(card.querySelector('h4').textContent,group.title);
    assert.equal(card.querySelector('use').getAttribute('href'),'./checklist-icons.svg#'+group.id);
    assert(sprite.getElementById(group.id));
  });
  assert(!form().querySelector('.pre-drive details,.pre-drive summary,[data-inspection-count]'));
  click('[data-inspection="engine-oil-level"]');assert(find('[data-inspection="engine-oil-level"]').checked);
  find('[data-inspection-comment="engine"]').value='<با توضیح>';
  assert.equal(form().elements.preDriveNote,undefined);
  assert.equal(controls.previousElementSibling.id,'assessmentStop');assert.equal(controls.nextElementSibling.id,'dayFormExcel');
  form().elements.startTime.value='۰۸:۳۰';form().elements.startKm.value='120';
  await save();assert(stored);assert.match(id('bamco-live-state').textContent,/پیش‌نویس/);
  assert.equal(stored.missions['drive:1'].preDrive.reviewed['engine-oil-level'],true);
  assert.equal(stored.mileage.drive[1],undefined);assert.equal(stored.missions['drive:1'].dailyInfoSavedAt,undefined);
  app.open(stored,()=>{},false);enter();assert(find('[data-inspection="engine-oil-level"]').checked);
  assert.equal(form().elements.startTime.value,'۰۸:۳۰');assert.equal(form().elements.endKm.value,'');
  assert.equal(find('[data-inspection-comment="engine"]').value,'<با توضیح>');
  assert.equal(stored.missions['drive:1'].preDrive.note,'یادداشت قدیمی');
  async function exportBook(){
    const next=new Promise(resolve=>{app.exportFile=(blob,name)=>{const reader=new w.FileReader();reader.onload=()=>resolve({bytes:Buffer.from(reader.result),name});reader.readAsArrayBuffer(blob)}});
    const before=writes;click('#dayFormExcel');const {bytes,name}=await next;assert.equal(writes,before);
    const book=new Excel.Workbook();await book.xlsx.load(bytes);return {book,name,bytes};
  }
  form().elements.driver.value='Driver A';form().elements.endKm.value='130';form().elements.endTime.value='۱۰:۰۰';
  form().elements.temperature.value='0';form().elements.weather.value='آفتابی';form().elements.date.value='۱۴۰۵/۰۸/۲۳';
  const {book,name}=await exportBook();assert.equal(name,'Case A-driveability-day-1-daily-form.xlsx');
  const [report,list]=book.worksheets;assert.equal(report.name,'فرم روزانه');assert.equal(list.name,'چک‌لیست پیش از پیمایش');
  assert.equal(report.getCell('A1').value,'Case A | قابلیت رانندگی | روز 1 | ۱۴۰۵/۰۸/۲۳');
  for(const ws of book.worksheets){
    assert(ws.views[0].rightToLeft);assert.equal(ws.views[0].ySplit,2);assert(ws.getTables()[0].model.tableRef.startsWith('A2:'));
    assert.equal(ws.getCell('B2').fill.fgColor.argb,'FF216C56');assert.equal(ws.getCell('B3').font.name,'B Nazanin');
    assert.equal(ws.getCell('B3').border.bottom.style,'thin');
  }
  let serial=1;
  for (const group of w.BAMCO_PRE_DRIVE) {
    for (const item of group.items) {
      const row=list.getRow(serial+2);
      assert.equal(row.getCell(1).value,serial++);
      assert.equal(row.getCell(2).value,group.title);
      assert.equal(row.getCell(3).value,item.title);
    }
  }
  assert.equal(list.rowCount,73);assert.equal(list.getCell('E3').value,'<با توضیح>');
  assert.match(list.getCell('D3').value,/✓/);assert.match(list.getCell('D4').value,/×/);
  assert.notEqual(list.getCell('A3').fill.fgColor.argb,list.getCell('A13').fill.fgColor.argb);
  const values=Object.fromEntries(report.getRows(3,report.rowCount-2).map(r=>[r.getCell(3).value,r.getCell(4).value]));
  assert(!Object.hasOwn(values,'توضیحات کلی چک‌لیست'));assert.equal(values['کیلومتر طی‌شده'],10);assert.equal(values['دمای هوا (درجه سانتی‌گراد)'],0);
  confirmed=false;await save();assert.match(id('bamco-live-state').textContent,/تأیید نشد/);
  confirmed=true;await save();assert.equal(stored.missions['drive:1'].dailyFormDraft,undefined);assert.equal(stored.mileage.drive[1],10);assert.equal(stored.missions['drive:1'].driver,'Driver A');
  click('[data-inspection="engine-oil-level"]');find('[data-inspection-comment="engine"]').value='';await save();
  assert.equal(stored.missions['drive:1'].preDrive.reviewed['engine-oil-level'],undefined);
  assert.equal(stored.missions['drive:1'].preDrive.comments.engine,undefined);
  app.open(stored,()=>{},false);enter('drive',2);assert.equal(form().elements.preDriveNote,undefined);assert.equal(d.querySelectorAll('[data-inspection]:checked').length,0);
  app.open(stored,()=>{},true);enter('durability');assert(controls.hidden);assert(find('[data-inspection]').disabled);assert(!id('dayFormExcel').hidden);
  assert.equal((await exportBook()).name,'Case A-durability-day-1-daily-form.xlsx');
  click('#assessmentTabActions button');assert(id('dayFormExcel').hidden);assert(controls.hidden);
  assert.deepEqual(errors,[]);w.close();
  process.stdout.write('PASS daily form: 71 items, draft/full saves, comments, reopen, read-only, isolation, toolbar and styled Excel.\n');
})().catch(error=>{console.error(error);process.exit(1)});
