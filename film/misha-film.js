// misha-film.js — кадр, HUD, субтитры, музыка и запуск «МИША ПРОТИВ ВСЕГО».
// Кадр = 3D (WebGL) + пост (fx.js) + 2D-оверлей. Всё детерминировано от t.
(function(){
const M3=window.M3,U=M3.utils,F=window.MFILM;
const {clamp,lerp,seg,easeOut,easeIn,easeIO,smooth,TAU}=U;
const W=1920,H=1080,CX=W/2,CY=H/2;
const cv=document.getElementById('c'),g=cv.getContext('2d');
const glc=document.createElement('canvas');glc.width=W;glc.height=H;
M3.init(glc);
M3.buildAllWorlds();
const AC=window.MACTORS();

// ---------- шрифты ----------
try{const f1=new FontFace('Manrope','url(body51-day/fonts/Manrope-800.ttf)'),f2=new FontFace('ManropeM','url(body51-day/fonts/Manrope-600.ttf)');
  [f1,f2].forEach(f=>f.load().then(ff=>document.fonts.add(ff)).catch(()=>{}))}catch(e){}
const FIMP=(s)=>`900 ${s}px Impact,'Arial Black','Arial Black',sans-serif`;
const FMAN=(s)=>`800 ${s}px Manrope,system-ui,sans-serif`;

// ---------- треки ----------
for(const r of F.rounds){
  r.mTrack=r.beats.filter(b=>b.k==='mmove');
  r.eTracks=r.actors.slice(1).length?[]:null;
  const n=r.actors.length-1;
  r.eTrack=[];for(let i=0;i<n;i++)r.eTrack.push(r.beats.filter(b=>b.k==='emove'&&b.who===i));
  r.maxHp=r.meta&&r.name==='ДЕД'?300:100;
}
function enemyRigs(names){const out=[];for(const nm of names){switch(nm){
  case 'bacteria':out.push(AC.bacteria);break;case 'param':out.push(...AC.param);break;
  case 'roach':out.push(AC.roach);break;case 'cat':out.push(AC.cat);break;
  case 'geese':out.push(...AC.geese);break;case 'bear':out.push(AC.bear);break;
  case 'gopnik':out.push(AC.gopnik);break;case 'trex':out.push(AC.trex);break;
  case 'ded':out.push(AC.ded);break;case 'earth':out.push(AC.earth);break;
  case 'galaxy':out.push(AC.galaxy);break;case 'pot':out.push(AC.pot);break}}return out}

// ---------- пул снарядов ----------
const projs=[];
(function(){const P=M3.prims;
  for(let i=0;i<6;i++){const gr=new window.THREE.Group();
    gr.add(P.box(.16,.04,.3,'#d84a4a'));const s1=P.box(.14,.03,.06,'#f2f2f2');s1.position.set(0,.03,.02);gr.add(s1);
    const s2=P.box(.05,.04,.28,'#f2f2f2');s2.position.set(0,.025,0);gr.add(s2);
    gr.visible=false;M3.scene.add(gr);projs.push({g:gr,kind:'tapok'})}
  for(let i=0;i<20;i++){const s=P.sph(.05,'#c9a06a',null,6);s.visible=false;M3.scene.add(s);projs.push({g:s,kind:'seed'})}})();

// ---------- спецпозиции финала ----------
const FIN_DEFS=[[-2.6,0,-1.6],[-1.7,0,-2.1],[-.8,0,-2.4],[-.1,0,-2.6],[.7,0,-2.55],[1.5,0,-2.7],[2.5,0,-2.4],[3.6,0,-1.9],[-4.6,1.4,-2.6],[4.7,2.4,-3.2],[-3.8,.6,-3],[-1,1.2,1.4]];
(function(){const rf=F.rounds[F.rounds.length-1];rf.enemyDef=FIN_DEFS})();

let worldNow=null;
function roundAt(t){let r=F.rounds[0];for(const x of F.rounds)if(t>=x.t0)r=x;return r}

// ---------- исполнение битов ----------
function runRound(r,tAbs){
  const lt=tAbs-r.t0,beats=r.beats;
  const rigs=enemyRigs(r.actors.slice(1));
  // мир
  if(worldNow!==r.world){worldNow=r.world;M3.setWorld(r.world);
    if(r.world==='stadium'&&M3.stadiumScreen)M3.stadiumScreen.set(r.meta.enemy||r.name,r.title)}
  // видимость
  const vis=new Set([AC.misha,...rigs]);
  for(const k in AC){const v=AC[k];if(Array.isArray(v))v.forEach(x=>x.g.visible=vis.has(x));else if(v&&v.g)v.g.visible=vis.has(v)}
  // позиции
  const mp=moveAt(r.mTrack,lt,r.mishaDef||[0,0,0]);
  AC.misha.g.position.set(mp[0],mp[1]||0,mp[2]||0);
  const space=(r.world==='space'||r.world==='galaxyW');
  if(space){AC.misha.g.position.y=1.5+.35*Math.sin(tAbs*1.15);AC.misha.shadow.visible=false}
  else AC.misha.shadow.visible=true;
  const epos=[];
  rigs.forEach((e,i)=>{const p=moveAt(r.eTrack[i]||[],lt,(r.enemyDef&&r.enemyDef[i])||[2,0,0]);
    e.g.position.set(p[0],(r.enemyDef&&r.enemyDef[i]&&r.enemyDef[i][1]||0)+(p[1]||0),p[2]||0);
    e.g.rotation.x=0;e.g.rotation.z=0;epos.push(e.g.position)});
  // пролог: бактерия выпрыгивает из кастрюли (дуга)
  if(r.name==='СУП'&&rigs[0]){const b=rigs[0];
    if(lt<9.2)b.g.position.y=1.45;else if(lt<10.5)b.g.position.y=lerp(1.45,0,(lt-9.2)/1.3)+.6*Math.sin(Math.PI*(lt-9.2)/1.3)}
  // финал: трофеи-масштабы
  if(r.name==='ФИНАЛ'){AC.earth.g.scale.setScalar(.22);AC.galaxy.g.scale.setScalar(.1);
    AC.bacteria.g.scale.setScalar(.8);AC.roach.g.scale.setScalar(.8)}
  else{AC.earth.g.scale.setScalar(1);AC.galaxy.g.scale.setScalar(1);AC.bacteria.g.scale.setScalar(1);AC.roach.g.scale.setScalar(1)}
  // Миша: поза
  const P=M3.newPose();M3.moves.guard(tAbs,P);
  const mv=activeMove(r.mTrack,lt);if(mv)M3.moves.walk(tAbs,P,mv.e==='lin'?2:1.3);
  for(const b of beats)if(b.k==='pose'&&lt>=b.t&&lt<=b.t+b.d){
    const A=M3.newPose();const fn=M3.moves[b.move];if(fn)fn((lt-b.t)/b.d,A,b.o);M3.mixPose(P,A,1)}
  M3.applyPose(AC.misha,P);
  // лицом к врагу
  let face=Math.PI;
  if(rigs.length&&rigs[0].kind!=='pot'){const e=rigs[0].g.position;
    face=Math.atan2(e.x-AC.misha.g.position.x,e.z-AC.misha.g.position.z)}
  else if(r.name==='СУП')face=Math.atan2(0-AC.misha.g.position.x,-3.2-AC.misha.g.position.z);
  AC.misha.g.rotation.y=face+P.rootRY;
  // враги: анимации
  rigs.forEach((e,i)=>{
    if(e.idle)try{e.idle(tAbs+i*.7,{misha:AC.misha.g.position})}catch(err){}
    let ry=Math.atan2(AC.misha.g.position.x-e.g.position.x,AC.misha.g.position.z-e.g.position.z);
    e.g.rotation.y=ry;
    for(const b of beats)if(b.k==='eact'&&b.who===i&&lt>=b.t&&lt<=b.t+b.d){
      const k=(lt-b.t)/b.d;try{e.act&&e.act(b.fn,k,{misha:AC.misha.g.position,alt:b.o&&b.o.alt})}catch(err){}}
    for(const b of beats)if(b.k==='eRy'&&b.who===i&&lt>=b.t&&lt<=b.t+b.d)e.g.rotation.y=b.ry});
  // тряска
  let shake=0;for(const b of beats)if(b.k==='shake'&&lt>=b.t&&lt<=b.t+b.d)
    shake+=b.amp*(1-clamp((lt-b.t)/b.d));
  M3._shake=shake;
  // снаряды
  let used={tapok:0,seed:0};
  for(const p of projs)p.g.visible=false;
  for(const b of beats)if(b.k==='proj'&&lt>=b.t&&lt<=b.t+b.d){
    const k=(lt-b.t)/b.d,pool=projs.filter(p=>p.kind===b.kind),p=pool[used[b.kind]++%pool.length];
    if(!p)continue;p.g.visible=true;
    const x=lerp(b.from[0],b.to[0],k),z=lerp(b.from[2],b.to[2],k);
    const y=lerp(b.from[1],b.to[1],k)+b.arc*Math.sin(Math.PI*k);
    p.g.position.set(x,y,z);p.g.rotation.set(k*b.spin,k*b.spin*.7,k*b.spin)}
  // частицы и кольца
  M3.fxBursts(lt,beats);M3.fxRings(lt,beats);
  // мир
  const wd=M3.worlds[r.world];if(wd&&wd.update)try{wd.update(tAbs,r.world==='stadium'?(1.3+shake):1)}catch(err){}
  // камера
  M3.cameraAt(lt,r.shots);
}
function activeMove(list,t){for(const m of list)if(t>=m.t&&t<m.t+m.d)return m;return null}
function moveAt(list,t,def){let cur=def,act=null;
  for(const m of list){if(t>=m.t+m.d)cur=m.to;else if(t>=m.t){act=m;break}}
  if(!act)return cur;
  const k=clamp((t-act.t)/act.d),e=act.e==='out'?easeOut(k):act.e==='lin'?k:easeIO(k);
  let prev=def;for(const m of list){if(m===act)break;if(t>=m.t+m.d)prev=m.to}
  return[lerp(prev[0],act.to[0],e),lerp(prev[1]||0,act.to[1]||0,e),lerp(prev[2]||0,act.to[2]||0,e)]}

// ============================================================= 2D-ОВЕРЛЕЙ
function scan(beats,lt,kind){const out=[];for(const b of beats)if(b.k===kind&&lt>=b.t&&lt<=b.t+(b.d||0))out.push(b);return out}
function lastBefore(beats,lt,kind){let best=null;for(const b of beats)if(b.k===kind&&b.t<=lt)best=b;return best}

function overlay(r,tAbs){
  const lt=tAbs-r.t0;
  const beatAct=(k)=>scan(r.beats,lt,k);
  g.save();g.textAlign='center';g.textBaseline='middle';
  // ---- смена слоёв: карта раунда
  const cards=beatAct('cardT');
  if(cards.length&&r.name!=='СУП')drawCard(r,clamp((lt-cards[0].t)/cards[0].d));
  if(r.name==='СУП')drawIntroTitles(r,lt);
  // ---- HP-бары
  const hpB=lastBefore(r.beats,lt,'hp');
  let hp=hpB?hpB.v:r.maxHp;hp=clamp(hp/r.maxHp);
  if(r.name!=='СУП'&&r.name!=='ФИНАЛ')drawBossBar(r,hp);
  // ---- комбо
  let combo=null;for(const b of r.beats)if(b.k==='combo'&&lt>=b.t&&lt<b.t+1.6)combo=b;
  if(combo&&r.name!=='СУП'){const k=clamp((lt-combo.t)/.18),s=1+.55*(1-k);
    g.save();g.translate(W-210,220);g.rotate(-.08);g.scale(s,s);
    g.font=FIMP(120);g.lineWidth=14;g.strokeStyle='#1a0d00';g.strokeText('×'+combo.n,0,0);
    const gr=g.createLinearGradient(0,-60,0,60);gr.addColorStop(0,'#fff4c0');gr.addColorStop(1,'#ffb01e');
    g.fillStyle=gr;g.fillText('×'+combo.n,0,0);g.font=FMAN(26);g.fillStyle='#ffe8b0';g.fillText('КОМБО',0,74);g.restore()}
  // ---- цифры урона
  for(const b of beatAct('dmg')){const k=(lt-b.t)/b.d,s=b.big?1:.65;
    const sc=(1+.9*Math.max(0,1-k*4))*(b.big?1.25:1);
    const p=M3.toScreen(b.at[0],b.at[1],b.at[2]);
    if(p[2]>1)continue;
    g.save();g.translate(p[0],p[1]-70*k);g.scale(sc* (b.big?1.3:1),sc*(b.big?1.3:1));g.rotate(-.06);
    g.font=FIMP(b.big?86:56);
    g.lineWidth=12;g.strokeStyle='#160a00';g.strokeText(b.n,0,0);
    g.fillStyle=b.big?'#ff5a2a':b.n==='-0'?'#7fe0c4':'#ffd24a';g.fillText(b.n,0,0);g.restore()}
  // ---- баннеры-финишеры
  for(const b of beatAct('banner')){const k=(lt-b.t)/b.d;
    const inS=1+1.6*Math.max(0,1-k*5);
    g.save();g.translate(CX,CY-120);g.rotate(-.03);g.scale(inS,inS);
    g.globalAlpha=k>.8?1-(k-.8)/.2:1;
    g.font=FIMP(96);
    g.lineWidth=22;g.strokeStyle='#160a00';g.strokeText(b.text,0,0);
    const gr=g.createLinearGradient(0,-50,0,50);gr.addColorStop(0,'#fff8d8');gr.addColorStop(.55,'#ffd24a');gr.addColorStop(1,'#ff7a1a');
    g.fillStyle=gr;g.fillText(b.text,0,0);g.restore()}
  // ---- субтитры
  for(const b of beatAct('sub')){
    if(r.name==='СУП'&&b.who==='nar')continue;
    drawSub(b,clamp((lt-b.t)/.25))}
  // ---- вспышки
  for(const b of beatAct('flash')){const a=(1-(lt-b.t)/b.d)*.9;
    g.globalAlpha=Math.max(0,a);g.fillStyle=b.c||'#fff';g.fillRect(0,0,W,H);g.globalAlpha=1}
  // ---- скоростные линии
  const spd=(M3._shake||0)>0.22;
  if(spd)drawSpeed(tAbs,Math.min(1.6,M3._shake*2.2));
  // ---- финал: титры
  if(r.name==='ФИНАЛ'&&lt>6.2)drawCredits(r,lt);
  g.restore();
  // ---- кино-полосы
  g.fillStyle='#000';g.fillRect(0,0,W,72);g.fillRect(0,H-72,W,72);
}
function drawCard(r,k){
  const a=.82*smooth(clamp(k*1.2))* (1-seg(k,.88,1));
  if(a<=0)return;
  g.save();g.globalAlpha=a;
  g.fillStyle='#05070d';g.fillRect(0,CY-190,W,380);
  g.fillStyle='#ffd24a';g.fillRect(0,CY-194,W,6);g.fillRect(0,CY+190,W,6);
  g.textAlign='center';
  const sl=1+.25*(1-clamp(k*3));
  g.save();g.translate(CX,CY-92);g.scale(sl,sl);
  g.font=FMAN(44);g.fillStyle='#7fe0c4';g.fillText(r.title,0,0);g.restore();
  g.save();g.translate(CX,CY+16);const s2=1+.4*Math.max(0,1-clamp((k-.15)*3));g.scale(s2,s2);
  g.font=FIMP(108);g.lineWidth=18;g.strokeStyle='#160a00';g.strokeText(r.meta.enemy||r.name,0,0);
  const gr=g.createLinearGradient(0,-54,0,54);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#ffb01e');
  g.fillStyle=gr;g.fillText(r.meta.enemy||r.name,0,0);g.restore();
  g.font=FMAN(30);g.fillStyle='#c9d4e8';g.fillText(r.note,CX,CY+108);
  g.font=FIMP(40);g.fillStyle='#ff5a2a';g.fillText('VS МИША',CX,CY+158);
  g.restore();
}
function drawIntroTitles(r,lt){
  const blocks=[[.6,3.6,'ОМГ ГЕЙМ ПРЕДСТАВЛЯЕТ',44],[4.4,4.0,'МИША ПРОТИВ ВСЕГО',108]];
  for(const[t0,d,txt,fs]of blocks){const k=(lt-t0)/d;if(k<0||k>1)continue;
    const inS=1+1.4*Math.max(0,1-k*4);const a=k>.85?1-(k-.85)/.15:1;
    g.save();g.globalAlpha=a;g.translate(CX,CY-40);g.scale(inS,inS);
    g.font=fs>60?FIMP(fs):FMAN(fs);
    if(fs>60){g.lineWidth=20;g.strokeStyle='#160a00';g.strokeText(txt,0,0);
      const gr=g.createLinearGradient(0,-60,0,60);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#ffb01e');g.fillStyle=gr}
    else g.fillStyle='#ffd24a';
    g.fillText(txt,0,0);g.restore()}
}
function drawBossBar(r,hp){
  const bw=860,bx=CX-bw/2,by=86;
  g.save();
  // имя
  g.font=FMAN(30);g.textAlign='left';g.fillStyle='#fff';g.fillText('МИША',bx,by-26);
  g.textAlign='right';g.fillStyle='#ff9a5a';g.fillText(r.meta.enemy||r.name,bx+bw,by-26);
  // полоса
  g.fillStyle='#0c1018cc';g.fillRect(bx-6,by-6,bw+12,44);
  g.strokeStyle='#ffd24a88';g.lineWidth=2;g.strokeRect(bx-6,by-6,bw+12,44);
  const hw=bw*hp;
  const gr=g.createLinearGradient(bx,0,bx+bw,0);
  gr.addColorStop(0,'#ff3b2f');gr.addColorStop(.6,'#ff7a1a');gr.addColorStop(1,'#ffd24a');
  g.fillStyle=gr;g.fillRect(bx,by,Math.max(0,hw),32);
  if(hp>0){g.fillStyle='#ffffff33';g.fillRect(bx,by,Math.max(0,hw),10)}
  for(let i=1;i<10;i++){g.fillStyle='#00000055';g.fillRect(bx+bw*i/10,by,2,32)}
  // мамина полоска Миши
  const mw=300,mx=44,my=H-128;
  g.font=FMAN(24);g.textAlign='left';g.fillStyle='#7fe0c4';g.fillText('МИША ❤ СУП',mx,my-20);
  g.fillStyle='#0c1018cc';g.fillRect(mx-4,my-4,mw+8,24);
  const mg=g.createLinearGradient(mx,0,mx+mw,0);mg.addColorStop(0,'#2fd85a');mg.addColorStop(1,'#9fe84a');
  g.fillStyle=mg;g.fillRect(mx,my,mw,16);
  g.restore();
}
function drawSub(b,k){
  const a=Math.min(1,k*4)*(1-seg(k,.82,1));
  const x=CX,y=H-150;
  g.save();g.globalAlpha=clamp(a);
  g.font=b.who==='nar'?FMAN(36):FMAN(34);
  const wtxt=g.measureText(b.text).width;
  g.fillStyle='rgba(6,8,14,.62)';
  const bw=wtxt+56,bh=64;
  g.beginPath();g.roundRect?g.roundRect(x-bw/2,y-bh/2,bw,bh,14):g.rect(x-bw/2,y-bh/2,bw,bh);g.fill();
  g.fillStyle=b.who==='nar'?'#fff':b.who==='m'?'#ffd24a':'#7fe0c4';
  g.textAlign='center';g.fillText(b.text,x,y+2);
  g.restore();
}
function drawSpeed(t,amp){
  amp=amp||1;
  g.save();g.translate(CX,CY);g.globalAlpha=.22+.25*Math.min(1,amp);
  g.strokeStyle='#fff';g.lineWidth=2.5+amp;
  for(let i=0;i<36;i++){const a=i/36*TAU+((i*37)%10)*.01;
    const r0=340+((i*53)%140),r1=r0+180+((i*91)%220);
    g.beginPath();g.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);g.stroke()}
  g.restore();
}
function drawCredits(r,lt){
  const k=clamp((lt-6.2)/1.4);
  g.save();g.globalAlpha=k*.95;
  g.fillStyle='rgba(4,6,12,.55)';g.fillRect(0,CY-260,W,520);
  g.textAlign='center';
  g.font=FMAN(30);g.fillStyle='#7fe0c4';g.fillText('В РОЛЯХ',CX,CY-190);
  const rows=[['МИША','— сам себя сыграл'],['СУП','— режиссёрский дебют'],['ДЕД','— мега босс года'],['ГАЛАКТИКА','— сама собой'],['ТАПОК','— спецэффекты'],['ТРИБУНЫ','— массовка']];
  rows.forEach((rw,i)=>{g.font=FMAN(30);g.fillStyle='#fff';g.fillText(rw[0],CX-120,CY-120+i*62);
    g.textAlign='left';g.fillStyle='#c9d4e8';g.fillText(rw[1],CX-40,CY-120+i*62);g.textAlign='center'});
  g.restore();
}

// ============================================================= ЗВУК
const VOICES=[
 {t:0.6,f:'v01.mp3'},{t:16.7,f:'v02.mp3'},{t:46.7,f:'v03.mp3'},{t:72.7,f:'v04.mp3'},{t:98.7,f:'v05.mp3'},
 {t:124.7,f:'v06.mp3'},{t:150.7,f:'v07.mp3'},{t:178.7,f:'v08.mp3'},{t:208.7,f:'v09.mp3'},{t:242.8,f:'v10.mp3'}];
let voiceBufs={};
async function preloadVoices(){
  const ACx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:44100});
  await Promise.all(VOICES.map(async v=>{try{
    const resp=await fetch('misha-voices/'+v.f);if(!resp.ok)return;
    const ab=await resp.arrayBuffer();
    voiceBufs[v.f]=await ACx.decodeAudioData(ab)}catch(e){}}));
  try{ACx.close()}catch(e){}
}
const NOTE=(root,s)=>root*Math.pow(2,s/12);
// стили: паттерны на 16 шагов
const STYLES={
 calm:{kick:'x.......x.......',snare:'',hat:'..x...x...x...x.',bass:'',riff:null,pad:1,crash:0},
 phonk:{kick:'x..x..x.x..x..x.',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',open:'..............x.',bass:'x.......x.......',riff:[0,0,3,0,5,3,0,-2],crash:4},
 hard:{kick:'x...x..xx...x.x.',snare:'....x.......x..x',hat:'xxxxxxxxxxxxxxxx',open:'..............x.',bass:'x..x..x.x..x..x.',riff:[0,3,0,5,0,3,7,5],stab:1,crash:4},
 ded:{kick:'x...x..xx..xx.x.',snare:'....x...x...x..x',hat:'xxxxxxxxxxxxxxxx',open:'......x.......x.',bass:'x..x..x.x..x..x.',riff:[0,0,-2,0,3,0,-4,-2],stab:1,arp:[0,3,7,12,7,3,0,-2],crash:2},
 epic:{kick:'x.......x.......',snare:'........x.......',hat:'..x...x...x...x.',bass:'x.......x.......',riff:null,pad:1,choir:1,crash:8},
 final:{kick:'x...x..xx...x.x.',snare:'....x.......x...',hat:'xxxxxxxxxxxxxxxx',open:'..............x.',bass:'x..x..x.x..x..x.',riff:[0,7,3,10,5,12,7,3],stab:1,arp:[0,3,5,7,10,12,10,7],crash:4},
 anthem:{kick:'x.....x.....x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',bass:'x.....x.....x...',riff:[0,4,7,12,7,4,0,-5],pad:1,crash:8}};
function buildScore(ac,out){
  const nr=ac.sampleRate;
  // общий буфер шума
  const nb=ac.createBuffer(1,nr,nr);const nd=nb.getChannelData(0);
  for(let i=0;i<nr;i++)nd[i]=Math.random()*2-1;
  const noise=(t,d,{f=1200,q=1,type='bandpass',g=.3,a=.005}={})=>{
    const s=ac.createBufferSource();s.buffer=nb;s.loop=true;s.loopStart=Math.random()*.5;s.loopEnd=.5+Math.random()*.4;
    const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
    const gn=ac.createGain();gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+a);
    gn.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(fl);fl.connect(gn);gn.connect(out);s.start(t);s.stop(t+d+.05)};
  const tone=(t,d,{f=440,f2,type='sine',g=.2,a=.004,curve=.0001}={})=>{
    const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);
    if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(1,f2),t+d*.85);
    const gn=ac.createGain();gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+a);
    gn.gain.exponentialRampToValueAtTime(curve,t+d);
    o.connect(gn);gn.connect(out);o.start(t);o.stop(t+d+.05);return o};
  // ударные
  const kick=(t,gv=1)=>{tone(t,.24,{f:160,f2:42,g:.85*gv});noise(t,.05,{f:3000,g:.12*gv,type:'highpass'})};
  const snare=(t)=>{noise(t,.16,{f:1900,q:.8,g:.32});tone(t,.1,{f:190,g:.14,type:'triangle'})};
  const hat=(t,open)=>noise(t,open?.3:.05,{f:8500,type:'highpass',g:open?.16:.09});
  const crash=(t)=>noise(t,1.4,{f:6200,type:'highpass',g:.16,a:.002});
  const bassN=(t,f)=>{tone(t,.22,{f,f2:f*.92,g:.4});tone(t,.22,{f:f/2,g:.25,type:'triangle'})};
  const cowbell=(t,f,gv=1)=>{tone(t,.2,{f,f2:f*.96,g:.16*gv,type:'square'});tone(t,.2,{f:f*1.48,f2:f*1.42,g:.1*gv,type:'square'})};
  const stab=(t,root)=>{[0,3,7].forEach(s=>tone(t,.3,{f:NOTE(root*2,s),g:.1,type:'sawtooth'}));noise(t,.05,{f:2500,g:.05})};
  const padC=(t,root,d)=>{[0,3,7,12].forEach((s,i)=>tone(t,d,{f:NOTE(root,s),g:.028,type:'sawtooth',a:d*.4,curve:.001}));};
  const choirC=(t,root,d)=>{[0,7,12,19].forEach(s=>{tone(t,d,{f:NOTE(root*2,s),g:.05,type:'sawtooth',a:d*.35,curve:.001});
    tone(t,d,{f:NOTE(root*2,s)*1.006,g:.04,type:'sawtooth',a:d*.4,curve:.001})})};
  // ---------- музыка по раундам ----------
  for(const r of F.rounds){const m=r.meta||{};if(!m.bpm)continue;
    const st=STYLES[m.style]||STYLES.phonk;const spb=60/m.bpm/4; // 16-я
    for(let bar=0;bar*spb*16<r.dur;bar++){
      const bt=r.t0+bar*spb*16;
      if(st.crash&&bar%st.crash===0&&bar>0)crash(bt);
      if(st.stab&&bar%2===0)stab(bt,m.root);
      if(st.pad)padC(bt,m.root,spb*16);
      if(st.choir&&bar%4===0)choirC(bt,m.root,spb*16);
      for(let s=0;s<16;s++){const t=bt+s*spb;
        if(st.kick[s]==='x')kick(t,m.style==='calm'?.5:.9);
        if(st.snare&&st.snare[s]==='x')snare(t);
        if(st.hat&&st.hat[s]==='x')hat(t,false);
        if(st.open&&st.open[s]==='x')hat(t,true);
        if(st.bass&&st.bass[s]==='x')bassN(t,m.root);
        if(st.riff&&s%2===0){const i=(s/2+bar*2)%st.riff.length;cowbell(t,NOTE(m.root*4,st.riff[i]),m.style==='calm'?.5:.8)}
        if(st.arp){const i=(s+bar*4)%st.arp.length;if(s%2===1)cowbell(t,NOTE(m.root*8,st.arp[i]),.3)}}}}
  // ---------- SFX из битов ----------
  const S={
    punch:t=>{tone(t,.12,{f:200,f2:60,g:.5});noise(t,.07,{f:1600,g:.25})},
    punchBig:t=>{tone(t,.4,{f:180,f2:38,g:.9});noise(t,.22,{f:900,g:.4});tone(t,.3,{f:60,g:.35,type:'triangle'})},
    whoosh:t=>noise(t,(o2(t)||{}).d||.4,{f:600,q:2,g:.22,a:.15}),
    throw:t=>noise(t,.25,{f:2200,q:3,g:.25,a:.03}),
    block:t=>{tone(t,.1,{f:140,f2:80,g:.4});noise(t,.06,{f:500,g:.2})},
    blip:t=>tone(t,.09,{f:660,f2:880,g:.14,type:'square'}),
    skitter:t=>{for(let i=0;i<6;i++)noise(t+i*.05,.03,{f:4000,g:.1,a:.004})},
    meow:t=>{tone(t,.35,{f:520,f2:880,g:.2,type:'triangle'});tone(t+.28,.3,{f:880,f2:420,g:.16,type:'triangle'})},
    hiss:t=>noise(t,.5,{f:5000,type:'highpass',g:.14,a:.02}),
    honk:t=>{tone(t,.14,{f:340,f2:300,g:.3,type:'square'});tone(t+.16,.2,{f:300,f2:260,g:.3,type:'square'})},
    roar:t=>{tone(t,(o2(t)||{}).d||1,{f:70,f2:48,g:.5,type:'sawtooth'});noise(t,1,{f:300,q:.6,g:.3,a:.1})},
    roarBig:t=>{tone(t,1.6,{f:55,f2:34,g:.7,type:'sawtooth'});tone(t,1.6,{f:82,f2:50,g:.4,type:'sawtooth'});noise(t,1.4,{f:240,q:.5,g:.4,a:.15})},
    stomp:t=>{tone(t,.3,{f:110,f2:40,g:.6});noise(t,.12,{f:400,g:.3})},
    stompBig:t=>{tone(t,.6,{f:90,f2:30,g:.95});noise(t,.3,{f:260,g:.45});tone(t,.5,{f:46,g:.4,type:'triangle'})},
    bell:t=>{tone(t,1.1,{f:880,g:.2});tone(t,1.1,{f:1318,g:.12});tone(t,1.4,{f:1760,g:.07})},
    koSlam:t=>{tone(t,.7,{f:120,f2:30,g:1});noise(t,.5,{f:700,g:.5});noise(t,.25,{f:3000,type:'highpass',g:.2})},
    riser:t=>{const d=(o2(t)||{}).d||1;noise(t,d,{f:500,q:1.5,g:.24,a:d*.8});
      tone(t,d,{f:220,f2:1800,g:.12,type:'sawtooth',a:d*.7})},
    crowd:t=>{const o=o2(t)||{},d=o.d||4,lv=o.level||.6;noise(t,d,{f:900,q:.3,g:.16*lv,a:d*.25})},
    swarm:t=>{for(let i=0;i<10;i++)tone(t+i*.09,.06,{f:500+((i*173)%400),g:.08,type:'square'})},
    seeds:t=>{const d=(o2(t)||{}).d||1.5;for(let i=0;i<d*14;i++)noise(t+i*(d/(d*14)),.02,{f:5200,g:.09,a:.002})},
    impact:t=>{tone(t,.9,{f:100,f2:26,g:1});noise(t,.4,{f:500,g:.45});crash(t)},
    ultimate:t=>{const d=(o2(t)||{}).d||1.5;tone(t,d,{f:80,f2:640,g:.5,type:'sawtooth',a:d*.3});
      noise(t,d,{f:1400,q:.8,g:.3,a:d*.4});[0,7,12].forEach(s=>tone(t,d,{f:NOTE(82.4,s),g:.1,type:'sawtooth',a:d*.2}))},
    choir:t=>{const d=(o2(t)||{}).d||3;[0,7,12,19].forEach(s=>{tone(t,d,{f:NOTE(110,s),g:.07,type:'sawtooth',a:d*.3,curve:.001})})},
    firework:t=>{tone(t,.7,{f:900,f2:1800,g:.08,type:'sine'});tone(t+.7,.5,{f:150,f2:40,g:.4});noise(t+.68,.5,{f:800,g:.3})},
    pop:t=>tone(t,.1,{f:520,f2:140,g:.35}),
    bite:t=>{tone(t,.14,{f:130,f2:60,g:.5});noise(t,.1,{f:900,g:.3})},
    swipe:t=>noise(t,.3,{f:800,q:2,g:.25,a:.06})};
  function o2(t){return _lastOpts}let _lastOpts={};
  for(const r of F.rounds)for(const b of r.beats)if(b.k==='sfx'){
    const fn=S[b.name];if(!fn)continue;_lastOpts=b.o||{};try{fn(r.t0+b.t)}catch(e){}}
  // ---------- голос ----------
  for(const v of VOICES){const buf=voiceBufs[v.f];if(!buf)continue;
    const src=ac.createBufferSource();src.buffer=buf;
    const gn=ac.createGain();gn.gain.value=1.15;
    src.connect(gn);gn.connect(out);src.start(Math.max(0,v.t))}
  return out;
}

// ============================================================= КАДР
function frame(t){
  const r=roundAt(t);
  const lt=Math.min(t,r.t1-.001)-r.t0;
  runRound(r,Math.min(t,r.t1-.001));
  M3.render();
  // ---- энергия удара: импакты пульсируют кадром
  let hitE=0;
  for(const b of r.beats){
    if(lt>=b.t&&lt<=b.t+b.d){
      if(b.k==='shake')hitE+=.7*b.amp*(1-(lt-b.t)/b.d);
      else if(b.k==='flash')hitE+=.55*(1-(lt-b.t)/b.d);
      else if(b.k==='banner'&&b.big)hitE+=.3*(1-(lt-b.t)/b.d)}}
  hitE=Math.min(1.4,hitE);
  const hype=clamp(F.rounds.indexOf(r)/11);
  const boss=(r.name==='ДЕД'||r.name==='ГАЛАКТИКА'||r.name==='ЗЕМЛЯ');
  // zoom-punch: кадр чуть наезжает на ударе
  const zp=1+Math.min(.055,hitE*.032);
  g.save();g.setTransform(1,0,0,1,0,0);
  g.translate(CX,CY);g.scale(zp,zp);g.drawImage(glc,-CX,-CY);
  g.restore();
  if(window.FX)FX.post(g,t,{bloom:.48+hitE*.5+hype*.06,grain:.06+hype*.025,
    vignette:.46+hype*.15+(boss?.05:0)+hitE*.1,leak:.09+hype*.04,ca:.85+hitE*.75});
  overlay(r,Math.min(t,r.t1-.001));
}

// ============================================================= СТАРТ
const chapters=F.rounds.map(r=>({t:r.t0,title:(r.title==='РАУНД 1'||r.title.includes('РАУНД'))?r.name:r.title}));
window.__MISHA_FRAME=frame;window.__MISHA_SCORE=buildScore;window.__MISHA_PRELOAD=preloadVoices;
window.__MISHA_SETVOICES=(o)=>{voiceBufs=o};
if(window.Player)window.Player.mount({canvas:cv,dur:F.total,chapters,name:'misha-protiv-vsego.webm',
  preload:preloadVoices,
  score:(oac,dest)=>buildScore(oac,dest),
  frame:frame,
  start:21.2});
})();
