const $=id=>document.getElementById(id);
const labels={closed:'非公開',scheduled:'公開開始待ち',open:'公開中',ended:'公開終了'};
let current=null,busy=false,dirty=false;
const jp=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'});
function localInput(iso){if(!iso)return '';return new Date(Date.parse(iso)+9*3600000).toISOString().slice(0,16);}
function utcInput(value){return value?new Date(`${value}:00+09:00`).toISOString():null;}
function periodText(start,end){return start&&end?`${jp.format(new Date(start))} 〜 ${jp.format(new Date(end))}`:'公開期間が設定されていません。';}
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function controls(){for(const id of ['save','reload','stop'])$(id).disabled=busy||!current;for(const id of ['starts','ends','enabled','before','after'])$(id).disabled=busy;$('open').disabled=busy||!current||dirty||!current.endsAt||Date.parse(current.endsAt)<=current.serverNow;$('save').textContent=busy?'処理中…':'設定を保存';}
function render(data){current=data;dirty=false;$('identity').textContent=`管理者：${data.administrator}`;$('local-note').hidden=!data.local;$('state').textContent=labels[data.state]||'非公開';$('period').textContent=periodText(data.startsAt,data.endsAt);$('starts').value=localInput(data.startsAt);$('ends').value=localInput(data.endsAt);$('enabled').checked=data.enabled;$('before').value=data.beforeMessage;$('after').value=data.afterMessage;controls();}
async function call(path,method='GET',body){const response=await fetch(`/admin/api/${path}`,{method,cache:'no-store',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});if(response.status===403)throw new Error('ログインを確認できません。管理画面を開き直してください。');let data;try{data=await response.json();}catch{throw new Error('接続できませんでした。もう一度お試しください。');}if(!response.ok)throw new Error(data.error||'設定を保存できませんでした。');return data;}
async function action(job,success){if(busy)return;busy=true;controls();message('');try{render(await job());message(success);}catch(error){message(error.message,true);}finally{busy=false;controls();}}
$('settings').addEventListener('input',()=>{dirty=true;controls();});
$('settings').addEventListener('submit',event=>{event.preventDefault();if(!current)return;let body;try{body={revision:current.revision,enabled:$('enabled').checked,startsAt:utcInput($('starts').value),endsAt:utcInput($('ends').value),beforeMessage:$('before').value,afterMessage:$('after').value};}catch{message('日時を確認してください。',true);return;}action(()=>call('settings','PUT',body),'設定を保存しました。');});
$('reload').addEventListener('click',()=>action(()=>call('settings'),'最新の設定を読み込みました。'));
$('stop').addEventListener('click',()=>action(()=>call('stop','POST',{revision:current.revision}),'公開を停止しました。'));
$('open').addEventListener('click',()=>action(()=>call('open','POST',{revision:current.revision}),'公開を開始しました。'));
$('logout').addEventListener('click',async()=>{if(busy)return;busy=true;controls();try{await call('logout','POST',{});location.replace('/admin/login');}catch(error){message(error.message,true);busy=false;controls();}});
await action(()=>call('settings'),'');
setInterval(async()=>{if(busy||!current)return;try{const response=await fetch('/api/publication',{cache:'no-store'});if(!response.ok)return;const status=await response.json();current.serverNow=status.serverNow;current.state=status.state;$('state').textContent=labels[status.state]||'非公開';$('period').textContent=periodText(status.startsAt,status.endsAt);controls();}catch{}},10000);
