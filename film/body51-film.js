/* body51-film.js — «Вайбкодер из Мурманска»
   Процедурный вертикальный мультфильм по фактам стримов @body51.
   Кадры рисуются кодом (Canvas 2D), музыка синтезируется (Web Audio),
   закадровый голос — выбранный рассказчик; реплики Артёма — титрами дословно по субтитрам. */
(function(){
const cv=document.getElementById('c'),g=cv.getContext('2d'),W=1080,H=1920,CX=W/2,TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const easeOut=t=>1-Math.pow(1-t,3);
const easeIn=t=>t*t*t;
const hp=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};   // детерминированный «шум»
const fmtT=s=>{const m=Math.floor(Math.max(0,s)/60),x=Math.floor(Math.max(0,s)%60);return m+':'+(x<10?'0':'')+x};

// ---------- сцены: длительности и «факты» ----------
const DEFS=[
 {id:'polar',   title:'Мурманск · знакомство',  nom:32, fact:'#192 · #195 · #463'},
 {id:'cat',     title:'Кот Гуччи и Валера',     nom:26, fact:'#440 · #457 · #462'},
 {id:'workshop',title:'Мастерская',             nom:30, fact:'#008 · #018 · #047'},
 {id:'stream',  title:'Стрим как дисциплина',   nom:28, fact:'#022 · #057 · #174'},
 {id:'caravan', title:'Караванщик',             nom:26, fact:'#470 · #473'},
 {id:'limits',  title:'Директор нейронок',      nom:32, fact:'#008 · #050 · #073'},
 {id:'gag',     title:'Нейронка творит',        nom:18, fact:'#061 · вайбаля'},
 {id:'burnout', title:'Железяка, врубайся',     nom:28, fact:'#018 · #021'},
 {id:'release', title:'Релизная девственность', nom:28, fact:'#004 · #013 · #065'},
 {id:'wishlist',title:'Рюкзаки и вишлисты',     nom:32, fact:'#010 · #012 · #019'},
 {id:'finale',  title:'Дальше',                 nom:26, fact:'#015 · #200'},
 {id:'credits', title:'Источники',              nom:14, fact:'473 стрима'},
];
const QUOTES={
 polar:[{u:.36,d:4.4,t:'Из Мурманска',s:'#195'},{u:.80,d:5.6,t:'Мне 34… я ещё юноша, в самом расцвете сил',s:'#463'}],
 cat:[{u:.30,d:5.0,t:'Из миски — для слабаков',s:'#440'},{u:.60,d:4.2,t:'(выключает микрофон лапой)',s:'#455'},{u:.84,d:5.0,t:'Все вопросы к Валере',s:'#457'}],
 workshop:[{u:.30,d:5.4,t:'Стоит семь принтеров, ни один не печатает',s:'#018'},{u:.66,d:5.0,t:'На перерывах вишу на турнике',s:'#186'}],
 stream:[{u:.15,d:4.4,t:'Всем приветики в этом чатике',s:'#022'},{u:.52,d:6.4,t:'Неразвлекательный формат: для дисциплины, настоящий девлог',s:'#174'}],
 caravan:[{u:.74,d:5.4,t:'Куча систем и ноль контента',s:'#473'}],
 limits:[{u:.13,d:4.6,t:'Я токеновый мультимиллионер',s:'#073'},{u:.46,d:5.6,t:'11 часов до сброса и 74% лимитов',s:'#008'},{u:.80,d:5.4,t:'Меняешь нейронку — будто девушке изменяешь',s:'стримы'}],
 gag:[{u:.30,d:5.4,t:'Ты где такой меч видел? Он ещё и деревянный, и квадратный',s:'#061'},{u:.63,d:4.6,t:'Кости молота мигрировали',s:'#468'},{u:.86,d:4.4,t:'Где руны? Я вижу… свисающее с колокола',s:'#468'}],
 burnout:[],
 release:[{u:.52,d:8.4,t:'Я не релизил 10 лет ни одной игры. Я лишился релизной девственности',s:'#065'}],
 wishlist:[{u:.80,d:8.0,t:'13 000 вишлистов и написали два издателя',s:'#012'}],
 finale:[{u:.10,d:5.0,t:'Если я перестану стримить — значит, я заработал свои миллионы',s:'#015'},{u:.42,d:6.0,t:'Главное — доделывать. Доводить до релиза',s:'#200'}],
};

// длительности: из body51-timing.js (сборка), иначе — оценка
const T=window.BODY51_TIMING||null;
const SC=[];{let t=0;for(const d of DEFS){
  const m=T&&T.scenes?T.scenes.find(x=>x.id===d.id):null;
  const dur=m?m.dur:(window.BODY51_NARR&&window.BODY51_NARR[d.id]?window.BODY51_NARR[d.id]+2.6:d.nom);
  SC.push({id:d.id,title:d.title,fact:d.fact,start:t,dur,kind:d.id,narr:m?m.narr:null,narrAt:(m&&m.narrAt)||.6,
  narrDur:m?(m.narrDur||Math.max(4,dur-2.9)):0,narrText:m?(m.narrText||''):'',quotes:QUOTES[d.id]||[]});
  t+=dur}}
// если у главы есть озвученный блок цитат — титры-цитаты рисуем блоком (см. hud)
for(const s of SC){const m=T&&T.scenes?T.scenes.find(x=>x.id===s.id):null;
  if(!m)continue;
  if(m.narrSeg)s.narrSeg=m.narrSeg;
  if(m.narrOn!=null){s.narrOn=m.narrOn;s.narrOff=m.narrOff;s.narrAt=m.narrAt}
  if(m.quote){s.quote=m.quote;s.quotes=[]}}
// минутная нарезка: в тайминге только выбранные главы — берём их порядок и тайминги из тайминга
if(T&&T.subset){window.BODY51_CUT=true;const keep=[];
  for(const m of T.scenes){const sc=SC.find(s=>s.id===m.id);if(!sc)continue;
    sc.start=m.start;sc.dur=m.dur;keep.push(sc)}
  SC.length=0;SC.push(...keep);}
const TOTAL=SC[SC.length-1].start+SC[SC.length-1].dur;
const sceneAt=t=>{for(const s of SC)if(t>=s.start&&t<s.start+s.dur)return s;return SC[SC.length-1]};

// ---------- палитра ----------
const NIGHT=['#070b16','#16233f'],AUR=['#58f0c0','#46c8ff','#9b6bff'];
const AMBER='#ffc06a',VIOLET='#b07cff',PAPER='#f3efe6',INK='#10131c',MINT='#a8ebc2';

// ---------- мелкие помощники рисования ----------
function rr(x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
function fill(c,x,y,w,h,r=0){g.fillStyle=c;if(r)rr(x,y,w,h,r);else g.fillRect(x,y,w,h);if(r)g.fill()}
function glow(x,y,r,col,a=1){if(r<=0)return;const has=col.indexOf('A')>=0;const c0=has?col.replace('A',a):col,c1=has?col.replace('A',0):'rgba(0,0,0,0)';
 const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function vgrad(a,b,y0=0,y1=H){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,y0,W,y1-y0)}
// в Node-рендере (@napi-rs/canvas) есть версии, где выравнивание применяется дважды —
// тогда включаем зеркальную компенсацию флагом window.__body51_align='mirror'.
const A=a=>(window.__body51_align==='mirror')?(a==='left'?'right':a==='right'?'left':a):a;
function txt(s,x,y,size=40,color='#fff',weight=700,align='center',font='system-ui,sans-serif'){g.font=`${weight} ${size}px ${font}`;g.textAlign=A(align);g.textBaseline='middle';g.fillStyle=color;g.fillText(s,x,y)}
function lines(s,x,y,maxW,lh,size=40,color='#fff',weight=700,align='center',font='system-ui,sans-serif'){g.font=`${weight} ${size}px ${font}`;g.textAlign=A(align);g.textBaseline='middle';g.fillStyle=color;
 const w=s.split(' ');const out=[];let line='';for(const q of w){const n=line?line+' '+q:q;if(g.measureText(n).width>maxW&&line){out.push(line);line=q}else line=n}if(line)out.push(line);
 const h=(out.length-1)*lh/2;out.forEach((p,i)=>g.fillText(p,x,y-h+i*lh));return out.length}
function shadow(x,y,rx,ry,a=.25){g.fillStyle=`rgba(0,0,0,${a})`;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill()}
function panel(x,y,w,h,r=26,a=.82){fill(`rgba(9,12,20,${a})`,x,y,w,h,r);g.strokeStyle='#ffffff22';g.lineWidth=2;rr(x,y,w,h,r);g.stroke()}
function chip(text,x,y,opt={}){g.font=`700 ${opt.size||26}px system-ui,sans-serif`;const tw=g.measureText(text).width;const w=tw+(opt.pad||34),h=(opt.size||26)+22;
 const xx=opt.right?x-w:(opt.center?x-w/2:x);fill(opt.bg||'rgba(255,255,255,.10)',xx,y,w,h,h/2);
 g.strokeStyle=opt.line||'#ffffff2e';g.lineWidth=2;rr(xx,y,w,h,h/2);g.stroke();
 txt(text,xx+w/2,y+h/2+1,opt.size||26,opt.col||'#e8ecf3',700,'center');return{xx,y,w,h}}
function snow(t,n=90,alpha=.75){for(let i=0;i<n;i++){const sp=22+hp(i)*46,x=(hp(i*3.7)*W+t*sp*.35+i*13)%(W+120)-60,y=(hp(i*7.1)*1700+t*sp)%1800+60,r=1.6+hp(i*5.3)*3.4;
  g.fillStyle=`rgba(233,241,255,${alpha*(.35+hp(i*9.1)*.5)})`;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}}
function stars(t,n=150){for(let i=0;i<n;i++){const x=hp(i*2.1)*W,y=hp(i*4.7)*900,r=.8+hp(i*6.3)*1.7,a=.25+.55*Math.abs(Math.sin(t*.7+i));
  g.fillStyle=`rgba(226,238,255,${a})`;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}}
function aurora(t,a=1,base=760){for(let b=0;b<3;b++){g.save();g.globalCompositeOperation='screen';g.globalAlpha=a*(.85-b*.2);
  const col=AUR[b%3].replace('#','');const r=parseInt(col.slice(0,2),16),gg=parseInt(col.slice(2,4),16),bb=parseInt(col.slice(4,6),16);
  const y0=520+b*70,h=520-b*60;const gr=g.createLinearGradient(0,y0-h*.55,0,y0+h*.9);gr.addColorStop(0,`rgba(${r},${gg},${bb},0)`);gr.addColorStop(.4,`rgba(${r},${gg},${bb},.20)`);gr.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
  g.fillStyle=gr;g.beginPath();g.moveTo(-60,base);
  for(let x=-60;x<=W+60;x+=36){const y=y0+Math.sin(x*.0042+t*(.20+b*.09)+b*2)*120+Math.sin(x*.011-t*.33)*46;g.lineTo(x,y)}
  g.lineTo(W+60,base+240);g.lineTo(-60,base+240);g.closePath();g.fill();g.restore()}}
function codeLines(x,y,w,rows,t,color='#7fe0c0',speed=7){for(let i=0;i<rows;i++){const ph=(t*speed+i*1.7)%(rows*2.6);if(ph>rows)continue;const yy=y+i*22+2;
  g.fillStyle=color;g.globalAlpha=.55+.35*Math.abs(Math.sin(t*1.4+i));const ww=w*(.25+hp(i*3.3+t*0.02|0)*.7);g.fillRect(x,yy,ww,7);g.globalAlpha=1}}

// ---------- фигурка человека ----------
function person(x,y,s,o={}){
  const skin=o.skin||'#f0cdb0',shirt=o.shirt||'#5d7fb8',hair=o.hair||'#e3bd77',pants=o.pants||'#2c3450';
  const bob=o.talk?Math.sin((o.t||0)*11)*3*s:0,arm=o.arm||0;
  if(!o.noShadow)shadow(x,y+4,62*s,15*s,.28);
  g.save();g.translate(x,y+bob);g.scale(s,s);
  if(o.slump){g.translate(0,16);g.rotate(.06)}
  fill(pants,-52,-92,44,96,12);fill(pants,8,-92,44,96,12);                       // ноги
  fill('#1d2130',-58,-14,52,18,8);fill('#1d2130',6,-14,52,18,8);                 // обувь
  fill(shirt,-62,-236,124,156,34);                                               // торс
  g.save();g.translate(-58,-206);g.rotate(arm*.5);fill(shirt,-16,0,24,120,12);g.fillStyle=skin;g.beginPath();g.arc(-4,124,15,0,TAU);g.fill();g.restore();
  g.save();g.translate(58,-206);g.rotate(-arm*.5);fill(shirt,0,0,24,120,12);g.fillStyle=skin;g.beginPath();g.arc(12,124,15,0,TAU);g.fill();g.restore();
  g.fillStyle='#e8c39f';rr(-13,-252,26,26,8);g.fill();                            // шея
  fill(skin,-40,-344,80,96,36);                                                  // голова
  g.fillStyle=hair;g.beginPath();g.moveTo(-41,-300);g.quadraticCurveTo(-46,-360,0,-358);g.quadraticCurveTo(46,-360,41,-300);g.quadraticCurveTo(28,-330,0,-332);g.quadraticCurveTo(-28,-330,-41,-300);g.fill();
  if(o.beard){g.fillStyle='#c8a37a';g.beginPath();g.moveTo(-30,-292);g.quadraticCurveTo(0,-236,30,-292);g.quadraticCurveTo(0,-268,-30,-292);g.fill()}
  g.fillStyle='#26314a';g.beginPath();g.arc(-14,-310,4.6,0,TAU);g.arc(14,-310,4.6,0,TAU);g.fill();
  if(o.glasses){g.strokeStyle='#2b3448';g.lineWidth=2.6;g.beginPath();g.arc(-14,-310,13,0,TAU);g.arc(14,-310,13,0,TAU);g.moveTo(-1,-310);g.lineTo(1,-310);g.stroke()}
  if(o.hands){}g.restore();
}
// кот: лысый, ушастый, в морщинках
function cat(x,y,s,o={}){
  const t=o.t||0,w=Math.sin(t*1.6+s)*3,skin=o.dark?'#8d7f85':'#c9b6ae',dark='#a9929a';
  g.save();g.translate(x,y);g.scale(s,s);
  shadow(0,6,54,13,.3);
  g.fillStyle=skin;g.beginPath();g.ellipse(-24,-30+w*.4,46,32,-.06,0,TAU);g.fill();          // тело
  g.strokeStyle=dark;g.lineWidth=3;g.beginPath();for(let i=0;i<4;i++){g.moveTo(-56+i*12,-48);g.quadraticCurveTo(-50+i*12,-36,-54+i*12,-24)}g.stroke();
  g.fillStyle=skin;g.beginPath();g.ellipse(16,-58+w*.6,30,27,0,0,TAU);g.fill();              // голова
  g.beginPath();g.moveTo(-4,-78);g.lineTo(2,-102);g.lineTo(18,-80);g.closePath();g.fill();    // ухо
  g.beginPath();g.moveTo(24,-80);g.lineTo(36,-102);g.lineTo(44,-76);g.closePath();g.fill();
  g.fillStyle='#b9a3ab';g.beginPath();g.ellipse(4,-84,5,7,0,0,TAU);g.ellipse(34,-83,5,7,0,0,TAU);g.fill();
  g.fillStyle=o.eyes||'#3f8f6a';g.beginPath();g.ellipse(10,-62,6,7,0,0,TAU);g.ellipse(28,-62,6,7,0,0,TAU);g.fill();
  g.fillStyle='#1b1418';g.fillRect(9,-65,2.4,14);g.fillRect(27,-65,2.4,14);
  g.strokeStyle=dark;g.lineWidth=2.4;g.beginPath();g.moveTo(6,-46);g.quadraticCurveTo(19,-38,32,-46);g.stroke();
  if(o.tongue){g.fillStyle='#e08a94';g.beginPath();g.ellipse(19,-42,5,7+Math.sin(t*8)*3,0,0,TAU);g.fill()}
  if(o.paw){g.fillStyle=dark;g.beginPath();g.ellipse(o.paw.x,o.paw.y,13,10,0,0,TAU);g.fill()}
  g.strokeStyle=skin;g.lineWidth=9;g.lineCap='round';g.beginPath();g.moveTo(44,-24);g.quadraticCurveTo(84,-18+Math.sin(t*2.2)*14,74,-44);g.stroke();
  g.restore();
}

// ---------- общие фоны ----------
function polarNight(t,o={}){
  vgrad('#050810','#152238',0,H*.82);vgrad('#0b1220','#070a12',H*.82,H);
  stars(t);aurora(t,o.aurora===undefined?1:o.aurora,o.base||H*.62);
  const moon=o.moon===undefined?1:o.moon;if(moon>0){g.save();g.globalAlpha=moon;glow(830,300,150,'rgba(210,230,255,A)',.30);g.fillStyle='#e6eefc';g.beginPath();g.arc(830,300,52,0,TAU);g.fill();g.fillStyle='#152238';g.beginPath();g.arc(806,286,46,0,TAU);g.fill();g.restore()}
}
function skyline(x0,y0,scale,t,o={}){
  g.save();g.translate(x0,y0);g.scale(scale,scale);
  for(let i=0;i<9;i++){const w=120+hp(i*3.1)*70,h=260+hp(i*5.7)*220,x=-40+i*148,y=-h;
    const col=i%2?'#0d1526':'#101a2e';fill(col,x,y,w,h+40,6);
    for(let r=0;r<Math.floor(h/54);r++)for(let c=0;c<Math.floor(w/44);c++){
      const on=hp(i*17+r*3.7+c*9.2)>(o.lit===undefined?.62:o.lit);
      const isHis=o.his&&i===o.his.i&&r===o.his.r&&c===o.his.c;
      g.fillStyle=isHis?'#ffd79a':(on?`rgba(255,196,120,${.35+.5*hp(i+r+c)})`:'rgba(120,150,200,.10)');
      g.fillRect(x+14+c*44,y+20+r*54,22,28);
      if(isHis){glow(x+14+c*44+11,y+20+r*54+14,60,'rgba(255,214,150,A)',.5)}}
  }
  g.restore();
}
function room(t,o={}){
  // тёплая комната: стена, окно с авророй, стол, лампа, монитор
  vgrad('#191426','#0e0d18',0,H);fill('#151021',0,0,W,1180);fill('#241a2e',0,1120,W,240);
  const wx=90,wy=300,ww=380,wh=460;
  fill('#0a1120',wx-14,wy-14,ww+28,wh+28,18);vgrad('#081226','#1d3352',wy,wy+wh);
  g.save();g.beginPath();rr(wx,wy,ww,wh,10);g.clip();aurora(t+3,.5,wy+300);stars(t+2,50);snow(t,18,.5);g.restore();
  g.strokeStyle='#2b2438';g.lineWidth=10;rr(wx-14,wy-14,ww+28,wh+28,18);g.stroke();
  g.strokeStyle='#2b2438';g.lineWidth=8;g.beginPath();g.moveTo(wx+ww/2,wy);g.lineTo(wx+ww/2,wy+wh);g.moveTo(wx,wy+wh/2);g.lineTo(wx+ww,wy+wh/2);g.stroke();
  // стол
  fill('#2a1f2c',360,1080,660,34,10);fill('#20172a',360,1114,660,120,10);
  // монитор
  const mx=600,my=760,mw=430,mh=280;fill('#0d1018',mx-10,my-10,mw+20,mh+20,14);fill('#101827',mx,my,mw,mh,10);
  g.save();g.beginPath();rr(mx,my,mw,mh,10);g.clip();codeLines(mx+18,my+22,mw-40,11,t+2,o.code||'#7fe0c0',o.speed||9);g.restore();
  glow(mx+mw/2,my+mh/2,260,'rgba(120,200,255,A)',.14);
  fill('#0d1018',mx+mw/2-26,my+mh+8,52,22,4);fill('#0d1018',mx+mw/2-90,my+mh+30,180,14,7);
  // лампа и тёплый свет
  glow(300,700,420,'rgba(255,180,110,A)',.22);
  fill('#241c30',250,940,26,140,8);g.fillStyle='#f6cf95';g.beginPath();g.moveTo(196,940);g.lineTo(330,940);g.lineTo(300,880);g.lineTo(226,880);g.closePath();g.fill();
  glow(263,930,180,'rgba(255,203,140,A)',.33);
  // растения под фитолампой
  for(let i=0;i<4;i++){const px=900+i*44;fill('#2c2233',px-18,1180,36,44,6);g.strokeStyle='#3f6b52';g.lineWidth=5;
    g.beginPath();for(let k=0;k<4;k++){g.moveTo(px,1186);g.quadraticCurveTo(px+18*(k%2?1:-1),1150-k*10,px+8*(k%2?1:-1),1120-k*16)}g.stroke();}
  glow(1000,1080,240,'rgba(170,120,255,A)',.16);g.fillStyle='#a06bff';g.fillRect(880,1060,260,10);
  return{desk:{x:360,y:1080,w:660},monitor:{x:mx,y:my,w:mw,h:mh}};
}
// ---------- операции интерфейса ----------
function progressBar(t){const y=H-14;g.fillStyle='#ffffff18';g.fillRect(0,y,W,6);g.fillStyle=AMBER;g.fillRect(0,y,W*clamp(t/TOTAL),6);
  for(const s of SC){g.fillStyle='#ffffff55';g.fillRect(s.start/TOTAL*W,y-4,2,14)}}
function hud(sc,t){
  // верхняя плашка
  panel(40,44,700,72,20,.55);txt('ВАЙБКОДЕР ИЗ МУРМАНСКА',66,81,28,PAPER,800,'left');
  const i=SC.indexOf(sc)+1;panel(W-282,44,242,72,20,.55);txt(('ГЛАВА '+i)+' / '+SC.length,W-161,81,26,'#cfd6e2',700,'center');
  // название главы + факты
  txt(sc.title,CX,168,40,'#f1e9dc',800,'center');
  panel(CX-190,196,380,54,27,.4);txt('факты: '+sc.fact,CX,224,26,'#ffd8a0',700,'center');
  // блок озвученных цитат: каждая строка появляется ровно тогда, когда её читает второй голос
  if(sc.quote){
    const q=sc.quote, segs=q.seg&&q.seg.length?q.seg:null;
    const local=t-sc.start;
    if(local>=q.on-0.45&&local<=q.off+1.1){
      const shown=segs?segs.filter(g=>local>=g.t0-0.28&&local<=g.t1+0.42):[{text:q.lines.join(' · '),t0:q.on,t1:q.off}];
      if(shown.length){
        g.save();
        g.font='italic 700 44px Georgia,serif';
        const l=[];
        shown.forEach((seg,idx)=>{
          if(idx)g.fillText('',0,0);
          const words=seg.text.split(' ');let cur='';
          for(const w of words){const cand=cur?cur+' '+w:w;
            if(g.measureText(cand).width>860&&cur){l.push(cur);cur=w}else cur=cand}
          if(cur)l.push(cur);
          if(idx<shown.length-1)l.push('␣');
        });
        while(l.length&&l[l.length-1]==='␣')l.pop();
        const hh=l.length*58+104,y0=Math.min(1420,1560-hh);
        // мягкое появление каждой строки
        let k=1;
        const first=shown[0],last=shown[shown.length-1];
        k=Math.min(1,Math.max(0,(local-(first.t0-0.28))/0.28),Math.max(0,Math.min(1,(last.t1+0.42-local)/0.4)));
        g.globalAlpha=clamp(k);
        panel(CX-505,y0,1010,hh,28,.88);
        g.fillStyle=AMBER;rr(CX-505+26,y0+22,8,hh-44,4);g.fill();
        txt('ЦИТАТА СО СТРИМА · голос со стрима читает второй диктор',CX-455,y0+42,23,'#ffd8a0',700,'left','ui-monospace,monospace');
        l.forEach((p,i)=>txt(p==='␣'?'':p,CX-404,y0+86+i*58,44,'#fff6e6',700,'left','Georgia,serif'));
        txt(q.who,CX+478,y0+hh-24,23,'#9aa3b2',600,'right');
        g.restore()}
    }
  }
  // субтитры рассказчика: текущее предложение закадрового текста
  if(sc.narrText){
    const local=t-sc.start;
    const segs=sc.narrSeg;
    if(segs&&segs.length){
      // точная синхронизация: у каждой фразы своё окно (замер пауз в озвучке)
      const cur=segs.find(x=>local>=x.t0-0.25&&local<=x.t1+0.30);
      if(cur){
        const a=Math.min(1,(local-(cur.t0-0.25))/0.25,Math.max(0,(cur.t1+0.30-local)/0.30));
        if(a>0){g.save();g.globalAlpha=clamp(a);
          panel(64,1638,952,166,26,.76);
          panel(88,1652,186,34,17,.5);
          txt('ЗА КАДРОМ',181,1669,19,MINT,800,'center','ui-monospace,monospace');
          lines(cur.text.trim(),CX-10,1740,796,38,40,'#eef2f8',600,'center','system-ui,sans-serif');
          g.restore()}
      }
    }else if(sc.narrText){}
  }
  // — минутная мем-версия: крючок в начале и карточка-итог в конце
  if(window.BODY51_CUT){
    if(t<2.6){const a=Math.min(1,(2.6-t)/0.55)||0;
      if(a>0){g.save();g.globalAlpha=clamp(a);
        const w=920,x=CX-w/2,y=1146,h=180;
        fill('rgba(10,12,20,.88)',x,y,w,h,30);
        g.strokeStyle='#ffc06a55';g.lineWidth=3;rr(x,y,w,h,30);g.stroke();
        txt('⚡ МИНУТНАЯ МЕМ-ВЕРСИЯ',CX,y+48,42,AMBER,900,'center','system-ui,sans-serif');
        txt('Мурманск · 10 лет геймдева · 0 релизов',CX,y+104,28,'#f1e9dc',700,'center');
        txt('6 глав · только самое смешное',CX,y+148,25,'#cfd6e2',600,'center');
        g.restore()}}
    if(t>TOTAL-3.6){const a=Math.min(1,(t-(TOTAL-3.6))/0.4);
      g.save();g.globalAlpha=clamp(a);
      fill('rgba(4,5,9,'+(0.78*clamp(a)).toFixed(3)+')',0,0,W,H);   // затемнение под карточку
      const w=940,x=CX-w/2,y0=560,h=780;
      fill('rgba(10,12,20,.94)',x,y0,w,h,34);
      g.strokeStyle='#ffc06a44';g.lineWidth=3;rr(x,y0,w,h,34);g.stroke();
      txt('ИТОГО',CX,y0+84,30,'#9aa3b2',800,'center','ui-monospace,monospace');
      const rows=[['10 лет делает игры','0 релизов'],
                  ['2 месяца вайбкода','1 релиз'],
                  ['релизная девственность','ПОТЕРЯНА']];
      rows.forEach((r,i)=>{
        const la=clamp((t-(TOTAL-3.35+i*0.5))/0.3);
        if(la>0){g.globalAlpha=clamp(la);
          const yy=y0+210+i*116;
          txt(r[0],CX-44,yy,34,'#cfd6e2',600,'right','system-ui,sans-serif');
          txt(r[1],CX+44,yy,40,i===2?MINT:AMBER,900,'left','system-ui,sans-serif');
          if(i===2){const gx=CX+44+g.measureText(r[1]).width+20;   // галочка «потеряна»
            g.strokeStyle=MINT;g.lineWidth=6;g.lineCap='round';
            g.beginPath();g.moveTo(gx,yy-4);g.lineTo(gx+16,yy+12);g.lineTo(gx+46,yy-24);g.stroke();}
        }
      });
      g.globalAlpha=clamp((t-(TOTAL-1.3))/0.3);
      g.strokeStyle='#ffffff1c';g.lineWidth=2;
      g.beginPath();g.moveTo(x+60,y0+600);g.lineTo(x+w-60,y0+600);g.stroke();
      txt('@body51 · стримы каждый будний вечер',CX,y0+664,28,'#cfd6e2',600,'center');
      txt('полная версия — 12 глав, 3:55',CX,y0+716,30,MINT,800,'center','system-ui,sans-serif');
      g.restore()}
  }
  progressBar(t);
}

// ---------- экспорт для сцен и запуска ----------
window.B={clamp,lerp,ease,seg,easeOut,easeIn,hp,rr,fill,glow,vgrad,txt,lines,shadow,panel,chip,toast:null,
 snow,stars,aurora,codeLines,person,cat,polarNight,skyline,room,fmtT,hud,
 SC,TOTAL,sceneAt,SCENES:null,
 AMBER,VIOLET,PAPER,MINT,AUR,NIGHT};
})();
