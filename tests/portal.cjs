const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const {webcrypto,createHash}=require('node:crypto');
const tick=()=>new Promise(r=>setTimeout(r,0));
async function until(check){for(let i=0;i<80;i++){if(check())return;await tick()}assert.fail('Portal did not reach expected state')}
async function visit(admin,staffLink=false){
 const deviceKey='ab'.repeat(24),staffName='test_staff';
 const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/'+(staffLink?'#staff='+staffName+'&key='+deviceKey:''),runScripts:'outside-only',virtualConsole:new VirtualConsole()}).window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false};
 Object.defineProperty(w,'crypto',{value:webcrypto});
 const d=w.document;w.TextEncoder=TextEncoder;w.structuredClone=structuredClone;w.scrollTo=()=>{};
 const profile={id:'qa',name:'QA',email:'qa@example.invalid',admin,grants:admin?[]:['active','drive']};
 if(staffLink)profile.username=staffName;
 const calls=[],writes=[];
 let newUser,issuedPassword,failCredential=false;
 w.fetch=async(url,opts)=>{
  const path=new URL(url).pathname,data=JSON.parse(opts.body);calls.push(path);
  const response=(value,status=200)=>({ok:status<300,status,json:async()=>value});
  if(path==='/auth/v1/token'&&staffLink)assert.equal(data.email,staffName+'@staff.bamco.invalid');
  const expected=staffLink?createHash('sha256').update(deviceKey+':'+staffName).digest('hex'):'synthetic-only';
  if(path==='/auth/v1/token')return data.password===expected?response({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600}):response({},400);
  assert.equal(opts.headers.Authorization,'Bearer fixture-access');
  if(path==='/auth/v1/user'){assert.equal(opts.method,'PUT');assert.deepEqual(data,{current_password:'synthetic-only',password:'synthetic-next'});return response({id:'qa'})}
  if(path.endsWith('bamco_access_profile'))return response(profile);
  if(path.endsWith('bamco_access_users')){assert(admin);return response(newUser?[profile,newUser]:[profile])}
  if(path.endsWith('assessment-user-admin')){
   assert(admin);writes.push(data);
   newUser={id:'new',name:data.name,email:data.email+'@staff.bamco.invalid',username:data.email,grants:data.grants,admin:false};
   if(data.password)issuedPassword=data.password;
   return response({ok:true});
  }
  if(path.endsWith('bamco_staff_credential')){
   assert(admin);assert.equal(data.staff_id,newUser.id);
   return failCredential?response({},503):response({password:issuedPassword,key:deviceKey});
  }
  if(path.endsWith('bamco_assessment')){assert.equal(data.operation,'list');if(!admin)assert.equal(data.args.status,'active');return response([])}
  throw Error('Unexpected endpoint '+path);
 };
 for(const script of d.scripts)w.eval(script.textContent);
 assert.deepEqual(calls,[]);assert(d.querySelector('#workspaceMain').hidden);assert(!d.querySelector('#portalGate').hidden);
 assert.equal(d.querySelector('#portalGate').textContent.includes('بازیابی'),false);
 if(staffLink){assert.equal(w.location.hash,'');assert.equal(d.querySelector('#portalEmail').value,staffName);d.querySelector('#portalRemember').checked=true}
 else {
  d.querySelector('#portalEmail').value=staffName;d.querySelector('#portalPassword').value=staffName;
  d.querySelector('#portalLogin').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>d.querySelector('#portalNotice').textContent.includes('لینک اختصاصی'));assert.deepEqual(calls,[]);
  d.querySelector('#portalEmail').value='qa@example.invalid';
 }d.querySelector('#portalPassword').value='incorrect';
 const submit=f=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 submit(d.querySelector('#portalLogin'));await until(()=>d.querySelector('#portalNotice').textContent.includes('صحیح نیست'));
 assert(d.querySelector('#workspaceMain').hidden);
 d.querySelector('#portalPassword').value=staffLink?staffName:'synthetic-only';submit(d.querySelector('#portalLogin'));await until(()=>!d.querySelector('#workspaceMain').hidden);
 assert(d.querySelector('#portalGate').hidden);assert.equal(d.querySelector('#portalPassword').value,'');
 if(staffLink)assert.equal(w.localStorage.getItem('bamco-functional.device.'+staffName),deviceKey);
 if(admin){
  d.querySelector('#portalTools button').click();await until(()=>d.querySelector('#portalDialogBody .portal-person'));
  d.querySelector('button.portal-person').click();
  const passwordForm=d.querySelector('#portalDialogBody form');
  passwordForm.querySelector('[autocomplete=current-password]').value='synthetic-only';
  passwordForm.querySelector('[autocomplete=new-password]').value='synthetic-next';
  submit(passwordForm);await until(()=>d.querySelector('#portalDialogBody').textContent.includes('تغییر کرد.'));
  d.querySelector('#portalDialogBody button').click();await until(()=>d.querySelector('.portal-person'));
  d.querySelector('#portalDialogBody .portal-primary').click();
  const f=d.querySelector('#portalDialogBody form'),fields=f.querySelectorAll('input');
  fields[0].value='Evaluator';fields[1].value='evaluator_test';fields[2].value='synthetic-example';
  const checks=f.querySelectorAll('input[type=checkbox]');checks[0].click();checks[5].click();submit(f);
  const directory=()=>d.querySelectorAll('button.portal-person');
  const credentialReads=()=>calls.filter(path=>path.endsWith('/bamco_staff_credential')).length;
  const openStaff=()=>directory()[1].click();
  const currentEditor=()=>d.querySelector('form.portal-editor');
  const visiblePassword=()=>currentEditor()?.querySelector('.portal-issued-password');
  const returnToList=()=>until(()=>directory().length===2);
  await returnToList();assert.equal(newUser.username,'evaluator_test');assert.deepEqual(writes[0].grants,['active','drive']);
  assert.equal(credentialReads(),0);assert(!d.querySelector('#portalDialogBody').textContent.includes(issuedPassword));
  openStaff();await until(()=>visiblePassword()?.value===issuedPassword);
  assert.equal(visiblePassword().type,'text');assert(!visiblePassword().readOnly);
  visiblePassword().value='discarded-fixture';currentEditor().querySelector('.portal-actions .portal-secondary').click();
  await returnToList();assert.equal(writes.length,1);
  openStaff();await until(()=>visiblePassword()?.value===issuedPassword);
  visiblePassword().value='changed-fixture';assert.equal(issuedPassword,'synthetic-example');
  submit(currentEditor());await returnToList();assert.equal(issuedPassword,'changed-fixture');
  openStaff();await until(()=>visiblePassword()?.value==='changed-fixture');
  currentEditor().querySelector('.portal-account-fields input').value='Renamed evaluator';
  currentEditor().querySelector('.portal-section-heading button').click();
  submit(currentEditor());await returnToList();
  assert.equal(writes.at(-1).password,'');assert.equal(newUser.grants.length,10);
  assert(directory()[1].textContent.includes('Renamed evaluator'));
  failCredential=true;openStaff();await until(()=>currentEditor()?.textContent.includes('رمز فعلی دریافت نشد'));
  assert.equal(visiblePassword().value,'');assert(!visiblePassword().disabled);
  failCredential=false;currentEditor().querySelector('.portal-account-tools button:not([hidden])').click();
  await until(()=>visiblePassword()?.value==='changed-fixture');assert.equal(writes.length,3);
 }else{
  assert.equal(d.querySelectorAll('#portalTools button').length,1);
  for(const card of d.querySelectorAll('[data-boot-screen]'))assert.equal(card.hidden,card.dataset.bootScreen!=='active');
 }
 w.close();
}
async function testRestore(page,kind){
 const w=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://example.test/'+page,runScripts:'outside-only'}).window;
 const d=w.document, gate=d.getElementById('portalGate'),workspace=d.getElementById('workspaceMain'),state=d.getElementById('portalSessionState');
 assert(gate.hidden && workspace.hidden,'Neither screen should paint before session selection');
 w.sessionStorage.setItem('bamco-functional.auth.v1',JSON.stringify({access_token:'fixture',refresh_token:'fixture-refresh',until:Date.now()+3600000}));
 let respond,opened=0;
 w.fetch=()=>new Promise(r=>respond=(data,status=200)=>r({ok:status===200,status,json:async()=>data}));
 w.eval(d.getElementById('portal-runtime').textContent);
 const boot=w.BAMCO_PORTAL.start(()=>opened++,'fa');
 await until(()=>respond);
 assert(gate.hidden && workspace.hidden && !state.hidden,'Wait for the profile without painting either form or protected content');
 const user={id:'fixture',admin:false,grants:['active']};
 if(kind==='rejected'){
  respond({},401);await boot;
  assert(!gate.hidden && workspace.hidden && state.hidden);assert.equal(opened,0);
 }else{
  if(kind==='retry'){
   respond({},503);await boot;
   assert(gate.hidden && workspace.hidden && !state.hidden);
   respond=null;d.getElementById('portalSessionRetry').click();await until(()=>respond);
  }
  respond(user);await boot;await until(()=>opened===1);
  assert(gate.hidden && !workspace.hidden && state.hidden);
 }
 w.close();
}
(async()=>{for(const page of ['index.html','case.html'])for(const kind of ['valid','retry','rejected'])await testRestore(page,kind);await visit(false);await visit(true);await visit(false,true);console.log('PASS production login, invalid credentials, scoped home, one-click staff editing, explicit saving and credential retry.')})().catch(e=>{console.error(e);process.exit(1)});
