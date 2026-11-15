'use strict';
const dashboardHost=window.parent!==window?window.parent.BAMCO_MANAGER:null;
if(!dashboardHost)throw Error('این داشبورد را از پروندهٔ خودرو باز کنید.');
const dashboardData=dashboardHost.data();
const dashboardValues={...(dashboardData.settings.storage||{})};
const dashboardStorage={
 getItem(key){return dashboardValues[key]??null},
 setItem(key,value){dashboardValues[key]=String(value);dashboardHost.store({...dashboardValues})},
 removeItem(key){delete dashboardValues[key];dashboardHost.store({...dashboardValues})}
};
const dashboardGroups=dashboardData.categories.map((cat,index)=>({id:String(index+1),titleFa:cat,subgroups:[]}));
for(const test of dashboardData.tests){
 let group=dashboardGroups.find(group=>group.titleFa===test.cat);
 if(!group){group={id:String(dashboardGroups.length+1),titleFa:test.cat,subgroups:[]};dashboardGroups.push(group)}
 let sub=group.subgroups.find(sub=>sub.titleFa===test.sub);
 if(!sub){sub={id:test.sub,titleFa:test.sub,items:[]};group.subgroups.push(sub)}
 sub.items.push({id:test.id,titleFa:test.name,textFa:test.measure,exampleFa:test.profile});
}
window.ASSESSMENT_CRITERIA=dashboardGroups;
function comprehensiveCase(snapshot,title,includeSettings=false){
 const saved=includeSettings?(JSON.parse(dashboardValues['bamco-vehicle-assessment']||'null')||{}):{};
 const result={metadata:{...(saved.metadata||{}),model:title||'',date:snapshot.config.date||'',...snapshot.config},scores:{},notes:{},attachments:{},weights:saved.weights||{},vehiclePhotos:{},finalComments:saved.finalComments||{evaluator:'',expert:'',manager:''},auditTrail:saved.auditTrail||[]};
 for(const main of dashboardGroups)for(const sub of main.subgroups)for(const item of sub.items){
  const record=snapshot.records?.['comprehensive:general:'+item.id]||{},key=main.id+'/'+sub.id+'/'+item.id;
  if(Number(record.score)>=1&&Number(record.score)<=10)result.scores[key]=Number(record.score);
  if(record.note)result.notes[key]=record.note;
  if(record.photo)result.attachments[key]=[{name:item.id+'.jpg',type:'image/jpeg',data:record.photo}];
 }
 return result;
}
dashboardValues['bamco-vehicle-assessment']=JSON.stringify(comprehensiveCase(dashboardData.snapshot,dashboardData.case.title,true));
