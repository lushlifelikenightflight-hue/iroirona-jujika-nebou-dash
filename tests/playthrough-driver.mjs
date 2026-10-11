const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function routeInput(g){
 const w=g.world,p=w.player,feet=p.y+p.h,stage=g.run.stage,tiles=w.platforms.filter(t=>!t.gone);
 if(stage===0){const pits=[[1760,110],[2780,120]],pit=pits.some(([x,width])=>p.x+p.w>x-(feet<400?100:50)&&p.x<x+width),block=tiles.some(t=>t.h<50&&t.x>p.x&&t.x<p.x+115&&t.y>p.y-30&&t.y<feet),foe=w.enemies.some(e=>!e.dead&&e.x>p.x&&e.x<p.x+110);return {right:true,jump:p.grounded&&(pit||block||foe),attack:true};}
 const ridden=tiles.find(t=>t.id===p.support&&t.kind==='moving');
 if(ridden){
  const destination=ridden.id==='ferry-west'?1320:ridden.id==='ferry-east'?4080:2970;
  const ready=ridden.travelY?ridden.y<=180:ridden.x+ ridden.w>=destination-40;
  if(ready)return {axis:1,jump:!ridden.travelY||p.x>=ridden.x+ridden.w-45,attack:true};
  return {axis:clamp((ridden.x+ridden.w/2-(p.x+p.w/2))/40,-1,1),attack:true};
 }
 if(stage===3&&p.grounded){
  for(const [edge,id] of [[770,'ferry-west'],[3630,'ferry-east']]){
   const mover=tiles.find(t=>t.id===id);
   if(p.x>edge-100&&p.x<edge&&mover.x>edge+75)return {axis:clamp((edge-75-p.x)/40,-1,1),attack:true};
  }
 }
 const ahead=tiles.filter(t=>t.x>p.x+p.w-3&&t.x<p.x+110&&t.y<feet-4&&t.y>feet-130);
 const edge=tiles.find(t=>Math.abs(t.y-feet)<3&&p.x+p.w>t.x&&p.x<t.x+t.w);
 const gap=edge&&p.x+p.w>edge.x+edge.w-24&&!tiles.some(t=>t!==edge&&t.x<=edge.x+edge.w+5&&t.x+t.w>edge.x+edge.w+20&&t.y<=feet+90&&t.y>=feet-110);
 const enemy=w.enemies.some(e=>!e.dead&&e.x>p.x&&e.x<p.x+100);
 const low=tiles.some(t=>!t.oneWay&&t.h<50&&t.x<p.x+80&&t.x+t.w>p.x&&feet-(t.y+t.h)>=42&&feet-(t.y+t.h)<76);
 return {axis:1,jump:p.grounded&&(Boolean(ahead.length)||gap||enemy)&&!low,crouch:low,attack:true};
}
export function driveStage(g,limit=30000){
 let steps=0,jumps=0,previousVy=0,falls=0;const contacts=new Set(),start=g.run.remaining;
 const emit=g.onEvent;g.onEvent=(type,value)=>{if(type==='toast'&&value.includes('足を滑らせた'))falls++;emit(type,value);};
 while(g.mode==='play'&&steps++<limit){const input=routeInput(g);g.step(1/120,input);const p=g.world.player;if(p.vy<0&&previousVy>=0)jumps++;previousVy=p.vy;if(p.support)contacts.add(p.support);}
 g.onEvent=emit;
 return {stage:g.run.stage+1,mode:g.mode,steps,jumps,falls,x:g.world.player.x,seconds:start-g.run.remaining,contacts:[...contacts]};
}
