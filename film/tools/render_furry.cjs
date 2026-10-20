#!/usr/bin/env node
/*
 * Рендерит shorts4 «ФУРРИ ЭДИТ — горем фуррифембоев» в MP4.
 *
 *   bash film/tools/body51_deps.sh          # зависимости в /tmp/body51-deps
 *   BODY51_DEPS=/tmp/body51-deps/node_modules node film/tools/render_ded_sup.cjs
 *   ... node film/tools/render_ded_sup.cjs --shots 2,8.5,12,22,24.5,30.2  # раскадровка в .arena/
 *   ... node film/tools/render_ded_sup.cjs --range 8:12                    # кусок для проверки
 *
 * Кадры и партитура — из одного генератора в furry.html (тот же код, что
 * крутится в браузерном плеере). Зависимости: @napi-rs/canvas, @ffmpeg-installer/ffmpeg.
 */
const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');

const requireDeps = createRequire(
  process.env.BODY51_DEPS ? path.join(process.env.BODY51_DEPS, 'noop.cjs') : __filename);
const { createCanvas, loadImage, GlobalFonts } = requireDeps('@napi-rs/canvas');
const ffmpeg = process.env.FFMPEG_BIN || requireDeps('@ffmpeg-installer/ffmpeg').path;

const repo = path.resolve(__dirname, '..', '..');
const fps = Number(process.env.DED_FPS || 30);
const crf = String(process.env.DED_CRF || 17);
const outMp4 = path.join(repo, 'exports', 'furry-ep01.mp4');

// ---- шрифты (те же файлы, что в @font-face браузерной страницы) -------------
GlobalFonts.registerFromPath(path.join(repo, 'media/ded/fonts/DED-Display.ttf'), 'DED Display');
GlobalFonts.registerFromPath(path.join(repo, 'media/ded/fonts/DED-Cond.ttf'), 'DED Cond');
GlobalFonts.registerFromPath(path.join(repo, 'media/ded/fonts/DED-Cond-Medium.ttf'), 'DED Cond Medium');

// ---- генератор кадров из furry.html --------------------------------------
const html = fs.readFileSync(path.join(repo, 'furry.html'), 'utf8');
const match = html.match(/<script>\s*([\s\S]*?)<\/script>/);
if (!match) throw new Error('Не найден встроенный генератор кадров');
const durationMatch = match[1].match(/const TOTAL = ([\d.]+);/);
if (!durationMatch) throw new Error('Не найден хронометраж TOTAL в генераторе');
const TOTAL = Number(durationMatch[1]);

const W = 1920, H = 1080;
const canvas = createCanvas(W, H);
const sandbox = {
  document: {
    getElementById: id => (id === 'c' ? canvas : { style: {}, addEventListener() {} }),
    createElement: () => createCanvas(4, 4),
    head: { appendChild() {} },
    body: {},
  },
  Player: { mount() {} },
  console,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(repo, 'film/fx.js'), 'utf8'), sandbox, { filename: 'fx.js' });
vm.runInContext(match[1], sandbox, { filename: 'furry-inline.js' });

// ---- звук: та же партитура, чистый синтез ----------------------------------
function writeWav(file, { L, R }) {
  const sr = 44100, n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

// ---- аргументы --------------------------------------------------------------
const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i < 0 ? def : argv[i + 1]; };

(async () => {
  const av = await loadImage(path.join(repo, 'media/ded/face.png'));
  const cd = await loadImage(path.join(repo, 'media/ded/card.png'));
  sandbox.setAssets(av, cd);
  sandbox.frame(0); // прогрев FX.init

  // раскадровка
  const shots = arg('shots', null);
  if (shots) {
    const dir = path.join(repo, '.arena');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of shots.split(',').map(Number)) {
      sandbox.frame(t);
      fs.writeFileSync(path.join(dir, `furry-shot-${String(t).replace('.', '_')}.jpg`), canvas.toBuffer('image/jpeg', 88));
    }
    console.log('кадры в .arena/');
    return;
  }

  const range = arg('range', null);
  const t0 = range ? Number(range.split(':')[0]) : 0;
  const t1 = range ? Number(range.split(':')[1]) : TOTAL;
  const wav = path.join(os.tmpdir(), `furry-${Date.now()}.wav`);
  writeWav(wav, sandbox.renderScore(44100));
  console.log('партитура:', wav);

  const out = range
    ? path.join(os.tmpdir(), `furry-range-${t0}-${t1}.mp4`)
    : outMp4;
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const ff = spawn(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 's16le', '-ar', '44100', '-ac', '2', '-i', wav,       // звук первым: -shortest не срежет хвост
    '-framerate', String(fps), '-f', 'image2pipe', '-vcodec', 'png', '-i', 'pipe:0',
    '-map', '1:v', '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    '-t', String(t1 - t0),
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.on('error', e => { console.error(e); process.exit(1); });
  ff.on('close', code => {
    fs.unlinkSync(wav);
    if (code !== 0) process.exit(code);
    console.log('готово:', out);
    if (!range) thumbs().then(() => console.log('обложки готовы'));
  });

  const step = 1 / fps;
  for (let i = Math.round(t0 * fps); i < Math.round(t1 * fps); i++) {
    sandbox.frame(i * step);
    const png = canvas.toBuffer('image/png');
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 2) === 0) console.log(`кадр ${i} (${(i / fps).toFixed(1)} c)`);
  }
  ff.stdin.end();

  async function thumbs() {
    // широкая обложка 16:9: парад по ПСКОВГУ — МИША БУДРИН и кошкодевочки
    sandbox.frame(16.4);
    fs.writeFileSync(path.join(repo, 'exports/furry-thumbnail.jpg'), canvas.toBuffer('image/jpeg', 90));
    fs.writeFileSync(path.join(repo, 'exports/furry-thumb-169.jpg'), canvas.toBuffer('image/jpeg', 90));
    // постер: панчлайн ОТ ДЭДА
    sandbox.frame(30.95);
    fs.writeFileSync(path.join(repo, 'exports/furry-poster.jpg'), canvas.toBuffer('image/jpeg', 90));
  }
})();
