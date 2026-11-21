// One dropdown component for specifications, filters, dialogs and dashboards.
(() => {
  'use strict';
  if (window.BAMCO_DROPDOWNS) return;
  let sequence = 0;
  const closeAll = except => document.querySelectorAll('.vehicle-dropdown-list').forEach(list => {
    if (list !== except) {
      list.hidden = true;
      list.previousElementSibling?.setAttribute('aria-expanded', 'false');
    }
  });
  function enhance(select) {
    if (select.multiple || select.size > 1) return;
    if (select._refreshDropdown) { select._refreshDropdown(); return; }
    const label = select.labels?.[0]?.cloneNode(true);
    label?.querySelectorAll('select,input,button,datalist').forEach(node => node.remove());
    const accessibleName = select.getAttribute('aria-label') || label?.textContent.trim() || select.name;
    const wrapper = document.createElement('span');
    wrapper.className = 'vehicle-dropdown';
    const english = select.closest('#vehicleForm') && ['vclass','body','power','gear','driveType'].includes(select.id);
    if (english) wrapper.classList.add('english-dropdown');
    select.before(wrapper); wrapper.append(select);
    select.dataset.customDropdown = '1';
    select.classList.add('vehicle-native-hidden');
    select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'vehicle-dropdown-trigger';
    trigger.id = 'bamco-dropdown-' + (++sequence);
    trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false');
    if (accessibleName) trigger.setAttribute('aria-label', accessibleName);
    if (select.hasAttribute('aria-labelledby')) trigger.setAttribute('aria-labelledby', select.getAttribute('aria-labelledby'));
    const title = document.createElement('span'), arrow = document.createElement('span');
    arrow.className = 'vehicle-dropdown-arrow'; arrow.textContent = '⌄'; arrow.setAttribute('aria-hidden', 'true');
    trigger.append(title, arrow);
    const list = document.createElement('div');
    list.className = 'vehicle-dropdown-list'; list.id = trigger.id + '-options'; list.hidden = true;
    list.setAttribute('role', 'listbox'); list.setAttribute('aria-labelledby', trigger.id);
    trigger.setAttribute('aria-controls', list.id);
    wrapper.append(trigger, list);
    let signature = '';
    const refresh = () => {
      const options = [...select.options];
      const next = JSON.stringify(options.map(option => [option.value, option.textContent, option.disabled, option.parentElement?.disabled]));
      if (signature !== next) {
        signature = next; list.replaceChildren();
        for (const [index, option] of options.entries()) {
          const item = document.createElement('button');
          item.type = 'button'; item.className = 'vehicle-dropdown-option'; item.tabIndex = -1;
          item.setAttribute('role', 'option'); item.dataset.value = option.value; item.textContent = option.textContent;
          item.addEventListener('click', () => {
            const current = select.options[index];
            if (!current || select.matches(':disabled') || current.disabled || current.parentElement?.disabled) return;
            select.selectedIndex = index;
            select.dispatchEvent(new Event('input', {bubbles:true}));
            select.dispatchEvent(new Event('change', {bubbles:true}));
            refresh(); closeAll();
            if (trigger.isConnected) trigger.focus();
          });
          list.append(item);
        }
      }
      const disabled = select.matches(':disabled');
      trigger.disabled = disabled || !options.length;
      const value = select.selectedOptions[0]?.textContent || '—';
      if (title.textContent !== value) title.textContent = value;
      trigger.setAttribute('aria-required', String(select.required));
      const currentLabel = select.labels?.[0]?.cloneNode(true);
      currentLabel?.querySelectorAll('select,input,button,datalist,.vehicle-dropdown').forEach(node => node.remove());
      const name = select.getAttribute('aria-label') || currentLabel?.textContent.trim() || select.name;
      if (name) trigger.setAttribute('aria-label', name);
      list.querySelectorAll('button').forEach((item, index) => {
        item.disabled = disabled || options[index].disabled || Boolean(options[index].parentElement.disabled);
        item.setAttribute('aria-selected', String(index === select.selectedIndex));
      });
      if (trigger.disabled) { list.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    };
    select._refreshDropdown = refresh;
    select.addEventListener('change', refresh);
    select.addEventListener('focus', () => trigger.focus());
    select.addEventListener('invalid', event => {
      event.preventDefault(); trigger.setAttribute('aria-invalid', 'true'); trigger.focus();
    });
    select.addEventListener('change', () => trigger.removeAttribute('aria-invalid'));
    trigger.addEventListener('click', () => {
      const opening = list.hidden; closeAll(); refresh();
      if (trigger.disabled) return;
      if (opening) {
        const bounds = trigger.getBoundingClientRect(), dialog = trigger.closest('dialog')?.getBoundingClientRect();
        const below = Math.min(innerHeight, dialog?.bottom ?? innerHeight) - bounds.bottom - 12;
        const above = bounds.top - Math.max(0, dialog?.top ?? 0) - 12;
        wrapper.classList.toggle('vehicle-dropdown-up', below < 220 && above > below);
        list.style.maxHeight = Math.min(260, Math.max(100, below < 220 && above > below ? above : below)) + 'px';
      }
      list.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening));
      if (opening) { const selected = list.querySelector('[aria-selected=true]'); if (selected) list.scrollTop = selected.offsetTop - list.offsetTop; }
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeAll(); return; }
      if (['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) {
        event.preventDefault(); if (list.hidden) trigger.click();
        (list.querySelector('[aria-selected=true]:not(:disabled)') || list.querySelector('button:not(:disabled)'))?.focus();
      }
    });
    list.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeAll(); trigger.focus(); }
      if (event.key === 'Tab') closeAll();
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault();
        const items = [...list.querySelectorAll('button:not(:disabled)')], index = items.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }
    });
    refresh();
  }
  window.BAMCO_DROPDOWNS = (root = document) => {
    if (root.matches?.('select')) enhance(root);
    root.querySelectorAll?.('select').forEach(enhance);
  };
  window.BAMCO_DROPDOWNS();
  document.addEventListener('bamco:render', () => window.BAMCO_DROPDOWNS());
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.vehicle-dropdown')) closeAll(); });
  document.addEventListener('focusin', event => { if (!event.target.closest('.vehicle-dropdown')) closeAll(); });
  document.addEventListener('reset', event => queueMicrotask(() => window.BAMCO_DROPDOWNS(event.target)));
  new MutationObserver(changes => {
    const refresh = new Set();
    for (const change of changes) {
      const target = change.target.nodeType === 1 ? change.target : change.target.parentElement;
      const select = target?.closest('select');
      if (select) refresh.add(select);
      if (change.type === 'attributes' && target?.matches('fieldset')) window.BAMCO_DROPDOWNS(target);
      for (const node of change.addedNodes || []) if (node.nodeType === 1) window.BAMCO_DROPDOWNS(node);
    }
    refresh.forEach(select => select.isConnected && enhance(select));
  }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['disabled','selected','label','value','required']});
})();
