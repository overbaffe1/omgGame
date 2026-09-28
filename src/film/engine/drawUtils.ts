import { FrameContext } from '../types';
import { noise2D, randRange } from './rng';

export function clearPaper(c: FrameContext, color?: string) {
  const { ctx, width, height, film } = c;
  const bg = color || (c.shot.mode === 'blueprint' ? film.palette.blueprint : c.shot.mode === 'night' ? '#0f1221' : c.shot.mode === 'memory' ? '#f6f0e3' : film.palette.paper);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

export function drawPaperTexture(c: FrameContext, intensity = 1) {
  const { ctx, width, height, rng, shot } = c;
  const isBlue = shot.mode === 'blueprint';
  ctx.save();
  // base grain
  const count = Math.floor((width * height / 10000) * 18 * intensity);
  for (let i = 0; i < count; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const s = rng() * 2.2 + 0.3;
    const alpha = isBlue ? rng() * 0.08 + 0.02 : rng() * 0.06 + 0.01;
    ctx.fillStyle = isBlue ? `rgba(180,210,255,${alpha})` : `rgba(60,40,20,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  // fiber lines
  ctx.strokeStyle = isBlue ? 'rgba(120,160,255,0.04)' : 'rgba(100,70,30,0.03)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 40; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const len = rng() * 120 + 20;
    const ang = rng() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGrid(c: FrameContext) {
  if (c.shot.mode !== 'blueprint') return;
  const { ctx, width, height } = c;
  ctx.save();
  ctx.strokeStyle = 'rgba(120,160,255,0.12)';
  ctx.lineWidth = 0.5;
  const step = 48;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // major grid
  ctx.strokeStyle = 'rgba(120,160,255,0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += step * 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step * 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function wobblyLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  wobble = 2, segments = 12, rng?: () => number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    const w = (rng ? (rng() - 0.5) : (Math.random() - 0.5)) * wobble * Math.sin(t * Math.PI);
    // add noise
    const n = noise2D(x * 0.01, y * 0.01, 1) * wobble * 0.5;
    ctx.lineTo(x + nx * (w + n), y + ny * (w + n));
  }
  ctx.stroke();
}

export function drawInkStroke(
  c: FrameContext,
  points: [number, number][],
  opts: { color?: string; width?: number; wobble?: number; closed?: boolean } = {}
) {
  const { ctx, film, shot, rng } = c;
  const color = opts.color || (shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink);
  const w = opts.width || 2.5;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (points.length < 2) return;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const midX = (prev[0] + cur[0]) / 2;
    const midY = (prev[1] + cur[1]) / 2;
    // wobble control point
    const wx = (rng() - 0.5) * (opts.wobble || 3);
    const wy = (rng() - 0.5) * (opts.wobble || 3);
    ctx.quadraticCurveTo(prev[0] + wx, prev[1] + wy, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  if (opts.closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function hatchArea(
  c: FrameContext,
  x: number, y: number, w: number, h: number,
  angle = -0.3, density = 0.6, color?: string
) {
  const { ctx, film, shot, rng } = c;
  const col = color || (shot.mode === 'blueprint' ? 'rgba(160,200,255,0.35)' : 'rgba(20,15,10,0.12)');
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const step = 8 / density;
  const diag = Math.hypot(w, h) * 1.5;
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let d = -diag; d < diag; d += step) {
    const x1 = cx + Math.cos(angle) * d - Math.sin(angle) * diag;
    const y1 = cy + Math.sin(angle) * d + Math.cos(angle) * diag;
    const x2 = cx + Math.cos(angle) * d + Math.sin(angle) * diag;
    const y2 = cy + Math.sin(angle) * d - Math.cos(angle) * diag;
    const wob = rng() * 2;
    ctx.beginPath();
    ctx.moveTo(x1 + (rng() - 0.5) * wob, y1 + (rng() - 0.5) * wob);
    ctx.lineTo(x2 + (rng() - 0.5) * wob, y2 + (rng() - 0.5) * wob);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTape(c: FrameContext, x: number, y: number, w: number, rot = -0.08) {
  const { ctx, rng } = c;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,240,180,0.55)';
  ctx.strokeStyle = 'rgba(180,160,100,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if ((ctx as any).roundRect) {
    (ctx as any).roundRect(-w / 2, -12, w, 24, 4);
  } else {
    ctx.rect(-w / 2, -12, w, 24);
  }
  ctx.fill();
  ctx.stroke();
  // tape texture
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(-w / 2 + rng() * w, -10 + rng() * 20, 20, 1);
  }
  ctx.restore();
}

export function drawLabel(
  c: FrameContext,
  text: string,
  x: number, y: number,
  opts: { size?: number; mono?: boolean; color?: string } = {}
) {
  const { ctx, film, shot } = c;
  ctx.save();
  ctx.fillStyle = opts.color || (shot.mode === 'blueprint' ? 'rgba(180,210,255,0.9)' : film.palette.ink);
  ctx.font = `${opts.mono ? '500' : '700'} ${opts.size || 14}px ${opts.mono ? '"IBM Plex Mono", monospace' : 'system-ui, sans-serif'}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // subtle ink bleed
  if (shot.mode !== 'blueprint') {
    ctx.shadowColor = film.palette.ink;
    ctx.shadowBlur = 0.3;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function vignette(c: FrameContext, strength = 0.25) {
  const { ctx, width, height, shot } = c;
  const grad = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.9);
  if (shot.mode === 'blueprint') {
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,10,40,${strength})`);
  } else {
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(40,20,10,${strength * 0.6})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function filmGrain(c: FrameContext, amount = 0.04) {
  const { ctx, width, height, rng } = c;
  ctx.save();
  ctx.globalAlpha = amount;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * 30;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}

export function cameraShake(c: FrameContext, intensity = 2) {
  const { ctx, shotTime, rng } = c;
  if (intensity <= 0) return;
  const s = Math.sin(shotTime * 12) * intensity * (0.5 + rng() * 0.5);
  const s2 = Math.cos(shotTime * 9) * intensity * (0.5 + rng() * 0.5);
  ctx.translate(s, s2);
}

export function drawGroundLine(c: FrameContext, y: number) {
  const { ctx, width, rng, film, shot } = c;
  ctx.save();
  ctx.strokeStyle = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  ctx.lineWidth = 2;
  wobblyLine(ctx, 0, y, width, y, 4, 40, rng);
  // shadow under line
  ctx.strokeStyle = shot.mode === 'blueprint' ? 'rgba(120,160,255,0.15)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 12;
  wobblyLine(ctx, 0, y + 8, width, y + 8, 6, 20, rng);
  ctx.restore();
}

// Character: tiny robot
export function drawRobot(c: FrameContext, x: number, y: number, scale = 1, opts: { walk?: number; look?: number; sad?: number; carry?: boolean } = {}) {
  const { ctx, rng, film, shot, shotProgress } = c;
  const walk = opts.walk || 0;
  const look = opts.look || 0;
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  // bob
  ctx.translate(0, Math.sin(walk * 6) * 4 * s);
  // body wobble
  const bodyWob = Math.sin(shotProgress * Math.PI * 2) * 0.02;

  const ink = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  const accent = film.palette.accent;

  // shadow
  ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(120,160,255,0.12)' : 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 32 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  const legSwing = Math.sin(walk * 2) * 12 * s;
  // left leg
  ctx.beginPath();
  ctx.moveTo(-6 * s, 18 * s);
  ctx.lineTo(-8 * s + legSwing, 30 * s);
  ctx.stroke();
  // right leg
  ctx.beginPath();
  ctx.moveTo(6 * s, 18 * s);
  ctx.lineTo(8 * s - legSwing, 30 * s);
  ctx.stroke();

  // feet
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(-8 * s + legSwing, 32 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8 * s - legSwing, 32 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.save();
  ctx.rotate(bodyWob);
  ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(20,40,80,0.9)' : '#f5f1e8';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5 * s;
  const bw = 28 * s, bh = 24 * s;
  ctx.beginPath();
  if ((ctx as any).roundRect) {
    (ctx as any).roundRect(-bw / 2, -6 * s, bw, bh, 6 * s);
  } else {
    ctx.rect(-bw / 2, -6 * s, bw, bh);
  }
  ctx.fill();
  ctx.stroke();
  // chest light
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 6 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  // hatch on body
  hatchArea(c, -1000, -1000, 0, 0, 0, 0); // dummy to keep rng sync? no
  // arms
  const armSwing = Math.sin(walk * 2 + Math.PI) * 14 * s;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5 * s;
  // left
  ctx.beginPath();
  ctx.moveTo(-14 * s, 2 * s);
  ctx.lineTo(-20 * s + armSwing * 0.5, 12 * s + (opts.carry ? -8 * s : 0));
  ctx.stroke();
  // right
  ctx.beginPath();
  ctx.moveTo(14 * s, 2 * s);
  ctx.lineTo(20 * s - armSwing * 0.5, 12 * s + (opts.carry ? -8 * s : 0));
  ctx.stroke();

  if (opts.carry) {
    // seed in hand
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(20 * s - armSwing * 0.5, 4 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
  }

  // head
  ctx.translate(0, -10 * s);
  ctx.rotate(look * 0.2);
  // head box
  ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(30,50,90,0.95)' : '#fffdf5';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5 * s;
  const hw = 26 * s, hh = 20 * s;
  ctx.beginPath();
  if ((ctx as any).roundRect) {
    (ctx as any).roundRect(-hw / 2, -hh / 2, hw, hh, 5 * s);
  } else {
    ctx.rect(-hw / 2, -hh / 2, hw, hh);
  }
  ctx.fill();
  ctx.stroke();
  // antenna
  ctx.beginPath();
  ctx.moveTo(0, -hh / 2);
  ctx.lineTo(0, -hh / 2 - 10 * s);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -hh / 2 - 12 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // eyes
  const eyeY = -2 * s;
  const eyeSep = 7 * s;
  ctx.fillStyle = ink;
  // left eye
  ctx.beginPath();
  ctx.arc(-eyeSep + look * 3 * s, eyeY + (opts.sad ? 2 * s : 0), 3.2 * s, 0, Math.PI * 2);
  ctx.fill();
  // right eye
  ctx.beginPath();
  ctx.arc(eyeSep + look * 3 * s, eyeY + (opts.sad ? 2 * s : 0), 3.2 * s, 0, Math.PI * 2);
  ctx.fill();
  // sad eyebrows
  if (opts.sad) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-eyeSep - 5 * s, eyeY - 6 * s);
    ctx.lineTo(-eyeSep + 2 * s, eyeY - 4 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSep + 5 * s, eyeY - 6 * s);
    ctx.lineTo(eyeSep - 2 * s, eyeY - 4 * s);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

export function drawSeed(c: FrameContext, x: number, y: number, scale = 1, sprout = 0) {
  const { ctx, film, shot } = c;
  const ink = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (sprout <= 0.01) {
    ctx.fillStyle = '#a3e635';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // little tail
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.quadraticCurveTo(4, 10, 2, 14);
    ctx.stroke();
  } else {
    // sprout
    const h = sprout * 40;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4, -h * 0.4, 0, -h);
    ctx.stroke();
    // leaves
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-4, -h * 0.7, 8, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(4, -h * 0.85, 7, 3.5, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // seed remains
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTree(c: FrameContext, x: number, y: number, scale = 1, age = 1) {
  const { ctx, film, shot, rng } = c;
  const ink = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // trunk with wobble
  ctx.strokeStyle = shot.mode === 'blueprint' ? ink : '#5a3a22';
  ctx.lineWidth = 8 * age;
  ctx.lineCap = 'round';
  const trunkH = 60 * age;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const segs = 8;
  let cx = 0, cy = 0;
  for (let i = 0; i < segs; i++) {
    const t = (i + 1) / segs;
    const nx = (rng() - 0.5) * 6;
    const ny = -trunkH * t;
    ctx.quadraticCurveTo(cx + nx, (cy + ny) / 2, nx, ny);
    cx = nx; cy = ny;
  }
  ctx.stroke();
  // foliage blobs
  const blobs = Math.floor(3 + age * 4);
  for (let i = 0; i < blobs; i++) {
    const bx = randRange(rng, -28, 28) * age;
    const by = -trunkH - randRange(rng, 0, 24) * age;
    const r = randRange(rng, 12, 22) * age;
    ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(120,180,255,0.25)' : `rgba(${80 + rng() * 40}, ${160 + rng() * 60}, ${80 + rng() * 40}, 0.9)`;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // hatch inside
    if (shot.mode === 'paper') {
      ctx.save();
      ctx.clip();
      hatchArea(c, bx - r, by - r, r * 2, r * 2, -0.5, 0.5, 'rgba(0,0,0,0.08)');
      ctx.restore();
    }
  }
  ctx.restore();
}

function randRange(rng: () => number, a: number, b: number) { return a + rng() * (b - a); }

export function drawFlower(c: FrameContext, x: number, y: number, scale = 1, bloom = 1) {
  const { ctx, film, shot, rng } = c;
  const ink = shot.mode === 'blueprint' ? film.palette.blueprintInk : film.palette.ink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // stem
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(4, -10, 0, -28);
  ctx.stroke();
  // petals
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * Math.PI * 2 + bloom * 0.2;
    const px = Math.cos(ang) * 12 * bloom;
    const py = -28 + Math.sin(ang) * 12 * bloom;
    ctx.fillStyle = shot.mode === 'blueprint' ? 'rgba(160,200,255,0.3)' : '#f472b6';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, 7 * bloom, 10 * bloom, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // center
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -28, 5 * bloom, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
