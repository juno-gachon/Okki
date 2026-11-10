// Read-only inspection: never emit the key or a credential-bearing request URL.
const key = process.env.DATA_GO_KR_KEY;
if (!key) throw new Error('DATA_GO_KR_KEY is missing');
async function request(path, params) {
  const url = new URL(`https://apis.data.go.kr/B552555/${path}`);
  for (const [k, v] of Object.entries({ ServiceKey: key, ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();
  if (!Array.isArray(result)) throw new Error('Invalid response');
  return result;
}
try {
  const rows = [];
  let expected = null;
  for (let page = 1; page <= 10; page++) {
    const data = await request('lhLeaseNoticeInfo1/lhLeaseNoticeInfo1', { PG_SZ: '100', PAGE: String(page), UPP_AIS_TP_CD: '06', PAN_ST_DT: '20260101', PAN_ED_DT: '20261110' });
    const result = data.find(x => Array.isArray(x.dsList));
    if (!result || result.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('Invalid list response');
    if (page === 1) console.log(JSON.stringify({ search: data.find(x => x.dsSch)?.dsSch }));
    rows.push(...result.dsList);
    expected = Number(result.dsList[0]?.ALL_CNT ?? 0);
    if (!result.dsList.length || rows.length >= expected) break;
  }
  const targets = rows.filter(x => x.CNP_CD_NM === '충청북도' || x.PAN_NM?.includes('옥천') || x.CNP_CD_NM === '전국');
  console.log(JSON.stringify({ total: expected, fetched: rows.length, targets: targets.length }));
  for (const row of targets) {
    const params = Object.fromEntries(['SPL_INF_TP_CD', 'CCR_CNNT_SYS_DS_CD', 'PAN_ID', 'UPP_AIS_TP_CD', 'AIS_TP_CD'].map(k => [k, row[k]]));
    if (Object.values(params).some(x => !x)) { console.log(JSON.stringify({ title: row.PAN_NM, error: 'missing supply parameters' })); continue; }
    try {
      const data = await request('lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1', params);
      const envelope = data.find(x => x.resHeader);
      if (envelope?.resHeader?.[0]?.SS_CODE !== 'Y') throw new Error('Invalid supply response');
      const lists = Object.entries(envelope).filter(([name, value]) => /^dsList\d+$/.test(name) && Array.isArray(value));
      const names = lists.flatMap(([, items]) => items.map(x => x.SBD_LGO_NM).filter(Boolean));
      console.log(JSON.stringify({ title: row.PAN_NM, region: row.CNP_CD_NM, status: row.PAN_SS, type: row.AIS_TP_CD_NM, supplyCount: lists.reduce((n, [, items]) => n + items.length, 0), complexes: [...new Set(names)] }).replaceAll(key, '[redacted]'));
    } catch { console.log(JSON.stringify({ title: row.PAN_NM, error: 'supply unavailable' })); }
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.name, cause: error.cause?.code || null }));
  process.exitCode = 1;
}
