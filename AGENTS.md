# 옥키 MVP — Codex 작업 지침

버전 4.0 · 기준 2026-11-02 · 목표 11/11 리허설, 11/12 현장 테스트.
이 파일을 저장소 루트 `AGENTS.md`로 사용한다. 본문 상세설계는 `docs/okki-mvp.md`이며 1~25장이 현재 기준안이다. 부록 A·B·C는 과거 원문 보존본으로, 본문을 덮어쓰는 실행 지침이 아니다.

## 현재 단계 변경 — 2026-11-06 사용자 결정

- 당분간 전화번호 수집·휴대폰 인증·문자 기능은 사용하지 않는다. 아래 휴대폰 인증·SOLAPI·문자 발송 요구사항은 기능 재개 전까지 보류한다.
- 최신 사용자 결정: 회원가입은 이메일·비밀번호·비밀번호 확인, 로그인은 이메일·비밀번호를 입력한다. 이름·별도 아이디는 현재 가입 폼에서 제외한다. 비밀번호 확인은 일치 검사용이며 저장하지 않는다. 가입 시 Auth UUID를 발급받아 업무 데이터 소유권에 연결한다. 방 신청·매물 접수의 조건은 별도 폼으로 받는다.
- 비밀번호는 Supabase Auth가 해시로 관리하며 업무 테이블·로그·localStorage에 저장하지 않는다. 기본 이메일/비밀번호 Auth를 사용한다. 세션에서 검증한 UUID로 접근을 제한하고 클라이언트가 전달한 사용자 ID를 신뢰하지 않는다.
- 최신 사용자 결정: 개발용 프로젝트는 이메일 확인 없이 가입 후 바로 로그인할 수 있게 한다. 이메일 형식·비밀번호 확인 검사는 유지하되 입력 이메일의 실제 소유가 확인되었다고 간주하지 않는다. 확인 메일·Resend 연결은 현재 가입 흐름에 필요하지 않다. 실제 Supabase 설정 적용 여부는 별도 검증한다.
- 인증된 사용자 ID에 신청 정보를 연결하고 서버 인증·소유권·운영자 권한 검사는 유지한다. 전화번호 필수·unique를 현재 가입 조건으로 적용하지 않는다.
- 문자 재개 전까지 OTP/SMS Hook·발송 outbox worker·문자 웹훅·문자 기반 재확인/무응답 만료는 활성화하지 않는다. 비밀번호 분실 복구 경로는 구현 전 별도로 정한다.
- D01의 현재 결정과 문자 보류 범위는 `docs/decisions.md`를 따른다. 개인정보 문구·보관 등 D09의 나머지 미결정 사항은 그대로 유지한다.

## 1. 목표와 범위

옥키는 옥천 입사 예정·입사한 1인 청년의 조건을 접수하고 운영자가 확인한 비공개 방을 안내해 문의로 연결하는 웹서비스다.
핵심: 청년 조건·동의·휴대폰 인증 → DB 저장 → 제공자 접수·운영자 검수 → 규칙 후보 → 운영자 승인 → 문자 → 문의/사양 → 후속 상태·지표.

- 기존 Next.js UI를 재사용하고 업무용 localStorage 저장을 Supabase로 대체한다.
- 사용자 웹과 `/admin`은 같은 프로젝트다. 별도 상시 백엔드나 같은 로직의 Edge Functions 복제를 만들지 않는다.
- Next.js Route Handlers + Supabase PostgreSQL/Auth + Vercel + SOLAPI를 기준으로 한다. 패키지·프레임워크 버전은 저장소를 조사해 유지한다.
- 제외: 앱, 지도, 결제, 채팅, 룸메이트 매칭, 공개 매물 목록, 자동 매칭 문자, 중개사 대시보드, 자동 수요 보고서, 실거래 자동 집계, 알림톡.
- 기존 Q&A·첫 1년 할 일·정책 안내는 유지한다. 실제 데이터 흐름 변경에 필요한 최소 수정만 한다.
- 서비스는 방 확보·입주·공공주택 자격을 보장하지 않는다. 문의·방문·계약을 구분한다.
- 주원: 운영·문구·정책·공급 확보. 준호: 개발·연동·보안·검증.

## 2. 지침 적용과 작업 시작

1. 최신 사용자 지시, 상위/하위 AGENTS 범위, README, package.json, lockfile, git 상태, 기존 routes·schema·tests를 먼저 읽는다. 사용자 작업을 덮어쓰지 않는다.
2. `docs/okki-mvp.md`의 관련 장과 23장 D01~D14를 확인한다. 실제 결정은 `docs/decisions.md`에 상태·일시·담당·값·근거를 기록한다.
3. 원문의 SQL·예시는 그대로 운영에 실행하지 않는다. 평문 access_token, 단순 SHA-256 OTP, sent_at DEFAULT now, 공고 전체 alerted_at 방식은 본문에서 보완되었다.
4. 연결 프로젝트 ID·환경·권한을 확인한다. MCP/CLI 연결을 확인하지 않고 연결 또는 배포 성공을 주장하지 않는다. 문서 작성 요청만으로 운영 DB 변경·실제 발송 권한을 추론하지 않는다.
5. 실제 승인된 작업 범위 안에서 로컬 구현·테스트·가역적 수정은 계속한다. 파괴적 운영 변경·대량 문자·외부 개인정보 제공은 기존 승인 범위를 확인한다. 이미 승인된 사항을 반복 질문하지 않는다.
6. 불확실한 정책은 preview/dry-run으로 구현하며 독립 작업을 계속한다. Dxx 제안값을 임의 accepted로 바꾸지 않는다.
7. 문서가 누락되면 이 파일로 보안 기반을 진행하고 없는 설계의 확인이 필요한 지점을 명시한다. 존재하지 않는 경로·명령·환경변수를 있다고 가정하지 않는다.

## 3. 기술·코드 경계

- 화면 → Route Handler의 입력/인증 → 도메인 서비스 → DB/외부 adapter 순으로 분리한다.
- `lib/server`는 `server-only`; 브라우저 Auth 클라이언트와 서비스 권한 데이터 클라이언트를 분리한다.
- 매칭·상태 전이는 순수 함수로, DB transaction·발송·LH 파싱은 각각 별도 책임으로 둔다.
- 중요한 다중 쓰기는 단일 RPC/DB transaction으로 처리한다. supabase-js 여러 요청이 한 transaction이라고 가정하지 않는다.
- 외부 HTTP를 DB transaction 내부에서 기다리지 않는다. 서버리스 응답 후 메모리 작업 지속을 가정하지 않는다.
- 기본 DB 접근은 public 앱 테이블의 브라우저 grants 차단 + 서버 접근이다. private app schema를 선택하면 Data API 노출/RPC 또는 직접 DB 풀러 경계까지 설계한다.
- SQL은 parameter binding, filter/order 허용목록. 직접 DB 연결은 실제 Supabase 풀러/드라이버 제약을 확인한다.
- SDK 버전과 lockfile을 고정한다. Supabase·Next.js·SOLAPI의 현재 공식 문서를 확인하고 함수/설정을 추측하지 않는다.

## 4. 화면·입력 불변조건 — 상세설계 4~5장

| 경로 | 요구사항 |
| --- | --- |
| `/`, `/signup` | 소개·조건·휴대폰 인증·동의·등록 완료 |
| `/me` | 본인 조건·상태·최종 확인일·수정·종료·공고 구독 |
| `/me?t=token` | 제한 링크 교환, 민감 수정은 재인증 |
| `/r/[token]` | 해당 방 요약·관리비·완화 사유·문의/사양 |
| `/c/[token]`, `/pc/[token]` | 해당 청년/방의 현재 재확인 cycle만 |
| `/p/new` | 공개 1분 폼, 운영자 확인 전 checking |
| `/admin` | 검수·후보·차수·발송 결과·후속 기록·CSV |

- 금액은 정수 만원, 음수 금지. 관리비 NULL=미확인, 0=확인된 무료. UI/API/DB 단위를 일치시킨다.
- 입주 기간 종료≥시작. 원문 월세 UI 20~70/5단위·보증금 선택 100/300/500/1000/직접을 유지한다.
- 직장 읍면은 옥천읍·동이면·안남면·안내면·청성면·청산면·이원면·군서면·군북면. 원룸/1.5룸/투룸 복수 선택 1개 이상.
- 전화는 입력 경계에서 표준화, Auth E.164와 국내 업체 형식 변환을 adapter에서 한다. 인증된 번호만 seeker와 연결한다.
- 상세 주소·집주인 연락처를 신규 수집하지 않는다. 세입자 개인정보·내부 메모는 청년에게 절대 반환하지 않는다.
- 실제 provider.type은 broker/tenant, source는 broker/tenant/operator로 분리한다. 집주인 직접 접수를 허위 유형으로 분류하지 않는다(D10).
- 세입자 집주인 동의 진술과 다음 임대 가능 검수는 다르다. 담당 연결 경로 미확정이면 접수 가능·발송 보류.
- 동의 기본 체크는 해제. 필수 수집과 선택 제공·구독 분리. 확정 동의 문구 없이 배포용 문구를 지어내지 않는다.
- 모바일·키보드·label·오류·중복 클릭·만료·네트워크 실패를 처리한다. 원문 번호·토큰을 localStorage에 저장하지 않는다.

## 5. DB 모델·제약 — 6~7장

업무: seekers, providers, listings, matches, notices, events.
보조: notifications, notification_attempts, match_batches, consents, access_tokens, admin_memberships, job_runs, privacy_requests, audit_logs.
직접 OTP 선택 시에만 otp_challenges, 필요 시 영속 security_rate_limits. 테이블 수를 6개로 억지 제한하지 않는다.

- 필드·type·null·default·FK·index는 6장 사전을 따른다. 변경 시 문서·생성 타입·API·테스트를 같이 바꾼다.
- 공통 UUID와 created_at; 업무 수정 updated_at/version. 날짜 date, 시각 timestamptz, 화면 Asia/Seoul.
- phone 인증 연결 unique, matches(listing_id,seeker_id) unique, notices(source,external_id) unique, notifications.dedupe_key unique.
- candidates는 조회 결과이며 matches는 승인한 안내다. sent_at은 생성 기본값이 아니라 업체 접수 뒤 기록한다.
- 개별 수신자 결과·시도 이력을 남긴다. notices.alerted_at 또는 matches.sent_at 하나로 전체 전달을 판정하지 않는다.
- 금액·기간·허용 enum·빈 배열·수신자 정확히 1명·목적별 FK 조합을 제약으로 표현한다.
- 서로 참조하는 FK는 생성 순서/후속 ALTER를 계획한다. 삭제 RESTRICT/CASCADE/SET NULL을 실제 보관 정책에 맞춰 명시한다.
- 사용자 상태 변경·동의·권위 있는 이벤트·outbox 생성은 원자적으로 처리한다.
- FK 검색·상태/확인일·우선순번에 필요한 인덱스를 두되 측정 없이 모든 열/JSON에 인덱스를 만들지 않는다.
- migration은 버전 관리한다. 대시보드만 고쳐 끝내지 않는다. CLI 버전/--help를 확인하고 공식 migration 생성 흐름을 따른다.

## 6. 권한·인증 — 7·9·14장

- 모든 앱 테이블 RLS 활성화, anon/authenticated 직접 테이블·sequence·함수 권한을 차단한다. 기존 Data API 노출/default privileges를 조사한다.
- 서비스 키는 RLS를 우회한다. 매 Route Handler에서 검증된 주체·역할·대상 소유권·현재 상태를 확인한다. RLS만 믿지 않는다.
- 서버 응답은 허용 필드만 직렬화한다. `select('*')` 결과를 그대로 클라이언트에 보내지 않는다.
- admin은 검증된 Auth 사용자 + active admin_memberships, analyst는 비식별 통계만. user_metadata.role·클라이언트 이메일을 권한 근거로 쓰지 않는다.
- raw getSession만 신뢰하지 말고 현재 공식 SSR의 검증 방법을 따른다. 계정 삭제·JWT 만료·세션 폐기가 별개임을 고려한다.
- Auth+Send SMS Hook을 먼저 검증(D01). Hook 서명은 공식 검증, body·OTP 로그 금지. 직접 OTP와 동시 운영하지 않는다.
- 직접 OTP는 3분 만료·60초 간격·번호당 5회/일·입력 5회 원문 기준과 IP/전역 제한을 검증한다. HMAC 기반 검증값, challenge/번호 바인딩, 최신 코드만 유효, 성공/초과 시 원자 소모.
- token은 32바이트 난수·해시 저장·purpose·대상·만료·폐기. 짧은 OTP와 긴 난수 링크의 해시 보안을 혼동하지 않는다.
- GET은 문의·종료·동의·토큰 소모를 하지 않는다. 명시적 POST로 제한 HttpOnly/Secure/SameSite 세션 교환 후 URL에서 토큰 제거.
- 민감 변경은 재인증. 잘못된 purpose·다른 객체·폐기된 링크/세션 차단. 재발급은 이전 링크/세션 무효화.
- 개인정보 응답 no-store, 링크 no-referrer, 토큰 URL·쿠키·전화·OTP 로그/분석/오류수집에서 제거.
- Origin·CSRF 방어, CSP·출력 이스케이프·길이 제한, SQL 바인딩, 외부 URL 허용목록을 적용한다.
- SECURITY INVOKER 우선; DEFINER로 권한 오류를 덮지 않는다. 필요한 경우 최소 권한·고정 search_path·호출자 검증·PUBLIC EXECUTE 제거.
- view의 RLS 우회 여부를 점검한다. 보안 advisor 경고를 검토하고 실제 anon/일반사용자 요청으로 검증한다.

## 7. 매칭·차수 — 5·10장

- 청년 waiting, 방 alerting, 양쪽 최종 확인 14일 이내, 방 검수·연결 담당 필수. 후보 조회와 발송 직전 모두 검사한다.
- 보증금≤상한, 유형 일치, 무차량은 직장과 같은 읍면, 중복 안내 제외, priority_at/id 정렬.
- 원문 월세+5만원·기간±14일은 exact/relaxed 분리. 완화 발송은 D03 확정 전 비활성. 관리비를 숨기지 않는다.
- 한 방의 한 차수 1~3명, 운영자 승인만. 방 row lock·후보 재검증·고유키·열린 차수 제한으로 동시 실행 방지.
- Idempotency-Key 같은 요청은 기존 결과, 같은 키/다른 요청은 409. version 충돌은 새 후보 조회.
- 48시간 기준 권장안: 차수 모두 결과 확정·최소1 delivered이면 마지막 delivered+48h. accepted/unknown 남으면 blocked, 전달0건은 해당 발송 문제 먼저 해결(D05).
- 다음 차수 버튼 활성화와 발송은 별개다. 자동 매칭 발송 금지. 전원 조기 사양 예외는 정책·사유 기록이 있을 때만.
- 문의→matched, 확인된 구함→found, 무산→waiting 복귀. found/ended/expired 새 방 안내 제외.
- matched 추가 알림·재등록 priority는 D04/D06. 문의를 계약으로 집계하지 않는다.

## 8. 문자·공고·Cron — 11~13장

- 일반 발송은 DB outbox 먼저, 짧은 transaction 선점 후 외부 호출. 외부 호출 전후 결과 불명 구간을 가정한다.
- queued/processing/accepted/delivered/failed/unknown/cancelled 구분. 202는 접수이며 전달 성공이 아니다.
- 업체와 DB 사이 exactly-once를 보장한다고 쓰지 않는다. timeout·lease 만료 후 이미 시작한 발송은 조회/대조 전 재발송하지 않는다.
- 웹훅 공식 검증을 적용한다. SOLAPI 요청 HMAC과 웹훅 X-Solapi-Secret 방식은 다르다. 최신 문서 확인·messageId 대조·중복/역순 처리.
- 재시도 직전 동의·상태·기한을 재검증한다. OTP 원문은 일반 outbox에 기록하지 않는다.
- 링크를 재전송하려면 원문 token을 복원할 필요가 있다. 전송용 payload만 인증 암호화·짧은 TTL로 보관하며 키는 DB와 분리한다. 토큰 해시로 원문을 복원할 수 있다고 가정하지 않는다.
- dry-run·테스트 allowlist·SMS_ENABLED·일일 건수/비용 cap을 서버에서 강제한다. 한도는 인스턴스 메모리 대신 영속 원자 카운터.
- 신규 LH 발견 15058530, 공급 세부 15056765, 실거래15126472는 MVP 밖. 임대 전체를 행복주택으로 오인하지 않는다.
- 실제 날짜/코드/응답·페이지네이션·통합공고·정정/취소·공식 ID·허용 URL 검사. 첫 수집 baseline, 과거 공고 일괄 발송 금지.
- 수신자×공고×revision 중복 제어, failed/unknown 개별 복구. 공고 자동발송은 D08 전 검수 후 발송.
- Cron은 Vercel 하나를 기준, `0 0 * * *`=KST09시. 플랜별 정밀도·재시도 제약을 확인한다.
- CRON_SECRET fail-closed, job lease·fencing·체크포인트, 작업별 실패 분리. 오래된 실행이 새 실행을 덮지 못하게 한다.
- 14일 지나면 신규 매칭 보류. 전달 후3일 무응답 만료 권장(D07), 전송 실패를 무응답으로 처리하지 않는다.
- 응답은 최신 cycle만 갱신·기존 링크 폐기. 본인/방 종료 뒤 반복 재확인 금지.

## 9. 개인정보·거버넌스 — 15~16장

- 확정 문구·버전·목적·기간 없이는 production 개인정보 흐름 출시를 완료로 보고하지 않는다. 안전한 구현·테스트는 계속한다.
- 초기 선택 동의는 의향이며 실제 중개사·항목·목적·기간을 밝힌 건별 동의 후 청년 연락처를 제공한다. 미동의자는 직접 중개사에 문의 가능.
- 임대 정보 제공 동의·공급 가능 검수·중개사 연락처 공개 동의를 구분한다.
- 위탁·제3자 제공·국외 이전을 분리한다. 서울 DB 리전만으로 전체 국내 처리를 주장하지 않는다.
- 탐색 종료·공고 구독 종료·전체 삭제를 구분한다. 전체 삭제는 미발송 취소·세션/토큰·Auth·DB·문자업체·백업 복구 대장까지 포함한다.
- 보관 숫자(예:90일)는 제안이지 법정 기간이 아니다. D09 확정값을 정책 설정으로 관리한다.
- 제품 events와 보안 audit 분리. 전화·OTP·token·원문 메시지를 props에 복사하지 않는다. 앱 append-only가 서비스키/DB owner도 수정 불가하다는 뜻은 아니다.
- 외부 CSV는 개인정보·작은 집단 재식별·자유 메모 제거, 수식 injection 방어. 내보내기 사유·행 수·수행자 기록.
- 클릭은 문자 열람이 아니며 거절 이유는 지역 전체 원인의 확정 통계가 아니다. client 이벤트로 계약/발송 실적을 만들지 않는다.
- 실제 개인정보·키·OTP·토큰을 프롬프트·fixture·스크린샷·git에 넣지 않는다. 합성 데이터와 마스킹 로그 사용.

## 10. 환경·배포·복구 — 17~19장

- Dev/Preview/Production DB·키 분리. Preview는 dry-run/테스트 번호만, production secret 공유 금지.
- `.env.example`은 이름·설명만. 비밀값에 NEXT_PUBLIC_ 금지. 프로젝트에서 사용하는 키 체계와 실제 변수명을 확인한다.
- APP_BASE_URL은 신뢰 설정값으로 만들고 사용자 Host 헤더로 문자 링크를 구성하지 않는다.
- migration→호환 앱→smoke test→발송/Cron 활성화 순서. 파괴적 schema 변경은 expand/migrate/contract로 분리.
- 백업 플랜·보관·복구 가능성을 확인한다. 무료 플랜에서 일일 자동 백업을 가정하지 않는다.
- 복구 후 발송/Cron은 꺼 둔다. 업체 발송 결과 대조·삭제대장 재적용·outbox 정리 후 재개한다.
- RPO24h/RTO1영업일은 D12 제안이며 실제 운영 승인·복구 실험으로 확정한다.
- 사고 시 발송/추출 제한·증빙 보존·키/세션 회수·영향 조사·책임자 대응·복구 검증을 따른다. 법정 통지/신고 기한을 임의 추정하지 않는다.

## 11. 구현 순서·검증·완료 보고

1. 기반·Auth·schema·grant·환경 분리 → 11/1.
2. 청년 인증·등록·내 상태·동의 → 11/2.
3. 제공자 폼·대리 접수·검수 → 11/4.
4. 후보·운영자 승인·차수·문자 → 11/6.
5. 안내·응답·후속 상태 → 11/8.
6. 재확인·LH·CSV·보안/복구·리허설 → 11/10~11.

시간이 부족하면 LH 자동화·CSV UI·목록 고도화·재확인 자동화를 수동 대체한다. 인증·접근 제어·개별 발송 기록·응답 저장은 생략하지 않는다.
각 변경에 관련 문서 장·Dxx·Txx를 연결한다. 문서20장 T01~T24 중 변경 관련 테스트를 실행한다. 특히 타인 접근, admin 우회, DB 직접 접근, 3명 동시성, unknown 재시도, 48h·14d 경계, 웹훅 역순, 개인정보 삭제/복구를 확인한다.

실제 저장소의 타입 검사·lint·build·기존 테스트를 실행한다. 순수 규칙 단위·DB 권한/동시성 통합·핵심 E2E를 적절히 선택한다. 단순 문구 변경에 과도한 테스트를 만들지 않는다. 테스트 시계를 사용하고 운영 데이터를 수정해 시간을 실험하지 않는다.
완료 보고에는 변경 결과, 실제 실행한 검증 명령/결과, 외부 연동 미검증 부분, 남은 결정, 운영 변경·배포·실제 발송 여부를 구분한다. mock 결과를 실제 전달로 보고하지 않는다.

## 12. 결정 요약

D01 Auth 방식, D02 schema·DB접근, D03 완화 발송, D04 matched 추가 안내, D05 48h/조기 사양, D06 재등록 순번, D07 재확인 만료, D08 공고 범위·자동발송, D09 동의/기간/국외이전, D10 집주인 직접 접수, D11 토큰TTL, D12 플랜/비용/복구, D13 구독 유지, D14 소수셀 공개.
제안과 확정의 경계를 유지하고 사용자가 결정하면 코드·문서·정책·테스트에 함께 반영한다.

## 13. GitHub Actions 배포

25장과 docs/github-actions-deploy.md를 적용한다. GitHub를 코드 기준으로 사용하고 Actions가 검증한 커밋을 Vercel CLI --prebuilt로 배포한다. git.deploymentEnabled=false로 Git 자동 배포 중복을 방지한다. preview/main 환경 분리, production main 제한, fork PR 비밀 접근 금지. 실제 저장소 명령과 고정 CLI 버전을 확인한다. Sites/Vinext 이식 및 Edge 업무 복제는 적용하지 않는다. DB migration은 별도 보호된 작업이며 앱 배포 성공과 구분한다. T25~T30 결과와 실제 커밋·Actions·배포 여부를 보고한다.

## 14. 지속적인 보안 기록과 출력 규칙

- 기존·신규·복사한 코드를 포함해 이 AGENTS.md 적용 범위의 모든 프로그램에 아래 규칙을 적용한다. 다른 저장소에도 적용하려면 해당 저장소의 AGENTS.md에 같은 규칙을 명시한다.
- 보안 조사·수정 때마다 `docs/security-review.md`에 날짜, 근거 파일, 적용/미구현/결정 필요/외부 미검증 상태, 검증 결과와 후속 완료 기준을 기록한다. 이번 범위 밖의 사항도 누락하지 않고 후속 작업으로 남긴다. 비밀번호·키·토큰·개인정보·실제 공격용 비밀값은 기록하지 않는다.
- 보안 관련 코드에는 보호 대상, 검증 이유, 신뢰 경계와 남는 한계를 설명하는 주석을 붙이고 코드 변경 시 함께 갱신한다.
- 일반 텍스트 출력은 `textContent`와 DOM API를 우선한다. 템플릿에 데이터를 삽입할 때는 문맥별 이스케이프·URL 검증을 적용한다. `innerHTML`/`outerHTML` 직접 쓰기는 공통 정화 함수 밖에서 금지한다. 구조가 필요한 내부 HTML은 검증된 sanitizer를 거친 `setHTML`/`replaceHTML`로만 삽입하고, 정화 실패 시 원문으로 우회하지 않는다. 정화 후 문자열을 덧붙여 삽입하지 않는다.
- HTML의 on* 이벤트 속성, javascript: URL, 문자열 eval/Function 실행을 작성하지 않는다. 외부 JavaScript의 함수·addEventListener 또는 고정 허용목록 이벤트 위임을 사용하고 인자는 코드가 아닌 이스케이프된 데이터로 전달한다.
- CSP의 script-src에 unsafe-inline을 다시 추가하지 않는다. script-src-attr 'none'을 유지한다. 필요한 인라인 스크립트는 nonce/hash와 배포 방식까지 검토한다. 개발 전용 unsafe-eval을 운영에 허용하지 않는다. style-src 예외와 스크립트 실행 허용은 구분한다.
- 출력·이벤트·CSP 변경 시 합성 악성 입력, 재렌더링 후 이벤트, 기존 화면 회귀와 production 정책을 검증한다. CSP·HttpOnly만으로 XSS 전체를 해결했다고 보고하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
