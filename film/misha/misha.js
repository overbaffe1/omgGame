/* misha.js — «МИША против всего»: 5-минутный экшен-ролик в процедурном 3D.
   Один код для браузера (index.html) и для офлайн-рендера (render.mjs → MP4).
   Движок — тот же мини-3D, что в мультфильме body51 (film/body51-3d.js, window.B3).
   Картинка — полигоны + туман + свет; звук — синтез (см. render.mjs).

   Таймлайн: 13 этапов от бактерии до галактики, 300 секунд.
   Все удары (HITS) и титры (CAPS) заданы абсолютным временем — по ним же строится звук. */
(function(){
const B3 = window.B3;
let W = 720, H = 1280;
const {v3,vnorm,vcross,xform,mesh,addMesh,box,prism,cone,sphere,torus,mTrans,mScale,mRotX,mRotY,mRotZ,mMul,mIdent,slab,clamp,lerp,TAU} = B3;
const RAD = d => d*Math.PI/180;
const M = (...ms) => ms.reduce((a,b)=>mMul(a,b));
const place = (m, mat) => ({verts: m.verts.map(v=>xform(mat,v)), faces: m.faces});
const join = list => { const o = mesh(); for (const m of list) addMesh(o, m); return o; };
const deform = (m, fn) => ({verts: m.verts.map(fn), faces: m.faces});
const rnd = i => { const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); };
const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const easeOut = x => { x = clamp(x); return 1-Math.pow(1-x,3); };
const easeIn = x => { x = clamp(x); return x*x*x; };
const win = (t,a,b) => clamp((t-a)/(b-a));
// трапеция: 0 → (плавно) 1 на [b..c] → 0; нужна для ударов и замахов
const trap = (x,a,b,c,d) => x<=a||x>=d ? 0 : x<b ? ease((x-a)/(b-a)) : x<=c ? 1 : 1-ease((x-c)/(d-c));
const yawTo = (x0,z0,x1,z1) => Math.atan2(x1-x0, z1-z0);

// ---------- таймлайн ----------
// energy — громкость/напор музыки; hp — полоска здоровья врага (0..1)
const STAGES = [
  {id:'intro',  name:'ВСТУПЛЕНИЕ',       size:'—',                         t0:0,   t1:8,   energy:0.25},
  {id:'bact',   name:'БАКТЕРИЯ',         size:'2 мкм',                     t0:8,   t1:32,  energy:0.8},
  {id:'amoeba', name:'АМЁБА И ВИРУС',    size:'0,5 мм',                    t0:32,  t1:54,  energy:0.85},
  {id:'fly',    name:'МУХА',             size:'6 мм',                      t0:54,  t1:72,  energy:0.9},
  {id:'cat',    name:'КОТ-СФИНКС',       size:'30 см',                     t0:72,  t1:92,  energy:0.9},
  {id:'shark',  name:'АКУЛА',            size:'6 м',                       t0:92,  t1:114, energy:0.9},
  {id:'dino',   name:'Т-REX',            size:'12 м',                      t0:114, t1:146, energy:1.0},
  {id:'whale',  name:'КИТ',              size:'30 м',                      t0:146, t1:166, energy:0.9},
  {id:'planet', name:'ПЛАНЕТА',          size:'12 000 км',                 t0:166, t1:186, energy:0.8},
  {id:'ded',    name:'ДЕД',              size:'несколько планет',          t0:186, t1:222, energy:1.0},
  {id:'sun',    name:'СОЛНЦЕ',           size:'1,4 млн км',                t0:222, t1:242, energy:0.6},
  {id:'galaxy', name:'ГАЛАКТИКА',        size:'100 000 световых лет',      t0:242, t1:272, energy:0.4},
  {id:'finale', name:'ФИНАЛ',            size:'—',                         t0:272, t1:300, energy:0.3},
];
const DUR = 300;

// ---------- удары: t (сек), s = 'hit' | 'big' | 'whoosh' | 'pop', w = слово на экране ----------
const HITS = [];
const HIT = (t,s,w) => HITS.push({t,s,w:w||null});
// ---------- титры: t0..t1 (сек), text, pos 'top'|'bottom'|'center', big ----------
const CAPS = [];
const C = (t0,t1,text,pos='bottom',big=false) => CAPS.push({t0,t1,text,pos,big});

// ================= ЭТАП 0: вступление (0–8) =================
C(0.6,4.2,'Жил-был Миша.','center',true);
C(4.4,7.6,'Ничего не боялся. Почти.','bottom');

// ================= ЭТАП 1: бактерия (8–32) =================
const B1 = 8;
C(B1+1,B1+5,'Миша увидел бактерию на предметном стекле.');
C(B1+6,B1+10,'Миша: «Да ты мелкий, братан»');
C(B1+12,B1+15,'Миша: «Ногу сюда. Вот так.»','bottom');
C(B1+16,B1+21,'Надел, как тапок, и повёл ступнёй.','bottom');
HIT(B1+21,'big','ХРУМ');
C(B1+22,B1+24,'Чисто.','center',true);

// ================= ЭТАП 2: амёба и вирус (32–54) =================
const B2 = 32;
HIT(B2+7,'hit','ШЛЁП');
C(B2+1,B2+5,'Амёба. Она тянется к Мише псевдоподией.');
C(B2+8,B2+10,'Амёба: «Ну и ладно, я сама распадусь»');
C(B2+11,B2+15,'Вирус. Колючий шарик, кто его так назвал.');
HIT(B2+16.5,'big','БАМС');
C(B2+18,B2+21,'Миша: «Колюче, но не страшно»','bottom');

// ================= ЭТАП 3: муха (54–72) =================
const B3s = 54;
C(B3s+1,B3s+4,'Муха. Жужжит прямо в ухо.');
HIT(B3s+7.5,'whoosh');
C(B3s+7,B3s+9,'Миша: «Вжух!»','top');
HIT(B3s+13.5,'big','ВЖУХ');
C(B3s+11.5,B3s+15,'Миша: «Теперь ты в курсе, что шлёпать — это я умею»','bottom');

// ================= ЭТАП 4: кот-сфинкс (72–92) =================
const B4 = 72;
C(B4+1,B4+4,'Кот-сфинкс. Лысый, но с характером.');
C(B4+6,B4+8.5,'Кот: «мррр, ты кто такой»','top');
HIT(B4+9.6,'big','БАМС');
C(B4+10.5,B4+13,'Миша: «Сиди, ладно?»','bottom');

// ================= ЭТАП 5: акула (92–114) =================
const B5 = 92;
C(B5+1,B5+5,'Акула. Миша стоит на плоту. Плот качается.');
HIT(B5+11,'big','БАМ');
HIT(B5+11.4,'hit','ХРЯСЬ');
C(B5+12,B5+15,'Акула: «Ой»','top');
C(B5+16,B5+20,'Миша: «Плыви, пока я добрый»','bottom');

// ================= ЭТАП 6: Т-Рекс (114–146) =================
const B6 = 114;
C(B6+1,B6+5,'Т-Рекс. Рычит так, что штукатурка сыпется.','bottom');
C(B6+4,B6+6,'РРРРРРР','center',true);
HIT(B6+8.5,'whoosh');
C(B6+8,B6+10,'Миша уклонился. Пока что.','bottom');
HIT(B6+13.2,'big','БАМС');
C(B6+13.5,B6+16,'Ногой по челюсти. Т-Рекс отвлёкся.','bottom');
HIT(B6+17.6,'hit','ШЛЁП');
HIT(B6+18.5,'hit','БАМ');
HIT(B6+19.4,'hit','ХРЯСЬ');
C(B6+17,B6+21,'Три удара, один Миша.','bottom');
HIT(B6+21.5,'whoosh');
HIT(B6+26.2,'big','КАБУМ');
C(B6+24,B6+27,'Апперкот. Динозавр падает, как шкаф.','bottom');
C(B6+28,B6+31,'Миша: «Вот и всё. Рекс не главный.»','bottom');

// ================= ЭТАП 7: кит (146–166) =================
const B7 = 146;
C(B7+1,B7+4,'Кит. Выпрыгивает так, что сам Миша удивлён.');
HIT(B7+10.2,'big','ПЛЮХ');
C(B7+10.5,B7+14,'Миша: «Ты чё, пасть закрой»','bottom');
C(B7+15,B7+19,'Кит падает обратно. Волны до небоскрёбов.','bottom');

// ================= ЭТАП 8: планета (166–186) =================
const B8 = 166;
C(B8+1,B8+5,'Планета. Миша на полюсе. Ну, почти на полюсе.','bottom');
HIT(B8+9,'big','ПАФ');
C(B8+9.5,B8+12,'Миша: «Земля, ну ты и тяжёлая»','bottom');
HIT(B8+14,'big','БУМ');
C(B8+14.5,B8+18,'Планета раскололась на кусочки.','center',true);

// ================= ЭТАП 9: Дед (186–222) — финальный босс =================
const B9 = 186;
C(B9+1,B9+5,'Босс. Ростом с несколько планет. Это ДЕД.','top');
C(B9+4,B9+7,'Дед: «Миша, ты опять без шапки»','bottom');
C(B9+9,B9+12,'Дед: «Я тебя сейчас научу уважению»','bottom');
HIT(B9+9.8,'big','БУМ');
C(B9+12,B9+16,'Миша полетел. Он всегда летает, когда страшно.','bottom');
HIT(B9+21,'big','ПАФ');
C(B9+21.2,B9+24,'Очки полетели в космос.','center',true);
C(B9+25,B9+29,'Дед: «Ты чё натворил, Миша?!»','bottom');
HIT(B9+27.5,'hit','ХРЯСЬ');
C(B9+31,B9+35,'Миша: «Ну, дед, за шапку»','bottom');

// ================= ЭТАП 10: Солнце (222–242) =================
const B10 = 222;
C(B10+1,B10+5,'Солнце. Жарко. Миша стоит на протуберанце.','bottom');
HIT(B10+10.8,'big','ФШШШ');
C(B10+11,B10+15,'Миша отбил протуберанец ногой. Солнце обиделось и вспыхнуло.','bottom');

// ================= ЭТАП 11: галактика (242–272) =================
const B11 = 242;
C(B11+1,B11+5,'Галактика. Сто тысяч световых лет.','bottom');
HIT(B11+20.5,'big','ВСЁ');
C(B11+17,B11+21,'Миша: «Последний удар»','bottom');
C(B11+22,B11+26,'Галактика схлопнулась. И взорвалась. Ну так бывает.','center',true);

// ================= ЭТАП 12: финал (272–300) =================
const B12 = 272;
C(B12+3,B12+8,'Миша победил.','center',true);
C(B12+10,B12+16,'Миша ушёл пить чай. Дед тоже был не против.','bottom');
C(B12+20,B12+25,'Конец.','center',true);
// финальный «бум» на титре
HIT(B12+3,'big','БАМ');

// ---------- рисование ----------
function bg(g, top, bottom){
  const gr = g.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,top); gr.addColorStop(1,bottom);
  g.fillStyle = gr; g.fillRect(0,0,W,H);
}
function stars(g, t, n, seedBase, alpha=1){
  for (let i=0;i<n;i++){
    const x = rnd(i*3+seedBase)*W, y = rnd(i*7+seedBase)*H*0.7, r = 0.7+rnd(i*11+seedBase)*1.6;
    g.fillStyle = `rgba(230,240,255,${alpha*(0.25+0.6*Math.abs(Math.sin(t*0.9+i)))})`;
    g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
  }
}
function txt(g, s, x, y, fs, o={}){
  const {col='#ffffff', stroke='#000000', sw=0.14, align='center', weight=800, alpha=1, rot=0, scale=1, family='Manrope, sans-serif'} = o;
  g.save();
  g.globalAlpha *= alpha;
  g.translate(x,y); if (rot) g.rotate(rot); if (scale!==1) g.scale(scale,scale);
  g.font = `${weight} ${fs}px ${family}`;
  g.textAlign = align; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = fs*sw; g.strokeStyle = stroke;
  g.strokeText(s,0,0); g.fillStyle = col; g.fillText(s,0,0);
  g.restore();
}
function makeScene(g, o){
  const sc = new B3.Scene(g,W,H);
  sc.fog(o.fogN ?? 7, o.fogF ?? 30, o.fog || '#0a0c14');
  if (o.light) sc.light = vnorm(o.light);
  sc.ambient = o.amb ?? 0.66;
  sc.exposure = o.exp ?? 1.0;
  sc.drift = o.drift ?? 0.012;
  sc.camera(o.eye, o.tgt, o.fov || 42);
  sc.tick(o.t || 0);
  return sc;
}
function render(sc){ return B3.draw(sc); }

// ---------- риг Миши (и Деда) ----------
// Части собраны в локальных координатах персонажа (ноги до y=0, лицом к +z).
// Положение задаётся мировой матрицей при sc.add().
function rigMisha(o={}){
  const s = o.scale || 1, legH = 0.86, torsoH = 0.62, headR = 0.15;
  const skin = o.skin || '#e7b594', shirt = o.shirt || '#27344f', pants = o.pants || '#1f2433',
        hair = o.hair || '#3b2618', shoe = o.shoe || '#eef0f4', eye = '#1d2233';
  const P = Object.assign({hipL:0,hipR:0,kneeL:0,kneeR:0,armL:0,armR:0,elbL:0,elbR:0,lean:0,head:0}, o.pose||{});
  const parts = {};
  for (const sd of [1,-1]){
    const k = sd>0 ? 'R' : 'L';
    const hip = sd>0 ? P.hipR : P.hipL, knee = sd>0 ? P.kneeR : P.kneeL;
    const hm = M(mTrans(sd*0.115,legH,0), mRotX(RAD(hip)));
    const th = place(prism(8,0.085,0.44,pants), mMul(hm,mTrans(0,-0.22,0)));
    const km = M(hm, mTrans(0,-0.44,0), mRotX(-RAD(knee)));
    const sh = place(prism(8,0.07,0.42,pants), mMul(km,mTrans(0,-0.21,0)));
    const sho = place(box(0.17,0.09,0.30,shoe), mMul(km,mTrans(0,-0.42,0.06)));
    parts['leg'+k] = join([th,sh,sho]);
  }
  const U = M(mTrans(0,legH,0), mRotX(RAD(P.lean)));
  parts.torso = place(box(0.46,torsoH,0.26,shirt), mMul(U,mTrans(0,torsoH/2,0)));
  parts.neck = place(prism(8,0.06,0.09,skin), mMul(U,mTrans(0,torsoH+0.05,0)));
  // голова: поворот головы (P.head) — вокруг шеи
  const HM = M(U, mTrans(0,torsoH+0.09+headR,0), mRotX(RAD(P.head)));
  parts.head = place(sphere(7,10,headR,skin), HM);
  const hairSph = sphere(6,9,headR*1.06,hair);
  const hairTop = {verts:hairSph.verts, faces:hairSph.faces.filter(f=>{
    const ys = f.v.map(i=>hairSph.verts[i].y); return (ys.reduce((a,b)=>a+b,0)/ys.length) > headR*0.12; })};
  parts.hair = place(hairTop, mMul(HM,mTrans(0,headR*0.12,0)));
  for (const sx of [-0.055,0.055]) parts['eye'+(sx<0?'L':'R')] = place(box(0.03,0.03,0.02,eye), mMul(HM, mTrans(sx,0.02,headR*0.95)));
  if (o.beard) parts.beard = place(box(0.2,0.12,0.14,o.beardCol||'#8a8f99'), mMul(HM,mTrans(0,-headR*0.62,headR*0.55)));
  if (o.glasses) for (const sx of [-0.058,0.058]) parts['glass'+(sx<0?'L':'R')] = place(torus(7,0.012,0.052,'#2b3448'), mMul(HM,mTrans(sx,0.03,headR*0.95)));
  for (const sd of [1,-1]){
    const k = sd>0 ? 'R' : 'L';
    const a = sd>0 ? P.armR : P.armL, e = sd>0 ? P.elbR : P.elbL;
    const am = M(U, mTrans(sd*0.27,torsoH-0.04,0), mRotX(RAD(a)));
    const up = place(prism(7,0.06,0.32,shirt), mMul(am,mTrans(0,-0.16,0)));
    const fm = M(am, mTrans(0,-0.32,0), mRotX(RAD(e)));
    parts['arm'+k] = join([up, place(prism(7,0.05,0.30,shirt), mMul(fm,mTrans(0,-0.15,0))),
                           place(sphere(4,6,0.06,skin), mMul(fm,mTrans(0,-0.32,0)))]);
  }
  const all = join(Object.values(parts));
  return {all, parts};
}
// персонаж: мировая матрица (позиция, поворот вокруг Y, масштаб)
function charMat(p){
  return M(mTrans(p.x||0,p.y||0,p.z||0), mRotY(p.yaw||0), mScale(p.s||1,p.s||1,p.s||1));
}
function addMisha(sc, pose, p, o={}){
  const r = rigMisha(Object.assign({pose}, o));
  sc.add(r.all, charMat(p));
  if (p.shadow!==false) sc.shadow(p.x||0, p.z||0, 0.42*(p.s||1), 0.26*(p.s||1));
  return r;
}
// только одна деталь (нога) — для крупных планов
function addPart(sc, part, p){ sc.add(part, charMat(p)); }

// ---------- враги ----------
function bacteriumMesh(t, sq){
  const body = sphere(7,12,0.5,'#9bf27b');
  const b = place(body, mScale(1.4, 1-0.6*sq, 1-0.45*sq));
  const parts = [b];
  for (let k of [-1,1]) for (let i=0;i<6;i++){
    const ang = i/6*TAU + t*0.2;
    const fl = prism(3,0.012,0.7,'#d8f2b0');
    const m = M(mTrans(k*0.55*(1-0.4*sq),0,0), mRotX(ang), mRotZ(0.8*Math.sin(t*6+i+k)*0.6), mTrans(0,0.42,0));
    parts.push(place(fl,m));
  }
  return join(parts);
}
function amoebaMesh(t, sc){
  const body = deform(sphere(8,12,0.7,'#c69df0'), v => {
    const th = Math.atan2(v.z,v.x);
    const f = 1 + 0.16*Math.sin(3*th+t*2.2) + 0.1*Math.cos(2*v.y*2+t*1.3);
    return v3(v.x*f, v.y*f*0.9, v.z*f);
  });
  const nucleus = place(sphere(4,6,0.22,'#5b2f8a'), mTrans(0.08,0.02,0));
  const pseudo = place(sphere(5,7,0.2+0.05*Math.sin(t*3),'#b586e6'), mTrans(0.7*Math.cos(t*1.5),0.1,0.7*Math.sin(t*1.5)));
  return join([body,nucleus,pseudo]);
}
function virusMesh(t){
  const core = sphere(6,8,0.55,'#7dd3a8');
  const parts=[core];
  const N=24;
  for (let i=0;i<N;i++){
    const th = Math.acos(1-2*(i+0.5)/N), ph = i*2.399963;
    const sp = cone(4,0.07,0.3,'#e8f7a8');
    parts.push(place(sp, M(mRotY(ph), mRotZ(th), mTrans(0,0.7,0))));
  }
  return join(parts);
}
function flyMesh(t){
  const body = place(sphere(5,7,0.1,'#2b2b33'), mScale(1.6,0.9,1.1));
  const head = place(sphere(5,7,0.07,'#ff5a5a'), mTrans(0.12,0.03,0));
  const parts=[body,head];
  for (const sd of [-1,1]){
    const flap = 0.9*Math.sin(t*70)*sd;
    const w = box(0.24,0.004,0.12,'#d8e4f6');
    parts.push(place(w, M(mTrans(0,0.05,0.0), mRotZ(flap*0.6), mTrans(sd*0.12,0,0))));
  }
  return join(parts);
}
function sharkMesh(t){
  const body = place(sphere(8,12,1,'#7f8fa3'), mScale(0.45,0.42,1.6));
  const belly = place(sphere(6,8,0.95,'#e8edf2'), M(mTrans(0,-0.14,0), mScale(0.42,0.22,1.5)));
  const snout = place(cone(6,0.42,0.9,'#7f8fa3'), M(mTrans(0,0,1.6+0.45), mRotX(Math.PI/2)));
  const fin = place(cone(3,0.36,0.9,'#6a7a8e'), M(mTrans(0,0.6,-0.1), mScale(0.14,1,1)));
  const tailM = M(mTrans(0,0.15,-1.6), mRotY(0.4*Math.sin(t*4)));
  const tailFin = place(box(0.9,0.05,0.4,'#6a7a8e'), M(tailM, mTrans(0,0.05,-0.25)));
  const tailUp = place(cone(4,0.25,0.6,'#6a7a8e'), M(tailM, mTrans(0,0.4,-0.2), mRotX(-0.4)));
  const eyes = [-0.36,0.36].map(x=>place(sphere(4,6,0.05,'#101418'), mTrans(x,0.14,0.85)));
  return join([body,belly,snout,fin,tailFin,tailUp,...eyes]);
}
function trexMesh(o){
  const skin='#4f7a3b', dark='#3f6430', belly='#c7b57a';
  const parts=[];
  parts.push(place(sphere(8,12,1,skin), mMul(mTrans(0,2.0,0), mScale(0.85,0.9,1.5))));
  parts.push(place(sphere(6,10,0.9,belly), mMul(mTrans(0,1.85,0.1), mScale(0.6,0.6,1.3))));
  parts.push(place(prism(7,0.45,1.2,skin), M(mTrans(0,2.8,1.0), mRotX(-0.6))));
  const HM = M(mTrans(0,3.45,1.9), mRotX(o.headPitch||0.15));
  parts.push(place(box(0.95,0.8,1.5,skin), HM));
  const JM = M(HM, mTrans(0,-0.42,0.15), mRotX(-(o.jaw||0)));
  parts.push(place(box(0.8,0.3,1.4,skin), JM));
  for (let i=0;i<6;i++) parts.push(place(cone(3,0.05,0.18,'#f2f0e6'), M(JM, mTrans(-0.2+(i%2)*0.4,-0.15,0.25+i*0.15), mRotX(Math.PI))));
  for (const sx of [-0.42,0.42]) parts.push(place(sphere(4,6,0.08,'#f2c200'), M(HM, mTrans(sx,0.2,0.5))));
  for (const sx of [-0.5,0.5]){
    parts.push(place(prism(7,0.35,1.5,dark), mTrans(sx,1.2,0)));
    parts.push(place(box(0.7,0.25,1.2,dark), mTrans(sx,0.12,0.25)));
  }
  for (const sx of [-0.55,0.55]) parts.push(place(prism(5,0.1,0.55,dark), M(mTrans(sx,2.0,0.9), mRotX(-0.7))));
  let tp = mTrans(0,2.0,-0.9);
  for (let i=0;i<6;i++){
    tp = M(tp, mRotY(0.25*Math.sin((o.tail||0)+i*0.6)));
    const r = 0.5 - i*0.06;
    parts.push(place(prism(6,r,0.55,skin), M(tp, mTrans(0,0,-0.27), mRotX(Math.PI/2))));
    tp = M(tp, mTrans(0,0,-0.5));
  }
  return join(parts);
}
function whaleMesh(t){
  const body = place(sphere(10,14,1,'#2f5d8f'), mScale(0.9,0.9,2.1));
  const belly = place(sphere(6,10,0.95,'#cfe3f0'), M(mTrans(0,-0.25,0.1), mScale(0.75,0.45,1.85)));
  const flukeM = M(mTrans(0,0.1,-2.3), mRotY(0.5*Math.sin(t*3)));
  const fluke = place(box(1.4,0.07,0.5,'#2f5d8f'), flukeM);
  const eye = place(sphere(4,6,0.07,'#101418'), mTrans(0.6,0.2,1.2));
  return join([body,belly,fluke,eye]);
}
function planetMesh(){
  const parts=[place(sphere(12,18,3,'#3c7fd0'),mIdent())];
  for (let i=0;i<9;i++){
    const th=rnd(i*5+1)*TAU, ph=rnd(i*5+2)*Math.PI;
    parts.push(place(sphere(4,6,0.75,'#58b26a'), M(mRotY(th), mRotZ(ph*0.5), mTrans(0,3.0,0), mScale(1,0.3,1))));
  }
  parts.push(place(torus(40,0.28,4.6,'#c9b38a'), mScale(1,0.12,1)));
  return join(parts);
}
// Дед — rigMisha с крупным масштабом
// ---------- галактика: частицы (один меш) ----------
const GAL = (function(){
  const N = 900, out = mesh();
  for (let i=0;i<N;i++){
    const arm = i%2;
    const r = Math.pow(rnd(i*3+1),0.6)*6.0 + 0.2;
    const th = r*0.9 + arm*Math.PI + (rnd(i*3+2)-0.5)*0.8;
    const y = (rnd(i*3+3)-0.5)*0.35*(1-r/7);
    const cx = Math.cos(th)*r, cz = Math.sin(th)*r;
    const s = 0.09 + rnd(i*9+4)*0.16;
    const c = r<2 ? [255,236,200] : (r<4 ? [200,190,255] : [120,160,255]);
    const i0 = out.verts.length;
    out.verts.push(v3(cx-s,y,cz-s), v3(cx+s,y,cz-s), v3(cx+s,y,cz+s), v3(cx-s,y,cz+s));
    out.faces.push({v:[i0,i0+1,i0+2,i0+3], c, e:true, double:true, glow:0});
  }
  return out;
})();
// ---------- обломки ----------
function debris(sc, t, t0, origin, n, col, seed, power=3, r=0.08){
  const dt = t - t0; if (dt<0 || dt>3.2) return;
  for (let i=0;i<n;i++){
    const a = rnd(seed+i*3)*TAU, b = rnd(seed+i*3+1)*Math.PI - Math.PI/2;
    const sp = power*(0.6+rnd(seed+i*3+2));
    const x = origin.x + Math.cos(a)*Math.cos(b)*sp*dt;
    const y = origin.y + Math.sin(b)*sp*dt + (-4.5*dt*dt*0.5*0.6);
    const z = origin.z + Math.sin(a)*Math.cos(b)*sp*dt;
    const rr = r*(1-dt/3.2*0.6);
    sc.add(sphere(2,4,rr,col,{emissive:true}), mTrans(x,Math.max(y,0.02),z));
  }
}
// трейлинг-пыль: светящиеся блики, можно двигать
function sparkles(sc, t, n, cx, cy, cz, wx, wy, wz, col, alpha){
  sc.dust(t, n, cx, cy, cz, wx, wy, wz, col, alpha);
}

// ---------- этапы ----------
function sIntro(g,t,L){
  bg(g,'#05060b','#1a0f24');
  const a = -0.6 + L*0.08;
  const sc = makeScene(g,{eye: v3(Math.sin(a)*4.6, 1.8, Math.cos(a)*4.6), tgt: v3(0,1.0,0), fov:40, fogN:6, fogF:20, fog:'#0a0712', t});
  sc.add(slab(10,10,10,10,'#17121f'), null);
  sc.pool(0,0,1.6,[255,200,140],0.25);
  const sp = 0.5*Math.sin(L*2);
  addMisha(sc, {armR: 10+sp*4, armL: 8, lean: 0, elbR: 0}, {x:0,z:0,yaw:0});
  render(sc);
  stars(g,t,50,11,0.5);
  txt(g,'МИША',W/2,H*0.36,W*0.22,{col:'#ffe8b0',stroke:'#2a0e00',sw:0.1,alpha: win(L,0.4,1.2)});
  txt(g,'против всего',W/2,H*0.455,W*0.05,{col:'#ffffff',stroke:'#000',sw:0.2,alpha: win(L,1.2,2.2)});
}

function sBact(g,t,L){
  bg(g,'#06130f','#0b2a1f');
  const sc = makeScene(g,{eye: v3(0.6,1.9,4.4), tgt: v3(0,0.6,0), fov:50, fogN:3, fogF:12, fog:'#06130f', t});
  sc.add(slab(6,6,6,6,'#2a5a4a'), null);
  const popT = 21;
  const sq = win(L,17,popT) > 0 ? easeOut(win(L,17,popT)) : 0;
  const popped = L >= popT;
  if (!popped) sc.add(bacteriumMesh(t, sq), mTrans(0,0.5,0));
  // нога Миши: опускается, потом елозит по бактерии
  let fy = 6;
  if (L>=8) fy = lerp(6, 0.72, easeIn(win(L,8,12)));
  if (L>=21) fy = lerp(0.72, 6, easeIn(win(L,21.5,24)));
  let fx = 0;
  if (L>=14 && L<21) fx = 0.32*Math.sin((L-14)*3.8);
  const leg = rigMisha({scale:1, pose:{hipR:-6}});
  addPart(sc, leg.parts.legR, {x:fx, y:fy, z:0, s:1.7, shadow:false});
  if (popped){
    debris(sc, t, B1+21, v3(0,0.45,0), 26, [170,240,120], 7, 2.4, 0.06);
  }
  if (!popped) sc.shadow(0,0,0.5,0.4,0.28);
  render(sc);
  // эффект ступни
  if (L<6){ txt(g,'что это за бактерия?',W/2,H*0.7,W*0.04,{col:'#bff7d0',stroke:'#000',alpha:win(L,0.5,1)}); }
}

function sAmoeba(g,t,L){
  bg(g,'#0b1830','#050a16');
  const sc = makeScene(g,{eye: v3(0.8,2.0,6.6), tgt: v3(-0.6,0.7,0), fov:46, fogN:5, fogF:18, fog:'#0a1224', t});
  sc.add(slab(10,10,10,10,'#1d3b5a'), null);
  // амёба
  const amoebaScale = 1 - ease(win(L,7.5,10));
  if (L < 11) sc.add(amoebaMesh(t, sc), M(mTrans(0,0.7,0), mScale(amoebaScale,amoebaScale,amoebaScale)));
  if (L>=7.5 && L<=10.4) sc.shadow(0,0,0.7,0.7,0.2);
  // вирус
  if (L>=11){
    const vs = easeOut(win(L,11,12)) * (L>=16.8 ? 0 : 1);
    if (vs>0) sc.add(virusMesh(t), M(mTrans(0,0.95,0), mScale(vs,vs,vs)));
  }
  // Миша (ударная рука)
  const armUp = trap(L,4.8,5.6,6.4,7.4);
  const kick = trap(L,14.2,15.6,16.2,17.8);
  addMisha(sc, {armR: 0+110*armUp, elbR: 10*armUp, armL: 0, hipR: 95*kick, kneeR:0, lean: -4*kick}, {x:-1.6,z:0.0,yaw:Math.PI/2,s:1.1});
  render(sc);
  // обломки
  if (L>=7.5) debris(sc, t, B2+7.5, v3(0,0.8,0), 16, [210,160,255], 3, 2.0, 0.07);
  if (L>=16.5) debris(sc, t, B2+16.5, v3(0,1.0,0), 18, [190,255,160], 9, 2.8, 0.06);
}

function sFly(g,t,L){
  bg(g,'#2a1e14','#120d08');
  const sc = makeScene(g,{eye: v3(0,2.2,7.4), tgt: v3(0,1.2,0), fov:48, fogN:6, fogF:20, fog:'#1a120a', t});
  sc.add(slab(8,8,8,8,'#4a3018'), null);
  const dead = L>=13;
  const sw = dead ? 0 : 1;
  const fx = sw*Math.sin(L*1.7)*1.4, fz = sw*Math.cos(L*1.1)*0.8 - 0.5, fyb = sw*(1.5+0.4*Math.sin(L*2.3));
  let fy = fyb, fxx=fx, fzz=fz, fr=0;
  if (dead){ const k = win(L,13,16.6); fy = lerp(1.5, 0.1, easeIn(k)); fr = k*Math.PI*0.9; fxx = 0.3; fzz = -0.3; }
  if (L>=16.6) { /* мухи нет */ }
  else {
    sc.add(flyMesh(t), M(mTrans(fxx,fy,fzz), mRotZ(fr), mScale(2.6,2.6,2.6)));
    if (!dead) sc.shadow(fxx,fzz,0.2,0.2,0.25);
  }
  const swat = trap(L,5.4,6.4,6.9,7.6);
  addMisha(sc, {armR: 130*swat, elbR: 30*swat, lean:-6*swat, armL: 20}, {x:0,z:2.4,yaw:Math.PI});
  render(sc);
  if (L>=13.6 && L<=15.2) debris(sc, t, B3s+13.6, v3(0.3,0.2,-0.3), 14, [70,70,80], 5, 1.5, 0.05);
}

function sCat(g,t,L){
  bg(g,'#1b1426','#0c0912');
  const sc = makeScene(g,{eye: v3(2.2,2.6,10.5), tgt: v3(0,0.9,0.6), fov:44, fogN:6, fogF:22, fog:'#0c0912', t});
  sc.add(slab(10,10,10,10,'#2a2233'), null);
  // кот: сидит → бросок → отлетает
  const charge = trap(L,4.8,6.6,8.4,9.8);
  const zc = lerp(-0.4, 0.8, easeIn(win(L,4.8,8.6)));
  const back = L>=9.6 ? easeOut(win(L,9.6,11)) : 0;
  const cz = L>=9.6 ? lerp(0.8, -1.8, back) : zc;
  const cy = charge>0 && L<9.6 ? 0.4*Math.sin(Math.PI*win(L,6,9)) : 0;
  const cs = 1.9*(L>=11.6?0:1)*(L>=11.2?1-win(L,11.2,11.6):1);
  if (cs>0.01){
    const cat = rigCatMesh(t, charge);
    const rot = mRotZ(L>=9.6 ? -0.9*back : 0);
    sc.add(cat, M(mTrans(0,cy,cz), rot, mRotY(Math.PI*0), mScale(cs,cs,cs)));
    sc.shadow(0,cz,0.9*cs/2.4,0.7*cs/2.4,0.25);
  }
  const kick = trap(L,8.6,9.5,10,10.6);
  addMisha(sc, {armR:70, elbR:80, hipR: 95*kick, lean:-4*kick, armL:50, elbL:70}, {x:0,z:2.9,yaw:Math.PI});
  render(sc);
  if (L>=9.5 && L<=12) debris(sc, t, B4+9.6, v3(0,0.9,0.8), 12, [230,200,255], 4, 2.6, 0.06);
}
function rigCatMesh(t, charge){
  // локальная копия rigCat из body51-3d.js (там она не экспортируется напрямую) — через window.B3 нет, поэтому берём из глобала
  return (window.B3 && B3.rigCat) ? B3.rigCat({curl: 0.5+0.3*Math.sin(t*2)}).mesh : sphere(6,8,0.4,'#cdbab2');
}

function sShark(g,t,L){
  bg(g,'#0a2d4a','#041320');
  const sc = makeScene(g,{eye: v3(6.6,2.6,6.8), tgt: v3(0,0.5,0), fov:42, fogN:6, fogF:24, fog:'#06223a', t});
  sc.add(slab(16,16,16,16,'#0f4a6b'), null);
  sc.add(box(1.8,0.25,1.8,'#6b4a2e'), mTrans(0,0.12,0));
  // акула: круг → подлёт → прыжок → удар
  const th = L<9 ? -2.4 + L*0.12 : -2.4;
  const rr = L<9 ? 3.5 : 3.5 - 2.4*trap(L,9,10.6,10.8,11.4);
  let sx = Math.cos(th)*rr, sz = Math.sin(th)*rr;
  let sy = 0.25 + 1.2*Math.sin(Math.PI*win(L,9.2,11.8));
  let yaw = L<9 ? -th+Math.PI/2 : 0;
  if (L>=11.2){ sx = 1.3 + 2.4*easeOut(win(L,11.2,12.5)); sy = 0.8 - 1.6*ease(win(L,12,14)); yaw = 0.4; }
  sc.add(sharkMesh(t), M(mTrans(sx,sy,sz), mRotY(yaw), mScale(1.2,1.2,1.2)));
  if (L<11.2) sc.shadow(sx,sz,0.9,0.4,0.3);
  // Миша на плоту
  const kick = trap(L,9.8,10.9,11.1,11.9);
  addMisha(sc, {armR: 20+30*kick, elbR:10, hipR:105*kick, lean:-6*kick, armL: 25}, {x:0,y:0.25,z:0,yaw:Math.PI/2,s:1.0});
  render(sc);
  // брызги
  if (L>=10.8) for (let i=0;i<8;i++){
    const a = i/8*TAU;
    const dt = L-11;
    sc.add(sphere(2,3,0.09,'#eaf7ff',{emissive:true}), mTrans(1.0+Math.cos(a)*dt*0.9, 0.2+dt*0.8-0.9*dt*dt, Math.sin(a)*dt*0.9));
  }
}

function sDino(g,t,L){
  bg(g,'#f7b77a','#4d2a16');
  const sc = makeScene(g,{eye: v3(6.5,5.2,18.0), tgt: v3(0,2.4,0), fov:40, fogN:24, fogF:80, fog:'#f0b080', t});
  sc.add(slab(24,24,18,18,'#8a6a3a'), null);
  // поза Т-рекса
  const jaw = RAD(25*trap(L,0,1.0,3.4,5.2)) ;
  const lunge = 0.6*trap(L,7,8.2,8.8,9.8);
  const snap = -0.7*trap(L,13,13.6,15,16.4);
  const fall = 1.35*ease(win(L,26.6,28.8));
  const tail = t*2.2;
  const shake = trap(L,12.9,13.1,13.4,13.8)*0.1;
  const dinoPose = {jaw, headPitch: snap, tail};
  const mesh1 = trexMesh(dinoPose);
  const DM = M(mTrans(shake,0,lunge*0.0), mRotX(fall), mScale(1.5,1.5,1.5));
  sc.add(mesh1, DM);
  sc.shadow(0,0,2.4,1.5,0.3);
  // Миша
  const dodge = -1.4*trap(L,6.6,7.4,8.8,9.8);
  const kick = trap(L,11.6,12.6,13.0,14.4);
  const pF = trap(L,17.2,17.6,17.9,18.4), pF2=trap(L,18.1,18.5,18.8,19.3), pF3=trap(L,19.1,19.4,19.7,20.2);
  const punch = Math.max(pF,pF2,pF3);
  const upper = trap(L,25.2,25.8,26.0,26.6);
  const victory = trap(L,28.8,29.5,31.5,32.6);
  const blk = trap(L,20.6,21,22,22.6);
  addMisha(sc, {
    armR: 120*punch + 150*upper + 165*victory + 50*blk - 0, elbR: 40*punch,
    armL: 0 + 60*blk + 150*victory,
    hipR: 100*kick, kneeR: 0, lean: -10*kick - 6*punch,
  }, {x: -1.5 + dodge, z: 3.0, yaw: yawTo(-1.5+dodge,3.0,0,0), s: 1.4});
  render(sc);
  if (L>=13.2) debris(sc, t, B6+13.2, v3(0.6,0.5,1.0), 10, [255,220,120], 6, 1.4, 0.08);
  if (L>=26.2) debris(sc, t, B6+26.2, v3(0.3,0.2,0.8), 22, [200,160,120], 8, 2.8, 0.10);
}

function sWhale(g,t,L){
  bg(g,'#1a4a72','#031427');
  const sc = makeScene(g,{eye: v3(0,2.6,11), tgt: v3(0,1.4,-2), fov:44, fogN:8, fogF:34, fog:'#0a2a44', t});
  sc.add(slab(30,30,20,20,'#0f4a70'), null);
  const jump = trap(L,5.5,7.6,8.8,10.6);
  const wy = -0.2 + 3.6*jump;
  const wz = -4.4 + 0.4*jump;
  sc.add(whaleMesh(t), M(mTrans(0,wy,wz), mRotY(0), mScale(1.2,1.2,1.2)));
  sc.shadow(0,wz,2.6,1.6,0.25);
  const punch = trap(L,9.6,10.4,10.8,11.6);
  addMisha(sc, {armR:150*punch, elbR:20*punch, lean:-8*punch, armL:20},
    {x:0,y:0.25,z:-0.7,yaw:Math.PI,s:1.0});
  render(sc);
  if (L>=10.1 && L<=12) debris(sc, t, B7+10.2, v3(0,1.2,-1.3), 14, [220,240,255], 12, 2.6, 0.08);
}

function sPlanet(g,t,L){
  bg(g,'#0a0620','#02030a');
  const sc = makeScene(g,{eye: v3(1.0,6.4,12.5), tgt: v3(0,2.6,0), fov:42, fogN:20, fogF:60, fog:'#050314', t});
  const shake = trap(L,8.8,9.2,9.6,10.4)*0.12;
  const boom = L<14 ? 1 : 1 - easeOut(win(L,14,15.4));
  const pl = L<14 ? planetMesh() : null;
  if (pl && boom>0.001) sc.add(pl, M(mTrans(shake,0,0), mScale(boom,boom,boom)));
  // кольца тоже вращаются
  // Миша на полюсе
  const kick = trap(L,8.4,9.2,9.6,10.4);
  addMisha(sc, {armR: 40+40*kick, elbR: 15, hipR: 110*kick, armL: 30}, {x:0,y:3.0,z:0, yaw:0, s:0.7});
  render(sc);
  // обломки, искры
  if (L>=14){
    debris(sc, t, B8+14, v3(0,0.2,0), 34, [90,160,240], 21, 5.5, 0.22);
    debris(sc, t, B8+14, v3(0,0.2,0), 22, [88,190,110], 77, 4.5, 0.18);
  }
  sparkles(sc, t, 30, 0,1,0,16,12,16,'#e8f7ff',0.8);
  // фонарь сзади
  if (L<4) txt(g,'Ну ладно, поехали',W/2,H*0.16,W*0.045,{col:'#dbe9ff',stroke:'#000',alpha:win(L,0.2,1)});
}

function sDed(g,t,L){
  bg(g,'#0b0f1e','#14100e');
  stars(g,t,70,33,0.6);
  const sc = makeScene(g,{eye: v3(0,13.5,46), tgt: v3(0,11.5,0), fov:42, fogN:48, fogF:140, fog:'#0c0e18', t});
  sc.add(slab(80,80,20,20,'#2b2f3c'), null);
  // Дед (масштаб 12)
  const tea = trap(L,0.6,1.8,4.0,5.2);
  const fist = trap(L,6.0,8.8,9.5,10.4);
  const lie = easeOut(win(L,24,29.5));
  const fallA = 1.45*ease(win(L,23.6,30.2));
  const glasses = L < 21;
  const pose = {
    armR: 80*tea, elbR: 100*tea,
    armL: 140*fist, elbL: 30*fist,
    lean: -6*tea + 4*Math.sin(t*0.6),
    head: -6*fist,
  };
  const grand = rigMisha({scale:1, pose, shirt:'#7a3a2a', hair:'#dcdcdc', skin:'#e4b898', beard:true, beardCol:'#e6e6e6', glasses});
  const GM = M(mRotX(fallA), mScale(12,12,12));
  sc.add(grand.all, GM);
  sc.shadow(0,0,9,6,0.22);
  // Миша: прилетает к лицу Деда и пинает очки
  const fly = easeOut(win(L,12,19.5));
  const ax = lerp(-6, -0.9, fly), ay = lerp(0, 19.6, fly), az = lerp(16, 3.4, fly);
  const kick = trap(L,20.2,21.0,21.4,22.6);
  addMisha(sc, {armR: 140*kick, elbR:0, hipR: 110*kick, lean:-8*kick, armL: 40+30*Math.sin(t*6)*fly}, {x:ax,y:ay,z:az,yaw:Math.PI,s:1.0, shadow: L<19});
  // уничтоженные очки — летят
  if (L>=21 && L<=24.5){
    const dt=(L-21);
    sc.add(torus(7,0.014,0.06,'#2b3448'), M(mTrans(0.7+dt*2.4,20.2+dt*5-4.5*dt*dt*0.9,1.0+dt*1.4), mRotX(dt*9), mScale(4,4,4)));
  }
  render(sc);
  if (L>=9.6 && L<=12) debris(sc, t, B9+9.8, v3(0,0.1,11), 30, [160,130,100], 13, 4.5, 0.3);
}

function sSun(g,t,L){
  bg(g,'#1a0600','#000000');
  stars(g,t,60,52,0.5);
  const sc = makeScene(g,{eye: v3(0,1.6,10.5), tgt: v3(0,1.6,-2), fov:40, fogN:30, fogF:90, fog:'#050000', t});
  const flare = L>=10.8 ? 0 : 1;
  // корона и диск — светятся
  sc.add(sphere(12,18,3.2,'#ffb23f',{emissive:true}), mTrans(0,1.8,-6));
  sc.add(sphere(10,16,3.9,'#ff7a1a'), mTrans(0,1.8,-6), {emissive:true, additive:true, alpha:0.28});
  sc.add(sphere(10,16,4.9,'#ff5a10'), mTrans(0,1.8,-6), {emissive:true, additive:true, alpha:0.14});
  // протуберанец-арка
  const N=18, arcCol='#ffd28a';
  if (flare){
    for (let i=0;i<N;i++){
      const u = i/(N-1);
      const x = lerp(-1.0,-0.5,u) + 0.2*Math.sin(t*2+i);
      const y = 0.7 + 3.4*Math.sin(Math.PI*u)*(0.8+0.2*Math.sin(t*3));
      const z = lerp(-3.2,2.0,u);
      sc.add(sphere(3,5,0.22,arcCol,{emissive:true}), mTrans(x,y,z));
    }
  }
  const kick = trap(L,8.8,9.6,10.2,10.8);
  addMisha(sc, {armR: 60+60*kick, elbR:0, hipR:105*kick, lean:-8*kick},{x:0.0,y:0,z:3.4,yaw:Math.PI,s:0.9});
  render(sc);
  if (L>=10.8 && L<=13.8) debris(sc, t, B10+10.8, v3(0,1.6,1.0), 18, [255,190,90], 17, 3.0, 0.14);
  // вспышка от удара — глобальный флеш в frame()
}

function sGalaxy(g,t,L){
  bg(g,'#0a0118','#000003');
  stars(g,t,120,71,0.7);
  const sc = makeScene(g,{eye: v3(0,7.2,17), tgt: v3(0,0,-1), fov:44, fogN:24, fogF:70, fog:'#000004', t});
  const collapse = L<16 ? 1 : (L<21 ? lerp(1, 0.3, ease(win(L,16,21))) : (L<23 ? 0.3 : 0.3 + 2.4*ease(win(L,23,28))));
  const alpha = L<23 ? 0.92 : 0.92*(1-win(L,25,28.5));
  const spin = t*0.35 + (L>=21 ? (L-21)*0.7 : 0);
  const gal = M(mRotY(spin), mRotX(-0.55), mScale(collapse,collapse,collapse));
  if (alpha > 0.02) sc.add(GAL, gal, {additive:true, alpha});
  // Миша: стоит перед галактикой, бьёт кулаком в центр
  const punch = trap(L,18.5,20.0,20.6,21.6);
  addMisha(sc, {armR: 160*punch, elbR: 0, lean:-6*punch, armL: 30, hipR: 0}, {x:0,y:0,z:9.0,yaw:Math.PI,s:0.55, shadow:false});
  render(sc);
  // «ВСЁ»
  if (L>=20.5 && L<=23) sparkles(sc, t, 20, 0, 0, 0, 10, 4, 10, '#ffffff', 0.9);
}

function sFinale(g,t,L){
  bg(g,'#06020e','#0c0c1e');
  stars(g,t,140,91,0.8);
  const a = L*0.22;
  const sc = makeScene(g,{eye: v3(Math.sin(a)*5.2, 2.6, Math.cos(a)*5.2 + 0.2), tgt: v3(0,1.5,0), fov:42, fogN:10, fogF:40, fog:'#0a0a18', t});
  sc.add(slab(20,20,20,20,'#1a1426'), null);
  const cheer = trap(L,0.6,1.6,25,28);
  addMisha(sc, {armR: 170*cheer, armL: 170*cheer, elbR:0, elbL: 0, lean: -4*cheer}, {x:0,y:0,z:0,yaw:0,s:1.0});
  render(sc);
  sparkles(sc, t, 30, 0, 2.0, 0, 6, 4, 6, '#ffd27a', 0.9);
  txt(g,'МИША ПОБЕДИЛ',W/2,H*0.2,W*0.11,{col:'#ffe06a',stroke:'#2a0e00',sw:0.12,alpha: win(L,1.0,3.0)});
  if (L>=20) txt(g,'Звук — синтез. Картинка — код.',W/2,H*0.92,W*0.035,{col:'#c9d4ff',stroke:'#000',sw:0.2,alpha: win(L,20,22)});
}

const DRAW = [sIntro,sBact,sAmoeba,sFly,sCat,sShark,sDino,sWhale,sPlanet,sDed,sSun,sGalaxy,sFinale];

function stageAt(t){
  for (let i=0;i<STAGES.length;i++) if (t < STAGES[i].t1 || i===STAGES.length-1) return i;
  return STAGES.length-1;
}
// HUD: полоска этапов, название, размер
function hud(g,t,i){
  const S = STAGES[i];
  const n = STAGES.length, bw = W*0.062, gap = W*0.008, x0 = (W - (n*bw + (n-1)*gap))/2;
  for (let k=0;k<n;k++){
    g.fillStyle = k<i ? 'rgba(255,255,255,0.35)' : (k===i ? '#ffe06a' : 'rgba(255,255,255,0.12)');
    g.fillRect(x0+k*(bw+gap), H*0.035, bw, H*0.006);
  }
  if (i>0 || t>0.7){
    txt(g,S.name,W*0.05,H*0.07,W*0.034,{align:'left',col:'#ffffff',stroke:'#000',sw:0.2});
    txt(g,'размер: '+S.size,W*0.05,H*0.105,W*0.026,{align:'left',col:'#cfd6e6',stroke:'#000',sw:0.2,weight:600});
  }
  const pct = clamp((t - S.t0)/(S.t1 - S.t0));
  g.fillStyle='rgba(255,255,255,0.18)'; g.fillRect(W*0.05, H*0.96, W*0.9, H*0.004);
  g.fillStyle='#ffe06a'; g.fillRect(W*0.05, H*0.96, W*0.9*pct, H*0.004);
}
function captions(g,t){
  for (const c of CAPS){
    if (t < c.t0 || t > c.t1) continue;
    const dt = t - c.t0, out = clamp((c.t1 - t)/0.3);
    const sc = 1 + 0.18*Math.exp(-dt*10);
    const fs = c.big ? W*0.075 : W*0.04;
    const y = c.pos==='top' ? H*0.19 : (c.pos==='center' ? H*0.5 : H*0.86);
    // полупрозрачная плашка
    txt(g, c.text, W/2, y, fs, {col: c.big ? '#ffe06a' : '#ffffff', stroke:'#000', sw: c.big?0.16:0.2, alpha: Math.min(1, out, dt*6), scale: sc});
  }
}
function hitWords(g,t){
  for (const h of HITS){
    if (!h.w) continue;
    const dt = t - h.t; if (dt<0 || dt>0.7) continue;
    const sc = 0.6 + 0.9*easeOut(dt*4) + 0.3*Math.exp(-dt*6);
    const rot = (rnd(h.t*100)-0.5)*0.25;
    txt(g, h.w, W/2 + (rnd(h.t*31)-0.5)*W*0.12, H*0.42, W*0.2, {col:'#fff1a0', stroke:'#7a0a00', sw:0.2, rot, scale: sc, alpha: 1 - dt/0.7});
  }
}

// ---------- кадр ----------
function frame(g, t){
  if (W===0) return;
  const i = stageAt(t);
  const S = STAGES[i];
  const L = Math.max(0, t - S.t0);
  g.setTransform(1,0,0,1,0,0);
  // тряска и вспышки от ударов
  let sx=0, sy=0, fl=0;
  for (const h of HITS){
    const dt = t - h.t; if (dt<0 || dt>0.6) continue;
    const k = h.s==='big' ? 1 : (h.s==='hit' ? 0.5 : 0.0);
    const a = k*Math.exp(-dt*9);
    sx += Math.sin(t*90+h.t)*a*W*0.012;
    sy += Math.cos(t*77)*a*H*0.008;
    if (h.s==='big') fl = Math.max(fl, 0.55*Math.exp(-dt*10));
    if (h.s==='hit') fl = Math.max(fl, 0.2*Math.exp(-dt*12));
  }
  g.save(); g.translate(sx,sy);
  DRAW[i](g, t, L);
  g.restore();
  if (fl>0){ g.fillStyle=`rgba(255,255,255,${fl})`; g.fillRect(0,0,W,H); }
  // затемнение в начале и конце фильма
  const fade = Math.min(1, t/0.6, (DUR-t)/0.8);
  if (fade<1){ g.fillStyle=`rgba(0,0,0,${1-Math.max(0,fade)})`; g.fillRect(0,0,W,H); }
  hitWords(g,t);
  captions(g,t);
  hud(g,t,i);
}

window.MISHA = {
  STAGES, HITS, CAPS, DUR,
  frame,
  setSize(w,h){ W=w; H=h; },
  get size(){ return {W,H}; },
};
})();
