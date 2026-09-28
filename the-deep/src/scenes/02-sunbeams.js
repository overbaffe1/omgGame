// 02-sunbeams : under the mirror looking up — god rays, fish silhouettes, bubbles.
FILM.scene({
  id: 'sunbeams',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // Water column.
    lib.gradV(ctx, 0, 0, W, H, [
      [0, lib.pal.photic0],
      [0.34, lib.pal.photic1],
      [1, lib.pal.photic2],
    ]);

    // The wavy mirror of the surface across the top.
    ctx.save();
    const mirrorY = H * 0.13;
    const mg = ctx.createLinearGradient(0, -40, 0, mirrorY + 160);
    mg.addColorStop(0, 'rgba(235,250,255,0.95)');
    mg.addColorStop(0.55, 'rgba(160,215,250,0.5)');
    mg.addColorStop(1, 'rgba(160,215,250,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(-40, -80);
    ctx.lineTo(W + 40, -80);
    for (let x = W + 40; x >= -40; x -= 24) {
      const y =
        mirrorY +
        Math.sin(x * 0.008 + t * 1.1) * 26 +
        lib.noise1(x * 0.003 + t * 0.4, 5) * 34;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // bright rim on the mirror
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 24) {
      const y =
        mirrorY +
        Math.sin(x * 0.008 + t * 1.1) * 26 +
        lib.noise1(x * 0.003 + t * 0.4, 5) * 34;
      if (x <= -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Caustic shimmer just under the mirror.
    lib.caustics(ctx, t, mirrorY + 90, mirrorY + 320, 'rgba(220,242,255,0.8)', 0.16, 5);

    // God rays breathing down from above center.
    lib.godrays(ctx, t, {
      x: W * 0.52,
      y: -H * 0.04,
      spread: 1.35,
      count: 9,
      alpha: 0.16,
      color: 'rgba(255,244,208,',
    });

    // Far fish layer: small, pale, slow.
    for (let i = 0; i < 7; i++) {
      const r1 = lib.hash(i, 8, 1);
      const speed = 120 + r1 * 90;
      const dir = i % 2 === 0 ? 1 : -1;
      const x = dir > 0 ? ((t * speed + r1 * W * 2.2) % (W * 1.6)) - W * 0.3 : W + W * 0.3 - ((t * speed + r1 * W * 2.2) % (W * 1.6));
      const y = H * (0.22 + r1 * 0.24) + Math.sin(t * 0.8 + i) * 30;
      lib.fish(ctx, t, {
        x,
        y,
        len: 64 + r1 * 30,
        dir,
        phase: i * 1.7,
        color: 'rgba(30,80,140,0.5)',
        alpha: 0.8,
      });
    }

    // Near fish layer: darker, bigger, lower.
    for (let i = 0; i < 5; i++) {
      const r1 = lib.hash(i, 18, 2);
      const speed = 190 + r1 * 120;
      const dir = i % 2 === 0 ? -1 : 1;
      const x = dir > 0 ? ((t * speed + r1 * W * 2.6) % (W * 1.8)) - W * 0.4 : W + W * 0.4 - ((t * speed + r1 * W * 2.6) % (W * 1.8));
      const y = H * (0.42 + r1 * 0.22) + Math.sin(t * 1.1 + i * 2) * 46;
      lib.fish(ctx, t, {
        x,
        y,
        len: 130 + r1 * 60,
        dir,
        phase: i * 2.3,
        color: 'rgba(8,34,66,0.82)',
      });
    }

    // Bubbles rising from the deep.
    lib.bubbles(ctx, t, { count: 16, speed: 150, seed: 12, alpha: 0.5 });

    // A few slow snow motes.
    lib.snow(ctx, t, { count: 26, speed: 18, seed: 4, alpha: 0.32, rMin: 1.5, rMax: 4 });

    // Zone tag, bottom left, like a slate.
    ctx.save();
    ctx.globalAlpha = 0.8;
    lib.text(ctx, 'ЭПИПЕЛАГИАЛЬ · 0–200 м', 72, H - 96, {
      size: 34,
      weight: '500',
      spacing: 6,
      color: 'rgba(230,244,255,0.9)',
      font: lib.mono,
    });
    ctx.restore();
  },
});
