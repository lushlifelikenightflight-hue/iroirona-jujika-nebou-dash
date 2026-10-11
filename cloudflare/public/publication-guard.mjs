export class PublicationGuard {
  constructor({check,close,schedule=(job,delay)=>setTimeout(job,delay),cancel=id=>clearTimeout(id),clock=()=>performance.now()}){Object.assign(this,{check,close,schedule,cancel,clock});this.timer=null;this.closed=false;this.running=false;this.deadline=null;}
  async refresh(){
    if(this.closed||this.running)return;this.running=true;const began=this.clock();
    try{
      const status=await this.check();
      if(!status.allowed){this.finish('/');return;}
      if(!Number.isFinite(status.endsAt)||!Number.isFinite(status.serverNow))throw new Error('Invalid publication state');
      const remaining=status.endsAt-status.serverNow-(this.clock()-began);
      this.deadline=this.clock()+Math.max(0,remaining);
      if(this.timer!==null)this.cancel(this.timer);
      this.timer=this.schedule(()=>{this.timer=null;return this.refresh();},Math.max(100,Math.min(5000,remaining)));
    }catch{this.finish('/publication-unavailable');}finally{this.running=false;}
  }
  finish(path){if(this.closed)return;this.closed=true;if(this.timer!==null)this.cancel(this.timer);this.timer=null;this.close(path);}
}
if(typeof window!=='undefined'){
  const guard=new PublicationGuard({check:async()=>{const response=await fetch('/api/publication',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error('Publication unavailable');return response.json();},close:path=>location.replace(path)});
  window.addEventListener('pageshow',()=>{void guard.refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void guard.refresh();});
  void guard.refresh();
}
