/* Sensitive data stays in this page's DOM only. Every request checks server authorization. */
const adminRoot=document.getElementById('admin-root');
const adminLabels={waiting:'대기 중',received:'접수',reviewing:'확인 중',needs_update:'보완 필요',reviewed:'내용 확인 완료',not_required:'중개사 관리',view:'상세 조회',contact:'연락',review:'확인 상태',intake_follow_up:'신청 확인',attempted:'연락 시도',unreachable:'연결 안 됨',connected:'통화 완료',follow_up:'추가 연락 필요',closed:'연락 종료',accepted:'알림 접수',delivered:'알림함 저장 완료',failed:'전달 실패',unknown:'전달 미확인',web:'웹 알림',sms:'문자'};
const labelOf=value=>adminLabels[value]||value;
const dateOf=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
let adminKind='waiting',adminOffset=0,adminRevision=0;
function el(tag,text,parent=adminRoot){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent.append(n);return n;}
async function api(params={},body){const r=await fetch('/api/admin?'+new URLSearchParams({kind:adminKind,...params}),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok){if([401,403].includes(r.status))adminRoot.replaceChildren();throw new Error(d.error?.message||'요청에 실패했습니다.');}return d;}
function button(text,fn,parent){const b=el('button',text,parent);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await fn();}catch(e){el('p',e.message).setAttribute('role','alert');}finally{b.disabled=false;}});return b;}
function loading(){const p=el('p','내역을 불러오는 중입니다…');p.setAttribute('role','status');return p;}
function matchConditions(m,parent){button('매칭 조건 보기',async()=>{const d=await api({kind:'matches',match:m.id});const box=el('div',undefined,parent);el('p','현재 저장된 조건 비교입니다. 매칭 당시 조건은 별도 보관되지 않아 이후 수정 내용이 반영됩니다.',box);const h=d.request,b=d.listing;if(!h||!b){el('p','삭제된 신청 또는 매물로 조건을 확인할 수 없습니다.',box);return;}
 const show=(label,want,actual,ok)=>el('p',label+' · 신청: '+want+' / 매물: '+actual+' · '+(ok?'충족':'현재 불충족·미확인'),box);
 show('지역',h.any_region?'지역 무관':(h.regions||[]).join(', '),b.region,h.any_region||(h.regions||[]).includes(b.region));
 show('방 유형',(h.types||[]).join(', '),b.type,(h.types||[]).includes(b.type));
 show('보증금',h.deposit+'만원 이하',b.deposit+'만원',h.deposit!=null&&b.deposit!=null&&b.deposit<=h.deposit);
 show('월 고정비',h.budget+'만원 이하','월세 '+b.rent+' + 관리비 '+b.fee+'만원',b.rent!=null&&b.fee!=null&&b.rent+b.fee<=h.budget);
 show('입주 가능일',(h.latest_date||h.date)+'까지',b.date,b.date!=null&&b.date<=(h.latest_date||h.date));
 show('단독 주거',h.sharing||'제한 없음',b.type,h.sharing!=='단독 주거만'||b.type==='원룸');
 show('무차량 근무 지역',h.transport?.includes('무차량')?h.work_region:'제한 없음',b.region,!h.transport?.includes('무차량')||b.region===h.work_region);
 el('p','자동 매칭은 유효한 대기 신청·모집 중인 중개사 매물·정지되지 않은 제공자·서로 다른 소유자를 대상으로 합니다. 생활 자유문구와 통근 시간은 자동 판정하지 않습니다.',box);
 },parent);}
function matchRow(m){const row=el('section');row.className='admin-match';const info=el('div',undefined,row);el('strong',labelOf(m.channel)+' · '+labelOf(m.status),info);el('p',dateOf(m.created_at),info);matchConditions(m,row);const links=el('div',undefined,row);button('방 구하기 신청 · '+m.housing_request_id.slice(0,8),()=>{adminKind='waiting';return detail(m.housing_request_id);},links);button('매물 신청 · '+m.listing_id.slice(0,8),()=>{adminKind='broker';return detail(m.listing_id);},links);}
async function list(){const revision=++adminRevision;const kind=adminKind;adminRoot.replaceChildren();const tabs=el('div');for(const [k,label] of Object.entries({waiting:'방 구하기',broker:'중개사 매물',vacancy:'퇴거 예정',resident:'함께 살 사람 모집',matches:'매칭 내역'}))button(label,()=>{adminKind=k;adminOffset=0;return list();},tabs).setAttribute('aria-pressed',String(k===kind));
 const pending=loading();let data;try{data=await api({kind,offset:adminOffset});}catch(e){if(revision!==adminRevision)return;pending.remove();el('p',e.message).setAttribute('role','alert');button('다시 불러오기',list);return;}if(revision!==adminRevision)return;pending.remove();
 const rows=kind==='matches'?data.matches:data.applications;
 if(kind==='matches')el('p','조건이 맞아 생성된 알림 기록입니다. 웹 알림함 저장은 열람·문의·계약 완료를 뜻하지 않습니다.');
 if(!rows.length)el('p',kind==='matches'?'기록된 매칭 내역이 없습니다.':'접수 내역이 없습니다.');
 for(const row of rows){if(kind==='matches'){matchRow(row);continue;}const line=el('section');el('p',dateOf(row.created_at)+' · '+labelOf(row.review_status||row.status),line);button('신청 상세 · '+row.id.slice(0,8),()=>detail(row.id),line);}
 button('새로고침',list);if(adminOffset)button('이전',()=>{adminOffset-=50;return list();});if(rows.length===50)button('다음',()=>{adminOffset+=50;return list();});}
async function detail(id){const revision=++adminRevision;const kind=adminKind;adminRoot.replaceChildren();button('목록',list);const pending=loading();let d;try{d=await api({kind,id});}catch(e){if(revision!==adminRevision)return;pending.remove();throw e;}if(revision!==adminRevision)return;adminRoot.replaceChildren();button('목록',list);el('h2','신청 상세');el('p','신청 번호: '+id);el('p','전화번호: '+(d.contact?.phone_e164||'없음')+' (소유 미인증)');const fields=el('div');fields.className='admin-fields';for(const f of d.fields){const item=el('p',undefined,fields);item.className='admin-field';el('strong',f.label,item);el('span',Array.isArray(f.value)?f.value.join(', '):typeof f.value==='boolean'?(f.value?'예':'아니요'):f.value??'미확인',item);}
 const form=el('form');const label=el('label','연락 결과 ',form);const result=el('select',undefined,label);for(const [value,text] of Object.entries({attempted:'연락 시도',unreachable:'연결 안 됨',connected:'통화 완료',follow_up:'추가 연락 필요',closed:'연락 종료'})){const o=el('option',text,result);o.value=value;}
 const noteLabel=el('label','운영 메모 (개인정보 추가 입력 금지)',form);const note=el('textarea',undefined,noteLabel);note.maxLength=1000;
 button('연락 결과 저장',async()=>{await api({kind}, {id,version:d.application.version,action:'contact',result:result.value,note:note.value});await detail(id);},form);
 if(['resident','vacancy'].includes(adminKind)){const l=el('label','확인 상태 ',form);const review=el('select',undefined,l);for(const [v,t] of Object.entries({received:'접수',reviewing:'확인 중',needs_update:'보완 필요',reviewed:'내용 확인 완료'})){const o=el('option',t,review);o.value=v;}review.value=d.application.review_status;button('확인 상태 저장',async()=>{await api({kind}, {id,version:d.application.version,action:'review',result:review.value,note:note.value});await detail(id);},form);}
 form.addEventListener('submit',e=>e.preventDefault());el('h2','운영 이력');for(const h of d.history)el('p',dateOf(h.created_at)+' · '+labelOf(h.action)+' · '+labelOf(h.result)+' · '+h.note);el('h2','매칭 · 알림 내역');if(!d.matches.length)el('p','기록된 알림 내역이 없습니다.');for(const m of d.matches){matchConditions(m,adminRoot);el('p',labelOf(m.channel)+' · '+labelOf(m.status)+' · '+(m.delivered_at?dateOf(m.delivered_at):'전달 미확인'));button('방 구하기 신청 '+m.housing_request_id,()=>{adminKind='waiting';return detail(m.housing_request_id);});button('매물 '+m.listing_id,()=>{adminKind='broker';return detail(m.listing_id);});}}
list().catch(e=>el('p',e.message));
window.addEventListener('pagehide',()=>adminRoot.replaceChildren());
