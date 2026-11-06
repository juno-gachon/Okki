/**
 * 파일: architecture.test.cjs
 * 역할: 정리한 함수가 다시 여러 파일로 분산되거나 전역 재할당되지 않는지 검사합니다.
 * 실행: node tests/architecture.test.cjs
 * 브라우저 기능 검사는 기존 흐름 테스트가 별도로 수행합니다.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 소스 폴더의 실제 스크립트를 읽어 검사 대상을 구성합니다.
const directory = path.join(__dirname, '../src');
const scripts = fs.readdirSync(directory).filter(name => name.endsWith('.js'));
const source = scripts.map(name => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n');

// 이 함수들은 단일 정의를 유지하며, 다른 파일에서 다시 덮어쓰면 안 됩니다.
for (const name of ['render', 'home', 'lifePage', 'mapPage', 'draftKey', 'notificationsPage', 'notificationSettings', 'mapWorld', 'mapFilter']) {
  const definitions = source.match(new RegExp('\\bfunction\\s+' + name + '\\s*\\(', 'g')) || [];
  assert.equal(definitions.length, 1, name + ': 하나의 정의만 유지해야 합니다.');
  assert.equal(new RegExp('\\b' + name + '\\s*=\\s*function\\b').test(source), false, name + ': 전역 함수를 재할당하면 안 됩니다.');
}

// 실제 진입 문서가 모든 기능 뒤에 라우터를 불러오는지 확인합니다.
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
assert.ok(html.indexOf('./router.js') > html.indexOf('./vacancy.js'));
console.log('PASS: single definitions, no reassignment for consolidated functions, router load order');
