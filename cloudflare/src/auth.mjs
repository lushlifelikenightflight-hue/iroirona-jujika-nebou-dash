import {createRemoteJWKSet,jwtVerify} from 'jose';

export async function validateClaims(token,keys,domain,audience,emails) {
  const {payload}=await jwtVerify(token,keys,{issuer:domain,audience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
  if(typeof payload.email!=='string'||!emails.includes(payload.email.toLowerCase()))throw new Error('管理者として許可されていません。');
  return payload.email;
}

export async function authenticate(request,env) {
  const url=new URL(request.url);
  if(env.ENVIRONMENT==='local'&&env.LOCAL_ADMIN==='true'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))return 'ローカル検証';
  const domain=env.ACCESS_TEAM_DOMAIN,audience=env.ACCESS_AUD,emails=(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(env.ENVIRONMENT!=='production'||!domain||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||!audience||!emails.length)throw new Error('管理者認証の設定が必要です。');
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||token.length>16384)throw new Error('管理者ログインが必要です。');
  const keys=createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`),{timeoutDuration:5000});
  return validateClaims(token,keys,domain,audience,emails);
}
