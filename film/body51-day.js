/* body51-day.js — авторская 2D-анимация короткого фильма «Три проекта, один разработчик».
   Все сцены, персонажи и предметы рисуются в Canvas вручную и анимируются по времени.
   Стримерский персонаж — векторная стилизация по фото-референсу unnamed.jpg; само фото
   не загружается в плеер. Иллюстраций, AI-артов и Ken Burns здесь нет. */
(function(){
'use strict';
const cv=document.getElementById('c');
if(!cv)return;
const g=cv.getContext('2d');
const W=1080,H=1920,CX=W/2,TAU=Math.PI*2;
const SX=44,SY=280,SW=992,SH=1020;
const C={
  ink:'#101522',ink2:'#171d2c',paper:'#f5f0e7',muted:'#aab3c2',
  mint:'#7fe0c0',mint2:'#b8f3df',amber:'#ffc06a',red:'#ff7474',
  blue:'#8ac8ef',violet:'#b99af5',wood:'#a97742',wood2:'#d5a665',
  skin:'#edc5a5',hair:'#30292a',hood:'#405c7e'
};
const META={
  cat:{title:'ДОМАШНИЙ ОТДЕЛ КОНТРОЛЯ',source:'#440 · #457',accent:C.amber,bg:['#30293a','#121823']},
  workshop:{title:'DESKTOP HELLFARMER',source:'#002 · #065',accent:C.amber,bg:['#26394a','#111723']},
  stream:{title:'BACKPACK INSPECTOR · ТАМОЖНЯ',source:'#014 · #176',accent:C.blue,bg:['#292443','#111321']},
  limits:{title:'WHITE MERIDIAN · МИР МЕЧТЫ',source:'#008 · #035',accent:C.mint,bg:['#172c42','#101724']},
  gag:{title:'ПЕРЕРЫВ: ПРОСТО ВИСИМ',source:'#186',accent:C.violet,bg:['#30213d','#151421']},
  release:{title:'ТРИ ПРОЕКТА. ОДИН РАЗРАБОТЧИК.',source:'#002 · #004 · #065',accent:C.mint,bg:['#183a3b','#101a25']}
};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,k)=>a+(b-a)*k;
const easeBack=x=>{x=clamp(x);const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const hp=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const pulse=(t,f=1)=>.5+.5*Math.sin(t*f*TAU);
function rr(x,y,w,h,r=20){g.beginPath();g.roundRect(x,y,w,h,r)}
function box(x,y,w,h,fill,r=20,stroke=null,lw=2){
  g.fillStyle=fill;rr(x,y,w,h,r);g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;rr(x,y,w,h,r);g.stroke()}
}
function line(x1,y1,x2,y2,color=C.paper,width=4,cap='round'){
  g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.lineCap=cap;g.stroke();
}
function text(s,x,y,size=30,color=C.paper,weight=700,align='center',font='system-ui,sans-serif'){
  g.font=`${weight} ${size}px ${font}`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(String(s),x,y);
}
function fitText(s,x,y,maxW,size=30,color=C.paper,weight=700,align='center',font='system-ui,sans-serif'){
  g.font=`${weight} ${size}px ${font}`;
  while(size>15&&g.measureText(String(s)).width>maxW){size-=1;g.font=`${weight} ${size}px ${font}`}
  text(s,x,y,size,color,weight,align,font);return size;
}
function wrap(s,maxW,size,weight=700,font='system-ui,sans-serif'){
  g.font=`${weight} ${size}px ${font}`;
  const rows=[];let row='';
  for(const word of String(s).trim().split(/\s+/)){
    const next=row?row+' '+word:word;
    if(row&&g.measureText(next).width>maxW){rows.push(row);row=word}else row=next;
  }
  if(row)rows.push(row);return rows;
}
function wrapped(s,x,centerY,maxW,lineH,size,color,weight=700,font='system-ui,sans-serif',maxLines=3){
  let rows=wrap(s,maxW,size,weight,font);
  while(rows.length>maxLines&&size>26){size-=2;rows=wrap(s,maxW,size,weight,font)}
  const h=(rows.length-1)*lineH;
  rows.forEach((row,i)=>text(row,x,centerY-h/2+i*lineH,size,color,weight,'center',font));
  return rows.length;
}
function pill(label,x,y,w,h,fill,fg=C.paper,stroke=null,size=23){
  box(x,y,w,h,fill,h/2,stroke,2);fitText(label,x+w/2,y+h/2,w-24,size,fg,800,'center');
}
function alpha(a,fn){g.save();g.globalAlpha*=clamp(a);fn();g.restore()}
function clipRound(x,y,w,h,r,fn){g.save();g.beginPath();g.roundRect(x,y,w,h,r);g.clip();fn();g.restore()}
function strokePath(points,color,width,cap='round'){
  if(!points||points.length<2)return;
  g.beginPath();g.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);
  g.strokeStyle=color;g.lineWidth=width;g.lineCap=cap;g.lineJoin='round';g.stroke();
}
function pop(local,at,dur=.5){
  const k=clamp((local-at)/dur);return k?easeBack(k):0;
}
function drawHeader(scene,t){
  const m=META[scene.id]||META.cat;
  const scenes=(window.B&&B.SC)||[];
  const idx=Math.max(0,scenes.findIndex(s=>s.id===scene.id))+1;
  const reveal=smooth((t-scene.start)/.24);
  alpha(reveal,()=>{
    box(42,38,600,78,'rgba(10,13,22,.82)',22,'rgba(255,255,255,.12)',2);
    g.fillStyle=m.accent;g.beginPath();g.arc(78,77,8+2*pulse(t,1.7),0,TAU);g.fill();
    text('ОДИН ДЕНЬ  ·  @body51',104,78,27,C.paper,800,'left');
    box(720,38,318,78,'rgba(10,13,22,.82)',22,'rgba(255,255,255,.12)',2);
    text(`ЭПИЗОД  ${String(idx).padStart(2,'0')} / ${String(scenes.length||6).padStart(2,'0')}`,879,78,25,C.muted,700,'center','ui-monospace,monospace');
    fitText(m.title,CX,164,960,39,C.paper,900,'center');
    const sw=fitSource(m.source);
    pill('ФАКТЫ  '+m.source,CX-sw/2,201,sw,48,'rgba(8,12,20,.68)',m.accent,'rgba(255,255,255,.10)',21);
  });
}
function fitSource(s){
  g.font='800 21px system-ui,sans-serif';return Math.min(760,Math.max(330,g.measureText('ФАКТЫ  '+s).width+48));
}
function stageBackdrop(scene,t){
  const m=META[scene.id]||META.cat;
  const bg=g.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,m.bg[0]);bg.addColorStop(.52,'#171b2a');bg.addColorStop(1,m.bg[1]);
  g.fillStyle=bg;g.fillRect(0,0,W,H);
  const glow=g.createRadialGradient(CX,810,40,CX,810,1050);
  glow.addColorStop(0,'rgba(255,255,255,.045)');glow.addColorStop(1,'rgba(0,0,0,.32)');
  g.fillStyle=glow;g.fillRect(0,0,W,H);
  g.save();g.beginPath();g.roundRect(SX,SY,SW,SH,36);g.clip();
  switch(scene.id){
    case 'cat':drawCatStage(scene,t);break;
    case 'workshop':drawHellfarmerStage(scene,t);break;
    case 'stream':drawBackpackStage(scene,t);break;
    case 'limits':drawMeridianStage(scene,t);break;
    case 'gag':drawBreakStage(scene,t);break;
    case 'release':drawProjectFinale(scene,t);break;
    default:drawCatStage(scene,t);
  }
  g.restore();
  // The scene frame is an intentional safe-area guide; all art stays clipped inside it.
  g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=2;rr(SX,SY,SW,SH,36);g.stroke();
  g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=2;
  line(SX+24,SY+42,SX+70,SY+42,'rgba(255,255,255,.25)',2);
  line(SX+SW-70,SY+42,SX+SW-24,SY+42,'rgba(255,255,255,.25)',2);
}
function drawCatStage(scene,t){
  const local=t-scene.start;
  const bg=g.createLinearGradient(0,SY,0,SY+SH);bg.addColorStop(0,'#d8d0d4');bg.addColorStop(.57,'#c3bec8');bg.addColorStop(1,'#7c8794');
  g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  // Тёплый свет кухни и плитка: отдельные линии чуть смещаются как параллакс.
  g.save();g.globalAlpha=.23;g.strokeStyle='#667181';g.lineWidth=2;
  for(let x=70;x<1030;x+=110){g.beginPath();g.moveTo(x+Math.sin(local*.22+x)*3,300);g.lineTo(x,951);g.stroke()}
  for(let y=390;y<950;y+=105){g.beginPath();g.moveTo(54,y);g.lineTo(1026,y);g.stroke()}
  g.restore();
  const shine=g.createRadialGradient(465,785,10,465,785,450);shine.addColorStop(0,'rgba(255,249,226,.22)');shine.addColorStop(1,'rgba(255,249,226,0)');
  g.fillStyle=shine;g.fillRect(SX,SY,SW,SH);
  // Counter and sink.
  box(88,1008,660,34,'#515b6a',12,'#e4dadd',3);
  g.fillStyle='#9ba7b5';g.beginPath();g.moveTo(300,1024);g.lineTo(690,1024);g.lineTo(654,1153);g.quadraticCurveTo(496,1214,337,1153);g.closePath();g.fill();
  g.strokeStyle='#f0ebed';g.lineWidth=8;g.beginPath();g.moveTo(304,1022);g.lineTo(690,1022);g.stroke();
  g.fillStyle='#647b8a';g.beginPath();g.ellipse(498,1080,143,46,0,0,TAU);g.fill();
  g.fillStyle='rgba(141,217,238,.76)';g.beginPath();g.ellipse(500,1083,120,28,0,0,TAU);g.fill();
  // Faucet, water stream and timed droplets.
  g.lineCap='round';g.lineJoin='round';g.strokeStyle='#596d7d';g.lineWidth=31;
  g.beginPath();g.moveTo(620,1014);g.lineTo(620,800);g.quadraticCurveTo(620,735,562,735);g.lineTo(508,735);g.stroke();
  g.strokeStyle='#dce6e8';g.lineWidth=17;g.beginPath();g.moveTo(620,1008);g.lineTo(620,801);g.quadraticCurveTo(620,700,566,750);g.lineTo(510,750);g.stroke();
  g.strokeStyle='#596d7d';g.lineWidth=23;g.beginPath();g.moveTo(510,735);g.lineTo(510,781);g.stroke();
  g.strokeStyle='#dce6e8';g.lineWidth=12;g.beginPath();g.moveTo(510,741);g.lineTo(510,778);g.stroke();
  for(let i=0;i<5;i++){
    const k=(local*.58+i*.22)%1,y=790+k*205;
    g.fillStyle='rgba(117,216,244,.94)';g.beginPath();g.ellipse(510+Math.sin(local*2+i)*3,y,6,11,0,0,TAU);g.fill();
  }
  // Gucci, unmistakably a sphynx, animated to lap at the tap.
  drawSphynx(455,1126,1.86,t);
  pill('ГУЧЧИ',130,385,184,56,'#4d4151',C.paper,'rgba(255,255,255,.18)',25);
  // Valera is an automatic feeder with a clock, not a generic bowl.
  const fx=782,fy=632,fw=190,fh=378;
  box(fx,fy,fw,fh,'#344054',28,'#8996a6',4);
  box(fx+18,fy+18,fw-36,52,'#242c3c',16);
  text('ВАЛЕРА',fx+fw/2,fy+44,26,C.amber,900,'center','ui-monospace,monospace');
  box(fx+28,fy+90,fw-56,166,'#1e2939',18,'#586778',3);
  g.fillStyle='#c99e5e';g.beginPath();g.moveTo(fx+44,fy+119);g.lineTo(fx+fw-44,fy+119);g.lineTo(fx+fw/2,fy+226);g.closePath();g.fill();
  text('КОРМ ПО ЧАСАМ',fx+fw/2,fy+281,17,C.muted,800,'center','ui-monospace,monospace');
  const clock=pulse(local,.25);g.strokeStyle=C.mint;g.lineWidth=3;g.beginPath();g.arc(fx+fw/2,fy+344,16,0,TAU);g.stroke();
  line(fx+fw/2,fy+344,fx+fw/2+Math.cos(clock*TAU)*11,fy+344+Math.sin(clock*TAU)*11,C.mint,3);
  g.fillStyle='#667587';g.beginPath();g.ellipse(fx+fw/2,1057,105,27,0,0,TAU);g.fill();
  g.fillStyle='#333e50';g.beginPath();g.ellipse(fx+fw/2,1050,82,17,0,0,TAU);g.fill();
  for(let i=0;i<7;i++){
    const drop=(local*.68+i*.17)%1;
    const px=fx+fw/2+Math.sin(i*7.1)*35,py=987+drop*58;
    g.fillStyle='#d8b77b';g.beginPath();g.arc(px,py,5,0,TAU);g.fill();
  }
  pill('АВТОКОРМУШКА',735,1120,284,52,'rgba(17,22,34,.88)',C.mint,'rgba(255,255,255,.14)',21);
  text('КРАН',510,690,17,'#4e6375',800,'center','ui-monospace,monospace');
}
function drawSphynx(cx,baseY,s,t){
  g.save();g.translate(cx,baseY);g.scale(s,s);
  g.fillStyle='rgba(10,15,25,.20)';g.beginPath();g.ellipse(-18,3,112,20,0,0,TAU);g.fill();
  const tail=Math.sin(t*2.7)*.09;
  g.save();g.translate(-99,-58);g.rotate(tail);
  g.strokeStyle='#b39b98';g.lineWidth=13;g.lineCap='round';g.beginPath();
  g.moveTo(0,0);g.bezierCurveTo(-52,-35,-51,-92,-14,-96);g.bezierCurveTo(13,-99,18,-71,-1,-64);g.stroke();g.restore();
  const breath=1+.012*Math.sin(t*2.3);
  g.fillStyle='#c9b4ad';g.beginPath();g.ellipse(-29,-58,86,48*breath,-.04,0,TAU);g.fill();
  g.strokeStyle='#a58c8a';g.lineWidth=2.5;
  for(let i=0;i<4;i++){g.beginPath();g.moveTo(-90+i*31,-85);g.quadraticCurveTo(-77+i*30,-62,-86+i*30,-39);g.stroke()}
  g.fillStyle='#ceb9b1';g.beginPath();g.ellipse(47,-92,42,44,.20,0,TAU);g.fill();
  g.save();g.translate(54+Math.sin(t*1.1)*3,-145+Math.sin(t*2.8)*2);g.rotate(.10+Math.sin(t*1.5)*.025);
  g.fillStyle='#d5c1b8';g.beginPath();g.ellipse(0,0,50,42,-.08,0,TAU);g.fill();
  g.beginPath();g.moveTo(-38,-25);g.lineTo(-34,-77);g.lineTo(-4,-39);g.closePath();g.fill();
  g.beginPath();g.moveTo(14,-37);g.lineTo(42,-77);g.lineTo(48,-21);g.closePath();g.fill();
  g.fillStyle='#a8959a';g.beginPath();g.moveTo(-30,-33);g.lineTo(-29,-63);g.lineTo(-12,-39);g.closePath();g.fill();
  g.beginPath();g.moveTo(23,-36);g.lineTo(38,-62);g.lineTo(40,-28);g.closePath();g.fill();
  const blink=Math.max(0,1-Math.abs(((t+1.3)%4.1)-3.86)/.12);
  g.fillStyle='#4a916f';g.beginPath();g.ellipse(-17,-1,6,8*(1-blink),0,0,TAU);g.ellipse(18,-1,6,8*(1-blink),0,0,TAU);g.fill();
  g.fillStyle='#1a1d25';g.fillRect(-18,-8,3,16*(1-blink));g.fillRect(17,-8,3,16*(1-blink));
  g.fillStyle='#c78588';g.beginPath();g.moveTo(0,12);g.lineTo(-7,19);g.lineTo(7,19);g.closePath();g.fill();
  g.strokeStyle='#8f777a';g.lineWidth=2;g.beginPath();g.moveTo(0,19);g.quadraticCurveTo(-3,25,-12,23);g.moveTo(0,19);g.quadraticCurveTo(4,25,12,22);g.stroke();
  g.strokeStyle='#9b8789';g.lineWidth=1.5;
  for(let i=0;i<3;i++){const yy=10+i*6;g.beginPath();g.moveTo(-5,yy);g.lineTo(-37,yy-7+i*3);g.moveTo(7,yy);g.lineTo(39,yy-8+i*4);g.stroke()}
  if(Math.sin(t*8)>.55){g.fillStyle='#e68f9a';g.beginPath();g.ellipse(2,28,4,8,0,0,TAU);g.fill()}
  g.restore();
  g.fillStyle='#d5c1b8';g.beginPath();g.ellipse(10,-7,25,13,0,0,TAU);g.ellipse(65,-8,23,13,0,0,TAU);g.fill();
  g.strokeStyle='#a8959a';g.lineWidth=2;g.beginPath();g.moveTo(9,-12);g.lineTo(9,-3);g.moveTo(64,-13);g.lineTo(64,-3);g.stroke();
  g.restore();
}
function drawStreamerHead(x,y,s,t,expression='smile'){
  g.save();g.translate(x,y);g.scale(s,s);
  const blink=Math.max(0,1-Math.abs(((t+1.1)%4.4)-4.08)/.12);
  const tilt=expression==='tired'?.035*Math.sin(t*.8):.025*Math.sin(t*1.35);
  g.rotate(tilt);
  // Ears and neck, drawn under the face.
  g.fillStyle=C.skin;g.strokeStyle='#5b4038';g.lineWidth=4;
  g.beginPath();g.ellipse(-66,10,15,23,-.08,0,TAU);g.ellipse(66,10,15,23,.08,0,TAU);g.fill();g.stroke();
  const neck=g.createLinearGradient(-18,55,22,120);neck.addColorStop(0,'#dbaa8d');neck.addColorStop(1,C.skin);
  g.fillStyle=neck;g.beginPath();g.roundRect(-25,49,50,73,15);g.fill();
  // Face silhouette and warm highlight.
  const skin=g.createLinearGradient(-50,-62,52,72);skin.addColorStop(0,'#f6d4b7');skin.addColorStop(.65,C.skin);skin.addColorStop(1,'#d8a789');
  g.fillStyle=skin;g.strokeStyle='#302529';g.lineWidth=5;
  g.beginPath();g.moveTo(-62,-22);g.quadraticCurveTo(-69,-60,-38,-77);g.quadraticCurveTo(0,-97,39,-76);g.quadraticCurveTo(68,-54,63,-15);g.lineTo(56,36);g.quadraticCurveTo(45,85,0,96);g.quadraticCurveTo(-45,83,-57,37);g.closePath();g.fill();g.stroke();
  // Short swept hair, based on the reference photo.
  g.fillStyle=C.hair;g.beginPath();g.moveTo(-65,-24);g.quadraticCurveTo(-74,-74,-29,-91);g.quadraticCurveTo(6,-105,42,-84);g.quadraticCurveTo(69,-66,65,-25);g.quadraticCurveTo(51,-42,39,-51);g.quadraticCurveTo(7,-34,-22,-47);g.quadraticCurveTo(-42,-36,-65,-24);g.closePath();g.fill();
  g.fillStyle='#4a3b3b';g.beginPath();g.moveTo(-48,-72);g.quadraticCurveTo(-13,-98,22,-82);g.quadraticCurveTo(-2,-78,-22,-63);g.closePath();g.fill();
  // Full beard silhouette and moustache.
  g.fillStyle='#342d2e';g.beginPath();g.moveTo(-60,3);g.quadraticCurveTo(-69,35,-51,69);g.quadraticCurveTo(-36,96,-6,111);g.quadraticCurveTo(0,116,7,111);g.quadraticCurveTo(39,98,54,68);g.quadraticCurveTo(70,35,59,4);g.quadraticCurveTo(39,30,20,27);g.quadraticCurveTo(0,22,-18,29);g.quadraticCurveTo(-40,27,-60,3);g.closePath();g.fill();
  g.fillStyle='#3d3434';g.beginPath();g.ellipse(-18,30,24,11,.15,0,TAU);g.ellipse(18,30,24,11,-.15,0,TAU);g.fill();
  // Brows, lively eyes and a simple nose.
  const eyeH=expression==='tired'?7:10;
  g.strokeStyle='#302529';g.lineWidth=7;g.lineCap='round';
  g.beginPath();g.moveTo(-43,-28);g.quadraticCurveTo(-25,-38,-11,-29);g.moveTo(11,-29);g.quadraticCurveTo(26,-39,43,-27);g.stroke();
  g.fillStyle='#fff8eb';g.beginPath();g.ellipse(-27,-12,13,Math.max(1,eyeH*(1-blink)),0,0,TAU);g.ellipse(27,-12,13,Math.max(1,eyeH*(1-blink)),0,0,TAU);g.fill();
  if(blink<.85){g.fillStyle='#24303a';g.beginPath();g.ellipse(-25,-12,5,7*(1-blink),0,0,TAU);g.ellipse(29,-12,5,7*(1-blink),0,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-26,-14,2,0,TAU);g.arc(28,-14,2,0,TAU);g.fill()}
  g.strokeStyle='#9d6d5c';g.lineWidth=3;g.beginPath();g.moveTo(0,-4);g.quadraticCurveTo(-3,12,4,18);g.stroke();
  // Smile with visible teeth, like the supplied portrait.
  if(expression==='tired'){
    g.strokeStyle='#221e22';g.lineWidth=5;g.beginPath();g.moveTo(-20,48);g.quadraticCurveTo(0,42,20,48);g.stroke();
  }else{
    g.fillStyle='#221b21';g.beginPath();g.ellipse(0,49,26,14+2*pulse(t,1.9),0,0,TAU);g.fill();
    g.fillStyle='#fff3e5';g.beginPath();g.roundRect(-19,39,38,10,4);g.fill();
    g.strokeStyle='#cf8e7a';g.lineWidth=2;g.beginPath();g.moveTo(-16,55);g.quadraticCurveTo(0,63,16,55);g.stroke();
  }
  // A few beard strokes add a drawn/inked finish rather than a flat avatar.
  g.strokeStyle='rgba(220,194,171,.25)';g.lineWidth=2;
  for(let i=0;i<5;i++){g.beginPath();g.moveTo(-39+i*18,56);g.quadraticCurveTo(-28+i*14,76,-18+i*9,87);g.stroke()}
  g.restore();
}
function drawStreamer(x,headY,s,t,pose='idle',expression='smile'){
  g.save();g.translate(x,headY);g.scale(s,s);
  const bob=(pose==='idle'||pose==='typing')?Math.sin(t*2.2)*2.2:Math.sin(t*1.5)*1.2;
  // Soft hoodie hood behind the head.
  g.fillStyle='#263750';g.beginPath();g.ellipse(0,72+bob,90,82,.02,Math.PI,TAU);g.fill();
  const armPose={
    typing:{L:[[-62,142],[-96,204],[-68,238]],R:[[62,142],[108,200],[142,224]]},
    stamp:{L:[[-62,142],[-119,190],[-205,194]],R:[[62,142],[111,183],[147,236]]},
    point:{L:[[-62,142],[-113,207],[-142,292]],R:[[62,142],[107,77],[165,25]]},
    idle:{L:[[-62,142],[-111,213],[-125,306]],R:[[62,142],[111,213],[125,306]]}
  }[pose]||{L:[[-62,142],[-111,213],[-125,306]],R:[[62,142],[111,213],[125,306]]};
  function arm(points,phase){
    const p=points.map((q,i)=>[q[0]+(i===2?Math.sin(t*5+phase)*3:0),q[1]+(i===2?Math.cos(t*4+phase)*2:0)]);
    strokePath([p[0],p[1]],'#202b3d',62);strokePath([p[0],p[1]],C.hood,51);
    strokePath([p[1],p[2]],'#463c39',39);strokePath([p[1],p[2]],C.skin,30);
    g.fillStyle=C.skin;g.beginPath();g.ellipse(p[2][0],p[2][1],19,15,0,0,TAU);g.fill();
    g.strokeStyle='#9b705d';g.lineWidth=2;g.beginPath();g.arc(p[2][0]+4,p[2][1],10,-.4,1.2);g.stroke();
  }
  // Hoodie torso, pocket, cuffs and seams.
  const cloth=g.createLinearGradient(-110,110,110,360);cloth.addColorStop(0,'#55759b');cloth.addColorStop(.55,C.hood);cloth.addColorStop(1,'#2d4564');
  g.fillStyle=cloth;g.strokeStyle='#1d2b40';g.lineWidth=7;g.beginPath();
  g.moveTo(-63,105);g.quadraticCurveTo(-135,125,-149,200);g.lineTo(-174,347);g.quadraticCurveTo(-111,371,0,370);g.quadraticCurveTo(111,371,174,347);g.lineTo(149,200);g.quadraticCurveTo(135,125,63,105);g.closePath();g.fill();g.stroke();
  g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.moveTo(-48,129);g.quadraticCurveTo(0,167,48,129);g.quadraticCurveTo(33,196,0,209);g.quadraticCurveTo(-31,194,-48,129);g.fill();
  line(0,198,0,344,'rgba(18,29,45,.55)',5);
  g.strokeStyle='rgba(219,229,238,.52)';g.lineWidth=4;g.beginPath();g.moveTo(-20,129);g.lineTo(-9,149);g.moveTo(20,129);g.lineTo(9,149);g.stroke();
  g.fillStyle='#263c59';g.beginPath();g.roundRect(-62,264,124,59,17);g.fill();
  line(-48,280,-48,304,'rgba(255,255,255,.15)',2);line(48,280,48,304,'rgba(255,255,255,.15)',2);
  // Forearms and hands animate in front of the hoodie: typing, stamping, or pointing.
  arm(armPose.L,.7);arm(armPose.R,2.4);
  // Neck then face.
  g.fillStyle='#d3a98e';g.fillRect(-22,55,44,67);
  drawStreamerHead(0,0,1,t,expression);
  g.restore();
}
function drawSeedling(x,y,growth,t,index){
  const h=24+118*growth, sway=Math.sin(t*2.8+index)*9*growth;
  g.strokeStyle='#69c984';g.lineWidth=11;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+sway,y-h*.55,x+sway*.5,y-h);g.stroke();
  g.fillStyle=index%2?'#8ddb80':'#57bc78';
  g.beginPath();g.ellipse(x-28+sway*.5,y-h*.55,30*growth+8,13*growth+5,-.48,0,TAU);g.ellipse(x+28+sway*.5,y-h*.73,30*growth+8,13*growth+5,.48,0,TAU);g.fill();
  if(growth>.50){
    const r=18+22*(growth-.5)*2;
    g.fillStyle=index%2?'#ff9369':'#f6bd59';g.beginPath();g.ellipse(x+sway*.5,y-h-12,r,r*.82,0,0,TAU);g.fill();
    g.fillStyle='#34202a';g.beginPath();g.arc(x+sway*.5-7,y-h-14,3+growth*2,0,TAU);g.arc(x+sway*.5+7,y-h-14,3+growth*2,0,TAU);g.fill();
    g.strokeStyle='#34202a';g.lineWidth=3;g.beginPath();g.arc(x+sway*.5,y-h-2,8,0,Math.PI);g.stroke();
  }
}
function drawJapanFlag(x,y,k){
  if(k<=0)return;
  const s=.4+.6*easeBack(k),a=smooth(k);
  g.save();g.translate(x,y);g.scale(s,s);g.globalAlpha*=a;
  box(-112,-70,224,140,'#fffdf7',18,'rgba(31,42,54,.24)',3);
  g.fillStyle='#d94d56';g.beginPath();g.arc(0,0,38+3*Math.sin(k*9),0,TAU);g.fill();
  g.restore();
  if(k>.2){alpha(a,()=>{
    line(x-202,y+100,x-130,y+100,C.amber,6);g.fillStyle=C.amber;g.beginPath();g.moveTo(x-128,y+87);g.lineTo(x-105,y+100);g.lineTo(x-128,y+113);g.closePath();g.fill();
    pill('ЯПОНИЯ',x-82,y+78,164,42,'rgba(17,22,34,.91)',C.paper,'rgba(255,255,255,.16)',18);
  })}
}
function drawHellfarmerStage(scene,t){
  const l=t-scene.start;
  const bg=g.createLinearGradient(44,280,1036,1300);bg.addColorStop(0,'#21354a');bg.addColorStop(.5,'#293149');bg.addColorStop(1,'#111a29');g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  // Heat shimmer and tiny ember dots move behind the desktop window.
  for(let i=0;i<18;i++){
    const x=70+hp(i*4.2)*930,y=350+((hp(i*8.1)*660+l*(10+hp(i)*12))%720);
    g.fillStyle=`rgba(255,${120+Math.floor(hp(i+9)*80)},75,${.12+.20*pulse(l+i,.45)})`;
    g.beginPath();g.arc(x,y,2+hp(i*3)*4,0,TAU);g.fill();
  }
  pill('ПОСЛЕ 10 ЛЕТ БЕЗ РЕЛИЗА',73,325,384,48,'rgba(12,19,30,.84)',C.amber,'rgba(255,255,255,.18)',18);
  const reveal=smooth((l-.15)/.72),scale=.82+.18*easeBack(reveal);
  g.save();g.translate(635,665);g.scale(scale,scale);g.translate(-635,-665);
  // Desktop window, with a hand-drawn farming game running inside it.
  box(284,386,698,554,'#131c29',29,'#8291a1',5);
  box(301,403,664,46,'#26364a',17);
  g.fillStyle=C.red;g.beginPath();g.arc(326,426,7,0,TAU);g.fill();g.fillStyle=C.amber;g.beginPath();g.arc(349,426,7,0,TAU);g.fill();g.fillStyle=C.mint;g.beginPath();g.arc(372,426,7,0,TAU);g.fill();
  text('DESKTOP HELLFARMER  ·  BUILD 01',398,426,18,C.paper,800,'left','ui-monospace,monospace');
  clipRound(306,456,654,337,15,()=>{
    const sky=g.createLinearGradient(0,456,0,793);sky.addColorStop(0,'#334e67');sky.addColorStop(.63,'#537264');sky.addColorStop(1,'#292d3d');g.fillStyle=sky;g.fillRect(306,456,654,337);
    g.fillStyle='rgba(255,218,135,.92)';g.beginPath();g.arc(840,523,42+4*Math.sin(l*2),0,TAU);g.fill();
    for(let i=0;i<4;i++){
      const cx=365+i*178+Math.sin(l*.45+i)*13,cy=505+i%2*29;
      g.fillStyle='rgba(20,32,48,.35)';g.beginPath();g.ellipse(cx,cy,63,17,0,0,TAU);g.ellipse(cx+48,cy-8,35,18,0,0,TAU);g.fill();
    }
    g.fillStyle='#354737';g.beginPath();g.moveTo(306,657);g.quadraticCurveTo(500,608,651,662);g.quadraticCurveTo(821,708,960,645);g.lineTo(960,793);g.lineTo(306,793);g.closePath();g.fill();
    g.fillStyle='#67432e';g.beginPath();g.moveTo(306,697);g.quadraticCurveTo(580,656,960,701);g.lineTo(960,793);g.lineTo(306,793);g.closePath();g.fill();
    // furrows and glowing planted seeds
    for(let i=0;i<5;i++){
      g.strokeStyle='rgba(239,184,110,.28)';g.lineWidth=4;g.beginPath();g.moveTo(318,715+i*18);g.quadraticCurveTo(600,681+i*19,950,723+i*14);g.stroke();
    }
    for(let i=0;i<4;i++){
      const growth=smooth((l-(.9+i*.30))/1.6),x=378+i*143,y=740+(i%2)*15;
      g.fillStyle='rgba(255,191,98,.3)';g.beginPath();g.ellipse(x,y,31+growth*24,8+growth*7,0,0,TAU);g.fill();
      drawSeedling(x,y-3,growth,l,i);
    }
    // Animated seeds land in the new row during the first beat.
    for(let i=0;i<3;i++){
      const u=(l*.72+i*.31)%1,x=mix(400+i*120,420+i*120,u),y=520+u*172+Math.sin(u*Math.PI)*-86;
      g.fillStyle='#ffd883';g.beginPath();g.ellipse(x,y,7,10,.4,0,TAU);g.fill();
    }
    g.fillStyle='rgba(20,15,22,.82)';g.beginPath();g.moveTo(306,793);g.lineTo(960,793);g.lineTo(960,807);g.lineTo(306,807);g.closePath();g.fill();
  });
  box(306,810,654,105,'#1a2533',0);
  // Build meter grows; status flips from DEV to RELEASE.
  text('HARVEST',352,835,15,C.muted,800,'left','ui-monospace,monospace');
  box(352,857,355,16,'#101720',8);
  box(352,857,355*smooth((l-1)/4.8),16,C.mint,8);
  const ready=l>4.8;
  const btn=ready?C.amber:'#4c6a66';box(752,829,176,55,btn,16,'rgba(255,255,255,.20)',2);
  text(ready?'PUBLISH':'GROW',840,857,20,ready?'#271e16':C.paper,900,'center','ui-monospace,monospace');
  if(ready&&l<6.6){
    const bounce=Math.sin((l-4.8)*7)*4;
    text('НАЖМИ!',840,805+bounce,15,C.amber,900,'center','ui-monospace,monospace');
  }
  g.restore();
  // Desk, keyboard, and the hand-drawn streamer character from the portrait reference.
  box(67,1062,918,28,'#775c45',10,'#c39b69',3);box(102,1090,38,112,'#493a34',7);box(913,1090,38,112,'#493a34',7);
  box(133,1014,432,39,'#303847',12,'#8b98a9',2);
  for(let r=0;r<2;r++)for(let c=0;c<13;c++)box(147+c*30,1021+r*13,21,7,(c+r+Math.floor(l*3))%7===0?'#ffc06a':'#778396',3);
  box(585,1001,63,49,'#202b38',9,'#718197',2);g.fillStyle=C.mint;g.beginPath();g.arc(616,1026,6,0,TAU);g.fill();
  drawStreamer(208,851,.80,l,'typing','smile');
  // The cursor click detonates into a shipment arrow headed east.
  if(l>4.8){
    const k=smooth((l-4.8)/.48);
    alpha(k,()=>{
      g.strokeStyle=C.amber;g.lineWidth=6;g.setLineDash([14,11]);g.lineDashOffset=-l*34;g.beginPath();g.moveTo(704,966);g.quadraticCurveTo(770,898,818,928);g.stroke();g.setLineDash([]);
      drawJapanFlag(865,985,clamp((l-5.25)/.7));
      for(let i=0;i<8;i++){
        const a=i*TAU/8,rrr=35+55*k;
        g.fillStyle=i%2?C.amber:C.mint;g.beginPath();g.arc(840+Math.cos(a)*rrr,895+Math.sin(a)*rrr,4+4*k,0,TAU);g.fill();
      }
    });
  }
  pill('2 МЕСЯЦА РАБОТЫ → РЕЛИЗ',82,1191,397,49,'rgba(12,18,28,.86)',C.mint,'rgba(255,255,255,.14)',18);
  pill('ПЕРВЫЕ КОПИИ · ЯПОНИЯ',596,1191,399,49,'rgba(12,18,28,.86)',C.amber,'rgba(255,255,255,.14)',18);
}
function drawBackpack(cx,cy,open,t){
  g.save();g.translate(cx,cy);
  // backpack shadow and body
  g.fillStyle='rgba(5,8,15,.25)';g.beginPath();g.ellipse(0,132,147,20,0,0,TAU);g.fill();
  g.strokeStyle='#27334a';g.lineWidth=15;g.beginPath();g.moveTo(-96,-90);g.bezierCurveTo(-166,-90,-162,77,-112,104);g.moveTo(96,-90);g.bezierCurveTo(166,-90,162,77,112,104);g.stroke();
  const grad=g.createLinearGradient(-130,-145,130,148);grad.addColorStop(0,'#9e7357');grad.addColorStop(.48,'#74523e');grad.addColorStop(1,'#4b3b3b');
  g.fillStyle=grad;g.strokeStyle='#342a31';g.lineWidth=8;g.beginPath();g.roundRect(-124,-142,248,281,48);g.fill();g.stroke();
  // flap opens on a hinge, so every item visibly comes out of this same bag.
  g.save();g.translate(0,-122);g.rotate(-open*.86);
  g.fillStyle='#ba8a60';g.strokeStyle='#342a31';g.lineWidth=7;g.beginPath();g.moveTo(-115,0);g.quadraticCurveTo(-106,-95,0,-112);g.quadraticCurveTo(106,-95,115,0);g.lineTo(83,42);g.lineTo(-83,42);g.closePath();g.fill();g.stroke();
  box(-24,-33,48,41,'#d8b16e',12,'#725235',4);g.restore();
  // front pocket, buckles, zipper and badge
  box(-85,17,170,99,'#564138',25,'#322a30',5);
  g.strokeStyle='#d1b07b';g.lineWidth=5;g.beginPath();g.moveTo(-69,30);g.quadraticCurveTo(0,52,69,30);g.stroke();
  box(-67,70,42,25,'#d5b879',7,'#453630',2);box(25,70,42,25,'#d5b879',7,'#453630',2);
  box(-22,55,44,47,'#e6d1a0',12,'#403438',3);text('BI',0,78,18,'#35303a',900,'center','ui-monospace,monospace');
  g.strokeStyle='#f0c779';g.lineWidth=4;g.beginPath();g.moveTo(110,-43);g.lineTo(110,57);g.stroke();
  g.fillStyle=C.amber;g.beginPath();g.arc(110,Math.sin(t*4)*22+5,7,0,TAU);g.fill();
  g.restore();
}
function drawLoot(kind,x,y,scale,angle,t){
  g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);
  if(kind==='apple'){
    g.fillStyle='#e4615c';g.beginPath();g.ellipse(0,4,28,25,-.15,0,TAU);g.fill();
    g.fillStyle='#79c780';g.beginPath();g.ellipse(15,-20,14,7,-.45,0,TAU);g.fill();line(0,-16,4,-30,'#573a2c',5);
  }else if(kind==='sword'){
    line(0,34,0,-42,'#dce8ef',12);g.fillStyle='#dce8ef';g.beginPath();g.moveTo(0,-68);g.lineTo(-11,-38);g.lineTo(11,-38);g.closePath();g.fill();
    line(-24,25,24,25,C.amber,9);line(0,26,0,45,'#76553a',10);
  }else if(kind==='bread'){
    g.fillStyle='#d9a962';g.beginPath();g.ellipse(0,0,34,23,-.12,0,TAU);g.fill();
    g.strokeStyle='#fff0bf';g.lineWidth=4;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*13-7,-13);g.lineTo(i*13+2,12);g.stroke()}
  }else{
    box(-31,-25,62,50,'#a58155',12,'#533c32',4);g.fillStyle='#221d24';g.beginPath();g.arc(-11,-4,4,0,TAU);g.arc(11,-4,4,0,TAU);g.fill();
    g.strokeStyle='#f7d48e';g.lineWidth=3;g.beginPath();g.arc(0,2,13,0,Math.PI);g.stroke();
  }
  g.restore();
}
function drawStamp(x,y,press,t){
  const angle=mix(-.36,.04,smooth(press));
  g.save();g.translate(x,y+Math.sin(t*2)*3);g.rotate(angle);
  box(-44,-112,88,102,'#72576f',18,'#34283c',5);
  box(-33,-138,66,31,'#a88a91',11,'#3b303d',4);
  box(-50,-14,100,27,press>.95?'#e05f61':'#a83e4e',8,'#552c3e',4);
  g.restore();
  if(press>.86){
    const k=smooth((press-.86)/.14);
    alpha(k,()=>{
      g.save();g.translate(x,y+12);g.rotate(-.055);
      box(-112,-37,224,74,'#e06a64',13,'#762d3e',4);
      text('ПРИНЯТО',0,1,31,'#fff2dc',900,'center','ui-monospace,monospace');g.restore();
      for(let i=0;i<10;i++){const a=i*TAU/10,r=55+22*k;line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),C.amber,3)}
    });
  }
}
function drawAdventurer(x,y,t,index){
  const step=Math.sin(t*3+index)*3;
  g.save();g.translate(x,y+step);
  g.fillStyle=index%2?'#3a5471':'#55496b';g.beginPath();g.roundRect(-22,-54,44,55,13);g.fill();
  g.fillStyle=index%2?'#d8b18f':'#ebcaa7';g.beginPath();g.arc(0,-74,22,0,TAU);g.fill();
  g.fillStyle=index%2?'#6c8a9e':'#c39b62';g.beginPath();g.moveTo(-29,-76);g.lineTo(0,-113);g.lineTo(29,-76);g.closePath();g.fill();
  g.strokeStyle='#24273a';g.lineWidth=8;g.beginPath();g.moveTo(-11,0);g.lineTo(-18,21);g.moveTo(11,0);g.lineTo(18,21);g.stroke();
  g.restore();
}
function drawBackpackStage(scene,t){
  const l=t-scene.start;
  const bg=g.createLinearGradient(44,280,1036,1300);bg.addColorStop(0,'#272243');bg.addColorStop(.5,'#2a2b43');bg.addColorStop(1,'#111925');g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  // A customs hall with a moving queue, lamps, and a visibly hand-drawn screen.
  for(let i=0;i<8;i++){
    const x=90+i*128,y=372+Math.sin(l*.8+i)*5;
    g.fillStyle='rgba(138,200,239,.12)';g.beginPath();g.ellipse(x,y,36,18,0,0,TAU);g.fill();
    g.fillStyle=i%2?C.blue:C.violet;g.beginPath();g.arc(x,y,4+2*pulse(l+i,.8),0,TAU);g.fill();
  }
  box(79,376,516,74,'rgba(12,17,28,.84)',20,'rgba(255,255,255,.16)',2);
  text('ФЭНТЕЗИ-ТАМОЖНЯ',337,414,24,C.blue,900,'center','ui-monospace,monospace');
  box(624,376,372,74,'rgba(12,17,28,.84)',20,'rgba(255,255,255,.16)',2);
  text('СЛЕДУЮЩИЙ ГЕРОЙ',810,414,20,C.muted,800,'center','ui-monospace,monospace');
  // Queue advances by a few pixels; every traveler waits with a suspiciously large bag.
  for(let i=0;i<3;i++){drawAdventurer(720+i*91,633,l,i);box(686+i*91,643,65,13,'#5d4763',6,'rgba(255,255,255,.12)',2)}
  // Inspector (the streamer from the supplied photo) watches the luggage arrive.
  drawStreamer(842,650,.77,l,'stamp','smile');
  // A baggage belt delivers the oversized rucksack into the inspection zone.
  box(77,1000,923,40,'#495468',12,'#8b96a4',3);
  for(let i=0;i<11;i++){
    const x=110+i*82;
    g.fillStyle='#252d3c';g.beginPath();g.arc(x,1048,16,0,TAU);g.fill();
    g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=3;g.beginPath();g.arc(x,1048,9,l*2+i, l*2+i+Math.PI*1.45);g.stroke();
  }
  // Bag arrives, shakes, opens; its contents are individually animated vector props.
  const bagX=mix(225,432,smooth((l-.15)/1.1)),open=smooth((l-1.20)/.55);
  drawBackpack(bagX,846+Math.sin(l*7)*3,open,l);
  const loot=[
    {kind:'apple',at:1.82,dx:-46,dy:-132},
    {kind:'sword',at:2.54,dx:31,dy:-173},
    {kind:'bread',at:3.24,dx:83,dy:-128},
    {kind:'mimic',at:4.05,dx:4,dy:-207}
  ];
  loot.forEach((o,i)=>{
    const k=smooth((l-o.at)/.42);if(k<=0)return;
    const flight=clamp((l-o.at)/1.5),x=bagX+o.dx+Math.sin(flight*Math.PI)*55*(i%2?1:-1),y=846+o.dy-flight*64+Math.sin(flight*TAU+i)*8;
    alpha(Math.min(1,k*2),()=>drawLoot(o.kind,x,y,.78+Math.sin(flight*Math.PI)*.13,(1-flight)*2*Math.PI+Math.sin(l*2+i)*.08,l));
  });
  // Inspector's magnifier catches the last item, then the stamp lands on the belt.
  const lensX=bagX+112,lensY=728+Math.sin(l*2)*5;
  g.strokeStyle='#d6e8ed';g.lineWidth=9;g.beginPath();g.arc(lensX,lensY,52,0,TAU);g.stroke();line(lensX+36,lensY+36,lensX+78,lensY+82,'#d6e8ed',15);
  const press=smooth((l-5.12)/.56);
  drawStamp(657,945,press,l);
  pill('РЮКЗАК → ДОСМОТР → СЮЖЕТ',130,1131,820,48,'rgba(12,17,28,.90)',C.paper,'rgba(255,255,255,.14)',18);
  // Dynamic queue ticket, contained well inside the frame.
  const ticket=String(18-Math.floor((l*1.5)%17)).padStart(2,'0');
  box(89,493,148,78,'rgba(12,17,28,.82)',18,'rgba(255,255,255,.13)',2);
  text('ТАЛОН',163,516,15,C.muted,800,'center','ui-monospace,monospace');text(ticket,163,548,27,C.amber,900,'center','ui-monospace,monospace');
}
function drawBaker(x,y,s,t){
  g.save();g.translate(x,y);g.scale(s,s);
  const walk=Math.sin(t*4)*3;
  // baker hat, face, apron, legs, and the stolen loaf
  g.fillStyle='#f3ead9';g.beginPath();g.ellipse(0,-89,41,19,0,0,TAU);g.ellipse(-18,-111,17,26,-.1,0,TAU);g.ellipse(4,-118,19,30,.08,0,TAU);g.ellipse(23,-108,16,23,.2,0,TAU);g.fill();
  g.fillStyle='#d8a982';g.beginPath();g.arc(0,-64,30,0,TAU);g.fill();
  g.fillStyle='#342a2c';g.beginPath();g.arc(-10,-66,3,0,TAU);g.arc(10,-66,3,0,TAU);g.fill();
  g.fillStyle='#fff0d8';g.beginPath();g.roundRect(-42,-32,84,82,20);g.fill();
  g.fillStyle='#bd5b4f';g.beginPath();g.moveTo(-24,-18);g.lineTo(24,-18);g.lineTo(33,50);g.lineTo(-33,50);g.closePath();g.fill();
  strokePath([[-30,-14],[-61,7],[-78,-12]],'#d8a982',12);strokePath([[30,-14],[54,-2],[72,-19]],'#d8a982',12);
  g.strokeStyle='#313344';g.lineWidth=13;g.beginPath();g.moveTo(-17,49);g.lineTo(-25+walk,82);g.moveTo(17,49);g.lineTo(26-walk,82);g.stroke();
  g.fillStyle='#d9a962';g.beginPath();g.ellipse(91,-30,31,20,-.25,0,TAU);g.fill();
  g.strokeStyle='#fff0bf';g.lineWidth=3;g.beginPath();g.moveTo(81,-40);g.lineTo(91,-21);g.moveTo(97,-43);g.lineTo(105,-24);g.stroke();
  g.restore();
}
function drawBreadSketch(x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);
  g.strokeStyle='#725e46';g.lineWidth=5;g.beginPath();g.moveTo(-92,30);g.quadraticCurveTo(-101,-28,-49,-47);g.quadraticCurveTo(8,-70,67,-34);g.quadraticCurveTo(107,-8,84,36);g.quadraticCurveTo(19,69,-60,52);g.quadraticCurveTo(-89,47,-92,30);g.stroke();
  g.strokeStyle='#b08d62';g.lineWidth=3;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*28-17,-28);g.lineTo(i*28+9,24);g.stroke()}
  g.restore();
}
function drawMountainLayer(baseY,height,color,seed,shift=0){
  const count=9,peaks=[];
  g.beginPath();g.moveTo(SX,1300);
  for(let i=0;i<=count;i++){
    const x=SX+i*SW/count+shift;
    const peak=baseY+(hp(seed+i*7)-.5)*height*.54;
    peaks.push([x,peak]);g.lineTo(x,peak);
    const valley=x+SW/count*.5;
    g.lineTo(valley,peak+height*(.19+hp(seed+i*9+2)*.12));
  }
  g.lineTo(SX+SW,1300);g.closePath();g.fillStyle=color;g.fill();
  // Snow caps are hand-built angular facets, not a raster texture.
  g.fillStyle='rgba(240,250,255,.77)';
  for(let i=0;i<peaks.length;i+=2){
    const [x,peak]=peaks[i];
    g.beginPath();g.moveTo(x-34,peak+height*.14);g.lineTo(x,peak);g.lineTo(x+38,peak+height*.16);g.lineTo(x+12,peak+height*.11);g.lineTo(x,peak+height*.19);g.closePath();g.fill();
  }
}
function drawWorldLandscape(local){
  const sky=g.createLinearGradient(0,SY,0,SY+SH);sky.addColorStop(0,'#5db9d5');sky.addColorStop(.48,'#b8e2e4');sky.addColorStop(1,'#e7e4cb');g.fillStyle=sky;g.fillRect(SX,SY,SW,SH);
  // Sun, drifting clouds, layered mountain ranges and a route called the Meridian.
  g.fillStyle='rgba(255,243,194,.9)';g.beginPath();g.arc(820,500,53+4*Math.sin(local*1.2),0,TAU);g.fill();
  for(let i=0;i<5;i++){
    const x=90+((i*211+local*18)%850),y=448+(i%3)*49;
    g.fillStyle='rgba(255,255,255,.32)';g.beginPath();g.ellipse(x,y,60,13,0,0,TAU);g.ellipse(x+38,y-7,35,15,0,0,TAU);g.fill();
  }
  drawMountainLayer(610,350,'#7ca9b3',13,Math.sin(local*.25)*8);
  drawMountainLayer(671,350,'#4c798b',47,Math.sin(local*.36+1)*10);
  drawMountainLayer(747,350,'#273d53',79,Math.sin(local*.49+2)*13);
  // Near field and a pale road sweeps through the world in first-person view.
  g.fillStyle='#1c4e4f';g.beginPath();g.moveTo(SX,1000);g.quadraticCurveTo(304,889,524,1004);g.quadraticCurveTo(761,1112,1036,936);g.lineTo(1036,1300);g.lineTo(SX,1300);g.closePath();g.fill();
  g.fillStyle='#8fc8aa';g.beginPath();g.moveTo(435,1300);g.quadraticCurveTo(486,1128,537,1027);g.quadraticCurveTo(568,928,611,845);g.quadraticCurveTo(656,955,638,1060);g.quadraticCurveTo(597,1180,608,1300);g.closePath();g.fill();
  // animated dotted route along the meridian
  g.save();g.setLineDash([12,16]);g.lineDashOffset=-local*32;g.strokeStyle='rgba(241,255,220,.88)';g.lineWidth=5;g.beginPath();g.moveTo(525,1260);g.bezierCurveTo(548,1110,596,1030,616,919);g.bezierCurveTo(636,829,604,761,657,706);g.stroke();g.restore();
  for(let i=0;i<16;i++){
    const x=SX+hp(i*5)*SW,y=330+((hp(i*8)*610+local*(14+hp(i*3)*18))%650);
    g.fillStyle=`rgba(255,255,255,${.22+.45*pulse(local+i,.6)})`;g.beginPath();g.arc(x,y,1.5+hp(i)*2,0,TAU);g.fill();
  }
}
function drawFirstPersonHands(local){
  // Camera hands and compass anchor the expanding world as a first-person game.
  const sway=Math.sin(local*1.2)*7;
  g.fillStyle='#23384d';g.beginPath();g.moveTo(44,1130);g.quadraticCurveTo(112,1050,230,1080);g.lineTo(309,1300);g.lineTo(44,1300);g.closePath();g.fill();
  g.fillStyle='#314968';g.beginPath();g.moveTo(1036,1127);g.quadraticCurveTo(958,1050,842,1080);g.lineTo(778,1300);g.lineTo(1036,1300);g.closePath();g.fill();
  g.fillStyle=C.skin;g.beginPath();g.ellipse(264+sway,1152,75,36,-.25,0,TAU);g.ellipse(812-sway,1152,75,36,.25,0,TAU);g.fill();
  box(469,1091,142,142,'rgba(14,27,41,.78)',33,'rgba(230,246,233,.78)',5);
  g.strokeStyle=C.amber;g.lineWidth=6;g.beginPath();g.arc(540,1161,44,0,TAU);g.stroke();
  g.fillStyle=C.mint;g.beginPath();g.moveTo(540,1122);g.lineTo(551,1166);g.lineTo(540,1158);g.lineTo(529,1166);g.closePath();g.fill();
  text('N',540,1110,16,C.paper,900,'center','ui-monospace,monospace');
}
function drawMeridianStage(scene,t){
  const l=t-scene.start,reveal=smooth((l-3.25)/1.32);
  const bg=g.createLinearGradient(44,280,1036,1300);bg.addColorStop(0,'#172a42');bg.addColorStop(.55,'#19233a');bg.addColorStop(1,'#101723');g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  // The paper sketch stays opaque. A circular wipe grows out of the loaf and reveals the game world.
  const tilt=-.018*Math.sin(l*.8);
  g.save();g.translate(548,789);g.rotate(tilt);g.translate(-548,-789);
  box(134,406,828,676,'#f1e7d3',30,'#fff6e8',5);
  for(let i=0;i<9;i++)line(168,500+i*58,929,500+i*58,'rgba(115,137,154,.18)',2);
  text('ИДЕЯ #035',208,465,20,'#786b5b',800,'left','ui-monospace,monospace');
  fitText('ПЕКАРЬ + ПРОПАВШИЙ ХЛЕБ',548,523,700,31,'#493b37',900,'center');
  drawBaker(347,831,.94,l);drawBreadSketch(694,808,1.02);
  g.strokeStyle='#bd655d';g.lineWidth=5;g.setLineDash([9,7]);g.beginPath();g.moveTo(447,752);g.quadraticCurveTo(539,657,646,752);g.stroke();g.setLineDash([]);
  g.fillStyle='#bd655d';g.beginPath();g.moveTo(637,737);g.lineTo(660,750);g.lineTo(637,763);g.closePath();g.fill();
  pill('КТО ВЗЯЛ БУХАНКУ?',548,981,358,42,'rgba(166,79,72,.12)','#8c4946','rgba(140,73,70,.22)',17);
  g.restore();
  // Streamer sketches the first idea; the pencil stroke points at the bread before the world opens.
  alpha(1-smooth((l-3.1)/1.3)*.68,()=>{
    drawStreamer(163,832,.60,l,'point','smile');
    const px=mix(289,665,smooth(l/4.7)),py=mix(938,701,smooth(l/4.7));
    g.save();g.translate(px,py);g.rotate(-.56);box(-8,-61,16,115,'#cba56a',5,'#705a43',2);g.fillStyle='#514338';g.beginPath();g.moveTo(-8,-61);g.lineTo(8,-61);g.lineTo(0,-81);g.closePath();g.fill();g.restore();
  });
  if(reveal>0){
    const radius=32+reveal*1020;
    g.save();g.beginPath();g.arc(694,808,radius,0,TAU);g.clip();
    drawWorldLandscape(l);drawFirstPersonHands(l);
    g.restore();
    if(reveal<.99){
      g.strokeStyle=`rgba(255,233,173,${.72*(1-reveal)})`;g.lineWidth=8*(1-reveal)+2;g.beginPath();g.arc(694,808,radius,0,TAU);g.stroke();
    }
    if(reveal>.50){
      alpha(smooth((reveal-.50)/.30),()=>{
        pill('ПЕРВОЕ ЛИЦО  ·  ПРОЕКТ МЕЧТЫ',CX,368,478,48,'rgba(11,26,41,.82)',C.paper,'rgba(255,255,255,.20)',18);
        const markerX=520+Math.sin(l*.55)*180,markerY=824+Math.cos(l*.43)*35;
        g.fillStyle=C.amber;g.beginPath();g.arc(markerX,markerY,9+4*pulse(l,1.5),0,TAU);g.fill();
        g.strokeStyle='rgba(255,192,106,.62)';g.lineWidth=3;g.beginPath();g.arc(markerX,markerY,21+6*pulse(l,1.5),0,TAU);g.stroke();
      });
    }
  }
}
function drawHangingDev(cx,barY,local){
  const sway=Math.sin(local*1.05)*5;
  // Fixed hang position: a tiny leg sway, no upward motion and no pull-up pose.
  line(690,barY,974,barY,'#c4d0d8',17);line(710,barY,710,1118,'#718197',13);line(954,barY,954,1118,'#718197',13);
  box(680,barY-15,28,30,C.amber,9);box(956,barY-15,28,30,C.amber,9);
  // Arms remain extended to the bar for the whole shot.
  strokePath([[cx-44,barY+228],[cx-67,barY+116],[cx-75,barY+5]],'#3a4f6d',39);
  strokePath([[cx-44,barY+228],[cx-67,barY+116],[cx-75,barY+5]],C.skin,28);
  strokePath([[cx+44,barY+228],[cx+67,barY+116],[cx+75,barY+5]],'#3a4f6d',39);
  strokePath([[cx+44,barY+228],[cx+67,barY+116],[cx+75,barY+5]],C.skin,28);
  g.fillStyle=C.skin;g.beginPath();g.ellipse(cx-75,barY+4,20,15,-.15,0,TAU);g.ellipse(cx+75,barY+4,20,15,.15,0,TAU);g.fill();
  // Hoodie torso and legs hang still beneath the bar.
  const body=g.createLinearGradient(cx-55,barY+230,cx+55,barY+480);body.addColorStop(0,'#55729a');body.addColorStop(1,'#263952');
  g.fillStyle=body;g.strokeStyle='#1b273b';g.lineWidth=6;g.beginPath();g.roundRect(cx-58,barY+214,116,274,34);g.fill();g.stroke();
  line(cx,barY+251,cx,barY+438,'rgba(19,31,48,.55)',4);
  drawStreamerHead(cx,barY+151,.79,local,'tired');
  g.strokeStyle='#202b3e';g.lineWidth=31;g.lineCap='round';g.beginPath();
  g.moveTo(cx-25,barY+479);g.lineTo(cx-40+sway,barY+626);g.moveTo(cx+25,barY+479);g.lineTo(cx+40+sway,barY+624);g.stroke();
  g.strokeStyle=C.skin;g.lineWidth=18;g.beginPath();g.moveTo(cx-40+sway,barY+626);g.lineTo(cx-75+sway,barY+642);g.moveTo(cx+40+sway,barY+624);g.lineTo(cx+83+sway,barY+638);g.stroke();
  g.fillStyle='#232a37';g.beginPath();g.ellipse(cx-91+sway,barY+645,27,13,-.12,0,TAU);g.ellipse(cx+94+sway,barY+641,27,13,.12,0,TAU);g.fill();
}
function drawBreakStage(scene,t){
  const l=t-scene.start;
  const bg=g.createLinearGradient(44,280,1036,1300);bg.addColorStop(0,'#292538');bg.addColorStop(.56,'#25243a');bg.addColorStop(1,'#151722');g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  const halo=g.createRadialGradient(815,772,15,815,772,430);halo.addColorStop(0,'rgba(201,154,255,.20)');halo.addColorStop(1,'rgba(201,154,255,0)');g.fillStyle=halo;g.fillRect(SX,SY,SW,SH);
  for(let y=343;y<1062;y+=118)line(73,y,1006,y,'rgba(255,255,255,.07)',2);
  box(95,396,481,516,'rgba(12,17,27,.82)',30,'rgba(255,255,255,.17)',3);
  text('ПЕРЕРЫВ',335,474,37,C.mint,900,'center','ui-monospace,monospace');
  text('5 МИНУТ',335,548,29,C.amber,900,'center','ui-monospace,monospace');
  line(156,602,514,602,'rgba(255,255,255,.16)',3);
  text('ЧЕЛОВЕК: В РЕЖИМЕ SLEEP',335,660,19,C.muted,800,'center','ui-monospace,monospace');
  // a harmless pretend system meter, explicitly not a repetition counter
  text('ЗАДАЧА: ПОДВИСНУТЬ',335,731,23,C.paper,800,'center','ui-monospace,monospace');
  box(157,774,356,19,'#101521',10);box(157,774,356*smooth((l+.5)/11),19,C.violet,10);
  text('ПЕРЕЗАГРУЗКА…',335,833,20,C.violet,800,'center','ui-monospace,monospace');
  pill('ТРЕНИРОВКА НЕ НАЧАЛАСЬ',134,866,402,34,'rgba(255,255,255,.06)',C.muted,'rgba(255,255,255,.13)',15);
  drawHangingDev(830,442,l);
  box(80,1125,920,88,'rgba(10,14,23,.88)',22,'rgba(255,255,255,.14)',2);
  pill('НА ПЕРЕРЫВЕ · ВИСИТ, НЕ ПОДТЯГИВАЕТСЯ',105,1142,870,54,'rgba(127,224,192,.10)',C.mint,'rgba(127,224,192,.28)',20);
}
function drawMiniFarm(x,y,w,h,t){
  box(x,y,w,h,'#263b49',18,'rgba(255,255,255,.16)',2);
  clipRound(x+3,y+3,w-6,h-6,15,()=>{
    const sky=g.createLinearGradient(0,y,0,y+h);sky.addColorStop(0,'#35566c');sky.addColorStop(1,'#32413b');g.fillStyle=sky;g.fillRect(x+3,y+3,w-6,h-6);
    g.fillStyle='#514033';g.fillRect(x+8,y+h*.65,w-16,h*.35);
    for(let i=0;i<4;i++){
      const px=x+28+i*(w-56)/3,scale=.6+.4*pulse(t+i*.6,.5);
      g.strokeStyle=i%2?'#8bdd83':'#f0c66b';g.lineWidth=6;g.beginPath();g.moveTo(px,y+h*.77);g.lineTo(px,y+h*(.50-.08*scale));g.stroke();
      g.fillStyle=i%2?'#8bdd83':'#f0c66b';g.beginPath();g.ellipse(px-9,y+h*.59,13,6,-.5,0,TAU);g.ellipse(px+10,y+h*.54,13,6,.5,0,TAU);g.fill();
    }
    text('FARM!',x+w/2,y+h*.23,18,C.paper,900,'center','ui-monospace,monospace');
  });
}
function drawMiniBag(x,y,w,h,t){
  g.save();g.translate(x+w/2,y+h*.53);const k=Math.sin(t*3)*.035;g.rotate(k);
  g.strokeStyle='#342c37';g.lineWidth=8;g.beginPath();g.arc(0,-15,w*.25,Math.PI,TAU);g.stroke();
  const grad=g.createLinearGradient(-w*.28,-h*.3,w*.28,h*.35);grad.addColorStop(0,'#bd8d62');grad.addColorStop(1,'#584451');
  g.fillStyle=grad;g.strokeStyle='#332a37';g.lineWidth=4;g.beginPath();g.roundRect(-w*.30,-h*.20,w*.60,h*.62,19);g.fill();g.stroke();
  box(-w*.19,h*.02,w*.38,h*.22,'#674d48',11,'#332a37',3);box(-9,h*.03,18,28,C.amber,5);
  g.restore();
  for(let i=0;i<3;i++){const yy=y+h*.24+Math.sin(t*3+i)*6;g.fillStyle=[C.amber,C.mint,C.red][i];g.beginPath();g.arc(x+w*.29+i*11,yy,4,0,TAU);g.fill()}
}
function drawMiniWorld(x,y,w,h,t){
  box(x,y,w,h,'#22354a',18,'rgba(255,255,255,.16)',2);
  clipRound(x+3,y+3,w-6,h-6,15,()=>{
    const sky=g.createLinearGradient(0,y,0,y+h);sky.addColorStop(0,'#7ac6df');sky.addColorStop(1,'#e0e1c8');g.fillStyle=sky;g.fillRect(x+3,y+3,w-6,h-6);
    g.fillStyle='#4c7d8b';g.beginPath();g.moveTo(x,y+h*.77);g.lineTo(x+w*.26,y+h*.35);g.lineTo(x+w*.46,y+h*.71);g.lineTo(x+w*.68,y+h*.27);g.lineTo(x+w,y+h*.74);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.closePath();g.fill();
    g.fillStyle='#f5f3e8';g.beginPath();g.moveTo(x+w*.18,y+h*.48);g.lineTo(x+w*.26,y+h*.35);g.lineTo(x+w*.34,y+h*.50);g.lineTo(x+w*.27,y+h*.46);g.lineTo(x+w*.24,y+h*.5);g.closePath();g.fill();
    g.strokeStyle=C.mint;g.lineWidth=4;g.beginPath();g.moveTo(x+w*.50,y+h*.96);g.quadraticCurveTo(x+w*.44,y+h*.68,x+w*.66,y+h*.44);g.stroke();
    g.fillStyle=C.amber;g.beginPath();g.arc(x+w*.50+Math.sin(t)*8,y+h*.92,5,0,TAU);g.fill();
  });
}
function drawValeraMini(x,y,s,t){
  g.save();g.translate(x,y);g.scale(s,s);
  box(-75,-110,150,210,'#344054',22,'#8190a4',4);
  box(-56,-89,112,37,'#202a3a',11);
  text('ВАЛЕРА',0,-70,18,C.amber,900,'center','ui-monospace,monospace');
  box(-50,-36,100,67,'#1c2838',14,'#536377',3);
  g.fillStyle='#c9a269';g.beginPath();g.moveTo(-37,-21);g.lineTo(37,-21);g.lineTo(0,21);g.closePath();g.fill();
  g.strokeStyle=C.mint;g.lineWidth=3;g.beginPath();g.arc(0,51,15,0,TAU);g.stroke();
  line(0,51,Math.cos(t*.7)*9,51+Math.sin(t*.7)*9,C.mint,3);
  g.fillStyle='#273144';g.beginPath();g.ellipse(0,114,82,19,0,0,TAU);g.fill();
  for(let i=0;i<5;i++){
    const k=(t*.65+i*.2)%1;
    g.fillStyle=C.amber;g.beginPath();g.arc(Math.sin(i*2)*25,63+k*47,4,0,TAU);g.fill();
  }
  g.restore();
}
function drawProjectFinale(scene,t){
  const l=t-scene.start;
  const bg=g.createLinearGradient(44,280,1036,1300);bg.addColorStop(0,'#183d45');bg.addColorStop(.52,'#172d3c');bg.addColorStop(1,'#111a26');g.fillStyle=bg;g.fillRect(SX,SY,SW,SH);
  for(let i=0;i<32;i++){
    const x=70+hp(i*4)*940,y=338+((hp(i*9)*820+l*(10+hp(i)*16))%860);
    g.fillStyle=`rgba(255,255,255,${.13+.20*pulse(l+i,.35)})`;g.beginPath();g.arc(x,y,1.5+hp(i*7)*2.5,0,TAU);g.fill();
  }
  const items=[
    {title:'DESKTOP HELLFARMER',tag:'РЕЛИЗ · ЯПОНИЯ',color:C.amber,draw:drawMiniFarm,at:.48},
    {title:'BACKPACK INSPECTOR',tag:'ФЭНТЕЗИ-ТАМОЖНЯ',color:C.blue,draw:drawMiniBag,at:1.22},
    {title:'WHITE MERIDIAN',tag:'ПРОЕКТ МЕЧТЫ',color:C.mint,draw:drawMiniWorld,at:1.96}
  ];
  items.forEach((item,i)=>{
    const x=68+i*316,w=294,h=471,y=384;
    const k=pop(l,item.at,.48);if(k<=0)return;
    const sc=.84+.16*k+Math.sin(l*2+i)*.008;
    alpha(Math.min(1,k*1.8),()=>{
      g.save();g.translate(x+w/2,y+h/2);g.scale(sc,sc);g.translate(-x-w/2,-y-h/2);
      box(x,y,w,h,'#121c29',24,'rgba(255,255,255,.23)',3);
      box(x+13,y+13,w-26,38,'rgba(8,13,21,.82)',14,'rgba(255,255,255,.08)',1);
      fitText(item.tag,x+w/2,y+32,w-44,16,item.color,900,'center','ui-monospace,monospace');
      item.draw(x+18,y+67,w-36,248,l+i*.7);
      fitText(item.title,x+w/2,y+352,w-26,18,C.paper,900,'center','ui-monospace,monospace');
      line(x+42,y+389,x+w-42,y+389,'rgba(255,255,255,.14)',2);
      text(i===0?'ПЕРВЫЙ РЕЛИЗ':i===1?'ДОСМОТР':'ОТ ПЕРВОГО ЛИЦА',x+w/2,y+425,14,C.muted,800,'center','ui-monospace,monospace');
      g.fillStyle=item.color;g.beginPath();g.arc(x+w/2,y+h-18,5+2*pulse(l+i,.8),0,TAU);g.fill();
      g.restore();
    });
  });
  // Domestic project management: Gucci and Valera are the running gag, not background props.
  const panelY=890,panelA=smooth((l-2.3)/.65);
  alpha(panelA,()=>{
    box(77,panelY,926,327,'rgba(10,16,24,.83)',28,'rgba(127,224,192,.35)',3);
    text('ЗАКРЫЛОСЬ ТОЛЬКО ОДНО ЗАДАНИЕ',540,922,21,C.paper,900,'center','ui-monospace,monospace');
    text('КОРМ ПОДАН. ДЕДЛАЙН ВЫПОЛНЕН.',540,959,18,C.mint,800,'center','ui-monospace,monospace');
    drawSphynx(268,1148,.82,l);
    pill('ГУЧЧИ · КОНТРОЛЬ КРАНА',103,1174,325,34,'rgba(255,255,255,.055)',C.amber,'rgba(255,255,255,.12)',13);
    drawValeraMini(811,1068,.73,l);
    pill('ВАЛЕРА · ДЕДЛАЙН ВЫПОЛНЕН',616,1174,353,34,'rgba(127,224,192,.10)',C.mint,'rgba(127,224,192,.20)',13);
    // An animated approval seal lands as the final spoken line resolves.
    const seal=smooth((l-10.2)/.65);
    if(seal>0){
      const s=.7+.3*easeBack(seal);g.save();g.translate(540,1086);g.rotate(-.08);g.scale(s,s);
      g.globalAlpha*=seal;g.strokeStyle=C.amber;g.lineWidth=5;g.beginPath();g.arc(0,0,62,0,TAU);g.stroke();
      text('СДАНО',0,-3,17,C.amber,900,'center','ui-monospace,monospace');g.restore();
    }
  });
}
function drawQuoteCaption(scene,t){
  const q=scene.quote;if(!q)return;
  const local=t-scene.start;if(local<q.on-.34||local>q.off+.42)return;
  const segs=q.seg&&q.seg.length?q.seg:null;
  let current=null;
  if(segs)current=segs.find(s=>local>=s.t0-.20&&local<=s.t1+.20)||null;
  else if(q.lines&&q.lines.length)current={text:q.lines.join(' · '),t0:q.on,t1:q.off};
  if(!current)return;
  const a=Math.min(clamp((local-(current.t0-.20))/.18),clamp((current.t1+.22-local)/.20));
  if(a<=0)return;
  alpha(a,()=>{
    box(68,1317,944,244,'rgba(8,12,20,.94)',27,'rgba(255,255,255,.19)',2);
    box(91,1340,8,198,C.amber,4);
    text('ЦИТАТА СО СТРИМА · ДОСЛОВНО',124,1358,19,'#ffd99e',800,'left','ui-monospace,monospace');
    wrapped(current.text,CX,1441,830,49,39,C.paper,800,'Georgia,serif',3);
    fitText(q.who||'',976,1525,825,18,C.muted,700,'right','ui-monospace,monospace');
  });
}
function drawNarrationCaption(scene,t){
  const segs=scene.narrSeg||[];if(!segs.length)return;
  const local=t-scene.start,current=segs.find(s=>local>=s.t0-.24&&local<=s.t1+.30);
  if(!current)return;
  const a=Math.min(clamp((local-(current.t0-.24))/.20),clamp((current.t1+.3-local)/.25));if(a<=0)return;
  alpha(a,()=>{
    box(68,1584,944,244,'rgba(8,12,20,.92)',27,'rgba(127,224,192,.24)',2);
    pill('ЗА КАДРОМ',92,1602,174,36,'rgba(127,224,192,.12)',C.mint,'rgba(127,224,192,.22)',17);
    wrapped(current.text.trim(),CX,1710,800,46,37,'#edf3f6',600,'system-ui,sans-serif',3);
  });
}
function drawProgress(t){
  const total=(window.B&&B.TOTAL)||70,y=1891;
  box(43,y,994,8,'rgba(255,255,255,.14)',4);box(43,y,994*clamp(t/total),8,C.amber,4);
  const scenes=(window.B&&B.SC)||[];
  scenes.forEach(s=>{const x=43+994*clamp(s.start/total);g.fillStyle='rgba(255,255,255,.62)';g.fillRect(x,y-5,3,18)});
}
function drawFrame(scene,t){
  stageBackdrop(scene,t);drawHeader(scene,t);drawQuoteCaption(scene,t);drawNarrationCaption(scene,t);drawProgress(t);
}
window.BODY51_DAY_FRAME=drawFrame;
})();
