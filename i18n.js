(function(){
'use strict';
const catalogs=window.BAMCO_TRANSLATIONS||{en:{},zh:{}};
const nodeSources=new WeakMap(),attributeSources=new WeakMap(),reverse=new Map();
for(const lang of ['en','zh'])for(const [source,target] of Object.entries(catalogs[lang]))if(target)reverse.set(target.trim(),source);
let language='fa';try{const saved=localStorage.getItem('bamco-assessment-language');if(['en','zh'].includes(saved))language=saved}catch{}
const digits=s=>String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const canonical=s=>reverse.get(s.trim())||s;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const keys=Object.keys(catalogs.en).filter(k=>k.length>1&&/[\u0621-\u06ff]/.test(k)).sort((a,b)=>b.length-a.length);
const fragments=new RegExp(keys.map(k=>(/^[\u0621-\u06ff]+$/.test(k)?'(?<![\\u0621-\\u06ff])'+escape(k)+'(?![\\u0621-\\u06ff])':escape(k))).join('|')||'(?!)','g');
function text(value,lang=language){
 const source=String(value??'');if(lang==='fa')return source;
 const table=catalogs[lang],trim=source.trim();
 if(table[trim])return digits(source.replace(trim,table[trim]));
 return digits(source.replace(/روز\s+([0-9۰-۹]+)/g,(_,n)=>lang==='zh'?'第'+digits(n)+'天':'Day '+digits(n)).replace(fragments,match=>table[match]||match)).replace(/،/g,lang==='zh'?'，':',').replace(/٪/g,'%').replace(/←/g,'→').replace(/。\./g,'。');
}
const excluded='.report-user-text,script,style,textarea,input,code,#assessmentName,.assessment-row-title,.assessment-map-popup strong,.bamco-summary-item strong:not([data-i18n-static]),.bamco-custom-question h3,.bamco-custom-question .test-conditions dd,.user-authored h3,.user-authored .test-conditions dd';
function formatDigits(value,lang=language){
 const latin=digits(value).replace(/٫/g,'.').replace(/٬/g,',');
 return lang==='fa'?latin.replace(/[0-9]/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)]):latin;
}
function localizeNumericInputs(){
 document.querySelectorAll('input[data-numeric],#durDays,#bamco-day-form input[name="date"],#bamco-day-form input[name="startTime"],#bamco-day-form input[name="endTime"],#bamco-day-form input[name="breakdownTime"]').forEach(input=>{
  const next=formatDigits(input.value);if(next===input.value)return;
  const focused=document.activeElement===input,start=input.selectionStart,end=input.selectionEnd;
  input.value=next;
  if(focused&&start!==null)input.setSelectionRange(start,end);
 });
}
let observer;
function apply(){
 observer?.disconnect();
 const root=document.documentElement;
 const direction=language==='fa'?'rtl':'ltr';
 if(root.lang!==language)root.lang=language;
 if(root.dir!==direction)root.dir=direction;
 document.querySelectorAll('select option').forEach(o=>{if(!o.hasAttribute('value'))o.setAttribute('value',canonical(o.textContent))});
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement?.closest(excluded))continue;
  let state=nodeSources.get(node);if(!state||node.nodeValue!==state.last)state={source:canonical(node.nodeValue),last:null};
  const result=text(state.source);if(node.nodeValue!==result)node.nodeValue=result;state.last=result;nodeSources.set(node,state);
 }
 localizeNumericInputs();
 document.querySelectorAll('iframe.map-frame').forEach(frame=>{const url=new URL(frame.src);const target=language==='zh'?'zh-CN':language;if(url.searchParams.get('hl')!==target){url.searchParams.set('hl',target);frame.src=url.href}});
 document.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el=>{
  if(el.closest('script,style,#assessmentName,.assessment-row-title'))return;
  let states=attributeSources.get(el)||{};
  for(const name of ['placeholder','title','aria-label','alt'])if(el.hasAttribute(name)){
   const value=el.getAttribute(name);let state=states[name];if(!state||value!==state.last)state={source:canonical(value)};
   state.last=text(state.source);if(value!==state.last)el.setAttribute(name,state.last);states[name]=state;
  }attributeSources.set(el,states);
 });
 observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
}
for(const type of [HTMLInputElement,HTMLSelectElement,HTMLTextAreaElement]){
 const original=type.prototype.setCustomValidity;
 type.prototype.setCustomValidity=function(message){return original.call(this,text(message))};
}
const originalConfirm=window.confirm.bind(window),originalPrompt=window.prompt.bind(window),originalAlert=window.alert.bind(window);
window.confirm=message=>originalConfirm(text(message));window.prompt=(message,value)=>originalPrompt(text(message),value);window.alert=message=>originalAlert(text(message));
document.addEventListener('input',localizeNumericInputs);document.addEventListener('change',localizeNumericInputs);
window.BAMCO_I18N={text,apply,formatDigits,get language(){return language},setLanguage(value){language=['fa','en','zh'].includes(value)?value:'fa';apply()}};
observer=new MutationObserver(apply);apply();
})();
