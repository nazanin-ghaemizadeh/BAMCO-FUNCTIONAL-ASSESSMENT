(function(root){
'use strict';
// Percentages: BAMCO_Route_Planner.xlsx, Percentages!C3:C7 and F3:F7.
// Daily caps: Durability Planner!D8:D12. Allocation follows H8:H12,
// day counts I8:I12, and final-day distances J8:J12.
const routes=[
 {id:'urban',name:'شهری',weights:[25,25],cap:300,suggest:'حلقه شهری تهران در مسیر مجاز'},
 {id:'rural',name:'جاده برون‌شهری',weights:[40,40],cap:700,suggest:'تهران–فیروزکوه و بازگشت، مطابق مجوز مسیر'},
 {id:'hot',name:'جاده گرمسیری',weights:[25,15],cap:500,suggest:'محور گرمسیری تأییدشده متناسب با فصل و شرایط آزمون'},
 {id:'offroad',name:'خارج‌جاده/مسیر خاکی',weights:[0,2],cap:200,suggest:'پیست خاکی یا خارج‌جاده دارای مجوز و متناسب با خودرو'},
 {id:'mountain',name:'جاده کوهستانی',weights:[10,18],cap:350,suggest:'تهران–دیزین / محور کوهستانی مجاز، مشروط به ایمنی'}
];
function calculate({target,twoDiff=false,caps={},startOdo=0}){
 if(!Number.isSafeInteger(target)||target<1||target>200000)throw new Error('هدف پیمایش دوام باید عدد صحیح بین ۱ تا ۲۰۰٬۰۰۰ کیلومتر باشد.');
 if(!Number.isFinite(startOdo)||startOdo<0)throw new Error('کیلومترشمار شروع معتبر نیست.');
 const dual=twoDiff===true||twoDiff==='yes',totalWeight=routes.reduce((sum,r)=>sum+r.weights[dual?1:0],0);
 let weightBefore=0,days=0;
 const rows=routes.map(route=>{
  const weight=route.weights[dual?1:0],cap=Number(caps[route.id]??route.cap);
  if(!Number.isSafeInteger(cap)||cap<1||cap>200000)throw new Error('سقف روزانه '+route.name+' باید عدد صحیح مثبت باشد.');
  const round=weight=>Math.floor((2*target*weight+totalWeight)/(2*totalWeight));
  const km=round(weightBefore+weight)-round(weightBefore);weightBefore+=weight;
  const count=km?Math.ceil(km/cap):0;days+=count;
  return {...route,weight,share:weight/totalWeight,cap,km,days:count,lastKm:count?km-(count-1)*cap:0};
 });
 const schedule=[];let cum=0;
 for(const row of rows)for(let index=0;index<row.days;index++){
  const km=index===row.days-1?row.lastKm:row.cap;cum+=km;
  schedule.push({day:schedule.length+1,routeId:row.id,type:row.name,route:row.suggest,km,cum,odo:startOdo+cum,cap:row.cap,over:false});
 }
 return {target,days,rows,schedule};
}
const api={routes,calculate};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.BAMCO_DURABILITY_PLANNER=api;
})(typeof window==='object'?window:globalThis);
