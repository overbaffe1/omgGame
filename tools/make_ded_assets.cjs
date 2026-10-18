#!/usr/bin/env node
/*
 * Печёт ассеты для shorts4 «ДЭД — великий суп» из скриншота профиля.
 *   node tools/make_ded_assets.cjs
 * Зависимости: @napi-rs/canvas (см. film/tools/body51_deps.sh, BODY51_DEPS).
 * Результат: media/ded/face.png — квадратный кроп лица без зелёного статус-дота
 * (дот рисуется процедурно и пульсирует в такт биту).
 */
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas, loadImage } = require(
  process.env.BODY51_DEPS
    ? path.join(process.env.BODY51_DEPS, '@napi-rs/canvas')
    : '@napi-rs/canvas');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'media/ded/card.png');

// Калибровка по пиксельному детекту: круг аватара cx=77, cy=63, R≈52;
// статус-дот центр (108.5, 98.5), r≈9.
const CROP = { x: 28, y: 14, w: 98, h: 98 };
const DOT = { x: 108.5 - CROP.x, y: 98.5 - CROP.y, r: 11.5 }; // в координатах кропа
const SCALE = 4;

(async () => {
  const img = await loadImage(src);
  const S = CROP.w * SCALE;
  const cv = createCanvas(S, S), g = cv.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, S, S);
  // замазать статус-дот тёмным цветом ободка — свой дот нарисует сцена.
  // С растушёвкой, чтобы не осталось светлого полумесяца от фона фото.
  const dr = DOT.r * SCALE;
  const dg = g.createRadialGradient(DOT.x * SCALE, DOT.y * SCALE, dr * 0.55, DOT.x * SCALE, DOT.y * SCALE, dr * 1.35);
  dg.addColorStop(0, '#0c0d10');
  dg.addColorStop(1, 'rgba(12,13,16,0)');
  g.fillStyle = dg;
  g.beginPath();
  g.arc(DOT.x * SCALE, DOT.y * SCALE, dr * 1.35, 0, Math.PI * 2);
  g.fill();

  // «прожарка»: контраст, насыщенность и лёгкий unsharp — лицо держит зум
  const base = createCanvas(S, S), bg = base.getContext('2d');
  bg.imageSmoothingQuality = 'high';
  bg.filter = 'contrast(1.14) saturate(1.28) brightness(1.03)';
  bg.drawImage(cv, 0, 0);
  bg.filter = 'none';
  // карта краёв = |base − blur|
  const edge = createCanvas(S, S), eg = edge.getContext('2d');
  eg.filter = 'blur(2.2px)';
  eg.drawImage(base, 0, 0);
  eg.filter = 'none';
  eg.globalCompositeOperation = 'difference';
  eg.drawImage(base, 0, 0);
  // наложить края поверх — чёткость
  bg.globalCompositeOperation = 'overlay';
  bg.globalAlpha = 0.45;
  bg.drawImage(edge, 0, 0);
  bg.globalCompositeOperation = 'source-over';
  bg.globalAlpha = 1;
  fs.writeFileSync(path.join(root, 'media/ded/face.png'), base.toBuffer('image/png'));
  console.log('media/ded/face.png', S + '×' + S, '(с прожаркой)');

  // контрольный кадр: круг + дот поверх карточки
  const ck = createCanvas(217 * 3, 179 * 3), cg = ck.getContext('2d');
  cg.imageSmoothingQuality = 'high';
  cg.drawImage(img, 0, 0, 217 * 3, 179 * 3);
  const fc = await loadImage(path.join(root, 'media/ded/face.png'));
  cg.save();
  cg.beginPath();
  cg.arc(77 * 3, 63 * 3, 46.5 * 3, 0, Math.PI * 2);
  cg.clip();
  cg.drawImage(fc, (77 - 46.5) * 3, (63 - 46.5) * 3, 93 * 3, 93 * 3);
  cg.restore();
  fs.mkdirSync(path.join(root, '.arena'), { recursive: true });
  fs.writeFileSync(path.join(root, '.arena/face-check.png'), ck.toBuffer('image/png'));
  console.log('.arena/face-check.png готов');
})();
