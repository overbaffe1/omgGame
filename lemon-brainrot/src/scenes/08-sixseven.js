// 08-sixseven : the 6-7 gag. Two numbers, two sub-bass hits.
FILM.scene({
  id: 'sixseven',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // dark hypnotic backdrop
    ctx.fillStyle = '#0B0616';
    ctx.fillRect(0, 0, W, H);
    lib.rays(ctx, t, { speed: -0.7, count: 24, alpha: 0.35, colors: ['#8E5BFF', '#3ED8FF', '#FF4FA3', '#8E5BFF'] });
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.8);
    g.addColorStop(0, 'rgba(142,91,255,0.35)');
    g.addColorStop(1, 'rgba(11,6,22,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const hit1 = t; // number 6 lands at 0
    const hit2 = t - 0.8; // number 7 lands at 0.8
    const sh = lib.shake(t, t < 0.35 ? 30 : t < 1.15 ? 22 : 8, 23);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // «6»
    const s6 = lib.ease.outElastic(lib.clamp01(hit1 / 0.4));
    lib.impact(ctx, '6', W * 0.32, H * 0.52, {
      size: 620,
      scale: 3 - s6 * 2,
      rotate: -0.12 + s6 * 0.06,
      fill: lib.pal.cyan,
      alpha: hit2 > 0 && t > 1.2 ? 0.95 : 1,
    });

    // «7»
    if (hit2 > -0.05) {
      const s7 = lib.ease.outElastic(lib.clamp01(hit2 / 0.4));
      lib.impact(ctx, '7', W * 0.68, H * 0.55, {
        size: 620,
        scale: 3 - s7 * 2,
        rotate: 0.12 - s7 * 0.06,
        fill: lib.pal.pink,
      });
    }

    // dash between
    if (t > 0.5 && t < 1.6) {
      lib.impact(ctx, '—', W * 0.5, H * 0.5, { size: 220, fill: lib.pal.white, maxW: 300 });
    }

    // together
    if (t > 1.25) {
      const s8 = lib.ease.outBack(lib.clamp01((t - 1.25) / 0.35));
      lib.impact(ctx, 'СИКС СЕВЕН!!!', W / 2, H * 0.74, {
        size: 150,
        scale: 1.7 - s8 * 0.7,
        rotate: -0.03,
        fill: lib.pal.lemon,
        maxW: W * 0.88,
      });
    }
    ctx.restore();

    // small print
    if (t > 0.9) {
      lib.impact(ctx, 'это уже невозможно', W / 2, H * 0.12, {
        size: 58,
        alpha: lib.clamp01((t - 0.9) / 0.25),
        fill: lib.pal.white,
        maxW: W * 0.7,
        strokeW: 8,
      });
    }
  },
});
