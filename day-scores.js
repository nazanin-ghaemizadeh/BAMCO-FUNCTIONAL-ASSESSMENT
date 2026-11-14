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
const reportFont = 'B Nazanin';
const headerGreen = 'FF216C56';
const headerRow = 2;
const firstDataRow = headerRow + 1;

function reportDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const latin = raw.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(latin);
  if (iso && Number(iso[1]) >= 1700) {
    const date = new Date(latin + 'T12:00:00Z');
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'
      }).format(date);
    }
  }
  return latin.replace(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
    (_,year,month,day) => [year,month.padStart(2,'0'),day.padStart(2,'0')].join('/'))
    .replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
}

async function build(Excel,data){const book=new Excel.Workbook();book.creator='BAMCO';book.created=new Date();book.title=data.title+' | '+data.context.tab+' | '+data.context.day;const colors=new Map([...new Set(data.items.map(t=>t.cat))].map((cat,i)=>[cat,palette[i%palette.length]]));
 const moduleName = data.context.tab === 'drive' ? 'قابلیت رانندگی' : 'دوام';
 const info = [data.title, moduleName, 'روز ' + data.context.day, reportDate(data.date)].filter(Boolean).join(' | ');
 const scored=data.items.map((t,i)=>[i+1,t.cat||'',t.sub||'',t.name||'',Number(t.score)>=1&&Number(t.score)<=10?Number(t.score):null,t.custom?'تکمیلی':'برنامه روز']);
 const evidence=data.items.filter(t=>t.note||t.photo);
 function sheet(name, headers, widths, rows, categories) {
   const ws = book.addWorksheet(name, {
     views: [{rightToLeft:true, state:'frozen', ySplit:headerRow, showGridLines:false}],
     properties: {defaultRowHeight:26, tabColor:{argb:headerGreen}}
   });
   ws.columns = widths.map(width => ({width, style:{font:{name:reportFont, size:14}}}));
   const fill = color => ({type:'pattern', pattern:'solid', fgColor:{argb:color}});
   const headingFont = size => ({name:reportFont, size, bold:true, color:{argb:'FFFFFFFF'}});
   const centered = {horizontal:'center', vertical:'middle', readingOrder:'rtl', wrapText:true};
   ws.mergeCells(1, 1, 1, headers.length);
   const banner = ws.getCell(1, 1);
   banner.value = info;
   banner.font = headingFont(17);
   banner.fill = fill(headerGreen);
   banner.alignment = centered;
   ws.getRow(1).height = 34;

   ws.addTable({
     name: name === 'امتیازها' ? 'DayScores' : 'DayEvidence', ref:'A'+headerRow, headerRow:true,
     style:{theme:null, showRowStripes:false}, columns:headers.map(name => ({name, filterButton:true})), rows
   });
   const edge = {style:'thin', color:{argb:'FFD2E2DA'}};
   const border = {top:edge, bottom:edge, left:edge, right:edge};
   const headings = ws.getRow(headerRow);
   headings.height = 29;
   headings.eachCell(cell => {
     cell.font = headingFont(14);
     cell.fill = fill(headerGreen);
     cell.alignment = centered;
     cell.border = {bottom:{style:'thin',color:{argb:'FF174A3C'}}};
   });
   rows.forEach((values, i) => {
     const row = ws.getRow(firstDataRow + i);
     const lines = Math.max(...values.map((value, col) => String(value ?? '').split('\n')
       .reduce((count,line) => count + Math.max(1, Math.ceil(line.length / (widths[col] * 0.85))), 0)));
     row.height = Math.min(400, Math.max(32, lines * 19 + 8));
     headers.forEach((_, col) => {
       const cell = row.getCell(col + 1);
       cell.font = {name:reportFont, size:14, color:{argb:'FF214439'}};
       cell.fill = fill(colors.get(categories[i]) || 'FFF8FBF9');
       cell.alignment = {...centered, horizontal:col === 0 || typeof values[col] === 'number' ? 'center' : 'right'};
       cell.border = border;
     });
   });
   ws.pageSetup = {orientation:'landscape', paperSize:9, fitToPage:true, fitToWidth:1, fitToHeight:0, printTitlesRow:'1:'+headerRow};
   return ws;
 }
 sheet('امتیازها',['ردیف','شاخص','زیرشاخص','آزمون','نمره از ۱۰','نوع آزمون'],[9,32,38,80,16,20],scored,data.items.map(t=>t.cat));
 const attachments=sheet('توضیحات و تصاویر',['ردیف','شاخص','زیرشاخص','آزمون','یادداشت ارزیاب','تصویر'],[9,32,38,65,80,36],evidence.map((t,i)=>[i+1,t.cat||'',t.sub||'',t.name||'',t.note||'',t.photo?'تصویر پیوست':'']),evidence.map(t=>t.cat));
 for(let i=0;i<evidence.length;i++){const t=evidence[i];if(!t.photo)continue;const match=t.photo.match(/^data:image\/(png|jpeg|jpg);base64,/i);if(!match)throw Error('Unsupported evidence image');const image=book.addImage({base64:t.photo,extension:match[1].toLowerCase()==='png'?'png':'jpeg'});const row=firstDataRow+i;attachments.getRow(row).height=Math.max(120,attachments.getRow(row).height);attachments.addImage(image,{tl:{col:5.08,row:row-1+.08},ext:{width:200,height:135},editAs:'oneCell'})}
 return new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function download(){if(exporting)return;const data=collect();if(!data)return;exporting=true;sync();try{await app.waitForImages?.();const latest=collect();if(latest?.context.key!==data.context.key)throw Error('Page changed');const Excel=await excelLibrary(),blob=await build(Excel,latest);app.exportFile(blob,'BAMCO-'+data.context.tab+'-day-'+data.context.day+'-scores.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}catch(error){console.error('Day Excel failed',error?.message);window.alert(tr('exportFailed'))}finally{exporting=false;sync()}}
document.addEventListener('bamco:render',sync);new MutationObserver(sync).observe($('questionsPanel'),{childList:true});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});window.BAMCO_DAY_SCORES={collect,build,save};sync();
})();
