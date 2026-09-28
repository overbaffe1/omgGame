/*
 * lib.js : the drawing toolbox for «ГЛУБИНА».
 *
 * Everything here is deterministic: random-looking variation comes from
 * FILM.lib.rng(seed) / FILM.lib.hash(...) only. The lib object is frozen at
 * the bottom of the file. Palette constants live in lib.pal.
 */
(function () {
  'use strict';
  const FILM = (window.FILM = window.FILM || {});

  // ------------------------------------------------------------------
  // math / noise
  // ------------------------------------------------------------------

  function hash(a, b, c) {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function rng(seed) {
    let s = (seed | 0) || 1;
    return function () {
      s = (Math.imul(s, 0x85ebca6b) ^ (s >>> 13)) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (k) => k * k * (3 - 2 * k);

  // Smooth 1D value noise in [-1, 1].
  function noise1(x, seed) {
    const i = Math.floor(x);
    const f = smooth(x - i);
    const a = hash(i, seed, 11) * 2 - 1;
    const b = hash(i + 1, seed, 11) * 2 - 1;
    return lerp(a, b, f);
  }

  // 2D value noise in [0, 1].
  function noise2(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = hash(ix, iy, seed);
    const b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed);
    const d = hash(ix + 1, iy + 1, seed);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }

  const ease = {
    linear: (k) => k,
    inCubic: (k) => k * k * k,
    outCubic: (k) => 1 - Math.pow(1 - k, 3),
    inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outQuart: (k) => 1 - Math.pow(1 - k, 4),
    inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    outBack: (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2),
  };

  // ------------------------------------------------------------------
  // palette : the film's graded water column
  // ------------------------------------------------------------------

  const pal = {
    ink: '#04101f',
    paper: '#f2e8d8',
    sky: '#f6e7c8',
    sun: '#ffe9b0',
    navy: '#0a1e3d',
    navyLine: '#8fa8cc',
    navyDim: '#3d5b86',
    magenta: '#e8577f',
    cyan: '#7fd4ff',
    bone: '#d8d2c2',
    ember: '#ff6b35',
    emberSoft: '#ff9d45',
    // water column
    surface0: '#7ec8ff',
    surface1: '#2f8fd8',
    surface2: '#0c4a8a',
    photic0: '#4fb3ef',
    photic1: '#0a4d8c',
    photic2: '#062a5c',
    reef0: '#0e6fa8',
    reef1: '#0a4a7c',
    reef2: '#073c6e',
    twi0: '#08325e',
    twi1: '#052348',
    twi2: '#041a3c',
    mid0: '#0b2a55',
    mid1: '#071c3d',
    mid2: '#04122b',
    deep0: '#041226',
    deep1: '#020c1c',
    deep2: '#020814',
    abyss0: '#030e1e',
    abyss1: '#020913',
    abyss2: '#02060e',
  };

  // ------------------------------------------------------------------
  // canvas helpers
  // ------------------------------------------------------------------

  function gradV(ctx, x, y, w, h, stops) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return g;
  }

  function glow(ctx, x, y, r, inner, outer) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.01, r));
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    return g;
  }

  // Soft filled circle used for particles and lights.
  function dot(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.2, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lerp two hex colors; k in [0,1].
  function mix(c1, c2, k) {
    const p = (c) => {
      const s = c.replace('#', '');
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    };
    const a = p(c1);
    const b = p(c2);
    const r = Math.round(lerp(a[0], b[0], k));
    const g = Math.round(lerp(a[1], b[1], k));
    const bl = Math.round(lerp(a[2], b[2], k));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  // ------------------------------------------------------------------
  // text
  // ------------------------------------------------------------------

  // Draw text with manual letter spacing so every browser agrees.
  function text(ctx, str, x, y, opts) {
    opts = opts || {};
    const size = opts.size || 64;
    const font = opts.font || 'Helvetica Neue, Arial, sans-serif';
    const weight = opts.weight || '700';
    const spacing = opts.spacing || 0;
    const align = opts.align || 'left';
    const color = opts.color || '#ffffff';
    const alpha = opts.alpha == null ? 1 : opts.alpha;

    ctx.save();
    ctx.font = weight + ' ' + size + 'px ' + font;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.textBaseline = opts.baseline || 'alphabetic';

    const chars = Array.from(str);
    let w = 0;
    for (const ch of chars) w += ctx.measureText(ch).width + spacing;
    w -= spacing;

    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    for (const ch of chars) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacing;
    }
    ctx.restore();
    return w;
  }

  // Draw text auto-fitted to maxW (shrinks size, then spacing, until it fits).
  function textFit(ctx, str, x, y, opts) {
    opts = Object.assign({}, opts);
    let size = opts.size || 64;
    const maxW = opts.maxW || FILM.W * 0.86;
    let w = textWidth(ctx, str, Object.assign({}, opts, { size }));
    if (w > maxW) {
      size = Math.max(10, size * (maxW / w));
      w = textWidth(ctx, str, Object.assign({}, opts, { size }));
    }
    if (w > maxW && (opts.spacing || 0) > 0) {
      opts.spacing = 0;
    }
    opts.size = size;
    return text(ctx, str, x, y, opts);
  }

  function textWidth(ctx, str, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = (opts.weight || '700') + ' ' + (opts.size || 64) + 'px ' + (opts.font || 'Helvetica Neue, Arial, sans-serif');
    const chars = Array.from(str);
    const spacing = opts.spacing || 0;
    let w = 0;
    for (const ch of chars) w += ctx.measureText(ch).width + spacing;
    ctx.restore();
    return w - spacing;
  }

  const mono = 'Courier New, Courier, monospace';
  const serif = 'Georgia, Times New Roman, serif';
  const sans = 'Helvetica Neue, Arial, sans-serif';

  // ------------------------------------------------------------------
  // water column furniture
  // ------------------------------------------------------------------

  // Wavy caustic bands near the surface.
  function caustics(ctx, t, y0, y1, color, alpha, count) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const n = count || 6;
    for (let i = 0; i < n; i++) {
      const y = lerp(y0, y1, i / (n - 1 || 1));
      ctx.beginPath();
      for (let x = -40; x <= FILM.W + 40; x += 24) {
        const yy =
          y +
          noise1(x * 0.004 + t * 0.35, 31 + i) * 26 +
          Math.sin(x * 0.01 + t * (0.8 + i * 0.13) + i) * 14;
        if (x <= -40) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // God rays fanning down from a point above the frame.
  function godrays(ctx, t, opts) {
    opts = opts || {};
    const x0 = opts.x == null ? FILM.W * 0.5 : opts.x;
    const y0 = opts.y == null ? -FILM.H * 0.1 : opts.y;
    const spread = opts.spread == null ? 1.0 : opts.spread;
    const count = opts.count || 7;
    const color = opts.color || 'rgba(255,238,190,';
    const alpha = opts.alpha == null ? 0.16 : opts.alpha;
    const len = opts.len == null ? FILM.H * 1.1 : opts.len;

    ctx.save();
    ctx.translate(x0, y0);
    for (let i = 0; i < count; i++) {
      const seedA = hash(i, 3, 17);
      const sway = Math.sin(t * (0.22 + seedA * 0.2) + i * 1.7) * 0.06;
      const ang = (i / (count - 1) - 0.5) * spread + sway + (opts.rot || 0);
      const wRay = (0.05 + seedA * 0.08) * (opts.width == null ? 1 : opts.width);
      const a = alpha * (0.5 + 0.5 * Math.sin(t * (0.5 + seedA) + i * 2.1));
      const g = ctx.createLinearGradient(0, 0, Math.sin(ang) * len, Math.cos(ang) * len);
      g.addColorStop(0, color + a * 1.4 + ')');
      g.addColorStop(1, color + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.sin(ang - wRay) * len, Math.cos(ang - wRay) * len);
      ctx.lineTo(Math.sin(ang + wRay) * len, Math.cos(ang + wRay) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Drifting marine snow / dust motes.
  function snow(ctx, t, opts) {
    opts = opts || {};
    const count = opts.count || 60;
    const color = opts.color || '#dff1ff';
    const speed = opts.speed == null ? 26 : opts.speed;
    const drift = opts.drift == null ? 18 : opts.drift;
    const rMin = opts.rMin || 1.5;
    const rMax = opts.rMax || 5;
    const alpha = opts.alpha == null ? 0.5 : opts.alpha;
    const seed = opts.seed || 7;
    const y0 = opts.y0 == null ? -40 : opts.y0;
    const y1 = opts.y1 == null ? FILM.H + 40 : opts.y1;
    const span = y1 - y0;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const r1 = hash(i, seed, 1);
      const r2 = hash(i, seed, 2);
      const r3 = hash(i, seed, 3);
      const x = r1 * FILM.W + noise1(t * 0.22 + i, seed) * drift;
      const y = y0 + ((r2 * span + t * speed * (0.5 + r3)) % span + span) % span;
      const r = rMin + r3 * (rMax - rMin);
      const a = alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1 + r1 * 2) + i)));
      dot(ctx, x, y, r, color, a);
    }
    ctx.restore();
  }

  // Rising bubbles with wobble.
  function bubbles(ctx, t, opts) {
    opts = opts || {};
    const count = opts.count || 18;
    const speed = opts.speed == null ? 120 : opts.speed;
    const seed = opts.seed || 5;
    const alpha = opts.alpha == null ? 0.55 : opts.alpha;
    const y0 = opts.y0 == null ? FILM.H + 60 : opts.y0;
    const y1 = opts.y1 == null ? -60 : opts.y1;
    const span = y0 - y1;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const r1 = hash(i, seed, 21);
      const r2 = hash(i, seed, 22);
      const r3 = hash(i, seed, 23);
      const r = 4 + r3 * (opts.rMax || 26);
      const x = r1 * FILM.W + noise1(t * 0.7 + i * 3.3, seed) * 34;
      const y = y0 - (((t * speed * (0.6 + r2 * 0.8) + r2 * span) % span) + span) % span;
      const a = alpha * (0.5 + 0.5 * r2);
      // shell
      ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(220,240,255,0.9)';
      ctx.lineWidth = Math.max(1.4, r * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // highlight
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x - r * 0.34, y - r * 0.36, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // creatures
  // ------------------------------------------------------------------

  // Simple fish silhouette that wiggles as it swims.
  // opts: x, y, len, dir (1 right / -1 left), phase, color, alpha, speed, t
  function fish(ctx, t, opts) {
    opts = opts || {};
    const len = opts.len || 80;
    const dir = opts.dir == null ? 1 : opts.dir;
    const phase = opts.phase || 0;
    const wig = Math.sin(t * (opts.wiggle == null ? 6 : opts.wiggle) + phase);
    const h = len * 0.42;

    ctx.save();
    ctx.translate(opts.x || 0, opts.y || 0);
    ctx.rotate((opts.rot || 0) + wig * 0.06);
    ctx.scale(dir, 1);
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    ctx.fillStyle = opts.color || '#08243f';

    // body
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.quadraticCurveTo(-len * 0.18, -h * 0.62 + wig * h * 0.1, len * 0.32, -h * 0.14);
    ctx.quadraticCurveTo(len * 0.46, 0, len * 0.32, h * 0.14);
    ctx.quadraticCurveTo(-len * 0.18, h * 0.62 + wig * h * 0.1, -len * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // tail
    ctx.beginPath();
    ctx.moveTo(-len * 0.42, 0);
    ctx.lineTo(-len * 0.72, -h * (0.55 + wig * 0.18));
    ctx.lineTo(-len * 0.62, 0);
    ctx.lineTo(-len * 0.72, h * (0.55 - wig * 0.18));
    ctx.closePath();
    ctx.fill();

    // top fin
    ctx.beginPath();
    ctx.moveTo(-len * 0.16, -h * 0.5);
    ctx.quadraticCurveTo(len * 0.02, -h * 0.95, len * 0.16, -h * 0.42);
    ctx.closePath();
    ctx.fill();

    if (opts.eye !== false) {
      ctx.fillStyle = opts.eyeColor || 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(len * 0.26, -h * 0.1, len * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Moon jelly: pulsing bell + tentacles.
  // opts: x, y, r, phase, color, glowColor, alpha, t, tent (tentacle length mult)
  function jelly(ctx, t, opts) {
    opts = opts || {};
    const r = opts.r || 120;
    const phase = opts.phase || 0;
    // pulse on the 0.5 s beat grid
    const pulse = 0.5 + 0.5 * Math.sin((t + phase) * Math.PI * 2 * 2);
    const sx = 1 + pulse * 0.12;
    const sy = 1 - pulse * 0.14;
    const sway = Math.sin(t * 0.7 + phase * 2.2) * r * 0.16;

    ctx.save();
    ctx.translate((opts.x || 0) + sway, opts.y || 0);
    ctx.rotate((opts.rot || 0) + Math.sin(t * 0.5 + phase) * 0.08);
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;

    // outer glow
    if (opts.glowColor) {
      ctx.save();
      ctx.globalAlpha = (opts.alpha == null ? 1 : opts.alpha) * 0.35;
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.1);
      g.addColorStop(0, opts.glowColor);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-r * 2.1, -r * 2.1, r * 4.2, r * 4.2);
      ctx.restore();
    }

    // tentacles behind the bell
    const tn = opts.tentacles == null ? 8 : opts.tentacles;
    const tLen = r * (opts.tent == null ? 2.6 : opts.tent);
    ctx.strokeStyle = opts.tentColor || 'rgba(190,230,255,0.5)';
    ctx.lineWidth = Math.max(1.5, r * 0.03);
    for (let i = 0; i < tn; i++) {
      const k = i / (tn - 1 || 1) - 0.5;
      const x0 = k * r * 1.1 * sx;
      const wob = Math.sin(t * 1.3 + phase + i * 1.1) * r * 0.35;
      ctx.beginPath();
      ctx.moveTo(x0, r * 0.42 * sy);
      ctx.bezierCurveTo(
        x0 + wob * 0.4,
        r * 0.42 * sy + tLen * 0.45,
        x0 - wob * 0.6,
        r * 0.42 * sy + tLen * 0.8,
        x0 + wob * 0.8,
        r * 0.42 * sy + tLen
      );
      ctx.stroke();
    }

    // oral arms (thicker, frilly)
    ctx.strokeStyle = opts.armColor || 'rgba(210,238,255,0.75)';
    ctx.lineWidth = Math.max(3, r * 0.075);
    for (let i = -1; i <= 1; i++) {
      const x0 = i * r * 0.28 * sx;
      const wob = Math.sin(t * 1.05 + phase + i) * r * 0.3;
      ctx.beginPath();
      ctx.moveTo(x0, r * 0.34 * sy);
      ctx.bezierCurveTo(x0 + wob, r * 0.34 * sy + tLen * 0.4, x0 - wob, r * 0.34 * sy + tLen * 0.75, x0 + wob * 0.5, r * 0.34 * sy + tLen * 1.15);
      ctx.stroke();
    }

    // bell
    const g2 = ctx.createLinearGradient(0, -r * sy, 0, r * 0.6 * sy);
    g2.addColorStop(0, opts.color || 'rgba(214,238,255,0.55)');
    g2.addColorStop(1, opts.color2 || 'rgba(150,205,255,0.22)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(-r * sx, r * 0.18 * sy);
    ctx.bezierCurveTo(-r * 0.88 * sx, -r * 1.28 * sy, r * 0.88 * sx, -r * 1.28 * sy, r * sx, r * 0.18 * sy);
    ctx.bezierCurveTo(r * 0.7 * sx, r * 0.5 * sy, -r * 0.7 * sx, r * 0.5 * sy, -r * sx, r * 0.18 * sy);
    ctx.closePath();
    ctx.fill();

    // rim + inner organs
    ctx.strokeStyle = 'rgba(230,245,255,0.5)';
    ctx.lineWidth = Math.max(1.5, r * 0.02);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.34, -r * 0.18 * sy, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Swaying kelp / tube-worm strand.
  function strand(ctx, t, opts) {
    opts = opts || {};
    const x = opts.x || 0;
    const y = opts.y || FILM.H;
    const h = opts.h || 420;
    const segs = opts.segs || 14;
    const sway = opts.sway == null ? 40 : opts.sway;
    const phase = opts.phase || 0;
    const w = opts.w == null ? 14 : opts.w;
    const color = opts.color || '#2e8b6f';
    const color2 = opts.color2 || color;

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < segs; i++) {
      const k = i / segs;
      const k2 = (i + 1) / segs;
      const bend = (kk) => Math.sin(t * 0.8 + phase + kk * 2.2) * sway * kk * kk;
      const x1 = x + bend(k);
      const y1 = y - h * k;
      const x2 = x + bend(k2);
      const y2 = y - h * k2;
      ctx.strokeStyle = mix(color, color2, k);
      ctx.lineWidth = w * (1 - k * 0.55);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (opts.leafy) {
        ctx.beginPath();
        ctx.ellipse(x2 + w * 1.8, y2, w * 1.6, w * 0.5, -0.7 + k, 0, Math.PI * 2);
        ctx.fillStyle = mix(color, color2, k);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Angular rock silhouette along the bottom.
  function rocks(ctx, opts) {
    opts = opts || {};
    const y = opts.y == null ? FILM.H * 0.82 : opts.y;
    const amp = opts.amp == null ? 120 : opts.amp;
    const color = opts.color || '#041226';
    const seed = opts.seed || 9;
    const step = opts.step || 90;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, FILM.H + 10);
    for (let x = -10; x <= FILM.W + 10; x += step) {
      const yy = y + noise1(x * 0.004 + seed, seed) * amp + noise1(x * 0.013, seed + 3) * amp * 0.35;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(FILM.W + 10, FILM.H + 10);
    ctx.closePath();
    ctx.fill();
    if (opts.rimColor) {
      ctx.strokeStyle = opts.rimColor;
      ctx.lineWidth = opts.rimWidth || 4;
      ctx.globalAlpha = opts.rimAlpha == null ? 0.6 : opts.rimAlpha;
      ctx.beginPath();
      for (let x = -10; x <= FILM.W + 10; x += step) {
        const yy = y + noise1(x * 0.004 + seed, seed) * amp + noise1(x * 0.013, seed + 3) * amp * 0.35;
        if (x <= -10) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // blueprint (chart mode) furniture
  // ------------------------------------------------------------------

  function blueGrid(ctx, opts) {
    opts = opts || {};
    const step = opts.step || 60;
    ctx.save();
    ctx.strokeStyle = 'rgba(143,168,204,0.14)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= FILM.W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FILM.H);
      ctx.stroke();
    }
    for (let y = 0; y <= FILM.H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FILM.W, y);
      ctx.stroke();
    }
    // heavier grid every 5
    ctx.strokeStyle = 'rgba(143,168,204,0.22)';
    for (let x = 0; x <= FILM.W; x += step * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FILM.H);
      ctx.stroke();
    }
    for (let y = 0; y <= FILM.H; y += step * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FILM.W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dashLine(ctx, x1, y1, x2, y2, opts) {
    opts = opts || {};
    ctx.save();
    ctx.strokeStyle = opts.color || pal.navyLine;
    ctx.lineWidth = opts.width || 3;
    ctx.setLineDash(opts.dash || [14, 10]);
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function corner(ctx, opts) {
    opts = opts || {};
    ctx.save();
    ctx.strokeStyle = opts.color || pal.navyLine;
    ctx.lineWidth = opts.width || 3;
    ctx.globalAlpha = opts.alpha == null ? 0.8 : opts.alpha;
    const L = opts.len || 46;
    const inset = opts.inset || 48;
    const pts = [
      [inset, inset, 1, 1],
      [FILM.W - inset, inset, -1, 1],
      [inset, FILM.H - inset, 1, -1],
      [FILM.W - inset, FILM.H - inset, -1, -1],
    ];
    for (const [x, y, dx, dy] of pts) {
      ctx.beginPath();
      ctx.moveTo(x + dx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * L);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Progressive draw-on helper: k in [0,1] reveals the shape.
  function reveal(k, fn) {
    fn(clamp01(k));
  }

  // ------------------------------------------------------------------
  // export
  // ------------------------------------------------------------------

  const lib = {
    hash,
    rng,
    clamp,
    clamp01,
    lerp,
    smooth,
    noise1,
    noise2,
    ease,
    pal,
    mix,
    gradV,
    glow,
    dot,
    text,
    textFit,
    textWidth,
    mono,
    serif,
    sans,
    caustics,
    godrays,
    snow,
    bubbles,
    fish,
    jelly,
    strand,
    rocks,
    blueGrid,
    dashLine,
    corner,
    reveal,
    W: () => FILM.W,
    H: () => FILM.H,
    T: () => FILM.frameT,
  };
  FILM.lib = Object.freeze(lib);
})();
