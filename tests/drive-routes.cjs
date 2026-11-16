const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

(async()=>{
 const w=new JSDOM('<html lang="fa" dir="rtl"><body></body></html>',{url:'https://example.test/',runScripts:'outside-only'}).window;
 const roads=JSON.parse(fs.readFileSync('assets/drive-routes.json','utf8')).routes;
 for(const file of ['data.js','route-map.js'])w.eval(fs.readFileSync(file,'utf8'));
 const cumulative=[150,300,450,700,800,923,1143,1293,1443,1671,2655,2752,2849,2946,3135,3650,4165,4680,4950,5220,5505,6180,6330,6580,6680,6930];
 const points=w.BAMCO_ROUTE_MAP.coords;
 const next=()=>new Promise(resolve=>setImmediate(resolve));
 const unit=()=>({addTo(){return this},bindPopup(){return this}});
 let displayed=[],requests=0,km=0;
 w.fetch=async url=>{
  assert.match(String(url),/^\.\/assets\/drive-routes\.json/);
  requests++;return {ok:true,json:async()=>({routes:roads})};
 };
 w.L={map:()=>({remove(){},fitBounds(line){displayed=line}}),tileLayer:unit,circleMarker:unit,polyline:unit,latLngBounds:x=>x};
 const plan=w.BAMCO_DATA.driveDays;
 for(const p of plan){
  const options=roads[p.name];assert(options?.length,p.name);
  km+=p.km;assert.equal(km,cumulative[p.day-1]);
  w.document.body.innerHTML=w.BAMCO_ROUTE_MAP.driveHtml({...p,cum:km});
  await next();
  for(const [i,route] of options.entries()){
   if(i){w.document.querySelectorAll('.drive-variant button')[i].click();await next()}
   const last=w.BAMCO_ROUTE_MAP.last,expected=route.legs.reduce((s,l)=>s+l.meters,0)/1000;
   assert.equal(last.displayedKm,expected);
   assert.equal(w.document.querySelector('[data-road-km]').textContent,expected.toLocaleString('fa-IR',{maximumFractionDigits:1}));
   assert.equal(w.document.querySelectorAll('ol li').length,route.legs.length+1);
   assert(displayed.length>30,p.name);
   if(p.name.includes(' → ')){
    const [origin,tail]=p.name.split(' → '),destination=tail.split(' از ')[0];
    assert.equal(last.points[0].name,origin);assert.equal(last.points.at(-1).name,destination);
    for(const [at,n] of [[displayed[0],origin],[displayed.at(-1),destination]]){
     assert(Math.abs(at[0]-points[n][1])<0.015&&Math.abs(at[1]-points[n][0])<0.015,p.name);
    }
   }else{
    assert.equal(expected,p.km);
    if(p.name==='تهران ـ بزرگراه')assert(displayed.every(([lat,lon])=>lat>35.58&&lat<35.82&&lon>51.15&&lon<51.6));
    if(p.name==='ساری ـ شهری')assert(displayed.every(([lat,lon])=>lat>36.50&&lat<36.62&&lon>52.98&&lon<53.11));
   }
   if(p.day===10)assert.deepEqual(Array.from(last.points,stop=>stop.name),['ساری','فیروزکوه','تهران']);
   if(p.day===21)assert(last.displayedKm>500&&p.km===285);
  }
 }
 assert.equal(requests,1);
 w.close();console.log('PASS all 26 drive days, route endpoints, local boundaries, route choices, geometry and mileage.');
})().catch(error=>{console.error(error);process.exitCode=1});
