(function(){
'use strict';
const DB=window.BAMCO_DATA, workbook=window.BAMCO_WORKBOOK;
const modes=['drive','durability','supplementary'];
const canonical=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').trim();
const num=v=>v===null||v===undefined||v===''?NaN:Number(String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬]/g,'').replace('٫','.'));
const valid=v=>Number.isFinite(num(v))&&num(v)>=1&&num(v)<=10;
const mean=a=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
const criteria=workbook.criteria.map(c=>({...c,name:canonical(c.name)}));
const categoryId=t=>workbook.tests[t.sourceId]?.categoryId||criteria.find(c=>c.name===canonical(t.cat))?.id||'custom';
function applicable(t,c){return Object.entries({cls:c.vclass,body:c.body,power:c.power,gear:c.gear,drive:c.driveType}).every(([k,value])=>{const rule=t.vehicle?.[k];if(Array.isArray(rule))return rule.includes(value);return !rule||rule==='All'||(rule!=='None'&&String(rule).split(/\s*[/|]\s*/).includes(String(value)))})}
function routeKind(p){if(p?.routeId)return p.routeId;const s=canonical(p?.type||p?.route);if(/برون.?شهری|آزادراه|بزرگراه/.test(s))return 'rural';if(/گرمسیری/.test(s))return 'hot';if(/کوهستان|دیزین/.test(s))return 'mountain';if(/خاکی|خارج.?جاده|آفرود/.test(s))return 'offroad';return /شهری/.test(s)?'urban':'unknown'}
function activeRoutes(snapshot){try{return window.BAMCO_DURABILITY_PLANNER.calculate({target:num(snapshot.config?.durKm)||5000,twoDiff:snapshot.config?.twoDiff,caps:snapshot.config?.routeCaps,shares:snapshot.config?.routeShares}).rows.filter(r=>r.km>0).map(r=>r.id)}catch{return [...new Set((snapshot.durabilitySchedule||[]).map(routeKind))].filter(x=>x!=='unknown')}}
function build(snapshot={},filter={}){
 const config={vclass:'M1',body:'Sedan',power:'ICE',gear:'Automatic',driveType:'FWD',...snapshot.config};
 const staticTests=snapshot.missions?.['supplementary:general']?.customTests||[];
 const testMap=new Map([...DB.tests,...staticTests].map(t=>[t.id,t]));
 const units=new Map(),entries=[],routes=activeRoutes(snapshot),expected=new Set();
 const included=tab=>!filter.mode||filter.mode==='all'||filter.mode===tab;
 function ensure(tab,test){const key=tab+':'+test.id;if(!units.has(key))units.set(key,{key,tab,test,categoryId:categoryId(test),entries:[],expected:new Set(),avg:null});return units.get(key)}
 function expect(unit,key){unit.expected.add(key);expected.add(key)}
 for(const test of [...DB.tests,...staticTests.map(t=>({...t,scope:['supplementary']}))])if(applicable(test,config))for(const tab of test.scope||[])if(included(tab)){
  const unit=ensure(tab,test);
  if(tab==='drive')for(const day of test.days||[])expect(unit,'drive:'+day+':'+test.id);
  if(tab==='supplementary')expect(unit,'supplementary:general:'+test.id);
  if(tab==='durability')for(const route of routes)if(test.routeIds?.includes(route)||(!test.routeIds?.length&&test.stationary))for(let quarter=1;quarter<=4;quarter++)expect(unit,'durability:'+test.id+'@'+route+'-'+quarter);
 }
 const plan={drive:DB.driveDays,durability:snapshot.durabilitySchedule||[]};
 function add(tab,day,id,record,test,custom=false){
  if(!included(tab)||!test||!valid(record.score))return;
  const match=id.match(/@([a-z]+)-([1-4])$/),routeId=match?.[1]||routeKind(plan[tab]?.find(p=>p.day===Number(day))),quarter=match?Number(match[2]):null;
  const key=tab==='durability'&&match?'durability:'+test.id+'@'+match[1]+'-'+match[2]:tab+':'+day+':'+id;
  const unit=ensure(tab,test);if(!expected.has(key))expect(unit,key);
  const daily=snapshot.missions?.[tab+':'+day]||{},mileage=snapshot.mileage?.[tab]||{};
  const distance=Object.hasOwn(mileage,day)?num(mileage[day]):null;
  const cumulative=distance===null?null:Object.entries(mileage).filter(([d,v])=>Number(d)<=Number(day)&&Number.isFinite(num(v))).reduce((sum,[,v])=>sum+num(v),0);
  const entry={key,recordKey:tab+':'+day+':'+id,unitKey:unit.key,tab,day:day==='general'?null:Number(day),id,baseId:test.id,sourceId:test.sourceId||test.id,test,score:num(record.score),note:record.note||'',photo:record.photo||'',routeId,quarter,distance,cumulative,date:daily.date||daily.dailyInfo?.date||'',updatedAt:record.updatedAt||daily.updatedAt||'',custom};
  entries.push(entry);unit.entries.push(entry);
 }
 for(const [key,record] of Object.entries(snapshot.records||{})){const [tab,day,...parts]=key.split(':'),id=parts.join(':');if(!modes.includes(tab))continue;add(tab,day,id,record,testMap.get(id.split('@')[0]));}
 for(const [key,mission] of Object.entries(snapshot.missions||{})){const [tab,day]=key.split(':');if(!['drive','durability'].includes(tab)||!included(tab))continue;for(const test of mission.customTests||[]){const unit=ensure(tab,test);expect(unit,tab+':'+day+':'+test.id);add(tab,day,test.id,test,test,true)}}
 let allUnits=[...units.values()].filter(u=>u.expected.size||u.entries.length);
 if(filter.category)allUnits=allUnits.filter(u=>u.categoryId===filter.category);
 const selectedKeys=new Set(allUnits.map(u=>u.key)),selectedEntries=entries.filter(e=>selectedKeys.has(e.unitKey));
 for(const unit of allUnits){const days=new Map();for(const entry of unit.entries){const key=entry.day??'general';if(!days.has(key))days.set(key,[]);days.get(key).push(entry.score)}unit.avg=mean([...days.values()].map(mean));unit.answered=new Set(unit.entries.map(e=>e.key)).size;unit.total=unit.expected.size;unit.entries.sort((a,b)=>(a.day??0)-(b.day??0)||(a.quarter??0)-(b.quarter??0));}
 const settings=snapshot.missions?.['results:general']||{},weights=settings.weights||{};
 const rows=criteria.map(c=>{const group=allUnits.filter(u=>u.categoryId===c.id),rated=group.filter(u=>u.avg!==null),raw=Object.hasOwn(weights,c.id)?num(weights[c.id]):1;return {...c,units:group,avg:mean(rated.map(u=>u.avg)),rated: rated.length,tests:group.length,answered:group.reduce((s,u)=>s+u.answered,0),total:group.reduce((s,u)=>s+u.total,0),rawWeight:Number.isFinite(raw)&&raw>=0?raw:0}}).filter(r=>r.tests>0);
 const totalWeight=rows.reduce((s,r)=>s+r.rawWeight,0),maxWeight=Math.max(0,...rows.map(r=>r.rawWeight));
 for(const row of rows){row.weight=totalWeight?row.rawWeight/totalWeight:0;row.contribution=row.avg===null?null:row.avg*10*row.weight;row.visual=row.avg===null?null:maxWeight?row.avg*10*row.rawWeight/maxWeight:0;row.completion=row.total?row.answered/row.total:0;}
 const rated=rows.filter(r=>r.avg!==null&&r.weight>0),ratedWeight=rated.reduce((s,r)=>s+r.weight,0),final=ratedWeight?rated.reduce((s,r)=>s+r.contribution,0)/ratedWeight:null;
 const total=rows.reduce((s,r)=>s+r.total,0),answered=rows.reduce((s,r)=>s+r.answered,0),completion=total?answered/total:0;
 const histogram=Array(10).fill(0);for(const entry of selectedEntries)if(rows.find(r=>r.id===categoryId(entry.test))?.weight>0)histogram[Math.round(entry.score)-1]++;
 return {snapshot,filter,settings,rows,units:allUnits,entries:selectedEntries,total,answered,completion,final,histogram,pointBands:pointBands(selectedEntries,rows),provisional:completion<1,decision:decision(final)};
}
function pointBands(entries,rows){const result={strength:[],review:[],weakness:[]};for(const e of entries){if(!(rows.find(r=>r.id===categoryId(e.test))?.weight>0))continue;const band=window.BAMCO_REVIEW_CONTRACT.band(e.score);if(band)result[band].push(e);}result.strength.sort((a,b)=>b.score-a.score);result.review.sort((a,b)=>a.score-b.score);result.weakness.sort((a,b)=>a.score-b.score);return result;}
function decision(score){return score===null?'unrated':score>=85?'pass':score>=75?'conditional':score>=65?'revise':'reject'}
function trends(model,unitKey,route='all'){
 const unit=model.units.find(u=>u.key===unitKey);if(!unit)return {entries:[],days:[],first:null,last:null,delta:null};
 const entries=unit.entries.filter(e=>route==='all'||e.routeId===route),groups=new Map();
 for(const entry of entries){const day=entry.day??'general';if(!groups.has(day))groups.set(day,[]);groups.get(day).push(entry)}
 const days=[...groups].map(([day,items])=>({day:day==='general'?null:Number(day),avg:mean(items.map(e=>e.score)),count:items.length,min:Math.min(...items.map(e=>e.score)),max:Math.max(...items.map(e=>e.score))})).sort((a,b)=>(a.day??0)-(b.day??0));
 const first=days[0]?.avg??null,last=days.at(-1)?.avg??null;return {unit,entries,days,first,last,delta:days.length>1?last-first:null};
}
function validateWeights(rows){
 const weights={},issues=[],seen=new Set();
 for(const row of rows){const id=String(row.id||'').trim(),weight=num(row.weight);if(!criteria.some(c=>c.id===id)){issues.push('unknown');continue}if(seen.has(id))issues.push('duplicate');seen.add(id);if(!Number.isFinite(weight)||weight<0)issues.push('invalid');weights[id]=weight;}
 if(criteria.some(c=>!seen.has(c.id)))issues.push('missing');if(!Object.values(weights).some(w=>w>0))issues.push('zero');
 return {valid:issues.length===0,weights,issues:[...new Set(issues)]};
}
function parseWeightRows(data,aliases={}){
 const norm=value=>canonical(value).replace(/[\u200c\u200f]/g,' ').replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
 const names=new Map();for(const c of criteria)for(const label of [c.id,c.name,...(aliases[c.id]||[])])names.set(norm(label),c.id);
 const rows=[];
 for(const values of data){let found=false;for(let i=0;i<values.length;i++){const id=names.get(norm(values[i]));if(!id)continue;const candidates=values.slice(i+1).filter(x=>x!==null&&x!==undefined&&String(x).trim()!=='');const weight=candidates.find(x=>Number.isFinite(num(x)));rows.push({id,weight:weight??NaN});found=true;break}if(!found&&values.some(x=>/^C\d+$/i.test(String(x).trim())))rows.push({id:String(values.find(x=>/^C\d+$/i.test(String(x).trim()))),weight:NaN});}
 return validateWeights(rows);
}
window.BAMCO_REPORT={build,trends,criteria,categoryId,decision,routeKind,validateWeights,parseWeightRows,num,mean,valid};
})();
