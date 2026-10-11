import test from 'node:test';import assert from 'node:assert/strict';
import {Game,beamHitsEnemy} from '../src/engine.mjs';import {BOSS_SCORE,score} from '../src/data.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/120,input);};
function ready(id){const g=new Game();g.start();g.play();g.run.crew=[0,1,2,3,4];g.select(id);Object.assign(g.world,{enemies:[],items:[],gimmicks:[],platforms:[{x:0,y:420,w:3600,h:160}]});g.world.player.x=1200;return g;}
const target=(cx,cy)=>({x:cx-10,y:cy-10,w:20,h:20,hp:20,kind:'bell',t:0,stunned:5,cooldown:100,dead:false});
test('king damages all four diagonal quadrants once per cast, regardless of facing',()=>{
 for(const face of [-1,1]){const g=ready(4),p=g.world.player;p.face=face;const x=p.x+15,y=p.y+p.h*.45;
  const targets=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([dx,dy])=>target(x+dx*300,y+dy*300));
  const beyond=target(x+470,y+470),offAxis=target(x+300,y),near=target(x,y);
  g.world.enemies=[...targets,beyond,offAxis,near];g.attack();tick(g,3);
  assert.ok(targets.every(e=>e.hp===18));assert.equal(beyond.hp,20);assert.equal(offAxis.hp,20);assert.equal(near.hp,18);
  assert.equal(g.world.effects.length,1,'four rays share one hit registry');tick(g,80);assert.equal(g.world.effects.length,0);
 }
});
test('diagonal hit shape respects the finite beam width and visible endpoint',()=>{
 const f={x:0,y:0,reach:420,width:64};
 assert.equal(beamHitsEnemy(f,target(350,-350)),true);assert.equal(beamHitsEnemy(f,target(350,-420)),false);
 assert.equal(beamHitsEnemy(f,target(450,-450)),false);assert.equal(beamHitsEnemy(f,target(-350,350)),true);
});
test('ice follows walking, turns, jumps, crouches and member changes until its lifetime ends',()=>{
 const g=ready(3),p=g.world.player;g.attack();const f=g.world.effects[0],follow=()=>{
  assert.equal(f.x,p.x+p.w/2+p.face*f.reach);assert.equal(f.y,p.y+p.h-f.height);
 };
 tick(g,30,{right:true});follow();assert.ok(p.x>1250);tick(g,20,{left:true});follow();assert.equal(f.face,-1);
 tick(g,1,{jump:true,left:true});follow();assert.ok(p.y<344);g.select(0);tick(g,30);follow();assert.ok(g.world.effects.includes(f));
 p.y=344;p.vy=0;p.grounded=true;tick(g,1,{crouch:true});follow();assert.equal(p.h,42);tick(g,170);assert.ok(!g.world.effects.includes(f));
});
test('moving shield blocks at the new location and no longer blocks at the abandoned location',()=>{
 const g=ready(3),p=g.world.player;g.attack();const f=g.world.effects[0],old=f.x;p.x+=350;tick(g,1);
 g.world.shots=[{x:f.x-7,y:285,w:14,h:14,vx:0,vy:0},{x:old-7,y:285,w:14,h:14,vx:0,vy:0}];tick(g,1);
 assert.equal(g.world.shots.length,1);assert.equal(g.world.shots[0].x,old-7);assert.equal(g.run.hp,5);
});
test('late airborne attackers warn before aiming a projectile and early stages retain contact-only bats',()=>{
 for(let stage=0;stage<5;stage++){
  const g=ready(0);g.loadStage(stage);g.play();const attackers=g.world.enemies.filter(e=>e.airAttack);
  if(stage<2){assert.equal(attackers.length,0);continue;}assert.ok(attackers.length>=2);assert.ok(attackers.every(e=>e.kind==='bat'&&e.startX>=2800));
  const e=attackers[0];g.world.enemies=[e];g.world.gimmicks=[];g.world.items=[];g.world.platforms=[{x:0,y:420,w:5000,h:160}];g.world.player.x=e.startX-200;e.cooldown=0;
  tick(g,1);assert.ok(e.windup>0);assert.equal(g.world.shots.length,0);tick(g,40);assert.equal(g.world.shots.length,0);tick(g,15);
  assert.equal(g.world.shots.length,1);const shot=g.world.shots[0];assert.ok(shot.vx<0&&shot.vy>0);assert.ok(Math.abs(Math.hypot(shot.vx,shot.vy)-g.world.difficulty.airShotSpeed)<1e-8);
 }
});
test('house exit protection also suspends an airborne attacker and clears nearby shots',()=>{
 const g=ready(0);g.loadStage(4);g.play();const e=g.world.enemies.find(e=>e.airAttack);g.world.enemies=[e];g.world.player.x=e.x-100;
 e.windup=.01;g.world.shots=[{x:e.x,y:e.y,w:14,h:14,vx:-200,vy:100}];g.protectReturn();tick(g,240);
 assert.equal(g.world.shots.length,0);assert.equal(g.run.hp,5);assert.ok(e.stunned>0);
});
test('boss score is 2500 in normal and taxi endings and is only awarded once',()=>{
 const events=[],g=new Game((type,value)=>events.push([type,value]));g.start();g.loadStage(4);g.play();const e=g.world.enemies.find(e=>e.kind==='boss');g.kill(e);g.kill(e);
 assert.equal(BOSS_SCORE,2500);assert.equal(g.run.bossKills,1);assert.equal(g.run.kills,0);assert.ok(events.some(([t,v])=>t==='toast'&&v.includes('+2500')));
 for(const timeout of [true,false])assert.equal(score(g.run,timeout).bosses,2500);
});
