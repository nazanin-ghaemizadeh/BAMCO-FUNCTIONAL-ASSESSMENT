(()=>{'use strict';
const app=window.BAMCO_ASSESSMENT,$=id=>document.getElementById(id);
const copy={save:['ذخیره امتیازها','Save scores','保存评分'],saving:['در حال ذخیره…','Saving…','正在保存…'],saved:['امتیازها و یادداشت‌ها در سرور ذخیره شدند.','Scores and notes saved to server.','评分和备注已保存到服务器。'],local:['اطلاعات در این مرورگر ذخیره شد.','Saved in this browser.','已保存在此浏览器。'],failed:['ذخیره تأیید نشد. از صفحه خارج نشوید و دوباره ذخیره را بزنید.','Save was not confirmed. Stay on this page and retry.','保存未确认，请留在此页并重试。'],excel:['دانلود اکسل امتیازهای این روز','Download this day’s scores as Excel','下载当天评分Excel'],exportFailed:['ساخت اکسل انجام نشد؛ دوباره تلاش کنید.','Excel export failed. Please retry.','Excel导出失败，请重试。']};
const lang=()=>window.BAMCO_I18N?.language||'fa',tr=k=>copy[k][lang()==='fa'?0:lang()==='zh'?2:1];
let saving=false,exporting=false,library;
function collect(){const c=app.dayContext?.();if(c?.section!=='scores')return null;const snap=app.snapshot(),meta=snap.missions?.[c.key]||{},items=app.currentTests().map(t=>({...t,...snap.records?.[c.key+':'+t.id],custom:false}));for(const t of meta.customTests||[])items.push({...t,custom:true});return {context:{...c},title:window.BAMCO_CASES?.current()?.title||$('assessmentName')?.textContent||'BAMCO',date:meta.date||'',items:structuredClone(items)}}
function sync(){const c=app.dayContext?.(),active=c?.section==='scores',bar=$('assessmentPageActions');let icon=$('dayScoresExcel');if(!active){icon?.remove();$('dayScoresSave')?.remove();return}
 if(bar&&!icon){icon=document.createElement('button');icon.id='dayScoresExcel';icon.type='button';icon.className='secondary';icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 4v14H7zM17 3v5h4M3 8h11v11H3zM6 11l5 5m0-5-5 5"/></svg>';icon.onclick=download;const pdf=$('dayQuestionsPdf');if(pdf)pdf.insertAdjacentElement('afterend',icon);else bar.append(icon)}
 if(icon){icon.title=tr('excel');icon.setAttribute('aria-label',tr('excel'));icon.disabled=exporting;icon.setAttribute('aria-busy',String(exporting))}
 let controls=$('dayScoresSave');
 if(app.isReadOnly()){controls?.remove();return}
 if(bar&&!controls){
   controls=document.createElement('div');
   controls.id='dayScoresSave';
   const button=document.createElement('button');button.type='button';button.className='primary';button.onclick=save;
   const status=document.createElement('span');status.setAttribute('role','status');
   controls.append(button,status);
   bar.insertBefore(controls,$('dayQuestionsPdf')||icon||null);
 }
 if(!controls)return;
 const saveButton=controls.firstElementChild;
 const label=tr(saving?'saving':'save');
 if(saveButton.textContent!==label)saveButton.textContent=label;
 saveButton.disabled=saving;
 saveButton.setAttribute('aria-busy',String(saving));
}
async function save(){if(saving||app.isReadOnly())return;const c=app.dayContext?.(),caseId=window.BAMCO_CASES?.current()?.id;saving=true;sync();const status=$('dayScoresSave')?.lastElementChild;if(status)status.textContent=tr('saving');try{await app.waitForImages?.();if(app.dayContext?.()?.key!==c?.key||window.BAMCO_CASES?.current()?.id!==caseId)throw Error('Page changed');const remote=window.BAMCO_CASES?.saveNow;const ok=remote?await remote(app.snapshot()):await app.saveNow();if(!ok)throw Error('Save not confirmed');if(app.dayContext?.()?.key===c?.key&&window.BAMCO_CASES?.current()?.id===caseId&&status?.isConnected)status.textContent=tr(remote?'saved':'local')}catch(error){if(status?.isConnected)status.textContent=['overlap','unavailable'].includes(window.BAMCO_CASES?.saveStatus?.())?'':tr('failed')}finally{saving=false;sync()}}
async function excelLibrary(){if(window.ExcelJS)return window.ExcelJS;if(!library)library=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=()=>resolve(window.ExcelJS);s.onerror=()=>{library=null;s.remove();reject(Error('Excel unavailable'))};document.head.append(s)});return library}
const palette=['FFE5F2EB','FFE6EFF9','FFF7EBD9','FFEFE7F7','FFF9E4E8','FFE1F2F3','FFF0F1DA','FFE8E9F7','FFF5E7DC','FFDDEEE3','FFE3EDF2','FFF3E3F1','FFDFE8E0','FFF4EFDC','FFE3E3E3'];
async function build(Excel,data){const book=new Excel.Workbook();book.creator='BAMCO';book.created=new Date();book.title=data.title+' | '+data.context.tab+' | '+data.context.day;const colors=new Map([...new Set(data.items.map(t=>t.cat))].map((cat,i)=>[cat,palette[i%palette.length]]));
 const info=data.title+' | '+(data.context.tab==='drive'?'قابلیت رانندگی':'دوام')+' | روز '+data.context.day+(data.date?' | '+data.date:'');
 const scored=data.items.map((t,i)=>[i+1,t.cat||'',t.sub||'',t.name||'',Number(t.score)>=1&&Number(t.score)<=10?Number(t.score):null,t.custom?'تکمیلی':'برنامه روز']);
 const evidence=data.items.filter(t=>t.note||t.photo);
 function sheet(name,headers,widths,rows,cats){const ws=book.addWorksheet(name,{views:[{rightToLeft:true,state:'frozen',ySplit:4}],properties:{defaultRowHeight:34}});ws.columns=widths.map(width=>({width}));ws.mergeCells(1,1,1,headers.length);ws.getCell(1,1).value=info;ws.getRow(1).height=36;ws.getCell(1,1).font={name:'Tahoma',size:13,bold:true,color:{argb:'FF1D624F'}};ws.mergeCells(2,1,2,headers.length);ws.getCell(2,1).value='تعداد آزمون‌ها: '+data.items.length+' | دارای نمره: '+data.items.filter(t=>Number(t.score)>=1&&Number(t.score)<=10).length;ws.getRow(2).height=26;
 ws.addTable({name:name==='امتیازها'?'DayScores':'DayEvidence',ref:'A4',headerRow:true,style:{theme:null,showRowStripes:false},columns:headers.map(name=>({name,filterButton:true})),rows});
 ws.eachRow((row,n)=>{row.eachCell({includeEmpty:true},cell=>{cell.alignment={horizontal:'right',vertical:'middle',wrapText:true};if(n>=4){cell.font={name:'Tahoma',size:11,bold:n===4,color:{argb:n===4?'FFFFFFFF':'FF214439'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:n===4?'FF216C56':colors.get(cats[n-5])||'FFF8FBF9'}};cell.border={top:{style:'thin',color:{argb:'FFD2E2DA'}},bottom:{style:'thin',color:{argb:'FFD2E2DA'}},left:{style:'thin',color:{argb:'FFD2E2DA'}},right:{style:'thin',color:{argb:'FFD2E2DA'}}}}});if(n===4)row.height=32;else if(n>4)row.height=Math.min(360,Math.max(54,Math.ceil(String(rows[n-5]?.[4]||'').length/65)*15))});ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:4'};return ws}
 sheet('امتیازها',['ردیف','شاخص','زیرشاخص','آزمون','نمره از ۱۰','نوع آزمون'],[9,32,38,80,16,20],scored,data.items.map(t=>t.cat));
 const attachments=sheet('توضیحات و تصاویر',['ردیف','شاخص','زیرشاخص','آزمون','یادداشت ارزیاب','تصویر'],[9,32,38,65,80,36],evidence.map((t,i)=>[i+1,t.cat||'',t.sub||'',t.name||'',t.note||'',t.photo?'تصویر پیوست':'']),evidence.map(t=>t.cat));
 for(let i=0;i<evidence.length;i++){const t=evidence[i];if(!t.photo)continue;const match=t.photo.match(/^data:image\/(png|jpeg|jpg);base64,/i);if(!match)throw Error('Unsupported evidence image');const image=book.addImage({base64:t.photo,extension:match[1].toLowerCase()==='png'?'png':'jpeg'});const row=i+5;attachments.getRow(row).height=Math.max(112,Math.min(360,Math.ceil(String(t.note||'').length/65)*15));attachments.addImage(image,{tl:{col:5.08,row:row-1+.08},ext:{width:200,height:135},editAs:'oneCell'})}
 return new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function download(){if(exporting)return;const data=collect();if(!data)return;exporting=true;sync();try{await app.waitForImages?.();const latest=collect();if(latest?.context.key!==data.context.key)throw Error('Page changed');const Excel=await excelLibrary(),blob=await build(Excel,latest);app.exportFile(blob,'BAMCO-'+data.context.tab+'-day-'+data.context.day+'-scores.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}catch(error){console.error('Day Excel failed',error?.message);window.alert(tr('exportFailed'))}finally{exporting=false;sync()}}
document.addEventListener('bamco:render',sync);new MutationObserver(sync).observe($('questionsPanel'),{childList:true});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});window.BAMCO_DAY_SCORES={collect,build,save};sync();
})();
