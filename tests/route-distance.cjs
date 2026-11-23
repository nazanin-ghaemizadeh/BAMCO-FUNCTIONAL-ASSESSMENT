const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const tools=require('../route-bank-tools.js');
(async()=>{
 const originalFetch=global.fetch;let calls=[];
 try{
  global.fetch=async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('route-cities')?JSON.parse(fs.readFileSync('assets/route-cities.json','utf8')):{code:'Ok',routes:[{distance:327434.7}]}}};
  assert.equal(await tools.roadDistance(' تهران ','رشت'),327.435);
  assert.equal(await tools.roadDistance('تهران','رشت'),327.435);assert.equal(calls.filter(u=>u.includes('/route/v1')).length,1);
  await assert.rejects(tools.roadDistance('تهران','تهران'),/sameCity/);
  await assert.rejects(tools.roadDistance('تهران','Unknown'),/unknownCity/);
  const controller=new AbortController();controller.abort();await assert.rejects(tools.roadDistance('تهران','قم',{signal:controller.signal}),/aborted/);
  global.fetch=async()=>({ok:true,json:async()=>({code:'NoRoute'})});await assert.rejects(tools.roadDistance('تهران','قم'),/distanceUnavailable/);
  global.fetch=async()=>({ok:true,json:async()=>({code:'Ok',routes:[{distance:0}]})});await assert.rejects(tools.roadDistance('تهران','قم'),/distanceUnavailable/);

  // A city outside the shipped list is resolved online, shared with the map, and cached.
  let geocodes=0;
  global.fetch=async url=>({ok:true,json:async()=>{
   if(String(url).includes('photon.komoot.io')){geocodes++;return {features:[{properties:{countrycode:'IR',name:'سمنان',osm_value:'city'},geometry:{coordinates:[53.395,35.577]}}]}}
   return {code:'Ok',routes:[{distance:222277.7}]};
  }});
  assert.equal(await tools.roadDistance('تهران','سمنان'),222.278);
  assert.deepEqual(tools.knownPoint('سمنان'),[53.395,35.577]);
  const newRow={id:'new',definition:{origin:'تهران',destination:'سمنان',originPoint:[51.389,35.6892],destinationPoint:tools.knownPoint('سمنان')}};
  assert.deepEqual(tools.locate([newRow],{})[0].missing,[],'saved coordinates work on a fresh map without static city entries');
  const resolved=await tools.resolveMapCoordinates([{definition:{origin:'تهران',destination:'سمنان'}}],{});
  assert.deepEqual(tools.locate([{definition:{origin:'تهران',destination:'سمنان'}}],resolved)[0].missing,[]);
  await tools.roadDistance('تهران','سمنان');assert.equal(geocodes,1,'shared city cache prevents repeated geocoding');
  global.fetch=async()=>({ok:true,json:async()=>({features:[{properties:{countrycode:'IR',name:'Province',osm_value:'state'},geometry:{coordinates:[53,35]}}]})});
  await assert.rejects(tools.resolveCity('Province'),/unknownCity/,'a province is not used as a city');
  global.fetch=async()=>({ok:true,json:async()=>({features:[1,2].map(i=>({properties:{countrycode:'IR',name:'Ambiguous',osm_value:'town'},geometry:{coordinates:[53+i,35]}}))})});
  await assert.rejects(tools.resolveCity('Ambiguous'),/ambiguousCity/);
 }finally{global.fetch=originalFetch}
 const w=new JSDOM('<div id="host"></div>',{url:'https://example.test',runScripts:'outside-only'}).window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 let saved;const requests=[],row={id:'r1',revision:1,updated_at:'2026-11-22',definition:{name:'Existing',origin:'تهران',destination:'رشت',routeId:'rural',km:350,active:true,bidirectional:true}};
 w.BAMCO_PORTAL={user:{admin:true},can:()=>true,rpc:async(name,{operation,args})=>{if(operation==='save')saved=args;return {data:operation==='list'?[row]:{id:'saved'}}}};
 w.BAMCO_ROUTE_BANK_TOOLS={knownPoint:name=>name==='تهران'?[51.389,35.6892]:name==='اصفهان'?[51.666,32.6539]:null,roadDistance:(origin,destination,{signal})=>new Promise((resolve,reject)=>requests.push({origin,destination,signal,resolve,reject}))};
 w.eval(fs.readFileSync('catalog-banks.js','utf8'));w.BAMCO_BANKS.mount(d.getElementById('host'),{kind:'routes',language:'fa',home(){}});
 const tick=()=>new Promise(r=>setTimeout(r,0)),click=text=>[...d.querySelectorAll('button')].find(b=>b.textContent===text).click();await tick();
 click('ویرایش');assert.equal(d.querySelector('[name=km]').value,'۳۵۰');assert.equal(requests.length,0,'opening an editor preserves an existing manual distance');click('انصراف');
 click('تعریف مسیر جدید');let form=d.querySelector('dialog form');
 const input=(name,text,commit=true)=>{const c=form.elements[name];c.value=text;c.dispatchEvent(new w.Event('input'));if(commit)c.dispatchEvent(new w.Event('change'))};
 input('name','تهران — رشت');input('origin','تهران');input('destination','رشت',false);await new Promise(r=>setTimeout(r,750));assert.equal(requests.length,1,'typing complete city names starts calculation without leaving the field');assert(d.querySelector('button[type=submit]').disabled);
 requests[0].resolve(327.435);await tick();assert.equal(form.elements.km.value,'۳۲۷٫۴۳۵');assert(!d.querySelector('button[type=submit]').disabled);
 input('destination','قم');await tick();assert.equal(form.elements.km.value,'');input('destination','اصفهان');await tick();assert(requests[1].signal.aborted);
 requests[2].resolve(450);await tick();requests[1].resolve(150);await tick();assert.equal(form.elements.km.value,'۴۵۰','late response cannot overwrite the newer route');
 click('محاسبه مسافت');await tick();input('km','480',false);assert.equal(form.elements.km.value,'۴۸۰');requests[3].resolve(450);await tick();assert.equal(form.elements.km.value,'۴۸۰','manual input wins over an in-flight response');
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.deepEqual(Array.from(saved.definition.originPoint),[51.389,35.6892]);assert.deepEqual(Array.from(saved.definition.destinationPoint),[51.666,32.6539]);assert.equal(saved.definition.km,480);assert.equal(saved.definition.destination,'اصفهان');assert(!d.querySelector('dialog'));
 click('تعریف مسیر جدید');form=d.querySelector('dialog form');input('origin','تهران');input('destination','رشت');await tick();click('انصراف');assert(requests[4].signal.aborted);requests[4].resolve(327);await tick();assert(!d.querySelector('dialog'));
 click('تعریف مسیر جدید');form=d.querySelector('dialog form');input('origin','تهران');input('destination','تهران');await tick();requests[5].reject(Error('sameCity'));await tick();assert.match(d.querySelector('.bank-distance-status').textContent,/دستی/);assert.equal(form.elements.km.value,'');assert(!d.querySelector('button[type=submit]').disabled);
 input('destination','رشت');await tick();requests[6].reject(Error('offline'));await tick();assert.match(d.querySelector('.bank-distance-status').textContent,/ممکن نشد/);input('km','۳۰۰');assert(!d.querySelector('button[type=submit]').disabled);
 w.close();console.log('PASS automatic road km: road metres conversion, cache, unknown/same-city/offline cases, stale responses, manual override, save and dialog cancellation');
})().catch(e=>{console.error(e);process.exitCode=1});
