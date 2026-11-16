(()=>{'use strict';
const coords={'تهران':[51.389,35.6892],'قم':[50.8764,34.6416],'کرج':[50.9916,35.84],'دیزین':[51.423,36.05],'ساری':[53.0586,36.5659],'فیروزکوه':[52.7751,35.7569],'قزوین':[50.0041,36.2688],'کاشان':[51.4272,33.985],'اصفهان':[51.666,32.6539],'یزد':[54.3675,31.8974],'کرمان':[57.0788,30.2839],'شهداد':[57.6969,30.4214],'بم':[58.3568,29.106],'زاهدان':[60.8729,29.4963],'جیرفت':[57.7382,28.6751],'شیراز':[52.5311,29.5926],'مشهد':[59.6168,36.2605],'گرگان':[54.4342,36.8456],'رشت':[49.5887,37.2808],'شاهرود':[54.9763,36.4182],'اراک':[49.6892,34.0917],'ساوه':[50.3566,35.0213],'تبریز':[46.2919,38.08],'اهواز':[48.67,31.32],'بندرعباس':[56.28,27.18],'بوشهر':[50.84,28.92],'چالوس':[51.42,36.65],'یاسوج':[51.59,30.67],'گناوه':[50.52,29.58],'کنگان':[52.06,27.84],'شهرکرد':[50.86,32.33],'دزفول':[48.4,32.38],'خرم آباد':[48.36,33.49],'کرمانشاه':[47.07,34.31],'سنندج':[47.0,35.31],'اردبیل':[48.29,38.25],'زنجان':[48.48,36.67],'بیرجند':[59.22,32.86],'دامغان':[54.35,36.17],'طبس':[56.92,33.59],'بروجرد':[48.75,33.9],'آمل':[52.35,36.47],'سراب':[47.53,37.94],'ارومیه':[45.07,37.55],'جاسک':[57.77,25.65],'چابهار':[60.64,25.29],'نهبندان':[60.04,31.54],'سیرجان':[55.67,29.45],'حاجی آباد':[55.9,28.31],'مریوان':[46.18,35.53],'چلگرد':[50.12,32.46],'لواسان':[51.63,35.82],'وردیج':[51.13,35.8],'گرمسار':[52.34,35.22],'آران و بیدگل':[51.48,34.06],'آزادبر':[51.27,36.12],'طالقان':[50.77,36.17],'آبادان':[48.29,30.35],'بندر ماهشهر':[49.19,30.56]};
const tehran=[{name:'میدان آزادی',coord:[51.338,35.6997]},{name:'میدان ونک',coord:[51.409,35.7575]},{name:'میدان تجریش',coord:[51.429,35.805]},{name:'میدان انقلاب',coord:[51.391,35.701]},{name:'میدان آزادی',coord:[51.338,35.6997]}];
let request=0,map=null;const cache=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=x=>Number(x).toLocaleString(document.documentElement.lang==='fa'?'fa-IR':'en-US',{maximumFractionDigits:1});
function points(p){
 if(Array.isArray(p.points)&&p.points.length>1)return p.points;
 const city=p.origin||'تهران',day=Number(p.day);
 const pt=(name,coord)=>({name,coord});
 // Urban days use one continuous cross-city itinerary, not repeated short circuits.
 if(p.routeId==='urban'&&city==='تهران')return [
  pt('آزادی',[51.338,35.6997]),pt('صادقیه',[51.334,35.718]),pt('چیتگر',[51.207,35.744]),
  pt('شهرک غرب',[51.374,35.758]),pt('تجریش',[51.429,35.805]),pt('تهرانپارس',[51.55,35.73]),
  pt('نارمک',[51.50,35.73]),pt('پیروزی',[51.48,35.69]),pt('شهرری',[51.44,35.59]),
  pt('یافت‌آباد',[51.33,35.65]),pt('آزادی',[51.338,35.6997])
 ];
 if(p.routeId==='urban'&&city==='ساری')return [
  pt('مرکز ساری',[53.0586,36.5659]),pt('شمال‌غرب ساری',[53.025,36.60]),pt('شمال ساری',[53.0586,36.605]),pt('شمال‌شرق ساری',[53.095,36.60]),pt('شرق ساری',[53.105,36.575]),pt('شمال‌شرق مرکزی',[53.085,36.585]),pt('مرکز ساری',[53.0586,36.5659]),pt('جنوب‌شرق ساری',[53.095,36.535]),pt('جنوب ساری',[53.055,36.525]),pt('جنوب‌غرب ساری',[53.015,36.535]),pt('غرب ساری',[53.005,36.57]),pt('مرکز غربی ساری',[53.03,36.565]),pt('مرکز ساری',[53.0586,36.5659]),pt('شمال‌غرب ساری',[53.025,36.60]),pt('شرق ساری',[53.105,36.575]),pt('جنوب‌غرب ساری',[53.015,36.535]),pt('مرکز ساری',[53.0586,36.5659])
 ];
 // A highway circuit via Qazvin and Karaj gives a real long-distance route
 // for the 250 km Tehran highway days.
 if((day===5||day===25)&&city==='تهران')return [pt('تهران',[51.389,35.6892]),pt('دیزین',[51.423,36.05]),pt('تهران',[51.389,35.6892])];
 if((day===4||day===24)&&city==='تهران')return [
  pt('تهران',[51.389,35.6892]),pt('قزوین',[50.0041,36.2688]),
  pt('کرج',[50.9916,35.84]),pt('تهران',[51.389,35.6892])
 ];
 let origin=city,destination=p.destination;
 if(!destination){const names=Object.keys(coords).filter(n=>String(p.name||p.route).includes(n)).sort((a,b)=>String(p.name||p.route).indexOf(a)-String(p.name||p.route).indexOf(b));origin=names[0]||city;destination=names.at(-1)||origin;}
 const result=[pt(origin,coords[origin])];
 if(String(p.name||p.route).includes('فیروزکوه'))result.push(pt('فیروزکوه',coords['فیروزکوه']));
 result.push(pt(destination,coords[destination]));
 return result.every(x=>x.coord)?result:[];
}
function html(p){const ps=points(p),url='https://www.google.com/maps/dir/?api=1&travelmode=driving&origin='+encodeURIComponent(ps[0]?.coord.slice().reverse().join(',')||p.origin||'تهران')+'&destination='+encodeURIComponent(ps.at(-1)?.coord.slice().reverse().join(',')||p.destination||'تهران')+(ps.length>2?'&waypoints='+encodeURIComponent(ps.slice(1,-1).map(x=>x.coord.slice().reverse().join(',')).join('|')):'');
 queueMicrotask(()=>mount(p));return '<div class="map-grid"><div id="roadMap" class="map-frame road-map" aria-label="نقشه مسیر جاده‌ای"></div><div class="route-info"><h3>'+esc(p.name||p.route||'مسیر روز')+'</h3><div class="route-day-target"><span>هدف پیمایش این روز</span><strong>'+number(p.km)+' <small>کیلومتر</small></strong></div>'+'<h3>توالی مسیر روز</h3><ol>'+ps.map((x,i)=>'<li>'+number(i+1)+'. '+esc(x.name)+'</li>').join('')+'</ol><div id="roadStatus" role="status">در حال دریافت مسیر جاده‌ای…</div><a class="map-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">بازکردن مسیر با نقاط میانی در گوگل مپ</a></div></div>';
}
async function leaflet(){if(window.L)return;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/leaflet-1.9.4.js';script.onload=resolve;script.onerror=reject;document.head.append(script)})}
function kmBetween(a,b){const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2))}
function trim(geometry,target){let sum=0,out=[geometry[0]];for(let i=1;i<geometry.length;i++){const dist=kmBetween(geometry[i-1],geometry[i]);if(sum+dist>target){const f=(target-sum)/dist;out.push(geometry[i-1].map((v,j)=>v+(geometry[i][j]-v)*f));break}out.push(geometry[i]);sum+=dist}return out}
async function mount(p){
 const token=++request,host=document.getElementById('roadMap'),status=document.getElementById('roadStatus');
 if(!host)return;
 let ps=points(p);
 try{
  if(ps.length<2)throw Error('نقاط مسیر برای این روز تعریف نشده‌اند.');
  const getRoad=async list=>{
   const path=list.map(x=>x.coord.join(',')).join(';');
   if(cache.has(path))return cache.get(path);
   const response=await fetch('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=full&geometries=geojson&steps=true',{signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('مسیریاب جاده‌ای پاسخ نداد.');
   const body=await response.json(),road=body.routes?.[0];
   if(body.code!=='Ok'||!road||!(road.distance>0))throw Error('مسیر جاده‌ای معتبر پیدا نشد.');
   cache.set(path,road);return road;
  };
  let road=await getRoad(ps);
  const planned=Number(p.km);
  // If a one-way route is shorter than the daily target, route the legal return
  // leg as part of one continuous out-and-back journey (never repeat a short lap).
  if(road.distance/1000<planned&&ps[0].coord.join(',')!==ps.at(-1).coord.join(',')){
   ps=[...ps,ps[0]];
   road=await getRoad(ps);
  }
  if(token!==request||!host.isConnected)return;
  const routeKm=road.distance/1000;
  if(routeKm+0.5<planned)throw Error('مسیر جاده‌ای انتخاب‌شده '+number(routeKm)+' کیلومتر است و برای هدف '+number(planned)+' کیلومتر کافی نیست؛ نقشه عمداً به‌عنوان مسیر تأییدشده نمایش داده نمی‌شود.');
  await leaflet();if(token!==request||!host.isConnected)return;
  if(map){map.remove();map=null}
  map=L.map(host).setView(ps[0].coord.slice().reverse(),11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
  const geo=road.geometry.coordinates;
  const geomKm=geo.slice(1).reduce((sum,b,i)=>sum+kmBetween(geo[i],b),0);
  const traveled=trim(geo,Math.min(geomKm,planned*(geomKm/routeKm)));
  const line=traveled.map(x=>[x[1],x[0]]);
  if(line.length<2)throw Error('هندسه مسیر برای نمایش کافی نیست.');
  L.polyline(line,{color:'#257461',weight:7,opacity:.9}).addTo(map);
  const startCoord=line[0],endCoord=line.at(-1);
  L.marker(startCoord).addTo(map).bindPopup('شروع مسیر');
  L.circleMarker(endCoord,{radius:8,color:'#a575bd',fillOpacity:1}).addTo(map).bindPopup('پایان '+number(planned)+' کیلومتر');
  map.fitBounds(L.latLngBounds(line),{padding:[22,22]});map.invalidateSize();
  const info={roadKm:routeKm,plannedKm:planned,displayedKm:planned,points:ps,endCoordinate:endCoord.slice().reverse(),duration:road.duration};
  status.textContent='مسیر جاده‌ای بر اساس شبکه واقعی راه‌ها؛ طول پیمایش نمایش‌داده‌شده: '+number(planned)+' کیلومتر.';
  status.append(document.createElement('br'),'فقط بخشی از مسیر که با هدف روزانه تطبیق دارد نمایش داده شده است؛ ترافیک زنده لحاظ نشده است.');
  const list=host.parentElement.querySelector('ol');
  const visited=[ps[0]];let passed=0;for(let i=0;i<(road.legs||[]).length;i++){passed+=road.legs[i].distance;if(passed<=planned*1000+1)visited.push(ps[i+1]);else break;}
  if(list)list.innerHTML=visited.map((x,i)=>'<li>'+number(i+1)+'. '+esc(x.name)+'</li>').join('');
  const link=host.parentElement.querySelector('a.map-link');
  if(link){
   const url=new URL(link.href);
   url.searchParams.set('origin',ps[0].coord.slice().reverse().join(','));
   url.searchParams.set('destination',endCoord.slice().reverse().join(','));
   url.searchParams.set('waypoints',ps.slice(1,-1).map(x=>x.coord.slice().reverse().join(',')).join('|'));
   link.href=url.href;
  }
  window.BAMCO_ROUTE_MAP.last=info;
 }catch(error){
  if(token===request&&status){
   status.textContent=error.message||'طول مسیر تأیید نشد.';
   host.textContent='مسیر با کیلومتر هدف تطبیق داده نشد؛ نمایش نقشه تأییدنشده متوقف شد.';
   window.BAMCO_ROUTE_MAP.last=null;
  }
 }
}
window.BAMCO_ROUTE_MAP={html,points,coords,mount,trim,last:null};
})();
