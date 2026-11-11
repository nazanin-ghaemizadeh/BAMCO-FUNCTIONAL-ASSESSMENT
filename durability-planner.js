(function(root){'use strict';
const routes=[{id:'urban',name:'شهری',weights:[25,25],cap:300},{id:'rural',name:'جاده برون‌شهری',weights:[40,40],cap:700},{id:'hot',name:'جاده گرمسیری',weights:[25,15],cap:500},{id:'offroad',name:'خارج‌جاده/مسیر خاکی',weights:[0,2],cap:200},{id:'mountain',name:'جاده کوهستانی',weights:[10,18],cap:350}];
const precision=n=>Math.round(n*1000)/1000;
function allocate(target,weights){const total=weights.reduce((a,b)=>a+b,0);let before=0;return weights.map(weight=>{const km=Math.round(target*(before+weight)/total)-Math.round(target*before/total);before+=weight;return km})}
function optionsFrom(catalog,origin,routeId){const edges=catalog.filter(r=>r.routeId===routeId&&r.origin===origin).map(r=>({...r}));for(const r of catalog.filter(r=>r.routeId===routeId&&r.destination===origin&&r.origin!==origin))if(!edges.some(e=>e.destination===r.origin))edges.push({...r,id:r.id+':reverse',origin,destination:r.origin,referenceReverse:true});return edges;}
function suggestedEdge(catalog,origin,routeId){const choices=optionsFrom(catalog,origin,routeId);const coverage=city=>routes.filter(r=>optionsFrom(catalog,city,r.id).length>0).length;return choices.sort((a,b)=>coverage(b.destination)-coverage(a.destination))[0]}
function calculate({target,twoDiff=false,caps={},startOdo=0,shares,origin='تهران',catalog=[]}){
 if(!Number.isSafeInteger(target)||target<1||target>200000)throw Error('هدف پیمایش دوام باید عدد صحیح بین ۱ تا ۲۰۰٬۰۰۰ کیلومتر باشد.');
 if(!Number.isFinite(startOdo)||startOdo<0)throw Error('کیلومترشمار شروع معتبر نیست.');
 const dual=twoDiff===true||twoDiff==='yes',weights=routes.map(r=>shares?Number(shares[r.id]??0):r.weights[dual?1:0]);
 if(weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(weights.reduce((a,b)=>a+b,0)-100)>0.001)throw Error('جمع سهم مسیرها باید ۱۰۰ درصد باشد.');
 if(!dual&&weights[3]>0)throw Error('سهم مسیر خارج‌جاده برای خودروی فاقد دو دیفرانسیل باید صفر باشد.');
 const allocation=allocate(target,weights),rows=routes.map((r,i)=>{const cap=Number(caps[r.id]??r.cap);if(!Number.isSafeInteger(cap)||cap<1||cap>200000)throw Error('سقف روزانه '+r.name+' باید عدد صحیح مثبت باشد.');return {...r,weight:weights[i],share:weights[i]/100,cap,km:allocation[i],days:0,lastKm:0}});
 const schedule=[];let cum=0,city=origin;
 for(let cycle=1;cycle<=4;cycle++){const left=rows.map(r=>precision(r.km/4));while(left.some(x=>x>0.0001))for(let i=0;i<rows.length;i++){if(left[i]<=0.0001)continue;const row=rows[i],km=precision(Math.min(left[i],row.cap));left[i]=precision(left[i]-km);cum=precision(cum+km);const edge=suggestedEdge(catalog,city,row.id),destination=edge?.destination||city;schedule.push({day:schedule.length+1,cycle,routeId:row.id,type:row.name,origin:city,destination,roadId:edge?.id||null,roadKm:edge?.km||null,route:city===destination?city+' ـ '+row.name:city+' → '+destination,km,cum,odo:precision(startOdo+cum),cap:row.cap,over:false,needsRoute:!edge&&row.id!=='urban'});city=destination;row.days++;row.lastKm=km;}}
 return {target,days:schedule.length,rows,schedule};
}
function totals(plan,mileage={},beforeDay=Infinity){const sums=Object.fromEntries(routes.map(r=>[r.id,0]));for(const p of plan)if(p.day<beforeDay){const actual=Number(mileage[p.day]);if(Number.isFinite(actual)&&actual>=0)sums[p.routeId]=precision((sums[p.routeId]||0)+actual)}return sums}
function checkpoints(plan,mileage,targets,day){const before=totals(plan,mileage,day),after=totals(plan,mileage,day+1),result=[];for(const r of targets)if(r.km>0)for(let quarter=1;quarter<=4;quarter++){const km=r.km*quarter/4;if(before[r.id]<km-0.00001&&after[r.id]>=km-0.00001)result.push({routeId:r.id,quarter,km,percent:quarter*25})}return result}
function replan({plan,fromDay,replacement,mileage={},rows,startOdo=0,catalog=[]}){
 if(!Number.isInteger(fromDay)||fromDay<1||fromDay>plan.length+1)throw Error('روز معتبر نیست.');
 if(plan.some(p=>p.day>=fromDay&&Object.hasOwn(mileage,p.day)))throw Error('برای این روز یا روزهای بعد پیمایش ثبت شده است؛ بازبرنامه‌ریزی را از اولین روز انجام‌نشده آغاز کنید.');
 const prefix=plan.slice(0,fromDay-1).map(p=>({...p})),tot=Object.fromEntries(rows.map(r=>[r.id,0]));for(const p of prefix)tot[p.routeId]=precision(tot[p.routeId]+(Object.hasOwn(mileage,p.day)?Number(mileage[p.day]):p.km));
 const selected=replacement&&rows.find(r=>r.id===replacement.routeId);if(replacement&&!selected)throw Error('نوع مسیر معتبر نیست.');
 const remaining=selected?precision(selected.km-tot[selected.id]):0,currentCycle=Math.min(4,Math.floor(Math.min(...rows.filter(r=>r.km>0).map(r=>tot[r.id]/r.km))*4+0.000001)+1),cycleRemaining=selected?precision(selected.km*currentCycle/4-tot[selected.id]):0;
 if(replacement&&(!(replacement.km>0)||replacement.km>selected.cap+0.001||replacement.km>remaining+0.001||replacement.km>cycleRemaining+0.001))throw Error('مسافت انتخابی از سهم باقی‌مانده چرخه یا سقف روزانه بیشتر است.');
 let cum=Object.values(tot).reduce((a,b)=>a+b,0),city=replacement?.origin||prefix.at(-1)?.destination||plan[0]?.origin||'تهران';
 const append=(r,km,extra={})=>{cum=precision(cum+km);const edge=suggestedEdge(catalog,city,r.id),destination=extra.destination||edge?.destination||city,day=prefix.length+1;prefix.push({day,cycle:extra.cycle||currentCycle,routeId:r.id,type:r.name,origin:city,destination,route:city===destination?city+' ـ '+r.name:city+' → '+destination,roadId:edge?.id||null,km,cum,odo:precision(startOdo+cum),cap:r.cap,needsRoute:!edge&&r.id!=='urban',...extra});city=destination;tot[r.id]=precision(tot[r.id]+km)};
 if(replacement)append(selected,replacement.km,{...replacement,cycle:currentCycle});
 for(let cycle=currentCycle;cycle<=4;cycle++)while(rows.some(r=>tot[r.id]<r.km*cycle/4-0.001))for(const r of rows){const left=precision(r.km*cycle/4-tot[r.id]);if(left>0.001)append(r,Math.min(left,r.cap),{cycle})}
 return prefix;
}
const api={routes,calculate,optionsFrom,totals,checkpoints,replan,precision};if(typeof module==='object'&&module.exports)module.exports=api;else root.BAMCO_DURABILITY_PLANNER=api;
})(typeof window==='object'?window:globalThis);
