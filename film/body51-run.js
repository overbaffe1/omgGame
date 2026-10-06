/* body51-run.js — кадр, звук и запуск мультфильма «Вайбкодер из Мурманска».
   В браузере: Player.mount (перемотка, пауза, запись .webm).
   В Node-рендере: window.__body51.frame(t) — кадр в PNG. */
(function(){
const B=window.B,cv=document.getElementById('c'),g=cv.getContext('2d'),W=1080,H=1920;
const clamp=B.clamp,seg=B.seg,SC=B.SC,TOTAL=B.TOTAL;
const VBUF={};

async function preload(){
  const list=SC.filter(s=>s.narr&&!VBUF[s.narr]);
  if(!list.length||typeof OfflineAudioContext==='undefined')return;
  const dc=new OfflineAudioContext(1,1,44100);
  await Promise.all(list.map(async s=>{
    try{const r=await fetch('body51-voices/'+s.narr+'.mp3',{cache:'no-store'});
      VBUF[s.narr]=await dc.decodeAudioData(await r.arrayBuffer());
    }catch(e){console.warn('нет озвучки',s.narr)}}));
}

function frame(t){
  g.setTransform(1,0,0,1,0,0);
  const sc=B.sceneAt(t),u=clamp((t-sc.start)/sc.dur);
  const draw=B.SCENES[sc.kind]||B.SCENES.polar;
  draw(u,t,sc);
  B.hud(sc,t);
  const d=Math.max(1-seg(t-sc.start,0,.35),seg(t,sc.start+sc.dur-.35,sc.start+sc.dur));
  if(d>0){g.fillStyle=`rgba(4,5,9,${d})`;g.fillRect(0,0,W,H)}
  if(window.FX)FX.post(g,t,{bloom:.13,grain:.05,vignette:.5,leak:.03,ca:.4});
  const fade=Math.max(1-seg(t,0,.9),seg(t,TOTAL-1.5,TOTAL));
  if(fade>0){g.fillStyle=`rgba(4,5,9,${fade})`;g.fillRect(0,0,W,H)}
}

function score(ac,out){
  const T=ac.currentTime+.14;
  const master=(window.FX&&FX.bus)?FX.bus(ac,out):out;
  // — музыка
  const mus=ac.createGain();mus.gain.value=.95;mus.connect(master);
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
  // — голос за кадром (рассказчик), музыка приглушается под репликой
  const V=ac.createGain();V.gain.value=1;V.connect(master);
  for(const s of SC){
    const b=s.narr&&VBUF[s.narr];if(!b)continue;
    const at=T+s.start+.6;
    const src=ac.createBufferSource();src.buffer=b;src.connect(V);src.start(at);
    mus.gain.setTargetAtTime(.35,Math.max(T,at-.2),.09);
    mus.gain.setTargetAtTime(.95,at+b.duration+.15,.35);
  }
}

window.__body51={frame,score,preload,TOTAL,SC};
if(window.Player)Player.mount({
  canvas:cv,frame,score,preload,dur:TOTAL,
  name:'vajbkoder-iz-murmanska.webm',
  chapters:SC.map(s=>({t:s.start,title:s.title})),
  start:9
});
})();
