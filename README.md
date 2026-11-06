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

HTML·JavaScript·CSS로 구성된 정적 시제품이며, 입력과 기록은 현재 브라우저의 localStorage에 보관됩니다. 다른 기기나 운영팀과 공유되지 않습니다.

실제 로그인·휴대폰 인증·서버 권한·DB·문자·이메일 발송·공고 자동 수집은 연동 전입니다. 운영자 화면도 로컬 체험용입니다. 지도는 생활권 도식과 외부 지도 링크를 사용하며, 예시 매물·공고·커뮤니티 콘텐츠는 실제 운영 정보가 아닙니다. 체험에는 예시 정보를 사용하세요.

## 실행과 검증

Node.js **24.18.1**을 사용합니다. `src/`를 정적 웹 서버의 루트로 제공하면 실행할 수 있습니다. 화면 실행을 위한 별도 번들 빌드는 없습니다.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run test:ci
npm run build
```

- `check`: 소스·검사 스크립트·테스트의 JavaScript 구문 검사
- `test:ci`: 방 알림·통합 기능·공공주택 흐름과 코드 구조 테스트 4개 실행
- `build`: 현재는 구문 검사 수행. 별도 출력 폴더를 생성하지 않음

기존 테스트는 입력·임시 저장 보존, 상담 중복 방지, 상태 변경, 지역별 콘텐츠, 알림 동의·중복 제어, 저장 실패, 공개 입력 이스케이프 등을 검사합니다. 실제 외부 인증·발송·DB 연동 검증은 포함하지 않습니다.

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

최초 설정:

1. Vercel 대상 프로젝트를 준비하고 Root Directory는 저장소 루트, Framework는 `Other`, Output Directory는 `src`로 설정합니다. 빌드 명령은 `vercel.json`의 `npm run build`를 사용합니다.
2. GitHub Settings → Environments에 `preview`, `production`을 만들고, 각각 아래 값을 등록합니다. 환경별 프로젝트·비밀값을 구분합니다.
3. `preview` Environment의 배포 허용 브랜치에 `develop`과 `preview`를 지정하고, `production`은 `main`으로 제한합니다. `main`에는 CI 필수 검사와 브랜치 보호를 적용하고, `production`에는 배포 검토자를 설정합니다.
4. `develop` push 후 Actions 결과와 배포 페이지·스크립트·스타일 로딩을 확인하고, 검토한 변경을 `main`에 반영합니다.

| 등록 위치 | 이름 |
| --- | --- |
| Environment Secret | `VERCEL_TOKEN` |
| Environment Secret | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

Vercel Git 자동 배포는 `vercel.json`에서 비활성화하여 Actions와의 중복 배포를 방지합니다. 실행 요약에는 커밋 SHA와 배포 URL이 기록됩니다. 실제 인증·DB·문자 연동은 별도로 구축·검증해야 합니다.
