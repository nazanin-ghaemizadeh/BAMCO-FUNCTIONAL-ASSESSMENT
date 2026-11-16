const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert');
(async()=>{const w=new JSDOM('<body><div class="map-grid"><div id="roadMap"></div><div id="roadStatus"></div><ol></ol><a class="map-link" href="https://www.google.com/maps/dir/?api=1"></a></div></body>',{url:'https://example.test',runScripts:'outside-only'}).window;
for(const f of ['data.js','durability-planner.js','route-map.js'])w.eval(fs.readFileSync('./'+f,'utf8'));
const calls=[],lines=[];w.fetch=async url=>{calls.push(url);const coords=url.split('/driving/')[1].split('?')[0].split(';').map(s=>s.split(',').map(Number));return {ok:true,json:async()=>({code:'Ok',routes:[{distance:coords.length===2?100000:220000,duration:7200,geometry:{coordinates:coords}}]})}};
const chain=()=>({addTo(){return this},bindPopup(){return this}});w.L={map:()=>({setView(){return this},remove(){},fitBounds(){},invalidateSize(){}}),tileLayer:chain,marker:chain,circleMarker:chain,latLngBounds:x=>x,polyline:(x,o)=>{lines.push(x);return chain()}};
let ps=w.BAMCO_ROUTE_MAP.points({name:'یزد → تهران',routeId:'rural'});assert.equal(ps[0].name,'یزد');assert.equal(ps.at(-1).name,'تهران');
ps=w.BAMCO_ROUTE_MAP.points({name:'تهران ـ کوهستان',routeId:'mountain'});assert(ps.length>=3);assert.notEqual(ps[1].name,'تهران');
// The fixed Drive Reference highway days must never use the durability city catalog.
const catalogOptions=w.BAMCO_DURABILITY_PLANNER.optionsFrom;
w.BAMCO_DURABILITY_PLANNER.optionsFrom=()=>{throw Error('A Tehran highway day must not select an intercity destination')};
for(const day of [4,24]){
 const p=w.BAMCO_DATA.driveDays.find(p=>p.day===day),local=w.BAMCO_ROUTE_MAP.points(p);
 assert.equal(p.route,'تهران ـ بزرگراه');assert.equal(p.km,250);
 assert(local.length>=3);assert(local.every(x=>x.name.startsWith('تهران، بزرگراه')));
 assert(local.every(x=>x.coord[0]>51.3&&x.coord[0]<51.45&&x.coord[1]>35.7&&x.coord[1]<35.8));
 assert.deepEqual(local[0].coord,local.at(-1).coord);
 await w.BAMCO_ROUTE_MAP.mount(p);
 assert(w.BAMCO_ROUTE_MAP.last.loop);assert.equal(w.BAMCO_ROUTE_MAP.last.plannedKm,250);
 assert.equal(w.BAMCO_ROUTE_MAP.last.laps,1);assert.equal(w.BAMCO_ROUTE_MAP.last.remainder,30);
 assert(!w.document.querySelector('ol').textContent.includes('شاهرود'));
 assert(w.document.querySelector('a').href.includes('waypoints='));
}
w.BAMCO_DURABILITY_PLANNER.optionsFrom=catalogOptions;
calls.length=0;lines.length=0;
await w.BAMCO_ROUTE_MAP.mount({origin:'تهران',destination:'قم',routeId:'rural',km:500});assert.equal(calls.length,2);assert.equal(calls[1].split('/driving/')[1].split('?')[0].split(';').length,3);assert.equal(w.BAMCO_ROUTE_MAP.last.laps,2);assert.equal(w.BAMCO_ROUTE_MAP.last.remainder,60);assert(lines.length>=2);
await w.BAMCO_ROUTE_MAP.mount({origin:'تهران',destination:'قم',routeId:'offroad',km:200});assert.equal(w.BAMCO_ROUTE_MAP.last,null);assert(w.document.getElementById('roadStatus').textContent.includes('خارج‌جاده'));
w.close();console.log('PASS routing: ordered endpoints, mountain circuit, router-supplied return leg, laps and partial distance, honest off-road failure.');})();

