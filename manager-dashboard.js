(()=>{
 'use strict';
 const app=window.BAMCO_ASSESSMENT;
 const host=document.getElementById('comprehensiveDashboard');
 let frame,caseId,actions,notice;
 function close(){
  host.replaceChildren();actions?.remove();
  frame=actions=notice=null;host.hidden=true;
 }
 function ready(source){
  if(source!==frame?.contentWindow)return;
  notice?.remove();notice=null;
 }
 function failed(target){
  if(frame!==target||!notice)return;
  const retry=document.createElement('button');
  retry.type='button';retry.className='secondary';retry.textContent='تلاش دوباره';
  retry.onclick=()=>{close();open()};
  notice.replaceChildren('داشبورد بارگذاری نشد. ',retry);
  frame.hidden=true;
 }
 window.BAMCO_MANAGER={
  data(){
   const snapshot=app.snapshot(),records={};
   const tests=app.eligibleTests('comprehensive').map(({id,cat,sub,name,measure,profile})=>{
    const key='comprehensive:general:'+id;
    if(snapshot.records[key])records[key]={...snapshot.records[key]};
    return {id,cat,sub,name,measure,profile};
   });
   return {snapshot:{config:{...snapshot.config},records},tests,categories:app.criterionNames(),
    case:{id:caseId,title:window.BAMCO_CASES.current().title},settings:app.mission('comprehensive-dashboard:general'),readOnly:app.isReadOnly()};
  },
  async save(storage,source){
   if(!frame||source!==frame.contentWindow||caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return false;
   app.setMission('comprehensive-dashboard:general',{storage});
   return app.saveDraft();
  },
  mountActions(nodes){actions?.remove();actions=document.createElement('div');actions.id='managerPageActions';actions.append(...nodes);document.getElementById('assessmentPageActions').append(actions)},
  resize(height){if(frame)frame.style.height=Math.ceil(Math.max(400,height))+'px'},
  ready,close
 };
 function open(){
  const id=window.BAMCO_CASES.current()?.id;
  if(frame&&caseId===id)return;
  close();caseId=id;host.hidden=false;
  notice=document.createElement('p');notice.setAttribute('role','status');
  notice.textContent='در حال بارگذاری داشبورد مدیریتی…';
  const target=document.createElement('iframe');frame=target;
  frame.title='داشبورد مدیریتی ارزیابی جامع خودرو';
  frame.src='./manager-reference/view/manager.html?v=shared-controls-1';
  frame.style.cssText='width:100%;height:600px;border:0;background:transparent';
  frame.addEventListener('error',()=>failed(target));
  frame.addEventListener('load',()=>failed(target));
  host.append(notice,frame);
 }
 document.addEventListener('bamco:render',()=>{
  if(document.body.dataset.view==='comprehensiveDashboard')open();else if(frame)close();
 });
 document.addEventListener('bamco:assessment-close',close);
})();
