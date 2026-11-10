export function officialLhUrl(value) {
  try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='apply.lh.or.kr'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&u.pathname==='/lhapply/apply/wt/wrtanc/selectWrtancInfo.do'?u.href:null;}catch{return null;}
}
export function dateOnly(value) {
  const match=String(value??'').match(/^(\d{4})[.-]?(\d{2})[.-]?(\d{2})$/);if(!match)return null;
  const value2=match.slice(1).join('-');const d=new Date(value2+'T00:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().startsWith(value2)?value2:null;
}
// Unknown dates must not become an open application window. Source cancellation/closure wins.
export function housingStatus(notice, now=new Date()) {
  const source=notice.source_status??'';
  if(/취소/.test(source)||/^\[취소공고\]/.test(notice.title??''))return '취소';
  if(/접수마감|모집완료|접수종료/.test(source))return '접수 마감';
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const schedules=notice.schedules??[];
  if(schedules.length&&schedules.every(s=>s.end&&s.end<today))return '접수 마감';
  if(schedules.length&&schedules.every(s=>s.start&&s.start>today))return '신청 전';
  if(/접수중/.test(source))return '신청 중';
  if(/접수예정|접수전/.test(source))return '신청 전';
  // Date-only schedules cannot assert opening hours on their boundary days.
  if(schedules.some(s=>s.start&&s.end&&s.start<today&&today<s.end))return '신청 중';
  if(schedules.some(s=>s.start===today||s.end===today))return '접수 시간 확인';
  return '접수 일정 확인';
}
