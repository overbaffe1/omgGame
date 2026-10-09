/* body51-day.js — «ОДИН ДЕНЬ ВАЙБКОДЕРА»: дневная нарезка «Вайбкодера из Мурманска».
   Грузится ТОЛЬКО страницей body51-day.html и рендером --cut day (до body51-film.js —
   он задаёт заголовки глав и тексты плашек). Полную и минутную версии не трогает.
   Сцены переиспользуют геометрию S3, но камера шире, а 2D-панели с текстом расставлены
   так, чтобы НЕ выходить за кадр; panels.safe — квады, которые бережёт безопасный наезд. */
(function(){
const W=1080,H=1920;

window.BODY51_DAY_META={
  polar:{title:'07:00 · Подъём',fact:'#192 · #463'},
  cat:{title:'07:20 · Завтрак с Гуччи',fact:'#440 · #457'},
  workshop:{title:'13:00 · Перерывчик',fact:'#018 · #186'},
  stream:{title:'19:00 · Стрим',fact:'#022 · #174'},
  limits:{title:'23:00 · Директор нейронок',fact:'#073 · #008'},
  burnout:{title:'04:07 · Железяка, врубайся',fact:'#021'},
  release:{title:'Релиз · до полуночи',fact:'#004 · #065'},
};
window.BODY51_CUT_META={
  badge:'⚡ ОДИН ДЕНЬ ВАЙБКОДЕРА',
  sub1:'Мурманск · полярная ночь · кот Гуччи и Валера',
  sub2:'7 глав · по фактам 473 стримов',
  cardTitle:'ИТОГО ЗА ДЕНЬ',
  rows:[['7 принтеров','0 печатают'],
        ['перерывчик','турник'],
        ['10 лет без релизов','релиз за 2 месяца',1]],
  foot1:'@body51 · стримы каждый будний вечер',
  foot2:'полная версия — 12 глав, 3:55',
};

const DAY={scenes:{},panels:{}};
window.DAY3=DAY;
const Q=(x0,y0,x1,y1,z)=>[{x:x0,y:y0,z:z},{x:x1,y:y0,z:z},{x:x1,y:y1,z:z},{x:x0,y:y1,z:z}];
const B=()=>window.B3;

// ---------- компактные 2D-панели ----------
function codeScreen(gg,w,h,t,lines,col){
  col=col||'#7fe0c0';
  gg.fillStyle='#0b1018';gg.fillRect(0,0,w,h);
  gg.fillStyle='#121826';gg.fillRect(0,0,w,44);
  gg.fillStyle='#ff6b6b';gg.beginPath();gg.arc(22,22,7,0,7);gg.fill();
  gg.fillStyle='#ffc46b';gg.beginPath();gg.arc(44,22,7,0,7);gg.fill();
  gg.fillStyle='#7ee08a';gg.beginPath();gg.arc(66,22,7,0,7);gg.fill();
  gg.font='600 24px ui-monospace,monospace';gg.fillStyle=col;
  lines.forEach((s,i)=>{const k=Math.min(1,((t*0.55)%7-i*0.55)/0.4);if(k<=0)return;
    gg.globalAlpha=Math.min(1,k);gg.fillText(s,30,110+i*52);gg.globalAlpha=1});
}
function chatScreen(gg,w,h,t){
  gg.fillStyle='#0d0f18';gg.fillRect(0,0,w,h);
  gg.font='700 24px system-ui,sans-serif';
  const msgs=[['Дима Шалаш','первый!'],['Айнс','ребятушки'],['Нетрикс','музыка громче тебя'],
              ['Промптикс','лимиты чекни'],['Тайский перец','пу-пу-пу'],['Вивер','вайбаля']];
  msgs.forEach((m,i)=>{const k=Math.min(1,((t*0.35)%12-i*0.9)/0.5);if(k<=0)return;
    gg.globalAlpha=Math.min(1,k);
    gg.fillStyle=i%2?'#7fe0c0':'#ffd8a0';gg.fillText(m[0],24,60+i*72);
    gg.fillStyle='#c9d2e0';gg.font='600 22px system-ui,sans-serif';gg.fillText(m[1],24,88+i*72);
    gg.font='700 24px system-ui,sans-serif';gg.globalAlpha=1});
}
function gaugeScreen(gg,w,h,t,v,label,sub){
  gg.fillStyle='#0c1220';gg.fillRect(0,0,w,h);
  gg.fillStyle='#cfd6e2';gg.font='700 26px system-ui,sans-serif';gg.fillText(label,26,52);
  gg.fillStyle='#33404f';gg.fillRect(26,84,w-52,34);
  const gr=gg.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#7fe0c0');gr.addColorStop(1,'#ffc06a');
  gg.fillStyle=gr;gg.fillRect(26,84,(w-52)*v,34);
  gg.fillStyle='#f2eee4';gg.font='900 52px ui-monospace,monospace';gg.fillText(Math.round(v*100)+'%',26,180);
  gg.fillStyle='#9aa3b2';gg.font='600 22px system-ui,sans-serif';gg.fillText(sub,26,222);
}
function eyeScreen(gg,w,h,t){
  gg.fillStyle='#0b1220';gg.fillRect(0,0,w,h);
  const cx=w*0.5,cy=h*0.44,R=h*0.34;
  gg.fillStyle='#e8eef8';gg.beginPath();gg.ellipse(cx,cy,R*1.5,R,0,0,7);gg.fill();
  gg.fillStyle='#20304e';gg.beginPath();gg.arc(cx,cy,R*0.62,0,7);gg.fill();
  const a=Math.sin(t*0.6)*0.5;
  gg.fillStyle='#7fe0c0';gg.beginPath();gg.arc(cx+Math.cos(a)*R*0.3,cy+Math.sin(a)*0.22*R,R*0.3,0,7);gg.fill();
  gg.fillStyle='#0b1220';gg.beginPath();gg.arc(cx+Math.cos(a)*R*0.36,cy+Math.sin(a)*0.26*R,R*0.13,0,7);gg.fill();
  gg.fillStyle='#9fd8ff';gg.font='700 22px ui-monospace,monospace';gg.fillText('ДИРЕКТОР НЕЙРОНОК · смотрит',20,h-18);
}
function gameScreen(gg,w,h,t){
  gg.fillStyle='#101828';gg.fillRect(0,0,w,h);
  gg.fillStyle='#171f31';gg.fillRect(0,0,w,44);
  gg.fillStyle='#9aa3b2';gg.font='600 22px system-ui,sans-serif';gg.fillText('Desktop Hellfarmer · рабочий стол',16,30);
  for(let r=0;r<3;r++)for(let c=0;c<6;c++){
    const x=20+c*(w-40)/6,y=60+r*(h-90)/3;
    gg.fillStyle='#241d2c';gg.beginPath();gg.roundRect(x+4,y+4,(w-40)/6-8,(h-90)/3-8,8);gg.fill();
    const grow=Math.min(1,((t*0.6+r*0.2+c*0.1)%4)/2);
    gg.fillStyle='#5fbf7a';gg.fillRect(x+16,y+((h-90)/3)-20-grow*18,10,14+grow*18);
    gg.fillRect(x+32,y+((h-90)/3)-16-grow*22,10,12+grow*22);}
  gg.fillStyle='#ffd8a0';gg.font='600 22px system-ui,sans-serif';gg.fillText('я ничего не делаю — оно продаётся',20,h-12);
}

// ---------- человек на турнике (перерывчик) ----------
function hangPerson(sc,x,ybar,z,t){
  const b=B();
  const sway=Math.sin(t*1.4)*0.05+Math.sin(t*0.53)*0.03;
  const grip=b.mMul(b.mTrans(x,ybar,z),b.mRotZ(sway));
  const skin='#f0cdb0',shirt='#5d7fb8',pants='#2c3450';
  for(const s of[-1,1]){
    const arm=b.mMul(grip,b.mMul(b.mTrans(s*0.17,0,0),b.mRotZ(s*0.10)));
    sc.add(b.prism(7,0.05,0.5,shirt),b.mMul(arm,b.mTrans(0,-0.25,0)));
  }
  const torso=b.mMul(grip,b.mTrans(0,-0.78,0));
  sc.add(b.box(0.44,0.6,0.24,shirt),torso);
  sc.add(b.prism(8,0.06,0.09,skin),b.mMul(torso,b.mTrans(0,0.34,0)));
  sc.add(b.sphere(7,10,0.15,skin),b.mMul(torso,b.mTrans(0,0.5,0)));
  sc.add(b.sphere(6,9,0.155,'#8a6a4a'),b.mMul(b.mMul(torso,b.mTrans(0,0.57,0)),b.mScale(1,0.55,1)));
  for(const s of[-1,1]){
    const leg=b.mMul(torso,b.mMul(b.mTrans(s*0.12,-0.42,0),b.mRotX(0.55+Math.sin(t*1.4+s)*0.07)));
    sc.add(b.prism(7,0.07,0.6,pants),b.mMul(leg,b.mTrans(0,-0.3,0)));
    const shin=b.mMul(leg,b.mMul(b.mTrans(0,-0.6,0),b.mRotX(0.95)));
    sc.add(b.prism(7,0.06,0.48,pants),b.mMul(shin,b.mTrans(0,-0.24,0)));
    sc.add(b.box(0.14,0.08,0.26,'#1b1f2c'),b.mMul(shin,b.mTrans(0,-0.48,0.02)));
  }
}

// ================= сцены: та же геометрия S3, но шире кадр =================
DAY.scenes.polar=(sc,u,t)=>{
  const pan=(window.S3.polar(sc,u,t))||{};
  // камера оригинала: медленный наезд на тёплое окно — оставляем, бережём окно при наезде
  pan.safe=pan.winQuad?[pan.winQuad]:[];
  return pan;
};
DAY.scenes.cat=(sc,u,t)=>{
  const b=B(),pan=(window.S3.cat(sc,u,t))||{};
  const d=b.lerp(5.5,4.6,u);
  sc.camera(b.v3(0.25+Math.sin(0.35+u*0.35)*d*0.85,b.lerp(1.8,1.55,u),-0.7+Math.cos(0.35+u*0.35)*d*0.72),
            b.v3(-0.3,b.lerp(1.05,1.1,u),-1.45),b.lerp(58,54,u));
  pan.mu=Q(-0.95,2.02,0.55,1.52,-3.30);
  pan.safe=[pan.mu];
  return pan;
};
DAY.scenes.workshop=(sc,u,t)=>{
  const b=B(),pan=(window.S3.workshop(sc,u,t))||{};
  // турник у задней стены + Артём висит (перерывчик)
  const barY=2.55;
  sc.add(b.box(0.09,0.5,0.09,'#39415a'),b.mTrans(-1.66,barY-0.12,-2.52));
  sc.add(b.box(0.09,0.5,0.09,'#39415a'),b.mTrans(-0.02,barY-0.12,-2.52));
  sc.add(b.prism(10,0.045,1.8,'#59627a'),b.mMul(b.mTrans(-0.84,barY,-2.44),b.mRotZ(Math.PI/2)));
  hangPerson(sc,-0.84,barY,-2.38,t);
  const a=b.lerp(-0.28,0.28,u),r=b.lerp(5.4,4.6,u);
  sc.camera(b.v3(Math.sin(a)*r+0.35,b.lerp(2.0,1.7,u),Math.cos(a)*r-1.4),
            b.v3(0.25,b.lerp(1.6,1.5,u),-1.9),b.lerp(60,56,u));
  pan.note=Q(-1.35,2.98,-0.45,2.62,-2.3);
  pan.safe=[pan.note];
  if(pan.monitor)pan.safe.push(pan.monitor);
  return pan;
};
DAY.scenes.stream=(sc,u,t)=>{
  const b=B(),pan=(window.S3.stream(sc,u,t))||{};
  const a=b.lerp(0.75,0.45,u),r=b.lerp(4.6,4.1,u);
  sc.camera(b.v3(Math.sin(a)*r,b.lerp(1.9,1.7,u),0.6+Math.cos(a)*r*0.6),b.v3(0.15,1.5,-1.6),b.lerp(60,57,u));
  pan.mb=Q(-0.5,1.62,0.5,1.06,-1.55);
  pan.safe=[pan.mb];
  if(pan.monitor)pan.safe.push(pan.monitor);
  return pan;
};
DAY.scenes.limits=(sc,u,t)=>{
  const b=B(),pan=(window.S3.limits(sc,u,t))||{};
  const a=b.lerp(-0.10,0.20,u),r=b.lerp(4.1,3.7,u);
  sc.camera(b.v3(-0.25+Math.sin(a)*r,b.lerp(2.05,1.85,u),-0.35+Math.cos(a)*r),
            b.v3(-0.05,b.lerp(1.85,1.72,u),-2.0),b.lerp(62,58,u));
  const st=pan.screens||[];
  pan.safe=[];
  if(st[0])pan.safe.push(st[0].quad);
  if(st[2])pan.safe.push(st[2].quad);
  return pan;
};
DAY.scenes.burnout=(sc,u,t)=>{
  const b=B(),pan=(window.S3.burnout(sc,u,t))||{};
  const d=b.lerp(4.1,3.4,u);
  sc.camera(b.v3(0.5+Math.sin(u*0.4)*0.4,b.lerp(1.9,1.7,u),0.3+d*0.8),
            b.v3(0.35,b.lerp(1.5,1.42,u),-1.7),b.lerp(60,57,u));
  pan.safe=[pan.monitor].filter(Boolean);
  return pan;
};
DAY.scenes.release=(sc,u,t)=>{
  const b=B(),pan=(window.S3.release(sc,u,t))||{};
  const a=b.lerp(-0.15,0.35,u),r=b.lerp(4.3,3.7,u);
  sc.camera(b.v3(Math.sin(a)*r,b.lerp(2.15,1.95,u),Math.cos(a)*r),b.v3(0,b.lerp(1.75,1.66,u),-1.4),b.lerp(58,54,u));
  pan.cap=Q(-1.15,1.4,0.25,0.55,-1.34);
  pan.safe=[pan.cap];
  if(pan.win)pan.safe.push(pan.win);
  return pan;
};

// ================= 2D-панели дневной версии (всё в кадре) =================
DAY.panels.polar=(sc,pan)=>{
  if(!pan.winQuad)return;
  sc.screen(pan.winQuad,320,340,(gg,w,h)=>{
    const gr=gg.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#4a2f12');gr.addColorStop(1,'#1d1206');
    gg.fillStyle=gr;gg.fillRect(0,0,w,h);
    gg.fillStyle='#ffcf8a';gg.beginPath();gg.arc(w*0.72,h*0.3,26,0,7);gg.fill();
    gg.fillStyle='#ffcf8a33';gg.beginPath();gg.arc(w*0.72,h*0.3,74,0,7);gg.fill();
    gg.fillStyle='#3a2a16';gg.beginPath();gg.roundRect(w*0.06,0,w*0.16,h,0);gg.fill();
    gg.fillStyle='#241a10';gg.beginPath();gg.ellipse(w*0.42,h*0.86,58,26,0,0,7);gg.fill();
    gg.beginPath();gg.arc(w*0.36,h*0.74,20,0,7);gg.fill();
    gg.beginPath();gg.moveTo(w*0.30,h*0.70);gg.lineTo(w*0.24,h*0.60);gg.lineTo(w*0.34,h*0.66);gg.fill();
    gg.fillStyle='#ffc06a';gg.font='600 20px system-ui,sans-serif';gg.fillText('7 утра · полярная ночь',w*0.10,h*0.20);
  },{glow:.16,glowCol:'#ffcf8a'});
};
DAY.panels.cat=(sc,pan)=>{
  sc.screen(pan.mu,640,150,(gg,w,h)=>{
    gg.fillStyle='rgba(14,11,20,.9)';gg.fillRect(0,0,w,h);
    gg.strokeStyle='#7fe0c055';gg.lineWidth=4;gg.strokeRect(2,2,w-4,h-4);
    gg.fillStyle='#7fe0c0';gg.font='800 62px ui-monospace,monospace';
    gg.fillText('ВАЛЕРА',24,76);
    gg.font='600 34px ui-monospace,monospace';
    gg.fillText('кормлю по расписанию',24,124);
  },{glow:.08,glowCol:'#7fe0c0'});
};
DAY.panels.workshop=(sc,pan,u,t)=>{
  if(pan.monitor)sc.screen(pan.monitor,760,470,(gg,w,h)=>codeScreen(gg,w,h,t,[
    '> собрать сцену мастерской','* принтер печатает… нет','> почему ни один не печатает?','* так задумано']),{glow:.10,glowCol:'#78c8ff'});
  sc.screen(pan.note,340,260,(gg,w,h)=>{
    gg.fillStyle='#f2df8b';gg.fillRect(0,0,w,h);
    gg.fillStyle='#5a4a1e';gg.font='800 42px system-ui,sans-serif';
    gg.fillText('НЕ',24,64);gg.fillText('ПЕЧАТАЕТ',24,116);
    gg.font='600 26px system-ui,sans-serif';gg.fillText('ждёт деталь · #018',24,190);
  },{glow:0});
};
DAY.panels.stream=(sc,pan,u,t)=>{
  if(pan.monitor)sc.screen(pan.monitor,760,470,(gg,w,h)=>chatScreen(gg,w,h,t),{glow:.12,glowCol:'#78c8ff'});
  sc.screen(pan.mb,300,210,(gg,w,h)=>{
    gg.fillStyle='#1b2140';gg.fillRect(0,0,w,h);
    gg.fillStyle='#5470a8';gg.fillRect(w*0.22,h*0.6,w*0.56,h*0.4);
    gg.fillStyle='#f0cdb0';gg.beginPath();gg.arc(w/2,h*0.44,42,0,7);gg.fill();
    gg.fillStyle='#8a6a4a';gg.beginPath();gg.arc(w/2,h*0.38,44,Math.PI,0);gg.fill();
    gg.fillStyle='#0d0f18aa';gg.fillRect(0,h-36,w,36);
    gg.fillStyle='#9aa3b2';gg.font='600 20px system-ui,sans-serif';gg.fillText('приветики · вебка',12,h-12);
  },{glow:.14,glowCol:'#9fd8ff'});
};
DAY.panels.limits=(sc,pan,u,t)=>{
  const g=sc.g,st=pan.screens||[];
  if(st[0])sc.screen(st[0].quad,700,450,(gg,w,h)=>codeScreen(gg,w,h,t,[
    '> сделай мне игру про фермера','* пишу… пишу… пишу…','> МНЕ НУЖЕН ОДИН ОТЧЁТ','* готово. в двух словах.']),{glow:.14,glowCol:'#78c8ff'});
  if(st[2])sc.screen(st[2].quad,640,300,(gg,w,h)=>eyeScreen(gg,w,h,t),{glow:.16,glowCol:'#7fe0c0'});
  // шкала лимитов — плоская карточка справа: всегда в кадре, не «текстура» в 3D
  g.save();
  g.translate(W-386,700);
  gaugeScreen(g,346,250,t,0.74,'лимиты недели','11 часов до сброса');
  g.strokeStyle='#ffffff22';g.lineWidth=2;g.beginPath();g.roundRect(0,0,346,250,22);g.stroke();
  g.restore();
};
DAY.panels.burnout=(sc,pan,u,t)=>{
  const alive=pan.alive||0;
  if(pan.monitor)sc.screen(pan.monitor,760,470,(gg,w,h)=>{
    gg.fillStyle='#080d16';gg.fillRect(0,0,w,h);
    const pv=Math.min(1,t*0.3);
    gg.lineWidth=22;gg.strokeStyle='#1d2740';gg.beginPath();gg.arc(w*0.3,h*0.5,80,0,7);gg.stroke();
    gg.strokeStyle=alive>0?'#7fe0c0':'#7f9fd0';gg.beginPath();gg.arc(w*0.3,h*0.5,80,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(0.99,pv));gg.stroke();
    gg.fillStyle='#f2eee4';gg.font='900 48px ui-monospace,monospace';gg.fillText(Math.round(Math.min(0.99,pv)*100)+'%',w*0.3-52,h*0.5+18);
    gg.fillStyle='#9aa3b2';gg.font='600 26px system-ui,sans-serif';gg.fillText('думает'+'.'.repeat(1+Math.floor(t*2)%3),w*0.55,h*0.4);
    if(alive>0){gg.globalAlpha=alive;gg.fillStyle='#7fe0c0';gg.font='800 34px ui-monospace,monospace';gg.fillText('* врубился',w*0.55,h*0.62);gg.globalAlpha=1}
  },{glow:.12,glowCol:'#7f9fd0'});
  // часы 4:07 — плоская карточка слева: всегда в кадре
  const g=sc.g;
  g.save();
  g.translate(40,640);
  g.fillStyle='#0a0f18';g.fillRect(0,0,346,250);
  g.strokeStyle='#ffffff22';g.lineWidth=2;g.beginPath();g.roundRect(0,0,346,250,22);g.stroke();
  g.fillStyle='#ffc06a';g.font='900 96px ui-monospace,monospace';g.fillText('4:07',40,150);
  g.fillStyle='#9aa3b2';g.font='600 26px system-ui,sans-serif';g.fillText('Мурманск · полярная ночь',40,215);
  g.restore();
};
DAY.panels.release=(sc,pan,u,t)=>{
  const b=B();
  if(pan.win)sc.screen(pan.win,1000,320,(gg,w,h)=>gameScreen(gg,w,h,t),{glow:.14,glowCol:'#7fe0c0'});
  const copies=Math.round(b.lerp(1,207,Math.min(1,Math.max(0,(u-0.55)/0.4))));
  sc.screen(pan.cap,640,340,(gg,w,h)=>{
    gg.fillStyle='#141a28';gg.fillRect(0,0,w,h);
    gg.fillStyle='#7fe0c0';gg.font='900 44px system-ui,sans-serif';gg.fillText('DESKTOP',24,64);
    gg.fillStyle='#f2eee4';gg.fillText('HELLFARMER',24,116);
    gg.fillStyle='#ff6b6b';gg.beginPath();gg.arc(34,172,9,0,7);gg.fill();
    gg.fillStyle='#ffc06a';gg.font='700 24px system-ui,sans-serif';gg.fillText('первые продажи — Япония',54,180);
    gg.fillStyle='#f2eee4';gg.font='900 36px ui-monospace,monospace';gg.fillText('копии: '+copies,24,h-24);
  },{glow:.18,glowCol:'#ffc06a'});
};
})();
