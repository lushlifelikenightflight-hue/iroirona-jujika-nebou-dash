import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.mjs';
import {STAGES} from '../src/data.mjs';

import {driveStage as runRoute} from './playthrough-driver.mjs';
function driveStage(g){const report=runRoute(g);assert.equal(report.mode,'clear',JSON.stringify(report));}
test('five-stage campaign with combat, followers and complete ending',()=>{
 const g=new Game();g.start();
 for(let s=0;s<5;s++){
  g.play();
  if(s<4){for(const e of g.world.enemies.filter(e=>e.guardId))g.kill(e);const door=g.world.door;g.world.player.x=door.x+30;g.world.player.y=door.y+door.h-76;g.interact();g.world.player.x=800;g.step(1/120);g.world.player.x=550;g.interact();}
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
