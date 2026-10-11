import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.mjs';
import {STAGES} from '../src/data.mjs';

function driveStage(g){
 let steps=0;
 while(g.mode==='play'&&steps++<36000){
  const {player:p,platforms,enemies}=g.world,d=STAGES[g.run.stage];
  const pit=d.pits.some(([x,width])=>p.x+p.w>x-(p.y+p.h<400?100:50)&&p.x<x+width);
  const block=platforms.some(t=>t.h<50&&t.x>p.x&&t.x<p.x+115&&t.y>p.y-30&&t.y<p.y+p.h);
  const foe=enemies.some(e=>!e.dead&&e.x>p.x&&e.x<p.x+90);
  g.step(1/120,{right:true,jump:p.grounded&&(pit||block||foe),attack:true});
 }
 assert.equal(g.mode,'clear',`Stage ${g.run.stage+1}, x=${g.world.player.x}`);
}
test('five-stage campaign with combat, followers and complete ending',()=>{
 const g=new Game();g.start();
 for(let s=0;s<5;s++){
  g.play();
  if(s<4){const door=g.world.door;g.world.player.x=door.x+30;g.world.player.y=door.y+door.h-76;g.interact();g.world.player.x=800;g.step(1/120);g.world.player.x=80;g.interact();}
  driveStage(g);g.nextStage();
 }
 assert.equal(g.mode,'ending');assert.equal(g.run.crew.length,5);assert.ok(g.run.kills>0);assert.ok(g.run.remaining>0);assert.equal(g.result.all,5000);assert.equal(g.result.clear,5000);
});
test('dark draws mobile enemies towards its center persistently',()=>{
 const g=new Game();g.start();g.play();g.world.enemies=[{kind:'ghost',x:300,startX:300,y:344,startY:344,w:38,h:48,t:0,hp:100,dead:false}];g.world.player.x=80;g.attack();for(let i=0;i<90;i++)g.step(1/120);assert.ok(g.world.enemies[0].pullX< -20);assert.ok(g.world.enemies[0].x<290);
});
test('fall recovery is anchored to the actual ground, never a ledge above it',()=>{
 const g=new Game();g.start();g.play();g.world.enemies=[];const p=g.world.player;p.x=650;p.y=350-76;p.grounded=true;p.vy=0;const before=p.safeY;g.step(1/120);assert.equal(p.safeY,before);p.y=650;g.step(1/120);assert.equal(p.y,344);assert.ok(g.run.remaining<713);
});
