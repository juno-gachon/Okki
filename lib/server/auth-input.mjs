import 'server-only';

export class AuthFailure extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function validateCredentials(input, signup) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AuthFailure(400, 'INVALID_INPUT', '입력 내용을 확인해주세요.');
  }
  const { email, password } = input;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AuthFailure(400, 'INVALID_EMAIL', '올바른 이메일 주소를 입력해주세요.');
  }
  if (typeof password !== 'string' || password.length > 128 || !password.length) {
    throw new AuthFailure(400, 'INVALID_PASSWORD', '비밀번호를 입력해주세요.');
  }
  if (signup && password.length < 8) {
    throw new AuthFailure(400, 'WEAK_PASSWORD', '비밀번호를 8자 이상 입력해주세요.');
  }
  // passwordConfirm는 브라우저의 일치 검사에만 사용하고 서버로 보내지 않습니다.
  return { email: email.trim(), password };
}

export async function readJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new AuthFailure(415, 'JSON_REQUIRED', '요청 형식을 확인해주세요.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AuthFailure(400, 'INVALID_JSON', '입력 내용을 확인해주세요.');
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 4096) {
      await reader.cancel();
      throw new AuthFailure(413, 'BODY_TOO_LARGE', '입력 내용이 너무 깁니다.');
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new AuthFailure(400, 'INVALID_JSON', '입력 내용을 확인해주세요.'); }
}
