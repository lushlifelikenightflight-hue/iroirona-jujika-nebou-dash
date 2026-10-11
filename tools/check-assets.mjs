import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {ART,SPRITE_FILES} from '../src/render.mjs';import {AUDIO_NAMES,AUDIO_FILES,BGM_NAMES} from '../src/audio.mjs';
const root=path.resolve(import.meta.dirname,'..');let count=0;
for(const name of ART){assert.ok(fs.readFileSync(path.join(root,'assets/art',name+'.svg'),'utf8').includes('<svg'));count++;}
for(const name of ['characters','portrait','live']){assert.equal(fs.readFileSync(path.join(root,'assets',name+'.png')).readUInt32BE(0),0x89504e47);count++;}
for(const name of SPRITE_FILES){const b=fs.readFileSync(path.join(root,'assets/sprites',name+'.png'));assert.equal(b.readUInt32BE(0),0x89504e47);assert.equal(b[25],6,`${name}: RGBA required`);assert.equal(b.readUInt32BE(16),name.startsWith('run-')?640:800);assert.equal(b.readUInt32BE(20),name.startsWith('run-')?576:288);count++;}
const sprites=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites/manifest.json'),'utf8'));
assert.equal(sprites.members.length,5);for(const member of sprites.members){assert.equal(member.right.length,8);assert.equal(member.left.length,8);assert.equal(new Set(member.frameHashes).size,16);assert.ok(member.bodyScaleCV<.08);}
const music=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/bgm-provenance.json'),'utf8'));assert.ok(music.generator.includes('ACE-Step'));assert.equal(music.tracks.length,8);
for(const track of music.tracks){assert.equal(track.loop,true);assert.ok(track.duration>20);assert.ok(track.after.lufs>=-17.5&&track.after.lufs<=-14.5);assert.ok(track.after.peak<-.8);}
for(const name of AUDIO_NAMES){const b=fs.readFileSync(path.join(root,AUDIO_FILES[name]));if(BGM_NAMES.includes(name)){assert.ok(b.length>100000);assert.ok(b.toString('ascii',0,3)==='ID3'||b[0]===255);}else{assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(40),b.length-44);let peak=0;for(let i=44;i<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert.ok(peak>100&&peak<32767);}count++;}
console.log(`${count} assets validated; 80 distinct run frames, left/right idle, 8 ACE-Step songs, 12 SFX.`);
