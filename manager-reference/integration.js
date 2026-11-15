(()=>{
 'use strict';
 currentRole='manager';
 document.body.id='integratedManager';
 document.getElementById('entryScreen').hidden=true;
 document.getElementById('appShell').hidden=false;
 applyRole();
 const actions=document.querySelector('.headerActions .actionCard');
 const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='ذخیره داشبورد';
 const status=document.createElement('span');status.setAttribute('role','status');
 save.disabled=dashboardData.readOnly;
 save.onclick=async()=>{save.disabled=true;status.textContent='در حال ذخیره…';try{persist();status.textContent=await dashboardHost.save({...dashboardValues},window)?'داشبورد ذخیره شد.':'ذخیره تأیید نشد؛ دوباره تلاش کنید.'}catch{status.textContent='ذخیره انجام نشد؛ دوباره تلاش کنید.'}finally{save.disabled=dashboardData.readOnly}};
 actions.prepend(save,status);
 document.querySelectorAll('#managerVehiclePhotos,#evaluatorVehiclePhotos').forEach(el=>el.remove());
 document.getElementById('switchRoleButton').hidden=true;
 document.getElementById('loadInput').closest('label').hidden=true;
 document.getElementById('unlockAssessmentButton').remove();
 document.getElementById('excelButton').hidden=true;
 const headline=document.querySelector('.managerHeadline');
 if(headline)document.querySelector('section.dashboard').prepend(headline);
 const excel=document.getElementById('managerExcelButton');excel.className='secondary';excel.onclick=()=>exportManagerDashboard();
 if(dashboardHost.mountActions)dashboardHost.mountActions([...actions.children].filter(el=>!el.hidden));
 const main=document.querySelector('main');
 let resizePending=false;
 const resize=()=>{if(resizePending)return;resizePending=true;requestAnimationFrame(()=>{
  resizePending=false;
  const navigation=document.querySelector('.headerActions');
  dashboardHost.resize?.(main.getBoundingClientRect().height+(navigation?.getBoundingClientRect().height||0)+32);
 })};
 new ResizeObserver(resize).observe(main);
 new MutationObserver(resize).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 resize();
 const logo=window.parent.document.querySelector('.brand-logo');
 document.querySelectorAll('.panelBrandLogo img').forEach(img=>{if(logo)img.src=logo.src});
 if(dashboardData.readOnly){document.querySelectorAll('#managerWeightPanel button,#managerWeightPanel input,[data-final-comment]').forEach(el=>el.disabled=true)}
})();
