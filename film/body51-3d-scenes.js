/* body51-3d-scenes.js — 12 глав мультфильма «Вайбкодер из Мурманска» в 3D.
   Композиция: 3D занимает весь кадр (комнаты-коробки, широкие земли, туман под цвет неба),
   кадр 1080×1920; подписи живут в нижней полосе (их рисует body51-film.js/body51-run.js). */
(function(){
const B3=window.B3;
const {v3,vadd,vsub,vmul,vnorm,vlerp,clamp,lerp,rad,mTrans,mMul,mRotX,mRotY,mRotZ,mScale,mIdent,xform}=B3;
const AMBER='#ffc06a',MINT='#7fe0c0',VIOLET='#b07cff',PAPER='#f2eee4';

// ---------- общие строители ----------
// комната-коробка: 4 стены + потолок + пол, чтобы кадр нигде не был пустым
function room(sc,o={}){
  const w=o.w||9,d=o.d||8,h=o.h||2.75;
  const wall=o.wall||'#241d31',floor=o.floor||'#463654',ceil=o.ceil||'#191426';
  sc.add(B3.slab(w+0.4,d+0.4,7,7,floor),mTrans(0,0,0));
  sc.add(B3.slab(w,d+0.4,5,5,ceil),mTrans(0,h,0));
  sc.add(B3.box(w,0.2,d,o.skirting||'#1a1626'),mTrans(0,0.1,0));
  sc.add(B3.wall(w,h,7,4,wall),mTrans(0,h/2,-d/2));      // задняя
  sc.add(B3.wall(w,h,7,4,wall),mMul(mTrans(0,h/2,d/2),mRotY(Math.PI)));  // передняя
  sc.add(B3.wall(d,h,6,4,wall),mMul(mTrans(-w/2,h/2,0),mRotY(Math.PI/2)));// левая
  sc.add(B3.wall(d,h,6,4,wall),mMul(mTrans(w/2,h/2,0),mRotY(-Math.PI/2)));// правая
  // плинтус-подсветка по периметру — «вайб»
  if(o.led!==false){sc.add(B3.box(w-0.3,0.03,0.03,o.ledCol||'#7fe0c0',{emissive:true,glow:.35}),mTrans(0,0.22,-d/2+0.1));
    sc.add(B3.box(0.03,0.03,d-0.3,o.ledCol||'#7fe0c0',{emissive:true,glow:.3}),mTrans(-w/2+0.1,0.22,0));}
  return{wall,floor,ceil,w,d,h};
}
// окно на задней стене: 2D-подложка + рама со шпросами
function window3(sc,o={}){
  const x=o.x||-2.2,y=o.y||1.75,w=o.w||1.9,h=o.h||1.3,z=o.z==null?-5.95:o.z;
  sc.add(B3.box(w+0.16,h+0.16,0.1,'#150f1e'),mTrans(x,y,z-0.02));
  const quad=[v3(x-w/2,y+h/2,z),v3(x+w/2,y+h/2,z),v3(x+w/2,y-h/2,z),v3(x-w/2,y-h/2,z)];
  sc.add(B3.box(0.05,h,0.08,'#241c2e'),mTrans(x,y,z-0.01));
  sc.add(B3.box(w,0.05,0.08,'#241c2e'),mTrans(x,y,z-0.01));
  sc.add(B3.box(w+0.3,0.07,0.3,'#2e2438'),mTrans(x,y-h/2-0.06,z+0.06)); // подоконник
  return{quad};
}
// стол
function desk(sc,o={}){
  const x=o.x||0,y=o.y||0.74,z=o.z||0,w=o.w||2.8,d=o.d||1.2,rot=o.rot||0;
  const M=mMul(mTrans(x,y,z),mRotY(rot));
  sc.add(B3.box(w,0.08,d,o.col||'#4b3a2d',{top:o.top||'#634d3a'}),M);
  for(const [sx,sz] of [[-(w/2-0.14),-(d/2-0.14)],[(w/2-0.14),-(d/2-0.14)],[-(w/2-0.14),(d/2-0.14)],[(w/2-0.14),(d/2-0.14)]])
    sc.add(B3.box(0.08,y,0.08,'#33281f'),mMul(M,mTrans(sx,-y/2,sz)));
  return M;
}
// монитор: корпус + подставка + возвращает квад экрана (мир)
function monitor(sc,o={}){
  const x=o.x||0,y=o.y||1.35,z=o.z||0,w=o.w||1.6,h=o.h||0.95,rot=o.rot||0;
  const M=mMul(mTrans(x,y,z),mRotY(rot));
  sc.add(B3.box(w+0.06,h+0.06,0.07,'#1b2230'),M);
  sc.add(B3.box(0.1,o.neck||0.36,0.1,'#20242f'),mMul(M,mTrans(0,-h/2-0.2,0)));
  sc.add(B3.box(0.46,0.05,0.3,'#20242f'),mMul(M,mTrans(0,-h/2-0.37,0.06)));
  const quad=[[-w/2+0.05,h/2-0.05,0.05],[w/2-0.05,h/2-0.05,0.05],[w/2-0.05,-h/2+0.05,0.05],[-w/2+0.05,-h/2+0.05,0.05]]
    .map(q=>xform(M,v3(q[0],q[1],q[2])));
  return{quad,M};
}
// 3D-принтер: корпус, окно, катушка, сопло, стол
function printerRig(scale=1){
  const m=B3.mesh();
  const body=B3.box(0.62,0.72,0.5,'#242b3c',{top:'#303a4e'});
  B3.addMesh(m,{verts:body.verts.map(v=>xform(mTrans(0,0,0),v)),faces:body.faces});
  const win=B3.box(0.46,0.4,0.02,'#0f1524');B3.addMesh(m,{verts:win.verts.map(v=>xform(mTrans(0,0.04,0.26),v)),faces:win.faces});
  const glow=B3.box(0.4,0.05,0.02,'#7fe0c0',{emissive:true,glow:.5});
  B3.addMesh(m,{verts:glow.verts.map(v=>xform(mTrans(0,-0.12,0.27),v)),faces:glow.faces});
  const spool=B3.torus(10,0.05,0.16,'#8a6ad0');B3.addMesh(m,{verts:spool.verts.map(v=>xform(mMul(mTrans(0.34,0.24,0),mRotY(Math.PI/2)),v)),faces:spool.faces});
  const leg=B3.box(0.5,0.05,0.4,'#1b2130');B3.addMesh(m,{verts:leg.verts.map(v=>xform(mTrans(0,-0.38,0.02),v)),faces:leg.faces});
  if(scale!==1)B3.addMesh(m,{verts:m.verts.map(v=>vmul(v,scale)),faces:m.faces});
  return m;
}
function shelf(sc,o={}){
  const x=o.x||-3.0,y=o.y||1.0,z=o.z||-5.6,w=o.w||2.6;
  sc.add(B3.box(w,0.07,0.62,'#33263c',{top:'#3f2f4a'}),mTrans(x,y,z));
  sc.add(B3.box(w,0.05,0.05,'#241a2e'),mTrans(x,y-0.06,z+0.3));
}
// растение под фиолетовым светом
function plant(sc,x,z,scale=1){
  sc.add(B3.prism(7,0.11*scale,0.24*scale,'#2c2233'),mTrans(x,0.12*scale,z));
  for(let k=0;k<5;k++){
    const M=mMul(mMul(mTrans(x,0.24*scale,z),mRotY(k*1.3)),mRotZ((k-2)*0.42));
    sc.add(B3.prism(5,0.035*scale,0.5*scale,'#3f7a58',{top:'#57a06f'}),mMul(M,mTrans(0,0.25*scale,0)));
  }
}
// кружка
function mug(sc,x,y,z,col='#e8e2d6'){
  sc.add(B3.prism(10,0.055,0.13,col),mTrans(x,y+0.065,z));
  sc.add(B3.torus(8,0.012,0.035,col),mMul(mTrans(x+0.06,y+0.07,z),mRotY(Math.PI/2)));
}
// чат/код/панели — рисуются в run.js; здесь только «экраны»
const S3={};
S3.help={room,window3,desk,monitor,printerRig,shelf,plant,mug};


// робо-рука, которая сама печатает релиз
function roboArm(sc,o,t){
  const base=mMul(mTrans(o.x,0,o.z),mScale(o.s||1,o.s||1,o.s||1));
  sc.add(B3.prism(10,0.30,0.12,'#3f4a63',{top:'#525f7c'}),mMul(base,mTrans(0,0.06,0)));
  sc.add(B3.prism(10,0.12,0.8,'#556180'),mMul(base,mTrans(0,0.5,0)));
  const a1=Math.sin(t*1.5)*0.10-0.22;
  const shoulder=mMul(base,mMul(mTrans(0,1.05,0),mRotX(a1)));
  sc.add(B3.prism(10,0.088,0.72,'#657192'),mMul(shoulder,mTrans(0,0.36,0)));
  const a2=0.92+Math.sin(t*2.0+0.6)*0.12;
  const elbow=mMul(shoulder,mMul(mTrans(0,0.72,0),mRotX(a2)));
  sc.add(B3.prism(10,0.075,0.6,'#7b87a8'),mMul(elbow,mTrans(0,0.3,0)));
  const wrist=mMul(elbow,mTrans(0,0.6,0));
  sc.add(B3.box(0.24,0.11,0.3,'#39415a',{top:'#485178'}),mMul(wrist,mTrans(0,0.05,0)));
  for(const sd of [-1,1]){
    const k=Math.max(0,Math.sin(t*6.5+sd*1.3))*0.05;
    sc.add(B3.prism(6,0.032,0.24,'#cfe0f5'),mMul(wrist,mMul(mTrans(sd*0.075,-0.10-k,0.07),mRotX(0.25))));
    sc.add(B3.torus(8,0.012,0.05,'#7fe0c0',{emissive:true,glow:.6}),mMul(wrist,mTrans(sd*0.075,0.02,0.07)));
  }
  sc.add(B3.sphere(5,7,0.05,'#7fe0c0',{emissive:true,glow:.8}),mMul(wrist,mTrans(0,0.0,0.16)));
  return wrist;
}
// ================= 1. Мурманск =================
S3.polar=(sc,u,t)=>{
  // снежная земля + двор
  sc.add(B3.box(80,0.2,80,'#dbe4f2',{top:'#eaf1fb'}),mTrans(0,-0.1,0));
  for(let i=0;i<12;i++){const a=i*1.31,r=10+((i*37)%9);
    sc.add(B3.sphere(4,7,0.55+0.3*((i*29)%7)/7,'#e8eefa'),mMul(mTrans(Math.cos(a)*r,-0.12,Math.sin(a)*r-6),mScale(1,0.45,1)))}
  // три панельки
  const house=(x,z,w,h,d,rot,lit,warm,seed)=>{
    const M=mMul(mTrans(x,h/2,z),mRotY(rot));
    sc.add(B3.box(w,h,d,'#4a4270',{top:'#5a5286'}),M);
    sc.add(B3.box(w+0.2,0.3,d+0.2,'#2a2a44'),mMul(M,mTrans(0,h/2+0.15,0)));
    for(let fx=-4;fx<=4;fx++)for(let fy=0;fy<7;fy++){
      const on=((fx*3+fy*7+seed*5)%5)<2;
      const col=on?(warm?'#ffd08a':'#4a6a9c'):'#212a44';
      sc.add(B3.box(0.5,0.6,0.06,col,{emissive:on,glow:on?.16:0}),mMul(M,mTrans(fx*w*0.19,-h/2+1.3+fy*1.15,d/2+0.04)));
    }
    return M;
  };
  house(-6.2,0.0,16,19,6,0.08,true,false,1);
  house(6.0,-2.5,9,14,7,-0.06,true,false,2);
  house(0.5,10.5,15,10,6,Math.PI,false,false,3);
  // «наше» окно — единственное тёплое, с силуэтом
  const winM=mMul(mMul(mTrans(-6.2,3.5,3.02),mRotY(0.08)),mTrans(0,0,0.06));
  sc.add(B3.box(1.5,1.6,0.2,'#3d2f4e'),winM);
  sc.add(B3.box(1.28,1.36,0.08,'#ffd79a',{emissive:true,glow:.5}),mMul(winM,mTrans(0,0,0.09)));
  sc.add(B3.box(0.36,0.78,0.14,'#2b2136'),mMul(winM,mTrans(-0.22,-0.16,0.14)));
  sc.add(B3.sphere(6,9,0.2,'#2b2136'),mMul(winM,mTrans(-0.22,0.28,0.14)));
  const winQuad=[[-0.6,0.64,0.14],[0.6,0.64,0.14],[0.6,-0.64,0.14],[-0.6,-0.64,0.14]].map(q=>xform(winM,v3(q[0],q[1],q[2])));
  // фонарь + скамейка + качели-«вайб»
  sc.add(B3.prism(8,0.08,4.6,'#242b3d'),mTrans(-2.6,2.3,-2.6));
  sc.add(B3.box(0.34,1.1,0.34,'#2c3448'),mTrans(-2.6,4.2,-2.6));
  sc.add(B3.box(0.5,0.2,0.5,'#ffe0ab',{emissive:true,glow:.65}),mTrans(-2.6,4.05,-2.6));
  sc.add(B3.box(1.7,0.09,0.45,'#3a4358'),mTrans(-3.6,0.5,-1.2));
  for(const s of [-1,1])sc.add(B3.box(0.08,0.5,0.4,'#2f374a'),mTrans(-3.6+s*0.75,0.25,-1.2));
  // сугробы у стены дома и фонарь перед подъездом
  for(let i=0;i<5;i++)sc.add(B3.sphere(5,9,0.5+i*0.06,'#eef3fc'),mMul(mTrans(-8.4+i*1.5,-0.05,3.9),mScale(1.6,0.5,1.1)));
  sc.add(B3.prism(8,0.07,3.6,'#3a4152'),mTrans(-8.0,1.8,3.6));
  sc.add(B3.box(0.42,0.16,0.42,'#ffe6b8',{emissive:true,glow:.8}),mTrans(-8.0,3.55,3.6));
  sc.add(B3.box(1.9,0.9,0.16,'#2a2438'),mTrans(-8.0,1.1,4.05));
  // медленный проезд к окну
  const a=lerp(0.5,-0.1,u),r=lerp(7.6,5.8,u),y=lerp(5.0,4.4,u);
  sc.camera(v3(-6.2+Math.sin(a)*r,y,3.0+Math.cos(a)*r),v3(-6.2,lerp(4.1,4.3,u),3.0),lerp(46,40,u));
  sc.fog(16,54,'#16233f');
  return{winQuad,probe:{c:v3(-6.2,3.9,3.2),up:v3(-6.2,4.9,3.2)},glows:[
    {p:v3(-6.2,3.9,3.4),r:320,col:'#ffb060',a:.5},
    {p:v3(-8.0,3.55,3.6),r:300,col:'#ffd08a',a:.5},
    {p:v3(-2.6,4.05,-2.6),r:240,col:'#ffd08a',a:.35},
    {p:v3(-6.2,3.9,3.3),r:140,col:'#fff0c8',a:.5},
    {p:v3(-7.0,6.2,3.3),r:150,col:'#ffcf8a',a:.35}]};
};
// ================= 2. Кот Гуччи =================
S3.cat=(sc,u,t)=>{
  const R=room(sc,{w:12,d:12,h:2.9,wall:'#3d2f4e',floor:'#463456',ceil:'#2a1f38',ledCol:'#ffc06a'});
  // кухонный «остров»: узкая вертикальная композиция вокруг кота
  sc.add(B3.box(3.2,0.9,1.0,'#4a3a52',{top:'#5b4a63'}),mTrans(-0.5,0.45,-1.6));  // тумба
  sc.add(B3.box(3.4,0.08,1.1,'#634d6a',{top:'#71587a'}),mTrans(-0.5,0.94,-1.6)); // столешница
  // мойка и кран (кот пьёт из-под крана)
  sc.add(B3.box(1.0,0.12,0.8,'#6c7686',{top:'#7d8896'}),mTrans(-0.6,0.99,-1.6));
  sc.add(B3.box(0.8,0.1,0.6,'#20202a'),mTrans(-0.6,0.96,-1.6));
  sc.add(B3.prism(8,0.035,0.62,'#c8ccd6'),mTrans(-0.6,1.35,-1.95));
  sc.add(B3.prism(8,0.03,0.3,'#c8ccd6'),mMul(mTrans(-0.6,1.68,-1.95),mRotX(0.6)));
  sc.add(B3.torus(10,0.02,0.05,'#c8ccd6'),mMul(mTrans(-0.6,1.78,-1.78),mRotX(1.1)));
  // миска с водой + кружка
  sc.add(B3.prism(14,0.3,0.06,'#cfd6e2'),mTrans(-1.05,0.99,-1.5));
  sc.add(B3.sphere(12,16,0.25,'#8fd3ff',{emissive:true,glow:.15}),mMul(mTrans(-1.05,1.01,-1.5),mScale(1,0.3,1)));
  mug(sc,0.35,0.98,-1.4,'#ffd8a0');
  sc.add(B3.sphere(7,10,0.16,'#c9ccd4'),mMul(mTrans(0.75,1.08,-1.85),mScale(1,0.95,1)));  // чайник
  // кормушка «Валера» — вертикально, справа, ближе к камере
  sc.add(B3.box(0.8,0.6,0.65,'#2d3345',{top:'#39415a'}),mTrans(0.95,0.3,-0.75));
  sc.add(B3.box(0.46,0.26,0.05,'#0c1018'),mTrans(0.95,0.48,-0.4));
  sc.add(B3.box(0.4,0.2,0.04,'#7fe0c0',{emissive:true,glow:.4}),mTrans(0.95,0.48,-0.37));
  sc.add(B3.prism(12,0.24,0.1,'#6c7686'),mTrans(0.95,0.68,-0.75));
  for(let i=0;i<12;i++)sc.add(B3.sphere(4,6,0.035,'#c8a86a'),mTrans(0.95+Math.sin(i*2.3)*0.14,0.72,-0.75+Math.cos(i*1.7)*0.13));
  // полки сверху и по бокам — «дом, а не пустота»
  sc.add(B3.box(1.0,0.72,0.5,'#3a2b44',{top:'#493757'}),mTrans(-1.5,2.1,-2.9));
  sc.add(B3.box(1.0,0.72,0.5,'#3a2b44',{top:'#493757'}),mTrans(0.9,2.1,-2.9));
  for(let i=0;i<4;i++){const M=mMul(mTrans(0.6+i*0.22,1.6,-2.6),mRotY(i*0.5));
    sc.add(B3.prism(7,0.05,0.2,['#c86a4a','#d9a24a','#7fa06a','#a06a9a'][i]),M);}
  // лесенка для кота и коврик
  for(let i=0;i<3;i++)sc.add(B3.box(0.4,0.05,0.46,i%2?'#4b3a2d':'#634d3a'),mTrans(1.7+i*0.3,0.16+i*0.24,0.2));
  // кот у миски
  const cat=B3.rigCat({curl:0.9,eyes:'#4f9a72'});
  sc.add(cat.mesh,mMul(mMul(mTrans(-1.05,0.985,-1.35),mRotY(-0.35)),mIdent()));
  sc.shadow(-1.05,-1.35,0.45,0.34,0.34);
  sc.add(B3.sphere(6,9,0.09,'#cdbab2'),mMul(mTrans(-0.35,1.0,-1.1),mScale(1,0.7,1.4)));   // лапа у края
  const ph=((t*0.8)%1.0)/1.0;
  sc.add(B3.sphere(5,7,0.05,'#bfe3ff',{emissive:true,glow:.45}),mTrans(-0.6,1.7-ph*0.62,-1.78));
  // камера: плавный наезд, кот в центре, видно кран и «Валера»
  const d=lerp(4.6,3.5,u);
  sc.camera(v3(0.25+Math.sin(0.35+u*0.35)*d*0.85,lerp(1.55,1.25,u),-0.7+Math.cos(0.35+u*0.35)*d*0.7),v3(-0.45,lerp(1.0,1.05,u),-1.45),lerp(52,47,u));
  sc.fog(4,26,'#241a30');
  return{dust:{n:16,c:[-0.4,1.2,-1.4],w:[2.6,1.4,2.2],a:.42},probe:{c:v3(-0.7,1.05,-1.5),up:v3(-0.7,2.05,-1.5)},glows:[
    {p:v3(0.95,0.48,-0.37),r:110,col:'#7fe0c0',a:.5},
    {p:v3(-1.05,1.01,-1.5),r:110,col:'#8fd3ff',a:.4},
    {p:v3(-0.6,1.75,-1.8),r:90,col:'#bfe3ff',a:.3},
    {p:v3(-1.0,0.25,-3.4),r:230,col:'#ffc06a',a:.3},
    {p:v3(4.6,0.25,-3.4),r:230,col:'#ffc06a',a:.3},
    {p:v3(-1.5,2.3,-2.9),r:180,col:'#ffc06a',a:.25}]};
};

// ================= 3. Мастерская =================
S3.workshop=(sc,u,t)=>{
  const R=room(sc,{w:13,d:12,h:3.0,wall:'#333b52',floor:'#33354a',ceil:'#232a3c',ledCol:'#7fe0c0'});
  const win=window3(sc,{x:-3.0,y:1.8,w:1.6,h:1.2});
  // верстак
  const D=desk(sc,{x:0.2,z:-1.4,w:3.4,d:1.5,col:'#3f4457',top:'#4d5364'});
  // стол с монитором и клавиатурой
  const M2=monitor(sc,{x:1.2,y:1.42,z:-2.5,w:1.7,h:1.0});
  sc.add(B3.box(1.05,0.05,0.36,'#1b1f29'),mTrans(1.15,0.86,-1.5));
  sc.add(B3.sphere(5,8,0.1,'#1b1f29'),mMul(mTrans(2.0,0.87,-1.45),mScale(1,0.4,1.4)));
  // полки с принтерами (7 штук) + детали
  shelf(sc,{x:-3.0,y:1.5,z:-3.4,w:2.7});
  shelf(sc,{x:-3.0,y:0.95,z:-3.4,w:2.7});
  const ps=[];
  for(let i=0;i<3;i++)ps.push([-3.85+i*0.85,1.55,-3.4,0.72]);
  for(let i=0;i<2;i++)ps.push([-3.55+i*0.85,1.0,-3.4,0.72]);
  for(let i=0;i<2;i++)ps.push([3.2,0.9+i*1.0,-3.3,0.8]);
  for(const [x,y,z,s] of ps){
    sc.add(printerRig(),mMul(mTrans(x,y,z),mScale(s,s,s)));
    sc.add(B3.box(0.5,0.02,0.4,'#12161f'),mTrans(x,y-0.36,z+0.06));
  }
  // ящики/коробки с надписями и катушки филамента
  for(let i=0;i<4;i++)sc.add(B3.box(0.5,0.34,0.4,'#4a3a2c',{top:'#5d4a37'}),mTrans(2.9,0.17+ (i>1?0.36:0),-3.0+(i%2)*0.5));
  for(let i=0;i<5;i++)sc.add(B3.torus(10,0.05,0.16,['#8a6ad0','#4ac8a0','#ff8a5c','#d0c060','#6a9ad0'][i]),mMul(mTrans(-4.2,2.3- (i%3)*0.42,-2.4),mRotY(Math.PI/2)));
  for(let i=0;i<5;i++)sc.add(B3.prism(8,0.02,0.6,'#6a7286'),mMul(mTrans(-4.2,2.5,-2.35),mRotZ(i*0.2-0.4)));
  // велотренажёр-вешалка + гиря + турник
  const bike=mMul(mTrans(-2.6,0,0.6),mRotY(1.1));
  sc.add(B3.box(1.4,0.08,0.2,'#2b3244'),mMul(bike,mTrans(0,1.0,0)));
  sc.add(B3.torus(12,0.05,0.32,'#3a4256'),mMul(bike,mTrans(-0.45,0.34,0)));
  sc.add(B3.torus(12,0.05,0.32,'#3a4256'),mMul(bike,mTrans(0.5,0.34,0)));
  sc.add(B3.box(0.5,0.08,0.4,'#4a5470'),mMul(bike,mTrans(0.1,1.3,0)));
  sc.add(B3.prism(8,0.05,0.6,'#39415a'),mMul(bike,mMul(mTrans(0,1.05,0),mRotZ(0.4))));
  sc.add(B3.sphere(7,10,0.19,'#2f3849'),mTrans(-2.0,0.19,0.9));
  sc.add(B3.torus(8,0.035,0.12,'#59627a'),mMul(mTrans(-2.0,0.42,0.9),mRotZ(Math.PI/2)));
  sc.add(B3.prism(8,0.05,2.4,'#39415a'),mTrans(-4.0,1.2,2.4));
  sc.add(B3.prism(8,0.05,2.4,'#39415a'),mTrans(-1.6,1.2,2.4));
  sc.add(B3.prism(8,0.05,2.7,'#39415a'),mMul(mTrans(-2.8,2.4,2.4),mRotZ(Math.PI/2)));
  // принтер на верстаке, катушка, паяльная станция, детали
  sc.add(printerRig(),mMul(mTrans(-1.5,1.13,-1.4),mScale(0.9,0.9,0.9)));
  sc.add(B3.torus(12,0.05,0.16,'#8a6ad0'),mMul(mTrans(1.6,0.98,-1.3),mRotY(Math.PI/2)));
  sc.add(B3.box(0.4,0.28,0.3,'#2b3244',{top:'#39415a'}),mTrans(2.2,0.92,-1.4));
  sc.add(B3.prism(8,0.03,0.4,'#c8ccd6'),mMul(mTrans(2.2,1.12,-1.3),mRotZ(0.6)));
  for(let i=0;i<6;i++)sc.add(B3.box(0.12,0.06,0.1,['#8a6ad0','#4ac8a0','#ff8a5c'][i%3]),mTrans(-0.9+i*0.22,0.82,-1.2+(i%2)*0.16));
  sc.add(B3.box(0.5,0.5,0.35,'#4a3a2c',{top:'#5d4a37'}),mTrans(1.05,0.79,-0.9));
  sc.add(B3.box(0.4,0.4,0.3,'#3a4a6a'),mTrans(1.6,0.74,-0.85));
  mug(sc,-0.35,0.82,-1.0,'#cfd6e2');
  // анатомический скелет на верстаке — «падает»
  const fall=Math.max(0,Math.sin(t*0.5))*0.9;
  const sk=mMul(mMul(mTrans(0.2,0.82,-1.5),mRotZ(fall*0.55)),mRotX(fall*0.35));
  sc.add(B3.sphere(7,10,0.14,'#e6e2d8'),mMul(sk,mTrans(0,0.52,0)));
  sc.add(B3.box(0.14,0.05,0.1,'#2b2136'),mMul(sk,mTrans(0,0.54,0.12)));
  sc.add(B3.prism(6,0.05,0.34,'#e6e2d8'),mMul(sk,mTrans(0,0.3,0)));
  for(let i=0;i<3;i++)sc.add(B3.prism(4,0.028,0.36,'#e6e2d8'),mMul(sk,mMul(mTrans(0,0.34,0.02),mRotY(Math.PI/2+i*0.3))));
  for(const s of [-1,1])sc.add(B3.prism(5,0.03,0.3,'#e6e2d8'),mMul(sk,mTrans(s*0.1,0.1,0)));
  sc.add(B3.sphere(6,9,0.1,'#e6e2d8'),mMul(sk,mTrans(0,0.62,0.18)));
  // кабель-клубок, POS-терминалы, вешалка
  for(let i=0;i<3;i++)sc.add(B3.box(0.28,0.46,0.34,'#262d40',{top:'#2f374d'}),mMul(mTrans(2.2+i*0.42,0.23,-3.2),mRotY(i*0.4)));
  sc.add(B3.torus(14,0.02,0.4,'#20242f'),mMul(mTrans(3.6,0.03,0.4),mRotX(Math.PI/2)));
  for(let i=0;i<10;i++)sc.add(B3.torus(10,0.015,0.12,'#2a2f3d'),mMul(mTrans(3.6,0.05+i*0.02,0.4),mRotX(Math.PI/2)));
  // камера едет вдоль комнаты и чуть наезжает
  const a=lerp(-0.5,0.5,u),r=lerp(4.2,3.1,u);
  sc.camera(v3(Math.sin(a)*r+0.2,lerp(1.8,1.45,u),Math.cos(a)*r-1.4),v3(-0.2,lerp(1.3,1.2,u),-1.9),lerp(50,45,u));
  sc.fog(5,22,'#151b28');
  return{dust:{n:22,c:[0.2,1.4,-2.0],w:[3.6,1.6,2.6],a:.45},probe:{c:v3(0.2,1.15,-1.9),up:v3(0.2,2.15,-1.9)},monitor:M2.quad,winQuad:win.quad,glows:[
    {p:v3(1.2,1.42,-2.4),r:260,col:'#78c8ff',a:.45},
    {p:v3(-2.2,1.35,-2.5),r:200,col:'#ffd08a',a:.4},
    {p:v3(-3.0,1.8,-5.9),r:240,col:'#9fd8ff',a:.25},
    {p:v3(-4.6,0.25,-5.6),r:220,col:'#7fe0c0',a:.2},
    {p:v3(4.6,0.25,-5.6),r:220,col:'#7fe0c0',a:.2},
    {p:v3(-2.6,1.0,0.6),r:120,col:'#c8a0ff',a:.16},
    {p:v3(0.2,0.95,-1.5),r:170,col:'#e6e2d8',a:.16}]};
};
// ================= 4. Стрим =================
S3.stream=(sc,u,t)=>{
  const R=room(sc,{w:13,d:12,h:3.0,wall:'#3b2f52',floor:'#3c334c',ceil:'#261f38',ledCol:'#b07cff'});
  const win=window3(sc,{x:-3.2,y:1.9,w:1.5,h:1.15});
  const D=desk(sc,{x:0.3,z:-1.2,w:3.6,d:1.5,col:'#3f4457',top:'#4d5364'});
  // два монитора: чат и «рабочий стол»
  const m1=monitor(sc,{x:-0.7,y:1.42,z:-2.05,w:1.7,h:1.0,rot:0.16});
  const m2=monitor(sc,{x:1.35,y:1.36,z:-2.0,w:1.5,h:0.9,rot:-0.3});
  // ноутбук-третий экран справа
  sc.add(B3.box(1.1,0.05,0.75,'#1a1e28'),mMul(mTrans(3.0,0.8,-1.3),mRotY(-0.5),mRotX(0.14)));
  sc.add(B3.box(1.1,0.66,0.05,'#20242f'),mMul(mTrans(3.05,1.13,-1.55),mRotY(-0.5)));
  sc.add(B3.torus(10,0.05,0.16,'#8a6ad0'),mMul(mTrans(3.2,0.92,-1.2),mRotY(Math.PI/2)));
  // клавиатура, мышь, коврик, кружка, банка газировки
  sc.add(B3.box(1.15,0.05,0.4,'#1b1f29'),mTrans(0.3,0.87,-0.9));
  sc.add(B3.sphere(5,8,0.1,'#1b1f29'),mMul(mTrans(1.5,0.88,-0.85),mScale(1,0.4,1.4)));
  mug(sc,2.3,0.87,-1.5,'#ffd8a0');
  sc.add(B3.prism(10,0.11,0.28,'#c8404a'),mTrans(-1.9,0.87,-1.3));
  sc.add(B3.torus(8,0.02,0.05,'#d8d8e0'),mMul(mTrans(-1.9,1.02,-1.3),mRotX(0.4)));
  // пантограф с микрофоном
  const piv=mMul(mTrans(1.9,0.86,-1.6),mRotY(0.7));
  sc.add(B3.prism(8,0.035,0.85,'#3a4256'),mMul(piv,mTrans(0,0.42,0)));
  sc.add(B3.prism(8,0.03,0.8,'#3a4256'),mMul(piv,mMul(mTrans(0,0.85,0),mRotZ(0.75))));
  const mic=mMul(piv,mTrans(-0.5,1.15,0));
  sc.add(B3.box(0.22,0.36,0.22,'#191d26',{top:'#242a36'}),mic);
  sc.add(B3.torus(10,0.014,0.13,'#7fe0c0',{emissive:true,glow:.6}),mMul(mic,mTrans(0,0,0.115)));
  sc.add(B3.torus(10,0.014,0.13,'#7fe0c0',{emissive:true,glow:.6}),mMul(mic,mTrans(0,0,-0.115)));
  // кольцевая лампа за спиной
  sc.add(B3.torus(16,0.045,0.42,'#fff3dd',{emissive:true,glow:.85}),mMul(mTrans(0.6,1.9,-3.4),mRotX(0.06)));
  sc.add(B3.prism(8,0.04,1.0,'#2b3040'),mTrans(0.6,1.15,-3.5));
  // стул + человек со спины
  sc.add(B3.box(0.5,0.09,0.5,'#2b3244'),mMul(mTrans(0.6,0.5,0.1),mRotY(0.2)));
  sc.add(B3.box(0.46,0.7,0.09,'#2b3244'),mMul(mTrans(0.6,0.86,0.3),mRotY(0.2)));
  sc.add(B3.prism(8,0.05,0.4,'#39415a'),mMul(mTrans(0.6,0.24,0.25),mRotX(1.2)));
  for(const s of [-1,1])sc.add(B3.torus(10,0.03,0.16,'#39415a'),mMul(mTrans(0.6,0.22,0.25+s*0.02),mRotY(Math.PI/2)));
  const per=B3.rigPerson({shirt:'#5d7fb8',arm:62,beard:true,hair:'#8a6a4a'});
  sc.add(per.mesh,mMul(mMul(mTrans(0.6,0.02,0.05),mRotY(Math.PI+0.15)),mIdent()));
  sc.shadow(0.6,0.1,0.4,0.3,0.32);
  // звуковая волна от микрофона (визуальный вайб)
  for(let i=0;i<4;i++){const k=((t*0.9+i*0.25)%1);
    sc.add(B3.torus(14,0.008,0.2+k*0.5,MINT,{emissive:true,glow:.25}),mMul(mic,mRotX(Math.PI/2)))}
  // камера медленно объезжает со спины к экрану
  const a=lerp(1.15,0.3,u),r=lerp(3.3,2.7,u);
  sc.camera(v3(Math.sin(a)*r,lerp(1.7,1.5,u),0.6+Math.cos(a)*r*0.6),v3(0.1,lerp(1.45,1.5,u),-1.5),lerp(52,46,u));
  sc.fog(5,20,'#191428');
  return{dust:{n:20,c:[0.2,1.4,-1.6],w:[3.2,1.5,2.4],a:.42},probe:{c:v3(0.3,1.25,-1.4),up:v3(0.3,2.25,-1.4)},monitor:m1.quad,monitor2:m2.quad,winQuad:win.quad,glows:[
    {p:v3(-0.7,1.42,-2.0),r:260,col:'#78c8ff',a:.45},
    {p:v3(1.35,1.36,-1.95),r:220,col:'#7fe0c0',a:.35},
    {p:v3(0.6,1.9,-3.35),r:340,col:'#fff0d0',a:.5},
    {p:v3(1.9,1.0,-1.6),r:150,col:'#7fe0c0',a:.28},
    {p:v3(-1.9,1.05,-1.3),r:110,col:'#ff9a9a',a:.22},
    {p:v3(-3.2,1.9,-5.9),r:200,col:'#9fd8ff',a:.2},
    {p:v3(3.2,1.15,-1.4),r:190,col:'#b07cff',a:.25}]};
};
// ================= 5. Караванщик =================
S3.caravan=(sc,u,t)=>{
  // дюны
  const m=B3.mesh();const N=20,SIZE=90;
  const nh=k=>{const q=Math.sin(k*127.1+311.7)*43758.5453;return q-Math.floor(q)};
  const H=(x,z)=>Math.sin(x*0.09)*1.1+Math.cos(z*0.11)*0.9+Math.sin((x+z)*0.05)*1.5;
  const pts=[];
  for(let i=0;i<=N;i++){pts.push([]);for(let j=0;j<=N;j++){
    const x=(i/N-0.5)*SIZE,z=(j/N-0.5)*SIZE;
    pts[i].push(v3(x,H(x,z),z))}}
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const c=((i+j)%2)?'#c08a52':'#b57f4a';
    B3.quad(m,pts[i][j],pts[i+1][j],pts[i+1][j+1],pts[i][j+1],c)}
  sc.add(m,null);
  // караван: телеги с тентом, ящиками, колёсами
  const cart=(x,z,s,rot)=>{
    const M=mMul(mMul(mTrans(x,H(x,z),z),mRotY(rot)),mScale(s,s,s));
    sc.add(B3.box(1.7,0.12,1.1,'#5a4030',{top:'#6b4c38'}),mMul(M,mTrans(0,0.72,0)));
    for(const sx of [-0.8,0.8])sc.add(B3.box(0.1,0.5,1.1,'#4a3527'),mMul(M,mTrans(sx,0.45,0)));
    for(const sz of [-0.5,0.5])sc.add(B3.box(1.7,0.5,0.1,'#4a3527'),mMul(M,mTrans(0,0.45,sz)));
    // тент-полусфера
    sc.add(B3.sphere(8,14,0.62,'#d8c49a',{top:'#e8d8b4'}),mMul(M,mMul(mTrans(0,0.80,0),mScale(1.3,0.72,0.85))));
    sc.add(B3.box(1.9,0.1,1.2,'#8a6a4a'),mMul(M,mTrans(0,1.06,0)));
    for(const wx of [-0.62,0.62]){
      sc.add(B3.torus(14,0.09,0.4,'#3a2a1e'),mMul(M,mTrans(wx,0.4,0.62),mRotY(Math.PI/2)));
      sc.add(B3.torus(14,0.09,0.4,'#3a2a1e'),mMul(M,mTrans(wx,0.4,-0.62),mRotY(Math.PI/2)));
      for(let i=0;i<6;i++)sc.add(B3.box(0.05,0.72,0.05,'#6a5236'),mMul(M,mTrans(wx,0.4,0.62),mRotZ(i*Math.PI/3)));
    }
    // поклажа
    sc.add(B3.box(0.45,0.4,0.4,'#7a5a3a'),mMul(M,mTrans(0.5,1.25,0.2),mRotY(0.3)));
    sc.add(B3.box(0.4,0.32,0.34,'#8a6a4a'),mMul(M,mTrans(-0.4,1.21,-0.2),mRotY(-0.4)));
    sc.shadow(x,z,1.1,0.7,0.3);
    return M;
  };
  cart(-3.6,2.4,1,0.15);cart(-1.5,0.9,0.94,-0.15);cart(0.6,-0.7,0.88,0.3);
  cart(2.7,-2.3,0.8,0.55);cart(4.6,-3.9,0.72,-0.3);
  // камни и сухие кусты по обочинам — чтобы дюны не выглядели пустой стеной
  for(let i=0;i<14;i++){
    const x=lerp(-9,9,nh(i*3.7)),z=lerp(-7,5,nh(i*1.9+0.4));const h=H(x,z);
    const col=i%3?'#8a6a48':'#6a5a44';
    sc.add(B3.prism(5,lerp(0.2,0.5,nh(i)),lerp(0.35,0.8,nh(i+2)),col),mMul(mTrans(x,h+0.16,z),mRotY(i*1.3)));
    if(i%4===0)sc.add(prism7(0.05,lerp(0.9,1.6,nh(i+5)),'#6a6a44'),mMul(mTrans(x+0.5,h+0.8,z-0.4),mRotZ(0.06)));
  }
  // караванщик в плаще с посохом
  const per=B3.rigPerson({shirt:'#8a6a44',arm:20,beard:true,hair:'#6b5033'});
  const ph0=H(-1.5,0.6);
  sc.add(per.mesh,mMul(mMul(mTrans(-2.9,ph0+0.02,2.0),mRotY(1.0)),mIdent()));
  sc.add(prism7(0.04,1.5,'#6a5236'),mMul(mTrans(-3.25,ph0+0.72,2.15),mRotZ(0.12)));
  sc.shadow(-2.9,2.0,0.4,0.3,0.3);
  // перекати-поле и ящерица-«вайб»
  sc.add(B3.sphere(6,10,0.34,'#7a6640'),mMul(mTrans(lerp(-9,9,(t*0.1)%1),0.3,3.2),mRotZ(t*2.4)));
  sc.add(B3.sphere(6,10,0.26,'#8a7648'),mMul(mTrans(lerp(8,-8,(t*0.07)%1),0.35,4.4),mRotZ(-t*2)));
  // птицы-галочки
  for(let i=0;i<3;i++){const ph=(t*0.2+i*0.3)%1;const x=lerp(-8,8,ph),y=6+i*0.7;
    sc.add(B3.box(0.5,0.04,0.04,'#4a3a2a'),mMul(mTrans(x,y,-6-i),mRotZ(Math.sin(t*3+i)*0.4)));
    sc.add(B3.box(0.5,0.04,0.04,'#4a3a2a'),mMul(mTrans(x+0.5,y,-6-i),mRotZ(-Math.sin(t*3+i)*0.4)));}
  // камера едет вдоль каравана и всегда выше рельефа — в дюну не залезает
  const a=lerp(-0.10,0.62,u),r=lerp(7.2,4.9,u);
  const cx=Math.sin(a)*r,cz=Math.cos(a)*r+1.2;
  const cy=Math.max(lerp(3.5,2.3,u),H(cx,cz)+1.9);
  sc.camera(v3(cx,cy,cz),v3(0.2,lerp(1.5,1.15,u),lerp(0.6,-0.5,u)),lerp(50,45,u));
  sc.fog(14,70,'#d8a25e');
  return{probe:{c:v3(0,1.2,0.4),up:v3(0,2.2,0.4)},glows:[
    {p:v3(0.6,7.5,-40),r:520,col:'#ffd08a',a:.42},
    {p:v3(-1.3,1.55,0.8),r:150,col:'#ffbe6a',a:.4},
    {p:v3(1.7,1.5,-0.4),r:130,col:'#ffbe6a',a:.32}]};
};
function prism7(r,h,col){return B3.prism(7,r,h,col)}
// ================= 6. Директор нейронок =================
S3.limits=(sc,u,t)=>{
  const R=room(sc,{w:14,d:13,h:3.4,wall:'#20304e',floor:'#253052',ceil:'#182238',ledCol:'#3a6aa8'});
  // «директор нейронок» — глаз-портал сверху, вертикальная композиция
  const eye=[v3(-0.72,2.98,-2.2),v3(0.72,2.98,-2.2),v3(0.72,2.34,-2.2),v3(-0.72,2.34,-2.2)];
  sc.add(B3.box(1.8,0.9,0.1,'#1a2236'),mTrans(0,2.65,-2.26));
  sc.add(B3.box(1.9,0.12,0.14,'#3a6aa8',{emissive:true,glow:.5}),mTrans(0,3.14,-2.2));
  // главный монитор с кодом-отчётом
  const m1=monitor(sc,{x:-0.15,y:1.5,z:-1.9,w:1.7,h:1.05,rot:0.06});
  // справа — шкала лимитов (2D)
  const lim=[v3(0.75,2.05,-1.45),v3(1.95,2.05,-1.45),v3(1.95,1.45,-1.45),v3(0.75,1.45,-1.45)];
  sc.add(B3.box(1.28,0.66,0.08,'#161e30'),mTrans(1.35,1.75,-1.5));
  // слева — колонка «городка»: домики ярусами
  for(let i=0;i<9;i++){
    const y=0.35+i*0.36,x=-1.35+((i%2)*0.3),z=-2.35-((i%3)*0.18);
    sc.add(B3.box(0.5,0.3,0.44,'#1c2233',{top:'#26304a'}),mTrans(x,y,z));
    const on=((i+Math.floor(t*1.4))%3)===0;
    sc.add(B3.box(0.12,0.12,0.04,on?'#ffc06a':'#28324a',{emissive:on,glow:on?.45:0}),mTrans(x-0.11,y+0.02,z+0.24));
    sc.add(B3.box(0.12,0.12,0.04,on?'#28324a':'#7fe0c0',{emissive:!on,glow:!on?.35:0}),mTrans(x+0.11,y+0.02,z+0.24));
  }
  // башенные краны над городком — «стройка идёт»
  for(const [cx,cz,sc0] of [[-1.75,-2.6,1],[-0.55,-2.85,0.8]]){
    const M=mMul(mTrans(cx,0,cz),mScale(sc0,sc0,sc0));
    sc.add(B3.box(0.12,3.1,0.12,'#2b3a5c'),mMul(M,mTrans(0,1.55,0)));
    sc.add(B3.box(1.9,0.1,0.1,'#35476e'),mMul(M,mTrans(0.7,3.05,0)));
    sc.add(B3.box(0.1,0.12,0.5,'#35476e'),mMul(M,mTrans(1.55,3.0,0)));
    sc.add(B3.box(0.05,0.7,0.05,'#4a5a7f'),mMul(M,mTrans(1.55,2.6,0)));
    sc.add(B3.box(0.3,0.24,0.3,'#3a4a6a',{top:'#46587c'}),mMul(M,mTrans(1.55,2.2,0)));
    sc.add(B3.sphere(4,6,0.05,'#ffc06a',{emissive:true,glow:.6}),mMul(M,mTrans(0,3.2,0)));
  }
  // труба с токенами: сверху вниз, вдоль кадра
  const pipe=[];for(let i=0;i<=14;i++){const p=i/14;
    pipe.push(v3(0.75+Math.sin(p*4.5)*0.22,3.0-p*2.2,-1.6+Math.sin(p*3)*0.12))}
  for(let i=0;i<pipe.length-1;i++){
    const a=pipe[i],b=pipe[i+1],mid=vmul(vadd(a,b),0.5),dir=vnorm(vsub(b,a));
    sc.add(B3.prism(8,0.13,0.62,'#2b3a5c',{top:'#35476e'}),
      mMul(mTrans(mid.x,mid.y,mid.z),mMul(mRotZ(Math.atan2(dir.y,Math.hypot(dir.x,dir.z))-Math.PI/2),mRotY(Math.atan2(dir.x,dir.z)-Math.PI/2))));
  }
  for(let i=0;i<26;i++){const p=((t*0.24+i*0.04)%1);const idx=Math.min(pipe.length-2,Math.floor(p*(pipe.length-1)));
    const a=pipe[idx],b=pipe[idx+1],q=vlerp(a,b,(p*(pipe.length-1))%1);
    sc.add(B3.sphere(5,7,0.07,'#7fe0c0',{emissive:true,glow:.6}),mTrans(q.x,q.y,q.z));}
  // стол и кресло «директора» — нижний ярус кадра
  sc.add(B3.box(3.0,0.1,1.2,'#3a4462',{top:'#48557a'}),mTrans(0.2,1.05,-0.9));
  sc.add(B3.box(0.5,1.0,0.5,'#1d2536'),mTrans(1.1,0.5,-0.5));
  sc.add(B3.box(0.5,1.0,0.5,'#1d2536'),mTrans(-0.7,0.5,-0.5));
  // стойки с логами по бокам (лампочки)
  for(const sx of [-3.0,3.0])for(let i=0;i<12;i++)
    sc.add(B3.box(0.16,0.04,0.03,((i+Math.floor(t*3))%4===0)?'#ffc06a':'#7fe0c0',{emissive:true,glow:.4}),mTrans(sx,0.5+i*0.24,-1.2));
  const a=lerp(-0.16,0.30,u),r=lerp(3.3,2.9,u);
  sc.camera(v3(-0.25+Math.sin(a)*r,lerp(1.85,1.6,u),-0.35+Math.cos(a)*r),v3(-0.25,lerp(1.8,1.65,u),-2.0),lerp(54,50,u));
  sc.fog(6,30,'#0a1020');
  return{dust:{n:24,c:[0,2.0,-2.0],w:[4.0,2.2,2.6],a:.4},screens:[{quad:m1.quad},{quad:lim},{quad:eye}],probe:{c:v3(0,1.9,-1.9),up:v3(0,2.9,-1.9)},glows:[
    {p:v3(0,2.65,-2.2),r:340,col:'#78c8ff',a:.42},
    {p:v3(0,1.5,-1.9),r:300,col:'#7fe0c0',a:.4},
    {p:v3(1.7,1.65,-1.7),r:220,col:'#ffc06a',a:.35},
    {p:v3(-1.35,1.6,-2.3),r:200,col:'#ffc06a',a:.3},
    {p:v3(0.75,1.9,-1.6),r:180,col:'#7fe0c0',a:.3},
    {p:v3(0,0.6,-2.4),r:260,col:'#3a6aa8',a:.2}]};
};
S3.release=(sc,u,t)=>{
  const R=room(sc,{w:15,d:14,h:3.6,wall:'#243252',floor:'#202a46',ceil:'#161e30',ledCol:'#7fe0c0'});
  // вертикальная композиция: окно игры сверху, кнопка в центре, капсула снизу
  const win=[v3(-1.05,2.85,-2.6),v3(1.05,2.85,-2.6),v3(1.05,1.65,-2.6),v3(-1.05,1.65,-2.6)];
  sc.add(B3.box(2.2,1.3,0.1,'#0d1424'),mTrans(0,2.25,-2.66));
  sc.add(B3.box(2.3,0.1,0.14,'#7fe0c0',{emissive:true,glow:.5}),mTrans(0,2.95,-2.62));
  // кнопка «ОПУБЛИКОВАТЬ»
  const pressed=u>0.3;
  const btn=mMul(mMul(mTrans(0,1.15,-1.5),mRotX(-0.3)),mIdent());
  sc.add(B3.box(1.5,0.28,0.5,pressed?'#3fa875':'#27684a',{emissive:pressed,glow:pressed?.6:0}),btn);
  sc.add(B3.box(1.24,0.03,0.36,'#dff6e8',{emissive:pressed,glow:pressed?.35:0}),mMul(btn,mTrans(0,0.16,0)));
  sc.add(B3.prism(10,0.2,0.6,'#2b3244'),mTrans(0,0.85,-1.35));
  // подиум и «капсула игры» — нижний ярус
  sc.add(B3.box(2.6,0.3,1.6,'#1b2338',{top:'#25314e'}),mTrans(0,0.15,-0.6));
  sc.add(B3.box(1.3,0.78,0.12,'#1a2030',{top:'#232a3e'}),mTrans(-0.35,0.7,-0.9));
  sc.add(B3.box(1.2,0.7,0.05,'#7fe0c0',{emissive:true,glow:.3}),mTrans(-0.35,0.7,-0.83));
  sc.add(B3.prism(8,0.5,0.5,'#232c40'),mTrans(-0.35,0.45,-0.9));
  // робо-рука печатает релиз; от пальцев — искры
  const wrist=roboArm(sc,{x:0.95,z:-0.55,s:0.8},t);
  for(let i=0;i<7;i++){
    const k=(t*1.7+i*0.14)%1;if(k>0.6)continue;
    const p=B3.xform(wrist,v3(Math.sin(i*2.1)*0.1,-0.12-k*0.12,0.12+Math.cos(i*1.7)*0.06));
    sc.add(B3.box(0.05,0.05,0.02,['#7fe0c0','#ffd8a0','#9fd8ff'][i%3],{emissive:true,glow:.6}),mMul(mTrans(p.x,p.y,p.z),mRotZ(k*9+i)));
  }
  // серверы-стойки по краям и гирлянда лампочек над сценой
  for(const sx of [-2.6,2.6])for(let i=0;i<14;i++)
    sc.add(B3.box(0.18,0.05,0.03,((i+Math.floor(t*4))%5===0)?'#ffc06a':'#7fe0c0',{emissive:true,glow:.45}),mTrans(sx,0.5+i*0.22,-1.4));
  for(let i=0;i<9;i++){const x=-2.0+i*0.5;
    sc.add(B3.sphere(5,7,0.06,['#ffc06a','#7fe0c0','#ff8fb0','#9fd8ff'][i%4],{emissive:true,glow:.5}),mTrans(x,3.3-Math.abs(Math.sin(i*0.5))*0.25,-1.9));}
  // конфетти-салют
  const gl=[{p:v3(0,2.25,-2.6),r:360,col:'#7fe0c0',a:.35},
            {p:v3(0,1.15,-1.5),r:300,col:pressed?'#7fe0c0':'#3a5a48',a:pressed?.55:.2},
            {p:v3(-0.35,0.7,-0.83),r:240,col:'#7fe0c0',a:.4},
            {p:v3(0,3.3,-1.9),r:300,col:'#ffd8a0',a:.25},
            {p:v3(0.95,1.15,-0.5),r:200,col:'#7fe0c0',a:.4}];
  if(u>0.28)for(let i=0;i<44;i++){
    const p=((t*0.42+i*0.023)%1);
    const ang=i*1.7;
    const x=Math.sin(ang)*p*1.25,y=1.5+p*2.1-0.3,z=-1.2+Math.cos(ang)*p*0.5;
    const col=[AMBER,MINT,'#ff8fb0','#9fd8ff','#ffffff'][i%5];
    sc.add(B3.box(0.08,0.13,0.05,col,{emissive:true,glow:.35}),mMul(mTrans(x,y,z),mRotZ(p*9+i)));
    if(i%7===0)gl.push({p:v3(x,y,z),r:120,col,a:.3});
  }
  const a=lerp(-0.22,0.5,u),r=lerp(3.5,2.9,u);
  sc.camera(v3(Math.sin(a)*r,lerp(2.0,1.75,u),Math.cos(a)*r),v3(0,lerp(1.7,1.6,u),-1.4),lerp(52,48,u));
  sc.fog(6,26,'#0a1020');
  return{dust:{n:22,c:[0,1.8,-1.6],w:[4.0,2.0,2.6],a:.45},win,probe:{c:v3(0,1.8,-1.6),up:v3(0,2.8,-1.6)},glows:gl};
};
S3.wishlist=(sc,u,t)=>{
  const R=room(sc,{w:14,d:13,h:3.2,wall:'#332a46',floor:'#3b2e4c',ceil:'#241c30',ledCol:'#ffc06a'});
  // таможенная стойка (узкая) и рюкзак на ней
  sc.add(B3.box(1.9,0.95,0.85,'#3b2f42',{top:'#4a3a52'}),mTrans(0.1,0.48,-0.5));
  sc.add(B3.box(2.05,0.07,0.95,'#54415c'),mTrans(0.1,0.99,-0.5));
  for(let i=0;i<2;i++)sc.add(B3.box(0.5,0.3,0.02,'#8fb0d8',{emissive:true,glow:.25}),mTrans(-0.25+i*0.6,0.7,-0.06));
  sc.add(B3.box(0.8,0.66,0.5,'#6b5a3c',{top:'#7d6a48'}),mTrans(0.1,1.36,-0.5));
  sc.add(B3.box(0.8,0.44,0.1,'#7d6a48'),mTrans(0.1,1.32,-0.24));
  sc.add(B3.box(0.55,0.18,0.45,'#8a7654'),mTrans(0.1,1.75,-0.55));
  sc.add(B3.torus(10,0.03,0.13,'#c8b090'),mMul(mTrans(0.1,1.55,0.6),mRotX(Math.PI/2)));
  // вертикальная «колонна вишлистов» слева
  for(let i=0;i<10;i++){
    const k=clamp((u-0.05)/0.55);
    const hh=lerp(0.08,0.08+Math.pow(i/10,1.6)*2.2,k);
    const col=i>7?AMBER:(i>4?'#7fe0c0':'#3a4a6a');
    sc.add(B3.box(0.34,hh,0.3,col,{emissive:i>7,glow:i>7?.35:0}),mTrans(-1.35+ (i%2)*0.16,hh/2,-2.4-((i%3)*0.2)));
  }
  sc.add(B3.box(0.5,2.6,0.4,'#241c30'),mTrans(-1.75,1.3,-2.4));
  // купол-витрина над рюкзаком
  sc.add(B3.sphere(9,16,1.15,'#9fd8ff',{top:'#bfe6ff'}),mMul(mTrans(0.1,1.05,-0.5),mScale(1,0.85,1)),{alpha:0.16});
  sc.add(B3.torus(18,0.028,1.05,'#c8d8f0'),mMul(mTrans(0.1,1.05,-0.5),mRotX(Math.PI/2)));
  sc.add(B3.torus(18,0.022,0.7,'#c8d8f0'),mMul(mTrans(0.1,1.5,-0.5),mRotX(Math.PI/2)));
  sc.add(B3.prism(8,0.16,0.34,'#2b3244'),mTrans(0.1,0.17,-0.5));
  // вылетающие предметы
  const items=['#c8b0ff','#ffb0b0','#a8ebc2','#ffd8a0','#9fd8ff','#e0c060'];
  for(let i=0;i<9;i++){
    const k=(t*0.4+i*0.11)%1.3;if(k>1)continue;
    const ang=-1.3+i*0.28,dist=0.3+k*2.0;
    const x=0.1+Math.cos(ang)*dist,y=1.5+Math.sin(ang)*dist*0.5;
    const col=items[i%items.length];
    if(i%3===0)sc.add(B3.box(0.24,0.06,0.24,col,{emissive:true,glow:.3}),mMul(mTrans(x,y,-0.5),mRotY(k*5)));
    else if(i%3===1)sc.add(B3.sphere(6,9,0.13,col,{emissive:true,glow:.3}),mTrans(x,y,-0.5));
    else sc.add(B3.cone(6,0.14,0.26,col,{emissive:true,glow:.3}),mMul(mTrans(x,y,-0.5),mRotX(k*4)));
  }
  // письма издателей падают сверху
  if(u>0.55)for(let i=0;i<2;i++){const k=clamp((u-0.55-i*0.06)/0.22);
    sc.add(B3.box(0.62,0.44,0.04,'#efe6d2',{top:'#f6efe0'}),mMul(mTrans(0.9+i*0.2,lerp(3.0,1.3,k),-0.8+i*0.3),mRotY(-0.4+i*0.5)));
    sc.add(B3.box(0.44,0.05,0.01,'#e06565',{emissive:true,glow:.3}),mMul(mTrans(0.9+i*0.2,lerp(2.9,1.45,k),-0.77+i*0.3),mRotY(-0.4+i*0.5)));}
  // люди: офицер слева, путешественник справа
  const off=B3.rigPerson({shirt:'#4a5f8f',arm:55,beard:true,hair:'#2b3a55'});
  sc.add(off.mesh,mMul(mTrans(-1.35,-0.02,-0.3),mRotY(1.0)));
  sc.shadow(-1.35,-0.3,0.4,0.3,0.3);
  const guy=B3.rigPerson({shirt:'#8a6a4a',arm:25,beard:true,hair:'#5a4636'});
  sc.add(guy.mesh,mMul(mTrans(1.5,-0.02,0.35),mRotY(-2.6)));
  sc.shadow(1.5,0.35,0.4,0.3,0.3);
  const a=lerp(-0.25,0.55,u),r=lerp(3.3,2.7,u);
  sc.camera(v3(Math.sin(a)*r,lerp(1.9,1.55,u),Math.cos(a)*r),v3(0.1,lerp(1.55,1.4,u),-0.9),lerp(52,48,u));
  sc.fog(7,30,'#180f26');
  const gl=[{p:v3(0.1,2.3,-1.2),r:300,col:'#ffc06a',a:.3},
            {p:v3(-1.3,1.5,-2.4),r:240,col:'#7fe0c0',a:.3},
            {p:v3(-1.3,2.6,-2.4),r:220,col:'#ffc06a',a:.3},
            {p:v3(0.1,1.6,-0.5),r:220,col:'#c8b0ff',a:.3},
            {p:v3(2.2,2.22,0.6),r:170,col:'#ff8a5c',a:.3}];
  if(u>0.55)for(let i=0;i<2;i++)gl.push({p:v3(0.9+i*0.2,1.4,-0.8+i*0.3),r:160,col:'#e06565',a:.35});
  return{dust:{n:16,c:[0.1,1.6,-0.9],w:[3.0,1.6,2.4],a:.4},probe:{c:v3(0.1,1.6,-0.9),up:v3(0.1,2.6,-0.9)},glows:gl};
};
S3.credits=(sc,u,t)=>{
  const R=room(sc,{w:18,d:16,h:4.2,wall:'#1b2230',floor:'#212935',ceil:'#141a24',ledCol:'#ffc06a'});
  // 2 колонки × 3 ряда карточек-источников (вертикальная сетка)
  const cards=[];
  for(let i=0;i<6;i++){
    const cx=-0.82+(i%2)*1.64,cy=2.55-Math.floor(i/2)*1.05,cz=-3.0;
    sc.add(B3.box(1.5,0.94,0.08,'#242c42',{top:'#3a4664'}),mTrans(cx,cy,cz));
    sc.add(B3.box(1.42,0.86,0.02,'#1b2338',{emissive:true,glow:.24}),mTrans(cx,cy,cz+0.06));
    const M=mMul(mTrans(cx,cy,cz+0.07),mRotX(-0.06*(3-i)));
    cards.push([[-0.67,0.4,0],[0.67,0.4,0],[0.67,-0.4,0],[-0.67,-0.4,0]].map(q=>xform(M,v3(q[0],q[1],q[2]))));
  }
  // бегущая лента титров: плитки уходят вверх, часть — «источники»
  for(let i=0;i<14;i++){
    const ph=((t*0.10+i*0.072)%1);
    const y=lerp(-0.3,3.9,ph),x=-1.55+((i%2)*0.30);
    const on=(i%3!==1);
    sc.add(B3.box(0.3,0.2,0.16,on?'#2b3448':'#1b2230',{top:'#37425c'}),mMul(mTrans(x,y,-1.25),mRotY(0.25*Math.sin(i))));
    sc.add(B3.box(0.22,0.03,0.02,on?'#7fe0c0':'#46536e',{emissive:on,glow:on?.35:0}),mMul(mTrans(x,y,-1.16),mRotY(0.25*Math.sin(i))));
  }
  // «витрина итогов»: три стойки снизу + частицы вверх
  for(let i=0;i<3;i++){
    sc.add(B3.box(0.5,0.8,0.5,'#1a2130',{top:'#232c40'}),mTrans(-1.0+i*1.0,0.4,-1.5));
    sc.add(B3.sphere(6,9,0.2,['#ffd8a0','#7fe0c0','#b0a0ff'][i],{emissive:true,glow:.4}),mTrans(-1.0+i*1.0,0.92,-1.5));
  }
  for(let i=0;i<56;i++){const p=((t*0.16+i*0.021)%1);
    const col=i%5===0?'#7fe0c0':(i%7===0?'#b0a0ff':'#ffd8a0');
    sc.add(B3.sphere(4,6,0.026+i%3*0.008,col,{emissive:true,glow:.45}),mMul(mTrans(-1.6+(i%10)*0.35,0.4+p*2.9,-1.5+Math.floor(i/10)*0.3),mScale(1,1,1)));}
  // герой-кристалл по центру: медленно вращается, вокруг — два светящихся кольца
  // небольшой кристалл над средним пьедесталом (камера проходит рядом — держим его компактным)
  const HY=1.24;
  const oct=mMul(mMul(mTrans(0,HY,-1.5),mRotY(t*0.55)),mRotX(0.42+Math.sin(t*0.3)*0.12));
  sc.add(B3.prism(6,0.075,0.14,'#ffd8a0',{emissive:true,glow:.45}),oct);
  sc.add(B3.prism(6,0.04,0.08,'#fff0d0',{emissive:true,glow:.5}),mMul(oct,mTrans(0,0.11,0)));
  // рамки-полки по бокам
  for(const sx of [-2.6,2.6])sc.add(B3.wall(0.5,4.0,1,6,'#2b3448'),mMul(mTrans(sx,2.0,-3.0),mRotY(Math.PI/2)));
  const a=lerp(-0.3,0.55,u),r=lerp(3.9,3.2,u);
  sc.camera(v3(Math.sin(a)*r,lerp(2.4,2.05,u),-2.6+Math.cos(a)*r),v3(0,lerp(2.1,1.95,u),-2.6),lerp(54,50,u));
  sc.fog(7,32,'#0d1118');
  const gl=[];
  for(let i=0;i<6;i++)gl.push({p:v3(-0.82+(i%2)*1.64,2.55-Math.floor(i/2)*1.05,-2.9),r:240,col:['#ffc06a','#7fe0c0','#b0a0ff','#9fd8ff','#ff8fb0','#ffd8a0'][i],a:.26});
  for(let i=0;i<3;i++)gl.push({p:v3(-1.0+i*1.0,0.92,-1.5),r:200,col:['#ffd8a0','#7fe0c0','#b0a0ff'][i],a:.4});
  gl.push({p:v3(0,1.24,-1.5),r:150,col:'#ffe0b0',a:.34,pool:false});   // свет от кристалла — без пятна на полу
  gl.push({p:v3(0,3.5,-2.2),r:240,col:'#ffc06a',a:.2});
  gl.push({p:v3(-2.6,2.0,-3.0),r:240,col:'#ffc06a',a:.22});
  gl.push({p:v3(2.6,2.0,-3.0),r:240,col:'#ffc06a',a:.22});
  return{dust:{n:26,c:[0,2.0,-2.4],w:[4.2,2.4,2.6],a:.4},cards,probe:{c:v3(0,2.0,-2.4),up:v3(0,3.0,-2.4)},glows:gl};
};

// ================= 7. Нейронка творит =================
S3.gag=(sc,u,t)=>{
  const R=room(sc,{w:12,d:12,h:3.0,wall:'#2c2640',floor:'#352f48',ceil:'#221c2e',led:false});
  const phase=u<0.34?0:(u<0.68?1:2);
  // подиум со светом
  sc.add(B3.prism(16,1.05,0.24,'#3c334c'),mTrans(0,0.12,0));
  sc.add(B3.torus(20,0.014,1.0,['#ffc06a','#7fe0c0','#b07cff'][phase],{emissive:true,glow:.5}),mMul(mTrans(0,0.25,0),mRotX(Math.PI/2)));
  sc.add(B3.cone(20,1.5,3.4,['#ffc06a','#7fe0c0','#b07cff'][phase],{emissive:true,glow:.06}),mMul(mTrans(0,3.6,0),mRotX(Math.PI)));
  if(phase===0){
    // деревянный квадратный меч
    const s=B3.mesh();
    B3.addMesh(s,B3.box(2.4,0.42,0.18,'#9a6f3e',{top:'#ab7d47'}));
    for(let i=0;i<6;i++)B3.addMesh(s,{verts:B3.box(0.42,0.03,0.19,'#7d5830').verts.map(v=>xform(mTrans(0,-0.36+i*0.14,0),v)),faces:B3.box(0.42,0.03,0.19,'#7d5830').faces});
    B3.addMesh(s,B3.box(0.34,1.0,0.22,'#8a6238'));
    B3.addMesh(s,B3.box(0.2,0.34,0.2,'#6a4a28'));
    for(let i=0;i<4;i++)B3.addMesh(s,B3.box(0.05,0.05,0.05,'#3a2a18'));
    sc.add(s,mMul(mMul(mTrans(0,1.5,0),mRotY(t*0.5)),mRotZ(0.12)));
  }else if(phase===1){
    // молот, кости «мигрируют» с рукояти на голову
    const ham=B3.mesh();
    B3.addMesh(ham,B3.box(0.3,2.1,0.3,'#9a6f3e'));
    B3.addMesh(ham,B3.box(1.7,0.9,0.9,'#a8b0be',{top:'#b8c0ce'}));
    for(let i=0;i<3;i++)B3.addMesh(ham,B3.box(1.72,0.06,0.92,'#8f97a6'));
    sc.add(ham,mMul(mTrans(0,1.4,0),mRotZ(0.18)));
    const k=clamp((u-0.34)/0.28);
    for(let i=0;i<6;i++){
      const p=Math.min(1,k*1.5-i*0.1);if(p<=0)break;
      const y=lerp(0.5,1.85,p),x=lerp(-0.1,0.6,p);
      sc.add(B3.box(0.55,0.12,0.12,'#e6e2d8'),mMul(mTrans(x,y,0.12),mRotZ(p*0.5)));
      sc.add(B3.sphere(5,7,0.07,'#e6e2d8'),mTrans(x-0.3,y+0.05,0.12));
      sc.add(B3.sphere(5,7,0.07,'#e6e2d8'),mTrans(x+0.3,y+0.05,0.12));
    }
  }else{
    // колокол с рунами
    const bell=B3.mesh();
    const N=16;
    for(let i=0;i<N;i++){
      const a1=i/N*Math.PI*2,a2=(i+1)/N*Math.PI*2;
      const b1=B3.mesh();B3.quad(b1,v3(Math.cos(a1)*0.58,0.15,Math.sin(a1)*0.58),v3(Math.cos(a2)*0.58,0.15,Math.sin(a2)*0.58),
        v3(Math.cos(a2)*0.34,1.15,Math.sin(a2)*0.34),v3(Math.cos(a1)*0.34,1.15,Math.sin(a1)*0.34),i%2?'#c8a24a':'#b8923a');
      B3.addMesh(bell,b1);
    }
    B3.addMesh(bell,B3.box(0.36,0.22,0.36,'#a8862a'));
    const top=B3.sphere(6,10,0.2,'#c8a24a');B3.addMesh(bell,{verts:top.verts.map(v=>xform(mTrans(0,1.2,0),v)),faces:top.faces});
    B3.addMesh(bell,B3.box(0.12,0.12,0.12,'#8a6a28'));
    sc.add(bell,mMul(mTrans(0,1.5,0),mRotZ(Math.sin(t*1.4)*0.05)));
    for(let i=0;i<8;i++)sc.add(B3.torus(8,0.02,0.075,'#f0d070',{emissive:true,glow:.35}),mMul(mTrans(-0.45+i*0.13,1.5+Math.sin(t*2+i)*0.05,-0.5+ (i%3)*0.1),mRotX(0.3)));
    sc.add(B3.prism(8,0.03,0.5,'#8a6a28'),mMul(mTrans(0,2.25,0),mRotX(0.6)));
  }
  const a=lerp(-0.5,0.6,u),r=lerp(3.8,3.0,u);
  sc.camera(v3(Math.sin(a)*r,lerp(1.9,1.5,u),Math.cos(a)*r),v3(0,lerp(1.5,1.4,u),0),lerp(48,44,u));
  sc.fog(5,22,'#1a1626');
  const gc=['#ffc06a','#7fe0c0','#b07cff'][phase];
  return{probe:{c:v3(0,1.5,0),up:v3(0,2.5,0)},glows:[
    {p:v3(0,0.3,0),r:420,col:gc,a:.42},
    {p:v3(0,3.0,0),r:260,col:gc,a:.28},
    {p:v3(0,1.6,0),r:220,col:gc,a:.2}]};
};
// ================= 8. Железяка, врубайся =================
S3.burnout=(sc,u,t)=>{
  const R=room(sc,{w:13,d:12,h:3.0,wall:'#2b3750',floor:'#2c3750',ceil:'#202a3c',ledCol:'#7fe0c0'});
  const win=window3(sc,{x:-3.3,y:1.9,w:1.4,h:1.1});
  const D=desk(sc,{x:0.2,z:-1.3,w:3.2,d:1.5,col:'#33384a',top:'#40465a'});
  const m1=monitor(sc,{x:0.5,y:1.45,z:-2.1,w:1.8,h:1.05});
  const m2=monitor(sc,{x:2.1,y:1.32,z:-1.9,w:1.3,h:0.85,rot:-0.4});
  const m3=monitor(sc,{x:-1.3,y:1.32,z:-1.95,w:1.3,h:0.85,rot:0.5});
  // «99%» на экране рисует run.js; здесь — системный блок «железяка» с подсветкой
  sc.add(B3.box(0.9,1.3,1.5,'#1a2030',{top:'#232b3d'}),mTrans(-2.4,0.65,-2.6));
  for(let i=0;i<3;i++)sc.add(B3.torus(14,0.05,0.18,['#7fe0c0','#b07cff','#ffc06a'][i],{emissive:true,glow:.45}),mMul(mTrans(-1.94,0.5+i*0.34,-2.6),mRotY(Math.PI/2)));
  const alive=clamp((u-0.76)/0.1);
  for(let i=0;i<24;i++)sc.add(B3.box(0.05,0.03,0.02,alive>0?['#7fe0c0','#a8ebc2','#ffc06a'][i%3]:'#223047',{emissive:alive>0,glow:alive>0?.5:0}),mTrans(-2.86+ (i%2)*0.1,0.25+Math.floor(i/2)*0.09,-1.9));
  // человек, сгорбившись, кружка, пустая банка, гора тарелок
  const per=B3.rigPerson({shirt:'#41527a',arm:70,beard:true,hair:'#8a6a4a'});
  sc.add(per.mesh,mMul(mMul(mTrans(0.6,-0.02,0.35),mRotY(Math.PI+0.08)),mRotX(0.16)));
  sc.shadow(0.6,0.35,0.45,0.36,0.32);
  mug(sc,2.6,0.78,-1.2,'#cfd6e2');
  sc.add(B3.prism(10,0.1,0.26,'#8a7a58'),mMul(mTrans(1.9,0.79,-1.0),mRotZ(0.2)));
  for(let i=0;i<4;i++)sc.add(B3.prism(12,0.24,0.04,'#b8bdc8'),mTrans(-1.6+i*0.03,0.8+i*0.05,-1.7));
  // часы на стене: 4 утра
  sc.add(B3.prism(16,0.42,0.09,'#1e2433'),mMul(mTrans(3.4,2.15,-3.9),mRotX(Math.PI/2)));
  sc.add(B3.box(0.3,0.04,0.03,alive>0?'#ffc06a':'#3a4460',{emissive:alive>0,glow:alive>0?.4:0}),mMul(mTrans(3.4,2.15,-3.85),mRotZ(Math.PI/2)));
  sc.add(B3.box(0.05,0.22,0.03,'#e6e2d8'),mMul(mTrans(3.4,2.05,-3.85),mRotZ(0.4)));
  // камера медленно наезжает, в конце — свет из «железяки»
  const d=lerp(3.2,2.4,u);
  sc.camera(v3(0.5+Math.sin(u*0.4)*0.4,lerp(1.7,1.5,u),0.3+d*0.8),v3(0.2,lerp(1.4,1.3,u),-1.7),lerp(52,48,u));
  sc.fog(5,20,'#0a0e16');
  return{dust:{n:18,c:[0.4,1.4,-1.7],w:[3.2,1.5,2.4],a:.4},probe:{c:v3(0.5,1.15,-1.6),up:v3(0.5,2.15,-1.6)},monitor:m1.quad,monitor2:m2.quad,monitor3:m3.quad,winQuad:win.quad,alive,glows:[
    {p:v3(0.5,1.45,-2.1),r:260,col:alive>0?'#7fe0c0':'#7f9fd0',a:.4},
    {p:v3(2.1,1.32,-1.9),r:180,col:'#78c8ff',a:.25},
    {p:v3(-2.0,0.7,-2.6),r:230,col:'#7fe0c0',a:.3+alive*0.3},
    {p:v3(3.4,2.15,-5.85),r:150,col:alive>0?'#ffc06a':'#3a4460',a:.25},
    {p:v3(-3.3,1.9,-5.85),r:190,col:'#9fd8ff',a:.18}]};
};

// ================= 11. Дальше =================
S3.finale=(sc,u,t)=>{
  const R=room(sc,{w:13,d:12,h:3.0,wall:'#3c3050',floor:'#463654',ceil:'#251d32',ledCol:'#b07cff'});
  const win=window3(sc,{x:-2.6,y:1.9,w:2.0,h:1.4});
  const D=desk(sc,{x:0.6,z:-2.2,w:3.0,d:1.3,col:'#4b3a2d',top:'#634d3a'});
  const m1=monitor(sc,{x:1.0,y:1.4,z:-3.0,w:1.6,h:0.95});
  sc.add(B3.box(1.05,0.05,0.36,'#1b1f29'),mTrans(0.9,0.86,-2.2));
  mug(sc,2.4,0.8,-2.6,'#ffd8a0');
  // три коробки игр на полке — «сделано»
  for(let i=0;i<3;i++){
    sc.add(B3.box(0.44,0.58,0.14,'#1d2334',{top:'#26304a'}),mTrans(-0.6+i*0.6,1.55,-3.9));
    sc.add(B3.box(0.36,0.1,0.02,['#ffd8a0','#7fe0c0','#b0a0ff'][i],{emissive:true,glow:.35}),mTrans(-0.6+i*0.6,1.7,-3.8));
  }
  shelf(sc,{x:-3.2,y:2.1,z:-3.9,w:0});
  plant(sc,2.9,0.6,1.1);plant(sc,-3.0,1.4,0.9);
  // человек за столом и кот рядом
  const per=B3.rigPerson({shirt:'#5470a8',arm:30,beard:true,hair:'#8a6a4a'});
  sc.add(per.mesh,mMul(mMul(mTrans(-0.5,0.28,0.4),mRotY(Math.PI-0.35)),mIdent()));
  sc.shadow(-0.5,0.4,0.45,0.36,0.3);
  // стул
  sc.add(B3.box(0.5,0.09,0.5,'#2b3244'),mMul(mTrans(-0.5,0.5,0.65),mRotY(0.15)));
  sc.add(B3.box(0.46,0.7,0.09,'#2b3244'),mMul(mTrans(-0.5,0.86,0.9),mRotY(0.15)));
  const cat=B3.rigCat({curl:0.8,eyes:'#4f9a72'});
  sc.add(cat.mesh,mMul(mMul(mTrans(1.62,1.44,-2.5),mRotY(-2.3)),mIdent()));
  sc.add(B3.sphere(6,9,0.09,'#cdbab2'),mMul(mTrans(1.15,1.47,-2.35),mScale(1,0.7,1.4)));
  sc.shadow(1.62,-2.5,0.3,0.24,0.25);
  // пар и «вайб»-частицы над кружкой
  for(let i=0;i<8;i++){const p=((t*0.35+i*0.12)%1);
    sc.add(B3.sphere(5,7,0.04+i*0.006,'#cfd6e2',{emissive:true,glow:.25}),mMul(mTrans(2.4+Math.sin(i*2+t)*0.08,0.92+p*0.8,-2.6),mScale(1,1,1)));}
  const a=lerp(-0.5,0.8,u),r=lerp(4.2,3.1,u);
  sc.camera(v3(Math.sin(a)*r,lerp(2.0,1.5,u),1.2+Math.cos(a)*r*0.6),v3(0.2,lerp(1.35,1.25,u),-1.8),lerp(50,46,u));
  sc.fog(5,20,'#0d0b16');
  return{dust:{n:18,c:[0.2,1.5,-1.8],w:[3.4,1.6,2.4],a:.42},probe:{c:v3(0.2,1.4,-1.6),up:v3(0.2,2.4,-1.6)},monitor:m1.quad,winQuad:win.quad,glows:[
    {p:v3(-2.6,1.9,-5.9),r:380,col:'#9fd8ff',a:.4},
    {p:v3(1.0,1.4,-2.9),r:230,col:'#ffd8a0',a:.32},
    {p:v3(-0.6,1.72,-3.8),r:130,col:'#ffd8a0',a:.3},
    {p:v3(0.6,1.72,-3.8),r:130,col:'#7fe0c0',a:.3},
    {p:v3(1.8,1.72,-3.8),r:130,col:'#b0a0ff',a:.3},
    {p:v3(2.4,0.95,-2.6),r:120,col:'#ffd8a0',a:.22}]};
};
window.S3=S3;
})();
