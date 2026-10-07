#!/usr/bin/env node
/* check_body51_sync.mjs — проверка, что озвучка в готовом MP4 звучит ровно там,
 * где стоят титры (и нигде не обрезается раньше/позже).
 *
 *   node film/tools/check_body51_sync.mjs                    # сверить film/body51.mp4
 *   node film/tools/check_body51_sync.mjs --mp4 /tmp/x.mp4
 *   node film/tools/check_body51_sync.mjs --tol 0.25         # допуск в секундах
 *
 * Как работает: вырезает из MP4 кусок вокруг ожидаемого места реплики, декодирует
 * в PCM и ищет корреляцией, где на самом деле звучит голос. Печатает расхождение.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(process.env.BODY51_DEPS ? path.join(process.env.BODY51_DEPS, 'noop.cjs') : import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const film = path.resolve(here, '..');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const FF = process.env.FFMPEG_BIN || (() => { try { return require('@ffmpeg-installer/ffmpeg').path; } catch { return 'ffmpeg'; } })();
const SR = 44100;

const CUTS = { minute: { timing: 'body51-timing-min.js', mp4: 'body51-min.mp4' } };
const CUT = arg('cut', null);
if (CUT && !CUTS[CUT]) { console.error('неизвестная нарезка:', CUT); process.exit(1); }
const mp4 = arg('mp4', process.env.BODY51_OUT
  || path.join(film, CUT ? CUTS[CUT].mp4 : 'body51.mp4'));
const tol = parseFloat(arg('tol', '0.30'));
const OFF = parseFloat(arg('offset', '0'));            // сдвиг файла (для кусков --range)
const timingFile = arg('timing', CUT ? CUTS[CUT].timing : 'body51-timing.js');
const timing = JSON.parse(fs.readFileSync(path.join(film, timingFile), 'utf8').replace(/^[^{]*/, '').replace(/;\s*$/, ''));

function pcm(file, ss, dur) {
  const a = [];
  if (ss != null) a.push('-ss', String(ss));
  a.push('-t', String(dur));
  const r = spawnSync(FF, ['-v', 'error', ...a, '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffmpeg не смог декодировать ' + file);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
function bestLag(ref, big, step) {
  const m = Math.max(...ref.map(Math.abs)) || 1;
  const r = ref.map(v => v / m);
  let best = { c: -2, lag: 0 };
  for (let lag = 0; lag < big.length - r.length; lag += step) {
    let d = 0, na = 0, nb = 0;
    for (let i = 0; i < r.length; i += 5) { const a = r[i], b = big[lag + i]; d += a * b; na += a * a; nb += b * b; }
    const c = d / Math.sqrt(na * nb || 1);
    if (c > best.c) best = { c, lag };
  }
  for (let lag = Math.max(0, best.lag - step); lag < best.lag + step; lag += 5) {
    let d = 0, na = 0, nb = 0;
    for (let i = 0; i < r.length; i += 5) { const a = r[i], b = big[lag + i] || 0; d += a * b; na += a * a; nb += b * b; }
    const c = d / Math.sqrt(na * nb || 1);
    if (c > best.c) best = { c, lag };
  }
  return best;
}

// длительность файла, чтобы не искать реплики, которых в нём нет
const durOut = (() => {
  const r = spawnSync(FF, ['-hide_banner', '-i', mp4], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr || '');
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : Infinity;
})();
const checks = [];
for (const s of timing.scenes) {
  // файл рассказчика ставится в start + narrAt, речь внутри него начинается с onset
  if (s.narr) checks.push({ what: s.id + ' / рассказчик', file: path.join(film, 'body51-voices', (s.narrSpec || s.narr) + '.mp3'), at: s.start + s.narrAt });
  if (s.quote && s.quote.id) checks.push({ what: s.id + ' / цитата', file: path.join(film, 'body51-voices', s.quote.id + '.mp3'), at: s.start + s.quote.at });
}

let bad = 0, skipped = 0, ok = 0;
console.log(`сверяю ${mp4} · реплик: ${checks.length} · допуск ±${tol.toFixed(2)} с\n`);
for (const c of checks) {
  if (!fs.existsSync(c.file)) { console.log('  нет файла:', c.file); continue; }
  c.at -= OFF;
  if (c.at < 0 || c.at > durOut - 0.6) { skipped++; continue; }   // реплика вне этого файла
  const spec = spawnSync(FF, ['-hide_banner', '-i', c.file, '-af', 'silencedetect=noise=-36dB:d=0.10', '-f', 'null', '-'], { encoding: 'utf8' });
  const dm = /Duration: (\d+):(\d+):([\d.]+)/.exec(spec.stderr || '');
  const fdur = dm ? (+dm[1]) * 3600 + (+dm[2]) * 60 + parseFloat(dm[3]) : 0;
  if (fdur && c.at + fdur > durOut) { skipped++; continue; }   // реплика не влезает в этот файл целиком
  const starts = [...(spec.stderr || '').matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]);
  const ends = [...(spec.stderr || '').matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
  const onset = (starts[0] != null && starts[0] < 0.02 && ends[0] != null) ? ends[0] : 0;
  const ref = pcm(c.file, onset + 0.15, 2.2);
  if (ref.length < SR) { console.log('  слишком короткая реплика:', c.what); continue; }
  const from = Math.max(0, c.at - 1.2), dur = 2.2 + 3.0;
  const big = pcm(mp4, from, dur);
  const { c: corr, lag } = bestLag(ref, big, 200);
  const found = from + lag / SR - 0.15;
  const off = found - (c.at + onset /* ожидаемое начало речи в mp4 */);
  // решаем по сдвигу; корреляция — только уверенность (музыка и микс её занижают)
  const good = Math.abs(off) <= tol && corr > 0.05;
  if (good) ok++; else bad++;
  const conf = corr > 0.5 ? '' : (corr > 0.2 ? ' (уверенность средняя)' : ' (тихо: музыка глушит)');
  console.log(`  ${good ? '✓' : '✗'} ${c.what.padEnd(22)} ожидалось ${(c.at + onset).toFixed(2)}с, звучит ${found.toFixed(2)}с · сдвиг ${off >= 0 ? '+' : ''}${off.toFixed(2)}с · корреляция ${corr.toFixed(2)}${conf}`);
}
console.log(`\nсверено: ${ok + bad} (вне этого файла: ${skipped})`);
console.log(bad ? `проблемных реплик: ${bad} — правь тайминг или озвучку` : 'всё сходится: титры и голос совпадают');
