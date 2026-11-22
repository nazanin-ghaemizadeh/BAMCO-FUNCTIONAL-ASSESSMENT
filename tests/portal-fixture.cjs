module.exports=(w,grants=null)=>{
 const id='fixture',user={id,email:'fixture@example.test',name:'Fixture',admin:grants===null,grants:grants||[]};
 w.BAMCO_PORTAL={user,can:k=>user.admin||user.grants.includes(k),text:id=>id,applyLanguage(){},start(fn){w.document.getElementById('portalGate').hidden=true;w.document.getElementById('workspaceMain').hidden=false;fn()},async rpc(name,args={}){
  if(name==='bamco_banks'&&args.operation==='active_prompt')return {data:{id:'test-prompt',definition:{content:'Test prompt',title:'Test prompt'}}};
  if(name==='bamco_banks')return {data:(w.BAMCO_DATA?.roadCatalog||[]).map(r=>({id:r.id,definition:{...r,active:true}})),error:null};
  if(name==='bamco_question_bank')return {data:[],error:null};
  try{const r=await w.fetch('https://example.test/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});const data=await r.json();return r.ok?{data,error:null}:{data:null,error:data}}catch(error){return {data:null,error}}
 }};
};
