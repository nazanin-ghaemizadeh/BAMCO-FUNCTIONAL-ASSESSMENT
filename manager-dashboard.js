(()=>{
 'use strict';
 const app=window.BAMCO_ASSESSMENT;
 let frame,caseId,host,actions,previousTitle;
 function close(){
  frame?.remove();host?.remove();actions?.remove();frame=null;host=null;actions=null;
  document.body.classList.remove('manager-dashboard-open');
  if(previousTitle!==undefined){if(app.scoreContext?.()?.tab==='comprehensive')document.getElementById('pageTitle').textContent=previousTitle;previousTitle=undefined}
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
   previousTitle=document.getElementById('pageTitle').textContent;
   document.getElementById('pageTitle').textContent='داشبورد مدیریتی ارزیابی جامع';
   document.body.classList.add('manager-dashboard-open');
   host=document.createElement('section');host.id='comprehensiveDashboard';
   frame=document.createElement('iframe');frame.title='داشبورد مدیریتی ارزیابی جامع خودرو';
   frame.src='./manager-reference/manager.html?v=hierarchy-1';
   frame.style.cssText='display:block;width:100%;height:600px;border:0;background:transparent';
   host.append(frame);document.getElementById('workPanel').insertAdjacentElement('afterend',host);
   document.getElementById('assessmentEditorBar').scrollIntoView({block:'start',behavior:'smooth'});
 }
 document.addEventListener('bamco:render',()=>{if(app.scoreContext?.()?.tab!=='comprehensive')close()});
 window.BAMCO_MANAGER.open=open;
 window.BAMCO_MANAGER.returnToMenu=()=>app.navigateModule('comprehensive');
 document.addEventListener('bamco:assessment-close',close);
})();
