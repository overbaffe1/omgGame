/* DARKUI — лаборатория атласа.
 * Канвас-стенд рисует интерфейс целиком из darkui.png + darkui.json:
 * nine-slice, тайлы, теги анимаций, курсор из атласа. Рядом — те же кадры
 * в чистом CSS (border-image) и инспектор листа. */
'use strict';

const $ = (s) => document.querySelector(s);
const ATLAS = { meta: null, img: null, frames: new Map(), tags: [] };
const cropCache = new Map();

/* ---------------------------------------------------------- загрузка */
async function boot() {
  const meta = await (await fetch('atlas/darkui.json')).json();
  const img = new Image();
  img.src = 'atlas/darkui.png';
  await img.decode();
  ATLAS.meta = meta;
  ATLAS.img = img;
  for (const f of meta.frames) ATLAS.frames.set(f.name, f);
  ATLAS.tags = meta.meta.frameTags;
  buildChips();
  buildCssWidgets();
  initInspector();
  initPipeline();
  requestAnimationFrame(loop);
}

function fr(name) {
  const f = ATLAS.frames.get(name);
  if (!f) throw new Error('в атласе нет кадра: ' + name);
  return f;
}

/* ---------------------------------------------------------- рисование */
const stage = $('#stage');
const ctx = stage.getContext('2d');
ctx.imageSmoothingEnabled = false;

function drawSprite(name, x, y, w, h, alpha = 1) {
  const f = fr(name);
  x = Math.round(x); y = Math.round(y);
  w = w === undefined ? f.frame.w : Math.round(w);
  h = h === undefined ? f.frame.h : Math.round(h);
  if (alpha !== 1) { ctx.globalAlpha *= alpha; }
  ctx.drawImage(ATLAS.img, f.frame.x, f.frame.y, f.frame.w, f.frame.h, x, y, w, h);
  if (alpha !== 1) { ctx.globalAlpha = 1; }
}

function draw9(name, x, y, w, h) {
  const f = fr(name);
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const n = f.nineSlice;
  const s = f.frame;
  if (!n) { ctx.drawImage(ATLAS.img, s.x, s.y, s.w, s.h, x, y, w, h); return; }
  const l = n.l, t = n.t, r = n.r, b = n.b;
  const sw = s.w - l - r, sh = s.h - t - b;
  const dw = Math.max(1, w - l - r), dh = Math.max(1, h - t - b);
  const P = [
    [0, 0, l, t, 0, 0, l, t],
    [l, 0, sw, t, l, 0, dw, t],
    [s.w - r, 0, r, t, w - r, 0, r, t],
    [0, t, l, sh, 0, t, l, dh],
    [l, t, sw, sh, l, t, dw, dh],
    [s.w - r, t, r, sh, w - r, t, r, dh],
    [0, s.h - b, l, b, 0, h - b, l, b],
    [l, s.h - b, sw, b, l, h - b, dw, b],
    [s.w - r, s.h - b, r, b, w - r, h - b, r, b],
  ];
  for (const q of P) {
    if (q[2] <= 0 || q[3] <= 0 || q[6] <= 0 || q[7] <= 0) continue;
    ctx.drawImage(ATLAS.img, s.x + q[0], s.y + q[1], q[2], q[3], x + q[4], y + q[5], q[6], q[7]);
  }
}

function tile(name, x, y, w, h) {
  const f = fr(name);
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j += f.frame.h) {
    for (let i = 0; i < w; i += f.frame.w) {
      const cw = Math.min(f.frame.w, w - i), ch = Math.min(f.frame.h, h - j);
      ctx.drawImage(ATLAS.img, f.frame.x, f.frame.y, cw, ch, x + i, y + j, cw, ch);
    }
  }
}

function animFrame(tag, t, fps) {
  const tagMeta = ATLAS.meta.meta.animations[tag];
  const n = tagMeta.frames.length;
  const i = Math.floor(t * (fps || 12)) % n;
  return tagMeta.frames[i];
}

/* ------------------------------------------------- пиксельный текст */
const masks = new Map();
const tinted = new Map();
function textMask(s) {
  if (masks.has(s)) return masks.get(s);
  const m = document.createElement('canvas');
  const c = m.getContext('2d');
  const font = '700 11px ui-monospace, Consolas, monospace';
  c.font = font;
  const w = Math.ceil(c.measureText(s).width) + 2;
  m.width = w; m.height = 13;
  const c2 = m.getContext('2d');
  c2.font = font; c2.textBaseline = 'top'; c2.fillStyle = '#fff';
  c2.fillText(s, 1, 1);
  const d = c2.getImageData(0, 0, w, 13);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 96 ? 255 : 0;
  c2.putImageData(d, 0, 0);
  masks.set(s, m);
  return m;
}
function tint(m, color) {
  const k = color + '|' + m.width + 'x' + m.height + '|' + (m.__id || (m.__id = tinted.size));
  if (tinted.has(k)) return tinted.get(k);
  const c = document.createElement('canvas');
  c.width = m.width; c.height = m.height;
  const cc = c.getContext('2d');
  cc.drawImage(m, 0, 0);
  cc.globalCompositeOperation = 'source-in';
  cc.fillStyle = color;
  cc.fillRect(0, 0, c.width, c.height);
  tinted.set(k, c);
  return c;
}
function textW(s) { return textMask(s).width; }
function drawText(s, x, y, color, o = {}) {
  const m = textMask(s);
  if (o.center) x -= m.width / 2;
  if (o.right) x -= m.width;
  x = Math.round(x); y = Math.round(y);
  if (o.shadow !== false) ctx.drawImage(tint(m, '#000'), x + 1, y + 1);
  ctx.drawImage(tint(m, color), x, y);
}

/* ---------------------------------------------------------- состояние */
const ITEMS = [
  { icon: 'icon_sword', name: 'КЛИНОК ПОГИБЕЛИ', rar: 'unique', lines: ['УРОН: 12–48', 'ПРОЧНОСТЬ: 40/60', '+35% К УРОНУ ПО НЕЖИТИ'] },
  { icon: 'icon_potion_health', name: 'ЗЕЛЬЕ ЛЕЧЕНИЯ', rar: 'normal', qty: 3, lines: ['ВОССТАНАВЛИВАЕТ 40% ЗДОРОВЬЯ', 'КЛИК — ВЫПИТЬ'] },
  { icon: 'icon_potion_mana', name: 'ЗЕЛЬЕ МАНЫ', rar: 'normal', qty: 2, lines: ['ВОССТАНАВЛИВАЕТ 40% МАНЫ', 'КЛИК — ВЫПИТЬ'] },
  { icon: 'icon_shield', name: 'ЩИТ ТУМАНОВ', rar: 'magic', lines: ['ЗАЩИТА: 42', '+12 К СОПРОТИВЛЕНИЮ ОГНЮ'] },
  { icon: 'icon_rune', name: 'РУНА ЛЕМ', rar: 'rare', lines: ['В ГНЕЗДО: +75% ЗОЛОТА', 'ТРЕБУЕТ УРОВНЯ 23'] },
  { icon: 'icon_gem', name: 'КРОВАВЫЙ АМЕТИСТ', rar: 'normal', lines: ['В ГНЕЗДО: КРАДЕТ ЖИЗНЬ'] },
  { icon: 'icon_scroll', name: 'СВИТОК ГОРОДСКОГО ПОРТАЛА', rar: 'normal', lines: ['ОТКРЫВАЕТ ПОРТАЛ В ГОРОД'] },
  { icon: 'icon_helm', name: 'ШЛЕМ ДВОЙНИ', rar: 'set', lines: ['ЗАЩИТА: 31', 'КОМПЛЕКТ: ПЕРСТНИ ДВОЙНИ'] },
  { icon: 'icon_coin', name: 'ЗОЛОТО', rar: 'normal', qty: 1248, lines: ['МОНЕТЫ ИМПЕРИИ'] },
  { icon: 'icon_book', name: 'ТОМ ЗАБВЕНИЯ', rar: 'unique', lines: ['СОДЕРЖИТ ЗАКЛЯТИЕ 5 УРОВНЯ'] },
  { icon: 'icon_amulet', name: 'АМУЛЬТЕТ БЕЗДНЫ', rar: 'rare', lines: ['+1 КО ВСЕМ НАВЫКАМ', '+20 К МАНЕ'] },
  { icon: 'icon_bow', name: 'ЛУГ ПОПЕЛА', rar: 'magic', lines: ['УРОН: 8–21', 'СКРОСТЬ СТРЕЛЬБЫ +10%'] },
];
const RAR_COLOR = { normal: '#c8c0b0', magic: '#8fa3ff', rare: '#ffe14d', unique: '#c9a24a', set: '#5fdc82', crafted: '#ff9a3c', runeword: '#ff5a4a' };

const S = {
  hp: 74, mp: 58, stam: 88, xp: 37,
  inv: [ITEMS[0], null, ITEMS[3], null, ITEMS[4], ITEMS[5], null, ITEMS[7], null, ITEMS[9], ITEMS[10], null, ITEMS[11], null, null, ITEMS[8], null, null, null, null],
  quick: [ITEMS[1], ITEMS[2], ITEMS[6], null, null, null],
  drag: null, hover: null, mouse: { x: -99, y: -99, down: false },
  tab: 0, checked: true, scroll: 0, scrollDrag: null,
  log: ['> ТЫ ВОШЁЛ В СКЛЕП ЗАБВЕНИЯ', '> ФАКЕЛЫ ГОРЯТ ХОЛОДНО', '> СЛЫШЕН ШЁПОТ КОСТЕЙ'],
  particles: [], t: 0, animOn: true, fxOn: true, hitboxes: false,
  btnPress: {}, lastHit: null, gold: 1248,
};

let hits = [];
function regHit(id, x, y, w, h, data) { hits.push({ id, x, y, w, h, data }); }
function pickHit(x, y) {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h;
  }
  return null;
}

/* ---------------------------------------------------------- частицы */
function spawn(kind, x, y, n = 1) {
  if (!S.fxOn) return;
  for (let i = 0; i < n; i++) {
    S.particles.push({
      kind, x, y,
      vx: (Math.random() - 0.5) * (kind === 'blood' ? 1.6 : 0.35),
      vy: kind === 'blood' ? -Math.random() * 1.4 : -0.25 - Math.random() * 0.4,
      life: 1, decay: kind === 'blood' ? 0.035 : 0.008 + Math.random() * 0.01,
    });
  }
}
function stepParticles(dt) {
  for (const p of S.particles) {
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.kind === 'blood') p.vy += 0.08;
    if (p.kind === 'ember') p.vx += Math.sin(S.t * 3 + p.y * 0.2) * 0.01;
  }
  S.particles = S.particles.filter((p) => p.life > 0);
}
function drawParticles() {
  for (const p of S.particles) {
    if (p.kind === 'ember') drawSprite(animFrame('ember', S.t + p.x * 0.01, 10), p.x - 7, p.y - 7, 14, 14, Math.max(0, p.life));
    else if (p.kind === 'smoke') drawSprite(animFrame('smoke', S.t * 0.6 + p.x * 0.003, 8), p.x - 13, p.y - 16, 26, 32, Math.max(0, p.life * 0.5));
    else if (p.kind === 'blood') { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = '#871a17'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); ctx.globalAlpha = 1; }
    else if (p.kind === 'spark') drawSprite('glow_gold', p.x - 14, p.y - 14, 28, 28, Math.max(0, p.life * 0.7));
  }
}

/* ---------------------------------------------------------- сцена */
function globe(cx, cy, kind, level) {
  const base = 'globe_base';
  drawSprite(base, cx, cy);
  const R = 28;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + 38, cy + 38, R, 0, Math.PI * 2);
  ctx.clip();
  const innerH = R * 2;
  const top = cy + 38 + R - level * innerH;
  const frameName = animFrame(kind === 'blood' ? 'wave_blood' : 'wave_mana', S.animOn ? S.t : 0, 10);
  drawSprite(frameName, cx, top);
  ctx.fillStyle = kind === 'blood' ? '#5e1010' : '#103a6e';
  ctx.fillRect(cx, top + 30, 76, cy + 76 - top);
  ctx.restore();
  drawSprite('globe_glass', cx, cy);
  drawSprite('globe_frame', cx, cy);
}

function bar(x, y, w, kind, frac, label) {
  if (label) drawText(label, x, y - 12, '#a08a5a');
  draw9('bar_frame', x, y, w, 16);
  const iw = Math.max(0, Math.round((w - 12) * frac));
  if (iw > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 5, y + 4, iw, 8);
    ctx.clip();
    tile('bar_fill_' + kind, x + 5, y + 4, w - 10, 8);
    ctx.restore();
  }
}

function button(id, name, x, y, w, h, label, o = {}) {
  const st = S.btnPress[id] ? 2 : S.hover === id ? 1 : o.disabled ? 3 : 0;
  const styles = { stone: 'btn_stone_', gold: 'btn_gold_', blood: 'btn_blood_', iron: 'btn_iron_' };
  draw9(styles[o.style || 'stone'] + ['normal', 'hover', 'pressed', 'disabled'][st], x, y, w, h);
  drawText(label, x + w / 2, y + h / 2 - 6, o.disabled ? '#6b655c' : st === 2 ? '#8a7863' : '#f4e9cd', { center: true });
  if (!o.disabled) regHit(id, x, y, w, h);
  if (S.hitboxes && !o.disabled) { ctx.strokeStyle = '#ff00ff88'; ctx.strokeRect(x + 0.5, y + 0.5, w, h); }
}

function renderScene() {
  hits = [];
  const t = S.t;
  // фон
  tile('fill_dark', 0, 0, 640, 480);
  tile('fill_stone', 0, 336, 640, 144);
  ctx.fillStyle = '#00000088';
  ctx.fillRect(0, 336, 640, 3);
  // виньетка
  const g = ctx.createRadialGradient(320, 220, 120, 320, 240, 420);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 480);

  // факелы
  for (const tx of [0, 616]) {
    drawSprite('torch', tx, 120);
    if (S.animOn) {
      drawSprite(animFrame('flame', t, 12), tx + 12 - 15, 120 + 12 - 38, 30, 38, 0.95);
      drawSprite('glow_red', tx + 12 - 28, 120 - 10, 56, 56, 0.28 + 0.06 * Math.sin(t * 7 + tx));
      if (Math.random() < 0.06) spawn('ember', tx + 12, 120 - 20);
      if (Math.random() < 0.05) spawn('smoke', tx + 12, 120 - 34);
    } else {
      drawSprite('fx_flame_0', tx + 12 - 15, 120 + 12 - 38, 30, 38);
    }
  }

  // заголовок
  draw9('banner_title', 170, 8, 300, 40);
  drawText('СКЛЕП ЗАБВЕНИЯ', 320, 21, '#fbe89c', { center: true });
  drawSprite('skull_ornament', 122, 10);
  drawSprite('skull_ornament', 470, 10);

  // ---------- левое окно: инвентарь / герой
  draw9('panel_frame_heavy', 24, 64, 300, 268);
  tile('fill_stone', 48, 88, 252, 220);
  // вкладки
  const tabs = ['ИНВЕНТАРЬ', 'ГЕРОЙ'];
  for (let i = 0; i < 2; i++) {
    const x = 40 + i * 100;
    draw9(S.tab === i ? 'tab_active' : 'tab_normal', x, 42, 96, 28);
    drawText(tabs[i], x + 48, 50, S.tab === i ? '#fbe89c' : '#8d7859', { center: true });
    regHit('tab' + i, x, 42, 96, 28);
  }

  if (S.tab === 0) {
    // сетка 5×4
    for (let i = 0; i < 20; i++) {
      const cx = 46 + (i % 5) * 48, cy = 96 + Math.floor(i / 5) * 48;
      const hov = S.hover === 'slot' + i;
      const sel = S.drag && S.drag.from === 'inv' + i;
      drawSprite(S.drag && pickSlotAt(S.mouse.x, S.mouse.y) === i ? 'slot_drop' : sel ? 'slot_selected' : hov ? 'slot_hover' : 'slot_empty', cx, cy);
      const it = S.inv[i];
      if (it && !(S.drag && S.drag.from === 'inv' + i)) {
        draw9('rarity_' + it.rar, cx, cy, 44, 44);
        drawSprite(it.icon, cx + 6, cy + 6, 32, 32);
        if (it.qty && it.qty > 1) drawText('x' + it.qty, cx + 40, cy + 30, '#e0cfa3', { right: true });
      }
      regHit('slot' + i, cx, cy, 44, 44, { kind: 'inv', i });
    }
    draw9('divider_ornate', 60, 288, 220, 12);
    drawText('ЗОЛОТО: ' + S.gold, 170, 296, '#e8c45f', { center: true });
  } else {
    drawSprite('skull_ornament', 146, 100);
    drawText('УРОВЕНЬ 24  НЕКРОМАНТ', 170, 148, '#e0cfa3', { center: true });
    const stats = [['СИЛА', 41], ['ЛОВКОСТЬ', 33], ['ЖИВУЧЕСТЬ', 52], ['ЭНЕРГИЯ', 28]];
    stats.forEach((s, i) => {
      drawText(s[0], 60, 176 + i * 18, '#a08a5a');
      drawText(String(s[1]), 280, 176 + i * 18, '#e0cfa3', { right: true });
      ctx.fillStyle = '#00000066';
      ctx.fillRect(120, 179 + i * 18, 140, 6);
      ctx.fillStyle = '#7d5a17';
      ctx.fillRect(120, 179 + i * 18, Math.round(140 * Math.min(1, s[1] / 60)), 6);
    });
    drawText('ГНЕЗДА:', 60, 258, '#a08a5a');
    const gems = ['socket_ruby', 'socket_sapphire', 'socket_emerald', 'socket_topaz', 'socket_empty'];
    gems.forEach((gname, i) => {
      drawSprite(gname, 62 + i * 28, 272, 24, 24);
      regHit('gem' + i, 62 + i * 28, 272, 24, 24, { kind: 'gem', name: gname });
    });
  }

  // ---------- правое окно: состояние
  draw9('panel_frame_ornate', 340, 64, 276, 268);
  tile('fill_dark', 364, 88, 228, 220);
  drawText('СОСТОЯНИЕ ГЕРОЯ', 478, 90, '#e8c45f', { center: true });
  draw9('divider_simple', 372, 104, 212, 4);
  bar(372, 118, 212, 'blood', S.hp / 100, 'ЗДОРОВЬЕ ' + Math.round(S.hp));
  bar(372, 150, 212, 'mana', S.mp / 100, 'МАНА ' + Math.round(S.mp));
  bar(372, 182, 212, 'stamina', S.stam / 100, 'ВЫНОСЛИВОСТЬ ' + Math.round(S.stam));

  button('atk', 'stone', 372, 206, 104, 28, 'АТАКА', { style: 'blood' });
  button('def', 'stone', 484, 206, 104, 28, 'ОБОРОНА', { style: 'iron' });
  // флажок
  drawSprite(S.checked ? 'checkbox_on' : S.hover === 'chk' ? 'checkbox_hover' : 'checkbox_off', 372, 240);
  drawText('АВТОПОДБОР ЗОЛОТА', 394, 242, S.checked ? '#e0cfa3' : '#8d7859');
  regHit('chk', 372, 240, 180, 16);
  // журнал + скроллбар
  const lx = 372, ly = 258, lw = 196, lh = 44;
  ctx.save();
  ctx.beginPath(); ctx.rect(lx, ly, lw, lh); ctx.clip();
  for (let i = 0; i < 4; i++) {
    const line = S.log[S.log.length - 1 - S.scroll - i];
    if (line) drawText(line.slice(0, 30), lx + 2, ly + lh - 11 * (i + 1), i === 0 ? '#e0cfa3' : '#7d6741');
  }
  ctx.restore();
  draw9('scroll_track', 572, 258, 16, 44);
  drawSprite('scroll_arrow_up', 572, 258, 16, 16);
  regHit('sup', 572, 258, 16, 16);
  const travel = 44 - 32;
  const th = Math.max(8, Math.round(travel * Math.min(1, 4 / Math.max(4, S.log.length))));
  const ty = 274 + Math.round((travel - th) * (S.scroll / Math.max(1, S.log.length - 4)));
  draw9(S.scrollDrag ? 'scroll_thumb_hover' : 'scroll_thumb_normal', 572, ty, 16, th);
  regHit('sthumb', 572, ty, 16, th, { kind: 'thumb' });
  drawSprite('scroll_arrow_down', 572, 258 + 44 - 16, 16, 16);
  regHit('sdown', 572, 258 + 44 - 16, 16, 16);

  // ---------- низ: глобусы, опыт, быстрые слоты
  globe(24, 368, 'blood', S.hp / 100);
  globe(540, 368, 'mana', S.mp / 100);
  drawText(String(Math.round(S.hp)), 62, 400, '#f7a48c', { center: true });
  drawText(String(Math.round(S.mp)), 578, 400, '#7cc6f5', { center: true });
  bar(120, 440, 400, 'xp', S.xp / 100, 'ОПЫТ ДО СЛЕДУЮЩЕГО УРОВНЯ');
  for (let i = 0; i < 6; i++) {
    const x = 180 + i * 47;
    const hov = S.hover === 'q' + i;
    drawSprite(S.drag && pickQuickAt(S.mouse.x, S.mouse.y) === i ? 'slot_drop' : hov ? 'slot_hover' : 'slot_empty', x, 368);
    const it = S.quick[i];
    if (it && !(S.drag && S.drag.from === 'q' + i)) {
      draw9('rarity_' + it.rar, x, 368, 44, 44);
      drawSprite(it.icon, x + 6, 374, 32, 32);
      if (it.qty && it.qty > 1) drawText('x' + it.qty, x + 40, 398, '#e0cfa3', { right: true });
    }
    regHit('q' + i, x, 368, 44, 44, { kind: 'quick', i });
  }
  drawText('1', 202, 414, '#7d6741', { center: true });
  drawText('6', 437, 414, '#7d6741', { center: true });

  drawParticles();

  // перетаскиваемый предмет
  if (S.drag) {
    draw9('rarity_' + S.drag.item.rar, S.mouse.x - 22, S.mouse.y - 22, 44, 44);
    drawSprite(S.drag.item.icon, S.mouse.x - 16, S.mouse.y - 16, 32, 32);
  }

  // подсказка
  if (S.hover && !S.drag) {
    const tip = tooltipFor(S.hover);
    if (tip) drawTooltip(tip, S.mouse.x, S.mouse.y);
  }

  // курсор из атласа
  const cur = S.mouse.down || S.drag ? 'cursor_fist' : 'cursor_hand';
  drawSprite(cur, S.mouse.x - 2, S.mouse.y - 2);

  if (S.hitboxes) {
    ctx.strokeStyle = '#00ff0066';
    for (const h of hits) ctx.strokeRect(h.x + 0.5, h.y + 0.5, h.w, h.h);
  }
}

function pickSlotAt(x, y) {
  for (let i = 0; i < 20; i++) {
    const cx = 46 + (i % 5) * 48, cy = 96 + Math.floor(i / 5) * 48;
    if (x >= cx && x < cx + 44 && y >= cy && y < cy + 44) return i;
  }
  return -1;
}
function pickQuickAt(x, y) {
  for (let i = 0; i < 6; i++) {
    const cx = 180 + i * 47;
    if (x >= cx && x < cx + 44 && y >= 368 && y < 412) return i;
  }
  return -1;
}

function tooltipFor(id) {
  if (id.startsWith('slot')) {
    const it = S.inv[+id.slice(4)];
    return it && { title: it.name, rar: it.rar, lines: it.lines || [] };
  }
  if (id.startsWith('q')) {
    const it = S.quick[+id.slice(1)];
    return it && { title: it.name, rar: it.rar, lines: it.lines || [] };
  }
  if (id.startsWith('gem')) {
    const names = ['РУБИН', 'САПФИР', 'ИЗУМРУД', 'ТОПАЗ', 'ПУСТОЕ ГНЕЗДО'];
    const rars = ['rare', 'magic', 'set', 'rare', 'normal'];
    const i = +id.slice(3);
    return { title: names[i], rar: rars[i], lines: ['ГНЕЗДО: ВСТАВЬ САМОЦВЕТ', 'ДАЁТ СВОЙСТВО ПРЕДМЕТУ'] };
  }
  if (id === 'atk') return { title: 'АТАКА', rar: 'rare', lines: ['НАНЕСТИ УДАР ПО ВРАГУ', 'ВРАГ ОТВЕТИТ'] };
  if (id === 'def') return { title: 'ОБОРОНА', rar: 'magic', lines: ['ПОДНЯТЬ ЩИТ', '+20% К ЗАЩИТЕ НА 5 СЕК'] };
  if (id === 'chk') return { title: 'АВТОПОДБОР', rar: 'normal', lines: ['ПОДБИРАТЬ ЗОЛОТО АВТОМАТИЧЕСКИ'] };
  return null;
}

function drawTooltip(tip, mx, my) {
  const w = Math.max(120, ...tip.lines.concat([tip.title]).map((l) => textW(l) + 24));
  const h = 26 + (tip.lines.length + 1) * 13;
  let x = mx + 14, y = my + 16;
  if (x + w > 636) x = mx - w - 10;
  if (y + h > 476) y = my - h - 10;
  draw9('tooltip_frame', x, y, w, h);
  drawText(tip.title, x + 12, y + 8, RAR_COLOR[tip.rar] || '#c8c0b0');
  tip.lines.forEach((l, i) => drawText(l, x + 12, y + 22 + i * 13, '#c3ad7c'));
}

/* ---------------------------------------------------------- ввод */
function canvasPos(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (640 / r.width), y: (e.clientY - r.top) * (480 / r.height) };
}
stage.addEventListener('mousemove', (e) => {
  const p = canvasPos(e);
  S.mouse.x = p.x; S.mouse.y = p.y;
  if (S.scrollDrag) {
    const travel = 44 - 32;
    const th = Math.max(8, Math.round(travel * Math.min(1, 4 / Math.max(4, S.log.length))));
    const ratio = (p.y - 274 - S.scrollDrag) / Math.max(1, travel - th);
    S.scroll = Math.max(0, Math.min(S.log.length - 4, Math.round(ratio * (S.log.length - 4))));
    return;
  }
  const h = pickHit(p.x, p.y);
  S.hover = h ? h.id : null;
  S.lastHit = h;
});
stage.addEventListener('mouseleave', () => { S.mouse.x = S.mouse.y = -99; S.hover = null; });
stage.addEventListener('mousedown', (e) => {
  const p = canvasPos(e);
  S.mouse.down = true;
  const h = pickHit(p.x, p.y);
  if (!h) return;
  if (h.id === 'sthumb') { S.scrollDrag = p.y - h.y; return; }
  if (h.data && h.data.kind === 'inv') {
    const it = S.inv[h.data.i];
    if (it) S.drag = { from: h.id, item: it };
    return;
  }
  if (h.data && h.data.kind === 'quick') {
    const it = S.quick[h.data.i];
    if (it) S.drag = { from: h.id, item: it };
    return;
  }
});
window.addEventListener('mouseup', (e) => {
  S.mouse.down = false;
  if (S.scrollDrag) { S.scrollDrag = null; return; }
  if (!S.drag) { clickAt(); return; }
  const p = canvasPos(e);
  const target = pickHit(p.x, p.y);
  const fromKind = S.drag.from[0] === 'q' ? 'quick' : 'inv';
  const fromIdx = +S.drag.from.replace(/\D/g, '');
  if (target && target.data && target.data.kind === fromKind) {
    const arr = fromKind === 'quick' ? S.quick : S.inv;
    const to = target.data.i;
    const tmp = arr[to];
    arr[to] = S.drag.item;
    arr[fromIdx] = tmp;
    pushLog('> ПЕРЕМЕЩЕНО: ' + S.drag.item.name);
  } else if (target && target.data && target.data.kind) {
    const arr = target.data.kind === 'quick' ? S.quick : S.inv;
    const src = fromKind === 'quick' ? S.quick : S.inv;
    src[fromIdx] = null;
    arr[target.data.i] = S.drag.item;
    pushLog('> ПЕРЕМЕЩЕНО: ' + S.drag.item.name);
  } else {
    pushLog('> ' + S.drag.item.name + ' ОСТАЁТСЯ НА МЕСТЕ');
  }
  S.drag = null;
});

function clickAt() {
  const h = S.lastHit;
  if (!h) return;
  const id = h.id;
  if (id === 'tab0' || id === 'tab1') { S.tab = +id[3]; return; }
  if (id === 'chk') { S.checked = !S.checked; pushLog(S.checked ? '> АВТОПОДБОР ВКЛЮЧЁН' : '> АВТОПОДБОР ВЫКЛЮЧЕН'); return; }
  if (id === 'sup') { S.scroll = Math.max(0, S.scroll - 1); return; }
  if (id === 'sdown') { S.scroll = Math.min(Math.max(0, S.log.length - 4), S.scroll + 1); return; }
  if (id === 'atk') {
    const dmg = 6 + Math.floor(Math.random() * 10);
    S.hp = Math.max(4, S.hp - dmg);
    spawn('blood', 200 + Math.random() * 200, 150 + Math.random() * 120, 10);
    pushLog('> УДАР! ТЫ ПОТЕРЯЛ ' + dmg + ' ЗДОРОВЬЯ');
    S.btnPress[id] = true; setTimeout(() => (S.btnPress[id] = false), 120);
    return;
  }
  if (id === 'def') {
    S.stam = Math.max(0, S.stam - 15);
    spawn('spark', 478, 230, 1);
    pushLog('> ЩИТ ПОДНЯТ (+20% ЗАЩИТЫ)');
    S.btnPress[id] = true; setTimeout(() => (S.btnPress[id] = false), 120);
    return;
  }
  if (h.data && h.data.kind === 'quick') {
    const it = S.quick[h.data.i];
    if (!it) return;
    if (it.icon === 'icon_potion_health') { S.hp = Math.min(100, S.hp + 40); it.qty--; pushLog('> ВЫПИТО ЗЕЛЬЕ ЛЕЧЕНИЯ'); if (it.qty <= 0) S.quick[h.data.i] = null; spawn('spark', 202 + h.data.i * 47, 390, 1); }
    else if (it.icon === 'icon_potion_mana') { S.mp = Math.min(100, S.mp + 40); it.qty--; pushLog('> ВЫПИТО ЗЕЛЬЕ МАНЫ'); if (it.qty <= 0) S.quick[h.data.i] = null; spawn('spark', 202 + h.data.i * 47, 390, 1); }
    else pushLog('> ' + it.name + ': НЕКОГДА ЧИТАТЬ');
  }
  if (h.data && h.data.kind === 'inv') {
    const it = S.inv[h.data.i];
    if (it && it.icon === 'icon_coin') { S.gold += 250; pushLog('> ПОДОБРАНО 250 ЗОЛОТА'); S.inv[h.data.i] = null; }
  }
}

function pushLog(s) {
  S.log.push(s);
  if (S.log.length > 40) S.log.shift();
  S.scroll = Math.max(0, S.log.length - 4);
  const body = $('#cssScrollBody');
  if (body) body.textContent = S.log.slice().reverse().join('\n');
}

/* ---------------------------------------------------------- цикл */
let last = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  S.t += dt;
  if (S.animOn) {
    S.hp = Math.min(100, S.hp + dt * 1.2);
    S.mp = Math.min(100, S.mp + dt * 2.2);
    S.stam = Math.min(100, S.stam + dt * 4);
    S.xp = (S.xp + dt * 0.7) % 100;
  }
  stepParticles(dt);
  renderScene();
  requestAnimationFrame(loop);
}

/* ------------------------------------------------- CSS-виджеты */
function cropUrl(name) {
  if (cropCache.has(name)) return cropCache.get(name);
  const f = fr(name);
  const c = document.createElement('canvas');
  c.width = f.frame.w; c.height = f.frame.h;
  const cc = c.getContext('2d');
  cc.drawImage(ATLAS.img, f.frame.x, f.frame.y, f.frame.w, f.frame.h, 0, 0, f.frame.w, f.frame.h);
  const url = c.toDataURL();
  cropCache.set(name, url);
  return url;
}
function setNine(el, name, fill) {
  const f = fr(name);
  const n = f.nineSlice || { l: 4, t: 4, r: 4, b: 4 };
  el.style.borderImageSource = 'url(' + cropUrl(name) + ')';
  el.style.borderImageSlice = n.t + ' ' + n.r + ' ' + n.b + ' ' + n.l + (fill ? ' fill' : '');
  el.style.borderImageWidth = n.t + 'px ' + n.r + 'px ' + n.b + 'px ' + n.l + 'px';
  el.style.borderImageRepeat = 'stretch';
}
function buildCssWidgets() {
  setNine($('#cssPanel'), 'panel_frame_ornate', false);
  $('#cssPanel').style.backgroundImage = 'url(' + cropUrl('fill_stone') + ')';
  $('#cssPanel').style.backgroundRepeat = 'repeat';
  setNine($('#cssPanelHead'), 'banner_title', false);
  setNine($('#cssTip'), 'tooltip_frame', true);
  setNine($('#cssScroll'), 'scroll_track', false);
  const rules = [];
  const btnStyles = [
    ['df-btn-stone', 'btn_stone_'],
    ['df-btn-gold', 'btn_gold_'],
  ];
  const states = ['normal', 'hover', 'pressed', 'disabled'];
  for (const [cls, pre] of btnStyles) {
    rules.push(`.${cls}{border-image-source:url(${cropUrl(pre + 'normal')})}`);
    rules.push(`.${cls}:hover:not(:disabled){border-image-source:url(${cropUrl(pre + 'hover')})}`);
    rules.push(`.${cls}:active:not(:disabled){border-image-source:url(${cropUrl(pre + 'pressed')})}`);
    rules.push(`.${cls}:disabled{border-image-source:url(${cropUrl(pre + 'disabled')})}`);
  }
  rules.push(`.df-btn{border-image-slice:9 16 9 16 fill;border-image-width:9px 16px 9px 16px;border-image-repeat:stretch}`);
  rules.push(`.df-round{background:url(${cropUrl('btn_round_normal')}) center/100% 100%}`);
  rules.push(`.df-round:hover{background:url(${cropUrl('btn_round_hover')}) center/100% 100%}`);
  rules.push(`.df-round:active{background:url(${cropUrl('btn_round_pressed')}) center/100% 100%}`);
  rules.push(`.df-bar{border-image-source:url(${cropUrl('bar_frame')});border-image-slice:5 8 5 8;border-image-width:5px 8px 5px 8px;border-image-repeat:stretch}`);
  for (const k of ['blood', 'mana', 'xp']) rules.push(`.fill-${k}{background:url(${cropUrl('bar_fill_' + k)}) repeat-x left center/32px 100%}`);
  for (const [rar] of Object.entries(RAR_COLOR)) rules.push(`.df-chip[data-rar="${rar}"]{border-image-source:url(${cropUrl('rarity_' + rar)})}`);
  rules.push(`.df-chip{border-image-slice:9 9 9 9;border-image-width:9px;border-image-repeat:stretch}`);
  const st = document.createElement('style');
  st.textContent = rules.join('\n');
  document.head.appendChild(st);

  document.querySelectorAll('.df-chip').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const tip = $('#cssTip');
      const rar = el.dataset.rar;
      tip.querySelector('b').textContent = el.textContent.toUpperCase();
      tip.querySelector('b').className = 'rar-' + rar;
    });
  });
  $('#cssBtn1').addEventListener('click', () => pushLog('> CSS-КНОПКА «НАЧАТЬ» НАЖАТА'));
  $('#cssBtn2').addEventListener('click', () => pushLog('> CSS-КНОПКА «КУПИТЬ» НАЖАТА'));
  $('#cssRound').addEventListener('click', () => pushLog('> КРУГЛАЯ КНОПКА ИЗ АТЛАСА'));
  $('#cssScroll').addEventListener('wheel', (e) => {
    e.preventDefault();
    $('#cssScrollBody').scrollTop += e.deltaY;
  });
  $('#cssScrollBody').textContent = S.log.slice().reverse().join('\n');
  setInterval(() => {
    $('#cssHp').style.width = S.hp + '%';
    $('#cssMp').style.width = S.mp + '%';
    $('#cssXp').style.width = S.xp + '%';
  }, 300);
}

/* ------------------------------------------------- инспектор */
function initInspector() {
  const sheet = $('#sheetView');
  const sctx = sheet.getContext('2d');
  sctx.imageSmoothingEnabled = false;
  const scale = sheet.width / ATLAS.meta.meta.size.w;
  let selected = 'panel_frame_heavy';
  let hovered = null;

  function drawSheet() {
    sctx.clearRect(0, 0, sheet.width, sheet.height);
    sctx.drawImage(ATLAS.img, 0, 0, ATLAS.meta.meta.size.w, ATLAS.meta.meta.size.h, 0, 0, sheet.width, sheet.height);
    if (hovered) {
      const f = fr(hovered).frame;
      sctx.strokeStyle = '#fbe89c';
      sctx.strokeRect(f.x * scale + 0.5, f.y * scale + 0.5, f.w * scale, f.h * scale);
    }
    if (selected) {
      const f = fr(selected).frame;
      sctx.strokeStyle = '#ff5a4a';
      sctx.strokeRect(f.x * scale - 0.5, f.y * scale - 0.5, f.w * scale + 1, f.h * scale + 1);
    }
  }
  function at(e) {
    const r = sheet.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * ATLAS.meta.meta.size.w;
    const y = ((e.clientY - r.top) / r.height) * ATLAS.meta.meta.size.h;
    return ATLAS.meta.frames.find((f) => x >= f.frame.x && x < f.frame.x + f.frame.w && y >= f.frame.y && y < f.frame.y + f.frame.h);
  }
  sheet.addEventListener('mousemove', (e) => { hovered = at(e) ? at(e).name : null; drawSheet(); });
  sheet.addEventListener('click', (e) => { const f = at(e); if (f) { selected = f.name; update(); } });

  const play = $('#playView');
  const pctx = play.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  function update() {
    const f = fr(selected);
    $('#inspCard').innerHTML =
      '<b>' + f.name + '</b> · ' + f.group + ' · ' + f.frame.w + '×' + f.frame.h +
      (f.nineSlice ? ' · nine-slice ' + [f.nineSlice.l, f.nineSlice.t, f.nineSlice.r, f.nineSlice.b].join('/') : '') +
      (f.tag ? ' · тег ' + f.tag : '') + '<br>' + (f.desc || '');
    $('#inspJson').textContent = JSON.stringify({ name: f.name, frame: f.frame, nineSlice: f.nineSlice, group: f.group, desc: f.desc }, null, 1);
    drawSheet();
    drawPlay();
  }
  function drawPlay() {
    const f = fr(selected);
    const w = +$('#pw').value, h = +$('#ph').value;
    pctx.clearRect(0, 0, play.width, play.height);
    draw9on(pctx, selected, 10, 10, w, h, $('#noNine').checked);
    drawTextOn(pctx, f.name + '  ' + w + '×' + h, 10, play.height - 16, '#e8c45f');
  }
  function draw9on(c, name, x, y, w, h, plain) {
    const f = fr(name);
    const s = f.frame;
    if (plain || !f.nineSlice) { c.drawImage(ATLAS.img, s.x, s.y, s.w, s.h, x, y, w, h); return; }
    const n = f.nineSlice;
    const l = n.l, t = n.t, r = n.r, b = n.b;
    const sw = s.w - l - r, sh = s.h - t - b;
    const dw = Math.max(1, w - l - r), dh = Math.max(1, h - t - b);
    const P = [
      [0, 0, l, t, 0, 0, l, t], [l, 0, sw, t, l, 0, dw, t], [s.w - r, 0, r, t, w - r, 0, r, t],
      [0, t, l, sh, 0, t, l, dh], [l, t, sw, sh, l, t, dw, dh], [s.w - r, t, r, sh, w - r, t, r, dh],
      [0, s.h - b, l, b, 0, h - b, l, b], [l, s.h - b, sw, b, l, h - b, dw, b], [s.w - r, s.h - b, r, b, w - r, h - b, r, b],
    ];
    for (const q of P) if (q[2] > 0 && q[3] > 0 && q[6] > 0 && q[7] > 0) c.drawImage(ATLAS.img, s.x + q[0], s.y + q[1], q[2], q[3], x + q[4], y + q[5], q[6], q[7]);
  }
  function drawTextOn(c, s, x, y, color) {
    const m = textMask(s);
    c.drawImage(tint(m, '#000'), x + 1, y + 1);
    c.drawImage(tint(m, color), x, y);
  }
  ['#pw', '#ph'].forEach((id) => $(id).addEventListener('input', drawPlay));
  $('#noNine').addEventListener('change', drawPlay);
  update();
}

/* ------------------------------------------------- конвейер */
function buildChips() {
  const m = ATLAS.meta.meta;
  const chips = [
    m.size.w + '×' + m.size.h,
    ATLAS.meta.frames.length + ' кадров',
    m.frameTags.length + ' тегов',
    m.slices.length + ' срезов 9-patch',
    'заполнение ' + Math.round(m.fillRatio * 100) + '%',
    m.layers.length + ' слоёв',
  ];
  $('#chips').innerHTML = chips.map((c) => '<span>' + c + '</span>').join('');
}
async function initPipeline() {
  const m = ATLAS.meta.meta;
  $('#steps').innerHTML = [
    '<b>atlas_plan</b> — реестр: ' + ATLAS.meta.frames.length + ' компонентов, ' + m.slices.length + ' с nine-slice',
    '<b>draw_all</b> — процедурная отрисовка (камень, латунь, дизеринг, фаски)',
    '<b>pack_atlas</b> — skyline-упаковка: ' + m.size.w + '×' + m.size.h + ', заполнение ' + Math.round(m.fillRatio * 100) + '%',
    '<b>export_sheet / export_meta</b> — darkui.png + darkui.json (формат Aseprite)',
    '<b>export_aseprite</b> — darkui.aseprite: кадры, слои, теги, 9-patch срезы',
    '<b>contact_sheet</b> — QA-листы по группам в atlas/qa/',
  ].map((s) => '<li>' + s + '</li>').join('');
  try {
    const txt = await (await fetch('atlas/mcp-session.jsonl')).text();
    const lines = txt.trim().split('\n').map((l) => JSON.parse(l));
    const calls = lines.filter((l) => l.dir === '→' && l.msg.method === 'tools/call');
    $('#sess').innerHTML =
      'сессия: ' + lines.length + ' сообщений · вызовов инструментов: ' + calls.length + '<br>' +
      calls.map((c) => '<span class="t">→</span> ' + c.msg.params.name).join('<br>');
  } catch (e) {
    $('#sess').textContent = 'транскрипт сессии недоступен: ' + e.message;
  }
}

/* ------------------------------------------------- панель управления */
$('#zoom').addEventListener('change', (e) => {
  const z = +e.target.value;
  stage.style.width = 640 * z + 'px';
  stage.style.height = 480 * z + 'px';
});
$('#grid').addEventListener('change', (e) => (S.hitboxes = e.target.checked));
$('#anim').addEventListener('change', (e) => (S.animOn = e.target.checked));
$('#fx').addEventListener('change', (e) => (S.fxOn = e.target.checked));
document.querySelectorAll('#sideTabs button').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('#sideTabs button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + b.dataset.tab));
  })
);
stage.style.width = '1280px';
stage.style.height = '960px';

boot().catch((e) => {
  document.body.insertAdjacentHTML('afterbegin', '<pre style="color:#ff5a4a;padding:20px">' + (e && e.stack || e) + '</pre>');
});
