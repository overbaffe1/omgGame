/*
 * engine.js : the FILM runtime for «ГЛУБИНА» / THE DEEP.
 *
 * Load order everywhere: engine.js, lib.js, timeline.js, scenes (sorted),
 * music.js, player.js.
 *
 * Defines window.FILM: the scene registry, the timeline reader, renderFrame(T),
 * transitions between shots and the global post pass (boiling grain + vignette).
 *
 * Rules for scene code:
 *   - draw(t, info) is a pure function of time. No state carried between frames.
 *   - Use ctx.save()/ctx.restore(). Never call ctx.setTransform with absolute
 *     values: the base transform carries the render scale (FILM.S).
 *   - Randomness only from FILM.lib.rng(seed) / FILM.lib.hash(...).
 *   - FILM.lib is frozen. Copy before changing anything.
 */
(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : globalThis;
  const FILM = (root.FILM = root.FILM || {});

  // Frame size: the vertical film.
  FILM.W = 1080;
  FILM.H = 1920;
  FILM.FPS = 24;
  FILM.BOIL_FPS = 12; // grain re-rolls twice per film frame
  FILM.S = 1; // render scale: device pixels per logical pixel
  FILM.registry = {}; // id -> scene definition
  FILM.registered = []; // [{ id }] in registration order
  FILM.errors = []; // drawing errors collected by renderFrame
  FILM.strict = false; // tools set true: renderFrame rethrows after recording
  FILM.canvas = null;
  FILM.ctx = null;

  // Global time of the frame being drawn. Read-only for scenes.
  let frameT = 0;
  Object.defineProperty(FILM, 'frameT', {
    get: () => frameT,
    enumerable: true,
    configurable: false,
  });

  // Small self-contained hash so core never depends on lib being healthy.
  function ihash(a, b, c) {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // -----------------------------------------------------------------------
  // Scene registry
  // -----------------------------------------------------------------------

  FILM.scene = function scene(def) {
    if (!def || typeof def.id !== 'string' || !def.id || typeof def.draw !== 'function') {
      const msg = 'FILM.scene() needs { id: string, draw: function }';
      FILM.errors.push({ T: null, shot: def && def.id, message: msg });
      if (typeof console !== 'undefined') console.error(msg);
      return def;
    }
    if (FILM.registry[def.id]) {
      const msg = "duplicate scene id '" + def.id + "'";
      FILM.errors.push({ T: null, shot: def.id, message: msg });
      if (typeof console !== 'undefined') console.error(msg);
    }
    FILM.registry[def.id] = def;
    FILM.registered.push({ id: def.id });
    return def;
  };

  // -----------------------------------------------------------------------
  // Timeline
  // -----------------------------------------------------------------------

  function normTransition(tr) {
    if (!tr) return null;
    if (typeof tr === 'string') tr = { kind: tr };
    const kind = String(tr.kind || tr.type || 'cut').toLowerCase();
    const dur = Number(tr.dur != null ? tr.dur : tr.duration != null ? tr.duration : 0.25);
    return Object.assign({}, tr, { kind, dur: Math.max(0, dur) });
  }

  // Accepts start/end or dur-chained shots; writes normalised start/end/dur back.
  let prepared = null;
  function prepare() {
    const tl = FILM.TIMELINE;
    if (!tl) throw new Error('FILM.TIMELINE is not defined: timeline.js did not load');
    const shots = tl.shots || [];
    if (prepared && prepared.tl === tl && prepared.n === shots.length) return prepared;

    let cursor = 0;
    const out = [];
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      const has = (k) => s[k] != null && isFinite(Number(s[k]));
      let start = null;
      let end = null;
      if (has('start')) start = Number(s.start);
      else start = cursor;
      if (has('end')) end = Number(s.end);
      else if (has('dur')) end = start + Number(s.dur);
      else end = start + 2;
      out.push({
        shot: s,
        i,
        id: s.id,
        start,
        end,
        dur: end - start,
        mode: String(s.mode || 'ink'),
        transitionIn: normTransition(s.transitionIn),
      });
      cursor = end;
    }
    prepared = { tl, n: shots.length, shots: out, duration: cursor };
    return prepared;
  }
  FILM.prepare = prepare;

  function shotAt(T) {
    const p = prepare();
    for (let i = p.shots.length - 1; i >= 0; i--) {
      if (T >= p.shots[i].start) return p.shots[i];
    }
    return p.shots[0];
  }
  FILM.shotAt = shotAt;

  // -----------------------------------------------------------------------
  // Post: grain + vignette (cached)
  // -----------------------------------------------------------------------

  let grainTile = null; // canvas
  let grainPattern = null;
  let vignetteGrad = null;
  let vignetteSize = '';

  function buildGrain(size) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    const d = img.data;
    // Fixed tile; the per-frame offset + seed roll makes it boil.
    let s = 0x9e3779b9;
    for (let i = 0; i < d.length; i += 4) {
      s = (Math.imul(s, 0x85ebca6b) ^ (s >>> 13)) >>> 0;
      const v = 128 + (((s & 255) - 128) * 0.9) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function post(ctx, T) {
    const W = FILM.W;
    const H = FILM.H;

    // Vignette.
    const key = W + 'x' + H;
    if (!vignetteGrad || vignetteSize !== key) {
      const r = Math.sqrt(W * W + H * H) * 0.62;
      vignetteGrad = ctx.createRadialGradient(W / 2, H * 0.46, r * 0.32, W / 2, H * 0.5, r);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(0.62, 'rgba(0,0,0,0.10)');
      vignetteGrad.addColorStop(1, 'rgba(2,6,14,0.44)');
      vignetteSize = key;
    }
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);

    // Boiling grain, rolled at BOIL_FPS.
    if (!grainTile) grainTile = buildGrain(256);
    const boilFrame = Math.floor(T * FILM.BOIL_FPS + 1e-4);
    const ox = Math.floor(ihash(boilFrame, 1, 7) * 256);
    const oy = Math.floor(ihash(boilFrame, 2, 9) * 256);
    if (!grainPattern) grainPattern = ctx.createPattern(grainTile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-ox, -oy);
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // renderFrame(T) : draw one frame at global time T seconds. Pure w.r.t. T.
  // -----------------------------------------------------------------------

  FILM.renderFrame = function renderFrame(T) {
    const ctx = FILM.ctx;
    if (!ctx) throw new Error('FILM.ctx is not set: call FILM.attach(canvas) first');
    const p = prepare();

    // Clamp T into the film.
    const span = Math.max(0.001, p.duration - 1e-4);
    T = T < 0 ? 0 : T > span ? span : T;
    frameT = T;

    const frame = Math.floor(T * FILM.FPS + 1e-4);

    ctx.save();
    // Base transform: logical 1080x1920 -> device pixels.
    ctx.setTransform(FILM.S, 0, 0, FILM.S, 0, 0);

    // Clear to black before the scene paints.
    ctx.fillStyle = '#02060e';
    ctx.fillRect(0, 0, FILM.W, FILM.H);

    const s = shotAt(T);
    const t = T - s.start;
    const info = {
      shot: s.shot,
      id: s.id,
      i: s.i,
      n: p.shots.length,
      t,
      T,
      frame,
      progress: s.dur > 0 ? t / s.dur : 1,
      mode: s.mode,
    };

    const scene = FILM.registry[s.id];
    if (scene) {
      try {
        scene.draw(t, info);
      } catch (err) {
        FILM.errors.push({ T, shot: s.id, message: String(err && err.stack ? err.stack : err) });
        if (FILM.strict) {
          ctx.restore();
          throw err;
        }
        // Fallback plate so the film keeps running.
        ctx.fillStyle = '#0a1e3d';
        ctx.fillRect(0, 0, FILM.W, FILM.H);
        ctx.fillStyle = '#e8577f';
        ctx.fillRect(0, FILM.H * 0.5 - 6, FILM.W, 12);
      }
    } else {
      FILM.errors.push({ T, shot: s.id, message: 'scene not registered: ' + s.id });
    }

    // Transitions: dip through black at fade boundaries.
    let black = 0;
    const trIn = s.transitionIn;
    if (trIn && trIn.kind === 'fade' && trIn.dur > 0 && t < trIn.dur) {
      black = Math.max(black, 1 - t / trIn.dur);
    }
    const next = p.shots[s.i + 1];
    if (next) {
      const trNext = next.transitionIn;
      const toEnd = s.end - T;
      if (trNext && trNext.kind === 'fade' && trNext.dur > 0 && toEnd < trNext.dur) {
        black = Math.max(black, 1 - toEnd / trNext.dur);
      }
    }
    // Head and tail of the whole film also fade from / to black.
    if (T < 0.2) black = Math.max(black, 1 - T / 0.2);
    if (T > p.duration - 0.45) black = Math.max(black, (T - (p.duration - 0.45)) / 0.45);
    if (black > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, black) + ')';
      ctx.fillRect(0, 0, FILM.W, FILM.H);
    }

    post(ctx, T);
    ctx.restore();
  };

  // Attach a canvas and size it to the device.
  FILM.attach = function attach(canvas) {
    FILM.canvas = canvas;
    FILM.ctx = canvas.getContext('2d', { alpha: false });
    grainPattern = null;
    vignetteSize = '';
    FILM.resize();
    return FILM.ctx;
  };

  FILM.resize = function resize() {
    const canvas = FILM.canvas;
    if (!canvas) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    FILM.S = dpr;
    canvas.width = Math.round(FILM.W * dpr);
    canvas.height = Math.round(FILM.H * dpr);
    grainPattern = null; // pattern is scale-sensitive
    vignetteSize = '';
  };
})();
