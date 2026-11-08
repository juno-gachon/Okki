/*
 * 파일: flow.js
 * 역할: 대기 신청을 중심으로 집 찾기와 정착 과정을 확장합니다. 신청 단계, 알림, 활동 내역, 생활 할 일 및 관련 화면과 이벤트를 연결합니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";
// Waiting-first experience. All records remain local to this demonstration browser.

/* regions — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const regions = [
  "옥천읍",
  "동이면",
  "안남면",
  "안내면",
  "청성면",
  "청산면",
  "이원면",
  "군서면",
  "군북면",
];

/* waitDraft, waitEdit, alerts, todoState, settleProfile, todoFilter — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다 */
let waitDraft = read("wait-draft", {}),
  waitEdit = read("wait-edit", null),
  alerts = read("alerts", []),
  todoState = read("todos", {}),
  settleProfile = read("settle-profile", {}),
  todoFilter = "전체";

/* verification, tipDraft, areaRegion, areaCategory, areaQuery — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let verification = {},
  tipDraft = read("tip-draft", {}),
  areaRegion = "",
  areaCategory = "전체",
  areaQuery = "";

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
posts = posts.map((p) => (p.category === "생활 정보" ? { ...p, category: "동네 정보" } : p));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
communityTab = "일상";

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
alerts.forEach((n) => {
  if (n.snapshot && !homes.some((h) => h.id === n.snapshot.id)) homes.push(n.snapshot);
});

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
seedPosts.push(
  ...[
    {
      id: "policy-rent",
      title: "월세 지원, 신청 전에 확인할 것",
      task: "rent",
      body: "대상과 모집 기간은 공식 공고를 확인해주세요. 내 첫 1년 할 일에 저장해둘 수 있어요.",
    },
    {
      id: "policy-public",
      title: "공공임대 공고도 미리 살펴보세요",
      task: "public",
      body: "전입 전에도 공고를 확인할 수 있어요. 입주 일정과 자격은 개별 공고를 확인해주세요.",
    },
  ].map((p) => ({
    ...p,
    author: "옥키 안내",
    category: "지원 정책",
    visual: "guide",
    comments: [],
  })),
);

/* stamp — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const stamp = () => new Date().toISOString();

/* labelDate — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const labelDate = (s) => (s ? new Date(s).toLocaleDateString("ko-KR") : "미정");

/* maskPhone — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const maskPhone = (s) => (s || "").replace(/(\d{3})[ -]?(\d{3,4})[ -]?(\d{4})/, "$1-****-$3");

/* demoNotice — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const demoNotice = () =>
  '<div class="notice warning">체험 사이트 · 입력은 현재 브라우저에만 저장됩니다. 실제 문자·이메일 발송이나 운영팀 접수는 없으니 예시 정보를 사용해주세요.</div>';

/* pageHead — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const pageHead = (k, t, p = "") =>
  `<div class="page-head"><div><div class="section-kicker">${k}</div><h1>${t}</h1><p>${p}</p></div></div>`;

/* choice — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const choice = (name, items, value, multi = false) =>
  `<div class="chips">${items.map((t) => `<label class="chip"><input type="${multi ? "checkbox" : "radio"}" name="${name}" value="${esc(t)}" ${(multi ? (value || []).includes(t) : value === t) ? "checked" : ""}>${t}</label>`).join("")}</div>`;

/* box — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const box = (n, t, html) =>
  `<section class="formbox"><h2><span>${n}</span>${t}</h2>${html}</section>`;

/* inputField — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const inputField = (label, name, value, extra = "") =>
  field(
    label,
    `<input id="${name}" name="${name}" aria-label="${label.replace(" *", "")}" value="${esc(value)}" ${extra}>`,
  );

/* selectField — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const selectField = (label, name, items, value, required = false) =>
  field(
    label,
    `<select name="${name}" aria-label="${label.replace(" *", "")}" ${required ? "required" : ""}><option value="">선택해주세요</option>${options(items, value)}</select>`,
  );

/* areaText — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const areaText = (d) => (d.regions?.length ? d.regions.join(", ") : d.region || "옥천 내 무관");

/* writeApps — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function writeApps(next) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !save("applications", next)
  )
    return false;
  applications = next;
  return true;
}

/* patchApp — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function patchApp(id, patch, note) {
  return writeApps(
    applications.map((a) =>
      a.id === id
        ? { ...a, ...patch, history: [...(a.history || []), { time: stamp(), text: note }] }
        : a,
    ),
  );
}

/* errorForm — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function errorForm(form, msg) {
  const e = form.querySelector(".form-error");
  if (e) {
    e.textContent = msg;
    e.hidden = false;
    e.focus();
  } else toast(msg);
}

/* formError — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function formError() {
  return '<p class="notice warning form-error" role="alert" tabindex="-1" hidden></p>';
}

/* formData — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function formData(form) {
  const d = Object.fromEntries(new FormData(form));
  for (const n of ["regions", "types", "utilities"])
    if (form.querySelector(`[name="${n}"]`)) d[n] = new FormData(form).getAll(n);
  return d;
}

/* nav — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function nav(route) {
  const links = [
    ["wait", "방 알림 받기"],
    ["provide", "방 정보 알려주기"],
    ["tasks", "첫 1년 할 일"],
    ["community/daily", "커뮤니티"],
  ];
  setHTML($("#header"), `<nav class="nav" aria-label="주 메뉴">${brand()}${links.map(([p, t]) => `<a class="navlink ${route === p.split("/")[0] ? "active" : ""}" href="#/${p}">${t}</a>`).join("")}<a class="btn secondary small" href="#/activity">내 활동 ↗</a><button class="mobile-toggle" aria-label="메뉴 열기" aria-expanded="false" ${uiActionAttrs("click", "toggleMenu_24", [])}>☰</button></nav><nav class="mobile-nav" aria-label="모바일 메뉴">${links.map(([p, t]) => `<a href="#/${p}">${t}</a>`).join("")}</nav>`);
  setHTML($("#footer"), `<div class="container"><div class="foot"><div>${brand()}<div>옥천에서 시작하는 첫 생활, 첫 집과 첫 이웃.</div></div><div class="footlinks"><a href="#/about">옥키 소개 · 이용 안내</a><a href="#/area">생활권 지도</a><button class="textlink" ${uiActionAttrs("click", "policy_25", [])}>개인정보 안내</button></div></div><div class="footnote"><span>© 2026 OKKI. A place to begin.</span><span>체험용 · 공간·게시글은 예시 · 현재 브라우저에만 저장 · 운영 연락처·시간 미정</span></div></div>`);
}

/* home — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function home() {
  return `<div class="container"><section class="hero waiting-hero"><div><div class="eyebrow">옥천 청년의 첫 거처</div><h1>옥천에 입사했는데,<br><em>살 집을 찾기 어렵나요?</em></h1><p class="lead">입주 일정과 조건을 남겨주세요.<br>중개사 매물과 퇴거 예정 소식을 확인해, 조건이 맞으면 알려드려요.</p><div class="actions"><a class="btn" href="#/wait">곧 나올 방 알림 받기 ↗</a><a class="btn secondary" href="#/provide">방 등록하기</a></div><p class="micro">이미 등록했나요? <a class="textlink" href="#/activity">내 알림 확인하기 →</a></p></div><aside class="journey-panel"><div class="journey-art">${village()}</div><h2>전입에서 첫 거처까지</h2>${[
    ["조건을 남기고", "입사·입주 일정 / 직장 / 예산 / 지역"],
    ["확인된 소식을 받고", "등록 유형·조건 확인 후 맞춤 알림"],
    ["생활을 시작해요", "공간 상담 / 첫 1년 할 일 / 이웃"],
  ]
    .map(
      ([t, d], i) =>
        `<div class="journey-step"><span>0${i + 1}</span><div><b>${t}</b><small>${d}</small></div></div>`,
    )
    .join(
      "",
    )}</aside></section>${typeof phHome === "function" ? `<section class="section ph-home-banner"><div><span class="section-kicker">PUBLIC HOUSING</span><h2>공공주택도, 다음 모집까지 놓치지 마세요.</h2><p>행복주택·청년 매입임대 등 현재 모집을 확인하고,<br>원하는 주택이나 조건의 새 공고 알림을 받아보세요.</p><div class="actions"><a class="btn" href="#/public">공공주택 모집 알아보기 →</a><a class="btn secondary" href="#/public/subscribe/conditions">원하는 공공주택 알림 받기</a></div></div><div class="ph-home-icon" aria-hidden="true">⌂<span>지금의 모집<br>다음 기회</span></div></section>` : ""}<section class="section"><div class="section-head"><div><div class="section-kicker">BEFORE YOUR NEXT CHAPTER</div><h2>공개되기 전의 소식이 필요한 순간</h2><p>통근을 시작하기 전에도, 이미 통근 중이어도 등록할 수 있어요.</p></div></div><div class="two-grid"><a class="soft-card" href="#/wait"><span class="badge">입사 예정</span><h3>입사를 앞두고 있어요</h3><p>일정에 맞춰 이사하고 싶어요.<br>입주 희망일과 기다릴 수 있는 날짜를 알려주세요.</p><span class="textlink">내 일정 남기기 →</span></a><a class="soft-card" href="#/wait"><span class="badge">근무·통근 중</span><h3>옥천에 살고 싶지만 통근 중이에요</h3><p>지금 당장 방이 없어도 조건을 남겨두세요.<br>새 정보가 확인되면 조건을 비교해 안내해요.</p><span class="textlink">내 조건 남기기 →</span></a></div></section><section class="section"><h2>방 알림은 이렇게 이어집니다</h2><div class="four-steps">${[
    ["조건 등록", "내 일정과 예산을 남겨요."],
    ["정보 확인", "임대 의사와 안내 권한을 확인해요."],
    ["맞는 소식 안내", "조건에 맞는 방이 생기면 알려드려요."],
    ["상담·방문 연결", "내용을 살펴보고 상담을 요청해요."],
  ]
    .map(([t, d], i) => `<div><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`)
    .join(
      "",
    )}</div><a class="notice block" href="#/about">공간 정보, 이렇게 확인합니다 →</a></section><section class="section"><div class="section-head"><div><div class="section-kicker">MAKE YOURSELF AT HOME</div><h2>집을 구한 다음에도, 옥키와 함께</h2></div></div><div class="two-grid"><a class="soft-card" href="#/tasks"><h3>첫 1년 할 일</h3><p>전입 절차부터 지원 정책 확인까지.<br>내 상황에 필요한 일을 하나씩 챙겨요.</p><span class="textlink">내 할 일 살펴보기 →</span></a><a class="soft-card" href="#/area"><h3>어느 동네에서 살까요?</h3><p>생활권과 주요 시설을 살펴보고<br>희망 지역을 정해보세요.</p><span class="textlink">생활권 살펴보기 →</span></a></div></section><section class="section"><h2>집을 기다리는 동안에도, 옥천을 알아가요</h2><div class="two-grid"><div class="soft-card"><h3>살기 전에 궁금했던 것</h3><p>통근, 실제 관리비, 분리수거까지 이웃에게 물어보세요.</p><div class="actions"><a class="btn small" href="#/questions">동네 질문 보기</a><a class="textlink" href="#/ask">직접 물어보기 →</a></div></div><div class="soft-card"><h3>이미 옥천에 살고 있나요?</h3><p>내 생활을 챙기고 새로운 이웃에게 경험을 나누어요.</p><div class="actions"><a class="btn small" href="#/life">내 생활 시작</a><a class="textlink" href="#/review-write">경험 남기기 →</a></div></div></div></section><section class="section"><div class="section-head"><div><div class="section-kicker">OUR NEIGHBORHOOD</div><h2>집 너머의 옥천 이야기</h2><p>일상과 새로 왔어요의 최신 글을 만나보세요.</p></div><a class="textlink" href="#/community/daily">이웃 이야기 →</a></div><div class="community-preview">${communityPreview("일상")}${communityPreview("새로 왔어요")}</div></section><section class="section faq"><h2>시작하기 전, 궁금한 이야기</h2>${[
    [
      "등록하면 언제 연락이 오나요?",
      "조건에 맞는 방의 정보가 확인되면 알려드려요. 알림 시점이나 입주를 보장하지 않으며, 등록 순서에 따른 방 배정이 아닙니다.",
    ],
    [
      "아직 맞는 방이 없으면요?",
      "등록을 유지하고 기다릴 수 있어요. 내 활동에서 조건을 바꾸거나 급한 상황을 문의할 수 있습니다.",
    ],
    [
      "방 등록은 누가 할 수 있나요?",
      "공인중개사 매물과 현재 거주자의 퇴거 예정 정보를 주요 경로로 접수해요. 계속 거주하면서 함께 살 사람을 찾는 모집도 별도로 등록할 수 있어요.",
    ],
  ]
    .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
    .join("")}</section></div>`;
}

/* waitSummary — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function waitSummary(d) {
  return `<dl class="summary-grid">${[
    ["입사 예정", d.startUnknown ? "아직 몰라요" : d.startDate || "해당 없음"],
    ["입주 희망", d.date || "미정"],
    ["기다릴 수 있는 날", d.latestDate || "별도 제한 없음"],
    ["근무 위치·희망 생활권", ([d.workRegion, d.workVillage].filter(Boolean).join(" ") || "미정") + " / " + areaText(d)],
    ["보증금 상한", d.depositUnknown ? "미정" : money(d.deposit)],
    ["월 고정비 상한", d.budgetUnknown ? "미정" : money(d.budget)],
    ["거주 기간", d.duration || "협의·미정"],
    ["필수 조건", d.must || "별도 입력 없음"],
  ]
    .map(([t, v]) => `<div><dt>${t}</dt><dd>${esc(v)}</dd></div>`)
    .join("")}</dl>`;
}

/* uncertainField — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function uncertainField(label, name, d, type = "number") {
  return field(
    label,
    `<input name="${name}" aria-label="${label}" type="${type}" value="${esc(d[name])}" ${type === "number" ? 'min="0" max="100000"' : ""} ${d[name + "Unknown"] ? "disabled" : "required"}><label class="check"><input type="checkbox" name="${name}Unknown" ${d[name + "Unknown"] ? "checked" : ""} ${uiActionAttrs("change", "syncUnknown_26", [name])}>아직 몰라요</label>`,
  );
}

/* syncUnknown — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function syncUnknown(el, name) {
  const i = el.form.elements[name];
  i.disabled = el.checked;
  i.required = !el.checked;
}

/* waitPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function waitPage(step) {
  const d = waitDraft;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    step === "2" &&
    !d.date
  )
    return waitPage("1");
  return `<div class="container">${pageHead("ROOM NEWS, FOR YOU", "곧 나올 방, 어떤 조건으로 알려드릴까요?", "정해진 것부터 남겨주세요. 아직 맞는 방이 없어도 등록할 수 있어요.")}${demoNotice()}<div class="progress-steps"><span class="${step !== "2" ? "current" : "done"}">01 일정과 조건</span><span class="${step === "2" ? "current" : ""}">02 조건과 동의</span></div><div class="form-layout"><aside class="form-aside"><b>${waitEdit ? "알림 조건 수정" : "방 알림 등록"}</b><p class="subtle">${step === "2" ? "선택 조건과 동의를 확인해요.<br>방 소식은 웹 알림함에서 확인하고,<br>필요하면 운영자가 직접 연락해요." : "입사일과 이사일이 달라도 괜찮아요.<br>내 일정에 맞춰 알려주세요."}</p><div class="notice">등록 순서에 따른 배정이나<br>입주 확정을 의미하지 않아요.</div><a href="#/area/wait">생활권 살펴보기 →</a></aside><form id="wait-form">${step === "2" ? waitStepTwo(d) : waitStepOne(d)}${formError()}<div class="form-submit">${step === "2" ? `<button class="textlink" type="button" ${uiActionAttrs("click", "saveWaitDraft_27", [])}>← 일정과 조건 수정</button>` : '<a class="textlink" href="#/">← 홈으로</a>'}<button class="btn" type="submit">${step === "2" ? (waitEdit ? "수정한 조건 저장" : "이 조건으로 방 알림 등록") : "조건과 동의 확인으로 →"}</button></div></form></div></div>`;
}

/* waitStepOne — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function waitStepOne(d) {
  return (
    box(
      "01",
      "지금의 상황과 일정",
      `<div class="fields">${selectField("현재 상황 *", "situation", ["입사 예정", "근무 중·통근 중", "이주 준비", "기타"], d.situation, true)}${selectField("예상 거주 기간 (선택)", "duration", ["협의·미정", "1개월", "3개월", "6개월", "12개월"], d.duration)}${field("입사 예정일", `<input name="startDate" aria-label="입사 예정일" type="date" value="${esc(d.startDate)}" ${d.startUnknown ? "disabled" : ""}><label class="check"><input type="checkbox" name="startUnknown" ${d.startUnknown ? "checked" : ""} ${uiActionAttrs("change", "update_28", [])}>아직 몰라요·해당 없음</label>`)}${inputField("희망 입주일 *", "date", d.date, 'type="date" required')}${inputField("가장 늦게 입주해도 되는 날 (선택)", "latestDate", d.latestDate, 'type="date"')}</div>`,
    ) +
    box(
      "02",
      "직장과 희망 생활권",
      `<div class="fields">${selectField("근무 위치 읍·면 *", "workRegion", regions, d.workRegion, true)}${field("근무 위치 리·마을 (선택)", `<input name="workVillage" aria-label="근무 위치 리·마을" list="work-villages" value="${esc(d.workVillage || "")}" maxlength="40" placeholder="리·마을 이름"><datalist id="work-villages">${options((typeof villageCatalog === "undefined" ? [] : villageCatalog[d.workRegion] || []), "")}</datalist>`, true)}</div><p class="micro">직장명이나 상세 주소는 입력하지 않아도 돼요. 리·마을 이름까지 선택하거나 입력할 수 있어요.</p><div class="field"><label>희망 지역 * · 복수 선택</label>${choice("regions", regions, d.regions || [], true)}<label class="check"><input name="anyRegion" type="checkbox" ${d.anyRegion ? "checked" : ""}>옥천 내 무관</label></div><button class="textlink" type="button" ${uiActionAttrs("click", "saveWaitDraft_29", [])}>생활권 살펴보고 돌아오기 →</button>`,
    ) +
    box(
      "03",
      "내가 생각한 예산",
      `<div class="fields">${uncertainField("보증금 상한 (만 원) *", "deposit", d)}${uncertainField("월 고정비 상한 (만 원) *", "budget", d)}</div><div class="notice">월 고정비 = 월세 + 고정 관리비. 전기·수도·난방 등 사용량에 따른 실비는 별도예요. 미정 금액은 0원으로 처리하지 않습니다.</div>`,
    )
  );
}

/* waitStepTwo — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function waitStepTwo(d) {
  return `<details class="formbox"><summary>남겨주신 일정과 조건 확인</summary>${waitSummary(d)}</details><details class="formbox"><summary>생활 조건을 더 알려주실래요? <span class="subtle">선택</span></summary><div class="fields extra-conditions">${field("가능한 주거 형태", choice("types", types.filter((type) => type !== "고용주 숙소"), (d.types || []).filter((type) => type !== "고용주 숙소"), true), true)}${selectField("주방 사용", "kitchen", ["무관", "공유 가능", "단독 선호", "단독 필수"], d.kitchen)}${selectField("욕실 사용", "bath", ["무관", "공유 가능", "단독 선호", "단독 필수"], d.bath)}${selectField("이동 수단", "transport", ["아직 모름", "자가용", "대중교통", "도보·자전거"], d.transport)}${inputField("통근 시간 상한 (분)", "commute", d.commute, 'type="number" min="1" max="300"')}${field("반드시 필요한 조건", `<textarea name="must" maxlength="500">${esc(d.must)}</textarea>`, true)}${field("조정 가능한 선호", `<textarea name="preferences" maxlength="500">${esc(d.preferences)}</textarea>`, true)}</div></details>${/* 기존 연락 수단 선택·체험 인증은 현재 보류. 신청자 전화번호는 아래 별도 입력란을 사용한다. 재개 시 세션·동의·검증 정책을 먼저 확인한다. ${box("01", "소식을 받을 연락처", `<div class="fields">${inputField("이름 또는 별칭 *", "name", d.name, 'required maxlength="40"')}${inputField("휴대전화 *", "phone", d.phone, 'type="tel" required pattern="0[0-9-]{8,14}" placeholder="010-0000-0000"')}${selectField("방 알림 수단 *", "channel", ["문자", "이메일"], d.channel || "문자", true)}${inputField("이메일 (이메일 알림 선택 시 필수)", "email", d.email, 'type="email"')}${selectField("상담 시 선호 연락 수단 (선택)", "reply", ["문자", "전화", "이메일"], d.reply || "문자")}</div>${verifyUI("phone")}${verifyUI("email")}<p class="micro">휴대전화는 필수 확인해요. 이메일 알림 또는 이메일 상담을 선택하면 이메일도 확인합니다.</p>`)} */ ""}${box("01", "운영자 연락용 전화번호", applicantPhoneField())}${box("02", "동의와 등록", `<label class="check"><input name="privacy" type="checkbox" required ${d.privacy ? "checked" : ""}>[필수] 방 알림 등록을 위한 개인정보 수집·이용에 동의해요.</label><button class="textlink" type="button" ${uiActionAttrs("click", "policy_25", [])}>상세 보기 →</button><label class="check"><input name="serviceConsent" type="checkbox" required ${d.serviceConsent ? "checked" : ""}>[필수] 조건에 맞는 방 소식을 받는 데 동의해요.</label><label class="check"><input name="settlementConsent" type="checkbox" ${d.settlementConsent ? "checked" : ""}>[선택] 정착·첫 1년 할 일 안내도 받을게요.</label><p class="micro">제3자에게 연락처를 전달하는 동의는 포함하지 않습니다. 중개사·집주인에게 전달할 때 받는 곳, 항목, 목적, 보유 기간을 안내하고 별도로 동의받아요.</p>`)} `;
}

// 입력 형식만 검사하며 번호 소유를 인증하거나 Auth 식별자로 사용하지 않는다.
// DB/운영자 권한 구현 전에는 번호를 체험 저장·초안에 보관하지 않는다.
function applicantPhoneField() {
  return inputField("신청자 전화번호 * · 비공개", "phone", "", 'type="tel" required inputmode="tel" autocomplete="tel" maxlength="15" pattern="0[0-9]{1,2}( |-)?[0-9]{3,4}( |-)?[0-9]{4}" placeholder="010-0000-0000"') +
    '<p class="micro">전화번호 인증은 하지 않습니다. 운영자가 신청 확인이나 매물 안내를 위해 직접 연락할 번호를 입력해주세요.</p><p class="micro">제출한 전화번호는 현재 로그인한 계정의 신청에 연결해 저장하며 담당 운영자의 직접 연락에 사용합니다.</p>';
}

/* verifyUI — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function verifyUI(name) {
  return `<div class="verify-box" data-verify="${name}"><b>${name === "phone" ? "휴대전화" : "이메일"} 확인 · 체험</b><div class="verify-row"><input name="${name}Code" aria-label="${name === "phone" ? "휴대전화" : "이메일"} 체험 인증번호" inputmode="numeric" maxlength="6" placeholder="6자리 번호"><button class="btn secondary small" type="button" ${uiActionAttrs("click", "sendDemoCode_30", [name])}>체험 번호 받기</button><button class="btn small" type="button" ${uiActionAttrs("click", "checkDemoCode_31", [name])}>확인</button></div><p class="micro verify-status" aria-live="polite">실제 발송 없이 화면에 체험 인증번호가 표시됩니다.</p></div>`;
}

/* sendDemoCode — 사용자의 요청을 확인하고 관련 신청·등록 절차를 진행합니다. */
function sendDemoCode(button, name) {
  const form = button.form,
    el = form.elements[name];
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !el.value ||
    !el.checkValidity()
  ) {
    el.reportValidity();
    el.focus();
    return;
  }
  const code = String((crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000);
  verification[name] = { value: el.value, code, until: Date.now() + 180000, verified: false };
  const status = form.querySelector(`[data-verify="${name}"] .verify-status`);
  status.textContent = `체험 번호 ${code} · 3분 안에 입력해주세요. 실제 메시지는 발송되지 않았습니다.`;
  button.textContent = "체험 번호 다시 받기";
}

/* checkDemoCode — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function checkDemoCode(button, name) {
  const form = button.form,
    v = verification[name],
    status = form.querySelector(`[data-verify="${name}"] .verify-status`);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !v ||
    v.value !== form.elements[name].value ||
    Date.now() > v.until
  ) {
    status.textContent = "연락처가 바뀌었거나 번호가 만료됐어요. 다시 받아주세요.";
    return;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    form.elements[name + "Code"].value !== v.code
  ) {
    status.textContent = "번호가 맞지 않아요. 화면의 체험 번호를 확인해주세요.";
    return;
  }
  v.verified = true;
  status.textContent = "체험 연락처 확인 완료 · 실제 본인 인증이 아닙니다.";
}

/* verified — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function verified(form, name) {
  const v = verification[name];
  return !!v?.verified && v.value === form.elements[name].value;
}

/* saveWaitDraft — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function saveWaitDraft() {
  const f = $("#wait-form");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!f) return;
  const d = formData(f);
  for (const n of [
    "anyRegion",
    "startUnknown",
    "depositUnknown",
    "budgetUnknown",
    "privacy",
    "serviceConsent",
    "settlementConsent",
  ])
    if (f.elements[n]) d[n] = f.elements[n].checked;
  for (const n of ["phoneCode", "emailCode"]) delete d[n];
  waitDraft = { ...waitDraft, ...d };
  // 이전 체험 초안의 연락처와 직장명은 더 이상 저장하지 않는다.
  for (const key of ["destination", "name", "phone", "email", "reply", "verifiedPhone", "verifiedEmail", "phoneCode", "emailCode"]) delete waitDraft[key];
  if (!window.intakeEnabled) save("wait-draft", waitDraft);
}

/* waitEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function waitEvents(step) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    step === "2" &&
    !waitDraft.date
  )
    step = "1";
  const f = $("#wait-form");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!f) return;
  const sync = () => {
    if (step === "1" && f.elements.workRegion && f.elements.workVillage) {
      const list = f.querySelector("#work-villages");
      if (list) setHTML(list, options((typeof villageCatalog === "undefined" ? [] : villageCatalog[f.elements.workRegion.value] || []), ""));
    }
  };
  sync();
  f.addEventListener("input", () => {
    sync();
    saveWaitDraft();
  });
  f.addEventListener("change", (event) => {
    if (step === "1" && event.target?.name === "workRegion" && f.elements.workVillage) f.elements.workVillage.value = "";
    sync();
    saveWaitDraft();
  });
  f.onsubmit = (e) => {
    e.preventDefault();
    saveWaitDraft();
    const d = waitDraft;
    if (!f.reportValidity()) return;
    if (step !== "2") {
      if (!d.anyRegion && !d.regions?.length)
        return errorForm(f, "희망 지역을 하나 이상 선택하거나 옥천 내 무관을 선택해주세요.");
      if (d.latestDate && d.latestDate < d.date)
        return errorForm(f, "가장 늦은 입주일은 희망 입주일 이후로 정해주세요.");
      location.hash = "/wait/2";
      return;
    }
    // 연락처 체험 인증은 기능 재개 전까지 보류한다.
    // if (!verified(f, "phone") || (f.elements.email.required && !verified(f, "email")))
    //   return errorForm(f, "휴대전화와 선택한 이메일 연락처의 체험 확인을 완료해주세요.");
    if (f.submitting) return;
    f.submitting = true;
    const old = applications.find((a) => a.id === waitEdit && a.kind === "waiting");
    const { destination, name, phone, email, reply, verifiedPhone, verifiedEmail, ...conditions } = d;
    const data = {
      ...conditions,
      region: d.anyRegion ? "" : d.regions.join(", "),
      deposit: d.depositUnknown ? "" : d.deposit,
      budget: d.budgetUnknown ? "" : d.budget,
      channel: "웹 알림함",
    };
    const a = {
      ...old,
      id: old?.id || "W-" + newId().slice(0, 8),
      kind: "waiting",
      data,
      status: old?.status || "대기 중",
      created: old?.created || stamp(),
      history: [
        ...(old?.history || []),
        { time: stamp(), text: old ? "방 알림 조건 수정" : "방 알림 등록 · 확인된 소식 대기" },
      ],
    };
    if (!writeApps(old ? applications.map((x) => (x.id === a.id ? a : x)) : [a, ...applications])) {
      f.submitting = false;
      return;
    }
    waitDraft = {};
    waitEdit = null;
    save("wait-draft", {});
    save("wait-edit", null);
    verification = {};
    location.hash = "/wait-complete/" + a.id;
  };
}

/* waitComplete — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function waitComplete(id) {
  const a = applications.find((a) => a.id === id && a.kind === "waiting");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return notFound();
  return `<div class="container"><div class="result"><div class="result-title"><div class="success">✓</div><h1>조건을 잘 남겨주셨어요.</h1><p>곧 나올 방의 정보를 확인하고, 조건이 맞으면 알려드릴게요.</p></div><div class="notice">지금은 기다리는 단계예요. 바로 매물을 추천하거나 입주를 확정하지 않습니다.</div><div class="summary"><span class="badge">${a.status}</span><h3>내 방 알림 · ${esc(a.id)}</h3>${waitSummary(a.data)}<p class="subtle">등록일 ${labelDate(a.created)} · 웹 알림함</p></div><div class="actions"><a class="btn" href="#/activity">내 방 알림 확인하기 →</a><button class="btn secondary" ${uiActionAttrs("click", "editWaiting_32", [a.id])}>등록 조건 수정</button></div><p class="micro">입주가 급하면 내 활동에서 ‘급한 상황 도움 요청’을 남길 수 있어요.</p><div class="two-grid"><a class="soft-card" href="#/tasks"><h3>기다리는 동안 첫 1년 준비</h3><span class="textlink">내 할 일 →</span></a><a class="soft-card" href="#/community/welcome"><h3>새 이웃에게 먼저 인사해요</h3><span class="textlink">새로 왔어요 →</span></a></div></div></div>`;
}

/* editWaiting — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function editWaiting(id) {
  const a = applications.find((a) => a.id === id && a.kind === "waiting");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return;
  waitDraft = structuredClone(a.data);
  waitEdit = id;
  save("wait-edit", id);
  save("wait-draft", waitDraft);
  verification = {};
  location.hash = "/wait/1";
}

/* activityTabs — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function activityTabs(tab) {
  return `<nav class="tabs activity-tabs" aria-label="내 활동 분류">${[
    ["alerts", "방 알림"],
    ["consultations", "공간 상담"],
    ["tips", "내 제보"],
  ]
    .map(
      ([key, t]) =>
        `<a class="tab ${tab === key ? "active" : ""}" href="#/activity/${key}" ${tab === key ? 'aria-current="page"' : ""}>${t}</a>`,
    )
    .join("")}</nav>`;
}

/* activityPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function activityPage(tab = "alerts") {
  const waits = applications.filter((a) => a.kind === "waiting"),
    consults = applications.filter((a) => a.kind === "consultation"),
    tips = applications.filter((a) => ["tip", "supply"].includes(a.kind));
  return `<div class="container">${pageHead("MY FIRST CHAPTER", "내 활동", "등록한 조건과 도착한 방 소식, 상담과 제보의 진행 상황을 확인해요.")}${demoNotice()}${activityTabs(tab)}<div class="activity-content">${tab === "consultations" ? (consults.length ? consults.map(applicationCard).join("") : '<div class="empty"><h2>아직 신청한 공간 상담이 없어요.</h2><p>도착한 방 소식을 살펴보고 상담을 요청해보세요.</p><a class="btn" href="#/activity">내 방 알림으로</a></div>') : tab === "tips" ? (tips.length ? tips.map(tipCard).join("") : '<div class="empty"><h2>아직 남긴 방 정보가 없어요.</h2><a class="btn" href="#/provide">곧 비는 방 알려주기</a></div>') : waits.length ? waits.map(waitCard).join("") : '<div class="empty"><div class="empty-symbol">⌂</div><h2>어떤 방 소식을 기다리고 있나요?</h2><p class="subtle">입사·입주 일정과 조건을 남겨주세요.</p><a class="btn" href="#/wait">방 알림 등록하기 →</a></div>'}${
    tab === "alerts" && applications.some((a) => a.kind === "housing")
      ? `<details class="formbox"><summary>이전에 작성한 주거 신청 기록</summary><p class="micro">이전 신청은 보관되어 있습니다. 새 방 알림을 받으려면 알림 조건을 등록해주세요.</p>${applications
          .filter((a) => a.kind === "housing")
          .map(
            (a) =>
              `<article class="application"><h3>${esc(a.id)} · ${esc(a.status)}</h3>${conditionSummary(a.data)}<button class="textlink" ${uiActionAttrs("click", "migrateWaiting_33", [a.id])}>이 조건으로 방 알림 등록 →</button><button class="textlink" ${uiActionAttrs("click", "showHistory_23", [a.id])}>진행 기록</button></article>`,
          )
          .join("")}</details>`
      : ""
  }</div></div>`;
}

/* migrateWaiting — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function migrateWaiting(id) {
  const a = applications.find((a) => a.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return;
  waitDraft = {
    ...a.data,
    regions: a.data.region ? [a.data.region] : [],
    anyRegion: !a.data.region,
    depositUnknown: a.data.deposit === "",
    budgetUnknown: a.data.budget === "",
  };
  save("wait-draft", waitDraft);
  location.hash = "/wait";
}

/* waitCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function waitCard(a) {
  const ns = alerts.filter((n) => n.waitId === a.id),
    paused = a.status === "일시 중단",
    done = a.status === "집 구함";
  return `<section class="formbox wait-card"><div class="application-top"><div><span class="subtle">${esc(a.id)} · ${labelDate(a.created)} 등록</span><h2>내가 기다리는 방</h2></div><span class="badge ${paused || done ? "orange" : ""}">${esc(a.status)}</span></div>${waitSummary(a.data)}<p class="subtle">알림 수단: 웹 알림함</p><div class="actions"><button class="btn secondary small" ${uiActionAttrs("click", "editWaiting_32", [a.id])}>조건 수정</button>${!done ? `<button class="btn small" ${uiActionAttrs("click", "waitingAction_34", [a.id])}>집을 구했어요</button><button class="textlink" ${uiActionAttrs("click", "waitingAction_35", [a.id, paused ? "대기 중" : "일시 중단"])}>${paused ? "알림 다시 받기" : "알림 잠시 중단"}</button>` : ""}<button class="textlink" ${uiActionAttrs("click", "waitPreferences_38", [a.id])}>알림 동의 설정</button><button class="textlink danger" ${uiActionAttrs("click", "waitingAction_39", [a.id])}>등록 삭제</button></div></section>${done || paused ? `<div class="notice">${done ? "집을 구하셨군요! 방 알림을 종료했어요." : "방 알림을 잠시 멈췄어요. 등록 조건은 유지됩니다."} 기존 공간 상담은 별도로 유지됩니다. <a class="textlink" href="#/tasks">첫 1년 할 일 →</a></div>` : ""}${ns.length ? `<div class="section-head"><h2>도착한 방 소식</h2><span class="subtle">${ns.length}건 · 변경·마감 기록 포함</span></div>${ns.map(alertCard).join("")}` : `<div class="waiting-empty"><span class="waiting-orbit">⌂</span><h2>아직 조건에 맞는 방 소식이 없어요.</h2><p>안내 가능한 정보가 확인되면 조건을 비교해요.<br>기다리는 동안 등록한 조건을 바꿀 수 있어요.</p><span class="badge">등록 조건 유지 중</span></div>`}${!done ? `<details class="formbox"><summary>입주가 급한가요? 급한 상황 도움 요청</summary><p class="subtle">등록한 조건과 함께 체험 요청을 보관합니다. 연결 시점이나 거처 확보를 보장하지 않아요.</p><form ${uiActionAttrs("submit", "urgentHelp_36", [a.id])}><textarea name="message" aria-label="급한 상황 설명" required maxlength="1000" placeholder="입주가 필요한 날짜와 급한 상황을 알려주세요."></textarea><button class="btn small" style="margin-top:12px">도움 요청 남기기</button></form>${(a.urgent || []).map((u) => `<p class="subtle">${labelDate(u.time)} · ${esc(u.message)}</p>`).join("")}</details>` : ""}<div class="two-grid section"><a class="soft-card" href="#/tasks"><h3>기다리는 동안 준비해요</h3><span class="textlink">첫 1년 할 일 →</span></a><a class="soft-card" href="#/area"><h3>내가 살 동네를 알아가요</h3><span class="textlink">생활권 지도 →</span></a></div>${!ns.length && !paused && !done ? `<details class="demo-lab"><summary>예시 알림 화면 체험</summary><p>실제 확인된 방이 아닌 가상 원룸으로 알림·상담 흐름을 미리 볼 수 있어요. 내 조건과 맞지 않는 부분은 따로 표시됩니다.</p><button class="btn secondary small" ${uiActionAttrs("click", "demoAlert_37", [a.id])}>가상 방 알림 추가</button></details>` : ""}`;
}

/* waitingAction — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function waitingAction(id, status) {
  const current = applications.find((a) => a.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!current) return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    status === "대기 중" &&
    !current.data.serviceConsent
  ) {
    waitPreferences(id);
    toast("방 소식 알림에 다시 동의한 뒤 재개해주세요.");
    return;
  }
  const copy = {
    삭제: [
      "방 알림 등록을 삭제할까요?",
      "이 브라우저에서 등록 조건·도움 요청·방 알림을 삭제합니다. 기존 상담과 제출 당시 조건 사본은 상담 기록으로 남아요. 삭제한 등록은 복구할 수 없습니다.",
    ],
    "집 구함": [
      "집을 구하셨군요!",
      "방 알림만 종료합니다. 이미 진행 중인 공간 상담은 자동 취소되지 않아요.",
    ],
    "일시 중단": [
      "방 알림을 잠시 멈출까요?",
      "등록 조건은 보관하고 새 알림을 중단합니다. 원할 때 다시 받을 수 있어요.",
    ],
    "대기 중": [
      "방 알림을 다시 받을까요?",
      "저장한 조건으로 다시 기다립니다. 필요하면 조건부터 수정해주세요.",
    ],
  }[status];
  modal(
    `<h2>${copy[0]}</h2><p>${copy[1]}</p><div class="modal-actions"><button class="btn secondary" ${uiActionAttrs("click", "closeModal_1", [])}>돌아가기</button><button class="btn" id="wait-action-confirm">${status === "삭제" ? "등록 삭제" : status === "집 구함" ? "알림 종료하고 할 일 보기" : "확인"}</button></div>`,
  );
  $("#wait-action-confirm").onclick = () => {
    if (status === "삭제") {
      const nextAlerts = alerts.filter((n) => n.waitId !== id);
      if (!writeApps(applications.filter((a) => a.id !== id))) return;
      if (waitEdit === id) {
        waitEdit = null;
        waitDraft = {};
        save("wait-edit", null);
        save("wait-draft", {});
      }
      alerts = nextAlerts;
      save("alerts", alerts);
    } else if (!patchApp(id, { status }, "신청자: " + status)) return;
    closeModal();
    if (status === "집 구함") location.hash = "/tasks";
    else render(false);
  };
}

/* waitPreferences — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function waitPreferences(id) {
  const a = applications.find((a) => a.id === id);
  modal(
    `<h2>알림 동의 설정</h2><form id="preferences-form"><label class="check"><input type="checkbox" name="service" ${a.data.serviceConsent ? "checked" : ""}>방 소식 알림</label><label class="check"><input type="checkbox" name="settlement" ${a.data.settlementConsent ? "checked" : ""}>정착·첫 1년 할 일 안내</label><p class="micro">방 소식 동의를 해제하면 알림을 일시 중단합니다. 다시 동의하면 내 활동에서 알림을 재개할 수 있어요.</p><button class="btn">설정 저장</button></form>`,
  );
  $("#preferences-form").onsubmit = (e) => {
    e.preventDefault();
    const service = e.target.elements.service.checked;
    if (
      patchApp(
        id,
        {
          data: {
            ...a.data,
            serviceConsent: service,
            settlementConsent: e.target.elements.settlement.checked,
          },
          status: service ? a.status : a.status === "집 구함" ? "집 구함" : "일시 중단",
        },
        "알림 동의 설정 변경",
      )
    ) {
      closeModal();
      render(false);
    }
  };
}

/* urgentHelp — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function urgentHelp(e, id) {
  e.preventDefault();
  const a = applications.find((a) => a.id === id),
    message = e.target.elements.message.value.trim();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!message) return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    patchApp(
      id,
      {
        urgent: [
          ...(a.urgent || []),
          { time: stamp(), message, conditions: structuredClone(a.data) },
        ],
      },
      "급한 상황 도움 요청",
    )
  ) {
    modal(
      `<h2>도움 요청을 남겼어요.</h2><p>등록 조건과 함께 현재 브라우저에 저장했습니다. 실제 운영팀에 전송되지는 않았어요.</p><button class="btn" ${uiActionAttrs("click", "closeModal_40", [])}>확인</button>`,
    );
  }
}

/* compareConditions — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function compareConditions(d, h) {
  const passed = [],
    unknown = [],
    mismatch = [];
  const check = (label, known, yes) =>
    !known ? unknown.push(label) : yes ? passed.push(label) : mismatch.push(label);
  check("입주 일정", !!h.date, !!d.date && h.date <= d.date);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!d.anyRegion)
    check("희망 지역", !!h.region, (d.regions || [d.region]).includes(h.region));
  if (!d.depositUnknown && d.deposit !== "")
    check("보증금", h.deposit != null, h.deposit <= Number(d.deposit));
  if (!d.budgetUnknown && d.budget !== "")
    check("월 고정비", h.rent != null && h.fee != null, h.rent + h.fee <= Number(d.budget));
  if (d.types?.length) check("주거 형태", !!h.type, d.types.includes(h.type));
  for (const k of ["bath", "kitchen"])
    if (d[k] === "단독 필수")
      check(k === "bath" ? "욕실 단독" : "주방 단독", !!h[k], h[k] === "단독");
  const months = parseInt(d.duration);
  if (months)
    check("거주 기간", h.min != null && h.max != null, months >= h.min && months <= h.max);
  if (d.must) unknown.push("직접 적은 필수 조건");
  if (d.commute) unknown.push("통근 시간");
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return { passed, unknown, mismatch };
}

/* comparisonHTML — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function comparisonHTML(c) {
  return `<div class="comparison"><div><b>확인한 조건</b><span>${esc(c.passed.join(" · ") || "없음")}</span></div>${c.mismatch.length ? `<div class="mismatch"><b>맞지 않는 조건</b><span>${esc(c.mismatch.join(" · "))}</span></div>` : ""}${c.unknown.length ? `<div><b>추가 확인</b><span>${esc(c.unknown.join(" · "))}</span></div>` : ""}</div>`;
}

/* demoAlert — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function demoAlert(waitId) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    alerts.some((n) => n.waitId === waitId && n.demo)
  )
    return;
  const a = applications.find((a) => a.id === waitId);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !a ||
    a.status !== "대기 중" ||
    !a.data.serviceConsent
  ) {
    toast("방 알림 동의와 대기 상태를 확인해주세요.");
    return;
  }
  const h = { ...homes.find((h) => h.id === "C"), date: "2026-11-10", min: 6 };
  const n = {
    id: "N-" + newId().slice(0, 8),
    waitId,
    listingId: h.id,
    snapshot: h,
    status: "새 소식",
    demo: true,
    created: stamp(),
    verification: {
      by: "체험 운영팀 (가상)",
      date: stamp().slice(0, 10),
      note: "임대 의사·안내 권한·비용·일정 확인을 가정한 예시. 현장 방문 미확인.",
    },
    history: [],
  };
  if (save("alerts", [n, ...alerts])) {
    alerts = [n, ...alerts];
    render(false);
  }
}

/* alertCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function alertCard(n) {
  const a = applications.find((a) => a.id === n.waitId),
    h = n.snapshot,
    c = compareConditions(a?.data || {}, h),
    closed = n.status === "마감";
  return `<article class="alert-card"><div class="alert-visual">${room(h)}</div><div class="alert-body"><div class="application-top"><span class="badge">${esc(n.status)}${n.demo ? " · 가상 예시" : ""}</span><span class="subtle">${labelDate(n.created)}</span></div><h3>${esc(h.name)}</h3><p class="subtle">${esc(h.region)} · ${esc(h.type)} · 입주 ${esc(h.date || "미확인")}</p><div class="price">${cost(h)} <small>/ 월 고정비</small></div><p class="subtle">보증금 ${money(h.deposit)} · 월세 ${money(h.rent)} + 관리비 ${money(h.fee)}</p>${comparisonHTML(c)}<p class="micro">${esc(n.verification.by)} · ${esc(n.verification.date)}<br>${esc(n.verification.note)}</p>${n.changes?.length ? `<details><summary>정보 변경 이력</summary>${n.changes.map((x) => `<p class="micro">${esc(x.date)} · ${esc(x.text)}</p>`).join("")}</details>` : ""}<div class="actions">${closed ? '<button class="btn" disabled>마감되어 상담할 수 없어요</button>' : `<a class="btn small" href="#/alert/${n.id}">공간 정보 확인하고 상담하기 →</a><button class="textlink" ${uiActionAttrs("click", "skipAlert_41", [n.id])}>이번 방은 건너뛰기</button>`}</div>${n.skipReason ? `<p class="micro">건너뛴 이유: ${esc(n.skipReason)}</p>` : ""}</div></article>`;
}

/* skipAlert — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function skipAlert(id) {
  modal(
    `<h2>이번 방은 건너뛸까요?</h2><p>다른 방 소식은 계속 받을 수 있어요. 이유는 선택 사항입니다.</p><form id="skip-form"><textarea name="reason" aria-label="건너뛰는 이유" maxlength="500" placeholder="예: 원하는 입주 시기와 달라요 (선택)"></textarea><div class="modal-actions"><button class="btn">건너뛰기</button></div></form>`,
  );
  $("#skip-form").onsubmit = (e) => {
    e.preventDefault();
    const next = alerts.map((n) =>
      n.id === id ? { ...n, status: "건너뜀", skipReason: e.target.elements.reason.value } : n,
    );
    if (save("alerts", next)) {
      alerts = next;
      closeModal();
      render(false);
    }
  };
}

/* originalConsultPage — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalConsultPage = consultationPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
consultationPage = function (id, parentId) {
  const n = alerts.find((n) => n.listingId === id && n.waitId === parentId);
  if (n?.status === "마감")
    return `<div class="container">${pageHead("ROOM NEWS", "마감된 방 소식이에요.")}<div class="notice">기록은 남아 있지만 새 상담을 신청할 수 없습니다.</div><a class="btn" href="#/activity">내 방 알림으로</a>${spaceDetailContent(n.snapshot)}</div>`;
  let html = originalConsultPage(id, parentId);
  html = html
    .replace('href="#/home/' + id + (parentId ? "/" + parentId : "") + '"', 'href="#/activity"')
    .replace("← 공간 상세로 돌아가기", "← 내 방 알림으로");
  if (n) {
    const a = housingSource(parentId);
    html = html.replace(
      '<section class="consultation-form-wrap"',
      `<div class="formbox"><h2>등록 조건과 비교</h2>${comparisonHTML(compareConditions(a?.data || {}, n.snapshot))}<p class="micro">확인 기록: ${esc(n.verification.by)} · ${esc(n.verification.date)}<br>${esc(n.verification.note)}</p></div><section class="consultation-form-wrap"`,
    );
  }
  html = html.replace(
    '<label class="check"><input name="consent"',
    `<div class="notice">이번 상담에서 수정한 입주·생활 조건은 원래 방 알림 조건을 바꾸지 않아요.</div><label class="check"><input name="consent"`,
  );
  html = html.replace(
    '</label></section><div class="form-submit">',
    `</label><div class="notice">외부 연결 동의는 별도로 받아요. 현재 담당 중개사와 보유 기간이 정해지지 않아 외부 전달은 진행하지 않습니다.</div><label class="check"><input type="checkbox" disabled>담당 중개사 전달 동의 · 연결 정보 확정 후 가능</label></section><div class="form-submit">`,
  );
  return html;
};

/* alertPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function alertPage(id) {
  const n = alerts.find((n) => n.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!n) return notFound();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    n.status === "새 소식"
  ) {
    const next = alerts.map((x) => (x.id === id ? { ...x, status: "확인함", readAt: stamp() } : x));
    if (save("alerts", next)) alerts = next;
  }
  const i = homes.findIndex((h) => h.id === n.listingId);
  if (i >= 0) homes[i] = { ...n.snapshot, verification: n.verification };
  else homes.push({ ...n.snapshot, verification: n.verification });
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return consultationPage(
    n.listingId,
    n.waitId,
  );
}

/* originalSubmitConsult — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalSubmitConsult = submitSpaceConsultation;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submitSpaceConsultation = function (id, parentId, d) {
  if (alerts.some((n) => n.listingId === id && n.waitId === parentId && n.status === "마감")) {
    toast("마감된 공간입니다.");
    return null;
  }
  const a = originalSubmitConsult(id, parentId, d);
  if (a) {
    const next = alerts.map((n) =>
      n.listingId === id && n.waitId === parentId ? { ...n, status: "상담 요청" } : n,
    );
    if (save("alerts", next)) alerts = next;
  }
  return a;
};

/* originalConsultDetail — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalConsultDetail = consultationDetailPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
consultationDetailPage = function (id) {
  const a = applications.find((a) => a.id === id && a.kind === "consultation");
  let html = originalConsultDetail(id);
  if (!a) return html;
  const n = alerts.find((n) => n.waitId === a.parentId && n.listingId === a.listingId);
  const extra = `<div class="formbox"><h2>이어갈 일</h2>${n?.status === "마감" ? '<div class="notice warning">이 공간은 현재 마감되었습니다. 아래 제출 당시 정보와 구분해 확인해주세요.</div>' : ""}<p>상담 취소와 방 알림 중단은 별도로 처리합니다.</p><div class="actions">${housingSource(a.parentId)?.kind === "waiting" ? `<button class="btn" ${uiActionAttrs("click", "waitingAction_34", [a.parentId])}>집을 구했어요</button>` : ""}<button class="btn secondary" ${uiActionAttrs("click", "additionalMessage_42", [a.id])}>추가 문의 남기기</button></div>${(a.messages || []).map((m) => `<p class="subtle">${labelDate(m.time)} · ${esc(m.text)}</p>`).join("")}</div>`;
  return html
    .replace(
      '<section class="consultation-form-wrap">',
      '<section class="consultation-form-wrap">' + extra,
    )
    .replace(/href="#\/result\/[^\"]+"/g, 'href="#/activity"');
};

/* additionalMessage — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function additionalMessage(id) {
  modal(
    `<h2>상담에 추가로 남길 내용</h2><form id="extra-message"><textarea name="message" required maxlength="2000" aria-label="추가 문의 내용"></textarea><button class="btn">내용 저장</button></form>`,
  );
  $("#extra-message").onsubmit = (e) => {
    e.preventDefault();
    const a = applications.find((a) => a.id === id),
      text = e.target.elements.message.value.trim();
    if (
      text &&
      patchApp(id, { messages: [...(a.messages || []), { time: stamp(), text }] }, "추가 문의 저장")
    ) {
      closeModal();
      render(false);
    }
  };
}

/* cancelRequest — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function cancelRequest(id) {
  modal(
    `<h2>이 상담·신청을 취소할까요?</h2><p>현재 신청만 취소합니다. 등록한 방 알림과 다른 상담은 그대로 유지됩니다.</p><div class="modal-actions"><button class="btn secondary" ${uiActionAttrs("click", "closeModal_1", [])}>유지하기</button><button class="btn" ${uiActionAttrs("click", "confirmCancel_43", [id])}>취소하기</button></div>`,
  );
}

/* providePage — 사용자의 요청을 확인하고 관련 신청·등록 절차를 진행합니다. */
function providePage(role = "tenant") {
  const d = tipDraft,
    tenant = role !== "owner";
  return `<div class="container">${pageHead("SHARE A ROOM, START A CHAPTER", tenant ? "곧 비는 방의 소식을 알려주세요." : "청년의 첫 거처가 될 공간이 있나요?", tenant ? "곧 이사하는 세입자도 알려주실 수 있어요. 정확한 주소와 제보는 비공개로 접수합니다." : "현재 비어 있거나 곧 제공할 공간을 알려주세요. 접수 즉시 공개되거나 발송되지 않습니다.")}${demoNotice()}<div class="tabs"><a class="tab ${tenant ? "active" : ""}" href="#/provide/tenant">곧 나가는 세입자·기타 제보자</a><a class="tab ${!tenant ? "active" : ""}" href="#/provide/owner">소유자·담당자·고용주</a></div><div class="form-layout"><aside class="form-aside"><b>방 정보 알려주기</b><p class="subtle">01 역할·연락<br>02 일정·위치<br>03 ${tenant ? "집주인 연락·동의" : "조건·사진·동의"}</p><div class="notice">퇴거 예정 정보와<br>집주인의 임대 의사는 달라요.<br>확인 전에는 알림을 보내지 않습니다.</div></aside><form id="tip-form">${box("01", "어떤 입장에서 알려주시나요?", `<div class="fields">${selectField("신청자 역할 *", "role", tenant ? ["곧 나가는 세입자", "기타 제보자"] : ["소유자", "위임받은 담당자", "고용주"], d.role || (tenant ? "곧 나가는 세입자" : "소유자"), true)}${inputField("이름 또는 기관명 *", "name", d.name, 'required maxlength="50"')}${inputField("휴대전화 *", "phone", d.phone, 'type="tel" required pattern="0[0-9-]{8,14}" placeholder="010-0000-0000"')}${!tenant ? selectField("제공 권한 확인 *", "authority", ["소유·제공 권한 있음", "소유자 동의 확인", "단순 제보"], d.authority, true) : ""}</div>${verifyUI("phone")}`)}${box("02", tenant ? "퇴거 예정 일정과 공간" : "공간과 제공 일정", `<div class="fields">${tenant ? inputField("퇴거 예정일 *", "leaveDate", d.leaveDate, 'type="date" required') + selectField("일정의 확실성 *", "certainty", ["확정", "예상"], d.certainty, true) : uncertainField("실제 입주 가능일 *", "date", d, "date")}${selectField("공간 유형 *", "type", ["빈집", ...types, "기타"], d.type, true)}${selectField("읍·면 *", "region", regions, d.region, true)}${inputField("주소 * · 비공개", "address", d.address, 'required maxlength="150" placeholder="예시 도로명 주소 직접 입력"')}${inputField("동·호수 (선택) · 비공개", "unit", d.unit, 'maxlength="100"')}${tenant ? field("알고 있는 정보 (선택)", `<textarea name="known" maxlength="1000" placeholder="현재 월세·관리비, 공유 시설, 수리 필요 사항">${esc(d.known)}</textarea>`, true) : inputField("제공 가능한 방 수 *", "rooms", d.rooms, 'type="number" min="1" max="100" required') + inputField("거주 가능 인원 (선택)", "people", d.people, 'type="number" min="1" max="100"')}</div><p class="micro">${tenant ? "퇴거일과 다음 입주 가능일은 다를 수 있어요. 현재 계약 조건은 참고 정보이며 새 임대 조건은 별도 확인합니다." : "청소·수리 일정을 반영한 실제 입주 가능일을 남겨주세요."}<br>주소 검색은 연결되지 않아 직접 입력합니다. 정확한 위치는 공개 지도·커뮤니티에 표시하지 않아요.</p>`)}${tenant ? box("03", "집주인에게 알려도 될까요?", `<div class="fields">${selectField("집주인에게 퇴거 의사를 전달했나요? *", "landlordAware", ["전달했어요", "아직 전달하지 않았어요"], d.landlordAware, true)}${selectField("다음 연락 방법 *", "nextContact", ["먼저 저와 상의해주세요", "집주인 연결 방법을 안내해주세요"], d.nextContact, true)}</div><label class="check"><input name="forwardPermission" type="checkbox" ${d.forwardPermission ? "checked" : ""}>[선택] 이 퇴거 예정 정보를 집주인에게 알려도 됩니다.</label><div class="notice">동의하지 않아도 접수할 수 있어요. 이 경우 제보자에게만 연락합니다. 집주인의 연락처를 대신 입력받지 않아요.<br>이 동의는 임대·광고 권한이나 제보자 이름·연락처 전달 동의를 대신하지 않습니다.</div>`) : box("03", "제공 기간과 비용", `<div class="fields">${inputField("최소 제공 기간 (개월) *", "min", d.min, 'type="number" min="1" max="120" required')}${inputField("최대 제공 기간 (개월) *", "max", d.max, 'type="number" min="1" max="120" required')}${uncertainField("보증금 (만 원) *", "deposit", d)}${uncertainField("월세 (만 원) *", "rent", d)}${uncertainField("고정 관리비 (만 원) *", "fee", d)}${inputField("추가 비용 기준 (선택)", "costNote", d.costNote, 'maxlength="200" placeholder="개별 계량 / 인원별 분담"')}${field("별도 실비 항목", choice("utilities", ["전기", "수도", "난방", "인터넷", "기타"], d.utilities || [], true), true)}</div><p class="micro">미정 금액은 0원이 아닌 ‘미확인’으로 안내합니다.</p>`) + box("04", "시설과 생활 조건", `<div class="fields">${selectField("현재 공간 상태 *", "condition", ["바로 확인 가능", "작은 수선 필요", "큰 수선 필요"], d.condition, true)}${selectField("주방 사용 방식 *", "kitchen", ["단독", "공유", "미확인"], d.kitchen, true)}${selectField("욕실 사용 방식 *", "bath", ["단독", "공유", "미확인"], d.bath, true)}${inputField("연락·현장 확인 가능한 시간 *", "contactTime", d.contactTime, 'required maxlength="100"')}${field("시설·안전·위생 상태", `<textarea name="facilities" maxlength="1000" placeholder="난방·온수·누수·환기·잠금장치">${esc(d.facilities)}</textarea>`, true)}${field("생활 규칙과 수선 계획", `<textarea name="rules" maxlength="1000" placeholder="흡연·반려동물·이용 자격 / 수선 담당과 완료 예정일">${esc(d.rules)}</textarea>`, true)}${field("공간 사진 (선택)", `<input type="file" id="tip-photos" accept="image/jpeg,image/png,image/webp" multiple><p class="micro">최대 5장 · 사람·우편물·연락처가 드러난 사진은 제외해주세요.</p><div id="tip-preview" class="upload-preview"></div>`, true)}</div>`)}${box("✓", "접수 전 확인", `<label class="check"><input name="privacy" type="checkbox" required>[필수] 제보 접수·확인을 위한 개인정보 수집·이용에 동의합니다.</label><button class="textlink" type="button" ${uiActionAttrs("click", "policy_25", [])}>상세 보기 →</button><p class="micro">안내할 정보·사진 범위와 외부 담당자 연결은 확인 후 별도로 동의받아요.</p>`)}${formError()}<button type="submit" class="btn">${tenant ? "퇴거 예정 정보 보내기" : "공간 제공 신청"} →</button></form></div></div>`;
}

/* provideEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function provideEvents(role = "tenant") {
  const f = $("#tip-form");
  let photos = [],
    loading = false;
  verification = {};
  const draft = () => {
    const d = formData(f);
    for (const n of [
      "forwardPermission",
      "dateUnknown",
      "depositUnknown",
      "rentUnknown",
      "feeUnknown",
    ])
      if (f.elements[n]) d[n] = f.elements[n].checked;
    delete d.phoneCode;
    delete d.privacy;
    delete d.photos;
    tipDraft = { ...tipDraft, ...d };
    save("tip-draft", tipDraft);
  };
  f.addEventListener("input", draft);
  f.addEventListener("change", draft);
  if ($("#tip-photos"))
    $("#tip-photos").onchange = async (e) => {
      loading = true;
      try {
        photos = await prepareImages([...e.target.files]);
        setHTML($("#tip-preview"), photos
          .map((s) => `<img src="${esc(s)}" alt="공간 사진 미리보기">`)
          .join(""));
      } catch (err) {
        photos = [];
        toast(err.message);
      } finally {
        loading = false;
      }
    };
  f.onsubmit = (e) => {
    e.preventDefault();
    draft();
    if (!f.reportValidity()) return;
    if (!verified(f, "phone")) return errorForm(f, "휴대전화의 체험 연락처 확인을 완료해주세요.");
    if (loading) return errorForm(f, "사진 처리가 끝날 때까지 기다려주세요.");
    if (role === "owner" && Number(tipDraft.min) > Number(tipDraft.max))
      return errorForm(f, "최대 제공 기간은 최소 기간 이상이어야 해요.");
    const d = formData(f);
    for (const n of [
      "forwardPermission",
      "dateUnknown",
      "depositUnknown",
      "rentUnknown",
      "feeUnknown",
    ])
      if (f.elements[n]) d[n] = f.elements[n].checked;
    delete d.phoneCode;
    if (f.submitting) return;
    f.submitting = true;
    const a = {
      id: "T-" + newId().slice(0, 8),
      kind: "tip",
      mode: role === "owner" ? "owner" : "tenant",
      data: d,
      photos,
      status: "접수",
      created: stamp(),
      history: [{ time: stamp(), text: "비공개 방 정보 체험 접수" }],
    };
    if (!writeApps([a, ...applications])) {
      f.submitting = false;
      return;
    }
    tipDraft = {};
    save("tip-draft", {});
    verification = {};
    location.hash = "/tip/" + a.id;
  };
}

/* tipCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function tipCard(a) {
  return `<article class="application"><div class="application-top"><div><span class="subtle">${esc(a.id)} · ${labelDate(a.created)}</span><h3>${esc(a.data.region || "옥천")} · ${esc(a.data.type || "방 정보")}</h3></div><span class="badge">${esc(a.status)}</span></div><p>신청자 역할: ${esc(a.data.role || "공간 제공자")} · ${a.mode === "tenant" ? "퇴거 예정" : "입주 가능"} ${esc(a.data.leaveDate || a.data.date || "미정")}</p><p class="micro">비공개 접수 · 정확한 주소와 연락처는 공개되지 않습니다.</p><a class="btn secondary small" href="#/tip/${a.id}">제보 내용·진행 상태 보기</a></article>`;
}

/* tipDetail — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function tipDetail(id) {
  const a = applications.find((a) => a.id === id && ["tip", "supply"].includes(a.kind));
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return notFound();
  return `<div class="container">${pageHead("THANK YOU FOR SHARING", "방 정보를 받았어요.", "정보 확인 전에는 공개하거나 방 알림으로 보내지 않습니다.")}${activityTabs("tips")}<div class="activity-content"><div class="summary"><span class="badge">${esc(a.status)}</span><h2>${esc(a.data.region)} · ${esc(a.data.type)}</h2><p class="subtle">${esc(a.id)} · ${esc(a.data.role || "제공자")} · ${labelDate(a.created)}</p><dl class="summary-grid">${[
    ["일정", a.data.leaveDate || a.data.date || "미정"],
    ["일정 확실성", a.data.certainty || "제공 가능 일정"],
    ["비공개 주소", a.data.address + " " + (a.data.unit || "")],
    ["연락 방법", a.data.nextContact || a.data.contactTime || "확인 필요"],
    [
      "퇴거 정보 전달 허용",
      a.mode === "tenant"
        ? a.data.forwardPermission
          ? "허용 · 개인정보 전달은 별도 동의"
          : "허용하지 않음"
        : "별도 확인",
    ],
    ["참고 정보", a.data.known || a.data.rules || "없음"],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join(
      "",
    )}</dl></div><div class="four-steps">${["접수", "확인", "안내 판단", "조건 비교"].map((t, i) => `<div><span>0${i + 1}</span><h3>${t}</h3></div>`).join("")}</div>${a.mode === "tenant" && !a.data.forwardPermission ? '<div class="notice">집주인에게 정보 전달을 허용하지 않았어요. 제보자와 먼저 상의하며, 추가 확인 전에는 방 알림을 보내지 않습니다.</div>' : ""}<details class="formbox"><summary>내가 작성한 전체 제보 내용</summary>${tipDataRows(a.data)}${(a.photos || []).length ? `<div class="upload-preview">${a.photos.map((s) => `<img src="${esc(s)}" alt="비공개 제보 사진">`).join("")}</div>` : ""}</details><div class="actions">${a.status !== "철회·마감" ? `<button class="btn" ${uiActionAttrs("click", "tipChange_44", [a.id])}>제보 내용 수정 요청</button><button class="btn secondary" ${uiActionAttrs("click", "tipChange_45", [a.id])}>제보 철회</button>` : ""}<button class="textlink" ${uiActionAttrs("click", "showHistory_23", [a.id])}>진행 기록</button><a class="textlink" href="#/activity/tips">내 활동으로 →</a></div></div></div>`;
}

/* tipDataRows — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function tipDataRows(d) {
  const labels = {
    role: "신청자 역할",
    name: "이름·기관명",
    phone: "휴대전화",
    authority: "제공 권한",
    leaveDate: "퇴거 예정일",
    certainty: "일정 확실성",
    date: "입주 가능일",
    dateUnknown: "입주일 미정",
    type: "공간 유형",
    region: "읍·면",
    address: "비공개 주소",
    unit: "동·호수",
    rooms: "방 수",
    people: "거주 인원",
    known: "참고 정보",
    landlordAware: "집주인 전달 여부",
    nextContact: "다음 연락 방법",
    forwardPermission: "퇴거 정보 전달 허용",
    min: "최소 기간 (개월)",
    max: "최대 기간 (개월)",
    deposit: "보증금 (만 원)",
    rent: "월세 (만 원)",
    fee: "고정 관리비 (만 원)",
    depositUnknown: "보증금 미정",
    rentUnknown: "월세 미정",
    feeUnknown: "관리비 미정",
    utilities: "별도 실비",
    costNote: "비용 기준",
    condition: "공간 상태",
    kitchen: "주방",
    bath: "욕실",
    contactTime: "연락 가능 시간",
    facilities: "시설 상태",
    rules: "생활 규칙",
    privacy: "개인정보 동의",
  };
  return `<dl class="consultation-answer-list">${Object.entries(d)
    .filter(([k]) => labels[k])
    .map(
      ([k, v]) =>
        `<div><dt>${labels[k]}</dt><dd>${esc(typeof v === "boolean" ? (v ? "예" : "아니요") : Array.isArray(v) ? v.join(", ") : v || "미입력")}</dd></div>`,
    )
    .join("")}</dl>`;
}

/* tipChange — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function tipChange(id, withdraw) {
  const a = applications.find((a) => a.id === id);
  modal(
    `<h2>${withdraw ? "제보를 철회할까요?" : "수정할 내용을 알려주세요."}</h2><p>${withdraw ? "안내 전·후 모두 철회할 수 있어요. 이미 안내한 방 소식은 마감 처리하고 변경 사실을 기록합니다." : "정확한 최신 내용을 남겨주세요. 다시 확인하기 전까지 새 알림 안내를 보류합니다."}</p><form id="tip-change"><textarea name="note" ${withdraw ? "" : "required"} maxlength="1000" aria-label="변경 내용" placeholder="변경 내용 또는 철회 사유 (철회 시 선택)"></textarea><div class="modal-actions"><button class="btn">${withdraw ? "제보 철회" : "수정 요청 저장"}</button></div></form>`,
  );
  $("#tip-change").onsubmit = (e) => {
    e.preventDefault();
    const note = e.target.elements.note.value;
    if (
      patchApp(
        id,
        { status: withdraw ? "철회·마감" : "확인 중", review: null },
        (withdraw ? "제보 철회" : "제보 수정 요청") + ": " + note,
      )
    ) {
      const next = alerts.map((n) =>
        n.tipId === id
          ? {
              ...n,
              status: "마감",
              changes: [
                ...(n.changes || []),
                {
                  date: stamp().slice(0, 10),
                  text: withdraw
                    ? "제보 철회로 안내 마감"
                    : "수정 요청으로 안내 일시 중지: " + note,
                },
              ],
            }
          : n,
      );
      if (save("alerts", next)) alerts = next;
      closeModal();
      render(false);
    }
  };
}

/* tasks — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const tasks = [
  {
    id: "move",
    title: "전입신고",
    when: "실제 이사 후",
    desc: "전입 절차·준비 서류·신청 방법 확인",
    checks: [
      "실제 이사일과 신고 방법 확인",
      "세대 구성에 따른 필요한 서류 확인",
      "공식 안내에서 처리 절차 확인",
    ],
  },
  {
    id: "income",
    title: "기본소득 대상 확인",
    when: "전입 전후",
    desc: "현재 운영 여부와 거주·연령 등 요건 확인",
    checks: [
      "현재 시행 여부·모집 여부 확인",
      "거주·연령·소득 요건 확인",
      "중복 지원 가능 여부 확인",
    ],
  },
  {
    id: "rent",
    title: "월세 지원 대상 확인",
    when: "모집 시기 확인",
    desc: "소득·주거 조건과 중복 지원 제한 확인",
    checks: [
      "연령·거주·소득·주택 요건 확인",
      "임대차 관련 제출 서류 확인",
      "다른 지원과 중복 수급 제한 확인",
    ],
  },
  {
    id: "public",
    title: "행복주택 등 공공임대",
    when: "입주 전부터 가능",
    desc: "지역 공고·신청 자격·예비 입주 일정 확인",
    checks: [
      "대상 지역과 공고 유형 확인",
      "입주 자격·예비 입주 일정 확인",
      "소득·자산 등 제출 서류 확인",
    ],
  },
];

/* tasksPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function tasksPage() {
  const list = tasks.filter((t) => todoState[t.id]?.selected !== false),
    done = list.filter((t) => ["신청 완료", "해당 없음"].includes(todoState[t.id]?.status)).length;
  return `<div class="container">${pageHead("YOUR FIRST YEAR IN OKCHEON", "옥천에서의 첫 1년, 하나씩 챙겨요.", "정해진 순서대로 모두 해야 하는 일은 아니에요. 내 상황에 맞는 항목을 골라 진행하세요.")}<div class="activity-content"><div class="formbox"><div class="fields">${selectField("현재 상황", "settleStatus", ["입주 예정", "입주 완료"], settleProfile.status || "입주 예정")}${inputField("실제 이사일 또는 예정일", "settleDate", settleProfile.date, 'type="date"')}</div><div class="progress-heading"><b>완료 ${done} / 선택한 할 일 ${list.length}</b><button class="textlink" ${uiActionAttrs("click", "chooseTasks_47", [])}>내 할 일 고르기</button></div><progress max="${list.length || 1}" value="${done}" aria-label="할 일 완료율"></progress></div><div class="tabs">${["전체", "해야 할 일", "완료", "나중에"].map((t) => `<button class="tab ${todoFilter === t ? "active" : ""}" ${uiActionAttrs("click", "String_46", [t])}>${t}</button>`).join("")}</div>${list
      .filter((t) => {
        const s = todoState[t.id]?.status || "진행 전";
        return (
          todoFilter === "전체" ||
          (todoFilter === "완료" && ["신청 완료", "해당 없음"].includes(s)) ||
          (todoFilter === "나중에" && s === "나중에") ||
          (todoFilter === "해야 할 일" && ["진행 전", "준비 중"].includes(s))
        );
      })
      .map(
        (t) =>
          `<article class="task-card"><div><span class="section-kicker">${t.when}</span><h3>${t.title}</h3><p>${t.desc}</p><span class="badge">${esc(todoState[t.id]?.status || "진행 전")}</span> <span class="subtle">공고·절차 확인 필요</span></div><a class="btn secondary small" href="#/task/${t.id}">준비할 내용 보기 →</a></article>`,
      )
      .join("") || '<div class="empty">이 분류에 해당하는 할 일이 없어요.</div>'}<div class="notice warning">정책명은 체크리스트 예시입니다. 시행 여부·지원 대상·금액·기간은 확정하지 않았습니다. 지급·선정·입주를 보장하지 않으며 공식 공고 확인이 필요해요.</div><div class="actions"><a class="btn secondary" href="#/community/welcome">커뮤니티에서 질문하기</a><a class="textlink" href="#/community/info">동네 정보 살펴보기 →</a></div></div></div>`;
}

/* tasksEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function tasksEvents() {
  for (const n of ["settleStatus", "settleDate"])
    $(`[name="${n}"]`).onchange = () => {
      settleProfile = {
        ...settleProfile,
        status: $('[name="settleStatus"]').value,
        date: $('[name="settleDate"]').value,
      };
      save("settle-profile", settleProfile);
    };
}

/* chooseTasks — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function chooseTasks() {
  modal(
    `<h2>내게 필요한 할 일을 골라요</h2><form id="choose-tasks">${tasks.map((t) => `<label class="check"><input name="tasks" value="${t.id}" type="checkbox" ${todoState[t.id]?.selected !== false ? "checked" : ""}>${t.title}</label>`).join("")}<button class="btn">선택 저장</button></form>`,
  );
  $("#choose-tasks").onsubmit = (e) => {
    e.preventDefault();
    const chosen = new FormData(e.target).getAll("tasks"),
      next = { ...todoState };
    tasks.forEach((t) => (next[t.id] = { ...next[t.id], selected: chosen.includes(t.id) }));
    if (save("todos", next)) {
      todoState = next;
      closeModal();
      render(false);
    }
  };
}

/* taskDetail — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function taskDetail(id) {
  const t = tasks.find((t) => t.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!t) return notFound();
  const d = todoState[id] || {};
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("FIRST YEAR CHECKLIST", t.title + "을 준비해요.", "첫 1년 할 일 / 공식 정보를 확인하기 전의 준비 화면입니다.")}<div class="activity-content"><div class="notice warning">공식 공고·절차 확인 필요 · 현재 대상·금액·신청 기간은 표시하지 않습니다. 확인된 원문이 등록되면 출처와 확인일을 함께 안내해요.</div>${box("01", "먼저 확인할 내용", `<ul>${t.checks.map((x) => `<li>${x}</li>`).join("")}</ul>`)}${box("02", "준비할 서류", '<p>해당 공식 안내에서 요구하는 서류 목록을 확인해주세요. 상황에 따라 다를 수 있어요.</p><p class="micro">옥키에는 계약서나 민감한 증빙 서류를 올리지 않습니다.</p>')}${box("03", "신청 기간과 방법", '<p>공식 기관의 원문·접수 기간·문의처를 확인한 후 안내할 예정이에요.</p><button class="btn secondary" disabled>공식 공고 확인 전</button>')}<form id="task-form">${box("04", "내 진행 상태", `${selectField("상태 선택", "status", ["진행 전", "준비 중", "신청 완료", "해당 없음", "나중에"], d.status || "진행 전")}<div class="field extra-conditions"><label>나만 보는 메모 (선택)</label><textarea name="note" maxlength="1000">${esc(d.note)}</textarea></div>`)}<button class="btn">상태 저장하고 할 일로 돌아가기 →</button></form></div></div>`;
}

/* taskEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function taskEvents(id) {
  $("#task-form").onsubmit = (e) => {
    e.preventDefault();
    const next = { ...todoState, [id]: { ...formData(e.target), selected: true } };
    if (save("todos", next)) {
      todoState = next;
      location.hash = "/tasks";
    }
  };
}

/* saveTask — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function saveTask(id) {
  const next = { ...todoState, [id]: { ...todoState[id], selected: true } };
  if (save("todos", next)) {
    todoState = next;
    toast("내 첫 1년 할 일에 저장했어요.");
  }
}

/* originalPostCard — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalPostCard = postCard;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
postCard = function (p) {
  let html = originalPostCard(p);
  const extra = `<button ${uiActionAttrs("click", "toggleReaction_48", [p.id])} aria-pressed="${!!p.liked}">${p.liked ? "♥" : "♡"} 공감 ${Number(p.liked || 0)}</button><button ${uiActionAttrs("click", "toggleReaction_49", [p.id])} aria-pressed="${!!p.saved}">${p.saved ? "저장됨" : "저장"}</button>`;
  html = html
    .replace('<div class="post-actions">', '<div class="post-actions">' + extra)
    .replace("♡ 댓글", "댓글");
  if (p.category === "지원 정책") {
    html = html
      .replace('<div class="post-image">', '<div class="post-image policy-image">')
      .replace("첫 집, 함께 확인해요.", "생활 지원 안내")
      .replace("비용 · 시설 · 일정 · 통근", "공식 공고 확인 후 안내");
    html = html.replace(
      '<div class="post-actions">',
      `<div class="policy-actions"><span class="micro">대상·기간·출처·확인일: 공고 확인 전</span><div class="actions"><button class="btn secondary small" disabled>공고 확인 후 연결</button><button class="btn small" ${uiActionAttrs("click", "saveTask_50", [p.task])}>내 할 일에 저장</button></div></div><div class="post-actions">`,
    );
  }
  return html;
};

/* toggleReaction — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function toggleReaction(id, key) {
  if (mutatePost(id, (p) => (p[key] = !p[key]))) refreshPost(id);
}

/* communityPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function communityPage() {
  const list = allPosts().filter((p) => communityTab === "전체" || p.category === communityTab);
  return `<div class="container">${pageHead("LIFE BETWEEN HOMES", "집 너머의 옥천 이야기", "사진으로 일상을 나누고, 궁금한 점은 이웃에게 물어보세요.")}<div class="tabs community-tabs" role="group" aria-label="커뮤니티 분류">${["일상", "새로 왔어요", "동네 정보", "지원 정책"].map((t) => `<button class="tab ${communityTab === t ? "active" : ""}" aria-pressed="${communityTab === t}" ${uiActionAttrs("click", "setTab_51", [t])}>${t}</button>`).join("")}</div><div class="community-layout"><aside class="community-aside"><span class="section-kicker">TOGETHER IN OKCHEON</span><h2>이웃과 함께</h2><p class="subtle">처음 온 날의 질문도,<br>오래 살며 알게 된 정보도<br>편하게 나누어요.</p><a class="btn small" href="#/write">＋ 사진과 이야기 올리기</a><div class="soft-card"><h3>나의 첫 1년</h3><p class="subtle">필요한 정책을 내 할 일에 저장하고 확인해보세요.</p><a class="textlink" href="#/tasks">첫 1년 할 일 →</a></div></aside><div class="feed">${list.length ? list.slice(0, feedLimit).map(postCard).join("") : '<div class="empty"><h3>아직 이야기가 없어요.</h3><a class="textlink" href="#/write">첫 이야기를 들려주세요 →</a></div>'}${list.length > feedLimit ? `<button class="btn secondary" ${uiActionAttrs("click", "render_52", [])}>이야기 더 보기</button>` : ""}</div><aside class="feed-guide"><b>이용 안내</b><p>사진 아래에 이야기가 이어져요.</p><p>최신 게시 순서이며 댓글을 써도 순서는 바뀌지 않아요.</p><p class="micro">예시와 현재 브라우저에서 작성한 이야기만 표시됩니다.</p></aside></div></div>`;
}

/* originalWritePage — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalWritePage = writePage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
writePage = function (id) {
  return originalWritePage(id).replace(
    '<div class="form-submit"',
    `<label class="check"><input type="checkbox" required name="publicCheck">사진과 글에 개인 연락처·상세 주소가 없는지 확인했어요.</label><p class="micro">지원 정책은 공식 출처를 확인한 운영 안내 공간입니다. 정책 질문은 동네 정보에 작성해주세요.</p><div class="form-submit"`,
  );
};

/* writeEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function writeEvents(id) {
  const original = posts.find((p) => p.id === id && p.owned);
  let photos = [
      ...(original?.photos ||
        read("form-draft-post-form" + (id ? "-" + id : ""), {})._photos ||
        []),
    ],
    loading = false;
  const f = $("#post-form"),
    upload = $("#post-photos");
  const draw = () => {
    f._photos = photos;
    upload.required = !photos.length;
    setHTML($("#post-preview"), photos
      .map(
        (s, i) =>
          `<div class="photo-edit"><img src="${esc(s)}" alt="사진 ${i + 1}"><div><button type="button" data-move="${i}" ${i === 0 ? "disabled" : ""} aria-label="사진 ${i + 1} 앞으로">←</button><button type="button" data-remove="${i}" aria-label="사진 ${i + 1} 삭제">×</button></div></div>`,
      )
      .join(""));
    $$("[data-move]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = Number(b.dataset.move);
          [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]];
          draw();
        }),
    );
    $$("[data-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          photos.splice(Number(b.dataset.remove), 1);
          draw();
        }),
    );
  };
  draw();
  upload.onchange = async (e) => {
    loading = true;
    try {
      if (photos.length + e.target.files.length > 5)
        throw Error("사진은 최대 5장까지 올릴 수 있어요.");
      photos.push(...(await prepareImages([...e.target.files])));
      draw();
    } catch (err) {
      toast(err.message);
    } finally {
      upload.value = "";
      upload.required = !photos.length;
      loading = false;
    }
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    if (loading || !photos.length) {
      toast("사진 준비가 끝났는지 확인해주세요.");
      return;
    }
    const d = formData(f);
    if (!d.author.trim() || !d.title.trim() || !d.body.trim())
      return toast("별칭·제목·이야기를 입력해주세요.");
    modal(
      `<h2>이렇게 이야기를 나눌 거예요.</h2><span class="badge">${esc(d.category)}</span><img src="${photos[0]}" alt="대표 사진 미리보기" style="width:100%;max-height:260px;object-fit:cover"><h3>${esc(d.title)}</h3><p style="white-space:pre-wrap">${esc(d.body)}</p><div class="modal-actions"><button class="btn secondary" ${uiActionAttrs("click", "closeModal_1", [])}>다시 수정</button><button class="btn" id="publish-post">${original ? "수정 저장" : "이야기 올리기"}</button></div>`,
    );
    $("#publish-post").onclick = () => {
      const p = {
        ...original,
        ...d,
        photos,
        scope: typeof getScope === "function" ? getScope(f) : undefined,
        relation: d.relation,
        id: original?.id || newId(),
        owned: true,
        created: original?.created || stamp(),
        comments: original?.comments || [],
      };
      const next = original ? posts.map((x) => (x.id === id ? p : x)) : [p, ...posts];
      if (save("posts", next)) {
        posts = next;
        closeModal();
        save("form-draft-post-form" + (id ? "-" + id : ""), {});
        location.hash = communityHref(p.category, p.id);
        toast("현재 브라우저에 이야기를 저장했어요.");
      }
    };
  };
}

/* areaPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function areaPage(from) {
  return `<div class="container">${pageHead("FIND YOUR NEIGHBORHOOD", "어느 동네에서 시작할까요?", "직장과 생활 편의시설을 살펴보고 희망 생활권을 정해보세요.")}<div class="notice warning">생활권 체험 지도 · 실제 지형·거리·통근 시간을 나타내지 않는 도식입니다. 방 위치나 비공개 제보 주소는 표시하지 않습니다.</div><div class="filters"><select id="area-region" aria-label="희망 생활권"><option value="">옥천 전체</option>${options(regions, areaRegion)}</select><input id="area-query" aria-label="직장·시설 검색" value="${esc(areaQuery)}" placeholder="직장 또는 시설 키워드"><select id="area-category" aria-label="시설 분류">${options(["전체", "직장", "교통", "생활편의"], areaCategory)}</select><button class="btn small" ${uiActionAttrs("click", "searchArea_54", [])}>살펴보기</button></div><div class="area-layout"><div class="map-panel area-map">${mapSvg()}<div class="map-note">생활권 도식 · 실제 위치 아님</div>${[
    ["직장", 35, 29],
    ["교통", 56, 46],
    ["생활편의", 27, 68],
  ]
    .filter(([t]) => areaCategory === "전체" || areaCategory === t)
    .map(
      ([t, x, y]) =>
        `<button class="marker" style="left:${x}%;top:${y}%" ${uiActionAttrs("click", "String_53", [t])}>${t} 예시</button>`,
    )
    .join(
      "",
    )}</div><div class="formbox"><span class="section-kicker">MY NEIGHBORHOOD</span><h2>${esc(areaRegion || "옥천의 생활권")}</h2><p>${esc(areaQuery || "직장·교통·생활편의 시설")} 정보를 외부 지도에서 확인해보세요.</p><a class="btn secondary" href="https://map.kakao.com/?q=${encodeURIComponent((areaRegion || "옥천군") + " " + (areaQuery || (areaCategory === "전체" ? "생활편의시설" : areaCategory)))}" target="_blank" rel="noopener noreferrer">카카오맵에서 검색·길찾기 ↗</a><p class="micro">실제 시설과 경로는 외부 지도에서 다시 확인해요. 도식으로 통근 시간을 계산하지 않습니다.</p><hr><label for="apply-region">등록할 희망 지역</label><select id="apply-region">${options(regions, areaRegion || "옥천읍")}</select><button class="btn" style="margin-top:15px" ${uiActionAttrs("click", "applyArea_55", [])}>이 지역을 알림 조건에 추가</button><p class="micro">작성 중인 다른 조건은 그대로 유지해요.</p><a class="textlink" href="${from === "wait" ? "#/wait/1" : "#/activity"}">← ${from === "wait" ? "작성하던 조건으로" : "내 활동으로"}</a></div></div><p class="micro">지도 연결이 어려워도 읍·면을 직접 선택해 등록할 수 있어요.</p></div>`;
}

/* searchArea — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
function searchArea() {
  areaRegion = $("#area-region").value;
  areaCategory = $("#area-category").value;
  areaQuery = $("#area-query").value;
  render(false);
}

/* applyArea — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function applyArea() {
  const r = $("#apply-region").value;
  waitDraft = {
    ...waitDraft,
    regions: [...new Set([...(waitDraft.regions || []), r])],
    anyRegion: false,
  };
  save("wait-draft", waitDraft);
  location.hash = "/wait/1";
}

/* aboutPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function aboutPage() {
  return `<div class="container">${pageHead("ABOUT OKKI", "전입에서 첫 거처까지.", "그리고, 나의 동네가 되기까지.")}<section class="about-hero"><div class="section-kicker">FIRST HOME, FIRST NEIGHBOR</div><h1>조건을 남기고,<br>확인된 소식을 만나세요.</h1><p class="lead">옥키는 옥천에서 취업과 이주를 준비하는 청년의<br>첫 거처와 첫 1년의 생활을 연결합니다.</p></section><section class="section"><h2>살 집을 찾는 과정이 조금 더 쉬워지도록.</h2><p class="lead">곧 비는 방의 소식은 일반 공개 목록에 바로 나타나지 않을 수 있어요.<br>필요한 일정과 조건을 먼저 모으고, 안내할 수 있는 정보를 확인해 연결합니다.</p></section><section class="section"><h2>공간 정보, 이렇게 확인합니다.</h2><div class="four-steps">${[
    ["제보 접수", "제보자의 연락처와 허용한 연락 범위를 확인해요."],
    ["의사·권한 확인", "집주인의 임대 의사와 안내·제공 권한을 따로 확인해요."],
    ["조건 확인", "실제 입주일·비용·시설을 확인하고 미확인 사항은 구분해요."],
    ["동의 후 연결", "상담 시 받는 곳·전달 항목·목적·보유 기간을 안내하고 동의받아요."],
  ]
    .map(([t, p], i) => `<div><span>0${i + 1}</span><h3>${t}</h3><p>${p}</p></div>`)
    .join(
      "",
    )}</div><div class="notice">전화 확인은 현장·안전·권리 확인과 다릅니다. 방문과 계약 조건은 전문기관을 통해 별도로 확인해야 해요.</div></section><section class="section two-grid"><div class="soft-card"><h3>내 속도로 기다려요</h3><p>알림 시점이나 입주를 보장하지 않아요. 대기 순서에 따른 방 배정도 아닙니다. 원할 때 조건을 바꾸거나 알림을 멈출 수 있어요.</p></div><div class="soft-card"><h3>집을 구한 다음에도</h3><p>첫 1년 할 일과 커뮤니티에서 생활을 이어가요. 정책 대상 여부는 공식 공고를 확인해주세요.</p></div></section><section class="formbox section"><h2>이용·문의 안내</h2><p>지금은 와이어프레임을 구현한 체험 사이트입니다. 모든 등록·상담·제보는 현재 브라우저에만 보관되고 실제 운영팀으로 전송되지 않습니다.</p><p>실제 운영 연락처·문의 가능 시간과 담당 중개사는 아직 확정되지 않았습니다.</p><button class="textlink" ${uiActionAttrs("click", "policy_25", [])}>개인정보·저장 안내 →</button></section><div class="banner"><div><h2>옥천에서의 첫 장을 준비해요.</h2><p>지금 정해진 일정과 조건부터 알려주세요.</p></div><a class="btn light" href="#/wait">방 알림 받기 →</a></div></div>`;
}

/* adminPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function adminPage() {
  const tips = applications.filter((a) => a.kind === "tip"),
    waits = applications.filter((a) => a.kind === "waiting");
  return `<div class="container">${pageHead("OPERATIONS DEMO · LOCAL ONLY", "방 소식 확인과 안내", "일반 메뉴에 표시하지 않는 운영 흐름 체험 화면입니다.")}<div class="notice warning">실제 관리자 기능이 아닙니다. 로그인·권한 인증이 없는 현재 브라우저의 시뮬레이션이며 다른 사용자의 정보에 접근하거나 실제 알림을 발송하지 않습니다.</div><div class="grid3">${[
    ["대기 등록", waits.filter((a) => a.status === "대기 중").length],
    ["방 정보 제보", tips.length],
    ["안내 기록", alerts.length],
  ]
    .map(([t, n]) => `<div class="summary"><span>${t}</span><h2>${n}</h2></div>`)
    .join(
      "",
    )}</div><section class="section"><h2>대기 등록</h2>${waits.map((a) => `<details class="formbox"><summary>${esc(a.id)} · ${esc(a.status)} · 신청</summary>${waitSummary(a.data)}<p>알림 수단: 웹 알림함</p>${(a.urgent || []).map((u) => `<div class="notice warning">급한 상황: ${esc(u.message)}</div>`).join("")}</details>`).join("") || '<div class="notice">대기 등록이 없습니다.</div>'}</section><section class="section"><h2>제보 확인 · 안내 준비</h2>${tips.map((a) => `<article class="formbox"><div class="application-top"><h3>${esc(a.data.region)} · ${esc(a.data.type)} · ${esc(a.id)}</h3><span class="badge">${esc(a.status)}</span></div><p>역할: ${esc(a.data.role)} / 비공개 주소: ${esc(a.data.address)} ${esc(a.data.unit || "")}</p><p class="micro">허용한 연락 범위: ${esc(a.data.nextContact || a.data.contactTime || "미확인")} / 퇴거 정보 전달 ${a.data.forwardPermission ? "허용" : "미동의·별도 확인"}</p><div class="actions"><button class="btn secondary small" ${uiActionAttrs("click", "reviewTip_56", [a.id])}>의사·권한·조건 확인</button><button class="btn small" ${uiActionAttrs("click", "prepareAlert_57", [a.id])} ${a.status !== "안내 가능" ? "disabled" : ""}>조건 비교·알림 준비</button><button class="textlink" ${uiActionAttrs("click", "showHistory_23", [a.id])}>확인 이력</button></div></article>`).join("") || '<div class="notice">접수한 제보가 없습니다.</div>'}</section><section class="section"><h2>알림과 응답 기록</h2>${alerts.map((n) => `<div class="application"><b>${esc(n.snapshot.name)}</b><p>${esc(n.id)} → ${esc(n.waitId)} · ${esc(n.status)}</p><p class="micro">${labelDate(n.created)} · 브라우저 안 알림 저장 성공 / 외부 발송 없음${n.readAt ? " · 읽음" : ""}${n.skipReason ? " · 건너뛴 이유: " + esc(n.skipReason) : ""}</p><button class="textlink" ${uiActionAttrs("click", "changeAlert_58", [n.id])}>정보 변경·마감</button></div>`).join("") || '<div class="notice">안내 기록이 없습니다.</div>'}</section><section class="section"><h2>커뮤니티 신고</h2>${reports.map((r) => `<article class="application"><b>${esc(r.reason)}</b><p>${esc(r.detail)}</p><span class="badge">${esc(r.status)}</span>${r.status === "접수" ? `<button class="textlink" ${uiActionAttrs("click", "resolveReport_59", [r.id])}>신고 확인·처리</button>` : ""}</article>`).join("") || '<div class="notice">신고 기록이 없습니다.</div>'}</section></div>`;
}

/* reviewTip — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function reviewTip(id) {
  const a = applications.find((a) => a.id === id),
    r = a.review || {},
    d = a.data;
  modal(
    `<h2>임대 의사·안내 권한 확인</h2><p class="micro">실제 확인을 대신하는 체험 기록입니다. 필수 확인이 모두 끝나야 안내 가능으로 전환할 수 있어요.</p><form id="review-tip">${[
      ["contact", "제보자 연락·허용한 전달 범위 확인"],
      ["intent", "집주인의 임대 의사 확인"],
      ["authority", "공급·안내 권한 및 담당자 확인"],
      ["conditions", "실제 입주일·비용·생활 조건 확인"],
    ]
      .map(
        ([k, t]) =>
          `<label class="check"><input type="checkbox" name="${k}" ${r[k] ? "checked" : ""}>${t}</label>`,
      )
      .join(
        "",
      )}${a.mode === "tenant" && !d.forwardPermission ? '<label class="check"><input name="laterPermission" type="checkbox">제보자와 먼저 상의하여 추가 연락 허용 범위를 확인함 (근거 메모 필수)</label>' : ""}<div class="fields">${inputField("확인 주체 *", "by", r.by, 'required maxlength="60"')}${inputField("확인일 *", "reviewDate", r.reviewDate || stamp().slice(0, 10), 'required type="date"')}${inputField("실제 입주 가능일", "date", r.date || d.date, 'type="date"')}${inputField("보증금 (만 원, 미정은 공란)", "deposit", r.deposit ?? (d.depositUnknown ? "" : d.deposit), 'type="number" min="0"')}${inputField("월세 (만 원, 미정은 공란)", "rent", r.rent ?? (d.rentUnknown ? "" : d.rent), 'type="number" min="0"')}${inputField("관리비 (만 원, 미정은 공란)", "fee", r.fee ?? (d.feeUnknown ? "" : d.fee), 'type="number" min="0"')}</div>${field("확인 근거·기록 *", `<textarea name="note" required maxlength="1000">${esc(r.note)}</textarea>`)}${field("추가 확인할 항목", `<textarea name="unknown" maxlength="500">${esc(r.unknown || "현장 방문 미확인 / 수리 상태·계약 조건 별도 확인")}</textarea>`)}${selectField("처리 상태 *", "status", ["접수", "확인 중", "안내 가능", "보류", "철회·마감"], a.status, true)}${formError()}<button class="btn">확인 기록 저장</button></form>`,
  );
  $("#review-tip").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target,
      v = formData(f);
    if (
      v.status === "안내 가능" &&
      (!["contact", "intent", "authority", "conditions"].every((k) => v[k]) ||
        (a.mode === "tenant" && !d.forwardPermission && !v.laterPermission))
    )
      return errorForm(f, "연락 범위·임대 의사·안내 권한·조건을 모두 확인해야 안내할 수 있어요.");
    if (
      patchApp(
        id,
        { review: v, status: v.status },
        `${v.by} / ${v.reviewDate} / ${v.status}: ${v.note}`,
      )
    ) {
      closeModal();
      render(false);
    }
  };
}

/* tipSnapshot — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function tipSnapshot(a) {
  const d = a.data,
    r = a.review;
  return {
    id: "tip-" + a.id,
    name: d.region + "의 " + d.type + " · 제보 확인 예시",
    type: d.type,
    region: d.region,
    deposit: r.deposit === "" ? null : Number(r.deposit),
    rent: r.rent === "" ? null : Number(r.rent),
    fee: r.fee === "" ? null : Number(r.fee),
    date: r.date || null,
    min: d.min ? Number(d.min) : null,
    max: d.max ? Number(d.max) : null,
    bath: d.bath === "미확인" ? null : d.bath || null,
    kitchen: d.kitchen === "미확인" ? null : d.kitchen || null,
    pet: null,
    barrier: null,
    color: 2,
    description: "비공개 제보를 확인하여 안내한 공간입니다. 현장·계약 조건은 별도로 확인해주세요.",
    facilities: ["현장 상태 추가 확인", "정확한 위치는 상담 시 확인"],
  };
}

/* prepareAlert — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function prepareAlert(id) {
  const a = applications.find((a) => a.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !a?.review ||
    a.status !== "안내 가능" ||
    !["contact", "intent", "authority", "conditions"].every((k) => a.review[k]) ||
    (a.mode === "tenant" && !a.data.forwardPermission && !a.review.laterPermission)
  )
    return toast("필수 확인을 먼저 완료해주세요.");
  const h = tipSnapshot(a),
    ws = applications.filter(
      (x) =>
        x.kind === "waiting" &&
        x.status === "대기 중" &&
        x.data.serviceConsent &&
        !alerts.some((n) => n.tipId === id && n.waitId === x.id && n.status !== "마감"),
    );
  modal(
    `<h2>조건 비교와 안내 준비</h2><p class="micro">최신 정보와 수신 대상을 검토합니다. 정확한 주소·제보자 연락처는 알림에 포함되지 않습니다.</p>${
      ws
        .map((w) => {
          const c = compareConditions(w.data, h);
          return `<div class="summary"><b>${esc(w.id)} · ${esc(w.data.channel)}</b>${comparisonHTML(c)}<p class="micro">미확인 항목이 있으면 알림에 ‘추가 확인’으로 표시합니다.</p><button class="btn small" ${c.mismatch.length ? "disabled" : ""} ${uiActionAttrs("click", "confirmSend_60", [id, w.id])}>${c.mismatch.length ? "조건 불일치" : "이 대상 안내 검토"}</button></div>`;
        })
        .join("") || "<p>현재 안내할 수신 대상이 없습니다.</p>"
    }`,
  );
}

/* confirmSend — 사용자의 요청을 확인하고 관련 신청·등록 절차를 진행합니다. */
function confirmSend(tipId, waitId) {
  const a = applications.find((a) => a.id === tipId),
    w = applications.find((a) => a.id === waitId),
    h = tipSnapshot(a),
    c = compareConditions(w.data, h);
  modal(
    `<h2>알림을 저장하기 전 확인</h2><p>${esc(w.id)} · 웹 알림함</p>${comparisonHTML(c)}<form id="send-alert"><label class="check"><input type="checkbox" required>최신 입주일·비용·임대 의사·안내 권한을 다시 확인했어요.</label><label class="check"><input type="checkbox" required>수신 채널과 동의, 비공개 정보 제외를 확인했어요.</label>${c.unknown.length ? '<label class="check"><input type="checkbox" required>미확인 조건을 충족으로 판단하지 않고 추가 확인으로 안내해요.</label>' : ""}<p class="micro">현재 브라우저에만 예시 알림을 저장하며 실제 문자·이메일은 발송하지 않습니다.</p><button class="btn">체험 알림 저장</button></form>`,
  );
  $("#send-alert").onsubmit = (e) => {
    e.preventDefault();
    if (
      a.status !== "안내 가능" ||
      w.status !== "대기 중" ||
      !w.data.serviceConsent ||
      compareConditions(w.data, h).mismatch.length
    )
      return toast("안내 조건이 변경되었습니다. 다시 확인해주세요.");
    if (alerts.some((n) => n.tipId === tipId && n.waitId === waitId && n.status !== "마감"))
      return toast("이미 안내한 방입니다.");
    const n = {
      id: "N-" + newId().slice(0, 8),
      tipId,
      waitId,
      listingId: h.id,
      snapshot: h,
      status: "새 소식",
      created: stamp(),
      verification: {
        by: a.review.by,
        date: a.review.reviewDate,
        note: a.review.note + " / " + a.review.unknown,
      },
    };
    if (save("alerts", [n, ...alerts])) {
      alerts = [n, ...alerts];
      if (!homes.some((x) => x.id === h.id)) homes.push(h);
      closeModal();
      render(false);
    }
  };
}

/* changeAlert — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function changeAlert(id) {
  const n = alerts.find((n) => n.id === id);
  modal(
    `<h2>방 소식 변경·마감</h2><form id="change-alert">${selectField("상태", "status", ["정보 변경", "마감"], n.status === "마감" ? "마감" : "정보 변경")}${inputField("새 입주 가능일", "date", n.snapshot.date, 'type="date"')}${inputField("새 월세 (만 원)", "rent", n.snapshot.rent, 'type="number" min="0"')}${inputField("새 관리비 (만 원)", "fee", n.snapshot.fee, 'type="number" min="0"')}${field("변경 사유·확인 주체 *", '<textarea name="reason" required maxlength="500"></textarea>')}<button class="btn">변경 기록 저장</button></form>`,
  );
  $("#change-alert").onsubmit = (e) => {
    e.preventDefault();
    const d = formData(e.target),
      old = n.snapshot;
    const snapshot = {
      ...old,
      date: d.date || null,
      rent: d.rent === "" ? null : Number(d.rent),
      fee: d.fee === "" ? null : Number(d.fee),
    };
    const change = {
      date: stamp().slice(0, 10),
      text: `${d.reason} / 입주일 ${old.date || "미정"} → ${snapshot.date || "미정"}, 월세 ${money(old.rent)} → ${money(snapshot.rent)}, 관리비 ${money(old.fee)} → ${money(snapshot.fee)}`,
    };
    const next = alerts.map((x) =>
      x.listingId === n.listingId
        ? { ...x, status: d.status, snapshot, changes: [...(x.changes || []), change] }
        : x,
    );
    if (save("alerts", next)) {
      alerts = next;
      closeModal();
      render(false);
    }
  };
}

/* render — 현재 주소와 상태에 맞는 화면을 선택해 그린 뒤 해당 화면의 이벤트를 연결합니다. */

/* displayedSpace — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let displayedSpace = null;

/* originalSpaceDetailContent — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalSpaceDetailContent = spaceDetailContent;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
spaceDetailContent = function (h, action = "") {
  displayedSpace = structuredClone(h);
  const record = h.verification
    ? `${esc(h.verification.by)} · ${esc(h.verification.date)}`
    : "체험 공간 · 확인 주체·확인일 미등록";
  return originalSpaceDetailContent(h, action).replace("2026.10.16 · 제공자 전화", record);
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
changeRoom = function (id, v) {
  const h = displayedSpace?.id === id ? displayedSpace : homes.find((x) => x.id === id);
  if (h && $("#main-room")) setHTML($("#main-room"), room(h, v));
};
