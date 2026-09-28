/*
 * lib.js : the cartoon toolbox for «ЛИМОННЫЙ БРЕЙНРОТ».
 *
 * Meme-edit grammar: thick black outlines, saturated colours, impact captions,
 * sunburst rays, explosions, zoom punches and screen shake. Deterministic:
 * randomness only from rng(seed) / hash(...). The lib object is frozen.
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

  function noise1(x, seed) {
    const i = Math.floor(x);
    const f = smooth(x - i);
    const a = hash(i, seed, 11) * 2 - 1;
    const b = hash(i + 1, seed, 11) * 2 - 1;
    return lerp(a, b, f);
  }

  const ease = {
    linear: (k) => k,
    inCubic: (k) => k * k * k,
    outCubic: (k) => 1 - Math.pow(1 - k, 3),
    inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outQuart: (k) => 1 - Math.pow(1 - k, 4),
    inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    outBack: (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2),
    outElastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };

  // beat pulse: 1 at every 0.5 s beat, 0 between (bpm-agnostic feel)
  const beat = (t, period) => {
    const p = period || 0.4;
    const k = (t % p) / p;
    return Math.pow(1 - k, 2.2);
  };

  // ------------------------------------------------------------------
  // palette
  // ------------------------------------------------------------------

  const pal = {
    lemon: '#FFE14D',
    lemonDark: '#F5B400',
    lemonLight: '#FFF3A3',
    ink: '#141118',
    red: '#FF3B30',
    orange: '#FF8A00',
    pink: '#FF4FA3',
    cyan: '#3ED8FF',
    green: '#37D67A',
    purple: '#8E5BFF',
    blue: '#2E7CFF',
    cream: '#FFF7E8',
    white: '#FFFFFF',
  };

  // ------------------------------------------------------------------
  // text
  // ------------------------------------------------------------------

  function textWidth(ctx, str, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = (opts.weight || '900') + ' ' + (opts.size || 64) + 'px ' + (opts.font || 'Arial Black, Arial, sans-serif');
    const chars = Array.from(str);
    const spacing = opts.spacing || 0;
    let w = 0;
    for (const ch of chars) w += ctx.measureText(ch).width + spacing;
    ctx.restore();
    return w - spacing;
  }

  // Impact caption: white fill, black outline, hard shadow, auto-fit, slam-ready.
  // opts: size, maxW, rotate, alpha, scale, align ('center'), fill, strokeW
  function impact(ctx, str, x, y, opts) {
    opts = opts || {};
    const maxW = opts.maxW || FILM.W * 0.9;
    let size = opts.size || 120;
    let w = textWidth(ctx, str, Object.assign({}, opts, { size }));
    if (w > maxW) size = size * (maxW / w);

    ctx.save();
    ctx.translate(x, y);
    if (opts.rotate) ctx.rotate(opts.rotate);
    const s = opts.scale == null ? 1 : opts.scale;
    if (s !== 1) ctx.scale(s, s);
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;

    ctx.font = (opts.weight || '900') + ' ' + size + 'px ' + (opts.font || 'Arial Black, Arial, sans-serif');
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = opts.align || 'center';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const spacing = opts.spacing || 0;
    const drawPass = (dx, dy, mode) => {
      if (spacing <= 0) {
        if (mode === 'fill') {
          ctx.fillStyle = opts.fill || pal.white;
          ctx.fillText(str, dx, dy);
        } else {
          ctx.strokeStyle = mode === 'shadow' ? 'rgba(0,0,0,0.45)' : pal.ink;
          ctx.lineWidth = (opts.strokeW || size * 0.14) * (mode === 'shadow' ? 1.15 : 1);
          ctx.strokeText(str, dx, dy);
        }
        return;
      }
      // letter-spaced: manual
      const chars = Array.from(str);
      let tw = 0;
      for (const ch of chars) tw += ctx.measureText(ch).width + spacing;
      tw -= spacing;
      let cx = (opts.align || 'center') === 'center' ? -tw / 2 : 0;
      for (const ch of chars) {
        if (mode === 'fill') {
          ctx.fillStyle = opts.fill || pal.white;
          ctx.fillText(ch, cx + dx, dy);
        } else {
          ctx.strokeStyle = mode === 'shadow' ? 'rgba(0,0,0,0.45)' : pal.ink;
          ctx.lineWidth = (opts.strokeW || size * 0.14) * (mode === 'shadow' ? 1.15 : 1);
          ctx.strokeText(ch, cx + dx, dy);
        }
        cx += ctx.measureText(ch).width + spacing;
      }
    };

    drawPass(size * 0.045, size * 0.055, 'shadow');
    drawPass(0, 0, 'stroke');
    drawPass(0, 0, 'fill');

    ctx.restore();
    return w;
  }

  // ------------------------------------------------------------------
  // backgrounds & fx
  // ------------------------------------------------------------------

  // Rotating rainbow sunburst — the meme stage light.
  function rays(ctx, t, opts) {
    opts = opts || {};
    const colors = opts.colors || ['#FF3B30', '#FF8A00', '#FFE14D', '#37D67A', '#3ED8FF', '#8E5BFF', '#FF4FA3'];
    const n = opts.count || 12;
    const rot = t * (opts.speed || 0.6);
    const cx = opts.x == null ? FILM.W / 2 : opts.x;
    const cy = opts.y == null ? FILM.H / 2 : opts.y;
    const R = Math.sqrt(FILM.W * FILM.W + FILM.H * FILM.H);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 0.5) / n) * Math.PI * 2;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Radial speed lines around the frame (zoom focus).
  function speedLines(ctx, t, opts) {
    opts = opts || {};
    const cx = opts.x == null ? FILM.W / 2 : opts.x;
    const cy = opts.y == null ? FILM.H / 2 : opts.y;
    const n = opts.count || 40;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = opts.color || 'rgba(255,255,255,0.8)';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + hash(i, 3, 1) * 0.2;
      const r0 = (opts.r0 || 380) + hash(i, 5, 2) * 120 + Math.sin(t * 6 + i) * 30;
      const r1 = r0 + (opts.len || 260) * (0.5 + hash(i, 7, 3) * 0.5);
      ctx.lineWidth = 4 + hash(i, 9, 4) * 8;
      ctx.globalAlpha = (opts.alpha == null ? 0.7 : opts.alpha) * (0.4 + 0.6 * hash(i, 11, 5));
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Screen shake offset (seeded per frame).
  function shake(t, amount, seed) {
    const f = Math.floor(t * 24 + 1e-4);
    return {
      x: (hash(f, seed || 1, 21) - 0.5) * 2 * amount,
      y: (hash(f, seed || 2, 22) - 0.5) * 2 * amount,
    };
  }

  // Zoom punch wrapper: fn draws in film space; z punches around centre.
  function punch(ctx, z, fn) {
    ctx.save();
    ctx.translate(FILM.W / 2, FILM.H / 2);
    ctx.scale(z, z);
    ctx.translate(-FILM.W / 2, -FILM.H / 2);
    fn();
    ctx.restore();
  }

  function explosion(ctx, x, y, r, k) {
    // k in [0,1] over the blast; spiky star + rings + embers
    const e = ease.outQuart(clamp01(k));
    const fade = 1 - clamp01((k - 0.55) / 0.45);
    if (fade <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = fade;

    // white core
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * (0.35 + e * 1.1));
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(255,225,80,0.9)');
    g.addColorStop(0.75, 'rgba(255,90,30,0.55)');
    g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);

    // spikes
    const spikes = 12;
    ctx.fillStyle = '#FFE14D';
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + 0.2;
      const len = r * (0.5 + e * 1.15) * (0.7 + 0.3 * hash(i, 4, 2));
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.1);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, len * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // rings
    for (let i = 0; i < 2; i++) {
      const rr = r * (0.4 + e * 1.25 + i * 0.35);
      ctx.strokeStyle = i === 0 ? '#FF8A00' : 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 14 * (1 - e * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // embers
    for (let i = 0; i < 14; i++) {
      const a = hash(i, 8, 3) * Math.PI * 2;
      const d = r * (0.3 + e * 1.5) * (0.5 + hash(i, 9, 4));
      ctx.fillStyle = i % 2 ? '#FF3B30' : '#FFE14D';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 10 + hash(i, 10, 5) * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function sparkle(ctx, x, y, s, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? s : s * 0.36;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function checkerFloor(ctx, t, opts) {
    opts = opts || {};
    const y0 = opts.y0 == null ? FILM.H * 0.62 : opts.y0;
    const c1 = opts.c1 || 'rgba(255,255,255,0.16)';
    const c2 = opts.c2 || 'rgba(0,0,0,0.16)';
    const rows = 9;
    const scroll = (t * (opts.speed || 220)) % 120;
    ctx.save();
    for (let r = 0; r < rows; r++) {
      const k = r / rows;
      const yA = y0 + Math.pow(k, 1.5) * (FILM.H - y0) + scroll * Math.pow(k, 1.5);
      const yB = y0 + Math.pow((r + 1) / rows, 1.5) * (FILM.H - y0) + scroll * Math.pow((r + 1) / rows, 1.5);
      const cols = 8 + r * 2;
      for (let c = 0; c < cols; c++) {
        const xA = -FILM.W * 0.2 + (FILM.W * 1.4 * c) / cols;
        const xB = -FILM.W * 0.2 + (FILM.W * 1.4 * (c + 1)) / cols;
        ctx.fillStyle = (r + c) % 2 === 0 ? c1 : c2;
        ctx.beginPath();
        ctx.moveTo(xA, yA);
        ctx.lineTo(xB, yA);
        ctx.lineTo(xB + (xB - FILM.W / 2) * 0.12, yB);
        ctx.lineTo(xA + (xA - FILM.W / 2) * 0.12, yB);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // characters
  // ------------------------------------------------------------------

  // Sneaker (chunky cartoon shoe).
  function sneaker(ctx, s, color) {
    ctx.fillStyle = color || '#FF3B30';
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.18);
    ctx.lineTo(s * 0.28, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.95, -s * 0.22, s * 0.95, s * 0.22);
    ctx.quadraticCurveTo(s * 0.5, s * 0.42, -s * 0.5, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // sole
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.16);
    ctx.quadraticCurveTo(s * 0.4, s * 0.42, s * 0.95, s * 0.22);
    ctx.quadraticCurveTo(s * 0.5, s * 0.55, -s * 0.5, s * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Lemon body with cartoon face.
  // opts: x, y, r, rot, mood ('scream'|'happy'|'angry'|'sus'), blink (0..1),
  //       sunglasses, crown, laser (0..1), t
  function lemonHead(ctx, t, opts) {
    opts = opts || {};
    const r = opts.r || 160;
    const mood = opts.mood || 'happy';
    const rot = opts.rot || 0;

    ctx.save();
    ctx.translate(opts.x || 0, opts.y || 0);
    ctx.rotate(rot);

    // body: ellipse with tips at both ends
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, pal.lemonLight);
    g.addColorStop(0.55, pal.lemon);
    g.addColorStop(1, pal.lemonDark);
    ctx.fillStyle = g;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = Math.max(6, r * 0.055);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 1.28, 0);
    ctx.quadraticCurveTo(-r * 1.1, -r * 0.42, -r * 0.86, -r * 0.52);
    ctx.quadraticCurveTo(0, -r * 1.12, r * 0.86, -r * 0.52);
    ctx.quadraticCurveTo(r * 1.1, -r * 0.42, r * 1.28, 0);
    ctx.quadraticCurveTo(r * 1.1, r * 0.42, r * 0.86, r * 0.52);
    ctx.quadraticCurveTo(0, r * 1.12, -r * 0.86, r * 0.52);
    ctx.quadraticCurveTo(-r * 1.1, r * 0.42, -r * 1.28, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // nubs
    ctx.fillStyle = pal.lemonDark;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * r * 1.3, 0, r * 0.12, r * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.55, r * 0.28, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // ---- face ----
    const blink = opts.blink || 0;
    const eyY = -r * 0.12;
    const eyDx = r * 0.34;
    for (const side of [-1, 1]) {
      // white
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = Math.max(5, r * 0.045);
      ctx.beginPath();
      if (blink > 0.5) {
        ctx.ellipse(side * eyDx, eyY, r * 0.22, r * 0.03, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(side * eyDx, eyY, r * 0.22, r * 0.26, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      if (blink <= 0.5) {
        // pupil (slightly toward centre)
        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.arc(side * eyDx - side * r * 0.05, eyY + r * 0.03, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        if (opts.laser > 0) {
          ctx.fillStyle = pal.red;
          ctx.beginPath();
          ctx.arc(side * eyDx - side * r * 0.05, eyY + r * 0.03, r * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // eyebrow
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = Math.max(7, r * 0.06);
      ctx.lineCap = 'round';
      const bAng = mood === 'angry' || mood === 'scream' ? side * 0.5 : -side * 0.12;
      ctx.beginPath();
      ctx.moveTo(side * eyDx - r * 0.18, eyY - r * 0.34);
      ctx.lineTo(side * eyDx + r * 0.18, eyY - r * 0.34 + Math.sin(bAng) * r * 0.12);
      ctx.stroke();
    }

    // mouth
    ctx.fillStyle = '#7A1B1B';
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = Math.max(5, r * 0.045);
    ctx.beginPath();
    if (mood === 'scream') {
      ctx.ellipse(r * 0.02, r * 0.42, r * 0.3, r * 0.34, 0, 0, Math.PI * 2);
    } else if (mood === 'angry') {
      ctx.moveTo(-r * 0.3, r * 0.48);
      ctx.quadraticCurveTo(0, r * 0.3, r * 0.3, r * 0.48);
      ctx.quadraticCurveTo(0, r * 0.62, -r * 0.3, r * 0.48);
    } else if (mood === 'sus') {
      ctx.ellipse(r * 0.16, r * 0.4, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-r * 0.34, r * 0.32);
      ctx.quadraticCurveTo(0, r * 0.72, r * 0.34, r * 0.32);
      ctx.quadraticCurveTo(0, r * 0.42, -r * 0.34, r * 0.32);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (mood === 'scream') {
      // tongue
      ctx.fillStyle = '#E8556D';
      ctx.beginPath();
      ctx.ellipse(r * 0.02, r * 0.62, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // sunglasses
    if (opts.sunglasses) {
      ctx.fillStyle = pal.ink;
      ctx.beginPath();
      ctx.roundRect(-r * 0.62, eyY - r * 0.16, r * 0.52, r * 0.3, r * 0.08);
      ctx.roundRect(r * 0.1, eyY - r * 0.16, r * 0.52, r * 0.3, r * 0.08);
      ctx.fill();
      ctx.fillRect(-r * 0.12, eyY - r * 0.05, r * 0.24, r * 0.06);
    }

    // crown
    if (opts.crown) {
      ctx.fillStyle = '#FFD23F';
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = Math.max(5, r * 0.045);
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.92);
      ctx.lineTo(-r * 0.34, -r * 1.32);
      ctx.lineTo(-r * 0.12, -r * 1.02);
      ctx.lineTo(0, -r * 1.42);
      ctx.lineTo(r * 0.12, -r * 1.02);
      ctx.lineTo(r * 0.34, -r * 1.32);
      ctx.lineTo(r * 0.5, -r * 0.92);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Full character: lemon head + arms + legs + sneakers, bouncing on the beat.
  // opts: x, y, r, t, phase, mood, sunglasses, armSwing, bounce
  function lemonChar(ctx, t, opts) {
    opts = opts || {};
    const r = opts.r || 150;
    const x = opts.x || 0;
    const y = opts.y || 0;
    const phase = opts.phase || 0;
    const bounce = Math.abs(Math.sin((t + phase) * Math.PI * 2 * 2)) * (opts.bounce == null ? 1 : opts.bounce);
    const yy = y - bounce * r * 0.16;
    const swing = Math.sin((t + phase) * Math.PI * 4) * (opts.armSwing == null ? 1 : opts.armSwing);

    // legs
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = r * 0.14;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.42, yy + r * 0.82);
      ctx.lineTo(x + side * r * 0.52, yy + r * 1.42 - bounce * r * 0.1);
      ctx.stroke();
      ctx.save();
      ctx.translate(x + side * r * 0.52, yy + r * 1.55 - bounce * r * 0.1);
      ctx.rotate(side * 0.12);
      sneaker(ctx, r * 0.52, side > 0 ? pal.red : pal.blue);
      ctx.restore();
    }

    // arms
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x + side * r * 1.02, yy + r * 0.12);
      ctx.rotate(side * (0.6 + swing * 0.55 * side));
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = r * 0.13;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 0.62, r * 0.34);
      ctx.stroke();
      // hand
      ctx.fillStyle = pal.lemon;
      ctx.beginPath();
      ctx.arc(side * r * 0.68, r * 0.38, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = r * 0.045;
      ctx.stroke();
      ctx.restore();
    }

    lemonHead(ctx, t, {
      x,
      y: yy,
      r,
      mood: opts.mood,
      sunglasses: opts.sunglasses,
      crown: opts.crown,
      blink: opts.blink,
      laser: opts.laser,
      rot: swing * 0.04,
    });
  }

  // Ceramic toilet (skibidi grammar).
  function toilet(ctx, t, opts) {
    opts = opts || {};
    const x = opts.x || FILM.W / 2;
    const y = opts.y || FILM.H * 0.72;
    const s = opts.s || 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';

    // tank
    ctx.fillStyle = '#F2F6FA';
    ctx.beginPath();
    ctx.roundRect(-150, -430, 300, 220, 24);
    ctx.fill();
    ctx.stroke();
    // flush button
    ctx.fillStyle = '#C9D6E2';
    ctx.beginPath();
    ctx.arc(0, -360, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // bowl
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-190, -210);
    ctx.quadraticCurveTo(-210, 40, -120, 120);
    ctx.lineTo(120, 120);
    ctx.quadraticCurveTo(210, 40, 190, -210);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // seat (open)
    ctx.fillStyle = '#E8F0F6';
    ctx.beginPath();
    ctx.ellipse(0, -215, 205, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2A3440';
    ctx.beginPath();
    ctx.ellipse(0, -215, 150, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // base
    ctx.fillStyle = '#F2F6FA';
    ctx.beginPath();
    ctx.roundRect(-90, 110, 180, 120, 16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-130, 215, 260, 46, 14);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Lemoncopter: lemon body, rotor, tail, windows.
  function lemoncopter(ctx, t, opts) {
    opts = opts || {};
    const x = opts.x || 0;
    const y = opts.y || 0;
    const s = opts.s || 1;
    const rotor = t * 22;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (opts.flip) ctx.scale(-1, 1);

    // rotor blur
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(-320, -190);
    ctx.lineTo(320, -190);
    ctx.stroke();
    ctx.restore();
    // rotor blades
    ctx.fillStyle = '#8FA0B0';
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 8;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(0, -185);
      ctx.rotate(Math.sin(rotor) * 0.12 * side);
      ctx.beginPath();
      ctx.roundRect(side > 0 ? 10 : -260, -14, 250, 26, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // mast
    ctx.fillStyle = '#8FA0B0';
    ctx.fillRect(-18, -190, 36, 60);
    ctx.strokeRect(-18, -190, 36, 60);

    // body = lemon
    lemonHead(ctx, t, {
      x: 0,
      y: 20,
      r: 130,
      mood: opts.mood || 'happy',
      sunglasses: true,
    });

    // tail boom
    ctx.fillStyle = pal.lemonDark;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(330, -40);
    ctx.lineTo(330, 20);
    ctx.lineTo(150, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // tail rotor
    ctx.save();
    ctx.translate(330, -12);
    ctx.rotate(rotor * 1.4);
    ctx.fillStyle = '#8FA0B0';
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.fillRect(-8, -70, 16, 70);
    }
    ctx.restore();

    // skids
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-120, 150);
    ctx.lineTo(120, 150);
    ctx.moveTo(-80, 120);
    ctx.lineTo(-80, 150);
    ctx.moveTo(80, 120);
    ctx.lineTo(80, 150);
    ctx.stroke();

    ctx.restore();
  }

  // Simple city block.
  function building(ctx, x, y, w, h, color, seed) {
    ctx.fillStyle = color;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.rect(x, y - h, w, h);
    ctx.fill();
    ctx.stroke();
    const cols = Math.max(2, Math.floor(w / 70));
    const rows = Math.max(2, Math.floor(h / 90));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = hash(r, c, seed || 1) > 0.45;
        ctx.fillStyle = lit ? '#FFE14D' : '#22303E';
        ctx.fillRect(x + 18 + c * (w - 36) / cols, y - h + 18 + r * (h - 36) / rows, (w - 36) / cols * 0.62, (h - 36) / rows * 0.5);
      }
    }
  }

  const lib = {
    hash,
    rng,
    clamp,
    clamp01,
    lerp,
    smooth,
    noise1,
    ease,
    beat,
    pal,
    impact,
    textWidth,
    rays,
    speedLines,
    shake,
    punch,
    explosion,
    sparkle,
    checkerFloor,
    sneaker,
    lemonHead,
    lemonChar,
    toilet,
    lemoncopter,
    building,
  };
  FILM.lib = Object.freeze(lib);
})();
