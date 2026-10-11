const $=id=>document.getElementById(id);let setup=false,busy=true;
function feedback(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
try{
 const response=await fetch('/admin/api/auth-status',{cache:'no-store'});if(!response.ok)throw Error();
 setup=!(await response.json()).configured;
 for(const id of ['setup-key-label','confirm-label','setup-note'])$(id).hidden=!setup;
 $('setup-key').required=setup;$('confirm').required=setup;
 $('password').autocomplete=setup?'new-password':'current-password';
 $('heading').textContent=setup?'管理者の初回登録':'管理者ログイン';
 $('description').textContent=setup?'登録用の鍵と、これから使うパスワードを入力してください。':'管理画面に入るためのパスワードを入力してください。';
 $('submit').textContent=setup?'パスワードを登録':'ログイン';busy=false;$('submit').disabled=false;feedback('');
}catch{feedback('接続できませんでした。画面を再読み込みしてください。',true);}
document.getElementById('login').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 if(setup&&$('password').value!==$('confirm').value){feedback('確認用パスワードが一致しません。',true);return;}
 busy=true;$('submit').disabled=true;feedback('確認しています…');
 try{
  const response=await fetch(setup?'/admin/api/setup':'/admin/api/login',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value,...(setup?{setupKey:$('setup-key').value.trim(),confirmPassword:$('confirm').value}:{})})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'ログインできません。');
  $('password').value='';$('confirm').value='';$('setup-key').value='';location.replace('/admin');
 }catch(error){feedback(error.message||'接続できませんでした。',true);busy=false;$('submit').disabled=false;}
});
