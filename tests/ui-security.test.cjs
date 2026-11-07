const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function browser() {
  const dom = new JSDOM(read('src/index.html'), { url: 'https://okki.test/', runScripts: 'outside-only' });
  const w = dom.window;
  w.DOMPurify = require('dompurify')(w);
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch = async () => ({ ok: true, json: async () => ({ user: null }) });
  w.structuredClone = structuredClone;
  for (const script of w.document.querySelectorAll('script[src]')) {
    const file = script.getAttribute('src').replace('./', '').split('?')[0];
    if (file !== 'purify.min.js') vm.runInContext(read('src/' + file), dom.getInternalVMContext());
  }
  return dom;
}

test('HTML sanitizer blocks executable markup and preserves escaped text and SVG', () => {
  const dom = browser(), w = dom.window;
  try {
    const target = w.document.createElement('div');
    w.setHTML(target, '<img src=x onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">link</a><svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>');
    assert.equal(target.querySelector('script,[onerror],a[href]'), null);
    assert.ok(target.querySelector('svg path'));
    const text = '<img src=x onerror="alert(1)"> & "quotes"';
    w.setHTML(target, vm.runInContext('esc', dom.getInternalVMContext())(text));
    assert.equal(target.textContent, text);
    assert.equal(target.children.length, 0);
  } finally { w.close(); }
});

test('delegated actions preserve hostile-looking args as data after rerender and submit cancellation', () => {
  const dom = browser(), w = dom.window;
  try {
    const target = w.document.createElement('div');
    w.document.body.append(target);
    let received;
    w.toggleSaved = (...args) => { received = args; };
    const value = '\'"<img src=x onerror=alert(1)>);window.pwned=1;//';
    for (let i = 0; i < 2; i++) {
      w.setHTML(target, `<button ${w.uiActionAttrs('click', 'toggleSaved', ['kind', value])}><span>save</span></button>`);
      target.querySelector('span').click();
      assert.deepEqual(Array.from(received), ['kind', value]);
      assert.equal(w.pwned, undefined);
      assert.equal(target.querySelector('img'), null);
    }
    w.addComment = (event, id) => { event.preventDefault(); received = id; };
    w.setHTML(target, `<form ${w.uiActionAttrs('submit', 'addComment_18', ['post'])}></form>`);
    assert.equal(target.firstChild.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })), false);
    assert.equal(received, 'post');
    w.setHTML(target, '<button data-ui-click="constructor">bad</button>');
    target.firstChild.click();
    assert.equal(received, 'post');
  } finally { w.close(); }
});

test('source cannot reintroduce inline handlers or bypass the sanitizer', () => {
  for (const file of fs.readdirSync(path.join(root, 'src')).filter(f => /\.(js|html)$/.test(f))) {
    const source = read('src/' + file);
    assert.doesNotMatch(source, /\bon(?:click|change|submit|error|load)\s*=\s*["']/i, file);
    assert.doesNotMatch(source, /javascript\s*:/i, file);
    if (file !== 'ui-security.js') assert.doesNotMatch(source, /\.(?:innerHTML|outerHTML)\s*=/, file);
  }
});

test('production CSP denies inline script attributes and eval', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const config = (await import('../next.config.mjs')).default;
    const headers = await config.headers();
    const csp = headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
    assert.match(csp, /script-src 'self';/);
    assert.match(csp, /script-src-attr 'none'/);
    assert.doesNotMatch(csp, /unsafe-eval/);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
