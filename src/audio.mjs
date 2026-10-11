export const BGM_NAMES=['title','stage-1','stage-2','stage-3','stage-4','stage-5','live','taxi'];
export const SFX_NAMES=['jump','land','dark','fire','lightning','ice','beam','hit','kill','join','unicycle','clear'];
export const AUDIO_NAMES=[...BGM_NAMES,...SFX_NAMES];
export const AUDIO_FILES=Object.fromEntries(AUDIO_NAMES.map(n=>[n,`assets/audio/${n}.${BGM_NAMES.includes(n)?'mp3':'wav'}`]));
export class AudioManager{
 constructor(){this.bytes={};this.buffers={};this.context=null;this.source=null;this.volume=.55;this.muted=false;this.track='title';this.requestId=0;this.decoding=new Map();this.onError=()=>{};}
 async preload(){await Promise.all(AUDIO_NAMES.map(async n=>{const r=await fetch(AUDIO_FILES[n]);if(!r.ok)throw new Error(`音源 ${n}`);this.bytes[n]=await r.arrayBuffer();}));}
 async buffer(name){
  if(this.buffers[name])return this.buffers[name];
  if(!this.decoding.has(name)){const p=this.context.decodeAudioData(this.bytes[name].slice(0)).then(b=>{this.buffers[name]=b;this.decoding.delete(name);return b;}).catch(e=>{this.decoding.delete(name);throw e;});this.decoding.set(name,p);}
  return this.decoding.get(name);
 }
 async unlock(){
  let resumed;
  if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.connect(this.context.destination);this.setVolume(this.volume);resumed=this.context.resume();await Promise.all(SFX_NAMES.map(n=>this.buffer(n)));}
  else resumed=this.context.resume();
  await resumed;await this.music(this.track);
 }
 async music(name){
  this.track=name;if(!this.context)return;const request=++this.requestId;
  try{const buffer=await this.buffer(name);if(request!==this.requestId)return;
   if(this.source){try{this.source.stop();}catch{}}
   this.source=this.context.createBufferSource();this.source.buffer=buffer;this.source.loop=true;const gain=this.context.createGain();gain.gain.value=.78;this.source.connect(gain);gain.connect(this.master);this.source.start();
   // Keep the current and one adjacent music buffer, while SFX stay decoded.
   const old=Object.keys(this.buffers).filter(n=>BGM_NAMES.includes(n)&&n!==name);for(const n of old.slice(0,-1))delete this.buffers[n];
  }catch(e){this.onError(e);}
 }
 sfx(name){if(!this.context||!this.buffers[name]||this.muted)return;const s=this.context.createBufferSource();s.buffer=this.buffers[name];const gain=this.context.createGain();gain.gain.value=.8;s.connect(gain);gain.connect(this.master);s.start();}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.value=this.muted?0:v;}
 toggle(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 suspend(){this.context?.suspend();}
 resume(){this.context?.resume();}
}
