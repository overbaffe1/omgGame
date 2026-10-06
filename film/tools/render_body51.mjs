#!/usr/bin/env node
/* render_body51.mjs — офлайн-рендер мультфильма «Вайбкодер из Мурманска» в MP4.
 *
 *   npm i @napi-rs/canvas @ffmpeg-installer/ffmpeg     # зависимости
 *   node film/tools/render_body51.mjs                  # полный MP4 → film/body51.mp4
 *   node film/tools/render_body51.mjs --shots 0,40,90  # раскадровка в /tmp/body51-shots
 *   node film/tools/render_body51.mjs --range 30:60    # кусок для проверки
 *   node film/tools/render_body51.mjs --fast            # облегчённый пост-процесс (вдвое быстрее)
 *
 * Зависимости можно держать вне репозитория: BODY51_DEPS=/путь/к/node_modules
 *
 * Кадры рисует тот же код, что и браузерный плеер (film/body51-*.js),
 * музыка — та же партитура (film/body51-score.js), голос — mp3 из body51-voices/.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { computeTiming, toJs, estimate } from './body51_timing.mjs';

// зависимости можно держать вне репозитория: BODY51_DEPS=/путь/к/node_modules
const require = createRequire((process.env.BODY51_DEPS || '/tmp/body51-deps/node_modules') ? path.join(process.env.BODY51_DEPS || '/tmp/body51-deps/node_modules', 'noop.cjs') : import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const film = path.resolve(here, '..');
const { createCanvas } = require('@napi-rs/canvas');
const ffmpeg = process.env.FFMPEG_BIN || (() => { try { return require('@ffmpeg-installer/ffmpeg').path; } catch { return 'ffmpeg'; } })();

const argv = process.argv.slice(2);
const FAST = argv.includes('--fast');
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i < 0 ? def : argv[i + 1]; };
const CRF = String(arg('crf', process.env.BODY51_CRF || 25));
const FPS = 24, SR = 44100;

// ---------- длительности озвучки ----------
function mp3Duration(file) {
  const r = spawnSync(ffmpeg, ['-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr || '');
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : null;
}
function decodeMp3(file) {                        // → Float32Array, моно, 44100
  const r = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffmpeg decode: ' + file);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}

// ---------- хронометраж ----------
const script = JSON.parse(fs.readFileSync(path.join(film, 'body51-voices', 'script.json'), 'utf8'));
const durations = {}, narFiles = {}, texts = {};
for (const v of script.voices) {
  const mp3 = path.join(film, 'body51-voices', v.id + '.mp3');
  if (!fs.existsSync(mp3)) {
    if (!argv.includes('--no-voice')) { console.error('нет озвучки:', mp3, '— сначала синтезируй голос (или --no-voice для примерки)'); process.exit(1); }
    durations[v.scene] = estimate(v.text); texts[v.scene] = v.text;
    console.log('без озвучки (оценка):', v.id, durations[v.scene].toFixed(1) + 'с'); continue;
  }
  durations[v.scene] = mp3Duration(mp3);
  narFiles[v.id] = mp3; texts[v.scene] = v.text;
}
const timing = computeTiming({ durations, texts });
fs.writeFileSync(path.join(film, 'body51-timing.js'), toJs(timing, 'длительности из mp3 озвучки (render_body51.mjs)'));
const TOTAL = timing.total;
const mm = v => `${Math.floor(Math.round(v) / 60)}:${String(Math.round(v) % 60).padStart(2, '0')}`;
console.log('хронометраж:', mm(TOTAL), '· глав:', timing.scenes.length);

// ---------- сцена рисования (тот же код, что в браузере) ----------
const cv = createCanvas(1080, 1920);
function makeFX() {
  let small, sg, grain = [];
  return {
    post(g, t, o = {}) {
      const W = cv.width, H = cv.height;
      const O = Object.assign({ bloom: .5, grain: .06, vignette: .55, leak: .1, ca: 0, warm: 0 }, o);
      if (!small) {
        small = createCanvas(W >> 2, H >> 2); sg = small.getContext('2d');
        for (let k = 0; k < 4; k++) {
          const c = createCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256);
          for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
          x.putImageData(d, 0, 0); grain.push(c);
        }
      }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (O.bloom > 0) {
        sg.globalCompositeOperation = 'copy'; sg.filter = 'contrast(1.9) brightness(.85) saturate(1.3) blur(10px)';
        sg.drawImage(cv, 0, 0, small.width, small.height); sg.filter = 'none';
        g.globalCompositeOperation = 'screen'; g.globalAlpha = O.bloom; g.drawImage(small, 0, 0, W, H);
        if (!FAST) { g.globalAlpha = O.bloom * .5; g.filter = 'blur(30px)'; g.drawImage(small, 0, 0, W, H); g.filter = 'none'; }
      }
      if (O.leak > 0) {
        g.globalCompositeOperation = 'screen'; g.globalAlpha = 1;
        const lx = W * (.5 + .6 * Math.sin(t * .13)), ly = H * (.3 + .4 * Math.sin(t * .09 + 1));
        const gr = g.createRadialGradient(lx, ly, 0, lx, ly, W * .9);
        gr.addColorStop(0, `rgba(255,${150 + 60 * Math.sin(t * .2) | 0},90,${O.leak})`); gr.addColorStop(1, 'rgba(255,120,60,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      const v = g.createRadialGradient(W / 2, H / 2, H * .28, W / 2, H / 2, H * .78);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${O.vignette})`);
      g.fillStyle = v; g.fillRect(0, 0, W, H);
      if (O.grain > 0) {
        g.globalCompositeOperation = 'overlay'; g.globalAlpha = O.grain * 2.2;
        const p = g.createPattern(grain[(t * 24 | 0) % 4], 'repeat');
        g.translate(Math.random() * 256, Math.random() * 256); g.fillStyle = p; g.fillRect(-256, -256, W + 512, H + 512);
      }
      g.restore();
    }
  };
}
const sandbox = {
  document: { getElementById: id => (id === 'c' ? cv : { addEventListener() {} }) },
  FX: makeFX(),
  console, Math, Date,
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.window.addEventListener = () => {};
vm.createContext(sandbox);
for (const f of ['body51-timing.js', 'body51-film.js', 'body51-scenes.js', 'body51-score.js', 'body51-run.js'])
  vm.runInContext(fs.readFileSync(path.join(film, f), 'utf8'), sandbox, { filename: f });
const filmApi = sandbox.__body51;
if (!filmApi) { console.error('фильм не инициализировался'); process.exit(1); }

// ---------- раскадровка для проверки ----------
const shots = arg('shots', null);
if (shots) {
  const out = path.join('/tmp', 'body51-shots');
  fs.mkdirSync(out, { recursive: true });
  const times = shots === 'auto'
    ? timing.scenes.map(s => s.start + s.dur * .62)
    : shots.split(',').map(Number);
  for (const t of times) {
    filmApi.frame(Math.max(0, Math.min(TOTAL - .05, t)));
    const name = path.join(out, `t${String(Math.round(t)).padStart(4, '0')}.png`);
    fs.writeFileSync(name, cv.toBuffer('image/png'));
    console.log('кадр', name);
  }
  process.exit(0);
}

// ---------- музыка: та же партитура, что в браузере ----------
function renderMusic() {
  const ev = vm.runInContext('BODY51_SCORE(window.B.SC, window.B.TOTAL)', sandbox);
  const n = Math.ceil(SR * (TOTAL + 1.5));
  const ML = new Float32Array(n), MR = new Float32Array(n);          // музыка
  const VL = new Float32Array(n), VR = new Float32Array(n);          // голос за кадром
  const harm = { sine: [[1, 1]], triangle: [[1, 1], [3, .12], [5, .05]], square: [[1, 1], [3, .33]], sawtooth: [[1, 1], [2, .5], [3, .3]] };
  for (const e of ev) {
    const from = Math.max(0, Math.floor(e.at * SR)), len = Math.floor(Math.min(e.dur, 8) * SR);
    const a = Math.max(.005, e.attack || .02), rel = Math.max(.06, e.dur * .9);
    for (let i = 0; i < len; i++) {
      const idx = from + i; if (idx >= n) break;
      const age = i / SR;
      const env = Math.min(1, age / a) * Math.exp(-age / rel) * Math.max(0, Math.min(1, (e.dur - age) / .06));
      let s = 0;
      for (const [k, amp] of (harm[e.type] || harm.sine)) s += amp * Math.sin(2 * Math.PI * e.f * k * age);
      const v = e.vol * env * s;
      ML[idx] += v; MR[idx] += v * .96;
    }
  }
  // мягкая стерео-ширина (задержка Хааса только для музыки)
  const d = Math.floor(SR * .012), MR2 = new Float32Array(n);
  for (let i = d; i < n; i++) MR2[i] = MR[i - d] * .5 + MR[i] * .6;
  // голос: ровно по таймингу глав, без общего приглушения
  const duck = new Float32Array(n).fill(1);
  for (const sc of timing.scenes) {
    if (!sc.narr || !narFiles[sc.narr]) continue;
    const pcm = decodeMp3(narFiles[sc.narr]);
    const at = Math.floor((sc.start + (sc.narrAt || .6)) * SR);
    for (let i = 0; i < pcm.length; i++) if (at + i < n) { VL[at + i] += pcm[i]; VR[at + i] += pcm[i]; }
    const from = Math.max(0, at - Math.floor(.25 * SR)), to = Math.min(n, at + pcm.length + Math.floor(.22 * SR));
    for (let i = from; i < to; i++) duck[i] = .38;                    // приглушаем только музыку
  }
  const smooth = new Float32Array(n);
  let acc = 1;
  for (let i = 0; i < n; i++) { acc += (duck[i] - acc) * (duck[i] < acc ? .012 : .0016); smooth[i] = acc; }
  // баланс: музыка −22 LUFS-подобно, голос +2.5 дБ
  const MUS = 3.1, VOX = 1.34;
  const out = new Float32Array(n * 2);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / (SR * 1.2), (n - i) / (SR * 1.6));
    const l = (ML[i] * MUS * smooth[i] + VL[i] * VOX) * fade;
    const r = (MR2[i] * MUS * smooth[i] + VR[i] * VOX) * fade;
    out[i * 2] = l; out[i * 2 + 1] = r;
    const a = Math.max(Math.abs(l), Math.abs(r)); if (a > peak) peak = a;
  }
  // нормализация до −0.7 dBFS с мягким ограничителем
  const g = peak > 0 ? Math.min(12, .92 / peak) : 1;
  const soft = x => { const y = x * g; return Math.abs(y) <= .8 ? y : Math.sign(y) * (.8 + .2 * Math.tanh((Math.abs(y) - .8) / .2)); };
  const clip = new Float32Array(n * 2);
  let fp = 0;
  for (let i = 0; i < out.length; i++) { const y = soft(out[i]); clip[i] = y; const a = Math.abs(y); if (a > fp) fp = a; }
  console.log('звук: усиление ×' + g.toFixed(2) + ' · пик после мастеринга ' + (20 * Math.log10(fp)).toFixed(1) + ' dBFS');
  const wav = Buffer.alloc(44 + clip.length * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + clip.length * 2, 4); wav.write('WAVE', 8); wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(clip.length * 2, 40);
  for (let i = 0; i < clip.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, clip[i])) * 32767), 44 + i * 2);
  const outPath = path.join('/tmp', 'body51-score.wav');
  fs.writeFileSync(outPath, wav);
  console.log('звук:', outPath, (wav.length / 1048576).toFixed(1) + ' МБ');
  return outPath;
}
const audioPath = process.env.BODY51_AUDIO || renderMusic();

// ---------- видео ----------
const range = arg('range', null);
const [t0, t1] = range ? range.split(':').map(Number) : [0, TOTAL];
const outMp4 = process.env.BODY51_OUT || path.join(film, 'body51.mp4');
const args = [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', 'pipe:0',
  '-ss', String(t0), '-i', audioPath, '-map', '0:v:0', '-map', '1:a:0',
  '-t', String(t1 - t0),
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', CRF, '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outMp4,
];
const proc = spawn(ffmpeg, args, { stdio: ['pipe', 'ignore', 'inherit'] });
const frames = Math.floor((t1 - t0) * FPS);
let i = 0;
const started = Date.now();
for (let f = 0; f < frames; f++) {
  filmApi.frame(t0 + f / FPS);
  const jpg = cv.toBuffer('image/jpeg', 92);
  if (!proc.stdin.write(jpg)) await new Promise(r => proc.stdin.once('drain', r));
  if (++i % 240 === 0) {
    const el = (Date.now() - started) / 1000, rest = el / i * (frames - i);
    process.stdout.write(`\rкадр ${i}/${frames} · осталось ~${Math.ceil(rest / 60)} мин   `);
  }
}
proc.stdin.end();
await new Promise(r => proc.on('close', r));
console.log('\nготово:', outMp4, (fs.statSync(outMp4).size / 1048576).toFixed(1) + ' МБ');
