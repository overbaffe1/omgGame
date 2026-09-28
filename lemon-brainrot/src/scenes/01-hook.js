// 01-hook : screaming lemon in your face. Скрим-хук первые полторы секунды.
FILM.scene({
  id: 'hook',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // Red-hot radial background over rainbow rays.
    lib.rays(ctx, t, { speed: 1.6, count: 14, alpha: 0.9 });
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, W * 0.9);
    g.addColorStop(0, 'rgba(255,60,30,' + (0.25 + 0.2 * pulse) + ')');
    g.addColorStop(0.55, 'rgba(255,30,60,0.32)');
    g.addColorStop(1, 'rgba(120,0,40,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const sh = lib.shake(t, 22, 5);
    const zoom = 1.35 + lib.beat(t, 0.4) * 0.1;

    ctx.save();
    ctx.translate(sh.x, sh.y);
    lib.punch(ctx, zoom, () => {
      lib.speedLines(ctx, t, { count: 34, r0: 420, len: 320, color: 'rgba(255,255,255,0.55)', alpha: 0.5 });
      lib.lemonHead(ctx, t, {
        x: W / 2,
        y: H * 0.46,
        r: 360,
        mood: 'scream',
        blink: Math.floor(t * 6) % 2 === 0 && t > 0.8 ? 0.6 : 0,
      });
    });
    ctx.restore();

    // Captions slam in.
    const s1 = lib.ease.outBack(lib.clamp01(t / 0.18));
    lib.impact(ctx, 'БУ!!!', W / 2, H * 0.16, {
      size: 200,
      scale: 0.4 + s1 * 0.6,
      rotate: -0.06,
      fill: lib.pal.red,
      maxW: W * 0.7,
    });

    if (t > 0.55) {
      const s2 = lib.ease.outBack(lib.clamp01((t - 0.55) / 0.22));
      lib.impact(ctx, 'ЭТО СКИБИДИ?!', W / 2, H * 0.86, {
        size: 128,
        scale: 0.3 + s2 * 0.7,
        rotate: 0.04,
        maxW: W * 0.86,
      });
    }

    // star sparks on the beats
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 2;
      const r = 380 + lib.beat(t, 0.4) * 80;
      lib.sparkle(ctx, W / 2 + Math.cos(a) * r, H * 0.46 + Math.sin(a) * r, 34 + lib.hash(i, 3, 1) * 22, 0.9);
    }
  },
});
