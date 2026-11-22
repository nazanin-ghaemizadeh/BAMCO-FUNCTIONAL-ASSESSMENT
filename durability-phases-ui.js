(()=>{'use strict';
const app=window.BAMCO_ASSESSMENT,P=window.BAMCO_DURABILITY_PHASES;
const palette={urban:['#378870','#edf8f2'],rural:['#557fa9','#eef4fc'],hot:['#b67a30','#fff5e5'],offroad:['#94734f','#f7f0e7'],mountain:['#8d70aa','#f4eef9']};
const el=(tag,text='',cls='')=>{const node=document.createElement(tag);node.textContent=text;if(cls)node.className=cls;return node};
const n=v=>Number(v||0).toLocaleString('fa-IR',{maximumFractionDigits:3});
const value=v=>Number(String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬]/g,'').replace('٫','.'));
const button=(text,action,cls='secondary')=>{const b=el('button',text,cls);b.type='button';b.onclick=action;return b};
function theme(node,id){const colors=palette[id]||['#77968a','#f5f9f7'];node.style.setProperty('--phase-route-color',colors[0]);node.style.setProperty('--phase-route-bg',colors[1]);}
function icon(id){const mark=el('span','','phase-route-icon');mark.innerHTML=app.phaseIllustration({routeId:id}).icon;return mark}
function render(host,screen,phase){
 const {rows,tests,snapshot,readOnly,catalog,plan:source}=app.phaseState(),plan=P.normalize(source),allocations=P.targets(rows);
 const renderKey={};host.phaseRenderKey=renderKey;host.replaceChildren();host.classList.add('durability-phases');
 if(screen==='phases'){
  const grid=el('div','','phase-grid');
  for(let p=1;p<=4;p++){
   const days=plan.filter(day=>day.phase===p),chosen=days.filter(P.assigned).length,totals=P.coverage(plan,p,allocations[p-1],snapshot.mileage?.durability),good=chosen===days.length&&totals.every(r=>r.status==='ready'),answered=tests.filter(t=>Number(snapshot.records?.['durability:phase-'+p+':'+t.id]?.score)>0).length;
   const card=button('',()=>app.openPhase(p),'phase-card');card.dataset.phase=p;
   const top=el('span','','phase-card-top');top.append(el('span','فاز '+n(p),'phase-card-title'),el('span',!chosen?'آماده برنامه‌ریزی':good?'برنامه تکمیل است':'در حال برنامه‌ریزی','phase-status '+(good?'ready':'')));
   const art=el('span','','phase-card-art');for(const id of P.ids)art.append(icon(id));
   const metrics=el('span','','phase-card-metrics');metrics.append(el('strong',n(totals.reduce((s,r)=>s+r.target,0))+' کیلومتر'),el('b',n(days.length)+' روز'),el('span',n(chosen)+' روز برنامه‌ریزی‌شده'));
   card.append(top,art,metrics,el('span',n(answered)+' از '+n(tests.length)+' سؤال پاسخ داده شده','phase-question-progress'));grid.append(card);
  }
  host.append(grid);return;
 }
 let draft=plan.map(p=>({...p})),dirty=false,busy=false;
 const last=P.protectedDay(snapshot),days=()=>draft.filter(p=>p.phase===phase),firstDay=days()[0]?.day;
 const hero=el('section','','phase-program surface panel'),head=el('div','','phase-heading');
 head.append(el('h2','برنامه فاز '+n(phase)),el('span',n(days().length)+' روز · '+n(Object.values(allocations[phase-1]).reduce((a,b)=>a+b,0))+' کیلومتر','phase-total'));
 const chart=el('div','','phase-coverage');chart.setAttribute('aria-label','مقایسه کیلومتر انتخاب‌شده با سهم مساوی هر فاز');
 hero.append(head,el('p','سهم هر نوع مسیر در این فاز، یک‌چهارم کل آزمون است.','phase-hint'),chart);host.append(hero);
 const editor=el('section','','phase-editor surface panel'),editorHead=el('div','','phase-heading'),progress=el('span','','phase-total');editorHead.append(el('h2','برنامه روزانه'),progress);
 const list=el('div','','phase-days-grid'),notice=el('p','','phase-save-status');notice.setAttribute('role','status');
 const actions=el('div','','phase-editor-actions'),save=button('ذخیره برنامه فاز',savePlan,'primary'),calendar=button('تقویم روزانه',()=>openSaved('days')),scores=button('امتیازدهی فاز',()=>openSaved('phaseScores'));
 save.dataset.phaseSave='';calendar.dataset.phaseCalendar='';scores.dataset.phaseScores='';actions.append(save,calendar,scores);
 editor.append(editorHead,el('p','مسیر هر روز را انتخاب کن؛ مبدا آن باید مقصد روز قبل باشد.','phase-hint'),actions,notice,list);host.append(editor);
 function paintCoverage(){
  chart.replaceChildren();for(const info of P.coverage(draft,phase,allocations[phase-1],snapshot.mileage?.durability)){
   const row=rows.find(r=>r.id===info.id),box=el('div','','phase-bar-row '+info.status);theme(box,info.id);box.dataset.phaseCoverage=info.id;
   const label=el('div','','phase-bar-label');label.append(icon(info.id),el('strong',row.name),el('span','کل آزمون: '+n(row.km)+' کیلومتر'));
   const numbers=el('div','','phase-bar-numbers');numbers.append(el('strong',n(info.selected)+' از '+n(info.target)+' کیلومتر'),el('span','انتخاب‌شده از هدف فاز'));
   const track=el('div','','phase-bar-track');track.setAttribute('role','meter');track.setAttribute('aria-label',row.name);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(Math.max(info.target,info.selected,1)));track.setAttribute('aria-valuenow',String(info.selected));const fill=el('i');fill.style.width=Math.max(0,Math.min(100,info.target?info.selected/info.target*100:0))+'%';track.append(fill);
   const status=el('p',info.status==='ready'?'سهم این مسیر تکمیل است':info.delta>0?n(info.delta)+' کیلومتر بیشتر از هدف':info.delta<0?n(-info.delta)+' کیلومتر کمتر از هدف':'مسیرهای مشخص‌نشده را از بانک انتخاب کن','phase-bar-status');
   box.append(label,numbers,track,status);chart.append(box);
  }
  save.disabled=readOnly||busy;progress.textContent=n(days().filter(P.assigned).length)+' از '+n(days().length)+' روز مشخص شده';
 }
 function paintDays(){
  list.replaceChildren();for(const day of days()){
   const chosen=P.assigned(day),origin=P.originForDay(draft,day.day,snapshot.config.startCity||'تهران'),frozen=readOnly||day.day<=last;
   const card=el('article','','phase-day-card'+(chosen?' is-planned':'')+(!origin?' is-pending':''));theme(card,day.routeId);card.dataset.phaseDay=day.day;
   const top=el('div','','phase-day-top');top.append(el('strong','روز '+n(day.day-firstDay+1)),el('span','روز '+n(day.day)+' آزمون'));
   const visual=chosen?icon(day.routeId):el('span',n(day.day-firstDay+1),'phase-day-number');
   const title=el('h3',chosen?day.route:'مسیر را مشخص کن');
   const location=el('p',chosen?'از '+day.origin+' به '+day.destination:origin?'شروع از '+origin:'در انتظار مسیر روز قبل','phase-day-location');
   const metric=el('span',chosen?(rows.find(r=>r.id===day.routeId)?.name||'')+' · '+n(day.km)+' کیلومتر':'بدون مسیر','phase-day-metric');
   const choose=button(frozen?'برنامه ثبت‌شده':chosen?'ویرایش مسیر':'انتخاب مسیر',()=>editDay(day.day));choose.dataset.chooseDay=day.day;choose.disabled=frozen||!origin||busy;
   card.append(top,visual,title,location,metric,choose);list.append(card);
  }
 }
 function editDay(dayNumber){
  if(readOnly||busy||dayNumber<=last)return;
  const day=draft.find(p=>p.day===dayNumber),origin=P.originForDay(draft,dayNumber,snapshot.config.startCity||'تهران');if(!origin)return;
  const dialog=el('dialog','','portal-dialog phase-day-dialog'),header=el('div','','portal-dialog-head'),title=el('h2','برنامه روز '+n(dayNumber-firstDay+1)+' · فاز '+n(phase));title.id='phase-day-title';dialog.setAttribute('aria-labelledby',title.id);header.append(title);
  const form=el('form','','portal-dialog-body'),location=el('p','مبدا این روز: '+origin,'phase-origin'),fields=el('div','','phase-day-fields');
  const kindLabel=el('label','نوع مسیر'),kind=el('select');kind.id='phaseRouteKind';kind.append(new Option('همه مسیرها',''));for(const r of rows)kind.append(new Option(r.name,r.id));kindLabel.append(kind);
  const routeLabel=el('label','مسیر از بانک مسیرها'),route=el('select');route.id='phaseRoute';routeLabel.append(route);
  const kmLabel=el('label','پیمایش این روز (کیلومتر)'),km=el('input');km.id='phaseDistance';km.type='text';km.inputMode='decimal';km.autocomplete='off';km.placeholder='مثلا ۳۰۰';km.required=true;kmLabel.append(km);
  const detail=el('p','','phase-route-detail'),warning=el('p','','phase-change-warning');warning.setAttribute('role','status');
  const error=el('p','','phase-save-status');error.setAttribute('role','alert');
  const footer=el('div','','portal-actions'),apply=el('button','ثبت مسیر این روز','portal-primary');apply.type='submit';apply.dataset.phaseApply='';
  footer.append(apply,button('انصراف',()=>dialog.close(),'portal-secondary'));
  if(P.assigned(day)){const clear=button('پاک کردن مسیر',()=>applyChange(null,0),'portal-secondary phase-remove');clear.dataset.phaseClear='';footer.append(clear)}
  fields.append(kindLabel,routeLabel,kmLabel);form.append(location,fields,detail,warning,error,footer);dialog.append(header,form);document.body.append(dialog);
  let choices=[];
  function selected(){return choices.find(r=>r.id===route.value)}
  function previewChange(){
   const edge=selected(),cap=rows.find(r=>r.id===edge?.routeId)?.cap;
   detail.textContent=edge?'مقصد: '+edge.destination+' · سقف روزانه: '+n(cap)+' کیلومتر'+(edge.km?' · طول مسیر: '+n(edge.km)+' کیلومتر':''):'';
   warning.textContent='';if(!edge)return;
   try{const result=P.assignDay(snapshot,draft,dayNumber,edge,value(km.value));if(result.cleared.length)warning.textContent='با تغییر مقصد، مسیر '+n(result.cleared.length)+' روز بعد که پیوستگی ندارند پاک می‌شود و باید دوباره انتخاب شوند.'}catch{}
  }
  function loadChoices(keep=false){choices=P.optionsFrom(catalog,origin,kind.value);route.replaceChildren(new Option(choices.length?'انتخاب مسیر…':'مسیر فعالی از این مبدا وجود ندارد',''));for(const edge of choices)route.append(new Option((edge.name||edge.origin+' — '+edge.destination)+' · '+(rows.find(r=>r.id===edge.routeId)?.name||''),edge.id));route.value=keep?day.roadId||'':'';km.value=keep&&P.assigned(day)?n(day.km):'';previewChange();window.BAMCO_DROPDOWNS?.(dialog)}
  kind.onchange=()=>loadChoices();route.onchange=()=>{const edge=selected(),row=rows.find(r=>r.id===edge?.routeId);km.value=edge?n(edge.km||row?.cap||0):'';previewChange()};
  km.oninput=()=>{const pos=km.selectionStart;km.value=km.value.replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/[٠-٩]/g,d=>'۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]).replace(/\./g,'٫');km.setSelectionRange(pos,pos);previewChange()};
  function applyChange(edge,distance){try{
   if(edge){const cap=rows.find(r=>r.id===edge.routeId)?.cap;if(distance>cap+.001)throw Error('پیمایش این روز نباید از '+n(cap)+' کیلومتر بیشتر باشد.');}
   const result=P.assignDay(snapshot,draft,dayNumber,edge,distance);
   // Clearing is a deliberate action; show the affected days before accepting it.
   if(!edge&&result.cleared.length&&form.dataset.confirmClear!=='yes'){form.dataset.confirmClear='yes';warning.textContent='با پاک کردن این روز، مسیر '+n(result.cleared.length)+' روز بعد هم پاک می‌شود. برای تایید دوباره پاک کردن مسیر را بزن.';return}
   draft=result.plan;dirty=true;paintDays();paintCoverage();notice.textContent='مسیر روز '+n(dayNumber)+' تنظیم شد؛ برنامه فاز را ذخیره کن.'+(result.cleared.length?' مسیر روزهای بعد نیازمند انتخاب دوباره است.':'');dialog.close();
  }catch(e){error.textContent=e.message}}
  form.onsubmit=e=>{e.preventDefault();const edge=selected();if(!edge){error.textContent='یک مسیر از بانک مسیرها انتخاب کن.';return}applyChange(edge,value(km.value))};
  dialog.onclose=()=>dialog.remove();kind.value=day.routeId||'';loadChoices(true);dialog.showModal();
 }
 async function openSaved(section){if(busy)return;if(dirty&&!await savePlan())return;app.openPhase(phase,section)}
 async function savePlan(){if(busy||readOnly)return false;try{
  const next=P.validatePlan({...snapshot,durabilitySchedule:plan},draft);busy=true;save.disabled=true;list.inert=true;notice.textContent='در حال ذخیره برنامه…';
  if(!await app.savePhasePlan(next,allocations))throw Error('ذخیره تأیید نشد؛ دوباره تلاش کن.');dirty=false;if(!host.isConnected||host.phaseRenderKey!==renderKey)return true;render(host,'phase',phase);host.querySelector('.phase-save-status').textContent='برنامه فاز ذخیره شد.';return true;
 }catch(error){notice.textContent=error.message;return false}finally{busy=false;save.disabled=readOnly;list.inert=false}}
 paintDays();paintCoverage();
}
window.BAMCO_PHASE_UI={render};
})();
