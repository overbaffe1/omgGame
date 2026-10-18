// misha-rounds.js — сценарий фильма «МИША ПРОТИВ ВСЕГО»: 12 сцен, ~5 минут.
// Все биты — с абсолютным временем фильма; каждый кадр — чистая функция t.
(function(){
const M3=window.M3,U=M3.utils;
const {clamp,lerp,seg,easeOut,easeIn,easeIO,smooth,TAU}=U;

// ---------- конструкторы битов ----------
const B={
  pose:(t,d,move,o)=>({k:'pose',t,d,move,o}),
  mmove:(t,d,to,e)=>({k:'mmove',t,d,to,e:e||'io'}),
  eact:(t,d,fn,who,o)=>({k:'eact',t,d,fn,who:who||0,o}),
  emove:(t,d,to,who,e)=>({k:'emove',t,d,to,who:who||0,e:e||'io'}),
  eRy:(t,d,ry,who)=>({k:'eRy',t,d,ry,who:who||0}),
  burst:(t,at,o)=>({k:'burst',t,d:(o&&o.d)||.6,at,n:(o&&o.n)||30,c:(o&&o.c)||'#ffd24a',sp:(o&&o.sp)||3,up:(o&&o.up)||1.2,floor:(o&&o.floor)}),
  ring:(t,at,o)=>({k:'ring',t,d:(o&&o.d)||.5,at,r0:(o&&o.r0)||.2,r1:(o&&o.r1)||3.5,c:(o&&o.c)||'#ffffff',v:(o&&o.v)||'ground',a:(o&&o.a)||.8}),
  flash:(t,c,d)=>({k:'flash',t,d:d||.35,c:c||'#fff'}),
  shake:(t,d,amp)=>({k:'shake',t,d,amp:amp||.2}),
  dmg:(t,at,n,big)=>({k:'dmg',t,d:1.15,at,n,big}),
  sub:(t,d,who,text)=>({k:'sub',t,d,who,text}),
  hp:(t,v)=>({k:'hp',t,v}),
  combo:(t,n)=>({k:'combo',t,n}),
  sfx:(t,name,o)=>({k:'sfx',t,name,o:o||{}}),
  proj:(t,d,kind,from,to,o)=>({k:'proj',t,d,kind,from,to,arc:(o&&o.arc)||1.2,spin:(o&&o.spin)||12}),
  banner:(t,d,text,style)=>({k:'banner',t,d,text,style}),
  cardT:(t,d)=>({k:'cardT',t,d})
};
window.MB=B;

// ---------- трек перемещений ----------
function moveAt(list,t,def){
  let cur=def,active=null;
  for(const m of list){if(t>=m.t+m.d)cur=m.to;else if(t>=m.t){active=m;break}}
  if(!active)return cur;
  const k=clamp((t-active.t)/active.d),e=active.e==='out'?easeOut(k):active.e==='lin'?k:easeIO(k);
  const p=prevTo(list,active,def);
  return[lerp(p[0],active.to[0],e),lerp(p[1]||0,active.to[1]||0,e),lerp(p[2],active.to[2]||0,e)]}
function prevTo(list,m,def){let cur=def;for(const x of list){if(x===m)break;if(m.t>=x.t+x.d)cur=x.to}return cur}

// ---------- акторы ----------
let AC=null;
function buildActors(){
  AC={
    misha:M3.buildMisha(),
    bacteria:M3.buildBacteria(),
    param:[0,1,2,3,4].map(i=>M3.buildParamecium(i+1)),
    roach:M3.buildRoach(),
    cat:M3.buildCat(),
    geese:[M3.buildGoose(0),M3.buildGoose(1),M3.buildGoose(2)],
    bear:M3.buildBear(),
    gopnik:M3.buildGopnik(),
    trex:M3.buildTRex(),
    ded:M3.buildDed(),
    earth:M3.buildEarth(),
    galaxy:M3.buildGalaxy(),
    pot:null
  };
  // кастрюля-реквизит для финала с дедом
  const g=new window.THREE.Group();
  const pb=M3.prims.cyl(.5,.42,.6,'#8a8f99',null,14);pb.position.y=.3;g.add(pb);
  const soup=new window.THREE.Mesh(new window.THREE.CircleGeometry(.44,20),M3.mat('#e8963c',{emissive:.5}));
  soup.rotation.x=-Math.PI/2;soup.position.y=.62;g.add(soup);
  const st=M3.glowSprite('#ffb35a',1.6,.5);st.position.y=.9;g.add(st);
  AC.pot={g,kind:'pot'};
  for(const key in AC){const v=AC[key];
    if(Array.isArray(v))v.forEach(x=>{x.g.visible=false;M3.scene.add(x.g)});
    else if(v&&v.g){v.g.visible=false;M3.scene.add(v.g)}}
}
window.MACTORS=()=>{if(!AC)buildActors();return AC};

// ---------- раунды ----------
const FILM={rounds:[],total:0};
const R=[];
const def=(name,title,note,world,dur,o)=>({name,title,note,world,dur,beats:[],shots:[],meta:o||{}});
// стандартный вход Миши + карта раунда
function entrance(r,tt,from,to){
  r.shots.push({t:tt,d:2.6,orbit:{c:[0,1.2,.5],r:7.5,a0:2.4,a1:1.62,y:2.2},l:[0,1.2,.5],fov:46});
  r.beats.push(B.mmove(tt,1.1,from));
  r.beats.push(B.mmove(tt+1.15,.9,to));
  r.beats.push(B.sfx(tt+.05,'whoosh',{d:1}));
  r.beats.push(B.cardT(tt,2.4));
  r.beats.push(B.sfx(tt+.1,'bell'));
  r.beats.push(B.sfx(tt+.2,'impact'));
}
// комбо-серия
function combo(r,t0,hits){
  hits.forEach((h,i)=>{const t=t0+i*(h.dt||.42);
    r.beats.push(B.pose(t,h.d||.45,h.m,h.o));
    r.beats.push(B.sfx(t+(h.hit||.14),h.big?'punchBig':'punch'));
    if(h.at){r.beats.push(B.burst(t+(h.hit||.14),h.at,{n:h.big?70:30,c:h.c||'#ffd24a',sp:h.big?5.5:3.2,floor:.05}));
      r.beats.push(B.dmg(t+(h.hit||.14),h.at,h.n||String(10+i*7),h.big))}
    if(h.n2!==false)r.beats.push(B.combo(t,i+ (h.cn||1)));
    if(h.hurt)r.beats.push(B.eact(t+(h.hit||.14),.4,'hurt',h.who||0));
    if(h.shk)r.beats.push(B.shake(t+(h.hit||.14),.3,h.shk))});
}
function enemyHP(r,t0,steps){let v=100;const n=steps.length;
  steps.forEach((s,i)=>{v-=s;r.beats.push(B.hp(t0+i*0.001+ (s.t!==undefined?s.t:0),Math.max(0,v)))})}

const R0=def('СУП','МИША ПРОТИВ ВСЕГО','варка супа · пролог','kitchen',14,{bpm:120,style:'calm',root:41.2});
const R1=def('БАКТЕРИЯ','РАУНД 1','размер: 2 мкм (в своём мире — 2 метра)','micro',30,{bpm:138,style:'phonk',root:41.2,enemy:'БАКТЕРИЯ + РОЙ'});
const R2=def('ТАРАКАН','РАУНД 2','скорость: быстрее твоей реакции','kitchen',26,{bpm:144,style:'phonk',root:43.65,enemy:'ТАРАКАН'});
const R3=def('КОТ','РАУНД 3','9 жизней (спойлер: не хватит)','yard',26,{bpm:148,style:'phonk',root:46.25,enemy:'КОТ'});
const R4=def('ГУСЬ','РАУНД 4','угроза: максимальная','park',26,{bpm:152,style:'phonk',root:49,enemy:'ГУСЬ + ПОДКРЕПЛЕНИЕ'});
const R5=def('МЕДВЕДЬ','РАУНД 5','вес: 400 кг чистой наглости','forest',26,{bpm:156,style:'hard',root:41.2,enemy:'МЕДВЕДЬ'});
const R6=def('ГОПНИК','РАУНД 6','приседания: 10 000','stadium',28,{bpm:160,style:'hard',root:44,enemy:'ГОПНИК'});
const R7=def('ТИ-РЕКС','РАУНД 7','вымер. скоро — снова','stadium',30,{bpm:164,style:'hard',root:46.25,enemy:'ТИ-РЕКС'});
const R8=def('ДЕД','МЕГА БОСС','уровень: МЕГА БОСС · стаж: 70+','dacha',36,{bpm:172,style:'ded',root:38.9,enemy:'ДЕД'});
const R9=def('ЗЕМЛЯ','РАУНД 9','жалоб нет','space',24,{bpm:140,style:'epic',root:36.7,enemy:'ПЛАНЕТА ЗЕМЛЯ'});
const R10=def('ГАЛАКТИКА','ФИНАЛЬНЫЙ РАУНД','100 000 световых лет','galaxyW',26,{bpm:174,style:'final',root:41.2,enemy:'ГАЛАКТИКА'});
const RF=def('ФИНАЛ','ЧЕМПИОН ВСЕЛЕННОЙ','подписывайся, бро','finale',10,{bpm:140,style:'anthem',root:41.2});
R.push(R0,R1,R2,R3,R4,R5,R6,R7,R8,R9,R10,RF);

// ============================================================= ПРОЛОГ: КУХНЯ
(function(){
  const r=R0;
  r.mishaDef=[-.7,0,-1.6];r.enemyDef=[[0,1.45,-3.2]];r.actors=['misha','bacteria'];
  r.shots.push({t:0,d:4.2,p:[3.4,2.1,2.6],l:[0,1.5,-3],fov:44,e:'io'});
  r.shots.push({t:4.2,d:4.4,p:[-2.6,1.9,1.4],l:[0,1.6,-3],fov:40,e:'out'});
  r.shots.push({t:8.6,d:5.4,orbit:{c:[0,1.4,-1],r:5,a0:3.5,a1:5.6,y:2.4},l:[0,1.3,-1],fov:46});
  r.beats.push(B.sub(0.6,3.2,'nar','ОМГ ГЕЙМ ПРЕДСТАВЛЯЕТ'));
  r.beats.push(B.sub(4.4,3.8,'nar','МИША ПРОТИВ ВСЕГО'));
  r.beats.push(B.sfx(4.4,'impact'));r.beats.push(B.flash(4.4,'#fff',.5));r.beats.push(B.shake(4.4,.5,.25));
  r.beats.push(B.pose(0,8.5,'stir'));
  r.beats.push(B.sub(8.8,4.6,'nar','Миша наварил суп. Но в супе кто-то жил…'));
  // бактерия выпрыгивает из кастрюли
  r.beats.push(B.burst(9.2,[0,1.6,-3],{n:40,c:'#b8f09a',sp:3,d:.8}));
  r.beats.push(B.sfx(9.2,'pop'));
  r.beats.push(B.emove(9.2,1.3,[1.1,0,.4],0,'out')); // приземлилась
  r.beats.push(B.eact(10.6,1.6,'attack',0));
  r.beats.push(B.sub(10.8,2.6,'e','— Я ЖИВУ В ТВОЁМ СУПЕ. ЧЁ ТЫ.'));
  r.beats.push(B.sfx(10.8,'blip'));
  r.beats.push(B.pose(10.4,1.4,'point'));
  r.beats.push(B.sub(12.4,1.6,'m','— Так. Значит, ты кто?'));
  r.beats.push(B.flash(13.6,'#9fe8c8',.4));
  r.beats.push(B.sfx(13.6,'riser',{d:1}));
})();

// ============================================================= РАУНД 1: МИКРОМИР
(function(){
  const r=R1;
  r.mishaDef=[-1.6,0,.5];r.enemyDef=[[1.6,0,.5],[1.2,-2,.9],[.5,-2,.55],[-.2,-2,.2],[-.9,-2,-.15],[-1.6,-2,-.5]];r.actors=['misha','bacteria','param'];
  entrance(r,0,[-5,0,.5],[-1.6,0,.5]);
  r.shots.push({t:2.6,d:2.2,p:[2.6,1.2,3.2],l:[1.6,.9,.5],fov:42,e:'out'});
  r.shots.push({t:4.8,d:3.6,p:[-1,1.7,3.4],l:[0,1.1,.5],fov:44});
  r.shots.push({t:8.4,d:2.2,p:[2.2,.8,-1.6],l:[0,1,.5],fov:48});
  r.shots.push({t:10.6,d:4.6,p:[-2.4,1.1,2.6],l:[-.8,1,.5],fov:40,e:'io'});
  r.shots.push({t:15.2,d:2.6,orbit:{c:[0,1,.5],r:5,a0:1.9,a1:2.5,y:1.6},l:[0,1,.5],fov:46});
  r.shots.push({t:17.8,d:4.2,p:[3.4,1.5,2.2],l:[1.4,.8,.5],fov:44});
  r.shots.push({t:22,d:3.2,p:[-2.8,1,3],l:[-.6,1.2,.5],fov:42});
  r.shots.push({t:25.2,d:4.8,orbit:{c:[0,1.2,.5],r:6.4,a0:2.2,a1:4.4,y:2.6},l:[0,1.2,.5],fov:40});
  r.beats.push(B.sub(2.7,3.4,'nar','Микромир! Бактерия против Миши.'));
  r.beats.push(B.eact(3,.6,'attack',0));
  r.beats.push(B.sfx(3,'blip'));
  // «НАДЕЛ НОГОЙ» — 6.2
  r.beats.push(B.sub(6.0,3.2,'m','— Миша даже не вспотел.'));
  r.beats.push(B.pose(6.2,4.2,'stomp'));
  r.beats.push(B.sfx(6.4,'whoosh',{d:.8}));
  r.beats.push(B.sfx(8.35,'stomp'));
  r.beats.push(B.burst(8.35,[1.35,.3,.5],{n:50,c:'#7ed957',sp:4}));
  r.beats.push(B.ring(8.35,[1.35,.05,.5],{r1:3,c:'#b8f09a'}));
  r.beats.push(B.shake(8.35,.5,.35));
  r.beats.push(B.flash(8.35,'#d8ffc8',.3));
  r.beats.push(B.eact(8.3,1.0,'hurt',0));
  r.beats.push(B.dmg(8.4,[1.35,.9,.5],'100',true));
  r.beats.push(B.hp(8.4,0));
  r.beats.push(B.banner(8.6,2.4,'НАДЕЛ НОГОЙ'));
  r.beats.push(B.sfx(8.6,'koSlam'));
  r.beats.push(B.eact(9.4,20,'ko',0));
  r.beats.push(B.sub(10.8,3.4,'e','— это нечестно…'));
  // рой инфузорий
  for(let i=0;i<5;i++){r.beats.push(B.emove(13.2+i*.5,.9,[1.2-i*.7,0,.9-i*.35],i+1));r.beats.push(B.eact(13.2+i*.5,26-i,'idle',i+1))}
  r.beats.push(B.sub(13.4,3.2,'nar','Инфузории-туфельки! Целый рой!'));
  r.beats.push(B.sfx(13.2,'swarm'));
  r.beats.push(B.mmove(15.2,.5,[-.5,0,.4]));
  combo(r,15.6,[
    {m:'jab',at:[.3,1.1,.45],n:'33',cn:1},
    {m:'cross',at:[.2,1.1,.5],n:'66',cn:2},
    {m:'jab',at:[.1,1,.5],n:'99',cn:3},
    {m:'hook',at:[.4,1,.5],n:'100',cn:4,big:true}]);
  [0,1,2,3].forEach(i=>{r.beats.push(B.eact(15.74+i*.42,.5,'hurt',i+1))});
  r.beats.push(B.hp(17.3,25));
  // финиш: вертушка — все улетают
  r.beats.push(B.sub(20.6,2.4,'m','— Разбежались!'));
  r.beats.push(B.pose(21.8,1.5,'roundhouse'));
  r.beats.push(B.sfx(22.0,'whoosh',{d:.6}));
  r.beats.push(B.sfx(22.5,'punchBig'));
  r.beats.push(B.burst(22.5,[.6,1,.5],{n:80,c:'#ffd24a',sp:6}));
  r.beats.push(B.ring(22.5,[.6,.05,.5],{r1:4.5,c:'#ffd24a'}));
  r.beats.push(B.shake(22.5,.6,.4));
  r.beats.push(B.flash(22.5,'#fff',.25));
  for(let i=0;i<5;i++){r.beats.push(B.eact(22.5,30-i*0.5,'ko',i+1))}
  r.beats.push(B.banner(22.7,2.4,'ВЕРТУШКА'));
  r.beats.push(B.sfx(22.7,'koSlam'));
  r.beats.push(B.pose(24.4,5,'winJump'));
  r.beats.push(B.sub(24.6,3.0,'nar','Бактерии повержены. Это было легко.'));
  r.beats.push(B.sfx(29.4,'riser',{d:.9}));
  r.beats.push(B.flash(29.7,'#fff',.35));
})();

// ============================================================= РАУНД 2: ТАРАКАН
(function(){
  const r=R2;
  r.mishaDef=[-1.5,0,.8];r.enemyDef=[[1.6,0,.8]];r.actors=['misha','roach'];
  entrance(r,0,[-5,0,.8],[-1.5,0,.8]);
  r.shots.push({t:2.6,d:2.4,p:[1.2,.7,2.9],l:[1.6,.45,.8],fov:40,e:'out'});
  r.shots.push({t:5,d:3,p:[-2.6,1.6,3.2],l:[0,1,.8],fov:44});
  r.shots.push({t:8,d:2.4,p:[2.4,.6,2.2],l:[0,.8,.8],fov:48});
  r.shots.push({t:10.4,d:3.4,orbit:{c:[0,.9,.8],r:5.5,a0:1.8,a1:2.6,y:1.7},l:[0,.9,.8],fov:44});
  r.shots.push({t:13.8,d:2.6,p:[-3,1.2,3],l:[-.4,1,.8],fov:42});
  r.shots.push({t:16.4,d:2.8,p:[0,2.4,4.2],l:[0,.9,.8],fov:46});
  r.shots.push({t:19.2,d:3.2,p:[-1.8,1.1,2.6],l:[.6,1,.8],fov:44});
  r.shots.push({t:22.4,d:3.6,orbit:{c:[0,1,.8],r:6.5,a0:2.3,a1:4.2,y:2.4},l:[0,1,.8],fov:40});
  r.beats.push(B.sub(2.7,3,'nar','Таракан! Быстрый. Наглый. Домашний.'));
  r.beats.push(B.eact(3.2,1,'attack',0));r.beats.push(B.sfx(3.4,'skitter'));
  r.beats.push(B.sub(4.6,2.6,'e','— Ты медленный, человек.'));
  // таракан атакует — Миша уклоняется
  r.beats.push(B.eact(6,1,'attack',0));r.beats.push(B.sfx(6.2,'skitter'));
  r.beats.push(B.pose(6.1,.7,'dodge',{dir:-1}));r.beats.push(B.sfx(6.25,'whoosh',{d:.4}));
  r.beats.push(B.dmg(6.5,[-1.5,1.6,.8],'-0'));
  r.beats.push(B.sub(7.2,2.2,'m','— Мимо, усатый.'));
  r.beats.push(B.eact(8.6,1,'attack',0));r.beats.push(B.sfx(8.8,'skitter'));
  r.beats.push(B.pose(8.7,.7,'dodge',{dir:1}));r.beats.push(B.sfx(8.85,'whoosh',{d:.4}));
  r.beats.push(B.dmg(9.1,[-1.5,1.6,.8],'-0'));
  r.beats.push(B.mmove(10.2,.5,[.6,0,.8]));
  combo(r,10.6,[{m:'jab',at:[1.3,.8,.8],n:'28'},{m:'cross',at:[1.2,.9,.8],n:'57',big:true}]);
  r.beats.push(B.eact(10.74,.5,'hurt',0));r.beats.push(B.eact(11.16,.5,'hurt',0));
  r.beats.push(B.hp(11.6,38));
  r.beats.push(B.sub(12.6,2.4,'m','— Куда бежишь? Кухня маленькая.'));
  r.beats.push(B.emove(13.8,.9,[2.6,0,-.4],0,'out'));r.beats.push(B.sfx(13.8,'skitter'));
  r.beats.push(B.mmove(14.8,.8,[1.4,0,.4]));
  // финиш: ТАПОК-БУМЕРАНГ
  r.beats.push(B.sub(16.6,2.8,'m','— У меня есть тапок.'));
  r.beats.push(B.pose(17.6,1.4,'throwT'));
  r.beats.push(B.sfx(17.8,'whoosh',{d:.5}));
  r.beats.push(B.proj(18.1,1.1,'tapok',[-1.1,1.3,.6],[2.6,.4,-.4],{arc:2,spin:20}));
  r.beats.push(B.sfx(18.25,'throw'));
  r.beats.push(B.sfx(19.15,'punchBig'));
  r.beats.push(B.burst(19.15,[2.6,.5,-.4],{n:70,c:'#c9a06a',sp:5}));
  r.beats.push(B.ring(19.15,[2.6,.05,-.4],{r1:3,c:'#ffd24a'}));
  r.beats.push(B.shake(19.15,.5,.4));
  r.beats.push(B.dmg(19.2,[2.6,1,-.4],'KO',true));
  r.beats.push(B.hp(19.2,0));
  r.beats.push(B.eact(19.15,7,'ko',0));
  r.beats.push(B.banner(19.4,2.6,'ТАПОК-БУМЕРАНГ'));
  r.beats.push(B.sfx(19.4,'koSlam'));
  r.beats.push(B.sub(20.4,3.2,'nar','Тапок вернулся в руку. Так работает физика.'));
  r.beats.push(B.proj(20.2,.9,'tapok',[2.6,.6,-.4],[-1.2,1,.5],{arc:1.5,spin:-14}));
  r.beats.push(B.pose(22.4,3.4,'winJump'));
  r.beats.push(B.sfx(25.4,'riser',{d:.9}));r.beats.push(B.flash(25.7,'#fff',.35));
})();

// ============================================================= РАУНД 3: КОТ
(function(){
  const r=R3;
  r.mishaDef=[-1.5,0,.5];r.enemyDef=[[1.5,0,.5]];r.actors=['misha','cat'];
  entrance(r,0,[-5,0,.5],[-1.5,0,.5]);
  r.shots.push({t:2.6,d:2.2,p:[1.4,1.2,3],l:[1.5,.7,.5],fov:40,e:'out'});
  r.shots.push({t:4.8,d:3.2,p:[-2.8,1.7,3.2],l:[0,1,.5],fov:44});
  r.shots.push({t:8,d:2.2,p:[2.2,1,-1.2],l:[0,1,.5],fov:48});
  r.shots.push({t:10.2,d:3.4,orbit:{c:[0,1,.5],r:5.6,a0:1.8,a1:2.7,y:1.8},l:[0,1,.5],fov:44});
  r.shots.push({t:13.6,d:2.8,p:[-3.2,1.4,3],l:[-.4,1,.5],fov:42});
  r.shots.push({t:16.4,d:2.8,p:[0,2.2,4],l:[0,1,.5],fov:46});
  r.shots.push({t:19.2,d:3.4,p:[-1.6,1.2,2.8],l:[.6,1,.5],fov:44});
  r.shots.push({t:22.6,d:3.4,orbit:{c:[0,1.2,.5],r:6.6,a0:2.2,a1:4.3,y:2.6},l:[0,1.2,.5],fov:40});
  r.beats.push(B.sub(2.7,3,'nar','Двор. Кот. Уличный бой.'));
  r.beats.push(B.eact(3.4,1.2,'attack',0));r.beats.push(B.sfx(3.6,'meow'));
  r.beats.push(B.sub(5.2,2.6,'e','— Мур. То есть: трёпка тебе.'));
  r.beats.push(B.eact(6.6,1.2,'attack',0));r.beats.push(B.sfx(6.8,'hiss'));
  r.beats.push(B.pose(6.7,.7,'block'));r.beats.push(B.sfx(7.1,'block'));
  r.beats.push(B.dmg(7.2,[-1.5,1.6,.5],'-0'));
  r.beats.push(B.sub(8.2,2.2,'m','— Кот, не начинай. Я сегодня добрый.'));
  r.beats.push(B.mmove(9.6,.5,[.5,0,.5]));
  combo(r,10,[{m:'jab',at:[1.2,1,.5],n:'31'},{m:'cross',at:[1.1,1,.5],n:'62'},{m:'upper',at:[1,1.2,.5],n:'93',big:true}]);
  r.beats.push(B.eact(10.14,.5,'hurt',0));r.beats.push(B.eact(10.56,.5,'hurt',0));r.beats.push(B.eact(10.98,.6,'hurt',0));
  r.beats.push(B.hp(11.8,30));
  r.beats.push(B.sub(12.2,2.4,'e','— Мяу-мяу. Ты пожалеешь.'));
  // кот зовёт подмогу? нет, просто финиш
  r.beats.push(B.eact(13.8,1,'attack',0));r.beats.push(B.sfx(14,'hiss'));
  r.beats.push(B.pose(13.9,.7,'dodge',{dir:-1}));
  r.beats.push(B.dmg(14.3,[-1.5,1.6,.5],'-0'));
  r.beats.push(B.sub(15.4,2.2,'m','— Всё, кот. Апперкот.'));
  r.beats.push(B.mmove(16.6,.7,[.8,0,.5]));
  r.beats.push(B.pose(17.4,1.5,'upper'));
  r.beats.push(B.sfx(17.7,'whoosh',{d:.5}));r.beats.push(B.sfx(18.1,'punchBig'));
  r.beats.push(B.burst(18.1,[1.3,1.5,.5],{n:70,c:'#ffd24a',sp:6,up:4}));
  r.beats.push(B.ring(18.1,[1.3,.05,.5],{r1:4,c:'#ffd24a'}));
  r.beats.push(B.shake(18.1,.6,.4));r.beats.push(B.flash(18.1,'#fff',.25));
  r.beats.push(B.dmg(18.15,[1.3,2,.5],'KO',true));
  r.beats.push(B.hp(18.15,0));
  r.beats.push(B.eact(18.1,8,'ko',0));
  r.beats.push(B.banner(18.3,2.6,'АППЕРКОТ «НА БАЛКОН»'));
  r.beats.push(B.sfx(18.3,'koSlam'));
  r.beats.push(B.sub(19.6,3.2,'nar','Кот улетел на балкон к бабушке. Ему там лучше.'));
  r.beats.push(B.pose(21,4.4,'winJump'));
  r.beats.push(B.sfx(25.4,'riser',{d:.9}));r.beats.push(B.flash(25.7,'#fff',.35));
})();

// ============================================================= РАУНД 4: ГУСЬ
(function(){
  const r=R4;
  r.mishaDef=[-1.6,0,1];r.enemyDef=[[1.6,0,1],[3.2,0,-.2],[3.4,0,2.2]];r.actors=['misha','geese'];
  entrance(r,0,[-5,0,1],[-1.6,0,1]);
  r.shots.push({t:2.6,d:2.2,p:[1.6,1.5,3.4],l:[1.6,1,1],fov:40,e:'out'});
  r.shots.push({t:4.8,d:3,p:[-2.8,1.8,3.6],l:[0,1.2,1],fov:44});
  r.shots.push({t:7.8,d:2.4,p:[2.2,1.4,-1.4],l:[0,1.2,1],fov:48});
  r.shots.push({t:10.2,d:3.4,orbit:{c:[0,1.2,1],r:5.8,a0:1.8,a1:2.7,y:1.9},l:[0,1.2,1],fov:44});
  r.shots.push({t:13.6,d:2.8,p:[-3.2,1.6,3.4],l:[-.4,1.2,1],fov:42});
  r.shots.push({t:16.4,d:2.8,p:[0,2.4,4.6],l:[0,1.2,1],fov:46});
  r.shots.push({t:19.2,d:3.2,p:[-1.8,1.4,3],l:[.8,1.2,1],fov:44});
  r.shots.push({t:22.4,d:3.6,orbit:{c:[0,1.3,1],r:6.8,a0:2.2,a1:4.3,y:2.8},l:[0,1.3,1],fov:40});
  r.beats.push(B.sub(2.7,3,'nar','Пруд. Гусь. Самый страшный зверь России.'));
  r.beats.push(B.sfx(3,'honk'));r.beats.push(B.eact(3.2,1,'flap',0));
  r.beats.push(B.sub(5.4,2.4,'e','— ГА-ГА-ГА!!!'));
  r.beats.push(B.eact(6.8,1,'attack',0));r.beats.push(B.sfx(7,'honk'));
  r.beats.push(B.pose(6.9,.7,'dodge',{dir:-1}));r.beats.push(B.dmg(7.3,[-1.6,1.7,1],'-0'));
  r.beats.push(B.sub(8.4,2.4,'m','— Гусь. Ну всё, понеслась.'));
  r.beats.push(B.eact(9.8,1,'attack',0));r.beats.push(B.sfx(10,'honk'));
  r.beats.push(B.pose(9.9,.7,'dodge',{dir:1}));r.beats.push(B.dmg(10.3,[-1.6,1.7,1],'-0'));
  r.beats.push(B.mmove(11,.5,[.3,0,1]));
  combo(r,11.4,[{m:'jab',at:[1.2,1.3,1],n:'35'},{m:'hook',at:[1.1,1.3,1],n:'70',big:true}]);
  r.beats.push(B.eact(11.54,.5,'hurt',0));r.beats.push(B.eact(11.96,.5,'hurt',0));
  r.beats.push(B.hp(12.4,45));
  // подкрепление!
  r.beats.push(B.sub(13.4,3.2,'nar','Подкрепление! Гуси не сдаются!'));
  r.beats.push(B.sfx(13.4,'honk'));r.beats.push(B.sfx(13.9,'honk'));
  r.beats.push(B.emove(13.6,1.2,[1.2,0,1.6],1,'out'));
  r.beats.push(B.emove(13.9,1.2,[1.2,0,.4],2,'out'));
  r.beats.push(B.eact(13.6,12,'flap',1));r.beats.push(B.eact(13.9,12,'flap',2));
  combo(r,15.2,[{m:'cross',at:[.4,1.3,1.6],n:'52',who:1},{m:'jab',at:[.4,1.3,.4],n:'54',who:2},{m:'kick',at:[.6,1,1],n:'88',big:true}]);
  r.beats.push(B.eact(15.34,.5,'hurt',1));r.beats.push(B.eact(15.76,.5,'hurt',2));r.beats.push(B.eact(16.18,.6,'hurt',0));
  r.beats.push(B.eact(16.6,9,'ko',1));r.beats.push(B.eact(16.6,9,'ko',2));
  r.beats.push(B.sfx(16.7,'koSlam'));
  r.beats.push(B.sub(18,2.6,'m','— Двое — не считается.'));
  // финиш: вертушка-перьевая
  r.beats.push(B.pose(19.6,1.5,'roundhouse'));
  r.beats.push(B.sfx(19.8,'whoosh',{d:.5}));r.beats.push(B.sfx(20.3,'punchBig'));
  r.beats.push(B.burst(20.3,[1.4,1.4,1],{n:80,c:'#ffffff',sp:6,up:3}));
  r.beats.push(B.burst(20.4,[1.4,1.8,1],{n:40,c:'#e8e8e0',sp:3,up:5,d:1.6}));
  r.beats.push(B.ring(20.3,[1.4,.05,1],{r1:4.5,c:'#fff'}));
  r.beats.push(B.shake(20.3,.6,.4));r.beats.push(B.flash(20.3,'#fff',.25));
  r.beats.push(B.dmg(20.35,[1.4,2,1],'KO',true));
  r.beats.push(B.hp(20.35,0));
  r.beats.push(B.eact(20.3,6,'ko',0));
  r.beats.push(B.banner(20.5,2.6,'ВЕРТУШКА «ПЕРЬЕ-БАБОЧКА»'));
  r.beats.push(B.sfx(20.5,'koSlam'));
  r.beats.push(B.sub(21.8,3.2,'nar','Гусь в пруду. Перья будут находить ещё год.'));
  r.beats.push(B.pose(23,2.6,'winJump'));
  r.beats.push(B.sfx(25.4,'riser',{d:.9}));r.beats.push(B.flash(25.7,'#fff',.35));
})();

// ============================================================= РАУНД 5: МЕДВЕДЬ
(function(){
  const r=R5;
  r.mishaDef=[-1.8,0,.5];r.enemyDef=[[2.2,0,.5]];r.actors=['misha','bear'];
  entrance(r,0,[-6,0,.5],[-1.8,0,.5]);
  r.shots.push({t:2.6,d:2.2,p:[2.8,2.2,3.6],l:[2.2,1.8,.5],fov:42,e:'out'});
  r.shots.push({t:4.8,d:3,p:[-3.4,2,3.8],l:[.4,1.4,.5],fov:44});
  r.shots.push({t:7.8,d:2.2,p:[2.6,1.4,-2],l:[0,1.4,.5],fov:48});
  r.shots.push({t:10,d:3.4,orbit:{c:[.2,1.5,.5],r:7,a0:1.8,a1:2.7,y:2.2},l:[.2,1.5,.5],fov:44});
  r.shots.push({t:13.4,d:2.6,p:[-4,1.8,3.4],l:[-.4,1.4,.5],fov:42});
  r.shots.push({t:16,d:2.8,p:[0,3,5],l:[0,1.4,.5],fov:46});
  r.shots.push({t:18.8,d:3.4,p:[-2,1.6,3],l:[.8,1.4,.5],fov:44});
  r.shots.push({t:22.2,d:3.8,orbit:{c:[0,1.6,.5],r:7.6,a0:2.2,a1:4.4,y:3},l:[0,1.6,.5],fov:40});
  r.beats.push(B.sub(2.7,3,'nar','Лес. Медведь. Вот теперь серьёзно.'));
  r.beats.push(B.eact(3,1.6,'roar',0));r.beats.push(B.sfx(3.2,'roar'));
  r.beats.push(B.shake(3.2,.9,.3));
  r.beats.push(B.sub(5.4,2.2,'e','— Р-Р-Р-Р.'));
  r.beats.push(B.eact(6.8,1.2,'attack',0,{alt:true}));r.beats.push(B.sfx(7.2,'swipe'));
  r.beats.push(B.pose(6.9,.7,'dodge',{dir:-1}));r.beats.push(B.dmg(7.3,[-1.8,1.9,.5],'-0'));
  r.beats.push(B.eact(8.4,1.2,'attack',0));r.beats.push(B.sfx(8.8,'swipe'));
  r.beats.push(B.pose(8.5,.7,'dodge',{dir:1}));r.beats.push(B.dmg(8.9,[-1.8,1.9,.5],'-0'));
  r.beats.push(B.sub(10,2.6,'m','— Большой. Но медленный, братишка.'));
  r.beats.push(B.mmove(11.2,.6,[-.5,0,.5]));
  combo(r,11.6,[{m:'jab',at:[.9,1.8,.5],n:'24'},{m:'cross',at:[.8,1.8,.5],n:'48'},{m:'jab',at:[.8,1.6,.5],n:'72'},{m:'hook',at:[.7,1.8,.5],n:'96',big:true}]);
  [0,1,2,3].forEach(i=>r.beats.push(B.eact(11.74+i*.42,.5,'hurt',0)));
  r.beats.push(B.hp(13.4,35));
  r.beats.push(B.eact(14.6,1.4,'roar',0));r.beats.push(B.sfx(14.8,'roar'));r.beats.push(B.shake(14.8,.8,.3));
  r.beats.push(B.sub(16.6,2.2,'m','— Всё, мишка. Через бедро.'));
  // финиш: бросок через бедро
  r.beats.push(B.mmove(17.4,.7,[1.4,0,.5]));
  r.beats.push(B.pose(18.2,2,'throwT')); // бросок
  r.beats.push(B.sfx(18.6,'whoosh',{d:.7}));r.beats.push(B.sfx(19.3,'punchBig'));
  r.beats.push(B.eact(19.2,7,'ko',0));
  r.beats.push(B.burst(19.3,[2.2,.5,.5],{n:90,c:'#8a6b4a',sp:6}));
  r.beats.push(B.ring(19.3,[2.2,.05,.5],{r1:5,c:'#c9a06a'}));
  r.beats.push(B.shake(19.3,.8,.5));r.beats.push(B.flash(19.3,'#fff',.3));
  r.beats.push(B.dmg(19.35,[2.2,2,.5],'KO',true));
  r.beats.push(B.hp(19.35,0));
  r.beats.push(B.banner(19.5,2.6,'БРОСОК ЧЕРЕЗ БЕДРО'));
  r.beats.push(B.sfx(19.5,'koSlam'));
  r.beats.push(B.sub(20.8,3.4,'nar','Лес аплодирует. Белки визжат. Миша непобедим.'));
  r.beats.push(B.pose(22.4,3.4,'winJump'));
  r.beats.push(B.sfx(25.4,'riser',{d:.9}));r.beats.push(B.flash(25.7,'#fff',.35));
})();

// ============================================================= РАУНД 6: ГОПНИК (ТРИБУНЫ)
(function(){
  const r=R6;
  r.mishaDef=[-1.6,0,1];r.enemyDef=[[1.6,0,1]];r.actors=['misha','gopnik'];
  entrance(r,0,[-6,0,1],[-1.6,0,1]);
  r.shots.push({t:2.6,d:2.4,p:[2,1.6,3.6],l:[1.6,1,1],fov:40,e:'out'});
  r.shots.push({t:5,d:3.2,orbit:{c:[0,1,0],r:16,a0:2.4,a1:1.4,y:8},l:[0,1,0],fov:44});
  r.shots.push({t:8.2,d:2.6,p:[-2.8,1.8,3.4],l:[0,1.1,1],fov:44});
  r.shots.push({t:10.8,d:2.6,p:[2.4,1.2,-1.6],l:[0,1.1,1],fov:48});
  r.shots.push({t:13.4,d:3,orbit:{c:[0,1.2,1],r:6,a0:1.8,a1:2.7,y:2},l:[0,1.2,1],fov:44});
  r.shots.push({t:16.4,d:2.8,p:[-3.4,1.4,3.2],l:[-.4,1.1,1],fov:42});
  r.shots.push({t:19.2,d:3,p:[0,2.6,4.6],l:[0,1.1,1],fov:46});
  r.shots.push({t:22.2,d:3.2,p:[-1.8,1.4,3],l:[.6,1.1,1],fov:44});
  r.shots.push({t:25.4,d:2.6,orbit:{c:[0,1.4,1],r:7,a0:2.2,a1:3.8,y:2.8},l:[0,1.4,1],fov:40});
  r.beats.push(B.sfx(2.6,'crowd',{d:26,level:.5}));
  r.beats.push(B.sub(2.7,3,'nar','Стадион! Трибуны кипят! Чел против чела!'));
  r.beats.push(B.eact(3.4,1,'seeds',0));r.beats.push(B.sfx(3.6,'blip'));
  r.beats.push(B.sub(5.6,2.6,'e','— Чё смотришь? Семки есть?'));
  // семки-пулемёт
  r.beats.push(B.sub(8.4,2,'e','— ЛОВИ ОРЁШКИ!'));
  for(let i=0;i<6;i++)r.beats.push(B.proj(8.6+i*.28,.5,'seed',[1.5,1.2,1],[-1.5,1.5,1],{arc:.4,spin:0}));
  r.beats.push(B.sfx(8.6,'seeds',{d:2}));
  r.beats.push(B.pose(8.8,1.4,'dodge',{dir:-1}));
  r.beats.push(B.dmg(9.4,[-1.6,1.7,1],'-0'));
  r.beats.push(B.sub(11,2.2,'m','— Щас покажу класс, братан.'));
  r.beats.push(B.eact(12.2,1,'attack',0));r.beats.push(B.sfx(12.5,'whoosh',{d:.4}));
  r.beats.push(B.pose(12.3,.7,'dodge',{dir:1}));r.beats.push(B.dmg(12.7,[-1.6,1.7,1],'-0'));
  r.beats.push(B.mmove(13.6,.5,[-.4,0,1]));
  combo(r,14,[{m:'jab',at:[1.1,1.2,1],n:'29'},{m:'cross',at:[1,1.2,1],n:'58'},{m:'hook',at:[.9,1.2,1],n:'87'},{m:'upper',at:[.9,1.5,1],n:'125',big:true}]);
  [0,1,2,3].forEach(i=>r.beats.push(B.eact(14.14+i*.42,.5,'hurt',0)));
  r.beats.push(B.hp(15.8,28));
  r.beats.push(B.sfx(15.8,'crowd',{d:8,level:1}));
  r.beats.push(B.sub(17.4,2.4,'e','— Ты чё, реально боксёр?'));
  r.beats.push(B.eact(18.8,1,'attack',0));r.beats.push(B.sfx(19.1,'whoosh',{d:.4}));
  r.beats.push(B.pose(18.9,.7,'block'));r.beats.push(B.dmg(19.3,[-1.6,1.7,1],'-0'));
  // финиш: нокаут с люстры
  r.beats.push(B.sub(20.8,2,'m','— Апперкот. С любовью.'));
  r.beats.push(B.pose(21.8,1.6,'upper'));
  r.beats.push(B.sfx(22.1,'whoosh',{d:.5}));r.beats.push(B.sfx(22.6,'punchBig'));
  r.beats.push(B.burst(22.6,[1.5,1.6,1],{n:80,c:'#ffd24a',sp:6,up:5}));
  r.beats.push(B.ring(22.6,[1.5,.05,1],{r1:5,c:'#ffd24a',v:'cam'}));
  r.beats.push(B.shake(22.6,.7,.5));r.beats.push(B.flash(22.6,'#fff',.3));
  r.beats.push(B.dmg(22.65,[1.5,2.2,1],'KO',true));
  r.beats.push(B.hp(22.65,0));
  r.beats.push(B.eact(22.6,5.4,'ko',0));
  r.beats.push(B.emove(22.6,1.6,[5.5,3.5,3],0,'out'));
  r.beats.push(B.banner(22.8,2.6,'НОКАУТ «С ЛЮСТРЫ»'));
  r.beats.push(B.sfx(22.8,'koSlam'));r.beats.push(B.sfx(23,'crowd',{d:5,level:1}));
  r.beats.push(B.sub(24.2,3,'nar','Гопник улетел на трибуну. Болельщики в восторге!'));
  r.beats.push(B.pose(24.6,3.4,'winJump'));
  r.beats.push(B.sfx(27.4,'riser',{d:.9}));r.beats.push(B.flash(27.7,'#fff',.35));
})();

// ============================================================= РАУНД 7: ТИ-РЕКС
(function(){
  const r=R7;
  r.mishaDef=[-2,0,1];r.enemyDef=[[4.5,0,-3]];r.actors=['misha','trex'];
  entrance(r,0,[-7,0,1],[-2,0,1]);
  // т-рекс врывается
  r.beats.push(B.emove(1.2,2.6,[4.5,0,-3],0,'out'));
  r.beats.push(B.sfx(1.2,'stompBig'));r.beats.push(B.shake(1.2,2.8,.5));
  r.beats.push(B.burst(2.2,[4.5,.5,-3],{n:60,c:'#8a8f99',sp:4}));
  r.shots.push({t:0,d:2.6,p:[-3,2,4.5],l:[-1,1.4,1],fov:44});
  r.shots.push({t:2.6,d:3,p:[6,3,3],l:[4.5,4,-3],fov:46,e:'out'});
  r.shots.push({t:5.6,d:2.4,p:[0,2.5,6.5],l:[2,3,-1],fov:48});
  r.shots.push({t:8,d:3.4,orbit:{c:[1.5,2.5,-1],r:12,a0:1.7,a1:2.9,y:4},l:[1.5,2.5,-1],fov:44});
  r.shots.push({t:11.4,d:2.6,p:[-4.5,1.6,4],l:[0,1.4,1],fov:42});
  r.shots.push({t:14,d:2.8,p:[3,1.2,3],l:[1.6,1.6,-.8],fov:46});
  r.shots.push({t:16.8,d:3,p:[0,3.4,7],l:[0,2,-1],fov:46});
  r.shots.push({t:19.8,d:2.6,p:[-2,8,5],l:[2,4,-2],fov:44});
  r.shots.push({t:22.4,d:3.4,orbit:{c:[1,4,-2],r:14,a0:2.1,a1:4.2,y:5},l:[1,4,-2],fov:42});
  r.shots.push({t:25.8,d:4.2,p:[-4,1.8,5],l:[2,2.5,0],fov:40,e:'io'});
  r.beats.push(B.sfx(2.6,'crowd',{d:27,level:1}));
  r.beats.push(B.sub(2.7,3,'nar','Динозавр! Да ладно?! Ти-Рекс на стадионе!'));
  r.beats.push(B.eact(3,1.8,'roar',0));r.beats.push(B.sfx(3.4,'roarBig'));r.beats.push(B.shake(3.4,1,.6));
  r.beats.push(B.sub(5.8,2.4,'e','— Р-Р-РА-А-А-Х!!!'));
  // укусы — Миша уклоняется
  r.beats.push(B.eact(6.6,1.4,'bite',0));r.beats.push(B.sfx(7,'bite'));
  r.beats.push(B.pose(6.8,.8,'dodge',{dir:-1}));r.beats.push(B.dmg(7.3,[-2,1.7,1],'-0'));
  r.beats.push(B.eact(8.6,1.4,'bite',0));r.beats.push(B.sfx(9,'bite'));
  r.beats.push(B.pose(8.8,.8,'dodge',{dir:1}));r.beats.push(B.dmg(9.3,[-2,1.7,1],'-0'));
  r.beats.push(B.sub(10.4,2.4,'m','— Зубы кривые, дядя. К ортодонту.'));
  // топот
  r.beats.push(B.eact(12.2,1.2,'stompA',0));r.beats.push(B.sfx(12.6,'stompBig'));r.beats.push(B.shake(12.6,.7,.5));
  r.beats.push(B.pose(12.3,.9,'jump'));
  // комбо по ноге
  r.beats.push(B.mmove(13.9,.7,[1.7,0,-.8]));
  combo(r,14.4,[{m:'jab',at:[2.4,1.6,-1.6],n:'18'},{m:'cross',at:[2.3,1.6,-1.5],n:'36'},{m:'jab',at:[2.2,1.4,-1.4],n:'54'},{m:'hook',at:[2.1,1.6,-1.3],n:'72',big:true}]);
  [0,1,2,3].forEach(i=>r.beats.push(B.eact(14.54+i*.42,.5,'hurt',0)));
  r.beats.push(B.hp(16.2,40));
  r.beats.push(B.sub(17.4,2.6,'nar','Миша лезет по хвосту наверх! Он что, серьёзно?!'));
  r.beats.push(B.mmove(18.2,.8,[2,0,-.6]));
  r.beats.push(B.mmove(19,1,[1,0,-1.6]));
  r.beats.push(B.pose(18.4,5,'flex')); // стоит на динозавре
  r.beats.push(B.eact(19.8,1.6,'roar',0));r.beats.push(B.sfx(20.2,'roarBig'));r.beats.push(B.shake(20.2,.8,.4));
  r.beats.push(B.sub(21.6,2,'m','— Апперкот юрского периода!'));
  // ФИНИШ
  r.beats.push(B.pose(22.8,1.8,'upper'));
  r.beats.push(B.sfx(23.1,'whoosh',{d:.6}));r.beats.push(B.sfx(23.7,'punchBig'));
  r.beats.push(B.burst(23.7,[2.2,6.4,-1],{n:100,c:'#ffd24a',sp:8}));
  r.beats.push(B.ring(23.7,[2.2,6.4,-1],{r1:8,c:'#ffd24a',v:'cam'}));
  r.beats.push(B.shake(23.7,1.2,.8));r.beats.push(B.flash(23.7,'#fff',.4));
  r.beats.push(B.dmg(23.75,[2.2,7.5,-1],'KO',true));
  r.beats.push(B.hp(23.75,0));
  r.beats.push(B.eact(23.7,6.3,'ko',0));
  r.beats.push(B.sfx(24.4,'stompBig'));r.beats.push(B.shake(24.4,1,.7));
  r.beats.push(B.burst(24.6,[4,0.5,-2],{n:120,c:'#8a8f99',sp:7,d:1.2}));
  r.beats.push(B.banner(23.9,3,'АППЕРКОТ ЮРСКОГО ПЕРИОДА'));
  r.beats.push(B.sfx(23.9,'koSlam'));r.beats.push(B.sfx(24.6,'crowd',{d:5,level:1}));
  r.beats.push(B.sub(25.6,3.2,'nar','Ти-Рекс пал. Трибуны сходят с ума!'));
  r.beats.push(B.pose(27,2.8,'winJump'));
  r.beats.push(B.sfx(29.4,'riser',{d:.9}));r.beats.push(B.flash(29.7,'#fff',.35));
})();

// ============================================================= РАУНД 8: МЕГА БОСС ДЕД
(function(){
  const r=R8;
  r.mishaDef=[-1.6,0,.8];r.enemyDef=[[1.8,0,.8],[1.15,-6,.85]];r.actors=['misha','ded','pot'];
  entrance(r,0,[-6,0,.8],[-1.6,0,.8]);
  r.shots.push({t:2.6,d:2.6,p:[2.4,1.7,3.4],l:[1.8,1.3,.8],fov:40,e:'out'});
  r.shots.push({t:5.2,d:3,p:[-3,2,3.6],l:[0,1.3,.8],fov:44});
  r.shots.push({t:8.2,d:2.4,p:[2.6,1.4,-1.4],l:[0,1.3,.8],fov:48});
  r.shots.push({t:10.6,d:3,orbit:{c:[0,1.3,.8],r:6.4,a0:1.8,a1:2.7,y:2},l:[0,1.3,.8],fov:44});
  r.shots.push({t:13.6,d:2.8,p:[-3.6,1.6,3.2],l:[-.4,1.3,.8],fov:42});
  r.shots.push({t:16.4,d:2.8,p:[0,2.6,4.8],l:[0,1.3,.8],fov:46});
  r.shots.push({t:19.2,d:3,p:[-2,1.5,3],l:[.6,1.3,.8],fov:44});
  r.shots.push({t:22.2,d:3.2,orbit:{c:[0,1.4,.8],r:7,a0:2.2,a1:4.2,y:2.8},l:[0,1.4,.8],fov:40});
  r.shots.push({t:25.4,d:2.4,p:[1.4,1.2,3],l:[1.6,1.2,.8],fov:42});
  r.shots.push({t:27.8,d:3.6,orbit:{c:[0,1.6,.8],r:5.6,a0:2.4,a1:5.6,y:2},l:[0,1.5,.8],fov:38});
  r.shots.push({t:31.4,d:4.6,p:[-2.6,1.8,3.4],l:[1.4,1.2,.8],fov:40,e:'io'});
  r.beats.push(B.sub(2.7,3.4,'nar','Мега босс: ДЕД! Финальный уровень, пацаны!'));
  r.beats.push(B.sfx(2.6,'bell'));r.beats.push(B.sfx(3,'roar',{d:1}));
  r.beats.push(B.emove(1.6,1.6,[1.8,0,.8],0));
  // фаза 1: веник
  r.beats.push(B.sub(6,2.4,'e','— Внучок, получишь!'));
  r.beats.push(B.eact(7,1.2,'broomSweep',0));r.beats.push(B.sfx(7.4,'whoosh',{d:.4}));
  r.beats.push(B.pose(7.1,.7,'dodge',{dir:-1}));r.beats.push(B.dmg(7.5,[-1.6,1.7,.8],'-0'));
  r.beats.push(B.eact(8.6,1.2,'broomSweep',0));r.beats.push(B.sfx(9,'whoosh',{d:.4}));
  r.beats.push(B.pose(8.7,.7,'dodge',{dir:1}));r.beats.push(B.dmg(9.1,[-1.6,1.7,.8],'-0'));
  r.beats.push(B.mmove(10,.5,[-.2,0,.8]));
  combo(r,10.4,[{m:'jab',at:[1,1.4,.8],n:'12'},{m:'cross',at:[.9,1.4,.8],n:'24'},{m:'hook',at:[.8,1.4,.8],n:'36'}]);
  [0,1,2].forEach(i=>r.beats.push(B.eact(10.54+i*.42,.5,'hurt',0)));
  r.beats.push(B.hp(11.8,240));
  r.beats.push(B.sub(12.6,2.2,'m','— Дед, я вас умоляю.'));
  // фаза 2: тапки
  r.beats.push(B.sub(14,2.4,'e','— ТАПКИ ЛЕТЯТ!'));
  r.beats.push(B.sfx(14,'blip'));
  r.beats.push(B.proj(14.8,1,'tapok',[1.8,1.3,.8],[-1.6,1.6,.8],{arc:1.8,spin:16}));
  r.beats.push(B.sfx(14.9,'throw'));
  r.beats.push(B.pose(14.9,.8,'dodge',{dir:-1}));r.beats.push(B.sfx(15.3,'punch'));
  r.beats.push(B.burst(15.3,[-2.4,.2,.8],{n:24,c:'#d84a4a',sp:3}));
  r.beats.push(B.proj(16.4,1,'tapok',[1.8,1.3,.8],[-1.6,1.6,.8],{arc:2.4,spin:-16}));
  r.beats.push(B.sfx(16.5,'throw'));
  r.beats.push(B.pose(16.5,.8,'dodge',{dir:1}));r.beats.push(B.sfx(16.9,'punch'));
  r.beats.push(B.burst(16.9,[-.8,.2,.8],{n:24,c:'#d84a4a',sp:3}));
  r.beats.push(B.mmove(17.6,.5,[-.2,0,.8]));
  combo(r,18,[{m:'jab',at:[.9,1.4,.8],n:'45'},{m:'cross',at:[.8,1.4,.8],n:'57'},{m:'upper',at:[.8,1.6,.8],n:'69',big:true}]);
  [0,1,2].forEach(i=>r.beats.push(B.eact(18.14+i*.42,.5,'hurt',0)));
  r.beats.push(B.hp(19.4,180));
  r.beats.push(B.sub(20.6,2,'m','— Устал, дедуля?'));
  // фаза 3: суперсая
  r.beats.push(B.sub(22.2,2.6,'e','— Я. РАССЕРДИЛСЯ.'));
  r.beats.push(B.sfx(22.2,'riser',{d:1.6}));r.beats.push(B.flash(22.2,'#ffd24a',.5));r.beats.push(B.shake(22.2,1.6,.3));
  r.beats.push(B.sfx(23.8,'roarBig'));
  r.beats.push(B.eact(24.6,3.4,'ultimate',0));
  r.beats.push(B.sfx(25.4,'ultimate',{d:2.2}));
  r.beats.push(B.ring(25.4,[1.2,1.4,.8],{r1:6,d:.9,c:'#ffd24a',v:'cam'}));
  // столкновение кулаков!
  r.beats.push(B.pose(25.6,2,'upper'));
  r.beats.push(B.mmove(25.8,.9,[.8,0,.8]));
  r.beats.push(B.sfx(26.6,'impact'));
  r.beats.push(B.burst(26.6,[1.1,1.6,.8],{n:120,c:'#ffd24a',sp:8,d:1}));
  r.beats.push(B.ring(26.6,[1.1,1.4,.8],{r1:10,d:1,c:'#fff',v:'cam'}));
  r.beats.push(B.shake(26.6,1.4,.8));r.beats.push(B.flash(26.6,'#fff',.5));
  r.beats.push(B.eact(26.6,1,'hurt',0));
  r.beats.push(B.hp(27,40));
  r.beats.push(B.sub(27.4,2.2,'nar','Удар древней мудрости против удара супа!'));
  // СУП
  r.beats.push(B.sub(29,2.2,'m','— Дед… супу хочешь?'));
  r.beats.push(B.sfx(29,'blip'));
  r.beats.push(B.emove(29.2,.8,[1.15,0,.85],1));
  r.beats.push(B.emove(29.6,1.6,[1.2,0,.8],0));
  r.beats.push(B.pose(30.6,3,'point'));
  r.beats.push(B.sub(31.4,2.4,'e','— …Супу, внучок…'));
  r.beats.push(B.sfx(31.4,'choir',{d:3}));
  r.beats.push(B.eact(31.6,4,'hug',0));
  r.beats.push(B.hp(32,0));
  r.beats.push(B.banner(32.2,3,'ДЕД ПОВЕРЖЕН СИЛОЙ СУПА'));
  r.beats.push(B.sfx(32.2,'koSlam'));
  r.beats.push(B.sub(33.6,2.2,'nar','Никто не устоит перед супом. Никто.'));
  r.beats.push(B.pose(33.8,2.2,'winJump'));
  r.beats.push(B.sfx(35.4,'riser',{d:.9}));r.beats.push(B.flash(35.7,'#fff',.35));
})();

// ============================================================= РАУНД 9: ЗЕМЛЯ
(function(){
  const r=R9;
  r.mishaDef=[-3.4,0,3];r.enemyDef=[[7,2,-7]];r.actors=['misha','earth'];
  r.shots.push({t:0,d:3,p:[-1,2.6,6],l:[-.5,2,-.5],fov:50,e:'io'});
  r.shots.push({t:3,d:3.2,p:[-6,1.6,5],l:[0,1.8,2],fov:42,e:'out'});
  r.shots.push({t:6.2,d:2.6,orbit:{c:[2,2,-2],r:14,a0:2.2,a1:2.9,y:5},l:[2,2,-2],fov:46});
  r.shots.push({t:8.8,d:2.8,p:[-5,2,2],l:[3,2,-3],fov:44});
  r.shots.push({t:11.6,d:3,orbit:{c:[1,2.2,0],r:9,a0:1.5,a1:2.6,y:3.2},l:[1,2.2,0],fov:44});
  r.shots.push({t:14.6,d:2.6,p:[-2.4,1.8,5],l:[2,2.4,-2],fov:42});
  r.shots.push({t:17.2,d:3,orbit:{c:[1.5,2.5,-1.5],r:11,a0:2.4,a1:4.6,y:4},l:[1.5,2.5,-1.5],fov:40});
  r.shots.push({t:20.2,d:3.8,p:[-1,3,7],l:[2,2,-2],fov:46,e:'io'});
  r.beats.push(B.sub(0.6,3.4,'nar','Космос. Планета Земля. Миша, ты вообще нормальный?'));
  r.beats.push(B.cardT(0.2,2.4));
  r.beats.push(B.sfx(.2,'bell'));
  r.beats.push(B.sub(4.6,2.6,'m','— Земля… ты там как?'));
  r.beats.push(B.sfx(5.2,'blip'));
  r.beats.push(B.sub(7,2.4,'nar','Земля ответила тишиной. Значит, можно бить.'));
  r.beats.push(B.mmove(9.2,.8,[.4,0,-.4]));
  combo(r,9.6,[{m:'jab',at:[2,2.2,-1.6],n:'9.8'},{m:'cross',at:[1.9,2.2,-1.7],n:'7.2',big:true}]);
  r.beats.push(B.eact(9.74,1,'hurt',0));r.beats.push(B.eact(10.16,1,'hurt',0));
  r.beats.push(B.shake(10.2,.6,.4));
  r.beats.push(B.sub(11.4,2.6,'nar','Рихтер нервно записывает цифры в блокнот.'));
  // финиш: щелчок
  r.beats.push(B.sub(13.6,2.2,'m','— Щелчок. Извини, планета.'));
  r.beats.push(B.mmove(14.4,.8,[1.6,0,-1]));
  r.beats.push(B.pose(15.4,1.4,'cross'));
  r.beats.push(B.sfx(15.7,'whoosh',{d:.5}));r.beats.push(B.sfx(16.1,'impact'));
  r.beats.push(B.burst(16.1,[4,2.4,-4],{n:120,c:'#5fb8ff',sp:9,d:1.2}));
  r.beats.push(B.ring(16.1,[4,2.4,-4],{r1:12,d:1.1,c:'#5fb8ff',v:'cam'}));
  r.beats.push(B.shake(16.1,1.2,.7));r.beats.push(B.flash(16.1,'#cfe8ff',.4));
  r.beats.push(B.dmg(16.15,[4,3.4,-4],'9.999',true));
  r.beats.push(B.hp(16.15,0));
  r.beats.push(B.eact(16.1,8,'ko',0));
  r.beats.push(B.banner(16.3,2.8,'ЗЕМЛЯ ПОВЕРЖЕНА. ЖАЛОБ НЕТ'));
  r.beats.push(B.sfx(16.3,'koSlam'));
  r.beats.push(B.sub(18,3,'nar','Континенты целы. Миша бьёт аккуратно. Он же не зверь.'));
  r.beats.push(B.pose(19.4,4,'flex'));
  r.beats.push(B.sfx(23.4,'riser',{d:.9}));r.beats.push(B.flash(23.7,'#fff',.35));
})();

// ============================================================= РАУНД 10: ГАЛАКТИКА
(function(){
  const r=R10;
  r.mishaDef=[-2.6,0,4];r.enemyDef=[[0,7,-16]];r.actors=['misha','galaxy'];
  r.shots.push({t:0,d:3.2,p:[-2,3,10],l:[-1,5,-10],fov:50,e:'io'});
  r.shots.push({t:3.2,d:3,p:[-7,4,2],l:[-2,5,-8],fov:44,e:'out'});
  r.shots.push({t:6.2,d:2.8,orbit:{c:[0,6,-12],r:26,a0:2.5,a1:3.3,y:8},l:[0,6,-12],fov:46});
  r.shots.push({t:9,d:2.8,p:[-4,2.4,7],l:[-1.4,2,3],fov:44});
  r.shots.push({t:11.8,d:3.2,orbit:{c:[-1,3,2],r:9,a0:1.6,a1:2.8,y:4},l:[-1,3,2],fov:42});
  r.shots.push({t:15,d:2.6,p:[-6,5,-2],l:[0,6.5,-12],fov:40});
  r.shots.push({t:17.6,d:2.6,p:[-3,3,9],l:[-1,4,2],fov:44});
  r.shots.push({t:20.2,d:3.4,orbit:{c:[-1,4.5,-3],r:13,a0:2.2,a1:4.8,y:6},l:[-1,4.5,-3],fov:40});
  r.shots.push({t:23.6,d:4.4,p:[-1.5,3,8.5],l:[-1,5,-6],fov:46,e:'io'});
  r.beats.push(B.sub(0.6,3.6,'nar','Финальный раунд. Галактика. 100 тысяч световых лет.'));
  r.beats.push(B.cardT(0.2,2.4));
  r.beats.push(B.sfx(.2,'bell'));
  r.beats.push(B.sfx(1,'choir',{d:5}));
  r.beats.push(B.sub(4.4,2.8,'m','— Ты большая. Но я быстрее.'));
  r.beats.push(B.sub(7.6,2.6,'nar','Галактика молчит. У галактик нет шансов.'));
  r.beats.push(B.mmove(9.6,.6,[-2.2,0,2.6]));
  combo(r,10,[{m:'jab',at:[-1.2,2.4,1.6],n:'0.1'},{m:'cross',at:[-1.1,2.4,1.5],n:'0.2'},{m:'hook',at:[-1,2.4,1.4],n:'0.4',big:true}]);
  r.beats.push(B.eact(10.14,1,'hurt',0));r.beats.push(B.eact(10.56,1,'hurt',0));r.beats.push(B.eact(10.98,1,'hurt',0));
  r.beats.push(B.shake(11.4,.6,.35));
  r.beats.push(B.sub(12.2,2.6,'nar','Парсеки дрожат! Такие вещи гравитация просто так не прощает!'));
  // разбег и прыжок сквозь ядро
  r.beats.push(B.mmove(14.2,1.2,[-8,0,8]));
  r.beats.push(B.sfx(14.4,'whoosh',{d:1.4}));
  r.beats.push(B.sub(15.8,2,'m','— ГАЛАКТИКА-А-А!'));
  r.beats.push(B.mmove(16.2,1.4,[-1.2,0,-2],'lin'));
  r.beats.push(B.sfx(16.2,'riser',{d:1.4}));
  r.beats.push(B.shake(16.6,1.6,.5));
  r.beats.push(B.pose(17,1.6,'upper'));
  r.beats.push(B.sfx(17.5,'ultimate',{d:1.4}));
  r.beats.push(B.sfx(18.1,'impact'));
  r.beats.push(B.eact(18,3.4,'shatter',0));
  r.beats.push(B.burst(18.1,[0,6.4,-13],{n:160,c:'#ffe8b0',sp:14,up:2,d:1.8}));
  r.beats.push(B.burst(18.3,[0,6,-12],{n:120,c:'#9fb4ff',sp:10,up:1,d:2.2}));
  r.beats.push(B.ring(18.1,[0,6.4,-13],{r1:20,d:1.4,c:'#ffe8b0',v:'cam'}));
  r.beats.push(B.shake(18.1,1.6,.9));r.beats.push(B.flash(18.1,'#fff',.6));
  r.beats.push(B.dmg(18.15,[0,7.5,-12],'∞',true));
  r.beats.push(B.hp(18.15,0));
  r.beats.push(B.banner(18.3,3.2,'АППЕРКОТ ВСЕЛЕННОЙ'));
  r.beats.push(B.sfx(18.3,'koSlam'));
  r.beats.push(B.sfx(19.4,'choir',{d:6}));
  r.beats.push(B.sub(20.4,3.2,'nar','Галактика рассыпалась звёздами. Миша — чемпион вселенной!'));
  r.beats.push(B.pose(21.2,4.6,'winJump'));
  r.beats.push(B.sfx(25.4,'riser',{d:.9}));r.beats.push(B.flash(25.7,'#ffd24a',.5));
})();

// ============================================================= ФИНАЛ
(function(){
  const r=RF;
  r.mishaDef=[0,0,0];r.actors=['misha','bacteria','roach','cat','geese','bear','gopnik','ded','earth','galaxy','pot'];
  r.shots.push({t:0,d:3.4,orbit:{c:[0,1.6,0],r:8,a0:2.5,a1:3.9,y:2.6},l:[0,1.5,0],fov:42});
  r.shots.push({t:3.4,d:3.2,p:[0,2.2,6.4],l:[0,1.6,0],fov:40,e:'out'});
  r.shots.push({t:6.6,d:3.4,p:[-2.6,1.4,4],l:[0,1.8,0],fov:44});
  r.beats.push(B.sub(.4,3,'nar','МИША. ЧЕМПИОН. ВСЕЛЕННОЙ.'));
  r.beats.push(B.sfx(0,'choir',{d:8}));r.beats.push(B.sfx(0,'crowd',{d:10,level:1}));
  r.beats.push(B.pose(0,3.4,'flex'));
  r.beats.push(B.pose(3.4,6.6,'winJump'));
  r.beats.push(B.banner(3.6,3,'🏆 ЧЕМПИОН ВСЕЛЕННОЙ'));
  // фейерверки
  for(let i=0;i<8;i++){const a=i/8*TAU,d=6+((i*37)%5);
    r.beats.push(B.burst(1+i*1.1,[Math.cos(a)*d,3+(i%3)*2,Math.sin(a)*d-2],{n:60,c:['#ffd24a','#ff5a8a','#5fb8ff','#7fe0c4'][i%4],sp:6,up:3,g:-2,d:1.6}));
    r.beats.push(B.sfx(1+i*1.1,'firework'))}
  r.beats.push(B.sub(7,2.8,'nar','Ставь лайк. Подписывайся. Суп наварен.'));
})();

// тайминги
let acc=0;for(const r of R){r.t0=acc;acc+=r.dur;r.t1=acc}
FILM.rounds=R;FILM.total=acc;
window.MFILM=FILM;
})();
