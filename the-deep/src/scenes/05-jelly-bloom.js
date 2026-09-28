// 05-jelly-bloom : a bloom of moon jellies backlit from above, pulsing on the beat.
FILM.scene({
  id: 'jelly-bloom',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // Twilight water.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, '#173e72'],
      [0.35, lib.pal.mid0],
      [1, lib.pal.mid2],
    ]);

    // Backlight: one broad cone from above, haloing the bloom.
    lib.godrays(ctx, t, {
      x: W * 0.5,
      y: -H * 0.12,
      spread: 0.72,
      count: 5,
      alpha: 0.22,
      color: 'rgba(190,225,255,',
      width: 1.6,
      len: H * 1.3,
    });
    lib.glow(ctx, W * 0.5, H * 0.05, W * 0.85, 'rgba(160,210,255,0.30)', 'rgba(160,210,255,0)');

    // Back row: big soft jellies with glow.
    const back = [
      { x: 0.26, y: 0.30, r: 220, ph: 0.0 },
      { x: 0.74, y: 0.24, r: 190, ph: 0.25 },
      { x: 0.52, y: 0.42, r: 260, ph: 0.5 },
    ];
    for (const b of back) {
      lib.jelly(ctx, t, {
        x: W * b.x + Math.sin(t * 0.4 + b.ph * 9) * 30,
        y: H * b.y + Math.sin(t * 0.55 + b.ph * 7) * 26,
        r: b.r,
        phase: b.ph,
        alpha: 0.55,
        color: 'rgba(170,215,255,0.32)',
        color2: 'rgba(110,170,255,0.12)',
        glowColor: 'rgba(130,200,255,0.30)',
        tentacles: 6,
        tent: 2.2,
      });
    }

    // Mid row: the main characters, bright and crisp.
    const mid = [
      { x: 0.18, y: 0.58, r: 170, ph: 0.15 },
      { x: 0.48, y: 0.66, r: 240, ph: 0.35 },
      { x: 0.82, y: 0.56, r: 185, ph: 0.6 },
      { x: 0.66, y: 0.80, r: 150, ph: 0.8 },
      { x: 0.30, y: 0.86, r: 130, ph: 0.45 },
    ];
    for (const b of mid) {
      lib.jelly(ctx, t, {
        x: W * b.x + Math.sin(t * 0.45 + b.ph * 11) * 36,
        y: H * b.y + Math.sin(t * 0.6 + b.ph * 8) * 30,
        r: b.r,
        phase: b.ph,
        alpha: 0.92,
        color: 'rgba(214,238,255,0.5)',
        color2: 'rgba(150,205,255,0.2)',
        glowColor: 'rgba(120,210,255,0.5)',
        tentacles: 8,
        tent: 2.8,
      });
    }

    // Small fish weaving between the bells.
    for (let i = 0; i < 5; i++) {
      const r1 = lib.hash(i, 66, 1);
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = 170 + r1 * 80;
      const x = dir > 0 ? ((t * speed + r1 * W * 2) % (W * 1.6)) - W * 0.3 : W + W * 0.3 - ((t * speed + r1 * W * 2) % (W * 1.6));
      const y = H * (0.35 + r1 * 0.4) + Math.sin(t * 1.6 + i * 2.2) * 60;
      lib.fish(ctx, t, {
        x,
        y,
        len: 70 + r1 * 24,
        dir,
        phase: i * 1.9,
        color: 'rgba(220,240,255,0.75)',
        eyeColor: 'rgba(30,60,110,0.9)',
      });
    }

    // Upward motes like plankton dust.
    lib.snow(ctx, t, { count: 48, speed: -22, seed: 41, alpha: 0.35, rMin: 1.5, rMax: 5, color: '#cfeaff' });

    lib.text(ctx, 'БАТИПЕЛАГИАЛЬ · 1000–4000 м', 72, H - 96, {
      size: 34,
      weight: '500',
      spacing: 6,
      color: 'rgba(170,210,245,0.55)',
      font: lib.mono,
    });
  },
});
