/* newId — 브라우저의 난수 기능으로 중복 가능성이 낮은 식별자를 생성합니다. */
/*
 * 파일: app.js
 * 역할: 웹사이트의 공통 기반과 기본 화면을 담당합니다. 브라우저 저장소, 화면 이동, 집 찾기, 신청 및 공간 상담, 커뮤니티의 기본 동작을 정의합니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
function newId() {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    typeof crypto.randomUUID === "function"
  )
    return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20),
  ].join("-");
}

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
("use strict");

/* $, $$ — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];

/* esc — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/* read — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem("okki-" + k)) ?? d;
  } catch {
    return d;
  }
};

/* storageOK — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let storageOK = true;
/* save — 값을 JSON으로 직렬화해 브라우저 저장소에 기록하고 실패 시 사용자에게 알립니다. */
function save(k, v) {
  try {
    // 새 신청자 번호는 운영자 전용 DB를 연결하기 전 localStorage에 쓰지 않는다.
    // 중첩된 신청 데이터·수동 초안도 포함한다. 자유문구 속 번호 탐지는 별도 과제다.
    const privateForm = k === "applications" || k === "wait-draft" ||
      /^form-draft-(wait-form|registration-|vacancy-form)/.test(k);
    localStorage.setItem("okki-" + k, JSON.stringify(v, privateForm
      ? (key, value) => ["phone", "phoneCode", "verifiedPhone"].includes(key) ? undefined : value
      : undefined));
    return true;
  } catch {
    storageOK = false;
    toast("저장 공간이 부족합니다. 사진 크기를 줄이거나 브라우저 설정을 확인해주세요.");
    return false;
  }
}

/* applications, posts, reports, listingStates, filter, selected, communityTab, openComments, requestDr */
let applications = read("applications", []),
  posts = read("posts", []),
  reports = read("reports", []),
  listingStates = read("listingStates", {}),
  filter = { type: "", region: "", budget: "", deposit: "", date: "" },
  selected = null,
  communityTab = "전체",
  openComments = new Set(),
  requestDraft = read("draft", {}),
  editId = null,
  feedLimit = 5;

/* types, icons — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const types = ["셰어하우스", "룸메이트", "원룸", "여유방", "하숙", "고용주 숙소"],
  icons = ["⌂", "♧", "▣", "⌑", "♨", "▤"];

/* homes — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const homes = [
  {
    id: "A",
    name: "햇살이 머무는 셰어하우스",
    type: "셰어하우스",
    region: "옥천읍",
    deposit: 100,
    rent: 35,
    fee: 3,
    date: "2026-10-20",
    min: 1,
    max: 12,
    bath: "공유",
    kitchen: "공유",
    pet: false,
    barrier: false,
    x: 33,
    y: 44,
    color: 0,
    description: "각자의 방과 함께 쓰는 거실. 옥천에서의 첫 생활을 이웃과 나누는 공간이에요.",
    facilities: ["개인실 1개", "공용 거실", "공용 주방·욕실", "침대·책상", "개별 난방"],
  },
  {
    id: "B",
    name: "함께 시작하는 두 사람의 집",
    type: "룸메이트",
    region: "옥천읍",
    deposit: 50,
    rent: 20,
    fee: 2,
    date: null,
    min: 1,
    max: 6,
    bath: "공유",
    kitchen: "공유",
    pet: false,
    barrier: false,
    x: 22,
    y: 70,
    color: 1,
    description:
      "실제 제공 가능한 개인 방이 있는 룸메이트 공간입니다. 공용 공간의 생활 규칙은 상담 시 함께 확인해요.",
    facilities: ["개인실 1개", "주방·욕실 공유", "세탁기", "가구 협의"],
  },
  {
    id: "C",
    name: "나만의 속도로, 아늑한 원룸",
    type: "원룸",
    region: "옥천읍",
    deposit: 300,
    rent: 40,
    fee: 4,
    date: "2026-10-16",
    min: 3,
    max: 24,
    bath: "단독",
    kitchen: "단독",
    pet: false,
    barrier: false,
    x: 57,
    y: 30,
    color: 2,
    description:
      "혼자만의 일상에 집중할 수 있는 독립 공간. 햇빛이 드는 창가에서 옥천 생활을 시작해보세요.",
    facilities: ["독립 주방·욕실", "침대·옷장", "에어컨", "세탁기", "개별 난방"],
  },
  {
    id: "D",
    name: "조용한 마을의 따뜻한 여유방",
    type: "여유방",
    region: "동이면",
    deposit: 0,
    rent: 15,
    fee: 0,
    date: null,
    min: 1,
    max: 3,
    bath: "공유",
    kitchen: "공유",
    pet: true,
    barrier: false,
    x: 67,
    y: 68,
    color: 3,
    description:
      "마을의 일상을 가까이에서 느낄 수 있는 여유방입니다. 거주 기간과 생활 조건을 함께 의논해요.",
    facilities: ["개인실 1개", "공용 주방·욕실", "가구 협의", "반려동물 협의"],
  },
  {
    id: "E",
    name: "든든한 한 끼가 있는 하숙",
    type: "하숙",
    region: "이원면",
    deposit: 50,
    rent: 40,
    fee: 5,
    date: "2026-11-01",
    min: 1,
    max: 12,
    bath: "공유",
    kitchen: "공유",
    pet: false,
    barrier: false,
    x: 79,
    y: 45,
    color: 4,
    description: "식사 제공 범위와 시간을 상담으로 확인할 수 있는 하숙 공간입니다.",
    facilities: ["개인실 1개", "식사 조건 협의", "공용 욕실", "가구 제공"],
  },
  {
    id: "F",
    name: "일터 가까이, 고용주 숙소",
    type: "고용주 숙소",
    region: "청산면",
    deposit: null,
    rent: null,
    fee: null,
    date: null,
    min: null,
    max: null,
    bath: null,
    kitchen: null,
    pet: null,
    barrier: null,
    x: 72,
    y: 19,
    color: 5,
    description:
      "고용주가 제공하는 숙소입니다. 이용 자격과 비용, 시설 조건은 추가 확인이 필요해요.",
    facilities: ["이용 자격 확인 필요", "비용 미확인", "시설 미확인"],
  },
];

/* activeHomes — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const activeHomes = () =>
  homes.filter((h) => listingStates[h.id] !== "입주 완료" && listingStates[h.id] !== "공개 중지");

/* seedPosts — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const seedPosts = [
  {
    id: "seed1",
    author: "옥천의 산책자",
    category: "일상",
    title: "천천히 걸어야 보이는 옥천의 오후",
    body: "오늘은 익숙한 길을 조금 돌아 걸었어요. 시원한 바람, 낮은 지붕, 그리고 가을빛. 여러분이 좋아하는 산책길도 알려주세요.",
    visual: "village",
    time: "예시 이야기",
    comments: [{ author: "첫 이웃", text: "새 동네를 알아가는 가장 좋은 방법 같아요." }],
  },
  {
    id: "seed2",
    author: "새로운 시작",
    category: "새로 왔어요",
    title: "옥천에서의 첫 주, 반갑습니다!",
    body: "새로운 동네에서 일상을 시작하는 중이에요. 가볍게 인사 나누고, 함께 동네 이야기를 들려주세요. 먼저 살고 계신 이웃의 환영 인사도 기다릴게요.",
    visual: "room",
    time: "예시 이야기",
    comments: [],
  },
  {
    id: "seed3",
    author: "옥키 이야기",
    category: "동네 정보",
    title: "첫 집 방문 전, 함께 확인해요",
    body: "월세 외 관리비와 공과금, 난방 방식, 욕실·주방 공유 여부, 직장까지의 이동 경로를 확인해보세요. 계약 관련 사항은 전문기관의 도움을 받아 확인하세요.",
    visual: "guide",
    time: "예시 안내",
    comments: [],
  },
];
// Saved seed posts are overrides, not newly published posts. Keep their original feed slots.

/* allPosts — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const allPosts = () => {
  const seedIds = new Set(seedPosts.map((p) => p.id));
  const overrides = new Map(posts.map((p) => [p.id, p]));
  return [
    ...posts.filter((p) => !seedIds.has(p.id)),
    ...seedPosts.map((p) => overrides.get(p.id) || p),
  ]
    .filter((p) => !p.hidden)
    .sort((a, b) => (Date.parse(b.created) || 0) - (Date.parse(a.created) || 0));
};

/* logo — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function logo() {
  return `<svg class="brandmark" viewBox="0 0 40 44" fill="none" aria-hidden="true"><path d="M4 20 20 6l16 14v20H4Z" fill="#17624b"/><path d="M16 40V25h9v15" fill="#e4efb6"/><path d="M27 5v11" stroke="#17624b" stroke-width="5"/><circle cx="11" cy="23" r="2" fill="#e4efb6"/></svg><b>옥키</b><small>FIRST HOME<br>IN OKCHEON</small>`;
}

/* brand — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function brand() {
  return `<a class="brand" href="#/" aria-label="옥키 홈">${logo()}</a>`;
}

/* nav — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */

/* toggleMenu — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function toggleMenu(b) {
  const open = $(".mobile-nav").classList.toggle("open");
  b.setAttribute("aria-expanded", open);
  b.textContent = open ? "×" : "☰";
}

/* toast — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4000);
}

/* modal — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function modal(html) {
  setHTML($("#dialog"), `<button class="dialog-close" ${uiActionAttrs("click", "closeModal_1", [])} aria-label="닫기">×</button>${html}`);
  $("#dialog").showModal();
}

/* closeModal — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function closeModal() {
  $("#dialog").close();
}

/* policy — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function policy() {
  modal(
    `<h2>개인정보와 체험 안내</h2><p>이 사이트는 기획 문서를 바탕으로 만든 기능 체험판입니다. 입력한 신청, 게시물, 댓글, 사진은 현재 브라우저의 저장 공간에만 보관되며 운영자에게 전송되지 않습니다.</p><p>실제 연락처나 상세 주소 대신 예시 정보를 사용해주세요. 브라우저 데이터를 지우면 저장 내용이 삭제됩니다. 다른 기기에서는 조회할 수 없습니다.</p><p>실서비스의 본인 인증, 접근 권한, 개인정보 보관 기간, 처리방침과 운영 연락처는 운영 주체 확정 후 연동해야 합니다.</p><div class="modal-actions"><button class="btn" ${uiActionAttrs("click", "closeModal_1", [])}>확인했어요</button></div>`,
  );
}

/* room — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function room(h, variant = 0) {
  const palettes = [
    ["#e6e8dc", "#c5d0b1", "#9caa84", "#f2eee0"],
    ["#ece3d7", "#ceb398", "#9f886b", "#f7eee1"],
    ["#e0e7e4", "#a7beb0", "#6d927c", "#edf1e6"],
    ["#e9e4d5", "#c8c29c", "#96a17d", "#f7f0dd"],
    ["#e8dfd5", "#d3b7a2", "#aa8d72", "#f6ebde"],
    ["#e1e5e1", "#b3c4bc", "#859f91", "#f0f1e8"],
  ];
  const [wall, bed, dark, floor] = palettes[(h.color + variant) % 6];
  return `<div class="room"><svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(h.type)} 실내 분위기 예시 일러스트"><rect width="500" height="300" fill="${wall}"/><path d="M0 230H500V300H0Z" fill="${floor}"/><path d="M0 230 80 192H500V230Z" fill="#000" opacity=".035"/><rect x="55" y="35" width="130" height="135" fill="#f7f8ee"/><rect x="65" y="45" width="110" height="115" fill="#d5e2d4"/><path d="M65 138 105 95 135 128 175 83v77H65" fill="#abc39f"/><path d="M120 45V160M65 100H175" stroke="#f9faef" stroke-width="7"/><path d="M45 28v150M194 28v150" stroke="${bed}" stroke-width="18"/><rect x="265" y="143" width="185" height="90" rx="7" fill="${dark}"/><path d="M235 190h235v67H235Z" fill="${bed}"/><rect x="248" y="177" width="85" height="34" rx="8" fill="#faf6e9"/><rect x="343" y="177" width="85" height="34" rx="8" fill="#e9e7d4"/><path d="M245 221h215v36H245Z" fill="${dark}" opacity=".2"/><path d="M249 257v14M459 257v14" stroke="${dark}" stroke-width="8"/><ellipse cx="125" cy="268" rx="85" ry="13" fill="#c9ccb6" opacity=".6"/><path d="M70 215h88v11H70Z" fill="${dark}"/><path d="M79 225v41M148 225v41" stroke="${dark}" stroke-width="5"/><rect x="92" y="200" width="28" height="15" rx="3" fill="#ece5c9"/><path d="M105 200v-37" stroke="#64896b" stroke-width="3"/><ellipse cx="95" cy="178" rx="9" ry="17" fill="#799975" transform="rotate(-35 95 178)"/><ellipse cx="115" cy="169" rx="8" ry="17" fill="#5a8263" transform="rotate(35 115 169)"/><rect x="320" y="40" width="64" height="70" fill="#f4efdf" stroke="${dark}" stroke-width="3"/><circle cx="352" cy="66" r="12" fill="#d5ab7c"/><path d="M330 100 350 76 375 100Z" fill="#94a281"/></svg></div>`;
}

/* village — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function village() {
  return `<svg viewBox="0 0 600 530" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="푸른 산과 이웃의 집이 어우러진 옥천 마을 일러스트"><defs><clipPath id="vclip"><rect x="5" y="5" width="590" height="505" rx="145"/></clipPath></defs><g clip-path="url(#vclip)"><rect width="600" height="530" fill="#e9efdb"/><circle cx="460" cy="98" r="35" fill="#e4c989"/><path d="M-20 254 88 139 166 214 277 105 390 239 473 170 630 291V530H0" fill="#d5dfbf"/><path d="M-20 320 105 205 222 307 350 190 505 308 600 222v308H0" fill="#bfcea5"/><path d="M0 381Q140 270 300 354T620 325V550H0" fill="#a5bc88"/><path d="M215 550q-48-75 44-106t49-86" fill="none" stroke="#eae6cb" stroke-width="46"/><path d="M50 356V270h131v86" fill="#f7f0dc"/><path d="m31 276 85-73 85 73Z" fill="#4e7756"/><path d="M100 356v-52h33v52" fill="#c0b597"/><path d="M66 295h22v26H66ZM148 295h21v26h-21Z" fill="#9cb39a"/><path d="M377 348V248h136v100Z" fill="#f1e8cf"/><path d="m358 253 87-70 88 70Z" fill="#d39a71"/><path d="M436 348v-58h32v58" fill="#b8946e"/><path d="M394 275h24v26h-24ZM482 275h17v26h-17Z" fill="#9cb39a"/><path d="M219 418V304h148v114" fill="#fff5df"/><path d="m197 312 95-84 96 84Z" fill="#326c50"/><path d="M277 418v-64h32v64" fill="#c6ac7e"/><circle cx="302" cy="389" r="3" fill="#fff"/><path d="M235 337h25v31h-25ZM324 337h25v31h-25Z" fill="#b3c9aa"/><path d="M250 337v31M235 352h25M337 337v31M324 352h25" stroke="#f7f0dc" stroke-width="3"/><rect x="325" y="258" width="15" height="35" fill="#326c50"/><path d="M342 234q20-14 8-31" stroke="#eef0e2" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M49 413v-69M540 404v-84M174 419v-54" stroke="#7e8e5e" stroke-width="7"/><ellipse cx="49" cy="334" rx="27" ry="45" fill="#527c53"/><ellipse cx="540" cy="309" rx="32" ry="49" fill="#618554"/><ellipse cx="174" cy="364" rx="21" ry="31" fill="#6c915c"/><path d="M416 448v-29" stroke="#466a52" stroke-width="8"/><circle cx="416" cy="406" r="8" fill="#c99065"/><path d="M401 420q15-11 30 0l-4 21h-22Z" fill="#f4edcf"/><path d="M410 440v19M423 440v19" stroke="#466a52" stroke-width="5"/><path d="M446 446v-25" stroke="#6b7654" stroke-width="8"/><circle cx="446" cy="408" r="8" fill="#c89063"/><path d="M433 423q13-10 26 0l-3 20h-20Z" fill="#d1a274"/><path d="M441 441v17M452 441v17" stroke="#6b7654" stroke-width="5"/><path d="M55 458q42-19 78 0M462 487q40-23 84-4" stroke="#8ba777" stroke-width="4" fill="none"/><g fill="#efebcd"><circle cx="81" cy="445" r="3"/><circle cx="91" cy="452" r="3"/><circle cx="495" cy="466" r="3"/><circle cx="506" cy="470" r="3"/></g></g></svg>`;
}

/* homeCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function homeCard(h, parentId = "") {
  return `<a class="homecard" href="#/home/${h.id}${parentId ? "/" + parentId : ""}"><div style="position:relative">${room(h)}<span class="badge" style="position:absolute;top:13px;left:13px">${h.type}</span></div><div class="cardbody"><div class="subtle">${h.region} · 대략 위치 <span class="demo-pill">예시 공간</span></div><h3>${h.name}</h3><div class="price">${cost(h)} <small>/ 월 고정비</small></div><div class="subtle">보증금 ${money(h.deposit)} · ${dateText(h)}</div><div class="card-bottom"><span>제공자 전화 확인 · 2026.10.16</span><span>자세히 보기 ↗</span></div></div></a>`;
}

/* money — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const money = (v) => (v == null || v === "" ? "미확인" : v + "만 원");

/* cost — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const cost = (h) => (h.rent == null || h.fee == null ? "비용 미확인" : money(h.rent + h.fee));

/* dateText — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const dateText = (h) => (h.date ? `${h.date.slice(5).replace("-", ".")}부터` : "일정 협의");

/* communityRoutes — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const communityRoutes = {
  "일상": "daily",
  "새로 왔어요": "welcome",
  "동네 정보": "info",
  "지원 정책": "policy",
  "전체": "all",
};

/* communityHref — 게시물의 분류와 식별자를 목적지에 포함해 해당 커뮤니티 탭으로 이동할 주소를 만듭니다. */
function communityHref(category, postId) {
  return (
    "#/community/" +
    (communityRoutes[category] || "all") +
    (postId ? "/" + encodeURIComponent(postId) : "")
  );
}

/* communityCategory — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function communityCategory(segment) {
  let value;
  /* 오류가 발생할 수 있는 작업을 수행하고 실패 상황을 처리합니다. */ try {
    value = decodeURIComponent(segment);
  } catch {
    return "전체";
  }
  return (
    Object.keys(communityRoutes).find((k) => communityRoutes[k] === value) ||
    (Object.hasOwn(communityRoutes, value) ? value : "전체")
  );
}

/* openCommunityPreview — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function openCommunityPreview(event, link) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    event.button > 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  const post = allPosts().find((p) => p.id === link.dataset.postId);
  communityTab = post?.category || link.dataset.category;
  feedLimit = 5;
  const href = communityHref(communityTab, post?.id);
  if (location.hash !== href) history.pushState(null, "", href);
  render();
}

/* communityPreview — 랜딩페이지에 표시할 커뮤니티 게시물을 분류별로 선택합니다. */
function communityPreview(category) {
  const p = allPosts().find((p) => p.category === category);
  const href = communityHref(category, p?.id);
  const visual = p?.photos?.length
    ? `<img src="${esc(p.photos[0])}" alt="${esc(p.title)} 첨부 사진">`
    : p?.visual === "village"
      ? village()
      : p?.visual === "room"
        ? room(homes[0])
        : '<span aria-hidden="true">♧</span>';
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<a class="story" href="${href}" data-category="${esc(category)}" data-post-id="${esc(p?.id || "")}" ${uiActionAttrs("click", "openCommunityPreview_2", [])}><div class="story-visual">${visual}</div><div><span class="badge ${category === "새로 왔어요" ? "orange" : ""}">${category}</span><h3>${p ? esc(p.title) : "아직 이야기가 없어요."}</h3><span class="subtle">${p ? esc(p.author) + " · " + (p.owned ? "최신 이야기" : "예시 이야기") : "첫 이야기를 들려주세요."}</span></div></a>`;
}

/* home — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */

/* filterHomes — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function filterHomes(f = filter) {
  return activeHomes().filter(
    (h) =>
      (!f.type || h.type === f.type) &&
      (!f.region || h.region === f.region) &&
      (f.budget === "" || (h.rent !== null && h.rent + h.fee <= Number(f.budget))) &&
      (f.deposit === "" || (h.deposit !== null && h.deposit <= Number(f.deposit))) &&
      (!f.date || (h.date !== null && h.date <= f.date)),
  );
}

/* mapSvg — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function mapSvg() {
  return `<svg class="map-bg" viewBox="0 0 700 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="700" height="650" fill="#e9efdf"/><g fill="#dde6ce"><path d="M0 0H260L210 150 80 200 0 175Z"/><path d="M410 0H700V260L550 230 450 130Z"/><path d="M0 470 155 430 220 650H0Z"/><path d="M460 450 600 390 700 490V650H540Z"/></g><g stroke="#fffdf2" fill="none" stroke-linecap="round"><path d="M-30 320Q220 400 340 240T730 220" stroke-width="25"/><path d="M180-30Q270 180 250 350T400 700" stroke-width="20"/><path d="M20 500 500 330 720 400M360 0 390 220 480 400 700 530" stroke-width="11"/></g><path d="M-30 580Q120 440 340 490T750 550" stroke="#b6d9d2" fill="none" stroke-width="28"/><g fill="#d2dbc4" stroke="#e9efdf" stroke-width="4"><rect x="80" y="240" width="60" height="33" rx="4"/><rect x="400" y="270" width="70" height="40" rx="4"/><rect x="290" y="360" width="46" height="56" rx="4"/><rect x="510" y="130" width="70" height="34" rx="4"/><rect x="125" y="390" width="50" height="40" rx="4"/></g><text x="310" y="315" fill="#9cae8c" font-size="24" font-family="sans-serif" font-weight="600">옥천 생활권</text><text x="90" y="130" fill="#98aa88" font-size="13">마을과 산책길</text><text x="480" y="580" fill="#8caaa3" font-size="12">물길</text></svg>`;
}

/* homesPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function homesPage() {
  return `<div class="container"><div class="page-head"><div><div class="section-kicker">FIND YOUR HOME</div><h1>나의 첫 집을 찾아보세요.</h1><p>위치부터 생활의 모양까지, 편하게 살펴보세요.</p></div><a class="btn" href="#/request">조건 맞춰 추천받기 ↗</a></div><div class="notice warning">체험 지도 · 실제 지형과 위치를 나타내지 않는 도식입니다. 모든 공간과 확인 정보는 가상 예시입니다.</div><div class="filters" aria-label="공간 검색 조건"><select aria-label="희망 지역" ${uiActionAttrs("change", "setFilter_3", [])}><option value="">옥천 전체</option>${["옥천읍", "동이면", "이원면", "청산면"].map((t) => `<option ${filter.region === t ? "selected" : ""}>${t}</option>`).join("")}</select><select aria-label="주거 유형" ${uiActionAttrs("change", "setFilter_4", [])}><option value="">주거 형태 전체</option>${types.map((t) => `<option ${filter.type === t ? "selected" : ""}>${t}</option>`).join("")}</select><select aria-label="월 고정비 상한" ${uiActionAttrs("change", "setFilter_5", [])}><option value="">월 고정비 무관</option>${[15, 25, 40, 50].map((t) => `<option value="${t}" ${filter.budget === String(t) ? "selected" : ""}>월 ${t}만 원 이하</option>`).join("")}</select><input type="date" aria-label="희망 입주일" value="${esc(filter.date)}" ${uiActionAttrs("change", "setFilter_6", [])}><button class="textlink" ${uiActionAttrs("click", "resetFilters_7", [])}>초기화 ↺</button></div><div class="search-layout"><div class="list-panel" id="listing-list"></div><div class="map-panel" aria-label="공간 위치 도식">${mapSvg()}<div class="map-note">⌖ 옥천 전체 · 도식 지도</div><div id="markers"></div><div id="map-popup"></div><div class="map-legend">⌂ 셰어하우스 · ♧ 룸메이트 · ▣ 원룸 · ⌑ 여유방 · ♨ 하숙 · ▤ 고용주 숙소</div></div></div></div>`;
}

/* setFilter — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function setFilter(k, v) {
  filter[k] = v;
  selected = null;
  drawMap();
}

/* resetFilters — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function resetFilters() {
  filter = { type: "", region: "", budget: "", deposit: "", date: "" };
  render(false);
}

/* drawMap — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function drawMap() {
  const list = filterHomes();
  setHTML($("#listing-list"), `<div class="list-title"><b>제공 가능 공간 ${list.length}개</b><small class="subtle">예시 데이터</small></div>${list.length ? list.map((h) => `<button class="listing ${selected === h.id ? "selected" : ""}" ${uiActionAttrs("click", "selectHome_8", [h.id])} aria-label="${h.name} 선택">${room(h)}<div><span class="badge">${h.type}</span><h3>${h.name}</h3><div class="price">${cost(h)}</div><div class="subtle">${h.region} · ${dateText(h)}</div></div></button>`).join("") : `<div class="empty"><div class="empty-symbol">⌕</div><h3>조건에 맞는 공간이 없어요.</h3><p class="subtle">예산이나 입주일을 바꾸어 찾아보세요.<br>모르는 조건은 충족으로 간주하지 않아요.</p><button class="btn secondary small" ${uiActionAttrs("click", "resetFilters_7", [])}>조건 초기화</button></div>`}<div class="notice" style="margin-top:15px">원하는 공간이 없나요?<br><a href="#/request" class="textlink">현재 조건으로 추천 신청하기 →</a></div>`);
  setHTML($("#markers"), list
    .map(
      (h) =>
        `<button class="marker ${selected === h.id ? "selected" : ""}" style="left:${h.x}%;top:${h.y}%" ${uiActionAttrs("click", "selectHome_8", [h.id])} aria-label="${h.type}, ${h.name}">${icons[types.indexOf(h.type)]} ${h.type}</button>`,
    )
    .join(""));
  const h = list.find((h) => h.id === selected);
  setHTML($("#map-popup"), h
    ? `<div class="map-popup"><button class="popup-close" aria-label="선택 닫기" ${uiActionAttrs("click", "selectHome_9", [])}>×</button><span class="badge">${h.type} · 예시 공간</span><h3 style="margin-top:9px">${h.name}</h3><div class="price">${cost(h)}</div><p class="subtle">보증금 ${money(h.deposit)} · ${dateText(h)}<br>${h.region} · 대략 위치 · 전화 확인 예시</p><div class="actions"><a class="btn secondary small" href="#/home/${h.id}">상세 정보</a><a class="btn small" href="${consultationHref(h.id)}">이 공간 상담</a></div></div>`
    : "");
}

/* selectHome — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function selectHome(id) {
  selected = id;
  drawMap();
}

/* spaceDetailContent — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function spaceDetailContent(h, action = "") {
  return `<div class="detail-layout"><div class="detail-visual"><div id="main-room">${room(h)}</div><div class="detail-thumbs">${[0, 1, 2].map((v) => `<button aria-label="실내 분위기 예시 ${v + 1} 보기" ${uiActionAttrs("click", "changeRoom_10", [h.id, v])}>${room(h, v)}</button>`).join("")}</div><p class="micro">실제 공간 사진이 아닌 분위기 일러스트입니다.</p></div><div class="detail-info"><span class="badge">${h.type}</span> <span class="demo-pill">예시 공간</span><h1>${h.name}</h1><p class="subtle">⌖ ${h.region} · 대략 위치만 공개해요</p><div class="price">${cost(h)} <small>/ 월 고정비</small></div><p class="subtle">보증금 ${money(h.deposit)}<br>월세 ${money(h.rent)} + 고정 관리비 ${money(h.fee)}<br>전기·수도·난방 등 사용 실비 별도</p><dl class="specs"><div><dt>입주 가능 시기</dt><dd>${dateText(h)}</dd></div><div><dt>거주 기간</dt><dd>${h.min ? `${h.min}~${h.max}개월` : "확인 필요"}</dd></div><div><dt>주방 / 욕실</dt><dd>${h.kitchen ?? "미확인"} / ${h.bath ?? "미확인"}</dd></div><div><dt>확인 기록 (예시)</dt><dd>2026.10.16 · 제공자 전화</dd></div></dl>${action}<p class="micro">정확한 주소와 방문 일정은 실제 운영 상담 후 안내됩니다.</p></div></div><div class="formbox"><h2>이 공간의 생활</h2><p>${h.description}</p><div class="chips">${h.facilities.map((t) => `<span class="chip">✓ ${t}</span>`).join("")}</div></div><div class="notice warning" style="margin-bottom:55px">전화 확인은 현장·안전·권리 확인과 구분됩니다. 통근 시간과 시설의 실제 상태, 계약 조건은 방문·전문기관을 통해 별도 확인해야 합니다.</div>`;
}

/* detail — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function detail(id, parentId) {
  const h = homes.find((h) => h.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!h) return notFound();
  const source = housingSource(parentId),
    available = activeHomes().some((x) => x.id === id);
  const action = available
    ? `<a class="btn" style="width:100%" href="${consultationHref(id, source?.id)}">이 공간 상담 신청 ↗</a>`
    : `<div class="notice warning">${esc(listingStates[id])}된 공간이에요.</div><a class="btn secondary" href="#/homes">다른 공간 보기</a>`;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container"><div class="page-head"><a href="${source ? "#/result/" + source.id : "#/homes"}" class="textlink">← ${source ? "추천 결과" : "지도와 목록"}로 돌아가기</a></div>${spaceDetailContent(h, action)}</div>`;
}

/* changeRoom — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function changeRoom(id, v) {
  setHTML($("#main-room"), room(
    homes.find((h) => h.id === id),
    v,
  ));
}

/* field — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const field = (label, html, full = false) =>
  `<div class="field ${full ? "full" : ""}"><label>${label}</label>${html}</div>`;

/* options — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const options = (items, value) =>
  items
    .map((t) => `<option value="${esc(t)}" ${value === t ? "selected" : ""}>${t}</option>`)
    .join("");

/* txt — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const txt = (name, value = "", extra = "") =>
  `<input name="${name}" aria-label="${name}" value="${esc(value)}" ${extra}>`;

/* requestPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function requestPage(id) {
  const h = homes.find((h) => h.id === id);
  let d = requestDraft;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !Object.keys(d).length
  )
    d = { region: filter.region, budget: filter.budget, date: filter.date, type: filter.type };
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (h)
    d = { ...d, listingId: h.id };
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container"><div class="page-head"><div><div class="section-kicker">FIRST HOME, FIRST STEP</div><h1>첫 거처, 어떤 조건이 필요한가요?</h1><p>정해진 것부터 알려주세요. 아직 모르는 항목은 협의로 남길 수 있어요.</p></div></div><div class="notice warning">신청 체험 · 실제 운영팀에 전송되지 않습니다. 실제 개인정보 대신 예시 정보를 입력해주세요.</div><div class="form-layout"><aside class="form-aside"><b>집 구하기 신청</b>${["이사 일정", "비용 조건", "생활권·통근", "거주 방식", "연락·확인"].map((t, i) => `<a href="#" ${uiActionAttrs("click", "getElementById_11", [i])}>0${i + 1} ${t}</a>`).join("")}<div class="notice">집을 처음 구해도 괜찮아요.<br>후보가 없어도 조건을 유지해 도움을 요청할 수 있어요.</div></aside><form id="request-form"><input type="hidden" name="listingId" value="${esc(d.listingId ?? "")}">${h ? `<div class="notice">선택한 공간: <b>${h.name}</b><br>이 공간을 포함하여 조건을 확인해요.</div>` : ""}<section class="formbox" id="f0"><h2><span>01</span>이사 일정</h2><div class="fields">${field("희망 입주일", txt("date", d.date, 'type="date"'))}${field("예상 거주 기간 *", `<select name="duration" required>${options(["협의·미정", "1개월", "3개월", "6개월", "12개월"], d.duration)}</select>`)}</div><p class="micro">입주일을 비워두면 일정 협의로 처리합니다. 날짜가 미확인인 공간은 날짜 조건 충족으로 판단하지 않아요.</p></section><section class="formbox" id="f1"><h2><span>02</span>비용 조건</h2><div class="fields">${field("보증금 상한 (만 원)", txt("deposit", d.deposit, 'type="number" min="0" max="100000" placeholder="비워두면 협의"'))}${field("월 고정비 상한 (만 원)", txt("budget", d.budget, 'type="number" min="0" max="10000" placeholder="비워두면 협의"'))}</div><div class="notice" style="margin:20px 0 0">월 고정비 = 월세 + 고정 관리비. 전기·수도·난방 등 사용 실비는 별도로 확인합니다.</div></section><section class="formbox" id="f2"><h2><span>03</span>생활권과 통근</h2><div class="fields">${field("희망 생활권", `<select name="region"><option value="">옥천 내 무관</option>${options(["옥천읍", "동이면", "이원면", "청산면"], d.region)}</select>`)}${field("직장·주요 목적지 (선택)", txt("destination", d.destination, 'maxlength="100" placeholder="읍·면이나 근처 시설"'))}${field("주로 이용할 이동 수단", `<select name="transport">${options(["아직 모름", "자가용", "대중교통", "도보·자전거"], d.transport)}</select>`)}${field("통근 시간 상한 (선택)", txt("commute", d.commute, 'type="number" min="1" max="300" placeholder="편도 / 분"'))}</div><p class="micro">통근 시간은 후보의 자동 조회 기준에 포함되지 않으며, 상담에서 추가 확인할 조건으로 저장해요.</p></section><section class="formbox" id="f3"><h2><span>04</span>거주 방식</h2><div class="fields">${field("가능한 주거 형태", `<select name="type"><option value="">주거 형태 무관</option>${options(types, d.type)}</select>`)}${field("욕실 사용 조건", `<select name="bath"><option value="">공유 가능·무관</option><option value="단독" ${d.bath === "단독" ? "selected" : ""}>단독 사용 필수</option></select>`)}${field("주방 사용 조건", `<select name="kitchen"><option value="">공유 가능·무관</option><option value="단독" ${d.kitchen === "단독" ? "selected" : ""}>단독 사용 필수</option></select>`)}${field("반려동물", `<select name="pet"><option value="">해당 없음</option><option value="yes" ${d.pet === "yes" ? "selected" : ""}>동반 가능 공간 필수</option></select>`)}${field("반드시 필요한 조건 (선택)", `<textarea name="must" maxlength="500" placeholder="예: 계단 이용이 어려워요">${esc(d.must)}</textarea>`, true)}${field("조정 가능한 선호 (선택)", `<textarea name="preferences" maxlength="500" placeholder="예: 햇빛이 잘 들면 좋아요">${esc(d.preferences)}</textarea>`, true)}</div><p class="micro">직접 적은 필수 조건은 자동으로 충족 판정하지 않습니다. 결과에서 추가 확인이 필요한 후보로 구분해요.</p></section><section class="formbox" id="f4"><h2><span>05</span>연락과 확인</h2><div class="fields">${field("이름 또는 별칭 *", txt("name", d.name, 'required maxlength="40" placeholder="예: 첫걸음" autocomplete="nickname"'))}${field("휴대전화 (체험용) *", txt("phone", d.phone, 'required type="tel" pattern="0[0-9-]{8,14}" placeholder="예: 010-0000-0000"'))}${field("답변 수단", `<select name="reply">${options(["전화", "문자", "이메일"], d.reply)}</select>`)}${field("이메일 (이메일 답변 선택 시 필수)", txt("email", d.email, 'type="email" placeholder="name@example.com"'))}</div><label class="check"><input name="consent" type="checkbox" required ${d.consent ? "checked" : ""}>[필수] 체험 정보가 이 브라우저에 저장되는 것에 동의해요.</label><label class="check"><input name="notify" type="checkbox" ${d.notify ? "checked" : ""}>[선택] 새 공간 안내를 희망해요. (의사만 저장되며 실제 발송되지 않음)</label><p class="micro">문자 인증과 운영 연락은 아직 연결되지 않았습니다.</p></section><div class="form-submit"><a href="#/homes" class="textlink">← 지도 돌아가기</a><button class="btn" type="submit">조건 확인하고 신청하기 ↗</button></div></form></div></div>`;
}

/* match — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function match(d) {
  return filterHomes({
    type: d.type || "",
    region: d.region || "",
    budget: d.budget ?? "",
    deposit: d.deposit ?? "",
    date: d.date || "",
  }).filter(
    (h) =>
      (!d.bath || h.bath === d.bath) &&
      (!d.kitchen || h.kitchen === d.kitchen) &&
      (d.pet !== "yes" || h.pet === true) &&
      (!d.duration ||
        d.duration === "협의·미정" ||
        (h.min !== null && parseInt(d.duration) >= h.min && parseInt(d.duration) <= h.max)),
  );
}

/* addApplication — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function addApplication(a) {
  const next = [a, ...applications];
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !save("applications", next)
  )
    return false;
  applications = next;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return true;
}

/* makeId — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const makeId = () =>
  `OK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${newId().slice(0, 8).toUpperCase()}`;

/* requestEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function requestEvents() {
  const form = $("#request-form");
  form.addEventListener("input", () => {
    requestDraft = Object.fromEntries(new FormData(form));
    save("draft", requestDraft);
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    if (d.reply === "이메일" && !d.email) {
      toast("이메일 답변을 받으려면 이메일 주소를 입력해주세요.");
      form.elements.email.focus();
      return;
    }
    if (d.listingId && !activeHomes().some((h) => h.id === d.listingId)) {
      toast("선택한 공간의 모집이 종료되었습니다. 지도에서 다른 공간을 선택해주세요.");
      return;
    }
    const n = match(d);
    modal(
      `<h2>입력한 조건을 확인해주세요.</h2>${conditionSummary(d)}<p class="subtle">자동 조회는 비용·날짜·유형·지역·거주 기간·공용 시설·반려동물 조건을 비교합니다. 통근지와 직접 적은 조건은 추가 확인이 필요해요.</p><div class="notice warning">체험 저장이며 실제 상담 접수는 이루어지지 않아요.</div><div class="modal-actions"><button class="btn secondary" ${uiActionAttrs("click", "closeModal_1", [])}>다시 수정</button><button class="btn" id="confirm-request">확인하고 저장</button></div>`,
    );
    $("#confirm-request").onclick = () => {
      const b = $("#confirm-request");
      b.disabled = true;
      let a;
      if (editId) {
        const ix = applications.findIndex((a) => a.id === editId);
        if (ix < 0) {
          toast("신청을 찾을 수 없습니다.");
          b.disabled = false;
          return;
        }
        a = {
          ...applications[ix],
          data: d,
          matches: n.map((h) => h.id),
          status: "조건 변경",
          history: [
            ...(applications[ix].history || []),
            { time: new Date().toISOString(), text: "신청 조건 변경" },
          ],
        };
        const next = applications.map((x) => (x.id === editId ? a : x));
        if (!save("applications", next)) {
          b.disabled = false;
          return;
        }
        applications = next;
        editId = null;
      } else {
        a = {
          id: makeId(),
          kind: "housing",
          data: d,
          matches: n.map((h) => h.id),
          status: "접수",
          created: new Date().toISOString(),
          history: [{ time: new Date().toISOString(), text: "체험 신청 저장" }],
        };
        if (!addApplication(a)) {
          b.disabled = false;
          return;
        }
      }
      closeModal();
      requestDraft = {};
      save("draft", {});
      location.hash = "/result/" + a.id;
    };
  };
}

/* conditionSummary — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function conditionSummary(d) {
  return `<div class="summary"><dl><div><dt>입주 시기 · 거주 기간</dt><dd>${esc(d.date || "일정 협의")} · ${esc(d.duration || "협의")}</dd></div><div><dt>월 고정비 · 보증금 상한</dt><dd>${d.budget !== "" && d.budget != null ? esc(d.budget) + "만 원" : "협의"} · ${d.deposit !== "" && d.deposit != null ? esc(d.deposit) + "만 원" : "협의"}</dd></div><div><dt>생활권 · 유형</dt><dd>${esc(d.region || "옥천 내 무관")} · ${esc(d.type || "무관")}</dd></div><div><dt>추가 조건</dt><dd>${esc([d.bath ? "욕실 " + d.bath : "", d.kitchen ? "주방 " + d.kitchen : "", d.pet === "yes" ? "반려동물" : "", d.must].filter(Boolean).join(" · ") || "없음")}</dd></div></dl></div>`;
}

/* resultPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function resultPage(id) {
  const a = applications.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return notFound();
  const candidates = match(a.data),
    manual = Boolean(
      a.data.must ||
      a.data.destination ||
      a.data.commute ||
      (a.data.listingId && homes.find((h) => h.id === a.data.listingId)?.type === "고용주 숙소"),
    );
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container"><div class="result"><div class="result-title"><div class="success">✓</div><span class="section-kicker">YOUR NEXT STEP</span><h1>첫 걸음을 저장했어요.</h1><p class="subtle">신청번호 ${esc(a.id)} · 이 브라우저에 저장됨</p></div><div class="notice warning">체험 신청입니다. 운영자에게 전송되지 않았으며 실제 상담·안내는 발송되지 않습니다.</div>${conditionSummary(a.data)}${candidates.length ? `<div class="section-head"><div><h2>${manual ? "추가 조건 확인이 필요한 후보" : "입력 조건으로 조회한 후보"} ${candidates.length}곳</h2><p>${manual ? "직접 입력한 조건과 통근 여건은 충족 여부를 추가로 확인해야 해요." : "상세 조건을 확인하고 방문과 협의로 이어가세요."}</p></div></div><div class="grid3" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${candidates.map((h) => `<div class="candidate-option">${homeCard(h, a.id)}<a class="btn secondary small" href="${consultationHref(h.id, a.id)}">이 공간 상담 신청 ↗</a></div>`).join("")}</div><p class="micro">현재 자동 비교 가능한 항목의 후보이며 입주·계약 확정이 아닙니다. 미확인 시설·일정은 별도로 확인해주세요.</p><div class="actions" style="margin-top:25px"><button class="btn" ${uiActionAttrs("click", "consult_12", [a.id])}>운영자 상담 요청</button><button class="btn secondary" ${uiActionAttrs("click", "editRequest_13", [a.id])}>조건 수정하기</button></div>` : `<div class="empty"><div class="empty-symbol">⌕</div><h2>현재 조건에 맞는 공간이 없어요.</h2><p class="subtle">등록된 예시 공간 중에서 찾지 못했어요.<br>조건을 바꾸거나, 지금의 조건 그대로 상담을 요청할 수 있어요.</p><div class="actions" style="justify-content:center;margin-top:25px"><button class="btn" ${uiActionAttrs("click", "consult_12", [a.id])}>운영자 상담 요청</button><button class="btn secondary" ${uiActionAttrs("click", "editRequest_13", [a.id])}>조건 변경·재검색</button></div><p class="micro">두 경로는 독립적으로 선택할 수 있어요.</p></div>`}<div class="actions" style="margin-top:25px"><a class="textlink" href="#/applications">내 활동 →</a><a class="textlink" style="margin-left:auto" href="#/homes">지도에서 둘러보기 →</a></div></div></div>`;
}

/* consult — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function consult(id) {
  const a = applications.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (a.status === "취소") {
    toast("취소된 신청입니다.");
    return;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    a.status === "상담 요청"
  ) {
    toast("이미 상담 요청 의사가 저장되어 있어요.");
    return;
  }
  updateApplication(id, { status: "상담 요청" }, "상담 요청 의사 저장");
  toast("상담 요청 의사를 저장했어요. 실제 운영자 전송은 되지 않습니다.");
}

/* updateApplication — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function updateApplication(id, patch, text) {
  const next = applications.map((a) =>
    a.id === id
      ? {
          ...a,
          ...patch,
          history: [...(a.history || []), { time: new Date().toISOString(), text }],
        }
      : a,
  );
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    save("applications", next)
  ) {
    applications = next;
    return true;
  }
  return false;
}

/* editRequest — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function editRequest(id) {
  const a = applications.find((x) => x.id === id);
  editId = id;
  requestDraft = { ...a.data };
  save("draft", requestDraft);
  location.hash = "/request";
}

/* providePage — 사용자의 요청을 확인하고 관련 신청·등록 절차를 진행합니다. */

/* prepareImages — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
async function prepareImages(files) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (files.length > 5)
    throw Error("사진은 최대 5장까지 선택할 수 있어요.");
  const out = [];
  for (const f of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type))
      throw Error("JPG, PNG, WEBP 이미지만 사용할 수 있어요.");
    if (f.size > 5 * 1024 * 1024) throw Error("사진 한 장은 5MB 이하여야 해요.");
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error("사진을 읽을 수 없어요. 다시 선택해주세요."));
      reader.readAsDataURL(f);
    });
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(Error("올바른 이미지 파일인지 확인해주세요."));
      img.src = url;
    });
    const canvas = document.createElement("canvas"),
      scale = Math.min(1, 1100 / img.width, 1100 / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    out.push(canvas.toDataURL("image/jpeg", 0.77));
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return out;
}

/* provideEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */

/* completePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function completePage(id) {
  const a = applications.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return notFound();
  return `<div class="container"><div class="result"><div class="result-title"><div class="success">✓</div><h1>따뜻한 시작을 나눠주셔서 감사해요.</h1><p>공간 제공 신청을 이 브라우저에 저장했습니다.</p></div><div class="notice warning">실제 운영팀에 전송되지 않은 체험 신청입니다.</div><div class="summary"><h3>${esc(a.data.type)} · ${esc(a.data.region)}</h3><p class="subtle">신청번호 ${esc(a.id)}<br>제공 권한: ${esc(a.data.authority)}<br>제공 가능일: ${esc(a.data.date || "협의")}<br>공개 동의: ${a.data.locationConsent ? "대략 위치·사진 공개 동의" : "공개 미동의"}</p><div class="timeline"><span class="done">신청 저장</span><span>운영자 확인</span><span>현장 확인·보완</span><span>공개 협의·승인</span></div><p class="subtle">실서비스에서는 담당자가 연락하여 권한·비용·시설·공개 범위를 확인합니다. 접수만으로 지도에 공개되지 않습니다.</p></div><div class="actions" style="justify-content:center"><a class="btn" href="#/applications">내 활동</a><a class="btn secondary" href="#/">홈으로</a></div></div></div>`;
}

/* applicationsPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function applicationsPage() {
  return `<div class="container"><div class="page-head"><div><div class="section-kicker">MY FIRST CHAPTER</div><h1>내 활동</h1><p>추천 신청, 공간 상담과 공간 제공의 진행 상황을 확인하세요.</p></div></div><div class="notice warning">현재 브라우저에 저장한 체험 신청 내역입니다. 실제 운영 접수 상태를 의미하지 않습니다.</div><div style="max-width:850px;margin:10px auto 60px">${applications.length ? applications.map(applicationCard).join("") : `<div class="empty"><div class="empty-symbol">⌂</div><h2>아직 저장한 신청이 없어요.</h2><p class="subtle">지도에서 첫 집을 둘러보거나 공간을 알려주세요.</p><div class="actions" style="justify-content:center"><a class="btn" href="#/homes">집 구하기</a><a class="btn secondary" href="#/provide">공간 제공</a></div></div>`}</div></div>`;
}

/* cancelRequest — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */

/* confirmCancel — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function confirmCancel(id) {
  if (
    updateApplication(
      id,
      { status: "취소", data: { ...applications.find((a) => a.id === id).data, notify: false } },
      "신청자가 취소",
    )
  ) {
    closeModal();
    render(false);
    toast("신청을 취소했어요.");
  }
}

/* showHistory — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function showHistory(id) {
  const a = applications.find((a) => a.id === id);
  modal(
    `<h2>신청 진행 기록</h2><p class="subtle">${esc(id)}</p>${(a.history || []).map((h) => `<div class="comment"><b>${esc(h.text)}</b><br><span class="subtle">${new Date(h.time).toLocaleString("ko-KR")}</span></div>`).join("")}`,
  );
}

/* communityPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */

/* postCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function postCard(p) {
  return `<article class="post" id="post-${p.id}"><div class="post-head"><div><span class="avatar">${esc(p.author.slice(0, 1))}</span><b>${esc(p.author)}</b><span class="subtle"> · ${p.owned ? "내 이야기" : "이웃 이야기"}</span></div><span class="badge ${p.category === "새로 왔어요" ? "orange" : ""}">${esc(p.category)}</span></div><div class="post-image">${p.photos?.length ? `<img src="${p.photos[0]}" alt="${esc(p.title)} 첨부 사진">` : p.visual === "village" ? village() : p.visual === "room" ? room(homes[0]) : `<div style="padding:25px;text-align:center"><div class="section-kicker">YOUR FIRST HOME CHECKLIST</div><h2>첫 집, 함께 확인해요.</h2><p>비용 · 시설 · 일정 · 통근</p><span style="font-size:38px">⌂</span></div>`}</div>${p.photos?.length > 1
      ? `<div class="upload-preview" style="padding:10px 20px">${p.photos
          .slice(1)
          .map(
            (s) =>
              `<a href="${s}" target="_blank" aria-label="추가 첨부 사진 확대"><img src="${esc(s)}" alt="추가 첨부 사진"></a>`,
          )
          .join("")}</div>`
      : ""}<div class="post-body"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><span class="subtle">${p.owned ? new Date(p.created).toLocaleDateString("ko-KR") : "옥키 커뮤니티"}</span></div><div class="post-actions"><button ${uiActionAttrs("click", "toggleComments_19", [p.id])} aria-expanded="${openComments.has(p.id)}">♡ 댓글 ${(p.comments || []).length}</button>${p.owned ? `<button ${uiActionAttrs("click", "String_14", [p.id])}>수정</button><button ${uiActionAttrs("click", "deletePost_15", [p.id])}>삭제</button>` : ""}<button style="margin-left:auto" ${uiActionAttrs("click", "reportPost_20", [p.id])}>신고</button></div>${openComments.has(p.id) ? `<div class="comments">${(p.comments || []).map((c, i) => `<div class="comment"><b>${esc(c.author)}</b> ${esc(c.text)}${c.owned ? ` <button class="textlink" ${uiActionAttrs("click", "editComment_16", [p.id, i])}>수정</button> <button class="textlink" ${uiActionAttrs("click", "deleteComment_17", [p.id, i])}>삭제</button>` : ""}</div>`).join("")}<form class="comment-form" ${uiActionAttrs("submit", "addComment_18", [p.id])}><input aria-label="댓글 내용" name="comment" required maxlength="500" placeholder="따뜻한 인사를 남겨보세요"><button class="btn small">등록</button></form><p class="micro">댓글은 현재 브라우저에만 저장됩니다.</p></div>` : ""}</article>`;
}

/* setTab — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function setTab(t) {
  communityTab = t;
  feedLimit = 5;
  history.replaceState(null, "", communityHref(t));
  render(false);
}

/* toggleComments — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function toggleComments(id) {
  openComments.has(id) ? openComments.delete(id) : openComments.add(id);
  render(false);
  document.getElementById("post-" + id)?.scrollIntoView({ block: "nearest" });
}

/* mutatePost — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function mutatePost(id, fn) {
  const existing = posts.find((p) => p.id === id),
    p = structuredClone(existing || seedPosts.find((p) => p.id === id));
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p) return false;
  fn(p);
  const next = existing ? posts.map((x) => (x.id === id ? p : x)) : [p, ...posts];
  if (save("posts", next)) {
    posts = next;
    return true;
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return false;
}

/* refreshPost — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function refreshPost(id) {
  const article = document.getElementById("post-" + id),
    post = allPosts().find((p) => p.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!article || !post)
    return;
  const x = window.scrollX,
    y = window.scrollY;
  replaceHTML(article, postCard(post));
  window.scrollTo(x, y);
}

/* addComment — 입력한 댓글을 해당 게시물에 추가하고 변경 사항을 저장합니다. */
function addComment(e, id) {
  e.preventDefault();
  const text = e.target.elements.comment.value.trim();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!text) return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    mutatePost(id, (p) => {
      p.comments ??= [];
      p.comments.push({ author: "나의 이웃", text, owned: true });
    })
  ) {
    refreshPost(id);
    document.querySelector("#post-" + id + " .comment-form input")?.focus({ preventScroll: true });
    toast("댓글을 저장했어요.");
  }
}

/* editComment — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function editComment(id, i) {
  const p = allPosts().find((p) => p.id === id),
    c = p.comments[i];
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!c.owned) return;
  modal(
    `<h2>댓글 수정</h2><form id="edit-comment"><textarea name="text" required maxlength="500" aria-label="댓글 내용">${esc(c.text)}</textarea><div class="modal-actions"><button class="btn">수정 저장</button></div></form>`,
  );
  $("#edit-comment").onsubmit = (e) => {
    e.preventDefault();
    const t = e.target.elements.text.value.trim();
    if (!t) return;
    if (mutatePost(id, (p) => (p.comments[i].text = t))) {
      closeModal();
      refreshPost(id);
    }
  };
}

/* deleteComment — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function deleteComment(id, i) {
  if (
    mutatePost(id, (p) => {
      if (p.comments[i].owned) p.comments.splice(i, 1);
    })
  )
    refreshPost(id);
}

/* deletePost — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function deletePost(id) {
  modal(
    `<h2>이 이야기를 삭제할까요?</h2><p>삭제한 이야기는 복구할 수 없어요.</p><div class="modal-actions"><button class="btn secondary" ${uiActionAttrs("click", "closeModal_1", [])}>돌아가기</button><button class="btn" ${uiActionAttrs("click", "confirmDeletePost_21", [id])}>삭제하기</button></div>`,
  );
}

/* confirmDeletePost — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function confirmDeletePost(id) {
  const p = posts.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p?.owned) return;
  const next = posts.filter((p) => p.id !== id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (save("posts", next)) {
    posts = next;
    closeModal();
    render(false);
    toast("이야기를 삭제했어요.");
  }
}

/* reportPost — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function reportPost(id) {
  modal(
    `<h2>이야기 신고</h2><p class="subtle">신고 사유는 운영 화면 체험에 저장됩니다. 실제 운영자 전송은 되지 않아요.</p><form id="report-form"><select name="reason" aria-label="신고 사유" required>${options(["개인정보 노출", "광고·도배", "부적절한 내용", "기타"])}</select><textarea name="detail" aria-label="신고 설명" maxlength="500" placeholder="추가 설명 (선택)" style="margin-top:15px"></textarea><div class="modal-actions"><button class="btn">신고 저장</button></div></form>`,
  );
  $("#report-form").onsubmit = (e) => {
    e.preventDefault();
    const next = [
      {
        id: newId(),
        postId: id,
        ...Object.fromEntries(new FormData(e.target)),
        status: "접수",
        created: new Date().toISOString(),
      },
      ...reports,
    ];
    if (save("reports", next)) {
      reports = next;
      closeModal();
      toast("신고 사유를 이 브라우저에 저장했어요.");
    }
  };
}

/* writePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function writePage(id) {
  const p = posts.find((p) => p.id === id && p.owned);
  return `<div class="container"><div class="page-head"><div><div class="section-kicker">A STORY TO SHARE</div><h1>${p ? "이야기 수정" : "당신의 옥천을 들려주세요."}</h1><p>작은 일상과 반가운 인사를 사진으로 나누어요.</p></div></div><div style="max-width:740px;margin:0 auto 60px"><div class="notice warning">실제 다른 사용자에게 게시되지 않는 체험입니다. 연락처, 상세 주소, 타인의 개인정보는 올리지 마세요.</div><form id="post-form" class="formbox"><div class="fields">${field("사진 1~5장 *", `<input id="post-photos" type="file" aria-label="게시물 사진" accept="image/jpeg,image/png,image/webp" multiple ${p ? "" : "required"}><p class="micro">JPG·PNG·WEBP / 장당 5MB 이하 / 글 아래 게시 전 미리보기 제공</p><div id="post-preview" class="upload-preview">${(p?.photos || []).map((s) => `<img src="${esc(s)}" alt="현재 게시물 사진">`).join("")}</div>`, true)}${field("별칭 *", txt("author", p?.author, 'required maxlength="30" placeholder="이웃에게 불릴 이름"'))}${field("분류 *", `<select name="category">${options(["일상", "새로 왔어요", "동네 정보"], p?.category)}</select>`)}${field("제목 *", txt("title", p?.title, 'required maxlength="100" placeholder="어떤 이야기를 나누고 싶나요?"'), true)}${field("이야기 *", `<textarea name="body" aria-label="이야기 본문" required maxlength="3000" style="min-height:170px">${esc(p?.body)}</textarea>`, true)}</div><div class="form-submit" style="margin-top:25px"><a href="#/community" class="textlink">← 커뮤니티</a><button class="btn" type="submit">미리보기 →</button></div></form></div></div>`;
}

/* writeEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */

/* aboutPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */

/* adminPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */

/* adminStatus — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function adminStatus(id, status) {
  const a = applications.find((a) => a.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    status === "공개 승인"
  ) {
    toast("승인은 이력에만 저장됩니다. 현장 확인과 권한 검증 전 실제 매물은 생성되지 않아요.");
  }
  updateApplication(id, { status }, "운영 화면 체험: " + status);
  toast("처리 상태와 이력을 저장했어요.");
}

/* adminRecord — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function adminRecord(id) {
  const a = applications.find((a) => a.id === id);
  modal(
    `<h2>담당자와 확인 기록</h2><form id="record-form">${field("담당자", txt("assignee", a.assignee, 'maxlength="40"'))}${field("다음 연락 예정일", txt("nextDate", a.nextDate, 'type="date"'))}${field("상담·현장 확인·다음 행동", `<textarea name="note" required maxlength="1000"></textarea>`)}<div class="modal-actions"><button class="btn">기록 저장</button></div></form>`,
  );
  $("#record-form").onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (
      updateApplication(
        id,
        { assignee: d.assignee, nextDate: d.nextDate },
        `체험 담당: ${d.assignee || "미배정"} / ${d.note} / 다음 연락: ${d.nextDate || "미정"}`,
      )
    ) {
      closeModal();
      toast("운영 기록을 저장했어요.");
    }
  };
}

/* setListingState — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function setListingState(id, state) {
  const next = { ...listingStates, [id]: state };
  if (save("listingStates", next)) {
    listingStates = next;
    toast("모집 상태를 변경했어요. 지도와 추천에 반영됩니다.");
  }
}

/* resolveReport — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function resolveReport(id) {
  modal(
    `<h2>신고 처리 기록</h2><form id="resolve-report"><select name="action" aria-label="처리 조치"><option>기록 후 종결</option><option>게시물 숨김</option></select><textarea name="reason" required aria-label="처리 사유" maxlength="500" placeholder="조치 사유를 기록해주세요." style="margin-top:15px"></textarea><div class="modal-actions"><button class="btn">처리 저장</button></div></form>`,
  );
  $("#resolve-report").onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)),
      r = reports.find((r) => r.id === id);
    if (d.action === "게시물 숨김" && !mutatePost(r.postId, (p) => (p.hidden = true))) return;
    const next = reports.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "종결",
            resolution: `${d.action} / ${d.reason} / 체험 운영자 / ${new Date().toLocaleString("ko-KR")}`,
          }
        : x,
    );
    if (save("reports", next)) {
      reports = next;
      closeModal();
      render(false);
      toast("처리 결과를 저장했어요.");
    }
  };
}

/* housingSource — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function housingSource(id) {
  return applications.find(
    (a) =>
      a.id === id &&
      ["housing", "waiting"].includes(a.kind) &&
      !["취소", "삭제"].includes(a.status),
  );
}

/* consultationHref — 선택한 대상의 이동 경로나 열기 동작을 처리합니다. */
function consultationHref(listingId, parentId) {
  return "#/consultation/" + listingId + (parentId ? "/" + parentId : "");
}

/* activeConsultation — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function activeConsultation(listingId, parentId) {
  return applications.find(
    (a) =>
      a.kind === "consultation" &&
      a.listingId === listingId &&
      !["취소", "종료"].includes(a.status),
  );
}

/* consultationDefaults — 신청서에서 이미 입력한 항목과 선택한 공간을 바탕으로 상담 입력값의 기본값을 준비합니다. */
function consultationDefaults(parentId) {
  const d = housingSource(parentId)?.data || {};
  return Object.fromEntries(
    ["name", "phone", "email", "reply", "date", "duration", "must", "preferences"].map((k) => [
      k,
      d[k] || "",
    ]),
  );
}

/* consultationPage — 선택한 공간의 상세 정보와 공간 상담 신청 양식을 함께 표시합니다. */
function consultationPage(id, parentId) {
  const h = homes.find((h) => h.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!h) return notFound();
  const source = housingSource(parentId),
    available = activeHomes().some((h) => h.id === id);
  const blocked = parentId && !source,
    existing = activeConsultation(id, parentId);
  const d = {
    ...consultationDefaults(parentId),
    ...read("consult-draft-" + id + "-" + (parentId || "direct"), {}),
  };
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container"><div class="page-head"><div><div class="section-kicker">LET'S TALK ABOUT THIS HOME</div><h1>이 공간에서의 시작을 이야기해요.</h1><p>${source ? "제출한 신청 내용을 불러왔어요. 확인하고 상담할 내용을 추가해주세요." : "관심 있는 공간을 확인하고, 궁금한 점이나 방문 희망을 알려주세요."}</p></div><a class="textlink" href="#/home/${id}${source ? "/" + source.id : ""}">← 공간 상세로 돌아가기</a></div>${spaceDetailContent(h)}<section class="consultation-form-wrap" id="consultation-section"><div class="section-head"><div><div class="section-kicker">SPACE CONSULTATION</div><h2>이 공간 상담 신청</h2><p>상세 조건 문의부터 방문 요청까지, 필요한 도움을 알려주세요.</p></div></div><div class="notice warning">체험 사이트입니다. 상담 내용은 이 브라우저에 저장되며 실제 운영자에게 전송되지 않습니다.</div>${blocked ? `<div class="empty"><h3>이전 신청을 불러올 수 없어요.</h3><p>신청이 취소되었거나 현재 브라우저에 저장되어 있지 않습니다.</p><a class="btn secondary" href="#/applications">내 활동 확인</a></div>` : !available ? `<div class="empty"><h3>현재 상담을 신청할 수 없는 공간이에요.</h3><p>${esc(listingStates[id] || "모집 상태 확인 필요")}</p><a class="btn" href="#/homes">다른 공간 둘러보기</a></div>` : existing ? `<div class="empty"><h3>이미 상담을 신청한 공간이에요.</h3><p class="subtle">중복 신청 대신 기존 상담 내용을 확인해주세요.</p><a class="btn" href="#/consultation-detail/${existing.id}">신청 내용 보기</a><a class="btn secondary" href="#/applications">내 활동</a></div>` : `${source ? `<details class="formbox"><summary>방 알림 등록 조건 확인 · ${esc(source.id)}</summary><div style="margin-top:20px">${conditionSummary(source.data)}</div><p class="micro">이름·연락처·답변 수단·입주일·거주 기간·필수 및 선호 조건을 불러왔습니다. 아래에서 바꿔도 방 알림 등록의 원본 조건은 유지됩니다.</p></details>` : ""}<form id="consultation-form"><section class="formbox"><h2><span>01</span>어떤 상담이 필요한가요?</h2><div class="fields">${field("상담 목적 *", `<select name="purpose" id="consult-purpose" required><option value="">선택해주세요</option>${options(["상세 조건 문의", "방문 요청", "입주 조건 협의"], d.purpose)}</select>`, true)}${field("궁금한 점·협의할 내용 *", `<textarea name="message" aria-label="상담 내용" required maxlength="2000" placeholder="예: 관리비 포함 항목이 궁금해요. / 주말에 공간을 방문하고 싶어요.">${esc(d.message)}</textarea>`, true)}</div><div class="fields" id="visit-fields" ${d.purpose === "방문 요청" ? "" : "hidden"} style="margin-top:20px">${field("방문 희망일 *", `<input name="visitDate" type="date" aria-label="방문 희망일" min="${new Date().toLocaleDateString("sv-SE")}" value="${esc(d.visitDate)}">`)}${field("방문 가능 시간대 *", `<select name="visitTime" aria-label="방문 가능 시간대"><option value="">선택해주세요</option>${options(["오전 (09~12시)", "오후 (12~18시)", "저녁 (18~20시)", "시간 협의"], d.visitTime)}</select>`)}</div><p class="micro">방문 요청은 예약 확정이 아닙니다. 담당자와 제공자의 일정 협의가 필요해요.</p></section><section class="formbox"><h2><span>02</span>입주와 생활 조건</h2><div class="fields">${field("희망 입주일 (선택)", txt("date", d.date, 'type="date"'))}${field("예상 거주 기간", `<select name="duration">${options(["협의·미정", "1개월", "3개월", "6개월", "12개월"], d.duration)}</select>`)}${field("반드시 필요한 조건 (선택)", `<textarea name="must" aria-label="반드시 필요한 조건" maxlength="500">${esc(d.must)}</textarea>`, true)}${field("조정 가능한 선호 (선택)", `<textarea name="preferences" aria-label="조정 가능한 선호" maxlength="500">${esc(d.preferences)}</textarea>`, true)}</div></section><section class="formbox"><h2><span>03</span>연락 정보와 동의</h2><div class="fields">${field("이름 또는 별칭 *", txt("name", d.name, 'required maxlength="40" autocomplete="nickname"'))}${field("휴대전화 (체험용) *", txt("phone", d.phone, 'required type="tel" pattern="0[0-9-]{8,14}" placeholder="010-0000-0000"'))}${field("답변받을 수단 *", `<select name="reply" id="consult-reply" required>${options(["전화", "문자", "이메일"], d.reply || "전화")}</select>`)}${field("이메일 (이메일 답변 선택 시 필수)", txt("email", d.email, 'type="email" id="consult-email" placeholder="name@example.com"'))}</div><label class="check"><input name="consent" type="checkbox" required>[필수] 상담 내용과 연락 정보가 이 브라우저에 저장되는 것에 동의해요.</label></section><div class="form-submit"><a href="#/home/${id}${source ? "/" + source.id : ""}" class="textlink">← 공간 정보로</a><button class="btn" type="submit">상담 요청 제출하기 ↗</button></div></form>`}</section></div>`;
}

/* consultationEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function consultationEvents(id, parentId) {
  const form = $("#consultation-form");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!form) return;
  const sync = () => {
    const visit = form.elements.purpose.value === "방문 요청";
    $("#visit-fields").hidden = !visit;
    form.elements.visitDate.required = visit;
    form.elements.visitTime.required = visit;
    form.elements.visitDate.disabled = !visit;
    form.elements.visitTime.disabled = !visit;
    form.elements.email.required = form.elements.reply.value === "이메일";
  };
  form.addEventListener("input", () => {
    sync();
    save(
      "consult-draft-" + id + "-" + (parentId || "direct"),
      Object.fromEntries(new FormData(form)),
    );
  });
  form.addEventListener("change", sync);
  sync();
  form.onsubmit = (e) => {
    e.preventDefault();
    sync();
    if (!form.reportValidity()) return;
    const button = form.querySelector("[type=submit]");
    if (button.disabled) return;
    button.disabled = true;
    const data = Object.fromEntries(new FormData(form));
    const submitted = submitSpaceConsultation(id, parentId, data);
    if (!submitted) {
      button.disabled = false;
      return;
    }
    const a = submitted;
    save("consult-draft-" + id + "-" + (parentId || "direct"), {});
    modal(
      `<div class="result-title"><div class="success">✓</div><h2>공간 상담 제출이 완료되었어요.</h2><p>${esc(a.snapshot.name)} · ${esc(a.data.purpose)}</p><p class="subtle">상담번호 ${esc(a.id)}</p></div><div class="notice">내 활동에서 선택한 공간과 작성한 상담 내용을 확인할 수 있어요.</div><p class="micro">현재 브라우저에 저장한 체험 신청입니다. 실제 운영자에게 전송되지 않았습니다. 방문 일정은 확정되지 않았어요.</p><div class="modal-actions"><button class="btn" id="consultation-success">내 활동 확인하기 →</button></div>`,
    );
    const finish = () => {
      const dialog = $("#dialog");
      dialog.removeEventListener("close", finish);
      location.hash = "/activity/consultations";
    };
    $("#dialog").addEventListener("close", finish);
    $("#consultation-success").onclick = () => closeModal();
  };
}

/* submitSpaceConsultation — 상담 입력값을 확인하고 신청 내역을 저장한 뒤 완료 흐름으로 이동합니다. */
function submitSpaceConsultation(id, parentId, data) {
  const h = activeHomes().find((h) => h.id === id),
    source = housingSource(parentId);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!h) {
    toast("모집 상태가 변경되어 상담을 신청할 수 없습니다.");
    return null;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (parentId && !source) {
    toast("기존 신청을 불러올 수 없어요. 내 활동을 확인해주세요.");
    return null;
  }
  const duplicate = activeConsultation(id, parentId);
  if (duplicate) {
    toast("이미 접수한 상담이 있어요. 내 활동에서 확인해주세요.");
    return null;
  }
  if (
    !["상세 조건 문의", "방문 요청", "입주 조건 협의"].includes(data.purpose) ||
    !data.message?.trim() ||
    !data.name?.trim() ||
    !/^0[0-9-]{8,14}$/.test(data.phone || "") ||
    !data.consent
  ) {
    toast("상담 목적, 내용, 연락 정보와 필수 동의를 확인해주세요.");
    return null;
  }
  if (data.reply === "이메일" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) {
    toast("답변받을 이메일 주소를 입력해주세요.");
    return null;
  }
  if (
    data.purpose === "방문 요청" &&
    (!data.visitDate || data.visitDate < new Date().toLocaleDateString("sv-SE") || !data.visitTime)
  ) {
    toast("방문 희망일과 시간대를 확인해주세요.");
    return null;
  }
  const clean = { ...data, region: h.region, type: h.type };
  if (data.purpose !== "방문 요청") {
    delete clean.visitDate;
    delete clean.visitTime;
  }
  const a = {
    id: "C-" + newId().slice(0, 8),
    kind: "consultation",
    listingId: id,
    parentId: source?.id || null,
    snapshot: structuredClone(h),
    sourceConditions: source ? structuredClone(source.data) : null,
    data: clean,
    status: "상담 요청",
    created: new Date().toISOString(),
    history: [{ time: new Date().toISOString(), text: "선택 공간 상담 저장: " + data.purpose }],
  };
  const next = [
    a,
    ...applications.map((x) =>
      x.id === source?.id
        ? {
            ...x,
            status: x.kind === "waiting" ? x.status : "상담 요청",
            history: [
              ...(x.history || []),
              { time: a.created, text: `공간 ${h.name} 상담 연결 · ${a.id}` },
            ],
          }
        : x,
    ),
  ];
  if (!save("applications", next)) return null;
  applications = next;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return a;
}

/* consultationDetailPage — 저장된 공간 상담 신청의 공간 정보와 작성 내용을 표시합니다. */
function consultationDetailPage(id) {
  const a = applications.find((a) => a.id === id && a.kind === "consultation");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a) return notFound();
  const h = a.snapshot || homes.find((h) => h.id === a.listingId);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!h) return notFound();
  const d = a.data;
  const rows = [
    ["상담 목적", d.purpose],
    ["상담 내용", d.message],
    ["희망 입주일", d.date || "협의·미정"],
    ["예상 거주 기간", d.duration || "협의·미정"],
    ["반드시 필요한 조건", d.must || "없음"],
    ["조정 가능한 선호", d.preferences || "없음"],
    ["이름 또는 별칭", d.name],
    ["휴대전화", d.phone],
    ["답변 수단", d.reply],
    ["이메일", d.email || "입력하지 않음"],
    ...(d.purpose === "방문 요청"
      ? [
          ["방문 희망일", d.visitDate],
          ["방문 가능 시간대", d.visitTime],
        ]
      : []),
    ["저장 동의", d.consent ? "동의함" : "미동의"],
  ];
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container"><div class="page-head"><div><div class="section-kicker">MY SPACE CONSULTATION</div><h1>신청한 공간 상담 내용</h1><p>${esc(a.id)} · ${new Date(a.created).toLocaleString("ko-KR")}</p></div><a class="btn secondary" href="#/applications">← 내 활동</a></div><div class="notice">${esc(a.status)} · 아래 공간 정보는 상담 제출 시점의 기록입니다.</div>${spaceDetailContent(h)}<section class="consultation-form-wrap"><div class="formbox"><div class="section-head"><h2>내가 작성한 상담 내용</h2><span class="badge">${esc(a.status)}</span></div><dl class="consultation-answer-list">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl><p class="micro">이 브라우저에 저장된 체험 신청이며 실제 운영자에게 전송되지 않았습니다. 방문 요청은 일정 확정이 아닙니다.</p></div>${a.sourceConditions ? `<details class="formbox"><summary>연결된 방 알림 조건</summary><p class="subtle">${esc(a.parentId)}</p>${conditionSummary(a.sourceConditions)}<a class="textlink" href="#/result/${a.parentId}">내 방 알림 보기 →</a></details>` : ""}<div class="actions" style="margin-bottom:50px"><a class="btn" href="#/applications">내 활동</a><button class="btn secondary" ${uiActionAttrs("click", "showHistory_23", [a.id])}>진행 기록</button>${a.status !== "취소" ? `<button class="textlink danger" ${uiActionAttrs("click", "cancelRequest_22", [a.id])}>상담 취소</button>` : ""}</div></section></div>`;
}

/* applicationCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function applicationCard(a) {
  const consultation = a.kind === "consultation",
    housing = a.kind === "housing",
    h = a.snapshot || homes.find((h) => h.id === a.listingId);
  const label = consultation ? "공간 상담" : housing ? "집 구하기" : "공간 제공";
  const title = consultation
    ? h?.name || "선택한 공간"
    : housing
      ? `${a.data.region || "옥천"}에서 찾는 첫 거처`
      : `${a.data.region} · ${a.data.type}`;
  const href = consultation
    ? "#/consultation-detail/" + a.id
    : housing
      ? "#/result/" + a.id
      : "#/complete/" + a.id;
  const related = housing
    ? applications.filter((x) => x.kind === "consultation" && x.parentId === a.id)
    : [];
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<article class="application"><div class="application-top"><div><span class="subtle">${label} · ${new Date(a.created).toLocaleDateString("ko-KR")}</span><h3>${esc(title)}</h3></div><span class="badge ${a.status === "취소" ? "orange" : ""}">${esc(a.status)}</span></div><p class="subtle">${esc(a.id)}<br>${esc(a.data.name)} · ${esc(a.data.phone?.replace(/(\d{3})[ -]?(\d{3,4})[ -]?(\d{4})/, "$1-****-$3"))}</p>${consultation ? `<div class="notice">${esc(a.data.purpose)}${a.data.purpose === "방문 요청" ? " · " + esc(a.data.visitDate) + " · " + esc(a.data.visitTime) : ""}<br>${a.parentId ? "기존 추천 신청에서 이어온 상담" : "지도·공간 상세에서 신청한 상담"}</div>` : housing ? conditionSummary(a.data) : `<p class="subtle">제공 권한: ${esc(a.data.authority)} · 가능 시기: ${esc(a.data.date || "협의")}</p>`}${related.length ? `<div class="notice">연결된 공간 상담 ${related.length}건<br>${related.map((x) => `<a class="textlink" href="#/consultation-detail/${x.id}">${esc(x.snapshot.name)} · ${esc(x.status)} →</a>`).join("<br>")}</div>` : ""}<div class="actions"><a class="btn secondary small" href="${href}">신청 내용 보기</a>${a.status !== "취소" ? `${housing ? `<button class="textlink" ${uiActionAttrs("click", "editRequest_13", [a.id])}>조건 수정</button>` : ""}<button class="textlink danger" ${uiActionAttrs("click", "cancelRequest_22", [a.id])}>신청 취소</button>` : ""}<button class="textlink" style="margin-left:auto" ${uiActionAttrs("click", "showHistory_23", [a.id])}>진행 기록</button></div></article>`;
}

/* notFound — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function notFound() {
  return `<div class="container" style="padding-top:60px;padding-bottom:60px"><div class="empty"><h1 style="font-size:30px">이 페이지를 찾을 수 없어요.</h1><p>신청은 저장한 브라우저에서만 조회할 수 있어요.</p><a class="btn" href="#/">옥키 홈으로</a></div></div>`;
}

/* render — 현재 주소와 상태에 맞는 화면을 선택해 그린 뒤 해당 화면의 이벤트를 연결합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
window.addEventListener("hashchange", () => render());
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
window.addEventListener("popstate", () => render());
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
$("#dialog").addEventListener("click", (e) => {
  if (e.target === $("#dialog")) {
    const r = $("#dialog").getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeModal();
  }
});
