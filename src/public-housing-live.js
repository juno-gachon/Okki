/* Verified public LH catalog. External text goes through textContent, never HTML interpolation. */
'use strict';
async function renderLivePublicHousing(page,id,scroll) {
  nav('public');
  const root=document.querySelector('#main');root.replaceChildren();
  const container=document.createElement('div');container.className='container public-page';root.append(container);
  const add=(parent,tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;};
  const link=(parent,text,url)=>{const a=add(parent,'a',text,'textlink');a.href=url;return a;};
  const safeSource=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='apply.lh.or.kr'&&!u.username&&!u.password&&u.pathname==='/lhapply/apply/wt/wrtanc/selectWrtancInfo.do'?u.href:null;}catch{return null;}};
  const checked=value=>{const d=new Date(value);return Number.isNaN(d.valueOf())?'확인 시각 미상':d.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});};
  const shown=value=>value===null||value===undefined||value===''?'미확인 · 원문 확인':String(value);
  add(container,'h1','옥천군 공공임대 공고');
  add(container,'p','행복주택·국민임대 등 옥천군 소재지가 확인된 LH 공고와 공급정보입니다.');
  add(container,'p','수동으로 확인한 자료입니다. 자동 갱신과 공공주택 알림은 아직 제공하지 않습니다. 신청 전 LH 원문에서 최신 일정과 자격을 확인해주세요.','notice');
  const loading=add(container,'p','공고를 불러오는 중입니다.');loading.setAttribute('role','status');
  document.title='옥천 공공임대 공고 | 옥키';
  if(scroll){root.focus();window.scrollTo(0,0);}
  try{
    const detail=page==='notice'&&id;
    const response=await fetch('/api/public-housing'+(detail?'?id='+encodeURIComponent(id):''),{cache:'no-store'});
    if(!response.ok)throw new Error();
    const data=await response.json();if(!container.isConnected)return;loading.remove();
    const notices=data.notices;if(!Array.isArray(notices))throw new Error();
    if(detail)link(container,'← 공고 목록','#/public');
    if(data.truncated)add(container,'p','표시 한도를 초과했습니다. 전체 공고는 LH 원문에서 확인해주세요.','notice');
    const showCard=(parent,n,full=false)=>{
      const card=add(parent,'article',undefined,'soft-card');
      add(card,'span',n.display_status,'badge');add(card,'h2',n.title);
      add(card,'p',n.housing_category+' · 원문 상태: '+n.source_status);
      add(card,'p','공고일: '+shown(n.posted_on)+' / 공고 마감일: '+shown(n.closes_on),'micro');
      add(card,'p','마지막 확인: '+checked(n.checked_at)+' (한국시간)','micro');
      if(Date.now()-Date.parse(n.checked_at)>86400000)add(card,'p','마지막 확인 후 하루 이상 지났습니다. 현재 상태는 원문에서 다시 확인해주세요.','notice');
      const source=safeSource(n.source_url);if(source){const a=link(card,'LH 원문·첨부 공고문 확인 ↗',source);a.target='_blank';a.rel='noopener noreferrer';}
      if(!full){add(card,'p',[...new Set(n.supplies.map(s=>s.complex_name))].join(' · '));link(card,'옥천 공급정보·접수 안내 보기','#/public/notice/'+encodeURIComponent(n.id));return;}
      add(card,'h3','접수 일정과 신청 안내');
      if(!n.schedules.length)add(card,'p','옥천 단지에 적용되는 접수 시작·종료 시각을 자동 확인하지 못했습니다. 공고 마감일을 접수 시작일이나 대상별 접수 마감 시각으로 대신하지 않습니다. 원문에서 대상·순위별 일정과 접수 방법을 확인해주세요.','notice');
      for(const s of n.schedules){add(card,'h4',s.complex);add(card,'p','접수기간: '+shown(s.label));add(card,'p','서류접수: '+shown(s.documents)+' / 결과 발표: '+shown(s.results)+' / 계약기간: '+shown(s.contract));}
      add(card,'p','신청 대상·소득·자산·무주택 기준·우선순위·제출서류는 공고문 기준입니다. 이 화면은 신청자격 충족이나 당첨을 보장하지 않습니다.');
      add(card,'h3','옥천군 공급정보');
      add(card,'p','통합공고의 다른 지역 공급은 제외했습니다. 모집 수에는 예비입주자가 포함될 수 있으며 현재 빈집 수가 아닙니다.');
      for(const name of [...new Set(n.supplies.map(s=>s.complex_name))]){
        const items=n.supplies.filter(s=>s.complex_name===name);add(card,'h4',name);add(card,'p',items[0].address);
        const wrap=add(card,'div',undefined,'ph-live-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',name+' 공급정보 표');
        const table=add(wrap,'table');add(table,'caption',name+' 주택형별 공급정보');const head=add(table,'thead');const tr=add(head,'tr');
        for(const h of ['주택형·대상','전용면적(㎡)','공급면적(㎡)','세대수','이번 모집 수','보증금(원)','월임대료(원)']){const th=add(tr,'th',h);th.scope='col';}
        const body=add(table,'tbody');for(const s of items){const row=add(body,'tr');for(const k of ['housing_type','exclusive_area','supply_area','household_count','recruitment_count','deposit_text','rent_text'])add(row,'td',shown(s[k]));}
      }
      add(card,'p','관리비·공과금 및 보증금 전환조건은 별도 확인이 필요합니다. ‘공고문 참조’는 0원이 아닙니다.','micro');
      add(card,'h3','원문 안내사항');
      if(!n.notes.length)add(card,'p','추가 안내는 LH 원문에서 확인해주세요.');
      for(const note of n.notes)add(card,'p',note,'ph-live-note');
      add(card,'h3','첨부 공고문');
      for(const name of n.documents)add(card,'p',name);
      add(card,'p','위 LH 원문 링크의 공고문 영역에서 파일을 열어주세요. 정정·취소 공고와 변경사항도 함께 확인해주세요.');
    };
    if(detail){if(!notices.length)add(container,'p','공고를 찾을 수 없습니다.');else showCard(container,notices[0],true);return;}
    const filters=add(container,'div',undefined,'fields');
    const typeLabel=add(filters,'label','주택 유형');const type=add(typeLabel,'select');for(const value of ['전체',...new Set(notices.map(n=>n.housing_category))]){const o=add(type,'option',value);o.value=value;}
    const statusLabel=add(filters,'label','모집 상태');const status=add(statusLabel,'select');for(const value of ['전체','신청 전','신청 중','접수 마감','취소','접수 시간 확인','접수 일정 확인']){const o=add(status,'option',value);o.value=value;}
    const list=add(container,'div',undefined,'two-grid section');
    const paint=()=>{list.replaceChildren();const filtered=notices.filter(n=>(type.value==='전체'||n.housing_category===type.value)&&(status.value==='전체'||n.display_status===status.value));for(const n of filtered)showCard(list,n);if(!filtered.length)add(list,'p',notices.length?'선택한 조건에 해당하는 공고가 없습니다.':'아직 저장된 공고가 없습니다. 현재 모집 자체가 없다는 뜻은 아닙니다.');};
    type.addEventListener('change',paint);status.addEventListener('change',paint);paint();
  }catch{
    if(!container.isConnected)return;loading.remove();add(container,'p','공고를 불러오지 못했습니다. 공고가 없는 것으로 처리하지 않았습니다.','notice');
    const retry=add(container,'button','다시 불러오기','btn');retry.addEventListener('click',()=>renderLivePublicHousing(page,id,false));
  }
}
