(()=>{'use strict';
const app=window.BAMCO_ASSESSMENT,P=window.BAMCO_DURABILITY_PHASES;
const palette={urban:['#378870','#edf8f2'],rural:['#557fa9','#eef4fc'],hot:['#b67a30','#fff5e5'],offroad:['#94734f','#f7f0e7'],mountain:['#8d70aa','#f4eef9']};
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n};
const n=v=>Number(v||0).toLocaleString(window.BAMCO_I18N?.language==='fa'||!window.BAMCO_I18N?'fa-IR':'en-US',{maximumFractionDigits:3});
const value=v=>Number(String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬]/g,'').replace('٫','.'));
const button=(text,action,cls='secondary')=>{const b=el('button',text,cls);b.type='button';b.onclick=action;return b};
function theme(node,id){node.style.setProperty('--phase-route-color',palette[id][0]);node.style.setProperty('--phase-route-bg',palette[id][1]);}
function icon(id){const mark=el('span','','phase-route-icon');mark.innerHTML=app.phaseIllustration({routeId:id}).icon;return mark}
function render(host,screen,phase){
 const context=app.phaseState(),{rows,tests,snapshot,readOnly,catalog}=context,plan=P.normalize(context.plan),allocations=P.targets(rows,snapshot.config.durabilityPhaseTargets);
 host.replaceChildren();host.classList.add('durability-phases');
 if(screen==='phases'){
  const grid=el('div','','phase-grid');
  for(let p=1;p<=4;p++){
   const legs=plan.filter(day=>day.phase===p),totals=P.coverage(plan,p,allocations[p-1],snapshot.mileage?.durability),good=totals.every(r=>r.status==='ready'),answered=tests.filter(t=>Number(snapshot.records?.['durability:phase-'+p+':'+t.id]?.score)>0).length;
   const card=button('',()=>app.openPhase(p),'phase-card');card.dataset.phase=p;
   const top=el('span','','phase-card-top');top.append(el('span','فاز '+n(p),'phase-card-title'),el('span',!legs.length?'بدون برنامه':good?'برنامه تکمیل است':'برنامه نیازمند بررسی','phase-status '+(good?'ready':'')));
   const art=el('span','','phase-card-art');for(const id of P.ids)art.append(icon(id));
   const metrics=el('span','','phase-card-metrics');metrics.append(el('strong',totals.every(r=>r.target!==null)?n(totals.reduce((s,r)=>s+r.target,0))+' کیلومتر':'هدف را تعیین کن'),el('span',n(legs.length)+' روز برنامه‌ریزی‌شده'));
   const score=el('span',n(answered)+' از '+n(tests.length)+' سؤال پاسخ داده شده','phase-question-progress');
   card.append(top,art,metrics,score);grid.append(card);
  }
  host.append(grid);return;
 }
 let legs=plan.filter(day=>day.phase===phase).map(p=>({...p})),targets=allocations.map(p=>({...p})),busy=false,dirty=false;
 const last=P.protectedDay(snapshot),laterLocked=plan.some(p=>p.day<=last&&p.phase>phase),locked=readOnly||laterLocked;
 const hero=el('section','','phase-program surface panel'),head=el('div','','phase-heading');
 head.append(el('h2','برنامه فاز '+n(phase)),button('تنظیم سهم چهار فاز',editTargets));head.lastChild.disabled=readOnly;
 const chart=el('div','','phase-coverage');chart.setAttribute('aria-label','مقایسه کیلومتر انتخاب‌شده با هدف هر نوع مسیر');
 const hint=el('p','هدف هر نوع مسیر و ترتیب روزهای این فاز را خودت تعیین کن.','phase-hint');
 hero.append(head,hint,chart);host.append(hero);
 const editor=el('section','','phase-editor surface panel'),editorHead=el('div','','phase-heading');editorHead.append(el('h2','روزها و مسیرهای این فاز'));const reset=button('پاک کردن برنامه این فاز',()=>{legs=legs.filter(p=>p.day&&p.day<=last);targets[phase-1]=Object.fromEntries(P.ids.map(id=>[id,null]));dirty=true;paintLegs();paintCoverage();notice.textContent='برنامه پاک شد؛ برای ثبت تغییرات، ذخیره را بزن.'});reset.disabled=locked;reset.dataset.phaseReset='';editorHead.append(reset);
 const tools=el('div','','phase-editor-tools'),kindLabel=el('label','نوع مسیر'),kind=el('select');kind.id='phaseRouteKind';kind.append(new Option('همه مسیرها',''));for(const r of rows)kind.append(new Option(r.name,r.id));kindLabel.append(kind);
 const routeLabel=el('label','مسیر از بانک مسیرها'),route=el('select');route.id='phaseRoute';routeLabel.append(route);
 const kmLabel=el('label','پیمایش این روز (کیلومتر)'),km=el('input');km.id='phaseDistance';km.type='number';km.min='.001';km.max='200000';km.step='.001';km.inputMode='decimal';kmLabel.append(km);
 const reverseLabel=el('label','مسیر برگشت','phase-reverse'),reverse=el('input');reverse.type='checkbox';reverse.id='phaseReverse';reverseLabel.prepend(reverse);
 const add=button('افزودن به برنامه',addLeg,'primary');add.dataset.phaseAdd='';
 tools.append(kindLabel,routeLabel,kmLabel,reverseLabel,add);editor.append(editorHead,tools);
 const list=el('div','','phase-leg-list'),notice=el('p','','phase-save-status');notice.setAttribute('role','status');
 const actions=el('div','','phase-editor-actions'),save=button('ذخیره برنامه فاز',savePlan,'primary'),calendar=button('تقویم روزانه',()=>openSaved('days')),scores=button('امتیازدهی فاز',()=>openSaved('phaseScores'));
 save.dataset.phaseSave='';calendar.dataset.phaseCalendar='';scores.dataset.phaseScores='';actions.append(save,calendar,scores);editor.append(list,notice,actions);host.append(editor);
 if(laterLocked)editor.insertBefore(el('p','فاز بعدی اطلاعات ثبت‌شده دارد؛ برنامه این فاز حفظ می‌شود.','phase-hint'),tools);
 let choices=[];
 function loadChoices(){choices=(catalog||[]).filter(r=>r.active!==false&&(!kind.value||r.routeId===kind.value));route.replaceChildren(new Option('انتخاب مسیر…',''));for(let i=0;i<choices.length;i++)route.append(new Option((choices[i].name||choices[i].origin+' — '+choices[i].destination)+(!kind.value?' · '+(rows.find(r=>r.id===choices[i].routeId)?.name||''):''),String(i)));route.value='';km.value='';reverse.checked=false;reverse.disabled=true;window.BAMCO_DROPDOWNS?.(tools);}
 function selectedRoute(){return route.value!==''?choices[Number(route.value)]:null}
 kind.onchange=loadChoices;route.onchange=()=>{const edge=selectedRoute();km.value=edge?.km||'';reverse.checked=false;reverse.disabled=!edge||edge.bidirectional===false||edge.origin===edge.destination||locked;};
 function addLeg(){try{let edge=selectedRoute();if(reverse.checked&&edge)edge={...edge,id:edge.id+':reverse',origin:edge.destination,destination:edge.origin,name:edge.destination+' — '+edge.origin};legs.push(P.leg(edge,value(km.value),phase));dirty=true;notice.textContent='برای ثبت تغییرات، برنامه فاز را ذخیره کن.';paintLegs();paintCoverage();}catch(error){notice.textContent=error.message}}
 function draftPlan(){return [...plan.filter(p=>p.phase!==phase),...legs]}
 function paintCoverage(){
  chart.replaceChildren();const coverage=P.coverage(draftPlan(),phase,targets[phase-1],snapshot.mileage?.durability);
  for(const info of coverage){const row=rows.find(r=>r.id===info.id),box=el('div','','phase-bar-row '+info.status);theme(box,info.id);box.dataset.phaseCoverage=info.id;
   const label=el('div','','phase-bar-label');label.append(icon(info.id),el('strong',row.name),el('span','کل آزمون: '+n(row.km)+' کیلومتر'));
   const numbers=el('div','','phase-bar-numbers'),amount=el('strong'),ratio=el('bdi',n(info.selected)+' / '+(info.target===null?'—':n(info.target)));ratio.dir='ltr';amount.append(ratio,' کیلومتر');numbers.append(amount,el('span','انتخاب‌شده / هدف فاز'));
   const track=el('div','','phase-bar-track');track.setAttribute('role','meter');track.setAttribute('aria-label',row.name);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(Math.max(info.target||0,info.selected,1)));track.setAttribute('aria-valuenow',String(info.selected));const fill=el('i');fill.style.width=Math.max(0,Math.min(100,info.target?info.selected/info.target*100:0))+'%';track.append(fill);
   const status=el('p',info.status==='unset'?'هدف این مسیر را وارد کن':info.status==='ready'?'سهم این مسیر تکمیل است':info.delta>0?n(info.delta)+' کیلومتر بیشتر از هدف':info.delta<0?n(-info.delta)+' کیلومتر کمتر از هدف':'مسیرهای مشخص‌نشده را از بانک انتخاب کن','phase-bar-status');if(info.missing&&info.delta!==0)status.append(' · مسیر مشخص‌نشده');
   const goalLabel=el('label','هدف این فاز (کیلومتر)','phase-goal'),goal=el('input');goal.type='number';goal.inputMode='decimal';goal.min='.001';goal.step='.001';goal.placeholder='تعیین توسط شما';goal.value=targets[phase-1][info.id]??'';goal.disabled=readOnly;goal.dataset.phaseGoal=info.id;goal.setAttribute('aria-label','هدف '+row.name+' در این فاز');goal.oninput=()=>{targets[phase-1][info.id]=goal.value.trim()===''?null:value(goal.value);dirty=true;notice.textContent='هدف تغییر کرد؛ برنامه فاز را ذخیره کن.'};goal.onchange=paintCoverage;goalLabel.append(goal);box.append(label,numbers,goalLabel,track,status);chart.append(box);
  }
  calendar.disabled=!legs.length;save.disabled=readOnly||busy;
 }
 function paintLegs(){list.replaceChildren();if(!legs.length)list.append(el('p','هنوز مسیری برای این فاز انتخاب نشده است.','phase-empty'));
  legs.forEach((leg,index)=>{const frozen=locked||Boolean(leg.day&&leg.day<=last),row=el('article','','phase-leg');theme(row,leg.routeId);const label=el('div','','phase-leg-label');label.append(icon(leg.routeId),el('strong',leg.route||leg.origin+' — '+leg.destination),el('small','روز '+n(index+1)+' این فاز'+(leg.day?' · روز '+n(leg.day)+' آزمون':'')));
   const distanceLabel=el('label','کیلومتر'),distance=el('input');distance.type='number';distance.min='.001';distance.max='200000';distance.step='.001';distance.value=leg.km;distance.disabled=frozen;distance.setAttribute('aria-label','کیلومتر روز '+n(index+1));distance.oninput=()=>{leg.km=value(distance.value);dirty=true;paintCoverage()};distanceLabel.append(distance);
   const remove=button('حذف',()=>{legs.splice(index,1);dirty=true;paintLegs();paintCoverage()},'secondary phase-remove');remove.disabled=frozen;
   const move=button('بالاتر',()=>{[legs[index-1],legs[index]]=[legs[index],legs[index-1]];dirty=true;paintLegs();paintCoverage()});move.disabled=frozen||index===0||Boolean(legs[index-1]?.day&&legs[index-1].day<=last);
   row.append(label,distanceLabel,move,remove);if(leg.needsRoute||!leg.roadId)row.append(el('small','این روز مسیر مشخصی ندارد؛ آن را با یک مسیر از بانک جایگزین کن.','phase-leg-warning'));list.append(row);
  });}
 async function openSaved(section){if(busy)return;if(dirty&&!await savePlan())return;app.openPhase(phase,section)}
 async function savePlan(){if(busy||readOnly)return;try{if(legs.some(p=>!Number.isFinite(p.km)||p.km<=0||p.km>200000))throw Error('مسافت همه روزها باید معتبر و بیشتر از صفر باشد.');if(P.validateTargets(rows,targets).some(i=>i.type==='positive'))throw Error('هدف واردشده باید عددی مثبت باشد.');const next=P.replacePhase({...snapshot,durabilitySchedule:plan},phase,legs);busy=true;save.disabled=true;tools.inert=list.inert=true;notice.textContent='در حال ذخیره برنامه…';if(!await app.savePhasePlan(next,targets))throw Error('ذخیره تأیید نشد؛ دوباره تلاش کن.');dirty=false;if(!host.isConnected)return true;render(host,'phase',phase);host.querySelector('.phase-save-status').textContent='برنامه فاز ذخیره شد.';return true;}catch(error){notice.textContent=error.message;return false}finally{busy=false;save.disabled=readOnly;tools.inert=list.inert=false}}
 function editTargets(){
  const dialog=el('dialog','','portal-dialog phase-target-dialog'),header=el('div','','portal-dialog-head'),heading=el('div','','portal-heading'),title=el('h2','سهم مسیرها در چهار فاز');title.id='phase-target-title';dialog.setAttribute('aria-labelledby',title.id);heading.append(title);header.append(heading);const body=el('form','','portal-dialog-body');
  const intro=el('p','سهم هر فاز را خودت وارد کن. می‌توانی هدف فازهای بعدی را بعدا تعیین کنی.','phase-hint'),grid=el('div','','phase-target-grid');
  const inputs=rows.map(row=>{const section=el('section','','phase-target-row');theme(section,row.id);section.append(el('h3',row.name+' · '+n(row.km)+' کیلومتر'));const fields=el('div','','phase-target-fields');const cells=targets.map((target,i)=>{const label=el('label','فاز '+n(i+1)),input=el('input');input.type='number';input.min=row.km?'.001':'0';input.step='.001';input.placeholder='تعیین توسط شما';input.value=target[row.id]??'';input.dataset.targetRoute=row.id;input.dataset.targetPhase=i+1;label.append(input);fields.append(label);return input});const balance=el('p','','phase-allocation-balance');const refreshBalance=()=>{const total=cells.reduce((sum,c)=>sum+(value(c.value)||0),0),remaining=P.precision(row.km-total);balance.textContent=remaining>0?n(remaining)+' کیلومتر هنوز تخصیص داده نشده':remaining<0?n(-remaining)+' کیلومتر بیشتر از هدف کل':'کل سهم مسیر تخصیص داده شد';balance.classList.toggle('over',remaining<0)};cells.forEach(c=>c.addEventListener('input',refreshBalance));refreshBalance();section.append(fields,balance);grid.append(section);return {row,cells}});
  const error=el('p','','phase-save-status');error.setAttribute('role','alert');const footer=el('div','','portal-actions'),apply=el('button','اعمال سهم‌ها','portal-primary');apply.type='submit';footer.append(apply,button('انصراف',()=>dialog.close(),'portal-secondary'));body.append(intro,grid,error,footer);dialog.append(header,body);document.body.append(dialog);dialog.onclose=()=>dialog.remove();
  body.onsubmit=e=>{e.preventDefault();const next=Array.from({length:4},()=>({}));for(const {row,cells}of inputs)cells.forEach((c,i)=>next[i][row.id]=c.value.trim()===''?null:value(c.value));const issues=P.validateTargets(rows,next).filter(i=>i.type==='positive');if(issues.length){error.textContent=issues.map(i=>{const name=rows.find(r=>r.id===i.routeId).name;return name+': '+(i.type==='positive'?'هر فاز باید سهم مثبت داشته باشد.':n(Math.abs(i.delta))+' کیلومتر '+(i.delta>0?'بیشتر':'کمتر')+' از کل.')}).join(' ');return}targets=next;dirty=true;paintCoverage();notice.textContent='سهم‌ها تغییر کرد؛ برای ثبت، ذخیره برنامه فاز را بزن.';dialog.close()};dialog.showModal();
 }
 loadChoices();for(const field of tools.querySelectorAll('input,select,button'))field.disabled=locked||field.disabled;paintLegs();paintCoverage();window.BAMCO_DROPDOWNS?.(host);
}
window.BAMCO_PHASE_UI={render};
})();
