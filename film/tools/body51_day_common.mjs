import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dayDir = path.join(filmDir, 'body51-day');
export const requireDeps = createRequire(process.env.BODY51_DEPS ? path.join(process.env.BODY51_DEPS, 'noop.cjs') : import.meta.url);
export const ffmpeg = process.env.FFMPEG_BIN || requireDeps('@ffmpeg-installer/ffmpeg').path;
export const SR = 44100;
export function run(args, options = {}) {
  const r = spawnSync(ffmpeg, args, {maxBuffer: 256 * 1024 * 1024, ...options});
  if (r.error || r.status !== 0) throw new Error(r.error?.message || `ffmpeg (${r.status}): ${String(r.stderr).slice(-5000)}`);
  return r;
}
export function decode(file) {
  const r = run(['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
export function timeline() { return JSON.parse(fs.readFileSync(path.join(dayDir, 'timeline.json'), 'utf8')); }
export function drawing(data = timeline(), scale = 1) {
  const {createCanvas, GlobalFonts} = requireDeps('@napi-rs/canvas');
  for (const weight of [400, 600, 700, 800]) GlobalFonts.registerFromPath(path.join(dayDir, `fonts/Manrope-${weight}.ttf`), 'Manrope');
  const canvas = createCanvas(Math.round(data.format.width * scale), Math.round(data.format.height * scale));
  const sandbox = {console, Math, BODY51_DAY: data};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(dayDir, 'games.js'), 'utf8'), sandbox, {filename: 'body51-day/games.js'});
  vm.runInContext(fs.readFileSync(path.join(dayDir, 'film.js'), 'utf8'), sandbox, {filename: 'body51-day/film.js'});
  const movie = sandbox.Body51Day.create(canvas, data);
  return {canvas, movie};
}
export function wavFile(file, samples, sampleRate = SR) {
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24); out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, out);
}
