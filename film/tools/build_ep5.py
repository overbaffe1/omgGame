# Серия 1×05 «Зажигай» (Shake Your Groove Thing). Собирается из greys4.html.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys4.html')
e.R('<title>Анатомия страсти · 1×04','<title>Анатомия страсти · 1×05')
e.R('сезон 1 · серия 4 · «Ничья земля»','сезон 1 · серия 5 · «Зажигай!»')
e.R("g.fillText('Сезон 1 · Серия 4',CX,740);g.font='italic 60px Georgia';g.fillText('«Ничья земля»',CX,820)",
    "g.fillText('Сезон 1 · Серия 5',CX,740);g.font='italic 60px Georgia';g.fillText('«Зажигай!»',CX,820)")
e.R("'anatomiya-strasti-1x04.webm'","'anatomiya-strasti-1x05.webm'")
e.R("'bur','liz'];","'bur','drk'];")
e.R("||s[5]==='liz'&&LN(s,'e4cri5',lt)>.8","||s[5]==='bleed'")

S=r"""const S=[
 [7,'','title',[],[]],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом престарелых · шесть утра','room',[['mer',780,Y,LEAD],['ell',1160,Y,LEAD]],
  [['cap','Мередит не спала двое суток. Ей нужно, чтобы мама подписала доверенность',null],
   ['mer','Мама, подпиши, пожалуйста. Пока ты… всё помнишь.','e5mer1','sad'],['ell','Опять бумажки? Мне некогда. У меня операция в девять.','e5ell1']]],
 [0,'Операция на сердце','or',[['pmp',CX,Y,.7,{lying:true,eyesShut:1}],['bur',CX-360,Y,LEAD,{mask:1,cap:'#1f3048'}],['mer',CX+300,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['bur','Держите сердце ровно, Грей. Я накладываю шов.','e5bur1'],['bur','Грей! Вы что, спите?','e5bur2','angry'],['mer','Простите… Сердце выскользнуло.','e5mer2','shock'],
   ['cap','После операции Мередит видит: перчатка прорвана ногтем. Вдруг она повредила сердце?',null]],'heart'],
 [0,'Коридор · вечеринка?','hall',[['izz',720,Y,LEAD],['cri',1100,Y,LEAD],['geo',420,Y,LEAD*.95]],
  [['izz','Сегодня вечеринка! Приехал Хэнк — хочу познакомить его с вами.','e5izz1'],['cri','Ты позвала педиатров. И психиатров. Вечеринка мертва.','e5cri1'],
   ['geo','А Мередит ты вообще спросила? Это её дом.','e5geo1'],['izz','Спрошу! Потом.','e5izz2']]],
 [0,'Палата миссис Дрейк','room',[['drk',1150,Y,.8,{lying:true}],['geo',640,Y,LEAD]],
  [['drk','Все думали, я курю. А я бросила пять лет назад! Никто не верил, что мне больно.','e5drk1','angry'],['geo','Я вам верю. И ваши снимки тоже.','e5geo2']]],
 [0,'Палата Джерри Фроста','room',[['fro',1150,Y,.8,{lying:true}],['der',640,Y,LEAD],['alx',380,Y,LEAD*.95]],
  [['fro','Как будто тысяча самураев втыкают мечи мне в спину!','e5fro1','shock'],['alx','Наркоман. Просит только самые сильные обезболивающие.','e5alx1'],
   ['der','Может быть. Но боль у него настоящая. Ставь катетер, Карев. Без комментариев.','e5der1','angry']]],
 [0,'Операция · миссис Дрейк','or',[['drk',CX,Y,.7,{lying:true,eyesShut:1}],['web',CX+360,Y,LEAD*1.05,{mask:1,cap:'#1f3048'}],['bai',CX-360,Y,LEAD,{mask:1,cap:'#c07bff'}],['geo',1560,Y,SM]],
  [['web','Так… а это ещё что такое? Полотенце?!','e5web1','shock'],['bai','Хирургическое полотенце. Осталось с операции пятилетней давности.','e5bai1'],
   ['geo','Вот почему ей было больно! Ей просто никто не верил.','e5geo3']],'towel'],
 [0,'Архив больницы','office',[['cri',640,Y,LEAD],['bai',1000,Y,LEAD]],
  [['cri','Нашла. Хирург — Дэвис. А ассистировал… доктор Бёрк.','e5cri2'],['bai','Держи это при себе, Янг. Пока мы не разберёмся.','e5bai2']],'files'],
 [0,'Палата миссис Паттерсон','room',[['pmp',1150,Y,.8,{lying:true,eyesShut:1}],['mer',640,Y,LEAD],['pmh',380,Y,LEAD],['bur',1700,Y,LEAD]],
  [['cap','У миссис Паттерсон открылось кровотечение',null],['mer','Доктор Бёрк… В операционной у меня прорвалась перчатка. Это могла быть я.','e5mer3','sad'],
   ['pmh','Что?! Вы повредили сердце моей жене?!','e5pmh1','angry'],['bur','В операционную. Быстро!','e5bur3','angry']],'bleed'],
 [0,'Повторная операция','or',[['pmp',CX,Y,.7,{lying:true,eyesShut:1}],['bur',CX-360,Y,LEAD,{mask:1,cap:'#1f3048'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['bur','Смотрите, Грей. Разрыв стенки. Он намного больше ногтя.','e5bur4'],['mer','Значит… это не я?','e5mer4','shock'],
   ['bur','Стенки сердца были слабыми. Но молчать вы не имели права.','e5bur5']],'wall'],
 [0,'Кабинет шефа','office',[['web',1000,Y,LEAD*1.05],['mer',640,Y,LEAD],['bur',360,Y,LEAD]],
  [['web','Муж подаёт жалобу. Завтра — к юристам. Оба.','e5web2','angry'],['bur','Это не ошибка Грей. Стенка была слабой.','e5bur6'],
   ['web','Надеюсь. Сначала полотенца, теперь дырки в сердцах…','e5web3']]],
 [0,'Коридор · вечер','hall',[['izz',720,Y,LEAD],['der',1100,Y,LEAD*1.04]],
  [['der','Стивенс, операция на позвоночнике мистера Фроста. Хотите ассистировать?','e5der2'],['izz','Сейчас?! У меня же вечеринка… Хэнк… Да! Конечно, да!','e5izz3','shock']],'yes'],
 [0,'Дом Мередит · вечеринка','house',[['hnk',1250,Y,LEAD*1.08],['geo',900,Y,LEAD],['cri',560,Y,LEAD*.95],['alx',300,Y,LEAD*.95]],
  [['cap','Иззи на операции. Вечеринка в самом разгаре — без хозяйки',null],['hnk','Иззи опять выбрала больницу. Передайте ей… что я уехал.','e5hnk1','sad'],
   ['geo','Эй… Хэнк, подожди!','e5geo4']],'party'],
 [0,'У дома Мередит · ночь','night',[['mer',700,Y,LEAD],['der',980,Y,LEAD*1.04],['bai',-200,Y,LEAD]],
  [['der','Ты всё-таки пришла.','e5der3'],['mer','Это ничего не значит.','e5mer5'],['bai','Грей?! Шепард?! Я этого не видела. Я ничего не видела!','e5bai3','shock']],'car'],
 [0,'Дежурка','lounge',[['cri',760,Y,LEAD],['bur',1140,Y,LEAD]],
  [['bur','Янг. Утром был просто кофе. А это… уже не просто кофе.','e5bur7'],['cri','Доктор Бёрк…','e5cri3','shock']],'kiss'],
 [0,'Дом Мередит · утро','house',[['izz',700,Y,LEAD],['mer',1060,Y,LEAD],['geo',1360,Y,LEAD*.95]],
  [['izz','Хэнк уехал. Сказал, что у меня нет времени на жизнь.','e5izz4','sad'],['mer','Добро пожаловать в хирургию.','e5mer6'],
   ['mer','(за кадром) Работа или жизнь? Иногда кажется, что выбрать можно только одно.','e5mer7'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]]],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.liz={","P.pmp={n:'Миссис Паттерсон',s:'Паттерсон',r:'',skin:'#f0d0b8',hair:'#a07850',hs:'bob',cl:'#e8eef2',col:'#ff9fb0',gown:1};\n"
    "P.pmh={n:'Мистер Паттерсон',s:'Мистер Паттерсон',r:'',skin:'#e8c4a4',hair:'#888',hs:'short',cl:'#6a7a5a',col:'#c0b080'};\n"
    "P.drk={n:'Стефани Дрейк',s:'Миссис Дрейк',r:'пациентка, боль в груди 5 лет',skin:'#f0d6c4',hair:'#e0e0e0',hs:'curly',cl:'#e8eef2',col:'#ffd27f',gown:1};\n"
    "P.fro={n:'Джерри Фрост',s:'Фрост',r:'',skin:'#e0b896',hair:'#5a4a3a',hs:'buzz',cl:'#e8eef2',col:'#a0c0a0',gown:1};\n"
    "P.hnk={n:'Хэнк',s:'Хэнк',r:'парень Иззи, хоккеист',skin:'#f0c8a8',hair:'#c89a50',hs:'buzz',cl:'#2a4a8a',col:'#5aa0ff'};\nP.liz={")

EXTRA=r"""function heartShape(x,y,r,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y+r);g.bezierCurveTo(x-r*2.2,y-r*.5,x-r*1.2,y-r*2.2,x,y-r*1.1);g.bezierCurveTo(x+r*1.2,y-r*2.2,x+r*2.2,y-r*.5,x,y+r);g.fill()}
function extra(kind,u,t,s,lt){
  if(kind==='heart'||kind==='wall'){const beat=Math.pow(Math.max(0,Math.sin(t*5)),4);g.fillStyle='#2f6b8a';rr(CX-330,FL-300,660,120,24);g.fill();g.fillStyle='#e7f3f8';rr(CX-300,FL-290,600,24,12);g.fill();
    heartShape(CX+90,FL-330,26+beat*6,'#c0303a');glow(CX+90,FL-340,90,'hsla(350,90%,60%,A)',.3+beat*.3);
    if(kind==='wall'&&LN(s,'e5bur4',lt)>.3){g.strokeStyle='#ff0';g.lineWidth=5;g.beginPath();g.arc(CX+90,FL-340,56,0,TAU);g.stroke()}
    g.fillStyle='#fff';g.font='bold 30px system-ui';g.textAlign='center';g.fillText('Миссис Паттерсон · сердце',CX,FL-215)}
  if(kind==='towel'){g.fillStyle='#2f6b8a';rr(CX-330,FL-300,660,120,24);g.fill();g.fillStyle='#e7f3f8';rr(CX-300,FL-290,600,24,12);g.fill();g.fillStyle='#fff';g.font='bold 30px system-ui';g.textAlign='center';g.fillText('Стефани Дрейк · под наркозом',CX,FL-215)}
  if(kind==='files'){for(let i=0;i<6;i++){g.fillStyle=['#d8c08a','#c9d8e8','#e8d0c0'][i%3];g.save();g.translate(1240+i*20,FL-260-i*8);g.rotate(-.05+i*.02);g.fillRect(0,0,200,30);g.restore()}
    if(LN(s,'e5cri2',lt)>.5){g.fillStyle='#fffbe6';g.save();g.translate(CX-120,300);g.rotate(-.04);g.fillRect(-150,-90,300,180);g.fillStyle='#333';g.font='bold 22px system-ui';g.textAlign='center';g.fillText('ОПЕРАЦИЯ · 1999',0,-50);g.font='20px system-ui';g.fillText('Хирург: Дж. Дэвис',0,-10);g.fillStyle='#c00';g.font='bold 22px system-ui';g.fillText('Ассистент: П. Бёрк',0,30);g.restore()}}
  if(kind==='party'){g.fillStyle='rgba(20,10,40,.5)';g.fillRect(0,0,W,H);for(let i=0;i<6;i++){const a=t*1.5+i,x=CX+Math.cos(a)*700,y=500+Math.sin(a*1.3)*200;glow(x,y,260,`hsla(${(i*60+t*80)%360},100%,60%,A)`,.35)}
    g.fillStyle='#ccc';g.beginPath();g.arc(CX,120,40,0,TAU);g.fill();for(let i=0;i<14;i++){const a=i/14*TAU+t;g.fillStyle=`hsla(${i*25},100%,80%,.9)`;g.fillRect(CX+Math.cos(a)*30-3,120+Math.sin(a)*30-3,6,6)}
    for(let i=0;i<5;i++){npc(['nr1','nr2','nr3','nr1','nr2'][i],1500+i*90-(i%2)*400,FL-120,.45,t,{up:Math.sin(t*6+i)>0,jy:-Math.abs(Math.sin(t*6+i))*20,a:.7})}}
  if(kind==='car'){const x=1400;g.fillStyle='#3a4a6a';rr(x-260,FL-230,520,130,40);g.fill();rr(x-170,FL-320,330,110,40);g.fill();g.fillStyle='rgba(200,220,255,.35)';rr(x-150,FL-305,130,80,16);g.fill();rr(x-5,FL-305,140,80,16);g.fill();
    g.fillStyle='#111';g.beginPath();g.arc(x-160,FL-100,44,0,TAU);g.arc(x+160,FL-100,44,0,TAU);g.fill();g.fillStyle='#ffe9a0';g.fillRect(x+250,FL-200,14,24)}
  if(kind==='kiss'&&LN(s,'e5cri3',lt)>0){for(let i=0;i<6;i++){const st=(t*.6+i*.17)%1;heartShape(820+i*70,500-st*260,14+i%3*4,`rgba(255,80,130,${1-st})`)}}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='heart'){const b2=L('e5bur2');if(id==='mer'){const nod=b2.p<0&&L('e5bur1').p>.5;return {o:{reach:-1,eyesShut:nod,jy:nod?Math.max(0,Math.sin(t*2))*14:0,mood:b2.p>0?'shock':undefined}}}
    if(id==='bur')return {o:{reach:1,work:true,tool:true}}}
  if(k==='wall'){if(id==='bur')return {o:{reach:1,work:true,tool:true}};if(id==='mer')return {o:{reach:-1}}}
  if(k==='towel'){const w1=L('e5web1');if(id==='web'){const up=ease(seg(w1.p,0,.8));return {o:{reach:-1,work:up<1},fx:()=>{if(w1.p>0){const h=up*160;g.fillStyle='#f4f4f4';g.save();g.translate(CX+60,FL-300-h);g.rotate(Math.sin(t*3)*.08);rr(-40,0,80,h+20,6);g.fill();g.strokeStyle='#8bc';g.lineWidth=4;for(let i=0;i<3;i++){g.beginPath();g.moveTo(-40,12+i*14);g.lineTo(40,12+i*14);g.stroke()}g.fillStyle='rgba(160,60,40,.4)';g.fillRect(-40,h-10,80,30);g.restore()}}}}
    if(id==='bai')return {o:{reach:1,work:true}}}
  if(k==='bleed'){const m3=L('e5mer3');if(id==='pmh'&&L('e5pmh1').p>0)return {o:{reach:1,mood:'angry'}};if(id==='mer')return {o:{reach:1,work:true}};
    if(id==='bur'){const e=ease(seg(u,0,.2));return {x:lerp(W+200,1700,e),o:e<1?{walk:true,flip:true}:{}}}}
  if(k==='yes'&&id==='izz'){const i3=L('e5izz3');if(i3.p>.6)return {o:{up:1,jy:-Math.abs(Math.sin(t*9))*30}}}
  if(k==='party'){if(id==='hnk'){const h=L('e5hnk1');const e=ease(seg(h.p,1,1.8));return {x:lerp(1250,W+250,e),o:e>0&&e<1?{walk:true}:{mood:'sad'}}}
    if(id==='geo'){const g4=L('e5geo4');return {o:g4.p>0?{reach:1}:{up:Math.sin(t*6)>0,jy:-Math.abs(Math.sin(t*6))*20}}}
    return {o:{up:Math.sin(t*6+id.length)>0,jy:-Math.abs(Math.sin(t*6+id.length))*20}}}
  if(k==='car'){const b3=L('e5bai3');if(id==='bai'){const e=ease(seg(b3.p,-0.6,0));const back=ease(seg(b3.p,1,1.6));return {x:lerp(-200,300,e)-back*500,o:e<1&&e>0||back>0?{walk:true,flip:back>0}:{reach:1}}}
    if(id==='mer'||id==='der'){return {x:id==='mer'?730:950,o:{reach:id==='mer'?1:-1},fx:id==='mer'&&b3.p<0?()=>heartShape(830,FL-560+Math.sin(t*4)*10,22,'#f36'):null}}}
  if(k==='kiss'){if(id==='bur'){const e=ease(seg(L('e5bur7').p,.6,1));return {x:lerp(1140,960,e),o:e>0?{reach:-1}:{}}}if(id==='cri'&&L('e5cri3').p>0)return {o:{reach:1}}}
  return null}
"""
e.between("function nailsOn(","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  {const z=LT('e5bur2').t;tone(m(50),z,.8,'sawtooth',.05)}
  {const z=LT('e5web1').t;tone(m(48),z+.2,1,'sawtooth',.05);tone(m(54),z+.2,1,'sawtooth',.04)}
  {const r=S.find(s=>s[5]==='bleed');for(let k=0;k<r[0]*5;k++)tone(1400,r.t0+k/5,.08,'square',.02)}
  {const r=S.find(s=>s[5]==='party');for(let b=0;b<r[0]*4;b++){const z=r.t0+b/4;tone(55,z,.2,'sine',.25,.005);if(b%2)noise(z,.06,6000,.08,'highpass');if(b%4===2)noise(z,.12,1500,.12,'bandpass')}}
  {const z=LT('e5bai3').t;tone(m(76),z,.3,'square',.04);tone(m(70),z+.3,.4,'square',.04)}
  {const z=LT('e5cri3').t;for(let k=0;k<5;k++)tone(m(69+[0,4,7,12,16][k]),z+k*.12,1.4,'sine',.045)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys5.html')
gallery('greys5','greys5.html','Анатомия страсти · 1×05','🎉','linear-gradient(#3a0b3a,#10203a)',
  'Пятая серия «Зажигай!»: сердце в руках Мередит и порванная перчатка, полотенце внутри пациентки, вечеринка у Мередит без Иззи и Бейли, которая «ничего не видела».',
  ['~4,5 мин · 16:9','серия 5','субтитры с именами'],'greys4')
