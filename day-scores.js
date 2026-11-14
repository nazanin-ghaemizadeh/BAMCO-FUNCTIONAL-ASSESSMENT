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

function groupByCategory(items) {
  const categories = new Map();
  for (const test of items) {
    if (!categories.has(test.cat)) categories.set(test.cat, new Map());
    const subcategories = categories.get(test.cat);
    if (!subcategories.has(test.sub)) subcategories.set(test.sub, []);
    subcategories.get(test.sub).push(test);
  }
  return Array.from(categories.values()).flatMap(subcategories => Array.from(subcategories.values()).flat());
}

function exportName(data) {
  const title = [...String(data.title || '')].map(c =>
    c.charCodeAt(0) < 32 || '/\\:*?"<>|'.includes(c) ? '-' : c
  ).join('').trim() || 'BAMCO';
  const module = data.context.tab === 'drive' ? 'driveability' : 'durability';
  return title + '-' + module + '-day-' + data.context.day + '-scores.xlsx';
}

async function build(Excel, data) {
  const book = new Excel.Workbook();
  const moduleName = data.context.tab === 'drive' ? 'قابلیت رانندگی' : 'دوام';
  const info = [data.title, moduleName, 'روز ' + data.context.day, reportDate(data.date)].filter(Boolean).join(' | ');
  book.creator = 'BAMCO';
  book.title = info;
  const items = groupByCategory(data.items);
  const colors = new Map([...new Set(items.map(t => t.cat))].map((cat,i) => [cat,palette[i % palette.length]]));
  const edge = {style:'thin', color:{argb:'FFD2E2DA'}};
  const border = {top:edge, bottom:edge, left:edge, right:edge};
  const fill = color => ({type:'pattern', pattern:'solid', fgColor:{argb:color}});
  const middle = {vertical:'middle', wrapText:true};
  const centered = {...middle, horizontal:'center'};
  const right = {...middle, horizontal:'right'};

  function sheet(name, tableName, headers, widths, tests, values) {
    const scores = tableName === 'DayScores';
    const face = scores ? 'B Nazanin' : 'Tahoma';
    const headingFont = size => ({name:face, size, bold:true, color:{argb:'FFFFFFFF'}});
    const ws = book.addWorksheet(name, {
      views:[{rightToLeft:true, state:'frozen', ySplit:headerRow}],
      properties:{defaultRowHeight:34.05}
    });
    ws.columns = widths.map(width => ({width, style:{font:{name:face, size:11}}}));
    ws.mergeCells(1, 1, 1, headers.length);
    const banner = ws.getCell('A1');
    banner.value = info;
    banner.font = headingFont(scores ? 14 : 11);
    banner.fill = fill(headerGreen);
    banner.alignment = centered;
    banner.border = scores ? {left:edge, right:edge, top:edge} : border;
    ws.getRow(1).height = 36;

    const rows = tests.map((t,i) => [i+1,t.cat || '',t.sub || '',t.name || '',...values(t)]);
    ws.addTable({
      name:tableName, ref:'A'+headerRow, headerRow:true,
      style:{theme:null, showRowStripes:false}, columns:headers.map(name => ({name, filterButton:true})), rows
    });
    const headings = ws.getRow(headerRow);
    headings.height = 31.95;
    headings.eachCell(cell => {
      cell.font = headingFont(11);
      cell.fill = fill(headerGreen);
      cell.alignment = scores ? centered : right;
      cell.border = border;
    });
    rows.forEach((values,i) => {
      const row = ws.getRow(firstDataRow+i);
      const test = tests[i];
      const lines = Math.max(...values.map((v,col) => String(v ?? '').split('\n')
        .reduce((n,line) => n + Math.max(1, Math.ceil(line.length / widths[col])), 0)));
      row.height = Math.min(409, Math.max(54, lines*15+6));
      headers.forEach((_,col) => {
        const cell = row.getCell(col+1);
        cell.font = {name:face, size:scores ? 12 : 11, color:{argb:test.custom ? 'FFFF0000' : 'FF214439'}};
        cell.fill = fill(colors.get(test.cat));
        cell.alignment = scores ? (col === 0 || col === 4 ? centered : middle) : right;
        cell.border = border;
      });
    });
    ws.pageSetup = {orientation:'landscape', paperSize:9, fitToPage:true, fitToWidth:1, fitToHeight:0, printTitlesRow:'1:'+headerRow};
    return ws;
  }

  sheet('امتیازها', 'DayScores', ['ردیف','شاخص','زیرشاخص','آزمون','نمره از ۱۰'], [8.88671875,32,38,80,16], items,
    t => [Number(t.score)>=1 && Number(t.score)<=10 ? Number(t.score) : null]);
  const evidence = items.filter(t => t.note || t.photo);
  const attachments = sheet('توضیحات و تصاویر', 'DayEvidence', ['ردیف','شاخص','زیرشاخص','آزمون','یادداشت ارزیاب','تصویر'],
    [8.88671875,32,38,65,80,36], evidence, t => [t.note || '', t.photo ? 'تصویر پیوست' : '']);
  evidence.forEach((test,i) => {
    if (!test.photo) return;
    const match = test.photo.match(/^data:image\/(png|jpe?g);base64,/i);
    if (!match) throw Error('Unsupported evidence image');
    const image = book.addImage({base64:test.photo, extension:match[1].toLowerCase()==='png' ? 'png' : 'jpeg'});
    const row = attachments.getRow(firstDataRow+i);
    row.height = Math.max(112.05, row.height);
    attachments.addImage(image, {
      tl:{nativeCol:5, nativeColOff:28800, nativeRow:row.number-1, nativeRowOff:89600},
      // Two-cell anchors support editAs and keep the 200 × 135 px image attached to this row.
      br:{nativeCol:5, nativeColOff:28800+200*9525, nativeRow:row.number-1, nativeRowOff:89600+135*9525},
      editAs:'oneCell'
    });
  });
  return new Blob([await book.xlsx.writeBuffer()], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function download(){if(exporting)return;const data=collect();if(!data)return;exporting=true;sync();try{await app.waitForImages?.();const latest=collect();if(latest?.context.key!==data.context.key)throw Error('Page changed');const Excel=await excelLibrary(),blob=await build(Excel,latest);app.exportFile(blob,exportName(latest),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}catch(error){console.error('Day Excel failed',error?.message);window.alert(tr('exportFailed'))}finally{exporting=false;sync()}}
document.addEventListener('bamco:render',sync);new MutationObserver(sync).observe($('questionsPanel'),{childList:true});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});window.BAMCO_DAY_SCORES={collect,build,save};sync();
})();
