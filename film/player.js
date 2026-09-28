// player.js — общий плеер с перемоткой для процедурных фильмов.
// Музыка заранее рендерится в AudioBuffer (OfflineAudioContext), поэтому можно
// перематывать в любое место, ставить паузу и записывать видео.
(function(){
const css=`
#pl{position:absolute;left:0;right:0;bottom:0;padding:14px 14px 12px;background:linear-gradient(transparent,rgba(0,0,0,.85));border-radius:0 0 10px 10px;
  font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;transition:opacity .3s;z-index:5;user-select:none}
#pl.hide{opacity:0}
#pl .row{display:flex;align-items:center;gap:10px}
#pl button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;padding:4px 6px;border-radius:6px;line-height:1}
#pl button:hover{background:#ffffff22}
#pl .time{font-variant-numeric:tabular-nums;opacity:.85;min-width:92px}
#pl .sp{flex:1}
#pl .chap{opacity:.8;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
#scrub{position:relative;height:18px;margin-bottom:6px;cursor:pointer}
#scrub .tr{position:absolute;left:0;right:0;top:7px;height:4px;background:#ffffff33;border-radius:2px}
#scrub .fi{position:absolute;left:0;top:7px;height:4px;background:#f4d9a0;border-radius:2px}
#scrub .kn{position:absolute;top:2px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#fff;box-shadow:0 0 6px #0008}
#scrub .mk{position:absolute;top:5px;width:2px;height:8px;background:#000a;margin-left:-1px}
#scrub .tip{position:absolute;bottom:22px;transform:translateX(-50%);background:#000d;padding:3px 8px;border-radius:5px;white-space:nowrap;font-size:12px;display:none}
#scrub:hover .tip{display:block}
#scrub:hover .tr,#scrub:hover .fi{height:6px;top:6px}
#plbig{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:4;cursor:pointer}
#plbig div{width:110px;height:110px;border-radius:50%;background:#000a;border:2px solid #fff8;display:flex;align-items:center;justify-content:center;font-size:44px;color:#fff;padding-left:8px;box-sizing:border-box}
#plmsg{position:absolute;top:14px;left:50%;transform:translateX(-50%);background:#000c;color:#fff;padding:8px 14px;border-radius:20px;font:14px system-ui;z-index:6;display:none}
`;
const fmt=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=Math.floor(s%60);return m+':'+(x<10?'0':'')+x};

window.Player={mount(o){
  const cv=o.canvas,wrap=cv.parentElement;
  document.getElementById('ui')?.remove();document.getElementById('bar')?.remove();
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  wrap.insertAdjacentHTML('beforeend',`<div id="plbig"><div>▶</div></div><div id="plmsg"></div>
   <div id="pl"><div id="scrub"><div class="tr"></div><div class="fi"></div><div class="kn"></div><div class="tip"></div></div>
   <div class="row"><button id="plp" title="Пробел">▶</button><button id="plb" title="←">⏪</button><button id="plf" title="→">⏩</button>
   <span class="time" id="plt">0:00 / ${fmt(o.dur)}</span><span class="chap" id="plc"></span><span class="sp"></span>
   <button id="plr" title="Записать видео с начала">⏺</button><button id="plfs" title="Полный экран (F)">⛶</button></div></div>`);
  const $=id=>document.getElementById(id);
  const scrub=$('scrub'),fi=scrub.querySelector('.fi'),kn=scrub.querySelector('.kn'),tip=scrub.querySelector('.tip');
  (o.chapters||[]).forEach(c=>{if(c.t<=0)return;const m=document.createElement('div');m.className='mk';m.style.left=(c.t/o.dur*100)+'%';scrub.appendChild(m)});
  const chapAt=t=>{let r=null;for(const c of o.chapters||[])if(t>=c.t)r=c;return r};

  let ac,buf,src,out,startAt=0,offset=+(new URLSearchParams(location.search).get('t'))||0,poster=offset?null:o.start,playing=false,rec=null,rendering=null,dirty=true;
  const msg=(s)=>{$('plmsg').textContent=s;$('plmsg').style.display=s?'block':'none'};
  async function prepare(){
    if(buf)return;if(rendering)return rendering;
    rendering=(async()=>{msg('Готовлю звук…');
      const sr=44100,oac=new OfflineAudioContext(2,Math.ceil(sr*(o.dur+1)),sr);
      o.score(oac,window.FX?FX.bus(oac,oac.destination):oac.destination);
      buf=await oac.startRendering();
      if(o.beforePlay){msg('Готовлю 3D…');await new Promise(r=>setTimeout(r,30));o.beforePlay()}
      msg('')})();
    rendering.catch(()=>{rendering=null});
    return rendering}
  let useAudioClock=false;const now=()=>useAudioClock?ac.currentTime:performance.now()/1000;
  const time=()=>playing?Math.max(0,Math.min(o.dur,offset+now()-startAt)):offset;
  // аудио создаём/будим синхронно, прямо в клике — иначе браузер оставит его «спящим»
  function unlock(){if(!ac){ac=new AudioContext();out=ac.createGain();out.connect(ac.destination)}if(ac.state!=='running')ac.resume();}
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
  let starting=false;
  async function play(){
    if(starting||playing)return;starting=true;poster=null;unlock();
    try{await prepare()}catch(e){starting=false;rendering=null;msg('Ошибка звука: '+e.message);return}
    if(ac.state!=='running'){try{await Promise.race([ac.resume(),new Promise(r=>setTimeout(r,800))])}catch(e){}}
    starting=false;useAudioClock=ac.state==='running';
    if(offset>=o.dur-.05)offset=0;
    src=ac.createBufferSource();src.buffer=buf;src.connect(out);src.start(ac.currentTime+.05,offset);startAt=now()+.05;
    playing=true;$('plp').textContent='⏸';$('plbig').style.display='none'}
  function pause(){if(!playing)return;offset=time();try{src.stop()}catch(e){}playing=false;$('plp').textContent='▶';dirty=true;
    if(rec){rec.stop();rec=null;msg('')}}
  function seek(t){poster=null;t=Math.max(0,Math.min(o.dur,t));const was=playing;if(playing){try{src.stop()}catch(e){}playing=false}offset=t;dirty=true;if(was)play()}
  const toggle=()=>playing?pause():play();
  $('plp').onclick=toggle;$('plbig').onclick=toggle;cv.onclick=toggle;
  $('plb').onclick=()=>seek(time()-5);$('plf').onclick=()=>seek(time()+5);
  $('plfs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():wrap.requestFullscreen?.()};
  $('plr').onclick=async()=>{await prepare();if(!ac){ac=new AudioContext();out=ac.createGain();out.connect(ac.destination)}
    pause();const md=ac.createMediaStreamDestination();out.connect(md);rec=window.FX?FX.recorder(cv,md.stream,o.name||'film.webm'):null;
    if(!rec)return;const r=rec;r.addEventListener('stop',()=>{try{out.disconnect(md)}catch(e){}});seek(0);r.start();msg('● Запись… досмотри до конца');await play()};
  // перемотка мышью/пальцем
  const posT=e=>{const r=scrub.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;return Math.max(0,Math.min(1,x/r.width))*o.dur};
  let drag=false,wasPlaying=false;
  const down=e=>{poster=null;drag=true;wasPlaying=playing;if(playing)pause();offset=posT(e);dirty=true;e.preventDefault()};
  scrub.addEventListener('mousedown',down);scrub.addEventListener('touchstart',down,{passive:false});
  addEventListener('mousemove',e=>{const r=scrub.getBoundingClientRect();if(e.clientY>r.top-30&&e.clientY<r.bottom+10){const t=posT(e);const c=chapAt(t);tip.textContent=fmt(t)+(c?' · '+c.title:'');tip.style.left=((t/o.dur)*100)+'%'}
    if(drag){offset=posT(e);dirty=true}});
  addEventListener('touchmove',e=>{if(drag){offset=posT(e);dirty=true}},{passive:true});
  const up=()=>{if(drag){drag=false;if(wasPlaying)play()}};addEventListener('mouseup',up);addEventListener('touchend',up);
  addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle()}else if(e.code==='ArrowLeft')seek(time()-5);else if(e.code==='ArrowRight')seek(time()+5);
    else if(e.code==='KeyF')$('plfs').onclick();else if(e.code==='Home')seek(0);
    else if(o.chapters&&(e.code==='PageDown'||e.code==='KeyN')){const t=time();const n=o.chapters.find(c=>c.t>t+.5);if(n)seek(n.t)}
    else if(o.chapters&&(e.code==='PageUp'||e.code==='KeyP')){const t=time();const p=[...o.chapters].reverse().find(c=>c.t<t-1.5);seek(p?p.t:0)}});
  // автоскрытие панели
  let idle=0;const wake=()=>{idle=performance.now();$('pl').classList.remove('hide')};addEventListener('mousemove',wake);addEventListener('touchstart',wake);addEventListener('keydown',wake);
  // сообщения от галереи
  addEventListener('message',e=>{const d=e.data||{};if(d.cmd==='pause')pause();if(d.cmd==='play')play()});
  // цикл
  (function loop(){const t=time();
    if(playing||dirty){o.frame(poster!=null&&!playing&&t===0?poster:t);dirty=false}
    if(playing&&t>=o.dur){pause();offset=o.dur}
    const k=t/o.dur*100;fi.style.width=k+'%';kn.style.left=k+'%';$('plt').textContent=fmt(t)+' / '+fmt(o.dur);
    const c=chapAt(t);$('plc').textContent=c?c.title:'';
    if(playing&&performance.now()-idle>2500&&!drag)$('pl').classList.add('hide');
    requestAnimationFrame(loop)})();
  // звук готовим заранее, чтобы старт был мгновенным
  setTimeout(()=>prepare().catch(e=>{console.error(e);msg('Ошибка звука: '+e.message)}),300);
}};
})();
