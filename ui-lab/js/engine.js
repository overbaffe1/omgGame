// ============================================================================
// engine.js — atlas loading, 9-slice renderer, 4×5 pixel font
// Part of the omgGame UI lab. No libraries.
// ============================================================================

export class Atlas {
  constructor(img, json) {
    this.img = img;
    this.slices = new Map();
    for (const s of json.meta.slices || []) {
      const k = s.keys[0];
      if (!k) continue;
      const b = k.bounds, c = k.center || null;
      this.slices.set(s.name, {
        x: b.x, y: b.y, w: b.w, h: b.h,
        // 9-slice margins (border widths) derived from the center rect
        ml: c ? c.x : Math.floor(b.w / 3),
        mt: c ? c.y : Math.floor(b.h / 3),
        mr: c ? b.w - c.x - c.w : Math.floor(b.w / 3),
        mb: c ? b.h - c.y - c.h : Math.floor(b.h / 3),
        cw: c ? c.w : 0, ch: c ? c.h : 0,
      });
    }
  }
  static async load(base) {
    const [img, json] = await Promise.all([
      new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `${base}/atlas.png`; }),
      fetch(`${base}/atlas.json`).then(r => r.json()),
    ]);
    return new Atlas(img, json);
  }
  has(name) { return this.slices.has(name); }
  get(name) { return this.slices.get(name); }

  // 1:1 draw
  draw(ctx, name, dx, dy) {
    const s = this.slices.get(name);
    if (!s) return;
    ctx.drawImage(this.img, s.x, s.y, s.w, s.h, dx | 0, dy | 0, s.w, s.h);
  }

  // nine-slice: borders stay 1:1, center stretches (source center may exceed
  // the drawn center — drawImage scales it, which is fine for stone/noise)
  draw9(ctx, name, dx, dy, dw, dh) {
    const s = this.slices.get(name);
    if (!s) return;
    dw |= 0; dh |= 0; dx |= 0; dy |= 0;
    const { x, y, w, h, ml, mt, mr, mb, cw, ch } = s;
    const rows = [
      [y, mt, dy, mt],                       // top
      [y + mt, ch || (h - mt - mb), dy + mt, dh - mt - mb], // middle
      [y + h - mb, mb, dy + dh - mb, mb],    // bottom
    ];
    const cols = [
      [x, ml, dx, ml],
      [x + ml, cw || (w - ml - mr), dx + ml, dw - ml - mr],
      [x + w - mr, mr, dx + dw - mr, mr],
    ];
    for (let r = 0; r < 3; r++) {
      const [sy, sh, ddy, ddh] = rows[r];
      if (sh <= 0 || ddh <= 0) continue;
      for (let c = 0; c < 3; c++) {
        const [sx, sw, ddx, ddw] = cols[c];
        if (sw <= 0 || ddw <= 0) continue;
        ctx.drawImage(this.img, sx, sy, sw, sh, ddx, ddy, ddw, ddh);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 4×5 pixel font (variable width). Each glyph: array of bit-rows.
// ----------------------------------------------------------------------------
const G = (rows) => rows;
const FONT = {
  A: G(['0110', '1001', '1111', '1001', '1001']),
  B: G(['1110', '1001', '1110', '1001', '1110']),
  C: G(['0111', '1000', '1000', '1000', '0111']),
  D: G(['1110', '1001', '1001', '1001', '1110']),
  E: G(['1111', '1000', '1110', '1000', '1111']),
  F: G(['1111', '1000', '1110', '1000', '1000']),
  G: G(['0111', '1000', '1011', '1001', '0111']),
  H: G(['1001', '1001', '1111', '1001', '1001']),
  I: G(['111', '010', '010', '010', '111']),
  J: G(['0011', '0001', '0001', '1001', '0110']),
  K: G(['1001', '1010', '1100', '1010', '1001']),
  L: G(['1000', '1000', '1000', '1000', '1111']),
  M: G(['10001', '11011', '10101', '10001', '10001']),
  N: G(['1001', '1101', '1011', '1001', '1001']),
  O: G(['0110', '1001', '1001', '1001', '0110']),
  P: G(['1110', '1001', '1110', '1000', '1000']),
  Q: G(['0110', '1001', '1001', '1010', '0101']),
  R: G(['1110', '1001', '1110', '1010', '1001']),
  S: G(['0111', '1000', '0110', '0001', '1110']),
  T: G(['11111', '00100', '00100', '00100', '00100']),
  U: G(['1001', '1001', '1001', '1001', '0110']),
  V: G(['10001', '10001', '01010', '01010', '00100']),
  W: G(['10001', '10001', '10101', '11011', '10001']),
  X: G(['1001', '1001', '0110', '1001', '1001']),
  Y: G(['10001', '01010', '00100', '00100', '00100']),
  Z: G(['1111', '0001', '0110', '1000', '1111']),
  0: G(['0110', '1001', '1011', '1101', '0110']),
  1: G(['010', '110', '010', '010', '111']),
  2: G(['1110', '0001', '0110', '1000', '1111']),
  3: G(['1110', '0001', '0110', '0001', '1110']),
  4: G(['1001', '1001', '1111', '0001', '0001']),
  5: G(['1111', '1000', '1110', '0001', '1110']),
  6: G(['0111', '1000', '1110', '1001', '0110']),
  7: G(['1111', '0001', '0010', '0100', '0100']),
  8: G(['0110', '1001', '0110', '1001', '0110']),
  9: G(['0110', '1001', '0111', '0001', '1110']),
  '+': G(['0000', '0100', '1110', '0100', '0000']),
  '-': G(['0000', '0000', '1110', '0000', '0000']),
  '.': G(['00', '00', '00', '00', '11']),
  ',': G(['00', '00', '00', '01', '10']),
  ':': G(['0', '1', '0', '1', '0']),
  '!': G(['1', '1', '1', '0', '1']),
  '/': G(['0001', '0010', '0100', '0100', '1000']),
  '%': G(['0000', '1001', '0010', '0100', '1001']),
  "'": G(['1', '1', '0', '0', '0']),
  ' ': G(['00', '00', '00', '00', '00']),
};

export function textWidth(str, scale = 1, tracking = 1) {
  let w = 0;
  for (const ch of String(str).toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    w += g[0].length * scale + tracking * scale;
  }
  return Math.max(0, w - tracking * scale);
}

export function drawText(ctx, str, x, y, color, scale = 1, tracking = 1) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x | 0;
  const cy = y | 0;
  for (const ch of String(str).toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    const gw = g[0].length;
    for (let r = 0; r < 5; r++) {
      const row = g[r];
      for (let c = 0; c < gw; c++) {
        if (row[c] === '1') ctx.fillRect(cx + c * scale, cy + r * scale, scale, scale);
      }
    }
    cx += gw * scale + tracking * scale;
  }
  ctx.restore();
}

// ----------------------------------------------------------------------------
// tiny helpers
// ----------------------------------------------------------------------------
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function pixelCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function enablePixelated(canvas) {
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
}
