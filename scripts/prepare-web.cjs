// 기존 정적 UI를 Next.js public 자산으로 복사합니다. src가 원본입니다.
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../src');
const target = path.join(__dirname, '../public');
fs.mkdirSync(target, { recursive: true });
for (const name of fs.readdirSync(source)) {
  if (/\.(html|css|js)$/.test(name)) fs.copyFileSync(path.join(source, name), path.join(target, name));
}
