(function(root){
'use strict';
const palette={urban:{color:'#367f6a',fill:'#edf8f1'},rural:{color:'#476c96',fill:'#edf4fc'},hot:{color:'#b96b19',fill:'#fff3e2'},mountain:{color:'#8065a0',fill:'#f4eefb'},offroad:{color:'#926c44',fill:'#f8f1e8'}};
const labels={fa:{title:'بانک مسیرها',routes:'مسیرها',summary:'خلاصه مسیرها',no:'ردیف',name:'نام مسیر',type:'نوع مسیر',origin:'مبدأ',destination:'مقصد',km:'مسافت مرجع (کیلومتر)',direction:'جهت حرکت',status:'وضعیت',notes:'مسیر عبوری و توضیحات',both:'دوطرفه',one:'یک‌طرفه',active:'فعال',inactive:'غیرفعال',all:'کل نتایج فیلترشده',selected:'مسیرهای انتخاب‌شده',count:'تعداد مسیر',cities:'شهرهای مبدأ و مقصد',map:'نقشه مسیرها',overview:'نمای کلی مبدأ و مقصد؛ خطوط، مسیر دقیق جاده نیستند.',missing:'موقعیت مشخص نشده',unselected:'شهرهای خارج از انتخاب فعلی',fit:'نمای ایران',retry:'تلاش مجدد',mapError:'نقشه بارگیری نشد.',show:'مسیریابی در گوگل مپ'},en:{title:'Route bank',routes:'Routes',summary:'Route summary',no:'No.',name:'Route name',type:'Route type',origin:'Origin',destination:'Destination',km:'Reference distance (km)',direction:'Direction',status:'Status',notes:'Waypoints and notes',both:'Both directions',one:'One way',active:'Active',inactive:'Inactive',all:'All filtered routes',selected:'Selected routes',count:'Routes',cities:'Origin / destination cities',map:'Route map',overview:'Origin and destination overview; lines are not exact road paths.',missing:'Location not defined',unselected:'Cities outside the current selection',fit:'Show Iran',retry:'Retry',mapError:'Map could not load.',show:'Directions in Google Maps'},zh:{title:'路线库',routes:'路线',summary:'路线汇总',no:'序号',name:'路线名称',type:'路线类型',origin:'起点',destination:'终点',km:'参考距离（公里）',direction:'方向',status:'状态',notes:'途经地点及备注',both:'双向',one:'单向',active:'启用',inactive:'停用',all:'全部筛选路线',selected:'所选路线',count:'路线数量',cities:'起点及终点城市',map:'路线地图',overview:'起终点概览；连线并非实际道路。',missing:'位置未定义',unselected:'当前选择以外的城市',fit:'查看伊朗',retry:'重试',mapError:'无法加载地图。',show:'在谷歌地图中查看路线'}};
const names={urban:['شهری','Urban','城市'],rural:['برون‌شهری','Interurban','城际'],hot:['گرمسیری','Hot climate','高温'],mountain:['کوهستانی','Mountain','山区'],offroad:['خارج‌جاده / خاکی','Off-road','越野']};
const langIndex={fa:0,en:1,zh:2};
const unit={fa:'مسیر',en:'routes',zh:'条路线'};
const normalize=s=>String(s||'').trim().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\s\u200c\u200e\u200f]+/g,'');
function locate(records,coords){
 const lookup=new Map(Object.entries(coords).map(([name,point])=>[normalize(name),point]));
 return records.map(row=>{const d=row.definition,a=lookup.get(normalize(d.origin)),b=lookup.get(normalize(d.destination));return {row,a,b,missing:[!a&&d.origin,!b&&d.destination].filter(Boolean)}});
}
const asset=p=>root.BAMCO_RELEASE?.asset(p)||p;
const pending=new Map();
function script(src,ready){
 if(ready())return Promise.resolve();if(pending.has(src))return pending.get(src);
 const task=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=asset(src);s.onload=()=>ready()?resolve():reject(Error('Library unavailable'));s.onerror=()=>{s.remove();reject(Error('Library unavailable'))};document.head.append(s)}).catch(e=>{pending.delete(src);throw e});pending.set(src,task);return task;
}
let geography;
function loadGeography(){return geography??=(Promise.all(['iran-boundary','route-cities'].map(name=>fetch(asset('./assets/'+name+'.json')).then(r=>{if(!r.ok)throw Error('Map data');return r.json()}))).catch(e=>{geography=null;throw e}))}
function node(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;e.className=cls;return e}
function mountMap(host,records,{language='fa',enabledTypes=new Set(Object.keys(palette)),renderCard,onTypesChange=()=>{}}={}){
 const t=labels[language]||labels.fa,li=langIndex[language]??0,fmt=n=>n.toLocaleString(language==='fa'?'fa-IR':language);
 const ui={fa:{close:'بستن',previous:'قبلی',next:'بعدی',city:'مسیرهای',empty:'برای نمایش مسیرها، یک نوع مسیر را روشن کنید.',tiles:'نقشه زمینه در دسترس نیست؛ نمای ساده نمایش داده می‌شود.'},en:{close:'Close',previous:'Previous',next:'Next',city:'Routes at',empty:'Turn on a route type to display routes.',tiles:'Basemap unavailable; showing the simplified map.'},zh:{close:'关闭',previous:'上一条',next:'下一条',city:'路线：',empty:'请启用一种路线类型。',tiles:'底图不可用，正在显示简化地图。'}}[language]||{};
 let map,disposed=false,resize,retriedCleanup,drawLayers=()=>{};
 const bar=node('div','','bank-map-heading'),heading=node('h2',t.map);
 const fit=node('button',t.fit,'assessment-action');fit.type='button';fit.disabled=true;bar.append(heading,fit);
 const legend=node('div','','bank-map-legend');legend.setAttribute('role','group');legend.setAttribute('aria-label',t.type);
 const syncLegend=()=>{for(const button of legend.children)button.setAttribute('aria-pressed',String(enabledTypes.has(button.dataset.route)))};
 for(const [key,p]of Object.entries(palette)){
  const button=node('button','','bank-map-type');button.type='button';button.dataset.route=key;button.style.setProperty('--route-color',p.color);button.style.setProperty('--route-bg',p.fill);
  const illustration=node('span','','bank-map-type-icon');illustration.setAttribute('aria-hidden','true');illustration.innerHTML='<svg viewBox="0 0 96 96"><use href="./assets/route-types.svg?v=06b7be2620213e0f#'+key+'"></use></svg>';
  button.append(illustration,node('span',names[key][li]));button.onclick=()=>{enabledTypes.has(key)?enabledTypes.delete(key):enabledTypes.add(key);syncLegend();drawLayers();onTypesChange()};legend.append(button);
 }
 syncLegend();
 const canvas=node('div','','bank-map-canvas');canvas.setAttribute('aria-label',t.map);canvas.setAttribute('role','region');canvas.tabIndex=0;
 const caption=node('p',t.overview,'bank-map-caption'),status=node('div','','bank-map-status');status.setAttribute('role','status');
 host.replaceChildren(bar,legend,canvas,caption,status);
 const cleanup=()=>{disposed=true;retriedCleanup?.();resize?.disconnect();if(map){map.remove();map=null}};
 (async()=>{
  try{
   if(!document.querySelector('[data-bank-leaflet]')){const css=document.createElement('link');css.rel='stylesheet';css.href=asset('./vendor/leaflet-1.9.4.css');css.dataset.bankLeaflet='';document.head.append(css)}
   const [[boundary,coords]]=await Promise.all([loadGeography(),script('./vendor/leaflet-1.9.4.js',()=>root.L)]);
   if(disposed||!host.isConnected)return;
   const L=root.L;map=L.map(canvas,{scrollWheelZoom:false,minZoom:3,maxZoom:14,zoomSnap:.5,attributionControl:true}).setView([32.4,53.7],5);
   map.attributionControl.setPrefix(false);
   const country=L.geoJSON(boundary,{style:{color:'#598d7d',weight:1.7,fillColor:'#f5faf6',fillOpacity:.07},interactive:false}).addTo(map);
   map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>');
   const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).addTo(map);
   let loadedTiles=0;tiles.on('tileload',()=>{loadedTiles++;country.setStyle({fillOpacity:.07});canvas.classList.remove('is-basemap-unavailable');canvas.removeAttribute('title')});tiles.on('tileerror',()=>{if(!loadedTiles){country.setStyle({fillOpacity:1});canvas.classList.add('is-basemap-unavailable');canvas.title=ui.tiles}});
   const reset=()=>map?.fitBounds(country.getBounds(),{padding:[24,24],animate:false});fit.disabled=false;fit.onclick=reset;
   const routeLayer=L.layerGroup().addTo(map),markerLayer=L.layerGroup().addTo(map);let routeLines=[];
   const highlight=id=>{for(const item of routeLines)item.line.setStyle({weight:item.id===id?5:2.6,opacity:!id?item.opacity:item.id===id?1:.18})};
   const popupFor=(rows,name)=>{
    const container=node('div','','bank-route-popup'),body=node('div','','bank-route-popup-body');let index=0;
    const nav=node('div','','bank-route-popup-nav'),previous=node('button',ui.previous,'assessment-action'),next=node('button',ui.next,'assessment-action'),position=node('span');previous.type=next.type='button';
    const head=node('div','','bank-route-popup-head'),close=node('button',ui.close,'bank-route-popup-close');close.type='button';close.onclick=()=>map.closePopup();head.append(node('div',name?ui.city+' '+name:'','bank-route-popup-city'),close);container.append(head);
    const update=()=>{body.replaceChildren(renderCard?renderCard(rows[index]):node('article',rows[index].definition.name,'bank-card'));highlight(rows[index].id);previous.disabled=index===0;next.disabled=index===rows.length-1;position.textContent=fmt(index+1)+' / '+fmt(rows.length)};
    previous.onclick=()=>{index--;update();map.getPopup?.()?.update()};next.onclick=()=>{index++;update();map.getPopup?.()?.update()};nav.append(previous,position,next);container.append(body);if(rows.length>1)container.append(nav);update();return container;
   };
   const openCards=(rows,name,point)=>{map.closePopup();L.popup({className:'bank-route-map-popup',closeButton:false,maxWidth:350,minWidth:260,maxHeight:470,autoPanPadding:[14,14]}).setLatLng(point).setContent(popupFor(rows,name)).openOn(map)};
   map.on('popupclose',()=>highlight(null));
   drawLayers=()=>{
    if(!map||disposed)return;map.closePopup();routeLayer.clearLayers();markerLayer.clearLayers();routeLines=[];status.replaceChildren();
    const visible=records.filter(r=>enabledTypes.has(r.definition.routeId)),located=locate(visible,coords),endpoints=new Map();
    if(!enabledTypes.size)status.append(node('p',ui.empty,'bank-map-empty'));
    for(const {row,a,b}of located){
     const d=row.definition,p=palette[d.routeId]||palette.rural;
     if(a&&b&&a.join(',')!==b.join(',')){
      // Curves denote registered origin/destination connections, not inferred roads.
      const dx=b[0]-a[0],dy=b[1]-a[1],bend=.1+Object.keys(palette).indexOf(d.routeId)*.025,mx=(a[0]+b[0])/2-dy*bend,my=(a[1]+b[1])/2+dx*bend;
      const curve=Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;return [u*u*a[1]+2*u*t*my+t*t*b[1],u*u*a[0]+2*u*t*mx+t*t*b[0]]});
      const opacity=d.active ? .75 : .4;
      L.polyline(curve,{color:'#fff',weight:5.5,opacity:.8,interactive:false}).addTo(routeLayer);
      const line=L.polyline(curve,{color:p.color,weight:2.6,opacity,dashArray:d.routeId==='offroad'?'5 5':null}).addTo(routeLayer);
      line.bindTooltip(node('span',d.name),{sticky:true});line.on('click',event=>openCards([row],null,event.latlng));routeLines.push({id:row.id,line,opacity});
     }
     for(const [name,point]of [[d.origin,a],[d.destination,b]])if(point){const key=point.join(',');if(!endpoints.has(key))endpoints.set(key,{point,name,rows:new Map()});endpoints.get(key).rows.set(row.id,row)}
    }
    for(const {point,name,rows}of endpoints.values()){
     const related=[...rows.values()],types=[...new Set(related.map(r=>r.definition.routeId))],color=types.length===1?(palette[types[0]]||palette.rural).color:'#286c54';
     const marker=L.marker([point[1],point[0]],{title:ui.city+' '+name,keyboard:true,icon:L.divIcon({className:'bank-map-pin',html:'<span style="--pin-color:'+color+'"></span>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(markerLayer);
     marker.getElement()?.setAttribute('role','button');marker.getElement()?.setAttribute('aria-label',ui.city+' '+name);
     marker.bindTooltip(node('span',name),{direction:'top',offset:[0,-8],className:'bank-city-label',permanent:visible.length<=10});marker.on('click',()=>openCards(related,name,[point[1],point[0]]));
    }
    const missing=located.filter(x=>x.missing.length);
    if(missing.length){const details=node('details','','bank-map-missing');details.append(node('summary',t.missing+' · '+fmt(missing.length)));for(const x of missing){const item=node('button',x.row.definition.name,'assessment-action');item.type='button';item.onclick=()=>{const point=x.a||x.b;openCards([x.row],null,point?[point[1],point[0]]:map.getCenter())};details.append(item)}status.append(details)}
   };
   drawLayers();reset();resize=new ResizeObserver(()=>{if(map)map.invalidateSize()});resize.observe(canvas);
  }catch(error){if(disposed||!host.isConnected)return;console.warn('Route bank map:',error);canvas.textContent=t.mapError;const retry=node('button',t.retry,'assessment-action');retry.type='button';retry.onclick=()=>{cleanup();retriedCleanup=mountMap(host,records,{language,enabledTypes,renderCard,onTypesChange})};status.replaceChildren(retry)}
 })();
 return cleanup;
}
function buildWorkbook(Excel,records,{language='fa',now=new Date()}={}){
 const categoryOrder=['urban','rural','hot','offroad','mountain'];records=[...records].sort((a,b)=>categoryOrder.indexOf(a.definition.routeId)-categoryOrder.indexOf(b.definition.routeId));
 const t=labels[language]||labels.fa,li=langIndex[language]??0,rtl=language==='fa',font=rtl?'B Nazanin':language==='zh'?'Microsoft YaHei':'Times New Roman';
 const book=new Excel.Workbook();book.creator='BAMCO';book.created=now;book.modified=now;
 const sheet=book.addWorksheet(t.routes,{views:[{rightToLeft:rtl,state:'frozen',ySplit:2}],pageSetup:{paperSize:8,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:2'}});
 const widths=[8,36,24,22,22,22,18,14,70];sheet.columns=widths.map(width=>({width}));
 const title=(s,heading,last)=>{s.mergeCells(1,1,1,last);s.getCell(1,1).value=heading;s.getCell(1,1).font={name:font,size:22,bold:true,color:{argb:'FFFFFFFF'}};s.getCell(1,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1D584A'}};s.getCell(1,1).alignment={horizontal:'center',vertical:'middle'};s.getRow(1).height=42};
 title(sheet,t.title,9);
 const headers=['no','name','type','origin','destination','km','direction','status','notes'].map(k=>t[k]);
 const data=records.map((r,i)=>{const d=r.definition;return [i+1,d.name,names[d.routeId]?.[li]||d.routeId,d.origin,d.destination,typeof d.km==='number'?d.km:null,d.bidirectional?t.both:t.one,d.active?t.active:t.inactive,d.notes||'']});
 sheet.addTable({name:'Routes',ref:'A2',headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium4',showRowStripes:false},columns:headers.map(name=>({name,filterButton:true})),rows:data});
 function styleRow(row,{header=false,fill='FFFFFF',color='254C3E'}={}){row.eachCell({includeEmpty:true},cell=>{cell.font={name:font,size:12,bold:header,color:{argb:'FF'+(header?'FFFFFF':color)}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true,readingOrder:rtl?'rtl':'ltr'};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+(header?'317A65':fill)}};cell.border=Object.fromEntries(['top','bottom','left','right'].map(k=>[k,{style:'thin',color:{argb:'FFD5E4DC'}}]))})}
 styleRow(sheet.getRow(2),{header:true});sheet.getRow(2).height=34;
 records.forEach((r,i)=>{const d=r.definition,row=sheet.getRow(i+3),p=palette[d.routeId]||palette.rural;styleRow(row,{fill:p.fill.slice(1)});row.height=Math.min(409,Math.max(42,...data[i].map((v,j)=>Math.ceil(String(v??'').length/(widths[j]*1.15))*18+14)));row.getCell(3).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+p.fill.slice(1)}};row.getCell(3).font={name:font,size:12,bold:true,color:{argb:'FF'+p.color.slice(1)}};row.getCell(6).numFmt='#,##0.###';row.getCell(8).font={name:font,size:12,bold:true,color:{argb:d.active?'FF26704F':'FF886B8D'}};row.getCell(9).alignment={horizontal:rtl?'right':'left',vertical:'middle',wrapText:true}});
 sheet.autoFilter={from:'A2',to:'I'+Math.max(2,records.length+2)};sheet.pageSetup.printArea='A1:I'+Math.max(2,records.length+2);
 const summary=book.addWorksheet(t.summary,{views:[{rightToLeft:rtl}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1}});summary.columns=[{width:32},{width:20},{width:20},{width:20}];title(summary,t.summary,4);summary.addRow([]);summary.addRow([t.type,t.count,t.active,t.inactive]);styleRow(summary.getRow(3),{header:true});summary.getRow(3).height=30;
 for(const [id,p]of Object.entries(palette)){const rs=records.filter(r=>r.definition.routeId===id),row=summary.addRow([names[id][li],rs.length,rs.filter(r=>r.definition.active).length,rs.filter(r=>!r.definition.active).length]);styleRow(row,{fill:p.fill.slice(1),color:p.color.slice(1)});row.height=30}
 const total=summary.addRow([t.count,records.length,records.filter(r=>r.definition.active).length,records.filter(r=>!r.definition.active).length]);styleRow(total,{header:true});total.height=30;
 summary.addRow([]);const cityRow=summary.addRow([t.cities,new Set(records.flatMap(r=>[r.definition.origin,r.definition.destination]).map(normalize)).size]);styleRow(cityRow);cityRow.height=34;
 return book;
}
async function downloadExcel(records,options){
 await script('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',()=>root.ExcelJS);
 const book=buildWorkbook(root.ExcelJS,records,options),buffer=await book.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=node('a');a.href=url;a.download='BAMCO-routes-'+new Date().toISOString().slice(0,10)+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
const api={palette,locate,mountMap,buildWorkbook,downloadExcel};if(typeof module==='object'&&module.exports)module.exports=api;else root.BAMCO_ROUTE_BANK_TOOLS=api;
})(typeof window!=='undefined'?window:globalThis);
