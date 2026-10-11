import {authenticate} from './auth.mjs';
import {publicStatus,validateSettings} from './publication.mjs';
import {unavailablePage} from './pages.mjs';

type Settings={enabled:number;starts_at:number|null;ends_at:number|null;before_message:string;after_message:string;revision:number;updated_at:number};
const secureHeaders={'Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"};
function respond(body:BodyInit|null,status=200,type='application/json; charset=utf-8'){return new Response(body,{status,headers:{...secureHeaders,'Content-Type':type}});}
function json(body:unknown,status=200){return respond(JSON.stringify(body),status);}
async function settings(env:Env):Promise<Settings>{const result=await env.DB.withSession('first-primary').prepare('SELECT * FROM publication WHERE id=1').first<Settings>();if(!result)throw new Error('Missing publication settings');return result;}
function adminData(row:Settings,now=Date.now()){return {...publicStatus(row,now),enabled:!!row.enabled,startsAt:row.starts_at?new Date(row.starts_at).toISOString():null,endsAt:row.ends_at?new Date(row.ends_at).toISOString():null,beforeMessage:row.before_message,afterMessage:row.after_message,revision:row.revision,updatedAt:row.updated_at};}
async function readJSON(request:Request){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw new Error('JSON形式で送信してください。');
  if(Number(request.headers.get('content-length'))>8192)throw new Error('設定が大きすぎます。');
  if(!request.body)throw new Error('設定がありません。');
  const reader=request.body.getReader();const parts:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new Error('設定が大きすぎます。');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function admin(request:Request,env:Env,path:string){
  let actor:string;try{actor=await authenticate(request,env);}catch{return respond('管理者ログインが必要です。',403,'text/plain; charset=utf-8');}
  if(['/admin','/admin/','/admin/index.html','/admin/admin.css','/admin/admin.mjs'].includes(path)){
    if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
    const url=new URL(request.url);if(['/admin','/admin/'].includes(path))url.pathname='/admin/index.html';
    const asset=await env.ASSETS.fetch(new Request(url,request));return decorate(asset);
  }
  if(!['/admin/api/settings','/admin/api/stop','/admin/api/open'].includes(path))return json({error:'Not found'},404);
  const current=await settings(env);
  if(path==='/admin/api/settings'&&request.method==='GET')return json({...adminData(current),administrator:actor,local:env.ENVIRONMENT==='local'});
  const expected=path==='/admin/api/settings'?'PUT':'POST';if(request.method!==expected)return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'同じ管理画面から操作してください。'},403);
  let body;try{body=await readJSON(request);}catch(error){return json({error:error instanceof Error?error.message:'設定を確認してください。'},400);}
  let next;
  try{
    if(path==='/admin/api/settings')next=validateSettings(body);
    else{
      if(!Number.isSafeInteger(body?.revision)||body.revision<0)throw new Error('画面を再読み込みしてください。');
      next={...current,revision:body.revision,enabled:path==='/admin/api/stop'?0:1};
      if(path==='/admin/api/open'){
        if(!current.ends_at||current.ends_at<=Date.now())throw new Error('未来の終了日時を保存してから公開してください。');
        next.starts_at=Date.now();
      }
    }
  }catch(error){return json({error:error instanceof Error?error.message:'設定を確認してください。'},400);}
  const now=Date.now();
  const session=env.DB.withSession('first-primary');
  const updated=await session.prepare('UPDATE publication SET enabled=?,starts_at=?,ends_at=?,before_message=?,after_message=?,updated_at=?,revision=revision+1 WHERE id=1 AND revision=? RETURNING *').bind(next.enabled,next.starts_at,next.ends_at,next.before_message,next.after_message,now,next.revision).first<Settings>();
  if(!updated)return json({error:'別の画面で設定が更新されました。再読み込みして確認してください。'},409);
  return json({...adminData(updated),administrator:actor,local:env.ENVIRONMENT==='local'});
}
function decorate(response:Response){const headers=new Headers(response.headers);for(const [key,value]of Object.entries(secureHeaders))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    let path:string;try{path=decodeURIComponent(new URL(request.url).pathname);}catch{return json({error:'Invalid path'},400);}
    try{
      if(path==='/admin'||path.startsWith('/admin/'))return await admin(request,env,path);
      if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
      if(path==='/publication-unavailable')return respond(unavailablePage({state:'unavailable',message:'接続できませんでした。通信環境を確認して、もう一度お試しください。'}),503,'text/html; charset=utf-8');
      const row=await settings(env),status=publicStatus(row);
      if(path==='/api/publication')return json(status);
      if(!status.allowed){
        if(path==='/'||path==='/index.html')return respond(request.method==='HEAD'?null:unavailablePage(status),status.state==='ended'?410:403,'text/html; charset=utf-8');
        return json({error:'公開期間外です。',state:status.state},status.state==='ended'?410:403);
      }
      const assetURL=new URL(request.url);if(path==='/')assetURL.pathname='/index.html';
      const asset=await env.ASSETS.fetch(new Request(assetURL,request));return decorate(asset);
    }catch(error){console.error(JSON.stringify({event:'publication_error',path,message:error instanceof Error?error.message:'Unknown error'}));return respond(unavailablePage({state:'unavailable',message:'ただいま接続できません。しばらくしてからお試しください。'}),503,'text/html; charset=utf-8');}
  }
} satisfies ExportedHandler<Env>;
