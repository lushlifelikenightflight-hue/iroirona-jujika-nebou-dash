import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
import {initialSettings} from '../src/publication.mjs';
const compiled=await build({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
test('production rejects every admin path before assets or data, including encoded slash and spoofed header',async()=>{
  let calls=0;const fail=()=>{calls++;throw Error('Must not be called');};
  const env={ENVIRONMENT:'production',ACCESS_TEAM_DOMAIN:'https://test.cloudflareaccess.com',ACCESS_AUD:'admin',ADMIN_EMAILS:'owner@example.com',LOCAL_ADMIN:'true',DB:{withSession:fail},ASSETS:{fetch:fail}};
  for(const path of ['/admin','/admin/','/admin/admin.mjs','/admin/api/settings','/admin%2Fadmin.mjs','/%61dmin/admin.css']){
    const response=await worker.fetch(new Request(`https://game.example${path}`,{headers:{'Cf-Access-Authenticated-User-Email':'owner@example.com'}}),env);assert.equal(response.status,403,path);assert.equal(response.headers.get('cache-control'),'no-store, max-age=0');
  }
  assert.equal(calls,0);
});
test('database failure closes public access rather than falling through to static assets',async()=>{
  let assets=0;const env={DB:{withSession:()=>{throw Error('test unavailable');}},ASSETS:{fetch:()=>{assets++;return new Response('game');}}};
  for(const path of ['/','/src/main.mjs','/assets/portrait.png','/api/publication'])assert.equal((await worker.fetch(new Request(`https://game.example${path}`),env)).status,503);
  assert.equal(assets,0);
});
test('all game resources are gated and responses cannot bypass expiry through browser cache',async()=>{
  let row={...initialSettings};let assets=0;const env={DB:{withSession:()=>({prepare:()=>({first:async()=>row})})},ASSETS:{fetch:async request=>{assets++;return new Response(new URL(request.url).pathname);}}};
  assert.equal((await worker.fetch(new Request('https://game.example/src/main.mjs'),env)).status,403);assert.equal(assets,0);
  row={...row,enabled:1,starts_at:Date.now()-60000,ends_at:Date.now()+60000};
  const r=await worker.fetch(new Request('https://game.example/'),env);assert.equal(r.status,200);assert.equal(await r.text(),'/index.html');assert.equal(r.headers.get('cache-control'),'no-store, max-age=0');assert.equal(r.headers.get('cloudflare-cdn-cache-control'),'no-store');
  row.ends_at=Date.now()-1;assert.equal((await worker.fetch(new Request('https://game.example/index.html'),env)).status,410);assert.equal(assets,1);
});
