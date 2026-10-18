// misha-things.js — враги и миры для «МИША ПРОТИВ ВСЕГО».
(function(){
const M3=window.M3,T=window.THREE,U=M3.utils;
const {box,sph,cyl,cone}=M3.prims;const {mat,faceTex,textTex,glowSprite}=M3;
const {clamp,lerp,seg,easeOut,easeIn,easeIO,rng,TAU}=U;
const M3F=M3;

// ---------- общие хелперы ----------
function shadowDisc(r){const m=new T.Mesh(new T.CircleGeometry(r,18),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.32,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.013;return m}
M3F.shadowDisc=shadowDisc;
function eyes(g,x,y,z,r,col){for(const s of[-1,1]){const e=sph(r,col||'#fff',0,8);e.position.set(x*s,y,z);g.add(e);
  const p=sph(r*.45,'#141420',0,8);p.position.set(x*s,y,z+r*.75);g.add(p)}}
M3F.eyes=eyes;
function angBrow(g,x,y,z,w){for(const s of[-1,1]){const b=box(w,.03,.03,'#22222a');b.position.set(x*s,y,z);
  b.rotation.z=s*-.5;g.add(b)}}

// пыль/звёзды как Points (статичные или дрейф)
function makePoints(n,fn,size,op){const pos=new Float32Array(n*3),col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const p=fn(i);pos[i*3]=p[0];pos[i*3+1]=p[1];pos[i*3+2]=p[2];
    col[i*3]=p[3][0];col[i*3+1]=p[3][1];col[i*3+2]=p[3][2]}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));
  const m=new T.PointsMaterial({size,vertexColors:true,transparent:true,opacity:op===undefined?.9:op,blending:T.AdditiveBlending,depthWrite:false});
  const pts=new T.Points(g,m);pts.frustumCulled=false;return pts}
M3F.makePoints=makePoints;
const C=h=>new T.Color(h);

// ---------- враг: БАКТЕРИЯ ----------
M3F.buildBacteria=function(){
  const g=new T.Group();const body=new T.Group();g.add(body);
  const b=sph(.42,'#7ed957',0,18);b.scale.set(1,.82,.92);b.position.y=.42;body.add(b);
  const core=sph(.2,'#4ba83c',0,12);core.position.y=.44;body.add(core);
  const r=rng(7);for(let i=0;i<16;i++){const a=i/16*TAU;const ci=cyl(.018,.018,.16,'#b8f09a');ci.position.set(Math.cos(a)*.4,.28+((i%3)*.12),Math.sin(a)*.36);
    ci.rotation.z=Math.cos(a)*.5;ci.rotation.x=Math.sin(a)*.5;body.add(ci)}
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#7ed957',angry:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.42,.42),fm);face.position.set(0,.5,.382);body.add(face);
  const sh=shadowDisc(.5);g.add(sh);
  return{g,body,face,fm,sh,size:1,kind:'bacteria',
    idle(t,S){body.scale.set(1+.06*Math.sin(t*5),1-.06*Math.sin(t*5),1+.04*Math.sin(t*4.3));
      g.position.y=.02*Math.abs(Math.sin(t*3.7))},
    act(name,k,S){
      if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.1));body.scale.set(1+.35*w,1+.3*w,1+.35*w);g.position.y=.5*Math.sin(Math.PI*clamp(k*1.05))}
      else if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.3));body.scale.set(1-.3*w,1-.45*w,1-.3*w);g.rotation.z=.5*w}
      else if(name==='ko'){g.rotation.x=-1.5*easeIn(seg(k,.3,.8));g.position.y=.4*Math.sin(Math.PI*seg(k,.1,.7))*(1-seg(k,.7,1));
        body.scale.setScalar(1-.25*seg(k,0,.3));this.fm.map=faceTex({bg:'#7ed957',ko:true});this.fm.needsUpdate=true}
      else if(name==='pop'){body.scale.setScalar(lerp(1,.15,easeIn(k)))}}
  }};

// ---------- враг: ИНФУЗОРИЯ (рой) ----------
M3F.buildParamecium=function(seed){
  const g=new T.Group();const body=new T.Group();g.add(body);
  const r=rng(seed);
  const col=['#9fd8ff','#ffb3d9','#c5f77e','#ffd08a','#b39dff'][seed%5];
  const b=sph(.3,col,0,16);b.scale.set(.75,.62,1.5);b.position.y=.3;body.add(b);
  for(let i=0;i<10;i++){const a=i/10*Math.PI-Math.PI/2;const ci=cyl(.015,.015,.12,'#ffffff',null,8);ci.position.set(0,.3,Math.sin(a)*.46);
    ci.rotation.x=Math.PI/2;ci.position.x=Math.cos(a)*.24;body.add(ci)}
  const face=new T.Mesh(new T.PlaneGeometry(.3,.3),new T.MeshBasicMaterial({map:faceTex({bg:col,angry:true})}));
  face.position.set(0,.34,.46);body.add(face);
  g.add(shadowDisc(.4));
  return{g,body,face,fm2:face.material,size:.7,kind:'param',
    idle(t,S){body.rotation.z=.15*Math.sin(t*6+seed);g.position.y=.03*Math.sin(t*5+seed*2)},
    act(name,k,S){
      if(name==='hurt'){body.scale.setScalar(1-.3*Math.sin(Math.PI*k))}
      else if(name==='ko'){const w=easeIn(seg(k,.1,.6));g.rotation.x=-2*w;g.position.y=.8*Math.sin(Math.PI*seg(k,.05,.6));body.scale.setScalar(1-.5*w)}}}};

// ---------- враг: ТАРАКАН ----------
M3F.buildRoach=function(){
  const g=new T.Group();const body=new T.Group();g.add(body);
  const back=sph(.34,'#5c3a1e',0,14);back.scale.set(.85,.45,1.35);back.position.y=.2;body.add(back);
  const head=sph(.14,'#3d250f',0,10);head.position.set(0,.16,.5);body.add(head);
  angBrow(body,.09,.28,.56,.1);
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#3d250f',angry:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.2,.2),fm);face.position.set(0,.18,.645);body.add(face);
  for(const s of[-1,1]){const an=cyl(.012,.012,.5,'#2e1c0a',null,6);an.position.set(s*.06,.22,.62);an.rotation.x=1.25;an.rotation.z=s*-.5;body.add(an)}
  const legs=[];
  for(let i=0;i<3;i++)for(const s of[-1,1]){const l=new T.Group();l.position.set(s*.28,.18,.3-i*.3);
    const l1=box(.28,.03,.04,'#4a2f16');l1.position.x=s*.14;l1.rotation.z=s*.5;l.add(l1);body.add(l);legs.push(l)}
  g.add(shadowDisc(.45));
  return{g,body,legs,fm,sh:1,size:1,kind:'roach',
    idle(t,S){body.position.y=.02*Math.abs(Math.sin(t*9));
      for(let i=0;i<legs.length;i++){legs[i].rotation.y=.25*Math.sin(t*22+i*1.7)}},
    act(name,k,S){
      if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.15));g.position.y=.35*Math.sin(Math.PI*clamp(k*1.05));body.rotation.x=-.5*w}
      else if(name==='dodge'){g.position.z=-.6*Math.sin(Math.PI*clamp(k*1.2));body.rotation.y=.9*Math.sin(Math.PI*clamp(k))}
      else if(name==='hurt'){body.rotation.z=.7*Math.sin(Math.PI*clamp(k*1.4));body.position.y=.15*Math.sin(Math.PI*k)}
      else if(name==='ko'){g.rotation.z=Math.PI*easeIn(seg(k,.2,.7));g.position.y=.5*Math.sin(Math.PI*seg(k,.05,.5));
        this.fm.map=faceTex({bg:'#3d250f',ko:true});this.fm.needsUpdate=true}}}};
// тараканье яйцо-капсула не нужна, идём дальше

// ---------- враг: КОТ ----------
M3F.buildCat=function(){
  const g=new T.Group();const body=new T.Group();g.add(body);
  const torso=box(.55,.32,.75,'#8a6b4a');torso.position.y=.42;body.add(torso);
  const chest=box(.5,.3,.3,'#c9b295');chest.position.set(0,.4,.3);body.add(chest);
  const headG=new T.Group();headG.position.set(0,.68,.42);body.add(headG);
  const head=box(.34,.3,.3,'#8a6b4a');headG.add(head);
  for(const s of[-1,1]){const ear=cone(.07,.14,'#8a6b4a',null,4);ear.position.set(s*.11,.2,0);headG.add(ear)}
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#8a6b4a',angry:true,mustache:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.3,.28),fm);face.position.set(0,.01,.155);headG.add(face);
  const tail=new T.Group();tail.position.set(0,.52,-.38);body.add(tail);
  const t1=box(.07,.07,.5,'#8a6b4a');t1.position.z=-.25;tail.add(t1);
  const pawL=[],pawR=[];
  for(let i=0;i<2;i++)for(const s of[-1,1]){const p=box(.11,.3,.13,'#7a5d3f');p.position.set(s*.19,.15,.28-i*.5);body.add(p);(s>0?pawR:pawL).push(p)}
  g.add(shadowDisc(.55));
  return{g,body,headG,tail,fm,paws:[...pawL,...pawR],size:1.1,kind:'cat',
    idle(t,S){tail.rotation.y=.7*Math.sin(t*3.2);tail.rotation.x=.3+.2*Math.sin(t*2.1);
      body.position.y=.02*Math.sin(t*4);headG.rotation.z=.08*Math.sin(t*1.7)},
    act(name,k,S){
      if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.1));headG.rotation.x=-.7*w;body.rotation.x=.35*w;
        pawL.forEach((p,i)=>{p.rotation.x=-1.6*w*Math.sin(Math.PI*(k*2-i*.2))})}
      else if(name==='hurt'){body.rotation.z=.6*Math.sin(Math.PI*clamp(k*1.3));body.position.y=.2*Math.sin(Math.PI*k)}
      else if(name==='ko'){g.rotation.z=Math.PI*easeIn(seg(k,.25,.75));g.position.y=.7*Math.sin(Math.PI*seg(k,.1,.6));
        this.fm.map=faceTex({bg:'#8a6b4a',ko:true});this.fm.needsUpdate=true;
        tail.rotation.y=2*Math.sin(Math.PI*seg(k,.1,.9))}}}};
// короткая шерсть, длинная наглость

// ---------- враг: ГУСЬ ----------
M3F.buildGoose=function(seed){
  seed=seed||0;const g=new T.Group();const body=new T.Group();g.add(body);
  const tor=sph(.42,'#f2f2ec',0,14);tor.scale.set(.85,.8,1.25);tor.position.y=.55;body.add(tor);
  const neck=new T.Group();neck.position.set(0,.75,.35);body.add(neck);
  const nk=cyl(.09,.13,.55,'#f2f2ec');nk.position.y=.27;neck.add(nk);
  const headG=new T.Group();headG.position.y=.58;neck.add(headG);
  const head=sph(.13,'#f2f2ec',0,10);headG.add(head);
  const beak=cone(.05,.16,'#ff9f1c',null,6);beak.rotation.x=Math.PI/2;beak.position.set(0,.0,.16);headG.add(beak);
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#f2f2ec',angry:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.18,.18),fm);face.position.set(0,.03,.1);headG.add(face);
  const wings=[];for(const s of[-1,1]){const w=new T.Group();w.position.set(s*.35,.68,0);body.add(w);
    const wm=box(.06,.3,.7,'#e4e4da');wm.position.z=-.1;w.add(wm);wings.push(w)}
  const legs=[];for(const s of[-1,1]){const l=cyl(.03,.03,.35,'#ff9f1c',null,6);l.position.set(s*.13,.18,0);body.add(l);legs.push(l);
    const ft=box(.14,.03,.2,'#ff9f1c');ft.position.set(s*.13,.02,.05);body.add(ft)}
  g.add(shadowDisc(.5));
  return{g,body,neck,headG,wings,fm,size:1.4,kind:'goose',
    idle(t,S){neck.rotation.x=.2*Math.sin(t*3+seed);neck.rotation.z=.15*Math.sin(t*2.2+seed*3);
      body.position.y=.03*Math.sin(t*6+seed)},
    act(name,k,S){
      if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.1));neck.rotation.x=-1.1*w;body.rotation.x=.3*w;
        wings.forEach((wg,i)=>{wg.rotation.z=(i?1:-1)*1.2*w})}
      else if(name==='flap'){wings.forEach((wg,i)=>{wg.rotation.z=(i?1:-1)*(.8*Math.sin(k*Math.PI*6)+.3)})}
      else if(name==='hurt'){body.rotation.z=.5*Math.sin(Math.PI*clamp(k*1.3))}
      else if(name==='ko'){g.rotation.z=2.4*easeIn(seg(k,.15,.7));g.position.y=.9*Math.sin(Math.PI*seg(k,.05,.6));
        this.fm.map=faceTex({bg:'#f2f2ec',ko:true});this.fm.needsUpdate=true;
        wings.forEach((wg,i)=>{wg.rotation.z=(i?1:-1)*.6})}}}};

// ---------- враг: МЕДВЕДЬ ----------
M3F.buildBear=function(){
  const g=new T.Group();const body=new T.Group();g.add(body);
  const torso=sph(.8,'#6b4a2c',0,16);torso.scale.set(.9,.95,1.15);torso.position.y=1.05;body.add(torso);
  const hump=sph(.4,'#5d3f24',0,10);hump.position.set(0,1.55,-.4);body.add(hump);
  const headG=new T.Group();headG.position.set(0,1.6,.75);body.add(headG);
  const head=sph(.38,'#6b4a2c',0,12);headG.add(head);
  const snout=sph(.18,'#c9a67a',0,10);snout.position.set(0,-.08,.3);headG.add(snout);
  const nose=sph(.06,'#1c1410',0,8);nose.position.set(0,-.03,.46);headG.add(nose);
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#6b4a2c',angry:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.4,.4),fm);face.position.set(0,.12,.34);headG.add(face);
  for(const s of[-1,1]){const ear=sph(.11,'#5d3f24',0,8);ear.position.set(s*.26,.3,0);headG.add(ear)}
  const armL=new T.Group(),armR=new T.Group();armL.position.set(-.75,1.5,.2);armR.position.set(.75,1.5,.2);body.add(armL,armR);
  for(const a of[armL,armR]){const am=sph(.22,'#6b4a2c',0,10);am.scale.set(1,1.9,1);am.position.y=-.35;a.add(am);
    const claw=sph(.14,'#d8cbb2',0,8);claw.scale.set(1,1.3,1);claw.position.set(0,-.85,.06);a.add(claw)}
  const legs=[];for(const s of[-1,1]){const l=sph(.28,'#5d3f24',0,10);l.scale.set(.8,1.2,1.1);l.position.set(s*.42,.35,.1);body.add(l);legs.push(l)}
  g.add(shadowDisc(1.15));
  return{g,body,headG,armL,armR,fm,size:2.6,kind:'bear',
    idle(t,S){body.position.y=.03*Math.sin(t*3.4);headG.rotation.z=.06*Math.sin(t*1.6);headG.rotation.x=.1*Math.sin(t*1.1);
      armL.rotation.x=.15*Math.sin(t*2.3);armR.rotation.x=.15*Math.sin(t*2.3+1)},
    act(name,k,S){
      if(name==='roar'){const w=Math.sin(Math.PI*clamp(k*1.05));headG.rotation.x=-.5*w;body.scale.setScalar(1+.08*w);
        armL.rotation.x=-1.2*w;armR.rotation.x=-1.2*w;armL.rotation.z=-.5*w;armR.rotation.z=.5*w}
      else if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.15));const side=S&&S.alt?armL:armR;
        side.rotation.x=-2.1*w;side.rotation.z=(S&&S.alt?0.5:-0.5)*w;body.rotation.x=.3*w}
      else if(name==='hurt'){body.rotation.z=.4*Math.sin(Math.PI*clamp(k*1.3));headG.rotation.x=.5*Math.sin(Math.PI*k)}
      else if(name==='ko'){g.rotation.x=-1.35*easeIn(seg(k,.3,.85));g.position.y=.4*Math.sin(Math.PI*seg(k,.15,.75));
        this.fm.map=faceTex({bg:'#6b4a2c',ko:true});this.fm.needsUpdate=true;
        armL.rotation.x=-1.6;armR.rotation.x=-1.6}}}};
// медведь готов, шапка-ушанка не завезла

// ---------- общий человеческий риг (гопник, дед) ----------
M3F.buildHuman=function(o){
  const g=new T.Group();
  const suit=o.suit||'#15151c',skin=o.skin||'#e8b98a',pants=o.pants||suit;
  const pelvis=new T.Group();pelvis.position.y=.92;g.add(pelvis);
  pelvis.add(box(.42,.2,.27,pants));
  const torso=new T.Group();torso.position.y=.1;pelvis.add(torso);
  const tm=box(.5,.52,.3,suit);tm.position.y=.28;torso.add(tm);
  if(o.belt){const bl=box(.52,.07,.32,'#2a2a30');bl.position.y=.05;torso.add(bl)}
  const head=new T.Group();head.position.y=.66;torso.add(head);
  const fm=new T.MeshBasicMaterial({map:faceTex(o.face||{angry:true})});
  const side=mat(skin);
  const hm=new T.Mesh(new T.BoxGeometry(.25,.27,.25),[side,side,side,side,fm,side]);hm.position.y=.15;head.add(hm);
  if(o.hair){const hair=box(.27,.1,.27,o.hair);hair.position.y=.3;head.add(hair)}
  if(o.cap==='flat'){const cap=box(.3,.07,.32,'#0c0c12');cap.position.set(0,.28,.03);head.add(cap);
    const brim=box(.3,.02,.14,'#0c0c12');brim.position.set(0,.25,.22);head.add(brim)}
  if(o.cap==='ushanka'){const cap=box(.31,.14,.31,'#4a4238');cap.position.y=.33;head.add(cap);
    for(const s of[-1,1]){const flap=box(.05,.16,.22,'#5a5248');flap.position.set(s*.18,.12,.08);head.add(flap)}}
  if(o.beard){const bd=cone(.14,.3,'#cfcfd6',null,8);bd.rotation.x=Math.PI;bd.position.set(0,.02,.1);head.add(bd)}
  if(o.chain){const ch=box(.3,.03,.03,'#ffd24a');ch.position.set(0,.42,.16);ch.rotation.z=.2;torso.add(ch)}
  function arm(sideX){const sh=new T.Group();sh.position.set(sideX*.33,.5,0);torso.add(sh);
    const up=box(.12,.3,.12,suit);up.position.y=-.15;sh.add(up);
    const el=new T.Group();el.position.y=-.31;sh.add(el);
    const fo=box(.1,.28,.1,skin);fo.position.y=-.13;el.add(fo);
    const fist=sph(.08,skin,0,10);fist.position.y=-.3;el.add(fist);
    return{sh,el}}
  const armR=arm(1),armL=arm(-1);
  function leg(sideX){const hip=new T.Group();hip.position.set(sideX*.14,-.02,0);pelvis.add(hip);
    const th=box(.16,.4,.16,pants);th.position.y=-.2;hip.add(th);
    const st=new T.Group();st.position.y=-.42;hip.add(st);
    const sh=box(.14,.38,.14,pants);sh.position.y=-.19;st.add(sh);
    const shoe=box(.15,.1,.29,o.shoe||'#231f1c');shoe.position.set(0,-.43,.05);st.add(shoe);
    return{hip,st}}
  const legR=leg(1),legL=leg(-1);
  let prop=null;
  if(o.prop==='broom'){prop=new T.Group();const stick=cyl(.025,.025,1.1,'#8a6b3f',null,6);prop.add(stick);
    const bristles=new T.Group();bristles.position.y=-.55;prop.add(bristles);
    for(let i=0;i<6;i++){const br=box(.03,.3,.03,'#c9a75a');br.position.set((i-2.5)*.05,0,0);br.rotation.x=.2;bristles.add(br)}
    prop.rotation.x=Math.PI/2.2;armR.el.add(prop);prop.position.set(0,-.34,0)}
  g.add(shadowDisc(.55));
  const rig={g,pelvis,torso,head,armR,armL,legR,legL,fm,prop,baseY:.92,size:o.size||1.8,kind:o.kind,
    apply(P){M3F.applyPose(this,P)}};
  return rig};

// ---------- враг: ГОПНИК ----------
M3F.buildGopnik=function(){
  const rig=M3F.buildHuman({suit:'#101018',pants:'#101018',skin:'#d9a878',cap:'flat',chain:true,face:{angry:true,smirk:true},kind:'gopnik'});
  const P=rig.g;
  //_seed bag: кулёк с семками
  const bag=cone(.09,.16,'#d8d8d8',null,6);bag.rotation.x=Math.PI/2.6;bag.position.set(0,-.32,.06);rig.armL.el.add(bag);
  rig.idle=function(t,S){const w=.05*Math.sin(t*4.5);
    rig.pelvis.position.y=rig.baseY-.14+w;
    rig.legR.hip.rotation.set(-1.5,.2,.5);rig.legR.st.rotation.x=2.4; // присед
    rig.legL.hip.rotation.set(-1.5,-.2,-.5);rig.legL.st.rotation.x=2.4;
    rig.armR.sh.rotation.set(-.4,0,.35);rig.armR.el.rotation.x=-.9;
    rig.armL.sh.rotation.set(-.5,0,-.4);rig.armL.el.rotation.x=-1.4;
    rig.torso.rotation.x=.3;rig.head.rotation.x=-.25};
  rig.act=function(name,k,S){const sh=rig.armR.sh,el=rig.armR.el;
    if(name==='attack'){const w=Math.sin(Math.PI*clamp(k*1.1));sh.rotation.set(-1.7*w-.2,0,.1);el.rotation.x=-.2;
      rig.torso.rotation.y=-.5*w;rig.head.rotation.x=.1}
    else if(name==='seeds'){const w=Math.sin(Math.PI*clamp(k*1.2));rig.armL.sh.rotation.set(-1.9*w-.3,0,-.2);rig.armL.el.rotation.x=-.3;
      rig.armR.sh.rotation.set(-1.9*w-.3,0,.2);rig.armR.el.rotation.x=-.3}
    else if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.4));rig.head.rotation.x=.5*w;rig.torso.rotation.x=-.4*w}
    else if(name==='ko'){const w=easeIn(seg(k,.2,.7));
      rig.g.rotation.x=-1.5*w;rig.g.position.y=.6*Math.sin(Math.PI*seg(k,.1,.6));
      rig.armR.sh.rotation.z=1.2;rig.armL.sh.rotation.z=-1.4;
      rig.fm.map=faceTex({ko:true,smirk:true});rig.fm.needsUpdate=true}};
  return rig};

// ---------- враг: ТИ-РЕКС ----------
M3F.buildTRex=function(){
  const g=new T.Group();const s=3.2; // масштаб
  const body=new T.Group();body.scale.setScalar(s);g.add(body);
  const torso=box(1.1,1.3,2.2,'#4a6b3a');torso.position.set(0,2.1,.2);torso.rotation.x=-.15;body.add(torso);
  const belly=box(1.0,1.0,1.9,'#5d7f49');belly.position.set(0,1.8,.3);body.add(belly);
  const tail=new T.Group();tail.position.set(0,2.2,-1.1);body.add(tail);
  let tp=tail;for(let i=0;i<4;i++){const seg=box(.85-i*.18,.8-i*.15,1.1,'#4a6b3a');seg.position.z=-.55;const nx=new T.Group();nx.position.z=-1.0;tp.add(seg);tp.add(nx);tp=nx}
  const headG=new T.Group();headG.position.set(0,3.1,1.5);body.add(headG);
  const skull=box(.95,.9,1.3,'#5d7f49');skull.position.z=.3;headG.add(skull);
  const jaw=new T.Group();jaw.position.set(0,-.35,.15);headG.add(jaw);
  const jawM=box(.8,.3,1.25,'#4a6b3a');jawM.position.z=.35;jaw.add(jawM);
  for(let i=0;i<5;i++){const t1=cone(.06,.2,'#fff',null,4);t1.position.set(-.32+i*.16,-.05,1.0);t1.rotation.x=Math.PI;headG.add(t1);
    const t2=t1.clone();t2.position.y=-.42;t2.rotation.x=0;jaw.add(t2)}
  const fm=new T.MeshBasicMaterial({map:faceTex({bg:'#5d7f49',angry:true})});
  const face=new T.Mesh(new T.PlaneGeometry(.8,.8),fm);face.position.set(0,.25,1.16);headG.add(face);
  const armL=new T.Group(),armR=new T.Group();armL.position.set(-.5,2.5,1.0);armR.position.set(.5,2.5,1.0);body.add(armL,armR);
  for(const a of[armL,armR]){const am=box(.18,.5,.18,'#4a6b3a');am.position.y=-.25;a.add(am)}
  const legL=new T.Group(),legR=new T.Group();legL.position.set(-.55,1.6,-.2);legR.position.set(.55,1.6,-.2);body.add(legL,legR);
  for(const l of[legL,legR]){const th=box(.55,1.4,.7,'#3d5a30');th.position.y=-.7;l.add(th);
    const st=new T.Group();st.position.y=-1.35;l.add(st);
    const sh=box(.4,1.1,.5,'#4a6b3a');sh.position.y=-.55;st.add(sh);
    const ft=box(.55,.3,1.0,'#3d5a30');ft.position.set(0,-1.15,.2);st.add(ft)}
  g.add(shadowDisc(2.6));
  return{g,body,headG,jaw,tail,armL,armR,legL,legR,fm,size:6,kind:'trex',
    idle(t,S){body.position.y=.06*Math.sin(t*2.4);tail.rotation.y=.25*Math.sin(t*1.8);
      headG.rotation.z=.05*Math.sin(t*1.3);headG.rotation.x=.06*Math.sin(t*.9);
      jaw.rotation.x=.08+.05*Math.sin(t*3)},
    act(name,k,S){
      if(name==='roar'){const w=Math.sin(Math.PI*clamp(k*1.05));jaw.rotation.x=.9*w;headG.rotation.x=-.5*w;body.scale.setScalar(s*(1+.05*w))}
      else if(name==='bite'){const w=Math.sin(Math.PI*clamp(k*1.15));headG.rotation.x=lerp(.1,-.55,easeOut(seg(k,.05,.4)))*(1-seg(k,.7,1));
        jaw.rotation.x=1.1*w;g.position.y=.3*Math.sin(Math.PI*clamp(k*1.05))}
      else if(name==='stompA'){const w=easeIn(seg(k,.3,.5));legR.hip.rotation.x=-1.1*w;g.position.y=.5*Math.sin(Math.PI*seg(k,.1,.55))}
      else if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.2));headG.rotation.z=.5*w;body.rotation.z=.15*w;jaw.rotation.x=.5*w}
      else if(name==='ko'){const w=easeIn(seg(k,.35,.9));g.rotation.x=-1.35*w;g.position.y=.6*Math.sin(Math.PI*seg(k,.2,.75));
        this.fm.map=faceTex({bg:'#5d7f49',ko:true});this.fm.needsUpdate=true;jaw.rotation.x=.7;
        tail.rotation.y=1.2*Math.sin(Math.PI*seg(k,.1,.9))}}}};

// ---------- МЕГА БОСС: ДЕД ----------
M3F.buildDed=function(){
  const rig=M3F.buildHuman({suit:'#6b6248',pants:'#3d3a30',skin:'#dcc49e',cap:'ushanka',beard:true,belt:true,shoe:'#8a7a5a',face:{angry:true,mustache:true},kind:'ded',size:1.85});
  const g=rig.g;
  // аура суперсая
  const aura=glowSprite('#ffd24a',4.5,0);aura.position.y=1.3;g.add(aura);
  rig.aura=aura;
  rig.idle=function(t,S){const w=.04*Math.sin(t*3.1);
    rig.pelvis.position.y=rig.baseY-.03+w;
    rig.legR.hip.rotation.set(-.15,.05,.08);rig.legR.st.rotation.x=.25;
    rig.legL.hip.rotation.set(.08,-.05,-.08);rig.legL.st.rotation.x=.2;
    rig.armR.sh.rotation.set(-.35,0,.3);rig.armR.el.rotation.x=-1.1;
    rig.armL.sh.rotation.set(-.35,0,-.3);rig.armL.el.rotation.x=-1.1;
    rig.torso.rotation.x=.1;rig.head.rotation.z=.06*Math.sin(t*1.4);rig.head.rotation.x=.05;
    aura.material.opacity=0};
  rig.act=function(name,k,S){const shR=rig.armR.sh,shL=rig.armL.sh;
    if(name==='broomSweep'){const w=Math.sin(Math.PI*clamp(k*1.1));shR.rotation.set(-1.5,-1.1*w,.2);rig.torso.rotation.y=-.7*w;rig.head.rotation.x=.1;
      shL.rotation.set(-.4,0,-.5)}
    else if(name==='tap'){const w=Math.sin(Math.PI*clamp(k*1.15));shR.rotation.set(-2.4*w-.2,0,.1);rig.torso.rotation.x=-.25*w;
      shL.rotation.set(-.5,0,-.4);rig.head.rotation.x=-.15*w}
    else if(name==='ultimate'){const w=envHold(k);shR.rotation.set(-2.8*w,0,.15);shL.rotation.set(-2.8*w,0,-.15);
      rig.armR.el.rotation.x=-.1;rig.armL.el.rotation.x=-.1;rig.head.rotation.x=-.3*w;rig.torso.rotation.x=-.2*w;
      aura.material.opacity=w*.85;aura.scale.setScalar(4.5+1.5*w+.3*Math.sin(k*30))}
    else if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.3));rig.head.rotation.x=.55*w;rig.torso.rotation.x=-.35*w;
      aura.material.opacity=.3*w}
    else if(name==='ko'){const w=easeIn(seg(k,.3,.8));rig.g.rotation.x=-1.5*w;rig.g.position.y=.5*Math.sin(Math.PI*seg(k,.15,.65));
      rig.armR.sh.rotation.z=1.3;rig.armL.sh.rotation.z=-1.3;aura.material.opacity=0;
      rig.fm.map=faceTex({ko:true,mustache:true});rig.fm.needsUpdate=true}
    else if(name==='hug'){ // фаза супа: дед сжимает банку
      shR.rotation.set(-1.2,0,.3);rig.armR.el.rotation.x=-.6;shL.rotation.set(-1.2,0,-.3);rig.armL.el.rotation.x=-.6;
      rig.head.rotation.x=.3;rig.torso.rotation.x=.3}};
  function envHold(k){return smooth(seg(k,.05,.3))*(1-smooth(seg(k,.9,1)))}
  return rig};

// ---------- ЗЕМЛЯ ----------
M3F.buildEarth=function(){
  const g=new T.Group();
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
  x.fillStyle='#1a5fb4';x.fillRect(0,0,512,256);
  const r=rng(99);x.fillStyle='#3e9b4f';
  for(let i=0;i<26;i++){const cx=r()*512,cy=40+r()*176,n=3+r()*5|0;x.beginPath();
    for(let j=0;j<n*2;j++){const a=j/(n*2)*TAU,rad=14+r()*26;x.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.7)}x.closePath();x.fill()}
  x.fillStyle='#e8f4ff';x.fillRect(0,0,512,22);x.fillRect(0,234,512,22);
  const tex=new T.CanvasTexture(c);
  const earth=new T.Mesh(new T.SphereGeometry(4.6,40,28),new T.MeshLambertMaterial({map:tex}));
  g.add(earth);
  const cc=document.createElement('canvas');cc.width=256;cc.height=128;const xc=cc.getContext('2d');
  xc.fillStyle='rgba(255,255,255,0)';xc.fillRect(0,0,256,128);xc.fillStyle='rgba(255,255,255,.85)';
  const r2=rng(4);for(let i=0;i<20;i++){xc.beginPath();xc.ellipse(r2()*256,r2()*128,10+r2()*22,4+r2()*8,r2()*3,0,TAU);xc.fill()}
  const clouds=new T.Mesh(new T.SphereGeometry(4.75,32,22),new T.MeshLambertMaterial({map:new T.CanvasTexture(cc),transparent:true,opacity:.85,depthWrite:false}));
  g.add(clouds);
  const atmo=glowSprite('#5fb8ff',16,.5);g.add(atmo);
  const moon=new T.Mesh(new T.SphereGeometry(1.1,18,12),new T.MeshLambertMaterial({color:'#cfcfd6'}));
  g.add(moon);
  return{g,earth,clouds,moon,size:4.6,kind:'earth',
    idle(t,S){earth.rotation.y=t*.14;clouds.rotation.y=t*.1+1;moon.position.set(Math.cos(t*.35)*9,2.2,Math.sin(t*.35)*9)},
    act(name,k,S){
      if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.2));earth.scale.setScalar(1-.06*w);earth.rotation.z=.2*w;clouds.rotation.z=.3*w}
      else if(name==='ko'){const w=easeIn(seg(k,.3,.85));earth.scale.setScalar(1-.12*w);earth.rotation.z=.5*w;clouds.material.opacity=.85*(1-w)}}}};

// ---------- ГАЛАКТИКА ----------
M3F.buildGalaxy=function(){
  const g=new T.Group();
  const galaxy=new T.Group();g.add(galaxy);
  const n=6000,pos=new Float32Array(n*3),col=new Float32Array(n*3);
  const r=rng(2024);
  for(let i=0;i<n;i++){const arm=i%3,t=Math.pow(r(),.6),a=t*4.2+arm*TAU/3+(r()-.5)*.55;
    const rad=t*7.5,x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=(r()-.5)*.5*(1-t)+ (r()-.5)*.15;
    pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
    const c=t<.18?C('#ffe8b0'):t<.5?C('#bcd8ff'):C('#9fb4ff');
    const f=.55+r()*.45;col[i*3]=c.r*f;col[i*3+1]=c.g*f;col[i*3+2]=c.b*f}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));
  const pts=new T.Points(geo,new T.PointsMaterial({size:.16,vertexColors:true,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));
  pts.frustumCulled=false;galaxy.add(pts);
  const core=glowSprite('#ffe8b0',4.5,.95);galaxy.add(core);
  const core2=glowSprite('#ffb35a',9,.35);galaxy.add(core2);
  galaxy.rotation.x=.5;
  return{g,galaxy,pts,core,core2,size:8,kind:'galaxy',
    idle(t,S){galaxy.rotation.y=t*.12},
    act(name,k,S){
      if(name==='hurt'){const w=Math.sin(Math.PI*clamp(k*1.2));galaxy.scale.setScalar(1+.1*w);galaxy.rotation.z=.3*w}
      else if(name==='shatter'){const w=easeIn(seg(k,.15,.9));
        this.pts.material.size=.16+w*.5;this.pts.material.opacity=.95*(1-w*.85);
        core.material.opacity=.95*(1-w);core2.material.opacity=.35*(1-w);
        galaxy.scale.setScalar(1+w*.8);galaxy.rotation.y+=w*2}}}};
})();
