(function(root){'use strict';
const precision=n=>Math.round(Number(n)*1000)/1000;
const ids=['urban','rural','hot','offroad','mountain'];
function targets(rows,configured){
 if(Array.isArray(configured)&&configured.length===4)return configured.map(row=>({...row}));
 return Array.from({length:4},()=>Object.fromEntries(rows.map(r=>[r.id,null])));
}
function validateTargets(rows,values){
 const issues=[];
 for(const row of rows){const assigned=values.map(p=>p[row.id]),amounts=assigned.map(n=>n==null||n===''?null:Number(n));if(amounts.some(n=>n!==null&&(!Number.isFinite(n)||n<0||(row.km>0&&n<=0))))issues.push({routeId:row.id,type:'positive'});
 else{if(amounts.some(n=>n===null))issues.push({routeId:row.id,type:'unset'});const delta=precision(amounts.reduce((a,b)=>a+(b||0),0)-row.km);if(Math.abs(delta)>.001)issues.push({routeId:row.id,type:'total',delta});}}
 return issues;
}
function phaseOf(day,plan){if(day.phase>=1&&day.phase<=4)return Number(day.phase);if(day.cycle>=1&&day.cycle<=4)return Number(day.cycle);const total=plan.reduce((s,p)=>s+Number(p.km||0),0);let before=0;for(const p of plan){if(p.day===day.day)break;before+=Number(p.km||0)}return Math.min(4,Math.floor(before/(total||1)*4)+1)}
function normalize(plan){return plan.map(p=>({...p,phase:phaseOf(p,plan)}))}
function coverage(plan,phase,allocation,mileage={}){return ids.map(id=>{const legs=plan.filter(p=>phaseOf(p,plan)===phase&&p.routeId===id),hasTarget=allocation[id]!=null&&allocation[id]!==''&&Number.isFinite(Number(allocation[id]))&&Number(allocation[id])>=0,target=hasTarget?Number(allocation[id]):null,selected=precision(legs.reduce((s,p)=>s+Number(p.km||0),0)),actual=precision(legs.reduce((s,p)=>s+Number(mileage[p.day]||0),0)),missing=legs.some(p=>p.needsRoute||!p.roadId);return {id,target,selected,actual,delta:hasTarget?precision(selected-target):null,missing,status:!hasTarget?'unset':missing?'route':Math.abs(selected-target)<=.001?'ready':selected>target?'over':'under'}})}
function protectedDay(snapshot){const used=new Set(Object.keys(snapshot.mileage?.durability||{}).map(Number));for(const [key,value]of Object.entries(snapshot.records||{}))if(key.startsWith('durability:')&&Object.keys(value||{}).length)used.add(Number(key.split(':')[1]));for(const [key,value]of Object.entries(snapshot.missions||{}))if(key.startsWith('durability:')&&Object.keys(value||{}).length)used.add(Number(key.split(':')[1]));return Math.max(0,...[...used].filter(Number.isFinite))}
function manualPlan(snapshot,readOnly=false){const plan=normalize(snapshot.durabilitySchedule||[]);if(readOnly||Array.isArray(snapshot.config?.durabilityPhaseTargets))return plan;const last=protectedDay(snapshot);return plan.filter(p=>p.day<=last)}
function replacePhase(snapshot,phase,legs){
 const previous=normalize(snapshot.durabilitySchedule||[]),last=protectedDay(snapshot),old=previous.filter(p=>p.phase===phase),locked=old.filter(p=>p.day<=last);
 // Existing recorded day identifiers and all preceding days are immutable.
 if(locked.some((p,i)=>JSON.stringify(legs[i])!==JSON.stringify(p)))throw Error('روزهای دارای اطلاعات و روزهای پیش از آن قابل تغییر نیستند.');
 const otherLocked=previous.filter(p=>p.day<=last&&p.phase>phase);
 if(otherLocked.length&&JSON.stringify(legs)!==JSON.stringify(old))throw Error('فاز بعدی اطلاعات ثبت‌شده دارد؛ برنامه این فاز ثابت می‌ماند.');
 const all=[...previous.filter(p=>p.phase!==phase),...legs.map(p=>({...p,phase,cycle:phase}))].sort((a,b)=>a.phase-b.phase);
 let cumulative=0;return all.map((p,i)=>{const day=i+1;if(p.day<=last&&p.day!==day)throw Error('شماره روزهای ثبت‌شده قابل جابه‌جایی نیست.');cumulative=precision(cumulative+Number(p.km));if(p.day<=last)return p;return {...p,day,cum:cumulative,odo:precision(Number(snapshot.config?.startOdo||0)+cumulative)}});
}
function leg(edge,km,phase){const value=Number(km);if(!edge||edge.active===false||!ids.includes(edge.routeId))throw Error('یک مسیر فعال از بانک مسیرها انتخاب کنید.');if(!Number.isFinite(value)||value<=0||value>200000)throw Error('مسافت باید بیشتر از صفر و حداکثر ۲۰۰٬۰۰۰ کیلومتر باشد.');return {phase,cycle:phase,routeId:edge.routeId,origin:edge.origin,destination:edge.destination,route:edge.name||edge.origin+' — '+edge.destination,roadId:edge.id,roadKm:edge.km||null,km:precision(value),needsRoute:false}}
const api={ids,precision,targets,validateTargets,phaseOf,normalize,coverage,protectedDay,manualPlan,replacePhase,leg};
if(typeof module==='object'&&module.exports)module.exports=api;else root.BAMCO_DURABILITY_PHASES=api;
})(typeof window==='object'?window:globalThis);
