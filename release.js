(() => {
  'use strict';
  const config = __BAMCO_RELEASE_CONFIG__;
  const root = new URL('./', location.href);
  function asset(value) {
    const url = new URL(value, root);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return value;
    const version = config.assets[url.pathname.slice(root.pathname.length)];
    if (!version) return value;
    url.searchParams.set('v', version);
    return url.href;
  }
  window.BAMCO_RELEASE = { version: config.version, asset };

  const words = {
    fa: ['نسخه جدید سامانه آماده است.', 'پیش از به‌روزرسانی، تغییرات خود را ذخیره کنید.', 'به‌روزرسانی صفحه', 'تغییرات خود را ذخیره کرده‌اید؟ با به‌روزرسانی صفحه، اطلاعات ذخیره‌نشده از بین می‌روند.'],
    en: ['A new version is available.', 'Save your changes before updating.', 'Update page', 'Have you saved your changes? Updating the page will discard unsaved information.'],
    zh: ['系统新版本已就绪。', '更新前请保存更改。', '更新页面', '是否已保存更改？更新页面将丢失未保存的信息。']
  };
  let notice, latest, edited = false, lastCheck = 0, pending = false;
  document.addEventListener('input', event => {
    if (event.target.matches?.('input:not([type=search]),textarea,select,[contenteditable=true]') && !event.target.closest('.qb-filters,.comprehensive-filters')) edited = true;
  }, true);
  document.addEventListener('change', event => {
    if (event.target.matches?.('input,textarea,select') && !event.target.closest('.qb-filters,.comprehensive-filters')) edited = true;
  }, true);

  function showUpdate(version) {
    latest = version;
    if (!notice) {
      notice = document.createElement('aside'); notice.className = 'release-notice'; notice.setAttribute('role', 'status');
      const copy = document.createElement('div');
      copy.append(document.createElement('strong'), document.createElement('span'));
      const link = document.createElement('a'); link.className = 'release-update';
      link.addEventListener('click', event => {
        const text = words[document.documentElement.lang] || words.fa;
        if ((edited || document.querySelector('dialog[open]') || window.BAMCO_CASES?.hasUnsaved()) && !window.confirm(text[3])) event.preventDefault();
      });
      notice.append(copy, link);
      const header = document.querySelector('.app-header');
      if (header) header.insertAdjacentElement('afterend', notice); else document.body.prepend(notice);
    }
    const text = words[document.documentElement.lang] || words.fa;
    notice.querySelector('strong').textContent = text[0]; notice.querySelector('span').textContent = text[1];
    const link = notice.querySelector('a'); link.textContent = text[2];
    const url = new URL(location.href); url.searchParams.set('_release', latest); link.href = url.href;
  }

  async function check() {
    if (pending || document.visibilityState === 'hidden' || navigator.onLine === false || Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now(); pending = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const url = new URL('release.json', root); url.searchParams.set('check', String(Date.now()));
      const response = await fetch(url.href, { cache: 'no-store', credentials: 'omit', signal: controller.signal });
      if (!response.ok) return;
      const data = await response.json();
      if (/^[a-f0-9]{16}$/.test(data.version) && data.version !== config.version) showUpdate(data.version);
    } catch { /* Update discovery must never block sign-in, data entry, or saving. */ }
    finally { clearTimeout(timeout); pending = false; }
  }
  function start() {
    check();
    setInterval(check, 60000);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', check);
    new MutationObserver(() => { if (notice) showUpdate(latest); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
