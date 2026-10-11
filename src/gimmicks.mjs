import {GROUND,STAGES} from './data.mjs?v=1.4.0';
export const GIMMICK_LAYOUTS=[
 {spring:820,slide:2160,width:220,rise:72},
 {spring:780,slide:2560,width:260,rise:86},
 {spring:720,slide:2950,width:260,rise:75},
 {spring:640,slide:3200,width:270,rise:88},
 {spring:940,slide:2650,width:260,rise:84}
];
export function createGimmicks(stage){
 const d=GIMMICK_LAYOUTS[stage],items=[{id:'spring',kind:'spring',x:d.spring,y:GROUND-36,w:64,h:36,pressed:0},{id:'slide',kind:'slide',x:d.slide,y:GROUND-d.rise,w:d.width,h:d.rise}];
 const spring=(id,x,floor,launch)=>({id,kind:'spring',x,y:floor-36,w:64,h:36,pressed:0,launch});
 if(STAGES[stage].route==='pit')items.push(spring('pit-return',930,760,1300));
 if(STAGES[stage].route==='sky')items.push(spring('sky-first',1760,420,1050),spring('sky-second',2090,150,1050));
 return items;
}
export const slideSurface=(g,x)=>g.y+Math.max(0,Math.min(1,(x-g.x)/g.w))*g.h;
export function applyGimmicks(w,p,prev,dt,emit){
 const before=p.sliding;p.sliding=null;p.springCooldown=Math.max(0,(p.springCooldown||0)-dt);p.slideBoost=Math.max(0,(p.slideBoost||0)-dt);
 for(const g of w.gimmicks||[]){
  if(g.kind==='spring')g.pressed=Math.max(0,g.pressed-dt);
  if(p.x+p.w<=g.x||p.x>=g.x+g.w)continue;
  if(g.kind==='spring'&&p.vy>=0&&p.springCooldown===0&&prev.y+prev.h<=g.y+g.h+2&&p.y+p.h>=g.y&&p.y+p.h<=g.y+g.h+4){
   p.y=g.y-p.h;p.vy=-(g.launch||980);p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.springCooldown=.2;g.pressed=.2;emit('sfx','spring');emit('toast','バネで大ジャンプ！');w.particles.push({x:g.x+g.w/2,y:g.y,age:0,color:'#e9c690'});
  }
  if(g.kind==='slide'){
   const y=slideSurface(g,p.x+p.w/2),tolerance=3+Math.abs(p.vx*dt)*g.h/g.w;
   const blocked=w.platforms.some(t=>p.x<t.x+t.w&&p.x+p.w>t.x&&y>t.y+.01&&y-p.h<t.y+t.h);
   const continuing=before===g.id&&prev.grounded;
   if(!blocked&&p.vy>=0&&prev.y+prev.h<=y+tolerance&&(continuing||p.y+p.h>=y-1)){
    p.y=y-p.h;p.vy=0;p.grounded=true;p.sliding=g.id;p.slideBoost=.25;
    if(before!==g.id){emit('sfx','slide');emit('toast','滑り台！ ジャンプで抜け出せる');}
   }
  }
 }
}
