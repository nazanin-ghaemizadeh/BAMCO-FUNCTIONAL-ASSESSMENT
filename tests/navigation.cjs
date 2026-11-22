module.exports=function navigate(document,selector){
 if(selector==='[data-open="results"]'){document.defaultView.BAMCO_ASSESSMENT.openDashboard();return}
 if(document.querySelector(selector))return;
 const match=selector.match(/^\[data-open="(drive|durability|supplementary|comprehensive|results)"\]$/);
 if(!match)return;
 const mode=match[1];
 if(mode==='results'){document.defaultView.BAMCO_ASSESSMENT.openDashboard();return}

 const types=document.querySelector('[data-open="assessmentTypes"]');
 if(types)types.click();
 const menu=document.querySelector('[data-open="'+mode+'Menu"]');
 if(menu)menu.click();
};
