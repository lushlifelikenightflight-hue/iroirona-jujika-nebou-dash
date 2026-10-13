export function counterText(data){
  if(![data.views,data.gameViews,data.closedViews].every(value=>Number.isSafeInteger(value)&&value>=0)||data.views!==data.gameViews+data.closedViews||!Number.isFinite(data.startedAt))throw Error('Invalid access counts');
  const since=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric'}).format(new Date(data.startedAt));
  return 'アクセス '+data.views.toLocaleString('ja-JP')+'回（ゲーム '+data.gameViews.toLocaleString('ja-JP')+'／期間外 '+data.closedViews.toLocaleString('ja-JP')+'・'+since+'〜）';
}
if(typeof document!=='undefined'){
  let badge=document.getElementById('public-access');
  if(!badge){badge=document.createElement('p');badge.id='public-access';badge.className='access-counter game-access-counter';badge.setAttribute('role','status');badge.textContent='アクセス数を確認中…';document.body.append(badge);}
  badge.title='再読み込み・ボット等を含むページ表示回数です。10/12の保存ログ1,932回を含みます。未記録のアクセスは含みません。';
  let busy=false,confirmed=false;
  async function refresh(){if(busy)return;busy=true;try{const response=await fetch('/api/access-count',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('Unavailable');badge.textContent=counterText(await response.json());confirmed=true;}catch{if(!confirmed)badge.textContent='アクセス数：一時的に取得できません';}finally{busy=false;}}
  void refresh();setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh();});
}
