import {STAGES,GROUND} from './data.mjs?v=1.9.0';

// [x, top, width]. Ground is solid; special ledges are one-way surfaces.
export const TERRAIN=[null,
 [[0,420,900],[1140,420,460],[1600,360,240],[1840,300,240],[2400,360,300],[2700,420,400],[3220,420,460],[3970,390,240],[4210,420,290]],
 [[0,420,420],[420,380,200],[620,340,280],[900,380,140],[1180,420,360],[1540,370,160],[1700,420,590],[2290,360,310],[2730,420,400],[3130,350,200],[3330,390,180],[3630,450,250],[3880,390,140],[4020,420,260],[4410,380,220],[4630,420,170]],
 [[0,420,770],[1320,370,140],[1580,420,1120],[3410,420,220],[4080,360,220],[4300,420,200],[4900,380,160],[5060,420,140]],
 [[0,420,420],[420,370,200],[620,320,280],[900,370,210],[1530,350,240],[1770,420,200],[1970,360,300],[2870,320,220],[3090,380,210],[3790,380,120],[3910,420,430],[4940,420,560]]
];
export const STAGE_HINTS=['','追い風で遠くへ。向かい風ではジャンプを控えめに。','氷はすぐに止まれない。「しゃがむ」でブレーキ。','足場を待って乗ろう。昇降台は乗ると動き出す。','ひび割れた床は0.7秒で崩れる。立ち止まらず渡ろう。'];
export const WIND_ZONES=[{x:180,y:-100,w:640,h:700,force:130},{x:1140,y:-100,w:560,h:700,force:-90},{x:1740,y:-100,w:760,h:700,force:185},{x:2560,y:-100,w:460,h:700,force:-130},{x:3220,y:-100,w:990,h:700,force:185},{x:4210,y:-100,w:290,h:700,force:-90}];
const iceAt=x=>(x>=160&&x<1700)||(x>=2740&&x<4800);
export function stagePlatforms(stage){
 if(stage===0)return null;
 const ground=TERRAIN[stage].map(([x,y,w],i)=>({id:`ground-${i}`,x,y,w,h:Math.max(160,680-y),ground:true,material:stage===2&&iceAt(x+w/2)?'ice':'stone'}));
 const ledges=STAGES[stage].platforms.map(([x,y,w],i)=>({id:`ledge-${i}`,x,y,w,h:20,material:stage===2&&iceAt(x+w/2)?'ice':'stone'}));
 if(stage===3){
  for(const [id,x,y,w,dx,dy,period,hold,trigger] of [['ferry-west',800,355,150,360,0,6,.65,false],['rider-lift',2710,365,160,0,-195,4.6,.55,true],['ferry-east',3660,350,150,250,0,5,.8,false],['ferry-last',4480,365,150,270,0,4.8,.6,false]])
   ledges.push({id,x,y,w,h:22,kind:'moving',oneWay:true,baseX:x,baseY:y,travelX:dx,travelY:dy,period,hold,trigger,destinationX:({'ferry-west':1320,'rider-lift':2970,'ferry-east':4080,'ferry-last':4900})[id],active:!trigger,phase:0,dx:0,dy:0});
 }
 if(stage===4){
  const tiles=[...Array.from({length:4},(_,i)=>[1110+i*105,350,105]),...Array.from({length:6},(_,i)=>[2270+i*100,320,100]),...[370,315,270,325,340].map((y,i)=>[3300+i*100,y,100]),...[380,340,300,320,360,390].map((y,i)=>[4340+i*100,y,100])];
  tiles.forEach(([x,y,w],i)=>ledges.push({id:`crumble-${i}`,x,y,w,h:22,kind:'crumble',oneWay:true,delay:.7,restore:3.5,elapsed:0,armed:false,gone:false}));
 }
 return [...ground,...ledges];
}
export function floorAt(platforms,x,fallback=GROUND){
 const candidates=platforms.filter(t=>!t.gone&&t.x<=x&&t.x+t.w>=x&&!t.oneWay);
 return (candidates.find(t=>t.ground)||candidates.sort((a,b)=>a.y-b.y)[0])?.y??fallback;
}
export function moverFraction(t){
 const phase=t.phase%t.period,half=t.period/2,travel=half-t.hold;
 if(phase<t.hold)return 0;if(phase<half)return (phase-t.hold)/travel;
 if(phase<half+t.hold)return 1;return 1-(phase-half-t.hold)/travel;
}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function updateStagePlatforms(w,p,dt,emit){
 for(const t of w.platforms){t.prevX=t.x;t.prevY=t.y;t.dx=t.dy=0;
  if(t.kind==='moving'){const phaseBefore=t.phase;
   if(t.trigger&&p.support===t.id&&p.grounded)t.active=true;
   if(t.active)t.phase+=dt;const f=moverFraction(t);t.x=t.baseX+t.travelX*f;t.y=t.baseY+t.travelY*f;t.dx=t.x-t.prevX;t.dy=t.y-t.prevY;
   if(p.support===t.id&&p.grounded){
    const next={...p,x:p.x+t.dx,y:p.y+t.dy};
    for(const solid of w.platforms.filter(a=>a!==t&&!a.gone&&!a.oneWay))if(overlaps(next,solid)){
     if(t.dy<0&&p.y>=solid.y+solid.h-2||t.dx>0&&p.x+p.w<=solid.x+2||t.dx<0&&p.x>=solid.x+solid.w-2){
      t.x=t.prevX;t.y=t.prevY;t.dx=t.dy=0;t.phase=phaseBefore;next.x=p.x;next.y=p.y;break;
     }
    }
    p.x=Math.max(0,Math.min(w.length-p.w,next.x));p.y=next.y;
   }
  }
  if(t.kind==='crumble'){
   if(p.support===t.id&&p.grounded&&!t.gone&&!t.armed){t.armed=true;emit('sfx','crouch');}
   if(t.armed)t.elapsed+=dt;
   if(!t.gone&&t.armed&&t.elapsed>=t.delay){t.gone=true;if(p.support===t.id){p.grounded=false;p.support=null;p.coyote=0;}emit('sfx','hit');w.particles.push({x:t.x+t.w/2,y:t.y,age:0,color:'#cea18d'});}
   if(t.gone&&t.elapsed>=t.delay+t.restore){t.armed=false;t.gone=false;t.elapsed=0;}
  }
 }
}
export function resetCrumbling(w){for(const t of w.platforms)if(t.kind==='crumble'){t.gone=false;t.armed=false;t.elapsed=0;}}
export function stageMotion(w,p,dir){
 const support=p.grounded?w.platforms.find(t=>!t.gone&&p.x+p.w>t.x&&p.x<t.x+t.w&&Math.abs(p.y+p.h-t.y)<3):null;
 const ice=support?.material==='ice';
 const wind=(w.windZones||[]).find(z=>p.x+p.w/2>=z.x&&p.x+p.w/2<z.x+z.w&&p.y+p.h/2>=z.y&&p.y+p.h/2<z.y+z.h)?.force||0;
 p.surface=ice?'ice':'stone';p.wind=wind;
 return {wind:wind*(p.grounded?(dir?.15:0):1),accel:ice?(p.crouching?700:dir?260:75):dir?2200:1900};
}
