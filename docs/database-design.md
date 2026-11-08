# 옥키 DB·통신·접근 권한 상세설계

기준일: 2026-11-08 KST. 문서 상태: **설계 작성, DB 미적용**.

이 문서는 방 알림 신청, 중개사 매물, 퇴거 예정, 공동거주 모집의 저장·조회·사진·매칭 연결 기준이다. 사용자 결정과 구현 제안을 구분한다. 실제 schema의 증거는 migration과 대상 환경의 검증 결과다. 이 문서 작성만으로 테이블·RPC·Storage·권한이 생성된 것은 아니다.

공개 저장소에 올릴 수 있도록 실제 계정·프로젝트 연결값·개인정보·비밀값을 제외했다. 코드 근거는 `src/flow.js`, `src/integrated.js`, `src/vacancy.js`, `lib/server/auth-handler.mjs`, `lib/server/supabase-auth.mjs`다. 기존 설계 4~10·14~20장과 D01~D14를 함께 참고한다. `docs/okki-mvp.md`와 `docs/decisions.md`는 로컬 문서이며 Git에서 제외될 수 있으므로 이 문서만으로 현재 핵심 결정을 읽을 수 있게 유지한다.

## 1. 결정·제안·보류의 경계

| 항목 | 상태 | 현재 기준 |
| --- | --- | --- |
| 로그인·소유권 | 확정, 기존 Auth 코드 존재 | 이메일/비밀번호, 서버 검증 Auth UUID. 개발 이메일 소유 미확인. D01 |
| 신청 수 | 사용자 확정 | 1인 1신청, 수정으로 관리. 다중 신청은 추후 |
| 신청자/조건 테이블 분리 | 설계 제안 | seekers와 housing_requests를 1:1로 연결. 향후 제약·API·중복 안내 정책을 함께 바꿔 확장 |
| 중개사 매물 | 사용자 확정 | 중개사가 정보 관리·계약 진행. 옥키의 개별 매물 사실관계 검수 생략 |
| 거주자 두 폼 | 사용자 확정 | 신청자가 제출하고 운영자가 내용 확인. 이후 인계·매칭 전환 세부 절차 보류 |
| 사진 | 사용자 확정 | 방당 최대 5장, 장당 약 500KB~1MB 압축 목표, 안내 대상에게 상세 화면에서 표시 |
| API 접근 제한 | 사용자 확정 | 인증뿐 아니라 소유권·역할·대상 상태·반환 필드 검사 |
| DB 접근 | D02 제안 | public 업무 테이블, 일반 사용자 직접 grants 차단, 서버 RPC |
| 월 고정비 | UI 정합성 설계 제안 | 현재 폼의 월세+고정 관리비 의미를 monthly_total_max로 보존. rent_max로 오기하지 않음 |
| 주소·집주인 연락처 | 필요성 논의, 세부 결정 필요 | 후보 테이블만 설계. 목적·수집/제공 범위·D09 승인 전 활성화 금지 |
| 전화·SMS | 보류 유지 | 번호 필수/unique, OTP, 문자 발송·재확인·무응답 자동 만료 비활성 |
| 개인정보 문구·보관·삭제 | D09 미결정 | 법정 기간 또는 90일 등의 수치를 임의 확정하지 않음 |
| 집주인 직접 접수 | D10 미결정 | 거주 소유자를 tenant로 허위 분류하지 않음 |

아래 세부 필드·enum·길이·인덱스·상태 전이는 구현 제안이다. 확정된 사용자 결정을 제외하고 Dxx를 자동 accepted로 바꾸지 않는다. 현재 작업은 문서만 작성하며 원격 DB 조사·migration·배포·발송은 수행하지 않았다.

## 2. 공통 데이터 규칙

- `N`: NOT NULL, `?`: NULL 허용. 별도 표기가 없으면 nullable 필드의 기본값은 NULL, 필수 필드의 기본값은 없음(명시 입력). 서버 관리 필드는 API 입력 허용목록에서 제외한다.
- `C` 공통 열: `id uuid PK DEFAULT gen_random_uuid()`, `created_at timestamptz N DEFAULT now()`.
- `M` 수정 공통 열: C + `updated_at timestamptz N DEFAULT now()`, `version integer N DEFAULT 1 CHECK(version > 0)`. 갱신 시 DB에서 version+1 및 updated_at 갱신. 임의 버전·시각 입력 금지.
- `D` 종속 상세 공통 열: `listing_id uuid PK/FK → listings.id ON DELETE CASCADE`. 별도 id/version 없음. 종속 정보 변경도 부모 listings의 version을 증가시킨다.
- 금액은 integer, 정수 만원, `NULL 또는 >=0`. NULL=미확인/미정, 0=확인된 없음. 기간은 date, 업무 시각은 timestamptz(UTC 저장·Asia/Seoul 표시).
- `varchar(n)` 필수 문자열은 trim 후 1~n자, 선택 문자열은 공백만이면 NULL. 길이 제한은 DB와 API에서 동일 적용. 아래 숫자 상한은 기술 제안이며 UI와 함께 확정한다.
- 코드값은 text+CHECK를 기본 제안으로 사용한다. 배열은 NULL 원소·중복·허용 외 값 금지. 필수 선택 배열은 cardinality>=1. 배열 내 중복 검사는 고정된 DB 검증 함수/트리거로 구현한다.
- 읍면 허용값: 옥천읍·동이면·안남면·안내면·청성면·청산면·이원면·군서면·군북면.
- 방 구조 코드 제안: studio / one_point_five / two_room / other. 거주 방식: independent / shared_house / roommate / boarding / spare_room / employer_housing / other. 현재 UI type 한 필드에 섞인 두 개념을 서버에서 추측하지 말고 UI와 함께 구분한다.
- 이용 조건: any / shared_ok / private_preferred / private_required. 공급 시설: private / shared / unknown. 필수와 선호를 동일한 탈락 규칙으로 사용하지 않는다.
- FK의 기본 삭제는 RESTRICT. 종속 상세·사진 메타는 CASCADE 명시. 수행자 이력은 SET NULL 가능하나 업무 소유권은 NULL로 풀지 않는다. 모든 FK에 삭제 동작을 명시한다.
- 일반 CHECK는 다른 행·테이블을 검증하지 못한다. 교차 참조·개수·상태 전이는 RPC의 row lock과 constraint trigger 등으로 검사한다. 유효한 최종 상태를 커밋 시 보장해야 하는 경우 deferred constraint trigger를 사용한다.
- 사람·매물 공통 정보는 컬럼으로 저장한다. 자유서술 전체 폼을 JSON에 복제하지 않는다. JSON은 허용목록의 최소 스냅샷·비민감 이벤트에 제한한다.

## 3. 관계와 적용 단계

```text
auth.users ── 0..1 seekers ── 0..1 housing_requests
     │
     └── 0..N providers ── 0..N listings
                                  ├── 등록 kind에 맞는 상세 1개
                                  ├── listing_media 0..5개(예약 포함)
                                  └── listing_reviews 0..N개(거주자 등록)
housing_requests ── matches ── listings  [후속 안내 기능]
```

기본 등록 단계: 4.1~4.10 및 4.13~4.16. 4.11~4.12는 개인정보 결정 후 활성화 후보. 4.17~4.19는 안내·매칭 연결 단계 설계이며 즉시 기능 활성화를 뜻하지 않는다. 하나의 계정이 신청자와 공급자를 겸할 수 있다.

## 4. 테이블별 필드 사전

### 4.1 auth.users — 관리형 인증 데이터

이 테이블을 앱 migration으로 재정의하지 않는다. 앱이 참조하는 키는 `id uuid PK`다. 이메일·비밀번호 해시·세션은 Supabase Auth가 관리한다. 업무 테이블에 비밀번호·확인 비밀번호·Auth 토큰을 저장하지 않는다. 이메일 문자열을 FK 또는 권한 키로 사용하지 않는다.

### 4.2 seekers — 신청자

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| auth_user_id | uuid N | UNIQUE, FK auth.users(id) RESTRICT |
| display_name | varchar(40) ? | 필요한 경우만 별칭. 로그인 식별자 아님 |
| delete_after | timestamptz ? | D09 확정 후 산정; 미확정 기간을 기본값으로 넣지 않음 |

신청자 이름·전화번호만으로 중복 인물을 판별하지 않는다. 현재 1인 1신청의 기술적 의미는 **Auth 계정당 하나**이며 이메일 소유 미확인 상태에서 한 사람이 여러 계정을 만드는 것까지 차단하지 못한다. 실명 중복 방지 정책은 별도다.

### 4.3 housing_requests — 방 알림 신청서

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| seeker_id | uuid N | UNIQUE, FK seekers(id) RESTRICT |
| situation | text N | joining / working / relocating / other |
| employment_start_on | date ? | 미정·해당 없음 NULL |
| move_in_from | date N | 희망 입주 시작 |
| move_in_to | date ? | NULL=마지막 가능일 미정, 값이 있으면 >=from |
| duration_months | smallint ? | 값이 있으면 1~120, 미정 NULL |
| deposit_max | integer ? | >=0, 미정 허용 |
| monthly_total_max | integer ? | >=0, 월세+고정 관리비 상한 |
| work_myeon | text ? | 읍면 허용목록. 모르면 NULL, 무차량 지역 일치 확정 불가 |
| work_village | varchar(40) ? | 근무지 리·마을. 현재 UI는 옥천읍 기존 목록 제안 및 직접 입력, 읍면 소속 자동 확정 아님 |
| preferred_myeons | text[] N DEFAULT '{}' | any_region=false이면 1개 이상, true이면 빈 배열 |
| any_region | boolean N DEFAULT false | 옥천 내 무관의 명시적 선택 |
| transport_mode | text N DEFAULT 'unknown' | car / transit / walking_cycling / unknown |
| commute_max_minutes | smallint ? | 1~300; 실제 경로 데이터 없이 통근 충족을 보장하지 않음 |
| accepted_room_types | text[] ? | 미수집 NULL, 제공되면 1개 이상 및 허용목록 |
| accepted_housing_modes | text[] ? | 미수집 NULL, 제공되면 1개 이상 및 허용목록 |
| kitchen_preference, bath_preference | text N DEFAULT 'any' | 공통 이용 조건 코드, 각각 독립 컬럼 |
| must_have, preferences | varchar(500) ? | 자유서술 필수/선호. 자동 충족 판정 금지 |
| status | text N DEFAULT 'waiting' | waiting / paused / matched / found / ended / expired |
| priority_at | timestamptz N DEFAULT now() | 서버 생성, 재등록 변경은 D06 결정 후 |
| last_confirmed_at | timestamptz N DEFAULT now() | 본인의 조건 확인 시각; 이메일 소유 확인 의미 아님 |
| ended_at | timestamptz ? | found/ended/expired일 때 필수, 그 외 NULL |
| end_reason | varchar(200) ? | 종료 코드 또는 제한된 사유; 상태별 허용목록 적용 |
| delete_after | timestamptz ? | 보관 정책 확정 후 |

인덱스: UNIQUE(seeker_id), (status, priority_at, id), (status, last_confirmed_at). 종료 후 새 행 생성 대신 기존 행 재활성화 제안. 순번·동의 갱신 규칙은 D06/D09 확정 필요. 문자 무응답으로 expired 전환하는 작업은 보류. NULL 조건이 있는 신청도 접수 가능하되 exact 후보는 확인된 조건으로만 판정한다.

### 4.4 providers — 실제 공급자와 중개사 등록 자격

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| auth_user_id | uuid N | FK auth.users(id) RESTRICT |
| type | text N | broker / tenant |
| display_name | varchar(100) ? | 필요한 별칭·담당자 표시명 |
| office_name | varchar(100) ? | broker면 필수 |
| broker_reg_no | varchar(80) ? | broker면 필수 제안, 길이만으로 진위 확인 불가 |
| representative_name, staff_role | varchar(100) ? | 대표 성명/담당 역할, 필요 최소 수집 |
| office_address | varchar(300) ? | 사업장 정보 수집 범위 확정 후 사용, 매물 주소와 구분 |
| office_evidence_note | varchar(1000) ? | 최소 확인 설명. 증명서 원문·신분증 수집 제외 |
| account_status | text N DEFAULT 'pending' | pending / approved / suspended |
| approved_by | uuid ? | FK auth.users(id) SET NULL, 서버 전용 |
| approved_at | timestamptz ? | approved이면 필수; 정지 후 과거 시각 보존 가능 |
| delete_after | timestamptz ? | D09 확정 후 |

UNIQUE(auth_user_id,type) 제안: 계정당 유형별 공급자 한 개. 여러 사무소·팀 공유는 후속. 등록번호는 여러 담당자가 공유할 수 있어 무조건 UNIQUE 하지 않는다. 인덱스 (account_status,type). broker approved는 매물마다 검수했다는 의미가 아니다. tenant 승인 절차는 운영자 내용 확인과 별개이며 자동으로 중개사 자격을 부여하지 않는다.

현재 shared 폼의 ‘소유자이며 직접 거주’는 D10 미결정이다. 승인 없이 tenant로 저장하지 않는다. 활성화 전 입력 선택지를 제한하거나 신규 실제 유형과 권한을 함께 설계해야 한다.

### 4.5 listings — 공통 방 등록

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| owner_user_id | uuid N | FK auth.users(id) RESTRICT, 서버가 결정 |
| provider_id | uuid N | FK providers(id) RESTRICT |
| kind | text N | broker_listing / vacancy_report / shared_housing |
| source | text N | broker / tenant / operator. 실제 공급자 유형과 입력 출처 구분 |
| entered_by | uuid ? | FK auth.users(id) SET NULL, 최초 입력자 |
| title | varchar(120) N | 공개 가능한 제목; vacancy는 입력 조건에서 안전하게 생성 가능 |
| myeon | text N | 읍면 허용목록 |
| room_type | text ? | 방 구조 코드 |
| housing_mode | text ? | 거주 방식 코드 |
| deposit, rent, maintenance_fee | integer ? | 각각 >=0. vacancy는 다음 계약 조건 미확인 시 NULL |
| available_from, available_to | date ? | to가 있으면 from 필수 및 to>=from. 모집 마감일과 구분 |
| min_months, max_months | smallint ? | 1~120, max가 있으면 min 필수 및 max>=min |
| kitchen_use, bath_use | text N DEFAULT 'unknown' | private / shared / unknown |
| public_summary | varchar(1000) ? | 안내용 요약. 주소·개인 연락처 포함 금지 |
| contact_preference_note | varchar(300) ? | 내부 조율 시간/방법, 실제 번호·이메일은 넣지 않음 |
| lifecycle_status | text N DEFAULT 'open' | open / closed / withdrawn |
| review_status | text N | not_required / received / reviewing / needs_update / reviewed |
| eligibility_status | text N DEFAULT 'blocked' | blocked / eligible; 운영자 접수 확인과 별개 |
| last_confirmed_at | timestamptz ? | 공급 조건을 담당자가 실제 재확인한 시각 |
| closed_at | timestamptz ? | closed/withdrawn이면 필수, open이면 NULL |
| delete_after | timestamptz ? | D09 확정 후 |

제약: broker_listing의 review_status는 not_required만, 나머지는 not_required 금지. 현재 비중개사 kind는 eligibility_status=blocked 강제. eligible은 open인 broker_listing에만 허용하며 금액·일정·방 조건 등 매칭 필수값 및 승인된 provider를 확인한다. 관리비 NULL을 0으로 계산하지 않는다.

providers에 UNIQUE(id,auth_user_id)를 두고 listings(provider_id,owner_user_id)의 복합 FK로 소유자 일치를 DB에서도 강제한다. RPC에서 kind/type/source와 실제 actor 역할을 추가 검사한다. 일반 사용자는 owner/provider/kind/source/entered_by/서버 상태를 임의 변경할 수 없다.

UNIQUE(id,kind)는 상세 유형 FK용. 인덱스 (owner_user_id,created_at,id), (provider_id), (eligibility_status,myeon,available_from), (review_status,created_at,id). 광범위 JSON·금액별 인덱스는 측정 후 추가한다. 금액·일정·권한·사진 등 중요 수정 시 version 갱신, 거주자 확인 상태 재설정, 기존 안내 재조회 시 최신 상태 확인.

### 4.6 broker_listing_details — 중개사 매물 상세

공통: D. 아래 kind는 부모 종류 검증용 상수다.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| kind | text N DEFAULT 'broker_listing' | CHECK 고정값, (listing_id,kind) FK listings(id,kind) CASCADE |
| building_use | varchar(100) ? | 건축물 용도 |
| area_description, floor_description, rooms_baths_description | varchar(200) ? | 현재 UI 자유 입력을 보존. 매칭 수치로 파싱하지 않음 |
| direction_description, parking_description | varchar(200) ? | 방향·기준/주차 조건 |
| building_approved_on | date ? | 사용승인일 |
| authority_status | text N | confirmed / needs_check. 중개사의 진술 |
| authority_note | varchar(1000) ? | 확인 일자·근거, 내부 전용 |
| transaction_type | text N | monthly / jeonse / other_rental |
| fee_items | varchar(500) ? | 관리비 포함 항목 |
| fee_basis, utilities_note | varchar(1000) ? | 부과 기준/별도 공과금 |
| commission_note | varchar(500) ? | 중개보수 안내 |
| occupancy_condition | text N | vacant / occupied_departure_known / repairing |
| repair_completed_on | date ? | 수리·퇴거 완료 예정 |
| facilities_note, rules_note | varchar(1000) ? | 시설/흡연·반려동물 등 |
| condition_note | varchar(1000) ? | 중개사가 확인한 상태·미확인 사항 |

단위·비용은 listings에서만 관리. jeonse일 때 rent=0 조건은 교차 테이블 transaction 검사로 강제. authority_status!=confirmed이면 eligible 전환 금지. publicScope 자유문구로 공개 권한을 부여하지 않는다. 중개사 사실관계 검수 생략과 입력 완결성 검사는 구분한다.

### 4.7 vacancy_listing_details — 퇴거 예정 정보

공통: D.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| kind | text N DEFAULT 'vacancy_report' | 고정값, 복합 FK listings(id,kind) CASCADE |
| certainty | text N | confirmed / tentative / unknown |
| leave_on | date ? | certainty=confirmed면 필수 |
| timing_note | varchar(500) ? | leave_on=NULL이면 필수 제안 |
| current_contract_ends_on | date ? | 현재 계약 종료일; 퇴거일과 다를 수 있음 |
| date_adjustment_note | varchar(300) ? | 날짜 조정 범위 |
| landlord_notified | text N DEFAULT 'unknown' | yes / no / unknown |
| notified_on | date ? | yes면 필수, 그 외 NULL |
| notice_method | text ? | phone / message / in_person / other; yes면 필수 |
| planned_notice_on | date ? | 통지 예정일, 완료 상태이면 NULL |
| landlord_response | text N DEFAULT 'unknown' | no_reply / acknowledged / discussing / declined / unknown |
| landlord_intent | text N DEFAULT 'unknown' | willing / unwilling / discussing / unknown; 세입자 진술 |
| landlord_response_summary | varchar(500) ? | 통지·응답 요약, 대화 원문·번호 금지 |
| connection_preference | text N DEFAULT 'undecided' | via_submitter / via_broker / undecided |
| current_deposit, current_rent, current_maintenance_fee | integer ? | 각각 >=0, 현재 계약 금액 |
| current_fee_note | varchar(500) ? | 현재 관리비 포함 항목·산정 방식 |
| condition_note | varchar(1000) ? | 집 상태·수리 참고 |

집주인 통지/응답/재임대 의사/실제 공급 가능을 서로 다른 사실로 취급한다. 현재 금액·leave_on은 listings의 다음 계약 조건으로 자동 복사하지 않는다. 집주인 연락처 입력은 4.12의 정책 승인 전 받지 않는다.

### 4.8 shared_listing_details — 함께 살 사람 모집

공통: D.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| kind | text N DEFAULT 'shared_housing' | 고정값, 복합 FK listings(id,kind) CASCADE |
| residency_note | varchar(500) ? | 현재 거주 여부 설명 |
| tenure_type | text N | tenant만 현재 활성. resident_owner는 D10 결정 후 확장 |
| authority_status | text N | confirmed / needs_check; 모집자의 진술 |
| authority_note | varchar(1000) ? | 내부 확인 설명, 원문 증명서 제외 |
| recruitment_type | text N | roommate / shared_house / boarding / other |
| current_people, recruit_people | smallint N | 각각 1~100 제안 |
| sleeping_type | text N | private_room / shared_room |
| room_area_description | varchar(200) ? | 사용 방 수·면적 |
| recruitment_ends_on | date ? | 실제 입주 종료일과 별개 |
| meal_note | varchar(500) ? | boarding이면 필수 |
| utilities_note, rules_note, living_rules | varchar(1000) ? | 추가 비용/방문객·흡연/생활 규칙 |
| resident_intro | varchar(500) ? | 선택, 타인 개인정보 금지 |

listings 금액은 입주자 1명 기준으로 명확히 표시. 총 가구 비용과 인당 분담금 혼동 금지. 현재는 접수·운영 확인만 하며 모집 인원 차감·입주 확정·자동 매칭은 후속.

세 상세 테이블은 종류별 PK/FK로 중복·잘못된 유형을 막는다. 부모에 상세가 정확히 하나 존재하는지는 생성/수정 RPC와 부모·상세 변경에 반응하는 deferred constraint trigger로 커밋 시 확인한다. 부모 삭제 시에는 해당 검사를 건너뛰고 종속 행을 삭제한다.

### 4.9 listing_media — 비공개 사진 관리

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| listing_id | uuid N | FK listings(id) CASCADE |
| uploaded_by | uuid ? | FK auth.users(id) SET NULL |
| bucket_name | varchar(100) N | 설정된 전용 비공개 버킷만, 서버 지정 |
| storage_path | varchar(500) N | 서버 생성 랜덤 경로; 원본 파일명·주소·이메일 포함 금지 |
| sort_order | smallint N | 1~5, UNIQUE(listing_id,sort_order) |
| upload_status | text N DEFAULT 'reserved' | reserved / ready / deleting |
| reservation_expires_at | timestamptz ? | reserved면 필수, ready면 NULL |
| mime_type | text ? | 준비 완료 시 image/jpeg 또는 image/webp 필수 제안 |
| byte_size | integer ? | ready일 때 >0 및 승인된 업로드 상한 이하 |
| width, height | integer ? | ready일 때 각각 >0 및 픽셀 상한 검사 |

UNIQUE(bucket_name,storage_path). 최대 5개 슬롯으로 예약·삭제 중인 사진도 개수에 포함. 실패·만료 행은 파일 정리 후 제거하여 슬롯 반환. 준비 완료 전 사진은 열람 불가. 임의 sort_order 교체는 유일 제약을 고려한 단일 transaction으로 처리한다. 사진 수정도 listings.version에 반영한다.

압축 목표는 약 500KB~1MB이며 최소 용량 조건이 아니다. 1MB의 정확한 바이트 정의·최대 크기·해상도·원본 입력 크기는 미결정. 예시 숫자를 DB에 확정값으로 넣지 않는다. Storage 객체 삭제는 FK CASCADE로 수행되지 않으므로 7장 정리 절차가 필수다.

### 4.10 listing_reviews — 거주자 등록의 운영 확인 이력

공통: C, append-only 제안.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| listing_id | uuid N | FK listings(id) CASCADE |
| listing_version | integer N | >0, 확인한 내용의 부모 버전 |
| reviewed_by | uuid ? | FK auth.users(id) SET NULL; 생성 시 활성 운영자 필수 |
| result | text N | reviewing / needs_update / reviewed |
| submitter_message | varchar(1000) ? | 작성자에게 보여줄 보완 요청 |
| internal_note | varchar(1000) ? | 운영자 전용, 사용자 API에서 제외 |

인덱스 (listing_id,created_at,id). 중개사 매물에는 생성하지 않음. 리뷰 추가와 현재 review_status 변경을 단일 transaction으로 처리하며 버전 충돌을 확인한다. reviewed는 접수 내용 확인이며 임대 가능 확정이 아니다. 수정 이력은 새 행으로 남기고 기록 원문을 몰래 덮어쓰지 않는다. 보관 정책에 따른 삭제는 별도 허용한다.

### 4.11 listing_private_locations — 상세 주소 후보, 비활성

공통: D. 정책 승인 후 적용 후보이며 현재 수집 금지를 자동 해제하지 않는다.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| road_address, parcel_address | varchar(300) ? | 적어도 하나 필요 |
| building_name | varchar(100) ? | 해당할 때만 |
| unit_detail | varchar(100) ? | 동·호수, 필요할 때만 |
| postal_code | varchar(5) ? | 값이 있으면 숫자 5자리 |
| verification_status | text N DEFAULT 'unverified' | unverified / confirmed / needs_update |
| confirmed_by | uuid ? | FK auth.users(id) SET NULL |
| confirmed_at | timestamptz ? | confirmed면 필수 |

API 일반 요약에서 전부 제외. 주소 조회 자체에 역할·목적·현재 접근권 검사. 주소 수정은 listings.version에 반영하고 공개할 단계는 D09 결정 후 구현. 좌표·지도·자동 주소 API는 현재 범위 아님.

### 4.12 listing_contacts — 업무 연락 경로 후보, 비활성

공통: M. 연락처 수집 정책 승인 후 사용.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| listing_id | uuid N | FK listings(id) CASCADE |
| role | text N | broker / landlord / submitter |
| display_name | varchar(100) ? | 필요 최소 이름/역할 |
| phone_e164 | varchar(16) N | 국제 표준 형식 검사, 실제 번호 소유·사용 가능 확인과 별개 |
| provided_by | uuid ? | FK auth.users(id) SET NULL |
| source | text N | self / submitter / broker |
| verification_status | text N DEFAULT 'unverified' | unverified / confirmed / disputed |
| confirmed_at | timestamptz ? | confirmed이면 필수 |
| usage_scope | text N DEFAULT 'operator_only' | operator_only / authorized_recipient |
| disclosure_consent_id | uuid ? | FK consents(id) RESTRICT, 허용 대상·목적까지 RPC 검증 |
| delete_after | timestamptz ? | D09 |

인덱스 (listing_id,role). 전화번호 UNIQUE 강제하지 않음. authorized_recipient 값만으로 누구에게나 반환하지 않고 건별 대상·목적·철회 상태를 확인한다. 실제 집주인의 동의와 제보자의 진술을 혼동하지 않는다. 암호화·키 관리와 제공 증빙의 구체 방식은 활성화 전 확정한다.

### 4.13 consents — 목적·버전별 동의 이력

공통: C, append-only.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| user_id | uuid N | FK auth.users(id) RESTRICT, 동의 주체 |
| housing_request_id | uuid ? | FK housing_requests(id) RESTRICT |
| listing_id | uuid ? | FK listings(id) RESTRICT |
| scope | text N | account / housing_request / listing |
| purpose_code | varchar(80) N | 승인된 정책 코드 허용목록. 수집/안내/제3자 제공 분리 |
| policy_version | varchar(80) N | 승인된 불변 문구/정책 버전 식별자 |
| action | text N | grant / withdraw |
| previous_consent_id | uuid ? | FK consents(id) RESTRICT, withdraw이면 필수 |
| recipient_provider_id | uuid ? | FK providers(id) RESTRICT, 실제 제공 시 대상자 연결 |
| policy_snapshot | jsonb N | 승인된 목적·항목 코드·수신자 설명·기간 정책의 최소 증빙, 사용자 폼 원문 제외 |
| request_id | uuid N | 서버 추적 ID, 인증 토큰 아님 |

CHECK: scope=account면 두 대상 FK NULL, housing_request면 해당 FK만 필수, listing이면 해당 FK만 필수. 제공 동의의 수신자·항목·목적·기간은 정책별 필수 검사. 현재값은 이력에서 계산하며 withdraw가 같은 사용자·목적·대상의 유효 grant를 참조하는지 잠금 후 검증한다. UNIQUE(previous_consent_id) WHERE action='withdraw'로 중복 철회 방지 제안. 인덱스 (user_id,purpose_code,created_at,id), 각 대상 FK.

확정 문구 없이는 실운영 동의를 임의 생성하지 않는다. 필수 동의와 업무 저장은 원자적 처리. 계정 전체 삭제 때 FK 순서대로 이력을 정리하되 보관 예외는 D09에서 별도 확정한다.

### 4.14 admin_memberships — 운영자 권한

공통 M 대신 `user_id uuid PK/FK auth.users(id) ON DELETE CASCADE`, `created_at`, `updated_at`, `version`은 M과 같은 타입·기본값.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| role | text N | owner / operator / analyst |
| active | boolean N DEFAULT false | true인 멤버만 역할 적용 |
| granted_by | uuid ? | FK auth.users(id) SET NULL |
| granted_at | timestamptz ? | active이면 필수 |
| revoked_at | timestamptz ? | 회수 시 기록 |

최초 운영자 부여는 별도의 통제된 관리 작업. 일반 가입 API로 생성/활성화 불가. role 변경·회수는 감사 기록과 transaction. analyst는 신청 원본/연락처/사진 접근 불가. 이메일·user_metadata.role로 권한 부여 금지.

### 4.15 idempotency_requests — 중복 요청 제어

공통: C.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| actor_user_id | uuid N | FK auth.users(id) RESTRICT |
| operation | varchar(100) N | HTTP 작업+대상 범위를 포함한 서버 허용 코드 |
| idempotency_key | uuid N | 클라이언트가 한 제출에 생성, 재시도 때 재사용 |
| request_digest | bytea N | 정규화한 업무 입력의 keyed digest, 32바이트 제안 |
| digest_key_version | varchar(40) N | 비밀키 자체가 아닌 회전 식별자 |
| response_status | smallint N | 저장된 성공 HTTP 상태, 200~299 |
| resource_type | text N | housing_request / listing / media / match_batch |
| resource_id | uuid N | 논리 참조, 반환 전에 실제 대상·소유권 재검증 |
| resource_version | integer N | >0, 당시 처리 결과 버전 |
| expires_at | timestamptz N | >created_at, TTL은 별도 정책 확정 |

UNIQUE(actor_user_id,operation,idempotency_key), (expires_at). 폼 원문·전체 응답·서명 URL 저장 금지. transaction 내 키별 직렬화(고유 제약+충돌 재조회 또는 advisory transaction lock) 후 성공 결과와 업무 쓰기를 함께 커밋한다. 같은 키/다른 digest는 409. 실패는 전체 롤백. 프로세스 메모리만으로 제어하지 않는다.

재시도 응답은 최소 receipt(id/당시 version/성공 상태)로 고정하고 최신 내용은 별도 GET. 결과 대상이 삭제되었거나 권한이 철회됐으면 원문 응답을 재생하지 않는다. TTL 이후의 중복은 unique seeker 등 업무 제약으로 추가 방어하며 영구 exactly-once를 주장하지 않는다.

### 4.16 audit_logs — 보안·관리 감사

공통: C, append-only.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| actor_user_id | uuid ? | FK auth.users(id) SET NULL |
| action | varchar(100) N | 권한 부여/회수, 운영 확인, 상태 변경, 민감 정보 조회 등 허용 코드 |
| target_type | varchar(50) N | 허용 대상 종류 |
| target_id | uuid ? | 논리 참조. 삭제·익명화 때 연계 식별자 정리 필요 |
| outcome | text N | success / denied / failed |
| request_id | uuid N | 서버 요청 ID |
| metadata | jsonb N DEFAULT '{}' | 바뀐 필드명·사유 코드·행 수 등 최소 허용목록 |
| delete_after | timestamptz ? | 보관 정책 확정 후 |

인덱스 (target_type,target_id,created_at), (actor_user_id,created_at). 연락처·주소·토큰·쿠키·원문 오류 객체·전체 변경 전후 데이터 제외. raw IP도 기본 수집하지 않는다. 성공 변경과 관련 감사는 함께 커밋; 거부/실패 감사는 실패 transaction과 별도로 최소 정보만 기록. 감사 실패로 민감 작업을 허용하는 우회 금지. 앱 append-only는 DB 소유자도 변경 불가하다는 보장이 아니다.

### 4.17 match_batches — 후속 안내 차수

공통: M. 안내 기능 구현 시 적용 후보.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| listing_id | uuid N | FK listings(id) RESTRICT |
| sequence_no | integer N | >0, UNIQUE(listing_id,sequence_no) |
| status | text N DEFAULT 'open' | open / closed / cancelled |
| approved_by | uuid ? | FK auth.users(id) SET NULL, 생성 당시 활성 운영자 필수 |
| approved_at | timestamptz N DEFAULT now() | 승인 시각 |
| closed_at | timestamptz ? | closed/cancelled면 필수 |

UNIQUE(listing_id) WHERE status='open', UNIQUE(id,listing_id)는 match 복합 FK용. 한 방 row lock 후 후보 재검증·1~3명의 승인·차수 생성·이벤트를 원자적으로 처리한다. 커밋 시 차수 인원 수를 constraint trigger로 보장한다. 48시간/문자 전달 기준은 D05 보류이며 웹 안내에 임의 치환하지 않는다.

### 4.18 matches — 후속 신청×방 안내

공통: M.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| housing_request_id | uuid N | FK housing_requests(id) RESTRICT |
| listing_id | uuid N | FK listings(id) RESTRICT |
| batch_id | uuid N | (batch_id,listing_id) FK match_batches(id,listing_id) RESTRICT |
| request_version, listing_version | integer N | >0, 승인 시점 버전 |
| rules_version | varchar(50) N | 비교 규칙 버전 |
| match_level | text N | exact / relaxed; relaxed는 D03 전 비활성 |
| eligibility_snapshot | jsonb N | 필요한 조건·사유 코드만, 신원·주소·연락처·사진 URL 제외 |
| approved_by | uuid ? | FK auth.users(id) SET NULL, 생성 시 활성 운영자 필수 |
| approved_at | timestamptz N DEFAULT now() | 승인 시각 |
| access_status | text N DEFAULT 'active' | active / revoked |
| response | text ? | inquire / pass |
| pass_reason | text ? | budget / location / timing / condition / other; pass면 필수 |
| pass_note | varchar(500) ? | 선택, 개인정보 금지 |
| responded_at | timestamptz ? | response와 함께 NULL 또는 함께 값 존재 |
| revoked_at | timestamptz ? | revoked면 필수 |

UNIQUE(housing_request_id,listing_id), (housing_request_id,created_at,id), (listing_id), (batch_id). 현재 request UNIQUE(seeker_id) 덕분에 계정별 중복 안내도 제한된다. 다중 신청 도입 때는 사람 기준 중복·3명·순번 정책을 함께 변경한다. 본인 소유 매물 제외. 안내 열람 GET은 문의/사양·종료·동의·토큰 소모를 수행하지 않는다.

화면 접근은 match 소유권뿐 아니라 access_status·매물 현재 공개 가능 상태·사진 ready 상태를 재검사한다. 조건 변경 후 새 내용과 승인 당시 조건이 다르면 차이를 표시하거나 접근을 보류하는 정책 필요. 문의와 계약은 별개이며 계약 사실 입력 기능은 현재 폼 저장 범위 밖이다.

### 4.19 events — 후속 업무 이벤트

공통: C.

| 필드 | 타입·null·기본 | 제약·용도 |
| --- | --- | --- |
| name | varchar(80) N | request_submitted / listing_submitted / match_approved / match_responded 등 허용목록 |
| actor_user_id | uuid ? | FK auth.users(id) SET NULL |
| subject_type | varchar(50) N | 허용된 업무 대상 |
| subject_id | uuid ? | 논리 참조, 삭제 시 정리 |
| event_key | uuid N | UNIQUE, 서버 생성 중복 방지 키 |
| trust_level | text N | server / operator; 이 업무 테이블에는 client 권위 이벤트 금지 |
| request_id | uuid N | 서버 추적 |
| props | jsonb N DEFAULT '{}' | 최소 코드값, 원문 개인정보 금지 |
| delete_after | timestamptz ? | D09 |

인덱스 (name,created_at), (subject_type,subject_id). 업무 변경과 이벤트 저장은 원자적 처리. 브라우저 클릭으로 계약·발송 실적을 만들지 않는다. 보안 감사와 목적·열람 권한을 구분한다.

### 4.20 이번 사전에서 활성화하지 않는 테이블

기존 notices, notifications, notification_attempts, access_tokens, job_runs, privacy_requests, otp_challenges, security_rate_limits의 전체 필드 사전을 이번 폼 설계로 확정하지 않는다. 기존 상세설계 6~7장을 참조하되 전화/SMS/공고/링크/자동 작업 정책 재개 시 최신 공식 문서·목적별 제약·개인정보 보관을 검증하고 **이 문서에 해당 사전을 추가**한다. privacy_requests와 영속 요청 제한은 실사용 개인정보 출시 전 구현·검증할 후속 요건이며, 문서상 보류가 삭제 의무나 남용 방어를 생략한다는 의미는 아니다.

## 5. 생성 순서·삭제·상태 불변조건

생성 순서 제안: 기존 auth.users → seekers/providers/admin_memberships → housing_requests/listings → 세 상세·media/reviews → consents → locations/contacts(승인 후) → idempotency/audit → batches → matches → events. 복합 FK 참조 대상의 UNIQUE를 먼저 만든다. 타입·검증 함수·trigger는 의존 순서에 맞춰 migration에 포함한다.

주요 불변조건:

1. 계정당 seeker 최대 1개, seeker당 request 최대 1개. DB 고유 제약으로 동시 제출도 제한.
2. listing 소유자와 provider 소유자 일치. actor와 owner는 대리 입력에서만 다를 수 있으며 현재는 해당 관리자 기능 별도 구현 전 금지.
3. listing별 kind에 맞는 상세 정확히 1개. 생성/삭제 중간 상태는 transaction 밖에 노출되지 않음.
4. broker 매물은 운영자 review 불필요. 거주자 reviewed는 eligible을 뜻하지 않음.
5. 예약 포함 사진 최대 5장. 실패 파일·메타 정리 전 슬롯을 재사용하지 않아 늦은 업로드와 충돌 방지.
6. 동의·조건·권위 이벤트의 다중 변경 원자성. 동의 없이 데이터만 남거나 동의만 남지 않음.
7. 공급자 자격 정지 시 매물 flag만 믿지 않고 후보·승인·조회 API에서 공급자 상태 재검사. 필요 시 관련 매물 block도 함께 처리.

삭제 순서 제안: 접근·예약 중단 → 외부 Storage 파일을 재시도 가능한 절차로 삭제 → 연락처 제거(동의 참조 해제) → 관련 consent 철회/삭제 정책 적용(자기 참조는 철회 행부터) → matches → batches → reviews/media/상세/주소 → listings → requests → providers/seekers → 멱등 기록·연계 로그 정리 → Auth 삭제. FK RESTRICT로 누락을 드러내며 실제 순서는 다른 계정의 제공 동의 등 관련 참조를 모두 조사해 정한다. 파일 삭제 완료 전 재시도에 필요한 경로를 DB에서 지우지 않는다. 계정 삭제 요청의 영속 대장·백업 복구 후 재삭제는 D09/D12와 별도로 구현해야 한다. CASCADE만으로 개인정보 삭제 완료라 보고하지 않는다.

## 6. API·RPC·권한 계약

브라우저 → Next.js Route Handler(인증/입력/CSRF) → 도메인 서비스(상태/소유권) → DB adapter/RPC. 서버 인증은 기존 getUser 기반 검증을 재사용하되 민감 작업의 세션 회수 요건을 점검한다. 현재 쿠키가 있다는 사실이나 raw getSession만으로 사용자 확인 완료라 판단하지 않는다.

| API 설계 예시 | 권한·원자 처리 |
| --- | --- |
| POST /api/housing-requests | 로그인, 기존 신청 중복 검사, seeker+request+consent+멱등 결과 저장 |
| GET /api/me/housing-request | 검증 UUID에 연결된 본인 요청만 조회 |
| PATCH /api/me/housing-request | 소유권+version, 조건 수정·동의 변경 원자 처리 |
| POST /api/me/housing-request/end | 소유권+version, 종료와 후속 안내 제한 |
| POST /api/listings | 로그인, 유형별 입력 및 공급자 자격, 공통+상세+동의+멱등 저장 |
| GET /api/me/listings 및 /[id] | 소유자 필터, 페이지 크기·정렬 허용목록 |
| PATCH /api/me/listings/[id] | 소유권+version, 중요 변경 시 확인/후보 상태 재평가 |
| POST /api/me/listings/[id]/withdraw | 소유권+version, 철회·열람 권한 정리 |
| POST /api/me/listings/[id]/media/reserve | 소유권, row lock, 슬롯 예약 |
| POST /api/me/listings/[id]/media/[mediaId]/complete | 소유권과 객체 연결·실제 파일 검사 후 ready |
| DELETE /api/me/listings/[id]/media/[mediaId] | 소유권, deleting→실제 Storage 삭제→행 정리 |
| POST /api/admin/listings/[id]/reviews | 활성 operator/owner, 비중개사만, version+리뷰/상태 원자 변경 |
| GET /api/me/matches/[id] | 후속: 해당 request 소유자, 유효 안내만, 허용 필드+사진 |

create_housing_request / update_housing_request / create_listing / update_listing / review_listing / reserve_listing_media 등은 **RPC 이름 제안**이며 현재 존재하는 함수가 아니다. 다중 쓰기와 소유권·상태 검사는 transaction 안에서도 다시 수행한다. 서비스 역할 RPC의 actor 인자는 신뢰한 서버가 검증한 UUID이며 브라우저는 직접 실행할 권한이 없어야 한다. actor 인자 자체를 DB가 인증한 사용자로 착각하지 않는다. 범용 테이블명/임의 SQL/무제한 JSON 패치를 받는 RPC는 만들지 않는다.

RLS·grants:

- public 업무 테이블 RLS 활성화, anon/authenticated의 테이블·sequence·함수 권한 제거. 함수 PUBLIC EXECUTE와 실제 생성 역할의 default privileges 조사·제거. server 역할에 필요한 최소 grants만 명시.
- 서비스 키는 RLS 우회 가능. Route Handler와 RPC의 소유권/역할 검사가 신뢰 경계다. 사용자 JWT 클라이언트와 서비스 클라이언트의 세션을 섞지 않는다.
- SECURITY INVOKER 우선. 필요한 DEFINER는 별도 검토, 최소 owner 권한·고정 search_path·호출자 제한·실제 거부 시험. 권한 오류 회피용 DEFINER 금지.
- view도 직접 공개하지 않으며 RLS 우회 여부와 security_invoker 설정 검토. Storage는 별도 서비스이므로 DB grants 차단만으로 보호되지 않는다.
- 비로그인 401, 권한 부족 403, 타인 리소스 존재 은닉 404, version/멱등 충돌 409. 인증 서비스 장애를 잘못된 자격증명과 구분해 일반화된 503 반환.
- PATCH는 소유자/역할/검수 결과/동의 시각/priority_at을 받지 않음. 사용자·운영자·안내 대상별 DTO 허용목록 사용. select('*') 결과 직접 반환 금지.
- 모든 변경 요청 Origin/CSRF 검사. 개인정보 응답 private,no-store. 서버 관리 시간·ID·권한을 신뢰된 값으로 작성. SQL 바인딩과 filter/order allowlist 적용.

| 대상 | 작성자 | 운영자 | 안내받은 신청자 | analyst |
| --- | --- | --- | --- | --- |
| 신청 원본 | 본인만 | 필요한 역할 범위 | 타인 접근 불가 | 불가 |
| 방 등록 원본 | 본인만 | 필요한 역할 범위 | 허용 요약만 | 불가 |
| 내부 확인 메모 | 불가 | operator/owner | 불가 | 불가 |
| 사진 | 본인·ready만 | 필요한 관리 범위 | 유효 안내·ready만 | 불가 |
| 상세 주소/연락처 | 정책 승인 후 본인 범위 | 목적별 최소 범위 | 건별 제공 조건 충족 시 | 불가 |
| 비식별 통계 | 별도 기능 | 허용 범위 | 별도 기능 | 허용, D14 소수셀 정책 필요 |

중개사는 다른 신청자 목록을 직접 조회하지 않는다. 매물 등록 권한과 운영자 권한은 별개다. 민감 조회는 출력 전 권한 확인하며 API 오류에서 타인 데이터나 외부 서비스 오류 원문을 반환하지 않는다.

## 7. 사진 통신과 장애 복구

1. 로그인·소유권 검사 후 listing row lock으로 슬롯 예약. 클라이언트가 정한 Storage 경로를 받지 않는다.
2. 파일 확장자·클라이언트 MIME만 믿지 않고 실제 디코딩/재인코딩, 크기·픽셀·개수 검사. JPEG/WebP 제안, SVG/HTML·실행 파일 거부. EXIF 위치 제거, 인물·연락처·우편물 노출 안내.
3. 서버 경유 업로드 또는 단일 예약 객체에 한정한 서명 업로드를 선택. 후자는 만료 뒤 늦은 업로드·complete 위조·교체 경합을 고려하여 임시 경로를 검증한 뒤 서버 전용 최종 경로로 확정한다. 원본은 최종 사진으로 바로 노출하지 않는다.
4. Storage 성공 후 DB ready 확정 실패, DB reservation 성공 후 업로드 실패를 각각 복구한다. 예약 만료·deleting 상태를 영속적으로 조회해 재시도하며 응답 이후 서버 메모리 실행에 의존하지 않는다.
5. 매칭 화면은 사진마다 매물 연결·ready·match 소유권·현재 접근 가능성을 검사. 랜덤 파일명은 접근 제어를 대신하지 않는다.
6. 짧은 signed URL은 유효기간 동안 보유자가 사용할 수 있는 bearer 링크다. 재공유·즉시 회수 요구가 있으면 서버 프록시로 매 요청 검증. TTL/방식은 결정 필요. 로그·분석에 URL 기록 금지, 원본 공개 버킷 금지.
7. 이미 사용자 기기에 전달된 사진 복사·스크린샷까지 회수할 수 있다고 보장하지 않는다. 개인정보 최소화와 업로드 안내가 필요하다.

## 8. 개인정보·운영 보안·보관

- Auth 이메일을 모든 테이블에 복제하지 않는다. 현재 이름은 선택 별칭 수준, phone/ownerPhone/address 폼 원문은 정책 승인 전 수집하지 않는다. 폼 저장 기능을 구현할 때 보류 입력·체험 OTP UI도 함께 정리한다.
- 현재 폼의 destination은 직장 읍면으로 구조화하고 정확한 직장명은 최소화. vacancy landlordMessage는 최소 상태/요약으로 바꾼다. officePhone/phone, 이메일 알림 채널, 공개 범위 자유문구를 묵시적 연락/제공 권한으로 사용하지 않는다.
- 동의 문구·목적·수신자·기간·철회는 D09 확정 필요. 포괄적인 최초 동의로 연락처를 모든 중개사에게 제공하지 않는다. 주소/전화번호 암호화 범위·키 회전·조회 이력은 활성화 전에 설계한다.
- 보안 주석에는 보호 대상·신뢰 경계·남는 한계 명시. 출력은 textContent/DOM API 우선, 구조 HTML은 공통 sanitizer, 인라인 이벤트 금지 및 script-src-attr 'none' 유지. XSS는 HttpOnly/CSP만으로 해결되지 않음.
- DB Secret/서비스 키는 서버에서만, NEXT_PUBLIC_ 금지. Dev/Preview/Production 분리. 로그·트레이스·오류 수집에서 원문 폼·Cookie·Authorization·연락처·주소·서명 URL 제거.
- 요청량 제한은 계정/IP/전역을 고려한 영속 원자 카운터로 구현할 후속 필수 항목. 사진 총량·반복 예약·무제한 임시 업로드도 제한한다. 구체 한도는 사용자 수·비용 기준으로 확정한다.
- localStorage 합성 체험 자료를 로그인 계정에 자동 이관하지 않는다. 향후 초안은 서버 소유권 기반 저장 설계 후 도입한다.
- 보관/삭제/백업 기간은 미확정. delete_after=NULL은 영구 보관 승인이 아니며 실제 개인정보 출시 전 정책·작업자·복구 실험 필요. 계정 삭제·JWT 만료·세션 회수는 별개로 검증.
- 민감 원문 없는 구조 문서 공개와 실제 개인정보 처리 승인은 별개. 서울 DB 리전만으로 국내 처리 전체를 보장하지 않는다.

## 9. 매칭 연결과 후속 범위

조건: request waiting, 매물 open+eligible, 공급자 자격 유효, 최신 조건 확인, 예산·지역·방 구조·거주 방식·입주 기간 일치. 후보 조회와 승인 직전에 모두 재검사한다. 관리비 NULL을 0으로 더하지 않고 미정 예산/이동/방 조건은 정확 일치라고 판정하지 않는다. 이동 경로 없이 통근 시간을 확정하지 않는다.

최신성 14일 등 기존 기준은 순수 함수·테스트 시계로 검증한다. 공동거주 수락 여부를 임의 추론하지 않으며 현재 거주자 등록은 후보 제외. D03 완화, D04 matched 추가 안내, D05 차수 대기, D06 재등록 순번, D07 만료, D13 구독 유지의 제안을 확정값으로 바꾸지 않는다. 웹 안내에서 문자를 보냈다는 sent_at/delivered_at를 생성하지 않는다.

## 10. 검증·적용 순서

1. 최신 사용자 결정·이 문서·현재 migration/권한/프로젝트 환경을 확인한다. CLI 버전과 --help, 공식 Next/Supabase 문서를 확인한다.
2. schema·grant·trigger·RPC migration을 버전 관리로 작성하고 개발 환경에서 적용한다. 문서의 표를 검증 없이 SQL로 복사하지 않는다.
3. 생성 타입·입력 스키마·API DTO·폼·단위·상태를 함께 연결한다. 실제 Auth UUID로 저장·조회·수정·철회 E2E.
4. 사진 예약/검증/정리, 거주자 운영 확인, 안내 접근 순서로 확장한다.
5. 아래 검증 결과를 이 문서와 security-review에 기록하고 배포 여부를 분리 보고한다.

| ID | 검증 | 완료 기준·기존 인수 연계 |
| --- | --- | --- |
| DB01 | 계정 A/B 소유권, ID 교체, 클라이언트 역할 위조 | 읽기·쓰기·사진 모두 차단. T03 |
| DB02 | anon/authenticated 직접 테이블/RPC/Storage 접근 | grants/RLS 실제 요청 거부. T05 |
| DB03 | 중복 제출·동시 최초 신청·키/내용 불일치 | 1신청·1처리, 충돌 409. T24 |
| DB04 | 상세·동의 저장 강제 실패 | 공통 행 포함 전체 롤백. T01 관련 DB 부분 |
| DB05 | kind mismatch·상세 누락·소유자/provider 불일치 | transaction 커밋 거부 |
| DB06 | 동시 수정·운영 확인과 작성자 수정 경합 | 오래된 version 거부, 확인 버전 명확 |
| DB07 | 사진 병렬 6장·미완료·위조 MIME·초대형 픽셀·업로드/DB 실패 | 슬롯/파일 제한·영속 정리, 원본 비노출 |
| DB08 | 타인 match/media·폐기 안내·서명 링크 만료 | 링크 미발급, 설정한 TTL/프록시 의미 검증 |
| DB09 | 금액 0/NULL·기간·현재 계약/다음 계약·최신성 경계 | 오매칭 없음, 테스트 시계 사용 |
| DB10 | 일반 사용자 검수 API·analyst 원본 접근 | 차단, 관리자 membership 회수 반영 |
| DB11 | 삭제·고아 파일·삭제 중 재접근·백업 복원 | 접근 중단, 파일/DB 정리 및 재삭제. D09/D12 |
| DB12 | 출력·로그·응답의 개인정보/악성 입력 | 필드 허용목록·안전 출력·원문 비기록, T24 |
| DB13 | 차수 동시 승인·최대 인원 | 후속: 1~3명, 중복 열린 차수 없음, 원자 승인 |

테스트는 합성 계정/데이터 사용. mock 통과와 원격 DB 검증을 구분한다. 코드 구현 시 실제 `npm run check`, `npm run test:ci`, `npm run build` 및 DB 권한·동시성·Storage 통합 테스트를 수행한다. 문서만 변경한 이번 작업은 문서 정합성·Git 공개 범위 검사이며 DB01~DB13 통과를 주장하지 않는다.

## 11. 미결정·개선 목록

| 항목 | 상태 | 다음 완료 기준 |
| --- | --- | --- |
| D02 실제 grants·노출 schema·서비스 역할 | 설계 제안/외부 미검증 | 대상 환경 확인, migration 및 직접 접근 시험 |
| 중개사 자격·권한 부여 | 결정 필요 | 승인 책임자·근거·회수 규칙·최초 권한 절차 확정 |
| D09 상세 주소·연락처·동의·보관 | 결정 필요 | 항목·주체·목적·범위·기간·삭제/복구 확정 |
| D10 거주 소유자 | 결정 필요 | 실제 유형과 입력 허용 범위 확정, tenant 위장 금지 |
| 월 고정비·주거 코드·필수 조건 UI | 설계 제안 | 화면/API/DB 의미 일치 및 미정 처리 확인 |
| 사진 최대 바이트·픽셀·TTL·열람 방식 | 결정 필요 | 목표 압축과 실제 보안 상한, bearer 수용/프록시 결정 |
| 멱등 TTL·요청 제한·정리 주기 | 결정 필요 | 비용·개인정보·장애 재시도 기준, 영속 작업 검증 |
| 종료 후 재신청 순번 | D06 보류 | 기존 행 재활성화·priority·동의 규칙 확정 |
| 거주자 후속 인계·매칭 | 사용자 보류 | 현재는 접수·운영 확인만, 전환 절차 추후 |
| 여러 신청서 | 사용자 보류 | UNIQUE 제거뿐 아니라 사람별 중복·차수·순번 재설계 |
| 공고·SMS·링크·자동화 | 보류 | 재개 승인 후 필드 사전·실제 권한·발송/복구 시험 추가 |

## 12. Git 공개 적합성과 변경 기록 규칙

공개 가능 내용: 테이블/필드명·제약·권한 모델·일반 상태·검증 계획·공식 문서 링크. 공개 금지: 실사용 계정·이메일·전화·주소·UUID, 데이터 덤프, 비밀번호/키/토큰/쿠키/해시 원문, 서명 URL·비공개 배포 우회 정보, 운영 로그·개인정보 스크린샷. 연결 프로젝트 식별자도 이 문서에는 불필요하므로 기록하지 않는다.

2026-11-08 최초 공개 검토: 구조·설계 및 미결정 상태만 포함하도록 작성. `.gitignore`의 Markdown 전체 제외를 유지하면서 **이 파일만** `!/docs/database-design.md`로 예외 처리한다. 현재 내용은 GitHub 추적에 적합하며 commit/push는 별도 작업이다. 다른 문서를 자동 공개하지 않는다. 앞으로 실제 데이터를 추가하면 이 판단은 재검토해야 한다.

모든 DB 관련 변경·개선은 이 문서 본문과 아래 이력을 같은 작업에서 갱신한다. 제안/확정/구현/적용/검증을 구분하고 보안 영향은 security-review에도 남긴다. 기록 양식: 날짜, 이유, 상태, 관련 결정, 변경 테이블/API/Storage, migration/코드, 적용 환경, 검증 명령·결과, 잔여 작업. 정책 결정은 로컬 decisions에도 기록하며 이 공개 문서에는 비밀값 없는 결정 요약을 유지한다.

| 날짜 | 변경·근거 | 상태·관련 결정 | 실제 적용·검증·후속 |
| --- | --- | --- | --- |
| 2026-11-08 | 사용자 요청으로 네 폼의 DB 사전·통신·권한·사진·삭제·검증·지속 관리 규칙 최초 작성 | 문서 작성. 1인 1신청/사진 5장/중개사 개별 검수 생략/거주자 운영 확인 확정. 세부 필드는 제안; D01/D02/D06/D09/D10/D11/D12 연계 | 로컬 문서만. migration·코드·원격 DB·배포·발송 없음. Node 문서 검사: 앱 테이블 사전 18개·Markdown 표 열 수·문자 인코딩·민감값 패턴 오류 0. git diff --check 통과, git check-ignore로 이 파일 예외 및 기존 문서/환경파일 제외 유지 확인. DB01~DB13 미실행 |
| 2026-11-08 | 사용자 요청: 방 알림 근무 위치를 읍면·리/마을로 변경, 연락처 입력/체험 확인 보류, 웹 알림함 사용, 중개사무소 입력 보류 | UI 구현, work_village는 DB 필드 제안. D01/D02 관련 | 기존 브라우저 체험 자료에만 저장, DB migration/원격 적용 없음. 자동 매칭·계정별 웹 알림은 미구현. 다른 읍면 리 목록은 추가 확인 필요 |

## 13. 공식 참고 자료

- [Supabase API 보안·grants](https://supabase.com/docs/guides/api/securing-your-api)
- [API 키와 서비스 권한](https://supabase.com/docs/guides/getting-started/api-keys)
- [서버 인증](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Storage 공개/비공개 모델](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [PostgreSQL 제약조건](https://www.postgresql.org/docs/current/ddl-constraints.html)

라이브러리 API·요금·설정은 구현 시 최신 공식 문서와 실제 환경에서 재확인한다. 이 문서의 링크는 특정 원격 설정을 검증했다는 의미가 아니다.
