(function(root){'use strict';
const precision=n=>Math.round(Number(n)*1000)/1000;
const ids=['urban','rural','hot','offroad','mountain'];
const fa=n=>Number(n).toLocaleString('fa-IR');
const city=s=>String(s||'').trim().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ');
// Every phase has the same mileage targets and the same number of day slots.
function targets(rows){return Array.from({length:4},()=>Object.fromEntries(rows.map(r=>[r.id,precision(r.km/4)])))}
function daysPerPhase(rows){return rows.reduce((sum,r)=>sum+Math.ceil(precision(r.km/4)/r.cap),0)}
function phaseOf(day,plan){if(day.phase>=1&&day.phase<=4)return Number(day.phase);if(day.cycle>=1&&day.cycle<=4)return Number(day.cycle);return Math.min(4,Math.floor((day.day-1)/Math.max(1,plan.length/4))+1)}
function normalize(plan){return plan.map(p=>({...p,phase:phaseOf(p,plan)}))}
function emptyDay(day,phase){return {day,phase,cycle:phase,routeId:null,roadId:null,origin:'',destination:'',route:'',km:0,needsRoute:true}}
function assigned(day){return Boolean(day?.roadId&&!day.needsRoute)}
function protectedDay(snapshot){const used=new Set(Object.keys(snapshot.mileage?.durability||{}).map(Number));for(const [key,value]of Object.entries(snapshot.records||{}))if(key.startsWith('durability:')&&Object.keys(value||{}).length)used.add(Number(key.split(':')[1]));for(const [key,value]of Object.entries(snapshot.missions||{}))if(key.startsWith('durability:')&&Object.keys(value||{}).length)used.add(Number(key.split(':')[1]));return Math.max(0,...[...used].filter(Number.isFinite))}
function recalculate(plan,startOdo=0,last=0){let cumulative=0;return plan.map(p=>{cumulative=precision(cumulative+Number(p.km||0));return p.day<=last?p:{...p,cum:cumulative,odo:precision(Number(startOdo||0)+cumulative)}})}
function manualPlan(snapshot,readOnly=false,rows){
 const old=normalize(snapshot.durabilitySchedule||[]),last=protectedDay(snapshot),count=Math.max(daysPerPhase(rows),Math.ceil(last/4));
 const slots=Array.from({length:count*4},(_,i)=>emptyDay(i+1,Math.floor(i/count)+1));
 const manual=Number(snapshot.config?.durabilityPhaseVersion)>=1||Array.isArray(snapshot.config?.durabilityPhaseTargets);
 for(const p of old){
  if(p.day<=last){slots[p.day-1]={...p,phase:slots[p.day-1].phase,cycle:slots[p.day-1].phase};continue}
  if(!manual||!assigned(p))continue;
  const slot=Number(snapshot.config?.durabilityPhaseVersion)>=2?slots[p.day-1]:slots.find(d=>d.phase===p.phase&&d.day>last&&!assigned(d));
  if(!slot)throw Error('برای مسیرهای ذخیره‌شده، روز کافی در برنامه جدید وجود ندارد. ابتدا برنامه مسیرها را اصلاح کن.');
  slots[slot.day-1]={...p,day:slot.day,phase:slot.phase,cycle:slot.phase};
 }
 return recalculate(slots,snapshot.config?.startOdo,last);
}
function originForDay(plan,day,start='تهران'){if(day===1)return city(start);const previous=plan.find(p=>p.day===day-1);return previous?.destination&&(assigned(previous)||!previous.needsRoute)?city(previous.destination):null}
function optionsFrom(catalog,origin,kind=''){
 if(!origin)return [];
 const choices=[];for(const edge of catalog||[]){if(edge.active===false||!ids.includes(edge.routeId)||(kind&&edge.routeId!==kind))continue;
  if(city(edge.origin)===city(origin))choices.push({...edge});
  else if(edge.bidirectional!==false&&city(edge.destination)===city(origin))choices.push({...edge,id:edge.id+':reverse',origin:edge.destination,destination:edge.origin,name:edge.destination+' — '+edge.origin,referenceReverse:true});
 }return choices;
}
function coverage(plan,phase,allocation,mileage={}){return ids.map(id=>{const legs=plan.filter(p=>phaseOf(p,plan)===phase&&p.routeId===id),target=Number(allocation[id]||0),selected=precision(legs.reduce((s,p)=>s+Number(p.km||0),0)),actual=precision(legs.reduce((s,p)=>s+Number(mileage[p.day]||0),0)),missing=legs.some(p=>!assigned(p));return {id,target,selected,actual,delta:precision(selected-target),missing,status:missing?'route':Math.abs(selected-target)<=.001?'ready':selected>target?'over':'under'}})}
function leg(edge,km,phase){const value=Number(km);if(!edge||edge.active===false||!ids.includes(edge.routeId))throw Error('یک مسیر فعال از بانک مسیرها انتخاب کن.');if(!Number.isFinite(value)||value<=0||value>200000)throw Error('مسافت باید بیشتر از صفر و حداکثر ۲۰۰٬۰۰۰ کیلومتر باشد.');return {phase,cycle:phase,routeId:edge.routeId,origin:edge.origin,destination:edge.destination,route:edge.name||edge.origin+' — '+edge.destination,roadId:edge.id,roadKm:edge.km||null,km:precision(value),needsRoute:false}}
function assignDay(snapshot,plan,day,edge,km){
 const last=protectedDay(snapshot),old=plan.find(p=>p.day===day);if(!old||day<=last)throw Error('روزهای دارای اطلاعات و روزهای پیش از آن قابل تغییر نیستند.');
 const origin=originForDay(plan,day,snapshot.config?.startCity||'تهران');if(edge&&(!origin||city(edge.origin)!==origin))throw Error(origin?'مسیر این روز باید از '+origin+' شروع شود.':'ابتدا مسیر روز قبل را مشخص کن.');
 const next=plan.map(p=>({...p}));next[day-1]=edge?{...leg(edge,km,old.phase),day}:emptyDay(day,old.phase);
 const cleared=[];for(let i=day;i<next.length;i++){const p=next[i];if(!assigned(p))continue;const start=originForDay(next,p.day,snapshot.config?.startCity||'تهران');if(!start||city(p.origin)!==start){if(p.day<=last)throw Error('مسیر روز ثبت‌شده قابل تغییر نیست.');cleared.push(p.day);next[i]=emptyDay(p.day,p.phase)}}
 return {plan:recalculate(next,snapshot.config?.startOdo,last),cleared};
}
function validatePlan(snapshot,plan){
 const previous=snapshot.durabilitySchedule||[],last=protectedDay(snapshot);
 if(plan.length!==previous.length)throw Error('تعداد روزهای چهار فاز ثابت است.');
 for(let i=0;i<plan.length;i++){const p=plan[i],old=previous[i];if(p.day!==i+1||p.phase!==old.phase)throw Error('شماره روزها و فازها ثابت است.');
  if(p.day<=last){if(JSON.stringify(p)!==JSON.stringify(old))throw Error('روزهای ثبت‌شده قابل تغییر نیستند.');continue}
  if(!assigned(p))continue;
  if(!Number.isFinite(p.km)||p.km<=0||p.km>200000)throw Error('مسافت روز '+fa(p.day)+' معتبر نیست.');
  const origin=originForDay(plan,p.day,snapshot.config?.startCity||'تهران');if(!origin||city(origin)!==city(p.origin))throw Error('مسیر روز '+fa(p.day)+' با مقصد روز قبل پیوسته نیست.');
 }return recalculate(plan,snapshot.config?.startOdo,last);
}
function replacePhase(snapshot,phase,legs){const next=normalize(snapshot.durabilitySchedule||[]).map(p=>p.phase===phase?legs.find(l=>l.day===p.day):p);if(next.some(p=>!p))throw Error('تعداد روزهای فاز ثابت است.');return validatePlan(snapshot,next)}
const api={ids,precision,targets,daysPerPhase,phaseOf,normalize,coverage,protectedDay,manualPlan,replacePhase,leg,emptyDay,assigned,originForDay,optionsFrom,assignDay,validatePlan};
if(typeof module==='object'&&module.exports)module.exports=api;else root.BAMCO_DURABILITY_PHASES=api;
})(typeof window==='object'?window:globalThis);
