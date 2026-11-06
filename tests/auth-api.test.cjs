const { test } = require('node:test');
const assert = require('node:assert/strict');

const config = () => ({ origin: 'https://okki.example', secure: true, url: 'https://develop.supabase.co' });
function request(action, body, origin = 'https://okki.example', method = 'POST') {
  const req = new Request(`https://okki.example/api/auth/${action}`, {
    method, headers: { origin, 'content-type': 'application/json' },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body ?? {})) : undefined,
  });
  req.cookies = { getAll: () => [] };
  return req;
}
async function handler() { return (await import('../lib/server/auth-handler.mjs')).handleAuth; }

test('server fails closed for CSRF, methods, invalid JSON, excessive body and invalid credentials', async () => {
  const handle = await handler();
  const dependencies = { config, client: () => assert.fail('잘못된 요청은 Auth에 전달하지 않음') };
  for (const [req, action, expected] of [
    [request('login', {}, 'https://evil.example'), 'login', 403],
    [request('logout', null, undefined, 'GET'), 'logout', 405],
    [request('login', '{broken'), 'login', 400],
    [request('signup', { email: 'bad', password: 'secret1234' }), 'signup', 400],
    [request('signup', { email: 'example@example.com', password: 'short' }), 'signup', 400],
    [request('login', 'x'.repeat(5000)), 'login', 413],
  ]) {
    const response = await handle(req, action, dependencies);
    assert.equal(response.status, expected);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

test('Auth response serializes only allowed user fields and HttpOnly cookies', async () => {
  const handle = await handler();
  let sent;
  const response = await handle(request('signup', { email: ' example@example.com ', password: 'Synthetic123!', user_id: 'attacker' }), 'signup', {
    config, signupReady: async () => {},
    client: (req, conf, changes) => ({ auth: { signUp: async (input) => {
      sent = input;
      changes.push({ name: 'sb-develop-auth-token', value: 'synthetic-cookie', options: {} });
      return { data: { user: { id: 'verified-id', email: 'example@example.com', phone: 'private', user_metadata: { role: 'owner' } }, session: { access_token: 'never-return' } } };
    } } }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(sent, { email: 'example@example.com', password: 'Synthetic123!' });
  const raw = await response.text();
  assert.deepEqual(JSON.parse(raw), { user: { id: 'verified-id', email: 'example@example.com' } });
  assert.doesNotMatch(raw, /never-return|private|owner/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.match(response.headers.get('set-cookie'), /SameSite=lax/i);
});

test('session uses verified Auth user, returns 401 without session, and hides provider errors', async () => {
  const handle = await handler();
  let response = await handle(request('session', null, undefined, 'GET'), 'session', {
    config, client: () => ({ auth: { getUser: async () => ({ error: { name: 'AuthSessionMissingError' } }) } }),
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { user: null });
  response = await handle(request('login', { email: 'example@example.com', password: 'Synthetic123!' }), 'login', {
    config, client: () => ({ auth: { signInWithPassword: async () => ({ error: { status: 400, message: 'private provider details' } }) } }),
  });
  assert.equal(response.status, 401);
  assert.doesNotMatch(await response.text(), /private provider/);
});

test('logout is current-session only and clears only this project cookies', async () => {
  const handle = await handler();
  const req = request('logout');
  req.cookies.getAll = () => [{ name: 'sb-develop-auth-token.0' }, { name: 'other-cookie' }];
  const response = await handle(req, 'logout', { config,
    client: () => ({ auth: { signOut: async (options) => { assert.equal(options.scope, 'local'); return {}; } } }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.doesNotMatch(response.headers.get('set-cookie'), /other-cookie/);
});

test('configuration rejects missing env, service keys, and develop DB in Production', async () => {
  const { authConfig } = await import('../lib/server/supabase-auth.mjs');
  assert.throws(() => authConfig({}), /준비되지/);
  const env = { AUTH_ENABLED: 'true', SUPABASE_URL: 'https://osmxevxdsgvphqvdjnls.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic', APP_BASE_URL: 'http://localhost:3000' };
  assert.equal(authConfig(env).secure, false);
  assert.throws(() => authConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not_allowed' }));
  assert.throws(() => authConfig({ ...env, VERCEL_ENV: 'production' }));
});
