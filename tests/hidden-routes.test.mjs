import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.mjs';import {cameraY} from '../src/render.mjs';
const ready=stage=>{const g=new Game();g.start();g.loadStage(stage);g.play();g.world.items=[];return g;};
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/120,input);};
const until=(g,predicate,input,limit=1800)=>{for(let i=0;i<limit&&!predicate();i++)g.step(1/120,typeof input==='function'?input(g.world.player):input);assert.ok(predicate(),JSON.stringify(g.world.player));};
function recruit(g){const outer=g.world,location={x:outer.player.x,y:outer.player.y};assert.equal(g.interact(),true);until(g,()=>g.run.crew.includes(g.world.roomMember),{right:true});until(g,()=>g.world.player.x<555,{left:true});assert.equal(g.interact(),true);assert.equal(g.world,outer);assert.equal(outer.player.x,location.x);assert.equal(outer.player.y,location.y);assert.equal(outer.player.exitGrace,3);}
test('pit house reached by falling, recruited, then return spring reaches the surface',()=>{
 const g=ready(1),w=g.world,p=w.player;w.enemies=[];p.x=860;
 until(g,()=>p.x>=1040,{right:true});until(g,()=>p.grounded&&p.y+p.h===760,{});
 assert.ok(cameraY(w)>300);assert.equal(g.run.hp,5);
 until(g,()=>g.nearbyDoor()==='enter',{right:true});recruit(g);
 until(g,()=>p.vy< -1100,{left:true});p.vx=0;
 until(g,()=>p.y+p.h<360,{});until(g,()=>p.x>1190,{right:true});
 until(g,()=>p.grounded&&p.y+p.h<=420,{right:true});
 assert.ok(p.x>1140);assert.equal(g.run.hp,5);assert.ok(g.run.remaining>700);assert.equal(cameraY(w),0);
});
test('two spring tiers reach sky house and allow returning to main route',()=>{
 const g=ready(2),w=g.world,p=w.player;w.enemies=[];p.x=1715;
 until(g,()=>p.vy< -1000,{right:true});
 until(g,()=>p.grounded&&p.y+p.h===150,p=>({right:p.x<2030,left:p.x>2070}));
 const second=w.gimmicks.find(s=>s.id==='sky-second');assert.ok(second);
 until(g,()=>p.vy< -1000,{right:true});
 until(g,()=>p.grounded&&p.y+p.h===-120,p=>({right:p.x<2390,left:p.x>2430}));
 assert.ok(cameraY(w)<-350);until(g,()=>g.nearbyDoor()==='enter',{right:true});recruit(g);
 until(g,()=>p.x>2700,{right:true});until(g,()=>p.grounded&&p.y+p.h>=300,{right:true});
 assert.ok(p.x>2680);assert.equal(g.run.hp,5);assert.ok(g.run.remaining>700);
 const ledges=w.platforms.filter(t=>t.y===150||t.y===-120);assert.equal(ledges.length,2);assert.ok(420-ledges[0].y>650**2/(2*1800));assert.ok(ledges[0].y-ledges[1].y>650**2/(2*1800));assert.ok(w.platforms.filter(t=>t.x<ledges[0].x&&t.x+t.w>ledges[0].x-350&&t.y>ledges[0].y).every(t=>t.y-ledges[0].y>650**2/(2*1800)),'Nearby lower ledges cannot bypass the first spring');
});
test('sealed house requires every designated guard; unrelated enemies do not unlock it',()=>{
 const g=ready(3),w=g.world,p=w.player,d=w.door,guards=w.enemies.filter(e=>e.guardId);
 p.x=d.x+30;p.y=d.y+d.h-p.h;assert.equal(d.visible,false);assert.equal(g.nearbyDoor(),null);assert.equal(g.interact(),false);
 for(const e of w.enemies.filter(e=>!e.guardId))g.kill(e);assert.equal(d.visible,false);
 for(const e of guards.slice(0,-1))g.kill(e);assert.equal(d.visible,false);
 g.kill(guards.at(-1));assert.equal(d.visible,true);assert.equal(g.nearbyDoor(),'enter');recruit(g);assert.ok(g.run.crew.includes(4));
});
test('guards can be defeated with ordinary attack, jump and movement',()=>{
 const g=ready(3),w=g.world,p=w.player;w.enemies=w.enemies.filter(e=>e.guardId);p.x=1770;
 let direction=1;
 for(let i=0;i<12000&&!w.door.visible;i++){
  if(p.x>2630)direction=-1;if(p.x<1740)direction=1;
  const remaining=w.enemies.filter(e=>!e.dead),bat=remaining.find(e=>e.kind==='bat');
  const block=w.platforms.some(t=>t.h<50&&(direction>0?t.x>p.x&&t.x<p.x+115:t.x+t.w<=p.x+1&&t.x+t.w>p.x-115)&&t.y>p.y-30&&t.y<p.y+p.h);
  g.step(1/120,{axis:direction*.55,jump:p.grounded&&(block||Boolean(bat&&Math.abs(bat.x-p.x)<180)),attack:true});
 }
 assert.equal(w.door.visible,true);assert.equal(g.run.kills,7);assert.ok(g.run.remaining>620);
});
test('low tunnel blocks standing, allows crouch walk and pickup, then mounts outside',()=>{
 const g=ready(0),w=g.world,p=w.player;w.enemies=[];w.gimmicks=[];
 w.items=[{x:2550,y:372,w:38,h:48,kind:'wheel',used:false}];p.x=2390;p.y=344;p.vx=0;
 tick(g,90,{right:true});assert.equal(p.x,2410);assert.equal(w.items[0].used,false);
 until(g,()=>w.items[0].used,{right:true,crouch:true});assert.equal(p.h,42);assert.equal(p.wheel,0);assert.equal(p.wheelPending,18);
 tick(g,60,{right:true});assert.equal(p.h,42);assert.equal(p.wheel,0);assert.equal(p.wheelPending,18);
 until(g,()=>p.wheel>0,{right:true});assert.equal(p.h,76);assert.equal(p.wheelPending,0);assert.ok(p.x>=2700);assert.ok(p.wheel>17.9);
});
test('ordinary pits still recover, vertical camera stays bounded and room resets it',()=>{
 const g=ready(1),w=g.world,p=w.player;p.y=951;g.step(1/120);assert.equal(p.y,344);
 p.y=5000;assert.equal(cameraY(w),380);p.y=-5000;assert.equal(cameraY(w),0);
 g.loadStage(2);g.play();const d=g.world.door;g.world.player.x=d.x+30;g.world.player.y=d.y+d.h-76;g.interact();assert.equal(cameraY(g.world),0);
});
