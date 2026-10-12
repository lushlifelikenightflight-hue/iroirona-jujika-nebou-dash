export const BGM_NAMES=['title','stage-1','stage-2','stage-3','stage-4','stage-5','live','taxi'];
export const SFX_NAMES=['jump','land','dark','fire','lightning','ice','beam','hit','kill','join','unicycle','clear','crouch','spring','slide'];
export const AUDIO_NAMES=[...BGM_NAMES,...SFX_NAMES];
export const AUDIO_FILES=Object.fromEntries(AUDIO_NAMES.map(n=>[n,`assets/audio/${n}.${BGM_NAMES.includes(n)?'mp3':'wav'}`]));
export class AudioManager{
 constructor(){
  this.bytes={};this.buffers={};this.context=null;this.volume=.55;this.muted=false;this.enabled=false;this.suspended=false;this.track='title';this.requestId=0;this.decoding=new Map();this.urls={};this.onError=()=>{};this.onState=()=>{};this.starting=false;this.failed=false;this.activationId=0;
  // Keep the same media element across songs to preserve mobile playback permission.
  this.musicElement=new Audio();this.musicElement.preload='auto';this.musicElement.loop=true;this.musicElement.setAttribute('playsinline','');
  this.musicElement.addEventListener('error',()=>{this.failed=true;this.onError(new Error('BGM playback'));this.onState();});
  for(const event of ['playing','pause','volumechange'])this.musicElement.addEventListener(event,()=>this.onState());
 }
 async preload(onLoaded=()=>{}){await Promise.all(AUDIO_NAMES.map(async n=>{const url=new URL('../'+AUDIO_FILES[n],import.meta.url);url.searchParams.set('v','1.2.0');const r=await fetch(url);if(!r.ok)throw new Error(`音源 ${n}`);this.bytes[n]=await r.arrayBuffer();if(BGM_NAMES.includes(n))this.urls[n]=URL.createObjectURL(new Blob([this.bytes[n]],{type:'audio/mpeg'}));onLoaded(n);}));this.setTrack(this.track);}
 setTrack(name){this.track=name;const src=this.urls[name];if(src&&this.musicElement.src!==src)this.musicElement.src=src;}
 async buffer(name){
  if(this.buffers[name])return this.buffers[name];
  if(!this.decoding.has(name)){const promise=this.context.decodeAudioData(this.bytes[name].slice(0)).then(b=>{this.buffers[name]=b;this.decoding.delete(name);return b;}).catch(e=>{this.decoding.delete(name);throw e;});this.decoding.set(name,promise);}
  return this.decoding.get(name);
 }
 playMusic(){const request=++this.requestId;this.failed=false;let played;try{played=this.musicElement.play();}catch(e){played=Promise.reject(e);}return Promise.resolve(played).then(()=>{if(request===this.requestId){this.failed=false;this.onState();}}).catch(e=>{if(request===this.requestId&&e.name!=='AbortError'){this.failed=true;this.onError(e);this.onState();}});}
 async unlock(){
  const activation=++this.activationId;this.enabled=true;this.suspended=false;this.starting=true;this.failed=false;this.onState();
  try{
  if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.connect(this.context.destination);}
  this.setVolume(this.volume);this.setTrack(this.track);
  // Activate both playback paths synchronously inside the tap, before any decoding await.
  const resumed=this.context.resume(),played=this.muted?Promise.resolve():this.playMusic();
  const warmup=this.context.createBufferSource();warmup.buffer=this.context.createBuffer(1,1,this.context.sampleRate);warmup.connect(this.master);warmup.start();
  await Promise.all([resumed,played,...SFX_NAMES.map(n=>this.buffer(n))]);
  }catch(error){if(activation===this.activationId)this.failed=true;throw error;}finally{if(activation===this.activationId){this.starting=false;this.onState();}}
 }
 music(name){this.setTrack(name);if(!this.enabled||this.muted||this.suspended)return Promise.resolve();return this.playMusic();}
 sfx(name){
  if(!this.enabled||!this.context||this.context.state!=='running'||!this.buffers[name]||this.muted||this.suspended)return;
  const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffers[name];gain.gain.value=.8;source.connect(gain);gain.connect(this.master);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,v));if(this.master)this.master.gain.value=this.muted?0:this.volume;this.musicElement.volume=this.volume*.85;this.musicElement.muted=this.muted;this.onState();}
 setMuted(value){this.muted=Boolean(value);if(this.muted){this.activationId++;this.starting=false;this.requestId++;this.musicElement.pause();}this.setVolume(this.volume);}
 toggle(){this.setMuted(!this.muted);if(!this.muted&&this.enabled&&!this.suspended)this.playMusic();return this.muted;}
 suspend(){this.suspended=true;this.requestId++;this.musicElement.pause();this.context?.suspend();this.onState();}
 resume(){this.suspended=false;if(this.enabled){this.context?.resume().catch(this.onError);if(!this.muted)this.playMusic();}this.onState();}
 get state(){return !this.enabled?'off':this.muted||this.volume===0?'muted':this.failed?'retry':this.starting?'starting':this.suspended?'paused':this.musicElement.paused?'retry':'playing';}
}
