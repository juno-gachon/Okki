/*
 * 파일: router.js
 * 역할: URL 해시를 해석하고 각 기능의 화면과 이벤트를 연결하는 단일 진입점입니다.
 * 구성: 공공주택·퇴거 정보·통합 생활 화면을 먼저 판별하고, 나머지는 기본 화면에서 처리합니다.
 * 다른 스크립트에서 render를 교체하지 않습니다. 새 화면은 해당 분기에 경로와 이벤트를 추가합니다.
 * 스크립트 로딩: 화면과 이벤트 함수가 준비된 뒤 이 파일을 마지막으로 불러옵니다.
 */

/* 화면 갱신 후 초점을 옮깁니다. 필터 변경 등은 scroll=false로 현재 위치를 유지합니다. */
function focusRenderedPage(scroll) {
  if (scroll) {
    window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
  }
}

/* 기본 주거·대기 신청·커뮤니티 경로와 해당 화면의 이벤트를 한곳에서 연결합니다. */
function renderCoreRoute(route, id, postId, scroll) {
  let targetPost = null;
  if (route === "community") {
    targetPost = allPosts().find((p) => encodeURIComponent(p.id) === postId);
    communityTab = targetPost?.category || (id ? communityCategory(id) : "일상");
    if (communityTab === "전체") communityTab = "일상";
    const index = allPosts()
      .filter((p) => p.category === communityTab)
      .findIndex((p) => p.id === targetPost?.id);
    feedLimit = Math.max(scroll ? 5 : feedLimit, index + 1);
  }
  nav(route);
  const routes = {
    "": home,
    login: () => authPage(),
    signup: () => authPage(true),
    account: () => accountPage(),
    wait: () => waitPage(id),
    "wait-complete": () => waitComplete(id),
    request: () => waitPage("1"),
    homes: () => areaPage(),
    area: () => areaPage(id),
    activity: () => activityPage(id),
    applications: () => activityPage("consultations"),
    provide: () => providePage(id),
    tip: () => tipDetail(id),
    complete: () => tipDetail(id),
    alert: () => alertPage(id),
    home: () => consultationPage(id, postId),
    consultation: () => consultationPage(id, postId),
    "consultation-detail": () => consultationDetailPage(id),
    result: () => activityPage("alerts"),
    tasks: tasksPage,
    task: () => taskDetail(id),
    community: communityPage,
    write: () => writePage(id),
    about: aboutPage,
    admin: adminPage,
  };
  setHTML($("#main"), (routes[route] || notFound)());
  document.title =
    ({
      "": "옥천에서의 첫 집, 첫 이웃",
      login: "로그인",
      signup: "회원가입",
      account: "내 계정",
      wait: "방 알림 등록",
      activity: "내 활동",
      provide: "방 정보 알려주기",
      tasks: "첫 1년 할 일",
      community: "옥천 이야기",
      area: "생활권 지도",
      admin: "운영 흐름 체험",
    }[route] || "옥키") + " | 옥키";
  if (route === "wait" || route === "request") waitEvents(route === "request" ? "1" : id);
  if (route === "provide") provideEvents(id);
  if (route === "login" || route === "signup") authEvents(route === "signup");
  if (route === "account") accountEvents();
  if (route === "tasks") tasksEvents();
  if (route === "task") taskEvents(id);
  if (["consultation", "home"].includes(route)) consultationEvents(id, postId);
  if (route === "alert") {
    const n = alerts.find((x) => x.id === id);
    if (n) consultationEvents(n.listingId, n.waitId);
  }
  if (route === "write") writeEvents(id);
  focusRenderedPage(scroll);
  if (scroll && targetPost)
    document.getElementById("post-" + targetPost.id)?.scrollIntoView({ block: "start" });
}

/* 동네 질문·후기·생활·알림 화면을 처리하고, 해당되지 않으면 false를 반환합니다. */
function renderLifeRoute(route, id, sub, scroll) {
  if (typeof questionList !== "function") return false;
  const routes = {
    questions: questionList,
    ask: askPage,
    question: () => questionDetail(id),
    reviews: reviewsPage,
    "review-write": reviewWrite,
    review: () => {
      const x = experiences.find((x) => x.id === id && !x.hidden);
      return x
        ? `<div class="container">${pageHead("LIVING EXPERIENCE", "이웃이 나눈 생활 경험")}${reviewCard(x)}<a class="textlink" href="#/reviews">후기 목록으로 →</a></div>`
        : unavailable();
    },
    life: lifePage,
    settle: () => settlePage(id),
    saved: () => savedPage(id),
    notifications: () => notificationsPage(id ? decodeURIComponent(id) : "전체"),
    notice: () => (id === "youth-housing" ? youthHousingNoticePage() : unavailable()),
    "notification-settings": notificationSettings,
    verification: verificationPage,
    report: () => reportPage(id, sub),
    reports: () => casesPage(id),
    "community-admin": communityAdmin,
    place: () => {
      selectedPlace = id;
      return mapPage();
    },
  };
  if (route === "area" && id !== "wait") routes.area = mapPage;
  if (!routes[route]) return false;
  nav(route);
  setHTML($("#main"), routes[route]());
  document.title =
    "옥키 | " +
    ({
      "life": "내 생활",
      "notifications": "알림함",
      "questions": "동네 질문",
      "reviews": "살아본 후기",
      "area": "우리 동네 지도",
    }[route] || "옥천의 첫 생활");
  focusRenderedPage(scroll);
  if (route === "ask") askEvents();
  if (route === "question") {
    answerEvents(id);
    if (sub) document.getElementById("answer-" + sub)?.scrollIntoView({ block: "start" });
  }
  if (route === "review-write") reviewEvents();
  if (route === "settle") settleEvents(id);
  if (route === "notification-settings") notificationEvents();
  if (route === "report") caseEvents(id, sub);
  if (route === "verification") identityEvents();
  return true;
}

/* 공공주택 경로는 목록·공고·구독·관리 화면과 관련 이벤트를 같은 구간에 둡니다. */
function renderPublicRoute(route, page, id, group, edit, last, scroll) {
  if (typeof phHome !== "function") return false;
  let fn = null;
  if (route === "public") {
    if (!page) fn = phHome;
    else if (page === "list") fn = () => phList(id);
    else if (page === "property") fn = () => phPropertyPage(id);
    else if (page === "notice") fn = () => phNoticePage(id, group);
    else if (page === "subscribe")
      fn = () => phSubscribePage(id, group === "-" ? "" : group, edit === "-" ? "" : edit, last);
    else if (page === "complete") fn = () => phComplete(id);
    else if (page === "map") fn = () => phMapPage(id);
    else fn = unavailable;
  } else if (route === "activity" && page === "public") fn = () => phActivity(id);
  else if (route === "public-admin") fn = phAdmin;
  if (!fn) return false;
  nav(route);
  setHTML($("#main"), fn());
  document.title = "공공주택 | 옥키";
  focusRenderedPage(scroll);
  if (route === "public" && page === "list") phListEvents();
  if (route === "public" && page === "subscribe")
    phSubscribeEvents(id, group === "-" ? "" : group, edit === "-" ? "" : edit, last);
  if (route === "public" && page === "notice" && phNotice(id) && !phState.seen.includes(id))
    phCommit((s) => s.seen.unshift(id));
  if (page === "map") mapEvents();
  attachDrafts();
  if ($("#public-subscription-form")?._phSync) $("#public-subscription-form")._phSync();
  return true;
}

/* 퇴거 제보 수정·상세 화면을 그립니다. 등록 선택 화면은 기본 제공 경로가 담당합니다. */
function renderVacancyRoute(route, page, id, scroll) {
  if (route !== "vacancy" || typeof vacancyForm !== "function") return false;
  nav("provide");
  setHTML($("#main"), page === "edit" ? vacancyForm(id) : vacancyDetail(id));
  document.title = "퇴거 예정 정보 | 옥키";
  if (page === "edit") vacancyEvents(id);
  if (typeof intakeFormEvents === "function") intakeFormEvents();
  attachDrafts();
  $("#vacancy-form")?._vacancySync?.();
  focusRenderedPage(scroll);
  return true;
}

/* 전체 라우팅 순서와 공통 후처리: 각 경로가 한 번만 선택되도록 우선순위를 고정합니다. */
function render(scroll = true) {
  const [route = "", id = "", sub = "", group = "", edit = "", last = ""] = location.hash
    .replace(/^#\/?/, "")
    .split("/");
  if (["admin","public-admin","community-admin"].includes(route)) { location.replace("/admin"); return; }
  if (typeof intakeEdit !== "undefined" && !["wait","request"].includes(route) && !(route === "provide" && ["broker","resident","vacancy"].includes(id))) intakeEdit=null;
  if (renderVacancyRoute(route, id, sub, scroll)) return;
  if (
    typeof phHome === "function" &&
    (!["public", "place"].includes(route) || (route === "public" && id !== "map"))
  )
    phMapContext = null;
  if (renderPublicRoute(route, id, sub, group, edit, last, scroll)) return;
  if (typeof mapEvents === "function" && !["place", "area"].includes(route)) activeMapRoute = null;
  if (typeof questionList === "function" && route === "community" && sub) {
    const post = allPosts().find((p) => encodeURIComponent(p.id) === sub);
    if (post?.scope && post.category === "동네 정보") {
      neighborhood = post.scope;
      save("neighborhood", neighborhood);
    }
  }
  if (!renderLifeRoute(route, id, sub, scroll)) renderCoreRoute(route, id, sub, scroll);
  if (typeof scopeEvents === "function") {
    if (route === "provide") document.title = "방 등록하기 | 옥키";
    scopeEvents();
    attachDrafts();
  }
  if (typeof mapEvents === "function" && ["place", "area"].includes(route)) mapEvents();
  if (route === "provide" && id === "vacancy") $("#vacancy-form")?._vacancySync?.();
  if (typeof intakeFormEvents === "function") intakeFormEvents();
  if (route === "account" && typeof intakeAccountRecords === "function") intakeAccountRecords();
  if (typeof updateAuthNavigation === "function") updateAuthNavigation();
}

/* 전체 기능 파일을 불러온 브라우저에서 첫 화면을 표시합니다. */
if (typeof vacancyForm === "function") render();
if (typeof authStart === "function") authStart();
