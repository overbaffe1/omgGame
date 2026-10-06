/* body51-scenes.js — сцены мультфильма «Вайбкодер из Мурманска» */
(function(){
const cv=document.getElementById('c'),g=cv.getContext('2d'),W=1080,H=1920,CX=W/2,TAU=Math.PI*2;
const clamp=B.clamp,lerp=B.lerp,ease=B.ease,seg=B.seg,easeOut=B.easeOut,easeIn=B.easeIn,hp=B.hp;
const rr=B.rr,fill=B.fill,glow=B.glow,vgrad=B.vgrad,txt=B.txt,lines=B.lines,shadow=B.shadow,panel=B.panel,chip=B.chip,snow=B.snow,stars=B.stars,aurora=B.aurora,codeLines=B.codeLines,person=B.person,cat=B.cat,polarNight=B.polarNight,skyline=B.skyline,room=B.room;
const fmtT=B.fmtT;
const AMBER=B.AMBER,VIOLET=B.VIOLET,PAPER=B.PAPER,MINT=B.MINT,AUR=B.AUR;
const S={};

// окно «программы» на экране
function win(x,y,w,h,title,t,body,a=.9){
  fill('rgba(10,12,18,'+a+')',x,y,w,h,16);g.strokeStyle='#ffffff22';g.lineWidth=2;rr(x,y,w,h,16);g.stroke();
  fill('#161a26',x,y,w,46,0);rr(x,y,w,46,16);g.fill();g.fillStyle='#161a26';g.fillRect(x,y+30,w,16);
  g.fillStyle='#ff6b6b';g.beginPath();g.arc(x+26,y+23,7,0,TAU);g.fill();g.fillStyle='#ffc46b';g.beginPath();g.arc(x+50,y+23,7,0,TAU);g.fill();g.fillStyle='#7ee08a';g.beginPath();g.arc(x+74,y+23,7,0,TAU);g.fill();
  txt(title,x+w/2,y+24,24,'#c9d2e0',700,'center');
  if(body)body(x+18,y+62,w-36,h-80,t);
}
// полоса-индикатор
function gauge(x,y,w,h,v,col='#7fe0c0',label=''){
  fill('#ffffff14',x,y,w,h,h/2);fill(col,x,y,Math.max(6,w*clamp(v)),h,h/2);
  glow(x+w*clamp(v),y+h/2,h*3,hexA(col,.30));
  if(label)txt(label,x+w/2,y-24,24,'#cfd6e2',700,'center');
}
function hexA(c,a){const r=parseInt(c.slice(1,3),16),gg=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);return `rgba(${r},${gg},${b},${a})`}
function stamp(x,y,s,text,col,t,rot=-.14){
  g.save();g.translate(x,y);g.rotate(rot);g.scale(s,s);g.globalAlpha=.92;
  g.strokeStyle=col;g.lineWidth=7;rr(-230,-56,460,112,16);g.stroke();
  txt(text,0,2,60,col,900,'center');g.restore();
}
function toast(x,y,w,text,sub,k,t){g.save();g.globalAlpha=clamp(k);panel(x,y,w,104,20,.86);
  txt(text,x+30,y+38,30,PAPER,800,'left');if(sub)txt(sub,x+30,y+74,24,'#9aa3b2',600,'left');g.restore()}

// ============ 1. Мурманск ============
S.polar=(u,t,sc)=>{
  polarNight(t,{aurora:1});
  const zoom=easeIn(seg(u,.40,.92));
  g.save();
  const fx=lerp(CX,700,zoom),fy=lerp(H*.64,1400,zoom),z=lerp(1,2.7,zoom);
  g.translate(CX,H*.62);g.scale(z,z);g.translate(-fx,-fy);
  skyline(60,H*.86,1,t,{his:{i:4,r:2,c:3}});
  g.restore();
  snow(t,80,.6);
  if(zoom>.5){g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=ease(seg(zoom,.5,1));room(t,{code:'#ffd0a0',speed:8});
    person(300,1170,1.3,{talk:true,t,arm:.15});cat(905,1070,.8,{t});g.restore()}
  const k=Math.min(1,seg(u,.10,.20))*(1-seg(u,.34,.46));
  if(k>0){g.save();g.globalAlpha=k;fill('rgba(5,7,12,.62)',0,0,W,H);
    txt('МУЛЬТИК ПО ФАКТАМ',CX,780,34,MINT,800,'center','ui-monospace,monospace');
    txt('ВАЙБКОДЕР',CX,884,120,PAPER,900,'center');
    txt('ИЗ МУРМАНСКА',CX,1000,104,AMBER,900,'center');
    txt('12 ГЛАВ · РИСОВАНО КОДОМ · МУЗЫКА ИЗ КОДА',CX,1092,28,'#cfd6e2',600,'center');
    g.strokeStyle='#ffc06a66';g.lineWidth=3;g.beginPath();g.moveTo(CX-330,1132);g.lineTo(CX+330,1132);g.stroke();g.restore()}
  if(zoom>.6)snow(t,26,.35);
};

// ============ 2. Кот Гуччи ============
S.cat=(u,t,sc)=>{
  vgrad('#1a1626','#0c0b14',0,H);fill('#221b2e',0,0,W,1010);fill('#141220',0,1010,W,910);
  // стол, раковина, кран
  fill('#2b2130',0,930,W,40);fill('#241b2c',0,970,W,H-970);
  fill('#3a4056',250,470,34,470,10);fill('#3a4056',250,470,150,34,10);
  fill('#2f3446',470,860,300,70,14);
  const ph=(t*.85)%1.1;
  if(ph<.55){const dy=520+(ph/.55)*330;g.fillStyle='rgba(159,216,255,.9)';g.beginPath();g.ellipse(400,dy,7,13,0,0,TAU);g.fill()}
  fill('#cfe4f5',470,880,220,26,13);glow(580,880,90,'rgba(160,215,255,A)',.2);
  // кот у миски
  const lap=Math.max(0,Math.sin(t*2.4));
  cat(560,830,.85,{t,tongue:lap>.6});
  txt('«из миски — для слабаков»',560,742,24,'#8f97a6',600,'center','Georgia,serif');
  // автокормушка Валера
  const fx2=110,fy=1120;
  fill('#2e3446',fx2,fy,300,220,18);fill('#242a3a',fx2+18,fy+18,264,120,12);
  txt('ВАЛЕРА',fx2+150,fy+64,40,'#7fe0c0',900,'center','ui-monospace,monospace');
  txt('автокормушка · кормит по расписанию',fx2+150,fy+108,19,'#9aa3b2',600,'center');
  const secs=Math.max(0,Math.floor(40-(t*.4)%40)),c1='03',c2=String(secs).padStart(2,'0');
  fill('#0d1018',fx2+72,fy+156,156,46,8);txt(c1+':'+c2,fx2+150,fy+181,34,'#ffc06a',800,'center','ui-monospace,monospace');
  // микрофон и лапа: кот выключает эфир
  if(u>.46){const k=seg(u,.46,.56);g.save();g.globalAlpha=k;
    const mx=620,my=1180;fill('#171a24',mx-40,my+90,300,26,13);fill('#20242f',mx,my,220,120,18);
    g.strokeStyle='#7fe0c0';g.lineWidth=6;rr(mx-8,my-8,236,136,22);g.stroke();glow(mx+110,my+60,150,'rgba(127,224,192,A)',.25);
    txt('RGB',mx+110,my+60,26,'#7fe0c0',800,'center','ui-monospace,monospace');
    cat(430,1400,.75,{t,paw:{x:250,y:-96}});
    if(Math.sin(t*6)>0){fill('#ff5a6e',mx+60,my-70,120,44,10);txt('MUTE',mx+120,my-48,28,'#fff',900,'center','ui-monospace,monospace')}
    g.restore()}
  // лесенка и спящий кот
  if(u>.72){const k=seg(u,.72,.8);g.save();g.globalAlpha=k;
    const bx=200,by=1660;
    for(let i=0;i<3;i++){fill('#4a3d55',bx+i*80,by-i*70,110,18,6);fill('#3a3044',bx+i*80+18,by-i*70,14,70,4);fill('#3a3044',bx+i*80+78,by-i*70,14,70,4)}
    fill('#2a2236',bx-40,by+70,420,26,10);
    cat(640,1620,.8,{t});txt('лесенка, чтобы запрыгивать на кровать',540,1500,24,'#8f97a6',600,'center','Georgia,serif');g.restore()}
};

// ============ 3. Мастерская ============
S.workshop=(u,t,sc)=>{
  vgrad('#141826','#0b0d16',0,H);fill('#1a1f30',0,0,W,1100);fill('#12131f',0,1100,W,820);
  g.strokeStyle='#232a3d';g.lineWidth=3;for(let x=0;x<W;x+=90){g.beginPath();g.moveTo(x,0);g.lineTo(x,1100);g.stroke()}
  const pan=ease(seg(u,0,.5));
  g.save();g.translate(-lerp(120,0,pan),0);
  // стеллаж с принтерами
  fill('#242c40',40,300,760,26,8);fill('#242c40',40,620,760,26,8);
  for(let i=0;i<3;i++){const x=70+i*240;printer(x,300,i,t);}
  for(let i=0;i<2;i++){printer(120+i*260,620,i+3,t)}
  // два на полу
  printer(120,1330,5,t);printer(430,1330,6,t);
  g.restore();
  printer(760,1330,7,t);
  txt('7 принтеров · 0 печатают',CX,1230,40,PAPER,800,'center');
  // заметки-стикеры
  for(let i=0;i<7;i++){const x=170+(i%4)*230,y=i<4?470:790;g.save();g.translate(x,y);g.rotate((hp(i*3.3)-.5)*.3);
    g.fillStyle='#f2df8b';g.fillRect(-52,-26,104,52);txt(hp(i)>.5?'ждёт деталь':'не печатает',0,0,17,'#5a4a1e',700,'center','system-ui');g.restore()}
  // велотренажёр-вешалка
  g.save();g.translate(60,1560);fill('#2b3244',-10,-160,150,20,8);fill('#2b3244',120,-160,20,170,8);fill('#2b3244',-30,10,220,18,8);
  g.beginPath();g.arc(-30,-10,66,0,TAU);g.strokeStyle='#39415a';g.lineWidth=10;g.stroke();
  g.fillStyle='#5d6a8c';rr(20,-236,150,54,16);g.fill();g.fillStyle='#46507066';g.fillRect(-10,-250,220,16);g.restore();
  txt('велотренажёр №1: вешалка',190,1420,24,'#8f97a6',600,'center','Georgia,serif');
  // гиря 16 кг, турник
  g.fillStyle='#2f3849';g.beginPath();g.arc(760,1700,44,0,TAU);g.fill();g.fillStyle='#59627a';g.beginPath();g.arc(760,1652,20,0,Math.PI,true);g.fill();
  txt('16',760,1712,30,'#c9d2e0',800,'center','ui-monospace,monospace');
  fill('#39415a',520,1420,220,16,8);fill('#39415a',540,1436,18,90,8);fill('#39415a',700,1436,18,90,8);
  if(u>.55&&u<.8){person(620,1620,1.05,{talk:false,t,arm:-.9});txt('вишу на турнике в перерывах',760,1380,24,'#8f97a6',600,'center','Georgia,serif')}
  // сервер Борис и светодиоды
  fill('#1d2334',640,330,180,280,12);
  for(let i=0;i<12;i++){const on=hp(i*4.4+Math.floor(t*3))>.45;g.fillStyle=on?'#7fe0c0':'#2b3346';g.fillRect(660+ (i%2)*70,352+Math.floor(i/2)*42,44,12)}
  txt('БОРИС',730,640,26,'#7fe0c0',800,'center','ui-monospace,monospace');
  // POS-терминалы по 2000 ₽
  for(let i=0;i<2;i++){const x=880+i*100;fill('#262d40',x,760+i*30,90,150,12);fill('#7fe0c0',x+8,772+i*30,74,110,6);g.fillStyle='#0d1018';g.fillRect(x+16,782+i*30,58,7);g.fillRect(x+16,796+i*30,40,7)}
  txt('POS-терминалы, 2 000 ₽',930,1090,22,'#8f97a6',600,'center','Georgia,serif');
  // фитолампы и цветы
  glow(940,1000,220,'rgba(170,120,255,A)',.20);g.fillStyle='#a06bff';g.fillRect(840,986,220,10);
  for(let i=0;i<4;i++){fill('#2c2233',860+i*50,1080,34,70,6);g.strokeStyle='#3f6b52';g.lineWidth=5;g.beginPath();g.moveTo(877+i*50,1086);g.quadraticCurveTo(900+i*50,1040,880+i*50,1010);g.stroke()}
  // скелет
  if(u>.62){g.save();g.globalAlpha=seg(u,.62,.7);g.translate(300,1080);g.rotate(.08);
    g.fillStyle='#e6e2d8';g.beginPath();g.arc(0,0,26,0,TAU);g.fill();g.fillRect(-6,24,12,90);g.strokeStyle='#e6e2d8';g.lineWidth=7;
    g.beginPath();g.moveTo(-30,40);g.lineTo(30,40);g.moveTo(-30,70);g.lineTo(30,70);g.moveTo(-30,100);g.lineTo(30,100);g.moveTo(-8,114);g.lineTo(-16,170);g.moveTo(8,114);g.lineTo(16,170);g.stroke();g.restore();
    txt('скелет (постоянно падает)',300,900,24,'#8f97a6',600,'center','Georgia,serif')}
};
function printer(x,y,i,t){
  const h=170+ (i%3)*20;fill('#232a3c',x,y-h,180,h,10);fill('#161c29',x+12,y-h+16,156,h-60,6);
  fill('#2f3849',x+12,y-24,156,24,8);
  g.strokeStyle='#4b5570';g.lineWidth=4;g.beginPath();g.moveTo(x+40,y-h+40);g.lineTo(x+140,y-40);g.moveTo(x+140,y-h+40);g.lineTo(x+40,y-40);g.stroke();
  g.strokeStyle='#5d6a8c';g.lineWidth=2.4;g.globalAlpha=.5;g.beginPath();for(let k=0;k<5;k++){g.moveTo(x,y-h+k*34);g.lineTo(x+180,y-h+k*34-12)}g.stroke();g.globalAlpha=1;
  const on=Math.sin(t*1.6+i)>0;g.fillStyle=on?'#7fe0c0':'#38405a';g.beginPath();g.arc(x+26,y-12,6,0,TAU);g.fill();
}

// ============ 4. Стрим ============
S.stream=(u,t,sc)=>{
  vgrad('#0d1018','#080a12',0,H);
  const build=easeOut(seg(u,0,.35));
  // рамка эфира
  g.strokeStyle='#ffffff22';g.lineWidth=4;rr(48,260,984,1180,26);g.stroke();
  fill('#101423',48,260,984,1180,26);
  // фон-«комната» внутри кадра
  g.save();rr(48,260,984,1180,26);g.clip();vgrad('#171a2b','#0c0e18',260,1440);
  glow(300,700,420,'rgba(255,190,120,A)',.16);codeLines(120,900,700,14,t,'#5f8fd0',7);g.restore();
  // «маленькое лицо» в углу
  const fk=Math.min(1,build*1.3);g.save();g.globalAlpha=fk;
  panel(742,300,246,240,16,.7);g.save();rr(742,300,246,240,16);g.clip();
  vgrad('#1d2340','#2a3352',300,540);person(865,520,.95,{talk:true,t,arm:.1});g.restore();
  g.restore();
  // чат
  const chatX=690,chatY=580;panel(chatX,chatY,300,520,16,.72);
  const msgs=[['Дима Шалаш','первый!'],['Айнс','ребятушки'],['Нетрикс','музыка громче тебя'],['Промптикс','лимиты чекни'],['Тайский перец','пу-пу-пу'],['Вивер','вайбаля'],['Папасита','+']];
  msgs.forEach((m,i)=>{const k=Math.min(1,seg(u,.16+i*.06,.2+i*.06));g.globalAlpha=k;
    txt(m[0],chatX+18,chatY+40+i*70,22,i%2?MINT:'#ffd8a0',800,'left');txt(m[1],chatX+18,chatY+68+i*70,22,'#c9d2e0',600,'left')});
  g.globalAlpha=1;
  // помидор-таймер
  const px=170,py=470,pr=86;const pv=(t*.9)%1500/1500;
  g.strokeStyle='#ffffff22';g.lineWidth=14;g.beginPath();g.arc(px,py,pr,0,TAU);g.stroke();
  g.strokeStyle=AMBER;g.lineWidth=14;g.beginPath();g.arc(px,py,pr,-Math.PI/2,-Math.PI/2+TAU*(1-pv));g.stroke();
  txt(fmtT(1500*(1-pv)),px,py,44,PAPER,800,'center','ui-monospace,monospace');txt('25 / 5',px,py+66,22,'#9aa3b2',700,'center');
  // часы, зрители, рубрика
  txt('01:47',300,640,74,PAPER,900,'left','ui-monospace,monospace');
  chip('смотрят: 34',320,700,{size:22});
  panel(60,1360,420,64,20,.5);txt('«Геймдев эксгибиционизм»',270,1392,26,'#cfd6e2',700,'center');
  // «РЕБЯТУШКИ» всплывает
  const rk=Math.min(1,seg(u,.30,.38))*(1-seg(u,.52,.62));
  if(rk>0){g.save();g.globalAlpha=rk;g.translate(CX,1180);g.rotate(-.06);g.font='900 132px system-ui,sans-serif';g.textAlign=(window.__body51_align==='mirror'?'right':'center');g.lineWidth=10;g.strokeStyle='#0b0d14';g.strokeText('РЕБЯТУШКИ',0,0);g.fillStyle='#ffd8a0';g.fillText('РЕБЯТУШКИ',0,0);g.restore()}
  // лента «дневник разработки»
  if(u>.55){const k=seg(u,.55,.65);g.save();g.globalAlpha=k;panel(120,1500,840,86,24,.6);
    txt('дневник разработки · без монтажа · без шоу',540,1544,30,PAPER,700,'center');g.restore()}
  // счётчик помидоров
  txt('~850 часов помидоров',840,1500,26,'#9aa3b2',700,'center');
  chip('Backpack Inspector · день 226',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.12)'});
};

// ============ 5. Караванщик ============
S.caravan=(u,t,sc)=>{
  vgrad('#2a1f2e','#120e18',0,1180);vgrad('#3a2a2c','#1a1016',1180,H);
  // солнце и дюны
  glow(760,520,300,'rgba(255,190,120,A)',.18);g.fillStyle='#f0a860';g.beginPath();g.arc(760,520,80,0,TAU);g.fill();
  g.fillStyle='#4a3238';g.beginPath();g.moveTo(0,1180);for(let x=0;x<=W;x+=60)g.lineTo(x,1120+Math.sin(x*.006+t*.08)*40);g.lineTo(W,H);g.lineTo(0,H);g.fill();
  g.fillStyle='#3a262c';g.beginPath();g.moveTo(0,1320);for(let x=0;x<=W;x+=60)g.lineTo(x,1280+Math.sin(x*.004-t*.06)*36);g.lineTo(W,H);g.lineTo(0,H);g.fill();
  // караван: 3 телеги + караванщик, едут справа налево
  const cx=lerp(1180,340,seg(u,.05,.95));
  for(let i=0;i<3;i++){cart(cx+i*230,1300-i*26,1-i*.12,t+i)}
  person(cx-70,1300,1.05,{talk:false,t,arm:.2,beard:true,shirt:'#7a5a3c'});
  // RPG-худ
  panel(60,300,420,300,20,.45);txt('КАРАВАНЩИК',90,346,32,PAPER,800,'left');
  txt('Open World RPG · ECS Morpeh',90,384,22,'#9aa3b2',600,'left');
  const sys=[['патрули','✓'],['экономика','✓'],['диалоги','✓'],['сохранения','✓'],['контент','…']];
  sys.forEach((s,i)=>{const k=Math.min(1,seg(u,.10+i*.09,.16+i*.09));txt(s[0],90,432+i*34,24,'#cfd6e2',600,'left');txt(s[1],440,432+i*34,24,i<4?MINT:'#ff8a8a',800,'right')});
  // папка проекта
  const fk=seg(u,.55,.75);if(fk>0){g.save();g.globalAlpha=fk;
    const fx=590,fy=700;g.fillStyle='#e0b062';rr(fx,fy,300,60,10);g.fill();g.fillStyle='#f0c878';rr(fx,fy+30,410,270,14);g.fill();
    txt('КАРАВАНЩИК',fx+205,fy+92,28,'#5a4426',800,'center');
    txt('2 года · прототипы · системы',fx+205,fy+130,22,'#6b5432',600,'center');
    txt('0 контента',fx+205,fy+216,54,'#8a2d2d',900,'center');
    // перекати-поле
    const tx=lerp(1100,600,seg(u,.6,1)),ty=1560+Math.sin(t*3)*14;g.fillStyle='#6b5a3a';g.beginPath();g.arc(tx,ty,34,0,TAU);g.fill();
    g.strokeStyle='#8a744a';g.lineWidth=3;g.beginPath();for(let k=0;k<8;k++){g.moveTo(tx,ty);g.lineTo(tx+Math.cos(k)*32,ty+Math.sin(k*1.7)*32)}g.stroke();g.restore()}
  if(u>.86)stamp(CX,1700,1,'ЗАМОРОЖЕН','#e06565',t,-.10);
  chip('«хочу релизы» — сказал он себе',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};
function cart(x,y,s,t){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle='#5a4030';rr(-90,-120,180,70,10);g.fill();
  g.fillStyle='#c8b090';g.beginPath();g.moveTo(-100,-120);g.quadraticCurveTo(0,-190,100,-120);g.lineTo(100,-116);g.lineTo(-100,-116);g.fill();
  g.strokeStyle='#3a2a1e';g.lineWidth=8;g.beginPath();g.moveTo(-90,-50);g.lineTo(-90,0);g.moveTo(90,-50);g.lineTo(90,0);g.stroke();
  for(const wx of [-90,90]){g.strokeStyle='#2a1e16';g.lineWidth=7;g.beginPath();g.arc(wx,-4,34,0,TAU);g.stroke();
    for(let k=0;k<6;k++){g.beginPath();g.moveTo(wx,-4);g.lineTo(wx+Math.cos(t*1.2+k)*32,-4+Math.sin(t*1.2+k)*32);g.stroke()}}
  g.restore();
}

// ============ 6. Директор нейронок ============
S.limits=(u,t,sc)=>{
  vgrad('#0d111c','#080a12',0,H);fill('#11141f',0,0,W,1120);
  // «диктует голосом»: микрофон Handy + волна
  const mx=180;g.fillStyle='#232a3c';rr(mx,380,120,220,60);g.fill();g.fillStyle='#3a4256';rr(mx+18,400,84,140,40);g.fill();
  g.strokeStyle=MINT;g.lineWidth=4;g.beginPath();for(let i=0;i<40;i++){const x=mx+180+i*15,a=Math.abs(Math.sin(t*3+i*.6))*(8+hp(i)*22);g.moveTo(x,570-a);g.lineTo(x,570+a)}g.stroke();
  txt('задачи диктую голосом',mx,640,28,'#cfd6e2',700,'left');
  // терминал агента
  win(120,660,840,420,'Codex',t,(x,y,w,h,tt)=>{
    const L=['> сделай мне игру про фермера','* планирую… 12 модулей','* пишу… пишу… пишу…','> МНЕ НУЖЕН ОДИН ОТЧЁТ','* готово. отчёт в двух словах.'];
    L.forEach((s,i)=>{const k=Math.min(1,seg(tt%9,i*.7,i*.7+.5));g.globalAlpha=k;txt(s,x,y+30+i*56,26,i===3?'#ffd8a0':'#7fe0c0',700,'left','ui-monospace,monospace')});g.globalAlpha=1});
  // шкала лимитов
  const vault=.74;txt('недельные лимиты',132,1152,26,'#cfd6e2',700,'left');txt('11 часов до сброса',948,1152,26,'#9aa3b2',700,'right');
  gauge(120,1186,840,40,vault,'#ffc06a');
  txt('миллиарды токенов за три месяца',948,1112,26,'#9aa3b2',700,'right');
  // труба сливает токены в «Городок»
  if(u>.35&&u<.74){const k=seg(u,.35,.42)*(1-seg(u,.68,.74));g.save();g.globalAlpha=k;
    g.strokeStyle='#3a4256';g.lineWidth=24;g.beginPath();g.moveTo(220,1240);g.quadraticCurveTo(480,1330,660,1420);g.stroke();
    for(let i=0;i<26;i++){const p=(t*.35+i*.05)%1;const px=lerp(220,660,p),py=lerp(1240,1420,p)+Math.sin(p*20)*16;
      g.fillStyle=`rgba(127,224,192,${.25+.5*(1-p)})`;g.beginPath();g.arc(px,py,4+hp(i)*5,0,TAU);g.fill()}
    for(let i=0;i<9;i++){const x=600+i*50,h=40+hp(i*3.3)*90;g.fillStyle='#1c2233';g.fillRect(x,1560-h,38,h);
      g.fillStyle=hp(i*5.5+Math.floor(t*2))>.5?'#ffc06a':'#2a3244';g.fillRect(x+8,1560-h+14,10,14);g.fillRect(x+22,1560-h+14,10,14)}
    txt('«Городок» — проект-помойка для лимитов',CX,1600,26,'#cfd6e2',700,'center');g.restore()}
  // две нейронки: «когда меняешь нейронку — будто девушке изменяешь»
  if(u>.70){const k=seg(u,.70,.78);g.save();g.globalAlpha=k;
    panel(150,1380,340,200,18,.72);txt('CODEX',320,1418,34,'#7fe0c0',900,'center','ui-monospace,monospace');txt('«бывшая»',320,1462,24,'#9aa3b2',600,'center');
    panel(590,1380,340,200,18,.72);txt('CLAUDE',760,1418,34,'#ffd8a0',900,'center','ui-monospace,monospace');txt('новая подписка',760,1462,24,'#9aa3b2',600,'center');
    [320,760].forEach((x,i)=>{for(let q=0;q<7;q++){const px=x-24+q*9,py=1510+Math.sin(t*3+q)*4;g.fillStyle=i?'#ffd8a0':'#7fe0c0';g.beginPath();g.moveTo(px,py);g.lineTo(px+7,py-20-((q%2)*10));g.lineTo(px+7,py-11);g.lineTo(px+13,py-30-((q%3)*8));g.lineTo(px+6,py-6);g.lineTo(px+14,py);g.fill()}});
    const hb=560+Math.sin(t*4)*8;g.fillStyle='#e06565';g.beginPath();g.moveTo(hb,1560);g.bezierCurveTo(hb-40,1520,hb-30,1480,hb,1488);g.bezierCurveTo(hb+30,1480,hb+40,1520,hb,1560);g.fill();
    txt('«измена»',560,1590,24,'#ffb0b0',700,'center');g.restore()}
  // подпись у терминала
  chip('мне нужен ОДИН отчёт',120,930,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};

// ============ 7. Гэг-перебивка ============
S.gag=(u,t,sc)=>{
  vgrad('#12101c','#08070e',0,H);
  const d=sc.dur,tt=t-sc.start;
  if(tt<d*.36){ // квадратный деревянный меч
    g.save();g.translate(CX,900);g.rotate(Math.sin(t*1.2)*.05);
    g.fillStyle='#8a6238';g.fillRect(-330,-250,660,120);g.fillRect(-40,-130,80,300);
    g.strokeStyle='#c89a5c';g.lineWidth=6;g.strokeRect(-330,-250,660,120);g.beginPath();g.moveTo(-250,-190);g.lineTo(250,-190);g.stroke();
    g.restore();
    txt('деревянный и квадратный',CX,1190,34,'#c89a5c',700,'center');
    txt('CODE-GENERATED ASSET',CX,520,26,'#6f7a8c',700,'center','ui-monospace,monospace');
    stamp(CX,1420,.9,'ВАЙБАЛЯ','#ffd8a0',t);}
  else if(tt<d*.7){ // кости мигрируют с рукояти на молот
    const k=seg(tt,d*.36,d*.66);
    g.save();g.translate(CX,880);
    g.fillStyle='#8a6238';g.fillRect(-40,-40,80,420);g.fillStyle='#9aa3b2';g.fillRect(-260,-260,520,220);
    for(let i=0;i<5;i++){const p=Math.min(1,seg(k,i*.12,i*.12+.5));const y=lerp(360,-140,p),x=lerp(-30,120,p*1);
      g.fillStyle='#e6e2d8';rr(x,y,120,26,12);g.fill();g.beginPath();g.arc(x,y+13,12,0,TAU);g.arc(x+120,y+13,12,0,TAU);g.fill()}
    g.restore();
    txt('кости молота мигрируют',CX,1210,40,PAPER,800,'center');
    chip('они не должны там быть',CX,1280,{size:24,col:MINT,center:true});}
  else { // руны, свисающие с колокола
    const k=seg(tt,d*.7,d*.95);
    g.save();g.translate(CX,880);g.rotate(Math.sin(t*1.4)*.04);
    g.fillStyle='#b08a3a';g.beginPath();g.moveTo(-180,-120);g.quadraticCurveTo(0,220,180,-120);g.closePath();g.fill();
    g.fillStyle='#8a6a28';rr(-40,-220,80,110,14);g.fill();
    for(let i=0;i<6;i++){const x=-140+i*56,y=40+hp(i*3.3)*120;g.strokeStyle='#e0c060';g.lineWidth=5;
      g.beginPath();g.moveTo(x,-70);g.lineTo(x+ (hp(i)>.5?14:-14),y);g.stroke();g.fillStyle='#e0c060';g.beginPath();g.arc(x,y+10,9,0,TAU);g.fill()}
    g.restore();
    stamp(CX,1470,.85,'НЕ ТО','#e06565',t,.08);}
  g.save();g.globalAlpha=.9;chip('перебивка · без рассказчика',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});g.restore();
};

// ============ 8. Выгорание ============
S.burnout=(u,t,sc)=>{
  polarNight(t,{aurora:.35,moon:.6});
  room(t,{code:'#5f7090',speed:2.5});
  // 99% и холодный кофе
  const k=seg(u,0,.5);const pv=lerp(0,.99,easeOut(k));
  g.strokeStyle='#ffffff22';g.lineWidth=14;g.beginPath();g.arc(800,1210,86,0,TAU);g.stroke();
  g.strokeStyle='#7f9fd0';g.lineWidth=14;g.beginPath();g.arc(800,1210,86,-Math.PI/2,-Math.PI/2+TAU*pv);g.stroke();
  txt(Math.round(pv*100)+'%',800,1210,44,PAPER,900,'center','ui-monospace,monospace');
  txt('думает'+'.'.repeat(1+Math.floor(t*2)%3),800,1330,24,'#8f97a6',600,'center');
  txt('04:12',300,1230,54,'#cfd6e2',900,'center','ui-monospace,monospace');
  fill('#2a2230',250,1300,80,100,10);fill('#161a24',258,1248,64,58,8);
  txt('кофе остыл',290,1440,22,'#8f97a6',600,'center','Georgia,serif');
  if(u>.42&&u<.56){const ik=seg(u,.42,.46)*(1-seg(u,.52,.56));g.save();g.globalAlpha=ik;
    g.strokeStyle='#ffd8a0';g.lineWidth=6;g.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU;g.moveTo(800+Math.cos(a)*60,1060+Math.sin(a)*40);g.lineTo(800+Math.cos(a)*110,1060+Math.sin(a)*80)}g.stroke();g.restore()}
  // крупные титры: строки не пересекаются, каждая на своём уровне
  const big=(st,arr,size,col,y0)=>{const k3=Math.min(1,seg(u,st,st+.05))*(1-seg(u,st+.15,st+.20));if(k3<=0)return;
    g.save();g.globalAlpha=k3;
    arr.forEach((p,i)=>{const y=y0+i*size*1.25;txt(p,CX,y,size,col,900,'center')});
    g.restore()};
  big(.46,['Я ПОНЯЛ, ЧТО Я ВЫГОРЕЛ'],52,'#cfd6e2',600);
  big(.54,['НО КОДЕКС-ТО С КАКОГО','ХУЯ ВЫГОРЕЛ,'],50,'#ffd8a0',710);
  big(.63,['ЖЕЛЕЗЯКА?'],82,AMBER,940);
  big(.72,['ВРУБАЙСЯ ДАВАЙ'],68,'#ff9f5a',1060);
  // сгорбленный человек внизу слева
  if(u<.8)person(210,1560,1.2,{talk:false,t,arm:.5,slump:true});
  // терминал оживает
  if(u>.78){const k4=seg(u,.78,.86);g.save();g.globalAlpha=k4;
    win(140,1150,800,390,'Codex',t+3,(x,y,w,h,tt)=>{codeLines(x,y,w,12,tt,'#7fe0c0',26);txt('* врубился',x+6,y+300,28,MINT,800,'left','ui-monospace,monospace')});g.restore()}
  chip('стрим #021 · 4 утра',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};

// ============ 9. Релиз ============
S.release=(u,t,sc)=>{
  vgrad('#101426','#080a12',0,H);
  // рабочий стол, на нём растёт игра
  fill('#161b2c',0,420,W,1180);
  for(let i=0;i<6;i++){const x=90+i*160;g.fillStyle='#222a3f';rr(x,1480,120,150,14);g.fill();g.fillStyle='#2c3550';rr(x+12,1492,96,70,8);g.fill()}
  txt('рабочий стол',CX,300,30,'#8f97a6',700,'center');
  // фермерская грядка внутри окна
  const gk=easeOut(seg(u,0,.4));
  win(120,380,840,620,'Desktop Hellfarmer',t,(x,y,w,h,tt)=>{
    fill('#241d2c',x,y,w,h,12);
    for(let r=0;r<5;r++)for(let c=0;c<7;c++){const px=x+40+c*104,py=y+80+r*100;g.fillStyle='#3a2f3f';rr(px,py,84,74,10);g.fill();
      const gr=clamp((tt%6)/6*c/7+r*.1);g.fillStyle='#5fbf7a';g.fillRect(px+26,py+34-gr*26,10,26+gr*20);g.fillRect(px+46,py+30-gr*30,10,30+gr*22)}
    txt('«я ничего не делаю — оно продаётся»',x+w/2,y+h-30,24,'#9aa3b2',600,'center','Georgia,serif')});
  // кнопка «опубликовать» и отсчёт
  const bx=280,by=1160,bw=520,bh=110;const pressed=u>.34;
  fill(pressed?'#3f7f5f':'#2a5f46',bx,by,bw,bh,24);glow(bx+bw/2,by+bh/2,220,'rgba(120,240,180,A)',pressed?.3:.12);
  txt(pressed?'ОПУБЛИКОВАНО':'ОПУБЛИКОВАТЬ',bx+bw/2,by+bh/2,38,'#eafff2',900,'center');
  txt('до полуночи: 00:0'+Math.max(1,Math.floor(9-u*8)),CX,1310,30,'#cfd6e2',700,'center','ui-monospace,monospace');
  if(u>.36){const k=seg(u,.36,.42);g.save();g.globalAlpha=k;
    for(let i=0;i<70;i++){const p=(t*.6+hp(i)*1.2)%1.4;const x=CX+(hp(i*3.3)-.5)*(300+p*900),y=1000+p*700+hp(i*5.7)*200;
      g.save();g.translate(x,y);g.rotate(p*10+i);g.fillStyle=[AMBER,MINT,'#ff8fb0','#9fd8ff'][i%4];g.fillRect(-10,-16,20,32);g.restore()}
    g.restore()}
  // под реплику про «девственность» приглушаем сцену, чтобы титр читался
  const qk=Math.min(1,seg(u,.52,.56))*(1-seg(u,.84,.88));
  if(qk>0){g.save();g.globalAlpha=.66*qk;fill('#05060a',0,0,W,H);g.restore()}
  // капсула игры и счётчик копий
  if(u>.46){const k=seg(u,.46,.54);g.save();g.globalAlpha=k;
    fill('#1a2030',320,1240,440,290,18);g.strokeStyle='#ffc06a66';g.lineWidth=4;rr(320,1240,440,290,18);g.stroke();
    txt('DESKTOP',540,1306,42,PAPER,900,'center');txt('HELLFARMER',540,1356,42,'#7fe0c0',900,'center');
    txt('фермер на рабочем столе',540,1408,24,'#9aa3b2',600,'center');
    g.fillStyle='#ff6b6b';g.beginPath();g.arc(410,1462,9,0,TAU);g.fill();glow(410,1462,44,'rgba(255,107,107,A)',.4);
    txt('первые продажи — Япония',600,1462,26,AMBER,700,'center');
    txt('копии: '+Math.round(lerp(1,207,easeOut(seg(u,.60,.95)))),540,1508,34,PAPER,900,'center','ui-monospace,monospace');
    g.restore()}
  txt('два месяца вайбкода и $20 подписки',CX,1580,24,'#8f97a6',600,'center');
  chip('релиз 30 июня · прямо в стриме',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};

// ============ 10. Рюкзаки и вишлисты ============
S.wishlist=(u,t,sc)=>{
  vgrad('#1a1526','#0b0a12',0,H);
  // график вишлистов
  const gx=120,gy=410,gw=840,gh=310;panel(gx,gy,gw,gh,20,.5);
  txt('вишлисты Backpack Inspector',gx+gw/2,gy+36,26,'#9aa3b2',700,'center');
  const pt=(v)=>[gx+50+(v/14000)*gw*.9, gy+gh-50-Math.pow(v/14000,.5)*gh*.62];
  g.strokeStyle='#ffffff22';g.lineWidth=3;g.beginPath();g.moveTo(pt(0)[0],pt(0)[1]);g.lineTo(pt(14000)[0],pt(14000)[1]);g.stroke();
  const dp=clamp(seg(u,.10,.62));const cur=dp<.45?lerp(500,4500,dp/.45):lerp(4500,13500,(dp-.45)/.55);
  const pts=cur<=4500?[[500,0],[cur,1]]:[[500,0],[4500,1],[cur,1]];
  g.strokeStyle=AMBER;g.lineWidth=8;g.beginPath();let started=false;
  for(const [v] of pts){const p=pt(v);if(!started){g.moveTo(p[0],p[1]);started=true}else g.lineTo(p[0],p[1])}
  g.stroke();
  if(dp>0){const lbl=cur<1000?'500 вишлистов':Math.round(cur).toLocaleString('ru-RU').replace(/\u00a0/g,' ')+' вишлистов';
    txt(lbl,CX,gy+gh+50,30,AMBER,800,'center');}
  // календарь Steam горит (слева, под графиком)
  if(u>.34){const k=seg(u,.34,.42);g.save();g.globalAlpha=k;
    fill('#f3efe6',120,930,340,320,14);
    txt('РЕЛИЗНЫЙ КАЛЕНДАРЬ',290,968,24,'#3a3226',800,'center','ui-monospace,monospace');
    for(let w=0;w<5;w++)for(let d=0;d<4;d++){g.fillStyle=(w===3&&d===2)?'#e06565':'#d8d2c4';g.fillRect(146+w*60,996+d*58,48,42)}
    txt('24 авг',290,996+4*58+16,22,'#8a2d2d',800,'center');
    for(let i=0;i<16;i++){const p=(t*.7+i*.12)%1.2;if(p>1)continue;const x=290+(hp(i)-.5)*190,y=1250-p*420-40;g.fillStyle=`rgba(255,${120+hp(i)*80|0},60,${1.1-p})`;g.beginPath();g.arc(x,y,8+hp(i*3.3)*10,0,TAU);g.fill()}
    g.restore()}
  // таможенный пост: офицер и рюкзак
  fill('#241b2c',0,1330,W,590);fill('#2b2134',0,1310,W,26);
  person(210,1580,1.25,{talk:false,t,arm:.9,shirt:'#4a5f8f',beard:true});
  const bagx=520,bagy=1270;
  fill('#6b5a3c',bagx,bagy,240,220,26);fill('#7d6a48',bagx+20,bagy-40,200,70,20);
  g.strokeStyle='#4a3d28';g.lineWidth=6;rr(bagx,bagy,240,220,26);g.stroke();
  const cx2=bagx+120,cy=bagy+90;
  for(let i=0;i<7;i++){const k=(t*.5+i*.14)%1.4;if(k>1.05)continue;
    const a=-1.1+i*.36,dist=60+k*440,x=cx2+Math.cos(a)*dist,y=cy+Math.sin(a)*dist-120*k;
    g.save();g.translate(x,y);g.rotate(k*4+i);g.globalAlpha=1.05-k;item(i);g.restore()}
  g.globalAlpha=1;
  txt('«Papers, Please» про фэнтези: шмонаю рюкзаки',CX,880,26,'#cfd6e2',700,'center','Georgia,serif');
  // письма издателей
  if(u>.62){const k=seg(u,.62,.72);g.save();g.globalAlpha=k;
    for(let i=0;i<2;i++){const x=900,y=lerp(1900,1500-i*220,easeOut(seg(u,.62+i*.1,.8+i*.1)));g.save();g.translate(x,y);g.rotate((i?.06:-.05));
      g.fillStyle='#efe6d2';g.fillRect(-130,-74,260,148);g.strokeStyle='#c9bfa6';g.lineWidth=4;g.strokeRect(-130,-74,260,148);
      g.beginPath();g.moveTo(-130,-74);g.lineTo(0,8);g.lineTo(130,-74);g.stroke();
      g.fillStyle='#8a2d2d';g.beginPath();g.arc(0,22,22,0,TAU);g.fill();txt('✉',0,22,22,'#efe6d2',800,'center');
      txt(i?'издатель №2':'издатель №1',0,78,24,'#3f3a2e',800,'center');g.restore()}
    g.restore()}
  chip('день 300 · три проекта разом',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};
function item(i){
  const cols=['#c8b0ff','#ffb0b0','#a8ebc2','#ffd8a0','#9fd8ff','#e0c060','#ff8fb0'];
  g.fillStyle=cols[i%cols.length];
  if(i%3===0){g.fillRect(-46,-10,92,20);g.fillRect(-8,-34,16,68)}
  else if(i%3===1){g.beginPath();g.arc(0,4,30,0,TAU);g.fill();g.fillRect(-10,-46,20,26)}
  else {g.beginPath();g.moveTo(0,-38);g.lineTo(38,26);g.lineTo(-38,26);g.closePath();g.fill()}
}

// ============ 11. Финал ============
S.finale=(u,t,sc)=>{
  polarNight(t,{aurora:1,moon:.8});
  room(t,{code:'#7fe0c0',speed:6});
  person(300,1170,1.3,{talk:false,t,arm:.3});cat(900,1070,.8,{t});
  // полка с тремя коробками
  const sx=120,sy=520;fill('#2a2233',sx,sy,600,18,6);
  const box=[['BACKPACK','INSPECTOR','#ffd8a0'],['DESKTOP','HELLFARMER','#7fe0c0'],['БЕЛЫЙ','МЕРИДИАН','#b0a0ff']];
  box.forEach((b,i)=>{const x=sx+20+i*196,y=sy-96;fill('#1d2334',x,y,170,96,10);
    g.strokeStyle=b[2]+'88';g.lineWidth=3;rr(x,y,170,96,10);g.stroke();
    txt(b[0],x+85,y+34,20,b[2],800,'center');txt(b[1],x+85,y+60,20,PAPER,800,'center');
    txt(['в разработке','релиз ✓','заморожен'][i]||'',x+85,y+80,14,'#9aa3b2',600,'center')});
  txt('в описании канала — три игры',CX,420,28,'#cfd6e2',700,'center');
  // дорога и караван вдаль
  if(u>.42){const k=seg(u,.42,.5);g.save();g.globalAlpha=k;
    g.fillStyle='#2a2233';g.beginPath();g.moveTo(700,1500);g.lineTo(940,1500);g.lineTo(820,1180);g.lineTo(760,1180);g.closePath();g.fill();
    cart(820,1300,.30,t);cart(790,1420,.5,t+1);g.restore()}
  // финальная карточка (после реплик)
  const k2=Math.min(1,seg(u,.74,.82));
  if(k2>0){g.save();g.globalAlpha=k2*.9;fill('#05060a',0,0,W,H);g.globalAlpha=k2;
    txt('ГЛАВНОЕ — ДОДЕЛЫВАТЬ',CX,838,58,PAPER,900,'center');
    txt('И ДОВОДИТЬ ДО РЕЛИЗА',CX,918,52,AMBER,900,'center');
    txt('— Артём, стрим #200',CX,1032,30,'#9aa3b2',700,'center','Georgia,serif');
    txt('продолжение следует',CX,1240,34,MINT,800,'center');
    g.restore()}
  chip('стрим каждый будний день',60,244,{size:22,col:MINT,bg:'rgba(127,224,192,.10)'});
};

// ============ 12. Источники ============
S.credits=(u,t,sc)=>{
  vgrad('#0b0e18','#06070c',0,H);
  txt('СОБРАНО ПО ФАКТАМ',CX,420,40,MINT,800,'center','ui-monospace,monospace');
  txt('473 стрима · 380 конспектов · 533 часа субтитров',CX,486,30,'#cfd6e2',700,'center');
  const src=[['#008 · 7 принтеров, ни один не печатает'],['#015 · «заработал свои миллионы»'],['#019 · 13 500 вишлистов за неделю'],['#021 · «выгорел? железяка, врубайся»'],['#048 · 99% кода — нейронкой'],['#057 · Айнс и мобильное приложение'],['#065 · релизная девственность'],['#073 · токеновый мультимиллионер'],['#174 · настоящий девлог, не шоу'],['#192 · полярная ночь и 20 часов тьмы'],['#200 · «доводить до релиза»'],['#440 · кот, миска и Валера'],['#462 · лесенка для Гуччи'],['#473 · «куча систем, ноль контента»']];
  src.forEach((s,i)=>{const k=Math.min(1,seg(u,.08+i*.025,.14+i*.025));g.globalAlpha=k;txt(s[0],120,590+i*48,26,'#cfd6e2',700,'left');g.globalAlpha=1});
  g.globalAlpha=1;
  panel(120,1420,840,220,20,.5);
  txt('Картинка и музыка — код. Голос за кадром — рассказчик.',CX,1480,26,'#9aa3b2',700,'center');
  txt('Реплики Артёма — дословно по субтитрам стримов.',CX,1520,26,'#9aa3b2',700,'center');
  txt('Это фанатский мультик, а не нарезка стримов.',CX,1560,26,'#9aa3b2',700,'center');
  txt('спасибо, ребятушки',CX,1660,52,AMBER,900,'center');
  txt('телеграм: @body51 · twitch: body51',CX,1740,28,MINT,700,'center','ui-monospace,monospace');
};

B.SCENES=S;
})();
