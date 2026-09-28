// 02-title : slam title on the meme stage.
FILM.scene({
  id: 'title',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    lib.rays(ctx, t, { speed: 0.55, count: 16, alpha: 1 });
    lib.checkerFloor(ctx, t, { y0: H * 0.62, speed: 260 });

    const sh = lib.shake(t, 8, 3);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // two slam lines: «ЛИМОННЫЙ» then «БРЕЙНРОТ»
    const s1 = lib.ease.outElastic(lib.clamp01(t / 0.45));
    lib.impact(ctx, 'ЛИМОННЫЙ', W / 2, H * 0.38, {
      size: 210,
      scale: 1.6 - s1 * 0.6,
      rotate: -0.05 + s1 * 0.02,
      fill: lib.pal.lemon,
      maxW: W * 0.88,
    });

    if (t > 0.35) {
      const s2 = lib.ease.outElastic(lib.clamp01((t - 0.35) / 0.45));
      lib.impact(ctx, 'БРЕЙНРОТ', W / 2, H * 0.52, {
        size: 210,
        scale: 1.6 - s2 * 0.6,
        rotate: 0.05 - s2 * 0.02,
        fill: lib.pal.orange,
        maxW: W * 0.88,
      });
    }

    // ribbon with the formula
    if (t > 0.9) {
      const a = lib.clamp01((t - 0.9) / 0.3);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, lib.ease.outBack(a) * 30 - 30);
      ctx.fillStyle = lib.pal.ink;
      ctx.fillRect(W * 0.08, H * 0.585, W * 0.84, 128);
      lib.impact(ctx, 'СКИБИДИ ДОП ДОП · ДА ДА ЕС ЕС', W / 2, H * 0.585 + 92, {
        size: 58,
        fill: lib.pal.cyan,
        maxW: W * 0.78,
        strokeW: 8,
      });
      ctx.restore();
    }
    ctx.restore();

    // orbiting sparks
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 1.4;
      const r = 320 + 60 * Math.sin(t * 2 + i);
      lib.sparkle(ctx, W / 2 + Math.cos(a) * r * 1.6, H * 0.45 + Math.sin(a) * r, 26 + lib.hash(i, 9, 2) * 26, 0.95);
    }
  },
});
