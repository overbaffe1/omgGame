// smoke.mjs : the gate. Loads the film in Node against a recording mock canvas
// and renders frames from every shot. Fails on any drawing error, timeline gap
// or nondeterminism (same T must produce the same command stream).
//
//   node tools/smoke.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const FILES = [
  'src/engine.js',
  'src/lib.js',
  'src/timeline.js',
  'src/scenes/01-title-surface.js',
  'src/scenes/02-sunbeams.js',
  'src/scenes/03-reef.js',
  'src/scenes/04-descent.js',
  'src/scenes/05-jelly-bloom.js',
  'src/scenes/06-depth-chart.js',
  'src/scenes/07-angler-chart.js',
  'src/scenes/08-anglerfish.js',
  'src/scenes/09-whale-fall.js',
  'src/scenes/10-vent.js',
  'src/scenes/11-trench.js',
  'src/scenes/12-credits.js',
  'src/music.js',
  'src/player.js',
];

// -----------------------------------------------------------------------
// mock canvas
// -----------------------------------------------------------------------

function mockCtx(rec) {
  const gradient = () => ({ addColorStop() {} });
  const target = {
    canvas: { width: 0, height: 0 },
    measureText: (s) => ({ width: String(s).length * 11 }),
    createLinearGradient: () => gradient(),
    createRadialGradient: () => gradient(),
    createPattern: () => ({}),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
    getLineDash: () => [],
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      // any method: record + no-op
      return (...args) => {
        let h = 2166136261;
        const mix = (v) => {
          h = Math.imul(h ^ (typeof v === 'number' ? (v * 1000) | 0 : String(v).length), 16777619);
        };
        mix(prop);
        for (const a of args) mix(a);
        rec.hash = Math.imul(rec.hash ^ h, 16777619);
        rec.ops++;
        return undefined;
      };
    },
    set(t, prop, v) {
      t[prop] = v;
      return true;
    },
  });
}

function mockDocument() {
  return {
    readyState: 'complete',
    currentScript: null,
    getElementById: () => null,
    createElement(tag) {
      const rec = { ops: 0, hash: 0 };
      const ctx = mockCtx(rec);
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ctx,
        addEventListener() {},
      };
      return canvas;
    },
    addEventListener() {},
  };
}

// -----------------------------------------------------------------------
// run
// -----------------------------------------------------------------------

const rec = { ops: 0, hash: 0 };
const ctx = mockCtx(rec);
const canvas = { width: 0, height: 0, getContext: () => ctx, addEventListener() {} };

const sandbox = {
  console,
  Math,
  Date,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Error,
  Promise,
  Uint8ClampedArray,
  isFinite,
  parseFloat,
  parseInt,
  requestAnimationFrame: () => 0,
  devicePixelRatio: 1,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = mockDocument();
sandbox.AudioContext = undefined;
sandbox.OfflineAudioContext = undefined;

vm.createContext(sandbox);

let failed = false;
const problems = [];
function fail(msg) {
  failed = true;
  problems.push(msg);
  console.error('FAIL ' + msg);
}

for (const f of FILES) {
  try {
    vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox, { filename: f });
  } catch (e) {
    fail(`${f}: load error: ${e.stack || e}`);
  }
}

const FILM = sandbox.FILM;
if (!FILM) {
  fail('FILM global missing');
} else {
  // --- timeline integrity ---
  const p = FILM.prepare();
  let prevEnd = 0;
  for (const s of p.shots) {
    if (s.start > prevEnd + 1e-6) fail(`gap before shot ${s.id}: ${prevEnd} -> ${s.start}`);
    if (s.start < prevEnd - 1e-6) fail(`overlap at shot ${s.id}: ${prevEnd} -> ${s.start}`);
    if (s.end <= s.start) fail(`shot ${s.id} has no duration`);
    if (!FILM.registry[s.id]) fail(`scene not registered for shot ${s.id}`);
    prevEnd = s.end;
  }
  if (Math.abs(prevEnd - FILM.TIMELINE.duration) > 1e-6) {
    fail(`TIMELINE.duration ${FILM.TIMELINE.duration} != shots end ${prevEnd}`);
  }
  for (const id of Object.keys(FILM.registry)) {
    if (!p.shots.some((s) => s.id === id)) fail(`scene '${id}' is registered but not in the timeline`);
  }

  // --- render every shot at 5 phases + boundaries ---
  FILM.attach(canvas);
  FILM.strict = true;
  FILM.errors.length = 0;

  for (const s of p.shots) {
    const phases = [0, 0.13, 0.5, 0.87, 0.999];
    for (const ph of phases) {
      const T = s.start + ph * s.dur;
      const rec0 = { ops: rec.ops, hash: rec.hash };
      try {
        FILM.renderFrame(T);
      } catch (e) {
        fail(`shot ${s.id} @ T=${T.toFixed(2)}: ${e.stack || e}`);
      }
      if (rec.ops - rec0.ops < 20) fail(`shot ${s.id} @ T=${T.toFixed(2)}: almost nothing drawn`);
    }
  }
  // boundaries + head/tail
  for (const T of [0, 0.05, 1e-3, ...p.shots.map((s) => s.start), p.duration - 0.02]) {
    try {
      FILM.renderFrame(T);
    } catch (e) {
      fail(`boundary T=${T}: ${e.stack || e}`);
    }
  }

  // --- determinism: same T twice must hash identically ---
  const probe = 7.25;
  const h1 = rec.hash;
  const ops1 = rec.ops;
  const recA = { ops: 0, hash: 0 };
  const ctxA = mockCtx(recA);
  FILM.ctx = ctxA;
  FILM.renderFrame(probe);
  const recB = { ops: 0, hash: 0 };
  FILM.ctx = mockCtx(recB);
  FILM.renderFrame(probe);
  if (recA.hash !== recB.hash || recA.ops !== recB.ops) {
    fail(`nondeterministic render at T=${probe}: ${recA.hash} vs ${recB.hash}`);
  }
  if (FILM.errors.length) {
    for (const e of FILM.errors.slice(0, 6)) fail(`render error @ T=${e.T} shot=${e.shot}: ${e.message}`);
  }
  void h1;
  void ops1;

  console.log(
    `shots=${p.shots.length} duration=${p.duration}s frames rendered, ops/frame~${Math.round(recA.ops)}`
  );
}

if (failed) {
  console.error(`smoke: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log('smoke: OK');
