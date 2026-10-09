#!/usr/bin/env node
// build_body51_timing.mjs — собрать film/body51-timing.js из script.json.
// Если озвучка уже сгенерирована — берёт точные длительности mp3 (ffmpeg),
// иначе считает по скорости речи (12,7 симв/сек).
//   node film/tools/build_body51_timing.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { computeTiming, estimate, toJs, SCENES } from './body51_timing.mjs';
import { speechSpans, sentences, segmentsFor } from './body51_speech.mjs';

// New minute timeline is isolated from the original full-length film.
if (process.argv.includes('--cut') && process.argv[process.argv.indexOf('--cut') + 1] === 'minute') {
  await import('./build_body51_day.mjs');
  process.exit(0);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const film = path.resolve(here, '..');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
// нарезки: --cut minute → короткая мем-версия
const CUTS = { minute: { script: 'script-minute.json', timing: 'body51-timing-min.js',
  subset: ['cat', 'workshop', 'limits', 'gag', 'wishlist', 'release'],
  lead: 0.5, tail: 0.4, qgap: 0.25, minDur: 6, padEnd: 4.6 } };
const CFG = arg('cut', null) ? (CUTS[arg('cut', null)] || null) : null;
if (arg('cut', null) && !CFG) { console.error('неизвестная нарезка:', arg('cut', null)); process.exit(1); }
const script = JSON.parse(readFileSync(path.join(film, 'body51-voices', CFG ? CFG.script : 'script.json'), 'utf8'));

const require = createRequire(
  process.env.BODY51_DEPS ? path.join(process.env.BODY51_DEPS, 'noop.cjs') : import.meta.url);
function ffmpegBin() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  try { return require('@ffmpeg-installer/ffmpeg').path; } catch {}
  return 'ffmpeg';
}
function mp3Duration(file) {
  try {
    execFileSync(ffmpegBin(), ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
    return null;
  } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(e.stderr?.toString() || '');
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : null;
  }
}

const durations = {}, missing = [], texts = {};
for (const v of script.voices) {
  const mp3 = path.join(film, 'body51-voices', v.id + '.mp3');
  if (fs.existsSync(mp3)) {
    const d = mp3Duration(mp3);
    durations[v.scene] = d ? +d.toFixed(2) : +estimate(v.text).toFixed(2);
  } else {
    missing.push(v.id);
    durations[v.scene] = +estimate(v.text).toFixed(2);
  }
  texts[v.scene] = v.text;
}
// замер пауз в озвучке: окна фраз для титров и точка старта речи (та же логика, что в рендере)
const narrSpecs = {}, quoteSpecs = {};
const voices = {}, narr = {}, narrIds = {};
for (const v of script.voices) { voices[v.id] = v; narr[v.scene] = v.id; narrIds[v.scene] = v.id; }
const quotesByScene = {};
for (const q of script.quotes || []) quotesByScene[q.scene] = q;
for (const sc of SCENES) {
  const v = narr[sc.id] ? voices[narr[sc.id]] : null;
  const nf = v ? path.join(film, 'body51-voices', v.id + '.mp3') : null;
  if (v && fs.existsSync(nf)) {
    const sp = speechSpans(nf, { ffmpeg: ffmpegBin() });
    narrSpecs[sc.id] = Object.assign(sp, { seg: segmentsFor(sp, sentences(v.text)) });
  }
  const q = quotesByScene[sc.id];
  const qf = q ? path.join(film, 'body51-voices', q.id + '.mp3') : null;
  if (q && fs.existsSync(qf)) {
    const sp = speechSpans(qf, { ffmpeg: ffmpegBin() });
    quoteSpecs[sc.id] = Object.assign(sp, { seg: segmentsFor(sp, q.lines && q.lines.length ? q.lines : [q.text]) });
  }
}
const quotes = {}, quoteTexts = {}, quoteLines = {}, quoteWho = {};
for (const q of script.quotes || []) {
  const mp3 = path.join(film, 'body51-voices', q.id + '.mp3');
  quotes[q.scene] = { id: q.id, dur: fs.existsSync(mp3) ? mp3Duration(mp3) : +estimate(q.text).toFixed(2) };
  if (!fs.existsSync(mp3)) console.log('цитата без озвучки (оценка):', q.id);
  quoteTexts[q.scene] = q.text; quoteLines[q.scene] = q.lines; quoteWho[q.scene] = q.who;
}
const timing = computeTiming({ durations, texts, quotes, quoteTexts, quoteLines, quoteWho, narrSpecs, quoteSpecs,
  narrIds, subset: CFG ? CFG.subset : null, lead: CFG ? CFG.lead : undefined, tail: CFG ? CFG.tail : undefined,
  qgap: CFG ? CFG.qgap : undefined, minDur: CFG ? CFG.minDur : undefined, padEnd: CFG ? CFG.padEnd : undefined });
fs.writeFileSync(path.join(film, CFG ? CFG.timing : 'body51-timing.js'), toJs(timing,
  missing.length ? `оценка по тексту; нет озвучки: ${missing.join(', ')}` : 'длительности и паузы из mp3 озвучки',
  CFG ? CFG.timing : 'body51-timing.js'));
const mm = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
console.log('хронометраж:', mm(timing.total));
for (const s of timing.scenes) console.log(` ${s.id.padEnd(9)} ${mm(s.start)} +${s.dur.toFixed(1)}с ${s.narr || '—'}`);
if (missing.length) console.log('нет mp3:', missing.join(', '));
