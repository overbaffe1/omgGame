// 13-outro : ПОДПИШИСЬ — или лимон найдёт тебя. Финальный чант.
FILM.scene({
  id: 'outro',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    lib.rays(ctx, t, { speed: 0.5, count: 18, alpha: 1 });
    const shade = ctx.createRadialGradient(W / 2, H * 0.45, 120, W / 2, H * 0.45, W * 0.95);
    shade.addColorStop(0, 'rgba(255,225,77,0.15)');
    shade.addColorStop(1, 'rgba(60,20,80,0.5)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    lib.checkerFloor(ctx, t, { y0: H * 0.72, speed: 200 });

    const sh = lib.shake(t, 5, 43);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // the witness — lemon with sunglasses, bobbing
    const bob = Math.sin(t * 2) * 18;
    lib.lemonHead(ctx, t, {
      x: W / 2,
      y: H * 0.52 + bob,
      r: 240,
      mood: t > 3.2 ? 'happy' : 'sus',
      sunglasses: true,
      blink: 0,
    });

    // sparkles
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.8;
      const r = 420 + 70 * Math.sin(t * 2 + i * 1.7);
      lib.sparkle(ctx, W / 2 + Math.cos(a) * r, H * 0.52 + Math.sin(a) * r * 0.9, 30 + lib.hash(i, 91, 1) * 30, 0.9);
    }
    ctx.restore();

    // chant line
    const words = ['СКИБИДИ', 'ДОП ДОП', 'ДА ДА', 'ЕС ЕС'];
    const wi = Math.min(3, Math.floor(t / 0.8));
    const cs = lib.ease.outBack(lib.beat(t, 0.8));
    lib.impact(ctx, words[wi], W / 2, H * 0.16, {
      size: 130,
      scale: 0.6 + cs * 0.45,
      rotate: (lib.hash(wi, 2, 1) - 0.5) * 0.1,
      fill: [lib.pal.cyan, lib.pal.lemon, lib.pal.pink, lib.pal.white][wi],
      maxW: W * 0.7,
    });

    // SUBSCRIBE slam
    if (t > 1.6) {
      const s = lib.ease.outElastic(lib.clamp01((t - 1.6) / 0.5));
      lib.impact(ctx, 'ПОДПИШИСЬ', W / 2, H * 0.87, {
        size: 190,
        scale: 2.2 - s * 1.2,
        rotate: -0.03,
        fill: lib.pal.red,
        maxW: W * 0.85,
      });
    }
    if (t > 2.6) {
      lib.impact(ctx, 'или лимон найдёт тебя', W / 2, H * 0.945, {
        size: 56,
        alpha: lib.clamp01((t - 2.6) / 0.3),
        fill: lib.pal.white,
        maxW: W * 0.8,
        strokeW: 8,
      });
    }

    // final yellow flash into the tail
    if (t > 3.9) {
      const f = lib.clamp01((t - 3.9) / 0.5) * 0.55;
      ctx.fillStyle = 'rgba(255,225,77,' + f + ')';
      ctx.fillRect(0, 0, W, H);
    }
  },
});
