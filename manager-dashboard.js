(()=>{
 'use strict';
 const app=window.BAMCO_ASSESSMENT;
 let frame,caseId;
 function close(){frame?.remove();frame=null;document.body.style.overflow=''}
 window.BAMCO_MANAGER={
  data(){return {snapshot:structuredClone(app.snapshot()),tests:structuredClone(app.eligibleTests('comprehensive')),categories:app.reportContext().categories,case:window.BAMCO_CASES.current(),settings:structuredClone(app.mission('comprehensive-dashboard:general')),readOnly:app.isReadOnly()}},
  store(storage){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return;app.setMission('comprehensive-dashboard:general',{storage})},
  async save(){if(caseId!==window.BAMCO_CASES.current()?.id||app.isReadOnly())return false;return window.BAMCO_CASES.saveNow(app.snapshot())},
  close
 };
 function sync(){
  const active=app.scoreContext?.()?.tab==='comprehensive',bar=document.getElementById('assessmentPageActions');
  let button=document.getElementById('comprehensiveManager');
  if(!active){button?.remove();close();return}
  if(!bar||button)return;
  button=document.createElement('button');button.id='comprehensiveManager';button.type='button';button.className='secondary';button.textContent='داشبورد مدیریتی';
  button.onclick=()=>{caseId=window.BAMCO_CASES.current()?.id;frame=document.createElement('iframe');frame.title='داشبورد مدیریتی ارزیابی جامع خودرو';frame.src='./manager-reference/manager.html?v=1';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;background:#f5faf7;z-index:10000';document.body.append(frame);document.body.style.overflow='hidden'};
  bar.insertBefore(button,document.getElementById('dayScoresSave')||null);
 }
 document.addEventListener('bamco:render',sync);
 document.addEventListener('bamco:assessment-close',close);
})();
