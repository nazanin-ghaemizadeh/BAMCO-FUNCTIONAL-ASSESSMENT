const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const hash = content => createHash('sha256').update(content).digest('hex').slice(0, 16);

// Use file contents, not manually maintained version labels, for browser cache keys.
module.exports = function prepareRelease(pages, root = process.cwd()) {
  const assets = {};
  const add = file => { assets[file] = hash(fs.readFileSync(path.join(root, file))); };
  for (const name of fs.readdirSync(root).sort()) if (/\.(js|css)$/.test(name)) add(name);
  for (const dir of ['assets', 'vendor']) {
    if (!fs.existsSync(path.join(root, dir))) continue;
    for (const name of fs.readdirSync(path.join(root, dir)).sort()) {
      if (/\.(js|css|json)$/.test(name)) add(dir + '/' + name);
    }
  }
  const manager = 'manager-reference/view/manager.html';
  if (fs.existsSync(path.join(root, manager))) add(manager);
  const runtime = fs.readFileSync(path.join(root, 'release.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'release.css'), 'utf8');
  const normalized = Object.fromEntries(Object.entries(pages).map(([file, html]) => [file, html
    .replace(/\n?<!--release-start-->[\s\S]*?<!--release-end-->\n?/g, '\n')
    .replace(/((?:src|href|data-href)=["'])(\.\/[^"'?]+\.(?:js|css))(?:\?[^"']*)?(["'])/g,
      (match, before, url, after) => assets[url.slice(2)] ? before + url + '?v=' + assets[url.slice(2)] + after : match)
  ]));
  const version = hash(JSON.stringify({ pages: normalized, assets, runtime, styles }));
  const script = runtime.replace('__BAMCO_RELEASE_CONFIG__', JSON.stringify({ version, assets })).replace(/<\/script/gi, '<\\/script');
  const block = '<!--release-start-->\n<style id="release-styles">\n' + styles + '</style>\n<script id="release-runtime">\n' + script + '</script>\n<!--release-end-->';
  const output = Object.fromEntries(Object.entries(normalized).map(([file, html]) => [file, html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + block)]));
  return { pages: output, manifest: JSON.stringify({ version }) + '\n' };
};
