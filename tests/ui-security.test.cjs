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


test('four application forms collect unverified phone input without persisting it in demo storage', () => {
  const dom = browser(), w = dom.window, context = dom.getInternalVMContext();
  try {
    const target = w.document.createElement('div');
    for (const expression of ["waitStepTwo({types:[]})", "registrationPage('broker')", "registrationPage('resident')", "vacancyForm()"]) {
      w.setHTML(target, vm.runInContext(expression, context));
      const input = target.querySelector('input[name="phone"]');
      assert.ok(input, expression);
      assert.equal(input.required, true);
      assert.equal(input.type, 'tel');
      assert.equal(target.querySelector('[data-verify="phone"], input[name="phoneCode"]'), null);
      for (const value of ['', 'abc', '1234', '010--0000-0000', '010-0000-0000x']) {
        input.value = value;
        assert.equal(input.checkValidity(), false, value);
      }
      for (const value of ['010-0000-0000', '01000000000', '02-000-0000']) {
        input.value = value;
        assert.equal(input.checkValidity(), true, value);
      }
      assert.ok(target.textContent.includes('전화번호 인증은 하지 않습니다.'));
      assert.ok(target.textContent.includes('현재 로그인한 계정의 신청에 연결해 저장'));
    }
    const payload = { phone: '010-0000-0000', data: { phone: '010-0000-0000', verifiedPhone: true, phoneCode: '000000', title: '합성 조건' } };
    for (const key of ['applications', 'wait-draft', 'form-draft-wait-form-2', 'form-draft-registration-broker', 'form-draft-registration-resident', 'form-draft-vacancy-form-new']) {
      assert.equal(w.save(key, payload), true);
      const stored = JSON.parse(w.localStorage.getItem('okki-' + key));
      assert.equal(stored.phone, undefined);
      assert.equal(stored.data.phone, undefined);
      assert.equal(stored.data.verifiedPhone, undefined);
      assert.equal(stored.data.phoneCode, undefined);
      assert.equal(stored.data.title, '합성 조건');
    }
  } finally { w.close(); }
});


test('photo previews decode locally without fetching data URLs or relaxing CSP', () => {
  const dom=browser(), w=dom.window;
  try {
    w.fetch=()=>assert.fail('Preview bytes must not require a network request');
    const blob=w.intakePhotoBlob('data:image/jpeg;base64,AQID');
    assert.equal(blob.type,'image/jpeg');assert.equal(blob.size,3);
    assert.throws(()=>w.intakePhotoBlob('https://untrusted.example/photo.jpg'));
    assert.throws(()=>w.intakePhotoBlob('data:text/html;base64,AQID'));
  } finally {w.close();}
});

test('four live intake forms send typed, account-bound submissions without localStorage fallback', async () => {
 const dom=browser(),w=dom.window,context=dom.getInternalVMContext();
 try {
  const {validateIntake}=await import('../lib/server/intake-input.mjs');
  const actor='11111111-1111-4111-8111-111111111111';let posted;
  w.fetch=async(url,options={})=>{
   if(url==='/api/auth/session')return {ok:true,json:async()=>({user:{id:actor,email:'synthetic@example.com'}})};
   if(url==='/api/intake'&&options.method==='POST'){
    const body=JSON.parse(options.body);validateIntake(body,options.headers['Idempotency-Key']);posted=body;
    return {ok:true,json:async()=>({application:{id:'22222222-2222-4222-8222-222222222222',version:1,kind:body.kind}})};
   }
   return {ok:true,json:async()=>({applications:[]})};
  };
  vm.runInContext('authState={status:"ready",user:{id:"'+actor+'"}}',context);
  for(const [kind,hash] of [['broker','#/provide/broker'],['resident','#/provide/resident'],['vacancy','#/provide/vacancy'],['waiting','#/wait/2']]){
   if(kind==='waiting')vm.runInContext('waitDraft={situation:"입사 예정",date:"2026-11-12",regions:["옥천읍"],anyRegion:false,deposit:"300",budget:"50"}',context);
   w.location.hash=hash;vm.runInContext('render()',context);
   const form=w.document.querySelector('#wait-form,#registration-broker,#registration-resident,#vacancy-form');assert.ok(form);
   for(const input of form.querySelectorAll('input,select,textarea')){
    if(input.type==='file')continue;
    if(input.type==='checkbox'){input.checked=input.required;continue;}
    if(input.name==='phone')input.value='010-0000-0000';
    else if(input.tagName==='SELECT')input.selectedIndex=input.options[0].value?0:1;
    else if(input.type==='date')input.value='2026-11-12';
    else if(input.type==='number')input.value='1';
    else if(input.required)input.value=input.name==='address'?'합성 건물 주소':'합성 입력';
   }
   for(const input of form.querySelectorAll('input[type=date],select[name=noticeMethod],select[name=landlordResponse]'))input.disabled=false;
   if(kind==='resident')form.elements.authority.value='임차인·필요한 동의 확보';
   form.elements.intakeConsent.checked=true;assert.equal(form.checkValidity(),true);
   posted=null;await form.onsubmit({preventDefault(){}});
   assert.ok(posted,form.querySelector('.form-error')?.textContent);assert.equal(posted.kind,kind);
   assert.equal(posted.phone,'010-0000-0000');assert.equal(w.document.querySelector('#main h1').textContent,'신청이 저장되었습니다.');
   assert.equal(w.localStorage.getItem('okki-applications'),null);
  }
 } finally {w.close();}
});
