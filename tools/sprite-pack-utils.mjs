// Deterministic atlas extraction/export only. Creative pixels come from imagegen.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1007-641-0_26.1007.641.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/sharp');}
const root=path.resolve(import.meta.dirname,'..'),generated=path.join(root,'sources/sprites');
const out=path.join(root,'assets/sprites');const CW=160,CH=144,AX=80,AY=136;
function bounds(data,width,x,y,w,h){let left=w,top=h,right=-1,bottom=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[((y+yy)*width+x+xx)*4+3]>110){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}if(right<0)throw Error('Empty sprite');return {left,top,right,bottom,w:right-left+1,h:bottom-top+1};}
async function source(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
function variance(values){const mean=values.reduce((a,b)=>a+b,0)/values.length;return Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length)/mean;}
function separators(data,info,count,axis){const size=axis==='x'?info.width:info.height,other=axis==='x'?info.height:info.width,nominal=size/count,cuts=[0];for(let i=1;i<count;i++){const start=Math.round(i*nominal-nominal*.45),end=Math.round(i*nominal+nominal*.45);let runs=[],begin=null;for(let p=start;p<=end;p++){let occupancy=0;if(p<end)for(let q=0;q<other;q++){const offset=axis==='x'?(q*info.width+p)*4:(p*info.width+q)*4;occupancy+=data[offset+3]>110;}if(p<end&&occupancy===0){if(begin===null)begin=p;}else if(begin!==null){runs.push({mid:Math.round((begin+p-1)/2),width:p-begin});begin=null;}}if(!runs.length)throw Error(`Overlapping sprites at ${axis} divider ${i}`);runs.sort((a,b)=>Math.abs(a.mid-i*nominal)-Math.abs(b.mid-i*nominal));cuts.push(runs[0].mid);}cuts.push(size);return cuts;}
async function compose(frames,cols,file){await sharp({create:{width:cols*CW,height:Math.ceil(frames.length/cols)*CH,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:i%cols*CW,top:Math.floor(i/cols)*CH}))).png().toFile(path.join(out,file));}
async function cell(file,x,y,w,h,b,scale){const crop=await sharp(file).extract({left:x+b.left,top:y+b.top,width:b.w,height:b.h}).resize(Math.round(b.w*scale),Math.round(b.h*scale),{kernel:'nearest'}).png().toBuffer();const meta=await sharp(crop).metadata();let left=Math.round(AX-(b.contactX-b.left)*scale),top=AY-meta.height;if(left<3||top<3||left+meta.width>CW-3)throw Error(`Sprite leaves export cell: ${file} ${left}/${top}`);return sharp({create:{width:CW,height:CH,channels:4,background:'#00000000'}}).composite([{input:crop,left,top}]).png().toBuffer();}

export {root,bounds,source,variance,separators,compose,cell};
