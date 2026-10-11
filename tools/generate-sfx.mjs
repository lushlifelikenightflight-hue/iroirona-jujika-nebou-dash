import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const config=JSON.parse(fs.readFileSync('F:/Projects/ローカル音声工房/config.json','utf8'));
const folder=path.join(root,'work/audio-v12-jobs');fs.mkdirSync(folder,{recursive:true});
const stateFile=path.join(folder,'sfx-state.json');
const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{};
const recipes=[['jump','confirm',.2,1.35,.65],['land','footstep',.13,.8,.5],['dark','laser',.8,.4,.8],['fire','explosion',.5,1.6,.7],['lightning','impact',.45,1.8,.8],['ice','slash',.5,.7,.6],['beam','laser',.55,1.7,.75],['hit','impact',.25,.7,.6],['kill','cancel',.3,.85,.65],['join','confirm',.7,1.1,.7],['unicycle','coin',.55,.8,.7],['clear','confirm',1.3,.75,.85],['crouch','footstep',.12,.6,.4]];
async function api(route,body){const r=await fetch('http://127.0.0.1:7865'+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;}
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2));
const status=await api('/api/status');if(!status.sfxReady||status.active)throw Error('Studio unavailable or another job active');
for(let i=0;i<recipes.length;i++){
 const [name,preset,duration,pitch,strength]=recipes[i];
 if(!state[name]){const j=await api('/api/generate',{mode:'sfx',title:'寝坊ダッシュ v1.2 '+name,preset,duration,pitch,strength,seed:121200+i,target:-18,body:.25,loop:false});state[name]={id:j.id,name,preset,duration,pitch,strength};save();}
 if(!state[name].result){for(;;){const j=await api('/api/jobs/'+state[name].id);if(j.status==='error')throw Error(j.error);if(j.status==='done'){state[name].result=j.result;save();break;}await new Promise(r=>setTimeout(r,2000));}}
 const input=path.join(state[name].result.path,'finished.wav'),output=path.join(root,'assets/audio',name+'.wav');
 await new Promise((resolve,reject)=>{const p=spawn(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-c:a','pcm_s16le','-ar','44100','-ac','1','-map_metadata','-1',output],{windowsHide:true});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(err)));});
 console.log(`Generated ${name}: ${state[name].result.duration}s`);
}
fs.writeFileSync(path.join(root,'assets/audio/sfx-provenance.json'),JSON.stringify({generator:'ローカル音声工房 / SFX presets',method:'preset synthesis with mastering',sounds:Object.values(state).map(s=>({file:s.name+'.wav',libraryId:s.id,preset:s.preset,pitch:s.pitch,strength:s.strength,duration:s.result.duration,after:s.result.after}))},null,2));
