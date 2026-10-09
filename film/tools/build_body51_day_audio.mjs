#!/usr/bin/env node
// Original score and foley, entirely procedural. The narration is never ducked;
// music and Foley have independent buses, so a comic music stop never cuts a word.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {dayDir, timeline, decode, SR, run, wavFile} from './body51_day_common.mjs';

const data = timeline();
const n = Math.round(data.total * SR);
const voice = new Float32Array(n), bed = new Float32Array(n), foley = new Float32Array(n), duck = new Float32Array(n).fill(1);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const hz = m => 440 * 2 ** ((m - 69) / 12);
let seed = 51051, bus = bed;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
function add(at, duration, sample, buffer = bus) {
  const a = Math.round(at * SR), len = Math.round(duration * SR);
  for (let i = 0; i < len && a + i < buffer.length; i++) if (a + i >= 0) buffer[a + i] += sample(i / SR, i / len);
}
function pluck(at, midi, amp = .065, duration = .55) {
  const f = hz(midi);
  add(at, duration, (t, u) => {
    const env = Math.min(1, t * 300) * Math.exp(-t * 9) * (1 - u);
    return amp * env * (Math.sin(2 * Math.PI * f * t) + .24 * Math.sin(2 * Math.PI * 2 * f * t) + .08 * Math.sin(2 * Math.PI * 3 * f * t));
  });
}
function knock(at, amp = .045) {
  add(at, .1, t => amp * Math.exp(-t * 47) * (Math.sin(t * 2 * Math.PI * 263) + noise() * .48));
}
function bell(at, midi, amp = .055, duration = .65) {
  const f = hz(midi);
  add(at, duration, (t, u) => amp * Math.min(1, t * 500) * Math.exp(-t * 5) * (1 - u) * (Math.sin(t * 2 * Math.PI * f) + .22 * Math.sin(t * 2 * Math.PI * f * 2.01)));
}
function boing(at, amp = .065) {
  add(at, .5, (t, u) => amp * Math.sin(2 * Math.PI * (104 * t + 22 * Math.sin(t * 18) / 18)) * Math.exp(-t * 7) * Math.min(1, t * 240) * (1 - u));
}
function cue(s, i, shift = 0) { return s.start + s.captions[i].start + shift; }
function event(s, name) {
  if (!Number.isFinite(s.events?.[name])) throw new Error(`Missing audio event ${s.id}/${name}`);
  return s.start + s.events[name];
}
function musicRest(at, duration, floor = 0) {
  const a = Math.max(0, Math.round(at * SR)), b = Math.min(n, Math.round((at + duration) * SR));
  for (let i = a; i < b; i++) {
    const edge = clamp(Math.min((i-a)/(SR*.024), (b-i)/(SR*.04)));
    bed[i] *= 1 - (1-floor) * edge;
  }
}


// Small pizzicato ensemble, D / Bm / G / A. Plenty of negative space for jokes.
const beat = 60 / 104;
const chords = [[50, 62, 66, 69], [47, 62, 66, 71], [43, 62, 67, 71], [45, 61, 64, 69]];
for (let b = 0; b * beat < data.total; b++) {
  const at = b * beat, chord = chords[Math.floor(b / 8) % chords.length];
  if (b % 2 === 0) pluck(at, chord[0], .066, .61);
  if (b % 4 === 1 || b % 4 === 3) pluck(at + .035, chord[1 + (Math.floor(b / 2) % 3)], .055, .5);
  if (b % 8 === 6) pluck(at + beat / 2, chord[3] + 12, .024, .37);
  if (b % 2 === 1) add(at, .08, t => noise() * .012 * Math.exp(-t * 64));
  if (b % 4 === 0) add(at, .18, t => .035 * Math.sin(2 * Math.PI * (62 * t + 22 * (1 - Math.exp(-t * 28)) / 28)) * Math.exp(-t * 23));
}
// Scene Foley is kept separate from the score. Narration always stays intact.
bus = foley;
for (const s of data.scenes) {
  knock(s.start + .035, .035);
  const pcm = decode(path.join(dayDir, 'voices', s.voice + '.mp3'));
  const first = Math.round(s.trimIn * SR), last = Math.min(pcm.length, Math.round(s.trimOut * SR));
  const target = Math.round((s.start + s.lead) * SR);
  let power = 0, peak = 0, count = 0;
  for (let i = first; i < last; i++) { if (Math.abs(pcm[i]) > .006) { power += pcm[i] ** 2; count++; } peak = Math.max(peak, Math.abs(pcm[i])); }
  const gain = Math.min(1.8, .17 / Math.sqrt(power / Math.max(1, count)), .79 / Math.max(.001, peak));
  for (let i = first; i < last; i++) if (target + i - first < n) {
    // Five-millisecond ramps avoid edits clicking without trimming consonants.
    const ramp = Math.min(1, (i - first) / (SR * .005), (last - i - 1) / (SR * .005));
    voice[target + i - first] += pcm[i] * gain * Math.max(0, ramp);
  }
  const a = Math.max(0, target - Math.round(.12 * SR)), b = Math.min(n, target + last - first + Math.round(.15 * SR));
  for (let i = a; i < b; i++) duck[i] = .42;
  console.log(`${s.voice} at ${(s.start + s.lead).toFixed(3)}s · gain ${gain.toFixed(3)} · trim ${s.trimIn}–${s.trimOut}`);
  if (s.id === 'wake') {
    bell(.45, 86, .035, .22); bell(.71, 83, .035, .22); bell(.97, 86, .026, .22);
    boing(cue(s, 1), .035);
    const at = event(s, 'veto'); musicRest(at - .16, .77); knock(at, .075); knock(at + .045, .04);
  }
  if (s.id === 'service' || s.id === 'finale') {
    const start = cue(s, s.id === 'service' ? 0 : 1, .5);
    for (let j = 0; j < 12; j++) knock(start + j * .105, .035 + (j % 3) * .008);
    if (s.id === 'service') {
      const f = cue(s, 2, .1); let lp = 0;
      add(f, 3, (t, u) => { lp += .08 * (noise() - lp); return lp * .05 * Math.min(1, t * 5) * Math.min(1, (1 - u) * 10); });
      bell(event(s, 'demand'), 86, .046, .34); bell(event(s, 'demand') + .12, 86, .035, .28);
    }
  }
  if (s.id === 'stream') {
    knock(event(s, 'mute'), .075);
    musicRest(event(s, 'mute') - .025, .46);
    musicRest(event(s, 'comment') - .07, .4);
  }
  if (s.id === 'break') { bell(cue(s, 1, -.35), 81, .052, .23); bell(cue(s, 1, -.15), 86, .045, .3); boing(cue(s, 1, .2), .09); musicRest(event(s, 'freeze'), .46); }
  if (s.id === 'printers') {
    const a = Math.round(event(s, 'idle') * SR), b = Math.round((s.start + s.duration) * SR);
    for (let i = a; i < Math.min(n, b); i++) bed[i] *= .16;
    knock(cue(s, 2, .6), .035);
  }
  if (s.id === 'sword') { bell(cue(s, 0, .3), 81, .07); bell(cue(s, 0, .45), 86, .06); knock(cue(s, 1, .2), .13); knock(cue(s, 2, .2), .13); boing(cue(s, 3, .1), .04); knock(event(s, 'throne') + .5, .04); }
  if (s.id === 'hellfarmer') {
    musicRest(event(s, 'camera') - .06, .48);
    knock(event(s, 'camera'), .045); knock(event(s, 'camera') + .055, .035);
    for (let at = s.start + .36 / .69; at < s.start + s.duration - .4; at += 1 / .69) {
      knock(at, .052); pluck(at + .13, 81, .028, .18);
    }
  }
  if (s.id === 'inspector') {
    for (let j = 0; j < 4; j++) pluck(cue(s, 1, .65 + j * .75), 74 + j * 2, .028, .22);
    knock(cue(s, 2, .15), .055); bell(cue(s, 2, .24), 86, .035, .38);
  }
  if (s.id === 'meridian') {
    for (let j = 0; j < 4; j++) knock(cue(s, 2, .3 + j * .23), .025);
    const boss = event(s, 'boss');
    musicRest(boss - .12, .83);
    for (const m of [38, 45, 50]) pluck(boss, m, .033, .65);
    knock(boss, .055);
  }
  if (s.id === 'night') {
    for (let j = 0; j < 9; j++) knock(cue(s, 3) + j * .135, j % 2 ? .023 : .037);
    for (const i of [1, 2, 4]) pluck(cue(s, i), 74, .065, .28);
  }
  if (s.id === 'finale') {
    // The callback lands dry. A short, unpitched stamp is the only effect;
    // no boing, cut-off word or sustained note can sound like an extra syllable.
    const from = cue(s, 3, -.08), to = s.start + s.lead + s.speech;
    musicRest(from, to + .05 - from);
    knock(event(s, 'veto'), .06);
    [74, 78, 81].forEach((m, i) => bell(to + .15 + i * .14, m, .04, .7));
  }
}
const mixed = new Float32Array(n);
let envelope = 1;
for (let i = 0; i < n; i++) {
  envelope += (duck[i] - envelope) * (duck[i] < envelope ? .002 : .00015);
  const fade = Math.min(1, i / (SR * .08), (n - i) / (SR * .65));
  mixed[i] = (voice[i] + (bed[i] + foley[i]) * envelope) * fade;
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'body51-day-audio-'));
try {
  const raw = path.join(tmp, 'mix.wav'); wavFile(raw, mixed);
  const firstPass = run(['-hide_banner', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'});
  const match = firstPass.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error('loudnorm did not return measurements');
  const measured = JSON.parse(match[0]);
  const filter = `loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
  const output = path.join(dayDir, data.audio);
  run(['-y', '-v', 'error', '-i', raw, '-af', filter, '-ar', String(SR), '-ac', '2', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);
  fs.writeFileSync(path.join(dayDir, 'audio-report.json'), JSON.stringify({targetLUFS: -16, truePeakCeiling: -1.5, input: measured, version: data.version, events: data.scenes.flatMap(s => Object.entries(s.events || {}).map(([id, at]) => ({scene:s.id, id, at: +(s.start+at).toFixed(5)}))), note: 'Narration, music and Foley are separate. Comic music rests preserve speech and impact sounds. Ducking never affects narration.'}, null, 2) + '\n');
  console.log(`Soundtrack → ${output} (${data.total.toFixed(2)}s)`);
} finally { fs.rmSync(tmp, {recursive: true, force: true}); }
