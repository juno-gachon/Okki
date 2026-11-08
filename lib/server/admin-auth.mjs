import 'server-only';
import { AuthFailure } from './auth-input.mjs';

// 서비스 키는 RLS를 우회한다. 매 요청에서 Auth 서버의 사용자와 DB의 활성 역할을
// 확인하며, 이메일·클라이언트 메타데이터는 권한 근거로 사용하지 않는다.
export async function requireAdmin(auth, db) {
  const { data, error } = await auth.auth.getUser();
  if (error || !data?.user?.id) throw new AuthFailure(401, 'LOGIN_REQUIRED', '로그인이 필요합니다.');
  const { data: membership, error: membershipError } = await db.from('admin_memberships')
    .select('role,active').eq('user_id', data.user.id).maybeSingle();
  if (membershipError) throw new AuthFailure(503, 'ADMIN_UNAVAILABLE', '관리 기능을 사용할 수 없습니다.');
  if (!membership?.active || !['owner', 'operator'].includes(membership.role)) {
    throw new AuthFailure(403, 'FORBIDDEN', '접근할 수 없습니다.');
  }
  return { userId: data.user.id, role: membership.role };
}
