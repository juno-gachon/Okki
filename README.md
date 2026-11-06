# 옥키 · 방 알림과 첫 1년

옥천 입사 예정·입사한 1인 청년의 방 찾기와 정착을 돕는 한국어 반응형 웹 시제품입니다. 방 알림 신청부터 상담, 공공주택 정보, 동네 Q&A와 입주 후 생활까지 이어지는 흐름을 제공합니다.

## 주요 기능

| 기능 | 주요 내용 |
| --- | --- |
| 방 알림 | 입주 일정·예산·지역·생활 조건 등록, 조건 수정, 탐색 일시 중단·종료 |
| 공간 상담 | 안내받은 공간 확인, 신청 조건을 불러온 상담 요청, 진행 기록·취소 |
| 방 정보 제공 | 중개사 매물·퇴거 예정 정보 접수, 수정·철회, 운영 확인 체험 |
| 공공주택 | 주택·회차별 공고 탐색, 관심 주택 관리, 새 공고·모집 일정 알림 설정 |
| 동네 커뮤니티 | 일상·동네 정보, 질문·답변·답변 채택, 거주·방문 후기 |
| 정착·생활 | 첫 1년 할 일, 입주 상태, 저장한 정보, 생활권 도식과 최근 조회 장소 |
| 알림함 | 방 소식·질문 답변·할 일·공공주택 일정 알림 확인 |

양식의 임시 저장과 복원을 지원하며, 저장과 알림 구독은 별도로 관리합니다. 상담 요청은 방문·계약 완료와 구분합니다.

## 현재 구현 범위

기존 HTML·JavaScript·CSS 화면을 유지하고 Next.js 16.4.5 Route Handler로 Supabase Auth를 연결했습니다. 회원가입은 이메일·비밀번호·비밀번호 확인, 로그인은 이메일·비밀번호를 사용합니다. 가입 시 이메일 확인을 요구하지 않으며, 비밀번호 확인 입력은 화면의 일치 검사에만 사용하고 서버에 보내거나 저장하지 않습니다.

개발 프로젝트는 **Tech for impact - Develop** (ref: `osmxevxdsgvphqvdjnls`, 서울 `ap-northeast-2`)입니다. 서버는 Publishable key로 Auth만 호출하고 Secret/service_role 키를 사용하지 않습니다. 계정은 Supabase Auth에 저장되며, 세션은 HttpOnly·SameSite=Lax 쿠키로 관리합니다. HTTPS에서는 Secure도 적용합니다. 로그인 후 `#/account`에서 계정을 확인하고 로그아웃할 수 있습니다. Auth 응답은 UUID와 이메일만 반환하며, 이후 업무 API는 서버에서 검증한 UUID를 소유권 기준으로 사용해야 합니다.

**신청·매물·커뮤니티 등의 기존 데이터는 아직 localStorage 체험 데이터이며 계정별 서버 저장·접근 제어를 적용하지 않았습니다.** 다른 계정으로 로그인해도 같은 브라우저의 체험 기록은 공유됩니다. 운영자 화면도 체험용이며 실제 운영 권한을 부여하지 않습니다. 전화 인증·SMS·이메일 발송·비밀번호 복구·공고 수집은 현재 범위에 없습니다. 개발에는 합성 정보를 사용하세요. production 개인정보 흐름 출시는 D09 확정 및 별도 검증이 필요합니다.

## 실행과 검증

Node.js **24.18.1**과 npm lockfile을 사용합니다.

1. `npm ci --ignore-scripts --no-audit --no-fund`로 설치합니다.
2. `.env.example`을 참고해 git에서 제외되는 `.env.local`을 준비합니다. 기존 파일이 있으면 필요한 이름만 추가합니다.
3. `npm run dev`를 실행하고 [로컬 옥키](http://localhost:3000)에서 확인합니다.

| 환경변수 | 로컬 개발 값/용도 |
| --- | --- |
| `AUTH_ENABLED` | 로그인 기능을 사용할 환경에서 `true`; 미설정 시 503으로 차단 |
| `SUPABASE_URL` | 개발 프로젝트의 API URL |
| `SUPABASE_PUBLISHABLE_KEY` | 해당 프로젝트의 `sb_publishable_` 공개키. Secret/service_role 사용 금지 |
| `APP_BASE_URL` | 로컬 `http://localhost:3000`; Preview는 사용자가 접속할 신뢰하는 고정 주소 |

개발 프로젝트의 **Confirm email은 꺼짐**을 실제 조회로 확인했습니다. 서버는 가입 직전 설정을 다시 검사하여 확인 메일 발송 설정이 켜져 있으면 가입 요청을 차단합니다. 이메일은 로그인 식별자이며 소유가 확인된 연락처로 취급하지 않습니다. 앱 설정값을 사용자 Host 헤더로 대체하지 않습니다.

`npm run check`는 브라우저·서버 소스와 테스트의 구문을 검사하고, `npm run test:ci`는 기존 회귀 테스트와 Auth UI/API 테스트를 실행합니다. `npm run build`는 정적 UI를 `public/`에 복사하고 Next.js를 빌드합니다. `npm start`로 빌드 결과를 실행할 수 있습니다. `src/`가 UI 원본이며 `public/`·`.next/`는 생성물로 git에서 제외합니다. 정적 파일 서버만으로는 Auth API가 실행되지 않습니다.

2026-11-06 검증: 구문 검사·테스트 11개·Next.js 빌드 통과. 로컬 브라우저에서 실제 개발 Auth에 합성 계정 1개를 생성하고, 비밀번호 불일치 차단·가입 후 자동 로그인·새로고침 세션 유지·로그아웃·오입력 차단·재로그인을 확인했습니다. MCP의 읽기 쿼리로 해당 계정 UUID 생성과 비밀번호 해시 존재를 확인했습니다(해시 원문 미조회). 테스트 계정은 개발 프로젝트에 남아 있습니다. 브라우저 UI/API 테스트의 provider 응답은 mock이며, 실제 연동 결과와 구분합니다. 배포·Actions 실행·업무 schema 변경은 수행하지 않았습니다.

## 코드 구조

| 경로 | 역할 |
| --- | --- |
| `src/index.html`, `src/style.css` | 기본 문서, 스크립트 로딩, 공통 스타일 |
| `src/app.js` | 브라우저 저장소와 공통 UI |
| `src/flow.js` | 랜딩, 방 알림·상담 등 주요 흐름 |
| `src/integrated.js` | 커뮤니티·생활·알림·임시 저장 등 통합 기능 |
| `src/neighborhood-map.js` | 생활권 도식, 필터·장소 조회 |
| `src/public-housing.js` | 공공주택·공고·관심 및 일정 알림 |
| `src/vacancy.js` | 퇴거 예정 정보 접수·수정·철회 |
| `src/examples.js` | 체험용 예시 콘텐츠 |
| `src/router.js` | 해시 URL 해석과 화면·이벤트 연결 |
| `src/auth.js` | 이메일 가입·로그인·세션 확인·내 계정·로그아웃 |
| `app/api/auth/[action]/route.js`, `lib/server/` | Route Handler·입력/Origin 검증·Supabase Auth adapter |
| `tests/`, `scripts/` | 회귀 테스트와 구문 검사 |
| `.github/workflows/`, `vercel.json` | CI 및 Vercel 배포 설정 |

화면은 `#/wait`, `#/activity`, `#/area` 등의 해시 경로로 전환합니다. 파일 간 전역 함수 의존성이 있으므로 `index.html`의 스크립트 순서를 유지하고, `router.js`는 기능 파일 뒤에 로드하세요.

## GitHub Actions → Vercel 배포

저장소: [juno-gachon/Okki](https://github.com/juno-gachon/Okki)

PR에서는 CI 검사를 실행하고, 배포는 아래 브랜치의 push에서 실행하도록 구성되어 있습니다. 배포 workflow는 해당 커밋의 구문 검사·테스트를 통과한 뒤 Vercel CLI **65.11.0**으로 `pull` → `build` → `deploy --prebuilt`를 수행합니다.

| 브랜치 | GitHub Environment | Vercel 환경 |
| --- | --- | --- |
| `develop` | `preview` | Preview |
| `preview` | `preview` | Preview |
| `main` | `production` | Production |

개발은 `develop`에서 진행하고 `git push`로 Preview에 배포합니다. 검토가 끝나면 `develop` → `main` PR로 운영에 반영합니다. 기존 `preview` 브랜치 배포도 유지합니다.

`develop` 고정 주소: [개발 Preview](https://github-vercel-okki-develop-tech-for-impact.vercel.app). 배포 성공 후 별칭을 최신 배포에 연결하며, Preview 접근 보호 설정은 그대로 적용됩니다.

최초 설정:

1. Vercel 대상 프로젝트를 준비하고 Root Directory는 저장소 루트, Framework는 `Next.js`로 설정합니다. `vercel.json`은 `outputDirectory: ".next"`를 명시하여 이전 정적 사이트의 `src` 출력 설정을 덮어씁니다. 빌드 명령은 `npm run build`를 사용합니다.
2. GitHub Settings → Environments에 `preview`, `production`을 만들고, 각각 아래 값을 등록합니다. 환경별 프로젝트·비밀값을 구분합니다.
3. `preview` Environment의 배포 허용 브랜치에 `develop`과 `preview`를 지정하고, `production`은 `main`으로 제한합니다. `main`에는 CI 필수 검사와 브랜치 보호를 적용하고, `production`에는 배포 검토자를 설정합니다.
4. `develop` push 후 Actions 결과와 배포 페이지·스크립트·스타일 로딩을 확인하고, 검토한 변경을 `main`에 반영합니다.

| 등록 위치 | 이름 |
| --- | --- |
| Environment Secret | `VERCEL_TOKEN` |
| Environment Secret | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

Vercel Git 자동 배포는 `vercel.json`에서 비활성화하여 Actions와의 중복 배포를 방지합니다. 실행 요약에는 커밋 SHA와 배포 URL이 기록됩니다. 실제 인증·DB·문자 연동은 별도로 구축·검증해야 합니다.

Auth를 Preview에서 사용하려면 Vercel의 **develop 브랜치 Preview 환경**에 위 네 변수를 설정해야 합니다. `APP_BASE_URL`은 develop 고정 Preview 주소를 사용합니다. 다른 임시 배포 URL에서 POST하면 Origin 검증으로 거부되므로 고정 주소로 접속합니다. `NEXT_NO_ROUTES_MANIFEST` 오류가 `src/routes-manifest.json`을 가리키면 이전 출력 설정이 적용된 것입니다. `outputDirectory: ".next"` 수정이 포함된 새 커밋으로 Actions를 실행해야 합니다. 대시보드의 Output Directory override도 해제하면 설정 혼동을 줄일 수 있습니다. production에 개발 DB 값을 복사하지 마세요. 코드도 `VERCEL_ENV=production`에서 위 개발 DB 연결을 차단합니다. 이번 작업에서는 Vercel 환경값·프로젝트 설정을 원격 변경하거나 배포하지 않았습니다.
