// 10-vent : a black smoker — mineral chimney, hot cracks, tube worms, drifting smoke.
FILM.scene({
  id: 'vent',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // Deep water, warmed from below.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, '#071224'],
      [0.55, '#0b1220'],
      [1, '#1a0e10'],
    ]);

    // Warm floor glow.
    lib.glow(ctx, W * 0.5, H * 1.02, W * 0.95, 'rgba(255,107,53,0.34)', 'rgba(255,107,53,0)');

    // Floor.
    lib.rocks(ctx, {
      y: H * 0.86,
      amp: 90,
      color: '#1c0f10',
      seed: 41,
      step: 100,
      rimColor: 'rgba(255,120,60,0.5)',
      rimAlpha: 0.55,
      rimWidth: 4,
    });

    // ---- chimney ----
    const cx = W * 0.52;
    const topY = H * 0.16;
    const botY = H * 0.88;
    const width = (k) => 60 + 90 * k + lib.noise1(k * 6 + 1, 13) * 36; // k: 0 top -> 1 base

    ctx.fillStyle = '#241412';
    ctx.beginPath();
    ctx.moveTo(cx - width(0), topY);
    for (let i = 0; i <= 22; i++) {
      const k = i / 22;
      const y = topY + (botY - topY) * k;
      ctx.lineTo(cx - width(k), y);
    }
    for (let i = 22; i >= 0; i--) {
      const k = i / 22;
      const y = topY + (botY - topY) * k;
      ctx.lineTo(cx + width(k) * 0.92, y);
    }
    ctx.closePath();
    ctx.fill();

    // Mineral streaks on the chimney.
    for (let i = 0; i < 10; i++) {
      const r = lib.hash(i, 81, 1);
      const x = cx - width(0.5) + r * width(1) * 1.8;
      ctx.strokeStyle = 'rgba(' + (120 + r * 80) + ',' + (70 + r * 30) + ',' + (50 + r * 20) + ',0.5)';
      ctx.lineWidth = 3 + r * 6;
      ctx.beginPath();
      ctx.moveTo(x + lib.noise1(r * 9, 2) * 12, topY + 40 + r * 120);
      ctx.quadraticCurveTo(x + 18, (topY + botY) / 2, x - 8, botY - 60);
      ctx.stroke();
    }

    // Glowing cracks at the base.
    for (let i = 0; i < 7; i++) {
      const r = lib.hash(i, 91, 2);
      const y = H * (0.72 + r * 0.14);
      const x = cx + (r - 0.5) * width(0.9) * 1.7;
      const flick = 0.55 + 0.45 * Math.sin(t * (3 + r * 4) + i * 2);
      lib.glow(ctx, x, y, 90 * flick, 'rgba(255,140,60,0.8)', 'rgba(255,140,60,0)');
      ctx.fillStyle = 'rgba(255,170,90,' + (0.75 * flick) + ')';
      ctx.beginPath();
      ctx.ellipse(x, y, 22 + r * 18, 7 + r * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- black smoker particles ----
    for (let i = 0; i < 90; i++) {
      const r1 = lib.hash(i, 101, 1);
      const r2 = lib.hash(i, 102, 2);
      const speed = 90 + r1 * 90;
      const life = ((t * speed + r2 * (H * 0.8)) % (H * 0.8)) / (H * 0.8); // 0 base -> 1 top
      const y = botY - 80 - life * (H *0.72);
      const spread = 26 + life * 320;
      const x = cx + (r1 - 0.5) * spread * 1.6 + lib.noise1(life * 4 + i, 3) * 70 * (0.3 + life);
      const a = (1 - life) * 0.5 * (0.4 + 0.6 * r2);
      const rad = 12 + life * 60 + r2 * 18;
      // smoke puff — lit warm near the base, cool grey above
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const warm = life < 0.22 ? 'rgba(120,64,44,' : 'rgba(84,62,64,';
      g.addColorStop(0, warm + a + ')');
      g.addColorStop(1, warm + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // Heat shimmer: vertical light streaks wavering above the base.
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const r = lib.hash(i, 111, 4);
      const x = cx + (r - 0.5) * 420;
      ctx.globalAlpha = 0.10 + 0.06 * Math.sin(t * 2 + i * 2);
      const sg = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.9);
      sg.addColorStop(0, 'rgba(255,150,80,0)');
      sg.addColorStop(1, 'rgba(255,150,80,0.8)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      for (let y = H * 0.45; y <= H * 0.9; y += 30) {
        const wob = Math.sin(y * 0.01 + t * 2.2 + i) * 16;
        if (y === H * 0.45) ctx.moveTo(x + wob, y);
        else ctx.lineTo(x + wob, y);
      }
      ctx.lineWidth = 26;
      ctx.strokeStyle = sg;
      ctx.stroke();
    }
    ctx.restore();

    // ---- tube worms ----
    const worm = (x, y, h, phase, s) => {
      // tube
      lib.strand(ctx, t, {
        x,
        y,
        h,
        sway: 16 * s,
        phase,
        w: 22 * s,
        color: '#d8c9b0',
        color2: '#a89078',
        segs: 8,
      });
      // red plume
      const topX = x + Math.sin(t * 0.8 + phase + 2.2) * 16 * s;
      const topY = y - h;
      ctx.save();
      ctx.translate(topX, topY);
      ctx.rotate(Math.sin(t * 0.9 + phase) * 0.18);
      for (let i = -4; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(220,70,60,' + (0.55 + 0.3 * Math.sin(t * 1.4 + i + phase)) + ')';
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(i * 8 * s, -34 * s, i * 13 * s, -72 * s * (0.7 + 0.3 * Math.cos(i)));
        ctx.stroke();
      }
      ctx.restore();
    };
    worm(W * 0.16, H * 0.92, 300, 0, 1.1);
    worm(W * 0.26, H * 0.95, 220, 1.6, 0.9);
    worm(W * 0.78, H * 0.93, 340, 3.1, 1.2);
    worm(W * 0.88, H * 0.96, 240, 4.4, 0.85);
    worm(W * 0.66, H * 0.97, 180, 2.2, 0.75);

    // Vent shrimp silhouettes on the rocks.
    for (let i = 0; i < 4; i++) {
      const r = lib.hash(i, 121, 5);
      const x = W * (0.12 + i * 0.22) + Math.sin(t * 0.35 + i * 2) * 26;
      const y = H * (0.9 + r * 0.04);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.25 + r * 0.5);
      ctx.fillStyle = 'rgba(255,180,120,0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(26, -2);
      ctx.lineTo(52, -16);
      ctx.lineTo(30, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,120,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, -6);
      ctx.lineTo(66, -30);
      ctx.moveTo(28, -2);
      ctx.lineTo(70, -14);
      ctx.stroke();
      ctx.restore();
    }

    lib.text(ctx, 'АБИССОПЕЛАГИАЛЬ · ГИДРОТЕРМЫ', 72, H - 96, {
      size: 32,
      weight: '500',
      spacing: 5,
      color: 'rgba(255,150,100,0.5)',
      font: lib.mono,
    });
  },
});
