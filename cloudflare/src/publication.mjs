export const initialSettings = Object.freeze({enabled:0,starts_at:null,ends_at:null,before_message:'公開開始まで、もう少しお待ちください。',after_message:'公開期間は終了しました。遊んでくれてありがとう。',revision:0,updated_at:0});

export function stateOf(settings, now=Date.now()) {
  if (!settings.enabled) return 'closed';
  if (!Number.isSafeInteger(settings.starts_at) || !Number.isSafeInteger(settings.ends_at) || settings.starts_at>=settings.ends_at) return 'closed';
  if (now<settings.starts_at) return 'scheduled';
  return now<settings.ends_at?'open':'ended';
}

export function publicStatus(settings,now=Date.now()) {
  const state=stateOf(settings,now);
  return {state,allowed:state==='open',serverNow:now,startsAt:settings.starts_at,endsAt:settings.ends_at,message:state==='scheduled'?settings.before_message:settings.after_message};
}

export function validateSettings(body) {
  if(!body || typeof body!=='object' || Array.isArray(body)) throw new Error('設定の形式を確認してください。');
  if(!Number.isSafeInteger(body.revision)||body.revision<0) throw new Error('画面を再読み込みしてください。');
  if(typeof body.enabled!=='boolean') throw new Error('公開状態を確認してください。');
  const parseDate=(value)=>{if(value===null || value==='')return null;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))throw new Error('日時の形式を確認してください。');const n=Date.parse(value);if(!Number.isSafeInteger(n)||new Date(n).toISOString().replace('.000','')!==value.replace('.000',''))throw new Error('日時を確認してください。');return n;};
  const start=parseDate(body.startsAt),end=parseDate(body.endsAt);
  if((start===null)!==(end===null)||start!==null&&start>=end)throw new Error('終了日時は開始日時より後にしてください。');
  if(body.enabled&&(start===null||end===null))throw new Error('公開開始・終了日時を設定してください。');
  const message=(value)=>{if(typeof value!=='string'||!value.trim()||value.length>300)throw new Error('メッセージは1〜300文字で入力してください。');return value.trim();};
  return {enabled:body.enabled?1:0,starts_at:start,ends_at:end,before_message:message(body.beforeMessage),after_message:message(body.afterMessage),revision:body.revision};
}

export function escapeHTML(value) {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
