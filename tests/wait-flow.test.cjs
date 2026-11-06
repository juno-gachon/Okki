/* fs, vm, assert, crypto — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
/*
 * 파일: wait-flow.test.cjs
 * 역할: 대기 신청과 관련 알림의 주요 흐름을 검증합니다.
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
    querySelector: node,
    querySelectorAll: () => [],
    getElementById: node,
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
vm.createContext(c);
/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const file of ["app.js", "flow.js", "router.js"])
  vm.runInContext(fs.readFileSync(require("path").join(__dirname, "../src", file), "utf8"), c);
/* run — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const run = (s) => vm.runInContext(s, c);
/* submit — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const submit = (f) =>
  f.onsubmit({
    preventDefault() {},
    target: f,
  });
// Landing no public listing discovery. Correct community deep-link and sort behavior.

/* landing — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const landing = run("home()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(landing.includes("곧 나올 방 알림 받기"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!landing.includes("homecard"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(landing.indexOf('data-category="일상"') < landing.indexOf('data-category="새로 왔어요"'));

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const prev of ["일상", "새로 왔어요", "동네 정보", "지원 정책"])
  for (const [cat, id] of [
    ["일상", "seed1"],
    ["새로 왔어요", "seed2"],
  ]) {
    run(
      `communityTab=${JSON.stringify(prev)};openCommunityPreview({button:0,preventDefault(){}},{dataset:{category:${JSON.stringify(cat)},postId:${JSON.stringify(id)}}})`,
    );
    assert.equal(run("communityTab"), cat);
  }

/* before — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const before = run("allPosts().map(p=>p.id).join()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("mutatePost('seed2',p=>p.comments.push({text:'comment'}));mutatePost('seed1',p=>p.liked=true)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("allPosts().map(p=>p.id).join()"), before);
// Step 1 validation and preservation through map return.

/* f — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let f = form("#wait-form", {
  situation: "입사 예정",
  startDate: "2026-11-01",
  date: "2026-11-10",
  latestDate: "2026-11-05",
  duration: "6개월",
  destination: "옥천읍 예시 직장",
  regions: ["옥천읍"],
  anyRegion: false,
  deposit: "500",
  budget: "50",
  depositUnknown: false,
  budgetUnknown: false,
});

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("waitEvents('1')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(node("#wait-form .form-error").textContent.includes("이후"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.latestDate.value = "2026-11-30";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(c.location.hash, "/wait/2");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("waitDraft.destination"), "옥천읍 예시 직장");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
node("#apply-region").value = "동이면";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("applyArea()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("waitDraft.regions.join()"), "옥천읍,동이면");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("waitDraft.deposit"), "500");
// Step 2 must verify selected channels; changes to a contact invalidate verification.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#wait-form", {
  name: "체험자",
  phone: "010-0000-0000",
  email: "test@example.com",
  channel: "이메일",
  reply: "문자",
  privacy: true,
  serviceConsent: true,
  settlementConsent: false,
  types: ["원룸"],
  must: "욕실 단독",
  preferences: "햇빛",
  phoneCode: "",
  emailCode: "",
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("waitEvents('2')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.length"), 0);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(node("#wait-form .form-error").textContent.includes("확인"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.btn = {
  form: f,
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("sendDemoCode(btn,'phone')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.phoneCode.value = run("verification.phone.code");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("checkDemoCode(btn,'phone')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("verified(btn.form,'phone')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.phone.value = "010-1111-1111";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("verified(btn.form,'phone')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.phone.value = "010-0000-0000";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("sendDemoCode(btn,'email')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.emailCode.value = run("verification.email.code");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("verification.email.until=0;checkDemoCode(btn,'email')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("verified(btn.form,'email')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("sendDemoCode(btn,'email')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.emailCode.value = run("verification.email.code");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("checkDemoCode(btn,'email')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].status"), "대기 중");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].kind"), "waiting");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), 0);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].data.budget"), "50");
/* wid — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const wid = run("applications[0].id");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.wid = wid;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(c.location.hash.startsWith("/wait-complete/W-"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("waitComplete(wid)").includes("기다리는 단계"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("activityPage()").includes("아직 조건에 맞는 방 소식이 없어요"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("demoAlert(wid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("alertPage(alerts[0].id)").includes("체험자"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts[0].status"), "확인함");
/* consultHtml — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const consultHtml = run('consultationPage("C",wid)');
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(consultHtml.indexOf("detail-layout") < consultHtml.indexOf('id="consultation-form"'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(consultHtml.includes("욕실 단독"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(consultHtml.includes("담당 중개사와 보유 기간이 정해지지"));
// Submission preserves original waiting conditions/status and stores immutable snapshot.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.data = {
  purpose: "상세 조건 문의",
  message: "관리비 항목 문의",
  name: "수정한 상담 이름",
  phone: "010-0000-0000",
  reply: "문자",
  date: "2026-11-20",
  duration: "6개월",
  must: "다른 조건",
  consent: "on",
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("savedConsult=submitSpaceConsultation('C',wid,data)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("savedConsult.kind"), "consultation");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("savedConsult.id").startsWith("C-"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===wid).status"), "대기 중");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===wid).data.name"), "체험자");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("savedConsult.sourceConditions.date"), "2026-11-10");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("submitSpaceConsultation('C',wid,data)"), null);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("submitSpaceConsultation('C',null,data)"), null);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("homes.find(h=>h.id==='C').rent=999");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("savedConsult.snapshot.rent"), 40);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("consultationDetailPage(savedConsult.id)").includes("관리비 항목 문의"));
// Cancellation and notification pause operate independently; failed save is non-mutating.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "patchApp(savedConsult.id,{status:'취소'},'취소');patchApp(wid,{status:'일시 중단'},'일시 중단')",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===wid).status"), "일시 중단");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("demoAlert(wid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("alerts.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("patchApp(wid,{status:'집 구함'},'종료')"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===wid).status"), "일시 중단");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("alerts[0].status='마감'");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run('consultationPage("C",wid)').includes('id="consultation-form"'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("submitSpaceConsultation('C',wid,data)"), null);
// Completion close action returns to consultation tab.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#consultation-form", {
  purpose: "방문 요청",
  message: "방문하고 싶어요",
  name: "직접 체험",
  phone: "010-0000-0000",
  reply: "문자",
  email: "",
  visitDate: "2099-01-01",
  visitTime: "오후 (12~18시)",
  consent: true,
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("consultationEvents('A')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(node("#dialog").innerHTML.includes("공간 상담 제출이 완료"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
node("#consultation-success").onclick();
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(c.location.hash, "/activity/consultations");
// Known mismatches and unknown conditions stay separate.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "cmp=compareConditions({date:'2026-11-10',regions:['동이면'],deposit:'100',budget:'30',types:['원룸'],must:'주차',commute:'30'},{region:'옥천읍',type:'원룸',date:null,deposit:null,rent:40,fee:null})",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('cmp.unknown.includes("입주 일정")'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('cmp.unknown.includes("보증금")'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('cmp.unknown.includes("월 고정비")'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('cmp.mismatch.includes("희망 지역")'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run('cmp.passed.includes("보증금")'));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("cost({rent:40,fee:null})"), "비용 미확인");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("money(0)"), "0만 원");
// Tip contact verification and private submission without permission.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#tip-form", {
  role: "곧 나가는 세입자",
  name: "예시 세입자",
  phone: "010-0000-0000",
  leaveDate: "2026-11-05",
  certainty: "예상",
  type: "원룸",
  region: "옥천읍",
  address: "비공개 주소 예시",
  unit: "101호",
  known: "참고",
  landlordAware: "아직 전달하지 않았어요",
  nextContact: "먼저 저와 상의해주세요",
  forwardPermission: false,
  privacy: true,
  phoneCode: "",
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("provideEvents('tenant')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.btn = {
  form: f,
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("sendDemoCode(btn,'phone')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.phoneCode.value = run("verification.phone.code");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("checkDemoCode(btn,'phone')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].kind"), "tip");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].status"), "접수");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].data.forwardPermission"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.tid = run("applications[0].id");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("tipDetail(tid)").includes("추가 확인 전에는 방 알림을 보내지"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("reviewTip(tid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#review-tip", {
  by: "체험 운영",
  reviewDate: "2026-10-22",
  status: "안내 가능",
  note: "근거",
  contact: true,
  intent: true,
  authority: false,
  conditions: true,
  laterPermission: false,
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("reviewTip(tid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===tid).status"), "접수");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(node("#review-tip .form-error").textContent.includes("모두 확인"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.authority.checked = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.laterPermission.checked = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id===tid).status"), "안내 가능");
// Checklist state and all independent templates render with no JavaScript exceptions.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#task-form", {
  status: "준비 중",
  note: "공고 확인",
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("taskEvents('rent')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("todoState.rent.status"), "준비 중");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(c.location.hash, "/tasks");

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const expr of [
  "home()",
  'waitPage("1")',
  'waitPage("2")',
  'activityPage("alerts")',
  'activityPage("consultations")',
  'activityPage("tips")',
  'providePage("tenant")',
  'providePage("owner")',
  "tipDetail(tid)",
  "tasksPage()",
  'taskDetail("rent")',
  "communityPage()",
  "writePage()",
  'areaPage("wait")',
  "aboutPage()",
  "adminPage()",
]) {
  const html = run(expr);
  assert(typeof html === "string" && html.length > 100, expr);
  assert(!html.includes("NaN"), expr);
}

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("areaQuery='옥천역';areaCategory='전체'");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("areaPage()").includes(encodeURIComponent("옥천군 옥천역")));
// User text is escaped in cards/alerts.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("applications.find(a=>a.id===wid).data.destination='<img src=x onerror=alert(1)>'");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("activityPage()").includes("<img src=x"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
console.log(
  "PASS: landing; all prior community tabs and stable order; wait input preservation and dates; demo OTP expiry/channel invalidation; pending with no automatic match; map return; alert/consultation prefill and snapshots; duplicate prevention; completion navigation; pause/cancel isolation; quota failure; unknown conditions; private tenant tip; operator verification gate; checklist persistence; all page templates; escaped user input.",
);
