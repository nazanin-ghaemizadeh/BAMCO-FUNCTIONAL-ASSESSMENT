const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const reference=JSON.parse(fs.readFileSync('tests/fixtures/drive-reference.json'));
const dom=new JSDOM(fs.readFileSync('case.html','utf8'),{url:'https://preview.example',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}),w=dom.window,d=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;
for(const f of ['data.js','drive-reference.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','report-charts.js','workbook-metadata.js','report-model.js','app.js'])w.eval(fs.readFileSync(f,'utf8'));
const api=w.BAMCO_ASSESSMENT,record={'drive:1:CR-0443':{score:9,note:'Preserve existing record'}};
const click=s=>{require('./navigation.cjs')(d,s);assert(d.querySelector(s),s);d.querySelector(s).click()};
for(const gear of ['Manual','Automatic']){
 api.open({setupComplete:true,config:{vclass:'M1',body:'Pickup',power:'ICE',gear,driveType:'4WD',twoDiff:'yes'},records:record},()=>assert.fail('Viewing the schedule must not save'),false);
 click('[data-open="drive"]');
 assert.equal(d.querySelectorAll('[data-day]').length,26);
 const eligible=new Map(api.eligibleTests('drive').map(t=>[t.sourceId,t]));
 for(const r of reference){
  const p=api.drivePlan().find(p=>p.day===r.day);
  assert.equal(p.route,r.route);assert.equal(p.km,r.km);assert.equal(p.cum,r.cum);
  assert.deepEqual(Array.from(p.testIds),r.testIds);
  assert.equal(d.querySelector('[data-day="'+r.day+'"] .day-route-label').textContent,r.route);
  click('[data-day="'+r.day+'"]');
  const expected=r.testIds.filter(id=>eligible.has(id));
  assert.deepEqual([...d.querySelectorAll('[data-source-test]')].map(el=>el.dataset.sourceTest),expected);
  assert(d.querySelector('.drive-reference-summary').textContent.includes(r.route));
  click('[data-daysection="scores"]');
  assert.deepEqual(Array.from(api.currentTests(),t=>t.sourceId),expected);
  assert.deepEqual(Array.from(api.currentTests(),t=>t.id),expected.map(id=>eligible.get(id).id));
  click('#assessmentTabActions button');click('#assessmentTabActions button');
 }
 assert.equal(api.snapshot().records['drive:1:CR-0443'].score,9);
}
w.close();console.log('PASS Drive Reference: exact route, km, cumulative distance and ordered vehicle-filtered tests for all 26 days, Manual and Automatic; existing records preserved.');
