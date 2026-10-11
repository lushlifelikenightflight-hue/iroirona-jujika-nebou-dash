import test from 'node:test';import assert from 'node:assert/strict';
import {Renderer,RENDER_ASSET_COUNT} from '../src/render.mjs';import {AudioManager,AUDIO_NAMES} from '../src/audio.mjs';
test('image and audio progress report completed assets incrementally, including the parsed manifest',async()=>{
 const saved={Image:globalThis.Image,Audio:globalThis.Audio,fetch:globalThis.fetch},images=[],requests=[];
 class ImageStub{set src(v){this.url=v;images.push(this);}}
 class AudioStub{setAttribute(){}addEventListener(){}}
 globalThis.Image=ImageStub;globalThis.Audio=AudioStub;
 globalThis.fetch=url=>new Promise(resolve=>requests.push({url:String(url),resolve}));
 try{const renderer=new Renderer({getContext(){return {};}}),audio=new AudioManager(),imageDone=[],audioDone=[];
 const loading=Promise.all([renderer.load(n=>imageDone.push(n)),audio.preload(n=>audioDone.push(n))]);
 assert.equal(imageDone.length+audioDone.length,0);
 images[0].onload();assert.equal(imageDone.length,1);assert.equal(renderer.images[imageDone[0]],images[0]);
 const manifest=requests.find(r=>r.url.includes('manifest.json'));manifest.resolve({ok:true,json:async()=>({cellWidth:10})});
 const firstAudio=requests.find(r=>!r.url.includes('manifest.json'));firstAudio.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(imageDone.length,2);assert.equal(audioDone.length,1);assert.equal(renderer.spriteManifest.cellWidth,10);
 for(const i of images.slice(1))i.onload();for(const r of requests.filter(r=>r!==manifest&&r!==firstAudio))r.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 await loading;assert.equal(new Set(imageDone).size,RENDER_ASSET_COUNT);assert.equal(new Set(audioDone).size,AUDIO_NAMES.length);
 for(const url of Object.values(audio.urls))URL.revokeObjectURL(url);
 }finally{Object.assign(globalThis,saved);}
});
test('a failed asset never reports successful completion',async()=>{
 const saved={Image:globalThis.Image,fetch:globalThis.fetch},images=[],done=[];
 globalThis.Image=class{set src(v){images.push(this);}};globalThis.fetch=async()=>({ok:true,json:async()=>({})});
 try{const r=new Renderer({getContext(){return {};}}),loading=r.load(n=>done.push(n));images[0].onerror();for(const i of images.slice(1))i.onload();await assert.rejects(loading,/画像/);assert.ok(done.length<RENDER_ASSET_COUNT);}
 finally{Object.assign(globalThis,saved);}
});
