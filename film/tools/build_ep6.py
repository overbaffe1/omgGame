# Серия 1×06 «Если завтра не наступит» (If Tomorrow Never Comes). Собирается из greys5.html.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys5.html')
e.R('<title>Анатомия страсти · 1×05','<title>Анатомия страсти · 1×06')
e.R('сезон 1 · серия 5 · «Зажигай!»','сезон 1 · серия 6 · «Если завтра не наступит»')
e.R("g.fillText('Сезон 1 · Серия 5',CX,740);g.font='italic 60px Georgia';g.fillText('«Зажигай!»',CX,820)",
    "g.fillText('Сезон 1 · Серия 6',CX,740);g.font='italic 56px Georgia';g.fillText('«Если завтра не наступит»',CX,820)")
e.R("'anatomiya-strasti-1x05.webm'","'anatomiya-strasti-1x06.webm'")
e.R("'bur','drk'];","'bur','edw'];")
e.R("||s[5]==='bleed'","||s[5]==='jimmy'&&LN(s,'e6izz4',lt)<.3")

S=r"""const S=[
 [7,'','title',[],[]],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Дом Мередит · дождливое утро','house',[['geo',700,Y,LEAD],['izz',1100,Y,LEAD]],
  [['geo','Мередит, я принёс кофе!.. Ай! Горячо!','e6geo1','shock'],['izz','Джордж. Ты влюблён в Мередит.','e6izz1'],['geo','Что? Нет! Совсем нет!','e6geo2','shock']],'coffee'],
 [0,'Парковка · дождь','lot',[['mer',700,Y,LEAD],['der',1000,Y,LEAD*1.04]],
  [['der','Ты меня избегаешь.','e6der1'],['mer','Да. Я сплю с начальником, и Бейли со мной не разговаривает.','e6mer1','sad'],
   ['der','Хочешь, чтобы я просто ушёл?','e6der2'],['mer','Да. Нет. Я опаздываю!','e6mer2','shock']],'rain'],
 [0,'Палата Энни Коннорс','room',[['ann',1150,Y,.8,{lying:true}],['bai',380,Y,LEAD],['alx',640,Y,LEAD]],
  [['bai','Держите лица. Никаких отвисших челюстей.','e6bai1'],['ann','Не смотрите так. Я знаю, как выгляжу.','e6ann1','sad'],
   ['alx','Не волнуйтесь, Энни. Я буду рядом всю дорогу.','e6alx1']],'tumor'],
 [0,'Кабинет томографии','office',[['alx',640,Y,LEAD],['cri',1000,Y,LEAD]],
  [['alx','Как можно довести себя до такого? Не понимаю, как она с этим живёт.','e6alx2'],['cri','Карев… Микрофон включён.','e6cri1','shock'],['alx','…Чёрт.','e6alx3','shock']],'mic'],
 [0,'Палата Эдварда','room',[['edw',1150,Y,LEAD],['mar',1450,Y,LEAD*.95],['mer',700,Y,LEAD]],
  [['cap','У Эдварда болезнь Паркинсона. Он отказывается от операции на мозге',null],['edw','Не надо резать мне голову. Даже с Паркинсоном я буду на твоей свадьбе.','e6edw1','angry'],
   ['mar','Папа, я просто хочу, чтобы ты снова ходил…','e6mar1','sad'],['mer','Это ваша жизнь. Но и её тоже. Просто попробуйте.','e6mer3'],['edw','…Ладно. Попробую.','e6edw2']],'tremor'],
 [0,'Лифт','elev',[['bai',780,Y,LEAD],['der',1140,Y,LEAD*1.04]],
  [['bai','Вы выделяете Грей. Ещё раз — и она месяц не увидит операционную.','e6bai2','angry'],['der','Бейли, я вообще-то ваш начальник.','e6der3'],['bai','А я не боюсь.','e6bai3']]],
 [0,'Палата Энни · перед операцией','room',[['ann',1150,Y,.8,{lying:true}],['bur',640,Y,LEAD],['alx',380,Y,LEAD]],
  [['ann','Доктор Бёрк… Пусть доктор Карев не участвует в операции.','e6ann2'],['bur','Карев. Ты не моешься.','e6bur1','angry'],['alx','…Понял.','e6alx4','sad']],'tumor'],
 [0,'Раздевалка интернов','lounge',[['alx',760,Y,LEAD]],
  [['alx','Ну и ладно. Кто со мной на кофе?','e6alx5'],['cap','Алекс забыл поменять батарейку в пейджере. Он молчит весь день',null]],'pager'],
 [0,'Операция Эдварда · он в сознании','or',[['edw',CX,Y,.7,{lying:true}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['der','Эдвард, не спите. Вводим электрод.','e6der4'],['edw','Руки… Они не дрожат! Смотрите!','e6edw3','shock'],['mer','Получилось!','e6mer4']],'dbs'],
 [0,'Палата Джимми Харпера','room',[['jim',1150,Y,.8,{lying:true,eyesShut:1}],['izz',640,Y,LEAD]],
  [['cap','У Джимми тромб в сердце. Пейджер Алекса молчит',null],['izz','Карев! Бёрк! Кто-нибудь!.. Никто не отвечает.','e6izz2','shock'],
   ['izz','Ладно. Я сама.','e6izz3'],['izz','Давай… давай… Есть пульс!','e6izz4']],'jimmy'],
 [0,'Операция Энни','or',[['ann',CX,Y,.7,{lying:true,eyesShut:1}],['bur',CX-360,Y,LEAD,{mask:1,cap:'#1f3048'}],['bai',CX+360,Y,LEAD,{mask:1,cap:'#c07bff'}],['geo',1560,Y,SM],['alx',-250,Y,SM]],
  [['bai','Нужна кровь, первая отрицательная! Срочно!','e6bai4'],['bur','Сосуд лопнул… Давление падает.','e6bur2','shock'],
   ['bur','Время смерти — девятнадцать ноль две.','e6bur3','sad'],['cap','Алекс прибегает с кровью. Слишком поздно',null]],'annie'],
 [0,'Раздевалка · вечер','lounge',[['izz',760,Y,LEAD],['alx',1140,Y,LEAD]],
  [['izz','Я пейджила тебе пятьдесят раз!','e6izz5','angry'],['alx','Батарейка… села.','e6alx6','sad'],['izz','Ты ужасный человек, Карев!','e6izz6','angry']],'stomp'],
 [0,'Дом Мередит · ночь','house',[['geo',900,Y,LEAD]],
  [['geo','Мередит, я хотел сказать… Мередит?','e6geo3'],['cap','Комната пуста',null],['geo','Слишком долго ждал.','e6geo4','sad']],'beers'],
 [0,'У машины · дождь','night',[['mer',760,Y,LEAD],['der',1000,Y,LEAD*1.04]],
  [['der','Поехали?','e6der5'],['mer','Поехали.','e6mer5'],
   ['mer','(за кадром) Мы откладываем самое важное на завтра. Но завтра может не наступить.','e6mer6'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]],'rainend'],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.pmp={","P.ann={n:'Энни Коннорс',s:'Энни',r:'',skin:'#f0cfb4',hair:'#6a4a2a',hs:'long',cl:'#e8eef2',col:'#ffa0c8',gown:1};\n"
    "P.edw={n:'Эдвард Левенджи',s:'Эдвард',r:'пациент, болезнь Паркинсона',skin:'#ecc8aa',hair:'#bdbdbd',hs:'short',cl:'#6a5a4a',col:'#80d0ff'};\n"
    "P.mar={n:'Мэри, дочь Эдварда',s:'Мэри',r:'',skin:'#f2d2b8',hair:'#b07a3a',hs:'long',cl:'#8a6ab0',col:'#c9a0ff'};\n"
    "P.jim={n:'Джимми Харпер',s:'Джимми',r:'',skin:'#e6be9c',hair:'#4a3a2a',hs:'short',cl:'#e8eef2',col:'#90e090',gown:1};\nP.pmp={")

EXTRA=r"""function rain(t,a=.35){g.strokeStyle=`rgba(200,220,255,${a})`;g.lineWidth=2;for(let i=0;i<140;i++){const x=(i*137+t*120)%(W+200)-100,y=((i*71+t*900)%(H+100))-100;g.beginPath();g.moveTo(x,y);g.lineTo(x-10,y+34);g.stroke()}}
function tumorOn(x,s){g.fillStyle='#d9e3ea';g.beginPath();g.ellipse(x+30*s/.8,FL-205,190*s/.8,95*s/.8,0,Math.PI,TAU);g.fill();g.fillStyle='rgba(0,0,0,.08)';g.beginPath();g.ellipse(x+60*s/.8,FL-215,120*s/.8,50*s/.8,0,Math.PI,TAU);g.fill()}
function extra(kind,u,t,s,lt){
  if(kind==='rain'){g.fillStyle='rgba(40,60,90,.25)';g.fillRect(0,0,W,H);rain(t)}
  if(kind==='mic'){g.fillStyle='#1b2226';rr(1260,FL-420,420,300,14);g.fill();g.fillStyle='#9fc8d8';rr(1280,FL-400,380,200,8);g.fill();g.fillStyle='#e8eef2';g.beginPath();g.ellipse(1470,FL-280,90,40,0,0,TAU);g.fill();
    const on=LN(s,'e6alx2',lt)>0;g.fillStyle=on?`rgba(255,40,40,${.6+.4*Math.sin(t*8)})`:'#444';g.beginPath();g.arc(1300,FL-160,14,0,TAU);g.fill();g.fillStyle='#fff';g.font='bold 22px system-ui';g.textAlign='left';g.fillText('МИКРОФОН ВКЛ',1324,FL-152)}
  if(kind==='pager'){g.fillStyle='#222';rr(1300,380,160,100,14);g.fill();g.fillStyle='#394';rr(1316,396,128,50,6);g.fill();g.fillStyle='#111';g.font='bold 26px monospace';g.textAlign='center';g.fillText('- - -',1380,430);
    g.strokeStyle='#f44';g.lineWidth=4;rr(1340,454,70,18,4);g.stroke();g.fillStyle='#f44';g.fillRect(1344,458,8*Math.max(0,Math.sin(t*2)),10);g.fillText('',0,0)}
  if(kind==='jimmy'){const p=LN(s,'e6izz3',lt);if(p>.5){const q=LN(s,'e6izz4',lt);glow(1000,FL-210,120,q>.3?'hsla(120,80%,60%,A)':'hsla(0,90%,55%,A)',.5)}}
  if(kind==='annie'){g.fillStyle='#2f6b8a';rr(CX-330,FL-300,660,120,24);g.fill();g.fillStyle='#e7f3f8';rr(CX-300,FL-290,600,24,12);g.fill();g.fillStyle='#fff';g.font='bold 30px system-ui';g.textAlign='center';g.fillText('Энни Коннорс · удаление опухоли',CX,FL-188);
    if(LN(s,'e6bur3',lt)>0){g.fillStyle='#0c1c1c';rr(1560,200,300,190,10);g.fill();g.strokeStyle='#f55';g.lineWidth=5;g.beginPath();g.moveTo(1575,300);g.lineTo(1845,300);g.stroke()}}
  if(kind==='stomp'){const i6=LNx(s,'e6izz6',lt);if(i6.p>.3){const x=880,y=FL+10;g.fillStyle='#222';rr(x-50,y-20,100,34,8);g.fill();g.strokeStyle='#ddd';g.lineWidth=3;g.beginPath();g.moveTo(x-30,y-18);g.lineTo(x-5,y);g.lineTo(x+10,y-16);g.lineTo(x+35,y+10);g.stroke();
    for(let i=0;i<6;i++){g.fillStyle='#333';g.fillRect(x-60+i*24,y+14+Math.sin(i)*6,8,6)}}}
  if(kind==='beers'){g.fillStyle='rgba(10,15,40,.5)';g.fillRect(0,0,W,H)}
  if(kind==='rainend'){rain(t,.4);const x=1450;g.fillStyle='#3a4a6a';rr(x-260,FL-230,520,130,40);g.fill();rr(x-170,FL-320,330,110,40);g.fill();g.fillStyle='rgba(200,220,255,.35)';rr(x-150,FL-305,130,80,16);g.fill();rr(x-5,FL-305,140,80,16);g.fill();
    g.fillStyle='#111';g.beginPath();g.arc(x-160,FL-100,44,0,TAU);g.arc(x+160,FL-100,44,0,TAU);g.fill();g.fillStyle='#ffe9a0';g.fillRect(x+250,FL-200,14,24)}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='coffee'&&id==='geo'){const g1=L('e6geo1');const sp=g1.p>.4;return {o:{reach:1,jx:sp&&g1.p<1?Math.sin(t*30)*4:0},fx:()=>{g.fillStyle='#fff';rr(740,FL-250,34,40,5);g.fill();if(sp){g.fillStyle='rgba(110,60,20,.8)';for(let i=0;i<8;i++){const q=Math.min(1,(g1.p-.4)*2);g.beginPath();g.arc(760+i*6,FL-200+q*180+i*4,6,0,TAU);g.fill()}g.beginPath();g.ellipse(770,FL+6,60,10,0,0,TAU);g.fill()}}}}
  if(k==='tumor'&&id==='ann')return {fx:()=>tumorOn(1150,.8)};
  if(k==='mic'&&id==='alx'&&L('e6alx3').p>0)return {o:{mood:'shock'}};
  if(k==='tremor'&&id==='edw')return {o:{jx:Math.sin(t*40)*3,flip:true}};
  if(k==='dbs'){const d4=L('e6der4'),e3=L('e6edw3');if(id==='edw')return {o:{jx:e3.p<0?Math.sin(t*40)*4:0,jy:e3.p>0?-Math.abs(Math.sin(t*10))*10:0}};
    if(id==='der')return {o:{reach:1,work:e3.p<0,tool:true}};if(id==='mer')return {o:{reach:-1,up:L('e6mer4').p>0}}}
  if(k==='jimmy'){const i3=L('e6izz3');if(id==='izz'){const go=ease(seg(i3.p,0,.6));return {x:lerp(640,780,go),o:i3.p>.3?{reach:1,work:L('e6izz4').p<.3}:(L('e6izz2').p>0?{up:1}:{})}}
    if(id==='jim'){const q=L('e6izz4');return {o:{jy:q.p>.3&&q.p<.6?-20:0}}}}
  if(k==='annie'){const b3=L('e6bur3');if(id==='bur')return {o:b3.p>0?{}:{reach:1,work:true,tool:true}};if(id==='bai')return {o:b3.p>0?{}:{reach:-1,work:true}};
    if(id==='ann')return {fx:()=>tumorOn(CX,.7)};
    if(id==='alx'){const e=ease(seg(b3.p,1,1.8));return {x:lerp(-250,380,e),o:e>0&&e<1?{walk:true}:{mood:'sad'},fx:()=>cooler(lerp(-250,380,e)+50,FL-190,SM*1.3,'КРОВЬ')}}}
  if(k==='stomp'&&id==='izz'){const i6=L('e6izz6');const st=i6.p>.2&&i6.p<.8;const e=ease(seg(i6.p,1,1.8));return {x:lerp(760,-200,e),o:st?{jy:-Math.abs(Math.sin(t*14))*30,mood:'angry'}:(e>0&&e<1?{walk:true,flip:true}:{})}}
  if(k==='beers'&&id==='geo'){const g4=L('e6geo4');return {o:{reach:1,mood:g4.p>0?'sad':undefined},fx:()=>{for(const dx of[0,22]){g.fillStyle='#6a3a10';rr(958+dx,FL-238,16,44,5);g.fill();g.fillRect(962+dx,FL-252,8,16)}}}}
  if(k==='rainend'){if(id==='der'){const e=ease(seg(L('e6mer5').p,1,2));return {x:lerp(1000,1250,e),o:e>0&&e<1?{walk:true}:{}}}if(id==='mer'){const e=ease(seg(L('e6mer5').p,1.2,2.2));return {x:lerp(760,1100,e),o:e>0&&e<1?{walk:true}:{}}}}
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.025);
  for(const r of S.filter(s=>['rain','rainend'].includes(s[5])))for(let k=0;k<r[0];k++)noise(r.t0+k,1.1,2500,.06,'lowpass');
  {const r=S.find(s=>s[2]==='elev');tone(1319,r.t0+.3,1,'sine',.06);tone(1047,r.t0+.6,1.2,'sine',.06)}
  {const z=LT('e6cri1').t;tone(m(50),z,.8,'sawtooth',.05)}
  {const z=LT('e6edw3').t;for(let k=0;k<5;k++)tone(m(72+[0,4,7,12,16][k]),z+k*.08,1.2,'sine',.05)}
  {const a=LT('e6izz2').t,b=LT('e6izz4');for(let k=0;k<(b.t+b.d*.3-a)*5;k++)tone(1400,a+k/5,.08,'square',.02);for(let k=0;k<5;k++)tone(988,b.t+b.d*.3+k*.8,.12,'sine',.04)}
  {const z=LT('e6bur3').t;tone(1400,z-.5,3.5,'sine',.04)}
  {const z=LT('e6izz6');for(let k=0;k<3;k++)noise(z.t+z.d*(.25+k*.18),.08,600,.4)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys6.html')
gallery('greys6','greys6.html','Анатомия страсти · 1×06','🌧️','linear-gradient(#0b2a3a,#10203a)',
  'Шестая серия «Если завтра не наступит»: огромная опухоль Энни, включённый микрофон, дрожащие руки Эдварда, Иззи одна спасает Джимми и растоптанный пейджер Алекса.',
  ['~4 мин · 16:9','серия 6','субтитры с именами'],'greys5')
