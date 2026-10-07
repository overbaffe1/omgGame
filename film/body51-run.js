/* body51-run.js — кадр, звук и запуск мультфильма «Вайбкодер из Мурманска».
   Картинка: 3D-движок (film/body51-3d.js + body51-3d-scenes.js); если он недоступен — плоский 2D-фолбэк.
   В браузере: Player.mount (перемотка, пауза, запись .webm). В Node: window.__body51.frame(t). */
(function(){
const B=window.B,cv=document.getElementById('c'),g=cv.getContext('2d'),W=1080,H=1920,CX=W/2;
const clamp=B.clamp,seg=B.seg,lerp=B.lerp,SC=B.SC,TOTAL=B.TOTAL;
const B3=window.B3,S3=window.S3;
const VBUF={};

// ---------- фоны сцен (2D, под 3D-геометрией) ----------
function paintSky(t,o){
  const gr=g.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,o.top);gr.addColorStop(.62,o.mid);gr.addColorStop(1,o.bottom);
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  if(o.stars){for(let i=0;i<140;i++){const x=B.hp(i*2.1)*W,y=B.hp(i*4.7)*H*.55,r=.8+B.hp(i*6.3)*1.6;
    g.fillStyle=`rgba(226,238,255,${.22+.5*Math.abs(Math.sin(t*.6+i))})`;g.beginPath();g.arc(x,y,r,0,7);g.fill()}}
  if(o.aurora){for(let b=0;b<3;b++){g.save();g.globalCompositeOperation='screen';g.globalAlpha=.75-b*.18;
    const col=['#58f0c0','#46c8ff','#9b6bff'][b];const y0=H*.10+b*70;
    const gg=g.createLinearGradient(0,y0-140,0,y0+320);gg.addColorStop(0,'rgba(0,0,0,0)');
    gg.addColorStop(.45,col+'44');gg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gg;g.beginPath();g.moveTo(-40,H*.7);
    for(let x=-40;x<=W+40;x+=30)g.lineTo(x,y0+Math.sin(x*.0042+t*(.18+b*.08)+b*2)*110+Math.sin(x*.011-t*.3)*38);
    g.lineTo(W+40,H*.7);g.closePath();g.fill();g.restore()}}
  if(o.sun){g.save();const y=o.sun[1];B.glow(o.sun[0],y,320,'rgba(255,190,120,A)',.28);
    g.fillStyle='#f0a860';g.beginPath();g.arc(o.sun[0],y,78,0,7);g.fill();g.restore()}
}
function sceneBg(id,t){
  switch(id){
    case 'polar': paintSky(t,{top:'#050810',mid:'#0d1730',bottom:'#111a2e',stars:1,aurora:1});break;
    case 'cat': paintSky(t,{top:'#171226',mid:'#140f20',bottom:'#0c0a14'});break;
    case 'workshop': paintSky(t,{top:'#141a29',mid:'#111624',bottom:'#0c1018'});break;
    case 'stream': paintSky(t,{top:'#191430',mid:'#140f24',bottom:'#0b0916'});break;
    case 'caravan': paintSky(t,{top:'#4a3357',mid:'#8a5f4a',bottom:'#c9924f',sun:[W*.66,H*.26]});break;
    case 'limits': paintSky(t,{top:'#070c18',mid:'#0a1526',bottom:'#060a12'});break;
    case 'gag': paintSky(t,{top:'#12101c',mid:'#0c0a14',bottom:'#07060c'});break;
    case 'burnout': paintSky(t,{top:'#0a0f1c',mid:'#0a0d16',bottom:'#07080f'});break;
    case 'release': paintSky(t,{top:'#0c1424',mid:'#0a101c',bottom:'#070a12'});break;
    case 'wishlist': paintSky(t,{top:'#1a1526',mid:'#140f1e',bottom:'#0a0912'});break;
    case 'finale': paintSky(t,{top:'#050810',mid:'#0d1730',bottom:'#111a2e',stars:1,aurora:.8});break;
    case 'credits': paintSky(t,{top:'#0a0d16',mid:'#080a12',bottom:'#05060b'});break;
    default: paintSky(t,{top:'#0a0d16',mid:'#080a12',bottom:'#05060b'});
  }
}

// ---------- 2D-содержимое на 3D-плоскостях ----------
function monitorCode(gg,w,h,t,lines,col='#7fe0c0'){
  gg.fillStyle='#0b1018';gg.fillRect(0,0,w,h);
  gg.fillStyle='#121826';gg.fillRect(0,0,w,54);
  gg.fillStyle='#ff6b6b';gg.beginPath();gg.arc(28,27,8,0,7);gg.fill();
  gg.fillStyle='#ffc46b';gg.beginPath();gg.arc(54,27,8,0,7);gg.fill();
  gg.fillStyle='#7ee08a';gg.beginPath();gg.arc(80,27,8,0,7);gg.fill();
  gg.font='600 26px monospace';
  gg.fillStyle=col;
  lines.forEach((s,i)=>{const k=Math.min(1,seg((t*0.55)%7,i*.55,i*.55+.4));if(k<=0)return;
    gg.globalAlpha=k;gg.fillText(s,40,140+i*58);gg.globalAlpha=1});
  gg.strokeStyle='#1d2740';gg.lineWidth=2;
  for(let i=0;i<8;i++){gg.beginPath();gg.moveTo(40,560+i*40);gg.lineTo(40+120+((i*67)%300),560+i*40);gg.stroke()}
}
function codePanel(gg,w,h,t,alive){
  gg.fillStyle='#0a0f18';gg.fillRect(0,0,w,h);
  gg.fillStyle='#121a28';gg.fillRect(0,0,w,50);
  gg.fillStyle='#7fe0c0';gg.font='700 24px monospace';gg.fillText('devlog.md',18,34);
  const lines=['## сегодня','- сцена собрана','- кот выключил микрофон','- релиз?','- релиз...','- ОПУБЛИКОВАТЬ'];
  lines.forEach((l,i)=>{const k=Math.min(1,seg((t*0.4)%8,i*0.9,i*0.9+.5));if(k<=0)return;
    gg.globalAlpha=k;gg.fillStyle=i>3?'#ffd8a0':'#9fd8ff';gg.font=(i>3?'800 ':'600 ')+26+'px monospace';gg.fillText(l,24,110+i*52);gg.globalAlpha=1});
  if(alive>0){gg.globalAlpha=alive;gg.fillStyle='#7fe0c0';gg.font='800 30px monospace';gg.fillText('* процесс жив',24,h-30);gg.globalAlpha=1}
}
function chatPanel(gg,w,h,t){
  gg.fillStyle='#0d0f18';gg.fillRect(0,0,w,h);
  gg.font='700 26px system-ui,sans-serif';
  const msgs=[['Дима Шалаш','первый!'],['Айнс','ребятушки'],['Нетрикс','музыка громче тебя'],['Промптикс','лимиты чекни'],['Тайский перец','пу-пу-пу'],['Вивер','вайбаля'],['Папасита','+'],['Ас','где кольцо?']];
  msgs.forEach((m,i)=>{const k=Math.min(1,seg((t*0.35)%14,i*.9,i*.9+.5));
    gg.globalAlpha=k;gg.fillStyle=i%2?'#7fe0c0':'#ffd8a0';gg.fillText(m[0],28,70+i*96);
    gg.fillStyle='#c9d2e0';gg.font='600 24px system-ui,sans-serif';gg.fillText(m[1],28,104+i*96);
    gg.font='700 26px system-ui,sans-serif';gg.globalAlpha=1});
}
function webcamPanel(gg,w,h,t,rig){
  gg.fillStyle='#1b2140';gg.fillRect(0,0,w,h);
  gg.save();gg.translate(w*0.5,h*1.05);gg.scale(w*0.42,h*0.42);
  gg.globalAlpha=.95;
  gg.fillStyle='#5470a8';gg.beginPath();gg.roundRect(-1,-1.1,2,1.2,0.3);gg.fill();
  gg.fillStyle='#f0cdb0';gg.beginPath();gg.arc(0,-1.28,0.42,0,7);gg.fill();
  gg.fillStyle='#e3bd77';gg.beginPath();gg.arc(0,-1.36,0.44,Math.PI,0);gg.fill();
  gg.fillStyle='#26314a';gg.beginPath();gg.arc(-0.15,-1.3,0.05,0,7);gg.arc(0.15,-1.3,0.05,0,7);gg.fill();
  gg.restore();
  gg.fillStyle='#0d0f18aa';gg.fillRect(0,h-42,w,42);
  gg.fillStyle='#9aa3b2';gg.font='600 22px system-ui,sans-serif';gg.fillText('хромакей · маленькое лицо',14,h-14);
}
function gaugePanel(gg,w,h,t,v,label,sub){
  gg.fillStyle='#0c1220';gg.fillRect(0,0,w,h);
  gg.fillStyle='#cfd6e2';gg.font='700 30px system-ui,sans-serif';gg.fillText(label,36,70);
  gg.fillStyle='#33404f';gg.fillRect(36,120,w-72,44);
  const gr=gg.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#7fe0c0');gr.addColorStop(1,'#ffc06a');
  gg.fillStyle=gr;gg.fillRect(36,120,(w-72)*v,44);
  gg.fillStyle='#f2eee4';gg.font='900 64px monospace';gg.fillText(Math.round(v*100)+'%',36,250);
  gg.fillStyle='#9aa3b2';gg.font='600 26px system-ui,sans-serif';gg.fillText(sub,36,300);
}
function gameWindowPanel(gg,w,h,t){
  gg.fillStyle='#101828';gg.fillRect(0,0,w,h);
  gg.fillStyle='#171f31';gg.fillRect(0,0,w,52);
  gg.fillStyle='#9aa3b2';gg.font='600 24px system-ui,sans-serif';gg.fillText('Desktop Hellfarmer · рабочий стол',18,34);
  for(let r=0;r<4;r++)for(let c=0;c<6;c++){
    const x=24+c*(w-48)/6,y=76+r*(h-100)/4;
    gg.fillStyle='#241d2c';gg.beginPath();gg.roundRect(x+4,y+4,(w-48)/6-10,(h-100)/4-10,8);gg.fill();
    const grow=clamp(((t*0.6+r*0.2+c*0.1)%4)/2);
    gg.fillStyle='#5fbf7a';gg.fillRect(x+20,y+((h-100)/4)-26-grow*22,12,18+grow*22);
    gg.fillRect(x+38,y+((h-100)/4)-20-grow*26,12,16+grow*26);
  }
  gg.fillStyle='#ffd8a0';gg.font='600 26px system-ui,sans-serif';gg.fillText('я ничего не делаю — оно продаётся',24,h-16);
}
function capsulePanel(gg,w,h,t,copies){
  gg.fillStyle='#141a28';gg.fillRect(0,0,w,h);
  gg.fillStyle='#7fe0c0';gg.font='900 54px system-ui,sans-serif';gg.fillText('DESKTOP',36,80);
  gg.fillStyle='#f2eee4';gg.fillText('HELLFARMER',36,146);
  gg.fillStyle='#9aa3b2';gg.font='600 26px system-ui,sans-serif';gg.fillText('фермер на рабочем столе',36,190);
  gg.fillStyle='#ff6b6b';gg.beginPath();gg.arc(52,250,12,0,7);gg.fill();
  gg.fillStyle='#ffc06a';gg.font='700 30px system-ui,sans-serif';gg.fillText('первые продажи — Япония',78,262);
  gg.fillStyle='#f2eee4';gg.font='900 44px monospace';gg.fillText('копии: '+copies,36,h-40);
}
function wishPanel(gg,w,h,t,count){
  gg.fillStyle='#0d0b16';gg.fillRect(0,0,w,h);
  gg.fillStyle='#9aa3b2';gg.font='700 28px system-ui,sans-serif';gg.fillText('вишлисты Backpack Inspector',30,60);
  const N=40;
  for(let i=0;i<N;i++){const k=clamp(seg((t*0.5)%10,i*.2,i*.2+.3));const x=30+i*((w-60)/N);
    const hh=(30+Math.pow(i/N,1.9)*300)*k;gg.fillStyle=i>N*0.8?'#ffc06a':'#3a4a6a';gg.fillRect(x,h-60-hh,(w-60)/N-6,hh)}
  gg.strokeStyle='#e0656566';gg.lineWidth=3;gg.beginPath();gg.moveTo(30,h-64);gg.lineTo(w-30,h-64);gg.stroke();
  gg.fillStyle='#f2eee4';gg.font='800 30px monospace';gg.fillText('13 500 вишлистов',30,h-100);
}
function lettersPanel(gg,w,h,t){
  gg.fillStyle='#12101c';gg.fillRect(0,0,w,h);
  gg.fillStyle='#f2eee4';gg.font='700 26px system-ui,sans-serif';gg.fillText('2 письма от издателей',28,h-30);
}
function creditsPanel(gg,w,h,i,src){
  gg.fillStyle='#141a28';gg.fillRect(0,0,w,h);
  gg.strokeStyle='#ffffff22';gg.lineWidth=2;gg.strokeRect(1,1,w-2,h-2);
  gg.fillStyle='#7fe0c0';gg.font='700 22px monospace';gg.fillText('ИСТОЧНИК',22,44);
  gg.fillStyle='#eef2f8';gg.font='600 24px system-ui,sans-serif';
  src.forEach((l,idx)=>gg.fillText(l,22,96+idx*40));
}

// мягкое свечение вокруг ламп/экранов/окон — «с кайфом»
function glowSprites(sc,pan,t){
  if(!pan||!pan.glows)return;
  const P=sc._lastProj;if(!P)return;
  for(const gl of pan.glows){
    const q=P.project(gl.p);if(q.z<=0.05||!isFinite(q.x))continue;
    const r=Math.max(24,(gl.r||180)*(1+0.05*Math.sin(t*1.7+gl.p.x*3)));
    if(q.x<-r*1.5||q.x>W+r*1.5||q.y<-r*1.5||q.y>H+r*1.5)continue;
    const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,r);
    gr.addColorStop(0,gl.col+'d0');gr.addColorStop(.35,gl.col+'55');gr.addColorStop(1,gl.col+'00');
    g.save();g.globalCompositeOperation='screen';g.globalAlpha=gl.a==null?.4:gl.a;
    g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,r,0,7);g.fill();g.restore();
  }
}
function drawPanels(id,sc,pan,u,t){
  if(!sc._lastProj)return;
  const P3=B3.v3,VA=B3.vadd;
  if(id==='polar'&&pan.winQuad){
    sc.screen(pan.winQuad,320,340,(gg,w,h)=>{
      const gr=gg.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#4a2f12');gr.addColorStop(1,'#1d1206');
      gg.fillStyle=gr;gg.fillRect(0,0,w,h);
      // тёплая лампа, штора, силуэт на подоконнике
      gg.fillStyle='#ffcf8a';gg.beginPath();gg.arc(w*0.72,h*0.3,26,0,7);gg.fill();
      gg.fillStyle='#ffcf8a33';gg.beginPath();gg.arc(w*0.72,h*0.3,74,0,7);gg.fill();
      gg.fillStyle='#3a2a16';gg.beginPath();gg.roundRect(w*0.06,0,w*0.16,h,0);gg.fill();
      gg.fillStyle='#241a10';gg.beginPath();gg.ellipse(w*0.42,h*0.86,58,26,0,0,7);gg.fill();
      gg.beginPath();gg.arc(w*0.36,h*0.74,20,0,7);gg.fill();
      gg.beginPath();gg.moveTo(w*0.30,h*0.70);gg.lineTo(w*0.24,h*0.60);gg.lineTo(w*0.34,h*0.66);gg.fill();
      gg.fillStyle='#ffc06a';gg.font='600 20px system-ui,sans-serif';gg.fillText('4 утра',w*0.55,h*0.86);
    },{glow:.16,glowCol:'#ffcf8a'});
  }
  if(id==='cat'){
    const mu=[P3(-3.15,0.86,-1.4),P3(-0.85,0.86,-1.4),P3(-0.85,0.72,-1.4),P3(-3.15,0.72,-1.4)];
    sc.screen(mu,420,90,(gg,w,h)=>{gg.fillStyle='#0e0b14cc';gg.fillRect(0,0,w,h);
      gg.fillStyle='#7fe0c0';gg.font='700 30px monospace';gg.fillText('ВАЛЕРА · кормлю по расписанию',20,60);
    },{glow:.08,glowCol:'#7fe0c0'});
  }
  if(id==='workshop'&&pan.monitor){
    sc.screen(pan.monitor,900,560,(gg,w,h)=>monitorCode(gg,w,h,t,
      ['> собрать сцену мастерской','* принтер печатает… нет','> почему ни один не печатает?','* так задумано','> добавь скелет, он падает'],'#7fe0c0'),{glow:.10,glowCol:'#78c8ff'});
    const sb=P3(-2.2,1.35,-2.6);
    sc.screen([sb,VA(sb,P3(1.2,0,0)),VA(sb,P3(1.2,-0.8,0)),VA(sb,P3(0,-0.8,0))],380,260,
      (gg,w,h)=>{gg.fillStyle='#f2df8b';gg.fillRect(0,0,w,h);gg.fillStyle='#5a4a1e';
        gg.font='800 30px system-ui,sans-serif';gg.fillText('НЕ ПЕЧАТАЕТ',22,64);
        gg.font='600 26px system-ui,sans-serif';gg.fillText('ждёт деталь',22,130);
        gg.fillText('звонить мастеру',22,180);
        gg.fillStyle='#b08a3a';gg.font='700 24px monospace';gg.fillText('звонить мастеру → #018',22,224);},{glow:0});
    if(pan.winQuad)sc.screen(pan.winQuad,320,240,(gg,w,h)=>{
      const gr=gg.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0b1424');gr.addColorStop(1,'#121c30');
      gg.fillStyle=gr;gg.fillRect(0,0,w,h);
      gg.fillStyle='#ffd79a';for(let i=0;i<5;i++)gg.fillRect(24+i*60,90+((i%2)*30),34,60);
      gg.fillStyle='#eef7ff';for(let i=0;i<40;i++)gg.fillRect((i*53)%w,(i*97)%h,2,2);},{glow:.1,glowCol:'#9fd8ff'});
  }
  if(id==='stream'){
    if(pan.monitor)sc.screen(pan.monitor,900,560,(gg,w,h)=>chatPanel(gg,w,h,t),{glow:.12,glowCol:'#78c8ff'});
    if(pan.monitor2)sc.screen(pan.monitor2,860,540,(gg,w,h)=>codePanel(gg,w,h,t),{glow:.10,glowCol:'#7fe0c0'});
    const mb=[P3(-0.6,1.62,-1.55),P3(0.6,1.62,-1.55),P3(0.6,1.02,-1.55),P3(-0.6,1.02,-1.55)];
    sc.screen(mb,320,220,(gg,w,h)=>webcamPanel(gg,w,h,t),{glow:.14,glowCol:'#9fd8ff'});
    if(pan.winQuad)sc.screen(pan.winQuad,300,230,(gg,w,h)=>{
      gg.fillStyle='#080f1c';gg.fillRect(0,0,w,h);
      gg.fillStyle='#ffd79a';for(let i=0;i<4;i++)gg.fillRect(30+i*70,90,40,70);
      gg.fillStyle='#eef7ff';for(let i=0;i<30;i++)gg.fillRect((i*67)%w,(i*41)%h,2,2);},{glow:.08});
  }
  if(id==='limits'&&pan.screens){
    const st=pan.screens;
    sc.screen(st[0].quad,780,500,(gg,w,h)=>monitorCode(gg,w,h,t,
      ['> сделай мне игру про фермера','* планирую… 12 модулей','* пишу… пишу… пишу…','> МНЕ НУЖЕН ОДИН ОТЧЁТ','* готово. отчёт в двух словах.'],'#7fe0c0'),{glow:.14,glowCol:'#78c8ff'});
    sc.screen(st[1].quad,780,500,(gg,w,h)=>gaugePanel(gg,w,h,t,0.74,'лимиты недели','11 часов до сброса'),{glow:.14,glowCol:'#ffc06a'});
    sc.screen(st[2].quad,900,400,(gg,w,h)=>{
      gg.fillStyle='#0b1220';gg.fillRect(0,0,w,h);
      const cx=w*0.5,cy=h*0.5,R=h*0.42;
      gg.fillStyle='#e8eef8';gg.beginPath();gg.ellipse(cx,cy,R*1.5,R,0,0,7);gg.fill();
      gg.fillStyle='#20304e';gg.beginPath();gg.arc(cx,cy,R*0.62,0,7);gg.fill();
      const a=Math.sin(t*0.6)*0.5;
      gg.fillStyle='#7fe0c0';gg.beginPath();gg.arc(cx+Math.cos(a)*R*0.3,cy+Math.sin(a)*R*0.22,R*0.3,0,7);gg.fill();
      gg.fillStyle='#0b1220';gg.beginPath();gg.arc(cx+Math.cos(a)*R*0.36,cy+Math.sin(a)*R*0.26,R*0.13,0,7);gg.fill();
      gg.fillStyle='#0b1220';gg.beginPath();gg.ellipse(cx,cy,R*1.5,R*0.5,0,0,7);
      gg.ellipse(cx,cy,R*1.5,R*1.0,0,0,Math.PI*2);gg.fill();
      gg.fillStyle='#9fd8ff';gg.font='700 24px monospace';gg.fillText('ДИРЕКТОР НЕЙРОНОК · смотрит',24,h-24);
    },{glow:.16,glowCol:'#7fe0c0'});
  }
  if(id==='burnout'){
    const alive=pan.alive||0;
    if(pan.monitor)sc.screen(pan.monitor,900,560,(gg,w,h)=>{
      gg.fillStyle='#080d16';gg.fillRect(0,0,w,h);
      const pv=lerp(0,0.99,Math.min(1,t*0.3));
      gg.lineWidth=26;gg.strokeStyle='#1d2740';gg.beginPath();gg.arc(w*0.3,h*0.5,92,0,7);gg.stroke();
      gg.strokeStyle=alive>0?'#7fe0c0':'#7f9fd0';gg.beginPath();gg.arc(w*0.3,h*0.5,92,-Math.PI/2,-Math.PI/2+Math.PI*2*pv);gg.stroke();
      gg.fillStyle='#f2eee4';gg.font='900 56px monospace';gg.fillText(Math.round(pv*100)+'%',w*0.3-62,h*0.5+20);
      gg.fillStyle='#9aa3b2';gg.font='600 30px system-ui,sans-serif';
      gg.fillText('думает'+'.'.repeat(1+Math.floor(t*2)%3),w*0.52,h*0.36);
      if(alive>0){gg.globalAlpha=alive;gg.fillStyle='#7fe0c0';gg.font='800 40px monospace';
        gg.fillText('* врубился',w*0.52,h*0.62);gg.globalAlpha=1}
    },{glow:.12,glowCol:'#7f9fd0'});
    if(pan.monitor2)sc.screen(pan.monitor2,760,500,(gg,w,h)=>codePanel(gg,w,h,t,alive),{glow:.1,glowCol:'#7fe0c0'});
    if(pan.monitor3)sc.screen(pan.monitor3,760,500,(gg,w,h)=>{
      gg.fillStyle='#0a0f18';gg.fillRect(0,0,w,h);
      gg.fillStyle='#ffc06a';gg.font='900 120px monospace';gg.fillText('4:07',60,240);
      gg.fillStyle='#9aa3b2';gg.font='600 30px system-ui,sans-serif';gg.fillText('Мурманск · за окном полярная ночь',60,320);
      for(let i=0;i<6;i++){gg.fillStyle='#7fe0c0';gg.globalAlpha=.4;gg.fillRect(60,360+i*24,300-i*30,8);gg.globalAlpha=1}
    },{glow:.1,glowCol:'#ffc06a'});
    if(pan.winQuad)sc.screen(pan.winQuad,320,250,(gg,w,h)=>{
      gg.fillStyle='#070d1a';gg.fillRect(0,0,w,h);
      gg.fillStyle='#ffd79a';for(let i=0;i<4;i++)gg.fillRect(26+i*72,100,40,64);
      gg.fillStyle='#eef7ff';for(let i=0;i<36;i++)gg.fillRect((i*57)%w,(i*83)%h,2,2);},{glow:.08});
  }
  if(id==='release'){
    if(pan.win)sc.screen(pan.win,1400,420,(gg,w,h)=>gameWindowPanel(gg,w,h,t),{glow:.14,glowCol:'#7fe0c0'});
    const cap=[P3(-3.4,1.3,-1.34),P3(-1.8,1.3,-1.34),P3(-1.8,0.5,-1.34),P3(-3.4,0.5,-1.34)];
    const copies=Math.round(lerp(1,207,B.easeOut(Math.min(1,Math.max(0,(u-0.55)/0.4)))));
    sc.screen(cap,900,440,(gg,w,h)=>capsulePanel(gg,w,h,t,copies),{glow:.18,glowCol:'#ffc06a'});
  }
  if(id==='wishlist'){
    const wq=[P3(-1.2,3.0,-2.2),P3(2.0,3.0,-2.2),P3(2.0,2.3,-2.2),P3(-1.2,2.3,-2.2)];
    const count=Math.round(lerp(500,13500,Math.min(1,Math.max(0,(u-0.05)/0.7))));
    sc.screen(wq,900,280,(gg,w,h)=>wishPanel(gg,w,h,t,count),{glow:.10,glowCol:'#ffc06a'});
    const lq=[P3(-3.2,1.35,-0.6),P3(-1.6,1.35,-0.6),P3(-1.6,0.95,-0.6),P3(-3.2,0.95,-0.6)];
    sc.screen(lq,700,220,(gg,w,h)=>{gg.fillStyle='#0d0b16';gg.fillRect(0,0,w,h);
      gg.fillStyle='#ffd8a0';gg.font='700 34px system-ui,sans-serif';gg.fillText('ПОСЫЛКА ДЛЯ ИЗДАТЕЛЯ',24,50);
      gg.fillStyle='#cfd6e2';gg.font='600 30px system-ui,sans-serif';
      gg.fillText('содержимое: рюкзак, надежда',24,110);
      gg.fillStyle='#e06565';gg.fillText('статус: на таможне',24,164);},{glow:.08,glowCol:'#ffc06a'});
  }
  if(id==='finale'&&pan.winQuad){
    sc.screen(pan.winQuad,640,450,(gg,w,h)=>{
      const gr=gg.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#071022');gr.addColorStop(1,'#1d3352');
      gg.fillStyle=gr;gg.fillRect(0,0,w,h);
      for(let b=0;b<3;b++){gg.globalCompositeOperation='screen';
        const col=['#58f0c0','#46c8ff','#9b6bff'][b];
        const g2=gg.createLinearGradient(0,140+b*60,0,470+b*60);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(.5,col+'55');g2.addColorStop(1,'rgba(0,0,0,0)');
        gg.fillStyle=g2;gg.beginPath();gg.moveTo(0,h);for(let x=0;x<=w;x+=20)gg.lineTo(x,210+b*70+Math.sin(x*0.01+b)*70);gg.lineTo(w,h);gg.fill()}
      gg.globalCompositeOperation='source-over';
      for(let i=0;i<60;i++){gg.fillStyle='rgba(233,241,255,.85)';gg.beginPath();gg.arc((i*97)%w,(i*211)%h,2+(i%3),0,7);gg.fill()}
      gg.fillStyle='#0b1424';gg.beginPath();gg.moveTo(0,h);for(let x=0;x<=w;x+=26)gg.lineTo(x,h-40-Math.abs(Math.sin(x*0.02))*44);gg.lineTo(w,h);gg.fill();
    },{glow:.16,glowCol:'#9fd8ff'});
    if(pan.monitor)sc.screen(pan.monitor,900,560,(gg,w,h)=>monitorCode(gg,w,h,t,
      ['> что дальше?','* делаю следующую','> и когда релиз?','* когда доделаю'],'#ffd8a0'),{glow:.1,glowCol:'#ffd8a0'});
  }
  if(id==='credits'&&pan.cards){
    const srcs=[['#008 · 7 принтеров'],['#015 · «свои миллионы»'],
                ['#019 · 13 500 вишлистов'],
                ['#021 · «железяка, врубайся»'],
                ['#061 · деревянный меч'],
                ['#473 стрима · девлог']];
    pan.cards.forEach((c,i)=>sc.screen(c,900,540,(gg,w,h)=>creditsPanel(gg,w,h,i,srcs[i%srcs.length]),{glow:.06,glowCol:'#ffc06a'}));
  }
}
async function preload(){
  const ids=[];
  for(const s of SC){if(s.narr&&!VBUF[s.narr])ids.push(s.narr);
    if(s.quote&&s.quote.id&&!VBUF[s.quote.id])ids.push(s.quote.id)}
  if(!ids.length||typeof OfflineAudioContext==='undefined')return;
  const dc=new OfflineAudioContext(1,1,44100);
  await Promise.all(ids.map(async id=>{
    try{const r=await fetch('body51-voices/'+id+'.mp3',{cache:'no-store'});
      VBUF[id]=await dc.decodeAudioData(await r.arrayBuffer());
    }catch(e){console.warn('нет озвучки',id)}}));
}

function frame(t){
  g.setTransform(1,0,0,1,0,0);
  const scene=B.sceneAt(t),u=clamp((t-scene.start)/scene.dur);
  let panels=null,s3=null;
  if(B3&&S3&&S3[scene.kind]){
    s3=new B3.Scene(g,W,H);
    sceneBg(scene.kind,t);
    panels=S3[scene.kind](s3,u,t)||{};
    B3.draw(s3);
    drawPanels(scene.kind,s3,panels,u,t);
    glowSprites(s3,panels,t);
    if(scene.kind==='polar'||scene.kind==='finale')B.snow(t,scene.kind==='finale'?18:80,scene.kind==='finale'?.4:.7);
  }else{
    const draw=B.SCENES[scene.kind]||B.SCENES.polar;
    draw(u,t,scene);
  }
  B.hud(scene,t);
  const d=Math.max(1-seg(t-scene.start,0,.35),seg(t,scene.start+scene.dur-.35,scene.start+scene.dur));
  if(d>0){g.fillStyle=`rgba(4,5,9,${d})`;g.fillRect(0,0,W,H)}
  if(window.FX)FX.post(g,t,{bloom:.2,grain:.045,vignette:.46,leak:.04,ca:.4});
  const fade=Math.max(1-seg(t,0,.9),seg(t,TOTAL-1.5,TOTAL));
  if(fade>0){g.fillStyle=`rgba(4,5,9,${fade})`;g.fillRect(0,0,W,H)}
}

function score(ac,out){
  const T=ac.currentTime+.14;
  const master=out;
  const mus=ac.createGain();mus.gain.value=.34;mus.connect(master);
  const ev=window.BODY51_SCORE?BODY51_SCORE(SC,TOTAL):[];
  for(const e of ev){
    const o=ac.createOscillator(),gn=ac.createGain();
    o.type=e.type||'sine';o.frequency.value=e.f;
    const at=T+e.at;
    gn.gain.setValueAtTime(.00001,at);
    gn.gain.linearRampToValueAtTime(e.vol,at+(e.attack||.02));
    gn.gain.exponentialRampToValueAtTime(.00001,at+Math.max(.08,e.dur));
    o.connect(gn);gn.connect(mus);o.start(at);o.stop(at+Math.max(.1,e.dur)+.06);
  }
  const V=ac.createGain();V.gain.value=1.3;V.connect(master);
  // второй голос (цитаты) — с лёгкой «радио»-окраской, чтобы отличался от рассказчика
  const QV=ac.createGain();QV.gain.value=1.15;
  const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=180;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
  QV.connect(hp);hp.connect(lp);lp.connect(master);
  const play=(buf,at,dest,duckTo)=>{
    if(!buf)return;
    const src=ac.createBufferSource();src.buffer=buf;src.connect(dest);src.start(at);
    mus.gain.setTargetAtTime(duckTo,Math.max(T,at-.2),.09);
    mus.gain.setTargetAtTime(.34,at+buf.duration+.15,.35);
  };
  for(const s of SC){
    play(s.narr&&VBUF[s.narr],T+s.start+(s.narrAt||.6),V,.16);
    if(s.quote&&s.quote.id)play(VBUF[s.quote.id],T+s.start+s.quote.at,QV,.14);
  }
}

window.__body51={frame,score,preload,TOTAL,SC};
if(window.Player)Player.mount({
  canvas:cv,frame,score,preload,dur:TOTAL,
  name:'vajbkoder-iz-murmanska.webm',
  chapters:SC.map(s=>({t:s.start,title:s.title})),
  start:0
});
})();
