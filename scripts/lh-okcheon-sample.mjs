// Read-only diagnostic; the service key and request URLs must never be printed.
const key = process.env.DATA_GO_KR_KEY;
if (!key) throw new Error('DATA_GO_KR_KEY is missing');
async function call(path, parameters) {
  const url = new URL(`https://apis.data.go.kr/B552555/${path}`);
  for (const [k, v] of Object.entries({ ServiceKey: key, ...parameters })) url.searchParams.set(k, v);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Upstream HTTP error');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Unexpected upstream response');
  return data;
}
try {
  const rows = [];
  let expected = null;
  for (let page = 1; page <= 20; page++) {
    const data = await call('lhLeaseNoticeInfo1/lhLeaseNoticeInfo1', { PG_SZ: '100', PAGE: String(page), UPP_AIS_TP_CD: '06', PAN_ST_DT: '20260101', PAN_ED_DT: '20261110' });
    const part = data.find(x => Array.isArray(x.dsList));
    if (part?.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('List query failed');
    rows.push(...part.dsList);
    expected = Number(part.dsList[0]?.ALL_CNT ?? 0);
    if (!part.dsList.length || rows.length >= expected) break;
  }
  if (rows.length < expected) throw new Error('Incomplete pagination');
  const candidates = rows.filter(x => x.PAN_NM?.includes('옥천') || (x.CNP_CD_NM === '충청북도' && x.PAN_NM?.includes('남부')));
  console.log(JSON.stringify({ searched: rows.length, candidates: candidates.length }));
  for (const notice of candidates) {
    const params = Object.fromEntries(['SPL_INF_TP_CD', 'CCR_CNNT_SYS_DS_CD', 'PAN_ID', 'UPP_AIS_TP_CD', 'AIS_TP_CD'].map(k => [k, notice[k]]));
    if (Object.values(params).some(x => !x)) continue;
    const data = await call('lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1', params);
    const result = data.find(x => x.resHeader);
    if (result?.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('Supply query failed');
    const supply = Object.entries(result).filter(([k, v]) => /^dsList\d+$/.test(k) && Array.isArray(v)).flatMap(([, v]) => v);
    if (!notice.PAN_NM.includes('옥천') && !supply.some(x => x.SBD_LGO_NM?.includes('옥천'))) continue;
    console.log(JSON.stringify({ notice, supply }).replaceAll(key, '[redacted]').replaceAll(encodeURIComponent(key), '[redacted]'));
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.name, cause: error.cause?.code || null }));
  process.exitCode = 1;
}
