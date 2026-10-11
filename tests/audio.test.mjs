import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager,SFX_NAMES} from '../src/audio.mjs';
test('tap activates BGM before async SFX decode and retains media element across songs',async()=>{
 const events=[],savedAudio=globalThis.Audio,savedWindow=globalThis.window;
 class Media{constructor(){this.paused=true;this.volume=1;this.src='';}setAttribute(){}addEventListener(){}play(){events.push('play');this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
 class Context{constructor(){this.state='suspended';this.sampleRate=44100;this.destination={};}createGain(){return {gain:{value:1},connect(){},disconnect(){}};}createBufferSource(){return {connect(){},disconnect(){},start(){events.push('source');}};}createBuffer(){return {};}resume(){events.push('resume');this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}decodeAudioData(){events.push('decode');return Promise.resolve({duration:.2});}}
 globalThis.Audio=Media;globalThis.window={AudioContext:Context};
 try{const a=new AudioManager();for(const n of SFX_NAMES)a.bytes[n]=new ArrayBuffer(1);a.urls={title:'blob:title','stage-1':'blob:stage'};const media=a.musicElement;await a.unlock();assert.ok(events.indexOf('play')<events.indexOf('decode'));assert.equal(a.state,'playing');assert.equal(a.context.state,'running');assert.equal(Object.keys(a.buffers).length,15);await a.music('stage-1');assert.equal(a.musicElement,media);assert.equal(media.src,'blob:stage');a.sfx('jump');assert.equal(events.at(-1),'source');a.suspend();assert.equal(a.state,'paused');a.resume();assert.equal(a.state,'playing');a.toggle();assert.equal(a.state,'muted');assert.equal(media.paused,true);a.toggle();assert.equal(a.state,'playing');a.setVolume(.3);assert.equal(media.volume,.3*.85);assert.equal(a.master.gain.value,.3);}
 finally{if(savedAudio===undefined)delete globalThis.Audio;else globalThis.Audio=savedAudio;if(savedWindow===undefined)delete globalThis.window;else globalThis.window=savedWindow;}
});
