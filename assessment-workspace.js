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
  observer:['ناظر GPS','GPS observer','定位观察员'],
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
  legacy:['ایجاد ارزیابی از داده‌های این مرورگر','Create from this browser’s previous data','从此浏览器的旧数据创建'],
  load:['در حال اتصال…','Connecting…','正在连接…'],
  error:['ارتباط با سامانه برقرار نشد.','Could not connect to the service.','无法连接到服务。'],
  retry:['تلاش دوباره','Retry','重试'],
  saving:['در حال ذخیره…','Saving…','正在保存…'],
  saved:['در دیتابیس ذخیره شد.','Saved to the database.','已保存到数据库。'],
  unsaved:['تغییرات ذخیره نشد. نسخه پشتیبان بگیرید یا دوباره تلاش کنید.','Changes could not be saved. Export a backup or retry.','更改未保存。请导出备份或重试。'],
  conflict:['این ارزیابی در جای دیگری تغییر کرده است. نسخه پشتیبان بگیرید و آن را دوباره باز کنید.','This assessment changed elsewhere. Export a backup and reopen it.','此评估已在其他位置更改。请导出备份后重新打开。'],
  leave:['با وجود تغییرات ذخیره‌نشده خارج می‌شوید؟','Leave with unsaved changes?','仍要离开并放弃未保存的更改？'],
  copyLink:['کپی لینک','Copy link','复制链接'],
  copied:['لینک کپی شد.','Link copied.','链接已复制。'],
  observerLink:['لینک اختصاصی ناظر','Private observer link','专用观察链接'],
  enterLink:['لینک ناظر را وارد کنید','Paste the observer link','粘贴观察链接'],
  invalidLink:['لینک ناظر معتبر نیست.','The observer link is invalid.','观察链接无效。'],
  browserScope:['ارزیابی‌های این مرورگر','Assessments for this browser','此浏览器的评估'],
  share:['شروع ارسال GPS','Start GPS sharing','开始共享定位'],
  stop:['توقف ارسال GPS','Stop GPS sharing','停止共享定位'],
  gpsWait:['در انتظار موقعیت تازه از ارزیاب…','Waiting for a fresh location from the evaluator…','等待评估员发送最新位置…'],
  gpsError:['GPS در دسترس نیست. مجوز موقعیت و اتصال را بررسی کنید.','GPS is unavailable. Check location permissions and your connection.','定位不可用。请检查定位权限和网络。'],
  keepOpen:['برای ارسال، صفحه را باز و گوشی را روشن نگه دارید.','Keep this page open and the phone awake to share location.','共享定位时请保持页面开启及手机亮屏。'],
  position:['آخرین موقعیت','Latest location','最新位置'],
  backup:['دریافت نسخه پشتیبان','Download backup','下载备份'],
  partial:['متن تخصصی بانک آزمون فعلاً فارسی است.','The technical test bank is currently in Persian.','专业试验题库目前为波斯语。']
};

const interfaceText = [
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
  ['#moduleLanding .gate-edit','ویرایش مشخصات خودرو و برنامه','Edit vehicle and test plan','编辑车辆与试验计划'],
  ['#editSetupBtn','ویرایش مشخصات خودرو','Edit vehicle details','编辑车辆信息'],
  ['label[for="vclass"]','رده خودرو','Vehicle class','车辆类别'],
  ['label[for="body"]','نوع بدنه','Body type','车身类型'],
  ['label[for="power"]','قوای محرکه','Powertrain','动力总成'],
  ['label[for="gear"]','گیربکس','Transmission','变速箱'],
  ['label[for="driveType"]','سیستم محرک','Drivetrain','驱动形式'],
  ['label[for="driveKm"]','هدف قابلیت رانندگی (کیلومتر)','Drivability distance target (km)','驾驶性能目标里程（公里）'],
  ['label[for="durKm"]','هدف پیمایش دوام (کیلومتر)','Durability distance target (km)','耐久目标里程（公里）'],
  ['label[for="durDays"]','روزهای برنامه دوام','Durability program duration','耐久计划天数'],
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
  for (const option of $('durDays').options) {
    option.textContent = language === 'fa' ? Number(option.value).toLocaleString('fa-IR')+' روز' :
      option.value+(language === 'en'?' days':' 天');
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
let gpsStatus = '';
let screen = 'home', rows = [], current, notice = '', pending = null, saving, syncState = '', syncGeneration = 0;
let map, markers, poll, watch = null, gpsGeneration = 0, gpsViewer = '', gpsWrite = Promise.resolve(), heartbeat;

let observerKey = null;

function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
}

function ownerRequest(operation,args = {}) {
  try {
    const storageKey = 'bamco-assessment-browser-key';
    let browser_key = localStorage.getItem(storageKey);
    if (!/^[0-9a-f]{64}$/.test(browser_key || '')) {
      browser_key = randomKey();
      localStorage.setItem(storageKey,browser_key);
    }
    return client.rpc('bamco_browser_assessment',{browser_key,operation,args});
  } catch (error) {
    return Promise.resolve({error});
  }
}

function viewerFromHash(hash) {
  return /^#observer=([0-9a-f]{64})$/.exec(hash)?.[1] || null;
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(key, action, className = 'assessment-action') {
  const b = node('button', tr(key), className);
  b.type = 'button';
  b.onclick = action;
  return b;
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
  const b = button(key, action, 'gate-card');
  b.dataset.gateIcon = icon;
  b.setAttribute('aria-label',tr(key));
  const illustration = node('span','','gate-illustration');
  illustration.setAttribute('aria-hidden','true');
  b.replaceChildren(illustration,node('strong',tr(key)),node('span',tr(key+'Cta'),'gate-cta'));
  return b;
}

function cards(...items) {
  const grid = node('div', '', 'gate-grid');
  grid.append(...items);
  hub.append(grid);
}

function report(error) {
  console.error(error);
  notice = 'error';
  render();
}

function render() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  translateInterface();
  $('assessmentLanguages').setAttribute('aria-label',tr('language'));
  for (const b of languageButtons) b.setAttribute('aria-pressed',String(b.dataset.language === language));
  $('brandName').textContent = tr('brandName');
  $('brandTitle').textContent = tr('brandTitle');
  document.querySelector('.brand-logo').alt = tr('brandAlt');
  document.title = tr('brandName')+' | '+tr('brandTitle');
  $('assessmentGpsStatus').textContent = gpsStatus ? tr(gpsStatus) : '';
  $('backupBtn').textContent = tr('backup');
  $('assessmentBack').textContent = tr('back');
  $('assessmentShare').textContent = tr('share');
  $('assessmentStop').textContent = tr('stop');
  $('assessmentCopyLink').textContent = tr('copyLink');
  $('assessmentObserverLinkLabel').textContent = tr('observerLink');
  if (current) {
    $('assessmentSync').textContent = syncState ? tr(syncState) : '';
    if (language !== 'fa') $('assessmentSync').append(' ',tr('partial'));
    if (pending && !saving && syncState === 'unsaved') $('assessmentSync').append(' ',button('retry',flush));
    return;
  }
  if (map) {map.remove();map = null}
  const title = node('h1',screen === 'home' ? '' : tr(screen === 'roles' ? 'active' : screen),'gate-title welcome-title');
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
  const toolbar = node('div','','toolbar');
  if (screen !== 'home') toolbar.append(button('back',()=>navigate(['evaluator','observer'].includes(screen) ? 'roles' : 'home')));
  if (toolbar.childElementCount) hub.append(toolbar);
  if (screen === 'home') cards(card('active','setup',()=>navigate('roles')),card('history','results',()=>navigate('history')));
  if (screen === 'roles') cards(card('evaluator','supplementary',()=>navigate('evaluator')),card('observer','observer',()=>navigate('observer')));
  if (screen === 'evaluator' || screen === 'history') renderRows();
  if (screen === 'observer') {
    if (observerKey) renderMap();
    else {
      const form = node('form');
      const input = field('text','enterLink');
      input.autocomplete = 'off';
      form.append(input,node('button',tr('open'),'assessment-action'));
      form.onsubmit = event => {
        event.preventDefault();
        let key;
        try {
          const link = new URL(input.value.trim(),location.href);
          if (link.origin === location.origin) key = viewerFromHash(link.hash);
        } catch {}
        if (!key) {notice = 'invalidLink';render();return}
        observerKey = key;
        history.replaceState(null,'','#observer='+key);
        navigate('observer');
      };
      hub.append(form);
    }
  }
}

async function navigate(next) {
  clearInterval(poll);
  const generation = ++syncGeneration;
  screen = next; rows = []; notice = '';
  if (next !== 'observer') {
    observerKey = null;
    if (viewerFromHash(location.hash)) history.replaceState(null,'',location.pathname);
  }
  if (['evaluator','history'].includes(next)) notice = 'load';
  render();
  if (next === 'observer' && observerKey) {
    await refreshMap();
    if (generation === syncGeneration) poll = setInterval(refreshMap,5000);
  }
  if (!['evaluator','history'].includes(next)) return;
  const {data,error} = await ownerRequest('list',{status:next === 'history' ? 'completed' : 'active'});
  if (generation !== syncGeneration) return;
  if (error) {report(error);return}
  rows = data; notice = ''; render();
}

function renderRows() {
  hub.append(node('p',tr('browserScope')));
  if (screen === 'evaluator') {
    const form = node('form');
    const title = field('text','name');
    title.maxLength = 120;
    form.append(title,node('button',tr('create'),'assessment-action'));
    form.onsubmit = async event => {
      event.preventDefault();
      await create(title.value,{},form.querySelector('button'));
    };
    const legacy = app.legacy();
    if (legacy?.config) form.append(button('legacy',event=>create(title.value || prompt(tr('name')) || '',legacy,event.currentTarget)));
    hub.append(form);
  }
  if (!rows.length && !notice) hub.append(node('p',tr('empty')));
  for (const row of rows) {
    const item = node('div','','surface assessment-row');
    item.append(node('bdi',row.title,'assessment-row-title'),button('open',()=>openAssessment(row.id)));
    item.append(button('rename',()=>{
      const title = prompt(tr('name'),row.title)?.trim();
      if (title && title.length <= 120 && title !== row.title) mutate(row,{title});
    }));
    const active = row.status === 'active';
    item.append(button(active?'finish':'reopen',()=>mutate(row,{status:active?'completed':'active'})));
    item.append(button('remove',()=>{if(confirm(tr('confirm')))mutate(row,null)}));
    hub.append(item);
  }
}

async function create(title,snapshot,control) {
  title = title.trim();
  if (!title || title.length > 120 || control.disabled) return;
  control.disabled = true;
  const generation = syncGeneration;
  const {data,error} = await ownerRequest('create',{title,snapshot});
  control.disabled = false;
  if (generation !== syncGeneration) return;
  if (error) {report(error);return}
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
  pending = null; syncState = '';
  $('assessmentName').textContent = data.title;
  setGpsStatus('');
  $('assessmentObserverLink').value = '';
  $('assessmentObserverLink').closest('label').hidden = true;
  $('assessmentCopyLink').hidden = true;
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
      pending = null; syncState = 'saving'; render();
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
  if (watch !== null || gpsViewer) {
    if (!await stopGps()) return;
  }
  if (current !== row) return;
  const next = current.status === 'active' ? 'evaluator' : 'history';
  pending = null; current = null;
  editor.classList.add('hidden');
  app.home();
  await navigate(next);
};

function setGpsStatus(key) {
  gpsStatus = key;
  $('assessmentGpsStatus').textContent = key ? tr(key) : '';
}

function gpsUpdate(operation,values = {}) {
  const id = current.id, viewer = gpsViewer;
  gpsWrite = gpsWrite.then(async () => {
    const {data,error} = await ownerRequest(operation,{id,viewer,...values});
    return !error && Boolean(data);
  }).catch(()=>false);
  return gpsWrite;
}

$('assessmentGps').onsubmit = async event => {
  event.preventDefault();
  if (!current || watch !== null || gpsViewer) return;
  if (!navigator.geolocation) {setGpsStatus('gpsError');return}
  const row = current;
  const viewer = randomKey();
  gpsViewer = viewer;
  const generation = ++gpsGeneration;
  $('assessmentBack').disabled = true;
  $('assessmentShare').disabled = true;
  const {data,error} = await ownerRequest('gps_start',{id:row.id,viewer});
  $('assessmentBack').disabled = false;
  if (error || !data) {
    gpsViewer = '';
    $('assessmentShare').disabled = false;
    setGpsStatus('error');
    return;
  }
  if (current !== row || generation !== gpsGeneration) return;
  $('assessmentStop').disabled = false;
  const url = new URL(location.href);
  url.hash = 'observer='+viewer;
  const link = $('assessmentObserverLink');
  link.value = url.href;
  link.closest('label').hidden = false;
  $('assessmentCopyLink').hidden = false;
  setGpsStatus('keepOpen');
  let last = 0, writing = false;
  const publish = async ({coords}) => {
    if (generation !== gpsGeneration || writing || Date.now()-last < 4000) return;
    writing = true; last = Date.now();
    const ok = await gpsUpdate('gps_point',{latitude:coords.latitude,longitude:coords.longitude});
    writing = false;
    if (generation === gpsGeneration) setGpsStatus(ok?'keepOpen':'gpsError');
  };
  const onLocationError = () => {if(generation === gpsGeneration)setGpsStatus('gpsError')};
  const options = {enableHighAccuracy:true,maximumAge:5000,timeout:20000};
  watch = navigator.geolocation.watchPosition(publish,onLocationError,options);
  heartbeat = setInterval(()=>navigator.geolocation.getCurrentPosition(publish,onLocationError,options),30000);
};

async function stopGps() {
  ++gpsGeneration;
  clearInterval(heartbeat);
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  watch = null;
  if (!gpsViewer) return true;
  const ok = await gpsUpdate('gps_stop');
  setGpsStatus(ok ? '' : 'error');
  if (!ok) return false;
  gpsViewer = '';
  $('assessmentShare').disabled = false; $('assessmentStop').disabled = true;
  $('assessmentObserverLink').value = '';
  $('assessmentObserverLink').closest('label').hidden = true;
  $('assessmentCopyLink').hidden = true;
  return true;
}
$('assessmentStop').onclick = stopGps;
$('assessmentCopyLink').onclick = async () => {
  const link = $('assessmentObserverLink');
  try {
    await navigator.clipboard.writeText(link.value);
    setGpsStatus('copied');
  } catch {
    link.focus();
    link.select();
  }
};

function renderMap() {
  const panel = node('div');
  panel.id = 'assessmentMap';
  const status = node('p',tr('gpsWait'));
  status.id = 'assessmentMapStatus'; status.setAttribute('role','status');
  hub.append(panel,status);
  if (!window.L) {status.textContent = tr('error');return}
  map = L.map(panel).setView([32,53],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,attribution:'© OpenStreetMap'
  }).addTo(map);
  markers = L.featureGroup().addTo(map);
}

let refreshing = false;
async function refreshMap() {
  if (!map || refreshing) return;
  const generation = syncGeneration;
  refreshing = true;
  const result = client ? await client.rpc('bamco_observer_location',{viewer_key:observerKey}) : {error:true};
  const {error} = result;
  const data = result.data ? [result.data] : [];
  refreshing = false;
  if (generation !== syncGeneration || !map) return;
  const first = !markers.getLayers().length;
  markers.clearLayers();
  $('assessmentMapStatus').textContent = tr(error ? 'error' : data.length ? 'position' : 'gpsWait');
  if (error) return;
  for (const point of data) {
    const time = new Date(point.recorded_at).toLocaleString(language);
    L.marker([point.latitude,point.longitude]).bindPopup(node('span',time)).addTo(markers);
  }
  if (first && data.length) map.fitBounds(markers.getBounds(),{maxZoom:15});
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

observerKey = viewerFromHash(location.hash);
navigate(observerKey || location.search === '?observer' ? 'observer' : 'home');
})();
