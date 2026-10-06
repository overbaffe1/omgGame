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
import { computeTiming, estimate, toJs } from './body51_timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const film = path.resolve(here, '..');
const script = JSON.parse(readFileSync(path.join(film, 'body51-voices', 'script.json'), 'utf8'));

function ffmpegBin() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  try { return require('@ffmpeg-installer/ffmpeg').path; } catch {}
  return 'ffmpeg';
}
function mp3Duration(file) {
  try {
    const out = execFileSync(ffmpegBin(), ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] }).toString();
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
const timing = computeTiming({ durations, texts });
fs.writeFileSync(path.join(film, 'body51-timing.js'), toJs(timing,
  missing.length ? `оценка по тексту; нет озвучки: ${missing.join(', ')}` : 'длительности из mp3 озвучки'));
const mm = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
console.log('хронометраж:', mm(timing.total));
for (const s of timing.scenes) console.log(` ${s.id.padEnd(9)} ${mm(s.start)} +${s.dur.toFixed(1)}с ${s.narr || '—'}`);
if (missing.length) console.log('нет mp3:', missing.join(', '));
