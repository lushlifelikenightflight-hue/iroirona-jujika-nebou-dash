// Deterministic extraction, alpha cleanup, alignment and reflection of imagegen art.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1007-641-0_26.1007.641.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/sharp');
const game=process.env.GAME_ROOT||path.resolve(import.meta.dirname,'..'),stage=process.env.SPRITE_STAGE||null,out=stage?path.join(stage,'sprites'):path.join(game,'assets/sprites');await fs.mkdir(out,{recursive:true});
const CW=160,CH=144,AX=80,AY=136,ids=['takashi','takeru','ponite','benzo','king'],hash=data=>createHash('sha256').update(data).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(game,'assets/sprites/manifest.json'),'utf8'));manifest.version='1.6.0';manifest.fps=18;manifest.pedalFps=12;manifest.members=[];
function cuts(data,w,h,count,vertical){const size=vertical?w:h,other=vertical?h:w,result=[0];for(let i=1;i<count;i++){const begin=Math.round(size/count*(i-.3)),end=Math.round(size/count*(i+.3)),runs=[];let start=null;for(let p=begin;p<=end;p++){let occupied=0;if(p<end)for(let q=0;q<other;q++)if(data[((vertical?q*w+p:p*w+q)*4)+3])occupied++;if(p<end&&occupied===0){if(start===null)start=p;}else if(start!==null){runs.push({mid:Math.round((start+p-1)/2),width:p-start});start=null;}}if(!runs.length)throw Error('No clear separator');runs.sort((a,b)=>Math.abs(a.mid-size/count*i)-Math.abs(b.mid-size/count*i));result.push(runs[0].mid);}result.push(size);return result;}
for(const id of ids){
 const file=stage?path.join(stage,'raw',`run-${id}.png`):path.join(game,'sources/sprites/v16',`run-${id}.raw.png`),raw=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // The generator may leave low-alpha haze. Preserve the solid body pixels, remove that haze.
 for(let i=3;i<raw.data.length;i+=4)raw.data[i]=raw.data[i]>=200?255:0;
 const cleaned=await sharp(raw.data,{raw:{width:raw.info.width,height:raw.info.height,channels:4}}).png().toBuffer();
 const xs=cuts(raw.data,raw.info.width,raw.info.height,4,true),ys=cuts(raw.data,raw.info.width,raw.info.height,2,false),cells=[];
 for(let i=0;i<8;i++){
  const x=xs[i%4],y=ys[Math.floor(i/4)],w=xs[i%4+1]-x,h=ys[Math.floor(i/4)+1]-y;let left=w,top=h,right=-1,bottom=-1,faceX=0,faceCount=0;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const k=((y+yy)*raw.info.width+x+xx)*4;if(raw.data[k+3]){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}}
  if(right<0||left<=0||top<=0||right>=w-1||bottom>=h-1)throw Error(`Clipped/empty ${id}:${i} ${JSON.stringify({x,y,w,h,left,top,right,bottom})}`);
  for(let yy=top;yy<top+(bottom-top)*.38;yy++)for(let xx=Math.round(left+(right-left)*.48);xx<=right;xx++){const k=((y+yy)*raw.info.width+x+xx)*4,[r,g,b,a]=raw.data.subarray(k,k+4);if(a&&r>180&&g>110&&b>70&&r>g&&g>b){faceX+=xx;faceCount++;}}
  if(faceCount<12)throw Error(`No stable face anchor ${id}:${i}`);
  cells.push({x,y,w,h,left,top,right,bottom,height:bottom-top+1,rootX:faceX/faceCount-(bottom-top+1)*.09});
 }
 const maxHeight=Math.max(...cells.map(c=>c.height)),scale=104/maxHeight,mean=cells.reduce((n,c)=>n+c.height,0)/8,cv=Math.sqrt(cells.reduce((n,c)=>n+(c.height-mean)**2,0)/8)/mean;if(cv>.08)throw Error(`Body scale drifts ${id}: ${cv}`);
 const frames=[];for(const c of cells){const crop=await sharp(cleaned).extract({left:c.x+c.left,top:c.y+c.top,width:c.right-c.left+1,height:c.height}).resize(Math.round((c.right-c.left+1)*scale),Math.round(c.height*scale),{kernel:'nearest'}).png().toBuffer(),meta=await sharp(crop).metadata(),left=Math.round(AX-(c.rootX-c.left)*scale),top=AY-meta.height;if(left<3||left+meta.width>CW-3||top<3)throw Error(`Export bounds ${id}:${left}`);frames.push(await sharp({create:{width:CW,height:CH,channels:4,background:'#00000000'}}).composite([{input:crop,left,top}]).png().toBuffer());}
 const right=frames.slice();for(const frame of right)frames.push(await sharp(frame).flop().png().toBuffer());const hashes=frames.map(hash);if(new Set(hashes).size!==16)throw Error('Repeated frames '+id);
 await sharp({create:{width:CW*4,height:CH*4,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:(i%4)*CW,top:Math.floor(i/4)*CH}))).png().toFile(path.join(out,`run-${id}.png`));
 manifest.members.push({id,file:`run-${id}.png`,right:[0,1,2,3,4,5,6,7],left:[8,9,10,11,12,13,14,15],bodyScaleCV:cv,frameHashes:hashes,source:`sources/sprites/v16/run-${id}.raw.png`,alignment:'face-derived pelvis root + common feet line',alphaCleanupThreshold:200});console.log(`${id}: 16 distinct frames, scale CV ${cv.toFixed(3)}, body 104px`);
 }
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
