const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const tick=()=>new Promise(r=>setTimeout(r,0));
async function until(check){for(let i=0;i<80;i++){if(check())return;await tick()}assert.fail('Portal did not reach expected state')}
async function visit(admin){
 const w=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/',runScripts:'outside-only',virtualConsole:new VirtualConsole()}).window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const d=w.document;w.TextEncoder=TextEncoder;w.structuredClone=structuredClone;w.scrollTo=()=>{};
 const profile={id:'qa',name:'QA',email:'qa@example.invalid',admin,grants:admin?[]:['active','drive']};
 const calls=[];let newUser;
 w.fetch=async(url,opts)=>{
  const path=new URL(url).pathname,data=JSON.parse(opts.body);calls.push(path);
  const response=(value,status=200)=>({ok:status<300,status,json:async()=>value});
  if(path==='/auth/v1/token')return data.password==='synthetic-only'?response({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600}):response({},400);
  assert.equal(opts.headers.Authorization,'Bearer fixture-access');
  if(path==='/auth/v1/user'){assert.equal(opts.method,'PUT');assert.deepEqual(data,{current_password:'synthetic-only',password:'synthetic-next'});return response({id:'qa'})}
  if(path.endsWith('bamco_access_profile'))return response(profile);
  if(path.endsWith('bamco_access_users')){assert(admin);return response(newUser?[profile,newUser]:[profile])}
  if(path.endsWith('assessment-user-admin')){assert(admin);newUser={...data,id:'new',admin:false};assert.deepEqual(data.grants,['active','drive']);return response({ok:true})}
  if(path.endsWith('bamco_assessment')){assert.equal(data.operation,'list');if(!admin)assert.equal(data.args.status,'active');return response([])}
  throw Error('Unexpected endpoint '+path);
 };
 for(const script of d.scripts)w.eval(script.textContent);
 assert.deepEqual(calls,[]);assert(d.querySelector('#workspaceMain').hidden);
 assert.equal(d.querySelector('#portalGate').textContent.includes('بازیابی'),false);
 d.querySelector('#portalEmail').value='qa@example.invalid';d.querySelector('#portalPassword').value='incorrect';
 const submit=f=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 submit(d.querySelector('#portalLogin'));await until(()=>d.querySelector('#portalNotice').textContent.includes('صحیح نیست'));
 assert(d.querySelector('#workspaceMain').hidden);
 d.querySelector('#portalPassword').value='synthetic-only';submit(d.querySelector('#portalLogin'));await until(()=>!d.querySelector('#workspaceMain').hidden);
 assert(d.querySelector('#portalGate').hidden);assert.equal(d.querySelector('#portalPassword').value,'');
 if(admin){
  d.querySelector('#portalTools button').click();await until(()=>d.querySelector('#portalDialogBody .portal-person'));
  d.querySelector('.portal-person button').click();
  const passwordForm=d.querySelector('#portalDialogBody form');
  passwordForm.querySelector('[autocomplete=current-password]').value='synthetic-only';
  passwordForm.querySelector('[autocomplete=new-password]').value='synthetic-next';
  submit(passwordForm);await until(()=>d.querySelector('#portalDialogBody').textContent.includes('تغییر کرد.'));
  d.querySelector('#portalDialogBody button').click();await until(()=>d.querySelector('.portal-person'));
  d.querySelector('#portalDialogBody .portal-primary').click();
  const f=d.querySelector('#portalDialogBody form'),fields=f.querySelectorAll('input');
  fields[0].value='Evaluator';fields[1].value='evaluator@example.invalid';fields[2].value='synthetic-example';
  const checks=f.querySelectorAll('input[type=checkbox]');checks[0].click();checks[5].click();submit(f);
  await until(()=>d.querySelectorAll('.portal-person').length===2);assert.equal(newUser.email,'evaluator@example.invalid');
 }else{
  assert.equal(d.querySelectorAll('#portalTools button').length,1);
  for(const card of d.querySelectorAll('[data-boot-screen]'))assert.equal(card.hidden,card.dataset.bootScreen!=='active');
 }
 w.close();
}
(async()=>{await visit(false);await visit(true);console.log('PASS production login, invalid credentials, scoped home and admin account form.')})().catch(e=>{console.error(e);process.exit(1)});
