export const AUDIO_NAMES=['title','stage-1','stage-2','stage-3','stage-4','stage-5','live','taxi','jump','land','dark','fire','lightning','ice','beam','hit','kill','join','unicycle','clear'];
export class AudioManager{
 constructor(){this.bytes={};this.buffers={};this.context=null;this.source=null;this.volume=.45;this.muted=false;this.track='title';}
 async preload(){await Promise.all(AUDIO_NAMES.map(async n=>{const r=await fetch(`assets/audio/${n}.wav`);if(!r.ok)throw new Error(`音源 ${n}`);this.bytes[n]=await r.arrayBuffer();}));}
 async unlock(){if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.connect(this.context.destination);this.setVolume(this.volume);await Promise.all(Object.entries(this.bytes).map(async([n,b])=>{this.buffers[n]=await this.context.decodeAudioData(b.slice(0));}));}await this.context.resume();this.music(this.track);}
 music(name){this.track=name;if(!this.context||!this.buffers[name])return;if(this.source){try{this.source.stop();}catch{}}this.source=this.context.createBufferSource();this.source.buffer=this.buffers[name];this.source.loop=true;const gain=this.context.createGain();gain.gain.value=.72;this.source.connect(gain);gain.connect(this.master);this.source.start();}
 sfx(name){if(!this.context||!this.buffers[name]||this.muted)return;const s=this.context.createBufferSource();s.buffer=this.buffers[name];s.connect(this.master);s.start();}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.value=this.muted?0:v;}
 toggle(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 suspend(){this.context?.suspend();}
 resume(){this.context?.resume();}
}
