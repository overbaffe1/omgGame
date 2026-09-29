# Серия 1×07 «Кнопка самоуничтожения» (The Self-Destruct Button). Собирается из greys6.html.
# Улучшения качества по сравнению с 1×06: камера «наезжает» на героя в моменты шока/злости,
# эмоции видны на лице (слёзы, капля пота, «венка» злости), татуировки, пьяный анестезиолог с «запахом», всплеск в операционной.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys6.html')
e.R('<title>Анатомия страсти · 1×06','<title>Анатомия страсти · 1×07')
e.R('сезон 1 · серия 6 · «Если завтра не наступит»','сезон 1 · серия 7 · «Кнопка самоуничтожения»')
e.R("g.fillText('Сезон 1 · Серия 6',CX,740);g.font='italic 56px Georgia';g.fillText('«Если завтра не наступит»',CX,820)",
    "g.fillText('Сезон 1 · Серия 7',CX,740);g.font='italic 56px Georgia';g.fillText('«Кнопка самоуничтожения»',CX,820)")
e.R("'anatomiya-strasti-1x06.webm'","'anatomiya-strasti-1x07.webm'")
e.R("'bur','edw'];","'bur','tay'];")
e.R("||s[5]==='jimmy'&&LN(s,'e6izz4',lt)<.3","||s[5]==='digcrash'&&LN(s,'e7alx5',lt)>0")

# --- камера: наезд на говорящего при шоке/злости ---
e.R("const z=1.02+u*.03,fx=CX+(cx-CX)*.025;g.translate(CX,FL);g.scale(z,z);g.translate(-fx,-FL)}",
 "let em=0;if(L.length){const c=L[ci],a=s[3].find(a=>a[0]===c[0]);if(a&&(c[3]==='shock'||c[3]==='angry')&&!(a[4]&&a[4].lying))em=Math.max(0,Math.min(ease(seg(l0,c.t0,c.t0+.35)),1-ease(seg(l0,c.t1-.35,c.t1))))}\n"
 "    const z=1.02+u*.03+em*.13,py=FL-em*300;let fx=CX+(cx-CX)*(.025+em*.5);fx=clamp(fx,CX/z+2,W-CX/z-2);g.translate(CX,py);g.scale(z,z);g.translate(-fx,-py)}")
# --- эмоции на лице ---
e.R("g.fillStyle='rgba(255,120,120,.25)';g.beginPath();g.arc(hx-30,hy+14,9,0,TAU);g.arc(hx+30,hy+14,9,0,TAU);g.fill();",
 "g.fillStyle='rgba(255,120,120,.25)';g.beginPath();g.arc(hx-30,hy+14,9,0,TAU);g.arc(hx+30,hy+14,9,0,TAU);g.fill();\n"
 "  if(o.mood==='sad'&&!o.mask&&!o.lying){const q=(t*.7+x*.003)%1;g.fillStyle=`rgba(120,190,255,${.9-q*.5})`;g.beginPath();g.ellipse(hx-20,hy+6+q*44,4,6+q*3,0,0,TAU);g.fill()}\n"
 "  if(o.mood==='shock'&&!o.lying){g.fillStyle='rgba(160,215,255,.95)';g.beginPath();g.moveTo(hx+46,hy-46);g.quadraticCurveTo(hx+60,hy-22,hx+46,hy-16);g.quadraticCurveTo(hx+32,hy-22,hx+46,hy-46);g.fill()}\n"
 "  if(o.mood==='angry'&&!o.lying){g.strokeStyle='#e0303a';g.lineWidth=5;g.lineCap='round';for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;g.beginPath();g.arc(hx+36+Math.cos(a)*11,hy-52+Math.sin(a)*11,7,a+Math.PI*.6,a+Math.PI*1.4);g.stroke()}}")
# --- татуировки ---
e.R("  if(p.gown){g.fillStyle='#b8cfe0';",
 "  if(p.tat){g.strokeStyle='#27456a';g.lineWidth=5;for(let i=0;i<5;i++){g.beginPath();g.arc(-30+i*16,-300+i*28,16,0,Math.PI*1.4);g.stroke()}g.fillStyle='#8a2a3a';g.beginPath();g.arc(28,-200,12,0,TAU);g.fill()}\n  if(p.gown&&!p.tat){g.fillStyle='#b8cfe0';")

S=r"""const S=[
 [7,'','title',[],[]],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом Мередит · раннее утро','house',[['der',1500,Y,LEAD*1.04],['izz',520,Y,LEAD],['geo',260,Y,LEAD],['mer',2300,Y,LEAD]],
  [['izz','Доктор Шепард?!','e7izz1','shock'],['der','…Доброе утро. Я уже ухожу.','e7der1'],
   ['geo','Это был Шепард. Мередит спит с Шепардом!','e7geo1','shock'],['izz','Так вот почему ей достаются лучшие операции.','e7izz2','angry'],
   ['mer','Кто? Никто. Вы его не знаете.','e7mer1']],'sneak'],
 [0,'Приёмная','hall',[['dig',1150,Y,LEAD],['alx',700,Y,LEAD]],
  [['alx','У вас огнестрел. Почему вы не в неотложке?','e7alx1','shock'],['dig','У меня запись. Друг выстрелил — с моего разрешения.','e7dig1'],
   ['dig','Шрам отлично дополнит татуировки.','e7dig2']],'digby'],
 [0,'Кабинет Шепарда · снимки мозга','office',[['der',700,Y,LEAD*1.04],['geo',1000,Y,LEAD]],
  [['cap','Афине два года. У неё судороги',null],['der','Два месяца — и половина мозга отмирает. Остановить можно одним способом.','e7der2'],
   ['der','Удалить это полушарие целиком.','e7der3'],['geo','Половину мозга?!','e7geo2','shock'],['der','В её возрасте вторая половина научится всему.','e7der4']],'scan'],
 [0,'Коридор','hall',[['tay',1150,Y,LEAD*1.02],['geo',720,Y,LEAD]],
  [['tay','Доброе утро, интерн.','e7tay1'],['cap','Джордж чувствует запах бурбона',null],['geo','Анестезиолог пьян?.. Он же старше меня. Мне никто не поверит.','e7geo3','sad']],'bourbon'],
 [0,'Палата Клэр Райс','room',[['cla',1150,Y,.8,{lying:true}],['tin',1480,Y,LEAD*.97],['bai',420,Y,LEAD],['mer',700,Y,LEAD]],
  [['bai','Ты никогда не была толстой — и сделала шунтирование желудка в Мексике?','e7bai1','shock'],['cla','Я просто хотела быть идеальной. Как хочет мама.','e7cla1','sad'],
   ['tin','Я хотела для неё только лучшего!','e7tin1','angry'],['mer','Клэр… Жизнь не должна быть такой трудной.','e7mer2']],'claire'],
 [0,'Раздевалка интернов','lounge',[['cri',600,Y,LEAD],['izz',1000,Y,LEAD],['mer',1350,Y,LEAD]],
  [['cri','Меня тошнит. Это Бёрк заразил меня гриппом.','e7cri1','sad'],['mer','Иззи, подашь халат?','e7mer3'],['izz','Возьми сама. Или попроси своего доктора Мечту.','e7izz3','angry']],'nausea'],
 [0,'Палата Дигби','room',[['dig',1150,Y,.8,{lying:true}],['bur',420,Y,LEAD],['alx',700,Y,LEAD]],
  [['bur','Опять вы. Я предпочитаю хобби поспокойнее. Трубу, например.','e7bur1'],['dig','Боль полезна, док. Без неё не чувствуешь, что живёшь.','e7dig3'],
   ['alx','Борьба, Айова? Я тоже боролся за Айову!','e7alx2']],'digbed'],
 [0,'Предоперационная','hall',[['tay',1200,Y,LEAD*1.02],['der',900,Y,LEAD*1.04],['geo',560,Y,LEAD],['cri',260,Y,LEAD]],
  [['geo','Доктор Тейлор… вы сегодня пили?','e7geo4'],['tay','Да как ты смеешь, интерн! Двадцать лет стажа!','e7tay2','angry'],
   ['der','О’Мэлли, вы свободны. Янг, мойтесь вместо него.','e7der5'],['geo','…Хорошо.','e7geo5','sad']],'scrub'],
 [0,'Операция Клэр','or',[['cla',CX,Y,.7,{lying:true,eyesShut:1}],['bai',CX-360,Y,LEAD,{mask:1,cap:'#c07bff'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['bai','Осторожно, кишка раздута. Не дави на неё…','e7bai2'],['cap','ПЛЮХ!',null],['mer','…Серьёзно?!','e7mer4','shock'],['bai','Добро пожаловать в хирургию, Грей.','e7bai3']],'bowel'],
 [0,'Палата Дигби · вечер','room',[['dig',1150,Y,.8,{lying:true,eyesShut:1}],['bur',420,Y,LEAD],['alx',700,Y,LEAD]],
  [['alx','Давление падает! Температура сорок!','e7alx3','shock'],['bur','Инфекция из старой татуировки. Она уже везде.','e7bur2'],
   ['alx','Держитесь, Дигби!','e7alx4'],['bur','…Время смерти двадцать один сорок.','e7bur3','sad'],['alx','Он же сам этого хотел. Боли.','e7alx5','sad']],'digcrash'],
 [0,'Операция Афины','or',[['ath',CX,Y,.55,{lying:true,eyesShut:1}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['cri',CX+360,Y,LEAD,{mask:1,cap:'#ff5a6e'}],['tay',260,Y,LEAD*1.02,{mask:1,cap:'#6a8a6a'}]],
  [['der','Удаляю лобную долю… Стоп. Она шевелится!','e7der6','shock'],['cri','Она просыпается! А Тейлор… спит!','e7cri2','shock'],
   ['der','Тейлор! Вон из моей операционной!','e7der7','angry'],['cap','Другой анестезиолог углубляет наркоз. Афина спасена',null]],'athena'],
 [0,'Коридор · после операции','hall',[['der',1000,Y,LEAD*1.04],['geo',700,Y,LEAD]],
  [['der','О’Мэлли. Вы были правы, а я нет. Простите.','e7der8'],['der','И про Мередит. Это не игра. Она мне правда дорога.','e7der9'],['geo','…Понятно.','e7geo6','sad']]],
 [0,'Дом Мередит · кухня','house',[['izz',700,Y,LEAD],['mer',1050,Y,LEAD]],
  [['izz','Ты спишь с начальником, а мы пашем за двоих!','e7izz4','angry'],['mer','Это не ради операций! Я…','e7mer5','sad'],
   ['izz','…Подожди. Ты в него влюблена. Ох, Мередит.','e7izz5']],'kitchen'],
 [0,'Ванная · ночь','lounge',[['cri',760,Y,LEAD]],
  [['cap','Кристина делает тест. Потом ещё один',null],['cri','…Две полоски. Нет-нет-нет.','e7cri3','shock'],
   ['mer','(за кадром) Зачем мы сами жмём на кнопку самоуничтожения? Может, без боли мы бы не чувствовали себя живыми.','e7mer6'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]],'tests'],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.pmp={","P.dig={n:'Дигби Оуэнс',s:'Дигби',r:'',skin:'#e8c09c',hair:'#2a1a10',hs:'buzz',cl:'#e8eef2',col:'#ffb060',gown:1,tat:1};\n"
    "P.tay={n:'Доктор Тейлор',s:'Тейлор',r:'анестезиолог с опытом',skin:'#e6c2a2',hair:'#9a9a9a',hs:'short',cl:'#3a5a3a',col:'#a0c060',coat:1,must:1};\n"
    "P.cla={n:'Клэр Райс',s:'Клэр',r:'',skin:'#f4d4bc',hair:'#3a2418',hs:'long',cl:'#e8eef2',col:'#ff9ad0',gown:1};\n"
    "P.tin={n:'Тина Райс, мама Клэр',s:'Тина',r:'',skin:'#f0ceb4',hair:'#e0c070',hs:'bob',cl:'#b0406a',col:'#e070a0'};\n"
    "P.ath={n:'Афина',s:'Афина',r:'',skin:'#f6dcc8',hair:'#e8c878',hs:'blond',cl:'#e8eef2',col:'#ffe080',gown:1};\nP.pmp={")

EXTRA=r"""function rain(t,a=.35){g.strokeStyle=`rgba(200,220,255,${a})`;g.lineWidth=2;for(let i=0;i<140;i++){const x=(i*137+t*120)%(W+200)-100,y=((i*71+t*900)%(H+100))-100;g.beginPath();g.moveTo(x,y);g.lineTo(x-10,y+34);g.stroke()}}
function stink(x,y,t,a=.6){g.lineWidth=5;g.lineCap='round';for(let i=0;i<3;i++){const q=(t*.6+i/3)%1;g.strokeStyle=`rgba(170,190,80,${a*(1-q)})`;g.beginPath();for(let k=0;k<=12;k++){const yy=y-q*120-k*6;g.lineTo(x+i*22-22+Math.sin(k*.9+t*4+i)*9,yy)}g.stroke()}}
function zzz(x,y,t){g.fillStyle='rgba(255,255,255,.9)';g.textAlign='center';for(let i=0;i<3;i++){const q=(t*.5+i/3)%1;g.globalAlpha=1-q;g.font=`bold ${26+q*30}px system-ui`;g.fillText('z',x+q*60,y-q*110)}g.globalAlpha=1}
function brainFilm(x,y,w,h,half,t){g.fillStyle='#10161c';rr(x,y,w,h,8);g.fill();g.fillStyle='rgba(230,245,255,.85)';rr(x+8,y+8,w-16,h-16,6);g.fill();g.fillStyle='#1c2630';rr(x+14,y+14,w-28,h-28,4);g.fill();
  const cx=x+w/2,cy=y+h/2;g.fillStyle='#c8d4dc';g.beginPath();g.ellipse(cx,cy,w*.36,h*.38,0,0,TAU);g.fill();g.strokeStyle='#8a9aa8';g.lineWidth=3;g.beginPath();g.moveTo(cx,cy-h*.38);g.lineTo(cx,cy+h*.38);g.stroke();
  for(let i=0;i<5;i++){g.beginPath();g.arc(cx-w*.18,cy-h*.2+i*h*.1,w*.08,.3,2.6);g.stroke();g.beginPath();g.arc(cx+w*.18,cy-h*.2+i*h*.1,w*.08,.3,2.6);g.stroke()}
  if(half>0){g.fillStyle=`rgba(40,50,60,${.75*half})`;g.beginPath();g.ellipse(cx-w*.18,cy,w*.17,h*.34,0,0,TAU);g.fill()}}
function extra(kind,u,t,s,lt){
  if(kind==='scan'){const d2=LN(s,'e7der2',lt);g.fillStyle='#e8f4ff';rr(1180,170,640,330,12);g.fill();glow(1500,335,420,'hsla(200,100%,95%,A)',.35);
    brainFilm(1200,190,290,290,0,t);brainFilm(1510,190,290,290,clamp(d2*1.5),t);g.fillStyle='#223';g.font='bold 24px system-ui';g.textAlign='center';g.fillText('январь',1345,530);g.fillText('март',1655,530);
    if(LN(s,'e7der3',lt)>0){g.strokeStyle=`rgba(255,80,80,${.6+.4*Math.sin(t*6)})`;g.lineWidth=6;g.beginPath();g.ellipse(1610,335,62,112,0,0,TAU);g.stroke()}}
  if(kind==='claire'){g.fillStyle='#fff';rr(820,160,300,190,10);g.fill();g.fillStyle='#223';g.font='bold 26px system-ui';g.textAlign='left';g.fillText('Клэр Райс, 17',840,200);g.font='22px system-ui';g.fillText('вес 55 кг (норма)',840,236);g.fillText('шунт желудка —',840,270);g.fillText('клиника, Мексика',840,300);g.fillStyle='#c33';g.fillRect(840,315,200,4)}
  if(kind==='nausea'){const c=LNx(s,'e7cri1',lt);if(c.p>0&&c.p<1.3){g.fillStyle='rgba(140,200,90,.25)';g.beginPath();g.arc(600,FL-360,70+Math.sin(t*5)*6,0,TAU);g.fill()}}
  if(kind==='bowel'){const c=LNx(s,'e7mer4',lt),q=(lt-(c.t0-1.1));if(q>0&&q<1.2){const f=1-q/1.2;g.fillStyle=`rgba(255,255,230,${.5*f})`;g.fillRect(-100,-100,W+200,H+200)}
    if(q>0){for(let i=0;i<22;i++){const a=-Math.PI*.15-(i/22)*Math.PI*.6,v=200+(i*47%160),tt=Math.min(q,.7);g.fillStyle='rgba(120,90,40,.85)';g.beginPath();g.arc(CX+60+Math.cos(a)*v*tt*1.6,FL-230+Math.sin(a)*v*tt+300*tt*tt,9+i%4*3,0,TAU);g.fill()}
      if(q>.6){g.fillStyle='rgba(120,90,40,.8)';for(let i=0;i<8;i++){g.beginPath();g.arc(CX+330+(i*23%70)-30,FL-420+(i*37%160),10+i%3*4,0,TAU);g.fill()}}}}
  if(kind==='athena'){const d6=LN(s,'e7der6',lt),d7=LNx(s,'e7der7',lt);if(d7.p<.2)zzz(300,FL-470,t);
    if(d6>.3&&d7.p<1){glow(1710,300,200,'hsla(0,100%,55%,A)',.3+.25*Math.sin(t*12))}}
  if(kind==='tests'){g.fillStyle='rgba(10,15,30,.45)';g.fillRect(-100,-100,W+200,H+200);const c=LN(s,'e7cri3',lt);
    g.fillStyle='#e8eef2';rr(1150,FL-330,500,180,16);g.fill();for(const[i,tx] of[[0,1220],[1,1440]]){g.fillStyle='#fff';rr(tx,FL-290,190,44,20);g.fill();g.fillStyle='#8ab';rr(tx+120,FL-282,40,28,6);g.fill();
      if(c>-.2||i===0&&lt>2){g.fillStyle='#e0306a';g.fillRect(tx+128,FL-280,5,24);g.fillRect(tx+144,FL-280,5,24)}}
    glow(1400,FL-240,260,'hsla(330,90%,70%,A)',c>0?.25:0)}
}"""
e.between("function rain(t,a=.35){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='sneak'){if(id==='der'){const a=ease(seg(lt,.2,1.6)),b=ease(seg(L('e7der1').p,1,2.2));const x=lerp(lerp(1500,1000,a),-300,b);return {x,o:(a>0&&a<1)||(b>0&&b<1)?{walk:true,flip:b>0}:{}}}
    if(id==='mer'){const e=ease(seg(L('e7izz2').p,.2,1.2));return {x:lerp(2300,1300,e),o:e>0&&e<1?{walk:true,flip:true}:{}}}}
  if(k==='digby'&&id==='dig')return {o:{flip:true},fx:()=>{g.fillStyle='#fff';rr(1150-66,Y-300*LEAD,40,34,6);g.fill();g.fillStyle='#c22';g.beginPath();g.arc(1150-46,Y-285*LEAD,7,0,TAU);g.fill()}};
  if(k==='scan'&&id==='der'){const on=L('e7der2').p>0;return {o:on?{reach:-1}:{}}}
  if(k==='bourbon'&&id==='tay')return {o:{flip:true,jx:Math.sin(t*1.3)*6},fx:()=>stink(1080,Y-440*LEAD,t)};
  if(k==='bourbon'&&id==='geo')return {o:{reach:0}};
  if(k==='nausea'&&id==='cri'){const c=L('e7cri1');return {o:c.p>0&&c.p<1.2?{jy:Math.sin(t*9)*3,reach:.5}:{}}}
  if(k==='nausea'&&id==='izz')return {o:{flip:L('e7izz3').p>0?false:true}};
  if(k==='digbed'&&id==='dig')return {fx:()=>{g.fillStyle='#fff';rr(1100,Y-240,70,40,8);g.fill();g.fillStyle='#c22';g.beginPath();g.arc(1135,Y-220,8,0,TAU);g.fill()}};
  if(k==='digcrash'){const b3=L('e7bur3');if(id==='dig')return {o:{jx:b3.p<0?Math.sin(t*25)*3:0},fx:()=>{g.fillStyle='rgba(220,40,40,.35)';g.beginPath();g.ellipse(1100,Y-215,90,36,0,0,TAU);g.fill()}};
    if(id==='alx'){return {x:lerp(700,930,ease(seg(L('e7alx3').p,.5,1.2))),o:b3.p<0&&L('e7alx3').p>1?{reach:1,work:true}:{}}}if(id==='bur')return {o:b3.p<0?{reach:1}:{}}}
  if(k==='scrub'){if(id==='geo'){const g5=L('e7geo5');const e=ease(seg(g5.p,1,2));return {x:lerp(560,-250,e),o:e>0?{walk:true,flip:true}:{}}}
    if(id==='cri'){const e=ease(seg(L('e7der5').p,.8,1.8));return {x:lerp(260,560,e),o:e>0&&e<1?{walk:true}:{}}}if(id==='tay')return {o:{flip:true}}}
  if(k==='bowel'){const m4=L('e7mer4');if(id==='bai')return {o:m4.p>-.3&&m4.p<0?{}:{reach:1,work:true,tool:true}};
    if(id==='mer')return {o:{reach:-1,work:m4.p<-.4,jy:m4.p>-.35&&m4.p<-.2?-10:0},fx:()=>{if(m4.p>-.3){g.fillStyle='rgba(120,90,40,.85)';for(let i=0;i<6;i++){g.beginPath();g.arc(CX+330+(i*29%60)-30,Y-360*LEAD+(i*41%120)-60,9+i%3*3,0,TAU);g.fill()}}}}}
  if(k==='athena'){const d6=L('e7der6'),d7=L('e7der7');
    if(id==='ath')return {o:{jy:d6.p>.3&&d7.p<1?Math.sin(t*12)*4:0}};
    if(id==='der')return {o:d7.p>0?{reach:-1}:{reach:1,work:d6.p<.3,tool:true}};
    if(id==='cri')return {o:{reach:d6.p>.3?-1:-.5}};
    if(id==='tay'){const e=ease(seg(d7.p,.9,1.8));return {x:lerp(260,-250,e),o:d7.p<.3?{eyesShut:1,jy:14+Math.sin(t*1.5)*4}:(e>0?{walk:true,flip:true,mood:'sad'}:{mood:'shock'})}}}
  if(k==='kitchen'&&id==='izz'){const i5=L('e7izz5');return {o:i5.p>0?{reach:1}:{}}}
  if(k==='tests'&&id==='cri')return {o:{reach:1}};
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  {const r=S.find(s=>s[5]==='sneak');for(let k=0;k<4;k++)tone(m(60+[0,3,7,10][k]),r.t0+.4+k*.25,.3,'triangle',.04)}
  {const z=LT('e7geo2').t;tone(m(48),z,.9,'sawtooth',.05)}
  {const z=LT('e7tay2').t;tone(m(43),z,1.2,'sawtooth',.05)}
  {const z=LT('e7mer4').t;noise(z-1.1,.35,500,.5);tone(m(40),z-1.1,.4,'square',.06)}
  {const a=LT('e7alx3').t,b=LT('e7bur3').t;for(let k=0;k<(b-a)*4;k++)tone(1400,a+k/4,.08,'square',.02);tone(1400,b,3,'sine',.04)}
  {const z=LT('e7der6').t;for(let k=0;k<12;k++)tone(1500,z+.5+k*.35,.1,'square',.025)}
  {const z=LT('e7izz5').t;for(let k=0;k<4;k++)tone(m(69+[0,4,7,12][k]),z+k*.15,1,'sine',.04)}
  {const z=LT('e7cri3').t;tone(m(45),z,2.5,'sine',.06);tone(m(52),z+.1,2.5,'sine',.04)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys7.html')
gallery('greys7','greys7.html','Анатомия страсти · 1×07','💣','linear-gradient(#2a0b1a,#1a1030)',
  'Седьмая серия «Кнопка самоуничтожения»: Шепарда ловят утром в доме Мередит, пьяный анестезиолог, пациент с «запланированным» огнестрелом, полушарэктомия у малышки и две полоски на тесте Кристины.',
  ['~4 мин · 16:9','серия 7','субтитры с именами'],'greys6')
