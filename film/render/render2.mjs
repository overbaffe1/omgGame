// render2.mjs — офлайн-рендер «МИША ПРОТИВ ВСЕГО»: софтверный растеризатор three.js-сцены
// (текстуры, группы материалов, туман, прозрачность, аддитив), пост fx.js, HUD из misha-film.js.
// Режимы: node render2.mjs bench | node render2.mjs worker FIRST LAST OUT.mp4
import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const DIR='/home/user/omgGame/film/';
const ffmpegPath=require('@ffmpeg-installer/ffmpeg').path;

global.window=global;global.self=global;
const THREE=require(DIR+'vendor/three.min.js');
THREE.WebGLRenderer=class{constructor(){this.domElement=null}setSize(){}render(){}};
global.THREE=THREE;window.THREE=THREE;
const mainCanvas=createCanvas(1920,1080);
const created=[];
global.document={createElement:(t)=>{if(t==='canvas'){const c=createCanvas(300,300);created.push(c);return c}throw new Error('createElement:'+t)},
  getElementById:(id)=>{if(id==='c')return mainCanvas;return null},fonts:{add(){}},head:{appendChild(){}},body:{appendChild(){}}};
global.requestAnimationFrame=(fn)=>setTimeout(fn,16);
try{GlobalFonts.registerFromPath(DIR+'body51-day/fonts/Manrope-800.ttf','Manrope')}catch(e){console.error('font:',e.message)}
const load=(f)=>{eval(fs.readFileSync(DIR+f,'utf8'))};
load('fx.js'); // пост-обработка (bloom/grain/vignette) — если ctx.filter поддерживается
// Быстрая замена FX.post для офлайн-рендера: bloom на маленьком канвасе (визуально то же, в разы дешевле)
(function(){
  const small=createCanvas(480,270),sg=small.getContext('2d');
  const small2=createCanvas(480,270),sg2=small2.getContext('2d');
  const q=createCanvas(480,270),qg=q.getContext('2d');
  const grains=[];for(let k=0;k<4;k++){const c=createCanvas(256,256),x=c.getContext('2d'),d=x.createImageData(256,256);
    for(let i=0;i<d.data.length;i+=4){const v=128+(Math.random()+Math.random()+Math.random()-1.5)*110;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
    x.putImageData(d,0,0);grains.push(c)}
  window.FX.post=function(g,t,O){
    O=Object.assign({bloom:.55,grain:.065,vignette:.5,leak:.1,ca:.9,warm:0},O||{});
    const cv=g.canvas,W=cv.width,H=cv.height;
    g.save();g.setTransform(1,0,0,1,0,0);
    if(O.bloom>0){
      sg.globalCompositeOperation='copy';sg.filter='contrast(1.9) brightness(.85) saturate(1.3) blur(5px)';sg.drawImage(cv,0,0,480,270);sg.filter='none';
      g.globalCompositeOperation='screen';g.globalAlpha=O.bloom;g.drawImage(small,0,0,W,H);
      sg2.globalCompositeOperation='copy';sg2.filter='blur(14px)';sg2.drawImage(small,0,0);sg2.filter='none';
      g.globalAlpha=O.bloom*.5;g.drawImage(small2,0,0,W,H)}
    if(O.ca>0){qg.globalCompositeOperation='copy';qg.drawImage(cv,0,0,480,270);
      qg.globalCompositeOperation='multiply';qg.fillStyle='#f00';qg.fillRect(0,0,480,270);
      g.globalCompositeOperation='lighter';g.globalAlpha=.12*O.ca;const s2=3*O.ca;g.drawImage(q,-s2,-s2*.6,W+s2*2,H+s2*1.2);
      qg.globalCompositeOperation='copy';qg.drawImage(cv,0,0,480,270);qg.globalCompositeOperation='multiply';qg.fillStyle='#00f';qg.fillRect(0,0,480,270);
      g.globalCompositeOperation='screen';g.globalAlpha=.08*O.ca;g.drawImage(q,s2,s2*.6,W-s2*2,H-s2*1.2)}
    if(O.leak>0){g.globalCompositeOperation='screen';g.globalAlpha=1;
      const lx=W*(.5+.6*Math.sin(t*.13)),ly=H*(.3+.4*Math.sin(t*.09+1));
      const gr=g.createRadialGradient(lx,ly,0,lx,ly,W*.9);
      gr.addColorStop(0,`rgba(255,${150+60*Math.sin(t*.2)|0},90,${O.leak})`);gr.addColorStop(1,'rgba(255,120,60,0)');
      g.fillStyle=gr;g.fillRect(0,0,W,H)}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;
    const v=g.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,H*.78);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${O.vignette})`);g.fillStyle=v;g.fillRect(0,0,W,H);
    if(O.grain>0){g.globalCompositeOperation='overlay';g.globalAlpha=O.grain*1.1;
      const p=g.createPattern(grains[0],'repeat');
      const dx=(t*61)%256,dy=(t*38)%256;g.translate(dx,dy);g.fillStyle=p;g.fillRect(-256,-256,W+512,H+512)}
    g.restore();g.globalCompositeOperation='source-over';g.globalAlpha=1}
})();
load('misha3d.js');load('misha-things.js');load('misha-worlds.js');load('misha-rounds.js');load('misha-film.js');
const M3=window.M3,F=window.MFILM,frame=window.__MISHA_FRAME;
const glc=created.find(c=>c.width===1920&&c.height===1080)||mainCanvas;
const gx=glc.getContext('2d');

// ---------- растеризатор v2 ----------
const _v=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();
const _m=new THREE.Matrix4(),_m2=new THREE.Matrix4();
function srgb(c,br,em){const col=c.clone();if(col.convertLinearToSRGB)col.convertLinearToSRGB();
  const r=Math.min(255,Math.round((col.r*br+em)*255)),g2=Math.min(255,Math.round((col.g*br+em)*255)),b=Math.min(255,Math.round((col.b*br+em)*255));
  return[r,g2,b]}
const _ca=new THREE.Vector3(),_cb=new THREE.Vector3(),_cc=new THREE.Vector3(),_sa=new THREE.Vector3(),_sb=new THREE.Vector3(),_sc=new THREE.Vector3();
const _e1=new THREE.Vector3(),_e2=new THREE.Vector3(),_nn=new THREE.Vector3();
function texTri(ctx,img,ax,ay,bx,by,cx2,cy,u0,v0,u1,v1,u2,v2){
  const det=u0*(v1-v2)-u1*(v0-v2)+u2*(v0-v1);if(!det)return;
  const a=(ax*(v1-v2)+bx*(v2-v0)+cx2*(v0-v1))/det;
  const b=(ay*(v1-v2)+by*(v2-v0)+cy*(v0-v1))/det;
  const c=(ax*(u2-u1)+bx*(u0-u2)+cx2*(u1-u0))/det;
  const d=(ay*(u2-u1)+by*(u0-u2)+cy*(u1-u0))/det;
  if(!isFinite(a)||!isFinite(b)||!isFinite(c)||!isFinite(d))return;
  const e=ax-a*u0-c*v0,f=ay-b*u0-d*v0;
  ctx.save();ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx2,cy);ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,d,e,f);ctx.drawImage(img,0,0,1,1);ctx.restore()}
function raster(scene,camera){
  const W=glc.width,H=glc.height;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const view=_m.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
  const fovScale=H/(2*Math.tan(camera.fov*Math.PI/360));
  const lights=[];let hemi=null;
  scene.traverse(o=>{if(!o.visible)return;
    if(o.isDirectionalLight){_v.setFromMatrixPosition(o.matrixWorld).normalize();lights.push({dir:_v.clone(),i:o.intensity})}
    if(o.isHemisphereLight)hemi=o});
  const ambient=hemi?hemi.intensity*.8:.55;
  const fog=scene.fog;const fogC=fog?srgb(fog.color,1,0):null;
  const fogF=(z)=>{if(!fog)return 0;const k=Math.max(0,(z-fog.near)/(fog.far-fog.near));return Math.min(.85,k*k)};
  gx.fillStyle='#000';gx.fillRect(0,0,W,H);
  gx.globalCompositeOperation='source-over';gx.globalAlpha=1;
  const opaque=[],alpha=[],add=[];
  const pushTri=(ax,ay,bx,by,cx2,cy,fill,z,mode)=>{
    opaque_alpha: {
      if(mode===0)opaque.push({z,draw:()=>{gx.fillStyle=fill;gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();gx.fill()}});
      else alpha.push({z,draw:()=>{gx.fillStyle=fill;gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();gx.fill()}})}}
  function meshTris(o,mw,baseCol,map,opacity,em){
    const geo=o.geometry;if(!geo||!geo.attributes||!geo.attributes.position)return;
    const posA=geo.attributes.position,uvA=geo.attributes.uv,idx=geo.index;
    const br0=ambient;let br=br0;
    // группы материалов (для граней-боксов)
    const groups=geo.groups&&geo.groups.length?geo.groups:[{start:0,count:idx?idx.count:posA.count,materialIndex:0}];
    for(const gr of groups){
      for(let f=gr.start;f<gr.start+gr.count;f+=3){
        const ia=idx?idx.getX(f):f,ib=idx?idx.getX(f+1):f+1,ic=idx?idx.getX(f+2):f+2;
        _ca.fromBufferAttribute(posA,ia).applyMatrix4(mw);
        _cb.fromBufferAttribute(posA,ib).applyMatrix4(mw);
        _cc.fromBufferAttribute(posA,ic).applyMatrix4(mw);
        const za=-_v.copy(_ca).applyMatrix4(camera.matrixWorldInverse).z;
        const zb=-_v.copy(_cb).applyMatrix4(camera.matrixWorldInverse).z;
        const zc=-_v.copy(_cc).applyMatrix4(camera.matrixWorldInverse).z;
        if(za<.04||zb<.04||zc<.04)continue;
        _sa.copy(_ca).applyMatrix4(view);_sb.copy(_cb).applyMatrix4(view);_sc.copy(_cc).applyMatrix4(view);
        const ax=(_sa.x*.5+.5)*W,ay=(1-(_sa.y*.5+.5))*H;
        const bx=(_sb.x*.5+.5)*W,by=(1-(_sb.y*.5+.5))*H;
        const cx2=(_sc.x*.5+.5)*W,cy=(1-(_sc.y*.5+.5))*H;
        if((ax<-80&&bx<-80&&cx2<-80)||(ax>W+80&&bx>W+80&&cx2>W+80)||(ay<-80&&by<-80&&cy<-80)||(ay>H+80&&by>H+80&&cy>H+80))continue;
        if((bx-ax)*(cy-ay)-(by-ay)*(cx2-ax)>=0)continue; // backface
        _e1.subVectors(_cb,_ca);_e2.subVectors(_cc,_ca);_nn.crossVectors(_e1,_e2).normalize();
        br=br0;for(const L of lights)br+=L.i*.8*Math.max(0,_nn.dot(L.dir.clone().negate()));
        br=Math.min(1.3,br);
        const z=(za+zb+zc)/3;
        const fogK=fogF(z);
        const uva=uvA?[[uvA.getX(ia),uvA.getY(ia)],[uvA.getX(ib),uvA.getY(ib)],[uvA.getX(ic),uvA.getY(ic)]]:null;
        const path=()=>{gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);closeFill(path,z,fogK)};
        function closeFill(p,z,fogK){}
        if(map&&uva&&map.image){
          const mode=opacity<1?1:0;
          const item={z,draw:()=>{
            texTri(gx,map.image,ax,ay,bx,by,cx2,cy,uva[0][0],uva[0][1],uva[1][0],uva[1][1],uva[2][0],uva[2][1]);
            gx.save();gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();
            if(br<.96){gx.globalCompositeOperation='multiply';gx.fillStyle=`rgb(${Math.round(br*255)},${Math.round(br*255)},${Math.round(br*255)})`;gx.fill();gx.globalCompositeOperation='source-over'}
            if(fogK>0.01){gx.globalAlpha=fogK;gx.fillStyle=`rgb(${fogC[0]},${fogC[1]},${fogC[2]})`;gx.fill();gx.globalAlpha=opacity}
            gx.restore()}};
          (mode===1?alpha:opaque).push(item);
        }else{
          const rgb=srgb(baseCol,br,em);
          if(fogK>0.01){rgb[0]=Math.round(rgb[0]+(fogC[0]-rgb[0])*fogK);rgb[1]=Math.round(rgb[1]+(fogC[1]-rgb[1])*fogK);rgb[2]=Math.round(rgb[2]+(fogC[2]-rgb[2])*fogK)}
          const fill=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
          const item={z,draw:()=>{gx.fillStyle=fill;gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();
            if(opacity<1)gx.globalAlpha=opacity;gx.fill();gx.globalAlpha=1}};
          (opacity<1?alpha:opaque).push(item)}}}}
  scene.traverse(o=>{
    if(!o.visible)return;
    if(o.isPoints){
      const posA=o.geometry.attributes.position,colA=o.geometry.attributes.color;
      const mm=o.matrixWorld;const mcol=o.material.color||new THREE.Color(1,1,1);
      const size=o.material.size||.1;const op=o.material.opacity===undefined?1:o.material.opacity;
      for(let i=0;i<posA.count;i++){
        _v.fromBufferAttribute(posA,i).applyMatrix4(mm);
        _v2.copy(_v).applyMatrix4(camera.matrixWorldInverse);
        if(_v2.z>-.1)continue;
        const d=-_v2.z;
        _v3.copy(_v).applyMatrix4(view);
        const sx=(_v3.x*.5+.5)*W,sy=(1-(_v3.y*.5+.5))*H;
        if(sx<-20||sx>W+20||sy<-20||sy>H+20)continue;
        let cc=mcol;
        if(colA){cc=new THREE.Color(colA.getX(i)*mcol.r,colA.getY(i)*mcol.g,colA.getZ(i)*mcol.b)}
        const s=Math.max(1,size*fovScale/d);
        const rgb=srgb(cc,1.5,0);
        add.push({z:d,draw:()=>{gx.globalCompositeOperation='lighter';gx.globalAlpha=op*.9;
          gx.fillStyle=`rgb(${Math.min(255,rgb[0])},${Math.min(255,rgb[1])},${Math.min(255,rgb[2])})`;
          gx.beginPath();gx.arc(sx,sy,s*.5,0,7);gx.fill();
          gx.globalCompositeOperation='source-over';gx.globalAlpha=1}})}
      return}
    if(o.isSprite){
      _v.setFromMatrixPosition(o.matrixWorld);
      _v2.copy(_v).applyMatrix4(camera.matrixWorldInverse);if(_v2.z>-.1)return;
      const d=-_v2.z;_v3.copy(_v).applyMatrix4(view);
      const sx=(_v3.x*.5+.5)*W,sy=(1-(_v3.y*.5+.5))*H;
      const r=Math.max(2,o.scale.x*.5*fovScale/d);
      const c=o.material.color||new THREE.Color(1,1,1);const rgb=srgb(c,1,0);
      const op=o.material.opacity===undefined?1:o.material.opacity;
      add.push({z:d,draw:()=>{gx.globalCompositeOperation='lighter';
        const gr=gx.createRadialGradient(sx,sy,0,sx,sy,r);
        gr.addColorStop(0,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${op})`);gr.addColorStop(1,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
        gx.fillStyle=gr;gx.beginPath();gx.arc(sx,sy,r,0,7);gx.fill();gx.globalCompositeOperation='source-over'}});return}
    if(o.isInstancedMesh){
      const im=_m2;const cnt=o.count;
      const colArr=o.instanceColor?o.instanceColor.array:null;
      const mtl=Array.isArray(o.material)?o.material[0]:o.material;
      const baseCol=(mtl&&mtl.color)?mtl.color:new THREE.Color(.85,.85,.85);
      if(cnt>120){ // толпа: точки-прямоугольники по бакетам яркости
        const sz=.5*fovScale;
        for(let i=0;i<cnt;i++){o.getMatrixAt(i,im);
          _v.set(0,0,0).applyMatrix4(im).applyMatrix4(o.matrixWorld);
          _v2.copy(_v).applyMatrix4(camera.matrixWorldInverse);
          if(_v2.z>-.5)continue;const d=-_v2.z;
          _v3.copy(_v).applyMatrix4(view);
          const sx=(_v3.x*.5+.5)*W,sy=(1-(_v3.y*.5+.5))*H;
          if(sx<-10||sx>W+10||sy<-10||sy>H+10)continue;
          let cc=baseCol;
          if(colArr)cc=new THREE.Color(colArr[i*3],colArr[i*3+1],colArr[i*3+2]);
          const s=Math.max(1.5,sz/d);
          const rgb=srgb(cc,ambient+.5,0);
          opaque.push({z:d,draw:()=>{gx.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;gx.fillRect(sx-s/2,sy-s*.7,s,s*1.4)}})}
        return}
      for(let i=0;i<cnt;i++){o.getMatrixAt(i,im);
        const mw=new THREE.Matrix4().multiplyMatrices(o.matrixWorld,im);
        let cc=baseCol;
        if(colArr)cc=new THREE.Color(colArr[i*3],colArr[i*3+1],colArr[i*3+2]);
        meshTris(o,mw,cc,null,1,0)}
      return}
    if(o.isMesh){
      const mtl=o.material;if(!mtl)return;
      const geo=o.geometry;
      const groups=geo&&geo.groups&&geo.groups.length;
      if(Array.isArray(mtl)){
        // перегруппируем по материалам групп
        const posA=geo.attributes.position,uvA=geo.attributes.uv,idx=geo.index;
        const glist=geo.groups||[{start:0,count:(idx?idx.count:posA.count),materialIndex:0}];
        for(const gm of glist){
          const mm=mtl[gm.materialIndex]||mtl[0];if(!mm)continue;
          const sub={geometry:{attributes:{position:posA,uv:uvA},index:idx,groups:[{start:gm.start,count:gm.count,materialIndex:0}]}};
          meshTrisSub(sub,o.matrixWorld,mm)}}
      else meshTrisSub({geometry:geo},o.matrixWorld,mtl)}});
  function meshTrisSub(fake,mw,mm){
    const col=(mm&&mm.color)?mm.color:new THREE.Color(.85,.85,.85);
    const map=mm&&mm.map?mm.map:null;
    const op=(mm&&mm.transparent&&mm.opacity!==undefined)?mm.opacity:1;
    const em=(mm&&mm.emissive&&mm.emissiveIntensity)?mm.emissiveIntensity*.5:0;
    // светимся аддитивно, если эмиссив сильный
    meshTris(fake,mw,col,map,op,em)}
  function meshTris(fake,mw,col,map,op,em){
    meshTrisReal(fake.geometry,fake,mw,col,map,op,em)}
  function meshTrisReal(geo,owner,mw,col,map,op,em){
    const posA=geo.attributes.position,uvA=geo.attributes.uv,idx=geo.index;
    const glist=(geo.groups&&geo.groups.length)?geo.groups:[{start:0,count:idx?idx.count:posA.count}];
    for(const gr of glist){
      for(let f=gr.start;f<gr.start+gr.count;f+=3){
        const ia=idx?idx.getX(f):f,ib=idx?idx.getX(f+1):f+1,ic=idx?idx.getX(f+2):f+2;
        _ca.fromBufferAttribute(posA,ia).applyMatrix4(mw);
        _cb.fromBufferAttribute(posA,ib).applyMatrix4(mw);
        _cc.fromBufferAttribute(posA,ic).applyMatrix4(mw);
        const za=-_v.copy(_ca).applyMatrix4(camera.matrixWorldInverse).z;
        const zb=-_v.copy(_cb).applyMatrix4(camera.matrixWorldInverse).z;
        const zc=-_v.copy(_cc).applyMatrix4(camera.matrixWorldInverse).z;
        if(za<.04||zb<.04||zc<.04)continue;
        _sa.copy(_ca).applyMatrix4(view);_sb.copy(_cb).applyMatrix4(view);_sc.copy(_cc).applyMatrix4(view);
        const ax=(_sa.x*.5+.5)*W,ay=(1-(_sa.y*.5+.5))*H;
        const bx=(_sb.x*.5+.5)*W,by=(1-(_sb.y*.5+.5))*H;
        const cx2=(_sc.x*.5+.5)*W,cy=(1-(_sc.y*.5+.5))*H;
        if((ax<-80&&bx<-80&&cx2<-80)||(ax>W+80&&bx>W+80&&cx2>W+80)||(ay<-80&&by<-80&&cy<-80)||(ay>H+80&&by>H+80&&cy>H+80))continue;
        if((bx-ax)*(cy-ay)-(by-ay)*(cx2-ax)>=0)continue;
        _e1.subVectors(_cb,_ca);_e2.subVectors(_cc,_ca);_nn.crossVectors(_e1,_e2).normalize();
        let br=ambient;for(const L of lights)br+=L.i*.8*Math.max(0,_nn.dot(L.dir.clone().negate()));
        br=Math.min(1.3,br);
        const z=(za+zb+zc)/3,fogK=fogF(z);
        if(map&&uvA&&map.image){
          const u0=uvA.getX(ia),v0=uvA.getY(ia),u1=uvA.getX(ib),v1=uvA.getY(ib),u2=uvA.getX(ic),v2=uvA.getY(ic);
          const item={z,draw:()=>{gx.save();
            texTri(gx,map.image,ax,ay,bx,by,cx2,cy,u0,v0,u1,v1,u2,v2);
            gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();
            if(br<.96){gx.globalCompositeOperation='multiply';gx.fillStyle=`rgb(${Math.round(br*255)},${Math.round(br*255)},${Math.round(br*255)})`;gx.fill();gx.globalCompositeOperation='source-over'}
            if(fogK>.01){gx.globalAlpha=fogK*op;gx.fillStyle=`rgb(${fogC[0]},${fogC[1]},${fogC[2]})`;gx.fill()}
            gx.restore();gx.globalAlpha=1}};
          (op<1?alpha:opaque).push(item);
        }else{
          const rgb=srgb(col,br,em);
          if(fogK>.01){rgb[0]=Math.round(rgb[0]+(fogC[0]-rgb[0])*fogK);rgb[1]=Math.round(rgb[1]+(fogC[1]-rgb[1])*fogK);rgb[2]=Math.round(rgb[2]+(fogC[2]-rgb[2])*fogK)}
          const fill=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
          const item={z,draw:()=>{gx.fillStyle=fill;gx.beginPath();gx.moveTo(ax,ay);gx.lineTo(bx,by);gx.lineTo(cx2,cy);gx.closePath();
            if(op<1)gx.globalAlpha=op;gx.fill();gx.globalAlpha=1}};
          (op<1?alpha:opaque).push(item)}}}}
  opaque.sort((a,b)=>b.z-a.z);alpha.sort((a,b)=>b.z-a.z);add.sort((a,b)=>b.z-a.z);
  for(const it of opaque)it.draw();
  for(const it of alpha)it.draw();
  for(const it of add)it.draw();
}
M3.render=()=>raster(M3.scene,M3.camera);

// ---------- режимы ----------
const argv=process.argv.slice(2);
if(argv[0]==='bench'){
  // поддержка ctx.filter?
  const tc=createCanvas(64,64),tg=tc.getContext('2d');
  tg.fillStyle='#000';tg.fillRect(0,0,64,64);tg.filter='blur(4px)';tg.fillStyle='#fff';tg.fillRect(28,28,8,8);tg.filter='none';
  const d=tg.getImageData(0,0,64,64).data;
  let spread=0;for(let i=0;i<d.length;i+=4)if(d[i]>0)spread++;
  console.log('ctx.filter:',spread>64?'ПОДДЕРЖИВАЕТСЯ (bloom будет)':'НЕ поддерживается ('+spread+')');
  const times=[[8,'кухня'],[21,'микромир'],[80,'двор'],[160,'стадион+толпа'],[250,'космос+Земля'],[275,'галактика 6000 точек'],[297,'финал']];
  let total=0;
  for(const[t,name]of times){
    const a=Date.now();for(let k=0;k<3;k++)frame(t);const ms=(Date.now()-a)/3;
    total+=ms;console.log(`t=${t} ${name}: ${ms.toFixed(0)} мс/кадр`)}
  console.log('среднее:',(total/times.length).toFixed(0),'мс; прогноз 24fps x302s =',(total/times.length*7248/1000/60).toFixed(1),'мин (1 ядро)');
  // сохранить пробные кадры
  for(const t of [21,160,250,275]){frame(t);fs.writeFileSync(`/tmp/mrender/bench-${t}.png`,mainCanvas.toBuffer('image/png'))}
  console.log('пробные кадры → /tmp/mrender/bench-*.png');
}else if(argv[0]==='master'){
  const FPS=24,TOTAL=Math.round(F.total*FPS);
  console.log('кадров всего:',TOTAL,'| воркеров: 2');
  const {spawnSync}=await import('node:child_process');
  const half=Math.ceil(TOTAL/2);
  const w1=spawn('node',['render2.mjs','worker','0',String(half),'/tmp/mrender/chunk0.mp4'],{cwd:'/tmp/mrender',stdio:'inherit'});
  const w2=spawn('node',['render2.mjs','worker',String(half),String(TOTAL),'/tmp/mrender/chunk1.mp4'],{cwd:'/tmp/mrender',stdio:'inherit'});
  const code=await new Promise(r=>{let c=0,n=0;const done=(x)=>{n++;c+=x===0?0:1;if(n===2)r(c)};
    w1.on('exit',done);w2.on('exit',done)});
  if(code!==0){console.error('воркер упал');process.exit(1)}
  fs.writeFileSync("/tmp/mrender/list.txt","file 'chunk0.mp4'\nfile 'chunk1.mp4'\n");
  const r=spawnSync(ffmpegPath,['-f','concat','-safe','0','-i','list.txt','-i','audio.wav',
    '-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest','/home/user/omgGame/film/misha.mp4'],
    {cwd:'/tmp/mrender',stdio:'inherit'});
  console.log('=== ГОТОВО:',r.status===0?'film/misha.mp4':'ОШИБКА МУКСА',r.status);
  process.exit(r.status===0?0:1);
}else if(argv[0]==='worker'){
  const first=+argv[1],last=+argv[2],out=argv[3];
  const FPS=24;
  const ff=spawn(ffmpegPath,['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','1920x1080',
    '-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','24','-maxrate','2.8M','-bufsize','5.6M','-g','48',
    '-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
  ff.stdin.on('error',()=>{});
  let i=first;
  function step(){
    while(i<last){
      const t=i/FPS;
      frame(t);
      const ok=ff.stdin.write(Buffer.from(mainCanvas.data()));
      i++;
      if(!ok){ff.stdin.once('drain',step);return}
      if((i-first)%120===0)console.log(`кадр ${i}/${last}`)}
    ff.stdin.end();
    ff.on('exit',c=>{console.log(`воркер готов: ${out} (${last-first} кадров, код ${c})`);process.exit(c===0?0:1)})}
  step();
}
