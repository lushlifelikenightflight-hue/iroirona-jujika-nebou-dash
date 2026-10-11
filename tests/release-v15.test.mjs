import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.mjs';import {AnalogStick} from '../src/stick.mjs';import {slideSurface} from '../src/gimmicks.mjs';import {endingStory,storyMarkup} from '../src/story.mjs';import {MEMBERS,STAGES} from '../src/data.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/120,input);};
function surface(){const doc=new EventTarget(),captured=new Set(),attrs={},knob={style:{}},element={ownerDocument:doc,querySelector:()=>knob,setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id),classList:{add(){},remove(){}},setAttribute:(k,v)=>attrs[k]=v,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};let axis=0;const stick=new AnalogStick(element,v=>axis=v,()=>true);return {doc,element,knob,attrs,stick,captured,get axis(){return axis;}};}
const pointer=(id,x=90,extra={})=>({pointerId:id,clientX:x,clientY:50,preventDefault(){},...extra});
const end=(doc,id,type='pointerup')=>{const event=new Event(type);Object.defineProperty(event,'pointerId',{value:id});doc.dispatchEvent(event);};
test('screen-wide release recovers the stick; crouch pointer does not release movement pointer',()=>{
 const s=surface();s.element.onpointerdown(pointer(10));assert.equal(s.axis,1);end(s.doc,11);assert.equal(s.axis,1);end(s.doc,10);assert.equal(s.axis,0);assert.equal(s.stick.pointer,null);assert.equal(s.captured.size,0);assert.equal(s.knob.style.transform,'translate(0px,0px)');s.element.onpointerdown(pointer(20,10));assert.equal(s.axis,-1);end(s.doc,20,'pointercancel');assert.equal(s.axis,0);
});
test('lost release cannot block later stick gestures, including a reused mouse pointer',()=>{
 const s=surface();s.element.onpointerdown(pointer(1));s.captured.clear();s.element.onpointerdown(pointer(2,10));assert.equal(s.axis,-1);assert.equal(s.stick.pointer,2);s.element.onpointerdown(pointer(3));assert.equal(s.stick.pointer,2);s.element.onpointerdown(pointer(2));assert.equal(s.axis,1);s.element.onpointermove(pointer(2,50,{pointerType:'mouse',buttons:0}));assert.equal(s.axis,0);s.element.onpointerdown(pointer(4));s.stick.reset();assert.equal(s.captured.size,0);
});
test('slide, crouch, reverse and release retain control instead of forcing forward acceleration',()=>{
 const g=new Game();g.start();g.play();g.world.enemies=[];g.world.items=[];const p=g.world.player,s=g.world.gimmicks.find(v=>v.kind==='slide');p.x=s.x+50;p.y=slideSurface(s,p.x+15)-p.h;p.grounded=true;p.vx=300;tick(g,12,{axis:1});assert.equal(p.sliding,s.id);assert.equal(p.vx,520);
 tick(g,35,{axis:1,crouch:true});assert.equal(p.sliding,null);assert.equal(p.slideBoost,0);assert.ok(p.vx<=105);assert.equal(p.crouching,true);const x=p.x;tick(g,90,{axis:-1,crouch:true});assert.ok(p.x<x-40);assert.equal(p.vx,-105);tick(g,70,{axis:0,crouch:true});assert.equal(p.vx,0);tick(g,70,{axis:1,crouch:false});assert.ok(p.x>x);assert.equal(p.crouching,false);
});
test('crouch cancels slide boost directly after leaving the ramp',()=>{
 const g=new Game();g.start();g.play();g.world.enemies=[];g.world.items=[];const p=g.world.player;p.x=2400;p.vx=520;p.slideBoost=.25;p.grounded=true;tick(g,60,{crouch:true});assert.equal(p.slideBoost,0);assert.equal(p.vx,0);assert.equal(p.h,42);
});
test('all sixteen possible crews get the requested ending and correct present/absent names',()=>{
 for(let mask=0;mask<16;mask++){const crew=[0,...[1,2,3,4].filter(id=>mask&(1<<(id-1)))],story=endingStory(crew),text=story.text.replaceAll('\n','');
  if(crew.length===1)assert.equal(text,'たかし「今日ソロだったっけ？」');
  else if(crew.length===2)assert.equal(text,`たかしは今日から${MEMBERS[crew[1]].name}とユニットで活動することになった。`);
  else if(crew.length<5){const missing=MEMBERS.filter((_,id)=>!crew.includes(id)).map(m=>m.name);assert.equal(text,`たかし「今日${missing.join('と')}来なかったな〜」`);for(const id of crew.slice(1))assert.ok(!text.includes(MEMBERS[id].name));}
  else assert.equal(text,'ライブは最高の盛り上がりを見せて無事終了した。たまには寝坊もいいよな。');
 }
});
test('difficulty rises by enemy count, patrol rate, bullet speed and shot cadence across five stages',()=>{
 const g=new Game();g.start();let previous=null;const counts=[];
 for(let i=0;i<5;i++){g.loadStage(i);const w=g.world,d=w.difficulty;counts.push(w.enemies.length);if(previous){assert.ok(d.patrolRate>previous.patrolRate);assert.ok(d.batRate>previous.batRate);assert.ok(d.shotSpeed>previous.shotSpeed);assert.ok(d.shotInterval<previous.shotInterval);}previous=d;}
 assert.deepEqual(counts,[7,9,12,15,19]);
});
test('later stages actually fire sooner and faster, while early stage remains gentler',()=>{
 const observed=[];
 for(let stage=0;stage<5;stage++){const g=new Game();g.start();g.loadStage(stage);g.play();const d=g.world.difficulty;g.world.items=[];g.world.enemies=[{kind:'bell',x:450,y:372,w:38,h:48,hp:99,t:0,cooldown:d.shotInterval,dead:false}];let steps=0;while(!g.world.shots.length&&steps<600){g.step(1/120);steps++;}assert.ok(g.world.shots.length);observed.push({time:steps/120,speed:Math.abs(g.world.shots[0].vx)});}
 for(let i=1;i<5;i++){assert.ok(observed[i].time<observed[i-1].time);assert.ok(observed[i].speed>observed[i-1].speed);}
});
test('narrative line breaks are explicit, hanging speech aligns after speaker and escapes markup',()=>{
 assert.equal(STAGES[0].intro,'たかし「やばい。今日、ライブじゃん。\n…全員まだ寝てる？」');for(const stage of STAGES)assert.ok(stage.intro.includes('\n'));
 const markup=storyMarkup(STAGES[0].intro);assert.ok(markup.includes('dialogue-speaker">たかし'));assert.equal((markup.match(/class="story-line"/g)||[]).length,2);assert.ok(!markup.includes('\n'));assert.ok(storyMarkup('たかし「<script>&」').includes('&lt;script&gt;&amp;'));assert.ok(storyMarkup('a\nb').includes('story-narration'));
});
