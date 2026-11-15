(()=>{
 'use strict';
 currentRole='manager';
 document.getElementById('entryScreen').hidden=true;
 document.getElementById('appShell').hidden=false;
 applyRole();
 const actions=document.querySelector('.headerActions .actionCard');
 const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='بازگشت به ارزیابی جامع';back.onclick=()=>dashboardHost.close();actions.prepend(back);
 const save=document.createElement('button');save.type='button';save.textContent='ذخیره داشبورد';
 const status=document.createElement('span');status.setAttribute('role','status');
 save.disabled=dashboardData.readOnly;
 save.onclick=async()=>{save.disabled=true;status.textContent='در حال ذخیره…';try{persist();status.textContent=await dashboardHost.save()?'داشبورد ذخیره شد.':'ذخیره تأیید نشد؛ دوباره تلاش کنید.'}catch{status.textContent='ذخیره انجام نشد؛ دوباره تلاش کنید.'}finally{save.disabled=dashboardData.readOnly}};
 actions.prepend(save,status);
 document.querySelectorAll('#managerVehiclePhotos,#evaluatorVehiclePhotos').forEach(el=>el.remove());
 document.getElementById('switchRoleButton').hidden=true;
 document.getElementById('loadInput').closest('label').hidden=true;
 document.getElementById('unlockAssessmentButton').remove();
 document.getElementById('excelButton').hidden=true;
 const logo=window.parent.document.querySelector('.brand-logo');
 document.querySelectorAll('.panelBrandLogo img').forEach(img=>{if(logo)img.src=logo.src});
 if(dashboardData.readOnly){document.querySelectorAll('#managerWeightPanel button,#managerWeightPanel input,[data-final-comment]').forEach(el=>el.disabled=true)}
})();
