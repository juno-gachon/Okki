/* fs, vm, assert, crypto — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
/*
 * 파일: integrated-flow.test.cjs
 * 역할: 질문과 답변, 공간 상담 등 통합 기능의 주요 흐름을 가상 브라우저 환경에서 검증합니다.
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
vm.createContext(c);
/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const file of [
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

// Published examples load for both new and previously empty browser storage.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("examplePosts.length"), 3);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions.length"), 3);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("experiences.length"), 3);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("examplePosts.every(p=>allPosts().some(x=>x.id===p.id))"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("questions.every(q=>q.demo&&!q.owned&&!q.notify&&q.answers.length===2)"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("experiences.every(x=>x.demo&&!x.owned&&!x.verified)"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('exampleQuestions.every(q=>questionDetail(q.id).includes("[예시]"))'));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('exampleExperiences.every(x=>reviewCard(x).includes("[예시]"))'));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('examplePosts.every(x=>!x.body.includes("예시")&&!x.body.includes("가상"))'));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("inbox.length"), 2);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("notificationsPage()").includes("2026년 12월 20일 입주 가능"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("notificationsPage()").includes("월세 35만 원 · OO 공인중개사"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("notificationsPage()").includes("상담 요청"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run('notificationsPage("질문·답변")').includes("OO 공인중개사"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run("mergeExamples(inbox,[exampleRoomNotice]).filter(n=>n.id===exampleRoomNotice.id).length"),
  1,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("openNotice(exampleRoomNotice.id)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(c.location.hash, "#/consultation/demo-notice-room-dec20");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("inbox.find(n=>n.id===exampleRoomNotice.id).read"), true);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("consultationPage(exampleRoomSpace.id)").includes('id="consultation-form"'));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("consultationPage(exampleRoomSpace.id)").includes("OO 공인중개사"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.length"), 0);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("inbox=[];location.hash='#/'");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("communityTab='동네 정보'");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("communityPage()").includes("이사 첫날, 분리수거"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("neighborhood={region:'옥천읍',village:''}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("questionList()").includes("[예시]"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("reviewsPage()").includes("[예시]"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("communityPage()").includes("이사 첫날, 분리수거"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mergeExamples(exampleQuestions,exampleQuestions).length"), 3);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run('mergeExamples([{...exampleQuestions[0],status:"해결됨"}],exampleQuestions)[0].status'),
  "해결됨",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run('exampleExperiences.every(x=>x.discussion.length===2&&!x.body.includes("가상"))'));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run(
    'mergeReviewExamples([{...exampleExperiences[0],body:"이전 본문",helpful:true,hidden:true}])[0].helpful',
  ),
  true,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run(
    'mergeReviewExamples([{...exampleExperiences[0],body:"이전 본문",helpful:true,hidden:true}])[0].hidden',
  ),
  true,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("exampleExperiences.every(x=>reviewCard(x).includes(x.discussion[0].reply))"));
// Keep preexisting workflow scenarios isolated from supplied demonstration content.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions=[];experiences=[];neighborhood={region:'',village:''}");

// Exercise the integrated state transitions without running browser route rendering.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("render=()=>{}");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run("scopeMatch({region:'옥천읍',village:'금구리'},{region:'옥천읍',village:'금구리'})"),
  true,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(
  run("scopeMatch({region:'옥천읍',village:'금구리'},{region:'옥천읍',village:''})"),
  false,
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("scopeMatch({region:'동이면'},{region:'옥천읍'})"), false);

/* f — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
let f = form("#question-form", {
  scopeRegion: "옥천읍",
  scopeVillage: "금구리",
  relation: "입주 예정",
  title: "지역 점검 질문",
  body: "사진 없이 묻는 질문",
  author: "이웃",
  anonymous: false,
  notify: true,
  publicCheck: true,
});

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("askEvents()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].photos.length"), 0);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].scope.village"), "금구리");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.qid = run("questions[0].id");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("neighborhood={region:'동이면',village:''}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("questionList()").includes("지역 점검 질문"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("neighborhood={region:'옥천읍',village:'금구리'}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("questionList()").includes("지역 점검 질문"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("broaden()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("neighborhood.village"), "");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].scope.village"), "금구리");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("questionList()").includes("지역 점검 질문"));
// Saving and answer subscriptions are independent. Replies leave original publication date alone.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("toggleSaved('question',qid,'지역 점검 질문','#/question/'+qid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("savedItems[0].notify"), false);

/* created — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const created = run("questions[0].created");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#answer-form", {
  basis: "직접 경험",
  relation: "거주",
  author: "답변 이웃",
  period: "2026년",
  interest: "없음",
  source: "",
  body: "답변 예시",
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("answerEvents(qid)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].answers.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].created"), created);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("inbox.length"), 1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("inbox[0].href").includes("/" + run("questions[0].answers[0].id")));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questionAction(qid,'notify')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].answers.length"), 2);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("inbox.length"), 1);

/* count — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const count = run("questions[0].answers.length");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].answers.length"), count);
// Only the question owner can accept one answer; selection survives new answers and storage.

/* aid1, aid2 — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const aid1 = run("questions[0].answers[0].id"),
  aid2 = run("questions[0].answers[1].id");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.aid1 = aid1;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.aid2 = aid2;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions[0].owned=false");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("acceptAnswer(qid,aid1)"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), null);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("questionDetail(qid)").includes(">이 답변 채택<"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions[0].owned=true");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("acceptAnswer(qid,aid1)"), true);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), aid1);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questionStatus(questions[0])"), "채택 완료");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("questionDetail(qid)").includes("✓ 질문자 채택"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("neighborhood={...questions[0].scope}");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("questionList()").includes("채택 완료"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("acceptAnswer(qid,aid2)"), true);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("visibleAnswers(questions[0])[0].id"), aid2);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run('read("questions",[])[0].acceptedAnswerId'), aid2);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run('acceptAnswer(qid,"another-question-answer")'), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), aid2);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions[0].answers[0].hidden=true");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("acceptAnswer(qid,aid1)"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions[0].answers[0].hidden=false");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("acceptAnswer(qid,aid1)"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), aid2);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].answers.length"), 3);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), aid2);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].status"), "채택 완료");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].created"), created);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run('acceptAnswer(qid,"")'), true);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].acceptedAnswerId"), null);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("questions[0].status"), "답변 확인 중");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("exampleQuestions.every(q=>q.answers.length===2)"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run("answerCard(exampleQuestions[0],exampleQuestions[0].answers[1])").includes("✓ 질문자 채택"),
);
// Public fields are escaped; phone and exact unit disclosure is stopped.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("publicGuard('전화 010-1234-5678')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("publicGuard('101동 305호')"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("publicGuard('2026년 경험')"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("questions[0].title='<img src=x onerror=alert(1)>'");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(!run("questionDetail(qid)").includes("<img src=x"));
// Reviews do not get a verification badge from self declaration.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#review-form", {
  scopeRegion: "옥천읍",
  scopeVillage: "금구리",
  experience: "현재 거주",
  period: "2026년",
  housing: "원룸",
  topics: ["통근"],
  transport: "대중교통",
  commute: "버스 시간 확인",
  fee: "기억나지 않음",
  extra: "",
  body: "직접 경험",
  author: "이웃",
  anonymous: false,
  interest: "없음",
  consent: true,
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("reviewEvents()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("experiences[0].verified"), false);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("reviewCard(experiences[0])").includes("이용자 경험 · 인증 전"));
// New registrations must pass phone verification and photo requirements.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("providePage()").includes("공인중개사 매물 등록하기"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("providePage()").includes("함께 살 사람 모집하기"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#registration-resident", {
  name: "체험자",
  phone: "010-0000-0000",
  phoneCode: "",
  type: "하숙",
  meal: "식사 협의",
  title: "함께 살 방",
  region: "옥천읍",
  min: "1",
  max: "6",
  privacy: true,
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("registrationEvents('resident')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f.elements.type.onchange();
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(f.elements.meal.required, true);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.length"), 0);
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
assert.equal(run("applications.length"), 0);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f._photos = ["data:image/png;base64,example"];
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].mode"), "resident");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications[0].status"), "접수");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run(
    "compareConditions({sharing:'단독 주거만'},{registrationMode:'resident'}).mismatch.includes('공동거주 수용 여부')",
  ),
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run(
    "compareConditions({sharing:'상담 후 결정'},{registrationMode:'resident'}).unknown.includes('공동거주 수용 여부')",
  ),
);
// Current input and a different space's draft never overwrite each other.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = {
  id: "consultation-form",
};
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.draftForm = f;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/consultation/A/W-1";
/* aKey — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const aKey = run("draftKey(draftForm)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/consultation/B/W-1";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.notEqual(run("draftKey(draftForm)"), aKey);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/question/Q-1/A-1";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.draftForm = {
  id: "answer-form",
};
/* answerKey — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const answerKey = run("draftKey(draftForm)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.location.hash = "#/question/Q-1";
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("draftKey(draftForm)"), answerKey);
// Previously selected tasks are visible in saved items and subscriptions remain explicit.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("saveTask('move')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("savedPage('task')").includes("전입신고"));
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("!!todoState.move.remind"), false);
// Settlement changes waiting state without cancelling any consultation.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "applications.push({id:'W-test',kind:'waiting',status:'일시 중단',data:{},history:[]},{id:'C-test',kind:'consultation',status:'접수',data:{},history:[]})",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
f = form("#settle-form", {
  status: "입주 완료",
  date: "2026-11-01",
  region: "옥천읍",
  waiting: "계속 받기",
  tasks: true,
  localNews: false,
  reviewPrompt: false,
});
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("settleEvents('W-test')");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
submit(f);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id==='W-test').status"), "대기 중");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("applications.find(a=>a.id==='C-test').status"), "접수");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("!!todoState.move.selected"), true);
// New views render with real states, including blocked/empty routes.

/* 이 구간에서 필요한 설정과 실행 흐름을 준비합니다. */
for (const expr of [
  "home()",
  "providePage()",
  'registrationPage("broker")',
  'registrationPage("resident")',
  "lifePage()",
  "settlePage()",
  "savedPage()",
  'savedPage("task")',
  "notificationsPage()",
  "notificationSettings()",
  "questionList()",
  "askPage()",
  "questionDetail(qid)",
  "reviewsPage()",
  "reviewWrite()",
  "mapPage()",
  "verificationPage()",
  "casesPage()",
  "communityAdmin()",
]) {
  const html = run(expr);
  assert(typeof html === "string" && html.length > 100, expr);
  assert(!html.includes("NaN"), expr);
}
// Local HTTP preview has no randomUUID, so IDs still must be unique and valid.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
c.crypto = {
  getRandomValues: (b) => crypto.webcrypto.getRandomValues(b),
};
/* ids — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const ids = new Set(
  Array.from(
    {
      length: 100,
    },
    () => run("newId()"),
  ),
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(ids.size, 100);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert([...ids].every((x) => /^[0-9a-f]{8}-/.test(x)));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
console.log(
  "PASS: scoped communities; photo-free questions; explicit subscriptions; reply deep links; failed-save isolation; escaped public input; self-declared review status; resident registration gates; shared-living mismatch; separate drafts; saved tasks; settlement/consultation isolation; all integrated views; HTTP-compatible IDs.",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("exampleQuestions.every(q=>q.answers[0].replies.length===2)"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("exampleExperiences.every(x=>x.discussion.every(d=>d.followUp&&d.followUpReply))"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("exampleExperiences.every(x=>reviewCard(x).includes(x.discussion[0].followUpReply))"));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(
  run(
    'refreshExampleQuestion({...exampleQuestions[0],answers:[{id:"user-answer",body:"내 답변",owned:true}],hidden:true}).answers.some(a=>a.id==="user-answer")',
  ),
);

// PC 05/06/29/42: history is not a saved-place list or a notification subscription.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "mapView=null;recentPlaces=[];activeMapRoute=null;mapRouteInitialized=false;neighborhood={region:'',village:''};applications=[];savedItems=[];save('map-interest',{region:'동이면'})",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("activityMapSection()").includes("아직 찾아본 장소가 없어요."));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mapState().region"), "동이면");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("save('map-interest',{region:''});location.hash='#/area';mapPage()");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("recentPlaces.length"), 0);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "mapFilter('category','분리수거·폐기물');mapFilter('query','없는 검색어');location.hash='#/place/bus';mapPage()",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mapView.selected"), "bus");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mapView.category"), "교통");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mapView.query"), "");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("mapView.region"), "옥천읍");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("recentPlaces[0].id"), "bus");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("savedItems.length"), 0);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("!!notificationPrefs.places"), false);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("mapZoom(.5);mapPan(-10,10)");
/* viewport — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const viewport = run("JSON.stringify(mapView)");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "location.hash='#/activity';activeMapRoute=null;activityPage();location.hash='#/area';mapPage()",
);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(mapView)"), viewport);
// A page reload on the same selected-place URL restores the viewport, too.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("mapRouteInitialized=false;activeMapRoute=null;location.hash='#/place/bus';mapPage()");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(mapView)"), viewport);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("selectMapPlace('recycle',false);selectMapPlace('office',false);selectMapPlace('bus',false)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run('recentPlaces.map(x=>x.id).join(",")'), "bus,office,recycle");

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("recentPlaces.length"), 3);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("activityMapSection()").includes("#/place/bus"));

/* beforeMap — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const beforeMap = run("JSON.stringify(mapView)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = true;
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("mapZoom(.25)");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal(run("JSON.stringify(mapView)"), beforeMap);
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
failSave = false;
// The dashboard keeps one map panel for both waiting and arrived-room states.

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run(
  "applications=[{id:'W-map',kind:'waiting',status:'대기 중',data:{regions:['옥천읍'],depositUnknown:true,budgetUnknown:true},history:[]}]",
);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert.equal((run("activityPage()").match(/class="activity-map-section"/g) || []).length, 1);

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
run("location.hash='#/place/missing';activeMapRoute=null");
/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
assert(run("mapPage()").includes("삭제되었거나 현재 표시할 수 없어요."));

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
console.log(
  "PASS: first map visit; interest fallback; cross-filter place links; distinct recent 3; viewport resume and reload; no automatic save/subscribe; storage failure; one dashboard panel; unavailable place.",
);
