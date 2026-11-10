(()=>{'use strict';
const $=id=>document.getElementById(id),app=window.BAMCO_ASSESSMENT;
let lastStamp='';

const context=()=>{
  const tab=document.body.dataset.view;
  if(!['drive','durability'].includes(tab))return null;
  const raw=document.querySelector('.day-picker-trigger strong')?.textContent?.match(/[0-9۰-۹]+/)?.[0]||'';
  const day=Number(raw.replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c))||0);
  return day?{tab,day,key:tab+':'+day}:null;
};

function paint(){
  const c=context();
  if(!c)return;
  const host=$('schedulePanel');
  if(!host)return;
  const markerKey=c.key;
  const meta=app.mission(markerKey);
  if($('bamco-day-workflow')&&lastStamp===markerKey)return;
  lastStamp=markerKey;
  document.querySelectorAll('#bamco-day-workflow').forEach(node=>node.remove());
  const form=document.createElement('section');
  form.id='bamco-day-workflow';
  form.className='bamco-day-workflow';
  form.innerHTML='<div class="section-heading"><div><h2>اطلاعات مأموریت روز '+c.day+'</h2><p>اطلاعات راننده و شرایط پیمایش را ثبت کنید؛ اشتراک موقعیت فقط از نوار بالای ارزیابی انجام می‌شود.</p></div></div><div class="bamco-day-fields"><label>نام و نام خانوادگی راننده<input name="driver" required autocomplete="name"></label><label>نام سایر حاضرین در خودرو<input name="passengers" placeholder="نام‌ها را با ویرگول جدا کنید"></label><label>دمای هوا (°C)<input name="temperature" type="number" step="0.1" placeholder="مثلاً ۲۵"></label><label>وضعیت آب و هوا<select name="weather"><option value="">انتخاب کنید</option><option>آفتابی</option><option>ابری</option><option>بارانی</option><option>برفی</option><option>مه‌آلود</option><option>باد شدید</option></select></label><label>نوع بنزین<input name="fuel" placeholder="معمولی / سوپر"></label><label>جایگاه سوخت<input name="station" placeholder="نام یا محل جایگاه"></label><label>لیتر بنزین زده‌شده<input name="liters" type="number" min="0" step="0.01"></label></div><div class="bamco-day-actions"><button type="button" id="bamco-day-start" class="primary">ثبت اطلاعات و ورود به سؤالات</button></div><p id="bamco-live-state" role="status"></p>';
  host.insertAdjacentElement('afterbegin',form);
  for(const input of form.querySelectorAll('[name]'))if(meta[input.name]!==undefined)input.value=meta[input.name];
  const started=Boolean(meta.startedAt);
  const questions=$('questionsPanel');
  if(questions)questions.classList.toggle('hidden',!started&&!app.isReadOnly());
  $('bamco-live-state').textContent=started?'اطلاعات مأموریت ثبت شده است. برای اشتراک موقعیت از گزینه بالای صفحه استفاده کنید.':'پس از ثبت اطلاعات، سؤالات این روز نمایش داده می‌شوند.';
  if(app.isReadOnly()){
    form.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
    return;
  }
  $('bamco-day-start').onclick=()=>begin(c,form);
}

function begin(c,form){
  const driver=form.querySelector('[name=driver]').value.trim();
  if(!driver){form.querySelector('[name=driver]').focus();return}
  const data=Object.fromEntries([...form.querySelectorAll('[name]')].map(element=>[element.name,element.value]));
  app.setMission(c.key,{...data,startedAt:app.mission(c.key).startedAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
  $('questionsPanel')?.classList.remove('hidden');
  $('bamco-live-state').textContent='اطلاعات مأموریت در دیتابیس ذخیره شد. اشتراک موقعیت فقط از نوار بالای ارزیابی کنترل می‌شود.';
  $('questionsPanel')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

document.addEventListener('bamco:assessment-close',()=>{lastStamp=''});
const observer=new MutationObserver(()=>{
  const c=context();
  if(!c){lastStamp='';return}
  if(!$('bamco-day-workflow')){lastStamp='';paint()}
});
observer.observe($('schedulePanel'),{childList:true});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-day],[data-tab]')){lastStamp='';setTimeout(paint,0)}
});
document.addEventListener('bamco:day-render',()=>{lastStamp='';paint()});
paint();
})();
