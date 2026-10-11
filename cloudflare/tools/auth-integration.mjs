import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8791',origin=new URL(base).origin;
const password='local QA password 2026 only!',setupKey='a'.repeat(64);let cookie='',checks=0;
async function request(path,{method='GET',body,ip='192.0.2.1',originValue=origin,authenticated=false}={}){
 return fetch(base+path,{method,redirect:'manual',headers:{...(body?{'Content-Type':'application/json',Origin:originValue}:{}),'CF-Connecting-IP':ip,...(authenticated?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
}
const post=(path,body,extra={})=>request(path,{method:'POST',body,...extra});
function ok(message){console.log('PASS '+message);checks++;}
let r=await request('/admin');assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/admin/login');assert.equal((await request('/admin/api/settings')).status,403);assert.equal((await request('/admin/admin.mjs')).status,403);assert.equal((await request('/admin%2Fapi/settings')).status,403);ok('未認証の管理画面・API・資産とencoded pathを保護');
assert.equal((await request('/admin/login')).status,200);assert.equal((await request('/admin/api/auth-status').then(r=>r.json())).configured,false);ok('公開ゲームの停止中も初回登録画面が使える');
r=await post('/admin/api/setup',{password,confirmPassword:password,setupKey:'wrong'});assert.equal(r.status,401);r=await post('/admin/api/setup',{password,confirmPassword:password,setupKey},{originValue:'https://evil.example'});assert.equal(r.status,403);ok('登録鍵と同一Originが必要');
r=await post('/admin/api/setup',{password,confirmPassword:password,setupKey});assert.equal(r.status,200,await r.clone().text());cookie=r.headers.get('set-cookie').split(';')[0];for(const value of ['HttpOnly','Secure','SameSite=Strict','Max-Age=28800','Path=/'])assert.ok(r.headers.get('set-cookie').includes(value));assert.equal((await request('/admin/api/auth-status').then(r=>r.json())).configured,true);assert.equal((await request('/admin/api/settings',{authenticated:true})).status,200);ok('初回登録と8時間の安全なCookieで管理画面へ入れる');
assert.equal((await post('/admin/api/setup',{password,confirmPassword:password,setupKey})).status,409);ok('登録用の鍵を再利用して上書きできない');
r=await post('/admin/api/logout',{}, {authenticated:true});assert.equal(r.status,200);assert.ok(r.headers.get('set-cookie').includes('Max-Age=0'));assert.equal((await request('/admin/api/settings',{authenticated:true})).status,403);ok('ログアウトはサーバー側でもセッションを失効');
assert.equal((await post('/admin/api/login',{password:'a wrong long password'})).status,401);r=await post('/admin/api/login',{password});assert.equal(r.status,200,await r.clone().text());cookie=r.headers.get('set-cookie').split(';')[0];assert.equal((await request('/admin/api/settings',{authenticated:true})).status,200);ok('誤ったパスワードを拒否し、正しいパスワードで再ログイン');
assert.equal((await request('/admin/api/settings',{authenticated:true,body:{},method:'PUT',originValue:'https://evil.example'})).status,403);ok('認証済みでも別サイトからの変更を拒否');
for(let i=0;i<6;i++)assert.equal((await post('/admin/api/login',{password:'another wrong password'},{ip:'192.0.2.2'})).status,401);r=await post('/admin/api/login',{password},{ip:'192.0.2.2'});assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'900');ok('同一IPの7回目を制限');
assert.equal((await request('/')).status,403);assert.equal((await request('/assets/portrait.png')).status,403);ok('認証設定でゲームの非公開状態を変えない');
await post('/admin/api/logout',{}, {authenticated:true});console.log(`${checks} authentication integration checks passed.`);
