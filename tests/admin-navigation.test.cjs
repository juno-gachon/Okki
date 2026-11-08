const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const {JSDOM}=require('jsdom');
function setup(fetch){const dom=new JSDOM('<div id="account-admin-access"></div>',{url:'https://okki.example/#/account'});const document=dom.window.document;const c=vm.createContext({document,$:s=>document.querySelector(s),fetch,AbortSignal});vm.runInContext(fs.readFileSync('src/auth.js','utf8'),c);vm.runInContext("authState={status:'ready',user:{id:'synthetic'}}",c);return {c,document,run:()=>vm.runInContext('accountAdminAccess()',c)};}
test('management entry appears only after server authorization; failures stay hidden',async()=>{
 for(const [ok,admin,visible] of [[true,true,true],[false,false,false],[true,false,false]]){
 const s=setup(async(url,options)=>{assert.equal(url,'/api/admin?session=1');assert.equal(options.cache,'no-store');return {ok,json:async()=>({admin})}});await s.run();const link=s.document.querySelector('a');assert.equal(Boolean(link),visible);if(link){assert.equal(link.textContent,'운영자 관리');assert.equal(link.getAttribute('href'),'/admin');}
 }
 const s=setup(async()=>{throw new Error('network')});await s.run();assert.equal(s.document.querySelector('a'),null);
});
test('delayed operator check cannot expose entry after logout, account switch or rerender',async()=>{
 for(const change of ["authState.user=null;authRevision++", "authState.user={id:'other'}", "document.getElementById('account-admin-access').replaceWith(document.createElement('div'))"]){let resolve;const s=setup(()=>new Promise(r=>resolve=r));const pending=s.run();vm.runInContext(change,s.c);resolve({ok:true,json:async()=>({admin:true})});await pending;assert.equal(s.document.querySelector('a'),null);}
});
