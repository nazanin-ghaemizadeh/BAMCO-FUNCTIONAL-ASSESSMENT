const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),assert=require('assert');
(async()=>{
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync('./case.html','utf8'),{url:'https://preview.example',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.structuredClone=structuredClone;w.fetch=async()=>{throw Error('offline test')};
for(const f of ['data.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','report-charts.js','workbook-metadata.js','report-model.js','app.js','dropdowns.js','polish.js','pre-drive-checklist.js','day-workflow.js','report-ui.js'])w.eval(fs.readFileSync('./'+f,'utf8'));
const api=w.BAMCO_ASSESSMENT;let saved;
const click=s=>{require('./navigation.cjs')(d,s);if(s==='[data-open="results"]'&&d.getElementById('assessmentDashboard'))return;assert(d.querySelector(s),s);d.querySelector(s).click()},set=(id,v)=>{d.getElementById(id).value=v;d.getElementById(id).dispatchEvent(new w.Event('change',{bubbles:true}))},submit=id=>d.getElementById(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
api.open({setupComplete:false},v=>saved=structuredClone(v),false);d.querySelector('[data-open="setup"]').click();
assert.equal(d.getElementById('driveKm').value,'۶۹۳۰');assert(d.getElementById('driveKm').readOnly);
set('twoDiff','yes');set('driveType','4WD');set('body','Pickup');set('gear','Manual');set('share-urban','20');set('share-hot','20');submit('vehicleForm');assert(saved);assert.equal(saved.durabilitySchedule.length,saved.config.durDays);
assert.equal(api.drivePlan().reduce((s,p)=>s+p.km,0),6930);assert.equal(api.drivePlan().length,26);
assert(api.eligibleTests('drive').every(t=>t.vehicle.gear.includes('Manual')));
assert(!api.eligibleTests('drive').some(t=>t.sourceId==='T6.11.36'));
// Case navigation follows the same hierarchy for every assessment type.
assert.deepEqual([...d.querySelectorAll('#moduleLanding [data-open]')].map(el=>el.dataset.open),['setup','assessmentTypes','results']);
click('[data-open="assessmentTypes"]');
assert.equal(d.querySelectorAll('#moduleLanding [data-open]').length,4);
for(const mode of ['drive','durability','supplementary','comprehensive']){
 click('[data-open="'+mode+'Menu"]');
 assert(d.querySelector('#moduleLanding [data-open="'+mode+'"]'));
 assert(d.querySelector('#moduleLanding [data-module-dashboard="'+mode+'"]'));
 assert.equal(d.getElementById('backModulesBtn').dataset.open,'assessmentTypes');
 click('#backModulesBtn');
}
click('#backModulesBtn');
const initial=structuredClone(saved);api.open(initial,v=>saved=structuredClone(v),false);click('[data-open="setup"]');assert.equal(d.getElementById('share-urban').value,'۲۰');submit('vehicleForm');api.open({...initial,records:{'durability:1:CR-0002':{score:8,note:'HISTORY'}}},v=>saved=structuredClone(v),false);
api.setMission('durability:1',{driver:'UNCHANGED',dailyInfoSavedAt:'test'});api.setDayMileage('durability',1,100);
const before=structuredClone(saved),planBefore=structuredClone(api.durabilityPlan());
click('[data-open="durability"]');click('[data-day="2"]');click('[data-daysection="route"]');assert(d.getElementById('routeDestination').options.length);
set('routeDistance','50');submit('routeEditor');
assert.deepEqual(saved.missions,before.missions);assert.deepEqual(saved.mileage,before.mileage);assert.deepEqual(saved.records,before.records);assert.deepEqual(saved.durabilitySchedule[0],planBefore[0]);assert.equal(saved.durabilitySchedule[1].km,50);assert.notDeepEqual(saved.durabilitySchedule.slice(2),planBefore.slice(2));
const after=structuredClone(saved);api.open(after,v=>saved=structuredClone(v),false);assert.deepEqual(JSON.parse(JSON.stringify(api.durabilityPlan())),after.durabilitySchedule);
click('[data-open="durability"]');click('[data-day="1"]');click('[data-daysection="route"]');assert(d.querySelector('#routeEditor fieldset').disabled);assert([...d.querySelectorAll('#routeEditor .vehicle-dropdown-trigger')].every(b=>b.disabled));
api.open(initial,v=>saved=structuredClone(v),false);click('[data-open="supplementary"]');
const f=d.getElementById('staticTestForm');f.elements.name.value='USER TEST';f.elements.sub.value='USER SUB';f.elements.profile.value='USER METHOD';f.elements.measure.value='USER EVIDENCE';submit('staticTestForm');assert(api.eligibleTests('supplementary').some(t=>t.name==='USER TEST'));
const custom=api.eligibleTests('supplementary').find(t=>t.name==='USER TEST');set('questionSearch','USER TEST');d.getElementById('questionSearch').dispatchEvent(new w.Event('input',{bubbles:true}));click('[data-test="'+custom.id+'"][data-score="8"]');await api.saveDraft();assert.equal(saved.records['supplementary:general:'+custom.id].score,8);
api.open(saved,v=>saved=structuredClone(v),false);assert(api.eligibleTests('supplementary').some(t=>t.id===custom.id));
const legacy={setupComplete:true,config:{durabilityPlannerVersion:1,durKm:45000,durDays:107,twoDiff:'yes'},records:{'durability:1:CR-0002':{score:9}},missions:{'durability:1':{driver:'KEEP'}},mileage:{drive:{},durability:{1:250}}};
api.open(legacy,v=>saved=structuredClone(v),false);const old=JSON.stringify(api.durabilityPlan());click('[data-open="setup"]');submit('vehicleForm');assert.equal(JSON.stringify(api.durabilityPlan()),old);assert.equal(saved.records['durability:1:CR-0002'].score,9);
// Edit an assessment with mileage, scores and notes, then close and reopen the confirmed snapshot.
const started=structuredClone(after);
started.records['durability:1:CR-0241@urban-4']={score:6,note:'Historic checkpoint'};
started.records['drive:1:CR-0443']={score:9,note:'Manual gearbox'};
let server=structuredClone(started),online=false;
const editSaved=()=>{api.open(structuredClone(server),()=>assert.fail('Explicit setup save expected'),false);click('[data-open="setup"]')};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
w.BAMCO_CASES={current:()=>({id:'active'}),saveNow:async snapshot=>{
 if(online)server=structuredClone(snapshot);
 return online;
}};
editSaved();
set('gear','Automatic');set('twoDiff','no');set('driveType','FWD');
set('durKm','۱۰۰۰');set('cap-urban','۴۰');set('startCity','قم');
submit('vehicleForm');await tick();
assert.deepEqual(server,started);assert.match(d.getElementById('toast').textContent,/تأیید نشد/);
assert(!d.getElementById('setupPanel').classList.contains('hidden'));
online=true;submit('vehicleForm');await tick();
assert(!d.getElementById('moduleLanding').classList.contains('hidden'));assert.equal(server.config.durKm,1000);
assert.equal(server.config.routeCaps.urban,40);assert.equal(server.config.routeShares.offroad,0);assert.equal(server.config.gear,'Automatic');
assert.deepEqual(server.durabilitySchedule[0],started.durabilitySchedule[0]);assert.equal(server.durabilitySchedule[1].origin,'قم');
assert.equal(server.durabilitySchedule.slice(1).reduce((n,day)=>n+day.km,100),1000);
assert.deepEqual(server.records,started.records);assert.deepEqual(server.mileage,started.mileage);assert.deepEqual(server.missions,started.missions);
assert.deepEqual(server.checkpointAssignments[1].map(c=>c.quarter),[1]);
api.open(structuredClone(server),()=>{},false);click('[data-open="durability"]');click('[data-day="1"]');click('[data-daysection="scores"]');
assert(api.currentTests().some(t=>t.id==='CR-0241@urban-1'));assert(!api.currentTests().some(t=>t.id==='CR-0241@urban-4'));
api.open(structuredClone(server),()=>{},false);click('[data-open="drive"]');
for(const day of api.drivePlan()){
 const tile=d.querySelector('[data-day="'+day.day+'"]');
 assert.equal(tile.querySelector('.drive-card-category').textContent,day.type);
 assert.equal(tile.querySelector('.day-route-label').textContent,day.route);
 if(day.stage===3)assert.equal(day.type,'گرمسیری');
}
click('[data-day="1"]');click('[data-daysection="scores"]');
assert(!api.currentTests().some(t=>t.id==='CR-0443'));assert(api.currentTests().some(t=>t.id==='CR-0447'));
editSaved();set('gear','Manual');set('body','Station Wagon');set('durKm','۵۰۰۰');set('share-urban','15');set('share-rural','50');
submit('vehicleForm');await tick();assert.equal(server.config.routeShares.urban,15);
assert.deepEqual(server.checkpointAssignments[1],[]);assert.deepEqual(server.records,started.records);
click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="scores"]');
assert(d.querySelector('[data-test="CR-0443"][data-score="9"].selected'));assert.equal(d.querySelector('[data-note="CR-0443"]').value,'Manual gearbox');
delete w.BAMCO_CASES;
// Changing origin/type must rebuild the same dropdown component, without saving a route.
api.open(initial,v=>saved=structuredClone(v),false);click('[data-open="durability"]');click('[data-day="2"]');click('[data-daysection="route"]');
const persisted=JSON.stringify(saved);set('routeOrigin','قم');set('routeKind','rural');
const destination=d.getElementById('routeDestination'),menu=()=>destination.nextElementSibling.nextElementSibling;
assert.deepEqual([...menu().querySelectorAll('[data-value]')].map(x=>x.textContent),[...destination.options].map(x=>x.textContent));
assert(destination.options.length>1);destination.nextElementSibling.click();const chosen=menu().querySelectorAll('[data-value]')[1],chosenValue=chosen.dataset.value,chosenText=chosen.textContent;chosen.click();assert.equal(destination.value,chosenValue);assert.equal(destination.nextElementSibling.firstElementChild.textContent,chosenText);assert(menu().hidden);assert.equal(JSON.stringify(saved),persisted);
set('routeKind','urban');assert.equal(destination.options.length,0);assert(destination.nextElementSibling.disabled);assert.equal(menu().children.length,0);
// The vehicle-wide bank is a single list with independent records, filtered only by the vehicle.
const surveySource=structuredClone(initial);
surveySource.records={'drive:1:CR-0443':{score:4}};
const surveyOpen=(source,locked=false)=>{
 api.open(structuredClone(source),v=>saved=structuredClone(v),locked);
 click('[data-open="comprehensive"]');
};
surveyOpen(surveySource);
assert.equal(d.querySelectorAll('#questionsPanel .question').length,12);
assert(d.querySelector('#questionsPanel [data-pagejump]'));
assert.equal(api.scoreContext().key,'comprehensive:general');
const search=d.getElementById('questionSearch');search.value='CR-0443';search.dispatchEvent(new w.Event('input',{bubbles:true}));
click('[data-test="CR-0443"][data-score="9"]');
await api.saveDraft();assert.equal(saved.records['comprehensive:general:CR-0443'].score,9);assert.equal(saved.records['drive:1:CR-0443'].score,4);
assert.deepEqual(saved.mileage,surveySource.mileage);
assert.deepEqual(errors,[]);console.log('PASS app: setup, final drive program, Excel vehicle filters, route editing with frozen history, database snapshot reopen, actual/preview separation, custom static test scoring, legacy preservation.');dom.window.close();

})().catch(error=>{console.error(error);process.exitCode=1});
