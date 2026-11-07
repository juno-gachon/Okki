/* fs, vm, assert, crypto — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
/*
 * 파일: public-housing-flow.test.cjs
 * 역할: 공공주택 공고와 알림 구독의 주요 흐름을 검증합니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert"),
  crypto = require("crypto");

/* nodes, cache — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const nodes = new Map(),
  cache = new Map();
/* failSave — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let failSave = false;

/* node — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function node(s) {
  if (!nodes.has(s)) {
    const listeners = new Map();
    nodes.set(s, {
      innerHTML: "",
      textContent: "",
      hidden: false,
      disabled: false,
      value: "",
      classList: {
        add() {},
        remove() {},
      },
      addEventListener(k, fn) {
        listeners.set(k, fn);
      },
      removeEventListener(k) {
        listeners.delete(k);
      },
      focus() {},
      scrollIntoView() {},
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
        listeners.get("close")?.();
      },
      querySelector(q) {
        return node(s + " " + q);
      },
      querySelectorAll() {
        return [];
      },
      append() {},
      prepend() {},
      setAttribute() {},
      closest() {
        return this;
      },
      reportValidity() {
        return true;
      },
      listeners,
    });
  }
  return nodes.get(s);
}

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
class FD {
  constructor(form) {
    this.items = [];
    for (const [name, e] of Object.entries(form.elements || {})) {
      if (!e.disabled && (!(e.type === "checkbox" || e.type === "radio") || e.checked)) {
        for (const v of Array.isArray(e.value) ? e.value : [e.value || ""])
          this.items.push([name, v]);
      }
    }
  }
  getAll(n) {
    return this.items.filter((x) => x[0] === n).map((x) => x[1]);
  }
  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
}

/* form — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function form(sel, values) {
  const f = node(sel);
  f.elements = {};
  for (const [k, v] of Object.entries(values))
    f.elements[k] =
      typeof v === "boolean"
        ? {
            type: "checkbox",
            checked: v,
            value: "on",
          }
        : {
            value: v,
            checkValidity: () => true,
            reportValidity: () => true,
            focus() {},
          };
  f.querySelectorAll = (q) => {
    const m = q.match(/^\[name="([^"]+)"\]$/);
    if (m) return f.elements[m[1]] ? [f.elements[m[1]]] : [];
    if (q === "input[type=checkbox]")
      return Object.entries(f.elements)
        .filter(([k, e]) => e.type === "checkbox")
        .map(([k, e]) => ({
          ...e,
          name: k,
        }));
    return [];
  };
  f.querySelector = (q) => {
    const m = q.match(/^\[name="([^"]+)"\]$/);
    return m ? f.elements[m[1]] || null : node(sel + " " + q);
  };
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */
  return f;
}

/* c — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const c = {
  document: {
    addEventListener() {},
    querySelector: node,
    querySelectorAll: () => [],
    getElementById: node,
    createElement: node,
  },
  localStorage: {
    getItem: (k) => cache.get(k) || null,
    setItem(k, v) {
      if (failSave) throw Error("quota");
      cache.set(k, v);
    },
  },
  window: {
    addEventListener() {},
    scrollTo() {},
  },
  location: {
    hash: "#/",
  },
  crypto: crypto.webcrypto,
  structuredClone,
  setTimeout: () => 0,
  clearTimeout() {},
  console,
  FormData: FD,
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.history = {
  pushState(_s, _t, url) {
    c.location.hash = url;
  },
  replaceState(_s, _t, url) {
    c.location.hash = url;
  },
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.DOMPurify = require('dompurify')(new (require('jsdom').JSDOM)('').window);
vm.createContext(c);
/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const file of ["ui-security.js", "ui-actions.js",
  "app.js",
  "flow.js",
  "examples.js",
  "integrated.js",
  "neighborhood-map.js",
  "public-housing.js",
  "vacancy.js",
  "router.js",
])
  vm.runInContext(fs.readFileSync(require("path").join(__dirname, "../src", file), "utf8"), c);
/* run — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const run = (s) => vm.runInContext(s, c);
/* submit — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const submit = (f) =>
  f.onsubmit({
    preventDefault() {},
    target: f,
  });

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("render=()=>{}");

/* now — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const now = Date.parse("2026-10-29T12:00:00+09:00");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.testNow = now;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run("phStatus(phNotice('PH-A-2026-02'),phGroup(phNotice('PH-A-2026-02'),'youth'),testNow)"),
  "접수 중",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run("phStatus(phNotice('PH-A-2026-02'),phGroup(phNotice('PH-A-2026-02'),'student'),testNow)"),
  "접수 종료",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phStatus(phNotice('PH-C-2026-03'),undefined,testNow)"), "접수 예정");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phFiltered().every(p=>p.areas.includes('옥천군'))"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phFilter.nearby=['대전광역시']");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phFiltered().some(p=>p.id==='H-D')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phFilter.nearby=[]");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("home()").includes("공공주택 모집 알아보기"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run("providePage()").indexOf("내 퇴거 예정 정보 등록하기") <
    run("providePage()").indexOf("함께 살 사람 모집하기"),
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('activityTabs("public")').includes("공공주택"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "phState={interests:[],subscriptions:[],records:{},seen:[],overrides:{},logs:[]};phToggleInterest('H-A')",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.subscriptions.length"), 0);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.sub = {
  kind: "property",
  entity: "H-A",
  group: "",
  newNotice: true,
  regions: [],
  types: [],
  targets: [],
  channel: "옥키 알림함만",
  phone: "010-0000-0000",
  email: "demo@example.com",
  quietStart: "22:00",
  quietEnd: "08:00",
  privacy: true,
};

/* result — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let result = run("phSaveSubscription(sub,testNow)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(result.subscription);
/* pid — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const pid = result.subscription.id;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.subscriptions[0].phone"), "");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.subscriptions[0].email"), "");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
result = run("phSaveSubscription(sub,testNow)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(result.subscription.id, pid);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.subscriptions.length"), 1);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "sub={...sub,kind:'conditions',entity:'',regions:['옥천군'],types:['행복주택'],targets:['청년']}",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phSaveSubscription(sub,testNow)").subscription);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("sub={...sub,regions:[]}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phSaveSubscription(sub,testNow)").error);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "sub={...sub,kind:'schedule',entity:'PH-C-2026-03',group:'youth',regions:[],types:[],targets:[],start:true,deadline:true,changes:true,reminder:'3일 전 09:00'}",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
result = run("phSaveSubscription(sub,testNow)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(result.subscription);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.sid = result.subscription.id;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(result.subscription.remindAt, "2026-11-06T00:00:00.000Z");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phSaveSubscription({...sub,privacy:false},testNow)").error);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run(
    'phSaveSubscription({...sub,group:"student",reminder:"직접 선택",customTime:"2026-10-28T09:00"},testNow)',
  ).error,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run(
    'phSaveSubscription({...sub,reminder:"직접 선택",customTime:"2026-11-09T16:30",quietStart:"16:00",quietEnd:"18:00"},testNow)',
  ).error,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('phSaveSubscription({...sub,entity:"PH-A-2026-02",start:true},testNow)').error);

/* stateBefore — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const stateBefore = run("JSON.stringify(phState)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('phSaveSubscription({...sub,entity:"PH-A-2026-02",start:false},testNow)').error);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(phState)"), stateBefore);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phSyncNotices(Date.parse('2026-11-02T10:05:00+09:00'))");
/* delivered — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const delivered = run('inbox.filter(n=>n.key?.startsWith("public/")).length');
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(delivered, 1);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phSyncNotices(Date.parse('2026-11-02T10:06:00+09:00'))");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run('inbox.filter(n=>n.key?.startsWith("public/")).length'), delivered);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phState.records['PH-C-2026-03']={status:'신청했어요'};phStopSubscription(sid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.subscriptions.find(s=>s.id===sid).active"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("phState.interests.includes('H-A')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phState.records['PH-C-2026-03'].status"), "신청했어요");

/* recordBefore — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const recordBefore = run("JSON.stringify(phState.records)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phOpenOfficial('PH-A-2026-02','youth')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(phState.records)"), recordBefore);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('phNoticePage("PH-A-2026-02","student")').includes("접수 종료"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("phState.overrides['PH-A-2026-02']={...phNotice('PH-A-2026-02'),reviewState:'취소',version:2}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("phStatus(phNotice('PH-A-2026-02'),undefined,testNow)"), "취소");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('phNoticePage("PH-A-2026-02","youth")').includes("취소된 모집"));
// Drafts for different entities and kinds never overwrite each other.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.draftForm = {
  id: "public-subscription-form",
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/public/subscribe/property/H-A";
/* keyA — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const keyA = run("draftKey(draftForm)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/public/subscribe/property/H-B";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.notEqual(run("draftKey(draftForm)"), keyA);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.vac = {
  name: "퇴거자",
  phone: "010-0000-0000",
  currentResident: true,
  region: "옥천읍",
  address: "테스트 비공개 주소",
  type: "원룸·투룸",
  certainty: "미정",
  timingNote: "내년 초 이사 협의 중",
  landlordNotified: "아직 알리지 않았어요",
  landlordIntent: "아직 확인하지 못했어요",
  ownerConnection: "내가 먼저 확인할게요",
  ownerPhone: "010-1111-2222",
  contactTime: "저녁 문자 먼저",
  privacy: true,
  truth: true,
};

/* homesBefore, alertsBefore — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const homesBefore = run("homes.length"),
  alertsBefore = run("alerts.length");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
result = run("vacancySave(vac)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(result.application);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.vid = result.application.id;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(result.application.data.ownerPhone, "");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(result.application.status, "확인 대기");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("homes.length"), homesBefore);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), alertsBefore);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('vacancySave({...vac,certainty:"날짜 확정",leaveDate:""})').error);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('vacancySave({...vac,landlordNotified:"알렸어요",notifiedAt:""})').error);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run('vacancySave({...vac,ownerConnection:"집주인이 옥키 연락에 동의했어요",ownerConsent:false})')
    .error,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
result = run(
  'vacancySave({...vac,certainty:"예상 날짜 · 조정 가능",leaveDate:"2026-12-20",landlordNotified:"알렸어요",notifiedAt:"2026-10-29",noticeMethod:"문자",landlordResponse:"응답 기다리는 중"},[],vid)',
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(result.application.id, c.vid);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.filter(a=>a.id===vid).length"), 1);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("prepareAlert(vid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), alertsBefore);

/* appsBefore — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const appsBefore = run("JSON.stringify(applications)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('vacancySave({...vac,name:"저장 실패"},[],vid)').error);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(applications)"), appsBefore);

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const expr of [
  "phHome()",
  "phList()",
  'phPropertyPage("H-B")',
  'phNoticePage("PH-C-2026-03","youth")',
  'phSubscribePage("property","H-A")',
  'phSubscribePage("conditions")',
  'phSubscribePage("schedule","PH-C-2026-03","student")',
  "phComplete(sid)",
  "phActivity()",
  "phAdmin()",
  "vacancyChoice()",
  "vacancyForm()",
  "vacancyDetail(vid)",
]) {
  assert(run(expr).length > 100, expr);
}

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
console.log(
  "PASS: public housing groups/status/filter; explicit interests and 3 subscription types; dedup; Korean schedules/quiet time; past and after-close blocking; private contacts; local notification dedup; stop retains records; separate drafts; vacancy conditional consent/edit; no unreviewed alerts; storage failure isolation.",
);
