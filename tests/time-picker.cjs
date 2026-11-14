const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert');
const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}).window,d=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;w.fetch=async()=>{throw Error('offline')};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
for(const f of ['data.js','durability-planner.js','legacy-planner.js','route-map.js','review-contract.js','app.js','polish.js','day-workflow.js'])w.eval(fs.readFileSync(f,'utf8'));
const style=d.createElement('style');style.textContent=fs.readFileSync('day-workflow.css','utf8');d.head.append(style);
const api=w.BAMCO_ASSESSMENT,click=s=>{assert(d.querySelector(s),s);d.querySelector(s).click()};
api.open({setupComplete:true},()=>{},false);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="form"]');
const form=d.getElementById('bamco-day-form');assert(form);
for(const [name,h,m,p,expected] of [['startTime','12','0','am','۰۰:۰۰'],['endTime','12','5','pm','۱۲:۰۵'],['breakdownTime','11','59','pm','۲۳:۵۹']]){
 const field=form.elements[name];assert(field.readOnly);field.click();const picker=d.querySelector('#bamco-time-picker form');assert(picker);assert.equal(w.getComputedStyle(picker.elements.hour).opacity,'0');assert.equal(w.getComputedStyle(picker.elements.hour).position,'absolute');assert.equal(picker.querySelectorAll('.vehicle-dropdown-trigger').length,3);assert.equal(picker.elements.minute.options.length,61);
 for(const [key,value] of [['hour',h],['minute',m],['period',p]]){const select=picker.elements[key];select.nextElementSibling.click();select.parentElement.querySelector('[data-value="'+value+'"]').click();assert.equal(select.value,value)}picker.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(field.value,expected);assert(!d.getElementById('bamco-time-picker'));
 field.click();assert.equal(d.querySelector('#bamco-time-picker [name="hour"]').value,h);click('[data-time-cancel]');assert.equal(field.value,expected);
}
form.elements.startKm.value='100';form.elements.endKm.value='110';form.elements.driver.value='Driver';form.elements.temperature.value='20';form.elements.weather.value='آفتابی';
form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));assert.equal(api.mission('drive:1').startTime,'۰۰:۰۰');assert.equal(api.mission('drive:1').endTime,'۱۲:۰۵');
click('[data-daysection="scores"]');click('[data-daysection="form"]');assert.equal(d.querySelector('[name="startTime"]').value,'۰۰:۰۰');
api.open(api.snapshot(),()=>{},true);click('[data-open="drive"]');click('[data-day="1"]');click('[data-daysection="form"]');assert(d.querySelector('[name="startTime"]').disabled);
w.close();console.log('PASS time picker: AM/PM boundaries, all minutes, cancel, existing values, save/reopen and read-only.');
