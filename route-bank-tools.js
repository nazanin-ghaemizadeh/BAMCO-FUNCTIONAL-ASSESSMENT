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
function mountMap(host,records,{language='fa',selected=false}={}){
 const t=labels[language]||labels.fa,li=langIndex[language]??0,fmt=n=>n.toLocaleString(language==='fa'?'fa-IR':language);
 let map,disposed=false,resize,retriedCleanup;
 const bar=node('div','','bank-map-heading'),heading=node('div');heading.append(node('h2',t.map),node('span',fmt(records.length)+' '+unit[language]+' · '+(selected?t.selected:t.all)));
 const fit=node('button',t.fit,'assessment-action');fit.type='button';fit.disabled=true;bar.append(heading,fit);
 const legend=node('div','','bank-map-legend');for(const [key,p]of Object.entries(palette)){const item=node('span',names[key][li]);item.style.setProperty('--route-color',p.color);legend.append(item)}
 const canvas=node('div','','bank-map-canvas');canvas.setAttribute('aria-label',t.map);canvas.setAttribute('role','region');canvas.tabIndex=0;
 const caption=node('p',t.overview,'bank-map-caption'),status=node('div','','bank-map-status');status.setAttribute('role','status');
 host.replaceChildren(bar,legend,canvas,caption,status);
 const cleanup=()=>{disposed=true;retriedCleanup?.();resize?.disconnect();if(map){map.remove();map=null}};
 (async()=>{
  try{
   if(!document.querySelector('[data-bank-leaflet]')){const css=document.createElement('link');css.rel='stylesheet';css.href=asset('./vendor/leaflet-1.9.4.css');css.dataset.bankLeaflet='';document.head.append(css)}
   const [[boundary,coords]]=await Promise.all([loadGeography(),script('./vendor/leaflet-1.9.4.js',()=>root.L)]);
   if(disposed||!host.isConnected)return;
   const L=root.L;map=L.map(canvas,{scrollWheelZoom:false,minZoom:4,maxZoom:12,attributionControl:true}).setView([32.4,53.7],5);
   map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>');
   const country=L.geoJSON(boundary,{style:{color:'#83a99a',weight:1.8,fillColor:'#f5faf6',fillOpacity:1},interactive:false}).addTo(map);
   const reset=()=>map?.fitBounds(country.getBounds(),{padding:[20,20]});fit.disabled=false;fit.onclick=reset;
   const located=locate(records,coords),used=new Set(located.flatMap(x=>[normalize(x.row.definition.origin),normalize(x.row.definition.destination)]));
   for(const [name,p]of Object.entries(coords))if(!used.has(normalize(name)))L.circleMarker([p[1],p[0]],{radius:3,weight:1,color:'#9faeaa',fillColor:'#fff',fillOpacity:1}).addTo(map).bindTooltip(node('span',name+' · '+t.unselected));
   // Group shared city markers so every route remains accessible at busy endpoints.
   const endpoints=new Map();
   for(const item of located){
    const {row,a,b}=item,d=row.definition,p=palette[d.routeId]||palette.rural;
    const popup=()=>{const box=node('div','','bank-map-popup');box.append(node('strong',d.name),node('p',names[d.routeId]?.[li]||d.routeId),node('p',d.origin+' — '+d.destination),node('small',d.active?t.active:t.inactive));const link=node('a',t.show);link.href='https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',travelmode:'driving',origin:d.origin+', Iran',destination:d.destination+', Iran'});link.target='_blank';link.rel='noopener noreferrer';box.append(link);return box};
    if(a&&b&&a.join(',')!==b.join(',')){
     L.polyline([[a[1],a[0]],[b[1],b[0]]],{color:p.color,weight:3,opacity:d.active ? .7 : .35,dashArray:d.active?'7 6':'2 7'}).addTo(map).bindPopup(popup).bindTooltip(node('span',d.name));
    }
    for(const [name,point]of [[d.origin,a],[d.destination,b]])if(point){const key=point.join(',');if(!endpoints.has(key))endpoints.set(key,{point,name,rows:new Map()});endpoints.get(key).rows.set(row.id,{row,popup})}
   }
   for(const {point,name,rows}of endpoints.values()){
    const types=[...new Set([...rows.values()].map(x=>x.row.definition.routeId))],color=types.length===1?(palette[types[0]]||palette.rural).color:'#286c54';
    const popup=node('div','','bank-city-popup');popup.append(node('strong',name+' · '+fmt(rows.size)+' '+unit[language]));
    for(const {row,popup:detail}of rows.values()){const entry=node('details');entry.append(node('summary',row.definition.name),detail());popup.append(entry)}
    L.circleMarker([point[1],point[0]],{radius:rows.size>1?7:5,weight:2,color:'#fff',fillColor:color,fillOpacity:1}).addTo(map).bindTooltip(node('span',name+' · '+fmt(rows.size)),{permanent:records.length<=12,direction:'top',offset:[0,-7],className:'bank-city-label'}).bindPopup(popup,{maxWidth:330});
   }
   const missing=located.filter(x=>x.missing.length);
   if(missing.length){const details=node('details','','bank-map-missing');details.open=true;details.append(node('summary',t.missing+' · '+fmt(missing.length)));const ul=node('ul');for(const x of missing)ul.append(node('li',x.row.definition.name+' ('+(names[x.row.definition.routeId]?.[li]||'')+') — '+[...new Set(x.missing)].join('، ')));details.append(ul);status.append(details)}
   reset();resize=new ResizeObserver(()=>{if(map)map.invalidateSize()});resize.observe(canvas);
  }catch(error){if(disposed||!host.isConnected)return;console.warn('Route bank map:',error);canvas.textContent=t.mapError;const retry=node('button',t.retry,'assessment-action');retry.type='button';retry.onclick=()=>{cleanup();retriedCleanup=mountMap(host,records,{language,selected})};status.replaceChildren(retry)}
 })();
 return cleanup;
}
function buildWorkbook(Excel,records,{language='fa',selected=false,now=new Date()}={}){
 const t=labels[language]||labels.fa,li=langIndex[language]??0,rtl=language==='fa',font=rtl?'B Nazanin':language==='zh'?'Microsoft YaHei':'Times New Roman';
 const book=new Excel.Workbook();book.creator='BAMCO';book.created=now;book.modified=now;
 const sheet=book.addWorksheet(t.routes,{views:[{rightToLeft:rtl,state:'frozen',ySplit:4}],pageSetup:{paperSize:8,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:4'}});
 const widths=[8,36,24,22,22,22,18,14,70];sheet.columns=widths.map(width=>({width}));
 const title=(s,heading,last)=>{s.mergeCells(1,1,1,last);s.getCell(1,1).value=heading;s.getCell(1,1).font={name:font,size:22,bold:true,color:{argb:'FFFFFFFF'}};s.getCell(1,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1D584A'}};s.getCell(1,1).alignment={horizontal:'center',vertical:'middle'};s.getRow(1).height=42};
 title(sheet,t.title,9);sheet.mergeCells('A2:I2');sheet.getCell('A2').value=(selected?t.selected:t.all)+' · '+records.length+' '+t.count+' · '+new Intl.DateTimeFormat(language==='fa'?'fa-IR':language,{dateStyle:'medium'}).format(now);sheet.getCell('A2').font={name:font,size:13,color:{argb:'FF466A5C'}};sheet.getCell('A2').alignment={horizontal:'center',vertical:'middle'};sheet.getRow(2).height=28;
 const headers=['no','name','type','origin','destination','km','direction','status','notes'].map(k=>t[k]);
 const data=records.map((r,i)=>{const d=r.definition;return [i+1,d.name,names[d.routeId]?.[li]||d.routeId,d.origin,d.destination,typeof d.km==='number'?d.km:null,d.bidirectional?t.both:t.one,d.active?t.active:t.inactive,d.notes||'']});
 sheet.addTable({name:'Routes',ref:'A4',headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium4',showRowStripes:false},columns:headers.map(name=>({name,filterButton:true})),rows:data});
 function styleRow(row,{header=false,fill='FFFFFF',color='254C3E'}={}){row.eachCell({includeEmpty:true},cell=>{cell.font={name:font,size:12,bold:header,color:{argb:'FF'+(header?'FFFFFF':color)}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true,readingOrder:rtl?'rtl':'ltr'};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+(header?'317A65':fill)}};cell.border=Object.fromEntries(['top','bottom','left','right'].map(k=>[k,{style:'thin',color:{argb:'FFD5E4DC'}}]))})}
 styleRow(sheet.getRow(4),{header:true});sheet.getRow(4).height=34;
 records.forEach((r,i)=>{const d=r.definition,row=sheet.getRow(i+5),p=palette[d.routeId]||palette.rural;styleRow(row,{fill:i%2?'FFFFFF':p.fill.slice(1)});row.height=Math.min(409,Math.max(42,...data[i].map((v,j)=>Math.ceil(String(v??'').length/(widths[j]*1.15))*18+14)));row.getCell(3).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+p.fill.slice(1)}};row.getCell(3).font={name:font,size:12,bold:true,color:{argb:'FF'+p.color.slice(1)}};row.getCell(6).numFmt='#,##0.###';row.getCell(8).font={name:font,size:12,bold:true,color:{argb:d.active?'FF26704F':'FF886B8D'}};row.getCell(9).alignment={horizontal:rtl?'right':'left',vertical:'middle',wrapText:true}});
 sheet.autoFilter={from:'A4',to:'I'+Math.max(4,records.length+4)};sheet.pageSetup.printArea='A1:I'+Math.max(4,records.length+4);
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
