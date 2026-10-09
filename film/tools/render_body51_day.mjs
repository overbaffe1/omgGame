#!/usr/bin/env node
// New 2D minute film. Workers share one measured timeline, font set and frame
// function. Audio is muxed once; preview ranges never overwrite the release.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {filmDir, dayDir, timeline, drawing, ffmpeg} from './body51_day_common.mjs';

const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf('--' + name); return i < 0 ? fallback : argv[i + 1]; };
const data = timeline(), FPS = data.format.fps;
const range = arg('range', null), out = arg('out', process.env.BODY51_OUT || path.join(filmDir, 'body51-min.mp4'));
const worker = argv.includes('--worker');
let first = Number(arg('first', '0')), end = Number(arg('end', String(Math.round(data.total * FPS))));
if (range) {
  const [a, b] = range.split(':').map(Number);
  if (!(Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b > a && b <= data.total)) throw new Error('Expected --range start:end within the film');
  first = Math.round(a * FPS); end = Math.round(b * FPS);
  if (!argv.includes('--out') && !process.env.BODY51_OUT) throw new Error('A range requires --out /tmp/preview.mp4. The release will not be overwritten.');
}
if (!(Number.isInteger(first) && Number.isInteger(end) && end > first && first >= 0 && end <= Math.round(data.total * FPS))) throw new Error('Invalid frame range');
const shots = arg('shots', null);
if (shots) {
  const {canvas, movie} = drawing(data);
  const dir = arg('shots-dir', path.join(os.tmpdir(), 'body51-day-shots'));
  fs.mkdirSync(dir, {recursive: true});
  const times = shots === 'auto' ? data.scenes.flatMap(s => [s.start + .3, s.start + s.duration * .55, s.start + s.duration - .4]) : shots.split(',').map(Number);
  for (const t of times) {
    if (!Number.isFinite(t) || t < 0 || t > data.total) throw new Error(`Invalid shot time ${t}`);
    const frame = movie.draw(t, argv.includes('--debug'));
    const name = `${t.toFixed(2).padStart(6, '0')}-${frame.scene}.png`;
    fs.writeFileSync(path.join(dir, name), canvas.toBuffer('image/png'));
    console.log(name);
  }
  console.log('Shots →', dir);
} else {
  async function subprocess(command, args, options = {}) {
    const p = spawn(command, args, {stdio: ['ignore', 'inherit', 'inherit'], ...options});
    const [code] = await once(p, 'exit');
    if (code !== 0) throw new Error(`${path.basename(command)} exited ${code}`);
  }
  async function renderChunk(file, a, b) {
    const {canvas, movie} = drawing(data);
    const p = spawn(ffmpeg, ['-y', '-v', 'error', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${data.format.width}x${data.format.height}`, '-framerate', String(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', arg('crf', '17'), '-threads', '1', '-pix_fmt', 'yuv420p', '-frames:v', String(b - a), '-video_track_timescale', String(FPS), '-movflags', '+faststart', file], {stdio: ['pipe', 'inherit', 'inherit']});
    const done = once(p, 'exit');
    // Handle early pipe failure without leaving an unhandled EPIPE.
    p.stdin.on('error', () => {});
    console.log(`2D worker · total ${data.total.toFixed(2)}s · frames [${a}, ${b})`);
    for (let frame = a; frame < b; frame++) {
      movie.draw(frame / FPS);
      const rgba = canvas.data();
      if (!p.stdin.write(rgba)) await once(p.stdin, 'drain');
      if ((frame - a) % 300 === 0) console.log(`  ${frame - a}/${b - a} frames · t=${(frame / FPS).toFixed(2)}`);
    }
    p.stdin.end();
    const [code] = await done;
    if (code !== 0) throw new Error(`video encoder exited ${code}`);
  }
  if (worker) await renderChunk(out, first, end);
  else {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'body51-day-video-'));
    const jobs = Math.min(16, Math.max(1, parseInt(arg('jobs', '2'), 10) || 1));
    try {
      // A new mix is cheap and avoids silently using a stale soundtrack.
      await subprocess(process.execPath, [fileURLToPath(new URL('./build_body51_day_audio.mjs', import.meta.url))]);
      const parts = [], partDurations = [], workers = [];
      for (let j = 0; j < jobs; j++) {
        const a = first + Math.floor((end - first) * j / jobs), b = first + Math.floor((end - first) * (j + 1) / jobs);
        if (b <= a) continue;
        const file = path.join(temp, `part-${j}.mp4`); parts.push(file); partDurations.push((b - a) / FPS);
        workers.push(subprocess(process.execPath, [fileURLToPath(import.meta.url), '--worker', '--first', String(a), '--end', String(b), '--out', file, '--crf', arg('crf', '17')]));
      }
      await Promise.all(workers);
      const list = path.join(temp, 'parts.txt');
      // Do not inherit millisecond-rounded MP4 container durations at joins.
      // Exact frame durations + an integer frame timebase keep CFR truly 60/1.
      fs.writeFileSync(list, parts.map((p, i) => `file '${p.replaceAll("'", "'\\''")}'\nduration ${partDurations[i].toFixed(9)}`).join('\n'));
      const final = path.join(temp, 'final.mp4');
      const audioArgs = first ? ['-ss', String(first / FPS)] : [];
      await subprocess(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audioArgs, '-i', path.join(dayDir, data.audio), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-t', String((end - first) / FPS), '-video_track_timescale', String(FPS), '-movflags', '+faststart', '-metadata', 'title=Один день Артёма', '-metadata', 'comment=Собирательный день по стримам. Новый 2D-мульт; синтетический рассказчик, не голос Артёма.', final]);
      fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
      // The public path changes only after a successful mux, never mid-render.
      fs.copyFileSync(final, out + '.tmp'); fs.renameSync(out + '.tmp', out);
      console.log(`DONE → ${out} · ${((end - first) / FPS).toFixed(2)}s · ${(fs.statSync(out).size / 1048576).toFixed(1)} MiB`);
    } finally { fs.rmSync(temp, {recursive: true, force: true}); }
  }
}
