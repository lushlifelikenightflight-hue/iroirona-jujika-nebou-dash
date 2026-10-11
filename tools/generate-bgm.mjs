import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const studio=process.env.AUDIO_STUDIO_ROOT||'F:/Projects/ローカル音声工房';
const config=JSON.parse(fs.readFileSync(path.join(studio,'config.json'),'utf8'));
const work=path.join(root,'work/bgm-jobs');fs.mkdirSync(work,{recursive:true});
const songs=[
 ['title','寝坊ダッシュ・夜明けの招待',96,'Instrumental gothic rock game title theme, memorable elegant minor key melody, harpsichord arpeggio, atmospheric church organ, warm electric bass, restrained drums, rich dark romantic tone, clean polished stereo production. No vocals, no spoken words, no crowd. Seamlessly looping game soundtrack.'],
 ['stage-1','寝坊ダッシュ・寝坊の街',132,'Instrumental energetic melodic gothic rock for running through a haunted town, driving tight rock drums, electric guitar riffs, melodic bass line, sparkling harpsichord, memorable catchy lead synth melody in minor key. Urgent but playful, polished powerful game soundtrack. No vocals or speech. Continuous loop, no fade-out.'],
 ['stage-2','寝坊ダッシュ・薔薇の墓地',116,'Instrumental dark gothic action game music for a rose-covered cemetery, pizzicato strings, harpsichord ostinato, melodic cello, eerie church organ, steady punchy drums and bass, mysterious elegant minor key theme. Forward momentum with spooky romantic atmosphere. No vocals or speech, no ambient noise. Continuous loop.'],
 ['stage-3','寝坊ダッシュ・氷の回廊',124,'Instrumental gothic fantasy action soundtrack for a frozen arcade, crystalline bell melody, icy celesta, orchestral strings, deep electric bass, energetic percussion, graceful memorable minor key motif. Cold blue atmosphere with clear rhythmic movement and full polished stereo sound. No vocals or speech. Continuous loop.'],
 ['stage-4','寝坊ダッシュ・鐘楼の屋根',140,'Instrumental fast gothic rock action game track for racing over bell-tower rooftops, distorted electric guitar melody, soaring strings, dramatic bell accents, galloping bass, tight rock drums, exciting minor key harmonic progression. Confident urgent rhythmic loop. No vocals, no speech, no crowd.'],
 ['stage-5','寝坊ダッシュ・開演前の礼拝堂',148,'Instrumental climactic symphonic gothic metal game soundtrack, powerful electric guitar riffs, heroic minor key lead melody, cathedral organ, dramatic orchestral strings, double-time drums, heavy melodic bass, urgent final stage atmosphere. Polished stereo mix with clear transients. No vocals or speech. Loopable with no fade-out.'],
 ['live','寝坊ダッシュ・間に合ったライブ',144,'Instrumental triumphant melodic rock concert finale for a fantasy band game, uplifting memorable electric guitar lead, big warm bass, energetic live-style drums, bright keyboard and strings, celebratory resolution, full band studio-quality stereo sound. No vocals, no speech, no crowd noise. Loopable victory theme.'],
 ['taxi','寝坊ダッシュ・タクシーで開演へ',104,'Instrumental playful gothic jazz rock ending theme for a taxi ride after oversleeping, cheeky pizzicato bass and harpsichord, brushed drums, muted electric guitar, light piano melody, relaxed whimsical minor key with a warm hopeful ending. Clear rich stereo sound. No vocals or speech. Loopable.']
];
const stateFile=path.join(work,'state.json');let states=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{};
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(states,null,2));
async function api(route,body){const r=await fetch('http://127.0.0.1:7865'+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value;}
async function encode(input,output){await new Promise((resolve,reject)=>{const p=spawn(config.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-c:a','libmp3lame','-b:a','160k','-ar','44100',output],{windowsHide:true});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(err)));});}
const status=await api('/api/status');if(!status.bgmReady)throw Error('BGM tool not ready');if(status.active&&!Object.values(states).some(s=>s.id===status.active))throw Error('Another user job is active; leaving it untouched');
for(let i=0;i<songs.length;i++){
 const [name,title,bpm,prompt]=songs[i];if(!states[name]){const j=await api('/api/generate',{mode:'bgm',title,prompt,bpm,duration:30,seed:101100+i,target:-16,body:.35,loop:true});states[name]={id:j.id,name,title,bpm,prompt,seed:101100+i};save();console.log(`Submitted ${i+1}/8 ${name}: ${j.id}`);}
 if(!states[name].result){let stage='';for(;;){const j=await api('/api/jobs/'+states[name].id);if(j.stage!==stage){stage=j.stage;console.log(`${name}: ${stage}`);}if(j.status==='error')throw Error(`${name}: ${j.error}`);if(j.status==='done'){states[name].result=j.result;save();break;}await new Promise(r=>setTimeout(r,12000));}}
 const item=states[name].result;await encode(path.join(item.path,'finished.wav'),path.join(root,'assets/audio',name+'.mp3'));console.log(`Ready ${name}: ${item.duration}s, ${item.after.lufs} LUFS, ${item.after.peak} dBTP`);
}
const provenance={generator:'ローカル音声工房 / ACE-Step 1.5 Turbo',inferenceSteps:8,instrumental:true,tracks:Object.values(states).map(s=>({file:s.name+'.mp3',title:s.title,libraryId:s.id,seed:s.seed,bpm:s.bpm,prompt:s.prompt,duration:s.result.duration,target:s.result.target,loop:s.result.loop,after:s.result.after}))};
fs.writeFileSync(path.join(root,'assets/audio/bgm-provenance.json'),JSON.stringify(provenance,null,2));console.log('ALL 8 ACE-STEP TRACKS READY');
