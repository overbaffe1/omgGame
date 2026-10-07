/* body51-3d.js — мини-3D-движок для мультфильма «Вайбкодер из Мурманска».
   Без внешних библиотек: меши, камера, отсечение по ближней плоскости, painter-сортировка,
   плоское затенение (ambient + key + rim), туман, тени-блики, экраны с 2D-содержимым.
   Работает и в браузере, и в офлайн-рендере (@napi-rs/canvas). */
(function(){
// punch — короткий наезд камеры на реплике (включается для мем-нарезки)
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const rad=d=>d*Math.PI/180;

// ---------- цвет ----------
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgb2css(r,g,b,a=1){return a>=1?`rgb(${r|0},${g|0},${b|0})`:`rgba(${r|0},${g|0},${b|0},${a})`}
const _c=new Map();
function colorOf(c){if(Array.isArray(c))return c;let v=_c.get(c);if(!v){v=hex2rgb(c);_c.set(c,v)}return v}

// ---------- вектора и матрицы ----------
const v3=(x=0,y=0,z=0)=>({x,y,z});
function vadd(a,b){return v3(a.x+b.x,a.y+b.y,a.z+b.z)}
function vsub(a,b){return v3(a.x-b.x,a.y-b.y,a.z-b.z)}
function vmul(a,s){return v3(a.x*s,a.y*s,a.z*s)}
function vdot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z}
function vcross(a,b){return v3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x)}
function vlen(a){return Math.sqrt(vdot(a,a))}
function vnorm(a){const l=vlen(a)||1;return v3(a.x/l,a.y/l,a.z/l)}
function vlerp(a,b,t){return v3(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t))}
// матрица 4x4 как массив 16 (column-major, как в WebGL) — но нам достаточно своих операций
function mIdent(){return[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]}
function mMul(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function mTrans(x,y,z){return[1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]}
function mScale(x,y,z){return[x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]}
function mRotX(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]}
function mRotY(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]}
function mRotZ(a){const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]}
function xform(m,p){ // точка через матрицу (w=1)
  const x=p.x,y=p.y,z=p.z;
  return v3(m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]);
}
function xformDir(m,p){const x=p.x,y=p.y,z=p.z;return vnorm(v3(m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z))}

// ---------- меши ----------
function mesh(){return{verts:[],faces:[]}}
function addFace(m,idx,col,opt={}){m.faces.push({v:idx,c:col,e:!!opt.emissive,double:opt.double!==false,glow:opt.glow||0})}
function addMesh(dst,src){const off=dst.verts.length;for(const v of src.verts)dst.verts.push(v);for(const f of src.faces)dst.faces.push({v:f.v.map(i=>i+off),c:f.c,e:f.e,double:f.double,glow:f.glow})}
function quad(m,a,b,c,d,col,opt){const i=m.verts.length;m.verts.push(a,b,c,d);addFace(m,[i,i+1,i+2,i+3],col,opt)}
function tri(m,a,b,c,col,opt){const i=m.verts.length;m.verts.push(a,b,c);addFace(m,[i,i+1,i+2],col,opt)}
// коробка: центр в начале координат, размеры w,h,d; можно задать цвет по граням
function box(w,h,d,col,opt={}){const m=mesh();const x=w/2,y=h/2,z=d/2;
 const p=[v3(-x,-y,-z),v3(x,-y,-z),v3(x,y,-z),v3(-x,y,-z),v3(-x,-y,z),v3(x,-y,z),v3(x,y,z),v3(-x,y,z)];
 m.verts.push(...p);
 const top=opt.top||col,side=opt.side||col,bottom=opt.bottom||col,front=opt.front||side,back=opt.back||side;
 addFace(m,[4,5,6,7],front,opt);      // +z
 addFace(m,[1,0,3,2],back,opt);       // -z
 addFace(m,[0,4,7,3],opt.left||side,opt); // -x
 addFace(m,[5,1,2,6],opt.right||side,opt);
 addFace(m,[3,7,6,2],top,opt);
 addFace(m,[0,1,5,4],bottom,opt);
 return m}
// призма/цилиндр по n сегментам: ось Y, радиус r, высота h
function prism(n,r,h,col,opt={}){const m=mesh();const y=h/2,top=[],bot=[];
 for(let i=0;i<n;i++){const a=i/n*TAU;const x=Math.cos(a)*r,z=Math.sin(a)*r;bot.push(v3(x,-y,z));top.push(v3(x,y,z))}
 m.verts.push(...bot,...top);
 for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[i,j,n+j,n+i],col,opt)}
 // крышки: веером вокруг центра
 const cb=m.verts.length;m.verts.push(v3(0,-y,0));const ct=m.verts.length;m.verts.push(v3(0,y,0));
 for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[cb,j,i],opt.bottom||opt.top||col,opt);addFace(m,[ct,n+i,n+j],opt.top||col,opt)}
 return m}
function cone(n,r,h,col,opt={}){const m=mesh();const y=h/2,ap=v3(0,y,0);const ring=[];
 for(let i=0;i<n;i++){const a=i/n*TAU;ring.push(v3(Math.cos(a)*r,-y,Math.sin(a)*r))}
 m.verts.push(...ring);const ai=m.verts.length;m.verts.push(ap);
 const cb=m.verts.length;m.verts.push(v3(0,-y,0));
 for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[i,j,ai],col,opt);addFace(m,[cb,j,i],opt.bottom||col,opt)}
 return m}
function sphere(nLat,nLon,r,col,opt={}){const m=mesh();
 for(let i=0;i<=nLat;i++){const th=i/nLat*Math.PI;const y=Math.cos(th)*r,s=Math.sin(th)*r;
  for(let j=0;j<nLon;j++){const a=j/nLon*TAU;m.verts.push(v3(Math.cos(a)*s,y,Math.sin(a)*s))}}
 for(let i=0;i<nLat;i++)for(let j=0;j<nLon;j++){const jj=(j+1)%nLon;
  const a=i*nLon+j,b=i*nLon+jj,c=(i+1)*nLon+jj,d=(i+1)*nLon+j;
  if(i===0)addFace(m,[a,c,d],col,opt);else if(i===nLat-1)addFace(m,[a,b,c],col,opt);else addFace(m,[a,b,c,d],col,opt)}
 return m}
function torus(nSeg,r,R,col,opt={}){const m=mesh();
 for(let i=0;i<nSeg;i++){const a=i/nSeg*TAU;const cx=Math.cos(a)*R,cz=Math.sin(a)*R;
  for(let j=0;j<nSeg;j++){const b=j/nSeg*TAU;const rr=Math.cos(b)*r;
   m.verts.push(v3(cx+Math.cos(a)*rr,Math.sin(b)*r,cz+Math.sin(a)*rr))}}
 for(let i=0;i<nSeg;i++)for(let j=0;j<nSeg;j++){const ii=(i+1)%nSeg,jj=(j+1)%nSeg;
  addFace(m,[i*nSeg+j,ii*nSeg+j,ii*nSeg+jj,i*nSeg+jj],col,opt)}
 return m}
function planeQuad(w,d,col,opt={}){return box(w,0.01,d,col,opt)}
// тайловая вертикальная плоскость (XY, нормаль +Z) — крупные поверхности режем, иначе painter-сортировка врёт
function wall(w,h,cols,rows,col,opt={}){const m=mesh();
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const x0=-w/2+w*i/cols,x1=-w/2+w*(i+1)/cols,y0=-h/2+h*j/rows,y1=-h/2+h*(j+1)/rows;
    quad(m,v3(x0,y1,0),v3(x1,y1,0),v3(x1,y0,0),v3(x0,y0,0),col,opt)}
  return m}
// тайловая горизонтальная плоскость (XZ)
function slab(w,d,cols,rows,col,opt={}){const m=mesh();
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const x0=-w/2+w*i/cols,x1=-w/2+w*(i+1)/cols,z0=-d/2+d*j/rows,z1=-d/2+d*(j+1)/rows;
    quad(m,v3(x0,0,z0),v3(x1,0,z0),v3(x1,0,z1),v3(x0,0,z1),col,opt)}
  return m}

// ---------- сцена ----------
class Scene{
  constructor(g,W,H){this.g=g;this.W=W;this.H=H;this.faces=[];this.blobs=[];
    this.vp={x:0,y:0,w:W,h:H};this.cam={eye:v3(0,1.6,6),target:v3(0,1.2,0),fov:42};this.light=vnorm(v3(-0.45,0.85,0.35));this.light2=vnorm(v3(0.7,0.25,-0.5));this.ambient=0.66;
    this.sun=[1,.94,.86];this.fill=[.66,.74,1];this.sky=[.55,.65,.85];this.fogCol=[10,12,20];this.fogNear=7;this.fogFar=30;this.key=1;this.exposure=1.0;this.drift=0.03;this._t=0;this.post=[];}
  viewport(vp){this.vp=vp;return this}
  tick(t){this._t=t||0;return this}
  // световое пятно на полу: три вложенных круга, складываются в «screen»
  pool(x,z,r,col,a=0.3){
    a=clamp(a,0,0.30);r=Math.min(r,1.05);
    for(const [k,al] of [[1,a],[0.66,a*0.8],[0.36,a*0.7]]){
      const m=mesh();const N=18;
      for(let i=0;i<N;i++){
        const a1=i/N*TAU,a2=(i+1)/N*TAU;
        tri(m,v3(0,0,0),v3(Math.cos(a1)*r*k,0,Math.sin(a1)*r*k),v3(Math.cos(a2)*r*k,0,Math.sin(a2)*r*k),col,{emissive:true});
      }
      this.add(m,null,{additive:true,alpha:al,tint:[col[0],col[1],col[2]]});
    }
    return this;
  }
  // шахта света: открытый конус вниз («screen»)
  shaft(x,y,z,r0,r1,h,col,a=0.10){
    const m=mesh();const N=14;
    for(let i=0;i<N;i++){
      const a1=i/N*TAU,a2=(i+1)/N*TAU;
      quad(m,
        v3(Math.cos(a1)*r0,-h/2,Math.sin(a1)*r0),v3(Math.cos(a2)*r0,-h/2,Math.sin(a2)*r0),
        v3(Math.cos(a2)*r1,h/2,Math.sin(a2)*r1),v3(Math.cos(a1)*r1,h/2,Math.sin(a1)*r1),col,{emissive:true});
    }
    this.add(m,mTrans(x,y,z),{additive:true,alpha:a});
    return this;
  }
  // пылинки в воздухе
  dust(t,n,cx,cy,cz,wx,wy,wz,col='#e8dcc0',alpha=0.5){
    for(let i=0;i<n;i++){
      const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,h3=Math.sin(i*39.425)*43758.5453;
      const f1=h1-Math.floor(h1),f2=h2-Math.floor(h2),f3=h3-Math.floor(h3);
      const x=cx+(f1-0.5)*wx+Math.sin(t*0.3+f1*7)*0.12;
      const y=cy+(f2-0.5)*wy+Math.sin(t*0.21+f2*9)*0.10;
      const z=cz+(f3-0.5)*wz+Math.cos(t*0.26+f3*5)*0.12;
      const r=0.008+f3*0.010;
      this.add(sphere(3,4,r,col,{emissive:true,glow:0.12}),mTrans(x,y,z),{additive:true,alpha:alpha*0.5*(0.3+0.7*Math.abs(Math.sin(t*0.5+i)))});
    }
    return this;
  }
  camera(eye,target,fov){this.cam={eye,target,fov:fov||this.cam.fov};return this}
  sunLight(dir,intensity){this.light=vnorm(dir);this.key=intensity==null?1:intensity;return this}
  fog(near,far,col){this.fogNear=near;this.fogFar=far;this.fogCol=colorOf(col||'#0a0c14');return this}
  expose(x){this.exposure=x;return this}
  // добавить меш с трансформом; tint уможает цвет, emissive — светящиеся грани
  add(m,mat,opt={}){
    if(!m)return
    const V=m.verts.map(v=>xform(mat||mIdent(),v));
    const off=this.faces.length;
    for(const f of m.faces){
      this.faces.push({p:f.v.map(i=>V[i]),c:Array.isArray(f.c)?f.c:colorOf(f.c),e:f.e||opt.emissive,tint:opt.tint||null,double:f.double!==false,glow:f.glow||opt.glow||0,
        add:!!opt.additive,alpha:opt.alpha==null?1:opt.alpha});
    }
    return off;
  }
  shadow(x,z,rx,rz,alpha=.34){this.blobs.push({x,z,rx,rz,a:alpha})}
  // рисование
  render(){
    const g=this.g,W=this.W,H=this.H,vp=this.vp;
    let eye=this.cam.eye;const tgt=this.cam.target;
    const fwd=vnorm(vsub(tgt,eye));
    let up=v3(0,1,0);if(Math.abs(vdot(fwd,up))>0.995)up=v3(0,0,1);
    let right=vnorm(vcross(fwd,up)),upv=vcross(right,fwd);
    // «живая» камера: лёгкое дыхание и крен
    const t=this._t||0,amp=this.drift||0;
    eye=vadd(eye,vadd(vmul(right,Math.sin(t*0.53)*amp),vadd(vmul(upv,Math.sin(t*0.71+1.3)*amp*0.6),vmul(fwd,Math.sin(t*0.41+0.7)*amp*0.5))));
    const roll=Math.sin(t*0.37+1.2)*0.0055;
    {const cs=Math.cos(roll),sn=Math.sin(roll);
      const r2=vadd(vmul(right,cs),vmul(upv,sn)),u2=vadd(vmul(upv,cs),vmul(right,-sn));
      right=r2;upv=u2}
    const focal=(vp.h/2)/Math.tan(rad(this.cam.fov)/2);
    const cx=vp.x+vp.w/2, cy=vp.y+vp.h/2;
    const toCam=p=>{const d=vsub(p,eye);return v3(vdot(d,right),vdot(d,upv),vdot(d,fwd))};
    const project=c=>{const z=Math.max(.12,c.z);return{x:cx+c.x*focal/z, y:cy-c.y*focal/z, z:c.z}};
    const NEAR=.22;
    const kx=(vp.w/2)/focal, ky=(vp.h/2)/focal;   // полууглы кадра
    // отсечение полигона произвольной полуплоскостью f(p)>=0
    const clipHalf=(poly,f)=>{
      const out=[];const n=poly.length;
      for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n];
        const fa=f(a),fb=f(b);
        if(fa>=0)out.push(a);
        if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);
          out.push(v3(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t)))}}
      return out.length>=3?out:null};
    // полный фрустум: near + левая/правая/верх/низ по экрану
    const clipNear=poly=>{
      let q=clipHalf(poly,p=>p.z-NEAR);if(!q)return null;
      q=clipHalf(q,p=>p.x+kx*p.z);if(!q)return null;
      q=clipHalf(q,p=>kx*p.z-p.x);if(!q)return null;
      q=clipHalf(q,p=>ky*p.z-p.y);if(!q)return null;
      q=clipHalf(q,p=>p.y+ky*p.z);if(!q)return null;
      return q};
    // ключ сортировки painter'а: берём дальнюю точку грани, а не центр, иначе крупный
    // полигон (кран, монитор, полка) перекрывает мелкие детали, которые ближе к камере
    const zsort=(poly,zc)=>{let f=0;for(const p of poly)if(p.z>f)f=p.z;return f+0.06*zc};
    // тени на полу (рисуем как тёмные эллипсы-полигоны на плоскостях y=const — упрощённо: на уровне 0)
    const items=[],adds=[],glass=[];
    for(const b of this.blobs){
      const pts=[];const N=14;
      for(let i=0;i<N;i++){const a=i/N*TAU;pts.push(toCam(v3(b.x+Math.cos(a)*b.rx,0.02,b.z+Math.sin(a)*b.rz)))}
      const cl=clipNear(pts);if(!cl)continue;
      const zs=cl.reduce((s,p)=>s+p.z,0)/cl.length;
      items.push({z:zsort(cl,zs),pts:cl.map(project),col:[6,6,9],a:b.a,e:true,shadow:true});
    }
    for(const f of this.faces){
      const cams=f.p.map(toCam);
      const cl=clipNear(cams);if(!cl)continue;
      // нормаль в мире и центр грани
      let n;if(f.p.length>=3){n=vnorm(vcross(vsub(f.p[1],f.p[0]),vsub(f.p[2],f.p[0])))}
      else n=v3(0,1,0);
      let cw=v3(0,0,0);for(const p of f.p)cw=vadd(cw,p);cw=vmul(cw,1/f.p.length);
      const zc=cl.reduce((s,p)=>s+p.z,0)/cl.length;
      const zk=zsort(cl,zc);
      const toEye=vnorm(vsub(eye,cw));
      let base=f.c;
      if(f.tint)base=[base[0]*f.tint[0],base[1]*f.tint[1],base[2]*f.tint[2]];
      let col;
      if(f.e){col=base}
      else{
        // мягкое low-poly освещение: ключевой свет + заполняющий + кайма, без резких скачков
        const dl=Math.abs(vdot(n,this.light));
        const nb=Math.abs(vdot(n,v3(0,1,0)));
        const d2=Math.abs(vdot(n,this.light2));
        // мягкое «затемнение к полу» (псевдо-AO) + блик по полувектору
        const ao=0.70+0.30*clamp(cw.y/1.25);
        const hv=vnorm(vadd(this.light,toEye));
        const spec=Math.pow(clamp(vdot(n,hv)),14)*0.30*clamp(1-cw.y/3);
        const k=(this.ambient + dl*0.46 + nb*0.12 + d2*0.16)*this.exposure*ao;
        const rim=Math.pow(clamp(1-Math.abs(vdot(n,toEye))),4)*0.26;
        const tr=0.60*this.sun[0]+0.40*this.fill[0], tg=0.60*this.sun[1]+0.40*this.fill[1], tb=0.60*this.sun[2]+0.40*this.fill[2];
        col=[base[0]*(k*tr+rim*1.05)+spec*255*this.sun[0],base[1]*(k*tg+rim*1.08)+spec*250*this.sun[1],base[2]*(k*tb+rim*1.18)+spec*245*this.sun[2]];
      }
      // туман
      const ft=clamp((zc-this.fogNear)/(this.fogFar-this.fogNear));
      if(ft>0){col=[lerp(col[0],this.fogCol[0],ft),lerp(col[1],this.fogCol[1],ft),lerp(col[2],this.fogCol[2],ft)]}
      if(f.add){adds.push({z:zk,pts:cl.map(project),col,a:f.alpha});continue}
      const it={z:zk,pts:cl.map(project),col,a:f.alpha==null?1:f.alpha,e:f.e,glow:f.glow};
      if(it.a<1)glass.push(it);else items.push(it);
    }
    items.sort((A,B)=>B.z-A.z);
    glass.sort((A,B)=>B.z-A.z);      // стекло и вода — после всего непрозрачного, от дальних к ближним
    const paint=(it,composite)=>{
      const pts=it.pts;
      g.save();
      if(composite)g.globalCompositeOperation='screen';
      if(it.a!=null&&it.a<1)g.globalAlpha=it.a;
      g.beginPath();g.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);
      g.closePath();
      const al=it.a==null?1:it.a;
      const c=rgb2css(it.col[0],it.col[1],it.col[2],al);
      g.fillStyle=c;g.strokeStyle=c;g.lineWidth=1;g.fill();
      if(al>0.5)g.stroke();
      g.restore();
    };
    for(const it of items.concat(glass)){
      const pts=it.pts;
      g.beginPath();g.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);
      g.closePath();
      const c=rgb2css(it.col[0],it.col[1],it.col[2],it.a);
      g.fillStyle=c;g.strokeStyle=c;g.lineWidth=1;g.fill();g.stroke();
      if(it.glow>0&&it.e){g.save();g.globalCompositeOperation='screen';g.globalAlpha=it.glow;
        g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath();
        g.fillStyle=rgb2css(it.col[0],it.col[1],it.col[2],1);g.fill();g.restore()}
    }
    adds.sort((A,B)=>B.z-A.z);
    for(const it of adds)paint(it,true);
    return{project:(p)=>project(toCam(p)),eye,right,upv,fwd,focal,cx,cy};
  }
  // 2D-содержимое на 3D-плоскости: 4 мировые точки, рисование в системе (0..wpx, 0..hpx)
  screen(quadWorld,wpx,hpx,drawFn,opt={}){
    const g=this.g;
    const cam=this.render?null:null; // проекция уже посчитана вызовом render() и сохранена
    const P=this._lastProj;if(!P)return;
    const p=quadWorld.map(q=>P.project(q));
    if(p.some(q=>q.z<=0))return;
    // аффинное приближение по трём углам: (0,0)->p0, (1,0)->p1, (0,1)->p3
    const ax=(p[1].x-p[0].x)/wpx, ay=(p[1].y-p[0].y)/wpx;
    const bx=(p[3].x-p[0].x)/hpx, by=(p[3].y-p[0].y)/hpx;
    g.save();
    g.beginPath();g.moveTo(p[0].x,p[0].y);g.lineTo(p[1].x,p[1].y);g.lineTo(p[2].x,p[2].y);g.lineTo(p[3].x,p[3].y);g.closePath();
    if(opt.clip!==false)g.clip();
    g.setTransform(ax,ay,bx,by,p[0].x,p[0].y);
    drawFn(g,wpx,hpx,opt);
    g.setTransform(1,0,0,1,0,0);
    if(opt.glow){g.globalCompositeOperation='screen';g.globalAlpha=opt.glow;
      g.fillStyle=rgb2css(opt.glowCol?colorOf(opt.glowCol)[0]:120,opt.glowCol?colorOf(opt.glowCol)[1]:200,opt.glowCol?colorOf(opt.glowCol)[2]:255,.35);
      g.beginPath();g.moveTo(p[0].x,p[0].y);g.lineTo(p[1].x,p[1].y);g.lineTo(p[2].x,p[2].y);g.lineTo(p[3].x,p[3].y);g.closePath();g.fill()}
    g.restore();
  }
}
// рендер + сохранение проекции для screen()
function draw(scene){const P=scene.render();scene._lastProj=P;return P}

// ---------- готовые «риги» ----------
// человек: собирается из призм/коробок, позы задаются углами
function rigPerson(o={}){
  const m=mesh();
  const skin=o.skin||'#f0cdb0',shirt=o.shirt||'#5d7fb8',pants=o.pants||'#2c3450',hair=o.hair||'#e3bd77',shoe=o.shoe||'#1b1f2c';
  const legH=o.legH||0.86,torsoH=o.torsoH||0.62,headR=o.headR||0.15;
  // бёдра/ноги
  const lx=0.115;
  for(const s of [-1,1]){
    const leg=prism(8,0.085,legH,pants);
    const mm=mMul(mTrans(s*lx,-(legH/2)-0.02,0),mRotX(0));
    addMesh(m,{verts:leg.verts.map(v=>xform(mm,v)),faces:leg.faces});
    const shoeM=box(0.17,0.09,0.30,shoe);
    const sm=mMul(mTrans(s*lx,0.03,0.06),null||mIdent());
    addMesh(m,{verts:shoeM.verts.map(v=>xform(sm,v)),faces:shoeM.faces});
  }
  // торс
  const torso=box(0.46,torsoH,0.26,shirt);
  const tm=mTrans(0,torsoH/2+0.02,0);
  addMesh(m,{verts:torso.verts.map(v=>xform(tm,v)),faces:torso.faces});
  // шея и голова
  const neck=prism(8,0.06,0.09,skin);addMesh(m,{verts:neck.verts.map(v=>xform(mTrans(0,torsoH+0.06,0),v)),faces:neck.faces});
  const head=sphere(7,10,headR,skin);addMesh(m,{verts:head.verts.map(v=>xform(mTrans(0,torsoH+0.09+headR*0.95,0),v)),faces:head.faces});
  // волосы (полусфера сверху) — грубо: сфера чуть больше, срезанная снизу
  const hairMesh=sphere(6,9,headR*1.04,hair);
  addMesh(m,{verts:hairMesh.verts.map(v=>xform(mTrans(0,torsoH+0.09+headR*0.95+headR*0.12,0),v)),faces:hairMesh.faces.filter(f=>{
    const vs=f.v.map(i=>hairMesh.verts[i]);const avgY=vs.reduce((s,v)=>s+v.y,0)/vs.length;return avgY>headR*0.15})});
  // борода
  if(o.beard){const b=box(0.20,0.13,0.17,'#c8a37a');addMesh(m,{verts:b.verts.map(v=>xform(mTrans(0,torsoH+0.09+headR*0.62,0.033),v)),faces:b.faces})}
  // руки (плечи + предплечья), угол в градусах
  const armA=(o.arm||0);
  for(const s of [-1,1]){
    const upper=prism(7,0.062,0.34,shirt);
    const piv=mMul(mTrans(s*(0.23+0.03),torsoH-0.06,0),mRotZ(s*rad(-18)));
    const up2=mMul(piv,mRotX(rad(armA*0.6)));
    addMesh(m,{verts:upper.verts.map(v=>xform(mMul(up2,mTrans(0,-0.17,0)),v)),faces:upper.faces});
    const fore=prism(7,0.055,0.32,skin);
    addMesh(m,{verts:fore.verts.map(v=>xform(mMul(up2,mTrans(0,-0.36,0)),v)),faces:fore.faces});
  }
  // лицо: глаза и оправа
  const eyeCol=o.eyeCol||'#26314a';
  for(const s of [-1,1]){
    const e=box(0.035,0.035,0.02,eyeCol);addMesh(m,{verts:e.verts.map(v=>xform(mTrans(s*0.055,torsoH+0.09+headR*0.98,headR*0.94),v)),faces:e.faces});
  }
  if(o.glasses){for(const s of [-1,1]){const lens=torus(6,0.012,0.052,'#2b3448');addMesh(m,{verts:lens.verts.map(v=>xform(mTrans(s*0.058,torsoH+0.09+headR*0.98,headR*0.95),v)),faces:lens.faces})}}
  return{mesh:m,height:legH+torsoH+0.09+headR*2,torsoH,headR,legH}
}
// кот: сфинкс — лысый, ушастый, с хвостом
function rigCat(o={}){
  const m=mesh();const skin=o.skin||'#cdbab2',dark=o.dark||'#b09aa2',nose='#c99a9a';
  const headZ=0.44,headY=0.50;
  // туловище: удлинённая сфера (сфинкс лежит), слегка сплюснутая
  const body=sphere(8,12,0.30,skin);
  addMesh(m,{verts:body.verts.map(v=>xform(mMul(mTrans(0,0.26,0),mScale(0.86,0.74,1.42)),v)),faces:body.faces});
  // грудь чуть выше — «сфинксовая» поза
  const chest=sphere(7,10,0.22,skin);
  addMesh(m,{verts:chest.verts.map(v=>xform(mMul(mTrans(0,0.33,0.26),mScale(1,0.92,0.85)),v)),faces:chest.faces});
  // голова и шея
  const neck=prism(8,0.11,0.16,skin);
  addMesh(m,{verts:neck.verts.map(v=>xform(mMul(mTrans(0,headY-0.02,headZ-0.16),mRotX(0.35)),v)),faces:neck.faces});
  const head=sphere(8,12,0.225,skin);
  addMesh(m,{verts:head.verts.map(v=>xform(mMul(mTrans(0,headY,headZ),mScale(1,1.02,1.08)),v)),faces:head.faces});
  // уши — пирамидки на макушке
  for(const sd of [-1,1]){
    const ear=cone(4,0.095,0.19,skin);
    addMesh(m,{verts:ear.verts.map(v=>xform(mMul(mul(mTrans(sd*0.125,headY+0.20,headZ-0.02),mRotZ(sd*0.28)),mRotX(-0.12)),v)),faces:ear.faces});
    const inner=cone(4,0.055,0.13,dark);
    addMesh(m,{verts:inner.verts.map(v=>xform(mMul(mul(mTrans(sd*0.124,headY+0.19,headZ-0.005),mRotZ(sd*0.28)),mRotX(-0.12)),v)),faces:inner.faces});
  }
  // морда, нос, рот
  const muzzle=sphere(6,9,0.088,'#ded0c9');
  addMesh(m,{verts:muzzle.verts.map(v=>xform(mMul(mTrans(0,headY-0.055,headZ+0.20),mScale(1.05,0.85,0.9)),v)),faces:muzzle.faces});
  addMesh(m,{verts:box(0.05,0.032,0.028,nose).verts.map(v=>xform(mTrans(0,headY-0.028,headZ+0.285),v)),faces:box(0.05,0.032,0.028,nose).faces});
  // глаза
  for(const sd of [-1,1]){
    const e=sphere(5,8,0.030,o.eyes||'#4f9a72');
    addMesh(m,{verts:e.verts.map(v=>xform(mTrans(sd*0.085,headY+0.035,headZ+0.19),v)),faces:e.faces});
    const z=prism(4,0.006,0.05,'#1b1418');
    addMesh(m,{verts:z.verts.map(v=>xform(mMul(mTrans(sd*0.085,headY+0.035,headZ+0.215),mRotX(1.15)),v)),faces:z.faces});
    const pupil=sphere(4,6,0.012,'#241a1d');
    addMesh(m,{verts:pupil.verts.map(v=>xform(mTrans(sd*0.085,headY+0.035,headZ+0.217),v)),faces:pupil.faces});
  }
  // усы
  for(const sd of [-1,1])for(let i=0;i<3;i++){const x=sd*(0.085+i*0.010),y=headY-0.085+i*0.013;
    const p=prism(3,0.0028,0.13,dark);
    addMesh(m,{verts:p.verts.map(v=>xform(mMul(mMul(mTrans(x,y,headZ+0.225),mRotZ(sd*1.35)),mRotX(-0.2+i*0.15)),v)),faces:p.faces})}
  // лапы — 4 «сапожка»
  for(const sd of [-1,1])for(const f of [0.30,-0.12]){
    const p=prism(7,0.055,0.26,skin);
    addMesh(m,{verts:p.verts.map(v=>xform(mMul(mTrans(sd*0.135,0.13,f),mRotX(f>0?0.06:-0.06)),v)),faces:p.faces});
    const paw=sphere(5,8,0.062,'#d8c8c2');
    addMesh(m,{verts:paw.verts.map(v=>xform(mMul(mTrans(sd*0.135,0.03,f+0.13),mScale(1,0.6,1.2)),v)),faces:paw.faces})}
  // складки кожи
  for(let i=0;i<4;i++){const w=box(0.012,0.10,0.012,dark);
    addMesh(m,{verts:w.verts.map(v=>xform(mMul(mTrans(-0.07+i*0.047,0.36,0.10-i*0.03),mRotX(0.2)),v)),faces:w.faces})}
  // хвост: сегменты, изгиб управляется o.curl
  const curl=o.curl==null?0.5:o.curl;
  let tp=mTrans(0,0.24,-0.42);
  for(let i=0;i<9;i++){
    const r=0.034-i*0.0026,len=0.105;
    const bend=mMul(mRotX(0.55+curl*0.75+i*0.09),mRotZ(Math.sin(i*0.7)*0.08));
    tp=mMul(tp,bend);
    const seg=prism(7,Math.max(0.008,r),len,skin);
    addMesh(m,{verts:seg.verts.map(v=>xform(mMul(tp,mTrans(0,len/2,0)),v)),faces:seg.faces});
    tp=mMul(tp,mTrans(0,len,0));
  }
  return{mesh:m,length:1.0,height:0.6};
}
// помощник: собрать из трансформов
function mul(a,b){return mMul(a,b)}
window.B3={TAU,clamp,lerp,rad,v3,vadd,vsub,vmul,vdot,vcross,vlen,vnorm,vlerp,mIdent,mMul,mTrans,mScale,mRotX,mRotY,mRotZ,xform,xformDir,
 mesh,addFace,addMesh,quad,tri,box,prism,cone,sphere,torus,planeQuad,wall,slab,Scene,draw,rigPerson,rigCat,colorOf,rgb2css,
 poolsFromGlows:null,dustFromSpec:null};
})();
