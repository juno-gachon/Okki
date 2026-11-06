const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
function check(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { check(file); continue; }
    if (!/\.(?:js|cjs|mjs)$/.test(entry.name)) continue;
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
for (const directory of ['src', 'scripts', 'tests', 'app', 'lib']) check(directory);
console.log('PASS: JavaScript syntax in src, scripts, tests, app, and lib');
