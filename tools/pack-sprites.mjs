// Deterministic atlas extraction/export only. Creative pixels come from imagegen.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1007-641-0_26.1007.641.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/sharp');}
const root=path.resolve(import.meta.dirname,'..'),generated=path.join(root,'sources/sprites');
const inputs={takashi:'run-takashi.raw.png',takeru:'run-takeru.raw.png',ponite:'run-ponite.raw.png',benzo:'run-benzo.raw.png',king:'run-king.raw.png'};
const out=path.join(root,'assets/sprites');fs.mkdirSync(out,{recursive:true});
const CW=160,CH=144,AX=80,AY=136;
function bounds(data,width,x,y,w,h){let left=w,top=h,right=-1,bottom=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[((y+yy)*width+x+xx)*4+3]>110){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}if(right<0)throw Error('Empty sprite');return {left,top,right,bottom,w:right-left+1,h:bottom-top+1};}
async function source(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
function variance(values){const mean=values.reduce((a,b)=>a+b,0)/values.length;return Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length)/mean;}
function separators(data,info,count,axis){const size=axis==='x'?info.width:info.height,other=axis==='x'?info.height:info.width,nominal=size/count,cuts=[0];for(let i=1;i<count;i++){const start=Math.round(i*nominal-nominal*.22),end=Math.round(i*nominal+nominal*.22);let runs=[],begin=null;for(let p=start;p<=end;p++){let occupancy=0;if(p<end)for(let q=0;q<other;q++){const offset=axis==='x'?(q*info.width+p)*4:(p*info.width+q)*4;occupancy+=data[offset+3]>110;}if(p<end&&occupancy===0){if(begin===null)begin=p;}else if(begin!==null){runs.push({mid:Math.round((begin+p-1)/2),width:p-begin});begin=null;}}if(!runs.length)throw Error(`Overlapping sprites at ${axis} divider ${i}`);runs.sort((a,b)=>Math.abs(a.mid-i*nominal)-Math.abs(b.mid-i*nominal));cuts.push(runs[0].mid);}cuts.push(size);return cuts;}
async function compose(frames,cols,file){await sharp({create:{width:cols*CW,height:Math.ceil(frames.length/cols)*CH,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:i%cols*CW,top:Math.floor(i/cols)*CH}))).png().toFile(path.join(out,file));}
async function cell(file,x,y,w,h,b,scale){const crop=await sharp(file).extract({left:x+b.left,top:y+b.top,width:b.w,height:b.h}).resize(Math.round(b.w*scale),Math.round(b.h*scale),{kernel:'nearest'}).png().toBuffer();const meta=await sharp(crop).metadata();let left=Math.round(AX+(b.left+b.w/2-w/2)*scale-meta.width/2),top=AY-meta.height;if(left<3||top<3||left+meta.width>CW-3)throw Error(`Sprite leaves export cell: ${file} ${left}/${top}`);return sharp({create:{width:CW,height:CH,channels:4,background:'#00000000'}}).composite([{input:crop,left,top}]).png().toBuffer();}
const qc={cellWidth:CW,cellHeight:CH,anchor:{x:AX,y:AY},fps:12,members:[],idle:{right:'idle-right.png',left:'idle-left.png'}};
for(const [id,name] of Object.entries(inputs)){
 const file=path.join(generated,name),{data,info}=await source(file),xs=separators(data,info,4,'x'),ys=separators(data,info,4,'y'),bs=[],cells=[];
 for(let i=0;i<16;i++){const col=i%4,row=Math.floor(i/4),x=xs[col],y=ys[row],w=xs[col+1]-x,h=ys[row+1]-y;cells.push({x,y,w,h});bs.push(bounds(data,info.width,x,y,w,h));}
 const scale=104/Math.max(...bs.map(b=>b.h));let frames=[];
 for(let i=0;i<16;i++){const b=bs[i],{x,y,w,h}=cells[i];if(b.left===0||b.top===0||b.right===w-1||b.bottom===h-1)throw Error(`Source sprite ${id} frame ${i} is clipped at separator ${JSON.stringify({b,w,h})}`);frames.push(await cell(file,x,y,w,h,b,scale));}
 const hashes=frames.map(b=>createHash('sha256').update(b).digest('hex'));if(new Set(hashes.slice(0,8)).size<8||new Set(hashes.slice(8)).size<8)throw Error(`Repeated run frames ${id}`);
 const cv=variance(bs.map(b=>b.h));if(cv>.09)throw Error(`Inconsistent anatomical scale ${id}: ${cv}`);
 await compose(frames,4,`run-${id}.png`);qc.members.push({id,file:`run-${id}.png`,right:[0,1,2,3,4,5,6,7],left:[8,9,10,11,12,13,14,15],bodyScaleCV:cv,frameHashes:hashes,source:name});console.log(`${id}: 16 distinct frames, CV ${cv.toFixed(3)}`);
}
// Idle atlases are asset packs with variable cape widths: choose transparent separators.
for(const [dir,file] of [['right',path.join(root,'assets/characters.png')],['left',path.join(generated,'idle-left.raw.png')]]){
 const {data,info}=await source(file);let split=Math.round(info.height/2),best=Infinity;
 for(let yy=Math.round(info.height*.47);yy<info.height*.55;yy++){let occupancy=0;for(let x=0;x<info.width;x++)occupancy+=data[(yy*info.width+x)*4+3]>110;const value=occupancy*1000+Math.abs(yy-info.height/2);if(value<best){best=value;split=yy;}}
 let frames=[];for(let row=0;row<2;row++){const y=row?split:0,h=row?info.height-split:split,nominal=info.width/5,cuts=[0];for(let col=1;col<5;col++){let cut=Math.round(col*nominal),best=Infinity;for(let xx=Math.round(col*nominal-nominal*.2);xx<col*nominal+nominal*.2;xx++){let occupancy=0;for(let yy=y;yy<y+h;yy++)occupancy+=data[(yy*info.width+xx)*4+3]>110;let value=occupancy*1000+Math.abs(xx-col*nominal);if(value<best){best=value;cut=xx;}}cuts.push(cut);}cuts.push(info.width);for(let col=0;col<5;col++){const x=cuts[col],w=cuts[col+1]-x,b=bounds(data,info.width,x,y,w,h);frames.push(await cell(file,x,y,w,h,b,104/b.h));}}await compose(frames,5,`idle-${dir}.png`);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(qc,null,2));console.log('5 running atlases + left/right idle and unicycle atlases exported.');
