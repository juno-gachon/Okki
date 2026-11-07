// 기존 정적 UI를 Next.js public 자산으로 복사합니다. src가 원본입니다.
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../src');
const target = path.join(__dirname, '../public');
fs.mkdirSync(target, { recursive: true });
// 고정 버전 정화 도구를 같은 출처에서 제공합니다(CDN 스크립트 불필요).
fs.copyFileSync(path.join(__dirname, '../node_modules/dompurify/dist/purify.min.js'), path.join(target, 'purify.min.js'));
for (const name of fs.readdirSync(source)) {
  if (/\.(html|css|js)$/.test(name)) fs.copyFileSync(path.join(source, name), path.join(target, name));
}
