#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {dayDir, filmDir, timeline, drawing, requireDeps, ffmpeg, decode, SR} from './body51_day_common.mjs';

const data = timeline();
const script = JSON.parse(fs.readFileSync(path.join(dayDir, 'script.json'), 'utf8'));
assert.equal(data.version, script.version, 'Rebuild the timeline after a script change');
assert.equal(data.scenes.length, script.scenes.length);
assert.deepEqual(data.scenes.map(s => s.voice), script.scenes.map(s => s.voice));
const [minDuration, maxDuration] = data.durationRange || [40, 80];
assert(data.total >= minDuration && data.total <= maxDuration, 'Requested duration range');
if (data.version !== 'day-1') {
  for (const id of ['hellfarmer', 'inspector', 'meridian']) assert(data.scenes.some(s => s.id === id), `Missing game ${id}`);
  assert.equal(data.scenes.at(-1).voice, script.scenes.at(-1).voice, 'The current finale take must be used');
  assert(!data.scenes.some(s => s.voice === 'd08'));
  assert.equal(data.format.fps, 60);
}
if (['day-5','day-6'].includes(data.version)) {
  assert.equal(data.scenes.length,10);
  assert(!data.scenes.some(s=>s.id==='printers'||/принтер/i.test(s.text)||/printers/i.test(s.voice)),'Removed subject returned');
  const game=data.scenes.find(s=>s.id==='hellfarmer');
  assert(!/автобой|всё делает сам|игра стримит|сам бьёт|сам собирает/i.test(game.text),'Old Hellfarmer premise returned');
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
  if (s.startFrame !== undefined) {
    assert.equal(s.endFrame - s.startFrame, s.frames);
    assert.equal(Math.round(s.start * data.format.fps), s.startFrame);
    for (const [name, at] of Object.entries(s.events || {})) assert(at >= 0 && at < s.duration, `${s.id}: bad event ${name}`);
  }
  cursor += s.duration;
}
assert(Math.abs(cursor - data.total) < .0001);
const {canvas, movie} = drawing(data, .25);
const frames = Math.round(data.total * data.format.fps);
let assets = 0, texts = 0;
let lastBedPose = null;
const actionBounds = data.presentation?.actionBounds || {left:64,top:449,right:1016,bottom:1459};
const forbidden = /автобой|принтер|@body51|за\s+кадром|по\s+стримам|#\d{3}|\b\d{2}\s*\/\s*\d{2}\b|9:16|Собирательный день/i;
for (let frame = 0; frame < frames; frame++) {
  const report = movie.draw(frame / data.format.fps);
  if (data.presentation?.cleanFrame) {
    for (const text of report.drawnText || []) assert(!forbidden.test(text), `Forbidden overlay: ${text}`);
  }
  const pose = report.scene === 'wake' ? report.action?.bedPose : null;
  if (pose && ['day-4','day-5','day-6'].includes(data.version)) {
    if (frame < data.format.fps) {
      assert.equal(pose.phase, 'lying');
      assert(Math.abs(pose.angle + Math.PI/2) < .001, 'Sleeper must be horizontal');
      assert(pose.head[0] > 220 && pose.head[0] < 450 && pose.head[1] > 990 && pose.head[1] < 1120, 'Head must rest on the pillow');
    }
    if (pose.release === 0) assert(Math.hypot(pose.rightHand[0]-pose.grip[0],pose.rightHand[1]-pose.grip[1]) < .01,'Blanket must follow the hand');
    if (pose.stand > .999) for (const foot of pose.feet) assert(Math.abs(foot[1]-pose.floor) < .01,'Feet must reach the slippers');
    if (pose.catSurfaceY !== null) assert(Math.abs(pose.catFoot[1]-pose.catSurfaceY)<.01,'Cat floating above the moving blanket');
    if(lastBedPose) {
      assert(pose.blanketLeft+.0001 >= lastBedPose.blanketLeft,'Blanket folded backwards');
      for(let i=0;i<2;i++) assert(Math.hypot(pose.feet[i][0]-lastBedPose.feet[i][0],pose.feet[i][1]-lastBedPose.feet[i][1]) < 25,'Foot teleported');
    }
    lastBedPose=pose;
  }
  for (const b of report.bounds) {
    const portraitCrop=report.shot?.crop?.includes(b.name);
    // Only the lower figure may leave a designed portrait; the face, cat and
    // visible palms have independent all-frame guards below. Wide shots remain
    // fully bounded. This is not a blanket exemption for zoomed images.
    assert(b.x >= actionBounds.left && b.right <= actionBounds.right && b.y >= actionBounds.top && (portraitCrop || b.bottom <= actionBounds.bottom),
      `frame ${frame} / ${report.scene} / ${report.shot?.name}: ${b.name} outside action area: ${JSON.stringify(b)}`);
    assets++;
  }
  if(data.version==='day-6') {
    for(const name of report.shot.required) {
      const found=report.focusBoxes.filter(b=>b.name===name);
      assert(found.length>0,`Missing required close-up subject: ${name}`);
      for(const b of found) assert(b.x>=32&&b.right<=1048&&b.y>=88&&b.bottom<=1555,`Cropped close-up subject ${name}: ${JSON.stringify(b)}`);
    }
  }
  for (const b of report.textBoxes) {
    assert(b.x >= 56 && b.x + b.w <= 1024 && b.y >= 60 && b.y + b.h <= 1840,
      `frame ${frame} / ${report.scene}: text overflow: ${JSON.stringify(b)}`);
    texts++;
  }
}
for (const s of data.scenes) {
  if (s.startFrame !== undefined) {
    assert.equal(movie.draw(s.startFrame / data.format.fps).scene, s.id, `Late scene cut: ${s.id}`);
    assert.equal(movie.draw((s.endFrame - 1) / data.format.fps).scene, s.id, `Early scene cut: ${s.id}`);
  }
}
if (['day-5','day-6'].includes(data.version)) {
  const s=data.scenes[0],ev=s.events;
  const at=t=>movie.draw(s.start+t).action.bedPose;
  for(const [time,phase] of [[ev.swat-.03,'waiting'],[ev.swat+.12,'outbound'],[(ev.pillow+ev.rebound)/2,'pillow'],[(ev.rebound+ev.catch)/2,'returning'],[ev.catch+.4,'caught']]) assert.equal(at(time).catPhase,phase);
  const hit=at(ev.swat);
  assert(Math.hypot(hit.rightHand[0]-hit.contact[0],hit.rightHand[1]-hit.contact[1])<.001,'Launch is not tied to the hand');
  assert(at(ev.swat+.12).rightHand[0]<hit.rightHand[0]-40,'No follow-through');
  assert(at((ev.pillow+ev.rebound)/2).pillowSquash>.95,'Pillow did not absorb the landing');
  const held=at(ev.catch+.5);assert(Math.hypot(held.catFoot[0]-held.hold[0],held.catFoot[1]-held.hold[1])<.01,'Cat not caught at the chest');
  const f=data.scenes.at(-1),perched=movie.draw(f.start+f.events.catPerch+.5).action.finaleCat;
  assert.equal(perched.phase,'perched');assert(Math.hypot(perched.position[0]-perched.head[0],perched.position[1]-perched.head[1])<.01);
  console.log('✓ Palm contact → pillow squash → rebound → catch; finale perch; no removed scene/premise');
}
if(data.version==='day-6') {
  const wake=data.scenes[0],late=movie.draw(wake.start+wake.events.catch+.6);
  assert.equal(late.shot.name,'wake-reaction');assert(late.shot.zoom>2.9);
  assert(!late.drawnText.some(t=>t==='Кот не удаляется.'),'Punchline must be acted, not a headline');
  const f=data.scenes.at(-1),high=movie.draw(f.start+f.events.catLaunch-.05).action.pullup;
  const low=movie.draw(f.start+f.events.catPerch+.8).action.pullup;
  assert(high.noseY<high.barY,'Pull-up never reaches the bar');
  assert(low.noseY>low.barY+200,'Cat has no visible weight');
  for(const p of [high,low])assert(Math.abs(p.feetY+p.gripY*1.085-p.barY)<.001,'Hands left the bar');
  console.log('✓ Designed close-ups, unobstructed faces/cat/hands, pull-up anticipation and weighted drop');
}
const digest = t => { movie.draw(t); return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'); };
for (const t of data.scenes.map(s => s.start + s.duration * .7)) {
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
