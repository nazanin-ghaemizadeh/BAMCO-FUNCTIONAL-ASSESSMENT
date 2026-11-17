(() => {
'use strict';
const root='https://cwpfzvcwuiawjtvsnpkq.supabase.co';
const apiKey='sb_publishable_EWHLDNy9MiO26ZqdRYvSxQ_UU9pe3GM';
const key='bamco-functional.auth.v1';
const $=id=>document.getElementById(id);
const words={
 motto1:['کیفیت از','Quality starts with','品质源于'],motto2:['ارزیابی دقیق','precise assessment','精准评估'],motto3:['آغاز می‌شود.','.','。'],
 signIn:['ورود به سامانه','Sign in','登录系统'],username:['نام کاربری','Username','用户名'],email:['نام کاربری یا ایمیل','Username or email','用户名或邮箱'],password:['رمز عبور','Password','密码'],
 show:['نمایش رمز عبور','Show password','显示密码'],hide:['پنهان کردن رمز عبور','Hide password','隐藏密码'],close:['بستن','Close','关闭'],
 ownPassword:['تغییر رمز من','Change my password','修改我的密码'],currentPassword:['رمز عبور فعلی','Current password','当前密码'],
 newPass:['رمز عبور جدید','New password','新密码'],set:['ذخیره رمز عبور','Save password','保存密码'],
 changed:['رمز عبور شما تغییر کرد.','Your password was changed.','您的密码已修改。'],
 savedPass:['رمز ذخیره شد. اکنون وارد شوید.','Password saved. You can now sign in.','密码已保存，请登录。'],
 loginFailed:['نام کاربری یا رمز عبور صحیح نیست.','Incorrect username or password.','邮箱或密码有误。'],forbidden:['این حساب مجوز ورود به سامانه را ندارد.','This account has no portal access.','此账户无权访问此系统。'],
 network:['اتصال به سرویس برقرار نشد. دوباره تلاش کنید.','Could not reach the service. Try again.','无法连接服务，请重试。'],
 limited:['تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.','Too many attempts. Try again shortly.','请求过多，请稍后重试。'],
 out:['خروج','Sign out','退出'],users:['مدیریت کاربران','User management','用户管理'],add:['تعریف کاربر','Add user','添加用户'],edit:['ویرایش','Edit','编辑'],
 editUser:['ویرایش کاربر','Edit user','编辑用户'],account:['اطلاعات حساب','Account details','账户信息'],permissions:['سطح دسترسی','Permissions','访问权限'],
 allGrants:['همه بخش‌ها','All sections','全部模块'],noGrants:['بدون دسترسی','No access','无权限'],sections:['بخش','sections','个模块'],
 selectAll:['انتخاب همه','Select all','全选'],clearAll:['برداشتن همه','Clear all','取消全选'],
 savedUser:['اطلاعات کاربر ذخیره شد.','User saved.','用户信息已保存。'],retry:['تلاش دوباره','Retry','重试'],
 loadingPassword:['در حال دریافت رمز…','Loading password…','正在读取密码…'],readFailed:['رمز فعلی دریافت نشد. می‌توانید رمز جدید بنویسید.','Could not load the current password. You can enter a replacement.','未能读取当前密码，可以输入新密码。'],
 full:['دسترسی کامل مدیر','Full administrator access','完整管理权限'],name:['نام و نام خانوادگی','Full name','姓名'],
 optional:['رمز جدید (اختیاری)','New password (optional)','新密码（可选）'],save:['ذخیره کاربر','Save user','保存用户'],back:['بازگشت','Back','返回'],
 error:['ذخیره انجام نشد. اطلاعات را بررسی کنید و دوباره تلاش کنید.','Could not save. Check the form and try again.','保存失败，请检查后重试。'],
 duplicate:['این نام کاربری قبلا ثبت شده است.','This login is already registered.','此邮箱已注册。'],
 main:['بخش‌های اصلی','Main sections','主要模块'],inside:['داخل هر پرونده','Inside each case','档案内模块'],
 accessHint:['برای دسترسی به داخل پرونده، ارزیابی‌های فعال یا تاریخچه را انتخاب کنید. «گزارش و نتایج» شامل داشبورد و نمره‌های ثبت‌شده در همه انواع ارزیابی است.','Select Active assessments or Assessment history for case access. Reports and results includes dashboards and recorded scores across assessment types.','请先选择进行中的评估或评估历史。报告与结果包含各评估类型的仪表板与已记录评分。'],
 active:['ارزیابی‌های فعال','Active assessments','进行中的评估'],history:['تاریخچه ارزیابی‌ها','Assessment history','评估历史'],weighting:['وزن‌دهی','Weighting','权重设置'],observer:['نظارت بر موقعیت مکانی','Location monitoring','位置监控'],
 setup:['مشخصات خودرو','Vehicle specifications','车辆规格'],drive:['قابلیت رانندگی','Drivability','驾驶性能'],durability:['آزمون دوام','Durability testing','耐久试验'],static:['بررسی استاتیک','Static inspection','静态检查'],
 comprehensive:['ارزیابی جامع','Comprehensive assessment','综合评估'],results:['گزارش و نتایج','Reports and results','报告与结果'],
 weak:['رمز باید حداقل ۸ نویسه و حداکثر ۷۲ بایت باشد.','Use at least 8 characters and at most 72 bytes.','密码至少八个字符，最多七十二字节。'],
 link:['لینک اختصاصی ورود','Private sign-in link','专属登录链接'],
 copy:['کپی لینک ورود','Copy sign-in link','复制登录链接'],copied:['لینک کپی شد.','Link copied.','链接已复制。'],
 remember:['این دستگاه را به خاطر بسپار','Remember this device','记住此设备'],
 needLink:['برای ورود با این نام کاربری، لینک اختصاصی خود را از مدیر بگیرید و باز کنید.','Open your private sign-in link from the administrator.','请打开管理员提供的专属登录链接。'],
 managedWeak:['رمز باید حداقل ۶ نویسه و حداکثر ۷۲ بایت باشد.','Use at least 6 characters and at most 72 bytes.','密码至少六个字符，最多七十二字节。'],
 resume:['در حال باز کردن سامانه…','Opening the workspace…','正在打开工作区…'],
 wait:['در حال اتصال…','Connecting…','正在连接…'],car:['خودروی خندان در حال ارزیابی','A smiling car being inspected','正在接受检查的微笑汽车']
};
const staffDomain='staff.bamco.invalid';
const isHandle=value=>/^[a-z][a-z0-9_]{2,31}$/.test(value);
const linkSlot=username=>'bamco-functional.device.'+username;
let invitation=null;
function readInvitation(){
 const params=new URLSearchParams(location.hash.slice(1));
 if(!params.has('staff'))return;
 const username=params.get('staff'),key=params.get('key')||'';
 history.replaceState(null,'',location.pathname+location.search);
 if(!isHandle(username)||!(/^[a-f0-9]{48}$/).test(key))return;
 invitation={username,key};
 $('portalEmail').value=username;$('portalTrust').hidden=false;
}
function storedDevice(username){try{return localStorage.getItem(linkSlot(username))}catch{return null}}
async function signInCredentials(input,password){
 const username=input.trim().toLowerCase();
 if(!isHandle(username))return {email:username,password};
 const key=invitation?.username===username?invitation.key:storedDevice(username);
 if(!key)throw Object.assign(Error(),{ui:'needLink'});
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+':'+password));
 const secret=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 return {email:username+'@'+staffDomain,password:secret};
}
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
function lock(){remember(null);profile=null;$('portalSessionState').hidden=true;$('workspaceMain').hidden=true;$('portalGate').hidden=false;$('portalTools').hidden=true;if($('portalDialog').open)$('portalDialog').close()}
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
 profile=p;$('portalSessionState').hidden=true;$('portalGate').hidden=true;$('workspaceMain').hidden=false;toolsBar();startWorkspace();
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
 $('portalDialog').dataset.view=title;
 if(!$('portalDialog').open)$('portalDialog').showModal();
 host.scrollTop=0;
 return host;
}
function field(form,title,type,value='',required=true){
 const label=element('label'),input=element('input');label.append(element('span',t(title)));input.type=type;input.required=required;input.value=value;
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
function validatePassword(p,managed=false){if(p.length<(managed?6:8)||new TextEncoder().encode(p).length>72)throw Object.assign(Error(),{ui:managed?'managedWeak':'weak'})}
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
async function openUsers(status){
 if(!profile?.admin)return;
 const host=openDialog('users'),panel=element('div','','portal-directory');
 host.append(panel);
 const tools=element('div','','portal-directory-tools');
 const add=button('add',()=>editUser(null),'portal-primary portal-add');
 tools.append(add);
 const message=element('span',status==='savedUser'?t(status):'','portal-save-note');
 message.setAttribute('role','status');
 tools.append(message);
 const list=element('div','','portal-user-list');
 panel.append(tools,list);
 list.setAttribute('aria-busy','true');
 const response=await rpc('bamco_access_users');
 if(!panel.isConnected||!$('portalDialog').open)return;
 list.removeAttribute('aria-busy');
 if(response.error){
  list.append(element('p',t('network'),'portal-notice'),button('retry',openUsers));
  return;
 }
 const sectionCount=groups.main.length+groups.inside.length;
 for(const person of response.data){
  const editable=!person.admin||person.id===profile.id;
  const row=element(editable?'button':'div','','portal-person');
  if(editable){
   row.type='button';
   row.onclick=person.admin?changeOwnPassword:()=>editUser(person);
  }
  const avatar=element('span',Array.from(person.name.trim())[0]||'–','portal-avatar');
  avatar.setAttribute('aria-hidden','true');
  const identity=element('span','','portal-identity');
  const line=element('small'),identifier=element('bdi',person.username||person.email);
  identifier.dir='ltr';line.append(identifier);
  identity.append(element('b',person.name),line);
  const count=person.grants.length;
  let access=count===sectionCount?t('allGrants'):count?count.toLocaleString(lang)+' '+t('sections'):t('noGrants');
  if(person.admin)access=t('full');
  row.append(avatar,identity,element('span',access,'portal-access-summary'));
  if(editable){const arrow=element('span','','portal-arrow');arrow.setAttribute('aria-hidden','true');row.append(arrow)}
  list.append(row);
 }
}
function permissionFields(form,person){
 const section=element('section','','portal-section portal-permissions'),head=element('div','','portal-section-heading');
 const boxes=new Map(),sets={};
 const select=button('selectAll',()=>{
  const checked=![...boxes.values()].every(input=>input.checked);
  for(const input of boxes.values())input.checked=checked;
  sync();
 },'portal-text-button');
 head.append(element('h3',t('permissions')),select);section.append(head);
 const columns=element('div','','portal-permission-columns');
 for(const [key,ids] of Object.entries(groups)){
  const set=element('fieldset','','portal-scope portal-scope-'+key),wrap=element('div','','portal-checks');
  sets[key]=set;set.append(element('legend',t(key)),wrap);
  for(const id of ids){
   const label=element('label'),input=element('input');
   input.type='checkbox';input.checked=person?.grants.includes(id)||false;boxes.set(id,input);
   label.append(input,element('span',t(id)));wrap.append(label);
  }
  columns.append(set);
 }
 const read=()=>[...boxes].filter(([,input])=>input.checked&&!input.closest('fieldset').disabled).map(([id])=>id);
 function sync(){
  sets.inside.disabled=!boxes.get('active').checked&&!boxes.get('history').checked;
  select.textContent=t(read().length===boxes.size?'clearAll':'selectAll');
 }
 columns.onchange=sync;sync();
 const hint=element('p',t('accessHint'),'portal-hint');
 section.append(columns,hint);form.append(section);
 return read;
}
function editUser(person){
 if(!profile?.admin)return;
 const host=openDialog(person?'editUser':'add'),form=element('form','','portal-fields portal-editor');
 const account=element('section','','portal-section portal-account'),fields=element('div','','portal-account-fields');
 account.append(element('h3',t('account')),fields);form.append(account);host.append(form);
 const managed=Boolean(person?.username);
 const name=field(fields,'name','text',person?.name);
 const login=field(fields,'username','text',person?.username||person?.email);
 const password=field(fields,person&&!managed?'optional':'password','text','',!person);
 name.maxLength=80;login.maxLength=254;
 for(const input of [login,password]){
  input.dir='ltr';input.autocapitalize='none';input.spellcheck=false;input.autocomplete='off';
 }
 password.className='portal-issued-password';
 const readGrants=permissionFields(form,person);
 let originalPassword='';
 tasks(form,'save',async()=>{
  const changed=password.value!==originalPassword?password.value:'';
  if(changed)validatePassword(changed,isHandle(login.value.trim().toLowerCase()));
  await request('/functions/v1/assessment-user-admin',{
   id:person?.id,name:name.value.trim(),email:login.value.trim(),password:changed,grants:readGrants()
  },await token());
  if(form.isConnected&&$('portalDialog').open)await openUsers('savedUser');
 },openUsers);
 if(!managed)return;
 const utilities=element('div','','portal-account-tools');
 const status=element('span','','portal-hint');status.setAttribute('role','status');
 const retry=button('retry',loadPassword,'portal-text-button');
 let link='';
 const copy=button('copy',async()=>{
  try{await navigator.clipboard.writeText(link);status.textContent=t('copied')}
  catch{
   let input=utilities.querySelector('input');
   if(!input){input=field(utilities,'link','text',link,false);input.readOnly=true;input.dir='ltr'}
   input.focus();input.select();
  }
 },'portal-text-button');
 utilities.append(copy,retry,status);account.append(utilities);
 async function loadPassword(){
  password.disabled=true;password.placeholder=t('loadingPassword');
  retry.hidden=true;copy.hidden=true;status.textContent='';
  const response=await rpc('bamco_staff_credential',{staff_id:person.id});
  if(!form.isConnected||!$('portalDialog').open)return;
  password.disabled=false;password.placeholder='';
  if(response.error||typeof response.data?.password!=='string'){
   status.textContent=t('readFailed');retry.hidden=false;return;
  }
  originalPassword=response.data.password;
  if(!password.value)password.value=originalPassword;
  password.required=true;
  const url=new URL('./',location.href);
  url.hash=new URLSearchParams({staff:person.username,key:response.data.key}).toString();
  link=url.href;copy.hidden=false;
 }
 loadPassword();
}
let started=false;
async function start(onReady,initialLanguage){
 startWorkspace=onReady;applyLanguage(initialLanguage);
 if(started)return;started=true;
 document.addEventListener('visibilitychange',recheck);window.addEventListener('focus',recheck);setInterval(recheck,300000);
 $('portalDialog').addEventListener('close',()=>{$('portalDialogBody').replaceChildren()});
 $('portalClose').onclick=()=>$('portalDialog').close();
 readInvitation();
 $('portalReveal').onclick=()=>{const f=$('portalPassword'),show=f.type==='password';f.type=show?'text':'password';$('portalReveal').setAttribute('aria-pressed',String(show));$('portalReveal').setAttribute('aria-label',t(show?'hide':'show'))};
 const form=$('portalLogin');form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;notice('wait');
 try{const credentials=await signInCredentials($('portalEmail').value,$('portalPassword').value);
 const s=await request('/auth/v1/token?grant_type=password',credentials);
 remember(s);await authenticate();
 if(invitation&&profile.username===invitation.username&&$('portalRemember').checked){try{localStorage.setItem(linkSlot(invitation.username),invitation.key)}catch{}}
 invitation=null;$('portalTrust').hidden=true;form.reset();$('portalPassword').type='password';$('portalReveal').setAttribute('aria-pressed','false');$('portalReveal').setAttribute('aria-label',t('show'));notice()}catch(err){notice(err.ui||messageFor(err,'loginFailed'))}finally{submit.disabled=false}};
 if(recoveryLanding()){$('portalGate').hidden=false;return}
 try{session=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
 if(!session?.access_token||!session?.refresh_token){lock();return}
 const state=$('portalSessionState'),status=state.querySelector('[role=status]'),retry=$('portalSessionRetry');
 async function resume(){
  retry.hidden=true;
  status.dataset.pt='resume';status.textContent=t('resume');state.hidden=false;
  try{await authenticate()}catch(e){
   if(e.accessDenied||[400,401,403].includes(e.status)){lock();notice(messageFor(e,'loginFailed'));return}
   status.dataset.pt=messageFor(e,'network');status.textContent=t(status.dataset.pt);retry.hidden=false;
  }
 }
 retry.onclick=resume;
 await resume();
}
window.BAMCO_PORTAL={start,can,rpc,token,applyLanguage,text:t,get user(){return profile}};
})();
