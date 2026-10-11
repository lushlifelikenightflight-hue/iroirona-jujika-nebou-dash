export const MEMBERS=[
 {id:'takashi',name:'たかし',color:'#bb8df1',element:'闇',skill:'ナイトホール',cooldown:1.8,life:1.4,description:'前方に闇の渦。敵を吸い込む。'},
 {id:'takeru',name:'たける',color:'#f17a8a',element:'炎',skill:'クリムゾンフレア',cooldown:.7,life:.75,description:'炎をまっすぐ前方へ飛ばす。'},
 {id:'ponite',name:'ぽにて',color:'#efd392',element:'雷',skill:'トワイライトボルト',cooldown:1.2,life:1.1,description:'少し前に、頭上から雷を落とす。'},
 {id:'benzo',name:'べんぞー',color:'#93dfeb',element:'氷',skill:'フローズンヴェール',cooldown:2.6,life:2,description:'目の前に氷の壁。敵弾を防ぐ。'},
 {id:'king',name:'きんぐ',color:'#f7e8b8',element:'光',skill:'セイクリッドレイ',cooldown:.9,life:.6,description:'斜め上へ光のビームを放つ。'}
];
export const STAGES=[
 {name:'寝坊の街',subtitle:'A LATE MORNING',length:3600,member:1,doorX:1160,doorY:420,secret:false,pits:[[1760,110],[2780,120]],platforms:[[600,350,180],[1500,335,160],[1900,340,220],[2440,330,260,35]],intro:'たかし「やばい。今日、ライブじゃん。……全員まだ寝てる？」',outro:'たかし「まずは街を抜けよう。誰か起きてるといいけど。」'},
 {name:'薔薇の墓地',subtitle:'THE ROSE GRAVEYARD',length:3900,member:2,doorX:1360,doorY:760,secret:true,route:'pit',top:0,bottom:920,pits:[[900,240],[2140,140],[3140,110]],platforms:[[560,340,180],[1120,355,150],[1340,285,300],[1750,345,160],[2310,330,220],[2820,300,180],[850,760,800]],intro:'たかし「近道は墓地か。ぽにての気配が、足元からする……。」',outro:'「鐘の音が聞こえる。ライブハウスは、まだ先だ。」'},
 {name:'氷の回廊',subtitle:'THE FROZEN ARCADE',length:4200,member:3,doorX:2470,doorY:-120,secret:true,route:'sky',top:-490,bottom:580,pits:[[1040,140],[2600,130],[3510,120]],platforms:[[510,350,180],[800,285,170],[1230,340,200],[1510,290,180],[2160,330,220],[2770,345,180],[3210,300,210],[1940,150,260],[2290,-120,390]],intro:'「寒っ……。べんぞー、ずいぶん高いところで寝てるな。」',outro:'「氷の回廊を越えた。空の色が、少し変わってきた。」'},
 {name:'鐘楼の屋根',subtitle:'ABOVE THE BELLS',length:4500,member:4,doorX:2200,doorY:275,secret:true,route:'battle',pits:[[770,130],[1460,120],[2800,140],[3630,140]],platforms:[[440,340,180],[940,345,180],[1200,280,170],[1670,350,180],[1930,275,430],[2470,340,160],[2990,330,200],[3360,280,200],[3830,345,180]],intro:'「きんぐの礼拝室が見えない。あの魔物たちが隠してるのか？」',outro:'「見えた。あの大きな十字架の下が、今日の会場だ。」'},
 {name:'開演前の礼拝堂',subtitle:'ONE LAST ENCORE',length:4800,member:null,pits:[[1110,130],[2270,140],[3300,120]],platforms:[[580,345,170],[1290,330,210],[1740,285,220],[2470,340,200],[2920,300,200],[3500,345,200],[3770,275,200],[4030,255,300]],intro:'「開演まであと少し。あの時計を止めるか、上から抜けるか……！」',outro:'「間に合った。さあ、ステージへ。」'}
];
export const W=960,H=540,GROUND=420;
export function score(run,timeout=false){const rows={enemies:run.kills*100,bosses:run.bossKills*1500,time:timeout?0:Math.floor(Math.max(0,run.remaining))*20,members:run.crew.length*2000,clear:timeout?0:5000,all:!timeout&&run.crew.length===5?5000:0};return {...rows,total:Object.values(rows).reduce((a,b)=>a+b,0)};}
