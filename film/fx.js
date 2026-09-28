// fx.js — общий «киношный» пост-процесс и мастеринг звука для всех фильмов.
// Свечение (bloom), хроматическая аберрация, плёночное зерно, засветы, виньетка,
// мастер-шина со стерео-расширением, компрессией и лимитером, запись в высоком битрейте.
(function(){
const FX={};
let small,sg,grain=[],ca;
function init(cv){
  if(small)return;
  small=document.createElement('canvas');small.width=cv.width/4;small.height=cv.height/4;sg=small.getContext('2d');
  ca=document.createElement('canvas');ca.width=cv.width/2;ca.height=cv.height/2;
  for(let k=0;k<4;k++){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),d=x.createImageData(256,256);
    for(let i=0;i<d.data.length;i+=4){const v=128+(Math.random()+Math.random()+Math.random()-1.5)*110;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
    x.putImageData(d,0,0);grain.push(c)}
}
// o: {bloom, grain, vignette, leak, ca, warm}
FX.post=function(g,t,o={}){
  const cv=g.canvas,W=cv.width,H=cv.height;init(cv);
  const O=Object.assign({bloom:.55,grain:.07,vignette:.55,leak:.12,ca:1,warm:0},o);
  g.save();g.setTransform(1,0,0,1,0,0);
  // bloom: яркие участки размываются и добавляются сверху
  if(O.bloom>0){sg.globalCompositeOperation='copy';sg.filter='contrast(1.9) brightness(.85) saturate(1.3) blur(10px)';sg.drawImage(cv,0,0,small.width,small.height);sg.filter='none';
    g.globalCompositeOperation='screen';g.globalAlpha=O.bloom;g.drawImage(small,0,0,W,H);
    g.globalAlpha=O.bloom*.5;g.filter='blur(30px)';g.drawImage(small,0,0,W,H);g.filter='none'}
  // хроматическая аберрация по краям
  if(O.ca>0){const cx=ca.getContext('2d');cx.globalCompositeOperation='copy';cx.drawImage(cv,0,0,ca.width,ca.height);
    cx.globalCompositeOperation='multiply';cx.fillStyle='#f00';cx.fillRect(0,0,ca.width,ca.height);
    g.globalCompositeOperation='lighter';g.globalAlpha=.12*O.ca;const s=6*O.ca;g.drawImage(ca,-s,-s*.6,W+s*2,H+s*1.2);
    cx.globalCompositeOperation='copy';cx.drawImage(cv,0,0,ca.width,ca.height);cx.globalCompositeOperation='multiply';cx.fillStyle='#00f';cx.fillRect(0,0,ca.width,ca.height);
    g.globalCompositeOperation='screen';g.globalAlpha=.08*O.ca;g.drawImage(ca,s,s*.6,W-s*2,H-s*1.2)}
  // засветы плёнки
  if(O.leak>0){g.globalCompositeOperation='screen';g.globalAlpha=1;
    const lx=W*(.5+.6*Math.sin(t*.13)),ly=H*(.3+.4*Math.sin(t*.09+1));const gr=g.createRadialGradient(lx,ly,0,lx,ly,W*.9);
    gr.addColorStop(0,`rgba(255,${150+60*Math.sin(t*.2)|0},90,${O.leak})`);gr.addColorStop(1,'rgba(255,120,60,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
  if(O.warm){g.globalCompositeOperation='soft-light';g.globalAlpha=O.warm;g.fillStyle='#ff9a40';g.fillRect(0,0,W,H)}
  // виньетка
  g.globalCompositeOperation='source-over';g.globalAlpha=1;
  const v=g.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,H*.78);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${O.vignette})`);g.fillStyle=v;g.fillRect(0,0,W,H);
  // зерно
  if(O.grain>0){g.globalCompositeOperation='overlay';g.globalAlpha=O.grain*2.2;const p=g.createPattern(grain[(t*24|0)%4],'repeat');
    g.translate(Math.random()*256,Math.random()*256);g.fillStyle=p;g.fillRect(-256,-256,W+512,H+512)}
  g.restore();
};
// Мастер-шина: HP → «воздух» → стерео-ширина → компрессор → лимитер
FX.bus=function(ac,out){
  const inp=ac.createGain();
  const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=28;
  const air=ac.createBiquadFilter();air.type='highshelf';air.frequency.value=9000;air.gain.value=3;
  const low=ac.createBiquadFilter();low.type='lowshelf';low.frequency.value=90;low.gain.value=3;
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=3;comp.attack.value=.01;comp.release.value=.25;comp.knee.value=10;
  const lim=ac.createDynamicsCompressor();lim.threshold.value=-3;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.1;lim.knee.value=0;
  const mk=ac.createGain();mk.gain.value=1.25;
  inp.connect(hp);hp.connect(low);low.connect(air);air.connect(comp);
  // стерео-расширение: задержки Хааса на разных каналах
  const mg=ac.createChannelMerger(2);
  [[.011,0],[.017,1]].forEach(([d,ch])=>{const dl=ac.createDelay(.05);dl.delayTime.value=d;const gg=ac.createGain();gg.gain.value=.35;air.connect(dl);dl.connect(gg);gg.connect(mg,0,ch)});
  mg.connect(comp);
  comp.connect(lim);lim.connect(mk);mk.connect(out);
  return inp;
};
// Панорама для отдельных голосов
FX.pan=(ac,node,p)=>{if(!ac.createStereoPanner)return node;const s=ac.createStereoPanner();s.pan.value=p;s.connect(node);return s};
// Запись: VP9, 60 fps, высокий битрейт
FX.recorder=function(cv,audioStream,name){
  const types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mimeType=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t))||'video/webm';
  const rec=new MediaRecorder(new MediaStream([...cv.captureStream(60).getVideoTracks(),...audioStream.getAudioTracks()]),{mimeType,videoBitsPerSecond:24e6,audioBitsPerSecond:256e3});
  const ch=[];rec.ondataavailable=e=>e.data.size&&ch.push(e.data);
  rec.onstop=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(ch,{type:'video/webm'}));a.download=name;a.click()};
  return rec;
};
window.FX=FX;
})();
