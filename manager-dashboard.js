(()=>{
 'use strict';
 const app=window.BAMCO_ASSESSMENT;
 const host=document.getElementById('comprehensiveDashboard');
 let frame,caseId,actions;
 function close(){
  frame?.remove();actions?.remove();frame=null;actions=null;host.hidden=true;
 }
 window.BAMCO_MANAGER={
  data(){return {snapshot:structuredClone(app.snapshot()),tests:structuredClone(app.eligibleTests('comprehensive')),categories:app.reportContext().categories,case:window.BAMCO_CASES.current(),settings:structuredClone(app.mission('comprehensive-dashboard:general')),readOnly:app.isReadOnly()}},
  store(storage){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return;app.setMission('comprehensive-dashboard:general',{storage})},
  async save(){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return false;return window.BAMCO_CASES.saveNow(app.snapshot())},
  mountActions(nodes){actions=document.createElement('div');actions.id='managerPageActions';actions.append(...nodes);document.getElementById('assessmentPageActions').append(actions)},
  resize(height){if(frame)frame.style.height=Math.ceil(Math.max(400,height))+'px'},
  close
 };
 function open(){
   if(frame)return;
   caseId=window.BAMCO_CASES.current()?.id;
   host.hidden=false;
   frame=document.createElement('iframe');frame.title='داشبورد مدیریتی ارزیابی جامع خودرو';
   frame.src='./manager-reference/manager.html?v=case-pages-1';
   frame.style.cssText='display:block;width:100%;height:600px;border:0;background:transparent';
   host.append(frame);
 }
 document.addEventListener('bamco:render',()=>{
   if(document.body.dataset.view==='comprehensiveDashboard')open();else close();
 });
 document.addEventListener('bamco:assessment-close',close);
})();
