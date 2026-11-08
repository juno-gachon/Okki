# 옥키 인증·보안 점검 기록

기준일: 2026-11-08 (KST). 현재 저장소 코드와 공식 문서에 근거한 점검 기록이다. 보안 감사 인증이나 운영 환경 전체의 안전성 보장을 뜻하지 않는다.

상태는 **코드 적용**, **개선 필요**, **미검증**, **결정 필요**로 구분한다. 코드 적용과 실제 배포 검증은 별개다. 정책 제안은 승인된 것으로 취급하지 않는다. 상세설계 7~9·14~20·25장 및 결정대장의 D01·D02·D09·D11·D12와 함께 관리한다. 상세설계·결정대장은 현재 로컬 문서이며 Git에는 포함되지 않을 수 있다.

## 1. CSP의 unsafe-inline이 의미하는 것

2026-11-08 코드 적용: `next.config.mjs`의 운영 정책은 다음과 같다.

```text
script-src 'self'; script-src-attr 'none'
```

기존 `script-src 'unsafe-inline'`을 제거했다. HTML의 onclick/onchange/onsubmit 속성은 `src/ui-actions.js`의 고정 함수와 `src/ui-security.js`의 이벤트 위임으로 옮겼다. 인자는 이스케이프된 JSON으로 전달하며 eval/Function으로 실행하지 않는다. 재렌더링 후에도 동작한다. 개발 모드만 unsafe-eval을 허용하며 운영에는 추가하지 않는다.

일반 텍스트(동네 선택 option, 푸터 문구, 임시 저장 안내)는 DOM API와 textContent로 출력한다. 기존 복합 화면은 템플릿 구조를 유지하되 모든 innerHTML/outerHTML 쓰기를 공통 setHTML/replaceHTML로 모았다. 고정 버전 DOMPurify로 정화하며 script·이벤트 속성·javascript: URL 등을 제거한다. 동적 텍스트/속성의 esc 처리를 유지하고 저장 버튼 인자를 코드 문자열에서 JSON 데이터로 분리했다. 정화 실패 시 원문 삽입으로 우회하지 않는다. DOMPurify는 빌드 시 로컬 의존성에서 복사하며 외부 CDN에 의존하지 않는다.

textContent는 문자열을 문자 그대로 표시한다. innerHTML은 HTML로 해석하므로 일반 사용자 문구에는 textContent가 우선이다. HTML 구조가 필요한 템플릿은 문맥별 이스케이프와 정화를 함께 적용한다. 정화는 업무 권한 검사나 동작 인자 검증을 대신하지 않으며 data-ui-* 속성도 권한 근거가 아니다.

이전에 제안한 Report-Only 운영 관찰은 수행하지 않았다. 로컬 테스트를 거쳐 강제 정책으로 수정했으며 실제 배포 브라우저 호환성은 별도 확인해야 한다. 필요 시 nonce/hash를 검토하되 onclick 허용을 위한 unsafe-inline 복원은 금지한다.

근거: [MDN textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent), [DOMPurify](https://github.com/cure53/DOMPurify).
`style-src 'unsafe-inline'`은 인라인 CSS에 관한 별도 설정이다. script-src의 JavaScript 실행 허용과 혼동하지 않는다. CSP는 출력 처리와 접근 제어를 보완하며 이를 대신하지 않는다. 같은 출처의 스크립트 자체가 오염되면 self 허용만으로 방어할 수 없다. 근거: [OWASP CSP](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).

## 2. HttpOnly가 비밀번호 입력값을 보호하지 못하는 이유

현재 로그인 세션은 HttpOnly 쿠키에 저장한다. HttpOnly는 페이지의 JavaScript가 document.cookie 등으로 **그 쿠키의 값**을 읽지 못하게 한다. 비밀번호는 쿠키가 아니라 입력 요소의 value에 있으므로 적용 대상이 다르다.

```javascript
// 정상 로그인 코드도 입력값을 읽어 서버로 전송해야 한다.
const password = document.querySelector('#auth-password').value;
```

type="password"는 화면에 문자를 가려 보여주는 기능이다. JavaScript가 값을 읽는 것을 막지 않는다. 따라서 악성 스크립트가 페이지에서 실행되면 입력값에 접근할 수 있다. HTTPS도 네트워크 전송을 보호하는 것이므로 브라우저 내부에서 실행되는 악성 코드를 차단하지 않는다.

또한 HttpOnly 쿠키는 조건에 맞는 fetch 요청에 브라우저가 자동으로 첨부한다. XSS가 발생하면 공격 코드가 쿠키 원문을 몰라도 사용자 권한으로 같은 출처의 API를 호출할 수 있다. 현재 Origin 검사와 SameSite도 같은 출처에서 실행되는 XSS를 막는 수단은 아니다. 근거: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

| 보호 수단 | 주요 보호 대상 | 남는 한계 |
| --- | --- | --- |
| HTTPS | 브라우저↔서버↔Supabase의 전송 | 양 끝단의 코드·로그 접근은 별도 보호 필요 |
| HttpOnly | JavaScript의 세션 쿠키 값 읽기 | 입력값 읽기·사용자 권한 요청까지 막지 못함 |
| Secure | 쿠키의 HTTPS 전송 | XSS 방어가 아님 |
| SameSite + Origin 검사 | 다른 사이트에서 유발하는 요청 | 같은 출처의 악성 코드에는 한계 |
| CSP + 안전한 출력 | 악성 코드 삽입·실행 | 의존성·서버 침해까지 모두 해결하지 않음 |

입력값을 요청 종료 후 지우는 현재 처리는 보관 시간을 줄이지만, 입력 중 접근까지 차단하지는 않는다. 브라우저에서 비밀번호를 임의로 해시해 전송하는 자체 인증 방식으로 바꾸지 않고, 표준 Auth 흐름과 위 방어를 함께 적용한다.

## 3. 이미 코드에 적용한 보호

| 항목 | 현재 상태·근거 | 추가 확인 |
| --- | --- | --- |
| 전송·환경 검사 | `lib/server/supabase-auth.mjs`: Supabase HTTPS URL, 신뢰 APP_BASE_URL 검사. 앱 HTTP는 localhost/127.0.0.1만 허용. 필수 환경값 누락 시 차단 | 실제 배포의 HTTPS·리디렉션·HSTS 확인. production에서 로컬 URL 설정도 명시적으로 거부하는 방어 검토 |
| 쿠키 | `supabase-auth.mjs`, `auth-handler.mjs`: HttpOnly, SameSite=Lax, path=/; APP_BASE_URL이 HTTPS이면 Secure | 실제 Preview/Production 응답의 Set-Cookie 확인 |
| 세션 검증 | session API에서 getUser로 검증한 id/email만 반환. raw getSession만으로 신뢰하지 않음 | 앞으로 모든 업무 API에 인증·역할·소유권 검사를 적용 |
| CSRF 기본 방어 | POST의 Origin을 APP_BASE_URL과 비교하고 cross-site/same-site 요청 차단. 상태 변경은 POST | 새로운 업무·계정 변경 API에도 적용. XSS 방어와 구분 |
| 입력 제한 | `auth-input.mjs`: JSON 형식·본문 4KB·이메일 길이·비밀번호 길이 검사 | Unicode·긴 비밀번호 처리와 제공자 제한의 일치 확인 |
| 비밀번호 취급 | `src/auth.js`: 확인 입력은 UI에서만 검사, 미전송. Auth 폼은 임시 저장 제외. 요청 종료 후 비밀번호 입력 초기화 | 브라우저 확장·오류 수집·세션 리플레이 등 별도 경로 점검 |
| 저장 책임 | 비밀번호는 Supabase Auth에 전달하며 앱 업무 DB·localStorage에 저장하지 않음. Supabase는 bcrypt 해시와 salt 사용 | 해시 원문도 문서·로그·fixture에 기록하지 않음 |
| 응답·로그 | Auth 응답 no-store, no-referrer. 비밀번호·토큰을 JSON 응답에 포함하지 않고 외부 오류 상세를 숨김. 현재 Auth 코드에 원문 요청 로그 없음 | Vercel·외부 모니터링 설정은 미검증 |
| 최소 권한 | Auth 클라이언트는 Publishable key만 사용하고 server-only 모듈로 분리. Secret/service_role 키 불필요 | 향후 업무 데이터 클라이언트와 권한 경계를 별도 설계 |
| 헤더 | CSP, nosniff, frame-ancestors none, X-Frame-Options DENY | script-src unsafe-inline 제거 및 script-src-attr none 적용. style-src 예외는 유지, 실제 배포 미검증 |
| 환경·의존성 | 알려진 개발 DB를 VERCEL_ENV=production에서 차단. 패키지 버전·lockfile 고정, 환경파일 Git 제외 | 실제 환경 분리·의존성 취약점/업데이트 주기 검증 필요 |
| 오류·중복 요청 | 일반화된 로그인 실패 응답, 제공자 429 처리, UI 중복 제출 방지 | UI 중복 방지는 서버의 공격 요청 제한을 대체하지 않음 |

근거: 현재 소스 및 [Supabase 비밀번호 보안](https://supabase.com/docs/guides/auth/password-security). 코드 적용 상태를 보안 개선 전체 완료로 표시하지 않는다.

## 4. 개선·확인할 작업 목록

| 우선순위 | 상태 | 작업 | 완료 기준 |
| --- | --- | --- | --- |
| 높음 | 코드 적용·배포 미검증 | CSP 인라인 실행 차단 및 안전한 출력 | 로컬 합성 입력·이벤트 위임·기존 흐름 검증. 배포 후 실제 브라우저 CSP 위반과 주요 화면 확인 필요 |
| 높음 | 결정 필요 | 현재 가입 최소 8자 정책 재검토. MFA 없는 방식에서는 최소 15자를 제안하며 흔한 비밀번호 차단을 함께 검토 | UI·서버·Supabase 정책 일치, 긴 문구·붙여넣기·비밀번호 관리자 지원. 기존 로그인에 새 가입 조건을 강제하지 않음 |
| 높음 | 개선 필요 | IP·계정·전체 요청량 제한 | 서버 인스턴스가 공유하는 원자적 카운터, 신뢰할 수 있는 IP 판별, 짧은 점진적 제한 및 429. 공격자가 타인 계정을 영구 잠그지 못하게 설계 |
| 높음 | 개선 필요·설정 미검증 | 가입·로그인 CAPTCHA | UI 토큰 수집→서버 전달→Supabase 검증 연결 후 활성화. 토큰 누락·만료·재사용 및 직접 Auth 호출도 검증 |
| 높음 | 미검증 | 배포 환경의 쿠키·캐시·인증 및 로그 | Preview에서 실제 헤더와 가입/로그인/로그아웃 확인. 요청 본문·Cookie·Authorization·민감 URL의 로그/분석 수집 차단 |
| 높음 | 미구현 | 업무 데이터 접근 제어 | Auth UUID 기반 소유권, 운영자 membership, RLS·grants 적용. 타인 접근·운영자 우회·직접 DB 접근 거부 시험 (D02) |
| 중간 | 미검증·결정 필요 | Supabase 유출 비밀번호 차단 | 요금제와 실제 활성화 여부 확인. 공식 문서상 Pro 이상. 비용 결정 없이 활성화 완료로 기록하지 않음 |
| 중간 | 개선 필요 | 기존 계정의 약한 비밀번호 안내 | SDK의 성공 응답 data.weakPassword도 처리. 현재 코드는 error.code만 처리하며 성공 응답 경고는 사용하지 않음 |
| 중간 | 미구현·결정 필요 | 비밀번호 변경·복구 | 변경 시 현재 비밀번호 확인/재인증, 복구 채널·리디렉션 허용목록·토큰 만료 확정. 로그인 세션만 탈취한 사람이 계정을 장악하지 못하도록 검증 |
| 중간 | 미검증·결정 필요 | 세션 수명·회수 | 현재 로그아웃은 local 범위. 전체 기기 로그아웃, 비밀번호 변경 후 기존 세션 처리, 만료·갱신·폐기 동작 검증. D11의 제안 TTL을 확정값으로 간주하지 않음 |
| 중간 | 결정 필요 | MFA | 운영자 등 민감 계정부터 도입 검토. 전화·SMS 없이 인증 앱 방식도 검토 가능. 현재 구현 아님 |
| 중간 | 미검증 | 계정 존재 추측 방어 | 실패 문구뿐 아니라 가입 성공/실패 상태·타이밍 차이도 검토. 즉시 가입·자동 로그인 방식에서 완전한 존재 은닉을 보장하지 않음 |
| 출시 전 | 결정 필요 | 개인정보·삭제·복구 정책 | D09/D12 확정, 동의 이력·보관·삭제·백업 복원 후 재삭제 및 최소 감사기록 검증 |

반복 시도 제한은 옥키 API와 Supabase Auth 양쪽을 고려한다. 서버 경유 요청은 Supabase에서 서버 IP로 묶일 수 있다. 공식 Sb-Forwarded-For 기능은 별도 활성화와 Secret key를 요구하므로 현재 Publishable key 구조에서 헤더만 추가하면 된다고 가정하지 않는다. 앱의 제한은 Auth 직접 호출을 막지 못하므로 제공자 정책·CAPTCHA도 검증한다. [Supabase Rate Limits](https://supabase.com/docs/guides/auth/rate-limits), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).

비밀번호 길이·문자 조합 정책은 아직 제안이다. OWASP는 MFA 없는 경우 길이와 흔한/유출 비밀번호 차단을 중시하며 주기적 강제 변경보다 유출 등 위험 발생 시 변경을 권고한다. [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

JWT 만료와 세션 회수는 별개다. 로그아웃·계정 삭제만으로 이미 발급된 모든 JWT가 즉시 무효화된다고 가정하지 않는다. 민감 API는 필요에 따라 현재 세션 존재까지 검사하는 설계를 검토한다. [Supabase Sessions](https://supabase.com/docs/guides/auth/sessions).

## 5. 현재 결정과 검증 범위

- 개발용 가입은 이메일·비밀번호·비밀번호 확인이며 가입 직후 자동 로그인한다. 이메일 확인·전화번호 수집·SMS는 사용자 결정으로 보류했다. 로그인 화면을 다시 거치게 하는 것만으로 이메일 소유가 검증되지는 않는다.
- 이메일 소유 미확인 상태에서 이메일만으로 업무 데이터나 운영자 권한을 연결하지 않는다. 서버에서 검증한 Auth UUID를 기준으로 한다. 복구 메일 도입도 별도 결정이 필요하다.
- 기존 신청·매물 데이터는 아직 브라우저 체험 데이터이며 계정별 서버 저장·접근 제어가 완료되지 않았다.
- 이전 검증: 로컬 합성 계정 가입·로그인·로그아웃과 쿠키/API 테스트를 수행했다. Preview Actions 성공은 확인했지만 접근 보호로 실제 배포 로그인은 직접 검증하지 못했다.
- 이번 구현은 CSP와 출력 처리 개선이다. 비밀번호 정책·원격 Auth 설정·DB·배포는 변경하지 않았다. 4장의 나머지 항목은 후속 작업으로 유지한다.
- 2026-11-08 재검증: `node --conditions=react-server --test tests/auth-api.test.cjs tests/auth-flow.test.cjs`의 7개 테스트 통과. 제공자 응답은 mock이며 실제 Supabase/배포 검증을 대체하지 않는다. `git diff --check` 통과 및 이 파일만 Markdown 제외 예외가 적용되는지 확인했다.
- 관련 인수 범위: 상세설계 20장의 인증·권한·개인정보 테스트(T01/T03/T05/T24 등), 25장의 배포 검증(T25~T30). 항목 전체가 통과했다고 표시하지 않는다.

## 6. Git 공개 범위와 유지 방법

이 파일은 공개 가능한 구조·보호 정책·작업 상태·공식 참고 링크만 기록한다. 실제 이메일·사용자 UUID·비밀번호·키·토큰·쿠키·해시·로그 원문·비공개 우회 URL은 포함하지 않는다. 따라서 `.gitignore`에 이 파일과 보안 작업 규칙을 담은 AGENTS.md를 예외로 지정해 Git 추적을 허용한다. 환경파일과 다른 로컬 문서의 제외 규칙은 유지한다.

변경 시 기준일, 상태, 근거 파일, 실행한 테스트와 외부 미검증 범위를 갱신한다. 새 취약점을 발견하면 실제 사용자 정보나 재현용 비밀값을 이 공개 문서에 넣지 않는다.

## 7. 지속 관리 규칙

AGENTS.md 14장에 보안 기록 갱신, 보안 주석, textContent 우선, 공통 정화 함수, 인라인 이벤트 및 script-src unsafe-inline 금지와 회귀 검증을 명시했다. 이 규칙은 저장소 범위에 적용되며 다른 프로젝트에는 해당 AGENTS.md로 별도 전파해야 한다.

추가 후속 작업: style-src 인라인 CSS 축소, Trusted Types 적용 가능성, 의존성 취약점 정기 점검, CSP 보고 수집 시 개인정보 제거, 제3자 스크립트·브라우저 오류 수집 점검. 이번에는 구현하지 않았다.

2026-11-08 구현 검증: npm run check 통과, npm run test:ci 15개 통과(기존 흐름 묶음 포함), npm run build 통과. 새 ui-security 테스트는 jsdom에서 실제 UI 스크립트를 로드하여 정화·문자 출력·SVG 유지·재렌더링 이벤트·JSON 인자·submit 취소를 확인하고 production CSP 설정을 검사한다. jsdom은 실제 브라우저 CSP 강제를 검증하지 않는다. 원격 배포·실제 브라우저 수동 확인·Supabase 설정 변경·문자 발송은 수행하지 않았다.

## 8. DOMPurify의 판단 기준과 유지보수 (2026-11-08)

DOMPurify는 HTML을 DOM으로 파싱한 뒤 허용된 태그·속성·네임스페이스·URL 규칙으로 검사한다. 악성 의도를 AI로 판단하거나 알려진 공격 문자열만 검색하는 방식이 아니다. onerror 같은 실행 속성과 javascript: 같은 위험한 URL을 제거하며 앱 설정으로 허용 범위를 더 줄일 수 있다. 현재 옥키는 script/style/iframe/object/embed 태그와 srcdoc 속성을 추가 금지한다. 정상 외부 링크의 진위·피싱 여부, 업무 권한은 판단하지 않는다.

공식 프로젝트는 보안 전문 개발진, 자동 테스트, 취약점 신고·보안 권고 체계를 제공하지만 우회 취약점 가능성은 남는다. 보안 정책은 최신 릴리스 지원을 명시하므로 버전 고정은 재현성을 위한 것이며 영구 동결이 아니다. 보안 권고 확인 후 검증된 패치로 갱신해야 한다. 정화 후 다른 라이브러리가 결과를 다시 변경하면 보장이 깨질 수 있다. 현재 코드의 버전은 3.4.17이며 이번 설명에서는 전체 취약점 감사나 최신 안전 버전 판정을 수행하지 않았다.

근거: [공식 README](https://github.com/cure53/DOMPurify), [보안 정책](https://github.com/cure53/DOMPurify/security/policy), [보안 권고](https://github.com/cure53/DOMPurify/security/advisories). 코드 변경 없음. 의존성 보안 모니터링과 업데이트 절차는 후속 과제다.

## 9. DB 상세설계의 접근 권한·공개 검토 (2026-11-08)

- 근거 파일: `docs/database-design.md`, `AGENTS.md` 15장, `.gitignore`, 기존 `lib/server/auth-handler.mjs`, `src/flow.js`, `src/integrated.js`, `src/vacancy.js`. 사용자 요청은 설계 문서 저장이며 업무 기능 구현·원격 DB 변경 승인이 아니다.
- 적용: DB 사전·통신·권한·개인정보·사진·삭제·테스트 계획 문서 작성, DB 변경/개선 기록 규칙 추가, 해당 설계 문서만 Markdown Git 제외 예외로 지정. 기존 사용자 변경은 보존했다.
- 미구현: 업무 RLS/grants/RPC, 소유권·역할·필드별 접근, 멱등/동시성, 사진 검증·슬롯/파일 정리·열람 제어, 민감 조회 감사, 영속 요청 제한, 삭제대장·복구 후 재삭제. 완료 기준은 설계 문서 DB01~DB13의 실제 DB/API/Storage 시험이다. 현재 Auth와 UI 보안 테스트가 이를 대신하지 않는다.
- 결정 필요: D02 접근 모델 실제 적용, 중개사 권한 부여, D09 동의·기간·상세 주소/연락처 수집·제공, D10 소유자 접수, 사진 상한/TTL/서명 URL 또는 인증 프록시, D06 재등록, D12 백업/복구. signed URL은 유효기간 내 보유자가 사용할 수 있음을 명시했다. 공개 문서에 이 기능들을 적용 완료로 표시하지 않는다.
- 외부 미검증: 이번에는 Supabase 실제 schema·grants·버킷·세션·배포·로그 설정을 조회/변경하지 않았다. 전화/SMS·거주자 후속 인계·자동 매칭은 보류 유지. 기존 4장의 후속 보안 작업도 유지한다.
- 공개 적합성: 새 문서는 테이블·필드·제약·설계/미구현 상태·공식 링크만 포함하며 실계정/연락처/주소/UUID, 키·토큰·쿠키·서명 URL·DB 덤프를 넣지 않았다. GitHub 추적에 적합하며 이후 변경 때 재검토한다. commit/push는 수행하지 않는다.
- 검증: 문서 참조·필드/관계 정합성 검토, `git diff --check` 통과, `git check-ignore -v --no-index`로 신규 설계 문서 예외와 기존 비밀파일/로컬 결정대장 제외 유지 확인. Node 검사로 앱 테이블 사전 18개·Markdown 표 열 수·인코딩·키/JWT/프로젝트 URL/실UUID/이메일/전화번호/개인키 패턴 오류 0 확인. 패턴 검색은 포괄적 비밀정보 탐지를 보장하지 않으며 본문 검토를 함께 수행했다. 이번 작업은 문서만 변경하므로 앱 build·DB 통합 테스트를 새로 실행하지 않는다.

## 10. 네 폼의 체험 연락처 확인 보류 (2026-11-08)

- 근거: `src/flow.js`, `src/integrated.js`, `src/vacancy.js`, 관련 흐름 테스트. 기존 체험 인증은 실제 본인 확인이 아니었다.
- 적용: 네 폼의 휴대전화 체험 확인과 검증 조건을 주석 처리. 방 알림 연락처 및 직장명 입력을 보류하고 새 초안/신청에서 이전 연락처를 제외. 중개사무소 입력은 계정 관리 기능 전까지 주석 처리. 방 알림은 웹 알림함으로 표시한다.
- 미구현·외부 미검증: 업무 데이터는 여전히 localStorage 체험이며, 계정별 DB 접근 제한·실제 매칭·웹 알림·중개사 계정 권한은 구현되지 않았다. 기존 체험 자료는 자동 삭제하지 않았다. 퇴거 폼의 기존 집주인 연락처와 상세 주소는 수집 정책 D09 정리가 필요하다. 다른 화면의 체험 연락처 기능을 실제 인증으로 해석하지 않는다.
- 검증: `npm run check`, `npm run test:ci`, `npm run build` 및 합성 입력 출력/폼 필드 부재 회귀 테스트. 실제 배포·Supabase 데이터·발송은 변경하지 않았다. T01/T03/T05/T24 전체 통과가 아니다.
