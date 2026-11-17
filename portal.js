(() => {
'use strict';
const root='https://cwpfzvcwuiawjtvsnpkq.supabase.co';
const apiKey='sb_publishable_EWHLDNy9MiO26ZqdRYvSxQ_UU9pe3GM';
const key='bamco-functional.auth.v1';
const $=id=>document.getElementById(id);
const words={
 motto1:['کیفیت از','Quality starts with','品质源于'],motto2:['ارزیابی دقیق','precise assessment','精准评估'],motto3:['آغاز می‌شود.','.','。'],
 signIn:['ورود به سامانه','Sign in','登录系统'],email:['نام کاربری (ایمیل)','Username (email)','用户名（电子邮箱）'],password:['رمز عبور','Password','密码'],
 show:['نمایش رمز عبور','Show password','显示密码'],hide:['پنهان کردن رمز عبور','Hide password','隐藏密码'],close:['بستن','Close','关闭'],
 ownPassword:['تغییر رمز من','Change my password','修改我的密码'],currentPassword:['رمز عبور فعلی','Current password','当前密码'],
 newPass:['رمز عبور جدید','New password','新密码'],set:['ذخیره رمز عبور','Save password','保存密码'],
 changed:['رمز عبور شما تغییر کرد.','Your password was changed.','您的密码已修改。'],
 savedPass:['رمز ذخیره شد. اکنون وارد شوید.','Password saved. You can now sign in.','密码已保存，请登录。'],
 loginFailed:['ایمیل یا رمز عبور صحیح نیست.','Incorrect email or password.','邮箱或密码有误。'],forbidden:['این حساب مجوز ورود به سامانه را ندارد.','This account has no portal access.','此账户无权访问此系统。'],
 network:['اتصال به سرویس برقرار نشد. دوباره تلاش کنید.','Could not reach the service. Try again.','无法连接服务，请重试。'],
 limited:['تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.','Too many attempts. Try again shortly.','请求过多，请稍后重试。'],
 out:['خروج','Sign out','退出'],users:['مدیریت کاربران','User management','用户管理'],add:['تعریف کاربر','Add user','添加用户'],edit:['ویرایش','Edit','编辑'],
 view:['نمای کاربر','User view','用户视图'],full:['دسترسی کامل مدیر','Full administrator access','完整管理权限'],name:['نام و نام خانوادگی','Full name','姓名'],
 optional:['رمز جدید (اختیاری)','New password (optional)','新密码（可选）'],save:['ذخیره کاربر','Save user','保存用户'],back:['بازگشت','Back','返回'],
 empty:['هنوز بخشی به این حساب اختصاص داده نشده است.','No sections have been assigned to this account.','此账户尚未分配模块。'],
 error:['ذخیره انجام نشد. اطلاعات را بررسی کنید و دوباره تلاش کنید.','Could not save. Check the form and try again.','保存失败，请检查后重试。'],
 duplicate:['این ایمیل قبلاً ثبت شده است.','This email is already registered.','此邮箱已注册。'],
 main:['بخش‌های اصلی','Main sections','主要模块'],inside:['داخل هر پرونده','Inside each case','档案内模块'],
 accessHint:['برای دسترسی به داخل پرونده، ارزیابی‌های فعال یا تاریخچه را انتخاب کنید. «گزارش و نتایج» شامل داشبورد و نمره‌های ثبت‌شدهٔ همهٔ انواع ارزیابی است.','Select Active assessments or Assessment history for case access. Reports and results includes dashboards and recorded scores across assessment types.','请先选择进行中的评估或评估历史。报告与结果包含各评估类型的仪表板与已记录评分。'],
 active:['ارزیابی‌های فعال','Active assessments','进行中的评估'],history:['تاریخچه ارزیابی‌ها','Assessment history','评估历史'],weighting:['وزن‌دهی','Weighting','权重设置'],observer:['نظارت بر موقعیت مکانی','Location monitoring','位置监控'],
 setup:['مشخصات خودرو','Vehicle specifications','车辆规格'],drive:['قابلیت رانندگی','Drivability','驾驶性能'],durability:['آزمون دوام','Durability testing','耐久试验'],static:['بررسی استاتیک','Static inspection','静态检查'],
 comprehensive:['ارزیابی جامع','Comprehensive assessment','综合评估'],results:['گزارش و نتایج','Reports and results','报告与结果'],
 weak:['رمز باید حداقل ۸ نویسه و حداکثر ۷۲ بایت باشد.','Use at least 8 characters and at most 72 bytes.','密码至少八个字符，最多七十二字节。'],
 wait:['در حال اتصال…','Connecting…','正在连接…'],car:['خودروی خندان در حال ارزیابی','A smiling car being inspected','正在接受检查的微笑汽车']
};
const groups={main:['active','history','weighting','observer'],inside:['setup','drive','durability','static','comprehensive','results']};
let session,profile,refreshing,startWorkspace,lang='fa';
const t=id=>words[id][['fa','en','zh'].indexOf(lang)]||words[id][0];
const can=id=>Boolean(profile&&(profile.admin||profile.grants.includes(id)));
function element(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el}
function button(label,fn,cls='portal-secondary'){const b=element('button',t(label),cls);b.type='button';b.onclick=fn;return b}
function notice(id=''){ $('portalNotice').textContent=id?t(id):''; }
function remember(s){session=s?{access_token:s.access_token,refresh_token:s.refresh_token,until:Date.now()+1000*(s.expires_in||3600)}:null;
 try{if(session)sessionStorage.setItem(key,JSON.stringify(session));else sessionStorage.removeItem(key)}catch{}}
async function request(path,body,token,method='POST'){
 const response=await fetch(root+path,{method,cache:'no-store',headers:{apikey:apiKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json().catch(()=>null);
 if(!response.ok){const e=new Error('Request failed');e.status=response.status;e.code=data?.error||data?.code;throw e}
 return data;
}
function lock(){remember(null);profile=null;$('workspaceMain').hidden=true;$('portalGate').hidden=false;$('portalTools').hidden=true;if($('portalDialog').open)$('portalDialog').close()}
async function token(){
 if(!session)throw Error('No session');
 if(Date.now()+60000<session.until)return session.access_token;
 if(!refreshing){const old=session;refreshing=request('/auth/v1/token?grant_type=refresh_token',{refresh_token:old.refresh_token}).then(s=>{if(session!==old)throw Error('Session changed');remember(s);return session.access_token}).catch(e=>{if(session===old&&[400,401,403].includes(e.status)){lock();location.reload()}throw e}).finally(()=>refreshing=null)}
 return refreshing;
}
async function rpc(name,args={}){try{return {data:await request('/rest/v1/rpc/'+name,args,await token()),error:null}}catch(error){return {data:null,error}}}
function applyLanguage(value){
 lang=value;for(const el of document.querySelectorAll('[data-pt]'))el.textContent=t(el.dataset.pt);
 $('portalClose').setAttribute('aria-label',t('close'));$('portalCar').alt=t('car');$('portalReveal').setAttribute('aria-label',t($('portalPassword').type==='text'?'hide':'show'));
 if(profile)toolsBar();
}
async function authenticate(){
 const p=await request('/rest/v1/rpc/bamco_access_profile',{},await token());
 if(!p||!Array.isArray(p.grants)){lock();throw Object.assign(Error('No portal access'),{accessDenied:true})}
 profile=p;$('portalGate').hidden=true;$('workspaceMain').hidden=false;toolsBar();startWorkspace();
}
function messageFor(e,fallback){if(e.status===429)return 'limited';if(e.accessDenied)return 'forbidden';if(!e.status)return 'network';return fallback}
let checking=false;
async function recheck(){
 if(!profile||checking||document.visibilityState==='hidden')return;
 checking=true;
 try{
  const current=await request('/rest/v1/rpc/bamco_access_profile',{},await token());
  if(!current){lock();location.reload();return}
  if(current.admin!==profile.admin||JSON.stringify(current.grants)!==JSON.stringify(profile.grants)){
    $('workspaceMain').hidden=true;location.reload();
  }
 }catch(e){if(e.status===401||e.status===403){lock();location.reload()}}finally{checking=false}
}
async function signOut(){
 if(window.BAMCO_CASES?.hasUnsaved?.()&&!confirm(lang==='fa'?'تغییرات ذخیره‌نشده دارید. خارج می‌شوید؟':lang==='en'?'Discard unsaved changes and sign out?':'放弃未保存的更改并退出？'))return;
 const access=session?.access_token;try{if(access)await request('/auth/v1/logout?scope=local',{},access)}finally{lock();location.replace('./')}
}
function toolsBar(){
 const host=$('portalTools');host.hidden=false;host.replaceChildren();
 if(profile.admin)host.append(button('users',openUsers));
 host.append(button('out',signOut));
}
function openDialog(title){
 $('portalDialogTitle').textContent=t(title);const host=$('portalDialogBody');host.replaceChildren();
 if(!$('portalDialog').open)$('portalDialog').showModal();return host;
}
function field(form,title,type,value='',required=true){
 const label=element('label',t(title)),input=element('input');input.type=type;input.required=required;input.value=value;
 if(type==='email'||type==='password')input.dir='ltr';if(type==='password')input.autocomplete='new-password';
 label.append(input);form.append(label);return input;
}
function tasks(form,label,submit,back){
 const area=element('div','','portal-actions'),ok=element('button',t(label),'portal-primary');ok.type='submit';area.append(ok);
 if(back)area.append(button('back',back));
 const status=element('p','','portal-notice');status.setAttribute('role','status');form.append(status,area);
 form.onsubmit=async e=>{e.preventDefault();if(ok.disabled)return;ok.disabled=true;status.textContent='';
 try{await submit()}catch(err){status.textContent=t(err.ui||messageFor(err,err.code==='duplicate_email'?'duplicate':'error'))}finally{ok.disabled=false}};
}
function validatePassword(p){if(p.length<8||new TextEncoder().encode(p).length>72)throw Object.assign(Error(),{ui:'weak'})}
function changeOwnPassword(){
 if(!profile?.admin)return;
 const host=openDialog('ownPassword'),form=element('form','','portal-fields');host.append(form);
 const current=field(form,'currentPassword','password'),next=field(form,'newPass','password');
 current.autocomplete='current-password';
 tasks(form,'set',async()=>{
  validatePassword(next.value);
  await request('/auth/v1/user',{current_password:current.value,password:next.value},await token(),'PUT');
  form.reset();
  const status=element('p',t('changed'));status.setAttribute('role','status');
  host.replaceChildren(status,button('back',openUsers));
 },openUsers);
}
function recoveryLanding(){
 const hash=new URLSearchParams(location.hash.slice(1));if(hash.get('type')!=='recovery'||!hash.has('access_token'))return false;
 const recovery=hash.get('access_token');history.replaceState(null,'',location.pathname+location.search);
 const form=element('form','','portal-fields');openDialog('newPass').append(form);
 const pw=field(form,'newPass','password');tasks(form,'set',async()=>{validatePassword(pw.value);await request('/auth/v1/user',{password:pw.value},recovery,'PUT');await request('/auth/v1/logout?scope=local',{},recovery).catch(()=>{});$('portalDialog').close();notice('savedPass')});
 return true;
}
async function openUsers(){
 if(!profile?.admin)return;const host=openDialog('users'),panel=element('div');host.append(panel);
 const add=button('add',()=>editUser(null),'portal-primary');panel.append(add);
 const list=element('div');panel.append(list);
 const r=await rpc('bamco_access_users');if(!panel.isConnected)return;
 if(r.error){list.append(element('p',t('network'),'portal-notice'),button('back',openUsers));return}
 for(const person of r.data){const row=element('article','','portal-person'),identity=element('div');identity.append(element('b',person.name));
 const email=element('small',person.email);email.dir='ltr';identity.append(email);row.append(identity);
 if(person.admin){
   row.append(element('span',t('full'),'portal-hint'));
   if(person.id===profile.id)row.append(button('ownPassword',changeOwnPassword));
 }
 else {const actions=element('div','','portal-actions');actions.append(button('edit',()=>editUser(person)),button('view',()=>userView(person)));row.append(actions)}
 list.append(row)}
}
function userView(person){
 const h=openDialog('view');h.append(element('h3',person.name));const main=groups.main.filter(k=>person.grants.includes(k));
 const inside=main.some(k=>k==='active'||k==='history')?groups.inside.filter(k=>person.grants.includes(k)):[];
 for(const [label,items] of [['main',main],['inside',inside]]){if(items.length){h.append(element('h4',t(label)));const ul=element('ul');for(const item of items)ul.append(element('li',t(item)));h.append(ul)}}
 if(!main.length)h.append(element('p',t('empty')));h.append(button('back',openUsers));
}
function editUser(person){
 const host=openDialog(person?'edit':'add'),form=element('form','','portal-fields');host.append(form);
 const name=field(form,'name','text',person?.name),email=field(form,'email','email',person?.email),password=field(form,person?'optional':'password','password','',!person);
 name.maxLength=80;email.maxLength=254;const inputs=new Map();let inside;
 for(const [key,ids] of Object.entries(groups)){const set=element('fieldset'),wrap=element('div','','portal-checks');if(key==='inside')inside=set;set.append(element('legend',t(key)),wrap);
 for(const id of ids){const label=element('label'),input=element('input');input.type='checkbox';input.checked=person?.grants.includes(id)||false;label.append(input,document.createTextNode(t(id)));wrap.append(label);inputs.set(id,input)}
 form.append(set)}
 const sync=()=>{inside.disabled=!inputs.get('active').checked&&!inputs.get('history').checked};form.onchange=sync;sync();form.append(element('p',t('accessHint'),'portal-hint'));
 tasks(form,'save',async()=>{if(password.value)validatePassword(password.value);const grants=[...inputs].filter(([id,input])=>input.checked&&(!groups.inside.includes(id)||!inside.disabled)).map(([id])=>id);
 await request('/functions/v1/assessment-user-admin',{id:person?.id,name:name.value.trim(),email:email.value.trim(),password:password.value,grants},await token());await openUsers()},openUsers);
}
let started=false;
async function start(onReady,initialLanguage){
 startWorkspace=onReady;applyLanguage(initialLanguage);
 if(started)return;started=true;
 document.addEventListener('visibilitychange',recheck);window.addEventListener('focus',recheck);setInterval(recheck,300000);
 $('portalClose').onclick=()=>$('portalDialog').close();
 $('portalReveal').onclick=()=>{const f=$('portalPassword'),show=f.type==='password';f.type=show?'text':'password';$('portalReveal').setAttribute('aria-pressed',String(show));$('portalReveal').setAttribute('aria-label',t(show?'hide':'show'))};
 const form=$('portalLogin');form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;notice('wait');
 try{const s=await request('/auth/v1/token?grant_type=password',{email:$('portalEmail').value.trim(),password:$('portalPassword').value});
 remember(s);await authenticate();form.reset();$('portalPassword').type='password';$('portalReveal').setAttribute('aria-pressed','false');$('portalReveal').setAttribute('aria-label',t('show'));notice()}catch(err){notice(messageFor(err,'loginFailed'))}finally{submit.disabled=false}};
 if(recoveryLanding())return;
 try{session=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
 if(session){notice('wait');try{await authenticate();notice()}catch(e){if([400,401,403].includes(e.status))lock();notice(messageFor(e,'loginFailed'))}}
}
window.BAMCO_PORTAL={start,can,rpc,token,applyLanguage,text:t,get user(){return profile}};
})();
