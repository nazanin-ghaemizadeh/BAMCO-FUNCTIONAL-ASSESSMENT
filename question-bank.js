(() => {
  'use strict';
  const database = window.BAMCO_DATA;
  const originals = database.tests.map(test => structuredClone(test));
  let revisions = new Map();
  let pendingLoad;
  const routeNames = {
    urban: ['شهری', 'Urban', '城市'], rural: ['برون‌شهری', 'Interurban', '城际'],
    hot: ['گرمسیری', 'Hot climate', '高温'], mountain: ['کوهستانی', 'Mountain', '山区'],
    offroad: ['خارج‌جاده / خاکی', 'Off-road', '越野'], stationary: ['ایستا / کارگاهی', 'Stationary / workshop', '静态 / 车间']
  };
  const words = {
    title: ['بانک سؤالات', 'Question bank', '题库'], back: ['بازگشت', 'Back', '返回'],
    create: ['تعریف سؤال / آزمون', 'Add question / test', '新增问题 / 测试'],
    edit: ['ویرایش', 'Edit', '编辑'], save: ['ذخیره تغییرات', 'Save changes', '保存更改'],
    cancel: ['انصراف', 'Cancel', '取消'], search: ['جست‌وجوی سؤال یا کد آزمون', 'Search questions or test IDs', '搜索问题或测试编号'],
    category: ['شاخص', 'Criterion', '指标'], sub: ['زیرشاخص', 'Subcriterion', '子指标'],
    newSub: ['زیرشاخص جدید…', 'New subcriterion…', '新增子指标…'],
    subName: ['نام زیرشاخص جدید', 'New subcriterion name', '新子指标名称'],
    all: ['همه', 'All', '全部'], state: ['وضعیت', 'Status', '状态'],
    active: ['فعال', 'Active', '启用'], inactive: ['غیرفعال', 'Inactive', '停用'],
    enable: ['فعال‌سازی', 'Activate', '启用'], disable: ['غیرفعال‌سازی', 'Deactivate', '停用'],
    name: ['عنوان سؤال / آزمون', 'Question / test title', '问题 / 测试标题'],
    profile: ['شرایط و روش اجرای آزمون', 'Test conditions and procedure', '测试条件和方法'],
    measure: ['روش سنجش', 'Measurement method', '测量方法'],
    placement: ['محل نمایش', 'Placement', '显示位置'],
    comprehensive: ['ارزیابی جامع', 'Comprehensive assessment', '综合评估'],
    drive: ['قابلیت رانندگی', 'Drivability', '驾驶性能'],
    durability: ['دوام عملکردی', 'Durability', '耐久性'], supplementary: ['استاتیک', 'Static', '静态'],
    comprehensiveHint: ['همه آزمون‌های فعال، متناسب با مشخصات خودرو، در ارزیابی جامع نمایش داده می‌شوند.', 'All active tests appear in comprehensive assessment for applicable vehicles.', '综合评估显示适用于车辆的所有已启用测试。'],
    days: ['روزهای نمایش در قابلیت رانندگی', 'Drivability days', '驾驶性能测试日期'],
    day: ['روز', 'Day', '天'], everyDay: ['انتخاب همه روزها', 'Select all days', '选择全部日期'],
    clearDays: ['پاک کردن انتخاب روزها', 'Clear days', '清除日期'],
    roads: ['نوع جاده', 'Road type', '道路类型'], loads: ['حالت بار', 'Load condition', '载荷状态'],
    allLoads: ['همه حالت‌های بار', 'All load conditions', '全部载荷状态'],
    allRoads: ['همه انواع جاده', 'All road types', '全部道路类型'],
    clearFilters: ['پاک کردن فیلترها', 'Clear filters', '清除筛选'],
    vehicles: ['مشخصات خودروهای مشمول', 'Applicable vehicles', '适用车辆'],
    cls: ['کلاس خودرو', 'Vehicle class', '车辆类别'], body: ['نوع بدنه', 'Body', '车身'],
    power: ['قوای محرکه', 'Powertrain', '动力系统'], gear: ['گیربکس', 'Transmission', '变速箱'],
    vehicleDrive: ['سیستم انتقال قدرت', 'Drive system', '驱动系统'],
    freq: ['تناوب اجرا در دوام', 'Durability frequency', '耐久性测试频率'],
    durabilityHint: ['در دوام، آزمون در نقاط ۲۵، ۵۰، ۷۵ و ۱۰۰ درصد پیمایش مسیرهای انتخاب‌شده نمایش داده می‌شود.', 'Durability tests appear at 25, 50, 75 and 100 percent of the selected routes’ mileage.', '耐久性测试在所选路线里程的25%、50%、75%和100%处显示。'],
    error: ['ذخیره انجام نشد. دوباره تلاش کنید.', 'Could not save. Please retry.', '保存失败，请重试。'],
    loadError: ['بانک سؤالات دریافت نشد.', 'Could not load the question bank.', '无法加载题库。'],
    retry: ['تلاش دوباره', 'Retry', '重试'], loading: ['در حال دریافت سؤالات…', 'Loading questions…', '正在加载问题…'],
    saved: ['تغییرات ذخیره شد.', 'Changes saved.', '更改已保存。'],
    conflict: ['این سؤال هم‌زمان ویرایش شده است. فرم را ببندید و نسخه تازه را باز کنید.', 'This question changed in another session. Close and reopen the editor to review the latest version.', '此问题已在其他会话中更改。请关闭并重新打开编辑器。'],
    selectDays: ['حداقل یک روز برای قابلیت رانندگی انتخاب کنید.', 'Choose at least one drivability day.', '请至少选择一个驾驶性能测试日期。'],
    selectRoad: ['برای آزمون دوام، نوع جاده یا حالت ایستا را انتخاب کنید.', 'Choose a road type or stationary mode for durability.', '请为耐久性测试选择道路类型或静态模式。'],
    selectVehicle: ['برای هر مشخصه خودرو حداقل یک گزینه انتخاب کنید.', 'Choose at least one option for each vehicle condition.', '请为每个车辆条件至少选择一个选项。'],
    empty: ['سؤالی مطابق فیلتر پیدا نشد.', 'No matching questions.', '没有匹配的问题。'],
    previous: ['صفحه قبل', 'Previous', '上一页'], next: ['صفحه بعد', 'Next', '下一页'],
    count: ['سؤال', 'questions', '个问题'], page: ['صفحه', 'Page', '页'],
    unspecified: ['تعیین‌نشده', 'Unspecified', '未指定']
  };
  const loads = test => test.loadConditions ?? window.BAMCO_WORKBOOK?.tests[test.sourceId]?.loads ?? [];
  const roads = test => [...(test.routeIds || []), ...(test.stationary ? ['stationary'] : [])];
  const matches = (test, load, road) => (!load || loads(test).includes(load)) && (!road || roads(test).includes(road));
  const canEdit = () => window.BAMCO_PORTAL.can('setup');
  const label = key => (words[key] || routeNames[key])[['fa','en','zh'].indexOf(window.BAMCO_I18N?.language || 'fa')];

  function applyRows(rows) {
    revisions = new Map(rows.map(row => [row.id, row]));
    const bank = originals.map(test => ({...structuredClone(test), ...revisions.get(test.id)?.definition}));
    const existing = new Set(bank.map(test => test.id));
    for (const row of rows) if (!existing.has(row.id)) bank.push({...row.definition, id: row.id});
    database.tests.splice(0, database.tests.length, ...bank);
  }

  function load() {
    if (!pendingLoad) {
      pendingLoad = window.BAMCO_PORTAL.rpc('bamco_question_bank', {operation: 'list'}).then(({data, error}) => {
        if (error || !Array.isArray(data)) throw error || new Error('Invalid question bank response');
        applyRows(data);
      }).finally(() => { pendingLoad = null; });
    }
    return pendingLoad;
  }

  async function save(test, revision) {
    const {id, sourceId, ...definition} = test;
    const {data, error} = await window.BAMCO_PORTAL.rpc('bamco_question_bank', {
      operation: 'save', args: {id, revision, definition}
    });
    if (error || !data) throw error || new Error('Empty save response');
    if (data.conflict) { await load(); throw Object.assign(new Error('Conflict'), {conflict: true}); }
    if (data.id !== id || !data.definition || !Number.isInteger(data.revision)) throw new Error('Invalid save response');
    const rows = new Map(revisions);
    rows.set(id, data);
    applyRows([...rows.values()]);
  }

  function complete(test) {
    return {...test, active: test.active !== false, loadConditions: [...loads(test)],
      profile: test.profile || '', measure: test.measure || '', route: test.route || '', freq: test.freq || '',
      days: test.days || [], routeIds: test.routeIds || [], stationary: Boolean(test.stationary)};
  }

  function mount(host, {language = 'fa', home}) {
    const languageIndex = ['fa','en','zh'].indexOf(language);
    const text = key => (words[key] || routeNames[key] || [key])[languageIndex] || key;
    const number = value => Number(value).toLocaleString(language === 'fa' ? 'fa-IR' : language);
    const filters = {category: '', sub: '', query: '', state: '', placement: ''};
    let page = 0;
    host.classList.add('question-bank');
    const element = (tag, value, className) => {
      const node = document.createElement(tag);
      if (value) node.textContent = value;
      if (className) node.className = className;
      return node;
    };
    const button = (label, action, primary = false) => {
      const node = element('button', text(label), 'assessment-action' + (primary ? ' qb-primary' : ''));
      node.type = 'button'; node.onclick = action; node.dataset.qbAction = label;
      return node;
    };
    const header = element('div', '', 'qb-header');
    const heading = element('h1', text('title'), 'gate-title welcome-title');
    const divider = element('div', '', 'welcome-divider'); divider.setAttribute('aria-hidden', 'true');
    divider.append(element('i'), element('i'), element('i'));
    const navigation = element('div', '', 'assessment-page-toolbar');
    const back = button('back', home); back.classList.add('assessment-back-action'); navigation.append(back);
    if (canEdit()) navigation.append(button('create', () => edit(), true));
    header.append(heading, divider, navigation);
    const status = element('p', '', 'qb-status'); status.setAttribute('role', 'status');
    const toolbar = element('div', '', 'qb-filters');
    const results = element('div', '', 'qb-results');
    host.replaceChildren(header, toolbar, status, results);

    function select(key, label, values) {
      const wrapper = element('label', text(label));
      const control = element('select'); control.dataset.filter = key;
      control.append(new Option(text('all'), ''));
      for (const [value, name] of values) control.append(new Option(name, value));
      control.value = filters[key];
      control.onchange = () => {
        filters[key] = control.value; page = 0;
        if (key === 'category') { filters.sub = ''; renderFilters(); }
        renderResults();
      };
      wrapper.append(control); toolbar.append(wrapper);
    }
    function renderFilters() {
      toolbar.replaceChildren();
      const searchLabel = element('label', text('search'));
      const search = element('input'); search.type = 'search'; search.value = filters.query;
      search.dataset.filter = 'query';
      search.oninput = () => { filters.query = search.value; page = 0; renderResults(); };
      searchLabel.append(search); toolbar.append(searchLabel);
      const unique = field => [...new Set(database.tests.filter(test => !filters.category || field === 'cat' || test.cat === filters.category).map(test => test[field]))];
      select('category', 'category', unique('cat').map(value => [value, value]));
      select('sub', 'sub', unique('sub').map(value => [value, value]));
      select('placement', 'placement', ['comprehensive','drive','durability','supplementary'].map(key => [key, text(key)]));
      select('state', 'state', ['active','inactive'].map(key => [key, text(key)]));
      const reset = button('clearFilters', () => { Object.keys(filters).forEach(key => { filters[key] = ''; }); page = 0; renderFilters(); renderResults(); });
      toolbar.append(reset);
      window.BAMCO_DROPDOWNS?.(toolbar);
    }
    const normalize = value => value.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    function renderResults() {
      const query = normalize(filters.query.trim());
      const tests = database.tests.filter(test =>
        (!filters.category || test.cat === filters.category) && (!filters.sub || test.sub === filters.sub) &&
        (!filters.placement || filters.placement === 'comprehensive' || test.scope.includes(filters.placement)) &&
        (!filters.state || (test.active !== false) === (filters.state === 'active')) &&
        (!query || normalize([test.id, test.sourceId, test.cat, test.sub, test.name].join(' ')).includes(query)));
      const pages = Math.max(1, Math.ceil(tests.length / 12));
      page = Math.min(page, pages - 1);
      results.replaceChildren(element('p', number(tests.length) + ' ' + text('count'), 'qb-count'));
      if (!tests.length) results.append(element('p', text('empty')));
      for (const test of tests.slice(page * 12, (page + 1) * 12)) {
        const card = element('article', '', 'qb-question'); card.dataset.question = test.id;
        const heading = element('div', '', 'qb-question-heading');
        const titles = element('div');
        const category = element('div', '', 'qb-taxonomy');
        category.append(element('span', test.cat), element('span', test.sub));
        titles.append(category, element('h2', test.name));
        heading.append(titles, element('span', text(test.active === false ? 'inactive' : 'active'), 'qb-badge ' + (test.active === false ? 'inactive' : '')));
        card.append(heading, element('code', test.id + (test.sourceId ? ' · ' + test.sourceId : '')));
        const placements = element('div', '', 'qb-placement');
        for (const key of ['comprehensive', ...test.scope]) placements.append(element('span', text(key), 'qb-chip qb-chip-' + key));
        card.append(placements);
        if (test.scope.includes('drive')) card.append(element('p', text('days') + ' — ' + test.days.map(number).join('، '), 'qb-day-summary'));
        const details = element('details'); details.append(element('summary', text('profile')));
        details.append(element('p', test.profile), element('p', text('measure') + ' — ' + test.measure),
          element('p', text('loads') + ' — ' + (loads(test).join(' / ') || text('unspecified'))),
          element('p', text('roads') + ' — ' + (roads(test).map(text).join(' / ') || text('unspecified'))));
        card.append(details);
        if (canEdit()) {
          const actions = element('div', '', 'qb-actions');
          actions.append(button('edit', () => edit(test)));
          const toggle = button(test.active === false ? 'enable' : 'disable', async () => {
            toggle.disabled = true; status.textContent = '';
            try {
              const current = database.tests.find(item => item.id === test.id);
              await save({...complete(current), active: current.active === false}, revisions.get(test.id)?.revision || 0);
              status.textContent = text('saved'); renderResults();
        } catch (error) { status.textContent = text(error.conflict ? 'conflict' : 'error'); toggle.disabled = false; if(error.conflict) renderResults(); }
          });
          actions.append(toggle); card.append(actions);
        }
        results.append(card);
      }
      const pager = element('div', '', 'qb-pagination');
      const previous = button('previous', () => { page--; renderResults(); host.scrollIntoView({block: 'start'}); });
      const next = button('next', () => { page++; renderResults(); host.scrollIntoView({block: 'start'}); });
      previous.disabled = page === 0; next.disabled = page === pages - 1;
      pager.append(previous, element('span', text('page') + ' ' + number(page + 1) + ' / ' + number(pages)), next);
      results.append(pager);
    }

    function edit(existing) {
      const vehicleValues = Object.fromEntries(['cls','body','power','gear','drive'].map(key =>
        [key, [...new Set(originals.flatMap(test => test.vehicle[key]))]]));
      const test = existing ? complete(existing) : {
        id: 'QB-' + crypto.randomUUID(), active: true, name: '', cat: originals[0].cat, sub: '',
        profile: '', measure: '', scope: [], days: [], routeIds: [], loadConditions: [],
        stationary: false, route: '', freq: '', vehicle: vehicleValues
      };
      const revision = revisions.get(test.id)?.revision || 0;
      const dialog = element('dialog', '', 'qb-dialog');
      const form = element('form'); const fields = element('fieldset');
      const controls = {};
      const editorTitle = element('h2', text(existing ? 'edit' : 'create')); editorTitle.id = 'qb-editor-title';
      dialog.setAttribute('aria-labelledby', editorTitle.id);
      form.append(editorTitle, fields);
      function input(key, label, multiline = false) {
        const wrapper = element('label', text(label), ['cat','sub'].includes(key) ? 'qb-field' : 'qb-field qb-wide');
        const control = element(['cat','sub'].includes(key) ? 'select' : multiline ? 'textarea' : 'input');
        if(key === 'cat') for(const value of new Set(originals.map(item => item.cat))) control.append(new Option(value, value));
        control.name = key; control.value = test[key] || ''; control.maxLength = multiline ? 5000 : 500;
        control.required = ['name','cat','sub'].includes(key);
        wrapper.append(control); fields.append(wrapper); controls[key] = control;
        return control;
      }
      input('cat', 'category');
      const sub = input('sub', 'sub');
      const customSubLabel = element('label', text('subName'), 'qb-field qb-wide');
      const customSub = element('input'); customSub.name = 'subCustom'; customSub.maxLength = 500;
      customSubLabel.append(customSub); fields.append(customSubLabel);
      const updateCustomSub = () => {
        customSubLabel.hidden = sub.value !== '__new__'; customSub.required = !customSubLabel.hidden;
      };
      const updateSubs = (value = '') => {
        sub.replaceChildren(new Option('—', ''));
        const values = new Set(database.tests.filter(item => item.cat === controls.cat.value).map(item => item.sub));
        if (value) values.add(value);
        for (const name of values) sub.append(new Option(name, name));
        sub.append(new Option(text('newSub'), '__new__')); sub.value = value;
        updateCustomSub(); sub._refreshDropdown?.();
      };
      updateSubs(test.sub); controls.cat.addEventListener('change', () => updateSubs());
      sub.addEventListener('change', updateCustomSub);
      input('name', 'name'); input('profile', 'profile', true); input('measure', 'measure', true);
      function choices(label, key, options, selected, parent = fields) {
        const group = element('fieldset', '', 'qb-choice-group'); group.append(element('legend', text(label)));
        for (const [value, name] of options) {
          const wrapper = element('label'); const control = element('input');
          control.type = 'checkbox'; control.name = key; control.value = value; control.checked = selected.includes(value);
          wrapper.append(control, document.createTextNode(name)); group.append(wrapper);
        }
        parent.append(group); return group;
      }
      const active = choices('state', 'active', [['yes', text('active')]], test.active ? ['yes'] : []);
      fields.append(element('p', text('comprehensiveHint'), 'qb-help'));
      const placements = choices('placement', 'scope', ['drive','durability','supplementary'].map(key => [key,text(key)]), test.scope);
      const days = choices('days', 'days', database.driveDays.map(day => [String(day.day), text('day') + ' ' + number(day.day) + ' · ' + (language === 'fa' ? day.type : text({شهری:'urban','برون‌شهری':'rural',گرمسیری:'hot',کوهستانی:'mountain'}[day.type] || 'day'))]), test.days.map(String));
      days.classList.add('qb-days');
      const dayActions = element('div', '', 'qb-actions');
      dayActions.append(button('everyDay', () => days.querySelectorAll('input').forEach(control => { control.checked = true; })),
        button('clearDays', () => days.querySelectorAll('input').forEach(control => { control.checked = false; })));
      days.append(dayActions);
      const updateDays = () => { days.hidden = !placements.querySelector('[value="drive"]').checked; };
      placements.onchange = updateDays; updateDays();
      choices('roads', 'roads', Object.keys(routeNames).map(key => [key,text(key)]), roads(test));
      fields.append(element('p', text('durabilityHint'), 'qb-help'));
      const loadOptions = [...new Set([...originals.flatMap(loads), ...database.tests.flatMap(loads)])];
      choices('loads', 'loadConditions', loadOptions.map(value => [value,value]), loads(test));
      const vehicles = element('details'); vehicles.append(element('summary', text('vehicles')));
      for (const [key, values] of Object.entries(vehicleValues)) {
        choices(key === 'drive' ? 'vehicleDrive' : key, 'vehicle-' + key, values.map(value => [value,value]), test.vehicle[key], vehicles);
      }
      fields.append(vehicles);
      const errorMessage = element('p', '', 'qb-error'); errorMessage.setAttribute('role', 'alert');
      const actions = element('div', '', 'qb-actions');
      const submit = element('button', text('save'), 'assessment-action qb-primary'); submit.type = 'submit';
      actions.append(submit, button('cancel', () => dialog.close()));
      form.append(errorMessage, actions); dialog.append(form); host.append(dialog);
      dialog.onclose = () => dialog.remove();
      window.BAMCO_DROPDOWNS?.(dialog); dialog.showModal();
      const selected = key => [...form.querySelectorAll('input[name="' + key + '"]:checked')].map(control => control.value);
      form.onsubmit = async event => {
        event.preventDefault(); if (submit.disabled) return;
        const scopes = selected('scope'), chosenDays = selected('days').map(Number), chosenRoads = selected('roads');
        const vehicle = Object.fromEntries(Object.keys(vehicleValues).map(key => [key, selected('vehicle-' + key)]));
        if (scopes.includes('drive') && !chosenDays.length) { errorMessage.textContent = text('selectDays'); return; }
        if (scopes.includes('durability') && !chosenRoads.length) { errorMessage.textContent = text('selectRoad'); return; }
        if (Object.values(vehicle).some(values => !values.length)) { errorMessage.textContent = text('selectVehicle'); return; }
        const next = {...test, ...Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value.trim()])),
          sub: sub.value === '__new__' ? customSub.value.trim() : sub.value,
          active: active.querySelector('input').checked, scope: scopes, days: chosenDays, vehicle,
          routeIds: chosenRoads.filter(key => key !== 'stationary'), stationary: chosenRoads.includes('stationary'),
          loadConditions: selected('loadConditions'), route: chosenRoads.map(key => routeNames[key][0]).join(' / ')};
        fields.disabled = true; submit.disabled = true; errorMessage.textContent = '';
        try {
          await save(next, revision);
          dialog.close(); status.textContent = text('saved'); renderFilters(); renderResults();
        } catch (error) {
          fields.disabled = false; submit.disabled = false;
          errorMessage.textContent = text(error.conflict ? 'conflict' : 'error');
          if(error.conflict) renderResults();
        }
      };
    }

    async function refresh() {
      status.textContent = text('loading');
      try {
        await load(); if (!host.isConnected) return;
        status.textContent = ''; renderFilters(); renderResults();
      } catch {
        if (host.isConnected) { status.textContent = text('loadError'); status.append(' ', button('retry', refresh)); }
      }
    }
    refresh();
  }
  window.BAMCO_QUESTION_BANK = {load, mount, loads, roads, matches, routeNames, label};
})();
