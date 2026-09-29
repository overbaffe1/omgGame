// ============================================================================
// lab.js — the three rooms of the lab:
//   1. STAGE    — mock game screen, everything rendered from the atlas
//   2. ANATOMY  — the sheet itself with slice overlays
//   3. SANDBOX  — 9-slice stretch playground
// ============================================================================
import { Atlas, drawText, textWidth, clamp, lerp, pixelCanvas, enablePixelated } from './engine.js';

const $ = (sel) => document.querySelector(sel);

// palette mirrors tools/gen-atlas.mjs
const P = {
  bg0: '#0b0906', bg1: '#141008',
  gold1: '#8a6a2a', gold2: '#b8933a', gold3: '#dfc063', gold4: '#f6e7a0',
  blood1: '#6e1417', blood2: '#9c1f22', blood3: '#c93b31', blood4: '#e05a45',
  mana1: '#1d3a6e', mana2: '#2f5ea8', mana3: '#5b93d6', mana4: '#9cc6ef',
  steel3: '#cfd0d8', bone: '#efe6c8', parch2: '#e6d5a7',
  ink: '#c9b98f', inkDim: '#7d7157',
};

// ============================================================================
// 1. STAGE
// ============================================================================
const STAGE_W = 640, STAGE_H = 400;

// orb geometry must match the atlas (orb sprite 72×72, glass circle)
const ORB_C = { x: 36, y: 33, r: 29 };

function orbFluid(ctx, atlas, name, dx, dy, level, t, colors) {
  // sprite first (rim + dark glass)
  atlas.draw(ctx, name, dx, dy);
  // fluid: clipped circle, wave surface
  ctx.save();
  ctx.beginPath();
  ctx.arc(dx + ORB_C.x, dy + ORB_C.y, ORB_C.r - 2, 0, Math.PI * 2);
  ctx.clip();
  const surf = dy + ORB_C.y + (ORB_C.r - 2) - level * (ORB_C.r - 2) * 2;
  // body
  ctx.fillStyle = colors.body;
  ctx.fillRect(dx, surf, 72, dy + 72 - surf);
  // wave crest (two sine passes, 1px apart for a chunky pixel wave)
  ctx.fillStyle = colors.crest;
  for (let pass = 0; pass < 2; pass++) {
    const amp = 2.2 - pass * 0.9, k = 0.11 + pass * 0.05, ph = t * (1.6 + pass * 0.7) + pass * 2.1;
    for (let px = 0; px < 72; px++) {
      const wy = Math.round(surf + Math.sin(px * k + ph) * amp) + pass;
      ctx.fillRect(dx + px, wy, 1, 2);
    }
  }
  // bubbles
  ctx.fillStyle = colors.bubble;
  for (let i = 0; i < 3; i++) {
    const bx = dx + 18 + ((i * 23 + Math.floor(t * 3) * 7) % 36);
    const by = dy + 58 - ((t * (7 + i * 3) + i * 19) % (level * 40 + 4));
    ctx.fillRect(bx, by, 1, 1);
  }
  ctx.restore();
  // re-add crescent highlight (it lives above the fluid line usually)
  ctx.fillStyle = colors.crest;
  for (let i = 0; i < 26; i++) {
    const a = -2.55 + (i / 26) * 1.35;
    const hx = Math.round(ORB_C.x + Math.cos(a) * ORB_C.r * 0.72);
    const hy = Math.round(ORB_C.y + Math.sin(a) * ORB_C.r * 0.72);
    if (hy < surf - 1) ctx.fillRect(dx + hx, dy + hy, 1, 1);
  }
}

const BELT = [
  { icon: 'icon_hp',     name: 'POTION OF LIFE',    sub: ['restores 45 life', 'shift+click to donate'] },
  { icon: 'icon_mp',     name: 'POTION OF MANA',    sub: ['restores 35 mana', 'tastes of cold iron'] },
  { icon: 'icon_sword',  name: 'GRAVEBinding',      sub: ['damage 9-14', '+3 vs skeletons'] },
  { icon: 'icon_shield', name: 'CHARRED AEGIS',     sub: ['block 34%', 'burns the wicked'] },
  { icon: 'icon_skull',  name: 'SKULL OF GREED',    sub: ['+41% gold find', 'whispers at night'] },
  { icon: 'icon_scroll', name: 'TOWN SCROLL',       sub: ['opens a portal', 'single use'] },
];

function initStage(atlas) {
  const [cv, ctx] = pixelCanvas(STAGE_W, STAGE_H);
  const host = $('#stage');
  host.appendChild(cv);
  enablePixelated(cv);

  const state = {
    hp: 0.68, hpTarget: 0.68,
    mp: 0.42, mpTarget: 0.42,
    xp: 0.24,
    gold: 1337,
    kills: 7,
    hover: -1, selected: 0,
    shake: 0, flash: 0, toast: null, toastT: 0,
    pressedAct: null,
    floaters: [], // {x,y,vy,text,color,t}
    mouse: { x: -99, y: -99, inside: false },
  };

  const buttons = [
    { label: 'SLAY',    x: 36, y: 64,  w: 180, h: 28, act: 'slay' },
    { label: 'BLEED',   x: 36, y: 98,  w: 180, h: 28, act: 'bleed' },
    { label: 'CHANNEL', x: 36, y: 132, w: 180, h: 28, act: 'channel' },
  ];
  const panel = { x: 16, y: 16, w: 220, h: 160 };

  function toast(text, color = P.gold3) { state.toast = { text, color }; state.toastT = 2.6; }
  function float(text, x, y, color) { state.floaters.push({ text, x, y, color, t: 1.4 }); }

  function act(a) {
    if (a === 'slay') {
      state.kills++; state.xp = clamp(state.xp + 0.09, 0, 1); state.shake = 0.35; state.flash = 0.5;
      const g = 40 + Math.floor(Math.random() * 90); state.gold += g;
      float(`+${g} GOLD`, 340, 180, P.gold3);
      float('+XP', 308, 198, P.parch2);
      if (state.xp >= 1) { state.xp = 0; toast('LEVEL UP!', P.gold4); state.flash = 1; }
      else toast('THE FALLEN FALL', P.blood3);
    } else if (a === 'bleed') {
      state.hpTarget = clamp(state.hpTarget - 0.22, 0.05, 1);
      state.flash = Math.max(state.flash, 0.8);
      toast('YOU BLEED', P.blood4);
    } else if (a === 'channel') {
      state.mpTarget = clamp(state.mpTarget - 0.25, 0, 1);
      state.hpTarget = clamp(state.hpTarget + 0.1, 0, 1);
      toast('MANA BURNS TO LIFE', P.mana3);
    }
  }

  // input
  function toStage(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (STAGE_W / r.width),
      y: (e.clientY - r.top) * (STAGE_H / r.height),
    };
  }
  cv.addEventListener('mousemove', (e) => { state.mouse = { ...toStage(e), inside: true }; });
  cv.addEventListener('mouseleave', () => { state.mouse.inside = false; state.hover = -1; });
  cv.addEventListener('mousedown', (e) => {
    const m = toStage(e);
    for (const b of buttons) {
      if (m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h) {
        state.pressedAct = b.act;
        act(b.act);
        return;
      }
    }
    for (let i = 0; i < BELT.length; i++) {
      const sx = 208 + i * 40;
      if (m.x >= sx && m.x < sx + 36 && m.y >= 348 && m.y < 384) {
        state.selected = i;
        const it = BELT[i];
        if (it.icon === 'icon_hp') { state.hpTarget = clamp(state.hpTarget + 0.25, 0, 1); toast('POTION OF LIFE — 45 HP', P.blood4); }
        else if (it.icon === 'icon_mp') { state.mpTarget = clamp(state.mpTarget + 0.3, 0, 1); toast('POTION OF MANA — 35 MP', P.mana3); }
        else toast(it.name, P.gold3);
        return;
      }
    }
  });

  // rendering
  function drawBg(t) {
    ctx.fillStyle = P.bg0;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    // slow summoning circle
    ctx.save();
    ctx.translate(320, 150);
    ctx.strokeStyle = 'rgba(184,147,58,0.10)';
    ctx.fillStyle = 'rgba(156,31,34,0.10)';
    for (let ring = 0; ring < 3; ring++) {
      const R = 46 + ring * 34, dash = 4 + ring * 3;
      ctx.lineWidth = 1;
      ctx.setLineDash([dash, dash + 3]);
      ctx.lineDashOffset = t * (6 + ring * 4) * (ring % 2 ? -1 : 1);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      const a = t * 0.15 + i * Math.PI / 4;
      ctx.fillRect(Math.round(Math.cos(a) * 82), Math.round(Math.sin(a) * 82), 1, 1);
    }
    ctx.restore();
    // floor glow
    const g = ctx.createRadialGradient(320, 430, 40, 320, 430, 330);
    g.addColorStop(0, 'rgba(110,20,23,0.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 300, STAGE_W, 100);
  }

  function drawHud(t) {
    // orbs
    orbFluid(ctx, atlas, 'orb_hp', 24, 292, state.hp, t, { body: P.blood1, crest: P.blood3, bubble: P.blood4 });
    orbFluid(ctx, atlas, 'orb_mp', STAGE_W - 96, 292, state.mp, t, { body: P.mana1, crest: P.mana3, bubble: P.mana4 });
    drawText(ctx, 'LIFE', 24 + 36 - textWidth('LIFE') / 2, 375, P.ink);
    drawText(ctx, 'MANA', STAGE_W - 96 + 36 - textWidth('MANA') / 2, 375, P.ink);

    // xp bar between orbs
    const bx = 130, bw = STAGE_W - 260, by = 300;
    atlas.draw(ctx, 'bar_cap_l', bx, by);
    for (let x = bx + 6; x < bx + bw - 6; x += 8) atlas.draw(ctx, 'bar_mid', x, by);
    atlas.draw(ctx, 'bar_cap_r', bx + bw - 6, by);
    const fillW = Math.round((bw - 8) * state.xp);
    for (let x = 0; x < fillW; x += 8) {
      const w = Math.min(8, fillW - x);
      ctx.drawImage(atlas.img, 200, 288, w, 8, bx + 3 + x, by, w, 8); // bar_fill slice, cropped
    }
    drawText(ctx, `xP ${Math.round(state.xp * 100)}%`, bx + bw / 2 - textWidth(`xP ${Math.round(state.xp * 100)}%`) / 2, by - 8, P.inkDim);

    // belt
    for (let i = 0; i < BELT.length; i++) {
      const sx = 208 + i * 40, sy = 348;
      const name = i === state.selected ? 'slot_selected' : (state.hover === i ? 'slot_hover' : 'slot');
      atlas.draw(ctx, name, sx, sy);
      atlas.draw(ctx, BELT[i].icon, sx + 9, sy + 9);
      drawText(ctx, String(i + 1), sx + 2, sy + 26, P.inkDim);
      if (state.hover === i) {
        // tooltip panel above the slot
        const it = BELT[i];
        const lines = it.sub;
        const tw = Math.max(textWidth(it.name) + 24, ...lines.map(s => textWidth(s) + 24), 120);
        const th = 34 + lines.length * 8;
        const tx = clamp(sx + 18 - tw / 2, 6, STAGE_W - tw - 6);
        const ty = sy - th - 10;
        atlas.draw9(ctx, 'tooltip9', tx, ty, tw, th);
        drawText(ctx, it.name, tx + 10, ty + 9, P.gold3);
        lines.forEach((s, k) => drawText(ctx, s, tx + 10, ty + 19 + k * 8, P.ink));
      }
    }
  }

  function drawTopPanel(t) {
    atlas.draw9(ctx, 'panel9', panel.x, panel.y, panel.w, panel.h);
    drawText(ctx, 'THE WORLDSTONE INN', panel.x + 20, panel.y + 10, P.gold3);
    atlas.draw(ctx, 'divider', panel.x + 20, panel.y + 20);
    // gold counter, top-right
    atlas.draw9(ctx, 'tooltip9', STAGE_W - 166, 16, 150, 26);
    atlas.draw(ctx, 'icon_skull', STAGE_W - 158, 20);
    const gtxt = `${state.gold}`;
    drawText(ctx, gtxt, STAGE_W - 140 + (110 - textWidth(gtxt)) / 2, 25, P.gold3);
    drawText(ctx, `KILLS ${state.kills}`, STAGE_W - 166, 48, P.inkDim);
  }

  function drawButtons() {
    const m = state.mouse;
    for (const b of buttons) {
      const hov = m.inside && m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h;
      const pressed = hov && state.pressedAct === b.act;
      const name = pressed ? 'btn_pressed' : hov ? 'btn_hover' : 'btn_normal';
      atlas.draw9(ctx, name, b.x, b.y, b.w, b.h);
      drawText(ctx, b.label, b.x + b.w / 2 - textWidth(b.label) / 2, b.y + 12 + (pressed ? 1 : 0), pressed ? P.inkDim : hov ? P.gold4 : P.ink);
    }
  }

  function drawToast(t) {
    if (state.toastT <= 0) return;
    const a = clamp(state.toastT / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    const w = Math.max(textWidth(state.toast.text) + 28, 90);
    const x = 320 - w / 2, y = 258;
    atlas.draw9(ctx, 'tooltip9', x, y, w, 24);
    drawText(ctx, state.toast.text, 320 - textWidth(state.toast.text) / 2, y + 9, state.toast.color);
    ctx.restore();
  }

  function drawFloaters(dt) {
    for (const f of state.floaters) {
      f.t -= dt; f.y -= dt * 22;
      ctx.save();
      ctx.globalAlpha = clamp(f.t / 0.5, 0, 1);
      drawText(ctx, f.text, f.x, f.y, f.color);
      ctx.restore();
    }
    state.floaters = state.floaters.filter(f => f.t > 0);
  }

  function drawCursor() {
    if (!state.mouse.inside) return;
    atlas.draw(ctx, 'cursor', state.mouse.x - 17, state.mouse.y - 1);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    state.hp = lerp(state.hp, state.hpTarget, 1 - Math.pow(0.02, dt));
    state.mp = lerp(state.mp, state.mpTarget, 1 - Math.pow(0.02, dt));
    state.shake = Math.max(0, state.shake - dt * 1.4);
    state.flash = Math.max(0, state.flash - dt * 2.2);
    if (state.toastT > 0) state.toastT -= dt;

    // hover detection (belt)
    state.hover = -1;
    if (state.mouse.inside) {
      for (let i = 0; i < BELT.length; i++) {
        const sx = 208 + i * 40;
        if (state.mouse.x >= sx && state.mouse.x < sx + 36 && state.mouse.y >= 348 && state.mouse.y < 384) state.hover = i;
      }
    }

    ctx.save();
    if (state.shake > 0) {
      ctx.translate(Math.round((Math.random() - 0.5) * state.shake * 8), Math.round((Math.random() - 0.5) * state.shake * 8));
    }
    drawBg(t);
    drawTopPanel(t);
    drawButtons();
    drawHud(t);
    drawToast(t);
    drawFloaters(dt);
    ctx.restore();

    // damage vignette
    if (state.flash > 0) {
      const g = ctx.createRadialGradient(320, 200, 140, 320, 200, 380);
      g.addColorStop(0, 'rgba(156,31,34,0)');
      g.addColorStop(1, `rgba(156,31,34,${0.55 * state.flash})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    }
    drawCursor();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ============================================================================
// 2. ANATOMY
// ============================================================================
function initAnatomy(atlas) {
  const SCALE = 2;
  const [cv, ctx] = pixelCanvas(512 * SCALE, 384 * SCALE);
  const host = $('#anatomy-canvas');
  host.appendChild(cv);
  enablePixelated(cv);

  const info = $('#anatomy-info');
  const list = $('#anatomy-list');
  let showGuides = true, highlight = null;

  const names = [...atlas.slices.keys()];

  function render() {
    ctx.fillStyle = '#0d0b08';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(atlas.img, 0, 0, cv.width, cv.height);

    // checker for transparency
    ctx.globalAlpha = 0.06;
    for (let y = 0; y < cv.height; y += 16) {
      for (let x = 0; x < cv.width; x += 16) {
        if (((x / 16) + (y / 16)) % 2 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 16, 16); }
      }
    }
    ctx.globalAlpha = 1;

    for (const name of names) {
      const s = atlas.get(name);
      const hov = highlight === name;
      ctx.strokeStyle = hov ? 'rgba(246,231,160,0.95)' : 'rgba(184,147,58,0.35)';
      ctx.lineWidth = hov ? 2 : 1;
      ctx.strokeRect(s.x * SCALE + 0.5, s.y * SCALE + 0.5, s.w * SCALE - 1, s.h * SCALE - 1);
      if (showGuides && s.cw > 0) {
        ctx.strokeStyle = 'rgba(91,147,214,0.8)';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect((s.x + s.ml) * SCALE + 0.5, (s.y + s.mt) * SCALE + 0.5, s.cw * SCALE - 1, s.ch * SCALE - 1);
        ctx.setLineDash([]);
      }
      if (hov) {
        ctx.fillStyle = 'rgba(246,231,160,0.92)';
        ctx.fillRect(s.x * SCALE, s.y * SCALE - 14, s.w * SCALE, 13);
        ctx.fillStyle = '#141008';
        ctx.font = '10px monospace';
        ctx.fillText(`${name} ${s.w}×${s.h}`, s.x * SCALE + 3, s.y * SCALE - 4);
      }
    }
  }

  cv.addEventListener('mousemove', (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * (cv.width / r.width) / SCALE;
    const y = (e.clientY - r.top) * (cv.height / r.height) / SCALE;
    highlight = null;
    for (const name of names) {
      const s = atlas.get(name);
      if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) { highlight = name; break; }
    }
    if (highlight) {
      const s = atlas.get(highlight);
      info.innerHTML = `<b>${highlight}</b><br>bounds ${s.w}×${s.h} @ (${s.x},${s.y})` +
        (s.cw > 0 ? `<br>9-slice center ${s.cw}×${s.ch}<br>margins T${s.mt} R${s.mr} B${s.mb} L${s.ml}` : '<br>plain sprite (no center)');
      for (const li of list.children) li.classList.toggle('on', li.dataset.name === highlight);
    } else {
      info.innerHTML = 'hover a region…';
      for (const li of list.children) li.classList.remove('on');
    }
    render();
  });
  cv.addEventListener('mouseleave', () => { highlight = null; render(); });

  for (const name of names) {
    const li = document.createElement('div');
    li.className = 'slice-row'; li.dataset.name = name;
    const s = atlas.get(name);
    li.innerHTML = `<canvas width="${s.w * 2}" height="${s.h * 2}"></canvas><span>${name}</span><em>${s.w}×${s.h}${s.cw ? ' ·9' : ''}</em>`;
    const mini = li.querySelector('canvas').getContext('2d');
    mini.imageSmoothingEnabled = false;
    mini.drawImage(atlas.img, s.x, s.y, s.w, s.h, 0, 0, s.w * 2, s.h * 2);
    li.addEventListener('mouseenter', () => { highlight = name; render(); });
    list.appendChild(li);
  }

  $('#guides-toggle').addEventListener('change', (e) => { showGuides = e.target.checked; render(); });
  render();
}

// ============================================================================
// 3. SANDBOX
// ============================================================================
function initSandbox(atlas) {
  const demos = [
    { name: 'panel9', el: '#sb-panel', w: 240, h: 150 },
    { name: 'tooltip9', el: '#sb-tooltip', w: 200, h: 84 },
    { name: 'btn_normal', el: '#sb-button', w: 170, h: 44 },
  ];
  for (const d of demos) {
    const wrap = $(d.el);
    const [cv, ctx] = pixelCanvas(d.w, d.h);
    enablePixelated(cv);
    cv.style.width = (d.w * 2) + 'px';
    cv.style.height = (d.h * 2) + 'px';
    wrap.insertBefore(cv, wrap.querySelector('.sb-controls'));

    const draw = () => {
      ctx.clearRect(0, 0, d.w, d.h);
      atlas.draw9(ctx, d.name, 0, 0, d.w, d.h);
    };
    draw();

    const wSlider = wrap.querySelector('input.w');
    const hSlider = wrap.querySelector('input.h');
    wSlider.value = d.w; hSlider.value = d.h;
    const apply = () => {
      d.w = +wSlider.value; d.h = +hSlider.value;
      cv.width = d.w; cv.height = d.h;
      enablePixelated(cv);
      cv.style.width = Math.min(d.w * 2, 420) + 'px';
      cv.style.height = 'auto';
      draw();
      wrap.querySelectorAll('.dims').forEach((el, k) => el.textContent = k === 0 ? `${d.w} px` : `${d.h} px`;);
    };
    wSlider.addEventListener('input', apply);
    hSlider.addEventListener('input', apply);
  }
}

// ============================================================================
// boot
// ============================================================================
(async function boot() {
  const atlas = await Atlas.load('assets');
  initStage(atlas);
  initAnatomy(atlas);
  initSandbox(atlas);
  $('#loading').remove();
})();
