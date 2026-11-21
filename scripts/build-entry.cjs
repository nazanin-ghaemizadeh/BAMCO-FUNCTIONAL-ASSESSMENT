// Publish the entry controller and first-paint styles in the initial HTML response.
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const document = new JSDOM(html).window.document;
const { body, documentElement, head } = document;
const header = body.querySelector('.app-header');
const main = body.querySelector('main');
main.replaceChildren(document.getElementById('landing'));
body.replaceChildren(header, main);
head.replaceChildren();
const sheets = [...new JSDOM(html).window.document.querySelectorAll('[data-shell-style]')];

function used(selector) {
  if (selector === '.hidden') return true;
  const normal = selector.replace(/::?(?:before|after)\b|:(?:hover|active|focus-visible|focus)\b/g, '');
  return ['fa','en','zh'].some(lang => {
    documentElement.lang = lang;
    documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    return Boolean(document.querySelector(normal));
  });
}
function critical(rules) {
  return [...rules].map(rule => {
    if (rule.selectorText) return used(rule.selectorText) ? rule.cssText : '';
    if (rule.media) {
      const children = critical(rule.cssRules);
      return children ? '@media '+rule.conditionText+'{'+children+'}' : '';
    }
    return rule.type === 5 && rule.cssText.includes('Assessment Latin') ? rule.cssText : '';
  }).filter(Boolean).join('\n');
}
const css = sheets.map(link => {
  const source = document.createElement('style');
  source.textContent = fs.readFileSync(link.getAttribute('href').split('?')[0], 'utf8');
  head.append(source);
  return critical(source.sheet.cssRules);
}).join('\n');
const entry = fs.readFileSync('assessment-workspace.js','utf8').replace(/<\/script/gi,'<\\/script');
function withController(source) {
  const portal = fs.readFileSync('portal-login.html','utf8');
  source = source.replace(/<!--portal-markup-->[\s\S]*?<!--\/portal-markup-->/,()=> '<!--portal-markup-->\n'+portal+'<!--/portal-markup-->');
  for(const [id,file,tag] of [['shared-dropdown-styles','dropdowns.css','style'],['shared-dropdowns','dropdowns.js','script'],['portal-styles','portal.css','style'],['portal-runtime','portal.js','script']]) {
    const pattern=new RegExp('(<'+tag+' id="'+id+'">)[\\s\\S]*?(</'+tag+'>)');
    source=source.replace(pattern,(_,open,close)=>open+'\n'+fs.readFileSync(file,'utf8')+close);
  }
  return source.replace(/(<script id="workspace-entry">)[\s\S]*?(<\/script>)/, (_,open,close)=>open+'\n'+entry+close);
}
const landing = withController(html).replace(/(<style id="landing-critical">)[\s\S]*?(<\/style>)/, (_,open,close)=>open+'\n'+css+'\n'+close);
const sharedHeader = /<header class="app-header">[\s\S]*?<\/header>/;
const caseSource = fs.readFileSync('case.html','utf8');
const casePage = withController(caseSource.replace(sharedHeader,()=>html.match(sharedHeader)[0]));
const release = require('./release-assets.cjs')({'index.html': landing, 'case.html': casePage});
for (const [path,original,result] of [['index.html',html,release.pages['index.html']],['case.html',caseSource,release.pages['case.html']],['release.json',fs.existsSync('release.json') ? fs.readFileSync('release.json','utf8') : '',release.manifest]]) {
  if (process.argv.includes('--check')) {
    if (original!==result) throw new Error('Run npm run build:entry to refresh '+path);
  } else fs.writeFileSync(path,result);
}
