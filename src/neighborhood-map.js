/*
 * 파일: neighborhood-map.js
 * 역할: 생활권 지도의 필터, 검색, 확대·축소, 선택 장소와 최근 본 장소를 관리하고 지도 화면에 필요한 이벤트를 연결합니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";
// Map view state and opened places are separate from saved places and subscriptions.

/* mapCategories — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const mapCategories = ["전체", "분리수거·폐기물", "교통", "공공시설", "건강·의료", "생활 공지"];

/* placeMeta — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const placeMeta = {
  recycle: {
    short: "분",
    summary: "배출 시간·허용 품목 확인",
    hours: "확인 필요",
    usage:
      "종이·캔·유리병·플라스틱의 분리 방법과 배출 시간을 확인하세요. 대형폐기물은 별도 신청 안내를 확인해주세요.",
  },
  bus: {
    short: "교",
    summary: "노선·첫차·막차 안내",
    hours: "노선별 공식 안내 확인 필요",
    usage: "이용 날짜의 평일·휴일 시간표와 마지막 운행 시간을 확인해주세요.",
  },
  office: {
    short: "공",
    summary: "민원 운영시간·이용 안내",
    hours: "확인 필요",
    usage: "방문할 민원의 담당 창구와 준비 서류를 확인해주세요.",
  },
};

/* mapView, recentPlaces, activeMapRoute, mapRouteInitialized — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let mapView = read("map-view", null),
  recentPlaces = read("recent-places", []),
  activeMapRoute = null,
  mapRouteInitialized = false;

/* 현재 실행 환경이나 저장된 상태를 확인한 뒤 필요한 초기 처리를 수행합니다. */
if (!Array.isArray(recentPlaces)) recentPlaces = [];

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
recentPlaces = recentPlaces
  .filter(
    (x, i, a) =>
      x && facilities.some((p) => p.id === x.id) && a.findIndex((y) => y?.id === x.id) === i,
  )
  .slice(0, 3);

/* 현재 실행 환경이나 저장된 상태를 확인한 뒤 필요한 초기 처리를 수행합니다. */
if (
  !mapView ||
  typeof mapView !== "object" ||
  !mapCategories.includes(mapView.category) ||
  !Number.isFinite(mapView.center?.x) ||
  !Number.isFinite(mapView.center?.y) ||
  !Number.isFinite(mapView.zoom)
)
  mapView = null;

/* mapClamp — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const mapClamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* mapInterest — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function mapInterest() {
  const manual = read("map-interest", null);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    manual &&
    typeof manual.region === "string"
  )
    return manual.region;
  const wait = applications.find(
    (a) => a.kind === "waiting" && !["삭제", "집 구함"].includes(a.status),
  );
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return (
    neighborhood.region || wait?.data?.regions?.[0] || wait?.data?.region || ""
  );
}

/* mapDefault — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function mapDefault() {
  return {
    region: mapInterest(),
    center: { x: 50, y: 50 },
    zoom: 1,
    category: "전체",
    query: "",
    selected: null,
    updated: null,
  };
}

/* mapState — 저장된 지도 설정을 읽어 현재 지도에서 사용할 상태를 준비합니다. */
function mapState() {
  return mapView || mapDefault();
}

/* storeMap — 변경된 입력값 또는 상태를 브라우저 저장소에 반영합니다. */
function storeMap(patch) {
  const next = { ...mapState(), ...patch, updated: stamp() };
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !save("map-view", next)
  )
    return false;
  mapView = next;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return true;
}

/* rememberPlace — 열어 본 장소를 최근 목록에 기록하고 표시 개수를 제한합니다. */
function rememberPlace(id) {
  const next = [{ id, viewedAt: stamp() }, ...recentPlaces.filter((x) => x.id !== id)].slice(0, 3);
  if (save("recent-places", next)) recentPlaces = next;
}

/* selectMapPlace — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function selectMapPlace(id, redraw = true) {
  const p = facilities.find((x) => x.id === id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!p) return false;
  const state = mapState(),
    patch = { region: p.region, selected: p.id, query: "", center: { x: p.x, y: p.y } };
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    state.category !== "전체" &&
    state.category !== p.category
  )
    patch.category = p.category;
  if (!storeMap(patch)) return false;
  rememberPlace(id);
  if (redraw) render(false);
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return true;
}

/* openMapPlace — 선택한 대상의 이동 경로나 열기 동작을 처리합니다. */
function openMapPlace(id) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !facilities.some((x) => x.id === id)
  )
    return;
  const hash = "#/place/" + encodeURIComponent(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    location.hash === hash
  ) {
    selectMapPlace(id);
    return;
  }
  location.hash = hash;
}

/* ensureMapRoute — 선택한 대상의 이동 경로나 열기 동작을 처리합니다. */
function ensureMapRoute() {
  const hash = location.hash;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    activeMapRoute === hash
  )
    return;
  activeMapRoute = hash;
  const [route, id] = hash.replace(/^#\/?/, "").split("/");
  if (route === "place") {
    const placeId = decodeURIComponent(id || "");
    if (!facilities.some((p) => p.id === placeId)) storeMap({ selected: null });
    else if (mapRouteInitialized || mapView?.selected !== placeId) selectMapPlace(placeId, false);
  } else if (route === "area" && id !== "wait" && !mapView) storeMap({});
  mapRouteInitialized = true;
}

/* mapFilter — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
/* mapFilter: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function mapFilter(...args) {
  /* 처리 단계 1: 기존 neighborhood-map.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function (key, value) {
    const patch = { [key]: value, selected: null };
    /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (key === "region")
      patch.center = { x: 50, y: 50 };
    /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (storeMap(patch)) {
      history.replaceState(null, "", "#/area");
      activeMapRoute = "#/area";
      render(false);
    }
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phOriginalMapFilter = implementation0;

  /* 처리 단계 2: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function (key, value) {
    if (phMapContext && location.hash.startsWith("#/public/map/")) {
      const patch = { [key]: value, selected: null };
      if (storeMap(patch)) render(false);
    } else phOriginalMapFilter(key, value);
  };
  return implementation1(...args);
}

/* mapSearch — 선택한 조건에 맞는 항목을 찾거나 목록을 좁힙니다. */
function mapSearch(event) {
  event.preventDefault();
  mapFilter("query", event.target.elements.query.value.trim());
}

/* mapZoom — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function mapZoom(delta) {
  if (storeMap({ zoom: mapClamp(mapState().zoom + delta, 1, 2.5) })) render(false);
}

/* mapPan — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function mapPan(dx, dy) {
  const c = mapState().center;
  if (storeMap({ center: { x: mapClamp(c.x + dx, 0, 100), y: mapClamp(c.y + dy, 0, 100) } }))
    render(false);
}

/* mapReset — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function mapReset() {
  if (storeMap({ center: { x: 50, y: 50 }, zoom: 1 })) render(false);
}

/* changeMapInterest — 선택된 값 또는 관련 상태를 갱신하고 필요한 화면 반영을 수행합니다. */
function changeMapInterest(region) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !save("map-interest", { region })
  )
    return;
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!mapView) {
    render(false);
    return;
  }
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    storeMap({ region, selected: null, center: { x: 50, y: 50 }, category: "전체", query: "" })
  ) {
    activeMapRoute = null;
    location.hash = "#/area";
    render(false);
  }
}

/* mapWorld — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
/* mapWorld: 기본 처리와 확장을 이 함수 한 곳에서 관리합니다.
 * 관련 수정은 아래 처리 구간에 적용하며, 다른 파일에서 이 함수를 덮어쓰지 않습니다. */
function mapWorld(...args) {
  /* 처리 단계 1: 기존 neighborhood-map.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation0 = function (s, places, mini = false) {
    return `<div class="neighborhood-world" style="transform:translate(${(50 - s.center.x) * s.zoom}%,${(50 - s.center.y) * s.zoom}%) scale(${s.zoom})">${mapSvg()}${places.map((p, i) => (mini ? `<span class="mini-place ${s.selected === p.id ? "current" : ""}" style="left:${p.x}%;top:${p.y}%"><b>${i + 1}</b><small>${esc(p.title)}</small></span>` : `<button type="button" class="marker ${s.selected === p.id ? "selected" : ""}" style="left:${p.x}%;top:${p.y}%" aria-pressed="${s.selected === p.id}" ${uiActionAttrs("click", "openMapPlace_85", [p.id])}><b>${placeMeta[p.id].short}</b> ${esc(p.title)}</button>`)).join("")}</div>`;
  };

  /* 앞 단계의 결과를 확장합니다. 전역 함수는 재할당하지 않습니다. */
  const phOriginalMapWorld = implementation0;

  /* 처리 단계 2: 기존 public-housing.js의 관련 코드를 이곳으로 모았습니다. */
  const implementation1 = function (s, places, mini = false) {
    const html = phOriginalMapWorld(s, places, mini),
      p = phMapContext ? phProperty(phMapContext) : null;
    if (!p || mini) return html;
    return html.replace(
      "</div>",
      `<span class="ph-home-marker" style="left:${p.x}%;top:${p.y}%">⌂ ${esc(p.name)}</span></div>`,
    );
  };
  return implementation1(...args);
}

/* recentDate — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function recentDate(value) {
  return Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "최근 조회";
}

/* activityMapSection — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function activityMapSection(context = "activity") {
  const s = mapState(),
    list = recentPlaces.map((x) => ({
      ...facilities.find((p) => p.id === x.id),
      viewedAt: x.viewedAt,
    })),
    hasHistory = list.length > 0;
  return `<section class="activity-map-section" aria-labelledby="${context}-map-title"><div class="section-head"><div><div class="section-kicker">YOUR NEIGHBORHOOD</div><h2 id="${context}-map-title">${context === "life" ? "생활권 지도" : hasHistory ? "내가 둘러본 우리 동네" : "우리 동네 생활 정보"}</h2><p>${hasHistory ? "지난번 찾아본 장소와 생활 정보를 이어서 확인해요." : "분리수거장부터 교통·공공시설까지, 관심 지역의 생활 정보를 찾아보세요."}</p></div><span class="badge">${esc(s.region || "옥천 전체")} · ${mapView ? "최근 지도" : "관심 지역"}</span></div><div class="activity-map-grid"><div class="map-resume-card"><h3>${mapView ? "마지막으로 본 지도" : "관심 지역 미리보기"}</h3><a href="#/area" class="mini-map" aria-label="${mapView ? "생활권 지도 이어보기" : "우리 동네 생활 정보 찾아보기"}">${mapWorld(s, hasHistory ? list : facilities.filter((p) => !s.region || s.region === p.region), true)}<span class="mini-caption">${esc(s.region || "옥천 전체")} · ${mapView ? Math.round(s.zoom * 100) + "%" : "분리수거 · 교통 · 공공시설"}</span></a><a class="btn" href="#/area">${mapView ? "생활권 지도 이어보기" : "우리 동네 생활 정보 찾아보기"} →</a></div><div class="recent-places"><h3>최근 조회 장소</h3>${hasHistory ? `<ol>${list.map((p) => `<li><a href="#/place/${p.id}"><span><b>${esc(p.title)}</b><small>${esc(placeMeta[p.id].summary)}</small><time>${recentDate(p.viewedAt)}</time></span><span class="textlink">지도에서 보기 →</span></a></li>`).join("")}</ol>` : `<div class="recent-empty"><span class="empty-symbol">⌖</span><h3>아직 찾아본 장소가 없어요.</h3><p>지도에서 장소를 열어보면 다음 방문에 이곳에서 다시 확인할 수 있어요.</p><p class="micro">분리수거 · 교통 · 공공시설 · 생활 공지</p></div>`}<a class="textlink" href="#/saved/place">저장한 장소 보기 →</a></div></div><p class="micro">최근 조회는 내가 열어본 장소예요. 장소 저장과 알림 구독은 별도로 선택합니다. 조회 기록은 현재 브라우저에 보관됩니다.</p>${!mapView ? `<details class="interest-editor"><summary>관심 지역 바꾸기</summary><label>관심 읍·면 <select aria-label="지도 관심 지역" ${uiActionAttrs("change", "changeMapInterest_99", [])}><option value="">옥천 전체</option>${options(regions, s.region)}</select></label></details>` : ""}</section>`;
}

/* lifeBeforeMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* activityBeforeMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const activityBeforeMap = activityPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
activityPage = function (tab = "alerts") {
  let html = activityBeforeMap(tab).replace(
    "등록한 조건과 도착한 방 소식, 상담과 제보의 진행 상황을 확인해요.",
    "방 알림과 상담을 확인하고, 지난번 찾아본 동네 정보를 이어서 살펴보세요.",
  );
  if (tab === "alerts") {
    const index = html.lastIndexOf("</div></div>");
    html =
      html.slice(0, index) +
      activityMapSection() +
      `<section class="section"><h2>생활 준비도 함께 이어가요</h2><div class="actions"><a class="btn secondary" href="#/tasks">첫 1년 할 일</a><a class="textlink" href="#/life">내 질문·답변 보기 →</a><a class="textlink" href="#/saved/space">저장한 공간 비교 →</a></div></section>` +
      html.slice(index);
  }
  return html;
};

/* waitBeforeMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const waitBeforeMap = waitCard;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
waitCard = function (a) {
  return waitBeforeMap(a).replace(
    '<details class="formbox"><summary>입주가 급한가요?',
    activityMapSection() + '<details class="formbox"><summary>입주가 급한가요?',
  );
};
// Waiting cards already include a map section; keep a single overview on the activity page.

/* activityWithMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const activityWithMap = activityPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
activityPage = function (tab = "alerts") {
  const html = activityWithMap(tab);
  if (tab !== "alerts") return html;
  let count = 0;
  return html.replace(/<section class="activity-map-section"[\s\S]*?<\/section>/g, (block) =>
    ++count === 1 ? block : "",
  );
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

// Deep links are resolved by mapPage so a place from another filter opens correctly.

/* renderBeforeMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* mapEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function mapEvents() {
  const el = document.getElementById("neighborhood-map");
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!el) return;
  el.onkeydown = (e) => {
    const dirs = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    };
    if (dirs[e.key] && e.target === el) {
      e.preventDefault();
      mapPan(...dirs[e.key]);
    }
  };
  let drag = null;
  el.onpointerdown = (e) => {
    if (e.target.closest("button,a")) return;
    drag = { x: e.clientX, y: e.clientY, center: { ...mapState().center } };
    el.setPointerCapture(e.pointerId);
  };
  el.onpointerup = (e) => {
    if (!drag) return;
    const bounds = el.getBoundingClientRect(),
      s = mapState(),
      dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (
      Math.abs(dx) + Math.abs(dy) > 5 &&
      storeMap({
        center: {
          x: mapClamp(drag.center.x - ((dx / bounds.width) * 100) / s.zoom, 0, 100),
          y: mapClamp(drag.center.y - ((dy / bounds.height) * 100) / s.zoom, 0, 100),
        },
      })
    )
      render(false);
    drag = null;
  };
  el.onpointercancel = () => (drag = null);
}

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
