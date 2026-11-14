(function(){
'use strict';
const app=window.BAMCO_ASSESSMENT,$=id=>document.getElementById(id);
const texts={download:['دانلود PDF همه سؤال‌های این روز','Download all questions for this day as PDF','下载当天全部试验题目PDF'],preparing:['در حال ساخت PDF…','Creating PDF…','正在生成PDF…'],ready:['PDF سؤال‌های روز آماده شد.','Day questions PDF is ready.','当天试验题目PDF已生成。'],failed:['ساخت PDF انجام نشد؛ دوباره تلاش کنید.','PDF could not be created. Please retry.','无法生成PDF，请重试。'],empty:['آزمونی برای این روز برنامه‌ریزی نشده است.','No tests are scheduled for this day.','当天未安排试验。'],note:['یادداشت ارزیاب','Evaluator note','评估员备注'],day:['روز','Day','天'],questions:['سؤال','questions','个题目'],drive:['قابلیت رانندگی','Driveability','驾驶性能'],durability:['آزمون دوام','Durability','耐久试验']};
const language=()=>window.BAMCO_I18N?.language||'fa',tr=(key,lang=language())=>texts[key][lang==='fa'?0:lang==='zh'?2:1],tx=(value,lang)=>window.BAMCO_I18N?.text(value,lang)||String(value??''),digits=(value,lang)=>window.BAMCO_I18N?.formatDigits(value,lang)||String(value);
let working=false,libraries;
function sync(){
 const c=app.dayContext?.(),bar=$('assessmentPageActions');if(!bar)return;
 const active=c?.section==='scores';let button=$('dayQuestionsPdf');
 if(!active){button?.remove();return}
 if(!button){button=document.createElement('button');button.id='dayQuestionsPdf';button.type='button';button.className='secondary';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>';button.addEventListener('click',download);bar.append(button)}
 button.title=tr('download');button.setAttribute('aria-label',tr('download'));button.disabled=working;button.setAttribute('aria-busy',String(working));

}
function script(url){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=url;element.onload=resolve;element.onerror=()=>{element.remove();reject(Error('PDF library unavailable'))};document.head.append(element)})}
async function loadLibraries(){if(!libraries)libraries=Promise.all([window.html2canvas?null:script('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),window.jspdf?.jsPDF?null:script('https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js')]).catch(error=>{libraries=null;throw error});await libraries;return {capture:window.html2canvas,PDF:window.jspdf.jsPDF}}
function textElement(tag,value,cls){const node=document.createElement(tag);node.textContent=value;if(cls)node.className=cls;return node}
function collect(){const context=app.dayContext?.();if(context?.section!=='scores')return null;const snapshot=app.snapshot(),plan=context.tab==='drive'?app.drivePlan():app.durabilityPlan(),route=plan.find(p=>p.day===context.day);return {context:{...context},lang:language(),title:window.BAMCO_CASES?.current()?.title||$('assessmentName')?.textContent||'BAMCO',route:route?.route||route?.type||'',cards:[...app.dayQuestionCards(),...(app.customQuestionCards?.()||[])],mileage:snapshot.mileage?.[context.tab]?.[context.day]}}
function makeStage(data){
 const root=document.createElement('div');root.className='day-pdf-stage';root.setAttribute('aria-hidden','true');root.dir=data.lang==='fa'?'rtl':'ltr';root.lang=data.lang;root.style.fontFamily=getComputedStyle(document.body).fontFamily;
 const header=document.createElement('header');header.className='day-pdf-header';const brand=document.createElement('div');brand.className='day-pdf-brand';const logo=document.querySelector('.brand-logo');if(logo){const image=logo.cloneNode();image.removeAttribute('id');brand.append(image)}const brandText=document.createElement('div');brandText.append(textElement('strong',$('brandName')?.textContent||'BAMCO'),textElement('small',$('brandTitle')?.textContent||''));brand.append(brandText);header.append(brand,textElement('h2',data.title,'day-pdf-identity'),textElement('p',[tr(data.context.tab,data.lang),tr('day',data.lang)+' '+digits(data.context.day,data.lang),digits(data.cards.length,data.lang)+' '+tr('questions',data.lang),tx(data.route,data.lang)].filter(Boolean).join(' · '),'day-pdf-meta'));root.append(header);
 const nodes=data.cards.map(({id,html})=>{const holder=document.createElement('div');holder.innerHTML=html;const card=holder.firstElementChild;card.dataset.pdfTest=id;card.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));card.removeAttribute('id');
 const attachment=card.querySelector('.assessment-attachment'),note=attachment?.querySelector('textarea')?.value||'',image=attachment?.querySelector('img')?.cloneNode();attachment?.remove();card.querySelectorAll('[data-custom-delete],input').forEach(n=>n.remove());card.querySelectorAll('.score').forEach(n=>{n.removeAttribute('disabled');n.removeAttribute('tabindex')});
 const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement.closest('.bamco-custom-question h3,.bamco-custom-question dd,.user-authored h3,.user-authored dd'))continue;node.nodeValue=tx(node.nodeValue,data.lang)}
 if(note){card.append(textElement('h4',tr('note',data.lang),'day-pdf-note-title'),textElement('p',note,'day-pdf-note report-user-text'))}if(image){image.className='day-pdf-evidence';card.append(image)}return card});
 if(!nodes.length)nodes.push(textElement('p',tr('empty',data.lang),'empty'));
 root.append(...nodes);return {root,header,nodes};
}
async function imagesReady(root){await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})||Promise.resolve()))}
async function mountStage(root,data){
 const frame=document.createElement('iframe');frame.className='day-pdf-frame';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.style.cssText='position:absolute;left:-100000px;top:0;width:1200px;height:1700px;border:0;pointer-events:none';document.body.append(frame);
 try{const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');doc.close();doc.documentElement.lang=data.lang;doc.documentElement.dir=data.lang==='fa'?'rtl':'ltr';doc.body.className=document.body.className;doc.body.dataset.view=document.body.dataset.view||'';const base=doc.createElement('base');base.href=document.baseURI;doc.head.append(base);
 const ready=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>new Promise((resolve,reject)=>{const clone=doc.createElement('link');clone.rel='stylesheet';clone.href=link.href;clone.onload=resolve;clone.onerror=()=>reject(Error('PDF stylesheet unavailable'));doc.head.append(clone)}));
 doc.body.append(doc.adoptNode(root));root.style.position='static';root.style.left='auto';await Promise.all(ready);await doc.fonts?.ready;return frame;
 }catch(error){frame.remove();throw error}
}
async function create(data,{capture,PDF},progress=()=>{}){
 const stage=makeStage(data);let frame;try{
 frame=await mountStage(stage.root,data);await imagesReady(stage.root);
 const captureNode=node=>capture(node,{scale:1.6,ignoreElements:element=>(element.parentElement===stage.root&&element!==node)||(element.parentElement===stage.root.ownerDocument.body&&element!==stage.root),backgroundColor:'#ffffff',useCORS:true,logging:false,windowWidth:1200,windowHeight:1700,scrollX:0,scrollY:0,onclone:doc=>{doc.documentElement.lang=data.lang;doc.documentElement.dir=data.lang==='fa'?'rtl':'ltr'}});
 const pdf=new PDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});pdf.setProperties({title:data.title+' | '+data.context.tab+' | Day '+data.context.day,subject:'All scheduled and custom questions for selected day',keywords:'BAMCO; tab='+data.context.tab+'; day='+data.context.day+'; questions='+data.cards.length});
 const head=await captureNode(stage.header),width=190,headHeight=width*head.height/head.width,gap=3,top=10+headHeight+gap,bottom=285;let y=top,page=1;
 function addHeader(){pdf.addImage(head.toDataURL('image/jpeg',.9),'JPEG',10,10,width,headHeight,'day-header','FAST')}
 addHeader();
 for(let i=0;i<stage.nodes.length;i++){
  progress(i+1,stage.nodes.length);const canvas=await captureNode(stage.nodes[i]);let drawWidth=width,height=drawWidth*canvas.height/canvas.width;
  if(y>top&&y+height>bottom){pdf.addPage();page++;addHeader();y=top}
  if(height>bottom-top){height=bottom-top;drawWidth=height*canvas.width/canvas.height}
  pdf.addImage(canvas.toDataURL('image/jpeg',.9),'JPEG',10+(width-drawWidth)/2,y,drawWidth,height,undefined,'FAST');y+=height+gap;canvas.width=canvas.height=1;
 }
 for(let i=1;i<=page;i++){pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(95,125,113);pdf.text(i+' / '+page,105,292,{align:'center'})}
 return pdf.output('blob');
 }finally{stage.root.remove();frame?.remove()}
}
async function download(){if(working)return;const data=collect();if(!data)return;working=true;sync();try{const deps=await loadLibraries(),blob=await create(data,deps);app.exportFile(blob,'BAMCO-'+data.context.tab+'-day-'+data.context.day+'.pdf','application/pdf')}catch(error){console.error('Day PDF export failed',error?.message||'PDF error');window.alert(tr('failed'))}finally{working=false;sync()}}
document.addEventListener('bamco:render',sync);new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});window.BAMCO_DAY_PDF={collect,create};sync();
})();
