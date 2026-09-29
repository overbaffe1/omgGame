# Серия 1×08 «Спаси меня» (Save Me). Собирается из greys7.html.
# Улучшения: субтитры-караоке (сказанные слова ярче), общий план больницы, новый фон — лес с трейлером Дерека,
# кухня с кексами, приступ у Даффа, молоточек невролога, код синий с мигающим светом.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys7.html')
e.R('<title>Анатомия страсти · 1×07','<title>Анатомия страсти · 1×08')
e.R('сезон 1 · серия 7 · «Кнопка самоуничтожения»','сезон 1 · серия 8 · «Спаси меня»')
e.R("g.fillText('Сезон 1 · Серия 7',CX,740);g.font='italic 56px Georgia';g.fillText('«Кнопка самоуничтожения»',CX,820)",
    "g.fillText('Сезон 1 · Серия 8',CX,740);g.font='italic 60px Georgia';g.fillText('«Спаси меня»',CX,820)")
e.R("'anatomiya-strasti-1x07.webm'","'anatomiya-strasti-1x08.webm'")
e.R("'bur','tay'];","'bur','duf'];")
e.R("||s[5]==='digcrash'&&LN(s,'e7alx5',lt)>0","||s[5]==='psychic'&&LN(s,'e8duf2',lt)>0")
e.R("const BG={","const BG={woods:bgWoods,ext:bgExt,")
# караоке-субтитры
e.R("wrapText(txt,x0+44,y0+(cap?60:96),bw-100,52)","karaoke(txt,x0+44,y0+(cap?60:96),bw-100,52,cap?1:SUBP)")
e.R("    if(cur)subtitle(cur,1);","    if(cur){SUBP=clamp((lt-cur.t0)/Math.max(cur.d,.1)*1.1);subtitle(cur,1)}")

S=r"""const S=[
 [7,'','title',[],[]],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом Мередит · кухня, утро','house',[['izz',600,Y,LEAD],['geo',880,Y,LEAD],['der',2300,Y,LEAD*1.04]],
  [['izz','Опять не то. В кексах не хватает одного ингредиента.','e8izz1','sad'],['geo','Позвони маме и спроси.','e8geo1'],['izz','Ни за что.','e8izz2','angry'],
   ['geo','Доктор Шепард, кекс на завтрак?','e8geo2'],['izz','Он ест мюсли. Уже седьмое утро подряд.','e8izz3'],['der','Седьмое?.. Я живу здесь неделю?','e8der1','shock']],'cupcake'],
 [4.5,'Больница «Сиэтл Грейс»','ext',[],[]],
 [0,'Кабинет консультанта','office',[['cri',800,Y,LEAD]],
  [['cap','Кристина беременна от Бёрка и никому не говорит',null],['cri','Запишите меня на шестнадцатое. Обсуждать варианты не нужно.','e8cri1'],['cri','Разговорная часть мне не интересна.','e8cri2','angry']],'counsel'],
 [0,'Палата Дево Фридман','room',[['dev',1150,Y,.8,{lying:true}],['alx',640,Y,LEAD],['bur',380,Y,LEAD]],
  [['bur','Кратко, Карев.','e8bur1'],['alx','Семнадцать лет. Кровотечение после лечения зуба, новый шум в сердце.','e8alx1'],
   ['dev','Меня зовут Эстер. Не Дево.','e8dev1'],['alx','Джинсовая юбка под халатом? Ты что, амиш?','e8alx2'],['dev','Ортодоксальная иудейка, вообще-то.','e8dev2']],'devo'],
 [0,'Палата мистера Даффа','room',[['duf',1150,Y,.8,{lying:true}],['mer',640,Y,LEAD],['cri',380,Y,LEAD]],
  [['duf','Это не припадки. Я говорю с мёртвыми.','e8duf1'],['cap','Приступ',null],['duf','Кто-то на четвёртом этаже сейчас умрёт.','e8duf2'],
   ['cap','КОД СИНИЙ! ЧЕТВЁРТЫЙ ЭТАЖ!',null],['cri','…Совпадение.','e8cri3','shock']],'psychic'],
 [0,'Коридор','hall',[['mer',760,Y,LEAD],['der',1080,Y,LEAD*1.04]],
  [['mer','Я ничего о тебе не знаю. Друзья? Выходные?','e8mer1'],['der','Я хирург. У хирургов нет друзей.','e8der2'],
   ['mer','Тогда никакого секса, пока я тебя не узнаю.','e8mer2','angry'],['der','Узнавать друг друга — самое вкусное. Как подливка.','e8der3'],['mer','Я не хочу быть твоей подливкой!','e8mer3','angry']],'gravy'],
 [0,'Палата Томми Уокера','room',[['wal',1150,Y,.8,{lying:true}],['der',700,Y,LEAD*1.04],['mer',420,Y,LEAD]],
  [['der','Чувствуете?','e8der4'],['wal','Нет… Ничего. Десять минут назад я шевелил пальцами!','e8wal1','shock'],['der','Грей, срочно на МРТ.','e8der5']],'hammer'],
 [0,'Приёмный покой','room',[['erp',1150,Y,.8,{lying:true,eyesShut:1}],['geo',700,Y,LEAD],['alx',420,Y,LEAD],['bur',-250,Y,LEAD]],
  [['alx','Ну давай, О’Мэлли, мы все ждём.','e8alx3'],['geo','Трубка… в пищеводе.','e8geo3','shock'],['bur','Дай сюда.','e8bur2'],['cap','Бёрк интубирует с первой попытки',null]],'intub'],
 [0,'Палата мистера Даффа','room',[['duf',1150,Y,.8,{lying:true}],['cri',640,Y,LEAD]],
  [['cri','У вас эпилепсия. Никаких видений.','e8cri4'],['duf','Как скажете. И поздравляю. Вы беременны.','e8duf3'],['cri','…Что?!','e8cri5','shock']],'duffcri'],
 [0,'Палата Зои Гласс','room',[['zoe',1150,Y,.8,{lying:true}],['cri',640,Y,LEAD],['bai',380,Y,LEAD]],
  [['cap','У Зои рак груди. И она беременна',null],['zoe','Можно отложить химию до родов?','e8zoe1','sad'],
   ['cri','Гормоны ускоряют опухоль. Либо лечение — либо ребёнок.','e8cri6'],['bai','Решать вам, миссис Гласс.','e8bai1']]],
 [0,'Палата Дево','room',[['dev',1150,Y,.8,{lying:true}],['bur',380,Y,LEAD],['alx',640,Y,LEAD]],
  [['bur','Нужен новый клапан. Свиной — стандарт.','e8bur3'],['dev','Свиной?! Это некошерно. Нет!','e8dev3','angry'],
   ['bur','Без операции ты умрёшь.','e8bur4'],['dev','Алекс… найди другой способ.','e8dev4','sad']],'valve'],
 [0,'Палата Дево · вечер','room',[['dev',1150,Y,.8,{lying:true}],['alx',640,Y,LEAD],['bur',-250,Y,LEAD]],
  [['alx','Есть бычий клапан! Он даже лучше свиного.','e8alx4'],['bur','Карев. В коридор.','e8bur5','angry'],
   ['bur','Ты унизил меня перед семьёй. Ты отстранён.','e8bur6','angry']],'cow'],
 [0,'Палата Зои','room',[['zoe',1150,Y,.8,{lying:true}],['cri',640,Y,LEAD]],
  [['zoe','Моя мама умерла от рака. Мы оставим ребёнка. Он будет расти с отцом.','e8zoe2'],['cri','Я этого не понимаю.','e8cri7','sad']]],
 [0,'Лестница','hall',[['bur',1000,Y,LEAD],['alx',700,Y,LEAD]],
  [['bur','Карев. Сколько ждать бычий клапан?','e8bur7'],['alx','Правда?!','e8alx5','shock'],['bur','И найди раввина. Для благословения.','e8bur8']]],
 [0,'Операция Уокера','or',[['wal',CX,Y,.7,{lying:true,eyesShut:1}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['mer','А если там ничего нет? Мы режем вслепую.','e8mer4'],['der','Доверься мне… Вот он! Сгусток!','e8der6','shock'],['mer','Ты был прав.','e8mer5']],'clot'],
 [0,'Палата Даффа · после операции','room',[['duf',1150,Y,.8,{lying:true}],['izz',640,Y,LEAD]],
  [['duf','Она всё ещё рядом с вами, Сверчок.','e8duf4'],['duf','И в кексы — ложку кокосового экстракта.','e8duf5'],['izz','…Откуда вы знаете это имя?','e8izz4','shock']]],
 [0,'Дом Мередит · ночь','house',[['izz',760,Y,LEAD]],
  [['izz','Кокос… Идеально.','e8izz5'],['izz','Мам? Привет. Это я.','e8izz6']],'callmom'],
 [0,'Лес · трейлер Дерека','woods',[['mer',640,Y,LEAD],['der',920,Y,LEAD*1.04]],
  [['der','Это мой дом. Трейлер в лесу.','e8der7'],['der','Я из Нью-Йорка. У меня четыре сестры. Спрашивай.','e8der8'],['mer','Всё. Я хочу знать всё.','e8mer6'],
   ['mer','(за кадром) Мы все ждём, что нас спасут. Но иногда достаточно, чтобы кто-то открыл дверь.','e8mer7'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]],'trailer'],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.pmp={","P.dev={n:'Дево (Эстер) Фридман',s:'Эстер',r:'',skin:'#f4d8c2',hair:'#6a3a1a',hs:'long',cl:'#e8eef2',col:'#7fb0ff',gown:1};\n"
    "P.duf={n:'Мистер Дафф',s:'Дафф',r:'пациент, «экстрасенс»',skin:'#eac6a6',hair:'#5a3a22',hs:'short',cl:'#e8eef2',col:'#c080ff',gown:1};\n"
    "P.wal={n:'Томми Уокер',s:'Томми',r:'',skin:'#e6c09e',hair:'#8a5a2a',hs:'short',cl:'#e8eef2',col:'#80e0c0',gown:1};\n"
    "P.erp={n:'Пациент',s:'Пациент',r:'',skin:'#e0b898',hair:'#555',hs:'short',cl:'#e8eef2',col:'#aaa',gown:1};\n"
    "P.zoe={n:'Зои Гласс',s:'Зои',r:'',skin:'#f0d0b8',hair:'#2a1a12',hs:'bob',cl:'#e8eef2',col:'#ffb0a0',gown:1};\nP.pmp={")

EXTRA=r"""let SUBP=1;
function karaoke(txt,x,y,maxW,lh,p){const w=txt.split(' '),tot=txt.length;let cx=x,n=0,acc=0;const base=g.fillStyle;
  for(const s of w){const ww=g.measureText(s+' ').width;if(cx+ww-x>maxW&&cx>x){n++;cx=x}acc+=s.length+1;g.globalAlpha=(acc-s.length*.5)/tot<=p?1:.45;g.fillStyle=base;g.fillText(s,cx,y+n*lh);cx+=ww}g.globalAlpha=1}
function bgExt(t){vgrad('#7ea6c8','#d8e6ee');for(let i=0;i<5;i++){g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse((i*470+t*20)%2400-200,110+i*26,200,36,0,0,TAU);g.fill()}
  g.fillStyle='#8a9aa8';for(let i=0;i<9;i++)g.fillRect(i*230-30,420-(i*53%140),170,500);
  g.fillStyle='#d9dfe4';g.fillRect(460,250,1000,600);g.fillStyle='#c4ccd3';g.fillRect(460,250,1000,30);
  for(let r=0;r<6;r++)for(let c=0;c<10;c++){g.fillStyle=(r*7+c*3)%5===0?'#ffe7a0':'#7fa7c4';g.fillRect(500+c*96,310+r*80,60,46)}
  g.fillStyle='#2f6b8a';rr(700,190,520,70,12);g.fill();g.fillStyle='#fff';g.font='bold 44px system-ui';g.textAlign='center';g.fillText('SEATTLE GRACE',960,242);
  g.fillStyle='#6f7a82';g.fillRect(0,850,W,230);g.fillStyle='#e8e8e8';for(let i=0;i<12;i++)g.fillRect(i*170+((t*60)%170),950,90,10);
  const ax=((t*140)%(W+600))-300;g.fillStyle='#f2f2f2';rr(ax,820,260,110,16);g.fill();g.fillStyle='#d33';g.fillRect(ax,860,260,14);g.fillStyle='#111';g.beginPath();g.arc(ax+60,935,26,0,TAU);g.arc(ax+200,935,26,0,TAU);g.fill();
  if(Math.sin(t*10)>0)glow(ax+130,815,60,'hsla(0,100%,60%,A)',.9);else glow(ax+130,815,60,'hsla(220,100%,60%,A)',.9);
  g.fillStyle='rgba(255,255,255,.9)';g.font='bold 30px system-ui';g.fillText('Сиэтл, штат Вашингтон',960,1040)}
function bgWoods(t){vgrad('#0b1428','#1f2a3a');g.fillStyle='#f4efd8';g.beginPath();g.arc(1600,170,70,0,TAU);g.fill();glow(1600,170,260,'hsla(50,80%,85%,A)',.25);
  for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,.6)';g.fillRect((i*211)%W,(i*67)%330,2,2)}
  for(let l=0;l<3;l++){g.fillStyle=['#14241e','#1a3026','#20392c'][l];for(let i=0;i<14;i++){const x=(i*157+l*60)%(W+100)-50,h=260+l*80+(i*37%90);g.beginPath();g.moveTo(x,FL-40-h);g.lineTo(x-70-l*10,FL-40);g.lineTo(x+70+l*10,FL-40);g.fill()}}
  g.fillStyle='#2a3a28';g.fillRect(0,FL-60,W,H);g.fillStyle='#324530';for(let i=0;i<40;i++){g.fillRect((i*97)%W,FL-60+(i*29%200),30,4)}
  const x=1450;g.fillStyle='#c8ccd0';rr(x-300,FL-330,600,260,50);g.fill();g.fillStyle='#8a9aa4';g.fillRect(x-300,FL-230,600,14);
  g.fillStyle='#ffd98a';rr(x-230,FL-290,150,80,10);g.fill();glow(x-155,FL-250,220,'hsla(40,100%,70%,A)',.4);g.fillStyle='#6b5a4a';rr(x+60,FL-300,100,210,8);g.fill();
  g.fillStyle='#222';g.beginPath();g.arc(x-150,FL-70,36,0,TAU);g.arc(x+150,FL-70,36,0,TAU);g.fill();
  for(let i=0;i<14;i++){const fx=(i*263+Math.sin(t*.7+i)*60)%W,fy=FL-150-(i*53%260)+Math.cos(t+i)*20;glow(fx,fy,14,'hsla(60,100%,70%,A)',.5+.5*Math.sin(t*3+i))}}
function cupcakes(x,y,n,t){for(let i=0;i<n;i++){const cx=x+i*46;g.fillStyle='#d99a5a';g.beginPath();g.moveTo(cx-18,y);g.lineTo(cx+18,y);g.lineTo(cx+14,y+26);g.lineTo(cx-14,y+26);g.fill();g.fillStyle=['#ffd0e0','#fff4d0','#d0f0ff'][i%3];g.beginPath();g.arc(cx,y,20,Math.PI,TAU);g.fill();g.fillStyle='#e33';g.beginPath();g.arc(cx,y-20,5,0,TAU);g.fill()}}
function extra(kind,u,t,s,lt){
  if(kind==='cupcake'){g.fillStyle='#e8e0d0';rr(380,FL-120,340,20,6);g.fill();cupcakes(410,FL-150,6,t)}
  if(kind==='counsel'){g.fillStyle='#fff';rr(1200,180,420,260,10);g.fill();g.fillStyle='#223';g.font='bold 30px system-ui';g.textAlign='center';g.fillText('ЗАПИСЬ',1410,230);
    for(let d=0;d<21;d++){const cx=1235+(d%7)*55,cy=270+Math.floor(d/7)*50;g.fillStyle=d+1===16?'#e03060':'#e8eef2';rr(cx,cy,46,40,6);g.fill();g.fillStyle=d+1===16?'#fff':'#556';g.font='bold 20px system-ui';g.fillText(d+1,cx+23,cy+27)}}
  if(kind==='psychic'){const c=LN(s,'e8cri3',lt),q=s[4][3];if(lt>q.t0-.2&&c<.2){g.fillStyle=`rgba(40,90,255,${.18+.14*Math.sin(t*14)})`;g.fillRect(-100,-100,W+200,H+200)}}
  if(kind==='gravy'){if(LN(s,'e8der3',lt)>0){g.fillStyle='#9a6a3a';g.beginPath();g.ellipse(1250,FL-520,60,24,0,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(1250,FL-540,70,20,0,0,TAU);g.fill();g.fillStyle='#8a5a2a';g.beginPath();g.ellipse(1250,FL-542,56,13,0,0,TAU);g.fill()}}
  if(kind==='clot'){if(LN(s,'e8der6',lt)>.3){g.fillStyle='#6a0a14';g.beginPath();g.ellipse(CX-40,FL-215,22,14,0,0,TAU);g.fill();glow(CX-40,FL-215,70,'hsla(50,100%,70%,A)',.5+.3*Math.sin(t*8))}}
  if(kind==='callmom'){g.fillStyle='rgba(10,15,40,.45)';g.fillRect(-100,-100,W+200,H+200);g.fillStyle='#e8e0d0';rr(380,FL-120,340,20,6);g.fill();cupcakes(410,FL-150,6,t);
    if(LN(s,'e8izz6',lt)<0){g.fillStyle='#fff';rr(1000,FL-300,50,80,8);g.fill();g.fillStyle='#8a5a2a';g.fillRect(1004,FL-280,42,40);g.fillStyle='#222';g.font='bold 14px system-ui';g.textAlign='center';g.fillText('КОКОС',1025,FL-236)}}
  if(kind==='trailer'){}
}"""
e.between("let SUBP","\nfunction subtitle",EXTRA) if "let SUBP" in e.s else e.between("function rain(t,a=.35){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='cupcake'){if(id==='der'){const e=ease(seg(L('e8geo1').p,1,2.2));return {x:lerp(2300,1250,e),o:e>0&&e<1?{walk:true,flip:true}:{flip:true}}}
    if(id==='izz')return {o:{reach:L('e8izz1').p>0&&L('e8izz1').p<1.2?-1:0}}}
  if(k==='counsel'&&id==='cri')return {o:{flip:false}};
  if(k==='psychic'){const q=s[4][1],d2=L('e8duf2');if(id==='duf')return {o:{jx:lt>q.t0&&lt<q.t1?Math.sin(t*40)*6:0,eyesShut:lt>q.t0&&d2.p<0}};
    if(id==='cri'&&lt>q.t0&&d2.p<0)return {o:{reach:1,work:true}};if(id==='mer'&&lt>q.t0&&d2.p<0)return {o:{reach:1}}}
  if(k==='hammer'&&id==='der'){const d4=L('e8der4');return {o:{reach:1},fx:()=>{if(d4.p>0&&L('e8der5').p<0){const a=Math.sin(t*9)*.4;g.save();g.translate(840,Y-300);g.rotate(a);g.fillStyle='#bbb';g.fillRect(0,-4,110,8);g.fillStyle='#d33';rr(96,-16,34,32,8);g.fill();g.restore()}}}}
  if(k==='hammer'&&id==='wal'){const w1=L('e8wal1');return {o:{jy:w1.p>0&&w1.p<1?Math.sin(t*6)*2:0}}}
  if(k==='intub'){const b2=L('e8bur2');if(id==='geo'){const e=ease(seg(b2.p,-.2,.6));return {x:lerp(700,480,e),o:e<.5?{reach:1,work:true}:{mood:'sad'}}}
    if(id==='bur'){const e=ease(seg(L('e8geo3').p,.4,1.4));return {x:lerp(-250,760,e),o:e>0&&e<1?{walk:true}:(e>=1?{reach:1,work:b2.p<1.3}:{})}}
    if(id==='alx')return {o:{flip:false}}}
  if(k==='duffcri'&&id==='cri'&&L('e8cri5').p>0)return {o:{reach:-.3}};
  if(k==='valve'&&id==='bur')return {fx:()=>{g.fillStyle='#fff';rr(360,250,200,120,10);g.fill();g.fillStyle='#f3a0b0';g.beginPath();g.ellipse(460,315,40,30,0,0,TAU);g.fill();g.fillStyle='#222';g.beginPath();g.arc(450,312,5,0,TAU);g.arc(470,312,5,0,TAU);g.fill()}};
  if(k==='cow'){const b5=L('e8bur5');if(id==='bur'){const e=ease(seg(L('e8alx4').p,.6,1.3));return {x:lerp(-250,380,e),o:e>0&&e<1?{walk:true}:{}}}
    if(id==='alx')return {o:L('e8alx4').p>0&&b5.p<0?{reach:1}:(L('e8bur6').p>0?{mood:'sad'}:{})}}
  if(k==='clot'){const d6=L('e8der6');if(id==='der')return {o:{reach:1,work:d6.p<.3,tool:true}};if(id==='mer')return {o:{reach:-1,work:true}}}
  if(k==='callmom'&&id==='izz'){const i6=L('e8izz6');return {o:i6.p>-.3?{reach:.4,flip:true}:{reach:1},fx:()=>{if(i6.p>-.3){g.fillStyle='#222';rr(760-60,Y-455*LEAD,22,44,5);g.fill()}}}}
  if(k==='trailer'){if(id==='der'){const e=ease(seg(L('e8mer6').p,1.1,2.4));return {x:lerp(920,1510,e),o:e>0&&e<1?{walk:true}:(L('e8der7').p>0&&L('e8der7').p<1?{reach:1}:{})}}
    if(id==='mer'){const e=ease(seg(L('e8mer6').p,1.3,2.6));return {x:lerp(640,1360,e),o:e>0&&e<1?{walk:true}:{}}}}
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  {const r=S.find(s=>s[2]==='ext');for(let k=0;k<8;k++)tone(k%2?740:880,r.t0+.3+k*.45,.4,'triangle',.02);noise(r.t0,4.5,900,.05,'lowpass')}
  {const z=LT('e8der1').t;tone(m(50),z,.8,'sawtooth',.04)}
  {const r=S.find(s=>s[5]==='psychic'),q=r[4][3];for(let k=0;k<6;k++)tone(k%2?660:880,r.t0+q.t0+k*.3,.25,'square',.04)}
  {const z=LT('e8cri5').t;tone(m(45),z,1.5,'sawtooth',.05)}
  {const z=LT('e8der6').t;for(let k=0;k<4;k++)tone(m(72+[0,4,7,12][k]),z+k*.1,1,'sine',.05)}
  {const z=LT('e8izz5').t;for(let k=0;k<4;k++)tone(m(76+[0,3,7,12][k]),z+k*.15,1,'sine',.04)}
  {const r=S.find(s=>s[5]==='trailer');for(let k=0;k<r[0]*2;k++)tone(k%3?4200:3800,r.t0+k*.5+.1*Math.sin(k),.05,'sine',.012);for(let k=0;k<8;k++)tone(m([60,64,67,72,67,64,62,60][k]),r.t0+2+k*1.2,1.4,'sine',.03)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys8.html')
gallery('greys8','greys8.html','Анатомия страсти · 1×08','🧁','linear-gradient(#1a2a14,#0b1428)',
  'Восьмая серия «Спаси меня»: «экстрасенс» мистер Дафф угадывает смерть на 4-м этаже и беременность Кристины, Эстер отказывается от свиного клапана, Шепард ищет сгусток вслепую и показывает Мередит свой трейлер в лесу.',
  ['~4 мин · 16:9','серия 8','субтитры-караоке'],'greys7')
