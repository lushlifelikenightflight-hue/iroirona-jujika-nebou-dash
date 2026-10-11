export const DEAD_ZONE=.16;
export function stickVector(dx,dy,radius){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(radius)||radius<=0)return {x:0,y:0,axis:0};
 const length=Math.hypot(dx,dy),factor=length>radius?radius/length:1;
 const x=dx*factor/radius,y=dy*factor/radius;
 const axis=Math.abs(x)<=DEAD_ZONE?0:Math.sign(x)*(Math.abs(x)-DEAD_ZONE)/(1-DEAD_ZONE);
 return {x,y,axis};
}
export class AnalogStick{
 constructor(element,onChange,enabled){
  this.element=element;this.knob=element.querySelector('.stick-knob');this.onChange=onChange;this.enabled=enabled;this.pointer=null;this.value=0;
  element.onpointerdown=e=>{e.preventDefault();if(!enabled()||this.pointer!==null)return;this.pointer=e.pointerId;try{element.setPointerCapture(e.pointerId);}catch{}element.classList.add('active');this.move(e);};
  element.onpointermove=e=>{if(e.pointerId===this.pointer){e.preventDefault();this.move(e);}};
  const release=e=>{if(e.pointerId===this.pointer)this.reset();};element.onpointerup=release;element.onpointercancel=release;element.onlostpointercapture=release;
 }
 move(e){const r=this.element.getBoundingClientRect(),radius=r.width*.32,v=stickVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,radius);this.value=v.axis;this.knob.style.transform=`translate(${v.x*radius}px,${v.y*radius}px)`;this.element.setAttribute('aria-valuenow',String(Math.round(v.axis*100)));this.element.setAttribute('aria-valuetext',v.axis===0?'停止':`${v.axis<0?'左':'右'} ${Math.round(Math.abs(v.axis)*100)}%`);this.onChange(v.axis);}
 reset(){this.pointer=null;this.value=0;this.knob.style.transform='translate(0px,0px)';this.element.classList.remove('active');this.element.setAttribute('aria-valuenow','0');this.element.setAttribute('aria-valuetext','停止');this.onChange(0);}
}
