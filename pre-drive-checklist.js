(() => {
  'use strict';
  // Keys are stored in day records. Keep them stable when wording or order changes.
  const source = [
    ['engine', 2, 'موتور و سیستم روانکاری', 'Engine and lubrication', '发动机与润滑系统', [
      ['oil-level','کنترل سطح روغن موتور با گیج یا نمایشگر مطابق دستور سازنده','Check engine oil level using the dipstick or display as specified by the manufacturer','按制造商要求使用油尺或显示屏检查机油液位'],
      ['oil-condition','بررسی رنگ، آلودگی غیرعادی و وجود امولسیون در روغن','Inspect oil colour, unusual contamination and emulsification','检查油色、异常污染及乳化现象'],
      ['oil-leaks','کنترل نشتی روغن از موتور، کارتل، فیلتر و اتصالات','Check the engine, sump, filter and connections for oil leaks','检查发动机、油底壳、滤清器及连接处是否漏油'],
      ['coolant-level','بررسی سطح مایع خنک‌کننده در مخزن انبساط در حالت سرد','Check the expansion tank coolant level when cold','冷车时检查膨胀罐冷却液液位'],
      ['coolant-leaks','کنترل نشتی مایع خنک‌کننده، شیلنگ‌ها و رادیاتور','Check for coolant leaks at the hoses and radiator','检查冷却液、软管和散热器有无泄漏'],
      ['belts','بازرسی ظاهری تسمه‌های قابل مشاهده و اتصالات موتور','Visually inspect accessible belts and engine connections','目视检查可见皮带及发动机连接件'],
      ['fuel-leaks','بررسی نشتی سوخت و بوی غیرعادی بنزین یا گازوئیل','Check for fuel leaks and unusual petrol or diesel odours','检查燃油泄漏及异常汽油或柴油气味'],
      ['warning-lights','کنترل چراغ‌های هشدار فشار روغن و دمای موتور','Check oil pressure and engine temperature warning lights','检查机油压力和发动机温度警示灯'],
      ['noise','بررسی صدای غیرعادی موتور در استارت و دور آرام','Listen for unusual engine noise at start-up and idle','检查起动和怠速时发动机有无异响'],
      ['idle','کنترل دور آرام و پایداری عملکرد موتور پس از روشن شدن','Check idle speed and engine stability after start-up','检查起动后的怠速和发动机稳定性']
    ]],
    ['transmission', 3, 'گیربکس، انتقال قدرت و سیستم چهارچرخ محرک', 'Gearbox, driveline and four-wheel drive', '变速箱、传动与四轮驱动系统', [
      ['leaks','بررسی نشتی روغن گیربکس و مجموعه انتقال قدرت','Inspect the gearbox and driveline for oil leaks','检查变速箱及传动系统有无漏油'],
      ['level','کنترل سطح روغن گیربکس در صورت الزام دستورالعمل سازنده','Check gearbox oil level if required by the manufacturer','按制造商要求检查变速箱油位'],
      ['selection','بررسی عملکرد انتخاب دنده‌های P/R/N/D یا دنده‌های دستی','Check P/R/N/D selection or manual gear selection','检查 P/R/N/D 或手动挡位选择功能'],
      ['noise','بررسی صدای غیرعادی گیربکس هنگام درگیر شدن دنده','Listen for abnormal gearbox noise during gear engagement','检查挂挡时变速箱有无异响'],
      ['differential','بررسی نشتی دیفرانسیل و جعبه انتقال قدرت','Check the differential and transfer case for leaks','检查差速器与分动箱有无泄漏'],
      ['shafts','بررسی وضعیت پلوس‌ها، گردگیرها و اتصالات قابل مشاهده','Inspect drive shafts, dust boots and visible joints','检查半轴、防尘套与可见接头'],
      ['4wd','کنترل وضعیت 2H/4H/4L و قفل دیفرانسیل در خودروهای مجهز','Check 2H/4H/4L and differential lock where fitted','检查配备车辆的 2H/4H/4L 模式及差速锁'],
      ['warnings','بررسی چراغ هشدار گیربکس و سیستم انتقال قدرت','Check gearbox and driveline warning lights','检查变速箱与传动系统警示灯']
    ]],
    ['steering-brakes', 4, 'سیستم ترمز و فرمان', 'Braking and steering', '制动与转向系统', [
      ['fluid','کنترل سطح روغن ترمز و بررسی نشتی','Check brake fluid level and inspect for leaks','检查制动液液位及泄漏情况'],
      ['pedal','بررسی حس پدال ترمز، کورس غیرعادی و افت فشار','Check brake pedal feel, abnormal travel and pressure loss','检查制动踏板脚感、异常行程及压力下降'],
      ['parking','کنترل عملکرد ترمز پارک و آزاد شدن کامل آن','Check that the parking brake engages and releases fully','检查驻车制动功能及是否完全释放'],
      ['warnings','بررسی چراغ هشدار ABS، ESC و سیستم ترمز','Check ABS, ESC and brake system warning lights','检查 ABS、ESC 与制动系统警示灯'],
      ['hardware','بررسی وضعیت ظاهری دیسک، کالیپر و شیلنگ‌های قابل مشاهده','Visually inspect accessible brake discs, calipers and hoses','目视检查可见制动盘、卡钳与软管'],
      ['play','بررسی لقی غیرعادی و صدای فرمان','Check for abnormal steering play and noise','检查转向异常间隙及异响'],
      ['steering-fluid','کنترل سطح روغن هیدرولیک فرمان در صورت تجهیز','Check power steering fluid level where fitted','如配备液压转向系统，检查助力油液位'],
      ['eps','بررسی هشدار EPS و عملکرد کمک‌فرمان','Check EPS warnings and steering assistance','检查 EPS 警告及转向助力功能'],
      ['pull','بررسی کشیده شدن غیرعادی خودرو یا لرزش فرمان در حرکت اولیه کنترل‌شده','Check for unusual pulling or steering vibration during initial controlled movement','在受控起步时检查车辆跑偏与方向盘振动']
    ]],
    ['wheels', 5, 'لاستیک، چرخ و سیستم تعلیق', 'Tyres, wheels and suspension', '轮胎、车轮与悬架', [
      ['pressure','اندازه‌گیری و ثبت فشار باد هر چهار لاستیک در حالت سرد','Measure and record the cold pressure of all four tyres','测量并记录四轮冷态胎压'],
      ['spare','کنترل فشار و وضعیت زاپاس در صورت تجهیز','Check spare tyre condition and pressure where fitted','如配备备胎，检查其状态及胎压'],
      ['damage','بررسی آسیب دیواره لاستیک، بریدگی، برآمدگی و جسم خارجی','Inspect for sidewall damage, cuts, bulges and foreign objects','检查胎侧损伤、割伤、鼓包及异物'],
      ['tread','بازرسی سایش غیرعادی و وضعیت آج لاستیک‌ها','Inspect tread condition and uneven tyre wear','检查胎面状况和异常磨损'],
      ['rims','بررسی سلامت ظاهری رینگ‌ها و نبود ترک یا تغییر شکل','Inspect rims for damage, cracks or deformation','检查轮辋有无损伤、裂纹或变形'],
      ['fasteners','بازرسی چشمی پیچ و مهره‌های چرخ و علائم شل‌شدگی','Visually inspect wheel fasteners for signs of loosening','目视检查车轮螺栓、螺母及松动迹象'],
      ['height','کنترل ارتفاع غیرعادی خودرو و افتادگی یک سمت','Check for abnormal ride height or sag on one side','检查车身高度异常或单侧下沉'],
      ['springs','بررسی نشتی کمک‌فنر و آسیب فنرها','Inspect shock absorbers for leaks and springs for damage','检查减振器漏油及弹簧损伤'],
      ['bushes','بررسی لقی، آسیب و پارگی بوش‌ها و گردگیرهای قابل مشاهده','Check visible bushes and boots for play, damage or tears','检查可见衬套与防尘套有无松旷、损伤或破裂']
    ]],
    ['body', 6, 'بدنه، شاسی و اتصالات', 'Body, chassis and fittings', '车身、底盘与连接件', [
      ['damage','بررسی ترک، تغییر شکل و آسیب جدید بدنه و شاسی','Inspect the body and chassis for cracks, deformation and new damage','检查车身与底盘的新损伤、裂纹及变形'],
      ['panels','کنترل وضعیت سپرها، گلگیرها و قطعات زیر بدنه','Check bumpers, mudguards and underbody parts','检查保险杠、翼子板及车底部件'],
      ['trim','بررسی شل‌شدگی قطعات تزئینی و پوشش‌های محافظ','Inspect trim and protective covers for looseness','检查饰件和防护罩是否松动'],
      ['closures','کنترل باز و بسته شدن درب‌ها، کاپوت و درب صندوق','Check opening and closing of doors, bonnet and boot','检查车门、发动机盖及行李厢盖的开闭'],
      ['locks','بررسی عملکرد قفل‌ها و چفت‌های ایمنی','Check locks and safety latches','检查门锁及安全锁扣功能'],
      ['glass','بررسی سلامت شیشه‌ها، آینه‌ها و برف‌پاک‌کن‌ها','Inspect glass, mirrors and wipers','检查车窗玻璃、后视镜及雨刮器'],
      ['connections','کنترل وجود قطعات جداشده یا اتصالات غیرعادی','Check for detached parts or abnormal connections','检查有无脱落部件或异常连接'],
      ['impact','بررسی آثار برخورد، خراش یا آسیب جدید نسبت به روز قبل','Check for new impact marks, scratches or damage since the previous day','对比前一天检查新碰撞痕迹、划痕或损伤']
    ]],
    ['electrical', 7, 'تجهیزات برقی و سامانه‌های ایمنی', 'Electrical equipment and safety systems', '电气设备与安全系统', [
      ['battery','بررسی وضعیت باتری، بست‌ها و اتصالات قابل مشاهده','Inspect battery condition, clamps and visible connections','检查蓄电池、固定夹与可见连接'],
      ['starter','بررسی روشن شدن خودرو و عملکرد سیستم استارت','Check vehicle starting and starter operation','检查车辆起动及起动系统工作情况'],
      ['lights','کنترل چراغ‌های جلو، عقب، ترمز، راهنما و دنده عقب','Check headlights, tail lights, brake lights, indicators and reversing lights','检查前灯、尾灯、制动灯、转向灯及倒车灯'],
      ['washer','کنترل بوق، برف‌پاک‌کن و شیشه‌شوی','Check the horn, wipers and screen washer','检查喇叭、雨刮器与玻璃清洗器'],
      ['cluster','بررسی هشدارهای صفحه آمپر و ثبت پیام‌های خطا','Check instrument cluster warnings and record fault messages','检查仪表盘警告并记录故障信息'],
      ['belts','بررسی عملکرد کمربندهای ایمنی و چراغ هشدار آنها','Check seat belts and their warning light','检查安全带及其警示灯'],
      ['airbag','کنترل وضعیت چراغ هشدار ایربگ و SRS','Check airbag and SRS warning lights','检查安全气囊及 SRS 警示灯'],
      ['sensors','کنترل عملکرد دوربین‌ها و سنسورهای ایمنی در صورت تجهیز','Check safety cameras and sensors where fitted','检查配备的安全摄像头与传感器'],
      ['adas','بررسی وضعیت ADAS و پیام‌های خطای سامانه','Check ADAS status and system fault messages','检查 ADAS 状态及故障信息'],
      ['windows','کنترل عملکرد شیشه‌بالابرها و آینه‌های برقی','Check electric windows and power mirrors','检查电动车窗和电动后视镜']
    ]],
    ['cabin', 8, 'کابین، تهویه و تجهیزات آزمون', 'Cabin, ventilation and test equipment', '座舱、通风与试验设备', [
      ['hvac','بررسی عملکرد سیستم تهویه، بخاری و کولر','Check ventilation, heating and air conditioning','检查通风、暖风与空调功能'],
      ['odour','کنترل بوی غیرعادی، دود یا نفوذ گازهای خروجی به کابین','Check for unusual odours, smoke or exhaust entering the cabin','检查座舱有无异味、烟雾或废气侵入'],
      ['seats','بررسی تثبیت صندلی‌ها و عملکرد تنظیمات ضروری','Check seat security and essential adjustments','检查座椅固定与必要调节功能'],
      ['mounts','کنترل محکم بودن تجهیزات ثبت داده و ابزارهای آزمون','Check data loggers and test instruments are securely mounted','检查数据记录设备与试验仪器固定情况'],
      ['gps','بررسی عملکرد GPS و سیستم ثبت مسیر','Check GPS and route logging','检查 GPS 和轨迹记录系统'],
      ['clock','کنترل ساعت و همگام‌سازی تجهیزات اندازه‌گیری','Check clocks and synchronisation of measuring equipment','检查时钟及测量设备时间同步'],
      ['storage','بررسی فضای ذخیره‌سازی و شارژ تجهیزات ثبت داده','Check storage capacity and charge of data loggers','检查数据记录设备的存储空间和电量'],
      ['emergency','کنترل وجود کپسول آتش‌نشانی، جعبه کمک‌های اولیه و تجهیزات اضطراری','Check for the fire extinguisher, first-aid kit and emergency equipment','检查灭火器、急救箱及应急设备是否齐备'],
      ['repairs','ثبت هرگونه تعمیر، تعویض قطعه یا تنظیمات انجام‌شده از روز قبل','Record repairs, part replacements or adjustments since the previous day','记录自前一天起进行的维修、换件或调整']
    ]],
    ['final', 9, 'بررسی نهایی پیش از حرکت', 'Final checks before departure', '出发前最终检查', [
      ['leaks','تأیید نبود نشتی فعال زیر خودرو','Confirm there are no active leaks under the vehicle','确认车底无活动性泄漏'],
      ['warnings','تأیید نبود هشدار بحرانی روی صفحه آمپر','Confirm there are no critical instrument cluster warnings','确认仪表盘无严重警告'],
      ['wheels','تأیید ایمن بودن وضعیت تایرها، چرخ‌ها و ترمز','Confirm tyres, wheels and brakes are in safe condition','确认轮胎、车轮与制动器状态安全'],
      ['closures','تأیید بسته بودن کاپوت، درب‌ها و صندوق','Confirm the bonnet, doors and boot are closed','确认发动机盖、车门及行李厢盖已关闭'],
      ['cargo','تأیید تثبیت بار و تجهیزات اندازه‌گیری','Confirm the load and measuring equipment are secured','确认载荷与测量设备已固定'],
      ['fuel','تأیید کافی بودن سوخت برای مسیر و نقاط سوخت‌گیری','Confirm sufficient fuel for the route and refuelling stops','确认燃油量足以行驶至计划加油点'],
      ['driver','تأیید آمادگی راننده و تجهیزات ایمنی','Confirm driver and safety equipment readiness','确认驾驶员和安全设备已就绪'],
      ['release','ثبت نتیجه نهایی بازرسی و مجوز شروع پیمایش','Record the inspection result and authorisation to start the drive','记录最终检查结果及出发许可']
    ]]
  ];
  const labels = [
    ['چک‌لیست پیش از پیمایش','Pre-drive checklist','出发前检查清单'],
    ['توضیحات این دسته (اختیاری)','Category comment (optional)','本类别备注（选填）'],
    ['ذخیره فرم روزانه','Save daily form','保存每日表单'],
    ['دانلود اکسل فرم روزانه','Download daily form as Excel','下载每日表单 Excel'],
    ['پیش‌نویس فرم روزانه ذخیره شد.','Daily form draft saved.','每日表单草稿已保存。'],
    ['فرم روزانه ذخیره شد.','Daily form saved.','每日表单已保存。'],
    ['ذخیره تأیید نشد. دوباره ذخیره را بزنید.','Save was not confirmed. Try saving again.','未能确认保存，请重试。'],
    ['در حال ذخیره…','Saving…','正在保存…']
  ];
  function register(fa,en,zh) {
    if (window.BAMCO_TRANSLATIONS) {
      window.BAMCO_TRANSLATIONS.en[fa] = en;
      window.BAMCO_TRANSLATIONS.zh[fa] = zh;
    }
    return fa;
  }
  labels.forEach(row => register(...row));
  window.BAMCO_PRE_DRIVE = source.map(([id,number,fa,en,zh,items]) => ({
    id, number, title:register(fa,en,zh),
    items:items.map(([key,fa,en,zh]) => ({key:id+'-'+key, title:register(fa,en,zh)}))
  }));
})();
