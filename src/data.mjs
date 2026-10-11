export const MEMBERS=[
 {id:'takashi',name:'たかし',color:'#bb8df1',element:'闇',skill:'ナイトホール',cooldown:1.8,life:1.4,description:'前方に闇の渦。敵を吸い込む。'},
 {id:'takeru',name:'たける',color:'#f17a8a',element:'炎',skill:'クリムゾンフレア',cooldown:.7,life:.75,description:'炎をまっすぐ前方へ飛ばす。'},
 {id:'ponite',name:'ぽにて',color:'#efd392',element:'雷',skill:'トワイライトボルト',cooldown:.6,life:1.1,reach:140,width:120,height:140,dropSpeed:1800,description:'前方へ、幅広い雷を素早く落とす。'},
 {id:'benzo',name:'べんぞー',color:'#93dfeb',element:'氷',skill:'フローズンヴェール',cooldown:1.2,life:2,reach:85,width:130,height:150,description:'前方へ追従する氷の盾。2秒間、敵弾を防ぐ。'},
 {id:'king',name:'きんぐ',color:'#f7e8b8',element:'光',skill:'セイクリッドレイ',cooldown:.45,life:.6,reach:420,width:64,description:'前後の斜め上下へ、4本の光を同時に放つ。'}
];
export const STAGES=[
 {name:'寝坊の街',subtitle:'A LATE MORNING',length:4140,member:1,doorX:1160,doorY:420,secret:false,pits:[[1760,110],[2780,120],[3600,110]],platforms:[[600,350,180],[1500,335,160],[1900,340,220],[2440,330,260,35]],intro:'たかし「やばい。今日、ライブじゃん。\n…全員まだ寝てる？」',outro:'たかし「まずは街を抜けよう。\n誰か起きてるといいけど。」'},
 {name:'薔薇の墓地',subtitle:'THE ROSE GRAVEYARD',length:4500,member:2,doorX:1360,doorY:760,secret:true,route:'pit',top:0,bottom:920,pits:[[900,240],[2080,320],[3100,120],[3680,290]],platforms:[[560,340,180],[1340,285,160],[850,760,800]],intro:'たかし「近道は墓地か。\nぽにての気配が、\n足元からする……。」',outro:'「鐘の音が聞こえる。\nライブハウスは、まだ先だ。」'},
 {name:'氷の回廊',subtitle:'THE FROZEN ARCADE',length:4800,member:3,doorX:2470,doorY:-120,secret:true,route:'sky',top:-490,bottom:680,pits:[[1040,140],[2600,130],[3510,120],[4280,130]],platforms:[[1940,150,260],[2290,-120,390]],intro:'「寒っ……。\nべんぞー、ずいぶん高いところで\n寝てるな。」',outro:'「氷の回廊を越えた。\n空の色が、少し変わってきた。」'},
 {name:'鐘楼の屋根',subtitle:'ABOVE THE BELLS',length:5200,member:4,doorX:2200,doorY:275,secret:true,route:'battle',top:-220,bottom:680,pits:[[770,550],[1460,120],[2700,710],[3630,450],[4500,400]],platforms:[[440,340,180],[1670,350,180],[1930,275,430],[2470,340,160],[2970,170,240],[3270,285,150]],intro:'「きんぐの礼拝室が見えない。\nあの魔物たちが隠してるのか？」',outro:'「見えた。\nあの大きな十字架の下が、\n今日の会場だ。」'},
 {name:'開演前の礼拝堂',subtitle:'ONE LAST ENCORE',length:5500,member:null,bottom:680,pits:[[1110,420],[2270,600],[3300,490],[4340,600]],platforms:[[1740,285,120],[4910,340,140],[5030,255,300]],intro:'「開演まであと少し。\nあの時計を止めるか、\n上から抜けるか……！」',outro:'「間に合った。\nさあ、ステージへ。」'}
];
export const W=960,H=540,GROUND=420;
export const BOSS_SCORE=2500;
export const BEAM_DIRECTIONS=[[1,-1],[1,1],[-1,-1],[-1,1]];
export function score(run,timeout=false){const rows={enemies:run.kills*100,bosses:run.bossKills*BOSS_SCORE,time:timeout?0:Math.floor(Math.max(0,run.remaining))*20,members:run.crew.length*2000,clear:timeout?0:5000,all:!timeout&&run.crew.length===5?5000:0};return {...rows,total:Object.values(rows).reduce((a,b)=>a+b,0)};}
