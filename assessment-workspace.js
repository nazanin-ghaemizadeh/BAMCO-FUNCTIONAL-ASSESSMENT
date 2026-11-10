(() => {
'use strict';

const $ = id => document.getElementById(id);
const hub = $('assessmentHub');
const editor = $('assessmentEditorBar');
const app = window.BAMCO_ASSESSMENT;
const client = window.supabase?.createClient(
  'https://cwpfzvcwuiawjtvsnpkq.supabase.co',
  'sb_publishable_EWHLDNy9MiO26ZqdRYvSxQ_UU9pe3GM',
  {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
);

const labels = {
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
  active:['ارزیابی‌های فعال','Active assessments','进行中的评估'],
  history:['تاریخچه ارزیابی‌ها','Assessment history','评估历史'],
  evaluator:['ارزیاب','Evaluator','评估员'],
  observer:['نظارت بر موقعیت مکانی','Location Monitoring','位置监控'],
  back:['بازگشت','Back','返回'],
  create:['ارزیابی جدید','New assessment','新建评估'],
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
  saved:['در دیتابیس ذخیره شد.','Saved to the database.','已保存到数据库。'],
  unsaved:['تغییرات ذخیره نشد. دوباره تلاش کنید.','Changes could not be saved. Export a backup or retry.','更改未保存。请导出备份或重试。'],
  conflict:['این ارزیابی در جای دیگری تغییر کرده است. دوباره آن را باز کنید.','This assessment changed elsewhere. Export a backup and reopen it.','此评估已在其他位置更改。请导出备份后重新打开。'],
  leave:['با وجود تغییرات ذخیره‌نشده خارج می‌شوید؟','Leave with unsaved changes?','仍要离开并放弃未保存的更改？'],
  share:['اشتراک موقعیت مکانی','Share location','共享位置'],
  stop:['توقف اشتراک موقعیت','Stop sharing','停止共享'],
  gpsWait:['در انتظار موقعیت تازه از ارزیاب…','Waiting for a fresh location from the evaluator…','等待评估员发送最新位置…'],
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
  ['#pageTitle','پرسشنامه تکمیلی','Supplementary questionnaire','补充问卷'],
  ['#pageTitle','نتایج و میانگین‌ها','Results and averages','结果与平均值'],
  ['#pageSub','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.','Vehicle details and program length determine test selection and scheduling.','车辆信息及计划周期决定试验筛选和排程。'],
  ['#pageSub','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا','26-day program with test criteria and routes','26 天试验计划，含指标及路线'],
  ['#pageSub','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف','Daily monitoring through the target mileage','每日监测直至达到目标里程'],
  ['#pageSub','ارزیابی‌های مستقل از برنامه کیلومتری','Assessments outside the mileage schedule','独立于里程计划的评估'],
  ['#pageSub','خلاصه نمره هر شاخص و هر حوزه ارزیابی','Score summary by criterion and category','各指标及类别的评分汇总'],
  ['#moduleLanding [data-open="drive"] strong','قابلیت رانندگی','Drivability','驾驶性能'],
  ['#moduleLanding [data-open="durability"] strong','آزمون دوام','Durability testing','耐久试验'],
  ['#moduleLanding [data-open="supplementary"] strong','پرسشنامه تکمیلی','Supplementary questionnaire','补充问卷'],
  ['#moduleLanding [data-open="results"] strong','گزارش و نتایج','Reports and results','报告与结果'],
  ['#moduleLanding .gate-cta','ورود به بخش ←','Open module →','进入模块 →'],
  ['#moduleLanding [data-open="setup"] strong','ویرایش مشخصات','Edit specifications','编辑车辆信息'],
  ['#editSetupBtn','ویرایش مشخصات خودرو','Edit vehicle details','编辑车辆信息'],
  ['label[for="vclass"]','رده خودرو','Vehicle class','车辆类别'],
  ['label[for="body"]','نوع بدنه','Body type','车身类型'],
  ['label[for="power"]','قوای محرکه','Powertrain','动力总成'],
  ['label[for="gear"]','گیربکس','Transmission','变速箱'],
  ['label[for="driveType"]','سیستم محرک','Drivetrain','驱动形式'],
  ['label[for="driveKm"]','هدف قابلیت رانندگی (کیلومتر)','Drivability distance target (km)','驾驶性能目标里程（公里）'],
  ['label[for="durKm"]','هدف پیمایش دوام (کیلومتر)','Durability distance target (km)','耐久目标里程（公里）'],
  ['label[for="durDays"]','تعداد روزهای دوام (محاسبه خودکار)','Durability days (calculated)','耐久天数（自动计算）'],
  ['label[for="startOdo"]','کیلومترشمار شروع دوام','Initial durability odometer reading','耐久试验起始里程表读数'],
  ['#vehicleForm button[type="submit"]','تأیید و ورود به ارزیابی ←','Confirm and open assessment →','确认并进入评估 →'],
  ['#vehicleForm .toolbar .tiny','مقادیر و نمره‌ها در دیتابیس این ارزیابی ذخیره می‌شوند.','Values and scores are stored with this assessment.','数值及评分保存在本评估的数据库中。'],
  ['#workPanel .sidebar h3','شاخص‌های ارزیابی','Assessment criteria','评估指标']
];

function translateInterface() {
  const index = ['fa','en','zh'].indexOf(language) + 1;
  for (const [selector,...values] of interfaceText) {
    for (const element of document.querySelectorAll(selector)) {
      if (values.includes(element.textContent)) element.textContent = values[index-1];
    }
  }
  $('backModulesBtn').textContent = ['بازگشت به بخش‌ها','Back to modules','返回模块'][index-1];
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
labels.historyHint=['ارزیابی‌های خاتمه‌یافته را برای مرور نتایج انتخاب کنید.','Select a completed assessment to review its results.','选择已完成的评估以查看结果。'];
labels.created=['ایجاد','Created','创建时间'];
labels.liveCount=['خودرو با موقعیت فعال','vehicle with an active location','辆车正在共享位置'];
labels.keepOpen=['موقعیت در تب «نظارت بر موقعیت مکانی» نمایش داده می‌شود. صفحه را باز و گوشی را روشن نگه دارید.','Your location is visible in Location Monitoring. Keep this page open and the phone awake.','您的位置已显示在“位置监控”中。请保持页面开启及手机亮屏。'];
labels.newAssessmentTitle=['ایجاد ارزیابی جدید','Create a new assessment','创建新评估'];
labels.activeListTitle=['ارزیابی‌های در حال اجرا','Assessments in progress','进行中的评估'];
labels.historyListTitle=['ارزیابی‌های خاتمه‌یافته','Completed assessments','已完成的评估'];
labels.activeStatus=['در حال ارزیابی','In progress','进行中'];
labels.completedStatus=['خاتمه‌یافته','Completed','已完成'];
labels.assessmentCount=['ارزیابی','assessment','项评估'];

let gpsStatus = '';
let screen = 'home', rows = [], current, notice = '', pending = null, saving, syncState = '', syncGeneration = 0;
let map, markers, poll, watch = null, heartbeat = null, locationSession = '', gpsGeneration = 0, gpsWrite = Promise.resolve(), refreshing = false, mapFitted = false;

function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
}

function ownerRequest(operation,args = {}) {
  if (!client) return Promise.resolve({error:new Error('Database client is unavailable')});
  return client.rpc('bamco_assessment',{operation,args});
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

function card(key, icon, action) {
  const control = button(key, action, 'gate-card');
  control.dataset.gateIcon = icon;
  control.setAttribute('aria-label',tr(key));
  const illustration = node('span','','gate-illustration');
  illustration.setAttribute('aria-hidden','true');
  control.replaceChildren(illustration,node('strong',tr(key)),node('span',tr(key+'Cta'),'gate-cta'));
  return control;
}

function cards(...items) {
  const grid = node('div', '', 'gate-grid'+(items.length===3?' three':''));
  grid.append(...items);
  hub.append(grid);
}

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
  translateInterface();
  $('assessmentLanguages').setAttribute('aria-label',tr('language'));
  for (const control of languageButtons) control.setAttribute('aria-pressed',String(control.dataset.language === language));
  $('brandName').textContent = tr('brandName');
  $('brandTitle').textContent = tr('brandTitle');
  document.querySelector('.brand-logo').alt = tr('brandAlt');
  document.title = tr('brandName')+' | '+tr('brandTitle');
  $('assessmentGpsStatus').textContent = gpsStatus ? tr(gpsStatus) : '';
  $('assessmentGpsLabel').textContent = tr('locationShareTitle');
  $('assessmentBack').textContent = tr('back');
  $('assessmentShare').textContent = tr('share');
  $('assessmentStop').textContent = tr('stop');
  for(const id of ['assessmentShare','assessmentStop'])$(id).hidden=!current||current.status!=='active';
  if (current) {
    $('assessmentSync').textContent = syncState ? tr(syncState) : '';
    if (language !== 'fa') $('assessmentSync').append(' ',tr('partial'));
    if (pending && !saving && syncState === 'unsaved') $('assessmentSync').append(' ',button('retry',flush));
    return;
  }

  if (map) {map.remove();map = null}
  hub.className = screen === 'home' ? '' : 'assessment-list-page assessment-list-page-'+screen;
  const title = node('h1',screen === 'home' ? '' : tr(screen),'gate-title welcome-title');
  if (screen === 'home') title.append(tr('welcomeBefore'),node('span',tr('welcomeAccent')),tr('welcomeAfter'));
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
    const backButton = button('back',()=>navigate('home'),'assessment-action assessment-back-action');
    backButton.setAttribute('aria-label',tr('back'));
    toolbar.append(backButton);
    divider.after(toolbar);
  }
  if (screen === 'home') {
    cards(
      card('active','setup',()=>navigate('active')),
      card('history','results',()=>navigate('history')),
      card('observer','observer',()=>navigate('observer'))
    );
  }
  if (screen === 'active' || screen === 'history') renderRows();
  if (screen === 'observer') {
    renderMap();
  }
}

async function navigate(next) {
  clearInterval(poll);
  poll = null;
  const generation = ++syncGeneration;
  screen = next;
  rows = [];
  notice = '';
  if (['active','history'].includes(next)) notice = 'load';
  render();
  if (next === 'observer') {
    await refreshMap();
    if (generation === syncGeneration) poll = setInterval(refreshMap,5000);
    return;
  }
  if (!['active','history'].includes(next)) return;
  const {data,error} = await ownerRequest('list',{status:next === 'history' ? 'completed' : 'active'});
  if (generation !== syncGeneration) return;
  if (error) {report(error);return}
  rows = Array.isArray(data) ? data : [];
  notice = '';
  render();
}

function renderRows() {
  if (screen === 'active') {
    const createPanel = node('section','','assessment-create-panel');
    const createHeading = node('div','','assessment-create-heading');
    createHeading.append(node('span','+','assessment-create-icon'),node('h2',tr('newAssessmentTitle')));
    const form = node('form','','assessment-create-form');
    const title = field('text','name');
    title.maxLength = 120;
    const createButton = node('button',tr('create'),'assessment-action assessment-create-action');
    form.append(title,createButton);
    form.onsubmit = async event => {
      event.preventDefault();
      await create(title.value,{},createButton);
    };
    createPanel.append(createHeading,form);
    hub.append(createPanel);
  }
  if (screen === 'history') hub.append(node('p',tr('historyHint'),'assessment-screen-hint'));

  const list = node('section','','assessment-list-section');
  const listHeading = node('div','','assessment-list-heading');
  listHeading.append(
    node('h2',tr(screen === 'active' ? 'activeListTitle' : 'historyListTitle')),
    node('span',rows.length.toLocaleString(locale())+' '+tr('assessmentCount'),'assessment-count')
  );
  list.append(listHeading);
  const grid = node('div','','assessment-card-grid');
  if (rows.length === 1) grid.classList.add('is-single');
  list.append(grid);
  if (!rows.length && !notice) {
    const empty = node('div','','assessment-empty-state');
    empty.append(node('span','✓','assessment-empty-icon'),node('p',tr('empty')));
    grid.append(empty);
  }
  for (const row of rows) {
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
    actions.append(button('open',()=>openAssessment(row.id),'assessment-action assessment-open-action'));
    actions.append(button('rename',()=>{
      const title = prompt(tr('name'),row.title)?.trim();
      if (title && title.length <= 120 && title !== row.title) mutate(row,{title});
    },'assessment-action assessment-secondary-action'));
    actions.append(button(active?'finish':'reopen',()=>mutate(row,{status:active?'completed':'active'}),'assessment-action assessment-secondary-action'));
    actions.append(button('remove',()=>{if(confirm(tr('confirm')))mutate(row,null)},'assessment-action assessment-delete-action'));
    item.append(heading,top,actions);
    grid.append(item);
  }
  hub.append(list);
}

async function create(title,snapshot,control) {
  title = title.trim();
  if (!title || title.length > 120 || control.disabled) return;
  control.disabled = true;
  const generation = syncGeneration;
  const {data,error} = await ownerRequest('create',{title,snapshot});
  control.disabled = false;
  if (generation !== syncGeneration) return;
  if (error || !data) {report(error || 'Create failed');return}
  await openAssessment(data.id);
}

async function mutate(row,values) {
  const generation = syncGeneration;
  const {data,error} = await ownerRequest(values ? 'edit' : 'delete',{id:row.id,revision:row.revision,...values});
  if (generation !== syncGeneration) return;
  if (error || !data) {report(error || tr('conflict'));return}
  await navigate(screen);
}

async function openAssessment(id) {
  const generation = ++syncGeneration;
  const {data,error} = await ownerRequest('open',{id});
  if (generation !== syncGeneration) return;
  if (error || !data) {report(error || tr('conflict'));return}
  current = data;
  pending = null;
  syncState = '';
  $('assessmentName').textContent = data.title;
  $('assessmentName').classList.toggle('assessment-name-latin',!/[\u0600-\u06ff]/.test(data.title));
  setGpsStatus('');
  $('assessmentShare').disabled = false;
  $('assessmentStop').disabled = true;
  $('assessmentGps').classList.toggle('hidden',data.status !== 'active');
  editor.classList.remove('hidden');
  app.open(data.snapshot,queueSave,data.status !== 'active');
  render();
}

function queueSave(snapshot) {
  pending = structuredClone(snapshot);
  flush();
}

async function flush() {
  if (saving) return saving;
  if (!current || !pending || syncState === 'conflict') return;
  const row = current;
  saving = (async () => {
    while (pending) {
      const snapshot = pending;
      pending = null;
      syncState = 'saving';
      render();
      const {data,error} = await ownerRequest('save',{id:row.id,revision:row.revision,snapshot});
      if (error || !data) {
        console.error(error || 'Revision changed');
        pending ||= snapshot;
        syncState = error ? 'unsaved' : 'conflict';
        break;
      }
      row.revision = data.revision;
      syncState = 'saved';
    }
  })();
  try {await saving} finally {saving = null;render()}
}

$('assessmentBack').onclick = async () => {
  const row = current;
  await flush();
  if (!row || current !== row) return;
  if (pending && !confirm(tr('leave'))) return;
  if (watch !== null || locationSession) await stopGps();
  if (current !== row) return;
  const next = current.status === 'active' ? 'active' : 'history';
  pending = null;
  current = null;
  editor.classList.add('hidden');
  app.home();
  await navigate(next);
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

$('assessmentGps').onsubmit = async event => {
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
$('assessmentStop').onclick = stopGps;

function renderMap() {
  const panel = node('div');
  panel.id = 'assessmentMap';
  const status = node('p',tr('gpsWait'));
  status.id = 'assessmentMapStatus';
  status.setAttribute('role','status');
  hub.append(panel,status);
  if (!window.L) {status.textContent = tr('error');return}
  map = L.map(panel).setView([32,53],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'© OpenStreetMap'
  }).addTo(map);
  markers = L.featureGroup().addTo(map);
  mapFitted = false;
  setTimeout(()=>map?.invalidateSize(),0);
}

async function refreshMap() {
  if (!map || refreshing) return;
  const generation = syncGeneration;
  refreshing = true;
  const result = !client ? {error:true} : await client.rpc('bamco_live_locations');
  const data = Array.isArray(result.data) ? result.data : [];
  refreshing = false;
  if (generation !== syncGeneration || !map) return;
  markers.clearLayers();
  $('assessmentMapStatus').textContent = result.error ? tr('error') :
    data.length ? data.length.toLocaleString(locale())+' '+tr('liveCount') : tr('gpsWait');
  if (result.error) return;
  for (const point of data) {
    const popup = node('div','','assessment-map-popup');
    popup.append(node('strong',point.title));
    popup.append(node('span',formatDate(point.recorded_at)));
    if (Number.isFinite(Number(point.accuracy_m))) {
      const accuracyLabel = language === 'fa' ? 'دقت: ' : language === 'zh' ? '精度：' : 'Accuracy: ';
      popup.append(node('span',accuracyLabel+Math.round(Number(point.accuracy_m)).toLocaleString(locale())+(language==='zh'?' 米':' m')));
    }
    L.marker([point.latitude,point.longitude]).bindPopup(popup).addTo(markers);
  }
  if (!mapFitted && data.length) {
    map.fitBounds(markers.getBounds(),{maxZoom:15,padding:[28,28]});
    mapFitted = true;
  }
}

for (const control of languageButtons) control.onclick = () => {
  language = control.dataset.language;
  try {localStorage.setItem('bamco-assessment-language',language)} catch {}
  render();
  if (screen === 'observer') refreshMap();
};
window.addEventListener('beforeunload',event => {
  if (pending || saving || watch !== null) {event.preventDefault();event.returnValue = ''}
});

navigate(location.search === '?observer' ? 'observer' : 'home');
})();

