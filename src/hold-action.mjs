export class HoldAction{
 constructor(commit,allowed=()=>true,duration=700,timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}){this.commit=commit;this.allowed=allowed;this.duration=duration;this.timers=timers;this.owner=null;this.timer=null;}
 start(owner){if(this.owner!==null||!this.allowed())return false;this.owner=owner;this.timer=this.timers.set(()=>{this.timer=null;this.owner=null;if(this.allowed())this.commit();},this.duration);return true;}
 cancel(owner=this.owner){if(owner!==this.owner)return;this.timers.clear(this.timer);this.timer=null;this.owner=null;}
}
