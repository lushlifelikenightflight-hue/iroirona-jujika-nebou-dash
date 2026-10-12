import test from 'node:test';import assert from 'node:assert/strict';
import {PublicationGuard} from '../public/publication-guard.mjs';
function fixture(check){let now=0,id=0;const jobs=new Map(),closed=[],connections=[];const guard=new PublicationGuard({check:()=>check(now),close:p=>closed.push(p),connection:v=>connections.push(v),clock:()=>now,schedule:(job,delay)=>{jobs.set(++id,{job,at:now+delay,delay});return id;},cancel:id=>jobs.delete(id)});return {guard,jobs,closed,connections,setNow:v=>now=v,async advance(target){while(true){const next=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>target)break;jobs.delete(next[0]);now=next[1].at;await next[1].job();}now=target;}};}
test('a short outage preserves the confirmed deadline and recovers without navigation',async()=>{
 let offline=false;const f=fixture(now=>{if(offline)throw Error('offline');return {allowed:true,serverNow:now,endsAt:20000};});await f.guard.refresh();offline=true;await f.advance(5000);assert.deepEqual(f.closed,[]);assert.equal(f.guard.deadline,20000);assert.equal(f.connections.at(-1),false);offline=false;await f.advance(10000);assert.equal(f.connections.at(-1),true);assert.equal(f.guard.deadline,20000);assert.deepEqual(f.closed,[]);f.guard.finish('/');
});
test('repeated failures never extend the deadline and stop precisely at expiry',async()=>{
 let calls=0;const f=fixture(now=>{if(calls++)throw Error('offline');return {allowed:true,serverNow:now,endsAt:12000};});await f.guard.refresh();await f.advance(11999);assert.deepEqual(f.closed,[]);assert.equal(f.guard.deadline,12000);await f.advance(12000);assert.deepEqual(f.closed,['/']);assert.equal(f.jobs.size,0);
});
test('expiry still fires while a publication request hangs and a late response cannot reopen',async()=>{
 let calls=0,resolve;const f=fixture(now=>calls++?new Promise(r=>resolve=r):{allowed:true,serverNow:now,endsAt:10000});await f.guard.refresh();f.setNow(5000);const pending=f.guard.refresh();assert.equal(f.guard.running,true);await f.advance(10000);assert.deepEqual(f.closed,['/']);resolve({allowed:true,serverNow:10000,endsAt:60000});await pending;assert.equal(f.guard.closed,true);assert.equal(f.jobs.size,0);
});
test('invalid later responses preserve the old deadline; an explicitly closed response stops immediately',async()=>{
 let state='open';const f=fixture(now=>state==='open'?{allowed:true,serverNow:now,endsAt:20000}:state==='invalid'?{allowed:true,serverNow:now,endsAt:'bad'}:{allowed:false});await f.guard.refresh();state='invalid';await f.advance(5000);assert.equal(f.guard.deadline,20000);assert.deepEqual(f.closed,[]);state='closed';await f.advance(10000);assert.deepEqual(f.closed,['/']);
});
test('without an initial valid approval the client cannot continue offline',async()=>{
 const f=fixture(()=>{throw Error('offline');});await f.guard.refresh();assert.deepEqual(f.closed,['/publication-unavailable']);assert.equal(f.jobs.size,0);assert.equal(f.guard.deadline,null);
});
test('long publication windows do not overflow the expiry timer',async()=>{
 const f=fixture(now=>({allowed:true,serverNow:now,endsAt:40*24*3600000}));await f.guard.refresh();assert.equal(f.jobs.get(f.guard.expiryTimer).delay,2147483647);assert.equal(f.jobs.get(f.guard.timer).delay,5000);f.guard.finish('/');
});
