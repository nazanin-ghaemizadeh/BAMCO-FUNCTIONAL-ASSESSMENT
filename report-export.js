(function(){
'use strict';
async function png(svg,font){
 const source=new DOMParser().parseFromString(svg,'image/svg+xml'),root=source.documentElement;
 if(source.querySelector('parsererror'))throw Error('Invalid chart');
 const box=root.getAttribute('viewBox').split(/\s+/).map(Number),width=box[2],height=box[3];
 root.setAttribute('width',width);root.setAttribute('height',height);root.style.fontFamily=font;
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(source)],{type:'image/svg+xml;charset=utf-8'}));
 try{const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url}),canvas=document.createElement('canvas'),scale=Math.min(2,6000/width);canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);return {data:canvas.toDataURL('image/png'),width,height}}finally{URL.revokeObjectURL(url)}
}
async function build(Excel,sheets,charts,{rtl=false,font='serif'}={}){
 const book=new Excel.Workbook();book.creator='BAMCO';book.created=new Date();
 for(const data of sheets){const sheet=book.addWorksheet(data.name,{views:[{rightToLeft:rtl,state:'frozen',ySplit:1}]});sheet.columns=(data.widths||data.rows[0].map(()=>24)).map(width=>({width}));sheet.addRows(data.rows);sheet.eachRow((row,index)=>{row.height=index===1?34:42;row.eachCell(cell=>{cell.font={name:'Times New Roman',size:12,color:{argb:index===1?'FFFFFFFF':'FF173E62'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:index===1?'FF204E70':index%2?'FFF4F8FB':'FFFFFFFF'}};cell.border={bottom:{style:'thin',color:{argb:'FFDCE7EE'}}}})});for(const col of data.percentCols||[])sheet.getColumn(col+1).numFmt='0.0%';sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:data.rows[0].length}}}
 const sheet=book.addWorksheet('Charts',{views:[{rightToLeft:rtl}]});sheet.columns=Array.from({length:18},()=>({width:12}));let row=1;
 await document.fonts?.ready;
 for(const chart of charts){const bitmap=await png(chart.svg,font),width=Math.min(1400,bitmap.width),height=width/bitmap.width*bitmap.height;sheet.mergeCells(row,1,row,18);sheet.getCell(row,1).value=chart.name;sheet.getCell(row,1).font={name:'Times New Roman',size:16,bold:true,color:{argb:'FF173E62'}};sheet.getCell(row,1).alignment={horizontal:'center'};sheet.getRow(row).height=32;const image=book.addImage({base64:bitmap.data,extension:'png'});sheet.addImage(image,{tl:{col:0,row},ext:{width,height},editAs:'oneCell'});row+=Math.ceil(height/20)+4;}
 return new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
window.BAMCO_REPORT_EXPORT={build};
})();
