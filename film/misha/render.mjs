#!/usr/bin/env node
/* render.mjs — офлайн-рендер «МИША против всего» в MP4 (5:00, 9:16).
 *
 *   npm i @napi-rs/canvas @ffmpeg-installer/ffmpeg     # один раз, в любой папке (см. README.md)
 *   node film/misha/render.mjs                         # полный ролик → film/misha/out/misha.mp4
 *   node film/misha/render.mjs --shots 10,60,130,200   # PNG-кадры в film/misha/out/shots/
 *   node film/misha/render.mjs --from 0 --to 30        # кусок (проверка правки)
 *   node film/misha/render.mjs --size 540x960          # быстрее; по умолчанию 720x1280
 *   node film/misha/render.mjs --fps 30 --no-audio
 *
 * Кадры рисует тот же код, что и браузерный просмотр (film/misha/misha.js).
 * Звук синтезируется здесь же из тех же ударов (HITS) и этапов — без внешних файлов.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const OUT = path.join(here, 'out');

// зависимости: MISHA_DEPS=/путь/к/node_modules или локальный node_modules
const require = createRequire(process.env.MISHA_DEPS ? path.join(process.env.MISHA_DEPS, 'noop.cjs') : import.meta.url);
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const ffmpeg = process.env.FFMPEG_BIN || (() => { try { return require('@ffmpeg-installer/ffmpeg').path; } catch { return 'ffmpeg'; } })();

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : d; };
const flag = k => args.includes(k);
const [W, H] = opt('--size', '720x1280').split('x').map(Number);
const FPS = Number(opt('--fps', '24'));
const shots = opt('--shots', null);

// шрифт Manrope (кириллица) — из репозитория
for (const w of [400,600,700,800]){
  const f = path.join(repo, 'film/body51-day/fonts', `Manrope-${w}.ttf`);
  if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, 'Manrope');
}

// ---------- сцена (та же, что в браузере) ----------
const sandbox = { console, Math, Float32Array, Array, Object, JSON };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ['film/body51-3d.js', 'film/misha/misha.js']) {
  vm.runInContext(fs.readFileSync(path.join(repo, f), 'utf8'), sandbox, { filename: f });
}
const MISHA = sandbox.MISHA;
MISHA.setSize(W, H);
const DUR = MISHA.DUR;

const cv = createCanvas(W, H);
const g = cv.getContext('2d');

// ---------- звук: синтез ----------
function energyAt(t){
  for (const s of MISHA.STAGES) if (t >= s.t0 && t < s.t1) return s.energy;
  return 0.3;
}
function synthAudio(sr = 44100){
  const N = Math.ceil(DUR * sr);
  const buf = new Float32Array(N);
  const add = (t0, len, fn) => {
    const i0 = Math.floor(t0 * sr), n = Math.floor(len * sr);
    for (let i = 0; i < n; i++){ const j = i0 + i; if (j < 0 || j >= N) break; buf[j] += fn(i / sr); }
  };
  let seed = 12345;
  const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
  const BPM = 124, beat = 60 / BPM, bar = beat * 4;
  const chords = [
    {root: 55.0,  notes: [220.0, 261.6, 329.6]},   // Am
    {root: 43.65, notes: [174.6, 220.0, 261.6]},   // F
    {root: 65.41, notes: [130.8, 164.8, 196.0]},   // C
    {root: 49.0,  notes: [196.0, 246.9, 293.7]},   // G
  ];
  // кик + хэт + бас (по энергии этапа)
  for (let b = 0; b * beat < DUR; b++){
    const t = b * beat, e = energyAt(t);
    if (e >= 0.3){
      add(t, 0.45, x => 0.85*Math.min(1,e) * Math.exp(-x*9) * Math.sin(2*Math.PI*(45*x + 90*(1-Math.exp(-25*x))/25)));
    }
    if (e >= 0.6) add(t + beat/2, 0.08, x => 0.10*e*noise()*Math.exp(-x*70));
    if (e >= 0.5){
      const br = Math.floor(t / bar) % chords.length;
      const f = chords[br].root * (b % 2 ? 1 : 1);
      add(t, beat*0.45, x => { const p = 2*Math.PI*f*x; return 0.20*e*(Math.sin(p)+0.5*Math.sin(2*p)+0.25*Math.sin(3*p))*Math.exp(-x*5); });
    }
  }
  // пэд аккордами на каждом такте
  for (let k = 0; k * bar < DUR; k++){
    const t = k * bar, e = energyAt(t), c = chords[k % chords.length];
    const amp = 0.05 * (1.15 - e*0.6);
    for (const f of c.notes){
      add(t, bar*1.05, x => { const env = Math.min(1, x/0.35) * Math.min(1, (bar*1.05 - x)/0.6); return amp*env*Math.sin(2*Math.PI*f*x)*(1+0.004*Math.sin(x*5)); });
    }
  }
  // удары из HITS
  for (const h of MISHA.HITS){
    const e = energyAt(h.t);
    if (h.s === 'hit'){
      add(h.t, 0.3, x => 0.42*noise()*Math.exp(-x*40) + 0.45*Math.sin(2*Math.PI*110*x)*Math.exp(-x*20));
    } else if (h.s === 'big'){
      add(h.t, 1.1, x => 0.85*Math.sin(2*Math.PI*(52*x+10*(1-Math.exp(-6*x))/6))*Math.exp(-x*4) + 0.38*noise()*Math.exp(-x*11));
    } else if (h.s === 'whoosh'){
      let y = 0;
      add(h.t, 0.6, x => { const a = 0.02 + 0.5*x/0.6; y += a*(noise()-y); return 0.7*y*Math.sin(Math.PI*x/0.6); });
    }
  }
  // громкость и мягкое ограничение
  let peak = 0; for (let i = 0; i < N; i++){ const v = Math.abs(buf[i]); if (v > peak) peak = v; }
  const k = peak > 0 ? 0.9/peak : 1;
  for (let i = 0; i < N; i++) buf[i] = Math.tanh(buf[i]*k*1.3);
  return buf;
}
function writeWav(file, samples, sr = 44100){
  const n = samples.length, data = Buffer.alloc(n*2);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i]*32767))), i*2);
  const h = Buffer.alloc(44);
  h.write('RIFF',0); h.writeUInt32LE(36+data.length,4); h.write('WAVE',8);
  h.write('fmt ',12); h.writeUInt32LE(16,16); h.writeUInt16LE(1,20); h.writeUInt16LE(1,22);
  h.writeUInt32LE(sr,24); h.writeUInt32LE(sr*2,28); h.writeUInt16LE(2,32); h.writeUInt16LE(16,34);
  h.write('data',36); h.writeUInt32LE(data.length,40);
  fs.writeFileSync(file, Buffer.concat([h,data]));
}

fs.mkdirSync(OUT, {recursive: true});

// ---------- режим стиллов ----------
if (shots){
  const dir = path.join(OUT, 'shots'); fs.mkdirSync(dir, {recursive: true});
  for (const s of shots.split(',').map(Number)){
    MISHA.frame(g, s);
    fs.writeFileSync(path.join(dir, `t${String(s).padStart(3,'0')}.png`), cv.toBuffer('image/png'));
    console.log('кадр', s, 'сек →', path.join(dir, `t${String(s).padStart(3,'0')}.png`));
  }
  process.exit(0);
}

// ---------- полный рендер ----------
const from = Number(opt('--from', '0')), to = Number(opt('--to', String(DUR)));
const frames = Math.round((to - from) * FPS);
const wavFile = path.join(OUT, 'misha-audio.wav');
const vidFile = path.join(OUT, 'misha-video.mp4');
const outFile = opt('--out', path.join(OUT, 'misha.mp4'));
if (!flag('--no-audio')){
  console.log('синтез звука…');
  writeWav(wavFile, synthAudio());
}
const vArgs = ['-y', '-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0'];
const aArgs = flag('--no-audio') ? [] : ['-ss', String(from), '-i', wavFile];
const outArgs = ['-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart'];
if (!flag('--no-audio')) outArgs.push('-c:a','aac','-b:a','192k','-shortest');
const proc = spawn(ffmpeg, [...vArgs, ...aArgs, ...outArgs, outFile], { stdio: ['pipe','ignore','inherit'] });
proc.on('error', e => { console.error('ffmpeg:', e.message); process.exit(1); });
const t0 = Date.now();
for (let f = 0; f < frames; f++){
  const t = from + f / FPS;
  MISHA.frame(g, t);
  const ok = proc.stdin.write(Buffer.from(cv.data()));
  if (!ok) await new Promise(r => proc.stdin.once('drain', r));
  if (f % (FPS*10) === 0 && f){
    const el = (Date.now()-t0)/1000, eta = el/f*(frames-f);
    console.log(`кадр ${f}/${frames} (${(f/frames*100).toFixed(1)}%), осталось ~${Math.round(eta/60)} мин`);
  }
}
proc.stdin.end();
await new Promise(r => proc.on('close', r));
console.log('готово:', outFile);
