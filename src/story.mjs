import {MEMBERS} from './data.mjs?v=1.9.1';
export function endingStory(crew){
 const joined=new Set(crew),missing=MEMBERS.filter((_,id)=>!joined.has(id)).map(m=>m.name),partners=crew.filter(id=>id!==0).map(id=>MEMBERS[id].name);
 if(crew.length===1)return {kind:'solo',label:'SOLO ENDING',title:'今日のステージは、ひとり。',text:'たかし「今日ソロだったっけ？」'};
 if(crew.length===2)return {kind:'unit',label:'UNIT ENDING',title:'ふたりの、新しい始まり。',text:`たかしは今日から${partners[0]}と\nユニットで活動することになった。`};
 if(crew.length<5)return {kind:'partial',label:crew.length===3?'TRIO ENDING':'QUARTET ENDING',title:`${crew.length}人で、ライブを終えた。`,text:`たかし「今日${missing.join('と')}${missing.length>1?'\n':''}来なかったな〜」`};
 return {kind:'full',label:'FULL BAND ENDING',title:'Congratulations!',text:'ライブは最高の盛り上がりを見せて\n無事終了した。\nたまには寝坊もいいよな。'};
}
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storyMarkup(text){
 const match=String(text).match(/^([^「\n]*)「([\s\S]*)」$/);
 if(match){const lines=match[2].split('\n');return `<div class="dialogue"><span class="dialogue-speaker">${escape(match[1])}</span><div class="dialogue-speech"><span aria-hidden="true">「</span><div class="dialogue-lines">${lines.map((line,i)=>`<span class="story-line">${escape(line)}${i===lines.length-1?'」':''}</span>`).join('')}</div></div></div>`;}
 return `<div class="story-narration">${String(text).split('\n').map(line=>`<span class="story-line">${escape(line)}</span>`).join('')}</div>`;
}
