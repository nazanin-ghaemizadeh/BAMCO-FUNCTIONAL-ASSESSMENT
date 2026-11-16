(() => {
'use strict';
const words = {
  hub:['وزن‌دهی','Weighting','权重设置'], forms:['پرسش‌نامه','Questionnaires','问卷'],
  results:['نتایج وزن‌دهی','Weighting results','权重结果'], back:['بازگشت','Back','返回'],
  create:['ایجاد پرسش‌نامه','Create questionnaire','创建问卷'], save:['ذخیره','Save','保存'],
  saved:['ذخیره شد.','Saved.','已保存。'], retry:['تلاش مجدد','Retry','重试'],
  load:['در حال دریافت…','Loading…','正在加载…'], fail:['ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.','Could not reach the service. Please try again.','无法连接服务，请重试。'],
  conflict:['این فرم در جای دیگری تغییر کرده است. برای دیدن آخرین نسخه، دوباره آن را باز کنید.','This form changed elsewhere. Reopen it to see the saved version.','此问卷已在其他位置更改，请重新打开以查看已保存版本。'],
  denied:['این پیوند دسترسی معتبر نیست.','This access link is invalid.','此访问链接无效。'],
  storage:['برای نگهداری پیوند خصوصی، ذخیره‌سازی مرورگر را فعال کنید.','Enable browser storage to retain the private link.','请启用浏览器存储以保留专用链接。'],
  empty:['هنوز پرسش‌نامه‌ای در این مرورگر ایجاد یا باز نشده است.','No questionnaires have been created or opened in this browser.','此浏览器尚未创建或打开问卷。'],
  noResults:['پس از تکمیل هر ۱۶ فرم، نتیجه‌ی ارزیاب اینجا نمایش داده می‌شود.','An evaluator’s results appear here after all 16 forms are complete.','评估员完成全部16份问卷后，此处将显示其结果。'],
  main:['شاخص‌های اصلی','Main criteria','主要指标'], subgroup:['زیرشاخص‌ها','Subcriteria','子指标'],
  group:['گروه شاخص','Criterion group','指标组'], criterion:['شاخص','Criterion','指标'],
  number:['ردیف','No.','序号'], value:['مقدار','Value','数值'], meaning:['مفهوم','Meaning','含义'],
  done:['تکمیل‌شده','Complete','已完成'], draft:['در حال تکمیل','In progress','填写中'], fresh:['شروع نشده','Not started','未开始'],
  respondent:['ارزیاب','Evaluator','评估员'], profile:['ویرایش مشخصات ارزیاب','Edit evaluator details','编辑评估员信息'],
  copyEdit:['کپی پیوند خصوصی ادامه‌ی پاسخ‌دهی','Copy private edit link','复制个人续填链接'],
  copyInvite:['کپی دعوت‌نامه برای ارزیاب جدید','Copy invitation for a new evaluator','复制新评估员邀请链接'],
  copyManage:['کپی پیوند خصوصی مدیریت نتایج','Copy private results management link','复制结果管理专用链接'],
  copied:['پیوند کپی شد.','Link copied.','链接已复制。'], choose:['انتخاب کنید','Select','请选择'],
  all:['تجمیع همه‌ی ارزیابان','All evaluators combined','汇总所有评估员'],
  overall:['وزن نهایی در کل ارزیابی','Overall weight','总权重'], local:['وزن در گروه','Weight within group','组内权重'],
  weight:['وزن شاخص اصلی','Main criterion weight','主要指标权重'], analysis:['نمایش نتیجه','Show results for','选择结果'],
  aggregateNote:['هر ارزیابِ دارای ۱۶ فرم کامل سهم یکسانی دارد. وزن‌های اصلی و وزن‌های درون هر گروه جداگانه میانگین‌گیری می‌شوند. وزن نهایی هر زیرشاخص حاصل‌ضرب وزن گروه در وزن درون‌گروهی آن است.','Each evaluator with 16 completed forms has equal weight. Main and within-group weights are averaged separately. An overall subcriterion weight is the product of its main and within-group weights.','完成全部16份问卷的评估员等权参与汇总。分别计算主要指标和组内权重的平均值。子指标总权重等于所属主要指标权重乘以组内权重。'],
  individualNote:['وزن‌ها با مدل خطی بهترین–بدترین محاسبه شده‌اند. وزن نهایی هر زیرشاخص حاصل‌ضرب وزن شاخص اصلی در وزن آن زیرشاخص در گروه است.','Weights use the linear Best–Worst Method. Overall subcriterion weight equals main criterion weight times within-group weight.','采用线性最佳–最差法计算权重。子指标总权重等于所属主要指标权重乘以组内权重。'],
  links:['دسترسی ارزیابان','Evaluator access','评估员访问'],
  inviteHelp:['برای جمع‌آوری پاسخ‌ها در همین گروه، دعوت‌نامه را برای ارزیابان بفرستید. هر نفر با آن یک مجموعه‌ی مستقل ایجاد می‌کند. پیوند خصوصی مدیریت، نتایج همه‌ی افراد این گروه را باز می‌کند.','Send the invitation to collect responses in this group. Each evaluator creates their own set. The private management link opens results for the whole group.','发送邀请以在本组收集答卷。每位评估员独立创建一套问卷。管理专用链接可查看本组所有结果。'],
  editHelp:['برای ادامه در دستگاه دیگر، پیوند خصوصی همین ارزیاب را نگه دارید.','Keep this evaluator’s private link to continue on a different device.','请保留此评估员的专用链接，以便在其他设备上续填。'],
  blocked:['ابتدا مهم‌ترین و کم‌اهمیت‌ترین شاخص را انتخاب کنید.','First select the most and least important criteria.','请先选择最重要和最不重要的指标。'],
  detail:['مشاهده زیرشاخص‌ها','View subcriteria','查看子指标'], start:['شروع پاسخ‌دهی','Start answering','开始填写'],
  groupCount:['فرم تکمیل‌شده','forms completed','份问卷已完成'], department:['مجموعه‌ی ارزیابان','Evaluator group','评估组'],
  openLatest:['باز کردن نسخه‌ی ذخیره‌شده','Open saved version','打开已保存版本'],
  linearModel:['مدل خطی','Linear model','线性模型'], nonlinearModel:['مدل غیرخطی','Nonlinear model','非线性模型'],
  model:['مدل','Model','模型'], deviation:['انحراف بهینه','Optimal deviation','最优偏差'], verdict:['وضعیت سازگاری','Consistency','一致性'],
  perfect:['کاملاً سازگار','Fully consistent','完全一致'], acceptable:['قابل قبول','Acceptable','可接受'], revisit:['نیازمند بازبینی','Review comparisons','建议复核'],
  intervalResults:['بازه‌های بهینه‌ی مدل غیرخطی','Optimal intervals of the nonlinear model','非线性模型的最优区间'],
  intervalHelp:['رتبه‌بندی این جدول بر اساس مرکز بازه است. کران پایین و بالا از کمینه و بیشینه کردن وزن هر معیار در انحراف بهینه‌ی مدل غیرخطی به دست می‌آیند.','Intervals are ranked by their centers. The bounds minimize and maximize each criterion weight at the nonlinear model’s optimal deviation.','按区间中心排名。在非线性模型的最优偏差下最小化和最大化各指标权重，得到上下界。'],
  lower:['کران پایین','Lower bound','下界'], upper:['کران بالا','Upper bound','上界'], center:['مرکز بازه','Interval center','区间中心'],
  halfWidth:['نیم‌عرض بازه','Half-width','半宽'], rank:['رتبه','Rank','排名'], point:['وزن خطی','Linear weight','线性权重'],
  savedAnalysis:['نتیجه‌ی آخرین پاسخ‌های ذخیره‌شده','Results of the last saved answers','上次保存的答卷结果'],
  formsAction:['ایجاد و ادامه‌ی پرسش‌نامه','Create or continue a questionnaire','创建或继续填写问卷'],
  resultsAction:['مشاهده‌ی وزن شاخص‌ها','View criterion weights','查看指标权重']
};
const storePrefix='bamco-bwm-v1:';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const token=/^[0-9a-f]{64}$/;
const locales=['fa-IR','en-GB','zh-CN'];
let host, service, language, li, activeRoute, version=0, editing, editingBase, pendingNew, selectedResult, selectedScope;
const clone = x => JSON.parse(JSON.stringify(x));
const tr = k => (words[k] || window.BAMCO_WEIGHTING_COPY[k])[li];
const num = n => Number(n).toLocaleString(locales[li]);
const pct = n => new Intl.NumberFormat(locales[li],{style:'percent',maximumFractionDigits:2}).format(n);
const text = (fa,en,zh) => [fa,en,zh][li];
const groupTitle = i => i===0?tr('main'):window.BAMCO_WEIGHTING_CATALOG[i-1].title[li];
const items = i => i===0?window.BAMCO_WEIGHTING_CATALOG.map(c=>c.title[li]):window.BAMCO_WEIGHTING_CATALOG[i-1].items.map(c=>c[li]);
const groupIcons=['layers','shield','lock','seat','wind','wheel','bolt','leaf','sound','chip','sun','balance','tool','cycle','gem','wallet'];
const tones=['mint','violet','apricot','blue','rose'];
function icon(name,viewBox='0 0 24 24') {
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',viewBox);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  const use=document.createElementNS(ns,'use');use.setAttribute('href','./assets/weighting-sections.svg?v=2#'+name);
  svg.append(use);return svg;
}
function stamp(name,tone='mint'){
  const badge=el('span',null,'bw-stamp');badge.dataset.tone=tone;badge.append(icon(name));return badge;
}
function el(tag,content,cls) {
  const e=document.createElement(tag);
  if(content!=null)e.textContent=content;
  if(cls)e.className=cls;
  return e;
}
function action(label,fn,cls='assessment-action') {
  const b=el('button',label,cls); b.type='button'; b.onclick=fn; return b;
}
function stored(key) {return JSON.parse(localStorage.getItem(storePrefix+key)||'null')}
function keep(key,value) {localStorage.setItem(storePrefix+key,JSON.stringify(value))}
function known(type) {
  const prefix=storePrefix+type+'/';
  return Object.keys(localStorage).filter(k=>k.startsWith(prefix)).map(k=>[k.slice(prefix.length),JSON.parse(localStorage.getItem(k))]);
}
function secret() {return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')}
function link(path) {
  const url=new URL(location.href);url.searchParams.set('view','weighting');url.hash=path;return url.href;
}
function go(path,replace=false) {
  history[replace?'replaceState':'pushState'](null,'',link(path));
  draw();window.scrollTo({top:0,behavior:'instant'});
}
function panel() { const id=stored('active');return id?stored('panel/'+id):null }
function activate(p) {
  const old=stored('panel/'+p.panel);
  keep('panel/'+p.panel,{...old,...p});keep('active',p.panel);
}
async function rpc(operation,args={}) {
  const {data,error}=await service.requestRpc('bamco_weighting',{operation,args});
  if(error)throw Object.assign(new Error(error.message||''),{code:error.code});
  return data;
}
function errorKey(e) {return e.code==='40001'?'conflict':e.code==='42501'?'denied':'fail'}
function errorBox(parent,error,fn) {
  const box=el('div',null,'bw-status');box.setAttribute('role','alert');box.append(el('p',tr(errorKey(error))));
  if(fn)box.append(action(tr(error.code==='40001'?'openLatest':'retry'),fn));
  parent.append(box);
}
function header(title,back,controls=[]) {
  const head=el('div',null,'bw-page-head'),titleBlock=el('div',null,'bw-page-title');
  titleBlock.append(el('h1',title,'gate-title welcome-title'));
  const divider=el('div',null,'welcome-divider');divider.setAttribute('aria-hidden','true');divider.append(el('i'),el('i'),el('i'));
  titleBlock.append(divider);
  const backButton=action(tr('back'),back,'assessment-action assessment-back-action bw-back');backButton.prepend(icon('back'));
  const actions=el('div',null,'bw-head-actions');actions.append(...controls);
  head.append(backButton,titleBlock,actions);host.replaceChildren(head);
}
function reportStatus(parent,msg,style='bw-status') {const p=el('p',msg,style);p.setAttribute('role','status');parent.append(p);return p}
function emptyState(section,message){
  const box=el('div',null,'bw-empty'),art=icon(section,'0 0 160 128');
  box.append(art);reportStatus(box,tr(message),'bw-empty-copy');host.append(box);
}
function copyButton(label,path) {
  const wrap=el('div',null,'bw-copy');const b=action(tr(label),async()=>{
    const url=link(path);wrap.querySelectorAll('input,small').forEach(n=>n.remove());
    try {await navigator.clipboard.writeText(url);wrap.append(el('small',tr('copied')))}
    catch {const input=el('input');input.value=url;input.readOnly=true;input.dir='ltr';input.setAttribute('aria-label',tr(label));wrap.append(input);input.select()}
  });wrap.append(b);return wrap;
}
function guide(expanded=false) {
  const copy=window.BAMCO_WEIGHTING_COPY;
  const details=el('details',null,'surface bw-card bw-guide');details.open=expanded;
  const heading=el('summary',tr(0));heading.prepend(stamp('book','apricot'));details.append(heading);
  const body=el('div',null,'bw-prose');
  for(const [key] of Object.entries(copy).filter(([k])=>/^\d+$/.test(k)&&+k>0&&+k<65)){
    const n=+key, tag=[17,31,45].includes(n)?'h2':[19,24,27,36].includes(n)?'h3':'p';
    body.append(el(tag,tr(key)));
    if(n===33)body.append(table([tr('value'),tr('meaning')],copy.scale.map((s,i)=>[num(i+1),s[li]])));
  }
  details.append(body);return details;
}
function table(head,rows) {
  const scroll=el('div',null,'bw-table');const t=el('table');const h=t.createTHead().insertRow();
  for(const s of head){const th=el('th',s);th.scope='col';h.append(th)}
  const body=t.createTBody();for(const row of rows){const r=body.insertRow();for(const value of row)r.insertCell().textContent=value}
  scroll.append(t);return scroll;
}
function overview() {
  header(tr('hub'),service.home);
  const grid=el('div',null,'gate-grid bw-tiles');
  for(const page of ['forms','results']){
    const card=action('',()=>go(page),'gate-card bw-tile');
    card.dataset.tone=page==='forms'?'mint':'violet';
    const illustration=el('span',null,'gate-illustration');
    illustration.setAttribute('aria-hidden','true');
    illustration.append(icon(page,'0 0 160 128'));
    card.setAttribute('aria-label',tr(page));
    card.append(illustration,el('strong',tr(page)),el('span',tr(page+'Action'),'gate-cta'));
    grid.append(card);
  }
  host.append(grid);
}
function management(p) {
  if(!p?.manager||!p.ready)return;
  const card=el('section',null,'surface bw-card bw-access');const title=el('h2',tr('links'));title.prepend(stamp('link','blue'));card.append(title,el('p',tr('inviteHelp')));
  const buttons=el('div',null,'bw-actions');buttons.append(
    copyButton('copyInvite','invite/'+p.panel+'/'+p.invite),
    copyButton('copyManage','manage/'+p.panel+'/'+p.invite+'/'+p.manager)
  );card.append(buttons);host.append(card);
}
async function listForms(v) {
  header(tr('forms'),()=>go(''),[action(tr('create'),()=>go('new'),'assessment-action assessment-create-action')]);
  management(panel());
  const keys=Object.fromEntries(known('edit'));if(!Object.keys(keys).length){emptyState('forms','empty');return}
  const wait=reportStatus(host,tr('load'));
  const rows=await rpc('list',{keys});if(v!==version||!host.isConnected)return;wait.remove();
  if(!rows.length){emptyState('forms','empty');return}
  const grid=el('div',null,'assessment-card-grid bw-grid');
  for(const row of rows){
    const b=action('',()=>go('e/'+row.id),'assessment-row bw-row');b.append(stamp('person'),el('strong',row.name),el('span',num(row.completed)+' / '+num(16)+' · '+tr('groupCount'),'assessment-count'));grid.append(b);
  }host.append(grid);
}
function emptyProfile(){return {name:'',org:'',position:'',experience:'',specialty:[],other:'',familiarity:''}}
function profileUI(rec) {
  const isNew=!rec;
  if(!editing){editingBase=rec?clone(rec.profile):null;editing=clone(rec?.profile||emptyProfile())}
  const data=editing;
  header(tr(isNew?'create':'profile'),()=>go(isNew?'forms':'e/'+rec.id));
  host.append(guide(isNew));
  const form=el('form',null,'surface bw-card');form.append(el('h2',tr(65)),el('h3',tr(67)));
  const fields=el('div',null,'bw-fields');
  for(const key of ['name','org','position']){
    const label=el('label',tr(key)),input=el('input');input.value=data[key]||'';input.required=key==='name';input.maxLength=150;
    input.oninput=()=>data[key]=input.value;label.append(input);fields.append(label);
  }
  form.append(fields);
  for(const [key,options,multiple] of [['experience','years',false],['specialty','fields',true],['familiarity','levels',false]]){
    const set=el('fieldset');set.append(el('legend',tr(key)));
    const optBox=el('div',null,'bw-options');const other=el('input');
    window.BAMCO_WEIGHTING_COPY[options].forEach((option,i)=>{
      const l=el('label');const input=el('input');input.type=multiple?'checkbox':'radio';input.name=key;input.value=String(i);
      input.checked=multiple?(data[key]||[]).includes(i):data[key]===String(i);
      input.onchange=()=>{
        if(multiple){data[key]=[...optBox.querySelectorAll('input:checked')].map(x=>+x.value);other.hidden=!data[key].includes(4)}
        else data[key]=String(i);
      };l.append(input,document.createTextNode(option[li]));optBox.append(l);
    });set.append(optBox);
    if(multiple){other.hidden=!(data.specialty||[]).includes(4);other.maxLength=200;other.value=data.other||'';other.setAttribute('aria-label',window.BAMCO_WEIGHTING_COPY.fields[4][li]);other.oninput=()=>data.other=other.value;set.append(other)}
    form.append(set);
  }
  const save=el('button',tr(isNew?'create':'save'),'assessment-action assessment-create-action');save.type='submit';form.append(save);
  form.onsubmit=async event=>{
    event.preventDefault();if(!data.name.trim()){fields.querySelector('input').focus();return}
    const v=version;save.disabled=true;form.querySelectorAll('.bw-status').forEach(n=>n.remove());
    try{
      let result;
      if(isNew){
        let p=panel();if(!p){p={panel:crypto.randomUUID(),invite:secret(),manager:secret(),ready:false};activate(p)}
        pendingNew ||= {id:crypto.randomUUID(),key:secret()};
        keep('edit/'+pendingNew.id,pendingNew.key);
        result=await rpc('create',{...p,...pendingNew,profile:{...data,name:data.name.trim()}});
        activate({...p,ready:true});
      }else result=await rpc('profile',{...auth(rec.id),profile:data,previous:editingBase});
      if(v===version&&host.isConnected)go('e/'+result.id,true);
    }catch(e){if(v===version&&host.isConnected)errorBox(form,e,e.code==='40001'?()=>{editing=null;draw()}:null)}
    finally{save.disabled=false}
  };host.append(form);
}
function auth(id){return {id,key:stored('edit/'+id)}}
function mark(g,rec){return rec.weights[g]?'done':rec.forms[g]?'draft':'fresh'}
function dossier(rec) {
  const id=rec.id;header(rec.profile.name,()=>go('forms'),[action(tr('profile'),()=>go('e/'+id+'/profile'))]);
  const card=el('section',null,'bw-progress-card'),done=Object.keys(rec.weights).length;
  const ring=el('div',pct(done/16),'bw-progress-ring');ring.style.setProperty('--fill',done/16*100+'%');
  const copy=el('div');copy.append(el('strong',num(done)+' / '+num(16)+' · '+tr('groupCount')),el('p',tr('editHelp')));
  card.append(ring,copy,copyButton('copyEdit','open/'+id+'/'+auth(id).key));
  host.append(card);
  const root='e/'+id,grid=el('div',null,'assessment-card-grid bw-grid bw-chapters');
  const main=action('',()=>go(root+'/g/0'),'assessment-row bw-row');
  main.dataset.tone='mint';main.append(stamp('layers'),el('strong',tr('main')),formStatus(0,rec));
  const sub=action('',()=>go(root+'/sub'),'assessment-row bw-row');
  const count=window.BAMCO_WEIGHTING_CATALOG.filter((_,i)=>rec.weights[i+1]).length;
  sub.dataset.tone='violet';sub.append(stamp('hierarchy','violet'),el('strong',tr('subgroup')),el('span',num(count)+' / '+num(window.BAMCO_WEIGHTING_CATALOG.length)+' · '+tr('groupCount'),'assessment-count'));
  grid.append(main,sub);host.append(grid,guide());
}
function formStatus(g,rec){
  const status=mark(g,rec);
  return el('small',tr(status),'assessment-status bw-state '+status);
}
function subgroups(rec){
  const root='e/'+rec.id;
  header(tr('subgroup'),()=>go(root));
  const grid=el('div',null,'assessment-card-grid bw-grid bw-group-grid');
  for(let g=1;g<=window.BAMCO_WEIGHTING_CATALOG.length;g++){
    const card=action('',()=>go(root+'/g/'+g),'assessment-row bw-row');
    card.append(stamp(groupIcons[g],tones[(g-1)%tones.length]),el('strong',groupTitle(g)),formStatus(g,rec));
    grid.append(card);
  }
  host.append(grid);
}
function newForm(n){return {best:null,worst:null,bo:Array(n).fill(null),ow:Array(n).fill(null)}}
function groupForm(rec,g) {
  const parent='e/'+rec.id+(g===0?'':'/sub');
  const names=items(g), base=rec.forms[g]||null;
  if(!editing){editingBase=base?clone(base):null;editing=clone(base||newForm(names.length))}
  const data=editing;
  const save=action(tr('save'),async()=>{
    const v=version;save.disabled=true;form.inert=true;
    status.replaceChildren();
    try{await rpc('save',{...auth(rec.id),group:g,form:data,previous:editingBase});if(v===version&&host.isConnected)go(parent,true)}
    catch(e){if(v===version&&host.isConnected)errorBox(status,e,e.code==='40001'?()=>{editing=null;draw()}:null)}
    finally{save.disabled=false;form.inert=false}
  },'assessment-action assessment-create-action');
  header(groupTitle(g),()=>go(parent),[save]);
  const status=el('div');host.append(status,guide());
  if(rec.analyses?.[g]){
    const saved=el('details',null,'surface bw-card bw-guide');
    const heading=el('summary',tr('savedAnalysis'));heading.prepend(stamp('chart','violet'));
    saved.append(heading,individualGroup(g,rec.weights[g],rec.analyses[g]));
    host.append(saved);
  }
  const form=el('div');host.append(form);
  const head=el('section',null,'surface bw-card');head.append(el('h2',tr(81)),el('h3',tr('group')+' · '+groupTitle(g)),el('p',tr(84)),
    table([tr('number'),tr('criterion')],names.map((name,i)=>[num(i+1),name])));form.append(head);
  const stage=el('section',null,'surface bw-card');const stageTitle=el('h2',tr(87));stageTitle.prepend(stamp('balance'));stage.append(stageTitle);form.append(stage);
  const choices=el('div',null,'bw-choices');stage.append(choices);
  const comparisons=el('div');form.append(comparisons);
  const selectors=[];
  function updateComparisons(){
    comparisons.replaceChildren();
    if(data.best===null||data.worst===null){reportStatus(comparisons,tr('blocked'));return}
    const mirrors=[];
    for(const [key,title,desc,help] of [['bo',107,108,109],['ow',117,118,119]]){
      const card=el('section',null,'surface bw-card bw-stage');card.dataset.tone=key==='bo'?'mint':'violet';
      const stageTitle=el('h2',tr(title));stageTitle.prepend(stamp('sliders',card.dataset.tone));
      card.append(stageTitle,el('p',tr(desc)),el('p',tr(help),'bw-hint'));
      const questions=el('div',null,'bw-question-grid');
      names.forEach((name,i)=>{
        const from=key==='bo'?names[data.best]:name,to=key==='bo'?name:names[data.worst];
        const field=el('fieldset',null,'bw-comparison');
        const legend=el('legend'),reference=el('bdi',key.toUpperCase()+num(i+1));
        reference.dir='ltr';
        const question=key==='bo'
          ? 'شاخص بهترین («'+from+'») نسبت به شاخص «'+to+'» چقدر مهم‌تر است؟'
          : 'شاخص «'+from+'» نسبت به شاخص بدترین («'+to+'») چقدر مهم‌تر است؟';
        legend.append(reference,' ',text(question,'How much more important is “'+from+'” than “'+to+'”?','“'+from+'”相对于“'+to+'”有多重要？'));
        field.append(legend);
        const row=el('div',null,'bw-ratings');
        const self=i===(key==='bo'?data.best:data.worst);
        const common=i===(key==='bo'?data.worst:data.best);
        for(let j=1;j<=9;j++){
          const l=el('label'),r=el('input');r.type='radio';r.name=key+'-'+i;r.value=j;r.checked=data[key][i]===j;r.disabled=self;
          r.onchange=()=>{data[key][i]=j;if(common){data.bo[data.worst]=j;data.ow[data.best]=j;for(const m of mirrors)m.checked=+m.value===j}};
          if(common)mirrors.push(r);
          l.append(r,el('span',num(j)));row.append(l);
        }field.append(row);questions.append(field);
      });card.append(questions);comparisons.append(card);
    }
  }
  function syncAnchors(){
    for(const [key,i,r] of selectors){r.checked=data[key]===i;r.disabled=data[key==='best'?'worst':'best']===i}
    updateComparisons();
  }
  for(const [key,title] of [['best',88],['worst',95]]){
    const set=el('fieldset');set.append(el('legend',tr(title)));
    names.forEach((name,i)=>{
      const l=el('label'),r=el('input');r.type='radio';r.name=key;r.value=i;
      r.onchange=()=>{
        data[key]=i;
        // Judgments are relative to their anchor. Keep only comparisons whose pair is unchanged.
        if(key==='best'){data.bo=Array(names.length).fill(null);data.bo[i]=1;if(data.worst!==null)data.bo[data.worst]=data.ow[i]}
        else {data.ow=Array(names.length).fill(null);data.ow[i]=1;if(data.best!==null)data.ow[data.best]=data.bo[i]}
        syncAnchors();
      };
      selectors.push([key,i,r]);l.append(r,document.createTextNode(name));set.append(l);
    });choices.append(set);
  }syncAnchors();
  const endSave=action(tr('save'),()=>save.click(),'assessment-action assessment-create-action');
  const foot=el('div',null,'assessment-page-toolbar');foot.append(endSave);form.append(foot);
}
const decimal=(number,digits)=>new Intl.NumberFormat(locales[li],{
  minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:false
}).format(number);
function consistencyCards(analysis){
  const cards=el('div',null,'bw-metrics');
  for(const [model,symbol,deviation,ratio] of [
    ['linearModel','ε',analysis.epsilon,analysis.linearCR],['nonlinearModel','ξ',analysis.xi,analysis.nonlinearCR]
  ]){
    const state=deviation<=1e-8?'perfect':ratio<=0.30?'acceptable':'revisit';
    const card=el('section',null,'bw-metric');card.dataset.state=state;
    const title=el('h3',tr(model)),badge=el('span',tr(state),'bw-verdict');
    badge.prepend(icon(state==='revisit'?'alert':'check'));
    const head=el('div',null,'bw-metric-head');head.append(title,badge);
    const values=el('dl');
    for(const [label,value] of [['CR',decimal(ratio,4)],['CI',decimal(analysis.ci,4)],[tr('deviation')+' ('+symbol+')',decimal(deviation,6)]]){
      const pair=el('div');pair.append(el('dt',label),el('dd',value));values.append(pair);
    }
    card.append(head,values);cards.append(card);
  }
  return cards;
}
function reportHighlights(weights){
  const sorted=weights.map((weight,i)=>({weight,i})).sort((a,b)=>b.weight-a.weight);
  const high=sorted[0].weight,leaders=sorted.filter(v=>Math.abs(v.weight-high)<1e-10);
  const feature=el('div',null,'bw-feature');
  const hero=el('section',null,'bw-leader'),copy=el('div',null,'bw-leader-copy');
  const caption=el('span',text('بیشترین وزن در میان شاخص‌های اصلی','Highest main criterion weight','主要指标最高权重'));
  const name=leaders.length===1?groupTitle(leaders[0].i+1):text(num(leaders.length)+' شاخص هم‌وزن',num(leaders.length)+' tied criteria',num(leaders.length)+' 个指标并列');
  copy.append(caption,el('h2',name),el('strong',pct(high),'bw-leader-value'));
  const art=icon('award','0 0 208 152');art.classList.add('bw-award');
  hero.append(copy,art);
  const chart=el('section',null,'bw-chart'),title=el('h2',text('پنج شاخص با بیشترین وزن','Five highest-weight criteria','权重最高的五项指标'));
  title.prepend(stamp('chart','violet'));chart.append(title);
  const list=el('ol');
  for(const [rank,{i,weight}] of sorted.slice(0,5).entries()){
    const row=el('li');row.dataset.tone=tones[rank];
    const name=el('span',groupTitle(i+1)),value=el('bdi',pct(weight));
    const track=el('span',null,'bw-bar');track.setAttribute('aria-hidden','true');
    const fill=el('i');fill.style.width=(high?100*weight/high:0)+'%';track.append(fill);
    row.append(name,value,track);list.append(row);
  }
  chart.append(list);feature.append(hero,chart);return feature;
}
function individualGroup(g,weights,analysis,parentWeight){
  const names=items(g),content=el('div');
  const ranked=names.map((name,i)=>({name,i})).sort((a,b)=>weights[b.i]-weights[a.i]);
  const headings=[tr('rank'),tr(g===0?'main':'subgroup'),tr('point')];
  if(parentWeight!=null)headings.push(tr('overall'));
  if(analysis)content.append(consistencyCards(analysis));
  const rankedTable=table(headings,ranked.map(({name,i},rank)=>{
    const row=[num(rank+1),name,decimal(weights[i],6)];
    if(parentWeight!=null)row.push(pct(parentWeight*weights[i]));
    return row;
  }));rankedTable.classList.add('bw-ranked');content.append(rankedTable);
  if(!analysis)return content;
  const bounds=analysis.intervals.map(([lower,upper],i)=>({
    name:names[i],lower,upper,center:(lower+upper)/2,halfWidth:(upper-lower)/2
  })).sort((a,b)=>b.center-a.center);
  const section=el('details',null,'bw-result bw-intervals');
  section.append(el('summary',tr('intervalResults')),el('p',tr('intervalHelp')),
    table([tr('rank'),tr(g===0?'main':'subgroup'),tr('lower'),tr('upper'),tr('center'),tr('halfWidth')],
      bounds.map((v,i)=>[num(i+1),v.name,...[v.lower,v.upper,v.center,v.halfWidth].map(x=>decimal(x,4))])));
  content.append(section);
  return content;
}
function showWeights(rows,combined) {
  const box=el('section',null,'bw-card bw-report');
  const weights=Array.from({length:16},(_,g)=>items(g).map((_,j)=>rows.reduce((s,r)=>s+Number(r.weights[g][j]),0)/rows.length));
  const main=el('section',null,'bw-report-section'),groups=el('section',null,'bw-report-section');
  const mainTitle=el('h2',tr('main')),groupsTitle=el('h2',tr('subgroup'));
  mainTitle.prepend(stamp('layers'));groupsTitle.prepend(stamp('hierarchy','violet'));
  main.append(mainTitle,el('p',tr(combined?'aggregateNote':'individualNote'),'bw-report-note'));groups.append(groupsTitle);
  box.append(reportHighlights(weights[0]),main,groups);
  for(let g=0;g<weights.length;g++){
    const parent=g===0?null:weights[0][g-1];
    let body;
    if(!combined)body=individualGroup(g,weights[g],rows[0].analyses?.[g],parent);
    else if(g===0)body=table([tr('main'),tr('weight')],items(0).map((name,i)=>[name,pct(weights[0][i])]));
    else body=table([tr('subgroup'),tr('local'),tr('overall')],items(g).map((name,i)=>[name,pct(weights[g][i]),pct(parent*weights[g][i])]));
    if(g===0)main.append(body);
    else{
      const section=el('details',null,'bw-result'),summary=el('summary',groupTitle(g));
      summary.prepend(stamp(groupIcons[g],tones[(g-1)%tones.length]));section.append(summary,body);groups.append(section);
    }
  }
  return box;
}
async function results(v){
  header(tr('results'),()=>go(''));
  let rows;
  const current=panel();
  const panels=known('panel').map(([,p])=>p).filter(p=>p.manager&&p.ready);
  const scopes=panels.map((p,i)=>({value:p.panel,label:tr('department')+' '+num(i+1)}));
  if(known('edit').length)scopes.push({value:'mine',label:text('پرسش‌نامه‌های من','My questionnaires','我的问卷')});
  if(!scopes.some(s=>s.value===selectedScope))selectedScope=current?.manager&&current.ready?current.panel:scopes[0]?.value;
  const p=panels.find(p=>p.panel===selectedScope);
  const filters=el('div',null,'bw-filters');host.append(filters);
  if(scopes.length>1){
    const label=el('label',tr('department'),'surface bw-filter'),sel=el('select');
    for(const s of scopes){const o=el('option',s.label);o.value=s.value;sel.append(o)}
    sel.value=selectedScope;sel.onchange=()=>{selectedScope=sel.value;selectedResult=null;draw()};label.append(sel);filters.append(label);
  }
  const wait=reportStatus(host,tr('load'));
  if(p?.manager&&p.ready)rows=await rpc('results',{panel:p.panel,manager:p.manager});
  else{
    const keys=Object.fromEntries(known('edit'));
    const list=Object.keys(keys).length?await rpc('list',{keys}):[];
    const mine=await Promise.all(list.filter(r=>r.completed===16).map(r=>rpc('open',auth(r.id))));
    rows=mine.map(r=>({name:r.profile.name,respondent:r.respondent,weights:r.weights,analyses:r.analyses}));
  }
  if(v!==version||!host.isConnected)return;wait.remove();
  if(!rows.length){emptyState('results','noResults');return}
  const label=el('label',tr('analysis'),'surface bw-filter'),select=el('select');
  function option(value,name){const o=el('option',name);o.value=value;select.append(o)}
  if(p?.manager&&p.ready)option('all',tr('all')+' ('+num(rows.length)+')');
  for(const r of rows)option(String(r.respondent),r.name+' · '+tr('respondent')+' '+num(r.respondent));
  if([...select.options].some(o=>o.value===selectedResult))select.value=selectedResult;
  label.append(select);filters.append(label);const content=el('div');host.append(content);
  select.onchange=()=>{selectedResult=select.value;const all=selectedResult==='all';
    content.replaceChildren(showWeights(all?rows:rows.filter(r=>String(r.respondent)===selectedResult),all))};
  select.onchange();
}
function consume(route) {
  const [kind,id,key,manager]=route.split('/');
  if(!['open','invite','manage'].includes(kind))return route;
  if(!uuid.test(id)||!token.test(key)||(kind==='manage'&&!token.test(manager)))throw Object.assign(new Error(),{code:'42501'});
  let next;
  if(kind==='open'){keep('edit/'+id,key);next='e/'+id}
  else{const p={panel:id,invite:key,ready:true};if(kind==='manage')p.manager=manager;activate(p);next=kind==='manage'?'results':'new'}
  activeRoute=null;history.replaceState(null,'',link(next));return next;
}
async function draw(){
  const v=++version;
  try{
    const route=consume(location.hash.slice(1));
    if(route!==activeRoute){editing=null;pendingNew=null;selectedResult=null;selectedScope=null;activeRoute=route}
    if(!route)return overview();
    if(route==='forms')return await listForms(v);
    if(route==='new')return profileUI(null);
    if(route==='results')return await results(v);
    const [kind,id,section,index]=route.split('/');
    if(kind!=='e'||!uuid.test(id))return go('',true);
    header(tr('forms'),()=>go('forms'));reportStatus(host,tr('load'));
    const rec=await rpc('open',auth(id));if(v!==version||!host.isConnected)return;
    if(section==='profile')profileUI(rec);
    else if(section==='sub')subgroups(rec);
    else if(section==='g'&&/^(?:[0-9]|1[0-5])$/.test(index))groupForm(rec,+index);
    else dossier(rec);
  }catch(e){if(v===version&&host.isConnected){header(tr('forms'),()=>go(''));errorBox(host,e,()=>{editing=null;draw()})}}
}
window.BAMCO_WEIGHTING={mount(container,options){
  host=container;service=options;language=options.language;li=['fa','en','zh'].indexOf(language);
  try{localStorage.setItem(storePrefix+'check','1');localStorage.removeItem(storePrefix+'check')}
  catch{header(tr('hub'),service.home);reportStatus(host,tr('storage'));return}
  draw();
}};
})();
