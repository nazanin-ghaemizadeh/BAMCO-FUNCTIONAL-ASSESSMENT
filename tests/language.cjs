const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),assert=require('assert');
(async()=>{const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>errors.push(e.message));const w=new JSDOM(fs.readFileSync('./index.html','utf8'),{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.fetch=async()=>{throw Error('دریافت مسیر ممکن نشد.')};
for(const f of ['translations-en.js','translations-zh.js','planning-translations.js','dashboard-translations.js','i18n.js','data.js','durability-planner.js','legacy-planner.js','route-map.js','workbook-metadata.js','report-model.js','app.js','polish.js','day-workflow.js','report-ui.js'])w.eval(fs.readFileSync('./'+f,'utf8'));
const api=w.BAMCO_ASSESSMENT,tick=()=>new Promise(r=>setTimeout(r,10)),click=s=>{assert(d.querySelector(s),s);d.querySelector(s).click()},residuals=[];
function check(screen){w.BAMCO_I18N.apply();const walker=d.createTreeWalker(d.body,4);let n;while(n=walker.nextNode())if(n.parentElement&&!n.parentElement.closest('.hidden,script,style,textarea,input,[hidden]')&&/[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/.test(n.nodeValue))residuals.push({screen,text:n.nodeValue});}
for(const lang of ['en','zh']){
api.open({setupComplete:false},()=>{},false);w.BAMCO_I18N.setLanguage(lang);await tick();check(lang+' setup');d.getElementById('vehicleForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
for(const tab of ['drive','durability']){click('[data-open="'+tab+'"]');await tick();check(lang+' calendar');click('[data-day="1"]');click('[data-daysection="route"]');await tick();check(lang+' route');api.open(api.snapshot(),()=>{},false);}
click('[data-open="supplementary"]');await tick();check(lang+' supplementary');assert.equal(d.documentElement.dir,'ltr');
}
assert.deepEqual(residuals,[]);console.log('PASS English and Chinese interface, route controls, static tests and LTR.');assert.deepEqual(errors,[]);w.close();})();
