(() => {
'use strict';

const $ = id => document.getElementById(id);
const hub = $('assessmentHub');
const editor = $('assessmentEditorBar');
const welcome = hub?.firstElementChild ? [...hub.children].map(el=>el.cloneNode(true)) : [];
let app = window.BAMCO_ASSESSMENT;
const portal=window.BAMCO_PORTAL;
const can=permission=>permission==='questions'?Boolean(portal.user):portal.can(permission);
const requestRpc=(name,args={})=>portal.rpc(name,args);
const types=['drive','durability','static','comprehensive'];
const canCreate=()=>can('active')&&can('setup');
const canTrack=type=>(!type||type==='drive'||type==='durability')&&(type?can(type):can('drive')||can('durability'));
const canOpenCase=type=>can('setup')||can('results')||(type?can(type):types.some(can));
const listCache=new Map(),listRequests=new Map();
let listEpoch=0;
const externalScripts=new Map();
function loadExternal(url){
 if(externalScripts.has(url))return externalScripts.get(url);
 const pending=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('Could not load service'));document.head.append(script)}).catch(error=>{externalScripts.delete(url);throw error});
 externalScripts.set(url,pending);return pending;
}
const styleLoads = new Map();
function loadStyles(group) {
  return Promise.all([...document.querySelectorAll('link[data-style="'+group+'"]')].map(link=>{
    if (styleLoads.has(link)) return styleLoads.get(link);
    const pending = new Promise((resolve,reject)=>{
      link.onload = resolve;
      link.onerror = () => reject(new Error('Stylesheet unavailable'));
      link.rel = 'stylesheet';
      link.href = link.dataset.href;
    }).catch(error=>{
      link.removeAttribute('href');
      link.removeAttribute('rel');
      styleLoads.delete(link);
      throw error;
    });
    styleLoads.set(link,pending);
    return pending;
  }));
}

let editorLoad;
function loadEditor() {
  if (app) return Promise.resolve(app);
  if (!editorLoad) {
    window.BAMCO_TRANSLATIONS ??= {en:{},zh:{}};
    const scripts = [...$('caseAssets').content.querySelectorAll('script[src]')];
    // Fetch in parallel while preserving initialization order and retrying only failed files.
    const hints = scripts.map(source=>{
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = source.getAttribute('src');
      document.head.append(link);
      return link;
    });
    const initialize = async () => {
      for (const source of scripts) {
        if (source.getAttribute('src').startsWith('./app.js')) await window.BAMCO_QUESTION_BANK.load();
        await loadExternal(source.getAttribute('src'));
      }
      if (!window.BAMCO_ASSESSMENT) throw new Error('Editor unavailable');
    };
    editorLoad = Promise.all([initialize(),loadStyles('case'),loadStyles('map')])
      .then(()=>app=window.BAMCO_ASSESSMENT)
      .catch(error=>{editorLoad=null;throw error})
      .finally(()=>hints.forEach(link=>link.remove()));
  }
  return editorLoad;
}

function loadDictionary(lang) {
  const source = $('caseDictionaries').content.querySelector('[data-locale="'+lang+'"]');
  return source ? loadExternal(source.getAttribute('src')) : Promise.resolve();
}
const labels = {
  opening:['در حال باز کردن پرونده…','Opening vehicle case…','正在打开车辆档案…'],
  caseError:['پرونده باز نشد. دوباره تلاش کنید.','Could not open this case. Please try again.','无法打开此档案，请重试。'],
  brandName:['خودروسازان بم','Bam Automobile Company','巴姆汽车公司'],
  brandTitle:['ارزیابی عملکرد و دوام خودرو','Vehicle Performance and Durability Assessment','整车性能与耐久性评估'],
  brandAlt:['نشان خودروسازان بم','Bam Automobile Company logo','巴姆汽车公司标志'],
  language:['انتخاب زبان','Choose language','选择语言'],
  welcomeBefore:['کیفیت از ','Quality starts with ','品质源于'],
  welcomeAccent:['ارزیابی دقیق','precise assessment','精准评估'],
  welcomeAfter:[' آغاز می‌شود.','.','。'],
  activeCta:['ورود به ارزیابی‌ها','View active assessments','查看进行中的评估'],
  historyCta:['مشاهده نتایج ثبت‌شده','Browse completed assessments','查看已完成的评估'],
  evaluatorCta:['ثبت و مدیریت ارزیابی','Record and manage assessments','记录和管理评估'],
  observerCta:['مشاهده موقعیت خودرو','View vehicle location','查看车辆位置'],
  weighting:['وزن‌دهی','Weighting','权重设置'],
  weightingCta:['وزن‌دهی زیرشاخص‌ها','Subcriterion weights','子指标权重'],
  questions:['بانک سؤالات','Question bank','题库'],
  questionsCta:['مشاهده، ویرایش و زمان‌بندی آزمون‌ها','View, edit and schedule tests','查看、编辑和安排测试'],
  newAssessmentCta:['ایجاد پرونده و انتخاب نوع ارزیابی','Create a case and choose assessment type','创建档案并选择评估类型'],
  active:['ارزیابی‌های فعال','Active assessments','进行中的评估'],
  history:['تاریخچه ارزیابی‌ها','Assessment history','评估历史'],
  evaluator:['ارزیاب','Evaluator','评估员'],
  observer:['نظارت بر موقعیت مکانی','Location Monitoring','位置监控'],
  back:['بازگشت','Back','返回'],
  create:['ایجاد آزمون','Create test','创建试验'],
  name:['عنوان ارزیابی','Assessment title','评估名称'],
  open:['باز کردن','Open','打开'],
  rename:['ویرایش نام','Rename','重命名'],
  finish:['پایان ارزیابی','Complete assessment','完成评估'],
  reopen:['بازگشایی','Reopen','重新开启'],
  remove:['حذف ارزیابی','Delete assessment','删除评估'],
  confirm:['ارزیابی و داده‌های آن برای همیشه حذف شوند؟','Permanently delete the assessment and its data?','永久删除此评估及其数据？'],
  empty:['ارزیابی‌ای در این بخش وجود ندارد.','There are no assessments here.','此处暂无评估。'],
  load:['در حال اتصال…','Connecting…','正在连接…'],
  error:['ارتباط با سامانه برقرار نشد.','Could not connect to the service.','无法连接到服务。'],
  retry:['تلاش دوباره','Retry','重试'],
  saving:['در حال ذخیره…','Saving…','正在保存…'],
  saved:['','',''],
  unsaved:['تغییرات ذخیره نشد. دوباره تلاش کنید.','Changes could not be saved. Export a backup or retry.','更改未保存。请导出备份或重试。'],
  conflict:['این ارزیابی در جای دیگری تغییر کرده است. دوباره آن را باز کنید.','This assessment changed elsewhere. Export a backup and reopen it.','此评估已在其他位置更改。请导出备份后重新打开。'],
  overlap:['همین اطلاعات در دو نسخه ویرایش شده‌اند. برای موارد زیر نسخه دلخواه را انتخاب کنید.','These fields changed in both copies. Choose which values to save.','这些字段已同时修改。请选择要保存的值。'],
  confirmed:['تغییرات انتخاب‌شده ذخیره شدند.','Selected changes saved.','所选更改已保存。'],
  mine:['ثبت مقادیر من','Save my values','保存我的值'],
  theirs:['پذیرش مقادیر سرور','Use server values','使用服务器值'],
  unavailable:['این ارزیابی دیگر برای ویرایش در دسترس نیست.','This assessment is no longer editable.','此评估已不可编辑。'],
  leave:['با وجود تغییرات ذخیره‌نشده خارج می‌شوید؟','Leave with unsaved changes?','仍要离开并放弃未保存的更改？'],
  share:['اشتراک موقعیت مکانی','Share location','共享位置'],
  stop:['توقف موقعیت مکانی','Stop sharing','停止共享'],
  gpsWait:['در حال حاضر هیچ پرونده‌ای موقعیت مکانی خود را به اشتراک نگذاشته است.','No cases are currently sharing a location.','目前没有共享位置的档案。'],
  gpsError:['GPS در دسترس نیست. مجوز موقعیت و اتصال را بررسی کنید.','GPS is unavailable. Check location permissions and your connection.','定位不可用。请检查定位权限和网络。'],
  position:['آخرین موقعیت','Latest location','最新位置'],
  backup:['دریافت نسخه پشتیبان','Download backup','下载备份'],
  partial:['متن تخصصی بانک آزمون فعلاً فارسی است.','The technical test bank is currently in Persian.','专业试验题库目前为波斯语。']
};

const interfaceText = [
  ['#pageTitle','بخش‌های ارزیابی','Assessment modules','评估模块'],
  ['#pageTitle','تنظیم مشخصات خودرو و برنامه آزمون','Vehicle and test plan setup','车辆与试验计划设置'],
  ['#pageTitle','آزمون قابلیت رانندگی','Drivability testing','驾驶性能试验'],
  ['#pageTitle','آزمون دوام عملکردی','Functional durability testing','功能耐久试验'],
  ['#pageTitle','بررسی استاتیک','Static inspection','静态检查'],
  ['#pageTitle','نتایج و میانگین‌ها','Results and averages','结果与平均值'],
  ['#pageSub','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.','Vehicle details and program length determine test selection and scheduling.','车辆信息及计划周期决定试验筛选和排程。'],
  ['#pageSub','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا','26-day program with test criteria and routes','26 天试验计划，含指标及路线'],
  ['#pageSub','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف','Daily monitoring through the target mileage','每日监测直至达到目标里程'],
  ['#pageSub','ارزیابی‌های مستقل از برنامه کیلومتری','Assessments outside the mileage schedule','独立于里程计划的评估'],
  ['#pageSub','خلاصه نمره هر شاخص و هر حوزه ارزیابی','Score summary by criterion and category','各指标及类别的评分汇总'],
  ['#moduleLanding [data-open="drive"] strong','قابلیت رانندگی','Drivability','驾驶性能'],
  ['#moduleLanding [data-open="durability"] strong','آزمون دوام','Durability testing','耐久试验'],
  ['#moduleLanding [data-open="supplementary"] strong','بررسی استاتیک','Static inspection','静态检查'],
  ['#moduleLanding [data-open="results"] strong','گزارش و نتایج','Reports and results','报告与结果'],
  ['#moduleLanding .gate-cta','ورود به بخش ←','Open module →','进入模块 →'],
  ['#moduleLanding [data-open="setup"] strong','ویرایش مشخصات','Edit specifications','编辑车辆信息'],
  ['label[for="vclass"]','رده خودرو','Vehicle class','车辆类别'],
  ['label[for="body"]','نوع بدنه','Body type','车身类型'],
  ['label[for="power"]','قوای محرکه','Powertrain','动力总成'],
  ['label[for="gear"]','گیربکس','Transmission','变速箱'],
  ['label[for="driveType"]','سیستم محرک','Drivetrain','驱动形式'],
  ['label[for="driveKm"]','قابلیت رانندگی (کیلومتر)','Drivability distance (km)','驾驶性能目标里程（公里）'],
  ['label[for="durKm"]','هدف پیمایش دوام (کیلومتر)','Durability distance target (km)','耐久目标里程（公里）'],
  ['label[for="durDays"]','تعداد روزهای دوام (محاسبه خودکار)','Durability days (calculated)','耐久天数（自动计算）'],
  ['#vehicleForm button[type="submit"]','ذخیره مشخصات','Save specifications','保存车辆信息'],
  ['#vehicleForm .toolbar .tiny','مقادیر و نمره‌ها در دیتابیس این ارزیابی ذخیره می‌شوند.','Values and scores are stored with this assessment.','数值及评分保存在本评估的数据库中。'],
  ['#workPanel .sidebar h3','شاخص‌های ارزیابی','Assessment criteria','评估指标']
];

function translateInterface() {
  if (!current) return;
  const index = ['fa','en','zh'].indexOf(language) + 1;
  for (const [selector,...values] of interfaceText) {
    for (const element of document.querySelectorAll(selector)) {
      if (values.includes(element.textContent)) element.textContent = values[index-1];
    }
  }
  $('backModulesBtn').textContent = ['بازگشت','Back','返回'][index-1];
  const setupInfo = $('setupInfo');
  const average = setupInfo.dataset.average;
  if (average) {
    const km = Number(average).toLocaleString(language === 'fa' ? 'fa-IR' : language);
    setupInfo.textContent = [
      'میانگین لازم: '+km+' کیلومتر در روز. مسافت هدف هر نوع مسیر و روزهای کنترل، بعد از شروع برنامه محاسبه می‌شوند.',
      'Required average: '+km+' km/day. Route targets and inspection days are calculated when the program starts.',
      '每日平均需行驶 '+km+' 公里。启动计划后将计算各类路线的目标里程和检查日期。'
    ][index-1];
  }

}
document.addEventListener('bamco:render',translateInterface);

let language = 'fa';
try {
  const stored = localStorage.getItem('bamco-assessment-language');
  if (['fa','en','zh'].includes(stored)) language = stored;
} catch {}
const tr = key => labels[key][['fa','en','zh'].indexOf(language)] || labels[key][0];
const languageButtons = [...$('assessmentLanguages').querySelectorAll('[data-language]')];

labels.locationShareTitle=['اشتراک موقعیت مکانی ارزیاب','Evaluator location sharing','评估员位置共享'];
labels.locationRequest=['در حال دریافت اجازه موقعیت…','Requesting location permission…','正在请求位置权限…'];
labels.created=['ایجاد','Created','创建时间'];
labels.liveCount=['پرونده با موقعیت فعال','active locations','个活跃位置'];
labels.locationInterval=['به‌روزرسانی هر ۱۰ ثانیه','Updates every 10 seconds','每 10 秒更新'];
labels.locationStale=['به‌روزرسانی انجام نشد. نقشه‌ها آخرین موقعیت دریافتی را نشان می‌دهند.','Update failed. Maps show the last received locations.','更新失败，地图显示上次收到的位置。'];
labels.accuracy=['دقت','Accuracy','精度'];
labels.metres=['متر','m','米'];
labels.keepOpen=['موقعیت در تب «نظارت بر موقعیت مکانی» نمایش داده می‌شود. صفحه را باز و گوشی را روشن نگه دارید.','Your location is visible in Location Monitoring. Keep this page open and the phone awake.','您的位置已显示在“位置监控”中。请保持页面开启及手机亮屏。'];
labels.newAssessmentTitle=['تعریف آزمون جدید','Define a new test','新建试验'];
labels.chooseType=['نوع آزمون','Test type','试验类型'];
labels.drive=['قابلیت رانندگی','Drivability','驾驶性能'];
labels.durability=['آزمون دوام','Durability testing','耐久试验'];
labels.static=['بررسی استاتیک','Static inspection','静态检查'];
labels.comprehensive=['ارزیابی جامع','Comprehensive assessment','综合评估'];
labels.oldCases=['پرونده‌های قبلی بدون نوع مشخص','Previous cases without an assigned type','未指定类型的旧档案'];
labels.activeListTitle=['ارزیابی‌های در حال اجرا','Assessments in progress','进行中的评估'];
labels.historyListTitle=['ارزیابی‌های خاتمه‌یافته','Completed assessments','已完成的评估'];
labels.activeStatus=['در حال ارزیابی','In progress','进行中'];
labels.completedStatus=['خاتمه‌یافته','Completed','已完成'];
labels.assessmentCount=['ارزیابی','assessment','项评估'];

let gpsStatus = '';
let category = null;
let screen = 'home', rows = [], current, notice = '', pending = null, saving, syncState = '', syncGeneration = 0;
let locationView = null;
let watch = null, heartbeat = null, locationSession = '', gpsGeneration = 0, gpsWrite = Promise.resolve();

function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
}

async function ownerRequest(operation,args = {}) {
 const result=await requestRpc('bamco_assessment',{operation,args});
 if(['create','edit','delete'].includes(operation)&&!result.error&&result.data){
  listEpoch++;listCache.clear();listRequests.clear();
 }
 return result;
}

function loadList(status,fresh=false){
 if(listRequests.has(status))return listRequests.get(status);
 const cached=listCache.get(status);
 if(!fresh&&cached&&Date.now()-cached.at<15000)return Promise.resolve({data:cached.rows,error:null});
 const epoch=listEpoch;
 const request=ownerRequest('list',{status}).then(result=>{
  if(!result.error&&Array.isArray(result.data)&&epoch===listEpoch)listCache.set(status,{rows:result.data,at:Date.now()});
  return result;
 }).finally(()=>{if(listRequests.get(status)===request)listRequests.delete(status)});
 listRequests.set(status,request);
 return request;
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(key, action, className = 'assessment-action') {
  const control = node('button', tr(key), className);
  control.type = 'button';
  control.onclick = action;
  return control;
}

function field(type, key, value = '') {
  const input = node('input');
  input.type = type;
  input.placeholder = tr(key);
  input.setAttribute('aria-label', tr(key));
  input.required = true;
  input.value = value;
  return input;
}

function renderWelcome() {
  if (!hub.querySelector('[data-boot-screen]')) hub.replaceChildren(...welcome.map(el=>el.cloneNode(true)));
  if (hub.dataset.language === language && hub.dataset.welcome === 'true') return;
  const title = hub.querySelector('h1');
  title.replaceChildren(tr('welcomeBefore'),node('span',tr('welcomeAccent')),tr('welcomeAfter'));
  const add=hub.querySelector('[data-create-test]');
  add.hidden=!canCreate();add.querySelector('strong').textContent=tr('newAssessmentTitle');
  for (const card of hub.querySelectorAll('.gate-card')) {
    if(card.hasAttribute('data-create-test')) {
      card.hidden=!canCreate();
      card.querySelector('strong').textContent=tr('newAssessmentTitle');
      card.querySelector('.gate-cta').textContent=tr('newAssessmentCta');
      continue;
    }
    const key = card.dataset.bootScreen || 'weighting';
    card.hidden=!can(key);
    card.setAttribute('aria-label',tr(key));
    card.querySelector('strong').textContent = tr(key);
    card.querySelector('.gate-cta').textContent = tr(key+'Cta');
    card.removeAttribute('aria-busy');
  }
  if(![...hub.querySelectorAll('.gate-card')].some(card=>!card.hidden)){let message=hub.querySelector('.portal-empty');if(!message){message=node('p','','portal-empty');hub.append(message)}message.textContent=portal.text('empty')}
  hub.dataset.language = language;
  hub.dataset.welcome = 'true';
}
hub?.addEventListener('click', event=>{
  if(event.target.closest('[data-create-test]')&&canCreate()){openCreate();return}
  const target = event.target.closest('[data-boot-screen]');
  if (target && can(target.dataset.bootScreen)) navigate(target.dataset.bootScreen);
});

function report(error) {
  console.error(error);
  notice = 'error';
  render();
}

function locale() {
  return language === 'fa' ? 'fa-IR' : language === 'zh' ? 'zh-CN' : 'en-GB';
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleString(locale(),{dateStyle:'medium',timeStyle:'short'});
}

function render() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  if (window.BAMCO_I18N && window.BAMCO_I18N.language!==language) window.BAMCO_I18N.setLanguage(language);
  if (current) translateInterface();
  $('assessmentLanguages').setAttribute('aria-label',tr('language'));
  for (const control of languageButtons) control.setAttribute('aria-pressed',String(control.dataset.language === language));
  $('brandName').textContent = tr('brandName');
  $('brandTitle').textContent = tr('brandTitle');
  document.querySelector('.brand-logo').alt = tr('brandAlt');
  document.title = tr('brandName')+' | '+tr('brandTitle');
  portal.applyLanguage(language);
  if(!portal.user)return;
  if (editor) {
    $('assessmentGpsStatus').textContent = gpsStatus ? tr(gpsStatus) : '';
    $('assessmentGpsLabel').textContent = tr('locationShareTitle');
    $('assessmentBack').textContent = tr('back');
    $('assessmentShare').textContent = tr('share');
    $('assessmentStop').textContent = tr('stop');
    for(const id of ['assessmentShare','assessmentStop'])$(id).hidden=!current||current.status!=='active'||!canTrack(current?.assessment_type);
    if (!current) {
      $('caseReturn').textContent=tr('back');
      $('caseRetry').textContent=tr('retry');
      $('caseMessage').textContent=tr(notice || 'opening');
      return;
    }
    $('assessmentSync').textContent = syncState ? tr(syncState) : '';
    if (syncState === 'overlap' && overlapReview) showOverlaps($('assessmentSync'));
    if (pending && !saving && syncState === 'unsaved') $('assessmentSync').append(' ',button('retry',flush));
    return;
  }

  closeLocationView();
  hub.className = screen === 'home' ? '' : 'assessment-list-page assessment-list-page-'+screen;
  if (screen === 'home') { renderWelcome(); return }
  if (screen === 'questions') {
    delete hub.dataset.welcome;
    const host = node('section','','question-bank');
    hub.replaceChildren(host);
    const open = () => {
      if(host.isConnected) window.BAMCO_QUESTION_BANK.mount(host,{language,home:()=>navigate('home')});
    };
    host.textContent=tr('load');
    Promise.all([
      loadStyles('questions'),
      (async()=>{
        if(!window.BAMCO_DATA) await loadExternal('./data.js?v=20261111-final-1');
        if(!window.BAMCO_WORKBOOK) await loadExternal('./workbook-metadata.js?v=20261111-dashboard-1');
        if(!window.BAMCO_QUESTION_BANK) await loadExternal('./question-bank.js?v=1');
      })()
    ]).then(open).catch(()=>{
      if(host.isConnected) host.replaceChildren(node('p',tr('error')),button('retry',render),button('back',()=>navigate('home')));
    });
    return;
  }
  if (screen === 'weighting') {
    delete hub.dataset.welcome;
    const host = node('section','','weighting-workspace');
    hub.replaceChildren(host);
    const open = () => {
      if (host.isConnected) window.BAMCO_WEIGHTING.mount(host,{language,requestRpc,home:()=>navigate('home')});
    };
    if (window.BAMCO_WEIGHTING) open();
    else {
      host.textContent=tr('load');
      Promise.all([loadExternal('./weighting-catalog.js'),loadExternal('./weighting-content.js?v=subcriteria-1'),
        loadExternal('./weighting.js?v=portal-access-1'),loadStyles('weighting')]).then(open).catch(()=>{
          if(host.isConnected) host.replaceChildren(node('p',tr('error')),button('retry',render));
        });
    }
    return;
  }
  delete hub.dataset.welcome;
  const title = node('h1',tr(category||screen),'gate-title welcome-title');
  const divider = node('div','','welcome-divider');
  divider.setAttribute('aria-hidden','true');
  divider.append(node('i'),node('i'),node('i'));
  hub.replaceChildren(title,divider);
  if (notice) {
    const status = node('p',tr(notice));
    status.setAttribute('role','status');
    hub.append(status);
  }
  if (screen !== 'home') {
    const toolbar = node('div','','assessment-page-toolbar');
    const backButton = button('back',()=>navigate(category?'active':'home'),'assessment-action assessment-back-action');
    backButton.setAttribute('aria-label',tr('back'));
    toolbar.append(backButton);
    divider.after(toolbar);
  }
  if(screen==='active'&&!category){
    renderCategories();
    const legacy=rows.filter(row=>!row.assessment_type);
    if(legacy.length){
      const details=node('details','','assessment-legacy');
      details.append(node('summary',tr('oldCases')+' ('+legacy.length.toLocaleString(locale())+')'));
      renderRows(legacy,details,'oldCases');hub.append(details);
    }
  }else if(screen==='active'||screen==='history'){
    renderRows(category?rows.filter(row=>row.assessment_type===category):rows,hub,screen==='active'?'activeListTitle':'historyListTitle');
  }
  if (screen === 'observer') {
    openLocationView();
  }
}

function listScreen() {
  const query=new URLSearchParams(location.search);
  const value=query.has('observer')?'observer':query.get('view');
  return ['active','history','observer','weighting','questions'].includes(value)?value:'home';
}
function caseURL(id) {
  const url=new URL('./case.html',location.href);
  url.searchParams.set('id',id);
  if(screen==='history')url.searchParams.set('from','history');
  if(category)url.searchParams.set('type',category);
  return url.href;
}
function urlCategory(){
 const type=new URLSearchParams(location.search).get('type');
 return types.includes(type)?type:null;
}
async function navigate(next,writeURL=true,type=null) {
  if(next!=='home'&&!can(next)){next='home';writeURL=true}
  const nextType=next==='active'&&types.includes(type)?type:null;
  if(writeURL && (next!==listScreen()||nextType!==urlCategory())){
    const url=new URL(location.href);
    url.searchParams.delete('observer');
    if(nextType)url.searchParams.set('type',nextType);else url.searchParams.delete('type');
    url.hash='';
    if(next==='home')url.searchParams.delete('view');else url.searchParams.set('view',next);
    history.pushState(null,'',url);
  }
  const generation = ++syncGeneration;
  screen = next;category=nextType;
  const status=next==='history'?'completed':'active';
  rows = ['active','history'].includes(next)?listCache.get(status)?.rows||[]:[];
  notice = '';
  if (['active','history'].includes(next)&&!listCache.has(status)) notice = 'load';
  render();
  if(next==='home'){
   if(can('active'))loadList('active');
   if(can('history'))loadList('completed');
  }
  if (!['active','history'].includes(next)) return;
  const {data,error} = await loadList(status,true);
  if (generation !== syncGeneration) return;
  if (error) {report(error);return}
  rows = Array.isArray(data) ? data : [];
  notice = '';
  render();
}

function typeIcon(key){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg'),use=document.createElementNS(ns,'use');
  svg.setAttribute('viewBox','0 0 160 128');svg.setAttribute('aria-hidden','true');
  use.setAttribute('href','./assets/assessment-modules.svg#'+key);svg.append(use);return svg;
}
function renderCategories(){
  const grid=node('div','','gate-grid four assessment-type-grid');
  for(const type of types){
    const card=node('button','','gate-card assessment-type-card');card.type='button';card.dataset.type=type;
    const count=rows.filter(row=>row.assessment_type===type).length;
    const illustration=node('span','','gate-illustration');illustration.setAttribute('aria-hidden','true');illustration.append(typeIcon(type));
    card.append(illustration,node('strong',tr(type)),node('span',count.toLocaleString(locale())+' '+tr('assessmentCount'),'gate-cta'));
    card.onclick=()=>navigate('active',true,type);grid.append(card);
  }
  hub.append(grid);
}
function openCreate(){
  if(!canCreate()||hub.querySelector('dialog[open]'))return;
  const dialog=node('dialog','','assessment-create-panel'),form=node('form','','assessment-create-form');
  const heading=node('h2',tr('newAssessmentTitle'));heading.id='createTestTitle';
  dialog.setAttribute('aria-labelledby',heading.id);
  const title=field('text','name');title.maxLength=120;
  const label=node('label',tr('name'));label.append(title);
  const choices=node('fieldset','','assessment-type-picker');choices.append(node('legend',tr('chooseType')));
  for(const type of types){
    const option=node('label'),radio=node('input');radio.type='radio';radio.name='assessmentType';radio.value=type;radio.required=true;
    option.append(radio,typeIcon(type),node('span',tr(type)));choices.append(option);
  }
  const actions=node('div','','assessment-create-actions'),submit=node('button',tr('create'),'assessment-action assessment-create-action');
  submit.type='submit';
  const status=node('p');status.setAttribute('role','status');
  actions.append(submit,button('back',()=>dialog.close()));form.append(label,choices,status,actions);
  dialog.append(heading,form);hub.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  form.onsubmit=async event=>{
    event.preventDefault();const type=form.elements.assessmentType.value,name=title.value.trim();
    if(!types.includes(type)||!name||submit.disabled)return;
    submit.disabled=true;status.textContent=tr('saving');
    const {data,error}=await ownerRequest('create',{title:name,assessment_type:type});
    if(!dialog.isConnected||!dialog.open)return;
    submit.disabled=false;
    if(error||!data){status.textContent=tr('error');return}
    dialog.close();await navigate('active',true,type);
  };
  dialog.showModal();title.focus();
}
function renderRows(visibleRows,host,headingKey){
  const list = node('section','','assessment-list-section');
  const listHeading = node('div','','assessment-list-heading');
  listHeading.append(
    node('h2',tr(headingKey)),
    node('span',visibleRows.length.toLocaleString(locale())+' '+tr('assessmentCount'),'assessment-count')
  );
  list.append(listHeading);
  const grid = node('div','','assessment-card-grid');
  if (visibleRows.length === 1) grid.classList.add('is-single');
  list.append(grid);
  if (!visibleRows.length && !notice) {
    const empty = node('div','','assessment-empty-state');
    empty.append(node('span','✓','assessment-empty-icon'),node('p',tr('empty')));
    grid.append(empty);
  }
  for (const row of visibleRows) {
    const item = node('article','','surface assessment-row');
    const top = node('div','','assessment-row-top');
    const active = row.status === 'active';
    top.append(
      node('span',tr(active ? 'activeStatus' : 'completedStatus'),'assessment-status '+(active ? 'is-active' : 'is-completed')),
      node('small',tr('created')+': '+formatDate(row.created_at),'assessment-row-meta')
    );
    const heading = node('div','','assessment-row-heading');
    heading.append(node('bdi',row.title,'assessment-row-title'));
    const actions = node('div','','assessment-row-actions');
    const open=node('a',tr('open'),'assessment-action assessment-open-action');
    open.href=caseURL(row.id);
    if(canOpenCase(row.assessment_type)) actions.append(open);
    if(can('setup')) actions.append(button('rename',()=>{
      const title = prompt(tr('name'),row.title)?.trim();
      if (title && title.length <= 120 && title !== row.title) mutate(row,{title});
    },'assessment-action assessment-secondary-action'));
    if(can('setup')&&can('active')&&can('history')) actions.append(button(active?'finish':'reopen',()=>mutate(row,{status:active?'completed':'active'}),'assessment-action assessment-secondary-action'));
    if(portal.user.admin) actions.append(button('remove',()=>{if(confirm(tr('confirm')))mutate(row,null)},'assessment-action assessment-delete-action'));
    item.append(heading,top,actions);
    grid.append(item);
  }
  host.append(list);
}

async function mutate(row,values) {
  const generation = syncGeneration;
  const {data,error} = await ownerRequest(values ? 'edit' : 'delete',{id:row.id,revision:row.revision,...values});
  if (generation !== syncGeneration) return;
  if (error || !data) {report(error || tr('conflict'));return}
  await navigate(screen,true,category);
}

async function openAssessment(id) {
  const retry=$('caseRetry');
  const caseView=$('caseView');
  const entry=$('caseEntry');
  retry.hidden=true;
  notice='';
  render();
  try {
    if(!id)throw new Error('Missing case ID');
    const [result]=await Promise.all([ownerRequest('open',{id}),loadEditor(),loadDictionary(language)]);
    if(result.error || result.data?.id!==id)throw result.error || new Error('Case unavailable');
    const data=result.data;
    if(!data.snapshot || typeof data.snapshot!=='object' || Array.isArray(data.snapshot))throw new Error('Invalid case snapshot');
    let requested;
    do {requested=language;await loadDictionary(requested)} while(requested!==language);
    current={...data,snapshot:structuredClone(data.snapshot)};
    syncState='';
    $('assessmentName').textContent=data.title;
    $('assessmentName').classList.toggle('assessment-name-latin',!/[\u0600-\u06ff]/.test(data.title));
    $('assessmentShare').disabled=false;
    $('assessmentStop').disabled=true;
    $('assessmentGps').classList.toggle('hidden',data.status!=='active'||!canTrack(current?.assessment_type));
    window.BAMCO_I18N?.setLanguage(language);
    app.open(data.snapshot,queueSave,data.status!=='active',can,data.assessment_type);
    render();
    editor.classList.remove('hidden');
    entry.hidden=true;
    caseView.hidden=false;
    window.scrollTo({top:0,behavior:'instant'});
  } catch(error) {
    console.error(error);
    current=null;
    editor.classList.add('hidden');
    caseView.hidden=true;
    entry.hidden=false;
    notice='caseError';
    retry.hidden=!id;
    render();
  }
}

function queueSave(snapshot) {
  recovery=null;pending = structuredClone(snapshot);
  if(syncState!=='overlap' && syncState!=='unavailable') flush();
}

let overlapReview=null,recovery=null;

function showOverlaps(host) {
  const review=overlapReview;
  const fieldNames={score:['نمره','Score','评分'],note:['یادداشت','Note','备注'],photo:['تصویر','Photo','图片']};
  const valueText=value=>{
    if(typeof value==='string' && value.startsWith('data:image/'))return '📷';
    if(value && typeof value==='object')return Array.isArray(value) ? '('+value.length+')' : Object.keys(value).join('، ');
    return value===undefined ? '—' : String(value);
  };
  for(const {path,mine,theirs} of review.conflicts){
    const line=document.createElement('div');
    line.dir='auto';
    const testId=path[0]==='records'?path[1].split(':').slice(2).join(':'):null;
    const test=testId && app.currentTests?.().find(t=>t.id===testId);
    const field=fieldNames[path.at(-1)]?.[['fa','en','zh'].indexOf(language)] || path.at(-1);
    line.textContent=[test?.name || path.slice(0,-1).join(' / '),field].join(' · ')+' · '+tr('mine')+' («'+valueText(mine)+'») · '+tr('theirs')+' («'+valueText(theirs)+'»)';
    host.append(line);
  }
  for(const choice of ['mine','theirs'])host.append(button(choice,async()=>{
    if(current!==review.row || saving)return;
    await flush({...review,choice});
    if(current===review.row && syncState==='saved'){
      const status=$('dayScoresSave')?.querySelector('[role=status]') || $('assessmentSync');
      status.textContent=tr('confirmed');
    }
  }));
}

async function flush(decision) {
  if(saving)return saving;
  if(!current || !pending || syncState==='unavailable')return;
  if(syncState==='overlap' && !decision?.choice)return;
  const row=current;
  saving=(async()=>{
    let retries=0;
    while(current===row && pending){
      const snapshot=pending;
      pending=null;
      syncState='saving';
      render();
      const {data,error}=await ownerRequest('save',{id:row.id,revision:row.revision,snapshot});
      if(current!==row)return;
      if(!error && Number.isInteger(data?.revision)){
        row.snapshot=snapshot;
        row.revision=data.revision;
        if(!pending&&recovery?.row===row)app.applyReconciledSnapshot(structuredClone(snapshot),recovery.submitted);
        recovery=null;
        overlapReview=null;
        syncState='saved';
        retries=0;
        continue;
      }
      pending??=snapshot;
      if(recovery?.row!==row)recovery={row,submitted:pending};
      if(error || ++retries>3){syncState='unsaved';return}
      const latest=await ownerRequest('open',{id:row.id});
      if(current!==row)return;
      if(latest.error){syncState='unsaved';return}
      const server=latest.data;
      if(!server || server.id!==row.id || server.status!=='active' || !server.snapshot || !Number.isInteger(server.revision)){
        syncState='unavailable';return;
      }
      const merged=window.BAMCO_RECONCILE(row.snapshot||{},pending,server.snapshot,decision?.choice==='theirs');
      if(merged.conflicts.length){
        const approved=decision?.choice && decision.row===row && decision.revision===server.revision &&
          JSON.stringify(decision.conflicts)===JSON.stringify(merged.conflicts);
        if(!approved){
          overlapReview={row,revision:server.revision,conflicts:merged.conflicts};
          syncState='overlap';return;
        }
      }
      decision=null;
      overlapReview=null;
      row.snapshot=server.snapshot;
      row.revision=server.revision;
      pending=structuredClone(merged.snapshot);
    }
  })();
  try{await saving}finally{saving=null;render()}
}

if(editor) $('assessmentBack').onclick = async () => {
  const row = current;
  if(saving)await saving;
  if (!row || current !== row) return;
  if (pending && !confirm(tr('leave'))) return;
  if (watch !== null || locationSession) await stopGps();
  if (current !== row) return;
  const next = current.status === 'active' ? 'active' : 'history';
  pending = null;
  const listURL=new URL('./?view='+next,location.href);
  if(next==='active'&&row.assessment_type)listURL.searchParams.set('type',row.assessment_type);
  const source=document.referrer?new URL(document.referrer):null;
  if(!history.state?.from&&source?.origin===listURL.origin&&source.pathname===listURL.pathname&&source.searchParams.get('view')===next&&history.length>1)history.back();
  else location.replace(listURL.href);
};

function setGpsStatus(key) {
  gpsStatus = key;
  $('assessmentGpsStatus').textContent = key ? tr(key) : '';
}

function gpsUpdate(operation,values = {}) {
  const id = current?.id;
  const session = locationSession;
  if (!id || !session) return Promise.resolve(false);
  gpsWrite = gpsWrite.then(async () => {
    const {data,error} = await ownerRequest(operation,{id,session,...values});
    return !error && Boolean(data);
  }).catch(()=>false);
  return gpsWrite;
}

function firstPosition(options) {
  return new Promise((resolve,reject)=>{
    if (!navigator.geolocation) {reject(new Error('Geolocation unavailable'));return}
    navigator.geolocation.getCurrentPosition(resolve,reject,options);
  });
}

if(editor) $('assessmentGps').onsubmit = async event => {
  event.preventDefault();
  if (!current || watch !== null || locationSession) return;
  if (!navigator.geolocation) {setGpsStatus('gpsError');return}
  const row = current;
  const generation = ++gpsGeneration;
  const options = {enableHighAccuracy:true,maximumAge:5000,timeout:20000};
  $('assessmentBack').disabled = true;
  $('assessmentShare').disabled = true;
  setGpsStatus('locationRequest');
  let first;
  try {
    first = await firstPosition(options);
  } catch (error) {
    console.error(error);
    $('assessmentBack').disabled = false;
    $('assessmentShare').disabled = false;
    setGpsStatus('gpsError');
    return;
  }
  if (current !== row || generation !== gpsGeneration) return;
  const session = randomKey();
  const start = await ownerRequest('gps_start',{id:row.id,session});
  $('assessmentBack').disabled = false;
  if (start.error || !start.data) {
    $('assessmentShare').disabled = false;
    setGpsStatus('error');
    return;
  }
  locationSession = session;
  $('assessmentStop').disabled = false;
  setGpsStatus('keepOpen');
  let last = 0;
  let writing = false;
  const publish = async position => {
    if (generation !== gpsGeneration || writing || Date.now()-last < 4000) return;
    writing = true;
    last = Date.now();
    const coords = position.coords;
    const ok = await gpsUpdate('gps_point',{
      latitude:coords.latitude,
      longitude:coords.longitude,
      accuracy:Math.max(0,coords.accuracy||0)
    });
    writing = false;
    if (generation === gpsGeneration) setGpsStatus(ok?'keepOpen':'gpsError');
  };
  await publish(first);
  const onLocationError = error => {
    console.error(error);
    if (generation === gpsGeneration) setGpsStatus('gpsError');
  };
  watch = navigator.geolocation.watchPosition(publish,onLocationError,options);
  heartbeat = setInterval(()=>navigator.geolocation.getCurrentPosition(publish,onLocationError,options),30000);
};

async function stopGps() {
  ++gpsGeneration;
  clearInterval(heartbeat);
  heartbeat = null;
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  watch = null;
  const session = locationSession;
  if (!session) {
    $('assessmentShare').disabled = false;
    $('assessmentStop').disabled = true;
    setGpsStatus('');
    return true;
  }
  const ok = await gpsUpdate('gps_stop');
  locationSession = '';
  $('assessmentShare').disabled = false;
  $('assessmentStop').disabled = true;
  setGpsStatus(ok ? '' : 'error');
  return ok;
}
if(editor) $('assessmentStop').onclick = stopGps;

function closeLocationView() {
  if (!locationView) return;
  clearInterval(locationView.timer);
  for (const card of locationView.cards.values()) card.dispose();
  locationView = null;
}

function openLocationView() {
  const grid = node('div','','location-grid');
  const summary = node('div','','location-summary');
  const status = node('span',tr('load'));
  status.setAttribute('role','status');
  summary.append(status,node('span',tr('locationInterval'),'location-interval'));
  hub.append(summary,grid);
  const view = {grid,status,cards:new Map(),busy:false,timer:null};
  locationView = view;
  view.timer = setInterval(()=>refreshLocations(view),10000);
  refreshLocations(view);
}

function addLocationCard(view,point,coords) {
  const figure = node('figure','','location-card');
  const panel = node('div','','location-map');
  const caption = node('figcaption');
  const title = node('strong');
  title.dir = 'auto';
  title.id = 'location-title-'+point.assessment_id;
  panel.setAttribute('role','region');
  panel.setAttribute('aria-labelledby',title.id);
  const time = node('time');
  caption.append(title,time);
  figure.append(panel,caption);
  view.grid.append(figure);

  const map = L.map(panel).setView(coords,15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  const icon = L.divIcon({className:'location-pin',iconSize:[22,22],iconAnchor:[11,11]});
  const marker = L.marker(coords,{icon}).addTo(map);
  const resize = window.ResizeObserver && new ResizeObserver(()=>map.invalidateSize({animate:false}));
  resize?.observe(panel);
  const card = {figure,title,time,map,marker,dispose(){
    resize?.disconnect();
    map.remove();
    figure.remove();
  }};
  view.cards.set(point.assessment_id,card);
  return card;
}

function updateLocationCards(view,points) {
  const active = new Set();
  for (const point of points) {
    if (!point.assessment_id || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) continue;
    const id = point.assessment_id;
    active.add(id);
    const coords = [point.latitude,point.longitude];
    const card = view.cards.get(id) || addLocationCard(view,point,coords);
    if (!card.marker.getLatLng().equals(coords)) {
      card.marker.setLatLng(coords);
      if (!card.map.getBounds().contains(coords)) card.map.panTo(coords,{animate:false});
    }
    card.title.textContent = point.title;
    card.marker.getElement().setAttribute('aria-label',point.title);
    card.time.dateTime = point.recorded_at || '';
    const updated = formatDate(point.recorded_at);
    card.time.textContent = updated ? tr('position')+' · '+updated : '';
    const popup = node('div','','assessment-map-popup');
    popup.dir = document.documentElement.dir;
    popup.append(node('strong',point.title),node('span',updated));
    if (Number.isFinite(point.accuracy_m)) {
      popup.append(node('span',tr('accuracy')+' · '+Math.round(point.accuracy_m).toLocaleString(locale())+' '+tr('metres')));
    }
    if (card.marker.getPopup()) card.marker.setPopupContent(popup);
    else card.marker.bindPopup(popup);
  }
  for (const [id,card] of view.cards) {
    if (active.has(id)) continue;
    card.dispose();
    view.cards.delete(id);
  }
  view.status.textContent = active.size ? active.size.toLocaleString(locale())+' '+tr('liveCount') : tr('gpsWait');
}

async function refreshLocations(view) {
  if (view.busy || locationView !== view) return;
  view.busy = true;
  try {
    const [result] = await Promise.all([
      requestRpc('bamco_live_locations'),
      loadStyles('map'),
      window.L ? Promise.resolve() : loadExternal('./vendor/leaflet-1.9.4.js')
    ]);
    if (locationView !== view) return;
    if (result.error) {
      if ([401,403].includes(result.error.status)) updateLocationCards(view,[]);
      throw result.error;
    }
    if (!Array.isArray(result.data)) throw Error('Invalid location response');
    updateLocationCards(view,result.data);
  } catch {
    if (locationView === view) view.status.textContent = tr(view.cards.size ? 'locationStale' : 'error');
  } finally {
    view.busy = false;
  }
}

let languageRequest=0;
for (const control of languageButtons) control.onclick = async () => {
  const next = control.dataset.language;
  const request = ++languageRequest;
  if (next==='zh') loadStyles('zh').catch(()=>{});
  if (current) {
    try { await loadDictionary(next) }
    catch { if(request===languageRequest) alert(tr('error')); return }
  }
  if (request!==languageRequest) return;
  language = next;
  try {localStorage.setItem('bamco-assessment-language',language)} catch {}
  render();
};
window.addEventListener('beforeunload',event => {
  if (pending || saving || watch !== null) {event.preventDefault();event.returnValue = ''}
});

window.BAMCO_CASES={
 hasUnsaved(){return Boolean(pending||saving)},
 async saveNow(snapshot){
  if(!current||current.status!=='active'||app.isReadOnly())return false;
  const row=current;recovery=null;pending=structuredClone(snapshot);if(syncState==='overlap')syncState='unsaved';await flush();
  return current===row&&!pending&&syncState==='saved';
 },
 saveStatus(){return syncState},
 current(){return current?{id:current.id,title:current.title,status:current.status,createdAt:current.created_at,updatedAt:current.updated_at,revision:current.revision}:null},
 async listActive(){const {data,error}=await loadList('active',true);if(error)throw error;return Array.isArray(data)?data:[]},
 async read(id){const {data,error}=await ownerRequest('open',{id});if(error||!data)throw error||new Error('پرونده در دسترس نیست.');return data}
};
window.BAMCO_WORKSPACE_READY=true;
$('brandIcon').href=document.querySelector('.brand-logo').src;
render();
portal.start(()=>{
if(language==='zh') loadStyles('zh').catch(()=>{});
if (hub) {
  window.addEventListener('popstate',()=>navigate(listScreen(),false,urlCategory()));
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
  navigate(listScreen(),true,urlCategory());
} else if (editor) {
  const query=new URLSearchParams(location.search);
  const id=query.get('id');
  $('brandIcon').href=document.querySelector('.brand-logo').src;
  $('caseReturn').href=query.get('from')==='history'?'./?view=history':'./?view=active'+(urlCategory()?'&type='+urlCategory():'');
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
  $('caseRetry').onclick=()=>openAssessment(id);
  openAssessment(id);
}
},language);
})();

