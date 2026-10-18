// misha-worlds.js — декорации для «МИША ПРОТИВ ВСЕГО»: кухня, микромир, двор, парк,
// лес, стадион с трибунами, дача, космос, финальная сцена. Всё детерминировано от t.
(function(){
const M3=window.M3,T=window.THREE,U=M3.utils;
const {box,sph,cyl,cone}=M3.prims;const {mat,glowSprite}=M3;
const {clamp,lerp,seg,easeOut,rng,TAU}=U;
const C=h=>new T.Color(h);
const W={};M3.worldBuilders=W;

function addWorld(name,builder){W[name]=builder}
function ground(w,d,color,o){const m=new T.Mesh(new T.PlaneGeometry(w,d),mat(color,Object.assign({trans:false},o)));
  m.rotation.x=-Math.PI/2;return m}
function groundTex(w,d,draw,o){const c=document.createElement('canvas');c.width=512;c.height=512;draw(c.getContext('2d'));
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(o&&o.rx||8,o&&o.ry||8);
  const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshLambertMaterial({map:t}));
  m.rotation.x=-Math.PI/2;return m}
function tree(g,x,z,s,seed){const r=rng(seed);const h=(2.2+r()*1.4)*(s||1);
  const tr=cyl(.09*s||.09,.14*s||.14,h,'#5a4632');tr.position.set(x,h/2,z);g.add(tr);
  const c1=cone(1.1*s,h*.9,'#2e5b2e',null,8);c1.position.set(x,h*.9,z);g.add(c1);
  const c2=cone(.85*s,h*.7,'#386b38',null,8);c2.position.set(x,h*1.25,z);g.add(c2)}
function lights(g,o){const hemi=new T.HemisphereLight(o.sky,o.gnd,o.hemi===undefined?.9:o.hemi);hemi.position.y=20;g.add(hemi);
  const dir=new T.DirectionalLight(o.sun||'#fff',o.dir===undefined?.8:o.dir);dir.position.set(o.dx||6,o.dy||12,o.dz||8);g.add(dir);
  return{hemi,dir}}
function starsLayer(g,n,rad,size){const r=rng(77);const pts=M3.makePoints(n,()=>{const a=r()*TAU,b=Math.acos(r()*2-1);
  return[rad*Math.sin(b)*Math.cos(a),rad*Math.cos(b),rad*Math.sin(b)*Math.sin(a),[.6+r()*.4,.7+r()*.3,1]]},size,.9);g.add(pts);return pts}

// ---------- КУХНЯ ----------
addWorld('kitchen',function(){
  const g=new T.Group();
  const fl=groundTex(30,30,x=>{x.fillStyle='#2b2620';x.fillRect(0,0,512,512);x.fillStyle='#332d25';
    for(let i=0;i<8;i++)for(let j=0;j<8;j++)if((i+j)%2)x.fillRect(i*64,j*64,64,64);
    x.strokeStyle='#1d1915';x.lineWidth=3;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,512);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(512,i*64);x.stroke()}},{rx:10,ry:10});
  g.add(fl);
  // стена с окном
  const wall=new T.Mesh(new T.PlaneGeometry(30,10),mat('#3a342c'));wall.position.set(0,5,-7);g.add(wall);
  const win=new T.Mesh(new T.PlaneGeometry(5,3),mat('#0e1626'));win.position.set(-6,4.4,-6.98);g.add(win);
  const moonG=glowSprite('#cfe4ff',3,.8);moonG.position.set(-6,4.4,-6.9);g.add(moonG);
  // плита + кастрюля СУПА
  const stove=box(3.4,1.0,2.2,'#26262c');stove.position.set(0,.5,-3.2);g.add(stove);
  const pot=new T.Group();pot.position.set(0,1.0,-3.2);g.add(pot);
  const potB=cyl(1.25,1.1,1.5,'#8a8f99');potB.position.y=.75;pot.add(potB);
  const soup=new T.Mesh(new T.CircleGeometry(1.12,24),mat('#e8963c',{emissive:.35}));soup.rotation.x=-Math.PI/2;soup.position.y=1.52;pot.add(soup);
  for(let i=0;i<7;i++){const bub=sph(.09,'#f2b45a',{emissive:.5},8);bub.position.set(Math.cos(i)*0.5,1.53,Math.sin(i*1.7)*0.5);pot.add(bub);bub.userData.i=i;pot['bub'+i]=bub}
  // пар
  const steam=M3.makePoints(60,i=>{const r=rng(i*13+5);return[r()*1.6-0+0,0,r()*1.6,[1,1,1]]},.22,.16);
  pot.add(steam);pot.userData.steam=steam;
  const handle1=box(.3,.08,.08,'#5a5f68');handle1.position.set(-1.35,1.45,0);pot.add(handle1);
  const handle2=handle1.clone();handle2.position.x=1.35;pot.add(handle2);
  // стол, холодильник, шкафы
  const table=new T.Group();table.position.set(-4.5,0,1.5);g.add(table);
  const top=box(3,.14,1.6,'#6b5136');top.position.y=1.0;table.add(top);
  for(const sx of[-1.3,1.3])for(const sz of[-.6,.6]){const lg=cyl(.06,.06,1,'#4a3826',null,8);lg.position.set(sx,.5,sz);table.add(lg)}
  const fridge=box(1.4,3.4,1.2,'#c9ced8');fridge.position.set(5.5,1.7,-2);g.add(fridge);
  const fhand=box(.08,.5,.08,'#8a8f99');fhand.position.set(5,1.8,-1.38);g.add(fhand);
  const counter=box(4.5,1.2,1.2,'#5a4632');counter.position.set(4.2,.6,-6.2);g.add(counter);
  const cab=box(4.5,1.0,1.0,'#6b5136');cab.position.set(4.2,3.4,-6.4);g.add(cab);
  // крошки-валуны (для боя с тараканом)
  const r=rng(31);
  for(let i=0;i<9;i++){const cr=sph(.12+r()*.2,'#c9a06a',null,7);cr.position.set((r()-.5)*10,.1,(r()-.5)*6+2);cr.scale.y=.6;g.add(cr)}
  lights(g,{sky:'#ffe8c4',gnd:'#3a3025',sun:'#ffcf90',dir:.75,dy:10});
  const lamp=glowSprite('#ffcf90',4,.35);lamp.position.set(0,6,-1);g.add(lamp);
  return{g,bg:'#241f19',fogNear:12,fogFar:42,update(t){
    const st=pot.userData.steam;const arr=st.geometry.attributes.position.array;
    for(let i=0;i<60;i++){const ph=(t*.24+i*.618)%1;arr[i*3]=Math.sin(t*1.2+i)*.5*(ph+.2);arr[i*3+1]=1.55+ph*3.2;arr[i*3+2]=Math.cos(t+i*2.1)*.4*(ph+.2)}
    st.geometry.attributes.position.needsUpdate=true;
    for(let i=0;i<7;i++){const b=pot['bub'+i];const s=Math.max(0,Math.sin(t*3+i*2.2));b.scale.setScalar(.4+s*1.1)}
    soup.position.y=1.52+.015*Math.sin(t*9)}}
});

// ---------- МИКРОМИР (внутри супа) ----------
addWorld('micro',function(){
  const g=new T.Group();
  const fl=new T.Mesh(new T.CircleGeometry(40,40),mat('#0d2b26',{emissive:.12}));fl.rotation.x=-Math.PI/2;g.add(fl);
  // ломтики моркови — платформы
  const r=rng(5);
  for(let i=0;i<8;i++){const cr=cyl(1.6+r()*1.4,1.7+r()*1.4,.5,'#e07830',null,12);cr.position.set((r()-.5)*26,.22,(r()-.5)*18-4);g.add(cr)}
  // клетки-шары плавают
  const cells=[];
  for(let i=0;i<14;i++){const c=sph(.8+r()*2.4,'#1f5f57',{trans:true,opacity:.16},12);
    c.position.set((r()-.5)*30,3+r()*7,(r()-.5)*22-6);g.add(c);cells.push(c)}
  // световые столбы
  for(let i=0;i<5;i++){const beam=cyl(2.5,4,26,'#7fe0c4',{trans:true,opacity:.05},8);beam.position.set(-12+i*6,10,-10);g.add(beam)}
  const dust=M3.makePoints(500,i=>{const rr=rng(i*7+3);return[(rr()-.5)*36,rr()*12,(rng(i*3)()-.5)*26,[.35,.9,.8]]},.09,.5);g.add(dust);
  lights(g,{sky:'#bfffe8',gnd:'#06231e',sun:'#7fe0c4',dir:.7});
  return{g,bg:'#06231e',fogNear:8,fogFar:46,update(t){
    for(let i=0;i<cells.length;i++){const c=cells[i];c.position.y+= .25*Math.sin(t*.7+i*2);c.scale.setScalar(1+.06*Math.sin(t+i))}}}
});

// ---------- ДВОР (панельки) ----------
function houseTex(){
  const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');
  x.fillStyle='#9a8f7a';x.fillRect(0,0,256,512);x.fillStyle='#8a8069';
  for(let i=0;i<64;i++)x.fillRect((i%8)*32,(i>>3)*64,32,2);
  const r=rng(12);
  for(let fy=0;fy<14;fy++)for(let fx=0;fx<6;fx++){x.fillStyle=r()<.75?'#243447':'#ffd98a';
    x.fillRect(16+fx*38,20+fy*34,24,20)}
  return new T.CanvasTexture(c)}
addWorld('yard',function(){
  const g=new T.Group();
  const asph=groundTex(60,60,x=>{x.fillStyle='#3c3c42';x.fillRect(0,0,512,512);x.fillStyle='#46464d';
    for(let i=0;i<40;i++){x.fillRect(x0(i)*512,y0(i)*512,40,40)}function x0(i){return rng(i*3)()}function y0(i){return rng(i*7)()}
    x.strokeStyle='#54545c';x.lineWidth=4;x.beginPath();x.moveTo(256,0);x.lineTo(256,512);x.stroke()},{rx:14,ry:14});
  g.add(asph);
  const ht=houseTex();
  for(let i=0;i<5;i++){const h=new T.Mesh(new T.BoxGeometry(8,16+i%3*3,6),new T.MeshLambertMaterial({map:ht}));
    const a=i/5*TAU;h.position.set(Math.cos(a)*30,8+(i%3)*1.5,Math.sin(a)*30-6);h.lookAt(0,8,-6);g.add(h)}
  // гаражи
  const r=rng(8);const garCols=['#7a4a3a','#4a5a7a','#5a7a4a','#6a6a7a'];
  for(let i=0;i<6;i++){const gr=box(2.6,1.8,2.4,garCols[i%4]);gr.position.set(-10+i*4,0.9,-14);g.add(gr);
    const roof=box(2.7,.2,2.5,'#3a3a40');roof.position.set(-10+i*4,1.9,-14);g.add(roof)}
  // мусорка
  const trash=new T.Group();trash.position.set(-7,0,6);g.add(trash);
  for(let i=0;i<3;i++){const b=cyl(.5,.4,1.1,'#3d6b8a',null,10);b.position.set(i*.9-.9,.55,Math.sin(i)*0.3);trash.add(b)}
  // лавочка и фонарь
  const bench=new T.Group();bench.position.set(6.5,0,5);g.add(bench);
  const bs=box(2.2,.1,.6,'#6b5136');bs.position.y=.55;bench.add(bs);
  const bb=box(2.2,.5,.1,'#6b5136');bb.position.set(0,.9,-.25);bench.add(bb);
  for(const sx of[-.9,.9]){const lg=box(.12,.55,.5,'#3a3a40');lg.position.set(sx,.27,0);bench.add(lg)}
  const lampP=cyl(.08,.1,4.5,'#3a3a40',null,8);lampP.position.set(9,2.25,3);g.add(lampP);
  const lampH=glowSprite('#ffd9a0',3.2,.75);lampH.position.set(9,4.6,3);g.add(lampH);
  // лужа
  const pud=new T.Mesh(new T.CircleGeometry(2.2,20),mat('#4a6b8a',{trans:true,opacity:.5}));pud.rotation.x=-Math.PI/2;pud.position.set(-4,.02,3);g.add(pud);
  lights(g,{sky:'#c4c8d8',gnd:'#2e2e34',sun:'#dfe6ff',dir:.6,dy:14});
  return{g,bg:'#4a4f63',fogNear:18,fogFar:80}
});

// ---------- ПАРК (пруд, гуси) ----------
addWorld('park',function(){
  const g=new T.Group();
  g.add(ground(70,70,'#3e6b34'));
  const pond=new T.Mesh(new T.CircleGeometry(9,36),mat('#3a7a9a',{trans:true,opacity:.85}));
  pond.rotation.x=-Math.PI/2;pond.position.set(2,.03,4);g.add(pond);
  const ripples=[];
  for(let i=0;i<3;i++){const rp=new T.Mesh(new T.RingGeometry(.8,.92,32),mat('#bfe4f2',{trans:true,opacity:.4}));
    rp.rotation.x=-Math.PI/2;rp.position.set(2,.05,4);g.add(rp);ripples.push(rp)}
  const r=rng(3);
  for(let i=0;i<14;i++)tree(g,(r()-.5)*50,8+r()*20,1+r()*.6,i*7);
  // камыши
  for(let i=0;i<18;i++){const re=cyl(.03,.03,1.6+r(),'#5a7a3a',null,5);re.position.set(8+Math.cos(i)*4,0.8,-1+Math.sin(i*2)*3);g.add(re)}
  // утки-декорации
  for(let i=0;i<3;i++){const dk=new T.Group();dk.position.set(4+i*1.6,.12,6+i);g.add(dk);
    const b=sph(.22,'#8a7a5a',null,10);b.scale.set(1,.8,1.3);b.position.y=.1;dk.add(b);
    const h=sph(.09,'#3a5a2a',null,8);h.position.set(0,.22,.3);dk.add(h)}
  lights(g,{sky:'#cfe8ff',gnd:'#2e4a28',sun:'#fff2d0',dir:.85,dy:16});
  return{g,bg:'#7ab0d8',fogNear:25,fogFar:90,update(t){
    for(let i=0;i<ripples.length;i++){const ph=(t*.5+i/3)%1;ripples[i].scale.setScalar(.3+ph*6);
      ripples[i].material.opacity=.45*(1-ph)}
    pond.position.y=.03+.005*Math.sin(t*2)}}
});

// ---------- ЛЕС ----------
addWorld('forest',function(){
  const g=new T.Group();
  g.add(ground(80,80,'#2b4a26'));
  const r=rng(22);
  for(let i=0;i<34;i++){const a=r()*TAU,d=7+r()*26;tree(g,Math.cos(a)*d,Math.sin(a)*d-4,1.2+r()*1.2,i*3+1)}
  // пни
  for(let i=0;i<5;i++){const st=cyl(.5,.6,.5,'#6b5136',null,10);st.position.set((r()-.5)*16,.25,(r()-.5)*10+2);g.add(st)}
  // лучи
  for(let i=0;i<4;i++){const beam=cyl(1.2,2.4,30,'#ffe8b0',{trans:true,opacity:.06},8);beam.position.set(-9+i*6,12,-8);beam.rotation.z=.25;g.add(beam)}
  lights(g,{sky:'#d8ffcf',gnd:'#1a3018',sun:'#fff0c0',dir:.7,dy:18});
  return{g,bg:'#2b4a26',fogNear:6,fogFar:40}
});

// ---------- СТАДИОН (трибуны!) ----------
addWorld('stadium',function(){
  const g=new T.Group();
  // поле
  const pitch=groundTex(46,60,x=>{x.fillStyle='#2e7a35';x.fillRect(0,0,512,512);x.fillStyle='#2a7030';
    for(let i=0;i<10;i++)if(i%2)x.fillRect(0,i*51.2,512,51.2);
    x.strokeStyle='#e8f0e8';x.lineWidth=6;x.strokeRect(40,40,432,432);x.beginPath();x.moveTo(256,40);x.lineTo(256,472);x.stroke();
    x.beginPath();x.arc(256,256,60,0,7);x.stroke()},{rx:1,ry:1});
  pitch.position.z=-4;g.add(pitch);
  // трибуны: 4 стороны, ступени
  const crowd=[];const r=rng(64);
  function stand(px,pz,rotY,len){
    const st=new T.Group();st.position.set(px,0,pz);st.rotation.y=rotY;g.add(st);
    for(let s=0;s<7;s++){const step=box(len,1.1,2.2,'#5a5f6a');step.position.set(0,.55+s*1.05,s*2.2);st.add(step)}
    const wall=box(len,1.0,.4,'#c9ced8');wall.position.set(0,.5,-.8);st.add(wall);
    const seats=(len*6)|0;
    const im=new T.InstancedMesh(new T.BoxGeometry(.42,.62,.42),new T.MeshLambertMaterial({color:0xffffff}),seats);
    im.instanceMatrix.setUsage(T.DynamicDrawUsage);
    const dummy=new T.Object3D();const col=new T.Color();
    for(let i=0;i<seats;i++){const row=(i/(len/7))|0,ix=i%(len/7|0);
      dummy.position.set(-len/2+.5+ix*(len/(len/7|0))+((r()-.5)*.2),1.2+row*1.05,row*2.2+.2);
      dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);
      col.setHSL(r(),.65,.55);im.setColorAt(i,col)}
    im.instanceMatrix.needsUpdate=true;st.add(im);crowd.push({im,seats,dummy})}
  stand(0,14,Math.PI,40);   // ближняя (за спиной)
  stand(0,-30,0,40);        // дальняя
  stand(-19,-8,Math.PI/2,30);
  stand(19,-8,-Math.PI/2,30);
  // прожекторы
  for(const [lx,lz] of[[-16,8],[16,8],[-16,-24],[16,-24]]){
    const tw=cyl(.25,.35,16,'#8a8f99',null,8);tw.position.set(lx,8,lz);g.add(tw);
    const head=box(2.4,1.4,.5,'#d8dde6');head.position.set(lx,16.5,lz);head.lookAt(0,0,-8);g.add(head);
    const gl=glowSprite('#ffffff',7,.9);gl.position.set(lx*.96,16.2,lz*.96);g.add(gl)}
  // экран
  const scrC=document.createElement('canvas');scrC.width=512;scrC.height=256;
  const scrX=scrC.getContext('2d');const scrT=new T.CanvasTexture(scrC);
  const scr=new T.Mesh(new T.PlaneGeometry(10,5),new T.MeshBasicMaterial({map:scrT}));
  scr.position.set(0,9,-36);g.add(scr);
  M3.stadiumScreen={set(a,b){scrX.fillStyle='#10131f';scrX.fillRect(0,0,512,256);
    scrX.strokeStyle='#ffd24a';scrX.lineWidth=8;scrX.strokeRect(6,6,500,244);
    scrX.textAlign='center';scrX.fillStyle='#ffd24a';scrX.font="900 88px Impact,'Arial Black',sans-serif";scrX.fillText(a,256,110);
    scrX.fillStyle='#fff';scrX.font="900 64px Impact,'Arial Black',sans-serif";scrX.fillText(b,256,196);scrT.needsUpdate=true}};
  lights(g,{sky:'#aebfd8',gnd:'#1e3a20',sun:'#fff6e0',dir:.85,dy:20});
  const fl=glowSprite('#fff2d0',30,.22);fl.position.set(0,14,-8);g.add(fl);
  return{g,bg:'#39404e',fogNear:40,fogFar:160,update(t,hype){
    const amp=(hype||1)*.3;
    for(const c of crowd){const {im}=c;
      im.position.y=amp*.4*Math.abs(Math.sin(t*6+im.id));
      im.rotation.x=.03*Math.sin(t*6+im.id)}
    scr.position.y=9+.1*Math.sin(t*2)}}
});

// ---------- ДАЧА ----------
addWorld('dacha',function(){
  const g=new T.Group();
  g.add(ground(70,70,'#4a7a3a'));
  const r=rng(17);
  // дом
  const house=new T.Group();house.position.set(0,0,-8);g.add(house);
  const walls=box(7,3,5,'#8a6b3f');walls.position.y=1.5;house.add(walls);
  const roof=new T.Mesh(new T.ConeGeometry(5.6,2.4,4),mat('#7a3b2a'));roof.position.y=4.2;roof.rotation.y=Math.PI/4;house.add(roof);
  const win=new T.Mesh(new T.PlaneGeometry(1.2,1.2),mat('#ffd98a',{emissive:.6}));win.position.set(-1.8,1.7,2.52);house.add(win);
  const door=box(1.1,2,.15,'#5a3f24');door.position.set(1.4,1,2.55);house.add(door);
  const chimney=box(.7,1.4,.7,'#6a6058');chimney.position.set(2,4.6,0);house.add(chimney);
  // забор
  for(let i=0;i<24;i++){const pl=box(.35,1.3,.08,'#b8a67a');pl.position.set(-11.5+i*1,0.65,7.5);g.add(pl)}
  const rail=box(24,.12,.1,'#a89468');rail.position.set(0,1.15,7.5);g.add(rail);
  // подсолнухи
  const suns=[];
  for(let i=0;i<16;i++){const sf=new T.Group();sf.position.set((r()-.5)*24,0,(r()-.5)*14+4);
    if(sf.position.z>7)sf.position.z-=6;g.add(sf);
    const st=cyl(.05,.07,1.6+r(),'#3e7a30',null,6);st.position.y=.85;sf.add(st);
    const hd=new T.Group();hd.position.y=1.7+r()*.3;sf.add(hd);
    const faceD=new T.Mesh(new T.CircleGeometry(.42,14),mat('#c9a03c'));hd.add(faceD);
    for(let p=0;p<10;p++){const pet=new T.Mesh(new T.CircleGeometry(.16,6),mat('#ffd23c'));
      const a=p/10*TAU;pet.position.set(Math.cos(a)*.4,Math.sin(a)*.4,.01);hd.add(pet)}
    suns.push(hd)}
  // банька
  const bath=box(3,2,2.4,'#7a5f3a');bath.position.set(-8,1,-2);g.add(bath);
  // куры
  const chickens=[];
  for(let i=0;i<3;i++){const ch=new T.Group();ch.position.set(4+i*1.5,0,4+i);g.add(ch);
    const b=sph(.28,'#e8e8e0',null,10);b.scale.set(1,.9,1.2);b.position.y=.3;ch.add(b);
    const h=sph(.14,'#e8e8e0',null,8);h.position.set(0,.5,.3);ch.add(h);
    const bk=cone(.05,.14,'#ff9f1c',null,5);bk.rotation.x=Math.PI/2;bk.position.set(0,.48,.44);ch.add(bk);
    chickens.push(ch)}
  lights(g,{sky:'#fff0c8',gnd:'#2e4a24',sun:'#ffe8b0',dir:.9,dy:16});
  return{g,bg:'#8fd8ff',fogNear:30,fogFar:120,update(t){
    for(let i=0;i<suns.length;i++)suns[i].rotation.z=.12*Math.sin(t*1.2+i);
    for(let i=0;i<chickens.length;i++){const ch=chickens[i];ch.position.x=4+i*1.5+.5*Math.sin(t*.6+i*2);
      ch.rotation.y=Math.sin(t*.3+i)}}}
});

// ---------- КОСМОС (Земля) ----------
addWorld('space',function(){
  const g=new T.Group();
  starsLayer(g,2200,300,.9);
  const sun=glowSprite('#ffe8b0',26,.95);sun.position.set(-60,30,-80);g.add(sun);
  lights(g,{sky:'#cfe0ff',gnd:'#101828',sun:'#fff',dir:1,dy:0});
  return{g,bg:'#04060f',fogNear:200,fogFar:900}
});

// ---------- ГАЛАКТИКА (финал) ----------
addWorld('galaxyW',function(){
  const g=new T.Group();
  starsLayer(g,3200,500,1.1);
  const r=rng(9);
  for(let i=0;i<8;i++){const neb=glowSprite(['#5a3aff','#ff5a8a','#3affd8','#8a5aff'][i%4],30+r()*40,.13);
    neb.position.set((r()-.5)*300,(r()-.5)*120,(r()-.5)*300-60);g.add(neb)}
  lights(g,{sky:'#dfe8ff',gnd:'#0a0f1e',sun:'#fff',dir:.9,dy:0});
  return{g,bg:'#030510',fogNear:300,fogFar:1200}
});

// ---------- ФИНАЛ (сцена награждения) ----------
addWorld('finale',function(){
  const g=new T.Group();
  starsLayer(g,1500,260,1);
  // подиум
  const pod=cyl(6,7,1.2,'#1a1f33',null,36);pod.position.y=-.6;g.add(pod);
  const rim=new T.Mesh(new T.TorusGeometry(6,.12,8,48),mat('#ffd24a',{emissive:.8}));rim.rotation.x=Math.PI/2;rim.position.y=.02;g.add(rim);
  // прожекторные лучи
  for(let i=0;i<4;i++){const beam=cyl(.5,3.5,40,'#ffe8b0',{trans:true,opacity:.08},8);
    beam.position.set(Math.cos(i/4*TAU)*10,14,Math.sin(i/4*TAU)*10);beam.rotation.z=Math.cos(i/4*TAU)*.35;beam.rotation.x=-Math.sin(i/4*TAU)*.35;g.add(beam)}
  lights(g,{sky:'#ffe8c8',gnd:'#0a0e1c',sun:'#fff4e0',dir:1.1,dy:0});
  return{g,bg:'#05070f',fogNear:60,fogFar:400}
});

M3.buildAllWorlds=function(){for(const k in W)M3.worlds[k]=W[k]()};
})();
