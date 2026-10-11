import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.mjs';import {driveStage} from './playthrough-driver.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/120,input);};
function ready(stage){const g=new Game();g.start();g.loadStage(stage);g.play();g.world.enemies=[];g.world.items=[];return g;}
function flat(g,material='stone'){g.world.gimmicks=[];g.world.platforms=[{id:'test-ground',x:0,y:420,w:5000,h:160,ground:true,material}];}
function jumpDistance(x,zones){const g=ready(1);flat(g);g.world.windZones=zones;const p=g.world.player;p.x=x;p.vx=300;g.step(1/120,{right:true,jump:true});let n=0;while(!p.grounded&&n++<180)g.step(1/120,{right:true});assert.ok(p.grounded);return p.x-x;}
test('tailwind and headwind change real jump distance, including in midair with no input',()=>{
 const zones=ready(1).world.windZones,calm=jumpDistance(1800,[]),tail=jumpDistance(1800,zones),head=jumpDistance(2600,zones);
 assert.ok(tail>calm+90);assert.ok(head<calm-60);
 const g=ready(1);flat(g);const p=g.world.player;p.x=1800;p.vx=0;g.step(1/120,{jump:true});tick(g,30);assert.ok(p.vx>100);assert.ok(p.x>1820);
});
test('the broad windy valley requires the tailwind when travelling on foot',()=>{
 for(const windy of [false,true]){const g=ready(1),p=g.world.player;if(!windy)g.world.windZones=[];g.world.gimmicks=[];p.x=2040;p.y=300-p.h;p.vx=300;p.grounded=true;g.step(1/120,{right:true,jump:true});let crossed=false;for(let i=0;i<150;i++){g.step(1/120,{right:true});if(p.grounded&&p.x>=2400){crossed=true;break;}}assert.equal(crossed,windy);}
});
test('ice retains momentum when released and resists reversal; crouch supplies a brake',()=>{
 function sample(material,input,frames){const g=ready(2);flat(g,material);const p=g.world.player;p.x=1800;p.vx=300;tick(g,frames,input);return {x:p.x,vx:p.vx};}
 const ice=sample('ice',{},120),stone=sample('stone',{},120);assert.ok(ice.vx>200);assert.equal(stone.vx,0);assert.ok(ice.x>stone.x+180);
 assert.ok(sample('ice',{left:true},40).vx>180);assert.equal(sample('stone',{left:true},40).vx,-300);
 assert.equal(sample('ice',{crouch:true},60).vx,0);
});
test('moving platforms carry standing players horizontally, upward and downward, and release on jump',()=>{
 for(const [id,phase] of [['ferry-west',1],['rider-lift',1],['rider-lift',3.1]]){
  const g=ready(3),w=g.world,t=w.platforms.find(t=>t.id===id);w.gimmicks=[];w.platforms=[t];t.active=true;t.phase=phase;tick(g,1);const p=w.player;Object.assign(p,{x:t.x+t.w/2-15,y:t.y-p.h,grounded:true,support:t.id,vx:0,vy:0});const xOffset=p.x-t.x;
  tick(g,45);assert.ok(Math.abs(p.x-t.x-xOffset)<1e-6);assert.ok(Math.abs(p.y+p.h-t.y)<1e-6);assert.equal(p.grounded,true);
  const feet=p.y+p.h;g.step(1/120,{jump:true});assert.ok(p.vy<0);assert.equal(p.grounded,false);tick(g,8);assert.ok(p.y+p.h<feet-25);assert.notEqual(p.support,t.id);
 }
});
test('the rider lift waits for boarding and horizontal ferry dwells at its endpoints',()=>{
 const g=ready(3),w=g.world,lift=w.platforms.find(t=>t.id==='rider-lift');w.gimmicks=[];tick(g,150);assert.equal(lift.y,365);assert.equal(lift.active,false);
 const p=w.player;Object.assign(p,{x:lift.x+50,y:lift.y-p.h,grounded:true,vx:0,vy:0,support:lift.id});tick(g,160);assert.equal(lift.active,true);assert.ok(lift.y<280);assert.equal(p.y+p.h,lift.y);
 const h=ready(3),f=h.world.platforms.find(t=>t.id==='ferry-west');tick(h,60);assert.equal(f.x,f.baseX);tick(h,50);assert.ok(f.x>f.baseX+20);
});
test('a moving floor cannot lift a rider through a solid ceiling',()=>{
 const g=ready(3),w=g.world,t=w.platforms.find(t=>t.id==='rider-lift');w.gimmicks=[];w.platforms=[t,{id:'ceiling',x:t.x-20,y:240,w:t.w+40,h:20}];t.active=true;t.phase=.7;tick(g,1);const p=w.player;Object.assign(p,{x:t.x+50,y:t.y-p.h,support:t.id,grounded:true,vx:0,vy:0});tick(g,100);assert.ok(p.y>=260-1e-6);
});
test('crumbling tiles warn, drop after the delay even after leaving, and return for retry',()=>{
 const g=ready(4),w=g.world,t=w.platforms.find(t=>t.kind==='crumble'),p=w.player;w.gimmicks=[];Object.assign(p,{x:t.x+20,y:t.y-p.h,grounded:true,support:t.id,vx:0,vy:0});tick(g,60);assert.equal(t.armed,true);assert.equal(t.gone,false);tick(g,30);assert.equal(t.gone,true);assert.notEqual(p.support,t.id);assert.ok(p.y+p.h>t.y);
 p.x=80;p.y=344;p.vx=p.vy=0;tick(g,430);assert.equal(t.gone,false);assert.equal(t.armed,false);assert.equal(t.elapsed,0);
 const h=ready(4),tile=h.world.platforms.find(t=>t.kind==='crumble'),q=h.world.player;Object.assign(q,{x:tile.x+20,y:tile.y-q.h,grounded:true,support:tile.id});tick(h,1);q.x=80;q.y=344;tick(h,95);assert.equal(tile.gone,true);h.recover();assert.equal(tile.gone,false);
});
test('all five stages can be cleared with real inputs and no falls, using all three moving platforms and the crumbling chains',()=>{
 for(let stage=0;stage<5;stage++){const g=ready(stage),report=driveStage(g);assert.equal(report.mode,'clear',JSON.stringify(report));assert.equal(report.falls,0,JSON.stringify(report));assert.ok(report.jumps>0);if(stage===3)for(const id of ['ferry-west','rider-lift','ferry-east'])assert.ok(report.contacts.includes(id));if(stage===4)assert.ok(report.contacts.filter(id=>id.startsWith('crumble')).length>=8);}
});
test('moving routes remain playable at several platform starting phases',()=>{
 for(const phase of [.7,2.4,4.1]){const g=ready(3);for(const t of g.world.platforms.filter(t=>t.kind==='moving'&&!t.trigger))t.phase=phase;const r=driveStage(g);assert.equal(r.mode,'clear',JSON.stringify(r));assert.equal(r.falls,0,JSON.stringify(r));}
});
