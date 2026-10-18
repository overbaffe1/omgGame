// misha3d.js — ядро 3D для фильма «МИША ПРОТИВ ВСЕГО».
// Детерминированный рендер: каждый кадр — чистая функция времени t (можно перематывать).
// WebGL (three.js) рисует в свой канвас 1920×1080, его кладут в 2D-кадр (misha-film.js).
(function(){
const T=window.THREE,TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const easeOut=t=>1-Math.pow(1-clamp(t),3);
const easeIn=t=>{t=clamp(t);return t*t*t};
const easeIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
function rng(seed){let s=seed>>>0;return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const M3={utils:{clamp,lerp,smooth,seg,easeOut,easeIn,easeIO,rng,TAU}};
window.M3=M3;
const U=M3.utils;

// ---------- материалы ----------
const matCache=new Map();
function mat(color,o){o=o||{};const key=color+'|'+(o.emissive||0)+'|'+(o.trans||0)+'|'+(o.flat?'f':'')+(o.opacity??'')+'|'+(o.side||'');
  if(matCache.has(key))return matCache.get(key);
  const m=o.trans?new T.MeshBasicMaterial({color,transparent:true,opacity:o.opacity??0.5,depthWrite:false,side:o.side||T.DoubleSide})
    :new T.MeshLambertMaterial({color,emissive:o.emissive?color:0x000000,emissiveIntensity:o.emissive||0,side:o.side||T.FrontSide});
  matCache.set(key,m);return m}
M3.mat=mat;
function box(w,h,d,color,o){return new T.Mesh(new T.BoxGeometry(w,h,d),mat(color,o))}
function sph(r,color,o,seg){return new T.Mesh(new T.SphereGeometry(r,seg||14,(seg||14)>>1||8),mat(color,o))}
function cyl(rt,rb,h,color,o,seg){return new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg||10),mat(color,o))}
function cone(r,h,color,o,seg){return new T.Mesh(new T.ConeGeometry(r,h,seg||10),mat(color,o))}
M3.prims={box,sph,cyl,cone};

// ---------- текстуры ----------
const texCache=new Map();
function glowTex(){if(texCache.has('glow'))return texCache.get('glow');
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);texCache.set('glow',t);return t}
M3.glowTex=glowTex;
function glowSprite(color,size,op){const m=new T.SpriteMaterial({map:glowTex(),color,transparent:true,opacity:op??.9,blending:T.AdditiveBlending,depthWrite:false});
  const s=new T.Sprite(m);s.scale.set(size,size,1);return s}
M3.glowSprite=glowSprite;
// лицо: скин, брови, глаза, рот
function faceTex(o){const key='face'+JSON.stringify(o);if(texCache.has(key))return texCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle=o.bg||'#e8b98a';x.fillRect(0,0,128,128);
  const eye=(ex,brow)=>{x.fillStyle='#fff';x.beginPath();x.ellipse(ex,54,o.ko?13:10,o.ko?7:12,0,0,TAU);x.fill();
    if(o.ko){x.strokeStyle='#222';x.lineWidth=6;x.beginPath();x.moveTo(ex-10,48);x.lineTo(ex+10,60);x.moveTo(ex+10,48);x.lineTo(ex-10,60);x.stroke()}
    else{x.fillStyle='#1a1a22';x.beginPath();if(o.dead){x.fillRect(ex-6,50,12,12)}else{x.arc(ex,56,5,0,TAU);x.fill()}}
    x.strokeStyle='#2a1f14';x.lineWidth=7;x.lineCap='round';x.beginPath();
    if(o.angry){x.moveTo(ex-13,36+(ex<64?-6:6));x.lineTo(ex+13,42+(ex<64?6:-6))}
    else{x.moveTo(ex-11,38);x.lineTo(ex+11,38)}
    x.stroke()};
  eye(44);eye(84);
  x.strokeStyle='#7a3b26';x.lineWidth=6;x.lineCap='round';x.beginPath();
  if(o.ko||o.dead){x.moveTo(46,96);x.quadraticCurveTo(64,86,82,96)}
  else if(o.happy||o.smirk){x.moveTo(44,92);x.quadraticCurveTo(64,o.smirk?104:110,86,92)}
  else if(o.wow){x.ellipse(64,98,10,13,0,0,TAU)}
  else{x.moveTo(46,102);x.quadraticCurveTo(64,90,84,102)}
  x.stroke();
  if(o.mustache){x.fillStyle='#6a6a72';x.fillRect(40,80,48,8)}
  if(o.tooth){x.fillStyle='#fff';x.fillRect(52,92,24,10)}
  const t=new T.CanvasTexture(c);texCache.set(key,t);return t}
M3.faceTex=faceTex;
// текстовая текстура (экран стадиона, логотип на груди)
function textTex(lines,o={}){const key='txt'+JSON.stringify([lines,o]);if(texCache.has(key))return texCache.get(key);
  const c=document.createElement('canvas');c.width=o.w||512;c.height=o.h||256;const x=c.getContext('2d');
  x.fillStyle=o.bg||'#0a0d18';x.fillRect(0,0,c.width,c.height);
  if(o.border){x.strokeStyle=o.border;x.lineWidth=10;x.strokeRect(5,5,c.width-10,c.height-10)}
  x.textAlign='center';x.textBaseline='middle';
  const fs=o.fs||(c.height/(lines.length+0.6));x.font=`900 ${fs}px Impact,'Arial Black',sans-serif`;
  lines.forEach((s,i)=>{x.fillStyle=o.colors?o.colors[i]:(o.color||'#fff');x.fillText(s,c.width/2,c.height*(i+0.5)/lines.length)});
  const t=new T.CanvasTexture(c);texCache.set(key,t);return t}
M3.textTex=textTex;

// ---------- движок ----------
let renderer=null,scene=null,camera=null;
M3.init=function(cv){
  if(renderer)return;
  renderer=new T.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1920,1080,false);
  scene=new T.Scene();
  camera=new T.PerspectiveCamera(50,16/9,.04,9000);
  M3.scene=scene;M3.camera=camera;M3.renderer=renderer;
  fxInit();
};
M3.render=function(){if(renderer)renderer.render(scene,camera)};
M3.setWorld=function(name){
  for(const k in M3.worlds)M3.worlds[k].g.visible=(k===name);
  const w=M3.worlds[name];if(!w)return;
  scene.background=new T.Color(w.bg!==undefined?w.bg:0x0a0d16);
  scene.fog=w.fogNear!==undefined?new T.Fog(w.fog!==undefined?w.bg:0x0a0d16,w.fogNear,w.fogFar):null;
};
M3.worlds={};

// камера: шоты с абсолютным временем
// шот: {t, d, p:[x,y,z] | orbit:{c,r,a0,a1,y}, l:[x,y,z], fov, e:'io'|'lin'|'out', roll}
M3.cameraAt=function(t,shots){
  if(!shots||!shots.length){camera.position.set(0,2,6);camera.lookAt(0,1,0);return}
  let s=shots[0];
  for(let i=0;i<shots.length;i++){if(shots[i].t<=t+1e-4)s=shots[i];else break}
  const k=s.d>0?clamp((t-s.t)/s.d):1;
  const e=s.e==='lin'?k:s.e==='out'?easeOut(k):s.e==='in'?easeIn(k):easeIO(k);
  let px,py,pz;
  if(s.orbit){const a=lerp(s.orbit.a0,s.orbit.a1,e);const r=lerp(s.orbit.r0!==undefined?s.orbit.r0:s.orbit.r,s.orbit.r,e);
    px=s.orbit.c[0]+Math.cos(a)*r;pz=s.orbit.c[2]+Math.sin(a)*r;py=lerp(s.orbit.y0!==undefined?s.orbit.y0:s.orbit.y,s.orbit.y,e)}
  else if(s.pFn){const p=s.pFn(e,t);px=p[0];py=p[1];pz=p[2]}
  else{px=s.p[0];py=s.p[1];pz=s.p[2]}
  const lk=s.l||[0,1,0];
  const sh=M3._shake||0;
  if(sh>0.0001){const n1=Math.sin(t*61.7)+Math.sin(t*37.3+2),n2=Math.sin(t*53.1+1)+Math.sin(t*29.7),n3=Math.sin(t*47.9+4)+Math.sin(t*33.1+1);
    px+=n1*sh*.5;py+=n2*sh*.35;pz+=n3*sh*.5}
  camera.position.set(px,py,pz);
  camera.lookAt(lk[0],lk[1],lk[2]);
  if(s.roll)camera.rotation.z+=s.roll;
  const f=s.fov||50;
  if(Math.abs(camera.fov-f)>.01){camera.fov=f;camera.updateProjectionMatrix()}
};
M3._shake=0;
const _v=new (T.Vector3?T.Vector3:function(){})();
M3.toScreen=function(x,y,z){_v.set(x,y,z).project(camera);return[( _v.x*.5+.5)*1920,(1-(_v.y*.5+.5))*1080,_v.z]};

// ---------- пул частиц (взрывы, искры, пыль, звёзды) ----------
const CAP=4096;
let pGeo,pPts,pPos,pCol,pGeoInit=false;
function fxInit(){
  pGeo=new T.BufferGeometry();
  pPos=new Float32Array(CAP*3);pCol=new Float32Array(CAP*3);
  pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));
  pGeo.setAttribute('color',new T.BufferAttribute(pCol,3));
  const pm=new T.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
  pPts=new T.Points(pGeo,pm);pPts.frustumCulled=false;scene.add(pPts);
  // кольца-шоквейвы
  for(let i=0;i<14;i++){const m=new T.Mesh(new T.TorusGeometry(1,.05,6,40),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));
    m.visible=false;m.userData.up=new T.Vector3(0,1,0);scene.add(m);rings.push(m)}
}
const rings=[];
// burst beat: {t,d:.7,n:50,at:[x,y,z],c:'#ffd24a',sp:3,up:2,g:-6,size}
M3.fxBursts=function(t,beats){
  let idx=0;
  for(const b of beats){
    if(b.k!=='burst')continue;
    const dt=t-b.t;if(dt<0||dt>b.d)continue;
    const u=dt/b.d,r=rng(b.t*1000|0),n=b.n||40,sp=b.sp||3;
    for(let i=0;i<n&&idx<CAP;i++){
      const a=r()*TAU,ph=(r()-.5)*Math.PI,spd=sp*(.3+r()*.9);
      const vx=Math.cos(a)*Math.cos(ph)*spd,vy=Math.sin(ph)*spd+(b.up||0),vz=Math.sin(a)*Math.cos(ph)*spd;
      const g=(b.g===undefined?-6:b.g),drag=b.drag===undefined?.88:b.drag;
      const dd=1-Math.pow(drag,dt*8);
      pPos[idx*3]=b.at[0]+vx*dd;pPos[idx*3+1]=Math.max(b.floor===undefined?-999:b.floor,b.at[1]+vy*dd+.5*g*dt*dt);pPos[idx*3+2]=b.at[2]+vz*dd;
      const col=new T.Color(b.c||'#ffd24a'),fad=1-u;
      pCol[idx*3]=col.r*fad;pCol[idx*3+1]=col.g*fad;pCol[idx*3+2]=col.b*fad;
      idx++;
    }
  }
  pGeo.setDrawRange(0,idx);
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
};
// ring beat: {t,d:.5,at:[x,y,z],r0:.2,r1:4,c:'#fff',v:'ground'|'cam'}
M3.fxRings=function(t,beats){
  let i=0;
  for(const b of beats){
    if(b.k!=='ring')continue;
    const dt=t-b.t;if(dt<0||dt>b.d)continue;
    if(i>=rings.length)break;
    const m=rings[i++];m.visible=true;
    const u=dt/b.d,r=lerp(b.r0||.2,b.r1||4,easeOut(u));
    m.scale.set(r,r,r);
    m.material.color.set(b.c||'#ffffff');m.material.opacity=(1-u)*(b.a||.8);
    m.position.set(b.at[0],b.at[1],b.at[2]);
    m.rotation.set(0,0,0);
    if(b.v==='cam'){m.quaternion.copy(camera.quaternion)}
    else if(b.n){m.lookAt(b.n[0],b.n[1],b.n[2]);m.rotateX(Math.PI/2)}
    else{m.rotation.x=Math.PI/2}
  }
  for(;i<rings.length;i++)rings[i].visible=false;
};

// ---------- позы ----------
function newPose(){return{rootY:0,rootX:0,rootZ:0,rootRY:0,rootRX:0,rootRZ:0,pelvisY:0,
 torso:{x:0,y:0,z:0},head:{x:0,y:0,z:0},
 armR:{x:0,y:0,z:0,el:0},armL:{x:0,y:0,z:0,el:0},
 legR:{x:0,y:0,z:0,knee:0},legL:{x:0,y:0,z:0,knee:0}}}
M3.newPose=newPose;
function mixPose(P,A,w){if(w<=0)return;
  for(const k of ['rootY','rootX','rootZ','rootRY','rootRX','rootRZ','pelvisY'])P[k]=lerp(P[k],A[k],w);
  for(const j of ['torso','head','armR','armL','legR','legL'])
    for(const a in P[j])P[j][a]=lerp(P[j][a],A[j][a],w)}
M3.mixPose=mixPose;
function envAttack(k,a,b){return smooth(seg(k,0,a))*(1-smooth(seg(k,b||.85,1)))}
M3.envAttack=envAttack;
function envSust(k,a){return smooth(seg(k,0,a||.15))*(1-smooth(seg(k,.86,1)))}
M3.envSust=envSust;

// ---------- сборка Миши ----------
function buildMisha(){
  const g=new T.Group();
  const blue='#1e2a5e',blue2='#24336e',skin='#e8b98a',white='#f2f2f2',red='#d5372f';
  const pelvis=new T.Group();pelvis.position.y=.92;g.add(pelvis);
  pelvis.add(box(.4,.2,.26,blue));
  const torso=new T.Group();torso.position.y=.1;pelvis.add(torso);
  const tm=box(.46,.5,.27,blue);tm.position.y=.27;torso.add(tm);
  const chest=new T.Mesh(new T.PlaneGeometry(.2,.1),new T.MeshBasicMaterial({map:textTex(['ОМГ'],{w:128,h:64,bg:'#101736',color:'#ffd24a',fs:52}),transparent:false}));
  chest.position.set(0,.33,.137);torso.add(chest);
  for(const s of[-1,1]){const st=box(.03,.46,.29,white);st.position.set(s*.235,.28,0);torso.add(st)}
  const head=new T.Group();head.position.y=.62;torso.add(head);
  const faceMats=[];const side=mat(skin);
  const fm=new T.MeshBasicMaterial({map:faceTex({angry:true,smirk:true})});
  const hm=new T.Mesh(new T.BoxGeometry(.24,.26,.24),[side,side,side,side,fm,side]);hm.position.y=.15;head.add(hm);
  const hair=box(.26,.09,.26,'#3a2c1e');hair.position.y=.29;head.add(hair);
  const earR=sph(.045,skin);earR.position.set(.13,.15,0);head.add(earR);
  const earL=earR.clone();earL.position.x=-.13;head.add(earL);
  function arm(sideX){
    const sh=new T.Group();sh.position.set(sideX*.3,.52,0);torso.add(sh);
    const up=box(.11,.3,.11,blue2);up.position.y=-.15;sh.add(up);
    const el=new T.Group();el.position.y=-.31;sh.add(el);
    const fo=box(.095,.28,.095,skin);fo.position.y=-.13;el.add(fo);
    const fist=sph(.08,skin,0,10);fist.position.y=-.3;el.add(fist);
    const band=sph(.085,red,0,10);band.position.y=-.22;band.scale.set(1,.5,1);el.add(band);
    return{sh,el}}
  const armR=arm(1),armL=arm(-1);
  function leg(sideX){
    const hip=new T.Group();hip.position.set(sideX*.13,-.02,0);pelvis.add(hip);
    const th=box(.15,.4,.15,blue2);th.position.y=-.2;hip.add(th);
    const st=new T.Group();st.position.y=-.42;hip.add(st);
    const sh=box(.125,.38,.125,'#1a2348');sh.position.y=-.19;st.add(sh);
    const shoe=box(.14,.09,.28,white);shoe.position.set(0,-.42,.05);st.add(shoe);
    const stripe=box(.145,.03,.29,red);stripe.position.set(0,-.445,.05);st.add(stripe);
    return{hip,st}}
  const legR=leg(1),legL=leg(-1);
  // тень-блоб
  const shd=new T.Mesh(new T.CircleGeometry(.55,20),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.34,depthWrite:false}));
  shd.rotation.x=-Math.PI/2;shd.position.y=.012;g.add(shd);
  return{g,pelvis,torso,head,armR,armL,legR,legL,shadow:shd,baseY:.92};
}
M3.buildMisha=buildMisha;
M3.applyPose=function(rig,P){
  rig.pelvis.position.y=rig.baseY+P.pelvisY+P.rootY;
  rig.pelvis.position.x=P.rootX;rig.pelvis.position.z=P.rootZ;
  rig.pelvis.rotation.set(P.rootRX,0,P.rootRZ);
  rig.g.rotation.y+=0; // поворот корня — снаружи
  rig.torso.rotation.set(P.torso.x,P.torso.y,P.torso.z);
  rig.head.rotation.set(P.head.x,P.head.y,P.head.z);
  rig.armR.sh.rotation.set(P.armR.x,P.armR.y,P.armR.z);rig.armR.el.rotation.x=P.armR.el;
  rig.armL.sh.rotation.set(P.armL.x,P.armL.y,P.armL.z);rig.armL.el.rotation.x=P.armL.el;
  rig.legR.hip.rotation.set(P.legR.x,P.legR.y,P.legR.z);rig.legR.st.rotation.x=P.legR.knee;
  rig.legL.hip.rotation.set(P.legL.x,P.legL.y,P.legL.z);rig.legL.st.rotation.x=P.legL.knee;
};

// ---------- библиотека движений (k=фаза 0..1, P=поза, o=контекст) ----------
const M={};
M3.moves=M;
M.guard=function(t,P,op){op=op||{};
  P.pelvisY-=.05-.02*Math.sin(t*7);
  P.torso.x+=.12;P.torso.y+=.18;P.head.x+=-.06;
  P.armR.x-=.55;P.armR.y-=.2;P.armR.z+=.18;P.armR.el-=1.85;
  P.armL.x-=.55;P.armL.y+=.2;P.armL.z-=.18;P.armL.el-=1.85;
  P.legR.x-=.22;P.legR.knee+=.35;P.legR.z+=.06;
  P.legL.x+=.08;P.legL.knee+=.3;P.legL.z-=.06;
};
M.bounce=function(t,P){P.pelvisY+=.045*Math.abs(Math.sin(t*5.2));P.head.z+=.05*Math.sin(t*5.2)};
M.walk=function(t,P,speed){speed=speed||1;const ph=t*7*speed;
  P.legR.x+=.5*Math.sin(ph);P.legL.x+=.5*Math.sin(ph+Math.PI);
  P.legR.knee+=.45*Math.max(0,Math.sin(ph+2.4));P.legL.knee+=.45*Math.max(0,Math.sin(ph+2.4+Math.PI));
  P.armR.x+=.4*Math.sin(ph+Math.PI);P.armL.x+=.4*Math.sin(ph);
  P.pelvisY+=.03*Math.abs(Math.sin(ph));P.torso.x+=.08};
M.jab=function(k,P,o){const w=easeOut(seg(k,.05,.5))*(1-seg(k,.72,1));
  const A=newPose();A.armR.x=-1.62;A.armR.el=-.12;A.armR.y=-.05;A.armR.z=-.05;
  A.torso.y=-.4;A.torso.x=.18;A.head.y=-.1;A.pelvisY=-.08;
  mixPose(P,A,w)};
M.cross=function(k,P,o){const w=easeOut(seg(k,.08,.55))*(1-seg(k,.75,1));
  const A=newPose();A.armL.x=-1.68;A.armL.el=-.1;A.armL.y=.05;A.armL.z=.05;
  A.torso.y=.55;A.torso.x=.2;A.rootRY=-.18;A.pelvisY=-.1;
  A.legR.x=-.35;A.legR.knee=.3;
  mixPose(P,A,w)};
M.hook=function(k,P,o){const w=easeOut(seg(k,.1,.5))*(1-seg(k,.78,1));
  const A=newPose();A.armR.x=-1.5;A.armR.el=-1.3;A.armR.y=lerp(.8,-.8,easeOut(seg(k,.05,.5)));
  A.torso.y=lerp(.3,-.5,easeOut(seg(k,.05,.5)));A.pelvisY=-.1;
  mixPose(P,A,w)};
M.upper=function(k,P,o){const dip=1-seg(k,.3,.45),w=easeOut(seg(k,.42,.7))*(1-seg(k,.85,1));
  P.pelvisY-=.14*dip;P.torso.x+=.3*dip;
  const A=newPose();A.armR.x=-2.75;A.armR.el=-.4;A.torso.y=-.35;A.torso.x=-.18;
  A.pelvisY=.12;A.head.x=-.2;A.rootRY=-.12;
  mixPose(P,A,w)};
M.kick=function(k,P,o){const w=easeOut(seg(k,.1,.5))*(1-seg(k,.8,1));
  const A=newPose();A.legR.x=lerp(-.4,-1.8,easeOut(seg(k,.08,.5)))*(1-seg(k,.8,1)*.0);
  A.legR.knee=lerp(1.7,.15,easeOut(seg(k,.15,.55)));
  A.torso.x=-.38;A.torso.y=.35;A.head.x=.1;
  A.armR.x=-.9;A.armR.z=+.7;A.armR.el=-.8;A.armL.x=-.6;A.armL.z=-.8;A.armL.el=-1.2;
  A.pelvisY=-.06;
  mixPose(P,A,w)};
M.roundhouse=function(k,P,o){const w=easeOut(seg(k,.12,.55))*(1-seg(k,.82,1));
  const A=newPose();A.legR.x=-1.9;A.legR.knee=lerp(1.8,.1,easeOut(seg(k,.2,.6)));A.legR.y=.3;
  A.rootRY=lerp(-.5,.9,easeOut(seg(k,.05,.6)));A.torso.x=-.45;A.torso.y=lerp(.4,-.4,easeOut(seg(k,.05,.6)));
  A.armR.x=-1.4;A.armR.z=1.0;A.armR.el=-.6;A.armL.x=-.4;A.armL.z=-1.1;
  mixPose(P,A,w)};
M.stomp=function(k,P,o){ // «НАДЕЛ НОГОЙ и подвигал»
  const lift=easeIO(seg(k,.05,.4)),hold=k>.4&&k<.58,slam=easeIn(seg(k,.58,.68)),wig=k>.7;
  const A=newPose();
  if(k<.58){A.legR.x=lerp(-.2,-1.15,lift);A.legR.knee=lerp(.3,1.9,lift);A.torso.x=-.12;A.armR.x=-1.2;A.armR.z=.5;A.armL.x=-1.2;A.armL.z=-.5;A.armL.el=-1;A.armR.el=-1}
  else{A.legR.x=lerp(-1.15,-.03,slam);A.legR.knee=lerp(1.9,.1,slam);A.torso.x=.1}
  if(wig){const s=(k-.7)*46;A.rootRY+=.14*Math.sin(s);A.legR.x+=.12*Math.sin(s);A.legR.knee+=.2*Math.max(0,Math.sin(s));A.torso.y+=.12*Math.sin(s);A.head.z=.1*Math.sin(s)}
  mixPose(P,A,k<.58?lift:1)};
M.throwT=function(k,P,o){const w=easeOut(seg(k,.3,.55))*(1-seg(k,.85,1));
  const wind=1-seg(k,.28,.4);
  P.armR.z+=.9*wind;P.armR.el-=1.6*wind;P.torso.y+=.4*wind;
  const A=newPose();A.armR.x=-1.75;A.armR.el=-.2;A.armR.z=.1;A.torso.y=-.55;A.torso.x=.22;A.legR.x=-.4;
  mixPose(P,A,w)};
M.dodge=function(k,P,o){const dir=(o&&o.dir)||1,w=Math.sin(Math.PI*clamp(k*1.15));
  P.rootX+=dir*.5*w;P.torso.z-=dir*.35*w;P.pelvisY-=.1*w;P.head.z-=dir*.2*w;
  P.armR.x-=.3*w;P.armL.x-=.3*w};
M.hitReact=function(k,P,o){const w=Math.sin(Math.PI*clamp(k*1.2));
  P.head.x+=.4*w;P.torso.x-=.3*w;P.rootX-=.16*w;P.armR.z+=.4*w;P.armL.z-=.4*w};
M.block=function(k,P,o){const w=envSust(k,.2);
  const A=newPose();A.armR.x=-1.15;A.armR.el=-2.3;A.armR.z=.35;A.armL.x=-1.15;A.armL.el=-2.3;A.armL.z=-.35;A.head.x=.15;A.torso.x=.2;
  mixPose(P,A,w)};
M.taunt=function(k,P,o){const w=envSust(k,.25);
  const A=newPose();A.armR.x=-1.35;A.armR.el=-.8;A.armR.y=.3*Math.sin(k*18);A.head.y=.15*Math.sin(k*14);A.torso.y=-.15;A.head.z=.08;
  mixPose(P,A,w)};
M.point=function(k,P,o){const w=envSust(k,.2);
  const A=newPose();A.armR.x=-1.58;A.armR.el=-.03;A.torso.y=-.3;A.head.x=-.05;
  mixPose(P,A,w)};
M.winJump=function(k,P,o){const w=1;
  const A=newPose();A.armR.x=-2.95;A.armR.z=.35;A.armL.x=-2.95;A.armL.z=-.35;A.armR.el=-.2;A.armL.el=-.2;
  A.pelvisY=.32*Math.abs(Math.sin(k*Math.PI*3));A.head.x=-.25;A.torso.x=-.12;
  mixPose(P,A,w)};
M.flex=function(k,P,o){const w=envSust(k,.25);
  const A=newPose();A.armR.x=-.4;A.armR.z=1.25;A.armR.el=-2.1;A.armL.x=-.4;A.armL.z=-1.25;A.armL.el=-2.1;
  A.torso.x=-.12;A.head.x=-.15;A.pelvisY=-.02;
  mixPose(P,A,w)};
M.koFly=function(k,P,o){ // отлетает и падает
  P.rootRX=-1.35*easeIn(seg(k,.25,.75));P.rootZ=-(o&&o.back||.8)*easeOut(seg(k,.2,.9));
  P.pelvisY=.15*Math.sin(Math.PI*seg(k,.2,.8));
  P.armR.x=-2.2;P.armL.x=-2.4;P.armR.z=.8;P.armL.z=-.9;P.armR.el=-.3;P.armL.el=-.3;
  P.legR.x=-.5;P.legL.x=-.7;P.legR.knee=.8;P.legL.knee=.5};
M.jump=function(k,P,o){const w=Math.sin(Math.PI*clamp(k*1.1));
  P.pelvisY+=.5*w;P.legR.x-=.5*w;P.legL.x-=.5*w;P.legR.knee+=.9*w;P.legL.knee+=.9*w;
  P.armR.x-=1.2*w;P.armL.x-=1.2*w;P.torso.x+=.15*w};
M.sit=function(k,P,o){P.pelvisY=-.55;P.legR.x=-1.5;P.legR.knee=1.4;P.legL.x=-1.5;P.legL.knee=1.4;
  P.torso.x=.12;P.armR.x=-.5;P.armR.el=-1.5;P.armL.x=-.5;P.armL.el=-1.5};
M.stir=function(k,P,o){ // мешает суп
  const A=newPose();A.armR.x=-1.1;A.armR.z=.25;A.armR.el=-.9;A.armR.y=.4*Math.sin(k*TAU*3);
  A.torso.x=.15;A.torso.y=-.2;A.head.x=.12;
  mixPose(P,A,.9)};

// врагам: лёгкий общий риг-хелпер (наклониться к цели)
M3.faceEach=function(rigA,rigB){ // A смотрит на B (в плоскости XZ)
  const dx=rigB.g.position.x-rigA.g.position.x,dz=rigB.g.position.z-rigA.g.position.z;
  rigA.g.rotation.y=Math.atan2(dx,dz)};
M3.moveTo=function(g,x,z){g.position.x=x;g.position.z=z};

// утилита хронологии: активные биты
M3.activeBeats=function(beats,t,pad){const out=[];for(const b of beats){const d=b.d||0;
  if(t>=b.t-(pad||0)&&t<=b.t+d+((b.k==='burst'||b.k==='ring'||b.k==='dmg')?(b.dur||b.d||0)+1.2:0))out.push(b)}return out};
})();
