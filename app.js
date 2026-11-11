
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
 if(result.durabilityPlannerVersion===1)result.durDays=window.BAMCO_LEGACY_PLANNER.calculate({target:num(result.durKm),twoDiff:result.twoDiff,caps:result.routeCaps,startOdo:num(result.startOdo)}).days;
 return result;
}
function twoDifferentials(){return conf().twoDiff==='yes'}
const state={config:{...defaultConfig},tab:'setup',driveDay:1,durDay:1,category:'همه',query:'',page:0,records:{},mileage:{drive:{},durability:{}},setupComplete:false};
const sourceRepeats=atob('AAAAAAECAgICAgIBAAAAAAAAAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAgMBAQEBAAICAQICAgIAAQECAgICAgICAgICAgQBAQEAAAAAAQEBAQEBAQEBAQMBAAEBAQEBAwEAAQICAgICAgIBAQEBAQEBAQEBAQEBAQEAAAEAAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAEBAQEBAgICAQICAQEAAQEBAQICAwEBAQEDAQEBAQEBAwMBAwEBAQMAAAEBAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBBAQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAABAAABAAADAwIBAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEDAQMBAAEAAQEBBQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEEAQEBAQEBAQEBAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQIAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAACAQIBAAAAAAEBAQEBAQEBAQAAAAAAAAECAgICAQEBAQAAAQAAAQEBAAEAAAEAAAAAAAEBAQEBAQABAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQABAAABAQEBAQEBAQABAQEBAQEAAAAAAAAAAAADAAAAAAAAAAEAAAAAAAAAAQEAAAAAAAAAAwAAAAAAAQACAAAAAAAAAAAAAQABAQAEAAICAQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAQICAgICAQEBAQEBAQEAAAABAAEAAQEBAQEBAQEDAwAAAQEBAQEBAAAAAQEAAAABAwABAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAA'),sourceLoads=atob('AAAAAAABAQEBAQEBAAAAAAEBAgICAgICAgIBAQECAgICAgEBAQEBAQEBAQEBAQEBAgICAgICAgICAgIAAAAAAAACAgICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgICAgICAgICAgICAQEBAQEBAQMDAwMDAwMDAwAAAAAAAAACAAAAAAAAAAAABAAAAAUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAICAgAAAAAAAAAGBwYGAgICCAgICAEICAgICAEBCAgIAgICAgICAgIICAgICAgICAgEBAgICAgCCAgICAgICAgICAgICAkICAgICgoKCgEKCgoICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCAgICAgICCAgICAgICAgIAgICCAgICAgICAgCCAgICAgAAAAAAgIICAgCAgICAgICAgIICAgICAgICAgIAAsFCAgICAgIDAwICAgICAgICAICAgICAgICAggICAENAAAAAAAAAAAAAAAFAgICAgICAQICAgICAgICAgICAgICAgIICAgICAgIAgICAgIBAQIBAgICAgIKCgoCAgICAgICAQECAgICAgECAgEKAgIBAgICAgICAggICA4PDg4OCAoCCAgCAgIBAgICAgICAQECAgICAgICAgICAgEBAQECAgIPAQsCAgICCAgIEAEBAgICAgICAgICAgECAQICAgICAgICCAgIAgICAgICAgICAgIAAAAAAAAAAAAAAAACAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgICAgICAQEBAgEBAgICAgICAQEBAQEBAgIHBwcHBwcHBwcHBwICAgICAgICAgIICAgICAgICAgICAICAgIICAgCAgICCAgICAgICAgICAgICAgICAICAgICAgICAgICAgIAAAAAAAAAAAAAAAAAAAICAgICAgAAAAAAAAAAAAACAQICAAAAAAICAgIICAgIAQICAgICAgIAAAAAAgICAgAAAAAAAAAAAAAAAAAAAAICAgICAgEBAQEBAgICAgICAQEBAgIBAQEBAQICAgICAQEBAQECAgIBAQEEBAQEBAQEBAcHBwcAAAAAAAAAAAAIBwACAgICAhEAAAAAAAAAERECAAAAAAAAAAAAAAAAAQcHBwIHBwcHBwcHAAENDQ0NDQ0NDQ0CAgICAgICAgICAgICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgICAAAAAAAAAAAAAAAAAAAAAAAHBwcSEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIS'),sourceLoadLabels=["وزن خالص خودرو","راننده و سرنشین","فقط راننده","سرنشینان کامل","بدون بار / بار کامل","بدون بار صندوق / بار کامل صندوق","بدون بار / نیمه‌بار / حداکثر ظرفیت بار","بدون بار","فقط راننده / بار کامل","سرنشینان کامل / بار کامل صندوق","فقط راننده / نیمه‌بار","بار یدک","بار کامل","راننده و سرنشین / بار کامل","فقط راننده / بار کامل / حداکثر وزن مجاز","بار کامل / حداکثر وزن مجاز","طبق دفترچه سازنده / بارهای تعریف‌شده در پیمایش","وزن خالص خودرو / حداکثر وزن مجاز","قابل اعمال نیست – تحلیل اقتصادی/بازار"];
function sourceFields(t){const match=String(t.baseId||t.id).split('@')[0].match(/^CR-(\d+)$/);const n=match?Number(match[1])-2:-1;return n>=0&&n<sourceRepeats.length?{repeats:['1','3','5','2','10','8'][sourceRepeats.charCodeAt(n)],load:sourceLoadLabels[sourceLoads.charCodeAt(n)]}:{repeats:t.minRepeats??t.repetitions,load:t.loadCondition??t.load};}
const categories=[...new Set(DB.tests.map(x=>x.cat))];
const testById=new Map(DB.tests.map(x=>[x.id,x]));
const lookupTest=testById.get.bind(testById);testById.get=id=>lookupTest(id)||lookupTest(String(id).split('@')[0])||staticCustomTests().find(t=>t.id===id);
const byId=id=>document.getElementById(id);
const num=v=>Number(typeof v==='string'?v.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,]/g,'').replace('٫','.'):v);
const number=n=>num(n||0).toLocaleString(window.BAMCO_I18N?.language==='fa'||!window.BAMCO_I18N?'fa-IR':'en-US',{maximumFractionDigits:3}).replace(/٫/g,'.').replace(/٬/g,',');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه');
let cloudSave, readOnly = false, dayScreen = 'days';
function snapshot(){return {config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete,missions:state.missions||{},durabilitySchedule:state.durabilitySchedule,checkpointAssignments:state.checkpointAssignments||{}}}
function save(){if(readOnly)return false;if(cloudSave){cloudSave(snapshot());return true}try{localStorage.setItem(KEY,JSON.stringify(snapshot()));return true}catch(e){toast('حافظه مرورگر پر شده است؛ نسخه پشتیبان بگیرید.');return false}}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v){state.config=normalizeConfig(v.config||{},Boolean(v.setupComplete));delete state.config.cabin;delete state.config.seatRows;delete state.config.offroad;state.records=v.records||{};state.missions=v.missions||{};state.durabilitySchedule=v.durabilitySchedule;state.checkpointAssignments=v.checkpointAssignments||{};state.mileage=v.mileage||{drive:{},durability:{}};state.setupComplete=Boolean(v.setupComplete);state.tab=state.setupComplete?'drive':'setup';}}catch(e){console.warn('Cannot read saved assessment',e)}}
let tm;function toast(s){const t=byId('toast');t.textContent=s;t.classList.remove('hidden');clearTimeout(tm);tm=setTimeout(()=>t.classList.add('hidden'),3200)}
function conf(){return state.config}
function parts(s){return String(s||'').split(/\s*\/\s*|\s*\|\s*/).map(x=>x.trim()).filter(Boolean)}
function allowed(rule,value){if(Array.isArray(rule))return rule.includes(String(value));if(rule==='None')return false;if(!rule||rule==='All')return true;return parts(rule).includes(String(value))}
function applicable(t){const v=t.vehicle||{},c=conf();return allowed(v.cls,c.vclass)&&allowed(v.body,c.body)&&allowed(v.power,c.power)&&allowed(v.gear,c.gear)&&allowed(v.drive,c.driveType)}
function staticCustomTests(){return (state.missions?.['supplementary:general']?.customTests||[]).map(t=>({...t,scope:['supplementary']}))}
const candidates=tab=>[...DB.tests,...(tab==='supplementary'?staticCustomTests():[])].filter(t=>t.scope.includes(tab==='drive'?'drive':tab==='durability'?'durability':'supplementary')&&applicable(t));
function plannerConfig(c=conf()){return {target:num(c.durKm),twoDiff:c.twoDiff,caps:c.routeCaps,startOdo:num(c.startOdo),shares:c.routeShares,origin:c.startCity||'تهران',catalog:DB.roadCatalog}}
function targetRows(){return planner.calculate(plannerConfig()).rows}

function activeRoutes(){const a=DB.routes.filter(r=>(conf().body==='Off-road'||conf().driveType==='4WD')||(!/خارج.?جاده|خاکی/i.test(r.name)));const total=a.reduce((v,x)=>v+Math.max(0,x.durShare),0);return a.map(x=>({...x,share:x.durShare/total}))}
function dayCategoryPlan(){
 if(state.durabilitySchedule)return state.durabilitySchedule;
 if(conf().durabilityPlannerVersion===2)return planner.calculate(plannerConfig()).schedule;
 if(conf().durabilityPlannerVersion===1)return window.BAMCO_LEGACY_PLANNER.calculate(plannerConfig()).schedule;
 return legacyDayCategoryPlan();
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
 // Previously saved assessments keep their original score cards accessible.
 for(const key of Object.keys(state.records).filter(k=>k.startsWith('durability:'+day+':'))){const id=key.split(':').pop();if(!items.some(t=>t.id===id)){const t=testById.get(id);if(t){const historical={...t,id};testById.set(id,historical);items.push(historical)}}}
 return items;
}

function currentDay(){return state.tab==='drive'?state.driveDay:state.durDay}
function scope(){return state.tab}
function dayItems(){
if(state.tab==='supplementary')return candidates('supplementary');
if(state.tab==='drive')return candidates('drive').filter(t=>t.days.includes(state.driveDay));
return durabilityTestsForDay(state.durDay,dayCategoryPlan())
}
function ratedKey(t){return state.tab+':'+(state.tab==='supplementary'?'general':currentDay())+':'+t.id}
function record(t){return state.records[ratedKey(t)]||{}}
function avg(items){if(!items.length)return null;return items.reduce((a,b)=>a+b,0)/items.length}
function scoresForTab(tab){return Object.entries(state.records).filter(([k,v])=>k.startsWith(tab+':')&&num(v.score)>=1&&num(v.score)<=10).map(([k,v])=>({id:k.split(':').pop(),score:num(v.score),entry:v}))}
function viewSummary(items){const scored=items.filter(t=>num(record(t).score)>0).length;return [items.length,scored]}
function readSetup(){
 const config={...conf(),durabilityPlannerVersion:2,routeCaps:{},routeShares:{},startCity:byId('startCity').value};
 for(const key of setupKeys){const el=byId(key);config[key]=['driveKm','durKm'].includes(key)?num(el.value):el.value}
 for(const route of planner.routes){config.routeCaps[route.id]=num(byId('cap-'+route.id).value);config.routeShares[route.id]=num(byId('share-'+route.id).value);}
 return config;
}
function updatePlannerPreview(){
 try{
  const config=readSetup(),plan=planner.calculate(plannerConfig(config));
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
function protectedDay(day){return Object.hasOwn(state.mileage.durability||{},day)||Object.keys(state.records).some(k=>k.startsWith('durability:'+day+':'))||Object.keys(state.missions?.['durability:'+day]||{}).length>0}
function hasProtectedDay(fromDay){return dayCategoryPlan().some(p=>p.day>=fromDay&&protectedDay(p.day))}
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

function renderKpis(items){
const total=state.tab==='drive'?candidates('drive').length:state.tab==='durability'?candidates('durability').length:candidates('supplementary').length;
const count=scoresForTab(state.tab).length,mean=avg(scoresForTab(state.tab).map(x=>x.score));
const current=state.tab==='drive'?state.driveDay:state.durDay;
const days=state.tab==='supplementary'?'بدون زمان‌بندی':(state.tab==='drive'?26:num(conf().durDays))+' روز';
byId('kpis').innerHTML=[
['آزمون‌های قابل‌اجرا',number(total)],['نمره‌های ثبت‌شده',number(count)],['میانگین نمره',mean==null?'—':number(mean)+' / ۱۰'],['برنامه ارزیابی',days]
].map(x=>'<div class="kpi"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>').join('')
}
function renderCategories(items){
const grouped=new Map();items.forEach(t=>grouped.set(t.cat,(grouped.get(t.cat)||0)+1));
byId('categories').innerHTML=['<button class="cat-item '+(state.category==='همه'?'active':'')+'" data-category="همه"><span>همه شاخص‌ها</span><span>'+number(items.length)+'</span></button>'].concat(categories.filter(c=>grouped.has(c)).map(c=>'<button class="cat-item '+(state.category===c?'active':'')+'" data-category="'+esc(c)+'"><span>'+esc(c)+'</span><span>'+number(grouped.get(c))+'</span></button>')).join('')
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
function renderDayNavigation(){
 const c=dayContext(),host=byId('dayNavigation');
 host.classList.toggle('hidden',!c||!['days','menu'].includes(dayScreen));
 if(!c){host.replaceChildren();return}
 if(dayScreen==='days'){
  const plan=state.tab==='drive'?driveProgram():dayCategoryPlan();
  host.innerHTML='<div class="assessment-days-grid">'+plan.map(p=>{const theme=dayRouteAppearance(p);return '<button type="button" class="assessment-day-tile" data-route="'+esc(theme.kind)+'" data-needs-route="'+Boolean(p.needsRoute)+'" data-day="'+p.day+'" aria-label="روز '+number(p.day)+'، '+esc(theme.label)+'"><span class="day-card-top"><strong><span class="day-word">روز </span>'+number(p.day)+'</strong></span><span class="day-route-icon">'+theme.icon+'</span><span class="day-card-footer"><span class="day-route-label">'+esc(theme.label)+'</span><small>'+number(p.km)+' کیلومتر</small>'+(p.needsRoute?'<small>نیازمند انتخاب مسیر</small>':'')+'</span></button>'}).join('')+'</div>';
 }else if(dayScreen==='menu'){
  host.innerHTML='<div class="assessment-day-sections">'+[
   ['form','فرم روزانه','ثبت اطلاعات پیمایش و شرایط روز','▤'],
   ['route','مسیر پیمایش','مشاهده نقشه و مشخصات مسیر','↗'],
   ['scores','امتیازدهی','ثبت نمره، یادداشت و تصویر آزمون‌ها','☆']
  ].map(([key,title,detail,icon])=>'<button type="button" class="assessment-day-card" data-daysection="'+key+'"><span class="assessment-day-icon" aria-hidden="true">'+icon+'</span><strong>'+title+'</strong><small>'+detail+'</small></button>').join('')+'</div>';
 }
}
function navigateDay(section){
 if(!dayContext()||!['days','menu','form','route','scores'].includes(section))return;
 dayScreen=section;render();window.scrollTo({top:0,behavior:'smooth'});
}

function renderSchedule(){
const s=byId('schedulePanel');
if(state.tab==='supplementary'){s.innerHTML='<div class="section-heading"><div><h2>پرسشنامه تکمیلی</h2><p>این موارد برنامه روزانه ندارند و بر اساس وضعیت خودرو قابل ارزیابی هستند.</p></div><span class="chip">بدون روز و کیلومتر</span></div>';return}
const plan=state.tab==='drive'?driveProgram():dayCategoryPlan(),d=state.tab==='drive'?state.driveDay:state.durDay,p=plan[d-1],milestone=state.tab==='durability'?(checksOnPlan(plan).get(d)||[]):[];
if(!p){s.innerHTML='<div class="empty">برنامه روزانه پیدا نشد.</div>';return}
const indexText=state.tab==='drive'?'برنامه ۲۶ روزه قابلیت رانندگی':'برنامه انعطاف‌پذیر دوام';

const remainingMeta=(state.tab==='durability'?'<span class="meta-tag">پیمایش تجمعی برنامه: '+number(p.cum)+' کیلومتر</span>':'')+(milestone.length?'<span class="meta-tag">کنترل: '+milestone.map(x=>number(x)+'٪').join('، ')+'</span>':'');
s.innerHTML='<div id="bamco-day-route" class="bamco-day-route">'+(remainingMeta?'<div class="day-meta">'+remainingMeta+'</div>':'')+(p.over?'<div class="notice">هدف پیمایش این روز از سقف پیشنهادی نوع مسیر بیشتر است. پیش از اجرای میدانی مسیر یا تعداد روزها را بازبینی کنید.</div>':'')+mapHtml(p)+'</div>'

}
const scoreColors=[null,['#f9e6ea','#e7b0ba','#ac2441'],['#fae1e5','#eba2b0','#be304a'],['#fae8e1','#f5b49d','#c84c33'],['#fff0df','#f5c09a','#cf752a'],['#fff4df','#f5ce8f','#cb8a1d'],['#fff7dd','#e9d075','#b79817'],['#eff6df','#bdd889','#619825'],['#e4f4e8','#9fd5ad','#22834e'],['#def1eb','#93ceb6','#167d55'],['#dcefe8','#85c1aa','#0e7451']];
function renderQuestions(){
const all=dayItems();
if(state.category!=='همه'&&!all.some(t=>t.cat===state.category))state.category='همه';
renderCategories(all);
const q=fa(state.query).toLowerCase();
const filtered=all.filter(t=>(state.category==='همه'||t.cat===state.category)&&(!q||fa([t.id,t.cat,t.sub,t.name].join(' ')).toLowerCase().includes(q)));
const size=12,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(state.page,pages-1);state.page=page;
const select=filtered.slice(page*size,(page+1)*size);
let html='<div class="section-heading"><div><h2>فهرست آزمون‌های '+(state.tab==='drive'?'قابلیت رانندگی':state.tab==='durability'?'دوام عملکردی':'تکمیلی')+'</h2><p>'+number(all.length)+' آزمون در این بخش · '+number(filtered.length)+' مورد مطابق فیلتر</p></div><input class="search" id="questionSearch" placeholder="جست‌وجوی شاخص یا عنوان آزمون" value="'+esc(state.query)+'"></div>';
if(state.tab==='durability'&&!Object.hasOwn(state.mileage.durability,state.durDay))html+='<p class="notice">پیش‌نمایش آزمون‌ها بر اساس برنامه است؛ برای ثبت نمره ابتدا پیمایش واقعی روز را ذخیره کنید.</p>';
if(!select.length)html+='<div class="empty">آزمونی مطابق فیلتر یا روز انتخاب‌شده پیدا نشد.</div>';
for(const t of select){
const rec=record(t),colors=scoreColors;
html+='<article class="question '+(t.id.startsWith('CUSTOM-')?'user-authored':'')+'" id="q-'+esc(t.id)+'"><div class="question-head"><div><div class="test-hierarchy"><span>شاخص: '+esc(fa(t.cat))+'</span><span>زیرشاخص: '+esc(fa(t.sub))+'</span></div><h3>'+esc(fa(t.name))+'</h3></div></div>';
const extra=sourceFields(t);const details=[['شرایط آزمون',t.profile],['حالت بار',extra.load],['روش سنجش',t.measure]];
html+='<dl class="test-conditions">'+details.filter(([label,value])=>value!==undefined&&value!==null&&String(value).trim()!=='').map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(fa(value))+'</dd></div>').join('')+'</dl>';
html+='<div class="scores" role="group" aria-label="نمره آزمون از ۱ تا ۱۰">';
for(let i=1;i<=10;i++){let c=colors[i];html+='<button class="score '+(num(rec.score)===i?'selected':'')+'" data-score="'+i+'" data-test="'+esc(t.id)+'" title="'+esc(scoreWords[i])+'" style="--score-bg:'+c[0]+';--score-border:'+c[1]+';--score-text:'+c[2]+'"><strong>'+number(i)+'</strong><small>'+esc(scoreWords[i])+'</small></button>'}
html+='</div><details class="assessment-attachment" '+(rec.note||rec.photo?'open':'')+'><summary><span class="attachment-plus" aria-hidden="true">+</span>افزودن یادداشت یا تصویر</summary><div class="note-wrap"><div class="note-actions"><label class="label-block" for="note-'+esc(t.id)+'">یادداشت ارزیاب</label><span class="tiny">در صورت نیاز تصویر هم پیوست کنید.</span></div><textarea id="note-'+esc(t.id)+'" data-note="'+esc(t.id)+'" placeholder="مشاهده، ایراد یا نکته قابل پیگیری را ثبت کنید...">'+esc(rec.note||'')+'</textarea><div class="note-actions"><label class="photo-picker"><input class="photo-input" type="file" accept="image/*" data-photo="'+esc(t.id)+'" aria-label="انتخاب تصویر آزمون"><span class="photo-picker-button">انتخاب تصویر</span><span class="photo-file-name">'+(rec.photo?'تصویر ثبت شده است':'تصویری انتخاب نشده است')+'</span></label>'+(rec.photo?'<img src="'+rec.photo+'" alt="تصویر ثبت‌شده برای آزمون">':'')+'</div></div></details></article>'
}
html+='<div class="toolbar"><button class="secondary" data-pagejump="'+(page-1)+'" '+(page===0?'disabled':'')+'>صفحه قبل</button><span class="tiny">صفحه '+number(page+1)+' از '+number(pages)+'</span><button class="secondary" data-pagejump="'+(page+1)+'" '+(page>=pages-1?'disabled':'')+'>صفحه بعد</button></div>';
byId('questionsPanel').innerHTML=(state.tab==='supplementary'?staticTestForm():'')+html
}

function renderGate(){
 const landing=byId('landing'),modules=byId('moduleLanding');
 const main=state.tab==='home'||state.tab==='modules';
 landing.classList.toggle('hidden',state.tab!=='home');
 modules.classList.toggle('hidden',state.tab!=='modules');
 byId('innerHero').classList.toggle('hidden',state.tab==='home');
 byId('legacySteps').classList.add('hidden');
 byId('backModulesBtn').classList.toggle('hidden',main||Boolean(dayContext()&&dayScreen!=='days'));
 byId('assessmentBack').classList.toggle('hidden',state.tab!=='modules');
 if(state.tab==='home'&&!document.getElementById('assessmentHub'))landing.innerHTML='<div class="gate-eyebrow">BAMCO · VEHICLE ASSESSMENT</div><h1 class="gate-title welcome-title">کیفیت از <span>ارزیابی دقیق</span> آغاز می‌شود.</h1><div class="welcome-divider" aria-hidden="true"><i></i><i></i><i></i></div><div class="gate-grid one"><button type="button" class="gate-card" data-open="setup"><span class="gate-illustration">◇</span><strong>مشخصات خودرو</strong><span class="gate-cta">ورود و تکمیل اطلاعات ←</span></button></div>';
 if(state.tab==='modules')modules.innerHTML='<div class="gate-grid">'+[
 ['setup','۰۱','ویرایش مشخصات','ویرایش مشخصات خودرو و برنامه آزمون','◇'],
 ['drive','۰۱','قابلیت رانندگی','برنامه ۲۶ روزه، مسیرهای پیشنهادی و نمره‌دهی روزانه','↗'],
 ['durability','۰۲','آزمون دوام','برنامه منعطف کیلومتری، کنترل‌های دوره‌ای و ثبت عملکرد','↗'],
 ['supplementary','۰۳','پرسشنامه تکمیلی','شاخص‌های تکمیلی و ارزیابی بدون محدودیت روزانه','↗'],
 ['results','۰۴','گزارش و نتایج','میانگین شاخص‌ها و مقایسه برنامه مسیر با پیمایش واقعی','↗']
 ].map(x=>'<button type="button" class="gate-card" data-gate-icon="'+(x[0]==='setup'?'editSetup':x[0])+'" data-open="'+x[0]+'"><span class="gate-illustration">'+x[4]+'</span><strong>'+x[2]+'</strong><span class="gate-cta">ورود به بخش ←</span></button>').join('')+'</div>';
}
function routeClassification(s){
 const v=String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک');
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
  const k=tab==='durability'?p.type:routeClassification(p.type||p.route);group[k]??={target:0,actual:0,days:0};
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
let all=Object.values(state.records).filter(x=>num(x.score)>=1&&num(x.score)<=10).length;
let html='<div class="section-heading"><div><h2>نتایج عملکرد و میانگین شاخص‌ها</h2><p>ملاک محاسبه، میانگین حسابی نمره‌های ثبت‌شده از ۱ تا ۱۰ است. آزمون‌های بدون نمره وارد میانگین نمی‌شوند.</p></div><span class="chip">'+number(all)+' نمره ثبت‌شده</span></div>';
const sumAll=Object.values(state.records).map(x=>num(x.score)).filter(x=>x>=1&&x<=10);
html+='<div class="kpis"><div class="kpi"><small>میانگین کل</small><strong>'+(avg(sumAll)==null?'—':number(avg(sumAll)))+'</strong></div><div class="kpi"><small>کل ارزیابی‌ها</small><strong>'+number(sumAll.length)+'</strong></div><div class="kpi"><small>آزمون‌های بانک اصلی</small><strong>'+number(DB.tests.length)+'</strong></div><div class="kpi"><small>شاخص‌های اصلی</small><strong>'+number(categories.length)+'</strong></div></div>';
for(const section of [{key:'drive',label:'قابلیت رانندگی'},{key:'durability',label:'دوام عملکردی'},{key:'supplementary',label:'پرسشنامه تکمیلی'}]){
let vals=scoresForTab(section.key);
html+='<h3 style="margin:27px 0 11px;color:#1b4b70">'+section.label+' — میانگین '+(avg(vals.map(x=>x.score))==null?'—':number(avg(vals.map(x=>x.score))))+'</h3><div style="overflow-x:auto"><table class="result-table"><thead><tr><th>شاخص اصلی</th><th>تعداد نمره</th><th>میانگین از ۱۰</th><th>نمایش میانگین</th></tr></thead><tbody>';
for(const cat of categories){const grouped=new Map();for(const x of vals){if(testById.get(x.id)?.cat!==cat)continue;const bucket=grouped.get(x.id)||[];bucket.push(x.score);grouped.set(x.id,bucket);}const a=[...grouped.values()].map(scores=>avg(scores));if(!a.length)continue;html+='<tr><td>'+esc(fa(cat))+'</td><td>'+number(a.length)+'</td><td><b>'+number(avg(a))+'</b></td><td><div class="bar"><i style="width:'+(avg(a)*10)+'%"></i></div></td></tr>'}
html+='</tbody></table></div>';
}
html+='<div class="toolbar"><button class="primary" data-exportcsv="1">دریافت گزارش Excel</button><button class="secondary" data-import="1">بازیابی فایل پشتیبان JSON</button><button class="secondary" data-clear="1">پاک‌کردن نمره‌ها</button></div><p class="disclaimer">نتایج مربوط به ارزیابی فعال هستند؛ میانگین‌ها فقط از نمره‌های ثبت‌شده محاسبه می‌شوند.</p>';
html+=routeMixHtml('drive')+routeMixHtml('durability');byId('resultsPanel').innerHTML=html
}
function render(){
document.body.dataset.view=state.tab;
renderGate();
const titles={home:['',''],modules:['بخش‌های ارزیابی',''],setup:['تنظیم مشخصات خودرو و برنامه آزمون','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.'],drive:['آزمون قابلیت رانندگی','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا'],durability:['آزمون دوام عملکردی','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف'],supplementary:['پرسشنامه تکمیلی','ارزیابی‌های مستقل از برنامه کیلومتری'],results:['نتایج و میانگین‌ها','خلاصه نمره هر شاخص و هر حوزه ارزیابی']};
const daily=dayContext();
const sectionNames={menu:'',form:'فرم روزانه',route:'مسیر پیمایش',scores:'امتیازدهی'};
byId('pageTitle').textContent=titles[state.tab][0];
let pageContext=byId('pageContext');
if(!pageContext){pageContext=document.createElement('div');pageContext.id='pageContext';pageContext.className='page-context';byId('pageTitle').insertAdjacentElement('afterend',pageContext)}
pageContext.replaceChildren();
pageContext.classList.toggle('hidden',!daily||dayScreen==='days');
if(daily&&dayScreen!=='days'){
 const day=document.createElement('span');day.className='page-day-chip';day.textContent='روز '+number(daily.day);pageContext.append(day);
 if(sectionNames[dayScreen]){const section=document.createElement('span');section.className='page-section-chip';section.textContent=sectionNames[dayScreen];pageContext.append(section)}
}
byId('pageSub').textContent=titles[state.tab][1];
byId('headerVehicle').textContent=conf().vclass+' · '+conf().body+' · '+conf().power+' · '+conf().driveType;
document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('active',e.dataset.tab===state.tab));
byId('setupPanel').classList.toggle('hidden',state.tab!=='setup');
byId('workPanel').classList.toggle('hidden',!['drive','durability','supplementary'].includes(state.tab));
byId('resultsPanel').classList.toggle('hidden',state.tab!=='results');
byId('editSetupBtn').classList.add('hidden');
document.querySelectorAll('.bamco-day-final,.bamco-day-extra').forEach(el=>el.remove());
renderDayNavigation();
const workspace=byId('workPanel').querySelector('.workspace');
workspace.classList.toggle('hidden',Boolean(daily)&&['days','menu'].includes(dayScreen));
workspace.classList.toggle('assessment-single-section',Boolean(daily)&&dayScreen!=='scores');
byId('kpis').classList.toggle('hidden',Boolean(daily));
byId('schedulePanel').classList.toggle('hidden',Boolean(daily)&&dayScreen==='scores');
byId('questionsPanel').classList.toggle('hidden',Boolean(daily)&&dayScreen!=='scores');
workspace.querySelector('.sidebar').classList.toggle('hidden',Boolean(daily)&&dayScreen!=='scores');
if(state.tab==='setup')renderSetup();
else if(state.tab==='results')renderResults();
else if(!['home','modules'].includes(state.tab)){
 if(!daily){const items=dayItems();renderKpis(items);renderSchedule();renderQuestions()}
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
function changeTab(tab){if(!['setup','home'].includes(tab)&&!state.setupComplete){toast('ابتدا مشخصات خودرو را ثبت کنید.');return}dayScreen='days';state.tab=tab;state.category='همه';state.query='';state.page=0;render();window.scrollTo({top:0,behavior:'smooth'})}
function exportFile(content,name,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportJSON(){exportFile(JSON.stringify({schema:1,savedAt:new Date().toISOString(),...snapshot()},null,2),'BAMCO-assessment-backup.json','application/json;charset=utf-8');toast('فایل پشتیبان آماده شد.')}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}

function scoreForDay(tab,day,id){const prefix=tab+':'+day+':'+id;const values=Object.entries(state.records).filter(([k])=>k===prefix||k.startsWith(prefix+'@')).map(([,v])=>num(v.score)).filter(x=>x>=1&&x<=10);return avg(values)}
function excelReportSheets(){
 const specs=[
  {tab:'drive',name:'قابلیت رانندگی',days:26},
  {tab:'durability',name:'آزمون دوام',days:dayCategoryPlan().length},
  {tab:'supplementary',name:'آزمون تکمیلی',days:0}
 ];
 return specs.map(({tab,name,days})=>{
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

function updateRating(btn){if(state.tab==='durability'&&!Object.hasOwn(state.mileage.durability,state.durDay)){toast('ابتدا پیمایش واقعی روز را در فرم روزانه ثبت کنید.');return}const id=btn.dataset.test,t=testById.get(id);if(!t)return;const k=ratedKey(t);const rec={...(state.records[k]||{})},selected=num(btn.dataset.score);if(num(rec.score)===selected)delete rec.score;else rec.score=selected;state.records[k]=rec;save();const sy=window.scrollY;render();window.scrollTo(0,sy)}
function uploadPicture(file,testId){const assessment=cloudSave;if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{if(assessment!==cloudSave)return;const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(im.width,im.height));canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.55),t=testById.get(testId);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),photo:data};if(save()){toast('عکس برای این آزمون ثبت شد.');const sy=window.scrollY;render();window.scrollTo(0,sy)}};im.src=reader.result};reader.readAsDataURL(file)}
byId('vehicleForm').addEventListener('input',updatePlannerPreview);
byId('vehicleForm').addEventListener('change',e=>{if(e.target.id==='twoDiff'&&!byId('vehicleForm').dataset.rendering)for(const r of planner.routes)byId('share-'+r.id).value=number(r.weights[e.target.value==='yes'?1:0]);updatePlannerPreview()});
byId('vehicleForm').addEventListener('submit',e=>{
 e.preventDefault();if(readOnly)return;
 const result=updatePlannerPreview();if(!result){toast('هدف و سقف‌های پیمایش را بررسی کنید.');return}
 const {config,plan}=result;
 if(!Number.isInteger(config.driveKm)||config.driveKm<1||config.driveKm>20000){toast('هدف قابلیت رانندگی باید عدد صحیح بین ۱ تا ۲۰٬۰۰۰ باشد.');return}
 if(!['yes','no'].includes(config.twoDiff)){toast('وضعیت دو دیفرانسیل را انتخاب کنید.');return}
 if(hasProtectedDay(1)){const before=JSON.stringify(targetRows().map(r=>[r.id,r.km,r.cap])),after=JSON.stringify(plan.rows.map(r=>[r.id,r.km,r.cap]));if(before!==after||num(conf().startOdo)!==config.startOdo||conf().twoDiff!==config.twoDiff){toast('برای حفظ اطلاعات ثبت‌شده، سهم‌ها و هدف برنامه آغازشده ثابت هستند؛ مسیر روزهای انجام‌نشده را از نقشه تغییر دهید.');return}config.durDays=dayCategoryPlan().length;}else{state.durabilitySchedule=plan.schedule;config.durDays=plan.days;}state.config=config;state.setupComplete=true;save();changeTab('modules');toast('مشخصات خودرو ثبت و برنامه دوام محاسبه شد.');
});
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.open){changeTab(el.dataset.open);return}if(el.dataset.tab){changeTab(el.dataset.tab);return}
if(el.id==='editSetupBtn'){changeTab('setup');return}
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
document.addEventListener('change',e=>{const el=e.target;if(readOnly)return;if(el.dataset.note){const t=testById.get(el.dataset.note);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),note:el.value};save();return}if(el.dataset.photo){uploadPicture(el.files?.[0],el.dataset.photo);return}});
document.addEventListener('input',e=>{if(e.target.id==='questionSearch'){state.query=e.target.value;state.page=0;const field=e.target;const pos=field.selectionStart;renderQuestions();const newField=byId('questionSearch');newField.focus();newField.setSelectionRange(pos,pos)}});
byId('importBackup').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const assessment=cloudSave;const fr=new FileReader();fr.onload=()=>{if(assessment!==cloudSave)return;try{const obj=JSON.parse(fr.result);if(!obj||!obj.records||!obj.config)throw Error('Invalid');if(!confirm('اطلاعات موجود با فایل پشتیبان جایگزین شود؟'))return;state.config=normalizeConfig(obj.config,true);state.records=obj.records;state.mileage=obj.mileage||{drive:{},durability:{}};state.missions=obj.missions||{};state.durabilitySchedule=obj.durabilitySchedule;state.checkpointAssignments=obj.checkpointAssignments||{};state.setupComplete=true;save();render();toast('بازیابی پشتیبان انجام شد.')}catch(err){toast('فایل JSON معتبر نیست.')}};fr.readAsText(file);e.target.value=''});
window.BAMCO_ASSESSMENT={
  open(data,onSave,locked){
    cloudSave=onSave;readOnly=locked;dayScreen='days';
    document.querySelectorAll('#vehicleForm button,#vehicleForm input,#vehicleForm select').forEach(el=>el.disabled=locked);
    Object.assign(state,{
      config:normalizeConfig(data.config||{},Boolean(data.setupComplete)),
      records:data.records||{},mileage:data.mileage||{drive:{},durability:{}},durabilitySchedule:data.durabilitySchedule,checkpointAssignments:data.checkpointAssignments||{},
      setupComplete:Boolean(data.setupComplete),missions:data.missions||{},driveDay:1,durDay:1,
      category:'همه',query:'',page:0,tab:data.setupComplete?'modules':'setup'
    });
    if(state.setupComplete&&!state.durabilitySchedule)state.durabilitySchedule=dayCategoryPlan().map(p=>({...p,routeId:p.routeId||dayRouteAppearance(p).kind}));
    if(state.durabilitySchedule)state.config.durDays=state.durabilitySchedule.length;
    render();
    window.scrollTo(0,0);
  },
  dayContext,
  snapshot,eligibleTests:candidates,currentTests:dayItems,drivePlan:driveProgram,refresh:render,
  durabilityPlan(){return dayCategoryPlan()},
  mission(key){return state.missions?.[key]||{}},
  setMission(key,mission){if(!cloudSave||readOnly)return;state.missions[key]=mission;save()},
  setDayMileage(tab,day,value){if(!cloudSave||readOnly||!['drive','durability'].includes(tab))return;const n=num(value);if(!Number.isFinite(n)||n<0)return;state.mileage[tab]=state.mileage[tab]||{};state.mileage[tab][day]=n;if(tab==='durability'){state.durabilitySchedule??=dayCategoryPlan();state.checkpointAssignments??={};state.checkpointAssignments[day]=planner.checkpoints(dayCategoryPlan(),state.mileage.durability,targetRows(),day);const plan=dayCategoryPlan(),last=Math.max(day,...plan.filter(p=>protectedDay(p.day)).map(p=>p.day));state.durabilitySchedule=planner.replan({plan,fromDay:last+1,rows:targetRows(),mileage:state.mileage.durability,startOdo:num(conf().startOdo),catalog:DB.roadCatalog});state.config.durDays=state.durabilitySchedule.length;state.config.durabilityPlannerVersion=2;}save()},
  dayProgress(){const items=dayItems(),scored=items.filter(t=>num(record(t).score)>=1&&num(record(t).score)<=10).length;return {total:items.length,scored,remaining:Math.max(0,items.length-scored),complete:items.length===0||scored===items.length}},
  isReadOnly(){return readOnly},
  home(){document.dispatchEvent(new Event('bamco:assessment-close'));cloudSave=null;readOnly=false;state.tab='home';render()},
  legacy(){try{
    const data=JSON.parse(localStorage.getItem(KEY)||'null');
    if(data)data.missions=JSON.parse(localStorage.getItem('bamco-drive-day-metadata-v2')||'{}');
    return data;
  }catch{return null}}
};

function staticTestForm(){return '<details class="static-test-builder"><summary>افزودن آزمون تکمیلی</summary><form id="staticTestForm"><div class="formgrid"><label>شاخص<select name="cat">'+categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select></label><label>عنوان آزمون<input name="name" required maxlength="250"></label><label>زیرشاخص<input name="sub" required maxlength="200"></label></div><label>روش اجرای آزمون<textarea name="profile" required maxlength="3000"></textarea></label><label>راهنمای ارزیابی کیفی<textarea name="measure" required maxlength="3000"></textarea></label><button class="primary" '+(readOnly?'disabled':'')+'>افزودن آزمون</button></form></details>'}
document.addEventListener('submit',e=>{if(e.target.id!=='staticTestForm')return;e.preventDefault();if(readOnly)return;const f=new FormData(e.target),test={id:'CUSTOM-'+crypto.randomUUID(),cat:f.get('cat'),sub:f.get('sub').trim(),name:f.get('name').trim(),profile:f.get('profile').trim(),measure:f.get('measure').trim(),vehicle:{},scope:['supplementary']};if(!test.name||!test.sub||!test.profile||!test.measure)return;state.missions??={};const previous=state.missions['supplementary:general']||{};state.missions['supplementary:general']={...previous,customTests:[...(previous.customTests||[]),test]};testById.set(test.id,test);save();render();toast('آزمون تکمیلی افزوده شد.');});
document.addEventListener('bamco:render',routeChoices);

load();state.tab='home';render();
})();

