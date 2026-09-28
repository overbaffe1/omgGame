import { SkibidiType } from './types';

// High-quality seeded rng
function rng(a: number) {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ a >>> 15, a | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// --- HQ BACKGROUNDS ---

export function drawBathroomTiles(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, seed = 1) {
  const r = rng(seed);
  // base wall color with subtle gradient
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, '#f8fafc');
  wallGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  const tileW = 96;
  const tileH = 96;
  // tiles with slight color variation and bevel
  for (let y = 0; y < h; y += tileH) {
    for (let x = 0; x < w; x += tileW) {
      const variation = (r() - 0.5) * 12;
      const base = 248 + variation;
      ctx.fillStyle = `rgb(${base},${base},${base + 2})`;
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);
      // highlight top-left
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x + 1, y + 1, tileW - 2, 2);
      ctx.fillRect(x + 1, y + 1, 2, tileH - 2);
      // shadow bottom-right
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x + tileW - 3, y + 1, 2, tileH - 2);
      ctx.fillRect(x + 1, y + tileH - 3, tileW - 2, 2);
    }
  }
  // grout
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += tileW) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += tileH) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // floor tiles darker
  const floorY = h * 0.78;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#e2e8f0');
  floorGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // floor tiles pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += tileW) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = floorY; y < h; y += tileH * 0.7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ambient occlusion under toilet area
  const ao = ctx.createRadialGradient(w / 2, h * 0.85, 0, w / 2, h * 0.85, 380);
  ao.addColorStop(0, 'rgba(0,0,0,0.18)');
  ao.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ao;
  ctx.fillRect(0, floorY, w, h - floorY);

  // subtle vignette, not heavy
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

export function drawOhioCity(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, seed = 2) {
  const r = rng(seed);
  // high quality sky with 3 gradients
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
  sky.addColorStop(0, '#020617');
  sky.addColorStop(0.25, '#1e1b4b');
  sky.addColorStop(0.55, '#4c1d95');
  sky.addColorStop(0.85, '#fb923c');
  sky.addColorStop(1, '#fdba74');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // stars + moon
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 80; i++) {
    const x = r() * w;
    const y = r() * h * 0.55;
    const s = r() * 1.6 + 0.4;
    const tw = 0.6 + Math.sin(time * 2 + i) * 0.4;
    ctx.globalAlpha = tw;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // moon with craters
  const moonX = w * 0.78;
  const moonY = h * 0.18;
  const moonGrad = ctx.createRadialGradient(moonX - 8, moonY - 8, 0, moonX, moonY, 42);
  moonGrad.addColorStop(0, '#fefce8');
  moonGrad.addColorStop(1, '#eab308');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(moonX - 10, moonY - 6, 8, 0, Math.PI * 2);
  ctx.arc(moonX + 8, moonY + 8, 5, 0, Math.PI * 2);
  ctx.arc(moonX + 2, moonY - 12, 4, 0, Math.PI * 2);
  ctx.fill();
  // moon glow
  ctx.fillStyle = 'rgba(254,252,232,0.18)';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 68, 0, Math.PI * 2);
  ctx.fill();

  // buildings with perspective and details
  let x = -20;
  const buildings: { x: number; y: number; bw: number; bh: number; hue: number }[] = [];
  while (x < w + 20) {
    const bw = 48 + r() * 88;
    const bh = 160 + r() * 320;
    const y = h * 0.62 - bh * 0.25;
    buildings.push({ x, y, bw, bh, hue: r() * 20 - 10 });
    x += bw + 6;
  }
  // sort back to front for proper overlap
  buildings.sort((a, b) => a.bh - b.bh);
  buildings.forEach(b => {
    // building body with gradient for 3D
    const grad = ctx.createLinearGradient(b.x, 0, b.x + b.bw, 0);
    grad.addColorStop(0, `hsl(${240 + b.hue}, 15%, 8%)`);
    grad.addColorStop(0.5, `hsl(${240 + b.hue}, 12%, 12%)`);
    grad.addColorStop(1, `hsl(${240 + b.hue}, 18%, 6%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.y, b.bw, h - b.y);

    // windows with warm light and occasional flicker
    for (let wy = b.y + 14; wy < h * 0.78; wy += 22) {
      for (let wx = b.x + 8; wx < b.x + b.bw - 12; wx += 18) {
        if (r() > 0.35) {
          const flick = r() > 0.92 ? Math.sin(time * 10 + wx) * 0.3 + 0.7 : 1;
          ctx.globalAlpha = flick;
          const isWarm = r() > 0.25;
          ctx.fillStyle = isWarm ? '#fde68a' : '#334155';
          ctx.fillRect(wx, wy, 10, 12);
          // window highlight
          if (isWarm) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(wx, wy, 10, 2);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    // rooftop details
    ctx.fillStyle = '#020617';
    if (r() > 0.5) {
      ctx.fillRect(b.x + b.bw * 0.2, b.y - 12, b.bw * 0.3, 14);
    }
  });

  // ground road with markings
  const groundY = h * 0.82;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, groundY, w, h - groundY);
  // road lines
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, groundY + 24, w, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let lx = (time * 60) % 60 - 60; lx < w; lx += 60) {
    ctx.fillRect(lx, groundY + 56, 32, 6);
  }
  // puddles reflecting moon
  ctx.fillStyle = 'rgba(148,163,184,0.15)';
  for (let i = 0; i < 4; i++) {
    const px = r() * w;
    const py = groundY + 12 + r() * 60;
    ctx.beginPath();
    ctx.ellipse(px, py, 28 + r() * 24, 6 + r() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- HQ TOILET ---

export function drawToiletBase(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: SkibidiType, time: number, seed: number) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // soft shadow with blur imitation via multiple ellipses
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.12 - i * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(0, 30 + i * 2, 44 - i * 4, 12 - i * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // jetpack HQ
  if (type.hasJetpack) {
    // metal body
    const metalGrad = ctx.createLinearGradient(-22, 0, -10, 0);
    metalGrad.addColorStop(0, '#1f2937');
    metalGrad.addColorStop(0.5, '#4b5563');
    metalGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = metalGrad;
    ctx.beginPath();
    ctx.roundRect(-24, -14, 14, 30, 4);
    ctx.fill();
    ctx.fillStyle = metalGrad;
    ctx.beginPath();
    ctx.roundRect(10, -14, 14, 30, 4);
    ctx.fill();
    // bolts
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(-17, -8, 2, 0, Math.PI * 2);
    ctx.arc(-17, 12, 2, 0, Math.PI * 2);
    ctx.arc(17, -8, 2, 0, Math.PI * 2);
    ctx.arc(17, 12, 2, 0, Math.PI * 2);
    ctx.fill();
    // flame with gradient
    const flameH = 10 + Math.sin(time * 24) * 4 + 14;
    const flameGrad = ctx.createLinearGradient(0, 14, 0, 14 + flameH);
    flameGrad.addColorStop(0, '#fef3c7');
    flameGrad.addColorStop(0.3, '#f59e0b');
    flameGrad.addColorStop(0.7, '#ef4444');
    flameGrad.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-17, 16);
    ctx.quadraticCurveTo(-20 + r() * 6, 16 + flameH * 0.5, -17 + (r() - 0.5) * 4, 16 + flameH);
    ctx.quadraticCurveTo(-14, 16 + flameH * 0.5, -17, 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, 16);
    ctx.quadraticCurveTo(14 + r() * 6, 16 + flameH * 0.5, 17 + (r() - 0.5) * 4, 16 + flameH);
    ctx.quadraticCurveTo(20, 16 + flameH * 0.5, 17, 16);
    ctx.closePath();
    ctx.fill();
  }

  // spider legs HQ - mechanical with joints
  if (type.hasLegs) {
    for (let side = -1; side <= 1; side += 2) {
      for (let idx = -1; idx <= 1; idx += 2) {
        const baseX = side * 22;
        const baseY = 8 + idx * 6;
        const kneeX = baseX + side * (20 + Math.sin(time * 3 + side) * 3);
        const kneeY = baseY + 18 + Math.cos(time * 3 + idx) * 3;
        const footX = baseX + side * (32 + Math.sin(time * 2.5 + idx) * 2);
        const footY = baseY + 38;

        // leg segments with shading
        ctx.strokeStyle = type.isAstro ? type.accent : '#27272a';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(baseX * 0.6, baseY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();

        ctx.strokeStyle = type.isAstro ? '#e2e8f0' : '#3f3f46';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        // joints
        ctx.fillStyle = type.isAstro ? type.accent : '#52525b';
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(footX, footY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // toilet bowl HQ - porcelain with gradients and reflections
  // outer shadow side
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(-30, -8);
  ctx.bezierCurveTo(-34, 10, -26, 28, 0, 30);
  ctx.bezierCurveTo(26, 28, 34, 10, 30, -8);
  ctx.lineTo(26, -14);
  ctx.lineTo(-26, -14);
  ctx.closePath();
  ctx.fill();

  // main bowl with radial gradient for 3D
  const bowlGrad = ctx.createRadialGradient(-8, -4, 4, 0, 6, 36);
  if (type.isAstro) {
    bowlGrad.addColorStop(0, '#1e293b');
    bowlGrad.addColorStop(0.4, '#0f172a');
    bowlGrad.addColorStop(1, '#020617');
  } else if (type.isZombie) {
    bowlGrad.addColorStop(0, '#14532d');
    bowlGrad.addColorStop(0.5, '#052e16');
    bowlGrad.addColorStop(1, '#022c22');
  } else {
    bowlGrad.addColorStop(0, '#ffffff');
    bowlGrad.addColorStop(0.35, '#f8fafc');
    bowlGrad.addColorStop(0.75, '#e2e8f0');
    bowlGrad.addColorStop(1, '#cbd5e1');
  }
  ctx.fillStyle = bowlGrad;
  ctx.strokeStyle = type.isAstro ? type.accent : '#0f172a';
  ctx.lineWidth = type.isAstro ? 2.5 : 2;
  ctx.beginPath();
  ctx.moveTo(-30, -8);
  ctx.bezierCurveTo(-32, 8, -24, 26, 0, 28);
  ctx.bezierCurveTo(24, 26, 32, 8, 30, -8);
  ctx.lineTo(26, -16);
  ctx.lineTo(-26, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // porcelain highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-12, -2, 10, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // bowl rim with thickness and highlight
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, -14, 32, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // inner rim shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(0, -14, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // water with waves and reflection
  const waterY = -14;
  const waterGrad = ctx.createRadialGradient(-6, waterY - 2, 0, 0, waterY, 24);
  if (type.isZombie) {
    waterGrad.addColorStop(0, '#4ade80');
    waterGrad.addColorStop(0.5, '#16a34a');
    waterGrad.addColorStop(1, '#14532d');
  } else if (type.id === 'lemon') {
    waterGrad.addColorStop(0, '#fef9c3');
    waterGrad.addColorStop(1, '#facc15');
  } else {
    waterGrad.addColorStop(0, '#7dd3fc');
    waterGrad.addColorStop(0.5, '#38bdf8');
    waterGrad.addColorStop(1, '#0284c7');
  }
  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.ellipse(0, waterY, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // water ripple
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(Math.sin(time * 3) * 1.5, waterY, 14 + Math.sin(time * 4) * 2, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // astro details HQ
  if (type.isAstro) {
    // helmet ring with glow
    ctx.strokeStyle = type.accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = type.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -24, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // stripes with metallic look
    if (type.stripes && type.stripes > 0) {
      for (let s = 0; s < type.stripes; s++) {
        const stripeGrad = ctx.createLinearGradient(-18 + s * 12, -42, -12 + s * 12, -38);
        stripeGrad.addColorStop(0, type.accent);
        stripeGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(-18 + s * 12, -42, 7, 5);
      }
    }

    // side lights
    ctx.fillStyle = type.accent;
    ctx.shadowColor = type.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-12, -6, 3.5, 0, Math.PI * 2);
    ctx.arc(12, -6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // zombie slime drip
  if (type.isZombie) {
    ctx.fillStyle = 'rgba(34,197,94,0.6)';
    ctx.beginPath();
    ctx.moveTo(-18, -4);
    ctx.quadraticCurveTo(-16, 8, -14, 18);
    ctx.quadraticCurveTo(-12, 10, -10, -2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.quadraticCurveTo(16, 10, 12, 22);
    ctx.quadraticCurveTo(10, 8, 12, -4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: SkibidiType, time: number, mouthOpen: number, seed: number) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';

  // smooth bob + stretch (classic skibidi neck)
  const bob = Math.sin(time * 4.5) * 1.8;
  const stretch = 1 + Math.sin(time * 6) * 0.04 * mouthOpen;
  ctx.translate(0, bob);
  ctx.scale(1, stretch);

  // neck
  ctx.fillStyle = type.isZombie ? '#86efac' : '#ffdbac';
  ctx.fillRect(-7, 12, 14, 18);

  if (type.id === 'lemon') {
    // HQ lemon
    const lemonGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 28);
    lemonGrad.addColorStop(0, '#fef08a');
    lemonGrad.addColorStop(0.5, '#facc15');
    lemonGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = lemonGrad;
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // stem + leaf
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -30, 4, 8);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(6, -26, 8, 4, 0.6, 0, Math.PI * 2);
    ctx.fill();
    // pores
    ctx.fillStyle = 'rgba(113,63,18,0.25)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc((r() - 0.5) * 30, (r() - 0.5) * 38, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-8, -5, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // highlight eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-7, -6, 1, 0, Math.PI * 2);
    ctx.arc(9, -6, 1, 0, Math.PI * 2);
    ctx.fill();
    // mouth
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 10 + mouthOpen * 2, 7 + mouthOpen * 4, 5 + mouthOpen * 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.ellipse(0, 12 + mouthOpen * 2, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type.id === 'dog') {
    // HQ dog
    const furGrad = ctx.createRadialGradient(-6, -8, 0, 0, 0, 26);
    furGrad.addColorStop(0, '#d97706');
    furGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = furGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    // muzzle
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // ears floppy
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(-18, -6, 10, 18, -0.35, 0, Math.PI * 2);
    ctx.ellipse(18, -6, 10, 18, 0.35, 0, Math.PI * 2);
    ctx.fill();
    // nose
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 6, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-1, 5, 1, 0, Math.PI * 2);
    ctx.fill();
    // eyes with shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-8, -4, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -4, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-8 + Math.sin(time * 2) * 1, -3, 3, 0, Math.PI * 2);
    ctx.arc(8 + Math.sin(time * 2) * 1, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-7, -5, 1.2, 0, Math.PI * 2);
    ctx.arc(9, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // mouth open
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 14 + mouthOpen * 3, 6 + mouthOpen * 2, 3 + mouthOpen * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (mouthOpen > 0.4) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.ellipse(0, 16 + mouthOpen * 2, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type.id === 'cat') {
    // HQ cat
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    // ears with inner pink
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(-22, -30);
    ctx.lineTo(-6, -22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -14);
    ctx.lineTo(22, -30);
    ctx.lineTo(6, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.moveTo(-14, -16);
    ctx.lineTo(-18, -26);
    ctx.lineTo(-8, -20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -16);
    ctx.lineTo(18, -26);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();
    // eyes green
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.ellipse(-7, -2, 5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -2, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(-7, -2, 1.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -2, 1.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // nose + whiskers
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(0, 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(-22, 0);
    ctx.moveTo(-12, 5);
    ctx.lineTo(-22, 6);
    ctx.moveTo(12, 2);
    ctx.lineTo(22, 0);
    ctx.moveTo(12, 5);
    ctx.lineTo(22, 6);
    ctx.stroke();
    // mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(-3, 10 + mouthOpen * 2, -5, 12);
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(3, 10 + mouthOpen * 2, 5, 12);
    ctx.stroke();
  } else {
    // human HQ
    const skinGrad = ctx.createRadialGradient(-4, -6, 0, 0, 0, 26);
    if (type.isZombie) {
      skinGrad.addColorStop(0, '#bbf7d0');
      skinGrad.addColorStop(1, '#16a34a');
    } else if (type.isAstro) {
      skinGrad.addColorStop(0, '#e0e7ff');
      skinGrad.addColorStop(1, '#a5b4fc');
    } else {
      skinGrad.addColorStop(0, '#ffedd5');
      skinGrad.addColorStop(0.5, '#ffdbac');
      skinGrad.addColorStop(1, '#fdba74');
    }
    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = type.isZombie ? '#14532d' : '#1f2937';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 21, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // blush
    if (!type.isZombie && !type.isAstro) {
      ctx.fillStyle = 'rgba(251,113,133,0.25)';
      ctx.beginPath();
      ctx.ellipse(-10, 6, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(10, 6, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // hair / helmet HQ
    if (type.isAstro) {
      const helmGrad = ctx.createLinearGradient(0, -28, 0, -8);
      helmGrad.addColorStop(0, type.accent);
      helmGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = helmGrad;
      ctx.beginPath();
      ctx.arc(0, -10, 23, Math.PI * 1.05, -0.05);
      ctx.lineTo(18, -8);
      ctx.lineTo(-18, -8);
      ctx.closePath();
      ctx.fill();
      // visor
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath();
      ctx.roundRect(-15, -8, 30, 10, 3);
      ctx.fill();
      ctx.fillStyle = type.accent;
      ctx.shadowColor = type.accent;
      ctx.shadowBlur = 8;
      ctx.fillRect(-15, -8, 30, 2.5);
      ctx.shadowBlur = 0;
      // side details
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-22, -4, 4, 6);
      ctx.fillRect(18, -4, 4, 6);
    } else if (type.id === 'sigma') {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.ellipse(0, -14, 19, 11, 0, Math.PI, 0);
      ctx.fill();
      // sunglasses HQ with reflection
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.roundRect(-15, -6, 13, 8, 2);
      ctx.roundRect(2, -6, 13, 8, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(-15, -6);
      ctx.lineTo(-12, -2);
      ctx.lineTo(-9, -6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, -6);
      ctx.lineTo(5, -2);
      ctx.lineTo(8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(-2, -3, 4, 2);
    } else if (type.id === 'gigachad') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(-19, -8);
      ctx.quadraticCurveTo(-20, -20, -6, -22);
      ctx.quadraticCurveTo(0, -24, 6, -22);
      ctx.quadraticCurveTo(20, -20, 19, -8);
      ctx.lineTo(18, -10);
      ctx.quadraticCurveTo(6, -18, 0, -18);
      ctx.quadraticCurveTo(-6, -18, -18, -10);
      ctx.closePath();
      ctx.fill();
      // beard
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.ellipse(0, 16, 14, 10, 0, 0.2, Math.PI - 0.2);
      ctx.fill();
    } else {
      // normal hair with volume
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(0, -16, 19, 12, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(-2, -18, 14, 8, 0, Math.PI, 0);
      ctx.fill();
    }

    // eyes HQ with iris
    const eyeY = -2;
    const lookX = Math.sin(time * 1.8) * 1.5;
    const blink = Math.sin(time * 7) > 0.96 ? 0.1 : 1;

    // sclera
    ctx.fillStyle = type.isZombie ? '#dcfce7' : '#fff';
    ctx.beginPath();
    ctx.ellipse(-8 + lookX * 0.2, eyeY, 6, 7 * blink, 0, 0, Math.PI * 2);
    ctx.ellipse(8 + lookX * 0.2, eyeY, 6, 7 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (blink > 0.5) {
      // iris
      const irisColor = type.isZombie ? '#22c55e' : type.isAstro ? type.accent : '#3b82f6';
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(-8 + lookX, eyeY + 0.5, 3.2, 0, Math.PI * 2);
      ctx.arc(8 + lookX, eyeY + 0.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // pupil
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-8 + lookX, eyeY + 0.5, 1.8, 0, Math.PI * 2);
      ctx.arc(8 + lookX, eyeY + 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-7 + lookX, eyeY - 0.5, 1, 0, Math.PI * 2);
      ctx.arc(9 + lookX, eyeY - 0.5, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type.isZombie) {
      // veins
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.quadraticCurveTo(-18, -14, -16, -18);
      ctx.moveTo(14, -10);
      ctx.quadraticCurveTo(18, -14, 16, -18);
      ctx.moveTo(-10, 12);
      ctx.quadraticCurveTo(-12, 16, -8, 18);
      ctx.stroke();
      // drool
      ctx.fillStyle = 'rgba(74,222,128,0.5)';
      ctx.beginPath();
      ctx.ellipse(6, 18, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // nose
    ctx.fillStyle = type.isZombie ? '#16a34a' : '#fdba74';
    ctx.beginPath();
    ctx.ellipse(0, 4, 2.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 1.2, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // mouth HQ - animated singing
    const mw = 9 + mouthOpen * 7;
    const mh = 4 + mouthOpen * 12;
    // outer lips
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 12, mw, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    // inner mouth
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(0, 13 + mouthOpen, mw * 0.7, mh * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // tongue
    if (mouthOpen > 0.2) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.ellipse(0, 14 + mouthOpen * 2, mw * 0.35, 2 + mouthOpen * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // upper teeth
    if (mouthOpen > 0.3) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-mw * 0.55, 9, mw * 1.1, 2.5, 1);
      ctx.fill();
      // lower teeth if wide open
      if (mouthOpen > 0.6) {
        ctx.beginPath();
        ctx.roundRect(-mw * 0.4, 15 + mouthOpen, mw * 0.8, 1.8, 1);
        ctx.fill();
      }
    }
    // lip highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-mw * 0.3, 10, mw * 0.2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // buzzsaw HQ
  if (type.hasBuzzsaw) {
    ctx.save();
    ctx.translate(26, 10);
    ctx.rotate(time * 14);
    // hub
    const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
    hubGrad.addColorStop(0, '#e4e4e7');
    hubGrad.addColorStop(1, '#52525b');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    // teeth
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.moveTo(14, -1.5);
      ctx.lineTo(22, 0);
      ctx.lineTo(14, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // center bolt
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // arms for mutant
  if (type.hasArms && !type.hasBuzzsaw) {
    ctx.fillStyle = type.isZombie ? '#86efac' : '#ffdbac';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-28, 8, 8, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(20, 8, 8, 18, 4);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTitan(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: SkibidiType, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';

  // shadow with gradient
  const shadowGrad = ctx.createRadialGradient(0, 52, 0, 0, 52, 60);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, 52, 60, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs with shading
  const legGrad = ctx.createLinearGradient(-20, 46, -8, 46);
  legGrad.addColorStop(0, '#1f2937');
  legGrad.addColorStop(1, '#374151');
  ctx.fillStyle = legGrad;
  ctx.beginPath();
  ctx.roundRect(-20, 46, 14, 30, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(6, 46, 14, 30, 4);
  ctx.fill();

  // body armor
  const bodyGrad = ctx.createLinearGradient(-24, -12, 24, 60);
  bodyGrad.addColorStop(0, '#374151');
  bodyGrad.addColorStop(0.5, '#1f2937');
  bodyGrad.addColorStop(1, '#111827');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-24, -12, 48, 60, 8);
  ctx.fill();

  // chest plate details
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(-18, -4, 36, 4);
  ctx.fillRect(-18, 8, 36, 2);
  // bolts
  ctx.fillStyle = '#6b7280';
  for (let bx of [-16, 16]) {
    for (let by of [-6, 6, 20, 36]) {
      ctx.beginPath();
      ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // arms with joints
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(-38, -8, 14, 40, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(24, -8, 14, 40, 6);
  ctx.fill();
  // hands
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.roundRect(-38, 28, 14, 10, 3);
  ctx.roundRect(24, 28, 14, 10, 3);
  ctx.fill();

  // head device HQ
  if (type.id.includes('camera')) {
    // camera body
    const camGrad = ctx.createLinearGradient(-20, -40, 20, -14);
    camGrad.addColorStop(0, '#0f172a');
    camGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = camGrad;
    ctx.beginPath();
    ctx.roundRect(-20, -40, 40, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // top bar
    ctx.fillStyle = '#475569';
    ctx.fillRect(-18, -38, 36, 6);

    // lens housing
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, -22, 12, 0, Math.PI * 2);
    ctx.fill();

    // lens with glass reflection
    const lensPulse = 1 + Math.sin(time * 5) * 0.15;
    const lensGrad = ctx.createRadialGradient(-3, -25, 0, 0, -22, 10 * lensPulse);
    lensGrad.addColorStop(0, '#7dd3fc');
    lensGrad.addColorStop(0.5, '#0ea5e9');
    lensGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = lensGrad;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16 * lensPulse;
    ctx.beginPath();
    ctx.arc(0, -22, 9 * lensPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // lens reflection
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-3, -25, 3, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // red recording light
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(14, -34, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (type.id.includes('speaker')) {
    const spkGrad = ctx.createLinearGradient(-22, -44, 22, -14);
    spkGrad.addColorStop(0, '#7f1d1d');
    spkGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = spkGrad;
    ctx.beginPath();
    ctx.roundRect(-22, -44, 44, 36, 6);
    ctx.fill();

    // speaker cone
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, -26, 14, 0, Math.PI * 2);
    ctx.fill();
    const coneGrad = ctx.createRadialGradient(0, -26, 0, 0, -26, 14);
    coneGrad.addColorStop(0, '#52525b');
    coneGrad.addColorStop(1, '#27272a');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.arc(0, -26, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, -26, 3, 0, Math.PI * 2);
    ctx.fill();

    // sound waves
    ctx.strokeStyle = 'rgba(248,113,113,0.7)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const r = 20 + i * 12 + Math.sin(time * 8 + i) * 3;
      const alpha = 0.7 - i * 0.15;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, -26, r, -0.8, 0.8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (type.id.includes('tv')) {
    // tv frame
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(-24, -46, 48, 38, 4);
    ctx.fill();
    // screen
    if (type.isZombie || Math.sin(time * 3) > 0.3) {
      // static noise
      const imgData = ctx.createImageData(42, 32);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = type.isZombie ? v * 0.2 : v;
        imgData.data[i + 1] = type.isZombie ? v * 0.8 : v;
        imgData.data[i + 2] = type.isZombie ? v * 0.3 : v;
        imgData.data[i + 3] = 255;
      }
      ctx.putImageData(imgData, -21, -43);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-21, -43, 42, 32);
      // face on tv
      ctx.fillStyle = '#fff';
      ctx.font = '900 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('◉_◉', 0, -24);
    }
    // antenna
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -46);
    ctx.lineTo(-14, -56);
    ctx.moveTo(8, -46);
    ctx.lineTo(14, -56);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-14, -56, 2, 0, Math.PI * 2);
    ctx.arc(14, -56, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type.id.includes('clock')) {
    const clockGrad = ctx.createRadialGradient(-4, -28, 0, 0, -24, 20);
    clockGrad.addColorStop(0, '#fef3c7');
    clockGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = clockGrad;
    ctx.beginPath();
    ctx.arc(0, -24, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    // tick marks
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 16 + 0, Math.sin(ang) * 16 - 24);
      ctx.lineTo(Math.cos(ang) * 18 + 0, Math.sin(ang) * 18 - 24);
      ctx.stroke();
    }
    // hands
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(time * 2.5);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1, -16, 2, 16);
    ctx.restore();
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(time * 0.4);
    ctx.fillRect(-1.5, -12, 3, 12);
    ctx.restore();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, -24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // jetpack for titan if needed
  if (type.id === 'titan-cameraman' || type.id.includes('astro')) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-16, 6, 10, 22, 3);
    ctx.roundRect(6, 6, 10, 22, 3);
    ctx.fill();
    // flame
    const fh = 8 + Math.sin(time * 18) * 4;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-11, 28);
    ctx.lineTo(-14, 28 + fh);
    ctx.lineTo(-8, 28 + fh);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, 28);
    ctx.lineTo(8, 28 + fh);
    ctx.lineTo(14, 28 + fh);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawGlitch(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number) {
  if (intensity <= 0.01) return;
  ctx.save();
  // subtle rgb split only on strong beats, not constant flicker
  if (intensity > 0.6) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.06 * intensity;
    ctx.fillStyle = '#ff0040';
    ctx.fillRect(2, 0, w, h);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-2, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  // single slice, not many
  if (intensity > 0.7 && Math.random() > 0.7) {
    const y = Math.random() * h * 0.6 + h * 0.15;
    const sh = 12 + Math.random() * 24;
    const off = (Math.random() - 0.5) * 18 * intensity;
    ctx.globalAlpha = 0.18;
    ctx.drawImage(ctx.canvas, 0, y, w, sh, off, y, w, sh);
  }
  ctx.restore();
}

export function drawCaption(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, time: number, seed: number) {
  const r = rng(seed);
  ctx.save();
  // smooth animation, not jittery
  const bounce = Math.sin(time * 6) * 2;
  const scale = 1 + Math.sin(time * 8) * 0.015;
  ctx.translate(w / 2, h * 0.84 + bounce);
  ctx.scale(scale, scale);
  // no rotation for readability

  const fontSize = Math.min(72, Math.floor(w * 0.072));
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // multiple outlines for high quality
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 14;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 22;
  ctx.globalAlpha = 0.4;
  ctx.strokeText(text, 0, 0);
  ctx.globalAlpha = 1;

  // gradient fill
  const grad = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  grad.addColorStop(0, '#facc15');
  grad.addColorStop(0.3, '#ffffff');
  grad.addColorStop(0.7, '#ffffff');
  grad.addColorStop(1, '#f472b6');
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);

  // inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `900 ${fontSize}px system-ui`;
  ctx.fillText(text, 0, -1.5);

  ctx.restore();
}
