// Only deterministic extraction and alignment of image_gen artwork.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,bounds,source,variance,separators,compose,cell} from './sprite-pack-utils.mjs';
const manifestFile=path.join(root,'assets/sprites/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
manifest.pedal=[];
async function framesOf(filename,cols,rows,height){
 const file=path.join(root,'sources/sprites',filename),{data,info}=await source(file),xs=separators(data,info,cols,'x'),cells=[],rowCuts=[];
 // Each column has its own transparent gutters; generated row baselines vary slightly.
 for(let col=0;col<cols;col++){const width=xs[col+1]-xs[col],strip=Buffer.alloc(width*info.height*4);for(let y=0;y<info.height;y++)data.copy(strip,y*width*4,(y*info.width+xs[col])*4,(y*info.width+xs[col+1])*4);rowCuts.push(separators(strip,{width,height:info.height},rows,'y'));}
 for(let i=0;i<cols*rows;i++){
  const col=i%cols,row=Math.floor(i/cols),ys=rowCuts[col],x=xs[col],y=ys[row],w=xs[col+1]-x,h=ys[row+1]-y,b=bounds(data,info.width,x,y,w,h);
  if((x===0&&b.left===0)||(y===0&&b.top===0)||(x+w===info.width&&b.right===w-1)||(y+h===info.height&&b.bottom===h-1))throw Error(`${filename} frame ${i} touches source edge: ${JSON.stringify({x,y,w,h,b})}`);
  // Wheel contact (or boots) anchors horizontally, rather than the waving cape.
  let sum=0,count=0;for(let yy=Math.max(b.top,b.bottom-5);yy<=b.bottom;yy++)for(let xx=b.left;xx<=b.right;xx++)if(data[((y+yy)*info.width+x+xx)*4+3]>110){sum+=xx;count++;}
  b.contactX=sum/count;cells.push({x,y,w,h,b});
 }
 const scale=height/Math.max(...cells.map(c=>c.b.h));const frames=[];for(const c of cells)frames.push(await cell(file,c.x,c.y,c.w,c.h,c.b,scale));
 return {frames,scale,cv:variance(cells.map(c=>c.b.h)),hashes:frames.map(f=>createHash('sha256').update(f).digest('hex'))};
}
for(const member of manifest.members){const source=`pedal-${member.id}.raw.png`,item=await framesOf(source,4,4,104);if(new Set(item.hashes).size!==16||item.cv>.09)throw Error('Pedal frame consistency '+member.id);await compose(item.frames,4,`pedal-${member.id}.png`);manifest.pedal.push({id:member.id,file:`pedal-${member.id}.png`,source,right:[0,1,2,3,4,5,6,7],left:[8,9,10,11,12,13,14,15],bodyScaleCV:item.cv,frameHashes:item.hashes});console.log(`${member.id}: 16 pedal frames, CV ${item.cv.toFixed(3)}`);}
const crouch=await framesOf('crouch.raw.png',5,2,62);await compose(crouch.frames,5,'crouch.png');manifest.crouch={file:'crouch.png',source:'crouch.raw.png',right:[0,1,2,3,4],left:[5,6,7,8,9],height:62,frameHashes:crouch.hashes};manifest.version='1.2.0';fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));console.log('80 pedal + 10 crouch frames exported.');
