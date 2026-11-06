/*
 * 파일: public-housing.js
 * 역할: 공공주택과 모집 공고 예시, 필터, 상세 화면, 알림 구독 및 관련 관리 기능을 구현합니다. 실제 청약 신청이나 외부 알림 발송은 하지 않습니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";
// PC 45–55: design fixtures, browser-local subscriptions, no external application or delivery.

/* phTypes, phTargets — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phTypes = ["행복주택", "매입임대", "전세임대", "국민·통합공공임대"],
  phTargets = ["청년", "대학생", "신혼부부", "기타"];

/* phProperties — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phProperties = [
  {
    id: "H-A",
    name: "옥천 청년주택 A",
    type: "행복주택",
    region: "옥천읍",
    areas: ["옥천군"],
    targets: ["청년", "대학생"],
    location: "충청북도 옥천군 옥천읍 · 상세 주소 확인 필요",
    size: "전용 26㎡·36㎡",
    description: "옥천에서 생활을 시작하는 청년을 위한 독립 주거 공간입니다.",
    x: 48,
    y: 48,
  },
  {
    id: "H-B",
    name: "옥천 행복주택 B",
    type: "행복주택",
    region: "군북면",
    areas: ["옥천군"],
    targets: ["청년", "신혼부부"],
    location: "충청북도 옥천군 군북면 · 상세 주소 확인 필요",
    size: "세부 공급 면적 확인 필요",
    description: "지난 모집 이력과 다음 기회를 함께 살펴볼 수 있는 주택입니다.",
    x: 60,
    y: 35,
  },
  {
    id: "H-C",
    name: "충북 청년 매입임대",
    type: "매입임대",
    region: "옥천군 포함",
    areas: ["옥천군", "영동군"],
    targets: ["청년", "대학생"],
    location: "지역 단위 사업 · 개별 주택은 공급 목록 확인",
    size: "주택별 상이",
    description:
      "여러 주택을 대상으로 모집하는 지역 단위 사업입니다. 공급 목록과 예비 순번에 따라 입주 안내가 달라집니다.",
    x: 48,
    y: 48,
  },
  {
    id: "H-D",
    name: "대전 청년 전세임대",
    type: "전세임대",
    region: "대전광역시",
    areas: ["대전광역시"],
    targets: ["청년"],
    location: "선택한 지역의 공급 조건 확인",
    size: "선택 주택별 상이",
    description: "직접 선택한 주변 지역의 모집도 함께 살펴볼 수 있습니다.",
    x: 50,
    y: 50,
  },
];

/* phNotices — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phNotices = [
  {
    id: "PH-A-2026-02",
    propertyId: "H-A",
    round: "2026년 2차 청년 일반 모집",
    posted: "2026-10-20",
    checked: "2026-10-29T09:00:00+09:00",
    sourceURL: "",
    applyURL: "",
    agency: "공급기관 확인 필요",
    version: 1,
    reviewState: "공개",
    move: "2027년 2월 예정 · 변경 가능",
    cost: "보증금 2,000만 원 / 월 임대료 12만 원 · 전환 조건 별도",
    size: "전용 26㎡ / 12호",
    extra: "관리비 금액 미공개 · 공과금 사용량에 따라 별도",
    groups: [
      {
        id: "youth",
        target: "청년",
        label: "청년 · 일반 공급",
        start: "2026-10-26T10:00:00+09:00",
        end: "2026-11-06T17:00:00+09:00",
        reserve: false,
      },
      {
        id: "student",
        target: "대학생",
        label: "대학생 · 우선 공급",
        start: "2026-10-22T10:00:00+09:00",
        end: "2026-10-25T17:00:00+09:00",
        reserve: false,
      },
    ],
    documents:
      "주민등록 관련 서류, 가족·혼인관계 관련 서류, 소득·자산 확인 및 동의 서류. 대상별 제출 목록과 발급 기준일 확인.",
    schedule: [
      ["서류 대상자 발표", "2026.11.12 17:00"],
      ["서류 제출", "2026.11.13 ~ 11.19"],
      ["당첨자 발표", "2027.01.15 예정 · 계약 일정 추후 안내"],
    ],
  },
  {
    id: "PH-C-2026-03",
    propertyId: "H-C",
    round: "2026년 3차 예비입주자 모집",
    posted: "2026-10-26",
    checked: "2026-10-29T09:00:00+09:00",
    sourceURL: "",
    applyURL: "",
    agency: "공급기관 확인 필요",
    version: 1,
    reviewState: "공개",
    move: "공실 발생과 예비 순번에 따라 안내",
    cost: "주택별 상이 · 공급 목록 확인",
    size: "공급 목록의 주택별 면적 확인",
    extra: "관리비·공과금 주택별 확인",
    groups: [
      {
        id: "youth",
        target: "청년",
        label: "청년 · 예비입주자",
        start: "2026-11-02T10:00:00+09:00",
        end: "2026-11-09T17:00:00+09:00",
        reserve: true,
      },
      {
        id: "student",
        target: "대학생",
        label: "대학생 · 우선 순위",
        start: "2026-11-02T10:00:00+09:00",
        end: "2026-11-03T17:00:00+09:00",
        reserve: true,
      },
    ],
    documents:
      "순위별 자격 증빙, 주민등록 관련 서류, 소득·자산 관련 자료는 공고 목록을 확인해주세요.",
    schedule: [
      ["서류·결과 발표", "공고의 순위별 일정 확인"],
      ["입주 안내", "공실·예비 순번에 따라 별도 안내"],
    ],
  },
  {
    id: "PH-A-2026-01",
    propertyId: "H-A",
    round: "2026년 1차 모집",
    posted: "2026-04-01",
    checked: "2026-10-29T09:00:00+09:00",
    sourceURL: "",
    applyURL: "",
    agency: "공급기관 확인 필요",
    version: 1,
    reviewState: "공개",
    move: "종료된 모집",
    cost: "지난 모집 조건 · 다음 모집에 적용하지 않음",
    size: "과거 공급 목록",
    extra: "이번 모집 원문 기준",
    groups: [
      {
        id: "youth",
        target: "청년",
        label: "청년 · 일반 공급",
        start: "2026-04-06T10:00:00+09:00",
        end: "2026-04-17T17:00:00+09:00",
        reserve: false,
      },
    ],
    documents: "지난 공고의 제출 목록",
    schedule: [],
  },
  {
    id: "PH-B-2026-01",
    propertyId: "H-B",
    round: "2026년 1차 모집",
    posted: "2026-08-20",
    checked: "2026-10-29T09:00:00+09:00",
    sourceURL: "",
    applyURL: "",
    agency: "공급기관 확인 필요",
    version: 1,
    reviewState: "공개",
    move: "지난 모집",
    cost: "지난 모집 조건은 새 공고에서 재확인",
    size: "공급 목록 확인",
    extra: "확인 필요",
    groups: [
      {
        id: "youth",
        target: "청년",
        label: "청년 · 일반 공급",
        start: "2026-09-01T10:00:00+09:00",
        end: "2026-09-11T17:00:00+09:00",
        reserve: false,
      },
    ],
    documents: "지난 공고 확인",
    schedule: [],
  },
];

/* phState — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let phState = read("public-housing", {
  interests: [],
  subscriptions: [],
  records: {},
  seen: [],
  overrides: {},
  logs: [],
});

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
phState = {
  interests: [],
  subscriptions: [],
  records: {},
  seen: [],
  overrides: {},
  logs: [],
  ...phState,
};

/* phFilter — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let phFilter = {
  region: "옥천군",
  nearby: [],
  type: "전체",
  target: "전체",
  status: "전체",
  query: "",
  view: "notices",
  sort: "마감 가까운 순",
  ...read("public-filter", {}),
};

/* phProperty — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phProperty = (id) => phProperties.find((p) => p.id === id);

/* phNotice — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phNotice = (id) => {
  const n = phNotices.find((n) => n.id === id);
  return n ? { ...n, ...phState.overrides[id] } : null;
};

/* phGroup — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phGroup = (n, id) => n.groups.find((g) => g.id === id) || n.groups[0];

/* phSafeURL — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phSafeURL = (url) => (/^https?:\/\//i.test(url || "") ? url : "");

/* phTime — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phTime = (value) =>
  value
    ? new Date(value).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "미정";

/* phLocal — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phLocal = (value) =>
  value
    ? new Date(value)
        .toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })
        .slice(0, 16)
        .replace(" ", "T")
    : "";

/* phISO — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phISO = (value) =>
  value ? new Date(value.length === 16 ? value + ":00+09:00" : value).toISOString() : null;

/* phStatus — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function phStatus(n, g = n?.groups[0], now = Date.now()) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!n || !g)
    return "현재 모집 없음";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    n.reviewState === "취소"
  )
    return "취소";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    ["초안", "검수 대기"].includes(n.reviewState)
  )
    return "미공개";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    now < Date.parse(g.start)
  )
    return "접수 예정";
  if (now >= Date.parse(g.end)) return "접수 종료";
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return "접수 중";
}

/* phCommit — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function phCommit(change) {
  const next = structuredClone(phState);
  change(next);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !save("public-housing", next)
  )
    return false;
  phState = next;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return true;
}

/* phCurrent — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function phCurrent(propertyId) {
  return phNotices
    .map((n) => phNotice(n.id))
    .filter((n) => n.propertyId === propertyId && !["초안", "검수 대기"].includes(n.reviewState))
    .sort((a, b) => Date.parse(b.posted) - Date.parse(a.posted));
}

/* phMatches — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function phMatches(p, filter = phFilter) {
  return (
    (filter.region === "옥천군"
      ? p.areas.includes("옥천군")
      : p.region === filter.region || p.areas.includes(filter.region)) ||
    filter.nearby?.some((r) => p.areas.includes(r))
  );
}

/* phFiltered — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
function phFiltered() {
  return phProperties.filter(
    (p) =>
      phMatches(p) &&
      (phFilter.type === "전체" || p.type === phFilter.type) &&
      (phFilter.target === "전체" || p.targets.includes(phFilter.target)) &&
      (!phFilter.query || (p.name + p.region + p.type).includes(phFilter.query)),
  );
}

/* phFilteredNotices — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phFilteredNotices() {
  const ids = new Set(phFiltered().map((p) => p.id)),
    targetGroups = (n) =>
      n.groups.filter((g) => phFilter.target === "전체" || g.target === phFilter.target);
  const list = phNotices
    .map((n) => phNotice(n.id))
    .filter(
      (n) =>
        ids.has(n.propertyId) &&
        !["초안", "검수 대기"].includes(n.reviewState) &&
        targetGroups(n).some(
          (g) => phFilter.status === "전체" || phStatus(n, g) === phFilter.status,
        ),
    );
  const rank = (n) =>
    Math.min(
      ...targetGroups(n).map(
        (g) => ({ "접수 중": 0, "접수 예정": 1, "접수 종료": 2, "취소": 3 })[phStatus(n, g)] ?? 4,
      ),
    );
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return list.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (phFilter.sort === "최근 공고 순"
        ? Date.parse(b.posted) - Date.parse(a.posted)
        : Date.parse(targetGroups(a)[0].end) - Date.parse(targetGroups(b)[0].end)),
  );
}

/* phFilterChange — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function phFilterChange(key, value) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    key === "view" &&
    location.hash.startsWith("#/public/list/properties")
  )
    history.replaceState(null, "", "#/public/list");
  phFilter = { ...phFilter, [key]: value };
  save("public-filter", phFilter);
  render(false);
}

/* phFilterSearch — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
function phFilterSearch(e) {
  e.preventDefault();
  phFilterChange("query", e.target.elements.query.value.trim());
}

/* phNoticeCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phNoticeCard(n) {
  const p = phProperty(n.propertyId),
    g =
      n.groups.find((g) => phFilter.target === "전체" || g.target === phFilter.target) ||
      n.groups[0],
    status = phStatus(n, g);
  return `<article class="ph-card"><div class="application-top"><span class="badge ${status === "접수 중" ? "" : "orange"}">${esc(status)}</span><span class="micro">${esc(p.type)} · ${esc(g.target)}</span></div><h3>[예시] ${esc(p.name)}</h3><p>${esc(n.round)} · ${esc(p.region)}</p><p class="micro">${phTime(g.start)} ~ ${phTime(g.end)} (한국시간)</p><p>${esc(n.cost)}</p><p class="micro">${g.reserve ? "예비입주자 모집 · 선정 후 즉시 입주가 아닙니다." : esc(n.size)} · ${n.reviewState === "확인 필요" ? "원문 재확인 필요" : "원문 연결 전"}</p><div class="actions"><a class="btn small" href="#/public/notice/${n.id}/${g.id}">이번 모집 자세히 보기 →</a>${status === "접수 예정" ? `<a class="textlink" href="#/public/subscribe/schedule/${n.id}/${g.id}">접수 시작 알림</a>` : ""}</div></article>`;
}

/* phPropertyCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phPropertyCard(p) {
  const rounds = phCurrent(p.id),
    current = rounds.filter((n) =>
      n.groups.some((g) => ["접수 예정", "접수 중"].includes(phStatus(n, g))),
    );
  return `<article class="ph-card"><span class="badge">${esc(p.type)}</span><h3>[예시] ${esc(p.name)}</h3><p>${esc(p.region)} · ${esc(p.targets.join(" · "))}</p><p class="subtle">${current.length ? "현재 모집 " + current.length + "건" : "현재 모집 없음 · 다음 일정 미정"}</p><div class="actions"><a class="btn secondary small" href="#/public/property/${p.id}">주택·사업 정보 →</a><a class="textlink" href="#/public/subscribe/property/${p.id}">다음 모집 알림</a></div></article>`;
}

/* phHome — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phHome() {
  const cards = phFilteredNotices()
    .filter((n) => n.groups.some((g) => ["접수 예정", "접수 중"].includes(phStatus(n, g))))
    .slice(0, 2);
  return `<div class="container public-page">${pageHead("PUBLIC HOUSING", "공공주택, 지금의 모집과 다음 기회를 함께", "행복주택·매입임대·전세임대 등 필요한 정보를 살펴보고, 원하는 모집 소식을 받아보세요.")}<div class="ph-interest-strip"><div><b>관심 지역 · ${esc(phFilter.region)}</b><p class="micro">${phFilter.nearby.length ? "추가 지역: " + esc(phFilter.nearby.join(", ")) : "주변 지역은 직접 추가한 경우에만 포함해요."}</p></div><div class="actions"><a class="btn secondary small" href="#/public/list">지역·조건 바꾸기</a><a class="textlink" href="#/activity/public">내 공공주택 →</a></div></div><section class="section"><div class="section-head"><h2>지금의 모집과 다가오는 기회</h2><a class="textlink" href="#/public/list">모집 공고 전체 보기 →</a></div><div class="two-grid">${cards.map(phNoticeCard).join("") || emptyState("현재 모집 중인 공고가 없어요.", "다음 모집 또는 조건 알림을 등록해보세요.")}</div></section><section class="section"><h2>모집이 없어도, 다음 소식을 기다릴 수 있어요</h2><div class="two-grid"><div class="soft-card"><span class="section-kicker">NEXT OPPORTUNITY</span><h3>원하는 주택이 있나요?</h3><p>관심 주택·사업에 새 모집이 확인되면 알려드려요.</p><a class="btn secondary" href="#/public/list/properties">주택·사업 둘러보기 →</a></div><div class="soft-card"><span class="section-kicker">YOUR CONDITIONS</span><h3>조건에 맞는 새 공고를 찾나요?</h3><p>지역·주택 유형·신청 대상을 나누어 선택하세요.</p><a class="btn" href="#/public/subscribe/conditions">조건으로 모집 알림 받기 →</a></div></div></section><section class="section"><h2>처음 알아보는 공공주택</h2><div class="grid3">${[
    ["주택 유형과 신청 대상", "행복주택·매입임대는 유형, 청년·신혼부부는 신청 대상이에요."],
    ["모집 일정과 신청 조건", "같은 주택도 회차마다 대상·비용·일정이 달라질 수 있어요."],
    ["청약은 공식 접수처에서", "옥키의 관심 등록과 알림 신청은 청약 접수가 아니에요."],
  ]
    .map(([t, d]) => `<div class="ph-guide"><h3>${t}</h3><p>${d}</p></div>`)
    .join(
      "",
    )}</div><div class="notice">예비입주자 선정 후에도 공실과 순번에 따라 입주 시점이 달라져요. 개별 공고의 입주 조건을 확인하세요.</div></section>${phDemo()}<div class="actions section"><a class="btn secondary" href="#/wait">곧 나올 일반 방 알림 받기</a><a class="textlink" href="#/area">우리 동네 생활정보 보기 →</a></div></div>`;
}

/* phDemo — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phDemo() {
  return '<p class="micro ph-demo">현재 주택·공고·금액·일정은 화면 설계용입니다. 공식 공고 연결·실제 청약 접수·문자 및 이메일 발송은 제공하지 않습니다.</p>';
}

/* phList — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phList(view) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (view === "properties")
    phFilter.view = "properties";
  const properties = phFiltered(),
    notices = phFilteredNotices();
  return `<div class="container public-page">${pageHead("FIND PUBLIC HOUSING", "내게 필요한 공공주택을 찾아요.", "지역과 주택 유형, 신청 대상을 각각 골라보세요.")}<a class="textlink" href="#/public">← 공공주택 홈</a><div class="ph-filterbox"><div class="fields">${selectField("관심 지역", "ph-region", ["옥천군", ...regions], phFilter.region)}${selectField("주택 유형", "ph-type", ["전체", ...phTypes], phFilter.type)}${selectField("신청 대상", "ph-target", ["전체", ...phTargets], phFilter.target)}${selectField("모집 상태", "ph-status", ["전체", "접수 중", "접수 예정", "접수 종료", "취소", "현재 모집 없음"], phFilter.status)}</div><form role="search" onsubmit="phFilterSearch(event)"><input name="query" aria-label="공공주택 이름 또는 지역 검색" value="${esc(phFilter.query)}" placeholder="주택·사업명 또는 지역 검색"><button class="btn small">검색</button></form><details><summary>주변 지역 추가 · 직접 선택한 지역만 포함</summary><div class="actions">${["영동군", "대전광역시"].map((r) => `<label class="check"><input type="checkbox" ${phFilter.nearby.includes(r) ? "checked" : ""} onchange="phFilterChange('nearby',this.checked?[...phFilter.nearby,'${r}']:phFilter.nearby.filter(x=>x!=='${r}'))">${r}</label>`).join("")}</div></details><a class="textlink" href="#/public/subscribe/conditions">이 조건으로 새 공고 알림 받기 →</a></div><div class="tabs"><button class="tab ${phFilter.view === "notices" ? "active" : ""}" onclick="phFilterChange('view','notices')">전체 모집 공고</button><button class="tab ${phFilter.view === "properties" ? "active" : ""}" onclick="phFilterChange('view','properties')">주택·사업별 보기</button></div><div class="section-head"><h2>${phFilter.view === "properties" ? "주택·사업 " + properties.length + "곳" : "모집 공고 " + notices.length + "건"}</h2><select aria-label="공고 정렬" onchange="phFilterChange('sort',this.value)">${options(["마감 가까운 순", "최근 공고 순"], phFilter.sort)}</select></div><div class="two-grid">${
    phFilter.view === "properties" || phFilter.status === "현재 모집 없음"
      ? properties
          .filter(
            (p) =>
              phFilter.status !== "현재 모집 없음" ||
              !phCurrent(p.id).some((n) =>
                n.groups.some((g) => ["접수 예정", "접수 중"].includes(phStatus(n, g))),
              ),
          )
          .map(phPropertyCard)
          .join("") || emptyState("이 조건의 주택·사업이 없어요.")
      : notices.map(phNoticeCard).join("") ||
        emptyState(
          "이 조건의 모집 공고가 없어요.",
          "지역·유형·신청 대상을 바꾸거나 새 공고 알림을 등록해주세요.",
        )
  }</div>${phDemo()}</div>`;
}

/* phListEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function phListEvents() {
  for (const [id, key] of [
    ["ph-region", "region"],
    ["ph-type", "type"],
    ["ph-target", "target"],
    ["ph-status", "status"],
  ]) {
    const e = $('[name="' + id + '"]');
    if (e) e.onchange = () => phFilterChange(key, e.value);
  }
}

/* phToggleInterest — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function phToggleInterest(id) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!phProperty(id))
    return;
  const on = phState.interests.includes(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    phCommit((s) => {
      s.interests = on ? s.interests.filter((x) => x !== id) : [id, ...s.interests];
      if (on)
        s.subscriptions = s.subscriptions.map((x) =>
          x.kind === "property" && x.entity === id ? { ...x, active: false } : x,
        );
    })
  ) {
    toast(
      on
        ? "관심에서 해제하고 다음 모집 알림을 중단했어요. 청약 기록은 유지해요."
        : "관심 주택에 담았어요. 알림은 따로 신청해주세요.",
    );
    render(false);
  }
}

/* phPropertyPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phPropertyPage(id) {
  const p = phProperty(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p)
    return unavailable();
  const rounds = phCurrent(id);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container public-page">${pageHead("PUBLIC HOUSING / PROPERTY", "[예시] " + p.name, p.type + " · " + p.region + " · 주택 정보와 모집 회차를 나누어 확인하세요.")}<div class="ph-property-hero"><div class="ph-architecture">${village()}<span>단지 사진·배치도 연결 전</span></div><div class="soft-card"><span class="badge">${esc(p.type)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="actions"><button class="btn secondary" onclick="phToggleInterest('${id}')">${phState.interests.includes(id) ? "✓ 관심 주택 · 해제" : "관심 주택에 담기"}</button><a class="btn" href="#/public/subscribe/property/${id}">이 주택의 다음 모집 알림</a></div><p class="micro">다음 모집 일정은 아직 미정이에요. 현재 모집의 마감 알림은 따로 신청해주세요.</p></div></div><section class="section"><h2>주택·사업 기본 정보</h2><dl class="consultation-answer-list">${[
    ["위치", p.location],
    ["주택 유형", p.type],
    ["면적·주거 형태", p.size],
    ["비용 안내", "모집 회차·면적·대상별로 다르므로 이번 공고의 비용 확인"],
    ["공식 정보", "공급기관 단지 안내 연결 전 · 확인 필요"],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join(
      "",
    )}</dl></section><section class="section"><h2>이번 모집과 지난 모집</h2>${rounds.length ? rounds.map(phNoticeCard).join("") : emptyState("현재 모집 없음", "다음 모집 일정 미정 · 관심 주택으로 저장하고 다음 공고 알림을 받아보세요.")}</section><section class="two-grid section"><a class="soft-card" href="#/public/map/${id}"><h3>이 주택 주변에서 생활한다면</h3><p>분리수거·교통·공공시설과 생활 공지를 살펴보세요.</p><span class="textlink">주변 생활권 지도 보기 →</span></a><button class="soft-card ph-button-card" onclick="phCommunity('${id}')"><h3>이 동네에 살고 있는 이웃에게</h3><p>선택한 동네의 통근·생활 여건을 물어보세요.</p><span class="textlink">동네 질문·답변 보기 →</span></button></section><a class="textlink" href="#/public/list/properties">← 주택·사업 목록</a>${phDemo()}</div>`;
}

/* phNoticePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phNoticePage(id, groupId) {
  const n = phNotice(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !n ||
    ["초안", "검수 대기"].includes(n.reviewState)
  )
    return unavailable();
  const p = phProperty(n.propertyId),
    g = phGroup(n, groupId),
    status = phStatus(n, g);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container public-page">${pageHead("PUBLIC HOUSING / RECRUITMENT", "[예시] " + p.name + " · " + n.round, status + " · " + g.label + " · 공고 " + n.id)}<div class="ph-interest-strip"><div><span class="badge">${status}</span><h2>${status === "접수 예정" ? "접수 시작 " + phTime(g.start) : "접수 마감 " + phTime(g.end)}</h2><p class="micro">${esc(g.label)} · 모든 마감 시각은 한국시간 기준</p></div><button class="btn" ${status !== "접수 중" || !phSafeURL(n.applyURL) ? "disabled" : ""} onclick="phOpenOfficial('${id}','${g.id}')">공식 청약 신청하기 ↗</button></div><label class="ph-group-label">내가 확인할 신청 대상<select aria-label="모집 신청 대상·순위" onchange="location.hash='#/public/notice/${id}/'+this.value">${n.groups.map((x) => `<option value="${x.id}" ${x.id === g.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>${n.reviewState === "확인 필요" ? '<div class="notice warning">원문을 재확인하고 있어요. 마지막 확인 시각과 공식 공고를 먼저 확인해주세요.</div>' : ""}${status === "취소" ? '<div class="notice warning">취소된 모집입니다. 청약 신청과 시작·마감 알림은 제공하지 않습니다.</div>' : ""}<section class="section"><h2>선택한 대상 · 공급 조건</h2><dl class="consultation-answer-list">${[
    [
      "지역·모집 종류",
      p.region + " / " + p.type + " / " + (g.reserve ? "예비입주자 모집" : "일반 모집"),
    ],
    ["공급 면적·호수", n.size],
    ["보증금·월 임대료", n.cost],
    ["관리비·추가 비용", n.extra],
    ["입주 예정", n.move],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join(
      "",
    )}</dl><div class="notice">나이·혼인 여부, 무주택 여부, 소득·자산, 지역·거주 요건과 중복 신청 제한을 이번 공고 기준으로 확인하세요. 관심 대상 선택이나 알림 신청으로 자격이 확정되지는 않습니다.</div></section><section class="section"><h2>모집 일정</h2><dl class="consultation-answer-list">${[["공고 게시", n.posted], ["선택 대상의 접수 기간", phTime(g.start) + " ~ " + phTime(g.end)], ...n.schedule].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><h3>준비할 서류</h3><p>${esc(n.documents)}</p><p class="micro">신청 단계와 대상자 선정 후 제출할 서류, 발급 기준일·유효기간을 구분해 확인하세요.</p></section>${["접수 종료", "취소"].includes(status) ? `<div class="notice">이번 모집은 접수할 수 없어요. <a class="textlink" href="#/public/subscribe/property/${p.id}">이 주택의 다음 모집 알림 받기 →</a></div>` : ""}<section class="formbox"><h2>공식 접수처에서 신청해요</h2><p>옥키의 알림 신청은 청약 접수가 아니에요. 외부 접수처에 다녀와도 신청 기록이 자동으로 바뀌지 않습니다.</p><div class="actions"><button class="btn" ${status !== "접수 중" || !phSafeURL(n.applyURL) ? "disabled" : ""} onclick="phOpenOfficial('${id}','${g.id}')">공식 청약 신청하기 ↗</button><a class="btn secondary" href="#/public/subscribe/schedule/${id}/${g.id}">이 공고의 일정 알림 받기</a><a class="textlink" href="#/activity/public/${id}">신청했어요 · 본인 기록 →</a></div>${!n.applyURL ? '<p class="micro">공식 접수처 링크 연결 전 · 현재는 실제 신청할 수 없습니다.</p>' : ""}</section><section class="section"><h2>출처·변경 내역</h2><p>공급기관: ${esc(n.agency)} / 공고 ID: ${esc(n.id)} / 버전 ${n.version}</p><p class="micro">게시 ${esc(n.posted)} · 최종 확인 ${phTime(n.checked)}</p>${phSafeURL(n.sourceURL) ? `<a class="textlink" href="${esc(n.sourceURL)}" target="_blank" rel="noopener">공식 공고문·첨부파일 확인 ↗</a>` : '<p class="micro">공식 원문·첨부파일 연결 전 · 기관·문의처 확인 필요</p>'}${(n.changes || []).map((c) => `<div class="notice"><b>${phTime(c.at)} · ${esc(c.reason)}</b><p class="micro">${esc(c.before)} → ${esc(c.after)}</p></div>`).join("") || '<p class="micro">변경 내역 없음</p>'}</section><div class="actions section"><a class="btn secondary" href="#/public/property/${p.id}">주택 정보 보기</a><a class="textlink" href="#/public/map/${p.id}">주변 생활권 지도 →</a><a class="textlink" href="#/public/list">모집 공고 목록 →</a></div>${phDemo()}</div>`;
}

/* phOpenOfficial — 선택한 대상의 이동 경로나 열기 동작을 처리합니다. */
function phOpenOfficial(id, group) {
  const n = phNotice(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !n ||
    phStatus(n, phGroup(n, group)) !== "접수 중" ||
    !phSafeURL(n.applyURL)
  )
    return toast("공식 접수처 연결 상태와 모집 기간을 확인해주세요.");
  window.open(phSafeURL(n.applyURL), "_blank", "noopener");
}

/* phCommunity — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phCommunity(id) {
  const p = phProperty(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p) return;
  neighborhood = { region: regions.includes(p.region) ? p.region : "", village: "" };
  save("neighborhood", neighborhood);
  location.hash = "#/questions";
}

/* phKindLabel — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phKindLabel = {
  property: "주택·사업의 다음 모집",
  conditions: "조건에 맞는 새 공고",
  schedule: "이번 공고의 일정",
};

/* phSubscriptionKey — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function phSubscriptionKey(d) {
  return d.kind === "conditions"
    ? "conditions/" +
        JSON.stringify([d.regions.slice().sort(), d.types.slice().sort(), d.targets.slice().sort()])
    : d.kind + "/" + d.entity + (d.kind === "schedule" ? "/" + d.group : "");
}

/* phQuietShift — 방해금지 시간 설정을 고려해 알림 시각을 조정합니다. */
function phQuietShift(iso, start, end) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !start ||
    !end ||
    start === end
  )
    return iso;
  const local = phLocal(iso),
    hm = local.slice(11, 16),
    night = start > end,
    inQuiet = night ? hm >= start || hm < end : hm >= start && hm < end;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!inQuiet) return iso;
  let day = local.slice(0, 10);
  if (night && hm >= start)
    day = new Date(Date.parse(day + "T12:00:00+09:00") + 86400000).toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return phISO(day + "T" + end);
}

/* phDeadlineTime — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phDeadlineTime(g, mode, custom) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (mode === "직접 선택")
    return phISO(custom);
  const day = new Date(
    Date.parse(g.end) - (mode === "1일 전 09:00" ? 1 : 3) * 86400000,
  ).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  return phISO(day + "T09:00");
}

/* phSubDefaults — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function phSubDefaults(kind, entity, group, id) {
  const existing =
    phState.subscriptions.find((s) => s.id === id) ||
    (kind !== "conditions"
      ? phState.subscriptions.find(
          (s) =>
            s.kind === kind &&
            s.entity === entity &&
            (kind !== "schedule" || s.group === (group || "youth")),
        )
      : null);
  const wait = applications.find((a) => a.kind === "waiting")?.data || {};
  return {
    kind,
    entity,
    group: group || "youth",
    regions: [phFilter.region, ...phFilter.nearby],
    types: phFilter.type === "전체" ? ["전체"] : [phFilter.type],
    targets: phFilter.target === "전체" ? ["전체"] : [phFilter.target],
    channel: "옥키 알림함만",
    phone: wait.phone || "",
    email: wait.email || "",
    quietStart: "22:00",
    quietEnd: "08:00",
    newNotice: true,
    start: true,
    deadline: true,
    changes: true,
    reminder: "3일 전 09:00",
    ...existing,
  };
}

/* phScheduleFields — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phScheduleFields(n, d) {
  d = { reminder: "3일 전 09:00", ...d };
  const g = phGroup(n, d.group),
    status = phStatus(n, g),
    now = Date.now(),
    canStart = status === "접수 예정",
    canDeadline = ["접수 중", "접수 예정"].includes(status);
  return `<div class="notice"><b>${esc(g.label)} · ${status}</b><p class="micro">${phTime(g.start)} ~ ${phTime(g.end)} (한국시간)</p></div>${checkField("start", "접수 시작 알림 받기", canStart && d.start).replace('name="start"', 'name="start" ' + (!canStart ? "disabled" : ""))}${!canStart ? '<p class="micro">이미 시작했거나 종료·취소된 공고의 시작 알림은 선택할 수 없어요.</p>' : ""}${checkField("deadline", "접수 마감 전 알림 받기", canDeadline && d.deadline).replace('name="deadline"', 'name="deadline" ' + (!canDeadline ? "disabled" : ""))}<div class="fields">${selectField("마감 전 알림 시점", "reminder", ["3일 전 09:00", "1일 전 09:00", "직접 선택"], d.reminder)}${inputField("직접 선택한 시각 · 한국시간", "customTime", d.customTime || "", 'type="datetime-local"')}</div><p class="micro" id="public-reminder-time"></p>${checkField("changes", "이 공고의 일정·조건 변경 또는 취소 알림 받기", d.changes)}`;
}

/* phSubscribePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phSubscribePage(kind = "conditions", entity = "", group = "", edit = "") {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!phKindLabel[kind])
    return unavailable();
  const d = phSubDefaults(kind, entity, group, edit),
    n = kind === "schedule" ? phNotice(entity) : null;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    kind === "property" &&
    !phProperty(entity)
  )
    return unavailable();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    kind === "schedule" &&
    !n
  )
    return unavailable();
  const property = phProperty(kind === "property" ? entity : n?.propertyId);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container public-page">${pageHead("PUBLIC HOUSING ALERT", kind === "property" ? "이 주택의 다음 모집을 알려드려요." : kind === "schedule" ? "이 공고의 일정을 챙겨드려요." : "내 조건에 맞는 새 공고를 알려드려요.", "알림은 실제 청약 접수와 별개입니다. 받을 소식과 연락 방법을 직접 선택해주세요.")}<div class="tabs">${Object.entries(
    phKindLabel,
  )
    .map(
      ([k, l]) =>
        `<a class="tab ${k === kind ? "active" : ""}" href="#/public/${k === "conditions" ? "subscribe/conditions" : k === "property" ? "list/properties" : "list"}">${l}</a>`,
    )
    .join(
      "",
    )}</div><div class="form-layout"><aside class="form-aside"><b>공공주택 알림</b><p>01 관심 정보<br>02 받을 소식<br>03 연락처·동의</p><div class="notice">기존 연락처를 불러와도 공공주택 알림 동의는 따로 선택해요.</div></aside><form id="public-subscription-form">${box("01", "관심 정보", kind === "conditions" ? `<div class="fields">${field("관심 지역 * · 복수 선택", choice("regions", ["옥천군", ...regions, "영동군", "대전광역시"], d.regions, true), true)}${field("주택 유형 *", choice("types", ["전체", ...phTypes], d.types, true), true)}${field("신청 대상 *", choice("targets", ["전체", ...phTargets], d.targets, true), true)}</div><p class="micro">주변 지역은 직접 선택한 경우에만 포함합니다. 관심 조건 일치는 신청 자격 판정이 아닙니다.</p>` : `<h3>${esc(property.name)}</h3><p>${kind === "property" ? "다음 모집 일정은 아직 미정입니다. 현재 공고의 마감 알림과 구분해요." : esc(n.round)}</p>${kind === "schedule" ? `<label>내가 확인할 신청 대상<select name="group" aria-label="일정 알림의 신청 대상">${n.groups.map((g) => `<option value="${g.id}" ${g.id === d.group ? "selected" : ""}>${esc(g.label)}</option>`).join("")}</select></label>` : ""}<a class="textlink" href="#/public/list">다른 주택·공고 선택 →</a>`)}${box("02", "받을 소식", kind === "schedule" ? `<div id="public-schedule-fields">${phScheduleFields(n, d)}</div>` : checkField("newNotice", kind === "property" ? "이 주택·사업의 다음 모집 공고가 확인되면 알림 받기" : "선택한 지역·유형·대상에 맞는 새 공고 알림 받기", d.newNotice))}${box("03", "어디로 받을까요?", `<div class="fields">${selectField("알림 수단 *", "channel", ["옥키 알림함만", "문자 + 옥키 알림함", "이메일 + 옥키 알림함"], d.channel, true)}<div data-ph-phone>${inputField("휴대전화 · 체험용", "phone", d.phone, 'type="tel" pattern="0[0-9-]{8,14}"')}${verifyUI("phone")}</div><div data-ph-email>${inputField("이메일 · 체험용", "email", d.email, 'type="email"')}${verifyUI("email")}</div>${inputField("받지 않을 시간 시작 (선택)", "quietStart", d.quietStart, 'type="time"')}${inputField("받지 않을 시간 종료 (선택)", "quietEnd", d.quietEnd, 'type="time"')}</div><p class="micro">수신 제외 시간 이후로 밀리는 알림이 청약 마감 이후가 되면 등록할 수 없어요.</p>${checkField("privacy", "[필수] 공공주택 알림을 위한 정보 수집·이용에 동의합니다.", false, true)}${checkField("externalConsent", "[외부 수신 시 필수] 선택한 연락처로 공공주택 알림을 받는 데 동의합니다.", false)}<p class="micro">현재는 브라우저 알림함에서만 동작하며 실제 문자·이메일은 발송되지 않아요.</p>`)}<div class="notice" id="public-subscription-summary" aria-live="polite"></div>${formError()}<div class="form-submit"><a class="textlink" href="#/activity/public">내 공공주택으로</a><button class="btn">공공주택 알림 신청·변경</button></div>${d.id ? `<button class="textlink danger" type="button" onclick="phStopSubscription('${d.id}')">이 알림 수신 중단</button>` : ""}</form></div>${phDemo()}</div>`;
}

/* phSubscriptionData — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function phSubscriptionData(f, kind, entity, edit) {
  const d = getData(f);
  return {
    ...d,
    kind,
    entity,
    id: edit || undefined,
    regions: new FormData(f).getAll("regions"),
    types: new FormData(f).getAll("types"),
    targets: new FormData(f).getAll("targets"),
  };
}

/* phValidateSubscription — 공공주택 알림 구독의 필수 조건과 알림 시간 설정을 검증합니다. */
function phValidateSubscription(d, now = Date.now()) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !phKindLabel[d.kind] ||
    !["옥키 알림함만", "문자 + 옥키 알림함", "이메일 + 옥키 알림함"].includes(d.channel)
  )
    return "알림 종류와 수신 수단을 확인해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!d.privacy)
    return "정보 수집·이용 동의를 확인해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    (d.quietStart && !d.quietEnd) ||
    (!d.quietStart && d.quietEnd)
  )
    return "받지 않을 시간은 시작과 종료를 함께 입력해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    d.kind === "conditions" &&
    (!d.regions.length || !d.types.length || !d.targets.length)
  )
    return "관심 지역·주택 유형·신청 대상을 각각 선택해주세요.";
  if (d.kind !== "schedule" && !d.newNotice) return "받을 새 공고 알림을 선택해주세요.";
  if (d.kind === "property" && !phProperty(d.entity)) return "관심 주택을 다시 선택해주세요.";
  if (d.channel !== "옥키 알림함만" && !d.externalConsent)
    return "외부 알림 수신 동의를 확인해주세요.";
  if (d.kind === "schedule") {
    const n = phNotice(d.entity);
    if (!n || !n.groups.some((g) => g.id === d.group))
      return "공고와 신청 대상을 다시 선택해주세요.";
    const g = phGroup(n, d.group),
      status = phStatus(n, g, now);
    if (!d.start && !d.deadline && !d.changes) return "받을 일정 알림을 한 가지 이상 선택해주세요.";
    if (d.start && status !== "접수 예정")
      return "이미 시작했거나 종료·취소된 공고의 시작 알림은 선택할 수 없어요.";
    if (d.deadline && !["접수 예정", "접수 중"].includes(status))
      return "종료·취소된 공고의 마감 알림은 선택할 수 없어요.";
    if (d.start) {
      const deferred = phQuietShift(g.start, d.quietStart, d.quietEnd);
      if (Date.parse(deferred) >= Date.parse(g.end))
        return "수신 제외 시간 이후가 접수 마감을 넘어요. 시간을 바꿔주세요.";
    }
    if (d.deadline) {
      let due;
      try {
        due = phDeadlineTime(g, d.reminder, d.customTime);
      } catch {
        return "직접 선택한 알림 시각을 확인해주세요.";
      }
      if (!due || !Number.isFinite(Date.parse(due))) return "직접 선택한 알림 시각을 입력해주세요.";
      due = phQuietShift(due, d.quietStart, d.quietEnd);
      if (Date.parse(due) <= now)
        return "알림 예정 시각이 지났어요. 앞으로 남은 시간으로 선택해주세요.";
      if (Date.parse(due) >= Date.parse(g.end))
        return "알림 시각 또는 수신 제외 시간 이후가 접수 마감 이후예요.";
    }
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return "";
}

/* phSaveSubscription — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function phSaveSubscription(d, now = Date.now()) {
  const error = phValidateSubscription(d, now);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (error)
    return { error };
  const key = phSubscriptionKey(d),
    existing =
      phState.subscriptions.find((s) => s.id === d.id) ||
      phState.subscriptions.find((s) => s.key === key);
  const n = d.kind === "schedule" ? phNotice(d.entity) : null,
    g = n ? phGroup(n, d.group) : null;
  const clean = {
    ...d,
    key,
    id: existing?.id || nid("PS"),
    active: true,
    created: existing?.created || new Date(now).toISOString(),
    updated: new Date(now).toISOString(),
    version: existing ? (existing.version || 1) + 1 : 1,
    remindAt:
      d.kind === "schedule" && d.deadline
        ? phQuietShift(phDeadlineTime(g, d.reminder, d.customTime), d.quietStart, d.quietEnd)
        : null,
    scheduleNeedsReview: false,
    baseline: n ? { version: n.version, start: g.start, end: g.end } : null,
  };
  delete clean.privacy;
  delete clean.phoneCode;
  delete clean.emailCode;
  if (clean.channel === "옥키 알림함만") {
    clean.phone = "";
    clean.email = "";
    clean.externalConsent = false;
  } else if (clean.channel.startsWith("문자")) clean.email = "";
  else clean.phone = "";
  if (
    !phCommit((s) => {
      s.subscriptions = s.subscriptions.filter((x) => x.id !== clean.id && x.key !== key);
      s.subscriptions.unshift(clean);
      if (d.kind === "property" && !s.interests.includes(d.entity)) s.interests.unshift(d.entity);
    })
  )
    return { error: "저장하지 못했어요. 입력한 내용을 유지하고 다시 시도해주세요." };
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return { subscription: clean };
}

/* phSubscribeEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function phSubscribeEvents(kind, entity, group, edit) {
  const f = $("#public-subscription-form");
  verification = {};
  const drawSummary = () => {
    const d = phSubscriptionData(f, kind, entity, edit),
      external = d.channel !== "옥키 알림함만";
    for (const [name, show] of [
      ["phone", d.channel.startsWith("문자")],
      ["email", d.channel.startsWith("이메일")],
    ]) {
      f.querySelector("[data-ph-" + name + "]").hidden = !show;
      f.elements[name].required = show;
      f.elements[name].disabled = !show;
      f.elements[name + "Code"].disabled = !show;
    }
    f.elements.externalConsent.required = external;
    f.elements.externalConsent.disabled = !external;
    if (kind === "schedule") {
      f.elements.customTime.required = !!d.deadline && d.reminder === "직접 선택";
      f.elements.customTime.disabled = !d.deadline || d.reminder !== "직접 선택";
      f.elements.reminder.disabled = !d.deadline;
      let due = "선택한 마감 알림 없음";
      try {
        if (d.deadline)
          due = phTime(
            phQuietShift(
              phDeadlineTime(phGroup(phNotice(entity), d.group), d.reminder, d.customTime),
              d.quietStart,
              d.quietEnd,
            ),
          );
      } catch {
        due = "직접 선택한 시각을 확인해주세요.";
      }
      $("#public-reminder-time").textContent = "알림 예정 시각: " + due;
    }
    $("#public-subscription-summary").textContent =
      "신청 전 확인: " +
      phKindLabel[kind] +
      " / " +
      (kind === "conditions"
        ? d.regions.join("·") + " / " + d.types.join("·") + " / " + d.targets.join("·")
        : phProperty(kind === "property" ? entity : phNotice(entity).propertyId)?.name) +
      " / " +
      d.channel +
      " · 청약 접수는 공식 접수처에서 별도로 진행합니다.";
  };
  f.onchange = (e) => {
    if (["types", "targets"].includes(e.target.name) && e.target.checked) {
      const items = f.querySelectorAll('[name="' + e.target.name + '"]');
      items.forEach((i) => {
        if (e.target.value === "전체" && i !== e.target) i.checked = false;
        else if (e.target.value !== "전체" && i.value === "전체") i.checked = false;
      });
    }
    if (kind === "schedule" && e.target.name === "group") {
      $("#public-schedule-fields").innerHTML = phScheduleFields(phNotice(entity), {
        ...phSubscriptionData(f, kind, entity, edit),
        start: true,
        deadline: true,
        changes: true,
      });
    }
    drawSummary();
  };
  f._phSync = drawSummary;
  drawSummary();
  f.onsubmit = (e) => {
    e.preventDefault();
    drawSummary();
    if (!f.reportValidity()) return;
    const d = phSubscriptionData(f, kind, entity, edit);
    if (d.channel.startsWith("문자") && !verified(f, "phone"))
      return errorForm(f, "휴대전화 체험 확인을 완료해주세요.");
    if (d.channel.startsWith("이메일") && !verified(f, "email"))
      return errorForm(f, "이메일 체험 확인을 완료해주세요.");
    const result = phSaveSubscription(d);
    if (result.error) return errorForm(f, result.error);
    save(draftKey(f), {});
    location.hash = "#/public/complete/" + result.subscription.id;
  };
}

/* phStopSubscription — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function phStopSubscription(id) {
  if (
    phCommit(
      (s) =>
        (s.subscriptions = s.subscriptions.map((x) =>
          x.id === id ? { ...x, active: false, updated: stamp() } : x,
        )),
    )
  ) {
    toast("알림을 중단했어요. 관심 주택과 본인 기록은 남아 있어요.");
    location.hash = "#/activity/public";
    render(false);
  }
}

/* phSubscriptionLink — 선택한 대상의 이동 경로나 열기 동작을 처리합니다. */
function phSubscriptionLink(s) {
  return (
    "#/public/subscribe/" + s.kind + "/" + (s.entity || "-") + "/" + (s.group || "-") + "/" + s.id
  );
}

/* phSubscriptionTitle — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phSubscriptionTitle(s) {
  return s.kind === "conditions"
    ? s.regions.join("·") + " / " + s.types.join("·") + " / " + s.targets.join("·")
    : phProperty(s.kind === "property" ? s.entity : phNotice(s.entity)?.propertyId)?.name ||
        "현재 볼 수 없는 공고";
}

/* phSubscriptionSummary — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phSubscriptionSummary(s) {
  return `${s.scheduleNeedsReview ? '<div class="notice warning">공고 변경으로 알림 시각을 다시 확인해주세요. 시작·마감 알림을 보류합니다.</div>' : ""}<p>${esc(phSubscriptionTitle(s))}</p><p class="micro">${esc(phKindLabel[s.kind])} · ${s.active ? "알림 켜짐" : "수신 중단"} · ${esc(s.channel)}${s.phone ? " / " + maskPhone(s.phone) : s.email ? " / " + esc(s.email) : ""}</p>${s.kind === "schedule" ? `<p class="micro">${s.start ? "접수 시작 / " : ""}${s.deadline ? "마감 알림 " + phTime(s.remindAt) + " / " : ""}${s.changes ? "일정·조건 변경·취소" : ""}</p>` : ""}`;
}

/* phComplete — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phComplete(id) {
  const s = phState.subscriptions.find((s) => s.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!s)
    return unavailable();
  const property = phProperty(
    s.kind === "property" ? s.entity : s.kind === "schedule" ? phNotice(s.entity)?.propertyId : "",
  );
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("PUBLIC HOUSING ALERT", "공공주택 알림을 신청했어요.", "선택한 소식과 수신 방법을 확인해주세요.")}<div class="activity-content"><div class="summary"><span class="badge">${s.active ? "알림 등록 완료" : "수신 중단"}</span>${phSubscriptionSummary(s)}<p class="micro">받지 않을 시간 ${esc(s.quietStart || "없음")} ~ ${esc(s.quietEnd || "없음")} (한국시간)</p></div><div class="notice">알림 등록은 청약 신청 완료가 아닙니다. 실제 접수는 공고의 공식 접수처에서 진행해요. 현재 외부 문자·이메일은 발송되지 않습니다.</div><div class="actions"><a class="btn" href="#/activity/public">내 공공주택 확인하기 →</a><a class="btn secondary" href="${phSubscriptionLink(s)}">알림 조건·수신 방법 수정</a></div>${property ? `<div class="two-grid section"><a class="soft-card" href="#/public/map/${property.id}"><h3>입주 전에 동네를 알아보세요</h3><span class="textlink">주변 생활권 지도 보기 →</span></a><button class="soft-card ph-button-card" onclick="phCommunity('${property.id}')"><h3>통근과 생활이 궁금하다면</h3><span class="textlink">동네 질문·답변 보기 →</span></button></div>` : ""}</div></div>`;
}

/* phRecordStatuses — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phRecordStatuses = ["기록 없음", "신청했어요", "서류 제출했어요", "결과 확인", "취소"];

/* phSaveRecord — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function phSaveRecord(event, id) {
  event.preventDefault();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!phNotice(id)) return;
  const d = Object.fromEntries(new FormData(event.target));
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !phRecordStatuses.includes(d.status)
  )
    return;
  if (phCommit((s) => (s.records[id] = { status: d.status, note: d.note || "", updated: stamp() })))
    toast("본인 기록을 저장했어요. 공식 접수·선정 결과와 연동된 상태가 아닙니다.");
}

/* phActivity — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phActivity(focus) {
  const selected = phState.interests.map(phProperty).filter(Boolean),
    recordIDs = [
      ...new Set([
        focus,
        ...phState.seen,
        ...Object.keys(phState.records),
        ...phState.subscriptions.filter((s) => s.kind === "schedule").map((s) => s.entity),
      ]),
    ].filter((id) => phNotice(id));
  const upcoming = phState.subscriptions
    .filter((s) => s.active && s.kind === "schedule")
    .map((s) => ({ s, n: phNotice(s.entity) }))
    .filter(
      (x) =>
        x.n &&
        Date.parse(phGroup(x.n, x.s.group).end) > Date.now() &&
        phStatus(x.n, phGroup(x.n, x.s.group)) !== "취소",
    );
  return `<div class="container public-page">${pageHead("MY PUBLIC HOUSING", "내 공공주택", "관심 주택, 모집 일정, 직접 남긴 청약 기록을 한곳에서 관리해요.")}${activityTabs("public")}<div class="activity-content"><section class="section"><h2>다가오는 일정 ${upcoming.length}건</h2>${upcoming.map(({ s, n }) => `<a class="application block" href="#/public/notice/${n.id}/${s.group}"><b>${esc(phProperty(n.propertyId).name)}</b><p class="micro">${esc(phGroup(n, s.group).label)} · ${phStatus(n, phGroup(n, s.group))} · 마감 ${phTime(phGroup(n, s.group).end)}</p></a>`).join("") || emptyState("등록한 일정 알림이 없어요.", "공고에서 시작·마감·변경 알림을 선택할 수 있어요.")}</section><section class="section"><div class="section-head"><h2>관심 주택·사업</h2><a class="textlink" href="#/public/list/properties">새 관심 주택 찾기 →</a></div>${selected.map((p) => `<article class="application"><h3>${esc(p.name)}</h3><p class="micro">${esc(p.type)} · ${esc(p.region)} · 다음 일정 미정</p><div class="actions"><a href="#/public/property/${p.id}" class="btn secondary small">주택 정보</a><a href="#/public/subscribe/property/${p.id}" class="textlink">다음 모집 알림 수정·신청</a><button class="textlink danger" onclick="phToggleInterest('${p.id}')">관심 목록에서 삭제</button></div></article>`).join("") || emptyState("관심 주택이 없어요.", "관심 등록만으로 알림이 켜지지 않아요.")}</section>${[
    "property",
    "conditions",
    "schedule",
  ]
    .map(
      (kind) =>
        `<section class="section"><h2>${esc(phKindLabel[kind])} 알림</h2>${
          phState.subscriptions
            .filter((s) => s.kind === kind)
            .map(
              (s) =>
                `<article class="application">${phSubscriptionSummary(s)}<div class="actions"><a class="textlink" href="${phSubscriptionLink(s)}">알림 수정·${s.active ? "중단" : "다시 신청"} →</a>${s.active ? `<button class="textlink" onclick="phStopSubscription('${s.id}')">수신 중단</button>` : ""}</div></article>`,
            )
            .join("") ||
          `<div class="notice">등록한 알림이 없어요. <a href="#/public/${kind === "conditions" ? "subscribe/conditions" : "list"}" class="textlink">알림 만들기 →</a></div>`
        }</section>`,
    )
    .join("")}<section class="section"><h2>내 청약 기록 · 본인이 입력한 상태</h2>${
    recordIDs
      .map((id) => {
        const n = phNotice(id),
          r = phState.records[id] || {};
        return `<form id="public-record-${id}" class="formbox" onsubmit="phSaveRecord(event,'${id}')"><h3>${esc(phProperty(n.propertyId).name)} / ${esc(n.round)}</h3>${selectField("본인 청약 상태", "status", phRecordStatuses, r.status || "기록 없음")}${inputField("본인 메모 (선택)", "note", r.note || "", 'maxlength="300"')}<p class="micro">공식 접수처에서 제출한 뒤 직접 기록해주세요. 외부 링크를 눌러도 신청 완료로 바뀌지 않아요.</p><div class="actions"><button class="btn small">본인 기록 저장</button><a class="textlink" href="#/public/notice/${id}">공고 확인 →</a></div></form>`;
      })
      .join("") ||
    emptyState(
      "아직 남긴 청약 기록이 없어요.",
      "공고의 “신청했어요 · 본인 기록”에서 이어갈 수 있어요.",
    )
  }</section><a class="btn secondary" href="#/notifications">전체 알림함 →</a>${phDemo()}</div></div>`;
}

/* phEmit — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phEmit(s, event, n, title, now, deadline = null) {
  const discriminator =
    event === "change"
      ? n.version
      : event === "start"
        ? phGroup(n, s.group).start
        : event === "deadline"
          ? s.remindAt
          : n.id;
  const key = "public/" + s.id + "/" + s.version + "/" + event + "/" + n.id + "/" + discriminator;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    phState.logs.some((l) => l.key === key && ["알림함 저장", "마감 후 제외"].includes(l.status))
  )
    return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    deadline &&
    now >= Date.parse(deadline)
  ) {
    phCommit((state) =>
      state.logs.push({
        key,
        status: "마감 후 제외",
        at: new Date(now).toISOString(),
        attempts: 1,
      }),
    );
    return;
  }
  const due = phQuietShift(new Date(now).toISOString(), s.quietStart, s.quietEnd);
  if (Date.parse(due) > now) return;
  pushNotice("공공주택", title, "#/public/notice/" + n.id + (s.group ? "/" + s.group : ""), key);
  const succeeded = inbox.some((x) => x.key === key);
  phCommit((state) => {
    const old = state.logs.find((l) => l.key === key);
    const log = {
      key,
      status: succeeded ? "알림함 저장" : "저장 실패 · 재시도 대기",
      at: new Date(now).toISOString(),
      attempts: (old?.attempts || 0) + 1,
      channel: s.channel,
    };
    state.logs = state.logs.filter((l) => l.key !== key);
    state.logs.unshift(log);
  });
}

/* phSyncNotices — 공고와 구독 조건을 비교해 이 브라우저의 예시 알림 상태를 갱신합니다. */
function phSyncNotices(now = Date.now()) {
  for (const s of phState.subscriptions.filter((s) => s.active)) {
    if (s.kind === "schedule") {
      const n = phNotice(s.entity);
      if (!n) continue;
      const g = phGroup(n, s.group);
      if (
        !s.scheduleNeedsReview &&
        s.start &&
        phStatus(n, g, now) !== "취소" &&
        now >= Date.parse(g.start)
      )
        phEmit(
          s,
          "start",
          n,
          phProperty(n.propertyId).name + " · " + g.label + " 접수가 시작됐어요.",
          now,
          g.end,
        );
      if (
        !s.scheduleNeedsReview &&
        s.deadline &&
        phStatus(n, g, now) !== "취소" &&
        now >= Date.parse(s.remindAt)
      )
        phEmit(
          s,
          "deadline",
          n,
          phProperty(n.propertyId).name + " · 청약 마감 전 일정을 확인하세요.",
          now,
          g.end,
        );
      if (s.changes && n.version > (s.baseline?.version || 0))
        phEmit(
          s,
          "change",
          n,
          phProperty(n.propertyId).name + " · 공고 일정·조건이 변경되었거나 취소되었어요.",
          now,
        );
    } else
      for (const base of phNotices) {
        const n = phNotice(base.id),
          p = phProperty(n.propertyId);
        if (
          ["취소", "초안", "검수 대기"].includes(n.reviewState) ||
          Date.parse(n.posted) <= Date.parse(s.created)
        )
          continue;
        const matches =
          s.kind === "property"
            ? p.id === s.entity
            : s.regions.some((r) => p.region === r || p.areas.includes(r)) &&
              (s.types.includes("전체") || s.types.includes(p.type)) &&
              (s.targets.includes("전체") || n.groups.some((g) => s.targets.includes(g.target)));
        if (matches) phEmit(s, "new", n, p.name + " · 관심 조건의 새 모집 공고가 나왔어요.", now);
      }
  }
}

/* phAdmin — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function phAdmin() {
  return `<div class="container public-page">${pageHead("OPERATIONS DEMO / PUBLIC HOUSING", "공공주택 공고·변경·알림 관리", "운영 흐름 체험 · 현재 브라우저 안의 예시 자료만 변경하며 실제 관리자 권한이나 외부 발송은 연결되지 않았습니다.")}<div class="actions section"><a class="btn secondary" href="#/admin">방 등록 운영</a><a class="textlink" href="#/public">이용자 화면 미리보기 →</a></div>${phNotices
    .map((base) => {
      const n = phNotice(base.id),
        g = n.groups[0];
      return `<details class="formbox"><summary><b>${esc(n.id)} · ${esc(phProperty(n.propertyId).name)}</b> / ${esc(n.reviewState)} / 버전 ${n.version}</summary><form id="public-admin-${n.id}" onsubmit="phReviewNotice(event,'${n.id}')"><p class="micro">주택 ID ${esc(n.propertyId)} · 공급기관 공고 ID ${esc(n.id)} · 최종 확인 ${phTime(n.checked)}</p><div class="fields">${inputField("공급기관", "agency", n.agency, 'required maxlength="100"')}${inputField("공식 원문 주소", "sourceURL", n.sourceURL, 'type="url"')}${inputField("공식 접수처 주소 (선택)", "applyURL", n.applyURL, 'type="url"')}${selectField("검수 상태", "reviewState", ["초안", "검수 대기", "공개", "확인 필요", "정정", "취소"], n.reviewState)}${inputField("첫 신청 대상 접수 시작 · 한국시간", "start", phLocal(g.start), 'type="datetime-local" required')}${inputField("첫 신청 대상 접수 마감 · 한국시간", "end", phLocal(g.end), 'type="datetime-local" required')}${inputField("확인 담당자", "reviewer", n.reviewer || "", 'required maxlength="50"')}</div>${textArea("변경·확인 근거 *", "reason", "", true)}${checkField("reviewed", "공고 원문과 대상별 접수 기간·제출 방법을 확인했습니다.", false, true)}${formError()}<button class="btn small">검수 완료·변경 반영</button></form></details>`;
    })
    .join(
      "",
    )}<section class="section"><h2>발송 전 확인과 기록</h2><div class="notice">수신 중인 해당 공고 구독자만 안내합니다. 공고·변경 버전·구독 등록별 중복을 제외하고, 수신 제외 시간과 마감 이후 지연을 확인해요. 현재 기록은 알림함 저장 결과이며 문자·이메일 발송 성공을 뜻하지 않습니다.</div><button class="btn secondary small" onclick="phSyncNotices();render(false)">현재 시각 기준 알림 확인·실패 건 재시도</button>${phState.logs.map((l) => `<div class="application"><b>${esc(l.status)}</b><p class="micro">${esc(l.key)} / ${l.attempts}회 / ${phTime(l.at)}</p></div>`).join("") || emptyState("처리한 알림 기록이 없어요.")}</section></div>`;
}

/* phReviewNotice — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phReviewNotice(event, id) {
  event.preventDefault();
  const f = event.target,
    d = getData(f),
    n = phNotice(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !n ||
    !f.reportValidity()
  )
    return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!d.reviewed)
    return errorForm(f, "원문 확인을 체크해주세요.");
  if (["공개", "정정"].includes(d.reviewState) && !phSafeURL(d.sourceURL))
    return errorForm(f, "공식 원문 주소를 입력해야 공개·정정을 반영할 수 있어요.");
  if ((d.sourceURL && !phSafeURL(d.sourceURL)) || (d.applyURL && !phSafeURL(d.applyURL)))
    return errorForm(f, "http 또는 https 주소만 입력해주세요.");
  const start = phISO(d.start),
    end = phISO(d.end);
  if (Date.parse(start) >= Date.parse(end))
    return errorForm(f, "접수 마감은 시작 이후여야 합니다.");
  const before =
      phTime(n.groups[0].start) + " ~ " + phTime(n.groups[0].end) + " / " + n.reviewState,
    after = phTime(start) + " ~ " + phTime(end) + " / " + d.reviewState;
  const next = {
    ...n,
    agency: d.agency,
    sourceURL: d.sourceURL,
    applyURL: d.applyURL,
    reviewState: d.reviewState,
    reviewer: d.reviewer,
    checked: stamp(),
    version: n.version + 1,
    groups: n.groups.map((g, i) => (i === 0 ? { ...g, start, end } : g)),
    changes: [...(n.changes || []), { at: stamp(), reason: d.reason, before, after }],
  };
  if (
    phCommit((s) => {
      s.overrides[id] = next;
      s.subscriptions = s.subscriptions.map((sub) => {
        if (sub.kind !== "schedule" || sub.entity !== id) return sub;
        const target = phGroup(next, sub.group);
        let due = sub.remindAt;
        if (sub.deadline)
          try {
            due = phQuietShift(
              phDeadlineTime(target, sub.reminder, sub.customTime),
              sub.quietStart,
              sub.quietEnd,
            );
          } catch {
            due = null;
          }
        return {
          ...sub,
          remindAt: due,
          scheduleNeedsReview:
            !!sub.deadline &&
            (!due || Date.parse(due) <= Date.now() || Date.parse(due) >= Date.parse(target.end)),
        };
      });
    })
  ) {
    toast("이 브라우저의 검수·변경 기록을 저장했어요.");
    render(false);
  }
}

/* phMapContext — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let phMapContext = null;

/* phMapPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function phMapPage(id) {
  const p = phProperty(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p)
    return unavailable();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (phMapContext !== id) {
    if (
      !storeMap({
        region: regions.includes(p.region) ? p.region : "",
        center: { x: p.x, y: p.y },
        selected: null,
        category: "전체",
        query: "",
      })
    )
      return unavailable();
    phMapContext = id;
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return mapPage()
    .replace(
      '<div class="container neighborhood-page">',
      `<div class="container neighborhood-page"><div class="ph-interest-strip"><div><span class="badge">주택 위치 기준 · 도식</span><h2>[예시] ${esc(p.name)} 주변</h2><p class="micro">주택을 기준으로 생활 시설을 살펴보세요. 실제 위치와 이동 경로는 공식 지도에서 확인해주세요.</p></div><a class="btn secondary small" href="#/public/property/${id}">주택 정보로 돌아가기</a></div>`,
    )
    .replace(
      'href="#/activity">← 내 활동으로 돌아가기',
      'href="#/activity/public">← 내 공공주택으로 돌아가기',
    );
}

/* phOriginalMapWorld — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phOriginalMapFilter — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseMapPage — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseNavigation — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phBaseNavigation = nav;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
nav = function (route) {
  phBaseNavigation(route);
  $("#header").innerHTML = $("#header")
    .innerHTML.replace(
      '<a class="navlink ' + (route === "provide" ? "active" : "") + '" href="#/provide">',
      `<a class="navlink ${route === "public" ? "active" : ""}" href="#/public">공공주택</a><a class="navlink ${route === "provide" ? "active" : ""}" href="#/provide">`,
    )
    .replace('<a href="#/provide">', '<a href="#/public">공공주택</a><a href="#/provide">');
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
activityTabs = function (tab) {
  return `<nav class="tabs activity-tabs" aria-label="내 활동 분류">${[
    ["alerts", "방 알림"],
    ["public", "공공주택"],
    ["consultations", "공간 상담"],
    ["tips", "내 방 등록"],
  ]
    .map(
      ([key, t]) =>
        `<a class="tab ${tab === key ? "active" : ""}" href="#/activity/${key}" ${tab === key ? 'aria-current="page"' : ""}>${t}</a>`,
    )
    .join("")}</nav>`;
};

/* phBaseHome — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseLife — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseNotifications — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseNotificationSettings — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* phBaseAdmin — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const phBaseAdmin = adminPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
adminPage = function () {
  return phBaseAdmin().replace(
    '<div class="grid3">',
    '<div class="actions section"><a class="btn secondary" href="#/public-admin">공공주택 공고·변경·알림 관리 →</a></div><div class="grid3">',
  );
};

/* phBaseDraftKey — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

// Keep earlier demo notices while linking their action to the new round-specific screen.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
inbox = inbox.map((n) =>
  n.id === exampleYouthHousingNotice.id
    ? {
        ...n,
        category: "공공주택",
        href: "#/public/notice/PH-A-2026-02/youth",
        body: "연령·무주택·소득·자산 조건을 충족한 청년의 청약 안내입니다.\n옥천 청년주택 A · 2026년 2차 모집\n접수 마감: 2026년 11월 6일 17:00 (한국시간)",
        cta: "모집 공고 확인",
      }
    : n,
);

/* phBaseRender — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
