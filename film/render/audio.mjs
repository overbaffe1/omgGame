// audio.mjs — рендер саундтрека фильма офлайн: голоса (ffmpeg→f32) + buildScore через OfflineAC.
import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {OfflineAC,writeWav} from './miniaudio.mjs';
const require=createRequire(import.meta.url);
const ffmpeg=require('@ffmpeg-installer/ffmpeg').path;
const ffprobe=require('@ffprobe-installer/ffprobe').path;
const DIR='/home/user/omgGame/film/';
global.window=global;global.self=global;
const THREE=require(DIR+'vendor/three.min.js');
THREE.WebGLRenderer=class{constructor(){}setSize(){}render(){}};
global.THREE=THREE;window.THREE=THREE;
const mainCanvas=createCanvas(1920,1080);
global.document={createElement:(t)=>{if(t==='canvas')return createCanvas(300,300);throw new Error(t)},
  getElementById:(id)=>{if(id==='c')return mainCanvas;return null},fonts:{add(){}},head:{appendChild(){}},body:{appendChild(){}}};
global.requestAnimationFrame=(fn)=>setTimeout(fn,16);
const load=(f)=>{eval(fs.readFileSync(DIR+f,'utf8'))};

// декод голосов: mp3 → f32le 44100 stereo
function decodeVoice(file){
  const r=spawnSync(ffmpeg,['-i',file,'-f','f32le','-acodec','pcm_f32le','-ac','2','-ar','44100','-'],{maxBuffer:1<<28});
  if(r.status!==0||!r.stdout.length){console.error('decode fail',file,r.stderr.toString().slice(-300));return null}
  const f32=new Float32Array(r.stdout.buffer,r.stdout.byteOffset,Math.floor(r.stdout.length/4));
  return{channels:[f32.filter((_,i)=>i%2===0),f32.filter((_,i)=>i%2===1)],sampleRate:44100,duration:f32.length/2/44100}
}
const voices={};
for(let i=1;i<=10;i++){const f=DIR+`misha-voices/v${String(i).padStart(2,'0')}.mp3`;
  const b=decodeVoice(f);if(b){voices[`v${String(i).padStart(2,'0')}.mp3`]=b;
    console.log(`v${String(i).padStart(2,'0')}: ${b.duration.toFixed(2)}s`)}}

load('misha3d.js');load('misha-things.js');load('misha-worlds.js');load('misha-rounds.js');load('misha-film.js');
const F=window.MFILM;
window.__MISHA_SETVOICES(voices);
console.log('фильм:',F.total.toFixed(1),'с');

const sr=44100,len=Math.ceil(sr*(F.total+1));
const ac=new OfflineAC(2,len,sr);
window.__MISHA_SCORE(ac,ac.destination);
const t0=Date.now();
const out=ac.render();
console.log('DSP:',((Date.now()-t0)/1000).toFixed(1)+'s, источников:',ac.nodes.length);
// мастеринг: подъём + мягкий лимитер (танх) вместо шины fx.js
const mix=out.mix;
let peak=0,rms=0;
for(let i=0;i<mix.length;i++){const v=Math.tanh(mix[i]*1.25);mix[i]=v*.92;
  const a=Math.abs(v);if(a>peak)peak=a;rms+=v*v}
console.log('peak:',peak.toFixed(3),'rms:',Math.sqrt(rms/mix.length).toFixed(3));
// RMS по 30-секундным окнам — не должно быть пустых
for(let w=0;w<F.total/30;w++){let s=0,n=0;const a=Math.floor(w*30*sr)*2,b=Math.min(mix.length,Math.floor((w+1)*30*sr)*2);
  for(let i=a;i<b;i++){s+=mix[i]*mix[i];n++}
  console.log(`  окно ${Math.floor(w*30)}–${Math.floor(w*30+30)}s rms=${Math.sqrt(s/Math.max(1,n)).toFixed(3)}`)}
const bytes=writeWav('/tmp/mrender/audio.wav',sr,mix);
console.log('audio.wav:',(bytes/1048576).toFixed(1),'МБ');
const pr=spawnSync(ffprobe,['-v','error','-show_entries','format=duration,size','-of','default=nw=1','/tmp/mrender/audio.wav'],{encoding:'utf8'});
console.log(pr.stdout.trim());
