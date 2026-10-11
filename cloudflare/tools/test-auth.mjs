import {mkdir,readFile,writeFile} from 'node:fs/promises';import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import path from 'node:path';import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url)),qa=path.join(root,'work',`auth-qa-${Date.now()}`),configPath=path.join(qa,'wrangler.json');
const wrangler=fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url));
await mkdir(qa,{recursive:true});
const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));
delete config.env;delete config.$schema;config.name='nebo-dash-auth-qa';config.main=path.join(root,'src','worker.ts');config.assets.directory=path.join(root,'dist');config.vars={ENVIRONMENT:'local',AUTH_MODE:'password',LOCAL_ADMIN:'false'};config.d1_databases=[{binding:'DB',database_name:'auth-qa',database_id:'11111111-1111-1111-1111-111111111111',migrations_dir:path.join(root,'migrations')}];
await writeFile(configPath,JSON.stringify(config));await writeFile(path.join(qa,'.dev.vars'),'ADMIN_AUTH_SECRET='+JSON.stringify({token:'a'.repeat(64),pepper:'b'.repeat(64),expiresAt:Date.now()+86400000}));
const state=path.join(qa,'state');
await exec(process.execPath,[wrangler,'d1','migrations','apply','auth-qa','--local','--config',configPath,'--persist-to',state],{cwd:root,timeout:60000});
const server=spawn(process.execPath,[wrangler,'dev','--config',configPath,'--port','8791','--persist-to',state],{cwd:root,stdio:['ignore','pipe','pipe']});let logs='';
server.stdout.on('data',data=>{logs=(logs+data).slice(-6000);});server.stderr.on('data',data=>{logs=(logs+data).slice(-6000);});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('QA server did not start. '+logs)),30000);const check=data=>{if(String(data).includes('Ready on')){clearTimeout(timer);resolve();}};server.stdout.on('data',check);server.stderr.on('data',check);server.once('exit',code=>{clearTimeout(timer);reject(Error('QA server stopped: '+code+' '+logs));});});
 for(const tool of ['auth-integration.mjs','integration.mjs']){const {stdout}=await exec(process.execPath,[path.join(root,'tools',tool)],{cwd:root,timeout:60000,env:{...process.env,TEST_URL:'http://127.0.0.1:8791',TEST_AUTH:'true'}});process.stdout.write(stdout);}
 console.log('Isolated QA state retained in '+path.relative(root,qa)+'; no production credentials were used.');
}finally{server.kill('SIGTERM');await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);setTimeout(resolve,5000);});}
