import {MEMBERS,STAGES,GROUND,score,BOSS_SCORE,BEAM_DIRECTIONS} from './data.mjs?v=1.7.0';
import {DIFFICULTY} from './difficulty.mjs?v=1.7.0';
import {createGimmicks,applyGimmicks} from './gimmicks.mjs?v=1.7.0';
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rect=(x,y,w,h)=>({x,y,w,h});
// SAT between each finite diagonal beam rectangle and the enemy body.
export function beamHitsEnemy(fx,e){
 const length=fx.reach*Math.SQRT2,q=Math.SQRT1_2;
 return BEAM_DIRECTIONS.some(([sx,sy])=>{
  const ux=sx*q,uy=sy*q,cx=fx.x+ux*length/2,cy=fx.y+uy*length/2;
  const dx=e.x+e.w/2-cx,dy=e.y+e.h/2-cy;
  return [[1,0],[0,1],[ux,uy],[-uy,ux]].every(([ax,ay])=>
   Math.abs(dx*ax+dy*ay)<=Math.abs(ax*ux+ay*uy)*length/2+Math.abs(-ax*uy+ay*ux)*fx.width/2+Math.abs(ax)*e.w/2+Math.abs(ay)*e.h/2);
 });
}
export class Game {
 constructor(onEvent=()=>{}){this.onEvent=onEvent;this.mode='title';this.run=null;this.world=null;this.cooldowns=[0,0,0,0,0];}
 emit(type,value){this.onEvent(type,value);}
 start(saved=null){this.run=saved?structuredClone(saved):{stage:0,crew:[0],selected:0,kills:0,bossKills:0,remaining:720,hp:5};this.cooldowns=[0,0,0,0,0];this.loadStage(this.run.stage);}
 loadStage(index){const d=STAGES[index];this.run.stage=index;this.run.hp=5;this.cooldowns.fill(0);let platforms=[],last=0;for(const [x,w] of d.pits){platforms.push(rect(last,GROUND,x-last,160));last=x+w;}platforms.push(rect(last,GROUND,d.length-last,160));for(const [x,y,w,h=20] of d.platforms)platforms.push(rect(x,y,w,h));
 const difficulty=DIFFICULTY[index];let enemies=difficulty.spawns.map(([x,kind],n)=>({...rect(x,kind==='bat'?280:GROUND-48,kind==='bat'?46:38,48),kind,hp:kind==='bell'?difficulty.bellHP:1,startX:x,startY:kind==='bat'?280:GROUND-48,t:n,cooldown:difficulty.airShotInterval||difficulty.shotInterval,airAttack:kind==='bat'&&x>=difficulty.airAttackFrom,windup:0,dead:false}));
 if(d.route==='battle'){
  enemies=enemies.filter(e=>e.startX<1740||e.startX>2670);
  for(const [n,x,kind] of [[0,1830,'ghost'],[1,1950,'bell'],[2,2060,'ghost'],[3,2190,'bat'],[4,2300,'ghost'],[5,2430,'bell'],[6,2540,'ghost']]){
   const y=kind==='bat'?210:GROUND-48;
   enemies.push({...rect(x,y,kind==='bat'?46:38,48),kind,hp:kind==='bell'?2:1,startX:x,startY:y,t:n,cooldown:2,dead:false,guardId:`guard-${n}`});
  }
 }
 if(index===4)enemies.push({...rect(4100,GROUND-132,120,132),kind:'boss',hp:12,startX:4100,startY:GROUND-132,t:0,cooldown:2,dead:false});
 this.world={length:d.length,top:d.top||0,bottom:d.bottom||580,fallLimit:(d.bottom||580)+30,route:d.route,difficulty,platforms,enemies,gimmicks:createGimmicks(index),items:[{...rect(390,GROUND-48,38,48),kind:'wheel',used:false},{...rect(index===0?2550:d.length-1300,GROUND-48,38,48),kind:'wheel',used:false}],door:d.member===null?null:{...rect(d.doorX,d.doorY-105,90,105),member:d.member,secret:d.secret,visible:d.route!=='battle',guardIds:enemies.filter(e=>e.guardId).map(e=>e.guardId)},player:{...rect(80,GROUND-76,30,76),vx:0,vy:0,face:1,grounded:true,coyote:.1,jumpBuffer:0,animTime:0,invincible:0,wheel:0,safeX:80,safeY:GROUND-76},effects:[],shots:[],particles:[],history:[],time:0,room:false,roomMember:null};this.mainWorld=null;this.mode='intro';this.emit('intro',d.intro);this.emit('checkpoint',this.run);}
 play(){this.mode='play';this.emit('music',`stage-${this.run.stage+1}`);}
 pause(silent=false){if(this.mode==='play'){this.mode='pause';this.emit('pause',{silent});}}
 resume(){if(this.mode==='pause'){this.mode='play';this.emit('resume');}}
 select(index){if(this.run?.crew.includes(index)){this.run.selected=index;this.emit('select',index);}}
 cycle(){const c=this.run?.crew;if(!c||c.length<2)return false;this.select(c[(c.indexOf(this.run.selected)+1)%c.length]);return true;}
 setCrouching(value){const p=this.world.player,height=value?42:76;if(value){p.sliding=null;p.slideBoost=0;}if(p.h===height){p.crouching=value;return true;}const bottom=p.y+p.h,body=rect(p.x,bottom-height,p.w,height);if(!value&&this.world.platforms.some(t=>overlap(body,t)))return false;p.y=bottom-height;p.h=height;p.crouching=value;if(value){if(p.wheel>0){p.wheel=0;this.emit('toast','しゃがんで一輪車から降りた。');}this.emit('sfx','crouch');}return true;}
 nearbyDoor(){const w=this.world,p=w.player;if(w.room){const d=w.roomExit;return Math.abs(p.x+p.w/2-(d.x+d.w/2))<80&&Math.abs(p.y+p.h-(d.y+d.h))<40?'exit':null;}return w.door&&w.door.visible&&Math.abs(p.x-(w.door.x+30))<100&&Math.abs(p.y+p.h-(w.door.y+w.door.h))<50?'enter':null;}
 interact(){if(this.mode!=='play')return false;let n=this.nearbyDoor();if(n==='exit'){this.world=this.mainWorld;this.mainWorld=null;this.protectReturn();this.emit('room',false);this.emit('toast','家の外：3秒間の保護。今のうちに進もう。');return true;}if(n==='enter'){const m=this.world.door.member;this.mainWorld=this.world;this.world={length:1100,platforms:[rect(0,GROUND,1100,160),rect(180,350,160,20)],enemies:[],items:[],gimmicks:[],door:null,roomExit:rect(505,GROUND-105,90,105),player:{...this.mainWorld.player,x:535,y:GROUND-76,h:76,crouching:false,vx:0,vy:0,safeX:535,safeY:GROUND-76,grounded:true},effects:[],shots:[],particles:[],history:[],time:0,room:true,roomMember:m};this.emit('room',true);this.emit('toast',`${MEMBERS[m].name}の${STAGES[this.run.stage].secret?'隠し部屋':'家'}。中央のドアから右へ迎えに行こう。`);return true;}return false;}
 protectReturn(){const w=this.world,p=w.player;p.vx=p.vy=0;p.jumpBuffer=0;p.sliding=null;p.slideBoost=0;p.invincible=Math.max(p.invincible,3);p.exitGrace=3;w.shots=w.shots.filter(s=>Math.abs(s.x+s.w/2-(p.x+p.w/2))>400);for(const e of w.enemies)if(!e.dead&&Math.abs(e.x+e.w/2-(p.x+p.w/2))<400)e.stunned=3.2;w.history=[];}
 attack(){if(this.mode!=='play')return false;const id=this.run.selected;if(this.cooldowns[id]>0)return false;const member=MEMBERS[id];this.cooldowns[id]=member.cooldown;const p=this.world.player,face=p.face;let fx={id,x:p.x+15,y:p.y+p.h*.45,face,age:0,life:member.life,width:member.width,height:member.height,reach:member.reach,hit:new Set(),tick:0};if(id===0){fx.x+=face*140;fx.y+=5;}if(id===1)fx.x+=face*35;if(id===2){fx.x+=face*member.reach;fx.y=Math.min(-90,p.y-180);fx.floor=this.world.platforms.filter(t=>fx.x>=t.x&&fx.x<=t.x+t.w&&t.y>=p.y+p.h-5).sort((a,b)=>a.y-b.y)[0]?.y??p.y+p.h;}if(id===3){fx.x+=face*member.reach;fx.y=p.y+p.h-member.height;}this.world.effects.push(fx);this.emit('sfx',['dark','fire','lightning','ice','beam'][id]);return true;}
 damage(){const p=this.world.player;if(p.invincible>0)return;p.wheel=0;p.wheelPending=0;p.invincible=1.3;p.vx=-p.face*200;p.vy=-220;this.run.hp--;this.emit('sfx','hit');if(this.run.hp<=0){this.run.remaining=Math.max(0,this.run.remaining-20);this.run.hp=5;this.recover();this.emit('toast','もう一度立ち上がる。−20秒');}}
 recover(){let p=this.world.player;p.x=p.safeX;p.y=p.safeY;p.h=76;p.crouching=false;p.vx=p.vy=0;p.invincible=1.3;p.wheel=0;p.wheelPending=0;p.sliding=null;p.slideBoost=0;}
 kill(e){if(e.dead)return;e.dead=true;if(e.kind==='boss'){this.run.bossKills++;this.emit('toast',`寝坊の大時計を止めた！ +${BOSS_SCORE}`);}else this.run.kills++;this.revealHouse();this.emit('sfx','kill');this.world.particles.push({x:e.x+e.w/2,y:e.y+e.h/2,age:0,color:e.kind==='boss'?'#f6d48c':'#bb88dc'});}
 revealHouse(){const w=this.world,d=w.door;if(!d||d.visible||!d.guardIds.length)return;const defeated=d.guardIds.every(id=>w.enemies.some(e=>e.guardId===id&&e.dead));if(defeated){d.visible=true;this.emit('sfx','join');this.emit('toast','魔物の気配が消え、薔薇の扉が現れた！');}}
 hitEnemy(e,damage){if(e.dead)return;e.hp-=damage;if(e.hp<=0)this.kill(e);}
 finish(timeout){this.mode='ending';this.endingTimeout=timeout;this.result=score(this.run,timeout);this.emit('ending',{timeout,score:this.result});}
 nextStage(){if(this.run.stage===4){this.finish(false);return;}this.loadStage(this.run.stage+1);}
 step(dt,input={}){if(this.mode!=='play')return;dt=Math.min(dt,.04);const w=this.world,p=w.player;w.time+=dt;this.run.remaining=Math.max(0,this.run.remaining-dt);if(this.run.remaining<=0){this.finish(true);return;}for(let i=0;i<5;i++)this.cooldowns[i]=Math.max(0,this.cooldowns[i]-dt);p.invincible=Math.max(0,p.invincible-dt);p.wheel=Math.max(0,p.wheel-dt);p.exitGrace=Math.max(0,(p.exitGrace||0)-dt);
 if(input.switch)this.cycle();if(input.attack)this.attack();if(input.interact)this.interact();if(w!==this.world)return;
 this.setCrouching(Boolean(input.crouch&&p.grounded));
 if(p.wheelPending&&!p.crouching){p.wheel=p.wheelPending;p.wheelPending=0;this.emit('toast','通路を抜けた！ 一輪車で18秒スピードアップ');}
 if(input.jump)p.jumpBuffer=.12;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
 const keyboard=(input.right?1:0)-(input.left?1:0),dir=(input.left||input.right)?keyboard:Number.isFinite(input.axis)?clamp(input.axis,-1,1):0,speed=300*(p.wheel>0?1.55:1)*(p.crouching?.35:1),target=!p.crouching&&p.sliding?(dir<0?180:Math.max(520,speed)):(!p.crouching&&p.slideBoost>0&&dir>=0?Math.max(520,dir*speed):dir*speed);let accel=p.sliding?3200:dir?2200:1900;p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);if(dir)p.face=Math.sign(dir);
 if(p.jumpBuffer>0&&p.coyote>0&&this.setCrouching(false)){p.vy=-650;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.sliding=null;this.emit('sfx','jump');}
 let prev={...p};p.x=clamp(p.x+p.vx*dt,0,w.length-p.w);for(let t of w.platforms){if(overlap(p,t)){if(p.vx>0)p.x=t.x-p.w;else if(p.vx<0)p.x=t.x+t.w;p.vx=0;}}
 p.vy+=1800*dt;prev.y=p.y;p.y+=p.vy*dt;p.grounded=false;for(let t of w.platforms){if(overlap(p,t)){if(p.vy>=0&&prev.y+prev.h<=t.y+2){p.y=t.y-p.h;p.vy=0;p.grounded=true;}else if(p.vy<0&&prev.y>=t.y+t.h-2){p.y=t.y+t.h;p.vy=0;}}}
 applyGimmicks(w,p,prev,dt,(type,value)=>this.emit(type,value));
 if(p.grounded&&!p.sliding&&w.platforms.some(t=>t.h===160&&Math.abs(p.y+p.h-t.y)<1&&p.x>t.x+40&&p.x+p.w<t.x+t.w-60)&&!p.crouching){p.safeX=p.x;p.safeY=p.y;}
 if(p.y>(w.fallLimit||610)){this.run.remaining=Math.max(0,this.run.remaining-8);this.recover();this.emit('toast','足を滑らせた！ −8秒');}
 for(const item of w.items){if(!item.used&&overlap(p,item)){item.used=true;if(p.crouching)p.wheelPending=18;else p.wheel=18;this.emit('sfx','unicycle');this.emit('toast',p.crouching?'一輪車を拾った。通路を抜けてから乗ろう。':'一輪車！ 18秒スピードアップ');}}
 if(w.room&&w.roomMember!==null&&p.x>740&&!this.run.crew.includes(w.roomMember)){this.run.crew.push(w.roomMember);this.emit('join',w.roomMember);this.emit('sfx','join');this.emit('toast',`${MEMBERS[w.roomMember].name}「寝坊した！ 一緒に行こう。」`);}
 for(const e of w.enemies){if(e.dead)continue;if(e.stunned>0){e.stunned=Math.max(0,e.stunned-dt);continue;}e.t+=dt;if(e.kind==='ghost'){e.x=e.startX+Math.sin(e.t*(w.difficulty?.patrolRate||1.3))*(w.difficulty?.patrolRange||90)+(e.pullX||0);e.y=e.startY+(e.pullY||0);}if(e.kind==='bat'){e.x=e.startX+Math.sin(e.t*(w.difficulty?.batRate||1.4))*(w.difficulty?.patrolRange||80)+(e.pullX||0);e.y=e.startY+Math.sin(e.t*2.2)*50+(e.pullY||0);}if(e.airAttack){
  const interval=w.difficulty.airShotInterval;
  if(Math.abs(e.x-p.x)<600){
   if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup===0){
    const x=e.x+e.w/2,y=e.y+e.h/2,dx=p.x+p.w/2-x,dy=p.y+p.h/2-y,distance=Math.hypot(dx,dy)||1,speed=w.difficulty.airShotSpeed;
    w.shots.push({...rect(x-7,y-7,14,14),vx:dx/distance*speed,vy:dy/distance*speed});e.cooldown=interval;
   }}else{e.cooldown-=dt;if(e.cooldown<=0)e.windup=.45;}
  }else{e.windup=0;e.cooldown=interval;}
 }if(e.kind==='bell'||e.kind==='boss'){e.cooldown-=dt;if(e.cooldown<=0&&Math.abs(e.x-p.x)<650){e.cooldown=e.kind==='boss'?1.55:(w.difficulty?.shotInterval||2.5);let vx=(p.x<e.x?-1:1)*(w.difficulty?.shotSpeed||200);w.shots.push({...rect(e.x+e.w/2,e.y+35,14,14),vx,vy:e.kind==='boss'?65:0});if(e.kind==='boss')w.shots.push({...rect(e.x+e.w/2,e.y+80,14,14),vx,vy:-85});}}
 if(overlap(p,e)){if(e.kind==='ghost'&&p.vy>0&&prev.y+prev.h<=e.y+15){this.hitEnemy(e,1);p.vy=-390;}else this.damage();}}
 for(const fx of w.effects){fx.age+=dt;fx.tick+=dt;let hitbox;if(fx.id===0){hitbox=rect(fx.x-100,fx.y-100,200,200);}if(fx.id===1){fx.x+=fx.face*440*dt;hitbox=rect(fx.x-22,fx.y-14,44,28);}if(fx.id===2){fx.y+=MEMBERS[2].dropSpeed*dt;if(fx.y+fx.height>=(fx.floor??GROUND)){fx.y=(fx.floor??GROUND)-fx.height;fx.age=fx.life;}hitbox=rect(fx.x-fx.width/2,fx.y,fx.width,fx.height);}if(fx.id===3){fx.face=p.face;fx.x=p.x+p.w/2+p.face*fx.reach;fx.y=p.y+p.h-fx.height;hitbox=rect(fx.x-fx.width/2,fx.y,fx.width,fx.height);}if(fx.id===4){for(const e of w.enemies){if(e.dead)continue;if(beamHitsEnemy(fx,e)&&!fx.hit.has(e)){fx.hit.add(e);this.hitEnemy(e,2);}}}
 if(hitbox){for(const e of w.enemies){if(e.dead)continue;if(fx.id===0&&overlap(e,hitbox)){const dx=(fx.x-e.x)*dt*3,dy=(fx.y-e.y)*dt*3;e.x+=dx;e.y+=dy;if(e.kind==='ghost'||e.kind==='bat'){e.pullX=(e.pullX||0)+dx;e.pullY=(e.pullY||0)+dy;}if(fx.tick>=.5)this.hitEnemy(e,1);}else if(overlap(e,hitbox)&&!fx.hit.has(e)){fx.hit.add(e);this.hitEnemy(e,fx.id===2?3:fx.id===1?2:1);}}if(fx.id===0&&fx.tick>=.5)fx.tick=0;if(fx.id===3)w.shots=w.shots.filter(s=>!overlap(s,hitbox));}}
 w.effects=w.effects.filter(f=>f.age<f.life);for(const shot of w.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;if(overlap(p,shot)){shot.dead=true;this.damage();}}w.shots=w.shots.filter(s=>!s.dead&&s.x>0&&s.x<w.length&&s.y<(w.fallLimit||610)&&s.y>(w.top||0)-200);w.particles.forEach(v=>v.age+=dt);w.particles=w.particles.filter(v=>v.age<.6);
 p.animTime=p.grounded&&!p.crouching&&Math.abs(p.vx)>5?(p.animTime||0)+dt*Math.abs(p.vx)/300:0;w.history.push({x:p.x,y:p.y,h:p.h,crouching:p.crouching,face:p.face,wheel:p.wheel,vx:p.vx,grounded:p.grounded,animTime:p.animTime});if(w.history.length>240)w.history.shift();
 if(!w.room&&p.x>w.length-115){this.mode='clear';this.emit('sfx','clear');this.emit('clear',STAGES[this.run.stage].outro);}
 }
}
export function validSave(raw){if(!raw||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>4||!Array.isArray(raw.crew)||raw.crew.length<1||raw.crew.length>5||raw.crew[0]!==0||new Set(raw.crew).size!==raw.crew.length||!raw.crew.every(n=>Number.isInteger(n)&&n>=0&&n<5)||!raw.crew.includes(raw.selected))return false;return ['kills','bossKills','remaining','hp'].every(k=>Number.isFinite(raw[k])&&raw[k]>=0)&&raw.remaining<=720&&raw.hp<=5;}
