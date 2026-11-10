// Read-only probe. Never log API keys, credential-bearing URLs, or network error messages.
const key = process.env.DATA_GO_KR_KEY;
if (!key) throw new Error('DATA_GO_KR_KEY is missing');
async function query(path, params) {
  const url = new URL(`https://apis.data.go.kr/B552555/${path}`);
  for (const [name, value] of Object.entries({ ServiceKey: key, ...params })) url.searchParams.set(name, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { throw new Error(`Non-JSON response, HTTP ${response.status}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return data;
}
try {
  const all = [];
  let total;
  for (let page = 1; page <= 10; page++) {
    const data = await query('lhLeaseNoticeInfo1/lhLeaseNoticeInfo1', { PG_SZ: '100', PAGE: String(page), UPP_AIS_TP_CD: '06', PAN_NT_ST_DT: '2026.01.01', CLSG_DT: '2026.11.10' });
    const envelope = data.find(x => Array.isArray(x.dsList));
    if (!envelope || envelope.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('Unexpected list response');
    const rows = envelope.dsList;
    if (page === 1) console.log(JSON.stringify({ effectiveSearch: data.find(x => x.dsSch)?.dsSch, header: envelope.resHeader, fields: Object.keys(rows[0] || {}) }));
    all.push(...rows);
    total = Number(rows[0]?.ALL_CNT ?? 0);
    if (!rows.length || all.length >= total) break;
  }
  const happy = all.filter(x => x.AIS_TP_CD_NM === '행복주택');
  const local = all.filter(x => x.CNP_CD_NM === '충청북도');
  console.log(JSON.stringify({ total, fetched: all.length, unique: new Set(all.map(x => x.PAN_ID)).size, happy: happy.length, chungbuk: local.length, chungbukHappy: local.filter(x => x.AIS_TP_CD_NM === '행복주택').length, okcheonTitle: all.filter(x => x.PAN_NM?.includes('옥천')).map(x => ({ title: x.PAN_NM, type: x.AIS_TP_CD_NM, status: x.PAN_SS })), happyExamples: happy.slice(0, 3).map(x => ({ title: x.PAN_NM, region: x.CNP_CD_NM, status: x.PAN_SS })) }));
  const selected = happy.find(x => x.SPL_INF_TP_CD && x.CCR_CNNT_SYS_DS_CD && x.PAN_ID && x.UPP_AIS_TP_CD) || happy[0];
  if (!selected) throw new Error('No happiness housing notice available for supply test');
  const params = Object.fromEntries(['SPL_INF_TP_CD', 'CCR_CNNT_SYS_DS_CD', 'PAN_ID', 'UPP_AIS_TP_CD', 'AIS_TP_CD'].map(k => [k, selected[k]]));
  const supply = await query('lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1', params);
  const supplyEnvelope = supply.find(x => Array.isArray(x.dsList01));
  if (!supplyEnvelope || supplyEnvelope.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('Unexpected supply response');
  const supplyRows = supplyEnvelope.dsList01;
  console.log(JSON.stringify({ supplyNotice: selected.PAN_NM, supplyCount: supplyRows.length, fieldLabels: supplyEnvelope.dsList01Nm, sample: supplyRows[0] }).replaceAll(key, '[redacted]').replaceAll(encodeURIComponent(key), '[redacted]'));
} catch (error) {
  // Fetch errors may contain the full URL. Report only a safe category.
  console.error(JSON.stringify({ error: error.name, cause: error.cause?.code || null, description: error.name === 'Error' ? error.message : 'Network request failed' }));
  process.exitCode = 1;
}
