(() => {
'use strict';
const portal=window.BAMCO_PORTAL;
const rpc=async(operation,args={})=>{const {data,error}=await portal.rpc('bamco_banks',{operation,args});if(error)throw error;return data};
const routes={urban:['شهری','Urban','城市'],rural:['برون‌شهری','Interurban','城际'],hot:['گرمسیری','Hot climate','高温'],mountain:['کوهستانی','Mountain','山区'],offroad:['خارج‌جاده / خاکی','Off-road','越野']};
const words={routes:['بانک مسیرها','Route bank','路线库'],prompts:['بانک پرامپت‌ها','Prompt bank','提示词库'],back:['بازگشت','Back','返回'],createRoute:['تعریف مسیر جدید','Add route','新增路线'],createPrompt:['تعریف پرامپت جدید','Add prompt','新增提示词'],edit:['ویرایش','Edit','编辑'],save:['ذخیره','Save','保存'],cancel:['انصراف','Cancel','取消'],close:['بستن','Close','关闭'],all:['همه','All','全部'],active:['فعال','Active','启用'],inactive:['غیرفعال','Inactive','停用'],activate:['فعال‌سازی','Activate','启用'],deactivate:['غیرفعال‌سازی','Deactivate','停用'],status:['وضعیت','Status','状态'],search:['جست‌وجو','Search','搜索'],name:['نام مسیر','Route name','路线名称'],title:['عنوان پرامپت','Prompt title','提示词标题'],origin:['مبدأ','Origin','起点'],destination:['مقصد','Destination','终点'],kind:['نوع مسیر','Route type','路线类型'],km:['مسافت مرجع (کیلومتر)','Reference distance (km)','参考距离（公里）'],notes:['مسیر عبوری و توضیحات','Waypoints and notes','途经地点及备注'],bidirectional:['قابل استفاده در هر دو جهت','Available in both directions','可双向使用'],content:['متن پرامپت','Prompt text','提示词内容'],version:['نسخه','Version','版本'],previous:['قبلی','Previous','上一页'],next:['بعدی','Next','下一页'],retry:['تلاش مجدد','Retry','重试'],loading:['در حال دریافت اطلاعات…','Loading…','加载中…'],error:['دریافت یا ذخیره اطلاعات انجام نشد. دوباره تلاش کنید.','Could not load or save. Please retry.','无法加载或保存，请重试。'],conflict:['این مورد هم‌زمان تغییر کرده است. پنجره را ببندید و پس از تازه‌سازی دوباره ویرایش کنید.','This item changed in another session. Close and refresh before editing again.','此项已在其他会话中更改，请关闭并刷新后重试。'],refresh:['تازه‌سازی','Refresh','刷新'],empty:['موردی یافت نشد.','No matching items.','未找到匹配项。'],saved:['تغییرات ذخیره شد.','Changes saved.','更改已保存。'],routeHint:['مسیرهای فعال در برنامهٔ آزمون دوام قابل انتخاب‌اند. برنامهٔ قابلیت رانندگی ثابت است.','Active routes are available for durability planning. The drivability schedule is fixed.','启用的路线可用于耐久性计划；驾驶性能路线固定。'],promptHint:['پرامپت فعال هنگام تحلیل هوش مصنوعی ارسال می‌شود. ویرایش، یک نسخهٔ جدید می‌سازد و نسخه‌های قبلی باقی می‌مانند.','The active prompt is sent for AI analysis. Editing creates a new version and keeps earlier versions.','AI分析使用已启用的提示词。编辑将创建新版本并保留旧版本。'],promptRule:['خروجی تحلیل در قالب پنج پیشنهاد فنی سامانه نمایش داده می‌شود.','Analysis is displayed as five structured technical recommendations.','分析将显示为五条结构化技术建议。'],noActive:['پرامپت فعالی انتخاب نشده است. برای تحلیل هوش مصنوعی، یک پرامپت را فعال کنید.','Activate a prompt to enable AI analysis.','请启用一个提示词以使用AI分析。'],read:['مشاهده متن','Read prompt','查看内容'],activeUse:['استفاده برای تحلیل هوش مصنوعی','Use for AI analysis','用于AI分析'],count:['مورد','items','项'],optional:['اختیاری','Optional','可选']};
const el=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e};
const editable=()=>portal.user?.admin||portal.can('setup');
const icon=(kind)=>kind==='routes'?'<path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2Z"/><path d="M9 3v16m6-14v16"/>':'<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 9h8m-8 4h8m-8 4h4M16 1v5m-2-2h4"/>';
const symbol=kind=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon(kind)+'</svg>';
async function loadRoutes(){const records=await rpc('list',{kind:'routes'});if(!Array.isArray(records))throw Error('routes');window.BAMCO_DATA.roadCatalog=records.filter(r=>r.definition.active).map(r=>({id:r.id,...r.definition}));return records}
async function activePrompt(){const row=await rpc('active_prompt');if(!row?.id||!row?.definition?.content)throw Error('no_active_prompt');return row}
function promptText(row,language='fa'){return window.BAMCO_REVIEW_CONTRACT.composePrompt(row.definition.content,language)}
function mount(host,{kind,language='fa',home}){
 const li={fa:0,en:1,zh:2}[language]??0,t=k=>words[k]?.[li]||k,number=n=>new Intl.NumberFormat(language==='fa'?'fa-IR':language).format(n);
 let records=[],query='',type='',status='',page=0,busy=false;
 host.className='catalog-bank';
 const header=el('header','','qb-header'),heading=el('h1',t(kind),'gate-title');header.append(heading);
 const divider=el('div','','welcome-divider');divider.innerHTML='<i></i><i></i><i></i>';divider.setAttribute('aria-hidden','true');header.append(divider);
 const button=(key,fn,primary=false)=>{const b=el('button',t(key),'assessment-action'+(primary?' qb-primary':''));b.type='button';b.onclick=fn;return b};
 const bar=el('div','','assessment-page-toolbar');bar.append(button('back',home));if(editable()){const b=button(kind==='routes'?'createRoute':'createPrompt',()=>edit(),true);b.classList.add('bank-add');bar.append(b)}header.append(bar);
 const hint=el('p',t(kind==='routes'?'routeHint':'promptHint'),'bank-hint'),filters=el('div','','bank-filters');
 const field=(label,control)=>{const l=el('label',t(label));l.append(control);return l};
 const search=el('input');search.type='search';search.setAttribute('aria-label',t('search'));search.oninput=()=>{query=search.value.trim().toLocaleLowerCase();page=0;draw()};filters.append(field('search',search));
 function select(label,options,change){const s=el('select');s.append(new Option(t('all'),''));for(const [key,name] of options)s.append(new Option(name,key));s.onchange=()=>{change(s.value);page=0;draw()};filters.append(field(label,s));}
 if(kind==='routes')select('kind',Object.entries(routes).map(([k,v])=>[k,v[li]]),v=>type=v);
 select('status',[['active',t('active')],['inactive',t('inactive')]],v=>status=v);
 filters.append(button('refresh',()=>reload()));
 const message=el('p','','qb-status');message.setAttribute('role','status');const results=el('div','','bank-results');
 host.replaceChildren(header,...(kind==='routes'?[hint]:[]),filters,message,results);window.BAMCO_DROPDOWNS?.(host);
 async function reload(note=''){message.textContent=t('loading');try{const data=await rpc('list',{kind});if(!Array.isArray(data))throw Error('invalid');records=data;message.textContent=note;draw()}catch{message.textContent=t('error');results.replaceChildren(button('retry',()=>reload()))}}
 async function toggle(row){if(busy)return;busy=true;try{const saved=await rpc('toggle',{kind,id:row.id,revision:row.revision,active:!row.definition.active});if(saved?.conflict)throw Error('conflict');await reload(t('saved'))}catch(e){message.textContent=t(e.message==='conflict'?'conflict':'error')}finally{busy=false}}
 function draw(){
  const sorted=records.filter(r=>{const d=r.definition;return (!query||[d.name,d.title,d.origin,d.destination,d.notes,d.content].join(' ').toLocaleLowerCase().includes(query))&&(!type||type===d.routeId)&&(!status||(status==='active')===d.active)}).sort((a,b)=>Number(b.definition.active)-Number(a.definition.active)||b.updated_at.localeCompare(a.updated_at));
  page=Math.min(page,Math.max(0,Math.ceil(sorted.length/12)-1));
  results.replaceChildren(el('p',number(sorted.length)+' '+t('count'),'qb-count'));
  if(kind==='prompts'&&!records.some(r=>r.definition.active))results.append(el('p',t('noActive'),'bank-empty'));
  const grid=el('div','','bank-grid');results.append(grid);
  for(const row of sorted.slice(page*12,page*12+12)){
   const d=row.definition,card=el('article','','bank-card'+(d.active?'':' is-inactive')),top=el('div','','bank-card-top'),mark=el('span','','bank-symbol');mark.innerHTML=symbol(kind);
   const badge=el('span',t(d.active?'active':'inactive'),'bank-badge'+(d.active?' active':''));top.append(mark,badge);
   const title=el('h2',d.name||d.title);card.append(top,title);
   if(kind==='routes'){
    card.append(el('span',routes[d.routeId]?.[li]||d.routeId,'bank-type'));
    const journey=el('div','','bank-journey');for(const k of ['origin','destination']){const part=el('div');part.append(el('small',t(k)),el('strong',d[k]));journey.append(part)}card.append(journey);
    if(d.km)card.append(el('p',number(d.km)+' '+(li===0?'کیلومتر':li===1?'km':'公里'),'bank-distance'));
    if(d.notes)card.append(el('p',d.notes,'bank-notes'));
   }else{
    card.append(el('span',t('version')+' '+number(d.version),'bank-type'));
   }
   const footer=el('footer','','bank-actions');if(editable())footer.append(button('edit',()=>edit(row)),button(d.active?'deactivate':'activate',()=>toggle(row),!d.active));card.append(footer);grid.append(card);
  }
  if(!sorted.length)grid.append(el('p',t('empty'),'bank-empty'));
  if(sorted.length>12){const nav=el('nav','','bank-pager'),prev=button('previous',()=>{page--;draw()}),next=button('next',()=>{page++;draw()});prev.disabled=page===0;next.disabled=(page+1)*12>=sorted.length;nav.append(prev,el('span',number(page+1)+' / '+number(Math.ceil(sorted.length/12))),next);results.append(nav)}
 }
 function edit(existing){
  if(!editable())return;
  const d=existing?.definition||{active:kind==='routes',bidirectional:true,routeId:'urban'},dialog=el('dialog','','portal-dialog bank-dialog'),head=el('div','','portal-dialog-head'),title=el('h2',t(existing?'edit':kind==='routes'?'createRoute':'createPrompt'));title.id='bank-editor-title';dialog.setAttribute('aria-labelledby',title.id);
  const heading=el('div','','portal-heading');heading.innerHTML=symbol(kind);heading.append(title);const close=button('close',()=>dialog.close());close.className='portal-dialog-close';close.textContent='×';close.setAttribute('aria-label',t('close'));head.append(heading,close);
  const form=el('form','','portal-dialog-body'),fields=el('fieldset','','portal-section bank-fields'),controls={};
  function input(key,tag='input',wide=false){const c=el(tag);c.name=key;c.value=d[key]??'';c.maxLength=key==='content'?16000:key==='notes'?3000:160;c.required=!['notes','km'].includes(key);if(tag==='textarea')c.rows=key==='content'?12:3;const l=field(key,c);if(wide)l.classList.add('bank-wide');fields.append(l);controls[key]=c;return c}
  function checkbox(key,label=key){const l=el('label','','bank-check bank-wide'),c=el('input');c.type='checkbox';c.name=key;c.checked=!!d[key];l.append(c,el('span',t(label)));fields.append(l);controls[key]=c;}
  if(kind==='routes'){
   input('name','input',true);input('origin');input('destination');const s=el('select');s.name='routeId';for(const [k,v]of Object.entries(routes))s.append(new Option(v[li],k));s.value=d.routeId;controls.routeId=s;fields.append(field('kind',s));const km=input('km');km.type='number';km.min='0.001';km.max='200000';km.step='any';km.placeholder=t('optional');input('notes','textarea',true);checkbox('bidirectional');checkbox('active');
  }else{input('title','input',true);input('content','textarea',true);checkbox('active','activeUse');fields.append(el('p',t('promptRule'),'bank-wide bank-hint'))}
  const notice=el('p','','qb-status');notice.setAttribute('role','alert');const actions=el('div','','portal-actions'),cancel=button('cancel',()=>dialog.close()),save=button('save',()=>{},true);cancel.className='portal-secondary';save.type='submit';save.className='portal-primary';actions.append(save,cancel);form.append(fields,notice,actions);dialog.append(head,form);document.body.append(dialog);
  let saving=false;dialog.oncancel=e=>{if(saving)e.preventDefault()};dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  form.onsubmit=async e=>{e.preventDefault();if(saving||!form.reportValidity())return;saving=true;fields.disabled=true;save.disabled=close.disabled=cancel.disabled=true;notice.textContent=t('loading');const definition={};for(const [k,c]of Object.entries(controls))definition[k]=c.type==='checkbox'?c.checked:k==='km'?(c.value?Number(c.value):null):c.value.trim();try{const result=await rpc('save',{kind,id:existing?.id||null,revision:existing?.revision||0,definition});if(result?.conflict)throw Error('conflict');dialog.close();if(host.isConnected)await reload(t('saved'))}catch(err){notice.textContent=t(err.message==='conflict'?'conflict':'error')}finally{saving=false;fields.disabled=false;save.disabled=close.disabled=cancel.disabled=false}};
  dialog.showModal();window.BAMCO_DROPDOWNS?.(dialog);
  if(controls.content){
   const prompt=controls.content;prompt.classList.add('bank-prompt-input');prompt.rows=1;
   const fit=()=>{
    if(!dialog.open)return;
    const scroll=form.scrollTop;prompt.style.height='auto';
    const style=getComputedStyle(prompt),border=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    prompt.style.height=Math.ceil(prompt.scrollHeight+border)+'px';
    // The dialog scrollbar can narrow the field after it grows; remeasure wrapping.
    for(let pass=0;pass<3&&prompt.scrollHeight>prompt.clientHeight;pass++)prompt.style.height=Math.ceil(prompt.scrollHeight+border)+'px';
    prompt.scrollTop=0;form.scrollTop=scroll;
   };
   prompt.addEventListener('input',fit);fit();
   let width=0;
   const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(prompt.clientWidth!==width){width=prompt.clientWidth;fit()}}):null;
   observer?.observe(prompt);window.addEventListener('resize',fit);
   document.fonts?.ready.then(fit);
   dialog.addEventListener('close',()=>{observer?.disconnect();window.removeEventListener('resize',fit)},{once:true});
  }

 }
 reload();
}
window.BAMCO_BANKS={mount,loadRoutes,activePrompt,promptText};
})();
