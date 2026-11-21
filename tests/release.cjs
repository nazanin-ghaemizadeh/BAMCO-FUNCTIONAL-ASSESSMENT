const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const prepare = require('../scripts/release-assets.cjs');
const runtime = fs.readFileSync('release.js', 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bamco-release-'));
  try {
    for (const file of ['release.js', 'release.css']) fs.copyFileSync(file, path.join(root, file));
    fs.writeFileSync(path.join(root, 'sample.css'), 'body{color:green}');
    fs.writeFileSync(path.join(root, 'sample.js'), 'window.fixture=1;');
    const html = '<!doctype html><meta charset="utf-8">\n<link href="./sample.css?v=old"><script src="./sample.js"></script>';
    const first = prepare({ 'index.html': html, 'case.html': html }, root);
    assert.deepEqual(prepare(first.pages, root), first, 'Repeated builds must be stable');
    fs.writeFileSync(path.join(root, 'sample.css'), 'body{color:purple}');
    const changed = prepare(first.pages, root);
    assert.notEqual(changed.manifest, first.manifest, 'CSS-only edits must change the release');
    assert.notEqual(changed.pages['index.html'].match(/sample.css\?v=([a-f0-9]+)/)[1], first.pages['index.html'].match(/sample.css\?v=([a-f0-9]+)/)[1]);
    assert.equal(changed.pages['index.html'].match(/sample.js\?v=([a-f0-9]+)/)[1], first.pages['index.html'].match(/sample.js\?v=([a-f0-9]+)/)[1], 'Unchanged files keep their cache');
  } finally { fs.rmSync(root, { recursive: true }); }

  const config = { version: '1111111111111111', assets: {'sample.js': 'abc123', 'sample.css': 'def456', 'assets/drive-routes.json': '789abc'} };
  const dom = new JSDOM('<html lang="fa"><body><header class="app-header"></header><input id="answer"><p id="draft">draft data</p></body></html>', {
    url: 'https://example.test/BAMCO/case.html?id=vehicle&from=active#day-3', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole()
  });
  const w = dom.window, d = w.document;
  let clock = Date.now(), interval, fail = false, manifest = config.version, requests = [];
  w.Date.now = () => clock;
  w.setInterval = fn => { interval = fn; };
  w.fetch = async (url, options) => {
    requests.push({ url, options });
    if (fail) throw Error('Offline');
    return { ok: true, json: async () => ({ version: manifest }) };
  };
  w.eval(runtime.replace('__BAMCO_RELEASE_CONFIG__', JSON.stringify(config)));
  await tick(); await tick();
  assert(!d.querySelector('.release-notice'));
  assert.equal(w.BAMCO_RELEASE.asset('./sample.js?v=old'), 'https://example.test/BAMCO/sample.js?v=abc123');
  assert.equal(w.BAMCO_RELEASE.asset('./sample.css?theme=mint#part'), 'https://example.test/BAMCO/sample.css?theme=mint&v=def456#part');
  assert.equal(w.BAMCO_RELEASE.asset('./assets/drive-routes.json?v=1'), 'https://example.test/BAMCO/assets/drive-routes.json?v=789abc');
  assert.equal(w.BAMCO_RELEASE.asset('https://cdn.example.test/sample.js'), 'https://cdn.example.test/sample.js');
  assert.equal(w.BAMCO_RELEASE.asset('../other/sample.js'), '../other/sample.js');
  manifest = '2222222222222222'; clock += 60001; interval(); await tick();
  assert.match(d.querySelector('.release-notice').textContent, /نسخه جدید/);
  const update = d.querySelector('.release-update');
  const destination = new URL(update.href);
  assert.equal(destination.searchParams.get('id'), 'vehicle');
  assert.equal(destination.searchParams.get('from'), 'active');
  assert.equal(destination.searchParams.get('_release'), manifest);
  assert.equal(destination.hash, '#day-3');
  assert.equal(w.location.href, 'https://example.test/BAMCO/case.html?id=vehicle&from=active#day-3', 'Never reload automatically during data entry');
  d.getElementById('answer').value = 'unsaved answer';
  d.getElementById('answer').dispatchEvent(new w.Event('input', { bubbles: true }));
  w.confirm = () => false;
  const click = new w.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(update.dispatchEvent(click), false, 'Cancel keeps unsaved edits');
  assert.equal(d.getElementById('answer').value, 'unsaved answer');
  d.documentElement.lang = 'en'; await tick(); assert.match(update.textContent, /Update page/);
  manifest = '<invalid>'; clock += 60001; interval(); await tick(); assert.equal(update.href, destination.href);
  fail = true; clock += 60001; interval(); await tick(); assert.equal(d.getElementById('draft').textContent, 'draft data');
  assert(requests.every(({url, options}) => new URL(url).searchParams.has('check') && options.cache === 'no-store' && options.credentials === 'omit'));
  const count = requests.length; interval(); await tick(); assert.equal(requests.length, count, 'Focus events cannot flood the network');
  dom.window.close();
  console.log('PASS releases: content-based versions, stable builds, local asset URLs, update discovery, preserved route/drafts, no automatic reload, cancellation and offline tolerance.');
})().catch(error => { console.error(error); process.exit(1); });
