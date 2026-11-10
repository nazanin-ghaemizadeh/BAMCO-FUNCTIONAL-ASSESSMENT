(()=>{'use strict';

const $=id=>document.getElementById(id);
const app=window.BAMCO_ASSESSMENT;
const bank=window.BAMCO_DATA||{tests:[]};
const scoreWords=['','بسیار ضعیف','ضعیف','نامطلوب','کمتر از انتظار','قابل قبول','متوسط','خوب','خیلی خوب','عالی','ممتاز'];
const scoreColors=[null,['#f9e6ea','#e7b0ba','#ac2441'],['#fae1e5','#eba2b0','#be304a'],['#fae8e1','#f5b49d','#c84c33'],['#fff0df','#f5c09a','#cf752a'],['#fff4df','#f5ce8f','#cb8a1d'],['#fff7dd','#e9d075','#b79817'],['#eff6df','#bdd889','#619825'],['#e4f4e8','#9fd5ad','#22834e'],['#def1eb','#93ceb6','#167d55'],['#dcefe8','#85c1aa','#0e7451']];
let lastStamp='';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=value=>Number(value||0).toLocaleString('fa-IR',{maximumFractionDigits:2});
const today=()=>{const now=new Date(),offset=now.getTimezoneOffset();return new Date(now.getTime()-offset*60000).toISOString().slice(0,10)};

function context(){
  const tab=document.body.dataset.view;
  if(!['drive','durability'].includes(tab))return null;
  const raw=document.querySelector('.day-picker-trigger strong')?.textContent?.match(/[0-9۰-۹]+/)?.[0]||'';
  const day=Number(raw.replace(/[۰-۹]/g,char=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(char))||0);
  return day?{tab,day,key:tab+':'+day}:null;
}

function normalize(meta={}){
  let passengers=[];
  if(Array.isArray(meta.passengers))passengers=meta.passengers;
  else if(meta.passengers)passengers=String(meta.passengers).split(/[،,]/);
  passengers=passengers.map(value=>String(value).trim()).filter(Boolean).slice(0,4);
  return {
    ...meta,
    date:meta.date||today(),
    startTime:meta.startTime||'',
    endTime:meta.endTime||'',
    startKm:meta.startKm??'',
    endKm:meta.endKm??'',
    distanceKm:meta.distanceKm??'',
    driver:meta.driver||'',
    passengers,
    temperature:meta.temperature??'',
    weather:meta.weather||'',
    refueled:Boolean(meta.refueled||meta.fuel||meta.fuelType||meta.station||meta.fuelStation||meta.liters||meta.fuelLiters),
    fuelType:meta.fuelType||meta.fuel||'',
    fuelStation:meta.fuelStation||meta.station||'',
    fuelLiters:meta.fuelLiters??meta.liters??'',
    fuelOdometer:meta.fuelOdometer??'',
    breakdown:Boolean(meta.breakdown||meta.breakdownCause||meta.correctiveAction||meta.breakdownTime),
    breakdownCause:meta.breakdownCause||'',
    correctiveAction:meta.correctiveAction||'',
    breakdownTime:meta.breakdownTime||'',
    otherNotes:meta.otherNotes||''
  };
}

function passengerField(index,value=''){
  const labels=['اول','دوم','سوم','چهارم'];
  return '<label class="bamco-passenger-field">نام و نام خانوادگی سرنشین '+labels[index]+'<input name="passenger'+(index+1)+'" autocomplete="name" value="'+esc(value)+'" placeholder="نام سرنشین"></label>';
}

function formMarkup(c,meta){
  const passengerCount=Math.max(1,meta.passengers.length);
  return '<div class="section-heading"><div><h2>گزارش پیمایش روز '+number(c.day)+'</h2><p>اطلاعات پیمایش، شرایط روز و رخدادهای خودرو را ثبت کنید.</p></div><span class="chip">فرم روزانه</span></div>'+
    '<form id="bamco-day-form" novalidate><div class="bamco-day-block"><h3>زمان و پیمایش</h3><div class="bamco-day-fields">'+
    '<label>تاریخ<input name="date" type="date" required value="'+esc(meta.date)+'"></label>'+
    '<label>ساعت شروع پیمایش<input name="startTime" type="time" required value="'+esc(meta.startTime)+'"></label>'+
    '<label>ساعت پایان پیمایش<input name="endTime" type="time" required value="'+esc(meta.endTime)+'"></label>'+
    '<label>کیلومتر شروع پیمایش<input name="startKm" type="number" min="0" step="0.1" required value="'+esc(meta.startKm)+'"></label>'+
    '<label>کیلومتر پایان پیمایش<input name="endKm" type="number" min="0" step="0.1" required value="'+esc(meta.endKm)+'"></label>'+
    '<label class="bamco-distance-field">کیلومتر طی‌شده<input name="distanceKm" type="number" readonly tabindex="-1" value="'+esc(meta.distanceKm)+'" placeholder="محاسبه خودکار"></label>'+
    '</div></div>'+
    '<div class="bamco-day-block"><div class="bamco-block-heading"><h3>افراد حاضر در خودرو</h3><div class="bamco-inline-actions"><button type="button" class="secondary" data-add-passenger="1">+ افزودن سرنشین</button><button type="button" class="secondary" data-remove-passenger="1">حذف آخرین سرنشین</button></div></div><div class="bamco-day-fields"><label>نام و نام خانوادگی راننده<input name="driver" required autocomplete="name" value="'+esc(meta.driver)+'"></label><div id="bamco-passenger-fields" class="bamco-passenger-grid">'+Array.from({length:passengerCount},(_,index)=>passengerField(index,meta.passengers[index])).join('')+'</div></div></div>'+
    '<div class="bamco-day-block"><h3>شرایط محیطی</h3><div class="bamco-day-fields"><label>دمای هوا (°C)<input name="temperature" type="number" step="0.1" required value="'+esc(meta.temperature)+'"></label><label>نوع آب‌وهوا<select name="weather" required><option value="">انتخاب کنید</option>'+['آفتابی','نیمه‌ابری','ابری','بارانی','برفی','مه‌آلود','باد شدید','گرد و غبار'].map(item=>'<option '+(meta.weather===item?'selected':'')+'>'+item+'</option>').join('')+'</select></label></div></div>'+
    '<div class="bamco-day-block"><label class="bamco-switch"><input name="refueled" type="checkbox" '+(meta.refueled?'checked':'')+'><span>در این روز باک خودرو پر شده است</span></label><div class="bamco-day-fields bamco-conditional" data-condition="refueled" '+(meta.refueled?'':'hidden')+'><label>نوع بنزین<select name="fuelType"><option value="">انتخاب کنید</option>'+['معمولی','سوپر','یورو ۴','یورو ۵','سایر'].map(item=>'<option '+(meta.fuelType===item?'selected':'')+'>'+item+'</option>').join('')+'</select></label><label>جایگاه سوخت<input name="fuelStation" value="'+esc(meta.fuelStation)+'" placeholder="نام یا محل جایگاه"></label><label>لیتر بنزین زده‌شده<input name="fuelLiters" type="number" min="0" step="0.01" value="'+esc(meta.fuelLiters)+'"></label><label>کیلومتر خودرو هنگام سوخت‌گیری<input name="fuelOdometer" type="number" min="0" step="0.1" value="'+esc(meta.fuelOdometer)+'"></label></div></div>'+
    '<div class="bamco-day-block"><label class="bamco-switch bamco-switch-alert"><input name="breakdown" type="checkbox" '+(meta.breakdown?'checked':'')+'><span>در این روز خرابی خودرو رخ داده است</span></label><div class="bamco-day-fields bamco-conditional" data-condition="breakdown" '+(meta.breakdown?'':'hidden')+'><label class="bamco-span-2">علت خرابی<textarea name="breakdownCause" rows="3" placeholder="شرح علت یا نشانه خرابی">'+esc(meta.breakdownCause)+'</textarea></label><label class="bamco-span-2">اقدام اصلاحی صورت‌گرفته<textarea name="correctiveAction" rows="3" placeholder="اقدام انجام‌شده یا تصمیم پیگیری">'+esc(meta.correctiveAction)+'</textarea></label><label>ساعت رخداد<input name="breakdownTime" type="time" value="'+esc(meta.breakdownTime)+'"></label></div></div>'+
    '<div class="bamco-day-block"><label class="bamco-full-label">سایر توضیحات<textarea name="otherNotes" rows="4" placeholder="هر توضیح دیگری که باید در گزارش این روز ثبت شود...">'+esc(meta.otherNotes)+'</textarea></label></div>'+
    '<div class="bamco-day-actions"><button type="submit" id="bamco-day-start" class="primary">ثبت اطلاعات و ورود به آزمون‌های روز</button></div><p id="bamco-live-state" role="status"></p></form>';
}

function setConditional(form,name,active){
  const section=form.querySelector('[data-condition="'+name+'"]');
  if(!section)return;
  section.hidden=!active;
  section.querySelectorAll('input,select,textarea').forEach(field=>field.required=active);
}

function updateDistance(form){
  const start=Number(form.elements.startKm.value),end=Number(form.elements.endKm.value),output=form.elements.distanceKm;
  if(form.elements.startKm.value!==''&&form.elements.endKm.value!==''&&Number.isFinite(start)&&Number.isFinite(end)&&end>=start){
    output.value=String(Math.round((end-start)*10)/10);
    output.setCustomValidity('');
  }else{
    output.value='';
    output.setCustomValidity(form.elements.endKm.value!==''&&end<start?'کیلومتر پایان نمی‌تواند کمتر از کیلومتر شروع باشد.':'');
  }
}

function paint(){
  const c=context();
  if(!c)return;
  const host=$('schedulePanel');
  if(!host)return;
  if($('bamco-day-workflow')&&lastStamp===c.key){renderFinal(c);return}
  lastStamp=c.key;
  document.querySelectorAll('#bamco-day-workflow,.bamco-day-final').forEach(node=>node.remove());
  const meta=normalize(app.mission(c.key));
  const section=document.createElement('section');
  section.id='bamco-day-workflow';
  section.className='bamco-day-workflow';
  section.innerHTML=formMarkup(c,meta);
  host.insertAdjacentElement('afterbegin',section);
  const form=$('bamco-day-form');
  setConditional(form,'refueled',meta.refueled);
  setConditional(form,'breakdown',meta.breakdown);
  updateDistance(form);
  const started=Boolean(meta.startedAt||meta.dailyInfoSavedAt);
  const questions=$('questionsPanel');
  if(questions)questions.classList.toggle('hidden',!started&&!app.isReadOnly());
  $('bamco-live-state').textContent=started?'اطلاعات این روز در پایگاه داده ثبت شده است. در صورت تغییر، فرم را دوباره ذخیره کنید.':'پس از ثبت این فرم، آزمون‌های این روز نمایش داده می‌شوند.';
  form.addEventListener('submit',event=>{event.preventDefault();begin(c,form)});
  form.elements.startKm.addEventListener('input',()=>updateDistance(form));
  form.elements.endKm.addEventListener('input',()=>updateDistance(form));
  if(app.isReadOnly())form.querySelectorAll('input,select,textarea,button').forEach(element=>element.disabled=true);
  updatePassengerButtons(form);
  renderFinal(c);
}

function updatePassengerButtons(form){
  const count=form.querySelectorAll('.bamco-passenger-field').length;
  const add=form.querySelector('[data-add-passenger]'),remove=form.querySelector('[data-remove-passenger]');
  if(add)add.disabled=app.isReadOnly()||count>=4;
  if(remove)remove.disabled=app.isReadOnly()||count<=1;
}

function addPassenger(){
  const form=$('bamco-day-form'),host=$('bamco-passenger-fields');
  if(!form||!host)return;
  const count=host.querySelectorAll('.bamco-passenger-field').length;
  if(count>=4)return;
  host.insertAdjacentHTML('beforeend',passengerField(count));
  updatePassengerButtons(form);
  host.lastElementChild?.querySelector('input')?.focus();
}

function removePassenger(){
  const form=$('bamco-day-form'),host=$('bamco-passenger-fields');
  if(!form||!host)return;
  const fields=host.querySelectorAll('.bamco-passenger-field');
  if(fields.length<=1)return;
  fields[fields.length-1].remove();
  updatePassengerButtons(form);
}

function begin(c,form){
  if(app.isReadOnly())return;
  updateDistance(form);
  if(!form.reportValidity())return;
  const startKm=Number(form.elements.startKm.value),endKm=Number(form.elements.endKm.value);
  if(endKm<startKm){form.elements.endKm.setCustomValidity('کیلومتر پایان نمی‌تواند کمتر از کیلومتر شروع باشد.');form.elements.endKm.reportValidity();return}
  form.elements.endKm.setCustomValidity('');
  const refueled=form.elements.refueled.checked,breakdown=form.elements.breakdown.checked;
  const passengers=[...form.querySelectorAll('[name^="passenger"]')].map(field=>field.value.trim()).filter(Boolean).slice(0,4);
  const previous=app.mission(c.key);
  const data={
    ...previous,
    date:form.elements.date.value,
    startTime:form.elements.startTime.value,
    endTime:form.elements.endTime.value,
    startKm,
    endKm,
    distanceKm:Number(form.elements.distanceKm.value),
    driver:form.elements.driver.value.trim(),
    passengers,
    temperature:Number(form.elements.temperature.value),
    weather:form.elements.weather.value,
    refueled,
    fuelType:refueled?form.elements.fuelType.value:'',
    fuelStation:refueled?form.elements.fuelStation.value.trim():'',
    fuelLiters:refueled?Number(form.elements.fuelLiters.value):'',
    fuelOdometer:refueled?Number(form.elements.fuelOdometer.value):'',
    breakdown,
    breakdownCause:breakdown?form.elements.breakdownCause.value.trim():'',
    correctiveAction:breakdown?form.elements.correctiveAction.value.trim():'',
    breakdownTime:breakdown?form.elements.breakdownTime.value:'',
    otherNotes:form.elements.otherNotes.value.trim(),
    startedAt:previous.startedAt||new Date().toISOString(),
    dailyInfoSavedAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  app.setMission(c.key,data);
  app.setDayMileage(c.tab,c.day,data.distanceKm);
  $('questionsPanel')?.classList.remove('hidden');
  $('bamco-live-state').textContent='گزارش پیمایش روز در پایگاه داده ذخیره شد. اکنون آزمون‌های این روز را پاسخ دهید.';
  $('questionsPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
  renderFinal(c);
}

function taxonomy(){
  const map=new Map();
  for(const test of bank.tests||[]){
    if(!map.has(test.cat))map.set(test.cat,new Set());
    if(test.sub)map.get(test.cat).add(test.sub);
  }
  return map;
}

function customTests(meta){return Array.isArray(meta.customTests)?meta.customTests:[]}

function summaryItems(meta){
  const items=[
    ['تاریخ',meta.date],['ساعت پیمایش',(meta.startTime||'—')+' تا '+(meta.endTime||'—')],
    ['کیلومتر شروع',meta.startKm],['کیلومتر پایان',meta.endKm],['مسافت طی‌شده',meta.distanceKm!==''?number(meta.distanceKm)+' کیلومتر':''],
    ['راننده',meta.driver],['سرنشینان',meta.passengers.length?meta.passengers.join('، '):'بدون سرنشین'],
    ['دمای هوا',meta.temperature!==''?number(meta.temperature)+' °C':''],['نوع آب‌وهوا',meta.weather]
  ];
  if(meta.refueled)items.push(['سوخت‌گیری',[meta.fuelType,meta.fuelStation,meta.fuelLiters!==''?number(meta.fuelLiters)+' لیتر':'',meta.fuelOdometer!==''?'در کیلومتر '+number(meta.fuelOdometer):''].filter(Boolean).join(' · ')]);
  if(meta.breakdown)items.push(['خرابی',[meta.breakdownCause,meta.correctiveAction,meta.breakdownTime?'ساعت '+meta.breakdownTime:''].filter(Boolean).join(' · ')]);
  if(meta.otherNotes)items.push(['سایر توضیحات',meta.otherNotes]);
  return items.filter(item=>item[1]!==''&&item[1]!==undefined&&item[1]!==null);
}

function customCard(test){
  const colors=scoreColors;
  let html='<article class="question bamco-custom-question" data-custom-card="'+esc(test.id)+'"><div class="question-head"><div><div class="test-hierarchy"><span>شاخص: '+esc(test.cat)+'</span><span>زیرشاخص: '+esc(test.sub)+'</span><span>آزمون تکمیلی روزانه</span></div><h3>'+esc(test.name)+'</h3></div><button type="button" class="bamco-custom-delete" data-custom-delete="'+esc(test.id)+'">حذف</button></div>';
  html+='<dl class="test-conditions"><div><dt>شرایط آزمون</dt><dd>'+esc(test.profile)+'</dd></div></dl><div class="scores" role="group" aria-label="نمره آزمون از ۱ تا ۱۰">';
  for(let i=1;i<=10;i++){
    const color=colors[i];
    html+='<button type="button" class="score '+(Number(test.score)===i?'selected':'')+'" data-custom-score="'+i+'" data-custom-id="'+esc(test.id)+'" title="'+esc(scoreWords[i])+'" style="--score-bg:'+color[0]+';--score-border:'+color[1]+';--score-text:'+color[2]+'"><strong>'+number(i)+'</strong><small>'+esc(scoreWords[i])+'</small></button>';
  }
  html+='</div><details class="assessment-attachment" '+(test.note||test.photo?'open':'')+'><summary><span class="attachment-plus" aria-hidden="true">+</span>افزودن یادداشت یا تصویر</summary><div class="note-wrap"><div class="note-actions"><label class="label-block" for="custom-note-'+esc(test.id)+'">یادداشت ارزیاب</label><span class="tiny">مشاهده، ایراد یا نکته قابل پیگیری را ثبت کنید.</span></div><textarea id="custom-note-'+esc(test.id)+'" data-custom-note="'+esc(test.id)+'" placeholder="کامنت آزمون تکمیلی...">'+esc(test.note||'')+'</textarea><div class="note-actions"><label class="photo-picker"><input class="photo-input" type="file" accept="image/*" data-custom-photo="'+esc(test.id)+'" aria-label="انتخاب تصویر آزمون"><span class="photo-picker-button">انتخاب تصویر</span><span class="photo-file-name">'+(test.photo?'تصویر ثبت شده است':'تصویری انتخاب نشده است')+'</span></label>'+(test.photo?'<img src="'+test.photo+'" alt="تصویر آزمون تکمیلی">':'')+'</div></div></details></article>';
  return html;
}

function renderFinal(c){
  document.querySelectorAll('.bamco-day-final').forEach(node=>node.remove());
  const progress=app.dayProgress?.();
  const meta=normalize(app.mission(c.key));
  if(!(meta.startedAt||meta.dailyInfoSavedAt)||!progress?.complete)return;
  const map=taxonomy(),categories=[...map.keys()].sort((a,b)=>a.localeCompare(b,'fa'));
  const tests=customTests(meta);
  const panel=document.createElement('section');
  panel.className='surface panel bamco-day-final';
  panel.innerHTML='<div class="bamco-final-heading"><div><span class="bamco-final-check">✓</span><div><h2>فرم نهایی روز '+number(c.day)+'</h2><p>تمام '+number(progress.total)+' آزمون برنامه این روز پاسخ داده شده‌اند. گزارش را مرور کنید.</p></div></div><span class="chip">تکمیل آزمون‌ها</span></div>'+
    '<div class="bamco-summary-grid">'+summaryItems(meta).map(([label,value])=>'<div class="bamco-summary-item"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>'+
    '<div class="bamco-extra-intro"><h3>آیا مورد دیگری علاوه بر موارد فوق می‌خواهید اضافه کنید؟</h3><p>در صورت نیاز یک آزمون تکمیلی بسازید؛ قالب نمره، کامنت و تصویر دقیقاً مشابه سایر آزمون‌هاست.</p></div>'+
    '<form id="bamco-custom-builder" class="bamco-custom-builder"><label>موضوع مربوط به چه شاخصی است؟<select name="category" required><option value="">انتخاب شاخص</option>'+categories.map(cat=>'<option value="'+esc(cat)+'">'+esc(cat)+'</option>').join('')+'</select></label><label>زیرشاخص<select name="subcategory" required disabled><option value="">ابتدا شاخص را انتخاب کنید</option></select></label><label class="bamco-span-2">عنوان آزمون<input name="name" required placeholder="عنوان آزمون تکمیلی را وارد کنید"></label><label class="bamco-span-2">شرایط آزمون<textarea name="profile" required rows="3" placeholder="شرایط و روش اجرای آزمون را بنویسید"></textarea></label><div class="bamco-builder-action"><button type="submit" class="primary">+ افزودن آزمون تکمیلی</button></div></form>'+
    '<div class="bamco-custom-list">'+(tests.length?tests.map(customCard).join(''):'<div class="empty bamco-no-custom">آزمون تکمیلی دیگری برای این روز ثبت نشده است.</div>')+'</div>';
  const questions=$('questionsPanel');
  if(questions)questions.insertAdjacentElement('afterend',panel);
  const builder=$('bamco-custom-builder');
  builder?.elements.category.addEventListener('change',()=>fillSubcategories(builder,map));
  builder?.addEventListener('submit',event=>{event.preventDefault();addCustom(c,builder)});
  if(app.isReadOnly())panel.querySelectorAll('input,select,textarea,button').forEach(element=>element.disabled=true);
}

function fillSubcategories(form,map){
  const select=form.elements.subcategory,values=[...(map.get(form.elements.category.value)||[])].sort((a,b)=>a.localeCompare(b,'fa'));
  select.innerHTML='<option value="">انتخاب زیرشاخص</option>'+values.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join('');
  select.disabled=!values.length||app.isReadOnly();
}

function addCustom(c,form){
  if(app.isReadOnly()||!form.reportValidity())return;
  const meta=app.mission(c.key),tests=customTests(meta).slice();
  tests.push({
    id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),
    cat:form.elements.category.value,
    sub:form.elements.subcategory.value,
    name:form.elements.name.value.trim(),
    profile:form.elements.profile.value.trim(),
    score:null,note:'',photo:'',createdAt:new Date().toISOString()
  });
  app.setMission(c.key,{...meta,customTests:tests,updatedAt:new Date().toISOString()});
  renderFinal(c);
  document.querySelector('.bamco-custom-list .question:last-child')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function updateCustom(c,id,patch){
  const meta=app.mission(c.key),tests=customTests(meta).map(test=>test.id===id?{...test,...patch,updatedAt:new Date().toISOString()}:test);
  app.setMission(c.key,{...meta,customTests:tests,updatedAt:new Date().toISOString()});
}

function uploadPicture(c,id,file){
  if(!file||!file.type.startsWith('image/'))return;
  const reader=new FileReader();
  reader.onload=()=>{const image=new Image();image.onload=()=>{if(context()?.key!==c.key)return;const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);updateCustom(c,id,{photo:canvas.toDataURL('image/jpeg',.55)});renderFinal(c)};image.src=reader.result};
  reader.readAsDataURL(file);
}

document.addEventListener('bamco:assessment-close',()=>{lastStamp='';document.querySelectorAll('.bamco-day-final').forEach(node=>node.remove())});
document.addEventListener('bamco:day-render',()=>{lastStamp='';paint()});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.addPassenger){addPassenger();return}
  if(button.dataset.removePassenger){removePassenger();return}
  if(button.dataset.customScore){
    if(app.isReadOnly())return;
    const c=context();if(!c)return;
    const meta=app.mission(c.key),test=customTests(meta).find(item=>item.id===button.dataset.customId);if(!test)return;
    const score=Number(button.dataset.customScore),next=Number(test.score)===score?null:score;
    updateCustom(c,test.id,{score:next});renderFinal(c);return;
  }
  if(button.dataset.customDelete){
    if(app.isReadOnly()||!confirm('این آزمون تکمیلی حذف شود؟'))return;
    const c=context();if(!c)return;
    const meta=app.mission(c.key),tests=customTests(meta).filter(test=>test.id!==button.dataset.customDelete);
    app.setMission(c.key,{...meta,customTests:tests,updatedAt:new Date().toISOString()});renderFinal(c);return;
  }
  if(button.dataset.day||button.dataset.tab){lastStamp='';setTimeout(paint,0)}
});

document.addEventListener('change',event=>{
  const field=event.target;
  if(field.matches('#bamco-day-form [name="refueled"],#bamco-day-form [name="breakdown"]'))setConditional($('bamco-day-form'),field.name,field.checked);
  if(field.dataset.customNote&&!app.isReadOnly()){
    const c=context();if(c)updateCustom(c,field.dataset.customNote,{note:field.value.trim()});
  }
  if(field.dataset.customPhoto&&!app.isReadOnly()){
    const c=context();if(c)uploadPicture(c,field.dataset.customPhoto,field.files?.[0]);
  }
});

const observer=new MutationObserver(()=>{
  const c=context();
  if(!c){lastStamp='';document.querySelectorAll('.bamco-day-final').forEach(node=>node.remove());return}
  if(!$('bamco-day-workflow')){lastStamp='';paint()}
});
observer.observe($('schedulePanel'),{childList:true});
paint();
})();
