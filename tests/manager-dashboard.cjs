const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom'),ExcelJS=require('exceljs');
const root='manager-reference/';
const snapshot={config:{gear:'Automatic'},records:{'comprehensive:general:CR-1':{score:7,note:'observation'},'drive:1:CR-1':{score:10}}};
let saved,settings={};
function open(){
 const dom=new JSDOM(fs.readFileSync(root+'manager.html','utf8'),{url:'https://qa.example/manager-reference/manager.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.ExcelJS=ExcelJS;w.alert=message=>{throw Error(message)};w.scrollTo=()=>{};w.ResizeObserver=class{observe(){} disconnect(){}};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 const payload={snapshot,tests:[{id:'CR-1',cat:'ایمنی',sub:'ترمز',name:'بررسی',measure:'روش',profile:'شرایط'}],categories:['ایمنی'],case:{id:'a',title:'Test vehicle'},settings,readOnly:false};
 Object.defineProperty(w,'parent',{value:{BAMCO_MANAGER:{data:()=>payload,store:storage=>{saved=storage;settings={storage}},save:async()=>true,close:()=>{}},document:w.document}});
 for(const file of ['bridge.js','scripts-2.js','scripts-3.js','scripts-4.js','scripts-5.js','scripts-6.js','scripts-7-base.js','scripts-8.js','scripts-9.js','scripts-10.js','scripts-11.js','integration.js','ai-review.js'])require('node:vm').runInContext(fs.readFileSync(root+file,'utf8'),dom.getInternalVMContext());
 return dom;
}
(async()=>{
 let dom=open(),w=dom.window,d=w.document;
 assert.equal(d.getElementById('finalScore').textContent,'۷۰.۰۰');
 assert(!d.getElementById('managerVehiclePhotos'));
 assert(!d.getElementById('entryScreen').hidden===false);
 require('node:vm').runInContext("managerWeightState.activeSource='qa.xlsx';persistManager();persist()",dom.getInternalVMContext());
 assert.equal(JSON.parse(saved['bamco-vehicle-assessment']).scores['1/ترمز/CR-1'],7);
 assert.equal(Object.keys(JSON.parse(saved['bamco-vehicle-assessment']).scores).length,1);
 dom.window.close();dom=open();w=dom.window;d=w.document;
 assert.equal(JSON.parse(saved['bamco-manager-weight-control']).activeSource,'qa.xlsx');
 assert(d.getElementById('managerComparisonCard'));assert(d.getElementById('aiTechnicalReview'));
 assert(d.getElementById('managerWeightPanel'));assert(d.getElementById('radarChart'));
 d.getElementById('openComparisonMode').click();d.getElementById('applyComparisonCount').click();
 const input=d.querySelector('[data-comparison-file]');
 const file=new w.File([JSON.stringify({title:'Second vehicle',snapshot:{...snapshot,records:{'comprehensive:general:CR-1':{score:9}}}})],'compare.json',{type:'application/json'});
 // The production file format can also wrap its snapshot.
 const file2=new w.File([JSON.stringify({title:'Second vehicle',...snapshot,records:{'comprehensive:general:CR-1':{score:9}}})],'compare.json',{type:'application/json'});
 Object.defineProperty(input,'files',{value:[file2]});input.dispatchEvent(new w.Event('change',{bubbles:true}));
 for(let i=0;i<40&&!d.querySelector('.comparisonUploadSlot.loaded');i++)await new Promise(resolve=>setTimeout(resolve,50));
 assert(d.querySelector('.comparisonUploadSlot.loaded'));
 assert(d.querySelector('#managerComparisonCard').textContent.includes('Second vehicle'));
 const sheets=[];w.ExcelJS={Workbook:class extends ExcelJS.Workbook{addWorksheet(name,options){sheets.push(name);return super.addWorksheet(name,options)}}};w.URL.createObjectURL=()=>'';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 await w.exportManagerDashboard();
 assert(sheets.length>=2);assert(!sheets.some(s=>/چهار|vehicle views|نظرات|Final Comments/i.test(s)));
 dom.window.close();console.log('PASS manager dashboard: comprehensive-only scores, original dashboard sections, stored weights, reopen, styled Excel and no four-view sheet.');
})().catch(e=>{console.error(e);process.exit(1)});
