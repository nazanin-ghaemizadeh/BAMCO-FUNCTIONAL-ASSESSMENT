(()=>{'use strict';

const $=id=>document.getElementById(id);
const app=window.BAMCO_ASSESSMENT;
const bank=window.BAMCO_DATA||{tests:[]};
const scoreWords=['','غیرقابل قبول','بحرانی','بسیار ضعیف','ضعیف','حداقل پذیرش','مرزی','قابل قبول','رضایت‌بخش','بسیار عالی','ممتاز'];
const scoreColors=[null,['#f9e6ea','#e7b0ba','#ac2441'],['#fae1e5','#eba2b0','#be304a'],['#fae8e1','#f5b49d','#c84c33'],['#fff0df','#f5c09a','#cf752a'],['#fff4df','#f5ce8f','#cb8a1d'],['#fff7dd','#e9d075','#b79817'],['#eff6df','#bdd889','#619825'],['#e4f4e8','#9fd5ad','#22834e'],['#def1eb','#93ceb6','#167d55'],['#dcefe8','#85c1aa','#0e7451']];
let lastStamp='';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=value=>Number(value||0).toLocaleString(window.BAMCO_I18N?.language==='fa'||!window.BAMCO_I18N?'fa-IR':'en-US',{maximumFractionDigits:2});
const faDigits='۰۱۲۳۴۵۶۷۸۹';
const toFaDigits=value=>window.BAMCO_I18N?.formatDigits(value)??String(value??'').replace(/\d/g,digit=>faDigits[Number(digit)]);
const toLatinDigits=value=>String(value??'').replace(/[۰-۹]/g,digit=>String(faDigits.indexOf(digit)));
const persianTime=value=>toFaDigits(String(value??'').trim().replace(/[٫.]/g,':'));
// Keep the stored HH:mm contract; use explicit controls on mobile instead of a numeric keyboard.
function openTimePicker(field){
  if(app.isReadOnly()||field.disabled)return;
  const old=document.getElementById('bamco-time-picker');if(old)old.remove();
  const match=toLatinDigits(field.value).match(/^(\d{1,2}):([0-5]\d)$/);
  const hours=match?Number(match[1]):null;
  const dialog=document.createElement('dialog');dialog.id='bamco-time-picker';dialog.dir='rtl';
  dialog.style.cssText='border:0;border-radius:18px;padding:24px;width:min(360px,90vw);box-sizing:border-box;color:#153a60;box-shadow:0 16px 70px #153a6055';
  const options=(count,start)=>Array.from({length:count},(_,i)=>{const n=i+start;return '<option value="'+n+'">'+toFaDigits(String(n).padStart(2,'0'))+'</option>'}).join('');
  dialog.innerHTML='<form method="dialog"><h3 id="bamco-time-title" style="margin-top:0">انتخاب ساعت</h3><div style="display:flex;gap:12px;flex-wrap:wrap"><label style="flex:1">ساعت<select name="hour" required style="width:100%;min-height:44px"><option value="">—</option>'+options(12,1)+'</select></label><label style="flex:1">دقیقه<select name="minute" required style="width:100%;min-height:44px"><option value="">—</option>'+options(60,0)+'</select></label><label style="width:100%">بازه زمانی<select name="period" required style="width:100%;min-height:44px"><option value="am">قبل‌ازظهر</option><option value="pm">بعدازظهر</option></select></label></div><div style="display:flex;gap:12px;margin-top:20px"><button class="primary" type="submit">تأیید ساعت</button><button class="secondary" type="button" data-time-cancel>انصراف</button></div></form>';
  dialog.setAttribute('aria-labelledby','bamco-time-title');
  const picker=dialog.querySelector('form');
  picker.elements.hour.value=hours===null?'':String(hours%12||12);
  picker.elements.minute.value=match?String(Number(match[2])):'';
  picker.elements.period.value=hours!==null&&hours>=12?'pm':'am';
  const close=()=>{dialog.close();dialog.remove();field.focus()};
  picker.addEventListener('submit',event=>{
    event.preventDefault();if(!picker.reportValidity())return;
    const hour=Number(picker.elements.hour.value)%12+(picker.elements.period.value==='pm'?12:0);
    field.value=toFaDigits(String(hour).padStart(2,'0')+':'+String(picker.elements.minute.value).padStart(2,'0'));
    field.setCustomValidity('');field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));close();
  });
  dialog.querySelector('[data-time-cancel]').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  document.body.append(dialog);dialog.showModal();
  window.BAMCO_DROPDOWNS?.(dialog);
}
function wireTimePickers(form){
  for(const name of ['startTime','endTime','breakdownTime']){
    const field=form.elements[name];field.readOnly=true;field.removeAttribute('inputmode');
    field.placeholder='انتخاب ساعت';field.setAttribute('aria-haspopup','dialog');
    field.style.cursor='pointer';
    field.addEventListener('click',()=>openTimePicker(field));
    field.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();openTimePicker(field)}});
  }
}
function persianDate(value){
  const raw=String(value??'').trim();
  if(raw&&/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(toLatinDigits(raw))&&!raw.includes('-'))return toFaDigits(toLatinDigits(raw));
  let date=new Date();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))date=new Date(raw+'T12:00:00');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return parts.year+'/'+parts.month+'/'+parts.day;
}
function validPersianDate(value){
  const match=toLatinDigits(value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  return Boolean(match&&Number(match[2])>=1&&Number(match[2])<=12&&Number(match[3])>=1&&Number(match[3])<=31);
}
function validTime(value){return /^([01]?\d|2[0-3]):[0-5]\d$/.test(toLatinDigits(value))}
function applyScriptFont(field){
  if(!field?.matches?.('input:not([type="file"]),textarea'))return;
  const value=field.value||'';
  field.classList.toggle('bamco-font-fa',/[\u0600-\u06ff]/.test(value));
  field.classList.toggle('bamco-font-en',!/[\u0600-\u06ff]/.test(value)&&/[A-Za-z]/.test(value));
}
function wireScriptFonts(root){root.querySelectorAll('input:not([type="file"]),textarea').forEach(applyScriptFont)}

function context(){
 const c=app.dayContext?.();
 return c&&['form','scores'].includes(c.section)?c:null;
}

function normalize(meta={}){
  let passengers=[];
  if(Array.isArray(meta.passengers))passengers=meta.passengers;
  else if(meta.passengers)passengers=String(meta.passengers).split(/[،,]/);
  passengers=passengers.map(value=>String(value).trim()).filter(Boolean).slice(0,4);
  return {
    ...meta,
    date:persianDate(meta.date),
    startTime:persianTime(meta.startTime),
    endTime:persianTime(meta.endTime),
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
    breakdownTime:persianTime(meta.breakdownTime),
    otherNotes:meta.otherNotes||''
  };
}

function passengerField(index,value=''){
  const labels=['اول','دوم','سوم','چهارم'];
  return '<label class="bamco-passenger-field">نام و نام خانوادگی سرنشین '+labels[index]+'<input name="passenger'+(index+1)+'" autocomplete="name" value="'+esc(value)+'" placeholder="نام سرنشین"></label>';
}

function temperatureOptions(value){
 const values=Array.from({length:111},(_,i)=>i-50);
 if(value!==''&&Number.isFinite(Number(value))&&!values.includes(Number(value)))values.push(Number(value));
 return values.sort((a,b)=>a-b).map(n=>'<option value="'+n+'" '+(value!==''&&Number(value)===n?'selected':'')+'>'+number(n)+' درجه سانتی‌گراد</option>').join('');
}

function checklistMarkup(check = {}) {
  const groups = window.BAMCO_PRE_DRIVE.map(group => {
    const items = group.items.map(({key,title}) =>
      '<label class="pre-drive-item"><input type="checkbox" data-inspection="'+key+'" '+(check.reviewed?.[key]===true?'checked':'')+'>'+
      '<svg class="pre-drive-mark" aria-hidden="true" focusable="false" viewBox="0 0 32 32"><path class="mark-badge" d="M16 2.5c2.5 0 3.7 1.5 5.6 1.9 3 .6 4.7 1.1 5.4 4.2.6 2.5 3 4.2 2.5 7.4.5 3.2-1.9 4.9-2.5 7.4-.7 3.1-2.4 3.6-5.4 4.2-1.9.4-3.1 1.9-5.6 1.9s-3.7-1.5-5.6-1.9c-3-.6-4.7-1.1-5.4-4.2-.6-2.5-3-4.2-2.5-7.4C2 12.8 4.4 11.1 5 8.6c.7-3.1 2.4-3.6 5.4-4.2 1.9-.4 3.1-1.9 5.6-1.9Z"/><path class="mark-highlight" d="M7.8 11.2c.5-1.6 1.5-2.7 3.2-3"/><path class="mark-cross" d="m12.5 12.5 7 7m0-7-7 7"/><path class="mark-check" d="m9.8 16.2 4.1 4.2 8.4-9"/><g class="mark-blush"><ellipse cx="8.8" cy="20" rx="1.7" ry="1.1"/><ellipse cx="23.2" cy="20" rx="1.7" ry="1.1"/></g></svg><span>'+esc(title)+'</span></label>').join('');
    const headingId='pre-drive-'+group.id;
    return '<section class="pre-drive-group" aria-labelledby="'+headingId+'">'+
      '<div class="pre-drive-category"><svg aria-hidden="true" focusable="false" viewBox="0 0 48 48"><use href="./checklist-icons.svg#'+group.id+'"></use></svg>'+
      '<h4 id="'+headingId+'">'+esc(group.title)+'</h4></div>'+
      '<div class="pre-drive-items">'+items+'</div><label class="bamco-full-label pre-drive-comment">توضیحات این دسته (اختیاری)'+
      '<textarea rows="2" data-inspection-comment="'+group.id+'">'+esc(check.comments?.[group.id])+'</textarea></label></section>';
  }).join('');
  return '<section class="bamco-day-block pre-drive" aria-labelledby="preDriveTitle"><h3 id="preDriveTitle">چک‌لیست پیش از پیمایش</h3>'+
    '<div class="pre-drive-grid">'+groups+'</div></section>';
}

function formData(form) {
  const fields = form.elements;
  const numeric = name => fields[name].value === '' ? '' : Number(fields[name].value);
  const text = name => fields[name].value.trim();
  const breakdown = fields.breakdown.checked;
  const fuelType=text('fuelType'), fuelStation=text('fuelStation'), fuelLiters=numeric('fuelLiters'), fuelOdometer=numeric('fuelOdometer');
  const reviewed = {}, comments = {};
  for (const item of form.querySelectorAll('[data-inspection]:checked')) reviewed[item.dataset.inspection] = true;
  for (const field of form.querySelectorAll('[data-inspection-comment]')) {
    if (field.value.trim()) comments[field.dataset.inspectionComment] = field.value.trim();
  }
  updateDistance(form);
  return {
    date:toFaDigits(text('date')), startTime:persianTime(text('startTime')), endTime:persianTime(text('endTime')),
    startKm:numeric('startKm'), endKm:numeric('endKm'), distanceKm:numeric('distanceKm'),
    driver:text('driver'), passengers:[...form.querySelectorAll('[name^="passenger"]')].map(field=>field.value.trim()).filter(Boolean),
    temperature:numeric('temperature'), weather:text('weather'),
    refueled:Boolean(fuelType || fuelStation || fuelLiters!=='' || fuelOdometer!==''), fuelType, fuelStation, fuelLiters, fuelOdometer,
    breakdown, breakdownCause:breakdown?text('breakdownCause'):'', correctiveAction:breakdown?text('correctiveAction'):'',
    breakdownTime:breakdown?persianTime(text('breakdownTime')):'', otherNotes:text('otherNotes'),
    preDrive:{reviewed, comments}
  };
}

function syncFormActions() {
  const active = context()?.section === 'form';
  $('dayFormActions').hidden = !active || app.isReadOnly();
  $('dayFormExcel').hidden = !active;
  if (!active) $('bamco-live-state').textContent = '';
}

function formMarkup(c,meta){
  const passengerCount=Math.max(1,meta.passengers.length);
  return '<div class="section-heading"><div><h2>گزارش پیمایش روز '+number(c.day)+'</h2><p>اطلاعات پیمایش، شرایط روز و رخدادهای خودرو را ثبت کنید.</p></div><span class="chip">فرم روزانه</span></div>'+
    '<form id="bamco-day-form" novalidate><div class="bamco-day-block"><h3>زمان و پیمایش</h3><div class="bamco-day-fields">'+
    '<label>تاریخ شمسی<input name="date" type="text" inputmode="numeric" dir="ltr" required value="'+esc(meta.date)+'" placeholder="۱۴۰۵/۰۸/۱۹" aria-label="تاریخ شمسی"></label>'+
    '<label>ساعت شروع پیمایش<input name="startTime" type="text" inputmode="numeric" dir="ltr" required value="'+esc(meta.startTime)+'" placeholder="۰۸:۳۰"></label>'+
    '<label>ساعت پایان پیمایش<input name="endTime" type="text" inputmode="numeric" dir="ltr" required value="'+esc(meta.endTime)+'" placeholder="۱۷:۳۰"></label>'+
    '<label>کیلومتر شروع پیمایش<input name="startKm" type="number" min="0" step="0.1" required value="'+esc(meta.startKm)+'"></label>'+
    '<label>کیلومتر پایان پیمایش<input name="endKm" type="number" min="0" step="0.1" required value="'+esc(meta.endKm)+'"></label>'+
    '<label class="bamco-distance-field">کیلومتر طی‌شده<input name="distanceKm" type="number" readonly tabindex="-1" value="'+esc(meta.distanceKm)+'" placeholder="محاسبه خودکار"></label>'+
    '</div></div>'+
    '<div class="bamco-day-block"><div class="bamco-block-heading"><h3>افراد حاضر در خودرو</h3><div class="bamco-inline-actions"><button type="button" class="secondary" data-add-passenger="1">+ افزودن سرنشین</button><button type="button" class="secondary" data-remove-passenger="1">حذف آخرین سرنشین</button></div></div><div class="bamco-day-fields"><label>نام و نام خانوادگی راننده<input name="driver" required autocomplete="name" value="'+esc(meta.driver)+'"></label><div id="bamco-passenger-fields" class="bamco-passenger-grid">'+Array.from({length:passengerCount},(_,index)=>passengerField(index,meta.passengers[index])).join('')+'</div></div></div>'+
    '<div class="bamco-day-block"><h3>شرایط محیطی</h3><div class="bamco-day-fields"><label>دمای هوا (درجه سانتی‌گراد)<select name="temperature" required><option value="">انتخاب دما</option>'+temperatureOptions(meta.temperature)+'</select></label><label>نوع آب‌وهوا<select name="weather" required><option value="">انتخاب کنید</option>'+['آفتابی','نیمه‌ابری','ابری','بارانی','برفی','مه‌آلود','باد شدید','گرد و غبار'].map(item=>'<option '+(meta.weather===item?'selected':'')+'>'+item+'</option>').join('')+'</select></label></div></div>'+
    '<details class="bamco-day-block bamco-optional-section"><summary>سوخت‌گیری</summary><div class="bamco-day-fields"><label>نوع بنزین<select name="fuelType"><option value="">انتخاب کنید</option>'+['معمولی','سوپر','یورو ۴','یورو ۵','سایر'].map(item=>'<option '+(meta.fuelType===item?'selected':'')+'>'+item+'</option>').join('')+'</select></label><label>جایگاه سوخت<input name="fuelStation" value="'+esc(meta.fuelStation)+'" placeholder="نام یا محل جایگاه"></label><label>لیتر بنزین زده‌شده<input name="fuelLiters" type="number" min="0" step="0.01" value="'+esc(meta.fuelLiters)+'"></label><label>کیلومتر خودرو هنگام سوخت‌گیری<input name="fuelOdometer" type="number" min="0" step="0.1" value="'+esc(meta.fuelOdometer)+'"></label></div></details>'+
    '<details class="bamco-day-block bamco-optional-section"><summary>خرابی خودرو</summary><label class="bamco-switch bamco-switch-alert"><input name="breakdown" type="checkbox" '+(meta.breakdown?'checked':'')+'><span>در این روز خرابی خودرو رخ داده است</span></label><div class="bamco-day-fields bamco-conditional" data-condition="breakdown" '+(meta.breakdown?'':'hidden')+'><label class="bamco-span-2">علت خرابی<textarea name="breakdownCause" rows="3" placeholder="شرح علت یا نشانه خرابی">'+esc(meta.breakdownCause)+'</textarea></label><label class="bamco-span-2">اقدام اصلاحی صورت‌گرفته<textarea name="correctiveAction" rows="3" placeholder="اقدام انجام‌شده یا تصمیم پیگیری">'+esc(meta.correctiveAction)+'</textarea></label><label>ساعت رخداد<input name="breakdownTime" type="text" inputmode="numeric" dir="ltr" value="'+esc(meta.breakdownTime)+'" placeholder="۱۴:۳۰"></label></div></details>'+
    '<div class="bamco-day-block"><label class="bamco-full-label">سایر توضیحات<textarea name="otherNotes" rows="4" placeholder="هر توضیح دیگری که باید در گزارش این روز ثبت شود...">'+esc(meta.otherNotes)+'</textarea></label></div>'+
    checklistMarkup(meta.preDrive)+'</form>';
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
  if(c.section==='scores'){renderFinal(c);return}
  const host=$('schedulePanel');
  if(!host)return;
  if($('bamco-day-workflow')&&lastStamp===c.key)return;
  lastStamp=c.key;
  document.querySelectorAll('#bamco-day-workflow,.bamco-day-final,.bamco-day-extra').forEach(node=>node.remove());
  const saved=app.mission(c.key);
  const meta=normalize({...saved,...saved.dailyFormDraft});
  const section=document.createElement('section');
  section.id='bamco-day-workflow';
  section.className='bamco-day-workflow';
  section.innerHTML=formMarkup(c,meta);
  host.insertAdjacentElement('afterbegin',section);
  const form=$('bamco-day-form');
  setConditional(form,'breakdown',meta.breakdown);
  updateDistance(form);
  $('bamco-live-state').textContent='';
  $('bamco-day-start').disabled=app.isReadOnly();
  form.addEventListener('submit',event=>{event.preventDefault();begin(c,form)});
  form.addEventListener('input',()=>{
    if (form.dataset.saving) form.dataset.changedDuringSave='true';
    const status=$('bamco-live-state');
    if(status.textContent) status.textContent='';
  });
  form.elements.startKm.addEventListener('input',()=>updateDistance(form));
  form.elements.endKm.addEventListener('input',()=>updateDistance(form));
  for(const name of ['date','startTime','endTime','breakdownTime'])form.elements[name]?.addEventListener('input',event=>{event.target.value=toFaDigits(event.target.value);event.target.setCustomValidity('')});
  wireTimePickers(form);
  wireScriptFonts(section);
  if(app.isReadOnly())form.querySelectorAll('input,select,textarea,button').forEach(element=>element.disabled=true);
  window.BAMCO_DROPDOWNS?.(section);
  updatePassengerButtons(form);
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

async function begin(c,form){
  if (app.isReadOnly() || form.dataset.saving) return;
  const fields = form.elements;
  const {preDrive, ...values} = formData(form);
  fields.date.setCustomValidity(values.date && !validPersianDate(values.date) ? 'تاریخ شمسی را به‌صورت ۱۴۰۵/۰۸/۱۹ وارد کنید.' : '');
  fields.endKm.setCustomValidity(values.startKm!=='' && values.endKm!=='' && values.endKm<values.startKm ? 'کیلومتر پایان نمی‌تواند کمتر از کیلومتر شروع باشد.' : '');
  for (const name of ['startTime','endTime','breakdownTime']) {
    if (values[name] && !validTime(values[name])) {openTimePicker(fields[name]);return}
  }
  // A pre-drive inspection can be saved before end time and final mileage exist.
  // Still reject malformed entries instead of accepting an invalid reading as a draft.
  for (const field of form.querySelectorAll('input,select,textarea')) {
    if (!field.validity.valid && !field.validity.valueMissing) {field.reportValidity();return}
  }
  const complete = [...form.querySelectorAll('[required]')].every(field => field.value.trim() !== '');
  const previous = app.mission(c.key);
  const now = new Date().toISOString();
  const mission = {...previous, preDrive:{...previous.preDrive, ...preDrive}, updatedAt:now};
  if (complete) {
    Object.assign(mission, values, {dailyInfoSavedAt:now, startedAt:previous.startedAt||now});
    delete mission.dailyFormDraft;
  } else {
    mission.dailyFormDraft = values;
  }
  const status = $('bamco-live-state'), button = $('bamco-day-start');
  form.dataset.saving = 'true';
  delete form.dataset.changedDuringSave;
  button.disabled = true;
  status.textContent = 'در حال ذخیره…';
  try {
    const ok = await app.saveDailyForm(c,mission,complete ? values.distanceKm : null);
    if (!ok) throw Error('Unconfirmed save');
    if (form.isConnected && !form.dataset.changedDuringSave) status.textContent = complete ? 'فرم روزانه ذخیره شد.' : 'پیش‌نویس فرم روزانه ذخیره شد.';
  } catch {
    if (form.isConnected) status.textContent = 'ذخیره تأیید نشد. دوباره ذخیره را بزنید.';
  } finally {
    delete form.dataset.saving;
    if (form.isConnected) button.disabled = false;
  }
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
    ['دمای هوا',meta.temperature!==''?number(meta.temperature)+' درجه سانتی‌گراد':''],['نوع آب‌وهوا',meta.weather]
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

function renderRoad(c, scheduled) {
  const panel = $('dayProgressRoad');
  if (!panel) return;
  panel.hidden = c?.section !== 'scores';
  if (panel.hidden) return;
  const progress = scheduled || app.dayProgress();
  const extra = customTests(app.mission(c.key));
  const total = progress.total + extra.length;
  const answered = progress.scored + extra.filter(t => Number(t.score) >= 1 && Number(t.score) <= 10).length;
  const fraction = total ? 100 * answered / total : 0;
  const percent = answered < total ? Math.min(99, Math.round(fraction)) : Math.round(fraction);
  const locale = window.BAMCO_I18N?.language || 'fa';
  const a = number(answered), n = number(total);
  const title = {fa:'پیشرفت امتیازدهی روز', en:'Daily scoring progress', zh:'当日评分进度'}[locale];
  const count = {fa:a+' از '+n+' سؤال پاسخ داده شده', en:a+' of '+n+' questions answered', zh:'已回答 '+a+' / '+n+' 道题'}[locale];
  for (const [id, value] of [['dayProgressTitle',title], ['dayProgressCount',count], ['dayProgressPercent',number(percent)+(locale==='fa'?'٪':'%')]]) {
    if ($(id).textContent !== value) $(id).textContent = value;
  }
  panel.style.setProperty('--road-progress', fraction+'%');
  const meter = panel.querySelector('[role="progressbar"]');
  meter.setAttribute('aria-valuenow', String(percent));
  meter.setAttribute('aria-valuetext', count);
}

function renderFinal(c){
  document.querySelectorAll('.bamco-day-final,.bamco-day-extra').forEach(node=>node.remove());
  if(c.section!=='scores')return;
  const progress=app.dayProgress?.();
  renderRoad(c, progress);
  const meta=normalize(app.mission(c.key));
  const map=taxonomy(),categories=[...map.keys()].sort((a,b)=>a.localeCompare(b,'fa'));
  const tests=customTests(meta);
  const questions=$('questionsPanel');
  if(!questions)return;
  let anchor=questions;
  if(progress?.complete){
    const finalPanel=document.createElement('section');
    finalPanel.className='surface panel bamco-day-final';
    finalPanel.innerHTML='<div class="bamco-final-heading"><div><span class="bamco-final-check">✓</span><div><h2>جمع‌بندی روز '+number(c.day)+'</h2><p>تمام '+number(progress.total)+' آزمون برنامه این روز پاسخ داده شده‌اند.</p></div></div><span class="chip">تکمیل آزمون‌ها</span></div><div class="bamco-summary-grid">'+summaryItems(meta).map(([label,value])=>'<div class="bamco-summary-item"><span>'+esc(label)+'</span><strong'+(['تاریخ','ساعت پیمایش','کیلومتر شروع','کیلومتر پایان','مسافت طی‌شده','دمای هوا','نوع آب‌وهوا'].includes(label)?' data-i18n-static="true"':'')+'>'+esc(value)+'</strong></div>').join('')+'</div>';
    questions.insertAdjacentElement('afterend',finalPanel);
    anchor=finalPanel;
  }
  const panel=document.createElement('section');
  panel.className='surface panel bamco-day-extra';
  panel.innerHTML='<div class="bamco-extra-intro"><div><h2>آزمون تکمیلی روز '+number(c.day)+'</h2><p>این بخش مستقل است؛ حتی اگر همه آزمون‌های برنامه پاسخ داده نشده باشند، می‌توانید آزمون جدید اضافه کنید.</p></div><span class="chip">افزودن آزمون جدید</span></div>'+
    '<form id="bamco-custom-builder" class="bamco-custom-builder"><label>موضوع مربوط به چه شاخصی است؟<select name="category" required><option value="">انتخاب شاخص</option>'+categories.map(cat=>'<option value="'+esc(cat)+'">'+esc(cat)+'</option>').join('')+'</select></label><label>زیرشاخص<select name="subcategory" required disabled><option value="">ابتدا شاخص را انتخاب کنید</option></select></label><label class="bamco-span-2">عنوان آزمون<input name="name" required placeholder="عنوان آزمون تکمیلی را وارد کنید"></label><label class="bamco-span-2">شرایط آزمون<textarea name="profile" required rows="3" placeholder="شرایط و روش اجرای آزمون را بنویسید"></textarea></label><div class="bamco-builder-action"><button type="submit" class="primary">+ افزودن آزمون تکمیلی</button></div></form>'+
    '<div class="bamco-custom-list">'+(tests.length?tests.map(customCard).join(''):'<div class="empty bamco-no-custom">آزمون تکمیلی دیگری برای این روز ثبت نشده است.</div>')+'</div>';
  anchor.insertAdjacentElement('afterend',panel);
  const builder=$('bamco-custom-builder');
  builder?.elements.category.addEventListener('change',()=>fillSubcategories(builder,map));
  builder?.addEventListener('submit',event=>{event.preventDefault();addCustom(c,builder)});
  wireScriptFonts(panel);
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
  document.querySelector('.bamco-day-extra .bamco-custom-list .question:last-child')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function updateCustom(c,id,patch){
  if(Object.hasOwn(patch,"score"))patch.band=window.BAMCO_REVIEW_CONTRACT.band(patch.score);
  const meta=app.mission(c.key),tests=customTests(meta).map(test=>test.id===id?{...test,...patch,updatedAt:new Date().toISOString()}:test);
  app.setMission(c.key,{...meta,customTests:tests,updatedAt:new Date().toISOString()});
}

function uploadPicture(c,id,file){
 if(!file||!file.type.startsWith('image/'))return;
 const task=new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onerror=()=>reject(Error('Image read failed'));
  reader.onload=()=>{const image=new Image();image.onerror=()=>reject(Error('Image decode failed'));image.onload=()=>{try{
   if(context()?.key!==c.key){resolve();return}
   const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);updateCustom(c,id,{photo:canvas.toDataURL('image/jpeg',.55)});renderFinal(c);resolve();
  }catch(error){reject(error)}};image.src=reader.result};reader.readAsDataURL(file);
 });
 app.trackPicture(task).catch(()=>window.alert('ثبت تصویر انجام نشد؛ دوباره تصویر را انتخاب کنید.'));
}

document.addEventListener('bamco:render', () => {
  syncFormActions();
  const c = app.dayContext();
  if (c?.section !== 'scores') renderRoad(c);
});
new MutationObserver(() => renderRoad(app.dayContext())).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
document.addEventListener('bamco:assessment-close',()=>{lastStamp='';document.querySelectorAll('.bamco-day-final,.bamco-day-extra').forEach(node=>node.remove())});
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
  if(field.matches('#bamco-day-form [name="breakdown"]'))setConditional($('bamco-day-form'),field.name,field.checked);
  if(field.dataset.customNote&&!app.isReadOnly()){
    const c=context();if(c)updateCustom(c,field.dataset.customNote,{note:field.value.trim()});
  }
  if(field.dataset.customPhoto&&!app.isReadOnly()){
    const c=context();if(c)uploadPicture(c,field.dataset.customPhoto,field.files?.[0]);
  }
});
document.addEventListener('input',event=>{applyScriptFont(event.target);const field=event.target;if(field.dataset.customNote&&!app.isReadOnly()){const c=context();if(c)updateCustom(c,field.dataset.customNote,{note:field.value})}});

const observer=new MutationObserver(()=>{
  const c=context();
  if(!c){lastStamp='';document.querySelectorAll('.bamco-day-final,.bamco-day-extra').forEach(node=>node.remove());return}
  if(c.section==='form'&&!$('bamco-day-workflow')){lastStamp='';paint()}
});
observer.observe($('schedulePanel'),{childList:true});
app.currentDayForm = () => {
  const c = context(), form = $('bamco-day-form');
  if (c?.section !== 'form' || !form) return null;
  return {context:{...c}, values:formData(form), title:window.BAMCO_CASES?.current()?.title || $('assessmentName')?.textContent || 'BAMCO'};
};
app.customQuestionCards=()=>{const c=context();return c?.section==='scores'?customTests(normalize(app.mission(c.key))).map(t=>({id:t.id,html:customCard(t)})):[]};
paint();
})();

