(()=>{
 'use strict';
 const app=window.BAMCO_ASSESSMENT;
 let frame,caseId,host,actions,previousTitle;
 function close(){
  frame?.remove();host?.remove();actions?.remove();frame=null;host=null;actions=null;
  document.body.classList.remove('manager-dashboard-open');
  if(previousTitle!==undefined){document.getElementById('pageTitle').textContent=previousTitle;previousTitle=undefined}
 }
 window.BAMCO_MANAGER={
  data(){return {snapshot:structuredClone(app.snapshot()),tests:structuredClone(app.eligibleTests('comprehensive')),categories:app.reportContext().categories,case:window.BAMCO_CASES.current(),settings:structuredClone(app.mission('comprehensive-dashboard:general')),readOnly:app.isReadOnly()}},
  store(storage){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return;app.setMission('comprehensive-dashboard:general',{storage})},
  async save(){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return false;return window.BAMCO_CASES.saveNow(app.snapshot())},
  mountActions(nodes){actions=document.createElement('div');actions.id='managerPageActions';actions.append(...nodes);document.getElementById('assessmentPageActions').append(actions)},
  resize(height){if(frame)frame.style.height=Math.ceil(Math.max(400,height))+'px'},
  close
 };
 function sync(){
  const active=app.scoreContext?.()?.tab==='comprehensive',bar=document.getElementById('assessmentPageActions');
  let button=document.getElementById('comprehensiveManager');
  if(!active){button?.remove();close();return}
  if(!bar||button)return;
  button=document.createElement('button');button.id='comprehensiveManager';button.type='button';button.className='secondary';button.textContent='داشبورد مدیریتی';
  button.onclick=()=>{
   if(frame)return;
   caseId=window.BAMCO_CASES.current()?.id;
   previousTitle=document.getElementById('pageTitle').textContent;
   document.getElementById('pageTitle').textContent='داشبورد مدیریتی ارزیابی جامع';
   document.body.classList.add('manager-dashboard-open');
   host=document.createElement('section');host.id='comprehensiveDashboard';
   frame=document.createElement('iframe');frame.title='داشبورد مدیریتی ارزیابی جامع خودرو';
   frame.src='./manager-reference/manager.html?v=integrated-2';
   frame.style.cssText='display:block;width:100%;height:600px;border:0;background:transparent';
   host.append(frame);document.getElementById('workPanel').insertAdjacentElement('afterend',host);
   document.getElementById('assessmentEditorBar').scrollIntoView({block:'start',behavior:'smooth'});
  };
  bar.insertBefore(button,document.getElementById('dayScoresSave')||null);
 }
 document.addEventListener('bamco:render',sync);
 document.addEventListener('bamco:assessment-close',close);
})();
