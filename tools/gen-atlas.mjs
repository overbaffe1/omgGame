#!/usr/bin/env node
// ============================================================================
// Diablo II–style Dark Fantasy UI Sprite Atlas — generated THROUGH the
// aseprite-mcp server (each step is a real MCP tools/call over stdio).
//
// Pipeline:
//   create_canvas → set_palette → add_layer×6 → edit_sprite×N (batched shape
//   ops + computed pixel batches) → script_execute (slices) →
//   spritesheet_export (atlas.png + atlas.json, json-hash with 9-slices)
// ============================================================================
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ASSETS = `${ROOT}/ui-lab/assets`;
mkdirSync(ASSETS, { recursive: true });

const ASEPRITE = process.env.ASEPRITE_PATH || '/tmp/aseprite-build/bin/aseprite';
const FILE = `${ASSETS}/atlas.aseprite`;

// ---------------------------------------------------------------------------
// MCP stdio plumbing
// ---------------------------------------------------------------------------
const proc = spawn('aseprite-mcp', [], {
  env: { ...process.env, ASEPRITE_PATH: ASEPRITE },
  stdio: ['pipe', 'pipe', 'inherit'],
});
let buf = '';
const pending = new Map();
let nextId = 1;
proc.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const m = JSON.parse(line);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    } catch { /* partial line */ }
  }
});
function send(method, params, timeoutMs = 180000) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('MCP timeout: ' + method)); } }, timeoutMs);
  });
}
async function call(tool, args, quiet = false) {
  const res = await send('tools/call', { name: tool, arguments: args });
  const text = (res.result?.content || []).map(c => c.text || '').join(' ');
  if (res.result?.isError) throw new Error(`${tool} failed: ${text.slice(0, 400)}`);
  if (!quiet) console.log(`  ✓ ${tool}${text ? ' — ' + text.split('\n')[0].slice(0, 90) : ''}`);
  return text;
}

// ---------------------------------------------------------------------------
// D2-ish palette (dark stone, iron, gold, blood, mana, steel, parchment)
// ---------------------------------------------------------------------------
const C = {
  black0: '#0b0906', black1: '#141008', black2: '#1b150c',
  stone0: '#241b11', stone1: '#32271a', stone2: '#41321f', stone3: '#524028',
  iron0: '#26262c', iron1: '#3a3a42', iron2: '#55555e', iron3: '#6e6e78',
  gold0: '#5c4420', gold1: '#8a6a2a', gold2: '#b8933a', gold3: '#dfc063', gold4: '#f6e7a0',
  blood0: '#3d0d0e', blood1: '#6e1417', blood2: '#9c1f22', blood3: '#c93b31', blood4: '#e05a45',
  mana0: '#101f3f', mana1: '#1d3a6e', mana2: '#2f5ea8', mana3: '#5b93d6', mana4: '#9cc6ef',
  steel0: '#3a3a42', steel1: '#6e6e78', steel2: '#9a9aa6', steel3: '#cfd0d8',
  parch0: '#8f7a52', parch1: '#c4ad7f', parch2: '#e6d5a7', bone: '#efe6c8',
  white: '#ffffff',
};

// deterministic PRNG for dithering
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hex(c) { return c; }

// ---------------------------------------------------------------------------
// Atlas layout — one 512×384 sheet
// ---------------------------------------------------------------------------
const L = {
  panel9:   { x: 0,   y: 0,   w: 96,  h: 64 },
  tooltip9: { x: 104, y: 0,   w: 40,  h: 24 },
  divider:  { x: 152, y: 0,   w: 96,  h: 12 },
  corner:   { x: 256, y: 0,   w: 24,  h: 24 },
  cursor:   { x: 288, y: 0,   w: 24,  h: 24 },
  btnNormal:{ x: 0,   y: 72,  w: 120, h: 28 },
  btnHover: { x: 0,   y: 104, w: 120, h: 28 },
  btnPress: { x: 0,   y: 136, w: 120, h: 28 },
  orbHp:    { x: 0,   y: 176, w: 72,  h: 72 },
  orbMp:    { x: 80,  y: 176, w: 72,  h: 72 },
  slot:     { x: 168, y: 176, w: 36,  h: 36 },
  slotHov:  { x: 208, y: 176, w: 36,  h: 36 },
  slotSel:  { x: 248, y: 176, w: 36,  h: 36 },
  iconHp:   { x: 168, y: 256, w: 18,  h: 18 },
  iconMp:   { x: 192, y: 256, w: 18,  h: 18 },
  iconSword:{ x: 216, y: 256, w: 18,  h: 18 },
  iconShield:{ x: 240, y: 256, w: 18, h: 18 },
  iconSkull:{ x: 264, y: 256, w: 18, h: 18 },
  iconScroll:{ x: 288, y: 256, w: 18, h: 18 },
  barL:     { x: 168, y: 288, w: 6,   h: 8 },
  barM:     { x: 178, y: 288, w: 8,   h: 8 },
  barR:     { x: 190, y: 288, w: 6,   h: 8 },
  barFill:  { x: 200, y: 288, w: 8,   h: 8 },
  expFill:  { x: 212, y: 288, w: 8,   h: 8 },
  sbTrack:  { x: 224, y: 288, w: 24,  h: 8 },
  sbHandle: { x: 252, y: 288, w: 12,  h: 8 },
};

// pixel batch accumulator → edit_sprite ops
function opsFor(layer) { return { layer_name: layer, operations: [] }; }
function pushRect(ops, r, x, y, w, h, color, fill = true) {
  ops.operations.push({ type: 'rectangle', x: r.x + x, y: r.y + y, width: w, height: h, color: hex(color), fill });
}
function pushPx(ops, pts, dx = 0, dy = 0) {
  if (!pts.length) return;
  for (let i = 0; i < pts.length; i += 2400) {
    ops.operations.push({
      type: 'pixels',
      pixels: pts.slice(i, i + 2400).map(p => ({ x: p.x + dx, y: p.y + dy, color: hex(p.c) })),
    });
  }
}
function pushLine(ops, r, x1, y1, x2, y2, color, t = 1) {
  ops.operations.push({ type: 'line', x1: r.x + x1, y1: r.y + y1, x2: r.x + x2, y2: r.y + y2, color: hex(color), thickness: t });
}
function pushEllipse(ops, r, cx, cy, rx, ry, color, fill = false) {
  ops.operations.push({ type: 'ellipse', center_x: r.x + cx, center_y: r.y + cy, radius_x: rx, radius_y: ry, color: hex(color), fill });
}

// dithered pixel batch for a rect region (ratio = share of speckles)
function dither(r, seed, ratio, c1, c2) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    if (rng() < ratio) pts.push({ x: r.x + x, y: r.y + y, c: rng() < 0.5 ? c1 : c2 });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Drawers
// ---------------------------------------------------------------------------
function drawPanel(o) {
  const r = L.panel9;
  // base + frame
  pushRect(o, r, 0, 0, r.w, r.h, C.stone1);
  pushRect(o, r, 0, 0, r.w, 1, C.black0);
  pushRect(o, r, 0, r.h - 1, r.w, 1, C.black0);
  pushRect(o, r, 0, 0, 1, r.h, C.black0);
  pushRect(o, r, r.w - 1, 0, 1, r.h, C.black0);
  // iron band
  pushRect(o, r, 1, 1, r.w - 2, 2, C.iron1);
  pushRect(o, r, 1, r.h - 3, r.w - 2, 2, C.iron1);
  pushRect(o, r, 1, 1, 2, r.h - 2, C.iron1);
  pushRect(o, r, r.w - 3, 1, 2, r.h - 2, C.iron1);
  pushLine(o, r, 3, 2, r.w - 4, 2, C.iron3);       // top bevel light
  pushLine(o, r, 3, r.h - 3, r.w - 4, r.h - 3, C.black1); // bottom shade
  pushRect(o, r, 3, 3, r.w - 6, r.h - 6, C.stone0); // inner field
  pushRect(o, r, 3, 3, r.w - 6, 1, C.black1);
  pushRect(o, r, 3, 3, 1, r.h - 6, C.black1);
  pushRect(o, r, 3, r.h - 4, r.w - 6, 1, C.stone2);
  pushRect(o, r, r.w - 4, 3, 1, r.h - 6, C.stone2);
  // speckle
  pushPx(o, dither({ ...r, x: 0, y: 0 }, 11, 0.05, C.stone2, C.stone0).filter(p =>
    p.x > 4 && p.x < r.w - 5 && p.y > 4 && p.y < r.h - 5));
  // gold corner plates
  const cornerPlate = (cx, cy, sx, sy) => {
    for (let k = 0; k < 7; k++) pushRect(o, r, cx + sx * k, cy + sy * 0, 1, 1, k === 0 ? C.gold0 : C.gold1);
    for (let k = 0; k < 7; k++) pushRect(o, r, cx + sx * 0, cy + sy * k, 1, 1, k === 0 ? C.gold0 : C.gold1);
    pushRect(o, r, cx + sx * 1, cy + sy * 1, 1, 1, C.gold2);
    pushRect(o, r, cx + sx * 2, cy + sy * 2, 1, 1, C.gold2);
    pushRect(o, r, cx + sx * 1, cy + sy * 2, 1, 1, C.gold0);
    pushRect(o, r, cx + sx * 2, cy + sy * 1, 1, 1, C.gold0);
    pushRect(o, r, cx + sx * 3, cy + sy * 3, 2, 2, C.gold3); // rivet
    pushRect(o, r, cx + sx * 3, cy + sy * 3, 1, 1, C.gold4);
  };
  cornerPlate(1, 1, 1, 1); cornerPlate(r.w - 2, 1, -1, 1);
  cornerPlate(1, r.h - 2, 1, -1); cornerPlate(r.w - 2, r.h - 2, -1, -1);
  // mid-edge rivets
  for (const [x, y] of [[r.w >> 1, 1], [r.w >> 1, r.h - 2], [1, r.h >> 1], [r.w - 2, r.h >> 1]]) {
    pushRect(o, r, x - 1, y, 3, 1, C.gold1);
    pushRect(o, r, x, y - (y === 1 ? 0 : 0), 1, 1, C.gold3);
  }
}

function drawTooltip(o) {
  const r = L.tooltip9;
  pushRect(o, r, 0, 0, r.w, r.h, C.black1);
  pushRect(o, r, 0, 0, r.w, 1, C.black0);
  pushRect(o, r, 0, r.h - 1, r.w, 1, C.black0);
  pushRect(o, r, 0, 0, 1, r.h, C.black0);
  pushRect(o, r, r.w - 1, 0, 1, r.h, C.black0);
  pushRect(o, r, 1, 1, r.w - 2, 1, C.gold1);
  pushRect(o, r, 1, r.h - 2, r.w - 2, 1, C.gold0);
  pushRect(o, r, 1, 1, 1, r.h - 2, C.gold1);
  pushRect(o, r, r.w - 2, 1, 1, r.h - 2, C.gold0);
  pushRect(o, r, 2, 2, r.w - 4, r.h - 4, C.black0);
  // tiny diamond top-left
  pushPx(o, [
    { x: 3, y: 4, c: C.gold2 }, { x: 4, y: 4, c: C.gold2 },
    { x: 3, y: 5, c: C.gold3 }, { x: 4, y: 5, c: C.gold3 }, { x: 5, y: 5, c: C.gold2 }, { x: 2, y: 5, c: C.gold2 },
    { x: 3, y: 6, c: C.gold2 }, { x: 4, y: 6, c: C.gold2 },
  ]);
}

function drawDivider(o) {
  const r = L.divider;
  const cy = 5;
  pushRect(o, r, 4, cy, r.w - 8, 1, C.gold1);
  pushRect(o, r, 4, cy + 1, r.w - 8, 1, C.black0);
  pushRect(o, r, 4, cy - 1, 3, 3, C.gold0);
  pushRect(o, r, r.w - 7, cy - 1, 3, 3, C.gold0);
  // center diamond
  const cx = r.w >> 1;
  pushPx(o, [
    { x: cx, y: cy - 4, c: C.gold2 }, { x: cx - 1, y: cy - 3, c: C.gold2 }, { x: cx + 1, y: cy - 3, c: C.gold2 },
    { x: cx - 2, y: cy - 2, c: C.gold2 }, { x: cx + 2, y: cy - 2, c: C.gold2 },
    { x: cx - 2, y: cy - 1, c: C.gold3 }, { x: cx + 2, y: cy - 1, c: C.gold3 },
    { x: cx - 1, y: cy, c: C.gold3 }, { x: cx, y: cy, c: C.blood2 }, { x: cx + 1, y: cy, c: C.gold3 },
    { x: cx - 2, y: cy, c: C.gold2 }, { x: cx + 2, y: cy, c: C.gold2 },
    { x: cx - 1, y: cy + 1, c: C.gold2 }, { x: cx + 1, y: cy + 1, c: C.gold2 },
    { x: cx, y: cy + 2, c: C.gold1 },
    { x: cx - 3, y: cy, c: C.gold0 }, { x: cx + 3, y: cy, c: C.gold0 },
  ]);
}

function drawCorner(o) {
  const r = L.corner;
  // quarter arch (top-left orientation)
  const arc = [
    [2, 9], [2, 10], [3, 7], [3, 8], [4, 6], [5, 5], [6, 4], [7, 3], [8, 3], [9, 2], [10, 2],
  ];
  for (const [x, y] of arc) { pushPx(o, [{ x, y, c: C.gold2 }, { x, y: y + 1, c: C.gold0 }]); }
  pushPx(o, [{ x: 3, y: 9, c: C.gold3 }, { x: 4, y: 7, c: C.gold3 }, { x: 6, y: 5, c: C.gold3 }]);
  pushPx(o, [{ x: 10, y: 1, c: C.gold1 }, { x: 1, y: 10, c: C.gold1 }]);
  // curl
  pushPx(o, [{ x: 12, y: 3, c: C.gold1 }, { x: 13, y: 4, c: C.gold1 }, { x: 13, y: 5, c: C.gold2 }, { x: 12, y: 6, c: C.gold2 }]);
  pushPx(o, [{ x: 3, y: 12, c: C.gold1 }, { x: 4, y: 13, c: C.gold1 }, { x: 5, y: 13, c: C.gold2 }, { x: 6, y: 12, c: C.gold2 }]);
  pushRect(o, r, 2, 2, 2, 2, C.gold3);
  pushRect(o, r, 2, 2, 1, 1, C.gold4);
}

function drawCursor(o) {
  const r = L.cursor;
  const map = [
    '...............oo...',
    '..............osso..',
    '.............ossso..',
    '............ossso...',
    '...........ossso....',
    '..........ossso.....',
    '.........ossso......',
    '........ossso.......',
    '.......ossso........',
    '......ossso.........',
    '.....ossso..........',
    '....gossso..........',
    '...ggosso...........',
    '..gg.ggso...........',
    '.gg...gg............',
    'gg.....g............',
    '....................',
    '....................',
  ];
  drawMap(o, r, map, { o: C.black0, s: C.steel3, g: C.gold2 });
}

function drawButton(o, r, kind) {
  const face = kind === 'hover' ? C.iron1 : kind === 'pressed' ? C.black1 : C.iron0;
  pushRect(o, r, 0, 0, r.w, r.h, C.black0);
  pushRect(o, r, 1, 1, r.w - 2, r.h - 2, face);
  // vertical shading
  pushRect(o, r, 2, 2, r.w - 4, 3, kind === 'pressed' ? C.iron0 : C.iron2);
  pushRect(o, r, 2, r.h - 5, r.w - 4, 3, kind === 'pressed' ? C.black0 : C.iron0);
  if (kind === 'hover') {
    pushRect(o, r, 2, 2, r.w - 4, 1, C.gold2);
    pushPx(o, dither({ x: r.x + 2, y: r.y + 3, w: r.w - 4, h: r.h - 6 }, 77, 0.04, C.gold1, C.gold0));
  } else {
    pushPx(o, dither({ x: r.x + 2, y: r.y + 3, w: r.w - 4, h: r.h - 6 }, 55, 0.04, C.iron1, C.black1));
  }
  // bevel
  if (kind === 'pressed') {
    pushLine(o, r, 1, 1, r.w - 2, 1, C.black0);
    pushLine(o, r, 1, 1, 1, r.h - 2, C.black0);
    pushLine(o, r, 2, r.h - 2, r.w - 2, r.h - 2, C.iron2);
    pushLine(o, r, r.w - 2, 2, r.w - 2, r.h - 2, C.iron1);
  } else {
    pushLine(o, r, 2, 2, r.w - 3, 2, kind === 'hover' ? C.gold3 : C.iron3);
    pushLine(o, r, 2, 2, 2, r.h - 3, kind === 'hover' ? C.gold3 : C.iron3);
    pushLine(o, r, 2, r.h - 3, r.w - 3, r.h - 3, C.black0);
    pushLine(o, r, r.w - 3, 2, r.w - 3, r.h - 3, C.black0);
  }
  // gold inner hairline
  pushRect(o, r, 4, 4, r.w - 8, 1, kind === 'pressed' ? C.gold0 : C.gold1);
  pushRect(o, r, 4, r.h - 5, r.w - 8, 1, kind === 'pressed' ? C.gold0 : C.gold0);
  pushRect(o, r, 4, 4, 1, r.h - 8, kind === 'pressed' ? C.gold0 : C.gold1);
  pushRect(o, r, r.w - 5, 4, 1, r.h - 8, kind === 'pressed' ? C.gold0 : C.gold0);
  // corner notches
  pushPx(o, [
    { x: 1, y: 1, c: C.black0 }, { x: r.w - 2, y: 1, c: C.black0 },
    { x: 1, y: r.h - 2, c: C.black0 }, { x: r.w - 2, y: r.h - 2, c: C.black0 },
  ]);
  // gem studs on hover
  if (kind === 'hover') {
    pushPx(o, [
      { x: 7, y: r.h - 7, c: C.blood3 }, { x: 7, y: r.h - 8, c: C.blood2 },
      { x: r.w - 8, y: r.h - 7, c: C.blood3 }, { x: r.w - 8, y: r.h - 8, c: C.blood2 },
    ]);
  }
}

function drawOrb(o, r, P) {
  // P = {rim, rimHi, glass, glassDark, glassDeep, hi, hiSoft, spark}
  const cx = 36, cy = 33, R = 30;
  // outer iron ring
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const d = Math.hypot(x - cx, y - cy);
    let c = null;
    if (d <= R + 4.5 && d > R + 2.5) c = C.black0;
    else if (d > R && d <= R + 2.5) c = (x + y) % 9 < 2 ? P.rim : P.rimHi; // banded metal
    else if (d <= R) c = P.glassDeep;
    if (c) pushPx(o, [{ x: r.x + x, y: r.y + y, c }]);
  }
  // glass inner shading: bottom-heavy dark, top-left sheen
  const pts = [];
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const dx = (x - cx) / R, dy = (y - cy) / R;
    const d = Math.hypot(dx, dy);
    if (d > 1) continue;
    const ang = Math.atan2(dy, dx);
    let c = null;
    if (d > 0.82) c = P.glassDark;                       // inner rim
    else if (ang < -0.5 && ang > -2.2 && d > 0.45) c = P.hiSoft; // top-left sheen band
    if (c) pts.push({ x: r.x + x, y: r.y + y, c });
  }
  pushPx(o, pts);
  // crescent highlight
  const hl = [];
  for (let t = 0; t < 40; t++) {
    const a = -2.6 + (t / 40) * 1.5;
    const x = Math.round(cx + Math.cos(a) * R * 0.74);
    const y = Math.round(cy + Math.sin(a) * R * 0.74);
    hl.push({ x: r.x + x, y: r.y + y, c: P.hi });
    if (t % 4 === 0) hl.push({ x: r.x + x - 1, y: r.y + y + 1, c: P.hiSoft });
  }
  pushPx(o, hl);
  // sparkle
  pushPx(o, [
    { x: r.x + 20, y: r.y + 16, c: P.spark }, { x: r.x + 21, y: r.y + 16, c: P.spark },
    { x: r.x + 20, y: r.y + 17, c: P.spark }, { x: r.x + 21, y: r.y + 17, c: P.spark },
    { x: r.x + 22, y: r.y + 18, c: P.hiSoft },
  ]);
  // holder claws (bottom)
  pushPx(o, [
    { x: r.x + 28, y: r.y + 62, c: C.gold1 }, { x: r.x + 29, y: r.y + 63, c: C.gold0 },
    { x: r.x + 30, y: r.y + 64, c: C.gold0 }, { x: r.x + 31, y: r.y + 64, c: C.gold0 },
    { x: r.x + 32, y: r.y + 64, c: C.gold0 }, { x: r.x + 33, y: r.y + 63, c: C.gold0 },
    { x: r.x + 34, y: r.y + 62, c: C.gold1 },
    { x: r.x + 31, y: r.y + 65, c: C.gold2 }, { x: r.x + 32, y: r.y + 65, c: C.gold2 },
  ]);
  // top finial
  pushPx(o, [
    { x: r.x + 31, y: r.y + 0, c: C.gold2 }, { x: r.x + 31, y: r.y + 1, c: C.gold1 },
    { x: r.x + 30, y: r.y + 1, c: C.gold1 },
  ]);
}

function drawSlot(o, r, kind) {
  pushRect(o, r, 0, 0, r.w, r.h, C.black0);
  pushRect(o, r, 1, 1, r.w - 2, r.h - 2, kind === 'hov' ? '#1a120c' : C.black1);
  const b = kind === 'sel' ? C.gold3 : kind === 'hov' ? C.gold2 : C.iron1;
  const bD = kind === 'sel' ? C.gold1 : kind === 'hov' ? C.gold0 : C.iron0;
  pushRect(o, r, 1, 1, r.w - 2, 1, b);
  pushRect(o, r, 1, 1, 1, r.h - 2, b);
  pushRect(o, r, 1, r.h - 2, r.w - 2, 1, bD);
  pushRect(o, r, r.w - 2, 1, 1, r.h - 2, bD);
  // inner hairline
  pushRect(o, r, 3, 3, r.w - 6, 1, kind === 'hov' ? C.gold0 : C.black0);
  pushRect(o, r, 3, r.h - 4, r.w - 6, 1, kind === 'sel' ? C.blood1 : C.black0);
  pushRect(o, r, 3, 3, 1, r.h - 6, kind === 'hov' ? C.gold0 : C.black0);
  pushRect(o, r, r.w - 4, 3, 1, r.h - 6, C.black0);
  // rivets
  pushPx(o, [
    { x: 2, y: 2, c: C.gold1 }, { x: r.w - 3, y: 2, c: C.gold1 },
    { x: 2, y: r.h - 3, c: C.gold1 }, { x: r.w - 3, y: r.h - 3, c: C.gold1 },
  ]);
  if (kind === 'sel') {
    pushPx(o, dither({ x: r.x + 4, y: r.y + 4, w: r.w - 8, h: r.h - 8 }, 9, 0.05, C.blood1, C.blood0));
  }
}

function drawBar(o, r, kind) {
  // 8-high caps/mids; groove with metal edge
  pushRect(o, r, 0, 0, r.w, 1, C.black0);
  pushRect(o, r, 0, r.h - 1, r.w, 1, C.black0);
  pushRect(o, r, 0, 1, r.w, 1, C.iron1);
  pushRect(o, r, 0, r.h - 2, r.w, 1, C.iron1);
  pushRect(o, r, 0, 2, r.w, r.h - 4, C.black1);
  if (kind === 'L') { pushRect(o, r, 0, 1, 1, r.h - 2, C.gold2); pushRect(o, r, 1, 2, 1, r.h - 4, C.gold0); }
  if (kind === 'R') { pushRect(o, r, r.w - 1, 1, 1, r.h - 2, C.gold0); }
  if (kind === 'fill') { // life-red liquid
    pushRect(o, r, 0, 2, r.w, r.h - 4, C.blood1);
    pushRect(o, r, 0, 2, r.w, 1, C.blood3);
    pushRect(o, r, 0, r.h - 3, r.w, 1, C.blood0);
  }
  if (kind === 'exp') { // golden liquid
    pushRect(o, r, 0, 2, r.w, r.h - 4, C.gold0);
    pushRect(o, r, 0, 2, r.w, 1, C.gold2);
  }
}

function drawScrollbar(o, r, kind) {
  pushRect(o, r, 0, 0, r.w, r.h, C.black0);
  pushRect(o, r, 0, 0, r.w, 1, C.iron1);
  pushRect(o, r, 0, r.h - 1, r.w, 1, C.iron1);
  if (kind === 'track') {
    for (let x = 2; x < r.w; x += 4) pushRect(o, r, x, 3, 2, 2, C.iron0);
  } else {
    pushRect(o, r, 1, 1, r.w - 2, r.h - 2, C.iron1);
    pushRect(o, r, 1, 1, r.w - 2, 1, C.iron3);
    pushRect(o, r, r.w >> 1, 3, 2, 2, C.gold2);
  }
}

// --- icons from ASCII maps (18×18) ------------------------------------------
function drawMap(o, r, map, legend) {
  const pts = [];
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = legend[ch];
      if (c) pts.push({ x: r.x + x, y: r.y + y, c });
    }
  });
  pushPx(o, pts);
}

const ICON_HP = [
  '......oo..........',
  '.....oggo.........',
  '......oo..........',
  '.....oggo.........',
  '....ogRRgo........',
  '...ogRrrRgo.......',
  '..ogrRrrRrgo......',
  '..orRrrrrrRo......',
  '..orRrrrrrRo......',
  '..orrrRrrrro......',
  '..orrrrrrrro......',
  '..oRrrrrrrRo......',
  '..oRRrrrrRRo......',
  '...oRRRRRRo.......',
  '....oooooo........',
  '..................',
  '..................',
  '..................',
];
const ICON_MP = [
  '......oo..........',
  '.....oggo.........',
  '......oo..........',
  '.....oggo.........',
  '....ogBBo.........',
  '...ogBbbBgo.......',
  '..obBbbbBbbo......',
  '..obBbbbbbbo......',
  '..obbbbbbbbo......',
  '..obbbBbbbbo......',
  '..obbbbbbbbo......',
  '..oBbbbbbbBo......',
  '..oBBbbbbBBo......',
  '...oBBBBBBo.......',
  '....oooooo........',
  '..................',
  '..................',
  '..................',
];
const ICON_SWORD = [
  '...............oo',
  '..............oss',
  '.............oss.',
  '............oss..',
  '...........oss...',
  '..........oss....',
  '.........oss.....',
  '........oss......',
  '.......oss.......',
  '......oss........',
  '.....oss.........',
  '..g.oss..........',
  '..ggss...........',
  '.ggoggo..........',
  'gg..oggo.........',
  'g....ogo.........',
  '......o..........',
  '..................',
];
const ICON_SHIELD = [
  '..................',
  '....oooooooooo....',
  '...oggggggggggo...',
  '...oggosssssggo...',
  '...ossossssosso...',
  '...ossosrssosso...',
  '...ossoossoosso...',
  '...osssooooossso..',
  '...ossssoosssso...',
  '....ossssosssso...',
  '....ossssosssso...',
  '.....osssosssso...',
  '.....osssoossso...',
  '......ossoosso....',
  '.......ossooso....',
  '........oooooo....',
  '..........oo......',
  '..................',
];
const ICON_SKULL = [
  '..................',
  '.....oooooo.......',
  '....obbbbbbo......',
  '...obbbbbbibo.....',
  '..obbibbbbibbo....',
  '..obbibbbbibbo....',
  '..obbbbbbbbbbo....',
  '..obbbobbobbbo....',
  '..obbbbbbbbbbo....',
  '...obbobbobbo.....',
  '...oboooooobo.....',
  '...obo.ob.obo.....',
  '...obo.ob.obo.....',
  '....o..oo..o......',
  '..................',
  '..................',
  '..................',
  '..................',
];
const ICON_SCROLL = [
  '..................',
  '..oooooooooo......',
  '.opppppppppppo....',
  '.opo.o.o.o.opo....',
  '.opppppppppppo....',
  '.opo.o.o.o.opo....',
  '.opppppppppppo....',
  '.opo.o.o.o.opo....',
  '.opppppppppppo....',
  '.opo.o.o.o.opo....',
  '.opppppppppppo....',
  '.opppppppppppo....',
  '.ogggggggggggo....',
  '..oooooooooo......',
  '..................',
  '..................',
  '..................',
  '..................',
];

async function edit(layer, fn, ...args) {
  const o = { filename: FILE, ...opsFor(layer) };
  fn(o, ...args);
  await call('edit_sprite', o);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------
console.log('◆ Generating D2 UI atlas via aseprite-mcp →', FILE);

await call('create_canvas', { width: 512, height: 384, filename: FILE });

await call('set_palette', {
  filename: FILE,
  colors: Object.values(C),
});

for (const name of ['misc', 'stone', 'buttons', 'orbs', 'slots', 'icons']) {
  await call('add_layer', { filename: FILE, name, opacity: 255 });
}

// --- stone group ------------------------------------------------------------
await edit('stone', drawPanel);
await edit('stone', drawTooltip);
await edit('stone', drawDivider);
await edit('stone', drawCorner);

// --- buttons ----------------------------------------------------------------
await edit('buttons', drawButton, L.btnNormal, 'normal');
await edit('buttons', drawButton, L.btnHover, 'hover');
await edit('buttons', drawButton, L.btnPress, 'pressed');

// --- orbs -------------------------------------------------------------------
await edit('orbs', drawOrb, L.orbHp, {
  rim: C.gold1, rimHi: C.gold2, glassDeep: C.blood0, glassDark: C.blood0,
  hi: C.blood3, hiSoft: C.blood1, spark: C.blood4,
});
await edit('orbs', drawOrb, L.orbMp, {
  rim: C.gold1, rimHi: C.gold2, glassDeep: C.mana0, glassDark: C.mana0,
  hi: C.mana3, hiSoft: C.mana1, spark: C.mana4,
});

// --- slots ------------------------------------------------------------------
await edit('slots', drawSlot, L.slot, 'n');
await edit('slots', drawSlot, L.slotHov, 'hov');
await edit('slots', drawSlot, L.slotSel, 'sel');

// --- icons ------------------------------------------------------------------
await edit('icons', drawMap, L.iconHp, ICON_HP,
  { o: C.black0, g: C.gold2, r: C.blood3, R: C.blood2 });
await edit('icons', drawMap, L.iconMp, ICON_MP,
  { o: C.black0, g: C.gold2, b: C.mana3, B: C.mana2 });
await edit('icons', drawMap, L.iconSword, ICON_SWORD,
  { o: C.black0, s: C.steel3, g: C.gold2 });
await edit('icons', drawMap, L.iconShield, ICON_SHIELD,
  { o: C.black0, g: C.gold2, s: C.steel2, r: C.blood3 });
await edit('icons', drawMap, L.iconSkull, ICON_SKULL,
  { o: C.black0, b: C.bone, i: C.black2 });
await edit('icons', drawMap, L.iconScroll, ICON_SCROLL,
  { o: C.black0, p: C.parch1, g: C.gold1 });

// --- misc: bars, scrollbar, cursor ------------------------------------------
await edit('misc', drawBar, L.barL, 'L');
await edit('misc', drawBar, L.barM, 'M');
await edit('misc', drawBar, L.barR, 'R');
await edit('misc', drawBar, L.barFill, 'fill');
await edit('misc', drawBar, L.expFill, 'exp');
await edit('misc', drawScrollbar, L.sbTrack, 'track');
await edit('misc', drawScrollbar, L.sbHandle, 'handle');
await edit('misc', drawCursor);

// --- slices (9-patch metadata for the lab) via Lua escape hatch -------------
const sliceLua = `
local spr = app.activeSprite or app.open("${FILE}")
if not spr then error("no sprite") end
local function sl(name, x, y, w, h, c9)
  local s = spr:newSlice(1)
  s.name = name
  s.bounds = Rectangle(x, y, w, h)
  if c9 then s.center = Rectangle(c9[1], c9[2], c9[3], c9[4]) end
end
sl("panel9", ${L.panel9.x}, ${L.panel9.y}, ${L.panel9.w}, ${L.panel9.h}, {16, 16, ${L.panel9.w - 32}, ${L.panel9.h - 32}})
sl("tooltip9", ${L.tooltip9.x}, ${L.tooltip9.y}, ${L.tooltip9.w}, ${L.tooltip9.h}, {8, 8, ${L.tooltip9.w - 16}, ${L.tooltip9.h - 16}})
sl("btn_normal", ${L.btnNormal.x}, ${L.btnNormal.y}, ${L.btnNormal.w}, ${L.btnNormal.h}, {6, 6, ${L.btnNormal.w - 12}, ${L.btnNormal.h - 12}})
sl("btn_hover", ${L.btnHover.x}, ${L.btnHover.y}, ${L.btnHover.w}, ${L.btnHover.h}, {6, 6, ${L.btnHover.w - 12}, ${L.btnHover.h - 12}})
sl("btn_pressed", ${L.btnPress.x}, ${L.btnPress.y}, ${L.btnPress.w}, ${L.btnPress.h}, {6, 6, ${L.btnPress.w - 12}, ${L.btnPress.h - 12}})
sl("divider", ${L.divider.x}, ${L.divider.y}, ${L.divider.w}, ${L.divider.h})
sl("corner", ${L.corner.x}, ${L.corner.y}, ${L.corner.w}, ${L.corner.h})
sl("cursor", ${L.cursor.x}, ${L.cursor.y}, ${L.cursor.w}, ${L.cursor.h})
sl("orb_hp", ${L.orbHp.x}, ${L.orbHp.y}, ${L.orbHp.w}, ${L.orbHp.h})
sl("orb_mp", ${L.orbMp.x}, ${L.orbMp.y}, ${L.orbMp.w}, ${L.orbMp.h})
sl("slot", ${L.slot.x}, ${L.slot.y}, ${L.slot.w}, ${L.slot.h})
sl("slot_hover", ${L.slotHov.x}, ${L.slotHov.y}, ${L.slotHov.w}, ${L.slotHov.h})
sl("slot_selected", ${L.slotSel.x}, ${L.slotSel.y}, ${L.slotSel.w}, ${L.slotSel.h})
sl("icon_hp", ${L.iconHp.x}, ${L.iconHp.y}, ${L.iconHp.w}, ${L.iconHp.h})
sl("icon_mp", ${L.iconMp.x}, ${L.iconMp.y}, ${L.iconMp.w}, ${L.iconMp.h})
sl("icon_sword", ${L.iconSword.x}, ${L.iconSword.y}, ${L.iconSword.w}, ${L.iconSword.h})
sl("icon_shield", ${L.iconShield.x}, ${L.iconShield.y}, ${L.iconShield.w}, ${L.iconShield.h})
sl("icon_skull", ${L.iconSkull.x}, ${L.iconSkull.y}, ${L.iconSkull.w}, ${L.iconSkull.h})
sl("icon_scroll", ${L.iconScroll.x}, ${L.iconScroll.y}, ${L.iconScroll.w}, ${L.iconScroll.h})
sl("bar_cap_l", ${L.barL.x}, ${L.barL.y}, ${L.barL.w}, ${L.barL.h})
sl("bar_mid", ${L.barM.x}, ${L.barM.y}, ${L.barM.w}, ${L.barM.h})
sl("bar_cap_r", ${L.barR.x}, ${L.barR.y}, ${L.barR.w}, ${L.barR.h})
sl("bar_fill", ${L.barFill.x}, ${L.barFill.y}, ${L.barFill.w}, ${L.barFill.h})
sl("exp_fill", ${L.expFill.x}, ${L.expFill.y}, ${L.expFill.w}, ${L.expFill.h})
sl("sb_track", ${L.sbTrack.x}, ${L.sbTrack.y}, ${L.sbTrack.w}, ${L.sbTrack.h})
sl("sb_handle", ${L.sbHandle.x}, ${L.sbHandle.y}, ${L.sbHandle.w}, ${L.sbHandle.h})
spr:saveAs("${FILE}")
print("slices ok")
`;
await call('script_execute', { lua_code: sliceLua });

// --- info + export ----------------------------------------------------------
await call('get_sprite_info', { filename: FILE }, true);
await call('spritesheet_export', {
  filename: FILE,
  output_sheet: `${ASSETS}/atlas.png`,
  output_data: `${ASSETS}/atlas.json`,
  sheet_type: 'horizontal',
  data_format: 'json_hash',
}, true);

console.log('◆ done');
proc.kill();
process.exit(0);
