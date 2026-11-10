
(function(){
'use strict';
const DB=window.BAMCO_DATA;
const KEY='bamco-functional-assessment-v1';
const scoreWords=['','غیرقابل قبول','بحرانی','بسیار ضعیف','ضعیف','حداقل پذیرش','مرزی','قابل قبول','رضایت‌بخش','بسیار عالی','ممتاز'];
const planner=window.BAMCO_DURABILITY_PLANNER;
const defaultConfig={vclass:'M1',body:'Sedan',power:'ICE',gear:'Automatic',driveType:'FWD',twoDiff:'no',driveKm:5250,durKm:5000,durDays:13,startOdo:5000,durabilityPlannerVersion:1};
const setupKeys=['vclass','body','power','gear','driveType','twoDiff','driveKm','durKm','startOdo'];
function normalizeConfig(config={},complete=false){
 const result={...defaultConfig,...config,routeCaps:{...config.routeCaps}};
 if(config.twoDiff===undefined)result.twoDiff=['AWD','4WD'].includes(result.driveType)?'yes':'no';
 if(complete&&config.durDays!==undefined&&!config.durabilityPlannerVersion)result.durabilityPlannerVersion=0;
 if(result.durabilityPlannerVersion===1)result.durDays=planner.calculate({target:num(result.durKm),twoDiff:result.twoDiff,caps:result.routeCaps,startOdo:num(result.startOdo)}).days;
 return result;
}
function twoDifferentials(){return conf().twoDiff==='yes'}
const state={config:{...defaultConfig},tab:'setup',driveDay:1,durDay:1,category:'همه',query:'',page:0,records:{},mileage:{drive:{},durability:{}},setupComplete:false};
const sourceRepeats=atob('AAAAAAECAgICAgIBAAAAAAAAAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAgMBAQEBAAICAQICAgIAAQECAgICAgICAgICAgQBAQEAAAAAAQEBAQEBAQEBAQMBAAEBAQEBAwEAAQICAgICAgIBAQEBAQEBAQEBAQEBAQEAAAEAAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAEBAQEBAgICAQICAQEAAQEBAQICAwEBAQEDAQEBAQEBAwMBAwEBAQMAAAEBAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBBAQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAABAAABAAADAwIBAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEDAQMBAAEAAQEBBQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEEAQEBAQEBAQEBAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQIAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAACAQIBAAAAAAEBAQEBAQEBAQAAAAAAAAECAgICAQEBAQAAAQAAAQEBAAEAAAEAAAAAAAEBAQEBAQABAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQABAAABAQEBAQEBAQABAQEBAQEAAAAAAAAAAAADAAAAAAAAAAEAAAAAAAAAAQEAAAAAAAAAAwAAAAAAAQACAAAAAAAAAAAAAQABAQAEAAICAQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAQICAgICAQEBAQEBAQEAAAABAAEAAQEBAQEBAQEDAwAAAQEBAQEBAAAAAQEAAAABAwABAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAA'),sourceLoads=atob('AAAAAAABAQEBAQEBAAAAAAEBAgICAgICAgIBAQECAgICAgEBAQEBAQEBAQEBAQEBAgICAgICAgICAgIAAAAAAAACAgICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgICAgICAgICAgICAQEBAQEBAQMDAwMDAwMDAwAAAAAAAAACAAAAAAAAAAAABAAAAAUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAICAgAAAAAAAAAGBwYGAgICCAgICAEICAgICAEBCAgIAgICAgICAgIICAgICAgICAgEBAgICAgCCAgICAgICAgICAgICAkICAgICgoKCgEKCgoICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCAgICAgICCAgICAgICAgIAgICCAgICAgICAgCCAgICAgAAAAAAgIICAgCAgICAgICAgIICAgICAgICAgIAAsFCAgICAgIDAwICAgICAgICAICAgICAgICAggICAENAAAAAAAAAAAAAAAFAgICAgICAQICAgICAgICAgICAgICAgIICAgICAgIAgICAgIBAQIBAgICAgIKCgoCAgICAgICAQECAgICAgECAgEKAgIBAgICAgICAggICA4PDg4OCAoCCAgCAgIBAgICAgICAQECAgICAgICAgICAgEBAQECAgIPAQsCAgICCAgIEAEBAgICAgICAgICAgECAQICAgICAgICCAgIAgICAgICAgICAgIAAAAAAAAAAAAAAAACAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgICAgICAQEBAgEBAgICAgICAQEBAQEBAgIHBwcHBwcHBwcHBwICAgICAgICAgIICAgICAgICAgICAICAgIICAgCAgICCAgICAgICAgICAgICAgICAICAgICAgICAgICAgIAAAAAAAAAAAAAAAAAAAICAgICAgAAAAAAAAAAAAACAQICAAAAAAICAgIICAgIAQICAgICAgIAAAAAAgICAgAAAAAAAAAAAAAAAAAAAAICAgICAgEBAQEBAgICAgICAQEBAgIBAQEBAQICAgICAQEBAQECAgIBAQEEBAQEBAQEBAcHBwcAAAAAAAAAAAAIBwACAgICAhEAAAAAAAAAERECAAAAAAAAAAAAAAAAAQcHBwIHBwcHBwcHAAENDQ0NDQ0NDQ0CAgICAgICAgICAgICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgICAAAAAAAAAAAAAAAAAAAAAAAHBwcSEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIS'),sourceLoadLabels=["وزن خالص خودرو","راننده و سرنشین","فقط راننده","سرنشینان کامل","بدون بار / بار کامل","بدون بار صندوق / بار کامل صندوق","بدون بار / نیمه‌بار / حداکثر ظرفیت بار","بدون بار","فقط راننده / بار کامل","سرنشینان کامل / بار کامل صندوق","فقط راننده / نیمه‌بار","بار یدک","بار کامل","راننده و سرنشین / بار کامل","فقط راننده / بار کامل / حداکثر وزن مجاز","بار کامل / حداکثر وزن مجاز","طبق دفترچه سازنده / بارهای تعریف‌شده در پیمایش","وزن خالص خودرو / حداکثر وزن مجاز","قابل اعمال نیست – تحلیل اقتصادی/بازار"];
function sourceFields(t){const match=String(t.id).match(/^CR-(\d+)$/);const n=match?Number(match[1])-2:-1;return n>=0&&n<sourceRepeats.length?{repeats:['1','3','5','2','10','8'][sourceRepeats.charCodeAt(n)],load:sourceLoadLabels[sourceLoads.charCodeAt(n)]}:{repeats:t.minRepeats??t.repetitions,load:t.loadCondition??t.load};}
const categories=[...new Set(DB.tests.map(x=>x.cat))];
const testById=new Map(DB.tests.map(x=>[x.id,x]));
const byId=id=>document.getElementById(id);
const num=v=>Number(typeof v==='string'?v.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,]/g,'').replace('٫','.'):v);
const number=n=>num(n||0).toLocaleString('fa-IR',{maximumFractionDigits:1}).replace(/٫/g,'.').replace(/٬/g,',');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه');
let cloudSave, readOnly = false, dayScreen = 'days';
function snapshot(){return {config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete,missions:state.missions||{}}}
function save(){if(readOnly)return false;if(cloudSave){cloudSave(snapshot());return true}try{localStorage.setItem(KEY,JSON.stringify({config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete}));return true}catch(e){toast('حافظه مرورگر پر شده است؛ نسخه پشتیبان بگیرید.');return false}}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v){state.config=normalizeConfig(v.config||{},Boolean(v.setupComplete));delete state.config.cabin;delete state.config.seatRows;delete state.config.offroad;state.records=v.records||{};state.mileage=v.mileage||{drive:{},durability:{}};state.setupComplete=Boolean(v.setupComplete);state.tab=state.setupComplete?'drive':'setup';}}catch(e){console.warn('Cannot read saved assessment',e)}}
let tm;function toast(s){const t=byId('toast');t.textContent=s;t.classList.remove('hidden');clearTimeout(tm);tm=setTimeout(()=>t.classList.add('hidden'),3200)}
function conf(){return state.config}
function parts(s){return String(s||'').split(/\s*\/\s*|\s*\|\s*/).map(x=>x.trim()).filter(Boolean)}
function allowed(rule,value){if(!rule||rule==='All'||rule==='None')return true;return parts(rule).includes(String(value))}
function applicable(t){
const v=t.vehicle||{},c=conf();
if(!allowed(v.cls,c.vclass)||!allowed(v.body,c.body)||!allowed(v.power,c.power)||!allowed(v.gear,c.gear)||!allowed(v.drive,c.driveType))return false;
const label=(t.name+' '+t.sub+' '+t.route).toLowerCase();
if(!twoDifferentials()&&(/خارج.?جاده|آفرود|off.road|قفل دیفرانسیل/i.test(label)||String(t.route).includes('خاکی')))return false;
if(c.gear==='Manual'&&(/گیربکس اتوماتیک|دنده اتوماتیک|تیپ.?ترونیک|p\/n|p، r، n، d/i.test(label)))return false;
if(c.gear==='Automatic'&&(/کیفیت تعویض دنده دستی|پدال کلاچ|اهرم کلاچ/i.test(label)))return false;
if(c.power==='ICE'&&(/باتری کششی|موتور برقی محرکه|اینورتر قدرت|برد تمام.برقی|ترمز احیاکننده|شارژ باتری ولتاژ بالا/i.test(label)))return false;
return true
}
const candidates=tab=>DB.tests.filter(t=>t.scope.includes(tab==='drive'?'drive':tab==='durability'?'durability':'supplementary')&&applicable(t));
function activeRoutes(){const a=DB.routes.filter(r=>(conf().body==='Off-road'||conf().driveType==='4WD')||(!/خارج.?جاده|خاکی/i.test(r.name)));const total=a.reduce((v,x)=>v+Math.max(0,x.durShare),0);return a.map(x=>({...x,share:x.durShare/total}))}
function dayCategoryPlan(){
 if(conf().durabilityPlannerVersion===1)return planner.calculate({target:num(conf().durKm),twoDiff:conf().twoDiff,caps:conf().routeCaps,startOdo:num(conf().startOdo)}).schedule;
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
function driveProgram(){const days=DB.driveDays;const rset=DB.routes,counts={};days.forEach(x=>counts[x.route]=(counts[x.route]||0)+1);
const valid=rset.filter(r=>counts[r.name]);const denominator=valid.reduce((a,b)=>a+b.driveShare,0)||1;const kmLeft={};valid.forEach(r=>kmLeft[r.name]=Math.round(num(conf().driveKm)*r.driveShare/denominator));
const target=num(conf().driveKm),allocated=Object.values(kmLeft).reduce((a,b)=>a+b,0);if(valid.length)kmLeft[valid[valid.length-1].name]+=target-allocated;
const rem={...counts};let cum=0;
return days.map(x=>{const r=valid.find(v=>v.name===x.route);let km=0;if(r){km=rem[x.route]>1?Math.floor(kmLeft[x.route]/rem[x.route]):kmLeft[x.route];kmLeft[x.route]-=km;rem[x.route]--;}else{km=Math.floor(target/days.length)}cum+=km;return {...x,km,cum}})
}
function checksOnPlan(plan){
let milestones=new Map(),step=5000;
for(const p of plan){while(step<=p.cum&&step<=num(conf().durKm)){if(!milestones.has(p.day))milestones.set(p.day,[]);milestones.get(p.day).push(step);step+=5000;}}
return milestones
}
function durabilityTestsForDay(day,plan){
const milestones=checksOnPlan(plan),m=milestones.get(day)||[],n=plan.length;
return candidates('durability').filter(t=>{if(t.freq.includes('روزانه'))return true;if(t.freq.includes('۵۰۰۰')||t.freq.includes('5000'))return m.length>0;return day===1||day===Math.ceil(n/2)||day===n;});
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
 const config={...conf(),durabilityPlannerVersion:1,routeCaps:{}};
 for(const key of setupKeys){const el=byId(key);config[key]=['driveKm','durKm','startOdo'].includes(key)?num(el.value):el.value}
 for(const route of planner.routes)config.routeCaps[route.id]=num(byId('cap-'+route.id).value);
 return config;
}
function updatePlannerPreview(){
 try{
  const config=readSetup(),plan=planner.calculate({target:config.durKm,twoDiff:config.twoDiff,caps:config.routeCaps,startOdo:config.startOdo});
  byId('durDays').value=number(plan.days);
  byId('durabilityPreview').innerHTML='<div class="planner-summary"><div class="planner-metric"><span>هدف پیمایش دوام</span><strong>'+number(plan.target)+' <small>کیلومتر</small></strong></div><div class="planner-metric"><span>مدت برنامه دوام</span><strong>'+number(plan.days)+' <small>روز</small></strong></div></div><div class="route-table-scroll"><table class="result-table"><thead><tr><th>نوع مسیر</th><th>سهم مسیر</th><th>کیلومتر تخصیصی</th><th>سقف روزانه</th><th>تعداد روزها</th><th>پیمایش روز آخر</th></tr></thead><tbody>'+plan.rows.map(row=>'<tr><th scope="row">'+esc(row.name)+'</th><td>'+number(row.weight)+'٪</td><td>'+number(row.km)+'</td><td>'+number(row.cap)+'</td><td>'+number(row.days)+'</td><td>'+number(row.lastKm)+'</td></tr>').join('')+'</tbody><tfoot><tr><th>جمع</th><td>۱۰۰٪</td><td>'+number(plan.target)+'</td><td>—</td><td>'+number(plan.days)+'</td><td>—</td></tr></tfoot></table></div>';
  byId('setupInfo').textContent='تعداد روزها بر اساس هدف دوام، سهم هر مسیر و سقف روزانه محاسبه می‌شود. روز آخر هر مسیر فقط به اندازه کیلومتر باقی‌مانده است.';
  return {config,plan};
 }catch(error){byId('durDays').value='—';byId('durabilityPreview').textContent=error.message;return null}
}
function renderSetup(){
 for(const key of setupKeys){const el=byId(key),value=conf()[key];el.value=el.dataset.numeric?String(value).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):value}
 byId('durabilityCaps').innerHTML=planner.routes.map(route=>'<div class="field"><label for="cap-'+route.id+'">'+esc(route.name)+' (کیلومتر در روز)</label><input id="cap-'+route.id+'" type="text" inputmode="numeric" data-numeric="true" required value="'+number(conf().routeCaps?.[route.id]??route.cap)+'"></div>').join('');
 updatePlannerPreview();
 document.querySelectorAll('#vehicleForm select').forEach(el=>el.dispatchEvent(new Event('change')));
}

function getDriveRoute(p){return p.name||p.route||'تهران'}
function routeTokens(label){
 const v=String(label||'').replace(/[\u200c\u200f]/g,' ').replace(/ و بازگشت.*| دور برگشت.*|مطابق مجوز مسیر/g,'').trim();
 const separators=/\s+[–—-]\s+|\s+به\s+/;
 const p=v.split(separators).map(x=>x.trim()).filter(Boolean);
 if(p.length>1)return [p[0],p[p.length-1]];
 return [p[0]||'تهران',p[0]||'تهران'];
}
const cityCoords={
 'تهران':[51.3890,35.6892],'قم':[50.8764,34.6416],'کرج':[50.9916,35.8400],'دیزین':[51.423,36.05],
 'ساری':[53.0586,36.5659],'فیروزکوه':[52.7751,35.7569],'قزوین':[50.0041,36.2688],
 'کاشان':[51.4272,33.9850],'اصفهان':[51.6660,32.6539],'یزد':[54.3675,31.8974],
 'کرمان':[57.0788,30.2839],'شهداد':[57.6969,30.4214],'بم':[58.3568,29.1060],
 'زاهدان':[60.8729,29.4963],'جیرفت':[57.7382,28.6751],'شیراز':[52.5311,29.5926],
 'مشهد':[59.6168,36.2605],'گرگان':[54.4342,36.8456],'رشت':[49.5887,37.2808],
 'شاهرود':[54.9763,36.4182],'اراک':[49.6892,34.0917],'ساوه':[50.3566,35.0213]
};
function cityCoordinate(name){
 const raw=String(name||'').replace(/[()]/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک');
 const names=Object.keys(cityCoords).filter(k=>raw.includes(k)).sort((a,b)=>b.length-a.length);
 return names.length?cityCoords[names[0]]:null;
}
let currentRouteRequest=0;
async function showRouteEstimate(origin,destination,targetKm){
 const token=++currentRouteRequest;
 const field=byId('liveRouteEstimate');
 if(!field)return;
 const a=cityCoordinate(origin),b=cityCoordinate(destination);
 if(!a||!b||a.join(',')===b.join(',')){
  field.textContent='این روز مسیر شهری یا حلقه‌ای دارد؛ زمان و مسافت جاده‌ای باید با انتخاب نقاط دقیق در گوگل مپ مشخص شود.';
  return;
 }
 field.textContent='در حال دریافت مسافت و زمان تخمینی مسیر جاده‌ای…';
 try{
  const url='https://router.project-osrm.org/route/v1/driving/'+a.join(',')+';'+b.join(',')+'?overview=false';
  const res=await fetch(url,{signal:AbortSignal.timeout(11000)});
  if(!res.ok)throw Error('routing unavailable');
  const json=await res.json();if(token!==currentRouteRequest)return;
  if(json.code!=='Ok'||!json.routes?.length)throw Error('no route');
  const km=json.routes[0].distance/1000;
  const hours=json.routes[0].duration/3600;
  const h=Math.floor(hours),m=Math.round((hours-h)*60);
  field.innerHTML='<b>برآورد مسیر یک‌طرفه:</b> '+number(km)+' کیلومتر · '+number(h)+' ساعت و '+number(m)+' دقیقه'+
  '<br><small>برآورد جاده‌ای بر اساس داده نقشه باز و بدون ترافیک زنده است؛ مسافت هدف برنامه '+number(targetKm)+' کیلومتر است و ممکن است به تکرار مسیر نیاز داشته باشد. برای مسافت و زمان لحظه‌ای گوگل روی لینک مسیر‌یابی کلیک کنید.</small>';
 }catch(e){
  if(token!==currentRouteRequest)return;
  field.textContent='برآورد خودکار در دسترس نیست. مسافت و زمان تخمینی مسیر را از لینک گوگل مپ مشاهده کنید.';
 }
}
function mapHtml(p){
 const rname=state.tab==='drive'?getDriveRoute(p):p.route;
 const isTehran=/تهران/.test(rname)&&!/[–—-]/.test(rname)&&!/دیزین|قم|کرج|قزوین|فیروزکوه|ساوه/.test(rname);
 const circuits=[
 ['میدان آزادی تهران','میدان ونک تهران','میدان انقلاب تهران'],
 ['میدان تجریش تهران','میدان ونک تهران','میدان آرژانتین تهران'],
 ['میدان هفت تیر تهران','میدان فاطمی تهران','میدان انقلاب تهران'],
 ['میدان آزادی تهران','میدان صنعت تهران','میدان ونک تهران']
 ];
 const points=circuits[(p.day-1)%circuits.length];
 const endpoints=isTehran?[points[0],points[2]]:routeTokens(rname),origin=endpoints[0],destination=endpoints[1];
 const params='saddr='+encodeURIComponent(origin+', Iran')+'&daddr='+encodeURIComponent(destination+', Iran');
 const embed='https://maps.google.com/maps?'+params+'&output=embed&hl=fa';
 const link='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin+', Iran')+'&destination='+encodeURIComponent(destination+', Iran')+(isTehran?'&waypoints='+encodeURIComponent(points[1]):'')+'&travelmode=driving';
 queueMicrotask(()=>{if(isTehran){const el=byId('liveRouteEstimate');if(el)el.textContent='مسیر پیشنهادی شهری: '+points.join(' ← ')+'؛ زمان و مسافت دقیق با توجه به ترافیک و راه انتخابی در گوگل مپ قابل مشاهده است.'}else showRouteEstimate(origin,destination,p.km)});
 return '<div class="map-grid"><iframe title="مسیر آنلاین گوگل مپ برای روز انتخاب‌شده" class="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'+esc(embed)+'"></iframe><div class="route-info"><h3>مشخصات مسیر روز</h3><p><b>مبدأ:</b> '+esc(origin)+'<br><b>مقصد:</b> '+esc(destination)+'</p><p><b>مسیر پیشنهادی:</b> '+esc(rname)+'</p><p><b>نوع مسیر:</b> '+esc(p.type||p.route)+'</p><p><b>هدف پیمایش روز:</b> '+number(p.km)+' کیلومتر</p><div class="route-estimate" id="liveRouteEstimate">در حال آماده‌سازی برآورد مسیر…</div><a class="map-link" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">نمایش مسیر و زمان ترافیکی در گوگل مپ</a><p class="disclaimer">در مسیرهای شهری و حلقه‌ای، مبدأ و مقصد دقیق باید در گوگل مپ مشخص شوند. مسافت هدف روز الزاماً معادل فاصله مستقیم بین دو شهر نیست.</p></div></div>';
}
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
 hot:'<circle cx="32" cy="32" r="22" fill="#ffefd4"/><g stroke="#dfa24c" stroke-width="3" stroke-linecap="round"><path d="M32 5v6m0 42v6M5 32h6m42 0h6M13 13l4 4m30 30 4 4M13 51l4-4m30-30 4-4"/></g><circle cx="32" cy="32" r="14" fill="#f7ce7d" stroke="#cf9741" stroke-width="2"/><path d="M24 30h1m14 0h1" stroke="#a87a38" stroke-width="3" stroke-linecap="round"/><path d="M27 37q5 5 10 0" fill="none" stroke="#a87a38" stroke-width="2" stroke-linecap="round"/>',
 urban:'<circle cx="32" cy="32" r="28" fill="#e2f2e9"/><rect x="12" y="23" width="19" height="29" rx="4" fill="#b8dbc8" stroke="#6f9f88" stroke-width="2"/><rect x="30" y="12" width="22" height="40" rx="5" fill="#d0e1ee" stroke="#7e9db5" stroke-width="2"/><path d="M18 31h6m-6 8h6m13-18h8m-8 9h8m-8 9h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 53h46" stroke="#88b09b" stroke-width="2" stroke-linecap="round"/>',
 rural:'<circle cx="32" cy="32" r="28" fill="#e5eff9"/><path d="M22 12h20l13 42H9z" fill="#a5bfd4" stroke="#6e92b0" stroke-width="2" stroke-linejoin="round"/><path d="M32 17v6m0 8v7m0 8v7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="m19 24-4 17m30-17 4 17" stroke="#eaf3fb" stroke-width="2" stroke-linecap="round"/>',
 mountain:'<circle cx="32" cy="32" r="28" fill="#eee7f7"/><path d="m6 51 21-36 20 36z" fill="#b6a2cf" stroke="#8b72a8" stroke-width="2" stroke-linejoin="round"/><path d="m28 51 13-25 18 25z" fill="#d0c2e0" stroke="#9d86b5" stroke-width="2" stroke-linejoin="round"/><path d="m20 27 7-12 7 13-7-4z" fill="#fff"/><circle cx="48" cy="14" r="5" fill="#ecd2a0"/>',
 offroad:'<circle cx="32" cy="32" r="28" fill="#f4eadb"/><path d="M6 45q11-14 24-4t28-2v14H6z" fill="#dfcba8"/><path d="M26 8q-17 16 0 25t6 23" fill="none" stroke="#b39770" stroke-width="10"/><path d="M26 8q-17 16 0 25t6 23" fill="none" stroke="#f9f3e8" stroke-width="2" stroke-dasharray="4 5"/><circle cx="45" cy="25" r="4" fill="#c1ab8b"/><circle cx="14" cy="48" r="3" fill="#b9a17c"/>'
 };
 return {kind,icon:'<svg viewBox="0 0 64 64" aria-hidden="true">'+(icons[kind]||icons.rural)+'</svg>',label:text};
}
function renderDayNavigation(){
 const c=dayContext(),host=byId('dayNavigation');
 host.classList.toggle('hidden',!c||!['days','menu'].includes(dayScreen));
 if(!c){host.replaceChildren();return}
 if(dayScreen==='days'){
  const plan=state.tab==='drive'?driveProgram():dayCategoryPlan();
  host.innerHTML='<div class="assessment-days-grid">'+plan.map(p=>{const theme=dayRouteAppearance(p);return '<button type="button" class="assessment-day-tile" data-route="'+esc(theme.kind)+'" data-day="'+p.day+'" aria-label="روز '+number(p.day)+'، '+esc(theme.label)+'"><span class="day-route-icon">'+theme.icon+'</span><strong><span class="day-word">روز </span>'+number(p.day)+'</strong><span class="day-route-label">'+esc(theme.label)+'</span><small>'+number(p.km)+' کیلومتر</small></button>'}).join('')+'</div>';
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

const remainingMeta=(state.tab==='durability'?'<span class="meta-tag">کیلومترشمار هدف: '+number(p.odo)+' km</span>':'')+(milestone.length?'<span class="meta-tag">کنترل: '+milestone.map(x=>number(x)).join('، ')+' km</span>':'');
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
if(!select.length)html+='<div class="empty">آزمونی مطابق فیلتر یا روز انتخاب‌شده پیدا نشد.</div>';
for(const t of select){
const rec=record(t),colors=scoreColors;
html+='<article class="question" id="q-'+esc(t.id)+'"><div class="question-head"><div><div class="test-hierarchy"><span>شاخص: '+esc(fa(t.cat))+'</span><span>زیرشاخص: '+esc(fa(t.sub))+'</span></div><h3>'+esc(fa(t.name))+'</h3></div></div>';
const extra=sourceFields(t);const details=[['شرایط آزمون',t.profile],['حالت بار',extra.load],['حداقل تکرار',extra.repeats],['روش سنجش',t.measure]];
html+='<dl class="test-conditions">'+details.filter(([label,value])=>value!==undefined&&value!==null&&String(value).trim()!=='').map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(fa(value))+'</dd></div>').join('')+'</dl>';
html+='<div class="scores" role="group" aria-label="نمره آزمون از ۱ تا ۱۰">';
for(let i=1;i<=10;i++){let c=colors[i];html+='<button class="score '+(num(rec.score)===i?'selected':'')+'" data-score="'+i+'" data-test="'+esc(t.id)+'" title="'+esc(scoreWords[i])+'" style="--score-bg:'+c[0]+';--score-border:'+c[1]+';--score-text:'+c[2]+'"><strong>'+number(i)+'</strong><small>'+esc(scoreWords[i])+'</small></button>'}
html+='</div><details class="assessment-attachment" '+(rec.note||rec.photo?'open':'')+'><summary><span class="attachment-plus" aria-hidden="true">+</span>افزودن یادداشت یا تصویر</summary><div class="note-wrap"><div class="note-actions"><label class="label-block" for="note-'+esc(t.id)+'">یادداشت ارزیاب</label><span class="tiny">در صورت نیاز تصویر هم پیوست کنید.</span></div><textarea id="note-'+esc(t.id)+'" data-note="'+esc(t.id)+'" placeholder="مشاهده، ایراد یا نکته قابل پیگیری را ثبت کنید...">'+esc(rec.note||'')+'</textarea><div class="note-actions"><label class="photo-picker"><input class="photo-input" type="file" accept="image/*" data-photo="'+esc(t.id)+'" aria-label="انتخاب تصویر آزمون"><span class="photo-picker-button">انتخاب تصویر</span><span class="photo-file-name">'+(rec.photo?'تصویر ثبت شده است':'تصویری انتخاب نشده است')+'</span></label>'+(rec.photo?'<img src="'+rec.photo+'" alt="تصویر ثبت‌شده برای آزمون">':'')+'</div></div></details></article>'
}
html+='<div class="toolbar"><button class="secondary" data-pagejump="'+(page-1)+'" '+(page===0?'disabled':'')+'>صفحه قبل</button><span class="tiny">صفحه '+number(page+1)+' از '+number(pages)+'</span><button class="secondary" data-pagejump="'+(page+1)+'" '+(page>=pages-1?'disabled':'')+'>صفحه بعد</button></div>';
byId('questionsPanel').innerHTML=html
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
  const k=tab==='durability'&&conf().durabilityPlannerVersion===1?p.type:routeClassification(p.type||p.route);group[k]??={target:0,actual:0,days:0};
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
html+='<div class="toolbar"><button class="primary" data-exportcsv="1">دریافت گزارش Excel</button><button class="secondary" data-import="1">بازیابی فایل پشتیبان JSON</button><button class="secondary" data-clear="1">پاک‌کردن نمره‌ها</button></div><p class="disclaimer">ثبت داده‌ها در مرورگر همین دستگاه است و بین کاربران همگام نمی‌شود. برای نگهداری سازمانی و تجمیع تیمی، اتصال به پایگاه داده و احراز هویت جداگانه لازم است.</p>';
html+=routeMixHtml('drive')+routeMixHtml('durability');byId('resultsPanel').innerHTML=html
}
function render(){
document.body.dataset.view=state.tab;
renderGate();
const titles={home:['',''],modules:['بخش‌های ارزیابی',''],setup:['تنظیم مشخصات خودرو و برنامه آزمون','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.'],drive:['آزمون قابلیت رانندگی','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا'],durability:['آزمون دوام عملکردی','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف'],supplementary:['پرسشنامه تکمیلی','ارزیابی‌های مستقل از برنامه کیلومتری'],results:['نتایج و میانگین‌ها','خلاصه نمره هر شاخص و هر حوزه ارزیابی']};
const daily=dayContext();
const sectionNames={menu:'',form:'فرم روزانه',route:'مسیر پیمایش',scores:'امتیازدهی'};
byId('pageTitle').textContent=titles[state.tab][0]+(daily&&dayScreen!=='days'?' — روز '+number(daily.day)+(sectionNames[dayScreen]?' — '+sectionNames[dayScreen]:''):'');byId('pageSub').textContent=titles[state.tab][1];
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
    const rec=state.records[tab+':'+(days?day:'general')+':'+t.id];
    const score=num(rec?.score);
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
    const v=num(state.records[tab+':'+(i+1)+':'+t.id]?.score);
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

function updateRating(btn){const id=btn.dataset.test,t=testById.get(id);if(!t)return;const k=ratedKey(t);const rec={...(state.records[k]||{})},selected=num(btn.dataset.score);if(num(rec.score)===selected)delete rec.score;else rec.score=selected;state.records[k]=rec;save();const sy=window.scrollY;render();window.scrollTo(0,sy)}
function uploadPicture(file,testId){const assessment=cloudSave;if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{if(assessment!==cloudSave)return;const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(im.width,im.height));canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.55),t=testById.get(testId);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),photo:data};if(save()){toast('عکس برای این آزمون ثبت شد.');const sy=window.scrollY;render();window.scrollTo(0,sy)}};im.src=reader.result};reader.readAsDataURL(file)}
byId('vehicleForm').addEventListener('input',updatePlannerPreview);
byId('vehicleForm').addEventListener('change',updatePlannerPreview);
byId('vehicleForm').addEventListener('submit',e=>{
 e.preventDefault();if(readOnly)return;
 const result=updatePlannerPreview();if(!result){toast('هدف و سقف‌های پیمایش را بررسی کنید.');return}
 const {config,plan}=result;
 if(!Number.isInteger(config.driveKm)||config.driveKm<1||config.driveKm>20000){toast('هدف قابلیت رانندگی باید عدد صحیح بین ۱ تا ۲۰٬۰۰۰ باشد.');return}
 if(!['yes','no'].includes(config.twoDiff)){toast('وضعیت دو دیفرانسیل را انتخاب کنید.');return}
 config.durDays=plan.days;state.config=config;state.setupComplete=true;save();changeTab('modules');toast('مشخصات خودرو ثبت و برنامه دوام محاسبه شد.');
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
byId('importBackup').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const assessment=cloudSave;const fr=new FileReader();fr.onload=()=>{if(assessment!==cloudSave)return;try{const obj=JSON.parse(fr.result);if(!obj||!obj.records||!obj.config)throw Error('Invalid');if(!confirm('اطلاعات موجود با فایل پشتیبان جایگزین شود؟'))return;state.config=normalizeConfig(obj.config,true);state.records=obj.records;state.mileage=obj.mileage||{drive:{},durability:{}};state.missions=obj.missions||{};state.setupComplete=true;save();render();toast('بازیابی پشتیبان انجام شد.')}catch(err){toast('فایل JSON معتبر نیست.')}};fr.readAsText(file);e.target.value=''});
window.BAMCO_ASSESSMENT={
  open(data,onSave,locked){
    cloudSave=onSave;readOnly=locked;dayScreen='days';
    document.querySelectorAll('#vehicleForm button,#vehicleForm input,#vehicleForm select').forEach(el=>el.disabled=locked);
    Object.assign(state,{
      config:normalizeConfig(data.config||{},Boolean(data.setupComplete)),
      records:data.records||{},mileage:data.mileage||{drive:{},durability:{}},
      setupComplete:Boolean(data.setupComplete),missions:data.missions||{},driveDay:1,durDay:1,
      category:'همه',query:'',page:0,tab:data.setupComplete?'modules':'setup'
    });
    render();
    window.scrollTo(0,0);
  },
  dayContext,
  durabilityPlan(){return dayCategoryPlan()},
  mission(key){return state.missions?.[key]||{}},
  setMission(key,mission){if(!cloudSave||readOnly)return;state.missions[key]=mission;save()},
  setDayMileage(tab,day,value){if(!cloudSave||readOnly||!['drive','durability'].includes(tab))return;const n=num(value);if(!Number.isFinite(n)||n<0)return;state.mileage[tab]=state.mileage[tab]||{};state.mileage[tab][day]=n;save()},
  dayProgress(){const items=dayItems(),scored=items.filter(t=>num(record(t).score)>=1&&num(record(t).score)<=10).length;return {total:items.length,scored,remaining:Math.max(0,items.length-scored),complete:items.length===0||scored===items.length}},
  isReadOnly(){return readOnly},
  home(){document.dispatchEvent(new Event('bamco:assessment-close'));cloudSave=null;readOnly=false;state.tab='home';render()},
  legacy(){try{
    const data=JSON.parse(localStorage.getItem(KEY)||'null');
    if(data)data.missions=JSON.parse(localStorage.getItem('bamco-drive-day-metadata-v2')||'{}');
    return data;
  }catch{return null}}
};
load();state.tab='home';render();
})();

