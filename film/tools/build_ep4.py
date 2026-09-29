# Серия 1×04 «Ничья земля» (No Man's Land). Собирается из greys3.html.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys3.html')
e.R('<title>Анатомия страсти · 1×03','<title>Анатомия страсти · 1×04')
e.R('сезон 1 · серия 3 · «Выиграть битву, проиграть войну»','сезон 1 · серия 4 · «Ничья земля»')
e.R("g.fillText('Сезон 1 · Серия 3',CX,740);g.font='italic 56px Georgia';g.fillText('«Выиграть битву, проиграть войну»',CX,820)",
    "g.fillText('Сезон 1 · Серия 4',CX,740);g.font='italic 60px Georgia';g.fillText('«Ничья земля»',CX,820)")
e.R("'anatomiya-strasti-1x03.webm'","'anatomiya-strasti-1x04.webm'")
e.R("'bur','vip'];","'bur','liz'];")
# монитор: у Лиз ровная линия в конце
e.R("||s[5]==='crash'&&LN(s,'e3izz4',lt)>.7","||s[5]==='crash'&&LN(s,'e3izz4',lt)>.7||s[5]==='liz'&&LN(s,'e4cri5',lt)>.8")

S=r"""const S=[
 [7,'','title',[],[]],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом Мередит · утро','house',[['geo',560,Y,LEAD],['izz',940,Y,LEAD],['mer',1250,Y,LEAD]],
  [['geo','Иззи! Ты ходишь по дому в белье! У нас что, совсем нет границ?','e4geo1','shock'],['izz','Джордж, расслабься. Ты нам как сестрёнка.','e4izz1'],
   ['mer','Да, Джордж. Ты наша сестрёнка.','e4mer1'],['geo','Я. Не. Сестрёнка!','e4geo2','angry']],'sister'],
 [0,'Коридор · утро','hall',[['mer',720,Y,LEAD],['der',1100,Y,LEAD*1.04]],
  [['der','Позавтракаем? Всего лишь блинчики. Ничего такого.','e4der1'],['mer','Нет. Никаких блинчиков.','e4mer2'],['der','Я не сдамся, доктор Грей.','e4der2']]],
 [0,'Палата · Лиз Фэллон','room',[['liz',1150,Y,.8,{lying:true}],['cri',640,Y,LEAD],['bur',380,Y,LEAD]],
  [['bur','Янг. Лиз Фэллон тридцать лет была операционной сестрой. Её здесь уважают все.','e4bur1'],
   ['liz','Взяла мою карту, чтобы понравиться Бёрку? Я таких насквозь вижу.','e4liz1'],['cri','Ну… да.','e4cri1'],['liz','Честно. Мне это нравится.','e4liz2']]],
 [0,'Приёмный покой · гвозди','room',[['jor',1150,Y,.8,{lying:true}],['der',640,Y,LEAD],['mer',380,Y,SM*1.1],['alx',1680,Y,SM*1.1]],
  [['alx','Упал с лестницы с гвоздезабивным пистолетом. Шестнадцать гвоздей в голове!','e4alx1','shock'],
   ['der','И он в сознании. Невероятно. Но ему становится хуже.','e4der3'],['jor','Доктор… я ещё увижу жену?','e4jor1','sad']],'nails'],
 [0,'Палата мистера Хамфри','room',[['hum',1150,Y,.8,{lying:true}],['izz',640,Y,LEAD],['bai',380,Y,LEAD]],
  [['hum','Нет-нет. Только не она. Пусть придёт другой врач.','e4hum1'],['izz','Но… я ваш доктор.','e4izz2','sad'],['bai','Стивенс, выйди. Я разберусь.','e4bai1']]],
 [0,'Раздевалка интернов','lounge',[['alx',700,Y,LEAD],['izz',1150,Y,LEAD]],
  [['cap','Кто-то нашёл старую фотосессию Иззи — и обклеил ею всю раздевалку',null],['alx','Доктор Модель! Отличные фото, кстати.','e4alx2'],
   ['izz','Смейся сколько хочешь. Я окончила медшколу без единого долга. А ты — нет.','e4izz3','angry'],['alx','Ну… э-э…','e4alx3','shock']],'posters'],
 [0,'Дом престарелых','room',[['mer',780,Y,LEAD],['ell',1160,Y,LEAD]],
  [['ell','Лиз Фэллон! Лучшая сестра, что у меня была. Руки — как у хирурга.','e4ell1'],['mer','Мама, а меня ты помнишь? Я Мередит.','e4mer3','sad'],
   ['ell','Вы новенькая медсестра?','e4ell2'],['cap','Эллис помнит свою медсестру — но не помнит собственную дочь',null]]],
 [0,'Коридор · правда о Лиз','hall',[['cri',720,Y,LEAD],['bur',1100,Y,LEAD]],
  [['cri','Зачем все эти анализы? Они же ничего не меняют.','e4cri2','angry'],
   ['bur','Потому что Лиз умирает, Янг. Она пришла сюда, чтобы уйти там, где проработала всю жизнь.','e4bur2','sad'],['cri','…Я не знала.','e4cri3','sad']]],
 [0,'Палата Лиз · вечер','room',[['liz',1150,Y,.8,{lying:true}],['mer',640,Y,LEAD],['cri',380,Y,LEAD*.95]],
  [['liz','Твоя мама была великим хирургом. И упрямой — как ты.','e4liz3'],['mer','Расскажите мне о ней. Пожалуйста.','e4mer4'],
   ['liz','Кристина, тебя кто-нибудь ждёт дома? Хоть кошка?','e4liz4'],['cri','Никого.','e4cri5','sad'],
   ['cap','Лиз подписала отказ от реанимации. Она ушла тихо — в своей больнице',null]],'liz'],
 [0,'Палата · жена Хорхе','room',[['zon',1150,Y,LEAD*.95],['mer',780,Y,LEAD],['der',420,Y,LEAD]],
  [['zon','Операция опасная. Но я хочу ещё время с ним. Даже если придётся за ним ухаживать.','e4zon1','sad'],
   ['mer','А может, пять хороших лет лучше, чем десять плохих?','e4mer5'],['der','Грей. Это их решение. Не твоё.','e4der4','angry']]],
 [0,'Операция · шестнадцать гвоздей','or',[['jor',CX,Y,.7,{lying:true,eyesShut:1}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}],['alx',1560,Y,SM]],
  [['der','Пинцет. Первый гвоздь пошёл.','e4der5'],['mer','Давление стабильное.','e4mer6'],['der','Шестнадцатый. Последний.','e4der6'],['der','Хорхе увидит свою жену.','e4der7']],'nailop'],
 [0,'У операционной','hall',[['izz',640,Y,LEAD],['vic',1000,Y,LEAD*1.04],['bai',1340,Y,LEAD]],
  [['izz','Доктор Виктор, у мистера Хамфри можно сохранить нервы. Пожалуйста, не трогайте их.','e4izz4'],
   ['vic','Интерн будет учить меня оперировать?','e4vic1','angry'],['bai','Интерн права, Гарри. Сохрани нервы.','e4bai2']]],
 [0,'Дом Мередит · вечер','house',[['geo',560,Y,LEAD],['izz',940,Y,LEAD],['mer',1250,Y,LEAD]],
  [['izz','Джордж, ты купил то, что я просила? Ну, женское.','e4izz5'],['geo','Мужчины такое не покупают!','e4geo3','angry'],
   ['mer','Джордж…','e4mer7'],['geo','Ладно! Я сестрёнка. Завтра куплю.','e4geo4','sad'],
   ['mer','(за кадром) Между работой и домом — ничья земля. И все мы на ней живём.','e4mer8'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]],'sister2'],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.vip={","P.liz={n:'Лиз Фэллон',s:'Лиз',r:'операционная сестра, 30 лет стажа',skin:'#f0d0b8',hair:'#bfbfbf',hs:'bob',cl:'#e8eef2',col:'#7fe0c0',gown:1};\n"
    "P.jor={n:'Хорхе Круз',s:'Хорхе',r:'',skin:'#c9936a',hair:'#1a120c',hs:'short',cl:'#e8eef2',col:'#ffb347',gown:1};\n"
    "P.zon={n:'Зона Круз',s:'Зона',r:'',skin:'#c48a60',hair:'#241610',hs:'long',cl:'#b85a7a',col:'#ff7fbf'};\n"
    "P.hum={n:'Мистер Хамфри',s:'Хамфри',r:'',skin:'#ecc6a6',hair:'#8a7a6a',hs:'short',cl:'#e8eef2',col:'#c0c0ff',gown:1};\n"
    "P.vic={n:'Доктор Гарри Виктор',s:'Виктор',r:'',skin:'#e9c7a8',hair:'#9a8a7a',hs:'bald',cl:'#2a3a50',col:'#d0a060',coat:1};\nP.vip={")

EXTRA=r"""function extra(kind,u,t,s,lt){
  if(kind==='nails'){g.fillStyle='#111';rr(1420,110,420,360,14);g.fill();g.fillStyle='#ddd';g.beginPath();g.ellipse(1630,290,140,160,0,0,TAU);g.fill();g.fillStyle='#999';g.beginPath();g.ellipse(1630,290,118,138,0,0,TAU);g.fill();
    g.strokeStyle='#fff';g.lineWidth=5;for(let i=0;i<16;i++){const a=-2.6+i*.33,r0=150,r1=95;g.beginPath();g.moveTo(1630+Math.cos(a)*r0,290+Math.sin(a)*r0*1.1);g.lineTo(1630+Math.cos(a)*r1,290+Math.sin(a)*r1*1.1);g.stroke()}
    g.fillStyle='#fff';g.font='bold 24px system-ui';g.textAlign='center';g.fillText('РЕНТГЕН · 16 гвоздей',1630,500)}
  if(kind==='posters'){const k=ease(seg(u,0,.1));for(let i=0;i<7;i++){g.save();g.translate(200+i*250,300+(i%2)*90);g.rotate((i%3-1)*.08);g.scale(k,k);g.fillStyle='#fff';g.fillRect(-80,-105,160,210);
    g.fillStyle=['#f6c1d0','#c9e4ff','#ffe3a8'][i%3];g.fillRect(-70,-95,140,160);g.fillStyle='#f0cd6a';g.beginPath();g.arc(0,-40,34,0,TAU);g.fill();g.fillStyle='#f6d6be';g.beginPath();g.arc(0,-30,26,0,TAU);g.fill();
    g.fillStyle='#e05a8a';rr(-30,-2,60,60,20);g.fill();g.fillStyle='#333';g.font='bold 18px system-ui';g.textAlign='center';g.fillText('ДОКТОР МОДЕЛЬ',0,90);g.restore()}}
  if(kind==='liz'&&LN(s,'e4cri5',lt)>.8){g.fillStyle='#07100c';rr(1630,310,180,100,6);g.fill();g.strokeStyle='#f55';g.lineWidth=3;g.beginPath();g.moveTo(1640,380);g.lineTo(1800,380);g.stroke();
    g.fillStyle='#1b2226';g.fillRect(1624,412,176,26);g.fillStyle='#f55';g.font='bold 22px monospace';g.textAlign='left';g.fillText('♥ 0',1634,432)}
  if(kind==='nailop'){g.fillStyle='#2f6b8a';rr(CX-330,FL-300,660,120,24);g.fill();g.fillStyle='#e7f3f8';rr(CX-300,FL-290,600,24,12);g.fill();
    const a=LNx(s,'e4der5',lt),b=LNx(s,'e4der6',lt);const done=clamp((lt-a.t0)/(b.t0+b.d*.5-a.t0));const left=Math.round(16*(1-done));
    g.fillStyle='#fff';g.font='bold 30px system-ui';g.textAlign='center';g.fillText('Хорхе Круз · гвоздей осталось: '+left,CX,FL-215);
    g.fillStyle='#d9e0e4';rr(1170,FL-262,170,18,4);g.fill();g.fillStyle='#9aa4ad';for(let i=0;i<16-left;i++){g.save();g.translate(1185+(i%8)*19,FL-272-Math.floor(i/8)*10);g.rotate(1.3);g.fillRect(-2,-12,4,24);g.restore()}
    if(left===0&&b.p>.5){g.globalAlpha=.9;g.fillStyle='#8f8';g.font='bold 80px system-ui';g.fillText('✓',CX,FL-420);g.globalAlpha=1}}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA)

ANIM=r"""function nailsOn(x,n,s){// гвозди в голове лежащего пациента (голова слева на кровати)
  const hx=x-376*s/.8,hy=FL-175;g.strokeStyle='#8a939b';g.lineWidth=5;for(let i=0;i<n;i++){const a=-2.8+i*.22;g.beginPath();g.moveTo(hx+Math.cos(a)*38*s/.8,hy+Math.sin(a)*38);g.lineTo(hx+Math.cos(a)*62*s/.8,hy+Math.sin(a)*62);g.stroke()}}
function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='sister'){if(id==='geo'){const g2=L('e4geo2');return {o:g2.p>0&&g2.p<1.2?{up:1,jy:-Math.abs(Math.sin(t*10))*18}:{}}}
    if(id==='izz'){const e=ease(seg(u,0,.18));return {x:lerp(W+200,940,e),o:e<1?{walk:true,flip:true}:{}}}}
  if(k==='nails'&&id==='jor')return {o:{eyesShut:L('e4jor1').p<0},fx:()=>nailsOn(1150,16,.8)};
  if(k==='nails'&&id==='der')return {o:L('e4der3').p>0&&L('e4der3').p<1?{reach:1}:{}};
  if(k==='posters'&&id==='alx'){const a3=L('e4alx3');const e=ease(seg(a3.p,.3,1.3));return {x:lerp(700,-200,e),o:e>0&&e<1?{walk:true,flip:true}:{}}}
  if(k==='posters'&&id==='izz'){const i3=L('e4izz3');return {o:i3.p>0&&i3.p<1?{reach:-1}:{}}}
  if(k==='liz'){if(id==='liz')return {o:{eyesShut:L('e4cri5').p>.8}};if(id==='mer'&&L('e4mer4').p>0)return {o:{reach:1}}}
  if(k==='nailop'){const a=L('e4der5'),b=L('e4der6');const done=clamp((lt-a.t0)/(b.t0+b.d*.5-a.t0));
    if(id==='jor')return {fx:()=>nailsOn(CX,Math.round(16*(1-done)),.7)};
    if(id==='der')return {o:{reach:1,work:done<1,tool:true}};if(id==='mer')return {o:{reach:-1,work:true}}}
  if(k==='sister2'){const g4=L('e4geo4');if(id==='geo'){const e=ease(seg(g4.p,1,1.8));return {x:lerp(560,-200,e),o:e>0&&e<1?{walk:true,flip:true}:{}}}}
  return null}
"""
e.between("function nailsOn(" if "function nailsOn(" in e.s else "function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  {const z=LT('e4alx1').t;tone(m(50),z,1,'sawtooth',.05);tone(m(56),z,1,'sawtooth',.04)}
  {const z=LT('e4cri5');tone(1400,z.t+z.d*.8,4,'sine',.04)}
  {const a=LT('e4der5'),b=LT('e4der6');for(let k=0;k<16;k++)tone(1900,a.t+(b.t+b.d*.5-a.t)*k/16,.05,'triangle',.04)}
  {const z=LT('e4der7').t;for(let k=0;k<5;k++)tone(m(72+[0,4,7,12,16][k]),z+k*.08,1.2,'sine',.05)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys4.html')
gallery('greys4','greys4.html','Анатомия страсти · 1×04','🔩','linear-gradient(#3a2a0b,#10203a)',
  'Четвёртая серия «Ничья земля»: шестнадцать гвоздей в голове, старая медсестра Лиз Фэллон, фото «Доктора Модели» и Джордж-«сестрёнка».',
  ['~4,5 мин · 16:9','серия 4','субтитры с именами'],'greys3')
