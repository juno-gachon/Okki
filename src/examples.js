/*
 * 파일: examples.js
 * 역할: 동네 정보, 질문과 답변, 실제 살아본 후기의 예시 데이터를 정의합니다. 기존에 저장한 사용자 데이터와 예시를 병합하는 함수도 포함합니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";

/* exampleScope — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleScope = { region: "", village: "" };

/* mergeExamples — 이미 저장된 항목의 식별자와 겹치지 않는 예시만 복사해 합칩니다. */
function mergeExamples(saved, seeds) {
  const ids = new Set(saved.map((x) => x.id));
  return [...saved, ...structuredClone(seeds.filter((x) => !ids.has(x.id)))];
}

/* examplePosts — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const examplePosts = [
  {
    "id": "demo-info-recycling",
    "title": "[예시] 이사 첫날, 분리수거 위치부터 확인해두니 편했어요",
    "author": "첫 이웃",
    "body":
      "지난 토요일에 이사했는데 상자와 완충재가 생각보다 많이 나왔어요. 관리인에게 물어보니 건물 뒤 공동 배출장소를 쓰고, 종이상자는 테이프를 떼고 접어서 놓으면 된다고 했어요. 현관 앞에 쌓아두지 않고 짐을 풀 때마다 접어두니 동선도 덜 막혔습니다. 음식물통은 방에 따로 없어서 작은 뚜껑 통을 준비했어요. 배출 요일은 입구 안내판을 찍어두었습니다.",
    "comments": [
      {
        "id": "demo-comment-recycling-0",
        "author": "상자 부자",
        "text": "큰 가전 포장 스티로폼도 상자 옆에 두면 되나요?",
        "demo": true,
      },
      {
        "id": "demo-comment-recycling-1",
        "author": "첫 이웃",
        "text":
          "저희 건물은 스티로폼 수거함이 따로 있었어요. 붙어 있던 테이프를 떼고 그쪽에 넣었습니다.",
        "demo": true,
      },
      {
        "id": "demo-comment-recycling-2",
        "author": "상자 부자",
        "text": "비 오는 날에도 밖에 내놓으셨나요?",
        "demo": true,
      },
      {
        "id": "demo-comment-recycling-3",
        "author": "첫 이웃",
        "text":
          "배출장소에 지붕이 있긴 한데 상자가 젖을까 봐 전날 접어 실내에 두고, 안내된 배출 시간에 가져갔어요.",
        "demo": true,
      },
    ],
    "visual": "village",
    "category": "동네 정보",
    "scope": {
      "region": "",
      "village": "",
    },
    "relation": "거주",
    "demo": true,
    "owned": false,
    "time": "2026.10.25",
    "created": "2026-10-25T08:00:00+09:00",
  },
  {
    "id": "demo-info-commute",
    "title": "[예시] 늦은 퇴근길, 큰길로 돌아오니 4분 더 걸렸어요",
    "author": "퇴근길 산책",
    "body":
      "낮에 방을 보러 갔을 때는 정류장에서 골목으로 들어오면 6분 정도였어요. 계약 전에 저녁 9시쯤 다시 걸어보니 골목 중간에 보도가 좁아지는 구간이 있어 큰길로 돌아왔습니다. 돌아오는 길은 10분쯤 걸렸지만 횡단보도가 있고 편의점도 지나서 저는 이쪽이 더 편했어요. 비가 온 다음 날에는 건물 앞 낮은 곳에 물이 고여 신발이 젖기도 했어요. 퇴근 가방에 작은 우산을 넣어두고 있습니다.",
    "comments": [
      {
        "id": "demo-comment-commute-0",
        "author": "늦은 퇴근",
        "text": "장보고 오면 10분 걷기가 부담스럽지 않나요?",
        "demo": true,
      },
      {
        "id": "demo-comment-commute-1",
        "author": "퇴근길 산책",
        "text": "우유나 쌀처럼 무거운 건 주말에 한 번에 사고, 평일에는 한 끼 먹을 정도만 사 와요.",
        "demo": true,
      },
      {
        "id": "demo-comment-commute-2",
        "author": "늦은 퇴근",
        "text": "밤에 버스를 놓친 날은 어떻게 하셨어요?",
        "demo": true,
      },
      {
        "id": "demo-comment-commute-3",
        "author": "퇴근길 산책",
        "text":
          "지난주에는 호출해서 택시를 탔는데 잡히기까지 15분 정도 기다렸어요. 야근하는 날은 퇴근 전에 버스 시간을 먼저 확인해요.",
        "demo": true,
      },
    ],
    "visual": "village",
    "category": "동네 정보",
    "scope": {
      "region": "",
      "village": "",
    },
    "relation": "거주",
    "demo": true,
    "owned": false,
    "time": "2026.10.25",
    "created": "2026-10-25T07:00:00+09:00",
  },
  {
    "id": "demo-info-firstweek",
    "title": "[예시] 옥천 생활 첫 주, 장보기 목록을 냉장고에 붙였어요",
    "author": "새 출발",
    "body":
      "처음 일주일은 퇴근길마다 장을 봤더니 냉장고에 같은 재료가 쌓이더라고요. 지금은 일요일에 세 끼 정도 해 먹을 메뉴를 정하고 필요한 것만 적어 나갑니다. 냉동실이 작아서 고기는 한 번 먹을 양으로 나누고, 채소는 두세 종류만 사요. 세제와 휴지는 휴대전화 메모에 남겨뒀다가 떨어질 때 같이 삽니다. 집 주변 세탁방과 약국도 지도에 저장해두니 급할 때 찾기 편했어요.",
    "comments": [
      {
        "id": "demo-comment-firstweek-0",
        "author": "작은 냉장고",
        "text": "채소가 남으면 어떻게 보관하세요?",
        "demo": true,
      },
      {
        "id": "demo-comment-firstweek-1",
        "author": "새 출발",
        "text":
          "대파는 썰어서 냉동하고, 애호박은 다음 날 볶음밥에 넣어요. 잎채소는 오래 못 두겠어서 소포장으로 사요.",
        "demo": true,
      },
      {
        "id": "demo-comment-firstweek-2",
        "author": "작은 냉장고",
        "text": "도시락까지 싸면 준비 시간이 많이 걸리나요?",
        "demo": true,
      },
      {
        "id": "demo-comment-firstweek-3",
        "author": "새 출발",
        "text":
          "전날 저녁에 만든 반찬을 따로 담아두는 정도예요. 처음부터 매일 싸려니 힘들어서 지금은 주 2회만 챙겨요.",
        "demo": true,
      },
    ],
    "visual": "village",
    "category": "동네 정보",
    "scope": {
      "region": "",
      "village": "",
    },
    "relation": "거주",
    "demo": true,
    "owned": false,
    "time": "2026.10.25",
    "created": "2026-10-25T06:00:00+09:00",
  },
];

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
seedPosts.push(...examplePosts);

/* exampleQuestions — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleQuestions = [
  {
    "id": "demo-q-late-commute",
    "title": "[예시] 퇴근이 늦은 날, 집까지 이동 방법을 어떻게 정하나요?",
    "author": "입주 준비생",
    "body":
      "다음 달부터 교대근무를 시작해요. 주 2회는 밤 9시 이후에 퇴근하는데, 보고 온 방은 정류장에서 걸어서 10분 정도였습니다. 차는 없고 비가 올 때나 버스를 놓쳤을 때가 걱정돼요. 비슷한 시간에 퇴근하시는 분은 어떻게 다니세요?",
    "relation": "입주 예정",
    "answers": [
      {
        "id": "demo-a-late-commute",
        "author": "먼저 온 이웃",
        "body":
          "저도 주 2회 늦게 끝나요. 평소에는 버스를 타고, 늦어질 것 같은 날은 퇴근 직전에 도착 시간을 확인해요. 지난달에는 버스를 놓쳐 택시를 세 번 탔는데, 월세 외에 교통비를 따로 잡아두는 게 낫더라고요.",
        "basis": "직접 경험",
        "relation": "거주",
        "period": "2026년 가을",
        "interest": "없음",
        "source": "",
        "demo": true,
        "owned": false,
        "helpful": false,
        "created": "2026-10-25T09:00:00+09:00",
        "replies": [
          {
            "author": "입주 준비생",
            "body": "택시는 퇴근하고 바로 호출하면 금방 잡히던가요?",
            "role": "추가 질문",
          },
          {
            "author": "먼저 온 이웃",
            "body":
              "날마다 달랐어요. 비 오는 금요일에는 20분 가까이 기다렸고, 평일에는 5분 안에 잡힌 적도 있어요. 건물 안에서 기다리다가 배차가 되면 나왔습니다.",
            "role": "추가 답변",
          },
        ],
      },
    ],
    "scope": {
      "region": "",
      "village": "",
    },
    "photos": [],
    "status": "답변 확인 중",
    "notify": false,
    "owned": false,
    "demo": true,
    "created": "2026-10-25T08:30:00+09:00",
    "returnTo": null,
  },
  {
    "id": "demo-q-monthly-cost",
    "title": "[예시] 월세 말고 매달 드는 비용은 무엇을 확인해야 하나요?",
    "author": "첫 독립",
    "body":
      "월세 35만 원에 관리비 5만 원인 방과 월세 37만 원에 관리비 3만 원인 방을 비교하고 있어요. 두 곳 다 합계는 같은데 첫 번째는 수도·인터넷 포함이고 두 번째는 수도만 포함이라고 합니다. 인터넷 말고 놓치기 쉬운 비용이 있을까요?",
    "relation": "입주 예정",
    "answers": [
      {
        "id": "demo-a-monthly-cost",
        "author": "집 보기 동행",
        "body":
          "저는 인터넷 설치비와 공유기 구입비를 첫 달에 따로 냈어요. 전기와 가스도 별도였고요. 특히 난방비가 겨울에 올라서 집주인에게 지난겨울 고지서를 볼 수 있는지 물어봤습니다.",
        "basis": "직접 경험",
        "relation": "거주",
        "period": "2026년 가을",
        "interest": "없음",
        "source": "",
        "demo": true,
        "owned": false,
        "helpful": false,
        "created": "2026-10-25T09:00:00+09:00",
        "replies": [
          {
            "author": "첫 독립",
            "body": "이전 사람이 쓴 겨울 고지서를 보여주면 그 금액으로 예상해도 될까요?",
            "role": "추가 질문",
          },
          {
            "author": "집 보기 동행",
            "body":
              "대략적인 참고로만 봤어요. 이전 세입자는 낮에도 집에 있었고 저는 저녁에만 있어서 사용 시간이 달랐거든요. 제 방은 11월 가스비가 4만 원대, 1월은 8만 원대였어요. 창가 바람과 보일러 조절 방식도 같이 확인해보세요.",
            "role": "추가 답변",
          },
        ],
      },
    ],
    "scope": {
      "region": "",
      "village": "",
    },
    "photos": [],
    "status": "답변 확인 중",
    "notify": false,
    "owned": false,
    "demo": true,
    "created": "2026-10-25T07:30:00+09:00",
    "returnTo": null,
  },
  {
    "id": "demo-q-shared-rules",
    "title": "[예시] 룸메이트와 생활 규칙은 어디까지 이야기하나요?",
    "author": "함께 사는 집",
    "body":
      "친구와 방 두 개짜리 집을 알아보고 있어요. 저는 아침 7시에 출근하고 친구는 오후에 나가서 생활 시간이 달라요. 청소와 공과금은 반씩 하기로 했는데, 같이 살기 전에 더 정할 게 있을까요?",
    "relation": "입주 예정",
    "answers": [
      {
        "id": "demo-a-shared-rules",
        "author": "공동생활 이웃",
        "body":
          "저희도 출근 시간이 달라서 세탁기와 요리 시간을 먼저 정했어요. 밤 11시 이후 세탁기는 돌리지 않고, 설거지는 각자 그날 끝내기로 했습니다. 친구가 자고 갈 때는 전날까지 서로 물어보기로 했고요.",
        "basis": "직접 경험",
        "relation": "거주",
        "period": "2026년 가을",
        "interest": "없음",
        "source": "",
        "demo": true,
        "owned": false,
        "helpful": false,
        "created": "2026-10-25T09:00:00+09:00",
        "replies": [
          {
            "author": "함께 사는 집",
            "body": "친구 한 명이 며칠 여행을 가면 전기·가스도 반씩 내셨나요?",
            "role": "추가 질문",
          },
          {
            "author": "공동생활 이웃",
            "body":
              "주말 여행 정도는 그대로 반씩 냈어요. 한 달 출장 때는 기본요금은 반씩, 사용요금은 집에 남은 사람이 부담하기로 출발 전에 합의했어요. 영수증을 대화방에 올리고 정산일을 정하니 덜 헷갈렸습니다.",
            "role": "추가 답변",
          },
        ],
      },
    ],
    "scope": {
      "region": "",
      "village": "",
    },
    "photos": [],
    "status": "답변 확인 중",
    "notify": false,
    "owned": false,
    "demo": true,
    "created": "2026-10-25T06:30:00+09:00",
    "returnTo": null,
  },
];

/* additionalExampleAnswers — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const additionalExampleAnswers = [
  {
    author: "야근하는 이웃",
    body: "저는 야근이 잦아서 집을 정할 때 버스 시간보다 도보 귀가가 가능한 거리인지 먼저 봤어요. 지금은 걸어서 25분 정도인 곳에 살고, 비가 많이 오거나 짐이 있을 때만 택시를 타요. 낮에 보던 길과 밤에 걷는 느낌이 달라서 계약 전에 퇴근 시간에 직접 걸어봤습니다.",
  },
  {
    author: "꼼꼼한 자취생",
    body: "저는 관리비가 싼 방을 골랐다가 인터넷을 따로 설치했어요. 설치비와 공유기 구입비가 첫 달에 한꺼번에 나왔고, 계약 기간보다 인터넷 약정이 길어서 이사할 때 이전 설치도 알아봤습니다. 관리비에 포함된 항목을 문자로 받아두고 인터넷 약정 기간까지 비교해보세요.",
  },
  {
    author: "두 번째 룸메이트",
    body: "청소표 말고 냉장고 칸과 공용물품 구매 기준도 정해두면 좋아요. 저희는 선반을 한 칸씩 쓰고 휴지·세제만 함께 샀어요. 밤에 통화할 때는 이어폰을 쓰기로 했고, 한 달 살아본 뒤 불편했던 점을 다시 이야기해서 규칙을 고쳤습니다.",
  },
];

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
exampleQuestions.forEach((q, i) => {
  q.answers.push({
    ...additionalExampleAnswers[i],
    id: q.id + "-second-answer",
    basis: "직접 경험",
    relation: "거주",
    period: "2026년 가을",
    interest: "없음",
    source: "",
    demo: true,
    owned: false,
    helpful: false,
    created: "2026-10-25T10:00:00+09:00",
  });
  q.acceptedAnswerId = i === 0 ? q.answers[1].id : null;
  q.acceptedAt = i === 0 ? "2026-10-25T11:00:00+09:00" : null;
  if (i === 0) q.status = "채택 완료";
});

/* exampleExperiences — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleExperiences = [
  {
    "id": "demo-review-studio",
    "title": "[예시] 첫 원룸, 햇빛은 좋았지만 겨울 난방비는 따로 봐야 했어요",
    "experience": "현재 거주",
    "housing": "원룸",
    "topics": ["관리비", "냉난방", "채광"],
    "transport": "대중교통",
    "author": "창가의 하루",
    "period": "2025년 11월 입주 · 현재 거주",
    "body":
      "처음 방을 볼 때는 남향 창이 마음에 들어서 바로 계약하고 싶었어요. 실제로 오후에는 불을 켜지 않아도 될 만큼 밝고, 빨래도 잘 마르는 편이에요. 다만 창가 쪽은 겨울에 찬 기운이 느껴져 두꺼운 커튼을 달았어요.\n\n관리비 5만 원에는 수도와 인터넷이 포함되고 전기·도시가스는 따로 냈어요. 혼자 살면서 가스를 쓴 금액은 11월 약 4만 원, 1월 약 9만 원이었고요. 제가 난방을 켜는 시간에 따른 금액이라 다른 방과 그대로 비교하기는 어려울 것 같아요. 다시 집을 구한다면 창문을 닫았을 때 바람이 들어오는지, 최근 겨울 고지서를 볼 수 있는지부터 물어보려고요.",
    "commute":
      "집에서 정류장까지 걸어서 7분 정도예요. 버스를 놓치면 출근 시간이 빠듯해서 평소보다 10분 일찍 나가요. 주말에는 평일과 같은 시간에 버스가 있는지 따로 확인하고 있어요.",
    "fee": "월 5만 원 · 수도·인터넷 포함",
    "extra": "전기·도시가스 별도",
    "discussion": [
      {
        "author": "첫 독립 준비",
        "question": "인터넷이 포함되어 있으면 공유기도 방에 있나요?",
        "reply":
          "제 방에는 랜선만 있어서 공유기는 직접 샀어요. 인터넷 포함이라는 말만 보고 공유기까지 있는 줄 알았는데, 입주 전에 장비 유무도 물어보면 좋겠어요.",
        "followUp": "공유기를 설치하는 건 어렵지 않았나요?",
        "followUpReply":
          "벽면 랜포트에 연결하고 설명서대로 설정하니 됐어요. 처음에는 연결이 안 돼서 관리인에게 어느 포트를 쓰는지 물어봤습니다.",
      },
      {
        "author": "겨울 이사",
        "question": "창가가 추우면 결로도 생겼나요?",
        "reply":
          "아침에 창문 아래쪽에 물방울이 맺힌 날이 있었어요. 닦아내고 짧게 환기하면서 지냈어요. 방을 볼 때 창틀 모서리와 벽지 상태를 같이 살펴보세요.",
        "followUp": "커튼을 달고 난 뒤에도 물방울이 생기던가요?",
        "followUpReply":
          "추운 아침에는 조금 생겼어요. 커튼을 창에 붙이지 않고 띄워두고, 출근 전에 걷어서 창틀을 말렸어요.",
      },
    ],
  },
  {
    "id": "demo-review-share",
    "title": "[예시] 세 명이 살던 셰어하우스, 청소보다 생활 시간 맞추기가 중요했어요",
    "experience": "과거 거주",
    "housing": "셰어하우스",
    "topics": ["소음", "관리비", "택배"],
    "transport": "도보·자전거",
    "author": "느린 자전거",
    "period": "2025년 9월~2026년 8월 거주",
    "body":
      "세 명이 각자 방을 쓰고 주방과 욕실 하나를 함께 썼어요. 처음에는 청소표만 있으면 괜찮을 줄 알았는데, 출근 준비 시간이 겹쳐 아침 욕실 사용이 가장 불편했어요. 서로 씻는 시간을 이야기하고 나니 다툴 일이 줄었어요.\n\n공용 관리비는 각자 3만 원을 냈고 전기·가스는 고지서를 단체 대화방에 올린 뒤 셋이 나눴어요. 세제와 휴지는 한 사람이 계속 사지 않도록 구매 내역을 메모했고요.\n\n밤늦게 요리할 때 나는 소리나 방문객 문제는 처음에 말하기가 조금 어려웠어요. 결국 밤 11시 이후에는 세탁기를 돌리지 않고, 친구가 올 때는 미리 알리기로 정했어요. 혼자 사는 것보다 대화가 필요한 대신 퇴근 후 같이 밥 먹을 사람이 있다는 점은 좋았습니다.",
    "commute":
      "자전거로 약 12분 걸리는 직장에 다녔어요. 비가 오면 걸어서 30분 정도 잡았고, 늦은 날은 다른 이동 수단을 이용했어요.",
    "fee": "1인당 월 3만 원 · 공용 관리",
    "extra": "전기·가스 3인 분담, 공용 소모품 별도",
    "discussion": [
      {
        "author": "같이 살기 고민",
        "question": "집을 오래 비워도 공과금을 똑같이 나눴나요?",
        "reply":
          "짧은 외출이나 주말 부재는 똑같이 나눴어요. 한 명이 한 달 가까이 출장 갔을 때는 출발 전에 따로 이야기했고요. 오래 비울 경우 기준을 미리 정해두는 게 편하겠더라고요.",
        "followUp": "출장 때는 실제로 어떻게 나누셨나요?",
        "followUpReply":
          "그달 기본요금은 셋이 나누고 사용요금은 집에 남은 둘이 부담했어요. 다음 달 고지서를 보고 정산했습니다.",
      },
      {
        "author": "아침형 이웃",
        "question": "청소 당번은 어떻게 정했어요?",
        "reply":
          "주방·욕실·거실을 일주일씩 돌아가며 맡았어요. 일정 때문에 못 하면 다음 사람과 바꿨고, 설거지와 개인 쓰레기는 각자 바로 치우기로 했어요.",
        "followUp": "당번을 바꾸면 헷갈리지 않았나요?",
        "followUpReply":
          "처음에는 말로만 바꿨다가 빠뜨려서 냉장고에 붙인 표에 날짜와 이름을 적었어요. 바꾼 사람끼리 대화방에도 남겼고요.",
      },
    ],
  },
  {
    "id": "demo-review-boarding",
    "title": "[예시] 하숙집 방문, 식사 제공보다 내 퇴근 시간과 맞는지가 중요했어요",
    "experience": "방문 경험",
    "housing": "하숙",
    "topics": ["주차", "통근", "관리비"],
    "transport": "자가용",
    "author": "퇴근길 메모",
    "period": "2026년 10월 방문",
    "body":
      "일을 시작하기 전에 하숙집 한 곳을 보러 갔어요. 방 크기는 크지 않았지만 침대와 책상이 있어서 짐을 적게 가져가도 되겠다는 생각이 들었어요. 방은 혼자 쓰고 욕실은 다른 두 사람과 함께 쓰는 구조였어요.\n\n제가 방문한 곳은 평일 저녁 식사를 제공한다고 했어요. 그런데 저녁 먹는 시간이 제 예상 퇴근 시간보다 빨라서, 늦게 오는 날에도 식사를 남겨둘 수 있는지 물었습니다. 냉장 보관 후 직접 데워 먹는 방식이라고 설명을 들었고, 주말 식사는 따로 준비해야 했어요.\n\n건물 앞 주차 자리는 두 대분인데 입주자 전용으로 지정된 자리는 아니었어요. 방문했을 때 한 자리가 비어 있어도 매일 주차할 수 있는 건 아니라는 점이 걸렸어요. 아직 입주는 결정하지 않았고, 주차와 식사 조건을 다시 확인한 뒤 비교하려고 합니다.",
    "commute":
      "방문 당일에는 차로 직장까지 약 15분 걸렸어요. 낮 시간에 확인한 경로라 실제 출근 시간에도 한 번 가보려고 해요.",
    "fee": "식비·관리비 포함 총액은 최종 확인 전",
    "extra": "주말 식사 별도, 주차 자리 보장 없음",
    "discussion": [
      {
        "author": "저녁이 늦은 사람",
        "question": "저녁을 못 먹은 날은 식비를 빼준다고 하나요?",
        "reply":
          "제가 물어봤을 때는 식사 여부에 따라 매일 차감하는 방식은 아니라고 했어요. 장기 출장 같은 경우는 따로 상의하자고 했는데, 구체적인 기준은 아직 확인하지 못했어요.",
        "followUp": "늦게 돌아와 데워 먹는 소리는 괜찮다고 하셨나요?",
        "followUpReply":
          "전자레인지는 공용 주방에서 쓰면 된다고 했어요. 다만 밤에는 문을 조용히 닫아달라고 하셔서 주방과 방 사이 거리도 보고 왔습니다.",
      },
      {
        "author": "주차 걱정",
        "question": "근처에 다른 주차 장소도 보고 왔나요?",
        "reply":
          "주변을 잠깐 둘러보기는 했지만, 이용 가능한 곳인지나 비용까지 확인하지는 못했어요. 다음 방문 때 저녁 시간의 주차 상황도 함께 확인하려고요.",
        "followUp": "주차가 꼭 필요하면 어떻게 결정하실 생각인가요?",
        "followUpReply":
          "저녁에 다시 가보고, 자리가 없을 때 이용할 주차장과 월 비용을 확인하려고 해요. 그 비용까지 더해서 다른 방과 비교할 생각입니다.",
      },
    ],
  },
].map((x, i) => ({
  ...x,
  scope: { ...exampleScope },
  interest: "없음",
  verified: false,
  owned: false,
  demo: true,
  helpful: false,
  created: `2026-10-25T0${8 - i}:45:00+09:00`,
}));

/* mergeReviewExamples — 기존 후기와 예시 후기를 식별자 기준으로 병합합니다. */
function mergeReviewExamples(saved) {
  return mergeExamples(saved, exampleExperiences).map((x) => {
    const seed = exampleExperiences.find((e) => e.id === x.id);
    if (!seed || !x.demo) return x;
    const { title, body, author, period, commute, fee, extra, discussion } = seed;
    return { ...x, title, body, author, period, commute, fee, extra, discussion };
  });
}

/* refreshExampleQuestion — 예시 질문을 현재 질문·답변 자료 구조에 맞게 보완합니다. */
function refreshExampleQuestion(q) {
  const seed = exampleQuestions.find((x) => x.id === q.id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!seed || !q.demo)
    return q;
  const previous = q.answers || [];
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return {
    ...q,
    title: seed.title,
    body: seed.body,
    author: seed.author,
    acceptedAnswerId: q.acceptedAnswerId === undefined ? seed.acceptedAnswerId : q.acceptedAnswerId,
    acceptedAt: q.acceptedAt === undefined ? seed.acceptedAt : q.acceptedAt,
    answers: [
      ...seed.answers.map((a) => ({
        ...a,
        ...Object.fromEntries(
          Object.entries(previous.find((x) => x.id === a.id) || {}).filter(([k]) =>
            ["helpful", "hidden"].includes(k),
          ),
        ),
      })),
      ...previous.filter((a) => !a.demo),
    ],
  };
}

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
posts = posts.map((p) => {
  const seed = examplePosts.find((x) => x.id === p.id);
  if (!seed || p.owned) return p;
  return {
    ...p,
    title: seed.title,
    body: seed.body,
    author: seed.author,
    time: seed.time,
    comments: [...seed.comments, ...(p.comments || []).filter((c) => c.owned)],
  };
});

// A stable inbox example links to its own space without inventing a waiting application.

/* exampleRoomSpace — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleRoomSpace = {
  id: "demo-notice-room-dec20",
  name: "[예시] 옥천읍 원룸",
  type: "원룸",
  region: "옥천읍",
  deposit: null,
  rent: 35,
  fee: null,
  date: "2026-12-20",
  min: null,
  max: null,
  bath: null,
  kitchen: null,
  pet: null,
  barrier: null,
  x: 50,
  y: 50,
  color: 2,
  registrationMode: "broker",
  broker: "OO 공인중개사",
  description:
    "OO 공인중개사에서 안내하는 옥천읍 원룸입니다. 2026년 12월 20일부터 입주할 수 있고 월세는 35만 원이에요. 보증금·관리비·시설과 방문 일정은 상담에서 확인해주세요.",
  facilities: ["보증금·관리비 확인 필요", "시설·계약 조건 상담 시 확인"],
};

/* 현재 실행 환경이나 저장된 상태를 확인한 뒤 필요한 초기 처리를 수행합니다. */
if (!homes.some((h) => h.id === exampleRoomSpace.id)) homes.push(exampleRoomSpace);

/* exampleRoomNotice — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleRoomNotice = {
  id: "demo-notice-room-dec20",
  key: "demo-room-dec20",
  category: "방·상담",
  title: "[예시] 조건에 맞는 방이 곧 나와요.",
  body: "옥천읍 원룸 · 2026년 12월 20일 입주 가능\n월세 35만 원 · OO 공인중개사",
  href: "#/consultation/demo-notice-room-dec20",
  cta: "상담 요청",
  demo: true,
  created: "2026-10-28T09:00:00+09:00",
  read: false,
};

/* exampleYouthHousingNotice — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const exampleYouthHousingNotice = {
  id: "demo-notice-youth-housing",
  key: "demo-youth-housing-2026",
  category: "내 생활",
  title: "[예시] 청년주택 청약 신청 자격을 충족했어요.",
  body: "연령·무주택·소득·자산 조건을 충족해 청약을 신청할 수 있어요.\n신청 기간: 2026년 11월 2일~11월 13일\n모집 내용과 준비 서류를 확인하고 신청을 준비해보세요.",
  href: "#/notice/youth-housing",
  cta: "청약 공지 확인",
  demo: true,
  created: "2026-10-28T10:00:00+09:00",
  read: false,
};
