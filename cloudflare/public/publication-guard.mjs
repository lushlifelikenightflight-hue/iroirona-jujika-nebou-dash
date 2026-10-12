export class PublicationGuard {
  constructor({check,close,connection=()=>{},schedule=(job,delay)=>setTimeout(job,delay),cancel=id=>clearTimeout(id),clock=()=>performance.now()}){
    Object.assign(this,{check,close,connection,schedule,cancel,clock});this.timer=null;this.expiryTimer=null;this.closed=false;this.running=false;this.deadline=null;
  }
  retry(){
    if(this.timer!==null)this.cancel(this.timer);
    this.timer=this.schedule(()=>{this.timer=null;return this.refresh();},Math.min(5000,Math.max(1,this.deadline-this.clock())));
  }
  armExpiry(){
    if(this.expiryTimer!==null)this.cancel(this.expiryTimer);
    this.expiryTimer=this.schedule(()=>{this.expiryTimer=null;if(this.clock()>=this.deadline)this.finish('/');else this.armExpiry();},Math.min(2147483647,Math.max(1,this.deadline-this.clock())));
  }
  async refresh(){
    if(this.closed)return;
    if(this.deadline!==null&&this.clock()>=this.deadline){this.finish('/');return;}
    if(this.running)return;this.running=true;const began=this.clock();
    try{
      const status=await this.check();if(this.closed)return;
      if(status.allowed===false){this.finish('/');return;}
      if(status.allowed!==true||!Number.isFinite(status.endsAt)||!Number.isFinite(status.serverNow))throw new Error('Invalid publication state');
      const remaining=status.endsAt-status.serverNow-(this.clock()-began);
      if(remaining<=0){this.finish('/');return;}
      this.deadline=this.clock()+remaining;this.armExpiry();this.connection(true);this.retry();
    }catch{
      if(this.closed)return;
      // Only a previously confirmed deadline permits continuing during a temporary outage.
      if(this.deadline===null){this.finish('/publication-unavailable');return;}
      if(this.clock()>=this.deadline){this.finish('/');return;}
      this.connection(false);this.retry();
    }finally{this.running=false;}
  }
  finish(path){if(this.closed)return;this.closed=true;for(const id of [this.timer,this.expiryTimer])if(id!==null)this.cancel(id);this.timer=this.expiryTimer=null;this.close(path);}
}
if(typeof window!=='undefined'){
  const guard=new PublicationGuard({check:async()=>{const response=await fetch('/api/publication',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error('Publication unavailable');return response.json();},close:path=>location.replace(path),connection:online=>window.dispatchEvent(new CustomEvent('publication:connection',{detail:{online}}))});
  window.addEventListener('pageshow',()=>{void guard.refresh();});
  window.addEventListener('online',()=>{void guard.refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void guard.refresh();});
  void guard.refresh();
}
