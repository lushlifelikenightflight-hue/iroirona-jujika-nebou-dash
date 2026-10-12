import test from 'node:test';import assert from 'node:assert/strict';import {AudioManager,SFX_NAMES} from '../src/audio.mjs';
async function fixture(run){const saved={Audio:globalThis.Audio,window:globalThis.window};const state={playError:false,secondPlayPending:false,decodePending:false,decode:[],finishPlay:null,plays:0,sources:0};
 class Media{constructor(){this.paused=true;}setAttribute(){}addEventListener(){}play(){state.plays++;if(state.playError)throw Error('NotAllowedError');this.paused=false;if(state.secondPlayPending&&state.plays===2)return new Promise(r=>state.finishPlay=r);return Promise.resolve();}pause(){this.paused=true;}}
 class Context{constructor(){this.state='running';this.sampleRate=44100;this.destination={};}createGain(){return {gain:{value:1},connect(){},disconnect(){}};}createBufferSource(){return {connect(){},disconnect(){},start(){state.sources++;}};}createBuffer(){return {};}resume(){return Promise.resolve();}decodeAudioData(){return state.decodePending?new Promise(r=>state.decode.push(r)):Promise.resolve({});}}
 globalThis.Audio=Media;globalThis.window={AudioContext:Context};try{const a=new AudioManager();for(const n of SFX_NAMES)a.bytes[n]=new ArrayBuffer(1);a.urls={title:'blob:title','stage-1':'blob:stage'};await run(a,state);}finally{Object.assign(globalThis,saved);}}
test('OFF pauses BGM, silences the effect master and remains OFF across tracks and activation',async()=>fixture(async(a,state)=>{
 await a.unlock();a.sfx('jump');const before=state.sources;a.setMuted(true);assert.equal(a.state,'muted');assert.equal(a.musicElement.paused,true);assert.equal(a.musicElement.muted,true);assert.equal(a.master.gain.value,0);a.sfx('jump');assert.equal(state.sources,before);const plays=state.plays;await a.music('stage-1');await a.unlock();assert.equal(state.plays,plays);assert.equal(a.state,'muted');assert.equal(a.master.gain.value,0);a.setMuted(false);await a.unlock();assert.equal(a.state,'playing');assert.equal(a.master.gain.value,.55);assert.equal(a.musicElement.muted,false);
}));
test('turning OFF during decoding cannot be undone by the late completion',async()=>fixture(async(a,state)=>{
 state.decodePending=true;const pending=a.unlock();assert.equal(a.state,'starting');a.setMuted(true);assert.equal(a.state,'muted');for(const resolve of state.decode)resolve({});await pending;assert.equal(a.state,'muted');assert.equal(a.musicElement.paused,true);assert.equal(a.master.gain.value,0);
}));
test('an older activation cannot finish a newer pending activation',async()=>fixture(async(a,state)=>{
 state.decodePending=true;state.secondPlayPending=true;const older=a.unlock();a.setMuted(true);a.setMuted(false);const newer=a.unlock();for(const resolve of state.decode)resolve({});await older;assert.equal(a.state,'starting');state.finishPlay();await newer;assert.equal(a.state,'playing');
}));
test('a failed playback reports retry rather than ON, and the next activation can recover',async()=>fixture(async(a,state)=>{
 state.playError=true;await a.unlock();assert.equal(a.state,'retry');state.playError=false;await a.unlock();assert.equal(a.state,'playing');
}));
