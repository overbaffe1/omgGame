/* body51-day.js — короткий отдельный монтаж «Три проекта, один разработчик».
   Иллюстрации основаны на фото; титры и инфографика рисуются на canvas и остаются
   внутри безопасного поля 9:16. Без 3D-проекции и объектов, вылезающих за кадр. */
(function(){
'use strict';
const cv=document.getElementById('c');
if(!cv)return;
const g=cv.getContext('2d');
const W=1080,H=1920,CX=W/2,TAU=Math.PI*2;
const C={
  ink:'#111522',ink2:'#171c2b',paper:'#f5f0e7',muted:'#aab3c2',
  mint:'#7fe0c0',mint2:'#b8f3df',amber:'#ffc06a',red:'#ff7474',
  blue:'#8ac8ef',violet:'#b99af5',wood:'#a97742',wood2:'#d5a665'
};
const META={
  cat:{title:'ДОМАШНИЙ ОТДЕЛ КОНТРОЛЯ',source:'#440 · #457 · #462',accent:C.amber,bg:['#25223a','#101725']},
  workshop:{title:'DESKTOP HELLFARMER: ПЕРВЫЙ РЕЛИЗ',source:'#002 · #065',accent:C.amber,bg:['#202b3b','#111723']},
  stream:{title:'BACKPACK INSPECTOR: ФЭНТЕЗИ-ТАМОЖНЯ',source:'#014 · #176 · #012',accent:C.blue,bg:['#292443','#111321']},
  limits:{title:'WHITE MERIDIAN — ПРОЕКТ МЕЧТЫ',source:'#008 · #035',accent:C.mint,bg:['#172c42','#101724']},
  gag:{title:'ПЕРЕРЫВ: ПРОСТО ВИСИМ',source:'#186',accent:C.violet,bg:['#30213d','#151421']},
  release:{title:'ТРИ ПРОЕКТА. ОДИН РАЗРАБОТЧИК.',source:'#002 · #004 · #065',accent:C.mint,bg:['#183a3b','#101a25']}
};
const ART_KEY={cat:'gucci-valera',workshop:'desktop-hellfarmer',stream:'backpack-inspector',limits:'white-meridian'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,k)=>a+(b-a)*k;
const hp=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
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
  const lines=[];let row='';
  for(const word of String(s).trim().split(/\s+/)){
    const next=row?row+' '+word:word;
    if(row&&g.measureText(next).width>maxW){lines.push(row);row=word}else row=next;
  }
  if(row)lines.push(row);
  return lines;
}
function wrapped(s,x,centerY,maxW,lineH,size,color,weight=700,font='system-ui,sans-serif',maxLines=3){
  let rows=wrap(s,maxW,size,weight,font);
  while(rows.length>maxLines&&size>26){size-=2;rows=wrap(s,maxW,size,weight,font)}
  const height=(rows.length-1)*lineH;
  rows.forEach((row,i)=>text(row,x,centerY-height/2+i*lineH,size,color,weight,'center',font));
  return rows.length;
}
function pill(label,x,y,w,h,fill,fg=C.paper,stroke=null,size=23){
  box(x,y,w,h,fill,h/2,stroke,2);fitText(label,x+w/2,y+h/2,w-24,size,fg,800,'center');
}
function alpha(a,fn){g.save();g.globalAlpha*=clamp(a);fn();g.restore()}
function clipRound(x,y,w,h,r,fn){
  g.save();g.beginPath();g.roundRect(x,y,w,h,r);g.clip();fn();g.restore();
}
function art(key){return window.BODY51_ART&&window.BODY51_ART[key]||null;}
function drawCover(img,x,y,w,h,zoom=1,panX=0,panY=0){
  if(!img||!img.width||!img.height)return false;
  const s=Math.max(w/img.width,h/img.height)*zoom,dw=img.width*s,dh=img.height*s;
  g.drawImage(img,x+(w-dw)/2+panX,y+(h-dh)/2+panY,dw,dh);return true;
}
function drawArtworkScene(scene,t,key){
  const img=art(key);if(!img)return false;
  const local=clamp((t-scene.start)/Math.max(.1,scene.dur));
  g.save();g.beginPath();g.rect(0,0,W,H);g.clip();
  drawCover(img,0,0,W,H,1.015+.025*local,Math.sin(local*Math.PI)*7,-local*7);
  const top=g.createLinearGradient(0,0,0,430);top.addColorStop(0,'rgba(8,11,18,.78)');top.addColorStop(1,'rgba(8,11,18,0)');
  g.fillStyle=top;g.fillRect(0,0,W,430);
  const bottom=g.createLinearGradient(0,980,0,H);bottom.addColorStop(0,'rgba(8,11,18,0)');bottom.addColorStop(.42,'rgba(8,11,18,.30)');bottom.addColorStop(1,'rgba(8,11,18,.90)');
  g.fillStyle=bottom;g.fillRect(0,980,W,H-980);g.restore();
  // Full-bleed art is clipped to the 9:16 canvas; all captions stay inside this safe frame.
  g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=2;rr(22,20,1036,1880,28);g.stroke();
  const badges={
    cat:[['ГУЧЧИ · ВОДА ИЗ КРАНА',75,1100,390,C.amber],['ВАЛЕРА · КОРМ ПО ЧАСАМ',615,1100,390,C.mint]],
    workshop:[['ДВА МЕСЯЦА ДО РЕЛИЗА',76,1100,390,C.amber],['ПЕРВЫЕ КОПИИ · ЯПОНИЯ',614,1100,390,C.mint]],
    stream:[['ФЭНТЕЗИ-ТАМОЖНЯ',76,1100,350,C.blue],['13 000 ВИШЛИСТОВ · 2 ИЗДАТЕЛЯ',510,1100,495,C.amber]],
    limits:[['ПРОЕКТ МЕЧТЫ · ОТ ПЕРВОГО ЛИЦА',76,1100,510,C.mint],['ПЕКАРЬ · ХЛЕБ · СВИДЕТЕЛИ',618,1100,387,C.amber]]
  }[scene.id]||[];
  badges.forEach(([label,x,y,w,col])=>pill(label,x,y,w,48,'rgba(8,12,20,.78)',col,'rgba(255,255,255,.18)',16));
  return true;
}
function stageBackdrop(scene,t){
  if(ART_KEY[scene.id]&&drawArtworkScene(scene,t,ART_KEY[scene.id]))return;
  const m=META[scene.id]||META.cat;
  const grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,m.bg[0]);grad.addColorStop(.62,'#151927');grad.addColorStop(1,m.bg[1]);
  g.fillStyle=grad;g.fillRect(0,0,W,H);
  box(42,278,996,1024,'rgba(8,12,20,.42)',38,'rgba(255,255,255,.18)',2);
  clipRound(44,280,992,1020,36,()=>{
    const s=g.createLinearGradient(0,280,0,1300);
    s.addColorStop(0,'rgba(255,255,255,.055)');s.addColorStop(1,'rgba(0,0,0,.10)');
    g.fillStyle=s;g.fillRect(44,280,992,1020);
    switch(scene.id){
      case 'gag':drawBreakStage(scene,t);break;
      case 'release':drawProjectFinale(scene,t);break;
      default:drawCatStage(scene,t);
    }
  });
  g.strokeStyle='rgba(255,255,255,.20)';g.lineWidth=2;rr(44,280,992,1020,36);g.stroke();
}
function drawHeader(scene){
  const meta=META[scene.id]||META.cat;
  const scenes=(window.B&&B.SC)||[];
  const idx=Math.max(0,scenes.findIndex(s=>s.id===scene.id))+1;
  box(42,38,600,78,'rgba(10,13,22,.78)',22,'rgba(255,255,255,.12)',2);
  g.fillStyle=meta.accent;g.beginPath();g.arc(78,77,8,0,TAU);g.fill();
  text('ОДИН ДЕНЬ  ·  @body51',104,78,27,C.paper,800,'left');
  box(720,38,318,78,'rgba(10,13,22,.78)',22,'rgba(255,255,255,.12)',2);
  text(`ЭПИЗОД  ${String(idx).padStart(2,'0')} / ${String(scenes.length||6).padStart(2,'0')}`,879,78,25,C.muted,700,'center','ui-monospace,monospace');
  fitText(meta.title,CX,164,960,39,C.paper,900,'center');
  const sw=fitSource(meta.source);
  pill('ФАКТЫ  '+meta.source,CX-sw/2,201,sw,48,'rgba(8,12,20,.62)',meta.accent,'rgba(255,255,255,.10)',21);
}
function fitSource(s){
  g.font='800 21px system-ui,sans-serif';return Math.min(720,Math.max(330,g.measureText('ФАКТЫ  '+s).width+48));
}
function drawCatStage(scene,t){
  const local=t-scene.start;
  // Bathroom/kitchen wall and tiled border, drawn flat and contained by the stage clip.
  const bg=g.createLinearGradient(0,300,0,1180);bg.addColorStop(0,'#d9d1d1');bg.addColorStop(.64,'#c9c3c9');bg.addColorStop(1,'#9298a5');
  g.fillStyle=bg;g.fillRect(44,280,992,1020);
  g.save();g.globalAlpha=.25;g.strokeStyle='#747c8a';g.lineWidth=2;
  for(let x=80;x<1030;x+=110){g.beginPath();g.moveTo(x,300);g.lineTo(x,950);g.stroke()}
  for(let y=390;y<950;y+=105){g.beginPath();g.moveTo(54,y);g.lineTo(1026,y);g.stroke()}
  g.restore();
  // Counter and sink.
  box(88,1008,660,34,'#515b6a',12,'#e4dadd',3);
  g.fillStyle='#9ba7b5';g.beginPath();g.moveTo(300,1024);g.lineTo(690,1024);g.lineTo(654,1153);g.quadraticCurveTo(496,1214,337,1153);g.closePath();g.fill();
  g.strokeStyle='#f0ebed';g.lineWidth=8;g.beginPath();g.moveTo(304,1022);g.lineTo(690,1022);g.stroke();
  g.fillStyle='#647b8a';g.beginPath();g.ellipse(498,1080,143,46,0,0,TAU);g.fill();
  g.fillStyle='rgba(141,217,238,.68)';g.beginPath();g.ellipse(500,1083,120,28,0,0,TAU);g.fill();
  // Faucet: a chunky, unmistakable tap over the basin.
  g.lineCap='round';g.lineJoin='round';g.strokeStyle='#596d7d';g.lineWidth=31;
  g.beginPath();g.moveTo(620,1014);g.lineTo(620,800);g.quadraticCurveTo(620,735,562,735);g.lineTo(508,735);g.stroke();
  g.strokeStyle='#dce6e8';g.lineWidth=17;g.beginPath();g.moveTo(620,1008);g.lineTo(620,801);g.quadraticCurveTo(620,700,566,750);g.lineTo(510,750);g.stroke();
  g.strokeStyle='#596d7d';g.lineWidth=23;g.beginPath();g.moveTo(510,735);g.lineTo(510,781);g.stroke();
  g.strokeStyle='#dce6e8';g.lineWidth=12;g.beginPath();g.moveTo(510,741);g.lineTo(510,778);g.stroke();
  // Water beads cycle inside the sink area.
  for(let i=0;i<3;i++){
    const k=(local*.48+i*.34)%1, y=790+k*205;
    g.fillStyle='rgba(117,216,244,.95)';g.beginPath();g.ellipse(510,y,7,12,0,0,TAU);g.fill();
  }
  // Clearly named sphynx cat, looking toward the tap.
  drawSphynx(455,1126,1.86,t);
  pill('ГУЧЧИ',130,385,184,56,'#4d4151',C.paper,'rgba(255,255,255,.18)',25);
  // Valera the automatic feeder, not a generic bowl: name and function on the front.
  const fx=782,fy=632,fw=190,fh=378;
  box(fx,fy,fw,fh,'#344054',28,'#8996a6',4);
  box(fx+18,fy+18,fw-36,52,'#242c3c',16);
  text('ВАЛЕРА',fx+fw/2,fy+44,26,C.amber,900,'center','ui-monospace,monospace');
  // food hopper window
  box(fx+28,fy+90,fw-56,166,'#1e2939',18,'#586778',3);
  g.fillStyle='#c99e5e';g.beginPath();g.moveTo(fx+44,fy+119);g.lineTo(fx+fw-44,fy+119);g.lineTo(fx+fw/2,fy+226);g.closePath();g.fill();
  text('АВТО',fx+fw/2,fy+281,20,C.muted,800,'center','ui-monospace,monospace');
  text('КОРМУШКА',fx+fw/2,fy+308,18,C.muted,800,'center','ui-monospace,monospace');
  g.fillStyle=C.mint;g.beginPath();g.arc(fx+fw/2,fy+344,7,0,TAU);g.fill();
  // bowl and tiny timed pellets. All stay within the feeder's footprint.
  g.fillStyle='#667587';g.beginPath();g.ellipse(fx+fw/2,1057,105,27,0,0,TAU);g.fill();
  g.fillStyle='#333e50';g.beginPath();g.ellipse(fx+fw/2,1050,82,17,0,0,TAU);g.fill();
  for(let i=0;i<6;i++){
    const drop=(local*.8+i*.21)%1;
    const px=fx+fw/2+Math.sin(i*7.1)*32;
    const py=987+drop*58;
    g.fillStyle='#d8b77b';g.beginPath();g.arc(px,py,5,0,TAU);g.fill();
  }
  pill('АВТОКОРМУШКА',735,1120,284,52,'rgba(17,22,34,.86)',C.mint,'rgba(255,255,255,.14)',21);
  // A tiny faucet droplet icon emphasizes the cat's preferred // preferred drinking spot.
  text('КРАН',510,690,17,'#4e6375',800,'center','ui-monospace,monospace');
}
function drawSphynx(cx,baseY,s,t){
  g.save();g.translate(cx,baseY);g.scale(s,s);
  g.fillStyle='rgba(10,15,25,.20)';g.beginPath();g.ellipse(-18,3,112,20,0,0,TAU);g.fill();
  // Curled tail, body and little front paws.
  g.strokeStyle='#b39b98';g.lineWidth=13;g.lineCap='round';g.beginPath();
  g.moveTo(-106,-47);g.bezierCurveTo(-157,-82,-156,-139,-119,-143);g.bezierCurveTo(-92,-146,-87,-118,-106,-111);g.stroke();
  g.fillStyle='#c9b4ad';g.beginPath();g.ellipse(-29,-58,86,48,-.04,0,TAU);g.fill();
  g.strokeStyle='#a58c8a';g.lineWidth=2.5;
  for(let i=0;i<4;i++){g.beginPath();g.moveTo(-90+i*31,-85);g.quadraticCurveTo(-77+i*30,-62,-86+i*30,-39);g.stroke()}
  // Neck and head tilt toward the water.
  g.fillStyle='#ceb9b1';g.beginPath();g.ellipse(47,-92,42,44,.20,0,TAU);g.fill();
  g.save();g.translate(54,-145);g.rotate(.10);
  g.fillStyle='#d5c1b8';g.beginPath();g.ellipse(0,0,50,42,-.08,0,TAU);g.fill();
  g.beginPath();g.moveTo(-38,-25);g.lineTo(-34,-77);g.lineTo(-4,-39);g.closePath();g.fill();
  g.beginPath();g.moveTo(14,-37);g.lineTo(42,-77);g.lineTo(48,-21);g.closePath();g.fill();
  g.fillStyle='#a8959a';g.beginPath();g.moveTo(-30,-33);g.lineTo(-29,-63);g.lineTo(-12,-39);g.closePath();g.fill();
  g.beginPath();g.moveTo(23,-36);g.lineTo(38,-62);g.lineTo(40,-28);g.closePath();g.fill();
  g.fillStyle='#4a916f';g.beginPath();g.ellipse(-17,-1,6,8,0,0,TAU);g.ellipse(18,-1,6,8,0,0,TAU);g.fill();
  g.fillStyle='#1a1d25';g.fillRect(-18,-8,3,16);g.fillRect(17,-8,3,16);
  g.fillStyle='#c78588';g.beginPath();g.moveTo(0,12);g.lineTo(-7,19);g.lineTo(7,19);g.closePath();g.fill();
  g.strokeStyle='#8f777a';g.lineWidth=2;g.beginPath();g.moveTo(0,19);g.quadraticCurveTo(-3,25,-12,23);g.moveTo(0,19);g.quadraticCurveTo(4,25,12,22);g.stroke();
  // Whiskers point toward the faucet; tongue flicks on the water beat.
  g.strokeStyle='#9b8789';g.lineWidth=1.5;
  for(let i=0;i<3;i++){
    const yy=10+i*6;
    g.beginPath();g.moveTo(-5,yy);g.lineTo(-37,yy-7+i*3);g.moveTo(7,yy);g.lineTo(39,yy-8+i*4);g.stroke();
  }
  if(Math.sin(t*8)>.68){g.fillStyle='#e68f9a';g.beginPath();g.ellipse(2,27,4,7,0,0,TAU);g.fill()}
  g.restore();
  // Front paws over the sink edge.
  g.fillStyle='#d5c1b8';g.beginPath();g.ellipse(10,-7,25,13,0,0,TAU);g.ellipse(65,-8,23,13,0,0,TAU);g.fill();
  g.strokeStyle='#a8959a';g.lineWidth=2;g.beginPath();g.moveTo(9,-12);g.lineTo(9,-3);g.moveTo(64,-13);g.lineTo(64,-3);g.stroke();
  g.restore();
}
function drawPrinter(x,y,n){
  const w=190,h=208;
  box(x,y,w,h,'#253146',18,'#52647a',3);
  box(x+12,y+12,w-24,h-24,'#172130',12,'rgba(255,255,255,.08)',2);
  // Frame, print bed, nozzle; deliberately simple and unmistakably idle.
  line(x+37,y+39,x+37,y+159,'#8191a4',9);
  line(x+w-37,y+39,x+w-37,y+159,'#8191a4',9);
  line(x+37,y+43,x+w-37,y+43,'#8191a4',9);
  line(x+58,y+147,x+w-58,y+147,'#65768b',10);
  line(x+91,y+49,x+91,y+79,'#d1a56e',7);
  box(x+63,y+81,57,9,'#d1a56e',4);
  box(x+28,y+h-36,57,22,'#1b2738',10);
  text(String(n).padStart(2,'0'),x+56,y+h-25,16,C.muted,800,'center','ui-monospace,monospace');
  g.fillStyle=C.red;g.beginPath();g.arc(x+w-27,y+h-25,6,0,TAU);g.fill();
  g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=2;rr(x,y,w,h,18);g.stroke();
}
function drawBike(x,y,s,t){
  g.save();g.translate(x,y);g.scale(s,s);
  // stationary-bike silhouette
  g.lineWidth=12;g.strokeStyle='#64758a';g.beginPath();g.arc(-78,-12,49,0,TAU);g.arc(74,-12,49,0,TAU);g.stroke();
  line(-78,-12,-11,-82,'#718198',11);line(-11,-82,74,-12,'#718198',11);line(-78,-12,74,-12,'#718198',11);
  line(-11,-82,4,-130,'#718198',10);line(-35,-133,10,-133,'#718198',10);
  line(74,-12,86,-89,'#718198',10);line(65,-94,107,-94,'#718198',10);
  g.fillStyle='#45536a';g.beginPath();g.arc(-78,-12,12,0,TAU);g.arc(74,-12,12,0,TAU);g.fill();
  // the handlebar has become a laundry rail
  line(-23,-157,128,-157,'#d4dae0',5);
  g.beginPath();g.moveTo(8,-157);g.lineTo(8,-129);g.lineTo(52,-129);g.lineTo(52,-157);g.strokeStyle='#c1cbd4';g.lineWidth=4;g.stroke();
  box(9,-132,44,63,'#e3ab75',8,'rgba(255,255,255,.20)',2);
  g.restore();
}
function drawHangingDev(cx,barY,local){
  const swing=Math.sin(local*3.5)*13;
  // Pull-up frame.
  line(690,barY,974,barY,'#aebdca',17);
  line(710,barY,710,1118,'#708197',13);
  line(954,barY,954,1118,'#708197',13);
  box(680,barY-15,28,30,C.amber,9);
  box(956,barY-15,28,30,C.amber,9);
  // Person hanging from the bar in a deliberately comic, readable pose.
  g.strokeStyle='#d8c0a3';g.lineWidth=21;g.lineCap='round';
  g.beginPath();g.moveTo(cx-40,barY+10);g.lineTo(cx-70,barY-4);g.lineTo(cx-72,barY-48);g.moveTo(cx+40,barY+10);g.lineTo(cx+70,barY-4);g.lineTo(cx+72,barY-48);g.stroke();
  g.fillStyle='#4b668d';g.beginPath();g.roundRect(cx-54,barY+21,108,174,28);g.fill();
  g.fillStyle='#edc9a8';g.beginPath();g.arc(cx,barY+2,48,0,TAU);g.fill();
  g.fillStyle='#4a3b38';g.beginPath();g.arc(cx,barY-9,50,Math.PI,TAU);g.lineTo(cx+45,barY+4);g.quadraticCurveTo(cx,barY-14,cx-46,barY+5);g.closePath();g.fill();
  g.fillStyle='#263248';g.beginPath();g.arc(cx-15,barY+3,4,0,TAU);g.arc(cx+15,barY+3,4,0,TAU);g.fill();
  g.strokeStyle='#263248';g.lineWidth=3;g.beginPath();g.moveTo(cx-7,barY+20);g.quadraticCurveTo(cx,barY+25,cx+8,barY+20);g.stroke();
  g.strokeStyle='#283146';g.lineWidth=23;g.beginPath();
  g.moveTo(cx-26,barY+188);g.lineTo(cx-35+swing,barY+310);g.moveTo(cx+26,barY+188);g.lineTo(cx+37+swing,barY+305);g.stroke();
  g.strokeStyle='#d8c0a3';g.lineWidth=17;g.beginPath();g.moveTo(cx-35+swing,barY+310);g.lineTo(cx-75+swing,barY+325);g.moveTo(cx+37+swing,barY+305);g.lineTo(cx+82+swing,barY+321);g.stroke();
}
function drawBreakStage(scene,t){
  const local=t-scene.start;
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#252b3b');bg.addColorStop(1,'#151925');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // A deliberately static hang: the legs sway a little, but there is no pull-up motion.
  g.fillStyle='rgba(255,255,255,.035)';
  for(let y=342;y<1060;y+=118)g.fillRect(74,y,920,2);
  box(102,388,450,476,'rgba(12,17,27,.82)',28,'rgba(255,255,255,.16)',3);
  text('ПЕРЕРЫВ',327,466,37,C.mint,900,'center','ui-monospace,monospace');
  text('5 МИНУТ',327,541,28,C.amber,900,'center','ui-monospace,monospace');
  line(165,594,489,594,'rgba(255,255,255,.16)',3);
  text('ЧЕЛОВЕК: В РЕЖИМЕ SLEEP',327,658,19,C.muted,800,'center','ui-monospace,monospace');
  text('ПОВТОРЕНИЙ: 0',327,744,28,C.red,900,'center','ui-monospace,monospace');
  pill('ЭРГОНОМИКА: СОМНИТЕЛЬНАЯ',132,796,390,43,'rgba(255,255,255,.06)',C.muted,'rgba(255,255,255,.12)',16);
  drawHangingDev(830,430,local*.18);
  box(78,1125,924,88,'rgba(10,14,23,.88)',22,'rgba(255,255,255,.14)',2);
  pill('НА ПЕРЕРЫВЕ · ВИСИТ, НЕ ПОДТЯГИВАЕТСЯ',106,1142,868,54,'rgba(127,224,192,.10)',C.mint,'rgba(127,224,192,.28)',20);
}
function drawWorkshopStage(scene,t){
  const local=t-scene.start;
  const qseg=scene.quote&&scene.quote.seg;
  const pullAt=qseg&&qseg[1]?qseg[1].t0:scene.dur*.72;
  const breakK=smooth((local-(pullAt-.65))/.85);
  const bg=g.createLinearGradient(0,290,0,1300);bg.addColorStop(0,'#30394b');bg.addColorStop(1,'#182131');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // shelf grid is only a quiet backdrop, never an image panel.
  g.fillStyle='#35445a';g.fillRect(70,373,940,17);g.fillRect(70,610,940,17);g.fillRect(70,849,940,17);
  alpha(1-breakK*.64,()=>{
    [[94,393,1],[310,393,2],[526,393,3],[742,393,4],[202,628,5],[418,628,6],[634,628,7]].forEach(p=>drawPrinter(p[0],p[1],p[2]));
    box(72,895,300,76,'#172232',20,'rgba(255,255,255,.14)',2);
    text('0 / 7',222,930,38,C.red,900,'center','ui-monospace,monospace');
    text('ПЕЧАТАЮТ',222,958,16,C.muted,800,'center','ui-monospace,monospace');
  });
  // The two exercise bikes have an unexpected secondary career.
  alpha(1-breakK*.25,()=>{
    drawBike(485,1192,.74,t);drawBike(836,1192,.74,t+1.2);
    pill('2 ВЕЛОТРЕНАЖЁРА  →  ВЕШАЛКА',271,1010,520,48,'rgba(17,23,35,.88)',C.paper,'rgba(255,255,255,.12)',19);
  });
  if(breakK>0){
    alpha(breakK,()=>{
      drawHangingDev(829,465,local);
      pill('ПЕРЕРЫВ · ТУРНИК',686,1008,286,54,'rgba(14,20,31,.9)',C.mint,'rgba(255,255,255,.16)',22);
      text('перезагрузка человека: 5 минут',829,1085,19,C.muted,600,'center');
    });
  }
}
function drawCodeScreen(x,y,w,h,t){
  box(x,y,w,h,'#121d2a',18,'#607289',3);
  box(x+13,y+13,w-26,42,'#243146',12);
  g.fillStyle=C.red;g.beginPath();g.arc(x+35,y+34,6,0,TAU);g.fill();
  g.fillStyle=C.amber;g.beginPath();g.arc(x+58,y+34,6,0,TAU);g.fill();
  g.fillStyle=C.mint;g.beginPath();g.arc(x+81,y+34,6,0,TAU);g.fill();
  text('devlog · рабочая сборка',x+105,y+34,17,'#d5dfeb',700,'left','ui-monospace,monospace');
  clipRound(x+20,y+68,w-40,h-87,8,()=>{
    for(let i=0;i<8;i++){
      const yy=y+94+i*34;
      const ww=(w-95)*(.34+hp(i*4.8)*.57);
      g.fillStyle=i%3===0?'rgba(127,224,192,.82)':(i%3===1?'rgba(138,200,239,.65)':'rgba(245,240,231,.38)');
      box(x+38,yy,ww,9,g.fillStyle,5);
    }
    const blink=Math.floor(t*2)%2===0;
    if(blink){g.fillStyle=C.mint;g.fillRect(x+38,y+h-39,14,18)}
  });
}
function drawDev(x,baseY,s,t){
  g.save();g.translate(x,baseY);g.scale(s,s);
  g.fillStyle='rgba(4,8,16,.24)';g.beginPath();g.ellipse(0,4,126,19,0,0,TAU);g.fill();
  // chair, legs and hoodie
  box(-73,-178,146,153,'#2c3850',34,'rgba(255,255,255,.08)',2);
  g.strokeStyle='#252f43';g.lineWidth=27;g.lineCap='round';g.beginPath();g.moveTo(-39,-35);g.lineTo(-73,4);g.moveTo(39,-35);g.lineTo(73,4);g.stroke();
  box(-90,-289,180,177,'#54729a',38,'#7891b1',3);
  // arms reaching the keyboard
  g.strokeStyle='#e8c4a4';g.lineWidth=25;g.beginPath();g.moveTo(-72,-248);g.lineTo(-122,-190);g.lineTo(-164,-189);g.moveTo(72,-248);g.lineTo(119,-188);g.lineTo(159,-188);g.stroke();
  g.fillStyle='#edc9a8';g.beginPath();g.arc(0,-337,64,0,TAU);g.fill();
  g.fillStyle='#493b38';g.beginPath();g.arc(0,-353,66,Math.PI,TAU);g.quadraticCurveTo(68,-332,49,-318);g.quadraticCurveTo(0,-345,-54,-319);g.closePath();g.fill();
  g.fillStyle='#263248';g.beginPath();g.arc(-20,-337,5,0,TAU);g.arc(20,-337,5,0,TAU);g.fill();
  g.strokeStyle='#a26765';g.lineWidth=4;g.beginPath();g.moveTo(-10,-306);g.quadraticCurveTo(0,-300,10,-306);g.stroke();
  g.restore();
}
function drawStreamStage(scene,t){
  const local=t-scene.start;
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#292542');bg.addColorStop(1,'#171a28');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // Framed broadcast panel with a fully clipped 2D terminal inside it.
  box(86,347,908,616,'#20283a',30,'rgba(255,255,255,.18)',3);
  box(106,367,868,60,'#151d2c',18);
  g.fillStyle=C.red;g.beginPath();g.arc(139,397,10,0,TAU);g.fill();
  text('В ЭФИРЕ',163,397,21,C.red,900,'left','ui-monospace,monospace');
  text('ГЕЙМДЕВ-ЭКСГИБИЦИОНИЗМ',944,397,19,C.muted,700,'right','ui-monospace,monospace');
  drawCodeScreen(116,449,486,414,t);
  // Timer dial: focus first, then a short break. It is an infographic, not a screen texture.
  const timerX=759,timerY=520,r=112;
  g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=18;g.beginPath();g.arc(timerX,timerY,r,0,TAU);g.stroke();
  const phase=(local*.095)%1;
  g.strokeStyle=C.amber;g.lineWidth=18;g.lineCap='round';g.beginPath();g.arc(timerX,timerY,r,-Math.PI/2,-Math.PI/2+TAU*(.15+.82*phase));g.stroke();
  text('25:00',timerX,timerY-12,42,C.paper,900,'center','ui-monospace,monospace');
  text('ФОКУС',timerX,timerY+22,17,C.amber,800,'center','ui-monospace,monospace');
  // Desk and streamer silhouette; keep body and props inside the broadcast frame.
  drawDev(789,988,1.05,t);
  box(601,873,365,27,'#6f583f',11);
  box(617,900,20,68,'#493a34',6);box(930,900,20,68,'#493a34',6);
  box(613,806,126,69,'#202a39',12,'#66778e',3);
  text('CODE',676,841,20,C.mint,900,'center','ui-monospace,monospace');
  // Three compact, sourced facts: work rhythm, stream schedule, familiar chat.
  const cards=[
    {x:91,w:282,big:'25 / 5',small:'помидорки',col:C.amber},
    {x:399,w:282,big:'5 ДНЕЙ',small:'в будни',col:C.mint},
    {x:707,w:282,big:'ДО 04:00',small:'стрим идёт',col:C.blue}
  ];
  cards.forEach(c=>{
    box(c.x,1032,c.w,177,'rgba(13,18,29,.86)',22,'rgba(255,255,255,.14)',2);
    text(c.big,c.x+c.w/2,1090,31,c.col,900,'center','ui-monospace,monospace');
    text(c.small,c.x+c.w/2,1155,21,C.muted,700,'center');
  });
  // tiny lively status lights, contained within the broadcast set
  for(let i=0;i<5;i++){
    g.fillStyle=(Math.floor(t*2+i)%3===0)?C.mint:'rgba(127,224,192,.22)';
    g.beginPath();g.arc(128+i*34,1247,7,0,TAU);g.fill();
  }
}
function drawToken(cx,cy,r,spin,col=C.amber){
  g.save();g.translate(cx,cy);g.rotate(spin);
  g.fillStyle=col;g.beginPath();g.ellipse(0,0,r,r*.72,0,0,TAU);g.fill();
  g.strokeStyle='rgba(71,49,23,.56)';g.lineWidth=4;g.beginPath();g.ellipse(0,0,r*.67,r*.44,0,0,TAU);g.stroke();
  g.fillStyle='rgba(71,49,23,.78)';g.font=`900 ${Math.max(14,r*.72)}px ui-monospace,monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText('T',0,1);
  g.restore();
}
function drawLimitsStage(scene,t){
  const local=t-scene.start;
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#183047');bg.addColorStop(1,'#151d2a');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // Left: a giant, legible 74% remaining gauge.
  const cx=325,cy=743,r=202;
  g.strokeStyle='rgba(255,255,255,.13)';g.lineWidth=36;g.beginPath();g.arc(cx,cy,r,0,TAU);g.stroke();
  g.strokeStyle=C.amber;g.lineWidth=36;g.lineCap='round';g.beginPath();g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+TAU*.74);g.stroke();
  text('74%',cx,cy-14,78,C.paper,900,'center','ui-monospace,monospace');
  text('ЛИМИТОВ',cx,cy+49,22,C.muted,800,'center','ui-monospace,monospace');
  box(128,1002,394,87,'rgba(12,17,27,.80)',20,'rgba(255,255,255,.12)',2);
  text('СБРОС ЧЕРЕЗ',325,1025,17,C.muted,800,'center','ui-monospace,monospace');
  text('11 ЧАСОВ',325,1061,29,C.amber,900,'center','ui-monospace,monospace');
  // Right: remaining tokens go to a tiny city-builder project.
  pill('ОСТАТОК ТОКЕНОВ',598,424,373,50,'rgba(12,17,27,.83)',C.mint,'rgba(255,255,255,.12)',20);
  // falling tokens on a short conveyor, with tight bounds
  for(let i=0;i<10;i++){
    const p=(local*.22+i*.105)%1;
    const x=628+((i*67)%318);
    const y=514+p*337;
    drawToken(x,y,18+(i%3)*3,local*.8+i,C.amber);
  }
  // The destination is an intentionally small, hand-drawn town — no projected display.
  box(624,887,341,211,'#26334a',24,'rgba(255,255,255,.14)',3);
  g.fillStyle='#1d283b';g.fillRect(642,1041,305,42);
  const houses=[
    {x:661,y:965,w:70,h:76,c:'#5f7390'},
    {x:753,y:929,w:78,h:112,c:'#667b96'},
    {x:854,y:978,w:67,h:63,c:'#4f6884'}
  ];
  houses.forEach((h,i)=>{
    box(h.x,h.y,h.w,h.h,h.c,8);
    for(let r0=0;r0<2;r0++)for(let c0=0;c0<2;c0++){
      box(h.x+12+c0*26,h.y+14+r0*27,12,14,(r0+c0+i)%2?C.amber:C.mint,3);
    }
  });
  pill('ГОРОДОК',641,1122,307,55,'rgba(10,15,25,.92)',C.paper,'rgba(255,255,255,.16)',24);
  // A voice-task microphone points toward the city; the exact quote stays in the caption card.
  g.fillStyle='#b8c5d2';g.beginPath();g.roundRect(137,405,39,88,19);g.fill();
  g.strokeStyle='#b8c5d2';g.lineWidth=6;g.beginPath();g.arc(156,482,48,0,Math.PI);g.stroke();line(156,530,156,558,'#b8c5d2',6);line(133,558,179,558,'#b8c5d2',6);
  for(let i=0;i<3;i++){
    g.strokeStyle=`rgba(127,224,192,${.65-i*.16})`;g.lineWidth=4;g.beginPath();
    g.arc(206,449,22+i*17,-.8,.8);g.stroke();
  }
  text('ГОЛОСОМ →',251,470,17,C.mint,800,'left','ui-monospace,monospace');
}
function drawSword(local){
  const bob=Math.sin(local*5)*.035;
  g.save();g.translate(426,937);g.rotate(bob);
  // Flat wooden blade: purposely blocky rather than a realistic generated mesh.
  box(-104,-444,208,402,C.wood,18,'#704e31',7);
  box(-91,-427,182,366,'#bf9156',13,'rgba(255,255,255,.18)',3);
  g.strokeStyle='rgba(92,58,30,.5)';g.lineWidth=6;
  for(let i=0;i<4;i++){g.beginPath();g.moveTo(-67+i*39,-397);g.lineTo(-52+i*34,-99);g.stroke()}
  // A squared-off tip and unmistakable cross-guard/handle.
  box(-121,-483,242,73,'#a87842',14,'#704e31',6);
  box(-20,-75,40,220,'#6c4829',12,'#49331f',4);
  box(-77,122,154,38,'#4a3424',18,'#b78b58',4);
  g.fillStyle='#8a6138';g.beginPath();g.arc(0,183,26,0,TAU);g.fill();
  g.restore();
}
function drawBell(x,y,t){
  const swing=Math.sin(t*2.1)*.11;
  g.save();g.translate(x,y);g.rotate(swing);
  // bell body, rim and clapper
  g.fillStyle='#d2a94c';g.beginPath();g.moveTo(-105,56);g.quadraticCurveTo(-84,-36,-45,-79);g.quadraticCurveTo(0,-115,45,-79);g.quadraticCurveTo(84,-36,105,56);g.closePath();g.fill();
  box(-115,46,230,34,'#f0ca70',13,'#896b31',4);
  g.fillStyle='#a77f36';g.beginPath();g.arc(0,-92,18,0,TAU);g.fill();
  line(0,-93,0,-154,'#dfc067',13);
  g.fillStyle='#664f2d';g.beginPath();g.arc(0,99,24,0,TAU);g.fill();
  // rune hanging from the bell as a little charm
  line(0,123,0,210,'#d8c8a0',7);
  g.save();g.translate(0,258);g.rotate(-swing*.4);
  g.fillStyle='#c9a24e';g.beginPath();g.moveTo(0,-43);g.lineTo(35,0);g.lineTo(0,43);g.lineTo(-35,0);g.closePath();g.fill();
  g.strokeStyle='#624b28';g.lineWidth=6;g.beginPath();g.moveTo(-10,-19);g.lineTo(11,18);g.moveTo(12,-18);g.lineTo(-12,18);g.stroke();
  g.restore();g.restore();
}
function drawGagStage(scene,t){
  const local=t-scene.start;
  const second=scene.quote&&scene.quote.seg&&scene.quote.seg[1]?scene.quote.seg[1].t0:scene.dur*.58;
  const bellK=smooth((local-(second-.72))/.85);
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#30233e');bg.addColorStop(1,'#171723');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // A contained spotlight and a little display plinth.
  const light=g.createRadialGradient(524,730,10,524,730,520);light.addColorStop(0,'rgba(255,218,159,.30)');light.addColorStop(1,'rgba(255,218,159,0)');g.fillStyle=light;g.fillRect(44,280,992,1020);
  g.fillStyle='#242034';g.beginPath();g.moveTo(224,1156);g.lineTo(855,1156);g.lineTo(931,1242);g.lineTo(149,1242);g.closePath();g.fill();
  box(225,1116,630,51,'#514366',14,'rgba(255,255,255,.18)',3);
  alpha(1-bellK,()=>{
    drawSword(local);
    pill('АССЕТ СГЕНЕРИРОВАН',120,444,332,50,'rgba(13,15,25,.84)',C.amber,'rgba(255,255,255,.12)',19);
    box(648,500,296,82,'rgba(119,44,56,.9)',20,'rgba(255,255,255,.16)',2);
    text('КВАДРАТНЫЙ',796,541,28,C.paper,900,'center','ui-monospace,monospace');
  });
  if(bellK>0){
    alpha(bellK,()=>{
      drawBell(768,720,t);
      pill('РУНЫ?',670,458,197,52,'rgba(13,15,25,.84)',C.amber,'rgba(255,255,255,.12)',22);
      text('что именно свисает?',770,1122,19,C.muted,600,'center');
    });
  }
}
function drawGameCover(x,y){
  box(x,y,284,326,'#1b2931',23,'#a6e3bd',4);
  const grad=g.createLinearGradient(0,y,0,y+326);grad.addColorStop(0,'#274a48');grad.addColorStop(1,'#172b32');
  box(x+12,y+12,260,302,grad,16);
  // tiny cozy desktop farm illustration
  g.fillStyle='#17232e';g.beginPath();g.moveTo(x+30,y+240);g.lineTo(x+252,y+240);g.lineTo(x+252,y+290);g.lineTo(x+30,y+290);g.closePath();g.fill();
  for(let i=0;i<4;i++){
    const px=x+54+i*51;
    g.fillStyle=['#5dba7a','#7acc83','#72aa67','#9ac875'][i];
    g.fillRect(px,y+176-i%2*12,12,69+i%2*12);
    g.beginPath();g.ellipse(px-3,y+176-i%2*12,18,9,-.42,0,TAU);g.fill();
    g.beginPath();g.ellipse(px+15,y+185-i%2*12,18,9,.42,0,TAU);g.fill();
  }
  text('DESKTOP',x+142,y+65,23,C.paper,900,'center','ui-monospace,monospace');
  text('HELLFARMER',x+142,y+96,22,C.mint,900,'center','ui-monospace,monospace');
  text('игра на рабочем столе',x+142,y+132,14,'#c5d0d5',600,'center');
}
function drawReleaseStage(scene,t){
  const local=t-scene.start;
  const q=scene.quote||{};
  const pressAt=(q.on==null)?scene.dur*.44:q.on-.20;
  const pressed=smooth((local-pressAt)/.42);
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#1d4845');bg.addColorStop(1,'#17232d');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  // two clocks tell the whole arc without any expanding screen panels.
  box(92,382,548,136,'rgba(12,20,28,.70)',22,'rgba(255,255,255,.14)',2);
  text('10 ЛЕТ',171,431,38,C.paper,900,'center','ui-monospace,monospace');
  text('0 РЕЛИЗОВ',171,478,21,C.muted,800,'center','ui-monospace,monospace');
  line(285,450,414,450,C.amber,7);g.fillStyle=C.amber;g.beginPath();g.moveTo(413,435);g.lineTo(441,450);g.lineTo(413,465);g.closePath();g.fill();
  text('2 МЕСЯЦА',533,431,33,C.mint,900,'center','ui-monospace,monospace');
  text('ВАЙБКОДА',533,478,21,C.muted,800,'center','ui-monospace,monospace');
  drawGameCover(126,580);
  // publication panel, all drawn as flat vector UI and clipped to its card
  box(460,590,500,312,'#111b27',24,'rgba(255,255,255,.16)',3);
  box(481,611,458,54,'#263448',15);
  text('СТРАНИЦА ИГРЫ',710,638,19,C.muted,800,'center','ui-monospace,monospace');
  text('Desktop Hellfarmer',710,708,27,C.paper,800,'center');
  line(520,753,899,753,'rgba(255,255,255,.15)',3);
  text('СОБРАНО · ПРОВЕРЕНО · ГОТОВО',710,789,17,C.muted,700,'center','ui-monospace,monospace');
  const btnCol=pressed?C.mint:'#3d846d';
  box(510,820,400,58,btnCol,19,'rgba(255,255,255,.28)',2);
  text(pressed?'ВЫПУЩЕНО':'ОПУБЛИКОВАТЬ',710,849,23,pressed?'#10231e':C.paper,900,'center','ui-monospace,monospace');
  // The stream is still on when the button changes state.
  box(580,948,263,47,'rgba(11,18,27,.84)',24,'rgba(255,255,255,.14)',2);
  g.fillStyle=C.red;g.beginPath();g.arc(604,971,6,0,TAU);g.fill();
  text('РЕЛИЗ ПРЯМО В СТРИМЕ',723,971,17,C.paper,800,'center','ui-monospace,monospace');
  if(pressed>0.25){
    alpha(pressed,()=>{
      for(let i=0;i<22;i++){
        const phase=(t*.35+hp(i*7.1))%1;
        const x=170+hp(i*3.1)*740;
        const y=530+phase*420;
        g.save();g.translate(x,y);g.rotate(phase*6+i);
        g.fillStyle=[C.amber,C.mint,C.blue,C.violet][i%4];g.fillRect(-5,-10,10,20);g.restore();
      }
    });
  }
  const outroAt=(q.off==null)?scene.dur-4.4:q.off+.55;
  const outro=smooth((local-outroAt)/.4);
  if(outro>0){
    alpha(outro,()=>{
      box(93,369,894,790,'rgba(12,18,28,.96)',30,'rgba(127,224,192,.55)',3);
      text('СМЕНА ЗАКРЫТА',CX,445,34,C.mint,900,'center','ui-monospace,monospace');
      const rows=[
        ['ГУЧЧИ','пьёт из-под крана'],
        ['ВАЛЕРА','автокормушка'],
        ['ПЕРЕРЫВ','турник'],
        ['ФИНАЛ','первый релиз']
      ];
      rows.forEach((r,i)=>{
        const yy=535+i*126;
        box(145,yy-39,790,82,i%2?'rgba(255,255,255,.035)':'rgba(255,255,255,.065)',17);
        text(r[0],190,yy,24,[C.amber,C.mint,C.blue,C.mint][i],900,'left','ui-monospace,monospace');
        text(r[1],900,yy,25,C.paper,700,'right');
      });
      text('10 лет — ни одного. Два месяца — релиз.',CX,1083,22,C.muted,700,'center');
    });
  }
}
function drawProjectFinale(scene,t){
  const local=t-scene.start,p=clamp(local/Math.max(1,scene.dur));
  const bg=g.createLinearGradient(0,280,0,1300);bg.addColorStop(0,'#1d4845');bg.addColorStop(1,'#131d29');g.fillStyle=bg;g.fillRect(44,280,992,1020);
  const cards=[
    {key:'desktop-hellfarmer',title:'DESKTOP HELLFARMER',tag:'РЕЛИЗ · ЯПОНИЯ',col:C.amber},
    {key:'backpack-inspector',title:'BACKPACK INSPECTOR',tag:'ФЭНТЕЗИ-ТАМОЖНЯ',col:C.blue},
    {key:'white-meridian',title:'WHITE MERIDIAN',tag:'ПРОЕКТ МЕЧТЫ',col:C.mint}
  ];
  cards.forEach((item,i)=>{
    const x=70+i*314,y=365,w=296,h=518;
    box(x,y,w,h,'#101723',24,'rgba(255,255,255,.22)',3);
    clipRound(x+6,y+6,w-12,h-12,20,()=>{
      drawCover(art(item.key),x+6,y+6,w-12,h-12,1.015+p*.018,(i-1)*2,0);
      const shade=g.createLinearGradient(0,y+300,0,y+h);shade.addColorStop(0,'rgba(8,12,20,0)');shade.addColorStop(.52,'rgba(8,12,20,.52)');shade.addColorStop(1,'rgba(8,12,20,.97)');g.fillStyle=shade;g.fillRect(x+6,y+300,w-12,h-306);
    });
    pill(item.tag,x+16,y+18,w-32,38,'rgba(8,12,20,.78)',item.col,'rgba(255,255,255,.16)',14);
    fitText(item.title,x+w/2,y+h-92,w-28,20,C.paper,800,'center','ui-monospace,monospace');
    g.fillStyle=item.col;g.beginPath();g.arc(x+w/2,y+h-50,5,0,TAU);g.fill();
  });
  box(72,928,936,278,'rgba(10,16,23,.86)',26,'rgba(127,224,192,.42)',3);
  text('ПРОДЮСЕР ГОДА',540,985,21,C.muted,800,'center','ui-monospace,monospace');
  text('ВАЛЕРА',540,1040,38,C.mint,900,'center');
  text('автокормушка · расписание выполняет',540,1092,22,C.paper,700,'center');
  // Tiny feeder clock: the only project manager who never misses a deadline.
  box(825,965,104,157,'#344054',18,'#7d8da1',3);
  box(841,982,72,46,'#101a28',11,'rgba(255,255,255,.12)',2);
  g.fillStyle=C.amber;g.beginPath();g.moveTo(854,994);g.lineTo(900,994);g.lineTo(877,1017);g.closePath();g.fill();
  g.fillStyle=C.mint;g.beginPath();g.arc(877,1060,6,0,TAU);g.fill();
  for(let i=0;i<3;i++){g.fillStyle=C.amber;g.beginPath();g.arc(864+i*13,1090+(i%2)*8,4,0,TAU);g.fill()}
  line(92,1161,740,1161,'rgba(255,255,255,.16)',2);
  text('Гуччи — контроль крана. Валера — контроль сроков.',416,1180,18,C.muted,700,'center');
}
function drawQuoteCaption(scene,t){
  const q=scene.quote;if(!q)return;
  const local=t-scene.start;
  if(local<q.on-.34||local>q.off+.42)return;
  const segs=q.seg&&q.seg.length?q.seg:null;
  let current=null;
  if(segs)current=segs.find(s=>local>=s.t0-.20&&local<=s.t1+.20)||null;
  else if(q.lines&&q.lines.length)current={text:q.lines.join(' · '),t0:q.on,t1:q.off};
  if(!current)return;
  const fadeIn=clamp((local-(current.t0-.20))/.18);
  const fadeOut=clamp((current.t1+.22-local)/.20);
  const a=Math.min(fadeIn,fadeOut);
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
  const local=t-scene.start;
  const current=segs.find(s=>local>=s.t0-.24&&local<=s.t1+.30);
  if(!current)return;
  const a=Math.min(clamp((local-(current.t0-.24))/.20),clamp((current.t1+.3-local)/.25));
  if(a<=0)return;
  alpha(a,()=>{
    box(68,1584,944,244,'rgba(8,12,20,.92)',27,'rgba(127,224,192,.24)',2);
    pill('ЗА КАДРОМ',92,1602,174,36,'rgba(127,224,192,.12)',C.mint,'rgba(127,224,192,.22)',17);
    wrapped(current.text.trim(),CX,1710,800,46,37,'#edf3f6',600,'system-ui,sans-serif',3);
  });
}
function drawProgress(t){
  const total=(window.B&&B.TOTAL)||70;
  const y=1891;
  box(43,y,994,8,'rgba(255,255,255,.14)',4);
  box(43,y,994*clamp(t/total),8,C.amber,4);
  const scenes=(window.B&&B.SC)||[];
  scenes.forEach((s,i)=>{
    const x=43+994*clamp(s.start/total);
    g.fillStyle=i===0?'rgba(255,255,255,.45)':'rgba(255,255,255,.62)';g.fillRect(x,y-5,3,18);
  });
}
function drawFrame(scene,t){
  stageBackdrop(scene,t);
  drawHeader(scene);
  drawQuoteCaption(scene,t);
  drawNarrationCaption(scene,t);
  drawProgress(t);
}
window.BODY51_DAY_FRAME=drawFrame;
})();
