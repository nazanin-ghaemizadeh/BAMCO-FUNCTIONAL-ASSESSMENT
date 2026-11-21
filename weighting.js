(() => {
'use strict';
const words = {
  hub:['وزن‌دهی','Weighting','权重设置'], forms:['پرسش‌نامه','Questionnaires','问卷'],
  results:['نتایج وزن‌دهی','Weighting results','权重结果'], back:['بازگشت','Back','返回'],
  create:['ایجاد پرسش‌نامه','Create questionnaire','创建问卷'], save:['ذخیره','Save','保存'],
  saved:['ذخیره شد.','Saved.','已保存。'], retry:['تلاش مجدد','Retry','重试'],
  load:['در حال دریافت…','Loading…','正在加载…'], fail:['ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.','Could not reach the service. Please try again.','无法连接服务，请重试。'],
  conflict:['این فرم در جای دیگری تغییر کرده است. برای دیدن آخرین نسخه، دوباره آن را باز کنید.','This form changed elsewhere. Reopen it to see the saved version.','此问卷已在其他位置更改，请重新打开以查看已保存版本。'],
  denied:['این پرسش‌نامه در دسترس نیست.','This questionnaire is unavailable.','此问卷不可用。'],
  storage:['برای ثبت پرسش‌نامه، ذخیره‌سازی مرورگر را فعال کنید.','Enable browser storage to save questionnaires.','请启用浏览器存储以保存问卷。'],
  empty:['هنوز پرسش‌نامه‌ای در این مرورگر ایجاد یا باز نشده است.','No questionnaires have been created or opened in this browser.','此浏览器尚未创建或打开问卷。'],
  noResults:['هنوز وزنی برای نمایش ثبت نشده است.','No weights have been recorded yet.','暂无已记录的权重。'],
  subgroup:['زیرشاخص‌ها','Subcriteria','子指标'],
  group:['گروه شاخص','Criterion group','指标组'], criterion:['شاخص','Criterion','指标'],
  number:['ردیف','No.','序号'], value:['مقدار','Value','数值'], meaning:['مفهوم','Meaning','含义'],
  done:['تکمیل‌شده','Complete','已完成'], draft:['در حال تکمیل','In progress','填写中'], fresh:['شروع نشده','Not started','未开始'],
  respondent:['ارزیاب','Evaluator','评估员'], profile:['ویرایش مشخصات ارزیاب','Edit evaluator details','编辑评估员信息'],
  all:['تجمیع همه‌ی ارزیابان','All evaluators combined','汇总所有评估员'],
  choose:['انتخاب کنید','Select','请选择'], analysis:['نمایش نتیجه','Show results for','选择结果'],
  blocked:['ابتدا مهم‌ترین و کم‌اهمیت‌ترین شاخص را انتخاب کنید.','First select the most and least important criteria.','请先选择最重要和最不重要的指标。'],
  detail:['مشاهده زیرشاخص‌ها','View subcriteria','查看子指标'], start:['شروع پاسخ‌دهی','Start answering','开始填写'],
  groupCount:['فرم تکمیل‌شده','forms completed','份问卷已完成'], department:['مجموعه‌ی ارزیابان','Evaluator group','评估组'],
  openLatest:['باز کردن نسخه‌ی ذخیره‌شده','Open saved version','打开已保存版本'],
  linearModel:['مدل خطی','Linear model','线性模型'], nonlinearModel:['مدل غیرخطی','Nonlinear model','非线性模型'],
  model:['مدل','Model','模型'], deviation:['انحراف بهینه','Optimal deviation','最优偏差'], verdict:['وضعیت سازگاری','Consistency','一致性'],
  perfect:['کاملاً سازگار','Fully consistent','完全一致'], acceptable:['قابل قبول','Acceptable','可接受'], revisit:['نیازمند بازبینی','Review comparisons','建议复核'],
  intervalResults:['بازه‌های بهینه‌ی مدل غیرخطی','Optimal intervals of the nonlinear model','非线性模型的最优区间'],
  lower:['کران پایین','Lower bound','下界'], upper:['کران بالا','Upper bound','上界'], center:['مرکز بازه','Interval center','区间中心'],
  halfWidth:['نیم‌عرض بازه','Half-width','半宽'], rank:['رتبه','Rank','排名'], point:['وزن خطی','Linear weight','线性权重'],
  savedAnalysis:['نتیجه‌ی آخرین پاسخ‌های ذخیره‌شده','Results of the last saved answers','上次保存的答卷结果'],
  formsAction:['مدیریت پرسش‌نامه‌ها','Manage questionnaires','管理问卷'],
  resultsAction:['مشاهده‌ی وزن زیرشاخص‌ها','View subcriterion weights','查看子指标权重']
};
const legacyPrefix='bamco-bwm-v1:';
let storePrefix=legacyPrefix;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const token=/^[0-9a-f]{64}$/;
const locales=['fa-IR','en-GB','zh-CN'];
let host, service, language, li, activeRoute, version=0, editing, editingBase, pendingNew, selectedResult, selectedGroup;
const clone = x => JSON.parse(JSON.stringify(x));
const tr = k => (words[k] || window.BAMCO_WEIGHTING_COPY[k])[li];
const num = n => Number(n).toLocaleString(locales[li]);
const pct = n => new Intl.NumberFormat(locales[li],{style:'percent',maximumFractionDigits:2}).format(n);
const text = (fa,en,zh) => [fa,en,zh][li];
const groupCount = () => window.BAMCO_WEIGHTING_CATALOG.length;
const groupTitle = i => window.BAMCO_WEIGHTING_CATALOG[i-1].title[li];
const items = i => window.BAMCO_WEIGHTING_CATALOG[i-1].items.map(c=>c[li]);
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
  const heading=el('h1',title,'gate-title welcome-title');
  const divider=el('div',null,'welcome-divider');divider.setAttribute('aria-hidden','true');divider.append(el('i'),el('i'),el('i'));
  const toolbar=el('div',null,'assessment-page-toolbar');
  toolbar.append(action(tr('back'),back,'assessment-action assessment-back-action'),...controls);
  host.replaceChildren(heading,divider,toolbar);
  return toolbar;
}
function reportStatus(parent,msg,style='bw-status') {const p=el('p',msg,style);p.setAttribute('role','status');parent.append(p);return p}
function emptyState(section,message){
  const box=el('div',null,'bw-empty'),art=icon(section,'0 0 160 128');
  box.append(art);reportStatus(box,tr(message),'bw-empty-copy');host.append(box);
}
function groupProgress(completed) {
  const total = groupCount();
  const label = text(
    num(completed)+' از '+num(total)+' گروه تکمیل شده',
    num(completed)+' of '+num(total)+' groups completed',
    '已完成 '+num(completed)+' / '+num(total)+' 组'
  );
  const progress = el('progress');
  progress.max = total;
  progress.value = completed;
  progress.setAttribute('aria-label', label);
  const block = el('div', null, 'bw-group-progress');
  block.append(el('span', label), progress);
  return block;
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

    const illustration=el('span',null,'gate-illustration');
    illustration.setAttribute('aria-hidden','true');
    illustration.append(icon(page,'0 0 160 128'));
    card.setAttribute('aria-label',tr(page));
    card.append(illustration,el('strong',tr(page)),el('span',tr(page+'Action'),'gate-cta'));
    grid.append(card);
  }
  host.append(grid);
}
async function listForms(v) {
  const create = action(text('ایجاد پرسش‌نامه جدید','Create new questionnaire','创建新问卷'), () => go('new'), 'assessment-action assessment-create-action bw-new-form');
  header(tr('forms'),()=>go(''),[create]);
  const keys=Object.fromEntries(known('edit'));
  const wait=reportStatus(host,tr('load'));
  const rows=Object.keys(keys).length?await rpc('list_subcriteria',{keys}):[];
  if(v!==version||!host.isConnected)return;
  wait.remove();
  if(!rows.length){emptyState('forms','empty');return}
  const list=el('section',null,'assessment-list-section'),listHeading=el('div',null,'assessment-list-heading');
  listHeading.append(el('h2',text('پرسش‌نامه‌ها','Questionnaires','问卷列表')),el('span',num(rows.length),'assessment-count'));
  const grid=el('div',null,'assessment-card-grid'+(rows.length===1?' is-single':''));
  for(const row of rows){
    const item=el('article',null,'surface assessment-row bw-form-card');
    const title=el('div',null,'bw-form-heading');
    const name=el('h3',null,'bw-form-name');
    name.append(el('bdi',row.name));
    const complete=row.completed===groupCount();
    title.append(stamp('person'),name,el('span',tr(complete?'done':'draft'),'assessment-status '+(complete?'is-completed':'is-active')));
    const actions=el('div',null,'assessment-row-actions bw-row-actions');
    const open=action(text('باز کردن','Open','打开'),()=>go('e/'+row.id),'assessment-action assessment-open-action');
    const edit=action(text('ویرایش','Edit','编辑'),()=>go('e/'+row.id+'/profile'),'assessment-action assessment-secondary-action');
    edit.title=tr('profile');
    const remove=action(text('حذف','Delete','删除'),async()=>{
      if(!window.confirm(text('پرسش‌نامه‌ی «'+row.name+'» و پاسخ‌های آن حذف شوند؟','Delete the questionnaire and answers for “'+row.name+'”?','删除“'+row.name+'”的问卷及答卷？')))return;
      remove.disabled=true;
      try{
        await rpc('delete',{...auth(row.id),revision:row.revision});
        localStorage.removeItem(storePrefix+'edit/'+row.id);
        if(v===version&&host.isConnected)await draw();
      }catch(e){
        if(v===version&&host.isConnected){item.querySelector('[role=alert]')?.remove();errorBox(item,e,()=>draw())}
      }finally{remove.disabled=false}
    },'assessment-action assessment-delete-action');
    actions.append(open,edit,remove);item.append(title,groupProgress(row.completed),actions);grid.append(item);
  }
  list.append(listHeading,grid);host.append(list);
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
  const count=window.BAMCO_WEIGHTING_CATALOG.filter((_,i)=>rec.weights[i+1]).length;
  const section=el('section',null,'assessment-list-section'),heading=el('div',null,'assessment-list-heading');
  heading.append(el('h2',tr('subgroup')),groupProgress(count));
  const grid=el('div',null,'gate-grid three bw-groups');
  for(let g=1;g<=groupCount();g++){
    const card=action('',()=>go('e/'+rec.id+'/g/'+g),'gate-card bw-group-tile');
    const art=el('span',null,'gate-illustration');art.append(stamp(groupIcons[g],tones[(g-1)%tones.length]));
    card.append(art,el('strong',groupTitle(g)),el('span',tr(mark(g,rec)),'gate-cta'));grid.append(card);
  }
  section.append(heading,grid);host.append(section,guide());
}
function newForm(n){return {best:null,worst:null,bo:Array(n).fill(null),ow:Array(n).fill(null)}}
function groupForm(rec,g) {
  const parent='e/'+rec.id;
  const names=items(g), base=rec.forms[g]||null;
  if(!editing){editingBase=base?clone(base):null;editing=clone(base||newForm(names.length))}
  const data=editing;
  const save=action(tr('save'),async()=>{
    const v=version;save.disabled=true;form.inert=true;
    status.replaceChildren();
    try{await rpc('save_subcriteria',{...auth(rec.id),group:g,form:data,previous:editingBase});if(v===version&&host.isConnected)go(parent,true)}
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
  const group=window.BAMCO_WEIGHTING_CATALOG[g-1];
  const introduction=table(
    [tr('number'),text('زیرشاخص','Subcriterion','子指标'),text('تعریف','Definition','定义')],
    group.items.map((item,i)=>[num(i+1),names[i],group.definitions[item[0]][li]])
  );
  introduction.classList.add('bw-definitions');
  const head=el('section',null,'surface bw-card');
  head.append(el('h2',tr(81)),el('h3',tr('group')+' · '+groupTitle(g)),el('p',tr(84)),introduction);
  form.append(head);
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
const sectorColors=['#388478','#a17bc1','#e3aa60','#678fc3','#d48399','#53979b',
  '#a9ae65','#af8190','#5979a2','#d19470','#7f88b6','#78a183',
  '#bf7977','#648fba','#b6a35a','#82749c','#55998c','#bd8f64',
  '#9f7795','#729aaf','#8a9c6a','#aa8270'];
function weightChart(g,weights,onSelect){
  const names=items(g),ranked=weights.map((weight,index)=>({weight,index})).sort((a,b)=>b.weight-a.weight);
  const chart=el('div',null,'bw-pie-layout'),figure=el('div',null,'bw-pie-figure');
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 240 258');svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(ns,'defs');svg.append(defs);
  const depth=document.createElementNS(ns,'g'),surface=document.createElementNS(ns,'g'),numbers=document.createElementNS(ns,'g');
  depth.setAttribute('class','bw-pie-depth');surface.setAttribute('class','bw-pie-surface');
  svg.append(depth,surface,numbers);
  const center=el('div',null,'bw-pie-center'),centerValue=el('strong'),centerNumber=el('span');
  center.append(centerValue,centerNumber);figure.append(svg,center);
  const legend=el('ol',null,'bw-pie-legend'),buttons=[],sectors=[];
  function select(i){
    buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    sectors.forEach((p,j)=>p.classList.toggle('is-selected',j===i));
    centerValue.textContent=pct(weights[i]);centerNumber.textContent=text('زیرشاخص','Subcriterion','子指标')+' '+num(i+1);
    figure.style.setProperty('--slice-color',sectorColors[i]);
    onSelect?.(i);
  }
  const total=weights.reduce((sum,w)=>sum+w,0);let angle=-Math.PI/2;
  const point=(radius,a)=>[120+radius*Math.cos(a),120+radius*Math.sin(a)].join(' ');
  for(const [position,{weight,index}] of ranked.entries()){
    const span=2*Math.PI*weight/total,end=angle+Math.min(span,2*Math.PI-1e-7),large=span>Math.PI?1:0;
    const color=sectorColors[index],sector=document.createElementNS(ns,'path');
    const path='M'+point(114,angle)+' A114 114 0 '+large+' 1 '+point(114,end)
      +' L'+point(66,end)+' A66 66 0 '+large+' 0 '+point(66,angle)+' Z';
    const gradient=document.createElementNS(ns,'linearGradient');
    gradient.id='bw-sector-'+g+'-'+index;
    gradient.setAttribute('x2','85%');gradient.setAttribute('y2','100%');
    for(const [offset,shade] of [['0%','color-mix(in srgb,'+color+' 58%,white)'],['38%',color],['100%','color-mix(in srgb,'+color+' 80%,#183c38)']]){
      const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);
      stop.setAttribute('stop-color',shade);gradient.append(stop);
    }
    defs.append(gradient);
    sector.setAttribute('d',path);sector.setAttribute('fill','url(#'+gradient.id+')');
    sector.id='bw-sector-face-'+g+'-'+index;
    for(let layer=10;layer>=1;layer--){
      const side=document.createElementNS(ns,'use');
      side.setAttribute('href','#'+sector.id);side.setAttribute('transform','translate(0 '+layer+')');
      side.style.filter='brightness('+(.64+layer*.018)+')';
      depth.append(side);
    }
    sectors[index]=sector;surface.append(sector);
    const tip=document.createElementNS(ns,'title');tip.textContent=names[index]+' · '+pct(weight);sector.append(tip);
    {
      const radius=span<0.18?(position%2?101:79):91;
      const [x,y]=point(radius,angle+span/2).split(' ');
      const id=document.createElementNS(ns,'text');id.setAttribute('x',x);id.setAttribute('y',y);
      id.textContent=num(index+1);numbers.append(id);
    }
    angle=end;
    sector.onclick=()=>select(index);
    const row=el('li'),b=action('',()=>select(index),'bw-slice-key');
    const number=el('span',num(index+1),'bw-slice-number');number.style.setProperty('--slice-color',color);
    b.append(number,el('span',names[index]),el('bdi',pct(weight)));buttons[index]=b;row.append(b);legend.append(row);
  }
  chart.append(figure,legend);
  select(ranked[0].index);
  return chart;
}
function individualGroup(g,weights,analysis){
  const names=items(g),content=el('div',null,'bw-group-report');
  const detail=el('section',null,'bw-selection'),label=el('h3'),exact=el('span',null,'bw-exact');
  detail.setAttribute('aria-live','polite');detail.append(label,exact);
  const ranges=el('dl',null,'bw-bounds');
  if(analysis)detail.append(ranges);
  const chart=weightChart(g,weights,i=>{
    label.textContent=names[i];exact.textContent=tr('point')+' · '+decimal(weights[i],6);
    if(!analysis)return;
    const [lo,hi]=analysis.intervals[i];
    ranges.replaceChildren();
    for(const [k,value] of [['lower',lo],['upper',hi],['center',(lo+hi)/2],['halfWidth',(hi-lo)/2]]){
      const pair=el('div');pair.append(el('dt',tr(k)),el('dd',decimal(value,4)));ranges.append(pair);
    }
  });
  if(analysis)ranges.before(el('h4',tr('intervalResults')));
  content.append(chart,detail);
  if(analysis)content.append(consistencyCards(analysis));
  return content;
}
function respondentChart(record){
  const layout=el('div',null,'bw-results-layout');
  const sidebar=el('nav',null,'bw-results-sidebar');
  const title=text('شاخص‌های ارزیابی','Assessment criteria','评估指标');
  sidebar.setAttribute('aria-label',title);
  const options=el('div',null,'bw-criterion-options');
  sidebar.append(el('h2',title),options);
  const report=el('section',null,'surface bw-card bw-results-chart');
  const heading=el('h2'),body=el('div');
  heading.id='bw-selected-criterion';
  report.setAttribute('aria-labelledby',heading.id);
  report.append(heading,body);
  const buttons=[];
  function choose(g){
    selectedGroup=g;
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i+1===g)));
    heading.replaceChildren(stamp(groupIcons[g],tones[(g-1)%tones.length]),document.createTextNode(groupTitle(g)));
    body.replaceChildren();
    if(record.weights[g])body.append(weightChart(g,record.weights[g]));
    else reportStatus(body,text('وزن زیرشاخص‌های این گروه هنوز ثبت نشده است.','Weights have not been recorded for this group yet.','该组尚未记录权重。'),'bw-unscored');
  }
  for(let g=1;g<=groupCount();g++){
    const button=action('',()=>choose(g),'bw-criterion');
    const count=el('span',num(items(g).length),'bw-criterion-count');
    count.setAttribute('aria-hidden','true');
    button.dataset.scored=String(Boolean(record.weights[g]));
    button.append(el('span',groupTitle(g)),count);
    buttons.push(button);options.append(button);
  }
  layout.append(sidebar,report);
  choose(selectedGroup || Number(Object.keys(record.weights)[0]));
  return layout;
}
async function results(v){
  const toolbar=header(tr('results'),()=>go(''));
  const wait=reportStatus(host,tr('load'));
  const managers=Object.fromEntries(known('panel').filter(([,p])=>p.ready&&p.manager).map(([id,p])=>[id,p.manager]));
  const rows=await rpc('respondent_results',{managers,keys:Object.fromEntries(known('edit'))});
  if(v!==version||!host.isConnected)return;
  wait.remove();
  if(!rows.length){emptyState('results','noResults');return}
  const filters=el('div',null,'bw-respondent-filter');
  const label=el('label',tr('respondent'),'bw-filter'),select=el('select');
  for(const row of rows){
    const option=el('option',row.name);
    option.value=row.id;select.append(option);
  }
  if(rows.some(row=>row.id===selectedResult))select.value=selectedResult;
  const content=el('div');
  select.onchange=()=>{
    if(selectedResult!==select.value)selectedGroup=null;
    selectedResult=select.value;
    content.replaceChildren(respondentChart(rows.find(row=>row.id===selectedResult)));
  };
  label.append(select);filters.append(label);toolbar.append(filters);host.append(content);
  select.onchange();
  window.BAMCO_DROPDOWNS?.(filters);
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
    if(route!==activeRoute){editing=null;pendingNew=null;selectedResult=null;selectedGroup=null;activeRoute=route}
    if(!route)return overview();
    if(route==='forms')return await listForms(v);
    if(route==='new')return profileUI(null);
    if(route==='results')return await results(v);
    if(route==='sample')return go('results',true);
    const [kind,id,section,index]=route.split('/');
    if(kind!=='e'||!uuid.test(id))return go('',true);
    header(tr('forms'),()=>go('forms'));reportStatus(host,tr('load'));
    const rec=await rpc('open',auth(id));if(v!==version||!host.isConnected)return;
    if(section==='profile')profileUI(rec);
    else if(section==='g'&&/^(?:[1-9]|1[0-5])$/.test(index))groupForm(rec,+index);
    else if(section==='sub'||section==='g')return go('e/'+id,true);
    else dossier(rec);
  }catch(e){if(v===version&&host.isConnected){header(tr(activeRoute==='results'?'results':'forms'),()=>go(''));errorBox(host,e,()=>{editing=null;draw()})}}
}
window.BAMCO_WEIGHTING={mount(container,options){
  host=container;service=options;language=options.language;li=['fa','en','zh'].indexOf(language);
  try{
    const account=window.BAMCO_PORTAL?.user;
    storePrefix=account?'bamco-bwm-account:'+account.id+':':legacyPrefix;
    if(account?.admin){
      for(const key of Object.keys(localStorage).filter(k=>k.startsWith(legacyPrefix))){
        const target=storePrefix+key.slice(legacyPrefix.length);
        if(localStorage.getItem(target)===null)localStorage.setItem(target,localStorage.getItem(key));
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(storePrefix+'check','1');localStorage.removeItem(storePrefix+'check')
  }
  catch{header(tr('hub'),service.home);reportStatus(host,tr('storage'));return}
  draw();
}};
})();
