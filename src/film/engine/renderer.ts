import { FilmSpec, FrameContext } from '../types';
import { seededRng } from './rng';
import { drawShot } from './scenes';
import { FilmAudio } from './audio';

export class FilmRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  film: FilmSpec;
  audio: FilmAudio;
  width: number;
  height: number;
  fps: number;
  duration: number;
  currentTime = 0;
  isPlaying = false;
  private raf = 0;
  private lastFrame = 0;
  private onTime?: (t: number) => void;
  private onShotChange?: (idx: number) => void;
  private lastShotIdx = -1;
  private shotRngs: (() => number)[] = [];

  constructor(canvas: HTMLCanvasElement, film: FilmSpec, onTime?: (t: number) => void, onShotChange?: (idx: number) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d ctx fail');
    this.ctx = ctx;
    this.film = film;
    this.width = film.width;
    this.height = film.height;
    this.fps = film.fps;
    this.duration = film.duration;
    this.audio = new FilmAudio(film.bpm);
    this.onTime = onTime;
    this.onShotChange = onShotChange;

    canvas.width = this.width;
    canvas.height = this.height;

    this.shotRngs = film.shots.map((s) => seededRng(s.seed));
  }

  setFilm(film: FilmSpec) {
    this.film = film;
    this.width = film.width;
    this.height = film.height;
    this.duration = film.duration;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.audio = new FilmAudio(film.bpm);
    this.shotRngs = film.shots.map((s) => seededRng(s.seed));
    this.currentTime = 0;
    this.lastShotIdx = -1;
    this.renderFrame(0);
  }

  private getShotAt(t: number) {
    let acc = 0;
    for (let i = 0; i < this.film.shots.length; i++) {
      const s = this.film.shots[i];
      if (t >= acc && t < acc + s.duration) {
        return { shot: s, index: i, shotTime: t - acc, progress: (t - acc) / s.duration, start: acc };
      }
      acc += s.duration;
    }
    const last = this.film.shots[this.film.shots.length - 1];
    return { shot: last, index: this.film.shots.length - 1, shotTime: last.duration, progress: 1, start: acc - last.duration };
  }

  renderFrame(t: number) {
    const { shot, index, shotTime, progress } = this.getShotAt(t);
    // reset rng per shot deterministically based on frame
    const baseRng = this.shotRngs[index];
    // create frame rng that is deterministic per frame: seed + tick
    const tick = Math.floor(t * this.fps);
    const frameRng = seededRng(shot.seed * 1000 + tick);

    const ctx: FrameContext = {
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      time: t,
      shotTime,
      shotProgress: progress,
      shotIndex: index,
      shot,
      film: this.film,
      globalProgress: t / this.duration,
      rng: frameRng,
      tick,
    };

    drawShot(ctx);

    // subtle letterbox
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.08)';
    this.ctx.fillRect(0, 0, this.width, 18);
    this.ctx.fillRect(0, this.height - 18, this.width, 18);
    this.ctx.restore();

    if (index !== this.lastShotIdx) {
      this.lastShotIdx = index;
      this.onShotChange?.(index);
    }
    this.onTime?.(t);
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.audio.ensure();
    this.audio.playFilm(this.duration, (time) => {
      const { shot } = this.getShotAt(time);
      return shot.intensity;
    });
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      if (!this.isPlaying) return;
      const dt = (now - this.lastFrame) / 1000;
      this.lastFrame = now;
      this.currentTime += dt;
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.renderFrame(this.currentTime);
        this.pause();
        return;
      }
      this.renderFrame(this.currentTime);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.raf);
    this.audio.stop();
  }

  seek(t: number) {
    this.currentTime = Math.max(0, Math.min(this.duration, t));
    this.renderFrame(this.currentTime);
  }

  setMuted(m: boolean) {
    this.audio.setMuted(m);
  }

  dispose() {
    this.pause();
    this.audio.dispose();
  }

  // export single html self-contained (like procedural-film)
  exportSelfContainedHTML(): string {
    // this would need to inline the film spec and renderer code
    // For now return a placeholder that contains current canvas as image? 
    // We'll implement simple export that saves canvas as data URL player
    const dataUrl = this.canvas.toDataURL('image/png');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${this.film.title}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${dataUrl}" style="max-width:100vw;max-height:100vh;object-fit:contain"><p style="color:#fff;position:absolute;bottom:20px;font-family:monospace">${this.film.title} - procedural film, 0 assets</p></body></html>`;
  }

  // MediaRecorder export
  async exportWebM(onProgress?: (p: number) => void): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = this.canvas.captureStream(this.fps);
      // try to get audio stream from audio ctx? For simplicity video only, we'll mix later
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 4000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      recorder.onerror = (e) => reject(e);

      recorder.start(100);
      let t = 0;
      const dt = 1 / this.fps;
      const renderNext = () => {
        if (t >= this.duration) {
          recorder.stop();
          return;
        }
        this.renderFrame(t);
        onProgress?.(t / this.duration);
        t += dt;
        // yield to allow recorder to capture
        setTimeout(renderNext, 1000 / this.fps / 2);
      };
      renderNext();
    });
  }
}
