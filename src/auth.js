/* Supabase Auth는 서버 API에서만 호출합니다. 자격 증명·토큰을 저장하지 않습니다. */
let authState = { status: 'loading', user: null };
let authBusy = false;
let authRevision = 0;

function authPage(signup = false) {
  const title = signup ? '옥키와 첫걸음을 시작해요' : '옥키에 다시 오신 걸 환영해요';
  return `<div class="container auth-layout"><aside class="auth-intro"><span class="section-kicker">A PLACE TO BEGIN</span><h1>첫 집부터,<br>옥천에서의 일상까지.</h1><p>나에게 맞는 방을 찾고<br>새로운 동네에서 첫 생활을 준비해요.</p><div class="auth-art" aria-hidden="true">${logo()}</div><a class="textlink" href="#/">옥키 홈으로 →</a></aside><section class="auth-card" aria-labelledby="auth-heading"><span class="section-kicker">${signup ? 'JOIN OKKI' : 'WELCOME BACK'}</span><h2 id="auth-heading">${title}</h2><p class="subtle">${signup ? '이메일과 비밀번호로 가입해요.' : '이메일과 비밀번호를 입력해주세요.'}</p><div class="notice auth-preview">개발용 회원 기능입니다. ${signup ? '이메일 확인 없이 가입하며, 비밀번호는 8자 이상 입력해주세요.' : '가입한 이메일로 로그인해주세요.'}</div><form id="auth-form" data-no-draft novalidate><div class="auth-field"><label for="auth-email">이메일</label><input id="auth-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="254" placeholder="name@example.com"></div><div class="auth-field"><label for="auth-password">비밀번호</label><div class="auth-password"><input id="auth-password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required ${signup ? 'minlength="8"' : ''} maxlength="128" placeholder="비밀번호를 입력해주세요"><button type="button" id="auth-reveal" aria-controls="auth-password" aria-pressed="false">보기</button></div></div>${signup ? '<div class="auth-field"><label for="auth-password-confirm">비밀번호 확인</label><input id="auth-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" required maxlength="128" placeholder="비밀번호를 한 번 더 입력해주세요"></div><p class="micro">이메일 소유 여부는 확인하지 않습니다. 입력한 주소를 다시 확인해주세요.</p>' : ''}<p id="auth-feedback" class="auth-feedback" role="status" aria-live="polite" tabindex="-1"></p><button type="submit" class="btn auth-submit">${signup ? '회원가입' : '로그인'}</button></form><p class="auth-switch">${signup ? '이미 계정이 있나요? <a class="textlink" href="#/login">로그인</a>' : '옥키가 처음인가요? <a class="textlink" href="#/signup">회원가입</a>'}</p></section></div>`;
}

async function authRequest(action, body) {
  const response = await fetch('/api/auth/' + action, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(18000),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); }
  if (!response.ok) {
    if (action === 'session' && response.status === 401) return { user: null };
    throw new Error(data.error?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
  return data;
}

function updateAuthNavigation() {
  for (const link of $$('#header a[href="#/login"], #header a[href="#/account"]')) {
    link.href = authState.user ? '#/account' : '#/login';
    link.textContent = authState.user ? '내 계정' : '로그인';
  }
}

async function authLoadSession() {
  if (authBusy) return;
  const revision = ++authRevision;
  try {
    const data = await authRequest('session');
    if (revision !== authRevision) return;
    authState = { status: 'ready', user: data.user };
  } catch {
    if (revision !== authRevision) return;
    authState = { status: 'error', user: null };
  }
  updateAuthNavigation();
  if (location.hash === '#/account') render(false);
}

function authEvents(signup = false) {
  const form = $('#auth-form');
  const password = $('#auth-password');
  $('#auth-reveal').onclick = (event) => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    event.currentTarget.textContent = visible ? '숨기기' : '보기';
    event.currentTarget.setAttribute('aria-pressed', String(visible));
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    const feedback = $('#auth-feedback');
    if (authBusy) { feedback.textContent = '요청을 처리하고 있습니다. 잠시 기다려주세요.'; return; }
    const inputs = [...form.querySelectorAll('input')];
    inputs.forEach((input) => input.removeAttribute('aria-invalid'));
    const fail = (input, message) => {
      input.setAttribute('aria-invalid', 'true'); feedback.textContent = message; input.focus();
    };
    const missing = inputs.find((input) => !input.value || (input.id === 'auth-email' && !input.value.trim()));
    if (missing) { fail(missing, signup ? '이메일, 비밀번호, 비밀번호 확인을 모두 입력해주세요.' : '이메일과 비밀번호를 입력해주세요.'); return; }
    const email = $('#auth-email');
    if (!email.validity.valid) { fail(email, '올바른 이메일 주소를 입력해주세요.'); return; }
    const confirmation = signup ? $('#auth-password-confirm') : null;
    if (confirmation && password.value !== confirmation.value) { fail(confirmation, '비밀번호가 일치하지 않습니다. 다시 확인해주세요.'); return; }
    if (signup && password.value.length < 8) { fail(password, '비밀번호를 8자 이상 입력해주세요.'); return; }
    authBusy = true;
    ++authRevision;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    feedback.textContent = signup ? '회원가입을 처리하고 있어요.' : '로그인하고 있어요.';
    try {
      const data = await authRequest(signup ? 'signup' : 'login', { email: email.value.trim(), password: password.value });
      authState = { status: 'ready', user: data.user };
      updateAuthNavigation();
      if ($('#auth-form') === form) {
        toast(signup ? '회원가입이 완료되었습니다.' : '로그인했습니다.');
        location.hash = '/account';
      }
    } catch (error) {
      if ($('#auth-form') === form) {
        feedback.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
          ? '연결 상태를 확인해주세요. 가입을 요청했다면 로그인으로 결과를 확인할 수 있어요.' : error.message;
        feedback.focus();
      }
    } finally {
      password.value = '';
      if (confirmation) confirmation.value = '';
      password.type = 'password';
      const reveal = form.querySelector('#auth-reveal');
      reveal.textContent = '보기'; reveal.setAttribute('aria-pressed', 'false');
      button.disabled = false; form.removeAttribute('aria-busy'); authBusy = false;
    }
  };
}

function accountPage() {
  let content;
  if (authState.status === 'loading') content = '<p role="status">로그인 상태를 확인하고 있어요.</p>';
  else if (authState.status === 'error') content = '<p>로그인 상태를 확인하지 못했습니다.</p><button class="btn" id="auth-retry">다시 확인</button>';
  else if (!authState.user) content = '<p>로그인 후 계정 정보를 확인할 수 있어요.</p><a class="btn" href="#/login">로그인</a>';
  else content = `<p><b>이메일</b><br>${esc(authState.user.email)}</p><p class="micro">가입한 계정으로 로그인되어 있습니다.<br>네 신청 폼에서 제출한 정보는 계정에 연결해 저장합니다.</p><section><h2>저장한 신청</h2><div id="intake-records" role="status">불러오는 중입니다.</div></section><div id="account-admin-access"></div><button class="btn secondary" id="auth-logout">로그아웃</button>`;
  return `<div class="container auth-account"><section class="auth-card"><span class="section-kicker">MY ACCOUNT</span><h1>내 계정</h1>${content}<p id="auth-feedback" role="status" aria-live="polite"></p></section></div>`;
}

// 버튼은 편의용 진입점이다. 실제 페이지/API 권한은 서버가 매 요청 검사한다.
// 응답 지연 중 계정/화면이 바뀌면 이전 운영자 결과를 새 화면에 적용하지 않는다.
async function accountAdminAccess() {
  const target = $('#account-admin-access');
  const userId = authState.user?.id;
  const revision = authRevision;
  if (!target || !userId) return;
  target.replaceChildren();
  try {
    const response = await fetch('/api/admin?session=1', {
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.admin !== true || authRevision !== revision || authState.user?.id !== userId ||
        $('#account-admin-access') !== target || !target.isConnected) return;
    const link = document.createElement('a');
    link.href = '/admin'; link.className = 'btn'; link.textContent = '운영자 관리';
    target.append(link);
  } catch { /* 권한 확인 실패 시 진입 버튼을 만들지 않는다. */ }
}

function accountEvents() {
  accountAdminAccess();
  const retry = $('#auth-retry');
  if (retry) retry.onclick = () => authLoadSession();
  const logout = $('#auth-logout');
  if (logout) logout.onclick = async () => {
    if (authBusy) return;
    authBusy = true; ++authRevision; logout.disabled = true;
    $('#account-admin-access')?.replaceChildren();
    try {
      await authRequest('logout', {});
      authState = { status: 'ready', user: null };
      if(typeof intakeEdit !== 'undefined'){intakeEdit=null;waitDraft={};waitEdit=null;}
      location.hash = '/login';
      toast('로그아웃했습니다.');
    } catch {
      const feedback = $('#auth-feedback');
      if (feedback) feedback.textContent = '로그아웃하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.';
      logout.disabled = false;
    } finally { authBusy = false; updateAuthNavigation(); }
  };
}

function authStart() {
  authLoadSession();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) authLoadSession(); });
  window.setInterval(() => { if (!document.hidden && authState.user) authLoadSession(); }, 5 * 60 * 1000);
}
