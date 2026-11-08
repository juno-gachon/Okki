import 'server-only';
import { intakeFields } from '../shared/intake-fields.mjs';
import { AuthFailure } from './auth-input.mjs';
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const regions = ['옥천읍','동이면','안남면','안내면','청성면','청산면','이원면','군서면','군북면'];
const bad = message => { throw new AuthFailure(400,'INVALID_INPUT',message); };
export function validateIntake(body, key) {
  if (!body || !uuid.test(key || '') || !intakeFields[body.kind] || !body.data || Array.isArray(body.data)) bad('입력 내용을 확인해주세요.');
  if (body.id && (!uuid.test(body.id) || !Number.isInteger(body.version) || body.version < 1)) bad('수정할 신청을 다시 불러와주세요.');
  if (body.consent !== true) bad('필수 개인정보 수집·이용에 동의해주세요.');
  const phone = typeof body.phone === 'string' ? body.phone.replace(/[ -]/g,'') : '';
  if (!/^0\d{8,10}$/.test(phone)) bad('연락 가능한 전화번호를 확인해주세요.');
  const row = {};
  // 허용된 열만 구성한다. 클라이언트의 소유자·역할·시각·검증 여부는 DB에 전달하지 않는다.
  for (const field of intakeFields[body.kind]) {
    let value = body.data[field.name];
    if(!field.required && body.optionalConsent!==true) value=undefined;
    if (field.kind === 'boolean') value = value === true;
    else if (field.kind === 'array') {
      value = value ?? [];
      if (!Array.isArray(value) || value.length > 9 || value.some(v=>typeof v!=='string' || v.length>40) || new Set(value).size!==value.length) bad(field.label+'을 확인해주세요.');
    } else if (value === undefined || value === null || value === '') value = null;
    else if (field.kind.includes('number') || field.kind === 'unknown') {
      if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value)>100000) bad(field.label+'을 확인해주세요.');
      value = Number(value);
    } else {
      const max=field.name==='workVillage'?40:['must','preferences'].includes(field.name)?500:field.name==='name'?40:field.kind.includes('textarea')?2000:300;
      if (typeof value !== 'string' || value.length > max) bad(field.label+'을 확인해주세요.');
      value = value.trim() || null;
      if (value && field.kind.includes('date') && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) bad('날짜를 확인해주세요.');
    }
    if (field.required && !field.conditional && !field.kind.startsWith('unknown') && value === null) bad(field.label+'을 입력해주세요.');
    if (value && field.items && !field.items.includes(value)) bad(field.label+'을 선택해주세요.');
    row[field.column] = value;
  }
  if (body.kind==='waiting') {
    if (!row.any_region && !row.regions.length || row.regions.some(x=>!regions.includes(x))) bad('희망 지역을 선택해주세요.');
    if (row.any_region) row.regions=[];
    if (row.work_region && !regions.includes(row.work_region)) bad('근무 지역을 확인해주세요.');
    if (row.types.some(x=>!['셰어하우스','룸메이트','원룸','여유방','하숙'].includes(x))) bad('주거 형태를 확인해주세요.');
    if (row.latest_date && row.latest_date<row.date) bad('입주 기간을 확인해주세요.');
    if (row.commute!==null && (row.commute<1 || row.commute>300)) bad('통근 시간을 확인해주세요.');
  } else {
    if (!regions.includes(row.region)) bad('지역을 선택해주세요.');
    if (row.max && row.max<row.min) bad('계약 기간을 확인해주세요.');
    if (body.kind==='vacancy' && (!row.current_resident || row.certainty!=='미정' && !row.leave_date || row.certainty==='미정' && !row.timing_note)) bad('거주 여부와 퇴거 일정을 확인해주세요.');
    if(body.kind==='vacancy'&&row.landlord_notified==='알렸어요'&&(!row.notified_at||!row.notice_method||!row.landlord_response))bad('집주인에게 알린 날짜·방법·응답을 확인해주세요.');
    if (body.kind==='resident' && row.authority==='소유자이며 직접 거주') bad('집주인 직접 접수는 현재 지원하지 않습니다.');
  }
  for(const name of ['min','max','current_people','recruit_people'])if(row[name]!==undefined&&row[name]!==null&&(row[name]<1||row[name]>120))bad('기간과 인원은 1~120 범위로 입력해주세요.');
  if(body.kind!=='waiting'&&body.truth!==true)bad('입력 정보와 등록 권한이 사실임을 확인해주세요.');
  row.attested_truth=body.truth===true;row.attested_updates=body.updates===true;
  const media=body.media??[];
  if (!Array.isArray(media) || media.length>5 || new Set(media).size!==media.length || media.some(v=>!uuid.test(v)) || body.kind==='waiting' && media.length) bad('사진을 확인해주세요.');
  if (media.length && body.optionalConsent!==true) bad('사진 이용에 선택 동의가 필요합니다.');
  return {kind:body.kind,id:body.id??null,version:body.version??null,data:row,phone:'+82'+phone.slice(1),optional:body.optionalConsent===true,media};
}
