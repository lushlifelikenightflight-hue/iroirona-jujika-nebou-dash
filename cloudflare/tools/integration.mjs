import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8790',origin=new URL(base).origin;let checks=0;
let cookie='';
if(process.env.TEST_AUTH==='true'){
 const login=await fetch(base+'/admin/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'CF-Connecting-IP':'192.0.2.3'},body:JSON.stringify({password:'local QA password 2026 only!'})});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
}
async function get(path,options={}){return fetch(base+path,{redirect:'manual',...options,headers:{...(cookie?{Cookie:cookie}:{}),...options.headers}});}
async function setting(){const r=await get('/admin/api/settings');assert.equal(r.status,200);return r.json();}
async function mutate(path,body,method='PUT'){return get(path,{method,headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});}
async function save(current,patch){const r=await mutate('/admin/api/settings',{revision:current.revision,enabled:current.enabled,startsAt:current.startsAt,endsAt:current.endsAt,beforeMessage:current.beforeMessage,afterMessage:current.afterMessage,...patch});assert.equal(r.status,200,await r.clone().text());return r.json();}
function ok(name){checks++;console.log(`PASS ${name}`);}
let initial=await setting(),current=initial;
try{
  current=await save(current,{enabled:false,startsAt:null,endsAt:null});
  assert.equal((await get('/')).status,403);assert.equal((await get('/assets/portrait.png')).status,403);ok('初期非公開と画像の直接アクセス拒否');
  const now=Date.now();current=await save(current,{enabled:true,startsAt:new Date(now+60000).toISOString(),endsAt:new Date(now+120000).toISOString()});
  assert.equal((await get('/api/publication').then(r=>r.json())).state,'scheduled');assert.equal((await get('/')).status,403);ok('開始前は配信しない');
  current=await save(current,{enabled:true,startsAt:new Date(now-60000).toISOString(),endsAt:new Date(now+60000).toISOString()});
  const index=await get('/');assert.equal(index.status,200);assert.ok((await index.text()).includes('publication-guard.mjs'));assert.equal(index.headers.get('cache-control'),'no-store, max-age=0');
  for(const p of ['/style.css','/src/main.mjs','/assets/portrait.png','/publication-guard.mjs'])assert.equal((await get(p)).status,200);ok('期間中のゲーム・素材・終了監視とキャッシュ抑制');
  const stream=await get('/assets/audio/title.mp3',{headers:{Range:'bytes=0-99'}});assert.ok([200,206].includes(stream.status));await stream.body.cancel();ok('音声リクエストの応答');
  const csrf=await get('/admin/api/stop',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify({revision:current.revision})});assert.equal(csrf.status,403);assert.equal((await setting()).revision,current.revision);ok('別サイトからの変更拒否');
  const malformed=await mutate('/admin/api/settings',{revision:current.revision,enabled:true,startsAt:current.endsAt,endsAt:current.startsAt,beforeMessage:'a',afterMessage:'b'});assert.equal(malformed.status,400);ok('逆転した期間を拒否');
  const a=await mutate('/admin/api/stop',{revision:current.revision},'POST');assert.equal(a.status,200);current=await a.json();assert.equal((await get('/src/main.mjs')).status,403);assert.equal((await get('/api/publication').then(r=>r.json())).allowed,false);ok('即時停止とコードの直接アクセス拒否');
  const stale=await mutate('/admin/api/stop',{revision:current.revision-1},'POST');assert.equal(stale.status,409);ok('複数画面の競合を検知');
  const reopened=await mutate('/admin/api/open',{revision:current.revision},'POST');assert.equal(reopened.status,200);current=await reopened.json();assert.equal((await get('/')).status,200);ok('保存した終了日時を使って再公開');
  current=await save(current,{enabled:true,startsAt:new Date(now-120000).toISOString(),endsAt:new Date(now-60000).toISOString()});
  assert.equal((await get('/')).status,410);assert.equal((await get('/assets/portrait.png')).status,410);assert.equal((await get('/src/main.mjs')).status,410);assert.equal((await get('/api/publication').then(r=>r.json())).state,'ended');ok('終了時刻後はページ・画像・コードを拒否');
  assert.equal((await get('/admin/admin.mjs')).status,200);assert.ok([200,307].includes((await get('/admin%2Fadmin.mjs')).status));ok('期間外も管理画面から操作可能');
  const unavailable=await get('/publication-unavailable');assert.equal(unavailable.status,503);ok('接続不能時の終了画面');
}finally{await save(await setting(),{enabled:initial.enabled,startsAt:initial.startsAt,endsAt:initial.endsAt,beforeMessage:initial.beforeMessage,afterMessage:initial.afterMessage});if(cookie)await get('/admin/api/logout',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:'{}'});}
console.log(`${checks} integration checks passed; original settings restored.`);
