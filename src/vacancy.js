/*
 * 파일: vacancy.js
 * 역할: 곧 비게 될 집의 정보를 비공개로 제보하는 입력·검증·저장 및 상세 화면을 담당합니다. 제보 자체가 공개 매물로 등록되는 것은 아닙니다.
 * 구성: 초기 데이터와 상태, 기능별 함수, 화면 및 이벤트 연결 순서로 읽습니다.
 * 참고: 이 프로젝트는 별도 서버가 없는 시제품이며 저장 데이터는 현재 브라우저에 남습니다.
 */
"use strict";
// PC 41 / 43 / 44: leaving-home information is private and not a published listing.

/* vacancySchema — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancySchema = [
  ["name", "이름 또는 별칭"],
  ["phone", "휴대전화"],
  ["region", "읍·면"],
  ["address", "상세 주소 · 비공개"],
  ["type", "주거 형태"],
  ["certainty", "퇴거 일정 상태"],
  ["leaveDate", "퇴거 예정일"],
  ["timingNote", "예상 시기·일정 메모"],
  ["contractEnd", "현재 계약 종료일"],
  ["dateRange", "날짜 조정 범위"],
  ["landlordNotified", "집주인에게 알린 여부"],
  ["notifiedAt", "알린 날짜"],
  ["noticeMethod", "알린 방법"],
  ["landlordResponse", "집주인 응답"],
  ["plannedNoticeAt", "알릴 예정일"],
  ["landlordIntent", "다음 임차인 모집 의사"],
  ["landlordMessage", "집주인과 주고받은 내용"],
  ["ownerConnection", "집주인 연락 연결"],
  ["ownerPhone", "집주인 연락처 · 비공개"],
  ["deposit", "현재 보증금 (만 원)"],
  ["rent", "현재 월세 (만 원)"],
  ["currentFee", "현재 관리비·포함 항목"],
  ["conditionNote", "집 상태·수리 참고"],
  ["contactTime", "내게 연락 가능한 시간·방법"],
];

/* vacancyChoice — 이름에 해당하는 기능을 현재 상태와 입력값을 바탕으로 처리합니다. */
function vacancyChoice() {
  return `<div class="container">${pageHead("SHARE A PLACE, START A CHAPTER", "어떤 방 정보를 등록하시나요?", "공인중개사 매물을 등록하거나, 내가 곧 퇴거할 집의 소식을 알려주세요.")}<div class="two-grid section"><div class="soft-card registration-choice"><span class="badge">공인중개사</span><h2>확인한 매물을 등록해요</h2><p>중개사무소·담당자 정보<br>중개 의뢰·안내 권한 확인<br>매물 조건·입주 가능일 등록<br>상담·변경·거래 완료 관리</p><a class="btn" href="#/provide/broker">공인중개사 매물 등록하기 →</a></div><div class="soft-card registration-choice"><span class="badge orange">현재 거주자</span><h2>곧 퇴거할 집의 소식을 알려요</h2><p>퇴거 예정일·일정 확정 여부<br>집주인에게 알린 여부·응답 상태<br>현재 집 정보·현재 계약 조건<br>확인 후 방 소식 안내</p><a class="btn" href="#/provide/vacancy">내 퇴거 예정 정보 등록하기 →</a></div></div><div class="notice">퇴거 예정일과 다음 사람이 실제 입주할 수 있는 날짜는 달라요. 집주인의 통지 수령, 재임대 의사, 안내 가능 여부를 각각 확인합니다.</div><section class="vacancy-secondary"><div><h3>함께 살 사람을 찾고 있나요?</h3><p>계속 거주하면서 룸메이트·셰어하우스·하숙의 함께 살 사람을 모집할 수 있어요.</p></div><a class="btn secondary small" href="#/provide/resident">함께 살 사람 모집하기 →</a></section><a class="textlink" href="#/activity/tips">내 방 등록 내역 보기 →</a></div>`;
}

/* vacancyGet — 관련 데이터와 식별 정보를 읽거나 화면에서 사용하기 쉬운 형태로 준비합니다. */
function vacancyGet(id) {
  return applications.find((a) => a.id === id && a.mode === "vacancy" && a.kind === "tip");
}

/* vacancyForm — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function vacancyForm(id) {
  const original = vacancyGet(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (id && !original)
    return unavailable();
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    original?.status === "철회·마감"
  )
    return vacancyDetail(id);
  const d = { ...(original?.data || {}), ...read("form-draft-vacancy-form-" + (id || "new"), {}) };
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return formShell(
    id ? "퇴거 예정 정보를 수정해요." : "곧 나갈 집의 소식을 알려주세요.",
    "퇴거 예정 정보는 비공개로 접수하며 집주인과 조건을 확인하기 전에는 방 소식으로 안내하지 않습니다.",
    "vacancy-form",
    `<a class="textlink" href="#/provide">← 방 등록 유형 다시 선택</a>` +
      box(
        "01",
        "누가, 어느 집에서 나가나요?",
        `<div class="fields">${inputField("이름 또는 별칭 *", "name", d.name, 'required maxlength="40"')}${inputField("휴대전화 * · 비공개", "phone", d.phone, 'required type="tel" pattern="0[0-9-]{8,14}"')}${selectField("읍·면 *", "region", regions, d.region, true)}${inputField("상세 주소 * · 비공개", "address", d.address, 'required maxlength="180"')}${selectField("주거 형태 *", "type", ["원룸·투룸", "아파트·오피스텔", "단독·다가구", "셰어·하숙", "기타"], d.type, true)}</div>${verifyUI("phone")}${checkField("currentResident", "[필수] 현재 이 집에 거주하고 있으며 퇴거를 계획하고 있어요.", d.currentResident, true)}`,
      ) +
      box(
        "02",
        "언제 퇴거할 예정인가요?",
        `<div class="fields">${selectField("퇴거 일정 상태 *", "certainty", ["날짜 확정", "예상 날짜 · 조정 가능", "미정"], d.certainty, true)}${inputField("퇴거 예정일 · 확정/예상 시 필수", "leaveDate", d.leaveDate, 'type="date"')}${inputField("현재 계약 종료일 (선택)", "contractEnd", d.contractEnd, 'type="date"')}${inputField("날짜 조정 가능 범위 (선택)", "dateRange", d.dateRange, 'maxlength="120"')}</div>${textArea("예상 시기·일정에 관해 알려주실 내용", "timingNote", d.timingNote)}<p class="micro">미정이면 예상 시기나 조정 중인 사유를 적어주세요. 퇴거일은 다음 사람의 실제 입주 가능일과 구분합니다.</p>`,
      ) +
      box(
        "03",
        "집주인에게 퇴거 예정 사실을 알렸나요?",
        `<div class="fields">${selectField("집주인에게 알린 여부 *", "landlordNotified", ["알렸어요", "아직 알리지 않았어요", "알릴 예정이에요"], d.landlordNotified, true)}${inputField("알린 날짜 · 알렸어요 선택 시 필수", "notifiedAt", d.notifiedAt, 'type="date"')}${selectField("알린 방법 · 알렸어요 선택 시 필수", "noticeMethod", ["전화", "문자", "직접 전달", "기타"], d.noticeMethod)}${selectField("집주인 응답 · 알렸어요 선택 시 필수", "landlordResponse", ["응답 기다리는 중", "전달받았다고 답함", "퇴거 날짜 협의 중", "기타"], d.landlordResponse)}${inputField("알릴 예정일 (선택)", "plannedNoticeAt", d.plannedNoticeAt, 'type="date"')}${selectField("다음 임차인 모집에 대한 집주인의 의사 *", "landlordIntent", ["아직 확인하지 못했어요", "모집 의사 확인", "모집하지 않음", "협의 중"], d.landlordIntent, true)}</div>${textArea("집주인과 주고받은 내용 (선택)", "landlordMessage", d.landlordMessage)}<div class="notice">아직 알리지 않았어도 정보를 남길 수 있어요. 통지 수령만으로 매물 공개·방 알림 발송을 진행하지 않습니다.</div>${selectField("집주인 연락 연결 (선택)", "ownerConnection", ["내가 먼저 확인할게요", "집주인이 옥키 연락에 동의했어요"], d.ownerConnection || "내가 먼저 확인할게요")}${inputField("집주인 연락처 · 연락 동의 시만 입력", "ownerPhone", d.ownerPhone, 'type="tel" pattern="0[0-9-]{7,14}"')}${checkField("ownerConsent", "[연락처 입력 시 필수] 집주인에게 연락처 제공·옥키의 확인 연락에 대한 동의를 받았습니다.", d.ownerConsent)}`,
      ) +
      box(
        "04",
        "지금 살고 있는 집의 조건은 어떤가요?",
        `<div class="fields">${inputField("현재 보증금 · 만 원 (선택)", "deposit", d.deposit, 'type="number" min="0" placeholder="모르면 공란"')}${inputField("현재 월세 · 만 원 (선택)", "rent", d.rent, 'type="number" min="0" placeholder="전세·모르면 공란"')}${inputField("현재 관리비·포함 항목 (선택)", "currentFee", d.currentFee, 'maxlength="300"')}</div>${textArea("집 상태·청소·수리 참고사항 (선택)", "conditionNote", d.conditionNote)}${photoField()}<p class="micro">현재 계약의 참고 정보입니다. 다음 임차인의 비용은 집주인·담당 중개사에게 다시 확인합니다. 본인이 제공 가능한 사진만 올려주세요.</p>`,
      ) +
      box(
        "05",
        "확인 연락과 등록",
        inputField(
          "내게 연락 가능한 시간·방법 *",
          "contactTime",
          d.contactTime,
          'required maxlength="150"',
        ) +
          checkField(
            "privacy",
            "[필수] 퇴거 예정 정보 확인을 위한 개인정보 수집·이용에 동의합니다.",
            false,
            true,
          ) +
          checkField(
            "truth",
            "[필수] 입력 내용이 사실이며 날짜 변경·퇴거 취소 시 수정하겠습니다.",
            false,
            true,
          ),
      ),
    "퇴거 예정 정보 " + (id ? "수정하기" : "등록하기"),
  );
}

/* vacancyValidation — 제보의 필수 입력, 연락 방법, 지역 및 동의 항목을 확인하고 오류 메시지를 반환합니다. */
function vacancyValidation(d) {
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !d.name?.trim() ||
    !d.address?.trim() ||
    !d.currentResident ||
    !d.contactTime?.trim() ||
    !d.privacy ||
    !d.truth
  )
    return "현재 거주·연락 방법·필수 입력과 동의를 확인해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !regions.includes(d.region) ||
    !d.type
  )
    return "지역과 주거 형태를 선택해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    !["날짜 확정", "예상 날짜 · 조정 가능", "미정"].includes(d.certainty)
  )
    return "퇴거 일정 상태를 선택해주세요.";
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    d.certainty === "미정" &&
    !d.timingNote?.trim()
  )
    return "일정이 미정이면 예상 시기나 사유를 적어주세요.";
  if (d.certainty !== "미정" && !d.leaveDate) return "퇴거 예정일을 입력해주세요.";
  if (
    d.landlordNotified === "알렸어요" &&
    (!d.notifiedAt || !d.noticeMethod || !d.landlordResponse)
  )
    return "집주인에게 알린 날짜·방법·응답 상태를 입력해주세요.";
  if (!d.landlordNotified || !d.landlordIntent)
    return "집주인에게 알린 여부와 재임대 의사는 각각 선택해주세요.";
  if (d.ownerConnection === "집주인이 옥키 연락에 동의했어요" && (!d.ownerConsent || !d.ownerPhone))
    return "집주인 연락 동의와 연락처를 확인해주세요.";
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return "";
}

/* vacancySave — 검증을 통과한 퇴거 제보를 비공개 신청 내역으로 저장합니다. */
function vacancySave(d, photos = [], id) {
  const error = vacancyValidation(d);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (error)
    return { error };
  const original = vacancyGet(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (
    id &&
    (!original || original.status === "철회·마감")
  )
    return { error: "수정할 수 없는 등록입니다." };
  const clean = {
    ...d,
    role: "곧 퇴거 예정인 현재 거주자",
    forwardPermission: d.ownerConnection === "집주인이 옥키 연락에 동의했어요" && !!d.ownerConsent,
  };
  delete clean.phoneCode;
  if (d.certainty === "미정") clean.leaveDate = "";
  if (d.landlordNotified !== "알렸어요") {
    clean.notifiedAt = "";
    clean.noticeMethod = "";
    clean.landlordResponse = "";
  }
  if (d.landlordNotified !== "알릴 예정이에요") clean.plannedNoticeAt = "";
  if (!clean.forwardPermission) {
    clean.ownerPhone = "";
    clean.ownerConsent = false;
  }
  const a = {
    ...original,
    id: original?.id || nid("V"),
    kind: "tip",
    mode: "vacancy",
    owned: true,
    data: clean,
    photos,
    status: "확인 대기",
    created: original?.created || stamp(),
    review: null,
    history: [
      ...(original?.history || []),
      {
        time: stamp(),
        text: original ? "퇴거 일정·집주인 상태 수정 · 재확인 대기" : "퇴거 예정 정보 비공개 접수",
      },
    ],
  };
  if (
    !writeApps(original ? applications.map((x) => (x.id === a.id ? a : x)) : [a, ...applications])
  )
    return { error: "저장하지 못했어요. 다시 시도해주세요." };
  if (original) {
    const next = alerts.map((n) =>
      n.tipId === id
        ? {
            ...n,
            status: "마감",
            changes: [
              ...(n.changes || []),
              { date: stamp().slice(0, 10), text: "퇴거 예정 정보 수정으로 재확인 전 안내 중단" },
            ],
          }
        : n,
    );
    if (save("alerts", next)) alerts = next;
  }
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return { application: a };
}

/* vacancyEvents — 화면 요소에 필요한 입력·클릭 이벤트를 연결하고 사용자의 동작을 처리합니다. */
function vacancyEvents(id) {
  const f = $("#vacancy-form");
  verification = {};
  wirePhotos(f);
  const original = vacancyGet(id);
  if (original?.photos?.length && !f._photos.length) f._photos = [...original.photos];
  f._drawPhotos?.();
  const sync = () => {
    const known = f.elements.certainty.value !== "미정",
      told = f.elements.landlordNotified.value === "알렸어요",
      planned = f.elements.landlordNotified.value === "알릴 예정이에요",
      contact = f.elements.ownerConnection.value === "집주인이 옥키 연락에 동의했어요";
    f.elements.leaveDate.required = known;
    f.elements.leaveDate.disabled = !known;
    f.elements.timingNote.required = !known;
    for (const name of ["notifiedAt", "noticeMethod", "landlordResponse"]) {
      f.elements[name].required = told;
      f.elements[name].disabled = !told;
    }
    f.elements.plannedNoticeAt.disabled = !planned;
    f.elements.ownerPhone.required = contact;
    f.elements.ownerPhone.disabled = !contact;
    f.elements.ownerConsent.required = contact;
    f.elements.ownerConsent.disabled = !contact;
  };
  f._vacancySync = sync;
  f.onchange = sync;
  sync();
  f.onsubmit = (e) => {
    e.preventDefault();
    sync();
    if (!f.reportValidity()) return;
    if (!verified(f, "phone")) return errorForm(f, "휴대전화 체험 확인을 완료해주세요.");
    if (f._loading) return errorForm(f, "사진 준비가 끝난 뒤 등록해주세요.");
    const result = vacancySave(getData(f), f._photos, id);
    if (result.error) return errorForm(f, result.error);
    save(draftKey(f), {});
    location.hash = "#/vacancy/complete/" + result.application.id;
  };
}

/* vacancyDetail — 해당 화면 또는 화면에 들어갈 정보를 현재 데이터에 맞춰 구성합니다. */
function vacancyDetail(id) {
  const a = vacancyGet(id);
  /* 조건이 충족되지 않거나 별도 처리가 필요한 경우를 먼저 확인합니다. */ if (!a)
    return unavailable();
  const d = a.data;
  /* 앞에서 준비한 결과를 호출한 곳으로 돌려줍니다. */ return `<div class="container">${pageHead("MY VACANCY INFORMATION", "퇴거 예정 정보를 " + (a.status === "철회·마감" ? "철회했어요." : "접수했어요."), "등록 내용은 내 활동에서 확인하고 수정할 수 있어요. 집주인과 협의한 내용이 달라지면 알려주세요.")}${activityTabs("tips")}<div class="activity-content"><div class="summary"><span class="badge">${esc(a.status)}</span><h2>${esc(d.region)} · ${esc(d.type)}</h2><p>퇴거 예정 ${esc(d.leaveDate || d.timingNote)} · ${esc(d.certainty)}</p><p>집주인 통지: ${esc(d.landlordNotified)}${d.notifiedAt ? " / " + esc(d.notifiedAt) + " " + esc(d.noticeMethod) : ""}</p><p>집주인 응답: ${esc(d.landlordResponse || "통지 전")} / 재임대 의사: ${esc(d.landlordIntent)}</p><p class="micro">${esc(a.id)} · 상세 주소·연락처 비공개</p></div><div class="notice">실제 입주 가능일과 다음 계약 조건은 별도 확인합니다. 등록만으로 공개 매물이 되거나 방 알림이 발송되지 않습니다.</div><div class="four-steps">${["정보 접수", "퇴거 일정·집주인 의사 확인", "안내 가능 여부 확인"].map((t, i) => `<div><span>0${i + 1}</span><h3>${t}</h3></div>`).join("")}</div><details class="formbox"><summary>내가 작성한 전체 등록 내용 · 비공개</summary><dl class="consultation-answer-list">${vacancySchema.map(([k, t]) => `<div><dt>${t}</dt><dd>${esc(d[k] || "미입력")}</dd></div>`).join("")}</dl><div class="upload-preview">${(a.photos || []).map((s) => `<img src="${s}" alt="퇴거 예정 집 사진">`).join("")}</div></details><div class="actions">${a.status !== "철회·마감" ? `<a class="btn" href="#/vacancy/edit/${id}">내 퇴거 예정 정보 보기·수정</a><button class="textlink danger" onclick="tipChange('${id}',true)">퇴거 취소 · 등록 철회</button>` : ""}<a class="btn secondary" href="#/activity/tips">내 방 등록 내역</a><button class="textlink" onclick="showHistory('${id}')">진행 기록</button></div></div></div>`;
}

/* vacancyOldProvide, vacancyOldProvideEvents, vacancyOldTipDetail — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldProvide = providePage,
  vacancyOldProvideEvents = provideEvents,
  vacancyOldTipDetail = tipDetail;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
providePage = function (mode) {
  return !mode ? vacancyChoice() : mode === "vacancy" ? vacancyForm() : vacancyOldProvide(mode);
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
provideEvents = function (mode) {
  if (mode === "vacancy") vacancyEvents();
  else vacancyOldProvideEvents(mode);
};

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tipDetail = function (id) {
  return vacancyGet(id) ? vacancyDetail(id) : vacancyOldTipDetail(id);
};

/* vacancyOldTipCard — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldTipCard = tipCard;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tipCard = function (a) {
  return vacancyOldTipCard(a)
    .replace(a.mode === "vacancy" ? "입주 가능" : "<never>", "퇴거 예정")
    .replace("제보 내용·진행 상태 보기", "등록 내용·진행 상태 보기");
};

/* vacancyOldReview — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldReview = reviewTip;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
reviewTip = function (id) {
  vacancyOldReview(id);
  const a = vacancyGet(id);
  if (!a) return;
  const form = $("#review-tip"),
    submit = form.onsubmit;
  const block = document.createElement("div");
  block.innerHTML =
    '<div class="notice">퇴거 통지 수령과 재임대·안내 동의를 구분합니다. 접수 당시 알리지 않았거나 모집 의사가 미확인이어도 안내 전에는 각각 확인해야 해요.</div>' +
    checkField(
      "vacancyIntent",
      "집주인의 다음 임차인 모집 의사를 별도로 확인했습니다.",
      a.review?.vacancyIntent,
    ) +
    checkField(
      "vacancyPermission",
      "집주인의 연락·안내 허용 범위를 별도로 확인했습니다.",
      a.review?.vacancyPermission,
    ) +
    selectField("확인한 실제 주거 유형", "verifiedType", types, a.review?.verifiedType);
  form.prepend(block);
  form.onsubmit = (e) => {
    const d = formData(form);
    if (
      d.status === "안내 가능" &&
      (!d.vacancyIntent || !d.vacancyPermission || !d.date || !d.verifiedType)
    ) {
      e.preventDefault();
      return errorForm(form, "재임대 의사·안내 범위와 실제 입주 가능일을 별도로 확인해주세요.");
    }
    submit(e);
  };
};

/* vacancyOldSnapshot — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldSnapshot = tipSnapshot;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
tipSnapshot = function (a) {
  const snapshot = vacancyOldSnapshot(a);
  if (a.mode === "vacancy" && a.review?.verifiedType) snapshot.type = a.review.verifiedType;
  return snapshot;
};

/* vacancyOldPrepare — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldPrepare = prepareAlert;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
prepareAlert = function (id) {
  const a = vacancyGet(id);
  if (
    a &&
    (!a.review?.vacancyIntent ||
      !a.review?.vacancyPermission ||
      !a.review?.date ||
      !a.review?.verifiedType)
  )
    return toast("재임대 의사·안내 범위·실제 입주 가능일을 먼저 확인해주세요.");
  vacancyOldPrepare(id);
};

/* vacancyOldConfirmSend — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldConfirmSend = confirmSend;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
confirmSend = function (id, waitId) {
  const a = vacancyGet(id);
  if (
    a &&
    (!a.review?.vacancyIntent ||
      !a.review?.vacancyPermission ||
      !a.review?.date ||
      !a.review?.verifiedType)
  )
    return toast("퇴거 예정 정보의 필수 확인이 끝나지 않았어요.");
  vacancyOldConfirmSend(id, waitId);
};

/* vacancyOldHome — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* vacancyOldAbout — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */
const vacancyOldAbout = aboutPage;

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
aboutPage = function () {
  return vacancyOldAbout().replace(
    "중개사 매물과 현재 거주자의 공동거주 모집을 각각 확인해요.",
    "중개사 매물과 현재 거주자의 퇴거 예정 소식을 각각 확인해요. 공동거주 모집은 별도 경로로 받아요.",
  );
};

/* vacancyOldDraftKey — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* vacancyOldRender — 이 구간에서 사용하는 데이터, 설정 또는 상태를 준비합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */

/* 앞에서 준비한 상태를 바탕으로 초기 설정을 적용하거나 기능을 연결합니다. */
