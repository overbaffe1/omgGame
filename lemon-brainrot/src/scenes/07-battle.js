// 07-battle : LEMONCOPTER vs kaiju — laser eyes, explosions, flashes.
FILM.scene({
  id: 'battle',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // comic-book split background
    lib.rays(ctx, t, { speed: 1.1, count: 20, alpha: 1 });
    ctx.fillStyle = 'rgba(20,10,40,0.35)';
    ctx.fillRect(0, 0, W, H);
    // diagonal white bolts
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const x = i * 260 + ((t * 140) % 260) - 200;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 110, 0);
      ctx.lineTo(x - 220, H);
      ctx.lineTo(x - 330, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const sh = lib.shake(t, 12, 19);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // kaiju lemon on the right
    const kx = W * 0.72;
    const ky = H * 0.42;
    lib.lemonHead(ctx, t, { x: kx, y: ky, r: 330, mood: 'angry', laser: 1 });

    // laser eyes — beams toward the copter
    const cx = W * 0.24 + Math.sin(t * 2.2) * 60;
    const cy = H * 0.3 + Math.cos(t * 1.8) * 70;
    for (const ey of [ky - 40, ky + 10]) {
      const g = ctx.createLinearGradient(kx, ey, cx, cy);
      g.addColorStop(0, 'rgba(255,40,30,0.95)');
      g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(kx - 240, ey);
      ctx.lineTo(cx - 40, cy - 30);
      ctx.lineTo(cx - 40, cy + 30);
      ctx.closePath();
      ctx.fill();
      // hot core
      ctx.strokeStyle = 'rgba(255,220,200,0.9)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(kx - 250, ey);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    // lemoncopter banking away
    lib.lemoncopter(ctx, t, { x: cx, y: cy, s: 0.62, flip: true, mood: 'scream' });

    // explosions on the off-beats
    for (let i = 0; i < 5; i++) {
      const bt = 0.4 + i * 0.72;
      const dt = t - bt;
      if (dt >= 0 && dt < 1.0) {
        const ex = W * (0.35 + lib.hash(i, 61, 1) * 0.5);
        const ey = H * (0.35 + lib.hash(i, 62, 2) * 0.4);
        lib.explosion(ctx, ex, ey, 170 + lib.hash(i, 63, 3) * 90, dt);
      }
    }
    ctx.restore();

    // flash frames
    const fl = lib.beat(t, 1.44);
    if (fl > 0.82) {
      ctx.fillStyle = 'rgba(255,255,255,' + (fl - 0.82) * 3 + ')';
      ctx.fillRect(0, 0, W, H);
    }

    // caption
    const cs = lib.ease.outBack(lib.clamp01(t / 0.3));
    lib.impact(ctx, 'БИТВА ВЕКА', W / 2, H * 0.16, {
      size: 165,
      scale: 2 - cs,
      rotate: -0.04,
      fill: lib.pal.red,
      maxW: W * 0.85,
    });
    if (t > 3) {
      lib.impact(ctx, 'кто победит? жми на лайк', W / 2, H * 0.92, {
        size: 54,
        alpha: lib.clamp01((t - 3) / 0.3),
        fill: lib.pal.white,
        maxW: W * 0.85,
        strokeW: 7,
      });
    }
  },
});
