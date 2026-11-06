const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function screen(fetcher) {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      id: id.slice(1), value: '', type: 'text', validity: { valid: true }, attrs: {},
      setAttribute(key, value) { this.attrs[key] = value; },
      removeAttribute(key) { delete this.attrs[key]; }, focus() {}, disabled: false,
    });
    return nodes.get(id);
  };
  const inputs = ['#auth-email', '#auth-password', '#auth-password-confirm'].map(node);
  inputs[1].type = inputs[2].type = 'password';
  node('#auth-form').querySelectorAll = () => inputs;
  node('#auth-form').querySelector = node;
  const location = { hash: '#/signup' };
  const context = vm.createContext({ $: node, $$: () => [], logo: () => '', location,
    toast() {}, AbortSignal,
    localStorage: { setItem() { assert.fail('자격 증명을 저장해서는 안 됨'); } }, fetch: fetcher });
  vm.runInContext(fs.readFileSync('src/auth.js', 'utf8'), context);
  vm.runInContext('authEvents(true)', context);
  return { node, inputs, context, location, submit: () => node('#auth-form').onsubmit({ preventDefault() {} }) };
}

test('signup validates inputs, sends no confirmation field, and clears passwords after success', async () => {
  let sent;
  const s = screen(async (url, options) => {
    sent = { url, body: JSON.parse(options.body), options };
    return { ok: true, json: async () => ({ user: { id: 'synthetic-user' } }) };
  });
  await s.submit();
  assert.match(s.node('#auth-feedback').textContent, /모두 입력/);
  s.inputs[0].value = 'example@example.com';
  s.inputs[1].value = 'SyntheticExample123!';
  s.inputs[2].value = 'DifferentExample123!';
  await s.submit();
  assert.match(s.node('#auth-feedback').textContent, /일치하지/);
  assert.equal(sent, undefined);
  s.inputs[2].value = s.inputs[1].value;
  s.inputs[0].validity.valid = false;
  await s.submit();
  assert.match(s.node('#auth-feedback').textContent, /이메일 주소/);
  s.inputs[0].validity.valid = true;
  await s.submit();
  assert.equal(sent.url, '/api/auth/signup');
  assert.deepEqual(Object.keys(sent.body).sort(), ['email', 'password']);
  assert.equal(sent.options.credentials, 'same-origin');
  assert.equal(s.inputs[1].value, '');
  assert.equal(s.inputs[2].value, '');
  assert.equal(s.location.hash, '/account');
  assert.match(vm.runInContext('authPage(true)', s.context), /비밀번호 확인/);
  assert.doesNotMatch(vm.runInContext('authPage(false)', s.context), /auth-password-confirm/);
});

test('network failure clears passwords and blocks concurrent submissions', async () => {
  let rejectRequest;
  let count = 0;
  const s = screen(() => { count++; return new Promise((resolve, reject) => { rejectRequest = reject; }); });
  s.inputs[0].value = 'example@example.com';
  s.inputs[1].value = s.inputs[2].value = 'SyntheticExample123!';
  const pending = s.submit();
  await s.submit();
  assert.equal(count, 1);
  rejectRequest(new TypeError('offline'));
  await pending;
  assert.equal(s.inputs[1].value, '');
  assert.equal(s.inputs[2].value, '');
  assert.match(s.node('#auth-feedback').textContent, /연결 상태/);
  assert.equal(s.node('[type="submit"]').disabled, false);
});
