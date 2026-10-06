/* body51-score.js — партитура мультфильма «Вайбкодер из Мурманска».
   Чистая математика: возвращает список нот. Используется и браузером (Web Audio),
   и офлайн-рендером фильма (Node) — поэтому звук в MP4 и в плеере одинаковый. */
(function(){
const hz=n=>440*Math.pow(2,(n-69)/12);
window.BODY51_SCORE=function(SC,TOTAL){
  const E=[];
  const bar=4*(60/82);                                   // 82 уд/мин, такт 4/4
  const prog=[[57,60,64,67],[53,57,60,64],[48,55,64,67],[55,59,62,66]]; // Am7 · Fmaj7 · C · G
  const add=(o)=>E.push(o);
  const pad  =(n,at,dur,vol)=>add({at,dur,f:hz(n),vol,type:'sine',attack:Math.min(1.3,dur*.4)});
  const soft =(n,at,dur,vol)=>add({at,dur,f:hz(n),vol,type:'triangle',attack:Math.min(1.3,dur*.4)});
  const pluck=(n,at,dur,vol)=>add({at,dur,f:hz(n),vol,type:'triangle',attack:.012});
  const bass =(n,at,dur,vol)=>add({at,dur,f:hz(n),vol,type:'sine',attack:.06});
  const bell =(n,at,vol,dur=2.6)=>add({at,dur,f:hz(n),vol,type:'sine',attack:.01});
  // — основа: пэд, бас, арпеджио, редкие колокольчики
  for(let b=0;b*bar<TOTAL-1.5;b++){
    const ch=prog[Math.floor(b/2)%4],t0=b*bar;
    ch.forEach((n,i)=>pad(n,t0,bar*1.95,i?.028:.040));
    bass(ch[0]-24,t0,bar*1.75,.055);
    [0,2,1,3,1,2].forEach((k,i)=>pluck(ch[k]+12,t0+i*bar/6,bar*.5,.020));
    if(b%4===1)bell(ch[2]+24,t0+bar*.5,.014);
    if(b%8===7)bell(ch[0]+19,t0+bar*.3,.012,3.4);
  }
  const at=id=>{const s=SC.find(x=>x.id===id);return s?s.start:0};
  const scene=(id)=>SC.find(x=>x.id===id);
  // — заставка: северное сияние, стеклянные пинг-понги
  for(let k=0;k<7;k++)bell(84+(k%3)*5,k*.85,.011,2.2);
  // — кот: игривые короткие ноты
  {const s=scene('cat');if(s)for(let k=0;k<9;k++)pluck(76+[0,4,7,4,9,7,4,0,4][k],s.start+1.2+k*.75,.5,.020)}
  // — мастерская: механический пульс
  {const s=scene('workshop');if(s)for(let k=0;k<34;k++)add({at:s.start+1+k*.75,dur:.09,f:hz(40),vol:.030,type:'square',attack:.005})}
  // — стрим: тёплое приветствие
  {const s=scene('stream');if(s){[64,67,71,74].forEach((n,i)=>bell(n,s.start+1.4+i*.22,.016,2.4))}}
  // — караван: восточные ноты в «фрigийском» ладу
  {const s=scene('caravan');if(s)for(let k=0;k<14;k++)pluck(53+[0,1,4,5,7,8,11][k%7],s.start+1+k*.62,.7,.018)}
  // — лимиты: счётчик тикает
  {const s=scene('limits');if(s)for(let k=0;k<40;k++)add({at:s.start+1+k*.42,dur:.07,f:hz(96+ (k%2)*7),vol:.014,type:'sine',attack:.004})}
  // — гэг: комичные «пики»
  {const s=scene('gag');if(s){[0,1,2].forEach(i=>{add({at:s.start+i*s.dur/3+.1,dur:.5,f:hz(74),vol:.030,type:'sawtooth',attack:.02});add({at:s.start+i*s.dur/3+.35,dur:.3,f:hz(69),vol:.022,type:'square',attack:.01})})}}
  // — выгорание: низкий гул и сердцебиение
  {const s=scene('burnout');if(s){add({at:s.start,dur:9,f:hz(33),vol:.055,type:'sine',attack:1.4});
    for(let k=0;k<9;k++){add({at:s.start+1.2+k*1.1,dur:.22,f:hz(45),vol:.045,type:'sine',attack:.01})}
    add({at:s.start+s.dur*.5,dur:6,f:hz(38),vol:.050,type:'sine',attack:.6})}}
  // — релиз: восходящее арпеджио и фанфара
  {const s=scene('release');if(s){[60,64,67,72,76,79].forEach((n,i)=>bell(n,s.start+1.1+i*.16,.020,2.0));
    [72,76,79,84].forEach((n,i)=>bell(n,s.start+s.dur*.36+i*.13,.024,2.6))}}
  // — вишлисты: рост и тревога календаря
  {const s=scene('wishlist');if(s){[65,69,72,77].forEach((n,i)=>pluck(n,s.start+1+i*.4,.9,.020));
    for(let k=0;k<12;k++)add({at:s.start+s.dur*.34+k*.24,dur:.2,f:hz(90+k%3*4),vol:.016,type:'square',attack:.005});
    [67,71,74,79].forEach((n,i)=>bell(n,s.start+s.dur*.6+i*.14,.018,2.4))}}
  // — финал: тёплый аккорд и мягкое завершение
  {const s=scene('finale');if(s){[57,64,69,72].forEach((n,i)=>soft(n,s.start+2+i*.5,5.5,.036));
    [60,64,67,72].forEach((n,i)=>bell(n,s.start+s.dur*.62+i*.2,.020,3.2))}}
  {const s=scene('credits');if(s){[48,55,60,64,67].forEach((n,i)=>pad(n,s.start+.6,7,.030));bell(72,s.start+2.2,.014,4)}}
  return E;
};
})();
