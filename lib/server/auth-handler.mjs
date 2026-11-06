import 'server-only';
import { NextResponse } from 'next/server.js';
import { AuthFailure, validateCredentials, readJson } from './auth-input.mjs';
import { authConfig, createAuthClient, assertSignupReady } from './supabase-auth.mjs';

function publicUser(user) { return { id: user.id, email: user.email ?? null }; }

function externalError(error, signup = false) {
  if (error?.status === 429) return new AuthFailure(429, 'RATE_LIMITED', '요청이 많습니다. 잠시 후 다시 시도해주세요.');
  if (error?.code === 'weak_password') return new AuthFailure(400, 'WEAK_PASSWORD', '비밀번호가 보안 조건에 맞지 않습니다. 더 강한 비밀번호를 입력해주세요.');
  if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError') {
    return new AuthFailure(503, 'AUTH_UNAVAILABLE', '연결에 문제가 있습니다. 가입을 요청했다면 로그인으로 결과를 확인해주세요.');
  }
  return new AuthFailure(signup ? 400 : 401, signup ? 'SIGNUP_FAILED' : 'LOGIN_FAILED', signup
    ? '가입할 수 없습니다. 입력 내용을 확인하거나 이미 가입했다면 로그인해주세요.'
    : '로그인할 수 없습니다. 이메일과 비밀번호를 확인해주세요.');
}

// 의존성을 주입하여 실제 Auth 호출과 입력·보안 규칙을 각각 검증합니다.
export async function handleAuth(request, action, dependencies = {}) {
  const changes = [];
  let config;
  const finish = (body, status = 200) => {
    const response = NextResponse.json(body, { status, headers: {
      'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache',
      'Referrer-Policy': 'no-referrer', 'Vary': 'Cookie, Origin',
    } });
    for (const { name, value, options } of changes) response.cookies.set(name, value, {
      ...options, httpOnly: true, secure: config?.secure ?? true, sameSite: 'lax', path: '/',
    });
    return response;
  };
  try {
    if (!['signup', 'login', 'logout', 'session'].includes(action)) return finish({ error: { code: 'NOT_FOUND', message: '요청을 찾을 수 없습니다.' } }, 404);
    if (request.method !== (action === 'session' ? 'GET' : 'POST')) return finish({ error: { code: 'METHOD_NOT_ALLOWED', message: '허용되지 않은 요청입니다.' } }, 405);
    config = (dependencies.config ?? authConfig)();
    if (request.method === 'POST' && (request.headers.get('origin') !== config.origin ||
        ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site')))) {
      throw new AuthFailure(403, 'INVALID_ORIGIN', '이 페이지에서 다시 요청해주세요.');
    }
    const credentials = ['signup', 'login'].includes(action) ? validateCredentials(await readJson(request), action === 'signup') : null;
    const client = (dependencies.client ?? createAuthClient)(request, config, changes);
    if (action === 'session') {
      const { data, error } = await client.auth.getUser();
      if (error) {
        if (error.name === 'AuthSessionMissingError' || [400, 401, 403].includes(error.status)) return finish({ user: null }, 401);
        throw externalError(error);
      }
      return data?.user ? finish({ user: publicUser(data.user) }) : finish({ user: null }, 401);
    }
    if (action === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error && ![400, 401, 403, 404].includes(error.status)) throw externalError(error);
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith(`sb-${new URL(config.url).hostname.split('.')[0]}-auth-token`)) {
          changes.push({ name: cookie.name, value: '', options: { maxAge: 0 } });
        }
      }
      return finish({ user: null });
    }
    if (action === 'signup') await (dependencies.signupReady ?? assertSignupReady)(config);
    const { data, error } = action === 'signup'
      ? await client.auth.signUp(credentials) : await client.auth.signInWithPassword(credentials);
    if (error) throw externalError(error, action === 'signup');
    if (!data?.user || !data.session) throw new AuthFailure(409, 'SESSION_REQUIRED', '가입 결과를 확인할 수 없습니다. 로그인으로 다시 확인해주세요.');
    return finish({ user: publicUser(data.user) }, action === 'signup' ? 201 : 200);
  } catch (error) {
    const failure = error instanceof AuthFailure ? error : new AuthFailure(503, 'AUTH_UNAVAILABLE', '연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    // 원문 요청·이메일·비밀번호·토큰·외부 오류 객체를 기록하거나 반환하지 않습니다.
    return finish({ error: { code: failure.code, message: failure.message } }, failure.status);
  }
}
