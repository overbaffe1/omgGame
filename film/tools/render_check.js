// Проверка серии без браузера: FILE=greys4.html node render_check.js TAG [реплика+сек,...]
// Нужен @napi-rs/canvas (npm i @napi-rs/canvas). ALL=1 — прогнать все кадры. Картинки → .arena/TAGn.jpg
const {createCanvas}=require('@napi-rs/canvas');const fs=require('fs'),path=require('path');const F=path.join(__dirname,'..')+'/';
const main=createCanvas(1920,1080);main.style={};global.window=global;global.location={search:''};
global.document={getElementById:id=>id==='c'?main:{style:{},remove(){}},createElement:()=>createCanvas(1,1)};
global.Player={mount:o=>{global.__o=o}};
eval(fs.readFileSync(F+'voices/durations.js','utf8'));
const src=fs.readFileSync(F+(process.env.FILE||'greys.html'),'utf8').match(/<script>\n([\s\S]*?)<\/script>/)[1];
eval(fs.readFileSync(F+'fx.js','utf8')+';'+src+';global.S_=S;global.fr=frame;global.D=DUR;global.VB=VBUF;');
const node=()=>new Proxy(function(){},{get:(t,k)=>k==='connect'?()=>{}:k in t?t[k]:(k==='gain'||k==='frequency'?{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}}:()=>{}),set:()=>true});
const ac={currentTime:0,sampleRate:8000,createGain:node,createOscillator:node,createConvolver:node,createBiquadFilter:node,createBufferSource:node,createDynamicsCompressor:node,createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(l)})};
for(const k in window.VOICE_DUR)VB[k]={duration:VOICE_DUR[k]};
__o.score(ac,node());console.log('score ok, DUR',D.toFixed(1));
const LT=vo=>{for(const s of S_)for(const l of s[4])if(l[2]===vo)return s.t0+l.t0;};
let T;if(process.argv[3])T=process.argv[3].split(',').map(x=>isNaN(+x)?(()=>{const [v,o]=x.split('+');return LT(v)+(+o||0)})():+x);
else{if(process.env.ALL)for(let t=0;t<D;t+=.5)fr(t);T=S_.slice(2).map(s=>s.t0+(s[4].length?s[4][Math.floor(s[4].length/2)].t0+1:s[0]*.6));}
const tag=process.argv[2]||'R',out=path.join(F,'..','.arena');fs.mkdirSync(out,{recursive:true});
for(let p=0;p*4<T.length;p++){const tt=T.slice(p*4,p*4+4),sh=createCanvas(1280,720),x=sh.getContext('2d');tt.forEach((t,i)=>{fr(t);x.drawImage(main,(i%2)*640,Math.floor(i/2)*360,640,360)});fs.writeFileSync(`${out}/${tag}${p}.jpg`,sh.toBuffer('image/jpeg',85))}
console.log('frames',T.length);
