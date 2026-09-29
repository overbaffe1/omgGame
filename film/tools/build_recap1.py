# «Анатомия страсти» — лучшее из 1 сезона (серии 1–9) за ~4,5 минуты. Собирается из greys10.html.
# Реплики берутся из уже озвученных серий (те же mp3 — те же голоса), новые только вступление и финал Мередит (rc*).
# Улучшения: карточки глав с номером серии, шкала «серия 1…9» в углу во время просмотра, смешные подписи-комментарии.
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys10.html')
e.R('<title>Анатомия страсти · 2×01','<title>Анатомия страсти · Лучшее из 1 сезона')
e.R('сезон 2 · серия 1 · «Капли дождя»','лучшее из 1 сезона')
e.R("g.fillText('Сезон 2 · Серия 1',CX,740);g.font='italic 52px Georgia';g.fillText('«Капли дождя падают мне на голову»',CX,820)",
    "g.fillText('Весь 1 сезон за 5 минут',CX,740);g.font='italic 60px Georgia';g.fillText('«Самое главное и самое смешное»',CX,820)")
e.R("'anatomiya-strasti-2x01.webm'","'anatomiya-strasti-season1-recap.webm'")
e.R("['Сезон 2 · серия 1','']","['Лучшее из 1 сезона','']")
e.R("else if(s[2]==='credits')creditsCard(u,t);","else if(s[2]==='credits')creditsCard(u,t);else if(s[2]==='chap')chapCard(s,u,t);")
e.R("    if(cur){SUBP=","    recapHud(si);if(cur){SUBP=")
e.R("||s[5]==='standstill'&&LN(s,'s21bur2',lt)>0&&LN(s,'s21der4',lt)<.4","")

CH=[(1,'Первый день','Мередит спит с незнакомцем. Незнакомец оказывается её начальником'),
    (2,'Первый разрез','Главная улика дня — откушенная часть преступника'),
    (3,'Безумная велогонка','Курьер со спицами в боку очень спешит'),
    (4,'Сестрёнка','Джордж живёт с двумя девушками. Они считают его сестрой'),
    (5,'Зажигай!','Сердце в руках — это скользко'),
    (6,'Если завтра не наступит','Включённый микрофон и растоптанный пейджер'),
    (7,'Кнопка самоуничтожения','Утро, когда все узнали про Шепарда'),
    (8,'Спаси меня','Подливка, экстрасенс и трейлер в лесу'),
    (9,'Кто кого?','Сифилис, тайны — и жена')]
def ch(n):c=CH[n-1];return f" [2.8,'{c[1]}','chap',[],[],{n},'{c[2]}'],\n"
S="const S=[\n [7,'','title',[],[]],\n"
S+=r""" [0,'Дом Мередит','house',[['mer',900,Y,LEAD]],[['mer','(за кадром) Девять серий. Одна больница. Пять интернов. Вот самое главное — и самое смешное.','rc1']],'rcintro'],
"""+ch(1)+r""" [0,'Дом Мередит · утро','house',[['mer',700,Y,LEAD],['der',1050,Y,LEAD*1.04]],
  [['der','Я Дерек. Кажется, мы вчера так и не познакомились.','der1'],['mer','Мередит. Слушай, мне пора — первый день на новой работе.','mer2']]],
 [0,'Больница · тот же день','hall',[['mer',760,Y,LEAD],['der',1080,Y,LEAD*1.04]],
  [['mer','Ты?! Ты здесь работаешь?!','mer3','shock'],['der','Доктор Шепард, нейрохирургия. Приятно снова познакомиться.','der2']]],
 [0,'Первая операция Джорджа','or',[['pat',CX,Y,.7,{lying:true,eyesShut:1}],['geo',CX-360,Y,LEAD,{mask:1,cap:'#8be04a'}],['bur',CX+360,Y,LEAD,{mask:1,cap:'#1f3048'}]],
  [['geo','Так… зажим… я… я не помню, что дальше…','geo4','shock'],['bur','Разрыв! Отойдите, О’Мэлли. Я сам.','bur3','angry'],['alx','Ха! Теперь он — Агент ноль-ноль-семь. С лицензией на убийство.','alx3'],['cap','Так Джордж получил прозвище «007»',null]],'o07'],
"""+ch(2)+r""" [0,'Приёмный покой','room',[['ali',1150,Y,.8,{lying:true,eyesShut:1}],['mer',700,Y,LEAD],['bur',420,Y,LEAD]],
  [['mer','Она… его укусила. Это часть нападавшего!','e2mer7','shock'],['bur','Улика. Грей — в контейнер, и лично шефу в руки.','e2bur2'],['cri','Вот это я понимаю — откусить кусок от преступности.','e2cri2']],'bite'],
 [0,'Дом Мередит','house',[['mer',560,Y,LEAD],['izz',860,Y,LEAD],['geo',1120,Y,LEAD],['cri',1400,Y,LEAD]],
  [['mer','Ладно. Переезжайте. Оба.','e2mer14'],['izz','Правда?! Я испеку маффины!','e2izz3','shock'],['cri','Только без обнимашек при мне.','e2cri4']],'jump'],
"""+ch(3)+r""" [0,'Приёмный покой · Вайпер','room',[['vip',1150,Y,LEAD],['mer',700,Y,LEAD]],
  [['vip','Эй, доктора! Выдерните спицы, мне гонку дописать надо!','e3vip1'],['vip','Спасибо, красотка! Это на удачу!','e3vip2'],['mer','Эй!','e3mer3','shock'],['cap','Курьер целует Мередит и убегает дописывать гонку',null]],'viper'],
 [0,'Палата мистера Макса','room',[['mac',1150,Y,.8,{lying:true}],['geo',700,Y,LEAD]],
  [['mac','А у тебя есть та, кого ты любишь, но не можешь получить?','e3mac4'],['geo','…Мередит.','e3geo4','sad']]],
"""+ch(4)+r""" [0,'Дом Мередит · утро','house',[['geo',560,Y,LEAD],['izz',880,Y,LEAD],['mer',1180,Y,LEAD]],
  [['geo','Иззи! Ты ходишь по дому в белье! У нас что, совсем нет границ?','e4geo1','shock'],['izz','Джордж, расслабься. Ты нам как сестрёнка.','e4izz1'],['mer','Да, Джордж. Ты наша сестрёнка.','e4mer1'],['geo','Я. Не. Сестрёнка!','e4geo2','angry']]],
 [0,'Операция · шестнадцать гвоздей','or',[['jor',CX,Y,.7,{lying:true,eyesShut:1}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['der','Шестнадцатый. Последний.','e4der6'],['der','Хорхе увидит свою жену.','e4der7']],'nails'],
"""+ch(5)+r""" [0,'Операция на сердце','or',[['pmp',CX,Y,.7,{lying:true,eyesShut:1}],['bur',CX-360,Y,LEAD,{mask:1,cap:'#1f3048'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['bur','Грей! Вы что, спите?','e5bur2','angry'],['mer','Простите… Сердце выскользнуло.','e5mer2','shock']],'slip'],
 [0,'У дома Мередит · ночь','night',[['mer',760,Y,LEAD],['der',1000,Y,LEAD*1.04],['bai',-250,Y,LEAD]],
  [['bai','Грей?! Шепард?! Я этого не видела. Я ничего не видела!','e5bai3','shock']],'bailey'],
"""+ch(6)+r""" [0,'Кабинет томографии','office',[['alx',640,Y,LEAD],['cri',1000,Y,LEAD]],
  [['alx','Как можно довести себя до такого? Не понимаю, как она с этим живёт.','e6alx2'],['cri','Карев… Микрофон включён.','e6cri1','shock'],['alx','…Чёрт.','e6alx3','shock']],'mic'],
 [0,'Раздевалка · вечер','lounge',[['izz',760,Y,LEAD],['alx',1140,Y,LEAD]],
  [['izz','Я пейджила тебе пятьдесят раз!','e6izz5','angry'],['alx','Батарейка… села.','e6alx6','sad'],['izz','Ты ужасный человек, Карев!','e6izz6','angry']],'stomp'],
"""+ch(7)+r""" [0,'Дом Мередит · раннее утро','house',[['der',1000,Y,LEAD*1.04],['izz',520,Y,LEAD],['geo',260,Y,LEAD]],
  [['izz','Доктор Шепард?!','e7izz1','shock'],['der','…Доброе утро. Я уже ухожу.','e7der1'],['geo','Это был Шепард. Мередит спит с Шепардом!','e7geo1','shock']],'sneak'],
 [0,'Операция Клэр','or',[['cla',CX,Y,.7,{lying:true,eyesShut:1}],['bai',CX-360,Y,LEAD,{mask:1,cap:'#c07bff'}],['mer',CX+360,Y,LEAD,{mask:1,cap:'#4fa3ff'}]],
  [['cap','ПЛЮХ!',null],['mer','…Серьёзно?!','e7mer4','shock'],['bai','Добро пожаловать в хирургию, Грей.','e7bai3']],'bowel'],
"""+ch(8)+r""" [0,'Коридор','hall',[['mer',760,Y,LEAD],['der',1080,Y,LEAD*1.04]],
  [['der','Узнавать друг друга — самое вкусное. Как подливка.','e8der3'],['mer','Я не хочу быть твоей подливкой!','e8mer3','angry']],'gravy'],
 [0,'Палата мистера Даффа','room',[['duf',1150,Y,.8,{lying:true}],['cri',640,Y,LEAD]],
  [['duf','Как скажете. И поздравляю. Вы беременны.','e8duf3'],['cri','…Что?!','e8cri5','shock']]],
"""+ch(9)+r""" [0,'Раздевалка интернов','lounge',[['geo',760,Y,LEAD],['alx',1060,Y,LEAD]],
  [['geo','Карев, глянь, что за сыпь. Мне самому не видно.','e9geo2','sad'],['alx','Сифилис. Удачи, О’Мэлли.','e9alx1'],['geo','Сифилис?!','e9geo3','shock']]],
 [0,'Холл больницы','hall',[['mer',760,Y,LEAD],['der',1060,Y,LEAD*1.04],['add',1400,Y,LEAD*1.02]],
  [['add','Ты, должно быть, та женщина, что спит с моим мужем.','e9add1'],['mer','…С мужем?!','e9mer6','shock'],['cap','Конец 1 сезона. У Дерека есть жена',null]],'addison'],
 [0,'Бар Джо · ночь','bar',[['mer',900,Y,LEAD]],
  [['mer','(за кадром) Мы пришли сюда интернами, которые ничего не умели. Теперь мы умеем чуть больше. И у каждого — своя драма.','rc2'],['cap','Смотрите дальше: сезон 2',null]],'rcout'],
 [14,'','credits',[],[]],
];"""
e.between("const S=[","\n// тайминг",S)

EXTRA=r"""function chapCard(s,u,t){vgrad('#0b1a1c','#04090a');const n=s[5];glow(CX,H*.42,700,'hsla(180,70%,55%,A)',.25);
  const k=ease(seg(u,0,.25)),sc=1+(1-k)*.4;g.save();g.translate(CX,430);g.scale(sc,sc);g.globalAlpha=k;g.textAlign='center';
  g.fillStyle='#9fe0e0';g.font='bold 44px system-ui';g.fillText('СЕРИЯ',0,-120);g.fillStyle='#fff';g.font='bold 200px Georgia';g.fillText(n,0,60);g.restore();
  g.globalAlpha=ease(seg(u,.2,.45));g.textAlign='center';g.fillStyle='#fff';g.font='italic 64px Georgia';g.fillText('«'+s[1]+'»',CX,620);
  g.fillStyle='#bcd';g.font='32px system-ui';g.fillText(s[6],CX,690);g.globalAlpha=1;
  for(let i=1;i<=9;i++){const x=CX+(i-5)*90,on=i===n,done=i<n;g.fillStyle=on?'#ffd23f':done?'#3ad0c0':'rgba(255,255,255,.2)';g.beginPath();g.arc(x,860,on?20:13,0,TAU);g.fill();if(i<9){g.fillStyle=done?'#3ad0c0':'rgba(255,255,255,.15)';g.fillRect(x+16,857,58,6)}}
  const tr=Math.max(1-seg(u,0,.12),seg(u,.9,1));g.fillStyle=`rgba(0,0,0,${tr})`;g.fillRect(0,0,W,H)}
function recapHud(si){let n=0;for(let i=0;i<=si;i++)if(S[i][2]==='chap')n=S[i][5];if(!n)return;g.save();g.setTransform(1,0,0,1,0,0);
  g.fillStyle='rgba(8,12,16,.7)';rr(W-470,36,430,60,30);g.fill();g.fillStyle='#9fe0e0';g.font='bold 26px system-ui';g.textAlign='left';g.fillText('1×0'+n,W-450,76);
  for(let i=1;i<=9;i++){g.fillStyle=i===n?'#ffd23f':i<n?'#3ad0c0':'rgba(255,255,255,.25)';g.beginPath();g.arc(W-360+i*34,66,i===n?11:7,0,TAU);g.fill()}g.restore()}
function extra(kind,u,t,s,lt){
  if(kind==='rcintro'){g.fillStyle='rgba(20,10,0,.25)';g.fillRect(-100,-100,W+200,H+200)}
  if(kind==='o07'){const b3=LN(s,'bur3',lt);if(b3>0&&LN(s,'alx3',lt)<0){blood(CX,FL-230,Math.min(lt-(s[4][1].t0),.9),t)}
    if(LN(s,'alx3',lt)>0){g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#111';g.beginPath();g.arc(300,330,120,0,TAU);g.fill();g.fillStyle='#fff';g.font='bold 110px Georgia';g.textAlign='center';g.fillText('007',300,368);g.restore()}}
  if(kind==='bite'){}
  if(kind==='viper'){const v2=LN(s,'e3vip2',lt);if(v2>.3&&v2<1.2)heartShape(900,FL-560,26,'rgba(255,90,140,.9)')}
  if(kind==='nails'){for(let i=0;i<16;i++){const done=LN(s,'e4der6',lt)>.2||i<12;g.fillStyle=done?'#8a939b':'#ccd';g.fillRect(1200+(i%8)*26,FL-300+Math.floor(i/8)*40,6,done?22:34)}}
  if(kind==='slip'){const m2=LNx(s,'e5mer2',lt);const q=clamp((lt-(m2.t0-1.6))/.8);g.fillStyle='#b8243a';heartBig(CX+300-q*240,FL-300+q*80+Math.sin(q*9)*20,.8)}
  if(kind==='mic'){g.fillStyle='#1b2226';rr(1260,FL-420,420,300,14);g.fill();g.fillStyle='#9fc8d8';rr(1280,FL-400,380,200,8);g.fill();const on=LN(s,'e6alx2',lt)>0;g.fillStyle=on?`rgba(255,40,40,${.6+.4*Math.sin(t*8)})`:'#444';g.beginPath();g.arc(1300,FL-160,14,0,TAU);g.fill();g.fillStyle='#fff';g.font='bold 22px system-ui';g.textAlign='left';g.fillText('МИКРОФОН ВКЛ',1324,FL-152)}
  if(kind==='stomp'){const i6=LNx(s,'e6izz6',lt);if(i6.p>.3){const x=880,y=FL+10;g.fillStyle='#222';rr(x-50,y-20,100,34,8);g.fill();g.strokeStyle='#ddd';g.lineWidth=3;g.beginPath();g.moveTo(x-30,y-18);g.lineTo(x-5,y);g.lineTo(x+10,y-16);g.lineTo(x+35,y+10);g.stroke()}}
  if(kind==='bowel'){const c=LNx(s,'e7mer4',lt),q=(lt-(c.t0-1.1));if(q>0&&q<1.2){g.fillStyle=`rgba(255,255,230,${.5*(1-q/1.2)})`;g.fillRect(-100,-100,W+200,H+200)}
    if(q>0){for(let i=0;i<22;i++){const a=-Math.PI*.15-(i/22)*Math.PI*.6,v=200+(i*47%160),tt=Math.min(q,.7);g.fillStyle='rgba(120,90,40,.85)';g.beginPath();g.arc(CX+60+Math.cos(a)*v*tt*1.6,FL-230+Math.sin(a)*v*tt+300*tt*tt,9+i%4*3,0,TAU);g.fill()}}}
  if(kind==='gravy'){if(LN(s,'e8der3',lt)>0){g.fillStyle='#fff';g.beginPath();g.ellipse(1250,FL-540,70,20,0,0,TAU);g.fill();g.fillStyle='#8a5a2a';g.beginPath();g.ellipse(1250,FL-542,56,13,0,0,TAU);g.fill()}}
  if(kind==='addison'){const m6=LN(s,'e9mer6',lt);if(m6>0){g.fillStyle=`rgba(160,0,20,${Math.min(.35,m6*.3)})`;g.fillRect(-100,-100,W+200,H+200)}}
  if(kind==='rcout'){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-100,-100,W+200,H+200)}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],L=v=>LNx(s,v,lt);
  if(k==='o07'){if(id==='geo'){const b=L('bur3');return {o:b.p>0?{mood:'sad'}:{reach:1,work:true,tool:true,jx:Math.sin(t*20)*2}}}if(id==='bur')return {o:L('bur3').p>0?{reach:-1,work:true,tool:true}:{}}}
  if(k==='bite'&&id==='mer')return {o:{reach:1},fx:()=>{if(L('e2bur2').p>.3)cooler(800,Y-330*LEAD,.9,'УЛИКА')}};
  if(k==='jump'&&(id==='izz'||id==='geo')){const q=L('e2izz3');return {o:q.p>0?{up:1,jy:-Math.abs(Math.sin(t*8))*30}:{}}}
  if(k==='viper'){const v2=L('e3vip2');if(id==='vip'){const e=ease(seg(v2.p,1,2.2));return {x:v2.p>.2&&v2.p<1?820:lerp(1150,2300,e),o:e>0&&e<1?{walk:true}:{flip:true}}}if(id==='mer'&&L('e3mer3').p>0)return {o:{mood:'shock'}}}
  if(k==='nails'){if(id==='der')return {o:{reach:1,work:true,tool:true}};if(id==='mer')return {o:{reach:-1}}}
  if(k==='slip'){if(id==='mer')return {o:{reach:-1,up:L('e5mer2').p>0}};if(id==='bur')return {o:{reach:1,work:true,tool:true}}}
  if(k==='bailey'){if(id==='bai'){const e=ease(seg(lt,.2,1));const f=ease(seg(L('e5bai3').p,1,2));return {x:f>0?lerp(380,-250,f):lerp(-250,380,e),o:f>0?{walk:true,flip:true,up:1}:(e<1?{walk:true}:{up:1})}}
    if(id==='mer'||id==='der')return {o:{reach:id==='mer'?1:-1,mood:L('e5bai3').p>0?'shock':undefined}}}
  if(k==='mic'&&id==='alx'&&L('e6alx3').p>0)return {o:{mood:'shock'}};
  if(k==='stomp'&&id==='izz'){const i6=L('e6izz6');const st=i6.p>.2&&i6.p<.8;return {o:st?{jy:-Math.abs(Math.sin(t*14))*30,mood:'angry'}:{}}}
  if(k==='sneak'&&id==='der'){const b=ease(seg(L('e7der1').p,1,2.2));return {x:lerp(1000,-300,b),o:b>0&&b<1?{walk:true,flip:true}:{}}}
  if(k==='bowel'){const m4=L('e7mer4');if(id==='bai')return {o:{reach:1,work:true,tool:true}};if(id==='mer')return {o:{reach:-1},fx:()=>{if(m4.p>-.3){g.fillStyle='rgba(120,90,40,.85)';for(let i=0;i<6;i++){g.beginPath();g.arc(CX+330+(i*29%60)-30,Y-360*LEAD+(i*41%120)-60,9+i%3*3,0,TAU);g.fill()}}}}}
  if(k==='addison'&&id==='der'&&L('e9add1').p>0)return {o:{mood:'shock'}};
  if(k==='addison'&&id==='add')return {o:{flip:true}};
  if(k==='rcout'&&id==='mer')return {o:{reach:1}};
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[2]==='chap')){noise(r.t0,.5,4000,.08,'highpass');for(let k=0;k<3;k++)tone(m(67+[0,5,12][k]),r.t0+.15+k*.12,.5,'triangle',.05)}
  for(const r of S.filter(s=>s[2]==='or'))for(let k=0;k<r[0]*1.2;k++)tone(988,r.t0+k/1.2,.12,'sine',.02);
  {const z=LT('alx3').t;for(let k=0;k<4;k++)tone(m([64,66,67,66][k]),z+k*.3,.3,'square',.04)}
  {const z=LT('e7mer4').t;noise(z-1.1,.35,500,.5)}
  {const z=LT('e6izz6');for(let k=0;k<3;k++)noise(z.t+z.d*(.25+k*.18),.08,600,.4)}
  {const z=LT('e9mer6').t;for(let k=0;k<3;k++)tone(m([38,37,36][k]),z+k*.5,1.6,'sawtooth',.05)}
  {const r=S.find(s=>s[2]==='credits');for(let k=0;k<12;k++)tone(m([60,64,67,72,71,67,64,62,60,64,67,60][k]),r.t0+.5+k*1.05,1.5,'sine',.04)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys-s1-recap.html')
gallery('greysrecap1','greys-s1-recap.html','Анатомия страсти · Лучшее из 1 сезона','⭐','linear-gradient(#1a2a3a,#2a0a1a)',
  'Весь первый сезон за ~5 минут: самые важные и самые смешные моменты серий 1–9 — от «Ты здесь работаешь?!» до жены Дерека.',
  ['~5 мин · 16:9','серии 1–9','нарезка'],'greys10')
