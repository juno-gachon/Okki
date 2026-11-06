import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { AuthFailure } from './auth-input.mjs';

export function authConfig(env = process.env) {
  const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, APP_BASE_URL: base } = env;
  if (env.AUTH_ENABLED !== 'true' || !url || !key?.startsWith('sb_publishable_') || !base) {
    throw new AuthFailure(503, 'AUTH_UNAVAILABLE', '로그인 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
  }
  let origin;
  try {
    const endpoint = new URL(url);
    const app = new URL(base);
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.supabase.co') ||
        endpoint.username || endpoint.password || endpoint.pathname !== '/' ||
        app.username || app.password || !['https:', 'http:'].includes(app.protocol) ||
        (app.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(app.hostname))) throw new Error();
    if (env.VERCEL_ENV === 'production' && endpoint.hostname === 'osmxevxdsgvphqvdjnls.supabase.co') throw new Error();
    origin = app.origin;
  } catch { throw new AuthFailure(503, 'AUTH_UNAVAILABLE', '로그인 연결 설정을 확인해야 합니다.'); }
  return { url, key, origin, secure: origin.startsWith('https:') };
}

export function createAuthClient(request, config, cookieChanges) {
  return createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (changes) => { cookieChanges.push(...changes); },
    },
    global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(12000) }) },
  });
}

export async function assertSignupReady(config) {
  const response = await fetch(`${config.url}/auth/v1/settings`, {
    headers: { apikey: config.key }, cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new AuthFailure(503, 'AUTH_UNAVAILABLE', '가입 연결을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
  const settings = await response.json();
  // 이메일 발송이나 미확인 계정 생성 전에 사용자 결정과 실제 설정을 대조합니다.
  if (!settings.external?.email || settings.disable_signup || settings.mailer_autoconfirm !== true) {
    throw new AuthFailure(503, 'SIGNUP_CONFIG_REQUIRED', '회원가입 설정을 준비 중입니다. 잠시 후 다시 시도해주세요.');
  }
}
