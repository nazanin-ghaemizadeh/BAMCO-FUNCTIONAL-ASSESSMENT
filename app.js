
(function(){
'use strict';
const DB=window.BAMCO_DATA;
const KEY='bamco-functional-assessment-v1';
const scoreWords=['','غیرقابل قبول','بحرانی','بسیار ضعیف','ضعیف','حداقل پذیرش','مرزی','قابل قبول','رضایت‌بخش','بسیار عالی','ممتاز'];
const planner=window.BAMCO_DURABILITY_PLANNER;
const defaultConfig={vclass:'M1',body:'Sedan',power:'ICE',gear:'Automatic',driveType:'FWD',twoDiff:'no',driveKm:6930,durKm:5000,durDays:20,startOdo:5000,durabilityPlannerVersion:2};
const setupKeys=['vclass','body','power','gear','driveType','twoDiff','driveKm','durKm'];
function normalizeConfig(config={},complete=false){
 const result={...defaultConfig,...config,driveKm:6930,routeCaps:{...config.routeCaps}};
 if(config.twoDiff===undefined)result.twoDiff=['AWD','4WD'].includes(result.driveType)?'yes':'no';
 if(complete&&config.durDays!==undefined&&!config.durabilityPlannerVersion)result.durabilityPlannerVersion=0;
 return result;
}
function twoDifferentials(){return conf().twoDiff==='yes'}
const state={config:{...defaultConfig},tab:'setup',driveDay:1,durDay:1,category:'همه',query:'',page:0,records:{},mileage:{drive:{},durability:{}},setupComplete:false};
function sourceFields(t){return {load:(window.BAMCO_WORKBOOK?.tests[t.sourceId]?.loads||t.loadConditions||[]).join(" / ")}}
const categories=[...new Set(DB.tests.map(x=>x.cat))];
const testById=new Map(DB.tests.map(x=>[x.id,x]));
const lookupTest=testById.get.bind(testById);testById.get=id=>lookupTest(id)||lookupTest(String(id).split('@')[0])||staticCustomTests().find(t=>t.id===id);
const byId=id=>document.getElementById(id);
const num=v=>Number(typeof v==='string'?v.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,]/g,'').replace('٫','.'):v);
const numberFormats={fa:new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}),en:new Intl.NumberFormat('en-US',{maximumFractionDigits:3})};
const number=n=>numberFormats[window.BAMCO_I18N?.language==='fa'||!window.BAMCO_I18N?'fa':'en'].format(num(n||0)).replace(/٫/g,'.').replace(/٬/g,',');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه');
let cloudSave, readOnly = false, dayScreen = 'days';
function snapshot(){return {config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete,missions:state.missions||{},durabilitySchedule:state.durabilitySchedule,checkpointAssignments:state.checkpointAssignments||{}}}
function save(data=snapshot()){if(readOnly)return false;if(cloudSave){cloudSave(data);return true}try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(e){toast('حافظه مرورگر پر شده است؛ نسخه پشتیبان بگیرید.');return false}}
// Only the active editing screen owns these changes. Navigation drops the overlay.
let draft = null, caseGeneration = 0;
function scoreContext(){
 if(['comprehensive','supplementary'].includes(state.tab))return {tab:state.tab,key:state.tab+':general',section:'scores'};
 return dayContext();
}
function syncDraft(){
 const c=scoreContext();
 const key=c?.section==='scores'?c.key:state.tab==='comprehensiveDashboard'?state.tab:
   state.tab==='results'?'results:'+dashboardModule:null;
 if(key!==(draft?.key??null))draft=key?{key,records:{},missions:{},version:0,pictures:new Set()}:null;
}
function mission(key){return draft?.missions[key]??state.missions?.[key]??{}}
function workingSnapshot(){
 const data=snapshot();
 return draft?{...data,records:{...data.records,...draft.records},missions:{...data.missions,...draft.missions}}:data;
}
function edit(group,key,value){
 if(draft){
  draft[group][key]=value;
  draft.version++;
  document.dispatchEvent(new Event('bamco:draft-change'));
 }else{
  state[group][key]=value;
  save();
 }
}
async function saveDraft(){
 const page=draft;
 if(!page||readOnly)return false;
 const original=snapshot(),submitted=workingSnapshot();
 const changes={records:page.records,missions:page.missions};
 // Subsequent submissions must include the edits already submitted, while later typing stays staged.
 for(const group of ['records','missions']){
  state[group]=submitted[group];
  page[group]={};
 }
 const generation=caseGeneration;
 let ok=false;
 try{ok=window.BAMCO_CASES?.saveNow?await window.BAMCO_CASES.saveNow(submitted):save(submitted)}
 finally{
  if(!ok&&generation===caseGeneration){
   for(const group of ['records','missions']){
    for(const [key,value] of Object.entries(changes[group])){
     if(state[group][key]!==value)continue;
     if(draft===page&&!Object.hasOwn(page[group],key))page[group][key]=value;
     if(Object.hasOwn(original[group],key))state[group][key]=original[group][key];
     else delete state[group][key];
    }
   }
  }
 }
 return ok;
}
let tm;function toast(s){const t=byId('toast');t.textContent=s;t.classList.remove('hidden');clearTimeout(tm);tm=setTimeout(()=>t.classList.add('hidden'),3200)}
function conf(){return state.config}
function parts(s){return String(s||'').split(/\s*\/\s*|\s*\|\s*/).map(x=>x.trim()).filter(Boolean)}
function allowed(rule,value){if(Array.isArray(rule))return rule.includes(String(value));if(rule==='None')return false;if(!rule||rule==='All')return true;return parts(rule).includes(String(value))}
function applicable(t){const v=t.vehicle||{},c=conf();return allowed(v.cls,c.vclass)&&allowed(v.body,c.body==='Station Wagon'?'Station':c.body)&&allowed(v.power,c.power)&&allowed(v.gear,c.gear)&&allowed(v.drive,c.driveType)}
function staticCustomTests(){return (mission('supplementary:general').customTests||[]).map(t=>({...t,scope:['supplementary']}))}
function candidates(tab){
 const all=tab==='comprehensive';
 const bank=all||tab==='supplementary'?[...DB.tests,...staticCustomTests()]:DB.tests;
 return bank.filter(t=>(all||t.scope.includes(tab))&&applicable(t));
}
function plannerConfig(c=conf()){return {target:num(c.durKm),twoDiff:c.twoDiff,caps:c.routeCaps,startOdo:num(c.startOdo),shares:c.routeShares,origin:c.startCity||'تهران',catalog:DB.roadCatalog}}
function targetRows(){return planner.calculate(plannerConfig()).rows}

function activeRoutes(){const a=DB.routes.filter(r=>(conf().body==='Off-road'||conf().driveType==='4WD')||(!/خارج.?جاده|خاکی/i.test(r.name)));const total=a.reduce((v,x)=>v+Math.max(0,x.durShare),0);return a.map(x=>({...x,share:x.durShare/total}))}
function dayCategoryPlan(){
 if(state.durabilitySchedule)return state.durabilitySchedule;
 const version=conf().durabilityPlannerVersion;
 const plan=version===2?planner.calculate(plannerConfig()).schedule:
   version===1?window.BAMCO_LEGACY_PLANNER.calculate(plannerConfig()).schedule:legacyDayCategoryPlan();
 if(!state.setupComplete)return plan;
 state.durabilitySchedule=plan.map(p=>({...p,routeId:p.routeId||dayRouteAppearance(p).kind}));
 state.config.durDays=plan.length;
 return state.durabilitySchedule;
}
function legacyDayCategoryPlan(){
const n=Math.max(1,Math.min(365,num(conf().durDays)||90)),totalKm=Math.max(100,num(conf().durKm)||45000),routes=activeRoutes();
const raw=routes.map(r=>n*r.share),counts=raw.map(Math.floor),left=n-counts.reduce((a,b)=>a+b,0);
const order=raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac);
for(let j=0;j<left;j++)counts[order[j%order.length].i]++;
const used=counts.map(()=>0),picked=[];
for(let d=1;d<=n;d++){let chosen=-1,best=-Infinity;for(let i=0;i<routes.length;i++){if(used[i]>=counts[i])continue;const v=d*counts[i]/n-used[i];if(v>best){best=v;chosen=i}}if(chosen<0)chosen=0;used[chosen]++;picked.push(chosen)}
const alloc=counts.map((count,i)=>count?Math.max(0,Math.round(totalKm*routes[i].share)):0),assigned=alloc.reduce((a,b)=>a+b,0);
if(alloc.length)alloc[alloc.length-1]+=totalKm-assigned;
const countLeft=counts.slice(),kmLeft=alloc.slice(),out=[];let sum=0;
for(let d=1;d<=n;d++){const i=picked[d-1];const km=countLeft[i]>1?Math.max(0,Math.floor(kmLeft[i]/countLeft[i])):kmLeft[i];countLeft[i]--;kmLeft[i]-=km;sum+=km;const r=routes[i];out.push({day:d,type:r.name,route:r.suggest||r.name,km,cum:sum,odo:num(conf().startOdo)+sum,cap:r.cap,over:km>r.cap});}
return out
}
function driveProgram(){let cum=0;return DB.driveDays.map(p=>({...p,cum:cum+=p.km}))}
function dayCheckpoints(day,plan,actualOnly=false){
 if(state.checkpointAssignments?.[day])return state.checkpointAssignments[day];
 const mileage={...state.mileage.durability};
 if(!actualOnly)for(const p of plan)if(p.day<=day&&!Object.hasOwn(mileage,p.day))mileage[p.day]=p.km;
 return planner.checkpoints(plan,mileage,targetRows(),day);
}
function checksOnPlan(plan){return new Map(plan.map(p=>[p.day,dayCheckpoints(p.day,plan).map(c=>c.percent)]))}
function durabilityTestsForDay(day,plan){
 const checks=dayCheckpoints(day,plan,Object.hasOwn(state.mileage.durability,day)),items=[];
 for(const c of checks)for(const t of candidates('durability'))if(t.routeIds?.length?t.routeIds.includes(c.routeId):t.stationary){
  const name=planner.routes.find(r=>r.id===c.routeId)?.name||c.routeId;
  const clone={...t,id:t.id+'@'+c.routeId+'-'+c.quarter,baseId:t.id,checkpoint:c,name:t.name+' · '+c.percent+'٪ · '+name+' · '+(t.stationary?'حین توقف':'حین حرکت')};
  testById.set(clone.id,clone);items.push(clone);
 }
 // Older assessments used plain test IDs before route-specific checkpoints existed.
 const prefix='durability:'+day+':';
 for(const [key,record] of Object.entries(state.records)){
  if(!key.startsWith(prefix)||!(record.score||record.note||record.photo))continue;
  const id=key.slice(prefix.length),test=lookupTest(id);
  if(test&&applicable(test)&&!items.some(item=>item.id===id))items.push(test);
 }
 return items;
}

function currentDay(){return state.tab==='drive'?state.driveDay:state.durDay}
function scope(){return state.tab}
function dayItems(){
if(['comprehensive','supplementary'].includes(state.tab))return candidates(state.tab);
if(state.tab==='drive'){
 const day=DB.driveDays.find(p=>p.day===state.driveDay);
 const eligible=new Map(candidates('drive').map(t=>[t.sourceId,t]));
 // Drive Reference owns the day and order; road flags belong to durability.
 return (day?.testIds||DB.tests.filter(t=>t.days.includes(state.driveDay)).map(t=>t.sourceId)).map(id=>eligible.get(id)).filter(Boolean);
}
return durabilityTestsForDay(state.durDay,dayCategoryPlan())
}
function updateDayMileage(tab, day, km) {
  state.mileage[tab] ??= {};
  state.mileage[tab][day] = km;
  if(tab !== 'durability') return;
  state.durabilitySchedule ??= dayCategoryPlan();
  state.checkpointAssignments ??= {};
  state.checkpointAssignments[day] = planner.checkpoints(dayCategoryPlan(),state.mileage.durability,targetRows(),day);
  const plan = dayCategoryPlan();
  const last = Math.max(day,lastRecordedDurabilityDay(plan));
  state.durabilitySchedule = planner.replan({plan,fromDay:last+1,rows:targetRows(),mileage:state.mileage.durability,startOdo:num(conf().startOdo),catalog:DB.roadCatalog});
  state.config.durDays = state.durabilitySchedule.length;
  state.config.durabilityPlannerVersion = 2;
}
function ratedKey(t){return state.tab+':'+(dayContext()?currentDay():'general')+':'+t.id}
function record(t){const key=ratedKey(t);return draft?.records[key]??state.records[key]??{}}
function avg(items){if(!items.length)return null;return items.reduce((a,b)=>a+b,0)/items.length}
function viewSummary(items){const scored=items.filter(t=>num(record(t).score)>0).length;return [items.length,scored]}
function readSetup(){
 const config={...conf(),durabilityPlannerVersion:2,routeCaps:{},routeShares:{},startCity:byId('startCity').value};
 for(const key of setupKeys){const el=byId(key);config[key]=['driveKm','durKm'].includes(key)?num(el.value):el.value}
 for(const route of planner.routes){config.routeCaps[route.id]=num(byId('cap-'+route.id).value);config.routeShares[route.id]=num(byId('share-'+route.id).value);}
 return config;
}
function planForSetup(config) {
 const plan=planner.calculate(plannerConfig(config));
 if(!state.setupComplete)return plan;
 const previous=dayCategoryPlan();
 const old=conf();
 const targetsChanged=num(old.durKm)!==plan.target||planner.routes.some(r=>
  num(old.routeShares?.[r.id]??r.weights[twoDifferentials()?1:0])!==config.routeShares[r.id]
 );
 const originChanged=config.startCity!==(old.startCity||'تهران');
 const routeSettingsChanged=targetsChanged||originChanged||planner.routes.some(r=>num(old.routeCaps?.[r.id]??r.cap)!==config.routeCaps[r.id]);
 let schedule=previous;
 if(routeSettingsChanged){
  const last=lastRecordedDurabilityDay(previous);
  schedule=last===0 ? plan.schedule : planner.replan({
   plan:previous.map(p=>p.routeId?p:{...p,routeId:dayRouteAppearance(p).kind}),
   fromDay:last+1, rows:plan.rows, mileage:state.mileage.durability,
   startOdo:num(config.startOdo), catalog:DB.roadCatalog,
   origin:originChanged?config.startCity:undefined
  });
 }
 // The setup preview and the saved plan use the same retained days and remaining routes.
 const byRoute=new Map(plan.rows.map(row=>{
  row.days=0;row.lastKm=0;
  return [row.id,row];
 }));
 for(const day of schedule){
  const row=byRoute.get(day.routeId||dayRouteAppearance(day).kind);
  if(row){row.days++;row.lastKm=day.km}
 }
 return {...plan,schedule,days:schedule.length,targetsChanged};
}
function updatePlannerPreview(){
 try{
  const config=readSetup(),plan=planForSetup(config);
  byId('durDays').value=number(plan.days);
  byId('durabilityPreview').innerHTML='<div class="planner-summary"><div class="planner-metric"><span>هدف پیمایش دوام</span><strong>'+number(plan.target)+' <small>کیلومتر</small></strong></div><div class="planner-metric"><span>مدت برنامه دوام</span><strong>'+number(plan.days)+' <small>روز</small></strong></div></div><div class="route-table-scroll"><table class="result-table"><thead><tr><th>نوع مسیر</th><th>سهم مسیر</th><th>کیلومتر تخصیصی</th><th>سقف روزانه</th><th>تعداد روزها</th><th>پیمایش روز آخر</th></tr></thead><tbody>'+plan.rows.map(row=>'<tr><th scope="row">'+esc(row.name)+'</th><td>'+number(row.weight)+'٪</td><td>'+number(row.km)+'</td><td>'+number(row.cap)+'</td><td>'+number(row.days)+'</td><td>'+number(row.lastKm)+'</td></tr>').join('')+'</tbody><tfoot><tr><th>جمع</th><td>۱۰۰٪</td><td>'+number(plan.target)+'</td><td>—</td><td>'+number(plan.days)+'</td><td>—</td></tr></tfoot></table></div>';
  byId('setupInfo').textContent='برنامه در چهار چرخه اجرا می‌شود؛ در هر چرخه یک‌چهارم سهم هر نوع مسیر پیمایش می‌شود.';
  return {config,plan};
 }catch(error){byId('durDays').value='—';byId('durabilityPreview').textContent=error.message;return null}
}
function renderSetup(){
 for(const key of setupKeys){const el=byId(key),value=conf()[key];el.value=el.dataset.numeric?(window.BAMCO_I18N?.formatDigits(String(value))??String(value).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])):value}
 byId('durabilityCaps').innerHTML='<div class="field start-city-field"><div class="start-city-illustration" aria-hidden="true"></div><label for="startCity">شهر شروع برنامه</label><select id="startCity">'+[...new Set(DB.roadCatalog.map(r=>r.origin))].map(city=>'<option value="'+esc(city)+'" '+(city===(conf().startCity||'تهران')?'selected':'')+'>'+esc(city)+'</option>').join('')+'</select></div>'+planner.routes.map(route=>'<div class="field"><label for="cap-'+route.id+'">'+esc(route.name)+' (کیلومتر در روز)</label><input id="cap-'+route.id+'" type="text" inputmode="numeric" data-numeric="true" required value="'+number(conf().routeCaps?.[route.id]??route.cap)+'"><label for="share-'+route.id+'">سهم مسیر (درصد)</label><input id="share-'+route.id+'" type="text" inputmode="decimal" data-numeric="true" required value="'+number(conf().routeShares?.[route.id]??route.weights[twoDifferentials()?1:0])+'"></div>').join('');
 updatePlannerPreview();
 byId('vehicleForm').dataset.rendering='true';document.querySelectorAll('#vehicleForm select').forEach(el=>el.dispatchEvent(new Event('change')));delete byId('vehicleForm').dataset.rendering;
}

function mapHtml(p){return (state.tab==='durability'?routeEditor(p)+progressBars(p):'')+window.BAMCO_ROUTE_MAP.html(p)}
function lastRecordedDurabilityDay(plan){
 const days=new Set(Object.keys(state.mileage.durability||{}).map(Number));
 for(const key of Object.keys(state.records)){
  if(key.startsWith('durability:'))days.add(Number(key.split(':')[1]));
 }
 for(const [key,mission] of Object.entries(state.missions||{})){
  if(key.startsWith('durability:')&&Object.keys(mission||{}).length)days.add(Number(key.split(':')[1]));
 }
 return plan.findLast(day=>days.has(day.day))?.day||0;
}
function hasProtectedDay(fromDay){return lastRecordedDurabilityDay(dayCategoryPlan())>=fromDay}
function progressBars(p){const rows=targetRows(),actual=planner.totals(dayCategoryPlan(),state.mileage.durability);return '<section class="route-progress"><h3>پیشرفت پیمایش مسیرها</h3><p>پیمایش ثبت‌شده / انتخاب فعلی / باقی‌مانده</p>'+rows.filter(r=>r.km>0).map(r=>{const got=actual[r.id]||0,preview=r.id===p.routeId&&!Object.hasOwn(state.mileage.durability,p.day)?p.km:0;return '<div class="route-progress-row"><span>'+esc(r.name)+'</span><div class="route-progress-track"><i style="width:'+Math.min(100,got/r.km*100)+'%"></i><b style="width:'+Math.max(0,Math.min(100-got/r.km*100,preview/r.km*100))+'%"></b></div><small>'+number(got)+' / '+number(preview)+' / '+number(Math.max(0,r.km-got-preview))+' <span>کیلومتر</span></small></div>'}).join('')+'</section>'}
function routeEditor(p){
 const locked=hasProtectedDay(p.day),cities=[...new Set([p.origin||conf().startCity||'تهران',...DB.roadCatalog.map(r=>r.origin)])];
 return '<form id="routeEditor" class="route-editor"><h3>انتخاب مسیر روز</h3><p>'+(locked?'این روز یا روزهای بعد اطلاعات ثبت‌شده دارند؛ مسیرهای ثبت‌شده ثابت می‌مانند.':'با تغییر مسیر، روزهای قبل ثابت می‌مانند و برنامه از این روز به بعد محاسبه می‌شود.')+'</p><fieldset '+(locked||readOnly?'disabled':'')+'><div class="formgrid"><div class="field"><label for="routeOrigin">شهر مبدأ</label><select id="routeOrigin">'+cities.map(city=>'<option value="'+esc(city)+'" '+(city===(p.origin||conf().startCity||'تهران')?'selected':'')+'>'+esc(city)+'</option>').join('')+'</select></div><div class="field"><label for="routeKind">نوع مسیر</label><select id="routeKind">'+targetRows().filter(r=>r.km).map(r=>'<option value="'+r.id+'" '+(r.id===p.routeId?'selected':'')+'>'+esc(r.name)+'</option>').join('')+'</select></div><div class="field"><label for="routeDestination">مقصد از بانک مسیرها</label><select id="routeDestination"></select></div><div class="field"><label for="routeDistance">پیمایش روز (کیلومتر)</label><input id="routeDistance" data-numeric inputmode="decimal" value="'+number(p.km)+'"></div></div><p id="routeChoiceInfo"></p><button class="primary" type="submit">اعمال مسیر و به‌روزرسانی روزهای بعد</button></fieldset></form>';
}
function routeChoices(){
 const el=byId('routeDestination');if(!el)return;
 const choices=planner.optionsFrom(DB.roadCatalog,byId('routeOrigin').value,byId('routeKind').value),p=dayCategoryPlan()[state.durDay-1];
 el.innerHTML=choices.map((r,i)=>'<option value="'+i+'" '+(r.destination===p.destination?'selected':'')+'>'+esc(r.destination)+'</option>').join('');
 el._choices=choices;routeChoiceInfo();window.BAMCO_DROPDOWNS?.(byId('routeEditor'));
}
function routeChoiceInfo(adjust=false){const el=byId('routeDestination'),edge=el?._choices?.[num(el.value)];if(!el)return;if(adjust&&edge){const rows=targetRows(),row=rows.find(r=>r.id===edge.routeId),plan=dayCategoryPlan(),prior=plan.filter(p=>p.day<state.durDay),total=Object.fromEntries(rows.map(r=>[r.id,0]));for(const p of prior)total[p.routeId]+=(Object.hasOwn(state.mileage.durability,p.day)?state.mileage.durability[p.day]:p.km);const cycle=Math.min(4,Math.floor(Math.min(...rows.filter(r=>r.km>0).map(r=>total[r.id]/r.km))*4+.000001)+1);byId('routeDistance').value=number(Math.max(0,Math.min(edge.km||row.cap,row.cap,row.km*cycle/4-total[row.id])));}byId('routeChoiceInfo').textContent=edge?(edge.km?'فاصله مرجع در فایل مسیرها: '+number(edge.km)+' کیلومتر. ':'')+'مسافت روز با مسیر جاده‌ای و تکرار حلقه یا رفت‌وبرگشت تکمیل می‌شود.':'برای این مبدأ و نوع مسیر، مسیری در فایل ثبت نشده است.';}
document.addEventListener('change',e=>{if(['routeOrigin','routeKind'].includes(e.target.id)){routeChoices();routeChoiceInfo(true)}if(e.target.id==='routeDestination')routeChoiceInfo(true);});
document.addEventListener('submit',e=>{if(e.target.id!=='routeEditor')return;e.preventDefault();if(readOnly||hasProtectedDay(state.durDay))return;
 try{const el=byId('routeDestination'),edge=el._choices?.[num(el.value)];if(!edge)throw Error('یک مسیر از بانک مسیرها انتخاب کنید.');
 const plan=planner.replan({plan:dayCategoryPlan(),fromDay:state.durDay,replacement:{origin:edge.origin,destination:edge.destination,routeId:edge.routeId,roadId:edge.id,roadKm:edge.km,km:num(byId('routeDistance').value)},mileage:state.mileage.durability,rows:targetRows(),startOdo:num(conf().startOdo),catalog:DB.roadCatalog});
 state.durabilitySchedule=plan;state.config.durDays=plan.length;state.config.durabilityPlannerVersion=2;save();render();toast('مسیر انتخابی و برنامه روزهای بعد به‌روزرسانی شد.');
 }catch(error){toast(error.message)}
});

function renderCategories(items){
const grouped=new Map();items.forEach(t=>grouped.set(t.cat,(grouped.get(t.cat)||0)+1));
byId('categories').innerHTML=['<button class="cat-item '+(state.category==='همه'?'active':'')+'" data-category="همه"><span>همه شاخص‌ها</span><span>'+number(items.length)+'</span></button>'].concat([...new Set([...categories,...grouped.keys()])].filter(c=>grouped.has(c)).map(c=>'<button class="cat-item '+(state.category===c?'active':'')+'" data-category="'+esc(c)+'"><span>'+esc(c)+'</span><span>'+number(grouped.get(c))+'</span></button>')).join('')
}

function dayContext(){
 if(!['drive','durability'].includes(state.tab))return null;
 const day=currentDay();
 return {tab:state.tab,day,key:state.tab+':'+day,section:dayScreen};
}
function dayRouteAppearance(p){
 const text=p.type||p.route||'';
 const kind=p.routeId||(/گرم|سرد/.test(text)?'hot':/خاکی|خارج.?جاده|ناهموار/.test(text)?'offroad':/کوهستان|شیب/.test(text)?'mountain':/شهری/.test(text)&&!/برون/.test(text)?'urban':'rural');
 const icons={
 hot:'<ellipse cx="48" cy="83" rx="30" ry="5" fill="#eacb9d" opacity=".22"/><g stroke="#e5b774" stroke-width="5" stroke-linecap="round"><path d="M48 7v8m0 56v8M12 43h8m56 0h8M22 17l6 6m40 40 6 6M22 69l6-6m40-40 6-6"/></g><circle cx="48" cy="43" r="27" fill="#ffdc8d" stroke="#d9a75e" stroke-width="2.5"/><path d="M28 35q5-13 16-15" stroke="#fff2ce" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="42" rx="3" ry="4" fill="#976d42"/><ellipse cx="58" cy="42" rx="3" ry="4" fill="#976d42"/><ellipse cx="31" cy="51" rx="6" ry="3.5" fill="#f2b2a1"/><ellipse cx="65" cy="51" rx="6" ry="3.5" fill="#f2b2a1"/><path d="M41 51q7 10 14 0" fill="#fff6e5" stroke="#b0804c" stroke-width="2" stroke-linecap="round"/><path d="M10 73q1-6 7-6 1-7 8-6 7-1 9 7 7 0 7 5z" fill="#fffaf0" stroke="#e8d3ac" stroke-width="1.5"/>',
 urban:'<ellipse cx="48" cy="85" rx="35" ry="5" fill="#bddbcb" opacity=".32"/><rect x="13" y="33" width="33" height="47" rx="10" fill="#c4e4d2" stroke="#79aa91" stroke-width="2.5"/><rect x="43" y="15" width="37" height="65" rx="11" fill="#d0e2ee" stroke="#8eaac2" stroke-width="2.5"/><path d="M21 44h7m5 0h5m-17 9h7m5 0h5M53 28h7m7 0h5m-19 10h7m7 0h5" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="23" cy="64" r="2.4" fill="#537f6c"/><circle cx="36" cy="64" r="2.4" fill="#537f6c"/><path d="M26 70q4 5 7 0" stroke="#537f6c" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="19" cy="69" rx="4" ry="2" fill="#edb6b5"/><ellipse cx="39" cy="69" rx="4" ry="2" fill="#edb6b5"/><circle cx="55" cy="57" r="2.8" fill="#627f9b"/><circle cx="69" cy="57" r="2.8" fill="#627f9b"/><path d="M58 64q5 6 9 0" stroke="#627f9b" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="51" cy="63" rx="4.5" ry="2.5" fill="#edc0c6"/><ellipse cx="74" cy="63" rx="4.5" ry="2.5" fill="#edc0c6"/><path d="M8 23h8m-4-4v8" stroke="#d5b1d7" stroke-width="2.5" stroke-linecap="round"/>',
 rural:'<ellipse cx="48" cy="84" rx="34" ry="5" fill="#c7dbea" opacity=".35"/><path d="m19 81 10-57h38l10 57" fill="#e5edf5"/><path d="M48 69v10M48 19v8" stroke="#b5cbdc" stroke-width="3" stroke-linecap="round"/><rect x="20" y="63" width="13" height="16" rx="5" fill="#729f90"/><rect x="63" y="63" width="13" height="16" rx="5" fill="#729f90"/><path d="m24 43 8-22q2-6 9-6h14q7 0 9 6l8 22" fill="#bfe4d5" stroke="#77ac98" stroke-width="2.5"/><path d="m32 38 5-15h22l5 15z" fill="#f0f8ff" stroke="#a9c9d4" stroke-width="1.5"/><path d="m40 25-5 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="16" y="39" width="64" height="32" rx="13" fill="#ccebdd" stroke="#77ac98" stroke-width="2.5"/><circle cx="31" cy="51" r="5" fill="#fff9e9"/><circle cx="65" cy="51" r="5" fill="#fff9e9"/><circle cx="32" cy="51" r="2.4" fill="#527e70"/><circle cx="64" cy="51" r="2.4" fill="#527e70"/><ellipse cx="27" cy="60" rx="5" ry="2.5" fill="#edb9bd"/><ellipse cx="69" cy="60" rx="5" ry="2.5" fill="#edb9bd"/><path d="M40 58q8 9 16 0" fill="#fff" stroke="#77ac98" stroke-width="2" stroke-linecap="round"/><path d="M9 24h8m-4-4v8m65-5h7m-3.5-3.5v7" stroke="#c3afd9" stroke-width="2.5" stroke-linecap="round"/>',
 mountain:'<ellipse cx="48" cy="84" rx="35" ry="5" fill="#d3c7e4" opacity=".3"/><path d="m9 78 29-59q3-6 6 0l28 59z" fill="#c9b5df" stroke="#9f83bb" stroke-width="2.5" stroke-linejoin="round"/><path d="m46 78 19-41q3-6 6 0l18 41z" fill="#e1d5ed" stroke="#b29cc8" stroke-width="2" stroke-linejoin="round"/><path d="m28 42 10-23q3-6 6 0l10 23-9-5-6 6-5-6z" fill="#fff9ff"/><circle cx="33" cy="59" r="2.8" fill="#82679b"/><circle cx="49" cy="59" r="2.8" fill="#82679b"/><path d="M36 66q5 6 10 0" fill="#fff" stroke="#967aac" stroke-width="2" stroke-linecap="round"/><ellipse cx="27" cy="66" rx="5" ry="2.5" fill="#e9b9cc"/><ellipse cx="55" cy="66" rx="5" ry="2.5" fill="#e9b9cc"/><circle cx="74" cy="17" r="8" fill="#f3dbab"/><path d="M6 22q0-5 6-5 0-7 7-6 6 0 7 6 6 0 6 5z" fill="#f4f7fc" stroke="#d5deed" stroke-width="1.5"/>',
 offroad:'<ellipse cx="48" cy="84" rx="35" ry="5" fill="#dbcbb5" opacity=".35"/><path d="M7 79q16-14 32-6t50-5v15H7z" fill="#eadac0"/><rect x="19" y="61" width="13" height="18" rx="5" fill="#a58b6a"/><rect x="64" y="61" width="13" height="18" rx="5" fill="#a58b6a"/><path d="m24 41 7-21q2-5 9-5h17q7 0 9 5l6 21" fill="#f3d6a5" stroke="#b99b6d" stroke-width="2.5"/><path d="m33 36 4-14h23l4 14z" fill="#edf6f7" stroke="#d1b88d" stroke-width="1.5"/><rect x="15" y="37" width="66" height="34" rx="12" fill="#f2debb" stroke="#b99b6d" stroke-width="2.5"/><circle cx="30" cy="50" r="5.5" fill="#fffaf0"/><circle cx="66" cy="50" r="5.5" fill="#fffaf0"/><circle cx="31" cy="50" r="2.6" fill="#947650"/><circle cx="65" cy="50" r="2.6" fill="#947650"/><ellipse cx="25" cy="60" rx="5" ry="2.5" fill="#eeb8a6"/><ellipse cx="71" cy="60" rx="5" ry="2.5" fill="#eeb8a6"/><path d="M40 58q8 9 16 0" fill="#fff" stroke="#ad9067" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="72" r="3" fill="#ceb896"/><circle cx="86" cy="76" r="4" fill="#d8c4a6"/>'
 };
 return {kind,icon:'<svg viewBox="0 0 96 96" aria-hidden="true">'+(icons[kind]||icons.rural)+'</svg>',label:text};
}
function driveDaySummary(showTests=false){
 if(state.tab!=='drive')return '';
 const p=driveProgram().find(p=>p.day===state.driveDay);
 if(!p)return '';
 const items=dayItems();
 return '<section class="drive-reference-summary" data-drive-reference="'+p.day+'"><div class="drive-reference-meta"><span>Drive Reference</span><span>'+number(p.stage)+' / '+number(p.stageDay)+'</span></div><h3>'+esc(fa(p.route))+'</h3><p>'+number(p.km)+' '+esc(fa('کیلومتر'))+' · '+number(items.length)+' '+esc(fa('آزمون'))+'</p>'+(showTests?'<details class="drive-reference-tests"><summary>'+esc(fa('فهرست آزمون‌های قابلیت رانندگی'))+'</summary><ol>'+items.map(t=>'<li data-source-test="'+esc(t.sourceId)+'"><bdi>'+esc(t.sourceId)+'</bdi><span>'+esc(fa(t.name))+'</span></li>').join('')+'</ol></details>':'')+'</section>';
}
function renderDayNavigation(){
 const c=dayContext(),host=byId('dayNavigation');
 host.classList.toggle('hidden',!c||!['days','menu'].includes(dayScreen));
 if(!c){host.replaceChildren();return}
 if(dayScreen==='days'){
  const plan=state.tab==='drive'?driveProgram():dayCategoryPlan();
  host.innerHTML='<div class="assessment-days-grid">'+plan.map(p=>{const theme=dayRouteAppearance(p);return '<button type="button" class="assessment-day-tile" data-route="'+esc(theme.kind)+'" data-needs-route="'+Boolean(p.needsRoute)+'" data-day="'+p.day+'" aria-label="روز '+number(p.day)+'، '+esc(state.tab==='drive'?p.route:theme.label)+'"><span class="day-card-top"><strong><span class="day-word">روز </span>'+number(p.day)+'</strong></span><span class="day-route-icon">'+theme.icon+'</span><span class="day-card-footer"><span class="day-route-label">'+esc(state.tab==='drive'?p.route:theme.label)+'</span><small>'+number(p.km)+' کیلومتر</small>'+(p.needsRoute?'<small>نیازمند انتخاب مسیر</small>':'')+'</span></button>'}).join('')+'</div>';
 }else if(dayScreen==='menu'){
  host.innerHTML=driveDaySummary(true)+'<div class="assessment-day-sections">'+[
   ['form','فرم روزانه','ثبت اطلاعات پیمایش و شرایط روز','▤'],
   ['route','مسیر پیمایش','مشاهده نقشه و مشخصات مسیر','↗'],
   ['scores','امتیازدهی','ثبت نمره، یادداشت و تصویر آزمون‌ها','☆']
  ].map(([key,title,detail,icon])=>'<button type="button" class="assessment-day-card" data-daysection="'+key+'"><span class="assessment-day-icon" aria-hidden="true">'+icon+'</span><strong>'+title+'</strong><small>'+detail+'</small></button>').join('')+'</div>';
 }
}
function navigateDay(section){
 if(!dayContext()||!['days','menu','form','route','scores'].includes(section))return;
 dayScreen=section;finishNavigation();
}

function renderSchedule(){
const s=byId('schedulePanel');
if(state.tab==='supplementary'){s.innerHTML='<div class="section-heading"><div><h2>بررسی استاتیک</h2><p>این موارد برنامه روزانه ندارند و بر اساس وضعیت خودرو قابل ارزیابی هستند.</p></div><span class="chip">بدون روز و کیلومتر</span></div>';return}
const plan=state.tab==='drive'?driveProgram():dayCategoryPlan(),d=state.tab==='drive'?state.driveDay:state.durDay,p=plan[d-1],milestone=state.tab==='durability'?(checksOnPlan(plan).get(d)||[]):[];
if(!p){s.innerHTML='<div class="empty">برنامه روزانه پیدا نشد.</div>';return}
const indexText=state.tab==='drive'?'برنامه ۲۶ روزه قابلیت رانندگی':'برنامه انعطاف‌پذیر دوام';

const remainingMeta=(state.tab==='durability'?'<span class="meta-tag">پیمایش تجمعی برنامه: '+number(p.cum)+' کیلومتر</span>':'')+(milestone.length?'<span class="meta-tag">کنترل: '+milestone.map(x=>number(x)+'٪').join('، ')+'</span>':'');
s.innerHTML=driveDaySummary()+'<div id="bamco-day-route" class="bamco-day-route">'+(remainingMeta?'<div class="day-meta">'+remainingMeta+'</div>':'')+(p.over?'<div class="notice">هدف پیمایش این روز از سقف پیشنهادی نوع مسیر بیشتر است. پیش از اجرای میدانی مسیر یا تعداد روزها را بازبینی کنید.</div>':'')+mapHtml(p)+'</div>'

}
const scoreColors=[null,['#f9e6ea','#e7b0ba','#ac2441'],['#fae1e5','#eba2b0','#be304a'],['#fae8e1','#f5b49d','#c84c33'],['#fff0df','#f5c09a','#cf752a'],['#fff4df','#f5ce8f','#cb8a1d'],['#fff7dd','#e9d075','#b79817'],['#eff6df','#bdd889','#619825'],['#e4f4e8','#9fd5ad','#22834e'],['#def1eb','#93ceb6','#167d55'],['#dcefe8','#85c1aa','#0e7451']];
function questionCard(t,compact=false){
let html='';
const rec=record(t),colors=scoreColors;
if(!compact)html+='<article class="question '+(t.id.startsWith('CUSTOM-')?'user-authored':'')+'" id="q-'+esc(t.id)+'"><div class="question-head"><div><div class="test-hierarchy"><span>شاخص: '+esc(fa(t.cat))+'</span><span>زیرشاخص: '+esc(fa(t.sub))+'</span></div><h3>'+esc(fa(t.name))+'</h3></div></div>';
const extra=sourceFields(t);const details=[['شرایط آزمون',t.profile],...(['durability','comprehensive'].includes(state.tab)?[['حالت بار',extra.load]]:[]),['روش سنجش',t.measure]];
html+='<dl class="test-conditions">'+details.filter(([label,value])=>value!==undefined&&value!==null&&String(value).trim()!=='').map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(fa(value))+'</dd></div>').join('')+'</dl>';
html+='<div class="scores" role="group" aria-label="نمره آزمون از ۱ تا ۱۰">';
for(let i=1;i<=10;i++){let c=colors[i];html+='<button class="score '+(num(rec.score)===i?'selected':'')+'" data-score="'+i+'" data-test="'+esc(t.id)+'" title="'+esc(scoreWords[i])+'" style="--score-bg:'+c[0]+';--score-border:'+c[1]+';--score-text:'+c[2]+'"><strong>'+number(i)+'</strong><small>'+esc(scoreWords[i])+'</small></button>'}
html+='</div><details class="assessment-attachment" '+(rec.note||rec.photo?'open':'')+'><summary><span class="attachment-plus" aria-hidden="true">+</span>افزودن یادداشت یا تصویر</summary><div class="note-wrap"><div class="note-actions"><label class="label-block" for="note-'+esc(t.id)+'">یادداشت ارزیاب</label><span class="tiny">در صورت نیاز تصویر هم پیوست کنید.</span></div><textarea id="note-'+esc(t.id)+'" data-note="'+esc(t.id)+'" placeholder="مشاهده، ایراد یا نکته قابل پیگیری را ثبت کنید...">'+esc(rec.note||'')+'</textarea><div class="note-actions"><label class="photo-picker"><input class="photo-input" type="file" accept="image/*" data-photo="'+esc(t.id)+'" aria-label="انتخاب تصویر آزمون"><span class="photo-picker-button">انتخاب تصویر</span><span class="photo-file-name">'+(rec.photo?'تصویر ثبت شده است':'تصویری انتخاب نشده است')+'</span></label>'+(rec.photo?'<img src="'+rec.photo+'" alt="تصویر ثبت‌شده برای آزمون">':'')+'</div></div></details>'
return compact?html:html+'</article>';
}
function renderQuestions(){
const all=dayItems();
if(state.category!=='همه'&&!all.some(t=>t.cat===state.category))state.category='همه';
renderCategories(all);
const q=fa(state.query).toLowerCase();
const filtered=all.filter(t=>(state.category==='همه'||t.cat===state.category)&&(!q||fa([t.id,t.cat,t.sub,t.name].join(' ')).toLowerCase().includes(q)));
const size=12,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(state.page,pages-1);state.page=page;
const select=filtered.slice(page*size,(page+1)*size);
let html=driveDaySummary()+'<div class="section-heading"><div><h2>فهرست آزمون‌های '+(state.tab==='drive'?'قابلیت رانندگی':state.tab==='durability'?'دوام عملکردی':state.tab==='comprehensive'?'ارزیابی جامع خودرو':'استاتیک')+'</h2><p>'+number(all.length)+' آزمون در این بخش · '+number(filtered.length)+' مورد مطابق فیلتر</p></div><input class="search" id="questionSearch" placeholder="جست‌وجوی شاخص یا عنوان آزمون" value="'+esc(state.query)+'"></div>';
if(state.tab==='durability'&&!Object.hasOwn(state.mileage.durability,state.durDay))html+='<p class="notice">پیش‌نمایش آزمون‌ها بر اساس برنامه است؛ برای ثبت نمره ابتدا پیمایش واقعی روز را ذخیره کنید.</p>';
if(!select.length)html+='<div class="empty">آزمونی مطابق فیلتر یا روز انتخاب‌شده پیدا نشد.</div>';
for(const t of select)html+=questionCard(t);
html+='<div class="toolbar"><button class="secondary" data-pagejump="'+(page-1)+'" '+(page===0?'disabled':'')+'>صفحه قبل</button><span class="tiny">صفحه '+number(page+1)+' از '+number(pages)+'</span><button class="secondary" data-pagejump="'+(page+1)+'" '+(page>=pages-1?'disabled':'')+'>صفحه بعد</button></div>';
byId('questionsPanel').innerHTML=html+(state.tab==='supplementary'?staticTestForm():'')
}

const modes={
 drive:{label:'قابلیت رانندگی',activity:'تقویم روزانه',path:'calendar'},
 durability:{label:'آزمون دوام',activity:'تقویم روزانه',path:'calendar'},
 supplementary:{label:'بررسی استاتیک',activity:'امتیازدهی',path:'scores'},
 comprehensive:{label:'ارزیابی جامع',activity:'امتیازدهی',path:'scores'}
};
const pages=new Map();
let dashboardModule=null;
function definePage(tab,path,parent,title,cards=null,scope=null){
 pages.set(tab,{tab,path,parent,title,cards,scope});
}
definePage('modules','',null,'پرونده خودرو',[['setup','ویرایش مشخصات','editSetup'],['assessmentTypes','انتخاب نوع ارزیابی','comprehensive']]);
definePage('setup','specifications','modules','تنظیم مشخصات خودرو و برنامه آزمون');
definePage('assessmentTypes','types','modules','انتخاب نوع ارزیابی',Object.entries(modes).map(([key,m])=>[key+'Menu',m.label,key]));
for(const [key,mode] of Object.entries(modes)){
 const path='types/'+key,menu=key+'Menu';
 definePage(menu,path,'assessmentTypes',mode.label,[[key,mode.activity,key],[key+'Dashboard','داشبورد مدیریتی','results']]);
 definePage(key,path+'/'+mode.path,menu,mode.label);
 definePage(key+'Dashboard',path+'/dashboard',menu,'داشبورد مدیریتی '+mode.label,null,key);
}
const pathPages=new Map([...pages.values()].map(page=>[page.path,page]));
function currentPage(){
 return pages.get(state.tab==='results'&&dashboardModule?dashboardModule+'Dashboard':state.tab);
}
function renderGate(){
 const page=currentPage(),modules=byId('moduleLanding');
 modules.classList.toggle('hidden',!page?.cards);
 modules.replaceChildren();
 if(page?.cards){
   const grid=document.createElement('div');grid.className='gate-grid';
   for(const [destination,label,icon] of page.cards){
     const card=document.createElement('button');card.type='button';card.className='gate-card';card.dataset.gateIcon=icon;
     const scope=pages.get(destination).scope;
     if(scope)card.dataset.moduleDashboard=scope;else card.dataset.open=destination;
     card.innerHTML='<span class="gate-illustration" aria-hidden="true"></span><strong>'+label+'</strong><span class="gate-cta">ورود به بخش ←</span>';
     grid.append(card);
   }
   modules.append(grid);
 }
 byId('innerHero').classList.toggle('hidden',state.tab==='home');
 const back=byId('backModulesBtn');
 back.classList.toggle('hidden',state.tab==='home'||state.tab==='modules'||Boolean(dayContext()&&dayScreen!=='days'));
 back.dataset.open=page?.parent||'modules';
 back.textContent='بازگشت';
 byId('assessmentBack').classList.toggle('hidden',state.tab!=='modules');
}
function routePath(){
 const page=currentPage();
 if(!page)return '';
 const daily=dayContext();
 return daily&&dayScreen!=='days'?page.path+'/'+daily.day+(dayScreen==='menu'?'':'/'+dayScreen):page.path;
}
function caseDocument(){return location.pathname.endsWith('/case.html')}
function finishNavigation(){
 const path=routePath(),previous=location.hash.slice(1);
 if(caseDocument()&&path!==previous){
   const url=new URL(location.href);url.hash=path;
   if(history.state?.from===path)history.back();
   else history.pushState({from:previous},'',url);
 }
 render();
 window.scrollTo({top:0,behavior:'instant'});
}
function restoreRoute(){
 const path=location.hash.slice(1);
 let page=pathPages.get(path),section='days',day=1;
 if(!page){
   const daily=/^(types\/(?:drive|durability)\/calendar)\/([1-9]\d*)(?:\/(form|route|scores))?$/.exec(path);
   if(daily && state.setupComplete){
     const max=daily[1].includes('/drive/')?driveProgram().length:dayCategoryPlan().length;
     day=Number(daily[2]);
     if(day<=max){page=pathPages.get(daily[1]);section=daily[3]||'menu'}
   }
 }
 page??=pages.get('modules');
 if(!state.setupComplete&&!page.cards&&page.tab!=='setup')page=pages.get('setup');
 activatePage(page);
 dayScreen=section;
 if(page.tab==='drive')state.driveDay=day;
 if(page.tab==='durability')state.durDay=day;
 const canonical=routePath();
 if(path!==canonical){const url=new URL(location.href);url.hash=canonical;history.replaceState(null,'',url)}
 render();window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('popstate',()=>{if(cloudSave&&caseDocument()&&location.hash.slice(1)!==routePath())restoreRoute()});
function activatePage(page){
 dashboardModule=page.scope;
 state.tab=page.scope&&page.scope!=='comprehensive'?'results':page.tab;
 dayScreen='days';state.query='';state.category='همه';state.page=0;
}
function routeClassification(s){
 const v=String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک');
 if(/برون.?شهری|دوطرفه/.test(v))return 'برون شهری';
 if(/شهری پرترافیک|ترافیک سنگین/.test(v))return 'شهری پرترافیک';
 if(/شهری روان|شهری کم.?ترافیک/.test(v))return 'شهری روان';
 if(/شهری|تهران/.test(v)&&!/بزرگراه|آزادراه|کوهستان|آفرود|خاکی/.test(v))return 'شهری';
 if(/آزادراه|بزرگراه/.test(v))return 'آزادراه / بزرگراه';
 if(/کوهستان|دیزین|پیچ/.test(v))return 'کوهستانی';
 if(/خاکی|آفرود|خارج.?جاده/.test(v))return 'خارج جاده';
 if(/برون.?شهری|دوطرفه/.test(v))return 'برون شهری';
 return v||'سایر';
}
function routeMixHtml(tab){
 const plan=tab==='drive'?driveProgram():dayCategoryPlan();
 const group={};const actual=state.mileage[tab]||{};let got=0;
 for(const p of plan){
  const k=p.routeId?({urban:'شهری',rural:'جاده برون‌شهری',hot:'جاده گرمسیری',offroad:'خارج‌جاده/مسیر خاکی',mountain:'جاده کوهستانی'}[p.routeId]||p.type):routeClassification(p.type||p.route);group[k]??={target:0,actual:0,days:0};
  group[k].target+=p.km;group[k].days++;
  const real=num(actual[p.day]);if(Object.prototype.hasOwnProperty.call(actual,p.day)&&Number.isFinite(real)&&real>=0){group[k].actual+=real;got+=real}
 }
 const total=plan.reduce((a,b)=>a+b.km,0);
 const row=(label,target,real,days,totalRow=false)=>{
 const targetShare=total?100*target/total:0,actualShare=got?100*real/got:0,coverage=target?100*real/target:0;
 return '<tr'+(totalRow?' class="route-total"':'')+'><th scope="row">'+esc(label)+'</th><td>'+number(days)+'</td><td>'+number(targetShare)+'٪</td><td>'+number(target)+'</td><td>'+number(real)+'</td><td>'+number(actualShare)+'٪</td><td>'+number(Math.max(0,target-real))+'</td><td>'+number(coverage)+'٪</td></tr>';
 };
 return '<div class="route-report"><div class="section-heading"><h2>پایش برنامه و پیمایش '+(tab==='drive'?'قابلیت رانندگی':'دوام')+'</h2></div><div class="route-table-scroll"><table class="result-table route-progress-table"><caption>مسافت‌ها بر حسب کیلومتر؛ تحقق برابر پیمایش ثبت‌شده تقسیم بر هدف است.</caption><thead><tr><th scope="col">نوع مسیر</th><th scope="col">روزهای برنامه</th><th scope="col">سهم هدف</th><th scope="col">هدف برنامه</th><th scope="col">پیمایش ثبت‌شده</th><th scope="col">سهم پیمایش</th><th scope="col">باقی‌مانده</th><th scope="col">تحقق برنامه</th></tr></thead><tbody>'+Object.entries(group).sort((a,b)=>b[1].target-a[1].target).map(([k,v])=>row(k,v.target,v.actual,v.days)).join('')+'</tbody><tfoot>'+row('جمع کل',total,got,plan.length,true)+'</tfoot></table></div><p class="route-table-note">پیمایش از مقادیر ثبت‌شده روزهای آزمون محاسبه می‌شود؛ روزهای بدون ثبت، صفر در نظر گرفته می‌شوند.</p></div>';

}

function renderResults(){
 byId('resultsPanel').innerHTML='<div class="toolbar">'+(readOnly?'':'<button class="primary" data-report-save></button><span data-report-save-status role="status"></span>')+'<button class="primary" data-dashboard-export>خروجی اکسل داشبورد</button><button class="secondary" data-exportcsv="1">دریافت گزارش آزمون‌ها</button><button class="secondary" data-dashboard-print>چاپ داشبورد</button></div><div id="assessmentDashboard"></div>'+(dashboardModule==='supplementary'?'':dashboardModule?routeMixHtml(dashboardModule):routeMixHtml('drive')+routeMixHtml('durability'));
 window.BAMCO_DASHBOARD?.render();
}

function render(){
syncDraft();
document.body.dataset.view=state.tab;
renderGate();
const titles={home:['',''],modules:['پرونده خودرو',''],setup:['تنظیم مشخصات خودرو و برنامه آزمون','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.'],drive:['آزمون قابلیت رانندگی','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا'],durability:['آزمون دوام عملکردی','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف'],comprehensive:['ارزیابی جامع خودرو',''],supplementary:['بررسی استاتیک','ارزیابی‌های مستقل از برنامه کیلومتری'],results:['داشبورد و نتایج','خلاصه نمره هر شاخص و هر حوزه ارزیابی']};
const daily=dayContext();
const page=currentPage();
const sectionNames={menu:'',form:'فرم روزانه',route:'مسیر پیمایش',scores:'امتیازدهی'};
byId('pageTitle').textContent=(page?.cards||page?.scope)?page.title:(titles[state.tab]?.[0]||page?.title||'پرونده خودرو');
let pageContext=byId('pageContext');
if(!pageContext){pageContext=document.createElement('div');pageContext.id='pageContext';pageContext.className='page-context';byId('pageTitle').insertAdjacentElement('afterend',pageContext)}
pageContext.replaceChildren();
pageContext.classList.toggle('hidden',!daily||dayScreen==='days');
if(daily&&dayScreen!=='days'){
 const day=document.createElement('span');day.className='page-day-chip';day.textContent='روز '+number(daily.day);pageContext.append(day);
 if(sectionNames[dayScreen]){const section=document.createElement('span');section.className='page-section-chip';section.textContent=sectionNames[dayScreen];pageContext.append(section)}
}
byId('pageSub').textContent=titles[state.tab]?.[1]||'';
byId('headerVehicle').textContent=conf().vclass+' · '+conf().body+' · '+conf().power+' · '+conf().driveType;
byId('setupPanel').classList.toggle('hidden',state.tab!=='setup');
byId('workPanel').classList.toggle('hidden',!['drive','durability','supplementary','comprehensive'].includes(state.tab));
byId('resultsPanel').classList.toggle('hidden',state.tab!=='results');
document.querySelectorAll('.bamco-day-final,.bamco-day-extra').forEach(el=>el.remove());
renderDayNavigation();
const workspace=byId('workPanel').querySelector('.workspace');
workspace.classList.toggle('hidden',Boolean(daily)&&['days','menu'].includes(dayScreen));
workspace.classList.toggle('assessment-single-section',Boolean(daily)&&dayScreen!=='scores');
byId('schedulePanel').classList.toggle('hidden',state.tab==='comprehensive'||Boolean(daily)&&dayScreen==='scores');
byId('questionsPanel').classList.toggle('hidden',Boolean(daily)&&dayScreen!=='scores');
workspace.querySelector('.sidebar').classList.toggle('hidden',Boolean(daily)&&dayScreen!=='scores');
if(state.tab==='setup')renderSetup();
else if(state.tab==='results')renderResults();
else if(Object.hasOwn(modes,state.tab)){
 if(!daily){if(state.tab!=='comprehensive')renderSchedule();renderQuestions()}
 else {
  byId('schedulePanel').replaceChildren();byId('questionsPanel').replaceChildren();
  if(dayScreen==='route')renderSchedule();
  if(dayScreen==='scores')renderQuestions();
  document.dispatchEvent(new CustomEvent('bamco:day-render'));
 }
}
document.body.classList.toggle('assessment-readonly',readOnly);
if(readOnly)document.querySelectorAll('#vehicleForm button,#vehicleForm input,#vehicleForm select,[data-score],[data-note],[data-photo],[data-import],[data-clear]').forEach(el=>el.disabled=true);
const actions=byId('assessmentTabActions');
actions.replaceChildren();
const resultActions=byId('resultsPanel').querySelector('.toolbar');
if(state.tab==='results'&&resultActions){actions.append(...resultActions.children);resultActions.remove()}
if(daily&&dayScreen!=='days'){
 const back=document.createElement('button');back.type='button';back.className='secondary';
 back.textContent=dayScreen==='menu'?'بازگشت به تقویم روزانه':'بازگشت به بخش‌های روز';
 back.addEventListener('click',()=>navigateDay(dayScreen==='menu'?'days':'menu'));
 actions.prepend(back);
}
document.dispatchEvent(new Event('bamco:render'));
}
function changeTab(tab){
 let page=pages.get(tab);
 if(!page)return;
 if(!state.setupComplete&&!page.cards&&tab!=='setup'){
   toast('ابتدا مشخصات خودرو را ثبت کنید.');
   page=pages.get('setup');
 }
 activatePage(page);finishNavigation();
}
function exportFile(content,name,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportJSON(){exportFile(JSON.stringify({schema:1,savedAt:new Date().toISOString(),...snapshot()},null,2),'BAMCO-assessment-backup.json','application/json;charset=utf-8');toast('فایل پشتیبان آماده شد.')}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}

function scoreForDay(tab,day,id){const prefix=tab+':'+day+':'+id;const values=Object.entries(state.records).filter(([k])=>k===prefix||k.startsWith(prefix+'@')).map(([,v])=>num(v.score)).filter(x=>x>=1&&x<=10);return avg(values)}
function excelReportSheets(){
 const specs=[
  {tab:'drive',name:'قابلیت رانندگی',days:26},
  {tab:'durability',name:'آزمون دوام',days:dayCategoryPlan().length},
  {tab:'supplementary',name:'بررسی استاتیک',days:0}
 ];
 return specs.filter(spec=>!dashboardModule||spec.tab===dashboardModule).map(({tab,name,days})=>{
  const eligible=candidates(tab);
  const headers=['شاخص','زیرشاخص','آزمون',...(days?Array.from({length:days},(_,i)=>'روز '+(i+1)):['نمره']), 'میانگین آزمون','میانگین زیرشاخص','میانگین شاخص'];
  const testMeans=new Map(),subMeans=new Map(),catMeans=new Map(),rows=[headers];
  const subKey=t=>t.cat+'\u0001'+t.sub;
  for(const t of eligible){
   const scores=[];
   for(let day=1;day<=(days||1);day++){
    const score=scoreForDay(tab,days?day:'general',t.id);
    if(score>=1&&score<=10)scores.push(score);
   }
   testMeans.set(t.id,avg(scores));
  }
  for(const t of eligible){
   const val=testMeans.get(t.id);
   if(val==null)continue;
   const sub=subKey(t);
   if(!subMeans.has(sub))subMeans.set(sub,[]);
   subMeans.get(sub).push(val);
   if(!catMeans.has(t.cat))catMeans.set(t.cat,[]);
   catMeans.get(t.cat).push(val);
  }
  for(const t of eligible){
   const values=days?Array.from({length:days},(_,i)=>{
    const v=scoreForDay(tab,i+1,t.id);
    return v>=1&&v<=10?v:'';
   }):[(()=>{const v=num(state.records[tab+':general:'+t.id]?.score);return v>=1&&v<=10?v:'';})()];
   const mean=testMeans.get(t.id);
   rows.push([fa(t.cat),fa(t.sub),fa(t.name),...values,mean??'',avg(subMeans.get(subKey(t))||[])??'',avg(catMeans.get(t.cat)||[])??'']);
  }
  const widths=[30,42,75,...Array.from({length:days||1},()=>12),20,22,20];
  return {name,rows,widths};
 });
}
function buildExcelReport(sheets){
 const reportLanguage=window.BAMCO_I18N?.language||'fa',rtl=reportLanguage==='fa';
 const reportFont=reportLanguage==='zh'?'Microsoft YaHei':rtl?'B Nazanin':'Times New Roman';
 if(window.BAMCO_I18N)sheets=sheets.map(sheet=>({...sheet,name:window.BAMCO_I18N.text(sheet.name),rows:sheet.rows.map(row=>row.map(value=>typeof value==='string'?window.BAMCO_I18N.text(value):value))}));
 const xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const col=i=>{let out='';for(i++;i;i=Math.floor((i-1)/26))out=String.fromCharCode(65+(i-1)%26)+out;return out;};
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',files=[];
 const add=(name,text)=>files.push({name,data:new TextEncoder().encode(text)});
 add('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>');
 add('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 add('xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>');
 add('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 add('xl/styles.xml','<styleSheet xmlns="'+ns+'"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.0"/></numFmts><fonts count="2"><font><sz val="12"/><name val="'+reportFont+'"/><color rgb="FF25443B"/></font><font><b/><sz val="12"/><name val="'+reportFont+'"/><color rgb="FFFFFFFF"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF226C54"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F7F2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom style="hair"><color rgb="FFDCE7E1"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment horizontal="'+(rtl?'right':'left')+'" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="10" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="3" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
 sheets.forEach((s,i)=>{const range='A1:'+col(s.rows[0].length-1)+s.rows.length;add('xl/worksheets/sheet'+(i+1)+'.xml','<worksheet xmlns="'+ns+'"><dimension ref="'+range+'"/><sheetViews><sheetView workbookViewId="0" rightToLeft="'+(rtl?1:0)+'"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="28"/><cols>'+s.widths.map((w,j)=>'<col min="'+(j+1)+'" max="'+(j+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+s.rows.map((row,r)=>'<row r="'+(r+1)+'" ht="'+(r===0?36:42)+'" customHeight="1">'+row.map((v,c)=>{const n=typeof v==='number'&&Number.isFinite(v),style=r===0?1:n?(s.percentCols?.includes(c)?3:Number.isInteger(v)?4:2):0;return '<c r="'+col(c)+(r+1)+'" s="'+style+'"'+(n?'><v>'+v+'</v>':' t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is>')+'</c>';}).join('')+'</row>').join('')+'</sheetData><autoFilter ref="'+range+'"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>');});
 const chunks=[],central=[];let offset=0;
 const header=(size)=>new Uint8Array(size),set=(b,o,v,n)=>{const d=new DataView(b.buffer);n===2?d.setUint16(o,v,true):d.setUint32(o,v,true);};
 const crc=data=>{let c=0xffffffff;for(const v of data){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 for(const f of files){const name=new TextEncoder().encode(f.name),sum=crc(f.data),local=header(30);set(local,0,0x04034b50,4);set(local,4,20,2);set(local,14,sum,4);set(local,18,f.data.length,4);set(local,22,f.data.length,4);set(local,26,name.length,2);chunks.push(local,name,f.data);
 const c=header(46);set(c,0,0x02014b50,4);set(c,4,20,2);set(c,6,20,2);set(c,16,sum,4);set(c,20,f.data.length,4);set(c,24,f.data.length,4);set(c,28,name.length,2);set(c,42,offset,4);central.push(c,name);offset+=30+name.length+f.data.length;}
 const len=central.reduce((n,b)=>n+b.length,0),end=header(22);set(end,0,0x06054b50,4);set(end,8,files.length,2);set(end,10,files.length,2);set(end,12,len,4);set(end,16,offset,4);return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function exportCSV(){exportFile(buildExcelReport(excelReportSheets()),'BAMCO-assessment-report.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('گزارش Excel آماده شد.')}

function updateRating(btn){
 if(state.tab==='durability'&&!Object.hasOwn(state.mileage.durability,state.durDay)){toast('ابتدا پیمایش واقعی روز را در فرم روزانه ثبت کنید.');return}
 const test=testById.get(btn.dataset.test);if(!test)return;
 const previous=record(test),rec={...previous},selected=num(btn.dataset.score);
 if(num(rec.score)===selected)delete rec.score;else rec.score=selected;
 rec.band=window.BAMCO_REVIEW_CONTRACT.band(rec.score);
 rec.updatedAt=new Date().toISOString();
 const audit=mission('audit:general');
 edit('missions','audit:general',{entries:[...(audit.entries||[]),{at:rec.updatedAt,action:'scoreChange',testId:test.id,from:previous.score??null,to:rec.score??null}].slice(-2000)});
 edit('records',ratedKey(test),rec);
 const sy=window.scrollY;render();window.scrollTo(0,sy)}
const pendingPictures=new Set();
function currentPictures(){return draft?.pictures??pendingPictures}
function trackPicture(task){const pictures=currentPictures();pictures.add(task);task.finally(()=>pictures.delete(task)).catch(()=>{});return task}
function uploadPicture(file,testId){
 const page=draft,assessment=cloudSave,t=testById.get(testId);if(!file||!file.type.startsWith('image/')||!t)return;const k=ratedKey(t);
 trackPicture(new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onerror=()=>reject(Error('Image read failed'));
  reader.onload=()=>{const im=new Image();im.onerror=()=>reject(Error('Image decode failed'));im.onload=()=>{try{
   if(page!==draft||assessment!==cloudSave){resolve();return}
   const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(im.width,im.height));canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL('image/jpeg',.55);
   edit('records',k,{...record(t),photo:data});const sy=window.scrollY;render();window.scrollTo(0,sy);resolve();
  }catch(error){reject(error)}};im.src=reader.result};reader.readAsDataURL(file);
 })).catch(()=>toast('ثبت تصویر انجام نشد؛ دوباره تصویر را انتخاب کنید.'));
}
byId('vehicleForm').addEventListener('input',updatePlannerPreview);
byId('vehicleForm').addEventListener('change',e=>{if(e.target.id==='twoDiff'&&!byId('vehicleForm').dataset.rendering)for(const r of planner.routes)byId('share-'+r.id).value=number(r.weights[e.target.value==='yes'?1:0]);updatePlannerPreview()});
byId('vehicleForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget,button=form.querySelector('[type="submit"]');
 if(readOnly||button.disabled)return;
 const result=updatePlannerPreview();if(!result){toast('هدف و سقف‌های پیمایش را بررسی کنید.');return}
 const {config,plan}=result;
 if(!Number.isInteger(config.driveKm)||config.driveKm<1||config.driveKm>20000){toast('هدف قابلیت رانندگی باید عدد صحیح بین ۱ تا ۲۰٬۰۰۰ باشد.');return}
 if(!['yes','no'].includes(config.twoDiff)){toast('وضعیت دو دیفرانسیل را انتخاب کنید.');return}
 const original=snapshot();
 config.durDays=plan.days;
 state.config=config;
 state.durabilitySchedule=plan.schedule;
 state.durDay=Math.min(state.durDay,plan.days);
 state.setupComplete=true;
 if(plan.targetsChanged){
  const mileage=state.mileage.durability||{};
  state.checkpointAssignments=Object.fromEntries(Object.keys(mileage).map(day=>[
   day,planner.checkpoints(plan.schedule,mileage,plan.rows,Number(day))
  ]));
 }
 // Confirm the same snapshot that will be used to select the assessment's questions.
 const confirmation=window.BAMCO_CASES;
 if(cloudSave&&confirmation?.saveNow){
  const id=confirmation.current?.()?.id;
  let edited=false;
  const onEdit=()=>{edited=true};
  form.addEventListener('input',onEdit);
  form.addEventListener('change',onEdit);
  button.disabled=true;
  let saved=false;
  try{saved=await confirmation.saveNow(snapshot())}
  catch{saved=false}
  finally{
   form.removeEventListener('input',onEdit);
   form.removeEventListener('change',onEdit);
   if(confirmation.current?.()?.id===id)button.disabled=readOnly;
  }
  if(confirmation.current?.()?.id!==id)return;
  if(!saved&&state.config===config){
   for(const key of ['config','durabilitySchedule','setupComplete','checkpointAssignments'])state[key]=original[key];
  }
  if(state.tab!=='setup')return;
  if(!saved){toast('ذخیره تأیید نشد. دوباره ذخیره را بزنید.');return}
  if(edited)return;
 }else if(!save())return;
 changeTab('modules');
 toast('مشخصات خودرو ثبت و برنامه دوام محاسبه شد.');
});
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.moduleDashboard){
 changeTab(el.dataset.moduleDashboard+'Dashboard');return;
}
if(el.dataset.open){changeTab(el.dataset.open);return}
if(el.dataset.daysection){navigateDay(el.dataset.daysection);return}
if(el.dataset.day){
 const plan=state.tab==='drive'?driveProgram():dayCategoryPlan(),day=num(el.dataset.day);
 if(!dayContext()||!Number.isInteger(day)||day<1||day>plan.length)return;
 if(state.tab==='drive')state.driveDay=day;else state.durDay=day;
 state.page=0;state.category='همه';state.query='';navigateDay('menu');return;
}
if(el.dataset.category){state.category=el.dataset.category;state.page=0;render();return}
if(el.dataset.score){if(!readOnly)updateRating(el);return}
if(el.dataset.pagejump){state.page=num(el.dataset.pagejump);renderQuestions();byId('questionsPanel').scrollIntoView({behavior:'smooth',block:'start'});return}
if(el.dataset.exportcsv){exportCSV();return}
if(el.dataset.import){if(readOnly)return;byId('importBackup').click();return}
if(el.dataset.clear){if(readOnly)return;if(confirm('تمام نمره‌ها و یادداشت‌های ثبت‌شده پاک شوند؟')){state.records={};save();render();toast('نتایج پاک شدند.')}return}
});
document.addEventListener('input',e=>{const el=e.target;if(readOnly||scoreContext()?.section!=='scores'||!el.dataset.note)return;const t=testById.get(el.dataset.note);if(!t)return;if(record(t).note!==el.value)edit('records',ratedKey(t),{...record(t),note:el.value,updatedAt:new Date().toISOString()})});
document.addEventListener('change',e=>{const el=e.target;if(readOnly||scoreContext()?.section!=='scores')return;if(el.dataset.note){const t=testById.get(el.dataset.note);if(!t)return;if(record(t).note!==el.value)edit('records',ratedKey(t),{...record(t),note:el.value,updatedAt:new Date().toISOString()});return}if(el.dataset.photo){uploadPicture(el.files?.[0],el.dataset.photo);return}});
document.addEventListener('input',e=>{if(e.target.id==='questionSearch'){state.query=e.target.value;state.page=0;const field=e.target;const pos=field.selectionStart;renderQuestions();const newField=byId('questionSearch');newField.focus();newField.setSelectionRange(pos,pos)}});
byId('importBackup').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const assessment=cloudSave;const fr=new FileReader();fr.onload=()=>{if(assessment!==cloudSave)return;try{const obj=JSON.parse(fr.result);if(!obj||!obj.records||!obj.config)throw Error('Invalid');if(!confirm('اطلاعات موجود با فایل پشتیبان جایگزین شود؟'))return;state.config=normalizeConfig(obj.config,true);state.records=obj.records;state.mileage=obj.mileage||{drive:{},durability:{}};state.missions=obj.missions||{};state.durabilitySchedule=obj.durabilitySchedule;state.checkpointAssignments=obj.checkpointAssignments||{};state.setupComplete=true;save();render();toast('بازیابی پشتیبان انجام شد.')}catch(err){toast('فایل JSON معتبر نیست.')}};fr.readAsText(file);e.target.value=''});
window.BAMCO_ASSESSMENT={
  open(data,onSave,locked){
    caseGeneration++;draft=null;cloudSave=onSave;readOnly=locked;dayScreen='days';dashboardModule=null;
    document.querySelectorAll('#vehicleForm button,#vehicleForm input,#vehicleForm select').forEach(el=>el.disabled=locked);
    Object.assign(state,{
      config:normalizeConfig(data.config||{},Boolean(data.setupComplete)),
      records:data.records||{},mileage:data.mileage||{drive:{},durability:{}},durabilitySchedule:data.durabilitySchedule,checkpointAssignments:data.checkpointAssignments||{},
      setupComplete:Boolean(data.setupComplete),missions:data.missions||{},driveDay:1,durDay:1,
      category:'همه',query:'',page:0,tab:'modules'
    });
    if(state.durabilitySchedule)state.config.durDays=state.durabilitySchedule.length;
    if(caseDocument())restoreRoute();else render();
  },
  applyReconciledSnapshot(data,submitted){
    // Keep only edits made after Save, including when the user resolves a conflict.
    if(draft&&submitted){
      const staged={...submitted};
      for(const group of ['records','missions'])staged[group]={...submitted[group],...draft[group]};
      const rebased=window.BAMCO_RECONCILE(submitted,staged,data).snapshot;
      for(const group of ['records','missions']){
        for(const key of Object.keys(draft[group])){
          const next=rebased[group]?.[key];
          if(next===data[group]?.[key])delete draft[group][key];
          else draft[group][key]=next;
        }
      }
    }
    state.config=normalizeConfig(data.config||{},Boolean(data.setupComplete));
    state.records=data.records||{};
    state.missions=data.missions||{};
    state.mileage=data.mileage||{drive:{},durability:{}};
    state.setupComplete=Boolean(data.setupComplete);
    state.durabilitySchedule=data.durabilitySchedule;
    state.checkpointAssignments=data.checkpointAssignments||{};
    // The daily and setup forms may contain drafts that have not been submitted.
    if(scoreContext()?.section==='scores'||state.tab==='results'){
      const focus=document.activeElement;
      const editingNote=focus?.matches('textarea[data-note],textarea[data-custom-note]');
      const cursor=editingNote?[focus.selectionStart,focus.selectionEnd]:null;
      render();
      const replacement=editingNote && document.getElementById(focus.id);
      if(replacement){replacement.focus({preventScroll:true});replacement.setSelectionRange(...cursor)}
    }
  },
  saveNow:save,saveDraft,editSession(){return draft},hasPendingImages(){return currentPictures().size>0},trackPicture,async waitForImages(){const pictures=currentPictures();while(pictures.size)await Promise.all([...pictures])},
  openDashboard(mode){if(Object.hasOwn(modes,mode))changeTab(mode+'Dashboard');else{dashboardModule=null;state.tab='results';dayScreen='days';render()}},
  navigateModule(mode){if(Object.hasOwn(modes,mode))changeTab(mode+'Menu')},reportMode(){return dashboardModule},
  dayContext,scoreContext,
  criterionNames(){return categories.slice()},
  snapshot:workingSnapshot,sourceFields,buildExcelReport,exportFile,reportContext(){return {snapshot:snapshot(),drivePlan:driveProgram(),durabilityPlan:dayCategoryPlan(),categories}},eligibleTests:candidates,currentTests:dayItems,dayQuestionCards(){return dayContext()?.section==='scores'?dayItems().map(t=>({id:t.id,html:questionCard(t)})):[]},drivePlan:driveProgram,refresh:render,
  durabilityPlan(){return dayCategoryPlan()},
  mission,
  setMission(key,mission){if(!cloudSave||readOnly)return;edit('missions',key,mission)},
  setDayMileage(tab,day,value){
    if(!cloudSave || readOnly || !['drive','durability'].includes(tab)) return;
    const km = num(value);
    if(!Number.isFinite(km) || km<0) return;
    updateDayMileage(tab, day, km);
    save();
  },
  async saveDailyForm(context, mission, distance){
    if(!cloudSave || readOnly || dayContext()?.key !== context.key) return false;
    const before=snapshot(),generation=caseGeneration;
    if(distance!==null){
      state.config={...state.config};
      state.mileage={...state.mileage,[context.tab]:{...state.mileage[context.tab]}};
      state.checkpointAssignments={...state.checkpointAssignments};
      updateDayMileage(context.tab,context.day,distance);
    }
    state.missions={...state.missions,[context.key]:mission};
    const submitted=snapshot();
    let ok=false;
    try{ok=window.BAMCO_CASES?.saveNow?await window.BAMCO_CASES.saveNow(submitted):save(submitted)}
    finally{
      if(!ok&&generation===caseGeneration){
        for(const key of ['config','mileage','durabilitySchedule','checkpointAssignments']){
          if(state[key]===submitted[key])state[key]=before[key];
        }
        if(state.missions[context.key]===mission){
          if(Object.hasOwn(before.missions,context.key))state.missions[context.key]=before.missions[context.key];
          else delete state.missions[context.key];
        }
      }
    }
    return ok;
  },
  dayProgress(){const items=dayItems(),scored=items.filter(t=>num(record(t).score)>=1&&num(record(t).score)<=10).length;return {total:items.length,scored,remaining:Math.max(0,items.length-scored),complete:items.length===0||scored===items.length}},
  isReadOnly(){return readOnly},
  home(){caseGeneration++;document.dispatchEvent(new Event('bamco:assessment-close'));cloudSave=null;readOnly=false;state.tab='home';render()},
  legacy(){try{
    const data=JSON.parse(localStorage.getItem(KEY)||'null');
    if(data)data.missions=JSON.parse(localStorage.getItem('bamco-drive-day-metadata-v2')||'{}');
    return data;
  }catch{return null}}
};

function staticTestForm(){return '<details class="static-test-builder"><summary>افزودن آزمون جدید</summary><form id="staticTestForm"><div class="formgrid"><label>شاخص<select name="cat">'+categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select></label><label>عنوان آزمون<input name="name" required maxlength="250"></label><label>زیرشاخص<input name="sub" required maxlength="200"></label></div><label>روش اجرای آزمون<textarea name="profile" required maxlength="3000"></textarea></label><label>راهنمای ارزیابی کیفی<textarea name="measure" required maxlength="3000"></textarea></label><button class="primary" '+(readOnly?'disabled':'')+'>افزودن آزمون</button></form></details>'}
document.addEventListener('submit',e=>{if(e.target.id!=='staticTestForm')return;e.preventDefault();if(readOnly)return;const f=new FormData(e.target),test={id:'CUSTOM-'+crypto.randomUUID(),cat:f.get('cat'),sub:f.get('sub').trim(),name:f.get('name').trim(),profile:f.get('profile').trim(),measure:f.get('measure').trim(),vehicle:{},scope:['supplementary']};if(!test.name||!test.sub||!test.profile||!test.measure)return;const previous=mission('supplementary:general');edit('missions','supplementary:general',{...previous,customTests:[...(previous.customTests||[]),test]});render();toast('آزمون استاتیک افزوده شد.');});
document.addEventListener('bamco:render',routeChoices);

state.tab='home';
})();


