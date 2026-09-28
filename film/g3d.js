// g3d.js — настоящие 3D-сцены (three.js / WebGL) для «Истории Вселенной».
// Каждая сцена рендерится в свой WebGL-канвас, который затем кладётся в 2D-кадр
// (поверх рисуются титры, лучи и пост-эффекты из fx.js).
(function(){
if(!window.THREE){window.G3D={ok:false,render:()=>null};return}
const T=THREE,TAU=Math.PI*2;
const G3D={ok:true};
let renderer,canvas,W=1080,H=1920;
const scenes={};

// ---------- шумы ----------
function hash(x,y){let h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,o=5){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=vnoise(x*f,y*f)*a;f*=2.03;a*=.5}return s}
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const GLSL_NOISE=`
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n3(p);p*=2.02;a*=.5;}return s;}`;

function init(){
  if(renderer)return;
  canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(1);renderer.setSize(W,H,false);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
}
function cam(fov=50,near=.1,far=2000){return new T.PerspectiveCamera(fov,W/H,near,far)}
const std=(c,r=.8,m=0,extra={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m},extra));
function ell(rx,ry,rz,mat,seg=32){const m=new T.Mesh(new T.SphereGeometry(1,seg,seg/2|0),mat);m.scale.set(rx,ry,rz);m.castShadow=true;return m}
function tube(pts,r,mat,taper=true){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  const g=new T.TubeGeometry(curve,48,r,16,false);
  if(taper){const pos=g.attributes.position,n=48+1,rs=16+1;const cp=curve.getSpacedPoints(48);
    for(let i=0;i<n;i++){const k=1-i/(n-1)*.75;for(let j=0;j<rs;j++){const id=i*rs+j,v=new T.Vector3().fromBufferAttribute(pos,id).sub(cp[i]).multiplyScalar(k).add(cp[i]);pos.setXYZ(id,v.x,v.y,v.z)}}
    g.computeVertexNormals()}
  const m=new T.Mesh(g,mat);m.castShadow=true;return m}
function additivePoints(geo,vs,fs,uniforms){return new T.Points(geo,new T.ShaderMaterial({uniforms,vertexShader:vs,fragmentShader:fs,transparent:true,depthWrite:false,blending:T.AdditiveBlending}))}
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};

// =====================================================================
// БОЛЬШОЙ ВЗРЫВ — 60 000 частиц, облёт камерой
// =====================================================================
function buildBang(){
  const scene=new T.Scene();scene.background=new T.Color(0x000000);const camera=cam(60);
  const N=60000,pos=new Float32Array(N*3),rnds=new Float32Array(N*4);seed=11;
  for(let i=0;i<N;i++){const u=rnd()*2-1,a=rnd()*TAU,s=Math.sqrt(1-u*u);const r=Math.pow(rnd(),.5);
    // «нити» — анизотропия для структуры
    const fil=Math.sin(a*7)*Math.sin(u*9);pos.set([s*Math.cos(a),u,s*Math.sin(a)],i*3);rnds.set([r,rnd(),rnd(),fil],i*4)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('rnd',new T.BufferAttribute(rnds,4));
  const U={uE:{value:0},uT:{value:0}};
  const pts=additivePoints(geo,`
    attribute vec4 rnd;uniform float uE,uT;varying vec3 vC;varying float vA;
    void main(){float r=rnd.x*(1.+.35*rnd.w);float d=pow(uE,.55)*r*120.;
      vec3 p=position*d;p+=vec3(sin(uT*.5+rnd.y*20.),cos(uT*.4+rnd.z*20.),sin(uT*.3+rnd.x*9.))*uE*3.;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float heat=clamp(1.-uE*1.3+rnd.y*.3,0.,1.);
      vC=mix(mix(vec3(.45,.2,1.),vec3(1.,.35,.15),smoothstep(.0,.5,heat)),vec3(1.,.95,.8),smoothstep(.5,1.,heat));
      vC=mix(vC,vec3(.3,.7,1.),step(.93,rnd.z)*.8);
      vA=.55+.45*rnd.z;gl_PointSize=(1.5+rnd.z*3.5)*(260./-mv.z)*(1.+heat*2.);}`,
    `varying vec3 vC;varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(vC*vA*pow(1.-d*2.,1.6),1.);}`,U);
  scene.add(pts);
  // ядро
  const core=new T.Mesh(new T.SphereGeometry(1,32,16),new T.ShaderMaterial({uniforms:U,transparent:true,blending:T.AdditiveBlending,depthWrite:false,
    vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uE;varying vec3 vN;varying vec3 vV;void main(){float f=pow(max(dot(vN,vV),0.),2.);gl_FragColor=vec4(vec3(1.,.9,.7)*f*(1.-uE)*3.,1.);}`}));
  scene.add(core);
  return{scene,camera,update(u,t){U.uE.value=Math.min(1,u*1.05);U.uT.value=t;core.scale.setScalar(2+u*60);
    const a=t*.15;const d=40+u*120;camera.position.set(Math.sin(a)*d,Math.sin(t*.1)*d*.25,Math.cos(a)*d);camera.lookAt(0,0,0);
    pts.rotation.y=t*.05}};
}

// =====================================================================
// ГАЛАКТИКА — 120 000 звёзд, дифференциальное вращение, пылевые полосы
// =====================================================================
function buildGalaxy(){
  const scene=new T.Scene();scene.background=new T.Color(0x010108);const camera=cam(55,.1,5000);
  const N=120000,pos=new Float32Array(N*3),at=new Float32Array(N*4);seed=5;
  for(let i=0;i<N;i++){const arm=i%4,core=i<N*.18;let r,a,y;
    if(core){r=Math.pow(rnd(),2)*18;a=rnd()*TAU;y=(rnd()-.5)*Math.max(0,8-r*.3)}
    else{r=6+Math.pow(rnd(),.8)*90;a=arm/4*TAU+Math.log(r)*2.6+(rnd()-.5)*(0.5+18/r);y=(rnd()-.5)*(2.2+r*.02)}
    pos.set([Math.cos(a)*r,y,Math.sin(a)*r],i*3);at.set([r,a,rnd(),core?1:0],i*4)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('at',new T.BufferAttribute(at,4));
  const U={uT:{value:0},uA:{value:0}};
  scene.add(additivePoints(geo,`
    attribute vec4 at;uniform float uT,uA;varying vec3 vC;varying float vA;
    void main(){float r=at.x;float a=at.y-uT*6./(r+8.);vec3 p=vec3(cos(a)*r,position.y,sin(a)*r);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      vec3 armC=mix(vec3(.55,.7,1.),vec3(1.,.55,.8),step(.85,at.z));
      vC=mix(armC,vec3(1.,.85,.55),at.w+smoothstep(20.,4.,r));
      vA=uA*(.35+.65*at.z)*(at.w>.5?.9:1.);gl_PointSize=(1.+at.z*2.5+(at.z>.985?5.:0.))*(300./-mv.z);}`,
    `varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vC*vA*pow(1.-d*2.,1.8),1.);}`,U));
  // пылевые рукава (тёмные, обычное смешивание)
  const D=20000,dp=new Float32Array(D*3),da=new Float32Array(D*2);
  for(let i=0;i<D;i++){const arm=i%4,r=10+Math.pow(rnd(),.9)*80,a=arm/4*TAU+Math.log(r)*2.6+.35+(rnd()-.5)*.25;dp.set([Math.cos(a)*r,(rnd()-.5)*1.2,Math.sin(a)*r],i*3);da.set([r,a],i*2)}
  const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dp,3));dg.setAttribute('ra',new T.BufferAttribute(da,2));
  scene.add(new T.Points(dg,new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:`attribute vec2 ra;uniform float uT;void main(){float a=ra.y-uT*6./(ra.x+8.);vec4 mv=modelViewMatrix*vec4(cos(a)*ra.x,position.y,sin(a)*ra.x,1.);gl_Position=projectionMatrix*mv;gl_PointSize=9.*(300./-mv.z);}`,
    fragmentShader:`uniform float uA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.05,.02,.03,.18*uA*(1.-d*2.));}`})));
  // далёкие галактики-соседи
  for(let k=0;k<12;k++){const n=3000,p=new Float32Array(n*3);const cx=(rnd()-.5)*1400,cy=(rnd()-.5)*900,cz=-400-rnd()*900,s=6+rnd()*18,rt=rnd()*3;
    for(let i=0;i<n;i++){const r=Math.pow(rnd(),1.5)*s,a=(i%2)*Math.PI+Math.log(r+1)*3+(rnd()-.5)*.6;p.set([cx+Math.cos(a+rt)*r,cy+Math.sin(a+rt)*r*.4+(rnd()-.5),cz+(rnd()-.5)*2],i*3)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
    scene.add(new T.Points(g,new T.PointsMaterial({color:new T.Color().setHSL(rnd()*.2+.55,.6,.7),size:2.5,sizeAttenuation:true,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false})))}
  return{scene,camera,update(u,t){U.uT.value=t;U.uA.value=Math.min(1,u*3);
    const tilt=.15+u*1.1,d=260-u*110,a=t*.07;camera.position.set(Math.sin(a)*d*Math.cos(tilt),Math.sin(tilt)*d,Math.cos(a)*d*Math.cos(tilt));camera.lookAt(0,0,0)}};
}

// =====================================================================
// ЗЕМЛЯ — процедурные континенты, облака, ночные огни, атмосфера
// =====================================================================
function buildEarth(){
  const scene=new T.Scene();scene.background=new T.Color(0x000004);const camera=cam(40,.1,5000);
  const U={uT:{value:0},uSun:{value:new T.Vector3(-1,.3,.6).normalize()},uLights:{value:1}};
  const earth=new T.Mesh(new T.SphereGeometry(10,192,96),new T.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vN;varying vec3 vP;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}`,
    fragmentShader:GLSL_NOISE+`uniform vec3 uSun;uniform float uT,uLights;varying vec3 vN;varying vec3 vP;varying vec3 vW;
    void main(){vec3 p=normalize(vP);float h=fbm3(p*2.2+3.1)+.25*fbm3(p*8.);float land=smoothstep(.62,.64,h);
      float lat=abs(p.y);vec3 ocean=mix(vec3(.01,.06,.18),vec3(.03,.2,.38),smoothstep(.45,.63,h));
      vec3 green=mix(vec3(.1,.3,.08),vec3(.45,.38,.2),smoothstep(.2,.55,fbm3(p*5.)+lat*.3));vec3 col=mix(ocean,green,land);
      col=mix(col,vec3(.95),smoothstep(.78,.86,lat+fbm3(p*6.)*.1));
      float cl=smoothstep(.55,.8,fbm3(p*3.5+vec3(uT*.02,0.,uT*.01)));
      float dif=max(dot(vN,uSun),0.);vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-uSun,vN);
      float spec=pow(max(dot(R,V),0.),40.)*(1.-land)*.8;
      vec3 day=col*(dif*1.3+.02)+spec*vec3(1.,.9,.7);day=mix(day,vec3(1.)*(dif+.03),cl*.85);
      float night=smoothstep(.1,-.15,dot(vN,uSun));float city=land*step(.72,n3(p*90.))*smoothstep(.5,.9,n3(p*14.))*(1.-cl);
      vec3 c=day+night*city*vec3(1.,.7,.3)*1.6*uLights;
      float fr=pow(1.-max(dot(vN,V),0.),3.);c+=fr*vec3(.3,.55,1.)*(dif+.08);gl_FragColor=vec4(c,1.);}`}));
  scene.add(earth);
  const atm=new T.Mesh(new T.SphereGeometry(10.9,96,48),new T.ShaderMaterial({uniforms:U,side:T.BackSide,transparent:true,blending:T.AdditiveBlending,depthWrite:false,
    vertexShader:`varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}`,
    fragmentShader:`uniform vec3 uSun;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float f=pow(1.-abs(dot(vN,V)),2.5);float s=max(dot(-vN,uSun)*.5+.5,0.);gl_FragColor=vec4(vec3(.25,.5,1.)*f*s*1.8,1.);}`}));
  scene.add(atm);
  const moon=new T.Mesh(new T.SphereGeometry(2.7,64,32),new T.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vN;varying vec3 vP;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:GLSL_NOISE+`uniform vec3 uSun;varying vec3 vN;varying vec3 vP;void main(){float n=fbm3(vP*1.5);vec3 c=vec3(.55)*(.7+n*.5)-smoothstep(.55,.6,n3(vP*3.))*.15;gl_FragColor=vec4(c*(max(dot(vN,uSun),0.)+.02),1.);}`}));
  scene.add(moon);
  // звёзды
  const sp=new Float32Array(6000*3);seed=3;for(let i=0;i<6000;i++){const u=rnd()*2-1,a=rnd()*TAU,s=Math.sqrt(1-u*u);sp.set([s*Math.cos(a)*1500,u*1500,s*Math.sin(a)*1500],i*3)}
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false})));
  // спутники
  const sats=[];for(let i=0;i<24;i++){const s=new T.Group();s.add(new T.Mesh(new T.BoxGeometry(.12,.12,.2),std(0xdddddd,.3,.8)));
    const pnl=new T.Mesh(new T.BoxGeometry(.6,.01,.14),std(0x2244aa,.3,.5));s.add(pnl);s.userData={r:11.5+rnd()*3,i:rnd()*TAU,ph:rnd()*TAU,sp:.15+rnd()*.2};scene.add(s);sats.push(s)}
  scene.add(new T.AmbientLight(0xffffff,.2));const dl=new T.DirectionalLight(0xffffff,2);dl.position.set(-10,3,6);scene.add(dl);
  return{scene,camera,earth,U,update(u,t,mode){
    earth.rotation.y=t*.05;U.uT.value=t;
    const d=mode==='today'?26+Math.pow(u,1.6)*110:30;const a=-.35+t*.02;camera.position.set(Math.sin(a)*d,d*.12,Math.cos(a)*d);camera.lookAt(0,0,0);
    moon.position.set(Math.cos(t*.05+1)*34,4,Math.sin(t*.05+1)*34-10);
    sats.forEach(s=>{const k=s.userData,a=t*k.sp+k.ph;s.position.set(Math.cos(a)*k.r,Math.sin(a)*Math.sin(k.i)*k.r,Math.sin(a)*Math.cos(k.i)*k.r);s.lookAt(0,0,0);s.visible=mode==='today'})}};
}

// =====================================================================
// КЕМБРИЙ — подводный мир: каустики, медузы, трилобиты, аномалокарис
// =====================================================================
function buildCambrian(){
  const scene=new T.Scene();const fogC=new T.Color(0x0a4a60);scene.background=fogC;scene.fog=new T.FogExp2(fogC,.045);
  const camera=cam(55,.1,300);seed=21;
  const U={uT:{value:0},uFog:{value:fogC},uDen:{value:.045}};
  // морское дно с каустиками
  const size=120,seg=200,bg=new T.PlaneGeometry(size,size,seg,seg);bg.rotateX(-Math.PI/2);const bp=bg.attributes.position;
  const ground=(x,z)=>fbm(x*.06,z*.06,5)*5-2.5+Math.max(0,fbm(x*.02+9,z*.02)*9-5)+fbm(x*.5,z*.5,2)*.3;
  for(let i=0;i<bp.count;i++)bp.setY(i,ground(bp.getX(i),bp.getZ(i)));bg.computeVertexNormals();
  const floor=new T.Mesh(bg,new T.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vN;varying vec3 vW;varying float vD;void main(){vN=normal;vW=(modelMatrix*vec4(position,1.)).xyz;vec4 mv=viewMatrix*vec4(vW,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:GLSL_NOISE+`uniform float uT,uDen;uniform vec3 uFog;varying vec3 vN;varying vec3 vW;varying float vD;
    float caus(vec2 p,float t){float c=0.;for(int i=0;i<3;i++){float fi=float(i);vec2 q=p*(1.+fi*.6)+vec2(t*.3*(fi+1.),-t*.2);c+=abs(sin(q.x+sin(q.y*1.3+t)))*abs(sin(q.y+sin(q.x*1.1-t)));}return pow(1.-c/3.,6.)*3.;}
    void main(){float n=fbm3(vW*.8);vec3 sand=mix(vec3(.55,.48,.32),vec3(.38,.34,.24),n);sand=mix(sand,vec3(.25,.35,.2),smoothstep(.55,.7,fbm3(vW*.2+5.)));
      float dif=max(dot(vN,normalize(vec3(.3,1.,.2))),0.);vec3 c=sand*(.25+.75*dif)*vec3(.6,.85,.9);
      c+=caus(vW.xz*.9,uT)*vec3(.5,.8,.8)*dif*.6;float f=1.-exp(-pow(uDen*vD,2.));gl_FragColor=vec4(mix(c,uFog,f),1.);}`}));
  scene.add(floor);
  // водоросли
  const kelpMat=new T.ShaderMaterial({uniforms:U,vertexShader:`uniform float uT;attribute float ph;varying float vY;varying float vD;
    void main(){vec3 p=position;vY=p.y;float k=p.y*p.y*.012;p.x+=sin(uT*1.2+ph+p.y*.35)*k;p.z+=cos(uT*.9+ph+p.y*.25)*k*.6;
      vec4 w=instanceMatrix*vec4(p,1.);vec4 mv=viewMatrix*modelMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uDen;uniform vec3 uFog;varying float vY;varying float vD;void main(){vec3 c=mix(vec3(.05,.2,.08),vec3(.35,.6,.2),vY/14.);float f=1.-exp(-pow(uDen*vD,2.));gl_FragColor=vec4(mix(c,uFog,f),1.);}`,side:T.DoubleSide});
  const kg=new T.PlaneGeometry(.7,14,1,24);kg.translate(0,7,0);const KN=160;const phs=new Float32Array(KN);for(let i=0;i<KN;i++)phs[i]=rnd()*TAU;
  kg.setAttribute('ph',new T.InstancedBufferAttribute(phs,1));
  const kelp=new T.InstancedMesh(kg,kelpMat,KN);const M=new T.Matrix4(),Q=new T.Quaternion(),S=new T.Vector3(),P=new T.Vector3();
  for(let i=0;i<KN;i++){const x=(rnd()-.5)*90,z=(rnd()-.5)*90-10;if(Math.abs(x)<3)continue;P.set(x,ground(x,z)-.2,z);Q.setFromAxisAngle(new T.Vector3(0,1,0),rnd()*TAU);const s=.5+rnd()*.9;S.set(s,s*(.6+rnd()*.7),s);M.compose(P,Q,S);kelp.setMatrixAt(i,M)}
  scene.add(kelp);
  // губки/кораллы-камни
  const rockMat=std(0x6a5a4a,.95);const sponge=std(0xc86a4a,.8);
  for(let i=0;i<70;i++){const x=(rnd()-.5)*80,z=(rnd()-.5)*80;const r=new T.Mesh(new T.IcosahedronGeometry(.4+rnd()*1.4,1),rnd()<.35?sponge:rockMat);r.position.set(x,ground(x,z),z);r.scale.y=.6+rnd()*1.4;r.rotation.set(rnd(),rnd(),rnd());scene.add(r)}
  for(let i=0;i<40;i++){const x=(rnd()-.5)*60,z=(rnd()-.5)*60;const h=1+rnd()*2.5;const c=new T.Mesh(new T.CylinderGeometry(.25,.45,h,12,1,true),std(new T.Color().setHSL(.02+rnd()*.1,.6,.5),.7,0,{side:T.DoubleSide}));c.position.set(x,ground(x,z)+h/2,z);scene.add(c)}
  // медузы
  const jellies=[];
  const bellMat=(h)=>new T.ShaderMaterial({uniforms:Object.assign({uC:{value:new T.Color().setHSL(h,.8,.6)}},U),transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    vertexShader:`uniform float uT;varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=position.y;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 uC;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(uC*(f*1.4+.15)+vec3(.8,.9,1.)*smoothstep(.85,1.,vY)*.3,1.);}`});
  for(let i=0;i<16;i++){const g=new T.Group();const h=[.85,.55,.95,.12][i%4];
    const bell=new T.Mesh(new T.SphereGeometry(1,40,20,0,TAU,0,Math.PI*.55),bellMat(h));g.add(bell);
    const inner=new T.Mesh(new T.SphereGeometry(.45,20,10),bellMat(h+.05));inner.position.y=.35;g.add(inner);
    const tents=[];for(let k=0;k<10;k++){const pts=[];for(let j=0;j<24;j++)pts.push(new T.Vector3());const lg=new T.BufferGeometry().setFromPoints(pts);
      const ln=new T.Line(lg,new T.LineBasicMaterial({color:new T.Color().setHSL(h,.7,.7),transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false}));g.add(ln);tents.push(ln)}
    g.userData={bell,tents,ph:rnd()*TAU,x:(rnd()-.5)*30,y:4+rnd()*9,z:-rnd()*40-2,s:.6+rnd()*1.1};g.scale.setScalar(g.userData.s);scene.add(g);jellies.push(g)}
  // трилобиты
  const trMat=std(0x8a5a32,.45,.1),trDark=std(0x4a2a18,.5);const trils=[];
  for(let i=0;i<14;i++){const g=new T.Group();const body=ell(.9,.28,1.4,trMat);g.add(body);
    const head=ell(1.1,.3,.6,trMat);head.position.set(0,.02,1.1);g.add(head);
    for(let k=0;k<9;k++){const seg=new T.Mesh(new T.TorusGeometry(.6-k*.035,.07,6,20,Math.PI),trDark);seg.rotation.set(0,Math.PI/2,Math.PI/2);seg.rotation.order='YXZ';seg.position.set(0,.12,.75-k*.2);seg.scale.set(1,1.1,1);g.add(seg)}
    const ax=ell(.22,.22,1.3,trDark);ax.position.y=.18;g.add(ax);
    for(const d of[-1,1]){const e=ell(.12,.14,.12,std(0x111111,.2,.3));e.position.set(d*.35,.3,1.15);g.add(e)}
    const ants=[-1,1].map(d=>{const a=tube([[d*.2,0,1.5],[d*.6,.2,2.2],[d*1.1,.1,2.7]],.025,trDark,false);g.add(a);return a});
    const x=(rnd()-.5)*24,z=-rnd()*30;g.userData={x,z,dir:rnd()*TAU,sp:.3+rnd()*.5,ph:rnd()*9};g.scale.setScalar(.6+rnd()*.5);scene.add(g);trils.push(g)}
  // аномалокарис
  const an=new T.Group();const anMat=std(0xc0503a,.5,.05),anLight=std(0xe8906a,.55);
  const anBody=ell(1,.55,4.2,anMat);an.add(anBody);const flaps=[];
  for(let k=0;k<11;k++)for(const d of[-1,1]){const f=new T.Mesh(new T.CircleGeometry(1,24),anLight);f.material.side=T.DoubleSide;f.scale.set(1.1-Math.abs(k-4)*.06,.6,1);
    const piv=new T.Group();piv.position.set(d*.8,0,2.8-k*.55);f.position.x=d*.9;f.rotation.x=-Math.PI/2;piv.add(f);an.add(piv);flaps.push({piv,k,d})}
  for(const d of[-1,1]){const st=tube([[d*.4,.3,3.6],[d*.9,.8,4.2]],.06,anMat,false);an.add(st);const e=ell(.28,.28,.28,std(0x111111,.15,.5));e.position.set(d*.95,.85,4.3);an.add(e);
    const arm=tube([[d*.3,-.2,4],[d*.5,-.3,5.2],[d*.4,-1.2,5.8],[d*.2,-1.8,5.3]],.18,anLight);an.add(arm)}
  const tail=[-1,1].map(d=>{const f=new T.Mesh(new T.CircleGeometry(1,20),anLight);f.material.side=T.DoubleSide;f.scale.set(.5,1.6,1);f.rotation.set(-Math.PI/2,0,d*.5);f.position.set(d*.5,0,-4.6);an.add(f);return f});
  scene.add(an);
  // морской снег
  const SN=4000,snp=new Float32Array(SN*3);for(let i=0;i<SN;i++)snp.set([(rnd()-.5)*60,rnd()*20,-rnd()*60+10],i*3);
  const sng=new T.BufferGeometry();sng.setAttribute('position',new T.BufferAttribute(snp,3));
  const snow=new T.Points(sng,new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`uniform float uT;void main(){vec3 p=position;p.y=mod(p.y-uT*.25,20.)-1.;p.x+=sin(uT*.5+p.z)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=40./-mv.z;}`,
    fragmentShader:`void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(.7,.9,1.)*.35*(1.-d*2.),1.);}`}));scene.add(snow);
  // свет
  scene.add(new T.HemisphereLight(0x9fe8ff,0x2a3020,.9));const sun=new T.DirectionalLight(0xbff4ff,1.6);sun.position.set(10,40,10);scene.add(sun);
  return{scene,camera,update(u,t){U.uT.value=t;
    camera.position.set(Math.sin(t*.1)*2,3.2+Math.sin(t*.3)*.3,14-u*14);camera.lookAt(Math.sin(t*.1)*1,2.4,-10-u*14);
    jellies.forEach(j=>{const d=j.userData,pul=Math.sin(t*2.2+d.ph);j.userData.bell.scale.set(1+pul*.12,1-pul*.18,1+pul*.12);
      j.position.set(d.x+Math.sin(t*.2+d.ph)*2,d.y+Math.sin(t*.5+d.ph)*1.2+t*.25,d.z);
      d.tents.forEach((ln,k)=>{const a=k/10*TAU,p=ln.geometry.attributes.position;for(let q=0;q<24;q++){const y=-q*.28;const w=Math.sin(t*2+q*.35+k+d.ph)*q*.02;p.setXYZ(q,Math.cos(a)*(.8+w)+Math.sin(t+q*.2)*q*.015,y,Math.sin(a)*(.8+w))}p.needsUpdate=true})});
    trils.forEach(tr=>{const d=tr.userData;d.dir+=Math.sin(t*.4+d.ph)*.004;const s=t*d.sp;const x=d.x+Math.sin(d.dir)*s,z=d.z+Math.cos(d.dir)*s;tr.position.set(x,ground(x,z)+.25,z);tr.rotation.y=d.dir;tr.rotation.z=Math.sin(t*6+d.ph)*.03});
    const k=Math.min(1,Math.max(0,(u-.15)/.85));an.position.set(18-k*36,5+Math.sin(t*.8)*.8,-8-u*10);an.rotation.set(Math.sin(t*.7)*.08,-Math.PI/2+Math.sin(t*.5)*.15,Math.sin(t*.9)*.1);
    flaps.forEach(f=>{f.piv.rotation.z=f.d*(Math.sin(t*5-f.k*.6)*.45)});tail.forEach((f,i)=>f.rotation.z=(i?1:-1)*(.5+Math.sin(t*3)*.15))}};
}

// =====================================================================
// ЭРА ДИНОЗАВРОВ — рельеф, лес, стадо зауроподов, тираннозавр, птерозавры, астероид
// =====================================================================
function buildDino(){
  const scene=new T.Scene();const camera=cam(52,.5,3000);seed=33;
  const U={uT:{value:0},uImp:{value:0},uFog:{value:new T.Color(0xcfe0d8)},uDen:{value:.006}};
  scene.fog=new T.FogExp2(0xcfe0d8,.006);
  // небо
  const sky=new T.Mesh(new T.SphereGeometry(1500,48,24),new T.ShaderMaterial({uniforms:U,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:GLSL_NOISE+`uniform float uImp,uT;varying vec3 vP;void main(){float y=vP.y;vec3 day=mix(vec3(.92,.86,.72),vec3(.3,.55,.85),smoothstep(0.,.5,y));
      float cl=smoothstep(.5,.8,fbm3(vec3(vP.xz/(y+.15)*2.,uT*.01)))*smoothstep(0.,.2,y);day=mix(day,vec3(1.),cl*.7);
      vec3 hell=mix(vec3(1.,.35,.08),vec3(.15,.02,.02),smoothstep(-.05,.5,y));hell+=smoothstep(.45,.8,fbm3(vec3(vP.xz/(y+.2)*1.5,uT*.05)))*vec3(.3,.05,0.);
      gl_FragColor=vec4(mix(day,hell,uImp),1.);}`}));
  scene.add(sky);
  // рельеф
  const hgt=(x,z)=>fbm(x*.004+3,z*.004,5)*70-30+Math.max(0,-z-300)*.25*fbm(x*.01,z*.01,3)+fbm(x*.05,z*.05,2)*2;
  const tg=new T.PlaneGeometry(2400,2400,260,260);tg.rotateX(-Math.PI/2);const tp=tg.attributes.position;for(let i=0;i<tp.count;i++)tp.setY(i,hgt(tp.getX(i),tp.getZ(i)));tg.computeVertexNormals();
  const terrain=new T.Mesh(tg,new T.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vN;varying vec3 vW;varying float vD;void main(){vN=normal;vW=(modelMatrix*vec4(position,1.)).xyz;vec4 mv=viewMatrix*vec4(vW,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:GLSL_NOISE+`uniform float uImp,uDen;uniform vec3 uFog;varying vec3 vN;varying vec3 vW;varying float vD;
    void main(){float n=fbm3(vW*.03);float slope=1.-vN.y;vec3 grass=mix(vec3(.18,.36,.1),vec3(.42,.46,.18),n);vec3 rock=mix(vec3(.4,.34,.28),vec3(.25,.22,.2),fbm3(vW*.1));
      vec3 c=mix(grass,rock,smoothstep(.25,.5,slope+n*.2));c=mix(c,vec3(.9),smoothstep(60.,90.,vW.y+n*10.));
      vec3 L=normalize(vec3(-.5,.6,-.4));float dif=max(dot(vN,L),0.);vec3 lc=mix(vec3(1.,.95,.85),vec3(1.,.4,.15),uImp);
      c=c*(dif*lc*1.2+mix(vec3(.25,.3,.35),vec3(.3,.08,.03),uImp));c=mix(c,c*vec3(.35,.3,.28),uImp*.6);
      vec3 fogc=mix(uFog,vec3(.5,.12,.04),uImp);float f=1.-exp(-pow(uDen*vD,1.4));gl_FragColor=vec4(mix(c,fogc,f),1.);}`}));
  terrain.receiveShadow=true;scene.add(terrain);
  // вулкан с дымом
  const vx=-420,vz=-900,vol=new T.Mesh(new T.ConeGeometry(260,300,48,8,true),std(0x4a3a32,1));vol.position.set(vx,hgt(vx,vz)+120,vz);scene.add(vol);
  const smk=[];for(let i=0;i<40;i++){const m=new T.Mesh(new T.SphereGeometry(1,12,8),std(0x6a605a,1,0,{transparent:true,opacity:.5,depthWrite:false}));scene.add(m);smk.push({m,ph:i/40})}
  const lava=new T.PointLight(0xff5a10,0,600);lava.position.set(vx,hgt(vx,vz)+280,vz);scene.add(lava);
  // лес: хвойные и саговники (инстансы)
  const trunk=new T.CylinderGeometry(.5,.9,10,8);trunk.translate(0,5,0);const crown=new T.ConeGeometry(4,16,10);crown.translate(0,16,0);
  const fern=new T.ConeGeometry(3.5,1,7,1);fern.translate(0,.5,0);
  const TN=900;const tr1=new T.InstancedMesh(trunk,std(0x4a3222,1),TN),tr2=new T.InstancedMesh(crown,std(0x1e4a26,.9),TN),fr=new T.InstancedMesh(fern,std(0x3a7a2a,.9),TN);
  [tr1,tr2].forEach(m=>{m.castShadow=true;m.receiveShadow=true});
  const M=new T.Matrix4(),Q=new T.Quaternion(),S=new T.Vector3(),P=new T.Vector3(),C=new T.Color();let ti=0,fi=0;
  for(let i=0;i<TN*3;i++){const x=(rnd()-.5)*1400,z=-rnd()*1200+120;if(Math.abs(x)<40&&z>-80)continue;const y=hgt(x,z);
    if(fbm(x*.01,z*.01,3)<.45||y>50)continue;
    if(rnd()<.6&&ti<TN){const s=.7+rnd()*1.4;P.set(x,y,z);Q.setFromAxisAngle(new T.Vector3(0,1,0),rnd()*TAU);S.set(s,s*(.8+rnd()*.6),s);M.compose(P,Q,S);tr1.setMatrixAt(ti,M);tr2.setMatrixAt(ti,M);C.setHSL(.28+rnd()*.08,.45,.2+rnd()*.12);tr2.setColorAt(ti,C);ti++}
    else if(fi<TN){const s=.6+rnd()*1.5;P.set(x,y,z);Q.setFromEuler(new T.Euler(0,rnd()*TAU,0));S.set(s,s*1.4,s);M.compose(P,Q,S);fr.setMatrixAt(fi,M);C.setHSL(.22+rnd()*.1,.5,.3+rnd()*.1);fr.setColorAt(fi,C);fi++}}
  tr1.count=tr2.count=ti;fr.count=fi;scene.add(tr1,tr2,fr);
  // зауроподы
  const skin=c=>std(c,.75,0);
  function sauropod(col){const g=new T.Group(),m=skin(col),belly=skin(new T.Color(col).lerp(new T.Color(0xd8c8a0),.4));
    g.add(ell(6,4.2,9,m));const bl=ell(5,3,8,belly);bl.position.y=-1.3;g.add(bl);
    const neckP=[[0,1,7],[0,6,12],[0,13,15],[0,19,16]];const neck=tube(neckP,2.2,m);g.add(neck);
    const head=ell(1.3,1,2.2,m);head.position.set(0,19.5,17.3);g.add(head);
    const tail=tube([[0,1,-7],[0,0,-14],[1,-1.5,-22],[3,-3,-30]],2.6,m);g.add(tail);
    const legs=[];[[-3.6,5],[3.6,5],[-3.6,-5],[3.6,-5]].forEach(([x,z],i)=>{const piv=new T.Group();piv.position.set(x,-1,z);
      const l=new T.Mesh(new T.CylinderGeometry(1.5,1.2,9,12),m);l.position.y=-4.5;l.castShadow=true;piv.add(l);g.add(piv);legs.push({piv,i})});
    g.userData={legs,head,neck};return g}
  const herd=[];[[0x6a7a58,-60,-140,1],[0x5a6a50,-20,-190,.85],[0x7a7a5a,40,-230,.9],[0x607050,-100,-260,.7]].forEach(([c,x,z,s],i)=>{const d=sauropod(c);d.scale.setScalar(s);d.userData.base=[x,z];d.userData.ph=i*1.3;d.userData.s=s;scene.add(d);herd.push(d)});
  // тираннозавр
  const tr=new T.Group(),tm=skin(0x5a4a38),tb=skin(0x9a8a68);
  const trBody=ell(2.6,2.8,5.5,tm);trBody.rotation.x=-.25;tr.add(trBody);
  const trTail=tube([[0,.8,-4],[0,.5,-9],[0,0,-14]],2.2,tm);tr.add(trTail);
  const trNeck=tube([[0,1.5,4],[0,3.5,6]],1.8,tm,false);tr.add(trNeck);
  const trHead=new T.Group();trHead.position.set(0,4.5,7);const skull=ell(1.5,1.4,3,tm);skull.position.z=1.5;trHead.add(skull);
  const jaw=ell(1.2,.6,2.6,tb);jaw.position.set(0,-1,1.5);trHead.add(jaw);
  for(const d of[-1,1]){const e=ell(.28,.28,.28,std(0xffc020,.2,0,{emissive:0x442200}));e.position.set(d*1.1,.5,2.2);trHead.add(e)}
  for(let k=0;k<10;k++){const tooth=new T.Mesh(new T.ConeGeometry(.12,.5,6),std(0xeeeedd,.4));tooth.rotation.x=Math.PI;tooth.position.set((k%2?1:-1)*.9,-.55,.4+Math.floor(k/2)*.55);trHead.add(tooth)}
  tr.add(trHead);
  for(const d of[-1,1]){const a=tube([[d*1.8,-.5,3.5],[d*2.1,-1.6,4.3],[d*1.9,-2,5]],.25,tm,false);tr.add(a)}
  const trLegs=[-1,1].map(d=>{const piv=new T.Group();piv.position.set(d*2,-.8,-.5);const th=ell(1.3,3.2,1.8,tm);th.position.y=-2.5;piv.add(th);
    const sh=new T.Group();sh.position.y=-5;const sl=new T.Mesh(new T.CylinderGeometry(.7,.5,4.5,10),tm);sl.position.y=-2.2;sl.castShadow=true;sh.add(sl);const ft=ell(.9,.4,1.6,tm);ft.position.set(0,-4.5,.8);sh.add(ft);piv.add(sh);tr.add(piv);return{piv,sh}});
  scene.add(tr);
  // птерозавры
  const pters=[];for(let i=0;i<7;i++){const g=new T.Group(),m=std(0x6a4a3a,.8,0,{side:T.DoubleSide});g.add(ell(.5,.5,2,m));const hd=ell(.3,.3,1.4,m);hd.position.set(0,.3,2);g.add(hd);
    const crest=new T.Mesh(new T.ConeGeometry(.2,1.5,6),m);crest.rotation.x=-2.2;crest.position.set(0,.6,1.4);g.add(crest);
    const wings=[-1,1].map(d=>{const piv=new T.Group();const sh=new T.Shape();sh.moveTo(0,1);sh.lineTo(d*7,.2);sh.lineTo(d*6.5,-.4);sh.lineTo(0,-1.2);sh.lineTo(0,1);const w=new T.Mesh(new T.ShapeGeometry(sh),m);w.rotation.x=-Math.PI/2;piv.add(w);g.add(piv);return piv});
    g.userData={wings,ph:rnd()*TAU,r:60+rnd()*80,h:60+rnd()*40,sp:.15+rnd()*.1,cz:-150-rnd()*100};scene.add(g);pters.push(g)}
  // астероид
  const astG=new T.Group();const ast=new T.Mesh(new T.IcosahedronGeometry(8,3),std(0x3a3028,1,0,{emissive:0xff4400,emissiveIntensity:.6}));
  const ap=ast.geometry.attributes.position;for(let i=0;i<ap.count;i++){const v=new T.Vector3().fromBufferAttribute(ap,i);v.multiplyScalar(1+(hash(v.x,v.y+v.z)-.5)*.35);ap.setXYZ(i,v.x,v.y,v.z)}ast.geometry.computeVertexNormals();astG.add(ast);
  const fire=new T.Mesh(new T.SphereGeometry(16,24,16),new T.ShaderMaterial({transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vN;varying vec3 vV;void main(){float f=pow(max(dot(vN,vV),0.),1.5);gl_FragColor=vec4(vec3(1.,.55,.15)*f*2.,1.);}`}));astG.add(fire);
  const trail=new T.Mesh(new T.ConeGeometry(14,400,24,1,true),new T.ShaderMaterial({transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,side:T.DoubleSide,
    vertexShader:`varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying float vY;void main(){gl_FragColor=vec4(mix(vec3(.4,.1,0.),vec3(1.,.8,.4),vY)*pow(vY,2.)*1.5,1.);}`}));
  trail.position.y=-200;const trailPiv=new T.Group();trailPiv.add(trail);astG.add(trailPiv);scene.add(astG);
  const impact=new T.Vector3(380,0,-1100);impact.y=hgt(impact.x,impact.z);
  const wave=new T.Mesh(new T.SphereGeometry(1,48,24,0,TAU,0,Math.PI/2),new T.ShaderMaterial({transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false,uniforms:U,side:T.DoubleSide,
    vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uImp;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(vec3(1.,.6,.25)*f*2.*(1.-uImp*.6),1.);}`}));wave.position.copy(impact);scene.add(wave);
  // свет
  const hemi=new T.HemisphereLight(0xcfe6ff,0x4a3a20,.8);scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff0d8,2.4);sun.position.set(-200,260,-160);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-120,right:120,top:120,bottom:-120,near:10,far:800});sun.target.position.set(-20,0,-120);scene.add(sun,sun.target);
  const flashL=new T.PointLight(0xffaa55,0,4000);flashL.position.copy(impact).add(new T.Vector3(0,80,0));scene.add(flashL);
  const walk=(g,t,sp,amp=.35)=>g.userData.legs.forEach(l=>{l.piv.rotation.x=Math.sin(t*sp+(l.i===0||l.i===3?0:Math.PI))*amp});
  return{scene,camera,update(u,t){U.uT.value=t;
    const imp=ss(.66,.74,u);U.uImp.value=imp;scene.fog.color.set(0xcfe0d8).lerp(new T.Color(0x5a1a08),imp);U.uFog.value=scene.fog.color;
    hemi.intensity=.8-imp*.4;sun.color.set(0xfff0d8).lerp(new T.Color(0xff6a30),imp);sun.intensity=2.4-imp*1.4;
    // камера: низкий пролёт сквозь папоротники
    camera.position.set(-10+u*30,9+Math.sin(t*.4)*.6+imp*6,40-u*40);camera.lookAt(10+u*20,14+imp*20,-160);
    if(u>.66&&u<.8){const k=1-(u-.66)/.14;camera.position.x+=(Math.random()-.5)*4*k;camera.position.y+=(Math.random()-.5)*4*k}
    const stopped=Math.max(0,1-imp*1.5);
    herd.forEach((d,i)=>{const [bx,bz]=d.userData.base;const tt=t*stopped;const x=bx+tt*2.4*d.userData.s,z=bz+Math.sin(tt*.1+i)*6;d.position.set(x,hgt(x,z)+9.5*d.userData.s+Math.abs(Math.sin(tt*1.4))*.3,z);d.rotation.y=Math.PI/2+Math.sin(tt*.1+i)*.1;
      walk(d,tt,1.4,.35*stopped);d.userData.neck.rotation.x=Math.sin(t*.5+d.userData.ph)*.05-imp*.15;d.userData.head.rotation.y=Math.sin(t*.7)*.2});
    const tx=45-u*55,tz=-60+Math.sin(u*3)*8;const tb2=Math.abs(Math.sin(t*3.2*stopped))*.5;tr.position.set(tx,hgt(tx,tz)+10.5+tb2,tz);tr.rotation.y=-Math.PI/2-.35+imp*.9;
    trLegs.forEach((l,i)=>{const s=Math.sin(t*3.2*stopped+i*Math.PI);l.piv.rotation.x=s*.5*stopped;l.sh.rotation.x=Math.max(0,-s)*.6*stopped});
    trHead.rotation.x=Math.sin(t*1.3)*.08-imp*.3;jaw.rotation.x=Math.max(0,Math.sin(t*.9))*.3+imp*.5;
    pters.forEach(p=>{const d=p.userData,a=t*d.sp+d.ph;p.position.set(Math.cos(a)*d.r,d.h+Math.sin(t*.7+d.ph)*6,d.cz+Math.sin(a)*d.r*.5);p.rotation.y=-a+Math.PI;p.rotation.z=Math.sin(a)*.3;
      d.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*Math.sin(t*4+d.ph)*.35)});
    // астероид
    const ak=ss(.3,.66,u);astG.visible=u>.3&&u<.665;const start=new T.Vector3(-900,1100,-1400);astG.position.lerpVectors(start,impact,Math.pow(ak,1.3));
    const dir=new T.Vector3().subVectors(impact,start).normalize();trailPiv.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.clone().negate());trailPiv.children[0].position.y=200;trailPiv.children[0].rotation.z=Math.PI;
    fire.scale.setScalar(1+Math.sin(t*30)*.08);ast.rotation.set(t,t*.7,0);
    wave.visible=imp>0;wave.scale.setScalar(20+ss(.66,1,u)*1800);flashL.intensity=imp*(1-ss(.72,1,u)*.6)*40;
    lava.intensity=1.5+imp*6;smk.forEach(s=>{const k=(t*.05+s.ph)%1;s.m.position.set(vx+k*200*(1+imp),hgt(vx,vz)+300+k*500,vz+k*60);s.m.scale.setScalar(20+k*120);s.m.material.opacity=.55*(1-k);s.m.material.color.set(imp>0?0x2a1a14:0x7a706a)})}};
}

// ---------- API ----------
const builders={bang:buildBang,galaxy:buildGalaxy,earth:buildEarth,today:buildEarth,cambrian:buildCambrian,dino:buildDino};
G3D.render=function(name,u,t){
  try{init();const key=name==='today'?'earth':name;if(!scenes[key])scenes[key]=builders[name]();const s=scenes[key];s.update(u,t,name);renderer.render(s.scene,s.camera);return canvas}
  catch(e){console.error('G3D',name,e);G3D.ok=false;return null}
};
// заранее собрать сцены, чтобы не было подвисаний во время показа
G3D.warmup=function(){if(!G3D.ok)return;try{init();for(const n of['bang','galaxy','earth','cambrian','dino']){const k=n;if(!scenes[k])scenes[k]=builders[n]();scenes[k].update(.5,1,n);renderer.compile(scenes[k].scene,scenes[k].camera)}}catch(e){console.error(e);G3D.ok=false}};
G3D._builders=builders;
window.G3D=G3D;
})();
