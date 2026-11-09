// 실제 접수는 서버가 검증한 계정에만 저장한다. 체험 신청·초안과 자동 이관하지 않는다.
window.intakeEnabled = true;
waitDraft = {}; waitEdit = null;
let intakeEdit = null;
const intakeFormKinds = {'wait-form':'waiting','registration-broker':'broker','registration-resident':'resident','vacancy-form':'vacancy'};
const intakePending = new WeakMap();
// 로컬 미리보기는 네트워크 요청 없이 디코딩한다. connect-src에 data:를 허용하지 않는다.
function intakePhotoBlob(value) {
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if(!match || match[2].length>1400000)throw new Error('사진 형식 또는 크기를 확인해주세요.');
  const bytes=Uint8Array.from(atob(match[2]),char=>char.charCodeAt(0));
  return new Blob([bytes],{type:match[1]});
}
async function intakeRequest(url, options={}) {
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,signal:AbortSignal.timeout(30000)});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error?.message||'저장하지 못했습니다. 같은 화면에서 다시 시도해주세요.');
  return body;
}
function intakeFormEvents() {
  const f=document.querySelector('#wait-form,#registration-broker,#registration-resident,#vacancy-form');
  if(!f || f.dataset.intakeWired)return;
  f.dataset.intakeWired='true';if(authState.user)f.dataset.intakeOwner=authState.user.id;f.setAttribute('data-no-draft','');
  f.onchange=null; f._vacancySync=null;
  for(const notice of document.querySelectorAll('#main .notice.warning'))if(notice.textContent.includes('체험'))notice.textContent='이 신청은 현재 로그인한 계정에 연결해 저장합니다. 다른 체험 기능의 기록과 구분합니다.';
  const photoLabel=f.elements.photoUpload?.closest('.field')?.querySelector('label');if(photoLabel)photoLabel.textContent='사진 (선택, 최대 5장·한 장당 1MB 이하)';
  const kind=intakeFormKinds[f.id],stepTwo=kind==='waiting'&&!!f.elements.phone;
  if(intakeEdit?.kind===kind) { restoreDraft(f,{...intakeEdit.data,intakeApplicantName:intakeEdit.data.name,intakeListingTitle:intakeEdit.data.title}); f._photos=intakeEdit.photos.map(x=>x.url);if(f._drawPhotos)f._drawPhotos(); }
  // 비공개 원문·제3자 연락처·예전 브라우저 초안을 신규 운영 신청에 섞지 않는다.
  for(const name of ['ownerPhone','ownerConsent','ownerConnection','landlordMessage']) {
    const input=f.elements[name];if(input){const wrapper=input.closest('.field,.check');if(wrapper)wrapper.remove();else input.remove();}
  }
  for(const input of f.querySelectorAll('[name="address"]')) {
    input.placeholder='도로명 또는 지번의 건물 주소만 입력 (동·호수 제외)';
    const label=input.closest('.field')?.querySelector('label');if(label)label.textContent='건물 주소 * · 비공개 (동·호수 제외)';
  }
  for(const input of f.querySelectorAll('[name="min"],[name="max"],[name="currentPeople"],[name="recruitPeople"]')){input.min="1";input.max="120";}
  if(kind!=='broker'&&f.elements.intakeApplicantName)f.elements.intakeApplicantName.required=false;
  for(const el of f.querySelectorAll('[name="privacy"],[name="serviceConsent"],[name="settlementConsent"]')) el.closest('.check')?.remove();
  if(kind!=='waiting'||stepTwo) {
    const fields=intakeFieldsUi[kind];
    const info=document.createElement('section');info.className='formbox';
    const p=document.createElement('p');p.textContent='신청 접수·매칭·안내 및 운영자의 직접 연락을 위해 필수 항목을 수집합니다. 접수/명시적 연장일부터 최대 90일 보관하고 목적 달성·종료·철회·삭제 요청 시 먼저 파기합니다. 거부할 수 있으나 해당 신청은 제한됩니다. 전화번호는 소유 미인증이며 자동 문자 발송은 하지 않습니다.';
    const items=document.createElement('p');items.className='micro';items.textContent='필수: 전화번호, '+fields.filter(x=>x.required).map(x=>x.label).join(', ')+'. 선택: '+fields.filter(x=>!x.required).map(x=>x.label).join(', ')+', 사진. 계정 UUID와 동의·처리 시각도 연결해 저장합니다.';
    const consent=document.createElement('label');consent.className='check';
    const check=document.createElement('input');check.type='checkbox';check.name='intakeConsent';check.required=true;
    consent.append(check,document.createTextNode('[필수] 위 개인정보 수집·이용에 동의합니다.'));
    const optional=document.createElement('label');optional.className='check';
    const optionalCheck=document.createElement('input');optionalCheck.type='checkbox';optionalCheck.name='intakeOptional';
    optional.append(optionalCheck,document.createTextNode('[선택] 추가 조건과 사진을 신청 확인·매칭 안내에 이용하는 데 동의합니다. 같은 기간 보관하며 동의하지 않아도 신청할 수 있습니다.'));
    info.append(p,items,consent,optional);f.insertBefore(info,f.querySelector('.form-submit'));
  }
  if(kind==='vacancy') {
    f.onchange=()=>{
      const known=f.elements.certainty.value!=='미정',told=f.elements.landlordNotified.value==='알렸어요';
      f.elements.leaveDate.required=known;f.elements.leaveDate.disabled=!known;
      f.elements.timingNote.required=!known;
      for(const name of ['notifiedAt','noticeMethod','landlordResponse']){f.elements[name].required=told;f.elements[name].disabled=!told;}
      f.elements.plannedNoticeAt.disabled=f.elements.landlordNotified.value!=='알릴 예정이에요';
    };f.onchange();
  }
  // 기존 폼의 localStorage 저장 및 체험 인증 submit 경로를 대체한다.
  f.onsubmit=async event=>{
    event.preventDefault();
    if(f.dataset.saving==='true'||!f.reportValidity())return;
    if(f._loading)return errorForm(f,'사진 준비가 끝난 뒤 제출해주세요.');
    if(kind==='waiting'&&!stepTwo){
      saveWaitDraft();
      if(!waitDraft.anyRegion&&!waitDraft.regions?.length)return errorForm(f,'희망 지역을 선택해주세요.');
      if(waitDraft.latestDate&&waitDraft.latestDate<waitDraft.date)return errorForm(f,'입주 기간을 확인해주세요.');
      location.hash='/wait/2';return;
    }
    f.dataset.saving='true';const button=f.querySelector('[type="submit"],button:not([type])');if(button)button.disabled=true;
    try {
      const session=await intakeRequest('/api/auth/session');
      if(f.dataset.intakeOwner && f.dataset.intakeOwner!==session.user?.id)throw new Error('로그인 계정이 바뀌었습니다. 화면을 새로 열어주세요.');
      f.dataset.intakeOwner=session.user.id;
      const raw=kind==='waiting'?{...waitDraft,...getData(f),types:new FormData(f).getAll('types')}:getData(f);
      if(raw.intakeApplicantName!==undefined)raw.name=raw.intakeApplicantName;
      if(raw.intakeListingTitle!==undefined)raw.title=raw.intakeListingTitle;
      const optional=f.elements.intakeOptional.checked;
      const data={};
      for(const field of intakeFieldsUi[kind]) {
        if(!optional&&!field.required)continue;
        let value=raw[field.name];
        if(raw[field.name+'Unknown']===true)value=null;
        data[field.name]=value;
      }
      if(kind==='waiting'&&raw.anyRegion)data.regions=[];
      const photos=optional?(f._photos||[]):[];
      if(photos.length>5)throw new Error('사진은 최대 5장까지 올려주세요.');
      const snapshot=JSON.stringify({data,phone:f.elements.phone.value,optional,photos});
      let pending=intakePending.get(f);
      if(!pending||pending.snapshot!==snapshot){pending={snapshot,key:crypto.randomUUID(),media:[]};intakePending.set(f,pending);}
      for(let i=pending.media.length;i<photos.length;i++){
        const existing=intakeEdit?.photos.find(x=>x.url===photos[i]);if(existing){pending.media.push(existing.id);continue;}
        const blob=intakePhotoBlob(photos[i]);
        if(blob.size>1048576)throw new Error('사진을 한 장당 1MB 이하로 줄여주세요.');
        const uploaded=await intakeRequest('/api/intake/media',{method:'POST',headers:{'Content-Type':blob.type},body:blob});pending.media.push(uploaded.id);
      }
      const result=await intakeRequest('/api/intake',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.key},body:JSON.stringify({kind,id:intakeEdit?.kind===kind?intakeEdit.id:undefined,version:intakeEdit?.kind===kind?intakeEdit.version:undefined,data,phone:f.elements.phone.value,consent:true,truth:raw.truth===true,updates:raw.updates===true,optionalConsent:optional,media:pending.media})});
      waitDraft={};waitEdit=null;intakeEdit=null;f.reset();f._photos=[];
      const message=document.createElement('section');message.className='formbox';
      const heading=document.createElement('h1');heading.textContent='신청이 저장되었습니다.';
      const copy=document.createElement('p');copy.textContent='현재 로그인한 계정에 연결했습니다. 신청 번호: '+result.application.id;
      const link=document.createElement('a');link.href='#/account';link.className='btn';link.textContent='내 계정에서 저장 내역 확인';message.append(heading,copy,link);document.querySelector('#main').replaceChildren(message);
    } catch(error){errorForm(f,error.message);}
    finally{f.dataset.saving='false';if(button)button.disabled=false;}
  };
}
async function intakeAccountRecords() {
  const target=document.querySelector('#intake-records');if(!target)return;
  try{const {applications}=await intakeRequest('/api/intake');if(!target.isConnected)return;target.textContent='';for(const a of applications){const p=document.createElement('p');p.textContent=({waiting:'방 알림',broker:'중개사 매물',vacancy:'퇴거 예정',resident:'함께 살 사람 모집'}[a.kind])+' · '+a.id+' · '+new Date(a.created_at).toLocaleDateString('ko-KR');const edit=document.createElement('button');edit.type='button';edit.className='textlink';edit.textContent='내용 확인·수정';edit.addEventListener('click',()=>intakeOpenEdit(a));const remove=document.createElement('button');remove.type='button';remove.className='textlink';remove.textContent='신청 삭제';remove.addEventListener('click',async()=>{if(!window.confirm('신청과 연락처를 삭제할까요?'))return;try{await intakeRequest('/api/intake/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)});await intakeAccountRecords();}catch(error){toast(error.message);}});p.append(edit,remove);target.append(p);}if(!applications.length)target.textContent='저장한 신청이 없습니다.';}catch(error){if(target.isConnected)target.textContent=error.message;}
}

async function intakeOpenEdit(application) {
  try {
    const {application:a}=await intakeRequest('/api/intake?id='+encodeURIComponent(application.id)+'&kind='+encodeURIComponent(application.kind));
    intakeEdit=a;
    if(a.kind==='waiting'){waitDraft={...a.data};location.hash='/wait/1';}
    else location.hash='/provide/'+(a.kind==='vacancy'?'vacancy':a.kind);
  }catch(error){toast(error.message);}
}
async function loadLiveInbox(){const root=document.getElementById('live-inbox');if(!root)return;root.textContent='알림 확인 중…';try{const d=await intakeRequest('/api/inbox');if(!root.isConnected)return;root.replaceChildren();if(!d.notifications.length)root.textContent='조건에 맞는 새 방 알림이 없습니다.';for(const n of d.notifications){const b=document.createElement('button');b.className='btn secondary';b.textContent='새 방 안내 · '+new Date(n.created_at).toLocaleDateString('ko-KR');b.addEventListener('click',async()=>{try{const result=await intakeRequest('/api/inbox?id='+encodeURIComponent(n.id));if(!root.isConnected)return;let panel=root.querySelector('[data-live-detail]');if(!panel){panel=document.createElement('section');panel.dataset.liveDetail='true';root.append(panel);}panel.replaceChildren();const labels={title:'매물',type:'유형',region:'지역',deposit:'보증금(만원)',rent:'월세(만원)',fee:'관리비(만원)',fee_items:'관리비 항목',date:'입주 가능일',min:'최소 거주 개월',max:'최대 거주 개월',kitchen:'주방',bath:'욕실',facilities:'시설',rules:'생활 규칙',office:'중개사무소'};for(const [k,v] of Object.entries(result.listing)){const p=document.createElement('p');p.textContent=labels[k]+': '+(v??'미확인');panel.append(p);}const help=document.createElement('p');help.textContent='방문·계약을 원하시면 표시된 중개사무소에 문의해주세요. 신청자 개인정보와 연락처는 중개사에게 자동 제공되지 않습니다.';panel.append(help);panel.scrollIntoView?.({block:'start'});}catch(e){toast(e.message);}});root.append(b);}}catch(e){if(root.isConnected)root.textContent=e.message;}}
