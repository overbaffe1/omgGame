#!/usr/bin/env node
/*
 * Рендерит кадры из body51/meme-generated.html в MP4.
 * Зависимости: @napi-rs/canvas и ffmpeg с libx264 в PATH.
 * Пример: node body51/tools/render_meme_video.cjs
 * Для нестандартного расположения ffmpeg: FFMPEG_BIN=/path/to/ffmpeg node ...
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createCanvas } = require('@napi-rs/canvas');

const body51 = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(body51, 'meme-generated.html'), 'utf8');
const match = html.match(/<script>\s*([\s\S]*?)<\/script>/);
if (!match) throw new Error('Не найден встроенный генератор кадров');
const durationMatch = match[1].match(/const TOTAL=(\d+);/);
if (!durationMatch) throw new Error('Не найден хронометраж TOTAL в генераторе');
const duration = Number(durationMatch[1]);
const fps = 24;
const canvas = createCanvas(1080, 1920);
const sandbox = {
  document: { getElementById: id => id === 'c' ? canvas : { addEventListener() {} } },
  Player: { mount() {} },
  FX: null,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(match[1] + '\nglobalThis.__drawFrame = frame;', sandbox, { filename: 'meme-generated-inline.js' });

const out = path.join(body51, 'meme-generated.mp4');
const wav = path.join(os.tmpdir(), 'body51-generated-score.wav');
const ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg';
const sampleRate = 44100;
const sampleCount = duration * sampleRate;

// Негромкая оригинальная мелодия: синтезированные ноты, без заимствованной музыки и голоса.
const samples = new Float32Array(sampleCount);
const scale = [60,64,67,71,67,64,62,55,59,62,59,55,57,60,64,67];
function addTone(midi, start, length, amplitude, overtone = .12) {
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  const from = Math.max(0, Math.floor(start * sampleRate));
  const to = Math.min(sampleCount, Math.floor((start + length) * sampleRate));
  for (let i = from; i < to; i++) {
    const age = (i - from) / sampleRate;
    const attack = Math.min(1, age / .035);
    const release = Math.exp(-Math.max(0, age - .035) / Math.max(.22, length * .33));
    const tail = Math.max(0, Math.min(1, (length - age) / .06));
    const phase = 2 * Math.PI * frequency * age;
    samples[i] += amplitude * attack * release * tail * (Math.sin(phase) + overtone * Math.sin(phase * 2));
  }
}
for (let n = 0, t = 0; t < duration - 1; n++, t += 1.25) {
  const note = scale[n % scale.length];
  addTone(note, t, 1.35, n % 4 === 0 ? .038 : .022, .16);
  if (n % 4 === 0) addTone(note - 12, t, 2.2, .025, .07);
  if (n % 8 === 3) addTone(note + 12, t + .55, .68, .011, .2);
}
for (const t of [7,14,39,55,68,94,107,131]) {
  addTone(72, t, .16, .022, .1);
  addTone(79, t + .1, .24, .015, .13);
}
const wavData = Buffer.alloc(44 + sampleCount * 2);
wavData.write('RIFF',0); wavData.writeUInt32LE(36 + sampleCount * 2,4); wavData.write('WAVE',8);
wavData.write('fmt ',12); wavData.writeUInt32LE(16,16); wavData.writeUInt16LE(1,20);
wavData.writeUInt16LE(1,22); wavData.writeUInt32LE(sampleRate,24); wavData.writeUInt32LE(sampleRate * 2,28);
wavData.writeUInt16LE(2,32); wavData.writeUInt16LE(16,34); wavData.write('data',36); wavData.writeUInt32LE(sampleCount * 2,40);
for (let i = 0; i < sampleCount; i++) {
  const fade = Math.min(1, i / (sampleRate * 1.3), (sampleCount - i) / (sampleRate * 1.8));
  const value = Math.max(-1, Math.min(1, samples[i] * fade));
  wavData.writeInt16LE(Math.round(value * 32767),44 + i * 2);
}
fs.writeFileSync(wav,wavData);

const args = [
  '-y','-hide_banner','-loglevel','error',
  '-framerate',String(fps),'-f','image2pipe','-vcodec','png','-i','pipe:0',
  '-i',wav,'-map','0:v:0','-map','1:a:0','-t',String(duration),
  '-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-r',String(fps),
  '-c:a','aac','-b:a','128k','-movflags','+faststart',out,
];
const proc = spawn(ffmpeg,args,{stdio:['pipe','ignore','inherit']});
proc.on('error',err=>{console.error('Не удалось запустить ffmpeg:',err.message);process.exitCode=1});
const totalFrames = duration * fps;
(async()=>{
  for (let i = 0; i < totalFrames; i++) {
    sandbox.__drawFrame(i / fps);
    const png = canvas.toBuffer('image/png');
    if (!proc.stdin.write(png)) await once(proc.stdin,'drain');
    if (i && i % 480 === 0) console.log(`Кадры: ${i}/${totalFrames}`);
  }
  proc.stdin.end();
  const [code] = await once(proc,'close');
  if (code !== 0) throw new Error(`ffmpeg завершился с кодом ${code}`);
  console.log(`Готово: ${out} (${fs.statSync(out).size} bytes)`);
})().catch(err=>{console.error(err);process.exitCode=1;try{proc.kill('SIGTERM')}catch{}});
