/*
 * 파일: integrated.js
 * 역할: 통합 와이어프레임의 생활·커뮤니티 기능을 구현합니다. 지역 범위, 질문의 복수 답변과 채택, 후기, 장소, 저장 목록, 알림 및 관리 화면을 다룹니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";
// Integrated PC wireframe, 2026-10-25. Same local-only demo persistence contract.

/* villageCatalog — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const villageCatalog = {
  "옥천읍": [
    "죽향리",
    "문정리",
    "상계리",
    "하계리",
    "교동리",
    "동안리",
    "수북리",
    "매화리",
    "구일리",
    "서대리",
    "가풍리",
    "삼청리",
    "대천리",
    "마암리",
    "양수리",
    "금구리",
    "장야리",
    "삼양리",
    "서정리",
    "옥각리",
    "오대리",
  ],
};

/* neighborhood, questions, experiences, savedItems, inbox, notificationPrefs, cases, blockedAuthors, c */
let neighborhood = read("neighborhood", { region: "", village: "" }),
  questions = mergeExamples(read("questions", []), exampleQuestions).map(refreshExampleQuestion),
  experiences = mergeReviewExamples(read("experiences", [])),
  savedItems = read("saved-items", []),
  inbox = mergeExamples(read("inbox", []), [exampleYouthHousingNotice, exampleRoomNotice]),
  notificationPrefs = read("notification-prefs", {
    rooms: "알림함만",
    consults: "알림함만",
    answers: "알림함만",
    quietStart: "22:00",
    quietEnd: "08:00",
    digest: "받지 않음",
  }),
  cases = read("cases", []),
  blockedAuthors = read("blocked-authors", []),
  checks = read("identity-checks", []);

/* questionQuery, reviewTopic, reviewSort, placeCategory, placeQuery, selectedPlace, taskGroup — 이 구간에서 */
let questionQuery = "",
  reviewTopic = "전체",
  reviewSort = "최근 경험",
  placeCategory = "전체",
  placeQuery = "",
  selectedPlace = "recycle",
  taskGroup = "전체";

/* scopeKey — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const scopeKey = (s) => [s?.region || "", s?.village || ""].join("/");

/* scopeLabel — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const scopeLabel = (s) =>
  "옥천군" + (s?.region ? " > " + s.region : " 전체") + (s?.village ? " > " + s.village : "");

/* scopeMatch — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const scopeMatch = (a, b = neighborhood) => scopeKey(a) === scopeKey(b);

/* nid — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const nid = (p) => p + "-" + newId().slice(0, 8);

/* textArea — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const textArea = (label, name, value = "", required = false) =>
  field(
    label,
    `<textarea name="${name}" aria-label="${label}" maxlength="2000" ${required ? "required" : ""}>${esc(value)}</textarea>`,
    true,
  );

/* checkField — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const checkField = (name, label, checked = false, required = false) =>
  `<label class="check"><input name="${name}" type="checkbox" ${checked ? "checked" : ""} ${required ? "required" : ""}>${label}</label>`;

/* emptyState — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const emptyState = (title, body = "") => `<div class="empty"><h3>${title}</h3><p>${body}</p></div>`;

/* publicGuard — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const publicGuard = (text) =>
  /(?:01[016789][ -]?\d{3,4}[ -]?\d{4}|\d{1,4}동\s*\d{1,4}호|\d{2,4}호실)/.test(text);

/* scopeFields — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function scopeFields(s = neighborhood) {
  return `<div class="fields scope-input">${field("읍·면", `<select name="scopeRegion" aria-label="게시 읍·면" ${uiActionAttrs("change", "syncVillage_61", [])}><option value="">옥천 전체</option>${options(regions, s.region)}</select>`)}${field("리·마을", `<select name="scopeVillage" aria-label="게시 리·마을"><option value="">${s.region ? "해당 읍·면 전체" : "읍·면을 먼저 선택"}</option>${options(villageCatalog[s.region] || [], s.village)}</select>`)}</div>`;
}

/* syncVillage — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function syncVillage(el) {
  const f = el.closest(".scope-input"),
    v = f.querySelector("[name=scopeVillage]");
  // 보안: 선택지 이름도 HTML 문자열로 조립하지 않고 텍스트로 표시합니다.
  const choices = ['', ...(villageCatalog[el.value] || [])].map(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value || '해당 읍·면 전체';
    return option;
  });
  v.replaceChildren(...choices);
}

/* getScope — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function getScope(f) {
  return {
    region: f.elements.scopeRegion?.value || "",
    village: f.elements.scopeVillage?.value || "",
  };
}

/* scopeBar — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function scopeBar() {
  return `<section class="scope-bar"><div class="section-kicker">OUR NEIGHBORHOOD</div><h2>현재 커뮤니티 · ${esc(scopeLabel(neighborhood))}</h2><form id="scope-form">${scopeFields()}<button class="btn small">이 동네 보기</button><button class="textlink" type="button" ${uiActionAttrs("click", "changeScope_62", [])}>옥천 전체</button></form><p class="micro">선택한 범위에 게시된 글만 보여요. 읍·면과 리·마을 게시판은 구분합니다. 세부 목록은 확인된 옥천읍 리부터 제공합니다. <a href="https://oc.go.kr/www/contents.do?key=658" target="_blank" rel="noopener">지역명 출처</a></p>${neighborhood.region ? '<p class="micro">다른 동네의 글은 옥천 전체 게시판에서 찾아볼 수 있어요. 위의 “옥천 전체”를 선택하면 볼 수 있습니다.</p>' : ""}</section>`;
}

/* changeScope — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function changeScope(s) {
  neighborhood = s;
  save("neighborhood", s);
  render();
}

/* scopeEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function scopeEvents() {
  const f = $("#scope-form");
  if (f)
    f.onsubmit = (e) => {
      e.preventDefault();
      changeScope(getScope(f));
    };
}

/* localTabs — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function localTabs() {
  const current = location.hash.replace(/^#\/?/, "").split("/").slice(0, 2).join("/");
  return `<nav class="tabs community-tabs" aria-label="커뮤니티 분류">${[
    ["community/info", "동네 정보"],
    ["questions", "동네 질문·답변"],
    ["reviews", "살아본 후기"],
    ["community/daily", "일상"],
    ["community/welcome", "새로 왔어요"],
    ["community/policy", "지원 정책"],
  ]
    .map(
      ([r, t]) =>
        `<a class="tab ${current === r ? "active" : ""}" ${current === r ? 'aria-current="page"' : ""} href="#/${r}">${t}</a>`,
    )
    .join("")}</nav>`;
}

/* broaden — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function broaden() {
  const s = neighborhood.village
    ? { region: neighborhood.region, village: "" }
    : { region: "", village: "" };
  changeScope(s);
}

/* areaEmpty — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function areaEmpty() {
  return (
    emptyState("이 범위에 아직 글이 없어요.", "다른 동네의 글을 자동으로 섞어 보여주지 않아요.") +
    `<button class="btn secondary" ${uiActionAttrs("click", "broaden_63", [])}>${neighborhood.village ? esc(neighborhood.region) : "옥천 전체"}로 범위 넓히기</button>`
  );
}

/* persistCollection — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function persistCollection(key, next, assign) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!save(key, next))
    return false;
  assign(next);
  return true;
}

/* pushNotice — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function pushNotice(category, title, href, key) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    key &&
    inbox.some((n) => n.key === key)
  )
    return;
  const n = { id: nid("N"), category, title, href, key, created: stamp(), read: false };
  persistCollection("inbox", [n, ...inbox], (v) => (inbox = v));
}

/* isSaved — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function isSaved(kind, id) {
  if (kind === "task") return !!todoState[id]?.selected;
  return savedItems.some((x) => x.kind === kind && x.id === id);
}

/* toggleSaved — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function toggleSaved(kind, id, title, href) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (kind === "task") {
    const next = { ...todoState, [id]: { ...todoState[id], selected: !isSaved(kind, id) } };
    if (save("todos", next)) {
      todoState = next;
      render(false);
    }
    return;
  }
  const next = isSaved(kind, id)
    ? savedItems.filter((x) => !(x.kind === kind && x.id === id))
    : [{ kind, id, title, href, created: stamp(), notify: false }, ...savedItems];
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    persistCollection("saved-items", next, (v) => (savedItems = v))
  ) {
    toast(isSaved(kind, id) ? "저장했어요. 알림은 별도로 선택해요." : "저장을 해제했어요.");
    render(false);
  }
}

/* saveButton — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function saveButton(kind, id, title, href) {
  return `<button class="textlink" ${uiActionAttrs('click', 'toggleSaved', [kind, id, title, href])}>${isSaved(kind, id) ? "✓ 저장됨" : "저장"}</button>`;
}

/* photoField — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function photoField() {
  return field(
    "사진 (선택)",
    `<input type="file" name="photoUpload" accept="image/jpeg,image/png,image/webp" multiple><div class="upload-preview"></div>`,
    true,
  );
}

/* wirePhotos — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function wirePhotos(f) {
  f._photos = window.intakeEnabled && ["registration-broker","registration-resident","vacancy-form"].includes(f.id) ? [] : read(draftKey(f), {})._photos || [];
  const draw = () => {
    const p = f.querySelector(".upload-preview");
    if (p)
      setHTML(p, f._photos
        .map(
          (s, i) =>
            `<div><img src="${esc(s)}" alt="첨부 사진 ${i + 1}"><button type="button" data-delphoto="${i}">삭제</button></div>`,
        )
        .join(""));
    f.querySelectorAll("[data-delphoto]").forEach(
      (b) =>
        (b.onclick = () => {
          f._photos.splice(+b.dataset.delphoto, 1);
          draw();
        }),
    );
  };
  f._drawPhotos = draw;
  draw();
  const input = f.elements.photoUpload;
  if (input)
    input.onchange = async () => {
      f._loading = true;
      try {
        if (f._photos.length + input.files.length > 5) throw Error("사진은 최대 5장입니다.");
        f._photos.push(...(await prepareImages([...input.files])));
        draw();
      } catch (e) {
        toast(e.message);
      } finally {
        f._loading = false;
        input.value = "";
      }
    };
}

/* getData — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function getData(f) {
  const d = Object.fromEntries(new FormData(f));
  f.querySelectorAll("input[type=checkbox]").forEach((i) => {
    if (f.querySelectorAll(`[name="${i.name}"]`).length === 1) d[i.name] = i.checked;
  });
  delete d.photoUpload;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return d;
}

/* formShell — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function formShell(title, sub, id, html, submit = "저장하기") {
  return `<div class="container">${pageHead("YOUR NEXT CHAPTER", title, sub)}${demoNotice()}<div class="activity-content"><form id="${id}">${html}${formError()}<div class="form-submit"><span class="micro">입력한 내용을 확인해주세요.</span><button class="btn" type="submit">${submit}</button></div></form></div></div>`;
}

/* originalNavIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const originalNavIntegrated = nav;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
nav = function (route) {
  originalNavIntegrated(route);
  setHTML($("#header"), `<nav class="nav" aria-label="주 메뉴">${brand()}${[
    ["wait", "방 알림 받기"],
    ["provide", "방 등록하기"],
    ["life", "내 생활"],
    ["community/daily", "커뮤니티"],
    ["notifications", "알림"],
    ["login", "로그인"],
  ]
    .map(
      ([p, t]) =>
        `<a class="navlink ${route === p.split("/")[0] ? "active" : ""}" href="#/${p}">${t}${p === "notifications" && inbox.some((n) => !n.read) ? '<span class="unread-dot"></span>' : ""}</a>`,
    )
    .join(
      "",
    )}<a class="btn secondary small" href="#/activity">내 활동 ↗</a><button class="mobile-toggle" aria-label="메뉴 열기" aria-expanded="false" ${uiActionAttrs("click", "toggleMenu_24", [])}>☰</button></nav><nav class="mobile-nav">${[
    ["wait", "방 알림 받기"],
    ["provide", "방 등록하기"],
    ["life", "내 생활"],
    ["community/daily", "커뮤니티"],
    ["notifications", "알림"],
    ["login", "로그인"],
  ]
    .map(([p, t]) => `<a href="#/${p}">${t}</a>`)
    .join("")}</nav>`);
  // 보안: 문구 변경을 위해 기존 HTML 전체를 다시 파싱하지 않습니다.
  $$('#footer a').filter(link => link.textContent === '생활권 지도')
    .forEach(link => { link.textContent = '우리 동네 지도'; });
};

/* previousHomeIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* previousCommunityIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousCommunityIntegrated = communityPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
communityPage = function () {
  if (communityTab !== "동네 정보")
    return previousCommunityIntegrated().replace(
      /<div class="tabs community-tabs"[\s\S]*?<\/div>/,
      localTabs(),
    );
  const list = allPosts().filter(
    (p) => p.category === "동네 정보" && scopeMatch(p.scope) && !blockedAuthors.includes(p.author),
  );
  return `<div class="container">${pageHead("MY NEIGHBORHOOD", "내가 선택한 동네의 이야기를 나눠요.", "옥천 전체부터 우리 읍·면, 작은 동네까지. 읽고 쓰는 범위를 직접 선택합니다.")}${scopeBar()}${localTabs()}<div class="section-head"><h2>${esc(scopeLabel(neighborhood))}의 동네 정보</h2><a class="btn small" href="#/write">이 동네에 글쓰기</a></div><div class="feed">${list.length ? list.map(postCard).join("") : areaEmpty()}</div><div class="banner"><div><h2>동네 질문도 같은 범위에서 이어져요.</h2><p>거주·근무·입주 예정인 이웃과 정보를 나누세요.</p></div><a class="btn light" href="#/questions">이 동네 질문·답변 →</a></div></div>`;
};

/* previousPostIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousPostIntegrated = postCard;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
postCard = function (p) {
  if (blockedAuthors.includes(p.author)) return "";
  return previousPostIntegrated(p).replace(
    '<div class="post-body">',
    `<div class="post-body"><p class="micro">${esc(scopeLabel(p.scope))} · ${esc(p.relation || "이웃")} (직접 입력)</p>`,
  );
};

/* questionList — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function questionList() {
  const list = questions.filter(
    (q) =>
      scopeMatch(q.scope) &&
      !q.hidden &&
      !blockedAuthors.includes(q.author) &&
      (!questionQuery || (q.title + " " + q.body).includes(questionQuery)),
  );
  return `<div class="container">${pageHead("NEIGHBORHOOD Q&A", "우리 동네의 궁금한 점을 이웃에게 물어봐요.", "선택한 동네가 질문과 글 작성에도 이어집니다.")}${scopeBar()}${localTabs()}<div class="section-head"><input aria-label="동네 질문 검색" value="${esc(questionQuery)}" placeholder="분리수거 / 버스 / 생활시설" ${uiActionAttrs("change", "render_64", [])}><a class="btn" href="#/ask">이 동네에 질문하기</a></div><div class="activity-content">${list.length ? list.map((q) => `<article class="application"><span class="badge ${acceptedAnswer(q) ? "accepted-badge" : ""}">${esc(questionStatus(q))}</span><p class="micro">${esc(scopeLabel(q.scope))} · 답변 ${visibleAnswers(q).length}개</p><h3>${esc(q.title)}</h3><p>${esc(q.body.slice(0, 120))}</p><a class="textlink" href="#/question/${q.id}">질문과 답변 보기 →</a></article>`).join("") : areaEmpty()}</div></div>`;
}

/* askPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function askPage() {
  return formShell(
    "우리 동네 이웃에게 질문해요.",
    "사진 없이도 질문할 수 있어요. 상세 주소와 연락처는 글에 적지 마세요.",
    "question-form",
    box(
      "01",
      "어느 동네에 물어볼까요?",
      scopeFields() +
        selectField("이 동네와 나의 관계 *", "relation", ["거주", "근무", "입주 예정"], "", true),
    ) +
      box(
        "02",
        "질문과 나의 상황",
        inputField("질문 제목 *", "title", "", 'required maxlength="100"') +
          '<div id="similar-questions"></div>' +
          textArea("궁금한 내용 *", "body", "", true) +
          photoField(),
      ) +
      box(
        "03",
        "표시 이름과 알림",
        inputField("표시 이름 *", "author", "", 'required maxlength="30"') +
          checkField("anonymous", "글 안에서 익명으로 표시") +
          checkField("notify", "이 질문의 새 답변 알림 받기") +
          checkField("publicCheck", "다른 사람의 개인정보가 없는지 확인했어요.", false, true),
      ),
    "이 동네에 질문 올리기",
  );
}

/* askEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function askEvents() {
  const f = $("#question-form");
  wirePhotos(f);
  f.elements.title.oninput = () => {
    const words = f.elements.title.value
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1);
    setHTML($("#similar-questions"), questions
      .filter(
        (q) =>
          !q.hidden && scopeMatch(q.scope, getScope(f)) && words.some((w) => q.title.includes(w)),
      )
      .slice(0, 3)
      .map(
        (q) =>
          `<div class="notice">비슷한 질문: <a href="#/question/${q.id}">${esc(q.title)} →</a></div>`,
      )
      .join(""));
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = getData(f);
    if (!f.reportValidity()) return;
    if (f._loading) return errorForm(f, "사진을 준비하고 있어요.");
    if (publicGuard(d.title + " " + d.body))
      return errorForm(f, "연락처 또는 동·호수로 보이는 내용이 있어요. 가린 뒤 다시 게시해주세요.");
    const q = {
      id: nid("Q"),
      title: d.title.trim(),
      body: d.body.trim(),
      author: d.anonymous ? "익명" : d.author,
      relation: d.relation,
      scope: getScope(f),
      notify: d.notify,
      photos: f._photos,
      answers: [],
      acceptedAnswerId: null,
      acceptedAt: null,
      status: "답변 기다리는 중",
      owned: true,
      created: stamp(),
      returnTo: read("community-return", null),
    };
    if (!q.title || !q.body) return errorForm(f, "공백이 아닌 질문을 적어주세요.");
    if (persistCollection("questions", [q, ...questions], (v) => (questions = v))) {
      save("form-draft-question-form", {});
      location.hash = "/question/" + q.id;
    }
  };
}

/* acceptedAnswer — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function acceptedAnswer(q) {
  return q.answers.find((a) => a.id === q.acceptedAnswerId) || null;
}

/* questionStatus — 현재 데이터나 입력 조건을 확인해 이후 화면과 처리에 사용할 결과를 반환합니다. */
function questionStatus(q) {
  return acceptedAnswer(q)
    ? "채택 완료"
    : q.status === "채택 완료"
      ? q.answers.length
        ? "답변 확인 중"
        : "답변 기다리는 중"
      : q.status;
}

/* visibleAnswers — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
function visibleAnswers(q) {
  return q.answers
    .filter((a) => !a.hidden && !blockedAuthors.includes(a.author))
    .sort((a, b) => Number(b.id === q.acceptedAnswerId) - Number(a.id === q.acceptedAnswerId));
}

/* answerCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function answerCard(q, a) {
  const adopted = a.id === q.acceptedAnswerId;
  return `<article class="formbox answer-card ${adopted ? "accepted-answer" : ""}" id="answer-${a.id}"><div class="answer-card-heading"><span class="badge">${esc(a.basis)} · 확인 전</span>${adopted ? '<span class="badge accepted-badge">✓ 질문자 채택</span>' : ""}</div><p class="micro">${esc(a.author)} · ${esc(a.period || "시기 미입력")} · 이해관계: ${esc(a.interest)} · ${esc(a.relation || "이웃")} (직접 입력)</p><p class="user-copy">${esc(a.body)}</p>${a.replies?.length ? `<section class="answer-thread" aria-label="이어지는 질문과 답변">${a.replies.map((r) => `<div class="notice"><p><b>${esc(r.author)}</b> · ${esc(r.role)}</p><p class="user-copy">${esc(r.body)}</p></div>`).join("")}</section>` : ""}${a.source ? `<a class="textlink" href="${esc(a.source)}" target="_blank" rel="noopener">작성자가 제시한 원문 ↗</a>` : ""}${adopted ? `<p class="micro">질문자가 가장 도움이 된 답변으로 선택했어요.${q.acceptedAt ? " · " + labelDate(q.acceptedAt) : ""}</p>` : ""}<div class="actions">${q.owned ? `<button class="${adopted ? "textlink" : "btn secondary small"}" ${uiActionAttrs("click", "acceptAnswer_65", [q.id, adopted ? "" : a.id])}>${adopted ? "채택 취소" : q.acceptedAnswerId ? "이 답변으로 채택 변경" : "이 답변 채택"}</button>` : ""}<button class="textlink" ${uiActionAttrs("click", "helpfulAnswer_66", [q.id, a.id])}>${a.helpful ? "✓ 도움됐어요" : "도움됐어요"}</button><a class="textlink" href="#/report/answer/${a.id}">신고·차단</a></div></article>`;
}

/* questionDetail — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function questionDetail(id) {
  const q = questions.find((q) => q.id === id && !q.hidden);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!q)
    return unavailable();
  const answers = visibleAnswers(q),
    chosen = acceptedAnswer(q);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("NEIGHBORHOOD Q&A", esc(q.title), "게시 동네: " + esc(scopeLabel(q.scope)))}<div class="activity-content"><article class="formbox"><span class="badge ${chosen ? "accepted-badge" : ""}">${esc(questionStatus(q))}</span><p class="micro">${esc(q.author)} · ${esc(q.relation)} (직접 입력) · ${labelDate(q.created)}${q.owned ? " · 내가 쓴 질문" : ""}</p><p class="user-copy">${esc(q.body)}</p><div class="upload-preview">${q.photos.map((s) => `<img src="${esc(s)}" alt="질문 첨부 사진">`).join("")}</div><div class="actions">${saveButton("question", q.id, q.title, "#/question/" + q.id)}<button class="textlink" ${uiActionAttrs("click", "questionAction_70", [id])}>새 답변 알림 ${q.notify ? "끄기" : "받기"}</button><a class="textlink" href="#/report/question/${id}">신고·차단</a>${q.returnTo ? `<a class="textlink" href="${esc(q.returnTo)}">공간 상담으로 돌아가기 →</a>` : ""}</div></article><div class="section-head"><h2>답변 ${answers.length}개</h2><button class="textlink" type="button" ${uiActionAttrs("click", "getElementById_71", [])}>나도 답변하기 ↓</button></div><p class="micro">여러 이웃의 답변을 함께 살펴보세요. 질문 작성자는 가장 도움이 된 답변 하나를 채택할 수 있어요.</p>${q.owned && answers.length ? '<div class="notice">도움이 된 답변의 “이 답변 채택”을 눌러주세요. 다른 답변으로 변경하거나 채택을 취소할 수 있어요.</div>' : ""}${chosen && !answers.some((a) => a.id === chosen.id) ? '<div class="notice">채택한 답변은 숨김 또는 차단되어 현재 표시되지 않아요.</div>' : ""}${answers.length ? answers.map((a) => answerCard(q, a)).join("") : emptyState(q.answers.length ? "현재 표시할 수 있는 답변이 없어요." : "답변을 기다리고 있어요.", "이웃의 경험을 나누어주세요.")}<div class="actions">${q.owned && !chosen ? `<button class="btn secondary" ${uiActionAttrs("click", "questionAction_67", [id])}>궁금증이 해결됐어요</button><button class="textlink" ${uiActionAttrs("click", "questionAction_68", [id])}>아직 도움이 필요해요</button>` : ""}${q.owned && chosen && !answers.some((a) => a.id === chosen.id) ? `<button class="textlink" ${uiActionAttrs("click", "acceptAnswer_69", [id])}>채택 취소</button>` : ""}<a class="textlink" href="#/area">시설·공식 안내 보기</a></div><form id="answer-form" class="formbox"><h2>나도 답할 수 있어요</h2><p class="micro">답변이나 채택이 있어도 새로운 경험과 정보를 보탤 수 있어요.</p><div class="fields">${selectField("답변의 근거 *", "basis", ["직접 경험", "공식 자료", "일반 의견"], "", true)}${selectField("이 동네와 관계 *", "relation", ["거주", "근무", "입주 예정"], "", true)}${inputField("표시 이름 *", "author", "", 'required maxlength="30"')}${inputField("경험 시기 또는 자료 확인일", "period", "", 'maxlength="60"')}${selectField("이해관계 *", "interest", ["없음", "집주인·관리자", "중개사", "사업자"], "없음", true)}${inputField("공식 자료 원문 주소 (공식 자료 선택 시 필수)", "source", "", 'type="url"')}</div>${textArea("답변 내용 *", "body", "", true)}${formError()}<button class="btn">답변 등록</button></form></div></div>`;
}

/* acceptAnswer — 질문에 달린 답변의 채택 가능 여부를 확인하고 선택한 답변의 채택 상태를 저장합니다. */
function acceptAnswer(id, aid) {
  const q = questions.find((q) => q.id === id && !q.hidden);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!q || !q.owned) {
    toast("질문 작성자만 답변을 채택할 수 있어요.");
    return false;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    aid &&
    !q.answers.some((a) => a.id === aid && !a.hidden && !blockedAuthors.includes(a.author))
  ) {
    toast("현재 확인할 수 있는 답변을 선택해주세요.");
    return false;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    (q.acceptedAnswerId || "") === aid
  )
    return true;
  const next = questions.map((x) =>
    x.id === id
      ? {
          ...x,
          acceptedAnswerId: aid || null,
          acceptedAt: aid ? stamp() : null,
          status: aid
            ? "채택 완료"
            : visibleAnswers(x).length
              ? "답변 확인 중"
              : "답변 기다리는 중",
          helpRequested: aid ? false : x.helpRequested,
        }
      : x,
  );
  if (!persistCollection("questions", next, (v) => (questions = v))) return false;
  toast(aid ? "답변을 채택했어요." : "답변 채택을 취소했어요.");
  render(false);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return true;
}

/* questionAction — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function questionAction(id, action) {
  const current = questions.find((q) => q.id === id && !q.hidden);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!current) return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    action !== "notify" &&
    !current.owned
  )
    return toast("질문 작성자만 질문 상태를 바꿀 수 있어요.");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    action !== "notify" &&
    acceptedAnswer(current)
  )
    return toast("질문 상태를 바꾸려면 먼저 답변 채택을 취소해주세요.");
  const next = questions.map((q) =>
    q.id === id
      ? {
          ...q,
          ...(action === "notify"
            ? { notify: !q.notify }
            : action === "resolved"
              ? { status: "해결됨" }
              : { status: "운영팀 확인 대기", helpRequested: true }),
        }
      : q,
  );
  if (persistCollection("questions", next, (v) => (questions = v))) {
    if (action === "help")
      pushNotice(
        "질문·답변",
        "질문 도움 요청을 저장했어요. 실제 운영팀 전송은 없습니다.",
        "#/question/" + id,
      );
    render(false);
  }
}

/* helpfulAnswer — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function helpfulAnswer(id, aid) {
  persistCollection(
    "questions",
    questions.map((q) =>
      q.id === id
        ? {
            ...q,
            answers: q.answers.map((a) => (a.id === aid ? { ...a, helpful: !a.helpful } : a)),
          }
        : q,
    ),
    (v) => (questions = v),
  );
  render(false);
}

/* answerEvents — 질문 상세 화면의 답변 작성과 관련 버튼에 이벤트를 연결합니다. */
function answerEvents(id) {
  const f = $("#answer-form");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!f) return;
  f.elements.basis.onchange = () =>
    (f.elements.source.required = f.elements.basis.value === "공식 자료");
  f.onsubmit = (e) => {
    e.preventDefault();
    const q = questions.find((q) => q.id === id && !q.hidden);
    if (!q) return errorForm(f, "이 질문에는 현재 답변할 수 없어요.");
    const d = getData(f);
    if (!f.reportValidity()) return;
    if (d.source && !/^https?:\/\//.test(d.source))
      return errorForm(f, "http 또는 https 원문 주소를 입력해주세요.");
    if (!d.body.trim() || publicGuard(d.body))
      return errorForm(f, "답변을 적고 연락처·동호수는 가려주세요.");
    const a = { ...d, id: nid("A"), owned: true, created: stamp() };
    if (
      persistCollection(
        "questions",
        questions.map((x) =>
          x.id === id
            ? {
                ...x,
                answers: [...x.answers, a],
                status: acceptedAnswer(x) ? "채택 완료" : "답변 확인 중",
              }
            : x,
        ),
        (v) => (questions = v),
      )
    ) {
      if (q.notify)
        pushNotice(
          "질문·답변",
          q.title + "에 새 답변이 달렸어요.",
          "#/question/" + id + "/" + a.id,
        );
      save("form-draft-answer-form-" + id, {});
      f.reset?.();
      render(false);
    }
  };
}

/* reviewsPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function reviewsPage() {
  let list = experiences.filter(
    (x) =>
      scopeMatch(x.scope) &&
      !x.hidden &&
      !blockedAuthors.includes(x.author) &&
      (reviewTopic === "전체" || x.topics.includes(reviewTopic)),
  );
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    reviewSort === "인증된 경험"
  )
    list = list.filter((x) => x.verified);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    reviewSort === "내 조건과 비슷한 경험"
  ) {
    const transport = applications.find((a) => a.kind === "waiting")?.data.transport;
    list = list.filter((x) => transport && x.transport === transport);
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("LIFE, AS EXPERIENCED", "살아본 경험으로 생활을 살펴봐요.", "개인의 경험 시점과 확인 범위를 함께 읽어주세요.")}${scopeBar()}${localTabs()}<div class="filters"><select aria-label="후기 주제" ${uiActionAttrs("change", "render_72", [])}>${options(["전체", "소음", "채광", "냉난방", "습기", "관리비", "통근", "주차", "택배"], reviewTopic)}</select><select aria-label="후기 정렬" ${uiActionAttrs("change", "render_73", [])}>${options(["최근 경험", "내 조건과 비슷한 경험", "인증된 경험"], reviewSort)}</select><a class="btn small" href="#/review-write">내 경험도 남기기</a></div><div class="notice">생활권 경험은 특정 방의 품질을 보증하지 않습니다. ‘내 조건과 비슷한 경험’은 등록한 이동 수단이 같은 후기를 보여줘요.</div><div class="activity-content">${list.length ? list.map(reviewCard).join("") : areaEmpty()}</div></div>`;
}

/* reviewCard — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function reviewCard(x) {
  return `<article class="formbox" id="review-${x.id}"><span class="badge">${esc(x.experience)} · ${x.verified ? "확인한 경험" : "이용자 경험 · 인증 전"}</span><p class="micro">${esc(scopeLabel(x.scope))} · ${esc(x.period)} · ${esc(x.author)} · 이해관계 ${esc(x.interest)}</p><h3>${esc(x.title || x.topics.join(" · ") || "생활 경험")}</h3><p class="user-copy">${esc(x.body || "선택한 항목의 경험을 나눴어요.")}</p>${x.commute ? `<p class="user-copy"><b>통근 경험</b><br>${esc(x.commute)}</p>` : ""}<p class="subtle">이동: ${esc(x.transport || "미입력")} / 관리비: ${esc(x.fee || "기억나지 않음")} / 추가 비용: ${esc(x.extra || "미입력")}</p>${x.discussion?.length ? `<section class="review-discussion" aria-label="후기 질문과 답변"><h4>이 후기에 달린 질문과 답변</h4>${x.discussion.map((d) => `<div class="notice"><p><b>${esc(d.author)}</b> · 질문</p><p class="user-copy">${esc(d.question)}</p><p><b>${esc(x.author)}</b> · 작성자 답변</p><p class="user-copy">${esc(d.reply)}</p>${d.followUp ? `<p><b>${esc(d.author)}</b> · 추가 질문</p><p class="user-copy">${esc(d.followUp)}</p><p><b>${esc(x.author)}</b> · 작성자 추가 답변</p><p class="user-copy">${esc(d.followUpReply)}</p>` : ""}</div>`).join("")}</section>` : ""}<div class="actions">${saveButton("review", x.id, x.title || x.topics.join(" · ") || "생활 경험", "#/review/" + x.id)}<button class="textlink" ${uiActionAttrs("click", "reviewHelpful_74", [x.id])}>${x.helpful ? "✓ 도움됐어요" : "도움됐어요"}</button><a class="textlink" href="#/ask">추가 질문하기</a><a class="textlink" href="#/report/review/${x.id}">신고</a></div></article>`;
}

/* reviewHelpful — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function reviewHelpful(id) {
  persistCollection(
    "experiences",
    experiences.map((x) => (x.id === id ? { ...x, helpful: !x.helpful } : x)),
    (v) => (experiences = v),
  );
  render(false);
}

/* reviewWrite — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function reviewWrite() {
  return formShell(
    "길게 쓰지 않아도 괜찮아요.",
    "직접 경험한 항목만 선택해도 다음 이웃에게 도움이 됩니다.",
    "review-form",
    box(
      "01",
      "어디에서 언제 생활했나요?",
      scopeFields() +
        `<div class="fields">${selectField("경험 유형 *", "experience", ["현재 거주", "과거 거주", "방문 경험"], "", true)}${inputField("경험한 시기 *", "period", "", 'required placeholder="예: 2025년 겨울"')}${selectField("주거 형태", "housing", types, "")}</div>`,
    ) +
      box(
        "02",
        "경험한 항목만 남겨주세요",
        choice(
          "topics",
          ["소음", "채광", "냉난방", "습기", "관리비", "통근", "주차", "택배"],
          [],
          true,
        ) +
          selectField("이동 수단", "transport", ["대중교통", "자가용", "도보·자전거"], "") +
          textArea("통근에서 확인해보면 좋을 점", "commute") +
          `<div class="fields">${inputField("고정 관리비 (선택)", "fee", "", 'maxlength="100"')}${inputField("추가로 낸 비용 (선택)", "extra", "", 'maxlength="100"')}</div>` +
          textArea("그 밖에 한 줄 경험", "body"),
      ) +
      box(
        "03",
        "표시 이름과 이해관계",
        inputField("표시 이름 *", "author", "", 'required maxlength="30"') +
          checkField("anonymous", "후기 안에서만 익명") +
          selectField(
            "이해관계 *",
            "interest",
            ["없음", "집주인·관리자", "중개사", "사업자"],
            "없음",
            true,
          ) +
          '<div class="notice">현재 상태: 이용자 경험 · 인증 전. 거주 상태를 직접 입력해도 인증 배지는 생기지 않습니다.</div>' +
          checkField(
            "consent",
            "직접 경험한 내용이며 다른 사람의 개인정보가 없는지 확인했어요.",
            false,
            true,
          ),
      ),
    "경험 게시하기",
  );
}

/* reviewEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function reviewEvents() {
  const f = $("#review-form");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = getData(f),
      topics = new FormData(f).getAll("topics");
    if (!topics.length && !d.body.trim() && !d.commute.trim())
      return errorForm(f, "기억나는 항목이나 한 줄 경험을 남겨주세요.");
    if (publicGuard(d.body + " " + d.commute))
      return errorForm(f, "연락처·동호수로 보이는 내용을 가려주세요.");
    const x = {
      ...d,
      topics,
      id: nid("E"),
      scope: getScope(f),
      author: d.anonymous ? "익명" : d.author,
      verified: false,
      created: stamp(),
      owned: true,
    };
    if (persistCollection("experiences", [x, ...experiences], (v) => (experiences = v))) {
      save("form-draft-review-form", {});
      location.hash = "/review/" + x.id;
    }
  };
}

/* unavailable — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function unavailable() {
  return `<div class="container">${pageHead("UNAVAILABLE", "현재 볼 수 없는 내용이에요.", "삭제되었거나 비공개로 전환된 내용일 수 있습니다.")}<a class="btn" href="#/questions">동네 질문으로</a></div>`;
}

/* registrationSchemas — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const registrationSchemas = {
  broker: [
    // 중개사 계정을 옥키가 발급하고 사무소 정보를 연결하면 이 입력란을 제거한다.
    [
      "01",
      "중개사무소와 담당자",
      [
        ["office", "중개사무소명"],
        ["officeNumber", "중개사무소 등록번호"],
        ["representative", "대표 공인중개사 성명"],
        ["name", "담당자 이름·역할"],
        ["officeAddress", "중개사무소 주소"],
        // 사무소 대표번호는 보류. 신청자 번호는 인증 없이 운영자 연락용으로 받는다.
        // ["officePhone", "사무소 전화번호"],
        ["phone", "신청자 전화번호", "tel"],
        ["officeEvidence", "사무소 확인 자료·등록 정보 설명", "textarea"],
      ],
    ],
    [
      "02",
      "매물과 중개 의뢰",
      [
        ["title", "매물 제목"],
        ["type", "주거 유형", "select", types],
        ["building", "건축물 용도·종류"],
        ["region", "읍·면", "select", regions],
        ["address", "소재지·동·호수 · 비공개"],
        ["area", "공급·전용 면적"],
        ["floor", "층수·전체 층수"],
        ["roomsBaths", "방·욕실 수"],
        ["direction", "방향·방향 기준"],
        ["approved", "사용승인일", "date"],
        ["parking", "총 주차 대수·주차 조건"],
        ["authority", "중개 의뢰·안내 권한", "select", ["의뢰·안내 동의 확인", "추가 확인 필요"]],
        ["authorityEvidence", "확인 일자·근거 · 비공개", "textarea"],
      ],
    ],
    [
      "03",
      "거래 조건과 비용",
      [
        ["transaction", "거래 유형", "select", ["월세", "전세", "기타 임대"]],
        ["deposit", "보증금 (만 원)", "unknown"],
        ["rent", "월세 (만 원, 전세는 0)", "unknown"],
        ["fee", "고정 관리비 (만 원)", "unknown"],
        ["feeItems", "관리비 포함 항목"],
        ["feeBasis", "관리비 세부 내역·부과 기준", "textarea"],
        ["utilities", "별도 공과금·기타 비용과 부과 기준", "textarea"],
        ["min", "최소 계약 기간 (개월)", "number"],
        ["max", "최대 계약 기간 (개월, 선택)", "optional-number"],
        ["commission", "중개보수 안내"],
      ],
    ],
    [
      "04",
      "입주 일정과 시설",
      [
        ["condition", "현재 매물 상태", "select", ["공실", "거주 중·퇴거일 확인", "수리 중"]],
        ["date", "실제 입주 가능일", "unknown-date"],
        ["repairDate", "퇴거·수리 완료 예정일 (선택)", "optional-date"],
        ["facilities", "난방·냉방·기본 옵션", "textarea"],
        ["kitchen", "주방", "select", ["단독", "공유", "미확인"]],
        ["bath", "욕실", "select", ["단독", "공유", "미확인"]],
        ["rules", "흡연·반려동물·입주 조건", "textarea"],
        ["inspection", "확인한 상태·현장 확인일·미확인 사항", "textarea"],
      ],
    ],
    [
      "05",
      "공개 범위와 상담 연결",
      [
        ["publicScope", "일반 공개·맞춤 안내 범위", "textarea"],
        ["contactTime", "상담 담당자·가능 시간"],
      ],
    ],
  ],
  resident: [
    [
      "01",
      "현재 거주자와 모집 권한",
      [
        ["name", "이름 또는 별칭"],
        ["phone", "신청자 전화번호", "tel"],
        ["residency", "현재 거주 여부·확인 방법"],
        [
          "authority",
          "모집 권한",
          "select",
          ["소유자이며 직접 거주", "임차인·필요한 동의 확보", "동의 확인 중"],
        ],
        ["authorityEvidence", "모집 권한 확인 자료·설명 · 비공개", "textarea"],
      ],
    ],
    [
      "02",
      "공간과 모집 조건",
      [
        ["type", "모집 형태", "select", ["룸메이트", "셰어하우스", "하숙", "기타 공동거주"]],
        ["title", "모집 제목"],
        ["region", "읍·면", "select", regions],
        ["address", "주소·상세 위치 · 비공개"],
        ["currentPeople", "현재 거주 인원 (본인 포함)", "number"],
        ["recruitPeople", "추가 모집 인원", "number"],
        ["sleeping", "제공할 잠자리", "select", ["개인 방", "같은 방 공유"]],
        ["roomArea", "사용할 방 수·면적"],
        ["date", "입주 가능일", "unknown-date"],
        ["min", "최소 거주 기간 (개월)", "number"],
        ["endDate", "모집 종료 예정일 (선택)", "optional-date"],
      ],
    ],
    [
      "03",
      "비용과 함께 사는 방식",
      [
        ["deposit", "보증금 (만 원, 없음은 0)", "unknown"],
        ["rent", "월세 또는 월 분담금 (만 원)", "unknown"],
        ["fee", "고정 관리비 (만 원, 실비는 미정)", "unknown"],
        ["meal", "식사 제공·식비 (하숙 선택 시 필수)", "optional"],
        ["utilities", "공과금·추가 비용과 분담 방식", "textarea"],
        ["kitchen", "주방 사용", "select", ["공유", "단독", "미확인"]],
        ["bath", "욕실 사용", "select", ["공유", "단독", "미확인"]],
        ["rules", "흡연·반려동물·방문객 기준", "textarea"],
        ["livingRules", "생활 시간·청소·공용물품 규칙", "textarea"],
        ["intro", "현재 거주자 소개 (선택)", "optional-textarea"],
      ],
    ],
    ["04", "사진과 연락", [["contactTime", "상담 가능한 시간·방법"]]],
  ],
};

/* registerChoice — 사용자의 요청을 확인하고 관련 신청·등록 절차를 진행합니다. */
function registerChoice() {
  return `<div class="container">${pageHead("REGISTER YOUR SPACE", "어떤 방 정보를 등록하시나요?", "공인중개사의 매물과, 현재 거주자의 함께 살 사람 모집을 각각의 절차로 접수합니다.")}<div class="two-grid section"><div class="soft-card registration-choice"><span class="badge">공인중개사</span><h2>확인한 매물을 등록해요</h2><p>중개사무소·담당자 확인<br>중개 의뢰·안내 권한 확인<br>거래 조건·입주일·시설 등록<br>변경·거래 완료와 상담 관리</p><a class="btn" href="#/provide/broker">공인중개사 매물 등록하기 →</a></div><div class="soft-card registration-choice"><span class="badge orange">현재 거주자</span><h2>함께 살 사람을 찾아요</h2><p>룸메이트·셰어하우스·하숙<br>현재 거주·모집 권한 확인<br>모집 인원·비용 분담·공용 시설<br>생활 규칙·일정과 상담 관리</p><a class="btn" href="#/provide/resident">함께 살 사람 모집하기 →</a></div></div><div class="notice">등록 후에는 유형별 확인 → 안내 가능 → 상담 → 모집·거래 완료로 이어집니다. 권한과 동의 확인 전에는 안내를 보류해요.</div><a class="btn secondary" href="#/activity/tips">내 방 등록 내역 보기</a></div>`;
}

/* schemaField — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function schemaField([name, label, kind = "text", items], d) {
  if (name === "phone") return applicantPhoneField();
  const required = !kind.startsWith("optional");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (kind === "select")
    return selectField(label + " *", name, items, d[name], true);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    kind.includes("textarea")
  )
    return textArea(label + (required ? " *" : ""), name, d[name], required);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    kind.startsWith("unknown")
  )
    return uncertainField(label + " *", name, d, kind === "unknown-date" ? "date" : "number");
  const type = kind.replace("optional-", "");
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return inputField(
    label + (required ? " *" : ""),
    window.intakeEnabled && name === "name" ? "intakeApplicantName" : window.intakeEnabled && name === "title" ? "intakeListingTitle" : name,
    d[name],
    `${required ? "required" : ""} type="${["number", "date", "tel"].includes(type) ? type : "text"}" ${type === "number" ? 'min="1" max="999"' : ""} ${name === "phone" ? 'pattern="0[0-9-]{8,14}"' : ""} maxlength="200"`,
  );
}

/* registrationPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function registrationPage(mode) {
  const d = window.intakeEnabled ? {} : read("form-draft-registration-" + mode, {});
  return formShell(
    mode === "broker"
      ? "공인중개사가 확인한 매물을 등록해요."
      : "지금 사는 집에서, 함께 살 사람을 찾아요.",
    "정확한 주소와 연락처는 비공개로 접수하며 확인 전에는 안내하지 않습니다.",
    "registration-" + mode,
    registrationSchemas[mode]
        .map(([n, t, fields], index) =>
          box(
            mode === "broker" ? String(index + 1).padStart(2, "0") : n,
            t,
            `<div class="fields">${fields.map((x) => schemaField(x, d)).join("")}</div>${/* 휴대전화 체험 확인 보류: n === "01" ? verifyUI("phone") : "" */ ""}`,
          ),
        )
        .join("") +
      box(
        "✓",
        "사진과 제출 확인",
        photoField().replace("사진 (선택)", "공간 사진 *") +
          '<p class="micro">모집할 방·주방·욕실·공용 공간을 보여주세요. 인물·연락처·개인 물품이 노출되지 않도록 확인해주세요.</p>' +
          checkField("truth", "입력한 정보와 모집·안내 권한이 사실임을 확인합니다.", false, true) +
          checkField("updates", "변경·모집 완료 시 정보를 수정하고 마감하겠습니다.", false, true) +
          checkField("privacy", "등록 확인을 위한 개인정보 처리에 동의합니다.", false, true),
      ),
    mode === "broker" ? "중개 매물 등록 요청" : "함께 살 사람 모집 등록",
  );
}

/* registrationEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function registrationEvents(mode) {
  const f = $("#registration-" + mode);
  verification = {};
  wirePhotos(f);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (mode === "resident")
    f.elements.type.onchange = () => (f.elements.meal.required = f.elements.type.value === "하숙");
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    // 휴대전화 체험 확인은 기능 재개 전까지 보류한다.
    // if (!verified(f, "phone")) return errorForm(f, "휴대전화 체험 확인을 완료해주세요.");
    if (f._loading || !f._photos.length)
      return errorForm(f, "공간 사진을 한 장 이상 추가해주세요.");
    const d = getData(f);
    // 운영 DB 연결 전에는 신청자 번호를 체험 신청 객체에 남기지 않는다.
    delete d.phone;
    if (d.max && +d.max < +d.min)
      return errorForm(f, "최대 기간은 최소 기간 이상으로 입력해주세요.");
    const a = {
      id: nid(mode === "broker" ? "B" : "R"),
      kind: "tip",
      mode,
      data: { ...d, role: mode === "broker" ? "공인중개사" : "현재 거주자" },
      photos: f._photos,
      status: "접수",
      created: stamp(),
      history: [{ time: stamp(), text: "방 등록 체험 접수 · " + mode }],
    };
    if (writeApps([a, ...applications])) {
      save("form-draft-" + f.id, {});
      location.hash = "/tip/" + a.id;
    }
  };
}

/* legacyProvidePage, legacyProvideEvents — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const legacyProvidePage = providePage,
  legacyProvideEvents = provideEvents;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
providePage = function (mode) {
  return !mode
    ? registerChoice()
    : registrationSchemas[mode]
      ? registrationPage(mode)
      : legacyProvidePage(mode);
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
provideEvents = function (mode) {
  if (registrationSchemas[mode]) registrationEvents(mode);
  else if (mode) legacyProvideEvents(mode);
};

/* previousTipDetailIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousTipDetailIntegrated = tipDetail;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tipDetail = function (id) {
  const a = applications.find((a) => a.id === id);
  if (!a || !registrationSchemas[a.mode]) return previousTipDetailIntegrated(id);
  return `<div class="container">${pageHead("MY ROOM REGISTRATION", "방 등록을 접수했어요.", "확인이 끝난 정보만 공개하거나 방 알림으로 안내합니다.")}${activityTabs("tips")}<div class="activity-content"><div class="summary"><span class="badge">${esc(a.status)}</span><h2>${esc(a.data.title)}</h2><p>${a.mode === "broker" ? "공인중개사 매물" : "거주자 공동거주 모집"} · ${esc(a.id)}</p><p class="micro">${a.mode === "broker" ? "사무소 확인과 개별 매물 확인은 별도입니다." : "거주·모집 동의가 확인되기 전에는 공개하지 않습니다."}</p></div>${registrationSchemas[a.mode].map(([n, t, fields]) => box(n, t, `<dl class="consultation-answer-list">${fields.map(([k, label]) => `<div><dt>${label}</dt><dd>${esc(a.data[k + "Unknown"] ? "미정" : a.data[k] || "미입력")}</dd></div>`).join("")}</dl>`)).join("")}<div class="upload-preview">${a.photos.map((s) => `<img src="${esc(s)}" alt="등록 사진">`).join("")}</div><div class="actions"><button class="btn secondary" ${uiActionAttrs("click", "tipChange_44", [id])}>수정 요청</button><button class="textlink" ${uiActionAttrs("click", "closeRegistration_75", [id])}>모집·거래 완료</button><button class="textlink danger" ${uiActionAttrs("click", "tipChange_45", [id])}>철회</button><button class="textlink" ${uiActionAttrs("click", "showHistory_23", [id])}>진행 기록</button></div></div></div>`;
};

/* closeRegistration — 선택한 항목이나 진행 중인 상태를 종료하거나 삭제하는 흐름을 처리합니다. */
function closeRegistration(id) {
  modal(
    `<h2>모집·거래를 마감할까요?</h2><p>새 상담과 알림 안내를 중단하고 기존 기록은 보관합니다.</p><button class="btn" id="close-registration">마감하기</button>`,
  );
  $("#close-registration").onclick = () => {
    if (patchApp(id, { status: "모집·거래 완료" }, "등록자 마감")) {
      persistCollection(
        "alerts",
        alerts.map((n) =>
          n.tipId === id
            ? {
                ...n,
                status: "마감",
                changes: [
                  ...(n.changes || []),
                  { date: stamp().slice(0, 10), text: "등록자가 모집·거래 완료 처리" },
                ],
              }
            : n,
        ),
        (v) => (alerts = v),
      );
      closeModal();
      render(false);
    }
  };
}

/* previousCompareIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousCompareIntegrated = compareConditions;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
compareConditions = function (d, h) {
  const c = previousCompareIntegrated(d, h);
  if (h.registrationMode === "resident") {
    if (d.sharing === "단독 주거만") c.mismatch.push("공동거주 수용 여부");
    else if (!d.sharing || d.sharing === "상담 후 결정") c.unknown.push("공동거주 수용 여부");
    else c.passed.push("공동거주 수용 여부");
  }
  return c;
};

/* previousWaitTwoIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousWaitTwoIntegrated = waitStepTwo;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
waitStepTwo = function (d) {
  return previousWaitTwoIntegrated(d).replace(
    '<div class="fields extra-conditions">',
    '<div class="fields extra-conditions">' +
      selectField(
        "공동거주 수용 여부",
        "sharing",
        ["단독 주거만", "공동거주 가능", "상담 후 결정"],
        d.sharing || "상담 후 결정",
      ),
  );
};

/* previousTipSnapshotIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousTipSnapshotIntegrated = tipSnapshot;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tipSnapshot = function (a) {
  return {
    ...previousTipSnapshotIntegrated(a),
    registrationMode: a.mode,
    name: a.data.title || previousTipSnapshotIntegrated(a).name,
    description:
      a.mode === "resident"
        ? "현재 거주자의 함께 살 사람 모집입니다. 잠자리·분담금·생활 규칙을 확인해주세요."
        : "안내 권한과 조건을 확인한 매물입니다.",
    sleeping: a.data.sleeping || null,
    recruitPeople: a.data.recruitPeople || null,
    livingRules: a.data.livingRules || null,
  };
};

/* previousReviewTipIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousReviewTipIntegrated = reviewTip;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
reviewTip = function (id) {
  previousReviewTipIntegrated(id);
  const a = applications.find((a) => a.id === id),
    f = $("#review-tip");
  if (!registrationSchemas[a.mode] || !f) return;
  const fieldset = document.createElement("fieldset");
  fieldset.className = "formbox";
  setHTML(fieldset, `<legend>${a.mode === "broker" ? "사무소·매물 분리 확인" : "현재 거주·모집 조건 확인"}</legend>${(a.mode ===
  "broker"
    ? [
        ["officeChecked", "중개사무소 등록번호·대표·담당자 확인"],
        ["listingChecked", "개별 매물 표시 정보·공개 범위 확인"],
      ]
    : [
        ["residentChecked", "현재 거주·필요한 동의·모집 권한 확인"],
        ["sharingChecked", "잠자리·모집 인원·비용 분담·생활 규칙 확인"],
      ]
  )
    .map(([k, t]) => checkField(k, t, !!a.review?.[k]))
    .join("")}`);
  f.prepend(fieldset);
  const submit = f.onsubmit;
  f.onsubmit = (e) => {
    const d = getData(f),
      keys =
        a.mode === "broker"
          ? ["officeChecked", "listingChecked"]
          : ["residentChecked", "sharingChecked"];
    if (d.status === "안내 가능" && !keys.every((k) => d[k])) {
      e.preventDefault();
      return errorForm(f, "등록 유형별 확인을 모두 마쳐주세요.");
    }
    submit(e);
  };
};

/* previousPrepareAlertIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousPrepareAlertIntegrated = prepareAlert;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
prepareAlert = function (id) {
  const a = applications.find((a) => a.id === id);
  if (registrationSchemas[a?.mode]) {
    const keys =
      a.mode === "broker"
        ? ["officeChecked", "listingChecked"]
        : ["residentChecked", "sharingChecked"];
    if (!keys.every((k) => a.review?.[k])) return toast("등록 유형별 확인이 필요합니다.");
  }
  return previousPrepareAlertIntegrated(id);
};

/* previousWaitingActionIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousWaitingActionIntegrated = waitingAction;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
waitingAction = function (id, status) {
  if (status === "집 구함") {
    location.hash = "/settle/" + id;
    return;
  }
  previousWaitingActionIntegrated(id, status);
};

/* settlePage — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function settlePage(id) {
  const d = settleProfile;
  return formShell(
    "첫 집을 구하셨군요. 다음 생활을 준비해요.",
    "입주 완료는 직접 입력하는 상태이며 거주 인증과 구분합니다.",
    "settle-form",
    box(
      "01",
      "지금 어떤 단계인가요?",
      `<div class="fields">${selectField("현재 단계 *", "status", ["계약 예정", "계약 완료·입주 전", "입주 완료"], d.status, true)}${inputField("입주 예정일 또는 실제 이사일", "date", d.date, 'type="date"')}${selectField("생활할 지역", "region", regions, d.region)}</div>`,
    ) +
      box(
        "02",
        "방 알림과 상담 정리",
        selectField("방 알림 처리 *", "waiting", ["종료", "일시 중단", "계속 받기"], "종료", true) +
          '<div class="notice">알림 종료만으로 진행 중인 상담이 취소되지 않아요.</div><a class="textlink" href="#/activity/consultations">진행 중인 상담 확인 →</a>',
      ) +
      box(
        "03",
        "새 생활을 시작하는 방법",
        checkField("tasks", "입주 준비·첫 1년 할 일을 내 생활에 추가") +
          checkField("localNews", "관심 생활권의 새 소식 받기") +
          checkField("reviewPrompt", "경험이 쌓인 뒤 후기 작성 안내 받기"),
      ),
    "저장하고 내 생활 시작",
  );
}

/* settleEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function settleEvents(id) {
  $("#settle-form").onsubmit = (e) => {
    e.preventDefault();
    const d = getData(e.target),
      a = applications.find((a) => a.id === id && a.kind === "waiting");
    if (
      a &&
      !patchApp(
        id,
        {
          status:
            d.waiting === "종료" ? "집 구함" : d.waiting === "일시 중단" ? "일시 중단" : "대기 중",
        },
        "생활 단계 변경 · " + d.waiting,
      )
    )
      return;
    if (save("settle-profile", d)) {
      settleProfile = d;
      if (d.tasks) {
        const next = {
          ...todoState,
          move: { ...todoState.move, selected: true },
          contract: { ...todoState.contract, selected: true },
        };
        if (save("todos", next)) todoState = next;
      }
      if (d.localNews) {
        notificationPrefs = { ...notificationPrefs, localNews: true };
        save("notification-prefs", notificationPrefs);
      }
      save("form-draft-settle-form", {});
      location.hash = "/life";
    }
  };
}

/* lifePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
/* lifePage: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function lifePage(...args) {
  /* 처리 단계 1: 기존 integrated.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function () {
    const unanswered = questions.filter((q) => q.owned && q.answers.length),
      own = experiences.filter((x) => x.owned);
    return `<div class="container">${pageHead("YOUR LIFE IN OKCHEON", "오늘도 옥천에서, 내 생활", "집을 구한 뒤에도 필요한 정보와 할 일, 내가 나눈 경험을 이어가세요.")}<div class="summary life-summary"><div><span class="badge">${esc(settleProfile.status || "생활 준비 중")} · 직접 입력</span><h2>${esc(settleProfile.region || "내 생활권을 정해보세요")}</h2><p class="subtle">입주일 ${esc(settleProfile.date || "미정")} · 방 알림을 종료해도 질문과 저장한 정보는 이어집니다.</p></div><a class="btn secondary" href="#/settle">내 상태 바꾸기</a></div><section class="section"><h2>다음에 챙길 일</h2><div class="grid3">${[
      ["이사·전입 준비", "내가 선택한 할 일과 날짜를 확인해요.", "tasks"],
      ["생활 정보 다시 확인", "동네 시설 운영시간과 생활 공지를 봐요.", "area"],
      ["다음 계약·이사 준비", "내가 정한 확인일을 남겨보세요.", "task/renew"],
    ]
      .map(
        ([t, p, r]) =>
          `<a class="soft-card" href="#/${r}"><h3>${t}</h3><p>${p}</p><span class="textlink">열어보기 →</span></a>`,
      )
      .join(
        "",
      )}</div></section><section class="section"><h2>내 질문에 도착한 답변</h2>${unanswered.length ? unanswered.map((q) => `<a class="application block" href="#/question/${q.id}"><h3>${esc(q.title)}</h3><span class="subtle">답변 ${q.answers.length}개 · ${esc(q.status)}</span></a>`).join("") : emptyState("아직 도착한 답변이 없어요.", "궁금한 내용을 동네 이웃에게 물어보세요.")}<a class="textlink" href="#/ask">동네에 질문하기 →</a></section>${
      notificationPrefs.answerRequests
        ? `<section class="section"><h2>이번에는 내가 도움을 줄 수 있어요</h2>${
            questions
              .filter((q) => !q.owned && scopeMatch(q.scope) && !q.answers.length)
              .slice(0, 1)
              .map((q) => `<a class="soft-card" href="#/question/${q.id}">${esc(q.title)} →</a>`)
              .join("") || '<div class="notice">현재 받은 답변 요청이 없습니다.</div>'
          }</section>`
        : ""
    }<section class="two-grid section"><div class="soft-card"><h3>내 경험과 도움 기록</h3><p>남긴 후기 ${own.length}개 · 답변 ${questions.reduce((n, q) => n + q.answers.filter((a) => !a.demo).length, 0)}개</p><a class="textlink" href="#/review-write">경험 남기기 →</a><details><summary>내 기록 보기</summary>${own.map((x) => `<p><a href="#/review/${x.id}">${esc(x.period)} · ${esc(x.topics.join(", "))}</a></p>`).join("") || "<p>아직 남긴 후기가 없어요.</p>"}</details></div><div class="soft-card"><h3>내가 저장한 것</h3><p>동네 장소 · 질문·후기 · 생활 정보</p><a class="textlink" href="#/saved">저장한 정보 보기 →</a></div></section><div class="actions section"><a class="btn secondary" href="#/notification-settings">알림 종류·시간 설정</a><a class="textlink" href="#/verification">인증·공개 범위</a><a class="textlink" href="#/reports">신고·정정 처리 내역</a></div></div>`;
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const lifeBeforeMap = implementation0;

  /* 처리 단계 2: 기존 neighborhood-map.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function () {
    return lifeBeforeMap().replace(
      '<section class="section"><h2>다음에 챙길 일</h2>',
      activityMapSection("life") + '<section class="section"><h2>다음에 챙길 일</h2>',
    );
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phBaseLife = implementation1;

  /* 처리 단계 3: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation2 = function () {
    return phBaseLife().replace(
      '<section class="section"><h2>다음에 챙길 일</h2>',
      `<section class="section ph-life-entry"><div class="soft-card"><span class="section-kicker">PUBLIC HOUSING</span><h2>나의 다음 주거 기회</h2><p>관심 주택 ${phState.interests.length}곳 · 수신 중인 공공주택 알림 ${phState.subscriptions.filter((s) => s.active).length}건</p><div class="actions"><a class="btn small" href="#/activity/public">내 공공주택</a><a class="textlink" href="#/public">모집 공고 알아보기 →</a></div></div></section><section class="section"><h2>다음에 챙길 일</h2>`,
    );
  };
  return implementation2(...args);
}

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const t of [
  {
    id: "visit",
    title: "비용·시설·공유 조건 확인",
    when: "집보기·계약 준비",
    desc: "방문·상담에서 확인할 질문을 정리해요.",
    checks: ["고정비와 별도 실비 구분", "시설 상태와 공유 범위 확인"],
  },
  {
    id: "contract",
    title: "설명받을 내용과 준비 자료",
    when: "집보기·계약 준비",
    desc: "계약 판단은 해당 전문가에게 확인해요.",
    checks: ["설명받을 사항과 궁금한 점 메모", "요구되는 자료를 공식 안내에서 확인"],
  },
  {
    id: "renew",
    title: "재계약·다음 이사 확인일",
    when: "다음 계약·이사",
    desc: "법정 기한을 자동 판단하지 않고 내가 정한 날짜를 저장해요.",
    checks: ["계약 내용을 전문가와 확인", "내가 정한 확인일을 저장"],
  },
])
  if (!tasks.some((x) => x.id === t.id)) tasks.push(t);

/* previousTasksIntegrated, previousTaskDetailIntegrated, previousTaskEventsIntegrated — 이 구간에서 사용하는 데이 */
const previousTasksIntegrated = tasksPage,
  previousTaskDetailIntegrated = taskDetail,
  previousTaskEventsIntegrated = taskEvents;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tasksPage = function () {
  return previousTasksIntegrated()
    .replace("옥천에서의 첫 1년, 하나씩 챙겨요.", "계약 준비부터 첫 1년까지")
    .replace(
      '<div class="activity-content">',
      '<div class="activity-content"><div class="notice"><a class="textlink" href="#/life">← 내 생활</a> · 내 상황에 맞는 항목과 확인일을 정해요.</div>',
    );
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
taskDetail = function (id) {
  return previousTaskDetailIntegrated(id).replace(
    '<button class="btn">상태 저장하고 할 일로 돌아가기',
    box(
      "05",
      "내가 정한 확인일",
      inputField("준비 알림 날짜 (선택)", "remindDate", todoState[id]?.remindDate, 'type="date"') +
        checkField("remind", "이 할 일의 준비 알림 받기", !!todoState[id]?.remind),
    ) + '<button class="btn">상태 저장하고 할 일로 돌아가기',
  );
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
taskEvents = function (id) {
  const f = $("#task-form");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = getData(f);
    if (d.remind && !d.remindDate) return errorForm(f, "준비 알림을 받을 날짜를 정해주세요.");
    const next = { ...todoState, [id]: { ...d, selected: true } };
    if (save("todos", next)) {
      todoState = next;
      save("form-draft-task-form-" + id, {});
      location.hash = "/tasks";
    }
  };
};

/* savedPage — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function savedPage(tab = "space") {
  const groups = {
      space: "공간",
      place: "동네 장소",
      question: "질문·후기",
      task: "생활 정보·할 일",
    },
    list =
      tab === "task"
        ? tasks
            .filter((t) => todoState[t.id]?.selected)
            .map((t) => ({
              kind: "task",
              id: t.id,
              title: t.title,
              href: "#/task/" + t.id,
              created: todoState[t.id].savedAt || null,
              notify: !!todoState[t.id].remind,
            }))
        : savedItems.filter((x) =>
            tab === "question" ? ["question", "review"].includes(x.kind) : x.kind === tab,
          );
  const ns = alerts.filter((n) => isSaved("space", n.id));
  return `<div class="container">${pageHead("SAVED FOR LATER", "저장한 정보로 다음 선택을 이어가요.", "저장은 알림 수신 동의와 달라요. 새 소식을 받고 싶은 항목만 따로 선택하세요.")}<nav class="tabs">${Object.entries(
    groups,
  )
    .map(([k, v]) => `<a class="tab ${tab === k ? "active" : ""}" href="#/saved/${k}">${v}</a>`)
    .join("")}</nav><div class="activity-content">${
    tab === "space" && ns.length
      ? `<div class="table-scroll"><table class="compare-table"><caption>내게 안내된 저장 공간 비교</caption><thead><tr><th>확인 항목</th>${ns.map((n) => `<th>${esc(n.snapshot.name)}</th>`).join("")}</tr></thead><tbody>${[
          ["현재 상태", (n) => n.status],
          ["보증금", (n) => money(n.snapshot.deposit)],
          ["월 고정비", (n) => cost(n.snapshot)],
          ["입주 가능일", (n) => n.snapshot.date || "미확인"],
          [
            "주방 / 욕실",
            (n) => (n.snapshot.kitchen || "미확인") + " / " + (n.snapshot.bath || "미확인"),
          ],
          [
            "등록 조건과 차이",
            (n) => {
              const c = compareConditions(
                applications.find((a) => a.id === n.waitId)?.data || {},
                n.snapshot,
              );
              return [...c.mismatch, ...c.unknown].join(", ") || "확인한 항목에 부합";
            },
          ],
        ]
          .map(
            ([l, fn]) =>
              `<tr><th>${l}</th>${ns.map((n) => `<td>${esc(fn(n))}</td>`).join("")}</tr>`,
          )
          .join(
            "",
          )}<tr><th>이어서 보기</th>${ns.map((n) => `<td><a href="#/alert/${n.id}" class="textlink">${n.status === "마감" ? "마감 정보" : "공간 정보와 상담"} →</a></td>`).join("")}</tr></tbody></table></div>`
      : ""
  }${list.length ? list.map((x) => `<article class="application"><h3>${esc(x.title)}</h3><p class="micro">${x.created ? labelDate(x.created) + " 저장" : "선택한 할 일"} · 변경 알림 ${x.notify ? "켜짐" : "꺼짐"}</p><div class="actions"><a class="btn small" href="${esc(x.href)}">내용 보기 →</a><button class="textlink" ${uiActionAttrs("click", "savedSubscription_76", [x.kind, x.id])}>변경 알림 ${x.notify ? "끄기" : "받기"}</button>${saveButton(x.kind, x.id, x.title, x.href)}</div></article>`).join("") : emptyState("이 분류에 저장한 정보가 없어요.")}<a class="textlink" href="#/ask">비교 중 궁금한 점 질문하기 →</a></div></div>`;
}

/* savedSubscription — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function savedSubscription(kind, id) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (kind === "task") {
    location.hash = "/task/" + id;
    return;
  }
  persistCollection(
    "saved-items",
    savedItems.map((x) => (x.kind === kind && x.id === id ? { ...x, notify: !x.notify } : x)),
    (v) => (savedItems = v),
  );
  render(false);
}

/* previousConsultIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousConsultIntegrated = consultationPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
consultationPage = function (id, parentId) {
  let html = previousConsultIntegrated(id, parentId);
  const n = alerts.find((x) => x.listingId === id && x.waitId === parentId),
    h = n?.snapshot || homes.find((x) => x.id === id);
  if (!h) return html;
  const block = `<section class="formbox experience-bridge"><span class="section-kicker">BEFORE YOU MOVE IN</span><h2>집의 조건 다음에는, 살아본 사람의 경험</h2><p>${esc(h.region)}의 통근·관리비·시설 경험을 찾아보세요. 비공개 주소와 등록자 연락처는 질문에 붙지 않아요.</p><div class="actions"><button class="btn secondary" ${uiActionAttrs("click", "fromSpace_77", [h.id, parentId || ""])}>이웃에게 물어보기</button><button class="textlink" ${uiActionAttrs("click", "fromSpace_78", [h.id, parentId || ""])}>생활권 후기 보기 →</button>${n ? saveButton("space", n.id, h.name, "#/alert/" + n.id) : ""}<a class="textlink" href="#/saved">저장·비교 →</a><a class="textlink" href="#/report/space/${id}">정보 오류 알리기</a></div><p class="micro">이 건물에 연결된 후기는 아직 없어요. 후기 없음은 나쁜 공간이라는 뜻이 아닙니다.</p></section>`;
  return html.replace(
    '<section class="consultation-form-wrap"',
    block + '<section class="consultation-form-wrap"',
  );
};

/* fromSpace — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function fromSpace(id, parentId, route) {
  const h = homes.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!h) return;
  neighborhood = { region: h.region, village: "" };
  save("neighborhood", neighborhood);
  save("community-return", consultationHref(id, parentId));
  location.hash = "/" + route;
}

/* facilities — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const facilities = [
  {
    id: "recycle",
    title: "분리수거장 A",
    category: "분리수거·폐기물",
    region: "옥천읍",
    x: 30,
    y: 35,
    guide: "배출 가능 품목과 대형폐기물의 별도 신청 방법을 공식 안내에서 확인해주세요.",
  },
  {
    id: "bus",
    title: "정류장 B",
    category: "교통",
    region: "옥천읍",
    x: 65,
    y: 65,
    guide: "이용 날짜의 노선·첫차·막차를 공식 안내에서 확인해주세요.",
  },
  {
    id: "office",
    title: "행정복지센터 · 예시 지점",
    category: "공공시설",
    region: "옥천읍",
    x: 73,
    y: 24,
    guide: "민원별 이용 시간과 준비 자료를 담당 기관에 확인해주세요.",
  },
];

/* mapPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
/* mapPage: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function mapPage(...args) {
  /* 처리 단계 1: 기존 integrated.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function () {
    const visible = facilities.filter(
        (p) =>
          (!neighborhood.region || p.region === neighborhood.region) &&
          (placeCategory === "전체" || p.category === placeCategory) &&
          (!placeQuery || (p.title + p.category).includes(placeQuery)),
      ),
      p = visible.find((x) => x.id === selectedPlace) || visible[0];
    return `<div class="container">${pageHead("NEIGHBORHOOD MAP", "우리 동네에 필요한 정보를 지도에서 찾아요.", "분리수거·교통·공공시설과 생활 공지를 함께 확인해요.")}<div class="notice warning">시설·위치는 설계용 예시이며 실제 카카오맵은 연결되지 않았습니다. 운영시간·상세 주소·출처는 확인 필요로 표시합니다.</div><div class="filters"><select aria-label="지도 지역" ${uiActionAttrs("change", "save_80", [])}><option value="">옥천 전체</option>${options(regions, neighborhood.region)}</select><input aria-label="시설 검색" placeholder="시설 이름·분류" value="${esc(placeQuery)}" ${uiActionAttrs("change", "render_81", [])}><select aria-label="시설 분류" ${uiActionAttrs("change", "render_82", [])}>${options(["전체", "분리수거·폐기물", "교통", "공공시설", "건강·의료", "생활 공지"], placeCategory)}</select><button class="textlink" ${uiActionAttrs("click", "toast_83", [])}>내 위치 보기</button></div><div class="area-layout"><div class="map-panel area-map">${mapSvg()}<div class="map-note">도식 지도 · 실제 좌표 아님</div>${visible.map((x) => `<button class="marker ${p?.id === x.id ? "selected" : ""}" style="left:${x.x}%;top:${x.y}%" ${uiActionAttrs("click", "String_79", [x.id])}>${esc(x.title)}</button>`).join("")}</div><div class="formbox">${p ? `<span class="badge">${p.category} · 예시</span><h2>${p.title}</h2><p>위치: ${p.region} 내 예시 지점</p><dl class="summary-grid"><div><dt>상세 주소</dt><dd>운영 자료 확인 후 표시</dd></div><div><dt>운영시간</dt><dd>확인 필요</dd></div><div><dt>공식 출처</dt><dd>확인 필요</dd></div><div><dt>마지막 확인일</dt><dd>미등록</dd></div></dl><p>${p.guide}</p><div class="actions"><a class="btn small" href="https://map.kakao.com/?q=${encodeURIComponent(p.region + " " + p.category)}" target="_blank" rel="noopener">카카오맵에서 검색·길찾기 ↗</a>${saveButton("place", p.id, p.title, "#/place/" + p.id)}<a class="textlink" href="#/report/place/${p.id}">정보 수정 제안</a><a class="textlink" href="#/notification-settings">변경 알림 설정</a></div>` : emptyState("이 조건의 시설이 없어요.", "지역 또는 분류를 바꿔보세요.")}</div></div><section class="section"><h2>이 장소 주변의 생활 공지</h2><div class="notice">현재 확인된 유효한 공지가 없어요. 적용 구역·기간·변경 전후·출처가 확인된 공지만 안내합니다.</div><h3>지도에서 찾은 장소</h3>${visible.map((p) => `<button class="listing" ${uiActionAttrs("click", "String_79", [p.id])}>${p.title} · ${p.category} →</button>`).join("")}<div class="actions"><a class="btn secondary" href="#/saved/place">저장한 장소 보기</a><a class="textlink" href="#/questions">동네 질문과 후기</a><a class="textlink" href="#/area/wait">희망 생활권을 방 알림 조건에 추가 →</a></div></section></div>`;
  };

  /* 처리 단계 2: 기존 neighborhood-map.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function () {
    ensureMapRoute();
    const s = mapState(),
      visible = facilities.filter(
        (p) =>
          (!s.region || p.region === s.region) &&
          (s.category === "전체" || p.category === s.category) &&
          (!s.query || (p.title + p.category + p.region).includes(s.query)),
      ),
      p = visible.find((x) => x.id === s.selected),
      invalid =
        location.hash.startsWith("#/place/") &&
        !facilities.some((p) => p.id === decodeURIComponent(location.hash.split("/")[2] || ""));
    return `<div class="container neighborhood-page"><div class="actions map-back"><a class="textlink" href="#/activity">← 내 활동으로 돌아가기</a></div>${pageHead("NEIGHBORHOOD MAP", "우리 동네에 필요한 정보를 지도에서 찾아요.", `${esc(s.region || "옥천 전체")} / ${esc(s.category)}${p ? " / 마지막으로 본 장소: " + esc(p.title) : " / 장소를 선택해 생활 정보를 확인하세요."}`)}<div class="notice warning">현재 지도와 시설 위치는 도식입니다. 실제 카카오맵 연결 전이며, 운영시간·주소·공식 출처가 확인되지 않은 항목은 “확인 필요”로 안내합니다.</div>${invalid ? '<div class="notice warning" role="status">이 장소는 삭제되었거나 현재 표시할 수 없어요. 다른 장소를 찾아보세요.</div>' : ""}<div class="map-search-row"><label>읍·면<select aria-label="지도 지역" ${uiActionAttrs("change", "mapFilter_86", [])}><option value="">옥천 전체</option>${options(regions, s.region)}</select></label><form ${uiActionAttrs("submit", "mapSearch_87", [])} role="search"><input aria-label="장소 이름·분류 검색" name="query" placeholder="분리수거장·시설 이름·분류 검색" value="${esc(s.query)}"><button class="btn small" type="submit">검색</button></form></div><nav class="tabs map-categories" aria-label="시설 분류">${mapCategories.map((c) => `<button class="tab ${s.category === c ? "active" : ""}" aria-pressed="${s.category === c}" ${uiActionAttrs("click", "mapFilter_84", [c])}>${c}</button>`).join("")}</nav><div class="area-layout neighborhood-layout"><div class="map-panel neighborhood-map" id="neighborhood-map" tabindex="0" role="region" aria-label="생활권 도식 지도. 방향키로 이동하고 확대·축소 버튼을 이용하세요.">${mapWorld(s, visible)}<div class="map-tools"><button aria-label="지도 확대" ${uiActionAttrs("click", "mapZoom_88", [])} ${s.zoom >= 2.5 ? "disabled" : ""}>＋</button><button aria-label="지도 축소" ${uiActionAttrs("click", "mapZoom_89", [])} ${s.zoom <= 1 ? "disabled" : ""}>−</button><button class="map-reset" ${uiActionAttrs("click", "mapReset_90", [])}>위치 초기화</button></div><div class="map-pan" aria-label="지도 이동"><button aria-label="지도 위로 이동" ${uiActionAttrs("click", "mapPan_91", [])}>↑</button><span><button aria-label="지도 왼쪽 이동" ${uiActionAttrs("click", "mapPan_92", [])}>←</button><button aria-label="지도 아래로 이동" ${uiActionAttrs("click", "mapPan_93", [])}>↓</button><button aria-label="지도 오른쪽 이동" ${uiActionAttrs("click", "mapPan_94", [])}>→</button></span></div><div class="map-note">도식 지도 · 확대 ${Math.round(s.zoom * 100)}% · 드래그로 이동</div></div><aside class="formbox place-detail" aria-label="선택한 장소 상세 정보" aria-live="polite">${p ? `<span class="badge">${esc(p.category)}</span><h2>${esc(p.title)}</h2><p class="micro">${esc(p.region)} 내 예시 지점</p><dl><dt>상세 주소</dt><dd>운영 자료 확인 후 표시</dd><dt>운영시간</dt><dd>${esc(placeMeta[p.id].hours)}</dd><dt>이용 안내</dt><dd>${esc(placeMeta[p.id].usage)}</dd><dt>출처와 최신 확인</dt><dd>공식 출처: 확인 필요<br>마지막 확인일: 미등록</dd></dl><div class="actions"><a class="btn small" href="https://map.kakao.com/?q=${encodeURIComponent(p.region + " " + p.category)}" target="_blank" rel="noopener">카카오맵 검색·길찾기 ↗</a>${saveButton("place", p.id, p.title, "#/place/" + p.id)}<a class="textlink" href="#/notification-settings">변경 알림 설정</a><a class="textlink" href="#/report/place/${p.id}">정보 수정 제안</a></div>` : emptyState(visible.length ? "장소를 선택해주세요." : "이 조건의 시설이 없어요.", visible.length ? "지도 표시나 아래 목록을 누르면 이용 안내를 볼 수 있어요." : "지역·분류·검색어를 바꿔보세요. 확인되지 않은 시설을 자동으로 추가하지 않아요.")}</aside></div><p class="micro map-legend">분 분리수거 · 교 교통 · 공 공공시설 | 마지막 지도 위치·확대·분류는 자동으로 보관됩니다.</p><section class="section"><h2>이 장소 주변의 생활 공지</h2><div class="notice">현재 확인된 유효한 공지가 없어요. 적용 구역·기간·변경 전후·공식 출처가 확인된 안내를 이곳에 표시합니다.</div><a class="textlink" href="#/notification-settings">이 지역 생활 알림 설정 →</a></section><section class="section"><div class="section-head"><h2>지도에서 찾은 장소</h2><span class="subtle">${visible.length}곳</span></div>${visible.map((x) => `<button class="map-place-row ${p?.id === x.id ? "current" : ""}" ${uiActionAttrs("click", "openMapPlace_85", [x.id])}><span><b>${esc(x.title)}${p?.id === x.id ? " · 선택됨" : ""}</b><small>${esc(placeMeta[x.id].summary)}</small></span><span class="textlink">지도에서 보기 →</span></button>`).join("") || emptyState("검색 결과가 없어요.", "지역·분류·검색어를 다시 선택해주세요.")}<div class="actions"><a class="btn secondary" href="#/saved/place">저장한 장소·정보 보기</a><a class="textlink" href="#/questions">동네 질문과 후기 보기 →</a></div></section></div>`;
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phBaseMapPage = implementation1;

  /* 처리 단계 3: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation2 = function () {
    let html = phBaseMapPage();
    if (phMapContext && location.hash.startsWith("#/place/"))
      html = html.replace(
        '<div class="container neighborhood-page">',
        `<div class="container neighborhood-page"><p class="notice"><a href="#/public/map/${phMapContext}" class="textlink">← ${esc(phProperty(phMapContext)?.name)} 주변 지도</a></p>`,
      );
    return html;
  };
  return implementation2(...args);
}

/* notificationsPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
/* notificationsPage: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function notificationsPage(...args) {
  /* 처리 단계 1: 기존 integrated.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function (filter = "전체") {
    for (const n of alerts) {
      pushNotice(
        "방·상담",
        n.snapshot.name + " · " + n.status,
        "#/alert/" + n.id,
        "room-" + n.id + "-" + n.status + "-" + (n.changes?.length || 0),
      );
    }
    const today = new Date().toLocaleDateString("sv-SE");
    for (const t of tasks) {
      const d = todoState[t.id];
      if (d?.remind && d.remindDate && d.remindDate <= today)
        pushNotice(
          "내 생활",
          t.title + " · 내가 정한 확인일이에요.",
          "#/task/" + t.id,
          "task-" + t.id + "-" + d.remindDate,
        );
    }
    const list = inbox.filter((n) => filter === "전체" || n.category === filter);
    /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("NOTIFICATIONS", "내게 필요한 소식만 모았어요.", "답변은 해당 질문으로, 공간 변경은 해당 정보로 바로 이어집니다.")}<div class="tabs">${["전체", "방·상담", "질문·답변", "내 생활"].map((t) => `<a class="tab ${filter === t ? "active" : ""}" href="#/notifications/${encodeURIComponent(t)}">${t}</a>`).join("")}</div><div class="activity-content">${list.length ? list.map((n) => `<article class="application"><span class="badge">${n.category} · ${n.read ? "읽음" : "새 소식"}</span><h3>${esc(n.title)}</h3>${n.body ? `<p class="user-copy">${esc(n.body)}</p>` : ""}<p class="micro">${labelDate(n.created)}</p><button class="${n.cta ? "btn small" : "textlink"}" ${uiActionAttrs("click", "openNotice_95", [n.id])}>${esc(n.cta || "내용 보기 →")}</button></article>`).join("") : emptyState("아직 도착한 알림이 없어요.")}<div class="actions"><a class="btn secondary" href="#/notification-settings">알림 종류·시간 설정</a><a class="textlink" href="#/saved">저장한 정보 보기</a></div><p class="micro">알림함은 현재 브라우저에서만 동작합니다. 날짜 알림은 알림함을 열 때 확인하며 외부 문자·이메일은 발송하지 않습니다.</p></div></div>`;
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phBaseNotifications = implementation0;

  /* 처리 단계 2: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function (filter = "전체") {
    phSyncNotices();
    const html = phBaseNotifications(filter);
    return html.replace(
      '<a class="tab ' +
        (filter === "내 생활" ? "active" : "") +
        '" href="#/notifications/' +
        encodeURIComponent("내 생활") +
        '">내 생활</a>',
      `<a class="tab ${filter === "내 생활" ? "active" : ""}" href="#/notifications/${encodeURIComponent("내 생활")}">내 생활</a><a class="tab ${filter === "공공주택" ? "active" : ""}" href="#/notifications/${encodeURIComponent("공공주택")}">공공주택</a>`,
    );
  };
  return implementation1(...args);
}

/* youthHousingNoticePage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function youthHousingNoticePage() {
  return `<div class="container">${pageHead("YOUTH HOUSING NOTICE", "[예시] 청년주택 입주자 모집 안내", "입력한 조건이 청약 신청 자격을 충족해요. 접수 일정과 준비할 내용을 확인하세요.")}<div class="activity-content"><article class="formbox"><span class="badge">청약 신청 자격 충족 · 입력 정보 기준</span><h2>11월 청년주택 청약을 준비해보세요.</h2><dl class="summary-grid"><div><dt>모집 유형</dt><dd>청년주택 입주자 모집</dd></div><div><dt>신청 기간</dt><dd>2026.11.02 ~ 2026.11.13</dd></div><div><dt>신청 대상</dt><dd>청년 · 무주택 가구</dd></div><div><dt>현재 단계</dt><dd>청약 접수 전 · 서류 준비</dd></div></dl><h3>내 조건과 비교한 결과</h3><ul><li>연령: 만 27세 · 모집 연령 기준 충족</li><li>주택 소유: 무주택 · 조건 충족</li><li>소득: 공고의 소득 기준 이하 · 조건 충족</li><li>자산: 공고의 자산 기준 이하 · 조건 충족</li></ul><p class="micro">신청 가능 안내이며 입주 선정이나 당첨을 뜻하지 않아요. 모집기관의 서류 확인과 최종 심사가 필요합니다.</p><h3>접수 전에 준비해요</h3><p>주민등록 관련 서류와 소득·자산 확인 자료를 준비하고, 공고의 제출 서류 목록과 발급 기준일을 확인해주세요.</p><div class="actions"><a class="btn" href="#/task/public">청약 준비할 일 확인</a><a class="textlink" href="#/notifications">← 알림함으로</a></div></article><p class="micro">화면 설명을 위한 공지입니다. 실제 모집 공고·자격 심사·청약 접수 시스템은 연결되지 않았습니다.</p></div></div>`;
}

/* openNotice — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function openNotice(id) {
  const n = inbox.find((n) => n.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!n) return;
  persistCollection(
    "inbox",
    inbox.map((x) => (x.id === id ? { ...x, read: true } : x)),
    (v) => (inbox = v),
  );
  location.hash = n.href;
}

/* notificationSettings — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
/* notificationSettings: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function notificationSettings(...args) {
  /* 처리 단계 1: 기존 integrated.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function () {
    const d = notificationPrefs;
    return formShell(
      "알림을 내 생활에 맞추세요.",
      "저장만 했을 때 자동으로 구독하지 않아요.",
      "notification-form",
      box(
        "01",
        "받을 알림",
        `<div class="fields">${[
          ["rooms", "조건에 맞는 방 소식"],
          ["consults", "진행 중인 상담·일정 변경"],
          ["answers", "내 질문의 새 답변"],
        ]
          .map(([k, t]) =>
            selectField(
              t,
              k,
              ["알림함만", "문자 (연동 전)", "이메일 (연동 전)"],
              d[k] || "알림함만",
            ),
          )
          .join("")}</div>` +
          checkField("localNews", "저장한 장소의 운영시간 변경·생활 공지 받기", d.localNews) +
          checkField("answerRequests", "내가 답할 수 있는 질문 요청 받기", d.answerRequests) +
          checkField("reminders", "내가 저장한 할 일 리마인더 받기", d.reminders),
      ) +
        box(
          "02",
          "빈도와 방해받지 않을 시간",
          `<div class="fields">${selectField("생활권 소식 요약", "digest", ["주 1회", "받지 않음"], d.digest)}${inputField("방해 금지 시작", "quietStart", d.quietStart, 'type="time"')}${inputField("방해 금지 종료", "quietEnd", d.quietEnd, 'type="time"')}</div><p class="micro">외부 발송 연동 전의 수신 설정입니다. 질문 요청 상한은 하루 1건·주 3건으로 관리하며 실제 요청은 보내지 않습니다.</p>`,
        ) +
        box(
          "03",
          "내 동네와 관심 정보",
          scopeFields(d.scope || neighborhood) +
            choice(
              "topics",
              ["통근", "주거비", "분리수거", "공공 지원", "시설 운영"],
              d.topics || [],
              true,
            ),
        ),
      "설정 저장",
    );
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phBaseNotificationSettings = implementation0;

  /* 처리 단계 2: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function () {
    return phBaseNotificationSettings().replace(
      '<form id="notification-form">',
      '<div class="notice"><a class="textlink" href="#/activity/public">공공주택 알림 3종의 관심 조건·일정·수신 방법 관리 →</a><p class="micro">일반 방 소식·생활 정보 알림과 별도로 선택합니다.</p></div><form id="notification-form">',
    );
  };
  return implementation1(...args);
}

/* notificationEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function notificationEvents() {
  const f = $("#notification-form");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = { ...getData(f), scope: getScope(f), topics: new FormData(f).getAll("topics") };
    if (save("notification-prefs", d)) {
      notificationPrefs = d;
      toast("알림 설정을 저장했어요. 실제 외부 발송은 연결 전입니다.");
      location.hash = "/notifications";
    }
  };
}

/* reportPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function reportPage(kind, id) {
  return formShell(
    "잘못된 정보나 불편한 내용을 알려주세요.",
    "정정 요청과 커뮤니티 신고를 구분하고 처리 상태를 기록해요.",
    "case-form",
    box(
      "01",
      "무엇을 확인할까요?",
      `<div class="fields">${selectField("대상 유형 *", "kind", ["공간 정보", "질문·답변", "후기", "사진·게시글", "동네 시설·공지", "기타"], { space: "공간 정보", question: "질문·답변", answer: "질문·답변", review: "후기", post: "사진·게시글", place: "동네 시설·공지" }[kind] || "기타", true)}${inputField("대상 식별 정보 *", "target", id || "", 'required maxlength="150"')}${selectField("사유 *", "reason", ["개인정보 노출", "광고·이해관계 미표시", "사실 확인 필요", "괴롭힘·비방", "이미 마감된 공간", "기타"], "", true)}</div>`,
    ) +
      box(
        "02",
        "확인할 내용",
        textArea("설명 (선택)", "body") +
          photoField() +
          (["question", "answer", "review", "post"].includes(kind)
            ? checkField("block", "이 사용자의 글 숨기기")
            : "") +
          '<p class="micro">신고자 정보는 상대방에게 공개하지 않아요. 신고만으로 위반이 확정되지 않습니다.</p>',
      ),
    "수정·신고 접수",
  );
}

/* caseEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function caseEvents(kind, id) {
  const f = $("#case-form");
  wirePhotos(f);
  f.onsubmit = (e) => {
    e.preventDefault();
    if (f._loading) return errorForm(f, "첨부 사진을 준비하고 있어요.");
    const d = getData(f);
    const c = {
      ...d,
      id: nid("CASE"),
      targetKind: kind,
      status: "접수",
      photos: f._photos,
      created: stamp(),
      history: [],
      appeals: [],
    };
    if (persistCollection("cases", [c, ...cases], (v) => (cases = v))) {
      if (d.block) {
        const author =
          kind === "question"
            ? questions.find((x) => x.id === id)?.author
            : kind === "review"
              ? experiences.find((x) => x.id === id)?.author
              : kind === "post"
                ? allPosts().find((x) => x.id === id)?.author
                : questions.flatMap((q) => q.answers).find((x) => x.id === id)?.author;
        if (author && !blockedAuthors.includes(author))
          persistCollection(
            "blocked-authors",
            [...blockedAuthors, author],
            (v) => (blockedAuthors = v),
          );
      }
      pushNotice("내 생활", "신고·정정 요청을 접수했어요.", "#/reports/" + c.id);
      save("form-draft-case-form-" + kind + "-" + id, {});
      location.hash = "/reports/" + c.id;
    }
  };
}

/* casesPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function casesPage(id) {
  const list = id ? cases.filter((x) => x.id === id) : cases;
  return `<div class="container">${pageHead("CORRECTIONS & REPORTS", "신고·정정 처리 내역", "접수 → 검토 중 → 추가 자료 요청 → 처리 완료. 모든 기록은 현재 브라우저의 체험입니다.")}<div class="activity-content">${list.map((c) => `<article class="formbox"><span class="badge">${esc(c.status)}</span><h3>${esc(c.kind)} · ${esc(c.reason)}</h3><p class="micro">${esc(c.id)} · 대상 ${esc(c.target)}</p><p class="user-copy">${esc(c.body)}</p><h3>처리 결과</h3><p class="user-copy">${esc(c.result || "아직 처리 결과가 없어요.")}</p>${(c.appeals || []).map((a) => `<p class="notice">재검토 요청: ${esc(a.text)}</p>`).join("")}<button class="btn secondary small" ${uiActionAttrs("click", "appealCase_96", [c.id])}>이의제기·재검토 요청</button></article>`).join("") || emptyState("접수한 요청이 없어요.")}<a class="textlink" href="#/life">내 생활로 →</a></div></div>`;
}

/* appealCase — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function appealCase(id) {
  modal(
    '<h2>재검토할 내용을 알려주세요</h2><form id="appeal-form">' +
      textArea("재검토 요청 *", "body", "", true) +
      '<button class="btn">재검토 요청</button></form>',
  );
  $("#appeal-form").onsubmit = (e) => {
    e.preventDefault();
    const text = e.target.elements.body.value.trim();
    if (!text) return;
    persistCollection(
      "cases",
      cases.map((c) =>
        c.id === id
          ? { ...c, status: "이의제기", appeals: [...c.appeals, { text, time: stamp() }] }
          : c,
      ),
      (v) => (cases = v),
    );
    closeModal();
    render(false);
  };
}

/* verificationPage — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function verificationPage() {
  return `<div class="container">${pageHead("TRUST & PRIVACY", "확인한 사실만 배지로 보여요.", "실명 공개 없이 경험의 근거를 알려줄 수 있어요. 직접 입력과 실제 확인은 구분합니다.")}<div class="activity-content">${["연락처 확인", "생활권 활동 확인", "현재·과거 거주 경험", "중개사·사업자 역할"].map((t) => `<div class="application"><span class="badge">미확인 · 실제 인증 연동 전</span><h3>${t}</h3><p>확인한 범위만 표시하며 글의 정확성이나 공간 안전을 보증하지 않아요.</p></div>`).join("")}<div class="notice">현재 사이트는 실제 인증을 수행하지 않습니다. 확인 방법·수집 항목·보유 기간이 확정되기 전에는 증빙 원본을 받지 않아요.</div><form id="identity-form" class="formbox"><h2>확인 절차 안내 요청 · 체험</h2>${selectField("안내받을 범위 *", "kind", ["생활권 활동 확인", "현재·과거 거주 경험", "중개사·사업자 역할"], "", true)}${textArea("담당자에게 남길 내용 (선택)", "body")}${checkField("consent", "체험 요청 내용이 현재 브라우저에 보관되는 것에 동의합니다.", false, true)}<button class="btn">확인 방법 안내 요청</button></form>${checks.map((x) => `<div class="notice">${esc(x.kind)} · ${esc(x.status)}${x.result ? "<br>" + esc(x.result) : ""}</div>`).join("")}<a class="textlink" href="#/review-write">인증 없이 일반 경험 작성 →</a></div></div>`;
}

/* identityEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function identityEvents() {
  const f = $("#identity-form");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = {
      ...getData(f),
      id: nid("VERIFY"),
      status: "안내 요청 · 검토 대기",
      created: stamp(),
    };
    if (persistCollection("identity-checks", [d, ...checks], (v) => (checks = v))) {
      save("form-draft-identity-form", {});
      render(false);
    }
  };
}

/* communityAdmin — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function communityAdmin() {
  return `<div class="container">${pageHead("OPERATIONS DEMO", "질문과 신고를 놓치지 않도록", "일반 메뉴에 없는 브라우저 내 운영 시뮬레이션입니다. 실제 권한·발송·인증은 연결되지 않았습니다.")}<a class="textlink" href="#/admin">방 등록 운영 →</a><section class="section"><h2>답변 대기·도움 요청</h2>${
    questions
      .filter((q) => !q.answers.length || q.helpRequested)
      .map(
        (q) =>
          `<div class="application"><h3>${esc(q.title)}</h3><p>${esc(scopeLabel(q.scope))} · ${esc(q.status)}</p><a class="btn secondary small" href="#/question/${q.id}">내용 확인·답변</a><button class="textlink" ${uiActionAttrs("click", "assignQuestion_97", [q.id])}>답변 요청 검토</button></div>`,
      )
      .join("") || emptyState("답변 대기 질문이 없습니다.")
  }</section><section class="section"><h2>신고 검토</h2>${cases.map((c) => `<div class="application"><h3>${esc(c.reason)}</h3><p>${esc(c.target)} · ${esc(c.status)}</p><button class="btn secondary small" ${uiActionAttrs("click", "processCase_98", [c.id])}>사유·처리 기록</button></div>`).join("") || emptyState("접수된 신고가 없습니다.")}</section><section class="section"><h2>인증 안내 요청</h2>${checks.map((c) => `<div class="application"><h3>${esc(c.kind)}</h3><p>${esc(c.status)}</p><p>${esc(c.body)}</p><p class="micro">실제 검증 절차 연결 전으로 확인 완료 배지를 부여할 수 없습니다.</p></div>`).join("") || emptyState("인증 안내 요청이 없습니다.")}</section></div>`;
}

/* assignQuestion — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function assignQuestion(id) {
  modal(
    '<h2>답변 요청 검토</h2><p>현재는 다른 사용자의 수신 동의·경험·횟수를 확인할 서버가 없어 외부 이웃에게 배정하지 않습니다.</p><div class="notice">운영 담당자가 직접 확인하는 대기로 기록할 수 있어요. 응답 시간을 보장하지 않습니다.</div><button class="btn" id="assign-question">운영 담당자 확인 대기로 저장</button>',
  );
  $("#assign-question").onclick = () => {
    persistCollection(
      "questions",
      questions.map((q) =>
        q.id === id ? { ...q, status: "운영 담당자 확인 대기", helpRequested: true } : q,
      ),
      (v) => (questions = v),
    );
    closeModal();
    render(false);
  };
}

/* processCase — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function processCase(id) {
  modal(
    '<h2>처리 결과 기록</h2><form id="case-process">' +
      selectField(
        "사건 상태",
        "status",
        ["검토 중", "추가 자료 요청", "처리 완료", "이의제기"],
        "검토 중",
      ) +
      selectField("조치", "action", ["기록만", "대상 숨김", "대상 복구"], "기록만") +
      inputField("처리자 *", "actor", "", "required") +
      textArea("적용 규칙·근거·처리 범위·재검토 방법 *", "result", "", true) +
      '<button class="btn">결과 저장·알림함 안내</button></form>',
  );
  $("#case-process").onsubmit = (e) => {
    e.preventDefault();
    const d = getData(e.target),
      c = cases.find((c) => c.id === id);
    if (d.action !== "기록만") {
      const hidden = d.action === "대상 숨김";
      if (c.targetKind === "question")
        persistCollection(
          "questions",
          questions.map((q) => (q.id === c.target ? { ...q, hidden } : q)),
          (v) => (questions = v),
        );
      if (c.targetKind === "review")
        persistCollection(
          "experiences",
          experiences.map((q) => (q.id === c.target ? { ...q, hidden } : q)),
          (v) => (experiences = v),
        );
      if (c.targetKind === "answer")
        persistCollection(
          "questions",
          questions.map((q) => ({
            ...q,
            answers: q.answers.map((a) => (a.id === c.target ? { ...a, hidden } : a)),
          })),
          (v) => (questions = v),
        );
      if (c.targetKind === "post") mutatePost(c.target, (p) => (p.hidden = hidden));
    }
    if (
      persistCollection(
        "cases",
        cases.map((x) =>
          x.id === id ? { ...x, ...d, history: [...x.history, { ...d, time: stamp() }] } : x,
        ),
        (v) => (cases = v),
      )
    ) {
      pushNotice("내 생활", "신고·정정 처리 결과를 확인해주세요.", "#/reports/" + id);
      closeModal();
      render(false);
    }
  };
}

/* previousAdminIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousAdminIntegrated = adminPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
adminPage = function () {
  return previousAdminIntegrated()
    .replace(
      '<div class="grid3">',
      '<div class="actions section"><a class="btn secondary" href="#/community-admin">질문·신고·인증 요청 운영 →</a></div><div class="grid3">',
    )
    .replaceAll("제보 확인", "등록 유형별 확인")
    .replaceAll("방 정보 제보", "방 등록")
    .replace("권한 인증이 없는 로컬", "권한 인증이 없는 로컬");
};

/* previousActivityTabsIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousActivityTabsIntegrated = activityTabs;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
activityTabs = function (tab) {
  return previousActivityTabsIntegrated(tab).replace("내 제보", "내 방 등록");
};

/* previousActivityIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousActivityIntegrated = activityPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
activityPage = function (tab) {
  return previousActivityIntegrated(tab)
    .replace("아직 남긴 방 정보가 없어요.", "아직 등록한 방이 없어요.")
    .replace("곧 비는 방 알려주기", "방 등록하기")
    .replace("비공개 방 정보", "방 등록 정보");
};

/* previousAboutIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousAboutIntegrated = aboutPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
aboutPage = function () {
  return previousAboutIntegrated()
    .replace(
      "곧 비는 방의 소식은 일반 공개 목록에 바로 나타나지 않을 수 있어요.",
      "중개사 매물과 현재 거주자의 공동거주 모집을 각각 확인해요.",
    )
    .replace(
      "제보자의 연락처와 허용한 연락 범위를 확인해요.",
      "중개사무소·담당자 또는 현재 거주자·모집 동의를 확인해요.",
    )
    .replace("제보 접수", "방 등록 접수");
};

/* previousWriteIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousWriteIntegrated = writePage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
writePage = function (id) {
  const p = posts.find((x) => x.id === id),
    d = p || read("form-draft-post-form" + (id ? "-" + id : ""), {});
  return previousWriteIntegrated(id).replace(
    '<form id="post-form" class="formbox">',
    '<form id="post-form" class="formbox">' +
      box(
        "01",
        "게시할 동네",
        scopeFields(p?.scope || d._scope || neighborhood) +
          selectField(
            "이 동네와 나의 관계 *",
            "relation",
            ["거주", "근무", "입주 예정"],
            d.relation,
            true,
          ),
      ) +
      '<a class="textlink" href="#/ask">답이 필요한 질문인가요? 사진 없이 질문 작성하기 →</a>',
  );
};

/* previousWriteEventsIntegrated — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const previousWriteEventsIntegrated = writeEvents;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
writeEvents = function (id) {
  previousWriteEventsIntegrated(id);
  const f = $("#post-form"),
    submit = f.onsubmit;
  f.onsubmit = (e) => {
    const d = getData(f);
    if (publicGuard(d.title + " " + d.body)) {
      e.preventDefault();
      toast("연락처·동호수로 보이는 내용을 가린 뒤 게시해주세요.");
      return;
    }
    submit(e);
  };
};

/* draftKey — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
/* draftKey: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function draftKey(...args) {
  /* 처리 단계 1: 기존 integrated.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function (f) {
    const [route, id, sub] = location.hash.replace(/^#\/?/, "").split("/");
    /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
      ["consultation", "alert", "home"].includes(route)
    ) {
      const n = route === "alert" ? alerts.find((n) => n.id === id) : null;
      return (
        "form-draft-" +
        f.id +
        "-" +
        (n ? n.listingId + "-" + n.waitId : id + "-" + (sub || "direct"))
      );
    }
    /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (route === "wait")
      return "form-draft-" + f.id + "-" + (id || "1");
    /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return (
      "form-draft-" +
      f.id +
      (["task", "question", "report", "write"].includes(route) && id
        ? "-" + id + (route === "report" && sub ? "-" + sub : "")
        : "")
    );
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phBaseDraftKey = implementation0;

  /* 처리 단계 2: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function (f) {
    if (f.id === "public-subscription-form")
      return "form-draft-" + f.id + "-" + location.hash.replace(/^#\/?/, "");
    if ((f.id || "").startsWith("public-record-") || (f.id || "").startsWith("public-admin-"))
      return "form-draft-" + f.id;
    return phBaseDraftKey(f);
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const vacancyOldDraftKey = implementation1;

  /* 처리 단계 3: 기존 vacancy.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation2 = function (f) {
    return f.id === "vacancy-form"
      ? "form-draft-vacancy-form-" +
          (location.hash.startsWith("#/vacancy/edit/") ? location.hash.split("/")[3] : "new")
      : vacancyOldDraftKey(f);
  };
  return implementation2(...args);
}

/* persistDraft — 작성 중인 입력값을 브라우저 저장소에 임시 저장합니다. */
function persistDraft(f) {
  const data = getData(f);
  for (const k of Object.keys(data)) if (/Code$|password/i.test(k)) delete data[k];
  f.querySelectorAll("input[type=checkbox]").forEach((el) => {
    if (f.querySelectorAll(`[name="${el.name}"]`).length > 1)
      data[el.name] = new FormData(f).getAll(el.name);
  });
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (f._photos)
    data._photos = f._photos;
  if (f.elements.scopeRegion) data._scope = getScope(f);
  data._savedAt = stamp();
  if (save(draftKey(f), data)) toast("임시 저장했어요. 이 브라우저에서 이어 쓸 수 있습니다.");
}

/* restoreDraft — 이전에 임시 저장한 입력값을 양식에 복원합니다. */
function restoreDraft(f, d) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !d ||
    !Object.keys(d).length
  )
    return;
  for (const [k, v] of Object.entries(d)) {
    if (k.startsWith("_") || k.endsWith("Code")) continue;
    const nodes = f.querySelectorAll(`[name="${k}"]`);
    nodes.forEach((el) => {
      if (el.type === "file") return;
      if (["checkbox", "radio"].includes(el.type))
        el.checked = Array.isArray(v)
          ? v.includes(el.value)
          : el.type === "radio"
            ? el.value === v
            : !!v;
      else el.value = v;
    });
    if (k === "scopeRegion" && f.elements.scopeRegion) syncVillage(f.elements.scopeRegion);
  }
  f.querySelectorAll("input[type=checkbox][name$=Unknown]").forEach((el) => {
    const input = f.elements[el.name.slice(0, -7)];
    if (input) {
      input.disabled = el.checked;
      input.required = !el.checked;
    }
  });
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (f.elements.basis)
    f.elements.source.required = f.elements.basis.value === "공식 자료";
  if (f.id === "registration-resident") f.elements.meal.required = f.elements.type.value === "하숙";
}

/* attachDrafts — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function attachDrafts() {
  const forms = $$("#main form").filter((f) => f.id && !(typeof intakeFormKinds !== "undefined" && intakeFormKinds[f.id]) && f.id !== "auth-form" && !f.hasAttribute?.("data-no-draft") && !["scope-form"].includes(f.id));
  for (const f of forms) {
    if (f.querySelector(".draft-row")) continue;
    const d = read(draftKey(f), {});
    restoreDraft(f, d);
    if (f.id !== "post-form" && f._photos && d._photos) {
      f._photos = d._photos;
      const preview = f.querySelector(".upload-preview");
      if (f._drawPhotos) f._drawPhotos();
      else if (preview)
        setHTML(preview, f._photos
          .map((s) => `<img src="${esc(s)}" alt="임시 저장한 사진">`)
          .join(""));
    }
    const row = document.createElement("div");
    row.className = "draft-row";
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn secondary small';
    // 보안: 안내 문구는 텍스트로, 동작은 함수로 연결합니다.
    saveButton.textContent = '임시 저장';
    saveButton.addEventListener('click', () => persistDraft(f));
    const message = document.createElement('span');
    message.className = 'micro';
    message.textContent = '현재 브라우저에서 이어 쓸 수 있어요.';
    row.append(saveButton, message);
    f.append(row);
    const submit = f.onsubmit;
    if (submit)
      f.onsubmit = (e) => {
        const before = location.hash,
          key = draftKey(f);
        submit(e);
        if (location.hash !== before && !location.hash.endsWith("/wait/2")) {
          save(key, {});
          if (f.id === "wait-form") {
            save("form-draft-wait-form-1", {});
            save("form-draft-wait-form-2", {});
          }
        }
      };
  }
}

/* integratedBaseRender — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
reportPost = function (id) {
  location.hash = "/report/post/" + id;
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
