const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
for (const directory of ['src', 'scripts', 'tests']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (!/\.(?:js|cjs)$/.test(name)) continue;
    const file = path.join(directory, name);
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
console.log('PASS: JavaScript syntax in src, scripts, and tests');
