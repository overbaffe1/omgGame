/* Смоук-тест лабы без браузера: поднимает lab.js в заглушках DOM/Canvas
 * и прогоняет несколько кадров рендера + клики по виджетам.
 *   node darkui/mcp/lab-smoke.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ATLAS_DIR = path.join(ROOT, 'atlas');

function makeCtx() {
  const noop = () => {};
  return {
    imageSmoothingEnabled: false,
    globalAlpha: 1,
    fillStyle: '', strokeStyle: '', font: '', textBaseline: '',
    drawImage: noop, fillRect: noop, strokeRect: noop, clearRect: noop,
    beginPath: noop, arc: noop, clip: noop, save: noop, restore: noop, rect: noop,
    measureText: (s) => ({ width: String(s).length * 6 }),
    fillText: noop,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
  };
}
function makeCanvas(w, h) {
  const el = makeEl('canvas');
  el.width = w; el.height = h;
  el.getContext = () => makeCtx();
  el.toDataURL = () => 'data:image/png;base64,';
  return el;
}
function makeEl(tag) {
  const el = {
    tag, style: {}, dataset: {}, children: [],
    classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
    listeners: {},
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    appendChild(c) { this.children.push(c); return c; },
    querySelector() { return makeEl('div'); },
    querySelectorAll() { return []; },
    insertAdjacentHTML: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }),
    set textContent(v) { this._text = v; }, get textContent() { return this._text || ''; },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
    value: '100',
  };
  return el;
}

const elements = {};
function el(id) {
  if (!elements[id]) {
    const e = id === 'stage' || id === 'sheetView' || id === 'playView' ? makeCanvas(640, 480) : makeEl('div');
    elements[id] = e;
  }
  return elements[id];
}

let rafQueue = [];
const winL = {};
const sandbox = {
  console,
  Math, JSON, Object, Array, String, Number, Map, Set, Uint8ClampedArray,
  setTimeout: (f) => 0, setInterval: () => 0, clearTimeout: () => {}, clearInterval: () => {},
  requestAnimationFrame: (f) => { rafQueue.push(f); return rafQueue.length; },
  document: {
    querySelector: (s) => el(s.replace(/^#/, '')),
    querySelectorAll: () => [],
    createElement: (t) => (t === 'canvas' ? makeCanvas(8, 8) : makeEl(t)),
    head: { appendChild: () => {} },
    body: { insertAdjacentHTML: (where, html) => { throw new Error('boot error: ' + html.slice(0, 400)); } },
  },
  window: { addEventListener: (t, f) => { (winL[t] = winL[t] || []).push(f); } },
  Image: class { constructor() { this.width = 1024; this.height = 320; } decode() { return Promise.resolve(); } },
  fetch: async (url) => {
    const p = path.join(ROOT, url.replace(/^atlas\//, 'atlas/'));
    const body = fs.readFileSync(p, 'utf-8');
    return { json: async () => JSON.parse(body), text: async () => body };
  },
};
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);

const src = fs.readFileSync(path.join(ROOT, 'lab.js'), 'utf-8');
try {
  vm.runInContext(src, sandbox, { filename: 'lab.js' });
} catch (e) {
  console.error('ОШИБКА ВЫПОЛНЕНИЯ lab.js:', e);
  process.exit(1);
}

// крутим кадры рендера
(async () => {
  await new Promise((r) => setTimeout(r, 50));
  let now = 0;
  for (let i = 0; i < 120; i++) {
    const q = rafQueue; rafQueue = [];
    now += 16;
    for (const f of q) f(now);
  }
  // симулируем мышь: наведение, клик по кнопке, драг предмета
  const stage = el('stage');
  const fire = (t, x, y) => (stage.listeners[t] || []).forEach((f) => f({ clientX: x, clientY: y }));
  fire('mousemove', 424, 220);            // кнопка АТАКА
  fire('mousedown', 424, 220);
  (sandbox.windowListeners = null);
  fire('mousemove', 70, 120);             // ячейка инвентаря с мечом
  fire('mousedown', 70, 120);
  fire('mousemove', 166, 120);
  (winL['mouseup'] || []).forEach((f) => f({ clientX: 166, clientY: 120 }));
  fire('mousemove', 424, 220);
  (winL['mouseup'] || []).forEach((f) => f({ clientX: 424, clientY: 220 }));
  for (let i = 0; i < 30; i++) { const q = rafQueue; rafQueue = []; now += 16; for (const f of q) f(now); }
  console.log('SMOKE OK: 150 кадров рендера, наведения и драг прошли без исключений');
})().catch((e) => { console.error('ОШИБКА В ЦИКЛЕ:', e); process.exit(1); });
