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
  noResults:['پس از تکمیل هر ۱۶ فرم، نتیجهٔ ارزیاب اینجا نمایش داده می‌شود.','An evaluator’s results appear here after all 16 forms are complete.','评估员完成全部16份问卷后，此处将显示其结果。'],
  main:['شاخص‌های اصلی','Main criteria','主要指标'], subgroup:['زیرشاخص‌ها','Subcriteria','子指标'],
  group:['گروه شاخص','Criterion group','指标组'], criterion:['شاخص','Criterion','指标'],
  number:['ردیف','No.','序号'], value:['مقدار','Value','数值'], meaning:['مفهوم','Meaning','含义'],
  done:['تکمیل‌شده','Complete','已完成'], draft:['در حال تکمیل','In progress','填写中'], fresh:['شروع نشده','Not started','未开始'],
  respondent:['ارزیاب','Evaluator','评估员'], profile:['ویرایش مشخصات ارزیاب','Edit evaluator details','编辑评估员信息'],
  copyEdit:['کپی پیوند خصوصی ادامهٔ پاسخ‌دهی','Copy private edit link','复制个人续填链接'],
  copyInvite:['کپی دعوت‌نامه برای ارزیاب جدید','Copy invitation for a new evaluator','复制新评估员邀请链接'],
  copyManage:['کپی پیوند خصوصی مدیریت نتایج','Copy private results management link','复制结果管理专用链接'],
  copied:['پیوند کپی شد.','Link copied.','链接已复制。'], choose:['انتخاب کنید','Select','请选择'],
  all:['تجمیع همهٔ ارزیابان','All evaluators combined','汇总所有评估员'],
  overall:['وزن نهایی در کل ارزیابی','Overall weight','总权重'], local:['وزن در گروه','Weight within group','组内权重'],
  weight:['وزن شاخص اصلی','Main criterion weight','主要指标权重'], analysis:['نمایش نتیجه','Show results for','选择结果'],
  aggregateNote:['هر ارزیابِ دارای ۱۶ فرم کامل سهم یکسانی دارد. وزن‌های اصلی و وزن‌های درون هر گروه جداگانه میانگین‌گیری می‌شوند. وزن نهایی هر زیرشاخص حاصل‌ضرب وزن گروه در وزن درون‌گروهی آن است.','Each evaluator with 16 completed forms has equal weight. Main and within-group weights are averaged separately. An overall subcriterion weight is the product of its main and within-group weights.','完成全部16份问卷的评估员等权参与汇总。分别计算主要指标和组内权重的平均值。子指标总权重等于所属主要指标权重乘以组内权重。'],
  individualNote:['وزن‌ها با مدل خطی بهترین–بدترین محاسبه شده‌اند. وزن نهایی هر زیرشاخص حاصل‌ضرب وزن شاخص اصلی در وزن آن زیرشاخص در گروه است.','Weights use the linear Best–Worst Method. Overall subcriterion weight equals main criterion weight times within-group weight.','采用线性最佳–最差法计算权重。子指标总权重等于所属主要指标权重乘以组内权重。'],
  links:['دسترسی ارزیابان','Evaluator access','评估员访问'],
  inviteHelp:['برای جمع‌آوری پاسخ‌ها در همین گروه، دعوت‌نامه را برای ارزیابان بفرستید. هر نفر با آن یک مجموعهٔ مستقل ایجاد می‌کند. پیوند خصوصی مدیریت، نتایج همهٔ افراد این گروه را باز می‌کند.','Send the invitation to collect responses in this group. Each evaluator creates their own set. The private management link opens results for the whole group.','发送邀请以在本组收集答卷。每位评估员独立创建一套问卷。管理专用链接可查看本组所有结果。'],
  editHelp:['برای ادامه در دستگاه دیگر، پیوند خصوصی همین ارزیاب را نگه دارید.','Keep this evaluator’s private link to continue on a different device.','请保留此评估员的专用链接，以便在其他设备上续填。'],
  blocked:['ابتدا مهم‌ترین و کم‌اهمیت‌ترین شاخص را انتخاب کنید.','First select the most and least important criteria.','请先选择最重要和最不重要的指标。'],
  detail:['مشاهده زیرشاخص‌ها','View subcriteria','查看子指标'], start:['شروع پاسخ‌دهی','Start answering','开始填写'],
  groupCount:['فرم تکمیل‌شده','forms completed','份问卷已完成'], department:['مجموعهٔ ارزیابان','Evaluator group','评估组'],
  openLatest:['باز کردن نسخهٔ ذخیره‌شده','Open saved version','打开已保存版本']
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
  host.replaceChildren(el('h1',title,'gate-title welcome-title'));
  const divider=el('div',null,'welcome-divider');divider.setAttribute('aria-hidden','true');divider.append(el('i'),el('i'),el('i'));
  const bar=el('div',null,'bw-bar');bar.append(action(tr('back'),back,'assessment-action assessment-back-action'),...controls);
  host.append(divider,bar);
}
function reportStatus(parent,msg) {const p=el('p',msg,'bw-status');p.setAttribute('role','status');parent.append(p);return p}
function copyButton(label,path) {
  const wrap=el('div',null,'bw-copy');const b=action(tr(label),async()=>{
    const url=link(path);wrap.querySelectorAll('input,small').forEach(n=>n.remove());
    try {await navigator.clipboard.writeText(url);wrap.append(el('small',tr('copied')))}
    catch {const input=el('input');input.value=url;input.readOnly=true;input.dir='ltr';input.setAttribute('aria-label',tr(label));wrap.append(input);input.select()}
  });wrap.append(b);return wrap;
}
function guide(expanded=false) {
  const copy=window.BAMCO_WEIGHTING_COPY;
  const details=el('details',null,'bw-card bw-guide');details.open=expanded;
  details.append(el('summary',tr(0)));
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
function tiles(parent,options) {
  const grid=el('div',null,'bw-tiles');
  for(const [label,icon,path] of options){
    const b=action('',()=>go(path),'bw-tile');const symbol=el('span',icon,'bw-symbol');symbol.setAttribute('aria-hidden','true');
    b.append(symbol,el('strong',tr(label)));grid.append(b);
  }parent.append(grid);
}
function overview() {header(tr('hub'),service.home);tiles(host,[['forms','📝','forms'],['results','📊','results']])}
function management(p) {
  if(!p?.manager||!p.ready)return;
  const card=el('section',null,'bw-card');card.append(el('h2',tr('links')),el('p',tr('inviteHelp')));
  const buttons=el('div',null,'bw-actions');buttons.append(
    copyButton('copyInvite','invite/'+p.panel+'/'+p.invite),
    copyButton('copyManage','manage/'+p.panel+'/'+p.invite+'/'+p.manager)
  );card.append(buttons);host.append(card);
}
async function listForms(v) {
  header(tr('forms'),()=>go(''),[action(tr('create'),()=>go('new'),'assessment-action bw-primary')]);
  management(panel());
  const keys=Object.fromEntries(known('edit'));if(!Object.keys(keys).length){reportStatus(host,tr('empty'));return}
  const wait=reportStatus(host,tr('load'));
  const rows=await rpc('list',{keys});if(v!==version||!host.isConnected)return;wait.remove();
  if(!rows.length){reportStatus(host,tr('empty'));return}
  const grid=el('div',null,'bw-grid');
  for(const row of rows){
    const b=action('',()=>go('e/'+row.id),'bw-row');b.append(el('strong',row.name),el('span',num(row.completed)+' / '+num(16)+' · '+tr('groupCount')));grid.append(b);
  }host.append(grid);
}
function emptyProfile(){return {name:'',org:'',position:'',experience:'',specialty:[],other:'',familiarity:''}}
function profileUI(rec) {
  const isNew=!rec;
  if(!editing){editingBase=rec?clone(rec.profile):null;editing=clone(rec?.profile||emptyProfile())}
  const data=editing;
  header(tr(isNew?'create':'profile'),()=>go(isNew?'forms':'e/'+rec.id));
  host.append(guide(isNew));
  const form=el('form',null,'bw-card');form.append(el('h2',tr(65)),el('h3',tr(67)));
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
  const save=el('button',tr(isNew?'create':'save'),'assessment-action bw-primary');save.type='submit';form.append(save);
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
  const card=el('section',null,'bw-card');
  card.append(el('strong',num(Object.keys(rec.weights).length)+' / '+num(16)+' · '+tr('groupCount')),
    el('p',tr('editHelp')),copyButton('copyEdit','open/'+id+'/'+auth(id).key));
  host.append(card,guide());
  const grid=el('div',null,'bw-grid');
  for(let g=0;g<16;g++){
    const s=mark(g,rec);const b=action('',()=>go('e/'+id+'/g/'+g),'bw-row');
    b.append(el('span',num(g+1),'bw-index'),el('strong',groupTitle(g)),el('small',tr(s),'bw-state '+s));grid.append(b);
  }host.append(grid);
}
function newForm(n){return {best:null,worst:null,bo:Array(n).fill(null),ow:Array(n).fill(null)}}
function groupForm(rec,g) {
  const names=items(g), base=rec.forms[g]||null;
  if(!editing){editingBase=base?clone(base):null;editing=clone(base||newForm(names.length))}
  const data=editing;
  const save=action(tr('save'),async()=>{
    const v=version;save.disabled=true;form.inert=true;
    status.replaceChildren();
    try{await rpc('save',{...auth(rec.id),group:g,form:data,previous:editingBase});if(v===version&&host.isConnected)go('e/'+rec.id,true)}
    catch(e){if(v===version&&host.isConnected)errorBox(status,e,e.code==='40001'?()=>{editing=null;draw()}:null)}
    finally{save.disabled=false;form.inert=false}
  },'assessment-action bw-primary');
  header(groupTitle(g),()=>go('e/'+rec.id),[save]);
  const status=el('div');host.append(status,guide());
  const form=el('div');host.append(form);
  const head=el('section',null,'bw-card');head.append(el('h2',tr(81)),el('h3',tr('group')+' · '+groupTitle(g)),el('p',tr(84)),
    table([tr('number'),tr('criterion')],names.map((name,i)=>[num(i+1),name])));form.append(head);
  const stage=el('section',null,'bw-card');stage.append(el('h2',tr(87)));form.append(stage);
  const choices=el('div',null,'bw-choices');stage.append(choices);
  const comparisons=el('div');form.append(comparisons);
  const selectors=[];
  function updateComparisons(){
    comparisons.replaceChildren();
    if(data.best===null||data.worst===null){reportStatus(comparisons,tr('blocked'));return}
    const mirrors=[];
    for(const [key,title,desc,help] of [['bo',107,108,109],['ow',117,118,119]]){
      const card=el('section',null,'bw-card');card.append(el('h2',tr(title)),el('p',tr(desc)),el('p',tr(help),'bw-hint'));
      names.forEach((name,i)=>{
        const from=key==='bo'?names[data.best]:name,to=key==='bo'?name:names[data.worst];
        const field=el('fieldset',null,'bw-comparison');
        const legend=el('legend'),reference=el('bdi',key.toUpperCase()+num(i+1)+')');
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
        }field.append(row);card.append(field);
      });comparisons.append(card);
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
  const endSave=action(tr('save'),()=>save.click(),'assessment-action bw-primary');
  const foot=el('div',null,'bw-bar');foot.append(endSave);form.append(foot);
}
function showWeights(rows,combined) {
  const weights=Array.from({length:16},(_,g)=>items(g).map((_,j)=>rows.reduce((s,r)=>s+Number(r.weights[g][j]),0)/rows.length));
  const box=el('section',null,'bw-card');
  box.append(el('p',tr(combined?'aggregateNote':'individualNote')),table([tr('main'),tr('weight')],items(0).map((name,i)=>[name,pct(weights[0][i])])));
  for(let g=1;g<16;g++){
    const section=el('details',null,'bw-result');section.append(el('summary',groupTitle(g)),table([tr('subgroup'),tr('local'),tr('overall')],items(g).map((name,i)=>[name,pct(weights[g][i]),pct(weights[0][g-1]*weights[g][i])])));
    box.append(section);
  }return box;
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
  if(scopes.length>1){
    const label=el('label',tr('department'),'bw-filter'),sel=el('select');
    for(const s of scopes){const o=el('option',s.label);o.value=s.value;sel.append(o)}
    sel.value=selectedScope;sel.onchange=()=>{selectedScope=sel.value;selectedResult=null;draw()};label.append(sel);host.append(label);
  }
  const wait=reportStatus(host,tr('load'));
  if(p?.manager&&p.ready)rows=await rpc('results',{panel:p.panel,manager:p.manager});
  else{
    const keys=Object.fromEntries(known('edit'));
    const list=Object.keys(keys).length?await rpc('list',{keys}):[];
    const mine=await Promise.all(list.filter(r=>r.completed===16).map(r=>rpc('open',auth(r.id))));
    rows=mine.map(r=>({name:r.profile.name,respondent:r.respondent,weights:r.weights}));
  }
  if(v!==version||!host.isConnected)return;wait.remove();
  if(!rows.length){reportStatus(host,tr('noResults'));return}
  const label=el('label',tr('analysis'),'bw-filter'),select=el('select');
  function option(value,name){const o=el('option',name);o.value=value;select.append(o)}
  if(p?.manager&&p.ready)option('all',tr('all')+' ('+num(rows.length)+')');
  for(const r of rows)option(String(r.respondent),r.name+' · '+tr('respondent')+' '+num(r.respondent));
  if([...select.options].some(o=>o.value===selectedResult))select.value=selectedResult;
  label.append(select);const content=el('div');host.append(label,content);
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
