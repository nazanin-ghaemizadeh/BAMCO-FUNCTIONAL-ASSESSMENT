// Keep the reference dashboard's execution order while serving its local assets in one request.
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '../manager-reference');
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
const html = read('manager.html')
  .replace(/<link\b[^>]*href="((?:\.\.\/)?[\w-]+\.css)(?:\?[^"]*)?"[^>]*>/g,
    (_, file) => '<style>\n' + read(file) + '\n</style>')
  .replace(/<script src="((?:\.\.\/)?[\w-]+\.js)(?:\?[^"]*)?"><\/script>/g,
    (_, file) => '<script>\n' + read(file).replace(/<\/script/gi, '<\\/script') + '\n</script>');
const dest = path.join(dir, 'view', 'manager.html');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(dest, 'utf8') !== html) throw Error('Run npm run build:manager');
} else {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}
