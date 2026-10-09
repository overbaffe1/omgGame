#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {dayDir, filmDir, timeline, drawing, requireDeps, ffmpeg, decode, SR} from './body51_day_common.mjs';

const data = timeline();
assert.equal(data.scenes.length, data.version === 'day-2' ? 11 : 8);
const [minDuration, maxDuration] = data.durationRange || [40, 80];
assert(data.total >= minDuration && data.total <= maxDuration, 'Requested duration range');
if (data.version === 'day-2') {
  for (const id of ['hellfarmer', 'inspector', 'meridian']) assert(data.scenes.some(s => s.id === id), `Missing game ${id}`);
  assert.equal(data.scenes.at(-1).voice, 'd08b', 'The old finale take must not return');
  assert(!data.scenes.some(s => s.voice === 'd08'));
  assert.equal(data.format.fps, 60);
}
let cursor = 0;
for (const s of data.scenes) {
  assert(Math.abs(s.start - cursor) < .00002, `${s.id}: non-contiguous scene`);
  assert(s.sources.length > 0, `${s.id}: sources missing`);
  assert(fs.existsSync(path.join(dayDir, 'voices', s.voice + '.mp3')));
  assert.equal(s.lines.length, s.captions.length);
  s.captions.forEach((c, i) => {
    assert(c.start >= 0 && c.end > c.start && c.end < s.duration, `${s.id}: caption outside scene`);
    if (i) assert(Math.abs(c.start - s.captions[i - 1].end) < .00002);
  });
  assert(s.trimOut > s.trimIn);
  assert(s.lead + s.speech < s.duration, `${s.id}: clipped narration`);
  cursor += s.duration;
}
assert(Math.abs(cursor - data.total) < .0001);
const {canvas, movie} = drawing(data, .25);
const frames = Math.round(data.total * data.format.fps);
let assets = 0, texts = 0;
for (let frame = 0; frame < frames; frame++) {
  const report = movie.draw(frame / data.format.fps);
  for (const b of report.bounds) {
    assert(b.x >= 64 && b.right <= 1016 && b.y >= 449 && b.bottom <= 1459,
      `frame ${frame} / ${report.scene}: ${b.name} outside action area: ${JSON.stringify(b)}`);
    assets++;
  }
  for (const b of report.textBoxes) {
    assert(b.x >= 56 && b.x + b.w <= 1024 && b.y >= 60 && b.y + b.h <= 1840,
      `frame ${frame} / ${report.scene}: text overflow: ${JSON.stringify(b)}`);
    texts++;
  }
}
const digest = t => { movie.draw(t); return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'); };
for (const t of [2, 14, 20, 30, 35, 43, 54, 66]) {
  const a = digest(t); digest(t + .7); digest(data.total - t);
  assert.equal(a, digest(t), `Non-deterministic seek at ${t}`);
}
console.log(`✓ ${frames} frames · ${assets} character/prop bounds · ${texts} text bounds · deterministic seeks`);
console.log(`✓ ${data.scenes.length} scenes, ${data.total.toFixed(2)}s, ${data.scenes.reduce((n, s) => n + s.captions.length, 0)} speech-aligned captions`);

if (process.argv.includes('--mp4')) {
  const idx = process.argv.indexOf('--mp4');
  const file = process.argv[idx + 1] || path.join(filmDir, 'body51-min.mp4');
  let ffprobe;
  try { ffprobe = process.env.FFPROBE_BIN || requireDeps('@ffprobe-installer/ffprobe').path; }
  catch { ffprobe = process.env.FFPROBE_BIN || 'ffprobe'; }
  const result = spawnSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const info = JSON.parse(result.stdout), video = info.streams.find(s => s.codec_type === 'video'), audio = info.streams.find(s => s.codec_type === 'audio');
  assert.equal(video.codec_name, 'h264'); assert.equal(video.width, 1080); assert.equal(video.height, 1920); assert.equal(video.pix_fmt, 'yuv420p');
  assert.equal(video.avg_frame_rate, `${data.format.fps}/1`); assert.equal(Number(video.nb_frames), frames);
  assert.equal(audio.codec_name, 'aac'); assert.equal(audio.channels, 2);
  assert(Math.abs(Number(info.format.duration) - data.total) < .08);
  // Stream-copy mux must preserve the exact, already-normalized soundtrack.
  const finalAudio = decode(file), expected = decode(path.join(dayDir, data.audio));
  const len = Math.min(finalAudio.length, expected.length);
  let aa = 0, bb = 0, ab = 0;
  for (let i = 0; i < len; i++) { aa += finalAudio[i] ** 2; bb += expected[i] ** 2; ab += finalAudio[i] * expected[i]; }
  const correlation = ab / Math.sqrt(aa * bb);
  assert(correlation > .999, `Muxed audio offset or replaced: correlation=${correlation}`);
  console.log(`✓ MP4: ${video.width}×${video.height}, ${video.avg_frame_rate} fps, ${frames} frames, ${info.format.duration}s, stereo AAC`);
  console.log(`✓ Audio matches measured timeline/mix (correlation ${correlation.toFixed(6)})`);
  // Raw clip-vs-film correlations verify all narration placements, not
  // merely agreement between two copies of a potentially wrong mix.
  for (const s of data.scenes) {
    const raw = decode(path.join(dayDir, 'voices', s.voice + '.mp3'));
    const a = Math.round(s.trimIn * SR), b = Math.round(s.trimOut * SR), at = Math.round((s.start + s.lead) * SR);
    let best = {correlation: -1, shift: 0};
    for (let shift = -2205; shift <= 2205; shift += 22) {
      let xy = 0, xx = 0, yy = 0;
      for (let j = 0; j < b - a; j += 16) {
        const x = raw[a + j], y = finalAudio[at + j + shift] || 0;
        xy += x * y; xx += x * x; yy += y * y;
      }
      const c = xy / Math.sqrt(xx * yy);
      if (c > best.correlation) best = {correlation: c, shift};
    }
    // Include exact zero shift; the coarse grid needn't land on it.
    let xy = 0, xx = 0, yy = 0;
    for (let j = 0; j < b - a; j += 16) { const x = raw[a + j], y = finalAudio[at + j] || 0; xy += x * y; xx += x * x; yy += y * y; }
    const zero = xy / Math.sqrt(xx * yy);
    if (zero > best.correlation) best = {correlation: zero, shift: 0};
    assert(best.correlation > .86 && Math.abs(best.shift / SR) < .02, `${s.voice}: narration sync failed ${JSON.stringify(best)}`);
    console.log(`✓ ${s.voice}: shift ${(best.shift / SR).toFixed(4)}s, r=${best.correlation.toFixed(4)}`);
  }
  const volume = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], {encoding: 'utf8'});
  const peak = /max_volume: ([-\d.]+) dB/.exec(volume.stderr);
  assert(peak && Number(peak[1]) <= -.5, 'Final audio peak too hot');
  console.log(`✓ Peak ${peak[1]} dBFS`);
}
