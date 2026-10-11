const encoder=new TextEncoder();
export const SESSION_MS=8*60*60*1000;
export const PASSWORD_ITERATIONS=100000;
const cookieName='__Host-nebo_admin';
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));}
export async function equalSecret(a,b){
  const left=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(a)));
  const right=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(b)));
  if(typeof crypto.subtle.timingSafeEqual==='function')return crypto.subtle.timingSafeEqual(left,right);
  let difference=0;for(let i=0;i<left.length;i++)difference|=left[i]^right[i];return difference===0;
}
export function validPassword(value){return typeof value==='string'&&value.length>=16&&value.length<=256&&!/[\u0000-\u001f\u007f]/.test(value);}
export async function passwordHash(password,salt,pepper){
  if(typeof pepper!=='string'||!/^[a-f0-9]{64}$/.test(pepper))throw Error('Missing password secret');
  const signingKey=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const protectedPassword=await crypto.subtle.sign('HMAC',signingKey,encoder.encode(password));
  const key=await crypto.subtle.importKey('raw',protectedPassword,'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:PASSWORD_ITERATIONS,hash:'SHA-256'},key,256)));
}
export function sessionToken(request){
  const matches=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'='));
  if(matches.length!==1)return null;
  const value=matches[0].slice(cookieName.length+1);return /^[a-f0-9]{64}$/.test(value)?value:null;
}
export async function authenticatePassword(request,env){
  const token=sessionToken(request);if(!token)throw Error('ログインが必要です。');
  const session=await env.DB.withSession('first-primary').prepare('SELECT expires_at FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token),Date.now()).first();
  if(!session)throw Error('ログイン期限が切れました。');return '管理者本人';
}
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
function sessionCookie(token){return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS/1000}`;}
const clearCookie=()=>`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
async function credential(env){return env.DB.withSession('first-primary').prepare('SELECT password_hash,salt FROM admin_credentials WHERE id=1').first();}
async function allowedAttempt(request,env){
  const now=Date.now(),bucket=Math.floor(now/900000),ip=request.headers.get('CF-Connecting-IP')||'local';
  const db=env.DB.withSession('first-primary');
  const results=await db.batch([
    db.prepare('INSERT INTO admin_attempts (attempt_key,bucket,count) VALUES (?, ?, 1) ON CONFLICT(attempt_key,bucket) DO UPDATE SET count=count+1 RETURNING count').bind('ip:'+await digest(ip),bucket),
    db.prepare('INSERT INTO admin_attempts (attempt_key,bucket,count) VALUES (?, ?, 1) ON CONFLICT(attempt_key,bucket) DO UPDATE SET count=count+1 RETURNING count').bind('all',bucket),
    db.prepare('DELETE FROM admin_attempts WHERE bucket<?').bind(bucket-1)
  ]);
  return results[0].results[0].count<=6&&results[1].results[0].count<=50;
}
async function createSession(env){
  const token=random(),now=Date.now(),db=env.DB.withSession('first-primary');
  await db.batch([db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now),db.prepare('INSERT INTO admin_sessions (token_hash,expires_at) VALUES (?,?)').bind(await digest(token),now+SESSION_MS)]);
  return json({ok:true},200,{'Set-Cookie':sessionCookie(token)});
}
export async function authenticationRoute(request,env,path,readJSON){
  if(env.AUTH_MODE!=='password')return null;
  if(path==='/admin/api/auth-status'){
    if(request.method!=='GET')return json({error:'Method not allowed'},405);
    return json({configured:!!(await credential(env))});
  }
  if(!['/admin/api/setup','/admin/api/login','/admin/api/logout'].includes(path))return null;
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'同じ管理画面から操作してください。'},403);
  if(path==='/admin/api/logout'){
    const token=sessionToken(request);
    if(token)await env.DB.withSession('first-primary').prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
    return json({ok:true},200,{'Set-Cookie':clearCookie()});
  }
  if(!await allowedAttempt(request,env))return json({error:'試行回数が多すぎます。15分ほど待ってください。'},429,{'Retry-After':'900'});
  let body;try{body=await readJSON(request);}catch{return json({error:'入力内容を確認してください。'},400);}
  if(!validPassword(body?.password))return json({error:'パスワードは16〜256文字で入力してください。'},400);
  let setup;try{setup=JSON.parse(env.ADMIN_AUTH_SECRET||'');if(!/^[a-f0-9]{64}$/.test(setup.pepper))throw Error();}catch{return json({error:'管理者認証が準備できていません。'},503);}
  const existing=await credential(env);
  if(path==='/admin/api/login'){
    if(!existing)return json({error:'初回登録が必要です。'},409);
    if(!await equalSecret(await passwordHash(body.password,existing.salt,setup.pepper),existing.password_hash))return json({error:'ログインできません。パスワードを確認してください。'},401);
    return createSession(env);
  }
  if(existing)return json({error:'初回登録は完了しています。ログインしてください。'},409);
  if(!Number.isSafeInteger(setup.expiresAt)||setup.expiresAt<=Date.now())return json({error:'初回登録の期限が切れました。登録用の鍵を再発行してください。'},410);
  if(typeof setup.token!=='string'||setup.token.length!==64||typeof body.setupKey!=='string'||body.setupKey.length>128||!await equalSecret(body.setupKey,setup.token))return json({error:'初回登録用の鍵を確認してください。'},401);
  if(body.password!==body.confirmPassword)return json({error:'確認用パスワードが一致しません。'},400);
  const salt=random(),hash=await passwordHash(body.password,salt,setup.pepper);
  const inserted=await env.DB.withSession('first-primary').prepare('INSERT INTO admin_credentials (id,password_hash,salt,created_at) VALUES (1,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id').bind(hash,salt,Date.now()).first();
  if(!inserted)return json({error:'初回登録は完了しています。ログインしてください。'},409);
  return createSession(env);
}
