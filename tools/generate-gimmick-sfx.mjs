import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const config=JSON.parse(fs.readFileSync('F:/Projects/ローカル音声工房/config.json','utf8'));
const folder=path.join(root,'work/audio-v13-jobs');fs.mkdirSync(folder,{recursive:true});
const stateFile=path.join(folder,'sfx-state.json');
const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{};
const recipes=[['spring','confirm',.38,1.5,.8],['slide','slash',.8,.75,.6]];
async function api(route,body){const r=await fetch('http://127.0.0.1:7865'+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;}
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2));
const status=await api('/api/status');if(!status.sfxReady||status.active)throw Error('Studio unavailable or another job active');
for(let i=0;i<recipes.length;i++){
 const [name,preset,duration,pitch,strength]=recipes[i];
 if(!state[name]){const j=await api('/api/generate',{mode:'sfx',title:'寝坊ダッシュ v1.3 '+name,preset,duration,pitch,strength,seed:131300+i,target:-18,body:.25,loop:false});state[name]={id:j.id,name,preset,duration,pitch,strength};save();}
 if(!state[name].result){for(;;){const j=await api('/api/jobs/'+state[name].id);if(j.status==='error')throw Error(j.error);if(j.status==='done'){state[name].result=j.result;save();break;}await new Promise(r=>setTimeout(r,2000));}}
 const input=path.join(state[name].result.path,'finished.wav'),output=path.join(root,'assets/audio',name+'.wav');
 await new Promise((resolve,reject)=>{const p=spawn(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-c:a','pcm_s16le','-ar','44100','-ac','1','-map_metadata','-1',output],{windowsHide:true});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(err)));});
 console.log(`Generated ${name}: ${state[name].result.duration}s`);
}
fs.writeFileSync(path.join(root,'assets/audio/sfx-provenance.json'),JSON.stringify({generator:'ローカル音声工房 / SFX presets',method:'preset synthesis with mastering',sounds:[...JSON.parse(fs.readFileSync(path.join(root,'assets/audio/sfx-provenance.json'),'utf8')).sounds.filter(s=>!['spring.wav','slide.wav'].includes(s.file)),...Object.values(state).map(s=>({file:s.name+'.wav',libraryId:s.id,preset:s.preset,pitch:s.pitch,strength:s.strength,duration:s.result.duration,after:s.result.after}))]},null,2));
