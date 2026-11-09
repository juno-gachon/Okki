const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const vm=require('vm');const {JSDOM}=require('jsdom');
test('admin matching tab ignores delayed application response and displays match links',async()=>{
 const dom=new JSDOM('<div id="admin-root"></div>');const pending=[];const c=vm.createContext({document:dom.window.document,window:dom.window,URLSearchParams,AbortSignal,fetch:url=>new Promise(resolve=>pending.push({url,resolve}))});vm.runInContext(fs.readFileSync('src/admin.js','utf8'),c);
 assert.match(dom.window.document.body.textContent,/불러오는 중/);const load=vm.runInContext("adminKind='matches';list()",c);assert.match(pending[1].url,/kind=matches/);
 pending[1].resolve({ok:true,json:async()=>({matches:[{id:'m',housing_request_id:'request-1',listing_id:'listing-1',created_at:'2026-11-09',channel:'web',status:'delivered'}]})});await load;
 pending[0].resolve({ok:true,json:async()=>({applications:[{id:'obsolete',created_at:'2026-11-09',status:'waiting'}]})});await new Promise(r=>setImmediate(r));
 assert.doesNotMatch(dom.window.document.body.textContent,/obsolete/);assert.match(dom.window.document.body.textContent,/알림함 저장 완료/);assert.match(dom.window.document.body.textContent,/매물 신청/);assert.equal(dom.window.document.querySelector('[role=status]'),null);
});
