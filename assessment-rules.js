(function(root){'use strict';
const staticNames=['فرآیند و طراحی برای تولید','سبک و طراحی ظاهری','هزینه و اقتصاد محصول'];
const canonical=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').trim();
function isStatic(test){return staticNames.some(name=>canonical(test.cat)===name)}
function scopeFor(test){return [...((test.scope||[]).includes('drive')?['drive']:[]),isStatic(test)?'supplementary':'durability']}
function apply(test){return {...test,scope:scopeFor(test)}}
const api={staticNames,isStatic,scopeFor,apply};
if(typeof module==='object'&&module.exports)module.exports=api;else{root.BAMCO_ASSESSMENT_RULES=api;if(root.BAMCO_DATA)root.BAMCO_DATA.tests=root.BAMCO_DATA.tests.map(apply)}
})(typeof window==='object'?window:globalThis);
