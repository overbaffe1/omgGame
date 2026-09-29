# Сезон 2, серия 1 «Капли дождя падают мне на голову» (Raindrops Keep Falling on My Head). Собирается из greys9.html.
# Улучшения: новый фон — бар Джо «Изумрудный город» (неон, бутылки, посетители), таймер остановки сердца 45:00 на экране,
# брызги пива, обморок Джо, поцелуй в лифте, дождь, заставка «Сезон 2».
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from epkit import Ep,gallery
e=Ep('greys9.html')
e.R('<title>Анатомия страсти · 1×09','<title>Анатомия страсти · 2×01')
e.R('сезон 1 · серия 9 · «Кто кого?»','сезон 2 · серия 1 · «Капли дождя»')
e.R("g.fillText('Сезон 1 · Серия 9 · финал сезона',CX,740);g.font='italic 60px Georgia';g.fillText('«Кто кого?»',CX,820)",
    "g.fillText('Сезон 2 · Серия 1',CX,740);g.font='italic 52px Georgia';g.fillText('«Капли дождя падают мне на голову»',CX,820)")
e.R("'anatomiya-strasti-1x09.webm'","'anatomiya-strasti-2x01.webm'")
e.R("'bur','oli'];","'bur','add'];")
e.R("||s[5]==='fcode'&&LN(s,'e9bai2',lt)<0","||s[5]==='standstill'&&LN(s,'s21bur2',lt)>0&&LN(s,'s21der4',lt)<.4")
e.R("const BG={","const BG={bar:bgBar,")
e.R("['Сезон 1 · финал','']","['Сезон 2 · серия 1','']")
e.R("['Продолжение — во 2-м сезоне','']","['Продолжение следует','']")
e.R("r:'',skin:'#f6dcc8',hair:'#b8321e'","r:'неонатальный хирург, жена Дерека',skin:'#f6dcc8',hair:'#b8321e'") if "r:'',skin:'#f6dcc8',hair:'#b8321e'" in e.s else None

S=r"""const S=[
 [7,'','title',[],[]],
 [0,'Ранее в «Анатомии страсти»','hall',[['mer',700,Y,LEAD],['der',1000,Y,LEAD*1.04],['add',1350,Y,LEAD*1.02]],[['cap','Мередит узнала, что у Дерека есть жена — Эддисон',null]],'recap'],
 [0,'Ранее в «Анатомии страсти»','lounge',[['geo',760,Y,LEAD],['alx',1300,Y,LEAD,{lying:true,ground:true,eyesShut:1}]],[['cap','Джордж ударил Алекса: сифилис достался ему от Алекса через Оливию',null]],'recap'],
 [16,'Кто есть кто','cast',[],[]],
 [0,'Бар Джо «Изумрудный город»','bar',[['joe',1250,Y,LEAD*1.05],['mer',760,Y,LEAD]],
  [['joe','Знакомое лицо. Кто виноват — парень или начальник?','s21joe1'],['mer','Оба. Мой парень — мой начальник. И у него есть жена.','s21mer1','sad'],['joe','Эта — за счёт заведения.','s21joe2']],'shots'],
 [0,'Коридор больницы','hall',[['add',1100,Y,LEAD*1.02],['der',760,Y,LEAD*1.04]],
  [['add','Ты изменился. Эта причёска… Прямо Рассел Кроу.','s21add1'],['der','Что ты здесь делаешь, Эддисон?','s21der1','angry'],
   ['add','Работаю. Меня позвал Ричард.','s21add2'],['der','Даже не пытайся меня вернуть.','s21der2','angry']]],
 [0,'Дом Мередит · ванная','house',[['alx',760,Y,LEAD],['izz',1060,Y,LEAD]],
  [['izz','Джордж тебя здорово отделал.','s21izz1'],['alx','Он бьёт как моя сестра.','s21alx1'],['izz','То есть тебя побила девчонка.','s21izz2']],'ice'],
 [0,'Бар Джо · позже','bar',[['joe',1300,Y,LEAD*1.05],['mer',560,Y,LEAD],['cri',800,Y,LEAD],['geo',1020,Y,LEAD]],
  [['joe','Слава чемпиону!','s21joe3'],['mer','Играем, у кого жизнь хуже. Дерек женат.','s21mer2'],['geo','Пфф!','s21geo1','shock'],
   ['cri','Я беременна. Я выиграла.','s21cri1'],['cap','Джо падает за стойкой',null],['cri','…Ладно. Джо выиграл.','s21cri2','shock']],'collapse'],
 [0,'Кабинет Шепарда · снимки','office',[['der',700,Y,LEAD*1.04],['cri',1000,Y,LEAD],['mer',1300,Y,LEAD]],
  [['der','Аневризма размером с мяч для гольфа. Операция с остановкой сердца.','s21der3'],['cri','Остановка сердца?! Я в деле!','s21cri3','shock'],['mer','Карту не возьму. Я пьяная.','s21mer3','angry']],'aneur'],
 [0,'Парковка · дождь','lot',[['mer',760,Y,LEAD],['der',1060,Y,LEAD*1.04]],
  [['der','Мередит, дай мне объяснить.','s21der5'],['mer','Объяснять надо было в тот вечер в баре. До всего.','s21mer4','angry'],
   ['mer','Ещё слово — и я тебя перееду.','s21mer5','angry']],'rain'],
 [0,'Палата Джули Филлипс','room',[['jul',1150,Y,.8,{lying:true}],['add',640,Y,LEAD*1.02],['mer',380,Y,LEAD]],
  [['cap','Джули беременна двойней',null],['jul','Муж ушёл к другой женщине. Как можно так поступить?','s21jul1','sad'],['add','Доктор Грей будет мне ассистировать.','s21add3'],['mer','…Да, доктор Шепард.','s21mer6','sad']],'twins'],
 [0,'Лифт','elev',[['cri',820,Y,LEAD],['bur',1060,Y,LEAD],['geo',-250,Y,LEAD]],
  [['cap','Двери закрываются…',null],['cap','…и снова открываются',null],['geo','Бёрк и Кристина?!','s21geo2','shock']],'kiss'],
 [0,'Коридор','hall',[['mer',760,Y,LEAD],['cri',1060,Y,LEAD]],
  [['mer','Ты учила меня жить, а сама спишь с Бёрком?','s21mer7','angry'],['cri','Мы — Швейцария. Нейтрально. И часы хорошие.','s21cri4'],
   ['mer','Ты сказала ему о ребёнке?','s21mer8'],['cri','…Нет.','s21cri5','sad']]],
 [0,'Кабинет шефа','office',[['web',700,Y,LEAD*1.02],['geo',1000,Y,LEAD]],
  [['geo','У Джо нет страховки. Он может потерять бар!','s21geo3'],['web','Мы оперируем пациентов, О’Мэлли. Остальное — не наше дело.','s21web1']]],
 [0,'Операция Джо · остановка сердца','or',[['joe',CX,Y,.7,{lying:true,eyesShut:1}],['der',CX-360,Y,LEAD,{mask:1,cap:'#27405e'}],['bur',CX+360,Y,LEAD,{mask:1,cap:'#1f3048'}],['cri',1560,Y,SM,{mask:1,cap:'#ff5a6e'}]],
  [['bur','Ну что, Джо. Пора умирать.','s21bur1'],['bur','Сердце остановлено. Время пошло.','s21bur2'],
   ['der','У всех есть история про Джо. А у вас, Бёрк?','s21der6'],['bur','У меня нет. Я хотел услышать вашу.','s21bur3'],
   ['der','Есть! Аневризма закрыта. Согревайте его!','s21der4','shock'],['cap','Сердце Джо снова бьётся',null]],'standstill'],
 [0,'Кабинет шефа · вечер','office',[['web',700,Y,LEAD*1.02],['geo',1000,Y,LEAD]],
  [['geo','Джо заслуживает нашей помощи!','s21geo4','angry'],['web','…Подпишу.','s21web2'],['web','Но крикнешь на меня ещё раз — сломаю как спичку.','s21web3']],'sign'],
 [0,'Дежурка','lounge',[['bur',760,Y,LEAD],['cri',1060,Y,LEAD]],
  [['bur','Давай закончим. Пока не стало больнее.','s21bur4','sad'],['cri','…Хорошо.','s21cri6','sad']]],
 [0,'Улица · дождь','night',[['mer',900,Y,LEAD]],
  [['mer','(за кадром) Иногда дождь просто идёт. И всё, что можно сделать, — это не прятаться от него.','s21mer9'],['cap','АНАТОМИЯ СТРАСТИ — продолжение следует',null]],'rainend'],
 [14,'','credits',[],[]],
];"""
e.between("const S=[","\n// тайминг",S)
e.R("P.pmp={","P.joe={n:'Джо, бармен',s:'Джо',r:'бармен бара напротив больницы',skin:'#e6c2a2',hair:'#3a2a1a',hs:'buzz',cl:'#2a2a30',col:'#40c080',goat:1};\n"
    "P.jul={n:'Джули Филлипс',s:'Джули',r:'',skin:'#f2d2b8',hair:'#8a5a2a',hs:'long',cl:'#e8eef2',col:'#ffb0d0',gown:1};\nP.pmp={")

EXTRA=r"""function rain(t,a=.35){g.strokeStyle=`rgba(200,220,255,${a})`;g.lineWidth=2;for(let i=0;i<140;i++){const x=(i*137+t*120)%(W+200)-100,y=((i*71+t*900)%(H+100))-100;g.beginPath();g.moveTo(x,y);g.lineTo(x-10,y+34);g.stroke()}}
function bgBar(t){vgrad('#2a1a14','#140c08');g.fillStyle='#3a2418';g.fillRect(0,FL-60,W,H);g.strokeStyle='#2a180e';g.lineWidth=3;for(let i=0;i<16;i++){g.beginPath();g.moveTo(i*130,FL-60);g.lineTo(i*130-200,H);g.stroke()}
  g.fillStyle='#4a2e1c';g.fillRect(900,140,980,420);for(let r=0;r<3;r++){g.fillStyle='#6b4428';g.fillRect(920,250+r*110,940,12);for(let b=0;b<24;b++){const bx=935+b*38,h=50+(b*17%30);g.fillStyle=`hsla(${[30,120,200,0,45][b%5]},60%,${35+b%3*10}%,.9)`;rr(bx,250+r*110-h,22,h,5);g.fill();g.fillRect(bx+7,250+r*110-h-14,8,14)}}
  g.save();g.shadowColor='#3f8';g.shadowBlur=30;g.fillStyle='#8fffb0';g.font='bold 54px Georgia';g.textAlign='center';g.fillText('Emerald City Bar',480,200);g.restore();glow(480,190,400,'hsla(140,100%,60%,A)',.15+.05*Math.sin(t*7));
  for(const lx of[300,660,1400]){g.strokeStyle='#222';g.lineWidth=3;g.beginPath();g.moveTo(lx,0);g.lineTo(lx,120);g.stroke();g.fillStyle='#c98a3a';g.beginPath();g.moveTo(lx-40,150);g.lineTo(lx+40,150);g.lineTo(lx+20,120);g.lineTo(lx-20,120);g.fill();glow(lx,170,260,'hsla(35,100%,65%,A)',.35)}
  g.save();g.globalAlpha=.55;for(const[x,c] of[[160,'#8a4a6a'],[330,'#4a6a8a']]){npc('nr2',x,FL-80,.5,t,{tag:false,a:.6})}g.restore()}
function barCounter(){g.fillStyle='#5a3420';rr(1000,FL-240,900,200,10);g.fill();g.fillStyle='#7a4a2a';g.fillRect(990,FL-250,920,26);g.fillStyle='rgba(255,220,160,.15)';g.fillRect(990,FL-250,920,6);
  for(const sx of[640,860]){g.fillStyle='#8a2a2a';g.beginPath();g.ellipse(sx,FL-150,50,16,0,0,TAU);g.fill();g.fillStyle='#333';g.fillRect(sx-5,FL-140,10,130)}}
function shot(x,y,full){g.fillStyle='rgba(220,240,255,.6)';g.beginPath();g.moveTo(x-14,y-36);g.lineTo(x+14,y-36);g.lineTo(x+10,y);g.lineTo(x-10,y);g.fill();if(full){g.fillStyle='rgba(240,200,80,.85)';g.fillRect(x-11,y-24,22,22)}}
function extra(kind,u,t,s,lt){
  if(kind==='recap'){g.fillStyle='rgba(120,80,30,.28)';g.fillRect(-100,-100,W+200,H+200);g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,24);g.fillRect(0,H-24,W,24);g.restore()}
  if(kind==='shots'||kind==='collapse'){barCounter();const n=kind==='shots'?Math.min(5,2+Math.floor(lt/3)):3;for(let i=0;i<n;i++)shot(1030+i*40,FL-250,i===n-1);
    if(kind==='collapse'){for(let i=0;i<3;i++){g.fillStyle='#8a5a20';rr(1100+i*120,FL-310,34,60,6);g.fill()}}}
  if(kind==='aneur'){g.fillStyle='#e8f4ff';rr(1480,170,380,300,12);g.fill();g.fillStyle='#1c2630';rr(1500,190,340,260,6);g.fill();g.fillStyle='#c8d4dc';g.beginPath();g.ellipse(1670,320,120,100,0,0,TAU);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(1670,380,26,0,TAU);g.fill();g.strokeStyle=`rgba(255,80,80,${.6+.4*Math.sin(t*6)})`;g.lineWidth=5;g.beginPath();g.arc(1670,380,36,0,TAU);g.stroke()}
  if(kind==='rain'){g.fillStyle='rgba(40,60,90,.3)';g.fillRect(-100,-100,W+200,H+200);rain(t)}
  if(kind==='rainend'){g.fillStyle='rgba(20,30,60,.3)';g.fillRect(-100,-100,W+200,H+200);rain(t,.45);for(let i=0;i<8;i++){const q=(t*.8+i/8)%1;g.strokeStyle=`rgba(200,220,255,${.4*(1-q)})`;g.lineWidth=2;g.beginPath();g.ellipse((i*237)%W,FL+20+(i%3)*30,20+q*60,5+q*12,0,0,TAU);g.stroke()}}
  if(kind==='twins'){g.fillStyle='#10161c';rr(760,140,300,200,10);g.fill();g.fillStyle='#1a2a24';rr(772,152,276,176,6);g.fill();for(const[bx,by] of[[860,240],[960,250]]){g.fillStyle='rgba(200,240,220,.7)';g.beginPath();g.arc(bx,by,30,0,TAU);g.fill();g.beginPath();g.arc(bx+20,by-26,16,0,TAU);g.fill()}
    g.fillStyle='#dfe9ef';g.beginPath();g.ellipse(1180,Y-205,110,64,0,Math.PI,TAU);g.fill()}
  if(kind==='kiss'){const q2=s[4][1];if(lt>q2.t0-.5&&lt<q2.t0+.3){g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-100,-100,W+200,H+200)}
    if(lt<q2.t0+2){heartShape(940,FL-560+Math.sin(t*3)*8,26,'rgba(255,90,140,.9)')}}
  if(kind==='standstill'){const b2=LNx(s,'s21bur2',lt),d4=LNx(s,'s21der4',lt);if(b2.p>0){const span=Math.max(1,(d4.t0+d4.d*.4)-b2.t0),q=clamp((lt-b2.t0)/span)*(38/45),rem=d4.p>.4?(45*60*(1-38/45)):45*60*(1-q);
      const mm=Math.floor(rem/60),ss=Math.floor(rem%60);g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='rgba(8,12,16,.8)';rr(W-380,120,340,110,16);g.fill();g.fillStyle=d4.p>.4?'#4f8':(rem<600?'#f55':'#ffd23f');g.font='bold 70px monospace';g.textAlign='center';
      g.fillText(`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,W-210,200);g.font='bold 20px system-ui';g.fillStyle='#bcd';g.fillText(d4.p>.4?'СЕРДЦЕ ЗАПУЩЕНО':'СЕРДЦЕ ОСТАНОВЛЕНО',W-210,226);g.restore()}
    for(let i=0;i<5;i++){g.fillStyle='rgba(200,235,255,.8)';rr(CX-240+i*100,FL-250,70,34,10);g.fill()}}
  if(kind==='sign'){if(LN(s,'s21web2',lt)>0){g.fillStyle='#fff';g.save();g.translate(850,FL-330);g.rotate(-.1);g.fillRect(0,0,120,160);g.strokeStyle='#23a';g.lineWidth=3;g.beginPath();for(let i=0;i<30;i++)g.lineTo(20+i*3,130+Math.sin(i*1.3)*8);g.stroke();g.restore()}}
}"""
e.between("function extra(kind,u,t,s,lt){","\nfunction subtitle",EXTRA+"\nfunction __unused(){}")
# creditsCard и heartBig из 1×09 остаются (стоят перед extra)

ANIM=r"""function anim(s,id,lt,t,u){
  const k=s[5],sc=s[2],L=v=>LNx(s,v,lt);
  if(k==='shots'){if(id==='mer')return {o:{reach:1,jy:Math.sin(t*1.2)*4}};if(id==='joe')return {o:{flip:true,reach:L('s21joe2').p>0?-1:0}}}
  if(k==='ice'&&id==='alx')return {o:{reach:.9},fx:()=>{g.fillStyle='rgba(120,70,150,.55)';g.beginPath();g.arc(760-15*LEAD,Y-414*LEAD,14,0,TAU);g.fill();g.fillStyle='#bfe3f5';rr(760+2,Y-440*LEAD,40,34,8);g.fill()}};
  if(k==='collapse'){const g1=L('s21geo1'),c=s[4][4];if(id==='geo')return {o:{reach:g1.p>-.4?.6:0},fx:()=>{if(g1.p>0&&g1.p<1.2){const q=g1.p;for(let i=0;i<14;i++){g.fillStyle=`rgba(240,200,80,${.8*(1-q/1.2)})`;g.beginPath();g.arc(1020-40-i*14*q*3,Y-400*LEAD+i*4*q*3+Math.sin(i)*8,5,0,TAU);g.fill()}}}};
    if(id==='joe'){const q=clamp((lt-c.t0)/.6);return {o:{flip:true,jy:q*260,mood:q>0?'shock':undefined,eyesShut:q>=1}}}
    if(id==='cri'&&lt>c.t0+.5)return {x:lerp(800,1000,ease(clamp((lt-c.t0-.5)))),o:{mood:'shock'}}}
  if(k==='aneur'&&id==='der')return {o:{reach:L('s21der3').p>0?1:0}};
  if(k==='aneur'&&id==='mer'){const e=ease(seg(L('s21mer3').p,.9,1.8));return {x:lerp(1300,2200,e),o:e>0&&e<1?{walk:true}:{}}}
  if(k==='rain'){if(id==='mer'){const e=ease(seg(L('s21mer5').p,.9,2));return {x:lerp(760,-250,e),o:e>0&&e<1?{walk:true,flip:true}:{}}}}
  if(k==='kiss'){const q2=s[4][1];if(id==='bur'||id==='cri'){const cl=lt<q2.t0+2;return {x:id==='bur'?(cl?980:1060):(cl?900:820),o:cl?{reach:id==='bur'?-1:1}:{mood:'shock'}}}
    if(id==='geo'){const e=ease(seg(lt,q2.t0,q2.t0+1));return {x:lerp(-250,380,e),o:e>0&&e<1?{walk:true}:{}}}}
  if(k==='standstill'){const d4=L('s21der4');if(id==='der')return {o:{reach:1,work:d4.p<.3,tool:true}};if(id==='bur')return {o:{reach:-1,work:true}};
    if(id==='joe')return {o:{jy:d4.p>.6&&d4.p<.9?-10:0}}}
  if(k==='sign'&&id==='geo')return {o:{jy:L('s21web3').p>.8?-Math.abs(Math.sin(t*8))*20:0,mood:L('s21web3').p>.8?undefined:L('s21geo4').p>0&&L('s21web2').p<0?'angry':undefined}};
  if(k==='rainend'&&id==='mer'){return {x:900+Math.min(lt,12)*20,o:{walk:true}}}
  return null}
"""
e.between("function anim(s,id,lt,t,u){","\nfunction defibCart",ANIM)

SCORE=r"""  const at=i=>S[i].t0,LT=vo=>{for(const s of S)for(const l of s[4])if(l[2]===vo)return {t:s.t0+l.t0,d:l.d};return {t:0,d:0}};
  for(let k=0;k<6;k++)tone(1046,at(0)+.6+k*.9,.15,'sine',.05);
  for(const r of S.filter(s=>s[5]==='recap'))tone(m(57),r.t0+.2,r[0],'sine',.03);
  for(const r of S.filter(s=>s[2]==='bar')){for(let k=0;k<r[0]*2;k++)tone(m([45,52,48,55][k%4]),r.t0+k*.5,.4,'triangle',.025);noise(r.t0,r[0],600,.03,'lowpass')}
  for(const r of S.filter(s=>['rain','rainend'].includes(s[5])))for(let k=0;k<r[0];k++)noise(r.t0+k,1.1,2500,.06,'lowpass');
  {const z=LT('s21geo1').t;noise(z,.3,3000,.2)}
  {const r=S.find(s=>s[5]==='collapse');const c=r[4][4];noise(r.t0+c.t0+.5,.25,300,.5);tone(m(36),r.t0+c.t0+.5,.3,'square',.05)}
  {const r=S.find(s=>s[2]==='elev');tone(1319,r.t0+.3,1,'sine',.06);tone(1047,r.t0+.6,1.2,'sine',.06)}
  {const a=LT('s21bur2'),b=LT('s21der4');tone(1400,a.t+.3,b.t+b.d*.4-a.t-.3,'sine',.025);for(let k=0;k<(b.t-a.t)*1.5;k++)tone(m(40),a.t+k/1.5,.15,'sine',.05);for(let k=0;k<6;k++)tone(988,b.t+b.d*.5+k*.8,.12,'sine',.045)}
  {const z=LT('s21web3');for(let k=0;k<4;k++)tone(m(72+[0,4,7,12][k]),z.t+z.d+k*.12,.8,'sine',.04)}
  {const r=S.find(s=>s[2]==='credits');for(let k=0;k<12;k++)tone(m([60,64,67,72,71,67,64,62,60,64,67,60][k]),r.t0+.5+k*1.05,1.5,'sine',.04)}
}
"""
e.between("  const at=i=>S[i].t0,LT=","Player.mount(",SCORE)
e.save('greys10.html')
gallery('greys10','greys10.html','Анатомия страсти · 2×01','☔','linear-gradient(#0a2a1a,#0b1020)',
  'Сезон 2, серия 1 «Капли дождя»: Мередит пьёт в баре Джо, Эддисон приезжает в Сиэтл, Джо падает без сознания — и Шепард оперирует его с остановкой сердца на 45 минут.',
  ['~4 мин · 16:9','сезон 2 · серия 1','таймер операции'],'greys9')
