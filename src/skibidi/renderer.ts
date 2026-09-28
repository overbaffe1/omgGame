import { SkibidiType, getRandomCaption } from './types';
import { drawBathroomTiles, drawOhioCity, drawToiletBase, drawHead, drawTitan, drawGlitch, drawCaption } from './draw';

export class SkibidiRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 1080;
  height = 1920;
  time = 0;
  currentType: SkibidiType;
  caption = '';
  captionTime = 0;
  private raf = 0;
  private playing = false;
  private last = 0;
  private seed = 1;
  private beat = 0;
  bpm = 140;
  private glitch = 0;
  private shake = 0;
  private smoothMouth = 0;
  private onTime?: (t: number) => void;

  constructor(canvas: HTMLCanvasElement, type: SkibidiType, onTime?: (t: number) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    if (!ctx) throw new Error('ctx');
    this.ctx = ctx;
    // HQ settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    this.currentType = type;
    this.width = 1080;
    this.height = 1920;
    canvas.width = this.width;
    canvas.height = this.height;
    this.onTime = onTime;
    this.caption = getRandomCaption(type.name);
    this.renderFrame(0);
  }

  setType(type: SkibidiType) {
    this.currentType = type;
    this.seed = Math.floor(Math.random() * 100000);
    this.caption = getRandomCaption(type.name);
    this.captionTime = 0;
    this.smoothMouth = 0;
    this.renderFrame(this.time);
  }

  private getMouthOpen(t: number): number {
    // Musical mouth sync to 140bpm, smooth envelope
    const beatDur = 60 / this.bpm;
    const beat = (t / (beatDur / 2)) % 16;
    // pattern: brr(0) - ski(2) - bi(3) - dop(4,5) - yes(6,7)
    let target = 0.12;
    const b = Math.floor(beat);
    const sub = beat - b;
    if (b === 0) target = sub < 0.5 ? 0.9 : 0.3; // brr
    else if (b === 2) target = 0.6; // ski
    else if (b === 3) target = 0.7;
    else if (b === 4 || b === 5) target = 0.85; // dop dop
    else if (b === 6 || b === 7) target = 1.0; // yes yes wide
    else if (b === 8) target = 0.9;
    else if (b === 10) target = 0.6;
    else if (b === 12) target = 0.8;
    else if (b === 14) target = 0.95;

    // smooth
    const diff = target - this.smoothMouth;
    this.smoothMouth += diff * 0.35; // lerp
    return this.smoothMouth;
  }

  renderFrame(t: number) {
    this.time = t;
    const { ctx, width, height, currentType, seed } = this;
    const beatDur = 60 / this.bpm;
    const beat = (t / (beatDur / 2)) % 16;
    this.beat = beat;
    const isKick = beat % 4 < 0.18;
    const mouthOpen = this.getMouthOpen(t);

    // --- BACKGROUND (deterministic, not random) ---
    // Choose background based on category, not random
    const useCity = currentType.category === 'astro' || currentType.category === 'titan' || currentType.category === 'zombie';
    if (useCity) {
      drawOhioCity(ctx, width, height, t, seed);
    } else {
      drawBathroomTiles(ctx, width, height, t, seed);
    }

    // --- CAMERA (smooth, not jittery) ---
    ctx.save();
    // subtle shake only on strong kick, decaying fast
    if (isKick && mouthOpen > 0.7) {
      this.shake = Math.min(this.shake + 2.5, 5);
    }
    this.shake *= 0.88;
    if (this.shake > 0.05) {
      // smooth perlin-like shake, not pure random
      const sx = Math.sin(t * 47) * this.shake * 0.5;
      const sy = Math.cos(t * 53) * this.shake * 0.5;
      ctx.translate(sx, sy);
    }

    // subtle zoom pulse on kick, smooth
    const zoom = 1 + (isKick ? 0.012 : 0) + Math.sin(t * 1.2) * 0.006;
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // --- CHARACTER ---
    const cx = width / 2;
    const cy = height * 0.58;

    if (currentType.isTitan) {
      const s = currentType.id === 'astro-mothership' ? 2.8 : currentType.id === 'astro-carrier' ? 2.2 : 1.65;
      drawTitan(ctx, cx, cy, s, currentType, t);
    } else {
      const toiletScale = currentType.id === 'astro-mothership' ? 4.2 : currentType.id === 'astro-carrier' ? 3.0 : currentType.id === 'large' ? 2.15 : 1.85;
      // toilet slightly bobs with beat
      const toiletBob = Math.sin(t * 4) * 1.2 + (isKick ? -1 : 0);
      drawToiletBase(ctx, cx, cy + 40 + toiletBob, toiletScale, currentType, t, seed);
      // head with stretch
      drawHead(ctx, cx, cy - 26 + toiletBob * 0.5, toiletScale * 0.96, currentType, t, mouthOpen, seed + 1);
    }

    ctx.restore();

    // --- SUBTLE GLITCH ONLY ON BIG MOMENTS ---
    if (isKick && mouthOpen > 0.85 && Math.random() > 0.65) {
      this.glitch = 0.65;
    }
    this.glitch *= 0.92;
    if (this.glitch > 0.05) {
      drawGlitch(ctx, width, height, t, this.glitch);
    }

    // --- CAPTION (stable, changes every 3.5s) ---
    this.captionTime += 0.016;
    if (this.captionTime > 3.5) {
      this.caption = getRandomCaption(currentType.name);
      this.captionTime = 0;
    }
    drawCaption(ctx, this.caption, width, height, t, seed);

    // --- HQ UI OVERLAY ---
    // top bar with blur imitation
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, width, 88);
    // subtle top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, width, 1);

    ctx.fillStyle = '#fff';
    ctx.font = '900 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const title = `${currentType.emoji} ${currentType.name.toUpperCase()}`;
    ctx.fillText(title, 24, 40);

    ctx.font = '700 15px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(`${currentType.category.toUpperCase()} • ${currentType.rarity.toUpperCase()} • POWER ${currentType.power}`, 24, 64);

    // power bar HQ
    const barX = width - 224;
    const barW = 200;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(barX, 24, barW, 14, 7);
    ctx.fill();
    const fillW = (currentType.power / 1000) * barW;
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, currentType.accent);
    barGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, 24, fillW, 14, 7);
    ctx.fill();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(barX, 24, fillW, 4, 7);
    ctx.fill();
    ctx.restore();

    // bottom watermark HQ
    ctx.save();
    const botGrad = ctx.createLinearGradient(0, height - 70, 0, height);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height - 70, width, 70);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SKIBIDI FACTORY • 100% CANVAS • NO ASSETS • HQ RENDER', width / 2, height - 20);
    ctx.restore();

    // HQ border with inner glow
    ctx.save();
    ctx.strokeStyle = currentType.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.restore();

    // subtle vignette
    const vig = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    this.onTime?.(t);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.playing) return;
      const dt = Math.min((now - this.last) / 1000, 0.033);
      this.last = now;
      this.time += dt;
      this.renderFrame(this.time);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.pause();
  }

  exportWebM(onProgress?: (p: number) => void): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = this.canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      recorder.onerror = e => reject(e);
      recorder.start(100);
      let t = 0;
      const dur = 8;
      const step = () => {
        if (t >= dur) { recorder.stop(); return; }
        this.renderFrame(t);
        onProgress?.(t / dur);
        t += 1 / 30;
        setTimeout(step, 1000 / 30 / 2);
      };
      step();
    });
  }
}
