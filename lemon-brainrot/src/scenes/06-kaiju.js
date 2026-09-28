// 06-kaiju : a giant lemon walks through the city. Every step shakes the frame.
FILM.scene({
  id: 'kaiju',
  draw(t, info) {
    const ctx = FILM.ctx;
    const W = FILM.W;
    const H = FILM.H;
    const lib = FILM.lib;

    // angry sky
    lib.rays(ctx, t * 0.4, { speed: 0.12, count: 12, alpha: 1, colors: ['#FF5A2A', '#FF8A00', '#FFB300', '#FF4FA3'] });
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, 'rgba(120,20,60,0.35)');
    sky.addColorStop(0.6, 'rgba(255,90,40,0.12)');
    sky.addColorStop(1, 'rgba(60,10,40,0.5)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // step beat: 0.8 s
    const step = lib.beat(t, 0.8);
    const sh = lib.shake(t, 10 + step * 26, 17);
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // giant lemon behind the skyline
    const gx = W * 0.52 + Math.sin(t * 0.7) * 90;
    const gy = H * 0.34 + step * 40;
    lib.punch(ctx, 1 + step * 0.03, () => {
      lib.lemonHead(ctx, t, {
        x: gx,
        y: gy,
        r: 470,
        mood: 'angry',
        blink: 0,
      });
    });

    // fleeing cars on the ground line
    for (let i = 0; i < 4; i++) {
      const r = lib.hash(i, 41, 1);
      const dir = i % 2 === 0 ? -1 : 1;
      const speed = 320 + r * 200;
      const x = dir > 0 ? ((t * speed + r * W * 2) % (W * 1.6)) - W * 0.3 : W + W * 0.3 - ((t * speed + r * W * 2) % (W * 1.6));
      const y = H * 0.885 - (i % 2) * 60;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.fillStyle = ['#FF3B30', '#3ED8FF', '#FFD23F', '#37D67A'][i];
      ctx.strokeStyle = lib.pal.ink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(-90, -46, 180, 66, 18);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-46, -86, 108, 48, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = lib.pal.ink;
      ctx.beginPath();
      ctx.arc(-52, 26, 24, 0, Math.PI * 2);
      ctx.arc(52, 26, 24, 0, Math.PI * 2);
      ctx.fill();
      // panic smoke
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(-110, -30, 22, 0, Math.PI * 2);
      ctx.arc(-140, -52, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // foreground buildings (the lemon stands among them)
    const colors = ['#37485C', '#2C3A4C', '#41566E', '#243244'];
    for (let i = 0; i < 7; i++) {
      const w = 180;
      const x = i * 175 - 60 + Math.sin(t * 0.7) * 20;
      lib.building(ctx, x, H * 1.02, w, 300 + lib.hash(i, 51, 1) * 380, colors[i % 4], i + 3);
    }
    ctx.restore();

    // captions
    const c1 = lib.ease.outBack(lib.clamp01(t / 0.25));
    lib.impact(ctx, 'ГИГАНТСКИЙ ЛИМОН', W / 2, H * 0.13, {
      size: 118,
      scale: 1.8 - c1 * 0.8,
      rotate: -0.03,
      fill: lib.pal.lemon,
      maxW: W * 0.9,
    });
    if (t > 1.2) {
      const c2 = lib.ease.outBack(lib.beat(t - 1.2, 1.6));
      lib.impact(ctx, 'ОН В ОГАЙО', W / 2, H * 0.9, {
        size: 140,
        alpha: lib.clamp01((t - 1.2) / 0.2),
        scale: 0.7 + c2 * 0.4,
        fill: lib.pal.red,
        maxW: W * 0.7,
      });
    }
  },
});
