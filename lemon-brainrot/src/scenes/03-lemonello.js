// 03-lemonello : LEMONELLO KAPUCHINELLO dances on stage, his name slams in.
FILM.scene({
  id: 'lemonello',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    lib.rays(ctx, t, { speed: 0.8, count: 18, alpha: 1 });
    lib.checkerFloor(ctx, t, { y0: H * 0.66, speed: 320 });

    // stage glow
    const g = ctx.createRadialGradient(W / 2, H * 0.62, 60, W / 2, H * 0.62, W * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const sh = lib.shake(t, 6, 7);
    const zoom = 1 + lib.beat(t, 0.8) * 0.05;

    ctx.save();
    ctx.translate(sh.x, sh.y);
    lib.punch(ctx, zoom, () => {
      // the man himself
      lib.lemonChar(ctx, t, {
        x: W / 2,
        y: H * 0.56,
        r: 190,
        mood: 'happy',
        sunglasses: t > 2.2,
        bounce: 1,
      });

      // steam cup in his raised hand — капучино!
      const swing = Math.sin(t * Math.PI * 4);
      ctx.save();
      ctx.translate(W / 2 + 190 * 1.02 + 0.62 * 190, H * 0.56 - Math.abs(swing) * 30 + 0.34 * 190);
      ctx.rotate(-0.3 + swing * 0.2);
      ctx.fillStyle = '#FFF7E8';
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-46, -40);
      ctx.lineTo(46, -40);
      ctx.lineTo(34, 52);
      ctx.lineTo(-34, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // foam + steam
      ctx.fillStyle = '#C98A4B';
      ctx.beginPath();
      ctx.ellipse(0, -38, 48, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 10;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 26, -56);
        ctx.quadraticCurveTo(i * 26 + 18, -96, i * 26 - 6, -132);
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();

    // name slam
    const n1 = lib.ease.outBack(lib.clamp01((t - 0.15) / 0.3));
    lib.impact(ctx, 'ЛИМОНЕЛЛО', W / 2, H * 0.16, {
      size: 150,
      scale: 2 - n1,
      rotate: -0.03,
      fill: lib.pal.lemon,
      maxW: W * 0.9,
    });
    if (t > 0.55) {
      const n2 = lib.ease.outBack(lib.clamp01((t - 0.55) / 0.3));
      lib.impact(ctx, 'КАПУЧИНЕЛЛО', W / 2, H * 0.235, {
        size: 118,
        scale: 2 - n2,
        rotate: 0.03,
        fill: lib.pal.orange,
        maxW: W * 0.9,
      });
    }
    if (t > 1.6) {
      const a = lib.clamp01((t - 1.6) / 0.3);
      lib.impact(ctx, 'лимон + капучино = скибиди', W / 2, H * 0.93, {
        size: 56,
        alpha: a,
        fill: lib.pal.cyan,
        maxW: W * 0.82,
        strokeW: 8,
      });
    }
  },
});
