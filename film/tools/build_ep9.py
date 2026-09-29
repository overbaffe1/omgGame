# Серия 1×09 «Кто кого?» (Who's Zoomin' Who?) — финал 1 сезона. Собирается из greys8.html.
# Улучшения: блок «Ранее в сериале» (сепия), финальные титры со всеми героями серии,
# падение героя на пол (удар), стоп-кадр-клиффхэнгер с появлением Эддисон.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys8.html')
e.R('<title>Анатомия страсти · 1×08','<title>Анатомия страсти · 1×09')
e.R('сезон 1 · серия 8 · «Спаси меня»','сезон 1 · серия 9 · «Кто кого?»')
e.R("g.fillText('Сезон 1 · Серия 8',CX,740);g.font='italic 60px Georgia';g.fillText('«Спаси меня»',CX,820)",
    "g.fillText('Сезон 1 · Серия 9 · финал сезона',CX,740);g.font='italic 60px Georgia';g.fillText('«Кто кого?»',CX,820)")
e.R("'anatomiya-strasti-1x08.webm'","'anatomiya-strasti-1x09.webm'")
e.R("'bur','duf'];","'bur','oli'];")
e.R("||s[5]==='psychic'&&LN(s,'e8duf2',lt)>0","||s[5]==='fcode'&&LN(s,'e9bai2',lt)<0")
e.R("if(s[2]==='title')titleCard(u,t);","if(s[2]==='title')titleCard(u,t);else if(s[2]==='credits')creditsCard(u,t);")

S=r"""const S=[
 [7,'','title',[],[]],
 [0,'Ранее в «Анатомии страсти»','house',[['mer',760,Y,LEAD],['der',1060,Y,LEAD*1.04]],[['cap','Мередит и Дерек вместе. В больнице никто не должен об этом знать',null]],'recap'],
 [0,'Ранее в «Анатомии страсти»','lounge',[['cri',800,Y,LEAD]],[['cap','Кристина беременна от Бёрка и записалась на прерывание на 16-е',null]],'recap'],
 [0,'Ранее в «Анатомии страсти»','hall',[['geo',760,Y,LEAD],['oli',1060,Y,LEAD]],[['cap','Джордж начал встречаться с медсестрой Оливией',null]],'recap'],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом Мередит · ванная, утро','house',[['izz',900,Y,LEAD],['geo',-250,Y,LEAD]],
  [['izz','Джордж, ты там скоро?','e9izz1'],['geo','Это личное!','e9geo1','shock'],['izz','Не стыдись, Джордж. Все так делают.','e9izz2']],'bath'],
 [0,'Коридор','hall',[['cri',760,Y,LEAD],['bur',1060,Y,LEAD],['web',-250,Y,LEAD*1.02]],
  [['bur','Почему ты вчера не ответила на пейджер?','e9bur1'],['cri','Я… мне пора.','e9cri1','sad'],['cap','Мимо проходит шеф. Он держится за голову',null]],'sway'],
 [0,'Раздевалка интернов','lounge',[['geo',760,Y,LEAD],['alx',1060,Y,LEAD]],
  [['geo','Карев, глянь, что за сыпь. Мне самому не видно.','e9geo2','sad'],['alx','Сифилис. Удачи, О’Мэлли.','e9alx1'],['geo','Сифилис?!','e9geo3','shock']]],
 [0,'Операция шефа','or',[['pat',CX,Y,.7,{lying:true,eyesShut:1}],['web',CX-360,Y,LEAD*1.02,{mask:1,cap:'#1f3048'}],['bai',CX+360,Y,LEAD,{mask:1,cap:'#c07bff'}],['mer',1560,Y,SM,{mask:1,cap:'#4fa3ff'}]],
  [['web','Кто убавил свет? Темно.','e9web1'],['cap','Дзынь! Шеф роняет инструмент',null],['web','Бейли. Заканчивайте.','e9web2'],['bai','…Да, сэр.','e9bai1','shock']],'drop'],
 [0,'Палата мистера Франклина','room',[['frn',1150,Y,.8,{lying:true}],['alc',1480,Y,LEAD*.95],['cri',640,Y,LEAD],['izz',380,Y,LEAD]],
  [['cri','У вас асцит. Жидкость в животе.','e9cri2'],['alc','Потому что он пьёт. Все это знают.','e9alc1','angry']],'belly'],
 [0,'Лестница','hall',[['geo',760,Y,LEAD],['oli',1060,Y,LEAD]],
  [['oli','Ты что, меня бросаешь?','e9oli1','sad'],['geo','Нет! Нет… У меня сифилис.','e9geo4'],['oli','Что?!','e9oli2','shock']],'stairs'],
 [0,'Кабинет шефа','office',[['web',700,Y,LEAD*1.02],['der',1000,Y,LEAD*1.04]],
  [['web','Правый глаз мутнеет. Уже несколько недель.','e9web3','sad'],['web','Никто не должен знать. Никто.','e9web4'],['der','Тогда МРТ сегодня. Тайно.','e9der1']]],
 [0,'Процедурная','lounge',[['geo',760,Y,LEAD],['alx',1060,Y,LEAD],['mer',1360,Y,LEAD]],
  [['alx','Пенициллин. Нагнись, О’Мэлли.','e9alx2'],['mer','Ты колешь неправильно. Дай сюда.','e9mer1'],['geo','Ай!','e9geo5','shock']],'pen'],
 [0,'Собрание персонала','hall',[['web',1100,Y,LEAD*1.02],['geo',420,Y,SM],['oli',620,Y,SM],['alx',820,Y,SM],['izz',220,Y,SM]],
  [['web','Три интерна, четыре резидента и шесть медсестёр! Сифилис!','e9web5','angry'],['web','Презервативы. Пользуйтесь ими.','e9web6']],'lecture'],
 [0,'Кабинет МРТ','office',[['der',700,Y,LEAD*1.04],['web',1000,Y,LEAD*1.02]],
  [['der','Опухоль давит на зрительный нерв.','e9der2'],['der','Оперирую сегодня ночью. Об этом узнают только Бейли и Грей.','e9der3']],'mri'],
 [0,'Палата Франклина · вечер','room',[['frn',1150,Y,.8,{lying:true,eyesShut:1}],['izz',640,Y,LEAD],['cri',380,Y,LEAD],['bai',-250,Y,LEAD]],
  [['izz','Нет пульса!','e9izz3','shock'],['cri','Код синий!','e9cri3','shock'],['bai','Вы сделали всё, что могли.','e9bai2'],['cri','Семья отказалась от вскрытия. Мы так и не узнаем почему.','e9cri4','angry']],'fcode'],
 [0,'Операция Билла Адамса','or',[['bil',CX,Y,.7,{lying:true,eyesShut:1}],['bur',CX-360,Y,LEAD,{mask:1,cap:'#1f3048'}]],
  [['cap','Друг Бёрка Билл ждёт ребёнка',null],['bur','Он бесплоден… Этот ребёнок не может быть его.','e9bur2','shock']]],
 [0,'Пустая палата · ночь','room',[['frn',1150,Y,.8,{lying:true,eyesShut:1}],['izz',640,Y,LEAD],['cri',380,Y,LEAD]],
  [['izz','Мы похитители тел!','e9izz4','shock'],['cri','Держи учебник открытым. Режем.','e9cri5']],'autopsy'],
 [0,'Коридор · ночь','hall',[['mer',760,Y,LEAD],['der',1400,Y,LEAD*1.04],['web',1750,Y,SM]],
  [['mer','Моя мама не путешествует. У неё Альцгеймер. Тяжёлый.','e9mer2','sad'],['der','Иди сюда.','e9der4'],['cap','Шеф видит их вместе',null]],'hug'],
 [0,'Пустая палата · ночь','room',[['frn',1150,Y,.8,{lying:true,eyesShut:1}],['izz',640,Y,LEAD],['cri',380,Y,LEAD],['bai',-250,Y,LEAD]],
  [['bai','Вскрытие без согласия семьи?! Это нападение!','e9bai3','angry'],['izz','Сердце. Шестьсот граммов.','e9izz5'],['bai','…Ладно. Делайте анализы.','e9bai4']],'heart'],
 [0,'Палата шефа','room',[['web',1150,Y,.8,{lying:true}],['mer',640,Y,LEAD]],
  [['mer','Вы видите!','e9mer3'],['web','Вижу. Держись подальше от Шепарда, Грей. Это ошибка.','e9web7'],['mer','Это не ошибка.','e9mer4']]],
 [0,'Раздевалка · вечер','lounge',[['geo',700,Y,LEAD],['oli',1000,Y,LEAD],['alx',1400,Y,LEAD]],
  [['oli','До тебя я встречалась с Алексом.','e9oli3','sad'],['geo','Ты заразил меня сифилисом?!','e9geo6','angry'],['cap','Джордж бьёт Алекса',null]],'punch'],
 [0,'Холл больницы','hall',[['mer',760,Y,LEAD],['der',1060,Y,LEAD*1.04],['add',2300,Y,LEAD*1.02]],
  [['der','Ну что, ко мне в трейлер?','e9der5'],['mer','(за кадром) Секреты. Мы храним их, пока они не начинают хранить нас.','e9mer5'],
   ['add','Ты, должно быть, та женщина, что спит с моим мужем.','e9add1'],['mer','…С мужем?!','e9mer6','shock'],['cap','ЭДДИСОН ШЕПАРД — ЖЕНА ДЕРЕКА',null]],'addison'],
 [14,'','credits',[],[]],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.pmp={","P.oli={n:'Оливия, медсестра',s:'Оливия',r:'медсестра, девушка Джорджа',skin:'#f2d0b8',hair:'#c8903a',hs:'long',cl:'#e79ab7',col:'#ff7ab8'};\n"
    "P.frn={n:'Джордан Франклин',s:'Франклин',r:'',skin:'#e4b894',hair:'#777',hs:'short',cl:'#e8eef2',col:'#aaa',gown:1};\n"
    "P.alc={n:'Элис, дочь Франклина',s:'Элис',r:'',skin:'#f2d4bc',hair:'#1a1210',hs:'bob',cl:'#303048',col:'#9090ff'};\n"
    "P.bil={n:'Билл Адамс',s:'Билл',r:'',skin:'#e6c09e',hair:'#6a4a2a',hs:'short',cl:'#e8eef2',col:'#aaa',gown:1};\n"
    "P.add={n:'Эддисон Шепард',s:'Эддисон',r:'',skin:'#f6dcc8',hair:'#b8321e',hs:'long',cl:'#1a1a22',col:'#ff3a3a'};\nP.pmp={")

EXTRA=r"""function heartBig(x,y,s){g.fillStyle='#8a1a24';g.beginPath();g.moveTo(x,y+40*s);g.bezierCurveTo(x-70*s,y,x-50*s,y-60*s,x,y-30*s);g.bezierCurveTo(x+50*s,y-60*s,x+70*s,y,x,y+40*s);g.fill();g.fillStyle='rgba(255,255,255,.2)';g.beginPath();g.ellipse(x-20*s,y-20*s,12*s,8*s,-.5,0,TAU);g.fill()}
function creditsCard(u,t){vgrad('#07090d','#10141c');const ids=[...new Set(S.flatMap(s=>s[3].map(a=>a[0])))].filter(id=>P[id]&&P[id].s);
  const rows=[['АНАТОМИЯ СТРАСТИ',''],['Сезон 1 · финал',''],['',''],...ids.map(id=>[P[id].n,id]),['',''],['Озвучка: Silero TTS',''],['Мультфильм по мотивам сериала «Анатомия страсти»',''],['',''],['Продолжение — во 2-м сезоне','']];
  const y0=H+40-u*(rows.length*90+H*.6);g.textAlign='center';
  rows.forEach(([txt,id],i)=>{const y=y0+i*90;if(y<-60||y>H+60)return;if(id){person(id,CX-330,y+40,.18,{t,tag:false});g.fillStyle=P[id].col;g.font='bold 40px system-ui';g.fillText(txt,CX+40,y+10)}
    else{g.fillStyle=i<2?'#9fe0e0':'#dde';g.font=i===0?'bold 64px Georgia':'italic 38px Georgia';g.fillText(txt,CX,y)}})}
function extra(kind,u,t,s,lt){
  if(kind==='recap'){g.fillStyle='rgba(120,80,30,.28)';g.fillRect(-100,-100,W+200,H+200);g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,24);g.fillRect(0,H-24,W,24);g.restore()}
  if(kind==='bath'){g.fillStyle='#e8e0d0';rr(260,FL-560,300,560,6);g.fill();g.strokeStyle='#8a6a4a';g.lineWidth=10;g.strokeRect(260,FL-560,300,560);g.fillStyle='#c9a26a';g.beginPath();g.arc(520,FL-280,10,0,TAU);g.fill();g.fillStyle='#223';g.font='bold 26px system-ui';g.textAlign='center';g.fillText('ЗАНЯТО',410,FL-470)}
  if(kind==='drop'){const c=s[4][1];if(lt>c.t0){const q=Math.min(1,(lt-c.t0)*2.5);g.fillStyle='#c9d2da';g.save();g.translate(CX-300,FL-330+q*300);g.rotate(q*4);g.fillRect(-3,-22,6,44);g.restore()}
    if(LN(s,'e9web1',lt)>0&&LN(s,'e9web2',lt)<0){g.fillStyle=`rgba(0,0,0,${.25+.15*Math.sin(t*3)})`;g.fillRect(-100,-100,W+200,H+200)}}
  if(kind==='lecture'){g.fillStyle='#6b4428';rr(1240,FL-260,160,260,8);g.fill();g.fillStyle='#8a5a36';g.fillRect(1230,FL-270,180,16);
    g.fillStyle='#ffe14a';g.save();g.translate(1500,FL-420);g.rotate(-.4);g.beginPath();g.ellipse(0,0,70,20,0,0,Math.PI);g.fill();g.restore();npc('nr1',1500,FL-10,.8,t,{tag:false,a:1,reach:1})}
  if(kind==='mri'){g.fillStyle='#e8f4ff';rr(1180,170,380,330,12);g.fill();g.fillStyle='#1c2630';rr(1200,190,340,290,6);g.fill();g.fillStyle='#c8d4dc';g.beginPath();g.ellipse(1370,335,120,110,0,0,TAU);g.fill();
    g.fillStyle='#f0f4f8';g.beginPath();g.arc(1340,310,18,0,TAU);g.arc(1400,310,18,0,TAU);g.fill();g.strokeStyle=`rgba(255,80,80,${.6+.4*Math.sin(t*6)})`;g.lineWidth=5;g.beginPath();g.arc(1395,335,22,0,TAU);g.stroke()}
  if(kind==='autopsy'||kind==='heart'){g.fillStyle='rgba(8,12,30,.5)';g.fillRect(-100,-100,W+200,H+200);glow(1000,FL-260,420,'hsla(190,60%,85%,A)',.35);
    g.fillStyle='#c8b890';rr(760,FL-330,120,90,6);g.fill();g.fillStyle='#fff';g.fillRect(770,FL-322,48,74);g.fillRect(822,FL-322,48,74)}
  if(kind==='punch'){const g6=LNx(s,'e9geo6',lt);if(g6.p>.55&&g6.p<.8){g.fillStyle='rgba(255,255,255,.6)';g.fillRect(-100,-100,W+200,H+200);for(let i=0;i<10;i++){const a=i/10*TAU;g.strokeStyle='#ffd23f';g.lineWidth=6;g.beginPath();g.moveTo(1300+Math.cos(a)*40,FL-380+Math.sin(a)*40);g.lineTo(1300+Math.cos(a)*110,FL-380+Math.sin(a)*110);g.stroke()}}}
  if(kind==='addison'){const m6=LN(s,'e9mer6',lt);if(m6>0){g.fillStyle=`rgba(160,0,20,${Math.min(.35,m6*.3)})`;g.fillRect(-100,-100,W+200,H+200)}}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='bath'&&id==='geo'){const e=ease(seg(L('e9geo1').p,.9,1.7));return {x:lerp(-250,420,e),o:e>0&&e<1?{walk:true}:{mood:e>=1?'sad':undefined}}}
  if(k==='bath'&&id==='izz')return {o:{flip:true}};
  if(k==='sway'&&id==='web'){const q=s[4][2];const e=ease(seg(lt,q.t0-.8,q.t1+1.5));return {x:lerp(-250,2200,e),o:{walk:e>0&&e<1,reach:e>0?.9:0,jx:Math.sin(t*2)*14}}}
  if(k==='sway'&&id==='cri'){const e=ease(seg(L('e9cri1').p,.8,1.6));return {x:lerp(760,-250,e),o:e>0&&e<1?{walk:true,flip:true}:{}}}
  if(k==='drop'){const c=s[4][1];if(id==='web')return {o:lt>c.t0?{jx:Math.sin(t*3)*6}:{reach:1,work:true,tool:true}};if(id==='bai')return {o:{reach:-1,work:lt>c.t0}}}
  if(k==='belly'&&id==='frn')return {fx:()=>{g.fillStyle='#dfe9ef';g.beginPath();g.ellipse(1160,Y-205,120,70,0,Math.PI,TAU);g.fill();g.fillStyle='#b8cfe0';for(let i=0;i<4;i++){g.beginPath();g.arc(1100+i*40,Y-235,5,0,TAU);g.fill()}}};
  if(k==='stairs'&&id==='oli'){const e=ease(seg(L('e9oli2').p,1,2));return {x:lerp(1060,2200,e),o:e>0&&e<1?{walk:true}:{}}}
  if(k==='pen'){const m1=L('e9mer1');if(id==='geo')return {o:{flip:true,jy:L('e9geo5').p>0&&L('e9geo5').p<.5?-18:0}};
    if(id==='alx'){const e=ease(seg(m1.p,1,2));return {x:lerp(1060,2200,e),o:e>0&&e<1?{walk:true}:(m1.p<0?{reach:-1}:{})}}
    if(id==='mer'){const e=ease(seg(m1.p,1,1.8));return {x:lerp(1360,960,e),o:e>0&&e<1?{walk:true,flip:true}:(e>=1?{reach:-1,flip:true}:{})}}}
  if(k==='lecture'&&id==='web')return {o:{reach:L('e9web5').p>0&&L('e9web5').p<1?1:0}};
  if(k==='lecture'&&['geo','oli','alx','izz'].includes(id))return {o:{mood:id==='geo'||id==='oli'?'sad':undefined}};
  if(k==='fcode'){const i3=L('e9izz3');if(id==='izz')return {x:lerp(640,860,ease(seg(i3.p,0,.4))),o:i3.p>.3&&L('e9bai2').p<0?{reach:1,work:true,jy:-Math.abs(Math.sin(t*9))*8}:{}};
    if(id==='bai'){const e=ease(seg(L('e9cri3').p,.5,1.4));return {x:lerp(-250,200,e),o:e>0&&e<1?{walk:true}:{}}}}
  if(k==='autopsy'){if(id==='cri')return {x:780,o:{reach:1,work:true,tool:true}};if(id==='izz')return {x:1500,o:{reach:-1,flip:true}}}
  if(k==='heart'){if(id==='izz')return {x:900,o:{up:L('e9izz5').p>0?1:0},fx:()=>{if(L('e9izz5').p>0)heartBig(900,Y-560*LEAD,1.1)}};
    if(id==='bai'){const e=ease(seg(lt,.1,1));return {x:lerp(-250,380,e),o:e>0&&e<1?{walk:true}:{}}}if(id==='cri')return {x:560}}
  if(k==='hug'){const d4=L('e9der4');if(id==='der'){const e=ease(seg(d4.p,0,.9));return {x:lerp(1400,860,e),o:e>0&&e<1?{walk:true,flip:true}:(e>=1?{reach:-1,flip:true}:{})}}
    if(id==='mer')return {o:d4.p>.9?{reach:1}:{}};if(id==='web')return {o:{flip:true,mood:'angry'}}}
  if(k==='punch'){const g6=L('e9geo6');if(id==='geo'){const e=ease(seg(g6.p,.2,.6));return {x:lerp(700,1180,e),o:g6.p>.5?{reach:1}:{}}}
    if(id==='alx'){if(g6.p>.65)return {x:1560,o:{lying:true,ground:true,eyesShut:1}};return null}
    if(id==='oli')return {o:{flip:g6.p>0}}}
  if(k==='addison'){if(id==='add'){const e=ease(seg(L('e9mer5').p,.3,1));return {x:lerp(2300,1400,e),o:e>0&&e<1?{walk:true,flip:true}:{flip:true}}}
    if(id==='der'&&L('e9add1').p>0)return {o:{mood:'shock'}}}
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[5]==='recap'))tone(m(57),r.t0+.2,r[0],'sine',.03);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  {const z=LT('e9geo3').t;tone(m(48),z,.9,'sawtooth',.05)}
  {const r=S.find(s=>s[5]==='drop');const q=r[4][1];tone(3000,r.t0+q.t0+.35,.3,'triangle',.08);tone(2400,r.t0+q.t0+.45,.3,'triangle',.06)}
  {const a=LT('e9izz3').t,b=LT('e9bai2').t;for(let k=0;k<(b-a)*4;k++)tone(1400,a+k/4,.08,'square',.02);tone(1400,b-.3,2.5,'sine',.04)}
  {const z=LT('e9izz5').t;for(let k=0;k<3;k++)tone(m(60+[0,3,7][k]),z+k*.12,1,'sine',.04)}
  {const z=LT('e9geo6');noise(z.t+z.d*.6,.12,700,.6);tone(m(36),z.t+z.d*.6,.2,'square',.06)}
  {const z=LT('e9mer6').t;noise(z-.2,.3,1200,.2);for(let k=0;k<3;k++)tone(m([38,37,36][k]),z+k*.5,1.6,'sawtooth',.05)}
  {const r=S.find(s=>s[2]==='credits');for(let k=0;k<12;k++)tone(m([60,64,67,72,71,67,64,62,60,64,67,60][k]),r.t0+.5+k*1.05,1.5,'sine',.04)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys9.html')
gallery('greys9','greys9.html','Анатомия страсти · 1×09','💍','linear-gradient(#2a0a0e,#0b0d14)',
  'Финал 1 сезона «Кто кого?»: сифилис в больнице, тайная операция шефа, похитители тел Иззи и Кристина, Джордж бьёт Алекса — и появление жены Дерека.',
  ['~5 мин · 16:9','серия 9 · финал','титры'],'greys8')
